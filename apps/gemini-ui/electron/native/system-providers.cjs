'use strict';

/**
 * KNOuX Gemini - measured Windows observatory providers (Mission 10).
 *
 * These scripts extend the audited root Windows providers. Every collector is
 * read-only, bounded and individually guarded so one unavailable Windows class
 * degrades a stage instead of destroying the whole observation. No script
 * writes a registry value, file, service, process, adapter or setting.
 *
 * The coordinator injects `powershellJson` and `runFile`; tests inject fakes,
 * so no test touches the real machine.
 */

const crypto = require('node:crypto');

const MAX_PROCESS_ROWS = 320;
const MAX_DRIVER_ROWS = 300;
const MAX_EVENT_ROWS = 300;
const MAX_CHANNEL_ROWS = 240;
const MAX_SOCKET_ROWS = 420;
const MAX_NEIGHBOR_ROWS = 240;

const SYSTEM_CORE_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  '$os=Get-CimInstance Win32_OperatingSystem',
  '$cs=Get-CimInstance Win32_ComputerSystem',
  '$bios=Get-CimInstance Win32_BIOS',
  '$bb=Get-CimInstance Win32_BaseBoard',
  '$tz=(Get-TimeZone).Id',
  '$culture=(Get-Culture).Name',
  '$cpu=@(Get-CimInstance Win32_Processor)',
  '$gpu=@(Get-CimInstance Win32_VideoController)',
  '$mem=@(Get-CimInstance Win32_PhysicalMemory)',
  '$disks=@(Get-PhysicalDisk | ForEach-Object { $d=$_; $rel=$null; try{$rel=Get-StorageReliabilityCounter -PhysicalDisk $d -ErrorAction Stop}catch{}; [pscustomobject]@{DeviceId=[string]$d.DeviceId;FriendlyName=[string]$d.FriendlyName;SerialNumber=[string]$d.SerialNumber;MediaType=[string]$d.MediaType;BusType=[string]$d.BusType;Size=[uint64]$d.Size;HealthStatus=[string]$d.HealthStatus;OperationalStatus=@($d.OperationalStatus|ForEach-Object{[string]$_});PowerOnHours=if($rel){$rel.PowerOnHours}else{$null};Temperature=if($rel){$rel.Temperature}else{$null};Wear=if($rel){$rel.Wear}else{$null}} })',
  '$diskInfo=@(Get-Disk | Select-Object Number,FriendlyName,SerialNumber,PartitionCount,OperationalStatus,HealthStatus,BusType,Size)',
  '$logical=@(Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID,Size,FreeSpace,VolumeName,DriveType)',
  '$battery=@(Get-CimInstance Win32_Battery | Select-Object Name,DeviceID,EstimatedChargeRemaining,BatteryStatus,DesignCapacity,FullChargeCapacity,EstimatedRunTime,Status)',
  '$batStatic=@(Get-CimInstance -Namespace root/WMI -ClassName BatteryStaticData | Select-Object InstanceName,DesignedCapacity,DeviceName,ManufactureName,Chemistry)',
  '$batFull=@(Get-CimInstance -Namespace root/WMI -ClassName BatteryFullChargedCapacity | Select-Object InstanceName,FullChargedCapacity)',
  '$batStatus=@(Get-CimInstance -Namespace root/WMI -ClassName BatteryStatus | Select-Object InstanceName,PowerOnline,Discharging,Charging,RemainingCapacity,Voltage,Rate)',
  '$batCycles=@(Get-CimInstance -Namespace root/WMI -ClassName BatteryCycleCount | Select-Object InstanceName,CycleCount)',
  '$monitors=@(Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorID | Select-Object InstanceName,ManufacturerName,UserFriendlyName,SerialNumberID,YearOfManufacture,WeekOfManufacture,Active)',
  '$desktopMonitors=@(Get-CimInstance Win32_DesktopMonitor | Select-Object Name,DeviceID,ScreenWidth,ScreenHeight,Status,PNPDeviceID)',
  '$audio=@(Get-CimInstance Win32_SoundDevice | Select-Object Name,Manufacturer,Status,PNPDeviceID,DeviceID)',
  '$audioEndpoints=@(Get-PnpDevice -Class AudioEndpoint | Select-Object FriendlyName,InstanceId,Status,Class,Manufacturer)',
  '$usbControllers=@(Get-CimInstance Win32_USBController | Select-Object Name,Manufacturer,Status,DeviceID,PNPDeviceID)',
  '$usbHubs=@(Get-CimInstance Win32_USBHub | Select-Object Name,DeviceID,PNPDeviceID,Status)',
  '$usbDevices=@(Get-CimInstance Win32_PnPEntity | Where-Object { $_.PNPClass -eq \'USB\' } | Select-Object Name,Manufacturer,Status,DeviceID,PNPDeviceID,PNPClass)',
  '$usbLinks=@(Get-CimInstance Win32_USBControllerDevice | ForEach-Object { [pscustomobject]@{Controller=[string]$_.Antecedent;Device=[string]$_.Dependent} })',
  '$problem=@(Get-CimInstance Win32_PnPEntity | Where-Object { $_.ConfigManagerErrorCode -ne 0 } | Select-Object Name,PNPDeviceID,ConfigManagerErrorCode,Manufacturer)',
  '$thermal=@(Get-CimInstance -Namespace root/WMI -ClassName MSAcpi_ThermalZoneTemperature | Select-Object InstanceName,CurrentTemperature)',
  '$tempProbe=@(Get-CimInstance Win32_TemperatureProbe | Select-Object Name,CurrentReading,Status)',
  '$fast=Get-ItemProperty \'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power\' -Name HiberbootEnabled',
  '$bootEvents=@(Get-WinEvent -FilterHashtable @{LogName=\'Microsoft-Windows-Diagnostics-Performance/Operational\';Id=100,101,102,103,109,110} -MaxEvents 40 | Select-Object TimeCreated,Id,ProviderName,Message)',
  '[pscustomobject]@{os=$os;cs=$cs;bios=$bios;baseboard=$bb;timeZone=$tz;culture=$culture;cpu=$cpu;gpu=$gpu;memory=$mem;disks=$disks;diskInfo=$diskInfo;logicalDisks=$logical;battery=$battery;batteryStatic=$batStatic;batteryFull=$batFull;batteryStatus=$batStatus;batteryCycles=$batCycles;monitors=$monitors;desktopMonitors=$desktopMonitors;audio=$audio;audioEndpoints=$audioEndpoints;usbControllers=$usbControllers;usbHubs=$usbHubs;usbDevices=$usbDevices;usbLinks=$usbLinks;problemDevices=$problem;thermal=$thermal;temperatureProbe=$tempProbe;fastStartup=if($fast){$fast.HiberbootEnabled}else{$null};bootEvents=$bootEvents} | ConvertTo-Json -Depth 7 -Compress'
].join('; ');

const PROCESS_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  `$procs=@(Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,ExecutablePath,CommandLine,CreationDate,WorkingSetSize,ThreadCount,HandleCount,KernelModeTime,UserModeTime,CompanyName,Description)`,
  '$perf=@(Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Select-Object IDProcess,Name,PercentProcessorTime,WorkingSetPrivate,ThreadCount)',
  '$users=@()',
  'try{$users=@(Get-Process -IncludeUserName | Select-Object Id,UserName)}catch{}',
  '[pscustomobject]@{processes=$procs;perf=$perf;users=$users} | ConvertTo-Json -Depth 6 -Compress'
].join('; ');

const SERVICE_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  '$services=@(Get-CimInstance Win32_Service | Select-Object Name,DisplayName,State,StartMode,ProcessId,PathName,Description,DelayedAutoStart)',
  '$deps=@(Get-CimInstance Win32_DependentService | Select-Object @{n=\'dependee\';e={[string]$_.Antecedent}},@{n=\'dependent\';e={[string]$_.Dependent}})',
  '$startup=@(Get-CimInstance Win32_StartupCommand | Select-Object Name,Command,Location,User)',
  '[pscustomobject]@{services=$services;dependencies=$deps;startup=$startup} | ConvertTo-Json -Depth 5 -Compress'
].join('; ');

const DRIVER_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  '$drivers=@(Get-CimInstance Win32_PnPSignedDriver | Select-Object DeviceName,DriverProviderName,DriverVersion,DriverDate,InfName,IsSigned,Signer,DeviceID,HardwareID,DeviceClass)',
  '[pscustomobject]@{drivers=$drivers} | ConvertTo-Json -Depth 5 -Compress'
].join('; ');

const EVENT_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  '$start=(Get-Date).AddDays(-7)',
  "$events=@(Get-WinEvent -FilterHashtable @{LogName='System','Application';Level=1,2,3;StartTime=$start} -MaxEvents 300 | Select-Object TimeCreated,Id,ProviderName,LevelDisplayName,Level,Message,RecordId,LogName,UserId,ActivityId)",
  '$channels=@(Get-WinEvent -ListLog * | Select-Object LogName,RecordCount,FileSize,IsEnabled,LogMode,LogFilePath,LastWriteTime)',
  '[pscustomobject]@{events=$events;channels=$channels} | ConvertTo-Json -Depth 5 -Compress'
].join('; ');

const NETWORK_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  '$adapters=@(Get-NetAdapter | Select-Object Name,InterfaceDescription,Status,MacAddress,LinkSpeed,MediaType,InterfaceIndex,ifAlias,PhysicalMediaType,Virtual)',
  '$addresses=@(Get-NetIPAddress | Select-Object InterfaceAlias,InterfaceIndex,IPAddress,PrefixLength,AddressFamily,PrefixOrigin,SuffixOrigin,AddressState,Type)',
  '$interfaces=@(Get-NetIPInterface | Select-Object InterfaceAlias,InterfaceIndex,Dhcp,ConnectionState,InterfaceDescription,NlMtu,AutomaticMetric)',
  '$dns=@(Get-DnsClientServerAddress | Select-Object InterfaceAlias,InterfaceIndex,ServerAddresses)',
  '$dnsClient=@(Get-DnsClient | Select-Object InterfaceAlias,InterfaceIndex,ConnectionSpecificSuffix,RegisterThisConnectionsAddress)',
  "$routes=@(Get-NetRoute | Where-Object { $_.DestinationPrefix -eq '0.0.0.0/0' -or $_.DestinationPrefix -eq '::/0' } | Select-Object InterfaceAlias,InterfaceIndex,DestinationPrefix,NextHop,RouteMetric,PolicyStore)",
  "$neighbors=@(Get-NetNeighbor | Where-Object { $_.State -ne 'Unreachable' } | Select-Object InterfaceAlias,IPAddress,LinkLayerAddress,State,AddressFamily)",
  '[pscustomobject]@{adapters=$adapters;addresses=$addresses;interfaces=$interfaces;dns=$dns;dnsClient=$dnsClient;routes=$routes;neighbors=$neighbors} | ConvertTo-Json -Depth 5 -Compress'
].join('; ');

