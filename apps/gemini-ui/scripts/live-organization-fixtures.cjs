'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {StudioBridge}=require('../electron/native/studio-bridge.cjs');
const {OperationEngine}=require('../electron/native/operation-engine.cjs');
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
async function fixture(count=40) {
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'knoux-live-owned-'));
 const source=path.join(root,'source'),destination=path.join(root,'destination');
 await fs.mkdir(source);await fs.mkdir(destination);
 const originals={};const extensions=['png','mp4','txt','pdf','zip','mp3','js','docx'];
 for(let i=0;i<count;i++) {const name=`item-${String(i).padStart(2,'0')}.${extensions[i%extensions.length]}`;const bytes=Buffer.from(`Disposable KNOuX fixture ${i}\n${'x'.repeat(100+i)}`);await fs.writeFile(path.join(source,name),bytes);originals[name]=sha(bytes);}
 return {root,source,destination,originals,profile:path.join(root,'profile')};
}
async function bridgeFor(f,options={}) {
 const studio=new StudioBridge({userDataPath:f.profile,chooseFolder:async({title})=>title.includes('source')?f.source:f.destination});await studio.init();
 const {emit:onEvent,...rest}=options;
 const events=[];const engine=new OperationEngine({studio,sourceMode:'FIXTURE TEST',confirm:async()=>true,...rest,emit:e=>{events.push(e);onEvent?.(e,engine);}});
 const source=await engine.chooseSource(),destination=await engine.chooseDestination();
 return {engine,studio,events,source,destination,request:{sourceId:source.id,destinationId:destination.id,operation:'move',structure:'categorized',collisionPolicy:'rename'}};
}
async function hashSources(f) {const result={};for(const name of Object.keys(f.originals)){try{result[name]=sha(await fs.readFile(path.join(f.source,name)));}catch{result[name]=null;}}return result;}
module.exports={fixture,bridgeFor,hashSources,sha};
