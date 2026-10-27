'use strict';

/**
 * KNOuX Gemini — Google desktop OAuth coordinator (main process only).
 *
 * This module owns the installed-app OAuth client, PKCE verifier, loopback
 * callback, token exchange, encrypted refresh-token storage and read-only
 * Sheets requests. It never exposes a client secret, authorization code,
 * access token or refresh token to the renderer. No request is made until the
 * user invokes the explicit connect/read actions.
 *
 * Windows token storage uses Electron safeStorage, which is backed by DPAPI.
 * The encrypted blob lives under the app userData directory; the client JSON
 * is read from KNOUX_GOOGLE_OAUTH_CLIENT_PATH or a private userData path.
 */

const fsp = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');

const CONTRACT = 'google.oauth.v1';
const GOOGLE = Object.freeze({
  auth: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  revoke: 'https://oauth2.googleapis.com/revoke',
  userinfo: 'https://openidconnect.googleapis.com/v1/userinfo',
  sheets: 'https://sheets.googleapis.com/v4/spreadsheets',
});

const REQUEST_SCOPES = Object.freeze([
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
]);

const REQUIRED_SCOPES = Object.freeze([
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
]);

const DISPLAY_SCOPES = Object.freeze([
  'openid',
  'userinfo.email',
  'userinfo.profile',
  'spreadsheets.readonly',
]);

const MAX_CLIENT_BYTES = 128 * 1024;
const MAX_TOKEN_BYTES = 256 * 1024;
const MAX_SHEETS = 10;
const MAX_SHEET_ROWS = 2000;
const MAX_SHEET_COLUMNS = 60;
const DEFAULT_RANGE = 'A1:Z200';
const SHEET_ID_PATTERN = /^[A-Za-z0-9_-]{20,120}$/;
const RANGE_PATTERN = /^[A-Za-z0-9 _.!:$'\\-]{1,160}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function googleError(code, message, retryable = false) {
  const error = new Error(message);
  error.code = code;
  error.retryable = Boolean(retryable);
  return error;
}

