'use strict';

/**
 * KNOuX Gemini - Recovery Lab providers (Mission 11).
 *
 * Fixed read-only PowerShell/executable scripts and pure normalizers for the
 * twelve canonical repair services. No administrative command is executed by
 * this module. DISM/SFC/netsh/service reset specifications are display-only
 * and always carry execution.available:false.
 */

const SERVICE_DEFINITIONS = Object.freeze([
  {
    id: 'repair-component-check',
    world: 'repair',
    labelEn: 'DISM CheckHealth',
    labelAr: 'فحص صحة المكونات',
    state: 'partial',
    risk: 'elevated-read-only',
    provider: 'DISM.exe /Online /Cleanup-Image /CheckHealth',
    noteEn: 'Read-only component store health check. Requires elevation and is not executed by Mission 11.',
    noteAr: 'فحص صحة مخزن المكونات للقراءة فقط. يتطلب رفع صلاحيات ولا تنفذه المهمة 11.'
  },
  {
    id: 'repair-component-scan',
    world: 'repair',
    labelEn: 'DISM ScanHealth',
    labelAr: 'مسح صحة المكونات',
    state: 'partial',
    risk: 'elevated-read-only',
    provider: 'DISM.exe /Online /Cleanup-Image /ScanHealth',
    noteEn: 'Seven-stage component store scan. Planned stages are published; no scan is run automatically.',
    noteAr: 'مسح مخزن المكونات على سبع مراحل. تُنشر المراحل المخططة؛ لا يُشغّل مسح تلقائيًا.'
  },
  {
    id: 'repair-component-restore',
    world: 'repair',
    labelEn: 'DISM RestoreHealth',
    labelAr: 'استعادة صحة المكونات',
    state: 'gated',
    risk: 'administrative',
    provider: 'DISM.exe /Online /Cleanup-Image /RestoreHealth',
    noteEn: 'Repairs the component store. Administrative execution is gated; only an immutable preview is available.',
    noteAr: 'يصلح مخزن المكونات. التنفيذ الإداري محجوب؛ تتوفر معاينة ثابتة فقط.'
  },
  {
    id: 'repair-files-verify',
    world: 'repair',
    labelEn: 'SFC VerifyOnly',
    labelAr: 'تحقق سلامة الملفات',
    state: 'partial',
    risk: 'elevated-read-only',
    provider: 'sfc.exe /verifyonly',
    noteEn: 'Verifies protected system files without repairing them. Requires elevation; not executed here.',
    noteAr: 'يتحقق من ملفات النظام المحمية دون إصلاحها. يتطلب رفع صلاحيات؛ لا يُنفذ هنا.'
  },
  {
    id: 'repair-files-repair',
    world: 'repair',
    labelEn: 'SFC ScanNow',
    labelAr: 'إصلاح ملفات النظام',
    state: 'gated',
    risk: 'administrative',
    provider: 'sfc.exe /scannow',
    noteEn: 'Repairs protected system files. Administrative execution is gated and may require a restart.',
    noteAr: 'يصلح ملفات النظام المحمية. التنفيذ الإداري محجوب وقد يتطلب إعادة تشغيل.'
  },
  {
    id: 'repair-dns-flush',
    world: 'repair',
    labelEn: 'DNS Cache Refresh',
    labelAr: 'تحديث ذاكرة DNS',
    state: 'gated',
    risk: 'administrative',
    provider: 'ipconfig.exe /displaydns + /flushdns preview',
    noteEn: 'Counts the measured resolver cache without exposing records; flushing is a staged change only.',
    noteAr: 'يعدّ ذاكرة المحلل المقيسة دون كشف السجلات؛ المسح تغيير مُهيَّأ فقط.'
  },
  {
    id: 'repair-winsock-reset',
    world: 'repair',
    labelEn: 'Winsock Reset Review',
    labelAr: 'مراجعة إعادة Winsock',
    state: 'gated',
    risk: 'administrative',
    provider: 'netsh.exe winsock show catalog + reset preview',
    noteEn: 'Reads the measured Winsock provider catalog. Resetting it requires elevation, approval and a reboot.',
    noteAr: 'يقرأ كتالوج مزودات Winsock المقيس. تتطلب إعادته رفع صلاحيات وموافقة وإعادة تشغيل.'
  },
  {
    id: 'repair-tcpip-reset',
    world: 'repair',
    labelEn: 'TCP/IP Reset Diff',
    labelAr: 'فرق إعادة TCP/IP',
    state: 'gated',
    risk: 'administrative',
    provider: 'Get-NetIPConfiguration + netsh int ip reset preview',
    noteEn: 'Shows measured adapter configuration against a Windows-default reset preview. Execution is gated.',
    noteAr: 'يعرض تهيئة المحول المقيسة مقابل معاينة إعادة إلى افتراضي Windows. التنفيذ محجوب.'
  },
  {
    id: 'repair-history',
    world: 'repair',
    labelEn: 'Repair Audit Journal',
    labelAr: 'سجل تدقيق الإصلاح',
    state: 'available',
    risk: 'read-only',
    provider: 'Append-only local preview journal',
    noteEn: 'Timestamped immutable previews and blocked attempts. No repair command was executed.',
    noteAr: 'معاينات ثابتة موقوتة ومحاولات محجوبة. لم يُنفذ أي أمر إصلاح.'
  },
  {
    id: 'repair-troubleshooters',
    world: 'repair',
    labelEn: 'Troubleshooter Gateway',
    labelAr: 'بوابة مستكشفات الأعطال',
    state: 'available',
    risk: 'read-only',
    provider: 'Measured OS capability + allowlisted settings handoff',
    noteEn: 'Guided checklists and a fixed Windows settings handoff. No troubleshooters are claimed without evidence.',
    noteAr: 'قوائم فحص موجهة وانتقال ثابت لإعدادات Windows. لا يُدّعى وجود مستكشفات دون دليل.'
  },
  {
    id: 'repair-restore-point',
    world: 'repair',
    labelEn: 'System Restore Inspector',
    labelAr: 'فاحص نقاط الاستعادة',
    state: 'partial',
    risk: 'administrative',
    provider: 'Get-ComputerRestorePoint (elevation may be required)',
    noteEn: 'Lists measured restore points only when Windows grants access. Apply/restore is gated.',
    noteAr: 'يسرد نقاط الاستعادة المقيسة فقط عندما يسمح Windows بالوصول. التطبيق/الاستعادة محجوب.'
  },
  {
    id: 'repair-update-reset',
    world: 'repair',
    labelEn: 'Windows Update Reset',
    labelAr: 'إعادة تهيئة Windows Update',
    state: 'gated',
    risk: 'administrative',
    provider: 'Get-Service + SoftwareDistribution metadata',
    noteEn: 'Shows measured update service and cache state. The servicing reset is an immutable preview only.',
    noteAr: 'يعرض حالة خدمة التحديث والذاكرة المقيسة. إعادة التهيئة معاينة ثابتة فقط.'
  }
]);

