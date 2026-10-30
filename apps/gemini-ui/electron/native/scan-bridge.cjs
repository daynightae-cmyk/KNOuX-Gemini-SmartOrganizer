'use strict';

/**
 * KNOuX Gemini — read-only Smart Scan coordinator.
 *
 * Smart Scan owns no scanning engine of its own. It sequences the measured
 * providers that already exist in this application:
 *   - Files/Studio authorized-folder inventory
 *   - Storage volume capacity, folder analysis and byte-exact duplicate check
 *   - Windows system/service summaries reused by the platform bridge
 *   - Win32_StartupCommand and uninstall-registry providers
 *
 * Every stage is read-only, bounded, cancellable between provider calls, and
 * reports its real state. A failed or unavailable provider is surfaced as
 * partial/unsupported — it is never replaced with a design fixture. No stage
 * deletes, moves, cleans, elevates or changes a service, startup item or file.
 */

const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const MAX_HISTORY = 20;
const MAX_PERSISTED_SESSIONS = 10;
const MAX_LARGE_FILE_FINDINGS = 20;
const MAX_STARTUP_FINDINGS = 24;
const MAX_DUPLICATE_GROUPS = 12;
const MAX_PRIVACY_SAMPLE = 12;
const LARGE_FILE_THRESHOLD = 200 * 1024 * 1024;
const LOW_SPACE_RATIO = 0.1;

const STAGE_ORDER = Object.freeze([
  'inventory',
  'capacity',
  'system',
  'services',
  'startup',
  'apps',
  'emptyFolders',
  'privacy',
  'duplicates',
  'analyze',
]);

const STAGES = Object.freeze({
  inventory: {
    id: 'inventory',
    weight: 3,
    labelEn: 'Authorized folder inventory',
    labelAr: 'فهرس المجلد المصرح به',
    provider: 'Studio/Files inventory',
    requiresSource: true,
  },
  capacity: {
    id: 'capacity',
    weight: 1,
    labelEn: 'Mounted volume capacity',
    labelAr: 'سعة وحدات التخزين',
    provider: 'Win32_LogicalDisk',
    requiresSource: false,
  },
  system: {
    id: 'system',
    weight: 2,
    labelEn: 'System health pulse',
    labelAr: 'نبض صحة النظام',
    provider: 'Win32 system providers',
    requiresSource: false,
  },
  services: {
    id: 'services',
    weight: 2,
    labelEn: 'Windows service summary',
    labelAr: 'ملخص خدمات ويندوز',
    provider: 'Win32_Service',
    requiresSource: false,
  },
  startup: {
    id: 'startup',
    weight: 2,
    labelEn: 'Startup item inventory',
    labelAr: 'جرد عناصر بدء التشغيل',
    provider: 'Win32_StartupCommand',
    requiresSource: false,
    slow: true,
  },
  apps: {
    id: 'apps',
    weight: 3,
    labelEn: 'Installed software inventory',
    labelAr: 'جرد البرامج المثبتة',
    provider: 'uninstall-registry',
    requiresSource: false,
    slow: true,
  },
  emptyFolders: {
    id: 'emptyFolders',
    weight: 2,
    labelEn: 'Empty-folder discovery',
    labelAr: 'اكتشاف المجلدات الفارغة',
    provider: 'Files bounded walk',
    requiresSource: true,
  },
  privacy: {
    id: 'privacy',
    weight: 2,
    labelEn: 'Downloaded-origin sample',
    labelAr: 'عينة أصل التنزيل',
    provider: 'Files metadata / Zone.Identifier',
    requiresSource: true,
  },
  duplicates: {
    id: 'duplicates',
    weight: 4,
    labelEn: 'Byte-exact duplicate verification',
    labelAr: 'تحقق بايتي من المكررات',
    provider: 'Storage SHA-256 verification',
    requiresSource: true,
  },
  analyze: {
    id: 'analyze',
    weight: 1,
    labelEn: 'Findings and recommendations',
    labelAr: 'النتائج والتوصيات',
    provider: 'Local rule engine',
    requiresSource: false,
  },
});

/**
 * Ten Smart Scan services. `stages` lists the measured work each service
 * actually performs. `state` communicates support honestly:
 *   - available: measured end-to-end in this mission
 *   - partial:   a measured subset, with the remaining scope named
 *   - gated:     the operation needs an approval-gated mission (08/09)
 */
const SERVICES = Object.freeze([
  {
    id: 'quick_scan',
    labelEn: 'Quick Scan',
    labelAr: 'فحص سريع',
    state: 'available',
    requiresSource: true,
    stages: ['inventory', 'capacity', 'system', 'services'],
    noteEn: 'Authorized folder inventory plus measured system, volume and service summaries.',
    noteAr: 'فهرس المجلد المصرح به مع ملخصات النظام ووحدات التخزين والخدمات المقيسة.',
  },
  {
    id: 'deep_scan',
    labelEn: 'Deep Scan',
    labelAr: 'فحص عميق',
    state: 'partial',
    requiresSource: true,
    stages: ['inventory', 'capacity', 'system', 'services', 'startup', 'apps', 'emptyFolders', 'privacy', 'duplicates'],
    noteEn: 'All read-only providers with bounded duplicate hashing. Whole-volume raw-sector analysis and cleanup execution are not exposed.',
    noteAr: 'جميع المزودات للقراءة فقط مع تجزئة مكررات محدودة. تحليل القطاعات الكامل وتنفيذ التنظيف غير متاحين.',
  },
  {
    id: 'duplicate_finder',
    labelEn: 'Duplicate Finder',
    labelAr: 'مكتشف المكررات',
    state: 'available',
    requiresSource: true,
    stages: ['inventory', 'duplicates'],
    noteEn: 'Size candidates followed by bounded SHA-256 verification of indexed files.',
    noteAr: 'مرشحات بالحجم يتبعها تحقق SHA-256 محدود للملفات المفهرسة.',
  },
  {
    id: 'large_files_review',
    labelEn: 'Large Files Review',
    labelAr: 'مراجعة الملفات الكبيرة',
    state: 'available',
    requiresSource: true,
    stages: ['inventory'],
    noteEn: 'Ranked from measured file sizes inside the authorized folder.',
    noteAr: 'مرتبة من أحجام الملفات المقيسة داخل المجلد المصرح به.',
  },
  {
    id: 'junk_cleaner',
    labelEn: 'Junk Cleaner',
    labelAr: 'منظف المخلفات',
    state: 'partial',
    requiresSource: true,
    stages: ['inventory', 'emptyFolders'],
    noteEn: 'Measures empty folders only. System temp/browser cache discovery and all deletion require Mission 08 approval.',
    noteAr: 'يقيس المجلدات الفارغة فقط. اكتشاف ملفات النظام المؤقتة وكاش المتصفح وكل حذف يتطلب موافقة المهمة 08.',
  },
  {
    id: 'privacy_trace_check',
    labelEn: 'Privacy Trace Check',
    labelAr: 'فحص آثار الخصوصية',
    state: 'partial',
    requiresSource: true,
    stages: ['inventory', 'privacy'],
    noteEn: 'Samples Windows Zone.Identifier provenance for recent indexed files. Browser history, cookies and clipboard data are not read.',
    noteAr: 'يعاين أصل Zone.Identifier لملفات حديثة مفهرسة. لا يقرأ سجل المتصفح أو الكوكيز أو الحافظة.',
  },
  {
    id: 'startup_impact_check',
    labelEn: 'Startup Impact Check',
    labelAr: 'فحص إقلاع النظام',
    state: 'available',
    requiresSource: false,
    stages: ['startup'],
    noteEn: 'Reads Win32_StartupCommand entries. Boot-time seconds are not measured and are never invented; enable/disable is gated to Mission 09.',
    noteAr: 'يقرأ عناصر Win32_StartupCommand. زمن الإقلاع غير مقيس ولا يُختلق؛ التفعيل والتعطيل يتطلب المهمة 09.',
  },
  {
    id: 'app_health_review',
    labelEn: 'App Health Review',
    labelAr: 'صحة البرامج والتطبيقات',
    state: 'partial',
    requiresSource: false,
    stages: ['apps'],
    noteEn: 'Reads the installed-software registry inventory. “Unused” classification and uninstall are not measured and remain gated to Mission 05.',
    noteAr: 'يقرأ جرد البرامج من السجل. تصنيف "غير مستخدم" وإلغاء التثبيت غير مقيسين ويتطلبان المهمة 05.',
  },
  {
    id: 'system_health_pulse',
    labelEn: 'System Health Pulse',
    labelAr: 'نبض تشخيص النظام',
    state: 'available',
    requiresSource: false,
    stages: ['capacity', 'system'],
    noteEn: 'Measured CPU load, memory pressure and mounted volume capacity at the moment of the scan.',
    noteAr: 'حمل المعالج وضغط الذاكرة وسعة الوحدات مقيسة لحظة الفحص.',
  },
  {
    id: 'smart_recommendations',
    labelEn: 'Smart Recommendations',
    labelAr: 'توصيات ذكية',
    state: 'available',
    requiresSource: true,
    stages: ['inventory', 'capacity', 'system', 'services'],
    noteEn: 'Deterministic local rules over measured evidence. No AI provider, credential or external call is used.',
    noteAr: 'قواعد محلية حتمية مبنية على أدلة مقيسة. لا يستخدم مزود ذكاء اصطناعي أو بيانات اعتماد أو اتصالاً خارجياً.',
  },
]);

