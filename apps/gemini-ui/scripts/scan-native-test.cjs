'use strict';

/**
 * Targeted read-only Smart Scan test.
 *
 * A controlled temp folder and stub Windows providers prove the coordinator
 * composes only measured evidence, persists honest sessions and never mutates
 * the source. No real user file, volume, service, startup entry or registry
 * value is read or changed.
 */

const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { StudioBridge } = require('../electron/native/studio-bridge.cjs');
const { FilesBridge } = require('../electron/native/files-bridge.cjs');
const { StorageBridge } = require('../electron/native/storage-bridge.cjs');
const { ScanBridge } = require('../electron/native/scan-bridge.cjs');

const failures = [];
const assert = (condition, label) => {
  if (!condition) failures.push(label);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function envelope(capability, source, data, extra = {}) {
  return {
    contractVersion: 1,
    capability,
    requestId: crypto.randomUUID(),
    status: 'complete',
    source,
    observedAt: new Date().toISOString(),
    permission: 'read-only',
    warnings: [],
    provenance: {
      provider: source,
      mode: 'measured',
      observedAt: new Date().toISOString(),
      coverage: 'full',
      permissions: ['read-only'],
      warnings: [],
    },
    data,
    ...extra,
  };
}

function systemSummary() {
  return envelope('system.summary', 'test system provider', {
    platform: 'win32',
    osCaption: 'Windows 11 Pro (test envelope)',
    osVersion: '10.0.99999',
    osBuild: '99999',
    osArchitecture: '64-bit',
    uptimeSeconds: 12345,
    uptimeSource: 'test',
    cpuModel: 'Test CPU',
    cpuCores: 8,
    cpuLogicalProcessors: 16,
    cpuLoadPercent: 42,
    cpuLoadSource: 'test processor provider',
    memoryTotalBytes: 32 * 1024 ** 3,
    memoryFreeBytes: 32 * 1024 ** 3 * 0.14,
    memoryUsedPercent: 86,
    systemDrive: 'C:',
    systemDriveFreeBytes: 40 * 1024 ** 3,
    systemDriveTotalBytes: 100 * 1024 ** 3,
    volumes: [],
    degraded: false,
  });
}

function servicesSummary() {
  return envelope('services.summary', 'test service provider', {
    total: 312,
    running: 180,
    stopped: 132,
    automatic: 140,
    manual: 150,
    disabled: 22,
    protectedCount: 14,
    provider: 'test Win32_Service',
  });
}

function volumeProvider(overrides = {}) {
  return envelope('system.summary', 'test Win32 logical disks', {
    volumes: [
      { deviceId: 'C:', label: 'System', fileSystem: 'NTFS', sizeBytes: 100 * 1024 ** 3, freeBytes: 40 * 1024 ** 3 },
      { deviceId: 'D:', label: 'Data', fileSystem: 'NTFS', sizeBytes: 200 * 1024 ** 3, freeBytes: 5 * 1024 ** 3 },
      ...(overrides.volumes || []),
    ],
  });
}

const startupProvider = {
  collectStartupItems: async () => [
    {
      name: 'Controlled Sync Helper',
      source: 'registry-run-user',
      sourceDetail: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      writable: true,
      managedBySmartOrganizer: true,
      provider: 'Win32_StartupCommand',
    },
    {
      name: 'Controlled Agent Service',
      source: 'startup-folder-common',
      sourceDetail: 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\StartUp',
      writable: false,
      managedBySmartOrganizer: false,
      provider: 'Win32_StartupCommand',
    },
  ],
  collectUninstallApps: async () => ({
    items: [
      { name: 'Controlled App One', version: '1.2.3', publisher: 'KNOuX Test' },
      { name: 'Controlled App Two', version: '4.5.6', publisher: 'KNOuX Test' },
      { name: 'Controlled Tool', version: '7.8.9', publisher: 'Another Publisher' },
    ],
    sourceFailures: 1,
    entryFailures: 0,
    roots: [],
  }),
};

async function statMap(root) {
  const map = new Map();
  async function walk(dir) {
    for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) {
        const stat = await fsp.stat(full);
        map.set(path.relative(root, full), `${stat.size}:${stat.mtimeMs}`);
      }
    }
  }
  await walk(root);
  return map;
}

