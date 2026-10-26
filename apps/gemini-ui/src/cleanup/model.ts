/**
 * KNOuX Clean Room model (Mission 08).
 *
 * Presentation metadata and deterministic formatting only. Every number shown
 * by the workspace arrives from the read-only CleanupBridge; nothing here
 * invents candidates, sizes or reclaimed bytes.
 */
import type {
  CleanupCandidate,
  CleanupCategory,
  CleanupPlan,
  CleanupRisk,
  CleanupSafety,
} from '../../shared/native-contracts';

export type CleanupLocale = 'en' | 'ar';

export interface CleanupFilters {
  query: string;
  category: 'all' | CleanupCategory;
  safety: 'all' | CleanupSafety;
  sort: 'size' | 'age' | 'name';
}

export const DEFAULT_FILTERS: CleanupFilters = {
  query: '',
  category: 'all',
  safety: 'all',
  sort: 'size',
};

export const SCAN_CATEGORIES: CleanupCategory[] = ['temp', 'browser', 'logs', 'recycle', 'update'];

export const CATEGORY_META: Record<
  CleanupCategory,
  { en: string; ar: string; color: string; short: string }
> = {
  temp: { en: 'Temporary Files', ar: 'ملفات مؤقتة', color: '#a78bfa', short: 'TMP' },
  browser: { en: 'Browser Cache', ar: 'ذاكرة المتصفح', color: '#22d3ee', short: 'WEB' },
  logs: { en: 'Diagnostic Logs', ar: 'سجلات التشخيص', color: '#fbbf24', short: 'LOG' },
  recycle: { en: 'Recycle Bin', ar: 'سلة المحذوفات', color: '#34d399', short: 'BIN' },
  update: { en: 'Windows Update', ar: 'تحديث Windows', color: '#60a5fa', short: 'WU' },
  unused: { en: 'Unused Items', ar: 'عناصر غير مستخدمة', color: '#f472b6', short: 'AGE' },
};

export const SAFETY_META: Record<
  CleanupSafety,
  { en: string; ar: string; tone: 'good' | 'warn' | 'bad' }
> = {
  eligible: { en: 'Eligible', ar: 'مؤهل', tone: 'good' },
  review: { en: 'Needs review', ar: 'يحتاج مراجعة', tone: 'warn' },
  blocked: { en: 'Blocked', ar: 'محجوب', tone: 'bad' },
};

export const RISK_META: Record<CleanupRisk, { en: string; ar: string; tone: 'good' | 'warn' | 'bad' }> = {
  low: { en: 'Low risk', ar: 'خطورة منخفضة', tone: 'good' },
  medium: { en: 'Medium risk', ar: 'خطورة متوسطة', tone: 'warn' },
  high: { en: 'High risk', ar: 'خطورة عالية', tone: 'warn' },
  blocked: { en: 'Protected', ar: 'محمي', tone: 'bad' },
};

export function t(locale: CleanupLocale, en: string, ar: string): string {
  return locale === 'ar' ? ar : en;
}

const NUMBER = new Intl.NumberFormat('en-US');

