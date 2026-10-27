'use strict';
const {ok,fail}=require('./security.cjs');
const VAULT_FIELDS={storageScan:['sourceId','ageDays'],vaultPlan:['sourceId','destinationId','selections','tempIds'],vaultExecute:['planId','planHash','approved'],vaultList:[],vaultRestorePreview:['journalId'],vaultRestore:['journalId','previewId','previewHash','approved'],vaultReport:[]};
const CHANNELS=Object.freeze(Object.fromEntries(['chooseSource','chooseDestination','scan','plan','execute','cancel','history','undoPreview','undo','revoke',...Object.keys(VAULT_FIELDS),'event'].map(key=>[key,`knoux:operations:v1:${key}`])));
const fields={chooseSource:[],chooseDestination:[],scan:['sourceId'],plan:['sourceId','destinationId','fileIds','operation','structure','collisionPolicy','categoryFolderNames'],execute:['planId','planHash','approved'],cancel:[],history:[],undoPreview:['journalId'],undo:['journalId','previewId','previewHash','approved','resolution'],revoke:[]};
function registerOperationIpc({ipcMain,getBridge,assertSender}) {
  for(const [method,allowed] of Object.entries({...fields,...VAULT_FIELDS})) ipcMain.handle(CHANNELS[method],async(event,...args)=>{
    const capability=`operations.${method}`;
    try {
      assertSender(event);
      if(args.length>1 || (args.length && (!args[0] || typeof args[0]!=='object' || Array.isArray(args[0])))) throw Object.assign(new Error('Expected one typed request.'),{code:'OPERATION_INVALID_INPUT'});
      const request=args[0]||{};
      if(Object.keys(request).some(k=>!allowed.includes(k)) || JSON.stringify(request).length>250000) throw Object.assign(new Error('Unknown operation field or oversized request.'),{code:'OPERATION_INVALID_INPUT'});
      const bridge=getBridge();if(!bridge) throw Object.assign(new Error('Native operation engine unavailable.'),{code:'OPERATION_UNAVAILABLE'});
      const target=method in VAULT_FIELDS?bridge.storageVault:bridge;
      if(!target)throw Object.assign(new Error('Storage and Cleanup operation provider unavailable.'),{code:'OPERATION_UNAVAILABLE'});
      const data=await target[method](request);
      return ok({capability,source:'KNOuX native operation engine',permission:'per-operation-consent',data});
    } catch(e) {return fail({capability,status:e.code==='UNTRUSTED_SENDER'?'permission_denied':'failed',source:'KNOuX native operation engine',error:{code:e.code,message:e.message}});}
  });
}
module.exports={CHANNELS,registerOperationIpc};
