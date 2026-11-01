'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const ID=/^[a-f0-9-]{36}$/i;
class ProtectedActionStore {
 constructor({userDataPath,namespace,safeStorage}){
  if(!['startup-action-receipts','service-action-receipts','automation-run-receipts','automation-schedules'].includes(namespace))throw Error('Receipt namespace refused.');
  this.root=path.join(userDataPath,namespace);this.safeStorage=safeStorage;
 }
 available(){if(!this.safeStorage?.isEncryptionAvailable())throw Object.assign(Error('Windows-protected receipt storage is required before native changes.'),{code:'SECURE_ACTION_STORAGE_REQUIRED'});}
 async save(receipt){
  if(!ID.test(receipt.id))throw Error('Receipt identifier refused.');this.available();await fs.mkdir(this.root,{recursive:true});
  const target=path.join(this.root,receipt.id+'.bin'),temp=target+'.'+crypto.randomUUID()+'.tmp';
  const handle=await fs.open(temp,'wx',0o600);try{await handle.writeFile(this.safeStorage.encryptString(JSON.stringify(receipt)));await handle.sync();}finally{await handle.close();}
  await fs.rename(temp,target);
 }
 async load(id){
  if(!ID.test(id))throw Error('Receipt identifier refused.');this.available();const file=path.join(this.root,id+'.bin'),stat=await fs.lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>512000)throw Error('Receipt is not a bounded regular file.');
  const receipt=JSON.parse(this.safeStorage.decryptString(await fs.readFile(file)));if(receipt.id!==id)throw Error('Receipt identity mismatch.');return receipt;
 }
 async ids(){this.available();try{return (await fs.readdir(this.root)).filter(name=>/^[a-f0-9-]{36}\.bin$/i.test(name)).slice(-200).map(name=>name.slice(0,-4));}catch(e){if(e.code==='ENOENT')return [];throw e;}}
}
module.exports={ProtectedActionStore};
