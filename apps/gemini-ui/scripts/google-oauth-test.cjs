'use strict';

/**
 * KNOuX Gemini — offline Google OAuth / Sheets security test.
 *
 * This test never contacts Google. It runs the real main-process coordinator
 * against a disposable local config, loopback callback and mock token/userinfo/
 * Sheets endpoints. It proves PKCE/state checks, timeout/cancel behavior,
 * DPAPI-bound storage contracts (using a fake safeStorage), bounded Sheets
 * parsing and the absence of token material in renderer-facing surfaces.
 */

const fs = require('node:fs');
const fsp = fs.promises;
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');

const {
  GoogleOAuthService,
  createPkcePair,
  parseSpreadsheetInput,
  validateRange,
} = require('../electron/native/google-auth.cjs');

const appRoot = path.join(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), 'utf8');
const failures = [];
let checks = 0;

async function check(name, run) {
  checks += 1;
  try {
    await run();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push({ name, message: String(error?.message || error) });
    console.log(`  ✗ ${name}: ${error?.message || error}`);
  }
}

function jsonResponse(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  });
  response.end(payload);
}

function fakeSafeStorage() {
  return {
    isEncryptionAvailable: () => true,
    encryptString: (value) => Buffer.from(`KX1:${Buffer.from(String(value), 'utf8').toString('base64')}`, 'utf8'),
    decryptString: (buffer) => Buffer.from(String(buffer).replace(/^KX1:/, ''), 'base64').toString('utf8'),
  };
}

function makeShell({ wrongState = false, neverReturn = false } = {}) {
  const shell = {
    authUrl: null,
    openExternal: async (value) => {
      shell.authUrl = value;
      if (neverReturn) return true;
      const url = new URL(value);
      const redirect = url.searchParams.get('redirect_uri');
      const state = wrongState ? 'deliberately-wrong-state' : url.searchParams.get('state');
      setTimeout(() => {
        http.get(`${redirect}?code=test-authorization-code&state=${encodeURIComponent(state)}`, (response) => {
          response.resume();
        }).on('error', () => {});
      }, 30);
      return true;
    },
  };
  return shell;
}

