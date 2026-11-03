'use strict';

/**
 * KNOuX Gemini - Google Workspace read providers (main process only).
 *
 * Nine product workspaces (Gmail, Tasks, Forms, Contacts, Calendar, Picker,
 * Slides, Chat, Classroom) plus the existing Sheets connector. This module is
 * a *reader*: it issues bounded GET requests to fixed, allowlisted Google API
 * origins with an access token that stays inside the main process.
 *
 * Hard rules enforced here, and tested in scripts/google-workspace-test.cjs:
 *   - no caller-supplied URL, host, header, method or body reaches fetch();
 *   - every request needs the product's own read-only scope, checked locally
 *     before any network call;
 *   - responses are size-capped, item-capped and normalized, and never carry
 *     token material back to the renderer;
 *   - 401 / 403 / 429 / 5xx are separated so the UI can tell an expired grant
 *     from a missing scope from quota pressure from an API outage.
 */

const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const { PRODUCTS, normalizeProduct } = require('./google-auth.cjs');

const CONTRACT = 'google.workspace.v1';

const DEFAULT_ENDPOINTS = Object.freeze({
  gmail: 'https://gmail.googleapis.com/gmail/v1',
  tasks: 'https://tasks.googleapis.com/tasks/v1',
  forms: 'https://forms.googleapis.com/v1',
  people: 'https://people.googleapis.com/v1',
  calendar: 'https://www.googleapis.com/calendar/v3',
  drive: 'https://www.googleapis.com/drive/v3',
  slides: 'https://slides.googleapis.com/v1',
  chat: 'https://chat.googleapis.com/v1',
  classroom: 'https://classroom.googleapis.com/v1',
});

const TRUSTED_ORIGINS = Object.freeze([
  'https://gmail.googleapis.com',
  'https://tasks.googleapis.com',
  'https://forms.googleapis.com',
  'https://people.googleapis.com',
  'https://www.googleapis.com',
  'https://slides.googleapis.com',
  'https://chat.googleapis.com',
  'https://classroom.googleapis.com',
]);

const SELECTION_PRODUCTS = Object.freeze(['forms', 'slides']);
const SELECTION_LIMIT = 20;
const MAX_ITEMS = 50;
const MAX_DETAIL_FETCHES = 12;
const MAX_TASK_LISTS = 5;
const MAX_TASK_PAGES = 2;
const MAX_RESPONSE_BYTES = 1536 * 1024;
const DEFAULT_TIMEOUT_MS = 20000;
const ID_PATTERN = /^[A-Za-z0-9_-]{10,160}$/;

function workspaceError(code, message, retryable = false, extra = null) {
  const error = new Error(message);
  error.code = code;
  error.retryable = Boolean(retryable);
  if (extra && typeof extra === 'object') Object.assign(error, extra);
  return error;
}

function parseRetryAfter(headers) {
  const raw = typeof headers?.get === 'function' ? headers.get('retry-after') : null;
  if (!raw) return null;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(Math.ceil(seconds), 3600);
  const when = Date.parse(raw);
  if (!Number.isFinite(when)) return null;
  return Math.min(Math.max(Math.ceil((when - Date.now()) / 1000), 0), 3600);
}

function apiErrorFor(status, body, headers) {
  const retryAfterSeconds = parseRetryAfter(headers);
  const reason = String(
    body?.error?.status ||
      body?.error?.errors?.[0]?.reason ||
      body?.error?.details?.[0]?.reason ||
      ''
  );
  if (status === 401) {
    return workspaceError('GOOGLE_REAUTH_REQUIRED', 'Google rejected the stored grant. Reconnect the account.', false);
  }
  if (status === 429 || (status === 403 && /rateLimit|quota/i.test(reason))) {
    return workspaceError('GOOGLE_RATE_LIMITED', 'The Google API quota is exhausted for now. Retry later.', true, {
      retryAfterSeconds,
    });
  }
  if (status === 403) {
    return workspaceError(
      'GOOGLE_SCOPE_MISSING',
      'This Google service was not granted its read-only scope. Enable the service again.',
      false
    );
  }
  if (status === 404) {
    return workspaceError('GOOGLE_RESOURCE_NOT_FOUND', 'The Google resource no longer exists or is not visible to this account.', false);
  }
  if (status >= 500) {
    return workspaceError('GOOGLE_API_UNAVAILABLE', 'The Google API is currently unavailable.', true, { retryAfterSeconds });
  }
  return workspaceError('GOOGLE_API_ERROR', `The Google API returned status ${status}.`, false);
}

