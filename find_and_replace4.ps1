$path = "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs"
$content = [IO.File]::ReadAllText($path)
$lines = $content.Split("`n")
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "start" -and $lines[$i] -match "stop") {
        Write-Host ("Line {0}: {1}" -f $i, $lines[$i].Trim())
    }
}