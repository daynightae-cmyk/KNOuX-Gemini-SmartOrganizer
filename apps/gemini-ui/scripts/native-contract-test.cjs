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
const pkg = JSON.parse(read('package.json'));

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
  eventSubscriptions.length === 2
    && preload.includes('ipcRenderer.on(CHANNELS.studioEvent')
    && preload.includes('ipcRenderer.on(CHANNELS.scanEvent'),
  'only the fixed Studio and Scan event channels are subscribed'
);
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
