'use strict';

/**
 * KNOuX Gemini - Service Commander providers (Mission 12).
 *
 * Read-only SCM inventory, dependency graph, protected-service policy, bounded
 * Service Control Manager events and svchost process evidence. No service is
 * started, stopped, restarted or reconfigured by this module.
 */

const SERVICE_TOOLS = Object.freeze([
  { id: 'services-inventory', world: 'services', labelEn: 'SCM Service Register', labelAr: 'سجل خدمات SCM', state: 'available', risk: 'read-only', provider: 'Win32_Service', noteEn: 'Dense measured service register with a read-only SCM dossier.', noteAr: 'سجل خدمات مقيس ومكثف مع ملف SCM للقراءة فقط.' },
  { id: 'services-control', world: 'services', labelEn: 'State Change Review', labelAr: 'مراجعة تغيير الحالة', state: 'gated', risk: 'staged-change', provider: 'Win32_Service + dependency graph', noteEn: 'Start, stop and restart are immutable previews with protected/dependency warnings. No SCM operation is executed.', noteAr: 'البدء والإيقاف وإعادة التشغيل معاينات ثابتة مع تحذيرات الحماية والاعتماديات. لا تُنفذ أي عملية SCM.' },
  { id: 'services-undo', world: 'services', labelEn: 'Startup Policy Journal', labelAr: 'سجل سياسة البدء', state: 'gated', risk: 'staged-change', provider: 'Local preview journal', noteEn: 'Preview entries only. No startup policy change is recorded as executed or restorable.', noteAr: 'مدخلات معاينة فقط. لا يُسجل تغيير سياسة بدء كمنفذ أو قابل للاستعادة.' },
  { id: 'services-dependencies', world: 'services', labelEn: 'Dependency Network', labelAr: 'شبكة الاعتماديات', state: 'available', risk: 'read-only', provider: 'Win32_Service.Dependencies', noteEn: 'Directed measured dependency edges with a selected-service inspector.', noteAr: 'حواف اعتماديات مقيسة وموجهة مع فاحص للخدمة المحددة.' },
  { id: 'services-protected', world: 'services', labelEn: 'Protected Core Atlas', labelAr: 'أطلس الخدمات المحمية', state: 'available', risk: 'read-only', provider: 'Capability protection policy', noteEn: 'Protection is derived from measured role, driver type, account and stoppability, not only a fixed name list.', noteAr: 'تُشتق الحماية من الدور المقيس ونوع التعريف والحساب وقابلية الإيقاف، وليس من قائمة أسماء ثابتة فقط.' },
  { id: 'services-search', world: 'services', labelEn: 'SCM Query Console', labelAr: 'وحدة استعلام SCM', state: 'available', risk: 'read-only', provider: 'Win32_Service', noteEn: 'Keyboard-first measured search with status, account and startup filters.', noteAr: 'بحث مقيس يبدأ بلوحة المفاتيح مع مرشحات الحالة والحساب والبدء.' },
  { id: 'services-startup-report', world: 'services', labelEn: 'Startup Policy Analytics', labelAr: 'تحليلات سياسة البدء', state: 'available', risk: 'read-only', provider: 'Win32_Service.StartMode', noteEn: 'Measured automatic/manual/disabled/delayed distribution.', noteAr: 'توزيع مقيس للبدء التلقائي واليدوي والمعطل والمؤجل.' },
  { id: 'services-state-history', world: 'services', labelEn: 'Transition History', labelAr: 'تاريخ التحولات', state: 'partial', risk: 'read-only', provider: 'Service Control Manager event log', noteEn: 'Bounded System-log SCM events for the last seven days; access may be denied.', noteAr: 'أحداث SCM محدودة من سجل النظام لآخر سبعة أيام؛ قد يُرفض الوصول.' },
  { id: 'services-dependents', world: 'services', labelEn: 'Cascade Impact Tree', labelAr: 'شجرة الأثر المتسلسل', state: 'available', risk: 'read-only', provider: 'Computed reverse dependency edges', noteEn: 'Direct and cascade dependents are computed from measured edges.', noteAr: 'تُحسب التبعيات المباشرة والمتسلسلة من الحواف المقيسة.' },
  { id: 'services-diagnose', world: 'services', labelEn: 'SCM Fault Diagnostics', labelAr: 'تشخيص أعطال SCM', state: 'partial', risk: 'read-only', provider: 'Service Control Manager event log', noteEn: 'Measured SCM event excerpts and a safe diagnostic checklist. No repair is run.', noteAr: 'مقتطفات أحداث SCM مقيسة وقائمة تشخيص آمنة. لا يُنفذ أي إصلاح.' },
  { id: 'services-config', world: 'services', labelEn: 'Startup Policy Diff', labelAr: 'فرق سياسة البدء', state: 'gated', risk: 'staged-change', provider: 'Win32_Service.StartMode', noteEn: 'Immutable current-vs-proposed startup policy preview. No configuration write exists.', noteAr: 'معاينة ثابتة للسياسة الحالية مقابل المقترحة. لا توجد كتابة تهيئة.' },
  { id: 'services-perf', world: 'services', labelEn: 'svchost Shared Host Monitor', labelAr: 'مراقب svchost المشترك', state: 'available', risk: 'read-only', provider: 'Win32_Service.ProcessId + Win32_Process', noteEn: 'Measured service-to-PID crosslinks and shared-host working sets.', noteAr: 'روابط خدمة-to-PID مقيسة ومجموعات عمل المضيف المشترك.' }
]);

