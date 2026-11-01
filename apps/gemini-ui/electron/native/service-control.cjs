'use strict';
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),path=require('node:path');
const SCRIPT=String.raw`
$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue'
Add-Type -AssemblyName System.ServiceProcess
$p=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('__PAYLOAD__'))|ConvertFrom-Json
if($p.name -notmatch '^[A-Za-z0-9_.-]{1,128}$' -or $p.action -notin @('read','start','stop')){throw 'Service request refused'}
function Snapshot {
 $w=Get-CimInstance Win32_Service -Filter ("Name='"+$p.name+"'") -ErrorAction Stop
 if(-not $w){throw 'Service no longer exists'}
 $c=New-Object System.ServiceProcess.ServiceController ([string]$p.name)
 try{
  $binary=[Environment]::ExpandEnvironmentVariables([string]$w.PathName)
  $m=[regex]::Match($binary,'^(?:"([^"]+\.exe)"|([A-Za-z]:\\[^\r\n]*?\.exe))(?=\s|$)','IgnoreCase')
  if(-not $m.Success){throw 'Unambiguous executable path required'}
  $exe=if($m.Groups[1].Success){$m.Groups[1].Value}else{$m.Groups[2].Value}
  if(-not $m.Groups[1].Success -and $exe -match '\s'){throw 'Unquoted executable path with spaces is ambiguous'}
  $item=Get-Item -LiteralPath $exe -ErrorAction Stop
  $route=$item;while($route){if($route.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse-point executable route refused'};$route=if($route -is [IO.FileInfo]){$route.Directory}else{$route.Parent}}
  if($item.Length -gt 104857600 -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Executable exceeds safe identity scope'}
  $signature=Get-AuthenticodeSignature -LiteralPath $exe -ErrorAction Stop
  [pscustomobject][ordered]@{name=[string]$w.Name;displayName=[string]$w.DisplayName;state=[string]$c.Status;pid=[int]$w.ProcessId;binaryPath=[string]$w.PathName;exe=$exe;account=[string]$w.StartName;startMode=[string]$w.StartMode;serviceType=[string]$w.ServiceType;canStop=[bool]$c.CanStop;fileHash=(Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash;signatureStatus=[string]$signature.Status;signer=[string]$signature.SignerCertificate.Subject;dependencies=@($c.ServicesDependedOn|Sort-Object Name|ForEach-Object{[pscustomobject]@{name=[string]$_.Name;state=[string]$_.Status}});dependents=@($c.DependentServices|Sort-Object Name|ForEach-Object{[pscustomobject]@{name=[string]$_.Name;state=[string]$_.Status}})}
 }finally{$c.Dispose()}
}
$before=Snapshot
if($p.action -ne 'read'){
 foreach($field in @('name','state','pid','binaryPath','exe','account','startMode','serviceType','canStop','fileHash','signatureStatus','signer')){if($before.$field -cne $p.expected.$field){throw 'SERVICE_CHANGED: evidence changed'}}
 foreach($field in @('dependencies','dependents')){if(($before.$field|ConvertTo-Json -Compress) -cne ($p.expected.$field|ConvertTo-Json -Compress)){throw 'SERVICE_CHANGED: dependency evidence changed'}}
 if($p.action -eq 'start' -and ($before.state -ne 'Stopped' -or $before.startMode -eq 'Disabled' -or @($before.dependencies|Where-Object state -ne 'Running').Count)){throw 'Start preflight failed'}
 if($p.action -eq 'stop' -and ($before.state -ne 'Running' -or -not $before.canStop -or @($before.dependents|Where-Object state -ne 'Stopped').Count)){throw 'Stop preflight failed'}
 $control=New-Object System.ServiceProcess.ServiceController ([string]$p.name)
 try{if($p.action -eq 'start'){$control.Start();$wanted=[System.ServiceProcess.ServiceControllerStatus]::Running}else{$control.Stop();$wanted=[System.ServiceProcess.ServiceControllerStatus]::Stopped};$control.WaitForStatus($wanted,[TimeSpan]::FromSeconds(10))}finally{$control.Dispose()}
}
Snapshot|ConvertTo-Json -Depth 6 -Compress
`;
function createServiceControl({runner=promisify(execFile),platform=process.platform}={}){
 return async(action,name,expected)=>{
  if(platform!=='win32')throw Object.assign(Error('SCM requires Windows.'),{code:'SCM_UNSUPPORTED'});
  if(!['read','start','stop'].includes(action)||typeof name!=='string'||!/^[A-Za-z0-9_.-]{1,128}$/.test(name))throw Error('Service request refused.');
  const payload=Buffer.from(JSON.stringify({action,name,expected})).toString('base64');const encoded=Buffer.from(SCRIPT.replace('__PAYLOAD__',payload),'utf16le').toString('base64');if(encoded.length>28000)throw Error('Service evidence exceeds bounded command budget.');
  const psRoot=path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0');
  // Match the existing AppBridge fix: a pwsh 7 parent can export incompatible
  // module roots to Windows PowerShell 5. Resolve built-in Windows modules only.
  let result;
  try{result=await runner(path.join(psRoot,'powershell.exe'),['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',encoded],{windowsHide:true,timeout:20000,maxBuffer:256*1024,encoding:'utf8',env:{...process.env,PSModulePath:path.join(psRoot,'Modules')}});}
  catch(e){const denied=/UnauthorizedAccess|Access is denied|PermissionDenied/i.test(String(e.stderr||''));const reason=e.killed||e.code==='ETIMEDOUT'?'SCM_PROVIDER_TIMEOUT':denied?'SCM_OWNER_ACTION_REQUIRED':'SCM_PROVIDER_FAILED';throw Object.assign(Error(denied?'Windows denied SCM access in the current account. No elevation was attempted; inspect the protected receipt before retrying.':'The bounded Windows SCM request did not complete. Inspect the protected receipt before retrying; no success is inferred.'),{code:reason});}
  return JSON.parse(String(result.stdout).replace(/^\uFEFF/, '').trim());
 };
}
module.exports={SCRIPT,createServiceControl};
