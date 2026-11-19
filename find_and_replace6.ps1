$path = "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs"
$content = [IO.File]::ReadAllText($path)
# Get the exact line
$lines = $content.Split("`n")
$line = $lines[248]
Write-Host "Line 248: [$line]"
Write-Host "Length: " $line.Length
# Show bytes
$bytes = [System.Text.Encoding]::UTF8.GetBytes($line)
Write-Host "Bytes: " ($bytes -join ' ')
# Check for the exact pattern
$pattern = "assert.match(servicesBody, /ServiceStateWorkbench|signed third-party start/stop only/);"
Write-Host "Pattern: [$pattern]"
Write-Host "Pattern length: " $pattern.Length
Write-Host "Line equals pattern: " ($line -eq $pattern)