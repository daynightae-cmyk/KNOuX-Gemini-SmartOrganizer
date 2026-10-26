/**
 * Autorun dossier — measured signature, protection, task trigger and command
 * evidence for the selected entry, plus a read-only staging dock.
 */
import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Circle,
  Clock3,
  Cpu,
  FileCode2,
  FolderLock,
  KeyRound,
  Lock,
  PowerOff,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import type { StartupEntry } from '../../shared/native-contracts';
import {
  SIGNATURE_META,
  STATE_META,
  SOURCE_META,
  formatTimestamp,
  protectionLabel,
  scopeLabel,
  shortId,
  signatureLabel,
  sourceLabel,
  stateLabel,
  t,
  taskTriggerLabel,
} from './model';
import type { StartupLocale } from './model';

export interface AutorunInspectorProps {
  locale: StartupLocale;
  entry: StartupEntry | null;
  checkedEntries: StartupEntry[];
  busy: boolean;
  planStaged: boolean;
  onStagePlan: (ids: string[], mode: 'disable' | 'enable' | 'delay') => void;
  onOpenService: (service: string) => void;
  onNotice: (message: string) => void;
}

const STEPS = [
  ['Inspect', 'الفحص'],
  ['Protect', 'الحماية'],
  ['Stage', 'التهيئة'],
  ['Approve', 'الموافقة'],
  ['Execute', 'التنفيذ'],
  ['Verify', 'التحقق'],
  ['Journal', 'السجل'],
] as const;