function command(id, toolId, labelEn, labelAr, display, risk, elevationRequired, rebootRequired) {
  return {
    id,
    toolId,
    labelEn,
    labelAr,
    display,
    elevationRequired,
    risk,
    rebootRequired,
    execution: {
      available: false,
      reason: 'Mission 11 publishes a fixed preview only. Execution requires an elevated, separately approved executor that is not shipped.'
    }
  };
}

const COMMAND_SPECS = Object.freeze([
  command('repair-cmd-component-check', 'repair-component-check', 'DISM CheckHealth', 'فحص صحة المكونات', 'DISM.exe /Online /Cleanup-Image /CheckHealth', 'elevated-read-only', true, false),
  command('repair-cmd-component-scan', 'repair-component-scan', 'DISM ScanHealth', 'مسح صحة المكونات', 'DISM.exe /Online /Cleanup-Image /ScanHealth', 'elevated-read-only', true, false),
  command('repair-cmd-component-restore', 'repair-component-restore', 'DISM RestoreHealth', 'استعادة صحة المكونات', 'DISM.exe /Online /Cleanup-Image /RestoreHealth', 'administrative', true, false),
  command('repair-cmd-files-verify', 'repair-files-verify', 'SFC VerifyOnly', 'تحقق سلامة الملفات', 'sfc.exe /verifyonly', 'elevated-read-only', true, false),
  command('repair-cmd-files-repair', 'repair-files-repair', 'SFC ScanNow', 'إصلاح ملفات النظام', 'sfc.exe /scannow', 'administrative', true, true),
  command('repair-cmd-dns-flush', 'repair-dns-flush', 'Flush DNS cache', 'مسح ذاكرة DNS', 'ipconfig.exe /flushdns', 'administrative', false, false),
  command('repair-cmd-winsock-reset', 'repair-winsock-reset', 'Reset Winsock catalog', 'إعادة كتالوج Winsock', 'netsh.exe winsock reset', 'administrative', true, true),
  command('repair-cmd-tcpip-reset', 'repair-tcpip-reset', 'Reset TCP/IP stack', 'إعادة مكدس TCP/IP', 'netsh.exe int ip reset', 'administrative', true, true),
  command('repair-cmd-restore-apply', 'repair-restore-point', 'System Restore handoff', 'انتقال استعادة النظام', 'rstrui.exe (interactive Windows restore UI)', 'administrative', true, true),
  command('repair-cmd-update-reset', 'repair-update-reset', 'Windows Update servicing reset', 'إعادة تهيئة خدمة التحديث', 'Stop wuauserv/bits → rename SoftwareDistribution → start services', 'administrative', true, true)
]);

