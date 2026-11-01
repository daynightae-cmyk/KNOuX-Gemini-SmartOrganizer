'use strict';
const crypto=require('node:crypto');
const {ProtectedActionStore}=require('./protected-action-store.cjs');
const {RUN_KEY,createRegistry,validateSnapshot}=require('./startup-registry.cjs');
const err=(code,message)=>Object.assign(Error(message),{code});
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item)).digest('hex');
const ID=/^[a-f0-9-]{36}$/i;
class StartupActions {
 constructor({operations,getInventory,userDataPath,safeStorage,registry=createRegistry(),now=Date.now}){
  this.operations=operations;this.getInventory=getInventory;this.store=new ProtectedActionStore({userDataPath,namespace:'startup-action-receipts',safeStorage});this.root=this.store.root;this.safeStorage=safeStorage;this.registry=registry;this.now=now;this.plans=new Map();
 }
 available(){if(!this.safeStorage?.isEncryptionAvailable())throw err('STARTUP_SECURE_STORAGE_REQUIRED','Windows-protected receipt storage is required before changing startup.');}
 async save(receipt){this.available();await this.store.save(receipt);}
 async load(id){if(!ID.test(id))throw err('STARTUP_RECEIPT_INVALID','Invalid receipt identifier.');const r=await this.store.load(id);if(r.key!==RUN_KEY||typeof r.name!=='string'||r.originalHash!==hash(validateSnapshot(r.original)))throw err('STARTUP_RECEIPT_INVALID','Receipt evidence does not match.');return r;}
 publicReceipt(r){return {id:r.id,name:r.name,key:r.key,status:r.status,createdAt:r.createdAt,updatedAt:r.updatedAt,originalHash:r.originalHash,error:r.error||null,recoveryAvailable:['prepared','disabled','uncertain'].includes(r.status)};}
 async receipts(){this.available();const results=[];for(const id of await this.store.ids()){try{results.push(this.publicReceipt(await this.load(id)));}catch{results.push({id,name:'Unreadable protected receipt',key:RUN_KEY,status:'unreadable',recoveryAvailable:false,error:'Receipt cannot be authenticated/decrypted.'});}}return results.sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));}
 remember(plan){if(this.plans.size>=32)this.plans.delete(this.plans.keys().next().value);plan.id=crypto.randomUUID();plan.expiresAt=this.now()+300000;plan.planHash=hash(plan);this.plans.set(plan.id,plan);return {id:plan.id,planHash:plan.planHash,mode:plan.mode,name:plan.name,key:RUN_KEY,expiresAt:new Date(plan.expiresAt).toISOString(),originalHash:hash(plan.original),receiptId:plan.receiptId||null};}
 async disablePlan({entryId}){
  this.available();const entry=this.getInventory()?.entries.find(e=>e.id===entryId),target=entry?.actionTarget;
  if(!entry||entry.scope!=='user'||entry.sourceKind!=='registry-run'||entry.elevationRequired||entry.protection!=='standard'||entry.state!=='enabled'||target?.hive!=='HKCU'||target?.key?.toLowerCase()!==RUN_KEY.toLowerCase()||target.view!=='64'||!target.name||/^(?:securityhealth|windows defender)/i.test(target.name)||/^[a-z]:\\windows\\/i.test(entry.rawExecutable||''))throw err('STARTUP_TARGET_GATED','Only an unprotected, enabled current-user Run value can be disabled. Other startup sources remain gated.');
  const current=await this.registry('read',target.name);validateSnapshot(current);const env=new Map(Object.entries(process.env).map(([key,value])=>[key.toLowerCase(),value]));const expanded=String(current.data||'').replace(/%([^%]+)%/g,(match,key)=>env.get(key.toLowerCase())??match);if(!current.exists||expanded!==target.command)throw err('STARTUP_CHANGED','The Run value changed since measurement. Rescan first.');
  return this.remember({mode:'disable',name:target.name,original:current,expected:current,entryId});
 }
 async restorePlan({receiptId}){
  const receipt=await this.load(receiptId);if(!this.publicReceipt(receipt).recoveryAvailable)throw err('STARTUP_RESTORE_UNAVAILABLE','Receipt is not recoverable.');
  const current=await this.registry('read',receipt.name);validateSnapshot(current);
  if(current.exists||current.acl!==receipt.original.acl||current.sid!==receipt.original.sid||current.approved!==receipt.original.approved)throw err('STARTUP_RESTORE_CONFLICT','The value already exists, or its owner, ACL or StartupApproved evidence changed. Nothing was overwritten.');
  return this.remember({mode:'restore',name:receipt.name,original:receipt.original,expected:current,receiptId,receiptHash:hash(receipt)});
 }
 async apply({planId,planHash,approved}){
  if(approved!==true)throw err('STARTUP_APPROVAL_REQUIRED','Approve this exact startup plan first.');
  return this.operations.runJob('startup-action',this.plans.get(planId)?.mode==='restore'?'startup-restore':'startup-disable',async({event})=>{
   // One bounded registry write cannot be interrupted halfway. Native Cancel
   // remains available in the confirmation dialog; no false worker cancellation.
   this.operations.active.cancel=null;
   const plan=this.plans.get(planId);if(!plan||plan.planHash!==planHash||plan.expiresAt<=this.now())throw err('STARTUP_PLAN_MISMATCH','Review a current exact startup plan.');
   this.available();const current=await this.registry('read',plan.name);if(hash(current)!==hash(plan.expected))throw err('STARTUP_CHANGED','Registry evidence changed since preflight.');
   let receipt=plan.mode==='restore'?await this.load(plan.receiptId):null;
   if(receipt&&hash(receipt)!==plan.receiptHash)throw err('STARTUP_CHANGED','Recovery receipt changed since preview.');
   if(!await this.operations.confirm({kind:'startup-'+plan.mode,plan:{name:plan.name,key:RUN_KEY,originalHash:hash(plan.original)}}))throw err('STARTUP_CONSENT_DENIED','Native startup confirmation was declined.');
   if(plan.expiresAt<=this.now())throw err('STARTUP_PLAN_MISMATCH','The preview expired while awaiting confirmation. Review again.');
   // Recovery evidence must reach durable protected storage BEFORE registry mutation.
   if(!receipt){receipt={id:crypto.randomUUID(),key:RUN_KEY,name:plan.name,original:plan.original,originalHash:hash(plan.original),createdAt:new Date(this.now()).toISOString(),status:'prepared'};await this.save(receipt);}
   this.plans.delete(planId);event('started',{completed:0,total:1,receiptId:receipt.id});
   try{
    const after=await this.registry(plan.mode,plan.name,plan.expected,plan.original);
    if(after.exists!==(plan.mode==='restore')||after.acl!==plan.original.acl||after.sid!==plan.original.sid||after.approved!==plan.original.approved||(plan.mode==='restore'&&(after.kind!==plan.original.kind||after.data!==plan.original.data)))throw err('STARTUP_POSTCONDITION_FAILED','The native startup postcondition did not match. Review the recovery receipt.');
    receipt.status=plan.mode==='restore'?'restored':'disabled';receipt.updatedAt=new Date(this.now()).toISOString();receipt.error=null;await this.save(receipt);event('completed',{completed:1,total:1,receiptId:receipt.id});return this.publicReceipt(receipt);
   }catch(e){receipt.status='uncertain';receipt.updatedAt=new Date(this.now()).toISOString();receipt.error=String(e.message).slice(0,300);await this.save(receipt).catch(()=>{});throw e;}
  },undefined);
 }
 revoke(){this.plans.clear();}
}
module.exports={StartupActions};
