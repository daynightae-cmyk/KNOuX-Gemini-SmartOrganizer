'use strict';
const crypto=require('node:crypto');
const {ProtectedActionStore}=require('./protected-action-store.cjs');
const err=(code,message)=>Object.assign(Error(message),{code});
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
class AutomationRunner {
 constructor({operations,automation,scan,studio,userDataPath,safeStorage,now=Date.now}){this.operations=operations;this.automation=automation;this.scan=scan;this.studio=studio;this.store=new ProtectedActionStore({userDataPath,namespace:'automation-run-receipts',safeStorage});this.now=now;this.plans=new Map();}
 async saved(id){const workflow=(await this.automation.workflows()).find(w=>w.id===id);if(!workflow)throw err('AUTOMATION_WORKFLOW_MISSING','Save this workflow before native review.');return workflow;}
 validate(workflow){
  const order=this.automation.topologicalOrder(workflow);if(order.length!==workflow.nodes.length||new Set(order).size!==order.length)throw err('AUTOMATION_INVALID_GRAPH','Every saved node must belong to a valid acyclic graph.');
  const triggers=workflow.nodes.filter(n=>n.type==='trigger');if(triggers.length!==1)throw err('AUTOMATION_INVALID_GRAPH','One explicit workflow trigger is required.');const reachable=new Set([triggers[0].id]);for(const id of order){if(reachable.has(id))for(const edge of workflow.edges.filter(e=>e.from===id))reachable.add(edge.to);}if(reachable.size!==workflow.nodes.length)throw err('AUTOMATION_INVALID_GRAPH','Disconnected nodes cannot be executed.');
  const services=new Set();for(const node of workflow.nodes){
   if(node.type==='condition')throw err('AUTOMATION_CONDITION_GATED','Live condition evaluation is not connected. Remove the condition or use the preview; no step has run.');
   if(node.type!=='action'){if(!['trigger','approval','report'].includes(node.type))throw err('AUTOMATION_NODE_GATED','Unsupported node type.');continue;}
   if(node.toolId!=='auto-smart-scan'||node.config.dryRunOnly!==false||node.config.execute===true)throw err('AUTOMATION_ACTION_GATED','Only explicitly enabled read-only Smart Scan nodes can run. Cleanup, copy, cloud and OS mutations remain gated.');
   const modules=node.config.modules;if(!Array.isArray(modules)||!modules.length||modules.some(m=>!['inventory','capacity','system'].includes(m)))throw err('AUTOMATION_MODULE_GATED','Choose supported inventory, capacity or system observation modules.');
   if(modules.includes('inventory'))services.add('quick_scan');if(modules.includes('capacity')||modules.includes('system'))services.add('system_health_pulse');
  }
  if(!services.size)throw err('AUTOMATION_NO_ACTION','At least one supported native observation action is required.');return {order,services:[...services]};
 }
 async plan({workflowId,sourceId}){
  this.store.available();const workflow=await this.saved(workflowId),validated=this.validate(workflow);let source=null;
  if(validated.services.includes('quick_scan')){source=this.studio.getSource(sourceId);if(!source||!this.operations.authorized(source.path,'source'))throw err('AUTOMATION_SOURCE_REQUIRED','Authorize and index the source through this execution workbench first.');}
  this.scan.normalizeRequest({mode:'custom',services:validated.services,...(source?{sourceId:source.id}:{})});
  const plan={id:crypto.randomUUID(),workflowId:workflow.id,workflowHash:hash(workflow),sourceId:source?.id||null,sourcePath:source?.path||null,sourceLabel:source?.label||null,order:validated.order,services:validated.services,expiresAt:this.now()+300000,mode:'manual-observation'};plan.planHash=hash(plan);if(this.plans.size>=16)this.plans.delete(this.plans.keys().next().value);this.plans.set(plan.id,plan);
  return {id:plan.id,planHash:plan.planHash,workflowId:workflow.id,name:workflow.name,version:workflow.version,sourceLabel:plan.sourceLabel,sourcePath:plan.sourcePath,services:plan.services,mode:plan.mode,expiresAt:new Date(plan.expiresAt).toISOString(),nodes:plan.order.map(id=>{const n=workflow.nodes.find(n=>n.id===id);return {id:n.id,type:n.type,label:n.label};})};
 }
 async receipts(){const results=[];for(const id of await this.store.ids()){try{const r=await this.store.load(id);if(r.kind==='manual-observation-v1'){if(r.status==='running'&&this.operations.active?.opId!==r.operationId)r.status='interrupted';results.push(r);}}catch{results.push({id,status:'unreadable',name:'Unreadable protected run receipt',error:'Cannot authenticate this receipt.'});}}return results.sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));}
 async run({planId,planHash,approved}){
  if(approved!==true)throw err('AUTOMATION_APPROVAL_REQUIRED','Approve this exact manual observation workflow.');
  return this.operations.runJob('automation-run','auto-smart-scan',async({opId,signal,event})=>{
   const plan=this.plans.get(planId);if(!plan||plan.planHash!==planHash||plan.expiresAt<=this.now())throw err('AUTOMATION_PLAN_MISMATCH','Review a current exact workflow plan.');
   const workflow=await this.saved(plan.workflowId);if(hash(workflow)!==plan.workflowHash)throw err('AUTOMATION_WORKFLOW_CHANGED','The saved workflow changed; review it again.');this.validate(workflow);
   if(plan.sourceId){const source=this.studio.getSource(plan.sourceId);if(!source||source.path!==plan.sourcePath||!this.operations.authorized(source.path,'source'))throw err('AUTOMATION_SOURCE_REQUIRED','Source authorization changed.');}
   if(!await this.operations.confirm({kind:'automation-read-only',plan:{name:workflow.name,nodes:plan.order.length,source:plan.sourceLabel,planHash:plan.planHash}}))throw err('AUTOMATION_CONSENT_DENIED','Native workflow approval was declined.');
   if(signal.aborted||plan.expiresAt<=this.now())throw err('AUTOMATION_PLAN_MISMATCH','The workflow was cancelled or expired before execution.');
   const receipt={id:crypto.randomUUID(),kind:'manual-observation-v1',operationId:opId,name:workflow.name,workflowId:workflow.id,workflowVersion:workflow.version,planHash:plan.planHash,status:'running',createdAt:new Date(this.now()).toISOString(),mode:'manual-observation',externalMutation:'none',steps:[]};await this.store.save(receipt);this.plans.delete(planId);
   let activeScan=null;const cancelScan=()=>{if(activeScan)void this.scan.cancel(activeScan).catch(()=>{});};signal.addEventListener('abort',cancelScan);
   try{
    event('started',{completed:0,total:plan.order.length,receiptId:receipt.id});
    for(const id of plan.order){
     if(signal.aborted){receipt.status='cancelled';break;}const node=workflow.nodes.find(n=>n.id===id),step={id:node.id,label:node.label,type:node.type,status:'running',startedAt:new Date(this.now()).toISOString()};receipt.steps.push(step);await this.store.save(receipt);
     if(node.type==='action'){
      const modules=node.config.modules,services=[...(modules.includes('inventory')?['quick_scan']:[]),...(modules.includes('capacity')||modules.includes('system')?['system_health_pulse']:[])];
      const started=await this.scan.start({mode:'custom',services,...(services.includes('quick_scan')?{sourceId:plan.sourceId}:{})});activeScan=started.sessionId;const deadline=performance.now()+180000;let session;
      do{if(signal.aborted)await this.scan.cancel(activeScan);session=await this.scan.status(activeScan);if(['complete','partial','failed','cancelled'].includes(session.status))break;if(performance.now()>deadline){await this.scan.cancel(activeScan);throw err('AUTOMATION_SCAN_TIMEOUT','Native scan exceeded the workflow deadline.');}await new Promise(resolve=>setTimeout(resolve,100));}while(true);
      activeScan=null;step.evidence={scanSessionId:session.id,status:session.status,sourceId:session.sourceId,scope:session.scope,filesIndexed:session.summary.filesIndexed,bytesIndexed:session.summary.bytesIndexed,findings:session.findings.length,services:session.services.map(s=>({id:s.serviceId,status:s.status,source:s.source,warnings:s.warnings.slice(0,10).map(n=>String(n).slice(0,180)),limitations:s.limitations.slice(0,10).map(n=>String(n).slice(0,180)),fullEvidence:'retained in native Smart Scan session'}))};
      if(session.status==='failed')throw err('AUTOMATION_SCAN_FAILED','The native observation failed; later workflow nodes did not run.');
      step.status=session.status==='cancelled'?'cancelled':session.status==='partial'?'partial':'complete';
     }else if(node.type==='trigger'){step.status='complete';step.evidence={trigger:'explicit manual run now; no scheduler activated'};}
     else if(node.type==='approval'){step.status='complete';step.evidence={approval:'exact-plan checkbox and native confirmation before execution'};}
     else{step.status='complete';step.evidence={artifact:'this durable protected receipt',measuredActionSteps:receipt.steps.filter(s=>s.type==='action'&&['complete','partial'].includes(s.status)).length};}
     step.finishedAt=new Date(this.now()).toISOString();await this.store.save(receipt);event('progress',{completed:receipt.steps.filter(s=>s.status==='complete').length,total:plan.order.length,receiptId:receipt.id});
     if(step.status==='cancelled'){receipt.status='cancelled';break;}
    }
    if(receipt.status==='running')receipt.status=receipt.steps.some(s=>s.status==='partial')?'partial':'complete';
   }catch(e){receipt.status=signal.aborted?'cancelled':'failed';receipt.error=String(e.message).slice(0,300);const pending=receipt.steps.find(s=>s.status==='running');if(pending)pending.status=receipt.status;}
   finally{signal.removeEventListener('abort',cancelScan);if(activeScan)await this.scan.cancel(activeScan).catch(()=>{});receipt.finishedAt=new Date(this.now()).toISOString();await this.store.save(receipt);}
   event(receipt.status==='complete'?'completed':receipt.status,{completed:receipt.steps.filter(s=>s.status==='complete').length,total:plan.order.length,receiptId:receipt.id});return receipt;
  });
 }
 revoke(){this.plans.clear();}
 cancel(){return this.operations.active?.kind==='automation-run'?this.operations.cancel():false;}
}
module.exports={AutomationRunner};
