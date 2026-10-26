'use strict';

/**
 * KNOuX Gemini - Google Workspace consent-gate regression test (Mission 04).
 *
 * Static source guarantees only. The Electron smoke proves the rendered hub;
 * live OAuth remains blocked because no client, grant, token or native secure
 * store exists. This test refuses a return to simulated connected states.
 */

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const appRoot = path.join(__dirname, '..');
const sourcePath = path.join(appRoot, 'src', 'components', 'workspace', 'GoogleWorkspaceHub.tsx');
const source = fs.readFileSync(sourcePath, 'utf8');
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
  assert.ok(!/localStorage|sessionStorage/.test(source), 'token-like browser storage is forbidden');
});

check('the header exposes an honest unconfigured state', () => {
  assert.match(source, /data-testid="workspace-connection-state"/);
  assert.match(source, /Not connected — OAuth unconfigured/);
  assert.match(source, /Review Google access/);
});

check('the consent review lists all 10 scopes and gates its action', () => {
  assert.match(source, /data-testid="workspace-oauth-modal"/);
  assert.match(source, /state: 'authorization-not-requested'/);
  assert.match(source, /connected: false/);
  assert.match(source, /tokenStored: false/);
  assert.match(source, /data-testid="workspace-oauth-copy"/);
  assert.match(source, /disabled=\{!HUB_SERVICES\.some/);
  assert.match(source, /HUB_SERVICES\.map\(\(service\) =>/);
});

check('service actions state that nothing was executed', () => {
  assert.match(source, /Preview only:/);
  assert.match(source, /was not executed/);
  assert.match(source, /No Google connection or OAuth token exists/);
});

check('fixtures and local-only writes remain explicitly labelled', () => {
  assert.match(source, /Fixture Mode/);
  assert.match(source, /no Google account is connected/);
  assert.match(source, /Stays inside this browser only/);
  assert.match(source, /No operation performed against Google/);
});

check('the OAuth dialog is keyboard reachable and Escape closes it', () => {
  assert.match(source, /oauthCloseRef\.current\?\.focus\(\)/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-labelledby="workspace-oauth-title"/);
});

const result = { ok: failures.length === 0, services: 10, scopes: SCOPES.length, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
console.log('[workspace-consent-test] PASS');
