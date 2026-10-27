'use strict';
// Typed orchestration over the existing hardened copy/verify/unlink + undo engine.
// The renderer never supplies filesystem paths, execution entries or approvals.
const crypto = require('node:crypto');
const path = require('node:path');
let studioDir=path.resolve(__dirname,'../../../../electron/studio');
try {if(require('electron').app?.isPackaged) studioDir=path.join(process.resourcesPath,'native','studio');} catch {}
const safety = require(path.join(studioDir,'studio-safety.cjs'));
const error = (code, message) => Object.assign(new Error(message), { code });
const publicFile = f => ({ id:f.id, name:f.name, relative:f.relative, category:f.category, size:f.size });
class OperationEngine {
  constructor({studio, emit=()=>{}, confirm=async()=>false, sourceMode='LIVE WINDOWS'}) {
    this.studio=studio;this.emit=emit;this.confirm=confirm;this.sourceMode=sourceMode;
    this.owner=`live-organization:${crypto.randomUUID()}`;
    this.grants=new Map();this.plans=new Map();this.undos=new Map();this.sequence=0;this.active=null;this.lastOp=null;
  }
  event(opId, phase, data={}) {
    const payload={...data,opId,serviceId:data.serviceId||this.active?.serviceId||'mission-03-07',sourceMode:this.sourceMode,sequence:++this.sequence,phase,timestamp:new Date().toISOString(),provenance:'native directory inventory / verified operation journal'};
    this.emit(payload);return payload;
  }
  async grant(root,kind) {
    const route=await safety.assertSafeRoute(root);
    this.grants.set(`${kind}:${path.resolve(root).toLowerCase()}`,{root,identity:route.identity});
  }
  async runJob(kind,serviceId,work,cancel=()=>{}) {
    if(this.active || this.studio.engine.isBusy()) throw error('OPERATION_BUSY','Another operation is active.');
    const opId=crypto.randomUUID(),abort=new AbortController();
    this.active={opId,kind,serviceId,cancel:()=>{abort.abort();cancel();}};
    this.lastOp=opId;
    try {return await work({opId,signal:abort.signal,event:(phase,data)=>this.event(opId,phase,data)});}
    catch(e){this.event(opId,abort.signal.aborted?'cancelled':'failed',{errors:[{code:e.code,message:e.message}]});throw e;}
    finally{this.active=null;}
  }
  authorized(root,kind) { if(kind==='source'&&!this.studio.sources.some(s=>path.resolve(s.path).toLowerCase()===path.resolve(root).toLowerCase()))return undefined;return this.grants.get(`${kind}:${path.resolve(root).toLowerCase()}`); }
  async chooseSource() {
    if(this.active) throw error('OPERATION_BUSY','Finish or cancel the current operation first.');
    const source=await this.studio.chooseSource();
    if(source) await this.grant(source.path,'source');
    return source;
  }
  async chooseDestination() {
    if(this.active) throw error('OPERATION_BUSY','Finish or cancel the current operation first.');
    const destination=await this.studio.chooseDestination();
    if(destination) {
      await this.grant(destination.path,'destination');
      this.studio.destinations.get(destination.id).identity=this.authorized(destination.path,'destination').identity;
    }
    return destination;
  }
  requireSource(id) {
    const source=this.studio.getSource(id);
    if(!source || !this.authorized(source.path,'source')) throw error('OPERATION_PERMISSION_REQUIRED','Choose and authorize this source with the native picker in this session.');
    return source;
  }
  async scan({sourceId}) {
    if(this.active) throw error('OPERATION_BUSY','Another operation is active.');
    this.requireSource(sourceId);
    const opId=crypto.randomUUID();this.active={opId,sourceId,kind:'scan'};this.lastOp=opId;
    this.event(opId,'measuring',{completed:0});
    let count=0;const categories={};
    try {
      const source=await this.studio.scanSource(sourceId,{onFile:file=>{
        count++;categories[file.category]=(categories[file.category]||0)+1;
        this.event(opId,'discovered',{completed:count,file:publicFile(file),categories:{...categories}});
      }});
      const record=this.studio.getInventory(sourceId);
      const result={source,files:record.files.map(publicFile),summary:record.summary};
      this.event(opId,record.summary.cancelled?'cancelled':'preview',{completed:record.files.length,total:record.files.length,categories,summary:record.summary});
      return result;
    } catch(e) {this.event(opId,'failed',{errors:[{code:e.code,message:e.message}]});throw e;}
    finally {this.active=null;}
  }
  async plan(request) {
    if(this.active) throw error('OPERATION_BUSY','Another operation is active.');
    const source=this.requireSource(request.sourceId);
    const record=this.studio.getInventory(request.sourceId);
    if(!record || record.summary.partial) throw error('OPERATION_INDEX_PARTIAL','A complete fresh scan is required before mutation.');
    const destination=this.studio.destinations.get(request.destinationId);
    if(!destination || !this.authorized(destination.root,'destination')) throw error('OPERATION_DESTINATION_REQUIRED','Choose an authorized destination.');
    if(!['move','copy'].includes(request.operation) || !['rename','skip','review'].includes(request.collisionPolicy) || !['categorized','flat'].includes(request.structure)) throw error('OPERATION_INVALID_OPTIONS','Invalid organization options.');
    const selection=Array.isArray(request.fileIds)?{fileIds:request.fileIds}:{all:true};
    if(request.categoryFolderNames && (typeof request.categoryFolderNames!=='object' || Array.isArray(request.categoryFolderNames))) throw error('OPERATION_INVALID_RULES','Folder rules must be an object.');
    const plan=await this.studio.engine.buildPlan({owner:this.owner,request:{bindContent:true,selections:[{inventoryId:request.sourceId,...selection}],operation:request.operation,structure:request.structure,collisionPolicy:request.collisionPolicy,destination:{destinationId:destination.id,relativePath:''},categoryFolderNames:request.categoryFolderNames||{}},getInventory:id=>id===request.sourceId && this.studio.getSource(id) && this.studio.getInventory(id)===record && this.authorized(source.path,'source')?record:null,resolveDestination:id=>this.studio.destinations.get(id)});
    this.plans.set(plan.planId,plan);
    while(this.plans.size>10) this.plans.delete(this.plans.keys().next().value);
    this.event(plan.planId,'consent',{completed:0,total:plan.totals.files,planHash:plan.planHash});
    return plan;
  }
  async execute({planId,planHash,approved}) {
    if(this.active) throw error('OPERATION_BUSY','Another operation is active.');
    const plan=this.plans.get(planId);
    if(!plan || planHash!==plan.planHash) throw error('OPERATION_PLAN_MISMATCH','Review a current exact plan.');
    if(approved!==true) throw error('OPERATION_CONSENT_REQUIRED','Approve this exact plan first.');
    this.active={opId:planId,kind:'execute'};this.lastOp=planId;
    try {
      if(!await this.confirm({kind:'execute',plan})) throw error('OPERATION_CONSENT_DENIED','Native confirmation was declined.');
      for(const root of plan.sourceRoots) if(!this.authorized(root,'source')) throw error('OPERATION_PERMISSION_REQUIRED','A source grant was revoked.');
      for(const root of plan.destinationRoots) if(!this.authorized(root.root,'destination')) throw error('OPERATION_PERMISSION_REQUIRED','A destination grant was revoked.');
      this.plans.delete(planId);
      const result=await this.studio.engine.execute({owner:this.owner,request:{planId,planHash,approved:true,operation:plan.operation,destinationSummary:plan.destinationSummary},emit:e=>this.forward(planId,e)});
      const receipt=(await this.history()).find(r=>r.operationId===result.journalId);
      await this.refreshReceiptSources(receipt);
      return {result,receipt};
    } catch(e) {this.event(planId,'failed',{errors:[{code:e.code,message:e.message}]});throw e;}
    finally {this.active=null;}
  }
  forward(opId,e) {
    this.event(opId,e.phase,{...e,receiptId:e.journalId,completed:e.processed??e.completed,total:e.total??e.totalFiles});
  }
  async history() { return this.studio.engine.history(); }
  async refreshReceiptSources(receipt) {
    const roots=new Set((receipt?.entries||[]).map(e=>path.resolve(e.sourceRoot).toLowerCase()));
    for(const source of this.studio.sources) if(roots.has(path.resolve(source.path).toLowerCase()) && this.authorized(source.path,'source')) {
      try {await this.studio.scanSource(source.id);} catch(e) {this.event(this.lastOp,'refresh-failed',{errors:[{code:e.code,message:e.message}]});}
    }
  }
  async undoPreview({journalId}) {
    const preview=await this.studio.engine.undoPreview({journalId,owner:this.owner,authorizeRoot:(root,kind)=>this.authorized(root,kind)});
    this.undos.clear();this.undos.set(preview.previewId,preview);return preview;
  }
  async undo({journalId,previewId,previewHash,approved,resolution}) {
    if(this.active) throw error('OPERATION_BUSY','Another operation is active.');
    if(approved!==true || !['skip','rename'].includes(resolution)) throw error('OPERATION_CONSENT_REQUIRED','Approve the exact restore preview and resolution.');
    // Engine binds preview hash, journal revision, profile and root identities.
    this.active={opId:previewId,kind:'undo'};this.lastOp=previewId;
    try {
      const preview=this.undos.get(previewId);
      if(!preview || preview.previewHash!==previewHash || preview.journalId!==journalId) throw error('OPERATION_PLAN_MISMATCH','Review this exact restore first.');
      if(!await this.confirm({kind:'undo',journalId,previewHash,resolution,preview})) throw error('OPERATION_CONSENT_DENIED','Restore confirmation was declined.');
      const result=await this.studio.engine.undoApply({journalId,previewId,previewHash,resolution,owner:this.owner,authorizeRoot:(root,kind)=>this.authorized(root,kind),emit:e=>this.forward(previewId,e)});
      const receipt=(await this.history()).find(r=>r.operationId===journalId);
      await this.refreshReceiptSources(receipt);return {result,receipt};
    } finally {this.active=null;}
  }
  cancel() {
    if(this.active?.cancel) {this.active.cancel();return true;}
    if(this.active?.kind==='scan') return this.studio.cancelScan(this.active.sourceId);
    const running=this.studio.engine.active(this.owner);
    return running?this.studio.engine.cancel({owner:this.owner,operationId:running.executionId}):false;
  }
  revoke() {
    if(this.active) throw error('OPERATION_BUSY','Cancel and finish the active operation before revoking.');
    this.grants.clear();this.plans.clear();this.undos.clear();this.studio.engine.revokeOwner(this.owner);return {revoked:true};
  }
}
module.exports={OperationEngine,nativeStudioDir:studioDir};
