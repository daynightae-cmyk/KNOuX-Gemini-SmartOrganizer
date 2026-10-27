'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {makeFixture,create,selection,sourceHashes,sha}=require('./storage-vault-fixtures.cjs');
async function main(){
 const f=await makeFixture(),b=await create(f),checks=[];
 const check=(name,data={})=>{checks.push({name,...data});console.log('VERIFIED',name);};
 const out=path.resolve(__dirname,'../../../docs/evidence/storage-cleanup-wave2');await fs.mkdir(out,{recursive:true});
 try {
  const scan=await b.vault.storageScan({sourceId:b.source.id});assert.equal(scan.analysis.totals.files,40);assert.equal(scan.duplicates.groups.length,3);assert.equal(scan.tempCandidates.length,4);assert.equal(scan.duplicates.groups.reduce((n,g)=>n+g.count,0),9);
  assert.equal(scan.analysis.tree.sizeBytes,Object.values(f.originals).length&&Object.values(b.studio.getInventory(b.source.id).files).reduce((n,r)=>n+r.size,0));assert.equal(scan.analysis.categories.reduce((n,c)=>n+c.bytes,0),scan.analysis.totals.bytes);assert.equal(scan.analysis.folders.length,3);assert.equal(scan.analysis.largest[0].size,Math.max(...b.studio.getInventory(b.source.id).files.map(f=>f.size)));check('Measured tree/filetype/largest/folder analysis and three SHA-256 duplicate groups',{files:40,groups:3});
  const selections=selection(scan),group=scan.duplicates.groups[0],keeper=group.files[0];
  const request={sourceId:b.source.id,destinationId:b.destination.id,selections,tempIds:[scan.tempCandidates[0].id]};
  await assert.rejects(b.vault.vaultPlan({...request,selections:[{digest:group.digest,candidateIds:[group.files[1].id]}]}),{code:'VAULT_KEEPER_REQUIRED'});
  await assert.rejects(b.vault.vaultPlan({...request,selections:[{digest:group.digest,keeperId:keeper.id,candidateIds:[keeper.id]}]}),{code:'VAULT_UNSAFE_SELECTION'});check('No automatic keeper; quarantining the keeper is refused');
  const plan=await b.vault.vaultPlan(request);assert.equal(plan.totals.files,3);assert.equal(plan.approvalContext.kind,'cleanup-quarantine-v1');
  await assert.rejects(b.vault.vaultExecute({planId:plan.planId,planHash:'0'.repeat(64),approved:true}));await assert.rejects(b.vault.vaultExecute({planId:plan.planId,planHash:plan.planHash,approved:false}));
  b.engine.confirm=async()=>false;await assert.rejects(b.vault.vaultExecute({planId:plan.planId,planHash:plan.planHash,approved:true}),{code:'OPERATION_CONSENT_DENIED'});b.engine.confirm=async()=>true;assert.deepEqual(await sourceHashes(f),f.originals);check('Tampered plan, missing approval and denied native consent produce no effects');
  const result=await b.vault.vaultExecute({planId:plan.planId,planHash:plan.planHash,approved:true});assert.equal(result.receipt.completedFiles,3);assert.equal(result.receipt.verifiedQuarantinedBytes,plan.totals.bytes);assert.equal(result.receipt.verifiedReclaimedBytes,0);
  for(const file of plan.files){assert.equal(sha(await fs.readFile(file.targetPath)),f.originals[file.sourceRelative]);await assert.rejects(fs.access(path.join(f.source,file.sourceRelative)));}
  assert.equal(sha(await fs.readFile(path.join(f.source,keeper.relative))),group.digest);check('Three real quarantines verified, explicit keeper retained, physical reclaimed bytes remain zero',{receiptId:result.receipt.operationId,bytes:plan.totals.bytes});
  await assert.rejects(b.engine.undoPreview({journalId:result.receipt.operationId}));check('Cleanup receipts are isolated from the organization journal');
  const first=plan.files[0],conflict=path.join(f.source,first.sourceRelative);await fs.writeFile(conflict,'occupied original');let restore=await b.vault.vaultRestorePreview({journalId:result.receipt.operationId});assert.ok(restore.conflicts>0);await assert.rejects(b.vault.vaultRestore({...restore,approved:true}),{code:'VAULT_RESTORE_BLOCKED'});assert.equal(await fs.readFile(conflict,'utf8'),'occupied original');await fs.unlink(conflict);check('Restore refuses occupied original paths without overwrite or automatic rename');
  const saved=await fs.readFile(first.targetPath),stat=await fs.stat(first.targetPath);const changed=Buffer.from(saved);changed[0]^=1;await fs.writeFile(first.targetPath,changed);await fs.utimes(first.targetPath,stat.atimeMs/1000,stat.mtimeMs/1000);
  restore=await b.vault.vaultRestorePreview({journalId:result.receipt.operationId});assert.equal(restore.eligible,2);let restored=await b.vault.vaultRestore({...restore,approved:true});assert.equal(restored.result.restored,2);assert.equal(sha(await fs.readFile(first.targetPath)),sha(changed));check('Changed vault content excluded even with same size and restored mtime; safe items restore');
  await fs.writeFile(first.targetPath,saved);await fs.utimes(first.targetPath,stat.atimeMs/1000,stat.mtimeMs/1000);restore=await b.vault.vaultRestorePreview({journalId:result.receipt.operationId});await b.vault.vaultRestore({...restore,approved:true});assert.deepEqual(await sourceHashes(f),f.originals);check('All 40 fixture source hashes are intact after verified recovery');
  const report=await b.vault.vaultReport();assert.equal(report.restoredBytes,plan.totals.bytes);assert.equal(report.verifiedQuarantinedBytes,0);assert.equal(report.verifiedReclaimedBytes,0);assert.match(report.integrityHash,/^[a-f0-9]{64}$/);await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));check('Report distinguishes estimate, verified vault bytes, restored bytes and physical reclaim');
  const loaded=await create(f);assert.equal((await loaded.vault.vaultList()).length,1);loaded.vault.dispose();await loaded.studio.dispose();check('Dedicated vault journal survives restart');
  const newScan=await b.vault.storageScan({sourceId:b.source.id}),next=await b.vault.vaultPlan({...request,selections:selection(newScan)});b.engine.revoke();await assert.rejects(b.vault.vaultExecute({planId:next.planId,planHash:next.planHash,approved:true}));assert.deepEqual(await sourceHashes(f),f.originals);check('Revoked source and vault grants refuse apply');
  await fs.writeFile(path.join(out,'native-checks.json'),JSON.stringify({checks,fixture:f.root,ownerDataTouched:false},null,2));await fs.writeFile(path.join(out,'events.json'),JSON.stringify(b.events,null,2));await fs.writeFile(path.join(out,'analysis.json'),JSON.stringify(scan,null,2));
 }finally{b.vault.dispose();await b.studio.dispose();}
 console.log('Verified checks:',checks.length);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
