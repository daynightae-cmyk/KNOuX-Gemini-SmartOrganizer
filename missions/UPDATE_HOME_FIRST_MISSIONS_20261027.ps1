$ErrorActionPreference='Stop'
$d='D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\missions\VISUAL_REDESIGN_DAY_NIGHT_20261027'
$enc=New-Object System.Text.UTF8Encoding($false)
$manifestPath=Join-Path $d 'REFERENCES_MANIFEST.json'
$manifest=Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$backupRoot=Join-Path $d 'references_backups\mission_docs_before_home_20261027'
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
if(-not(Test-Path -LiteralPath (Join-Path $backupRoot 'REFERENCES_MANIFEST.json'))){Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $backupRoot 'REFERENCES_MANIFEST.json')}
$specs=@(
 @{File='references/day/00_home-command-center.png';Route='home';Theme='day';Section='Home Command Center';Kind='approved new daylight Home reference; FIRST priority';W=1672;H=941},
 @{File='references/brand/00_knoux-circular-logo-day.png';Route='shared-brand';Theme='brand';Section='KNOuX Circular Logo';Kind='transparent circular logo without square frame; use with DAY Home';W=1254;H=1254}
)
foreach($spec in $specs){
 $path=Join-Path $d ($spec.File.Replace('/','\'))
 if(-not(Test-Path -LiteralPath $path)){throw "Missing asset: $path"}
 $hash=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
 if(@($manifest.images|Where-Object {$_.file -eq $spec.File}).Count -eq 0){
  $o=[pscustomobject][ordered]@{order=0;theme=$spec.Theme;section=$spec.Section;route=$spec.Route;file=$spec.File;sha256=$hash;width=$spec.W;height=$spec.H;kind=$spec.Kind}
  $manifest.images=@($manifest.images)+@($o)
 } else {
  foreach($e in @($manifest.images|Where-Object {$_.file -eq $spec.File})){$e.sha256=$hash}
 }
}
$manifest.note='2026-10-27: 10 DAY orbit + 10 NIGHT section pairs; new DAY HOME reference and transparent circular BRAND logo installed from Downloads. HOME FIRST, then Codex rescue tasks 01..10. Day/night same real JSX. Dark Home screenshot is in user chat, not installed as a night PNG. Numbers in concept images illustrative only.'
[System.IO.File]::WriteAllText($manifestPath,($manifest|ConvertTo-Json -Depth 14),$enc)
$hdr=@'
# 2026-10-27 OWNER PRIORITY OVERRIDE — HOME + ROUND LOGO FIRST
Read 00_START_HOME_FIRST_QWEN.md, 00_HOME_FIRST_IMPLEMENTATION.md, and 00_BRAND_CIRCULAR_LOGO.md. Two new assets are installed locally at references/day/00_home-command-center.png and references/brand/00_knoux-circular-logo-day.png. Preserve current Codex WIP. Implement HOME day/night as the SAME semantic layout, integrate transparent circular logo without square framing, then screenshot/build/commit/push HOME. Only THEN continue the ten original visual recovery screens 01..10. The old 01-first or cinematic-first instruction is superseded for this already-active visual branch. No ref regeneration needed; no auto-merge to main; no new native executors.

---

'@
$names=@('00_START_QWEN_HERE.md','00_QWEN_VISUAL_RECOVERY_FIRST.md','START_VISUAL_NOW.md','00_FAST_TRACK_VISUAL_SPRINT.md','00_MASTER_VISUAL_DIRECTIVE.md','QWEN_PRIORITY_SCREEN_TASKS.md')
foreach($name in $names){
 $path=Join-Path $d $name
 if(-not(Test-Path -LiteralPath $path)){throw "Missing mission: $name"}
 $s=[System.IO.File]::ReadAllText($path)
 if(-not($s.StartsWith('# 2026-10-27 OWNER PRIORITY OVERRIDE'))){
  if(-not(Test-Path -LiteralPath (Join-Path $backupRoot $name))){Copy-Item -LiteralPath $path -Destination (Join-Path $backupRoot $name)}
  [System.IO.File]::WriteAllText($path,$hdr+$s,$enc)
 }
}
Write-Output ('MANIFEST_ENTRIES='+$manifest.images.Count)
Write-Output ('HOME_ENTRY='+@($manifest.images|Where-Object {$_.file -eq 'references/day/00_home-command-center.png'}).Count)
Write-Output ('LOGO_ENTRY='+@($manifest.images|Where-Object {$_.file -eq 'references/brand/00_knoux-circular-logo-day.png'}).Count)
Write-Output ('MISSION_OVERRIDES='+$names.Count)
Write-Output ('BACKUP='+$backupRoot)
