 'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {fixture,bridgeFor,hashSources,sha}=require('./live-organization-fixtures.cjs');
(async()=>{const f=await fixture(4),b=await bridgeFor(f);const checks=[];
try{
 await b.engine.scan({sourceId:b.source.id});const p=await b.engine.plan({...b.request,operation:'copy',structure:'flat'});assert.equal(p.totals.files,4);
 const r=await b.engine.execute({planId:p.planId,planHash:p.planHash,approved:true});assert.equal(r.receipt.completedFiles,4);assert.equal(r.receipt.undoAvailable,false);assert.deepEqual(await hashSources(f),f.originals);
 for(const e of p.files)assert.equal(sha(await fs.readFile(e.targetPath)),f.originals[e.name]);checks.push('Flat copy retains every source hash and disables unsupported automatic Undo');
 await assert.rejects(b.engine.plan({...b.request,operation:'copy',structure:'flat',collisionPolicy:'skip'}),{code:'STUDIO_EMPTY_PLAN'});assert.deepEqual(await hashSources(f),f.originals);checks.push('All-skipped collision plan is refused; no target is overwritten');
 const out=path.resolve('../../docs/evidence/studio-domain/native/copy-checks.json');await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,JSON.stringify({checks,fixture:f.root,receipt:r.receipt,ownerDataTouched:false},null,2));console.log(JSON.stringify({ok:true,checks}));
}finally{await b.studio.dispose();}})().catch(e=>{console.error(e);process.exitCode=1;});
