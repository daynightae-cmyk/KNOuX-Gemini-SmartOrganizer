'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const {fixture,bridgeFor,sha}=require('./live-organization-fixtures.cjs');
const {FilesBridge}=require('../electron/native/files-bridge.cjs');
const {StorageBridge}=require('../electron/native/storage-bridge.cjs');
const {StorageVault}=require('../electron/native/storage-vault.cjs');
async function makeFixture() {
 const f=await fixture(0);
 const old=new Date(Date.now()-10*86400000);
 for(let group=0;group<3;group++)for(let copy=0;copy<3;copy++) {
  const relative=`group-${group}/copy-${copy}.bin`,absolute=path.join(f.source,relative),bytes=Buffer.alloc(4096+group*64,65+group);
  await fs.mkdir(path.dirname(absolute),{recursive:true});await fs.writeFile(absolute,bytes);f.originals[relative]=sha(bytes);
 }
 for(let i=0;i<31;i++) {
  const name=i<4?`old-${i}.tmp`:`unique-${i}.txt`,bytes=Buffer.from(`Owned Wave 2 fixture ${i} ${'x'.repeat(i)}`);
  await fs.writeFile(path.join(f.source,name),bytes);await fs.utimes(path.join(f.source,name),old,old);f.originals[name]=sha(bytes);
 }
 return f;
}
async function create(f,options={}) {
 const b=await bridgeFor(f,options);
 const files=new FilesBridge({studio:b.studio});
 const storage=new StorageBridge({studio:b.studio,files,readSystemSummary:async()=>({status:'unavailable'}),userDataPath:f.profile});
 const vault=new StorageVault({operations:b.engine,files,storage,userDataPath:f.profile});b.engine.storageVault=vault;
 return {...b,vault,files,storage};
}
function selection(scan){const group=scan.duplicates.groups[0];return [{digest:group.digest,keeperId:group.files[0].id,candidateIds:group.files.slice(1).map(f=>f.id)}];}
async function sourceHashes(f){const out={};for(const name of Object.keys(f.originals)){try{out[name]=sha(await fs.readFile(path.join(f.source,name)));}catch{out[name]=null;}}return out;}
module.exports={makeFixture,create,selection,sourceHashes,sha};