function base64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createPkcePair() {
  const verifier = base64Url(crypto.randomBytes(64));
  const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function createState() {
  return base64Url(crypto.randomBytes(32));
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  if (!a.length || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function normalizeGrantedScopes(rawScope) {
  const granted = String(rawScope || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((scope) => {
      if (scope === 'email') return 'https://www.googleapis.com/auth/userinfo.email';
      if (scope === 'profile') return 'https://www.googleapis.com/auth/userinfo.profile';
      return scope;
    });
  return [...new Set(granted)];
}

function missingRequiredScopes(grantedScopes) {
  return REQUIRED_SCOPES.filter((scope) => !grantedScopes.includes(scope));
}

function publicAccount(account) {
  if (!account || typeof account !== 'object') return null;
  const email = typeof account.email === 'string' && EMAIL_PATTERN.test(account.email) ? account.email : null;
  const displayName =
    typeof account.displayName === 'string' && account.displayName.trim()
      ? account.displayName.trim().slice(0, 120)
      : null;
  if (!email && !displayName) return null;
  return { email, displayName: displayName || email };
}

function sanitizeError(error) {
  const code = typeof error?.code === 'string' && /^[A-Z0-9_]{3,64}$/.test(error.code) ? error.code : 'GOOGLE_ERROR';
  const message =
    typeof error?.message === 'string' && error.message
      ? error.message.slice(0, 300)
      : 'The Google operation failed.';
  return { code, message, retryable: Boolean(error?.retryable) };
}

function validateClientDocument(document) {
  if (!document || typeof document !== 'object') {
    throw googleError('GOOGLE_CLIENT_INVALID', 'The Google OAuth client file is not valid JSON.');
  }
  const installed = document.installed;
  if (!installed || typeof installed !== 'object') {
    throw googleError('GOOGLE_CLIENT_DESKTOP_REQUIRED', 'A Google installed/desktop OAuth client is required.');
  }
  const clientId = typeof installed.client_id === 'string' ? installed.client_id.trim() : '';
  const clientSecret = typeof installed.client_secret === 'string' ? installed.client_secret.trim() : '';
  if (!/^[A-Za-z0-9._-]{20,512}$/.test(clientId) || !/^[A-Za-z0-9._-]{8,512}$/.test(clientSecret)) {
    throw googleError('GOOGLE_CLIENT_INVALID', 'The Google OAuth client file is missing a usable desktop client id or secret.');
  }
  const allowedAuthUris = new Set([
    GOOGLE.auth,
    'https://accounts.google.com/o/oauth2/auth',
  ]);
  if (installed.auth_uri && !allowedAuthUris.has(installed.auth_uri)) {
    throw googleError('GOOGLE_CLIENT_INVALID', 'The Google OAuth client auth endpoint is not the documented endpoint.');
  }
  if (installed.token_uri && installed.token_uri !== GOOGLE.token) {
    throw googleError('GOOGLE_CLIENT_INVALID', 'The Google OAuth client token endpoint is not the documented endpoint.');
  }
  const redirects = Array.isArray(installed.redirect_uris) ? installed.redirect_uris : [];
  const loopback = redirects.some((entry) => {
    try {
      const value = new URL(String(entry));
      return value.protocol === 'http:' && (value.hostname === 'localhost' || value.hostname === '127.0.0.1');
    } catch {
      return false;
    }
  });
  if (!loopback) {
    throw googleError('GOOGLE_REDIRECT_MISSING', 'The Google desktop client has no localhost loopback redirect metadata.');
  }
  return { clientId, clientSecret };
}

function resolveClientPath({ env = process.env, userDataPath }) {
  const explicit = typeof env.KNOUX_GOOGLE_OAUTH_CLIENT_PATH === 'string'
    ? env.KNOUX_GOOGLE_OAUTH_CLIENT_PATH.trim()
    : '';
  if (explicit) return path.resolve(explicit);
  if (userDataPath) return path.join(userDataPath, 'oauth', 'google-desktop-client.json');
  return null;
}

async function loadClientConfig({ env, userDataPath }) {
  const clientPath = resolveClientPath({ env, userDataPath });
  if (!clientPath) {
    throw googleError('GOOGLE_CLIENT_MISSING', 'No Google OAuth client path is configured.');
  }
  let stats;
  try {
    stats = await fsp.lstat(clientPath);
  } catch {
    throw googleError('GOOGLE_CLIENT_MISSING', 'The Google OAuth client file is not available.');
  }
  if (!stats.isFile()) {
    throw googleError('GOOGLE_CLIENT_MISSING', 'The Google OAuth client path is not a regular file.');
  }
  if (!stats.size || stats.size > MAX_CLIENT_BYTES) {
    throw googleError('GOOGLE_CLIENT_INVALID', 'The Google OAuth client file size is outside the accepted range.');
  }
  let raw;
  try {
    raw = await fsp.readFile(clientPath, 'utf8');
  } catch {
    throw googleError('GOOGLE_CLIENT_MISSING', 'The Google OAuth client file could not be read.');
  }
  let document;
  try {
    document = JSON.parse(raw);
  } catch {
    throw googleError('GOOGLE_CLIENT_INVALID', 'The Google OAuth client file is malformed JSON.');
  }
  return validateClientDocument(document);
}

function parseSpreadsheetInput(input) {
  const value = typeof input === 'string' ? input.trim() : '';
  if (!value) throw googleError('GOOGLE_SHEET_ID_INVALID', 'Enter a Google spreadsheet URL or ID.');
  if (SHEET_ID_PATTERN.test(value)) return value;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw googleError('GOOGLE_SHEET_ID_INVALID', 'The spreadsheet value is not a valid ID or docs.google.com URL.');
  }
  if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com') {
    throw googleError('GOOGLE_SHEET_URL_INVALID', 'Only an https://docs.google.com/spreadsheets/... URL is accepted.');
  }
  const match = url.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]{20,120})(?:\/|$)/);
  if (!match || !SHEET_ID_PATTERN.test(match[1])) {
    throw googleError('GOOGLE_SHEET_ID_INVALID', 'The docs.google.com URL does not contain a valid spreadsheet ID.');
  }
  return match[1];
}

function validateRange(range) {
  const value = typeof range === 'string' && range.trim() ? range.trim() : DEFAULT_RANGE;
  if (!RANGE_PATTERN.test(value)) {
    throw googleError('GOOGLE_SHEET_RANGE_INVALID', 'The sheet range contains unsupported characters.');
  }
  return value;
}

