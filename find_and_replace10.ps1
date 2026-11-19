$path = "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs"
$content = [IO.File]::ReadAllText($path)
# Check the exact substring at that position
$idx = $content.IndexOf("assert.match(servicesBody, /ServiceStateWorkbench|signed third-party")
Write-Host "Found at: $idx"
Write-Host "Bytes at idx: " ([System.Text.Encoding]::UTF8.GetBytes($content.Substring($idx, 100)) -join ' ')
# Check if it has leading spaces
$lineStart = $content.LastIndexOf("`n", $idx)
if ($lineStart -ge 0) {
    $lineContent = $content.Substring($lineStart + 1, $idx - $lineStart - 1 + 100)
    Write-Host "Line with context: [$lineContent]"
} else {
    Write-Host "No newline found before"
}