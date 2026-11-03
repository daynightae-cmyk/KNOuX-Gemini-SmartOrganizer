import { LiveServiceStage } from '../components/workbench/LiveServiceStage';
import type { ServicesLocale } from './catalog';
import { formatCount, formatTimestamp, t } from './model';
import type { ServicesController } from './useServices';

/**
 * Service Commander process strip (Mission 12 inner workspace).
 *
 * Presentation only. Every token, count, timestamp and stage row comes from the
 * live ServicesBridge session or the measured SCM snapshot; the strip never
 * simulates progress, never invents a reading and never advertises a mutation
 * channel that this preview-only domain does not expose.
 */
export interface ServicesLiveStageProps {
  controller: ServicesController;
  locale: ServicesLocale;
  /** Currently selected tool id, or null for the measured overview. */
  tool: string | null;
  title: string;
}

export function ServicesLiveStage({ controller: c, locale, tool, title }: ServicesLiveStageProps) {
  const snapshot = c.snapshot;
  const running = c.loading || c.scanning || c.refreshing || Boolean(c.busy) || c.cancelling;
  const capability = tool ? c.capabilities?.services.find((entry) => entry.id === tool) : undefined;
  const unavailableStages = snapshot?.coverage.filter((stage) => stage.status === 'unavailable').length ?? 0;
  const session = c.session;

  const status = !c.nativeAvailable
    ? 'UNAVAILABLE'
    : running
      ? 'RUNNING'
      : c.actionError
        ? 'FAILED'
        : session?.status === 'cancelled'
          ? 'CANCELLED'
          : snapshot
            ? (unavailableStages || (snapshot.warnings.length) ? 'PARTIAL' : 'READY')
            : 'IDLE';

  const subtitle =
    c.actionError?.message ||
    (c.scanning
      ? t(
          locale,
          'Reading the bounded read-only SCM stages. Discovery is read-only; nothing is executed.',
          'قراءة مراحل SCM المحدودة بنمط القراءة فقط. الاكتشاف للقراءة فقط؛ لا يُنفذ شيء.',
        )
      : capability
        ? locale === 'ar'
          ? capability.noteAr
          : capability.noteEn
        : snapshot
          ? `${formatCount(snapshot.services.length)} ${t(locale, 'measured SCM rows', 'صفوف SCM مقيسة')} · ${t(locale, 'read-only preview', 'معاينة للقراءة فقط')}`
          : t(
              locale,
              'No measured register yet. Start the bounded discovery to read services, edges, events, shared hosts and the journal.',
              'لا يوجد سجل مقيس بعد. ابدأ الاكتشاف المحدود لقراءة الخدمات والحواف والأحداث والمضيفات المشتركة والسجل.',
            ));

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
      <div className="svc-live-facts" data-testid="services-live-facts">
        <span>{snapshot ? 'ServicesBridge' : c.capabilities?.engine || 'ServicesBridge'}</span>
        {snapshot ? (
          <>
            <span>
              {formatCount(snapshot.summary.total)} {t(locale, 'services', 'خدمة')} · {formatCount(snapshot.summary.running)} {t(locale, 'running', 'تعمل')}
            </span>
            <span>
              {formatCount(snapshot.summary.protected)} {t(locale, 'protected', 'محمية')} · {formatCount(snapshot.summary.automatic)} {t(locale, 'automatic', 'تلقائي')}
            </span>
            <span>
              {formatCount(snapshot.events.length)} {t(locale, 'events', 'حدث')} · {formatCount(snapshot.svchost.length)} {t(locale, 'shared hosts', 'مضيف مشترك')}
            </span>
            <span>
              {formatCount(snapshot.edges.length)} {t(locale, 'edges', 'حافة')} · {formatCount(c.journal.length)} {t(locale, 'journal entries', 'مدخل سجل')}
            </span>
            <span>
              {snapshot.elevation.isAdmin === true
                ? t(locale, 'Elevated (user-initiated UAC)', 'مرفوع (UAC بطلب المستخدم)')
                : snapshot.elevation.isAdmin === false
                  ? t(locale, 'Standard user, read-only', 'مستخدم عادي، قراءة فقط')
                  : t(locale, 'Privilege not measured', 'الصلاحية غير مقيسة')}
            </span>
          </>
        ) : (
          <span>{t(locale, 'Not measured', 'غير مقيس')}</span>
        )}
        <span>{snapshot ? formatTimestamp(snapshot.generatedAt, locale) : '—'}</span>
        {snapshot ? <code data-testid="services-native-receipt">{snapshot.receipt.slice(0, 12)}</code> : null}
        {session ? <code data-testid="services-native-session-id">{session.id}</code> : null}
      </div>

      {stages.length ? (
        <ol className="svc-native-stages" data-testid="services-native-stages">
          {stages.map((stage) => (
            <li key={stage.key} data-state={stage.status} title={stage.provider}>
              <strong>{locale === 'ar' ? stage.labelAr : stage.labelEn}</strong>
              <span>{stage.status}</span>
              {stage.items == null ? null : <span>{formatCount(stage.items)}</span>}
              {stage.durationMs == null ? null : <span>{Math.round(stage.durationMs)} ms</span>}
              {stage.warning ? <span className="svc-stage-warning">{stage.warning}</span> : null}
            </li>
          ))}
        </ol>
      ) : null}

      {warnings.map((warning, index) => (
        <p className="svc-live-warning" key={`${String(warning).slice(0, 24)}-${index}`}>
          {warning}
        </p>
      ))}

      {!c.nativeAvailable ? (
        <p className="svc-live-warning" data-testid="services-live-native-required">
          {t(
            locale,
            'The read-only ServicesBridge is unavailable in this context, so no service, edge, event, host, plan or journal entry is substituted.',
            'جسر ServicesBridge للقراءة فقط غير متاح في هذا السياق، لذلك لا تُستبدل أي خدمة أو حافة أو حدث أو مضيف أو خطة أو مدخل سجل.',
          )}
        </p>
      ) : null}
    </LiveServiceStage>
  );
}

export default ServicesLiveStage;