function cleanText(value, limit = 240) {
  if (value == null) return '';
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function headerValue(headers, name) {
  const target = String(name).toLowerCase();
  if (!Array.isArray(headers)) return '';
  const found = headers.find((entry) => String(entry?.name || '').toLowerCase() === target);
  return found ? cleanText(found.value, 320) : '';
}

function isoDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}

class IdSelectionStore {
  constructor(filePath, pattern = ID_PATTERN) {
    this.filePath = filePath;
    this.pattern = pattern;
    this.ids = [];
  }

  async load() {
    try {
      const raw = await fsp.readFile(this.filePath, 'utf8');
      const payload = JSON.parse(raw);
      const ids = Array.isArray(payload?.ids) ? payload.ids : [];
      this.ids = [...new Set(ids.map(String).filter((id) => this.pattern.test(id)))].slice(0, SELECTION_LIMIT);
    } catch {
      this.ids = [];
    }
    return this.ids;
  }

  async save(ids) {
    this.ids = [...new Set(ids.map(String).filter((id) => this.pattern.test(id)))].slice(0, SELECTION_LIMIT);
    await fsp.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    const temporary = `${this.filePath}.${crypto.randomBytes(8).toString('hex')}.tmp`;
    await fsp.writeFile(temporary, JSON.stringify({ version: 1, ids: this.ids }, null, 2), { mode: 0o600 });
    await fsp.rename(temporary, this.filePath);
    return this.ids;
  }

  async clear() {
    this.ids = [];
    await fsp.rm(this.filePath, { force: true }).catch(() => {});
  }
}

function parseDocumentInput(input, domain, segment) {
  const raw = String(input == null ? '' : input).trim();
  if (!raw) {
    throw workspaceError('GOOGLE_INPUT_INVALID', 'A Google document URL or ID is required.', false);
  }
  if (ID_PATTERN.test(raw)) return raw;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw workspaceError('GOOGLE_INPUT_INVALID', 'The Google document reference is not a URL or a valid ID.', false);
  }
  if (url.protocol !== 'https:' || url.hostname !== `${domain}`) {
    throw workspaceError('GOOGLE_INPUT_INVALID', 'Only a docs.google.com document URL is accepted.', false);
  }
  const parts = url.pathname.split('/').filter(Boolean);
  const index = parts.indexOf(segment);
  const candidate = index >= 0 ? parts[index + 1] : '';
  if (!candidate || !ID_PATTERN.test(candidate)) {
    throw workspaceError('GOOGLE_INPUT_INVALID', 'The document URL does not contain a usable id.', false);
  }
  return candidate;
}

function parseFormInput(input) {
  return parseDocumentInput(input, 'docs.google.com', 'd');
}

function parseSlideInput(input) {
  return parseDocumentInput(input, 'docs.google.com', 'd');
}

class GoogleWorkspaceService {
  constructor(options = {}) {
    this.oauth = options.oauth || null;
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.now = options.now || (() => Date.now());
    this.requestTimeoutMs = options.requestTimeoutMs || DEFAULT_TIMEOUT_MS;
    this.maxItems = Math.min(Math.max(Number(options.maxItems) || MAX_ITEMS, 1), MAX_ITEMS);
    this.allowTestEndpoints = Boolean(options.allowTestEndpoints);
    this.userDataPath = options.userDataPath || '';
    this.endpoints = { ...DEFAULT_ENDPOINTS, ...(options.endpoints || {}) };
    this.assertEndpoints();
    const selectionRoot = path.join(this.userDataPath || '', 'oauth');
    this.stores = {
      forms: new IdSelectionStore(path.join(selectionRoot, 'google-forms-selection.json')),
      slides: new IdSelectionStore(path.join(selectionRoot, 'google-slides-selection.json')),
    };
    this.loaded = false;
    this.lastError = null;
    this.updatedAt = new Date(this.now()).toISOString();
  }