const GATED_OPERATIONS = Object.freeze([
  { id: 'repair.dism.restore', mission: '11', title: 'Run DISM RestoreHealth', reason: 'Repairs the component store and may download servicing content. Requires elevation, explicit approval, bounded execution and postcondition verification.' },
  { id: 'repair.sfc.scannow', mission: '11', title: 'Run SFC ScanNow', reason: 'Repairs protected system files and may require a restart. No elevated executor is shipped in this mission.' },
  { id: 'repair.dns.flush', mission: '11', title: 'Flush the DNS resolver cache', reason: 'Clears measured resolver state and can disrupt name resolution temporarily. Only an immutable preview is available.' },
  { id: 'repair.winsock.reset', mission: '11', title: 'Reset the Winsock catalog', reason: 'Removes layered service providers and requires a reboot. High-risk operation with no execution channel.' },
  { id: 'repair.tcpip.reset', mission: '11', title: 'Reset the TCP/IP stack', reason: 'Disconnects active networking and requires a reboot. Backup and explicit high-risk approval are mandatory before any future executor.' },
  { id: 'repair.restore.apply', mission: '11', title: 'Restore a system restore point', reason: 'Reverts system state and may remove installed software. The Windows restore UI is user-initiated; no silent restore exists.' },
  { id: 'repair.update.reset', mission: '11', title: 'Reset Windows Update servicing state', reason: 'Stops update services and renames the update cache. Disruptive and must be separately approved.' },
  { id: 'repair.elevation.request', mission: '11', title: 'Request elevated execution', reason: 'No automatic elevation exists. A future executor must show a UAC-scoped, fixed-argument capability with explicit consent.' }
]);

const STAGE_DEFINITIONS = Object.freeze([
  { key: 'identity', labelEn: 'Privilege & tool identity', labelAr: 'الصلاحيات وهوية الأدوات' },
  { key: 'servicing', labelEn: 'Servicing logs & component store', labelAr: 'سجلات الخدمة ومخزن المكونات' },
  { key: 'network', labelEn: 'Adapters, DNS cache & Winsock catalog', labelAr: 'المحولات وذاكرة DNS وكتالوج Winsock' },
  { key: 'update', labelEn: 'Update services & cache metadata', labelAr: 'خدمات التحديث وبيانات الذاكرة' },
  { key: 'restore', labelEn: 'Restore point evidence', labelAr: 'أدلة نقاط الاستعادة' },
  { key: 'journal', labelEn: 'Preview journal & troubleshooters', labelAr: 'سجل المعاينات ومستكشفات الأعطال' }
]);

