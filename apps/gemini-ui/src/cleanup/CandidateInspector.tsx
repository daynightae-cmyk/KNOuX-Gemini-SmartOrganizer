/**
 * Safety review inspector — a real eight-step review flow over measured
 * evidence. Execution is deliberately absent and shown as a gate.
 */
import React from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  CopyCheck,
  FileSearch,
  FolderLock,
  Lock,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type { CleanupCandidate } from '../../shared/native-contracts';
import type { CleanupLocale } from './model';
import {
  CATEGORY_META,
  categoryLabel,
  formatAge,
  formatBytes,
  formatCount,
  riskLabel,
  safetyLabel,
  t,
} from './model';

export interface CandidateInspectorProps {
  locale: CleanupLocale;
  candidate: CleanupCandidate | null;
  checkedCandidates: CleanupCandidate[];
  busy: boolean;
  planStaged: boolean;
  onStagePlan: (candidateIds: string[]) => void;
  onOpenService: (serviceId: string) => void;
}

const STEPS = [
  ['Inspect', 'الفحص'],
  ['Classify', 'التصنيف'],
  ['Select', 'التحديد'],
  ['Review', 'المراجعة'],
  ['Approve', 'الموافقة'],
  ['Execute', 'التنفيذ'],
  ['Verify', 'التحقق'],
  ['Recover', 'الاسترداد'],
] as const;

