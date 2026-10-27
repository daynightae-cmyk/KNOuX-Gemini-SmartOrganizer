'use strict';
// Cleanup policy is separate from organization semantics. Only its low-level,
// verified transfer/journal machinery is reused; no purge endpoint exists.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {nativeStudioDir}=require('./operation-engine.cjs');
const safety=require(path.join(nativeStudioDir,'studio-safety.cjs'));
const {createOrganizationEngine}=require(path.join(nativeStudioDir,'studio-organization.cjs'));
const KIND='cleanup-quarantine-v1';
const err=(code,message)=>Object.assign(new Error(message),{code});
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const blocked=/(^|[\\/])(windows|system32|winsxs|softwaredistribution|\$recycle\.bin|system volume information|user data|profiles|browser profiles)([\\/]|$)/i;
class StorageVault {
 constructor({operations,storage,files,userDataPath}) {
  this.ops=operations;this.storage=storage;this.files=files;
  this.owner=`cleanup:${crypto.randomUUID()}`;this.snapshots=new Map();this.plans=new Map();this.restores=new Map();
  this.engine=createOrganizationEngine({storagePath:path.join(userDataPath,'gemini-cleanup','live-vault-journal.json')});
 }
 safePath(value) {if(blocked.test(value))throw err('VAULT_PROTECTED_PATH','Windows, browser profiles, Recycle Bin and servicing roots are excluded.');}
 source(id) {const source=this.ops.requireSource(id);this.safePath(source.path);return source;}
 async digest(sourceId,fileId,signal) {
  const value=await this.files.hash(sourceId,fileId,'sha256',{signal});
  if(!value.digestReliable||value.changedDuringRead)throw err('VAULT_CHANGED_FILE','A file changed while verifying its content. Rescan.');
  return value.digest;
 }
 async storageScan({sourceId,ageDays=7}) {
  if(!Number.isInteger(ageDays)||ageDays<0||ageDays>3650)throw err('VAULT_INVALID_AGE','Age must be an integer from 0 to 3650 days.');
  const source=this.source(sourceId);
  return this.ops.runJob('storage-scan','storage-duplicates',async job=>{
   job.event('measuring',{completed:0});
   const indexed=await this.ops.studio.scanSource(sourceId,{onFile:file=>job.event('discovered',{completed:file.id+1,currentName:file.name})});
   if(job.signal.aborted)throw err('OPERATION_CANCELLED','Scan cancelled.');
   const record=this.ops.studio.getInventory(sourceId),analysis=await this.storage.analysis(sourceId);
   const duplicates=await this.storage.verifyDuplicates(sourceId,{minimumBytes:1,maxFiles:400,maxBytes:256*1024*1024,maxGroups:200,perGroup:400,signal:job.signal,acceptFile:file=>!blocked.test(path.join(source.path,file.relative)),onProgress:p=>job.event('hashing',p)});
   const beforeFilter=duplicates.groups.length;
   duplicates.groups=duplicates.groups.filter(g=>new Set(g.files.map(f=>record.files[f.id]?.identity?.fileIdentity)).size===g.files.length);
   duplicates.summary.verifiedGroups=duplicates.groups.length;
   duplicates.summary.reclaimableVerifiedBytes=duplicates.groups.reduce((n,g)=>n+g.wastedBytes,0);
   if(beforeFilter!==duplicates.groups.length)duplicates.warnings.push('Groups sharing a file identity were excluded from reclaim selection.');
   const tempCandidates=record.files.filter(f=>!blocked.test(path.join(source.path,f.relative))&&/\.(tmp|temp|log|bak|dmp)$/i.test(f.name)&&Date.now()-f.modifiedMs>=ageDays*86400000).map(f=>({id:f.id,name:f.name,relative:f.relative,size:f.size,reason:`Reviewed temporary extension; at least ${ageDays} days old`,risk:'manual-review'}));
   const result={source:indexed,analysis,duplicates,tempCandidates,ageDays,scannedAt:new Date().toISOString(),readOnly:true};
   this.snapshots.set(sourceId,{record,result});while(this.snapshots.size>3)this.snapshots.delete(this.snapshots.keys().next().value);
   job.event('preview',{completed:record.files.length,total:record.files.length});return result;
  },()=>this.ops.studio.cancelScan(sourceId));
 }
 async vaultPlan({sourceId,destinationId,selections=[],tempIds=[]}) {
  this.source(sourceId);
  const snapshot=this.snapshots.get(sourceId),record=this.ops.studio.getInventory(sourceId);
  if(!snapshot||snapshot.record!==record||record.summary.partial)throw err('VAULT_STALE_SCAN','A complete current scan is required.');
  if(!Array.isArray(selections)||!Array.isArray(tempIds)||selections.length>200||tempIds.length>1000)throw err('VAULT_INVALID_SELECTION','Invalid or oversized candidate selection.');
  const destination=this.ops.studio.destinations.get(destinationId);
  if(!destination||!this.ops.authorized(destination.root,'destination'))throw err('VAULT_PERMISSION_REQUIRED','Choose and authorize a vault folder.');
  this.safePath(destination.root);
  if(safety.isInside(record.root,destination.root)||safety.isInside(destination.root,record.root))throw err('VAULT_OVERLAPPING_ROOTS','Vault and source must be separate, non-nested folders.');
  const [sourceStat,vaultStat]=await Promise.all([fs.stat(record.root),fs.stat(destination.root)]);
  if(sourceStat.dev!==vaultStat.dev)throw err('VAULT_VOLUME_MISMATCH','This vault requires a destination on the same volume; no physical disk space will be freed.');
  return this.ops.runJob('vault-plan','storage-reclaim',async job=>{
   const selected=new Set(),witnesses=[],duplicateCandidates=[];
   for(const selection of selections) {
    const group=snapshot.result.duplicates.groups.find(g=>g.digest===selection.digest);
    if(!group||!Number.isInteger(selection.keeperId)||!group.files.some(f=>f.id===selection.keeperId)||!Array.isArray(selection.candidateIds))throw err('VAULT_KEEPER_REQUIRED','Choose an explicit confirmed keeper for each duplicate group.');
    for(const id of selection.candidateIds) {
     if(!Number.isInteger(id)||id===selection.keeperId||!group.files.some(f=>f.id===id)||selected.has(id))throw err('VAULT_UNSAFE_SELECTION','A keeper cannot be quarantined and each candidate must be unique.');
     selected.add(id);
     duplicateCandidates.push({id,digest:selection.digest});
    }
    if(selection.candidateIds.length)witnesses.push({keeperId:selection.keeperId,digest:selection.digest,relative:record.files[selection.keeperId].relative});
   }
   for(const id of tempIds) {
    if(!Number.isInteger(id)||!snapshot.result.tempCandidates.some(f=>f.id===id))throw err('VAULT_NOT_TEMP_CANDIDATE','Only reviewed temporary candidates can enter this plan.');
    if(witnesses.some(w=>w.keeperId===id))throw err('VAULT_UNSAFE_SELECTION','A selected keeper must remain outside the vault.');
    selected.add(id);
   }
   if(!selected.size)throw err('VAULT_EMPTY_SELECTION','Select candidates manually; nothing is selected automatically.');
   for(const witness of witnesses) {
    if(selected.has(witness.keeperId)||await this.digest(sourceId,witness.keeperId,job.signal)!==witness.digest)throw err('VAULT_KEEPER_CHANGED','The keeper changed or is selected for quarantine.');
   }
   for(const candidate of duplicateCandidates)if(await this.digest(sourceId,candidate.id,job.signal)!==candidate.digest)throw err('VAULT_CHANGED_FILE','A duplicate candidate changed after discovery. Rescan.');
   const folder=`KNOuX-Quarantine-${crypto.randomUUID()}`;
   const categoryFolderNames=Object.fromEntries([...selected].map(id=>[record.files[id].category,folder]));
   const approvalContext={kind:KIND,sourceId,ageDays:snapshot.result.ageDays,selection:[...selected],keepers:witnesses,estimatedSavings:[...selected].reduce((n,id)=>n+record.files[id].size,0),physicalReclaimedBytes:0,risk:'Reviewed candidates only. Quarantine retains bytes on this volume; no purge is available.'};
   const plan=await this.engine.buildPlan({owner:this.owner,request:{bindContent:true,selections:[{inventoryId:sourceId,fileIds:[...selected]}],operation:'move',structure:'categorized',collisionPolicy:'rename',destination:{destinationId,relativePath:''},categoryFolderNames,approvalContext},getInventory:id=>id===sourceId&&this.ops.studio.getInventory(id)===record&&this.ops.authorized(record.root,'source')?record:null,resolveDestination:id=>this.ops.studio.destinations.get(id)});
   if(job.signal.aborted)throw err('OPERATION_CANCELLED','Planning cancelled; no file was moved.');
   this.plans.set(plan.planId,plan);while(this.plans.size>10)this.plans.delete(this.plans.keys().next().value);
   job.event('consent',{completed:0,total:plan.totals.files,planHash:plan.planHash});return plan;
  });
 }
 async checkKeepers(plan,signal) {
  this.source(plan.approvalContext.sourceId);
  for(const witness of plan.approvalContext.keepers)if(await this.digest(plan.approvalContext.sourceId,witness.keeperId,signal)!==witness.digest)throw err('VAULT_KEEPER_CHANGED','A keeper is missing or changed; quarantine was refused.');
 }
 cancelWorker(){const active=this.engine.active(this.owner);if(active)this.engine.cancel({owner:this.owner,operationId:active.executionId});}
 async vaultExecute({planId,planHash,approved}) {
  const plan=this.plans.get(planId);
  if(!plan||planHash!==plan.planHash||approved!==true)throw err('VAULT_APPROVAL_REQUIRED','Approve the exact current quarantine plan.');
  return this.ops.runJob('quarantine','cleanup-temp-quarantine',async job=>{
   if(!await this.ops.confirm({kind:'execute',plan}))throw err('OPERATION_CONSENT_DENIED','Native quarantine confirmation was declined.');
   if(job.signal.aborted)throw err('OPERATION_CANCELLED','Quarantine cancelled before execution.');
   await this.checkKeepers(plan,job.signal);
   if(plan.destinationRoots.some(root=>!this.ops.authorized(root.root,'destination')))throw err('VAULT_PERMISSION_REQUIRED','Vault authorization was revoked.');
   this.plans.delete(planId);
   const result=await this.engine.execute({owner:this.owner,request:{planId,planHash,approved:true,operation:'move',destinationSummary:plan.destinationSummary},beforeFile:()=>this.checkKeepers(plan,job.signal),emit:e=>job.event(e.phase,{...e,completed:e.processed??e.completed,total:e.total??e.totalFiles,receiptId:e.journalId})});
   const receipt=(await this.vaultList()).find(r=>r.operationId===result.journalId);
   await this.ops.refreshReceiptSources(receipt);return {result,receipt};
  },()=>this.cancelWorker());
 }
 async vaultList() {
  return (await this.engine.history()).filter(r=>r.approvalContext?.kind===KIND).map(r=>({...r,estimatedSavings:r.approvalContext.estimatedSavings,verifiedQuarantinedBytes:r.entries.filter(e=>e.state==='moved'&&!['restored','restored-destination-remains'].includes(e.undo?.state)).reduce((n,e)=>n+e.size,0),verifiedReclaimedBytes:0,restoredBytes:r.entries.filter(e=>['restored','restored-destination-remains'].includes(e.undo?.state)).reduce((n,e)=>n+e.size,0)}));
 }
 async vaultRestorePreview({journalId}) {
  const receipt=(await this.vaultList()).find(r=>r.operationId===journalId);
  if(!receipt)throw err('VAULT_RECEIPT_REQUIRED','Only a Cleanup vault receipt can be restored here.');
  const preview=await this.engine.undoPreview({journalId,owner:this.owner,authorizeRoot:(root,kind)=>this.ops.authorized(root,kind)});
  const scoped={...preview,sourceRoots:[...new Set(receipt.entries.map(e=>e.sourceRoot))],vaultRoots:[...new Set(receipt.entries.map(e=>e.targetRoot))]};
  this.restores.clear();this.restores.set(preview.previewId,scoped);return scoped;
 }
 async vaultRestore({journalId,previewId,previewHash,approved}) {
  const preview=this.restores.get(previewId);
  if(!preview||preview.previewHash!==previewHash||preview.journalId!==journalId||approved!==true)throw err('VAULT_APPROVAL_REQUIRED','Approve a current exact restore preview.');
  if(preview.conflicts||preview.requiredRoots.length||!preview.eligible)throw err('VAULT_RESTORE_BLOCKED','Original paths must be vacant, roots authorized and vault contents unchanged. No automatic overwrite or restore rename.');
  return this.ops.runJob('vault-restore','cleanup-temp-undo',async job=>{
   if(!await this.ops.confirm({kind:'undo',journalId,previewHash,resolution:'skip',preview}))throw err('OPERATION_CONSENT_DENIED','Restore confirmation was declined.');
   if(job.signal.aborted)throw err('OPERATION_CANCELLED','Restore cancelled before execution.');
   this.restores.delete(previewId);
   const result=await this.engine.undoApply({journalId,previewId,previewHash,resolution:'skip',owner:this.owner,authorizeRoot:(root,kind)=>this.ops.authorized(root,kind),emit:e=>job.event(e.phase,{...e,completed:e.processed,total:e.total,receiptId:journalId})});
   const receipt=(await this.vaultList()).find(r=>r.operationId===journalId);
   await this.ops.refreshReceiptSources(receipt);return {result,receipt};
  },()=>this.cancelWorker());
 }
 async vaultReport() {
  const receipts=await this.vaultList();
  const report={kind:KIND,generatedAt:new Date().toISOString(),scope:'current application profile only',receipts,estimatedSavings:receipts.reduce((n,r)=>n+r.estimatedSavings,0),verifiedQuarantinedBytes:receipts.reduce((n,r)=>n+r.verifiedQuarantinedBytes,0),verifiedReclaimedBytes:0,restoredBytes:receipts.reduce((n,r)=>n+r.restoredBytes,0),spaceExplanation:'Same-volume quarantine preserves bytes. Verified physical reclaimed bytes are zero. No purge operation is exposed.'};
  report.estimateBasis='Sum of historical approved plan estimates; not unique current disk savings.';
  return {...report,integrityHash:hash(report)};
 }
 dispose(){this.engine.dispose();}
}
module.exports={StorageVault,KIND};
