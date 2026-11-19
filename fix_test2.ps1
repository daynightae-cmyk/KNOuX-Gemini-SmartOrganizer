$content = Get-Content "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs" -Raw
$old = 'assert.match(servicesBody, /ServiceStateWorkbench|signed third-party start/stop only/);'
$new = 'assert.match(servicesBody, /ServiceStateWorkbench|signed third-party start/stop/restart/);'
$content = $content -replace [regex]::Escape($old), $new
Set-Content "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs" -Value $content