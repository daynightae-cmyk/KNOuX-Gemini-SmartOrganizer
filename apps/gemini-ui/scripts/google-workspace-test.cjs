'use strict';

/**
 * KNOuX Gemini - Google Workspace read-provider test (offline).
 *
 * Runs the real main-process reader module against a fake fetch, so no Google
 * host is contacted. It proves, per product:
 *   - the product's own read-only scope is required before any request;
 *   - the caller can never supply a URL, host, method, header or body;
 *   - items are bounded, normalized and carry provenance;
 *   - 401 / 403 / 429 / 5xx map to distinct retry semantics;
 *   - Forms/Slides require a locally selected, validated document;
 *   - disconnect purges those local selections;
 *   - no token material reaches the renderer or shared contracts.
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');

const {
  GoogleWorkspaceService,
  SELECTION_LIMIT,
  MAX_ITEMS,
  parseFormInput,
  parseSlideInput,
  apiErrorFor,
} = require('../electron/native/google-workspace.cjs');

const appRoot = path.join(__dirname, '..');
const failures = [];
const results = [];
let checks = 0;

async function check(name, run) {
  checks += 1;
  try {
    await run();
    results.push({ name, ok: true });
    console.log(`  OK   ${name}`);
  } catch (error) {
    failures.push({ name, message: String(error?.message || error) });
    results.push({ name, ok: false, message: String(error?.message || error) });
    console.log(`  FAIL ${name}: ${error?.message || error}`);
  }
}

function makeOauth({ granted = [], connected = true } = {}) {
  const state = { scopeChecks: [], tokenCalls: [], reauth: 0 };
  return {
    state,
    requireProduct(product) {
      if (!connected) {
        const error = new Error('No Google account is connected.');
        error.code = 'GOOGLE_NOT_CONNECTED';
        throw error;
      }
      state.scopeChecks.push(product);
      if (!granted.includes(product)) {
        const error = new Error('The read-only scope was not granted.');
        error.code = 'GOOGLE_SCOPE_MISSING';
        throw error;
      }
      return product;
    },
    async getAccessToken(options = {}) {
      state.tokenCalls.push(options.product || null);
      return 'test-token-value';
    },
    markReauthRequired() {
      state.reauth += 1;
    },
  };
}

function makeFetch(handler) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    const outcome = handler(new URL(String(url)), options);
    if (outcome && typeof outcome.then === 'function') return outcome;
    const status = outcome.status || 200;
    const body = outcome.raw != null ? outcome.raw : JSON.stringify(outcome.body || {});
    return new Response(body, {
      status,
      headers: { 'content-type': 'application/json', ...(outcome.headers || {}) },
    });
  };
  return { fetchImpl, calls };
}

function origin(pathname) {
  const url = new URL(pathname);
  return url.origin + url.pathname;
}

function json(view, status = 200, headers = {}) {
  return { body: view, status, headers };
}

async function main() {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'knoux-google-workspace-'));
  const allProducts = ['sheets', 'gmail', 'tasks', 'forms', 'contacts', 'calendar', 'picker', 'slides', 'chat', 'classroom'];
  const grantedAll = allProducts.filter((id) => id !== 'sheets');

  await check('capabilities list ten read-only products and mark Forms/Slides selectable', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl, calls } = makeFetch(() => json({}));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'caps') });
    const caps = service.capabilities();
    assert.equal(caps.contract, 'google.workspace.v1');
    assert.equal(caps.products.length, 10);
    assert.deepEqual(caps.products.map((product) => product.id), allProducts);
    assert(caps.products.every((product) => product.scope.endsWith('.readonly')));
    assert.deepEqual(caps.products.filter((product) => product.selection).map((product) => product.id), ['forms', 'slides']);
    assert.equal(calls.length, 0, 'capabilities must not touch the network');
  });

  await check('an unknown product is rejected locally', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl, calls } = makeFetch(() => json({}));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'unknown') });
    await assert.rejects(() => service.read({ product: 'drive-search' }), (error) => error.code === 'GOOGLE_PRODUCT_INVALID');
    assert.equal(calls.length, 0);
  });

  await check('a missing product scope fails before any request is made', async () => {
    const oauth = makeOauth({ granted: ['sheets'] });
    const { fetchImpl, calls } = makeFetch(() => json({}));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'gate') });
    await assert.rejects(() => service.read({ product: 'gmail' }), (error) => error.code === 'GOOGLE_SCOPE_MISSING');
    assert.equal(calls.length, 0, 'scope gating must not reach the network');
    assert.equal(oauth.state.tokenCalls.length, 0, 'no token is minted without a granted scope');
  });

  await check('a disconnected account fails before any request is made', async () => {
    const oauth = makeOauth({ connected: false, granted: grantedAll });
    const { fetchImpl, calls } = makeFetch(() => json({}));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'nocount') });
    await assert.rejects(() => service.read({ product: 'calendar' }), (error) => error.code === 'GOOGLE_NOT_CONNECTED');
    assert.equal(calls.length, 0);
  });

  await check('Gmail reads metadata only, caps detail fetches and reports truncation', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const ids = Array.from({ length: 60 }, (_value, index) => `message${String(index).padStart(10, '0')}`);
    const { fetchImpl, calls } = makeFetch((url) => {
      if (url.pathname.endsWith('/users/me/messages')) return json({ messages: ids.map((id) => ({ id })), nextPageToken: 'next' });
      const id = decodeURIComponent(url.pathname.split('/').pop());
      return json({
        id,
        labelIds: ['INBOX', 'UNREAD'],
        payload: {
          headers: [
            { name: 'Subject', value: `Subject ${id}` },
            { name: 'From', value: 'owner@example.com' },
            { name: 'To', value: 'me@example.com' },
            { name: 'Date', value: '2026-11-03T04:00:00Z' },
          ],
        },
      });
    });
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'gmail') });
    const result = await service.read({ product: 'gmail', query: 'from:owner' });
    assert.equal(result.product, 'gmail');
    assert.equal(result.items.length, 12, 'detail fetches are capped at 12');
    assert.equal(calls.filter((call) => call.url.includes('/messages/message')).length, 12);
    assert.equal(result.truncated, true);
    assert.equal(result.items[0].title, 'Subject message0000000000');
    assert.equal(result.items[0].status, 'warn');
    assert(result.items[0].fields.some((field) => field.label === 'Labels'));
    assert.match(result.provenance.api, /Gmail/);
    assert(!JSON.stringify(result).includes('test-token-value'), 'the token must never be serialized');
    for (const call of calls) {
      assert.equal(call.options.method, 'GET');
      assert.equal(call.options.redirect, 'error');
      assert.equal(call.options.body, undefined);
      assert.equal(call.options.headers.authorization, 'Bearer test-token-value');
      assert.equal(call.options.headers.accept, 'application/json');
      assert.deepEqual(Object.keys(call.options.headers).sort(), ['accept', 'authorization']);
    }
  });

  await check('Tasks reads bounded lists and completed tasks are marked, not changed', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl } = makeFetch((url) => {
      if (url.pathname.endsWith('/users/@me/lists')) {
        return json({ items: [{ id: 'list-one', title: 'Work' }, { id: 'list-two', title: 'Home' }] });
      }
      return json({
        items: [
          { id: 'task-a', title: 'Review evidence', status: 'needsAction', due: '2026-11-04T00:00:00.000Z' },
          { id: 'task-b', title: 'Archive slice', status: 'completed' },
        ],
      });
    });
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'tasks') });
    const result = await service.read({ product: 'tasks' });
    assert.equal(result.items.length, 4);
    assert.equal(result.items[0].subtitle, 'Work');
    assert.equal(result.items[0].status, 'live');
    assert.equal(result.items[1].status, 'muted', 'completed tasks are visually marked');
    assert.match(result.provenance.api, /Tasks/);
    assert.equal(result.truncated, false);
  });

  await check('Forms requires a locally selected, validated document', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl, calls } = makeFetch(() => json({ info: { title: 'Intake' }, items: [{}, {}], revisionId: 'r1' }));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'forms') });
    const empty = await service.read({ product: 'forms' });
    assert.equal(empty.items.length, 0);
    assert.equal(calls.length, 0, 'no form is read before it is selected');
    await assert.rejects(() => service.select({ product: 'forms', action: 'add', input: 'https://evil.example/forms/d/abcdefghijklmnop' }), (error) => error.code === 'GOOGLE_INPUT_INVALID');
    await assert.rejects(() => service.select({ product: 'forms', action: 'add', input: 'https://docs.google.com/forms/d/short/edit' }), (error) => error.code === 'GOOGLE_INPUT_INVALID');
    const added = await service.select({ product: 'forms', action: 'add', input: 'https://docs.google.com/forms/d/form1234567890/edit' });
    assert.equal(added.added, true);
    const result = await service.read({ product: 'forms' });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].id, 'form1234567890');
    assert.equal(result.items[0].title, 'Intake');
    assert.equal(result.selection.selected, 1);
    assert(calls.length === 1 && calls[0].url.includes('/forms/form1234567890'));
  });

  await check('Slides requires a locally selected presentation and reads its outline', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl } = makeFetch(() => json({ title: 'Launch deck', revisionId: 'rev-9', locale: 'en', slides: [{}, {}, {}] }));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'slides') });
    await service.select({ product: 'slides', action: 'add', input: 'https://docs.google.com/presentation/d/slide1234567890/edit#slide=id.p' });
    const result = await service.read({ product: 'slides' });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].title, 'Launch deck');
    assert.equal(result.items[0].subtitle, '3 slides');
    assert.equal(result.selection.ids[0], 'slide1234567890');
  });

  await check('document selection is capped, deduplicated, persistent and removable', async () => {
    const dir = path.join(root, 'selection');
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl } = makeFetch(() => json({ info: {}, items: [] }));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: dir });
    for (let index = 0; index < SELECTION_LIMIT + 3; index += 1) {
      const id = `form${String(index).padStart(12, '0')}`;
      try {
        await service.select({ product: 'forms', action: 'add', input: id });
      } catch (error) {
        assert.equal(error.code, 'GOOGLE_SELECTION_LIMIT');
        break;
      }
    }
    const ids = await service.selectionIds('forms');
    assert.equal(ids.length, SELECTION_LIMIT);
    const duplicate = await service.select({ product: 'forms', action: 'add', input: ids[0] });
    assert.equal(duplicate.added, false);
    const reloaded = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: dir });
    assert.deepEqual(await reloaded.selectionIds('forms'), ids);
    const removed = await reloaded.select({ product: 'forms', action: 'remove', id: ids[0] });
    assert.equal(removed.removed, true);
    assert.equal((await reloaded.selectionIds('forms')).length, SELECTION_LIMIT - 1);
  });

  await check('Contacts reads the account connections with bounded fields', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl, calls } = makeFetch(() => json({
      connections: [
        { resourceName: 'people/c1', names: [{ displayName: 'Amina Owner' }], emailAddresses: [{ value: 'amina@example.com' }], organizations: [{ name: 'KNOuX' }] },
      ],
    }));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'contacts') });
    const result = await service.read({ product: 'contacts' });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].title, 'Amina Owner');
    assert.equal(result.items[0].subtitle, 'amina@example.com');
    assert(calls[0].url.includes('personFields=names'));
    assert(calls[0].url.includes('pageSize=100'));
  });

  await check('Calendar reads primary events from the start of today', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl, calls } = makeFetch(() => json({
      items: [{ id: 'ev-1', summary: 'Owner review', start: { dateTime: '2026-11-03T09:00:00Z' }, end: { dateTime: '2026-11-03T10:00:00Z' }, attendees: [{}, {}] }],
    }));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, dataPath: undefined, userDataPath: path.join(root, 'calendar') });
    const result = await service.read({ product: 'calendar' });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].title, 'Owner review');
    assert.equal(result.items[0].fields.find((field) => field.label === 'Attendees').value, '2');
    assert(calls[0].url.includes('/calendars/primary/events'));
    assert(calls[0].url.includes('singleEvents=true'));
    assert(calls[0].url.includes('timeMin='));
  });

  await check('Picker reads Drive metadata only, with no content download', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl, calls } = makeFetch(() => json({
      files: [{ id: 'file-1', name: 'Audit', mimeType: 'application/vnd.google-apps.spreadsheet', size: '2048', modifiedTime: '2026-11-01T10:00:00Z', owners: [{ displayName: 'Owner' }] }],
    }));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'picker') });
    const result = await service.read({ product: 'picker', query: 'trashed=false and name contains "audit"' });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].meta, 'Google Sheet');
    assert.equal(result.items[0].fields.find((field) => field.label === 'Size').value, '2 KB');
    assert(calls[0].url.includes('/drive/v3/files'));
    assert(calls[0].url.includes('fields=nextPageToken'));
    assert(!calls[0].url.includes('/export'));
  });

  await check('Chat lists spaces without requesting message history', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl, calls } = makeFetch(() => json({ spaces: [{ name: 'spaces/AAA', displayName: 'Ops', spaceType: 'SPACE', threaded: true }] }));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'chat') });
    const result = await service.read({ product: 'chat' });
    assert.equal(result.items[0].title, 'Ops');
    assert.equal(result.items[0].fields.find((field) => field.label === 'Messages').value.includes('not requested'), true);
    assert(calls[0].url.includes('/v1/spaces'));
    assert(!calls[0].url.includes('/messages'));
  });

  await check('Classroom lists active courses only', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl, calls } = makeFetch(() => json({ courses: [{ id: 'c-1', name: 'Safety 101', section: 'A', courseState: 'ACTIVE', creationTime: '2026-09-01T00:00:00Z' }] }));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'classroom') });
    const result = await service.read({ product: 'classroom' });
    assert.equal(result.items[0].title, 'Safety 101');
    assert.equal(result.items[0].meta, 'ACTIVE');
    assert(calls[0].url.includes('/v1/courses'));
    assert(calls[0].url.includes('courseStates=ACTIVE'));
  });

  await check('a 401 marks reauthorization and returns GOOGLE_REAUTH_REQUIRED', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl } = makeFetch(() => json({ error: { status: 'UNAUTHENTICATED' } }, 401));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, '401') });
    await assert.rejects(() => service.read({ product: 'contacts' }), (error) => error.code === 'GOOGLE_REAUTH_REQUIRED');
    assert.equal(oauth.state.reauth, 1);
  });

  await check('a 403 returns GOOGLE_SCOPE_MISSING and does not mark reauthorization', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl } = makeFetch(() => json({ error: { status: 'PERMISSION_DENIED' } }, 403));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, '403') });
    await assert.rejects(() => service.read({ product: 'chat' }), (error) => error.code === 'GOOGLE_SCOPE_MISSING');
    assert.equal(oauth.state.reauth, 0);
  });

  await check('a 429 returns GOOGLE_RATE_LIMITED with Retry-After seconds', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl } = makeFetch(() => json({ error: { status: 'RESOURCE_EXHAUSTED' } }, 429, { 'retry-after': '7' }));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, '429') });
    await assert.rejects(() => service.read({ product: 'classroom' }), (error) => {
      assert.equal(error.code, 'GOOGLE_RATE_LIMITED');
      assert.equal(error.retryable, true);
      assert.equal(error.retryAfterSeconds, 7);
      return true;
    });
  });

  await check('a 500 returns a retryable GOOGLE_API_UNAVAILABLE', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl } = makeFetch(() => json({ error: {} }, 503));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, '500') });
    await assert.rejects(() => service.read({ product: 'tasks' }), (error) => error.code === 'GOOGLE_API_UNAVAILABLE' && error.retryable === true);
  });

  await check('an oversized response is rejected before parsing', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl } = makeFetch(() => ({ raw: JSON.stringify({ padding: 'x'.repeat(1600 * 1024) }), status: 200 }));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'big') });
    await assert.rejects(() => service.read({ product: 'contacts' }), (error) => error.code === 'GOOGLE_RESPONSE_TOO_LARGE');
  });

  await check('a hung request is aborted as GOOGLE_TIMEOUT', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const fetchImpl = (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, requestTimeoutMs: 60, userDataPath: path.join(root, 'timeout') });
    await assert.rejects(() => service.read({ product: 'chat' }), (error) => error.code === 'GOOGLE_TIMEOUT' && error.retryable === true);
  });

  await check('item output is capped at the configured maximum for every list reader', async () => {
    const oauth = makeOauth({ granted: grantedAll });
    const many = (key) => ({ [key]: Array.from({ length: MAX_ITEMS + 20 }, (_value, index) => ({ id: `id${index}`, name: `name${index}`, displayName: `name${index}`, title: `task${index}` })) });
    const { fetchImpl } = makeFetch((url) => {
      if (url.pathname.includes('/people/')) return json(many('connections'));
      if (url.pathname.includes('/drive/')) return json({ files: many('x').x.map((entry) => ({ ...entry, mimeType: 'text/plain' })) });
      if (url.pathname.includes('/spaces')) return json(many('spaces'));
      if (url.pathname.includes('/courses')) return json(many('courses'));
      if (url.pathname.includes('/calendars/')) return json(many('items'));
      return json({ items: [] });
    });
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: path.join(root, 'caps-items') });
    for (const product of ['contacts', 'picker', 'chat', 'classroom', 'calendar']) {
      const result = await service.read({ product });
      assert(result.items.length <= MAX_ITEMS, `${product} exceeded the item cap`);
    }
  });

  await check('endpoint overrides cannot leave the reviewed origins', async () => {
    assert.throws(
      () => new GoogleWorkspaceService({ oauth: makeOauth(), fetchImpl: () => {}, userDataPath: root, endpoints: { gmail: 'https://evil.example/gmail' } }),
      (error) => error.code === 'GOOGLE_ENDPOINT_INVALID'
    );
    assert.throws(
      () => new GoogleWorkspaceService({ oauth: makeOauth(), fetchImpl: () => {}, userDataPath: root, endpoints: { tasks: 'http://tasks.googleapis.com/tasks' } }),
      (error) => error.code === 'GOOGLE_ENDPOINT_INVALID'
    );
    const testable = new GoogleWorkspaceService({
      oauth: makeOauth(),
      fetchImpl: () => {},
      userDataPath: root,
      allowTestEndpoints: true,
      endpoints: { tasks: 'http://127.0.0.1:9/tasks' },
    });
    assert.equal(testable.capabilities().products.length, 10);
  });

  await check('disconnect purges Forms and Slides local selections', async () => {
    const dir = path.join(root, 'purge');
    const oauth = makeOauth({ granted: grantedAll });
    const { fetchImpl } = makeFetch(() => json({ info: {}, items: [] }));
    const service = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: dir });
    await service.select({ product: 'forms', action: 'add', input: 'form1234567890' });
    await service.select({ product: 'slides', action: 'add', input: 'slide1234567890' });
    const purged = await service.purgeLocalCopies();
    assert.equal(purged.purged, true);
    assert.deepEqual(await service.selectionIds('forms'), []);
    assert.deepEqual(await service.selectionIds('slides'), []);
    const reloaded = new GoogleWorkspaceService({ oauth, fetchImpl, userDataPath: dir });
    assert.deepEqual(await reloaded.selectionIds('forms'), []);
  });

  await check('document URL parsers accept only docs.google.com /d/ URLs', async () => {
    assert.equal(parseFormInput('https://docs.google.com/forms/d/form1234567890/edit'), 'form1234567890');
    assert.equal(parseSlideInput('https://docs.google.com/presentation/d/slide1234567890/edit'), 'slide1234567890');
    assert.equal(parseFormInput('form1234567890'), 'form1234567890');
    assert.throws(() => parseFormInput('https://docs.google.com.evil.example/forms/d/form1234567890/edit'), (error) => error.code === 'GOOGLE_INPUT_INVALID');
    assert.throws(() => parseFormInput('http://docs.google.com/forms/d/form1234567890/edit'), (error) => error.code === 'GOOGLE_INPUT_INVALID');
  });

  await check('error mapping distinguishes quota from permission', async () => {
    assert.equal(apiErrorFor(403, { error: { errors: [{ reason: 'rateLimitExceeded' }] } }, new Headers()).code, 'GOOGLE_RATE_LIMITED');
    assert.equal(apiErrorFor(403, { error: { status: 'PERMISSION_DENIED' } }, new Headers()).code, 'GOOGLE_SCOPE_MISSING');
    assert.equal(apiErrorFor(404, {}, new Headers()).code, 'GOOGLE_RESOURCE_NOT_FOUND');
    assert.equal(apiErrorFor(401, {}, new Headers()).code, 'GOOGLE_REAUTH_REQUIRED');
  });

  await check('renderer, preload and shared contracts carry no token material', async () => {
    const walk = (dir) =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return /\.(ts|tsx|cjs|js)$/.test(entry.name) ? [full] : [];
      });
    const rendererFiles = [...walk(path.join(appRoot, 'src')), path.join(appRoot, 'shared', 'native-contracts.ts'), path.join(appRoot, 'electron', 'preload.cjs')];
    const hits = [];
    for (const file of rendererFiles) {
      const source = fs.readFileSync(file, 'utf8');
      if (/access_token|refresh_token|client_secret/.test(source)) hits.push(`${path.relative(appRoot, file)}:token-field`);
      if (/authorization:\s*[`'"]Bearer/i.test(source)) hits.push(`${path.relative(appRoot, file)}:bearer-header`);
      if (source.includes('test-token-value')) hits.push(`${path.relative(appRoot, file)}:fixture-token`);
    }
    assert.deepEqual(hits, []);
  });

  const payload = { ok: failures.length === 0, checks, failures, results };
  await fs.promises.writeFile(
    path.join(appRoot, '..', '..', 'docs', 'evidence', 'all-services-20261103', 'google-workspace-test.json'),
    `${JSON.stringify(payload, null, 2)}\n`
  );
  console.log(`[google-workspace-test] ${checks - failures.length}/${checks} checks passed`);
  if (failures.length) {
    console.log(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[google-workspace-test] fatal', error);
  process.exitCode = 1;
});
