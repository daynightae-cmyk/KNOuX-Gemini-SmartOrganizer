'use strict';
// Mock Registry effects + authenticated test-profile receipts. Never opens HKCU.
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {fixture,bridgeFor}=require('./live-organization-fixtures.cjs');
const {StartupActions}=require('../electron/native/startup-actions.cjs');
const {StartupBridge}=require('../electron/native/startup-bridge.cjs');
const {RUN_KEY,SCRIPT,createRegistry}=require('../electron/native/startup-registry.cjs');
const {registerOperationIpc,CHANNELS}=require('../electron/native/operation-ipc.cjs');
const clone=value=>structuredClone(value);
(async()=>{
 const f=await fixture(1),{engine}=await bridgeFor(f);let now=Date.now(),consent=true,interrupted=false,writes=0;
 engine.confirm=async()=>consent;
 const key=crypto.randomBytes(32);
 const secure={isEncryptionAvailable:()=>true,encryptString:text=>{const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);const data=Buffer.concat([cipher.update(text,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),data]);},decryptString:buffer=>{const decipher=crypto.createDecipheriv('aes-256-gcm',key,buffer.subarray(0,12));decipher.setAuthTag(buffer.subarray(12,28));return Buffer.concat([decipher.update(buffer.subarray(28)),decipher.final()]).toString('utf8');}};
 const name='Test app [literal] $value',original={exists:true,kind:'ExpandString',data:'C:\\Fixture\\test-app.exe --flag %UNCHANGED_TOKEN%',acl:'TEST-ACL',sid:'TEST-USER-SID',approved:null};
 const values=new Map([[name,clone(original)],['Unrelated entry',{...original,data:'untouched'}]]);
 const absent=()=>({...original,exists:false,data:null,kind:null});
 let expectedPrepared=false;
 const registry=async(action,valueName,expected,restore)=>{
  const current=clone(values.get(valueName)||absent());if(action==='read')return current;
  assert.deepEqual(current,expected,'native compare-before-write rejects a concurrent change');
  if(action==='disable'){
   const files=(await fs.readdir(path.join(f.profile,'startup-action-receipts'))).filter(n=>n.endsWith('.bin'));
   assert(files.length>0,'durable receipt exists BEFORE mutation');
   if(expectedPrepared){const decoded=await Promise.all(files.map(async file=>JSON.parse(secure.decryptString(await fs.readFile(path.join(f.profile,'startup-action-receipts',file))))));assert(decoded.some(r=>r.status==='prepared'&&r.name===name));}
   values.delete(valueName);
  }else{assert.equal(action,'restore');assert(!values.has(valueName));values.set(valueName,clone(restore));}
  writes++;if(interrupted){interrupted=false;throw Error('Simulated interruption after write');}return clone(values.get(valueName)||absent());
 };
 const reader=new StartupBridge({platform:'win32'});
 const entry=reader.mapRegistryRow({hive:'HKCU',key:RUN_KEY,view:'64',kind:'run',name,command:original.data,approved:'enabled'});
 assert(!JSON.stringify(entry).includes('actionTarget'),'raw action target stays inside main process');
 let inventory={entries:[entry]};
 const options={operations:engine,getInventory:()=>inventory,userDataPath:f.profile,safeStorage:secure,registry,now:()=>now};
 const actions=new StartupActions(options);engine.startupActions=actions;
 const request=plan=>({planId:plan.id,planHash:plan.planHash,approved:true});
 for(const change of [{scope:'machine'},{sourceKind:'registry-runonce'},{protection:'protected'},{state:'disabled'},{elevationRequired:true}]){
  inventory={entries:[Object.assign(Object.create(entry),change)]};await assert.rejects(actions.disablePlan({entryId:entry.id}),{code:'STARTUP_TARGET_GATED'});
 }inventory={entries:[entry]};
 await assert.rejects(new StartupActions({...options,safeStorage:{isEncryptionAvailable:()=>false}}).disablePlan({entryId:entry.id}),{code:'STARTUP_SECURE_STORAGE_REQUIRED'});
 const plan=await actions.disablePlan({entryId:entry.id});
 await assert.rejects(actions.apply({...request(plan),approved:false}),{code:'STARTUP_APPROVAL_REQUIRED'});
 await assert.rejects(actions.apply({...request(plan),planHash:'tampered'}),{code:'STARTUP_PLAN_MISMATCH'});
 consent=false;await assert.rejects(actions.apply(request(plan)),{code:'STARTUP_CONSENT_DENIED'});consent=true;assert.equal(writes,0);
 values.set(name,{...original,data:'changed-command'});await assert.rejects(actions.apply(request(plan)),{code:'STARTUP_CHANGED'});await assert.rejects(actions.disablePlan({entryId:entry.id}),{code:'STARTUP_CHANGED'});values.set(name,clone(original));
 now+=300001;await assert.rejects(actions.apply(request(plan)),{code:'STARTUP_PLAN_MISMATCH'});
 const fresh=await actions.disablePlan({entryId:entry.id});engine.active={kind:'other'};await assert.rejects(actions.apply(request(fresh)),{code:'OPERATION_BUSY'});engine.active=null;
 expectedPrepared=true;const disabled=await actions.apply(request(fresh));expectedPrepared=false;
 assert.equal(disabled.status,'disabled');assert(!values.has(name));assert.equal(values.get('Unrelated entry').data,'untouched');
 const restarted=new StartupActions(options);const restore=await restarted.restorePlan({receiptId:disabled.id});
 values.set(name,{...original,data:'new-owner-value'});await assert.rejects(restarted.apply(request(restore)),{code:'STARTUP_CHANGED'});await assert.rejects(restarted.restorePlan({receiptId:disabled.id}),{code:'STARTUP_RESTORE_CONFLICT'});values.delete(name);
 const restored=await restarted.apply(request(await restarted.restorePlan({receiptId:disabled.id})));assert.equal(restored.status,'restored');assert.deepEqual(values.get(name),original);
 interrupted=true;const interruptedPlan=await actions.disablePlan({entryId:entry.id});await assert.rejects(actions.apply(request(interruptedPlan)),/Simulated interruption/);
 const uncertain=(await actions.receipts()).find(r=>r.status==='uncertain');assert(uncertain?.recoveryAvailable);assert(!values.has(name));
 await restarted.apply(request(await restarted.restorePlan({receiptId:uncertain.id})));assert.deepEqual(values.get(name),original);
 const encrypted=await fs.readFile(path.join(f.profile,'startup-action-receipts',disabled.id+'.bin'));assert(!encrypted.includes(Buffer.from(original.data)),'receipt does not store plaintext startup command');encrypted[35]^=1;await fs.writeFile(path.join(f.profile,'startup-action-receipts',disabled.id+'.bin'),encrypted);assert((await actions.receipts()).some(r=>r.id===disabled.id&&r.status==='unreadable'));await assert.rejects(actions.restorePlan({receiptId:disabled.id}));
 const routes=new Map();let trusted=true;registerOperationIpc({ipcMain:{handle:(channel,handler)=>routes.set(channel,handler)},getBridge:()=>engine,assertSender:()=>{if(!trusted)throw Object.assign(Error('Untrusted'),{code:'UNTRUSTED_SENDER'});}});
 let reply=await routes.get(CHANNELS.startupApply)({}, {...request(fresh),command:'injected'});assert.equal(reply.error.code,'OPERATION_INVALID_INPUT');trusted=false;reply=await routes.get(CHANNELS.startupApply)({},request(fresh));assert.equal(reply.status,'permission_denied');assert.deepEqual(values.get(name),original);
 // Decode the actual command through an injected process runner; no Registry
 // process is launched. Its payload remains data, including shell metacharacters.
 let command;await createRegistry({platform:'win32',runner:async(_exe,args,limits)=>{assert.equal(limits.windowsHide,true);command=Buffer.from(args.at(-1),'base64').toString('utf16le');return {stdout:JSON.stringify(original)};}})('read',name);
 assert(command.includes(SCRIPT.slice(0,65)));assert(!command.includes(name));
 console.log(JSON.stringify({ok:true,scope:'mock Registry and authenticated disposable profile only',disableRestore:true,interruptionRecovery:true,protectedSourcesRefused:5,staleAndMissingApprovalRefused:true,encryptedReceiptTamperRefused:true,strictIpc:true,writes,profile:f.profile}));
})().catch(e=>{console.error(e);process.exitCode=1;});