const GATED_OPERATIONS = Object.freeze([
  { id: 'services.start', mission: '12', title: 'Start a Windows service', reason: 'Starting a service changes system state and may fail dependencies. Mission 12 publishes an immutable preview only.' },
  { id: 'services.stop', mission: '12', title: 'Stop a Windows service', reason: 'Stopping a service can terminate dependent functionality. No service-control executor is shipped.' },
  { id: 'services.restart', mission: '12', title: 'Restart a Windows service', reason: 'Restart combines stop and start risk and requires elevation, dependency checks and postcondition proof.' },
  { id: 'services.startup-type', mission: '12', title: 'Change a service startup type', reason: 'Persistent startup policy changes require an elevated SCM write and rollback evidence.' },
  { id: 'services.protected.bypass', mission: '12', title: 'Modify a protected core service', reason: 'Security, RPC, networking, servicing, kernel-driver and non-stoppable services are denied by policy.' },
  { id: 'services.elevation', mission: '12', title: 'Request elevated SCM access', reason: 'No automatic elevation exists; UAC is user-initiated only.' }
]);

const STAGE_DEFINITIONS = Object.freeze([
  { key: 'inventory', labelEn: 'SCM service inventory', labelAr: 'جرد خدمات SCM' },
  { key: 'graph', labelEn: 'Dependency graph', labelAr: 'رسم الاعتماديات' },
  { key: 'protected', labelEn: 'Protected policy', labelAr: 'سياسة الحماية' },
  { key: 'events', labelEn: 'Service Control Manager events', labelAr: 'أحداث مدير التحكم بالخدمات' },
  { key: 'processes', labelEn: 'svchost shared hosts', labelAr: 'مضيفات svchost المشتركة' },
  { key: 'journal', labelEn: 'Preview journal', labelAr: 'سجل المعاينات' }
]);

const ROLE_MAP = Object.freeze({
  windefend: ['security', 'Windows Defender antivirus'],
  wscsvc: ['security', 'Windows Security Center'],
  securityhealthservice: ['security', 'Windows Security Health Service'],
  sense: ['security', 'Microsoft Defender ATP'],
  samss: ['security', 'Security Account Manager'],
  gpsvc: ['security', 'Group Policy Client'],
  rpcss: ['rpc', 'RPC endpoint mapper'],
  dcomlaunch: ['rpc', 'DCOM server process launcher'],
  services: ['system', 'Service Control Manager'],
  eventlog: ['system', 'Windows Event Log'],
  schedule: ['system', 'Task Scheduler'],
  themes: ['system', 'Windows Themes'],
  plugplay: ['system', 'Plug and Play'],
  power: ['system', 'Power service'],
  lsm: ['system', 'Local Session Manager'],
  profsvc: ['system', 'User Profile Service'],
  audiosrv: ['audio', 'Windows Audio'],
  audioendpointbuilder: ['audio', 'Windows Audio Endpoint Builder'],
  wuauserv: ['servicing', 'Windows Update'],
  bits: ['servicing', 'Background Intelligent Transfer'],
  cryptsvc: ['servicing', 'Cryptographic Services'],
  trustedinstaller: ['servicing', 'Windows Modules Installer'],
  msiserver: ['servicing', 'Windows Installer'],
  dnscache: ['networking', 'DNS Client'],
  dhcp: ['networking', 'DHCP Client'],
  nsi: ['networking', 'Network Store Interface'],
  netprofm: ['networking', 'Network Profile Manager'],
  nla: ['networking', 'Network Location Awareness'],
  lanmanworkstation: ['networking', 'Workstation service'],
  lanmanserver: ['networking', 'Server service'],
  netman: ['networking', 'Network Connections'],
  netbt: ['networking', 'NetBIOS over TCP/IP']
});