const SOCKET_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  '$tcp=@(Get-NetTCPConnection | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess,CreationTime)',
  '$udp=@(Get-NetUDPEndpoint | Select-Object LocalAddress,LocalPort,OwningProcess,CreationTime)',
  '[pscustomobject]@{tcp=$tcp;udp=$udp} | ConvertTo-Json -Depth 5 -Compress'
].join('; ');

const PROXY_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  "$inet=Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'",
  "$winhttp=(& netsh winhttp show proxy) -join \"`n\"",
  '[pscustomobject]@{proxyEnable=$inet.ProxyEnable;proxyServer=$inet.ProxyServer;proxyOverride=$inet.ProxyOverride;autoConfigURL=$inet.AutoConfigURL;autoDetect=$inet.AutoDetect;winhttp=$winhttp} | ConvertTo-Json -Depth 4 -Compress'
].join('; ');

const SAMPLE_SCRIPT = [
  "$ErrorActionPreference='SilentlyContinue'",
  `$cpu=Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'"`,
  '$mem=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory',
  `$disk=Get-CimInstance Win32_PerfFormattedData_PerfDisk_PhysicalDisk -Filter "Name='_Total'"`,
  `$net=@(Get-CimInstance Win32_PerfFormattedData_Tcpip_NetworkInterface | Where-Object { $_.Name -notmatch 'Loopback|isatap|Pseudo' })`,
  '$os=Get-CimInstance Win32_OperatingSystem',
  '$proc=@(Get-Process)',
  '$freq=(Get-CimInstance Win32_Processor | Measure-Object -Property CurrentClockSpeed -Average).Average',
  '[pscustomobject]@{cpuPercent=$cpu.PercentProcessorTime;memAvailableBytes=$mem.AvailableBytes;memCommittedBytes=$mem.CommittedBytes;memCommitLimit=$mem.CommitLimit;diskRead=$disk.DiskReadBytesPerSec;diskWrite=$disk.DiskWriteBytesPerSec;diskLatencySec=$disk.AvgDiskSecPerTransfer;netIn=($net|Measure-Object BytesReceivedPerSec -Sum).Sum;netOut=($net|Measure-Object BytesSentPerSec -Sum).Sum;totalVisible=$os.TotalVisibleMemorySize;freePhysical=$os.FreePhysicalMemory;processCount=$proc.Count;frequencyMHz=$freq} | ConvertTo-Json -Depth 4 -Compress'
].join('; ');

