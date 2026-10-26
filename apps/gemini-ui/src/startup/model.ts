/**
 * KNOuX Boot Control model (Mission 09).
 *
 * Presentation metadata, deterministic formatting and read-only filtering.
 * Every entry, service, task, boot event and plan arrives from the measured
 * StartupBridge. Nothing here invents a boot duration, a saving or a change.
 */
import type {
  StartupBootEvent,
  StartupEntry,
  StartupPlan,
  StartupServiceEntry,
  StartupTaskEntry,
} from '../../shared/native-contracts';

export type StartupLocale = 'en' | 'ar';
export type StartupSourceKind = StartupEntry['sourceKind'];
export type StartupState = StartupEntry['state'];

export interface StartupFilters {
  query: string;
  source: 'all' | StartupSourceKind;
  scope: 'all' | StartupEntry['scope'];
  state: 'all' | StartupState;
  signature: 'all' | StartupEntry['signature'];
  prevention: 'all' | StartupEntry['protection'];
  sort: 'name' | 'source' | 'state' | 'signature';
}

export const DEFAULT_FILTERS: StartupFilters = {
  query: '',
  source: 'all',
  scope: 'all',
  state: 'all',
  signature: 'all',
  prevention: 'all',
  sort: 'name',
};

export const ENTRY_SOURCES: StartupSourceKind[] = [
  'registry-run',
  'registry-runonce',
  'startup-folder',
  'scheduled-task',
];

export const SOURCE_META: Record<
  StartupSourceKind,
  { en: string; ar: string; short: string; accent: string }
> = {
  'registry-run': { en: 'Registry Run', ar: 'تسجيل Run', short: 'RUN', accent: '#22d3ee' },
  'registry-runonce': { en: 'Registry RunOnce', ar: 'تسجيل RunOnce', short: 'ONCE', accent: '#38bdf8' },
  'startup-folder': { en: 'Startup Folder', ar: 'مجلد البدء', short: 'LNK', accent: '#a78bfa' },
  'scheduled-task': { en: 'Logon Task', ar: 'مهمة دخول', short: 'TASK', accent: '#fbbf24' },
};

export const SIGNATURE_META: Record<
  StartupEntry['signature'],
  { en: string; ar: string; tone: 'good' | 'warn' | 'bad' | 'muted' }
> = {
  valid: { en: 'Valid signature', ar: 'توقيع صالح', tone: 'good' },
  untrusted: { en: 'Untrusted signer', ar: 'موقّع غير موثوق', tone: 'warn' },
  unsigned: { en: 'Unsigned', ar: 'غير موقّع', tone: 'bad' },
  unavailable: { en: 'Signature unavailable', ar: 'التوقيع غير متاح', tone: 'muted' },
};

export const STATE_META: Record<
  StartupState,
  { en: string; ar: string; tone: 'good' | 'bad' | 'muted' }
> = {
  enabled: { en: 'Enabled', ar: 'مفعّل', tone: 'good' },
  disabled: { en: 'Disabled', ar: 'معطّل', tone: 'bad' },
  unknown: { en: 'Unknown', ar: 'غير معروف', tone: 'muted' },
};

export const SCOPE_META: Record<
  StartupEntry['scope'],
  { en: string; ar: string }
> = {
  user: { en: 'Current user', ar: 'المستخدم الحالي' },
  machine: { en: 'All users', ar: 'كل المستخدمين' },
};

export const SERVICE_STARTUP_META: Record<
  StartupServiceEntry['startupType'],
  { en: string; ar: string; tone: 'good' | 'warn' | 'bad' | 'muted' }
> = {
  automatic: { en: 'Automatic', ar: 'تلقائي', tone: 'warn' },
  delayed: { en: 'Delayed auto', ar: 'تلقائي مؤجل', tone: 'good' },
  manual: { en: 'Manual', ar: 'يدوي', tone: 'muted' },
  disabled: { en: 'Disabled', ar: 'معطّل', tone: 'bad' },
  unknown: { en: 'Unknown', ar: 'غير معروف', tone: 'muted' },
};

export const BOOT_EVENT_META: Record<number, { en: string; ar: string }> = {
  100: { en: 'Boot performance monitoring', ar: 'مراقبة أداء الإقلاع' },
  101: { en: 'Slow startup', ar: 'إقلاع بطيء' },
  102: { en: 'Slow shutdown', ar: 'إغلاق بطيء' },
  103: { en: 'Slow resume', ar: 'استئناف بطيء' },
  109: { en: 'Device startup', ar: 'بدء جهاز' },
  110: { en: 'Device resume', ar: 'استئناف جهاز' },
};

