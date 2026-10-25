import type {
  AppRecord,
  AppSignatureResult,
  AppSignatureState,
  AppSizeResult,
  AppStartupEntry,
  AppUpdatesResult,
} from '../../shared/native-contracts';
import type { DomainServiceKey } from '../lib/app-inventory';

export type AppsLocale = 'en' | 'ar';

export interface AppsFilters {
  query: string;
  scope: 'all' | 'per-user' | 'per-machine' | 'packaged';
  source: 'all' | 'uninstall-registry' | 'appx-msix';
  view: 'all' | 'desktop' | 'packaged' | 'protected' | 'startup' | 'stale';
  sort: 'name' | 'publisher' | 'size' | 'date';
}

export const DEFAULT_FILTERS: AppsFilters = {
  query: '',
  scope: 'all',
  source: 'all',
  view: 'all',
  sort: 'name',
};

const AR_DIGITS = new Intl.NumberFormat('en-US');

export function formatBytes(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value < 1024) return `${Math.round(value)} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let scaled = value / 1024;
  let index = 0;
  while (scaled >= 1024 && index < units.length - 1) {
    scaled /= 1024;
    index += 1;
  }
  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `${scaled.toFixed(digits)} ${units[index]}`;
}

export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return AR_DIGITS.format(Math.round(value));
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${Math.round(value)}%`;
}

export function formatDate(value: string | null | undefined, locale: AppsLocale): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function formatTimestamp(value: string | null | undefined, locale: AppsLocale): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function scopeLabel(scope: AppRecord['scope'], locale: AppsLocale): string {
  if (locale === 'ar') {
    if (scope === 'per-user') return 'لكل مستخدم';
    if (scope === 'packaged') return 'حزمة موقعة';
    return 'لكل الجهاز';
  }
  if (scope === 'per-user') return 'Per user';
  if (scope === 'packaged') return 'Packaged';
  return 'Per machine';
}

export function sourceLabel(source: AppRecord['source'], locale: AppsLocale): string {
  if (source === 'appx-msix') return 'Appx / MSIX';
  return locale === 'ar' ? 'سجل إلغاء التثبيت' : 'Uninstall registry';
}

export function signatureLabel(status: AppSignatureState, locale: AppsLocale): string {
  const map: Record<AppSignatureState, [string, string]> = {
    valid: ['Valid signature', 'توقيع صالح'],
    invalid: ['Invalid signature', 'توقيع غير صالح'],
    unsigned: ['Unsigned', 'بدون توقيع'],
    unknown: ['Unverified', 'غير مؤكد'],
    unavailable: ['Not checked', 'لم يُفحص'],
    unchecked: ['Not checked', 'لم يُفحص'],
  };
  return locale === 'ar' ? map[status][1] : map[status][0];
}

export function signatureTone(status: AppSignatureState): 'good' | 'bad' | 'warn' | 'muted' {
  if (status === 'valid') return 'good';
  if (status === 'invalid' || status === 'unsigned') return 'bad';
  if (status === 'unavailable') return 'muted';
  return 'warn';
}

export function removalMethodLabel(method: AppRecord['uninstallMethod'], locale: AppsLocale): string {
  if (!method) return locale === 'ar' ? 'غير مسجل' : 'Not registered';
  if (method === 'msi') return 'MSI';
  if (method === 'appx-package') return locale === 'ar' ? 'حزمة Appx' : 'Appx package';
  return locale === 'ar' ? 'أمر إزالة' : 'Uninstall string';
}

export function startupSourceLabel(source: string, locale: AppsLocale): string {
  const map: Record<string, [string, string]> = {
    'registry-run-user': ['User Run key', 'مفتاح Run للمستخدم'],
    'registry-run-machine': ['Machine Run key', 'مفتاح Run للجهاز'],
    'startup-folder-user': ['User Startup folder', 'مجلد بدء المستخدم'],
    'startup-folder-common': ['Common Startup folder', 'مجلد بدء مشترك'],
    'startup-task': ['Scheduled task', 'مهمة مجدولة'],
    other: ['Other source', 'مصدر آخر'],
  };
  const entry = map[source] || map.other;
  return locale === 'ar' ? entry[1] : entry[0];
}

function normalized(value: string | null | undefined): string {
  return String(value || '').toLowerCase().normalize('NFKD');
}

export function sizeOf(app: AppRecord): number | null {
  return app.size.measuredBytes ?? app.estimatedSizeBytes ?? null;
}

