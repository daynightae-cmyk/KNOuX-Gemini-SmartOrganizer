'use strict';

/**
 * KNOuX Gemini - Service Workbench Host regression test (Mission 15A).
 *
 * The host must provide a real pinned/expanded surface, resize and focus
 * behavior, and Files must render its specialized bodies inside it. This is a
 * source gate; Electron smoke proves the rendered interaction.
 */

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const appRoot = path.join(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), 'utf8');
const host = read('src/components/workbench/ServiceWorkbenchHost.tsx');
const filesPage = read('src/pages/FilesPage.tsx');
const filesBody = read('src/files/FilesServiceFocus.tsx');
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

console.log('[workbench-host-test]');

check('typed host exposes side and expanded modes', () => {
  assert.match(host, /export type WorkbenchMode = 'side' \| 'expanded'/);
  assert.match(host, /mode === 'expanded'/);
  assert.match(host, /data-workbench-mode/);
  assert.match(host, /workbench-mode-toggle/);
  assert.match(host, /workbench-close/);
});

check('host is resizable, keyboard operable and does not auto-trap side focus', () => {
  assert.match(host, /role="separator"/);
  assert.match(host, /onPointerDown=\{beginResize\}/);
  assert.match(host, /ArrowLeft/);
  assert.match(host, /event\.key === 'Escape'/);
  assert.match(host, /aria-label/);
  assert.ok(!/aria-modal/.test(host), 'side workbench must not be a modal');
});

check('host preserves selections because it owns only chrome/scroll', () => {
  assert.match(host, /children: React\.ReactNode/);
  assert.match(host, /toolSelector/);
  assert.match(host, /footer/);
  assert.match(host, /overflow-y-auto/);
});

check('Files integrates the host with specialized bodies and persistence', () => {
  assert.match(filesPage, /ServiceWorkbenchHost/);
  assert.match(filesPage, /testId="files-workbench"/);
  assert.match(filesPage, /testId="files-workbench-expanded"/);
  assert.match(filesPage, /files-workbench-tool-select/);
  assert.match(filesPage, /knoux\.files\.workbench\.mode/);
  assert.match(filesPage, /knoux\.files\.workbench\.width/);
  assert.match(filesPage, /renderFilesServiceBody/);
  assert.match(filesPage, /FilesServiceFocus[\s\S]*embedded/);
  assert.match(filesPage, /data-testid="files-select-all"/);
  assert.match(filesPage, /data-testid="files-footer"/);
  assert.match(filesPage, /bottom-12/);
});

check('Files service bodies are not empty generic sheets', () => {
  assert.match(filesBody, /files-downloads-workbench/);
  assert.match(filesBody, /Category distribution/);
  assert.match(filesBody, /Recent indexed files/);
  assert.match(filesBody, /Plan in Studio/);
  assert.match(filesBody, /BLOCKED\. No apply or undo capability/);
});

check('no old generic ServiceWorkspaceHost is imported by Files', () => {
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(filesPage), 'old generic host must not be used');
});

const result = { ok: failures.length === 0, checks: 6, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
console.log('[workbench-host-test] PASS');
