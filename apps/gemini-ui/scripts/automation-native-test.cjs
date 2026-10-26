'use strict';

/**
 * Mission 13 controlled Flow Studio test.
 * No workflow is executed. Persistence is confined to a temp userData folder.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  AutomationBridge,
  AUTOMATION_TOOLS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS,
} = require('../electron/native/automation-bridge.cjs');
const {
  TEMPLATES,
  defaultTrigger,
  defaultQuietHours,
  defaultPolicy,
} = require('../electron/native/automation-providers.cjs');

const failures = [];
function check(name, run) {
  try { run(); console.log(`  ✓ ${name}`); }
  catch (error) { failures.push(`${name}: ${error.message}`); console.error(`  ✗ ${name}: ${error.message}`); }
}
async function checkAsync(name, run) {
  try { await run(); console.log(`  ✓ ${name}`); }
  catch (error) { failures.push(`${name}: ${error.message}`); console.error(`  ✗ ${name}: ${error.message}`); }
}

const cacheRoot = path.join(__dirname, '..', 'node_modules', '.cache');
fs.mkdirSync(cacheRoot, { recursive: true });
const storeRoot = fs.mkdtempSync(path.join(cacheRoot, 'knoux-automation-test-'));

const workflowDraft = (overrides = {}) => ({
  name: 'Controlled Workflow',
  schemaVersion: '1.0',
  enabled: false,
  trigger: { ...defaultTrigger(), time: '09:00', days: [1, 2, 3] },
  quietHours: defaultQuietHours(),
  policy: defaultPolicy(),
  nodes: [
    { id: 'trigger-1', type: 'trigger', label: 'Weekday schedule', toolId: 'platform', config: {} },
    { id: 'scan-1', type: 'action', label: 'Read-only scan', toolId: 'auto-smart-scan', config: { modules: ['inventory'] } },
    { id: 'approval-1', type: 'approval', label: 'Operator approval', toolId: 'platform', config: {} },
    { id: 'report-1', type: 'report', label: 'Evidence report', toolId: 'auto-export', config: { format: 'json' } }
  ],
  edges: [
    { from: 'trigger-1', to: 'scan-1' },
    { from: 'scan-1', to: 'approval-1' },
    { from: 'approval-1', to: 'report-1' }
  ],
  mutation: 'none',
  execution: 'not-implemented',
  ...overrides,
});

function createBridge(options = {}) {
  return new AutomationBridge({
    userDataPath: storeRoot,
    now: () => new Date('2026-10-26T09:30:00Z'),
    loadProvider: () => ({ collectBatteries: async () => [] }),
    loadStudioSources: async () => ({ data: [{ id: 'src-1', label: 'Controlled source', status: 'ready', fileCount: 7 }] }),
    ...options,
  });
}

async function settle(bridge, sessionId, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const session = bridge.status(sessionId);
    if (session.status !== 'running') return session;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('automation session did not settle');
}

async function main() {
  check('12 tools, 5 stages, 5 gates and 8 templates', () => {
    assert.equal(AUTOMATION_TOOLS.length, 12);
    assert.equal(new Set(AUTOMATION_TOOLS.map((entry) => entry.id)).size, 12);
    assert.equal(STAGE_DEFINITIONS.length, 5);
    assert.equal(GATED_OPERATIONS.length, 5);
    assert.equal(TEMPLATES.length, 8);
    assert.ok(AUTOMATION_TOOLS.every((entry) => /[\u0600-\u06FF]/.test(entry.labelAr) && /[\u0600-\u06FF]/.test(entry.noteAr)));
  });

  const bridge = createBridge();
  const started = bridge.start();
  const session = await settle(bridge, started.id);
  assert.equal(session.status, 'complete');
  assert.equal(session.progress, 100);
  assert.equal(session.stages.length, 5);

  const snapshot = await bridge.snapshot();
  check('snapshot measures storage, templates, runtime and sources', () => {
    assert.equal(snapshot.contract, 'automation.v1');
    assert.equal(snapshot.readOnly, true);
    assert.equal(snapshot.mutation, 'none');
    assert.equal(snapshot.workflows.length, 0);
    assert.equal(snapshot.templates.length, 8);
    assert.equal(snapshot.journal.length, 0);
    assert.equal(snapshot.runtime.batteryAvailable, false);
    assert.equal(snapshot.runtime.studioSources.length, 1);
    assert.equal(snapshot.gates.length, 5);
    assert.match(snapshot.receipt, /^workflows:[a-f0-9]{24}$/);
  });

  const templates = await bridge.templates();
  check('templates are typed drafts without execution', () => {
    assert.ok(templates.every((template) => template.workflow.execution === 'not-implemented'));
    assert.ok(templates.every((template) => template.workflow.nodes.length >= 3));
    assert.ok(templates.some((template) => template.id === 'tpl-cleanup-pipeline'));
  });

  const saved = await bridge.save(workflowDraft());
  check('a valid workflow saves as version 1', () => {
    assert.match(saved.id, /^wf-/);
    assert.equal(saved.version, 1);
    assert.equal(saved.execution, 'not-implemented');
    assert.equal(saved.nodes.length, 4);
    assert.equal(saved.edges.length, 3);
  });

  const savedAgain = await bridge.save({ ...saved, name: 'Controlled Workflow v2' });
  check('saving the same workflow increments its version', () => {
    assert.equal(savedAgain.id, saved.id);
    assert.equal(savedAgain.version, 2);
    assert.equal(savedAgain.name, 'Controlled Workflow v2');
  });

  const workflows = await bridge.workflows();
  check('workflow store reloads the latest version', () => {
    assert.equal(workflows.length, 1);
    assert.equal(workflows[0].version, 2);
    assert.equal(workflows[0].name, 'Controlled Workflow v2');
  });

  const dryRun = await bridge.dryRun(workflowDraft({ name: 'Dry Run Draft' }));
  check('dry-run is deterministic and blocks action execution', () => {
    assert.equal(dryRun.valid, true);
    assert.equal(dryRun.execution, 'not-implemented');
    assert.equal(dryRun.mutation, 'none');
    assert.equal(dryRun.steps.length, 4);
    assert.equal(dryRun.steps.find((step) => step.type === 'action').status, 'blocked');
    assert.equal(dryRun.steps.find((step) => step.type === 'approval').status, 'required');
    assert.match(dryRun.receipt, /^dryrun:[a-f0-9]{24}$/);
  });

  await checkAsync('cycles, missing actions and unreachable nodes are rejected', async () => {
    await assert.rejects(() => bridge.dryRun(workflowDraft({ edges: [...workflowDraft().edges, { from: 'report-1', to: 'scan-1' }] })), /cycle/);
    await assert.rejects(() => bridge.dryRun(workflowDraft({ nodes: workflowDraft().nodes.filter((node) => node.type !== 'action'), edges: [] })), /action node/);
    await assert.rejects(() => bridge.dryRun(workflowDraft({ nodes: [...workflowDraft().nodes, { id: 'orphan-1', type: 'report', label: 'Orphan', toolId: 'auto-export', config: {} }] })), /Unreachable/);
    await assert.rejects(() => bridge.dryRun(workflowDraft({ nodes: [workflowDraft().nodes[0], { ...workflowDraft().nodes[0] }, workflowDraft().nodes[1]] })), /unique/);
  });

  const journal = await bridge.journal();
  check('dry-run journal records one preview and no execution', () => {
    assert.equal(journal.length, 1);
    assert.equal(journal[0].kind, 'dry-run');
    assert.equal(journal[0].execution, 'not-implemented');
    assert.equal(journal[0].mutation, 'none');
  });

  const schedule = await bridge.schedulePreview({ cadence: 'daily', time: '07:30', days: [], intervalHours: 24, timezone: 'local', exclusions: [] });
  check('daily schedule preview returns five local occurrences', () => {
    assert.equal(schedule.valid, true);
    assert.equal(schedule.next.length, 5);
    assert.equal(schedule.timezone, schedule.spec.timezone);
    assert.ok(schedule.next.every((entry) => /^\d{4}-\d{2}-\d{2}T/.test(entry.at)));
  });

  await checkAsync('foreign timezone is refused', async () => {
    await assert.rejects(() => bridge.schedulePreview({ cadence: 'daily', time: '07:30', days: [], intervalHours: 24, timezone: 'Mars/Olympus', exclusions: [] }), /host timezone/);
  });

  const validation = await bridge.validateImport(JSON.stringify(workflowDraft()));
  check('import validation accepts a valid workflow', () => {
    assert.equal(validation.valid, true);
    assert.equal(validation.nodeCount, 4);
    assert.equal(validation.schemaVersion, '1.0');
  });

  const invalidImport = await bridge.validateImport(JSON.stringify({ schemaVersion: '2.0', name: 'x' }));
  check('import validation rejects a foreign schema', () => {
    assert.equal(invalidImport.valid, false);
    assert.match(invalidImport.errors[0], /schemaVersion 1.0/);
  });

  const report = await bridge.report({ redact: true });
  check('report states that no workflow ran', () => {
    assert.equal(report.readOnly, true);
    assert.equal(report.mutation, 'none');
    assert.match(report.summary, /No workflow was executed/);
    assert.ok(report.sections.some((section) => section.id === 'gates' && section.items.length === 5));
  });

  check('bridge exposes no workflow execution method', () => {
    for (const method of ['run', 'execute', 'startWorkflow', 'scheduleJob', 'notify', 'deleteArtifact']) {
      assert.equal(typeof bridge[method], 'undefined', `bridge must not expose ${method}`);
    }
  });

  const secondBridge = createBridge();
  const secondStart = secondBridge.start();
  await settle(secondBridge, secondStart.id);
  const secondSnapshot = await secondBridge.snapshot();
  check('a new bridge instance reloads persisted versions and journal', () => {
    assert.equal(secondSnapshot.workflows.length, 1);
    assert.equal(secondSnapshot.workflows[0].version, 2);
    assert.ok(secondSnapshot.journal.length >= 1);
    assert.ok(secondSnapshot.workflowHistory.some((entry) => entry.version === 2));
  });

  const cancelBridge = createBridge();
  const cancelStart = cancelBridge.start();
  assert.equal(cancelBridge.cancel(cancelStart.id).cancelled, true);
  const cancelled = await settle(cancelBridge, cancelStart.id);
  await checkAsync('cancellation settles without a snapshot', async () => {
    assert.equal(cancelled.status, 'cancelled');
    await assert.rejects(() => cancelBridge.snapshot(), /No Flow Studio snapshot/);
  });

  const source = fs.readFileSync(path.join(__dirname, '..', 'electron', 'native', 'automation-bridge.cjs'), 'utf8');
  const providerSource = fs.readFileSync(path.join(__dirname, '..', 'electron', 'native', 'automation-providers.cjs'), 'utf8');
  check('native source contains no executor, shell, scheduler timer or external channel', () => {
    for (const forbidden of ['child_process', 'spawn(', 'shell: true', 'Start-Process', 'Invoke-Expression', 'schtasks', 'setInterval(', 'setTimeout(', 'fetch(', 'https://', 'http://', 'Remove-Item', 'Set-ItemProperty']) {
      assert.ok(!source.includes(forbidden), `automation-bridge contains ${forbidden}`);
      assert.ok(!providerSource.includes(forbidden), `automation-providers contains ${forbidden}`);
    }
  });

  const rendererRoot = path.join(__dirname, '..', 'src');
  const catalogSource = fs.readFileSync(path.join(rendererRoot, 'automation', 'catalog.ts'), 'utf8');
  const workbenchSource = fs.readFileSync(path.join(rendererRoot, 'automation', 'AutomationServiceWorkspaces.tsx'), 'utf8');
  const workbenchBodySource = [
    fs.readFileSync(path.join(rendererRoot, 'automation', 'AutomationCoreWorkbenches.tsx'), 'utf8'),
    fs.readFileSync(path.join(rendererRoot, 'automation', 'AutomationPolicyWorkbenches.tsx'), 'utf8'),
  ].join('\n');
  const pageSource = fs.readFileSync(path.join(rendererRoot, 'pages', 'AutomationPage.tsx'), 'utf8');
  const styleSource = fs.readFileSync(path.join(rendererRoot, 'automation.css'), 'utf8');
  check('renderer wires every Flow Studio tool to a specialised workbench', () => {
    for (const tool of AUTOMATION_TOOLS) {
      assert.ok(catalogSource.includes(`id: '${tool.id}'`), `catalog declares ${tool.id}`);
      assert.ok(workbenchSource.includes(`'${tool.id}':`), `a workbench resolves ${tool.id}`);
    }
    assert.match(pageSource, /useAutomation\(\)/);
    assert.match(pageSource, /AutomationServiceWorkspace/);
    assert.ok(!/from ['"][^'"]*automation-inventory/.test(pageSource), 'the old fixture module is not imported');
    assert.ok(!/\bINITIAL_[A-Z]/.test(pageSource) && !/\bSAMPLE_[A-Z]/.test(pageSource), 'no fixture constants are referenced');
    assert.ok(!fs.existsSync(path.join(rendererRoot, 'lib', 'automation-inventory.ts')), 'the old automation fixture inventory was removed');
    assert.ok(!fs.existsSync(path.join(rendererRoot, 'components', 'automation', 'AutomationWorkspaces.tsx')), 'the old generic automation modal was removed');
    assert.match(workbenchBodySource, /Filter task category/, 'the schedule manager filters by derived task category');
    assert.match(workbenchBodySource, /Estimated time saved/, 'the template gallery labels the time-saved estimate as unmeasured');
    assert.match(workbenchBodySource, /Derived recurrence expression/, 'the recurrence composer exposes a derived expression');
    assert.match(workbenchBodySource, /Approval gate/, 'the smart scan tool exposes the permission gate');
    assert.match(workbenchBodySource, /Failure log/, 'the dry-run history labels the absence of a failure log');
    assert.match(styleSource, /\.auto-editor-grid/);
    assert.match(styleSource, /html\[data-theme='light'\] \.auto-tools-panel/);
  });

  await bridge.close();
  await secondBridge.close();
  await cancelBridge.close();

  const result = {
    ok: failures.length === 0,
    tools: AUTOMATION_TOOLS.length,
    stages: STAGE_DEFINITIONS.length,
    gates: GATED_OPERATIONS.length,
    templates: TEMPLATES.length,
    savedVersion: savedAgain.version,
    dryRunSteps: dryRun.steps.length,
    occurrences: schedule.next.length,
    journalEntries: journal.length,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  fs.rmSync(storeRoot, { recursive: true, force: true });
  if (!result.ok) process.exit(1);
  console.log('[automation-native-test] PASS');
}

main().catch((error) => {
  fs.rmSync(storeRoot, { recursive: true, force: true });
  console.error('[automation-native-test] FAIL', error);
  process.exit(1);
});
