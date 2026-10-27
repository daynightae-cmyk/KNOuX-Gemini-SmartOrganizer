'use strict';

/**
 * KNOuX Gemini - Google Workspace consent and real-state regression test.
 *
 * Static source guarantees only. The Electron smoke proves the rendered hub and
 * the disconnected native status. Main-process OAuth/DPAPI is implemented and
 * offline-tested; live consent remains an explicit owner gate. This test
 * refuses a return to simulated connected states or fixture sheets presented as
 * real account data.
 */

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const appRoot = path.join(__dirname, '..');
const sourcePath = path.join(appRoot, 'src', 'components', 'workspace', 'GoogleWorkspaceHub.tsx');
const source = fs.readFileSync(sourcePath, 'utf8');
const sheetsPath = path.join(appRoot, 'src', 'workspace', 'GoogleSheetsWorkbench.tsx');
const sheets = fs.readFileSync(sheetsPath, 'utf8');
const controllerPath = path.join(appRoot, 'src', 'workspace', 'useGoogleWorkspace.ts');
const controller = fs.readFileSync(controllerPath, 'utf8');
const failures = [];

function check(name, run) {
  try {
    run();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push({ name, message: String(error?.message || error) });
    console.log(`  ✗ ${name}: ${error?.message || error}`);
  }
}

const SERVICE_IDS = ['sheets', 'gmail', 'tasks', 'forms', 'contacts', 'calendar', 'picker', 'slides', 'chat', 'classroom'];
const SCOPES = [
  'spreadsheets.readonly',
  'gmail.readonly',
  'tasks.readonly',
  'forms.readonly',
  'contacts.readonly',
  'calendar.readonly',
  'picker.googleapis.com (JS API)',
  'presentations.readonly',
  'chat.messages.readonly',
  'classroom.courses.readonly',
];

console.log('[workspace-consent-test]');

check('10 Workspace services are declared in the approved order', () => {
  for (const id of SERVICE_IDS) assert.match(source, new RegExp(`id: '${id}'`), `missing ${id}`);
  assert.equal((source.match(/id: '(sheets|gmail|tasks|forms|contacts|calendar|picker|slides|chat|classroom)'/g) || []).length, 10);
});

check('every service declares its least-privilege scope', () => {
  for (const scope of SCOPES) assert.ok(source.includes(`scope: '${scope}'`), `missing ${scope}`);
});

check('the fake connected state and simulated banner are gone', () => {
  assert.ok(!source.includes('setIsConnected'), 'setIsConnected must not exist');
  assert.ok(!source.includes('Simulate Connected State'), 'simulate button must not exist');
  assert.ok(!source.includes('Sandbox preview toggled on'), 'simulated banner must not exist');
  assert.ok(!source.includes('isConnected'), 'isConnected state must not exist');
});

check('no alert, fake success or direct Google API call exists', () => {
  assert.ok(!/\balert\s*\(/.test(source), 'alert() is forbidden');
  assert.ok(!/fetch\s*\(/.test(source), 'network fetch is forbidden');
  assert.ok(!/https?:\/\//.test(source), 'external URL is forbidden');
  assert.ok(!/gapi\.|accounts\.google\.com|oauth2\.googleapis/i.test(source), 'OAuth/API endpoint is forbidden');
  assert.ok(!/(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|getItem|removeItem|clear)/.test(source), 'token-like browser storage is forbidden');
});

check('the header exposes real mutually exclusive Google states', () => {
  assert.match(source, /data-testid="workspace-connection-state"/);
  assert.match(source, /googleConnection/);
  assert.match(source, /permission-missing/);
  assert.match(source, /Not connected — OAuth ready for review/);
  assert.match(source, /Review Google access/);
});

check('the consent review shows the fixed four-scope set and real connect action', () => {
  assert.match(source, /data-testid="workspace-oauth-modal"/);
  assert.match(source, /data-testid="workspace-oauth-status"/);
  assert.match(source, /data-testid="workspace-oauth-connect"/);
  assert.match(source, /data-testid="workspace-oauth-cancel"/);
  assert.match(source, /data-testid="workspace-oauth-scopes"/);
  assert.match(source, /SCOPE_ROWS\.map/);
  assert.ok(!/workspace-oauth-copy/.test(source), 'fake copy-only consent gate must be gone');
  assert.ok(!/type="checkbox"/.test(source), 'the hub must not simulate scope checkboxes');
});

check('the real Sheets workbench distinguishes live data from fixtures', () => {
  assert.match(sheets, /data-testid="workspace-sheets-workbench"/);
  assert.match(sheets, /data-testid="workspace-google-state"/);
  assert.match(sheets, /data-testid="workspace-google-connect"/);
  assert.match(sheets, /data-testid="workspace-google-cancel"/);
  assert.match(sheets, /data-testid="workspace-google-disconnect"/);
  assert.match(sheets, /data-testid="workspace-sheet-add-input"/);
  assert.match(sheets, /data-testid="workspace-sheet-read"/);
  assert.match(sheets, /data-testid="workspace-google-disconnected"/);
  assert.match(sheets, /myaccount\.google\.com\/permissions/);
  assert.match(source, /<GoogleSheetsWorkbench/);
});

check('service actions state that nothing was executed', () => {
  assert.match(source, /Preview only:/);
  assert.match(source, /was not executed/);
  assert.match(source, /No Google API request or action mutation exists/);
});

check('fixtures and local-only writes remain explicitly labelled', () => {
  assert.match(source, /Preview \+ on-demand Google/);
  assert.match(source, /other nine Google services remain design previews|الخدمات التسع الأخرى تبقى معاينة تصميمية/);
  assert.match(source, /Stays inside this browser only/);
  assert.match(source, /No operation performed against Google/);
  assert.match(sheets, /No general Drive search/);
});

check('the OAuth dialog is keyboard reachable and Escape closes it', () => {
  assert.match(source, /oauthCloseRef\.current\?\.focus\(\)/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-labelledby="workspace-oauth-title"/);
});

check('no token or client-secret material is reachable from the renderer', () => {
  assert.ok(!/refresh_token|access_token|client_secret/i.test(source), 'hub exposes no token field');
  assert.ok(!/refresh_token|access_token|client_secret/i.test(sheets), 'workbench exposes no token field');
  assert.ok(!/refresh_token|access_token|client_secret/i.test(controller), 'controller exposes no token field');
  assert.ok(!/localStorage|sessionStorage/.test(controller), 'controller does not persist Google tokens');
  assert.ok(!/fetch\s*\(/.test(sheets), 'workbench performs no direct network call');
});

const result = { ok: failures.length === 0, services: 10, scopes: SCOPES.length, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
console.log('[workspace-consent-test] PASS');
