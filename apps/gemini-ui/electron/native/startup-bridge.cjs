'use strict';

/**
 * KNOuX Gemini - read-only Boot Control coordinator (Mission 09).
 *
 * One bounded measured scan feeds all twelve startup services:
 *   - HKCU/HKLM Run, RunOnce and WOW6432Node autorun values
 *   - per-user and all-users Startup folders (shortcuts resolved read-only)
 *   - Task Scheduler logon/boot tasks
 *   - automatic and delayed-auto Windows services
 *   - Windows boot diagnostics events and last-boot evidence
 * plus an immutable staged-change plan and a measured report.
 *
 * There is deliberately NO registry write, file move, task change, service
 * change or elevation channel. Every enable/disable/delay/restore action is
 * returned as a review plan with `execution.available:false`. No boot second
 * is invented: only Windows boot diagnostics events are reported.
 */

const crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

const CONTRACT = 'startup.v1';
const MAX_ENTRIES = 600;
const MAX_SERVICES = 400;
const MAX_TASKS = 300;
const MAX_BOOT_EVENTS = 40;
const MAX_PLAN_ITEMS = 120;
const MAX_SIGNATURE_PATHS = 32;
const MAX_SESSIONS = 4;
const DEFAULT_SCAN_TIMEOUT_MS = 75000;
const POWER_SHELL_TIMEOUT_MS = 30000;
const SIGNATURE_TIMEOUT_MS = 30000;
const PROCESS_TIMEOUT_MS = 15000;
const SIGNATURE_CACHE_MS = 5 * 60 * 1000;

const STAGE_DEFINITIONS = Object.freeze([
  { key: 'registry', labelEn: 'Registry autoruns', labelAr: 'مداخل التسجيل' },
  { key: 'folders', labelEn: 'Startup folders', labelAr: 'مجلدات البدء' },
  { key: 'tasks', labelEn: 'Logon tasks', labelAr: 'مهام تسجيل الدخول' },
  { key: 'services', labelEn: 'Boot services', labelAr: 'خدمات الإقلاع' },
  { key: 'boot', labelEn: 'Boot diagnostics', labelAr: 'تشخيص الإقلاع' },
]);

const SERVICE_DEFINITIONS = Object.freeze([
  { id: 'startup-overview', labelEn: 'Windows Boot Autorun Register', labelAr: 'سجل بدء تشغيل Windows', state: 'available', provider: 'Registry + Startup folders + logon tasks', noteEn: 'Measured autorun entries and the Windows startup sequence. Nothing is toggled.', noteAr: 'مداخل بدء مقيسة وتسلسل إقلاع Windows. لا يُغيَّر أي شيء.' },
  { id: 'startup-disable', labelEn: 'Autorun State Change Preview', labelAr: 'معاينة تعطيل بدء التشغيل', state: 'partial', provider: 'Immutable plan preview', noteEn: 'Stages an immutable disable review with protected-item and elevation checks.', noteAr: 'يُعدّ مراجعة تعطيل ثابتة مع فحص العناصر المحمية ورفع الصلاحيات.' },
  { id: 'startup-restore', labelEn: 'Startup Restoration & Rollback', labelAr: 'استعادة بدء التشغيل', state: 'gated', provider: 'Local change journal reader', noteEn: 'No startup change has been made, so no restoration entry exists yet.', noteAr: 'لم يُجرَ أي تغيير على بدء التشغيل، لذا لا يوجد مدخل استعادة بعد.' },
  { id: 'startup-sources', labelEn: 'Autorun Source Coverage Map', labelAr: 'خريطة مصادر البدء', state: 'available', provider: 'Per-source measured coverage', noteEn: 'Shows exactly which registry keys, folders, tasks and services were read.', noteAr: 'يُظهر مفاتيح التسجيل والمجلدات والمهام والخدمات التي قُرئت بدقة.' },
  { id: 'startup-journal', labelEn: 'Startup Change Audit Journal', labelAr: 'سجل تغييرات البدء', state: 'gated', provider: 'Append-only journal (no writes yet)', noteEn: 'The journal is empty because Mission 09 never mutates startup state.', noteAr: 'السجل فارغ لأن المهمة 09 لا تغيّر حالة بدء التشغيل إطلاقًا.' },
  { id: 'startup-filter', labelEn: 'Keyboard-First Autorun Query Console', labelAr: 'مستشار تصفية البدء', state: 'available', provider: 'Measured entry query', noteEn: 'Filters the measured register by name, source, scope, state and signature.', noteAr: 'يُرشّح السجل المقيس بالاسم والمصدر والنطاق والحالة والتوقيع.' },
  { id: 'startup-impact', labelEn: 'Boot Sequence Impact Timeline', labelAr: 'أثر تسلسل الإقلاع', state: 'partial', provider: 'Windows Diagnostics-Performance events', noteEn: 'Boot diagnostics events are measured; per-entry seconds are not invented.', noteAr: 'أحداث تشخيص الإقلاع مقيسة؛ لا تُختلق ثوانٍ لكل مدخل.' },
  { id: 'startup-services', labelEn: 'Service Boot Policy Matrix', labelAr: 'مصفوفة خدمات البدء', state: 'partial', provider: 'Win32_Service automatic/delayed', noteEn: 'Reads automatic and delayed-auto services; service policy changes are gated.', noteAr: 'يقرأ الخدمات التلقائية والمؤجلة؛ تغيير سياسة الخدمة محجوب.' },
  { id: 'startup-tasks', labelEn: 'Logon Scheduled Task Timeline', labelAr: 'مهام تسجيل الدخول', state: 'partial', provider: 'Get-ScheduledTask logon/boot triggers', noteEn: 'Reads task triggers and run history; disabling a task is gated.', noteAr: 'يقرأ محفزات المهام وسجل تشغيلها؛ تعطيل المهمة محجوب.' },
  { id: 'startup-delay', labelEn: 'Delayed Launch Planner', labelAr: 'مخطط التأخير', state: 'partial', provider: 'Draft delay plan', noteEn: 'Drafts delay offsets only where the source supports scheduling. No shim is written.', noteAr: 'يصوغ إزاحات تأخير فقط حيث يدعم المصدر الجدولة. لا يُكتب أي غلاف.' },
  { id: 'startup-batch', labelEn: 'Autorun Batch Staging Tray', labelAr: 'دفعة بدء التشغيل', state: 'partial', provider: 'Immutable batch plan', noteEn: 'Builds an immutable batch review with source and rights evidence.', noteAr: 'يبني مراجعة دفعة ثابتة مع أدلة المصدر والصلاحيات.' },
  { id: 'startup-undo-all', labelEn: 'Batch Recovery & Mass Rollback', labelAr: 'التراجع الجماعي', state: 'gated', provider: 'Journal session reader', noteEn: 'No batch session exists because no startup change was executed.', noteAr: 'لا توجد جلسة دفعة لأن أي تغيير في بدء التشغيل لم يُنفَّذ.' },
]);

