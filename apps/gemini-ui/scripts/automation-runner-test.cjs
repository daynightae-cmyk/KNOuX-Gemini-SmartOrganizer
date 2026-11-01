'use strict';
// Native file observations on owned fixtures; unavailable machine providers must
// remain partial. No OS mutation, external account or background task is used.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {fixture,bridgeFor,hashSources}=require('./live-organization-fixtures.cjs');
const {FilesBridge}=require('../electron/native/files-bridge.cjs');
const {StorageBridge}=require('../electron/native/storage-bridge.cjs');
const {ScanBridge}=require('../electron/native/scan-bridge.cjs');
const {AutomationBridge}=require('../electron/native/automation-bridge.cjs');
const {TEMPLATES}=require('../electron/native/automation-providers.cjs');
const {AutomationRunner}=require('../electron/native/automation-runner.cjs');
(async()=>{
 const f=await fixture(8),{engine,studio,source}=await bridgeFor(f);let consent=true,cancelOnStart=false;
 engine.confirm=async()=>consent;const files=new FilesBridge({studio,shell:{}}),storage=new StorageBridge({studio,files,userDataPath:f.profile});
 let runner;const scan=new ScanBridge({studio,files,storage,userDataPath:f.profile,emit:e=>{if(cancelOnStart&&e.type==='scan-started')runner.cancel();}});
 const automation=new AutomationBridge({userDataPath:f.profile});
 const key=crypto.randomBytes(32),secure={isEncryptionAvailable:()=>true,encryptString:text=>{const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv),data=Buffer.concat([c.update(text,'utf8'),c.final()]);return Buffer.concat([iv,c.getAuthTag(),data]);},decryptString:buffer=>{const c=crypto.createDecipheriv('aes-256-gcm',key,buffer.subarray(0,12));c.setAuthTag(buffer.subarray(12,28));return Buffer.concat([c.update(buffer.subarray(28)),c.final()]).toString('utf8');}};
 runner=new AutomationRunner({operations:engine,automation,scan,studio,userDataPath:f.profile,safeStorage:secure});engine.automationRunner=runner;
 try{
  await engine.scan({sourceId:source.id});const draft=structuredClone(TEMPLATES[0].workflow);draft.nodes.find(n=>n.type==='action').config={modules:['inventory'],dryRunOnly:false};let saved=await automation.save(draft);
  const request=p=>({planId:p.id,planHash:p.planHash,approved:true});const review=()=>runner.plan({workflowId:saved.id,sourceId:source.id});
  await assert.rejects(runner.plan({workflowId:saved.id,sourceId:'ungranted'}),{code:'AUTOMATION_SOURCE_REQUIRED'});
  const p=await review();await assert.rejects(runner.run({...request(p),approved:false}),{code:'AUTOMATION_APPROVAL_REQUIRED'});await assert.rejects(runner.run({...request(p),planHash:'tampered'}),{code:'AUTOMATION_PLAN_MISMATCH'});
  consent=false;await assert.rejects(runner.run(request(p)),{code:'AUTOMATION_CONSENT_DENIED'});consent=true;assert.equal((await runner.receipts()).length,0);
  saved=await automation.save({...saved,name:'Edited after review'});await assert.rejects(runner.run(request(p)),{code:'AUTOMATION_WORKFLOW_CHANGED'});
  const result=await runner.run(request(await review()));assert.equal(result.status,'partial','missing machine providers are not reported as complete');assert.equal(result.steps.length,4);const observed=result.steps.find(s=>s.type==='action');assert.equal(observed.evidence.filesIndexed,8);assert(observed.evidence.scanSessionId);assert(observed.evidence.services.some(s=>s.status==='partial'));
  assert.deepEqual(await hashSources(f),f.originals,'native workflow observations preserve every fixture file');
  // Complete-graph branch uses explicitly injected machine-provider fixtures;
  // folder inventory still comes from the real native owned-file scanner.
  const sample={status:'complete',source:'TEST MACHINE-PROVIDER FIXTURE ONLY',permission:'read-only',provenance:{coverage:'full'},data:{volumes:[{deviceId:'T:',sizeBytes:10000,freeBytes:5000}],cpuLoadPercent:10,memoryUsedPercent:20,memoryTotalBytes:10000,memoryFreeBytes:8000}};
  scan.readSystemSummary=async()=>sample;storage.readSystemSummary=async()=>sample;scan.readServicesSummary=async()=>({...sample,data:{total:1,running:1,stopped:0,automatic:1,manual:0,disabled:0,protectedCount:0}});
  const complete=await runner.run(request(await review()));assert.equal(complete.status,'complete');assert(complete.steps.every(s=>s.status==='complete'));assert.equal(complete.steps.find(s=>s.type==='action').evidence.filesIndexed,8);
  const originalSaved=saved;
  for(const config of [{toolId:'auto-cleanup-plan'},{toolId:'auto-backup-plan'},{config:{modules:['drivers'],dryRunOnly:false}},{config:{modules:['inventory'],dryRunOnly:true}}]){
   saved=await automation.save({...originalSaved,nodes:originalSaved.nodes.map(n=>n.type==='action'?{...n,...config}:n)});await assert.rejects(review());
  }
  saved=await automation.save({...originalSaved,nodes:originalSaved.nodes.map(n=>n.type==='approval'?{...n,type:'condition'}:n)});await assert.rejects(review(),{code:'AUTOMATION_CONDITION_GATED'});
  saved=await automation.save(originalSaved);cancelOnStart=true;const cancelled=await runner.run(request(await review()));cancelOnStart=false;assert.equal(cancelled.status,'cancelled');assert(!cancelled.steps.some(s=>s.type==='report'),'cancelled native chain does not fabricate report-node completion');assert.equal(runner.cancel(),false,'no other operation is cancelled');
  const restarted=new AutomationRunner({operations:engine,automation,scan,studio,userDataPath:f.profile,safeStorage:secure});assert((await restarted.receipts()).some(r=>r.id===result.id));
  assert.deepEqual(await hashSources(f),f.originals);
  console.log(JSON.stringify({ok:true,scope:'native owned-file observations; explicit missing/mocked machine-provider branches',observedFiles:8,truthfulPartialResult:true,completeGraphWithMockMachineProviders:true,protectedArtifactPersisted:true,cancellationReachesNativeScan:true,changedGraphAndUnapprovedRefused:true,unsupportedActionsRefused:5,noOwnerFileMutation:true}));
 }finally{scan.dispose();await files.dispose();await studio.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
