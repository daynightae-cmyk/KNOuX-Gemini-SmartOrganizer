$ErrorActionPreference='Stop'
$Repo='D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer'
$Mission=Join-Path $Repo 'missions\VISUAL_REDESIGN_DAY_NIGHT_20261027'
$Target=Join-Path $Mission 'references'
$Downloads=Join-Path $env:USERPROFILE 'Downloads'
$Map=@(
  @{ Name='01_organization-studio.png'; Day='08_36_13 AM-1.png'; Night='08_39_02 AM-2.png'},
  @{ Name='02_files-instant-search.png'; Day='08_36_26 AM-8.png'; Night='08_39_08 AM-4.png'},
  @{ Name='03_smart-scan.png'; Day='08_36_21 AM-5.png'; Night='08_39_00 AM-1.png'},
  @{ Name='04_applications.png'; Day='08_36_24 AM-7.png'; Night='08_39_06 AM-3.png'},
  @{ Name='05_storage.png'; Day='08_36_22 AM-6.png'; Night='08_39_09 AM-5.png'},
  @{ Name='06_cleanup.png'; Day='08_36_27 AM-9.png'; Night='08_39_11 AM-6.png'},
  @{ Name='07_startup.png'; Day='08_36_29 AM-10.png'; Night='08_39_12 AM-7.png'},
  @{ Name='08_system.png'; Day='08_36_18 AM-3.png'; Night='08_39_14 AM-8.png'},
  @{ Name='09_repair.png'; Day='08_36_16 AM-2.png'; Night='08_39_15 AM-9.png'},
  @{ Name='10_services.png'; Day='08_36_19 AM-4.png'; Night='08_39_17 AM-10.png'}
)
if(-not(Test-Path -LiteralPath $Repo -PathType Container)){throw 'Project missing'}
if(-not(Test-Path -LiteralPath $Mission -PathType Container)){throw 'Mission folder missing'}
if(-not(Test-Path -LiteralPath $Target -PathType Container)){throw 'Reference folder missing'}
if(-not(Test-Path -LiteralPath $Downloads -PathType Container)){throw 'Downloads missing'}
Add-Type -AssemblyName System.Drawing
$all=@(Get-ChildItem -LiteralPath $Downloads -File -Filter 'ChatGPT Image Oct 27, 2026, 08_*.png')
$matched=New-Object System.Collections.ArrayList
foreach($entry in $Map){
 foreach($theme in @('day','night')){
  $suffix=if($theme -eq 'day'){$entry.Day}else{$entry.Night}
  $found=@($all | Where-Object {$_.Name.EndsWith($suffix,[System.StringComparison]::OrdinalIgnoreCase)})
  if($found.Count -ne 1){throw "Missing or ambiguous '$theme' image for $($entry.Name): $suffix matches=$($found.Count)"}
  $img=[System.Drawing.Image]::FromFile($found[0].FullName)
  try {if($img.Width -ne 1672 -or $img.Height -ne 941){throw "Unexpected image size: $($found[0].FullName) $($img.Width)x$($img.Height)"}} finally {$img.Dispose()}
  [void]$matched.Add([pscustomobject]@{ Theme=$theme; Name=$entry.Name; Original=$found[0].FullName })
 }
}
$nonce=[guid]::NewGuid().ToString('N').Substring(0,10)
$stage=Join-Path $Mission ('references.__incoming_'+$nonce)
$backupFolder=Join-Path $Mission 'references_backups'
$backup=Join-Path $backupFolder ('before_20261027_'+(Get-Date -Format 'yyyyMMdd_HHmmss')+'_'+$nonce)
New-Item -ItemType Directory -Path $stage -ErrorAction Stop | Out-Null
$existingMoved=$false
try{
 foreach($theme in @('day','night')){New-Item -ItemType Directory -Path (Join-Path $stage $theme) -ErrorAction Stop | Out-Null}
 $manifest=New-Object System.Collections.ArrayList
 foreach($f in $matched){
  $targetPath=Join-Path (Join-Path $stage $f.Theme) $f.Name
  Copy-Item -LiteralPath $f.Original -Destination $targetPath -ErrorAction Stop
  $srcHash=(Get-FileHash -LiteralPath $f.Original -Algorithm SHA256).Hash
  $destHash=(Get-FileHash -LiteralPath $targetPath -Algorithm SHA256).Hash
  if($srcHash -ne $destHash){throw 'Image hash mismatch '+$f.Name}
  [void]$manifest.Add([pscustomobject]@{ Theme=$f.Theme; Name=$f.Name; SHA256=$destHash; Source=$f.Original })
 }
 if(@(Get-ChildItem -LiteralPath (Join-Path $stage 'day') -File -Filter '*.png').Count -ne 10){throw 'Invalid DAY count'}
 if(@(Get-ChildItem -LiteralPath (Join-Path $stage 'night') -File -Filter '*.png').Count -ne 10){throw 'Invalid NIGHT count'}
 New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
 Move-Item -LiteralPath $Target -Destination $backup -ErrorAction Stop
 $existingMoved=$true
 Move-Item -LiteralPath $stage -Destination $Target -ErrorAction Stop
 $manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $Target 'references-installed-manifest.json') -Encoding UTF8
 Write-Output 'RESULT=SUCCESS'
 Write-Output "DAY_COUNT=$(@(Get-ChildItem -LiteralPath (Join-Path $Target 'day') -Filter '*.png' -File).Count)"
 Write-Output "NIGHT_COUNT=$(@(Get-ChildItem -LiteralPath (Join-Path $Target 'night') -Filter '*.png' -File).Count)"
 Write-Output "TARGET=$Target"
 Write-Output "BACKUP=$backup"
 Write-Output 'APP_SOURCE_UNTOUCHED=True'
} catch {
 if($existingMoved -and -not(Test-Path -LiteralPath $Target) -and (Test-Path -LiteralPath $backup)){
  Move-Item -LiteralPath $backup -Destination $Target -ErrorAction SilentlyContinue
 }
 throw
}
