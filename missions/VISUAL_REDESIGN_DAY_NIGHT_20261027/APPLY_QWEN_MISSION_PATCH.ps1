$ErrorActionPreference='Stop'
$root='D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\missions\VISUAL_REDESIGN_DAY_NIGHT_20261027'
$backup=Join-Path $root 'BACKUP_BEFORE_QWEN_20261027'
if(-not(Test-Path -LiteralPath $backup)){New-Item -ItemType Directory -Path $backup -Force | Out-Null}
$enc=New-Object System.Text.UTF8Encoding($false)
$tasks=@(
  @{ Name='01_organization-studio.md'; Summary='Preserve existing 3-zone layout. Improve orbit/state and fit; plan preview only; no fake file executor.' },
  @{ Name='02_files-instant-search.md'; Summary='Search/results + selected-file preview must dominate. Orbit is contextual navigation; no covering search.' },
  @{ Name='03_smart-scan.md'; Summary='Fix source selector clipping. Orbital nodes select Quick/Deep/Modules; real native progress only.' },
  @{ Name='04_applications.md'; Summary='Make real installed-app register and selected dossier primary. Never fake uninstall/update.' },
  @{ Name='05_storage.md'; Summary='Volume map, selection, measured inspector first; orbit is exploration filters, not phantom reclaim.' },
  @{ Name='06_cleanup.md'; Summary='Real cleanup discovery/review-only; no fake Safe Reversible or Run Cleanup success.' },
  @{ Name='07_startup.md'; Summary='Autorun register/filters and read-only staging first; no invented boot times or Apply Changes.' },
  @{ Name='08_system.md'; Summary='Real native telemetry and accessible charts; no fake CPU or health data; salvage current System WIP.' },
  @{ Name='09_repair.md'; Summary='Repair uncommitted code must be backed up. Preview/diagnose only; no false DISM/SFC execution.' },
  @{ Name='10_services.md'; Summary='Services unfinished: build actual SCM read-only/register + dependency inspector, contextual orbit. Both themes.' }
)
$n=0
foreach($t in $tasks){
 $file=Join-Path $root $t.Name
 if(-not(Test-Path -LiteralPath $file -PathType Leaf)){throw ('Mission missing: '+$file)}
 $body=[System.IO.File]::ReadAllText($file)
 if($body.Contains('QWEN VISUAL RECOVERY 20261027')){continue}
 $backupFile=Join-Path $backup $t.Name
 if(-not(Test-Path -LiteralPath $backupFile)){Copy-Item -LiteralPath $file -Destination $backupFile}
 $head=@'
# QWEN VISUAL RECOVERY 20261027 — OVERRIDING ADDENDUM
**READ FIRST:** 00_QWEN_VISUAL_RECOVERY_FIRST.md and the matching section of QWEN_PRIORITY_SCREEN_TASKS.md.
The code created by Codex is SALVAGEABLE; continue and polish the current isolated visual branch, preserve uncommitted Repair/System files. The reference DAY screenshot defines structural layout; NIGHT is for palette only when reference layouts disagree.
**ONE shared JSX arrangement** for day + night. Same major cards, tools, order, inspector and orbit destinations.
Target practical Windows design: restrained glow, readable text/cards, no overlap with inputs, correct official logo.
Current native read-only/preview contract wins over any imaginary reference data.
Quick day/night screenshots + compiler/build + commit/push only after screen is stable. No main merge and no reset/clean.
Screen target: 
'@
 $head+= $t.Summary + [Environment]::NewLine+[Environment]::NewLine+'---'+[Environment]::NewLine+[Environment]::NewLine
 [System.IO.File]::WriteAllText($file,$head+$body,$enc)
 $n++
}
'UPDATED='+$n
'BACKUP='+$backup
'QWEN_MASTER='+[bool](Test-Path -LiteralPath (Join-Path $root '00_QWEN_VISUAL_RECOVERY_FIRST.md'))
'QWEN_SPECIFIC='+[bool](Test-Path -LiteralPath (Join-Path $root 'QWEN_PRIORITY_SCREEN_TASKS.md'))
'DAY='+@(Get-ChildItem -LiteralPath (Join-Path $root 'references\day') -Filter '*.png' -File).Count
'NIGHT='+@(Get-ChildItem -LiteralPath (Join-Path $root 'references\night') -Filter '*.png' -File).Count
