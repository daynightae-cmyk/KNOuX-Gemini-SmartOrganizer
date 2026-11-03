param(
  [Parameter(Mandatory = $true)][string]$ListFile,
  [string]$AllowedPrefix = 'D:\KNOUX-Workspace\'
)
# Guarded batch delete. Every target must be an explicit existing directory under
# the reviewed prefix, must contain no reparse point that escapes that prefix, and
# is removed with the extended-length path so MAX_PATH cannot truncate the sweep.
$ErrorActionPreference = 'Stop'
$targets = Get-Content -LiteralPath $ListFile | Where-Object { $_.Trim() -ne '' } | ForEach-Object { $_.Trim() }
$prefixFull = (Resolve-Path -LiteralPath $AllowedPrefix).Path.TrimEnd('\')
$totalBytes = 0
$totalFiles = 0
$report = @()

foreach ($t in $targets) {
  $resolved = (Resolve-Path -LiteralPath $t).Path.TrimEnd('\')
  if (-not $resolved.StartsWith($prefixFull + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
    $report += "BLOCKED-PATH  $resolved"
    continue
  }
  if (-not (Test-Path -LiteralPath $resolved)) { $report += "MISSING  $resolved"; continue }

  $kids = Get-ChildItem -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue
  $escaping = 0
  foreach ($k in $kids) {
    if (($k.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
      $ok = $true
      try { foreach ($tg in @($k.Target)) { if ($tg -and -not ([System.IO.Path]::GetFullPath($tg)).StartsWith($prefixFull, [System.StringComparison]::OrdinalIgnoreCase)) { $ok = $false } } } catch { $ok = $false }
      if (-not $ok) { $escaping += 1 }
    }
  }
  if ($escaping -gt 0) { $report += "BLOCKED-REPARSE($escaping)  $resolved"; continue }

  $measure = Get-ChildItem -LiteralPath $resolved -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object -Sum Length
  $bytes = [int64]$measure.Sum
  $count = [int]$measure.Count

  $null = & cmd.exe /c "rmdir /s /q `"\\?\$resolved`""
  if (Test-Path -LiteralPath $resolved) {
    $report += "FAILED-RESIDUAL  $resolved"
  } else {
    $totalBytes += $bytes
    $totalFiles += $count
    $report += ("DELETED  {0,9:N1} MB  {1,6} files  {2}" -f ($bytes / 1MB), $count, (Split-Path $resolved -Leaf))
  }
}

$report
""
("TOTAL RECLAIMED: {0:N1} MB  ({1:N0} bytes, {2} files)" -f ($totalBytes / 1MB), $totalBytes, $totalFiles)
$drive = New-Object System.IO.DriveInfo(($prefixFull.Substring(0, 1)))
("FREE NOW ON {0}: {1:N2} GB" -f $drive.Name, ($drive.AvailableFreeSpace / 1GB))
