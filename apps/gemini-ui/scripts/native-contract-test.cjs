'use strict';

/**
 * Static contract and security-boundary test for the native platform gate.
 * It does not start Electron or touch Windows; the runtime proof lives in
 * scripts/native-smoke.cjs.
 */
const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), 'utf8');
const contract = JSON.parse(read('shared/native-contract.json'));
const preload = read('electron/preload.cjs');
const main = read('electron/main.cjs');
const security = read('electron/native/security.cjs');
const provider = require('../electron/native/provider-bridge.cjs');
const appBridge = require('../electron/native/app-bridge.cjs');
const appBridgeSource = read('electron/native/app-bridge.cjs');
const cleanupBridge = require('../electron/native/cleanup-bridge.cjs');
const cleanupBridgeSource = read('electron/native/cleanup-bridge.cjs');
const startupBridge = require('../electron/native/startup-bridge.cjs');
const startupBridgeSource = read('electron/native/startup-bridge.cjs');
const systemBridge = require('../electron/native/system-bridge.cjs');
const systemProviders = require('../electron/native/system-providers.cjs');
const systemBridgeSource = read('electron/native/system-bridge.cjs');
const systemProviderSource = read('electron/native/system-providers.cjs');
const pkg = JSON.parse(read('package.json'));
const googleAuth = require('../electron/native/google-auth.cjs');
const googleSource = read('electron/native/google-auth.cjs');

const failures = [];
const assert = (condition, label) => {
  if (!condition) failures.push(label);
};

