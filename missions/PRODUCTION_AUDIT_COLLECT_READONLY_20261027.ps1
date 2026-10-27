# KNOuX production readiness read-only collector. DO NOT edit application code, evidence or Git.
$ErrorActionPreference='Stop'
$repo='D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer'
$mission=Join-Path $repo 'missions'
$app=Join-Path $repo 'apps\gemini-ui'
$vf=Join-Path $mission 'VISUAL_REDESIGN_DAY_NIGHT_20261027'
$evidence=Join-Path $repo 'docs\evidence\visual-sprint'
$summaryFile=Join-Path $app 'visual-evidence\platform-00\native-smoke-summary-dev.json'
$summary=Get-Content -LiteralPath $summaryFile -Raw | ConvertFrom-Json
$failed=@(); $passed=@()
foreach($q in $summary.checks.PSObject.Properties) { if($q.Value -eq $false){$failed+= $q.Name}else{ if($q.Value -eq $true){$passed+=$q.Name}} }
$missionRows=@{}
foreach($f in @(Get-ChildItem -LiteralPath $mission -Filter '*FULLSTACK_MISSION.md' -File)) {
 $txt=Get-Content -LiteralPath $f.FullName -Raw
 $sections=@([regex]::Matches($txt,'(?m)^###\s+\d+\.\s+')).Count
 $missionRows[$f.Name]=$sections
}
$matrixFile=Join-Path $repo 'docs\SERVICE_CAPABILITY_MATRIX.md'
$matrix=Get-Content -LiteralPath $matrixFile
$matrixRows=@($matrix|Where-Object {$_ -match '^\|\s*(0[1-9]|1[0-4])\s*\|'}).Count
$wbFile=Join-Path $repo 'docs\SERVICE_WORKBENCH_ACCEPTANCE.md'
$wb=Get-Content -LiteralPath $wbFile
$wbRows=@($wb|Where-Object {$_ -match '^\|\s*(0[1-9]|1[0-4])\s*\|'}).Count
$wbStatuses=@{}
foreach($status in @('AUDIT_REQUIRED','MEASURED_READ_ONLY','PARTIAL','BLOCKED','CONNECTABLE_AWAITING_CONSENT','IMPLEMENTED_AND_TESTED','UNSUPPORTED')) {
 $wbStatuses[$status]=@($wb|Where-Object {$_ -match '^\|\s*(0[1-9]|1[0-4])\s*\|' -and $_ -match ('\|\s*'+$status+'\s*\|\s*$')}).Count
}
$refInventory=@{}
foreach($kind in @('day','night','brand')){
 $refInventory[$kind]=@(Get-ChildItem -LiteralPath (Join-Path $vf "references\$kind") -Filter '*.png' -File -ErrorAction SilentlyContinue|Select-Object -ExpandProperty Name)
}
$checks=@{}
foreach($name in @('home','studio','files','smart_scan','applications','storage','cleanup','startup','system','repair','services','automation')){
 $f=Join-Path $evidence "$name\preview.json"
 if(!(Test-Path -LiteralPath $f)){$checks[$name]=@{state='MISSING';rows=0};continue}
 try {
  $rows=ConvertFrom-Json -InputObject ([IO.File]::ReadAllText($f))
  $badCount=0; $visibleCount=0
  foreach($row in $rows){
   if($row.errors.Count -gt 0 -or $row.horizontalOverflow -eq $true -or $row.coveredFields.Count -gt 0 -or $row.clippedPanels.Count -gt 0){$badCount++}
   if($row.orbit -and $row.orbit.visible -eq $true){$visibleCount++}
  }
  $checks[$name]=@{state='FILE_PRESENT';rows=$rows.Length;simpleRenderFailures=$badCount;orbitVisibleRows=$visibleCount}
 }catch {$checks[$name]=@{state='INVALID_JSON';rows=0;error=$_.Exception.Message}}
}
$gitState=git -C $repo status --porcelain=v1
$modSources=@($gitState|Where-Object {$_ -match '^\s*M\s+(apps/gemini-ui/src/|apps/gemini-ui/electron/|apps/gemini-ui/scripts/)'}).Count
$modEvidence=@($gitState|Where-Object {$_ -match '^.M\s+.*(\.png|\.json)$'}).Count
$worktrees=@(git -C $repo worktree list)
$builder=Join-Path $app 'electron-builder.config.cjs'
$buildConfig= if(Test-Path -LiteralPath $builder){Get-Content -LiteralPath $builder -Raw}else{'MISSING'}
$generated = [ordered]@{
 generatedAtUtc=(Get-Date).ToUniversalTime().ToString('o')
 disclaimer='Read-only point-in-time filesystem/receipts audit. No tests executed by collector; historical evidence does not imply current run passes.'
 repo=$repo
 branch=(git -C $repo branch --show-current)
 commit=(git -C $repo rev-parse HEAD)
 remote=(git -C $repo remote get-url origin)
 dirtyTrackedSourceCount=$modSources
 modifiedEvidenceCount=$modEvidence
 totalGitStatusRows=@($gitState).Count
 worktrees=$worktrees
 missions=@{missionHeadingCounts=$missionRows;advertisedMatrixRows=$matrixRows;workbenchRows=$wbRows;workbenchStates=$wbStatuses}
 visual=@{referenceFiles=$refInventory;currentEvidenceReports=$checks}
 nativeSmoke=@{startedAt=$summary.startedAt;finishedAt=$summary.finishedAt;exitCode=$summary.exitCode;receiptOk=$summary.receiptOk;passedChecks=$passed;failedChecks=$failed}
 package=@{configExists=(Test-Path $builder);signingConfigMentioned=[bool]($buildConfig -match 'sign|certificate|publisher');packagedOutputExists=(Test-Path (Join-Path $app 'release'));appVersion='0.4.0-gemini.0'}
 }
$out=Join-Path $mission 'PRODUCTION_AUDIT_SNAPSHOT_20261027.json'
[IO.File]::WriteAllText($out,($generated|ConvertTo-Json -Depth 15),[Text.UTF8Encoding]::new($false))
Write-Output ("AUDIT_WRITTEN="+$out)
Write-Output ("BRANCH="+$generated.branch+" HEAD="+$generated.commit)
Write-Output ("MATRIX_ROWS="+$matrixRows+" WORKBENCH_ROWS="+$wbRows+" MISSION_FILES="+$missionRows.Count)
Write-Output ("SMOKE_EXIT="+$summary.exitCode+" FAILED_CHECKS="+($failed -join ','))
Write-Output ("REPORT_COUNT="+$checks.Count+" GITSTATUS_ROWS="+$generated.totalGitStatusRows)
