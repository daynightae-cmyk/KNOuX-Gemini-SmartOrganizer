$path = "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs"
$content = [IO.File]::ReadAllText($path)
# The exact string found in the file
$old = 'signed third-party start\/stop only/'
$new = 'signed third-party start/stop/restart/'
if ($content.Contains($old)) {
    $content = $content.Replace($old, $new)
    [IO.File]::WriteAllText($path, $content)
    Write-Host "Replaced successfully"
} else {
    Write-Host "Old pattern not found"
}