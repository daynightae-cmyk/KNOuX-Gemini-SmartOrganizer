'use strict';

/**
 * KNOuX Gemini — real-Electron AI bridge probe.
 *
 * This is not the full platform smoke. It launches the real Electron main
 * process, with the real Windows `safeStorage` (DPAPI) and a disposable
 * per-process userData directory, and exercises only the AI provider bridge:
 * module load under Electron, session-memory default, the explicit opt-in
 * persistence round trip, the restart restore, redaction, cancellation, and the
 * exact request shape that would go to a provider.
 *
 * No live provider key is used and no real provider is contacted: the network
 * implementation is injected. The point of this probe is the native runtime
 * layer (Electron main + DPAPI + IPC-shaped envelopes), which a plain Node test
 * cannot reach.
 *
 *   npx electron scripts/ai-electron-probe.cjs --receipt=<path>
 */

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const crypto = require('node:crypto');

const { app, safeStorage } = require('electron');
const { AiBridge, LIMITS, PROVIDER_IDS } = require('../electron/native/ai-bridge.cjs');

const argv = process.argv.slice(1);
const argValue = (name) => {
  const prefix = `--${name}=`;
  const hit = argv.find((entry) => entry.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
};
const receiptPath = argValue('receipt');
const profilePath = argValue('profile') || path.join(os.tmpdir(), `knoux-ai-probe-${process.pid}`);

const failures = [];
const checks = [];
const check = (label, condition, detail) => {
  checks.push({ label, ok: Boolean(condition), ...(detail === undefined ? {} : { detail }) });
  if (!condition) failures.push(label);
};

const FAKE_KEY = 'sk-or-v1-electron-probe-NOT-A-REAL-KEY-1b2c3d';

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) };
}

function makeFetch(handler) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return handler(url, init);
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

