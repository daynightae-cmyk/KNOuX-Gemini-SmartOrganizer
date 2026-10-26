'use strict';

/**
 * Targeted read-only Boot Control test (Mission 09).
 *
 * Injected registry/folder/task/service/boot collectors prove the coordinator:
 *   - maps measured autoruns, tasks, services and boot diagnostics honestly
 *   - keeps protected Windows components protected
 *   - builds an immutable review plan with no execution channel
 *   - refuses restore/rollback without a journal
 *   - never writes a registry value, task, service, startup folder or journal
 */

const fs = require('node:fs');
const path = require('node:path');
const {
  StartupBridge,
  SERVICE_DEFINITIONS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS,
} = require('../electron/native/startup-bridge.cjs');

const failures = [];
const assert = (condition, label) => {
  if (!condition) failures.push(label);
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const NOW = new Date('2026-10-26T12:00:00.000Z');

const sources = {
  registry: [
    {
      name: 'OneDrive',
      hive: 'HKCU',
      key: 'Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      kind: 'run',
      view: '64',
      command: '"C:\\Users\\tester\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe" /background',
      approved: 'enabled',
    },
    {
      name: 'SecurityHealth',
      hive: 'HKLM',
      key: 'Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      kind: 'run',
      view: '64',
      command: 'C:\\Windows\\System32\\SecurityHealthSystray.exe',
      approved: 'enabled',
    },
    {
      name: 'LegacyAgent',
      hive: 'HKLM',
      key: 'Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run',
      kind: 'run',
      view: '32',
      command: 'C:\\Program Files (x86)\\Legacy\\agent.exe --minimized',
      approved: 'disabled',
    },
    {
      name: 'OneTimeSetup',
      hive: 'HKCU',
      key: 'Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce',
      kind: 'runonce',
      view: '64',
      command: 'C:\\Users\\tester\\AppData\\Local\\Temp\\setup.cmd',
      approved: 'unknown',
    },
  ],
  folders: [
    {
      name: 'ChatApp',
      file: 'C:\\Users\\tester\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\ChatApp.lnk',
      target: 'C:\\Program Files\\Chat\\chat.exe',
      args: '--startup',
      description: 'Chat launcher',
      scope: 'user',
      approved: 'enabled',
    },
    {
      name: 'FleetSync',
      file: 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\FleetSync.lnk',
      target: 'C:\\Program Files\\Fleet\\sync.exe',
      args: null,
      description: null,
      scope: 'machine',
      approved: 'disabled',
    },
  ],
  errors: [],
};

const tasks = [
  {
    name: 'UserLoginSync',
    path: '\\Vendor\\',
    state: 'Ready',
    author: 'Vendor Ltd',
    userId: 'tester',
    runLevel: 'Limited',
    logon: true,
    boot: false,
    triggers: ['LogonTrigger'],
    nextRun: '2026-10-27T08:00:00.000Z',
    lastRun: '2026-10-26T08:00:00.000Z',
    execute: 'C:\\Program Files\\Vendor\\sync.exe',
    arguments: '--quiet',
  },
  {
    name: 'MaintenanceTask',
    path: '\\Microsoft\\Windows\\Maintenance\\',
    state: 'Ready',
    author: 'Microsoft',
    userId: 'SYSTEM',
    runLevel: 'Highest',
    logon: false,
    boot: true,
    triggers: ['BootTrigger'],
    nextRun: null,
    lastRun: null,
    execute: 'C:\\Windows\\System32\\maintenance.exe',
    arguments: null,
  },
  {
    name: 'AlreadyOff',
    path: '\\Vendor\\',
    state: 'Disabled',
    author: 'Vendor Ltd',
    userId: 'tester',
    runLevel: 'Limited',
    logon: true,
    boot: false,
    triggers: ['LogonTrigger'],
    nextRun: null,
    lastRun: null,
    execute: 'C:\\Program Files\\Vendor\\idle.exe',
    arguments: null,
  },
];

const services = [
  {
    name: 'VendorAgent',
    displayName: 'Vendor Agent',
    state: 'Running',
    startMode: 'Auto',
    delayedAuto: false,
    account: 'LocalSystem',
    binaryPath: 'C:\\Program Files\\Vendor\\agent.exe',
    serviceType: 'Own Process',
    processId: 4242,
  },
  {
    name: 'VendorIndex',
    displayName: 'Vendor Indexer',
    state: 'Stopped',
    startMode: 'Auto',
    delayedAuto: true,
    account: 'LocalSystem',
    binaryPath: 'C:\\Program Files\\Vendor\\index.exe',
    serviceType: 'Own Process',
  },
  {
    name: 'WinDefend',
    displayName: 'Microsoft Defender Antivirus Service',
    state: 'Running',
    startMode: 'Auto',
    delayedAuto: false,
    account: 'LocalSystem',
    binaryPath: 'C:\\Windows\\System32\\svchost.exe -k secsvcs',
    serviceType: 'Share Process',
  },
  {
    name: 'ManualOnly',
    displayName: 'Manual Only',
    state: 'Stopped',
    startMode: 'Manual',
    delayedAuto: false,
    account: 'LocalSystem',
    binaryPath: 'C:\\Program Files\\Vendor\\manual.exe',
    serviceType: 'Own Process',
  },
];

const boot = {
  lastBoot: '2026-10-26T07:12:31.000Z',
  uptime: 17500,
  events: [
    {
      id: 100,
      time: '2026-10-26T07:12:33.000Z',
      level: 'Information',
      provider: 'Microsoft-Windows-Diagnostics-Performance',
      message: 'Boot Duration : 13800ms',
      properties: ['13800'],
    },
    {
      id: 101,
      time: '2026-10-26T07:12:34.000Z',
      level: 'Warning',
      provider: 'Microsoft-Windows-Diagnostics-Performance',
      message: 'Application ChatApp took longer than expected to start.',
      properties: ['ChatApp', '4200'],
    },
  ],
  errors: [],
};

const processNames = ['onedrive', 'chat', 'sync'];

function createBridge(overrides = {}) {
  return new StartupBridge({
    platform: 'win32',
    env: {
      SystemRoot: 'C:\\Windows',
      ProgramFiles: 'C:\\Program Files',
      'ProgramFiles(x86)': 'C:\\Program Files (x86)',
      ProgramData: 'C:\\ProgramData',
      LOCALAPPDATA: 'C:\\Users\\tester\\AppData\\Local',
      APPDATA: 'C:\\Users\\tester\\AppData\\Roaming',
      USERPROFILE: 'C:\\Users\\tester',
    },
    homeDir: 'C:\\Users\\tester',
    now: () => new Date(NOW),
    collectors: {
      readSources: async () => sources,
      readTasks: async () => ({ tasks, errors: [] }),
      readServices: async () => ({ services, errors: [] }),
      readBoot: async () => ({ boot, errors: [] }),
    },
    collectSignatures: async (paths) => paths.map((target) => ({
      path: target,
      exists: target.toLowerCase().includes('chat.exe') || target.toLowerCase().includes('onedrive.exe'),
      status: target.toLowerCase().includes('chat.exe') ? 'Valid' : 'NotSigned',
      signer: target.toLowerCase().includes('chat.exe') ? 'CN=Chat Software Ltd, O=Chat Software Ltd' : null,
      company: target.toLowerCase().includes('chat.exe') ? 'Chat Software Ltd' : null,
      description: target.toLowerCase().includes('chat.exe') ? 'Chat Launcher' : null,
      version: '1.0.0.0',
    })),
    listProcessNames: async () => processNames,
    scanTimeoutMs: 10000,
    ...overrides,
  });
}

async function settle(bridge, sessionId, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let session = bridge.status(sessionId);
  while (Date.now() < deadline && session.status === 'running') {
    await wait(30);
    session = bridge.status(sessionId);
  }
  return session;
}

async function main() {
  const bridge = createBridge();
  const capabilities = bridge.capabilities();
  assert(capabilities.readOnly === true && capabilities.mutation === 'none', 'capabilities are read-only');
  assert(capabilities.fixtureFallback === false, 'no fixture fallback is advertised');
  assert(capabilities.serviceCount === 12 && SERVICE_DEFINITIONS.length === 12, 'twelve services are advertised');
  assert(
    SERVICE_DEFINITIONS.every((service) => /[\u0600-\u06FF]/.test(service.labelAr) && service.noteAr),
    'every service carries authored Arabic labels and notes'
  );
  assert(GATED_OPERATIONS.every((operation) => operation.id && operation.mission), 'every gate names its mission');
  assert(STAGE_DEFINITIONS.length === 5, 'five measured scan stages are fixed');

  const before = bridge.inventory();
  assert(before.entries.length === 0 && before.readOnly === true, 'unscanned inventory is empty and read-only');
  assert(before.warnings.some((warning) => /No measured startup scan/i.test(warning)), 'unscanned inventory is honest');

  let stalePlanRejected = false;
  try {
    bridge.plan({ entryIds: ['st:000000000000000000000000'], mode: 'disable' });
  } catch (error) {
    stalePlanRejected = error.code === 'STARTUP_NOT_MEASURED';
  }
  assert(stalePlanRejected, 'a plan before a measured scan is rejected');

  const started = await bridge.start({});
  assert(started.status === 'running' && started.id, 'a measured scan session starts with a durable id');
  const session = await settle(bridge, started.id);
  assert(session.status === 'complete', 'measured scan completes');
  assert(session.stages.length === 5 && session.stages.every((stage) => stage.status === 'complete'), 'all five stages complete');
  assert(session.entryCount >= 9, 'measured entries reach the session');

  const inventory = bridge.inventory();
  assert(inventory.status === 'complete', 'inventory is complete');
  assert(inventory.readOnly === true && inventory.mutation === 'none', 'inventory remains read-only');
  assert(inventory.entries.length === 9, 'four registry, two folder and three task entries are mapped');
  assert(inventory.tasks.length === 3, 'three logon/boot tasks are mapped');
  assert(inventory.services.length === 3, 'only automatic and delayed-auto services are mapped');
  assert(inventory.summary.services === 3, 'service summary matches the measured rows');
  assert(inventory.summary.protectedCount >= 2, 'protected tasks and services are counted');
  assert(inventory.coverage.registryKeys === 4, 'registry coverage counts the measured keys');
  assert(inventory.coverage.scheduledTasks === 3, 'task coverage is measured');

  const oneDrive = inventory.entries.find((entry) => entry.name === 'OneDrive');
  assert(oneDrive && oneDrive.sourceKind === 'registry-run' && oneDrive.scope === 'user', 'HKCU Run maps to a user registry entry');
  assert(oneDrive.state === 'enabled' && oneDrive.elevationRequired === false, 'HKCU state and elevation are measured');
  assert(oneDrive.signature === 'unsigned', 'an unsigned executable is marked unsigned');
  assert(oneDrive.active === true, 'a running executable is marked active');
  assert(!oneDrive.command.includes('tester'), 'the command path is redacted');

  const health = inventory.entries.find((entry) => entry.name === 'SecurityHealth');
  assert(health && health.protection === 'protected', 'SecurityHealth is protected');
  assert(health.elevationRequired === true, 'HKLM requires elevation');
  assert(health.protectionReason, 'protection reason is evidence');

  const legacy = inventory.entries.find((entry) => entry.name === 'LegacyAgent');
  assert(legacy && legacy.state === 'disabled' && legacy.scope === 'machine', 'StartupApproved disabled state is preserved');
  assert(legacy.location.includes('32-bit'), 'WOW6432Node view is stated');

  const oneTime = inventory.entries.find((entry) => entry.name === 'OneTimeSetup');
  assert(oneTime && oneTime.sourceKind === 'registry-runonce', 'RunOnce entries keep their source kind');
  assert(oneTime.evidence.some((line) => /No StartupApproved/i.test(line)), 'unknown approval is stated honestly');

  const chat = inventory.entries.find((entry) => entry.name === 'ChatApp');
  assert(chat && chat.sourceKind === 'startup-folder' && chat.scope === 'user', 'user Startup folder shortcut maps');
  assert(chat.signature === 'valid' && chat.publisher === 'Chat Software Ltd', 'valid signature and publisher are measured');
  assert(chat.active === true && chat.args === '--startup', 'shortcut arguments and running state are measured');
  assert(chat.description === 'Chat launcher', 'shortcut description enriches the dossier');

  const fleet = inventory.entries.find((entry) => entry.name === 'FleetSync');
  assert(fleet && fleet.scope === 'machine' && fleet.elevationRequired === true, 'all-users Startup requires elevation');
  assert(fleet.state === 'disabled', 'all-users StartupApproved disabled state is preserved');

  const userTask = inventory.tasks.find((task) => task.name === 'UserLoginSync');
  assert(userTask && userTask.triggers.includes('logon') && userTask.runLevel === 'Limited', 'logon task trigger is measured');
  assert(userTask.id.startsWith('task:'), 'task ids are stable and prefixed');
  const taskEntry = inventory.entries.find((entry) => entry.id === userTask.id);
  assert(taskEntry && taskEntry.sourceKind === 'scheduled-task', 'task entries share the task id');
  assert(taskEntry.active === true, 'a running executable marks the task entry active');

  const maintenance = inventory.tasks.find((task) => task.name === 'MaintenanceTask');
  assert(maintenance && maintenance.protected === true, 'Windows maintenance tasks are protected');
  assert(maintenance.triggers.includes('boot'), 'boot task trigger is measured');

  const offTask = inventory.tasks.find((task) => task.name === 'AlreadyOff');
  assert(offTask && offTask.state === 'Disabled', 'a disabled task state is measured');

  const vendorAgent = inventory.services.find((service) => service.name === 'VendorAgent');
  assert(vendorAgent && vendorAgent.startupType === 'automatic' && vendorAgent.running === true, 'automatic service is measured');
  const vendorIndex = inventory.services.find((service) => service.name === 'VendorIndex');
  assert(vendorIndex && vendorIndex.startupType === 'delayed' && vendorIndex.delayedAuto === true, 'delayed-auto service is measured');
  const defender = inventory.services.find((service) => service.name === 'WinDefend');
  assert(defender && defender.protected === true, 'Defender service is protected');
  assert(!inventory.services.some((service) => service.name === 'ManualOnly'), 'manual services are excluded');

  assert(inventory.boot.available === true && inventory.boot.eventCount === 2, 'boot diagnostics events are measured');
  assert(inventory.boot.lastBootAt === '2026-10-26T07:12:31.000Z', 'last boot time is the measured value');
  assert(inventory.boot.uptimeSeconds === 17500, 'uptime is measured, not inferred');
  assert(inventory.boot.events.every((event) => event.measured === true), 'every boot event is marked measured');

  const impact = bridge.impact();
  assert(impact.available === true && impact.events.length === 2, 'impact reuses measured boot events');
  assert(impact.attributed.some((entry) => entry.name === 'ChatApp'), 'a Windows event can attribute an entry by its message');
  assert(impact.attributed.every((entry) => entry.delayMs === null), 'no delay milliseconds are inferred');
  assert(impact.uptimeSeconds === 17500, 'impact keeps measured uptime');

  const plan = bridge.plan({ entryIds: [chat.id, health.id, vendorAgent.id, userTask.id], mode: 'disable' });
  assert(plan.contract === 'startup.v1' && plan.immutable === true && plan.mutation === 'none', 'plan is immutable and non-mutating');
  assert(plan.execution.available === false && plan.execution.gate.includes('Mission 09'), 'execution is gated');
  assert(plan.estimatedSavingsMs === null, 'no boot saving is invented');
  assert(plan.itemCount === 4 && plan.protectedCount >= 1 && plan.elevationCount >= 2, 'plan counts protection and elevation');
  assert(plan.items.find((item) => item.entryId === chat.id)?.after === 'disabled', 'a standard entry can be reviewed for disable');
  assert(plan.items.find((item) => item.entryId === health.id)?.protected === true, 'protected entries stay protected in a plan');
  assert(plan.items.find((item) => item.entryId === vendorAgent.id)?.sourceKind === 'service', 'a service target is represented');
  assert(plan.conflictCount >= 1 && plan.warnings.length === plan.conflictCount, 'conflicts are surfaced as warnings');

  const delayPlan = bridge.plan({ entryIds: [chat.id], mode: 'delay', delayMinutes: 15 });
  assert(delayPlan.items[0].after === 'delayed by 15 minutes', 'delay offset is clamped and stated');
  assert(delayPlan.items[0].conflicts.some((line) => /no in-place delay/i.test(line)), 'a non-task delay conflict is declared');

  const batch = bridge.plan({ entryIds: [chat.id, legacy.id], mode: 'batch' });
  assert(batch.mode === 'batch' && batch.items.every((item) => item.action === 'disable'), 'batch staging stays review-only');

  let noJournal = null;
  try {
    bridge.plan({ entryIds: [chat.id], mode: 'restore' });
  } catch (error) {
    noJournal = error.code;
  }
  assert(noJournal === 'STARTUP_NO_JOURNAL', 'restore is refused without a journal');
  let noRollback = null;
  try {
    bridge.plan({ entryIds: [chat.id], mode: 'rollback' });
  } catch (error) {
    noRollback = error.code;
  }
  assert(noRollback === 'STARTUP_NO_JOURNAL', 'rollback is refused without a batch session');

  let invalidMode = null;
  try {
    bridge.plan({ entryIds: [chat.id], mode: 'uninstall' });
  } catch (error) {
    invalidMode = error.code;
  }
  assert(invalidMode === 'STARTUP_PLAN_MODE_INVALID', 'unknown plan modes are rejected');

  const journal = bridge.journal();
  assert(journal.available === false && journal.entries.length === 0, 'journal is empty, not fabricated');
  assert(journal.execution.available === false, 'journal writes are gated');
  const sessions = bridge.sessions();
  assert(sessions.available === false && sessions.sessions.length === 0, 'batch sessions are empty, not fabricated');
  assert(sessions.execution.available === false, 'mass rollback is gated');

  const report = bridge.report();
  assert(report.readOnly === true && report.mutation === 'none', 'report is read-only');
  assert(report.entries.length === inventory.entries.length, 'report carries the measured register');
  assert(report.boot.eventCount === 2, 'report carries measured boot evidence');
  assert(/No startup value was enabled, disabled, delayed, restored or journaled/i.test(report.note), 'report never claims a change');

  // Cancellation is honoured while the measured collectors are still running.
  let releaseTasks;
  const taskGate = new Promise((resolve) => { releaseTasks = resolve; });
  const cancelBridge = createBridge({
    collectors: {
      readSources: async () => sources,
      readTasks: () => taskGate,
      readServices: async () => ({ services, errors: [] }),
      readBoot: async () => ({ boot, errors: [] }),
    },
  });
  const cancelStart = await cancelBridge.start({});
  await wait(30);
  const cancelResult = cancelBridge.cancel(cancelStart.id);
  releaseTasks({ tasks, errors: [] });
  await wait(180);
  const cancelled = cancelBridge.status(cancelStart.id);
  assert(cancelResult.cancelled === true, 'cancel acknowledges the running session');
  assert(cancelled.status === 'cancelled' && cancelled.cancelled === true, 'cancelled session is reported honestly');
  assert((await cancelBridge.inventory()).status === 'partial', 'a cancelled scan does not publish a complete inventory');

  // A failing boot collector degrades to partial without inventing events.
  const partialBridge = createBridge({
    collectors: {
      readSources: async () => sources,
      readTasks: async () => ({ tasks, errors: [] }),
      readServices: async () => ({ services, errors: [] }),
      readBoot: async () => { throw new Error('boot diagnostics denied'); },
    },
  });
  const partialStart = await partialBridge.start({});
  const partial = await settle(partialBridge, partialStart.id);
  assert(partial.status === 'partial', 'a failed boot stage degrades to partial');
  const partialInventory = partialBridge.inventory();
  assert(partialInventory.boot.available === false && partialInventory.boot.events.length === 0, 'failed boot evidence is empty');
  assert(partialInventory.warnings.some((warning) => /boot diagnostics/i.test(warning)), 'the failed stage is stated as a warning');

  // The source must not contain any mutation primitive or shell evaluator.
  const source = fs.readFileSync(path.join(__dirname, '..', 'electron', 'native', 'startup-bridge.cjs'), 'utf8');
  for (const forbidden of ['Set-ItemProperty', 'New-ItemProperty', 'Remove-ItemProperty', 'reg.exe', 'reg add', 'schtasks', 'Set-Service', 'Stop-Service', 'sc.exe', 'Start-Process', 'Remove-Item', 'Move-Item', 'Rename-Item', 'fs.writeFile', 'fs.rename', 'fs.unlink', 'child_process.exec(']) {
    assert(!source.includes(forbidden), `bridge has no mutation call: ${forbidden}`);
  }
  assert(!source.includes('shell.openExternal'), 'the bridge does not open anything itself');

  const result = {
    ok: failures.length === 0,
    services: SERVICE_DEFINITIONS.length,
    stages: STAGE_DEFINITIONS.length,
    entries: inventory.entries.length,
    tasks: inventory.tasks.length,
    servicesMeasured: inventory.services.length,
    bootEvents: inventory.boot.eventCount,
    protectedCount: inventory.summary.protectedCount,
    planItems: plan.itemCount,
    planConflicts: plan.conflictCount,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('[startup-native-test] PASS');
}

main().catch((error) => {
  console.error('[startup-native-test] FAIL', error);
  process.exit(1);
});
