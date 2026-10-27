'use strict';
const fs = require('node:fs/promises');
const fssync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { StudioBridge } = require('../electron/native/studio-bridge.cjs');

const failures = [];
const assert = (condition, label) => { if (!condition) failures.push(label); };

(async () => {
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-studio-exec-test-'));
  const userData = path.join(sandbox, 'profile');
  const source = path.join(sandbox, 'source');
  const dest = path.join(sandbox, 'dest');
  await fs.mkdir(path.join(source, 'nested'), { recursive: true });
  await fs.writeFile(path.join(source, 'notes.txt'), 'hello\n', 'utf8');
  await fs.writeFile(path.join(source, 'nested', 'readme.md'), '# hi\n', 'utf8');
  await fs.mkdir(dest, { recursive: true });

  const bridge = new StudioBridge({
    userDataPath: userData,
    nativeImage: null,
    isPackaged: false,
    chooseFolder: async ({ title }) => (String(title).toLowerCase().includes('destination') || String(title).toLowerCase().includes('output')) ? dest : source,
    emit: () => {},
  });
  await bridge.init();
  const added = await bridge.addSource(source);
  await bridge.scanSource(added.id);
  const destGrant = await bridge.chooseDestination();
  assert(Boolean(destGrant?.id), 'destination grant returns id');

  const plan = await bridge.previewPlan({
    sourceId: added.id,
    all: true,
    operation: 'move',
    structure: 'categorized',
    collisionPolicy: 'review',
    destinationId: destGrant.id,
  });
  assert(plan.previewOnly === true, 'plan previewOnly');
  assert(plan.executable === true, 'plan executable (no collisions)');
  assert(plan.planId, 'plan has planId');

  const execResult = await bridge.executePlan({
    planId: plan.planId,
    planHash: plan.planHash,
    approved: true,
    operation: 'move',
    destinationSummary: plan.destinationSummary,
  });
  console.log('EXEC RESULT:', JSON.stringify(execResult).slice(0, 500));
  assert(execResult.success === true, 'execute success');

  assert(!fssync.existsSync(path.join(source, 'notes.txt')), 'source file removed after move');

  const jId = execResult.journalId;
  assert(Boolean(jId), 'exec result has journalId');
  const undoPrev = await bridge.undoPreview(jId);
  console.log('UNDO PREVIEW:', JSON.stringify(undoPrev).slice(0, 300));
  assert(undoPrev.eligible >= 1, 'undo has eligible entries');

  const undoResult = await bridge.undoApply({
    journalId: jId,
    previewId: undoPrev.previewId,
    previewHash: undoPrev.previewHash,
    resolution: 'skip',
    approved: true,
  });
  console.log('UNDO RESULT:', JSON.stringify(undoResult).slice(0, 300));
  assert(undoResult.restored >= 1, 'undo restored files');

  assert(fssync.existsSync(path.join(source, 'notes.txt')), 'source file restored after undo');

  await bridge.dispose();
  await fs.rm(sandbox, { recursive: true, force: true }).catch(() => {});
  const result = { ok: failures.length === 0, failures };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('[studio-exec-test] PASS');
})().catch((error) => {
  console.error('[studio-exec-test] FAILED', error?.stack || error);
  process.exit(1);
});