async function main() {
  fs.mkdirSync(profilePath, { recursive: true });
  app.setPath('userData', profilePath);

  const report = {
    schema: 'knoux.ai-bridge-electron-probe.v1',
    startedAt: new Date().toISOString(),
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
    platform: process.platform,
    packaged: app.isPackaged,
    userData: profilePath.replace(os.homedir(), '<home>'),
    providers: PROVIDER_IDS,
  };

  // ---- real DPAPI availability -------------------------------------------
  const encryptionAvailable = (() => {
    try {
      return Boolean(safeStorage && typeof safeStorage.isEncryptionAvailable === 'function' && safeStorage.isEncryptionAvailable());
    } catch (error) {
      return { error: String(error?.message || error) };
    }
  })();
  report.safeStoragePresent = Boolean(safeStorage);
  report.dpapiEncryptionAvailable = encryptionAvailable === true;
  check('Electron exposes safeStorage', report.safeStoragePresent === true);
  check('Windows DPAPI encryption is actually available in this runtime', encryptionAvailable === true, encryptionAvailable === true ? undefined : String(encryptionAvailable));

  // ---- session memory default -------------------------------------------
  const rootPath = path.join(profilePath, 'ai-bridge-v1');
  const fetchImpl = makeFetch(() => jsonResponse(200, { data: { label: 'probe', usage: 0, limit: null, is_free_tier: false } }));
  const bridge = new AiBridge({ safeStorage, rootPath, fetchImpl, isPackaged: app.isPackaged });

  const memory = await bridge.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
  check('configure accepts the credential in Main', memory.configured === true);
  check('no opt-in means nothing is written to disk', memory.persisted === false && memory.storage === 'session-memory');
  check('the credential directory stays empty without opt-in', !fs.existsSync(path.join(rootPath, 'ai-credential.bin')));

  const status = bridge.getStatus();
  report.statusShape = { configured: status.configured, storage: status.storage, fingerprint: status.keyFingerprint, destination: status.destination, storageAvailable: status.storageAvailable };
  check('getStatus never returns the credential', !JSON.stringify(status).includes(FAKE_KEY));
  check('getStatus returns a real SHA-256 prefix', status.keyFingerprint === crypto.createHash('sha256').update(FAKE_KEY).digest('hex').slice(0, 12));
  check('the destination is the allowlisted host', status.destination === 'openrouter.ai');

  // ---- real DPAPI persistence round trip ---------------------------------
  const persisted = await bridge.configure({ provider: 'openrouter', apiKey: FAKE_KEY, persist: true });
  const storeFile = path.join(rootPath, 'ai-credential.bin');
  check('explicit opt-in persists through DPAPI', persisted.persisted === true && persisted.storage === 'windows-dpapi-safeStorage');
  check('the credential file exists after opt-in', fs.existsSync(storeFile));
  if (fs.existsSync(storeFile)) {
    const raw = fs.readFileSync(storeFile);
    report.credentialBlobBytes = raw.length;
    check('the on-disk blob never contains the plaintext credential', !raw.includes(FAKE_KEY) && !raw.toString('utf8').includes(FAKE_KEY));
    check('the blob is DPAPI ciphertext, not our marker', !raw.toString('utf8').startsWith('XOR:'));
  }

  const restarted = new AiBridge({ safeStorage, rootPath, fetchImpl: makeFetch(() => jsonResponse(200, {})) });
  check('a fresh Main process starts unconfigured', restarted.getStatus().configured === false);
  const restored = await restarted.restore();
  check('restore rehydrates the opted-in credential', restored.restored === true && restored.provider === 'openrouter');
  check('restored boundary is still encrypted', restarted.getStatus().storage === 'windows-dpapi-safeStorage');
  check('restored fingerprint matches the same credential', restarted.getStatus().keyFingerprint === status.keyFingerprint);

  // ---- request shape through the real runtime ---------------------------
  const verify = await bridge.verifyKey({});
  check('verify reaches the injected provider and succeeds', verify.verified === true);
  const verifyCall = fetchImpl.calls[0];
  report.verifyRequest = { url: verifyCall.url, method: verifyCall.init.method, headerNames: Object.keys(verifyCall.init.headers), hasAbortSignal: Boolean(verifyCall.init.signal) };
  check('verify uses the fixed HTTPS route', verifyCall.url === 'https://openrouter.ai/api/v1/auth/key');
  check('the bearer header is built in Main', verifyCall.init.headers.Authorization === `Bearer ${FAKE_KEY}`);
  check('every request carries an abort signal', Boolean(verifyCall.init.signal));

  const completeFetch = makeFetch(() => jsonResponse(401, { error: { message: `invalid token ${FAKE_KEY}` } }));
  const echoing = new AiBridge({ safeStorage, rootPath, fetchImpl: completeFetch });
  await echoing.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
  const rejected = await echoing.complete({ messages: [{ role: 'user', content: 'probe' }] });
  report.redactedErrorMessage = rejected.error?.message;
  check('a provider error that echoes the key is redacted', rejected.ok === false && !JSON.stringify(rejected).includes(FAKE_KEY));
  check('the redaction marker is visible', String(rejected.error?.message).includes('[redacted]'));

  // ---- cancellation through the real event loop ------------------------
  const hangFetch = makeFetch((url, init) => new Promise((resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  }));
  const cancellable = new AiBridge({ safeStorage, rootPath, fetchImpl: hangFetch });
  await cancellable.configure({ provider: 'openrouter', apiKey: FAKE_KEY });
  const pending = cancellable.complete({ messages: [{ role: 'user', content: 'hang' }], timeoutMs: 60000 }).then(() => 'resolved', (error) => error.code);
  await new Promise((resolve) => setTimeout(resolve, 250));
  check('the request is registered as in-flight', cancellable.getStatus().inFlight === 1);
  const cancel = cancellable.cancelAll();
  check('cancelAll aborts the live request', cancel.cancelled === 1);
  check('the aborted promise settles as a typed timeout', await pending === 'AI_TIMEOUT');
  check('the in-flight ledger drains after cancellation', cancellable.getStatus().inFlight === 0);

  // ---- clear erases everywhere ------------------------------------------
  await bridge.clear();
  check('clear removes the persisted credential file', !fs.existsSync(storeFile));
  check('clear forgets the credential in Main', bridge.getStatus().configured === false);
  check('clear reports the storage boundary as empty', bridge.getStatus().storage === 'empty');

  report.limits = { maxMessages: LIMITS.MAX_MESSAGES, maxResponseBytes: LIMITS.MAX_RESPONSE_BYTES };
  report.finishedAt = new Date().toISOString();
  report.checkCount = checks.length;
  report.failures = failures;
  report.ok = failures.length === 0;

  const serialised = JSON.stringify(report, null, 2);
  if (receiptPath) fs.writeFileSync(receiptPath, serialised, 'utf8');
  console.log(serialised);
  app.exit(report.ok ? 0 : 1);
}

app.whenReady().then(main).catch((error) => {
  const text = `[ai-electron-probe] harness failure: ${error?.stack || error?.message || error}`;
  if (receiptPath) fs.writeFileSync(receiptPath, JSON.stringify({ ok: false, error: text }, null, 2), 'utf8');
  console.error(text);
  app.exit(1);
});
