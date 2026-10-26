'use strict';

/**
 * Generates docs/SERVICE_REGISTRY_EVIDENCE.md from the canonical service IDs
 * and the currently implemented section bridges. Keep the overrides current as
 * the activation pass adds real executors. This is a documentation generator;
 * it never touches the app runtime.
 */

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..', '..', '..');
const output = path.join(repoRoot, 'docs', 'SERVICE_REGISTRY_EVIDENCE.md');

const sections = [
  {
    mission: '05 Applications',
    key: 'APPLICATIONS',
    ids: ['app-inventory', 'app-identity', 'app-search', 'app-publisher', 'app-recent', 'app-uninstall-queue', 'app-leftovers', 'app-updates', 'app-size', 'app-store-packages', 'app-associations', 'app-startup-impact'],
    defaults: { cls: 'A', live: 'app bridge / uninstall registry + Appx', action: 'none', ui: 'browse, inspect, export', consent: 'read-only', fixture: 'test:apps controlled registry', post: 'n/a (observation)', journal: 'none', observed: 'dev + packaged smoke', status: 'MEASURED_READ_ONLY', missing: 'none' },
    overrides: {
      'app-uninstall-queue': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Uninstall an application through a reviewed, reversible plan', consent: 'explicit per-run approval', fixture: 'none (plan preview only)', post: 'not implemented', journal: 'preview journal', missing: 'fixed uninstall executor + restore strategy' },
      'app-leftovers': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Clean verified orphan/leftover application data', consent: 'explicit per-run approval', fixture: 'name-match fixture only', post: 'not implemented', journal: 'none', missing: 'provenance proof + deletion executor' },
      'app-updates': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Update an installed application safely', consent: 'explicit per-run approval', fixture: 'WinGet parse fixture', post: 'not implemented', journal: 'none', missing: 'vendor/WinGet executor + rollback plan' },
      'app-associations': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Change a file/protocol association', consent: 'explicit per-type approval', fixture: 'association list only', post: 'not implemented', journal: 'none', missing: 'UserChoice/registry executor + verification' },
      'app-startup-impact': { cls: 'A', status: 'MEASURED_READ_ONLY', outcome: 'See which applications are linked to startup impact', live: 'app + startup bridges', consent: 'read-only', missing: 'none' },
    },
  },
  {
    mission: '06 Files',
    key: 'FILES',
    ids: ['file-downloads-inventory', 'file-organize-preview', 'file-organize-apply', 'file-organize-undo', 'file-empty-folders', 'file-hash', 'file-search', 'file-type-map', 'file-recents', 'file-largest', 'file-metadata', 'file-provenance'],
    defaults: { cls: 'A', live: 'files bridge / authorized Studio inventory', action: 'none', ui: 'browse, filter, hash, export', consent: 'read-only', fixture: 'test:files controlled fixture', post: 'n/a (observation)', journal: 'none', observed: 'dev + packaged smoke', status: 'MEASURED_READ_ONLY', missing: 'none' },
    overrides: {
      'file-organize-preview': { cls: 'B', status: 'PARTIAL', action: 'immutable plan only', outcome: 'Preview a safe file organization plan', consent: 'preview then approval', fixture: 'test:studio plan fixture', post: 'plan hash verified; no files moved', journal: 'preview history', missing: 'approved apply executor' },
      'file-organize-apply': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Apply the approved organization plan with recovery', consent: 'explicit per-plan approval', fixture: 'none (no mutation)', post: 'not implemented', journal: 'none', missing: 'copy/move executor + rollback' },
      'file-organize-undo': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Undo an applied organization plan', consent: 'explicit per-undo approval', fixture: 'none', post: 'not implemented', journal: 'none', missing: 'undo journal and restore executor' },
      'file-downloads-inventory': { cls: 'A', status: 'MEASURED_READ_ONLY', outcome: 'Inventory and inspect Downloads safely', missing: 'none' },
    },
  },
  {
    mission: '07 Storage',
    key: 'STORAGE',
    ids: ['storage-disks', 'storage-large-files', 'storage-duplicates', 'storage-treemap', 'storage-top-folders', 'storage-filetypes', 'storage-scan-overview', 'storage-fragmentation', 'storage-smart', 'storage-reclaim', 'storage-history', 'storage-removable'],
    defaults: { cls: 'A', live: 'Win32 volume provider + authorized inventory', action: 'none', ui: 'browse, compare, treemap, export', consent: 'read-only', fixture: 'test:storage volume/tree/duplicate fixture', post: 'n/a (observation)', journal: 'none', observed: 'dev + packaged smoke', status: 'MEASURED_READ_ONLY', missing: 'none' },
    overrides: {
      'storage-fragmentation': { cls: 'A', status: 'UNSUPPORTED', live: 'none', post: 'n/a', missing: 'fragmentation/defrag provider not supported' },
      'storage-smart': { cls: 'A', status: 'UNSUPPORTED', live: 'none', post: 'n/a', missing: 'SMART/media identity provider unavailable' },
      'storage-removable': { cls: 'A', status: 'PARTIAL', live: 'Win32 logical disks', missing: 'removable/media classification' },
      'storage-reclaim': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Reclaim verified storage safely', consent: 'explicit per-item approval', fixture: 'candidate estimate fixture only', post: 'not implemented', journal: 'none', missing: 'cleanup executor + verification' },
    },
  },
  {
    mission: '08 Cleanup',
    key: 'CLEANUP',
    ids: ['cleanup-temp-preview', 'cleanup-temp-quarantine', 'cleanup-temp-undo', 'cleanup-quarantine-list', 'cleanup-estimate', 'cleanup-recycle', 'cleanup-unused', 'cleanup-update-cache', 'cleanup-browser-cache', 'cleanup-logs', 'cleanup-schedule', 'cleanup-reports'],
    defaults: { cls: 'B', live: 'cleanup bridge / bounded candidates', action: 'absent (gated)', ui: 'preview candidates and plan', consent: 'explicit per-run approval', fixture: 'test:cleanup controlled fixture', post: 'not implemented', journal: 'preview journal only', observed: 'dev + packaged smoke', status: 'PARTIAL', missing: 'approved quarantine/delete executor + undo' },
    overrides: {
      'cleanup-quarantine-list': { cls: 'A', status: 'MEASURED_READ_ONLY', action: 'none', ui: 'browse preview journal', consent: 'read-only', post: 'n/a (observation)', journal: 'preview journal', missing: 'none' },
      'cleanup-estimate': { cls: 'A', status: 'MEASURED_READ_ONLY', action: 'none', ui: 'measure reclaimable candidates', consent: 'read-only', post: 'n/a (observation)', missing: 'none' },
      'cleanup-reports': { cls: 'A', status: 'MEASURED_READ_ONLY', action: 'none', ui: 'inspect/export report', consent: 'read-only', post: 'n/a (observation)', missing: 'none' },
      'cleanup-schedule': { cls: 'B', status: 'PARTIAL', action: 'draft schedule metadata only', outcome: 'Schedule an approved cleanup cadence', post: 'no timer/executor', missing: 'executor + approval + scheduler' },
    },
  },
  {
    mission: '09 Startup',
    key: 'STARTUP',
    ids: ['startup-overview', 'startup-disable', 'startup-restore', 'startup-sources', 'startup-journal', 'startup-filter', 'startup-impact', 'startup-services', 'startup-tasks', 'startup-delay', 'startup-batch', 'startup-undo-all'],
    defaults: { cls: 'A', live: 'startup bridge / Run keys, folders, tasks, services', action: 'none', ui: 'browse, filter, inspect', consent: 'read-only', fixture: 'test:startup controlled fixture', post: 'n/a (observation)', journal: 'preview journal', observed: 'dev + packaged smoke', status: 'MEASURED_READ_ONLY', missing: 'none' },
    overrides: {
      'startup-disable': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Disable a startup entry with restore evidence', consent: 'explicit per-entry approval', fixture: 'plan fixture only', post: 'not implemented', journal: 'plan preview', missing: 'registry/task/service executor + restore' },
      'startup-restore': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Restore a disabled startup entry', consent: 'explicit per-entry approval', fixture: 'none', post: 'not implemented', journal: 'none', missing: 'journal + restore executor' },
      'startup-delay': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Delay a startup entry safely', consent: 'explicit per-entry approval', fixture: 'plan fixture only', post: 'not implemented', journal: 'plan preview', missing: 'delay executor + verification' },
      'startup-batch': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Apply a reviewed batch of startup changes', consent: 'explicit batch approval', fixture: 'plan conflict fixture only', post: 'not implemented', journal: 'plan preview', missing: 'bounded batch executor + rollback' },
      'startup-undo-all': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Undo all applied startup changes', consent: 'explicit undo approval', fixture: 'none', post: 'not implemented', journal: 'none', missing: 'durable changelog + undo executor' },
      'startup-services': { cls: 'A', status: 'MEASURED_READ_ONLY', missing: 'none' },
      'startup-tasks': { cls: 'A', status: 'MEASURED_READ_ONLY', missing: 'none' },
    },
  },
  {
    mission: '10 System',
    key: 'SYSTEM',
    ids: ['system-health-check', 'system-events', 'system-processes', 'system-signatures', 'system-uptime', 'system-perf', 'system-drivers', 'system-logs', 'system-resources', 'system-autostart', 'system-services-map', 'system-timeline', 'network-interfaces', 'network-dns-config', 'network-adapters', 'network-connectivity', 'network-throughput', 'network-traceroute', 'network-topology', 'network-ports', 'network-wifi', 'network-hosts', 'network-proxies', 'network-repair-link', 'hardware-inventory', 'hardware-battery', 'hardware-cpu', 'hardware-gpu', 'hardware-memory', 'hardware-cycles', 'hardware-thermal', 'hardware-disks', 'hardware-usb', 'hardware-display', 'hardware-audio', 'hardware-health-report'],
    defaults: { cls: 'A', live: 'system bridge / CIM, events, Net*, Authenticode', action: 'none', ui: 'inspect, filter, graph, export', consent: 'read-only', fixture: 'test:system controlled provider fixture', post: 'n/a (observation)', journal: 'none', observed: 'dev + packaged smoke', status: 'MEASURED_READ_ONLY', missing: 'none' },
    overrides: {
      'network-hosts': { cls: 'B', status: 'PARTIAL', action: 'immutable preview only', outcome: 'Edit the hosts file with verified rollback', consent: 'explicit per-run plus elevation if needed', fixture: 'preview fixture only', post: 'not implemented', journal: 'preview plan', missing: 'protected hosts executor + restore' },
      'network-proxies': { cls: 'B', status: 'PARTIAL', action: 'immutable preview only', outcome: 'Change the system proxy safely', consent: 'explicit per-run approval', fixture: 'read-only proxy snapshot', post: 'not implemented', journal: 'none', missing: 'proxy executor + postcondition' },
      'network-repair-link': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Repair a broken network link/adapter', consent: 'explicit per-run plus elevation', fixture: 'none', post: 'not implemented', journal: 'none', missing: 'adapter/DNS repair executor' },
      'hardware-battery': { cls: 'A', status: 'PARTIAL', live: 'Win32_Battery where present', missing: 'battery not exposed on this host' },
      'hardware-thermal': { cls: 'A', status: 'PARTIAL', live: 'CIM thermal where present', missing: 'thermal sensor unavailable/partial' },
      'hardware-cycles': { cls: 'A', status: 'PARTIAL', live: 'CIM hardware', missing: 'cycle counters unavailable' },
    },
  },
  {
    mission: '11 Repair',
    key: 'REPAIR',
    ids: ['repair-component-check', 'repair-component-scan', 'repair-component-restore', 'repair-files-verify', 'repair-files-repair', 'repair-dns-flush', 'repair-winsock-reset', 'repair-tcpip-reset', 'repair-history', 'repair-troubleshooters', 'repair-restore-point', 'repair-update-reset'],
    defaults: { cls: 'B', live: 'repair bridge / servicing, adapters, DNS catalog', action: 'absent (gated)', ui: 'preview command and plan', consent: 'explicit per-run plus UAC where needed', fixture: 'test:repair controlled fixture', post: 'not implemented', journal: 'preview journal', observed: 'dev + packaged smoke', status: 'PARTIAL', missing: 'approved elevated executor + verification' },
    overrides: {
      'repair-history': { cls: 'A', status: 'MEASURED_READ_ONLY', action: 'none', ui: 'browse preview history', consent: 'read-only', post: 'n/a (observation)', journal: 'preview journal', missing: 'none' },
      'repair-component-check': { cls: 'A', status: 'PARTIAL', action: 'none', ui: 'inspect component-store metadata', consent: 'read-only', post: 'n/a', journal: 'none', missing: 'DISM CheckHealth execution' },
      'repair-component-scan': { cls: 'A', status: 'PARTIAL', action: 'none', ui: 'inspect component-store metadata', consent: 'read-only', post: 'n/a', journal: 'none', missing: 'DISM ScanHealth execution' },
      'repair-troubleshooters': { cls: 'B', status: 'PARTIAL', action: 'user-initiated settings opener only', outcome: 'Launch the proper Windows troubleshooter', consent: 'user-initiated', fixture: 'none', post: 'not verified', journal: 'none', missing: 'verified OS troubleshooter launch' },
      'repair-restore-point': { cls: 'C', status: 'PARTIAL', action: 'absent (blocked)', outcome: 'Create or restore a system restore point', consent: 'explicit + UAC', fixture: 'access-denied fixture', post: 'not implemented', journal: 'none', missing: 'restore provider/elevation and verified postcondition' },
      'repair-component-restore': { cls: 'C', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Repair the component store', consent: 'explicit + UAC', fixture: 'none', post: 'not implemented', journal: 'preview', missing: 'DISM RestoreHealth executor' },
      'repair-files-repair': { cls: 'C', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Repair protected system files', consent: 'explicit + UAC', fixture: 'none', post: 'not implemented', journal: 'preview', missing: 'SFC executor + verification' },
      'repair-winsock-reset': { cls: 'C', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Reset Winsock safely', consent: 'explicit + UAC + reboot warning', fixture: 'none', post: 'not implemented', journal: 'preview', missing: 'netsh reset executor + reboot gate' },
      'repair-tcpip-reset': { cls: 'C', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Reset TCP/IP safely', consent: 'explicit + UAC + reboot warning', fixture: 'none', post: 'not implemented', journal: 'preview', missing: 'netsh reset executor + reboot gate' },
      'repair-update-reset': { cls: 'C', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Reset update components safely', consent: 'explicit + UAC', fixture: 'none', post: 'not implemented', journal: 'preview', missing: 'update servicing executor + restore' },
      'repair-dns-flush': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Flush DNS cache', consent: 'explicit per-run', fixture: 'none', post: 'not implemented', journal: 'preview', missing: 'ipconfig /flushdns fixed executor' },
    },
  },
  {
    mission: '12 Services',
    key: 'SERVICES',
    ids: ['services-inventory', 'services-control', 'services-undo', 'services-dependencies', 'services-protected', 'services-search', 'services-startup-report', 'services-state-history', 'services-dependents', 'services-diagnose', 'services-config', 'services-perf'],
    defaults: { cls: 'A', live: 'SCM provider + Get-Service dependencies + events', action: 'none', ui: 'browse, graph, inspect, export', consent: 'read-only', fixture: 'test:services controlled SCM fixture', post: 'n/a (observation)', journal: 'preview journal', observed: 'dev + packaged smoke', status: 'MEASURED_READ_ONLY', missing: 'none' },
    overrides: {
      'services-control': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Start/stop/restart a service after dependency review', consent: 'explicit per-service approval', fixture: 'plan fixture only', post: 'not implemented', journal: 'preview plan', missing: 'SCM executor + effective-state verification' },
      'services-undo': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Restore the previous service state', consent: 'explicit undo approval', fixture: 'none', post: 'not implemented', journal: 'preview plan', missing: 'durable service changelog + undo executor' },
      'services-config': { cls: 'B', status: 'PARTIAL', action: 'absent (gated)', outcome: 'Change startup type/recovery safely', consent: 'explicit per-service approval', fixture: 'none', post: 'not implemented', journal: 'none', missing: 'SCM config executor + rollback' },
      'services-startup-report': { cls: 'A', status: 'MEASURED_READ_ONLY', missing: 'none' },
    },
  },
  {
    mission: '13 Automation',
    key: 'AUTOMATION',
    ids: ['auto-smart-scan', 'auto-schedule-manager', 'auto-run-history', 'auto-templates', 'auto-schedule-plan', 'auto-cleanup-plan', 'auto-notify', 'auto-quiet-hours', 'auto-battery-policy', 'auto-retention', 'auto-export', 'auto-backup-plan'],
    defaults: { cls: 'B', live: 'local workflow store, templates, host timezone, power evidence', action: 'draft/dry-run only', ui: 'draft, validate DAG, dry-run, schedule preview', consent: 'explicit save/dry-run; no execution', fixture: 'test:automation controlled store', post: 'no execution; receipt verified', journal: 'dry-run journal', observed: 'dev + packaged smoke', status: 'PARTIAL', missing: 'approved executor, scheduler, idempotent step tokens, crash resume' },
    overrides: {
      'auto-run-history': { cls: 'A', status: 'MEASURED_READ_ONLY', action: 'none', ui: 'browse dry-run journal, export', consent: 'read-only', post: 'n/a', journal: 'dry-run journal', missing: 'none' },
      'auto-export': { cls: 'A', status: 'IMPLEMENTED_AND_TESTED', action: 'local JSON export/import validation', ui: 'export draft, validate import', consent: 'user-initiated local file', post: 'schema/DAG validation', journal: 'none', missing: 'none for local drafts' },
      'auto-templates': { cls: 'B', status: 'PARTIAL', action: 'deep draft instantiation only', ui: 'preview nodes, instantiate draft', consent: 'explicit save', post: 'draft persisted; no execution', journal: 'none', missing: 'executor for template actions' },
      'auto-schedule-plan': { cls: 'B', status: 'PARTIAL', action: 'host-timezone preview only', ui: 'recurrence builder, occurrence preview', consent: 'explicit preview', post: 'occurrences computed; no job scheduled', journal: 'none', missing: 'scheduler + DST persisted job + execution' },
      'auto-notify': { cls: 'D', status: 'PARTIAL', action: 'in-app sample only', ui: 'policy editor', consent: 'explicit per-message for external channels', post: 'no external message sent', journal: 'none', missing: 'external channel provider + consent' },
      'auto-backup-plan': { cls: 'B', status: 'PARTIAL', action: 'draft only', ui: 'source/destination draft', consent: 'explicit per-run', post: 'no file copy', journal: 'none', missing: 'file copy executor + verification' },
    },
  },
  {
    mission: '04 Google Workspace',
    key: 'GOOGLE_WORKSPACE',
    ids: ['google-sheets', 'google-gmail', 'google-tasks', 'google-forms', 'google-contacts', 'google-calendar', 'google-picker', 'google-slides', 'google-chat', 'google-classroom'],
    defaults: { cls: 'D', live: 'fixture hub only', action: 'none', ui: 'fixture browse/inspect + local consent review', consent: 'explicit OAuth consent required', fixture: 'none (10-scope UI test only)', post: 'not connected', journal: 'none', observed: 'dev smoke only', status: 'CONNECTABLE_AWAITING_CONSENT', missing: 'OAuth PKCE + client + OS secure store + authenticated adapter + live account gate' },
  },
  {
    mission: '14 Settings & Assistant',
    key: 'SETTINGS_ASSISTANT',
    ids: ['settings-engine', 'settings-ai-copilot', 'settings-workspace', 'settings-guards', 'settings-appearance', 'settings-language', 'settings-backup', 'settings-assistant'],
    defaults: { cls: 'D', live: 'renderer/local non-secret settings profile', action: 'none', ui: 'settings forms, local preference persistence', consent: 'explicit for provider/account actions', fixture: 'test:settings static + Electron preference persistence', post: 'local preferences verified; no Windows setting changed', journal: 'preference timestamp only', observed: 'dev + packaged smoke', status: 'PARTIAL', missing: 'native secure secret store, provider proxy, assistant consent/allowlist, light parity' },
    overrides: {
      'settings-engine': { cls: 'A', status: 'UNSUPPORTED', live: 'UI preference only', action: 'none', ui: 'mode/RAM/thread preferences with explicit no-engine notice', post: 'n/a; no engine executor', status: 'UNSUPPORTED', missing: 'native engine performance executor; controls now labelled preference-only' },
      'settings-ai-copilot': { cls: 'D', status: 'PARTIAL', live: 'session-memory key', action: 'real OpenRouter auth probe only; no native proxy', consent: 'explicit test click; no persistence', fixture: 'none for live provider (no consent)', post: 'session-only; key discarded on close', status: 'PARTIAL', missing: 'native secure vault + provider proxy + billing/network consent' },
      'settings-workspace': { cls: 'D', status: 'BLOCKED', live: 'no Google account/token', action: 'none', ui: 'disconnected scope status', consent: 'explicit OAuth consent required', status: 'BLOCKED', missing: 'OAuth PKCE + secure token store + adapters' },
      'settings-guards': { cls: 'B', status: 'UNSUPPORTED', live: 'none', action: 'no guard engine', ui: 'disabled/off switches with explicit notice', post: 'n/a; no automatic action', status: 'UNSUPPORTED', missing: 'registry/cleanup/privacy guard providers; switches intentionally disabled and off' },
      'settings-appearance': { cls: 'A', status: 'PARTIAL', live: 'persisted local accent/density preference', action: 'page-local accent/density preview', post: 'preference persisted across route remount', observed: 'dev + packaged smoke', status: 'PARTIAL', missing: 'global accent theming and full light parity' },
      'settings-language': { cls: 'A', status: 'PARTIAL', live: 'renderer locale/theme preference', action: 'live setLocale', post: 'locale/theme persisted by NavigationContext', status: 'PARTIAL', missing: 'full RTL/light coverage for every route; no new defect observed here' },
      'settings-backup': { cls: 'B', status: 'PARTIAL', live: 'non-secret settings profile', action: 'real credential-free export, import diff preview, reset', consent: 'user-initiated local file', fixture: 'test:settings + import preview source check', post: 'profile persisted locally; secrets excluded', journal: 'updatedAt', status: 'PARTIAL', missing: 'Windows system restore (belongs to Repair), native secret migration' },
      'settings-assistant': { cls: 'B/D', status: 'BLOCKED', action: 'session-memory chat only', status: 'BLOCKED', missing: 'consent + operation allowlist + secure provider proxy' },
    },
  },
];

function humanize(id) {
  return id.replace(/^(app|file|storage|cleanup|startup|system|network|hardware|repair|services|auto|google|settings)-/, '').replace(/-/g, ' ');
}

function short(value) {
  return String(value).replace(/\|/g, '/').replace(/\n/g, ' ');
}

const header = `# KNOuX Service Registry Evidence

Updated: 2026-10-26
Repository: \`D:\\KNOUX-Workspace\\KNOuX-Gemini-SmartOrganizer\`
Branch: \`feat/gemini-missions\`
Authority: \`missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md\`

This is the registry-ID evidence supplement to the mission-heading product backlog in
\`docs/SERVICE_CAPABILITY_MATRIX.md\`. It is the honest status ledger
for the canonical 132 registry IDs plus Workspace and Settings surfaces. \`MEASURED_READ_ONLY\` means the user's
intended outcome for that row is observation, and the measured provider is
working. It does **not** prove an action executor. \`PARTIAL\` action rows have a
real measured preview but no approved effectful executor. \`CONNECTABLE_AWAITING_CONSENT\`
rows have a consent-ready UI gate only; no account or token exists. \`BLOCKED\`
means a live external/user gate is required. Update this file during the
functional activation pass; never change a status without effect tests.

## Status counts

__COUNTS__

## Service ledger

| mission | service_id | user outcome | class | live data provider | action provider | UI action | consent/risk | fixture / proof | verified postcondition | journal / undo | observed runtime | status | missing dependencies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
`;

const rows = [];
const counts = {};
for (const section of sections) {
  for (const id of section.ids) {
    const data = { ...section.defaults, ...(section.overrides?.[id] || {}) };
    const outcome = data.outcome || (data.cls === 'A' ? `Observe and inspect ${humanize(id)}` : `Perform ${humanize(id)}`);
    counts[data.status] = (counts[data.status] || 0) + 1;
    rows.push(`| ${short(section.mission)} | \`${id}\` | ${short(outcome)} | ${data.cls} | ${short(data.live)} | ${short(data.action)} | ${short(data.ui)} | ${short(data.consent)} | ${short(data.fixture)} | ${short(data.post)} | ${short(data.journal)} | ${short(data.observed)} | **${data.status}** | ${short(data.missing)} |`);
  }
}

const countLines = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `- **${key}**: ${value}`).join('\n');
const extra = `\n## Non-registry product surfaces\n\n- **Home (Mission 01)**: not assessed here; no canonical registry service IDs.\n- **Workspace connection gate**: 10 services listed above; no OAuth client, token, account or API request exists. Live authorization is **BLOCKED_REQUIRES_USER_ACTION**.\n- **Settings secure storage**: not implemented; provider keys remain session-only in the renderer. **BLOCKED_REQUIRES_USER_ACTION** for any live provider test.\n\n## Rules for updating\n\n1. Read the service's actual bridge, UI and controlled fixture test before changing a status.\n2. An action service is not complete until a disposable-fixture effect test proves the after-state and the user approval gate is tested (positive and negative).\n3. Never mark \`IMPLEMENTED_AND_TESTED\` for a plan, preview, toast or color badge.\n4. Live account/OS/file changes are always separate user-consent gates.\n5. Keep the row's missing-dependency list precise; do not use generic "not implemented" when a specific provider or approval is missing.\n`;

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, header.replace('__COUNTS__', countLines) + rows.join('\n') + extra, 'utf8');
console.log(JSON.stringify({ output, rows: rows.length, counts }, null, 2));
