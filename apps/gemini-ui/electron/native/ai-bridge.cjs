'use strict';

/**
 * KNOuX Gemini — Main-process AI provider bridge.
 *
 * Why this module exists
 * ----------------------
 * The renderer previously held the provider credential in page memory and made
 * its own `fetch()` to the provider with an `Authorization: Bearer` header
 * (Settings, the key modal and the assistant chat). That is the wrong boundary:
 * a browser-context credential can be read by any renderer-side defect, it is
 * visible to renderer devtools, it bypasses the sender guard, and it lets the
 * renderer choose an arbitrary network destination.
 *
 * This bridge moves the whole credential + network path into the Electron Main
 * process and reuses the same architecture the Google Workspace bridge already
 * proved: a fixed operation set, a hard-coded HTTPS destination allowlist, a
 * bounded request with an AbortController timeout, DPAPI-backed optional
 * persistence through `safeStorage`, and redacted, envelope-shaped results.
 *
 * Guarantees this module is responsible for
 * -----------------------------------------
 * 1. The renderer never supplies a URL, host, path or header. Only a provider
 *    id chosen from PROVIDERS and a bounded prompt payload are accepted; the
 *    destination comes from the internal table and nowhere else.
 * 2. Credential material never leaves Main. `getStatus()` reports a truncated
 *    SHA-256 fingerprint, never the secret.
 * 3. Persistence is opt-in. Without an explicit `persist: true` AND an
 *    available `safeStorage`, the key lives in Main memory only and is gone on
 *    quit. Nothing is written to localStorage, preferences or the profile.
 * 4. Every provider message, error string and thrown value passes through
 *    `redact()` so an echoing provider or a stack trace cannot smuggle the key
 *    back into the renderer or into a log.
 * 5. There is no shell, no child process, no filesystem read of user data and
 *    no arbitrary request body. AI cannot perform OS actions through here.
 */

const crypto = require('node:crypto');
const fsp = require('node:fs/promises');
const path = require('node:path');

const CONTRACT_VERSION = 1;

/* Fixed provider table. `host` is the only value that may ever become a
   network destination, and it is pinned to HTTPS. */
const PROVIDERS = Object.freeze({
  openrouter: Object.freeze({
    id: 'openrouter',
    label: 'OpenRouter',
    host: 'openrouter.ai',
    authStyle: 'bearer',
    verify: Object.freeze({ method: 'GET', path: '/api/v1/auth/key', shape: 'openai-key' }),
    complete: Object.freeze({ method: 'POST', path: '/api/v1/chat/completions', shape: 'openai' }),
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: Object.freeze(['anthropic/claude-3.5-sonnet', 'gpt-4o-mini']),
    staticHeaders: Object.freeze({ 'X-Title': 'KNOuX SmartOrganizer' }),
  }),
  openai: Object.freeze({
    id: 'openai',
    label: 'OpenAI',
    host: 'api.openai.com',
    authStyle: 'bearer',
    verify: Object.freeze({ method: 'GET', path: '/v1/models', shape: 'openai-models' }),
    complete: Object.freeze({ method: 'POST', path: '/v1/chat/completions', shape: 'openai' }),
    defaultModel: 'gpt-4o-mini',
    models: Object.freeze(['gpt-4o-mini', 'gpt-4o']),
    staticHeaders: Object.freeze({}),
  }),
  anthropic: Object.freeze({
    id: 'anthropic',
    label: 'Anthropic',
    host: 'api.anthropic.com',
    authStyle: 'x-api-key',
    verify: Object.freeze({ method: 'GET', path: '/v1/models', shape: 'anthropic-models' }),
    complete: Object.freeze({ method: 'POST', path: '/v1/messages', shape: 'anthropic' }),
    defaultModel: 'claude-3-5-sonnet-latest',
    models: Object.freeze(['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest']),
    staticHeaders: Object.freeze({ 'anthropic-version': '2023-06-01' }),
  }),
});

const PROVIDER_IDS = Object.freeze(Object.keys(PROVIDERS));