export function filterApps(apps: AppRecord[], filters: AppsFilters): AppRecord[] {
  const query = normalized(filters.query);
  const filtered = apps.filter((app) => {
    if (filters.scope !== 'all' && app.scope !== filters.scope) return false;
    if (filters.source !== 'all' && app.source !== filters.source) return false;
    if (filters.view === 'desktop' && app.source !== 'uninstall-registry') return false;
    if (filters.view === 'packaged' && app.source !== 'appx-msix') return false;
    if (filters.view === 'protected' && !app.protected) return false;
    if (filters.view === 'startup' && !app.startup.linked) return false;
    if (filters.view === 'stale' && !(app.installLocation && app.installLocationExists === false)) return false;
    if (!query) return true;
    const haystack = normalized(
      [app.name, app.publisher, app.version, app.productCode, app.evidence.packageFullName, app.registryRoot]
        .filter(Boolean)
        .join(' ')
    );
    return haystack.includes(query);
  });
  return [...filtered].sort((left, right) => {
    if (filters.sort === 'publisher') {
      return (left.publisher || '').localeCompare(right.publisher || '') || left.name.localeCompare(right.name);
    }
    if (filters.sort === 'date') {
      const leftDate = left.installDate || '';
      const rightDate = right.installDate || '';
      return rightDate.localeCompare(leftDate) || left.name.localeCompare(right.name);
    }
    if (filters.sort === 'size') {
      return (sizeOf(right) || 0) - (sizeOf(left) || 0) || left.name.localeCompare(right.name);
    }
    return left.name.localeCompare(right.name);
  });
}

export interface PublisherGroup {
  publisher: string;
  count: number;
  verified: number;
  invalid: number;
  unchecked: number;
  apps: AppRecord[];
  trust: 'verified' | 'mixed' | 'unchecked';
}

export function groupPublishers(
  apps: AppRecord[],
  signatures: Record<string, AppSignatureResult>
): PublisherGroup[] {
  const groups = new Map<string, PublisherGroup>();
  for (const app of apps) {
    const publisher = app.publisher || 'Unknown publisher';
    const group = groups.get(publisher) || {
      publisher,
      count: 0,
      verified: 0,
      invalid: 0,
      unchecked: 0,
      apps: [],
      trust: 'unchecked' as const,
    };
    group.count += 1;
    group.apps.push(app);
    const status = signatures[app.id]?.status || app.signature.status;
    if (status === 'valid') group.verified += 1;
    else if (status === 'invalid' || status === 'unsigned') group.invalid += 1;
    else group.unchecked += 1;
    groups.set(publisher, group);
  }
  return [...groups.values()]
    .map<PublisherGroup>((group) => ({
      ...group,
      trust: group.verified > 0 && group.verified === group.count
        ? 'verified'
        : group.invalid > 0 || group.verified > 0
          ? 'mixed'
          : 'unchecked',
    }))
    .sort((left, right) => right.count - left.count || left.publisher.localeCompare(right.publisher));
}

export function recentApps(apps: AppRecord[], days: number | 'all'): AppRecord[] {
  const dated = apps.filter((app) => app.installDate);
  const cutoff = days === 'all' ? null : Date.now() - days * 24 * 60 * 60 * 1000;
  return dated
    .filter((app) => {
      if (!cutoff) return true;
      const date = new Date(`${app.installDate}T00:00:00Z`).getTime();
      return Number.isFinite(date) && date >= cutoff;
    })
    .sort((left, right) => (right.installDate || '').localeCompare(left.installDate || ''));
}

export function startupRows(entries: AppStartupEntry[]): Array<AppStartupEntry & { tone: 'linked' | 'unlinked' }> {
  return entries
    .map((entry) => ({ ...entry, tone: entry.linkedAppId ? 'linked' as const : 'unlinked' as const }))
    .sort((left, right) => Number(right.tone === 'linked') - Number(left.tone === 'linked') || left.name.localeCompare(right.name));
}

export function sizeRows(
  apps: AppRecord[],
  sizes: Record<string, AppSizeResult>
): Array<{ app: AppRecord; measured: AppSizeResult | null }> {
  return apps
    .map((app) => ({ app, measured: sizes[app.id] || null }))
    .sort((left, right) => {
      const leftBytes = left.measured?.measuredBytes ?? left.app.estimatedSizeBytes ?? 0;
      const rightBytes = right.measured?.measuredBytes ?? right.app.estimatedSizeBytes ?? 0;
      return rightBytes - leftBytes;
    });
}

export function updateStatusLabel(updates: AppUpdatesResult | null, locale: AppsLocale): string {
  if (!updates) return locale === 'ar' ? 'لم يُفحص' : 'Not checked';
  if (updates.status === 'not-checked') return locale === 'ar' ? 'لم يُفحص' : 'Not checked';
  if (updates.status === 'available') return locale === 'ar' ? 'مقيس' : 'Measured';
  if (updates.status === 'unavailable') return locale === 'ar' ? 'غير متاح' : 'Unavailable';
  if (updates.status === 'failed') return locale === 'ar' ? 'فشل' : 'Failed';
  return locale === 'ar' ? 'غير مدعوم' : 'Unsupported';
}