const EVENTS_SCRIPT = [
  "$ErrorActionPreference='Stop'",
  "$out=[ordered]@{status='unavailable';events=@();reason=$null}",
  'try {',
  "  $start=(Get-Date).AddDays(-7)",
  "  $events=@(Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Service Control Manager'; StartTime=$start} -MaxEvents 200 -ErrorAction Stop)",
  '  $out.status="available"',
  "  $out.events=@($events | ForEach-Object {[pscustomobject]@{timeCreated=$_.TimeCreated.ToString('o');id=[int]$_.Id;level=[int]$_.Level;provider=[string]$_.ProviderName;message=[string]$_.Message}})",
  "} catch { $out.status='permission_denied'; $out.reason=$_.Exception.Message }",
  '[pscustomobject]$out | ConvertTo-Json -Depth 5 -Compress'
].join('\n');

const SERVICE_SCRIPT = "Get-CimInstance Win32_Service | Select-Object Name,DisplayName,Description,State,StartMode,DelayedAutoStart,ProcessId,ServiceType,StartName,PathName,Dependencies,AcceptStop,CheckPoint,WaitHint,Started | ConvertTo-Json -Depth 5";

const ELEVATION_SCRIPT = [
  "$ErrorActionPreference='Stop'",
  '$id=[Security.Principal.WindowsIdentity]::GetCurrent()',
  '$principal=New-Object Security.Principal.WindowsPrincipal($id)',
  '[pscustomobject]@{isAdmin=$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)} | ConvertTo-Json -Compress'
].join('\n');

const DEPENDENCY_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  '$out=@()',
  'Get-Service | ForEach-Object {',
  '  $deps=@($_.ServicesDependedOn | ForEach-Object { $_.Name })',
  '  $dependents=@($_.DependentServices | ForEach-Object { $_.Name })',
  '  if($deps.Count -gt 0 -or $dependents.Count -gt 0){ $out += [pscustomobject]@{name=$_.Name;dependencies=$deps;dependents=$dependents} }',
  '}',
  '$out | ConvertTo-Json -Depth 4 -Compress'
].join('\n');

const SVCHOST_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  "$procs=@(Get-CimInstance Win32_Process -Filter \"Name='svchost.exe'\" | ForEach-Object { $group=$null; if($_.CommandLine -match '-k\\s+([^\\s]+)'){$group=$matches[1]}; [pscustomobject]@{pid=[int]$_.ProcessId;workingSetBytes=[double]$_.WorkingSetSize;group=$group} })",
  '[pscustomobject]@{processes=$procs} | ConvertTo-Json -Depth 5 -Compress'
].join('\n');

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function text(value) {
  if (value == null) return null;
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  return normalized || null;
}

function numberOrNull(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function boolOrNull(value) {
  if (value == null) return null;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return null;
}

function iso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function startupType(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'auto' || normalized === 'automatic') return 'automatic';
  if (normalized === 'manual' || normalized === 'demand') return 'manual';
  if (normalized === 'disabled') return 'disabled';
  return 'unknown';
}

function protectionDecision(service) {
  const name = String(service.name || '').toLowerCase();
  const role = ROLE_MAP[name];
  if (role) {
    return { protected: true, protectionRole: role[0], protectionReason: role[1] };
  }
  const type = String(service.serviceType || '').toLowerCase();
  const account = String(service.account || '').toLowerCase();
  if (type.includes('driver') && (account.includes('localsystem') || account === '')) {
    return { protected: true, protectionRole: 'kernel-driver', protectionReason: 'Kernel/system driver measured; service control is denied by capability policy.' };
  }
  if (service.acceptsStop === false) {
    return { protected: true, protectionRole: 'non-stoppable', protectionReason: 'SCM reports this service does not accept stop; control is denied.' };
  }
  return { protected: false, protectionRole: null, protectionReason: null };
}