export function CandidateInspector({
  locale,
  candidate,
  checkedCandidates,
  busy,
  planStaged,
  onStagePlan,
  onOpenService,
}: CandidateInspectorProps) {
  const checkedBytes = checkedCandidates.reduce((sum, entry) => sum + (entry.sizeBytes || 0), 0);
  const scope = checkedCandidates.length ? checkedCandidates : candidate ? [candidate] : [];
  const scopeBytes = checkedCandidates.length ? checkedBytes : candidate?.sizeBytes || 0;
  const blocked = scope.filter((entry) => entry.safety === 'blocked');
  const active = scope.filter((entry) => entry.active);
  const eligible = scope.filter((entry) => entry.safety === 'eligible');
  const currentStep = planStaged ? 5 : scope.length ? (candidate ? 4 : 3) : 1;

  return (
    <aside className="cln-panel cln-inspector" data-testid="cleanup-inspector">
      <header className="cln-panel-head">
        <div>
          <h2 className="cln-panel-title">{t(locale, 'Cleanup Preview & Safety Review', 'معاينة التنظيف ومراجعة الأمان')}</h2>
          <p className="cln-panel-sub">{t(locale, 'Eight-step review over measured evidence', 'مراجعة من ثماني خطوات على أدلة مقيسة')}</p>
        </div>
        <span className="cln-chip cln-chip-good">{t(locale, 'READ-ONLY', 'للقراءة فقط')}</span>
      </header>

      <div className="cln-inspector-body knx-custom-scrollbar">
        <ol className="cln-stepper" aria-label={t(locale, 'Review flow', 'مسار المراجعة')}>
          {STEPS.map(([en, ar], index) => {
            const step = index + 1;
            const done = step < currentStep;
            const current = step === currentStep;
            const locked = step === 6 || step === 7 || step === 8;
            return (
              <li key={en} className={`cln-step ${done ? 'is-done' : ''} ${current ? 'is-current' : ''} ${locked ? 'is-locked' : ''}`}>
                <span className="cln-step-dot">
                  {done ? <Check className="w-3 h-3" /> : locked ? <Lock className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                </span>
                <div>
                  <strong>{locale === 'ar' ? ar : en}</strong>
                  <span>
                    {locked
                      ? t(locale, 'Gated · no channel', 'محجوب · لا قناة')
                      : step === 1
                        ? t(locale, 'Measured metadata', 'بيانات وصفية مقيسة')
                        : step === 2
                          ? t(locale, 'Deterministic safety class', 'تصنيف أمان حتمي')
                          : step === 3
                            ? t(locale, 'Choose candidates', 'اختر المرشحين')
                            : step === 4
                              ? t(locale, 'Check impact & recovery', 'افحص الأثر والاسترداد')
                              : t(locale, 'Approve an immutable plan', 'وافق على خطة ثابتة')}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {candidate ? (
          <>
            <div className="cln-inspect-identity">
              <div className="cln-inspect-icon" style={{ borderColor: CATEGORY_META[candidate.category].color }}>
                <FileSearch className="w-5 h-5" style={{ color: CATEGORY_META[candidate.category].color }} />
              </div>
              <div className="min-w-0">
                <div className="cln-inspect-name" title={candidate.name}>{candidate.name}</div>
                <div className="cln-inspect-meta">
                  {categoryLabel(candidate.category, locale)} · {candidate.provider}
                </div>
              </div>
              <span className={`cln-badge cln-badge-${candidate.safety}`}>{safetyLabel(candidate.safety, locale)}</span>
            </div>

            <div className="cln-inspect-grid">
              <div>
                <span>{t(locale, 'Selected scope', 'النطاق المحدد')}</span>
                <strong>{formatCount(scope.length)} {t(locale, 'item(s)', 'عنصرًا')}</strong>
                <em>{formatBytes(scopeBytes)}</em>
              </div>
              <div>
                <span>{t(locale, 'Proposed action', 'الإجراء المقترح')}</span>
                <strong>{candidate.action}</strong>
                <em>{candidate.active ? t(locale, 'active process', 'عملية نشطة') : t(locale, 'no active owner detected', 'لا مالك نشط')}</em>
              </div>
              <div>
                <span>{t(locale, 'Recoverability', 'قابلية الاسترداد')}</span>
                <strong>{candidate.recoverable}</strong>
              </div>
              <div>
                <span>{t(locale, 'Permission required', 'الصلاحية المطلوبة')}</span>
                <strong>{candidate.permission}</strong>
              </div>
            </div>

            <div className="cln-checklist">
              <div className="cln-checklist-head">
                <ShieldCheck className="w-4 h-4" />
                <strong>{t(locale, 'Review checkpoints', 'نقاط المراجعة')}</strong>
              </div>
              <ul>
                <li className={candidate.safety === 'eligible' ? 'is-good' : 'is-warn'}>
                  {candidate.safety === 'eligible' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {t(locale, 'Safety class', 'تصنيف الأمان')}: {safetyLabel(candidate.safety, locale)}
                </li>
                <li className={!candidate.active ? 'is-good' : 'is-bad'}>
                  {!candidate.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {candidate.active ? t(locale, 'Owning process is running', 'العملية المالكة تعمل') : t(locale, 'No active owner detected', 'لا مالك نشط')}
                </li>
                <li className={candidate.category !== 'update' ? 'is-good' : 'is-bad'}>
                  {candidate.category !== 'update' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {candidate.category === 'update'
                    ? t(locale, 'Windows servicing stays a Windows handoff', 'خدمة Windows تبقى تسليمًا إلى Windows')
                    : t(locale, 'No Windows servicing ownership', 'لا ملكية لخدمة Windows')}
                </li>
                <li className={candidate.virtual ? 'is-warn' : 'is-good'}>
                  {candidate.virtual ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {candidate.virtual
                    ? t(locale, 'Virtual evidence: permanent deletion is never reversible', 'دليل افتراضي: الحذف الدائم لا يُستعاد')
                    : t(locale, 'Measured filesystem evidence', 'دليل نظام ملفات مقيس')}
                </li>
              </ul>
            </div>

            <div className="cln-evidence">
              <div className="cln-evidence-head">
                <CopyCheck className="w-4 h-4" />
                <strong>{t(locale, 'Measured evidence', 'الأدلة المقيسة')}</strong>
                <span className="cln-mono">{formatAge(candidate.ageDays, locale)}</span>
              </div>
              <ul>
                {candidate.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                {candidate.evidence.map((line) => <li key={line} className="cln-muted">{line}</li>)}
              </ul>
            </div>

            {blocked.length || active.length ? (
              <div className="cln-unsupported">
                <Lock className="w-4 h-4" />
                <div>
                  <strong>{t(locale, 'Unsupported actions in this selection', 'إجراءات غير مدعومة في هذا التحديد')}</strong>
                  <ul>
                    {blocked.length ? <li>{formatCount(blocked.length)} {t(locale, 'blocked by safety policy', 'محجوب بسياسة الأمان')}</li> : null}
                    {active.length ? <li>{formatCount(active.length)} {t(locale, 'owned by a running process', 'مملوك لعملية تعمل')}</li> : null}
                    {scope.some((entry) => entry.category === 'update') ? <li>{t(locale, 'Windows Update servicing is never invoked here', 'لا يُستدعى تنظيف تحديث Windows هنا')}</li> : null}
                  </ul>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="cln-empty cln-empty-inspector">
            <FolderLock className="w-8 h-8" />
            <strong>{t(locale, 'No candidate selected', 'لم يُحدد أي مرشح')}</strong>
            <p>{t(locale, 'Select a measured row to inspect its safety evidence and recovery limits.', 'اختر صفًا مقيسًا لفحص أدلة الأمان وحدود الاسترداد.')}</p>
          </div>
        )}
      </div>

      <footer className="cln-inspector-foot">
        <button
          type="button"
          className="cln-btn cln-btn-primary cln-btn-wide"
          disabled={!scope.length || busy || !eligible.length}
          onClick={() => onStagePlan(scope.map((entry) => entry.id))}
        >
          <Lock className="w-3.5 h-3.5" />
          {busy ? t(locale, 'Staging review plan…', 'جارٍ إعداد خطة المراجعة…') : t(locale, 'Stage review plan', 'إعداد خطة المراجعة')}
        </button>
        <button type="button" className="cln-btn cln-btn-quiet cln-btn-wide" onClick={() => onOpenService('cleanup-temp-quarantine')}>
          <RotateCcw className="w-3.5 h-3.5" />
          {t(locale, 'Open quarantine workbench', 'فتح ورشة الحجر')}
        </button>
        <p className="cln-gate-note">
          <Lock className="w-3 h-3" />
          {t(
            locale,
            'Execute is disabled: no delete, move, recycle-empty or DISM channel exists in Mission 08.',
            'التنفيذ معطّل: لا توجد قناة حذف أو نقل أو إفراغ سلة أو DISM في المهمة 08.'
          )}
        </p>
      </footer>
    </aside>
  );
}