export const SERVICE_IDS = [
  'startup-overview',
  'startup-disable',
  'startup-restore',
  'startup-sources',
  'startup-journal',
  'startup-filter',
  'startup-impact',
  'startup-services',
  'startup-tasks',
  'startup-delay',
  'startup-batch',
  'startup-undo-all',
] as const;

export type StartupServiceId = (typeof SERVICE_IDS)[number];

export const SERVICE_ACCENTS: Record<StartupServiceId, string> = {
  'startup-overview': '#22d3ee',
  'startup-disable': '#f43f5e',
  'startup-restore': '#34d399',
  'startup-sources': '#60a5fa',
  'startup-journal': '#a78bfa',
  'startup-filter': '#06b6d4',
  'startup-impact': '#fbbf24',
  'startup-services': '#3b82f6',
  'startup-tasks': '#c084fc',
  'startup-delay': '#f59e0b',
  'startup-batch': '#f472b6',
  'startup-undo-all': '#fb7185',
};

export const SERVICE_FALLBACK_META: Record<
  StartupServiceId,
  { titleEn: string; titleAr: string; descEn: string; descAr: string }
> = {
  'startup-overview': {
    titleEn: 'Windows Boot Autorun Register',
    titleAr: 'سجل بدء تشغيل Windows',
    descEn: 'Measured autorun entries and the Windows startup sequence',
    descAr: 'مداخل بدء مقيسة وتسلسل إقلاع Windows',
  },
  'startup-disable': {
    titleEn: 'Autorun State Change Preview',
    titleAr: 'معاينة تعطيل بدء التشغيل',
    descEn: 'Immutable disable review with protection checks',
    descAr: 'مراجعة تعطيل ثابتة مع فحص الحماية',
  },
  'startup-restore': {
    titleEn: 'Startup Restoration & Rollback',
    titleAr: 'استعادة بدء التشغيل',
    descEn: 'Journal timeline and original-value evidence',
    descAr: 'خط زمني للسجل وأدلة القيمة الأصلية',
  },
  'startup-sources': {
    titleEn: 'Autorun Source Coverage Map',
    titleAr: 'خريطة مصادر البدء',
    descEn: 'HKCU, HKLM, folders, tasks and services coverage',
    descAr: 'تغطية HKCU وHKLM والمجلدات والمهام والخدمات',
  },
  'startup-journal': {
    titleEn: 'Startup Change Audit Journal',
    titleAr: 'سجل تغييرات البدء',
    descEn: 'Append-only evidence with before/after state',
    descAr: 'أدلة إضافية فقط مع الحالة قبل وبعد',
  },
  'startup-filter': {
    titleEn: 'Keyboard-First Autorun Query Console',
    titleAr: 'مستشار تصفية البدء',
    descEn: 'Keyboard-first facets over measured autoruns',
    descAr: 'تصفية بلوحة المفاتيح على مداخل بدء مقيسة',
  },
  'startup-impact': {
    titleEn: 'Boot Sequence Impact Timeline',
    titleAr: 'أثر تسلسل الإقلاع',
    descEn: 'Measured Diagnostics-Performance boot events',
    descAr: 'أحداث إقلاع مقيسة من Diagnostics-Performance',
  },
  'startup-services': {
    titleEn: 'Service Boot Policy Matrix',
    titleAr: 'مصفوفة خدمات البدء',
    descEn: 'Automatic and delayed-auto service evidence',
    descAr: 'أدلة الخدمات التلقائية والمؤجلة',
  },
  'startup-tasks': {
    titleEn: 'Logon Scheduled Task Timeline',
    titleAr: 'مهام تسجيل الدخول',
    descEn: 'Task triggers, run history and publisher evidence',
    descAr: 'محفزات المهام وسجل التشغيل وأدلة الناشر',
  },
  'startup-delay': {
    titleEn: 'Delayed Launch Planner',
    titleAr: 'مخطط التأخير',
    descEn: 'Original trigger versus staged delay lanes',
    descAr: 'المحفز الأصلي مقابل مسارات التأخير',
  },
  'startup-batch': {
    titleEn: 'Autorun Batch Staging Tray',
    titleAr: 'دفعة بدء التشغيل',
    descEn: 'Queued actions, affected sources and rights',
    descAr: 'الإجراءات المصطفة والمصادر والحقوق',
  },
  'startup-undo-all': {
    titleEn: 'Batch Recovery & Mass Rollback',
    titleAr: 'التراجع الجماعي',
    descEn: 'Journal sessions, restoration order and collisions',
    descAr: 'جلسات السجل وترتيب الاستعادة والتعارضات',
  },
};

