'use strict';
// Every clipboard value and persistence file here is test-owned. The real
// Windows clipboard is never read or written by this suite.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { createClipboardVault, looksSensitive, normaliseFileReferences, parseFileDrop, LIMITS } = require('../electron/native/clipboard-vault.cjs');
const { CHANNELS, registerClipboardIpc } = require('../electron/native/clipboard-ipc.cjs');
const checks = [], vaults = [];
const key = crypto.randomBytes(32);
const safeStorage = {
  isEncryptionAvailable: () => true,
  encryptString(text) { const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', key, iv); return Buffer.concat([iv, cipher.update(text), cipher.final(), cipher.getAuthTag()]); },
  decryptString(buffer) { const cipher = crypto.createDecipheriv('aes-256-gcm', key, buffer.subarray(0, 12)); cipher.setAuthTag(buffer.subarray(-16)); return Buffer.concat([cipher.update(buffer.subarray(12, -16)), cipher.final()]).toString(); },
};
function testClipboard() {
  const state = { text: 'useful fixture phrase', formats: ['text/plain'], image: null, buffer: null, reads: 0, writes: 0 };
  return Object.assign(state, {
    availableFormats: () => { state.reads++; return state.formats; },
    readText: () => { state.reads++; return state.text; },
    readImage: () => { state.reads++; return state.image; },
    readBuffer: () => { state.reads++; return state.buffer; },
    read: () => state.uri,
    writeText: text => { state.writes++; state.text = text; state.formats = ['text/plain']; },
    writeImage: image => { state.writes++; state.image = image; state.formats = ['image/png']; },
    writeBuffer: (format, buffer) => { state.writes++; state.formats = [format]; state.buffer = buffer; },
  });
}
function drop(files) { const header = Buffer.alloc(20); header.writeUInt32LE(20, 0); header.writeUInt32LE(1, 16); return Buffer.concat([header, Buffer.from(`${files.join('\0')}\0\0`, 'utf16le')]); }
function png() { const result = Buffer.alloc(32); Buffer.from('89504e470d0a1a0a', 'hex').copy(result); result.writeUInt32BE(2, 16); result.writeUInt32BE(3, 20); return result; }
(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-clipboard-test-'));
  let clock = Date.now();
  async function make(name, options = {}) {
    const clipboard = options.clipboard || testClipboard();
    const storagePath = path.join(root, name + '.bin');
    const vault = createClipboardVault({ clipboard, safeStorage, nativeImage: { createFromBuffer: data => ({ data, isEmpty: () => false }) }, storagePath, now: () => clock, ...options });
    vaults.push(vault); await vault.init(); return { vault, clipboard, storagePath };
  }
  const first = await make('first');
  await first.vault.list(); await first.vault.poll(); assert.equal(first.clipboard.reads, 0);
  assert.equal(first.vault.status().enabled, false); assert.equal(first.vault.status().monitoring, false);
  checks.push('init, status, list and poll observe no clipboard before opt-in');
  await first.vault.configure({ enabled: true }); await first.vault.poll();
  let listing = await first.vault.list(); assert.equal(listing.items.length, 1);
  const id = listing.items[0].id;
  assert.equal((await first.vault.get(id)).payload.text, first.clipboard.text);
  const encrypted = await fs.readFile(first.storagePath);
  assert.equal(encrypted.includes(Buffer.from(first.clipboard.text)), false);
  assert.equal(encrypted.includes(Buffer.from('preview')), false);
  checks.push('opt-in captures exact text, encrypts payload and metadata');
  await first.vault.poll(); assert.equal((await first.vault.list()).items.length, 1);
  first.clipboard.text = 'another useful phrase'; await first.vault.poll();
  first.clipboard.text = 'useful fixture phrase'; await first.vault.poll();
  assert.equal((await first.vault.list()).items.length, 2);
  checks.push('consecutive and non-consecutive duplicates collapse');
  for (const flag of ['paused', 'privateMode']) {
    await first.vault.configure({ [flag]: true }); const before = first.clipboard.reads; await first.vault.poll(); assert.equal(first.clipboard.reads, before);
    await first.vault.configure({ [flag]: false });
  }
  await first.vault.configure({ enabled: false }); const reads = first.clipboard.reads; await first.vault.poll(); assert.equal(first.clipboard.reads, reads);
  checks.push('pause, private mode and disable perform zero reads');
  await first.vault.configure({ enabled: true });
  for (const text of ['123456', 'password=fixtureOnly', '-----BEGIN PRIVATE KEY-----\nfixture', 'sk-fixture_only_secret_12345']) { first.clipboard.text = text; await first.vault.poll(); }
  assert.equal(first.vault.status().skippedSensitive, 4);
  first.clipboard.text = 'z'.repeat(LIMITS.textBytes + 1); await first.vault.poll(); assert.equal(first.vault.status().skippedOversize, 1);
  checks.push('OTP/key/password heuristics and oversized payloads are skipped');
  assert.equal(looksSensitive('normal words with punctuation!'), false);
  await first.vault.pin(id, true);
  assert.equal((await first.vault.list({ query: 'useful fixture', type: 'text', pinnedOnly: true })).items[0].id, id);
  await first.vault.copyBack(id); const copies = first.clipboard.writes; assert.equal(first.clipboard.text, 'useful fixture phrase');
  await first.vault.poll(); assert.equal(first.clipboard.writes, copies);
  first.clipboard.text = 'unrelated copy immediately after copy back'; await first.vault.poll();
  assert((await first.vault.list()).items.some(item => item.preview === first.clipboard.text));
  checks.push('pin/search/filter/copy-back work; unrelated next clipboard is not suppressed');
  await first.vault.dispose();
  const restart = await make('first');
  assert.equal(restart.vault.status().enabled, false); assert.equal(restart.clipboard.reads, 0);
  assert((await restart.vault.list()).items.some(item => item.id === id && item.pinned));
  clock += 15 * 86400000;
  assert.deepEqual((await restart.vault.list()).items.map(item => item.id), [id]);
  checks.push('encrypted restart preserves pins/history and never resumes consent; age retention prunes unpinned items');
  await restart.vault.remove(id); assert.equal((await restart.vault.list()).items.length, 0);
  await assert.rejects(restart.vault.get(id), { code: 'CLIPBOARD_ITEM_MISSING' });
  await assert.rejects(restart.vault.list({ query: 'x'.repeat(201) }), { code: 'CLIPBOARD_QUERY_INVALID' });
  for (const request of [{ command: 'arbitrary' }, { enabled: 'yes' }, { retentionDays: 0 }, { maxItems: 1 }, { captureFiles: null }]) assert.throws(() => restart.vault.configure(request), { code: 'CLIPBOARD_POLICY_INVALID' });
  checks.push('missing item and malformed requests are rejected');
  const bounded = await make('bounded'); await bounded.vault.configure({ enabled: true, maxItems: 10 });
  for (let i = 0; i < 12; i++) { bounded.clipboard.text = `bounded fixture item ${i}`; await bounded.vault.poll(); }
  listing = await bounded.vault.list(); assert.equal(listing.items.length, 10);
  for (const item of listing.items) await bounded.vault.pin(item.id, true);
  bounded.clipboard.text = 'cannot evict a pinned history'; await bounded.vault.poll(); assert.equal((await bounded.vault.list()).items.length, 10);
  assert.equal((await bounded.vault.list()).items.some(item => item.preview === bounded.clipboard.text), false);
  checks.push('count cap is enforced and pinned entries are not silently evicted');
  const memory = await make('memory', { safeStorage: { isEncryptionAvailable: () => false } });
  await memory.vault.configure({ enabled: true }); await memory.vault.poll();
  assert.equal(memory.vault.status().storageMode, 'memory-only'); await assert.rejects(fs.stat(memory.storagePath), { code: 'ENOENT' });
  const insecure = await make('basic', { safeStorage: { ...safeStorage, getSelectedStorageBackend: () => 'basic_text' } });
  await insecure.vault.configure({ enabled: true }); await insecure.vault.poll(); await assert.rejects(fs.stat(insecure.storagePath), { code: 'ENOENT' });
  checks.push('encryption unavailable/basic_text fallback never persists plaintext');
  const locked = await make('locked'); await locked.vault.configure({ enabled: true }); await locked.vault.poll(); await locked.vault.dispose();
  const original = await fs.readFile(locked.storagePath);
  const failedDecrypt = await make('locked', { safeStorage: { ...safeStorage, decryptString: () => { throw Error('secret provider error'); } } });
  assert.equal(failedDecrypt.vault.status().storageMode, 'locked'); await assert.rejects(failedDecrypt.vault.configure({ enabled: true }), { code: 'CLIPBOARD_STORE_LOCKED' });
  assert.deepEqual(await fs.readFile(locked.storagePath), original);
  await failedDecrypt.vault.clear(); await assert.rejects(fs.stat(locked.storagePath), { code: 'ENOENT' });
  checks.push('failed decryption preserves original bytes until explicit discard');
  const bad = await make('corrupt'); await fs.writeFile(bad.storagePath, 'corrupt fixture bytes'); await bad.vault.dispose();
  const corrupt = await make('corrupt'); assert.equal(corrupt.vault.status().storageMode, 'locked'); assert.equal(await fs.readFile(bad.storagePath, 'utf8'), 'corrupt fixture bytes');
  checks.push('corruption is reported and never overwritten');
  const atomic = await make('atomic'); await atomic.vault.configure({ enabled: true }); await atomic.vault.poll(); await atomic.vault.dispose();
  const atomicBefore = await fs.readFile(atomic.storagePath);
  const failingWrite = await make('atomic', { io: { ...fs, rename: async () => { throw Object.assign(Error('locked fixture'), { code: 'EBUSY' }); } } });
  await failingWrite.vault.configure({ enabled: true }); failingWrite.clipboard.text = 'new pending atomic phrase'; await failingWrite.vault.poll();
  assert.equal(failingWrite.vault.status().storageError, 'CLIPBOARD_PERSIST_FAILED'); assert.equal(failingWrite.vault.status().pendingPersistence, true);
  assert.deepEqual(await fs.readFile(atomic.storagePath), atomicBefore); assert.equal((await fs.readdir(root)).some(name => name.endsWith('.tmp')), false);
  checks.push('failed atomic rename keeps prior ciphertext, removes only own temporary file and reports pending memory state');
  const media = await make('media'); await media.vault.configure({ enabled: true });
  media.clipboard.formats = ['image/png']; media.clipboard.image = { isEmpty: () => false, getSize: () => ({ width: 2, height: 3 }), toPNG: png };
  await media.vault.poll(); listing = await media.vault.list({ type: 'image' }); assert.equal(listing.items.length, 1); await media.vault.copyBack(listing.items[0].id);
  assert.equal(media.clipboard.writes, 1);
  const fileRefs = ['C:\\Fixtures\\ملف.txt', '\\\\server\\fixture\\two.txt'];
  media.clipboard.formats = ['CF_HDROP']; media.clipboard.buffer = drop(fileRefs); await media.vault.poll();
  listing = await media.vault.list({ type: 'files' }); assert.equal(listing.items.length, 1); await media.vault.copyBack(listing.items[0].id);
  assert.deepEqual(parseFileDrop(media.clipboard.buffer), fileRefs);
  assert.equal(media.clipboard.text, fileRefs.join('\r\n'));
  assert.deepEqual(normaliseFileReferences(['file:///C:/Fixtures/a%20b.txt']), ['C:\\Fixtures\\a b.txt']);
  assert.throws(() => normaliseFileReferences(['relative.txt'])); assert.throws(() => parseFileDrop(Buffer.alloc(24)));
  await media.vault.configure({ captureImages: false, captureFiles: false }); media.clipboard.formats = ['CF_HDROP']; media.clipboard.text = ''; const previousCount = media.vault.status().count; await media.vault.poll(); assert.equal(media.vault.status().count, previousCount);
  checks.push('image round-trip, DROPFILES parsing, file-path text copy-back, literal Unicode paths, format opt-outs and invalid DROPFILES');
  let release, readStarted;
  const started = new Promise(resolve => { readStarted = resolve; });
  const raceClipboard = testClipboard(); raceClipboard.readText = () => { readStarted(); return new Promise(resolve => { release = resolve; }); };
  const race = await make('race', { clipboard: raceClipboard }); await race.vault.configure({ enabled: true }); const capturing = race.vault.poll(); await started;
  const revoking = race.vault.configure({ enabled: false }); release('pending text must not be captured'); await capturing; await revoking;
  assert.equal((await race.vault.list()).items.length, 0);
  checks.push('revocation cancels an in-flight asynchronous clipboard read');
  const handlers = new Map(); let consent = false, prompts = 0;
  registerClipboardIpc({ ipcMain: { handle: (name, handler) => handlers.set(name, handler) }, getVault: () => restart.vault, assertSender: event => { if (!event.trusted) throw Object.assign(Error('secret sender'), { code: 'UNTRUSTED_SENDER' }); }, confirm: async () => { prompts++; return consent; } });
  for (const handler of handlers.values()) { const result = await handler({ trusted: false }); assert.equal(result.error.code, 'UNTRUSTED_SENDER'); assert(!JSON.stringify(result).includes('secret sender')); }
  assert.equal(prompts, 0);
  let result = await handlers.get(CHANNELS.clipboardConfigure)({ trusted: true }, { enabled: true }); assert.equal(result.error.code, 'CLIPBOARD_CONSENT_CANCELLED'); assert.equal(restart.vault.status().enabled, false);
  consent = true; result = await handlers.get(CHANNELS.clipboardConfigure)({ trusted: true }, { enabled: true }); assert.equal(result.data.enabled, true);
  result = await handlers.get(CHANNELS.clipboardStatus)({ trusted: true }, { unexpected: true }); assert.equal(result.error.code, 'CLIPBOARD_INPUT_INVALID');
  result = await handlers.get(CHANNELS.clipboardList)({ trusted: true }, { path: 'C:\\owner' }); assert.equal(result.error.code, 'CLIPBOARD_INPUT_INVALID');
  consent = false; result = await handlers.get(CHANNELS.clipboardClear)({ trusted: true }); assert.equal(result.error.code, 'CLIPBOARD_CONSENT_CANCELLED');
  checks.push('all eight IPC endpoints reject untrusted senders; native cancellation, exact arity and allowlisted fields are enforced');
  for (const vault of vaults) await vault.dispose();
  console.log(JSON.stringify({ status: 'PASS', checks, fixture: root, personalClipboardAccess: false }, null, 2));
})().catch(async error => { for (const vault of vaults) await vault.dispose(); console.error(error); process.exitCode = 1; });
