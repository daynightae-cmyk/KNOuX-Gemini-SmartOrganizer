$path = "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs"
$content = [IO.File]::ReadAllText($path)
# Search for "signed third-party" in the content
$idx = $content.IndexOf("signed third-party")
if ($idx -ge 0) {
    Write-Host "Found at: $idx"
    Write-Host "Context: " $content.Substring($idx - 5, 100)
    # Show bytes
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content.Substring($idx, 50))
    Write-Host "Bytes: " ($bytes -join ' ')
} else {
    Write-Host "Not found"
}