const IDENTITY_SCRIPT = [
  "$ErrorActionPreference='Stop'",
  '$os=Get-CimInstance Win32_OperatingSystem',
  '$id=[Security.Principal.WindowsIdentity]::GetCurrent()',
  '$principal=New-Object Security.Principal.WindowsPrincipal($id)',
  '$pending=$false',
  "if(Test-Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Component Based Servicing\\RebootPending'){$pending=$true}",
  "if(Test-Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsUpdate\\Auto Update\\RebootRequired'){$pending=$true}",
  '[pscustomobject]@{',
  'osName=$os.Caption; osVersion=$os.Version; osBuild=$os.BuildNumber; architecture=$os.OSArchitecture;',
  'isAdmin=$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator);',
  'powershellVersion=$PSVersionTable.PSVersion.ToString();',
  "dismAvailable=(Test-Path (Join-Path $env:SystemRoot 'System32\\dism.exe'));",
  "sfcAvailable=(Test-Path (Join-Path $env:SystemRoot 'System32\\sfc.exe'));",
  'pendingReboot=$pending; systemRoot=$env:SystemRoot',
  '} | ConvertTo-Json -Depth 4 -Compress'
].join('\n');

const SERVICING_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  'function FileInfo([string]$path){',
  '  if(Test-Path -LiteralPath $path){ $item=Get-Item -LiteralPath $path;',
  '    [pscustomobject]@{path=$path;exists=$true;sizeBytes=$(if($item.PSIsContainer){$null}else{$item.Length});lastWrite=$item.LastWriteTimeUtc.ToString("o")}',
  "  } else { [pscustomobject]@{path=$path;exists=$false;sizeBytes=$null;lastWrite=$null} }",
  '}',
  '[pscustomobject]@{',
  "dismLog=(FileInfo (Join-Path $env:SystemRoot 'Logs\\DISM\\dism.log'));",
  "cbsLog=(FileInfo (Join-Path $env:SystemRoot 'Logs\\CBS\\CBS.log'));",
  "componentStore=(FileInfo (Join-Path $env:SystemRoot 'WinSxS'));",
  "pendingCbs=(Test-Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Component Based Servicing\\RebootPending');",
  "pendingWindowsUpdate=(Test-Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsUpdate\\Auto Update\\RebootRequired')",
  '} | ConvertTo-Json -Depth 5 -Compress'
].join('\n');

const NETWORK_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  "$adapters=@(Get-NetAdapter | ForEach-Object {[pscustomobject]@{name=$_.Name;description=$_.InterfaceDescription;status=[string]$_.Status;linkSpeed=$_.LinkSpeed;mac=$_.MacAddress}})",
  "$addresses=@(Get-NetIPAddress -AddressFamily IPv4 | ForEach-Object {[pscustomobject]@{interfaceAlias=$_.InterfaceAlias;address=$_.IPAddress;prefixLength=$_.PrefixLength;origin=[string]$_.PrefixOrigin}})",
  "$dns=@(Get-DnsClientServerAddress -AddressFamily IPv4 | ForEach-Object {[pscustomobject]@{interfaceAlias=$_.InterfaceAlias;servers=@($_.ServerAddresses)}})",
  '[pscustomobject]@{adapters=$adapters;addresses=$addresses;dns=$dns} | ConvertTo-Json -Depth 5 -Compress'
].join('\n');