async function waitForEvent(events, predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (events.some(predicate)) return true;
    await sleep(30);
  }
  return false;
}

async function waitForSession(bridge, sessionId, done = ['complete', 'partial', 'cancelled', 'failed'], timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    const session = await bridge.status(sessionId);
    last = session;
    if (done.includes(session.status)) return session;
    await sleep(40);
  }
  throw new Error(`Timed out waiting for scan session ${sessionId}; last status=${last?.status}`);
}

(async () => {
  const sandbox = await fsp.mkdtemp(path.join(os.tmpdir(), 'knoux-scan-native-test-'));
  const userData = path.join(sandbox, 'profile');
  const source = path.join(sandbox, 'source');
  await fsp.mkdir(path.join(source, 'alpha', 'nested'), { recursive: true });
  await fsp.mkdir(path.join(source, 'beta'), { recursive: true });
  await fsp.mkdir(path.join(source, 'empty-folder'), { recursive: true });
  const shared = crypto.randomBytes(2 * 1024 * 1024);
  const different = crypto.randomBytes(2 * 1024 * 1024);
  await fsp.writeFile(path.join(source, 'alpha', 'copy-a.bin'), shared);
  await fsp.writeFile(path.join(source, 'alpha', 'nested', 'copy-b.bin'), shared);
  await fsp.writeFile(path.join(source, 'beta', 'different.bin'), different);
  await fsp.writeFile(path.join(source, 'notes.txt'), 'controlled scan fixture\n', 'utf8');
  const downloaded = path.join(source, 'downloaded.bin');
  await fsp.writeFile(downloaded, 'downloaded controlled file\n', 'utf8');
  let zoneAvailable = false;
  try {
    await fsp.writeFile(
      `${downloaded}:Zone.Identifier`,
      '[ZoneTransfer]\r\nZoneId=3\r\nHostUrl=https://example.invalid/controlled\r\nReferrerUrl=https://example.invalid/\r\n',
      'utf8'
    );
    zoneAvailable = true;
  } catch {
    // ADS is not available on every filesystem; the sample must still be honest.
  }
  const largePath = path.join(source, 'sparse-large.bin');
  const largeHandle = await fsp.open(largePath, 'w');
  try {
    await largeHandle.truncate(201 * 1024 * 1024);
  } finally {
    await largeHandle.close();
  }
  const before = await statMap(source);

  const studio = new StudioBridge({
    userDataPath: userData,
    nativeImage: null,
    isPackaged: false,
    chooseFolder: async () => source,
    emit: () => {},
  });
  const files = new FilesBridge({
    studio,
    shell: { openPath: async () => '', showItemInFolder: () => {} },
  });
  const storage = new StorageBridge({
    studio,
    files,
    readSystemSummary: async () => volumeProvider(),
    userDataPath: userData,
  });

  await studio.init();
  await storage.init();
  const added = await studio.addSource(source);
  await studio.scanSource(added.id);

  const events = [];
  const bridge = new ScanBridge({
    studio,
    files,
    storage,
    readSystemSummary: async () => systemSummary(),
    readServicesSummary: async () => servicesSummary(),
    loadProvider: () => startupProvider,
    userDataPath: userData,
    emit: (event) => events.push(event),
  });
  await bridge.init();

  const capabilities = bridge.capabilities();
  assert(capabilities.contract === 'scan.v1', 'scan capability contract is versioned');
  assert(capabilities.readOnly === true && capabilities.mutation === 'none', 'scan coordinator is read-only');
  assert(capabilities.fixtureFallback === false, 'scan coordinator declares no fixture fallback');
  assert(capabilities.services.length === 10, 'ten Smart Scan services are advertised');
  assert(capabilities.stages.length === 10, 'ten measured scan stages are advertised');
  assert(capabilities.gatedOperations.some((entry) => entry.id === 'cleanup.execute' && entry.mission === '08'), 'cleanup remains gated to Mission 08');
  assert(capabilities.gatedOperations.some((entry) => entry.id === 'applications.uninstall' && entry.mission === '08'), 'uninstall remains gated to Mission 08, matching the app bridge');

  let missingSource = null;
  try {
    await bridge.start({ mode: 'quick' });
  } catch (error) {
    missingSource = error?.code || null;
  }
  assert(missingSource === 'SCAN_SOURCE_REQUIRED', 'quick scan without an authorized source is rejected');

  let badSource = null;
  try {
    await bridge.start({ mode: 'quick', sourceId: '00000000-0000-4000-8000-000000000000' });
  } catch (error) {
    badSource = error?.code || null;
  }
  assert(badSource === 'SCAN_SOURCE_NOT_FOUND', 'unknown source ids are rejected');

  const quickStarted = await bridge.start({ mode: 'quick', sourceId: added.id });
  const quick = await waitForSession(bridge, quickStarted.sessionId);
  assert(quick.status === 'complete', `quick scan completes (got ${quick.status})`);
  assert(quick.mode === 'quick' && quick.sourceId === added.id, 'quick session records its mode and source');
  assert(quick.progressPercent === 100, 'completed quick scan reports 100% stage-weighted progress');
  assert(quick.stages.length === 5, 'quick scan runs four measured stages plus local analysis');
  assert(quick.stages.find((stage) => stage.id === 'inventory')?.status === 'complete', 'inventory stage completed');
  assert(quick.stages.find((stage) => stage.id === 'capacity')?.status === 'complete', 'capacity stage completed');
  assert(quick.stages.find((stage) => stage.id === 'system')?.status === 'complete', 'system stage completed');
  assert(quick.stages.find((stage) => stage.id === 'services')?.status === 'complete', 'services stage completed');
  assert(quick.stages.every((stage) => stage.durationMs === null || stage.durationMs >= 0), 'stage durations are measured, not negative');
  assert(quick.services.length === 1 && quick.services[0].serviceId === 'quick_scan', 'quick scan returns its service result');
  assert(quick.services[0].permission === 'read-only' && quick.services[0].mutation === 'none', 'service result is read-only');
  assert(quick.summary.filesIndexed === 6, `quick scan counts the controlled files (got ${quick.summary.filesIndexed})`);
  assert(quick.summary.filesIndexed !== null && quick.summary.bytesIndexed > 200 * 1024 * 1024, 'quick scan reports measured bytes including the sparse file');
  assert(quick.summary.stagesCompleted === 5, 'summary counts measured stages');
  assert(Number.isFinite(quick.summary.healthScore), 'health score is derived from numeric measured signals');
  assert(quick.kpis.length === 6, 'six measured KPI cards are returned');
  assert(quick.kpis.find((kpi) => kpi.id === 'files')?.provenance === 'measured', 'KPI provenance says measured');
  const quickCoverage = quick.kpis.find((kpi) => kpi.id === 'coverage');
  assert(quickCoverage?.value === '100%' && quickCoverage?.subtextEn === '5/5 stages returned', `coverage KPI reads the measured stage counters (got ${JSON.stringify(quickCoverage)})`);
  const quickSpace = quick.kpis.find((kpi) => kpi.id === 'space');
  assert(quickSpace?.provenance === 'unavailable' && quickSpace?.value === '—', 'quick scan does not claim duplicate bytes that were not measured');
  const quickPrivacy = quick.kpis.find((kpi) => kpi.id === 'privacy');
  assert(quickPrivacy?.provenance === 'unavailable' && quickPrivacy?.value === '—', 'quick scan does not show an unmeasured privacy zero');
  const quickBreakdownTotal = quick.breakdown.reduce((sum, group) => sum + group.percentage, 0);
  assert(quickBreakdownTotal >= 99 && quickBreakdownTotal <= 101, 'breakdown percentages partition the measured findings');
  assert(quick.findings.some((finding) => finding.kind === 'large-file'), 'large-file finding is derived from the measured size');
  assert(quick.services[0].data.volumes.length === 2, 'quick scan reuses the measured volumes');
  assert(quick.services[0].data.services.total === 312, 'quick scan reuses the measured service summary');
  assert(quick.limitations.some((entry) => /Read-only/i.test(entry)), 'quick scan states its read-only limitation');
  assert(await waitForEvent(events, (event) => event.type === 'scan-started'), 'scan-started event is emitted');
  assert(events.filter((event) => event.type === 'scan-stage').length >= 8, 'every stage transition is emitted');
  assert(await waitForEvent(events, (event) => event.type === 'scan-complete'), 'scan-complete event is emitted');

  const persistedQuick = await bridge.status(quick.id);
  assert(persistedQuick.id === quick.id && persistedQuick.summary.filesIndexed === quick.summary.filesIndexed, 'persisted session is reloadable by id');
  const historyAfterQuick = await bridge.history();
  assert(historyAfterQuick.length === 1 && historyAfterQuick[0].id === quick.id, 'history records the completed scan');

  const deepStarted = await bridge.start({ mode: 'deep', sourceId: added.id });
  const deep = await waitForSession(bridge, deepStarted.sessionId);
  assert(deep.status === 'complete', `deep scan completes (got ${deep.status})`);
  assert(deep.stages.length === 10, 'deep scan runs all nine providers plus local analysis');
  assert(deep.services[0].serviceId === 'deep_scan', 'deep scan returns its service result');
  assert(deep.summary.verifiedDuplicateGroups >= 1, 'deep scan verifies the controlled duplicate pair');
  assert(deep.summary.verifiedReclaimableBytes >= 2 * 1024 * 1024, 'verified reclaimable bytes are measured');
  assert(deep.findings.some((finding) => finding.kind === 'duplicate-verified'), 'verified duplicate finding is reported');
  assert(deep.services[0].data.duplicateSummary?.verifiedGroups === deep.summary.verifiedDuplicateGroups, 'service data carries the duplicate summary');
  assert(deep.services[0].data.startupCount === 2, 'deep scan reports the measured startup entries');
  assert(deep.services[0].data.appCount === 3, 'deep scan reports the measured installed applications');
  assert(deep.services[0].data.privacySample?.sampled >= 1, 'deep scan reads a bounded privacy sample');
  if (zoneAvailable) {
    assert(deep.services[0].data.privacySample.withZone >= 1, 'Zone.Identifier sample is read when Windows ADS is available');
  }
  assert(deep.services[0].data.emptyFolders?.summary?.emptyFolders === 1, 'deep scan measures the controlled empty folder');
  assert(deep.findings.some((finding) => finding.kind === 'startup-item'), 'startup findings come from the measured provider');
  assert(deep.findings.some((finding) => finding.kind === 'empty-folder'), 'empty-folder finding is measured');
  assert(deep.findings.some((finding) => finding.kind === 'privacy-origin') === zoneAvailable, 'privacy finding only appears when an origin marker exists');
  assert(Number.isFinite(deep.summary.healthScore), 'deep scan derives a health score from the measured system signals');
  assert(deep.summary.healthScore < 100, 'health score reflects the measured low-space volume');
  assert(deep.summary.verifiedDuplicateGroups >= 1 && deep.kpis.find((kpi) => kpi.id === 'space')?.provenance === 'measured', 'deep scan KPI derives from verified duplicates');
  assert(deep.kpis.find((kpi) => kpi.id === 'space')?.value !== '—', 'measured duplicate bytes are shown once the stage runs');
  assert(deep.kpis.find((kpi) => kpi.id === 'privacy')?.value === String(deep.summary.privacySignalCount), 'measured privacy markers are shown once the sample runs');
  assert(deep.breakdown.every((group) => group.percentage >= 0 && group.percentage <= 100), 'breakdown groups stay inside the measured count share');
  assert(await waitForEvent(events, (event) => event.type === 'scan-complete' && event.sessionId === deep.id), 'completion event identifies the session');
  assert(deep.recommendations.length >= 3, 'recommendations are derived from measured evidence');
  assert(deep.recommendations.every((entry) => entry.confidence === 'measured' || entry.confidence === 'derived'), 'recommendations state their evidence confidence');
  assert(deep.recommendations.every((entry) => !/\bAI\b|\bGPT\b|Gemini/i.test(entry.detailEn)), 'recommendations do not claim an AI provider');
  const reopenedDeep = await bridge.status(deep.id);
  assert(reopenedDeep.id === deep.id && reopenedDeep.findings.length === deep.findings.length, 'a persisted deep session reloads intact');

  const serviceStarted = await bridge.start({ mode: 'service', services: ['startup_impact_check'] });
  const startupOnly = await waitForSession(bridge, serviceStarted.sessionId);
  assert(startupOnly.status === 'complete', 'startup service runs without a file source');
  assert(startupOnly.scope === 'system-providers-only', 'startup-only scan announces its system scope');
  assert(startupOnly.sourceId === null, 'startup-only scan does not invent a source id');
  assert(startupOnly.stages.length === 2, 'startup service runs one provider plus analysis');
  assert(startupOnly.services[0].data.bootTimeMeasured === false, 'startup service refuses to invent boot seconds');
  assert(startupOnly.services[0].data.mutationAvailable === false, 'startup mutation is not exposed');

  const customStarted = await bridge.start({
    mode: 'custom',
    sourceId: added.id,
    services: ['duplicate_finder', 'large_files_review'],
  });
  const custom = await waitForSession(bridge, customStarted.sessionId);
  assert(custom.status === 'complete', 'custom scan completes');
  assert(custom.requestedServices.length === 2, 'custom scan records both requested services');
  assert(custom.services.length === 2, 'custom scan returns two service results');
  assert(custom.services.find((service) => service.serviceId === 'duplicate_finder')?.data.verified?.groups?.length >= 1, 'custom duplicate service carries verified groups');
  assert(custom.services.find((service) => service.serviceId === 'large_files_review')?.data.files?.length >= 1, 'custom large-files service carries measured files');
  assert(custom.stages.every((stage) => ['complete', 'partial'].includes(stage.status)), 'custom scan only composes the selected stages');

  let invalidMode = null;
  try {
    await bridge.start({ mode: 'not-a-mode', sourceId: added.id });
  } catch (error) {
    invalidMode = error?.code || null;
  }
  assert(invalidMode === 'SCAN_MODE_INVALID', 'unknown scan modes are rejected');

  const slowProvider = {
    collectStartupItems: async () => {
      await sleep(600);
      return [];
    },
    collectUninstallApps: async () => ({ items: [], sourceFailures: 0, entryFailures: 0 }),
  };
  const cancellable = new ScanBridge({
    studio,
    files,
    storage,
    readSystemSummary: async () => systemSummary(),
    readServicesSummary: async () => servicesSummary(),
    loadProvider: () => slowProvider,
    userDataPath: userData,
  });
  await cancellable.init();
  const cancelStarted = await cancellable.start({ mode: 'service', services: ['startup_impact_check'] });
  await sleep(150);
  const cancelAck = await cancellable.cancel(cancelStarted.sessionId);
  assert(cancelAck.cancelled === true, 'cancellation is acknowledged for an active session');
  const cancelled = await waitForSession(cancellable, cancelStarted.sessionId);
  assert(cancelled.status === 'cancelled', `cancelled scan is reported honestly (got ${cancelled.status})`);
  assert(cancelled.stages.find((stage) => stage.id === 'startup')?.status === 'cancelled', 'in-flight startup stage is marked cancelled after returning');
  assert(cancelled.stages.find((stage) => stage.id === 'analyze')?.status === 'complete', 'local analysis still runs over collected evidence after cancellation');
  assert(cancelled.warnings.some((entry) => /Cancellation was requested/i.test(entry)), 'cancellation limitation is recorded');
  const cancelAgain = await cancellable.cancel(cancelStarted.sessionId);
  assert(cancelAgain.cancelled === false, 'cancelling a finished session is an honest no-op');

  const failingSystem = new ScanBridge({
    studio,
    files,
    storage,
    readSystemSummary: async () => ({
      status: 'failed',
      source: 'missing provider',
      permission: 'read-only',
      warnings: [],
      error: { code: 'PROVIDER_MISSING', message: 'No system provider installed.' },
    }),
    readServicesSummary: async () => servicesSummary(),
    loadProvider: () => startupProvider,
    userDataPath: path.join(sandbox, 'profile-failed'),
  });
  await failingSystem.init();
  const failedStarted = await failingSystem.start({ mode: 'service', services: ['system_health_pulse'] });
  const failedSession = await waitForSession(failingSystem, failedStarted.sessionId);
  assert(failedSession.status === 'partial', 'a failed provider produces a partial session, not a fake success');
  assert(failedSession.stages.find((stage) => stage.id === 'system')?.status === 'failed', 'failed provider stage is marked failed');
  assert(failedSession.stages.find((stage) => stage.id === 'system')?.error?.code === 'PROVIDER_MISSING', 'provider error code is preserved');
  assert(Number.isFinite(failedSession.summary.healthScore) || failedSession.summary.healthScore === null, 'health score is either measured or explicitly unavailable');
  assert(failedSession.summary.healthBasis.some((entry) => /volume/i.test(entry)), 'health basis only claims signals that were actually measured');

  const missingProvider = new ScanBridge({
    studio,
    files,
    storage,
    readSystemSummary: async () => systemSummary(),
    readServicesSummary: async () => servicesSummary(),
    loadProvider: () => null,
    userDataPath: path.join(sandbox, 'profile-missing-provider'),
  });
  await missingProvider.init();
  const missingStarted = await missingProvider.start({ mode: 'service', services: ['app_health_review'] });
  const missingSession = await waitForSession(missingProvider, missingStarted.sessionId);
  assert(missingSession.status === 'partial', 'a missing native provider cannot complete the scan');
  assert(missingSession.stages[0].status === 'failed' && /not installed/i.test(missingSession.stages[0].error?.message || ''), 'missing provider failure is explicit');

  // History and full-session retention are bounded. Reuse the fast quick plan.
  for (let index = 0; index < 19; index += 1) {
    const run = await bridge.start({ mode: 'quick', sourceId: added.id });
    await waitForSession(bridge, run.sessionId);
  }
  const boundedHistory = await bridge.history();
  assert(boundedHistory.length === 20, `history is bounded to 20 entries (got ${boundedHistory.length})`);
  const sessionFiles = (await fsp.readdir(path.join(userData, 'gemini-scan', 'sessions'))).filter((name) => name.endsWith('.json'));
  assert(sessionFiles.length === 10, `full sessions are bounded to 10 files (got ${sessionFiles.length})`);

  const after = await statMap(source);
  assert(after.size === before.size, 'source file count is unchanged by Smart Scan');
  assert([...before.entries()].every(([key, value]) => after.get(key) === value), 'source size and mtime are unchanged by Smart Scan');

  const restarted = new ScanBridge({
    studio,
    files,
    storage,
    readSystemSummary: async () => systemSummary(),
    readServicesSummary: async () => servicesSummary(),
    loadProvider: () => startupProvider,
    userDataPath: userData,
  });
  await restarted.init();
  const restartedHistory = await restarted.history();
  assert(restartedHistory.length === 20, 'history survives a coordinator restart');
  const latestSession = await restarted.status(restartedHistory[0].id);
  assert(latestSession.id === restartedHistory[0].id && latestSession.summary.id === latestSession.id, 'a persisted session reloads intact after restart');

  cancellable.dispose();
  failingSystem.dispose();
  missingProvider.dispose();
  restarted.dispose();
  await files.dispose();
  await studio.dispose();
  await fsp.rm(sandbox, { recursive: true, force: true }).catch(() => {});

  const result = {
    ok: failures.length === 0,
    services: capabilities.services.length,
    stages: capabilities.stages.length,
    quickFiles: quick.summary.filesIndexed,
    quickFindings: quick.findings.length,
    deepFindings: deep.findings.length,
    verifiedGroups: deep.summary.verifiedDuplicateGroups,
    startupItems: deep.services[0].data.startupCount,
    installedApps: deep.services[0].data.appCount,
    privacySampled: deep.services[0].data.privacySample?.sampled ?? null,
    privacyWithZone: deep.services[0].data.privacySample?.withZone ?? null,
    healthScore: deep.summary.healthScore,
    deepStages: deep.stages.map((stage) => `${stage.id}:${stage.status}`),
    emptyFolders: deep.services[0].data.emptyFolders?.summary ?? null,
    history: boundedHistory.length,
    persistedSessions: sessionFiles.length,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('[scan-native-test] PASS');
})().catch((error) => {
  console.error('[scan-native-test] FAILED', error?.stack || error);
  process.exit(1);
});
