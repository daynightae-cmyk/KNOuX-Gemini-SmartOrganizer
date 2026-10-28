'use strict';
// Main-only, read-only Win32 metadata transport. Paths are JSON data on stdin;
// they never become PowerShell source, command arguments, or renderer IPC.
const {spawn}=require('node:child_process');
const path=require('node:path');
const SCRIPT=String.raw`
$ErrorActionPreference='Stop'
[Console]::InputEncoding=[Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class KnouxReadOnlyAttributes {
 [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
 public static extern uint GetFileAttributesW(string path);
}
'@
while ($null -ne ($line=[Console]::ReadLine())) {
 $request=$null
 try {
  if ($line.Length -gt 131072) { throw 'Oversized metadata request' }
  $request=ConvertFrom-Json -InputObject $line -ErrorAction Stop
  if ($request.path -isnot [string] -or $request.path.Length -gt 32767) { throw 'Invalid metadata request' }
  $attributes=[KnouxReadOnlyAttributes]::GetFileAttributesW($request.path)
  if ($attributes -eq [uint32]::MaxValue) { $answer=@{id=$request.id;ok=$false;error=[Runtime.InteropServices.Marshal]::GetLastWin32Error()} }
  else { $answer=@{id=$request.id;ok=$true;attributes=[long]$attributes} }
 } catch { $answer=@{id=if($request){$request.id}else{0};ok=$false;error='METADATA_QUERY_FAILED'} }
 [Console]::WriteLine(($answer|ConvertTo-Json -Compress))
}
`;

function createAttributeReader({windowsDirectory=process.env.WINDIR||'C:\\Windows',spawnProcess=spawn,timeoutMs=8000,idleMs=2500,maxPending=64}={}){
 let worker=null,sequence=0,buffer='',idle=null;const pending=new Map();const stats={processes:0,queries:0,failures:0};
 function stop(){if(idle)clearTimeout(idle);idle=null;const child=worker;worker=null;buffer='';if(child)child.kill();}
 function fail(){stats.failures++;for(const item of pending.values()){clearTimeout(item.timer);item.resolve({ok:false,error:'METADATA_PROVIDER_UNAVAILABLE'});}pending.clear();stop();}
 function start(){
  const child=spawnProcess(path.join(windowsDirectory,'System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(SCRIPT,'utf16le').toString('base64')],{windowsHide:true,stdio:['pipe','pipe','pipe']});
  worker=child;stats.processes++;child.unref();child.stdin.unref?.();child.stdout.unref?.();child.stderr.unref?.();
  child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{
   if(worker!==child)return;buffer+=chunk;if(buffer.length>512*1024){fail();return;}
   let index;while((index=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,index).trim();buffer=buffer.slice(index+1);if(!line)continue;
    let answer;try{answer=JSON.parse(line);}catch{fail();return;}if(!answer||typeof answer!=='object'){fail();return;}const item=pending.get(answer.id);if(!item){fail();return;}
    pending.delete(answer.id);clearTimeout(item.timer);const valid=answer.ok===true&&Number.isInteger(answer.attributes)&&answer.attributes>=0&&answer.attributes<0xffffffff;
    item.resolve(valid?{ok:true,attributes:answer.attributes}:{ok:false,error:'METADATA_QUERY_FAILED'});
    if(!pending.size){idle=setTimeout(stop,idleMs);idle.unref();}
   }
  });
  child.stderr.on('data',()=>{});child.on('error',()=>{if(worker===child)fail();});child.on('exit',()=>{if(worker===child)fail();});child.stdin.on('error',()=>{if(worker===child)fail();});
 }
 function read(target){
  if(typeof target!=='string'||!path.isAbsolute(target)||target.includes('\0')||target.length>32767||pending.size>=maxPending)return Promise.resolve({ok:false,error:'METADATA_INVALID_REQUEST'});
  if(idle)clearTimeout(idle);idle=null;if(!worker){try{start();}catch{fail();return Promise.resolve({ok:false,error:'METADATA_PROVIDER_UNAVAILABLE'});}}const id=++sequence;stats.queries++;
  return new Promise(resolve=>{const timer=setTimeout(fail,timeoutMs);pending.set(id,{resolve,timer});try{worker.stdin.write(JSON.stringify({id,path:path.toNamespacedPath(target)})+'\n');}catch{fail();}});
 }
 return {read,stats:()=>({...stats,pending:pending.size}),dispose:fail};
}
module.exports={createAttributeReader};
