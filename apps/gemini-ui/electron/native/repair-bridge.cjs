'use strict';

/**
 * KNOuX Gemini - Recovery Lab read-only coordinator (Mission 11).
 *
 * Six bounded discovery stages collect measured repair evidence: privilege and
 * tool identity, servicing logs/component-store metadata, adapter/DNS/Winsock
 * state, update service/cache state, restore point access and the local preview
 * journal. DISM, SFC, netsh resets, service resets and restore operations are
 * never executed. Plans are immutable previews with execution.available:false
 * and a fixed receipt.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const {
  SERVICE_DEFINITIONS,
  COMMAND_SPECS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS,
  IDENTITY_SCRIPT,
  SERVICING_SCRIPT,
  NETWORK_SCRIPT,
  UPDATE_SCRIPT,
  RESTORE_SCRIPT,
  TROUBLESHOOT_SCRIPT,
  asArray,
  text,
  numberOrNull,
  normalizeIdentity,
  normalizeServicing,
  normalizeNetwork,
  normalizeDnsCache,
  normalizeWinsock,
  normalizeUpdate,
  normalizeRestore,
  normalizeTroubleshooters
} = require('./repair-providers.cjs');

const execFileAsync = promisify(execFile);
const CONTRACT = 'repair.v1';
const MAX_JOURNAL_ENTRIES = 50;
const MAX_PLAN_ITEMS = 12;
const DISCOVERY_TIMEOUT_MS = 150000;
const SETTINGS_TARGETS = Object.freeze({
  windowsupdate: 'ms-settings:windowsupdate',
  troubleshoot: 'ms-settings:troubleshoot',
  recovery: 'ms-settings:recovery'
});

const TOOL_IMPACT = Object.freeze({
  'repair-component-check': {
    en: 'Read-only component-store health inspection. No files are repaired and no servicing source is contacted.',
    ar: 'فحص صحة مخزن المكونات للقراءة فقط. لا تُصلح ملفات ولا يُتصل بأي مصدر خدمة.'
  },
  'repair-component-scan': {
    en: 'Read-only component-store scan. It may take several minutes and requires elevation; it changes no component.',
    ar: 'مسح مخزن المكونات للقراءة فقط. قد يستغرق دقائق ويتطلب رفع صلاحيات؛ لا يغيّر أي مكوّن.'
  },
  'repair-component-restore': {
    en: 'Repairs component files and may download servicing content. Requires elevation, a source decision and approval.',
    ar: 'يصلح ملفات المكونات وقد ينزّل محتوى خدمة. يتطلب رفع صلاحيات وقرار مصدر وموافقة.'
  },
  'repair-files-verify': {
    en: 'Verifies protected system files without repairing them. Requires elevation and reads CBS evidence.',
    ar: 'يتحقق من ملفات النظام المحمية دون إصلاحها. يتطلب رفع صلاحيات ويقرأ أدلة CBS.'
  },
  'repair-files-repair': {
    en: 'Repairs protected system files. Requires elevation, may take time and may require a restart.',
    ar: 'يصلح ملفات النظام المحمية. يتطلب رفع صلاحيات وقد يستغرق وقتًا ويتطلب إعادة تشغيل.'
  },
  'repair-dns-flush': {
    en: 'Clears cached DNS records. Name resolution may briefly slow while the cache refills; no record content is shown.',
    ar: 'يمسح سجلات DNS المخبأة. قد يتباطأ تحليل الأسماء مؤقتًا أثناء إعادة ملء الذاكرة؛ لا يُعرض محتوى السجلات.'
  },
  'repair-winsock-reset': {
    en: 'Removes the Winsock catalog and layered providers. Network interruption and a mandatory restart are expected.',
    ar: 'يزيل كتالوج Winsock والمزودات الطبقية. يُتوقع انقطاع الشبكة وإعادة تشغيل إلزامية.'
  },
  'repair-tcpip-reset': {
    en: 'Resets the TCP/IP stack to Windows defaults. Active connections drop and a restart is required.',
    ar: 'يعيد مكدس TCP/IP إلى إعدادات Windows الافتراضية. تنقطع الاتصالات النشطة وتلزم إعادة تشغيل.'
  },
  'repair-history': {
    en: 'Reads the local append-only preview journal. It contains no executed repair because none was authorized.',
    ar: 'يقرأ سجل المعاينات المحلي الإضافي. لا يتضمن أي إصلاح منفذ لأنه لم يُصرح بأي إصلاح.'
  },
  'repair-troubleshooters': {
    en: 'Guides the operator to allowlisted Windows settings. It does not launch a silent repair or claim a troubleshooter exists.',
    ar: 'يوجّه المشغل إلى إعدادات Windows المسموح بها. لا يشغّل إصلاحًا صامتًا ولا يدّعي وجود مستكشف أعطال.'
  },
  'repair-restore-point': {
    en: 'Lists measured restore points. Applying one is a Windows UI action; no silent restore channel exists.',
    ar: 'يسرد نقاط الاستعادة المقيسة. تطبيق نقطة إجراء في واجهة Windows؛ لا توجد قناة استعادة صامتة.'
  },
  'repair-update-reset': {
    en: 'Stops update services and renames the update cache in the planned preview. Nothing is stopped or renamed here.',
    ar: 'يوقف خدمات التحديث ويعيد تسمية ذاكرة التحديث في المعاينة المخططة. لا يُوقف أو يُعاد تسمية أي شيء هنا.'
  }
});

function repairError(code, message, { retryable = false } = {}) {
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
      timer = setTimeout(() => reject(repairError(code, message, { retryable: true })), ms);
    })
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function toolById(id) {
  return SERVICE_DEFINITIONS.find((entry) => entry.id === id) || null;
}

function commandFor(id) {
  return COMMAND_SPECS.find((entry) => entry.toolId === id) || null;
}

function normalizeToolIds(value) {
  if (!Array.isArray(value) || !value.length) {
    throw repairError('REPAIR_INPUT_INVALID', 'At least one repair tool must be supplied.');
  }
  const ids = [];
  for (const candidate of value) {
    if (typeof candidate !== 'string') continue;
    if (!toolById(candidate)) throw repairError('REPAIR_TOOL_INVALID', `The repair tool ${candidate.slice(0, 80)} is not registered.`);
    if (!ids.includes(candidate)) ids.push(candidate);
    if (ids.length >= MAX_PLAN_ITEMS) break;
  }
  if (!ids.length) throw repairError('REPAIR_INPUT_INVALID', 'No valid repair tool was supplied.');
  return ids;
}

function emptyRestore(reason) {
  return { status: 'unavailable', points: [], enabled: null, reason, source: 'Get-ComputerRestorePoint' };
}

function emptyTroubleshooters(reason) {
  return {
    msdtAvailable: null,
    commandAvailable: null,
    settingsTarget: 'troubleshoot',
    categories: [],
    note: reason
  };
}

class RepairBridge {
  constructor(options = {}) {
    this.userDataPath = options.userDataPath || path.join(os.tmpdir(), 'knoux-repair');
    this.journalPath = path.join(this.userDataPath, 'knoux-repair', 'journal.json');
    this.runFile = options.runFile || execFileAsync;
    this.getProvider = options.loadProvider || (() => null);
    this.now = options.now || (() => new Date());
    this.limits = {
      journalEntries: MAX_JOURNAL_ENTRIES,
      planItems: MAX_PLAN_ITEMS,
      diagnosticsTimeoutMs: 60000,
      discoveryTimeoutMs: DISCOVERY_TIMEOUT_MS
    };
    this.session = null;
    this.snapshotCache = null;
    this.scanPromise = null;
    this.cancelled = false;
  }

  capabilities() {
    return {
      engine: 'KNOuX Recovery Lab read-only repair evidence',
      contract: CONTRACT,
      readOnly: true,
      mutation: 'none',
      fixtureFallback: false,
      serviceCount: SERVICE_DEFINITIONS.length,
      worldCount: 1,
      services: SERVICE_DEFINITIONS.map((entry) => ({ ...entry })),
      commands: COMMAND_SPECS.map((entry) => ({ ...entry, execution: { ...entry.execution } })),
      gatedOperations: GATED_OPERATIONS.map((entry) => ({ ...entry })),
      elevation: { isAdmin: null, method: 'user-initiated UAC only', automaticElevation: false },
      limits: { ...this.limits },
      nativeOnly: [
        'Measured servicing log/component-store metadata',
        'DNS cache record count without cached domains',
        'Winsock provider catalog metadata',
        'Windows Update service and cache metadata',
        'Restore point enumeration when Windows grants access',
        'Immutable repair previews and a local audit journal'
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
    return {
      ...this.session,
      stages: this.session.stages.map((stage) => ({ ...stage })),
      warnings: [...this.session.warnings]
    };
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
      session.warnings.push(error?.message || 'Repair discovery failed.');
      return null;
    });
    return this.publicSession();
  }

  status(sessionId) {
    if (!this.session || this.session.id !== sessionId) {
      throw repairError('REPAIR_SESSION_NOT_FOUND', 'The requested repair discovery session does not exist.');
    }
    return this.publicSession();
  }

  cancel(sessionId) {
    if (!this.session || this.session.id !== sessionId) {
      throw repairError('REPAIR_SESSION_NOT_FOUND', 'The requested repair discovery session does not exist.');
    }
    if (this.session.status !== 'running') {
      return { cancelled: false, status: this.session.status, sessionId };
    }
    this.cancelled = true;
    return { cancelled: true, status: this.session.status, sessionId };
  }

  updateProgress(session) {
    const completed = session.stages.filter((stage) => ['complete', 'partial', 'unavailable', 'cancelled'].includes(stage.status)).length;
    session.progress = Math.round((completed / session.stages.length) * 100);
  }

  async powershell(script, label, timeout = 45000) {
    const provider = this.getProvider();
    if (provider && typeof provider.powershellJson === 'function') {
      return provider.powershellJson(script, { provider: label, timeout });
    }
    const result = await this.runFile('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      script
    ], { windowsHide: true, timeout, maxBuffer: 8 * 1024 * 1024 });
    const stdout = String(result?.stdout || '').trim();
    return stdout ? JSON.parse(stdout) : {};
  }

  async runExe(file, args, timeout = 30000) {
    return this.runFile(file, args, { windowsHide: true, timeout, maxBuffer: 4 * 1024 * 1024 });
  }

  async runScan(session) {
    const started = Date.now();
    let identity = normalizeIdentity({});
    let servicing = normalizeServicing({});
    let network = { adapters: [], addresses: [], dnsServers: [], dnsCache: { status: 'unavailable', entryCount: null, note: 'Not measured.', source: 'ipconfig.exe /displaydns' }, winsock: { status: 'unavailable', providerCount: null, categories: [], note: 'Not measured.', source: 'netsh.exe winsock show catalog' } };
    let update = normalizeUpdate({});
    let restore = emptyRestore('Restore point evidence was not measured.');
    let troubleshooters = emptyTroubleshooters('Troubleshooter capability was not measured.');
    let journal = [];
    const sources = [];
    const warnings = session.warnings;

    const runStage = async (key, provider, work) => {
      if (this.cancelled) return { cancelled: true };
      const stage = session.stages.find((entry) => entry.key === key);
      stage.status = 'running';
      stage.provider = provider;
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

    await runStage('identity', 'WindowsPrincipal + Win32_OperatingSystem + fixed tool paths', async () => {
      const raw = await withTimeout(this.powershell(IDENTITY_SCRIPT, 'WindowsPrincipal+Win32_OperatingSystem', 30000), 35000, 'REPAIR_IDENTITY_TIMEOUT', 'The privilege identity check timed out.');
      identity = normalizeIdentity(raw || {});
      identity.observedAt = this.now().toISOString();
      sources.push('WindowsPrincipal', 'Win32_OperatingSystem', 'dism.exe/sfc.exe path check');
      if (identity.isAdmin === false) warnings.push('The application is not elevated. Elevated diagnostics are published as gated previews and were not executed.');
      return { items: 10 };
    });

    if (this.cancelled) return this.finishCancelled(session, started);

    await runStage('servicing', 'Log and component-store file metadata', async () => {
      const raw = await withTimeout(this.powershell(SERVICING_SCRIPT, 'ServicingLogMetadata', 30000), 35000, 'REPAIR_SERVICING_TIMEOUT', 'Servicing log metadata timed out.');
      servicing = normalizeServicing(raw || {});
      sources.push('DISM/CBS log metadata', 'WinSxS metadata', 'pending-reboot registry keys');
      return { items: [servicing.dismLog, servicing.cbsLog, servicing.componentStore].filter((entry) => entry.exists).length };
    });

    if (this.cancelled) return this.finishCancelled(session, started);

    await runStage('network', 'Get-NetAdapter + Get-NetIPAddress + Get-DnsClientServerAddress + ipconfig + netsh', async () => {
      const raw = await withTimeout(this.powershell(NETWORK_SCRIPT, 'NetTCPIP', 60000), 65000, 'REPAIR_NETWORK_TIMEOUT', 'Adapter evidence timed out.');
      network = normalizeNetwork(raw || {});
      sources.push('Get-NetAdapter', 'Get-NetIPAddress', 'Get-DnsClientServerAddress');
      let dnsError = null;
      let dnsStdout = '';
      try {
        const dns = await this.runExe('ipconfig.exe', ['/displaydns'], 20000);
        dnsStdout = String(dns?.stdout || '');
      } catch (error) {
        dnsError = error;
      }
      network.dnsCache = normalizeDnsCache(dnsStdout, dnsError);
      sources.push('ipconfig.exe /displaydns (record count only)');
      let winsockError = null;
      let winsockStdout = '';
      try {
        const winsock = await this.runExe('netsh.exe', ['winsock', 'show', 'catalog'], 30000);
        winsockStdout = String(winsock?.stdout || '');
      } catch (error) {
        winsockError = error;
      }
      network.winsock = normalizeWinsock(winsockStdout, winsockError);
      sources.push('netsh.exe winsock show catalog');
      const partial = network.dnsCache.status !== 'measured' || network.winsock.status !== 'measured';
      return {
        items: network.adapters.length + network.addresses.length + network.dnsServers.length,
        partial,
        warning: partial ? 'One measured network sub-source did not answer; the others are complete.' : null
      };
    });

    if (this.cancelled) return this.finishCancelled(session, started);

    await runStage('update', 'Get-Service + SoftwareDistribution metadata', async () => {
      const raw = await withTimeout(this.powershell(UPDATE_SCRIPT, 'UpdateServices', 30000), 35000, 'REPAIR_UPDATE_TIMEOUT', 'Update service evidence timed out.');
      update = normalizeUpdate(raw || {});
      sources.push('Get-Service wuauserv/bits/cryptsvc/msiserver/trustedinstaller', 'SoftwareDistribution metadata');
      return { items: update.services.length };
    });

    if (this.cancelled) return this.finishCancelled(session, started);

    const restoreStage = await runStage('restore', 'Get-ComputerRestorePoint', async () => {
      try {
        const raw = await withTimeout(this.powershell(RESTORE_SCRIPT, 'Get-ComputerRestorePoint', 30000), 35000, 'REPAIR_RESTORE_TIMEOUT', 'Restore point enumeration timed out.');
        restore = normalizeRestore(raw || {});
      } catch (error) {
        restore = normalizeRestore({}, error);
      }
      sources.push('Get-ComputerRestorePoint');
      const partial = restore.status !== 'available';
      return {
        items: restore.points.length,
        partial,
        warning: partial ? (restore.reason || 'Restore point evidence is not available.') : null
      };
    });
    if (restoreStage && restoreStage.cancelled) return this.finishCancelled(session, started);

    await runStage('journal', 'Troubleshooter capability + local preview journal', async () => {
      try {
        const raw = await this.powershell(TROUBLESHOOT_SCRIPT, 'TroubleshooterCapability', 20000);
        troubleshooters = normalizeTroubleshooters(raw || {});
      } catch (error) {
        troubleshooters = normalizeTroubleshooters({}, error);
      }
      journal = await this.readJournal();
      sources.push('msdt.exe/Get-TroubleshootingPack capability', 'Local repair preview journal');
      return { items: journal.length + troubleshooters.categories.length };
    });

    if (this.cancelled) return this.finishCancelled(session, started);

    const coverage = session.stages.map((stage) => ({
      key: stage.key,
      status: stage.status === 'complete' ? 'complete' : stage.status === 'partial' ? 'partial' : stage.status === 'cancelled' ? 'cancelled' : 'unavailable',
      items: stage.items,
      note: stage.warning
    }));
    const snapshot = {
      contract: CONTRACT,
      generatedAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      fixtureFallback: false,
      identity,
      servicing,
      network,
      update,
      restore,
      troubleshooters,
      journal,
      commands: COMMAND_SPECS.map((entry) => ({ ...entry, execution: { ...entry.execution } })),
      gates: GATED_OPERATIONS.map((entry) => ({ ...entry })),
      coverage,
      warnings: [...new Set(warnings)],
      sources: [...new Set(sources)],
      receipt: `repair:${sha256(`${identity.observedAt}:${network.adapters.length}:${update.services.length}:${restore.points.length}:${journal.length}`).slice(0, 24)}`
    };
    this.snapshotCache = snapshot;
    session.status = session.stages.some((stage) => stage.status === 'unavailable') ? 'partial' : 'complete';
    session.completedAt = this.now().toISOString();
    session.progress = 100;
    return this.publicSession();
  }

  finishCancelled(session, started) {
    session.status = 'cancelled';
    session.completedAt = this.now().toISOString();
    for (const stage of session.stages) {
      if (stage.status === 'pending' || stage.status === 'running') stage.status = 'cancelled';
    }
    session.progress = 100;
    if (started) session.durationMs = Date.now() - started;
    return this.publicSession();
  }

  async snapshot() {
    if (!this.snapshotCache) {
      throw repairError('REPAIR_NOT_MEASURED', 'No measured repair evidence is available. Start a Recovery Lab discovery first.');
    }
    return this.snapshotCache;
  }

  async readJournal() {
    try {
      const raw = await fs.promises.readFile(this.journalPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((entry) => entry && typeof entry.id === 'string' && typeof entry.at === 'string')
        .slice(0, this.limits.journalEntries);
    } catch (error) {
      if (error && error.code === 'ENOENT') return [];
      return [];
    }
  }

  async writeJournal(entries) {
    const directory = path.dirname(this.journalPath);
    await fs.promises.mkdir(directory, { recursive: true });
    const temporary = `${this.journalPath}.${process.pid}.tmp`;
    await fs.promises.writeFile(temporary, JSON.stringify(entries.slice(0, this.limits.journalEntries), null, 2), 'utf8');
    await fs.promises.rename(temporary, this.journalPath);
    return true;
  }

  async recordPreview(plan) {
    const entry = {
      id: `repair-journal-${crypto.randomUUID()}`,
      at: this.now().toISOString(),
      kind: 'preview',
      title: plan.items.length === 1 ? plan.items[0].titleEn : `${plan.items.length} repair preview items`,
      summary: `${plan.items.length} immutable preview item(s); elevation ${plan.elevationRequired ? 'required' : 'not required'}; reboot ${plan.rebootRequired ? 'required' : 'not required'}; nothing executed.`,
      toolIds: plan.items.map((item) => item.toolId),
      risk: plan.items.some((item) => item.risk === 'administrative') ? 'administrative' : plan.items.some((item) => item.risk === 'elevated-read-only') ? 'elevated-read-only' : 'read-only',
      elevationRequired: plan.elevationRequired,
      rebootRequired: plan.rebootRequired,
      receipt: plan.receipt,
      readOnly: true,
      mutation: 'none'
    };
    const existing = await this.readJournal();
    try {
      await this.writeJournal([entry, ...existing.filter((candidate) => candidate.id !== entry.id)]);
      return { entry, recorded: true };
    } catch (error) {
      return { entry, recorded: false, warning: String(error?.message || 'The local journal could not be written.').slice(0, 200) };
    }
  }

  async journal() {
    return this.readJournal();
  }

  prerequisitesFor(tool, snapshot) {
    const admin = snapshot.identity.isAdmin;
    const requiresAdmin = tool.risk !== 'read-only';
    const prerequisites = [
      {
        id: 'windows',
        labelEn: 'Windows measured',
        labelAr: 'Windows مقيس',
        status: snapshot.identity.osName && snapshot.identity.osBuild ? 'passed' : 'unknown',
        detail: snapshot.identity.osBuild ? `${snapshot.identity.osName || 'Windows'} build ${snapshot.identity.osBuild}` : 'The OS identity was not measured.'
      }
    ];
    if (requiresAdmin) {
      prerequisites.push({
        id: 'elevation',
        labelEn: 'Administrator privilege',
        labelAr: 'صلاحية المسؤول',
        status: admin === true ? 'passed' : admin === false ? 'failed' : 'unknown',
        detail: admin === true
          ? 'The current session reports elevation. No administrative command is executed by this mission.'
          : 'The current session is not elevated. The administrative command is not executed.'
      });
    } else {
      prerequisites.push({
        id: 'standard-user',
        labelEn: 'Standard-user preview',
        labelAr: 'معاينة مستخدم عادي',
        status: 'passed',
        detail: 'A read-only or preview operation is available without elevation.'
      });
    }
    if (tool.id.startsWith('repair-component')) {
      prerequisites.push({
        id: 'dism',
        labelEn: 'DISM executable present',
        labelAr: 'وجود أداة DISM',
        status: snapshot.identity.dismAvailable === true ? 'passed' : snapshot.identity.dismAvailable === false ? 'failed' : 'unknown',
        detail: snapshot.identity.dismAvailable === true ? 'DISM.exe exists in System32.' : 'DISM.exe was not found.'
      });
    }
    if (tool.id.startsWith('repair-files')) {
      prerequisites.push({
        id: 'sfc',
        labelEn: 'SFC executable present',
        labelAr: 'وجود أداة SFC',
        status: snapshot.identity.sfcAvailable === true ? 'passed' : snapshot.identity.sfcAvailable === false ? 'failed' : 'unknown',
        detail: snapshot.identity.sfcAvailable === true ? 'sfc.exe exists in System32.' : 'sfc.exe was not found.'
      });
      prerequisites.push({
        id: 'cbs-log',
        labelEn: 'CBS log readable',
        labelAr: 'سجل CBS مقروء',
        status: snapshot.servicing.cbsLog.exists === true ? 'passed' : snapshot.servicing.cbsLog.exists === false ? 'failed' : 'unknown',
        detail: snapshot.servicing.cbsLog.exists === true ? 'CBS.log metadata is measured.' : 'CBS.log was not readable.'
      });
    }
    if (tool.id === 'repair-dns-flush' || tool.id === 'repair-tcpip-reset') {
      prerequisites.push({
        id: 'adapters',
        labelEn: 'Network adapter evidence',
        labelAr: 'أدلة محول الشبكة',
        status: snapshot.network.adapters.length ? 'passed' : 'unknown',
        detail: `${snapshot.network.adapters.length} measured adapter(s); ${snapshot.network.addresses.length} IPv4 address row(s).`
      });
    }
    if (tool.id === 'repair-winsock-reset') {
      prerequisites.push({
        id: 'winsock',
        labelEn: 'Winsock catalog readable',
        labelAr: 'كتالوج Winsock مقروء',
        status: snapshot.network.winsock.status === 'measured' ? 'passed' : 'unknown',
        detail: snapshot.network.winsock.status === 'measured' ? `${snapshot.network.winsock.providerCount ?? 0} measured provider entries.` : 'The Winsock catalog did not answer.'
      });
    }
    if (tool.id === 'repair-restore-point') {
      prerequisites.push({
        id: 'restore',
        labelEn: 'Restore point access',
        labelAr: 'الوصول لنقاط الاستعادة',
        status: snapshot.restore.status === 'available' ? 'passed' : snapshot.restore.status === 'permission_denied' ? 'failed' : 'unknown',
        detail: snapshot.restore.status === 'available' ? `${snapshot.restore.points.length} measured restore point(s).` : snapshot.restore.reason || 'Restore point evidence is unavailable.'
      });
    }
    if (tool.id === 'repair-update-reset') {
      prerequisites.push({
        id: 'update-services',
        labelEn: 'Update service evidence',
        labelAr: 'أدلة خدمة التحديث',
        status: snapshot.update.services.length ? 'passed' : 'unknown',
        detail: `${snapshot.update.services.length} measured update service row(s).`
      });
    }
    if (tool.id === 'repair-troubleshooters') {
      prerequisites.push({
        id: 'troubleshooter',
        labelEn: 'Windows troubleshooter capability',
        labelAr: 'قدرة مستكشف الأعطال',
        status: snapshot.troubleshooters.msdtAvailable === true ? 'passed' : snapshot.troubleshooters.msdtAvailable === false ? 'failed' : 'unknown',
        detail: snapshot.troubleshooters.msdtAvailable === true ? 'msdt.exe is present; the settings handoff remains user-initiated.' : 'msdt.exe was not detected; only the settings handoff is offered.'
      });
    }
    return prerequisites;
  }

  evidenceFor(tool, snapshot) {
    const evidence = [];
    const push = (label, value, status = 'measured') => evidence.push({ label, value: String(value), status });
    if (tool.id.startsWith('repair-component')) {
      push('DISM log', snapshot.servicing.dismLog.exists ? `${snapshot.servicing.dismLog.sizeBytes ?? 0} bytes · ${snapshot.servicing.dismLog.lastWrite || 'timestamp unavailable'}` : 'not readable', snapshot.servicing.dismLog.exists ? 'measured' : 'unavailable');
      push('Component store', snapshot.servicing.componentStore.exists ? 'present' : 'not found', snapshot.servicing.componentStore.exists ? 'measured' : 'unavailable');
      push('Store health', 'not run — requires elevation and separate approval', 'unavailable');
    }
    if (tool.id.startsWith('repair-files')) {
      push('CBS log', snapshot.servicing.cbsLog.exists ? `${snapshot.servicing.cbsLog.sizeBytes ?? 0} bytes` : 'not readable', snapshot.servicing.cbsLog.exists ? 'measured' : 'unavailable');
      push('Pending reboot', snapshot.identity.pendingReboot == null ? 'unknown' : snapshot.identity.pendingReboot ? 'yes' : 'no', snapshot.identity.pendingReboot == null ? 'unavailable' : 'measured');
      push('File integrity', 'not checked — SFC was not executed', 'unavailable');
    }
    if (tool.id === 'repair-dns-flush') {
      push('Adapters', snapshot.network.adapters.length);
      push('DNS cache entries', snapshot.network.dnsCache.entryCount == null ? 'unavailable' : snapshot.network.dnsCache.entryCount, snapshot.network.dnsCache.status === 'measured' ? 'measured' : 'unavailable');
      push('Cached domains', 'not displayed or persisted (privacy)', 'measured');
    }
    if (tool.id === 'repair-winsock-reset') {
      push('Winsock provider entries', snapshot.network.winsock.providerCount == null ? 'unavailable' : snapshot.network.winsock.providerCount, snapshot.network.winsock.status === 'measured' ? 'measured' : 'unavailable');
      push('Catalog categories', snapshot.network.winsock.categories.join(', ') || 'none reported', snapshot.network.winsock.status === 'measured' ? 'measured' : 'unavailable');
    }
    if (tool.id === 'repair-tcpip-reset') {
      push('Adapters', snapshot.network.adapters.length);
      push('IPv4 addresses', snapshot.network.addresses.length);
      push('DNS server groups', snapshot.network.dnsServers.length);
    }
    if (tool.id === 'repair-history') {
      push('Journal entries', snapshot.journal.length);
      push('Executed repairs', '0 — no execution channel exists', 'measured');
    }
    if (tool.id === 'repair-troubleshooters') {
      push('msdt.exe', snapshot.troubleshooters.msdtAvailable == null ? 'unknown' : snapshot.troubleshooters.msdtAvailable ? 'present' : 'not found', snapshot.troubleshooters.msdtAvailable == null ? 'unavailable' : 'measured');
      push('Get-TroubleshootingPack', snapshot.troubleshooters.commandAvailable == null ? 'unknown' : snapshot.troubleshooters.commandAvailable ? 'available' : 'not available', snapshot.troubleshooters.commandAvailable == null ? 'unavailable' : 'measured');
    }
    if (tool.id === 'repair-restore-point') {
      push('Restore points', snapshot.restore.points.length, snapshot.restore.status === 'available' ? 'measured' : 'permission_denied');
      push('Access', snapshot.restore.status, 'measured');
      push('Reason', snapshot.restore.reason || 'none', snapshot.restore.status === 'available' ? 'measured' : 'permission_denied');
    }
    if (tool.id === 'repair-update-reset') {
      push('Update services', snapshot.update.services.length);
      push('SoftwareDistribution', snapshot.update.softwareDistribution.exists ? 'present' : 'not found', snapshot.update.softwareDistribution.exists ? 'measured' : 'unavailable');
      push('Download items', snapshot.update.download.items == null ? 'unavailable' : snapshot.update.download.items, snapshot.update.download.items == null ? 'unavailable' : 'measured');
      push('Pending reboot', snapshot.identity.pendingReboot == null ? 'unknown' : snapshot.identity.pendingReboot ? 'yes' : 'no', snapshot.identity.pendingReboot == null ? 'unavailable' : 'measured');
    }
    return evidence;
  }

  async plan(toolIds) {
    const ids = normalizeToolIds(toolIds);
    const snapshot = await this.snapshot();
    const items = ids.map((id) => {
      const tool = toolById(id);
      const command = commandFor(id);
      const impact = TOOL_IMPACT[id];
      const prerequisites = this.prerequisitesFor(tool, snapshot);
      const elevationRequired = Boolean(command?.elevationRequired || tool.risk === 'administrative');
      return {
        id: `repair-item-${id}`,
        toolId: id,
        titleEn: tool.labelEn,
        titleAr: tool.labelAr,
        provider: tool.provider,
        risk: tool.risk,
        elevationRequired,
        rebootRequired: Boolean(command?.rebootRequired),
        command: command ? { ...command, execution: { ...command.execution } } : null,
        prerequisites,
        evidence: this.evidenceFor(tool, snapshot),
        impactEn: impact.en,
        impactAr: impact.ar,
        execution: {
          available: false,
          reason: 'Mission 11 is a preview-only repair review. No elevated or machine-changing executor is shipped; nothing was run.'
        }
      };
    });
    const elevationRequired = items.some((item) => item.elevationRequired);
    const rebootRequired = items.some((item) => item.rebootRequired);
    const plan = {
      contract: CONTRACT,
      id: crypto.randomUUID(),
      createdAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      immutable: true,
      mode: 'preview',
      itemCount: items.length,
      items,
      elevationRequired,
      rebootRequired,
      execution: {
        available: false,
        reason: 'Repair execution is intentionally absent. A future elevated executor must be separately approved and must verify postconditions.'
      },
      journalRecorded: false,
      receipt: `plan:${sha256(`${ids.join(',')}:${snapshot.receipt}:${this.now().toISOString()}`).slice(0, 24)}`,
      warnings: []
    };
    const recorded = await this.recordPreview(plan);
    plan.journalRecorded = recorded.recorded;
    if (recorded.warning) plan.warnings.push(recorded.warning);
    return plan;
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
      result = result.replace(/([A-Za-z]:[\\/]Users[\\/])[^\\/"']+/g, '$1<user>');
      return result;
    };
    const section = (id, titleEn, titleAr, items) => {
      const measured = items.filter((item) => item.status === 'measured').length;
      const unknown = items.filter((item) => item.status !== 'measured').length;
      return {
        id,
        titleEn,
        titleAr,
        status: unknown === 0 ? 'validated' : measured ? 'partial' : 'unavailable',
        measured,
        unknown,
        items: items.map((item) => ({ label: redactText(item.label), value: redactText(item.value), status: item.status === 'permission_denied' ? 'warning' : item.status === 'unavailable' ? 'unknown' : 'measured' }))
      };
    };
    const sections = [
      section('identity', 'Privilege & identity', 'الصلاحيات والهوية', [
        { label: 'Operating system', value: `${snapshot.identity.osName || 'unknown'} ${snapshot.identity.osBuild || ''}`.trim(), status: snapshot.identity.osName ? 'measured' : 'unavailable' },
        { label: 'Elevation', value: snapshot.identity.isAdmin == null ? 'unknown' : snapshot.identity.isAdmin ? 'elevated (no administrative command executed)' : 'standard user', status: snapshot.identity.isAdmin == null ? 'unavailable' : 'measured' },
        { label: 'Pending reboot', value: snapshot.identity.pendingReboot == null ? 'unknown' : snapshot.identity.pendingReboot ? 'yes' : 'no', status: snapshot.identity.pendingReboot == null ? 'unavailable' : 'measured' }
      ]),
      section('servicing', 'Servicing evidence', 'أدلة الخدمة', [
        { label: 'DISM log', value: snapshot.servicing.dismLog.exists ? `${snapshot.servicing.dismLog.sizeBytes ?? 0} bytes` : 'not readable', status: snapshot.servicing.dismLog.exists ? 'measured' : 'unavailable' },
        { label: 'CBS log', value: snapshot.servicing.cbsLog.exists ? `${snapshot.servicing.cbsLog.sizeBytes ?? 0} bytes` : 'not readable', status: snapshot.servicing.cbsLog.exists ? 'measured' : 'unavailable' },
        { label: 'Component store health', value: 'not run — execution gated', status: 'unavailable' }
      ]),
      section('network', 'Network evidence', 'أدلة الشبكة', [
        { label: 'Adapters', value: String(snapshot.network.adapters.length), status: 'measured' },
        { label: 'DNS cache entries', value: snapshot.network.dnsCache.entryCount == null ? 'unavailable' : String(snapshot.network.dnsCache.entryCount), status: snapshot.network.dnsCache.status === 'measured' ? 'measured' : 'unavailable' },
        { label: 'Winsock providers', value: snapshot.network.winsock.providerCount == null ? 'unavailable' : String(snapshot.network.winsock.providerCount), status: snapshot.network.winsock.status === 'measured' ? 'measured' : 'unavailable' }
      ]),
      section('update', 'Update servicing evidence', 'أدلة خدمة التحديث', [
        { label: 'Services', value: String(snapshot.update.services.length), status: 'measured' },
        { label: 'SoftwareDistribution', value: snapshot.update.softwareDistribution.exists ? 'present' : 'not found', status: snapshot.update.softwareDistribution.exists ? 'measured' : 'unavailable' },
        { label: 'Download items', value: snapshot.update.download.items == null ? 'unavailable' : String(snapshot.update.download.items), status: snapshot.update.download.items == null ? 'unavailable' : 'measured' }
      ]),
      section('restore', 'Restore evidence', 'أدلة الاستعادة', [
        { label: 'Status', value: snapshot.restore.status, status: 'measured' },
        { label: 'Points', value: String(snapshot.restore.points.length), status: snapshot.restore.status === 'available' ? 'measured' : 'permission_denied' },
        { label: 'Reason', value: snapshot.restore.reason || 'none', status: snapshot.restore.status === 'available' ? 'measured' : 'permission_denied' }
      ]),
      section('journal', 'Preview journal', 'سجل المعاينات', [
        { label: 'Entries', value: String(snapshot.journal.length), status: 'measured' },
        { label: 'Executed repairs', value: '0', status: 'measured' }
      ]),
      section('gates', 'Mutation gates', 'بوابات التغيير', snapshot.gates.map((gate) => ({ label: gate.id, value: `${gate.title} (Mission ${gate.mission})`, status: 'measured' })))
    ];
    return {
      contract: CONTRACT,
      generatedAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      redacted: redact,
      summary: `Read-only Recovery Lab report: ${snapshot.network.adapters.length} adapter(s), ${snapshot.update.services.length} update service(s), ${snapshot.restore.points.length} restore point(s), ${snapshot.journal.length} journal preview(s). No repair command was executed.`,
      sections,
      warnings: [...snapshot.warnings],
      receipt: `repair-report:${sha256(JSON.stringify(sections)).slice(0, 24)}`
    };
  }

  settingsTarget(target) {
    if (!SETTINGS_TARGETS[target]) {
      throw repairError('REPAIR_SETTINGS_TARGET_INVALID', 'The requested Windows settings page is not allowlisted.');
    }
    return { target, uri: SETTINGS_TARGETS[target] };
  }

  async close() {
    this.cancelled = true;
    this.snapshotCache = null;
  }
}

module.exports = {
  RepairBridge,
  SERVICE_DEFINITIONS,
  COMMAND_SPECS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS
};
