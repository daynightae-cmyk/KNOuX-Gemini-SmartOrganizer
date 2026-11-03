'use strict';

/**
 * KNOuX Gemini — AI provider bridge test.
 *
 * Covers the Main-process credential gate end to end without touching a real
 * provider, a real Windows credential store or the owner's files: every network
 * call goes through an injected fetch and every "encrypted" store through an
 * injected cipher into a disposable temp directory.
 *
 * It also asserts the renderer boundary statically, because that is the defect
 * this bridge exists to close: no renderer file may contact a provider, carry a
 * Bearer header, or persist a credential.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const appRoot = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), 'utf8');

const {
  AiBridge,
  PROVIDERS,
  PROVIDER_IDS,
  LIMITS,
  buildUrl,
  clampTimeout,
  normalizeMessages,
  toAnthropicTurns,
  redact,
} = require('../electron/native/ai-bridge.cjs');

const contract = JSON.parse(read('shared/native-contract.json'));
const preload = read('electron/preload.cjs');
const main = read('electron/main.cjs');

const failures = [];
let checks = 0;
const assert = (condition, label) => {
  checks += 1;
  if (!condition) failures.push(label);
};

const FAKE_KEY = 'sk-or-v1-unittest-DO-NOT-LEAK-9f3c2a1b';
const FAKE_OPENAI_KEY = 'sk-proj-unittest-DO-NOT-LEAK-77aa';
const FAKE_ANTHROPIC_KEY = 'sk-ant-unittest-DO-NOT-LEAK-44bb';

function makeTempRoot(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `knoux-ai-${label}-`));
}

/** A cipher that is obviously not encryption; it marks what was handed in. */
function makeSafeStorage({ available = true } = {}) {
  const written = [];
  return {
    written,
    calls: { encrypt: 0, decrypt: 0 },
    isEncryptionAvailable: () => available,
    encryptString: (text) => {
      written.push(text);
      return Buffer.from(`XOR:${Buffer.from(text, 'utf8').toString('base64')}`, 'utf8');
    },
    decryptString: (buffer) => {
      const raw = Buffer.from(String(buffer), 'utf8').toString('utf8');
      if (!raw.startsWith('XOR:')) throw new Error('not our blob');
      return Buffer.from(raw.slice(4), 'base64').toString('utf8');
    },
  };
}

function makeFetch(handler) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return handler(String(url), init, calls.length);
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

async function expectRejection(fn, code, label) {
  checks += 1;
  try {
    await fn();
    failures.push(`${label}: expected rejection ${code}, nothing was thrown`);
    return null;
  } catch (error) {
    if (error?.code !== code) failures.push(`${label}: expected code ${code}, got ${error?.code || error?.message}`);
    return error;
  }
}

function newBridge(options = {}) {
  return new AiBridge({ now: () => Date.parse('2026-11-03T00:00:00Z'), ...options });
}

