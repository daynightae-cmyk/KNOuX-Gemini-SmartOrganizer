/**
 * Twelve Boot Control service workspaces. Every card navigates to measured
 * evidence; no card claims a mutation channel that does not exist.
 */
import React from 'react';
import {
  Activity,
  CalendarClock,
  Clock3,
  Cpu,
  FileCheck2,
  FolderTree,
  Gauge,
  Layers,
  ListFilter,
  PowerOff,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type { StartupController } from './useStartup';
import {
  SERVICE_ACCENTS,
  SERVICE_FALLBACK_META,
  SERVICE_IDS,
  formatCount,
  serviceStateLabel,
  t,
} from './model';
import type { StartupLocale, StartupServiceId } from './model';

export interface ServiceRailProps {
  locale: StartupLocale;
  controller: StartupController;
  selectedCount: number;
  onOpenService: (service: StartupServiceId) => void;
}

export function serviceIcon(key: StartupServiceId, className = 'w-3.5 h-3.5') {
  switch (key) {
    case 'startup-overview': return <Layers className={className} />;
    case 'startup-disable': return <PowerOff className={className} />;
    case 'startup-restore': return <RotateCcw className={className} />;
    case 'startup-sources': return <FolderTree className={className} />;
    case 'startup-journal': return <FileCheck2 className={className} />;
    case 'startup-filter': return <ListFilter className={className} />;
    case 'startup-impact': return <Gauge className={className} />;
    case 'startup-services': return <Cpu className={className} />;
    case 'startup-tasks': return <CalendarClock className={className} />;
    case 'startup-delay': return <Clock3 className={className} />;
    case 'startup-batch': return <Sparkles className={className} />;
    case 'startup-undo-all': return <ShieldAlert className={className} />;
    default: return <Activity className={className} />;
  }
}

function measuredSummary(
  key: StartupServiceId,
  controller: StartupController,
  selectedCount: number,
  locale: StartupLocale
): string {
  const { inventory, impact, journal, sessions, plan } = controller;
  const summary = inventory?.summary;
  const fallback = SERVICE_FALLBACK_META[key][locale === 'ar' ? 'descAr' : 'descEn'];

  switch (key) {
    case 'startup-overview':
      return summary
        ? `${formatCount(summary.total)} ${t(locale, 'autoruns', 'مدخل بدء')} · ${formatCount(summary.registry)} ${t(locale, 'registry', 'تسجيل')}`
        : fallback;
    case 'startup-disable':
      return plan && (plan.mode === 'disable' || plan.mode === 'enable')
        ? `${formatCount(plan.itemCount)} ${t(locale, 'staged item(s)', 'عنصرًا مُهيَّأ')} · ${t(locale, 'gated', 'محجوب')}`
        : selectedCount
          ? `${formatCount(selectedCount)} ${t(locale, 'selected for review', 'محدد للمراجعة')}`
          : fallback;
    case 'startup-restore':
      return journal
        ? (journal.entries.length
          ? `${formatCount(journal.entries.length)} ${t(locale, 'journal entries', 'مدخل سجل')}`
          : t(locale, 'No change to restore', 'لا يوجد تغيير للاستعادة'))
        : fallback;
    case 'startup-sources':
      return inventory?.coverage
        ? `${formatCount(inventory.coverage.registryKeys)} ${t(locale, 'keys', 'مفتاح')} · ${formatCount(inventory.coverage.startupFolders)} ${t(locale, 'folders', 'مجلد')}`
        : fallback;
    case 'startup-journal':
      return journal
        ? t(locale, 'Empty append-only journal', 'سجل إضافي فارغ')
        : fallback;
    case 'startup-filter':
      return summary
        ? `${formatCount(summary.total)} ${t(locale, 'queryable entries', 'مدخلًا قابلًا للاستعلام')}`
        : fallback;
    case 'startup-impact':
      return impact
        ? (impact.available
          ? `${formatCount(impact.events.length)} ${t(locale, 'measured boot events', 'حدث إقلاع مقيس')}`
          : t(locale, 'Boot diagnostics unavailable', 'تشخيص الإقلاع غير متاح'))
        : fallback;
    case 'startup-services':
      return inventory?.services.length
        ? `${formatCount(inventory.services.length)} ${t(locale, 'boot services', 'خدمة إقلاع')}`
        : fallback;
    case 'startup-tasks':
      return inventory?.tasks.length
        ? `${formatCount(inventory.tasks.length)} ${t(locale, 'logon tasks', 'مهمة دخول')}`
        : fallback;
    case 'startup-delay':
      return plan?.mode === 'delay'
        ? `${formatCount(plan.itemCount)} ${t(locale, 'delay drafts', 'مسودة تأخير')}`
        : selectedCount
          ? `${formatCount(selectedCount)} ${t(locale, 'selected for delay', 'محدد للتأخير')}`
          : fallback;
    case 'startup-batch':
      return plan?.mode === 'batch'
        ? `${formatCount(plan.itemCount)} ${t(locale, 'batched item(s)', 'عنصرًا في الدفعة')}`
        : selectedCount
          ? `${formatCount(selectedCount)} ${t(locale, 'queued for batch', 'في قائمة الدفعة')}`
          : fallback;
    case 'startup-undo-all':
      return sessions
        ? t(locale, 'No batch session exists', 'لا توجد جلسة دفعة')
        : fallback;
    default:
      return fallback;
  }
}

export function ServiceRail({ locale, controller, selectedCount, onOpenService }: ServiceRailProps) {
  const capabilityMap = new Map((controller.capabilities?.services || []).map((service) => [service.id, service]));

  return (
    <section className="stp-panel stp-services" data-testid="startup-services" aria-labelledby="stp-services-title">
      <header className="stp-panel-head">
        <div>
          <h2 id="stp-services-title" className="stp-panel-title">
            {t(locale, 'Boot Control specialisations', 'تخصصات التحكم في الإقلاع')}
          </h2>
          <p className="stp-panel-sub">
            {t(
              locale,
              'Twelve read-only workbenches over one measured inventory. Mutation, elevation and rollback stay declared as gates.',
              'اثنتا عشرة ورشة للقراءة فقط على جرد مقيس واحد. التغيير ورفع الصلاحيات والتراجع تبقى بوابات معلنة.'
            )}
          </p>
        </div>
        <span className="stp-chip stp-chip-muted">
          {formatCount(controller.capabilities?.serviceCount || SERVICE_IDS.length)} {t(locale, 'services', 'خدمة')}
        </span>
      </header>

      <div className="stp-service-grid">
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
          const note = capability ? (locale === 'ar' ? capability.noteAr : capability.noteEn) : null;
          return (
            <button
              key={id}
              type="button"
              data-testid={`startup-service-${id}`}
              className="stp-service-card"
              onClick={() => onOpenService(id)}
              title={note || summary}
              aria-label={`${title} — ${summary}`}
            >
              <span
                className="stp-service-icon"
                style={{ color: accent, borderColor: `${accent}55`, background: `${accent}18` }}
              >
                {serviceIcon(id)}
              </span>
              <span className="stp-service-copy">
                <span className="stp-service-title">{title}</span>
                <span className="stp-service-sub" title={provider ? `${summary} · ${provider}` : summary}>{summary}</span>
              </span>
              {state ? (
                <span className={`stp-state stp-state-${state}`}>{serviceStateLabel(state, locale)}</span>
              ) : (
                <span className="stp-state stp-state-native">{t(locale, 'Native', 'أصلي')}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