const UPDATE_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  "$services=@(Get-Service wuauserv,bits,cryptsvc,msiserver,trustedinstaller | ForEach-Object {[pscustomobject]@{name=$_.Name;displayName=$_.DisplayName;status=[string]$_.Status;startType=[string]$_.StartType}})",
  "$sd=Join-Path $env:SystemRoot 'SoftwareDistribution'; $download=Join-Path $sd 'Download'",
  '[pscustomobject]@{',
  'services=$services;',
  'softwareDistribution=[pscustomobject]@{path=$sd;exists=(Test-Path $sd)};',
  'download=[pscustomobject]@{path=$download;exists=(Test-Path $download);items=$(if(Test-Path $download){@(Get-ChildItem -LiteralPath $download -ErrorAction SilentlyContinue).Count}else{$null})};',
  "pendingReboot=(Test-Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsUpdate\\Auto Update\\RebootRequired')",
  '} | ConvertTo-Json -Depth 5 -Compress'
].join('\n');

const RESTORE_SCRIPT = [
  "$ErrorActionPreference='Stop'",
  "$out=[ordered]@{status='unavailable';points=@();enabled=$null;reason=$null}",
  'try {',
  '  $points=@(Get-ComputerRestorePoint -ErrorAction Stop)',
  "  $out.status='available'",
  '  $out.points=@($points | ForEach-Object {[pscustomobject]@{sequenceNumber=[int]$_.SequenceNumber;description=[string]$_.Description;createdAt=[string]$_.CreationTime;type=[int]$_.RestorePointType}})',
  "} catch { $out.status='permission_denied'; $out.reason=$_.Exception.Message }",
  '[pscustomobject]$out | ConvertTo-Json -Depth 5 -Compress'
].join('\n');

const TROUBLESHOOT_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  "msdtAvailable=(Test-Path (Join-Path $env:SystemRoot 'System32\\msdt.exe'))".replace(/^/, '$'),
  "$commandAvailable=$false; try { $commandAvailable=[bool](Get-Command Get-TroubleshootingPack -ErrorAction Stop) } catch { $commandAvailable=$false }",
  '[pscustomobject]@{msdtAvailable=$msdtAvailable;commandAvailable=$commandAvailable} | ConvertTo-Json -Compress'
].join('\n');

const TROUBLESHOOTER_CATEGORIES = Object.freeze([
  {
    id: 'network',
    labelEn: 'Network & Internet',
    labelAr: 'الشبكة والإنترنت',
    checklistEn: ['Confirm the adapter is up in the measured evidence.', 'Compare DNS resolvers before changing anything.', 'Preview DNS/Winsock/TCPIP actions in the dedicated tools.'],
    checklistAr: ['تأكد من أن المحول متصل في الأدلة المقيسة.', 'قارن محللات DNS قبل أي تغيير.', 'عاين إجراءات DNS/Winsock/TCPIP في أدواتها المخصصة.'],
    settingsTarget: 'troubleshoot'
  },
  {
    id: 'audio',
    labelEn: 'Audio playback',
    labelAr: 'تشغيل الصوت',
    checklistEn: ['Open Windows Sound settings for endpoint selection.', 'Capture the measured audio endpoint inventory in System.', 'Do not reinstall drivers without a staged repair plan.'],
    checklistAr: ['افتح إعدادات الصوت في Windows لاختيار نقطة التشغيل.', 'راجع جرد نقاط الصوت المقيس في النظام.', 'لا تعد تثبيت التعريفات دون خطة إصلاح مُهيَّأة.'],
    settingsTarget: 'troubleshoot'
  },
  {
    id: 'printer',
    labelEn: 'Printer queue',
    labelAr: 'قائمة الطباعة',
    checklistEn: ['Use Windows settings for the installed printer list.', 'Repair world does not enumerate or modify printer queues.', 'Stage any driver servicing under Mission 11 review.'],
    checklistAr: ['استخدم إعدادات Windows لقائمة الطابعات المثبتة.', 'لا يسرد عالم الإصلاح قوائم الطباعة أو يعدلها.', 'هيّئ أي خدمة تعريفات تحت مراجعة المهمة 11.'],
    settingsTarget: 'troubleshoot'
  },
  {
    id: 'update',
    labelEn: 'Windows Update',
    labelAr: 'Windows Update',
    checklistEn: ['Check measured wuauserv/BITS state first.', 'Preview the servicing reset; execution is not available.', 'Open Windows Update settings for the user-initiated path.'],
    checklistAr: ['افحص حالة wuauserv/BITS المقيسة أولًا.', 'عاين إعادة تهيئة الخدمة؛ التنفيذ غير متاح.', 'افتح إعدادات Windows Update للمسار الذي يبدأه المستخدم.'],
    settingsTarget: 'windowsupdate'
  }
]);

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

