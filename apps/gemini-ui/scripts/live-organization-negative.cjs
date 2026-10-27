'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {fixture,bridgeFor,hashSources}=require('./live-organization-fixtures.cjs');
async function main(){
 if(process.argv[2]==='interrupt-worker') {
  const f=JSON.parse(process.argv[3]);const b=await bridgeFor(f,{emit:e=>{if(e.phase==='progress'&&e.completed===1)process.exit(79);}});
  await b.engine.scan({sourceId:b.source.id});const p=await b.engine.plan(b.request);await b.engine.execute({planId:p.planId,planHash:p.planHash,approved:true});throw Error('Interruption point not reached');
 }
 const checks=[];const f=await fixture(3),b=await bridgeFor(f);
 try {
  await b.engine.scan({sourceId:b.source.id});const p=await b.engine.plan(b.request);
  const lockPath=path.join(f.source,p.files[0].name);
  const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop'; $stream=[System.IO.File]::Open($env:KNOUX_LOCK_FILE,[System.IO.FileMode]::Open,[System.IO.FileAccess]::ReadWrite,[System.IO.FileShare]::None); [Console]::WriteLine('LOCKED'); $wait=[Diagnostics.Stopwatch]::StartNew(); while(-not [System.IO.File]::Exists($env:KNOUX_LOCK_RELEASE) -and $wait.Elapsed.TotalSeconds -lt 30){Start-Sleep -Milliseconds 50}; $stream.Dispose()"],{env:{...process.env,KNOUX_LOCK_FILE:lockPath,KNOUX_LOCK_RELEASE:path.join(f.root,'release-lock')},windowsHide:true,stdio:['pipe','pipe','pipe']});
  let lockErrors='';child.stderr.on('data',data=>{lockErrors+=data.toString();});
  await new Promise((resolve,reject)=>{child.once('exit',code=>reject(Error('Lock helper exited '+code+': '+lockErrors)));const timer=setTimeout(()=>reject(Error('Fixture lock timed out')),10000);child.stdout.once('data',data=>{clearTimeout(timer);data.toString().includes('LOCKED')?resolve():reject(Error('Lock failed'));});child.once('error',reject);});
  try {await assert.rejects(b.engine.execute({planId:p.planId,planHash:p.planHash,approved:true}));}
  finally {const exited=new Promise(resolve=>child.once('exit',resolve));await fs.writeFile(path.join(f.root,'release-lock'),'release');await exited;}
  assert.deepEqual(await hashSources(f),f.originals);for(const file of p.files)await assert.rejects(fs.access(file.targetPath));checks.push('Exclusive Windows file lock refuses operation before effects; original hashes preserved');
 }finally{await b.studio.dispose();}
 const interrupted=await fixture(4);
 const exitCode=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[__filename,'interrupt-worker',JSON.stringify(interrupted)],{windowsHide:true,stdio:'ignore'});child.once('exit',resolve);child.once('error',reject);});assert.equal(exitCode,79);
 const recovered=await bridgeFor(interrupted);try {
  const rows=await recovered.engine.history();assert.equal(rows.length,1);assert.equal(rows[0].status,'interrupted');
  const preview=await recovered.engine.undoPreview({journalId:rows[0].operationId});assert.equal(preview.eligible,1);
  const result=await recovered.engine.undo({...preview,approved:true,resolution:'skip'});assert.equal(result.result.restored,1);assert.deepEqual(await hashSources(interrupted),interrupted.originals);
  checks.push('Actual worker process interruption persisted journal; restart detects interrupted state and safely undoes the completed move');
 }finally{await recovered.studio.dispose();}
 const out=path.resolve(__dirname,'../../../docs/evidence/live-organization/negative-checks.json');await fs.writeFile(out,JSON.stringify({checks,fixtures:[f.root,interrupted.root],ownerDataTouched:false},null,2));console.log(JSON.stringify({checks},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
