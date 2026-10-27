# KNOuX visual references installation — safe, standalone; does not touch application source.
$ErrorActionPreference='Stop'
$root='D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\missions'
$archive=Join-Path $env:USERPROFILE 'Downloads\KNOuX_VISUAL_OVERHAUL_20_REFS_DAY_NIGHT_20261027.zip'
$staging=Join-Path $root 'KNOuX_VISUAL_OVERHAUL_20_REFS_DAY_NIGHT_20261027'
$target=Join-Path $root 'VISUAL_REDESIGN_DAY_NIGHT_20261027'
if(-not(Test-Path -LiteralPath $archive -PathType Leaf)){throw "Download the package into Downloads first: $archive"}
if((Test-Path -LiteralPath $staging) -or (Test-Path -LiteralPath $target)){throw 'Target or staging folder already exists: no overwrite attempted'}
Expand-Archive -LiteralPath $archive -DestinationPath $root -ErrorAction Stop
$day= @(Get-ChildItem -LiteralPath (Join-Path $staging 'references\day') -Filter '*.png' -File)
$night= @(Get-ChildItem -LiteralPath (Join-Path $staging 'references\night') -Filter '*.png' -File)
if($day.Count -ne 10 -or $night.Count -ne 10){throw 'Incomplete reference package. Aborted before final rename.'}
Move-Item -LiteralPath $staging -Destination $target
Write-Host "DONE: $target"
Write-Host "Verified $($day.Count) day and $($night.Count) night reference images."
Write-Host 'Begin with 00_merge-codex-entry-branch-first.md on an isolated visual feature branch; do not merge into main while Qoder is active.'
