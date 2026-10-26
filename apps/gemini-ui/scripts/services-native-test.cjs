'use strict';

/**
 * Mission 12 controlled Service Commander test.
 * No Windows service is started, stopped, restarted or reconfigured. The
 * bridge runs against injected read-only provider fixtures and a temp journal.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  ServicesBridge,
  SERVICE_TOOLS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS,
} = require('../electron/native/services-bridge.cjs');

const failures = [];
function check(name, run) {
  try {
    run();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`  ✗ ${name}: ${error.message}`);
  }
}

async function checkAsync(name, run) {
  try {
    await run();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`  ✗ ${name}: ${error.message}`);
  }
}

const cacheRoot = path.join(__dirname, '..', 'node_modules', '.cache');
fs.mkdirSync(cacheRoot, { recursive: true });
const journalRoot = fs.mkdtempSync(path.join(cacheRoot, 'knoux-services-test-'));

function service(overrides) {
  return {
    name: 'Svc',
    displayName: 'Service',
    description: 'Controlled fixture',
    state: 'Running',
    startupType: 'automatic',
    delayedAuto: false,
    processId: null,
    serviceType: 'Win32OwnProcess',
    account: 'LocalSystem',
    binaryPath: 'C:\\Windows\\System32\\svc.exe',
    dependencies: [],
    acceptsStop: true,
    provider: 'Win32_Service',
    ...overrides,
  };
}

const serviceFixtures = [
  service({ name: 'RpcSs', displayName: 'Remote Procedure Call', state: 'Running', startupType: 'automatic', processId: 222, dependencies: [] }),
  service({ name: 'WinDefend', displayName: 'Microsoft Defender Antivirus Service', state: 'Running', startupType: 'automatic', processId: 333, dependencies: [] }),
  service({ name: 'MyDriver', displayName: 'Controlled Kernel Driver', state: 'Stopped', startupType: 'manual', processId: null, serviceType: 'kernel Driver', dependencies: [] }),
  service({ name: 'BITS', displayName: 'Background Intelligent Transfer Service', state: 'Stopped', startupType: 'manual', processId: null, dependencies: ['RpcSs'] }),
  service({ name: 'Spooler', displayName: 'Print Spooler', state: 'Running', startupType: 'automatic', processId: 111, dependencies: ['RpcSs'] }),
  service({ name: 'TestSvc', displayName: 'Controlled Test Service', state: 'Running', startupType: 'manual', processId: 444, binaryPath: 'C:\\Program Files\\KNOuX\\test.exe', dependencies: ['RpcSs'] }),
  service({ name: 'AppSvc', displayName: 'Controlled Application Service', state: 'Running', startupType: 'automatic', processId: 555, binaryPath: 'C:\\Program Files\\KNOuX\\app.exe', dependencies: ['Spooler'] }),
];

const eventsFixture = {
  status: 'available',
  events: [
    { timeCreated: '2026-10-26T10:00:00.000Z', id: 7036, level: 4, provider: 'Service Control Manager', message: 'The Print Spooler service entered the running state.' },
    { timeCreated: '2026-10-26T10:05:00.000Z', id: 7034, level: 2, provider: 'Service Control Manager', message: 'The Controlled Test Service service terminated unexpectedly.' },
  ],
};

const processesFixture = {
  processes: [
    { pid: 111, workingSetBytes: 52428800, group: 'spoolsv' },
    { pid: 222, workingSetBytes: 8388608, group: 'rpcss' },
    { pid: 333, workingSetBytes: 104857600, group: 'secsvcs' },
    { pid: 444, workingSetBytes: 20971520, group: 'LocalService' },
  ],
};

function fakeProvider(overrides = {}) {
  const responses = {
    WindowsPrincipal: { isAdmin: false },
    ServiceControlManagerEvents: eventsFixture,
    svchostProcesses: processesFixture,
    ...overrides,
  };
  return {
    collectServices: async () => serviceFixtures,
    powershellJson: async (script, { provider }) => {
      await new Promise((resolve) => setTimeout(resolve, 2));
      if (typeof responses[provider] === 'function') return responses[provider]();
      if (responses[provider] === undefined) throw new Error(`unexpected provider ${provider}`);
      return responses[provider];
    },
  };
}

function createBridge(options = {}) {
  return new ServicesBridge({
    userDataPath: journalRoot,
    loadProvider: () => options.provider || fakeProvider(),
    runFile: async (file, args) => {
      throw new Error(`unexpected executable ${file} ${args.join(' ')}`);
    },
  });
}

async function settle(bridge, sessionId, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const session = bridge.status(sessionId);
    if (session.status !== 'running') return session;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('service session did not settle');
}

async function main() {
  check('12 tools, 6 stages and 6 gates', () => {
    assert.equal(SERVICE_TOOLS.length, 12);
    assert.equal(new Set(SERVICE_TOOLS.map((entry) => entry.id)).size, 12);
    assert.equal(STAGE_DEFINITIONS.length, 6);
    assert.equal(GATED_OPERATIONS.length, 6);
    assert.ok(SERVICE_TOOLS.every((entry) => entry.world === 'services'));
    assert.ok(SERVICE_TOOLS.every((entry) => /[\u0600-\u06FF]/.test(entry.labelAr) && /[\u0600-\u06FF]/.test(entry.noteAr)));
  });

  const bridge = createBridge();
  const started = bridge.start();
  assert.equal(started.status, 'running');
  const session = await settle(bridge, started.id);
  assert.equal(session.status, 'complete');
  assert.equal(session.progress, 100);
  assert.equal(session.readOnly, true);
  assert.equal(session.mutation, 'none');
  assert.equal(session.stages.length, 6);

  const snapshot = await bridge.snapshot();
  check('measured register keeps every service and counts honestly', () => {
    assert.equal(snapshot.contract, 'services.v1');
    assert.equal(snapshot.readOnly, true);
    assert.equal(snapshot.mutation, 'none');
    assert.equal(snapshot.fixtureFallback, false);
    assert.equal(snapshot.services.length, 7);
    assert.equal(snapshot.summary.total, 7);
    assert.equal(snapshot.summary.running, 5);
    assert.equal(snapshot.summary.stopped, 2);
    assert.equal(snapshot.summary.protected, 4);
    assert.equal(snapshot.summary.thirdParty, 2);
    assert.equal(snapshot.elevation.isAdmin, false);
    assert.match(snapshot.receipt, /^services:[a-f0-9]{24}$/);
  });

  check('dependency graph and cascade are computed from measured edges', () => {
    assert.deepEqual(snapshot.services.find((entry) => entry.name === 'RpcSs').dependents.sort(), ['BITS', 'Spooler', 'TestSvc']);
    const rpc = snapshot.services.find((entry) => entry.name === 'RpcSs');
    assert.ok(rpc.protected && rpc.protectionRole === 'rpc');
    assert.ok(snapshot.services.find((entry) => entry.name === 'MyDriver').protectionRole === 'kernel-driver');
    assert.ok(snapshot.services.find((entry) => entry.name === 'WinDefend').protectionRole === 'security');
    assert.ok(snapshot.services.find((entry) => entry.name === 'BITS').protected);
    assert.equal(snapshot.edges.length, 4);
  });

  check('SCM events and svchost hosts are measured', () => {
    assert.equal(snapshot.eventCoverage.status, 'available');
    assert.equal(snapshot.events.length, 2);
    assert.equal(snapshot.events[0].serviceName, 'Spooler');
    assert.ok(snapshot.svchost.length >= 5);
    const rpcHost = snapshot.svchost.find((entry) => entry.pid === 222);
    assert.equal(rpcHost.serviceCount, 1);
    assert.equal(rpcHost.services[0], 'RpcSs');
    const synthetic = snapshot.svchost.find((entry) => entry.pid === 555);
    assert.equal(synthetic.workingSetBytes, null);
  });

  const stopPlan = await bridge.plan({ serviceName: 'TestSvc', action: 'stop' });
  check('stop preview is immutable and non-executable', () => {
    assert.equal(stopPlan.contract, 'services.v1');
    assert.equal(stopPlan.immutable, true);
    assert.equal(stopPlan.mutation, 'none');
    assert.equal(stopPlan.execution.available, false);
    assert.equal(stopPlan.item.action, 'stop');
    assert.equal(stopPlan.item.current.state, 'Running');
    assert.equal(stopPlan.item.proposed.state, 'Stopped');
    assert.equal(stopPlan.item.protected, false);
    assert.equal(stopPlan.item.elevationRequired, true);
    assert.equal(stopPlan.item.conflicts.length, 0);
    assert.match(stopPlan.receipt, /^svcplan:[a-f0-9]{24}$/);
    assert.equal(stopPlan.item.prerequisites.find((entry) => entry.id === 'elevation').status, 'failed');
  });

  const blockedPlan = await bridge.plan({ serviceName: 'RpcSs', action: 'stop' });
  check('protected service and running dependents block the preview', () => {
    assert.equal(blockedPlan.item.protected, true);
    assert.ok(blockedPlan.item.conflicts.some((entry) => /Protected core service/.test(entry)));
    assert.ok(blockedPlan.item.conflicts.some((entry) => /running dependent/.test(entry)));
    assert.equal(blockedPlan.item.protectionRole, 'rpc');
    assert.ok(blockedPlan.warnings.length >= 1);
  });

  const startupPlan = await bridge.plan({ serviceName: 'Spooler', action: 'startup-type', startupType: 'manual' });
  check('startup-type diff is preview-only', () => {
    assert.equal(startupPlan.item.current.startupType, 'automatic');
    assert.equal(startupPlan.item.proposed.startupType, 'manual');
    assert.equal(startupPlan.item.proposed.delayedAuto, false);
    assert.equal(startupPlan.item.execution.available, false);
  });

  await checkAsync('invalid service, action and startup type are refused', async () => {
    await assert.rejects(() => bridge.plan({ serviceName: 'MissingSvc', action: 'stop' }), /not present/);
    await assert.rejects(() => bridge.plan({ serviceName: 'TestSvc', action: 'delete' }), /not supported/);
    await assert.rejects(() => bridge.plan({ serviceName: 'TestSvc', action: 'startup-type', startupType: 'boot' }), /must be automatic/);
    await assert.rejects(() => bridge.plan({ serviceName: 'bad name;', action: 'stop' }), /valid Windows service name/);
  });

  const journal = await bridge.journal();
  check('journal records immutable previews only', () => {
    assert.equal(journal.length, 3);
    assert.ok(journal.every((entry) => entry.mutation === 'none' && entry.readOnly === true));
    assert.ok(journal.some((entry) => entry.kind === 'blocked-preview' && entry.serviceName === 'RpcSs'));
  });

  const report = await bridge.report({ redact: true });
  check('report separates measured evidence and states no execution', () => {
    assert.equal(report.readOnly, true);
    assert.equal(report.mutation, 'none');
    assert.ok(report.sections.length >= 7);
    assert.match(report.summary, /No service operation was executed/);
  });

  check('bridge exposes no service-control method', () => {
    for (const method of ['startService', 'stopService', 'restartService', 'setStartupType', 'run', 'execute', 'sc']) {
      assert.equal(typeof bridge[method], 'undefined', `bridge must not expose ${method}`);
    }
  });

  const failingBridge = createBridge({
    provider: (() => {
      const provider = fakeProvider({ ServiceControlManagerEvents: () => { throw new Error('controlled event failure'); } });
      return provider;
    })(),
  });
  const failingStart = failingBridge.start();
  const failingSession = await settle(failingBridge, failingStart.id);
  const failingSnapshot = await failingBridge.snapshot();
  check('a controlled event failure degrades one stage without inventing data', () => {
    assert.ok(['partial', 'complete'].includes(failingSession.status));
    const eventsStage = failingSession.stages.find((stage) => stage.key === 'events');
    assert.equal(eventsStage.status, 'partial');
    assert.equal(failingSnapshot.events.length, 0);
    assert.equal(failingSnapshot.eventCoverage.status, 'permission_denied');
    assert.ok(failingSession.warnings.some((warning) => /controlled event failure/.test(warning)));
  });

  const cancelBridge = createBridge();
  const cancelStart = cancelBridge.start();
  assert.equal(cancelBridge.cancel(cancelStart.id).cancelled, true);
  const cancelledSession = await settle(cancelBridge, cancelStart.id);
  await checkAsync('cancellation settles without a snapshot', async () => {
    assert.equal(cancelledSession.status, 'cancelled');
    await assert.rejects(() => cancelBridge.snapshot(), /No measured service register/);
  });

  const persistedBridge = createBridge();
  const persistedStart = persistedBridge.start();
  await settle(persistedBridge, persistedStart.id);
  const persistedJournal = await persistedBridge.journal();
  check('journal survives a new bridge instance', () => {
    assert.ok(persistedJournal.length >= 3);
  });

  const source = fs.readFileSync(path.join(__dirname, '..', 'electron', 'native', 'services-bridge.cjs'), 'utf8');
  const providerSource = fs.readFileSync(path.join(__dirname, '..', 'electron', 'native', 'services-providers.cjs'), 'utf8');
  check('native source contains no service-control execution', () => {
    for (const forbidden of ['Start-Service', 'Stop-Service', 'Restart-Service', 'Set-Service', 'sc.exe', 'shell: true', 'spawn(', 'Start-Process', 'Invoke-Expression', 'shutdown.exe']) {
      assert.ok(!source.includes(forbidden), `services-bridge contains ${forbidden}`);
      assert.ok(!providerSource.includes(forbidden), `services-providers contains ${forbidden}`);
    }
    assert.ok(!/runFile\(['"]sc\.exe/i.test(source), 'the bridge never invokes sc.exe');
  });

  const rendererRoot = path.join(__dirname, '..', 'src');
  const catalogSource = fs.readFileSync(path.join(rendererRoot, 'services', 'catalog.ts'), 'utf8');
  const workbenchSource = fs.readFileSync(path.join(rendererRoot, 'services', 'ServicesServiceWorkspaces.tsx'), 'utf8');
  const pageSource = fs.readFileSync(path.join(rendererRoot, 'pages', 'ServicesPage.tsx'), 'utf8');
  const styleSource = fs.readFileSync(path.join(rendererRoot, 'services.css'), 'utf8');
  check('renderer wires every service descriptor to a specialised workbench', () => {
    for (const serviceDef of SERVICE_TOOLS) {
      assert.ok(catalogSource.includes(`id: '${serviceDef.id}'`), `catalog declares ${serviceDef.id}`);
      assert.ok(workbenchSource.includes(`'${serviceDef.id}':`), `a workbench resolves ${serviceDef.id}`);
    }
    assert.match(pageSource, /useServices\(\)/);
    assert.match(pageSource, /ServicesServiceWorkspace/);
    assert.ok(!/from ['"][^'"]*services-inventory/.test(pageSource), 'the old fixture module is not imported');
    assert.ok(!/\bINITIAL_[A-Z]/.test(pageSource) && !/\bSAMPLE_[A-Z]/.test(pageSource), 'no fixture constants are referenced');
    assert.ok(!fs.existsSync(path.join(rendererRoot, 'lib', 'services-inventory.ts')), 'the old services fixture inventory was removed');
    assert.ok(!fs.existsSync(path.join(rendererRoot, 'components', 'services', 'ServicesWorkspaces.tsx')), 'the old generic services modal was removed');
    assert.ok(!fs.existsSync(path.join(rendererRoot, 'services', 'service-registry.ts')), 'the old service registry was removed');
    assert.match(styleSource, /\.svc-main-grid/);
    assert.match(styleSource, /html\[data-theme='light'\] \.svc-tools-panel/);
  });

  await bridge.close();
  await failingBridge.close();
  await cancelBridge.close();
  await persistedBridge.close();

  const result = {
    ok: failures.length === 0,
    tools: SERVICE_TOOLS.length,
    stages: STAGE_DEFINITIONS.length,
    gates: GATED_OPERATIONS.length,
    services: snapshot.services.length,
    protected: snapshot.summary.protected,
    edges: snapshot.edges.length,
    events: snapshot.events.length,
    svchost: snapshot.svchost.length,
    journalEntries: journal.length,
    planItems: stopPlan.itemCount,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  fs.rmSync(journalRoot, { recursive: true, force: true });
  if (!result.ok) process.exit(1);
  console.log('[services-native-test] PASS');
}

main().catch((error) => {
  fs.rmSync(journalRoot, { recursive: true, force: true });
  console.error('[services-native-test] FAIL', error);
  process.exit(1);
});