const SERVICE_DEFINITIONS = Object.freeze([
  { id: 'system-health-check', world: 'system', labelEn: 'Live Pulse', labelAr: 'النبض الحي', state: 'available', provider: 'Win32_OperatingSystem + Win32_PerfFormattedData + Win32_Processor', noteEn: 'Four measured system instruments with source chips and a timestamped performance series.', noteAr: 'أربعة مقاييس نظام مقيسة مع شارات المصدر وسلسلة أداء موقوتة.' },
  { id: 'system-events', world: 'system', labelEn: 'Event Severity Ledger', labelAr: 'سجل شدة الأحداث', state: 'available', provider: 'Get-WinEvent System/Application', noteEn: 'Reads bounded System and Application error/warning events for the last seven days.', noteAr: 'يقرأ أحداث الخطأ والتحذير المقيدة من System وApplication خلال الأيام السبعة الماضية.' },
  { id: 'system-processes', world: 'system', labelEn: 'Process Register', labelAr: 'سجل العمليات', state: 'available', provider: 'Win32_Process + PerfProc', noteEn: 'Lists measured PIDs, parent PIDs, working sets, threads and CPU share. No termination channel exists.', noteAr: 'يعرض معرّفات العمليات والعمليات الأم ومجموعات العمل والخيوط وحصة المعالج. لا توجد قناة إنهاء.' },
  { id: 'system-signatures', world: 'system', labelEn: 'Authenticode Inspector', labelAr: 'مفتش Authenticode', state: 'available', provider: 'Get-AuthenticodeSignature', noteEn: 'Verifies a bounded selected set of executable paths on explicit request.', noteAr: 'يتحقق من مجموعة محدودة من مسارات الملفات التنفيذية عند الطلب الصريح فقط.' },
  { id: 'system-uptime', world: 'system', labelEn: 'Boot & Session Clock', labelAr: 'ساعة الإقلاع والجلسة', state: 'available', provider: 'Win32_OperatingSystem + Diagnostics-Performance', noteEn: 'Last boot, uptime and measured boot diagnostics events. No shutdown reason is invented.', noteAr: 'آخر إقلاع ومدة التشغيل وأحداث تشخيص الإقلاع المقيسة. لا يُختلق سبب إيقاف.' },
  { id: 'system-perf', world: 'system', labelEn: 'Performance Pulse', labelAr: 'نبض الأداء', state: 'available', provider: 'PerfOS / PerfDisk / Tcpip counters', noteEn: 'Live CPU, memory, disk and network samples with measured timestamps.', noteAr: 'عينات حية للمعالج والذاكرة والقرص والشبكة بطوابع زمنية مقيسة.' },
  { id: 'system-drivers', world: 'system', labelEn: 'Driver Inventory', labelAr: 'جرد برامج التشغيل', state: 'available', provider: 'Win32_PnPSignedDriver', noteEn: 'Bounded signed-driver inventory with provider, version, INF and signer evidence.', noteAr: 'جرد مقيد لبرامج التشغيل الموقعة مع المزوّد والإصدار وملف INF ودليل التوقيع.' },
  { id: 'system-logs', world: 'system', labelEn: 'Event Channel Explorer', labelAr: 'مستكشف قنوات الأحداث', state: 'available', provider: 'Get-WinEvent -ListLog', noteEn: 'Reads channel paths, sizes, retention and record counts. No clear-log channel exists.', noteAr: 'يقرأ مسارات القنوات وأحجامها وسياسة الاحتفاظ وعدد السجلات. لا توجد قناة مسح للسجل.' },
  { id: 'system-resources', world: 'system', labelEn: 'Top Resource Consumers', labelAr: 'أعلى مستهلكي الموارد', state: 'available', provider: 'PerfProc + Win32_Process', noteEn: 'Ranks measured processes by CPU, memory, threads or handles. Protected processes stay read-only.', noteAr: 'يرتب العمليات المقيسة حسب المعالج أو الذاكرة أو الخيوط أو المقابض. تبقى العمليات المحمية للقراءة فقط.' },
  { id: 'system-autostart', world: 'system', labelEn: 'App-to-Process Links', labelAr: 'روابط التطبيقات والعمليات', state: 'partial', provider: 'Win32_StartupCommand + Win32_Process + Win32_Service', noteEn: 'Cross-links autoruns to measured processes and services by binary evidence; unresolved rows are labeled unlinked.', noteAr: 'يربط مداخل بدء التشغيل بالعمليات والخدمات المقيسة عبر دليل الملف التنفيذي؛ الصفوف غير المحلولة تُوسم كغير مرتبطة.' },
  { id: 'system-services-map', world: 'system', labelEn: 'Service Dependency Graph', labelAr: 'خريطة تبعية الخدمات', state: 'available', provider: 'Win32_Service + Win32_DependentService', noteEn: 'Directed dependency map with protected-service badges. Service control is not exposed.', noteAr: 'خريطة تبعية موجهة مع شارات الخدمات المحمية. التحكم بالخدمات غير متاح.' },
  { id: 'system-timeline', world: 'system', labelEn: 'Unified Event Timeline', labelAr: 'الخط الزمني الموحد للأحداث', state: 'partial', provider: 'Measured Windows events + observation markers', noteEn: 'Windows and observation lanes are measured. The KNOuX lane is empty because no mutation was executed.', noteAr: 'مسارات Windows والملاحظات مقيسة. مسار KNOuX فارغ لأن أي عملية تغيير لم تُنفذ.' },

  { id: 'network-interfaces', world: 'network', labelEn: 'Interface Console', labelAr: 'وحدة تحكم الواجهات', state: 'available', provider: 'Get-NetAdapter + Get-NetIPAddress + Get-DnsClient', noteEn: 'Measured adapter, address, gateway, DNS and DHCP state for every interface.', noteAr: 'حالة المحول والعنوان والبوابة وDNS وDHCP المقيسة لكل واجهة.' },
  { id: 'network-dns-config', world: 'network', labelEn: 'DNS Resolver Dossier', labelAr: 'ملف محللات DNS', state: 'available', provider: 'Get-DnsClient + Get-DnsClientServerAddress', noteEn: 'Per-adapter resolvers, suffix search from Windows DNS client state, and a bounded test query draft.', noteAr: 'محللات لكل محول ولاحقة البحث من حالة عميل DNS في Windows ومسودة استعلام اختبار مقيدة.' },
  { id: 'network-adapters', world: 'network', labelEn: 'NIC Rack', labelAr: 'رف بطاقات الشبكة', state: 'available', provider: 'Get-NetAdapter + PnP identity', noteEn: 'Physical and virtual adapter rack with measured link, MAC and bus evidence.', noteAr: 'رف للمحولات الفعلية والافتراضية مع دليل السرعة وعنوان MAC والناقل.' },
  { id: 'network-connectivity', world: 'network', labelEn: 'Connectivity Console', labelAr: 'وحدة تحكم الاتصال', state: 'available', provider: 'DNS + TCP + HTTP probes', noteEn: 'Runs a bounded DNS, TCP and HTTP sequence against one validated target. No raw command reaches the renderer.', noteAr: 'ينفذ تسلسل DNS وTCP وHTTP مقيدًا تجاه هدف واحد تم التحقق منه. لا يصل أي أمر خام إلى الواجهة.' },
  { id: 'network-throughput', world: 'network', labelEn: 'Traffic Pulse', labelAr: 'نبض حركة المرور', state: 'available', provider: 'Tcpip network interface counters', noteEn: 'Measured download/upload counters with pause and unit controls. No traffic is generated.', noteAr: 'عدادات تنزيل ورفع مقيسة مع إيقاف مؤقت وتحكم بالوحدات. لا تُولّد أي حركة.' },
  { id: 'network-traceroute', world: 'network', labelEn: 'Hop Route Visualizer', labelAr: 'مصور مسار القفزات', state: 'available', provider: 'tracert -d bounded', noteEn: 'Runs a bounded hop trace on explicit request and shows measured loss/timeout markers.', noteAr: 'ينفذ تتبع قفزات مقيدًا عند الطلب الصريح ويعرض علامات الفقد والمهلة المقيسة.' },
  { id: 'network-topology', world: 'network', labelEn: 'LAN Topology', labelAr: 'طوبولوجيا الشبكة المحلية', state: 'partial', provider: 'Get-NetNeighbor + route table', noteEn: 'Shows only observed ARP/NDP neighbors. No subnet sweep or packet injection is performed.', noteAr: 'يعرض فقط جيران ARP/NDP المرصودين. لا يتم مسح للنطاق الفرعي أو حقن حزم.' },
  { id: 'network-ports', world: 'network', labelEn: 'Socket Explorer', labelAr: 'مستكشف المقابس', state: 'available', provider: 'Get-NetTCPConnection + Get-NetUDPEndpoint', noteEn: 'Reads active TCP/UDP endpoints and measured process owners. No socket is closed.', noteAr: 'يقرأ نقاط TCP/UDP النشطة ومالكي العمليات المقيسين. لا يُغلق أي مقبس.' },
  { id: 'network-wifi', world: 'network', labelEn: 'Wi-Fi Instrument', labelAr: 'مقياس Wi-Fi', state: 'partial', provider: 'netsh wlan show interfaces + Get-NetAdapter', noteEn: 'Signal, radio and profile evidence when the Windows WLAN service answers; absent radios are labeled unsupported.', noteAr: 'دليل الإشارة والراديو والملف الشخصي عندما تستجيب خدمة WLAN في Windows؛ الراديو الغائب يُوسم كغير مدعوم.' },
  { id: 'network-hosts', world: 'network', labelEn: 'Hosts File Inspector', labelAr: 'مفتش ملف hosts', state: 'gated', provider: 'Read-only file read + immutable draft', noteEn: 'Reads the real hosts file. Draft edits are immutable previews; writing the file is gated by explicit approval.', noteAr: 'يقرأ ملف hosts الفعلي. تعديلات المسودة معاينات غير قابلة للتغيير؛ الكتابة محجوبة بموافقة صريحة.' },
  { id: 'network-proxies', world: 'network', labelEn: 'Proxy Configuration Graph', labelAr: 'رسم إعدادات الوكيل', state: 'available', provider: 'Internet Settings + WinHTTP', noteEn: 'Reads WinINET, WinHTTP and auto-detect lanes with provenance. No proxy setting is written.', noteAr: 'يقرأ مسارات WinINET وWinHTTP والكشف التلقائي مع المصدر. لا تُكتب أي إعدادات وكيل.' },
  { id: 'network-repair-link', world: 'network', labelEn: 'Network Recovery Preview', labelAr: 'معاينة استعادة الشبكة', state: 'gated', provider: 'Immutable repair plan', noteEn: 'Stages DNS flush, Winsock reset and TCP/IP reset previews with downtime warnings. Execution is not exposed.', noteAr: 'يهيئ معاينات مسح DNS وإعادة تعيين Winsock وTCP/IP مع تحذيرات التوقف. التنفيذ غير متاح.' },

  { id: 'hardware-inventory', world: 'hardware', labelEn: 'Hardware Atlas', labelAr: 'أطلس العتاد', state: 'available', provider: 'Win32_ComputerSystem + SMBIOS + CIM', noteEn: 'Measured system, CPU, GPU, memory, disk, battery, USB, display and audio inventory.', noteAr: 'جرد مقيس للنظام والمعالج وGPU والذاكرة والقرص والبطارية وUSB والشاشة والصوت.' },
  { id: 'hardware-battery', world: 'hardware', labelEn: 'Battery Charge Gauge', labelAr: 'مقياس شحن البطارية', state: 'partial', provider: 'Win32_Battery + BatteryStatus', noteEn: 'Charge, power source and capacity are measured. Cycle count is reported only when Windows exposes it.', noteAr: 'الشحن ومصدر الطاقة والسعة مقيسة. عدد الدورات يُعرض فقط عندما يوفره Windows.' },
  { id: 'hardware-cpu', world: 'hardware', labelEn: 'Processor Die', labelAr: 'شريحة المعالج', state: 'available', provider: 'Win32_Processor', noteEn: 'Cores, logical processors, clock, cache and virtualization firmware evidence from CIM.', noteAr: 'الأنوية والمعالجات المنطقية والتردد والذاكرة المخبئية ودليل تثبيت الافتراضية من CIM.' },
  { id: 'hardware-gpu', world: 'hardware', labelEn: 'Graphics Bay', labelAr: 'خليج الرسوميات', state: 'partial', provider: 'Win32_VideoController + PnP', noteEn: 'Adapter, driver and VRAM values are measured. DirectX/Vulkan capability is not inferred from a name.', noteAr: 'المحول والتعريف وذاكرة الفيديو مقيسة. لا تُستنتج قدرات DirectX/Vulkan من الاسم.' },
  { id: 'hardware-memory', world: 'hardware', labelEn: 'DIMM Layout', labelAr: 'مخطط وحدات DIMM', state: 'available', provider: 'Win32_PhysicalMemory', noteEn: 'Module size, locator, bank, speed and manufacturer as reported by Windows.', noteAr: 'حجم الوحدة والموقع والبنك والسرعة والمصنّع كما يبلغ عنها Windows.' },
  { id: 'hardware-cycles', world: 'hardware', labelEn: 'Wear & Cycle Ledger', labelAr: 'سجل التآكل والدورات', state: 'partial', provider: 'BatteryCycleCount + Storage reliability', noteEn: 'Reports only Windows-provided cycle and reliability counters; unavailable fields stay unknown.', noteAr: 'يعرض فقط عدادات الدورات والموثوقية التي يوفرها Windows؛ الحقول غير المتاحة تبقى مجهولة.' },
  { id: 'hardware-thermal', world: 'hardware', labelEn: 'Thermal Sensor Board', labelAr: 'لوحة مستشعرات الحرارة', state: 'partial', provider: 'MSAcpi_ThermalZoneTemperature', noteEn: 'Shows readings only when the firmware exposes them. No sensor is simulated when Windows denies access.', noteAr: 'يعرض القراءات فقط عندما يكشفها البرنامج الثابت. لا يُحاكى مستشعر عندما يرفض Windows الوصول.' },
  { id: 'hardware-disks', world: 'hardware', labelEn: 'Physical Disk Bays', labelAr: 'خانات الأقراص الفعلية', state: 'available', provider: 'Get-PhysicalDisk + reliability counters', noteEn: 'Disk model, bus, media, health and available reliability counters. No SMART command is invented.', noteAr: 'الطراز والناقل والوسيط والصحة وعدادات الموثوقية المتاحة. لا يُختلق أمر SMART.' },
  { id: 'hardware-usb', world: 'hardware', labelEn: 'USB Topology', labelAr: 'طوبولوجيا USB', state: 'available', provider: 'Win32_USBController + USBHub + PnP', noteEn: 'Controller, hub and device evidence from CIM. Reported speed/power stays unknown when Windows omits it.', noteAr: 'دليل المتحكم والموزع والجهاز من CIM. تبقى السرعة والطاقة مجهولة عندما يحجبها Windows.' },
  { id: 'hardware-display', world: 'hardware', labelEn: 'Display Canvas', labelAr: 'لوحة العرض', state: 'partial', provider: 'WmiMonitorID + Win32_VideoController', noteEn: 'Measured monitor identity, current mode and refresh. HDR is marked unknown when no supported provider answers.', noteAr: 'هوية الشاشة والوضع الحالي ومعدل التحديث مقيسة. HDR يُوسم كمجهول عندما لا يستجيب مزود مدعوم.' },
  { id: 'hardware-audio', world: 'hardware', labelEn: 'Audio Endpoint Mixer', labelAr: 'مازج نقاط الصوت', state: 'partial', provider: 'PnpDevice AudioEndpoint + Win32_SoundDevice', noteEn: 'Endpoint names, status and controllers are measured. Default-device and sample-format claims require CoreAudio.', noteAr: 'أسماء النقاط وحالتها والمتحكمات مقيسة. ادعاءات الجهاز الافتراضي وتنسيق العينة تتطلب CoreAudio.' },
  { id: 'hardware-health-report', world: 'hardware', labelEn: 'Hardware Evidence Report', labelAr: 'تقرير دليل العتاد', state: 'available', provider: 'Measured snapshot only', noteEn: 'Builds a redacted read-only report that separates validated components from unknown readings.', noteAr: 'ينشئ تقريرًا مقيدًا للقراءة فقط يفصل المكونات المتحقق منها عن القراءات المجهولة.' }
]);

