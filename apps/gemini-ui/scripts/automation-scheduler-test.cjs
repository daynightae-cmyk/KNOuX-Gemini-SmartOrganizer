'use strict';
// Virtual-clock schedule tests. Timers never register a Windows task or touch
// an owner resource. The observation run uses the real owned-file ScanBridge.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {fixture,bridgeFor,hashSources}=require('./live-organization-fixtures.cjs');
const {FilesBridge}=require('../electron/native/files-bridge.cjs');
const {StorageBridge}=require('../electron/native/storage-bridge.cjs');
const {ScanBridge}=require('../electron/native/scan-bridge.cjs');
const {AutomationBridge}=require('../electron/native/automation-bridge.cjs');
const {TEMPLATES}=require('../electron/native/automation-providers.cjs');
const {AutomationRunner}=require('../electron/native/automation-runner.cjs');
const {AutomationScheduler,quietNow}=require('../electron/native/automation-scheduler.cjs');
(async()=>{
 const f=await fixture(4),{engine,studio,source}=await bridgeFor(f);let clock=Date.parse('2026-11-02T04:00:00Z'),foreground=true,confirmations=0,power={batteryAvailable:true,batteryChargePercent:90,powerSource:'AC'};
 engine.confirm=async()=>{confirmations++;return true;};const files=new FilesBridge({studio,shell:{}}),storage=new StorageBridge({studio,files,userDataPath:f.profile}),scan=new ScanBridge({studio,files,storage,userDataPath:f.profile}),automation=new AutomationBridge({userDataPath:f.profile,now:()=>new Date(clock)});automation.runtimeEvidence=async()=>power;
 const key=crypto.randomBytes(32),secure={isEncryptionAvailable:()=>true,encryptString:text=>{const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv),data=Buffer.concat([c.update(text,'utf8'),c.final()]);return Buffer.concat([iv,c.getAuthTag(),data]);},decryptString:buffer=>{const c=crypto.createDecipheriv('aes-256-gcm',key,buffer.subarray(0,12));c.setAuthTag(buffer.subarray(12,28));return Buffer.concat([c.update(buffer.subarray(28)),c.final()]).toString('utf8');}};
 const runner=new AutomationRunner({operations:engine,automation,scan,studio,userDataPath:f.profile,safeStorage:secure,now:()=>clock});engine.automationRunner=runner;const options={runner,userDataPath:f.profile,safeStorage:secure,now:()=>clock,isForeground:()=>foreground,autoTimers:false},scheduler=new AutomationScheduler(options);runner.scheduler=scheduler;
 try{
  await engine.scan({sourceId:source.id});const draft=structuredClone(TEMPLATES[0].workflow);draft.enabled=true;draft.trigger={...draft.trigger,cadence:'interval',intervalHours:1};draft.quietHours.enabled=false;draft.nodes.find(n=>n.type==='action').config={modules:['inventory'],dryRunOnly:false};let saved=await automation.save(draft);
  const review=()=>runner.plan({workflowId:saved.id,sourceId:source.id}),request=p=>({planId:p.id,planHash:p.planHash,approved:true});
  const preview=await review();await assert.rejects(scheduler.arm({...request(preview),approved:false}),{code:'AUTOMATION_SCHEDULE_APPROVAL_REQUIRED'});const armed=await scheduler.arm(request(preview));assert.equal(armed.status,'armed');assert.equal(scheduler.timer,null,'virtual test does not create a timer');
  const restart=new AutomationScheduler(options);assert.equal((await restart.list())[0].status,'paused-requires-rearm');assert.equal(restart.armed.size,0,'restart never silently rearms');
  clock=Date.parse(armed.nextAt);foreground=false;await scheduler.tick();assert.equal(armed.lastStatus,'deferred-foreground-or-busy');assert.equal((await runner.receipts()).length,0);
  clock+=60001;foreground=true;power.batteryChargePercent=5;await scheduler.tick();assert.equal(armed.lastStatus,'deferred-low-battery');assert.equal((await runner.receipts()).length,0);
  clock+=60001;power.batteryChargePercent=90;await scheduler.tick();assert.equal(armed.lastStatus,'partial','missing machine providers remain partial');assert(armed.lastReceiptId);const scheduledReceipt=(await runner.receipts()).find(r=>r.id===armed.lastReceiptId);assert.equal(scheduledReceipt.mode,'foreground-observation');assert.equal(scheduledReceipt.scheduleId,armed.id);assert.equal(confirmations,2,'arming and occurrence each require their own native consent');const count=(await runner.receipts()).length;await scheduler.tick();assert.equal((await runner.receipts()).length,count,'one occurrence cannot execute twice');
  saved=await automation.save({...saved,name:'Workflow changed after arming'});clock=Date.parse(armed.nextAt);await scheduler.tick();assert.equal(armed.status,'paused-needs-review');assert.equal(armed.lastStatus,'AUTOMATION_WORKFLOW_CHANGED');assert.equal(scheduler.armed.size,0);
  const unknown=await scheduler.arm(request(await review()));power={batteryAvailable:false,batteryChargePercent:null,powerSource:null};clock=Date.parse(unknown.nextAt);await scheduler.tick();assert.equal(unknown.lastStatus,'AUTOMATION_POWER_OWNER_ACTION_REQUIRED');assert.equal(unknown.status,'paused-needs-review');
  power={batteryAvailable:true,batteryChargePercent:90,powerSource:'AC'};const paused=await scheduler.arm(request(await review()));await scheduler.pause({scheduleId:paused.id});assert.equal(scheduler.armed.size,0);
  const revoke=await scheduler.arm(request(await review()));engine.revoke();assert.equal(scheduler.armed.size,0,'revocation pauses every armed job');assert.equal((await scheduler.list()).find(r=>r.id===revoke.id).status,'paused-requires-rearm');
  const quiet={quietHours:{enabled:true,start:'22:00',end:'07:00',days:[0,1,2,3,4,5,6],weekendRule:'allow'}};assert(quietNow(quiet,new Date(2026,10,2,23)));assert(!quietNow(quiet,new Date(2026,10,2,12)));
  assert.deepEqual(await hashSources(f),f.originals);
  console.log(JSON.stringify({ok:true,scope:'virtual clock; no OS tasks; native owned-file observations; missing machine providers',foregroundGate:true,powerGate:true,quietHours:true,perOccurrenceConsent:true,changedGraphPauses:true,unknownPowerRequiresOwnerAction:true,restartRequiresRearm:true,revocationPauses:true,noDuplicateOccurrence:true,ownerResourcesUnchanged:true}));
 }finally{scheduler.dispose();scan.dispose();await files.dispose();await studio.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
