'use strict';
// Test-owned stateful SCM adapter only. Never starts or stops a Windows service.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs/promises'),path=require('node:path');
const {fixture,bridgeFor}=require('./live-organization-fixtures.cjs');
const {ServiceActions}=require('../electron/native/service-actions.cjs');
const {SCRIPT,createServiceControl}=require('../electron/native/service-control.cjs');
const {registerOperationIpc,CHANNELS}=require('../electron/native/operation-ipc.cjs');
const clone=structuredClone;
(async()=>{
 const f=await fixture(1),{engine}=await bridgeFor(f);let allowed=true,interrupted=false,denied=false,writes=0,now=Date.now();engine.confirm=async()=>allowed;
 const key=crypto.randomBytes(32),secure={isEncryptionAvailable:()=>true,encryptString:text=>{const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv),data=Buffer.concat([c.update(text,'utf8'),c.final()]);return Buffer.concat([iv,c.getAuthTag(),data]);},decryptString:buffer=>{const c=crypto.createDecipheriv('aes-256-gcm',key,buffer.subarray(0,12));c.setAuthTag(buffer.subarray(12,28));return Buffer.concat([c.update(buffer.subarray(28)),c.final()]).toString('utf8');}};
 const original={name:'FixtureAgent',displayName:'Fixture Agent',state:'Running',pid:100,binaryPath:'"C:\\Fixture\\agent.exe" --service',exe:'C:\\Fixture\\agent.exe',account:'LocalSystem',startMode:'Auto',serviceType:'Own Process',canStop:true,fileHash:'a'.repeat(64),signatureStatus:'Valid',signer:'CN=Fixture Vendor',dependencies:[],dependents:[]};
 let current=clone(original),measured=clone(original);
 const control=async(action,name,expected)=>{assert.equal(name,current.name);if(action==='read')return clone(current);assert.deepEqual(current,expected,'compare immediately before SCM change');if(denied)throw Error('Fixture access denied');const journals=await fs.readdir(path.join(f.profile,'service-action-receipts'));assert(journals.some(n=>n.endsWith('.bin')),'receipt is durable before state changes');current.state=action==='start'?'Running':'Stopped';current.pid=action==='start'?101:0;current.canStop=action==='start';writes++;if(interrupted){interrupted=false;throw Error('Fixture interrupted after transition');}return clone(current);};
 const options={operations:engine,getSnapshot:async()=>({services:[measured]}),userDataPath:f.profile,safeStorage:secure,control,now:()=>now};
 const actions=new ServiceActions(options);engine.serviceActions=actions;
 const plan=()=>actions.plan({serviceName:current.name,action:current.state==='Running'?'stop':'start'}),request=p=>({planId:p.id,planHash:p.planHash,approved:true});
 for(const patch of [{name:'WinDefend'},{exe:'C:\\Windows\\system32\\service.exe'},{signer:'CN=Microsoft Corporation'},{signatureStatus:'NotSigned'},{serviceType:'Kernel Driver'},{canStop:false},{dependents:[{name:'FixtureDependent',state:'Running'}]}]){
  current={...clone(original),...patch};measured=clone(current);await assert.rejects(plan());
 }current=clone(original);measured=clone(current);
 const p=await plan();await assert.rejects(actions.apply({...request(p),approved:false}),{code:'SCM_APPROVAL_REQUIRED'});await assert.rejects(actions.apply({...request(p),planHash:'tampered'}),{code:'SCM_PLAN_MISMATCH'});
 allowed=false;await assert.rejects(actions.apply(request(p)),{code:'SCM_CONSENT_DENIED'});allowed=true;assert.equal(writes,0);
 current.fileHash='b'.repeat(64);await assert.rejects(actions.apply(request(p)),{code:'SCM_CHANGED'});current=clone(original);
 now+=300001;await assert.rejects(actions.apply(request(p)),{code:'SCM_PLAN_MISMATCH'});
 const stopped=await actions.apply(request(await plan()));assert.equal(current.state,'Stopped');assert.equal(stopped.status,'changed');
 const restarted=new ServiceActions(options);const inverse=await restarted.restorePlan({receiptId:stopped.id});const restored=await restarted.apply(request(inverse));assert.equal(current.state,'Running');assert.equal(restored.status,'restored');
 measured=clone(current);denied=true;await assert.rejects(actions.apply(request(await plan())),/access denied/);denied=false;assert.equal(current.state,'Running');
 measured=clone(current);interrupted=true;await assert.rejects(actions.apply(request(await plan())),/interrupted/);assert.equal(current.state,'Stopped');
 const uncertain=(await actions.receipts()).find(r=>r.status==='uncertain'&&r.error.includes('interrupted'));assert(uncertain?.recoveryAvailable);
 current.fileHash='c'.repeat(64);await assert.rejects(actions.restorePlan({receiptId:uncertain.id}),{code:'SCM_RESTORE_CONFLICT'});current.fileHash=original.fileHash;
 await actions.apply(request(await actions.restorePlan({receiptId:uncertain.id})));assert.equal(current.state,'Running');
 current={...clone(original),state:'Stopped',pid:0,canStop:false,dependencies:[{name:'FixtureDependency',state:'Stopped'}]};measured=clone(current);await assert.rejects(plan(),{code:'SCM_DEPENDENCY_CONFLICT'});current=clone(original);measured=clone(current);
 const routes=new Map();let trusted=true;registerOperationIpc({ipcMain:{handle:(channel,handler)=>routes.set(channel,handler)},getBridge:()=>engine,assertSender:()=>{if(!trusted)throw Object.assign(Error('Untrusted'),{code:'UNTRUSTED_SENDER'});}});
 let reply=await routes.get(CHANNELS.serviceStatePlan)({}, {serviceName:original.name,action:'stop',force:true});assert.equal(reply.error.code,'OPERATION_INVALID_INPUT');trusted=false;reply=await routes.get(CHANNELS.serviceStateApply)({},request(p));assert.equal(reply.status,'permission_denied');assert.equal(current.state,'Running');
 let command;await createServiceControl({platform:'win32',runner:async(_exe,args,limits)=>{assert.equal(limits.windowsHide,true);command=Buffer.from(args.at(-1),'base64').toString('utf16le');return {stdout:JSON.stringify(original)};}})('read',original.name);assert(command.includes(SCRIPT.slice(0,65)));assert(!command.includes("Name='FixtureAgent'"));
 console.log(JSON.stringify({ok:true,scope:'mock SCM + authenticated disposable receipt profile',stopStartRecovery:true,interruptedTransitionRecovery:true,protectedCases:7,permissionDenialPreservesState:true,noCascade:true,staleExpiredAndUnapprovedRefused:true,strictIpc:true,writes}));
})().catch(e=>{console.error(e);process.exitCode=1;});
