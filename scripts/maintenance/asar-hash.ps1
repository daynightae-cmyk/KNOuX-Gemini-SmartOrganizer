param([string[]]$Paths)
foreach ($p in $Paths) {
  if (-not (Test-Path -LiteralPath $p)) { "MISSING  $p"; continue }
  $asar = Join-Path $p 'win-unpacked\resources\app.asar'
  if (Test-Path -LiteralPath $asar) {
    $h = (Get-FileHash -LiteralPath $asar -Algorithm SHA256).Hash.Substring(0, 16)
    $len = [math]::Round((Get-Item -LiteralPath $asar).Length / 1MB, 2)
    "ASAR $h  ${len}MB  $p"
  } else {
    "NO-ASAR        $p"
  }
}
