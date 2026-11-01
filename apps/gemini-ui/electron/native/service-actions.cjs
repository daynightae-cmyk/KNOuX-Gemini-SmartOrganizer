'use strict';
const crypto=require('node:crypto');
const {ProtectedActionStore}=require('./protected-action-store.cjs');
const {createServiceControl}=require('./service-control.cjs');
const {protectionDecision}=require('./services-providers.cjs');
const err=(code,message)=>Object.assign(Error(message),{code});
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a<b?-1:a>b?1:0)):item)).digest('hex');
const config=e=>({name:e.name,binaryPath:e.binaryPath,exe:e.exe,account:e.account,startMode:e.startMode,serviceType:e.serviceType,fileHash:e.fileHash,signer:e.signer,signatureStatus:e.signatureStatus,dependencies:e.dependencies.map(d=>d.name)});
function eligible(e,action){
 if(!e||!/^[A-Za-z0-9_.-]{1,128}$/.test(e.name)||!['Running','Stopped'].includes(e.state)||!Array.isArray(e.dependencies)||!Array.isArray(e.dependents)||!e.binaryPath||!e.exe||!/^[a-f0-9]{64}$/i.test(e.fileHash||''))throw err('SCM_EVIDENCE_INVALID','Complete service identity and dependency evidence is required.');
 const policy=protectionDecision({name:e.name,account:e.account,serviceType:e.serviceType,acceptsStop:e.state==='Running'?e.canStop:null});
 if(policy.protected||/driver/i.test(e.serviceType)||/[\\/]windows[\\/]/i.test(e.exe)||e.signatureStatus!=='Valid'||/Microsoft/i.test(e.signer||'')||!e.signer)throw err('SCM_TARGET_GATED','Only a signed non-Microsoft third-party service outside Windows is supported. Protected services remain denied.');
 if(action==='stop'&&(e.state!=='Running'||e.canStop!==true||e.dependents.some(d=>d.state!=='Stopped')))throw err('SCM_DEPENDENCY_CONFLICT','Stop requires a running stoppable service with no active dependents; no cascade or force is allowed.');
 if(action==='start'&&(e.state!=='Stopped'||e.startMode==='Disabled'||e.dependencies.some(d=>d.state!=='Running')))throw err('SCM_DEPENDENCY_CONFLICT','Start requires a stopped enabled service whose dependencies are already running.');
}
class ServiceActions {
 constructor({operations,getSnapshot,userDataPath,safeStorage,control=createServiceControl(),now=Date.now}){this.operations=operations;this.getSnapshot=getSnapshot;this.store=new ProtectedActionStore({userDataPath,namespace:'service-action-receipts',safeStorage});this.control=control;this.now=now;this.plans=new Map();}
 remember(plan){plan.id=crypto.randomUUID();plan.expiresAt=this.now()+300000;plan.planHash=hash(plan);if(this.plans.size>=32)this.plans.delete(this.plans.keys().next().value);this.plans.set(plan.id,plan);return {id:plan.id,planHash:plan.planHash,name:plan.expected.name,action:plan.action,before:plan.expected.state,after:plan.action==='start'?'Running':'Stopped',identityHash:hash(config(plan.expected)),receiptId:plan.receiptId||null,expiresAt:new Date(plan.expiresAt).toISOString()};}
 publicReceipt(r){return {id:r.id,name:r.original.name,action:r.action,status:r.status,before:r.original.state,after:r.afterState,createdAt:r.createdAt,updatedAt:r.updatedAt,error:r.error||null,recoveryAvailable:['prepared','changed','uncertain'].includes(r.status)};}
 async load(id){const receipt=await this.store.load(id);if(receipt.kind!=='service-control-v1'||receipt.originalHash!==hash(receipt.original))throw err('SCM_RECEIPT_INVALID','Protected service receipt does not match its original evidence.');return receipt;}
 async receipts(){const results=[];for(const id of await this.store.ids()){try{results.push(this.publicReceipt(await this.load(id)));}catch{results.push({id,name:'Unreadable protected receipt',status:'unreadable',recoveryAvailable:false,error:'Cannot decrypt or validate this receipt.'});}}return results.sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));}
 async plan({serviceName,action}){
  this.store.available();if(!['start','stop'].includes(action))throw err('SCM_ACTION_GATED','Restart, startup policy, force and cascading changes remain gated.');
  const snapshot=await this.getSnapshot(),record=snapshot.services.find(s=>s.name===serviceName);if(!record)throw err('SCM_NOT_MEASURED','Select a measured service before planning.');
  const evidence=await this.control('read',record.name);eligible(evidence,action);
  if(record.binaryPath!==evidence.binaryPath||record.state!==evidence.state)throw err('SCM_CHANGED','Measured service identity or state changed. Refresh discovery first.');
  return this.remember({action,expected:evidence,original:evidence});
 }
 async restorePlan({receiptId}){
  const receipt=await this.load(receiptId);if(!this.publicReceipt(receipt).recoveryAvailable)throw err('SCM_RESTORE_UNAVAILABLE','This service receipt has no pending recovery.');
  const evidence=await this.control('read',receipt.original.name),action=receipt.original.state==='Running'?'start':'stop';eligible(evidence,action);
  if(hash(config(evidence))!==hash(config(receipt.original))||evidence.state!==receipt.afterState)throw err('SCM_RESTORE_CONFLICT','Service identity or current state differs from the receipt. Nothing was forced.');
  return this.remember({action,expected:evidence,original:receipt.original,receiptId,receiptHash:hash(receipt)});
 }
 async apply({planId,planHash,approved}){
  if(approved!==true)throw err('SCM_APPROVAL_REQUIRED','Approve this exact service-state change.');
  return this.operations.runJob('service-action',this.plans.get(planId)?.receiptId?'services-undo':'services-control',async({event})=>{
   this.operations.active.cancel=null;const plan=this.plans.get(planId);if(!plan||plan.planHash!==planHash||plan.expiresAt<=this.now())throw err('SCM_PLAN_MISMATCH','Review a current exact service-state plan.');
   this.store.available();const current=await this.control('read',plan.expected.name);eligible(current,plan.action);if(hash(current)!==hash(plan.expected))throw err('SCM_CHANGED','Service evidence changed since preflight.');
   let receipt=plan.receiptId?await this.load(plan.receiptId):null;if(receipt&&hash(receipt)!==plan.receiptHash)throw err('SCM_CHANGED','Recovery receipt changed.');
   if(!await this.operations.confirm({kind:'service-state',plan:{name:plan.expected.name,action:plan.action,before:current.state,identityHash:hash(config(current))}}))throw err('SCM_CONSENT_DENIED','Native service confirmation was declined.');
   if(plan.expiresAt<=this.now())throw err('SCM_PLAN_MISMATCH','Plan expired during confirmation.');
   if(!receipt){receipt={id:crypto.randomUUID(),kind:'service-control-v1',original:plan.original,originalHash:hash(plan.original),action:plan.action,afterState:plan.action==='start'?'Running':'Stopped',status:'prepared',createdAt:new Date(this.now()).toISOString()};await this.store.save(receipt);}
   this.plans.delete(planId);event('started',{completed:0,total:1,receiptId:receipt.id});
   try{const after=await this.control(plan.action,plan.expected.name,plan.expected);if(after.state!==(plan.action==='start'?'Running':'Stopped')||hash(config(after))!==hash(config(plan.original)))throw err('SCM_POSTCONDITION_FAILED','Native service postcondition differs from approved evidence.');receipt.status=plan.receiptId?'restored':'changed';receipt.updatedAt=new Date(this.now()).toISOString();receipt.error=null;await this.store.save(receipt);event('completed',{completed:1,total:1,receiptId:receipt.id});return this.publicReceipt(receipt);}
   catch(e){receipt.status='uncertain';receipt.error=String(e.message).slice(0,300);receipt.updatedAt=new Date(this.now()).toISOString();await this.store.save(receipt).catch(()=>{});throw e;}
  });
 }
 revoke(){this.plans.clear();}
}
module.exports={ServiceActions,eligible};
