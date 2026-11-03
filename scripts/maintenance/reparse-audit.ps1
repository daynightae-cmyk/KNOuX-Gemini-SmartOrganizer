param(
  [string]$Root = 'D:\KNOUX-Workspace',
  [string]$Pattern = 'KNOuX_STUDIO_*'
)
# Refuse to delete anything whose resolved target escapes the reviewed root.
$rootFull = (Resolve-Path -LiteralPath $Root).Path.TrimEnd('\')
$dirs = Get-ChildItem -LiteralPath $Root -Directory -Force -Filter $Pattern -ErrorAction SilentlyContinue
foreach ($d in $dirs) {
  $reparse = Get-ChildItem -LiteralPath $d.FullName -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { ($_.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0 }
  $outside = @()
  foreach ($r in $reparse) {
    try {
      $target = $r.Target
      if ($target) {
        foreach ($t in @($target)) {
          $resolved = [System.IO.Path]::GetFullPath($t)
          if (-not $resolved.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) { $outside += "$r -> $resolved" }
        }
      }
    } catch { $outside += "UNRESOLVABLE $($r.FullName)" }
  }
  "{0}  reparse={1}  escaping={2}" -f $d.Name, @($reparse).Count, @($outside).Count
  foreach ($o in $outside) { "    ESCAPES: $o" }
}
