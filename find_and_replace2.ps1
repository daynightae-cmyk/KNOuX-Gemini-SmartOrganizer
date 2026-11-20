$path = "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs"
$content = [IO.File]::ReadAllText($path)
# Find the exact line with "start/stop"
$idx = $content.IndexOf("start/stop")
if ($idx -ge 0) {
    Write-Host "Found at index: $idx"
    Write-Host "Context: " $content.Substring($idx - 10, 80)
    # Try to find the full pattern
    $fullPattern = "signed third-party start/stop only"
    $idx2 = $content.IndexOf($fullPattern)
    if ($idx2 -ge 0) {
        Write-Host "Full pattern found at: $idx2"
    } else {
        Write-Host "Full pattern NOT found"
    }
} else {
    Write-Host "start/stop not found"
}