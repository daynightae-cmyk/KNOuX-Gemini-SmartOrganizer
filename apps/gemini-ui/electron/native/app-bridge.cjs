'use strict';

/**
 * KNOuX Gemini — read-only Applications coordinator (Mission 05).
 *
 * One measured software inventory feeds all twelve application services:
 *   - uninstall registry (HKLM 64-bit, HKLM WOW6432Node 32-bit, HKCU)
 *   - Appx/MSIX packages
 *   - Win32_StartupCommand linkage
 * plus explicit, bounded, read-only operations:
 *   - Authenticode verification for one selected executable
 *   - install-location footprint measurement with hard entry/time budgets
 *   - file-extension / protocol association sample
 *   - name-match leftover candidates and stale registration detection
 *   - optional local WinGet queries (no source-agreement flags)
 *   - immutable uninstall plan previews
 *
 * There is deliberately no uninstall, install, update, association-write or
 * registry-write channel. Every mutation is returned as a gate owned by a
 * later mission, never as a simulated success.
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

// Windows PowerShell 5.1 can pick up PowerShell 7's Security module when the
// inherited PSModulePath contains both, producing "module could not be loaded"
// and duplicate type-data errors. Authenticode must resolve the built-in
// Windows PowerShell module, so the child receives only that module root.
const WINDOWS_POWERSHELL_MODULE_PATH = path.join(
  process.env.SystemRoot || 'C:\\Windows',
  'System32',
  'WindowsPowerShell',
  'v1.0',
  'Modules'
);

const CONTRACT = 'apps.v1';
const MAX_RETURNED_APPS = 4000;
const MAX_EXISTENCE_CHECKS = 1500;
const EXISTENCE_CONCURRENCY = 24;
const EXISTENCE_BUDGET_MS = 6000;
const MAX_SIZE_APPS = 40;
const MAX_SIZE_ENTRIES = 12000;
const MAX_SIZE_DEPTH = 10;
const SIZE_BUDGET_MS = 20000;
const MAX_TOP_FOLDERS = 8;
const MAX_ASSOC_EXTENSIONS = 200;
const MAX_ASSOC_PROTOCOLS = 60;
const ASSOC_BUDGET_MS = 20000;
const MAX_LEFTOVER_DIRS_PER_ROOT = 400;
const MAX_LEFTOVER_CANDIDATES = 60;
const MAX_PLAN_ITEMS = 50;
const UPDATE_TIMEOUT_MS = 60000;
const SIGNATURE_TIMEOUT_MS = 45000;

const SERVICE_DEFINITIONS = Object.freeze([
  { id: 'app-inventory', labelEn: 'Installed Applications', labelAr: 'التطبيقات المثبتة', state: 'available', provider: 'UninstallRegistry + Get-AppxPackage', noteEn: 'Measured uninstall registry and Appx/MSIX inventory.', noteAr: 'جرد مقيس من سجل إلغاء التثبيت وحزم Appx/MSIX.' },
  { id: 'app-identity', labelEn: 'App Identity', labelAr: 'هوية التطبيق', state: 'available', provider: 'Get-AuthenticodeSignature', noteEn: 'Authenticode is verified on request for the selected executable.', noteAr: 'يتم التحقق من Authenticode عند الطلب للملف التنفيذي المحدد.' },
  { id: 'app-search', labelEn: 'Advanced Search', labelAr: 'البحث المتقدم', state: 'available', provider: 'Measured inventory', noteEn: 'All filters run over the measured inventory only.', noteAr: 'جميع عوامل التصفية تعمل على الجرد المقيس فقط.' },
  { id: 'app-publisher', labelEn: 'Publisher Intelligence', labelAr: 'استخبارات الناشرين', state: 'partial', provider: 'Registry publisher + verified signatures', noteEn: 'Trust is shown only for apps whose signature was actually verified.', noteAr: 'تُعرض الثقة فقط للتطبيقات التي تم التحقق من توقيعها فعلياً.' },
  { id: 'app-recent', labelEn: 'Recently Changed Apps', labelAr: 'التطبيقات الحديثة', state: 'partial', provider: 'Registry InstallDate', noteEn: 'Install dates are measured; update/modification history is not tracked.', noteAr: 'تواريخ التثبيت مقيسة؛ سجل التحديث/التعديل غير متتبع.' },
  { id: 'app-uninstall-queue', labelEn: 'Uninstall Queue', labelAr: 'قائمة إلغاء التثبيت', state: 'gated', provider: 'Immutable plan preview', noteEn: 'Builds a non-executable plan; uninstall execution is gated to Mission 08.', noteAr: 'ينشئ خطة غير قابلة للتنفيذ؛ تنفيذ الإزالة محجوب للمهمة 08.' },
  { id: 'app-leftovers', labelEn: 'Leftover Analysis', labelAr: 'تحليل البقايا', state: 'partial', provider: 'Bounded AppData/ProgramData naming', noteEn: 'Candidates are name-match evidence, not proof of orphanhood.', noteAr: 'المرشحات دليل مطابقة أسماء وليست إثباتاً لليتم.' },
  { id: 'app-updates', labelEn: 'Software Update Center', labelAr: 'مركز تحديث البرامج', state: 'partial', provider: 'WinGet CLI (optional)', noteEn: 'WinGet is queried read-only on request; install/update execution is gated.', noteAr: 'يُستعلم WinGet للقراءة فقط عند الطلب؛ تنفيذ التثبيت/التحديث محجوب.' },
  { id: 'app-size', labelEn: 'Software Footprint', labelAr: 'البصمة التخزينية', state: 'partial', provider: 'Bounded install-location measurement', noteEn: 'Sizes are measured on disk with hard entry/time budgets; reported sizes are separate.', noteAr: 'تُقاس الأحجام على القرص بميزانيات صارمة؛ الأحجام المبلغة منفصلة.' },
  { id: 'app-store-packages', labelEn: 'Package Center', labelAr: 'مركز الحزم', state: 'partial', provider: 'Get-AppxPackage + WinGet discovery', noteEn: 'Installed packages are measured; repository discovery depends on WinGet.', noteAr: 'الحزم المثبتة مقيسة؛ استكشاف المستودع يعتمد على WinGet.' },
  { id: 'app-associations', labelEn: 'File & Protocol Matrix', labelAr: 'مصفوفة الملفات والبروتوكولات', state: 'partial', provider: 'HKCR sample + UserChoice', noteEn: 'A bounded registry sample; the Windows Settings handoff performs no write.', noteAr: 'عينة سجل محدودة؛ الانتقال لإعدادات ويندوز لا ينفذ كتابة.' },
  { id: 'app-startup-impact', labelEn: 'Boot Impact Analyzer', labelAr: 'تحليل تأثير الإقلاع', state: 'partial', provider: 'Win32_StartupCommand linkage', noteEn: 'Startup linkage is measured; boot seconds are not and are never invented.', noteAr: 'ارتباط الإقلاع مقيس؛ ثواني الإقلاع غير مقيسة ولا تُختلق.' },
]);

const GATED_OPERATIONS = Object.freeze([
  { id: 'apps.uninstall.execute', mission: '08', title: 'Execute an application uninstall', reason: 'Requires an approved cleanup plan, per-target consent, elevation where needed, postcondition verification and a recovery journal. No uninstall channel exists in Mission 05.' },
  { id: 'apps.update.execute', mission: '11', title: 'Install or update an application', reason: 'Installer execution, source trust, user consent and rollback evidence belong to the repair/execution mission. Mission 05 only measures and previews.' },
  { id: 'apps.associations.write', mission: '14', title: 'Change a default handler', reason: 'Windows protects UserChoice; Mission 05 opens the official Settings page and never writes the association hash.' },
  { id: 'apps.startup.toggle', mission: '09', title: 'Enable or disable a startup entry', reason: 'Startup mutation is gated to Mission 09. This section only reads Win32_StartupCommand and drafts a policy review.' },
]);

const GENERIC_TOKENS = new Set([
  'microsoft', 'windows', 'corporation', 'corp', 'company', 'limited', 'ltd', 'inc', 'llc', 'gmbh',
  'software', 'application', 'app', 'apps', 'update', 'updater', 'setup', 'installer', 'runtime',
  'redistributable', 'framework', 'package', 'service', 'services', 'driver', 'drivers', 'support',
  'helper', 'agent', 'client', 'server', 'studio', 'tool', 'tools', 'system', 'core', 'desktop',
  'version', 'edition', 'suite', 'player', 'manager', 'center', 'centre', 'component', 'components',
  'library', 'libraries', 'plugin', 'plugins', 'extension', 'extensions', 'x64', 'x86', 'amd64',
]);

function appError(code, message, { retryable = false } = {}) {
  const error = new Error(message);
  error.code = code;
  error.retryable = retryable;
  return error;
}

function clip(value, max) {
  const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function iso(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeInstallDate(value) {
  const raw = String(value == null ? '' : value).trim();
  if (!raw) return null;
  const compact = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeTokens(...values) {
  const tokens = new Set();
  for (const value of values) {
    for (const token of String(value || '').toLowerCase().split(/[^a-z0-9]+/u)) {
      if (token.length >= 4 && !GENERIC_TOKENS.has(token)) tokens.add(token);
    }
  }
  return tokens;
}

function extractExecutable(command) {
  const text = String(command || '');
  const quoted = text.match(/"([^"]+?\.(?:exe|com))"/i);
  if (quoted) return quoted[1];
  const bare = text.match(/([A-Za-z]:\\[^"<>|?*\r\n]+?\.(?:exe|com))/i);
  if (bare) return bare[1];
  const plain = text.match(/\b([^\\/\s"']+\.(?:exe|com))\b/i);
  return plain ? plain[1] : null;
}

function basenameOf(value) {
  if (!value) return null;
  const normalized = String(value).replace(/["']/g, '').trim();
  if (!normalized) return null;
  const parts = normalized.split(/[\\/]/);
  return parts[parts.length - 1] || null;
}

function stableId(...parts) {
  return crypto.createHash('sha256').update(parts.join('\u0000')).digest('hex').slice(0, 20);
}

function sourceScope(root) {
  const text = String(root || '');
  if (/^HKCU/i.test(text)) return 'per-user';
  if (/WOW6432Node/i.test(text)) return 'per-machine';
  return 'per-machine';
}

function removalMethod(entry, isAppx = false) {
  if (isAppx) return 'appx-package';
  const uninstall = String(entry.uninstallString || '');
  if (String(entry.windowsInstaller || '') === '1' || /msiexec/i.test(uninstall)) return 'msi';
  if (uninstall.trim()) return 'uninstall-string';
  return null;
}

function productCodeFrom(entry) {
  const candidates = [entry.uninstallString, entry.displayIcon, entry.name];
  for (const candidate of candidates) {
    const match = String(candidate || '').match(/\{[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\}/);
    if (match) return match[0].toUpperCase();
  }
  return null;
}

function mapSignatureStatus(raw) {
  const status = String(raw || '').trim();
  if (status === 'Valid') return 'valid';
  if (status === 'NotSigned') return 'unsigned';
  if (['HashMismatch', 'NotTrusted', 'UnknownError', 'Incompatible'].includes(status)) return 'invalid';
  if (!status) return 'unavailable';
  return 'unknown';
}

function mapArchitecture(value) {
  const text = String(value || '').toLowerCase();
  if (!text) return null;
  if (text.includes('arm64')) return 'arm64';
  if (text.includes('x86') || text.includes('32-bit')) return 'x86';
  if (text.includes('x64') || text.includes('64-bit') || text.includes('amd64')) return 'x64';
  return null;
}

function ansiStrip(value) {
  return String(value || '').replace(/\u001b\[[0-9;?]*[A-Za-z]/g, '');
}

class AppBridge {
  constructor({
    loadProvider,
    verifySignature,
    readAssociations,
    measureFolderSize,
    runner,
    execFile: execFileRunner,
    platform = process.platform,
    env = process.env,
    homeDir = os.homedir(),
    tempDir = os.tmpdir(),
    now = () => new Date(),
  } = {}) {
    this.loadProvider = loadProvider;
    this.verifySignature = verifySignature;
    this.readAssociations = readAssociations;
    this.measureFolderSize = measureFolderSize;
    this.runner = runner || execFileRunner || execFileAsync;
    this.platform = platform;
    this.env = env;
    this.homeDir = homeDir;
    this.tempDir = tempDir;
    this.now = now;
    this.inventoryCache = null;
    this.signatureCache = new Map();
    this.sizeCache = new Map();
    this.operations = new Map();
    this.wingetCache = null;
  }

  capabilities() {
    return {
      engine: 'KNOuX Applications read-only coordinator',
      contract: CONTRACT,
      readOnly: true,
      mutation: 'none',
      fixtureFallback: false,
      services: SERVICE_DEFINITIONS.map((service) => ({ ...service })),
      gatedOperations: GATED_OPERATIONS.map((operation) => ({ ...operation })),
      nativeOnly: [
        'Windows uninstall registry (HKLM 64-bit, HKLM WOW6432Node, HKCU)',
        'Get-AppxPackage / MSIX inventory',
        'Get-AuthenticodeSignature (selected executable)',
        'Win32_StartupCommand',
        'Bounded install-location filesystem measurement',
        'WinGet CLI (optional, read-only discovery)',
      ],
    };
  }

  settingsTarget(target) {
    if (target === 'defaultapps') return { target, uri: 'ms-settings:defaultapps' };
    if (target === 'appsfeatures') return { target, uri: 'ms-settings:appsfeatures' };
    throw appError('APP_SETTINGS_TARGET_INVALID', 'The requested Windows Settings page is not allowlisted.');
  }

  requireProvider() {
    if (this.platform !== 'win32') {
      throw appError('APP_PLATFORM_UNSUPPORTED', 'The Windows software inventory is only available on Windows.');
    }
    if (typeof this.loadProvider !== 'function') {
      throw appError('APP_PROVIDER_MISSING', 'The read-only Windows provider module is not installed.');
    }
    const provider = this.loadProvider();
    if (!provider) throw appError('APP_PROVIDER_MISSING', 'The read-only Windows provider module is not installed.');
    return provider;
  }

  redact(value) {
    let text = String(value == null ? '' : value);
    if (!text) return null;
    const home = String(this.homeDir || '');
    if (home) {
      text = text.replace(new RegExp(home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '%USERPROFILE%');
    }
    const temp = String(this.tempDir || '');
    if (temp) {
      text = text.replace(new RegExp(temp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '%TEMP%');
    }
    return text;
  }

  async collectStartup() {
    const provider = this.requireProvider();
    if (typeof provider.collectStartupItems !== 'function') return { entries: [], available: false };
    const raw = await provider.collectStartupItems({ timeout: 45000 });
    return { entries: asArray(raw), available: true };
  }

  mapStartup(rawEntries, apps) {
    const entries = [];
    const byApp = new Map();
    const installs = apps
      .filter((app) => app.installLocation)
      .map((app) => ({
        app,
        folder: String(app.installLocation)
          .replace(/^%USERPROFILE%/i, this.homeDir)
          .toLowerCase()
          .replace(/[\\/]+$/, ''),
      }))
      .sort((a, b) => b.folder.length - a.folder.length);

    for (const raw of rawEntries) {
      const command = String(raw.command || '');
      const executablePath = extractExecutable(command);
      const normalizedExe = executablePath ? executablePath.toLowerCase() : null;
      let linked = null;
      if (normalizedExe) {
        linked = installs.find(({ folder }) => (
          normalizedExe === folder || normalizedExe.startsWith(`${folder}\\`) || normalizedExe.startsWith(`${folder}/`)
        )) || null;
      }
      const entry = {
        id: stableId('startup', raw.name || '', raw.source || '', raw.sourceDetail || raw.location || ''),
        name: clip(raw.name || 'Unnamed startup entry', 120),
        source: clip(raw.source || 'other', 40),
        location: this.redact(clip(raw.sourceDetail || raw.location || '', 200)) || null,
        executable: basenameOf(executablePath),
        linkedAppId: linked ? linked.app.id : null,
        linkedAppName: linked ? linked.app.name : null,
        writable: Boolean(raw.writable),
        bootSeconds: null,
        commandExposed: false,
      };
      entries.push(entry);
      if (linked) {
        const list = byApp.get(linked.app.id) || [];
        list.push(entry);
        byApp.set(linked.app.id, list);
      }
    }
    return { entries, byApp };
  }

  async inventory() {
    const started = Date.now();
    const observedAt = iso(this.now());
    const warnings = [];
    let registry = { items: [], sourceFailures: null, entryFailures: null };
    let appx = [];
    let startupRaw = { entries: [], available: false };

    try {
      const provider = this.requireProvider();
      if (typeof provider.collectUninstallApps !== 'function') {
        throw appError('APP_PROVIDER_INCOMPLETE', 'The installed-software provider is not available.');
      }
      const uninstall = await provider.collectUninstallApps({ timeout: 60000 });
      registry = {
        items: asArray(uninstall?.items),
        sourceFailures: safeNumber(uninstall?.sourceFailures),
        entryFailures: safeNumber(uninstall?.entryFailures),
      };
      if (typeof provider.collectAppxApps === 'function') {
        try {
          appx = asArray(await provider.collectAppxApps({ timeout: 60000 }));
        } catch (error) {
          warnings.push(`Appx/MSIX packages could not be measured: ${clip(error?.message || error, 160)}`);
        }
      } else {
        warnings.push('The Appx/MSIX provider is not available in this build.');
      }
      try {
        startupRaw = await this.collectStartup();
      } catch (error) {
        warnings.push(`Startup linkage could not be measured: ${clip(error?.message || error, 160)}`);
      }
    } catch (error) {
      throw error;
    }

    const seen = new Set();
    const apps = [];
    const lastSeen = observedAt;

    for (const entry of registry.items.slice(0, MAX_RETURNED_APPS)) {
      const name = clip(entry.name || '', 160);
      if (!name) continue;
      const root = String(entry.source || '');
      const id = stableId('uninstall', root, name, entry.version || '', entry.publisher || '');
      if (seen.has(id)) continue;
      seen.add(id);
      const estimated = safeNumber(entry.estimatedSize);
      const isSystemComponent = String(entry.systemComponent || '').toLowerCase() === '1' || String(entry.systemComponent || '').toLowerCase() === 'true';
      apps.push({
        id,
        name,
        publisher: clip(entry.publisher || '', 120) || null,
        version: clip(entry.version || '', 40) || null,
        scope: sourceScope(root),
        architecture: mapArchitecture(`${root} ${entry.installLocation || ''} ${entry.windowsInstaller || ''}`),
        source: 'uninstall-registry',
        registryRoot: root ? clip(root, 160) : null,
        registryView: /WOW6432Node/i.test(root) ? '32-bit' : '64-bit',
        productCode: productCodeFrom(entry),
        installDate: normalizeInstallDate(entry.installDate),
        installLocation: this.redact(clip(entry.installLocation || '', 260)) || null,
        installLocationExists: null,
        installSource: this.redact(clip(entry.installSource || '', 260)) || null,
        uninstallMethod: removalMethod(entry),
        uninstallCommandExposed: false,
        displayIcon: this.redact(clip(entry.displayIcon || '', 260)) || null,
        estimatedSizeBytes: estimated == null ? null : Math.round(estimated * 1024),
        isFramework: String(entry.releaseType || '').toLowerCase().includes('framework'),
        isSystemComponent,
        nonRemovable: false,
        protected: isSystemComponent,
        startup: { linked: false, entryCount: 0, sources: [] },
        size: {
          reportedBytes: estimated == null ? null : Math.round(estimated * 1024),
          measuredBytes: null,
          measuredAt: null,
          source: estimated == null ? 'unknown' : 'reported',
          partial: null,
          filesMeasured: null,
        },
        signature: { status: 'unchecked', signer: null, thumbprint: null, checkedAt: null },
        lastSeen,
        evidence: {
          registryKeyRedacted: root ? clip(root, 160) : null,
          packageFullName: null,
          provider: 'UninstallRegistry',
        },
      });
    }

    for (const entry of appx.slice(0, MAX_RETURNED_APPS)) {
      const packageFullName = clip(entry.packageIdentity || entry.evidence?.packageFullName || '', 240);
      const name = clip(entry.name || packageFullName.split('_')[0] || 'Unnamed package', 160);
      if (!name) continue;
      const id = stableId('appx', packageFullName || name, entry.version || '');
      if (seen.has(id)) continue;
      seen.add(id);
      const nonRemovable = Boolean(entry.nonRemovable);
      const framework = Boolean(entry.isFramework);
      apps.push({
        id,
        name,
        publisher: clip(entry.publisher || '', 160) || null,
        version: clip(entry.version || '', 40) || null,
        scope: 'packaged',
        architecture: mapArchitecture(entry.architecture) || null,
        source: 'appx-msix',
        registryRoot: null,
        registryView: null,
        productCode: null,
        installDate: null,
        installLocation: this.redact(clip(entry.installLocation || '', 260)) || null,
        installLocationExists: null,
        installSource: null,
        uninstallMethod: 'appx-package',
        uninstallCommandExposed: false,
        displayIcon: null,
        estimatedSizeBytes: null,
        isFramework: framework,
        isSystemComponent: false,
        nonRemovable,
        protected: nonRemovable,
        startup: { linked: false, entryCount: 0, sources: [] },
        size: {
          reportedBytes: null,
          measuredBytes: null,
          measuredAt: null,
          source: 'unknown',
          partial: null,
          filesMeasured: null,
        },
        signature: { status: 'unchecked', signer: null, thumbprint: null, checkedAt: null },
        lastSeen,
        evidence: {
          registryKeyRedacted: null,
          packageFullName: packageFullName || null,
          provider: 'Get-AppxPackage',
        },
      });
    }

    // Measure existence for a bounded prefix so the register can mark stale
    // registrations without stalling on thousands of network paths.
    const existence = await this.checkExistence(apps);
    const startup = this.mapStartup(startupRaw.entries, apps);
    for (const app of apps) {
      const entries = startup.byApp.get(app.id) || [];
      app.startup = {
        linked: entries.length > 0,
        entryCount: entries.length,
        sources: [...new Set(entries.map((entry) => entry.source))],
      };
      const measuredSize = this.sizeCache.get(app.id);
      if (measuredSize) {
        app.size = {
          reportedBytes: app.estimatedSizeBytes,
          measuredBytes: measuredSize.measuredBytes,
          measuredAt: iso(this.now()),
          source: 'measured',
          partial: measuredSize.partial,
          filesMeasured: measuredSize.files,
        };
      }
      const verified = this.signatureCache.get(app.id);
      if (verified) {
        app.signature = {
          status: verified.status,
          signer: verified.signer,
          thumbprint: verified.thumbprint,
          checkedAt: verified.checkedAt,
        };
      }
    }

    const publishers = new Set(apps.map((app) => app.publisher).filter(Boolean));
    const measured = apps.filter((app) => app.size.measuredBytes != null);
    const reportedTotal = apps.reduce((sum, app) => sum + (app.estimatedSizeBytes || 0), 0);
    const kpis = {
      installed: apps.length,
      publishers: publishers.size,
      packaged: apps.filter((app) => app.source === 'appx-msix').length,
      protectedCount: apps.filter((app) => app.protected).length,
      startupLinked: apps.filter((app) => app.startup.linked).length,
      startupEntries: startup.entries.length,
      staleRegistrations: apps.filter((app) => app.installLocation && app.installLocationExists === false).length,
      reportedFootprintBytes: reportedTotal > 0 ? reportedTotal : null,
      measuredFootprintBytes: measured.length ? measured.reduce((sum, app) => sum + (app.size.measuredBytes || 0), 0) : null,
      measuredFootprintApps: measured.length,
      updatesAvailable: null,
    };

    warnings.push('EstimatedSize values are installer-reported, not measured on disk.');
    warnings.push('Authenticode signatures are verified only when requested for a selected app.');
    warnings.push('Boot duration and per-entry startup cost are not measured and are never invented.');
    warnings.push('No uninstall, install, update, startup or association write channel exists in this section.');

    const inventory = {
      contract: CONTRACT,
      readOnly: true,
      mutation: 'none',
      observedAt,
      durationMs: Date.now() - started,
      apps,
      kpis,
      coverage: {
        registryItems: registry.items.length,
        appxItems: appx.length,
        returned: apps.length,
        sourceFailures: registry.sourceFailures,
        entryFailures: registry.entryFailures,
        startupEntries: startup.entries.length,
        existenceChecked: existence.checked,
        existenceMissing: existence.missing,
        truncated: registry.items.length > MAX_RETURNED_APPS || appx.length > MAX_RETURNED_APPS,
      },
      startup: startup.entries,
      warnings,
    };
    this.inventoryCache = inventory;
    this.startupAvailable = startupRaw.available;
    return inventory;
  }

  async checkExistence(apps) {
    const deadline = Date.now() + EXISTENCE_BUDGET_MS;
    let checked = 0;
    let missing = 0;
    const queue = apps.filter((app) => app.installLocation && app.source === 'uninstall-registry').slice(0, MAX_EXISTENCE_CHECKS);
    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length && Date.now() < deadline) {
        const app = queue[cursor];
        cursor += 1;
        const local = String(app.installLocation || '').replace(/^%USERPROFILE%/i, this.homeDir);
        if (!local || !path.isAbsolute(local)) continue;
        try {
          const stat = await fsp.stat(local);
          app.installLocationExists = stat.isDirectory();
          checked += 1;
          if (!stat.isDirectory()) missing += 1;
        } catch {
          app.installLocationExists = false;
          checked += 1;
          missing += 1;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(EXISTENCE_CONCURRENCY, queue.length) }, () => worker()));
    return { checked, missing };
  }

  async findApp(appId) {
    if (!/^[a-f0-9]{20}$/.test(String(appId || ''))) {
      throw appError('APP_ID_INVALID', 'A valid application identifier is required.');
    }
    if (!this.inventoryCache) await this.inventory();
    const app = this.inventoryCache.apps.find((entry) => entry.id === appId);
    if (!app) throw appError('APP_NOT_FOUND', 'The selected application is not in the measured inventory.');
    return app;
  }

  async resolveExecutable(app) {
    const candidates = [];
    if (app.displayIcon) {
      const icon = String(app.displayIcon).replace(/,\s*-?\d+$/, '');
      if (/\.(exe|com)$/i.test(icon)) candidates.push(icon);
    }
    if (app.installLocation) {
      const folder = String(app.installLocation).replace(/^%USERPROFILE%/i, this.homeDir);
      try {
        const entries = await fsp.readdir(folder, { withFileTypes: true });
        const executables = entries
          .filter((entry) => entry.isFile() && /\.(exe|com)$/i.test(entry.name))
          .map((entry) => path.join(folder, entry.name));
        const tokens = normalizeTokens(app.name);
        executables.sort((left, right) => {
          const leftName = path.basename(left).toLowerCase();
          const rightName = path.basename(right).toLowerCase();
          const leftScore = [...tokens].some((token) => leftName.includes(token)) ? 1 : 0;
          const rightScore = [...tokens].some((token) => rightName.includes(token)) ? 1 : 0;
          return rightScore - leftScore || leftName.localeCompare(rightName);
        });
        candidates.push(...executables.slice(0, 8));
      } catch {
        // A missing install folder is valid evidence; the signature panel will
        // report that no executable could be resolved.
      }
    }
    for (const candidate of candidates) {
      try {
        const stat = await fsp.stat(candidate);
        if (stat.isFile()) return candidate;
      } catch {
        // Try the next candidate.
      }
    }
    return null;
  }

  async signature(appId) {
    const app = await this.findApp(appId);
    const cached = this.signatureCache.get(appId);
    if (cached) return cached;
    const executable = await this.resolveExecutable(app);
    if (!executable) {
      const result = {
        appId,
        executable: null,
        status: 'unavailable',
        message: 'No executable could be resolved from the DisplayIcon or install folder.',
        signer: null,
        issuer: null,
        thumbprint: null,
        notBefore: null,
        notAfter: null,
        chain: [],
        checkedAt: iso(this.now()),
        provider: 'Get-AuthenticodeSignature',
        note: 'No signature was verified because no local executable was found. This is not an unsigned verdict.',
      };
      this.signatureCache.set(appId, result);
      return result;
    }

    let raw;
    if (typeof this.verifySignature === 'function') {
      raw = await this.verifySignature(executable);
    } else {
      raw = await this.runSignatureVerification(executable);
    }
    const result = {
      appId,
      executable: this.redact(executable),
      status: mapSignatureStatus(raw?.status),
      message: clip(raw?.message || '', 240) || null,
      signer: clip(raw?.signer || '', 240) || null,
      issuer: clip(raw?.issuer || '', 240) || null,
      thumbprint: clip(raw?.thumbprint || '', 80) || null,
      notBefore: raw?.notBefore ? iso(raw.notBefore) : null,
      notAfter: raw?.notAfter ? iso(raw.notAfter) : null,
      chain: asArray(raw?.chain).slice(0, 6).map((element) => ({
        subject: clip(element.subject || '', 240),
        issuer: clip(element.issuer || '', 240),
        thumbprint: clip(element.thumbprint || '', 80),
        notBefore: element.notBefore ? iso(element.notBefore) : null,
        notAfter: element.notAfter ? iso(element.notAfter) : null,
      })),
      checkedAt: iso(this.now()),
      provider: 'Get-AuthenticodeSignature',
      note: 'Local Authenticode status. Certificate revocation was not checked (RevocationMode=NoCheck).',
    };
    this.signatureCache.set(appId, result);
    app.signature = {
      status: result.status,
      signer: result.signer,
      thumbprint: result.thumbprint,
      checkedAt: result.checkedAt,
    };
    return result;
  }

  async runSignatureVerification(executable) {
    const safePath = String(executable).replace(/'/g, "''");
    const script = [
      "$ErrorActionPreference='Stop';",
      `$p='${safePath}';`,
      "$s=Get-AuthenticodeSignature -LiteralPath $p;",
      "$c=$s.SignerCertificate;",
      '$chain=@();',
      'if($c){',
      '  try{',
      "    $ch=New-Object System.Security.Cryptography.X509Certificates.X509Chain;",
      "    $ch.ChainPolicy.RevocationMode='NoCheck';",
      '    $built=$ch.Build($c);',
      '    foreach($e in @($ch.ChainElements)){',
      '      $cert=$e.Certificate;',
      "      $chain += [pscustomobject]@{subject=[string]$cert.Subject;issuer=[string]$cert.Issuer;thumbprint=[string]$cert.Thumbprint;notBefore=$cert.NotBefore.ToString('o');notAfter=$cert.NotAfter.ToString('o')}",
      '    }',
      '  } catch {}',
      '}',
      "[pscustomobject]@{status=[string]$s.Status;message=[string]$s.StatusMessage;signer=if($c){[string]$c.Subject}else{$null};issuer=if($c){[string]$c.Issuer}else{$null};thumbprint=if($c){[string]$c.Thumbprint}else{$null};notBefore=if($c){$c.NotBefore.ToString('o')}else{$null};notAfter=if($c){$c.NotAfter.ToString('o')}else{$null};chain=$chain} | ConvertTo-Json -Depth 5 -Compress",
    ].join(' ');
    try {
      const { stdout } = await this.runner(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
        {
          windowsHide: true,
          timeout: SIGNATURE_TIMEOUT_MS,
          maxBuffer: 2 * 1024 * 1024,
          env: { ...process.env, PSModulePath: WINDOWS_POWERSHELL_MODULE_PATH },
        }
      );
      const parsed = JSON.parse(String(stdout || '').trim() || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      throw appError(
        'APP_SIGNATURE_FAILED',
        `Authenticode verification did not complete: ${clip(error?.message || error, 160)}`,
        { retryable: true }
      );
    }
  }

  async associations() {
    if (this.platform !== 'win32') {
      throw appError('APP_PLATFORM_UNSUPPORTED', 'Windows file associations are only available on Windows.');
    }
    const raw = typeof this.readAssociations === 'function'
      ? await this.readAssociations()
      : await this.runAssociationQuery();

    const extensions = asArray(raw?.extensions).slice(0, MAX_ASSOC_EXTENSIONS).map((entry) => {
      const progId = clip(entry.progId || '', 160) || null;
      const userChoice = clip(entry.userChoice || '', 160) || null;
      return {
        key: clip(entry.key || '', 80),
        kind: 'extension',
        progId,
        handlerName: clip(entry.handlerName || '', 160) || null,
        userChoice,
        commandExe: basenameOf(extractExecutable(entry.command)),
        conflict: Boolean(userChoice && progId && userChoice.toLowerCase() !== progId.toLowerCase()),
      };
    });
    const protocols = asArray(raw?.protocols).slice(0, MAX_ASSOC_PROTOCOLS).map((entry) => ({
      key: clip(entry.key || '', 80),
      kind: 'protocol',
      progId: clip(entry.progId || '', 160) || null,
      handlerName: clip(entry.handlerName || '', 160) || null,
      userChoice: null,
      commandExe: basenameOf(extractExecutable(entry.command)),
      conflict: false,
    }));
    return {
      observedAt: iso(this.now()),
      extensions,
      protocols,
      sources: [
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts (UserChoice)',
        'HKEY_CLASSES_ROOT (bounded sample)',
      ],
      truncated: Boolean(raw?.truncated),
      warnings: [
        'A bounded registry sample is not a complete association catalogue.',
        'Opening Windows Settings is a handoff; this bridge never writes an association.',
      ],
    };
  }

  async runAssociationQuery() {
    const script = [
      "$ErrorActionPreference='SilentlyContinue';",
      `$sw=[System.Diagnostics.Stopwatch]::StartNew();`,
      "$userChoice=@{};",
      "$ucRoot='HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts';",
      'foreach($k in @(Get-ChildItem -LiteralPath $ucRoot | Select-Object -First 250)){',
      "  if($sw.ElapsedMilliseconds -gt 8000){ break }",
      "  $p=Get-ItemProperty -LiteralPath (Join-Path $k.PSPath 'UserChoice');",
      '  if($p.ProgId){ $userChoice[$k.PSChildName.ToLower()]=[string]$p.ProgId }',
      '}',
      "$classes='Registry::HKEY_CLASSES_ROOT';",
      '$exts=@(); $count=0;',
      'foreach($k in @(Get-ChildItem -LiteralPath $classes | Where-Object { $_.PSChildName.StartsWith(".") })){',
      '  if($count -ge 200 -or $sw.ElapsedMilliseconds -gt 16000){ break }',
      '  $name=$k.PSChildName.ToLower();',
      "  $progId=[string](Get-ItemProperty -LiteralPath $k.PSPath).'(default)';",
      '  $uc=$userChoice[$name];',
      '  $active=if($uc){$uc}else{$progId};',
      '  $handler=$null; $cmd=$null;',
      '  if($active){',
      "    $hk=Join-Path $classes $active;",
      "    $handler=[string](Get-ItemProperty -LiteralPath $hk).'(default)';",
      "    $c=Get-ItemProperty -LiteralPath (Join-Path $hk 'shell\\open\\command');",
      "    $cmd=[string]$c.'(default)';",
      '  }',
      '  $exts += [pscustomobject]@{key=$name;progId=$progId;userChoice=$uc;handlerName=$handler;command=$cmd};',
      '  $count++',
      '}',
      '$protos=@();',
      "$schemes=@('http','https','mailto','tel','callto','ms-settings','ms-store','ms-windows-store','ftp','news','feed','webcal','skype','steam','discord','zoommtg','msteams','slack','vscode','git');",
      'foreach($s in $schemes){',
      "  $p=Join-Path $classes $s;",
      "  $k=Get-Item -LiteralPath $p;",
      '  if(-not $k){ continue }',
      "  if(-not ($k.GetValueNames() -contains 'URL Protocol')){ continue }",
      "  $handler=[string](Get-ItemProperty -LiteralPath $p).'(default)';",
      "  $c=Get-ItemProperty -LiteralPath (Join-Path $p 'shell\\open\\command');",
      "  $protos += [pscustomobject]@{key=$s;progId=$s;handlerName=$handler;command=[string]$c.'(default)';}",
      '}',
      "[pscustomobject]@{extensions=$exts;protocols=$protos;truncated=($count -ge 200)} | ConvertTo-Json -Depth 4 -Compress",
    ].join(' ');
    try {
      const { stdout } = await this.runner(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
        { windowsHide: true, timeout: ASSOC_BUDGET_MS, maxBuffer: 8 * 1024 * 1024 }
      );
      const parsed = JSON.parse(String(stdout || '').trim() || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      throw appError(
        'APP_ASSOCIATIONS_FAILED',
        `The read-only association sample did not complete: ${clip(error?.message || error, 160)}`,
        { retryable: true }
      );
    }
  }

  operationStatus(operationId) {
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(String(operationId || ''))) {
      throw appError('APP_OPERATION_INVALID', 'A valid operation identifier is required.');
    }
    const existing = this.operations.get(operationId);
    if (existing) return existing;
    const created = { cancelled: false, startedAt: Date.now() };
    this.operations.set(operationId, created);
    return created;
  }

  cancelSizes(operationId) {
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(String(operationId || ''))) {
      throw appError('APP_OPERATION_INVALID', 'A valid operation identifier is required.');
    }
    const operation = this.operations.get(operationId);
    if (!operation) return { cancelled: false, operationId, note: 'No active size measurement owns this identifier.' };
    operation.cancelled = true;
    return { cancelled: true, operationId, note: 'The bounded size measurement will stop after the current directory read.' };
  }

  async sizes({ appIds, operationId } = {}) {
    const requested = Array.isArray(appIds) ? [...new Set(appIds.map(String))].slice(0, MAX_SIZE_APPS) : [];
    if (!requested.length) throw appError('APP_SIZE_SELECTION_EMPTY', 'At least one measured application is required.');
    const operation = this.operationStatus(operationId);
    const deadline = Date.now() + SIZE_BUDGET_MS;
    const results = [];
    const warnings = [];
    let truncated = false;
    try {
      for (const appId of requested) {
        if (operation.cancelled) {
          warnings.push('The size measurement was cancelled; remaining apps were not measured.');
          truncated = true;
          break;
        }
        const app = await this.findApp(appId);
        const cached = this.sizeCache.get(appId);
        if (cached) {
          results.push(cached);
          continue;
        }
        if (Date.now() > deadline) {
          warnings.push('The 20-second measurement budget elapsed before every selected app was measured.');
          truncated = true;
          break;
        }
        const folder = app.installLocation ? String(app.installLocation).replace(/^%USERPROFILE%/i, this.homeDir) : null;
        const measurable = await this.isMeasurableFolder(folder);
        if (!measurable.ok) {
          const result = {
            appId,
            measuredBytes: null,
            reportedBytes: app.estimatedSizeBytes,
            files: 0,
            folders: 0,
            partial: false,
            reason: measurable.reason,
            topFolders: [],
            appData: null,
            durationMs: 0,
          };
          this.sizeCache.set(appId, result);
          results.push(result);
          continue;
        }
        const started = Date.now();
        const measured = typeof this.measureFolderSize === 'function'
          ? await this.measureFolderSize(folder, { maxEntries: MAX_SIZE_ENTRIES, maxDepth: MAX_SIZE_DEPTH, deadline, isCancelled: () => operation.cancelled })
          : await this.walkFolder(folder, { maxEntries: MAX_SIZE_ENTRIES, maxDepth: MAX_SIZE_DEPTH, deadline, isCancelled: () => operation.cancelled });
        const appData = await this.measureAppData(app, deadline);
        const result = {
          appId,
          measuredBytes: measured.partial ? measured.bytes : measured.bytes,
          reportedBytes: app.estimatedSizeBytes,
          files: measured.files,
          folders: measured.folders,
          partial: measured.partial || measured.reason === 'budget' || measured.reason === 'cancelled',
          reason: measured.reason || null,
          topFolders: measured.topFolders.slice(0, MAX_TOP_FOLDERS),
          appData,
          durationMs: Date.now() - started,
        };
        this.sizeCache.set(appId, result);
        results.push(result);
        app.size = {
          reportedBytes: app.estimatedSizeBytes,
          measuredBytes: measured.bytes,
          measuredAt: iso(this.now()),
          source: 'measured',
          partial: result.partial,
          filesMeasured: measured.files,
        };
        if (this.signatureCache.size) {
          const signature = this.signatureCache.get(appId);
          if (signature) app.signature = signature;
        }
      }
    } finally {
      this.operations.delete(operationId);
    }
    if (this.inventoryCache) {
      const measuredApps = this.inventoryCache.apps.filter((app) => app.size.measuredBytes != null);
      this.inventoryCache.kpis.measuredFootprintBytes = measuredApps.length
        ? measuredApps.reduce((sum, app) => sum + (app.size.measuredBytes || 0), 0)
        : null;
      this.inventoryCache.kpis.measuredFootprintApps = measuredApps.length;
    }
    return {
      observedAt: iso(this.now()),
      results,
      requested: requested.length,
      measured: results.filter((result) => result.measuredBytes != null).length,
      truncated,
      warnings,
    };
  }

  async isMeasurableFolder(value) {
    const folder = String(value || '');
    if (!folder) return { ok: false, reason: 'No install location is registered for this app.' };
    if (!path.isAbsolute(folder)) return { ok: false, reason: 'The registered install location is not an absolute path.' };
    const normalized = path.normalize(folder).toLowerCase().replace(/[\\/]+$/, '');
    const root = path.parse(folder).root.toLowerCase().replace(/[\\/]+$/, '');
    if (normalized === root) return { ok: false, reason: 'Measuring an entire volume root is not allowed.' };
    if (normalized === 'c:\\windows' || normalized === 'c:\\program files' || normalized === 'c:\\program files (x86)') {
      return { ok: false, reason: 'Shared Windows roots are not measured as one application footprint.' };
    }
    try {
      const stat = await fsp.lstat(folder);
      if (stat.isSymbolicLink()) return { ok: false, reason: 'Reparse-point install locations are not followed.' };
      if (!stat.isDirectory()) return { ok: false, reason: 'The registered install location is not a directory.' };
      return { ok: true, reason: null };
    } catch {
      return { ok: false, reason: 'The registered install location does not exist.' };
    }
  }

  async walkFolder(folder, { maxEntries, maxDepth, deadline, isCancelled }) {
    let bytes = 0;
    let files = 0;
    let folders = 0;
    let reason = null;
    const top = new Map();
    const stack = [{ dir: folder, depth: 0 }];
    while (stack.length) {
      if (isCancelled && isCancelled()) { reason = 'cancelled'; break; }
      if (Date.now() > deadline) { reason = 'budget'; break; }
      if (files + folders >= maxEntries) { reason = 'entry-limit'; break; }
      const current = stack.pop();
      if (!current || current.depth > maxDepth) continue;
      let entries;
      try {
        entries = await fsp.readdir(current.dir, { withFileTypes: true });
      } catch {
        continue;
      }
      folders += 1;
      for (const entry of entries) {
        if (files + folders >= maxEntries) { reason = 'entry-limit'; break; }
        const target = path.join(current.dir, entry.name);
        if (entry.isSymbolicLink()) continue;
        if (entry.isDirectory()) {
          stack.push({ dir: target, depth: current.depth + 1 });
          continue;
        }
        if (!entry.isFile()) continue;
        try {
          const stat = await fsp.stat(target);
          bytes += stat.size;
          files += 1;
          const relative = path.relative(folder, target);
          const first = relative.split(path.sep)[0];
          if (first && first !== relative) {
            top.set(first, (top.get(first) || 0) + stat.size);
          }
        } catch {
          // A locked or vanished file is omitted, not invented.
        }
      }
    }
    const topFolders = [...top.entries()]
      .map(([name, value]) => ({ name: clip(name, 80), bytes: value }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, MAX_TOP_FOLDERS);
    return { bytes, files, folders, partial: Boolean(reason), reason, topFolders };
  }

  async measureAppData(app, deadline) {
    const root = this.env?.LOCALAPPDATA || path.join(this.homeDir, 'AppData', 'Local');
    const tokens = normalizeTokens(app.name, app.publisher);
    if (!tokens.size) return null;
    try {
      const entries = await fsp.readdir(root, { withFileTypes: true });
      const match = entries
        .filter((entry) => entry.isDirectory())
        .find((entry) => {
          const normalized = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return [...tokens].some((token) => normalized.includes(token));
        });
      if (!match) return null;
      const folder = path.join(root, match.name);
      if (Date.now() > deadline) return null;
      const measured = typeof this.measureFolderSize === 'function'
        ? await this.measureFolderSize(folder, { maxEntries: 1500, maxDepth: 6, deadline: Math.min(deadline, Date.now() + 3000), isCancelled: () => false })
        : await this.walkFolder(folder, { maxEntries: 1500, maxDepth: 6, deadline: Math.min(deadline, Date.now() + 3000), isCancelled: () => false });
      return {
        path: this.redact(folder),
        bytes: measured.bytes,
        confidence: 'name-match',
      };
    } catch {
      return null;
    }
  }

  async leftovers() {
    if (!this.inventoryCache) await this.inventory();
    const observedAt = iso(this.now());
    const candidates = [];
    const stale = [];
    const scannedRoots = [];
    const warnings = [
      'A folder-name match is not proof of orphanhood. These are review candidates only.',
      'No file or registry value is changed, moved or deleted.',
    ];
    for (const app of this.inventoryCache.apps) {
      if (app.installLocation && app.installLocationExists === false && stale.length < MAX_LEFTOVER_CANDIDATES) {
        stale.push({
          id: stableId('stale', app.id),
          kind: 'stale-registration',
          label: app.name,
          path: app.installLocation,
          confidence: 'medium',
          reason: 'The uninstall registration points to an install location that was not found.',
          appId: app.id,
          sizeBytes: null,
        });
      }
    }
    candidates.push(...stale);

    const folderRoots = [
      { label: 'Local AppData', root: this.env?.LOCALAPPDATA || path.join(this.homeDir, 'AppData', 'Local') },
      { label: 'Roaming AppData', root: this.env?.APPDATA || path.join(this.homeDir, 'AppData', 'Roaming') },
      { label: 'ProgramData', root: this.env?.ProgramData || 'C:\\ProgramData' },
    ];
    const appTokens = new Set();
    for (const app of this.inventoryCache.apps) {
      for (const token of normalizeTokens(app.name, app.publisher)) appTokens.add(token);
    }
    for (const { label, root } of folderRoots) {
      let entries = [];
      let truncated = false;
      try {
        entries = (await fsp.readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory() && !entry.isSymbolicLink());
      } catch {
        scannedRoots.push({ root: label, entries: 0, truncated: false });
        continue;
      }
      if (entries.length > MAX_LEFTOVER_DIRS_PER_ROOT) {
        entries = entries.slice(0, MAX_LEFTOVER_DIRS_PER_ROOT);
        truncated = true;
      }
      scannedRoots.push({ root: label, entries: entries.length, truncated });
      for (const entry of entries) {
        if (candidates.length >= MAX_LEFTOVER_CANDIDATES + stale.length) break;
        const normalized = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!normalized || normalized.length < 4) continue;
        const matched = [...appTokens].some((token) => normalized.includes(token));
        if (matched) continue;
        candidates.push({
          id: stableId('leftover', label, entry.name),
          kind: 'appdata-folder',
          label: entry.name,
          path: this.redact(path.join(root, entry.name)),
          confidence: 'low',
          reason: 'No installed application name or publisher token matched this folder name.',
          appId: null,
          sizeBytes: null,
        });
        if (candidates.length >= MAX_LEFTOVER_CANDIDATES + stale.length) break;
      }
    }

    return {
      observedAt,
      candidates,
      scannedRoots,
      staleCount: stale.length,
      candidateCount: candidates.length - stale.length,
      truncated: candidates.length >= MAX_LEFTOVER_CANDIDATES + stale.length,
      mutation: 'none',
      warnings,
    };
  }

  async detectWinget() {
    if (this.wingetCache) return this.wingetCache;
    try {
      const { stdout } = await this.runner('winget.exe', ['--version'], {
        windowsHide: true,
        timeout: 10000,
        maxBuffer: 256 * 1024,
      });
      const version = clip(ansiStrip(stdout).split(/\r?\n/).find(Boolean) || '', 60) || null;
      this.wingetCache = { installed: true, version };
    } catch {
      this.wingetCache = { installed: false, version: null };
    }
    return this.wingetCache;
  }

  async updates({ check } = {}) {
    const winget = await this.detectWinget();
    const base = {
      observedAt: iso(this.now()),
      adapter: 'winget',
      installed: winget.installed,
      version: winget.version,
    };
    if (!winget.installed) {
      return {
        ...base,
        status: 'unavailable',
        items: [],
        note: 'WinGet is not installed or is not on PATH. No update claim can be measured.',
        rawLines: null,
      };
    }
    if (!check) {
      return {
        ...base,
        status: 'not-checked',
        items: [],
        note: 'WinGet is available. Update feeds are queried only when you press Check update feeds.',
        rawLines: null,
      };
    }
    try {
      const { stdout, stderr } = await this.runner(
        'winget.exe',
        ['upgrade', '--include-unknown', '--disable-interactivity'],
        { windowsHide: true, timeout: UPDATE_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024 }
      );
      const text = ansiStrip(`${stdout || ''}\n${stderr || ''}`);
      if (/agreement|accept.*source|source.*agreement/i.test(text) && !/No installed package/i.test(text)) {
        return {
          ...base,
          status: 'blocked',
          items: [],
          note: 'WinGet requested a source-agreement acceptance. Mission 05 never accepts agreements automatically; accept it interactively in WinGet, then retry.',
          rawLines: text.split(/\r?\n/).filter(Boolean).length,
        };
      }
      const parsed = this.parseWingetTable(text);
      if (parsed.items.length === 0 && parsed.dataLines > 0 && !/No installed package|No applicable update|No newer package/i.test(text)) {
        return {
          ...base,
          status: 'unsupported',
          items: [],
          note: `WinGet returned ${parsed.dataLines} non-empty line(s) that did not match its tabular upgrade format. No update was inferred.`,
          rawLines: parsed.dataLines,
        };
      }
      this.inventoryCache && (this.inventoryCache.kpis.updatesAvailable = parsed.items.length);
      return {
        ...base,
        status: 'available',
        items: parsed.items.slice(0, 300),
        note: parsed.items.length
          ? `${parsed.items.length} upgrade row(s) parsed from WinGet output.`
          : 'WinGet reported no applicable upgrades.',
        rawLines: parsed.dataLines,
      };
    } catch (error) {
      return {
        ...base,
        status: 'failed',
        items: [],
        note: `The read-only WinGet query failed: ${clip(error?.message || error, 200)}`,
        rawLines: null,
      };
    }
  }

  parseWingetTable(text) {
    const lines = String(text || '')
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+$/, ''))
      .filter((line) => line.trim().length > 0);
    let separator = -1;
    for (let index = 0; index < lines.length; index += 1) {
      if (/^-{5,}[\s-]*$/.test(lines[index].trim())) {
        separator = index;
        break;
      }
    }
    const dataLines = separator >= 0 ? lines.slice(separator + 1) : [];
    const items = [];
    for (const line of dataLines) {
      if (/^-{5,}/.test(line.trim())) continue;
      if (/^(Name|Nom|Nome|Nombre)\s{2,}/i.test(line)) continue;
      const columns = line.split(/\s{2,}/).map((value) => value.trim()).filter(Boolean);
      if (columns.length < 4) continue;
      const [name, id, current, available, source] = columns;
      if (!id || !/[.\w-]/.test(id)) continue;
      items.push({
        name: clip(name, 160),
        id: clip(id, 160),
        current: clip(current, 60) || null,
        available: clip(available, 60) || null,
        source: source ? clip(source, 60) : null,
      });
    }
    return { items, dataLines: dataLines.length };
  }

  async plan({ appIds } = {}) {
    const requested = Array.isArray(appIds) ? [...new Set(appIds.map(String))] : [];
    if (!requested.length) throw appError('APP_PLAN_EMPTY', 'Select at least one application for the review plan.');
    if (requested.length > MAX_PLAN_ITEMS) {
      throw appError('APP_PLAN_TOO_LARGE', `A review plan is limited to ${MAX_PLAN_ITEMS} applications.`);
    }
    if (!this.inventoryCache) await this.inventory();
    const createdAt = iso(this.now());
    const items = [];
    for (const appId of requested) {
      const app = this.inventoryCache.apps.find((entry) => entry.id === appId);
      if (!app) continue;
      const reasons = [];
      let risk = 'review';
      if (app.protected || app.nonRemovable || app.isSystemComponent) {
        risk = 'blocked';
        reasons.push(app.nonRemovable ? 'Windows marks this package as non-removable.' : 'The registry marks this entry as a system component.');
      } else {
        if (app.publisher && /microsoft/i.test(app.publisher)) {
          risk = 'high';
          reasons.push('Microsoft-published application: removing it can affect Windows features.');
        }
        if (app.startup.linked) {
          risk = 'high';
          reasons.push('The app is linked to a measured startup entry.');
        }
        if (app.isFramework) {
          risk = 'high';
          reasons.push('The entry is a shared framework or runtime.');
        }
        if (!app.uninstallMethod) {
          risk = 'high';
          reasons.push('No uninstall method is registered; removal would need manual evidence.');
        }
      }
      const reclaimBytes = app.size.measuredBytes ?? app.estimatedSizeBytes ?? null;
      const reclaimSource = app.size.measuredBytes != null ? 'measured' : app.estimatedSizeBytes != null ? 'reported' : 'unknown';
      items.push({
        appId,
        name: app.name,
        publisher: app.publisher,
        method: app.uninstallMethod,
        risk,
        reasons: reasons.length ? reasons : ['Registry evidence is complete enough to review.'],
        reclaimBytes,
        reclaimSource,
        reversible: false,
      });
    }
    if (!items.length) throw appError('APP_PLAN_EMPTY', 'None of the selected identifiers are in the measured inventory.');
    const sources = new Set(items.map((item) => item.reclaimSource));
    const reclaimSource = sources.size === 1 ? [...sources][0] : sources.size > 1 ? 'mixed' : 'unknown';
    const reclaimBytes = items.some((item) => item.reclaimBytes != null)
      ? items.reduce((sum, item) => sum + (item.reclaimBytes || 0), 0)
      : null;
    return {
      planId: stableId('plan', createdAt, requested.join(',')),
      contract: CONTRACT,
      createdAt,
      mode: 'uninstall',
      items,
      totals: {
        count: items.length,
        blocked: items.filter((item) => item.risk === 'blocked').length,
        reclaimBytes,
        reclaimSource,
      },
      restorePoint: {
        status: 'not-checked',
        reason: 'System Restore availability requires a separate read and is not queried by this plan preview.',
      },
      execution: {
        available: false,
        gate: 'Mission 08 — Cleanup execution',
        reason: 'No uninstall IPC exists. Execution requires an approved cleanup plan, per-target consent, elevation where required, verified postcondition and a recovery journal.',
      },
      immutable: true,
      mutation: 'none',
    };
  }

  async packages({ tab, query } = {}) {
    const winget = await this.detectWinget();
    const base = {
      observedAt: iso(this.now()),
      tab: tab === 'discover' ? 'discover' : 'installed',
      adapter: 'winget',
      installed: winget.installed,
      version: winget.version,
    };
    if (base.tab === 'installed') {
      if (!this.inventoryCache) await this.inventory();
      const packages = this.inventoryCache.apps
        .filter((app) => app.source === 'appx-msix')
        .slice(0, 500)
        .map((app) => ({
          name: app.name,
          id: app.evidence.packageFullName || app.id,
          version: app.version,
          source: 'Appx/MSIX',
        }));
      return {
        ...base,
        status: 'complete',
        packages,
        note: `${packages.length} Appx/MSIX package(s) measured locally.`,
        rawLines: null,
      };
    }
    if (!winget.installed) {
      return {
        ...base,
        status: 'unavailable',
        packages: [],
        note: 'WinGet is not installed, so no repository package can be discovered.',
        rawLines: null,
      };
    }
    const clean = String(query || '').trim();
    if (!/^[\w .+@/-]{1,60}$/.test(clean)) {
      throw appError('APP_PACKAGE_QUERY_INVALID', 'A package query of 1–60 letters, digits or . + @ / - is required.');
    }
    try {
      const { stdout, stderr } = await this.runner(
        'winget.exe',
        ['search', clean, '--disable-interactivity'],
        { windowsHide: true, timeout: UPDATE_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024 }
      );
      const text = ansiStrip(`${stdout || ''}\n${stderr || ''}`);
      if (/agreement|accept.*source/i.test(text) && !/No package found/i.test(text)) {
        return {
          ...base,
          status: 'blocked',
          packages: [],
          note: 'WinGet requested a source-agreement acceptance. This bridge never accepts agreements automatically.',
          rawLines: text.split(/\r?\n/).filter(Boolean).length,
        };
      }
      const parsed = this.parseWingetTable(text);
      if (!parsed.items.length && parsed.dataLines > 0 && !/No package found/i.test(text)) {
        return {
          ...base,
          status: 'unsupported',
          packages: [],
          note: `WinGet returned ${parsed.dataLines} line(s) that did not match its tabular format.`,
          rawLines: parsed.dataLines,
        };
      }
      return {
        ...base,
        status: 'complete',
        packages: parsed.items.slice(0, 100).map((item) => ({
          name: item.name,
          id: item.id,
          version: item.available || item.current,
          source: item.source || 'winget',
        })),
        note: parsed.items.length ? `${parsed.items.length} package row(s) parsed. Install is gated to Mission 11.` : 'WinGet reported no matching package.',
        rawLines: parsed.dataLines,
      };
    } catch (error) {
      return {
        ...base,
        status: 'failed',
        packages: [],
        note: `The read-only WinGet search failed: ${clip(error?.message || error, 200)}`,
        rawLines: null,
      };
    }
  }

  dispose() {
    this.operations.clear();
    this.inventoryCache = null;
    this.signatureCache.clear();
    this.sizeCache.clear();
  }
}

module.exports = {
  AppBridge,
  CONTRACT,
  SERVICE_DEFINITIONS,
  GATED_OPERATIONS,
  parseWingetTable: (text) => new AppBridge({ platform: 'win32', loadProvider: () => ({}) }).parseWingetTable(text),
};
