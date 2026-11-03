param([string]$Root)
$items = Get-ChildItem -LiteralPath $Root -Directory -Force -ErrorAction SilentlyContinue
$rows = foreach ($d in $items) {
  $m = Get-ChildItem -LiteralPath $d.FullName -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object -Sum Length
  [pscustomobject]@{ MB = [math]::Round(($m.Sum / 1MB), 1); Files = $m.Count; Path = $d.FullName }
}
$rows | Sort-Object -Property MB -Descending | Format-Table -AutoSize | Out-String -Width 200
