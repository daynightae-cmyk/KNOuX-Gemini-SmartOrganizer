$ErrorActionPreference='Stop'
$repo='D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer'
$root=Join-Path $repo 'missions\VISUAL_REDESIGN_DAY_NIGHT_20261027'
$dl=Join-Path $env:USERPROFILE 'Downloads'
$homeMatches=@(Get-ChildItem -LiteralPath $dl -File -Filter '*.png'|Where-Object {$_.Name -like '*09_48_28*-2.png'})
$logoMatches=@(Get-ChildItem -LiteralPath $dl -File -Filter '*.png'|Where-Object {$_.Name -like '*09_48_26*-1.png'})
if($homeMatches.Count -ne 1 -or $logoMatches.Count -ne 1){throw "Expected one of each. Home=$($homeMatches.Count) Logo=$($logoMatches.Count)"}
Add-Type -AssemblyName System.Drawing
foreach($p in @(@{Image=$homeMatches[0];Width=1672;Height=941},@{Image=$logoMatches[0];Width=1254;Height=1254})){
 $im=[System.Drawing.Image]::FromFile($p.Image.FullName)
 try{if($im.Width -ne $p.Width -or $im.Height -ne $p.Height){throw "Unexpected dimensions: $($p.Image.Name) $($im.Width)x$($im.Height)"}}finally{$im.Dispose()}
}
$day=Join-Path $root 'references\day'
$brand=Join-Path $root 'references\brand'
New-Item -ItemType Directory -Force -Path $day,$brand | Out-Null
$files=@(
 @{Source=$homeMatches[0].FullName;Target=(Join-Path $day '00_home-command-center.png')},
 @{Source=$logoMatches[0].FullName;Target=(Join-Path $brand '00_knoux-circular-logo-day.png')}
)
$bk=Join-Path $root ('references_backups\home-logo-before_'+(Get-Date -Format 'yyyyMMdd_HHmmss'))
foreach($f in $files){
 if(Test-Path -LiteralPath $f.Target){
   New-Item -ItemType Directory -Force -Path $bk|Out-Null
   Copy-Item -LiteralPath $f.Target -Destination (Join-Path $bk (Split-Path $f.Target -Leaf)) -ErrorAction Stop
 }
 Copy-Item -LiteralPath $f.Source -Destination $f.Target -Force -ErrorAction Stop
 if((Get-FileHash -LiteralPath $f.Source -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $f.Target -Algorithm SHA256).Hash){throw "COPY HASH MISMATCH: $($f.Target)"}
}
"HOME=$($files[0].Target)"
"LOGO=$($files[1].Target)"
"HOME_SHA="+(Get-FileHash -LiteralPath $files[0].Target -Algorithm SHA256).Hash.ToLowerInvariant()
"LOGO_SHA="+(Get-FileHash -LiteralPath $files[1].Target -Algorithm SHA256).Hash.ToLowerInvariant()
"LOGO_ALPHA_TRANSPARENCY_EXPECTED=TRUE"
"EXISTING_20_REFS_UNTOUCHED=TRUE"