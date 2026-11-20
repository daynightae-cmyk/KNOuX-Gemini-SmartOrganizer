$path = "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs"
$content = [IO.File]::ReadAllText($path)
$old = '  assert.match(servicesBody, /ServiceStateWorkbench|signed third-party start/stop only/);'
$new = '  assert.match(servicesBody, /ServiceStateWorkbench|signed third-party start/stop/restart/);'
if ($content.Contains($old)) {
    $content = $content.Replace($old, $new)
    [IO.File]::WriteAllText($path, $content)
    Write-Host "Replaced successfully"
} else {
    Write-Host "Old pattern not found"
    # Debug: show what we're looking for vs what's in content
    $idx = $content.IndexOf("assert.match(servicesBody, /ServiceStateWorkbench|signed third-party")
    if ($idx -ge 0) {
        Write-Host "Found at index: $idx"
        Write-Host "Context: " $content.Substring($idx, 100)
    } else {
        Write-Host "Substring not found either"
    }
}