export function AutorunInspector({
  locale,
  entry,
  checkedEntries,
  busy,
  planStaged,
  onStagePlan,
  onOpenService,
  onNotice,
}: AutorunInspectorProps) {
  const scope = checkedEntries.length ? checkedEntries : entry ? [entry] : [];
  const protectedScope = useMemo(() => scope.filter((item) => item.protection === 'protected'), [scope]);
  const elevationScope = useMemo(() => scope.filter((item) => item.elevationRequired), [scope]);
  const currentStep = planStaged ? 4 : scope.length ? (entry ? 3 : 1) : 1;

  const copyValue = async (label: string, value: string | null | undefined) => {
    if (!value) {
      onNotice(t(locale, 'No measured value is available to copy.', 'لا توجد قيمة مقيسة قابلة للنسخ.'));
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      onNotice(t(locale, `${label} copied to the clipboard.`, `نُسخ ${label} إلى الحافظة.`));
    } catch {
      onNotice(t(locale, 'The clipboard is unavailable; nothing was copied.', 'الحافظة غير متاحة؛ لم يُنسخ شيء.'));
    }
  };

  return (
    <aside className="stp-panel stp-inspector" data-testid="startup-inspector">
      <header className="stp-panel-head">
        <div>
          <h2 className="stp-panel-title">{t(locale, 'Autorun Dossier & Staging Review', 'ملف مدخل البدء ومراجعة التهيئة')}</h2>
          <p className="stp-panel-sub">{t(locale, 'Seven checkpoints over measured Windows evidence', 'سبع نقاط تحقق على أدلة Windows المقيسة')}</p>
        </div>
        <span className="stp-chip stp-chip-good">{t(locale, 'READ-ONLY', 'للقراءة فقط')}</span>
      </header>

      <div className="stp-inspector-body knx-custom-scrollbar">
        <ol className="stp-stepper" aria-label={t(locale, 'Review flow', 'مسار المراجعة')}>
          {STEPS.map(([en, ar], index) => {
            const step = index + 1;
            const done = step < currentStep;
            const current = step === currentStep;
            const locked = step >= 5;
            const OptionalIcon = done ? Check : locked ? Lock : Circle;
            return (
              <li key={en} className={`stp-step ${done ? 'is-done' : ''} ${current ? 'is-current' : ''} ${locked ? 'is-locked' : ''}`}>
                <span className="stp-step-dot"><OptionalIcon className="w-2.5 h-2.5" /></span>
                <div>
                  <strong>{locale === 'ar' ? ar : en}</strong>
                  <span>
                    {locked
                      ? t(locale, 'No channel', 'لا قناة')
                      : step === 1
                        ? t(locale, 'Measured metadata', 'بيانات مقيسة')
                        : step === 2
                          ? t(locale, 'Protection rules', 'قواعد الحماية')
                          : step === 3
                            ? t(locale, 'Immutable plan', 'خطة ثابتة')
                            : t(locale, 'Approval gate', 'بوابة موافقة')}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {entry ? (
          <>
            <div className="stp-inspect-identity">
              <div className="stp-inspect-icon" style={{ borderColor: SOURCE_META[entry.sourceKind].accent }}>
                {entry.sourceKind === 'scheduled-task'
                  ? <CalendarClock className="w-5 h-5" style={{ color: SOURCE_META[entry.sourceKind].accent }} />
                  : <FileCode2 className="w-5 h-5" style={{ color: SOURCE_META[entry.sourceKind].accent }} />}
              </div>
              <div className="min-w-0">
                <div className="stp-inspect-name" title={entry.name}>{entry.name}</div>
                <div className="stp-inspect-meta">
                  {sourceLabel(entry.sourceKind, locale)} · {scopeLabel(entry.scope, locale)} · {shortId(entry.id)}
                </div>
              </div>
              <span className={`stp-badge stp-badge-${STATE_META[entry.state].tone}`}>
                <span className="stp-badge-dot" />
                {stateLabel(entry.state, locale)}
              </span>
            </div>

            <div className="stp-inspect-grid">
              <div>
                <span>{t(locale, 'Signature', 'التوقيع')}</span>
                <strong className={`stp-tone-${SIGNATURE_META[entry.signature].tone}`}>
                  {signatureLabel(entry.signature, locale)}
                </strong>
                <em>{entry.publisher || t(locale, 'Publisher not measured', 'لم يُقس الناشر')}</em>
              </div>
              <div>
                <span>{t(locale, 'Protection', 'الحماية')}</span>
                <strong className={entry.protection === 'protected' ? 'stp-tone-bad' : 'stp-tone-good'}>
                  {protectionLabel(entry.protection, locale)}
                </strong>
                <em>{entry.protectionReason || t(locale, 'No protected rule matched', 'لا قاعدة حماية مطابقة')}</em>
              </div>
              <div>
                <span>{t(locale, 'Evaluation scope', 'نطاق التقييم')}</span>
                <strong>{scope.length} {t(locale, 'entry(s)', 'مدخلًا')}</strong>
                <em>{protectedScope.length} {t(locale, 'protected', 'محمي')} · {elevationScope.length} {t(locale, 'elevation', 'رفع صلاحيات')}</em>
              </div>
              <div>
                <span>{t(locale, 'Attribution', 'الإسناد')}</span>
                <strong>{t(locale, 'No boot seconds claimed', 'لا ادعاء بثوانٍ للإقلاع')}</strong>
                <em>{t(locale, 'Windows did not publish a per-entry delay', 'لم ينشر Windows تأخيرًا لكل مدخل')}</em>
              </div>
            </div>

            {entry.protection === 'protected' ? (
              <div className="stp-warning">
                <ShieldAlert className="w-4 h-4" />
                <div>
                  <strong>{t(locale, 'Protected Windows component', 'مكوّن Windows محمي')}</strong>
                  <p>{entry.protectionReason || t(locale, 'This entry is blocked from every staged action.', 'هذا المدخل محجوب عن كل إجراء مُهيَّأ.')}</p>
                </div>
              </div>
            ) : null}

            <div className="stp-inspect-section">
              <div className="stp-inspect-section-head">
                <KeyRound className="w-3.5 h-3.5" />
                <strong>{t(locale, 'Measured source', 'المصدر المقيس')}</strong>
              </div>
              <div className="stp-kv-list">
                <div>
                  <span>{t(locale, 'Location', 'الموقع')}</span>
                  <code title={entry.location}>{entry.location}</code>
                  <button type="button" className="stp-icon-btn" onClick={() => void copyValue(t(locale, 'Location', 'الموقع'), entry.location)} aria-label={t(locale, 'Copy location', 'نسخ الموقع')}>
                    <ClipboardCopy className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <span>{t(locale, 'Executable', 'الملف التنفيذي')}</span>
                  <code title={entry.executable || undefined}>{entry.executable || t(locale, 'Not resolved', 'لم يُحل')}</code>
                  <button type="button" className="stp-icon-btn" onClick={() => void copyValue(t(locale, 'Executable', 'الملف التنفيذي'), entry.executable)} aria-label={t(locale, 'Copy executable', 'نسخ الملف التنفيذي')}>
                    <ClipboardCopy className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <span>{t(locale, 'Command', 'الأمر')}</span>
                  <code title={entry.command || undefined}>{entry.command || t(locale, 'No command was published', 'لم يُنشر أي أمر')}</code>
                  <button type="button" className="stp-icon-btn" onClick={() => void copyValue(t(locale, 'Command', 'الأمر'), entry.command)} aria-label={t(locale, 'Copy command', 'نسخ الأمر')}>
                    <ClipboardCopy className="w-3 h-3" />
                  </button>
                </div>
                {entry.args ? (
                  <div>
                    <span>{t(locale, 'Arguments', 'الوسائط')}</span>
                    <code title={entry.args}>{entry.args}</code>
                  </div>
                ) : null}
              </div>
            </div>

            {entry.sourceKind === 'scheduled-task' ? (
              <div className="stp-inspect-section">
                <div className="stp-inspect-section-head">
                  <CalendarClock className="w-3.5 h-3.5" />
                  <strong>{t(locale, 'Task trigger & history', 'محفز المهمة وسجلها')}</strong>
                </div>
                <div className="stp-kv-list">
                  <div>
                    <span>{t(locale, 'Triggers', 'المحفزات')}</span>
                    <code>{taskTriggerLabel(entry.triggers, locale)}</code>
                  </div>
                  <div>
                    <span>{t(locale, 'Task state', 'حالة المهمة')}</span>
                    <code>{entry.taskState || t(locale, 'Not published', 'غير منشور')}</code>
                  </div>
                  <div>
                    <span>{t(locale, 'Task path', 'مسار المهمة')}</span>
                    <code title={entry.taskPath || undefined}>{entry.taskPath || '—'}</code>
                  </div>
                  <div>
                    <span>{t(locale, 'Next / last run', 'التشغيل التالي / الأخير')}</span>
                    <code>{formatTimestamp(entry.nextRunAt, locale)} · {formatTimestamp(entry.lastRunAt, locale)}</code>
                  </div>
                  <div>
                    <span>{t(locale, 'Run level & account', 'مستوى التشغيل والحساب')}</span>
                    <code>{entry.runLevel || '—'} · {entry.userId || '—'}</code>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="stp-inspect-section">
              <div className="stp-inspect-section-head">
                <ShieldCheck className="w-3.5 h-3.5" />
                <strong>{t(locale, 'Verification evidence', 'أدلة التحقق')}</strong>
              </div>
              <ul className="stp-evidence">
                {entry.evidence.map((line, index) => (
                  <li key={`${line}-${index}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{line}</span>
                  </li>
                ))}
                <li>
                  {entry.active ? <Cpu className="w-3.5 h-3.5" /> : <Clock3 className="w-3.5 h-3.5" />}
                  <span>
                    {entry.active
                      ? t(locale, 'An active process was matched for this entry.', 'طوبقت عملية نشطة لهذا المدخل.')
                      : t(locale, 'No active process was matched; this is not proof the entry never runs.', 'لم تُطابق عملية نشطة؛ هذا ليس دليلًا على أن المدخل لا يعمل أبدًا.')}
                  </span>
                </li>
                <li>
                  <UserRound className="w-3.5 h-3.5" />
                  <span>
                    {t(locale, 'Elevation required', 'رفع الصلاحيات مطلوب')}: {entry.elevationRequired ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا')}
                  </span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="stp-empty-inspector">
            <FolderLock className="w-6 h-6" />
            <strong>{t(locale, 'No measured entry selected', 'لم يُحدد أي مدخل مقيس')}</strong>
            <p>{t(locale, 'Select a row in the autorun register to inspect its measured source, signature and protection evidence.', 'حدد صفًا في سجل البدء لفحص مصدره وتوقيعه وأدلة حمايته المقيسة.')}</p>
          </div>
        )}
      </div>

      <div className="stp-inspector-foot">
        <div className="stp-gate-note">
          <Lock className="w-3 h-3" />
          {t(
            locale,
            'No registry, task or service write channel exists. A staged plan is immutable and execution stays gated.',
            'لا توجد قناة كتابة للتسجيل أو المهام أو الخدمات. الخطة المُهيَّأة ثابتة والتنفيذ يبقى محجوبًا.'
          )}
        </div>
        <div className="stp-inspector-actions">
          <button
            type="button"
            className="stp-btn stp-btn-ghost"
            onClick={() => onOpenService('startup-disable')}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {t(locale, 'Full preview', 'المعاينة الكاملة')}
          </button>
          {entry && entry.protection !== 'protected' ? (
            <>
              <button
                type="button"
                className={`stp-btn ${entry.state === 'enabled' ? 'stp-btn-danger' : 'stp-btn-primary'}`}
                disabled={busy}
                onClick={() => onStagePlan(entry.id ? [entry.id] : [], entry.state === 'enabled' ? 'disable' : 'enable')}
              >
                <PowerOff className="w-3.5 h-3.5" />
                {entry.state === 'enabled'
                  ? t(locale, 'Stage disable', 'تهيئة التعطيل')
                  : t(locale, 'Stage enable', 'تهيئة التفعيل')}
              </button>
              <button
                type="button"
                className="stp-btn stp-btn-ghost"
                disabled={busy}
                onClick={() => onStagePlan(entry.id ? [entry.id] : [], 'delay')}
              >
                <Clock3 className="w-3.5 h-3.5" />
                {t(locale, 'Stage delay', 'تهيئة التأخير')}
              </button>
            </>
          ) : (
            <span className="stp-gate-chip">
              <Lock className="w-3 h-3" />
              {t(locale, 'Protected from staging', 'محمي من التهيئة')}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