async function readJsonResponse(response, maxBytes) {
  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    throw googleError('GOOGLE_RESPONSE_TOO_LARGE', 'The Google response exceeded the bounded size.', false);
  }
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  return { status: response.status, ok: Boolean(response.ok), body };
}

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || 20000));
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw googleError('GOOGLE_NETWORK_TIMEOUT', 'The Google request timed out.', true);
    }
    throw googleError('GOOGLE_NETWORK_FAILED', 'The Google request could not be completed.', true);
  } finally {
    clearTimeout(timer);
  }
}

class TokenVault {
  constructor({ safeStorage, filePath }) {
    this.safeStorage = safeStorage;
    this.filePath = filePath;
  }

  available() {
    try {
      return Boolean(this.safeStorage && this.safeStorage.isEncryptionAvailable());
    } catch {
      return false;
    }
  }

  async load() {
    let stats;
    try {
      stats = await fsp.lstat(this.filePath);
    } catch {
      return null;
    }
    if (!stats.isFile() || !stats.size || stats.size > MAX_TOKEN_BYTES) {
      throw googleError('GOOGLE_TOKEN_STORE_CORRUPT', 'The stored Google credential file is not usable.');
    }
    const encrypted = await fsp.readFile(this.filePath);
    let plaintext;
    try {
      plaintext = this.safeStorage.decryptString(encrypted);
    } catch {
      throw googleError('GOOGLE_TOKEN_STORE_CORRUPT', 'The stored Google credential could not be decrypted for this Windows user.');
    }
    let payload;
    try {
      payload = JSON.parse(plaintext);
    } catch {
      throw googleError('GOOGLE_TOKEN_STORE_CORRUPT', 'The stored Google credential payload is malformed.');
    }
    if (!payload || typeof payload.refreshToken !== 'string' || payload.refreshToken.length < 20) {
      throw googleError('GOOGLE_TOKEN_STORE_CORRUPT', 'The stored Google credential payload is incomplete.');
    }
    return payload;
  }

  async save(payload) {
    await fsp.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    const encrypted = this.safeStorage.encryptString(JSON.stringify(payload));
    const temporary = `${this.filePath}.${crypto.randomBytes(8).toString('hex')}.tmp`;
    await fsp.writeFile(temporary, encrypted, { mode: 0o600 });
    await fsp.rename(temporary, this.filePath);
    try {
      await fsp.chmod(this.filePath, 0o600);
    } catch {
      // Windows ACLs are inherited from the per-user application directory.
    }
  }

  async clear() {
    await fsp.rm(this.filePath, { force: true }).catch(() => {});
  }
}

class SelectionStore {
  constructor({ filePath }) {
    this.filePath = filePath;
    this.ids = [];
  }

  async load() {
    try {
      const stats = await fsp.lstat(this.filePath);
      if (!stats.isFile() || stats.size > 64 * 1024) return [];
      const parsed = JSON.parse(await fsp.readFile(this.filePath, 'utf8'));
      const ids = Array.isArray(parsed?.ids) ? parsed.ids.filter((id) => SHEET_ID_PATTERN.test(String(id))) : [];
      this.ids = [...new Set(ids)].slice(0, MAX_SHEETS);
    } catch {
      this.ids = [];
    }
    return this.ids;
  }

  async save(ids) {
    this.ids = [...new Set(ids.filter((id) => SHEET_ID_PATTERN.test(String(id))))].slice(0, MAX_SHEETS);
    await fsp.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    const temporary = `${this.filePath}.${crypto.randomBytes(8).toString('hex')}.tmp`;
    await fsp.writeFile(temporary, JSON.stringify({ version: 1, ids: this.ids }, null, 2), { mode: 0o600 });
    await fsp.rename(temporary, this.filePath);
  }
}

