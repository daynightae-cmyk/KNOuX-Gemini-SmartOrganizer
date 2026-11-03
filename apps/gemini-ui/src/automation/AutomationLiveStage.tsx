import { LiveServiceStage } from '../components/workbench/LiveServiceStage';
import type { AutomationLocale } from './catalog';
import { formatCount, formatTimestamp, t } from './model';
import type { AutomationController } from './useAutomation';

/**
 * Flow Studio process strip (Mission 13 inner workspace).
 *
 * Presentation only. Every token, count and timestamp comes from the local
 * AutomationBridge store or the live discovery session; the strip never
 * simulates progress and never advertises an execution channel that this
 * draft-only domain does not expose. Execution happens exclusively through
 * the operations runner behind exact-plan native consent.
 */
export interface AutomationLiveStageProps {
  controller: AutomationController;
  locale: AutomationLocale;
  /** Currently selected tool id, or null for the measured overview. */
  tool: string | null;
  title: string;
}

export function AutomationLiveStage({ controller: c, locale, tool, title }: AutomationLiveStageProps) {
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
            ? (unavailableStages || snapshot.warnings.length ? 'PARTIAL' : 'READY')
            : 'IDLE';

  const subtitle =
    c.actionError?.message ||
    (c.scanning
      ? t(
          locale,
          'Reading the bounded local discovery stages. Nothing is executed or scheduled.',
          'قراءة مراحل الاكتشاف المحلية المحدودة. لا يُنفذ أو يُجدول شيء.',
        )
      : capability
        ? locale === 'ar'
          ? capability.noteAr
          : capability.noteEn
        : snapshot
          ? `${formatCount(snapshot.workflows.length)} ${t(locale, 'saved drafts', 'مسودة محفوظة')} · ${formatCount(snapshot.journal.length)} ${t(locale, 'dry-runs', 'تشغيل تجريبي')} · ${t(locale, 'execution: not implemented', 'التنفيذ: غير منفذ')}`
          : t(
              locale,
              'No local store yet. Start the bounded discovery to read saved workflows, templates, schedule occurrences and the dry-run journal.',
              'لا يوجد مخزن محلي بعد. ابدأ الاكتشاف المحدود لقراءة سير العمل المحفوظة والقوالب والظهور المجدول وسجل التشغيل التجريبي.',
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
      <div className="auto-live-facts" data-testid="automation-live-facts">
        <span>{snapshot ? 'AutomationBridge' : c.capabilities?.engine || 'AutomationBridge'}</span>
        {snapshot ? (
          <>
            <span>
              {formatCount(snapshot.workflows.length)} {t(locale, 'drafts', 'مسودة')} · {formatCount(snapshot.templates.length)} {t(locale, 'templates', 'قالب')}
            </span>
            <span>
              {formatCount(snapshot.journal.length)} {t(locale, 'dry-runs', 'تشغيل تجريبي')} · {formatCount(snapshot.gates.length)} {t(locale, 'gated gates', 'بوابة مقيدة')}
            </span>
            <span>
              {snapshot.runtime.timezone} · {snapshot.runtime.localTime}
            </span>
            <span>
              {snapshot.runtime.batteryAvailable
                ? `${snapshot.runtime.batteryChargePercent ?? '—'}% ${t(locale, 'battery', 'بطارية')} · ${snapshot.runtime.powerSource || ''}`.trim()
                : t(locale, 'Battery not measured here', 'البطارية غير مقيسة هنا')}
            </span>
            <span>
              {formatCount(snapshot.runtime.studioSources.length)} {t(locale, 'Studio sources authorized', 'مصدر Studio مصرّح')}
            </span>
          </>
        ) : (
          <span>{t(locale, 'Not measured', 'غير مقيس')}</span>
        )}
        <span>{snapshot ? formatTimestamp(snapshot.generatedAt, locale) : '—'}</span>
        {snapshot ? <code data-testid="automation-native-receipt">{snapshot.receipt.slice(0, 12)}</code> : null}
        {session ? <code data-testid="automation-native-session-id">{session.id}</code> : null}
      </div>

      {stages.length ? (
        <ol className="auto-native-stages" data-testid="automation-native-stages">
          {stages.map((stage) => (
            <li key={stage.key} data-state={stage.status} title={stage.provider}>
              <strong>{locale === 'ar' ? stage.labelAr : stage.labelEn}</strong>
              <span>{stage.status}</span>
              {stage.items == null ? null : <span>{formatCount(stage.items)}</span>}
              {stage.durationMs == null ? null : <span>{Math.round(stage.durationMs)} ms</span>}
              {stage.warning ? <span className="auto-stage-warning">{stage.warning}</span> : null}
            </li>
          ))}
        </ol>
      ) : null}

      {warnings.map((warning, index) => (
        <p className="auto-live-warning" key={`${String(warning).slice(0, 24)}-${index}`}>
          {warning}
        </p>
      ))}

      {!c.nativeAvailable ? (
        <p className="auto-live-warning" data-testid="automation-live-native-required">
          {t(
            locale,
            'The local AutomationBridge is unavailable in this context, so no workflow, template, schedule occurrence, battery reading or dry-run is substituted.',
            'جسر AutomationBridge المحلي غير متاح في هذا السياق، لذلك لا تُستبدل أي سير عمل أو قالب أو ظهور جدول أو قراءة بطارية أو تشغيل تجريبي.',
          )}
        </p>
      ) : null}
    </LiveServiceStage>
  );
}

export default AutomationLiveStage;
