import { LiveServiceStage } from '../components/workbench/LiveServiceStage';
import type { SystemLocale } from './catalog';
import { formatCount, formatPercent, formatRate, formatTimestamp, t } from './model';
import type { SystemController } from './useSystem';

/**
 * System process strip (Mission 10 inner workspace).
 *
 * Presentation only. Every status token, count, timestamp and stage row is read
 * from the live SystemBridge session or the measured snapshot; the strip never
 * simulates progress, never invents a reading and never advertises a mutation
 * channel that this read-only domain does not expose.
 */
export interface SystemLiveStageProps {
  controller: SystemController;
  locale: SystemLocale;
  /** Currently selected registry id, or null for the measured overview. */
  service: string | null;
  title: string;
}

export function SystemLiveStage({ controller: c, locale, service, title }: SystemLiveStageProps) {
  const snapshot = c.snapshot;
  const metrics = snapshot?.metrics ?? null;
  const running = c.loading || c.scanning || c.refreshing || c.sampling || c.cancelling || Boolean(c.busy);
  const capability = service ? c.capabilities?.services.find((entry) => entry.id === service) : undefined;
  const coverage = snapshot?.coverage ?? [];
  const completeStages = coverage.filter((stage) => stage.status === 'complete').length;
  const unavailableStages = coverage.filter((stage) => stage.status === 'unavailable').length;
  const session = c.session;

  const status = !c.nativeAvailable
    ? 'UNAVAILABLE'
    : running
      ? 'RUNNING'
      : c.actionError
        ? 'FAILED'
        : session?.status === 'cancelled'
          ? 'CANCELLED'
          : capability?.state === 'gated'
            ? 'GATED'
            : snapshot
              ? (unavailableStages || snapshot.warnings.length ? 'PARTIAL' : 'READY')
              : 'IDLE';

  const subtitle =
    c.actionError?.message ||
    (c.scanning
      ? t(
          locale,
          'Reading the bounded native observatory stages. Discovery is read-only; nothing is mutated.',
          'قراءة مراحل المرصد الأصلية المحدودة. الاكتشاف للقراءة فقط؛ لا يتم تغيير أي شيء.',
        )
      : capability
        ? locale === 'ar'
          ? capability.noteAr
          : capability.noteEn
        : snapshot
          ? `${formatCount(completeStages)}/${formatCount(coverage.length)} ${t(locale, 'measured stages complete', 'مرحلة مقيسة مكتملة')} · ${t(locale, 'read-only observation', 'مراقبة للقراءة فقط')}`
          : t(
              locale,
              'No measured snapshot yet. Start the bounded scan to read identity, processes, services, events, drivers, network, sockets, hardware and the timeline.',
              'لا توجد لقطة مقيسة بعد. ابدأ المسح المحدود لقراءة الهوية والعمليات والخدمات والأحداث وبرامج التشغيل والشبكة والمقابس والعتاد والخط الزمني.',
            ));

  // Session warnings only carry information while no snapshot has been published.
  const warnings = snapshot ? snapshot.warnings : (session?.warnings ?? []);
  const stages = session?.stages ?? [];

  return (
    <LiveServiceStage
      title={title}
      subtitle={subtitle}
      status={status}
      running={running}
      progress={c.scanning && session ? session.progress : null}
      isArabic={locale === 'ar'}
    >
      <div className="sys-live-facts" data-testid="system-live-facts">
        <span>{metrics?.source || c.capabilities?.engine || 'SystemBridge'}</span>
        <span>
          {snapshot
            ? `${formatCount(snapshot.processes.length)} ${t(locale, 'processes', 'عملية')} · ${formatCount(snapshot.services.length)} ${t(locale, 'services', 'خدمة')} · ${formatCount(snapshot.events.length)} ${t(locale, 'events', 'حدث')}`
            : t(locale, 'Not measured', 'غير مقيس')}
        </span>
        <span>
          {formatCount(snapshot?.interfaces.length ?? null)} {t(locale, 'interfaces', 'واجهة')} · {formatCount(snapshot?.sockets.length ?? null)} {t(locale, 'sockets', 'مقبس')}
        </span>
        <span>
          {metrics ? `${formatPercent(metrics.cpuPercent, 1)} CPU · ${formatPercent(metrics.memoryPercent, 1)} ${t(locale, 'memory', 'الذاكرة')}` : t(locale, 'No counter sample', 'لا توجد عينة عدادات')}
        </span>
        <span>
          {formatRate(metrics ? (metrics.networkInBytesPerSec ?? 0) + (metrics.networkOutBytesPerSec ?? 0) : null)} {t(locale, 'network', 'الشبكة')}
        </span>
        <span>
          {formatCount(c.series.length)} {t(locale, 'samples', 'عينة')}
          {c.samplingPaused ? ` · ${t(locale, 'paused', 'متوقف')}` : ''}
        </span>
        <span>
          {snapshot
            ? formatTimestamp(snapshot.generatedAt, locale)
            : c.lastSampleAt
              ? formatTimestamp(c.lastSampleAt, locale)
              : t(locale, 'No observation yet', 'لا توجد مراقبة بعد')}
        </span>
        {snapshot ? <code data-testid="system-native-receipt">{snapshot.receipt.slice(0, 12)}</code> : null}
        {session ? <code data-testid="system-native-session-id">{session.id}</code> : null}
      </div>

      {stages.length ? (
        <ol className="sys-native-stages" data-testid="system-native-stages">
          {stages.map((stage) => (
            <li key={stage.key} data-state={stage.status} title={stage.provider}>
              <strong>{locale === 'ar' ? stage.labelAr : stage.labelEn}</strong>
              <span>{stage.status}</span>
              {stage.items == null ? null : <span>{formatCount(stage.items)}</span>}
              {stage.durationMs == null ? null : <span>{Math.round(stage.durationMs)} ms</span>}
              {stage.warning ? <span className="sys-stage-warning">{stage.warning}</span> : null}
            </li>
          ))}
        </ol>
      ) : null}

      {warnings.map((warning, index) => (
        <p className="sys-live-warning" key={`${warning.slice(0, 24)}-${index}`}>
          {warning}
        </p>
      ))}

      {!c.nativeAvailable ? (
        <p className="sys-live-warning" data-testid="system-live-native-required">
          {t(
            locale,
            'The read-only SystemBridge is unavailable in this context, so no gauge, process, event, driver, socket, adapter, hosts line or hardware field is substituted.',
            'جسر SystemBridge للقراءة فقط غير متاح في هذا السياق، لذلك لا تُستبدل أي أداة قياس أو عملية أو حدث أو برنامج تشغيل أو مقبس أو محول أو سطر hosts أو حقل عتاد.',
          )}
        </p>
      ) : null}
    </LiveServiceStage>
  );
}

export default SystemLiveStage;
