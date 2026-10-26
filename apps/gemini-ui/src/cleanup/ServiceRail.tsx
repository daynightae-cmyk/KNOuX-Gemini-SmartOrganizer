/**
 * Twelve Clean Room service workspaces. Cards are navigation into measured
 * evidence; no card claims a capability the native bridge did not report.
 */
import React from 'react';
import {
  Archive,
  Calculator,
  CalendarClock,
  FileCode2,
  FileSpreadsheet,
  FileWarning,
  Globe,
  HardDrive,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { CleanupCategory } from '../../shared/native-contracts';
import type { CleanupController } from './useCleanup';
import {
  SERVICE_ACCENTS,
  SERVICE_FALLBACK_META,
  SERVICE_IDS,
  formatBytes,
  formatCount,
  serviceStateLabel,
  t,
} from './model';
import type { CleanupLocale, CleanupServiceId } from './model';

export interface ServiceRailProps {
  locale: CleanupLocale;
  controller: CleanupController;
  selectedCount: number;
  onOpenService: (service: CleanupServiceId) => void;
}

export function serviceIcon(key: CleanupServiceId, className = 'w-3.5 h-3.5') {
  switch (key) {
    case 'cleanup-temp-preview': return <FileWarning className={className} />;
    case 'cleanup-temp-quarantine': return <ShieldCheck className={className} />;
    case 'cleanup-temp-undo': return <RotateCcw className={className} />;
    case 'cleanup-quarantine-list': return <Archive className={className} />;
    case 'cleanup-estimate': return <Calculator className={className} />;
    case 'cleanup-recycle': return <Trash2 className={className} />;
    case 'cleanup-unused': return <Sparkles className={className} />;
    case 'cleanup-update-cache': return <HardDrive className={className} />;
    case 'cleanup-browser-cache': return <Globe className={className} />;
    case 'cleanup-logs': return <FileCode2 className={className} />;
    case 'cleanup-schedule': return <CalendarClock className={className} />;
    case 'cleanup-reports': return <FileSpreadsheet className={className} />;
    default: return <Sparkles className={className} />;
  }
}

function categoryStat(
  controller: CleanupController,
  key: CleanupCategory
): { count: number; bytes: number } | null {
  const entry = controller.inventory?.summary?.categories?.[key];
  if (!entry) return null;
  return { count: entry.count || 0, bytes: entry.bytes || 0 };
}

function measuredSummary(
  key: CleanupServiceId,
  controller: CleanupController,
  selectedCount: number,
  locale: CleanupLocale
): string {
  const { inventory, quarantine, unused, schedule, report } = controller;
  const temp = categoryStat(controller, 'temp');
  const browser = categoryStat(controller, 'browser');
  const logs = categoryStat(controller, 'logs');
  const recycle = categoryStat(controller, 'recycle');
  const update = categoryStat(controller, 'update');
  const fallback = SERVICE_FALLBACK_META[key][locale === 'ar' ? 'descAr' : 'descEn'];

  switch (key) {
    case 'cleanup-temp-preview':
      return temp
        ? `${formatCount(temp.count)} ${t(locale, 'measured items', 'عنصرًا مقيسًا')} · ${formatBytes(temp.bytes)}`
        : fallback;
    case 'cleanup-temp-quarantine':
      if (quarantine) {
        return `${formatBytes(quarantine.vault.totalBytes)} ${t(locale, 'vaulted', 'في الحجر')} · ${formatCount(quarantine.vault.items.length)} ${t(locale, 'entries', 'عنصرًا')}`;
      }
      return selectedCount
        ? `${formatCount(selectedCount)} ${t(locale, 'selected for review', 'محدد للمراجعة')}`
        : t(locale, 'Open to stage a quarantine review', 'افتح لإعداد مراجعة حجر');
    case 'cleanup-temp-undo':
      return quarantine
        ? `${formatCount(quarantine.journal.entries.length)} ${t(locale, 'journal entries', 'مدخل سجل')}`
        : t(locale, 'Journal not read yet', 'لم يُقرأ السجل بعد');
    case 'cleanup-quarantine-list':
      return quarantine
        ? `${formatCount(quarantine.vault.items.length)} ${t(locale, 'vault files', 'ملفًا في الحجر')}`
        : t(locale, 'Vault not read yet', 'لم يُقرأ الحجر بعد');
    case 'cleanup-estimate':
      return inventory?.summary
        ? `${formatBytes(inventory.summary.eligibleBytes)} ${t(locale, 'eligible evidence', 'دليل مؤهل')}`
        : fallback;
    case 'cleanup-recycle':
      return recycle || inventory?.recycleItems?.length
        ? `${formatCount(inventory?.recycleItems?.length || recycle?.count || 0)} ${t(locale, 'bin items', 'عنصرًا في السلة')} · ${formatBytes(recycle?.bytes || 0)}`
        : fallback;
    case 'cleanup-unused':
      if (unused) {
        if (unused.status === 'needs-source') return t(locale, 'Studio source required', 'مطلوب مصدر Studio');
        if (unused.status === 'index-required') return t(locale, 'Source index required', 'مطلوب فهرس المصدر');
        return `${formatCount(unused.items.length)} ${t(locale, 'dormant items', 'عنصرًا خاملًا')} · ${formatCount(unused.ageDays)} d`;
      }
      return fallback;
    case 'cleanup-update-cache':
      return update
        ? `${formatBytes(update.bytes)} ${t(locale, 'servicing evidence', 'دليل خدمة')}`
        : fallback;
    case 'cleanup-browser-cache':
      return browser
        ? `${formatBytes(browser.bytes)} ${t(locale, 'cache measured', 'ذاكرة مقيسة')}`
        : fallback;
    case 'cleanup-logs':
      return logs
        ? `${formatBytes(logs.bytes)} ${t(locale, 'log evidence', 'دليل سجلات')}`
        : fallback;
    case 'cleanup-schedule':
      return schedule
        ? `${formatCount(schedule.occurrences.length)} ${t(locale, 'draft occurrences', 'موعدًا في المسودة')}`
        : fallback;
    case 'cleanup-reports':
      return report
        ? `${formatCount(report.summary.candidates)} ${t(locale, 'measured candidates', 'مرشحًا مقيسًا')}`
        : fallback;
    default:
      return fallback;
  }
}

export function ServiceRail({ locale, controller, selectedCount, onOpenService }: ServiceRailProps) {
  const capabilityMap = new Map((controller.capabilities?.services || []).map((service) => [service.id, service]));

  return (
    <section className="cln-panel cln-services" data-testid="cleanup-services" aria-labelledby="cln-services-title">
      <header className="cln-panel-head">
        <div>
          <h2 id="cln-services-title" className="cln-panel-title">
            {t(locale, 'Cleanup specialisations', 'تخصصات التنظيف')}
          </h2>
          <p className="cln-panel-sub">
            {t(
              locale,
              'Twelve read-only workbenches over the same measured evidence. Gated actions stay declared.',
              'اثنتا عشرة ورشة للقراءة فقط على الأدلة المقيسة نفسها. الإجراءات المحجوبة تبقى معلنة.'
            )}
          </p>
        </div>
        <span className="cln-chip cln-chip-muted">
          {formatCount(controller.capabilities?.serviceCount || SERVICE_IDS.length)} {t(locale, 'services', 'خدمة')}
        </span>
      </header>

      <div className="cln-service-grid">
        {SERVICE_IDS.map((id) => {
          const capability = capabilityMap.get(id);
          const fallback = SERVICE_FALLBACK_META[id];
          const accent = SERVICE_ACCENTS[id];
          const state = capability?.state || null;
          const title = capability
            ? (locale === 'ar' ? capability.labelAr : capability.labelEn)
            : (locale === 'ar' ? fallback.titleAr : fallback.titleEn);
          const summary = measuredSummary(id, controller, selectedCount, locale);
          const provider = capability?.provider || null;
          const note = capability
            ? (locale === 'ar' ? capability.noteAr : capability.noteEn)
            : null;
          return (
            <button
              key={id}
              type="button"
              data-testid={`cleanup-service-${id}`}
              className="cln-service-card"
              onClick={() => onOpenService(id)}
              title={note || summary}
              aria-label={`${title} — ${summary}`}
            >
              <span
                className="cln-service-icon"
                style={{ color: accent, borderColor: `${accent}55`, background: `${accent}18` }}
              >
                {serviceIcon(id)}
              </span>
              <span className="cln-service-copy">
                <span className="cln-service-title">{title}</span>
                <span className="cln-service-sub" title={provider ? `${summary} · ${provider}` : summary}>
                  {summary}
                </span>
              </span>
              {state ? (
                <span className={`cln-state cln-state-${state}`}>{serviceStateLabel(state, locale)}</span>
              ) : (
                <span className="cln-state cln-state-native">{t(locale, 'Native', 'أصلي')}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
