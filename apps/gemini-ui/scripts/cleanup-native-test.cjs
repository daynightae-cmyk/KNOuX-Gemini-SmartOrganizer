'use strict';

/**
 * Targeted read-only Clean Room test (Mission 08).
 *
 * Controlled temp folders, injected process/recycle providers and a fake
 * authorized Studio source prove the coordinator classifies measured evidence,
 * bounds every read, keeps blocked Windows roots blocked, never mutates a file
 * and never exposes a delete/move/quarantine/DISM/scheduled-task channel.
 */

const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  CleanupBridge,
  SERVICE_DEFINITIONS,
  GATED_OPERATIONS,
  CATEGORY_KEYS,
  SAFETY_RETENTION_DAYS,
} = require('../electron/native/cleanup-bridge.cjs');

const failures = [];
const assert = (condition, label) => {
  if (!condition) failures.push(label);
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const NOW = new Date('2026-10-26T12:00:00.000Z');
const DAY = 86400000;

async function treeSnapshot(root) {
  const entries = [];
  async function walk(current, depth) {
    let items;
    try {
      items = await fsp.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const item of items) {
      const full = path.join(current, item.name);
      const relative = path.relative(root, full);
      const stat = await fsp.lstat(full);
      if (item.isDirectory()) {
        entries.push(`d:${relative}`);
        if (depth < 8) await walk(full, depth + 1);
      } else {
        entries.push(`f:${relative}:${stat.size}:${Math.round(stat.mtimeMs)}`);
      }
    }
  }
  await walk(root, 0);
  return entries.sort().join('|');
}

async function settle(bridge, sessionId, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let session = bridge.status(sessionId);
  while (Date.now() < deadline && session.status === 'running') {
    await wait(40);
    session = bridge.status(sessionId);
  }
  return session;
}

async function main() {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'knoux-cleanup-'));
  const temp = path.join(root, 'temp');
  const windowsTemp = path.join(root, 'WindowsTemp');
  const browser = path.join(root, 'Chrome', 'User Data');
  const firefox = path.join(root, 'Firefox', 'Profiles');
  const logs = path.join(root, 'WER');
  const update = path.join(root, 'SoftwareDistribution');
  const vault = path.join(root, 'vault');
  const journalFile = path.join(vault, 'journal.json');
  const authorized = path.join(root, 'authorized-source');

  await fsp.mkdir(path.join(temp, 'old-folder', 'nested'), { recursive: true });
  await fsp.mkdir(path.join(temp, 'new-folder'), { recursive: true });
  await fsp.mkdir(path.join(windowsTemp, 'system'), { recursive: true });
  await fsp.mkdir(path.join(browser, 'Default', 'Cache'), { recursive: true });
  await fsp.mkdir(path.join(browser, 'Profile 1', 'Code Cache'), { recursive: true });
  await fsp.mkdir(path.join(firefox, 'abc.default', 'cache2'), { recursive: true });
  await fsp.mkdir(logs, { recursive: true });
  await fsp.mkdir(path.join(update, 'Download'), { recursive: true });
  await fsp.mkdir(vault, { recursive: true });
  await fsp.mkdir(authorized, { recursive: true });

  const old = new Date(NOW.getTime() - 40 * DAY);
  const recent = new Date(NOW.getTime() - 3 * DAY);
  await fsp.writeFile(path.join(temp, 'old-a.tmp'), Buffer.alloc(4096, 1));
  await fsp.writeFile(path.join(temp, 'recent-b.tmp'), Buffer.alloc(2048, 2));
  await fsp.writeFile(path.join(temp, 'old-folder', 'inner.bin'), Buffer.alloc(1024, 3));
  await fsp.writeFile(path.join(temp, 'old-folder', 'nested', 'deep.bin'), Buffer.alloc(512, 4));
  await fsp.writeFile(path.join(temp, 'new-folder', 'fresh.bin'), Buffer.alloc(256, 5));
  await fsp.utimes(path.join(temp, 'old-a.tmp'), old, old);
  await fsp.utimes(path.join(temp, 'recent-b.tmp'), recent, recent);
  await fsp.utimes(path.join(temp, 'old-folder', 'inner.bin'), old, old);
  await fsp.utimes(path.join(temp, 'old-folder', 'nested', 'deep.bin'), old, old);
  await fsp.utimes(path.join(temp, 'old-folder'), old, old);
  await fsp.utimes(path.join(temp, 'new-folder', 'fresh.bin'), recent, recent);
  await fsp.writeFile(path.join(windowsTemp, 'system', 'locked.tmp'), Buffer.alloc(8192, 6));
  await fsp.utimes(path.join(windowsTemp, 'system', 'locked.tmp'), old, old);
  await fsp.utimes(path.join(windowsTemp, 'system'), old, old);

  await fsp.writeFile(path.join(browser, 'Default', 'Cache', 'data_0'), Buffer.alloc(3000, 7));
  await fsp.writeFile(path.join(browser, 'Default', 'Cache', 'data_1'), Buffer.alloc(1000, 8));
  await fsp.writeFile(path.join(browser, 'Default', 'History'), Buffer.alloc(9999, 9));
  await fsp.writeFile(path.join(browser, 'Default', 'Cookies'), Buffer.alloc(8888, 10));
  await fsp.writeFile(path.join(browser, 'Profile 1', 'Code Cache', 'js.bin'), Buffer.alloc(1500, 11));
  await fsp.writeFile(path.join(firefox, 'abc.default', 'cache2', 'entries'), Buffer.alloc(2048, 12));

  await fsp.writeFile(path.join(logs, 'Report.wer'), Buffer.alloc(1200, 13));
  await fsp.utimes(path.join(logs, 'Report.wer'), old, old);
  await fsp.writeFile(path.join(update, 'Download', 'update.cab'), Buffer.alloc(16384, 14));

  await fsp.writeFile(path.join(vault, 'quarantined.tmp'), Buffer.alloc(700, 15));
  await fsp.writeFile(journalFile, JSON.stringify([
    {
      id: 'journal-1',
      createdAt: '2026-10-01T02:00:00.000Z',
      operation: 'quarantine',
      status: 'complete',
      itemCount: 1,
      bytes: 700,
      vaultPath: path.join(vault, 'quarantined.tmp'),
      verified: true,
      recovery: 'restore-available',
    },
  ]), 'utf8');

  await fsp.writeFile(path.join(authorized, 'old-document.txt'), Buffer.alloc(3000, 16));
  await fsp.writeFile(path.join(authorized, 'recent-document.txt'), Buffer.alloc(1000, 17));
  await fsp.utimes(path.join(authorized, 'old-document.txt'), new Date(NOW.getTime() - 200 * DAY), new Date(NOW.getTime() - 200 * DAY));
  await fsp.utimes(path.join(authorized, 'recent-document.txt'), recent, recent);

  const snapshotBefore = await treeSnapshot(root);
  const roots = [
    { id: 'temp-user', category: 'temp', path: temp, label: 'User temporary folder', policy: 'eligible-review' },
    { id: 'temp-windows', category: 'temp', path: windowsTemp, label: 'Windows temporary folder', policy: 'blocked-admin' },
    { id: 'browser-chrome', category: 'browser', path: browser, label: 'Google Chrome profiles', policy: 'browser' },
    { id: 'browser-firefox', category: 'browser', path: firefox, label: 'Mozilla Firefox profiles', policy: 'browser' },
    { id: 'logs-wer-archive', category: 'logs', path: logs, label: 'Windows Error Reporting archive', policy: 'review-logs' },
    { id: 'update-download', category: 'update', path: path.join(update, 'Download'), label: 'Windows Update download cache', policy: 'admin-review' },
  ];

  const recycleItems = [
    { name: 'deleted-a.txt', original: 'C:\\Users\\test\\Documents\\deleted-a.txt', deletedAt: '2026-10-02T10:00:00.000Z', size: 5000 },
    { name: 'deleted-b.bin', original: 'C:\\Users\\test\\Downloads\\deleted-b.bin', deletedAt: '2026-10-10T10:00:00.000Z', size: 2500 },
    { name: 'deleted-c.iso', original: 'D:\\Media\\deleted-c.iso', deletedAt: '2026-09-01T10:00:00.000Z', size: 10000 },
  ];

  const studio = {
    listSources: async () => [
      { id: 'source-authorized-1', label: 'Authorized Source', path: authorized, fileCount: 2 },
    ],
    getInventory: (sourceId) => (sourceId === 'source-authorized-1' ? {
      files: [
        { name: 'old-document.txt', relative: 'old-document.txt', size: 3000, modifiedMs: NOW.getTime() - 200 * DAY },
        { name: 'recent-document.txt', relative: 'recent-document.txt', size: 1000, modifiedMs: recent.getTime() },
      ],
    } : null),
  };

  const processNames = ['chrome'];
  const bridge = new CleanupBridge({
    studio,
    userDataPath: root,
    tempDir: temp,
    homeDir: root,
    platform: 'win32',
    env: { SystemRoot: path.join(root, 'Windows'), LOCALAPPDATA: path.join(root, 'LocalAppData'), APPDATA: path.join(root, 'Roaming') },
    now: () => new Date(NOW),
    roots,
    vaultDir: vault,
    journalFile,
    listProcessNames: async () => processNames,
    readRecycleBin: async () => recycleItems,
    measureBudgetMs: 2500,
    stageBudgetMs: 4000,
  });

  const capabilities = bridge.capabilities();
  assert(capabilities.readOnly === true && capabilities.mutation === 'none', 'capabilities are read-only');
  assert(capabilities.fixtureFallback === false, 'no fixture fallback is advertised');
  assert(capabilities.serviceCount === 12 && SERVICE_DEFINITIONS.length === 12, 'twelve services are advertised');
  assert(CATEGORY_KEYS.length === 5, 'five discovery categories are fixed');
  assert(GATED_OPERATIONS.every((operation) => operation.id && operation.mission), 'every gated operation names its mission');

  const inventoryBeforeScan = bridge.inventory();
  assert(inventoryBeforeScan.status === 'unscanned' && inventoryBeforeScan.candidates.length === 0, 'unscanned inventory is empty, not fabricated');
  assert(inventoryBeforeScan.readOnly === true && inventoryBeforeScan.mutation === 'none', 'unscanned inventory is read-only');

  let invalidCategoryRejected = false;
  try {
    await bridge.start({ categories: ['personal-documents'], ageDays: 1 });
  } catch (error) {
    invalidCategoryRejected = error.code === 'CLEANUP_CATEGORY_INVALID';
  }
  assert(invalidCategoryRejected, 'unknown cleanup categories are rejected');

  const started = await bridge.start({ categories: [...CATEGORY_KEYS], ageDays: 1 });
  assert(started.status === 'running' && started.id, 'a discovery session starts with a durable id');
  const session = await settle(bridge, started.id);
  assert(session.status === 'complete', 'discovery completes');
  assert(session.categories.length === 5 && session.categories.every((stage) => stage.status === 'complete'), 'every requested stage completes');
  assert(session.progressPercent === 100, 'weighted stage progress reaches 100%');
  assert(session.coverage.rootsScanned >= 5, 'every injected root was scanned');
  assert(session.coverage.skippedLinks === 0, 'no link was followed in the controlled tree');
  assert(session.candidates.length >= 1, 'measured candidates reach the session');

  const inventory = bridge.inventory();
  assert(inventory.status === 'complete' && inventory.candidates.length >= 1, 'inventory exposes measured candidates');
  assert(inventory.coverage.rootsScanned >= 5 && inventory.coverage.bytesMeasured > 0, 'inventory carries measured coverage');
  assert(inventory.readOnly === true && inventory.mutation === 'none', 'inventory remains read-only');
  assert(inventory.recycleItems.length === 3, 'recycle metadata is measured item by item');

  const tempCandidates = inventory.candidates.filter((candidate) => candidate.category === 'temp');
  const oldFile = tempCandidates.find((candidate) => candidate.name === 'old-a.tmp');
  const recentFile = tempCandidates.find((candidate) => candidate.name === 'recent-b.tmp');
  const userAggregate = tempCandidates.find((candidate) => /temporary folder/i.test(candidate.name) && /User/.test(candidate.source));
  const windowsAggregate = tempCandidates.find((candidate) => /temporary folder/i.test(candidate.name) && /Windows/.test(candidate.source));
  assert(oldFile && oldFile.safety === 'eligible' && oldFile.action === 'quarantine', 'an old temp file is eligible for a quarantine review');
  assert(recentFile && recentFile.safety === 'review', 'a recent temp file is review-only');
  assert(windowsAggregate && windowsAggregate.safety === 'blocked' && windowsAggregate.action === 'handoff', 'the Windows temp root is blocked');
  assert(userAggregate && userAggregate.safety === 'review', 'aggregated user temp folders stay review-only');
  assert(userAggregate.sizeBytes >= 1536, 'aggregated temp folders are measured, not guessed');
  assert(windowsAggregate.sizeBytes === 8192, 'the blocked Windows temp root is still measured');
  assert(inventory.candidates.every((candidate) => candidate.path == null || candidate.path.startsWith('%') || !candidate.path.includes(root)), 'no raw fixture path leaks after redaction');

  const browserCandidates = inventory.candidates.filter((candidate) => candidate.category === 'browser');
  const chromeCandidate = browserCandidates.find((candidate) => /Chrome/.test(candidate.source) && /Default/.test(candidate.name));
  const firefoxCandidate = browserCandidates.find((candidate) => /Firefox/.test(candidate.source));
  assert(chromeCandidate && chromeCandidate.active === true && chromeCandidate.safety === 'blocked', 'a running browser is blocked');
  assert(firefoxCandidate && firefoxCandidate.active === false && firefoxCandidate.safety === 'eligible', 'an idle browser cache is eligible');
  assert(chromeCandidate.sizeBytes === 4000, 'only cache subfolders are measured');
  assert(chromeCandidate.evidence.some((line) => /cookies|credentials/i.test(line)), 'browser evidence states the cookie exclusion');
  assert(!inventory.candidates.some((candidate) => /History|Cookies/i.test(candidate.name)), 'browser cookies and history are never candidates');

  const logCandidate = inventory.candidates.find((candidate) => candidate.category === 'logs');
  assert(logCandidate && logCandidate.safety === 'eligible' && logCandidate.action === 'quarantine', 'old application crash logs are eligible for a review plan');
  const updateCandidate = inventory.candidates.find((candidate) => candidate.category === 'update');
  assert(updateCandidate && updateCandidate.action === 'handoff' && updateCandidate.safety === 'review', 'Windows Update cache is a Windows handoff');
  assert(updateCandidate.evidence.some((line) => /No DISM/i.test(line)), 'no DISM command is claimed');

  const recycleCandidates = inventory.candidates.filter((candidate) => candidate.category === 'recycle');
  assert(recycleCandidates.length === 2, 'recycle candidates are grouped per volume');
  assert(recycleCandidates.every((candidate) => candidate.virtual === true && candidate.safety === 'review'), 'recycle evidence is virtual and review-only');
  assert(recycleCandidates.some((candidate) => candidate.sizeBytes === 7500), 'C: recycle bytes are summed from measured items');
  assert(recycleCandidates.some((candidate) => candidate.sizeBytes === 10000), 'D: recycle bytes are kept separate');

  const estimate = bridge.estimate();
  assert(estimate.status === 'complete' && estimate.mutation === 'none', 'estimate is measured and read-only');
  assert(estimate.summary.eligibleBytes + estimate.summary.reviewBytes + estimate.summary.blockedBytes > 0, 'estimate separates safety classes');
  assert(estimate.categories.length === 5, 'estimate covers all five categories');
  assert(/not a promise/i.test(estimate.note), 'estimate never promises reclaimed bytes');

  const plan = bridge.plan({ candidateIds: [oldFile.id, windowsAggregate.id, updateCandidate.id, chromeCandidate.id], mode: 'quarantine' });
  assert(plan.immutable === true && plan.mutation === 'none', 'plan is immutable and non-mutating');
  assert(plan.execution.available === false && plan.execution.gate.includes('Mission 08'), 'execution is gated to Mission 08');
  assert(plan.rollback.available === false, 'rollback is not claimed without a mutation');
  assert(plan.totals.count === 4 && plan.totals.blocked === 3, 'blocked, active and servicing candidates are rejected');
  assert(plan.items.find((item) => item.candidateId === oldFile.id)?.reclaimBytes === oldFile.sizeBytes, 'eligible reclaim evidence is measured');
  assert(plan.items.find((item) => item.candidateId === windowsAggregate.id)?.risk === 'blocked', 'Windows temp stays blocked in a plan');
  assert(plan.items.find((item) => item.candidateId === chromeCandidate.id)?.risk === 'blocked', 'active browser cache stays blocked in a plan');
  assert(plan.fingerprint && plan.fingerprint.length >= 20, 'plan carries a stable fingerprint');

  let crossCategoryRisk = null;
  try {
    crossCategoryRisk = bridge.plan({ candidateIds: [oldFile.id], mode: 'recycle' }).items[0].risk;
  } catch {
    crossCategoryRisk = 'rejected';
  }
  assert(crossCategoryRisk === 'blocked' || crossCategoryRisk === 'rejected', 'a non-recycle candidate cannot be purged through the Recycle Bin mode');

  let staleRejected = false;
  try {
    bridge.plan({ candidateIds: ['cln:000000000000000000000000'], mode: 'quarantine' });
  } catch (error) {
    staleRejected = error.code === 'CLEANUP_CANDIDATE_STALE';
  }
  assert(staleRejected, 'stale candidate ids are rejected');

  const recyclePlan = bridge.plan({ candidateIds: [recycleCandidates[0].id], mode: 'recycle' });
  assert(recyclePlan.items[0].safety === 'review' && recyclePlan.items[0].reclaimBytes === 0, 'Recycle Bin bytes are never counted as safe reclaim');
  assert(recyclePlan.execution.available === false, 'emptying the Recycle Bin has no execution channel');

  const quarantine = await bridge.quarantine();
  assert(quarantine.readOnly === true && quarantine.mutation === 'none', 'quarantine reader is read-only');
  assert(quarantine.vault.exists === true && quarantine.vault.items.length === 1, 'vault entries are measured');
  assert(quarantine.vault.retentionDays === SAFETY_RETENTION_DAYS, 'retention policy is 14 days');
  assert(quarantine.vault.totalBytes === 700, 'vault bytes are measured');
  assert(quarantine.journal.exists === true && quarantine.journal.entries.length === 1, 'journal entries are read');
  assert(quarantine.journal.entries[0].verified === true, 'journal verification flags are preserved');
  assert(quarantine.execution.available === false, 'quarantine execution is gated');

  const unused = await bridge.unused({ ageDays: 90, limit: 20 });
  assert(unused.status === 'complete' && unused.source.id === 'source-authorized-1', 'dormancy uses an authorized Studio source');
  assert(unused.items.length === 1 && unused.items[0].name === 'old-document.txt', 'only files older than the threshold are returned');
  assert(unused.items[0].safety === 'review', 'dormancy is review-only, not deletion evidence');
  assert(/last-access/i.test(unused.atimeNote), 'last-access caveat is stated');

  const noSourceBridge = new CleanupBridge({
    studio: { listSources: async () => [] },
    userDataPath: root,
    tempDir: temp,
    homeDir: root,
    platform: 'win32',
    now: () => new Date(NOW),
    roots,
    vaultDir: vault,
    journalFile,
    listProcessNames: async () => [],
    readRecycleBin: async () => [],
  });
  const needsSource = await noSourceBridge.unused({ ageDays: 90 });
  assert(needsSource.status === 'needs-source', 'missing Studio source is honest');
  const indexRequired = await new CleanupBridge({
    studio: { listSources: async () => [{ id: 'source-authorized-1', label: 'Authorized', path: authorized, fileCount: 2 }], getInventory: () => null },
    userDataPath: root,
    tempDir: temp,
    homeDir: root,
    platform: 'win32',
    now: () => new Date(NOW),
    roots,
    vaultDir: vault,
    journalFile,
    listProcessNames: async () => [],
    readRecycleBin: async () => [],
  }).unused({ ageDays: 90 });
  assert(indexRequired.status === 'index-required', 'an unindexed source is honest');

  const schedule = bridge.schedule({ frequency: 'weekly', time: '03:15', weekdays: [1, 3, 5], categories: ['temp', 'logs'] });
  assert(schedule.draft.scanOnly === true && schedule.draft.frequency === 'weekly', 'schedule drafts a read-only weekly scan');
  assert(schedule.draft.categories.length === 2, 'schedule keeps selected categories');
  assert(schedule.occurrences.length === 5, 'schedule computes five occurrences');
  assert(schedule.occurrences.every((value) => new Date(value).getUTCHours() >= 0), 'occurrences are valid dates');
  assert(schedule.execution.available === false && schedule.execution.gate.includes('Mission 13'), 'scheduled tasks are gated to Mission 13');
  assert(schedule.mutation === 'none', 'schedule never persists');

  const report = await bridge.report();
  assert(report.readOnly === true && report.mutation === 'none', 'report is read-only');
  assert(report.session.id === started.id, 'report references the measured session');
  assert(report.summary.candidates === inventory.candidates.length, 'report counts the measured candidates');
  assert(report.recycle.items === 3 && report.recycle.bytes === 17500, 'report totals recycle evidence');
  assert(report.vault.entries === 1 && report.journal.entries === 1, 'report totals vault and journal evidence');
  assert(/No deletion occurred/i.test(report.note), 'report never claims a deletion');

  // Cancellation is honoured before the first measured stage.
  let releaseProcesses;
  const processGate = new Promise((resolve) => { releaseProcesses = resolve; });
  const cancelBridge = new CleanupBridge({
    userDataPath: root,
    tempDir: temp,
    homeDir: root,
    platform: 'win32',
    now: () => new Date(NOW),
    roots,
    vaultDir: vault,
    journalFile,
    listProcessNames: () => processGate,
    readRecycleBin: async () => [],
  });
  const cancelStart = await cancelBridge.start({ categories: ['temp', 'browser'], ageDays: 1 });
  const cancelResult = cancelBridge.cancel(cancelStart.id);
  releaseProcesses([]);
  await wait(120);
  const cancelledSession = cancelBridge.status(cancelStart.id);
  assert(cancelResult.cancelled === true, 'cancel acknowledges the running session');
  assert(cancelledSession.status === 'cancelled', 'cancelled session reports cancelled');
  assert(cancelledSession.categories.every((stage) => stage.status === 'cancelled'), 'cancelled stages are not marked complete');
  assert((await cancelBridge.inventory()).status === 'unscanned', 'a cancelled scan does not publish a partial inventory as complete');

  const emptyBridge = new CleanupBridge({
    userDataPath: root,
    tempDir: path.join(root, 'missing-temp'),
    homeDir: root,
    platform: 'win32',
    now: () => new Date(NOW),
    roots: [{ id: 'temp-user', category: 'temp', path: path.join(root, 'missing-temp'), label: 'Missing temp', policy: 'eligible-review' }],
    vaultDir: path.join(root, 'missing-vault'),
    journalFile: path.join(root, 'missing-vault', 'journal.json'),
    listProcessNames: async () => [],
    readRecycleBin: async () => [],
  });
  const emptyStart = await emptyBridge.start({ categories: ['temp'], ageDays: 1 });
  const emptySession = await settle(emptyBridge, emptyStart.id);
  assert(emptySession.status === 'complete' && emptySession.candidateCount === 0, 'an absent root completes honestly with no candidates');
  assert(emptySession.warnings.some((warning) => /denied|could not be read/i.test(warning)), 'an absent root is reported as a warning');
  const emptyQuarantine = await emptyBridge.quarantine();
  assert(emptyQuarantine.vault.exists === false && emptyQuarantine.vault.items.length === 0, 'an absent vault is empty, not fabricated');
  assert(emptyQuarantine.execution.available === false, 'an absent vault still has no write channel');

  const snapshotAfter = await treeSnapshot(root);
  assert(snapshotBefore === snapshotAfter, 'no fixture file was created, removed, renamed or modified');
  const vaultAfter = await fsp.readdir(vault);
  assert(vaultAfter.length === 2, 'no quarantine item was written by the coordinator');

  await fsp.rm(root, { recursive: true, force: true }).catch(() => {});

  const result = {
    ok: failures.length === 0,
    services: SERVICE_DEFINITIONS.length,
    stages: CATEGORY_KEYS.length,
    candidates: inventory.candidates.length,
    eligibleBytes: inventory.summary.eligibleBytes,
    reviewBytes: inventory.summary.reviewBytes,
    blockedBytes: inventory.summary.blockedBytes,
    recycleItems: inventory.recycleItems.length,
    unusedItems: unused.items.length,
    planBlocked: plan.totals.blocked,
    vaultEntries: quarantine.vault.items.length,
    journalEntries: quarantine.journal.entries.length,
    scheduleOccurrences: schedule.occurrences.length,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('[cleanup-native-test] PASS');
}

main().catch((error) => {
  console.error('[cleanup-native-test] FAIL', error);
  process.exit(1);
});
