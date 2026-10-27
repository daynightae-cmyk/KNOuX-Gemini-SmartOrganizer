# Install KNOuX's day/night reference package safely in the canonical D: missions directory.
# Run with PowerShell after downloading the ZIP; DOES NOT edit product source or merge any branch.
$ErrorActionPreference = 'Stop'
$zipName = 'KNOuX_VISUAL_OVERHAUL_20_REFS_DAY_NIGHT_20261027.zip'
$source = Join-Path $env:USERPROFILE ('Downloads\' + $zipName)
$missions = 'D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\missions'
$dest = Join-Path $missions 'VISUAL_REDESIGN_DAY_NIGHT_20261027'
if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "First download the ZIP to Downloads: $source" }
if (-not (Test-Path -LiteralPath $missions -PathType Container)) { throw "Canonical mission directory does not exist: $missions" }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($source)
try {
  $pngs = @($zip.Entries | Where-Object { $_.FullName -match '/references/(day|night)/.*\.png$' })
  $day = @($pngs | Where-Object { $_.FullName -match '/day/' })
  $night = @($pngs | Where-Object { $_.FullName -match '/night/' })
  if ($pngs.Count -ne 20 -or $day.Count -ne 10 -or $night.Count -ne 10) { throw 'Unexpected archive content; expected 10 day + 10 night PNGs.' }
  foreach ($entry in $zip.Entries) {
    $rel = $entry.FullName.Replace('\','/')
    if (-not $rel.StartsWith('KNOuX_VISUAL_OVERHAUL_20_REFS_DAY_NIGHT_20261027/')) { throw "Unexpected archive path: $rel" }
    $inside = $rel.Substring('KNOuX_VISUAL_OVERHAUL_20_REFS_DAY_NIGHT_20261027/'.Length)
    if ($inside -eq '') { continue }
    $target = [System.IO.Path]::GetFullPath((Join-Path $dest $inside.Replace('/','\')))
    if (-not $target.StartsWith(([System.IO.Path]::GetFullPath($dest).TrimEnd('\') + '\'),[System.StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe archive path: $rel" }
    if ($entry.Name -eq '') { [void](New-Item -ItemType Directory -Path $target -Force); continue }
    $parent = Split-Path -Parent $target
    [void](New-Item -ItemType Directory -Path $parent -Force)
    if (Test-Path -LiteralPath $target) { throw "Existing file; refusing overwrite: $target" }
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$target,$false)
  }
}
finally { $zip.Dispose() }
Write-Host "Done: $dest"
Write-Host '20 images installed under references\night and references\day; task 00 is first.'
