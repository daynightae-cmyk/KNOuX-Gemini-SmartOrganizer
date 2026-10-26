'use strict';

/**
 * Targeted read-only Live Pulse observatory test (Mission 10).
 *
 * An injected Windows provider and fixed file/executable fakes prove the
 * coordinator:
 *   - advertises 36 measured services across three worlds with authored Arabic
 *   - assembles a snapshot from nine staged collectors without fixture fallback
 *   - filters measured events, verifies Authenticode paths and caches results
 *   - stages an immutable hosts diff and never writes the hosts file
 *   - keeps every process/service/hosts/proxy/adapter/driver/power mutation gated
 *   - runs bounded diagnostics and hop traces without a raw shell surface
 */

const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const {
  SystemBridge,
  SERVICE_DEFINITIONS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS,
} = require('../electron/native/system-bridge.cjs');

const failures = [];
const assert = (condition, label) => {
  if (!condition) failures.push(label);
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const HOSTS_TEXT = [
  '# Copyright (c) KNOuX test fixture',
  '127.0.0.1 localhost',
  '::1 localhost',
  '192.0.2.5 knoux.test # measured mapping',
  '# 192.0.2.6 disabled.test',
].join('\r\n');

const WIFI_INTERFACES = [
  'There is 1 interface on the system:',
  '',
  '    Name                   : Wi-Fi',
  '    Description            : KNOuX Wireless Adapter',
  '    State                  : connected',
  '    SSID                   : KNOuX-Lab',
  '    BSSID                  : 02:00:5e:10:00:01',
  '    Radio type             : 802.11ax',
  '    Band                   : 5 GHz',
  '    Channel                : 44',
  '    Signal                 : 82%',
  '    Receive rate (Mbps)    : 1200',
  '    Transmit rate (Mbps)   : 1200',
  '    Authentication         : WPA3-Personal',
  '    Cipher                 : CCMP',
].join('\r\n');

const WIFI_PROFILES = [
  'Profiles on interface Wi-Fi:',
  '',
  '    All User Profile     : KNOuX-Lab',
  '    All User Profile     : Office-Guest',
].join('\r\n');

const TRACE_OUTPUT = [
  'Tracing route to 198.51.100.1 over a maximum of 8 hops',
  '',
  '  1     1 ms     1 ms     1 ms  192.0.2.1',
  '  2     4 ms     3 ms     3 ms  203.0.113.1',
  '  3     *        *        *     Request timed out.',
  '',
  'Trace complete.',
].join('\r\n');

const CORE = {
  os: {
    Caption: 'Microsoft Windows 11 Pro',
    Version: '10.0.26100',
    BuildNumber: '26100',
    OSArchitecture: '64-bit',
    LastBootUpTime: '2026-10-26T09:00:00.000Z',
    InstallDate: '2025-01-04T10:00:00.000Z',
    TotalVisibleMemorySize: 33554432,
    FreePhysicalMemory: 12582912,
  },
  cs: { Manufacturer: 'KNOuX Labs', Model: 'Audit Station', TotalPhysicalMemory: 34359738368 },
  bios: { Manufacturer: 'KNOuX', SMBIOSBIOSVersion: '1.2.3', ReleaseDate: '2025-01-01T00:00:00.000Z' },
  baseboard: { Manufacturer: 'KNOuX', Product: 'Audit Board' },
  timeZone: 'UTC',
  culture: 'en-US',
  cpu: [{
    DeviceID: 'CPU0',
    Name: 'KNOuX Test Processor',
    Manufacturer: 'KNOuX',
    NumberOfCores: 8,
    NumberOfLogicalProcessors: 16,
    MaxClockSpeed: 4200,
    L2CacheSize: 4096,
    L3CacheSize: 32768,
    VirtualizationFirmwareEnabled: true,
    ProcessorId: 'TEST-CPU',
  }],
  gpu: [{ DeviceID: 'GPU0', Name: 'KNOuX Test Graphics', AdapterCompatibility: 'KNOuX', AdapterRAM: 8589934592, DriverVersion: '31.0.1', Status: 'OK' }],
  memory: [{ DeviceLocator: 'DIMM 0', BankLabel: 'BANK 0', PartNumber: 'KX-32G', Capacity: 34359738368, Speed: 5600, ConfiguredClockSpeed: 5200, SMBIOSMemoryType: 34, Manufacturer: 'KNOuX' }],
  disks: [{ DeviceId: '0', FriendlyName: 'KNOuX NVMe', SerialNumber: 'DISK-1', MediaType: 'SSD', BusType: 'NVMe', Size: 1024209543168, HealthStatus: 'Healthy', OperationalStatus: ['OK'], PowerOnHours: 812, Temperature: 37, Wear: 2 }],
  diskInfo: [{ Number: 0, FriendlyName: 'KNOuX NVMe', PartitionCount: 3 }],
  logicalDisks: [{ DeviceID: 'C:', Size: 1024209543168, FreeSpace: 512104771584, VolumeName: 'SYSTEM', DriveType: 3 }],
  battery: [{ Name: 'KNOuX Test Battery', DeviceID: 'BAT0', EstimatedChargeRemaining: 82, BatteryStatus: 2, DesignCapacity: 60000, FullChargeCapacity: 57000, EstimatedRunTime: 240, Status: 'OK' }],
  batteryStatic: [{ DesignedCapacity: 60000, ManufactureName: 'KNOuX', Chemistry: 'Li-Ion' }],
  batteryFull: [{ FullChargedCapacity: 57000 }],
  batteryStatus: [{ PowerOnline: true, Charging: false, Discharging: false, RemainingCapacity: 82, Voltage: 12000, Rate: 0 }],
  batteryCycles: [{ CycleCount: 122 }],
  monitors: [],
  desktopMonitors: [{ Name: 'KNOuX Test Display', DeviceID: 'DISPLAY1', ScreenWidth: 1920, ScreenHeight: 1080, Status: 'OK' }],
  audio: [{ Name: 'KNOuX Test Audio', Manufacturer: 'KNOuX', Status: 'OK' }],
  audioEndpoints: [{ FriendlyName: 'Speakers (KNOuX Test Audio)', InstanceId: 'SWD\\MMDEVAPI\\{test}', Status: 'OK', Class: 'AudioEndpoint', Manufacturer: 'KNOuX' }],
  usbControllers: [{ Name: 'KNOuX USB Controller', DeviceID: 'PCI\\USB0', PNPDeviceID: 'PCI\\USB0', Status: 'OK' }],
  usbHubs: [{ Name: 'KNOuX USB Hub', DeviceID: 'USB\\VID_0BDA&PID_5411', PNPDeviceID: 'USB\\VID_0BDA&PID_5411', Status: 'OK' }],
  usbDevices: [{ Name: 'KNOuX Keyboard', Manufacturer: 'KNOuX', Status: 'OK', DeviceID: 'USB\\VID_0BDA&PID_1100', PNPDeviceID: 'USB\\VID_0BDA&PID_1100', PNPClass: 'USB' }],
  usbLinks: [{ Controller: 'PCI\\USB0', Device: 'USB\\VID_0BDA&PID_5411' }],
  problemDevices: [],
  thermal: [{ InstanceName: 'TZ0', CurrentTemperature: 3000 }],
  temperatureProbe: [],
  fastStartup: false,
  bootEvents: [{ TimeCreated: '2026-10-26T09:00:05.000Z', Id: 100, ProviderName: 'Microsoft-Windows-Diagnostics-Performance', Message: 'Boot performance monitoring started.' }],
};

const PROCESSES = {
  processes: [
    { ProcessId: 4, ParentProcessId: 0, Name: 'System', WorkingSetSize: 100000, ThreadCount: 100, HandleCount: 1000 },
    { ProcessId: 1000, ParentProcessId: 4, Name: 'explorer.exe', ExecutablePath: 'C:\\Windows\\explorer.exe', CommandLine: 'C:\\Windows\\explorer.exe', WorkingSetSize: 90000000, ThreadCount: 40, HandleCount: 900, CompanyName: 'Microsoft' },
    { ProcessId: 2000, ParentProcessId: 1000, Name: 'KNOuXTest.exe', ExecutablePath: 'C:\\Program Files\\KNOuX\\test.exe', CommandLine: '"C:\\Program Files\\KNOuX\\test.exe" --service', WorkingSetSize: 60000000, ThreadCount: 8, HandleCount: 240, CompanyName: 'KNOuX' },
  ],
  perf: [{ IDProcess: 2000, PercentProcessorTime: 25, WorkingSetPrivate: 50000000, ThreadCount: 8 }],
  users: [{ Id: 1000, UserName: 'TESTER\\tester' }],
};

const SERVICES = {
  services: [
    { Name: 'RpcSs', DisplayName: 'Remote Procedure Call', State: 'Running', StartMode: 'Auto', ProcessId: 900, PathName: 'C:\\Windows\\system32\\svchost.exe -k rpcss' },
    { Name: 'KNOuXTestSvc', DisplayName: 'KNOuX Test Service', State: 'Running', StartMode: 'Manual', ProcessId: 2000, PathName: 'C:\\Program Files\\KNOuX\\test.exe --service' },
  ],
  dependencies: [{ dependee: 'Win32_Service.Name="RpcSs"', dependent: 'Win32_Service.Name="KNOuXTestSvc"' }],
  startup: [{ Name: 'KNOuX Agent', Command: '"C:\\Program Files\\KNOuX\\KNOuXTest.exe" --startup', Location: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', User: 'Public' }],
};

const EVENTS = {
  events: [
    { LogName: 'System', RecordId: 501, Id: 41, ProviderName: 'Microsoft-Windows-Kernel-Power', Level: 2, LevelDisplayName: 'Error', TimeCreated: '2026-10-26T11:00:00.000Z', Message: 'The system rebooting without cleanly shutting down.' },
    { LogName: 'Application', RecordId: 88, Id: 1000, ProviderName: 'KNOuX Test', Level: 3, LevelDisplayName: 'Warning', TimeCreated: '2026-10-26T10:30:00.000Z', Message: 'A measured test warning.' },
    { LogName: 'System', RecordId: 77, Id: 12, ProviderName: 'Kernel-General', Level: 4, LevelDisplayName: 'Information', TimeCreated: '2026-10-26T10:00:00.000Z', Message: 'The operating system started.' },
  ],
  channels: [{ LogName: 'System', RecordCount: 5000, FileSize: 1048576, IsEnabled: true, LogMode: 'Circular', LogFilePath: 'C:\\Windows\\System32\\winevt\\Logs\\System.evtx', LastWriteTime: '2026-10-26T11:00:00.000Z' }],
};

const DRIVERS = {
  drivers: [
    { DeviceID: 'PCI\\VEN_8086', DeviceName: 'KNOuX Chipset', DriverProviderName: 'KNOuX', DriverVersion: '10.0.1', DriverDate: '2025-02-01T00:00:00.000Z', InfName: 'knouxchip.inf', IsSigned: true, Signer: 'Microsoft Windows Hardware Compatibility Publisher', DeviceClass: 'System' },
    { DeviceID: 'USB\\VID_0BDA', DeviceName: 'KNOuX Legacy Radio', DriverProviderName: 'KNOuX', DriverVersion: '1.0.0', DriverDate: '2020-01-01T00:00:00.000Z', InfName: 'knouxradio.inf', IsSigned: false, Signer: null, DeviceClass: 'Net' },
  ],
};

const NETWORK = {
  adapters: [{ Name: 'Ethernet', InterfaceDescription: 'KNOuX Ethernet', Status: 'Up', MacAddress: '00-15-5D-01-02-03', LinkSpeed: '1 Gbps', MediaType: '802.3', InterfaceIndex: 7, Virtual: false }],
  addresses: [
    { InterfaceAlias: 'Ethernet', InterfaceIndex: 7, IPAddress: '192.0.2.10', PrefixLength: 24, AddressFamily: 2, PrefixOrigin: 'Dhcp', AddressState: 'Preferred' },
    { InterfaceAlias: 'Ethernet', InterfaceIndex: 7, IPAddress: '2001:db8::10', PrefixLength: 64, AddressFamily: 23, PrefixOrigin: 'RouterAdvertisement', AddressState: 'Preferred' },
  ],
  interfaces: [{ InterfaceAlias: 'Ethernet', InterfaceIndex: 7, Dhcp: 'Enabled', ConnectionState: 'Connected', InterfaceDescription: 'Ethernet', NlMtu: 1500 }],
  dns: [{ InterfaceAlias: 'Ethernet', InterfaceIndex: 7, ServerAddresses: ['192.0.2.1', '2001:db8::1'] }],
  dnsClient: [{ InterfaceAlias: 'Ethernet', InterfaceIndex: 7, ConnectionSpecificSuffix: 'knoux.test', RegisterThisConnectionsAddress: true }],
  routes: [{ InterfaceAlias: 'Ethernet', InterfaceIndex: 7, DestinationPrefix: '0.0.0.0/0', NextHop: '192.0.2.1', RouteMetric: 25, PolicyStore: 'ActiveStore' }],
  neighbors: [{ InterfaceAlias: 'Ethernet', IPAddress: '192.0.2.1', LinkLayerAddress: '00-15-5D-01-02-01', State: 'Reachable', AddressFamily: 2 }],
};

const SOCKETS = {
  tcp: [{ LocalAddress: '192.0.2.10', LocalPort: 50123, RemoteAddress: '203.0.113.5', RemotePort: 443, State: 'Established', OwningProcess: 2000, CreationTime: '2026-10-26T11:10:00.000Z' }],
  udp: [{ LocalAddress: '0.0.0.0', LocalPort: 5353, OwningProcess: 1000, CreationTime: '2026-10-26T10:00:00.000Z' }],
};

const PROXIES = {
  proxyEnable: 0,
  proxyServer: null,
  proxyOverride: '<local>',
  autoConfigURL: null,
  autoDetect: 0,
  winhttp: 'Direct access (no proxy server).',
};

const SAMPLE = {
  cpuPercent: 21.5,
  memAvailableBytes: 12582912,
  memCommittedBytes: 20132659,
  memCommitLimit: 33554432,
  diskRead: 1048576,
  diskWrite: 524288,
  diskLatencySec: 0.0021,
  netIn: 2097152,
  netOut: 1048576,
  totalVisible: 33554432,
  freePhysical: 12582912,
  processCount: 3,
  frequencyMHz: 3800,
};

const SIGNATURE_ROWS = [
  { path: 'C:\\Windows\\explorer.exe', status: 'Valid', signer: 'CN=Microsoft Windows', thumbprint: 'ABCDEF', notBefore: '2024-01-01T00:00:00.000Z', notAfter: '2027-01-01T00:00:00.000Z', root: 'CN=Microsoft Root', rootTrusted: true, message: null },
  { path: 'C:\\Program Files\\KNOuX\\test.exe', status: 'NotSigned', signer: null, thumbprint: null, notBefore: null, notAfter: null, root: null, rootTrusted: null, message: 'The file is not digitally signed.' },
];

function createProvider() {
  return {
    calls: [],
    async powershellJson(_script, options = {}) {
      const label = options.provider;
      this.calls.push(label);
      if (label === 'Win32_Core') return CORE;
      if (label === 'Win32_Process+PerfProc') return PROCESSES;
      if (label === 'Win32_Service+Startup') return SERVICES;
      if (label === 'Get-WinEvent') return EVENTS;
      if (label === 'Win32_PnPSignedDriver') return DRIVERS;
      if (label === 'NetTCPIP') return NETWORK;
      if (label === 'InternetSettings+WinHTTP') return PROXIES;
      if (label === 'NetTCPIP+Sockets') return SOCKETS;
      if (label === 'PerformanceCounters') return SAMPLE;
      if (label === 'Get-AuthenticodeSignature') return SIGNATURE_ROWS;
      throw new Error(`Unexpected provider label: ${label}`);
    },
  };
}

async function runFile(file, args) {
  const command = `${file} ${args.join(' ')}`;
  if (file === 'netsh.exe' && args.join(' ') === 'wlan show interfaces') return { stdout: WIFI_INTERFACES };
  if (file === 'netsh.exe' && args.join(' ') === 'wlan show profiles') return { stdout: WIFI_PROFILES };
  if (file === 'tracert.exe') return { stdout: TRACE_OUTPUT };
  throw new Error(`Unexpected executable invocation: ${command}`);
}

function createBridge(overrides = {}) {
  return new SystemBridge({
    provider: createProvider(),
    runFile,
    readFile: async () => HOSTS_TEXT,
    statFile: async () => ({ mtime: new Date('2026-10-26T08:00:00.000Z') }),
    hostsPath: 'C:\\KNOuX-Test\\System32\\drivers\\etc\\hosts',
    wifiAdapters: [{ name: 'Wi-Fi', description: 'KNOuX Wireless Adapter', mediaType: 'Native 802.11' }],
    now: () => new Date('2026-10-26T12:00:00.000Z'),
    ...overrides,
  });
}

async function settle(bridge, sessionId, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let session = bridge.status(sessionId);
  while (Date.now() < deadline && session.status === 'running') {
    await wait(20);
    session = bridge.status(sessionId);
  }
  return session;
}

async function expectError(work, code, label) {
  try {
    await work();
    failures.push(`${label}: expected ${code}`);
  } catch (error) {
    assert(error?.code === code, `${label}: expected ${code} but received ${error?.code || error?.message}`);
  }
}

async function main() {
  const bridge = createBridge();
  const capabilities = bridge.capabilities();
  assert(capabilities.readOnly === true && capabilities.mutation === 'none', 'capabilities are read-only');
  assert(capabilities.fixtureFallback === false, 'no fixture fallback is advertised');
  assert(capabilities.serviceCount === 36 && SERVICE_DEFINITIONS.length === 36, 'thirty-six services are advertised');
  assert(capabilities.worldCount === 3, 'three measured worlds are advertised');
  const worlds = new Set(SERVICE_DEFINITIONS.map((service) => service.world));
  assert(worlds.size === 3 && [...worlds].every((world) => ['system', 'network', 'hardware'].includes(world)), 'every service belongs to a canonical world');
  assert(new Set(SERVICE_DEFINITIONS.map((service) => service.id)).size === 36, 'service identifiers are unique');
  assert(
    SERVICE_DEFINITIONS.every((service) => /[\u0600-\u06FF]/.test(service.labelAr) && /[\u0600-\u06FF]/.test(service.noteAr)),
    'every service carries authored Arabic labels and notes'
  );
  assert(GATED_OPERATIONS.length === 8 && GATED_OPERATIONS.every((operation) => operation.id && operation.mission && operation.reason), 'eight mutation gates name their mission and reason');
  assert(STAGE_DEFINITIONS.length === 9, 'nine measured scan stages are fixed');

  await expectError(() => bridge.snapshot(), 'SYSTEM_NOT_MEASURED', 'an unscanned snapshot is refused');
  await expectError(() => bridge.processes(), 'SYSTEM_NOT_MEASURED', 'an unscanned process read is refused');
  await expectError(() => bridge.status('missing-session'), 'SYSTEM_SESSION_NOT_FOUND', 'an unknown session is refused');
  await expectError(() => bridge.cancel('missing-session'), 'SYSTEM_SESSION_NOT_FOUND', 'an unknown cancellation is refused');

  const started = bridge.start();
  assert(started.status === 'running' && started.stages.length === 9, 'a nine-stage session starts');
  const session = await settle(bridge, started.id);
  assert(session.status === 'complete', `the measured scan completes (was ${session.status})`);
  assert(session.progress === 100, 'the completed session reports one hundred percent');
  assert(session.stages.every((stage) => stage.status === 'complete'), 'every collector stage completes');
  assert(session.readOnly === true && session.mutation === 'none', 'the session is read-only');

  const snapshot = await bridge.snapshot();
  assert(snapshot.contract === 'system.v1', 'the snapshot declares the system contract');
  assert(snapshot.readOnly === true && snapshot.mutation === 'none' && snapshot.fixtureFallback === false, 'the snapshot is measured and read-only');
  assert(/Windows 11/.test(snapshot.identity.osName || ''), 'the measured OS name is retained');
  assert(snapshot.identity.manufacturer === 'KNOuX Labs', 'the measured system manufacturer is retained');
  assert(snapshot.processCount === 3 && snapshot.processes.length === 3, 'three measured processes are retained');
  assert(snapshot.processes.some((entry) => entry.name === 'KNOuXTest.exe' && entry.cpuPercent === 1.6), 'process CPU is scaled by logical processors');
  assert(snapshot.processes.some((entry) => entry.name === 'System' && entry.protected === true), 'protected processes stay marked');
  assert(snapshot.services.length === 2 && snapshot.serviceEdges.length === 2, 'services and dependency edges are measured');
  assert(snapshot.startupLinks.length === 1 && snapshot.startupLinks[0].linkType === 'process-match', 'autorun links resolve by measured process evidence');
  assert(snapshot.events.length === 3 && snapshot.eventChannels.length === 1, 'events and channels are measured');
  assert(snapshot.boot.lastBootTime === '2026-10-26T09:00:00.000Z' && snapshot.boot.events.length === 1, 'boot evidence is measured');
  assert(snapshot.drivers.length === 2 && snapshot.drivers.filter((entry) => entry.signed === false).length === 1, 'signed driver evidence is retained');
  assert(snapshot.interfaces.length === 1 && snapshot.interfaces[0].ipv4.length === 1 && snapshot.interfaces[0].dnsServers.length === 2, 'interface addresses and DNS are measured');
  assert(snapshot.interfaces[0].gateway === '192.0.2.1', 'the default gateway is measured');
  assert(snapshot.routes.length === 1 && snapshot.neighbors.length === 1, 'routes and observed neighbors are measured');
  assert(snapshot.sockets.length === 2 && snapshot.sockets.some((entry) => entry.processName === 'KNOuXTest.exe'), 'socket owners resolve to measured processes');
  assert(snapshot.wifi.state === 'connected' && snapshot.wifi.ssid === 'KNOuX-Lab' && snapshot.wifi.profiles.length === 2, 'Wi-Fi evidence is measured');
  assert(snapshot.hosts.readable === true && snapshot.hosts.activeMappings === 3, 'the hosts file is read');
  assert(snapshot.proxies.lanes.length === 3 && snapshot.proxies.effective === 'direct', 'proxy lanes are measured');
  assert(snapshot.hardware.cpu.length === 1 && snapshot.hardware.memory.length === 1 && snapshot.hardware.disks.length === 1, 'hardware inventory is measured');
  assert(snapshot.hardware.batteries.length === 1 && snapshot.hardware.batteries[0].cycleCount === 122, 'battery cycle evidence is retained');
  assert(snapshot.hardware.thermal.available === true && snapshot.hardware.thermal.celsius === 26.9, 'thermal evidence is measured');
  assert(snapshot.hardware.availability.monitors === false, 'missing monitor evidence stays unavailable');
  assert(snapshot.coverage.length === 9 && snapshot.coverage.every((stage) => stage.status === 'complete'), 'coverage reports every stage');
  assert(snapshot.timeline.some((entry) => entry.lane === 'windows') && snapshot.timeline.some((entry) => entry.kind === 'scan'), 'the unified timeline carries Windows and observation evidence');
  assert(!snapshot.timeline.some((entry) => entry.lane === 'knoux'), 'the KNOuX mutation lane stays empty');
  assert(snapshot.metrics.cpuPercent === 21.5 && snapshot.metrics.memoryPercent === 62.5, 'the performance sample is measured');

  const metrics = await bridge.sample();
  assert(metrics.timestamp === '2026-10-26T12:00:00.000Z', 'the injected clock timestamps the sample');
  assert(metrics.diskLatencyMs === 2.1 && metrics.networkInBytesPerSec === 2097152, 'sample counters are normalized');

  const processes = await bridge.processes();
  assert(processes.total === 3 && processes.truncated === false, 'the process register reports honest totals');

  const errors = await bridge.events({ levels: [2], limit: 10 });
  assert(errors.total === 1 && errors.events[0].channel === 'System' && errors.truncated === false, 'event levels filter measured records');
  const search = await bridge.events({ search: 'measured test warning', limit: 10 });
  assert(search.total === 1 && search.events[0].channel === 'Application', 'event search matches the provider message');
  const limited = await bridge.events({ channel: 'System', limit: 1 });
  assert(limited.total === 2 && limited.events.length === 1 && limited.truncated === true, 'event limits preserve the measured total');
  assert((await bridge.events({})).channels.length === 1, 'event channels accompany filtered results');

  const signatures = await bridge.signatures(['C:\\Windows\\explorer.exe', 'C:\\Program Files\\KNOuX\\test.exe']);
  assert(signatures.requested === 2 && signatures.verified === 1, 'only a Valid Authenticode status counts as verified');
  assert(signatures.signatures[0].signatureStatus === 'Valid' && signatures.signatures[0].rootTrusted === true, 'the trusted signer chain is retained');
  assert(signatures.signatures[1].signatureStatus === 'NotSigned' && signatures.signatures[1].signerSubject === null, 'an unsigned file is stated honestly');
  const signatureCalls = bridge.getProvider().calls.filter((label) => label === 'Get-AuthenticodeSignature').length;
  await bridge.signatures(['C:\\Windows\\explorer.exe']);
  assert(bridge.getProvider().calls.filter((label) => label === 'Get-AuthenticodeSignature').length === signatureCalls, 'verified signatures are cached');
  await expectError(() => bridge.signatures(['relative\\tool.exe']), 'SYSTEM_SIGNATURE_INPUT_INVALID', 'a relative signature path is refused');

  const trace = await bridge.traceroute({ target: '198.51.100.1', maxHops: 8 });
  assert(trace.hops.length === 3 && trace.hops[0].address === '192.0.2.1', 'hop addresses are parsed');
  assert(trace.hops[2].timedOut === true && trace.reached === false, 'timeouts are not treated as arrival');
  const reached = await bridge.traceroute({ target: '203.0.113.1' });
  assert(reached.hops.length === 2 && reached.reached === true, 'a trace stops when the target responds');
  assert(/^trace:/.test(trace.receipt), 'the trace carries a receipt');

  const server = net.createServer((socket) => socket.end());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    const diagnostic = await bridge.diagnostics({ type: 'tcp', target: '127.0.0.1', port });
    assert(diagnostic.ok === true && diagnostic.stages.length === 2, 'a loopback TCP diagnostic passes without external traffic');
    assert(diagnostic.stages[0].stage === 'dns' && diagnostic.stages[1].stage === 'tcp', 'diagnostic stages are ordered');
    assert(/^diag:/.test(diagnostic.receipt) && diagnostic.readOnly === true, 'the diagnostic carries a read-only receipt');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  await expectError(() => bridge.diagnostics({ type: 'ping', target: 'bad host; calc' }), 'SYSTEM_TARGET_INVALID', 'a shell-like target is refused');
  await expectError(() => bridge.diagnostics({ type: 'tcp', target: '127.0.0.1' }), 'SYSTEM_PORT_INVALID', 'a TCP diagnostic requires a port');
  await expectError(() => bridge.diagnostics({ type: 'udp', target: '127.0.0.1' }), 'SYSTEM_DIAGNOSTIC_TYPE_INVALID', 'an unlisted diagnostic is refused');

  const hosts = await bridge.hosts();
  assert(hosts.exists === true && hosts.sha256 && hosts.entries.length === 5, 'the hosts file carries a measured digest');
  const comment = await bridge.hostsPlan({ mode: 'comment', lineNumber: 4 });
  assert(comment.allowed === true && comment.after[3].startsWith('# 192.0.2.5'), 'a comment draft stages an immutable diff');
  assert(comment.execution.available === false && comment.mutation === 'none', 'a hosts draft cannot execute');
  const add = await bridge.hostsPlan({ mode: 'add', ip: '203.0.113.9', hostnames: ['agent.knoux.test'] });
  assert(add.addedLines === 1 && add.after.length === 6, 'an add draft appends one measured line');
  const uncomment = await bridge.hostsPlan({ mode: 'uncomment', lineNumber: 5 });
  assert(uncomment.after[4] === '192.0.2.6 disabled.test', 'an uncomment draft preserves the mapping');
  await expectError(() => bridge.hostsPlan({ mode: 'add', ip: 'not-an-ip', hostnames: ['agent.knoux.test'] }), 'SYSTEM_HOSTS_DRAFT_INVALID', 'an invalid draft address is refused');
  await expectError(() => bridge.hostsPlan({ mode: 'add', ip: '203.0.113.9', hostnames: ['bad host'] }), 'SYSTEM_HOSTS_DRAFT_INVALID', 'an invalid draft hostname is refused');
  await expectError(() => bridge.hostsPlan({ mode: 'execute' }), 'SYSTEM_HOSTS_DRAFT_INVALID', 'an unlisted draft mode is refused');

  const report = await bridge.report({ redact: true });
  assert(report.readOnly === true && report.mutation === 'none' && report.redacted === true, 'the report is redacted and read-only');
  assert(report.sections.length >= 9 && report.sections.some((section) => section.id === 'hardware'), 'the report covers every world');
  assert(/No machine-changing action was executed/.test(report.summary), 'the report states that no mutation ran');
  assert(/^report:/.test(report.receipt), 'the report carries a receipt');

  assert(bridge.settingsTarget('display').uri === 'ms-settings:display', 'an allowlisted settings page resolves');
  await expectError(() => bridge.settingsTarget('registry'), 'SYSTEM_SETTINGS_TARGET_INVALID', 'an unlisted settings page is refused');

  for (const method of ['terminateProcess', 'stopService', 'writeHosts', 'setProxy', 'resetAdapter', 'changePower', 'installDriver', 'execute']) {
    assert(typeof bridge[method] !== 'function', `the bridge exposes no ${method} method`);
  }

  const cancelBridge = createBridge();
  const cancelStart = cancelBridge.start();
  const cancelled = cancelBridge.cancel(cancelStart.id);
  assert(cancelled.cancelled === true, 'a running session can be cancelled');
  const cancelSettled = await settle(cancelBridge, cancelStart.id);
  assert(cancelSettled.status === 'cancelled', 'a cancelled session reports the cancellation');
  await expectError(() => cancelBridge.snapshot(), 'SYSTEM_NOT_MEASURED', 'a cancelled scan caches no snapshot');
  await cancelBridge.close();

  const source = fs.readFileSync(path.join(__dirname, '..', 'electron', 'native', 'system-bridge.cjs'), 'utf8');
  for (const forbidden of ['Stop-Process', 'Stop-Service', 'Set-Service', 'Set-ItemProperty', 'New-ItemProperty', 'Remove-Item', 'Set-NetAdapter', 'Restart-NetAdapter', 'ipconfig /flushdns', 'netsh winsock reset', 'shutdown.exe', 'fs.writeFile', 'fs.rename', 'fs.unlink', 'child_process.exec(']) {
    assert(!source.includes(forbidden), `the bridge has no mutation call: ${forbidden}`);
  }

  // Renderer integration gate: every native descriptor must be reachable from
  // the catalog and resolved by a specialised workbench, and the page must be
  // wired to the measured controller with no fixture inventory left behind.
  const rendererRoot = path.join(__dirname, '..', 'src');
  const catalogSource = fs.readFileSync(path.join(rendererRoot, 'system', 'catalog.ts'), 'utf8');
  const workbenchSource = fs.readFileSync(path.join(rendererRoot, 'system', 'SystemServiceWorkspaces.tsx'), 'utf8');
  const pageSource = fs.readFileSync(path.join(rendererRoot, 'pages', 'SystemPage.tsx'), 'utf8');
  const styleSource = fs.readFileSync(path.join(rendererRoot, 'system.css'), 'utf8');
  for (const service of SERVICE_DEFINITIONS) {
    assert(catalogSource.includes(`id: '${service.id}'`), `catalog declares ${service.id}`);
    assert(workbenchSource.includes(`'${service.id}':`), `a workbench resolves ${service.id}`);
    assert(!pageSource.includes(`'${service.id}': undefined`), `no empty workbench placeholder for ${service.id}`);
  }
  assert(/SERVICE_CATALOG: ServiceCatalogEntry\[\]/.test(catalogSource), 'the catalog is a typed descriptor array');
  assert(/useSystem\(\)/.test(pageSource), 'SystemPage consumes the measured controller');
  assert(/SystemServiceWorkspace/.test(pageSource), 'SystemPage mounts specialised service workbenches');
  assert(!/system-inventory/.test(pageSource), 'SystemPage imports no fixture inventory module');
  assert(!/\bINITIAL_[A-Z]/.test(pageSource) && !/\bSAMPLE_[A-Z]/.test(pageSource), 'SystemPage references no fixture constants');
  assert(!fs.existsSync(path.join(rendererRoot, 'lib', 'system-inventory.ts')), 'the old fixture inventory was removed');
  assert(!fs.existsSync(path.join(rendererRoot, 'components', 'system', 'SystemWorkspaces.tsx')), 'the old generic modal was removed');
  assert(/\.sys-viewport/.test(styleSource), 'the sys design system is authored');
  assert(/html\[data-theme='light'\] \.sys-viewport/.test(styleSource), 'the sys design system has a daylight palette');

  await bridge.close();

  const result = {
    ok: failures.length === 0,
    services: SERVICE_DEFINITIONS.length,
    stages: STAGE_DEFINITIONS.length,
    processes: snapshot.processCount,
    servicesMeasured: snapshot.services.length,
    drivers: snapshot.drivers.length,
    events: snapshot.events.length,
    sockets: snapshot.sockets.length,
    neighbors: snapshot.neighbors.length,
    hardwareDisks: snapshot.hardware.disks.length,
    gates: GATED_OPERATIONS.length,
    signaturesVerified: signatures.verified,
    traceHops: trace.hops.length,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('[system-native-test] PASS');
}

main().catch((error) => {
  console.error('[system-native-test] FAIL', error);
  process.exit(1);
});