const GATED_OPERATIONS = Object.freeze([
  { id: 'startup.mutate', mission: '09', title: 'Enable, disable or delay a startup entry', reason: 'Requires an approved immutable plan, per-entry consent, preserved original value/ACL evidence, postcondition verification, a change journal and a tested restore path. Mission 09 ships the read-only evidence and plan only.' },
  { id: 'startup.registry.write', mission: '09', title: 'Write HKCU/HKLM Run values', reason: 'Direct registry mutation is not exposed. A future executor must snapshot the exact value and ACL, reject protected system components and verify the new state.' },
  { id: 'startup.task.change', mission: '09', title: 'Disable or delay a scheduled task', reason: 'Task Scheduler changes can affect security and maintenance jobs. They require explicit approval and belong behind a separate task-mutation capability.' },
  { id: 'startup.service.policy', mission: '12', title: 'Change a service start policy', reason: 'Service start-mode and delayed-auto changes belong to Mission 12 Services with elevation and dependency checks.' },
  { id: 'startup.journal.write', mission: '09', title: 'Append a startup change journal entry', reason: 'The journal is append-only and only an approved executor may write it. No write channel exists in this delivery.' },
  { id: 'startup.restore', mission: '09', title: 'Restore a startup change', reason: 'Restoration must verify the original registry value, ACL and task definition before writing anything. No journal entry exists to restore.' },
]);

const PROTECTED_SERVICE = /^(windefend|wdnissvc|sense|securityhealthservice|wscsvc|msmpeng|trustedinstaller|wuauserv|cryptsvc|rpcss|dcomlaunch|plugplay|power|appinfo|bits)$/i;
const PROTECTED_TASK_PATH = /^\\Microsoft\\Windows\\/i;
const PROTECTED_COMMAND = /(securityhealth|windefend|msmpeng|sense\.exe|wscsvc|winlogon|lsass|csrss|smss|services\.exe|svchost\.exe|antimalware|defender)/i;
const SYSTEM_ROOT_COMMAND = /^[a-z]:\\windows\\system32\\/i;

function startupError(code, message, { retryable = false } = {}) {
  const error = new Error(message);
  error.code = code;
  error.retryable = retryable;
  return error;
}

function clip(value, max) {
  const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}.` : text;
}

function iso(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function stableId(prefix, ...parts) {
  const hash = crypto.createHash('sha1').update(parts.join('\u0000')).digest('hex').slice(0, 24);
  return `${prefix}:${hash}`;
}

function bool(value) {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseJsonOutput(output) {
  const text = String(output || '').trim();
  if (!text) return null;
  return JSON.parse(text);
}

const COLLECT_SCRIPT = `
$ErrorActionPreference='SilentlyContinue'
$ProgressPreference='SilentlyContinue'
$errors=New-Object System.Collections.ArrayList
function Add-Err([string]$m){ if($m){ [void]$errors.Add($m) } }

function Read-Approved([string]$hive,[string]$sub){
  $map=@{}
  try {
    $p = if($hive -eq 'HKCU'){ "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\$sub" } else { "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\$sub" }
    if(Test-Path -LiteralPath $p){
      $item=Get-Item -LiteralPath $p
      foreach($n in @($item.GetValueNames())){
        if(-not $n){ continue }
        $bytes=$item.GetValue($n)
        if($bytes -is [byte[]] -and $bytes.Length -gt 0){
          $map[$n] = if((($bytes[0]) -band 1) -eq 0){ 'enabled' } else { 'disabled' }
        } else { $map[$n] = 'enabled' }
      }
    }
  } catch { Add-Err ("startup-approved: " + $_.Exception.Message) }
  return $map
}

$approved = @{}
$approved['HKCU:Run'] = Read-Approved 'HKCU' 'Run'
$approved['HKLM:Run'] = Read-Approved 'HKLM' 'Run'
$approved['HKLM:Run32'] = Read-Approved 'HKLM' 'Run32'
$approved['HKCU:StartupFolder'] = Read-Approved 'HKCU' 'StartupFolder'
$approved['HKLM:StartupFolder'] = Read-Approved 'HKLM' 'StartupFolder'

$registry=@()
$runKeys=@(
  @{ hive='HKCU'; key='Software\\Microsoft\\Windows\\CurrentVersion\\Run'; kind='run'; view='64'; approved='HKCU:Run' },
  @{ hive='HKCU'; key='Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce'; kind='runonce'; view='64'; approved=$null },
  @{ hive='HKLM'; key='Software\\Microsoft\\Windows\\CurrentVersion\\Run'; kind='run'; view='64'; approved='HKLM:Run' },
  @{ hive='HKLM'; key='Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce'; kind='runonce'; view='64'; approved=$null },
  @{ hive='HKLM'; key='Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run'; kind='run'; view='32'; approved='HKLM:Run32' }
)
foreach($def in $runKeys){
  try {
    $root = if($def.hive -eq 'HKCU'){ 'HKCU:' } else { 'HKLM:' }
    $psPath = $root + '\\' + $def.key
    if(-not (Test-Path -LiteralPath $psPath)){ continue }
    $item=Get-Item -LiteralPath $psPath
    foreach($n in @($item.GetValueNames())){
      if(-not $n -or $n -match '^PS'){ continue }
      $cmd=$item.GetValue($n)
      if($cmd -eq $null){ continue }
      $approval=$null
      if($def.approved -and $approved.ContainsKey($def.approved)){ $approval=$approved[$def.approved][$n] }
      $registry += [pscustomobject]@{
        name=$n; hive=$def.hive; key=$def.key; kind=$def.kind; view=$def.view;
        command=[string]$cmd; approved=if($approval){$approval}else{'unknown'}
      }
    }
  } catch { Add-Err ("registry " + $def.hive + ": " + $_.Exception.Message) }
}

$folders=@()
$shell=$null
try { $shell=New-Object -ComObject WScript.Shell } catch { Add-Err ("shortcut-com: " + $_.Exception.Message) }
$folderDefs=@(
  @{ scope='user'; path=[Environment]::GetFolderPath('Startup'); approved='HKCU:StartupFolder' },
  @{ scope='machine'; path=[Environment]::GetFolderPath('CommonStartup'); approved='HKLM:StartupFolder' }
)
foreach($def in $folderDefs){
  try {
    if(-not $def.path -or -not (Test-Path -LiteralPath $def.path)){ continue }
    foreach($file in @(Get-ChildItem -LiteralPath $def.path -File)){
      $target=$null; $arguments=$null; $description=$null
      if($file.Extension -ieq '.lnk'){
        try {
          if($shell){
            $shortcut=$shell.CreateShortcut($file.FullName)
            $target=[string]$shortcut.TargetPath
            $arguments=[string]$shortcut.Arguments
            $description=[string]$shortcut.Description
          }
        } catch { Add-Err ("shortcut " + $file.Name + ": " + $_.Exception.Message) }
      } else { $target=$file.FullName }
      $approval=$null
      if($def.approved -and $approved.ContainsKey($def.approved)){ $approval=$approved[$def.approved][$file.Name] }
      $folders += [pscustomobject]@{
        name=[System.IO.Path]::GetFileNameWithoutExtension($file.Name);
        file=$file.FullName; target=$target; args=$arguments; description=$description;
        scope=$def.scope; approved=if($approval){$approval}else{'unknown'}
      }
    }
  } catch { Add-Err ("startup-folder " + $def.scope + ": " + $_.Exception.Message) }
}