  assertEndpoints() {
    for (const [key, value] of Object.entries(this.endpoints)) {
      let url;
      try {
        url = new URL(value);
      } catch {
        throw workspaceError('GOOGLE_ENDPOINT_INVALID', `The ${key} Google endpoint is not a URL.`, false);
      }
      if (this.allowTestEndpoints) {
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw workspaceError('GOOGLE_ENDPOINT_INVALID', `The ${key} Google endpoint is not HTTP(S).`, false);
        }
        continue;
      }
      if (url.protocol !== 'https:' || !TRUSTED_ORIGINS.includes(url.origin)) {
        throw workspaceError('GOOGLE_ENDPOINT_INVALID', `The ${key} Google endpoint is not a trusted origin.`, false);
      }
    }
  }

  async initialize() {
    if (this.loaded) return;
    this.loaded = true;
    await Promise.all(Object.values(this.stores).map((store) => store.load()));
  }

  touch() {
    this.updatedAt = new Date(this.now()).toISOString();
  }

  capabilities() {
    return {
      contract: CONTRACT,
      products: Object.values(PRODUCTS).map((product) => ({
        id: product.id,
        label: product.label,
        scope: product.display,
        restricted: product.restricted,
        selection: SELECTION_PRODUCTS.includes(product.id),
      })),
      updatedAt: this.updatedAt,
    };
  }

  async selectionIds(product) {
    await this.initialize();
    const store = this.stores[product];
    return store ? [...store.ids] : [];
  }

  async select(request = {}) {
    await this.initialize();
    const product = normalizeProduct(request.product);
    if (!SELECTION_PRODUCTS.includes(product)) {
      throw workspaceError('GOOGLE_PRODUCT_NOT_SELECTABLE', 'This Google service lists its own items; it has no selection list.', false);
    }
    const action = request.action === 'remove' ? 'remove' : request.action === 'add' ? 'add' : null;
    if (!action) {
      throw workspaceError('GOOGLE_INPUT_INVALID', 'The selection action must be add or remove.', false);
    }
    const store = this.stores[product];
    if (action === 'remove') {
      const id = String(request.id || request.input || '').trim();
      if (!ID_PATTERN.test(id)) {
        throw workspaceError('GOOGLE_INPUT_INVALID', 'The document id is not valid.', false);
      }
      const removed = store.ids.includes(id);
      await store.save(store.ids.filter((entry) => entry !== id));
      this.touch();
      return { product, ids: [...store.ids], removed };
    }
    const id = product === 'forms' ? parseFormInput(request.input) : parseSlideInput(request.input);
    if (store.ids.includes(id)) {
      return { product, ids: [...store.ids], added: false };
    }
    if (store.ids.length >= SELECTION_LIMIT) {
      throw workspaceError('GOOGLE_SELECTION_LIMIT', `A maximum of ${SELECTION_LIMIT} documents can be selected.`, false);
    }
    await store.save([...store.ids, id]);
    this.touch();
    return { product, ids: [...store.ids], added: true };
  }

  async purgeLocalCopies() {
    await this.initialize();
    await Promise.all(Object.values(this.stores).map((store) => store.save([])));
    this.touch();
    return { purged: true, at: new Date(this.now()).toISOString() };
  }

  async fetchJson(url, token, product) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    let response;
    try {
      response = await this.fetchImpl(url, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
        signal: controller.signal,
        redirect: 'error',
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw workspaceError('GOOGLE_TIMEOUT', 'The Google request timed out.', true);
      }
      throw workspaceError('GOOGLE_NETWORK_FAILED', 'The Google API could not be reached.', true);
    } finally {
      clearTimeout(timer);
    }
    let text = '';
    try {
      text = await response.text();
    } catch {
      throw workspaceError('GOOGLE_RESPONSE_INVALID', 'The Google response could not be read.', true);
    }
    if (text.length > MAX_RESPONSE_BYTES) {
      throw workspaceError('GOOGLE_RESPONSE_TOO_LARGE', 'The Google response exceeded the reviewed size limit.', false);
    }
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
    }
    if (!response.ok) {
      const failure = apiErrorFor(response.status, body, response.headers);
      failure.product = product;
      if (response.status === 401 && this.oauth && typeof this.oauth.markReauthRequired === 'function') {
        this.oauth.markReauthRequired();
      }
      throw failure;
    }
    if (!body || typeof body !== 'object') {
      throw workspaceError('GOOGLE_RESPONSE_INVALID', 'The Google API returned an unreadable body.', true);
    }
    return { body, headers: response.headers };
  }

  async tokenFor(product) {
    if (!this.oauth) {
      throw workspaceError('GOOGLE_UNAVAILABLE', 'The Google OAuth coordinator is not available.', false);
    }
    this.oauth.requireProduct(product);
    return this.oauth.getAccessToken({ product });
  }

  async read(request = {}) {
    await this.initialize();
    const product = normalizeProduct(request.product);
    const token = await this.tokenFor(product);
    let result;
    switch (product) {
      case 'gmail':
        result = await this.readGmail(token, request);
        break;
      case 'tasks':
        result = await this.readTasks(token);
        break;
      case 'forms':
        result = await this.readForms(token, request);
        break;
      case 'contacts':
        result = await this.readContacts(token);
        break;
      case 'calendar':
        result = await this.readCalendar(token);
        break;
      case 'picker':
        result = await this.readDrive(token, request);
        break;
      case 'slides':
        result = await this.readSlides(token, request);
        break;
      case 'chat':
        result = await this.readChat(token);
        break;
      case 'classroom':
        result = await this.readClassroom(token);
        break;
      default:
        throw workspaceError('GOOGLE_PRODUCT_INVALID', 'This Google service has no workspace reader.', false);
    }
    this.touch();
    return {
      contract: CONTRACT,
      product,
      scope: PRODUCTS[product].display,
      restricted: PRODUCTS[product].restricted,
      ...result,
      observedAt: new Date(this.now()).toISOString(),
    };
  }

  /* ------------------------------------------------------------------ Gmail */

  async readGmail(token, request) {
    const query = cleanText(request.query, 200);
    const listUrl = new URL(`${this.endpoints.gmail}/users/me/messages`);
    listUrl.searchParams.set('maxResults', String(this.maxItems));
    if (query) listUrl.searchParams.set('q', query);
    const list = await this.fetchJson(listUrl.toString(), token, 'gmail');
    const ids = Array.isArray(list.body.messages) ? list.body.messages.map((entry) => String(entry?.id || '')).filter(Boolean) : [];
    const truncated = Boolean(list.body.nextPageToken) || ids.length > MAX_DETAIL_FETCHES;
    const detailIds = ids.slice(0, MAX_DETAIL_FETCHES);
    const items = [];
    const failures = [];
    for (const id of detailIds) {
      try {
        const detailUrl = new URL(`${this.endpoints.gmail}/users/me/messages/${encodeURIComponent(id)}`);
        detailUrl.searchParams.set('format', 'metadata');
        detailUrl.searchParams.append('metadataHeaders', 'From');
        detailUrl.searchParams.append('metadataHeaders', 'To');
        detailUrl.searchParams.append('metadataHeaders', 'Subject');
        detailUrl.searchParams.append('metadataHeaders', 'Date');
        const detail = await this.fetchJson(detailUrl.toString(), token, 'gmail');
        const headers = detail.body.payload?.headers;
        const labels = Array.isArray(detail.body.labelIds) ? detail.body.labelIds.map(String).slice(0, 8) : [];
        items.push({
          id,
          title: headerValue(headers, 'Subject') || '(no subject)',
          subtitle: headerValue(headers, 'From') || '(unknown sender)',
          meta: headerValue(headers, 'Date'),
          status: labels.includes('UNREAD') ? 'warn' : 'live',
          fields: [
            { label: 'From', value: headerValue(headers, 'From') || 'not provided' },
            { label: 'To', value: headerValue(headers, 'To') || 'not provided' },
            { label: 'Date', value: headerValue(headers, 'Date') || 'not provided' },
            { label: 'Labels', value: labels.join(', ') || 'none' },
          ],
        });
      } catch (error) {
        failures.push({ id, code: error?.code || 'GOOGLE_API_ERROR' });
      }
    }
    return {
      items,
      count: items.length,
      truncated,
      failures,
      provenance: {
        api: 'Gmail API v1',
        mode: 'read-only metadata',
        note: `Reads subjects and headers only; message bodies are never requested. ${ids.length} message ids matched.`,
      },
      quota: null,
    };
  }

  /* ------------------------------------------------------------------ Tasks */

  async readTasks(token) {
    const listsUrl = new URL(`${this.endpoints.tasks}/users/@me/lists`);
    listsUrl.searchParams.set('maxResults', '20');
    const lists = await this.fetchJson(listsUrl.toString(), token, 'tasks');
    const taskLists = Array.isArray(lists.body.items) ? lists.body.items.slice(0, MAX_TASK_LISTS) : [];
    const items = [];
    const failures = [];
    let truncated = Boolean(lists.body.nextPageToken);
    for (const list of taskLists) {
      const listId = String(list?.id || '');
      if (!listId) continue;
      try {
        const tasksUrl = new URL(`${this.endpoints.tasks}/lists/${encodeURIComponent(listId)}/tasks`);
        tasksUrl.searchParams.set('maxResults', '100');
        tasksUrl.searchParams.set('showCompleted', 'true');
        tasksUrl.searchParams.set('showHidden', 'false');
        const tasks = await this.fetchJson(tasksUrl.toString(), token, 'tasks');
        const entries = Array.isArray(tasks.body.items) ? tasks.body.items : [];
        if (tasks.body.nextPageToken) truncated = true;
        for (const task of entries) {
          const due = isoDate(task?.due);
          items.push({
            id: `${listId}:${String(task?.id || '')}`,
            title: cleanText(task?.title, 160) || '(untitled task)',
            subtitle: cleanText(list?.title, 120) || 'Task list',
            meta: due ? `Due ${due.slice(0, 10)}` : String(task?.status || 'needsAction'),
            status: task?.status === 'completed' ? 'muted' : 'live',
            fields: [
              { label: 'List', value: cleanText(list?.title, 120) || 'Task list' },
              { label: 'Status', value: task?.status === 'completed' ? 'completed' : 'needs action' },
              { label: 'Due', value: due ? due.slice(0, 10) : 'not set' },
              { label: 'Notes', value: cleanText(task?.notes, 240) || 'no notes' },
            ],
          });
        }
      } catch (error) {
        failures.push({ id: listId, code: error?.code || 'GOOGLE_API_ERROR' });
      }
    }
    return {
      items: items.slice(0, this.maxItems),
      count: Math.min(items.length, this.maxItems),
      truncated: truncated || items.length > this.maxItems,
      failures,
      provenance: {
        api: 'Google Tasks API v1',
        mode: 'read-only',
        note: `Read ${taskLists.length} task list(s). Completed tasks are marked, never modified.`,
      },
      quota: null,
    };
  }

  /* ------------------------------------------------------------------ Forms */

  async readForms(token) {
    const ids = await this.selectionIds('forms');
    const items = [];
    const failures = [];
    for (const id of ids) {
      try {
        const url = `${this.endpoints.forms}/forms/${encodeURIComponent(id)}`;
        const form = await this.fetchJson(url, token, 'forms');
        const questions = Array.isArray(form.body.items) ? form.body.items.length : 0;
        items.push({
          id,
          title: cleanText(form.body.info?.title, 160) || '(untitled form)',
          subtitle: cleanText(form.body.info?.documentTitle, 160) || 'Google Form',
          meta: `${questions} question${questions === 1 ? '' : 's'}`,
          status: 'live',
          fields: [
            { label: 'Document', value: cleanText(form.body.info?.documentTitle, 160) || 'Google Form' },
            { label: 'Questions', value: String(questions) },
            { label: 'Description', value: cleanText(form.body.info?.description, 240) || 'no description' },
            { label: 'Revision', value: cleanText(form.body.revisionId, 64) || 'not reported' },
          ],
        });
      } catch (error) {
        failures.push({ id, code: error?.code || 'GOOGLE_API_ERROR' });
      }
    }
    return {
      items,
      count: items.length,
      truncated: false,
      failures,
      selection: { ids: [...ids], selected: ids.length },
      provenance: {
        api: 'Google Forms API v1',
        mode: 'read-only',
        note: 'Forms has no discovery endpoint. Add a form URL to read its definition; responses are not requested.',
      },
      quota: null,
    };
  }

  /* --------------------------------------------------------------- Contacts */

  async readContacts(token) {
    const url = new URL(`${this.endpoints.people}/people/me/connections`);
    url.searchParams.set('personFields', 'names,emailAddresses,phoneNumbers,organizations');
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('sortOrder', 'LAST_MODIFIED_DESCENDING');
    const result = await this.fetchJson(url.toString(), token, 'contacts');
    const connections = Array.isArray(result.body.connections) ? result.body.connections.slice(0, this.maxItems) : [];
    const items = connections.map((person, index) => {
      const name = cleanText(person?.names?.[0]?.displayName, 120) || '(unnamed contact)';
      const email = cleanText(person?.emailAddresses?.[0]?.value, 160);
      const phone = cleanText(person?.phoneNumbers?.[0]?.value, 60);
      const organization = cleanText(person?.organizations?.[0]?.name, 120);
      return {
        id: String(person?.resourceName || `contact-${index}`),
        title: name,
        subtitle: email || phone || organization || 'no contact detail',
        meta: organization || (email ? 'email' : 'phone'),
        status: 'live',
        fields: [
          { label: 'Email', value: email || 'not provided' },
          { label: 'Phone', value: phone || 'not provided' },
          { label: 'Organization', value: organization || 'not provided' },
          { label: 'Directory', value: 'Google Contacts (read-only)' },
        ],
      };
    });
    return {
      items,
      count: items.length,
      truncated: Boolean(result.body.nextPageToken) || connections.length >= this.maxItems,
      failures: [],
      provenance: {
        api: 'Google People API v1',
        mode: 'read-only',
        note: 'Reads the connected account’s own contacts only; other contacts are not requested.',
      },
      quota: null,
    };
  }

  /* --------------------------------------------------------------- Calendar */

  async readCalendar(token) {
    const startOfToday = new Date(this.now());
    startOfToday.setHours(0, 0, 0, 0);
    const url = new URL(`${this.endpoints.calendar}/calendars/primary/events`);
    url.searchParams.set('maxResults', String(this.maxItems));
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('timeMin', startOfToday.toISOString());
    const result = await this.fetchJson(url.toString(), token, 'calendar');
    const events = Array.isArray(result.body.items) ? result.body.items.slice(0, this.maxItems) : [];
    const items = events.map((event, index) => {
      const start = isoDate(event?.start?.dateTime || event?.start?.date);
      const end = isoDate(event?.end?.dateTime || event?.end?.date);
      const attendees = Array.isArray(event?.attendees) ? event.attendees.length : 0;
      return {
        id: String(event?.id || `event-${index}`),
        title: cleanText(event?.summary, 160) || '(no title)',
        subtitle: cleanText(event?.organizer?.displayName || event?.organizer?.email, 160) || 'Primary calendar',
        meta: start ? `${start.slice(0, 10)} ${start.slice(11, 16)}`.trim() : 'no start time',
        status: event?.status === 'cancelled' ? 'muted' : 'live',
        fields: [
          { label: 'Starts', value: start || 'not provided' },
          { label: 'Ends', value: end || 'not provided' },
          { label: 'Location', value: cleanText(event?.location, 160) || 'not provided' },
          { label: 'Attendees', value: String(attendees) },
        ],
      };
    });
    return {
      items,
      count: items.length,
      truncated: Boolean(result.body.nextPageToken) || events.length >= this.maxItems,
      failures: [],
      provenance: {
        api: 'Google Calendar API v3',
        mode: 'read-only',
        note: 'Primary calendar events from the start of today, ordered by start time.',
      },
      quota: null,
    };
  }

  /* ------------------------------------------------------------------ Drive */

  async readDrive(token, request) {
    const url = new URL(`${this.endpoints.drive}/files`);
    url.searchParams.set('pageSize', String(this.maxItems));
    url.searchParams.set('orderBy', 'modifiedTime desc');
    url.searchParams.set('q', cleanText(request.query, 200) || 'trashed=false');
    url.searchParams.set(
      'fields',
      'nextPageToken,files(id,name,mimeType,modifiedTime,size,owners(displayName),webViewLink)'
    );
    const result = await this.fetchJson(url.toString(), token, 'picker');
    const files = Array.isArray(result.body.files) ? result.body.files.slice(0, this.maxItems) : [];
    const items = files.map((file, index) => {
      const mime = String(file?.mimeType || '');
      const size = Number(file?.size);
      return {
        id: String(file?.id || `file-${index}`),
        title: cleanText(file?.name, 160) || '(untitled file)',
        subtitle: cleanText(file?.owners?.[0]?.displayName, 120) || 'Drive',
        meta: mimeToLabel(mime),
        status: 'live',
        fields: [
          { label: 'Type', value: mimeToLabel(mime) },
          { label: 'Modified', value: isoDate(file?.modifiedTime) || 'not provided' },
          { label: 'Size', value: Number.isFinite(size) && size > 0 ? formatBytes(size) : 'not reported' },
          { label: 'Owner', value: cleanText(file?.owners?.[0]?.displayName, 120) || 'not provided' },
        ],
      };
    });
    return {
      items,
      count: items.length,
      truncated: Boolean(result.body.nextPageToken) || files.length >= this.maxItems,
      failures: [],
      provenance: {
        api: 'Google Drive API v3',
        mode: 'read-only metadata',
        note: 'Drive metadata browse: the Google Picker JavaScript API is not embedded, so the token never leaves the main process. File contents are not downloaded.',
      },
      quota: null,
    };
  }

  /* ----------------------------------------------------------------- Slides */

  async readSlides(token) {
    const ids = await this.selectionIds('slides');
    const items = [];
    const failures = [];
    for (const id of ids) {
      try {
        const url = new URL(`${this.endpoints.slides}/presentations/${encodeURIComponent(id)}`);
        url.searchParams.set('fields', 'presentationId,title,revisionId,slides(objectId),locale');
        const deck = await this.fetchJson(url.toString(), token, 'slides');
        const slideCount = Array.isArray(deck.body.slides) ? deck.body.slides.length : 0;
        items.push({
          id,
          title: cleanText(deck.body.title, 160) || '(untitled presentation)',
          subtitle: `${slideCount} slide${slideCount === 1 ? '' : 's'}`,
          meta: cleanText(deck.body.locale, 32) || 'locale not reported',
          status: 'live',
          fields: [
            { label: 'Slides', value: String(slideCount) },
            { label: 'Locale', value: cleanText(deck.body.locale, 32) || 'not reported' },
            { label: 'Revision', value: cleanText(deck.body.revisionId, 64) || 'not reported' },
            { label: 'Access', value: 'read-only' },
          ],
        });
      } catch (error) {
        failures.push({ id, code: error?.code || 'GOOGLE_API_ERROR' });
      }
    }
    return {
      items,
      count: items.length,
      truncated: false,
      failures,
      selection: { ids: [...ids], selected: ids.length },
      provenance: {
        api: 'Google Slides API v1',
        mode: 'read-only',
        note: 'Slides has no discovery endpoint. Add a presentation URL to read its outline; slide content is not exported.',
      },
      quota: null,
    };
  }

  /* ------------------------------------------------------------------- Chat */

  async readChat(token) {
    const url = new URL(`${this.endpoints.chat}/spaces`);
    url.searchParams.set('pageSize', String(Math.min(this.maxItems, 100)));
    const result = await this.fetchJson(url.toString(), token, 'chat');
    const spaces = Array.isArray(result.body.spaces) ? result.body.spaces.slice(0, this.maxItems) : [];
    const items = spaces.map((space, index) => ({
      id: String(space?.name || `space-${index}`),
      title: cleanText(space?.displayName, 160) || cleanText(space?.name, 80) || '(unnamed space)',
      subtitle: cleanText(space?.spaceType, 60) || 'Chat space',
      meta: space?.threaded === true ? 'threaded' : 'flat',
      status: 'live',
      fields: [
        { label: 'Resource', value: cleanText(space?.name, 80) || 'not provided' },
        { label: 'Type', value: cleanText(space?.spaceType, 60) || 'not provided' },
        { label: 'Threading', value: space?.threaded === true ? 'threaded' : 'flat' },
        { label: 'Messages', value: 'not requested by this read-only view' },
      ],
    }));
    return {
      items,
      count: items.length,
      truncated: Boolean(result.body.nextPageToken) || spaces.length >= this.maxItems,
      failures: [],
      provenance: {
        api: 'Google Chat API v1',
        mode: 'read-only',
        note: 'Lists spaces the account can see. Message history is not requested, so no chat content is cached.',
      },
      quota: null,
    };
  }

  /* -------------------------------------------------------------- Classroom */

  async readClassroom(token) {
    const url = new URL(`${this.endpoints.classroom}/courses`);
    url.searchParams.set('pageSize', String(Math.min(this.maxItems, 100)));
    url.searchParams.set('courseStates', 'ACTIVE');
    const result = await this.fetchJson(url.toString(), token, 'classroom');
    const courses = Array.isArray(result.body.courses) ? result.body.courses.slice(0, this.maxItems) : [];
    const items = courses.map((course, index) => ({
      id: String(course?.id || `course-${index}`),
      title: cleanText(course?.name, 160) || '(untitled course)',
      subtitle: cleanText(course?.section, 120) || cleanText(course?.room, 80) || 'Google Classroom',
      meta: cleanText(course?.courseState, 40) || 'active',
      status: 'live',
      fields: [
        { label: 'Section', value: cleanText(course?.section, 120) || 'not provided' },
        { label: 'Room', value: cleanText(course?.room, 80) || 'not provided' },
        { label: 'State', value: cleanText(course?.courseState, 40) || 'active' },
        { label: 'Created', value: isoDate(course?.creationTime) || 'not reported' },
      ],
    }));
    return {
      items,
      count: items.length,
      truncated: Boolean(result.body.nextPageToken) || courses.length >= this.maxItems,
      failures: [],
      provenance: {
        api: 'Google Classroom API v1',
        mode: 'read-only',
        note: 'Active courses only. Coursework, students and grades are not requested.',
      },
      quota: null,
    };
  }
}