const GATED_OPERATIONS = Object.freeze([
  { id: 'system.process.control', mission: '10', title: 'Terminate or suspend a process', reason: 'Process control is deliberately absent. It can destroy unsaved work and must be a separately approved executor with protected-process denies and postcondition proof.' },
  { id: 'system.service.control', mission: '12', title: 'Start, stop or reconfigure a service', reason: 'Service start-mode and state changes belong to Mission 12 Services and require elevation and dependency checks.' },
  { id: 'network.hosts.write', mission: '10', title: 'Write the Windows hosts file', reason: 'The hosts inspector is read-only. A future executor must stage a validated diff, preserve the original ACL and encoding, require explicit approval and verify the postcondition.' },
  { id: 'network.repair.execute', mission: '11', title: 'Flush DNS or reset Winsock/TCPIP', reason: 'Network reset commands disconnect active connections and can require restart. Mission 10 shows an immutable disruption preview only.' },
  { id: 'network.proxy.write', mission: '10', title: 'Change WinINET or WinHTTP proxy settings', reason: 'Proxy changes can redirect all system traffic. No proxy write channel exists in this delivery.' },
  { id: 'network.adapter.control', mission: '11', title: 'Enable, disable or reset a network adapter', reason: 'Adapter control is disruptive and requires elevation. It is not exposed by the observatory.' },
  { id: 'hardware.driver.change', mission: '11', title: 'Install, update or roll back a driver', reason: 'Driver changes can make the machine unbootable. The inventory is read-only; repair requires Mission 11 approval, restore point evidence and reboot handling.' },
  { id: 'hardware.power.change', mission: '14', title: 'Change power or thermal policy', reason: 'Power plan and thermal policy changes belong to Mission 14 Settings and require explicit approval.' }
]);

const PROTECTED_PROCESS = /^(system|registry|memory compression|smss|csrss|wininit|services|lsass|winlogon|fontdrvhost|dwm|svchost|audiodg|msmpeng|securityhealthservice|sense|trustedinstaller|wininit|spoolsv|explorer)$/i;
const PROTECTED_SERVICE = /^(rpcss|dcomlaunch|plugplay|power|profilesvc|lsm|samss|winlogon|csrss|smss|services|wuauserv|windefend|wscsvc|securityhealthservice|msmpeng|trustedinstaller|eventlog|schedule|themes|audioendpointbuilder|bits)$/i;

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

/**
 * Get-WinEvent serializes UserId as a SecurityIdentifier object
 * ({ BinaryLength, AccountDomainSid, Value }) in Windows PowerShell JSON.
 * Stringifying that object yields "[object Object]", so read the Value field
 * explicitly and keep the measured SID text only.
 */
function sidText(value) {
  if (value == null) return null;
  if (typeof value === 'object') {
    const candidate = value.Value ?? value.value ?? value.Sid ?? value.sid ?? value.StringSid ?? null;
    return candidate == null ? null : text(candidate);
  }
  return text(value);
}

function clip(value, max = 500) {
  const normalized = text(value);
  if (!normalized) return null;
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}