function createGoogleMock() {
  const state = {
    tokenRequests: 0,
    refreshRequests: 0,
    userinfoRequests: 0,
    sheetMetadataRequests: 0,
    sheetValueRequests: 0,
    revokeRequests: 0,
    failTokenExchange: false,
    rejectRefresh: false,
  };
  const server = http.createServer((request, response) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      const url = request.url || '/';
      if (url === '/token') {
        state.tokenRequests += 1;
        if (body.includes('grant_type=refresh_token')) state.refreshRequests += 1;
        if (state.failTokenExchange) return jsonResponse(response, 500, { error: 'server_error' });
        if (state.rejectRefresh && body.includes('grant_type=refresh_token')) {
          return jsonResponse(response, 400, { error: 'invalid_grant' });
        }
        if (body.includes('grant_type=refresh_token')) {
          return jsonResponse(response, 200, {
            access_token: 'mock-access-token-refreshed',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/spreadsheets.readonly',
          });
        }
        return jsonResponse(response, 200, {
          access_token: 'mock-access-token-1',
          refresh_token: 'mock-refresh-token-secret-value',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/spreadsheets.readonly',
        });
      }
      if (url === '/userinfo') {
        state.userinfoRequests += 1;
        return jsonResponse(response, 200, { email: 'owner@example.com', name: 'Disposable Owner' });
      }
      if (url.startsWith('/sheets/')) {
        if (url.includes('/values/')) {
          state.sheetValueRequests += 1;
          return jsonResponse(response, 200, {
            spreadsheetId: '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789',
            range: 'Sheet1!A1:B2',
            majorDimension: 'ROWS',
            values: [['Name', 'Value'], ['Alpha', '1']],
          });
        }
        state.sheetMetadataRequests += 1;
        return jsonResponse(response, 200, {
          spreadsheetId: '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789',
          properties: { title: 'Disposable Sheet' },
          sheets: [
            { properties: { sheetId: 11, title: 'Sheet1', index: 0, gridProperties: { rowCount: 2, columnCount: 2 } } },
          ],
        });
      }
      if (url === '/revoke') {
        state.revokeRequests += 1;
        return jsonResponse(response, 200, {});
      }
      return jsonResponse(response, 404, { error: 'not_found' });
    });
  });
  return new Promise((resolve) => {
    server.listen({ host: '127.0.0.1', port: 0, exclusive: true }, () => {
      const address = server.address();
      resolve({ server, state, base: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function writeClient(dir, document = null) {
  const target = path.join(dir, 'google-desktop-client.json');
  const value = document || {
    installed: {
      client_id: 'mock-client-id.apps.googleusercontent.com',
      client_secret: 'mock-client-secret-value',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      redirect_uris: ['http://localhost'],
    },
  };
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(target, JSON.stringify(value), 'utf8');
  return target;
}

async function main() {
  console.log('[google-oauth-test]');
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'knoux-google-'));
  const mock = await createGoogleMock();
  let clock = Date.UTC(2026, 9, 27, 0, 0, 0);

  const endpoints = {
    auth: `${mock.base}/authorize`,
    token: `${mock.base}/token`,
    revoke: `${mock.base}/revoke`,
    userinfo: `${mock.base}/userinfo`,
    sheets: `${mock.base}/sheets`,
  };

  const makeService = (options = {}) =>
    new GoogleOAuthService({
      safeStorage: fakeSafeStorage(),
      shell: makeShell(),
      userDataPath: path.join(root, 'profile'),
      env: { KNOUX_GOOGLE_OAUTH_CLIENT_PATH: path.join(root, 'config', 'google-desktop-client.json') },
      connectTimeoutMs: 5000,
      requestTimeoutMs: 5000,
      allowTestEndpoints: true,
      endpoints,
      now: () => clock,
      ...options,
    });

  await check('PKCE uses an S256 challenge and high-entropy verifier/state', () => {
    const { verifier, challenge } = createPkcePair();
    assert.match(verifier, /^[A-Za-z0-9_-]{43,128}$/);
    assert.match(challenge, /^[A-Za-z0-9_-]{43}$/);
    assert.notEqual(verifier, challenge);
  });

  await check('spreadsheet URL and range validation reject arbitrary hosts/characters', () => {
    const id = '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789';
    assert.equal(parseSpreadsheetInput(id), id);
    assert.equal(parseSpreadsheetInput(`https://docs.google.com/spreadsheets/d/${id}/edit#gid=0`), id);
    assert.throws(() => parseSpreadsheetInput(`http://docs.google.com/spreadsheets/d/${id}/edit`), /docs\.google\.com/);
    assert.throws(() => parseSpreadsheetInput(`https://evil.example/spreadsheets/d/${id}/edit`), /docs\.google\.com/);
    assert.throws(() => parseSpreadsheetInput('javascript:alert(1)'), /valid ID|docs\.google\.com/);
    assert.equal(validateRange('A1:Z200'), 'A1:Z200');
    assert.throws(() => validateRange('Sheet1!/https://evil'), /unsupported characters/);
  });

  await check('missing client configuration is reported without any network request', async () => {
    const service = makeService({
      env: {},
      userDataPath: path.join(root, 'empty-profile'),
    });
    const status = await service.initialize();
    assert.equal(status.configured, false);
    assert.equal(status.connection, 'disconnected');
    assert.equal(status.connected, false);
    assert.equal(status.account, null);
  });

  await check('malformed client JSON fails closed', async () => {
    const configDir = path.join(root, 'bad-config');
    await fsp.mkdir(configDir, { recursive: true });
    await fsp.writeFile(path.join(configDir, 'google-desktop-client.json'), '{not-json', 'utf8');
    const service = makeService({
      env: { KNOUX_GOOGLE_OAUTH_CLIENT_PATH: path.join(configDir, 'google-desktop-client.json') },
      userDataPath: path.join(root, 'bad-profile'),
    });
    const status = await service.initialize();
    assert.equal(status.configured, false);
    await assert.rejects(() => service.connect(), /malformed JSON|not valid JSON/);
  });

  await writeClient(path.join(root, 'config'));

  await check('state mismatch aborts before token exchange', async () => {
    const service = makeService({
      shell: makeShell({ wrongState: true }),
      userDataPath: path.join(root, 'mismatch-profile'),
    });
    await assert.rejects(() => service.connect(), (error) => error.code === 'GOOGLE_STATE_MISMATCH');
    assert.equal(mock.state.tokenRequests, 0);
    const status = await service.getStatus();
    assert.equal(status.connected, false);
  });

  await check('loopback timeout closes the listener and reports a retryable error', async () => {
    const service = makeService({
      shell: makeShell({ neverReturn: true }),
      connectTimeoutMs: 180,
      userDataPath: path.join(root, 'timeout-profile'),
    });
    await assert.rejects(() => service.connect(), (error) => error.code === 'GOOGLE_CONNECT_TIMEOUT');
    const status = await service.getStatus();
    assert.equal(status.connection, 'disconnected');
  });

  const service = makeService();
  await check('authorization code + PKCE round trip stores only an encrypted refresh token', async () => {
    const status = await service.connect();
    assert.equal(status.connection, 'connected');
    assert.equal(status.account.email, 'owner@example.com');
    assert.equal(status.account.displayName, 'Disposable Owner');
    assert.equal(status.tokenStorage, 'windows-dpapi-safeStorage');
    const vaultPath = path.join(root, 'profile', 'oauth', 'google-refresh.bin');
    const encrypted = await fsp.readFile(vaultPath);
    assert.ok(encrypted.length > 20);
    assert.ok(!encrypted.toString('utf8').includes('mock-refresh-token-secret-value'));
    const statusText = JSON.stringify(status);
    assert.ok(!statusText.includes('mock-refresh-token-secret-value'));
    assert.ok(!statusText.includes('mock-access-token'));
    assert.ok(!statusText.includes('client_secret'));
  });

  await check('selected spreadsheet is added by URL/ID and listed with bounded metadata', async () => {
    const id = '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789';
    const added = await service.addSpreadsheet(`https://docs.google.com/spreadsheets/d/${id}/edit#gid=0`);
    assert.equal(added.added, true);
    assert.equal(added.ids[0], id);
    const listed = await service.listSelectedSheets();
    assert.equal(listed.sheets.length, 1);
    assert.equal(listed.sheets[0].title, 'Disposable Sheet');
    assert.equal(listed.sheets[0].tabs[0].title, 'Sheet1');
    assert.equal(listed.failures.length, 0);
  });

  await check('readSheet returns bounded values and never returns token fields', async () => {
    const id = '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789';
    const result = await service.readSheet({ id, range: 'Sheet1!A1:B2' });
    assert.deepEqual(result.values, [['Name', 'Value'], ['Alpha', '1']]);
    assert.equal(result.rowCount, 2);
    assert.equal(result.columnCount, 2);
    const text = JSON.stringify(result);
    assert.ok(!/access_token|refresh_token|client_secret/i.test(text));
  });

  await check('unselected spreadsheet reads are rejected', async () => {
    await assert.rejects(
      () => service.readSheet({ id: '9ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlKk', range: 'A1:B2' }),
      (error) => error.code === 'GOOGLE_SHEET_NOT_SELECTED'
    );
  });

  await check('stale refresh token clears the local credential and requires reauthorization', async () => {
    mock.state.rejectRefresh = true;
    clock += 2 * 60 * 60 * 1000;
    await assert.rejects(
      () => service.readSheet({ id: '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789', range: 'A1:B2' }),
      (error) => error.code === 'GOOGLE_REAUTH_REQUIRED'
    );
    const status = await service.getStatus();
    assert.equal(status.connected, false);
    mock.state.rejectRefresh = false;
  });

  await check('disconnect revokes best-effort and removes the local encrypted credential', async () => {
    const fresh = makeService({ userDataPath: path.join(root, 'disconnect-profile') });
    await fresh.connect();
    const status = await fresh.disconnect();
    assert.equal(status.connected, false);
    assert.equal(mock.state.revokeRequests > 0, true);
    await assert.rejects(() => fsp.stat(path.join(root, 'disconnect-profile', 'oauth', 'google-refresh.bin')));
  });

  await check('token exchange network failure is sanitized', async () => {
    const failed = makeService({
      endpoints: { ...endpoints, token: 'http://127.0.0.1:1/token' },
      userDataPath: path.join(root, 'network-profile'),
    });
    await assert.rejects(
      () => failed.connect(),
      (error) => error.code === 'GOOGLE_NETWORK_FAILED' && !JSON.stringify(error).includes('mock-refresh')
    );
  });

  await check('renderer/preload surfaces contain no token or client-secret field', () => {
    const preload = read('electron/preload.cjs');
    assert.ok(!/refresh_token|access_token|client_secret/i.test(preload));
    assert.ok(!/refresh_token|access_token|client_secret/i.test(read('shared/native-contract.json')));
    assert.ok(!fs.existsSync(path.join(appRoot, 'google-desktop-client.json')));
  });

  mock.server.close();
  await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
  const result = { ok: failures.length === 0, checks, failures };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('[google-oauth-test] PASS');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
