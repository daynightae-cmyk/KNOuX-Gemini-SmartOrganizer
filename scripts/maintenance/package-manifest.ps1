param(
  [string]$Root = 'D:\KNOUX-Workspace',
  [string]$Pattern = 'KNOuX_STUDIO_*'
)
$dirs = Get-ChildItem -LiteralPath $Root -Directory -Force -Filter $Pattern -ErrorAction SilentlyContinue
foreach ($d in $dirs) {
  $asar = Join-Path $d.FullName 'win-unpacked\resources\app.asar'
  $exe  = Join-Path $d.FullName 'win-unpacked\KNOuX Smart Gemini Preview.exe'
  $files = Get-ChildItem -LiteralPath $d.FullName -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object -Sum Length
  $mb = [math]::Round($files.Sum / 1MB, 1)
  if (Test-Path -LiteralPath $asar) {
    $h = (Get-FileHash -LiteralPath $asar -Algorithm SHA256).Hash.Substring(0, 16)
    $exeHash = if (Test-Path -LiteralPath $exe) { (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.Substring(0, 8) } else { 'n/a' }
    "{0,9:N1} MB  asar={1}  exe={2}  {3}" -f $mb, $h, $exeHash, $d.Name
  } else {
    $h = (Get-FileHash -LiteralPath ($d.FullName + '\__none__') -Algorithm SHA256 -ErrorAction SilentlyContinue)
    "{0,9:N1} MB  asar=NONE                  {1}" -f $mb, $d.Name
  }
}
