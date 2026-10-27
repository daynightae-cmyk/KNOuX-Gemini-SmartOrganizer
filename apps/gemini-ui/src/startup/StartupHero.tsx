/**
 * Boot Control hero — measured coverage, autorun KPIs and the Windows boot
 * evidence line. No boot duration or saving is rendered unless Windows
 * published it.
 */
import React from 'react';
import {
  Activity,
  ChevronRight,
  Clock3,
  Filter,
  Gauge,
  ListChecks,
  Play,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Square,
} from 'lucide-react';
import type { StartupController } from './useStartup';
import {
  formatCount,
  formatTime,
  formatTimestamp,
  formatUptime,
  t,
} from './model';
import type { StartupLocale, StartupServiceId } from './model';
import { OrbitalControl } from '../visual/OrbitalControl';

export interface StartupHeroProps {
  locale: StartupLocale;
  controller: StartupController;
  onOpenService: (service: StartupServiceId) => void;
}

function stageTone(status: string): string {
  if (status === 'complete') return 'is-complete';
  if (status === 'partial' || status === 'failed') return 'is-warn';
  if (status === 'running') return 'is-running';
  if (status === 'cancelled') return 'is-cancelled';
  return 'is-pending';
}

export function StartupHero({ locale, controller, onOpenService }: StartupHeroProps) {
  const summary = controller.inventory?.summary;
  const boot = controller.inventory?.boot;
  const events = boot?.events || [];
  const stages = controller.session?.stages || [];
  const scanning = controller.scanning;
  const activeStage = stages.find((stage) => stage.status === 'running') || null;

  return (
    <section className="stp-hero">
      <div className="stp-hero-arc" aria-hidden="true" />
      <div className="stp-hero-mesh" aria-hidden="true" />
      <div className="stp-hero-grain" aria-hidden="true" />

      <div className="stp-hero-head">
        <div className="stp-hero-mark">
          <Rocket className="w-6 h-6" />
        </div>
        <div className="stp-hero-title-wrap">
          <div className="stp-breadcrumb">
            <span>{t(locale, 'Windows', 'Windows')}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{t(locale, 'Startup', 'بدء التشغيل')}</span>
            <span className="stp-breadcrumb-tag">{t(locale, 'MISSION 09', 'المهمة 09')}</span>
          </div>
          <h1 className="stp-hero-title">{t(locale, 'Start faster. Stay in control.', 'ابدأ أسرع. وخليك متحكم.')}</h1>
          <p className="stp-hero-copy">
            {t(
              locale,
              'Measure every Windows autorun source, inspect protection and signature evidence, and stage changes without writing a single registry value.',
              'قِس كل مصادر بدء التشغيل في Windows، وافحص أدلة الحماية والتوقيع، وجهّز التغييرات دون كتابة أي قيمة في التسجيل.'
            )}
          </p>
        </div>
        <OrbitalControl title={t(locale, 'Analyze Startup', 'تحليل بدء التشغيل')} subtitle={t(locale, 'Measure · Inspect · Review', 'قِس · افحص · راجع')}
          eyebrow={t(locale, 'Startup scopes', 'نطاقات البدء')}
          onActivate={() => void controller.startScan()} disabled={!controller.nativeAvailable || scanning} running={scanning}
          tools={[
            { id: 'items', label: t(locale, 'Startup Items', 'عناصر البدء'), icon: ListChecks, onClick: () => onOpenService('startup-overview'), hint: t(locale, 'Measured autorun register', 'سجل بدء مقيس') },
            { id: 'impact', label: t(locale, 'Boot Impact', 'أثر الإقلاع'), icon: Gauge, onClick: () => onOpenService('startup-impact'), hint: t(locale, 'Measured boot impact', 'أثر إقلاع مقيس') },
            { id: 'delay', label: t(locale, 'Delay', 'التأخير'), icon: Clock3, onClick: () => onOpenService('startup-delay'), hint: t(locale, 'Delay policy preview', 'معاينة سياسة التأخير') },
            { id: 'tasks', label: t(locale, 'Tasks', 'المهام'), icon: Activity, onClick: () => onOpenService('startup-tasks'), hint: t(locale, 'Scheduled task autoruns', 'مهام مجدولة') },
            { id: 'filter', label: t(locale, 'Filter', 'تصفية'), icon: Filter, onClick: () => onOpenService('startup-filter'), hint: t(locale, 'Filter by impact and state', 'تصفية حسب الأثر والحالة') },
            { id: 'history', label: t(locale, 'History', 'السجل'), icon: RefreshCw, onClick: () => onOpenService('startup-journal'), hint: t(locale, 'Immutable preview journal', 'سجل معاينة ثابت') },
          ]} />
        <div className="stp-hero-actions">
          <button
            type="button"
            className="stp-btn stp-btn-ghost"
            onClick={() => void controller.refresh(true)}
            disabled={!controller.nativeAvailable || controller.refreshing || scanning}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${controller.refreshing ? 'stp-spin' : ''}`} />
            {t(locale, 'Refresh evidence', 'تحديث الأدلة')}
          </button>
          {scanning ? (
            <button
              type="button"
              className="stp-btn stp-btn-danger"
              onClick={() => void controller.cancelScan()}
              disabled={controller.cancelling}
            >
              <Square className="w-3.5 h-3.5" />
              {controller.cancelling
                ? t(locale, 'Cancelling…', 'جارٍ الإلغاء…')
                : t(locale, 'Cancel scan', 'إلغاء الفحص')}
            </button>
          ) : (
            <button
              type="button"
              className="stp-btn stp-btn-primary"
              data-testid="startup-scan-btn"
              onClick={() => void controller.startScan()}
              disabled={!controller.nativeAvailable}
            >
              <Play className="w-3.5 h-3.5" />
              {t(locale, 'Run measured scan', 'تشغيل فحص مقيس')}
            </button>
          )}
        </div>
      </div>

      <div className="stp-kpis">
        <div className="stp-kpi stp-kpi-entries">
          <div className="stp-kpi-icon"><ListChecks className="w-5 h-5" /></div>
          <div className="min-w-0">
            <div className="stp-kpi-value" data-testid="startup-kpi-entries-value">
              {summary ? formatCount(summary.total) : '—'}
            </div>
            <div className="stp-kpi-title">{t(locale, 'Autoruns measured', 'مداخل بدء مقيسة')}</div>
            <div className="stp-kpi-sub">
              {summary
                ? `${formatCount(summary.registry)} ${t(locale, 'registry', 'تسجيل')} · ${formatCount(summary.folders)} ${t(locale, 'folders', 'مجلدات')} · ${formatCount(summary.tasks)} ${t(locale, 'tasks', 'مهام')}`
                : t(locale, 'No measured inventory yet', 'لا يوجد جرد مقيس بعد')}
            </div>
          </div>
        </div>

        <div className="stp-kpi stp-kpi-protected">
          <div className="stp-kpi-icon"><ShieldCheck className="w-5 h-5" /></div>
          <div className="min-w-0">
            <div className="stp-kpi-value" data-testid="startup-kpi-protected-value">
              {summary ? formatCount(summary.protectedCount) : '—'}
            </div>
            <div className="stp-kpi-title">{t(locale, 'Windows protected', 'محمي بواسطة Windows')}</div>
            <div className="stp-kpi-sub">
              {summary
                ? `${formatCount(summary.elevationCount)} ${t(locale, 'need elevation', 'تحتاج رفع صلاحيات')} · ${formatCount(summary.activeCount)} ${t(locale, 'active', 'نشط')}`
                : t(locale, 'Protection rules are measured per entry', 'تُقاس قواعد الحماية لكل مدخل')}
            </div>
          </div>
        </div>

        <div className="stp-kpi stp-kpi-boot">
          <div className="stp-kpi-icon"><Activity className="w-5 h-5" /></div>
          <div className="min-w-0">
            <div className="stp-kpi-value">{boot?.available ? formatCount(boot.eventCount) : '—'}</div>
            <div className="stp-kpi-title">{t(locale, 'Boot diagnostics events', 'أحداث تشخيص الإقلاع')}</div>
            <div className="stp-kpi-sub">
              {boot?.lastBootAt
                ? `${t(locale, 'Last boot', 'آخر إقلاع')}: ${formatTimestamp(boot.lastBootAt, locale)}`
                : t(locale, 'Windows did not publish a boot event', 'لم ينشر Windows حدث إقلاع')}
            </div>
          </div>
        </div>

        <div className="stp-kpi stp-kpi-uptime">
          <div className="stp-kpi-icon"><Clock3 className="w-5 h-5" /></div>
          <div className="min-w-0">
            <div className="stp-kpi-value">{formatUptime(boot?.uptimeSeconds)}</div>
            <div className="stp-kpi-title">{t(locale, 'Measured uptime', 'مدة التشغيل المقيسة')}</div>
            <div className="stp-kpi-sub">
              {t(locale, 'Win32_OperatingSystem.LastBootUpTime', 'Win32_OperatingSystem.LastBootUpTime')}
            </div>
          </div>
        </div>
      </div>

      <div className="stp-bootline" data-testid="startup-bootline">
        <div className="stp-bootline-head">
          <span className="stp-bootline-title">
            <Gauge className="w-3.5 h-3.5" />
            {scanning
              ? t(locale, 'Measured scan stages', 'مراحل الفحص المقيس')
              : t(locale, 'Boot evidence timeline', 'الخط الزمني لأدلة الإقلاع')}
          </span>
          <button
            type="button"
            className="stp-link"
            onClick={() => onOpenService('startup-impact')}
          >
            {t(locale, 'Impact timeline', 'خط الأثر الزمني')}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {scanning && stages.length ? (
          <div className="stp-stagerail" role="list" aria-label={t(locale, 'Scan stages', 'مراحل الفحص')}>
            {stages.map((stage) => (
              <div key={stage.key} role="listitem" className={`stp-stage ${stageTone(stage.status)}`}>
                <span className="stp-stage-dot" />
                <span className="stp-stage-label">{locale === 'ar' ? stage.labelAr : stage.labelEn}</span>
                <span className="stp-stage-state">{stage.status}</span>
              </div>
            ))}
            {activeStage ? (
              <span className="stp-stage-current">
                {locale === 'ar' ? activeStage.labelAr : activeStage.labelEn}
              </span>
            ) : null}
          </div>
        ) : events.length ? (
          <div className="stp-timeline" role="list" aria-label={t(locale, 'Measured boot events', 'أحداث الإقلاع المقيسة')}>
            {events.slice(0, 10).map((event) => (
              <div
                key={event.id}
                role="listitem"
                className={`stp-timeline-event is-${eventLevelTone(event.level)}`}
                title={`${event.message || event.provider} · ${formatTimestamp(event.timeCreated, locale)}`}
              >
                <span className="stp-timeline-time">{formatTime(event.timeCreated, locale)}</span>
                <span className="stp-timeline-dot" />
                <span className="stp-timeline-label">
                  {event.eventId == null ? t(locale, 'Event', 'حدث') : `#${event.eventId}`}
                </span>
              </div>
            ))}
            <div className="stp-timeline-tail">
              <span>{t(locale, 'Measured Windows events only', 'أحداث Windows المقيسة فقط')}</span>
            </div>
          </div>
        ) : (
          <div className="stp-bootline-empty">
            <span className="stp-bootline-pulse" />
            <span>
              {t(
                locale,
                'No Diagnostics-Performance boot event was published. No duration or saving is estimated.',
                'لم يُنشر أي حدث إقلاع من Diagnostics-Performance. لا تُقدَّر أي مدة أو توفير.'
              )}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function eventLevelTone(level: string | null | undefined): 'good' | 'warn' | 'bad' | 'muted' {
  const text = String(level || '').toLowerCase();
  if (/critical|error|فشل|خطأ/.test(text)) return 'bad';
  if (/warning|تحذير/.test(text)) return 'warn';
  if (/information|info|معلومات/.test(text)) return 'good';
  return 'muted';
}