[pscustomobject]@{ registry=@($registry); folders=@($folders); errors=@($errors) } | ConvertTo-Json -Depth 5 -Compress
`;

const TASKS_SCRIPT = `
$ErrorActionPreference='SilentlyContinue'
$ProgressPreference='SilentlyContinue'
$errors=New-Object System.Collections.ArrayList
$tasks=@()
try {
  foreach($task in @(Get-ScheduledTask)){
    try {
      $triggerTypes=@()
      foreach($trigger in @($task.Triggers)){
        if($trigger -and $trigger.CimClass -and $trigger.CimClass.CimClassName){ $triggerTypes += [string]$trigger.CimClass.CimClassName }
      }
      $logon=@($triggerTypes | Where-Object { $_ -match 'LogonTrigger' }).Count -gt 0
      $boot=@($triggerTypes | Where-Object { $_ -match 'BootTrigger' }).Count -gt 0
      if(-not $logon -and -not $boot){ continue }
      $info=$null
      try { $info=$task | Get-ScheduledTaskInfo } catch { }
      $action=@($task.Actions)[0]
      $tasks += [pscustomobject]@{
        name=[string]$task.TaskName; path=[string]$task.TaskPath; state=[string]$task.State;
        author=[string]$task.Author; userId=[string]$task.Principal.UserId; runLevel=[string]$task.Principal.RunLevel;
        logon=$logon; boot=$boot; triggers=@($triggerTypes);
        nextRun=if($info){$info.NextRunTime}else{$null}; lastRun=if($info){$info.LastRunTime}else{$null};
        execute=if($action){[string]$action.Execute}else{$null}; arguments=if($action){[string]$action.Arguments}else{$null}
      }
      if($tasks.Count -ge 300){ break }
    } catch { [void]$errors.Add("task " + $task.TaskName + ": " + $_.Exception.Message) }
  }
} catch { [void]$errors.Add("tasks: " + $_.Exception.Message) }
[pscustomobject]@{ tasks=@($tasks); errors=@($errors) } | ConvertTo-Json -Depth 5 -Compress
`;

const BOOT_SCRIPT = `
$ErrorActionPreference='SilentlyContinue'
$ProgressPreference='SilentlyContinue'
$errors=New-Object System.Collections.ArrayList
$lastBoot=$null
$uptime=$null
try {
  $os=Get-CimInstance Win32_OperatingSystem -ErrorAction Stop
  if($os.LastBootUpTime){ $lastBoot=[string]$os.LastBootUpTime }
  if($lastBoot){ $uptime=[int]((Get-Date) - [datetime]$lastBoot).TotalSeconds }
} catch { [void]$errors.Add("last-boot: " + $_.Exception.Message) }
$events=@()
try {
  $raw=Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Diagnostics-Performance/Operational'; Id=100,101,102,103,109,110} -MaxEvents 40 -ErrorAction Stop
  foreach($event in @($raw)){
    $props=@()
    foreach($prop in @($event.Properties)){ if($prop){ $props += [string]$prop.Value } }
    $events += [pscustomobject]@{
      id=[int]$event.Id; time=[string]$event.TimeCreated; level=[string]$event.LevelDisplayName;
      provider=[string]$event.ProviderName; message=([string]$event.Message -replace '\\s+',' '); properties=@($props)
    }
  }
} catch { [void]$errors.Add("boot-events: " + $_.Exception.Message) }
[pscustomobject]@{ lastBoot=$lastBoot; uptime=$uptime; events=@($events); errors=@($errors) } | ConvertTo-Json -Depth 5 -Compress
`;

const SIGNATURE_SCRIPT = `
$ErrorActionPreference='SilentlyContinue'
$ProgressPreference='SilentlyContinue'
$paths=@()
try { if($env:KNOUX_STARTUP_SIGN_PATHS){ $paths=@($env:KNOUX_STARTUP_SIGN_PATHS | ConvertFrom-Json) } } catch { }
$out=@()
foreach($target in $paths){
  $row=[pscustomobject]@{ path=[string]$target; exists=$false; status='unavailable'; signer=$null; company=$null; product=$null; description=$null; version=$null }
  try {
    if($target -and (Test-Path -LiteralPath $target -PathType Leaf)){
      $row.exists=$true
      try {
        $vi=[System.Diagnostics.FileVersionInfo]::GetVersionInfo($target)
        $row.company=[string]$vi.CompanyName; $row.product=[string]$vi.ProductName
        $row.description=[string]$vi.FileDescription; $row.version=[string]$vi.FileVersion
      } catch { }
      try {
        $sig=Get-AuthenticodeSignature -LiteralPath $target -ErrorAction Stop
        $row.status=[string]$sig.Status
        if($sig.SignerCertificate){ $row.signer=[string]$sig.SignerCertificate.Subject }
      } catch { $row.status='unavailable' }
    }
  } catch { }
  $out += $row
}
ConvertTo-Json -InputObject @($out) -Depth 4 -Compress
`;

class StartupBridge {
  constructor({
    loadProvider = null,
    provider = null,
    emit = null,
    env = process.env,
    homeDir = os.homedir(),
    platform = process.platform,
    now = () => new Date(),
    execFile: execFileRunner = null,
    collectors = null,
    collectSignatures = null,
    listProcessNames = null,
    signatureCacheMs = SIGNATURE_CACHE_MS,
    scanTimeoutMs = DEFAULT_SCAN_TIMEOUT_MS,
  } = {}) {
    this.loadProvider = typeof loadProvider === 'function' ? loadProvider : null;
    this.provider = provider;
    this.emit = typeof emit === 'function' ? emit : () => {};
    this.env = env || {};
    this.homeDir = homeDir;
    this.platform = platform;
    this.now = now;
    this.execFile = execFileRunner || execFileAsync;
    this.collectors = collectors && typeof collectors === 'object' ? collectors : {};
    this.collectSignatures = typeof collectSignatures === 'function' ? collectSignatures : null;
    this.listProcessNames = typeof listProcessNames === 'function' ? listProcessNames : null;
    this.signatureCacheMs = Math.max(1000, Number(signatureCacheMs) || SIGNATURE_CACHE_MS);
    this.scanTimeoutMs = Math.max(5000, Number(scanTimeoutMs) || DEFAULT_SCAN_TIMEOUT_MS);
    this.scanSessions = new Map();
    this.lastInventory = null;
    this.lastImpact = null;
    this.signatureCache = new Map();
    this.processCache = { at: 0, names: [] };
  }

  capabilities() {
    return {
      engine: 'KNOuX Boot Control read-only coordinator',
      contract: CONTRACT,
      readOnly: true,
      mutation: 'none',
      fixtureFallback: false,
      serviceCount: SERVICE_DEFINITIONS.length,
      services: SERVICE_DEFINITIONS.map((service) => ({ ...service })),
      gatedOperations: GATED_OPERATIONS.map((operation) => ({ ...operation })),
      sources: [
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run and RunOnce',
        'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run and RunOnce (64-bit and WOW6432Node)',
        'StartupApproved\\Run, Run32 and StartupFolder state values',
        'Per-user and all-users Startup folders with read-only .lnk resolution',
        'Task Scheduler tasks with logon or boot triggers',
        'Win32_Service automatic and delayed-auto services',
        'Microsoft-Windows-Diagnostics-Performance/Operational boot events',
      ],
      limits: {
        entries: MAX_ENTRIES,
        services: MAX_SERVICES,
        tasks: MAX_TASKS,
        bootEvents: MAX_BOOT_EVENTS,
        planItems: MAX_PLAN_ITEMS,
        scanTimeoutMs: this.scanTimeoutMs,
      },
      nativeOnly: [
        'Registry Run/RunOnce and StartupApproved measurement',
        'Startup folder shortcut resolution',
        'Task Scheduler logon/boot trigger measurement',
        'Win32_Service automatic/delayed startup measurement',
        'Windows boot diagnostics event reader',
      ],
    };
  }

  settingsTarget(target) {
    if (target === 'startupapps') return { target, uri: 'ms-settings:startupapps' };
    throw startupError('STARTUP_SETTINGS_TARGET_INVALID', 'The requested Windows Settings page is not allowlisted.');
  }

  redact(value) {
    let text = String(value == null ? '' : value);
    if (!text) return null;
    const replacements = [
      [this.homeDir, '%USERPROFILE%'],
      [this.env.SystemRoot || this.env.windir, '%SystemRoot%'],
      [this.env.ProgramFiles, '%ProgramFiles%'],
      [this.env['ProgramFiles(x86)'], '%ProgramFiles(x86)%'],
      [this.env.ProgramData, '%ProgramData%'],
      [this.env.LOCALAPPDATA, '%LOCALAPPDATA%'],
      [this.env.APPDATA, '%APPDATA%'],
      [this.env.USERPROFILE, '%USERPROFILE%'],
    ].filter(([from]) => from);
    for (const [from, to] of replacements) {
      text = text.replace(new RegExp(String(from).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), to);
    }
    return text;
  }

  expandEnv(value) {
    if (!value) return null;
    const lookup = new Map();
    for (const [key, entry] of Object.entries(this.env || {})) lookup.set(String(key).toLowerCase(), entry);
    return String(value).replace(/%([^%]+)%/g, (match, key) => {
      const found = lookup.get(String(key).toLowerCase());
      return found == null ? match : String(found);
    });
  }

  executableFrom(command, target) {
    const source = String(target || command || '').trim();
    if (!source) return null;
    let candidate = source;
    if (candidate.startsWith('"')) {
      const end = candidate.indexOf('"', 1);
      candidate = end > 0 ? candidate.slice(1, end) : candidate.slice(1);
    } else if (!target) {
      const quoted = /^"([^"]+)"/.exec(candidate);
      if (quoted) candidate = quoted[1];
      else {
        const match = /^(.+?\.(?:exe|com|bat|cmd|ps1|vbs|js|msc|cpl|dll))(?=\s|$)/i.exec(candidate);
        candidate = match ? match[1] : candidate.split(/\s+/)[0];
      }
    }
    candidate = this.expandEnv(candidate);
    if (!candidate) return null;
    candidate = candidate.replace(/^\\\\\?\\/i, '');
    if (!/^[a-z]:\\/i.test(candidate)) return null;
    return candidate;
  }

  resolvePublisher(company, signer) {
    if (company && String(company).trim()) return clip(company, 120);
    if (signer) {
      const match = /CN=([^,]+)/i.exec(String(signer));
      if (match) return clip(match[1].replace(/\\"/g, '"'), 120);
    }
    return null;
  }

  mapSignatureStatus(status) {
    const value = String(status || '').toLowerCase();
    if (value === 'valid') return 'valid';
    if (value === 'notsigned') return 'unsigned';
    if (value === 'hashmismatch' || value === 'nottrusted' || value === 'unknownerror' || value === 'invalidsignature') return 'untrusted';
    return 'unavailable';
  }

  protectedForCommand(name, executable, sourceKind, taskPath) {
    if (sourceKind === 'scheduled-task' && taskPath && PROTECTED_TASK_PATH.test(taskPath)) {
      return { protected: true, reason: 'Windows maintenance task under \\Microsoft\\Windows\\.' };
    }
    const joined = `${name || ''} ${executable || ''}`;
    if (executable && SYSTEM_ROOT_COMMAND.test(executable) && PROTECTED_COMMAND.test(joined)) {
      return { protected: true, reason: 'Windows security or critical system component.' };
    }
    if (PROTECTED_COMMAND.test(name || '') && executable && SYSTEM_ROOT_COMMAND.test(executable)) {
      return { protected: true, reason: 'Windows security or critical system component.' };
    }
    return { protected: false, reason: null };
  }

  serviceProtection(name, serviceType, binaryPath) {
    if (PROTECTED_SERVICE.test(name || '')) return { protected: true, reason: 'Windows security, servicing or broker service.' };
    if (/driver/i.test(String(serviceType || ''))) return { protected: true, reason: 'Kernel driver service; never disabled from this app.' };
    if (PROTECTED_COMMAND.test(name || '') && binaryPath && SYSTEM_ROOT_COMMAND.test(binaryPath)) {
      return { protected: true, reason: 'Windows security component.' };
    }
    return { protected: false, reason: null };
  }

  mapService(raw) {
    const startMode = String(raw.startMode || raw.StartMode || '').toLowerCase();
    const delayed = bool(raw.delayedAuto != null ? raw.delayedAuto : raw.DelayedAutoStart);
    const startupType = startMode === 'auto' || startMode === 'automatic'
      ? (delayed ? 'delayed' : 'automatic')
      : startMode === 'manual' ? 'manual'
        : startMode === 'disabled' ? 'disabled' : 'unknown';
    const name = clip(raw.name || raw.Name || 'Unnamed service', 160);
    const protection = this.serviceProtection(name, raw.serviceType || raw.ServiceType, raw.binaryPath || raw.PathName);
    return {
      id: stableId('svc', name),
      name,
      displayName: clip(raw.displayName || raw.DisplayName || name, 180),
      state: clip(raw.state || raw.State || 'Unknown', 40),
      startupType,
      delayedAuto: delayed,
      account: clip(raw.account || raw.StartName || '', 120) || 'unknown',
      binaryPath: this.redact(raw.binaryPath || raw.PathName || null),
      running: raw.running === true || String(raw.state || raw.State).toLowerCase() === 'running',
      processId: numberOrNull(raw.processId != null ? raw.processId : raw.ProcessId),
      protected: protection.protected,
      protectionReason: protection.reason,
      evidence: [
        `Win32_Service start mode ${raw.startMode || raw.StartMode || 'unknown'}${delayed ? ' with delayed auto-start' : ''}.`,
        protection.protected ? protection.reason : 'No protected service or driver rule matched.',
      ],
    };
  }

  mapTask(raw) {
    const name = clip(raw.name || raw.TaskName || 'Unnamed task', 160);
    const taskPath = clip(raw.path || raw.TaskPath || '\\', 260);
    const triggers = [];
    if (raw.logon || asArray(raw.triggers).some((entry) => /LogonTrigger/i.test(entry))) triggers.push('logon');
    if (raw.boot || asArray(raw.triggers).some((entry) => /BootTrigger/i.test(entry))) triggers.push('boot');
    const state = clip(raw.state || raw.State || 'Unknown', 40);
    const protection = this.protectedForCommand(name, null, 'scheduled-task', taskPath);
    const row = {
      id: stableId('task', taskPath, name),
      name,
      path: taskPath,
      state,
      author: clip(raw.author || raw.Author || '', 160) || null,
      userId: clip(raw.userId || raw.UserId || '', 160) || null,
      runLevel: clip(raw.runLevel || raw.RunLevel || '', 40) || null,
      triggers: triggers.length ? triggers : ['logon'],
      nextRunAt: iso(raw.nextRun || raw.NextRun),
      lastRunAt: iso(raw.lastRun || raw.LastRun),
      execute: this.redact(raw.execute || raw.Execute || null),
      args: clip(raw.args || raw.arguments || raw.Arguments || '', 240) || null,
      protected: protection.protected,
      protectionReason: protection.reason,
    };
    Object.defineProperty(row, 'rawExecute', { value: raw.execute || raw.Execute || null, enumerable: false, configurable: true });
    return row;
  }

  mapRegistryRow(raw) {
    const name = clip(raw.name || raw.Name || 'Unnamed autorun', 160);
    const command = String(raw.command || raw.Command || '');
    const executable = this.executableFrom(command);
    const kind = String(raw.kind || 'run').toLowerCase();
    const sourceKind = kind === 'runonce' ? 'registry-runonce' : 'registry-run';
    const approved = String(raw.approved || 'unknown').toLowerCase();
    const state = approved === 'enabled' || approved === 'disabled' ? approved : 'enabled';
    const protection = this.protectedForCommand(name, executable, sourceKind, null);
    const location = `${raw.hive || 'HKLM'}\\${raw.key || ''}${raw.view === '32' ? ' (32-bit view)' : ''}`;
    const row = {
      id: stableId('st', sourceKind, raw.hive || '', raw.key || '', name),
      name,
      sourceKind,
      scope: String(raw.hive || 'HKLM').toUpperCase() === 'HKCU' ? 'user' : 'machine',
      location: this.redact(location),
      command: this.redact(command),
      args: null,
      executable: this.redact(executable),
      publisher: null,
      signature: 'unavailable',
      state,
      approvedState: approved === 'enabled' || approved === 'disabled' ? approved : 'unknown',
      protection: protection.protected ? 'protected' : 'standard',
      protectionReason: protection.reason,
      elevationRequired: String(raw.hive || 'HKLM').toUpperCase() !== 'HKCU',
      active: false,
      description: null,
      triggers: ['registry'],
      taskState: null,
      taskPath: null,
      nextRunAt: null,
      lastRunAt: null,
      userId: null,
      runLevel: null,
      evidence: [
        approved === 'unknown'
          ? 'No StartupApproved value was present; Windows launches Run entries by default.'
          : `StartupApproved state is ${approved}.`,
        protection.protected ? protection.reason : 'No protected system-component rule matched.',
      ],
    };
    // Raw executable is used only for local signature/process measurement and
    // is non-enumerable so it never crosses the IPC boundary.
    Object.defineProperty(row, 'rawExecutable', { value: executable, enumerable: false, configurable: true });
    return row;
  }

  mapFolderRow(raw) {
    const name = clip(raw.name || raw.Name || 'Unnamed shortcut', 160);
    const target = String(raw.target || raw.Target || '');
    const executable = this.executableFrom(target);
    const approved = String(raw.approved || 'unknown').toLowerCase();
    const state = approved === 'disabled' ? 'disabled' : 'enabled';
    const protection = this.protectedForCommand(name, executable, 'startup-folder', null);
    const row = {
      id: stableId('st', 'startup-folder', raw.scope || 'user', raw.file || raw.name || ''),
      name,
      sourceKind: 'startup-folder',
      scope: raw.scope === 'machine' ? 'machine' : 'user',
      location: this.redact(String(raw.file || (raw.scope === 'machine' ? '%ProgramData%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup' : '%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup'))),
      command: this.redact(target || null),
      args: clip(raw.args || raw.Arguments || '', 240) || null,
      executable: this.redact(executable),
      publisher: null,
      signature: 'unavailable',
      state,
      approvedState: approved === 'enabled' || approved === 'disabled' ? approved : 'unknown',
      protection: protection.protected ? 'protected' : 'standard',
      protectionReason: protection.reason,
      elevationRequired: raw.scope === 'machine',
      active: false,
      description: clip(raw.description || raw.Description || '', 200) || null,
      triggers: ['startup-folder'],
      taskState: null,
      taskPath: null,
      nextRunAt: null,
      lastRunAt: null,
      userId: null,
      runLevel: null,
      evidence: [
        target ? 'Shortcut target was resolved read-only.' : 'Shortcut target could not be resolved; the file itself is shown.',
        protection.protected ? protection.reason : 'No protected system-component rule matched.',
      ],
    };
    Object.defineProperty(row, 'rawExecutable', { value: executable, enumerable: false, configurable: true });
    return row;
  }

  mapTaskEntry(task) {
    const rawExecutable = this.executableFrom(task.rawExecute || task.execute);
    const row = {
      id: `task:${task.id.split(':')[1]}`,
      name: task.name,
      sourceKind: 'scheduled-task',
      scope: /^\\Microsoft\\Windows\\/i.test(task.path) ? 'machine' : 'user',
      location: this.redact(`${task.path}${task.name}`),
      command: task.execute,
      args: task.args,
      executable: this.redact(rawExecutable),
      publisher: null,
      signature: 'unavailable',
      state: task.state.toLowerCase() === 'disabled' ? 'disabled' : 'enabled',
      approvedState: task.state.toLowerCase() === 'disabled' ? 'disabled' : 'enabled',
      protection: task.protected ? 'protected' : 'standard',
      protectionReason: task.protectionReason,
      elevationRequired: String(task.runLevel || '').toLowerCase() === 'highest',
      active: task.state.toLowerCase() === 'running',
      description: task.author ? `Task author: ${task.author}` : null,
      triggers: task.triggers,
      taskState: task.state,
      taskPath: task.path,
      nextRunAt: task.nextRunAt,
      lastRunAt: task.lastRunAt,
      userId: task.userId,
      runLevel: task.runLevel,
      evidence: [
        `Scheduled task state ${task.state}; triggers ${task.triggers.join(', ') || 'logon'}.`,
        task.protected ? task.protectionReason : 'No protected task-path rule matched.',
      ],
    };
    Object.defineProperty(row, 'rawExecutable', { value: rawExecutable, enumerable: false, configurable: true });
    return row;
  }

  mapBoot(raw) {
    const events = asArray(raw && raw.events).slice(0, MAX_BOOT_EVENTS).map((event, index) => ({
      id: raw && event.id != null ? `boot:${event.id}:${index}` : `boot:${index}`,
      eventId: numberOrNull(event.id),
      timeCreated: iso(event.time),
      level: clip(event.level || '', 40) || null,
      provider: clip(event.provider || 'Microsoft-Windows-Diagnostics-Performance', 120),
      message: clip(event.message || '', 420) || null,
      properties: asArray(event.properties).map((value) => clip(value, 160)).slice(0, 24),
      measured: true,
    }));
    const lastBootAt = iso(raw && raw.lastBoot);
    const uptime = numberOrNull(raw && raw.uptime);
    return {
      available: Boolean(lastBootAt || events.length),
      lastBootAt,
      uptimeSeconds: uptime != null ? Math.max(0, Math.floor(uptime)) : null,
      eventCount: events.length,
      events,
      note: events.length
        ? 'Boot diagnostics events below are measured Windows events. Per-entry boot seconds are only shown when Windows attributes them explicitly.'
        : 'Windows boot diagnostics events were not available (permission, disabled log or unsupported build). No boot seconds are estimated.',
    };
  }

  async runPowerShell(script, timeout, signal, extraEnv = null) {
    const result = await this.execFile('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script,
    ], {
      timeout,
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
      signal,
      env: {
        ...this.env,
        ...(extraEnv || {}),
        PSModulePath: path.join(this.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'Modules'),
      },
    });
    return result && typeof result === 'object' && 'stdout' in result ? result.stdout : result;
  }

  async readSources({ signal } = {}) {
    const output = await this.runPowerShell(COLLECT_SCRIPT, POWER_SHELL_TIMEOUT_MS, signal);
    const parsed = parseJsonOutput(output) || {};
    return {
      registry: asArray(parsed.registry),
      folders: asArray(parsed.folders),
      errors: asArray(parsed.errors).map((error) => clip(error, 200)),
    };
  }

  async readTasks({ signal } = {}) {
    const output = await this.runPowerShell(TASKS_SCRIPT, POWER_SHELL_TIMEOUT_MS, signal);
    const parsed = parseJsonOutput(output) || {};
    return {
      tasks: asArray(parsed.tasks),
      errors: asArray(parsed.errors).map((error) => clip(error, 200)),
    };
  }

  async readServices({ signal } = {}) {
    const provider = this.provider || (this.loadProvider ? this.loadProvider() : null);
    if (!provider || typeof provider.collectServices !== 'function') {
      throw startupError('STARTUP_PROVIDER_MISSING', 'The Windows service provider is not installed.');
    }
    const services = await provider.collectServices({ timeout: POWER_SHELL_TIMEOUT_MS, signal });
    return { services: asArray(services), errors: [] };
  }

  async readBoot({ signal } = {}) {
    const output = await this.runPowerShell(BOOT_SCRIPT, POWER_SHELL_TIMEOUT_MS, signal);
    const parsed = parseJsonOutput(output) || {};
    return {
      boot: { lastBoot: parsed.lastBoot, uptime: parsed.uptime, events: asArray(parsed.events) },
      errors: asArray(parsed.errors).map((error) => clip(error, 200)),
    };
  }

  async readSignatures(paths, { signal } = {}) {
    if (!paths.length) return new Map();
    if (this.collectSignatures) {
      const rows = asArray(await this.collectSignatures(paths, { signal }));
      return new Map(rows.map((row) => [String(row.path).toLowerCase(), row]));
    }
    const output = await this.runPowerShell(SIGNATURE_SCRIPT, SIGNATURE_TIMEOUT_MS, signal, {
      KNOUX_STARTUP_SIGN_PATHS: JSON.stringify(paths.slice(0, MAX_SIGNATURE_PATHS)),
    });
    const rows = asArray(parseJsonOutput(output));
    return new Map(rows.map((row) => [String(row.path).toLowerCase(), row]));
  }

  async allProcessNames() {
    if (this.listProcessNames) return asArray(await this.listProcessNames()).map((name) => String(name).toLowerCase());
    if (Date.now() - this.processCache.at < 15000) return this.processCache.names;
    const script = "Get-Process | Select-Object -ExpandProperty ProcessName -Unique | ConvertTo-Json -Compress";
    const output = await this.runPowerShell(script, PROCESS_TIMEOUT_MS);
    const names = asArray(parseJsonOutput(output)).map((name) => String(name || '').toLowerCase()).filter(Boolean);
    this.processCache = { at: Date.now(), names };
    return names;
  }

  async enrich(entries, { signal } = {}) {
    const processNames = new Set(await this.allProcessNames().catch(() => []));
    const rawPath = (entry) => entry.rawExecutable || entry.executable;
    const paths = [...new Set(entries.map((entry) => rawPath(entry)).filter((value) => value && /^[a-z]:\\/i.test(value)).map((value) => String(value)))].slice(0, MAX_SIGNATURE_PATHS);
    let signatures = new Map();
    try {
      signatures = await this.readSignatures(paths, { signal });
    } catch {
      signatures = new Map();
    }
    let unresolved = 0;
    for (const entry of entries) {
      const executable = rawPath(entry);
      if (executable) {
        const row = signatures.get(String(executable).toLowerCase());
        if (row && row.exists) {
          entry.signature = this.mapSignatureStatus(row.status);
          entry.publisher = this.resolvePublisher(row.company, row.signer);
          if (!entry.description && row.description) entry.description = clip(row.description, 200);
          entry.evidence.push(entry.signature === 'valid'
            ? `Authenticode signature is valid${entry.publisher ? ` (${entry.publisher})` : ''}.`
            : `Authenticode status is ${row.status || 'unavailable'}.`);
        } else {
          entry.signature = 'unavailable';
          unresolved += 1;
        }
        const stem = path.basename(executable).replace(/\.[^.]+$/, '').toLowerCase();
        if (stem && processNames.has(stem)) {
          entry.active = true;
          entry.evidence.push('A running process with the same executable name was measured.');
        }
      }
      if (entry.sourceKind === 'scheduled-task' && entry.active) {
        entry.evidence.push('Task Scheduler reports this task as Running.');
      }
      delete entry.rawExecutable;
    }
    return { unresolved };
  }

  async collectAll({ signal, includeTasks, includeServices, includeBoot, setStage, pushWarning }) {
    const sources = this.collectors.readSources
      ? await this.collectors.readSources({ signal })
      : await this.readSources({ signal });
    setStage('registry', sources.errors && sources.errors.length ? 'partial' : 'complete', `${asArray(sources.registry).length} registry values read`);
    setStage('folders', 'complete', `${asArray(sources.folders).length} startup-folder items read`);

    let taskResult = { tasks: [], errors: [] };
    if (includeTasks) {
      try {
        taskResult = this.collectors.readTasks ? await this.collectors.readTasks({ signal }) : await this.readTasks({ signal });
        setStage('tasks', taskResult.errors && taskResult.errors.length ? 'partial' : 'complete', `${asArray(taskResult.tasks).length} logon/boot tasks read`);
      } catch (error) {
        if (error?.name === 'AbortError' || signal?.aborted) throw error;
        pushWarning(`Scheduled tasks could not be measured: ${clip(error?.message || error, 160)}`);
        taskResult = { tasks: [], errors: [`scheduled tasks: ${clip(error?.message || error, 160)}`] };
        setStage('tasks', 'failed', 'Task Scheduler measurement failed');
      }
    } else {
      setStage('tasks', 'skipped', 'Task measurement was not requested');
    }

    let serviceResult = { services: [], errors: [] };
    if (includeServices) {
      try {
        serviceResult = this.collectors.readServices ? await this.collectors.readServices({ signal }) : await this.readServices({ signal });
        setStage('services', serviceResult.errors && serviceResult.errors.length ? 'partial' : 'complete', `${asArray(serviceResult.services).length} services read`);
      } catch (error) {
        if (error?.name === 'AbortError' || signal?.aborted) throw error;
        pushWarning(`Windows services could not be measured: ${clip(error?.message || error, 160)}`);
        serviceResult = { services: [], errors: [`windows services: ${clip(error?.message || error, 160)}`] };
        setStage('services', 'failed', 'Win32_Service measurement failed');
      }
    } else {
      setStage('services', 'skipped', 'Service measurement was not requested');
    }

    let bootResult = { boot: { lastBoot: null, uptime: null, events: [] }, errors: [] };
    if (includeBoot) {
      try {
        bootResult = this.collectors.readBoot ? await this.collectors.readBoot({ signal }) : await this.readBoot({ signal });
        setStage('boot', bootResult.errors && bootResult.errors.length ? 'partial' : 'complete', `${asArray(bootResult.boot && bootResult.boot.events).length} boot diagnostic events read`);
      } catch (error) {
        if (error?.name === 'AbortError' || signal?.aborted) throw error;
        pushWarning(`Boot diagnostics could not be measured: ${clip(error?.message || error, 160)}`);
        bootResult = { boot: { lastBoot: null, uptime: null, events: [] }, errors: [`boot diagnostics: ${clip(error?.message || error, 160)}`] };
        setStage('boot', 'failed', 'Boot diagnostics unavailable');
      }
    } else {
      setStage('boot', 'skipped', 'Boot diagnostics were not requested');
    }

    for (const error of [...asArray(sources.errors), ...asArray(taskResult.errors), ...asArray(serviceResult.errors), ...asArray(bootResult.errors)]) {
      pushWarning(error);
    }

    const registryEntries = asArray(sources.registry).map((raw) => this.mapRegistryRow(raw));
    const folderEntries = asArray(sources.folders).map((raw) => this.mapFolderRow(raw));
    const tasks = asArray(taskResult.tasks).map((raw) => this.mapTask(raw));
    const taskEntries = tasks.map((task) => this.mapTaskEntry(task));
    const entries = [...registryEntries, ...folderEntries, ...taskEntries].slice(0, MAX_ENTRIES);
    const services = asArray(serviceResult.services)
      .map((raw) => this.mapService(raw))
      .filter((service) => ['automatic', 'delayed'].includes(service.startupType))
      .slice(0, MAX_SERVICES);

    const { unresolved } = await this.enrich(entries, { signal });
    if (unresolved > 0) pushWarning(`${unresolved} startup executable(s) had no resolved signature evidence.`);

    const boot = this.mapBoot(bootResult.boot);
    const summary = {
      total: entries.length,
      enabled: entries.filter((entry) => entry.state === 'enabled').length,
      disabled: entries.filter((entry) => entry.state === 'disabled').length,
      unknown: entries.filter((entry) => entry.state === 'unknown').length,
      protectedCount: entries.filter((entry) => entry.protection === 'protected').length + services.filter((service) => service.protected).length,
      activeCount: entries.filter((entry) => entry.active).length,
      elevationCount: entries.filter((entry) => entry.elevationRequired).length,
      registry: registryEntries.length,
      folders: folderEntries.length,
      tasks: taskEntries.length,
      services: services.length,
    };
    const coverage = {
      registryKeys: new Set(asArray(sources.registry).map((row) => `${row.hive}\\${row.key}`)).size,
      startupFolders: new Set(asArray(sources.folders).map((row) => row.scope)).size,
      scheduledTasks: tasks.length,
      servicesMeasured: services.length,
      errors: [...asArray(sources.errors), ...asArray(taskResult.errors), ...asArray(serviceResult.errors), ...asArray(bootResult.errors)].slice(0, 20),
    };
    const status = (sources.errors || []).length || (taskResult.errors || []).length || (serviceResult.errors || []).length || (bootResult.errors || []).length
      ? 'partial' : 'complete';
    const warnings = [...new Set(this.collectedWarnings || [])];
    return {
      status,
      source: 'KNOuX Boot Control read-only coordinator',
      observedAt: iso(this.now()),
      readOnly: true,
      mutation: 'none',
      entries,
      services,
      tasks,
      summary,
      coverage,
      boot,
      warnings,
    };
  }

  async start(request = {}) {
    if (this.platform !== 'win32' && !this.collectors.readSources) {
      throw startupError('STARTUP_PLATFORM_UNSUPPORTED', 'Startup measurement is only available on Windows.');
    }
    if (this.scanSessions.size >= MAX_SESSIONS) {
      const oldest = [...this.scanSessions.values()].filter((session) => session.status !== 'running').sort((a, b) => a.startedAt.localeCompare(b.startedAt))[0];
      if (oldest) this.scanSessions.delete(oldest.id);
    }
    const includeTasks = request.includeTasks !== false;
    const includeServices = request.includeServices !== false;
    const includeBoot = request.includeBoot !== false;
    const id = crypto.randomUUID();
    const startedAt = iso(this.now());
    const session = {
      id,
      status: 'running',
      startedAt,
      finishedAt: null,
      stages: STAGE_DEFINITIONS.map((stage) => ({
        key: stage.key,
        labelEn: stage.labelEn,
        labelAr: stage.labelAr,
        status: 'pending',
        detail: 'Waiting',
        startedAt: null,
        finishedAt: null,
      })),
      entryCount: null,
      warningCount: 0,
      cancelled: false,
      error: null,
      controller: new AbortController(),
      warnings: [],
      includeTasks,
      includeServices,
      includeBoot,
    };
    this.scanSessions.set(id, session);
    this.run(session).catch((error) => {
      session.status = signalAborted(session) ? 'cancelled' : 'failed';
      session.error = clip(error?.message || error, 240);
      session.finishedAt = iso(this.now());
      for (const stage of session.stages) {
        if (stage.status === 'running') stage.status = 'failed';
      }
    });
    return this.publicSession(session);
  }

  async run(session) {
    const signal = session.controller.signal;
    const warnings = [];
    const timeout = setTimeout(() => session.controller.abort(), this.scanTimeoutMs);
    const setStage = (key, status, detail) => {
      const stage = session.stages.find((entry) => entry.key === key);
      if (!stage) return;
      if (stage.status === 'pending') stage.startedAt = iso(this.now());
      stage.status = status;
      stage.detail = detail;
      stage.finishedAt = status === 'running' || status === 'pending' ? null : iso(this.now());
      this.emit({ type: 'startup-stage', sessionId: session.id, stage: { ...stage } });
    };
    const pushWarning = (warning) => {
      const text = clip(warning, 220);
      if (text) warnings.push(text);
    };
    this.collectedWarnings = warnings;
    try {
      setStage('registry', 'running', 'Reading registry autoruns and StartupApproved state');
      const inventory = await this.collectAll({
        signal,
        includeTasks: session.includeTasks,
        includeServices: session.includeServices,
        includeBoot: session.includeBoot,
        setStage,
        pushWarning,
      });
      if (signal.aborted) {
        session.status = 'cancelled';
        session.cancelled = true;
      } else {
        inventory.warnings = [...new Set(warnings)];
        this.lastInventory = inventory;
        session.status = inventory.status;
        session.entryCount = inventory.entries.length;
        session.warningCount = inventory.warnings.length;
        this.lastImpact = this.buildImpact(inventory);
      }
    } finally {
      clearTimeout(timeout);
      this.collectedWarnings = null;
      session.finishedAt = iso(this.now());
      session.warningCount = warnings.length;
      if (session.status === 'running') session.status = signal.aborted ? 'cancelled' : 'complete';
      if (signal.aborted) session.cancelled = true;
    }
  }

  publicSession(session, { includeStages = true } = {}) {
    return {
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      stages: includeStages ? session.stages.map((stage) => ({ ...stage })) : [],
      entryCount: session.entryCount,
      warningCount: session.warningCount,
      cancelled: session.cancelled,
      error: session.error,
    };
  }

  status(sessionId) {
    const session = this.scanSessions.get(String(sessionId || ''));
    if (!session) throw startupError('STARTUP_SESSION_NOT_FOUND', 'The startup scan session was not found.');
    return this.publicSession(session);
  }

  cancel(sessionId) {
    const session = this.scanSessions.get(String(sessionId || ''));
    if (!session) throw startupError('STARTUP_SESSION_NOT_FOUND', 'The startup scan session was not found.');
    if (session.status !== 'running') {
      return { cancelled: false, status: session.status, sessionId: session.id };
    }
    session.controller.abort();
    session.cancelled = true;
    session.status = 'cancelled';
    session.finishedAt = iso(this.now());
    return { cancelled: true, status: 'cancelled', sessionId: session.id };
  }

  inventory() {
    if (this.lastInventory) return this.lastInventory;
    return {
      status: 'partial',
      source: 'KNOuX Boot Control read-only coordinator',
      observedAt: iso(this.now()),
      readOnly: true,
      mutation: 'none',
      entries: [],
      services: [],
      tasks: [],
      summary: { total: 0, enabled: 0, disabled: 0, unknown: 0, protectedCount: 0, activeCount: 0, elevationCount: 0, registry: 0, folders: 0, tasks: 0, services: 0 },
      coverage: { registryKeys: 0, startupFolders: 0, scheduledTasks: 0, servicesMeasured: 0, errors: [] },
      boot: { available: false, lastBootAt: null, uptimeSeconds: null, eventCount: 0, events: [], note: 'No startup scan has completed in this session.' },
      warnings: ['No measured startup scan has completed in this session.'],
    };
  }

  services() {
    return this.inventory().services;
  }

  tasks() {
    return this.inventory().tasks;
  }

  buildImpact(inventory) {
    const events = inventory.boot.events;
    const attributed = [];
    for (const entry of inventory.entries) {
      if (!entry.name || entry.name.length < 4) continue;
      const needle = entry.name.toLowerCase();
      const match = events.find((event) => event.message && event.message.toLowerCase().includes(needle));
      if (match) {
        attributed.push({
          entryId: entry.id,
          name: entry.name,
          evidence: `Boot diagnostics event ${match.eventId ?? 'unknown'} mentions this entry.`,
          delayMs: null,
        });
      }
    }
    return {
      available: inventory.boot.available,
      observedAt: inventory.observedAt,
      lastBootAt: inventory.boot.lastBootAt,
      uptimeSeconds: inventory.boot.uptimeSeconds,
      events,
      attributed,
      note: events.length
        ? 'Events are measured. Delay milliseconds are reported only where Windows publishes an explicit value; nothing is inferred from a name match.'
        : inventory.boot.note,
      warnings: inventory.warnings.filter((warning) => /boot|diagnostic/i.test(warning)),
    };
  }

  impact() {
    if (!this.lastInventory) throw startupError('STARTUP_NOT_MEASURED', 'Run a measured startup scan before reading boot impact.');
    return this.lastImpact || (this.lastImpact = this.buildImpact(this.lastInventory));
  }

  journal() {
    return {
      available: false,
      status: 'empty',
      entries: [],
      reason: 'No startup change has been executed, so the append-only journal has no entries.',
      execution: {
        available: false,
        gate: 'Mission 09 approved executor',
        reason: 'Only an explicitly approved, verified startup change may append a journal entry. No write channel exists in this delivery.',
      },
    };
  }

  sessions() {
    return {
      available: false,
      sessions: [],
      reason: 'No batch startup change session has executed.',
      execution: {
        available: false,
        gate: 'Mission 09 approved batch executor',
        reason: 'Mass rollback requires a verified prior batch session and its journal. No write channel exists in this delivery.',
      },
    };
  }

  resolvePlanTargets(ids) {
    const inventory = this.lastInventory;
    if (!inventory) throw startupError('STARTUP_NOT_MEASURED', 'Run a measured startup scan before staging a plan.');
    const entries = new Map(inventory.entries.map((entry) => [entry.id, entry]));
    const services = new Map(inventory.services.map((service) => [service.id, service]));
    const tasks = new Map(inventory.tasks.map((task) => [task.id, task]));
    const targets = [];
    for (const id of ids) {
      const entry = entries.get(id);
      if (entry) { targets.push({ kind: 'entry', entry }); continue; }
      const service = services.get(id);
      if (service) { targets.push({ kind: 'service', service }); continue; }
      const task = tasks.get(id);
      if (task) { targets.push({ kind: 'task', task }); continue; }
      throw startupError('STARTUP_PLAN_TARGET_INVALID', 'A staged target is not part of the current measured inventory.');
    }
    return targets;
  }

  plan(request = {}) {
    const ids = asArray(request.entryIds).filter((id) => typeof id === 'string');
    if (ids.length < 1 || ids.length > MAX_PLAN_ITEMS) {
      throw startupError('STARTUP_PLAN_INPUT_INVALID', `Between 1 and ${MAX_PLAN_ITEMS} measured startup targets are required.`);
    }
    const mode = String(request.mode || '');
    if (!['disable', 'enable', 'delay', 'restore', 'batch', 'rollback'].includes(mode)) {
      throw startupError('STARTUP_PLAN_MODE_INVALID', 'The startup plan mode is not allowlisted.');
    }
    if (mode === 'restore' || mode === 'rollback') {
      throw startupError('STARTUP_NO_JOURNAL', 'There is no startup change journal entry or batch session to restore in this delivery.');
    }
    const targets = this.resolvePlanTargets([...new Set(ids)]);
    const delayMinutes = Number.isFinite(Number(request.delayMinutes)) ? Math.min(240, Math.max(1, Math.floor(Number(request.delayMinutes)))) : 30;
    const items = targets.map((target) => {
      if (target.kind === 'entry') {
        const entry = target.entry;
        const action = mode === 'batch' ? 'disable' : mode;
        let after;
        if (action === 'disable' || action === 'batch') after = 'disabled';
        else if (action === 'enable') after = 'enabled';
        else after = `delayed by ${delayMinutes} minutes`;
        const conflicts = [];
        if (entry.protection === 'protected') conflicts.push(entry.protectionReason || 'Protected Windows component.');
        if (entry.elevationRequired) conflicts.push('Requires administrator context for a machine-scope change.');
        if (action === 'delay' && entry.sourceKind !== 'scheduled-task') {
          conflicts.push('This source has no in-place delay semantics; a delay would require a launcher shim and is not supported.');
        }
        return {
          entryId: entry.id,
          name: entry.name,
          sourceKind: entry.sourceKind,
          location: entry.location,
          action,
          before: entry.state,
          after,
          protected: entry.protection === 'protected',
          elevationRequired: entry.elevationRequired,
          conflicts,
        };
      }
      if (target.kind === 'service') {
        const service = target.service;
        const conflicts = [];
        if (service.protected) conflicts.push(service.protectionReason || 'Protected Windows service.');
        if (service.startupType === 'delayed' && mode !== 'enable') conflicts.push('Service is already delayed-auto; service policy changes belong to Mission 12.');
        return {
          entryId: service.id,
          name: service.displayName || service.name,
          sourceKind: 'service',
          location: `Win32_Service · ${service.name}`,
          action: 'disable',
          before: service.startupType,
          after: 'disabled',
          protected: service.protected,
          elevationRequired: true,
          conflicts,
        };
      }
      const task = target.task;
      const conflicts = [];
      if (task.protected) conflicts.push(task.protectionReason || 'Protected Windows maintenance task.');
      if (task.state.toLowerCase() === 'disabled') conflicts.push('Task is already disabled.');
      return {
        entryId: task.id,
        name: task.name,
        sourceKind: 'scheduled-task',
        location: `${task.path}${task.name}`,
        action: mode === 'delay' ? 'disable' : 'disable',
        before: task.state,
        after: 'disabled',
        protected: task.protected,
        elevationRequired: String(task.runLevel || '').toLowerCase() === 'highest',
        conflicts,
      };
    });
    const warnings = [...new Set(items.flatMap((item) => item.conflicts))];
    return {
      id: `startup-plan-${crypto.randomUUID()}`,
      contract: CONTRACT,
      mode,
      createdAt: iso(this.now()),
      immutable: true,
      mutation: 'none',
      itemCount: items.length,
      items,
      protectedCount: items.filter((item) => item.protected).length,
      elevationCount: items.filter((item) => item.elevationRequired).length,
      conflictCount: warnings.length,
      estimatedSavingsMs: null,
      execution: {
        available: false,
        gate: 'Mission 09 destructive-action approval',
        reason: 'This is an immutable review plan. No registry value, task, service or startup folder is written, and no boot-time saving is claimed without measured evidence.',
      },
      warnings,
    };
  }

  report() {
    if (!this.lastInventory) throw startupError('STARTUP_NOT_MEASURED', 'Run a measured startup scan before building a report.');
    const inventory = this.lastInventory;
    return {
      generatedAt: iso(this.now()),
      source: inventory.source,
      readOnly: true,
      mutation: 'none',
      summary: inventory.summary,
      coverage: inventory.coverage,
      boot: inventory.boot,
      entries: inventory.entries,
      note: 'Read-only measured startup evidence. No startup value was enabled, disabled, delayed, restored or journaled.',
    };
  }

  dispose() {
    for (const session of this.scanSessions.values()) {
      try { session.controller.abort(); } catch { }
    }
    this.scanSessions.clear();
    this.signatureCache.clear();
    this.lastInventory = null;
    this.lastImpact = null;
  }
}

function signalAborted(session) {
  try { return session.controller.signal.aborted; } catch { return false; }
}

module.exports = { StartupBridge, SERVICE_DEFINITIONS, GATED_OPERATIONS, STAGE_DEFINITIONS };
