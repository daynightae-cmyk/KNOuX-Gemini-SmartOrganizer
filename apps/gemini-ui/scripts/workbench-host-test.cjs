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
const studioPage = read('src/studio/StudioPage.tsx');
const studioContext = read('src/studio/StudioStageContextPanel.tsx');
const studioParts = read('src/studio/parts.tsx');
const storagePage = read('src/pages/StoragePage.tsx');
const storageFocus = read('src/storage/StorageServiceFocus.tsx');
const scanPage = read('src/smart-scan/SmartScanPage.tsx');
const scanBody = read('src/smart-scan/ScanServiceWorkspace.tsx');
const appsPage = read('src/pages/ApplicationsPage.tsx');
const appsBody = read('src/apps/AppServiceWorkspace.tsx');
const cleanupPage = read('src/pages/CleanupPage.tsx');
const cleanupBody = read('src/cleanup/ServiceWorkspace.tsx');
const startupPage = read('src/pages/StartupPage.tsx');
const startupBody = read('src/startup/ServiceWorkspace.tsx');
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

check('Studio embeds one consent-bound operation model instead of a generic overlay', () => {
  const operations=read('src/operations/OrganizationLiveWorkbench.tsx');
  assert.match(studioPage, /knoux-studio-operation-stage/);
  assert.match(operations, /createPortal/);
  assert.match(operations, /window\.knouxOperationsV1/);
  assert.doesNotMatch(operations, /ServiceWorkbenchHost|node:fs|child_process/);
  assert.match(operations, /os-action-dock/);
  assert.match(operations, /data-workbench-mode/);
  // Runtime stage, selection, consent and restore are exercised by live-organization-electron.mjs.
});

check('Storage integrates a pinned/expanded workbench with measured bodies', () => {
  assert.match(storagePage, /ServiceWorkbenchHost/);
  assert.match(storagePage, /testId="storage-workbench"/);
  assert.match(storagePage, /testId="storage-workbench-expanded"/);
  assert.match(storagePage, /storage-workbench-tool-select/);
  assert.match(storagePage, /knoux\.storage\.workbench\.mode/);
  assert.match(storagePage, /knoux\.storage\.workbench\.width/);
  assert.match(storagePage, /data-testid="storage-workspace"/);
  assert.match(storageFocus, /embedded\?: boolean/);
  assert.match(storageFocus, /storage-service-focus/);
});

check('Scan integrates a pinned/expanded workbench with measured service bodies', () => {
  assert.match(scanPage, /ServiceWorkbenchHost/);
  assert.match(scanPage, /testId="scan-workbench"/);
  assert.match(scanPage, /testId="scan-workbench-expanded"/);
  assert.match(scanPage, /scan-workbench-tool-select/);
  assert.match(scanPage, /knoux\.scan\.workbench\.mode/);
  assert.match(scanPage, /knoux\.scan\.workbench\.width/);
  assert.match(scanPage, /data-testid="scan-workspace"/);
  assert.match(scanBody, /embedded\?: boolean/);
  assert.match(scanBody, /scan-service-focus/);
  assert.match(scanBody, /scan-service-run/);
  assert.match(scanBody, /onOpenCleanupGate/);
});

check('Applications integrates a pinned/expanded workbench over the register', () => {
  assert.match(appsPage, /ServiceWorkbenchHost/);
  assert.match(appsPage, /testId="apps-workbench"/);
  assert.match(appsPage, /testId="apps-workbench-expanded"/);
  assert.match(appsPage, /apps-workbench-tool-select/);
  assert.match(appsPage, /knoux\.apps\.workbench\.mode/);
  assert.match(appsPage, /knoux\.apps\.workbench\.width/);
  assert.match(appsPage, /data-testid="apps-workspace"/);
  assert.match(appsBody, /embedded\?: boolean/);
  assert.match(appsBody, /app-service-focus/);
});

check('Cleanup integrates a pinned/expanded workbench with gated service bodies', () => {
  assert.match(cleanupPage, /ServiceWorkbenchHost/);
  assert.match(cleanupPage, /testId="cleanup-workbench"/);
  assert.match(cleanupPage, /testId="cleanup-workbench-expanded"/);
  assert.match(cleanupPage, /cleanup-workbench-tool-select/);
  assert.match(cleanupPage, /knoux\.cleanup\.workbench\.mode/);
  assert.match(cleanupPage, /knoux\.cleanup\.workbench\.width/);
  assert.match(cleanupPage, /data-testid="cleanup-workspace"/);
  assert.match(cleanupPage, /data-testid="cleanup-actionbar"/);
  assert.match(cleanupBody, /embedded\?: boolean/);
  assert.match(cleanupBody, /cleanup-service-focus/);
  assert.match(cleanupBody, /renderWorkspaceBody/);
});

check('Startup integrates a pinned/expanded workbench with gated service bodies', () => {
  assert.match(startupPage, /ServiceWorkbenchHost/);
  assert.match(startupPage, /testId="startup-workbench"/);
  assert.match(startupPage, /testId="startup-workbench-expanded"/);
  assert.match(startupPage, /startup-workbench-tool-select/);
  assert.match(startupPage, /knoux\.startup\.workbench\.mode/);
  assert.match(startupPage, /knoux\.startup\.workbench\.width/);
  assert.match(startupPage, /data-testid="startup-workspace"/);
  assert.match(startupPage, /data-testid="startup-actionbar"/);
  assert.match(startupBody, /embedded\?: boolean/);
  assert.match(startupBody, /startup-service-focus/);
});

check('no old generic ServiceWorkspaceHost is imported by any migrated domain', () => {
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(filesPage), 'old generic host must not be used by Files');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(studioPage), 'old generic host must not be used by Studio');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(storagePage), 'old generic host must not be used by Storage');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(scanPage), 'old generic host must not be used by Scan');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(appsPage), 'old generic host must not be used by Applications');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(cleanupPage), 'old generic host must not be used by Cleanup');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(startupPage), 'old generic host must not be used by Startup');
});

const result = { ok: failures.length === 0, checks: 12, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
console.log('[workbench-host-test] PASS');
