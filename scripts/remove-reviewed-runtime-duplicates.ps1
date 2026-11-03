param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$root = 'D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer'
$retained = Join-Path $root 'apps\gemini-ui\node_modules\electron\dist'
$targets = @(
 'D:\KNOUX-Workspace\KNOuX_ANIMA_V0_INTEGRATION_20261030_062624\package-final\win-unpacked',
 'D:\KNOUX-Workspace\KNOuX_STUDIO_FULLSTACK_PACKAGE_20261028_1120\win-unpacked'
)
$before = (Get-PSDrive D).Free
$processes = @(Get-CimInstance Win32_Process | Select-Object -ExpandProperty CommandLine)
$entries = @()
foreach ($target in $targets) {
 if (!(Test-Path -LiteralPath $target)) { continue }
 $resolved = (Resolve-Path -LiteralPath $target).Path.TrimEnd('\')
 if ($resolved -cne $target) { throw "Unexpected resolved path: $resolved" }
 $cursor = Get-Item -LiteralPath $resolved -Force
 while ($cursor) {
  if ($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse ancestor: $($cursor.FullName)" }
  $cursor = $cursor.Parent
 }
 if (@($processes | Where-Object { $_ -and $_.IndexOf($target,[StringComparison]::OrdinalIgnoreCase) -ge 0 }).Count) { throw "Runtime still in use: $target" }
 $queue = [Collections.Generic.Queue[string]]::new(); $queue.Enqueue($resolved)
 while ($queue.Count) {
  foreach ($item in Get-ChildItem -LiteralPath $queue.Dequeue() -Force) {
   if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse target: $($item.FullName)" }
   if ($item.PSIsContainer) { $queue.Enqueue($item.FullName); continue }
   if ($item.Extension -notin @('.dll','.bin','.pak','.dat','.exe','.so')) { continue }
   $relative = $item.FullName.Substring($resolved.Length+1)
   $keeper = Join-Path $retained $relative
   if (!(Test-Path -LiteralPath $keeper -PathType Leaf)) { continue }
   $kept = Get-Item -LiteralPath $keeper
   if ($kept.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse keeper: $keeper" }
   if ($kept.Length -ne $item.Length) { continue }
   $hash = (Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash
   if ($hash -ne (Get-FileHash -LiteralPath $keeper -Algorithm SHA256).Hash) { continue }
   $entry = [ordered]@{path=$item.FullName;retained=$keeper;sha256=$hash;bytes=$item.Length;deleted=$false}
   if ($Apply) {
    Remove-Item -LiteralPath $item.FullName -Force
    if (Test-Path -LiteralPath $item.FullName) { throw "Deletion postcondition failed: $($item.FullName)" }
    $entry.deleted = $true
   }
   $entries += [pscustomobject]$entry
  }
 }
}
$report = [ordered]@{applied=[bool]$Apply;beforeFreeBytes=$before;afterFreeBytes=(Get-PSDrive D).Free;files=$entries.Count;logicalBytes=($entries | Measure-Object bytes -Sum).Sum;entries=$entries;protected='All inner-workspaces-20261102 content, app.asar, owner references, source, credentials, journals and active C runtime were excluded.'}
$path = Join-Path $root ('docs\evidence\consolidation-20261103\runtime-cleanup-' + $(if($Apply){'result'}else{'plan'}) + '.json')
$report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $path -Encoding utf8
[pscustomobject]$report | Select-Object applied,beforeFreeBytes,afterFreeBytes,files,logicalBytes | ConvertTo-Json
