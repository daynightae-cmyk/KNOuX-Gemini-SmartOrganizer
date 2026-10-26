'use strict';

/**
 * KNOuX Gemini - Service Commander read-only coordinator (Mission 12).
 *
 * Six bounded stages measure the SCM register, dependency graph, protected
 * policy, Service Control Manager events, svchost hosts and the local preview
 * journal. Start/stop/restart/startup-type plans are immutable previews with
 * execution.available:false. No service mutation channel exists.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const {
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
  startupType,
  normalizeService,
  attachDependents,
  summarize,
  edges,
  normalizeEvents,
  normalizeSvchost
} = require('./services-providers.cjs');

const execFileAsync = promisify(execFile);
const CONTRACT = 'services.v1';
const MAX_SERVICES = 1000;
const MAX_EVENTS = 200;
const MAX_JOURNAL_ENTRIES = 50;
const DISCOVERY_TIMEOUT_MS = 180000;
const ACTIONS = new Set(['start', 'stop', 'restart', 'startup-type']);
const STARTUP_TYPES = new Set(['automatic', 'manual', 'disabled', 'delayed']);

const ACTION_META = Object.freeze({
  start: { en: 'Start service', ar: 'بدء الخدمة', proposedState: 'Running' },
  stop: { en: 'Stop service', ar: 'إيقاف الخدمة', proposedState: 'Stopped' },
  restart: { en: 'Restart service', ar: 'إعادة تشغيل الخدمة', proposedState: 'Running' },
  'startup-type': { en: 'Change startup type', ar: 'تغيير نوع البدء', proposedState: null }
});

function servicesError(code, message, { retryable = false } = {}) {
  const error = new Error(message);
  error.code = code;
  error.retryable = retryable;
  return error;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function withTimeout(promise, ms, code, message) {
  let timer = null;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(servicesError(code, message, { retryable: true })), ms);
    })
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function assertServiceName(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_.-]{1,256}$/.test(value)) {
    throw servicesError('SERVICES_NAME_INVALID', 'A valid Windows service name is required.');
  }
  return value;
}

function mapCimService(raw) {
  return {
    name: raw?.Name,
    displayName: raw?.DisplayName,
    description: raw?.Description,
    state: raw?.State,
    startupType: raw?.StartMode,
    delayedAuto: raw?.DelayedAutoStart,
    processId: raw?.ProcessId,
    serviceType: raw?.ServiceType,
    account: raw?.StartName,
    binaryPath: raw?.PathName,
    dependencies: raw?.Dependencies,
    acceptsStop: raw?.AcceptStop
  };
}

class ServicesBridge {
  constructor(options = {}) {
    this.userDataPath = options.userDataPath || path.join(os.tmpdir(), 'knoux-services');
    this.journalPath = path.join(this.userDataPath, 'knoux-services', 'journal.json');
    this.runFile = options.runFile || execFileAsync;
    this.getProvider = options.loadProvider || (() => null);
    this.now = options.now || (() => new Date());
    this.limits = { services: MAX_SERVICES, events: MAX_EVENTS, journalEntries: MAX_JOURNAL_ENTRIES, discoveryTimeoutMs: DISCOVERY_TIMEOUT_MS };
    this.session = null;
    this.snapshotCache = null;
    this.scanPromise = null;
    this.cancelled = false;
    this.isAdmin = null;
  }

  capabilities() {
    return {
      engine: 'KNOuX Service Commander read-only SCM evidence',
      contract: CONTRACT,
      readOnly: true,
      mutation: 'none',
      fixtureFallback: false,
      serviceCount: SERVICE_TOOLS.length,
      worldCount: 1,
      services: SERVICE_TOOLS.map((entry) => ({ ...entry })),
      gatedOperations: GATED_OPERATIONS.map((entry) => ({ ...entry })),
      elevation: { isAdmin: this.isAdmin, method: 'user-initiated UAC only', automaticElevation: false },
      limits: { ...this.limits },
      nativeOnly: [
        'Measured Win32_Service inventory and configuration',
        'Computed dependency graph and cascade impact',
        'Capability-based protected-service policy',
        'Bounded Service Control Manager events',
        'svchost service-to-PID crosslinks',
        'Immutable operation previews and a local journal'
      ]
    };
  }

  stageTemplate() {
    return STAGE_DEFINITIONS.map((entry) => ({
      ...entry,
      status: 'pending',
      provider: 'Not started',
      startedAt: null,
      completedAt: null,
      durationMs: null,
      items: null,
      warning: null
    }));
  }

  publicSession() {
    if (!this.session) return null;
    return { ...this.session, stages: this.session.stages.map((stage) => ({ ...stage })), warnings: [...this.session.warnings] };
  }

  start() {
    if (this.session && this.session.status === 'running') return this.publicSession();
    this.cancelled = false;
    this.snapshotCache = null;
    const session = {
      contract: CONTRACT,
      id: crypto.randomUUID(),
      status: 'running',
      startedAt: this.now().toISOString(),
      completedAt: null,
      progress: 0,
      stages: this.stageTemplate(),
      warnings: [],
      readOnly: true,
      mutation: 'none'
    };
    this.session = session;
    this.scanPromise = this.runScan(session).catch((error) => {
      session.status = 'failed';
      session.completedAt = this.now().toISOString();
      session.warnings.push(error?.message || 'Service discovery failed.');
      return null;
    });
    return this.publicSession();
  }

  status(sessionId) {
    if (!this.session || this.session.id !== sessionId) {
      throw servicesError('SERVICES_SESSION_NOT_FOUND', 'The requested service discovery session does not exist.');
    }
    return this.publicSession();
  }

  cancel(sessionId) {
    if (!this.session || this.session.id !== sessionId) {
      throw servicesError('SERVICES_SESSION_NOT_FOUND', 'The requested service discovery session does not exist.');
    }
    if (this.session.status !== 'running') return { cancelled: false, status: this.session.status, sessionId };
    this.cancelled = true;
    return { cancelled: true, status: this.session.status, sessionId };
  }

  async powershell(script, label, timeout = 60000) {
    const provider = this.getProvider();
    if (provider && typeof provider.powershellJson === 'function') {
      return provider.powershellJson(script, { provider: label, timeout });
    }
    const result = await this.runFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true, timeout, maxBuffer: 16 * 1024 * 1024 });
    const stdout = String(result?.stdout || '').trim();
    return stdout ? JSON.parse(stdout) : {};
  }

  async collectServices() {
    const provider = this.getProvider();
    if (provider && typeof provider.collectServices === 'function') {
      return await provider.collectServices({ timeout: 90000 });
    }
    const raw = await this.powershell(SERVICE_SCRIPT, 'Win32_Service', 90000);
    return asArray(raw).map(mapCimService);
  }

  updateProgress(session) {
    const completed = session.stages.filter((stage) => ['complete', 'partial', 'unavailable', 'cancelled'].includes(stage.status)).length;
    session.progress = Math.round((completed / session.stages.length) * 100);
  }

  async runScan(session) {
    const started = Date.now();
    let records = [];
    let serviceEvents = { coverage: { status: 'unavailable', count: 0, days: 7, reason: 'Not measured.' }, events: [] };
    let svchost = [];
    let journal = [];
    const warnings = session.warnings;
    const sources = [];

    const runStage = async (key, providerLabel, work) => {
      if (this.cancelled) return { cancelled: true };
      const stage = session.stages.find((entry) => entry.key === key);
      stage.status = 'running';
      stage.provider = providerLabel;
      stage.startedAt = this.now().toISOString();
      const stageStarted = Date.now();
      try {
        const result = await work();
        stage.status = result?.partial ? 'partial' : 'complete';
        stage.items = numberOrNull(result?.items);
        if (result?.warning) stage.warning = result.warning;
        return result;
      } catch (error) {
        stage.status = 'unavailable';
        stage.warning = String(error?.message || 'The measured source did not answer.').slice(0, 300);
        warnings.push(`${stage.labelEn}: ${stage.warning}`);
        return null;
      } finally {
        stage.completedAt = this.now().toISOString();
        stage.durationMs = Date.now() - stageStarted;
        this.updateProgress(session);
      }
    };

    await runStage('inventory', 'Win32_Service + WindowsPrincipal', async () => {
      const [serviceResult, elevationResult] = await Promise.allSettled([
        withTimeout(this.collectServices(), 100000, 'SERVICES_INVENTORY_TIMEOUT', 'The SCM inventory timed out.'),
        withTimeout(this.powershell(ELEVATION_SCRIPT, 'WindowsPrincipal', 20000), 25000, 'SERVICES_ELEVATION_TIMEOUT', 'The elevation check timed out.')
      ]);
      if (serviceResult.status === 'rejected') throw serviceResult.reason;
      this.isAdmin = elevationResult.status === 'fulfilled' ? boolOrNull(elevationResult.value?.isAdmin) : null;
      const raw = asArray(serviceResult.value).slice(0, MAX_SERVICES);
      records = attachDependents(raw.map((entry) => normalizeService(entry)));
      sources.push('Win32_Service', 'WindowsPrincipal');
      if (this.isAdmin === false) warnings.push('The application is not elevated. Service operations are immutable previews only.');
      return { items: records.length };
    });

    if (this.cancelled) return this.finishCancelled(session);

    await runStage('graph', 'Computed from Win32_Service.Dependencies + Get-Service', async () => {
      let enriched = false;
      try {
        const raw = await withTimeout(this.powershell(DEPENDENCY_SCRIPT, 'ServiceDependencies', 60000), 65000, 'SERVICES_DEPENDENCY_TIMEOUT', 'Service dependency enumeration timed out.');
        const rows = asArray(raw);
        const byName = new Map(records.map((record) => [record.name.toLowerCase(), record]));
        for (const row of rows) {
          const record = byName.get(String(row.name || '').toLowerCase());
          if (!record) continue;
          record.dependencies = [...new Set([...record.dependencies, ...asArray(row.dependencies).map((entry) => text(entry)).filter(Boolean)])];
          enriched = true;
        }
        if (enriched) {
          for (const record of records) record.dependents = [];
          attachDependents(records);
          sources.push('Get-Service ServicesDependedOn');
        }
      } catch {
        // Win32_Service dependencies remain the measured fallback.
      }
      const graphEdges = edges(records);
      sources.push('Computed reverse dependency edges');
      return { items: graphEdges.length, partial: !enriched && graphEdges.length === 0, warning: !enriched && graphEdges.length === 0 ? 'No dependency edge was measured; the graph is empty rather than inferred.' : null };
    });

    if (this.cancelled) return this.finishCancelled(session);

    await runStage('protected', 'Capability protection policy', async () => {
      const protectedCount = records.filter((record) => record.protected).length;
      sources.push('Role map + driver + non-stoppable capability policy');
      return { items: protectedCount };
    });

    if (this.cancelled) return this.finishCancelled(session);

    await runStage('events', 'Get-WinEvent Service Control Manager', async () => {
      try {
        const raw = await withTimeout(this.powershell(EVENTS_SCRIPT, 'ServiceControlManagerEvents', 60000), 65000, 'SERVICES_EVENTS_TIMEOUT', 'SCM event collection timed out.');
        serviceEvents = normalizeEvents(raw || {});
      } catch (error) {
        serviceEvents = normalizeEvents({}, error);
      }
      sources.push('System event log · Service Control Manager · 7 days');
      if (serviceEvents.coverage.status !== 'available') warnings.push(`SCM events: ${serviceEvents.coverage.reason || serviceEvents.coverage.status}`);
      const byName = new Map(records.map((record) => [record.name.toLowerCase(), record.name]));
      for (const event of serviceEvents.events) {
        const message = event.message.toLowerCase();
        let matched = null;
        for (const [name, canonical] of byName) {
          if (name.length >= 4 && message.includes(name)) { matched = canonical; break; }
        }
        event.serviceName = matched;
      }
      return { items: serviceEvents.events.length, partial: serviceEvents.coverage.status !== 'available' };
    });

    if (this.cancelled) return this.finishCancelled(session);

    await runStage('processes', 'Win32_Process svchost.exe', async () => {
      try {
        const raw = await withTimeout(this.powershell(SVCHOST_SCRIPT, 'svchostProcesses', 30000), 35000, 'SERVICES_PROCESS_TIMEOUT', 'svchost evidence timed out.');
        svchost = normalizeSvchost(raw || {});
      } catch (error) {
        svchost = [];
      }
      const byPid = new Map(svchost.map((entry) => [entry.pid, entry]));
      for (const record of records) {
        if (record.pid == null) continue;
        let group = byPid.get(record.pid);
        if (!group) {
          group = { pid: record.pid, group: null, workingSetBytes: null, serviceCount: 0, services: [], source: 'Win32_Service.ProcessId' };
          svchost.push(group);
          byPid.set(record.pid, group);
        }
        group.services.push(record.name);
        group.serviceCount = group.services.length;
      }
      svchost.sort((left, right) => right.serviceCount - left.serviceCount || left.pid - right.pid);
      sources.push('Win32_Process', 'Win32_Service.ProcessId');
      return { items: svchost.length, partial: svchost.length === 0 };
    });

    if (this.cancelled) return this.finishCancelled(session);

    await runStage('journal', 'Local append-only service preview journal', async () => {
      journal = await this.readJournal();
      sources.push('Local service preview journal');
      return { items: journal.length };
    });

    if (this.cancelled) return this.finishCancelled(session);

    const coverage = session.stages.map((stage) => ({
      key: stage.key,
      status: stage.status === 'complete' ? 'complete' : stage.status === 'partial' ? 'partial' : stage.status === 'cancelled' ? 'cancelled' : 'unavailable',
      items: stage.items,
      note: stage.warning
    }));
    const summary = summarize(records);
    const snapshot = {
      contract: CONTRACT,
      generatedAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      fixtureFallback: false,
      services: records,
      total: records.length,
      truncated: records.length >= MAX_SERVICES,
      elevation: { isAdmin: this.isAdmin },
      summary,
      edges: edges(records),
      events: serviceEvents.events,
      eventCoverage: serviceEvents.coverage,
      svchost,
      journal,
      gates: GATED_OPERATIONS.map((entry) => ({ ...entry })),
      coverage,
      warnings: [...new Set(warnings)],
      sources: [...new Set(sources)],
      receipt: `services:${sha256(`${records.length}:${summary.protected}:${serviceEvents.events.length}:${svchost.length}:${journal.length}`).slice(0, 24)}`
    };
    this.snapshotCache = snapshot;
    session.status = session.stages.some((stage) => stage.status === 'unavailable') ? 'partial' : 'complete';
    session.completedAt = this.now().toISOString();
    session.progress = 100;
    return this.publicSession();
  }

  finishCancelled(session) {
    session.status = 'cancelled';
    session.completedAt = this.now().toISOString();
    for (const stage of session.stages) {
      if (stage.status === 'pending' || stage.status === 'running') stage.status = 'cancelled';
    }
    session.progress = 100;
    return this.publicSession();
  }

  async snapshot() {
    if (!this.snapshotCache) throw servicesError('SERVICES_NOT_MEASURED', 'No measured service register is available. Start Service Commander discovery first.');
    return this.snapshotCache;
  }

  async readJournal() {
    try {
      const raw = await fs.promises.readFile(this.journalPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((entry) => entry && typeof entry.id === 'string').slice(0, MAX_JOURNAL_ENTRIES);
    } catch {
      return [];
    }
  }

  async writeJournal(entries) {
    const directory = path.dirname(this.journalPath);
    await fs.promises.mkdir(directory, { recursive: true });
    const temporary = `${this.journalPath}.${process.pid}.tmp`;
    await fs.promises.writeFile(temporary, JSON.stringify(entries.slice(0, MAX_JOURNAL_ENTRIES), null, 2), 'utf8');
    await fs.promises.rename(temporary, this.journalPath);
  }

  async recordJournal(plan) {
    const entry = {
      id: `svc-journal-${crypto.randomUUID()}`,
      at: this.now().toISOString(),
      kind: plan.item.protected ? 'blocked-preview' : 'preview',
      serviceName: plan.item.serviceName,
      displayName: plan.item.displayName,
      action: plan.item.action,
      title: `${plan.item.actionLabelEn}: ${plan.item.displayName || plan.item.serviceName}`,
      summary: `${plan.item.current.state || 'unknown'} → ${plan.item.proposed.state || plan.item.proposed.startupType || 'unknown'}; ${plan.item.conflicts.length} conflict(s); nothing executed.`,
      currentState: plan.item.current.state,
      proposedState: plan.item.proposed.state,
      currentStartupType: plan.item.current.startupType,
      proposedStartupType: plan.item.proposed.startupType,
      protected: plan.item.protected,
      elevationRequired: true,
      receipt: plan.receipt,
      readOnly: true,
      mutation: 'none'
    };
    try {
      const existing = await this.readJournal();
      await this.writeJournal([entry, ...existing.filter((candidate) => candidate.id !== entry.id)]);
      return true;
    } catch {
      return false;
    }
  }

  dependencyImpact(record) {
    const byName = new Map(this.snapshotCache.services.map((entry) => [entry.name.toLowerCase(), entry]));
    const cascade = [];
    const queue = [...record.dependents];
    const seen = new Set();
    while (queue.length) {
      const next = queue.shift();
      if (!next || seen.has(next)) continue;
      seen.add(next);
      cascade.push(next);
      const node = byName.get(next.toLowerCase());
      if (node) queue.push(...node.dependents);
    }
    return {
      directDependents: [...record.dependents],
      cascadeDependents: cascade,
      runningDependents: cascade.filter((name) => {
        const node = byName.get(name.toLowerCase());
        return node && String(node.state).toLowerCase() === 'running';
      }),
      protectedDependents: cascade.filter((name) => {
        const node = byName.get(name.toLowerCase());
        return node?.protected === true;
      }),
      upstream: [...record.dependencies]
    };
  }

  async plan(request = {}) {
    const snapshot = await this.snapshot();
    const serviceName = assertServiceName(request.serviceName);
    const action = String(request.action || '');
    if (!ACTIONS.has(action)) throw servicesError('SERVICES_ACTION_INVALID', 'The requested service action is not supported.');
    const record = snapshot.services.find((entry) => entry.name.toLowerCase() === serviceName.toLowerCase());
    if (!record) throw servicesError('SERVICES_NOT_FOUND', 'The requested service is not present in the measured register.');
    let proposedStartup = null;
    if (action === 'startup-type') {
      proposedStartup = String(request.startupType || '');
      if (!STARTUP_TYPES.has(proposedStartup)) throw servicesError('SERVICES_STARTUP_INVALID', 'The startup type must be automatic, manual, disabled or delayed.');
      if (proposedStartup === 'delayed' && record.startupType === 'disabled') {
        throw servicesError('SERVICES_STARTUP_CONFLICT', 'A delayed automatic start cannot be applied to a disabled service.');
      }
    }
    const meta = ACTION_META[action];
    const impact = this.dependencyImpact(record);
    const currentState = record.state;
    const running = String(currentState).toLowerCase() === 'running';
    const stopped = String(currentState).toLowerCase() === 'stopped';
    const conflicts = [];
    if (record.protected) conflicts.push(`Protected core service: ${record.protectionReason || record.protectionRole || 'policy deny'}`);
    if (action === 'start' && running) conflicts.push('The service is already running.');
    if (action === 'stop' && stopped) conflicts.push('The service is already stopped.');
    if (action === 'restart' && stopped) conflicts.push('The service is stopped; a restart would require a start.');
    if (action === 'stop' && impact.runningDependents.length) conflicts.push(`${impact.runningDependents.length} running dependent service(s) would be affected.`);
    if (action === 'restart' && impact.runningDependents.length) conflicts.push(`${impact.runningDependents.length} running dependent service(s) would be affected during restart.`);
    if (action === 'startup-type') {
      const currentPolicy = record.delayedAuto ? 'delayed' : record.startupType;
      if (proposedStartup === currentPolicy) conflicts.push('The proposed startup type already matches the measured policy.');
    }
    const proposed = {
      state: action === 'startup-type' ? currentState : meta.proposedState,
      startupType: action === 'startup-type' ? (proposedStartup === 'delayed' ? 'automatic' : proposedStartup) : record.startupType,
      delayedAuto: action === 'startup-type' ? proposedStartup === 'delayed' : record.delayedAuto
    };
    const prerequisites = [
      { id: 'service', labelEn: 'Service measured', labelAr: 'الخدمة مقيسة', status: 'passed', detail: `${record.name} · ${record.displayName || 'no display name'}` },
      { id: 'elevation', labelEn: 'Administrator privilege', labelAr: 'صلاحية المسؤول', status: snapshot.elevation.isAdmin === true ? 'passed' : snapshot.elevation.isAdmin === false ? 'failed' : 'unknown', detail: snapshot.elevation.isAdmin === true ? 'The session reports elevation. No SCM operation is executed by Mission 12.' : 'The session is not elevated; execution is gated.' },
      { id: 'protected', labelEn: 'Protected-service policy', labelAr: 'سياسة الخدمات المحمية', status: record.protected ? 'failed' : 'passed', detail: record.protected ? record.protectionReason || 'Denied by capability policy.' : 'No protection rule matched.' },
      { id: 'dependencies', labelEn: 'Dependency impact', labelAr: 'أثر الاعتماديات', status: impact.runningDependents.length ? 'failed' : 'passed', detail: impact.runningDependents.length ? `${impact.runningDependents.length} running dependent(s).` : `${impact.directDependents.length} direct dependent(s); none measured running.` }
    ];
    const item = {
      id: `svc-plan-${record.name}-${action}`,
      serviceName: record.name,
      displayName: record.displayName,
      action,
      actionLabelEn: meta.en,
      actionLabelAr: meta.ar,
      current: { state: currentState, startupType: record.delayedAuto ? 'delayed' : record.startupType, delayedAuto: record.delayedAuto },
      proposed,
      protected: record.protected,
      protectionRole: record.protectionRole,
      protectionReason: record.protectionReason,
      elevationRequired: true,
      rebootRequired: false,
      dependencyImpact: impact,
      conflicts,
      prerequisites,
      execution: { available: false, reason: 'Mission 12 publishes an immutable SCM preview only. No service-control executor is shipped.' },
      receipt: `svcitem:${sha256(`${record.name}:${action}:${proposedStartup || proposed.state}:${snapshot.receipt}`).slice(0, 24)}`
    };
    const plan = {
      contract: CONTRACT,
      id: crypto.randomUUID(),
      createdAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      immutable: true,
      mode: 'preview',
      itemCount: 1,
      item,
      execution: { available: false, reason: 'Service control is intentionally absent. A future elevated executor must be separately approved and must verify effective SCM state.' },
      journalRecorded: false,
      warnings: record.protected ? ['The service is protected; this preview is blocked from execution.'] : [],
      receipt: `svcplan:${sha256(`${item.receipt}:${conflicts.join('|')}:${this.now().toISOString()}`).slice(0, 24)}`
    };
    plan.journalRecorded = await this.recordJournal(plan);
    return plan;
  }

  async journal() {
    return this.readJournal();
  }

  async report(options = {}) {
    const snapshot = await this.snapshot();
    const redact = options.redact !== false;
    const redactText = (value) => {
      let result = String(value);
      if (!redact) return result;
      const home = os.homedir();
      const temp = os.tmpdir();
      result = result.split(home).join('<home>').split(temp).join('<temp>');
      return result.replace(/([A-Za-z]:[\\/]Users[\\/])[^\\/"']+/g, '$1<user>');
    };
    const section = (id, titleEn, titleAr, items) => {
      const measured = items.filter((item) => item.status === 'measured').length;
      const unknown = items.length - measured;
      return { id, titleEn, titleAr, status: unknown === 0 ? 'validated' : measured ? 'partial' : 'unavailable', measured, unknown, items: items.map((item) => ({ label: redactText(item.label), value: redactText(item.value), status: item.status === 'warning' ? 'warning' : item.status })) };
    };
    const sections = [
      section('register', 'Measured SCM register', 'سجل SCM المقيس', [
        { label: 'Services', value: String(snapshot.summary.total), status: 'measured' },
        { label: 'Running', value: String(snapshot.summary.running), status: 'measured' },
        { label: 'Protected', value: String(snapshot.summary.protected), status: 'measured' }
      ]),
      section('policy', 'Startup policy distribution', 'توزيع سياسة البدء', [
        { label: 'Automatic', value: String(snapshot.summary.automatic), status: 'measured' },
        { label: 'Manual', value: String(snapshot.summary.manual), status: 'measured' },
        { label: 'Disabled', value: String(snapshot.summary.disabled), status: 'measured' },
        { label: 'Delayed', value: String(snapshot.summary.delayed), status: 'measured' }
      ]),
      section('graph', 'Dependency graph', 'رسم الاعتماديات', [
        { label: 'Edges', value: String(snapshot.edges.length), status: 'measured' },
        { label: 'Protected services', value: String(snapshot.summary.protected), status: 'measured' }
      ]),
      section('events', 'SCM events', 'أحداث SCM', [
        { label: 'Status', value: snapshot.eventCoverage.status, status: snapshot.eventCoverage.status === 'available' ? 'measured' : 'warning' },
        { label: 'Events', value: String(snapshot.events.length), status: snapshot.eventCoverage.status === 'available' ? 'measured' : 'warning' }
      ]),
      section('hosts', 'svchost hosts', 'مضيفات svchost', [
        { label: 'Hosts', value: String(snapshot.svchost.length), status: 'measured' },
        { label: 'Shared services', value: String(snapshot.svchost.reduce((sum, entry) => sum + entry.serviceCount, 0)), status: 'measured' }
      ]),
      section('journal', 'Preview journal', 'سجل المعاينات', [
        { label: 'Entries', value: String(snapshot.journal.length), status: 'measured' },
        { label: 'Executed operations', value: '0', status: 'measured' }
      ]),
      section('gates', 'Mutation gates', 'بوابات التغيير', snapshot.gates.map((gate) => ({ label: gate.id, value: `${gate.title} (Mission ${gate.mission})`, status: 'measured' })))
    ];
    return {
      contract: CONTRACT,
      generatedAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      redacted: redact,
      summary: `Read-only Service Commander report: ${snapshot.summary.total} services, ${snapshot.summary.running} running, ${snapshot.summary.protected} protected, ${snapshot.events.length} SCM events. No service operation was executed.`,
      sections,
      warnings: [...snapshot.warnings],
      receipt: `services-report:${sha256(JSON.stringify(sections)).slice(0, 24)}`
    };
  }

  async close() {
    this.cancelled = true;
    this.snapshotCache = null;
  }
}

module.exports = {
  ServicesBridge,
  SERVICE_TOOLS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS
};