function fileEvidence(raw, fallbackPath = null) {
  return {
    path: text(raw?.path) || fallbackPath,
    exists: boolOrNull(raw?.exists),
    sizeBytes: numberOrNull(raw?.sizeBytes),
    lastWrite: iso(raw?.lastWrite)
  };
}

function normalizeIdentity(raw = {}) {
  return {
    osName: text(raw.osName),
    osVersion: text(raw.osVersion),
    osBuild: text(raw.osBuild),
    architecture: text(raw.architecture),
    isAdmin: boolOrNull(raw.isAdmin),
    elevationMethod: 'user-initiated UAC only',
    powershellVersion: text(raw.powershellVersion),
    dismAvailable: boolOrNull(raw.dismAvailable),
    sfcAvailable: boolOrNull(raw.sfcAvailable),
    safeBoot: null,
    pendingReboot: boolOrNull(raw.pendingReboot),
    systemRoot: text(raw.systemRoot),
    observedAt: new Date().toISOString()
  };
}

function normalizeServicing(raw = {}) {
  return {
    dismLog: fileEvidence(raw.dismLog, 'C:\\Windows\\Logs\\DISM\\dism.log'),
    cbsLog: fileEvidence(raw.cbsLog, 'C:\\Windows\\Logs\\CBS\\CBS.log'),
    componentStore: fileEvidence(raw.componentStore, 'C:\\Windows\\WinSxS'),
    pendingCbs: boolOrNull(raw.pendingCbs),
    pendingWindowsUpdate: boolOrNull(raw.pendingWindowsUpdate),
    componentStoreHealth: 'not-run',
    note: 'DISM/SFC were not executed. Log and component-store metadata are measured; health cannot be inferred from file metadata.'
  };
}

function normalizeNetwork(raw = {}) {
  return {
    adapters: asArray(raw.adapters).map((entry) => ({
      name: text(entry.name) || 'Unnamed adapter',
      description: text(entry.description),
      status: text(entry.status),
      linkSpeed: text(entry.linkSpeed),
      mac: text(entry.mac)
    })),
    addresses: asArray(raw.addresses).map((entry) => ({
      interfaceAlias: text(entry.interfaceAlias) || 'unknown',
      address: text(entry.address) || '—',
      prefixLength: numberOrNull(entry.prefixLength),
      origin: text(entry.origin)
    })),
    dnsServers: asArray(raw.dns).map((entry) => ({
      interfaceAlias: text(entry.interfaceAlias) || 'unknown',
      servers: asArray(entry.servers).map((server) => text(server)).filter(Boolean)
    }))
  };
}

function normalizeDnsCache(stdout, error) {
  if (error) {
    return { status: 'unavailable', entryCount: null, note: 'ipconfig /displaydns did not answer; no cache size is invented.', source: 'ipconfig.exe /displaydns' };
  }
  const entries = String(stdout || '').split(/\r?\n/).filter((line) => /^\s*Record Name\s*[.:]/i.test(line)).length;
  return {
    status: 'measured',
    entryCount: entries,
    note: entries
      ? 'Only the record count is measured. Cached domain names are intentionally not displayed or persisted.'
      : 'The measured resolver cache reported zero record names. No domain is displayed.',
    source: 'ipconfig.exe /displaydns'
  };
}

