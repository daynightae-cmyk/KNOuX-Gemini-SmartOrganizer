'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {EventEmitter}=require('node:events'),{PassThrough,Writable}=require('node:stream');
const {createAttributeReader}=require('../../../electron/studio/windows-attribute-reader.cjs');
const {createProbeService}=require('../../../electron/studio/windows-studio-native.cjs');
const checks=[];
function fakeSpawn(reply){return()=>{const child=new EventEmitter();child.unref=()=>{};child.kill=()=>{};child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin=new Writable({write(data,_enc,done){const request=JSON.parse(String(data));queueMicrotask(()=>reply(child,request));done();}});return child;};}
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'knoux-readonly-attributes-'));
 if(process.platform==='win32'){
  const unusual=path.join(root,"ملف ' & $(not-a-command).txt");await fs.writeFile(unusual,'read-only fixture');
  const reader=createAttributeReader();assert.equal((await reader.read(unusual)).ok,true);assert.equal((await reader.read(path.join(root,'absent'))).ok,false);
  const original=path.join(root,'plain'),saved=path.join(root,'preserved'),target=path.join(root,'target');await fs.mkdir(original);await fs.mkdir(target);
  assert.equal((await reader.read(original)).attributes&0x400,0);await fs.rename(original,saved);await fs.symlink(target,original,'junction');assert.notEqual((await reader.read(original)).attributes&0x400,0);
  assert.equal(reader.stats().processes,1);reader.dispose();checks.push('real Win32 attributes, literal Unicode path, missing path and fresh plain-to-junction replacement');
 }
 for(const [name,reply] of [['malformed',(c)=>c.stdout.write('not json\n')],['null',(c)=>c.stdout.write('null\n')],['invalid attributes',(c,r)=>c.stdout.write(JSON.stringify({id:r.id,ok:true,attributes:0xffffffff})+'\n')],['exit',(c)=>c.emit('exit',1)],['timeout',()=>{}]]){
  const reader=createAttributeReader({spawnProcess:fakeSpawn(reply),timeoutMs:30});assert.equal((await reader.read(root)).ok,false,name);reader.dispose();checks.push(name+' fails closed');
 }
 const thrown=createAttributeReader({spawnProcess:()=>{throw Error('spawn refused');}});assert.equal((await thrown.read(root)).ok,false);assert.equal((await thrown.read('relative')).ok,false);assert.equal((await thrown.read(root+'\0')).ok,false);thrown.dispose();checks.push('spawn refusal and invalid inputs fail closed');
 let calls=0;const attrs=[0x20,0x400,0x1000,0x400000];const probe=createProbeService({platform:'win32',maxProbes:4,attributeReader:{read:async()=>({ok:true,attributes:attrs[calls++]}),stats:()=>({calls})}});
 assert.equal((await probe.probe(root)).name,'not-a-reparse-point');for(let i=0;i<3;i++)assert.equal((await probe.probe(root)).refused,true);assert.equal(calls,4);assert.equal((await probe.probe(root)).name,'query-budget-exhausted');checks.push('fresh attribute reads reject reparse, offline, recall and exhausted budget');
 const unavailable=createProbeService({platform:'win32',attributeReader:{read:async()=>({ok:false}),stats:()=>({})}});assert.equal((await unavailable.probe(root)).refused,true);checks.push('unavailable Windows metadata never assumes a safe file');
 console.log(JSON.stringify({status:'PASS',checks,fixture:root},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