function numberOrNull(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function boolOrNull(value) {
  if (value == null) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return null;
}

function iso(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const raw = String(value).trim();
  const ms = raw.match(/^\/?Date\((-?\d+)\)\/?$/);
  if (ms) {
    const date = new Date(Number(ms[1]));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function stableId(prefix, ...parts) {
  const hash = crypto.createHash('sha1').update(parts.map((part) => String(part == null ? '' : part)).join('\u0000')).digest('hex').slice(0, 24);
  return `${prefix}:${hash}`;
}

function decodeUint16String(value) {
  if (typeof value === 'string') return text(value);
  const values = asArray(value);
  if (!values.length) return null;
  const decoded = values
    .map((entry) => numberOrNull(entry))
    .filter((entry) => entry != null && entry > 0)
    .map((entry) => String.fromCharCode(entry))
    .join('')
    .replace(/\0/g, '')
    .trim();
  return decoded || null;
}

function normalizeMemoryType(value) {
  const mapping = {
    20: 'DDR', 21: 'DDR2', 22: 'DDR2 FB-DIMM', 24: 'DDR3', 26: 'DDR4', 27: 'LPDDR', 28: 'LPDDR2', 29: 'LPDDR3', 30: 'LPDDR4', 34: 'DDR5', 35: 'LPDDR5'
  };
  return mapping[Number(value)] || null;
}

function normalizeFormFactor(value) {
  const mapping = { 8: 'DIMM', 12: 'SODIMM', 13: 'SRIMM', 15: 'FB-DIMM' };
  return mapping[Number(value)] || null;
}

function normalizeArchitecture(value) {
  const mapping = { 0: 'x86', 5: 'ARM', 9: 'x64', 12: 'ARM64' };
  return mapping[Number(value)] || text(value);
}

function parseLinkSpeed(value) {
  const raw = text(value);
  if (!raw) return null;
  const match = raw.match(/([\d.]+)\s*(G|M|K)?bps/i);
  if (!match) {
    const direct = numberOrNull(raw);
    return direct != null ? direct : null;
  }
  const amount = Number(match[1]);
  const unit = (match[2] || '').toUpperCase();
  const multiplier = unit === 'G' ? 1e9 : unit === 'M' ? 1e6 : unit === 'K' ? 1e3 : 1;
  return Number.isFinite(amount) ? Math.round(amount * multiplier) : null;
}

function parseCimReferenceName(value) {
  const raw = String(value || '');
  const match = raw.match(/Name="([^"]+)"/i);
  return match ? match[1] : null;
}

function parseDeviceId(value) {
  const raw = String(value || '');
  const match = raw.match(/DeviceID="([^"]+)"/i);
  return match ? match[1].replace(/\\\\/g, '\\') : null;
}

function macVendor(mac) {
  if (!mac) return null;
  const prefix = mac.replace(/[^a-f0-9]/gi, '').slice(0, 6).toUpperCase();
  const vendors = {
    '001B21': 'Intel', '3C5282': 'Intel', 'A4B1C1': 'Intel', 'D8BBC1': 'Intel',
    '001C42': 'Parallels', '000C29': 'VMware', '005056': 'VMware', '080027': 'VirtualBox',
    '00155D': 'Hyper-V', '525400': 'QEMU/KVM', 'B827EB': 'Raspberry Pi',
    'F4F26D': 'TP-Link', '50C7BF': 'TP-Link', '001D0F': 'TP-Link',
    '0018E7': 'Cisco', '00000C': 'Cisco', 'F09FC2': 'Ubiquiti',
    'D8A25E': 'Apple', 'F01898': 'Apple', 'ACBC32': 'Apple'
  };
  return vendors[prefix] || null;
}

function normalizeCore(raw, { now = () => new Date() } = {}) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const os = payload.os || {};
  const cs = payload.cs || {};
  const bios = payload.bios || {};
  const baseboard = payload.baseboard || {};
  const bootTime = iso(os.LastBootUpTime);
  const current = now();
  const nowMs = current instanceof Date ? current.getTime() : new Date(current).getTime();
  const uptime = bootTime ? Math.max(0, Math.round((nowMs - new Date(bootTime).getTime()) / 1000)) : null;
  const totalBytes = numberOrNull(os.TotalVisibleMemorySize) != null ? Number(os.TotalVisibleMemorySize) * 1024 : numberOrNull(cs.TotalPhysicalMemory);
  const freeBytes = numberOrNull(os.FreePhysicalMemory) != null ? Number(os.FreePhysicalMemory) * 1024 : null;

  const identity = {
    osName: clip(os.Caption, 120),
    osVersion: text(os.Version),
    osBuild: text(os.BuildNumber),
    osEdition: clip(os.Caption, 120),
    architecture: text(os.OSArchitecture),
    manufacturer: clip(cs.Manufacturer, 120),
    model: clip(cs.Model, 120),
    processor: clip(asArray(payload.cpu)[0]?.Name, 160),
    installedRamBytes: totalBytes,
    installDate: iso(os.InstallDate),
    bootTime,
    uptimeSeconds: uptime,
    fastStartupEnabled: boolOrNull(payload.fastStartup),
    fastStartupAvailable: payload.fastStartup != null,
    timeZone: text(payload.timeZone),
    locale: text(payload.culture)
  };

  const cpu = asArray(payload.cpu).map((entry) => ({
    id: stableId('cpu', entry.DeviceID, entry.Name),
    name: clip(entry.Name, 160) || 'Unknown processor',
    vendor: clip(entry.Manufacturer, 80),
    cores: numberOrNull(entry.NumberOfCores),
    logicalProcessors: numberOrNull(entry.NumberOfLogicalProcessors),
    maxClockMHz: numberOrNull(entry.MaxClockSpeed),
    socket: clip(entry.SocketDesignation, 60),
    architecture: normalizeArchitecture(entry.Architecture),
    l2CacheBytes: numberOrNull(entry.L2CacheSize) != null ? Number(entry.L2CacheSize) * 1024 : null,
    l3CacheBytes: numberOrNull(entry.L3CacheSize) != null ? Number(entry.L3CacheSize) * 1024 : null,
    virtualizationFirmwareEnabled: boolOrNull(entry.VirtualizationFirmwareEnabled),
    vmMonitorModeExtensions: boolOrNull(entry.VMMonitorModeExtensions),
    processorId: text(entry.ProcessorId),
    source: 'Win32_Processor'
  }));

  const gpu = asArray(payload.gpu).map((entry) => ({
    id: stableId('gpu', entry.DeviceID, entry.Name),
    name: clip(entry.Name, 160) || 'Unknown graphics adapter',
    vendor: clip(entry.AdapterCompatibility, 100),
    adapterRamBytes: numberOrNull(entry.AdapterRAM),
    driverVersion: text(entry.DriverVersion),
    driverDate: iso(entry.DriverDate),
    videoProcessor: clip(entry.VideoProcessor, 120),
    status: text(entry.Status),
    pnpDeviceId: text(entry.PNPDeviceID),
    videoMode: text(entry.VideoModeDescription),
    source: 'Win32_VideoController'
  }));

  const memory = asArray(payload.memory).map((entry) => ({
    id: stableId('dimm', entry.DeviceLocator, entry.BankLabel, entry.PartNumber),
    manufacturer: clip(entry.Manufacturer, 80),
    partNumber: clip(entry.PartNumber, 100),
    capacityBytes: numberOrNull(entry.Capacity),
    speedMHz: numberOrNull(entry.Speed),
    configuredSpeedMHz: numberOrNull(entry.ConfiguredClockSpeed),
    formFactor: normalizeFormFactor(entry.FormFactor),
    locator: clip(entry.DeviceLocator, 60),
    bankLabel: clip(entry.BankLabel, 60),
    memoryType: normalizeMemoryType(entry.SMBIOSMemoryType) || normalizeMemoryType(entry.MemoryType),
    source: 'Win32_PhysicalMemory'
  }));

  const diskInfo = asArray(payload.diskInfo);
  const disks = asArray(payload.disks).map((entry) => {
    const info = diskInfo.find((candidate) => String(candidate.FriendlyName || '') === String(entry.FriendlyName || '') || String(candidate.Number) === String(entry.DeviceId));
    const smartStatus = text(entry.HealthStatus);
    return {
      id: stableId('disk', entry.DeviceId, entry.SerialNumber, entry.FriendlyName),
      deviceId: text(entry.DeviceId),
      model: clip(entry.FriendlyName, 160) || 'Unknown disk',
      serial: clip(entry.SerialNumber, 80),
      mediaType: text(entry.MediaType),
      busType: text(entry.BusType),
      sizeBytes: numberOrNull(entry.Size),
      healthStatus: smartStatus,
      operationalStatus: asArray(entry.OperationalStatus).map((value) => String(value)),
      partitionCount: numberOrNull(info?.PartitionCount),
      smartStatus: smartStatus ? `Storage health: ${smartStatus}` : null,
      powerOnHours: numberOrNull(entry.PowerOnHours),
      temperatureCelsius: numberOrNull(entry.Temperature),
      wearPercent: numberOrNull(entry.Wear),
      source: 'Get-PhysicalDisk + Get-StorageReliabilityCounter'
    };
  });

  const batteryStatus = asArray(payload.batteryStatus);
  const batteryStatic = asArray(payload.batteryStatic);
  const batteryFull = asArray(payload.batteryFull);
  const batteryCycles = asArray(payload.batteryCycles);
  const batteries = asArray(payload.battery).map((entry, index) => {
    const status = batteryStatus[index] || batteryStatus[0] || {};
    const staticData = batteryStatic[index] || batteryStatic[0] || {};
    const full = batteryFull[index] || batteryFull[0] || {};
    const cycles = batteryCycles[index] || batteryCycles[0] || {};
    const design = numberOrNull(staticData.DesignedCapacity) || numberOrNull(entry.DesignCapacity);
    const fullCapacity = numberOrNull(full.FullChargedCapacity) || numberOrNull(entry.FullChargeCapacity);
    const health = design && fullCapacity ? Math.round((fullCapacity / design) * 1000) / 10 : null;
    const statusCode = numberOrNull(entry.BatteryStatus);
    return {
      id: stableId('battery', entry.DeviceID, entry.Name, staticData.DeviceName),
      name: clip(entry.Name, 120) || 'Battery',
      deviceId: text(entry.DeviceID),
      chargePercent: numberOrNull(entry.EstimatedChargeRemaining),
      status: statusCode === 2 ? 'AC power' : statusCode === 1 ? 'Discharging' : text(entry.Status),
      designCapacityMilliWattHours: design,
      fullChargeCapacityMilliWattHours: fullCapacity,
      estimatedRunTimeMinutes: numberOrNull(entry.EstimatedRunTime),
      powerOnline: boolOrNull(status.PowerOnline),
      charging: boolOrNull(status.Charging),
      discharging: boolOrNull(status.Discharging),
      cycleCount: numberOrNull(cycles.CycleCount),
      cycleCountAvailable: numberOrNull(cycles.CycleCount) != null,
      voltageMillivolts: numberOrNull(status.Voltage),
      manufacturer: clip(staticData.ManufactureName, 100),
      chemistry: text(staticData.Chemistry),
      healthPercent: health,
      source: 'Win32_Battery + root/WMI Battery*'
    };
  });

  const controllerMap = asArray(payload.usbLinks).map((link) => ({
    controller: parseDeviceId(link.Controller),
    device: parseDeviceId(link.Device)
  })).filter((link) => link.controller && link.device);
  const usb = [];
  const controllerIdByDevice = new Map();
  for (const entry of asArray(payload.usbControllers)) {
    const deviceId = text(entry.DeviceID) || text(entry.PNPDeviceID);
    const id = stableId('usb', deviceId, entry.Name);
    if (deviceId) controllerIdByDevice.set(deviceId, id);
    usb.push({
      id,
      parentId: null,
      name: clip(entry.Name, 160) || 'USB controller',
      deviceClass: 'USB controller',
      manufacturer: clip(entry.Manufacturer, 100),
      status: text(entry.Status),
      vendorId: null,
      productId: null,
      busSpeed: null,
      powerMilliAmps: null,
      pnpDeviceId: text(entry.PNPDeviceID),
      nodeType: 'controller',
      source: 'Win32_USBController'
    });
  }
  for (const entry of asArray(payload.usbHubs)) {
    const deviceId = text(entry.DeviceID);
    const link = controllerMap.find((candidate) => candidate.device === deviceId);
    const vidMatch = String(deviceId || '').match(/VID_([0-9A-F]{4})&PID_([0-9A-F]{4})/i);
    usb.push({
      id: stableId('usb', deviceId, entry.Name),
      parentId: link ? controllerIdByDevice.get(link.controller) || null : null,
      name: clip(entry.Name, 160) || 'USB hub',
      deviceClass: 'USB hub',
      manufacturer: null,
      status: text(entry.Status),
      vendorId: vidMatch ? vidMatch[1].toUpperCase() : null,
      productId: vidMatch ? vidMatch[2].toUpperCase() : null,
      busSpeed: null,
      powerMilliAmps: null,
      pnpDeviceId: text(entry.PNPDeviceID),
      nodeType: 'hub',
      source: 'Win32_USBHub'
    });
  }
  for (const entry of asArray(payload.usbDevices)) {
    const deviceId = text(entry.DeviceID);
    const link = controllerMap.find((candidate) => candidate.device === deviceId);
    const vidMatch = String(deviceId || '').match(/VID_([0-9A-F]{4})&PID_([0-9A-F]{4})/i);
    usb.push({
      id: stableId('usb', deviceId, entry.Name),
      parentId: link ? controllerIdByDevice.get(link.controller) || null : null,
      name: clip(entry.Name, 160) || 'USB device',
      deviceClass: text(entry.PNPClass),
      manufacturer: clip(entry.Manufacturer, 100),
      status: text(entry.Status),
      vendorId: vidMatch ? vidMatch[1].toUpperCase() : null,
      productId: vidMatch ? vidMatch[2].toUpperCase() : null,
      busSpeed: null,
      powerMilliAmps: null,
      pnpDeviceId: text(entry.PNPDeviceID),
      nodeType: 'device',
      source: 'Win32_PnPEntity'
    });
  }
  const uniqueUsb = [];
  const seenUsb = new Set();
  for (const node of usb) {
    if (seenUsb.has(node.id)) continue;
    seenUsb.add(node.id);
    uniqueUsb.push(node);
  }
  const controllerIds = new Set(uniqueUsb.filter((node) => node.nodeType === 'controller').map((node) => node.id));
  for (const node of uniqueUsb) {
    if (node.parentId && !controllerIds.has(node.parentId)) node.parentId = null;
  }

  const desktopMonitors = asArray(payload.desktopMonitors);
  const primaryGpu = gpu[0] || {};
  const monitorRows = asArray(payload.monitors);
  const monitors = monitorRows.map((entry, index) => {
    const desktop = desktopMonitors[index] || desktopMonitors[0] || {};
    return {
      id: stableId('monitor', entry.InstanceName, index),
      name: decodeUint16String(entry.UserFriendlyName) || clip(desktop.Name, 120) || `Display ${index + 1}`,
      manufacturer: decodeUint16String(entry.ManufacturerName) || clip(desktop.Name, 80),
      year: numberOrNull(entry.YearOfManufacture),
      week: numberOrNull(entry.WeekOfManufacture),
      width: numberOrNull(desktop.ScreenWidth),
      height: numberOrNull(desktop.ScreenHeight),
      refreshHz: null,
      primary: index === 0,
      hdrAvailable: null,
      hdrEnabled: null,
      bitsPerPixel: numberOrNull(primaryGpu.CurrentBitsPerPixel),
      connection: null,
      pnpDeviceId: text(desktop.PNPDeviceID),
      source: 'WmiMonitorID + Win32_DesktopMonitor'
    };
  });
  if (!monitors.length && (primaryGpu.videoMode || primaryGpu.CurrentHorizontalResolution)) {
    monitors.push({
      id: stableId('monitor', primaryGpu.videoMode, primaryGpu.name),
      name: clip(primaryGpu.name, 120) || 'Primary display',
      manufacturer: clip(primaryGpu.vendor, 80),
      year: null,
      week: null,
      width: numberOrNull(primaryGpu.CurrentHorizontalResolution),
      height: numberOrNull(primaryGpu.CurrentVerticalResolution),
      refreshHz: numberOrNull(primaryGpu.CurrentRefreshRate),
      primary: true,
      hdrAvailable: null,
      hdrEnabled: null,
      bitsPerPixel: numberOrNull(primaryGpu.CurrentBitsPerPixel),
      connection: null,
      pnpDeviceId: text(primaryGpu.pnpDeviceId),
      source: 'Win32_VideoController'
    });
  }
  for (const monitor of monitors) {
    if (monitor.width == null) monitor.width = numberOrNull(primaryGpu.CurrentHorizontalResolution);
    if (monitor.height == null) monitor.height = numberOrNull(primaryGpu.CurrentVerticalResolution);
    if (monitor.refreshHz == null) monitor.refreshHz = numberOrNull(primaryGpu.CurrentRefreshRate);
  }

  const audio = [];
  const seenAudio = new Set();
  for (const entry of asArray(payload.audioEndpoints)) {
    const name = clip(entry.FriendlyName, 140) || 'Audio endpoint';
    const id = stableId('audio', entry.InstanceId, name);
    if (seenAudio.has(id)) continue;
    seenAudio.add(id);
    audio.push({
      id,
      name,
      manufacturer: clip(entry.Manufacturer, 100),
      status: text(entry.Status),
      kind: /microphone|input|line in|capture/i.test(name) ? 'input' : 'output',
      isDefault: null,
      driver: null,
      formats: [],
      pnpDeviceId: text(entry.InstanceId),
      source: 'Get-PnpDevice -Class AudioEndpoint'
    });
  }
  for (const entry of asArray(payload.audio)) {
    const name = clip(entry.Name, 140) || 'Audio controller';
    const id = stableId('audio', entry.DeviceID, name);
    if (seenAudio.has(id)) continue;
    seenAudio.add(id);
    audio.push({
      id,
      name,
      manufacturer: clip(entry.Manufacturer, 100),
      status: text(entry.Status),
      kind: /microphone|input|line in|capture/i.test(name) ? 'input' : 'output',
      isDefault: null,
      driver: null,
      formats: [],
      pnpDeviceId: text(entry.PNPDeviceID),
      source: 'Win32_SoundDevice'
    });
  }

  const thermalZones = asArray(payload.thermal).map((entry, index) => {
    const raw = numberOrNull(entry.CurrentTemperature);
    const celsius = raw != null && raw > 2000 ? Math.round(((raw / 10) - 273.15) * 10) / 10 : null;
    return {
      id: stableId('thermal', entry.InstanceName, index),
      name: clip(entry.InstanceName, 100) || `Thermal zone ${index + 1}`,
      celsius,
      warningCelsius: null,
      source: 'MSAcpi_ThermalZoneTemperature'
    };
  }).filter((zone) => zone.celsius != null);
  const thermalCelsius = thermalZones.length ? Math.max(...thermalZones.map((zone) => zone.celsius)) : null;
  const thermal = {
    available: thermalZones.length > 0,
    provider: thermalZones.length ? 'MSAcpi_ThermalZoneTemperature' : null,
    celsius: thermalCelsius,
    zones: thermalZones,
    throttling: null,
    reason: thermalZones.length
      ? 'Firmware ACPI thermal zones answered this read. Throttling state requires a separate platform counter.'
      : 'Windows did not expose an ACPI thermal-zone temperature to this process. No sensor value is simulated.',
    readOnly: true
  };

  const problemDevices = asArray(payload.problemDevices).map((entry) => ({
    id: stableId('problem', entry.PNPDeviceID, entry.Name),
    name: clip(entry.Name, 160) || 'Unknown device',
    problemCode: numberOrNull(entry.ConfigManagerErrorCode),
    manufacturer: clip(entry.Manufacturer, 100),
    pnpDeviceId: text(entry.PNPDeviceID)
  }));

  const bootEvents = asArray(payload.bootEvents).map((entry) => ({
    timeCreated: iso(entry.TimeCreated),
    eventId: numberOrNull(entry.Id),
    provider: text(entry.ProviderName) || 'Microsoft-Windows-Diagnostics-Performance',
    message: clip(entry.Message, 300) || ''
  }));

  const hardware = {
    system: {
      manufacturer: clip(cs.Manufacturer, 120),
      model: clip(cs.Model, 120),
      baseboardManufacturer: clip(baseboard.Manufacturer, 120),
      baseboardProduct: clip(baseboard.Product, 120),
      biosVendor: clip(bios.Manufacturer, 120),
      biosVersion: clip(bios.SMBIOSBIOSVersion, 120),
      biosDate: iso(bios.ReleaseDate)
    },
    cpu,
    gpu,
    memory,
    disks,
    batteries,
    usb: uniqueUsb,
    monitors,
    audio,
    thermal,
    problemDevices,
    totals: {
      cores: cpu.reduce((sum, entry) => sum + (entry.cores || 0), 0) || null,
      logicalProcessors: cpu.reduce((sum, entry) => sum + (entry.logicalProcessors || 0), 0) || null,
      memoryBytes: memory.reduce((sum, entry) => sum + (entry.capacityBytes || 0), 0) || totalBytes,
      diskBytes: disks.reduce((sum, entry) => sum + (entry.sizeBytes || 0), 0) || null,
      monitors: monitors.length,
      usbDevices: uniqueUsb.filter((node) => node.nodeType !== 'controller').length,
      audioEndpoints: audio.length,
      batteries: batteries.length
    },
    availability: {
      cpu: cpu.length > 0,
      gpu: gpu.length > 0,
      memory: memory.length > 0,
      disks: disks.length > 0,
      batteries: batteries.length > 0,
      usb: uniqueUsb.length > 0,
      monitors: monitors.length > 0,
      audio: audio.length > 0,
      thermal: thermal.available,
      smart: disks.some((disk) => disk.smartStatus != null)
    }
  };

  const free = freeBytes;
  const used = totalBytes != null && free != null ? Math.max(0, totalBytes - free) : null;
  const boot = {
    lastBootTime: bootTime,
    uptimeSeconds: uptime,
    fastStartupEnabled: boolOrNull(payload.fastStartup),
    fastStartupAvailable: payload.fastStartup != null,
    shutdownReason: 'unknown',
    events: bootEvents,
    note: bootEvents.length
      ? 'Boot diagnostics events are measured Windows records; no shutdown reason or per-application boot second is inferred.'
      : 'No Diagnostics-Performance boot events were available. No boot duration is invented.'
  };

  const metrics = {
    timestamp: current.toISOString(),
    cpuPercent: null,
    cpuFrequencyMHz: cpu[0]?.maxClockMHz ?? null,
    memoryPercent: totalBytes && used != null ? Math.round((used / totalBytes) * 1000) / 10 : null,
    memoryUsedBytes: used,
    memoryTotalBytes: totalBytes,
    memoryCommittedBytes: null,
    diskReadBytesPerSec: null,
    diskWriteBytesPerSec: null,
    diskLatencyMs: null,
    networkInBytesPerSec: null,
    networkOutBytesPerSec: null,
    processCount: null,
    threadCount: null,
    handleCount: null,
    source: 'Win32_OperatingSystem + Win32_Processor'
  };

  return { identity, metrics, boot, hardware };
}