const SERVICE_BY_ID = new Map(SERVICES.map((service) => [service.id, service]));
const SERVICE_IDS = new Set(SERVICES.map((service) => service.id));

function scanError(code, message, retryable = false) {
  const error = new Error(message);
  error.code = code;
  error.retryable = retryable;
  return error;
}

function safeId(value) {
  return typeof value === 'string' && /^[a-f0-9-]{8,64}$/i.test(value) ? value : null;
}

function nowIso() {
  return new Date().toISOString();
}

function clip(value, max = 240) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size >= 100 ? Math.round(size) : round(size, 1)} ${units[index]}`;
}

function severityRank(severity) {
  return { high: 3, medium: 2, low: 1, info: 0 }[severity] ?? 0;
}

function volumeLetter(deviceId) {
  const match = String(deviceId || '').match(/([A-Za-z]):/);
  return match ? `${match[1].toUpperCase()}:` : String(deviceId || '—');
}

function orderedStageIds(stageIds) {
  return STAGE_ORDER.filter((id) => stageIds.has(id));
}

function stageRequested(stageIds, id) {
  return stageIds.has(id);
}

class ScanBridge {
  constructor({
    studio,
    files,
    storage,
    readSystemSummary,
    readServicesSummary,
    loadProvider,
    userDataPath,
    emit = () => {},
    now = Date.now,
  }) {
    if (!studio || !files || !storage) throw new Error('ScanBridge requires the Studio, Files and Storage adapters.');
    this.studio = studio;
    this.files = files;
    this.storage = storage;
    this.readSystemSummary = readSystemSummary;
    this.readServicesSummary = readServicesSummary;
    this.loadProvider = loadProvider;
    this.root = path.join(userDataPath, 'gemini-scan');
    this.sessionsDir = path.join(this.root, 'sessions');
    this.historyPath = path.join(this.root, 'history.json');
    this.active = new Map();
    this.ready = false;
    this.emitRaw = emit;
    this.now = now;
  }

  async init() {
    if (this.ready) return;
    await fsp.mkdir(this.sessionsDir, { recursive: true });
    this.ready = true;
  }

  emit(event) {
    try {
      this.emitRaw({ ...event, at: nowIso() });
    } catch {
      // Event delivery is non-fatal; the session remains queryable.
    }
  }

  capabilities() {
    return {
      engine: 'KNOuX read-only scan coordinator v1',
      contract: 'scan.v1',
      readOnly: true,
      mutation: 'none',
      wholeVolumeAnalysis: false,
      fixtureFallback: false,
      sourceScope: 'authorized-folder',
      stages: STAGE_ORDER.map((id) => ({
        id,
        labelEn: STAGES[id].labelEn,
        labelAr: STAGES[id].labelAr,
        provider: STAGES[id].provider,
        requiresSource: STAGES[id].requiresSource,
      })),
      services: SERVICES.map((service) => ({
        id: service.id,
        labelEn: service.labelEn,
        labelAr: service.labelAr,
        state: service.state,
        requiresSource: service.requiresSource,
        stages: service.stages.slice(),
        noteEn: service.noteEn,
        noteAr: service.noteAr,
      })),
      gatedOperations: [
        { id: 'cleanup.execute', mission: '08', title: 'Delete or quarantine junk/temp files', reason: 'Destructive file operations require explicit approval.' },
        { id: 'startup.mutate', mission: '09', title: 'Enable/disable or delay startup items', reason: 'Startup mutation is not exposed by the read-only platform.' },
        { id: 'applications.uninstall', mission: '08', title: 'Uninstall applications', reason: 'Uninstall is a privileged, irreversible operation.' },
        { id: 'duplicates.delete', mission: '08', title: 'Delete duplicate files', reason: 'Only verification is implemented; deletion requires approval.' },
        { id: 'wholeVolume.rawScan', mission: '02/10', title: 'Raw whole-volume analysis', reason: 'Only an explicitly authorized folder and mounted-volume capacity are measured.' },
      ],
    };
  }

  listSources() {
    return this.files.listSources();
  }

  chooseSource() {
    return this.files.chooseSource();
  }

  indexSource(sourceId) {
    return this.files.scanSource(sourceId);
  }

  resolveSource(sourceId) {
    const id = safeId(sourceId);
    if (!id) return null;
    const source = this.studio.getSource(id);
    const record = this.studio.getInventory(id);
    if (!source || !record) return null;
    return { id, source, record };
  }

  normalizeRequest(request = {}) {
    const mode = ['quick', 'deep', 'service', 'custom'].includes(request.mode) ? request.mode : null;
    if (!mode) throw scanError('SCAN_MODE_INVALID', 'Choose quick, deep, service or custom scan mode.');
    let requested = Array.isArray(request.services) ? request.services.filter((id) => SERVICE_IDS.has(id)) : [];
    if (mode === 'quick') requested = ['quick_scan'];
    if (mode === 'deep') requested = ['deep_scan'];
    if (mode === 'service') {
      if (requested.length !== 1) throw scanError('SCAN_SERVICE_REQUIRED', 'Choose exactly one scan service.');
    }
    if (mode === 'custom' && requested.length === 0) {
      throw scanError('SCAN_SERVICES_REQUIRED', 'Select at least one scan service for a custom scan.');
    }
    requested = [...new Set(requested)];
    if (!requested.length) throw scanError('SCAN_SERVICES_INVALID', 'No supported scan service was selected.');

    const stageIds = new Set();
    for (const id of requested) {
      for (const stageId of SERVICE_BY_ID.get(id).stages) stageIds.add(stageId);
    }
    stageIds.add('analyze');

    const needsSource = [...stageIds].some((id) => STAGES[id].requiresSource) ||
      requested.some((id) => SERVICE_BY_ID.get(id).requiresSource);
    const source = request.sourceId ? this.resolveSource(request.sourceId) : null;
    if (request.sourceId && !source) {
      throw scanError('SCAN_SOURCE_NOT_FOUND', 'The authorized source no longer exists or has not been indexed.');
    }
    if (needsSource && !source) {
      throw scanError(
        'SCAN_SOURCE_REQUIRED',
        'Authorize and index a source folder before this scan. Smart Scan never scans a whole volume implicitly.'
      );
    }

    return {
      mode,
      requested,
      stageIds,
      source,
      options: {
        verifyDuplicates: request.options?.verifyDuplicates !== false,
        includeSlowProviders: request.options?.includeSlowProviders !== false,
      },
    };
  }

  makeSession(plan) {
    const ordered = orderedStageIds(plan.stageIds);
    const totalWeight = ordered.reduce((sum, id) => sum + STAGES[id].weight, 0);
    return {
      id: crypto.randomUUID(),
      mode: plan.mode,
      requestedServices: plan.requested,
      sourceId: plan.source?.id || null,
      sourceLabel: plan.source ? clip(plan.source.source.label || path.basename(plan.source.record.root), 80) : null,
      scope: plan.source ? 'authorized-folder' : 'system-providers-only',
      status: 'running',
      startedAt: nowIso(),
      finishedAt: null,
      cancelRequested: false,
      stages: ordered.map((id) => ({
        id,
        labelEn: STAGES[id].labelEn,
        labelAr: STAGES[id].labelAr,
        provider: STAGES[id].provider,
        weight: STAGES[id].weight,
        status: 'pending',
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        detail: null,
        error: null,
      })),
      totalWeight,
      completedWeight: 0,
      progressPercent: 0,
      progressDeterminate: true,
      services: [],
      findings: [],
      recommendations: [],
      kpis: [],
      breakdown: [],
      summary: null,
      warnings: [],
      limitations: [
        'Read-only: no file, service, startup or registry value is changed.',
        'File scope is the authorized folder; mounted volume capacity is measured but whole-volume content is not scanned.',
      ],
    };
  }

  async start(request = {}) {
    await this.init();
    const plan = this.normalizeRequest(request);
    const session = this.makeSession(plan);
    const controller = new AbortController();
    this.active.set(session.id, { session, controller });
    this.emit({
      type: 'scan-started',
      sessionId: session.id,
      mode: session.mode,
      services: session.requestedServices,
      stageCount: session.stages.length,
    });
    // IPC invoke returns immediately; measured work continues on the event stream.
    void this.runSession(session, plan, controller).catch(async (error) => {
      session.status = 'failed';
      session.finishedAt = nowIso();
      session.summary = this.buildSummary(session);
      session.error = { code: clip(error?.code || 'SCAN_FAILED', 64), message: clip(error?.message || 'The scan failed.') };
      await this.persist(session).catch(() => {});
      this.active.delete(session.id);
      this.emit({ type: 'scan-failed', sessionId: session.id, summary: session.summary, error: session.error });
    });
    return {
      sessionId: session.id,
      status: session.status,
      mode: session.mode,
      stages: session.stages,
      startedAt: session.startedAt,
      sourceLabel: session.sourceLabel,
      scope: session.scope,
    };
  }

  stageById(session, id) {
    return session.stages.find((stage) => stage.id === id) || null;
  }

  updateProgress(session) {
    session.progressPercent = session.totalWeight
      ? Math.min(100, round((session.completedWeight / session.totalWeight) * 100, 1))
      : 0;
  }

  checkCancelled(session, controller) {
    if (!controller.signal.aborted) return false;
    session.cancelRequested = true;
    return true;
  }

  markPendingCancelled(session) {
    for (const stage of session.stages) {
      if (stage.status === 'pending') {
        stage.status = 'cancelled';
        stage.detail = 'Cancelled before provider work started.';
      }
    }
  }

  async runSession(session, plan, controller) {
    await this.init();
    const context = {
      inventory: null,
      capacity: null,
      system: null,
      services: null,
      startup: null,
      apps: null,
      emptyFolders: null,
      privacy: null,
      duplicates: null,
    };
    const stageState = new Map();
    let sourceFailed = false;

    for (const stage of session.stages) {
      if (stage.id === 'analyze') continue;
      if (this.checkCancelled(session, controller)) {
        stage.status = 'cancelled';
        stage.detail = 'Cancelled before this stage started.';
        stageState.set(stage.id, { status: 'cancelled' });
        continue;
      }
      stage.status = 'running';
      stage.startedAt = nowIso();
      stage.detail = STAGES[stage.id].slow
        ? 'Provider query in progress. Cancellation is honoured when the bounded query returns.'
        : 'Measured provider call in progress.';
      this.emit({ type: 'scan-stage', sessionId: session.id, stage: { ...stage } });

      const started = this.now();
      try {
        if (sourceFailed && STAGES[stage.id].requiresSource) {
          throw scanError('SCAN_SOURCE_STAGE_SKIPPED', 'The source inventory did not complete, so this dependent stage was skipped.');
        }
        const result = await this.runStage(stage.id, context, plan, controller, session);
        stage.finishedAt = nowIso();
        stage.durationMs = Math.max(0, this.now() - started);
        stage.status = result.status;
        stage.detail = result.detail;
        stage.error = result.error || null;
        stageState.set(stage.id, result);
        if (result.status === 'complete' || result.status === 'partial') {
          context[stage.id] = result.data;
          if (stage.id === 'inventory') {
            const record = this.studio.getInventory(session.sourceId);
            context.inventoryRecord = record;
            context.inventorySource = plan.source?.source || null;
          }
        }
        if (stage.id === 'inventory' && !['complete', 'partial'].includes(result.status)) sourceFailed = true;
        if (result.warnings?.length) session.warnings.push(...result.warnings.map((entry) => clip(entry, 200)));
      } catch (error) {
        stage.finishedAt = nowIso();
        stage.durationMs = Math.max(0, this.now() - started);
        stage.status = controller.signal.aborted ? 'cancelled' : 'failed';
        stage.error = { code: clip(error?.code || 'SCAN_STAGE_FAILED', 64), message: clip(error?.message || 'The provider stage failed.') };
        stage.detail = stage.error.message;
        stageState.set(stage.id, { status: stage.status, error: stage.error });
        if (stage.id === 'inventory') sourceFailed = true;
        session.warnings.push(`${STAGES[stage.id].labelEn}: ${stage.error.message}`);
      }
      session.completedWeight += STAGES[stage.id].weight;
      this.updateProgress(session);
      this.emit({
        type: 'scan-stage',
        sessionId: session.id,
        stage: { ...stage },
        progressPercent: session.progressPercent,
      });
      if (controller.signal.aborted) {
        session.cancelRequested = true;
        break;
      }
    }

    if (controller.signal.aborted) {
      session.cancelRequested = true;
      this.markPendingCancelled(session);
    }

    // Analysis is local and deterministic. It runs even for a cancelled scan so
    // the user keeps the evidence that was actually collected.
    const analyzeStage = this.stageById(session, 'analyze');
    if (analyzeStage) {
      analyzeStage.status = 'running';
      analyzeStage.startedAt = nowIso();
      this.emit({ type: 'scan-stage', sessionId: session.id, stage: { ...analyzeStage } });
      const started = this.now();
      try {
        const analyzed = this.analyze(session, plan, context, stageState);
        Object.assign(session, analyzed);
        analyzeStage.status = 'complete';
        analyzeStage.detail = `${session.findings.length} finding(s), ${session.recommendations.length} recommendation(s), ${session.services.length} service result(s).`;
      } catch (error) {
        analyzeStage.status = 'failed';
        analyzeStage.error = { code: clip(error?.code || 'SCAN_ANALYZE_FAILED', 64), message: clip(error?.message || 'Findings could not be derived.') };
        analyzeStage.detail = analyzeStage.error.message;
        session.warnings.push(analyzeStage.error.message);
      }
      analyzeStage.finishedAt = nowIso();
      analyzeStage.durationMs = Math.max(0, this.now() - started);
      session.completedWeight += STAGES.analyze.weight;
      this.updateProgress(session);
      this.emit({ type: 'scan-stage', sessionId: session.id, stage: { ...analyzeStage }, progressPercent: session.progressPercent });
    }

    const failed = session.stages.some((stage) => stage.status === 'failed');
    const unsupported = session.stages.some((stage) => ['unsupported', 'skipped'].includes(stage.status));
    const partialStage = session.stages.some((stage) => stage.status === 'partial');
    session.status = session.cancelRequested
      ? 'cancelled'
      : failed
        ? 'partial'
        : unsupported || partialStage
          ? 'partial'
          : 'complete';
    session.finishedAt = nowIso();
    session.summary = this.buildSummary(session);
    if (session.cancelRequested) {
      session.warnings.push('Cancellation was requested. An in-flight Windows provider call is allowed to return before the session closes; no further stage starts.');
    }
    this.updateProgress(session);
    await this.persist(session);
    this.active.delete(session.id);
    this.emit({
      type: session.cancelRequested ? 'scan-cancelled' : 'scan-complete',
      sessionId: session.id,
      summary: session.summary,
      progressPercent: session.progressPercent,
    });
  }

  async runStage(id, context, plan, controller, session) {
    const signal = controller.signal;
    const staged = (data, detail, warnings = [], status = 'complete') => ({ status, data, detail, warnings });
    const skipped = (reason) => ({ status: 'skipped', data: null, detail: reason, warnings: [reason] });

    if (id === 'inventory') {
      const analysis = await this.storage.analysis(session.sourceId);
      const totals = analysis.totals || {};
      return staged(
        {
          sourceId: session.sourceId,
          sourceLabel: session.sourceLabel,
          scope: 'authorized-folder',
          totals,
          coverage: analysis.coverage,
          categories: analysis.categories || [],
          extensions: (analysis.extensions || []).slice(0, 12),
          ages: analysis.ages || [],
          largest: (analysis.largest || []).slice(0, 24),
          recent: (analysis.recent || []).slice(0, 16),
          folders: (analysis.folders || []).slice(0, 8),
          duplicateCandidates: (analysis.duplicateCandidates || []).slice(0, MAX_DUPLICATE_GROUPS),
          duplicatePolicy: analysis.duplicatePolicy,
        },
        `${(totals.files || 0).toLocaleString()} indexed file(s), ${formatBytes(totals.bytes || 0)} inside the authorized folder.`,
        analysis.coverage?.warnings || []
      );
    }

    if (id === 'capacity') {
      const volumes = await this.storage.volumes();
      const low = volumes.volumes.filter((volume) => volume.isLowSpace);
      return staged(
        {
          volumes: volumes.volumes,
          historyPoints: volumes.history.length,
          provider: volumes.provider,
          coverage: volumes.coverage,
          hardwareIdentityAvailable: volumes.hardwareIdentityAvailable,
          smartAvailable: volumes.smartAvailable,
        },
        `${volumes.volumes.length} mounted volume(s); ${low.length} below 10% free.`,
        volumes.warnings
      );
    }

    if (id === 'system') {
      if (typeof this.readSystemSummary !== 'function') {
        return { status: 'unsupported', data: null, detail: 'The measured system provider is not installed.', warnings: ['System health is unavailable in this build.'] };
      }
      const envelope = await this.readSystemSummary();
      if (!envelope || !envelope.data) {
        return {
          status: envelope?.status === 'unsupported' ? 'unsupported' : 'failed',
          data: null,
          detail: envelope?.error?.message || 'The system provider did not return a measurement.',
          warnings: envelope?.warnings || [],
          error: envelope?.error || null,
        };
      }
      const data = envelope.data;
      const basis = [];
      if (Number.isFinite(data.cpuLoadPercent)) basis.push('CPU load read from the Windows processor provider.');
      if (Number.isFinite(data.memoryUsedPercent)) basis.push('Memory pressure read from the Windows operating-system provider.');
      if (Array.isArray(data.volumes) && data.volumes.length) basis.push('Volume capacity read from Win32_LogicalDisk.');
      return staged(
        {
          platform: data.platform,
          osCaption: data.osCaption,
          osVersion: data.osVersion,
          osBuild: data.osBuild,
          uptimeSeconds: data.uptimeSeconds,
          uptimeSource: data.uptimeSource,
          cpuModel: data.cpuModel,
          cpuCores: data.cpuCores,
          cpuLogicalProcessors: data.cpuLogicalProcessors,
          cpuLoadPercent: data.cpuLoadPercent,
          cpuLoadSource: data.cpuLoadSource,
          memoryTotalBytes: data.memoryTotalBytes,
          memoryFreeBytes: data.memoryFreeBytes,
          memoryUsedPercent: data.memoryUsedPercent,
          systemDrive: data.systemDrive,
          systemDriveFreeBytes: data.systemDriveFreeBytes,
          systemDriveTotalBytes: data.systemDriveTotalBytes,
          degraded: data.degraded,
          degradationReason: data.degradationReason || null,
          basis,
        },
        basis.length ? `Measured CPU, memory and OS summary (${basis.length} signal groups).` : 'The provider answered but exposed no numeric health signals.',
        envelope.warnings || []
      );
    }

    if (id === 'services') {
      if (typeof this.readServicesSummary !== 'function') {
        return { status: 'unsupported', data: null, detail: 'The measured service provider is not installed.', warnings: ['Service summary is unavailable in this build.'] };
      }
      const envelope = await this.readServicesSummary();
      if (!envelope || !envelope.data) {
        return {
          status: envelope?.status === 'unsupported' ? 'unsupported' : 'failed',
          data: null,
          detail: envelope?.error?.message || 'The service provider did not return a summary.',
          warnings: envelope?.warnings || [],
          error: envelope?.error || null,
        };
      }
      const counts = envelope.data;
      return staged(
        { ...counts, scope: 'summary-only', controlExposed: false },
        `${counts.total} service(s): ${counts.running} running, ${counts.stopped} stopped.`,
        [...(envelope.warnings || []), 'Per-service control and per-service stopped-automatic classification are not exposed by this platform.']
      );
    }

    if (id === 'startup') {
      if (!plan.options.includeSlowProviders) return skipped('Startup inventory was disabled for this scan.');
      const provider = this.requireProvider();
      const items = await provider.collectStartupItems({ timeout: 45000 });
      if (signal.aborted) {
        return { status: 'cancelled', data: null, detail: 'Cancelled after the bounded startup provider returned.', warnings: [] };
      }
      const safeItems = (Array.isArray(items) ? items : []).slice(0, 120).map((item) => ({
        name: clip(item.name || 'Unnamed startup item', 120),
        source: clip(item.source || 'unknown', 40),
        location: clip(item.sourceDetail || item.location || '', 160),
        writable: Boolean(item.writable),
        managedBySmartOrganizer: Boolean(item.managedBySmartOrganizer),
        provider: clip(item.provider || 'Win32_StartupCommand', 60),
      }));
      const bySource = {};
      for (const item of safeItems) bySource[item.source] = (bySource[item.source] || 0) + 1;
      return staged(
        { items: safeItems, bySource, writableCount: safeItems.filter((item) => item.writable).length, commandExposed: false },
        `${safeItems.length} startup entr${safeItems.length === 1 ? 'y' : 'ies'} measured. Commands and user names are not exposed.`,
        ['Boot duration and per-item startup cost are not measured; no seconds estimate is reported.']
      );
    }

    if (id === 'apps') {
      if (!plan.options.includeSlowProviders) return skipped('Installed-software inventory was disabled for this scan.');
      const provider = this.requireProvider();
      const result = await provider.collectUninstallApps({ timeout: 60000 });
      if (signal.aborted) {
        return { status: 'cancelled', data: null, detail: 'Cancelled after the bounded software provider returned.', warnings: [] };
      }
      const items = Array.isArray(result?.items) ? result.items : [];
      const safeApps = items.slice(0, 2000).map((item) => ({
        name: clip(item.name || 'Unnamed application', 120),
        version: clip(item.version || '', 40) || null,
        publisher: clip(item.publisher || '', 100) || null,
      }));
      const publisherMap = new Map();
      for (const app of safeApps) {
        const key = app.publisher || 'Unknown publisher';
        publisherMap.set(key, (publisherMap.get(key) || 0) + 1);
      }
      const publishers = [...publisherMap.entries()]
        .map(([publisher, count]) => ({ publisher, count }))
        .sort((a, b) => b.count - a.count || a.publisher.localeCompare(b.publisher))
        .slice(0, 10);
      return staged(
        { total: safeApps.length, publishers, apps: safeApps.slice(0, 80), installPathsExposed: false, sourceFailures: result?.sourceFailures ?? null, entryFailures: result?.entryFailures ?? null },
        `${safeApps.length} installed application record(s) measured from the uninstall registry.`,
        ['“Unused” and “orphaned” classifications are not measured. No uninstall capability is exposed.']
      );
    }

    if (id === 'emptyFolders') {
      const result = await this.files.emptyFolders(session.sourceId, 200);
      if (signal.aborted) {
        return { status: 'cancelled', data: null, detail: 'Cancelled after the bounded empty-folder walk returned.', warnings: [] };
      }
      return staged(
        {
          items: (result.items || []).slice(0, 200).map((item) => ({ relative: clip(item.relative, 200) })),
          summary: result.summary,
          partial: result.partial,
          mutation: 'none',
        },
        `${result.summary?.emptyFolders || 0} empty folder(s) in ${result.summary?.foldersScanned || 0} scanned folder(s).`,
        result.warnings || [],
        result.partial ? 'partial' : 'complete'
      );
    }

    if (id === 'privacy') {
      const inventory = context.inventory;
      if (!inventory) return skipped('The inventory stage did not complete, so no privacy sample was read.');
      const candidates = (inventory.recent || []).filter((file) => Number.isFinite(Number(file.id))).slice(0, MAX_PRIVACY_SAMPLE);
      const samples = [];
      let errors = 0;
      for (const file of candidates) {
        if (signal.aborted) break;
        try {
          const metadata = await this.files.metadata(session.sourceId, file.id);
          samples.push({
            fileId: file.id,
            relative: clip(file.relative, 200),
            name: clip(file.name, 120),
            zoneId: metadata.zone?.zoneId ?? null,
            zoneAvailable: Boolean(metadata.zone?.zoneAvailable),
            host: metadata.zone?.host ? clip(metadata.zone.host, 120) : null,
            referrer: metadata.zone?.referrer ? clip(metadata.zone.referrer, 160) : null,
          });
        } catch {
          errors += 1;
        }
      }
      if (signal.aborted) {
        return { status: 'cancelled', data: null, detail: 'Privacy sampling was cancelled between files.', warnings: [] };
      }
      const withZone = samples.filter((sample) => sample.zoneAvailable);
      const hosts = [...new Set(withZone.map((sample) => sample.host).filter(Boolean))];
      return staged(
        {
          sampled: samples.length,
          withZone: withZone.length,
          hosts,
          samples,
          errors,
          sampleLimit: MAX_PRIVACY_SAMPLE,
          browserHistoryRead: false,
          cookiesRead: false,
          clipboardRead: false,
        },
        `${withZone.length} of ${samples.length} sampled file(s) carry a download-origin zone marker.`,
        [
          'Only Windows Zone.Identifier metadata for a bounded sample of recent indexed files is read.',
          'Browser history, cookies, autofill and clipboard contents are not read.',
          ...(errors ? [`${errors} sampled file(s) could not be read and were excluded.`] : []),
        ],
        errors ? 'partial' : 'complete'
      );
    }

    if (id === 'duplicates') {
      if (!plan.options.verifyDuplicates) return skipped('Byte-exact duplicate verification was disabled for this scan.');
      const result = await this.storage.verifyDuplicates(session.sourceId);
      if (signal.aborted) {
        return { status: 'cancelled', data: null, detail: 'Cancelled after the bounded duplicate verification returned.', warnings: [] };
      }
      return staged(
        {
          groups: (result.groups || []).slice(0, MAX_DUPLICATE_GROUPS),
          summary: result.summary,
          errors: result.errors || [],
          mutation: 'none',
          permission: 'read-only',
        },
        `${result.summary?.verifiedGroups || 0} byte-identical group(s) verified across ${result.summary?.filesHashed || 0} hashed file(s).`,
        result.warnings || [],
        result.summary?.budgetReached ? 'partial' : 'complete'
      );
    }

    throw scanError('SCAN_STAGE_UNKNOWN', `Unknown scan stage: ${id}`);
  }

  requireProvider() {
    if (typeof this.loadProvider !== 'function') {
      throw scanError('SCAN_PROVIDER_MISSING', 'The read-only Windows provider module is not installed.');
    }
    const provider = this.loadProvider();
    if (!provider) throw scanError('SCAN_PROVIDER_MISSING', 'The read-only Windows provider module is not installed.');
    return provider;
  }

  analyze(session, plan, context, stageState) {
    const findings = this.buildFindings(session, context);
    const recommendations = this.buildRecommendations(context, findings);
    const services = this.buildServiceResults(session, plan, context, stageState);
    const breakdown = this.buildBreakdown(findings);
    const metrics = this.buildMetrics(context);
    const summaryBase = {
      sourceId: session.sourceId,
      sourceLabel: session.sourceLabel,
      scope: session.scope,
      mode: session.mode,
      requestedServices: session.requestedServices.slice(),
      status: session.status,
      findings,
      recommendations,
      services,
      breakdown,
      metrics,
      stages: session.stages,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      warnings: session.warnings,
      limitations: session.limitations,
      progressPercent: session.progressPercent,
    };
    // This method is itself the analyze stage. Its evidence is complete once it
    // returns, so coverage must not report the stage as still running.
    const analyzedStages = session.stages.map((stage) => (
      stage.id === 'analyze' ? { ...stage, status: 'complete' } : stage
    ));
    const summary = this.buildSummary({ ...session, ...summaryBase, stages: analyzedStages });
    const kpis = this.buildKpis(summary, context);
    return { findings, recommendations, services, breakdown, summary, kpis, metrics };
  }

  buildMetrics(context) {
    const inventory = context.inventory;
    const verified = context.duplicates?.summary || null;
    const privacy = context.privacy || null;
    const system = context.system || null;
    return {
      filesIndexed: inventory?.totals?.files ?? null,
      bytesIndexed: inventory?.totals?.bytes ?? null,
      verifiedReclaimableBytes: verified?.reclaimableVerifiedBytes ?? 0,
      verifiedDuplicateGroups: verified?.verifiedGroups ?? 0,
      privacySignalCount: privacy?.withZone ?? null,
      privacySampled: privacy?.sampled ?? null,
      system,
      volumes: context.capacity?.volumes || [],
      services: context.services || null,
    };
  }

  buildFindings(session, context) {
    const findings = [];
    const add = (finding) => {
      if (findings.length >= 400) return;
      findings.push(finding);
    };
    const inventory = context.inventory;
    const largeThreshold = LARGE_FILE_THRESHOLD;

    if (inventory) {
      const largeFiles = (inventory.largest || [])
        .filter((file) => Number(file.size) >= largeThreshold)
        .slice(0, MAX_LARGE_FILE_FINDINGS);
      for (const file of largeFiles) {
        const size = Number(file.size) || 0;
        add({
          stableId: `large:${session.sourceId}:${file.id}`,
          kind: 'large-file',
          serviceId: 'large_files_review',
          titleEn: file.name,
          titleAr: file.name,
          evidence: `${clip(file.relative, 200)} — measured ${formatBytes(size)}. Review only; no file was touched.`,
          bytes: size,
          itemCount: 1,
          severity: size >= 2 * 1024 ** 3 ? 'high' : size >= 1024 ** 3 ? 'medium' : 'low',
          risk: 'review',
          scope: 'authorized-folder',
          provenance: { provider: 'Files/Studio inventory', mode: 'measured', scope: 'authorized-folder' },
          pathPreview: [clip(file.relative, 200)],
        });
      }

      if (context.duplicates?.groups?.length) {
        for (const group of context.duplicates.groups.slice(0, MAX_DUPLICATE_GROUPS)) {
          add({
            stableId: `duplicate:verified:${session.sourceId}:${group.digest.slice(0, 16)}:${group.size}`,
            kind: 'duplicate-verified',
            serviceId: 'duplicate_finder',
            titleEn: `${group.count} verified identical files`,
            titleAr: `${group.count} ملفات متطابقة تم التحقق منها`,
            evidence: `${formatBytes(group.size)} each; SHA-256 match. Wasted duplicate bytes: ${formatBytes(group.wastedBytes)}. Deletion is not available in this mission.`,
            bytes: Number(group.wastedBytes) || 0,
            itemCount: Number(group.count) || 0,
            severity: Number(group.wastedBytes) >= 1024 ** 3 ? 'high' : 'medium',
            risk: 'review',
            scope: 'authorized-folder',
            provenance: { provider: 'Storage SHA-256 verification', mode: 'measured', scope: 'authorized-folder' },
            pathPreview: (group.files || []).slice(0, 4).map((file) => clip(file.relative, 200)),
          });
        }
      } else if (inventory.duplicateCandidates?.length) {
        for (const group of inventory.duplicateCandidates.slice(0, 8)) {
          add({
            stableId: `duplicate:candidate:${session.sourceId}:${group.sizeBytes}:${group.count}`,
            kind: 'duplicate-candidate',
            serviceId: 'duplicate_finder',
            titleEn: `${group.count} same-size files (unverified)`,
            titleAr: `${group.count} ملفات بالحجم نفسه (غير متحقق منها)`,
            evidence: `${formatBytes(group.sizeBytes)} each by metadata only. Content was not hashed in this scan, so these are candidates, not confirmed duplicates.`,
            bytes: Number(group.wastedBytes) || 0,
            itemCount: Number(group.count) || 0,
            severity: 'low',
            risk: 'info',
            scope: 'authorized-folder',
            provenance: { provider: 'Files/Studio inventory', mode: 'measured', scope: 'authorized-folder' },
            pathPreview: (group.files || []).slice(0, 4).map((file) => clip(file.relative, 200)),
          });
        }
      }
    }

    if (context.capacity?.volumes?.length) {
      for (const volume of context.capacity.volumes) {
        if (!volume.isLowSpace) continue;
        add({
          stableId: `low-space:${volume.id}`,
          kind: 'low-space',
          serviceId: 'system_health_pulse',
          titleEn: `${volume.letter} low free space`,
          titleAr: `${volume.letter} مساحة حرة منخفضة`,
          evidence: `${formatBytes(volume.freeBytes)} free of ${formatBytes(volume.totalBytes)} (${volume.freePercent}% free) measured at scan time.`,
          bytes: 0,
          itemCount: 1,
          severity: volume.freePercent < 5 ? 'high' : 'medium',
          risk: 'attention',
          scope: 'mounted-volume',
          provenance: { provider: 'Win32_LogicalDisk', mode: 'measured', scope: 'mounted-volume' },
          pathPreview: [],
        });
      }
    }

    if (context.startup?.items?.length) {
      for (const item of context.startup.items.slice(0, MAX_STARTUP_FINDINGS)) {
        add({
          stableId: `startup:${session.id}:${item.source}:${item.name}`.slice(0, 180),
          kind: 'startup-item',
          serviceId: 'startup_impact_check',
          titleEn: item.name,
          titleAr: item.name,
          evidence: `Registered at ${item.source}${item.location ? ` (${item.location})` : ''}. Read-only inventory; no startup value was changed.`,
          bytes: 0,
          itemCount: 1,
          severity: item.source === 'registry-run-user' || item.source === 'registry-run-machine' ? 'medium' : 'low',
          risk: 'info',
          scope: 'system',
          provenance: { provider: 'Win32_StartupCommand', mode: 'measured', scope: 'system' },
          pathPreview: [item.location].filter(Boolean),
        });
      }
    }

    if (context.privacy?.withZone > 0) {
      add({
        stableId: `privacy:zone:${session.id}`,
        kind: 'privacy-origin',
        serviceId: 'privacy_trace_check',
        titleEn: `${context.privacy.withZone} file(s) retain download origin`,
        titleAr: `${context.privacy.withZone} ملفاً يحتفظ بأصل التنزيل`,
        evidence: `Bounded sample of ${context.privacy.sampled} recent indexed file(s); ${context.privacy.withZone} carry a Windows Zone.Identifier. Hosts: ${context.privacy.hosts.slice(0, 4).join(', ') || 'not exposed'}.`,
        bytes: 0,
        itemCount: context.privacy.withZone,
        severity: 'low',
        risk: 'info',
        scope: 'authorized-folder-sample',
        provenance: { provider: 'Windows Zone.Identifier metadata', mode: 'measured', scope: 'authorized-folder-sample' },
        pathPreview: context.privacy.samples.filter((sample) => sample.zoneAvailable).slice(0, 4).map((sample) => sample.relative),
      });
    }

    if (context.emptyFolders?.items?.length) {
      add({
        stableId: `empty-folders:${session.sourceId}`,
        kind: 'empty-folder',
        serviceId: 'junk_cleaner',
        titleEn: `${context.emptyFolders.items.length} empty folder(s)`,
        titleAr: `${context.emptyFolders.items.length} مجلد فارغ`,
        evidence: `Measured inside the authorized folder (${context.emptyFolders.summary?.foldersScanned || 0} folders walked). No deletion or cleanup was performed.`,
        bytes: 0,
        itemCount: context.emptyFolders.items.length,
        severity: 'info',
        risk: 'info',
        scope: 'authorized-folder',
        provenance: { provider: 'Files bounded walk', mode: 'measured', scope: 'authorized-folder' },
        pathPreview: context.emptyFolders.items.slice(0, 4).map((item) => item.relative),
      });
    }

    if (context.system) {
      if (Number.isFinite(context.system.memoryUsedPercent) && context.system.memoryUsedPercent >= 80) {
        add({
          stableId: `memory:${session.id}`,
          kind: 'memory-pressure',
          serviceId: 'system_health_pulse',
          titleEn: `${round(context.system.memoryUsedPercent)}% memory in use`,
          titleAr: `${round(context.system.memoryUsedPercent)}% من الذاكرة قيد الاستخدام`,
          evidence: `${formatBytes(context.system.memoryFreeBytes)} free of ${formatBytes(context.system.memoryTotalBytes)} at scan time.`,
          bytes: 0,
          itemCount: 1,
          severity: context.system.memoryUsedPercent >= 90 ? 'high' : 'medium',
          risk: 'attention',
          scope: 'system',
          provenance: { provider: 'Win32_OperatingSystem', mode: 'measured', scope: 'system' },
          pathPreview: [],
        });
      }
      if (Number.isFinite(context.system.cpuLoadPercent) && context.system.cpuLoadPercent >= 85) {
        add({
          stableId: `cpu:${session.id}`,
          kind: 'cpu-load',
          serviceId: 'system_health_pulse',
          titleEn: `${round(context.system.cpuLoadPercent)}% CPU load`,
          titleAr: `${round(context.system.cpuLoadPercent)}% حمل المعالج`,
          evidence: `Momentary sample from ${context.system.cpuLoadSource || 'the Windows processor provider'}; this is not an average.`,
          bytes: 0,
          itemCount: 1,
          severity: 'low',
          risk: 'info',
          scope: 'system',
          provenance: { provider: 'Win32_PerfFormattedData_PerfOS_Processor', mode: 'measured', scope: 'system' },
          pathPreview: [],
        });
      }
    }

    findings.sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.bytes - a.bytes || a.titleEn.localeCompare(b.titleEn));
    return findings;
  }

  buildRecommendations(context, findings) {
    const recommendations = [];
    const add = (entry) => recommendations.push(entry);
    const verified = context.duplicates?.groups || [];
    const verifiedBytes = verified.reduce((sum, group) => sum + (Number(group.wastedBytes) || 0), 0);
    const candidates = context.inventory?.duplicateCandidates || [];
    const lowVolumes = (context.capacity?.volumes || []).filter((volume) => volume.isLowSpace);

    if (verifiedBytes > 0) {
      add({
        id: 'rec-duplicates-verified',
        titleEn: 'Review verified duplicate groups',
        titleAr: 'راجع مجموعات المكررات المتحقق منها',
        detailEn: `${formatBytes(verifiedBytes)} is held by byte-identical copies inside the authorized folder. Deletion is intentionally unavailable; review them in Duplicate Finder or Storage Atlas first.`,
        detailAr: `${formatBytes(verifiedBytes)} محتجزة بنسخ متطابقة بايتياً داخل المجلد المصرح به. الحذف غير متاح عمداً؛ راجعها في مكتشف المكررات أو أطلس التخزين أولاً.`,
        evidence: `SHA-256 verified ${verified.length} group(s) across ${context.duplicates?.summary?.filesHashed || 0} hashed file(s).`,
        serviceId: 'duplicate_finder',
        confidence: 'measured',
        risk: 'review',
        target: 'storage',
      });
    }

    if (candidates.length && !verified.length) {
      add({
        id: 'rec-duplicates-candidates',
        titleEn: 'Verify same-size duplicate candidates',
        titleAr: 'تحقق من مرشحات المكررات المتساوية بالحجم',
        detailEn: `${candidates.length} size collision group(s) were found by metadata only. Run Deep Scan or Duplicate Finder to hash them before drawing any conclusion.`,
        detailAr: `${candidates.length} مجموعة تصادم بالحجم وُجدت بالبيانات الوصفية فقط. شغّل الفحص العميق أو مكتشف المكررات لتجزئتها قبل استنتاج أي شيء.`,
        evidence: `Metadata-only candidate groups: ${candidates.length}. Content verified: 0.`,
        serviceId: 'duplicate_finder',
        confidence: 'derived',
        risk: 'info',
        target: 'scan-service:duplicate_finder',
      });
    }

    for (const volume of lowVolumes.slice(0, 3)) {
      add({
        id: `rec-low-space:${volume.id}`,
        titleEn: `Free space on ${volume.letter}`,
        titleAr: `حرّر مساحة على ${volume.letter}`,
        detailEn: `${volume.letter} has ${volume.freePercent}% free (${formatBytes(volume.freeBytes)}). Review the largest measured files and Storage Atlas before removing anything.`,
        detailAr: `${volume.letter} لديها ${volume.freePercent}% مساحة حرة (${formatBytes(volume.freeBytes)}). راجع أكبر الملفات المقيسة وأطلس التخزين قبل إزالة أي شيء.`,
        evidence: `Measured capacity: ${formatBytes(volume.freeBytes)} free of ${formatBytes(volume.totalBytes)}.`,
        serviceId: 'system_health_pulse',
        confidence: 'measured',
        risk: 'attention',
        target: 'storage',
      });
    }

    if ((context.startup?.items || []).length > 0) {
      add({
        id: 'rec-startup-review',
        titleEn: 'Review startup entries before changing anything',
        titleAr: 'راجع عناصر بدء التشغيل قبل تغيير أي شيء',
        detailEn: `${context.startup.items.length} startup entr${context.startup.items.length === 1 ? 'y is' : 'ies are'} registered. KNOuX only measured the list; enable/disable and delay are gated to Mission 09 and require explicit approval.`,
        detailAr: `${context.startup.items.length} عنصر بدء تشغيل مسجل. قاس KNOuX القائمة فقط؛ التفعيل/التعطيل والتأخير مؤجلان للمهمة 09 ويتطلبان موافقة صريحة.`,
        evidence: 'Win32_StartupCommand inventory; boot duration is not measured.',
        serviceId: 'startup_impact_check',
        confidence: 'measured',
        risk: 'info',
        target: 'startup',
      });
    }

    if ((context.privacy?.withZone || 0) > 0) {
      add({
        id: 'rec-privacy-origin',
        titleEn: 'Review downloaded files that retain their origin',
        titleAr: 'راجع الملفات المنزلة التي تحتفظ بأصلها',
        detailEn: `${context.privacy.withZone} sampled file(s) carry a Windows download-origin marker. This is metadata, not a privacy breach; browser history and cookies were not read.`,
        detailAr: `${context.privacy.withZone} ملفاً من العينة يحمل علامة أصل تنزيل Windows. هذه بيانات وصفية وليست خرقاً للخصوصية؛ لم يُقرأ سجل المتصفح أو الكوكيز.`,
        evidence: `Bounded sample: ${context.privacy.sampled} file(s); ${context.privacy.errors || 0} unreadable.`,
        serviceId: 'privacy_trace_check',
        confidence: 'measured',
        risk: 'info',
        target: 'scan-service:privacy_trace_check',
      });
    }

    if (Number.isFinite(context.system?.memoryUsedPercent) && context.system.memoryUsedPercent >= 80) {
      add({
        id: 'rec-memory-pressure',
        titleEn: 'Reduce memory pressure',
        titleAr: 'قلل ضغط الذاكرة',
        detailEn: `${round(context.system.memoryUsedPercent)}% of memory was in use during the scan. Close unused applications or postpone heavy work; KNOuX does not terminate processes.`,
        detailAr: `${round(context.system.memoryUsedPercent)}% من الذاكرة كانت قيد الاستخدام أثناء الفحص. أغلق التطبيقات غير المستخدمة أو أجل العمل الثقيل؛ لا ينهي KNOuX العمليات.`,
        evidence: 'Momentary Win32_OperatingSystem sample.',
        serviceId: 'system_health_pulse',
        confidence: 'measured',
        risk: 'attention',
        target: 'system',
      });
    }

    if (!recommendations.length) {
      add({
        id: 'rec-no-issues',
        titleEn: 'No measured issue in this scope',
        titleAr: 'لا توجد مشكلة مقيسة في هذا النطاق',
        detailEn: 'The measured providers did not produce a finding. This is not a whole-volume clean bill of health; run Deep Scan after authorizing the folder you care about.',
        detailAr: 'لم تنتج المزودات المقيسة أي نتيجة. هذا ليس براءة كاملة لوحدة التخزين؛ شغّل الفحص العميق بعد تصريح المجلد الذي يهمك.',
        evidence: 'Every enabled stage returned without a finding threshold being met.',
        serviceId: 'smart_recommendations',
        confidence: 'derived',
        risk: 'info',
        target: 'none',
      });
    }
    return recommendations;
  }

  buildBreakdown(findings) {
    const groups = [
      { id: 'large', labelEn: 'Large files', labelAr: 'ملفات كبيرة', colorHex: '#ec4899', kinds: ['large-file'] },
      { id: 'duplicates', labelEn: 'Duplicates', labelAr: 'مكررات', colorHex: '#f59e0b', kinds: ['duplicate-verified', 'duplicate-candidate'] },
      { id: 'storage', labelEn: 'Low space', labelAr: 'مساحة منخفضة', colorHex: '#a855f7', kinds: ['low-space'] },
      { id: 'startup', labelEn: 'Startup items', labelAr: 'عناصر الإقلاع', colorHex: '#8b5cf6', kinds: ['startup-item'] },
      { id: 'privacy', labelEn: 'Privacy signals', labelAr: 'إشارات الخصوصية', colorHex: '#06b6d4', kinds: ['privacy-origin'] },
      { id: 'system', labelEn: 'System pressure', labelAr: 'ضغط النظام', colorHex: '#f43f5e', kinds: ['memory-pressure', 'cpu-load'] },
      { id: 'folders', labelEn: 'Empty folders', labelAr: 'مجلدات فارغة', colorHex: '#10b981', kinds: ['empty-folder'] },
    ];
    const total = findings.length;
    return groups
      .map((group) => {
        const rows = findings.filter((finding) => group.kinds.includes(finding.kind));
        return {
          id: group.id,
          labelEn: group.labelEn,
          labelAr: group.labelAr,
          colorHex: group.colorHex,
          count: rows.length,
          bytes: rows.reduce((sum, finding) => sum + (Number(finding.bytes) || 0), 0),
          percentage: total ? round((rows.length / total) * 100, 1) : 0,
        };
      })
      .filter((group) => group.count > 0);
  }

  buildServiceResults(session, plan, context, stageState) {
    return plan.requested.map((id) => {
      const service = SERVICE_BY_ID.get(id);
      const stageRows = service.stages.map((stageId) => ({ stageId, state: stageState.get(stageId) || { status: 'pending' } }));
      const failed = stageRows.filter((row) => row.state.status === 'failed');
      const cancelled = stageRows.filter((row) => row.state.status === 'cancelled');
      const unsupported = stageRows.filter((row) => ['unsupported', 'skipped'].includes(row.state.status));
      const partial = stageRows.filter((row) => row.state.status === 'partial');
      let status = 'complete';
      if (session.cancelRequested || cancelled.length) status = 'cancelled';
      else if (failed.length) status = failed.length === stageRows.length ? 'failed' : 'partial';
      else if (unsupported.length) status = unsupported.length === stageRows.length ? 'unsupported' : 'partial';
      else if (partial.length) status = 'partial';
      const data = this.serviceData(id, session, context);
      const warnings = stageRows.flatMap((row) => row.state.warnings || []).slice(0, 12);
      return {
        serviceId: id,
        labelEn: service.labelEn,
        labelAr: service.labelAr,
        state: service.state,
        status,
        permission: 'read-only',
        mutation: 'none',
        source: service.stages.map((stageId) => STAGES[stageId].provider).join(' + '),
        startedAt: session.startedAt,
        finishedAt: session.finishedAt,
        stages: stageRows.map((row) => ({
          id: row.stageId,
          labelEn: STAGES[row.stageId].labelEn,
          labelAr: STAGES[row.stageId].labelAr,
          status: row.state.status,
        })),
        data,
        warnings,
        limitations: [service.noteEn, ...(warnings.length ? ['One or more provider stages returned partial evidence; see warnings.'] : [])],
      };
    });
  }

  serviceData(id, session, context) {
    const inventory = context.inventory;
    const base = {
      scope: session.scope,
      sourceLabel: session.sourceLabel,
      stageCount: SERVICE_BY_ID.get(id).stages.length,
      readOnly: true,
    };
    switch (id) {
      case 'quick_scan':
        return {
          ...base,
          totals: inventory?.totals || null,
          coverage: inventory?.coverage || null,
          volumes: context.capacity?.volumes || [],
          system: context.system ? {
            cpuLoadPercent: context.system.cpuLoadPercent,
            memoryUsedPercent: context.system.memoryUsedPercent,
            osCaption: context.system.osCaption,
          } : null,
          services: context.services || null,
          findings: session.findings.length,
        };
      case 'deep_scan':
        return {
          ...base,
          totals: inventory?.totals || null,
          coverage: inventory?.coverage || null,
          duplicateSummary: context.duplicates?.summary || null,
          startupCount: context.startup?.items?.length ?? null,
          appCount: context.apps?.total ?? null,
          privacySample: context.privacy ? { sampled: context.privacy.sampled, withZone: context.privacy.withZone } : null,
          emptyFolders: context.emptyFolders || null,
          findings: session.findings.length,
          options: { verifyDuplicates: true, includeSlowProviders: true },
        };
      case 'duplicate_finder':
        return {
          ...base,
          candidates: inventory?.duplicateCandidates || [],
          candidatePolicy: inventory?.duplicatePolicy || null,
          verified: context.duplicates ? {
            groups: context.duplicates.groups,
            summary: context.duplicates.summary,
            errors: context.duplicates.errors,
          } : null,
          minimumBytes: inventory?.duplicatePolicy?.minimumBytes ?? null,
        };
      case 'large_files_review': {
        const files = (inventory?.largest || []).slice(0, 40);
        return {
          ...base,
          thresholdBytes: LARGE_FILE_THRESHOLD,
          files,
          totalBytes: files.reduce((sum, file) => sum + (Number(file.size) || 0), 0),
          count: files.length,
        };
      }
      case 'junk_cleaner':
        return {
          ...base,
          emptyFolders: context.emptyFolders ? {
            items: context.emptyFolders.items,
            summary: context.emptyFolders.summary,
            partial: context.emptyFolders.partial,
            mutation: 'none',
          } : null,
          cleanupAvailable: false,
          gatedMission: '08',
          unsupported: ['System temp discovery', 'Browser cache discovery', 'Recycle Bin inspection', 'All deletion and quarantine actions'],
        };
      case 'privacy_trace_check':
        return {
          ...base,
          sample: context.privacy || null,
          browserHistoryRead: false,
          cookiesRead: false,
          clipboardRead: false,
        };
      case 'startup_impact_check':
        return {
          ...base,
          items: context.startup?.items || [],
          bySource: context.startup?.bySource || {},
          writableCount: context.startup?.writableCount ?? null,
          bootTimeMeasured: false,
          mutationAvailable: false,
          gatedMission: '09',
        };
      case 'app_health_review':
        return {
          ...base,
          total: context.apps?.total ?? null,
          publishers: context.apps?.publishers || [],
          apps: (context.apps?.apps || []).slice(0, 24),
          unusedClassification: false,
          uninstallAvailable: false,
          gatedMission: '05',
        };
      case 'system_health_pulse':
        return {
          ...base,
          system: context.system || null,
          volumes: context.capacity?.volumes || [],
          healthScore: null,
          basis: context.system?.basis || [],
        };
      case 'smart_recommendations':
        return {
          ...base,
          recommendations: session.recommendations,
          aiProviderUsed: false,
          method: 'Deterministic local rules over measured findings.',
        };
      default:
        return base;
    }
  }

  buildKpis(summary, context) {
    const measured = 'measured';
    const stagesTotal = summary.stagesTotal || 0;
    const stagesDone = summary.stagesCompleted || 0;
    const coveragePercent = stagesTotal ? Math.round((stagesDone / stagesTotal) * 100) : 0;
    const verifiedBytes = summary.verifiedReclaimableBytes || 0;
    const duplicatesMeasured = Boolean(context.duplicates);
    const privacyMeasured = Boolean(context.privacy);
    const privacyCount = summary.privacySignalCount || 0;
    const score = summary.healthScore;
    return [
      {
        id: 'coverage',
        labelEn: 'Stage coverage',
        labelAr: 'تغطية المراحل',
        value: `${coveragePercent}%`,
        subtextEn: `${stagesDone}/${stagesTotal} stages returned`,
        subtextAr: `${stagesDone}/${stagesTotal} مرحلة اكتملت`,
        accentColor: 'cyan',
        indicatorType: 'ring',
        provenance: measured,
      },
      {
        id: 'files',
        labelEn: 'Files indexed',
        labelAr: 'الملفات المفهرسة',
        value: summary.filesIndexed == null ? '—' : Number(summary.filesIndexed).toLocaleString(),
        subtextEn: summary.bytesIndexed == null ? 'No authorized folder' : formatBytes(summary.bytesIndexed),
        subtextAr: summary.bytesIndexed == null ? 'لا يوجد مجلد مصرح' : formatBytes(summary.bytesIndexed),
        accentColor: 'blue',
        indicatorType: 'stack',
        provenance: summary.filesIndexed == null ? 'unavailable' : measured,
      },
      {
        id: 'issues',
        labelEn: 'Findings',
        labelAr: 'النتائج',
        value: String(summary.findingsCount || 0),
        subtextEn: `${summary.highSeverityCount || 0} high severity`,
        subtextAr: `${summary.highSeverityCount || 0} خطورة عالية`,
        accentColor: 'red',
        indicatorType: 'alert',
        provenance: measured,
      },
      {
        id: 'space',
        labelEn: 'Duplicate bytes',
        labelAr: 'بايتات مكررة',
        value: duplicatesMeasured ? formatBytes(verifiedBytes) : '—',
        subtextEn: duplicatesMeasured
          ? `${summary.verifiedDuplicateGroups || 0} verified group(s)`
          : 'Duplicate stage not in this scope',
        subtextAr: duplicatesMeasured
          ? `${summary.verifiedDuplicateGroups || 0} مجموعة متحقق منها`
          : 'مرحلة التكرار غير مشمولة في هذا الفحص',
        accentColor: 'purple',
        indicatorType: 'disk',
        provenance: duplicatesMeasured ? measured : 'unavailable',
      },
      {
        id: 'privacy',
        labelEn: 'Origin markers',
        labelAr: 'علامات الأصل',
        value: privacyMeasured ? String(privacyCount) : '—',
        subtextEn: privacyMeasured ? `sample of ${context.privacy.sampled} file(s)` : 'privacy sample not run',
        subtextAr: privacyMeasured ? `عينة من ${context.privacy.sampled} ملف` : 'لم تُشغّل عينة الخصوصية',
        accentColor: 'teal',
        indicatorType: 'shield',
        provenance: privacyMeasured ? measured : 'unavailable',
      },
      {
        id: 'health',
        labelEn: 'Health score',
        labelAr: 'درجة الصحة',
        value: score == null ? '—' : `${score}/100`,
        subtextEn: score == null ? 'No numeric signals' : 'Measured signals',
        subtextAr: score == null ? 'لا توجد إشارات رقمية' : 'إشارات مقيسة',
        accentColor: 'green',
        indicatorType: 'sparkline',
        provenance: score == null ? 'unavailable' : 'partial',
      },
    ];
  }

  buildSummary(session) {
    const stages = session.stages || [];
    const findings = session.findings || [];
    const metrics = session.metrics || this.buildMetrics({});
    const verifiedBytes = metrics.verifiedReclaimableBytes ?? 0;
    const verifiedGroupCount = metrics.verifiedDuplicateGroups ?? 0;
    const health = this.healthScore(session);
    const scoreRow = health.score;
    return {
      id: session.id,
      mode: session.mode,
      status: session.status,
      sourceId: session.sourceId,
      sourceLabel: session.sourceLabel,
      scope: session.scope,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      progressPercent: session.progressPercent,
      progressDeterminate: session.progressDeterminate,
      stagesTotal: stages.length,
      stagesCompleted: stages.filter((stage) => ['complete', 'partial'].includes(stage.status)).length,
      stagesFailed: stages.filter((stage) => stage.status === 'failed').length,
      findingsCount: findings.length,
      highSeverityCount: findings.filter((finding) => finding.severity === 'high').length,
      filesIndexed: metrics.filesIndexed ?? null,
      bytesIndexed: metrics.bytesIndexed ?? null,
      verifiedReclaimableBytes: verifiedBytes,
      verifiedDuplicateGroups: verifiedGroupCount,
      privacySignalCount: metrics.privacySignalCount ?? null,
      healthScore: scoreRow,
      healthBasis: health.basis,
      warnings: (session.warnings || []).slice(0, 12),
      limitations: session.limitations || [],
      requestedServices: session.requestedServices || [],
    };
  }

  healthScore(session) {
    const metrics = session.metrics || this.buildMetrics({});
    const system = metrics.system
      || session.services?.find((service) => service.serviceId === 'system_health_pulse')?.data?.system
      || session.services?.find((service) => ['quick_scan', 'deep_scan'].includes(service.serviceId))?.data?.system
      || null;
    const volumes = metrics.volumes?.length
      ? metrics.volumes
      : session.services?.find((service) => service.serviceId === 'system_health_pulse')?.data?.volumes
      || session.services?.find((service) => ['quick_scan', 'deep_scan'].includes(service.serviceId))?.data?.volumes
      || [];
    const basis = [];
    let score = 100;
    let signalCount = 0;
    if (system && Number.isFinite(system.memoryUsedPercent)) {
      signalCount += 1;
      const memory = Number(system.memoryUsedPercent);
      if (memory >= 90) score -= 18;
      else if (memory >= 80) score -= 8;
      basis.push(`Memory ${round(memory)}% used → ${memory >= 90 ? '−18' : memory >= 80 ? '−8' : '0'} points.`);
    }
    if (system && Number.isFinite(system.cpuLoadPercent)) {
      signalCount += 1;
      const cpu = Number(system.cpuLoadPercent);
      if (cpu >= 90) score -= 8;
      else if (cpu >= 75) score -= 4;
      basis.push(`CPU ${round(cpu)}% momentary load → ${cpu >= 90 ? '−8' : cpu >= 75 ? '−4' : '0'} points.`);
    }
    const lowVolumes = Array.isArray(volumes) ? volumes.filter((volume) => volume.isLowSpace) : [];
    if (Array.isArray(volumes) && volumes.length) {
      signalCount += 1;
      const penalty = lowVolumes.reduce((sum, volume) => sum + (volume.freePercent < 5 ? 20 : 12), 0);
      score -= Math.min(30, penalty);
      basis.push(`${lowVolumes.length} volume(s) below 10% free → −${Math.min(30, penalty)} points.`);
    }
    if (!signalCount) return { score: null, basis: ['No numeric CPU, memory or volume signal was available.'] };
    return { score: Math.max(0, Math.min(100, Math.round(score))), basis };
  }

  async persist(session) {
    await this.init();
    const payload = {
      version: 1,
      session: this.publicSession(session),
    };
    const file = path.join(this.sessionsDir, `${session.id}.json`);
    const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
    await fsp.writeFile(temp, JSON.stringify(payload, null, 2), 'utf8');
    await fsp.rename(temp, file);

    const summary = session.summary || this.buildSummary(session);
    let history = [];
    try {
      const parsed = JSON.parse(await fsp.readFile(this.historyPath, 'utf8'));
      if (Array.isArray(parsed)) history = parsed;
    } catch {
      history = [];
    }
    history = [summary, ...history.filter((entry) => entry?.id !== summary.id)].slice(0, MAX_HISTORY);
    const historyTemp = `${this.historyPath}.${process.pid}.${crypto.randomUUID()}.tmp`;
    await fsp.writeFile(historyTemp, JSON.stringify(history, null, 2), 'utf8');
    await fsp.rename(historyTemp, this.historyPath);

    // Bound persisted full sessions; the summary history stays available.
    const entries = await fsp.readdir(this.sessionsDir).catch(() => []);
    const files = (await Promise.all(entries
      .filter((name) => name.endsWith('.json'))
      .map(async (name) => ({ name, stat: await fsp.stat(path.join(this.sessionsDir, name)).catch(() => null) }))))
      .filter((entry) => entry.stat)
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
    for (const entry of files.slice(MAX_PERSISTED_SESSIONS)) {
      await fsp.rm(path.join(this.sessionsDir, entry.name), { force: true }).catch(() => {});
    }
  }

  async status(sessionId) {
    const id = safeId(sessionId);
    if (!id) throw scanError('SCAN_SESSION_INVALID', 'A valid scan session id is required.');
    const active = this.active.get(id);
    if (active) return this.publicSession(active.session);
    try {
      const parsed = JSON.parse(await fsp.readFile(path.join(this.sessionsDir, `${id}.json`), 'utf8'));
      // v1 receipts wrap the session; tolerate an older unwrapped receipt.
      return parsed?.session || parsed;
    } catch {
      throw scanError('SCAN_SESSION_NOT_FOUND', 'The scan session is not available on this machine.');
    }
  }

  publicSession(session) {
    return {
      id: session.id,
      mode: session.mode,
      requestedServices: session.requestedServices,
      sourceId: session.sourceId,
      sourceLabel: session.sourceLabel,
      scope: session.scope,
      status: session.status,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      cancelRequested: session.cancelRequested,
      progressPercent: session.progressPercent,
      progressDeterminate: session.progressDeterminate,
      stages: session.stages,
      services: session.services,
      findings: session.findings,
      recommendations: session.recommendations,
      breakdown: session.breakdown,
      kpis: session.kpis,
      summary: session.summary || this.buildSummary(session),
      warnings: session.warnings,
      limitations: session.limitations,
      error: session.error || null,
    };
  }

  async cancel(sessionId) {
    const id = safeId(sessionId);
    if (!id) throw scanError('SCAN_SESSION_INVALID', 'A valid scan session id is required.');
    const active = this.active.get(id);
    if (!active || ['complete', 'cancelled', 'failed'].includes(active.session.status)) {
      return { cancelled: false, sessionId: id, note: 'The session is no longer running.' };
    }
    active.controller.abort();
    active.session.cancelRequested = true;
    this.emit({ type: 'scan-cancelled-requested', sessionId: id });
    return {
      cancelled: true,
      sessionId: id,
      note: 'Cancellation requested. No further stage will start; a bounded Windows provider call already in flight is allowed to return.',
    };
  }

  async history() {
    await this.init();
    try {
      const parsed = JSON.parse(await fsp.readFile(this.historyPath, 'utf8'));
      return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
    } catch {
      return [];
    }
  }

  dispose() {
    for (const entry of this.active.values()) entry.controller.abort();
    this.active.clear();
  }
}

module.exports = {
  ScanBridge,
  SERVICES,
  STAGES,
  STAGE_ORDER,
  LARGE_FILE_THRESHOLD,
  MAX_PRIVACY_SAMPLE,
};