assert(contract.contractVersion === 1, 'contract version must be 1');
assert(contract.namespace === 'knouxShell', 'namespace must be knouxShell');
assert(contract.channels.windowControl === 'knoux:window:v1:control', 'window control channel is fixed');
for (const channel of Object.values(contract.channels)) {
  assert(preload.includes(channel), `preload must mirror channel ${channel}`);
}
assert(preload.includes("exposeInMainWorld(\n  'knouxShell'") || preload.includes("exposeInMainWorld"), 'preload exposes the bridge');
assert(!preload.includes('exposeInMainWorld(\'knouxNode\''), 'no second raw bridge');
assert(!preload.includes('ipcRenderer.send('), 'preload must not expose send');
assert(contract.channels.studioEvent === 'knoux:studio:v1:event', 'studio event channel is fixed');
assert(contract.channels.scanEvent === 'knoux:scan:v1:event', 'scan event channel is fixed');
const eventSubscriptions = preload.match(/ipcRenderer\.on\(/g) || [];
assert(
  eventSubscriptions.length === 3
    && preload.includes('ipcRenderer.on(CHANNELS.studioEvent')
    && preload.includes('ipcRenderer.on(CHANNELS.scanEvent')
    && preload.includes("ipcRenderer.on('knoux:operations:v1:event'"),
  'only fixed Studio, Scan and Operations event channels are subscribed'
);
const operationChannels=require('../electron/native/operation-ipc.cjs').CHANNELS;
for(const [method,channel] of Object.entries(operationChannels)) assert(preload.includes(channel),`fixed operation channel ${method} is mirrored in preload`);
assert(read('electron/native/operation-ipc.cjs').includes('assertSender(event)'), 'operation endpoints validate sender before bridge access');
assert(!preload.includes("ipcRenderer.invoke('knoux:operations:v1:event'"), 'operation events are receive-only');
const shellBlock = preload.slice(preload.indexOf("'knouxShell'"), preload.indexOf("'knouxStudioV1'"));
assert(!shellBlock.includes('onEvent') && !shellBlock.includes('ipcRenderer.on'), 'platform v1 exposes no event stream');
assert(!preload.includes('ipcRenderer.invoke(CHANNELS.studioEvent'), 'studio events are receive-only');
assert(!preload.includes('ipcRenderer.invoke(CHANNELS.scanEvent'), 'scan events are receive-only');
assert(/exposeInMainWorld\(\s*'knouxAppsV1'/.test(preload), 'preload exposes the Applications bridge');
assert(!preload.includes('ipcRenderer.on(CHANNELS.apps'), 'Applications exposes no event stream');
assert(contract.channels.appsInventory === 'knoux:apps:v1:inventory', 'Applications inventory channel is fixed');
assert(contract.capabilities['apps.settings.open'].mode === 'user-initiated', 'settings handoff is the only user-initiated Applications capability');
assert(appBridge.SERVICE_DEFINITIONS.length === 12, 'Applications keeps all twelve canonical services');
assert(appBridge.GATED_OPERATIONS.every((operation) => operation.id && operation.mission), 'Applications gates name their owning mission');
for (const forbidden of ['unlink(', 'rm(', 'rename(', 'writeFile(', 'rmdir(', 'registrySet(', 'uninstallApp(']) {
  assert(!appBridgeSource.includes(forbidden), `Applications bridge has no mutation call: ${forbidden}`);
}
assert(!appBridgeSource.includes('shell.openExternal'), 'the Applications bridge does not open anything itself');
assert(!appBridgeSource.includes('accept-source-agreements'), 'WinGet source agreements are never accepted automatically');
assert(!appBridgeSource.includes('exec('), 'Applications bridge never uses a shell command evaluator');
assert(/exposeInMainWorld\(\s*'knouxCleanupV1'/.test(preload), 'preload exposes the Clean Room bridge');
assert(!preload.includes('ipcRenderer.on(CHANNELS.cleanup'), 'Cleanup exposes no event stream');
assert(contract.channels.cleanupPlan === 'knoux:cleanup:v1:plan', 'Cleanup plan channel is fixed');
assert(contract.capabilities['cleanup.start'].mode === 'read-only', 'Cleanup discovery is read-only');
assert(contract.capabilities['cleanup.settings.open'].mode === 'user-initiated', 'settings handoff is the only user-initiated Cleanup capability');
const cleanupServiceIds = [
  'cleanup-temp-preview',
  'cleanup-temp-quarantine',
  'cleanup-temp-undo',
  'cleanup-quarantine-list',
  'cleanup-estimate',
  'cleanup-recycle',
  'cleanup-unused',
  'cleanup-update-cache',
  'cleanup-browser-cache',
  'cleanup-logs',
  'cleanup-schedule',
  'cleanup-reports',
];
assert(
  cleanupBridge.SERVICE_DEFINITIONS.length === 12
    && cleanupServiceIds.every((id) => cleanupBridge.SERVICE_DEFINITIONS.some((service) => service.id === id)),
  'Cleanup keeps all twelve canonical services'
);
assert(
  cleanupBridge.SERVICE_DEFINITIONS.every((service) => /[\u0600-\u06FF]/.test(service.labelAr) && service.noteAr),
  'Cleanup services carry authored Arabic labels and notes'
);
assert(cleanupBridge.GATED_OPERATIONS.every((operation) => operation.id && operation.mission), 'Cleanup gates name their owning mission');
for (const forbidden of ['fsp.unlink', 'fsp.rm(', 'fsp.rmdir', 'fsp.rename', 'fsp.writeFile', 'fs.rmSync', 'fs.unlinkSync', 'fs.renameSync', 'Remove-Item', 'schtasks', 'dism.exe', 'Dism.exe']) {
  assert(!cleanupBridgeSource.includes(forbidden), `Cleanup bridge has no mutation call: ${forbidden}`);
}
assert(!cleanupBridgeSource.includes('shell.openExternal'), 'the Cleanup bridge does not open anything itself');
assert(
  ['cleanupCapabilities', 'cleanupStart', 'cleanupStatus', 'cleanupCancel', 'cleanupInventory', 'cleanupEstimate', 'cleanupQuarantine', 'cleanupUnused', 'cleanupPlan', 'cleanupSchedule', 'cleanupReport', 'cleanupOpenSettings']
    .every((channel) => main.includes(`contract.channels.${channel}`)),
  'every Cleanup channel has an IPC handler'
);
assert(/exposeInMainWorld\(\s*'knouxStartupV1'/.test(preload), 'preload exposes the Boot Control bridge');
assert(!preload.includes('ipcRenderer.on(CHANNELS.startup'), 'Startup exposes no event stream');
assert(contract.channels.startupPlan === 'knoux:startup:v1:plan', 'Startup plan channel is fixed');
assert(contract.capabilities['startup.start'].mode === 'read-only', 'Startup measurement is read-only');
assert(contract.capabilities['startup.plan'].mode === 'read-only', 'Startup plans are review-only');
assert(contract.capabilities['startup.settings.open'].mode === 'user-initiated', 'settings handoff is the only user-initiated Startup capability');
const startupServiceIds = [
  'startup-overview',
  'startup-disable',
  'startup-restore',
  'startup-sources',
  'startup-journal',
  'startup-filter',
  'startup-impact',
  'startup-services',
  'startup-tasks',
  'startup-delay',
  'startup-batch',
  'startup-undo-all',
];
assert(
  startupBridge.SERVICE_DEFINITIONS.length === 12
    && startupServiceIds.every((id) => startupBridge.SERVICE_DEFINITIONS.some((service) => service.id === id)),
  'Startup keeps all twelve canonical services'
);
assert(
  startupBridge.SERVICE_DEFINITIONS.every((service) => /[\u0600-\u06FF]/.test(service.labelAr) && service.noteAr),
  'Startup services carry authored Arabic labels and notes'
);
assert(startupBridge.STAGE_DEFINITIONS.length === 5, 'Startup keeps five measured stages');
assert(startupBridge.GATED_OPERATIONS.every((operation) => operation.id && operation.mission), 'Startup gates name their owning mission');
for (const forbidden of ['Set-ItemProperty', 'New-ItemProperty', 'Remove-ItemProperty', 'reg add', 'schtasks', 'Set-Service', 'Stop-Service', 'Start-Process', 'Remove-Item', 'Move-Item', 'Rename-Item', 'fs.writeFile', 'fs.rename', 'fs.unlink', 'child_process.exec(']) {
  assert(!startupBridgeSource.includes(forbidden), `Startup bridge has no mutation call: ${forbidden}`);
}
assert(!startupBridgeSource.includes('shell.openExternal'), 'the Startup bridge does not open anything itself');
assert(
  ['startupCapabilities', 'startupStart', 'startupStatus', 'startupCancel', 'startupInventory', 'startupServices', 'startupTasks', 'startupImpact', 'startupJournal', 'startupSessions', 'startupPlan', 'startupReport', 'startupOpenSettings']
    .every((channel) => main.includes(`contract.channels.${channel}`)),
  'every Startup channel has an IPC handler'
);
assert(/exposeInMainWorld\(\s*'knouxSystemV1'/.test(preload), 'preload exposes the Live Pulse observatory bridge');
assert(!preload.includes('ipcRenderer.on(CHANNELS.system'), 'System exposes no event stream');
assert(contract.channels.systemSnapshot === 'knoux:system:v1:snapshot', 'System snapshot channel is fixed');
assert(contract.capabilities['system.start'].mode === 'read-only', 'System measurement is read-only');
assert(contract.capabilities['system.diagnostics'].mode === 'read-only', 'System diagnostics are read-only');
assert(contract.capabilities['system.hosts.plan'].mode === 'read-only', 'hosts drafts are review-only');
assert(contract.capabilities['system.settings.open'].mode === 'user-initiated', 'settings handoff is the only user-initiated System capability');
assert(!Object.keys(contract.capabilities).some((id) => /system\.(process|service|driver|power)\.(terminate|stop|start|set|change|install|remove)/i.test(id)), 'System contract exposes no mutation capability');
const systemServiceIds = [
  'system-health-check', 'system-events', 'system-processes', 'system-signatures', 'system-uptime', 'system-perf',
  'system-drivers', 'system-logs', 'system-resources', 'system-autostart', 'system-services-map', 'system-timeline',
  'network-interfaces', 'network-dns-config', 'network-adapters', 'network-connectivity', 'network-throughput',
  'network-traceroute', 'network-topology', 'network-ports', 'network-wifi', 'network-hosts', 'network-proxies', 'network-repair-link',
  'hardware-inventory', 'hardware-battery', 'hardware-cpu', 'hardware-gpu', 'hardware-memory', 'hardware-cycles',
  'hardware-thermal', 'hardware-disks', 'hardware-usb', 'hardware-display', 'hardware-audio', 'hardware-health-report',
];
assert(
  systemBridge.SERVICE_DEFINITIONS.length === 36
    && systemServiceIds.every((id) => systemBridge.SERVICE_DEFINITIONS.some((service) => service.id === id)),
  'System keeps all thirty-six canonical services'
);
assert(
  ['system', 'network', 'hardware'].every((world) => systemBridge.SERVICE_DEFINITIONS.filter((service) => service.world === world).length === 12),
  'System splits twelve canonical services across three worlds'
);
assert(
  systemBridge.SERVICE_DEFINITIONS.every((service) => /[\u0600-\u06FF]/.test(service.labelAr) && /[\u0600-\u06FF]/.test(service.noteAr)),
  'System services carry authored Arabic labels and notes'
);
assert(systemBridge.STAGE_DEFINITIONS.length === 9, 'System keeps nine measured stages');
assert(systemBridge.GATED_OPERATIONS.length === 8, 'System publishes eight explicit mutation gates');
assert(systemBridge.GATED_OPERATIONS.every((operation) => operation.id && operation.mission && operation.reason), 'System gates name their owning mission and reason');
assert(systemBridge.SERVICE_DEFINITIONS === systemProviders.SERVICE_DEFINITIONS, 'the bridge reuses the measured provider service catalogue');
for (const forbidden of ['Stop-Process', 'Stop-Service', 'Set-Service', 'Set-ItemProperty', 'New-ItemProperty', 'Remove-ItemProperty', 'Restart-NetAdapter', 'netsh winsock reset', 'ipconfig /flushdns', 'Start-Process', 'shutdown.exe', 'fs.writeFile', 'fs.rename', 'fs.unlink', 'child_process.exec(']) {
  assert(!systemBridgeSource.includes(forbidden), `System bridge has no mutation call: ${forbidden}`);
}
for (const forbidden of ['Remove-Item', 'Set-Service', 'Stop-Service', 'Restart-NetAdapter', 'Set-NetAdapter', 'Set-ItemProperty', 'Invoke-Expression', 'Start-Process', 'shutdown.exe']) {
  assert(!systemProviderSource.includes(forbidden), `System provider has no mutation call: ${forbidden}`);
}
assert(!systemBridgeSource.includes('shell.openExternal'), 'the System bridge does not open anything itself');
assert(
  ['systemCapabilities', 'systemStart', 'systemStatus', 'systemCancel', 'systemSnapshot', 'systemSample', 'systemProcesses', 'systemEvents', 'systemSignatures', 'systemDiagnostics', 'systemTraceroute', 'systemHosts', 'systemHostsPlan', 'systemReport', 'systemOpenSettings']
    .every((channel) => main.includes(`contract.channels.${channel}`)),
  'every System channel has an IPC handler'
);
assert(/exposeInMainWorld\(\s*'knouxRepairV1'/.test(preload), 'preload exposes the Recovery Lab bridge');
assert(contract.channels.repairSnapshot === 'knoux:repair:v1:snapshot', 'Repair snapshot channel is fixed');
assert(contract.capabilities['repair.start'].mode === 'read-only', 'Repair discovery is read-only');
assert(contract.capabilities['repair.plan'].mode === 'read-only', 'Repair plans are review-only');
assert(contract.capabilities['repair.journal'].mode === 'read-only', 'Repair journal is read-only');
assert(contract.capabilities['repair.report'].mode === 'read-only', 'Repair report is read-only');
assert(contract.capabilities['repair.settings.open'].mode === 'user-initiated', 'Repair settings handoff is user-initiated');
assert(!Object.keys(contract.capabilities).some((id) => /^repair\.(run|execute|apply|reset|flush|elevate)/i.test(id)), 'Repair contract exposes no execution capability');
const repairBridge = require('../electron/native/repair-bridge.cjs');
const repairProviders = require('../electron/native/repair-providers.cjs');
const repairBridgeSource = read('electron/native/repair-bridge.cjs');
const repairProviderSource = read('electron/native/repair-providers.cjs');
assert(repairBridge.SERVICE_DEFINITIONS.length === 12, 'Repair keeps twelve tools');
assert(repairBridge.COMMAND_SPECS.length === 10, 'Repair keeps ten fixed command previews');
assert(repairBridge.COMMAND_SPECS.every((entry) => entry.execution.available === false), 'every Repair command is preview-only');
assert(repairBridge.STAGE_DEFINITIONS.length === 6, 'Repair keeps six measured stages');
assert(repairBridge.GATED_OPERATIONS.length === 8, 'Repair publishes eight explicit gates');
assert(repairProviders.SERVICE_DEFINITIONS === repairBridge.SERVICE_DEFINITIONS, 'the bridge reuses the repair provider catalogue');
assert(repairBridge.SERVICE_DEFINITIONS.every((service) => /[\u0600-\u06FF]/.test(service.labelAr) && /[\u0600-\u06FF]/.test(service.noteAr)), 'Repair tools carry authored Arabic text');
for (const forbidden of ['shell: true', 'spawn(', 'Start-Process', 'Invoke-Expression', 'Stop-Service', 'Set-Service', 'Remove-Item', 'Restart-Computer', 'dism.exe /online', 'sfc.exe /scannow', 'netsh.exe winsock reset', 'netsh.exe int ip reset', 'ipconfig.exe /flushdns', 'rstrui.exe']) {
  assert(!repairBridgeSource.toLowerCase().includes(forbidden.toLowerCase()), `Repair bridge has no execution call: ${forbidden}`);
}
for (const forbidden of ['shell: true', 'spawn(', 'child_process', 'Start-Process', 'Invoke-Expression', 'Stop-Service', 'Set-Service', 'Remove-Item', 'Restart-Computer']) {
  assert(!repairProviderSource.toLowerCase().includes(forbidden.toLowerCase()), `Repair provider has no execution call: ${forbidden}`);
}
assert(!/runFile\(['"](?:dism|sfc|rstrui)\.exe/i.test(repairBridgeSource), 'the bridge never executes DISM, SFC or System Restore');
assert(!/runFile\(['"]netsh\.exe['"],\s*\[\s*['"]winsock['"],\s*['"]reset/i.test(repairBridgeSource), 'the bridge never resets Winsock');
assert(/recordPreview\(plan\)/.test(repairBridgeSource), 'Repair plans are recorded as previews only');
assert(
  ['repairCapabilities', 'repairStart', 'repairStatus', 'repairCancel', 'repairSnapshot', 'repairPlan', 'repairJournal', 'repairReport', 'repairOpenSettings']
    .every((channel) => main.includes(`contract.channels.${channel}`)),
  'every Repair channel has an IPC handler'
);
assert(/exposeInMainWorld\(\s*'knouxServicesV1'/.test(preload), 'preload exposes the Service Commander bridge');
assert(contract.channels.servicesSnapshot === 'knoux:services:v1:snapshot', 'Services snapshot channel is fixed');
assert(contract.capabilities['services.start'].mode === 'read-only', 'Service discovery is read-only');
assert(contract.capabilities['services.plan'].mode === 'read-only', 'Service plans are review-only');
assert(contract.capabilities['services.journal'].mode === 'read-only', 'Service journal is read-only');
assert(contract.capabilities['services.report'].mode === 'read-only', 'Service report is read-only');
assert(!Object.keys(contract.capabilities).some((id) => /^services\.(start-service|stop-service|restart|apply|execute|config)/i.test(id)), 'Services contract exposes no control capability');
const servicesBridge = require('../electron/native/services-bridge.cjs');
const servicesProviders = require('../electron/native/services-providers.cjs');
const servicesBridgeSource = read('electron/native/services-bridge.cjs');
const servicesProviderSource = read('electron/native/services-providers.cjs');
assert(servicesBridge.SERVICE_TOOLS.length === 12, 'Service Commander keeps twelve tools');
assert(servicesBridge.STAGE_DEFINITIONS.length === 6, 'Service Commander keeps six measured stages');
assert(servicesBridge.GATED_OPERATIONS.length === 6, 'Service Commander publishes six explicit gates');
assert(servicesProviders.SERVICE_TOOLS === servicesBridge.SERVICE_TOOLS, 'the bridge reuses the service provider catalogue');
assert(servicesBridge.SERVICE_TOOLS.every((entry) => /[\u0600-\u06FF]/.test(entry.labelAr) && /[\u0600-\u06FF]/.test(entry.noteAr)), 'service tools carry authored Arabic text');
for (const forbidden of ['Start-Service', 'Stop-Service', 'Restart-Service', 'Set-Service', 'sc.exe', 'shell: true', 'spawn(', 'Start-Process', 'Invoke-Expression', 'shutdown.exe']) {
  assert(!servicesBridgeSource.includes(forbidden), `Services bridge has no control call: ${forbidden}`);
  assert(!servicesProviderSource.includes(forbidden), `Services provider has no control call: ${forbidden}`);
}
assert(
  ['servicesCapabilities', 'servicesStart', 'servicesStatus', 'servicesCancel', 'servicesSnapshot', 'servicesPlan', 'servicesJournal', 'servicesReport']
    .every((channel) => main.includes(`contract.channels.${channel}`)),
  'every Services channel has an IPC handler'
);
assert(/exposeInMainWorld\(\s*'knouxAutomationV1'/.test(preload), 'preload exposes the Flow Studio bridge');
assert(contract.channels.automationSnapshot === 'knoux:automation:v1:snapshot', 'Automation snapshot channel is fixed');
assert(contract.capabilities['automation.start'].mode === 'read-only', 'Flow Studio discovery is read-only');
assert(contract.capabilities['automation.save'].mode === 'user-initiated', 'workflow save is user-initiated local metadata');
assert(contract.capabilities['automation.dryRun'].mode === 'read-only', 'workflow dry-run is read-only');
assert(contract.capabilities['automation.schedulePreview'].mode === 'read-only', 'schedule preview is read-only');
assert(contract.capabilities['automation.validateImport'].mode === 'read-only', 'import validation is read-only');
assert(!Object.keys(contract.capabilities).some((id) => /^automation\.(run|execute|schedule\.job|notify|copy|delete)/i.test(id)), 'Automation contract exposes no execution capability');
const automationBridge = require('../electron/native/automation-bridge.cjs');
const automationProviders = require('../electron/native/automation-providers.cjs');
const automationBridgeSource = read('electron/native/automation-bridge.cjs');
const automationProviderSource = read('electron/native/automation-providers.cjs');
assert(automationBridge.AUTOMATION_TOOLS.length === 12, 'Flow Studio keeps twelve tools');
assert(automationBridge.STAGE_DEFINITIONS.length === 5, 'Flow Studio keeps five measured stages');
assert(automationBridge.GATED_OPERATIONS.length === 5, 'Flow Studio publishes five explicit gates');
assert(automationProviders.TEMPLATES.length === 8, 'Flow Studio keeps eight built-in templates');
assert(automationProviders.AUTOMATION_TOOLS === automationBridge.AUTOMATION_TOOLS, 'the bridge reuses the Flow Studio catalogue');
assert(automationBridge.AUTOMATION_TOOLS.every((entry) => /[\u0600-\u06FF]/.test(entry.labelAr) && /[\u0600-\u06FF]/.test(entry.noteAr)), 'Flow Studio tools carry authored Arabic text');
for (const forbidden of ['child_process', 'spawn(', 'shell: true', 'Start-Process', 'Invoke-Expression', 'schtasks', 'setInterval(', 'setTimeout(', 'fetch(', 'http://', 'https://']) {
  assert(!automationBridgeSource.includes(forbidden), `Automation bridge has no executor: ${forbidden}`);
  assert(!automationProviderSource.includes(forbidden), `Automation provider has no executor: ${forbidden}`);
}
assert(
  ['automationCapabilities', 'automationStart', 'automationStatus', 'automationCancel', 'automationSnapshot', 'automationWorkflows', 'automationSave', 'automationTemplates', 'automationDryRun', 'automationSchedulePreview', 'automationValidateImport', 'automationJournal', 'automationReport']
    .every((channel) => main.includes(`contract.channels.${channel}`)),
  'every Automation channel has an IPC handler'
);
assert(!/require\(['"](?:node:)?(fs|child_process|path|os)['"]\)/.test(preload), 'preload has no Node filesystem/process module');
assert(main.includes('contextIsolation: true'), 'main enables contextIsolation');
assert(main.includes('sandbox: true'), 'main enables sandbox');
assert(main.includes('nodeIntegration: false'), 'main disables nodeIntegration');
assert(main.includes('webviewTag: false'), 'main disables webviewTag');
assert(main.includes('assertTrustedSender'), 'every IPC handler uses the sender guard');
assert(main.includes("require('../shared/native-contract.json')"), 'main resolves the shared contract from the app root');
assert(!main.includes("require('../../shared/native-contract.json')"), 'main must not use the wrong shared path');
assert(main.includes('appPackage.version'), 'bridge reports the app package version, not the Electron runtime version');
assert(security.includes("frame-ancestors 'none'"), 'CSP forbids framing');
assert(provider.fixturesEnabled({ isPackaged: false, env: { KNOUX_NATIVE_FIXTURES: '1' } }) === true, 'development fixture flag is only dev');
assert(provider.fixturesEnabled({ isPackaged: true, env: { KNOUX_NATIVE_FIXTURES: '1' } }) === false, 'packaged build ignores fixture flag');
assert(provider.fixturesEnabled({ isPackaged: false, env: {} }) === false, 'fixtures are opt-in');
assert(fs.existsSync(provider.PROVIDER_RELATIVE), 'reused root Windows provider exists');
assert(Array.isArray(contract.windowActions) && contract.windowActions.length === 3, 'three fixed window actions');

const aiStorageHits = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      if (/knoux_ai_api_key|knoux_ai_provider/.test(text)) aiStorageHits.push(path.relative(appRoot, full));
    }
  }
}
walk(path.join(appRoot, 'src'));
assert(aiStorageHits.length === 0, `no renderer API-key persistence (${aiStorageHits.join(', ')})`);

const distIndex = path.join(appRoot, 'dist', 'index.html');
let cspPresent = null;
if (fs.existsSync(distIndex)) {
  cspPresent = /Content-Security-Policy/.test(fs.readFileSync(distIndex, 'utf8'));
  assert(cspPresent === true, 'built index carries the CSP meta tag');
}

assert(pkg.main === 'electron/main.cjs', 'package main points at the Gemini shell');
assert(typeof pkg.scripts['desktop:smoke'] === 'string', 'desktop smoke script exists');
assert(typeof pkg.scripts['desktop:pack'] === 'string', 'desktop pack script exists');

assert(/exposeInMainWorld\(\s*'knouxGoogleV1'/.test(preload), 'preload exposes the Google bridge');
assert(contract.channels.googleStatus === 'knoux:google:v1:status', 'Google status channel is fixed');
assert(contract.channels.googleSheetRead === 'knoux:google:v1:sheet-read', 'Google sheet-read channel is fixed');
assert(contract.capabilities['google.connect'].mode === 'user-initiated', 'Google connect is user-initiated');
assert(contract.capabilities['google.status'].mode === 'read-only', 'Google status is read-only');
assert(
  ['googleStatus', 'googleConnect', 'googleCancel', 'googleDisconnect', 'googleSheetsList', 'googleSheetAdd', 'googleSheetRemove', 'googleSheetRead']
    .every((channel) => main.includes(`contract.channels.${channel}`)),
  'every Google channel has an IPC handler'
);
assert(googleAuth.REQUEST_SCOPES.length === 4, 'Google requests exactly four scopes');
assert(!googleAuth.REQUEST_SCOPES.some((scope) => /drive|gmail|calendar|tasks|forms|presentations|chat|classroom|contacts|spreadsheets(?!\.readonly)/i.test(scope)), 'Google requests no broad non-Sheets scope');
assert(googleSource.includes('code_challenge_method') && googleSource.includes("'S256'"), 'Google uses PKCE S256');
assert(googleSource.includes("host: '127.0.0.1'"), 'Google loopback binds to 127.0.0.1');
assert(googleSource.includes('safeStorage') && googleSource.includes('windows-dpapi-safeStorage'), 'Google stores tokens with DPAPI-backed safeStorage');
assert(!preload.includes('refresh_token') && !preload.includes('access_token') && !preload.includes('client_secret'), 'preload exposes no token or client-secret field');
assert(!contract.namespace.includes('token'), 'contract namespace carries no token');
assert(!fs.existsSync(path.join(appRoot, 'google-desktop-client.json')), 'no OAuth client JSON is bundled in the app root');
assert(read('electron-builder.config.cjs').includes('!**/google-desktop-client*.json'), 'packaging excludes local OAuth client JSON');

const result = {
  ok: failures.length === 0,
  contractVersion: contract.contractVersion,
  capabilities: Object.keys(contract.capabilities),
  channels: Object.keys(contract.channels),
  buildCspPresent: cspPresent,
  aiStorageHits,
  failures,
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
console.log('[native-contract] PASS');