function normalizeProcesses(raw, { logicalProcessors = 1 } = {}) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const perf = new Map();
  for (const entry of asArray(payload.perf)) {
    const pid = numberOrNull(entry.IDProcess);
    if (pid != null && pid !== 0) perf.set(pid, entry);
  }
  const users = new Map();
  for (const entry of asArray(payload.users)) {
    const pid = numberOrNull(entry.Id);
    if (pid != null) users.set(pid, text(entry.UserName));
  }
  const cpuScale = Math.max(1, logicalProcessors || 1);
  const processes = asArray(payload.processes)
    .map((entry) => {
      const pid = numberOrNull(entry.ProcessId);
      if (pid == null) return null;
      const perfEntry = perf.get(pid) || {};
      const cpuPercentRaw = numberOrNull(perfEntry.PercentProcessorTime);
      const cpuPercent = cpuPercentRaw != null ? Math.min(100, Math.round((cpuPercentRaw / cpuScale) * 10) / 10) : null;
      const name = text(entry.Name) || `PID ${pid}`;
      return {
        id: `proc:${pid}`,
        pid,
        parentPid: numberOrNull(entry.ParentProcessId),
        name,
        executablePath: text(entry.ExecutablePath),
        commandLine: clip(entry.CommandLine, 600),
        owner: users.get(pid) || null,
        ownerAvailable: users.has(pid),
        cpuPercent,
        cpuSeconds: numberOrNull(entry.KernelModeTime) != null && numberOrNull(entry.UserModeTime) != null
          ? Math.round(((numberOrNull(entry.KernelModeTime) + numberOrNull(entry.UserModeTime)) / 1e7) * 10) / 10
          : null,
        workingSetBytes: numberOrNull(entry.WorkingSetSize),
        privateBytes: numberOrNull(perfEntry.WorkingSetPrivate),
        threads: numberOrNull(entry.ThreadCount),
        handles: numberOrNull(entry.HandleCount),
        startedAt: iso(entry.CreationDate),
        company: clip(entry.CompanyName, 100),
        description: clip(entry.Description, 160),
        signatureStatus: null,
        signatureAvailable: false,
        protected: PROTECTED_PROCESS.test(name),
        source: 'Win32_Process + PerfProc'
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.workingSetBytes || 0) - (a.workingSetBytes || 0))
    .slice(0, MAX_PROCESS_ROWS);

  return {
    processes,
    total: asArray(payload.processes).length,
    truncated: asArray(payload.processes).length > processes.length
  };
}

function normalizeServices(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const services = asArray(payload.services).map((entry) => {
    const name = text(entry.Name) || 'unknown';
    return {
      id: stableId('svc', name),
      name,
      displayName: clip(entry.DisplayName, 160) || name,
      state: text(entry.State),
      startMode: text(entry.StartMode),
      delayedAutoStart: boolOrNull(entry.DelayedAutoStart),
      processId: numberOrNull(entry.ProcessId),
      executablePath: text(entry.PathName),
      description: clip(entry.Description, 260),
      protected: PROTECTED_SERVICE.test(name),
      source: 'Win32_Service'
    };
  });
  const byName = new Map(services.map((service) => [service.name.toLowerCase(), service]));
  const edges = [];
  for (const entry of asArray(payload.dependencies)) {
    const dependee = parseCimReferenceName(entry.dependee);
    const dependent = parseCimReferenceName(entry.dependent);
    if (!dependee || !dependent) continue;
    const from = byName.get(dependee.toLowerCase());
    const to = byName.get(dependent.toLowerCase());
    if (!from || !to) continue;
    edges.push({ from: to.id, to: from.id, relation: 'depends-on' });
    edges.push({ from: from.id, to: to.id, relation: 'required-by' });
  }
  return { services, edges };
}

