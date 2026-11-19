$path = "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs"
$content = [IO.File]::ReadAllText($path)
# Search for the Unicode escape pattern
$idx = $content.IndexOf("start\u002Fstop")
if ($idx -ge 0) {
    Write-Host "Found at index: $idx"
    Write-Host "Context: " $content.Substring($idx - 20, 80)
} else {
    Write-Host "Not found"
}