async function run() {
  /* ------------------------------------------------------------------
   * 1. Provider validation
   * ------------------------------------------------------------------ */
  {
    const bridge = newBridge({ fetchImpl: makeFetch(() => jsonResponse(200, {})) });
    await expectRejection(() => bridge.configure({ provider: 'not-a-provider', apiKey: FAKE_KEY }), 'AI_PROVIDER_UNSUPPORTED', 'unknown provider');
    await expectRejection(() => bridge.configure({ provider: 'openrouter', apiKey: '   ' }), 'AI_KEY_REQUIRED', 'blank key');
    await expectRejection(() => bridge.configure({ provider: 'openrouter', apiKey: 'x'.repeat(LIMITS.MAX_CREDENTIAL_BYTES + 1) }), 'AI_KEY_TOO_LARGE', 'oversized key');
    assert(bridge.fetchImpl.calls.length === 0, 'provider validation must not reach the network');
    assert(PROVIDER_IDS.length === 3 && PROVIDER_IDS.slice().sort().join(',') === 'anthropic,openai,openrouter', `provider table is the three reviewed ids (got ${PROVIDER_IDS.join(',')})`);
    for (const id of PROVIDER_IDS) {
      assert(PROVIDERS[id].host.includes('.') && !PROVIDERS[id].host.includes('://'), `provider ${id} host is a bare hostname`);
    }
  }

  /* ------------------------------------------------------------------
   * 2. Session memory is the default; nothing is written to disk
   * ------------------------------------------------------------------ */
  {
    const root = makeTempRoot('memory');
    const storage = makeSafeStorage();
    const bridge = newBridge({ safeStorage: storage, rootPath: root, fetchImpl: makeFetch(() => jsonResponse(200, {})) });
    const result = await bridge.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
    assert(result.configured === true, 'configure reports the credential was accepted');
    assert(result.persisted === false, 'configure does not persist without an explicit opt-in');
    assert(result.storage === 'session-memory', `default boundary is session memory (got ${result.storage})`);
    assert(storage.calls.encrypt === 0, 'no encryption call without opt-in');
    assert(storage.written.join('|').length === 0, 'no plaintext credential was ever produced');
    assert(fs.readdirSync(root).length === 0, 'no credential file written without opt-in');
    fs.rmSync(root, { recursive: true, force: true });
  }

  /* ------------------------------------------------------------------
   * 3. Explicit opt-in persists through safeStorage, never in plaintext
   * ------------------------------------------------------------------ */
  {
    const root = makeTempRoot('persist');
    const storage = makeSafeStorage();
    const bridge = newBridge({ safeStorage: storage, rootPath: root, fetchImpl: makeFetch(() => jsonResponse(200, {})) });
    const result = await bridge.configure({ provider: 'openai', apiKey: FAKE_OPENAI_KEY, persist: true });
    assert(result.persisted === true, 'explicit opt-in persists when encryption is available');
    assert(result.storage === 'windows-dpapi-safeStorage', `persisted boundary is named (got ${result.storage})`);
    const file = path.join(root, 'ai-credential.bin');
    assert(fs.existsSync(file), 'the opted-in credential file exists');
    const onDisk = fs.readFileSync(file, 'utf8');
    assert(!onDisk.includes(FAKE_OPENAI_KEY), 'the credential file never contains plaintext key material');
    assert(onDisk.startsWith('XOR:'), 'the credential file holds the encrypted blob');

    // A fresh bridge process rehydrates only what the user opted into.
    const restarted = newBridge({ safeStorage: storage, rootPath: root, fetchImpl: makeFetch(() => jsonResponse(200, {})) });
    assert(restarted.getStatus().configured === false, 'a new bridge starts without the credential until restore runs');
    const restored = await restarted.restore();
    assert(restored.restored === true && restored.provider === 'openai', 'restore brings back the opted-in provider');
    assert(restarted.getStatus().configured === true && restarted.getStatus().persisted !== true, 'restored state is reported as configured');
    assert(restarted.getStatus().storage === 'windows-dpapi-safeStorage', 'restored boundary stays encrypted');

    await bridge.clear();
    assert(!fs.existsSync(file), 'clear() deletes the persisted credential');
    assert(bridge.getStatus().configured === false, 'clear() forgets the credential');
    fs.rmSync(root, { recursive: true, force: true });
  }

  /* ------------------------------------------------------------------
   * 4. Persistence is refused when the platform cipher is unavailable
   * ------------------------------------------------------------------ */
  {
    const root = makeTempRoot('nocipher');
    const storage = makeSafeStorage({ available: false });
    const bridge = newBridge({ safeStorage: storage, rootPath: root, fetchImpl: makeFetch(() => jsonResponse(200, {})) });
    const result = await bridge.configure({ provider: 'anthropic', apiKey: FAKE_ANTHROPIC_KEY, persist: true });
    assert(result.persisted === false, 'opt-in cannot persist without an available cipher');
    assert(result.storage === 'session-memory', 'the boundary honestly stays session memory');
    assert(fs.readdirSync(root).length === 0, 'no unencrypted credential file is written');
    const status = bridge.getStatus();
    assert(status.lastError?.code === 'AI_STORAGE_UNAVAILABLE', 'the refusal is surfaced as a typed state');
    assert(status.storageAvailable === false, 'the UI can read that encryption is unavailable');
    fs.rmSync(root, { recursive: true, force: true });
  }

  /* ------------------------------------------------------------------
   * 5. Status never carries credential material
   * ------------------------------------------------------------------ */
  {
    const bridge = newBridge({ fetchImpl: makeFetch(() => jsonResponse(200, {})) });
    await bridge.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
    const status = bridge.getStatus();
    const serialised = JSON.stringify(status);
    assert(!serialised.includes(FAKE_KEY), 'getStatus() output never contains the credential');
    assert(status.keyFingerprint && /^[a-f0-9]{12}$/.test(status.keyFingerprint), 'getStatus() exposes only a truncated fingerprint');
    assert(status.keyFingerprint === crypto.createHash('sha256').update(FAKE_KEY).digest('hex').slice(0, 12), 'fingerprint is the real SHA-256 prefix');
    assert(!('apiKey' in status) && !('secret' in status), 'no credential field exists on the status payload');
  }

  /* ------------------------------------------------------------------
   * 6. Destination comes from the table, per provider auth style
   * ------------------------------------------------------------------ */
  {
    const cases = [
      { provider: 'openrouter', key: FAKE_KEY, verifyUrl: 'https://openrouter.ai/api/v1/auth/key', bearer: true },
      { provider: 'openai', key: FAKE_OPENAI_KEY, verifyUrl: 'https://api.openai.com/v1/models', bearer: true },
      { provider: 'anthropic', key: FAKE_ANTHROPIC_KEY, verifyUrl: 'https://api.anthropic.com/v1/models', bearer: false },
    ];
    for (const item of cases) {
      const fetchImpl = makeFetch(() => jsonResponse(200, { data: [] }));
      const bridge = newBridge({ fetchImpl });
      await bridge.configure({ provider: item.provider, apiKey: item.key });
      const outcome = await bridge.verifyKey({});
      assert(outcome.verified === true, `${item.provider}: verification succeeds on the allowlisted route`);
      const call = fetchImpl.calls[0];
      assert(call.url === item.verifyUrl, `${item.provider}: verify uses exactly ${item.verifyUrl} (got ${call.url})`);
      assert(call.init.method === 'GET', `${item.provider}: verify is a GET`);
      if (item.bearer) {
        assert(call.init.headers.Authorization === `Bearer ${item.key}`, `${item.provider}: bearer authorization is set in Main`);
        assert(!('x-api-key' in call.init.headers), `${item.provider}: bearer providers do not send x-api-key`);
      } else {
        assert(call.init.headers['x-api-key'] === item.key, `${item.provider}: x-api-key authorization is set in Main`);
        assert(call.init.headers['anthropic-version'] === '2023-06-01', `${item.provider}: anthropic version header is pinned`);
        assert(!('Authorization' in call.init.headers), `${item.provider}: x-api-key providers do not also send Authorization`);
      }
      assert(call.init.signal && typeof call.init.signal.addEventListener === 'function', `${item.provider}: request carries an abort signal`);
    }
  }

  /* ------------------------------------------------------------------
   * 7. Completions: shape, bounding and model allowlist
   * ------------------------------------------------------------------ */
  {
    const fetchImpl = makeFetch(() => jsonResponse(200, { choices: [{ message: { content: 'Organize first, delete never.' } }], usage: { total_tokens: 7 } }));
    const bridge = newBridge({ fetchImpl });
    await bridge.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
    const outcome = await bridge.complete({ messages: [{ role: 'user', content: 'hello' }], model: 'gpt-4o' });
    assert(outcome.ok === true && outcome.text === 'Organize first, delete never.', 'openrouter completion returns provider text');
    assert(outcome.status === 200 && outcome.usage?.total_tokens === 7, 'completion reports measured status and usage');
    assert(outcome.model === 'anthropic/claude-3.5-sonnet', 'an unlisted model falls back to the reviewed default');
    const sent = JSON.parse(fetchImpl.calls[0].init.body);
    assert(fetchImpl.calls[0].url === 'https://openrouter.ai/api/v1/chat/completions', 'completion route is fixed');
    assert(sent.messages[0].role === 'system' && sent.stream === false, 'a single system turn is added and streaming stays off');
    assert(sent.temperature === 0.7 && sent.max_tokens === LIMITS.DEFAULT_MAX_TOKENS, 'temperature and token budget are bounded defaults');
    assert(sent.max_tokens <= LIMITS.MAX_MAX_TOKENS, 'token budget cannot exceed the cap');

    const oversized = 'x'.repeat(LIMITS.MAX_MESSAGE_CHARS + 1);
    const before = fetchImpl.calls.length;
    await expectRejection(() => bridge.complete({ messages: [{ role: 'user', content: oversized }] }), 'AI_INPUT_TOO_LARGE', 'oversized message');
    assert(fetchImpl.calls.length === before, 'an oversized prompt is refused before any network call');
    await expectRejection(() => bridge.complete({ messages: [] }), 'AI_INPUT_INVALID', 'empty history');
    await expectRejection(() => bridge.complete({}), 'AI_INPUT_INVALID', 'missing history');
    await expectRejection(() => bridge.complete({ messages: Array.from({ length: LIMITS.MAX_MESSAGES + 1 }, (_, i) => ({ role: 'user', content: `m${i}` })) }), 'AI_INPUT_INVALID', 'too many messages');
    const trimmed = normalizeMessages({ messages: [{ role: 'user', content: 'y'.repeat(3900) }, { role: 'user', content: 'z'.repeat(3900) }, { role: 'user', content: 'w'.repeat(3900) }, { role: 'user', content: 'v'.repeat(3900) }, { role: 'user', content: 'u'.repeat(3900) }, { role: 'user', content: 't'.repeat(3900) }] });
    assert(trimmed.messages.length < 6, `over-long histories are trimmed from the front (${trimmed.messages.length} kept)`);
    assert(normalizeMessages({ messages: [{ role: 'hacker', content: 'x' }] }).messages[0].role === 'user', 'an unknown role degrades to user');
  }

  /* ------------------------------------------------------------------
   * 8. Anthropic completion shape
   * ------------------------------------------------------------------ */
  {
    const fetchImpl = makeFetch(() => jsonResponse(200, { content: [{ type: 'text', text: 'First part.' }, { type: 'thinking', text: 'ignore' }, { type: 'text', text: 'Second part.' }] }));
    const bridge = newBridge({ fetchImpl });
    await bridge.configure({ provider: 'anthropic', apiKey: FAKE_ANTHROPIC_KEY });
    const outcome = await bridge.complete({ messages: [{ role: 'system', content: 'be brief' }, { role: 'user', content: 'hi' }] });
    assert(outcome.ok === true && outcome.text === 'First part.\nSecond part.', 'anthropic text blocks are joined and non-text blocks dropped');
    const sent = JSON.parse(fetchImpl.calls[0].init.body);
    assert(fetchImpl.calls[0].url === 'https://api.anthropic.com/v1/messages', 'anthropic route is fixed');
    assert(sent.system === 'be brief', 'anthropic takes system as a top-level field');
    assert(sent.messages.every((m) => m.role !== 'system'), 'anthropic messages never carry a system role');
    assert(fetchImpl.calls[0].init.headers['x-api-key'] === FAKE_ANTHROPIC_KEY, 'anthropic completion authenticates with x-api-key');
  }

  /* ------------------------------------------------------------------
   * 9. Redaction: a provider that echoes the key cannot leak it
   * ------------------------------------------------------------------ */
  {
    const fetchImpl = makeFetch(() => jsonResponse(401, { error: { message: `invalid key ${FAKE_KEY} supplied` } }));
    const bridge = newBridge({ fetchImpl });
    await bridge.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
    const outcome = await bridge.complete({ messages: [{ role: 'user', content: 'hi' }] });
    assert(outcome.ok === false && outcome.error?.code === 'AI_PROVIDER_ERROR', 'a 401 becomes a typed provider error');
    assert(!JSON.stringify(outcome).includes(FAKE_KEY), 'the echoed credential is stripped from the result');
    assert(outcome.error.message.includes('[redacted]'), 'the message shows an explicit redaction marker');
    assert(!JSON.stringify(bridge.getStatus()).includes(FAKE_KEY), 'the stored lastError stays redacted');

    const rejected = makeFetch(() => jsonResponse(403, { error: { message: `bearer ${FAKE_KEY} forbidden` } }));
    const bridge2 = newBridge({ fetchImpl: rejected });
    await bridge2.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
    const verify = await bridge2.verifyKey({});
    assert(verify.verified === false && verify.error?.code === 'AI_KEY_REJECTED', 'verify reports a rejection instead of a false success');
    assert(!JSON.stringify(verify).includes(FAKE_KEY), 'verify rejection never echoes the credential');

    assert(redact(`key=sk-ant-abcdefghijklmnop`) === 'key=[redacted]', 'redact strips an anthropic-shaped key');
    assert(redact(`Authorization: Bearer abcdefghijklmnop`).includes('Bearer [redacted]'), 'redact strips a bearer value');
  }

  /* ------------------------------------------------------------------
   * 10. Timeout, cancellation and in-flight bounds
   * ------------------------------------------------------------------ */
  {
    const hanging = makeFetch((url, init) => new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const bridge = newBridge({ fetchImpl: hanging });
    await bridge.configure({ provider: 'openai', apiKey: FAKE_OPENAI_KEY });

    const timedOut = await expectRejection(() => bridge.complete({ messages: [{ role: 'user', content: 'hang' }], timeoutMs: 1 }), 'AI_TIMEOUT', 'timeout');
    assert(timedOut?.retryable === true, 'a timeout is marked retryable');
    assert(clampTimeout(1) === LIMITS.MIN_TIMEOUT_MS && clampTimeout(9e9) === LIMITS.MAX_TIMEOUT_MS && clampTimeout('nope') === LIMITS.DEFAULT_TIMEOUT_MS, 'timeout is clamped into the reviewed band');

    const pending = bridge.complete({ messages: [{ role: 'user', content: 'hang' }], timeoutMs: 60000 });
    await new Promise((resolve) => setImmediate(resolve));
    assert(bridge.getStatus().inFlight === 1, 'in-flight count is measured, not guessed');
    const cancel = bridge.cancelAll();
    assert(cancel.cancelled === 1, 'cancelAll reports how many requests it aborted');
    await expectRejection(() => pending, 'AI_TIMEOUT', 'cancelled request settles as aborted');
    assert(bridge.getStatus().inFlight === 0, 'the in-flight ledger drains');

    // Concurrency cap: four hanging requests, the fifth is refused locally.
    const busyBridge = newBridge({ fetchImpl: hanging });
    await busyBridge.configure({ provider: 'openai', apiKey: FAKE_OPENAI_KEY });
    const started = Array.from({ length: LIMITS.MAX_IN_FLIGHT }, () => busyBridge.complete({ messages: [{ role: 'user', content: 'hang' }], timeoutMs: 60000 }).catch((e) => e));
    await new Promise((resolve) => setImmediate(resolve));
    const overflow = await busyBridge.complete({ messages: [{ role: 'user', content: 'one more' }] }).then(() => null, (e) => e);
    assert(overflow?.code === 'AI_BUSY', 'the in-flight cap refuses additional requests instead of queueing them');
    busyBridge.cancelAll();
    await Promise.all(started);
  }

  /* ------------------------------------------------------------------
   * 11. Response bound, empty response and transport failure
   * ------------------------------------------------------------------ */
  {
    const huge = makeFetch(() => jsonResponse(200, { choices: [{ message: { content: 'x'.repeat(LIMITS.MAX_RESPONSE_BYTES + 10) } }] }));
    const bridge = newBridge({ fetchImpl: huge });
    await bridge.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
    await expectRejection(() => bridge.complete({ messages: [{ role: 'user', content: 'hi' }] }), 'AI_RESPONSE_TOO_LARGE', 'oversized response');

    const empty = newBridge({ fetchImpl: makeFetch(() => jsonResponse(200, { choices: [] })) });
    await empty.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
    const emptyOutcome = await empty.complete({ messages: [{ role: 'user', content: 'hi' }] });
    assert(emptyOutcome.ok === false && emptyOutcome.error?.code === 'AI_EMPTY_RESPONSE', 'an empty completion is reported, never invented');

    const broken = newBridge({ fetchImpl: makeFetch(() => { throw new Error('ECONNREFUSED'); }) });
    await broken.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
    await expectRejection(() => broken.complete({ messages: [{ role: 'user', content: 'hi' }] }), 'AI_NETWORK_FAILED', 'transport failure');

    const unconfigured = newBridge({ fetchImpl: makeFetch(() => jsonResponse(200, {})) });
    await expectRejection(() => unconfigured.complete({ messages: [{ role: 'user', content: 'hi' }] }), 'AI_NOT_CONFIGURED', 'completion without a credential');
    await expectRejection(() => unconfigured.verifyKey({}), 'AI_NOT_CONFIGURED', 'verify without a credential');

    const malformed = newBridge({ fetchImpl: makeFetch(() => ({ ok: true, status: 200, text: async () => 'not json at all' })) });
    await malformed.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
    const malformedOutcome = await malformed.complete({ messages: [{ role: 'user', content: 'hi' }] });
    assert(malformedOutcome.ok === false, 'a non-JSON provider body is a failure, not a fabricated answer');
  }

  /* ------------------------------------------------------------------
   * 12. Destination allowlist cannot be steered
   * ------------------------------------------------------------------ */
  {
    const original = PROVIDERS.openrouter.host;
    const tampered = { id: 'openrouter', host: 'good.example.com/evil', verify: { path: '/api/v1/auth/key' } };
    checks += 1;
    try {
      buildUrl(tampered, { path: '/api/v1/auth/key' });
      failures.push('buildUrl accepted a host/hostname mismatch');
    } catch (error) {
      assert(error.code === 'AI_DESTINATION_REJECTED', 'buildUrl rejects a host that does not match its own entry');
    }
    assert(PROVIDERS.openrouter.host === original, 'the provider table was not mutated by the check');
    const injected = makeFetch(() => jsonResponse(200, { choices: [{ message: { content: 'ok' } }] }));
    const bridge = newBridge({ fetchImpl: injected });
    await bridge.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
    // A caller that smuggles url/host/headers is ignored: the route is internal.
    await bridge.complete({ messages: [{ role: 'user', content: 'hi' }], url: 'https://evil.example.com/steal', host: 'evil.example.com', headers: { Authorization: `Bearer ${FAKE_KEY}` } });
    assert(injected.calls[0].url === 'https://openrouter.ai/api/v1/chat/completions', 'a caller-supplied url/host is ignored');
    assert(injected.calls[0].init.headers.Authorization === `Bearer ${FAKE_KEY}`, 'a caller-supplied header block is ignored in favour of the table');

    // Anthropic rejects an assistant-first conversation; the bridge trims it.
    const trimmedTurns = toAnthropicTurns([{ role: 'assistant', content: 'greeting' }, { role: 'assistant', content: 'second' }, { role: 'user', content: 'real question' }]);
    assert(trimmedTurns.length === 1 && trimmedTurns[0].role === 'user', 'leading assistant turns are trimmed for Anthropic');
    assert(toAnthropicTurns([{ role: 'system', content: 's' }, { role: 'user', content: 'u' }]).every((t) => t.role !== 'system'), 'no system role survives in Anthropic messages');
  }

  /* ------------------------------------------------------------------
   * 13. Startup restore hardening
   * ------------------------------------------------------------------ */
  {
    const root = makeTempRoot('corrupt');
    const storage = makeSafeStorage();
    const dir = path.join(root, 'ai-credential.bin');
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(dir, 'garbage-not-a-blob');
    const bridge = newBridge({ safeStorage: storage, rootPath: root, fetchImpl: makeFetch(() => jsonResponse(200, {})) });
    const outcome = await bridge.restore();
    assert(outcome.restored === false && outcome.reason === 'corrupt', 'an unreadable credential store is refused, not crash-loaded');
    assert(bridge.lastError?.code === 'AI_STORE_CORRUPT', 'corruption is reported with a typed code');
    assert(bridge.getStatus().configured === false, 'a corrupt store leaves the bridge unconfigured');

    fs.writeFileSync(path.join(root, 'ai-credential.bin'), storage.encryptString(JSON.stringify({ v: 1, provider: 'openai', apiKey: FAKE_OPENAI_KEY })));
    const ok2 = await bridge.restore();
    assert(ok2.restored === true && ok2.provider === 'openai', 'a valid store restores the reviewed provider');
    const wrongProvider = newBridge({ safeStorage: makeSafeStorage(), rootPath: null, fetchImpl: makeFetch(() => jsonResponse(200, {})) });
    assert((await wrongProvider.restore()).restored === false, 'a bridge without a store path cannot restore');
    fs.rmSync(root, { recursive: true, force: true });
  }

  /* ------------------------------------------------------------------
   * 14. IPC contract mirror
   * ------------------------------------------------------------------ */
  {
    const aiChannels = ['aiStatus', 'aiConfigure', 'aiClear', 'aiVerify', 'aiComplete', 'aiCancel'];
    for (const name of aiChannels) {
      assert(typeof contract.channels[name] === 'string' && contract.channels[name].startsWith('knoux:ai:v1:'), `contract declares ${name}`);
      assert(preload.includes(contract.channels[name]), `preload mirrors ${name}`);
      assert(main.includes(`contract.channels.${name}`), `main registers a handler for ${name}`);
    }
    for (const id of ['ai.status', 'ai.configure', 'ai.clear', 'ai.verify', 'ai.complete', 'ai.cancel']) {
      assert(contract.capabilities[id], `capability ${id} is declared`);
      assert(['read-only', 'user-initiated'].includes(contract.capabilities[id]?.mode), `capability ${id} has a reviewed permission mode`);
    }
    assert(contract.capabilities['ai.status'].mode === 'read-only', 'ai.status is read-only');
    assert(contract.capabilities['ai.configure'].mode === 'user-initiated', 'handing a credential to Main is user-initiated');
    assert(!Object.keys(contract.capabilities).some((id) => /^ai\.(shell|exec|system|run|delete)/i.test(id)), 'the AI contract exposes no OS execution capability');
    assert(/exposeInMainWorld\(\s*'knouxAiV1'/.test(preload), 'preload exposes the fixed AI namespace');
    assert((preload.match(/exposeInMainWorld\(\s*'knouxAiV1'/g) || []).length === 1,
      'the AI namespace is exposed once after integration; duplicate exposure breaks Electron preload');
    const aiBlock = preload.slice(preload.indexOf("'knouxAiV1'"), preload.indexOf("'knouxShell'"));
    assert(!/ipcRenderer\.on\(/.test(aiBlock), 'the AI namespace opens no event stream');
    assert(!aiBlock.includes('ipcRenderer.invoke(' + '"' ) && (aiBlock.match(/ipcRenderer\.invoke\(CHANNELS\./g) || []).length === 6, 'the AI namespace only invokes the six fixed channels');
    assert(!/\burl\b|\bhost\b|\bendpoint\b|\bheaders\b/.test(aiBlock), 'the AI preload surface accepts no destination field');
    assert(main.includes('AI_DESTINATION_OVERRIDE_FORBIDDEN'), 'main refuses a payload that names a destination');
    assert(main.includes('FORBIDDEN_AI_KEYS'), 'main keeps an explicit destination-override denylist');
    assert(main.includes('assertTrustedSender') && main.includes("aiGuard(contract.channels.aiStatus, 'ai.status', 'read-only'"), 'AI endpoints run behind the trusted-sender guard');
    assert(main.includes('redactSecret'), 'main redacts before an error crosses IPC');
  }

  /* ------------------------------------------------------------------
   * 15. Renderer boundary — the defect this bridge closes
   * ------------------------------------------------------------------ */
  {
    const offenders = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;
        const text = fs.readFileSync(full, 'utf8');
        const relative = path.relative(appRoot, full);
        // Only real credential/network construction counts. Human-facing UI
        // copy legitimately says "Authorization required" and must not trip this.
        if (/openrouter\.ai|api\.openai\.com|api\.anthropic\.com/.test(text)) offenders.push(`${relative}: contacts a provider host`);
        if (/[Aa]uthorization\s*[:=]\s*[`'"]/.test(text)) offenders.push(`${relative}: builds an authorization header`);
        if (/headers\s*:\s*\{[^}]{0,120}[Aa]uthorization/.test(text)) offenders.push(`${relative}: sets an authorization header`);
        if (/Bearer\s*[\`${]/.test(text)) offenders.push(`${relative}: interpolates a bearer token`);
        if (/\bfetch\s*\(/.test(text)) offenders.push(`${relative}: performs a direct network fetch`);
        if (/XMLHttpRequest|navigator\.sendBeacon/.test(text)) offenders.push(`${relative}: uses an alternate network primitive`);
        if (/knoux_ai_api_key|knoux_ai_provider/.test(text)) offenders.push(`${relative}: persists a credential key name`);
        if (/localStorage\.[a-zA-Z]+\(\s*['"`][^'"`]*(api|key|token|credential|secret)/i.test(text)) offenders.push(`${relative}: writes credential-shaped storage`);
      }
    };
    walk(path.join(appRoot, 'src'));
    assert(offenders.length === 0, `renderer has no direct provider network or credential path (${offenders.join(' | ')})`);

    const sessionSource = read('src/lib/ai-session.ts');
    assert(!/localStorage|sessionStorage|indexedDB/.test(sessionSource), 'the AI session mirror has no storage call at all');
    assert(!/apiKey\s*:\s*string/.test(sessionSource), 'the AI session mirror does not type a credential field');
    const clientSource = read('src/lib/ai-bridge.ts');
    assert(!/localStorage|sessionStorage/.test(clientSource), 'the AI bridge client has no storage call');
    assert(clientSource.includes('AI_BRIDGE_UNAVAILABLE'), 'a browser preview is told the bridge is unavailable');
    assert(clientSource.includes('contractVersion'), 'the client validates the contract version');
    const profileSource = read('src/settings/profile.ts');
    assert(!/apiKey/.test(profileSource), 'the settings profile carries no credential field');
  }

  const receipt = {
    ok: failures.length === 0,
    checks,
    providers: PROVIDER_IDS,
    channels: aiReceiptChannels(),
    limits: { maxMessages: LIMITS.MAX_MESSAGES, maxResponseBytes: LIMITS.MAX_RESPONSE_BYTES, maxInFlight: LIMITS.MAX_IN_FLIGHT },
    failures,
  };
  console.log(JSON.stringify(receipt, null, 2));
  if (!receipt.ok) process.exit(1);
  console.log('[ai-bridge] PASS');
}

function aiReceiptChannels() {
  return Object.entries(contract.channels).filter(([, value]) => value.startsWith('knoux:ai:v1:')).map(([key]) => key);
}

run().catch((error) => {
  console.error('[ai-bridge] harness failure:', error?.stack || error);
  process.exit(1);
});
