import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { scanOrganizationReview } from '../src/smart-scan/model.ts';
import { sameOrganizationSource } from '../src/operations/organization-studio-model.ts';
const require = createRequire(import.meta.url);
const { fixture, bridgeFor, hashSources } = require('./live-organization-fixtures.cjs');
const { FilesBridge } = require('../electron/native/files-bridge.cjs');
const { StorageBridge } = require('../electron/native/storage-bridge.cjs');
const { ScanBridge } = require('../electron/native/scan-bridge.cjs');

const f = await fixture(8);
const { engine, studio, source, request } = await bridgeFor(f);
const files = new FilesBridge({ studio, shell: {} });
const storage = new StorageBridge({ studio, files, userDataPath: f.profile });
const scans = new ScanBridge({ studio, files, storage, userDataPath: f.profile });
try {
  await engine.scan({ sourceId: source.id });
  const started = await scans.start({ mode: 'service', services: ['large_files_review'], sourceId: source.id });
  let session;
  const deadline = Date.now() + 15000;
  do {
    session = await scans.status(started.sessionId);
    if (['complete', 'partial', 'failed', 'cancelled'].includes(session.status)) break;
    await new Promise(resolve => setTimeout(resolve, 25));
  } while (Date.now() < deadline);
  assert.equal(session.status, 'complete');
  const service = session.services.find(result => result.serviceId === 'large_files_review');
  assert(service.data.files.length > 0, 'real native scan returns ranked fixture files');
  const selected = service.data.files[0];
  const nativeSource = studio.getSource(source.id);
  const review = scanOrganizationReview(session, nativeSource, service, [selected.id]);
  assert.deepEqual(review.relativeFiles, [selected.relative]);
  assert(sameOrganizationSource(source.path, review.path));
  assert(!sameOrganizationSource(f.destination, review.path), 'same relative names in another root must not pass the source guard');
  assert(sameOrganizationSource('D:\\Review\\', 'd:/review'));
  assert.equal(scanOrganizationReview(session, { ...nativeSource, id: 'another-source' }, service, [selected.id]), null);
  assert.equal(scanOrganizationReview(session, nativeSource, service, [99999999]), null);
  assert.equal(scanOrganizationReview(session, nativeSource, { ...service, startedAt: 'stale-result' }, [selected.id]), null);
  assert.equal(scanOrganizationReview({ ...session, status: 'running' }, nativeSource, service, [selected.id]), null);
  assert.equal(scanOrganizationReview(session, nativeSource, { ...service, data: { ...service.data, files: [{ ...selected, relative: '../escape' }] } }, [selected.id]), null);

  // The handoff grants no execution privilege. Re-index and map relative paths
  // to current native IDs before using the existing immutable plan/receipt flow.
  const fresh = await engine.scan({ sourceId: source.id });
  const ids = fresh.files.filter(file => review.relativeFiles.includes(file.relative)).map(file => file.id);
  assert.equal(ids.length, 1);
  const plan = await engine.plan({ ...request, fileIds: ids });
  assert.equal(plan.totals.files, 1);
  await assert.rejects(engine.execute({ planId: plan.planId, planHash: plan.planHash, approved: false }));
  const moved = await engine.execute({ planId: plan.planId, planHash: plan.planHash, approved: true });
  assert.equal(moved.receipt.completedFiles, 1);
  const after = await hashSources(f);
  assert.equal(Object.values(after).filter(value => value === null).length, 1);
  const inverse = await engine.undoPreview({ journalId: moved.receipt.operationId });
  await engine.undo({ journalId: moved.receipt.operationId, previewId: inverse.previewId, previewHash: inverse.previewHash, approved: true, resolution: 'skip' });
  assert.deepEqual(await hashSources(f), f.originals);
  console.log(JSON.stringify({ ok: true, scope: 'disposable native fixtures', scanToPlanToMoveToUndo: 1, otherFilesPreserved: 7, rejectedReviews: 5, unapprovedExecutionRejected: true }));
} finally {
  scans.dispose();
  await files.dispose();
  await studio.dispose();
}