class GoogleOAuthService {
  constructor(options = {}) {
    this.safeStorage = options.safeStorage || null;
    this.shell = options.shell || null;
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.userDataPath = options.userDataPath || null;
    this.env = options.env || process.env;
    this.now = options.now || (() => Date.now());
    this.connectTimeoutMs = options.connectTimeoutMs || 300000;
    this.requestTimeoutMs = options.requestTimeoutMs || 20000;
    this.allowTestEndpoints = Boolean(options.allowTestEndpoints);
    this.endpoints = {
      auth: GOOGLE.auth,
      token: GOOGLE.token,
      revoke: GOOGLE.revoke,
      userinfo: GOOGLE.userinfo,
      sheets: GOOGLE.sheets,
      ...(options.endpoints || {}),
    };
    const oauthRoot = path.join(this.userDataPath || '', 'oauth');
    this.vault = new TokenVault({ safeStorage: this.safeStorage, filePath: path.join(oauthRoot, 'google-refresh.bin') });
    this.selection = new SelectionStore({ filePath: path.join(oauthRoot, 'selected-sheets.json') });
    this.client = null;
    this.configured = false;
    this.configError = null;
    this.storageAvailable = false;
    this.refreshToken = null;
    this.account = null;
    this.grantedScopes = [];
    this.obtainedAt = null;
    this.connecting = false;
    this.connectAbort = null;
    this.accessToken = null;
    this.accessTokenExpiresAt = 0;
    this.lastError = null;
    this.initialized = false;
    this.updatedAt = new Date(this.now()).toISOString();
  }

  async initialize() {
    if (this.initialized) return this.status();
    this.initialized = true;
    try {
      this.client = await loadClientConfig({ env: this.env, userDataPath: this.userDataPath });
      this.configured = true;
    } catch (error) {
      this.client = null;
      this.configured = false;
      this.configError = sanitizeError(error);
    }
    this.storageAvailable = this.vault.available();
    await this.selection.load();
    if (this.storageAvailable) {
      try {
        const payload = await this.vault.load();
        if (payload) {
          this.refreshToken = payload.refreshToken;
          this.account = publicAccount(payload.account);
          this.grantedScopes = Array.isArray(payload.grantedScopes) ? payload.grantedScopes.map(String) : [];
          this.obtainedAt = typeof payload.obtainedAt === 'string' ? payload.obtainedAt : null;
        }
      } catch (error) {
        this.lastError = sanitizeError(error);
      }
    }
    this.touch();
    return this.status();
  }

  touch() {
    this.updatedAt = new Date(this.now()).toISOString();
  }

  async getStatus() {
    await this.initialize();
    return this.status();
  }

  status() {
    const missingScopes = missingRequiredScopes(this.grantedScopes);
    let connection = 'disconnected';
    if (this.connecting) connection = 'connecting';
    else if (this.refreshToken && this.storageAvailable && missingScopes.length === 0) connection = 'connected';
    else if (this.refreshToken && this.storageAvailable && missingScopes.length > 0) connection = 'permission-missing';
    else if (this.lastError && /^GOOGLE_TOKEN_STORE_/.test(this.lastError.code || '')) connection = 'error';
    return {
      contract: CONTRACT,
      configured: this.configured,
      connection,
      connected: Boolean(this.refreshToken && this.storageAvailable),
      account: this.refreshToken ? this.account : null,
      grantedScopes: DISPLAY_SCOPES.filter((_label, index) => {
        const scope = REQUIRED_SCOPES[index];
        return this.grantedScopes.includes(scope);
      }),
      missingScopes: DISPLAY_SCOPES.filter((_label, index) => {
        const scope = REQUIRED_SCOPES[index];
        return !this.grantedScopes.includes(scope);
      }),
      tokenStorage: this.storageAvailable ? 'windows-dpapi-safeStorage' : 'unavailable',
      storageAvailable: this.storageAvailable,
      selectedSpreadsheetCount: this.selection.ids.length,
      obtainedAt: this.refreshToken ? this.obtainedAt : null,
      lastError: this.configError || this.lastError,
      updatedAt: this.updatedAt,
    };
  }

