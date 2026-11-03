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
const systemPage = read('src/pages/SystemPage.tsx');
const systemBody = read('src/system/SystemServiceWorkspaces.tsx');
const systemCss = read('src/system.css');
const servicesPage = read('src/pages/ServicesPage.tsx');
const servicesBody = read('src/services/ServicesServiceWorkspaces.tsx');
const servicesRail = read('src/services/ServicesServiceRail.tsx');
const repairPage = read('src/pages/RepairPage.tsx');
const repairBody = read('src/repair/RepairServiceWorkspaces.tsx');
const automationPage = read('src/pages/AutomationPage.tsx');
const automationBody = read('src/automation/AutomationServiceWorkspaces.tsx');
const automationRail = read('src/automation/AutomationServiceRail.tsx');
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
  assert.doesNotMatch(host, /\n\s+aria-modal=/, 'side workbench must not be a modal');
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
  // The apply body was reworded in 2351fae from "BLOCKED. No apply or undo" to the
  // explicit Studio-stage-07 handoff. Keep asserting the real guarantee: Files itself
  // exposes no execute channel and execution stays inside Studio's consent gate.
  assert.match(filesBody, /Execution happens only inside Studio stage 07/);
  assert.match(filesBody, /No execute channel is exposed in Files/);
  assert.match(filesBody, /verified inverse/);
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