function mimeToLabel(mime) {
  const value = String(mime || '');
  if (!value) return 'unknown type';
  if (value === 'application/vnd.google-apps.folder') return 'folder';
  if (value === 'application/vnd.google-apps.document') return 'Google Doc';
  if (value === 'application/vnd.google-apps.spreadsheet') return 'Google Sheet';
  if (value === 'application/vnd.google-apps.presentation') return 'Google Slides';
  if (value === 'application/vnd.google-apps.form') return 'Google Form';
  if (value === 'application/pdf') return 'PDF';
  if (value.startsWith('image/')) return 'image';
  if (value.startsWith('video/')) return 'video';
  if (value.startsWith('audio/')) return 'audio';
  return value;
}

function formatBytes(value) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = Number(value);
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 || size >= 10 || Number.isInteger(size) ? size.toFixed(0) : size.toFixed(1);
  return `${rounded} ${units[unit]}`;
}

module.exports = {
  CONTRACT,
  DEFAULT_ENDPOINTS,
  TRUSTED_ORIGINS,
  SELECTION_PRODUCTS,
  SELECTION_LIMIT,
  MAX_ITEMS,
  IdSelectionStore,
  GoogleWorkspaceService,
  parseFormInput,
  parseSlideInput,
  apiErrorFor,
  mimeToLabel,
  formatBytes,
};
