'use strict';
// Fixed current-user Run key only. No command is ever launched or evaluated.
// GetValue preserves ExpandString tokens: https://learn.microsoft.com/dotnet/api/microsoft.win32.registrykey.getvalue
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const path=require('node:path');
const RUN_KEY='Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const SCRIPT=String.raw`
$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'
$p=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('__PAYLOAD__'))|ConvertFrom-Json
if($p.action -notin @('read','disable','restore')){throw 'Action refused'}
if(-not $p.name -or $p.name.Length -gt 16383 -or $p.name.Contains([char]0)){throw 'Value name refused'}
$base=[Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::CurrentUser,[Microsoft.Win32.RegistryView]::Registry64)
$key=$base.OpenSubKey('Software\Microsoft\Windows\CurrentVersion\Run',($p.action -ne 'read'))
if(-not $key){throw 'Run key is missing or not accessible'}
$approved=$base.OpenSubKey('Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run',$false)
function Snapshot {
 $exists=@($key.GetValueNames()) -contains [string]$p.name
 $kind=$null; $data=$null
 if($exists){$kind=[string]$key.GetValueKind($p.name);$data=$key.GetValue($p.name,$null,[Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames);if($kind -notin @('String','ExpandString')){throw 'Only string Run values are supported'}}
 $ap=$null
 if($approved -and @($approved.GetValueNames()) -contains [string]$p.name){$v=$approved.GetValue($p.name,$null,[Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames);$ap=[string]$approved.GetValueKind($p.name)+':'+($v|ConvertTo-Json -Compress)}
 [pscustomobject]@{exists=[bool]$exists;kind=$kind;data=$data;acl=$key.GetAccessControl().Sddl;approved=$ap;sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value}
}
try {
 $before=Snapshot
 if($p.action -ne 'read'){
  foreach($field in @('exists','kind','data','acl','approved','sid')){if($before.$field -cne $p.expected.$field){throw 'STARTUP_CHANGED: preflight evidence changed'}}
  if($p.action -eq 'disable'){if(-not $before.exists){throw 'Value already absent'};$key.DeleteValue([string]$p.name,$true)}
  else{if($before.exists -or $p.original.kind -notin @('String','ExpandString') -or $p.original.data -isnot [string]){throw 'Restore conflict'};$key.SetValue([string]$p.name,[string]$p.original.data,[Enum]::Parse([Microsoft.Win32.RegistryValueKind],[string]$p.original.kind))}
  $key.Flush()
 }
 Snapshot|ConvertTo-Json -Compress -Depth 5
}finally{if($approved){$approved.Dispose()};$key.Dispose();$base.Dispose()}
`;
function validateSnapshot(value){
 if(!value||typeof value.exists!=='boolean'||!value.sid||typeof value.acl!=='string'||(value.exists&&(!['String','ExpandString'].includes(value.kind)||typeof value.data!=='string'||value.data.length>32768)))throw Object.assign(Error('Invalid registry evidence.'),{code:'STARTUP_EVIDENCE_INVALID'});
 return {exists:value.exists,kind:value.kind??null,data:value.data??null,acl:value.acl,approved:value.approved??null,sid:value.sid};
}
function createRegistry({runner=promisify(execFile),platform=process.platform}={}){
 return async(action,name,expected,original)=>{
  if(platform!=='win32')throw Object.assign(Error('Windows Registry is unavailable.'),{code:'STARTUP_UNSUPPORTED'});
  if(!['read','disable','restore'].includes(action)||typeof name!=='string'||!name||name.length>16383||name.includes('\0'))throw Error('Invalid registry request.');
  const payload=Buffer.from(JSON.stringify({action,name,expected,original})).toString('base64');
  const encoded=Buffer.from(SCRIPT.replace('__PAYLOAD__',payload),'utf16le').toString('base64');
  if(encoded.length>28000)throw Object.assign(Error('Registry evidence exceeds the bounded command budget.'),{code:'STARTUP_EVIDENCE_LIMIT'});
  let result;
  try{result=await runner(path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',encoded],{windowsHide:true,timeout:15000,maxBuffer:256*1024,encoding:'utf8'});}
  catch(e){const denied=/UnauthorizedAccess|Access is denied|PermissionDenied/i.test(String(e.stderr||''));throw Object.assign(Error(denied?'Windows denied access to the current-user Run key. No permissions were changed.':'The bounded registry request did not complete. Inspect the protected receipt before retrying; no success is inferred.'),{code:denied?'STARTUP_OWNER_ACTION_REQUIRED':e.killed||e.code==='ETIMEDOUT'?'STARTUP_PROVIDER_TIMEOUT':'STARTUP_PROVIDER_FAILED'});}
  return validateSnapshot(JSON.parse(String(result.stdout).replace(/^\uFEFF/, '').trim()));
 };
}
module.exports={RUN_KEY,SCRIPT,createRegistry,validateSnapshot};