const LIMITS = Object.freeze({
  MAX_MESSAGES: 24,
  MAX_MESSAGE_CHARS: 4000,
  MAX_TOTAL_CHARS: 16000,
  MAX_SYSTEM_CHARS: 2000,
  MAX_RESPONSE_BYTES: 256 * 1024,
  MAX_CREDENTIAL_BYTES: 8 * 1024,
  MAX_STORE_BYTES: 16 * 1024,
  MAX_IN_FLIGHT: 4,
  DEFAULT_TIMEOUT_MS: 45000,
  MIN_TIMEOUT_MS: 1000,
  MAX_TIMEOUT_MS: 120000,
  DEFAULT_MAX_TOKENS: 1024,
  MAX_MAX_TOKENS: 4096,
});

const ROLES = new Set(['system', 'user', 'assistant']);

const SYSTEM_PROMPT =
  'You are KNOuX AI Copilot, an expert Windows system organizer and diagnostic assistant embedded inside KNOuX SmartOrganizer. Help the user manage apps, files, storage, cleanup, startup, and services. Never claim to have changed a file, setting or account unless a KNOuX tool receipt says so.';

function aiError(code, message, retryable = false) {
  const error = new Error(message);
  error.code = code;
  error.retryable = retryable;
  return error;
}

function clampTimeout(value) {
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return LIMITS.DEFAULT_TIMEOUT_MS;
  return Math.min(LIMITS.MAX_TIMEOUT_MS, Math.max(LIMITS.MIN_TIMEOUT_MS, Math.round(raw)));
}

/**
 * Replace the live credential and any obvious provider key shape with a fixed
 * marker. Applied to every string that can leave this module.
 */