function normalizeService(raw) {
  const decision = protectionDecision({
    name: raw?.name,
    serviceType: raw?.serviceType,
    account: raw?.account,
    acceptsStop: raw?.acceptsStop,
  });
  return {
    name: text(raw?.name) || '',
    displayName: text(raw?.displayName),
    description: text(raw?.description),
    state: text(raw?.state),
    startupType: startupType(raw?.startupType || raw?.startMode),
    delayedAuto: boolOrNull(raw?.delayedAuto),
    account: text(raw?.account),
    pid: numberOrNull(raw?.processId ?? raw?.pid),
    binaryPath: text(raw?.binaryPath),
    serviceType: text(raw?.serviceType),
    acceptsStop: boolOrNull(raw?.acceptsStop),
    dependencies: asArray(raw?.dependencies).map((entry) => text(entry)).filter(Boolean),
    dependents: [],
    protected: decision.protected,
    protectionRole: decision.protectionRole,
    protectionReason: decision.protectionReason,
    controllable: !decision.protected,
    source: text(raw?.provider) || 'Win32_Service'
  };
}

function attachDependents(records) {
  const byName = new Map(records.map((record) => [record.name.toLowerCase(), record]));
  for (const record of records) {
    record.dependencies = [...new Set(record.dependencies.filter((name) => byName.has(name.toLowerCase())))];
  }
  for (const record of records) {
    for (const dependency of record.dependencies) {
      const target = byName.get(dependency.toLowerCase());
      if (target && !target.dependents.includes(record.name)) target.dependents.push(record.name);
    }
  }
  return records;
}

function summarize(records) {
  const summary = {
    total: records.length,
    running: 0,
    stopped: 0,
    automatic: 0,
    manual: 0,
    disabled: 0,
    delayed: 0,
    protected: 0,
    thirdParty: 0
  };
  for (const record of records) {
    if (String(record.state).toLowerCase() === 'running') summary.running += 1;
    else if (String(record.state).toLowerCase() === 'stopped') summary.stopped += 1;
    if (record.startupType === 'automatic' && record.delayedAuto !== true) summary.automatic += 1;
    if (record.startupType === 'manual') summary.manual += 1;
    if (record.startupType === 'disabled') summary.disabled += 1;
    if (record.delayedAuto === true) summary.delayed += 1;
    if (record.protected) summary.protected += 1;
    if (record.binaryPath && !/^[a-z]:\\windows(\\|$)/i.test(record.binaryPath)) summary.thirdParty += 1;
  }
  return summary;
}

function edges(records) {
  const result = [];
  for (const record of records) {
    for (const dependency of record.dependencies) result.push({ from: record.name, to: dependency });
  }
  return result;
}

function normalizeEvents(raw = {}, error = null) {
  if (error) {
    return { coverage: { status: 'permission_denied', count: 0, days: 7, reason: error.message || 'Service Control Manager events are not readable.' }, events: [] };
  }
  const status = text(raw.status) || 'unavailable';
  const reason = text(raw.reason);
  const events = asArray(raw.events).map((entry, index) => ({
    id: `scm-event-${numberOrNull(entry.id) ?? 'x'}-${index}`,
    at: iso(entry.timeCreated),
    eventId: numberOrNull(entry.id),
    level: numberOrNull(entry.level),
    provider: text(entry.provider) || 'Service Control Manager',
    serviceName: null,
    message: text(entry.message) || '',
    source: 'System event log'
  }));
  return {
    coverage: {
      status: status === 'available' ? 'available' : status === 'permission_denied' ? 'permission_denied' : 'unavailable',
      count: events.length,
      days: 7,
      reason
    },
    events
  };
}

function normalizeSvchost(raw = {}, error = null) {
  if (error) return [];
  return asArray(raw.processes)
    .map((entry) => ({
      pid: numberOrNull(entry.pid) ?? 0,
      group: text(entry.group),
      workingSetBytes: numberOrNull(entry.workingSetBytes),
      serviceCount: 0,
      services: [],
      source: 'Win32_Process'
    }))
    .filter((entry) => entry.pid > 0);
}

module.exports = {
  SERVICE_TOOLS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS,
  EVENTS_SCRIPT,
  SVCHOST_SCRIPT,
  SERVICE_SCRIPT,
  ELEVATION_SCRIPT,
  DEPENDENCY_SCRIPT,
  asArray,
  text,
  numberOrNull,
  boolOrNull,
  iso,
  startupType,
  protectionDecision,
  normalizeService,
  attachDependents,
  summarize,
  edges,
  normalizeEvents,
  normalizeSvchost
};
