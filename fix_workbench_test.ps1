$path = "D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\apps\gemini-ui\scripts\workbench-host-test.cjs"
$content = [IO.File]::ReadAllText($path)
$old = 'assert.match(servicesBody, /ServiceStateWorkbench|signed third-party start/stop only/);'
$new = 'assert.match(servicesBody, /ServiceStateWorkbench|signed third-party start/stop/restart/);'
$content = $content.Replace($old, $new)
[IO.File]::WriteAllText($path, $content)