function redact(text, secrets = []) {
  if (text == null) return '';
  let out = String(text);
  for (const secret of secrets) {
    if (typeof secret === 'string' && secret.length >= 6) out = out.split(secret).join('[redacted]');
  }
  return out
    .replace(/sk-ant-[A-Za-z0-9_-]{6,}/g, '[redacted]')
    .replace(/sk-or-[A-Za-z0-9_-]{6,}/g, '[redacted]')
    .replace(/sk-[A-Za-z0-9_-]{6,}/g, '[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, 'Bearer [redacted]')
    .replace(/(api[_-]?key|x-api-key|authorization["'\s:=]+)[A-Za-z0-9._~+/=-]{8,}/gi, '$1[redacted]')
    .slice(0, 300);
}

function fingerprint(secret) {
  if (!secret) return null;
  return crypto.createHash('sha256').update(String(secret)).digest('hex').slice(0, 12);
}

function resolveProvider(value) {
  if (!PROVIDER_IDS.includes(value)) {
    throw aiError('AI_PROVIDER_UNSUPPORTED', `The AI provider "${String(value).slice(0, 40)}" is not supported.`);
  }
  return PROVIDERS[value];
}

function resolveModel(provider, requested) {
  if (typeof requested !== 'string' || !requested) return provider.defaultModel;
  if (provider.models.includes(requested)) return requested;
  return provider.defaultModel;
}

function buildUrl(provider, route) {
  const url = new URL(`https://${provider.host}${route.path}`);
  // Defence in depth: the table is fixed, but never let a crafted entry escape.
  if (url.hostname !== provider.host || url.protocol !== 'https:') {
    throw aiError('AI_DESTINATION_REJECTED', 'The AI request destination was rejected by the allowlist.');
  }
  return url;
}

function authHeaders(provider, secret) {
  if (provider.authStyle === 'x-api-key') return { 'x-api-key': secret };
  return { Authorization: `Bearer ${secret}` };
}

function normalizeMessages(payload) {
  const raw = Array.isArray(payload?.messages) ? payload.messages : null;
  if (!raw) throw aiError('AI_INPUT_INVALID', 'An array of chat messages is required.');
  if (raw.length === 0 || raw.length > LIMITS.MAX_MESSAGES) {
    throw aiError('AI_INPUT_INVALID', `Between 1 and ${LIMITS.MAX_MESSAGES} messages are allowed.`);
  }
  let total = 0;
  let systemFromHistory = '';
  const turns = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') throw aiError('AI_INPUT_INVALID', `Message ${index + 1} is malformed.`);
    const content = typeof entry.content === 'string' ? entry.content.trim() : '';
    if (!content) throw aiError('AI_INPUT_INVALID', `Message ${index + 1} is empty.`);
    if (content.length > LIMITS.MAX_MESSAGE_CHARS) {
      throw aiError('AI_INPUT_TOO_LARGE', `Message ${index + 1} exceeds ${LIMITS.MAX_MESSAGE_CHARS} characters.`);
    }
    // A conversation may carry its own system turn. Hoist it into the single
    // provider system field instead of sending two system messages.
    if (entry.role === 'system') {
      systemFromHistory = content.slice(0, LIMITS.MAX_SYSTEM_CHARS);
      return;
    }
    const role = ROLES.has(entry.role) ? entry.role : 'user';
    total += content.length;
    turns.push({ role, content });
  });
  if (turns.length === 0) throw aiError('AI_INPUT_INVALID', 'At least one user or assistant turn is required.');
  // The provider only ever needs the newest turns; trim from the front.
  while (turns.length > 1 && total > LIMITS.MAX_TOTAL_CHARS) {
    total -= turns[0].content.length;
    turns.shift();
  }
  const system = typeof payload?.system === 'string' && payload.system.trim()
    ? payload.system.trim().slice(0, LIMITS.MAX_SYSTEM_CHARS)
    : (systemFromHistory || SYSTEM_PROMPT);
  return { system, messages: turns };
}

/**
 * Anthropic rejects a conversation that opens with an assistant turn, and it
 * does not accept a system role inside `messages`. Trim the leading assistant
 * turns so the request is well-formed instead of a guaranteed 400.
 */
function toAnthropicTurns(messages) {
  const turns = messages.filter((entry) => entry.role !== 'system');
  while (turns.length > 1 && turns[0].role === 'assistant') turns.shift();
  return turns.map((entry) => ({ role: entry.role === 'assistant' ? 'assistant' : 'user', content: entry.content }));
}

async function readBounded(response, maxBytes) {
  const text = typeof response.text === 'function' ? await response.text() : '';
  if (typeof text === 'string' && Buffer.byteLength(text, 'utf8') > maxBytes) {
    throw aiError('AI_RESPONSE_TOO_LARGE', 'The provider response exceeded the bounded size.', false);
  }
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  return { status: response.status, ok: Boolean(response.ok), body };
}

function extractText(shape, body) {
  if (!body || typeof body !== 'object') return null;
  if (shape === 'openai') {
    const choice = Array.isArray(body.choices) ? body.choices[0] : null;
    const content = choice?.message?.content;
    return typeof content === 'string' && content.trim() ? content.trim() : null;
  }
  if (shape === 'anthropic') {
    const parts = Array.isArray(body.content) ? body.content : [];
    const text = parts.filter((part) => part?.type === 'text' && typeof part.text === 'string').map((part) => part.text).join('\n').trim();
    return text || null;
  }
  return null;
}

function extractProviderError(shape, body, status) {
  const raw =
    (typeof body?.error?.message === 'string' && body.error.message) ||
    (typeof body?.message === 'string' && body.message) ||
    (typeof body?.error === 'string' && body.error) ||
    null;
  return `The provider rejected the request (${status}). ${raw || 'No detail was returned.'}`;
}

function summarizeKeyProbe(shape, body) {
  if (!body || typeof body !== 'object') return null;
  if (shape === 'openai-key') {
    const data = body.data && typeof body.data === 'object' ? body.data : {};
    return {
      label: typeof data.label === 'string' ? data.label.slice(0, 120) : null,
      limit: typeof data.limit === 'number' ? data.limit : null,
      usage: typeof data.usage === 'number' ? data.usage : null,
      isFreeTier: typeof data.is_free_tier === 'boolean' ? data.is_free_tier : null,
    };
  }
  if (shape === 'openai-models' || shape === 'anthropic-models') {
    const list = Array.isArray(body.data) ? body.data : [];
    return { modelCount: list.length };
  }
  return null;
}

class AiBridge {
  constructor(options = {}) {
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.safeStorage = options.safeStorage || null;
    this.now = options.now || (() => Date.now());
    this.isPackaged = Boolean(options.isPackaged);
    this.rootPath = options.rootPath || null;
    this.secret = '';
    this.providerId = PROVIDER_IDS.includes(options.defaultProvider) ? options.defaultProvider : 'openrouter';
    this.persisted = false;
    this.inFlight = new Map();
    this.lastError = null;
    this.lastVerifiedAt = null;
    this.requestSeq = 0;
    if (typeof this.fetchImpl !== 'function') {
      throw aiError('AI_FETCH_UNAVAILABLE', 'The Main process has no network implementation for AI requests.');
    }
  }

  /** Strip the live credential from any string before it can leave Main. */
  redactSecret(text) {
    return redact(text, [this.secret]);
  }

  storageAvailable() {
    try {
      return Boolean(this.safeStorage && typeof this.safeStorage.isEncryptionAvailable === 'function' && this.safeStorage.isEncryptionAvailable());
    } catch {
      return false;
    }
  }

  storePath() {
    if (!this.rootPath) return null;
    return path.join(this.rootPath, 'ai-credential.bin');
  }

  /**
   * Session memory is the default. A permanent copy needs BOTH an explicit
   * user opt-in flag and an available encryption service; otherwise the
   * request is served but the boundary is reported honestly.
   */
  async configure({ provider, apiKey, persist = false } = {}) {
    const target = resolveProvider(provider);
    const secret = typeof apiKey === 'string' ? apiKey.trim() : '';
    if (!secret) throw aiError('AI_KEY_REQUIRED', 'An AI provider key is required.');
    if (secret.length > LIMITS.MAX_CREDENTIAL_BYTES) {
      throw aiError('AI_KEY_TOO_LARGE', 'The AI provider key is unrealistically large.');
    }
    this.secret = secret;
    this.providerId = target.id;
    this.persisted = false;
    let persisted = false;
    if (persist === true) {
      if (!this.storageAvailable()) {
        this.lastError = { code: 'AI_STORAGE_UNAVAILABLE', message: 'Windows credential encryption is not available, so the key stays in session memory.', retryable: false };
      } else {
        await this.saveToDisk(secret, target.id);
        persisted = true;
      }
    }
    this.persisted = persisted;
    return { provider: target.id, configured: true, persisted, storage: this.storageLabel() };
  }

  storageLabel() {
    if (this.persisted) return 'windows-dpapi-safeStorage';
    return this.secret ? 'session-memory' : 'empty';
  }

  async saveToDisk(secret, providerId) {
    const filePath = this.storePath();
    if (!filePath) throw aiError('AI_STORAGE_UNAVAILABLE', 'The Main process has no credential directory.');
    const payload = JSON.stringify({ v: CONTRACT_VERSION, provider: providerId, apiKey: secret });
    const encrypted = this.safeStorage.encryptString(payload);
    await fsp.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
    const temporary = `${filePath}.${crypto.randomBytes(6).toString('hex')}.tmp`;
    await fsp.writeFile(temporary, encrypted, { mode: 0o600 });
    await fsp.rename(temporary, filePath);
    try {
      await fsp.chmod(filePath, 0o600);
    } catch {
      // Windows inherits the per-user application directory ACL.
    }
  }

  /** Restore a previously opted-in credential at startup. Never auto-runs. */
  async restore() {
    const filePath = this.storePath();
    if (!filePath || !this.storageAvailable()) {
      return { restored: false, reason: 'storage-unavailable' };
    }
    let stats;
    try {
      stats = await fsp.lstat(filePath);
    } catch {
      return { restored: false, reason: 'no-credential' };
    }
    if (!stats.isFile() || !stats.size || stats.size > LIMITS.MAX_STORE_BYTES) {
      this.lastError = { code: 'AI_STORE_CORRUPT', message: 'The stored AI credential file is not usable.', retryable: false };
      return { restored: false, reason: 'corrupt' };
    }
    let providerId = null;
    try {
      const plaintext = this.safeStorage.decryptString(await fsp.readFile(filePath));
      const payload = JSON.parse(plaintext);
      if (!payload || typeof payload.apiKey !== 'string' || !payload.apiKey) throw aiError('AI_STORE_CORRUPT', 'bad payload');
      providerId = PROVIDER_IDS.includes(payload.provider) ? payload.provider : 'openrouter';
      this.secret = payload.apiKey;
      this.providerId = providerId;
      this.persisted = true;
    } catch {
      this.lastError = { code: 'AI_STORE_CORRUPT', message: 'The stored AI credential could not be decrypted for this Windows user.', retryable: false };
      return { restored: false, reason: 'corrupt' };
    }
    return { restored: true, provider: providerId };
  }

  /** Forget the credential everywhere: memory, disk and in-flight requests. */
  async clear() {
    for (const controller of this.inFlight.values()) {
      try {
        controller.abort();
      } catch {
        // An abort failure must not keep the credential alive.
      }
    }
    this.inFlight.clear();
    this.secret = '';
    this.persisted = false;
    this.lastVerifiedAt = null;
    this.lastError = null;
    const filePath = this.storePath();
    if (filePath) await fsp.rm(filePath, { force: true }).catch(() => {});
    return { cleared: true, provider: null };
  }

  /** Minimized, secret-free state for the renderer. */
  getStatus() {
    const provider = PROVIDERS[this.providerId];
    return {
      contract: `ai.bridge.v${CONTRACT_VERSION}`,
      configured: Boolean(this.secret),
      provider: provider.id,
      providerLabel: provider.label,
      destination: provider.host,
      keyFingerprint: fingerprint(this.secret),
      storage: this.storageLabel(),
      storageAvailable: this.storageAvailable(),
      models: provider.models,
      defaultModel: provider.defaultModel,
      inFlight: this.inFlight.size,
      lastVerifiedAt: this.lastVerifiedAt,
      lastError: this.lastError ? { ...this.lastError, message: redact(this.lastError.message, [this.secret]) } : null,
      observedAt: new Date(this.now()).toISOString(),
    };
  }

  requestInit(method, headers, body) {
    return { method, headers: { 'content-type': 'application/json', ...headers }, ...(body ? { body } : {}) };
  }

  async runRequest(url, init, timeoutMs) {
    const controller = new AbortController();
    const requestId = `ai-${Date.now().toString(36)}-${(this.requestSeq += 1)}`;
    if (this.inFlight.size >= LIMITS.MAX_IN_FLIGHT) {
      throw aiError('AI_BUSY', 'Too many AI requests are already in flight. Wait for one to finish.', true);
    }
    this.inFlight.set(requestId, controller);
    const timer = setTimeout(() => controller.abort(), clampTimeout(timeoutMs));
    try {
      const response = await this.fetchImpl(url.toString(), { ...init, signal: controller.signal });
      return { response, requestId };
    } catch (error) {
      if (controller.signal.aborted) throw aiError('AI_TIMEOUT', 'The AI provider request timed out or was cancelled.', true);
      throw aiError('AI_NETWORK_FAILED', redact(error?.message || 'The AI provider request could not be completed.', [this.secret]), true);
    } finally {
      clearTimeout(timer);
      this.inFlight.delete(requestId);
    }
  }

  /** Read-only credential probe against the provider's own verification route. */
  async verifyKey(request = {}) {
    if (!this.secret) throw aiError('AI_NOT_CONFIGURED', 'Connect an AI provider key first.', false);
    const provider = resolveProvider(this.providerId);
    const url = buildUrl(provider, provider.verify);
    const init = this.requestInit(provider.verify.method, { ...authHeaders(provider, this.secret), ...provider.staticHeaders });
    const { response } = await this.runRequest(url, init, request.timeoutMs);
    const parsed = await readBounded(response, LIMITS.MAX_RESPONSE_BYTES);
    if (!parsed.ok) {
      const message = redact(extractProviderError(provider.verify.shape, parsed.body, parsed.status), [this.secret]);
      this.lastError = { code: 'AI_KEY_REJECTED', message, retryable: parsed.status >= 500 };
      return { verified: false, status: parsed.status, detail: null, error: this.lastError };
    }
    this.lastVerifiedAt = new Date(this.now()).toISOString();
    this.lastError = null;
    return { verified: true, status: parsed.status, detail: summarizeKeyProbe(provider.verify.shape, parsed.body), observedAt: this.lastVerifiedAt };
  }

  /** One bounded chat completion. The response text is redacted before return. */
  async complete(request = {}) {
    if (!this.secret) throw aiError('AI_NOT_CONFIGURED', 'Connect an AI provider key first.', false);
    const provider = resolveProvider(this.providerId);
    const { system, messages } = normalizeMessages(request);
    const model = resolveModel(provider, request.model);
    const maxTokens = Math.min(LIMITS.MAX_MAX_TOKENS, Math.max(1, Number(request.maxTokens) || LIMITS.DEFAULT_MAX_TOKENS));
    const url = buildUrl(provider, provider.complete);

    const body =
      provider.complete.shape === 'anthropic'
        ? { model, max_tokens: maxTokens, system, messages: toAnthropicTurns(messages), stream: false }
        : { model, max_tokens: maxTokens, temperature: 0.7, messages: [{ role: 'system', content: system }, ...messages], stream: false };

    const init = this.requestInit(provider.complete.method, { ...authHeaders(provider, this.secret), ...provider.staticHeaders }, JSON.stringify(body));
    const { response, requestId } = await this.runRequest(url, init, request.timeoutMs);
    const parsed = await readBounded(response, LIMITS.MAX_RESPONSE_BYTES);
    if (!parsed.ok) {
      const message = redact(extractProviderError(provider.complete.shape, parsed.body, parsed.status), [this.secret]);
      this.lastError = { code: 'AI_PROVIDER_ERROR', message, retryable: parsed.status >= 500 };
      return { ok: false, text: null, model, status: parsed.status, requestId, error: this.lastError };
    }
    const text = extractText(provider.complete.shape, parsed.body);
    if (!text) {
      this.lastError = { code: 'AI_EMPTY_RESPONSE', message: 'The provider returned an empty completion.', retryable: true };
      return { ok: false, text: null, model, status: parsed.status, requestId, error: this.lastError };
    }
    this.lastError = null;
    return {
      ok: true,
      text: redact(text, [this.secret]),
      model,
      provider: provider.id,
      status: parsed.status,
      requestId,
      usage: parsed.body?.usage && typeof parsed.body.usage === 'object' ? parsed.body.usage : null,
      observedAt: new Date(this.now()).toISOString(),
    };
  }

  cancel(requestId) {
    const controller = typeof requestId === 'string' ? this.inFlight.get(requestId) : null;
    if (!controller) return { cancelled: false, reason: 'unknown-request' };
    try {
      controller.abort();
    } catch {
      // The request is already gone from the map in the finally block.
    }
    return { cancelled: true, reason: null };
  }

  cancelAll() {
    const count = this.inFlight.size;
    for (const controller of this.inFlight.values()) {
      try {
        controller.abort();
      } catch {
        // Ignore; the map is cleared below regardless.
      }
    }
    this.inFlight.clear();
    return { cancelled: count };
  }
}

module.exports = {
  CONTRACT_VERSION,
  PROVIDERS,
  PROVIDER_IDS,
  LIMITS,
  SYSTEM_PROMPT,
  AiBridge,
  redact,
  fingerprint,
  resolveProvider,
  buildUrl,
  authHeaders,
  normalizeMessages,
  toAnthropicTurns,
  extractText,
  clampTimeout,
};
