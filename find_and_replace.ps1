$path = "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs"
$content = [IO.File]::ReadAllText($path)
# Find the exact line
$idx = $content.IndexOf("signed third-party start/stop only")
if ($idx -ge 0) {
    Write-Host "Found at index: $idx"
    Write-Host "Context: " $content.Substring($idx, 60)
    $content = $content.Replace("signed third-party start/stop only", "signed third-party start/stop/restart")
    [IO.File]::WriteAllText("D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs", $content)
    Write-Host "Replaced successfully"
} else {
    Write-Host "Not found"
}