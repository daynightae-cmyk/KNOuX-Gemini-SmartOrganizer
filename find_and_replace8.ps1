$path = "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs"
$content = [IO.File]::ReadAllText($path)
# Get the exact line
$lines = $content.Split("`n")
$line = $lines[248]
Write-Host "Line 248: [$line]"
Write-Host "Length: " $line.Length
# Show first 10 chars as hex
$bytes = [System.Text.Encoding]::UTF8.GetBytes($line.Substring(0, 10))
Write-Host "First 10 bytes: " ($bytes -join ' ')
# Check if it starts with two spaces
Write-Host "Starts with two spaces: " $line.StartsWith("  ")