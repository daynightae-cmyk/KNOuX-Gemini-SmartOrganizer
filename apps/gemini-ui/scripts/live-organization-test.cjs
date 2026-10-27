'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {fixture,bridgeFor,hashSources,sha}=require('./live-organization-fixtures.cjs');
async function main() {
 const evidence=path.resolve(__dirname,'../../../docs/evidence/live-organization');await fs.mkdir(evidence,{recursive:true});
 const checks=[];const record=(name,details={})=>{checks.push({name,...details});console.log('VERIFIED',name);};
 const f=await fixture();const {engine,studio,events,request}=await bridgeFor(f);
 try {
  const measured=await engine.scan({sourceId:request.sourceId});assert.equal(measured.files.length,40);assert.equal(events.filter(e=>e.phase==='discovered').length,40);record('Native discovery and per-file category events',{files:40,categories:measured.summary.categories});
  await fs.mkdir(path.join(f.destination,'Images'));await fs.writeFile(path.join(f.destination,'Images','item-00.png'),'existing destination keeper');
  const collision=await engine.plan({...request,collisionPolicy:'review'});assert.equal(collision.executable,false);assert.ok(collision.totals.collisions>0);
  await assert.rejects(engine.execute({planId:collision.planId,planHash:collision.planHash,approved:true}),{code:'STUDIO_PLAN_HAS_COLLISIONS'});assert.deepEqual(await hashSources(f),f.originals);record('Collision review refuses mutation and preserves source');
  const plan=await engine.plan(request);assert.equal(plan.totals.files,40);assert.ok(plan.files.every(x=>/^[a-f0-9]{64}$/.test(x.sourceHash)));
  await assert.rejects(engine.execute({planId:plan.planId,planHash:plan.planHash,approved:false}),{code:'OPERATION_CONSENT_REQUIRED'});
  await assert.rejects(engine.execute({planId:plan.planId,planHash:'0'.repeat(64),approved:true}),{code:'OPERATION_PLAN_MISMATCH'});
  engine.confirm=async()=>false;await assert.rejects(engine.execute({planId:plan.planId,planHash:plan.planHash,approved:true}),{code:'OPERATION_CONSENT_DENIED'});engine.confirm=async()=>true;
  assert.deepEqual(await hashSources(f),f.originals);record('Missing approval, tampered hash and declined native consent refuse effects');
  const executed=await engine.execute({planId:plan.planId,planHash:plan.planHash,approved:true});assert.equal(executed.receipt.completedFiles,40);assert.equal(executed.receipt.failedFiles,0);
  for(const entry of plan.files){assert.equal(sha(await fs.readFile(entry.targetPath)),f.originals[entry.name]);await assert.rejects(fs.access(path.join(f.source,entry.name)));}
  assert.equal(await fs.readFile(path.join(f.destination,'Images','item-00.png'),'utf8'),'existing destination keeper');
  record('40 real moves: exact hashes, source removal, collision keeper preserved',{receiptId:executed.receipt.operationId,planHash:plan.planHash});
  await assert.rejects(engine.execute({planId:plan.planId,planHash:plan.planHash,approved:true}));record('Plan replay refused');
  const receiptId=executed.receipt.operationId,changed=plan.files[0];const old=await fs.readFile(changed.targetPath);const oldStat=await fs.stat(changed.targetPath);await fs.writeFile(changed.targetPath,'changed after move');
  const undo=await engine.undoPreview({journalId:receiptId});assert.equal(undo.eligible,39);assert.ok(undo.entries.some(e=>!e.eligible));
  const restored=await engine.undo({...undo,approved:true,resolution:'skip'});assert.equal(restored.result.restored,39);assert.equal(await fs.readFile(changed.targetPath,'utf8'),'changed after move');record('Undo refuses modified destination and safely restores other 39 files');
  await fs.writeFile(changed.targetPath,old);await fs.utimes(changed.targetPath,oldStat.atimeMs/1000,oldStat.mtimeMs/1000);const finalPreview=await engine.undoPreview({journalId:receiptId});assert.equal(finalPreview.eligible,1);await engine.undo({...finalPreview,approved:true,resolution:'skip'});assert.deepEqual(await hashSources(f),f.originals);record('All 40 original source hashes restored exactly');
  const loaded=await bridgeFor(f);assert.ok((await loaded.engine.history()).some(r=>r.operationId===receiptId&&r.undoCompletedFiles===40));await loaded.studio.dispose();record('Journal and undo results survive engine reload');
  await fs.writeFile(path.join(evidence,'events.json'),JSON.stringify(events,null,2));await fs.writeFile(path.join(evidence,'receipt.json'),JSON.stringify((await engine.history())[0],null,2));
 } finally {await studio.dispose();}
 const stale=await fixture(2),s=await bridgeFor(stale);
 try {await s.engine.scan({sourceId:s.source.id});const p=await s.engine.plan(s.request);const file=path.join(stale.source,p.files[0].name);const before=await fs.stat(file);const bytes=await fs.readFile(file);bytes[0]=bytes[0]^1;await fs.writeFile(file,bytes);await fs.utimes(file,before.atime,before.mtime);await assert.rejects(s.engine.execute({planId:p.planId,planHash:p.planHash,approved:true}),{code:'STUDIO_PLAN_STALE'});for(const x of p.files)await assert.rejects(fs.access(x.targetPath));record('Same-size content change with restored mtime invalidates approval before effects');
 await assert.rejects(s.engine.plan({...s.request,categoryFolderNames:{image:'../escape'}}));s.engine.revoke();await assert.rejects(s.engine.plan(s.request));record('Traversal and revoked session scope refused');}finally{await s.studio.dispose();}
 const revoked=await fixture(2),r=await bridgeFor(revoked);try {await r.engine.scan({sourceId:r.source.id});const p=await r.engine.plan(r.request);await r.studio.removeSource(r.source.id);await assert.rejects(r.engine.execute({planId:p.planId,planHash:p.planHash,approved:true}));assert.deepEqual(await hashSources(revoked),revoked.originals);record('Revoking a source through the existing Studio bridge invalidates live execution');}finally{await r.studio.dispose();}
 const cancelled=await fixture(4);let shouldCancel=false;const c=await bridgeFor(cancelled,{emit:(e,engine)=>{if(shouldCancel&&e.phase==='started')engine.cancel();}});
 try {await c.engine.scan({sourceId:c.source.id});const p=await c.engine.plan(c.request);shouldCancel=true;await assert.rejects(c.engine.execute({planId:p.planId,planHash:p.planHash,approved:true}),{code:'STUDIO_CANCELLED'});assert.deepEqual(await hashSources(cancelled),cancelled.originals);record('Native cancellation reaches worker before mutation');}finally{await c.studio.dispose();}
 const linked=await fixture(2),l=await bridgeFor(linked);try {const outside=path.join(linked.root,'outside');await fs.mkdir(outside);await fs.writeFile(path.join(outside,'secret.txt'),'outside fixture');await fs.symlink(outside,path.join(linked.source,'escape'),'junction');const scan=await l.engine.scan({sourceId:l.source.id});assert.equal(scan.files.length,2);assert.ok(scan.summary.counts.links>=1);record('Junction escape excluded from measured scope');}finally{await l.studio.dispose();}
 await fs.writeFile(path.join(evidence,'fixture-checks.json'),JSON.stringify({checks,fixtures:[f.root,stale.root,cancelled.root,linked.root],ownerDataTouched:false},null,2));console.log(`Verified ${checks.length} checks; evidence: ${evidence}`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