  async connect() {
    await this.initialize();
    if (this.connecting) {
      throw googleError('GOOGLE_CONNECT_IN_PROGRESS', 'A Google authorization is already in progress.', true);
    }
    if (!this.configured || !this.client) {
      throw googleError(
        this.configError?.code || 'GOOGLE_CLIENT_MISSING',
        this.configError?.message || 'No Google desktop OAuth client is configured.'
      );
    }
    if (!this.storageAvailable) {
      throw googleError('GOOGLE_STORAGE_UNAVAILABLE', 'Windows-protected credential storage is unavailable.', false);
    }
    if (this.refreshToken) {
      this.touch();
      return this.status();
    }
    this.connecting = true;
    this.lastError = null;
    this.touch();
    try {
      const result = await this.runAuthorization();
      this.refreshToken = result.refreshToken;
      this.account = result.account;
      this.grantedScopes = result.grantedScopes;
      this.obtainedAt = new Date(this.now()).toISOString();
      this.accessToken = result.accessToken;
      this.accessTokenExpiresAt = result.expiresAt;
      await this.vault.save({
        version: 1,
        refreshToken: result.refreshToken,
        account: result.account,
        grantedScopes: result.grantedScopes,
        obtainedAt: this.obtainedAt,
      });
      this.connecting = false;
      this.connectAbort = null;
      this.touch();
      return this.status();
    } catch (error) {
      this.connecting = false;
      this.connectAbort = null;
      const sanitized = sanitizeError(error);
      if (sanitized.code !== 'GOOGLE_CONNECT_CANCELLED') this.lastError = sanitized;
      this.touch();
      throw error;
    }
  }

  async cancelConnect() {
    if (!this.connecting || !this.connectAbort) {
      return this.status();
    }
    const abort = this.connectAbort;
    this.connectAbort = null;
    this.connecting = false;
    abort.close();
    abort.reject(googleError('GOOGLE_CONNECT_CANCELLED', 'Google authorization was cancelled.', true));
    this.touch();
    return this.status();
  }

