'use strict';

/**
 * Mission 11 controlled native test.
 *
 * Exercises the RepairBridge with injected read-only provider/executable
 * fakes. No DISM, SFC, netsh reset, service change, restore or elevation is
 * performed. The journal is written only under the gitignored dependency cache.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  RepairBridge,
  SERVICE_DEFINITIONS,
  COMMAND_SPECS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS,
} = require('../electron/native/repair-bridge.cjs');

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
const journalRoot = fs.mkdtempSync(path.join(cacheRoot, 'knoux-repair-test-'));

const identityFixture = {
  osName: 'Windows 11 Pro',
  osVersion: '10.0.22631',
  osBuild: '22631',
  architecture: '64-bit',
  isAdmin: false,
  powershellVersion: '5.1.22621.1',
  dismAvailable: true,
  sfcAvailable: true,
  pendingReboot: false,
  systemRoot: 'C:\\Windows',
};

const servicingFixture = {
  dismLog: { path: 'C:\\Windows\\Logs\\DISM\\dism.log', exists: true, sizeBytes: 145000, lastWrite: '2026-10-26T10:00:00.000Z' },
  cbsLog: { path: 'C:\\Windows\\Logs\\CBS\\CBS.log', exists: true, sizeBytes: 250000, lastWrite: '2026-10-26T09:00:00.000Z' },
  componentStore: { path: 'C:\\Windows\\WinSxS', exists: true, sizeBytes: null, lastWrite: '2026-10-25T22:00:00.000Z' },
  pendingCbs: false,
  pendingWindowsUpdate: false,
};

const networkFixture = {
  adapters: [
    { name: 'Ethernet', description: 'Intel I219-LM', status: 'Up', linkSpeed: '1 Gbps', mac: 'AA-BB-CC-DD-EE-01' },
    { name: 'Wi-Fi', description: 'Wireless AC', status: 'Disconnected', linkSpeed: '866 Mbps', mac: 'AA-BB-CC-DD-EE-02' },
  ],
  addresses: [
    { interfaceAlias: 'Ethernet', address: '192.0.2.10', prefixLength: 24, origin: 'Dhcp' },
    { interfaceAlias: 'Ethernet', address: '192.0.2.11', prefixLength: 24, origin: 'Dhcp' },
    { interfaceAlias: 'Wi-Fi', address: '198.51.100.20', prefixLength: 24, origin: 'Dhcp' },
  ],
  dns: [
    { interfaceAlias: 'Ethernet', servers: ['192.0.2.53', '192.0.2.54'] },
    { interfaceAlias: 'Wi-Fi', servers: [] },
  ],
};

const updateFixture = {
  services: [
    { name: 'wuauserv', displayName: 'Windows Update', status: 'Stopped', startType: 'Manual' },
    { name: 'bits', displayName: 'Background Intelligent Transfer Service', status: 'Stopped', startType: 'Manual' },
    { name: 'cryptsvc', displayName: 'Cryptographic Services', status: 'Running', startType: 'Automatic' },
  ],
  softwareDistribution: { path: 'C:\\Windows\\SoftwareDistribution', exists: true },
  download: { path: 'C:\\Windows\\SoftwareDistribution\\Download', exists: true, items: 17 },
  pendingReboot: false,
};

const restoreFixture = {
  status: 'permission_denied',
  points: [],
  enabled: null,
  reason: 'Access denied',
};

const troubleshooterFixture = { msdtAvailable: true, commandAvailable: false };

function fakeProvider(overrides = {}) {
  const responses = {
    'WindowsPrincipal+Win32_OperatingSystem': identityFixture,
    ServicingLogMetadata: servicingFixture,
    NetTCPIP: networkFixture,
    UpdateServices: updateFixture,
    'Get-ComputerRestorePoint': restoreFixture,
    TroubleshooterCapability: troubleshooterFixture,
    ...overrides,
  };
  return {
    powershellJson: async (script, { provider }) => {
      await new Promise((resolve) => setTimeout(resolve, 2));
      if (typeof responses[provider] === 'function') return responses[provider]();
      if (responses[provider] === undefined) throw new Error(`unexpected provider ${provider}`);
      return responses[provider];
    },
  };
}

function fakeRunner(overrides = {}) {
  return async (file, args) => {
    const key = `${file} ${args.join(' ')}`;
    if (key === 'ipconfig.exe /displaydns') {
      return { stdout: 'Windows IP Configuration\n\n    Record Name . . . . . : one.test\n    Record Name . . . . . : two.test\n    Record Name . . . . . : three.test\n' };
    }
    if (key === 'netsh.exe winsock show catalog') {
      return {
        stdout: [
          'Winsock Catalog Provider Entry',
          '------------------------------------------------------',
          'Entry Type:                         Base Service Provider',
          'Description:                        MSAFD Tcpip [TCP/IP]',
          '',
          'Winsock Catalog Provider Entry',
          '------------------------------------------------------',
          'Entry Type:                         Layered Chain',
          'Description:                        KNOuX test chain',
          '',
        ].join('\n'),
      };
    }
    if (overrides[key]) return overrides[key]();
    throw new Error(`unexpected executable ${key}`);
  };
}

function createBridge({ provider = fakeProvider(), runner = fakeRunner() } = {}) {
  return new RepairBridge({
    userDataPath: journalRoot,
    loadProvider: () => provider,
    runFile: runner,
  });
}

async function settle(bridge, sessionId, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const session = bridge.status(sessionId);
    if (session.status !== 'running') return session;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('repair session did not settle');
}

async function main() {
  check('twelve canonical services, ten command previews, six stages, eight gates', () => {
    assert.equal(SERVICE_DEFINITIONS.length, 12);
    assert.equal(new Set(SERVICE_DEFINITIONS.map((entry) => entry.id)).size, 12);
    assert.equal(COMMAND_SPECS.length, 10);
    assert.equal(STAGE_DEFINITIONS.length, 6);
    assert.equal(GATED_OPERATIONS.length, 8);
    assert.ok(SERVICE_DEFINITIONS.every((entry) => entry.world === 'repair'));
    assert.ok(SERVICE_DEFINITIONS.every((entry) => /[\u0600-\u06FF]/.test(entry.labelAr) && /[\u0600-\u06FF]/.test(entry.noteAr)));
    assert.ok(COMMAND_SPECS.every((entry) => entry.execution.available === false));
    assert.ok(COMMAND_SPECS.every((entry) => /[\u0600-\u06FF]/.test(entry.labelAr)));
  });

  const bridge = createBridge();
  const started = bridge.start();
  assert.equal(started.status, 'running');
  const session = await settle(bridge, started.id);
  assert.equal(session.status, 'complete', 'the controlled scan completes');
  assert.equal(session.progress, 100);
  assert.equal(session.readOnly, true);
  assert.equal(session.mutation, 'none');
  assert.equal(session.stages.length, 6);
  assert.ok(session.stages.filter((stage) => stage.key !== 'restore').every((stage) => stage.status === 'complete'));
  assert.equal(session.stages.find((stage) => stage.key === 'restore').status, 'partial');

  const snapshot = await bridge.snapshot();
  check('measured snapshot keeps the controlled identity and elevation truth', () => {
    assert.equal(snapshot.contract, 'repair.v1');
    assert.equal(snapshot.readOnly, true);
    assert.equal(snapshot.mutation, 'none');
    assert.equal(snapshot.fixtureFallback, false);
    assert.equal(snapshot.identity.osBuild, '22631');
    assert.equal(snapshot.identity.isAdmin, false);
    assert.equal(snapshot.identity.dismAvailable, true);
    assert.equal(snapshot.identity.sfcAvailable, true);
    assert.match(snapshot.receipt, /^repair:[a-f0-9]{24}$/);
  });

  check('servicing metadata is measured and health is not invented', () => {
    assert.equal(snapshot.servicing.dismLog.exists, true);
    assert.equal(snapshot.servicing.dismLog.sizeBytes, 145000);
    assert.equal(snapshot.servicing.componentStoreHealth, 'not-run');
  });

  check('network, DNS count and Winsock catalog are measured', () => {
    assert.equal(snapshot.network.adapters.length, 2);
    assert.equal(snapshot.network.addresses.length, 3);
    assert.equal(snapshot.network.dnsCache.status, 'measured');
    assert.equal(snapshot.network.dnsCache.entryCount, 3);
    assert.equal(snapshot.network.winsock.status, 'measured');
    assert.equal(snapshot.network.winsock.providerCount, 2);
    assert.deepEqual(snapshot.network.winsock.categories.sort(), ['Base Service Provider', 'Layered Chain']);
  });

  check('update services and cache metadata are measured', () => {
    assert.equal(snapshot.update.services.length, 3);
    assert.equal(snapshot.update.download.items, 17);
    assert.equal(snapshot.update.services.find((entry) => entry.name === 'wuauserv').status, 'Stopped');
  });

  check('restore access denial is explicit', () => {
    assert.equal(snapshot.restore.status, 'permission_denied');
    assert.equal(snapshot.restore.points.length, 0);
    assert.match(snapshot.restore.reason, /Access denied/);
  });

  check('troubleshooters expose measured capability, not a fake list', () => {
    assert.equal(snapshot.troubleshooters.msdtAvailable, true);
    assert.equal(snapshot.troubleshooters.commandAvailable, false);
    assert.equal(snapshot.troubleshooters.categories.length, 4);
    assert.ok(snapshot.troubleshooters.categories.every((entry) => entry.checklistEn.length >= 3));
  });

  check('journal starts empty and snapshot coverage includes all stages', () => {
    assert.equal(snapshot.journal.length, 0);
    assert.equal(snapshot.coverage.length, 6);
  });

  const plan = await bridge.plan(['repair-component-restore', 'repair-dns-flush', 'repair-winsock-reset']);
  check('plan is immutable, preview-only and never executable', () => {
    assert.equal(plan.contract, 'repair.v1');
    assert.equal(plan.readOnly, true);
    assert.equal(plan.mutation, 'none');
    assert.equal(plan.immutable, true);
    assert.equal(plan.mode, 'preview');
    assert.equal(plan.itemCount, 3);
    assert.equal(plan.execution.available, false);
    assert.equal(plan.elevationRequired, true);
    assert.equal(plan.rebootRequired, true);
    assert.equal(plan.journalRecorded, true);
    assert.match(plan.receipt, /^plan:[a-f0-9]{24}$/);
    for (const item of plan.items) {
      assert.equal(item.execution.available, false);
      assert.ok(item.prerequisites.length >= 2);
      assert.ok(item.evidence.length >= 1);
      assert.ok(item.impactEn.length > 20);
      assert.ok(/[\u0600-\u06FF]/.test(item.impactAr));
    }
  });

  check('administrative prerequisite is honest without elevation', () => {
    const restore = plan.items.find((item) => item.toolId === 'repair-component-restore');
    assert.equal(restore.elevationRequired, true);
    assert.equal(restore.prerequisites.find((entry) => entry.id === 'elevation').status, 'failed');
    assert.match(restore.prerequisites.find((entry) => entry.id === 'elevation').detail, /not elevated/);
    const dns = plan.items.find((item) => item.toolId === 'repair-dns-flush');
    assert.equal(dns.command.display, 'ipconfig.exe /flushdns');
    assert.equal(dns.command.execution.available, false);
  });

  const journal = await bridge.journal();
  check('journal contains exactly one immutable preview', () => {
    assert.equal(journal.length, 1);
    assert.equal(journal[0].kind, 'preview');
    assert.equal(journal[0].mutation, 'none');
    assert.equal(journal[0].readOnly, true);
    assert.equal(journal[0].toolIds.length, 3);
  });

  const report = await bridge.report({ redact: true });
  check('report separates measured and unknown evidence and states no execution', () => {
    assert.equal(report.readOnly, true);
    assert.equal(report.mutation, 'none');
    assert.equal(report.redacted, true);
    assert.ok(report.sections.length >= 7);
    assert.match(report.summary, /No repair command was executed/);
    assert.ok(report.sections.some((section) => section.id === 'gates' && section.items.length === 8));
  });

  check('allowlisted settings handoffs only', () => {
    assert.equal(bridge.settingsTarget('windowsupdate').uri, 'ms-settings:windowsupdate');
    assert.equal(bridge.settingsTarget('troubleshoot').uri, 'ms-settings:troubleshoot');
    assert.equal(bridge.settingsTarget('recovery').uri, 'ms-settings:recovery');
    assert.throws(() => bridge.settingsTarget('registry'), /not allowlisted/);
  });

  await checkAsync('unknown and empty tool lists are refused', async () => {
    await assert.rejects(() => bridge.plan([]), /At least one repair tool/);
    await assert.rejects(() => bridge.plan(['repair-unknown']), /not registered/);
  });

  check('bridge exposes no execution or mutation method', () => {
    for (const method of ['run', 'execute', 'apply', 'reset', 'flushDns', 'sfc', 'dism', 'elevate', 'writeHosts']) {
      assert.equal(typeof bridge[method], 'undefined', `bridge must not expose ${method}`);
    }
  });

  // Failure path: one provider fails; the rest of the session remains honest.
  const failingBridge = createBridge({
    provider: fakeProvider({ NetTCPIP: () => { throw new Error('controlled adapter failure'); } }),
  });
  const failingStart = failingBridge.start();
  const failingSession = await settle(failingBridge, failingStart.id);
  const failingSnapshot = await failingBridge.snapshot();
  check('a controlled provider failure degrades one stage without inventing data', () => {
    assert.ok(['partial', 'complete'].includes(failingSession.status));
    const networkStage = failingSession.stages.find((stage) => stage.key === 'network');
    assert.equal(networkStage.status, 'unavailable');
    assert.equal(failingSnapshot.network.adapters.length, 0);
    assert.ok(failingSession.warnings.some((warning) => /controlled adapter failure/.test(warning)));
  });

  const cancelBridge = createBridge();
  const cancelStart = cancelBridge.start();
  const cancelled = cancelBridge.cancel(cancelStart.id);
  assert.equal(cancelled.cancelled, true);
  const cancelledSession = await settle(cancelBridge, cancelStart.id);
  await checkAsync('cancellation settles without a snapshot', async () => {
    assert.equal(cancelledSession.status, 'cancelled');
    await assert.rejects(() => cancelBridge.snapshot(), /No measured repair evidence/);
  });

  const persisted = createBridge();
  const persistedStart = persisted.start();
  await settle(persisted, persistedStart.id);
  const persistedJournal = await persisted.journal();
  check('journal survives a new bridge instance', () => {
    assert.ok(persistedJournal.length >= 1);
  });

  const source = fs.readFileSync(path.join(__dirname, '..', 'electron', 'native', 'repair-bridge.cjs'), 'utf8');
  const providerSource = fs.readFileSync(path.join(__dirname, '..', 'electron', 'native', 'repair-providers.cjs'), 'utf8');
  check('native source contains no administrative execution call', () => {
    for (const forbidden of ['shell: true', 'spawn(', 'Start-Process', 'Invoke-Expression', 'Stop-Service', 'Set-Service', 'Remove-Item', 'Restart-Computer', 'shutdown.exe', 'reg add', 'reg delete', 'netsh.exe winsock reset', 'ipconfig.exe /flushdns']) {
      assert.ok(!source.includes(forbidden), `repair-bridge contains ${forbidden}`);
    }
    for (const forbidden of ['shell: true', 'spawn(', 'child_process', 'Start-Process', 'Invoke-Expression', 'Stop-Service', 'Set-Service', 'Remove-Item', 'Restart-Computer', 'shutdown.exe', 'reg add', 'reg delete']) {
      assert.ok(!providerSource.includes(forbidden), `repair-providers contains ${forbidden}`);
    }
    assert.ok(!/runFile\(['"](?:dism|sfc|rstrui)\.exe/i.test(source), 'the bridge never executes DISM/SFC/Restore');
    assert.ok(!/runFile\(['"]netsh\.exe['"],\s*\[\s*['"]winsock['"],\s*['"]reset/i.test(source), 'the bridge never resets Winsock');
  });

  const rendererRoot = path.join(__dirname, '..', 'src');
  const catalogSource = fs.readFileSync(path.join(rendererRoot, 'repair', 'catalog.ts'), 'utf8');
  const workbenchSource = fs.readFileSync(path.join(rendererRoot, 'repair', 'RepairServiceWorkspaces.tsx'), 'utf8');
  const pageSource = fs.readFileSync(path.join(rendererRoot, 'pages', 'RepairPage.tsx'), 'utf8');
  const styleSource = fs.readFileSync(path.join(rendererRoot, 'repair.css'), 'utf8');
  check('renderer wires every repair descriptor to a specialised workbench', () => {
    for (const service of SERVICE_DEFINITIONS) {
      assert.ok(catalogSource.includes(`id: '${service.id}'`), `catalog declares ${service.id}`);
      assert.ok(workbenchSource.includes(`'${service.id}':`), `a workbench resolves ${service.id}`);
    }
    assert.match(pageSource, /useRepair\(\)/);
    assert.match(pageSource, /RepairServiceWorkspace/);
    assert.ok(!/repair-inventory/.test(pageSource), 'the fixture inventory is not imported');
    assert.ok(!/\bINITIAL_[A-Z]/.test(pageSource) && !/\bSAMPLE_[A-Z]/.test(pageSource), 'no fixture constants are referenced');
    assert.ok(!fs.existsSync(path.join(rendererRoot, 'lib', 'repair-inventory.ts')), 'the old repair fixture inventory was removed');
    assert.ok(!fs.existsSync(path.join(rendererRoot, 'components', 'repair', 'RepairWorkspaces.tsx')), 'the old generic repair modal was removed');
    assert.match(styleSource, /\.rep-workspace-grid/);
    assert.match(styleSource, /html\[data-theme='light'\] \.rep-tools-panel/);
  });

  await bridge.close();
  await failingBridge.close();
  await cancelBridge.close();
  await persisted.close();

  const result = {
    ok: failures.length === 0,
    services: SERVICE_DEFINITIONS.length,
    commands: COMMAND_SPECS.length,
    stages: STAGE_DEFINITIONS.length,
    gates: GATED_OPERATIONS.length,
    adapters: snapshot.network.adapters.length,
    dnsEntries: snapshot.network.dnsCache.entryCount,
    winsockProviders: snapshot.network.winsock.providerCount,
    updateServices: snapshot.update.services.length,
    journalEntries: journal.length,
    planItems: plan.itemCount,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  fs.rmSync(journalRoot, { recursive: true, force: true });
  if (!result.ok) process.exit(1);
  console.log('[repair-native-test] PASS');
}

main().catch((error) => {
  fs.rmSync(journalRoot, { recursive: true, force: true });
  console.error('[repair-native-test] FAIL', error);
  process.exit(1);
});
