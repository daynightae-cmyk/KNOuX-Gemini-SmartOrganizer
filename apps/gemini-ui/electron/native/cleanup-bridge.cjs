'use strict';

/**
 * KNOuX Gemini - read-only Clean Room coordinator (Mission 08).
 *
 * One bounded, measured discovery session feeds all twelve cleanup services:
 *   - user/windows temporary files and folders
 *   - Chromium/Firefox profile caches (never cookies, history or passwords)
 *   - Windows Error Reporting, crash dumps and servicing logs
 *   - Recycle Bin metadata through the fixed Shell.Application namespace
 *   - SoftwareDistribution and WinSxS size evidence (never modified)
 *   - dormant files inside an explicitly authorized Studio source
 * plus a quarantine vault/journal reader, an immutable plan for every
 * destructive action, an evidenced reclaim estimate and a measured report.
 *
 * There is deliberately NO delete, move, rename, recycle-empty, DISM, service,
 * scheduled-task or registry write channel. Every destructive operation is
 * returned as a gate that requires separate explicit user approval. No
 * simulated deletion or invented reclaimed byte is ever produced.
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

const CONTRACT = 'cleanup.v1';
const MAX_SCAN_CANDIDATES = 400;
const MAX_TEMP_FILES = 140;
const MAX_TEMP_DIRECTORIES = 36;
const MAX_RECYCLE_ITEMS = 200;
const MAX_UNUSED_ITEMS = 200;
const MAX_VAULT_ITEMS = 200;
const MAX_PLAN_ITEMS = 120;
const MAX_JOURNAL_ENTRIES = 60;
const DEFAULT_AGE_DAYS = 1;
const DEFAULT_UNUSED_DAYS = 90;
const MEASURE_BUDGET_MS = 4500;
const STAGE_BUDGET_MS = 7000;
const MAX_TREE_ENTRIES = 12000;
const MAX_TREE_DEPTH = 10;
const MAX_SESSIONS = 4;
const RECYCLE_TIMEOUT_MS = 25000;
const PROCESS_TIMEOUT_MS = 20000;
const SAFETY_RETENTION_DAYS = 14;

const CATEGORY_KEYS = Object.freeze(['temp', 'browser', 'logs', 'recycle', 'update']);

const SERVICE_DEFINITIONS = Object.freeze([
  { id: 'cleanup-temp-preview', labelEn: 'Temporary File Preview', labelAr: 'معاينة الملفات المؤقتة', state: 'available', provider: 'Bounded user/Win temp measurement', noteEn: 'Candidate rows are measured metadata; no file is opened or changed.', noteAr: 'صفوف المرشحين بيانات وصفية مقيسة؛ لا يُفتح أي ملف أو يُغيَّر.' },
  { id: 'cleanup-temp-quarantine', labelEn: 'Quarantine Cleanup', labelAr: 'حجر التنظيف', state: 'gated', provider: 'Quarantine vault reader', noteEn: 'Stages an immutable quarantine plan; execution requires explicit approval.', noteAr: 'تُعدّ خطة حجر ثابتة؛ التنفيذ يتطلب موافقة صريحة.' },
  { id: 'cleanup-temp-undo', labelEn: 'Undo Cleanup', labelAr: 'التراجع عن التنظيف', state: 'available', provider: 'Cleanup journal reader', noteEn: 'Reads the local journal and verifies stored paths; restoration is gated.', noteAr: 'يقرأ السجل المحلي ويتحقق من المسارات المخزّنة؛ الاستعادة محجوبة.' },
  { id: 'cleanup-quarantine-list', labelEn: 'Quarantine Browser', labelAr: 'مستعرض الحجر', state: 'available', provider: 'Quarantine vault listing', noteEn: 'Lists vault entries without following links or deleting anything.', noteAr: 'يسرد عناصر الحجر دون تتبّع الروابط أو حذف أي شيء.' },
  { id: 'cleanup-estimate', labelEn: 'Reclaim Estimate', labelAr: 'تقدير المساحة المستعادة', state: 'available', provider: 'Measured candidate sizes', noteEn: 'Eligible, review and blocked space are calculated separately.', noteAr: 'تُحسب المساحات المؤهلة والمراجعة والمحجوبة بشكل منفصل.' },
  { id: 'cleanup-recycle', labelEn: 'Recycle Bin', labelAr: 'سلة المحذوفات', state: 'partial', provider: 'Shell.Application namespace 10', noteEn: 'Reads current-user Recycle Bin metadata; purging is gated.', noteAr: 'يقرأ بيانات سلة المحذوفات للمستخدم الحالي؛ الإفراغ محجوب.' },
  { id: 'cleanup-unused', labelEn: 'Unused Items', labelAr: 'العناصر غير المستخدمة', state: 'partial', provider: 'Authorized Studio source index', noteEn: 'Dormancy is based on modified time inside a user-authorized source.', noteAr: 'يعتمد الخمول على وقت التعديل داخل مصدر مصرّح به.' },
  { id: 'cleanup-update-cache', labelEn: 'Windows Update Cache', labelAr: 'ذاكرة تحديث Windows', state: 'gated', provider: 'Bounded SoftwareDistribution/WinSxS measurement', noteEn: 'Sizes only; servicing changes hand off to Windows and require elevation.', noteAr: 'أحجام فقط؛ تغييرات الخدمة تُسلَّم إلى Windows وتتطلب رفع الصلاحيات.' },
  { id: 'cleanup-browser-cache', labelEn: 'Browser Cache', labelAr: 'ذاكرة المتصفح', state: 'available', provider: 'Chromium/Firefox cache folders + process check', noteEn: 'Only cache folders are listed; cookies, history and passwords are excluded.', noteAr: 'تُسرد مجلدات الذاكرة فقط؛ ملفات تعريف الارتباط والسجل وكلمات المرور مستبعدة.' },
  { id: 'cleanup-logs', labelEn: 'Log Explorer', labelAr: 'مستكشف السجلات', state: 'partial', provider: 'WER/CrashDumps/Windows log measurement', noteEn: 'Windows-owned logs are blocked; app crash evidence is review-only.', noteAr: 'سجلات Windows المملوكة محجوبة؛ أدلة الأعطال للمراجعة فقط.' },
  { id: 'cleanup-schedule', labelEn: 'Cleanup Scheduler', labelAr: 'مجدول التنظيف', state: 'gated', provider: 'Local draft occurrence calculator', noteEn: 'Drafts the next read-only scan times; no scheduled task is created.', noteAr: 'يصوغ أوقات الفحص للقراءة فقط؛ لا تُنشأ مهمة مجدولة.' },
  { id: 'cleanup-reports', labelEn: 'Cleanup Reports', labelAr: 'تقارير التنظيف', state: 'available', provider: 'Measured session + vault + journal', noteEn: 'Builds a read-only report from measured evidence; export stays local.', noteAr: 'يبني تقريرًا للقراءة فقط من الأدلة المقيسة؛ التصدير محلي.' },
]);

const GATED_OPERATIONS = Object.freeze([
  { id: 'cleanup.execute', mission: '08', title: 'Delete or quarantine selected files', reason: 'Requires an explicitly approved immutable plan, per-target consent, a same-volume quarantine, verified postconditions, a recovery journal and a cancellation/rollback policy. No write channel exists in this read-only delivery.' },
  { id: 'cleanup.recycle.empty', mission: '08', title: 'Empty the Recycle Bin', reason: 'Permanent deletion cannot be rolled back. It requires an approved itemised plan and a separate destructive-action confirmation.' },
  { id: 'cleanup.quarantine.restore', mission: '08', title: 'Restore a quarantined item', reason: 'Restoration must verify the original path, collision state and stored integrity before moving anything.' },
  { id: 'cleanup.schedule.create', mission: '13', title: 'Create a scheduled cleanup task', reason: 'Task Scheduler creation and unattended destructive execution belong to Mission 13 after the approval-gate policy is verified.' },
  { id: 'cleanup.update.servicing', mission: '11', title: 'Run DISM/Windows Update servicing cleanup', reason: 'Component-store servicing is elevated and high-risk. Mission 08 hands off to the official Windows page and never invokes DISM.' },
]);

const PROCESS_NAMES = Object.freeze({
  chrome: ['chrome'],
  edge: ['msedge'],
  brave: ['brave'],
  firefox: ['firefox'],
});

const PERSONAL_FOLDERS = Object.freeze(['desktop', 'documents', 'downloads', 'pictures', 'music', 'videos', 'onedrive']);

function cleanupError(code, message, { retryable = false } = {}) {
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
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

function stableId(prefix, ...parts) {
  const hash = crypto.createHash('sha1').update(parts.join('\u0000')).digest('hex').slice(0, 24);
  return `${prefix}:${hash}`;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function ageDaysFrom(ms, now) {
  const value = Number(ms);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.max(0, Math.round(((now - value) / 86400000) * 10) / 10);
}

class CleanupBridge {
  constructor({
    studio = null,
    emit = null,
    userDataPath,
    tempDir = os.tmpdir(),
    env = process.env,
    homeDir = os.homedir(),
    platform = process.platform,
    now = () => new Date(),
    execFile: execFileRunner,
    listProcessNames,
    readRecycleBin,
    roots,
    vaultDir,
    journalFile,
    measureBudgetMs = MEASURE_BUDGET_MS,
    stageBudgetMs = STAGE_BUDGET_MS,
  } = {}) {
    this.studio = studio;
    this.emit = typeof emit === 'function' ? emit : () => {};
    this.userDataPath = userDataPath || path.join(os.homedir(), 'AppData', 'Roaming', 'KNOuX Gemini');
    this.tempDir = tempDir;
    this.env = env || {};
    this.homeDir = homeDir;
    this.platform = platform;
    this.now = now;
    this.execFile = execFileRunner || execFileAsync;
    this.listProcessNames = listProcessNames || null;
    this.readRecycleBin = readRecycleBin || null;
    this.roots = Array.isArray(roots) ? roots : null;
    this.vaultDir = vaultDir || path.join(this.userDataPath, 'cleanup-vault');
    this.journalFile = journalFile || path.join(this.vaultDir, 'journal.json');
    this.measureBudgetMs = Math.max(500, Number(measureBudgetMs) || MEASURE_BUDGET_MS);
    this.stageBudgetMs = Math.max(1000, Number(stageBudgetMs) || STAGE_BUDGET_MS);
    this.sessions = new Map();
    this.candidates = [];
    this.candidatesById = new Map();
    this.unusedCandidates = new Map();
    this.lastScan = null;
    this.lastProcessNames = null;
  }

  capabilities() {
    return {
      engine: 'KNOuX Clean Room read-only coordinator',
      contract: CONTRACT,
      readOnly: true,
      mutation: 'none',
      fixtureFallback: false,
      serviceCount: SERVICE_DEFINITIONS.length,
      services: SERVICE_DEFINITIONS.map((service) => ({ ...service })),
      gatedOperations: GATED_OPERATIONS.map((operation) => ({ ...operation })),
      categories: CATEGORY_KEYS.map((key) => ({ key })),
      safety: {
        eligible: 'Measured evidence matches a cache pattern and no active process owns it.',
        review: 'Cleanup may affect an app or diagnostics and requires explicit review.',
        blocked: 'Protected, elevated or servicing-owned content that this app will not delete.',
      },
      exclusions: [
        'User Documents, Desktop, Downloads, Pictures, Music and Videos are never scanned as cleanup candidates.',
        'Browser cookies, history, passwords, sessions and profile databases are excluded by path and name.',
        'Windows servicing stores and driver repositories are measured only and never modified.',
        'Reparse points, junctions and symbolic links are skipped.',
        'No file is opened, moved, renamed or deleted by this coordinator.',
      ],
      limits: {
        tempFiles: MAX_TEMP_FILES,
        recycleItems: MAX_RECYCLE_ITEMS,
        unusedItems: MAX_UNUSED_ITEMS,
        planItems: MAX_PLAN_ITEMS,
        measureBudgetMs: this.measureBudgetMs,
        treeEntries: MAX_TREE_ENTRIES,
      },
      nativeOnly: [
        'Bounded user and Windows temporary-folder measurement',
        'Chromium/Firefox cache-folder measurement with running-process checks',
        'Shell.Application Recycle Bin metadata (namespace 10)',
        'SoftwareDistribution/WinSxS size evidence',
        'Windows Error Reporting and CrashDumps measurement',
        'Authorized Studio source dormancy query',
      ],
    };
  }

  settingsTarget(target) {
    if (target === 'storage') return { target, uri: 'ms-settings:storagesense' };
    if (target === 'windowsupdate') return { target, uri: 'ms-settings:windowsupdate' };
    throw cleanupError('CLEANUP_SETTINGS_TARGET_INVALID', 'The requested Windows Settings page is not allowlisted.');
  }

  redact(value) {
    let text = String(value == null ? '' : value);
    if (!text) return null;
    const replacements = [
      [this.homeDir, '%USERPROFILE%'],
      [this.tempDir, '%TEMP%'],
      [this.env.SystemRoot || this.env.windir, '%SystemRoot%'],
      [this.env.ProgramFiles, '%ProgramFiles%'],
      [this.env['ProgramFiles(x86)'], '%ProgramFiles(x86)%'],
      [this.env.ProgramData, '%ProgramData%'],
      [this.env.LOCALAPPDATA, '%LOCALAPPDATA%'],
      [this.env.APPDATA, '%APPDATA%'],
    ].filter(([from]) => from);
    for (const [from, to] of replacements) {
      text = text.replace(new RegExp(String(from).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), to);
    }
    return text;
  }

  defaultRoots() {
    const local = this.env.LOCALAPPDATA || path.join(this.homeDir, 'AppData', 'Local');
    const roaming = this.env.APPDATA || path.join(this.homeDir, 'AppData', 'Roaming');
    const systemRoot = this.env.SystemRoot || this.env.windir || 'C:\\Windows';
    const chrome = path.join(local, 'Google', 'Chrome', 'User Data');
    const edge = path.join(local, 'Microsoft', 'Edge', 'User Data');
    const brave = path.join(local, 'BraveSoftware', 'Brave-Browser', 'User Data');
    const firefox = path.join(roaming, 'Mozilla', 'Firefox', 'Profiles');
    return [
      { id: 'temp-user', category: 'temp', path: this.tempDir, label: 'User temporary folder', policy: 'eligible-review' },
      { id: 'temp-windows', category: 'temp', path: path.join(systemRoot, 'Temp'), label: 'Windows temporary folder', policy: 'blocked-admin' },
      { id: 'browser-chrome', category: 'browser', path: chrome, label: 'Google Chrome profiles', policy: 'browser' },
      { id: 'browser-edge', category: 'browser', path: edge, label: 'Microsoft Edge profiles', policy: 'browser' },
      { id: 'browser-brave', category: 'browser', path: brave, label: 'Brave profiles', policy: 'browser' },
      { id: 'browser-firefox', category: 'browser', path: firefox, label: 'Mozilla Firefox profiles', policy: 'browser' },
      { id: 'logs-crash', category: 'logs', path: path.join(local, 'CrashDumps'), label: 'Application crash dumps', policy: 'review-logs' },
      { id: 'logs-wer-archive', category: 'logs', path: path.join(local, 'Microsoft', 'Windows', 'WER', 'ReportArchive'), label: 'Windows Error Reporting archive', policy: 'review-logs' },
      { id: 'logs-wer-queue', category: 'logs', path: path.join(local, 'Microsoft', 'Windows', 'WER', 'ReportQueue'), label: 'Windows Error Reporting queue', policy: 'review-logs' },
      { id: 'logs-cbs', category: 'logs', path: path.join(systemRoot, 'Logs', 'CBS'), label: 'Windows servicing logs', policy: 'blocked-admin' },
      { id: 'logs-dism', category: 'logs', path: path.join(systemRoot, 'Logs', 'DISM'), label: 'Windows DISM logs', policy: 'blocked-admin' },
      { id: 'update-download', category: 'update', path: path.join(systemRoot, 'SoftwareDistribution', 'Download'), label: 'Windows Update download cache', policy: 'admin-review' },
      { id: 'update-winsxs', category: 'update', path: path.join(systemRoot, 'WinSxS'), label: 'Windows component store (WinSxS)', policy: 'servicing-handoff' },
    ];
  }

  rootDefinitions() {
    const definitions = this.roots || this.defaultRoots();
    return definitions.map((definition) => ({ ...definition }));
  }

  allProcessNames() {
    if (this.listProcessNames) return this.listProcessNames();
    if (this.platform !== 'win32') return [];
    const script = "Get-Process | Select-Object -ExpandProperty ProcessName -Unique | ConvertTo-Json -Compress";
    return this.runPowerShell(script, PROCESS_TIMEOUT_MS).then((output) => {
      const parsed = parseJsonOutput(output);
      return asArray(parsed).map((name) => String(name || '').toLowerCase());
    }).catch(() => []);
  }

  defaultReadRecycleBin() {
    if (this.platform !== 'win32') {
      throw cleanupError('CLEANUP_PLATFORM_UNSUPPORTED', 'Recycle Bin metadata is only available on Windows.');
    }
    const script = [
      "$ErrorActionPreference='Stop'",
      "$rows=@()",
      "$bin=(New-Object -ComObject Shell.Application).Namespace(10)",
      "if($null -ne $bin){ foreach($item in @($bin.Items())){ if($rows.Count -ge 200){break}",
      "  $original=[string]$item.ExtendedProperty('System.Recycle.DeletedFrom')",
      "  $deleted=[string]$item.ExtendedProperty('System.DateDeleted')",
      "  $rows += [pscustomobject]@{ name=[string]$item.Name; original=$original; deletedAt=$deleted; size=[double]$item.Size }",
      "} }",
      "ConvertTo-Json -InputObject @($rows) -Compress -Depth 3",
    ].join('\n');
    return this.runPowerShell(script, RECYCLE_TIMEOUT_MS).then((output) => {
      const parsed = parseJsonOutput(output);
      return asArray(parsed);
    });
  }

  async runPowerShell(script, timeout) {
    const result = await this.execFile('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script,
    ], {
      timeout,
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
      env: { ...this.env, PSModulePath: path.join(this.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'Modules') },
    });
    return result && typeof result === 'object' && 'stdout' in result ? result.stdout : result;
  }

  async measureTree(root, { budgetMs, signal, maxEntries = MAX_TREE_ENTRIES, maxDepth = MAX_TREE_DEPTH } = {}) {
    const started = Date.now();
    const stats = {
      path: root,
      available: false,
      denied: false,
      bytes: 0,
      files: 0,
      folders: 0,
      entries: 0,
      skippedLinks: 0,
      errors: 0,
      truncated: false,
      elapsedMs: 0,
      oldestModifiedMs: null,
      newestModifiedMs: null,
    };
    let rootStat;
    try {
      rootStat = await fsp.lstat(root);
    } catch (error) {
      stats.denied = error?.code === 'EACCES' || error?.code === 'EPERM';
      stats.errorCode = error?.code || 'CLEANUP_PATH_UNAVAILABLE';
      stats.elapsedMs = Date.now() - started;
      return stats;
    }
    if (!rootStat.isDirectory()) {
      stats.errorCode = 'CLEANUP_NOT_A_DIRECTORY';
      stats.elapsedMs = Date.now() - started;
      return stats;
    }
    stats.available = true;
    const stack = [{ dir: root, depth: 0 }];
    while (stack.length) {
      if (signal?.aborted || Date.now() - started > budgetMs || stats.entries >= maxEntries) {
        stats.truncated = true;
        break;
      }
      const current = stack.pop();
      let entries;
      try {
        entries = await fsp.readdir(current.dir, { withFileTypes: true });
      } catch (error) {
        stats.errors += 1;
        if (error?.code === 'EACCES' || error?.code === 'EPERM') stats.denied = true;
        continue;
      }
      for (const entry of entries) {
        if (signal?.aborted || Date.now() - started > budgetMs || stats.entries >= maxEntries) {
          stats.truncated = true;
          break;
        }
        if (entry.isSymbolicLink()) {
          stats.skippedLinks += 1;
          continue;
        }
        const fullPath = path.join(current.dir, entry.name);
        let itemStat;
        try {
          itemStat = await fsp.lstat(fullPath);
        } catch {
          stats.errors += 1;
          continue;
        }
        if (itemStat.isSymbolicLink()) {
          stats.skippedLinks += 1;
          continue;
        }
        if (itemStat.mtimeMs) {
          stats.oldestModifiedMs = stats.oldestModifiedMs == null ? itemStat.mtimeMs : Math.min(stats.oldestModifiedMs, itemStat.mtimeMs);
          stats.newestModifiedMs = stats.newestModifiedMs == null ? itemStat.mtimeMs : Math.max(stats.newestModifiedMs, itemStat.mtimeMs);
        }
        stats.entries += 1;
        if (itemStat.isDirectory()) {
          stats.folders += 1;
          if (current.depth + 1 <= maxDepth) stack.push({ dir: fullPath, depth: current.depth + 1 });
        } else if (itemStat.isFile()) {
          stats.files += 1;
          stats.bytes += itemStat.size;
        }
      }
    }
    stats.elapsedMs = Date.now() - started;
    return stats;
  }

  createCandidate({
    idKey,
    name,
    pathValue,
    category,
    source,
    safety,
    risk,
    sizeBytes,
    fileCount,
    folderCount,
    modifiedAt,
    reasons,
    action,
    permission,
    recoverable,
    provider,
    evidence = [],
    active = false,
    virtual = false,
  }) {
    const nowMs = this.now().getTime();
    const modifiedMs = modifiedAt == null ? null : new Date(modifiedAt).getTime();
    return {
      id: stableId('cln', idKey, pathValue || name),
      name: clip(name, 120),
      path: this.redact(pathValue) || null,
      category,
      source: clip(source, 80),
      safety,
      risk,
      sizeBytes: safeNumber(sizeBytes),
      fileCount: safeNumber(fileCount),
      folderCount: safeNumber(folderCount),
      modifiedAt: modifiedMs && Number.isFinite(modifiedMs) ? iso(modifiedMs) : null,
      ageDays: modifiedMs && Number.isFinite(modifiedMs) ? ageDaysFrom(modifiedMs, nowMs) : null,
      reasons: asArray(reasons).map((reason) => clip(reason, 180)).slice(0, 8),
      action,
      permission,
      recoverable,
      provider,
      active,
      virtual,
      evidence: asArray(evidence).map((item) => clip(item, 220)).slice(0, 8),
    };
  }

  async scanTemp(root, { ageDays, signal, deadline }) {
    const candidates = [];
    const warnings = [];
    const cutoff = this.now().getTime() - ageDays * 86400000;
    let entries = [];
    try {
      entries = await fsp.readdir(root.path, { withFileTypes: true });
    } catch (error) {
      warnings.push(`${root.label}: ${error?.code === 'EACCES' || error?.code === 'EPERM' ? 'access was denied' : 'could not be read'}.`);
      return { candidates, warnings, scanned: false };
    }
    const files = [];
    const directories = [];
    for (const entry of entries) {
      if (entry.isSymbolicLink() || entry.name === '$RECYCLE.BIN' || entry.name === 'System Volume Information') continue;
      const fullPath = path.join(root.path, entry.name);
      let stat;
      try {
        stat = await fsp.lstat(fullPath);
      } catch {
        continue;
      }
      if (stat.isSymbolicLink()) continue;
      if (stat.mtimeMs > cutoff) continue;
      if (stat.isFile()) files.push({ entry, fullPath, stat });
      else if (stat.isDirectory() && directories.length < MAX_TEMP_DIRECTORIES) directories.push({ entry, fullPath, stat });
    }
    files.sort((a, b) => b.stat.size - a.stat.size);
    for (const file of files.slice(0, MAX_TEMP_FILES)) {
      const age = ageDaysFrom(file.stat.mtimeMs, this.now().getTime());
      const older = age != null && age >= 7;
      const isWindows = root.policy === 'blocked-admin';
      const safety = isWindows ? 'blocked' : older ? 'eligible' : 'review';
      const risk = isWindows ? 'blocked' : older ? 'low' : 'medium';
      candidates.push(this.createCandidate({
        idKey: 'temp-file',
        name: file.entry.name,
        pathValue: file.fullPath,
        category: 'temp',
        source: root.label,
        safety,
        risk,
        sizeBytes: file.stat.size,
        fileCount: 1,
        folderCount: 0,
        modifiedAt: file.stat.mtimeMs,
        reasons: isWindows
          ? ['Windows-owned temporary root.', 'Modification requires elevation; this app will not delete it.']
          : older
            ? ['Temporary file is older than 7 days.', 'No active process ownership was verified, so this stays a review step.']
            : ['Temporary file is newer than the safety threshold.', 'It may still be open by an application.'],
        action: isWindows ? 'handoff' : 'quarantine',
        permission: isWindows ? 'Administrator + servicing approval' : 'Standard user',
        recoverable: isWindows ? 'No app-managed recovery; Windows owns the root.' : 'Quarantine can preserve the file before any deletion.',
        provider: 'Bounded filesystem metadata',
        evidence: [`Modified ${age == null ? 'time unavailable' : `${age} day(s) ago`}.`, 'Metadata only; content was not read.'],
      }));
    }
    if (directories.length) {
      let measured = { bytes: 0, files: 0, folders: 0, truncated: false, denied: false, errors: 0, skippedLinks: 0, newestModifiedMs: null };
      for (const dir of directories) {
        if (signal?.aborted || Date.now() > deadline) {
          measured.truncated = true;
          break;
        }
        const part = await this.measureTree(dir.fullPath, {
          budgetMs: Math.max(300, Math.min(this.measureBudgetMs, deadline - Date.now())),
          signal,
          maxEntries: 2500,
          maxDepth: 6,
        });
        measured.bytes += part.bytes;
        measured.files += part.files;
        measured.folders += part.folders;
        measured.truncated = measured.truncated || part.truncated;
        measured.denied = measured.denied || part.denied;
        measured.errors += part.errors;
        measured.skippedLinks += part.skippedLinks;
        if (part.newestModifiedMs) {
          measured.newestModifiedMs = measured.newestModifiedMs == null
            ? part.newestModifiedMs
            : Math.max(measured.newestModifiedMs, part.newestModifiedMs);
        }
      }
      const isWindows = root.policy === 'blocked-admin';
      candidates.push(this.createCandidate({
        idKey: 'temp-folders',
        name: `${directories.length} temporary folder(s)`,
        pathValue: root.path,
        category: 'temp',
        source: root.label,
        safety: isWindows ? 'blocked' : 'review',
        risk: isWindows ? 'blocked' : 'medium',
        sizeBytes: measured.bytes,
        fileCount: measured.files,
        folderCount: measured.folders,
        modifiedAt: measured.newestModifiedMs,
        reasons: [
          'Aggregated temporary subfolders; contents were not opened.',
          isWindows ? 'Windows-owned root; blocked from app cleanup.' : 'Some folders may belong to active applications.',
        ],
        action: isWindows ? 'handoff' : 'quarantine',
        permission: isWindows ? 'Administrator + servicing approval' : 'Standard user',
        recoverable: 'Folder contents are not individually enumerated; review is mandatory.',
        provider: 'Bounded filesystem metadata',
        evidence: [`${measured.entries || measured.files} file(s) measured.`, measured.truncated ? 'Measurement hit its hard budget; reported bytes are a lower bound.' : 'Measurement completed inside its budget.'],
      }));
    }
    return { candidates, warnings, scanned: true };
  }

  browserProfileDirectories(root) {
    const profiles = [];
    let entries = [];
    try {
      entries = fs.readdirSync(root.path, { withFileTypes: true });
    } catch {
      return profiles;
    }
    if (root.id === 'browser-firefox') {
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
        const profilePath = path.join(root.path, entry.name);
        profiles.push({ profile: entry.name, cachePaths: [path.join(profilePath, 'cache2')] });
      }
      return profiles.slice(0, 8);
    }
    const cacheNames = ['Cache', 'Code Cache', 'GPUCache', 'Service Worker\\CacheStorage'];
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      if (entry.name === 'Default' || /^Profile \d+$/i.test(entry.name) || entry.name === 'Guest Profile') {
        const profilePath = path.join(root.path, entry.name);
        profiles.push({ profile: entry.name, cachePaths: cacheNames.map((name) => path.join(profilePath, name)) });
      }
    }
    return profiles.slice(0, 8);
  }

  async scanBrowser(root, { signal, deadline, processNames }) {
    const candidates = [];
    const warnings = [];
    const processes = new Set(asArray(processNames).map((name) => String(name || '').replace(/\.exe$/i, '').toLowerCase()));
    const browserKey = root.id.replace(/^browser-/, '');
    const active = (PROCESS_NAMES[browserKey] || []).some((name) => processes.has(name));
    const profiles = this.browserProfileDirectories(root);
    if (!profiles.length) {
      warnings.push(`${root.label}: no cache profile was found.`);
      return { candidates, warnings, scanned: false };
    }
    for (const profile of profiles) {
      if (signal?.aborted || Date.now() > deadline) break;
      let bytes = 0;
      let files = 0;
      let folders = 0;
      let newest = null;
      let truncated = false;
      let denied = false;
      let measuredPaths = 0;
      for (const cachePath of profile.cachePaths) {
        let exists = false;
        try {
          exists = fs.statSync(cachePath).isDirectory();
        } catch {
          exists = false;
        }
        if (!exists) continue;
        measuredPaths += 1;
        const part = await this.measureTree(cachePath, {
          budgetMs: Math.max(250, Math.min(1800, deadline - Date.now())),
          signal,
          maxEntries: 3500,
          maxDepth: 7,
        });
        bytes += part.bytes;
        files += part.files;
        folders += part.folders;
        truncated = truncated || part.truncated;
        denied = denied || part.denied;
        if (part.newestModifiedMs) newest = newest == null ? part.newestModifiedMs : Math.max(newest, part.newestModifiedMs);
      }
      if (!measuredPaths) {
        warnings.push(`${root.label} / ${profile.profile}: cache folders are absent.`);
        continue;
      }
      candidates.push(this.createCandidate({
        idKey: `browser-${browserKey}`,
        name: `${root.label} - ${profile.profile}`,
        pathValue: path.join(root.path, profile.profile),
        category: 'browser',
        source: root.label,
        safety: active ? 'blocked' : 'eligible',
        risk: active ? 'high' : 'low',
        sizeBytes: bytes,
        fileCount: files,
        folderCount: folders,
        modifiedAt: newest,
        reasons: active
          ? ['The browser process is running; its cache may be locked or rewritten.', 'Close the browser before considering any cache action.']
          : ['Only cache subfolders were measured.', 'Cookies, history, saved passwords and profile databases are excluded.'],
        action: active ? 'review' : 'quarantine',
        permission: 'Standard user',
        recoverable: 'Browsers rebuild caches automatically; logins and settings are out of scope.',
        provider: 'Chromium/Firefox cache folders + process list',
        active,
        evidence: [
          active ? 'Browser process detected.' : 'No matching browser process was detected.',
          `${measuredPaths} cache folder(s) measured; cookies and credentials were not read.`,
          truncated ? 'Measurement hit its hard budget; bytes are a lower bound.' : 'Measurement completed inside its budget.',
        ],
      }));
    }
    return { candidates, warnings, scanned: true };
  }

  async scanLogs(root, { signal, deadline, ageDays }) {
    const warnings = [];
    const measured = await this.measureTree(root.path, {
      budgetMs: Math.max(300, Math.min(this.measureBudgetMs, deadline - Date.now())),
      signal,
      maxEntries: 4000,
      maxDepth: 6,
    });
    if (!measured.available) {
      if (measured.denied) warnings.push(`${root.label}: access was denied.`);
      return { candidates: [], warnings, scanned: false };
    }
    const age = measured.newestModifiedMs ? ageDaysFrom(measured.newestModifiedMs, this.now().getTime()) : null;
    const windowsOwned = root.policy === 'blocked-admin';
    const oldEnough = age != null && age >= Math.max(7, ageDays);
    return {
      candidates: [this.createCandidate({
        idKey: root.id,
        name: root.label,
        pathValue: root.path,
        category: 'logs',
        source: root.label,
        safety: windowsOwned ? 'blocked' : oldEnough ? 'eligible' : 'review',
        risk: windowsOwned ? 'high' : oldEnough ? 'low' : 'medium',
        sizeBytes: measured.bytes,
        fileCount: measured.files,
        folderCount: measured.folders,
        modifiedAt: measured.newestModifiedMs,
        reasons: windowsOwned
          ? ['Windows servicing log root.', 'It is blocked from application cleanup and requires elevated Windows tooling.']
          : ['Diagnostic logs may be needed to investigate a crash.', 'Review is required before retention changes.'],
        action: windowsOwned ? 'handoff' : 'quarantine',
        permission: windowsOwned ? 'Administrator' : 'Standard user',
        recoverable: windowsOwned ? 'No app-managed recovery.' : 'Quarantine can preserve log files.',
        provider: 'Bounded filesystem metadata',
        evidence: [
          `${measured.files} file(s) measured.`,
          measured.truncated ? 'Measurement hit its hard budget; bytes are a lower bound.' : 'Measurement completed inside its budget.',
          measured.denied ? 'Part of the tree was access-denied.' : 'All encountered entries were readable.',
        ],
      })],
      warnings,
      scanned: true,
    };
  }

  async scanUpdate(root, { signal, deadline }) {
    const warnings = [];
    const measured = await this.measureTree(root.path, {
      budgetMs: Math.max(400, Math.min(this.stageBudgetMs, deadline - Date.now())),
      signal,
      maxEntries: 8000,
      maxDepth: 7,
    });
    if (!measured.available) {
      if (measured.denied) warnings.push(`${root.label}: access was denied; an elevated measurement would be required.`);
      return { candidates: [], warnings, scanned: false };
    }
    const servicing = root.policy === 'servicing-handoff';
    return {
      candidates: [this.createCandidate({
        idKey: root.id,
        name: root.label,
        pathValue: root.path,
        category: 'update',
        source: 'Windows servicing',
        safety: servicing ? 'blocked' : 'review',
        risk: servicing ? 'blocked' : 'high',
        sizeBytes: measured.bytes,
        fileCount: measured.files,
        folderCount: measured.folders,
        modifiedAt: measured.newestModifiedMs,
        reasons: servicing
          ? ['WinSxS is the Windows component store.', 'Direct deletion is unsupported and can break servicing.']
          : ['The Windows Update download cache is owned by Windows Update.', 'Stopping services or elevated servicing is required.'],
        action: 'handoff',
        permission: 'Administrator + Windows servicing',
        recoverable: servicing ? 'Only through supported DISM servicing.' : 'Windows can download required updates again.',
        provider: 'Bounded filesystem metadata',
        evidence: [
          `${measured.files} file(s) measured.`,
          measured.truncated ? 'Measurement hit its hard budget; bytes are a lower bound.' : 'Measurement completed inside its budget.',
          'No DISM, service or Windows Update command was executed.',
        ],
      })],
      warnings,
      scanned: true,
    };
  }

  async scanRecycle({ signal }) {
    const warnings = [];
    let items;
    try {
      items = await (this.readRecycleBin || (() => this.defaultReadRecycleBin()))();
    } catch (error) {
      warnings.push(`Recycle Bin metadata could not be read: ${clip(error?.message || error, 160)}`);
      return { candidates: [], warnings, items: [], scanned: false };
    }
    const normalized = asArray(items).slice(0, MAX_RECYCLE_ITEMS).map((item) => {
      const original = String(item.original || item.originalPath || '');
      const size = safeNumber(item.size) || 0;
      const deletedMs = parseDateMs(item.deletedAt || item.deleted || item.dateDeleted);
      const volume = /^[A-Za-z]:/.exec(original)?.[0]?.toUpperCase() || 'Unknown volume';
      return {
        id: stableId('recycle', original, item.name || '', String(deletedMs || '')),
        name: clip(item.name || path.basename(original) || 'Recycle Bin item', 120),
        originalPath: this.redact(original) || null,
        volume,
        sizeBytes: size,
        deletedAt: deletedMs ? iso(deletedMs) : null,
        ageDays: deletedMs ? ageDaysFrom(deletedMs, this.now().getTime()) : null,
      };
    });
    if (signal?.aborted) return { candidates: [], warnings, items: normalized, scanned: false };
    const byVolume = new Map();
    for (const item of normalized) {
      const entry = byVolume.get(item.volume) || { count: 0, bytes: 0, latest: null };
      entry.count += 1;
      entry.bytes += item.sizeBytes;
      if (item.deletedAt) entry.latest = entry.latest == null ? item.deletedAt : (new Date(item.deletedAt) > new Date(entry.latest) ? item.deletedAt : entry.latest);
      byVolume.set(item.volume, entry);
    }
    const candidates = Array.from(byVolume.entries()).map(([volume, entry]) => this.createCandidate({
      idKey: `recycle-${volume}`,
      name: `Recycle Bin - ${volume}`,
      pathValue: `${volume}\\$Recycle.Bin`,
      category: 'recycle',
      source: 'Recycle Bin',
      safety: 'review',
      risk: 'medium',
      sizeBytes: entry.bytes,
      fileCount: entry.count,
      folderCount: 0,
      modifiedAt: entry.latest,
      reasons: [
        'Items were already discarded by a user.',
        'Emptying the Recycle Bin is permanent and cannot be quarantined.',
      ],
      action: 'review',
      permission: 'Standard user',
      recoverable: 'No; permanent deletion. An itemised approval is mandatory.',
      provider: 'Shell.Application namespace 10',
      virtual: true,
      evidence: [`${entry.count} item(s) in the current-user Recycle Bin.`, 'Original paths and deletion times are shown in the Recycle Bin service.'],
    }));
    if (!normalized.length) warnings.push('The current-user Recycle Bin is empty or returned no metadata.');
    return { candidates, warnings, items: normalized, scanned: true };
  }

  async start(request = {}) {
    const requested = Array.isArray(request.categories) && request.categories.length
      ? request.categories.filter((key) => CATEGORY_KEYS.includes(key))
      : [...CATEGORY_KEYS];
    if (!requested.length) throw cleanupError('CLEANUP_CATEGORY_INVALID', 'At least one cleanup category is required.');
    const ageDays = clamp(request.ageDays, 0, 3650, DEFAULT_AGE_DAYS);
    const sessionId = crypto.randomUUID();
    const startedAt = this.now().toISOString();
    const session = {
      id: sessionId,
      status: 'running',
      mode: 'measured-read-only',
      requestedCategories: requested,
      categories: requested.map((key) => ({ key, status: 'pending', candidates: 0, warnings: [] })),
      ageDays,
      startedAt,
      finishedAt: null,
      cancelRequested: false,
      progressPercent: 0,
      candidates: [],
      warnings: [],
      recycleItems: [],
      coverage: {
        rootsScanned: 0,
        rootsUnavailable: 0,
        filesMeasured: 0,
        foldersMeasured: 0,
        bytesMeasured: 0,
        truncated: false,
        skippedLinks: 0,
        errors: 0,
      },
      controller: new AbortController(),
    };
    this.sessions.set(sessionId, session);
    while (this.sessions.size > MAX_SESSIONS) {
      const oldest = this.sessions.keys().next().value;
      if (oldest === sessionId) break;
      this.sessions.delete(oldest);
    }
    this.run(session).catch((error) => {
      session.status = 'failed';
      session.error = clip(error?.message || error, 240);
      session.finishedAt = this.now().toISOString();
      this.emitProgress(session);
    });
    return this.publicSession(session, { includeCandidates: false });
  }

  async run(session) {
    const deadline = Date.now() + this.stageBudgetMs * session.requestedCategories.length;
    const roots = this.rootDefinitions();
    const processNames = session.requestedCategories.includes('browser') ? await this.allProcessNames() : [];
    this.lastProcessNames = processNames;
    let completed = 0;
    for (const key of session.requestedCategories) {
      const stage = session.categories.find((entry) => entry.key === key);
      if (session.controller.signal.aborted || session.cancelRequested) {
        stage.status = 'cancelled';
        break;
      }
      stage.status = 'running';
      stage.startedAt = this.now().toISOString();
      this.emitProgress(session);
      const stageDeadline = Math.min(deadline, Date.now() + this.stageBudgetMs);
      try {
        let result;
        if (key === 'recycle') {
          result = await this.scanRecycle({ signal: session.controller.signal });
          session.recycleItems.push(...(result.items || []));
        } else {
          const stageRoots = roots.filter((root) => root.category === key);
          const collected = [];
          const warnings = [];
          for (const root of stageRoots) {
            if (session.controller.signal.aborted || Date.now() > stageDeadline) break;
            if (key === 'temp') result = await this.scanTemp(root, { ageDays: session.ageDays, signal: session.controller.signal, deadline: stageDeadline });
            else if (key === 'browser') result = await this.scanBrowser(root, { signal: session.controller.signal, deadline: stageDeadline, processNames });
            else if (key === 'logs') result = await this.scanLogs(root, { signal: session.controller.signal, deadline: stageDeadline, ageDays: session.ageDays });
            else if (key === 'update') result = await this.scanUpdate(root, { signal: session.controller.signal, deadline: stageDeadline });
            else result = { candidates: [], warnings: [], scanned: false };
            collected.push(...(result.candidates || []));
            warnings.push(...(result.warnings || []));
            if (result.scanned) session.coverage.rootsScanned += 1;
            else session.coverage.rootsUnavailable += 1;
          }
          result = { candidates: collected, warnings, scanned: collected.length > 0 };
        }
        stage.candidates = result.candidates.length;
        stage.warnings = result.warnings || [];
        stage.status = 'complete';
        stage.finishedAt = this.now().toISOString();
        session.warnings.push(...(result.warnings || []));
        session.candidates.push(...result.candidates);
        for (const candidate of result.candidates) {
          session.coverage.filesMeasured += candidate.fileCount || 0;
          session.coverage.foldersMeasured += candidate.folderCount || 0;
          session.coverage.bytesMeasured += candidate.sizeBytes || 0;
        }
        if (session.candidates.length > MAX_SCAN_CANDIDATES) {
          session.candidates = session.candidates
            .sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0))
            .slice(0, MAX_SCAN_CANDIDATES);
          session.coverage.truncated = true;
        }
      } catch (error) {
        stage.status = 'failed';
        stage.error = clip(error?.message || error, 200);
        stage.finishedAt = this.now().toISOString();
        session.warnings.push(`${key}: ${stage.error}`);
      }
      completed += 1;
      session.progressPercent = Math.round((completed / session.requestedCategories.length) * 100);
      this.emitProgress(session);
    }
    if (session.cancelRequested || session.controller.signal.aborted) {
      session.status = 'cancelled';
    } else if (session.categories.every((stage) => stage.status === 'failed')) {
      session.status = 'failed';
    } else {
      session.status = 'complete';
    }
    session.finishedAt = this.now().toISOString();
    session.candidates.sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0));
    session.candidateIndex = new Map(session.candidates.map((candidate) => [candidate.id, candidate]));
    if (session.status === 'complete') {
      this.candidates = session.candidates.map((candidate) => ({ ...candidate }));
      this.candidatesById = new Map(this.candidates.map((candidate) => [candidate.id, candidate]));
      this.lastScan = {
        sessionId: session.id,
        observedAt: session.finishedAt,
        ageDays: session.ageDays,
        categories: session.categories.map((stage) => stage.key),
        candidates: this.candidates,
        recycleItems: session.recycleItems,
        coverage: session.coverage,
        warnings: session.warnings,
      };
    }
    session.candidateIndex = null;
    this.emitProgress(session);
  }

  emitProgress(session) {
    if (!this.emit) return;
    try {
      this.emit({
        type: 'cleanup-progress',
        sessionId: session.id,
        status: session.status,
        progressPercent: session.progressPercent,
        stage: session.categories.find((stage) => stage.status === 'running')?.key || null,
        candidates: session.candidates.length,
        warnings: session.warnings.slice(-3),
      });
    } catch {
      // A renderer event failure must never fail the native scan.
    }
  }

  publicSession(session, { includeCandidates = false } = {}) {
    return {
      id: session.id,
      status: session.status,
      mode: session.mode,
      requestedCategories: [...session.requestedCategories],
      ageDays: session.ageDays,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      progressPercent: session.progressPercent,
      cancelRequested: session.cancelRequested,
      categories: session.categories.map((stage) => ({ ...stage, warnings: [...stage.warnings] })),
      warnings: session.warnings.slice(0, 40),
      coverage: { ...session.coverage },
      ...(includeCandidates ? { candidates: session.candidates.map((candidate) => ({ ...candidate })) } : {}),
      ...(session.status === 'complete' ? { candidates: session.candidates.map((candidate) => ({ ...candidate })) } : {}),
      candidateCount: session.candidates.length,
      estimatedEligibleBytes: session.candidates.filter((candidate) => candidate.safety === 'eligible').reduce((sum, candidate) => sum + (candidate.sizeBytes || 0), 0),
      estimatedReviewBytes: session.candidates.filter((candidate) => candidate.safety === 'review').reduce((sum, candidate) => sum + (candidate.sizeBytes || 0), 0),
      estimatedBlockedBytes: session.candidates.filter((candidate) => candidate.safety === 'blocked').reduce((sum, candidate) => sum + (candidate.sizeBytes || 0), 0),
      error: session.error || null,
    };
  }

  status(sessionId) {
    const session = this.sessions.get(String(sessionId || ''));
    if (!session) throw cleanupError('CLEANUP_SESSION_NOT_FOUND', 'The cleanup scan session is no longer available.');
    return this.publicSession(session);
  }

  cancel(sessionId) {
    const session = this.sessions.get(String(sessionId || ''));
    if (!session) throw cleanupError('CLEANUP_SESSION_NOT_FOUND', 'The cleanup scan session is no longer available.');
    if (session.status !== 'running') return { cancelled: false, status: session.status, sessionId: session.id };
    session.cancelRequested = true;
    session.controller.abort();
    session.status = 'cancelled';
    session.finishedAt = this.now().toISOString();
    for (const stage of session.categories) {
      if (stage.status === 'running' || stage.status === 'pending') {
        stage.status = 'cancelled';
        stage.finishedAt = session.finishedAt;
      }
    }
    this.emitProgress(session);
    return { cancelled: true, status: session.status, sessionId: session.id };
  }

  inventory() {
    if (!this.lastScan) {
      return {
        observedAt: null,
        status: 'unscanned',
        readOnly: true,
        mutation: 'none',
        candidates: [],
        summary: null,
        coverage: null,
        recycleItems: [],
        warnings: ['Run a measured discovery to read eligible cleanup evidence.'],
      };
    }
    return {
      observedAt: this.lastScan.observedAt,
      status: 'complete',
      readOnly: true,
      mutation: 'none',
      candidates: this.lastScan.candidates.map((candidate) => ({ ...candidate })),
      summary: this.summaryFor(this.lastScan.candidates),
      coverage: { ...this.lastScan.coverage },
      recycleItems: this.lastScan.recycleItems.map((item) => ({ ...item })),
      warnings: [...this.lastScan.warnings],
    };
  }

  summaryFor(candidates) {
    const summary = {
      candidates: candidates.length,
      eligibleBytes: 0,
      reviewBytes: 0,
      blockedBytes: 0,
      eligibleCount: 0,
      reviewCount: 0,
      blockedCount: 0,
      categories: {},
    };
    for (const candidate of candidates) {
      const bytes = candidate.sizeBytes || 0;
      if (candidate.safety === 'eligible') { summary.eligibleBytes += bytes; summary.eligibleCount += 1; }
      else if (candidate.safety === 'review') { summary.reviewBytes += bytes; summary.reviewCount += 1; }
      else { summary.blockedBytes += bytes; summary.blockedCount += 1; }
      const entry = summary.categories[candidate.category] || { count: 0, bytes: 0, eligibleBytes: 0, reviewBytes: 0, blockedBytes: 0 };
      entry.count += 1;
      entry.bytes += bytes;
      entry[`${candidate.safety}Bytes`] = (entry[`${candidate.safety}Bytes`] || 0) + bytes;
      summary.categories[candidate.category] = entry;
    }
    return summary;
  }

  estimate() {
    const candidates = this.lastScan?.candidates || [];
    return {
      observedAt: this.lastScan?.observedAt || null,
      status: this.lastScan ? 'complete' : 'unscanned',
      readOnly: true,
      mutation: 'none',
      summary: this.summaryFor(candidates),
      categories: CATEGORY_KEYS.map((key) => ({
        key,
        ...(this.summaryFor(candidates).categories[key] || { count: 0, bytes: 0, eligibleBytes: 0, reviewBytes: 0, blockedBytes: 0 }),
      })),
      note: 'Eligible is a deterministic safety classification over measured sizes, not a promise of reclaimed bytes.',
    };
  }

  async readVault() {
    const base = {
      vaultPath: this.redact(this.vaultDir),
      exists: false,
      retentionDays: SAFETY_RETENTION_DAYS,
      items: [],
      totalBytes: 0,
      warnings: [],
      readOnly: true,
      mutation: 'none',
    };
    let entries;
    try {
      const stat = await fsp.lstat(this.vaultDir);
      if (!stat.isDirectory()) return base;
      base.exists = true;
      entries = await fsp.readdir(this.vaultDir, { withFileTypes: true });
    } catch (error) {
      if (error?.code === 'ENOENT') return base;
      base.warnings.push(`The quarantine vault could not be read (${error?.code || 'unknown'}).`);
      return base;
    }
    for (const entry of entries.slice(0, MAX_VAULT_ITEMS)) {
      if (entry.name === 'journal.json' || entry.isSymbolicLink()) continue;
      const fullPath = path.join(this.vaultDir, entry.name);
      try {
        const stat = await fsp.lstat(fullPath);
        if (stat.isSymbolicLink()) continue;
        const item = {
          id: stableId('vault', entry.name),
          name: clip(entry.name, 140),
          kind: stat.isDirectory() ? 'folder' : 'file',
          sizeBytes: stat.isDirectory() ? null : stat.size,
          quarantinedAt: iso(stat.birthtimeMs || stat.ctimeMs || stat.mtimeMs),
          originalPath: null,
          journalId: null,
        };
        base.items.push(item);
        base.totalBytes += stat.isFile() ? stat.size : 0;
      } catch {
        base.warnings.push(`A vault entry could not be inspected: ${clip(entry.name, 80)}`);
      }
    }
    if (!base.items.length) base.warnings.push('The quarantine vault is empty. No cleanup has been executed.');
    return base;
  }

  async journal() {
    const empty = { entries: [], path: this.redact(this.journalFile), exists: false, readOnly: true, mutation: 'none', warnings: [] };
    let raw;
    try {
      raw = await fsp.readFile(this.journalFile, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') return empty;
      return { ...empty, warnings: [`The cleanup journal could not be read (${error?.code || 'unknown'}).`] };
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ...empty, exists: true, warnings: ['The cleanup journal is not valid JSON; nothing was executed by this section.'] };
    }
    const entries = asArray(parsed).slice(0, MAX_JOURNAL_ENTRIES).map((entry, index) => ({
      id: typeof entry?.id === 'string' ? clip(entry.id, 80) : `journal-${index + 1}`,
      createdAt: entry?.createdAt ? iso(entry.createdAt) : null,
      operation: clip(entry?.operation || 'unknown', 40),
      status: clip(entry?.status || 'unknown', 40),
      itemCount: safeNumber(entry?.itemCount),
      bytes: safeNumber(entry?.bytes),
      vaultPath: entry?.vaultPath ? this.redact(clip(entry.vaultPath, 260)) : null,
      verified: entry?.verified === true,
      recovery: clip(entry?.recovery || 'unavailable', 80),
    }));
    return { ...empty, exists: true, entries, warnings: [] };
  }

  async quarantine() {
    const [vault, journal] = await Promise.all([this.readVault(), this.journal()]);
    return {
      observedAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      vault,
      journal,
      execution: {
        available: false,
        gate: 'Mission 08 destructive-action approval',
        reason: 'No quarantine write channel exists. Staging produces a reviewable plan only.',
      },
    };
  }

  async unused(request = {}) {
    const ageDays = clamp(request.ageDays, 7, 3650, DEFAULT_UNUSED_DAYS);
    const limit = clamp(request.limit, 1, MAX_UNUSED_ITEMS, 120);
    const empty = {
      observedAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      ageDays,
      source: null,
      status: 'unavailable',
      items: [],
      warnings: [],
      atimeNote: 'Windows last-access timestamps are commonly disabled; dormancy uses modified time only.',
    };
    if (!this.studio || typeof this.studio.listSources !== 'function') {
      return { ...empty, warnings: ['The Studio source provider is not available in this runtime.'] };
    }
    const sources = await this.studio.listSources();
    if (!sources.length) {
      return { ...empty, status: 'needs-source', warnings: ['Authorize a source folder in Organization Studio before measuring dormant files.'] };
    }
    const sourceId = request.sourceId || sources[0].id;
    const source = sources.find((entry) => entry.id === sourceId);
    if (!source) return { ...empty, status: 'needs-source', warnings: ['The requested authorized source no longer exists.'] };
    const record = typeof this.studio.getInventory === 'function' ? this.studio.getInventory(sourceId) : null;
    if (!record || !Array.isArray(record.files)) {
      return {
        ...empty,
        status: 'index-required',
        source: { id: source.id, label: source.label, path: this.redact(source.path), fileCount: source.fileCount || 0 },
        warnings: ['The authorized source has no in-memory index in this session. Run its read-only scan in Studio first.'],
      };
    }
    const cutoff = this.now().getTime() - ageDays * 86400000;
    const items = record.files
      .filter((file) => Number.isFinite(file.modifiedMs) && file.modifiedMs <= cutoff)
      .sort((a, b) => (a.modifiedMs || 0) - (b.modifiedMs || 0))
      .slice(0, limit)
      .map((file) => {
        const candidate = this.createCandidate({
          idKey: 'unused-file',
          name: file.name,
          pathValue: path.join(source.path, file.relative || file.name),
          category: 'unused',
          source: `${source.label} (authorized)`,
          safety: 'review',
          risk: 'medium',
          sizeBytes: file.size,
          fileCount: 1,
          folderCount: 0,
          modifiedAt: file.modifiedMs,
          reasons: [
            `Modified more than ${ageDays} days ago.`,
            'Dormancy is not proof that the file is unwanted.',
          ],
          action: 'archive-review',
          permission: 'Standard user (authorized source)',
          recoverable: 'No archive channel exists; staging is review-only.',
          provider: 'Studio authorized source index',
          evidence: [`Relative path: ${clip(file.relative || file.name, 180)}`, 'Metadata only; content was not opened.'],
        });
        candidate.relative = clip(file.relative || file.name, 260);
        this.unusedCandidates.set(candidate.id, candidate);
        return {
          id: candidate.id,
          name: candidate.name,
          relative: candidate.relative,
          path: candidate.path,
          sizeBytes: candidate.sizeBytes,
          modifiedAt: candidate.modifiedAt,
          ageDays: candidate.ageDays,
          safety: candidate.safety,
        };
      });
    return {
      ...empty,
      status: 'complete',
      source: { id: source.id, label: source.label, path: this.redact(source.path), fileCount: source.fileCount || record.files.length },
      items,
      warnings: items.length ? [] : [`No indexed file is older than ${ageDays} days in this source.`],
    };
  }

  resolveCandidates(ids) {
    const list = Array.isArray(ids) ? ids : [];
    if (!list.length) throw cleanupError('CLEANUP_PLAN_EMPTY', 'Select at least one measured candidate first.');
    if (list.length > MAX_PLAN_ITEMS) throw cleanupError('CLEANUP_PLAN_TOO_LARGE', `A plan can contain at most ${MAX_PLAN_ITEMS} candidates.`);
    const resolved = [];
    for (const id of list) {
      const candidate = this.candidatesById.get(String(id)) || this.unusedCandidates.get(String(id));
      if (!candidate) throw cleanupError('CLEANUP_CANDIDATE_STALE', 'A selected candidate is no longer in the measured inventory. Run discovery again.');
      resolved.push(candidate);
    }
    return resolved;
  }

  plan(request = {}) {
    const mode = ['quarantine', 'recycle', 'restore', 'purge', 'archive'].includes(request.mode) ? request.mode : 'quarantine';
    const candidates = this.resolveCandidates(request.candidateIds);
    const items = candidates.map((candidate) => {
      const blockedReasons = [];
      if (candidate.safety === 'blocked') blockedReasons.push('The candidate is blocked by the safety policy.');
      if (candidate.category === 'update') blockedReasons.push('Windows servicing must use the official Windows handoff.');
      if (candidate.active) blockedReasons.push('An owning process is active.');
      if (mode === 'recycle' && candidate.category !== 'recycle') blockedReasons.push('Only Recycle Bin evidence can be included in a purge plan.');
      if (mode === 'restore' && candidate.category !== 'quarantine' && !candidate.virtual) blockedReasons.push('The selected item is not a quarantine journal entry.');
      return {
        candidateId: candidate.id,
        name: candidate.name,
        category: candidate.category,
        path: candidate.path,
        safety: candidate.safety,
        sizeBytes: candidate.sizeBytes,
        reclaimBytes: candidate.safety === 'eligible' && !blockedReasons.length ? candidate.sizeBytes : 0,
        risk: blockedReasons.length ? 'blocked' : candidate.safety === 'review' ? 'review' : 'low',
        reasons: [...(candidate.reasons || []), ...blockedReasons],
        reversible: mode === 'restore' ? false : candidate.recoverable,
      };
    });
    const eligibleBytes = items.reduce((sum, item) => sum + (item.reclaimBytes || 0), 0);
    const blocked = items.filter((item) => item.risk === 'blocked').length;
    const planCore = {
      contract: CONTRACT,
      planId: crypto.randomUUID(),
      createdAt: this.now().toISOString(),
      observedAt: this.lastScan?.observedAt || null,
      mode,
      items,
      totals: {
        count: items.length,
        blocked,
        eligibleBytes,
        reviewBytes: items.filter((item) => item.risk === 'review').reduce((sum, item) => sum + (item.sizeBytes || 0), 0),
        reclaimSource: eligibleBytes > 0 ? 'measured' : 'unknown',
      },
      execution: {
        available: false,
        gate: 'Mission 08 destructive-action approval',
        reason: 'This delivery is read-only. Execution requires an approved plan, per-target consent, a same-volume quarantine, verified postconditions and a recovery journal. No delete/move/recycle/DISM channel exists.',
      },
      rollback: {
        available: false,
        reason: 'No mutation was attempted, so there is nothing to roll back. Recycle Bin purge is never reversible.',
      },
      immutable: true,
      mutation: 'none',
    };
    planCore.fingerprint = crypto.createHash('sha256').update(JSON.stringify({ mode, items: items.map((item) => [item.candidateId, item.risk]) })).digest('hex').slice(0, 24);
    return planCore;
  }

  schedule(request = {}) {
    const frequency = request.frequency === 'weekly' ? 'weekly' : 'daily';
    const time = /^\d{2}:\d{2}$/.test(String(request.time || '')) ? String(request.time) : '02:00';
    const weekdays = Array.from(new Set(asArray(request.weekdays).map((day) => clamp(day, 0, 6, 0))));
    const categories = asArray(request.categories).filter((key) => CATEGORY_KEYS.includes(key));
    const horizon = 5;
    const now = this.now();
    const [hours, minutes] = time.split(':').map(Number);
    const occurrences = [];
    const cursor = new Date(now);
    cursor.setSeconds(0, 0);
    cursor.setHours(hours, minutes, 0, 0);
    if (cursor.getTime() <= now.getTime()) cursor.setDate(cursor.getDate() + 1);
    for (let guard = 0; occurrences.length < horizon && guard < 40; guard += 1) {
      const day = cursor.getDay();
      const allowed = frequency === 'daily' || !weekdays.length || weekdays.includes(day);
      if (allowed) occurrences.push(cursor.toISOString());
      cursor.setDate(cursor.getDate() + 1);
    }
    return {
      draft: {
        frequency,
        time,
        weekdays,
        categories: categories.length ? categories : ['temp'],
        scanOnly: true,
      },
      occurrences,
      quietHours: { from: '00:00', to: '06:00', respected: hours >= 0 && hours < 6 },
      execution: {
        available: false,
        gate: 'Mission 13 scheduled automation',
        reason: 'Creating a Windows scheduled task and running unattended cleanup require the automation mission and explicit approval. This draft never persists.',
      },
      readOnly: true,
      mutation: 'none',
    };
  }

  async report() {
    const [vault, journal] = await Promise.all([this.readVault(), this.journal()]);
    const summary = this.summaryFor(this.lastScan?.candidates || []);
    return {
      contract: CONTRACT,
      generatedAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      session: this.lastScan ? {
        id: this.lastScan.sessionId,
        observedAt: this.lastScan.observedAt,
        categories: [...this.lastScan.categories],
        coverage: { ...this.lastScan.coverage },
      } : null,
      summary,
      recycle: {
        items: this.lastScan?.recycleItems.length || 0,
        bytes: (this.lastScan?.recycleItems || []).reduce((sum, item) => sum + (item.sizeBytes || 0), 0),
      },
      vault: {
        entries: vault.items.length,
        bytes: vault.totalBytes,
        exists: vault.exists,
      },
      journal: {
        entries: journal.entries.length,
        exists: journal.exists,
      },
      warnings: this.lastScan?.warnings || [],
      note: 'All values are measured metadata from this session. No deletion occurred and no reclaimed bytes are claimed.',
    };
  }

  dispose() {
    for (const session of this.sessions.values()) {
      session.controller.abort();
    }
    this.sessions.clear();
    this.candidates = [];
    this.candidatesById.clear();
    this.unusedCandidates.clear();
    this.lastScan = null;
  }
}

function parseDateMs(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function parseJsonOutput(output) {
  const text = String(output == null ? '' : output).replace(/^\uFEFF/, '').trim();
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start >= 0 && end > start) {
      try { return JSON.parse(text.slice(start, end + 1)); } catch { /* ignore */ }
    }
    return [];
  }
}

module.exports = {
  CleanupBridge,
  CONTRACT,
  SERVICE_DEFINITIONS,
  GATED_OPERATIONS,
  CATEGORY_KEYS,
  MAX_TEMP_FILES,
  MAX_RECYCLE_ITEMS,
  MAX_PLAN_ITEMS,
  SAFETY_RETENTION_DAYS,
  parseJsonOutput,
};
