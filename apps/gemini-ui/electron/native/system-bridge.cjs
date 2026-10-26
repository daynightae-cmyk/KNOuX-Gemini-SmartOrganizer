'use strict';

/**
 * KNOuX Gemini - read-only Live Pulse observatory coordinator (Mission 10).
 *
 * One bounded scan feeds the 36 canonical system, network and hardware
 * services. It composes audited Windows providers (CIM, Net*, Get-WinEvent,
 * Authenticode, netsh) and Node's DNS/TCP/TLS diagnostics. There is no
 * process termination, service control, registry write, hosts write, proxy
 * write, adapter reset or driver change channel. Plans are immutable previews
 * and every execution stays gated.
 */

const crypto = require('node:crypto');
const dns = require('node:dns');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const {
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
  stableId,
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
} = require('./system-providers.cjs');

const execFileAsync = promisify(execFile);
const CONTRACT = 'system.v1';
const MAX_PROCESS_ROWS = 320;
const MAX_SIGNATURE_PATHS = 24;
const MAX_EVENT_RESULT = 200;
const MAX_TRACE_HOPS = 15;
const SCAN_TIMEOUT_MS = 150000;
const SAMPLE_TIMEOUT_MS = 20000;
const DIAGNOSTIC_TIMEOUT_MS = 15000;
const TRACE_TIMEOUT_MS = 30000;
const MAX_SERIES_SAMPLES = 120;
const SNAPSHOT_TTL_MS = 30000;

const STAGE_DEFINITIONS = Object.freeze([
  { key: 'system', labelEn: 'System identity & core hardware', labelAr: 'هوية النظام والعتاد الأساسي' },
  { key: 'processes', labelEn: 'Process register', labelAr: 'سجل العمليات' },
  { key: 'services', labelEn: 'Services & autorun links', labelAr: 'الخدمات وروابط بدء التشغيل' },
  { key: 'events', labelEn: 'Windows event ledger', labelAr: 'سجل أحداث Windows' },
  { key: 'drivers', labelEn: 'Signed driver inventory', labelAr: 'جرد برامج التشغيل الموقعة' },
  { key: 'network', labelEn: 'Network, proxy & Wi-Fi evidence', labelAr: 'أدلة الشبكة والوكيل وWi-Fi' },
  { key: 'sockets', labelEn: 'TCP/UDP sockets', labelAr: 'مقابس TCP/UDP' },
  { key: 'hardware', labelEn: 'Hardware atlas', labelAr: 'أطلس العتاد' },
  { key: 'timeline', labelEn: 'Unified timeline', labelAr: 'الخط الزمني الموحد' }
]);

const DEFAULTS = Object.freeze({
  scanTimeoutMs: SCAN_TIMEOUT_MS,
  sampleTimeoutMs: SAMPLE_TIMEOUT_MS,
  diagnosticTimeoutMs: DIAGNOSTIC_TIMEOUT_MS,
  traceTimeoutMs: TRACE_TIMEOUT_MS,
  maxSamples: MAX_SERIES_SAMPLES
});

const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/i;
const SETTINGS_TARGETS = Object.freeze({
  display: 'ms-settings:display',
  network: 'ms-settings:network-status',
  wifi: 'ms-settings:network-wifi',
  sound: 'ms-settings:sound'
});

function systemError(code, message, { retryable = false } = {}) {
  const error = new Error(message);
  error.code = code;
  error.retryable = retryable;
  return error;
}

function assertTarget(value) {
  const target = String(value == null ? '' : value).trim();
  if (!target || target.length > 253 || /[\s/\\'"`;|&<>]/.test(target)) {
    throw systemError('SYSTEM_TARGET_INVALID', 'The diagnostic target must be a bare hostname or IP address.');
  }
  if (net.isIP(target)) return target;
  if (!HOSTNAME_PATTERN.test(target)) {
    throw systemError('SYSTEM_TARGET_INVALID', 'The diagnostic target is not a valid hostname or IP address.');
  }
  return target;
}

function assertPort(value) {
  if (value == null) return null;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw systemError('SYSTEM_PORT_INVALID', 'The TCP port must be an integer from 1 to 65535.');
  }
  return port;
}

function assertPathList(paths) {
  if (!Array.isArray(paths) || !paths.length) {
    throw systemError('SYSTEM_SIGNATURE_INPUT_INVALID', 'At least one absolute executable path is required.');
  }
  const normalized = [];
  for (const candidate of paths) {
    if (typeof candidate !== 'string' || candidate.length > 520) continue;
    const trimmed = candidate.trim();
    if (!/^[a-zA-Z]:\\/.test(trimmed) || /[\r\n\0]/.test(trimmed)) continue;
    if (!/\.(exe|dll|sys|ocx|msi|cpl|scr)$/i.test(trimmed)) continue;
    if (!normalized.includes(trimmed)) normalized.push(trimmed);
    if (normalized.length >= MAX_SIGNATURE_PATHS) break;
  }
  if (!normalized.length) throw systemError('SYSTEM_SIGNATURE_INPUT_INVALID', 'No valid executable path was supplied.');
  return normalized;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, code, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(systemError(code, message, { retryable: true })), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function escapePwshSingle(value) {
  return String(value).replace(/'/g, "''");
}

function eventSeverity(level, levelName) {
  const normalized = String(levelName || '').toLowerCase();
  if (level === 1 || normalized.includes('critical')) return 'critical';
  if (level === 2 || normalized.includes('error')) return 'error';
  if (level === 3 || normalized.includes('warn')) return 'warning';
  return 'info';
}

function parseTracert(output, target) {
  const hops = [];
  const lines = String(output || '').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\s+(.*)$/);
    if (!match) continue;
    const hop = Number(match[1]);
    if (!Number.isInteger(hop) || hop < 1) continue;
    const rest = match[2];
    const latencies = [];
    const latencyMatches = rest.match(/(\d+)\s*ms/gi) || [];
    for (const latency of latencyMatches) {
      const value = Number(latency.replace(/[^\d]/g, ''));
      if (Number.isFinite(value)) latencies.push(value);
    }
    const ipMatch = rest.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/) || rest.match(/\b(?:[a-f0-9]{0,4}:){2,}[a-f0-9:]{1,}\b/i);
    const address = ipMatch ? ipMatch[0] : null;
    if (!address && !latencies.length && !/\*/.test(rest)) continue;
    hops.push({
      hop,
      address,
      latencyMs: latencies,
      timedOut: !address,
      asn: null
    });
    if (address && address === target) break;
  }
  return hops;
}

