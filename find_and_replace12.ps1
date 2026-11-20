$path = "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs"
$content = [IO.File]::ReadAllText($path)
# Search for the exact pattern without the leading assert.match
$search = "/ServiceStateWorkbench|signed third-party start\/stop only/"
$idx = $content.IndexOf($search)
if ($idx -ge 0) {
    Write-Host "Found at: $idx"
    Write-Host "Context: " $content.Substring($idx - 10, 80)
} else {
    Write-Host "Not found"
    # Try with escaped slash
    $search2 = "/ServiceStateWorkbench|signed third-party start/stop only/"
    $idx2 = $content.IndexOf($search2)
    if ($idx2 -ge 0) {
        Write-Host "Found with unescaped slash at: $idx2"
        Write-Host "Context: " $content.Substring($idx2 - 10, 80)
    } else {
        Write-Host "Also not found"
    }