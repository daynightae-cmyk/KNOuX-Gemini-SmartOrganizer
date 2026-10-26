/**
 * Immutable startup review-plan gate. The plan can be inspected and copied, but
 * no registry, task, service or journal write channel exists in Mission 09.
 */
import React, { useState } from 'react';
import {
  AlertTriangle,
  ClipboardCopy,
  Lock,
  ShieldOff,
  X,
} from 'lucide-react';
import type { StartupPlan } from '../../shared/native-contracts';
import {
  formatCount,
  formatTimestamp,
  planActionLabel,
  planModeLabel,
  t,
} from './model';
import type { StartupLocale } from './model';

export interface PlanGateProps {
  locale: StartupLocale;
  plan: StartupPlan;
  onClose: () => void;
  onNotice: (message: string) => void;
}

export function PlanGate({ locale, plan, onClose, onNotice }: PlanGateProps) {
  const [copied, setCopied] = useState(false);

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
      setCopied(true);
      onNotice(t(locale, 'Immutable review plan copied as JSON to the clipboard.', 'نُسخت خطة المراجعة الثابتة JSON إلى الحافظة.'));
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      onNotice(t(locale, 'The clipboard is unavailable; the plan was not copied.', 'الحافظة غير متاحة؛ لم تُنسخ الخطة.'));
    }
  };

  return (
    <div className="stp-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="stp-plan-gate-title">
      <div className="stp-plan-gate" data-testid="startup-plan-gate">
        <div className="stp-plan-gate-head">
          <div className="stp-plan-gate-icon"><Lock className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h2 id="stp-plan-gate-title">{t(locale, 'Immutable startup review gate', 'بوابة مراجعة بدء التشغيل الثابتة')}</h2>
            <p>
              {t(
                locale,
                'This plan is a read-only review artifact. Mission 09 has no registry write, task change, service policy change, journal append or elevation channel.',
                'هذه الخطة أثر مراجعة للقراءة فقط. لا توجد في المهمة 09 قناة كتابة تسجيل أو تغيير مهمة أو سياسة خدمة أو إضافة سجل أو رفع صلاحيات.'
              )}
            </p>
          </div>
          <button type="button" className="stp-icon-btn" onClick={onClose} aria-label={t(locale, 'Close plan', 'إغلاق الخطة')}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="stp-plan-gate-summary">
          <div>
            <span>{t(locale, 'Plan', 'الخطة')}</span>
            <strong className="stp-mono" title={plan.id}>{plan.id.slice(0, 18)}</strong>
          </div>
          <div>
            <span>{t(locale, 'Mode', 'الوضع')}</span>
            <strong>{planModeLabel(plan.mode, locale)}</strong>
          </div>
          <div>
            <span>{t(locale, 'Items', 'العناصر')}</span>
            <strong>{formatCount(plan.itemCount)}</strong>
          </div>
          <div>
            <span>{t(locale, 'Protected', 'محمي')}</span>
            <strong className={plan.protectedCount ? 'stp-tone-bad' : ''}>{formatCount(plan.protectedCount)}</strong>
          </div>
          <div>
            <span>{t(locale, 'Elevation', 'رفع صلاحيات')}</span>
            <strong className={plan.elevationCount ? 'stp-tone-amber' : ''}>{formatCount(plan.elevationCount)}</strong>
          </div>
          <div>
            <span>{t(locale, 'Conflicts', 'التعارضات')}</span>
            <strong className={plan.conflictCount ? 'stp-tone-amber' : ''}>{formatCount(plan.conflictCount)}</strong>
          </div>
          <div>
            <span>{t(locale, 'Estimated saving', 'التوفير المقدر')}</span>
            <strong className="stp-tone-muted">{t(locale, 'Not claimed', 'غير مُدّعى')}</strong>
          </div>
          <div>
            <span>{t(locale, 'Created', 'أُنشئت')}</span>
            <strong>{formatTimestamp(plan.createdAt, locale)}</strong>
          </div>
        </div>

        <div className="stp-plan-gate-list knx-custom-scrollbar">
          {plan.items.map((item) => (
            <div key={item.entryId} className="stp-plan-gate-item">
              <div className="stp-plan-item-top">
                <div className="min-w-0">
                  <div className="stp-row-name" title={item.name}>{item.name}</div>
                  <div className="stp-row-sub" title={item.location}>{item.location}</div>
                  <div className="stp-row-faint">{item.sourceKind}</div>
                </div>
                <div className="stp-plan-item-meta">
                  <span className="stp-plan-action">{planActionLabel(item.action, locale)}</span>
                  {item.protected ? <span className="stp-chip stp-chip-bad">{t(locale, 'Protected', 'محمي')}</span> : null}
                  {item.elevationRequired ? <span className="stp-chip stp-chip-warn">{t(locale, 'Elevation', 'رفع صلاحيات')}</span> : null}
                </div>
              </div>
              <div className="stp-plan-diff">
                <span className="stp-plan-before">{item.before || '—'}</span>
                <span aria-hidden="true">→</span>
                <span className="stp-plan-after">{item.after || '—'}</span>
              </div>
              {item.conflicts.length ? (
                <ul className="stp-plan-reasons">
                  {item.conflicts.map((reason) => <li key={reason}><AlertTriangle className="w-3 h-3" />{reason}</li>)}
                </ul>
              ) : null}
            </div>
          ))}
          {!plan.items.length ? (
            <div className="stp-empty">
              <AlertTriangle className="w-6 h-6" />
              <strong>{t(locale, 'The plan contains no items', 'الخطة لا تحتوي عناصر')}</strong>
            </div>
          ) : null}
        </div>

        {plan.warnings.length ? (
          <div className="stp-plan-warnings">
            <ShieldOff className="w-4 h-4" />
            <div>
              <strong>{t(locale, 'Review conflicts', 'تعارضات المراجعة')}</strong>
              <ul>
                {plan.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          </div>
        ) : null}

        <div className="stp-plan-gate-execution">
          <div>
            <span>{t(locale, 'Execution gate', 'بوابة التنفيذ')}</span>
            <strong>{plan.execution.gate}</strong>
            <p>{plan.execution.reason}</p>
          </div>
          <span className="stp-chip stp-chip-bad">{t(locale, 'BLOCKED', 'محجوب')}</span>
        </div>

        <div className="stp-plan-gate-foot">
          <span className="stp-gate-note">
            <Lock className="w-3 h-3" />
            {t(locale, 'mutation', 'التغيير')}: {plan.mutation} · {t(locale, 'immutable', 'ثابت')}: {String(plan.immutable)}
          </span>
          <div className="stp-plan-gate-actions">
            <button type="button" className="stp-btn stp-btn-ghost" onClick={() => void copyPlan()}>
              <ClipboardCopy className="w-3.5 h-3.5" />
              {copied ? t(locale, 'Copied', 'نُسخ') : t(locale, 'Copy plan JSON', 'نسخ الخطة JSON')}
            </button>
            <button type="button" className="stp-btn stp-btn-primary" onClick={onClose}>
              {t(locale, 'Back to evidence', 'العودة إلى الأدلة')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
