'use strict';
// Adapted from the read-only legacy donor's opt-in vault contract. Unlike the
// donor, every byte on disk (including previews) is encrypted, writes are
// serialized and atomic, and a broken/unreadable store cannot be overwritten.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { fileURLToPath } = require('node:url');
const MAGIC = Buffer.from('KNOUX-CLIPBOARD-V1\n');
const LIMITS = Object.freeze({ textBytes: 1024 * 1024, imageBytes: 4 * 1024 * 1024, totalBytes: 32 * 1024 * 1024, files: 200, storeBytes: 48 * 1024 * 1024 });
const DEFAULTS = Object.freeze({ maxItems: 200, retentionDays: 14, captureImages: true, captureFiles: true });
const fault = code => Object.assign(new Error(code), { code });

function looksSensitive(text) {
  const value = text.trim();
  if (/-----BEGIN .*PRIVATE KEY-----|(?:password|passwd|api[_-]?key|secret|access[_-]?token)\s*[:=]\s*\S+/i.test(value)) return true;
  if (/^\d{4,8}$/.test(value) || /^(?:sk-|ghp_|github_pat_|AKIA|eyJ)[A-Za-z0-9_.-]{12,}/.test(value)) return true;
  if (value.length < 12 || value.length > 256 || /\s/.test(value) || /^(https?|file):\/\//i.test(value) || /^[a-z]:[\\/]/i.test(value) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return false;
  return [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter(pattern => pattern.test(value)).length >= 3;
}

function normaliseFileReferences(list) {
  if (!Array.isArray(list) || list.length > LIMITS.files) throw fault('CLIPBOARD_FILES_LIMIT');
  const files = [];
  for (let value of list) {
    if (typeof value !== 'string' || value.length > 32767 || value.includes('\0')) throw fault('CLIPBOARD_FILE_INVALID');
    value = value.trim();
    if (!value || value.startsWith('#')) continue;
    if (/^file:/i.test(value)) {
      const url = new URL(value);
      value = url.hostname ? `\\\\${url.hostname}${decodeURIComponent(url.pathname).replace(/\//g, '\\')}` : fileURLToPath(url, { windows: true });
    }
    value = value.replace(/\//g, '\\');
    if (!/^(?:[A-Za-z]:\\|\\\\[^\\]+\\[^\\]+)/.test(value) || /^\\\\[?.]\\/.test(value)) throw fault('CLIPBOARD_FILE_INVALID');
    if (!files.includes(value)) files.push(value);
  }
  return files;
}

function parseFileDrop(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 24 || buffer.length > LIMITS.textBytes) throw fault('CLIPBOARD_DROP_INVALID');
  const offset = buffer.readUInt32LE(0);
  if (offset < 20 || offset >= buffer.length || buffer.readUInt32LE(16) !== 1 || (buffer.length - offset) % 2) throw fault('CLIPBOARD_DROP_INVALID');
  const text = buffer.subarray(offset).toString('utf16le');
  if (!text.endsWith('\0\0')) throw fault('CLIPBOARD_DROP_INVALID');
  return normaliseFileReferences(text.slice(0, -2).split('\0'));
}

function createClipboardVault({ clipboard, nativeImage, safeStorage, storagePath, now = () => Date.now(), io = fs, pollIntervalMs = 1200 } = {}) {
  let items = [], policy = { ...DEFAULTS }, enabled = false, paused = false, privateMode = false;
  let timer = null, epoch = 0, tail = Promise.resolve(), lastHash = null, blocked = null, dirty = false, disposed = false;
  let encryption = false, storageError = null, skippedSensitive = 0, skippedOversize = 0, readFailures = 0;
  const queue = work => { const result = tail.then(work); tail = result.catch(() => {}); return result; };
  const observing = () => enabled && !paused && !privateMode && !disposed;
  const hash = payload => crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const bytes = payload => Buffer.byteLength(JSON.stringify(payload), 'utf8');
  const storageMode = () => blocked ? 'locked' : storagePath && encryption && !storageError ? 'encrypted' : 'memory-only';
  async function secureAvailable() {
    try {
      if (safeStorage?.getSelectedStorageBackend?.() === 'basic_text') return false;
      return Boolean(safeStorage && (typeof safeStorage.isAsyncEncryptionAvailable === 'function' ? await safeStorage.isAsyncEncryptionAvailable() : safeStorage.isEncryptionAvailable?.()));
    } catch { return false; }
  }
  async function encrypt(text) {
    return Buffer.from(typeof safeStorage.encryptStringAsync === 'function' ? await safeStorage.encryptStringAsync(text) : safeStorage.encryptString(text));
  }
  async function decrypt(buffer) {
    if (typeof safeStorage.decryptStringAsync !== 'function') return safeStorage.decryptString(buffer);
    const result = await safeStorage.decryptStringAsync(buffer);
    return result.result;
  }
  function prune() {
    const before = items.length, cutoff = now() - policy.retentionDays * 86400000;
    items = items.filter(item => item.pinned || Date.parse(item.createdAt) >= cutoff);
    while (items.length > policy.maxItems || items.reduce((sum, item) => sum + item.sizeBytes, 0) > LIMITS.totalBytes) {
      const index = items.findLastIndex(item => !item.pinned);
      if (index < 0) break;
      items.splice(index, 1);
    }
    dirty ||= items.length !== before;
  }
  async function persist() {
    if (!dirty || !storagePath || blocked) return;
    encryption = await secureAvailable();
    if (!encryption) { storageError = 'CLIPBOARD_ENCRYPTION_UNAVAILABLE'; return; }
    const temporary = `${storagePath}.${crypto.randomUUID()}.tmp`;
    let handle;
    try {
      const encrypted = await encrypt(JSON.stringify({ version: 1, policy, items }));
      if (encrypted.length + MAGIC.length > LIMITS.storeBytes) throw fault('CLIPBOARD_STORE_LIMIT');
      await io.mkdir(path.dirname(storagePath), { recursive: true });
      handle = await io.open(temporary, 'wx', 0o600);
      await handle.writeFile(Buffer.concat([MAGIC, encrypted]));
      await handle.sync();
      await handle.close(); handle = null;
      // Never remove the old store, and never use a non-atomic copy fallback.
      await io.rename(temporary, storagePath);
      dirty = false; storageError = null;
    } catch {
      storageError = 'CLIPBOARD_PERSIST_FAILED';
      await handle?.close().catch(() => {});
      await io.unlink(temporary).catch(() => {});
    }
  }
  function status() {
    return { enabled, paused, privateMode, monitoring: observing(), storageMode: storageMode(), storageError, lockedReason: blocked, pendingPersistence: dirty, count: items.length, pinned: items.filter(item => item.pinned).length, storageBytes: items.reduce((sum, item) => sum + item.sizeBytes, 0), skippedSensitive, skippedOversize, readFailures, policy: { ...policy }, limits: LIMITS, sensitiveProtection: 'heuristic-always-on', consent: 'session-only' };
  }
  function validatePolicy(next) {
    if (!next || typeof next !== 'object' || Array.isArray(next) || Object.keys(next).some(key => !['enabled', 'paused', 'privateMode', ...Object.keys(DEFAULTS)].includes(key))) throw fault('CLIPBOARD_POLICY_INVALID');
    for (const key of ['enabled', 'paused', 'privateMode', 'captureImages', 'captureFiles']) if (key in next && typeof next[key] !== 'boolean') throw fault('CLIPBOARD_POLICY_INVALID');
    for (const [key, min, max] of [['maxItems', 10, 500], ['retentionDays', 1, 365]]) if (key in next && (!Number.isInteger(next[key]) || next[key] < min || next[key] > max)) throw fault('CLIPBOARD_POLICY_INVALID');
    if (next.maxItems != null && items.filter(item => item.pinned).length > next.maxItems) throw fault('CLIPBOARD_PINNED_LIMIT');
    return next;
  }
  function validatePayload(payload) {
    if (!payload || !['text', 'image', 'files'].includes(payload.type)) throw fault('CLIPBOARD_PAYLOAD_INVALID');
    if (payload.type === 'text') {
      if (typeof payload.text !== 'string' || !payload.text.length) throw fault('CLIPBOARD_PAYLOAD_INVALID');
      if (Buffer.byteLength(payload.text) > LIMITS.textBytes) throw fault('CLIPBOARD_PAYLOAD_LIMIT');
      return { type: 'text', text: payload.text };
    }
    if (payload.type === 'files') {
      const files = normaliseFileReferences(payload.files);
      if (!files.length || bytes(files) > LIMITS.textBytes) throw fault('CLIPBOARD_PAYLOAD_LIMIT');
      return { type: 'files', files };
    }
    if (typeof payload.image !== 'string' || payload.image.length > Math.ceil(LIMITS.imageBytes / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload.image)) throw fault('CLIPBOARD_PAYLOAD_LIMIT');
    const png = Buffer.from(payload.image, 'base64');
    if (png.length < 24 || png.length > LIMITS.imageBytes || !png.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) throw fault('CLIPBOARD_PAYLOAD_INVALID');
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
    if (!width || !height || width * height > 16000000) throw fault('CLIPBOARD_PAYLOAD_LIMIT');
    return { type: 'image', image: payload.image };
  }
  function publicItem(item, includeContent = false) {
    return { id: item.id, type: item.payload.type, createdAt: item.createdAt, pinned: item.pinned, sizeBytes: item.sizeBytes,
      preview: item.payload.type === 'text' ? item.payload.text.slice(0, 180) : item.payload.type === 'files' ? `${item.payload.files.length} file references` : 'PNG image',
      ...(includeContent ? { payload: item.payload } : {}) };
  }
  async function readClipboard() {
    const formats = clipboard.availableFormats?.() || [];
    if (policy.captureFiles && formats.includes('CF_HDROP')) return { type: 'files', files: parseFileDrop(await clipboard.readBuffer('CF_HDROP')) };
    if (policy.captureFiles && formats.includes('FileNameW')) {
      const buffer = await clipboard.readBuffer('FileNameW');
      if (buffer.length > LIMITS.textBytes || buffer.length % 2) throw fault('CLIPBOARD_PAYLOAD_LIMIT');
      return { type: 'files', files: normaliseFileReferences(buffer.toString('utf16le').replace(/\0+$/, '').split('\0')) };
    }
    if (policy.captureFiles && formats.includes('text/uri-list')) {
      const value = await clipboard.read('text/uri-list');
      if (typeof value === 'string' && Buffer.byteLength(value) <= LIMITS.textBytes) return { type: 'files', files: normaliseFileReferences(value.split(/\r?\n/)) };
    }
    if (policy.captureImages && formats.some(format => /image|png|bitmap|dib/i.test(format))) {
      const image = await clipboard.readImage();
      if (image && !image.isEmpty()) {
        const size = image.getSize();
        if (size.width * size.height > 16000000) throw fault('CLIPBOARD_PAYLOAD_LIMIT');
        const png = image.toPNG();
        if (png.length > LIMITS.imageBytes) throw fault('CLIPBOARD_PAYLOAD_LIMIT');
        return { type: 'image', image: png.toString('base64') };
      }
    }
    const text = await clipboard.readText();
    return text ? { type: 'text', text } : null;
  }
  async function capture() {
    prune();
    if (!observing() || !clipboard) { await persist(); return { stored: false }; }
    const generation = epoch;
    let payload;
    try {
      const read = await readClipboard();
      if (!observing() || generation !== epoch || !read) return { stored: false };
      payload = validatePayload(read);
    } catch (error) {
      if (error.code === 'CLIPBOARD_PAYLOAD_LIMIT') skippedOversize++; else readFailures++;
      return { stored: false };
    }
    const fingerprint = hash(payload);
    if (fingerprint === lastHash) { await persist(); return { stored: false }; }
    lastHash = fingerprint;
    if (payload.type === 'text' && looksSensitive(payload.text)) { skippedSensitive++; return { stored: false }; }
    const existing = items.find(item => hash(item.payload) === fingerprint);
    if (existing) { existing.createdAt = new Date(now()).toISOString(); items = [existing, ...items.filter(item => item !== existing)]; }
    else {
      if (items.filter(item => item.pinned).length >= policy.maxItems) return { stored: false };
      items.unshift({ id: crypto.randomUUID(), createdAt: new Date(now()).toISOString(), pinned: false, sizeBytes: bytes(payload), payload });
    }
    dirty = true; prune(); await persist();
    return { stored: true };
  }
  function updateTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
    if (observing()) {
      timer = setTimeout(() => { timer = null; queue(capture).catch(() => { readFailures++; }).finally(updateTimer); }, Math.max(500, pollIntervalMs));
      timer.unref();
    }
  }
  async function init() {
    encryption = await secureAvailable();
    if (!storagePath) return status();
    try {
      const stat = await io.lstat(storagePath);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > LIMITS.storeBytes) throw fault('CLIPBOARD_STORE_INVALID');
      const stored = await io.readFile(storagePath);
      if (!encryption) { blocked = 'CLIPBOARD_DECRYPT_UNAVAILABLE'; return status(); }
      if (!stored.subarray(0, MAGIC.length).equals(MAGIC)) throw fault('CLIPBOARD_STORE_INVALID');
      const parsed = JSON.parse(await decrypt(stored.subarray(MAGIC.length)));
      if (parsed?.version !== 1 || !Array.isArray(parsed.items) || parsed.items.length > 500) throw fault('CLIPBOARD_STORE_INVALID');
      validatePolicy(parsed.policy); policy = { ...DEFAULTS, ...parsed.policy };
      const ids = new Set();
      const loaded = parsed.items.map(item => {
        if (typeof item.id !== 'string' || !/^[a-f0-9-]{36}$/.test(item.id) || ids.has(item.id) || !Number.isFinite(Date.parse(item.createdAt)) || typeof item.pinned !== 'boolean') throw fault('CLIPBOARD_STORE_INVALID');
        ids.add(item.id);
        const payload = validatePayload(item.payload);
        return { id: item.id, createdAt: item.createdAt, pinned: item.pinned, payload, sizeBytes: bytes(payload) };
      });
      if (loaded.reduce((sum, item) => sum + item.sizeBytes, 0) > LIMITS.totalBytes) throw fault('CLIPBOARD_STORE_INVALID');
      items = loaded; prune(); await persist();
    } catch (error) {
      if (error.code !== 'ENOENT') { items = []; blocked = 'CLIPBOARD_STORE_UNREADABLE'; }
    }
    return status();
  }
  function configure(next) {
    validatePolicy(next);
    // Revoke an in-flight async read immediately, before waiting for the queue.
    epoch++;
    if (next.enabled === false) enabled = false;
    if (next.paused === true) paused = true;
    if (next.privateMode === true) privateMode = true;
    return queue(async () => {
      if (disposed) throw fault('CLIPBOARD_CLOSED');
      if (blocked && next.enabled === true) throw fault('CLIPBOARD_STORE_LOCKED');
      for (const key of Object.keys(DEFAULTS)) if (key in next) policy[key] = next[key];
      if ('enabled' in next) enabled = next.enabled;
      if ('paused' in next) paused = next.paused;
      if ('privateMode' in next) privateMode = next.privateMode;
      lastHash = null; dirty = true; prune(); await persist(); updateTimer(); return status();
    });
  }
  async function list({ query = '', type = 'all', pinnedOnly = false } = {}) {
    if (typeof query !== 'string' || query.length > 200 || !['all', 'text', 'image', 'files'].includes(type) || typeof pinnedOnly !== 'boolean') throw fault('CLIPBOARD_QUERY_INVALID');
    return queue(async () => {
      prune(); await persist(); const needle = query.toLowerCase();
      return { status: status(), items: items.filter(item => (!pinnedOnly || item.pinned) && (type === 'all' || type === item.payload.type) && (!needle || `${item.payload.text || ''} ${(item.payload.files || []).join(' ')}`.toLowerCase().includes(needle))).map(item => publicItem(item)) };
    });
  }
  function getItem(id) {
    if (typeof id !== 'string' || id.length !== 36) throw fault('CLIPBOARD_ITEM_INVALID');
    const item = items.find(item => item.id === id);
    if (!item) throw fault('CLIPBOARD_ITEM_MISSING');
    return item;
  }
  function pin(id, pinned) {
    if (typeof pinned !== 'boolean') throw fault('CLIPBOARD_ITEM_INVALID');
    return queue(async () => { prune(); const item = getItem(id); item.pinned = pinned; dirty = true; await persist(); return publicItem(item); });
  }
  function remove(id) {
    return queue(async () => {
      if (blocked) throw fault('CLIPBOARD_STORE_LOCKED');
      getItem(id); items = items.filter(item => item.id !== id); dirty = true; await persist(); return status();
    });
  }
  function clear() {
    epoch++; enabled = false; updateTimer();
    return queue(async () => {
      // Explicit confirmed discard is the ONLY way to replace an unreadable
      // store. Refuse if persistence cannot be secured; never pretend it cleared.
      if (storagePath) {
        try { await io.unlink(storagePath); } catch (error) { if (error.code !== 'ENOENT') throw fault('CLIPBOARD_CLEAR_FAILED'); }
      }
      items = []; blocked = null; dirty = false; storageError = null; lastHash = null; return status();
    });
  }
  function get(id) { return queue(async () => { prune(); return publicItem(getItem(id), true); }); }
  function copyBack(id) {
    return queue(async () => {
      prune(); const item = getItem(id), payload = item.payload;
      if (!clipboard) throw fault('CLIPBOARD_UNAVAILABLE');
      try {
        if (payload.type === 'text') await clipboard.writeText(payload.text);
        else if (payload.type === 'image') {
          const image = nativeImage.createFromBuffer(Buffer.from(payload.image, 'base64'));
          if (image.isEmpty()) throw fault('CLIPBOARD_IMAGE_INVALID');
          await clipboard.writeImage(image);
        }
      else {
          // Electron raw custom formats do not establish an Explorer file-drop
          // contract. Copy references as honest path text, never pretend that
          // writing a format named CF_HDROP creates a native file operation.
          await clipboard.writeText(payload.files.join('\r\n'));
        }
        lastHash = hash(payload.type === 'files' ? { type: 'text', text: payload.files.join('\r\n') } : payload);
        return { copied: true, id, format: payload.type === 'files' ? 'file-path-text' : payload.type };
      } catch { throw fault('CLIPBOARD_COPY_FAILED'); }
    });
  }
  function dispose() { disposed = true; epoch++; enabled = false; updateTimer(); return tail; }
  return { init, status, validatePolicy, configure, list, get, pin, remove, clear, copyBack, poll: () => queue(capture), dispose };
}

module.exports = { createClipboardVault, looksSensitive, normaliseFileReferences, parseFileDrop, LIMITS };