check('System/Network/Hardware integrates a pinned/expanded workbench with 36 measured bodies', () => {
  assert.match(systemBody, /ServiceWorkbenchHost/);
  assert.match(systemBody, /data-testid="system-workbench-side-shell"/);
  assert.match(systemBody, /data-testid="system-workbench-expanded-shell"/);
  assert.match(systemBody, /testId="system-workbench"/);
  assert.match(systemBody, /testId="system-workbench-expanded"/);
  assert.match(systemBody, /mode === 'side'/);
  assert.match(systemPage, /system-workbench-tool-select/);
  assert.match(systemPage, /knoux\.system\.workbench\.mode/);
  assert.match(systemPage, /knoux\.system\.workbench\.width/);
  assert.match(systemPage, /data-testid="system-workspace"/);
  assert.match(systemPage, /data-testid="system-actionbar"/);
  // Phase II interior: the 36 registry services are selectable through the shared
  // dock, measured native state is reported by SystemLiveStage and the selected
  // service mounts exactly one specialized body. The floating host only mounts on
  // explicit detach; the integrated grid and the pinned host never duplicate it.
  assert.match(systemPage, /import \{ SystemServiceRail \}/);
  assert.match(systemPage, /import \{ SystemLiveStage \}/);
  assert.match(systemPage, /system\/system-inner-workspace\.css/);
  assert.match(systemPage, /ids=\{SERVICE_CATALOG\.map\(\(entry\) => entry\.id\)\}/);
  assert.match(systemPage, /data-testid=\{`system-catalog-\$\{entry\.id\}`\}/);
  assert.doesNotMatch(systemPage, /import \{ CommandCanvas \}/);
  assert.match(systemPage, /className="[^"]*system-header-bridge/);
  assert.match(systemPage, /activeService && snapshot && !detached \? \(/);
  assert.match(systemPage, /activeService && snapshot && detached \? \(/);
  assert.match(systemPage, /data-testid="system-integrated-service"/);
  assert.match(systemPage, /onClose=\{\(\) => setDetached\(false\)\}/);
  const mapped = systemBody.match(/^\s{2}'(?:system|network|hardware)-[a-z0-9-]+':\s*[A-Za-z]/gm) || [];
  assert.equal(mapped.length, 36, `expected 36 service workbench entries, found ${mapped.length}`);
  // The pinned rail is narrower than the full sheet, so the shared host needs
  // explicit layout adaptation and no 5px status dot left behind in a chip row.
  assert.match(systemCss, /\[data-workbench-mode='side'\] \.sys-split-2,/);
  assert.match(systemCss, /\[data-workbench-mode='side'\] \.sys-adapter-card,[\s\S]*flex-wrap: wrap/);
  assert.match(systemCss, /\.sys-lane-sev \{[\s\S]*?flex-wrap: wrap;[\s\S]*?\}/);
  assert.match(systemCss, /\.sys-timeline-row \{[\s\S]*?grid-template-columns: 34px 88px minmax\(0, 1fr\) auto;/);
});

check('Services integrates the shared host with pinned/expanded modes', () => {
  assert.match(servicesBody, /ServiceWorkbenchHost/);
  assert.match(servicesBody, /data-testid="services-workbench-side-shell"/);
  assert.match(servicesBody, /data-testid="services-workbench-expanded-shell"/);
  assert.match(servicesBody, /mode === 'side'/);
  assert.match(servicesPage, /services-workbench-tool-select/);
  assert.match(servicesPage, /knoux\.services\.workbench\.mode/);
  assert.match(servicesPage, /knoux\.services\.workbench\.width/);
  assert.match(servicesPage, /data-testid="services-workspace"/);
  assert.match(servicesPage, /data-testid="services-actionbar"/);
  // Phase II interior: all 12 tools are selectable through the shared dock, the
  // measured SCM register is reported by ServicesLiveStage, and the selected
  // tool mounts exactly one specialized body. The floating host only mounts on
  // explicit detach; the integrated panel and the pinned host never duplicate it.
  assert.match(servicesPage, /import \{ ServicesServiceRail \}/);
  assert.match(servicesPage, /import \{ ServicesLiveStage \}/);
  assert.match(servicesPage, /services\/services-inner-workspace\.css/);
  assert.match(servicesRail, /testIdPrefix="services"/);
  assert.match(servicesRail, /SERVICES_TOOLS\.map/);
  assert.match(servicesPage, /activeTool && snapshot && !detached \? \(/);
  assert.match(servicesPage, /activeTool && snapshot && detached \? \(/);
  assert.match(servicesPage, /data-testid="services-integrated-service"/);
  assert.match(servicesPage, /data-testid="services-scan-action"/);
  assert.match(servicesPage, /className="[^"]*services-header-bridge/);
  assert.doesNotMatch(servicesPage, /import \{ CommandCanvas \}/);
  // The integrated tool owns no focus trap; Escape and chrome belong to the shared host.
  assert.doesNotMatch(servicesBody, /window\.addEventListener\('keydown'/);
  assert.doesNotMatch(servicesBody, /sys-service-overlay|aria-modal="true"/, 'Services must not render as a modal sheet');
  assert.match(servicesBody, /ServiceStateWorkbench|signed third-party start\/stop only/);
  assert.match(servicesBody, /ServicesServiceBody/);
  assert.match(servicesBody, /svc-embedded-service|embedded/);
});

check('Repair integrates the shared host with pinned/expanded modes', () => {
  assert.match(repairBody, /ServiceWorkbenchHost/);
  assert.match(repairBody, /data-testid="repair-workbench-side-shell"/);
  assert.match(repairBody, /data-testid="repair-workbench-expanded-shell"/);
  assert.match(repairBody, /mode === 'side'/);
  assert.match(repairPage, /repair-workbench-tool-select/);
  assert.match(repairPage, /knoux\.repair\.workbench\.mode/);
  assert.match(repairPage, /knoux\.repair\.workbench\.width/);
  assert.match(repairPage, /data-testid="repair-workspace"/);
  assert.match(repairPage, /data-testid="repair-actionbar"/);
  assert.doesNotMatch(repairBody, /sys-service-overlay|rep-service-overlay|aria-modal="true"/, 'Repair must not render as a modal sheet');
  const mapped = repairBody.match(/^\s{2}'repair-[a-z0-9-]+':\s*[A-Za-z]/gm) || [];
  assert.equal(mapped.length, 12, `expected 12 repair workbench entries, found ${mapped.length}`);
});

check('Automation integrates the shared host and foreground scheduler', () => {
  assert.match(automationBody, /ServiceWorkbenchHost/);
  assert.match(automationBody, /data-testid="automation-workbench-side-shell"/);
  assert.match(automationBody, /data-testid="automation-workbench-expanded-shell"/);
  assert.match(automationBody, /mode === 'side'/);
  assert.match(automationPage, /automation-workbench-tool-select/);
  assert.match(automationPage, /knoux\.automation\.workbench\.mode/);
  assert.match(automationPage, /knoux\.automation\.workbench\.width/);
  assert.match(automationPage, /data-testid="automation-workspace"/);
  assert.match(automationPage, /data-testid="automation-actionbar"/);
  // Phase II interior: all 12 tools are selectable through the shared dock, the
  // measured local store is reported by AutomationLiveStage, and the selected
  // tool mounts exactly one specialized body. The floating host only mounts on
  // explicit detach; the integrated panel and the pinned host never duplicate it.
  assert.match(automationPage, /import \{ AutomationServiceRail \}/);
  assert.match(automationPage, /import \{ AutomationLiveStage \}/);
  assert.match(automationPage, /automation\/automation-inner-workspace\.css/);
  assert.match(automationPage, /activeTool && snapshot && !detached \? \(/);
  assert.match(automationPage, /activeTool && snapshot && detached \? \(/);
  assert.match(automationPage, /data-testid="automation-integrated-service"/);
  assert.match(automationPage, /data-testid="automation-scan-action"/);
  assert.match(automationPage, /className="[^"]*automation-header-bridge/);
  assert.doesNotMatch(automationPage, /import \{ CommandCanvas \}/);
  assert.doesNotMatch(automationBody, /window\.addEventListener\('keydown'/);
  assert.match(automationBody, /AutomationServiceBody/);
  assert.match(automationBody, /auto-embedded-service|embedded/);
  assert.match(automationRail, /testIdPrefix="automation"/);
  assert.match(automationRail, /AUTOMATION_TOOLS\.map/);
  assert.doesNotMatch(automationBody, /sys-service-overlay|auto-service-overlay|aria-modal="true"/, 'Automation must not render as a modal sheet');
  const mapped = automationBody.match(/^\s{2}'auto-[a-z0-9-]+':\s*[A-Za-z]/gm) || [];
  assert.equal(mapped.length, 12, `expected 12 automation workbench entries, found ${mapped.length}`);
  const scheduleBody = read('src/automation/AutomationCoreWorkbenches.tsx');
  assert.match(scheduleBody, /AutomationRunWorkbench[\s\S]*onSave=\{controller\.saveWorkflow\}/, 'Schedule Manager must expose the real foreground scheduler');
});

check('no old generic ServiceWorkspaceHost is imported by any migrated domain', () => {
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(filesPage), 'old generic host must not be used by Files');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(studioPage), 'old generic host must not be used by Studio');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(storagePage), 'old generic host must not be used by Storage');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(scanPage), 'old generic host must not be used by Scan');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(appsPage), 'old generic host must not be used by Applications');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(cleanupPage), 'old generic host must not be used by Cleanup');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(startupPage), 'old generic host must not be used by Startup');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(systemPage), 'old generic host must not be used by System');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(systemBody), 'old generic host must not be used by System bodies');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(servicesPage), 'old generic host must not be used by Services');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(servicesBody), 'old generic host must not be used by Services bodies');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(repairPage), 'old generic host must not be used by Repair');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(repairBody), 'old generic host must not be used by Repair bodies');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(automationPage), 'old generic host must not be used by Automation');
  assert.ok(!/components\/common\/ServiceWorkspaceHost/.test(automationBody), 'old generic host must not be used by Automation bodies');
});

const result = { ok: failures.length === 0, checks: 16, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
console.log('[workbench-host-test] PASS');