function normalizeStartupLinks(raw, { processes = [], services = [] } = {}) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const processNames = new Map(processes.map((entry) => [entry.name.toLowerCase(), entry]));
  const servicePaths = services.filter((entry) => entry.executablePath);
  return asArray(payload.startup).map((entry, index) => {
    const name = text(entry.Name) || `Startup ${index + 1}`;
    const command = text(entry.Command) || '';
    const location = text(entry.Location) || '';
    const scope = /^HK(CU|U\\S-1-)/i.test(location) ? 'user' : /^HKLM|Common Startup/i.test(location) ? 'machine' : 'unknown';
    const executable = command.match(/^"([^"]+)"|^([^\s]+\.exe)/i);
    const executableName = executable ? String(executable[1] || executable[2] || '').split(/[\\/]/).pop() : null;
    const process = executableName ? processNames.get(executableName.toLowerCase()) : null;
    const service = executableName
      ? servicePaths.find((candidate) => String(candidate.executablePath).toLowerCase().includes(executableName.toLowerCase()))
      : null;
    const linkType = process ? 'process-match' : service ? 'service-match' : 'unlinked';
    return {
      id: stableId('link', name, command, location, index),
      name,
      command: clip(command, 400) || '',
      source: text(entry.Location) || 'unknown',
      location,
      scope,
      processId: process ? process.pid : null,
      serviceName: service ? service.name : null,
      appName: process ? process.name : null,
      linkType,
      confidence: process ? 'measured' : 'inferred',
      evidence: process
        ? `Command executable ${executableName} matched running PID ${process.pid}.`
        : service
          ? `Command executable ${executableName} matched service ${service.name} binary path.`
          : 'No running process or service binary matched this command; the row is intentionally unlinked.'
    };
  });
}

function normalizeEvents(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const events = asArray(payload.events).map((entry, index) => {
    const channel = text(entry.LogName) || 'System';
    const recordId = numberOrNull(entry.RecordId);
    const time = iso(entry.TimeCreated);
    return {
      id: stableId('event', channel, recordId, entry.Id, time, index),
      channel,
      recordId,
      eventId: numberOrNull(entry.Id),
      provider: text(entry.ProviderName) || 'Unknown provider',
      level: numberOrNull(entry.Level),
      levelName: text(entry.LevelDisplayName),
      timeCreated: time,
      message: clip(entry.Message, 600) || '',
      userSid: sidText(entry.UserId),
      activityId: text(entry.ActivityId),
      source: 'Get-WinEvent'
    };
  });
  const channels = asArray(payload.channels).map((entry) => ({
    name: text(entry.LogName) || 'Unknown',
    recordCount: numberOrNull(entry.RecordCount),
    fileSizeBytes: numberOrNull(entry.FileSize),
    enabled: boolOrNull(entry.IsEnabled),
    retention: text(entry.LogMode),
    logFilePath: text(entry.LogFilePath),
    lastWriteTime: iso(entry.LastWriteTime),
    source: 'Get-WinEvent -ListLog'
  })).slice(0, MAX_CHANNEL_ROWS);
  return { events: events.slice(0, MAX_EVENT_ROWS), channels };
}

function normalizeDrivers(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  return asArray(payload.drivers).map((entry) => ({
    id: stableId('driver', entry.DeviceID, entry.DeviceName, entry.DriverVersion),
    deviceName: clip(entry.DeviceName, 180) || 'Unknown device',
    provider: clip(entry.DriverProviderName, 120),
    version: text(entry.DriverVersion),
    driverDate: iso(entry.DriverDate),
    infName: text(entry.InfName),
    signed: boolOrNull(entry.IsSigned),
    signer: clip(entry.Signer, 180),
    whqlStatus: boolOrNull(entry.IsSigned) ? 'signed' : boolOrNull(entry.IsSigned) === false ? 'unsigned' : 'unknown',
    deviceId: text(entry.DeviceID),
    hardwareIds: asArray(entry.HardwareID).map((value) => String(value)),
    deviceClass: text(entry.DeviceClass),
    source: 'Win32_PnPSignedDriver'
  })).slice(0, MAX_DRIVER_ROWS);
}

function normalizeNetwork(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const adapters = asArray(payload.adapters);
  const addresses = asArray(payload.addresses);
  const interfaces = asArray(payload.interfaces);
  const dns = asArray(payload.dns);
  const dnsClient = asArray(payload.dnsClient);
  const routes = asArray(payload.routes);
  const neighbors = asArray(payload.neighbors);

  const match = (alias, index, entry) => {
    const candidateAlias = text(entry.InterfaceAlias);
    const candidateIndex = numberOrNull(entry.InterfaceIndex);
    return candidateAlias === alias || (index != null && candidateIndex === index);
  };

  const normalizedInterfaces = adapters.map((adapter, index) => {
    const alias = text(adapter.Name) || text(adapter.ifAlias) || `Interface ${index + 1}`;
    const interfaceIndex = numberOrNull(adapter.InterfaceIndex);
    const ownedAddresses = addresses.filter((entry) => match(alias, interfaceIndex, entry));
    const ownedInterface = interfaces.find((entry) => match(alias, interfaceIndex, entry));
    const ownedDns = dns.find((entry) => match(alias, interfaceIndex, entry));
    const ownedDnsClient = dnsClient.find((entry) => match(alias, interfaceIndex, entry));
    const ownedRoutes = routes.filter((entry) => match(alias, interfaceIndex, entry));
    const toAddress = (entry) => ({
      address: text(entry.IPAddress) || '',
      prefixLength: numberOrNull(entry.PrefixLength),
      family: Number(entry.AddressFamily) === 23 || String(entry.AddressFamily).toLowerCase().includes('v6') ? 'IPv6' : 'IPv4',
      origin: text(entry.PrefixOrigin),
      state: text(entry.AddressState)
    });
    const ipv4 = ownedAddresses.filter((entry) => toAddress(entry).family === 'IPv4').map(toAddress);
    const ipv6 = ownedAddresses.filter((entry) => toAddress(entry).family === 'IPv6').map(toAddress);
    const description = text(adapter.InterfaceDescription) || '';
    const virtual = boolOrNull(adapter.Virtual) ?? /virtual|vmware|hyper-v|vbox|loopback|vpn|tap|wintun|tailscale|zerotier|wireguard/i.test(`${alias} ${description}`);
    return {
      id: stableId('nic', alias, adapter.MacAddress, index),
      name: alias,
      description,
      status: text(adapter.Status),
      mac: text(adapter.MacAddress),
      linkSpeed: text(adapter.LinkSpeed),
      speedBps: parseLinkSpeed(adapter.LinkSpeed),
      mediaType: text(adapter.MediaType),
      interfaceIndex,
      interfaceType: text(ownedInterface?.InterfaceDescription),
      connectionState: text(ownedInterface?.ConnectionState),
      dhcp: text(ownedInterface?.Dhcp),
      mtu: numberOrNull(ownedInterface?.NlMtu),
      ipv4,
      ipv6,
      dnsServers: asArray(ownedDns?.ServerAddresses).map((value) => String(value)).filter(Boolean),
      gateway: ownedRoutes.find((entry) => String(entry.DestinationPrefix) === '0.0.0.0/0')?.NextHop || ownedRoutes.find((entry) => String(entry.DestinationPrefix) === '::/0')?.NextHop || null,
      dnsSuffix: text(ownedDnsClient?.ConnectionSpecificSuffix),
      virtual,
      source: 'Get-NetAdapter + Get-NetIPAddress + Get-DnsClient'
    };
  }).sort((a, b) => Number(b.status === 'Up') - Number(a.status === 'Up'));

  const normalizedRoutes = routes.map((entry, index) => ({
    id: stableId('route', entry.InterfaceAlias, entry.DestinationPrefix, entry.NextHop, index),
    destination: text(entry.DestinationPrefix) || '',
    nextHop: text(entry.NextHop) || '',
    metric: numberOrNull(entry.RouteMetric),
    interfaceAlias: text(entry.InterfaceAlias),
    source: 'Get-NetRoute'
  }));

  const normalizedNeighbors = neighbors
    .map((entry, index) => {
      const address = text(entry.IPAddress);
      if (!address) return null;
      const family = Number(entry.AddressFamily) === 23 || String(entry.AddressFamily).toLowerCase().includes('v6') ? 'IPv6' : 'IPv4';
      return {
        id: stableId('neighbor', address, entry.LinkLayerAddress, index),
        ip: address,
        mac: text(entry.LinkLayerAddress),
        state: text(entry.State),
        interfaceAlias: text(entry.InterfaceAlias),
        family,
        inferred: !text(entry.LinkLayerAddress) || !['Reachable', 'Permanent'].includes(String(entry.State)),
        vendor: macVendor(entry.LinkLayerAddress),
        source: 'Get-NetNeighbor'
      };
    })
    .filter(Boolean)
    .slice(0, MAX_NEIGHBOR_ROWS);

  return { interfaces: normalizedInterfaces, routes: normalizedRoutes, neighbors: normalizedNeighbors };
}

function normalizeSockets(raw, { processes = [] } = {}) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const processMap = new Map(processes.map((entry) => [entry.pid, entry]));
  const rows = [];
  for (const entry of asArray(payload.tcp)) {
    const pid = numberOrNull(entry.OwningProcess);
    const owner = pid != null ? processMap.get(pid) : null;
    rows.push({
      id: stableId('socket', 'tcp', entry.LocalAddress, entry.LocalPort, entry.RemoteAddress, entry.RemotePort, pid),
      protocol: 'TCP',
      localAddress: text(entry.LocalAddress) || '',
      localPort: numberOrNull(entry.LocalPort),
      remoteAddress: text(entry.RemoteAddress),
      remotePort: numberOrNull(entry.RemotePort),
      state: text(entry.State),
      pid,
      processName: owner?.name || null,
      processPath: owner?.executablePath || null,
      createdAt: iso(entry.CreationTime),
      source: 'Get-NetTCPConnection'
    });
  }
  for (const entry of asArray(payload.udp)) {
    const pid = numberOrNull(entry.OwningProcess);
    const owner = pid != null ? processMap.get(pid) : null;
    rows.push({
      id: stableId('socket', 'udp', entry.LocalAddress, entry.LocalPort, pid),
      protocol: 'UDP',
      localAddress: text(entry.LocalAddress) || '',
      localPort: numberOrNull(entry.LocalPort),
      remoteAddress: null,
      remotePort: null,
      state: 'Listening',
      pid,
      processName: owner?.name || null,
      processPath: owner?.executablePath || null,
      createdAt: iso(entry.CreationTime),
      source: 'Get-NetUDPEndpoint'
    });
  }
  return rows.slice(0, MAX_SOCKET_ROWS);
}