export const PLAN_MODE_META: Record<StartupPlan['mode'], { en: string; ar: string }> = {
  disable: { en: 'Disable review', ar: 'مراجعة التعطيل' },
  enable: { en: 'Enable review', ar: 'مراجعة التفعيل' },
  delay: { en: 'Delay review', ar: 'مراجعة التأخير' },
  restore: { en: 'Restore review', ar: 'مراجعة الاستعادة' },
  batch: { en: 'Batch review', ar: 'مراجعة الدفعة' },
  rollback: { en: 'Rollback review', ar: 'مراجعة التراجع' },
};

export const PLAN_ACTION_META: Record<StartupPlan['items'][number]['action'], { en: string; ar: string }> = {
  disable: { en: 'Disable', ar: 'تعطيل' },
  enable: { en: 'Enable', ar: 'تفعيل' },
  delay: { en: 'Delay', ar: 'تأخير' },
  restore: { en: 'Restore', ar: 'استعادة' },
  rollback: { en: 'Roll back', ar: 'تراجع' },
};

export function t(locale: StartupLocale, en: string, ar: string): string {
  return locale === 'ar' ? ar : en;
}

const NUMBER = new Intl.NumberFormat('en-US');

export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return NUMBER.format(Math.round(value));
}

export function formatTimestamp(value: string | null | undefined, locale: StartupLocale): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(value: string | null | undefined, locale: StartupLocale): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function formatTime(value: string | null | undefined, locale: StartupLocale): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '—';
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${total % 60}s`;
  return `${total}s`;
}

export function formatDelay(delayMs: number | null | undefined, locale: StartupLocale): string {
  if (delayMs == null || !Number.isFinite(delayMs)) return t(locale, 'Not published', 'غير منشور');
  if (delayMs < 1000) return `${Math.round(delayMs)} ms`;
  return `${(delayMs / 1000).toFixed(delayMs >= 10000 ? 0 : 1)} s`;
}

export function sourceLabel(kind: StartupSourceKind, locale: StartupLocale): string {
  return SOURCE_META[kind][locale === 'ar' ? 'ar' : 'en'];
}

export function stateLabel(state: StartupState, locale: StartupLocale): string {
  return STATE_META[state][locale === 'ar' ? 'ar' : 'en'];
}

export function signatureLabel(signature: StartupEntry['signature'], locale: StartupLocale): string {
  return SIGNATURE_META[signature][locale === 'ar' ? 'ar' : 'en'];
}

export function scopeLabel(scope: StartupEntry['scope'], locale: StartupLocale): string {
  return SCOPE_META[scope][locale === 'ar' ? 'ar' : 'en'];
}

export function protectionLabel(protection: StartupEntry['protection'], locale: StartupLocale): string {
  return protection === 'protected'
    ? t(locale, 'Windows protected', 'محمي بواسطة Windows')
    : t(locale, 'Standard', 'قياسي');
}

export function serviceStartupLabel(type: StartupServiceEntry['startupType'], locale: StartupLocale): string {
  return SERVICE_STARTUP_META[type][locale === 'ar' ? 'ar' : 'en'];
}

export function taskTriggerLabel(triggers: string[], locale: StartupLocale): string {
  const labels = triggers.map((trigger) => {
    if (/logon/i.test(trigger)) return t(locale, 'At logon', 'عند تسجيل الدخول');
    if (/boot/i.test(trigger)) return t(locale, 'At boot', 'عند الإقلاع');
    return trigger;
  });
  return labels.join(' · ') || t(locale, 'No logon/boot trigger read', 'لم يُقرأ محفز دخول/إقلاع');
}

export function bootEventLabel(eventId: number | null, locale: StartupLocale): string {
  if (eventId == null) return t(locale, 'Boot event', 'حدث إقلاع');
  const meta = BOOT_EVENT_META[eventId];
  return meta ? meta[locale === 'ar' ? 'ar' : 'en'] : t(locale, `Boot event ${eventId}`, `حدث إقلاع ${eventId}`);
}

export function planModeLabel(mode: StartupPlan['mode'], locale: StartupLocale): string {
  return PLAN_MODE_META[mode][locale === 'ar' ? 'ar' : 'en'];
}

export function planActionLabel(action: StartupPlan['items'][number]['action'], locale: StartupLocale): string {
  return PLAN_ACTION_META[action][locale === 'ar' ? 'ar' : 'en'];
}

export function serviceStateLabel(
  state: 'available' | 'partial' | 'gated',
  locale: StartupLocale
): string {
  if (state === 'available') return t(locale, 'Available', 'متاح');
  if (state === 'partial') return t(locale, 'Partial', 'جزئي');
  return t(locale, 'Gated', 'محجوب');
}

function normalized(value: string | null | undefined): string {
  return String(value || '').toLowerCase().normalize('NFKD');
}

export function filterEntries(entries: StartupEntry[], filters: StartupFilters): StartupEntry[] {
  const query = normalized(filters.query);
  const filtered = entries.filter((entry) => {
    if (filters.source !== 'all' && entry.sourceKind !== filters.source) return false;
    if (filters.scope !== 'all' && entry.scope !== filters.scope) return false;
    if (filters.state !== 'all' && entry.state !== filters.state) return false;
    if (filters.signature !== 'all' && entry.signature !== filters.signature) return false;
    if (filters.prevention !== 'all' && entry.protection !== filters.prevention) return false;
    if (!query) return true;
    return normalized(
      [
        entry.name,
        entry.publisher,
        entry.command,
        entry.executable,
        entry.location,
        entry.taskPath,
        entry.description,
        entry.triggers.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
    ).includes(query);
  });
  return [...filtered].sort((left, right) => {
    if (filters.sort === 'source') {
      return left.sourceKind.localeCompare(right.sourceKind) || left.name.localeCompare(right.name);
    }
    if (filters.sort === 'state') {
      return left.state.localeCompare(right.state) || left.name.localeCompare(right.name);
    }
    if (filters.sort === 'signature') {
      return left.signature.localeCompare(right.signature) || left.name.localeCompare(right.name);
    }
    return left.name.localeCompare(right.name);
  });
}

export function sourceCounts(entries: StartupEntry[]): Record<'all' | StartupSourceKind, number> {
  const counts = {
    all: entries.length,
    'registry-run': 0,
    'registry-runonce': 0,
    'startup-folder': 0,
    'scheduled-task': 0,
  } as Record<'all' | StartupSourceKind, number>;
  for (const entry of entries) counts[entry.sourceKind] += 1;
  return counts;
}

export function visibleTasks(tasks: StartupTaskEntry[], query: string): StartupTaskEntry[] {
  const needle = normalized(query);
  if (!needle) return tasks;
  return tasks.filter((task) =>
    normalized([task.name, task.path, task.author, task.userId, task.execute, task.triggers.join(' ')].filter(Boolean).join(' ')).includes(needle)
  );
}

export function visibleServices(services: StartupServiceEntry[], query: string): StartupServiceEntry[] {
  const needle = normalized(query);
  if (!needle) return services;
  return services.filter((service) =>
    normalized([service.name, service.displayName, service.account, service.binaryPath].filter(Boolean).join(' ')).includes(needle)
  );
}

export function bootEventSearch(events: StartupBootEvent[], query: string): StartupBootEvent[] {
  const needle = normalized(query);
  if (!needle) return events;
  return events.filter((event) =>
    normalized([event.message, event.provider, event.level, event.properties.join(' ')].filter(Boolean).join(' ')).includes(needle)
  );
}

export function eventLevelTone(level: string | null | undefined): 'good' | 'warn' | 'bad' | 'muted' {
  const text = String(level || '').toLowerCase();
  if (/critical|error|فشل|خطأ/.test(text)) return 'bad';
  if (/warning|تحذير/.test(text)) return 'warn';
  if (/information|info|معلومات/.test(text)) return 'good';
  return 'muted';
}

export function shortId(id: string | null | undefined): string {
  if (!id) return '—';
  const parts = id.split(':');
  return parts.length > 1 ? `${parts[0]}:${parts[1].slice(0, 8)}` : id.slice(0, 12);
}