function normalizeWinsock(stdout, error) {
  if (error) {
    return { status: 'unavailable', providerCount: null, categories: [], note: 'The Winsock catalog did not answer.', source: 'netsh.exe winsock show catalog' };
  }
  const raw = String(stdout || '');
  const blocks = raw.split(/Winsock Catalog Provider Entry/i).slice(1);
  const categories = [...new Set(blocks.map((block) => {
    const match = block.match(/Entry Type:\s*(.+)/i);
    return text(match?.[1]);
  }).filter(Boolean))];
  return {
    status: 'measured',
    providerCount: blocks.length,
    categories,
    note: blocks.length
      ? 'Measured provider catalog metadata only. Layer paths are not persisted.'
      : 'The Winsock catalog returned no provider entries.',
    source: 'netsh.exe winsock show catalog'
  };
}

function normalizeUpdate(raw = {}) {
  return {
    services: asArray(raw.services).map((entry) => ({
      name: text(entry.name) || 'unknown',
      displayName: text(entry.displayName),
      status: text(entry.status),
      startType: text(entry.startType)
    })),
    softwareDistribution: {
      path: text(raw.softwareDistribution?.path) || 'C:\\Windows\\SoftwareDistribution',
      exists: boolOrNull(raw.softwareDistribution?.exists)
    },
    download: {
      path: text(raw.download?.path) || 'C:\\Windows\\SoftwareDistribution\\Download',
      exists: boolOrNull(raw.download?.exists),
      items: numberOrNull(raw.download?.items)
    },
    pendingReboot: boolOrNull(raw.pendingReboot),
    note: 'Service and cache metadata are measured. The update reset sequence is not executed.'
  };
}

const RESTORE_TYPES = {
  0: 'Application install',
  1: 'Application uninstall',
  2: 'Device driver install',
  3: 'Modify settings',
  4: 'Cancelled operation',
  6: 'Restore',
  7: 'Checkpoint',
  9: 'System checkpoint'
};

function normalizeRestore(raw = {}, error) {
  if (error) {
    return { status: 'permission_denied', points: [], enabled: null, reason: error.message || 'Restore point access was denied.', source: 'Get-ComputerRestorePoint' };
  }
  const status = text(raw.status) || 'unavailable';
  const points = asArray(raw.points).map((entry) => ({
    sequenceNumber: numberOrNull(entry.sequenceNumber) ?? 0,
    description: text(entry.description),
    createdAt: iso(entry.createdAt),
    type: RESTORE_TYPES[numberOrNull(entry.type)] || (entry.type == null ? null : String(entry.type))
  }));
  return {
    status: status === 'available' && points.length ? 'available' : status === 'permission_denied' ? 'permission_denied' : 'unavailable',
    points,
    enabled: status === 'available' ? true : null,
    reason: text(raw.reason) || (status === 'available' && !points.length ? 'Windows returned no restore point.' : null),
    source: 'Get-ComputerRestorePoint'
  };
}

function normalizeTroubleshooters(raw = {}, error) {
  return {
    msdtAvailable: error ? null : boolOrNull(raw.msdtAvailable),
    commandAvailable: error ? null : boolOrNull(raw.commandAvailable),
    settingsTarget: 'troubleshoot',
    categories: TROUBLESHOOTER_CATEGORIES.map((entry) => ({ ...entry, checklistEn: [...entry.checklistEn], checklistAr: [...entry.checklistAr] })),
    note: error
      ? 'Windows troubleshooter capability could not be measured. No troubleshooter is claimed.'
      : 'Only measured capability is reported. Category cards open allowlisted Windows settings; they do not launch a silent repair.'
  };
}

module.exports = {
  SERVICE_DEFINITIONS,
  COMMAND_SPECS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS,
  TROUBLESHOOTER_CATEGORIES,
  IDENTITY_SCRIPT,
  SERVICING_SCRIPT,
  NETWORK_SCRIPT,
  UPDATE_SCRIPT,
  RESTORE_SCRIPT,
  TROUBLESHOOT_SCRIPT,
  asArray,
  text,
  numberOrNull,
  boolOrNull,
  iso,
  normalizeIdentity,
  normalizeServicing,
  normalizeNetwork,
  normalizeDnsCache,
  normalizeWinsock,
  normalizeUpdate,
  normalizeRestore,
  normalizeTroubleshooters
};