export function serviceTitle(service: DomainServiceKey, locale: AppsLocale): string {
  const titles: Record<DomainServiceKey, [string, string]> = {
    'app-inventory': ['Installed Applications Register', 'سجل التطبيقات المثبتة'],
    'app-identity': ['App Identity & Authenticode', 'هوية التطبيق و Authenticode'],
    'app-search': ['Multi-Parameter Search', 'البحث متعدد المعايير'],
    'app-publisher': ['Publisher Intelligence', 'استخبارات الناشرين'],
    'app-recent': ['Recently Changed Applications', 'التطبيقات الحديثة التغيير'],
    'app-uninstall-queue': ['Uninstall Queue & Batch Review', 'قائمة الإزالة والمراجعة الجماعية'],
    'app-leftovers': ['Orphaned Leftover Evidence', 'أدلة البقايا اليتيمة'],
    'app-updates': ['Software Update Center', 'مركز تحديث البرامج'],
    'app-size': ['Software Footprint', 'البصمة التخزينية للبرامج'],
    'app-store-packages': ['Package Center & WinGet Browser', 'مركز الحزم ومستكشف WinGet'],
    'app-associations': ['File Extension & Protocol Matrix', 'مصفوفة الامتدادات والبروتوكولات'],
    'app-startup-impact': ['Boot Impact Analyzer', 'محلل تأثير الإقلاع'],
  };
  return locale === 'ar' ? titles[service][1] : titles[service][0];
}

export function t(locale: AppsLocale, en: string, ar: string): string {
  return locale === 'ar' ? ar : en;
}

export function serviceStateLabel(state: 'available' | 'partial' | 'gated', locale: AppsLocale): string {
  if (state === 'available') return locale === 'ar' ? 'متاح' : 'AVAILABLE';
  if (state === 'partial') return locale === 'ar' ? 'جزئي' : 'PARTIAL';
  return locale === 'ar' ? 'مقيّد' : 'GATED';
}

export function serviceDescription(service: DomainServiceKey, locale: AppsLocale): string {
  const descriptions: Record<DomainServiceKey, [string, string]> = {
    'app-inventory': ['Dense measured register with publisher and registry evidence.', 'سجل كثيف مقيس مع أدلة الناشر والسجل.'],
    'app-identity': ['Authenticode status, signer chain and package identity for one app.', 'حالة Authenticode وسلسلة التوقيع وهوية الحزمة لتطبيق واحد.'],
    'app-search': ['Instant multi-parameter query over the measured inventory.', 'استعلام فوري متعدد المعايير على الجرد المقيس.'],
    'app-publisher': ['Vendors grouped by measured signing evidence, not reputation claims.', 'ناشرون مجمعون حسب أدلة التوقيع المقيسة، لا ادعاءات السمعة.'],
    'app-recent': ['Install dates and installer evidence; modification history is not tracked.', 'تواريخ التثبيت وأدلة المثبت؛ سجل التعديل غير متتبع.'],
    'app-uninstall-queue': ['Immutable review plan, dependency risk and blocked execution gate.', 'خطة مراجعة ثابتة ومخاطر التبعية وبوابة تنفيذ محجوبة.'],
    'app-leftovers': ['Name-match candidates and stale registrations; nothing is deleted.', 'مرشحات مطابقة أسماء وتسجيلات قديمة؛ لا يُحذف شيء.'],
    'app-updates': ['Read-only WinGet upgrade evidence and a gated update proposal.', 'أدلة تحديث WinGet للقراءة فقط واقتراح تحديث محجوب.'],
    'app-size': ['Reported versus measured install footprint with bounded scans.', 'البصمة المبلغة مقابل المقيسة مع فحص محدود.'],
    'app-store-packages': ['Installed Appx/MSIX packages and optional WinGet discovery.', 'حزم Appx/MSIX المثبتة واستكشاف WinGet الاختياري.'],
    'app-associations': ['Bounded association sample with a Settings handoff, never a write.', 'عينة ارتباطات محدودة مع انتقال للإعدادات، دون أي كتابة.'],
    'app-startup-impact': ['Measured startup linkage; boot seconds are never invented.', 'ارتباط الإقلاع مقيس؛ ثواني الإقلاع لا تُختلق أبداً.'],
  };
  return locale === 'ar' ? descriptions[service][1] : descriptions[service][0];
}