  async runAuthorization() {
    const { verifier, challenge } = createPkcePair();
    const state = createState();
    const server = http.createServer();
    let settled = false;
    let timer = null;
    let resolveCallback;
    let rejectCallback;

    const closeServer = () => {
      if (timer) clearTimeout(timer);
      try {
        server.close();
      } catch {
        // The listener may already be closed after a callback error.
      }
    };

    const callback = new Promise((resolve, reject) => {
      resolveCallback = resolve;
      rejectCallback = reject;
    });

    const fail = (error) => {
      if (settled) return;
      settled = true;
      closeServer();
      rejectCallback(error);
    };

    server.on('request', (request, response) => {
      const headers = {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
        'x-content-type-options': 'nosniff',
      };
      let url;
      try {
        url = new URL(request.url || '/', 'http://127.0.0.1');
      } catch {
        response.writeHead(400, headers).end('Invalid request.');
        return;
      }
      if (url.pathname !== '/oauth2callback') {
        response.writeHead(404, headers).end('Not found.');
        return;
      }
      if (!safeEqual(url.searchParams.get('state'), state)) {
        response.writeHead(400, headers).end('Authorization state did not match. You can close this window.');
        fail(googleError('GOOGLE_STATE_MISMATCH', 'The Google authorization state did not match.', false));
        return;
      }
      const errorCode = url.searchParams.get('error');
      if (errorCode) {
        response.writeHead(400, headers).end('Google authorization was not granted. You can close this window.');
        fail(
          errorCode === 'access_denied'
            ? googleError('GOOGLE_CONSENT_DENIED', 'Google authorization was declined.', true)
            : googleError('GOOGLE_AUTH_ERROR', 'Google authorization returned an error.', false)
        );
        return;
      }
      const code = url.searchParams.get('code');
      if (!code || code.length < 10) {
        response.writeHead(400, headers).end('Authorization code was missing. You can close this window.');
        fail(googleError('GOOGLE_CODE_MISSING', 'The Google authorization code was missing.', false));
        return;
      }
      response.writeHead(200, headers).end(
        '<!doctype html><html><head><meta charset="utf-8"><title>KNOuX Google authorization</title></head><body style="font-family:system-ui;background:#071328;color:#e2e8f0;padding:2rem"><h1 style="font-size:1.1rem">Authorization received</h1><p>You can close this window and return to KNOuX SmartOrganizer.</p></body></html>'
      );
      if (settled) return;
      settled = true;
      closeServer();
      resolveCallback(String(code));
    });

    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen({ host: '127.0.0.1', port: 0, exclusive: true }, () => resolve());
    }).catch(() => {
      throw googleError('GOOGLE_LOOPBACK_UNAVAILABLE', 'The local Google callback listener could not start.', true);
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      closeServer();
      throw googleError('GOOGLE_LOOPBACK_UNAVAILABLE', 'The local Google callback listener has no port.', true);
    }
    const redirectUri = `http://127.0.0.1:${address.port}/oauth2callback`;

    this.connectAbort = {
      close: () => {
        settled = true;
        closeServer();
      },
      reject: (error) => {
        settled = true;
        closeServer();
        rejectCallback(error);
      },
    };

    timer = setTimeout(() => {
      fail(googleError('GOOGLE_CONNECT_TIMEOUT', 'Google authorization timed out before the browser returned.', true));
    }, Math.max(100, Number(this.connectTimeoutMs) || 300000));

    const authUrl = new URL(this.endpoints.auth);
    if (!this.allowTestEndpoints && (authUrl.protocol !== 'https:' || authUrl.hostname !== 'accounts.google.com')) {
      closeServer();
      throw googleError('GOOGLE_AUTH_ENDPOINT_INVALID', 'The Google authorization endpoint is not trusted.', false);
    }
    authUrl.search = new URLSearchParams({
      client_id: this.client.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: REQUEST_SCOPES.join(' '),
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent',
    }).toString();

    if (!this.shell || typeof this.shell.openExternal !== 'function') {
      closeServer();
      throw googleError('GOOGLE_BROWSER_UNAVAILABLE', 'The system browser could not be opened.', false);
    }
    try {
      const opened = await this.shell.openExternal(authUrl.toString());
      if (opened === false) {
        throw googleError('GOOGLE_BROWSER_UNAVAILABLE', 'The system browser did not accept the authorization URL.', true);
      }
    } catch (error) {
      closeServer();
      throw error?.code ? error : googleError('GOOGLE_BROWSER_UNAVAILABLE', 'The system browser could not be opened.', true);
    }

    let code;
    try {
      code = await callback;
    } catch (error) {
      throw error;
    } finally {
      closeServer();
    }

    const tokenBody = new URLSearchParams({
      code,
      client_id: this.client.clientId,
      client_secret: this.client.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    });
    const response = await fetchWithTimeout(
      this.fetchImpl,
      this.endpoints.token,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        body: tokenBody.toString(),
      },
      this.requestTimeoutMs
    );
    const tokenResult = await readJsonResponse(response, 256 * 1024);
    if (!tokenResult.ok || !tokenResult.body) {
      if (tokenResult.body?.error === 'invalid_grant') {
        throw googleError('GOOGLE_TOKEN_REJECTED', 'Google rejected the authorization code. Start a new connection.', true);
      }
      throw googleError('GOOGLE_TOKEN_EXCHANGE_FAILED', 'Google did not return an authorization token.', true);
    }
    const body = tokenResult.body;
    const accessToken = typeof body.access_token === 'string' ? body.access_token : '';
    const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : '';
    const tokenType = typeof body.token_type === 'string' ? body.token_type : '';
    if (!accessToken || tokenType.toLowerCase() !== 'bearer') {
      throw googleError('GOOGLE_TOKEN_INVALID', 'Google returned an unusable access token.', false);
    }
    if (!refreshToken) {
      throw googleError('GOOGLE_REFRESH_TOKEN_MISSING', 'Google did not return an offline refresh token. Remove the app grant and try again.', true);
    }
    const grantedScopes = normalizeGrantedScopes(body.scope);
    let account = null;
    let accountWarning = null;
    try {
      const profileResponse = await fetchWithTimeout(
        this.fetchImpl,
        this.endpoints.userinfo,
        { headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' } },
        this.requestTimeoutMs
      );
      const profile = await readJsonResponse(profileResponse, 64 * 1024);
      if (profile.ok && profile.body) {
        account = publicAccount({ email: profile.body.email, displayName: profile.body.name });
      }
      if (!account) accountWarning = 'Google did not return a usable account profile.';
    } catch {
      accountWarning = 'Google account profile could not be read; the read-only Sheets scope is still stored.';
    }
    return {
      accessToken,
      refreshToken,
      grantedScopes,
      account,
      accountWarning,
      expiresAt: this.now() + Math.max(60, Number(body.expires_in) || 3600) * 1000,
    };
  }

  async getAccessToken() {
    await this.initialize();
    if (!this.refreshToken) {
      throw googleError('GOOGLE_NOT_CONNECTED', 'No Google account is connected.', false);
    }
    if (missingRequiredScopes(this.grantedScopes).includes('https://www.googleapis.com/auth/spreadsheets.readonly')) {
      throw googleError('GOOGLE_SCOPE_MISSING', 'The read-only Sheets scope was not granted. Reconnect with the reviewed scope set.', false);
    }
    if (this.accessToken && this.accessTokenExpiresAt > this.now() + 60000) {
      return this.accessToken;
    }
    if (!this.client) {
      throw googleError('GOOGLE_CLIENT_MISSING', 'The Google OAuth client is no longer available.', false);
    }
    const body = new URLSearchParams({
      client_id: this.client.clientId,
      client_secret: this.client.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: 'refresh_token',
    });
    const response = await fetchWithTimeout(
      this.fetchImpl,
      this.endpoints.token,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        body: body.toString(),
      },
      this.requestTimeoutMs
    );
    const result = await readJsonResponse(response, 256 * 1024);
    if (!result.ok || !result.body) {
      if (result.body?.error === 'invalid_grant') {
        await this.clearStoredCredential();
        throw googleError('GOOGLE_REAUTH_REQUIRED', 'The Google grant is stale. Reconnect the account.', false);
      }
      throw googleError('GOOGLE_TOKEN_REFRESH_FAILED', 'The Google access token could not be refreshed.', true);
    }
    const accessToken = typeof result.body.access_token === 'string' ? result.body.access_token : '';
    if (!accessToken) {
      throw googleError('GOOGLE_TOKEN_INVALID', 'Google returned an unusable access token.', false);
    }
    this.accessToken = accessToken;
    this.accessTokenExpiresAt = this.now() + Math.max(60, Number(result.body.expires_in) || 3600) * 1000;
    if (typeof result.body.refresh_token === 'string' && result.body.refresh_token) {
      this.refreshToken = result.body.refresh_token;
      await this.vault.save({
        version: 1,
        refreshToken: this.refreshToken,
        account: this.account,
        grantedScopes: this.grantedScopes,
        obtainedAt: this.obtainedAt,
      });
    }
    return accessToken;
  }

  async clearStoredCredential() {
    this.refreshToken = null;
    this.account = null;
    this.grantedScopes = [];
    this.obtainedAt = null;
    this.accessToken = null;
    this.accessTokenExpiresAt = 0;
    await this.vault.clear();
    this.lastError = null;
    this.touch();
  }

  async disconnect() {
    await this.initialize();
    const token = this.refreshToken;
    if (token) {
      try {
        const response = await fetchWithTimeout(
          this.fetchImpl,
          this.endpoints.revoke,
          {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
            body: new URLSearchParams({ token }).toString(),
          },
          8000
        );
        await response.text().catch(() => '');
      } catch {
        // Local disconnect must succeed even when Google is unreachable.
      }
    }
    await this.clearStoredCredential();
    return this.status();
  }

  async listSelectedSheets() {
    await this.initialize();
    if (!this.refreshToken) {
      throw googleError('GOOGLE_NOT_CONNECTED', 'No Google account is connected.', false);
    }
    const token = await this.getAccessToken();
    const sheets = [];
    const failures = [];
    for (const id of this.selection.ids.slice(0, MAX_SHEETS)) {
      try {
        const url = `${this.endpoints.sheets}/${encodeURIComponent(id)}?fields=spreadsheetId,properties.title,sheets.properties`;
        const response = await fetchWithTimeout(
          this.fetchImpl,
          url,
          { headers: { authorization: `Bearer ${token}`, accept: 'application/json' } },
          this.requestTimeoutMs
        );
        const result = await readJsonResponse(response, 512 * 1024);
        if (!result.ok || !result.body) {
          failures.push({ id, code: result.status === 403 ? 'GOOGLE_SCOPE_MISSING' : 'GOOGLE_SHEETS_READ_FAILED' });
          continue;
        }
        const body = result.body;
        sheets.push({
          id: String(body.spreadsheetId || id),
          title: typeof body.properties?.title === 'string' ? body.properties.title : 'Untitled spreadsheet',
          tabs: Array.isArray(body.sheets)
            ? body.sheets.map((tab) => ({
                sheetId: Number(tab?.properties?.sheetId) || 0,
                title: typeof tab?.properties?.title === 'string' ? tab.properties.title : 'Sheet',
                index: Number(tab?.properties?.index) || 0,
                rows: Number(tab?.properties?.gridProperties?.rowCount) || 0,
                columns: Number(tab?.properties?.gridProperties?.columnCount) || 0,
              }))
            : [],
          observedAt: new Date(this.now()).toISOString(),
        });
      } catch (error) {
        failures.push({ id, code: sanitizeError(error).code });
      }
    }
    return { sheets, failures, selectedCount: this.selection.ids.length };
  }

  async addSpreadsheet(input) {
    await this.initialize();
    const id = parseSpreadsheetInput(input);
    if (this.selection.ids.includes(id)) {
      return { ids: this.selection.ids, added: false };
    }
    if (this.selection.ids.length >= MAX_SHEETS) {
      throw googleError('GOOGLE_SHEET_LIMIT', `A maximum of ${MAX_SHEETS} spreadsheets can be selected.`, false);
    }
    await this.selection.save([...this.selection.ids, id]);
    this.touch();
    return { ids: this.selection.ids, added: true };
  }

  async removeSpreadsheet(id) {
    await this.initialize();
    if (!SHEET_ID_PATTERN.test(String(id || ''))) {
      throw googleError('GOOGLE_SHEET_ID_INVALID', 'The spreadsheet id is not valid.', false);
    }
    if (!this.selection.ids.includes(id)) {
      return { ids: this.selection.ids, removed: false };
    }
    await this.selection.save(this.selection.ids.filter((entry) => entry !== id));
    this.touch();
    return { ids: this.selection.ids, removed: true };
  }

  async readSheet(request = {}) {
    await this.initialize();
    if (!this.refreshToken) {
      throw googleError('GOOGLE_NOT_CONNECTED', 'No Google account is connected.', false);
    }
    const id = parseSpreadsheetInput(request.id);
    if (!this.selection.ids.includes(id)) {
      throw googleError('GOOGLE_SHEET_NOT_SELECTED', 'Add the spreadsheet before reading it.', false);
    }
    const range = validateRange(request.range);
    const majorDimension = request.majorDimension === 'COLUMNS' ? 'COLUMNS' : 'ROWS';
    const token = await this.getAccessToken();
    const url = `${this.endpoints.sheets}/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}?majorDimension=${majorDimension}`;
    const response = await fetchWithTimeout(
      this.fetchImpl,
      url,
      { headers: { authorization: `Bearer ${token}`, accept: 'application/json' } },
      this.requestTimeoutMs
    );
    const result = await readJsonResponse(response, 2 * 1024 * 1024);
    if (!result.ok || !result.body) {
      if (result.status === 403) {
        throw googleError('GOOGLE_SCOPE_MISSING', 'The read-only Sheets scope is missing.', false);
      }
      throw googleError('GOOGLE_SHEETS_READ_FAILED', 'The spreadsheet values could not be read.', true);
    }
    const rows = Array.isArray(result.body.values) ? result.body.values : [];
    const values = rows.slice(0, MAX_SHEET_ROWS).map((row) =>
      Array.isArray(row) ? row.slice(0, MAX_SHEET_COLUMNS).map((cell) => (cell == null ? '' : String(cell))) : []
    );
    return {
      spreadsheetId: String(result.body.spreadsheetId || id),
      range: String(result.body.range || range),
      majorDimension: String(result.body.majorDimension || majorDimension),
      values,
      rowCount: values.length,
      columnCount: values.reduce((max, row) => Math.max(max, row.length), 0),
      observedAt: new Date(this.now()).toISOString(),
    };
  }
}

module.exports = {
  CONTRACT,
  GOOGLE,
  REQUEST_SCOPES,
  REQUIRED_SCOPES,
  DEFAULT_RANGE,
  MAX_SHEETS,
  GoogleOAuthService,
  TokenVault,
  SelectionStore,
  createPkcePair,
  createState,
  parseSpreadsheetInput,
  validateRange,
  loadClientConfig,
  validateClientDocument,
  normalizeGrantedScopes,
  sanitizeError,
};