function parsePing(output) {
  const textOutput = String(output || '');
  const latencies = [];
  const matches = textOutput.match(/(?:time|زمن|tiempo|temps)[=<]\s*(\d+)\s*ms/gi) || textOutput.match(/[=<]\s*(\d+)\s*ms/gi) || [];
  for (const match of matches) {
    const value = Number(match.replace(/[^\d]/g, ''));
    if (Number.isFinite(value)) latencies.push(value);
  }
  const lossMatch = textOutput.match(/\((\d+)%\s*(?:loss|فقد)/i);
  const lossPercent = lossMatch ? Number(lossMatch[1]) : null;
  const reply = latencies.length > 0;
  return { latencies, lossPercent, reply };
}

class SystemBridge {
  constructor(options = {}) {
    this.provider = options.provider || null;
    this.loadProvider = typeof options.loadProvider === 'function' ? options.loadProvider : null;
    this.runFile = options.runFile || execFileAsync;
    this.readFile = options.readFile || ((target, encoding) => fs.promises.readFile(target, encoding));
    this.statFile = options.statFile || ((target) => fs.promises.stat(target));
    this.now = options.now || (() => new Date());
    this.settingsTargets = SETTINGS_TARGETS;
    this.hostsPath = options.hostsPath || path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts');
    this.wifiAdapters = options.wifiAdapters || null;
    this.limits = { ...DEFAULTS, ...(options.limits || {}) };
    this.session = null;
    this.snapshotCache = null;
    this.snapshotGeneratedAt = 0;
    this.series = [];
    this.diagnosticBusy = false;
    this.signatureCache = new Map();
  }

  capabilities() {
    return {
      engine: 'KNOuX Live Pulse measured observatory',
      contract: CONTRACT,
      readOnly: true,
      mutation: 'none',
      fixtureFallback: false,
      serviceCount: 36,
      worldCount: 3,
      services: SERVICE_DEFINITIONS,
      gatedOperations: GATED_OPERATIONS,
      sources: [
        'Win32_OperatingSystem', 'Win32_ComputerSystem', 'Win32_Processor', 'Win32_PhysicalMemory',
        'Win32_VideoController', 'Win32_DesktopMonitor', 'WmiMonitorID', 'Win32_Battery', 'root/WMI Battery*',
        'Win32_Process', 'PerfProc process counters', 'Win32_Service', 'Win32_DependentService',
        'Win32_StartupCommand', 'Win32_PnPSignedDriver', 'Get-WinEvent', 'Get-PhysicalDisk',
        'Get-StorageReliabilityCounter', 'Get-NetAdapter', 'Get-NetIPAddress', 'Get-NetIPInterface',
        'Get-DnsClient', 'Get-DnsClientServerAddress', 'Get-NetRoute', 'Get-NetNeighbor',
        'Get-NetTCPConnection', 'Get-NetUDPEndpoint', 'netsh wlan', 'Internet Settings', 'WinHTTP',
        'PerfOS counters', 'PerfDisk counters', 'Tcpip counters', 'Get-AuthenticodeSignature',
        'DNS resolver', 'TCP socket probe', 'HTTP HEAD probe', 'tracert'
      ],
      limits: {
        processes: MAX_PROCESS_ROWS,
        drivers: 300,
        services: 600,
        events: MAX_EVENT_RESULT,
        channels: 240,
        sockets: 420,
        neighbors: 240,
        signaturePaths: MAX_SIGNATURE_PATHS,
        traceHops: MAX_TRACE_HOPS,
        scanTimeoutMs: this.limits.scanTimeoutMs
      },
      nativeOnly: [
        'Measured process, service, driver and event data',
        'Timestamped performance counter sampling',
        'Authenticode verification',
        'DNS, TCP, HTTP and ICMP diagnostics',
        'Read-only hosts and proxy inspection'
      ]
    };
  }

  stageTemplate() {
    return STAGE_DEFINITIONS.map((stage) => ({
      ...stage,
      status: 'pending',
      provider: 'Not started',
      startedAt: null,
      completedAt: null,
      durationMs: null,
      items: null,
      warning: null
    }));
  }

  start() {
    if (this.session && this.session.status === 'running') return this.publicSession();
    const startedAt = this.now().toISOString();
    const session = {
      contract: CONTRACT,
      id: crypto.randomUUID(),
      status: 'running',
      startedAt,
      completedAt: null,
      progress: 0,
      stages: this.stageTemplate(),
      warnings: [],
      readOnly: true,
      mutation: 'none'
    };
    this.session = session;
    this.snapshotCache = null;
    this.snapshotGeneratedAt = 0;
    this.series = [];
    this.scanPromise = this.runScan(session).catch((error) => {
      session.status = 'failed';
      session.completedAt = this.now().toISOString();
      session.warnings.push(error?.message || 'The observatory scan failed.');
      return null;
    });
    return this.publicSession();
  }

  publicSession() {
    if (!this.session) return null;
    const session = this.session;
    return {
      ...session,
      stages: session.stages.map((stage) => ({ ...stage })),
      warnings: [...session.warnings]
    };
  }

  status(sessionId) {
    if (!this.session || this.session.id !== sessionId) {
      throw systemError('SYSTEM_SESSION_NOT_FOUND', 'The requested observatory session does not exist.');
    }
    return this.publicSession();
  }

  cancel(sessionId) {
    if (!this.session || this.session.id !== sessionId) {
      throw systemError('SYSTEM_SESSION_NOT_FOUND', 'The requested observatory session does not exist.');
    }
    if (this.session.status !== 'running') {
      return { cancelled: false, status: this.session.status, sessionId };
    }
    this.session.cancelled = true;
    return { cancelled: true, status: this.session.status, sessionId };
  }

  async stage(session, key, providerLabel, work) {
    if (session.cancelled) throw systemError('SYSTEM_CANCELLED', 'The observatory scan was cancelled.');
    const stage = session.stages.find((entry) => entry.key === key);
    stage.status = 'running';
    stage.provider = providerLabel;
    stage.startedAt = this.now().toISOString();
    const started = Date.now();
    try {
      const result = await work();
      const items = Array.isArray(result) ? result.length : result && typeof result === 'object' ? null : null;
      stage.status = 'complete';
      stage.completedAt = this.now().toISOString();
      stage.durationMs = Date.now() - started;
      if (items != null) stage.items = items;
      return result;
    } catch (error) {
      stage.status = 'failed';
      stage.completedAt = this.now().toISOString();
      stage.durationMs = Date.now() - started;
      stage.warning = clip(error?.message || 'Stage failed.', 200);
      session.warnings.push(`${key}: ${stage.warning}`);
      return null;
    } finally {
      this.updateProgress(session);
    }
  }

  updateProgress(session) {
    const completed = session.stages.filter((stage) => ['complete', 'failed'].includes(stage.status)).length;
    session.progress = Math.round((completed / session.stages.length) * 100);
  }

  async powershell(script, providerLabel, timeout = 60000) {
    const provider = this.getProvider();
    if (!provider || typeof provider.powershellJson !== 'function') {
      throw systemError('SYSTEM_PROVIDER_MISSING', 'The measured Windows provider is not available.');
    }
    return provider.powershellJson(script, { provider: providerLabel, timeout });
  }

  getProvider() {
    if (this.provider) return this.provider;
    if (this.loadProvider) {
      this.provider = this.loadProvider();
    }
    return this.provider;
  }

  async runScan(session) {
    const scanStarted = Date.now();
    let core = normalizeCore({});
    let processResult = { processes: [], total: 0, truncated: false };
    let serviceResult = { services: [], edges: [] };
    let startupLinks = [];
    let eventResult = { events: [], channels: [] };
    let drivers = [];
    let network = { interfaces: [], routes: [], neighbors: [] };
    let sockets = [];
    let wifi = normalizeWifi({});
    let proxies = normalizeProxies({});
    let hosts = parseHostsFile('', this.hostsPath, { exists: false, readable: false, reason: 'The hosts file was not read.' });

    const coreRaw = await this.stage(session, 'system', 'Win32_OperatingSystem + CIM hardware', () =>
      this.powershell(SYSTEM_CORE_SCRIPT, 'Win32_Core', 70000));
    if (coreRaw) {
      core = normalizeCore(coreRaw, { now: this.now });
      const identityStage = session.stages.find((stage) => stage.key === 'system');
      identityStage.items = core.hardware.cpu.length + core.hardware.gpu.length + core.hardware.memory.length + core.hardware.disks.length;
    } else {
      core = normalizeCore({});
    }

    if (session.cancelled) return this.finishCancelled(session, scanStarted);

    const processRaw = await this.stage(session, 'processes', 'Win32_Process + PerfProc', async () => {
      const raw = await this.powershell(PROCESS_SCRIPT, 'Win32_Process+PerfProc', 45000);
      return normalizeProcesses(raw, { logicalProcessors: core.hardware.totals.logicalProcessors || 1 });
    });
    if (processRaw) processResult = processRaw;
    const processStage = session.stages.find((stage) => stage.key === 'processes');
    processStage.items = processResult.total;

    if (session.cancelled) return this.finishCancelled(session, scanStarted);

    const serviceRaw = await this.stage(session, 'services', 'Win32_Service + Win32_DependentService + autoruns', async () => {
      const raw = await this.powershell(SERVICE_SCRIPT, 'Win32_Service+Startup', 45000);
      const normalized = normalizeServices(raw);
      const links = normalizeStartupLinks(raw, { processes: processResult.processes, services: normalized.services });
      return { ...normalized, links };
    });
    if (serviceRaw) {
      serviceResult = { services: serviceRaw.services, edges: serviceRaw.edges };
      startupLinks = serviceRaw.links;
    }
    session.stages.find((stage) => stage.key === 'services').items = serviceResult.services.length + startupLinks.length;

    if (session.cancelled) return this.finishCancelled(session, scanStarted);

    const eventRaw = await this.stage(session, 'events', 'Get-WinEvent', async () => {
      const raw = await this.powershell(EVENT_SCRIPT, 'Get-WinEvent', 60000);
      return normalizeEvents(raw);
    });
    if (eventRaw) eventResult = eventRaw;
    session.stages.find((stage) => stage.key === 'events').items = eventResult.events.length;

    if (session.cancelled) return this.finishCancelled(session, scanStarted);

    const driverRaw = await this.stage(session, 'drivers', 'Win32_PnPSignedDriver', async () => {
      const raw = await this.powershell(DRIVER_SCRIPT, 'Win32_PnPSignedDriver', 45000);
      return normalizeDrivers(raw);
    });
    if (driverRaw) drivers = driverRaw;
    session.stages.find((stage) => stage.key === 'drivers').items = drivers.length;

    if (session.cancelled) return this.finishCancelled(session, scanStarted);

    const networkResult = await this.stage(session, 'network', 'NetTCPIP + netsh + Internet Settings', async () => {
      const [rawNetwork, rawProxies, wifiResult, hostsResult] = await Promise.all([
        this.powershell(NETWORK_SCRIPT, 'NetTCPIP', 45000),
        this.powershell(PROXY_SCRIPT, 'InternetSettings+WinHTTP', 30000).catch(() => null),
        this.readWifi().catch(() => normalizeWifi({})),
        this.readHosts().catch(() => parseHostsFile('', this.hostsPath, { exists: false, readable: false, reason: 'The hosts file could not be read.' }))
      ]);
      return {
        network: normalizeNetwork(rawNetwork || {}),
        proxies: normalizeProxies(rawProxies || {}),
        wifi: wifiResult,
        hosts: hostsResult
      };
    });
    if (networkResult) {
      network = networkResult.network;
      proxies = networkResult.proxies;
      wifi = networkResult.wifi;
      hosts = networkResult.hosts;
    }
    session.stages.find((stage) => stage.key === 'network').items = network.interfaces.length + network.neighbors.length;

    if (session.cancelled) return this.finishCancelled(session, scanStarted);

    const socketRaw = await this.stage(session, 'sockets', 'Get-NetTCPConnection + Get-NetUDPEndpoint', async () => {
      const raw = await this.powershell(SOCKET_SCRIPT, 'NetTCPIP+Sockets', 45000);
      return normalizeSockets(raw, { processes: processResult.processes });
    });
    if (socketRaw) sockets = socketRaw;
    session.stages.find((stage) => stage.key === 'sockets').items = sockets.length;

    if (session.cancelled) return this.finishCancelled(session, scanStarted);

    await this.stage(session, 'hardware', 'Win32 CIM + storage reliability', async () => {
      const items = core.hardware.cpu.length + core.hardware.gpu.length + core.hardware.memory.length + core.hardware.disks.length + core.hardware.usb.length + core.hardware.monitors.length + core.hardware.audio.length;
      session.stages.find((stage) => stage.key === 'hardware').items = items;
      return core.hardware;
    });

    const timeline = this.buildTimeline({ core, events: eventResult.events, generatedAt: this.now().toISOString() });
    await this.stage(session, 'timeline', 'Measured Windows events + observation markers', async () => {
      session.stages.find((stage) => stage.key === 'timeline').items = timeline.length;
      return timeline;
    });

    const metrics = await this.sampleInternal().catch(() => core.metrics);
    this.series = [metrics];

    const coverage = session.stages.map((stage) => ({
      key: stage.key,
      status: stage.status === 'complete' ? 'complete' : stage.status === 'failed' ? 'unavailable' : 'partial',
      provider: stage.provider,
      durationMs: stage.durationMs,
      items: stage.items,
      note: stage.warning
    }));

    const warnings = [...session.warnings];
    if (!core.hardware.availability.thermal) warnings.push(core.hardware.thermal.reason);
    if (!network.interfaces.length) warnings.push('No network adapter was measured.');
    if (!eventResult.events.length) warnings.push('No System/Application warning or error event was returned for the last seven days.');

    const snapshot = {
      contract: CONTRACT,
      generatedAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      fixtureFallback: false,
      identity: core.identity,
      metrics,
      processes: processResult.processes,
      processCount: processResult.total,
      drivers,
      services: serviceResult.services,
      serviceEdges: serviceResult.edges,
      startupLinks,
      events: eventResult.events,
      eventChannels: eventResult.channels,
      boot: core.boot,
      interfaces: network.interfaces,
      routes: network.routes,
      neighbors: network.neighbors,
      sockets,
      wifi,
      hosts,
      proxies,
      hardware: core.hardware,
      timeline,
      coverage,
      warnings,
      receipt: `sys:${sha256(`${session.id}:${core.identity.bootTime}:${processResult.total}:${eventResult.events.length}`).slice(0, 24)}`,
      sources: [
        'Win32_OperatingSystem', 'Win32_ComputerSystem', 'Win32_Processor', 'Win32_PhysicalMemory',
        'Win32_Process', 'Win32_Service', 'Win32_DependentService', 'Win32_StartupCommand',
        'Win32_PnPSignedDriver', 'Get-WinEvent', 'Get-PhysicalDisk', 'Get-NetAdapter',
        'Get-NetIPAddress', 'Get-DnsClient', 'Get-NetRoute', 'Get-NetNeighbor',
        'Get-NetTCPConnection', 'Get-NetUDPEndpoint', 'netsh wlan', 'Internet Settings'
      ]
    };

    this.snapshotCache = snapshot;
    this.snapshotGeneratedAt = Date.now();
    const failed = session.stages.filter((stage) => stage.status === 'failed').length;
    session.status = failed ? 'partial' : 'complete';
    session.completedAt = this.now().toISOString();
    session.progress = 100;
    session.durationMs = Date.now() - scanStarted;
    this.lastReceipt = snapshot.receipt;
    return snapshot;
  }

  finishCancelled(session, started) {
    for (const stage of session.stages) {
      if (stage.status === 'pending' || stage.status === 'running') stage.status = 'cancelled';
    }
    session.status = 'cancelled';
    session.completedAt = this.now().toISOString();
    session.progress = 100;
    session.durationMs = Date.now() - started;
    this.snapshotCache = null;
    return null;
  }

  buildTimeline({ core, events, generatedAt }) {
    const timeline = [];
    if (core.boot.lastBootTime) {
      timeline.push({
        id: stableId('timeline', 'boot', core.boot.lastBootTime),
        at: core.boot.lastBootTime,
        lane: 'observation',
        kind: 'boot',
        title: 'Windows boot recorded',
        detail: `LastBootUpTime reports ${core.identity.osName || 'Windows'} started at this time.`,
        source: 'Win32_OperatingSystem.LastBootUpTime',
        severity: 'info',
        recordId: null
      });
    }
    for (const event of events.slice(0, 80)) {
      const severity = eventSeverity(event.level, event.levelName);
      timeline.push({
        id: stableId('timeline', 'event', event.id),
        at: event.timeCreated,
        lane: 'windows',
        kind: `${event.channel} / ${event.eventId ?? 'event'}`,
        title: `${event.provider} ${event.eventId != null ? `#${event.eventId}` : 'event'}`,
        detail: event.message,
        source: 'Get-WinEvent',
        severity,
        recordId: event.recordId != null ? String(event.recordId) : null
      });
    }
    timeline.push({
      id: stableId('timeline', 'observation', generatedAt),
      at: generatedAt,
      lane: 'observation',
      kind: 'scan',
      title: 'Measured observatory scan completed',
      detail: 'The snapshot was assembled from read-only Windows providers. The KNOuX lane intentionally contains no mutation events.',
      source: 'KNOuX observatory',
      severity: 'info',
      recordId: null
    });
    return timeline.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)).slice(0, 160);
  }

  async readHosts() {
    const filePath = this.hostsPath;
    let content = '';
    let stat = null;
    let exists = true;
    let readable = true;
    let reason = null;
    try {
      content = await this.readFile(filePath, 'utf8');
      stat = await this.statFile(filePath);
    } catch (error) {
      exists = error?.code !== 'ENOENT';
      readable = false;
      reason = exists
        ? 'The hosts file exists but Windows denied this process read access.'
        : 'The hosts file was not found at the standard System32 path.';
    }
    const info = parseHostsFile(content, filePath, {
      exists,
      readable,
      lastWriteTime: stat ? this.nowFromStat(stat) : null,
      sha256: readable ? sha256(content) : null,
      reason
    });
    return info;
  }

  nowFromStat(stat) {
    const value = stat?.mtime instanceof Date ? stat.mtime : null;
    return value ? value.toISOString() : null;
  }

  async readWifi() {
    const adapters = this.wifiAdapters || [];
    let interfaceOutput = '';
    let profilesOutput = '';
    try {
      const result = await this.runFile('netsh.exe', ['wlan', 'show', 'interfaces'], { windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024 });
      interfaceOutput = String(result?.stdout || '');
    } catch (error) {
      interfaceOutput = '';
    }
    try {
      const result = await this.runFile('netsh.exe', ['wlan', 'show', 'profiles'], { windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024 });
      profilesOutput = String(result?.stdout || '');
    } catch (error) {
      profilesOutput = '';
    }
    return normalizeWifi({ interfaceOutput, profilesOutput, adapters });
  }

  async snapshot() {
    if (!this.snapshotCache) {
      throw systemError('SYSTEM_NOT_MEASURED', 'No measured snapshot is available yet. Start an observatory scan first.');
    }
    return this.snapshotCache;
  }

  async sampleInternal() {
    const raw = await this.powershell(SAMPLE_SCRIPT, 'PerformanceCounters', this.limits.sampleTimeoutMs);
    return normalizeSample(raw || {}, { logicalProcessors: this.hardwareLogical(), now: this.now });
  }

  hardwareLogical() {
    if (this.snapshotCache?.hardware?.totals?.logicalProcessors) return this.snapshotCache.hardware.totals.logicalProcessors;
    return 1;
  }

  async sample() {
    const metrics = await withTimeout(
      this.sampleInternal(),
      this.limits.sampleTimeoutMs + 5000,
      'SYSTEM_SAMPLE_TIMEOUT',
      'The performance counter sample timed out.'
    );
    this.series.push(metrics);
    if (this.series.length > this.limits.maxSamples) this.series = this.series.slice(-this.limits.maxSamples);
    return metrics;
  }

  async processes() {
    if (!this.snapshotCache) throw systemError('SYSTEM_NOT_MEASURED', 'No measured snapshot is available yet.');
    return {
      contract: CONTRACT,
      processes: this.snapshotCache.processes,
      total: this.snapshotCache.processCount,
      truncated: this.snapshotCache.processes.length < this.snapshotCache.processCount,
      observedAt: this.snapshotCache.generatedAt
    };
  }

  async events(query = {}) {
    if (!this.snapshotCache) throw systemError('SYSTEM_NOT_MEASURED', 'No measured snapshot is available yet.');
    const channel = text(query.channel);
    const levels = Array.isArray(query.levels) ? query.levels.map(Number).filter((value) => [1, 2, 3, 4, 5].includes(value)) : [];
    const sinceHours = numberOrNull(query.sinceHours);
    const search = text(query.search);
    const limit = Math.max(1, Math.min(MAX_EVENT_RESULT, numberOrNull(query.limit) || 100));
    const now = this.now().getTime();
    let events = this.snapshotCache.events.filter((event) => {
      if (channel && event.channel !== channel) return false;
      if (levels.length && !levels.includes(event.level)) return false;
      if (sinceHours != null && event.timeCreated) {
        if (now - new Date(event.timeCreated).getTime() > sinceHours * 3600 * 1000) return false;
      }
      if (search) {
        const needle = search.toLowerCase();
        if (!`${event.provider} ${event.message} ${event.eventId} ${event.levelName}`.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
    const total = events.length;
    events = events.slice(0, limit);
    return {
      contract: CONTRACT,
      events,
      total,
      truncated: total > events.length,
      query: { channel: channel || undefined, levels, sinceHours: sinceHours ?? undefined, search: search || undefined, limit },
      channels: this.snapshotCache.eventChannels,
      observedAt: this.snapshotCache.generatedAt
    };
  }

  async signatures(paths) {
    const candidates = assertPathList(paths);
    const cached = candidates.map((candidate) => this.signatureCache.get(candidate)).filter(Boolean);
    if (cached.length === candidates.length) {
      return { contract: CONTRACT, signatures: cached, requested: candidates.length, verified: cached.filter((entry) => String(entry.signatureStatus || '').toLowerCase() === 'valid').length, truncated: false, observedAt: this.now().toISOString() };
    }
    const list = candidates.map((candidate) => `'${escapePwshSingle(candidate)}'`).join(',');
    const script = [
      '$paths=@(' + list + ')',
      '$out=@()',
      'foreach($p in $paths){',
      '  try { $s=Get-AuthenticodeSignature -LiteralPath $p -ErrorAction Stop;',
      '    $c=$s.SignerCertificate;',
      '    $root=$null; $rootTrusted=$null;',
      '    if($s.Chain -and $s.Chain.ChainElements.Count -gt 0){ $root=$s.Chain.ChainElements[$s.Chain.ChainElements.Count-1].Certificate.Subject; $rootTrusted=$s.Chain.ChainStatus.Count -eq 0 }',
      '    $out += [pscustomobject]@{path=$p;status=[string]$s.Status;signer=if($c){$c.Subject}else{$null};thumbprint=if($c){$c.Thumbprint}else{$null};notBefore=if($c){$c.NotBefore}else{$null};notAfter=if($c){$c.NotAfter}else{$null};root=$root;rootTrusted=$rootTrusted;message=if($s.StatusMessage){[string]$s.StatusMessage}else{$null}}',
      '  } catch { $out += [pscustomobject]@{path=$p;status=$null;message=\'not-checked\'} }',
      '}',
      '$out | ConvertTo-Json -Depth 4 -Compress'
    ].join('; ');
    let rows = [];
    try {
      const provider = this.getProvider();
      if (provider && typeof provider.powershellJson === 'function') {
        rows = asArray(await provider.powershellJson(script, { provider: 'Get-AuthenticodeSignature', timeout: 60000 }));
      } else {
        const result = await this.runFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true, timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
        rows = asArray(JSON.parse(String(result?.stdout || '[]')));
      }
    } catch (error) {
      rows = [];
    }
    const signatures = candidates.map((candidate) => {
      const row = rows.find((entry) => String(entry.path).toLowerCase() === candidate.toLowerCase());
      if (!row) {
        return {
          path: candidate,
          signatureStatus: null,
          signatureAvailable: false,
          signerSubject: null,
          signerThumbprint: null,
          signerNotBefore: null,
          signerNotAfter: null,
          rootSubject: null,
          rootTrusted: null,
          message: 'Authenticode verification did not return a record for this path.',
          source: 'Get-AuthenticodeSignature'
        };
      }
      const signature = {
        path: candidate,
        signatureStatus: text(row.status),
        signatureAvailable: text(row.status) != null,
        signerSubject: text(row.signer),
        signerThumbprint: text(row.thumbprint),
        signerNotBefore: row.notBefore ? new Date(row.notBefore).toISOString() : null,
        signerNotAfter: row.notAfter ? new Date(row.notAfter).toISOString() : null,
        rootSubject: text(row.root),
        rootTrusted: typeof row.rootTrusted === 'boolean' ? row.rootTrusted : null,
        message: text(row.message),
        source: 'Get-AuthenticodeSignature'
      };
      this.signatureCache.set(candidate, signature);
      return signature;
    });
    return {
      contract: CONTRACT,
      signatures,
      requested: candidates.length,
      verified: signatures.filter((entry) => String(entry.signatureStatus || '').toLowerCase() === 'valid').length,
      truncated: candidates.length >= MAX_SIGNATURE_PATHS,
      observedAt: this.now().toISOString()
    };
  }

  async diagnostics(request = {}) {
    const type = String(request.type || '');
    if (!['dns', 'tcp', 'http', 'ping'].includes(type)) {
      throw systemError('SYSTEM_DIAGNOSTIC_TYPE_INVALID', 'The diagnostic type must be dns, tcp, http or ping.');
    }
    if (this.diagnosticBusy) throw systemError('SYSTEM_DIAGNOSTIC_BUSY', 'Another network diagnostic is already running.', { retryable: true });
    const target = assertTarget(request.target);
    const port = type === 'tcp' || type === 'http' ? assertPort(request.port) ?? (type === 'http' ? 443 : null) : null;
    if (type === 'tcp' && port == null) throw systemError('SYSTEM_PORT_INVALID', 'A TCP diagnostic requires a port.');
    this.diagnosticBusy = true;
    const started = Date.now();
    const startedAt = this.now().toISOString();
    const stages = [];
    try {
      const dnsResult = await this.dnsStage(target);
      stages.push(dnsResult.stage);
      const addresses = dnsResult.addresses;
      if (type === 'ping') {
        stages.push(await this.pingStage(target));
      } else if (type === 'tcp' || type === 'http') {
        const address = addresses[0] || target;
        const tcpResult = await this.tcpStage(address, port, target);
        stages.push(tcpResult);
        if (type === 'http' && tcpResult.status === 'passed') {
          stages.push(await this.httpStage(target, port));
        } else if (type === 'http') {
          stages.push({ stage: 'http', label: 'HTTP probe', status: 'skipped', latencyMs: null, detail: 'HTTP probe was skipped because the TCP socket did not connect.', evidence: [] });
        }
      }
      const ok = stages.length > 0 && stages.every((stage) => stage.status === 'passed' || stage.status === 'skipped');
      const durationMs = Date.now() - started;
      return {
        contract: CONTRACT,
        type,
        target,
        port,
        ok,
        startedAt,
        durationMs,
        stages,
        receipt: `diag:${sha256(`${type}:${target}:${port}:${startedAt}:${durationMs}`).slice(0, 24)}`,
        readOnly: true
      };
    } finally {
      this.diagnosticBusy = false;
    }
  }

  async dnsStage(target) {
    const started = Date.now();
    if (net.isIP(target)) {
      return {
        addresses: [target],
        stage: {
          stage: 'dns',
          label: 'DNS resolution',
          status: 'passed',
          latencyMs: Date.now() - started,
          detail: 'Target is a literal IP address; DNS was not required.',
          evidence: [target]
        }
      };
    }
    try {
      const addresses = await withTimeout(
        Promise.allSettled([dns.promises.resolve4(target), dns.promises.resolve6(target)]).then((results) => {
          const values = [];
          for (const result of results) if (result.status === 'fulfilled') values.push(...result.value);
          return [...new Set(values)];
        }),
        5000,
        'SYSTEM_DNS_TIMEOUT',
        'The DNS resolver did not answer within five seconds.'
      );
      return {
        addresses,
        stage: {
          stage: 'dns',
          label: 'DNS resolution',
          status: addresses.length ? 'passed' : 'failed',
          latencyMs: Date.now() - started,
          detail: addresses.length ? `Resolved ${target} to ${addresses.join(', ')}.` : `${target} returned no A or AAAA records.`,
          evidence: addresses
        }
      };
    } catch (error) {
      return {
        addresses: net.isIP(target) ? [target] : [],
        stage: {
          stage: 'dns',
          label: 'DNS resolution',
          status: net.isIP(target) ? 'passed' : error.code === 'SYSTEM_DNS_TIMEOUT' ? 'timeout' : 'failed',
          latencyMs: Date.now() - started,
          detail: net.isIP(target) ? 'Target is a literal IP address; DNS was not required.' : error.message,
          evidence: net.isIP(target) ? [target] : []
        }
      };
    }
  }

  async tcpStage(address, port, target) {
    const started = Date.now();
    return new Promise((resolve) => {
      const socket = net.createConnection({ host: address, port });
      let settled = false;
      const finish = (status, detail) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve({
          stage: 'tcp',
          label: 'TCP socket connection',
          status,
          latencyMs: Date.now() - started,
          detail,
          evidence: [`${target} (${address}) TCP/${port}`]
        });
      };
      socket.setTimeout(6000);
      socket.once('connect', () => finish('passed', `TCP connect succeeded on ${address}:${port}.`));
      socket.once('timeout', () => finish('timeout', `TCP connect timed out after 6 seconds on ${address}:${port}.`));
      socket.once('error', (error) => finish('failed', `TCP connect failed on ${address}:${port}: ${error.code || error.message}.`));
    });
  }

  async httpStage(target, port) {
    const started = Date.now();
    const protocol = port === 80 ? 'http' : 'https';
    const module = protocol === 'https' ? require('node:https') : require('node:http');
    return new Promise((resolve) => {
      let settled = false;
      const finish = (status, detail, evidence = []) => {
        if (settled) return;
        settled = true;
        resolve({
          stage: 'http',
          label: 'HTTP HEAD probe',
          status,
          latencyMs: Date.now() - started,
          detail,
          evidence
        });
      };
      const request = module.request({
        host: target,
        port,
        path: '/',
        method: 'HEAD',
        timeout: 8000,
        servername: protocol === 'https' ? target : undefined,
        headers: { 'User-Agent': 'KNOuX-Observatory/1.0', Accept: '*/*' }
      }, (response) => {
        response.resume();
        finish('passed', `HTTP HEAD returned status ${response.statusCode}. No redirect was followed and no body was downloaded.`, [`status=${response.statusCode}`]);
      });
      request.once('timeout', () => {
        request.destroy();
        finish('timeout', 'HTTP HEAD timed out after 8 seconds.');
      });
      request.once('error', (error) => finish('failed', `HTTP HEAD failed: ${error.code || error.message}.`));
      request.end();
    });
  }

  async pingStage(target) {
    const started = Date.now();
    try {
      const result = await withTimeout(
        this.runFile('ping.exe', ['-n', '4', '-w', '1000', target], { windowsHide: true, timeout: 12000, maxBuffer: 1024 * 1024 }),
        13000,
        'SYSTEM_PING_TIMEOUT',
        'The ping probe timed out.'
      );
      const parsed = parsePing(result?.stdout || '');
      return {
        stage: 'ping',
        label: 'ICMP echo probe',
        status: parsed.reply ? (parsed.lossPercent === 100 ? 'timeout' : 'passed') : 'failed',
        latencyMs: Date.now() - started,
        detail: parsed.reply
          ? `Four bounded ICMP echoes returned ${parsed.latencies.length} replies${parsed.lossPercent != null ? ` with ${parsed.lossPercent}% loss` : ''}.`
          : 'No ICMP echo reply was measured within the bounded window.',
        evidence: parsed.latencies.map((latency) => `${latency} ms`)
      };
    } catch (error) {
      return {
        stage: 'ping',
        label: 'ICMP echo probe',
        status: error.code === 'SYSTEM_PING_TIMEOUT' ? 'timeout' : 'failed',
        latencyMs: Date.now() - started,
        detail: 'The Windows ping executable did not return a measurable result.',
        evidence: []
      };
    }
  }

  async traceroute(request = {}) {
    const target = assertTarget(request.target);
    const maxHops = Math.max(1, Math.min(MAX_TRACE_HOPS, numberOrNull(request.maxHops) || MAX_TRACE_HOPS));
    const started = Date.now();
    const startedAt = this.now().toISOString();
    let stdout = '';
    try {
      const result = await withTimeout(
        this.runFile('tracert.exe', ['-d', '-h', String(maxHops), '-w', '750', target], { windowsHide: true, timeout: this.limits.traceTimeoutMs, maxBuffer: 2 * 1024 * 1024 }),
        this.limits.traceTimeoutMs + 5000,
        'SYSTEM_TRACE_TIMEOUT',
        'The hop trace timed out.'
      );
      stdout = String(result?.stdout || '');
    } catch (error) {
      if (error.code === 'SYSTEM_TRACE_TIMEOUT') throw error;
      throw systemError('SYSTEM_TRACE_FAILED', 'The Windows tracert executable did not return a hop trace.', { retryable: true });
    }
    const hops = parseTracert(stdout, target);
    return {
      contract: CONTRACT,
      target,
      maxHops,
      hops,
      reached: hops.some((hop) => hop.address === target),
      startedAt,
      durationMs: Date.now() - started,
      receipt: `trace:${sha256(`${target}:${maxHops}:${startedAt}:${hops.length}`).slice(0, 24)}`,
      readOnly: true
    };
  }

  hosts() {
    return this.readHosts();
  }

  async hostsPlan(draft = {}) {
    const mode = String(draft.mode || '');
    if (!['comment', 'uncomment', 'replace', 'add'].includes(mode)) {
      throw systemError('SYSTEM_HOSTS_DRAFT_INVALID', 'The hosts draft mode is not supported.');
    }
    const hosts = await this.readHosts();
    if (!hosts.readable) throw systemError('SYSTEM_HOSTS_UNREADABLE', hosts.reason || 'The hosts file is not readable.');
    const before = hosts.entries.map((entry) => entry.raw);
    const after = [...before];
    const warnings = [];
    let allowed = true;
    const lineNumber = numberOrNull(draft.lineNumber);
    const validateHostnames = (values) => {
      const list = asArray(values).map((value) => String(value).trim()).filter(Boolean);
      if (!list.length) throw systemError('SYSTEM_HOSTS_DRAFT_INVALID', 'At least one hostname is required.');
      if (list.length > 12) throw systemError('SYSTEM_HOSTS_DRAFT_INVALID', 'A draft may add at most twelve hostnames to one line.');
      for (const hostname of list) {
        if (!HOSTNAME_PATTERN.test(hostname) || hostname.length > 253) {
          throw systemError('SYSTEM_HOSTS_DRAFT_INVALID', `The hostname ${clip(hostname, 80)} is not valid.`);
        }
      }
      return list;
    };
    if (mode === 'add') {
      const ip = String(draft.ip || '').trim();
      if (!net.isIP(ip)) throw systemError('SYSTEM_HOSTS_DRAFT_INVALID', 'The draft IP address is not valid.');
      const hostnames = validateHostnames(draft.hostnames);
      after.push(`${ip}\t${hostnames.join(' ')}`);
    } else {
      if (lineNumber == null || lineNumber < 1 || lineNumber > before.length) {
        throw systemError('SYSTEM_HOSTS_DRAFT_INVALID', 'The selected hosts line does not exist.');
      }
      const current = before[lineNumber - 1];
      if (mode === 'comment') {
        if (!hosts.entries[lineNumber - 1].active) throw systemError('SYSTEM_HOSTS_DRAFT_INVALID', 'Only an active mapping can be commented out.');
        after[lineNumber - 1] = `# ${current}`;
      } else if (mode === 'uncomment') {
        if (!/^\s*#\s*[0-9a-f:.]+/i.test(current)) throw systemError('SYSTEM_HOSTS_DRAFT_INVALID', 'The selected line is not a commented mapping.');
        after[lineNumber - 1] = current.replace(/^(\s*)#\s?/, '$1');
      } else {
        const ip = String(draft.ip || '').trim();
        if (!net.isIP(ip)) throw systemError('SYSTEM_HOSTS_DRAFT_INVALID', 'The replacement IP address is not valid.');
        const hostnames = validateHostnames(draft.hostnames);
        after[lineNumber - 1] = `${ip}\t${hostnames.join(' ')}`;
      }
    }
    const added = after.filter((line) => !before.includes(line)).length;
    const removed = before.filter((line) => !after.includes(line)).length;
    const newlineDetected = after.some((line) => /[\r\n]/.test(line));
    if (newlineDetected) warnings.push('A draft line contained a newline and was rejected.');
    allowed = allowed && !newlineDetected;
    return {
      contract: CONTRACT,
      immutable: true,
      readOnly: true,
      mutation: 'none',
      targetPath: this.hostsPath,
      draft,
      allowed,
      before,
      after,
      addedLines: added,
      removedLines: removed,
      warnings,
      execution: { available: false, reason: 'Hosts writes require an approved immutable plan, ACL/encoding preservation, a verified backup and postcondition proof. Mission 10 ships the read-only diff only.' },
      stagedAt: this.now().toISOString(),
      receipt: `hosts:${sha256(`${mode}:${JSON.stringify(draft)}:${hosts.sha256}`).slice(0, 24)}`
    };
  }

  async report(options = {}) {
    if (!this.snapshotCache) throw systemError('SYSTEM_NOT_MEASURED', 'No measured snapshot is available yet.');
    const snapshot = this.snapshotCache;
    const redact = options.redact !== false;
    const section = (id, titleEn, titleAr, rows, status = 'validated') => {
      const normalized = rows.map((row) => ({
        label: row.label,
        value: redact && row.sensitive ? '[redacted]' : row.value,
        status: row.status || 'measured'
      }));
      return {
        id,
        titleEn,
        titleAr,
        status,
        measured: normalized.filter((item) => item.status === 'measured').length,
        unknown: normalized.filter((item) => item.status === 'unknown').length,
        items: normalized
      };
    };
    const hardware = snapshot.hardware;
    const sections = [
      section('system', 'System identity', 'هوية النظام', [
        { label: 'OS', value: snapshot.identity.osName || 'unknown', status: snapshot.identity.osName ? 'measured' : 'unknown' },
        { label: 'Build', value: snapshot.identity.osBuild || 'unknown', status: snapshot.identity.osBuild ? 'measured' : 'unknown' },
        { label: 'System model', value: `${snapshot.identity.manufacturer || 'unknown'} ${snapshot.identity.model || ''}`.trim(), status: snapshot.identity.model ? 'measured' : 'unknown' },
        { label: 'Uptime', value: snapshot.identity.uptimeSeconds != null ? `${Math.floor(snapshot.identity.uptimeSeconds / 3600)} h ${Math.floor((snapshot.identity.uptimeSeconds % 3600) / 60)} m` : 'unknown', status: snapshot.identity.uptimeSeconds != null ? 'measured' : 'unknown' }
      ]),
      section('performance', 'Performance sample', 'عينة الأداء', [
        { label: 'CPU', value: snapshot.metrics.cpuPercent != null ? `${snapshot.metrics.cpuPercent}%` : 'unknown', status: snapshot.metrics.cpuPercent != null ? 'measured' : 'unknown' },
        { label: 'Memory', value: snapshot.metrics.memoryPercent != null ? `${snapshot.metrics.memoryPercent}%` : 'unknown', status: snapshot.metrics.memoryPercent != null ? 'measured' : 'unknown' },
        { label: 'Disk read', value: snapshot.metrics.diskReadBytesPerSec != null ? `${snapshot.metrics.diskReadBytesPerSec} B/s` : 'unknown', status: snapshot.metrics.diskReadBytesPerSec != null ? 'measured' : 'unknown' },
        { label: 'Network in', value: snapshot.metrics.networkInBytesPerSec != null ? `${snapshot.metrics.networkInBytesPerSec} B/s` : 'unknown', status: snapshot.metrics.networkInBytesPerSec != null ? 'measured' : 'unknown' }
      ]),
      section('processes', 'Process register', 'سجل العمليات', [
        { label: 'Processes measured', value: String(snapshot.processCount), status: snapshot.processCount ? 'measured' : 'unknown' },
        { label: 'Rows in snapshot', value: String(snapshot.processes.length), status: 'measured' },
        { label: 'Protected processes', value: String(snapshot.processes.filter((entry) => entry.protected).length), status: 'measured' }
      ]),
      section('services', 'Services', 'الخدمات', [
        { label: 'Services measured', value: String(snapshot.services.length), status: snapshot.services.length ? 'measured' : 'unknown' },
        { label: 'Dependency edges', value: String(snapshot.serviceEdges.length), status: 'measured' },
        { label: 'Autorun links', value: String(snapshot.startupLinks.length), status: snapshot.startupLinks.length ? 'measured' : 'unknown' }
      ]),
      section('drivers', 'Drivers', 'برامج التشغيل', [
        { label: 'Drivers measured', value: String(snapshot.drivers.length), status: snapshot.drivers.length ? 'measured' : 'unknown' },
        { label: 'Unsigned reports', value: String(snapshot.drivers.filter((entry) => entry.signed === false).length), status: 'measured' }
      ]),
      section('events', 'Event ledger', 'سجل الأحداث', [
        { label: 'Events retained', value: String(snapshot.events.length), status: snapshot.events.length ? 'measured' : 'unknown' },
        { label: 'Channels enumerated', value: String(snapshot.eventChannels.length), status: 'measured' },
        { label: 'Boot diagnostics events', value: String(snapshot.boot.events.length), status: 'measured' }
      ]),
      section('network', 'Network', 'الشبكة', [
        { label: 'Interfaces', value: String(snapshot.interfaces.length), status: snapshot.interfaces.length ? 'measured' : 'unknown' },
        { label: 'Routes', value: String(snapshot.routes.length), status: 'measured' },
        { label: 'Sockets', value: String(snapshot.sockets.length), status: 'measured' },
        { label: 'Wi-Fi', value: snapshot.wifi.state, status: snapshot.wifi.available ? 'measured' : 'unknown' }
      ]),
      section('hardware', 'Hardware atlas', 'أطلس العتاد', [
        { label: 'CPU', value: hardware.cpu[0]?.name || 'unknown', status: hardware.availability.cpu ? 'measured' : 'unknown' },
        { label: 'GPU', value: hardware.gpu[0]?.name || 'unknown', status: hardware.availability.gpu ? 'measured' : 'unknown' },
        { label: 'Memory modules', value: String(hardware.memory.length), status: hardware.availability.memory ? 'measured' : 'unknown' },
        { label: 'Physical disks', value: String(hardware.disks.length), status: hardware.availability.disks ? 'measured' : 'unknown' },
        { label: 'Batteries', value: String(hardware.batteries.length), status: hardware.availability.batteries ? 'measured' : 'unknown' },
        { label: 'Thermal', value: hardware.thermal.available ? `${hardware.thermal.celsius} °C` : 'unsupported', status: hardware.thermal.available ? 'measured' : 'unknown' }
      ]),
      section('storage', 'Storage health', 'صحة التخزين', hardware.disks.map((disk) => ({
        label: disk.model,
        value: disk.smartStatus || 'unknown',
        status: disk.smartStatus ? 'measured' : 'unknown'
      })), hardware.disks.length ? 'validated' : 'unavailable')
    ];
    const measured = sections.reduce((sum, entry) => sum + entry.measured, 0);
    const unknown = sections.reduce((sum, entry) => sum + entry.unknown, 0);
    return {
      contract: CONTRACT,
      generatedAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      redacted: redact,
      summary: `${measured} measured fields and ${unknown} unknown fields across 36 read-only observatory services. No machine-changing action was executed.`,
      sections,
      warnings: [...snapshot.warnings, ...(hardware.thermal.available ? [] : [hardware.thermal.reason])],
      receipt: `report:${sha256(`${snapshot.receipt}:${redact}:${measured}:${unknown}`).slice(0, 24)}`
    };
  }

  settingsTarget(target) {
    const uri = SETTINGS_TARGETS[target];
    if (!uri) throw systemError('SYSTEM_SETTINGS_TARGET_INVALID', 'The requested Windows Settings page is not allowlisted.');
    return { opened: true, target, uri };
  }

  async close() {
    this.snapshotCache = null;
    this.series = [];
  }
}

module.exports = { SystemBridge, STAGE_DEFINITIONS, SERVICE_DEFINITIONS, GATED_OPERATIONS, SETTINGS_TARGETS };
