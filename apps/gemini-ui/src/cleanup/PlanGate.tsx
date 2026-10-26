/**
 * Immutable review-plan gate. The plan can be inspected and copied, but no
 * execution channel exists; the approval gate is stated on every plan.
 */
import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  ClipboardCopy,
  Lock,
  ShieldOff,
  X,
} from 'lucide-react';
import type { CleanupPlan } from '../../shared/native-contracts';
import type { CleanupLocale } from './model';
import {
  formatBytes,
  formatCount,
  formatTimestamp,
  planModeLabel,
  riskLabel,
  safetyLabel,
  t,
} from './model';

export interface PlanGateProps {
  locale: CleanupLocale;
  plan: CleanupPlan;
  onClose: () => void;
  onNotice: (message: string) => void;
}

export function PlanGate({ locale, plan, onClose, onNotice }: PlanGateProps) {
  const [copied, setCopied] = useState(false);

  const copyPlan = async () => {
    const payload = {
      contract: plan.contract,
      planId: plan.planId,
      createdAt: plan.createdAt,
      observedAt: plan.observedAt,
      mode: plan.mode,
      immutable: plan.immutable,
      mutation: plan.mutation,
      fingerprint: plan.fingerprint,
      totals: plan.totals,
      items: plan.items,
      execution: plan.execution,
      rollback: plan.rollback,
      disclaimer:
        'Read-only review plan. No file was deleted, moved, quarantined or serviced. Execution has no channel in Mission 08.',
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      onNotice(t(locale, 'Review plan copied as JSON to the clipboard.', 'نُسخت خطة المراجعة JSON إلى الحافظة.'));
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      onNotice(t(locale, 'The clipboard is unavailable; the plan was not copied.', 'الحافظة غير متاحة؛ لم تُنسخ الخطة.'));
    }
  };

  return (
    <div className="cln-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cln-plan-gate-title">
      <div className="cln-plan-gate" data-testid="cleanup-plan-gate">
        <div className="cln-plan-gate-head">
          <div className="cln-plan-gate-icon">
            <Lock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 id="cln-plan-gate-title">{t(locale, 'Review plan approval gate', 'بوابة موافقة خطة المراجعة')}</h2>
            <p>
              {t(
                locale,
                'The plan is immutable and read-only. Mission 08 has no delete, move, recycle-empty or DISM channel.',
                'الخطة ثابتة وللقراءة فقط. لا توجد في المهمة 08 قناة حذف أو نقل أو إفراغ سلة أو DISM.'
              )}
            </p>
          </div>
          <button type="button" className="cln-icon-btn" onClick={onClose} aria-label={t(locale, 'Close', 'إغلاق')}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="cln-plan-gate-summary">
          <div>
            <span>{t(locale, 'Plan', 'الخطة')}</span>
            <strong className="cln-mono" title={plan.planId}>{plan.planId.slice(0, 16)}</strong>
          </div>
          <div>
            <span>{t(locale, 'Mode', 'الوضع')}</span>
            <strong>{planModeLabel(plan.mode, locale)}</strong>
          </div>
          <div>
            <span>{t(locale, 'Items', 'العناصر')}</span>
            <strong>{formatCount(plan.totals.count)}</strong>
          </div>
          <div>
            <span>{t(locale, 'Blocked', 'محجوبة')}</span>
            <strong className={plan.totals.blocked ? 'cln-text-rose' : ''}>{formatCount(plan.totals.blocked)}</strong>
          </div>
          <div>
            <span>{t(locale, 'Eligible evidence', 'الدليل المؤهل')}</span>
            <strong className="cln-amber">{formatBytes(plan.totals.eligibleBytes)}</strong>
          </div>
          <div>
            <span>{t(locale, 'Evidence source', 'مصدر الدليل')}</span>
            <strong>{plan.totals.reclaimSource}</strong>
          </div>
          <div>
            <span>{t(locale, 'Fingerprint', 'البصمة')}</span>
            <strong className="cln-mono">{plan.fingerprint}</strong>
          </div>
          <div>
            <span>{t(locale, 'Created', 'أُنشئت')}</span>
            <strong>{formatTimestamp(plan.createdAt, locale)}</strong>
          </div>
        </div>

        <div className="cln-plan-gate-list knx-custom-scrollbar">
          {plan.items.map((item) => (
            <div key={item.candidateId} className="cln-plan-gate-item">
              <div className="cln-plan-item-top">
                <div className="min-w-0">
                  <div className="cln-row-name" title={item.name}>{item.name}</div>
                  <div className="cln-row-path cln-mono" title={item.path || ''}>
                    {item.path || t(locale, 'Path withheld by the provider', 'المسار محجوب من المزوّد')}
                  </div>
                  <div className="cln-row-provider">
                    {item.category} · {safetyLabel(item.safety, locale)} · {riskLabel(item.risk === 'review' ? 'medium' : item.risk === 'blocked' ? 'blocked' : 'low', locale)}
                  </div>
                </div>
                <div className="cln-plan-item-meta">
                  <span className="cln-mono">{formatBytes(item.sizeBytes)}</span>
                  <span className={`cln-badge cln-badge-${item.risk === 'blocked' ? 'blocked' : item.risk === 'review' ? 'review' : 'eligible'}`}>
                    {item.risk === 'blocked' ? t(locale, 'Blocked', 'محجوب') : item.risk === 'review' ? t(locale, 'Review', 'مراجعة') : t(locale, 'Eligible', 'مؤهل')}
                  </span>
                </div>
              </div>
              {item.reasons.length ? (
                <ul className="cln-plan-reasons">
                  {item.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              ) : null}
            </div>
          ))}
          {!plan.items.length ? (
            <div className="cln-empty">
              <AlertTriangle className="w-6 h-6" />
              <strong>{t(locale, 'The plan contains no items', 'الخطة لا تحتوي عناصر')}</strong>
              <p>{t(locale, 'Select measured candidates and stage the review again.', 'حدد مرشحين مقيسين وأعد إعداد المراجعة.')}</p>
            </div>
          ) : null}
        </div>

        <div className="cln-plan-gate-blocked">
          <ShieldOff className="w-4 h-4 shrink-0" />
          <div>
            <strong>{plan.execution.gate}</strong>
            <p>{plan.execution.reason}</p>
            <p className="cln-muted">{plan.rollback.reason}</p>
          </div>
        </div>

        <div className="cln-plan-gate-actions">
          <button type="button" className="cln-btn cln-btn-primary" onClick={() => void copyPlan()}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
            {copied ? t(locale, 'Copied', 'نُسخت') : t(locale, 'Copy plan JSON', 'نسخ الخطة JSON')}
          </button>
          <button type="button" className="cln-btn cln-btn-ghost" onClick={onClose}>
            {t(locale, 'Close review', 'إغلاق المراجعة')}
          </button>
          <span className="cln-gate-note cln-gate-note-inline">
            <Lock className="w-3 h-3" />
            {t(locale, 'Execution disabled by design', 'التنفيذ معطّل بالتصميم')}
          </span>
        </div>
      </div>
    </div>
  );
}