export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return NUMBER.format(Math.round(value));
}

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

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${Math.round(value)}%`;
}

export function formatDate(value: string | null | undefined, locale: CleanupLocale): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function formatTimestamp(value: string | null | undefined, locale: CleanupLocale): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatAge(days: number | null | undefined, locale: CleanupLocale): string {
  if (days == null || !Number.isFinite(days)) return '—';
  if (days < 1) return t(locale, 'under a day', 'أقل من يوم');
  const rounded = Math.round(days);
  return t(locale, `${NUMBER.format(rounded)} d`, `${NUMBER.format(rounded)} يوم`);
}

export function categoryLabel(key: CleanupCategory | 'all', locale: CleanupLocale): string {
  if (key === 'all') return t(locale, 'All Candidates', 'كل المرشحين');
  return CATEGORY_META[key][locale === 'ar' ? 'ar' : 'en'];
}

export function safetyLabel(safety: CleanupSafety, locale: CleanupLocale): string {
  return SAFETY_META[safety][locale === 'ar' ? 'ar' : 'en'];
}

export function riskLabel(risk: CleanupRisk, locale: CleanupLocale): string {
  return RISK_META[risk][locale === 'ar' ? 'ar' : 'en'];
}

function normalized(value: string | null | undefined): string {
  return String(value || '').toLowerCase().normalize('NFKD');
}

export function filterCandidates(candidates: CleanupCandidate[], filters: CleanupFilters): CleanupCandidate[] {
  const query = normalized(filters.query);
  const filtered = candidates.filter((candidate) => {
    if (filters.category !== 'all' && candidate.category !== filters.category) return false;
    if (filters.safety !== 'all' && candidate.safety !== filters.safety) return false;
    if (!query) return true;
    return normalized(
      [candidate.name, candidate.path, candidate.source, candidate.provider, candidate.action]
        .filter(Boolean)
        .join(' ')
    ).includes(query);
  });
  return [...filtered].sort((left, right) => {
    if (filters.sort === 'name') return left.name.localeCompare(right.name);
    if (filters.sort === 'age') return (right.ageDays || 0) - (left.ageDays || 0) || left.name.localeCompare(right.name);
    return (right.sizeBytes || 0) - (left.sizeBytes || 0) || left.name.localeCompare(right.name);
  });
}

export function categoryCounts(candidates: CleanupCandidate[]): Record<'all' | CleanupCategory, number> {
  const counts = {
    all: candidates.length,
    temp: 0,
    browser: 0,
    logs: 0,
    recycle: 0,
    update: 0,
    unused: 0,
  } as Record<'all' | CleanupCategory, number>;
  for (const candidate of candidates) counts[candidate.category] += 1;
  return counts;
}

export function categoryBytes(candidates: CleanupCandidate[]): Array<{ key: CleanupCategory; bytes: number; count: number; color: string }> {
  const totals = new Map<CleanupCategory, { bytes: number; count: number }>();
  for (const candidate of candidates) {
    const entry = totals.get(candidate.category) || { bytes: 0, count: 0 };
    entry.bytes += candidate.sizeBytes || 0;
    entry.count += 1;
    totals.set(candidate.category, entry);
  }
  return SCAN_CATEGORIES.concat('unused')
    .filter((key) => totals.has(key))
    .map((key) => ({
      key,
      bytes: totals.get(key)?.bytes || 0,
      count: totals.get(key)?.count || 0,
      color: CATEGORY_META[key].color,
    }));
}

export function daysUntilPurge(quarantinedAt: string | null | undefined, retentionDays: number): number | null {
  if (!quarantinedAt) return null;
  const start = new Date(quarantinedAt).getTime();
  if (!Number.isFinite(start)) return null;
  const end = start + Math.max(0, retentionDays) * 86400000;
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

export const SERVICE_IDS = [
  'cleanup-temp-preview',
  'cleanup-temp-quarantine',
  'cleanup-temp-undo',
  'cleanup-quarantine-list',
  'cleanup-estimate',
  'cleanup-recycle',
  'cleanup-unused',
  'cleanup-update-cache',
  'cleanup-browser-cache',
  'cleanup-logs',
  'cleanup-schedule',
  'cleanup-reports',
] as const;

export type CleanupServiceId = (typeof SERVICE_IDS)[number];

export const SERVICE_ACCENTS: Record<CleanupServiceId, string> = {
  'cleanup-temp-preview': '#8b5cf6',
  'cleanup-temp-quarantine': '#f43f5e',
  'cleanup-temp-undo': '#10b981',
  'cleanup-quarantine-list': '#a855f7',
  'cleanup-estimate': '#f59e0b',
  'cleanup-recycle': '#3b82f6',
  'cleanup-unused': '#ec4899',
  'cleanup-update-cache': '#14b8a6',
  'cleanup-browser-cache': '#0ea5e9',
  'cleanup-logs': '#ef4444',
  'cleanup-schedule': '#eab308',
  'cleanup-reports': '#6366f1',
};

/**
 * Browser-preview fallback titles only. In Electron the rail prefers the
 * native capability labels so drift is visible and never silently invented.
 */
export const SERVICE_FALLBACK_META: Record<
  CleanupServiceId,
  { titleEn: string; titleAr: string; descEn: string; descAr: string }
> = {
  'cleanup-temp-preview': {
    titleEn: 'Temporary File Preview',
    titleAr: 'معاينة الملفات المؤقتة',
    descEn: 'Measured temp candidates and safety classes',
    descAr: 'مرشحو الملفات المؤقتة وتصنيفات الأمان',
  },
  'cleanup-temp-quarantine': {
    titleEn: 'Quarantine Cleanup',
    titleAr: 'حجر التنظيف',
    descEn: 'Stage a recoverable quarantine review',
    descAr: 'إعداد مراجعة حجر قابلة للاسترداد',
  },
  'cleanup-temp-undo': {
    titleEn: 'Undo Cleanup',
    titleAr: 'التراجع عن التنظيف',
    descEn: 'Journal timeline and recovery evidence',
    descAr: 'الخط الزمني للسجل وأدلة الاسترداد',
  },
  'cleanup-quarantine-list': {
    titleEn: 'Quarantine Browser',
    titleAr: 'مستعرض الحجر',
    descEn: 'Vault files, retention and restoration limits',
    descAr: 'ملفات الحجر والاحتفاظ وحدود الاستعادة',
  },
  'cleanup-estimate': {
    titleEn: 'Reclaim Estimate',
    titleAr: 'تقدير المساحة المستعادة',
    descEn: 'Eligible, review and blocked space evidence',
    descAr: 'أدلة المساحات المؤهلة والمراجعة والمحجوبة',
  },
  'cleanup-recycle': {
    titleEn: 'Recycle Bin',
    titleAr: 'سلة المحذوفات',
    descEn: 'Per-volume baskets and deletion ledger',
    descAr: 'سلال لكل وحدة وسجل الحذف',
  },
  'cleanup-unused': {
    titleEn: 'Unused Items',
    titleAr: 'العناصر غير المستخدمة',
    descEn: 'Dormancy bands inside an authorized source',
    descAr: 'نطاقات الخمول داخل مصدر مصرّح به',
  },
  'cleanup-update-cache': {
    titleEn: 'Windows Update Cache',
    titleAr: 'ذاكرة تحديث Windows',
    descEn: 'Servicing sizes and the official handoff',
    descAr: 'أحجام الخدمة والتسليم الرسمي',
  },
  'cleanup-browser-cache': {
    titleEn: 'Browser Cache',
    titleAr: 'ذاكرة المتصفح',
    descEn: 'Profile cache with cookies and passwords excluded',
    descAr: 'ذاكرة الملفات الشخصية مع استبعاد الارتباطات وكلمات المرور',
  },
  'cleanup-logs': {
    titleEn: 'Log Explorer',
    titleAr: 'مستكشف السجلات',
    descEn: 'Crash dumps, WER and protected event logs',
    descAr: 'تفريغات الأعطال وWER وسجلات الأحداث المحمية',
  },
  'cleanup-schedule': {
    titleEn: 'Cleanup Scheduler',
    titleAr: 'مجدول التنظيف',
    descEn: 'Read-only scan draft and quiet hours',
    descAr: 'مسودة فحص للقراءة فقط وساعات هادئة',
  },
  'cleanup-reports': {
    titleEn: 'Cleanup Reports',
    titleAr: 'تقارير التنظيف',
    descEn: 'Before/after evidence with a local export',
    descAr: 'أدلة قبل/بعد مع تصدير محلي',
  },
};

export const PLAN_MODE_META: Record<
  CleanupPlan['mode'],
  { en: string; ar: string }
> = {
  quarantine: { en: 'Quarantine staging', ar: 'تهيئة الحجر' },
  recycle: { en: 'Recycle Bin review', ar: 'مراجعة سلة المحذوفات' },
  restore: { en: 'Restoration draft', ar: 'مسودة الاستعادة' },
  purge: { en: 'Purge review', ar: 'مراجعة الإزالة' },
  archive: { en: 'Archive review', ar: 'مراجعة الأرشفة' },
};

export function planModeLabel(mode: CleanupPlan['mode'], locale: CleanupLocale): string {
  return PLAN_MODE_META[mode][locale === 'ar' ? 'ar' : 'en'];
}

export function serviceStateLabel(
  state: 'available' | 'partial' | 'gated',
  locale: CleanupLocale
): string {
  if (state === 'available') return t(locale, 'Available', 'متاح');
  if (state === 'partial') return t(locale, 'Partial', 'جزئي');
  return t(locale, 'Gated', 'محجوب');
}