function normalizeProxies(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const enabled = boolOrNull(payload.proxyEnable) === true;
  const winhttpRaw = String(payload.winhttp || '');
  const winhttpDirect = /Direct access|no proxy/i.test(winhttpRaw);
  const winhttpProxyMatch = winhttpRaw.match(/Proxy Server\(s\)\s*:\s*([^\r\n]+)/i) || winhttpRaw.match(/Proxy Server\(s\)\s*:\s*([^\r\n]+)/i);
  const winhttpBypassMatch = winhttpRaw.match(/Bypass List\s*:\s*([^\r\n]*)/i);
  const lanes = [
    {
      lane: 'WinINET',
      enabled,
      proxyServer: text(payload.proxyServer),
      bypassList: text(payload.proxyOverride),
      autoConfigUrl: text(payload.autoConfigURL),
      autoDetect: boolOrNull(payload.autoDetect),
      source: 'HKCU Internet Settings',
      provenance: 'Measured current-user registry value'
    },
    {
      lane: 'WinHTTP',
      enabled: winhttpDirect ? false : Boolean(winhttpProxyMatch),
      proxyServer: winhttpProxyMatch ? text(winhttpProxyMatch[1]) : null,
      bypassList: winhttpBypassMatch ? text(winhttpBypassMatch[1]) : null,
      autoConfigUrl: null,
      autoDetect: null,
      source: 'netsh winhttp show proxy',
      provenance: winhttpDirect ? 'Measured: direct access' : winhttpProxyMatch ? 'Measured WinHTTP proxy line' : 'Output unreadable; not inferred'
    },
    {
      lane: 'WPAD',
      enabled: boolOrNull(payload.autoDetect),
      proxyServer: null,
      bypassList: null,
      autoConfigUrl: null,
      autoDetect: boolOrNull(payload.autoDetect),
      source: 'Internet Settings AutoDetect',
      provenance: 'Measured auto-detect flag; PAC discovery itself is not performed'
    }
  ];
  const effective = lanes[0].autoConfigUrl ? 'pac' : enabled ? 'manual' : lanes[0].autoDetect ? 'auto-detect' : 'direct';
  const warnings = [];
  if (!winhttpDirect && !winhttpProxyMatch) warnings.push('WinHTTP proxy output was not readable in the expected form; that lane is marked unknown rather than guessed.');
  return { lanes, effective, warnings, readOnly: true };
}

function parseHostsFile(content, filePath, { exists = true, readable = true, lastWriteTime = null, sha256 = null, reason = null } = {}) {
  const rawLines = String(content || '').replace(/\r\n/g, '\n').split('\n');
  const entries = [];
  let activeMappings = 0;
  rawLines.forEach((raw, index) => {
    const lineNumber = index + 1;
    const commentIndex = raw.indexOf('#');
    const body = commentIndex >= 0 ? raw.slice(0, commentIndex) : raw;
    const comment = commentIndex >= 0 ? raw.slice(commentIndex) : null;
    const tokens = body.trim().split(/\s+/).filter(Boolean);
    const active = tokens.length >= 2 && /^[0-9a-f:.]+$/i.test(tokens[0]);
    if (active) activeMappings += 1;
    entries.push({
      lineNumber,
      ip: active ? tokens[0] : tokens[0] && /^[0-9a-f:.]+$/i.test(tokens[0]) ? tokens[0] : null,
      hostnames: active ? tokens.slice(1) : tokens.slice(1),
      comment,
      active,
      raw
    });
  });
  return {
    path: filePath,
    exists,
    readable,
    totalLines: rawLines.length,
    activeMappings,
    entries,
    sha256,
    lastWriteTime,
    readOnly: true,
    reason
  };
}

function normalizeWifi({ interfaceOutput = '', profilesOutput = '', adapters = [] } = {}) {
  const wireless = (adapters || []).find((adapter) => /wi-?fi|wireless|802\.11/i.test(`${adapter?.name || ''} ${adapter?.description || ''} ${adapter?.mediaType || ''}`));
  const interfaceText = String(interfaceOutput || '');
  const profilesText = String(profilesOutput || '');
  const readValue = (source, labels) => {
    for (const label of labels) {
      const pattern = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, 'im');
      const match = source.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  };
  const stateText = readValue(interfaceText, ['State', 'Status']);
  const ssid = readValue(interfaceText, ['SSID']);
  const bssid = readValue(interfaceText, ['BSSID']);
  const signalRaw = readValue(interfaceText, ['Signal']);
  const signalPercent = signalRaw ? numberOrNull(signalRaw.replace('%', '')) : null;
  const radioType = readValue(interfaceText, ['Radio type']);
  const band = readValue(interfaceText, ['Band']);
  const channel = numberOrNull(readValue(interfaceText, ['Channel']));
  const receiveRate = numberOrNull((readValue(interfaceText, ['Receive rate \\(Mbps\\)', 'Receive rate']) || '').replace(/[^\d.]/g, ''));
  const transmitRate = numberOrNull((readValue(interfaceText, ['Transmit rate \\(Mbps\\)', 'Transmit rate']) || '').replace(/[^\d.]/g, ''));
  const authentication = readValue(interfaceText, ['Authentication']);
  const cipher = readValue(interfaceText, ['Cipher']);
  const rssiDbm = signalPercent != null ? Math.round((signalPercent / 2) - 100) : null;
  const profileNames = [];
  for (const line of profilesText.split(/\r?\n/)) {
    const match = line.match(/^\s*All User Profile\s*:\s*(.+)$/i) || line.match(/^\s*Profile\s*:\s*(.+)$/i);
    if (match) profileNames.push(match[1].trim());
  }
  const connected = Boolean(ssid) || /connected|connected/i.test(stateText || '');
  return {
    available: Boolean(wireless) || Boolean(interfaceText.trim()),
    state: ssid || connected ? 'connected' : wireless ? 'disconnected' : interfaceText.trim() ? 'unavailable' : 'unsupported',
    adapterName: wireless?.name || readValue(interfaceText, ['Name']) || null,
    ssid,
    bssid,
    signalPercent,
    rssiDbm,
    radioType,
    band,
    channel,
    receiveRateMbps: receiveRate,
    transmitRateMbps: transmitRate,
    cipher,
    authentication,
    profiles: profileNames.map((name) => ({ name, connectionMode: null, authentication: null, encryption: null })),
    reason: wireless
      ? interfaceText.trim()
        ? null
        : 'A wireless adapter is present but the WLAN service returned no interface record. Values stay unknown.'
      : 'No wireless adapter was measured on this machine.',
    source: 'netsh wlan show interfaces + Get-NetAdapter'
  };
}

function normalizeSample(raw, { logicalProcessors = 1, now = () => new Date() } = {}) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const totalBytes = numberOrNull(payload.totalVisible) != null ? Number(payload.totalVisible) * 1024 : null;
  const freeBytes = numberOrNull(payload.freePhysical) != null ? Number(payload.freePhysical) * 1024 : null;
  const usedBytes = totalBytes != null && freeBytes != null ? totalBytes - freeBytes : null;
  const cpuRaw = numberOrNull(payload.cpuPercent);
  const diskLatencySeconds = numberOrNull(payload.diskLatencySec);
  const current = now();
  return {
    timestamp: (current instanceof Date ? current : new Date(current)).toISOString(),
    cpuPercent: cpuRaw != null ? Math.max(0, Math.min(100, Math.round(cpuRaw * 10) / 10)) : null,
    cpuFrequencyMHz: numberOrNull(payload.frequencyMHz),
    memoryPercent: totalBytes && usedBytes != null ? Math.round((usedBytes / totalBytes) * 1000) / 10 : null,
    memoryUsedBytes: usedBytes,
    memoryTotalBytes: totalBytes,
    memoryCommittedBytes: numberOrNull(payload.memCommittedBytes),
    diskReadBytesPerSec: numberOrNull(payload.diskRead),
    diskWriteBytesPerSec: numberOrNull(payload.diskWrite),
    diskLatencyMs: diskLatencySeconds != null ? Math.round(diskLatencySeconds * 1000 * 100) / 100 : null,
    networkInBytesPerSec: numberOrNull(payload.netIn),
    networkOutBytesPerSec: numberOrNull(payload.netOut),
    processCount: numberOrNull(payload.processCount),
    threadCount: null,
    handleCount: null,
    source: 'PerfOS + PerfDisk + Tcpip counters'
  };
}

module.exports = {
  MAX_PROCESS_ROWS,
  MAX_DRIVER_ROWS,
  MAX_EVENT_ROWS,
  MAX_CHANNEL_ROWS,
  MAX_SOCKET_ROWS,
  MAX_NEIGHBOR_ROWS,
  SERVICE_DEFINITIONS,
  GATED_OPERATIONS,
  SYSTEM_CORE_SCRIPT,
  PROCESS_SCRIPT,
  SERVICE_SCRIPT,
  DRIVER_SCRIPT,
  EVENT_SCRIPT,
  NETWORK_SCRIPT,
  SOCKET_SCRIPT,
  PROXY_SCRIPT,
  SAMPLE_SCRIPT,
  asArray,
  text,
  clip,
  numberOrNull,
  boolOrNull,
  iso,
  stableId,
  parseLinkSpeed,
  macVendor,
  normalizeCore,
  normalizeProcesses,
  normalizeServices,
  normalizeStartupLinks,
  normalizeEvents,
  normalizeDrivers,
  normalizeNetwork,
  normalizeSockets,
  normalizeProxies,
  parseHostsFile,
  normalizeWifi,
  normalizeSample
};
