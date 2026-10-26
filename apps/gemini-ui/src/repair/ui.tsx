/**
 * KNOuX Recovery Lab - shared measured workbench primitives (Mission 11).
 * These components never execute a repair command. They display fixed command
 * previews, measured prerequisites and immutable review plans.
 */
import React, { type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  XCircle,
} from 'lucide-react';
import type { RepairPlanItem, RepairSnapshot, RepairToolId } from '../../shared/native-contracts';
import type { RepairLocale } from './catalog';
import { RISK_META, STATE_META, TOOL_BY_ID, GUIDED_STEPS, toolLabel } from './catalog';
import type { RepairController } from './useRepair';
import { commandForTool, planForTool, riskMeta, t } from './model';
import { Chip, CodeBlock, CopyButton, Panel, cx } from '../system/ui';

export interface RepairWorkbenchProps {
  locale: RepairLocale;
  snapshot: RepairSnapshot;
  controller: RepairController;
  toolId: RepairToolId;
}

export function RepairToolFrame({
  toolId,
  locale,
  children,
  foot,
  provider,
}: {
  toolId: RepairToolId;
  locale: RepairLocale;
  children: ReactNode;
  foot?: ReactNode;
  provider?: string;
}) {
  const entry = TOOL_BY_ID[toolId];
  const Icon = entry.icon;
  const risk = RISK_META[entry.risk];
  const state = STATE_META[entry.state];
  return (
    <section className="sys-workbench rep-workbench" data-testid={`repair-service-workspace-${toolId}`}>
      <header className="sys-wb-head">
        <div className="sys-wb-identity">
          <span className="sys-wb-icon" style={{ color: entry.accent, borderColor: `${entry.accent}55` }} aria-hidden="true">
            <Icon />
          </span>
          <div className="sys-wb-copy">
            <span className="sys-wb-eyebrow">
              {t(locale, 'Repair tool', 'أداة إصلاح')} {String(entry.index).padStart(2, '0')} · {entry.id}
            </span>
            <h2>{toolLabel(toolId, locale)}</h2>
            <p>{locale === 'ar' ? entry.blurbAr : entry.blurbEn}</p>
          </div>
        </div>
        <div className="sys-wb-badges">
          <Chip tone={state.tone}>{t(locale, state.en, state.ar)}</Chip>
          <Chip tone={risk.tone} icon={entry.risk === 'administrative' ? ShieldAlert : ShieldCheck}>{t(locale, risk.en, risk.ar)}</Chip>
          <Chip tone="muted" title={provider || entry.provider}>{provider || entry.provider}</Chip>
        </div>
      </header>
      <div className="sys-service-body sys-wb-body rep-wb-body">{children}</div>
      {foot ? <footer className="sys-wb-foot">{foot}</footer> : null}
    </section>
  );
}

export function CommandPreview({ locale, snapshot, toolId }: { locale: RepairLocale; snapshot: RepairSnapshot; toolId: RepairToolId }) {
  const command = commandForTool(snapshot, toolId);
  if (!command) {
    return (
      <Panel title={t(locale, 'Windows handoff', 'انتقال Windows')} icon={Terminal}>
        <p className="sys-muted-text">
          {t(locale, 'This service uses an allowlisted Windows settings handoff and has no command to preview.', 'تستخدم هذه الخدمة انتقال إعدادات Windows مسموحًا ولا يوجد أمر للمعاينة.')}
        </p>
      </Panel>
    );
  }
  return (
    <Panel
      title={t(locale, 'Fixed command preview', 'معاينة أمر ثابت')}
      sub={t(locale, 'Display only. No renderer value can alter this command.', 'للعرض فقط. لا يمكن لأي قيمة من الواجهة تعديل هذا الأمر.')}
      icon={Terminal}
      actions={<CopyButton locale={locale} text={command.display} label={t(locale, 'Copy command', 'نسخ الأمر')} />}
    >
      <CodeBlock label={locale === 'ar' ? command.labelAr : command.labelEn}>
        {command.display}
      </CodeBlock>
      <div className="rep-command-flags">
        <Chip tone={command.elevationRequired ? 'warn' : 'muted'} icon={command.elevationRequired ? ShieldAlert : ShieldCheck}>
          {command.elevationRequired ? t(locale, 'Elevation required', 'يتطلب رفع صلاحيات') : t(locale, 'No elevation required', 'لا يتطلب رفع صلاحيات')}
        </Chip>
        <Chip tone={command.rebootRequired ? 'bad' : 'muted'}>
          {command.rebootRequired ? t(locale, 'Reboot required', 'يتطلب إعادة تشغيل') : t(locale, 'No reboot flag', 'لا يتطلب إعادة تشغيل')}
        </Chip>
        <Chip tone="bad" icon={Lock}>{t(locale, 'Execution unavailable', 'التنفيذ غير متاح')}</Chip>
      </div>
      <p className="rep-blocked-note">
        <Lock aria-hidden="true" />
        {command.execution.reason}
      </p>
    </Panel>
  );
}

export function PrerequisiteList({ locale, item }: { locale: RepairLocale; item: RepairPlanItem | null }) {
  if (!item) {
    return (
      <p className="sys-muted-text">
        {t(locale, 'Stage a preview to evaluate the measured prerequisites.', 'هيّئ معاينة لتقييم المتطلبات المقيسة.')}
      </p>
    );
  }
  return (
    <ul className="rep-prereq-list">
      {item.prerequisites.map((entry) => (
        <li key={entry.id} className={cx('rep-prereq', `is-${entry.status}`)}>
          {entry.status === 'passed' ? <CheckCircle2 aria-hidden="true" /> : entry.status === 'failed' ? <XCircle aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
          <div>
            <strong>{locale === 'ar' ? entry.labelAr : entry.labelEn}</strong>
            <em>{entry.detail}</em>
          </div>
          <span>{entry.status}</span>
        </li>
      ))}
    </ul>
  );
}

export function EvidenceRows({ locale, item }: { locale: RepairLocale; item: RepairPlanItem | null }) {
  if (!item || !item.evidence.length) {
    return (
      <p className="sys-muted-text">
        {t(locale, 'Measured tool evidence appears after a preview is staged.', 'تظهر أدلة الأداة المقيسة بعد تهيئة المعاينة.')}
      </p>
    );
  }
  return (
    <div className="sys-data-rows">
      {item.evidence.map((entry, index) => (
        <div className="sys-data-row" key={`${entry.label}-${index}`}>
          <span>{entry.label}</span>
          <strong className={cx(entry.status === 'unavailable' && 'is-unknown', entry.status === 'permission_denied' && 'is-denied')}>
            {entry.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

export function GuidedSequence({ locale, activeIndex = 5 }: { locale: RepairLocale; activeIndex?: number }) {
  return (
    <ol className="rep-guided" aria-label={t(locale, 'Guided repair sequence', 'تسلسل الإصلاح الموجه')}>
      {GUIDED_STEPS.map((step) => {
        const blocked = step.index >= 6;
        return (
          <li
            key={step.index}
            className={cx('rep-guided-step', step.index === activeIndex && 'is-active', blocked && 'is-blocked')}
            aria-current={step.index === activeIndex ? 'step' : undefined}
          >
            <span className="rep-guided-index">{blocked ? <Lock aria-hidden="true" /> : step.index}</span>
            <div>
              <strong>{locale === 'ar' ? step.ar : step.en}</strong>
              <em>{locale === 'ar' ? step.noteAr : step.noteEn}</em>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function PlanDock({
  locale,
  controller,
  toolId,
  title,
}: {
  locale: RepairLocale;
  controller: RepairController;
  toolId: RepairToolId;
  title?: string;
}) {
  const item = planForTool(controller.plan, toolId);
  return (
    <Panel
      className="rep-plan-dock"
      title={title || t(locale, 'Staged review dock', 'رصيف المراجعة المُهيَّأ')}
      icon={Lock}
      actions={
        <button
          type="button"
          className="sys-btn sys-btn-primary"
          onClick={() => void controller.stagePlan([toolId])}
          disabled={controller.busy === 'plan'}
        >
          <ShieldCheck aria-hidden="true" />
          {item ? t(locale, 'Re-stage preview', 'إعادة تهيئة المعاينة') : t(locale, 'Stage preview', 'تهيئة معاينة')}
        </button>
      }
    >
      {item ? (
        <>
          <div className="rep-plan-summary">
            <Chip tone={riskMeta(item.risk).tone}>{t(locale, riskMeta(item.risk).en, riskMeta(item.risk).ar)}</Chip>
            <Chip tone={item.elevationRequired ? 'warn' : 'muted'}>{item.elevationRequired ? t(locale, 'Elevation', 'رفع صلاحيات') : t(locale, 'Standard user', 'مستخدم عادي')}</Chip>
            <Chip tone={item.rebootRequired ? 'bad' : 'muted'}>{item.rebootRequired ? t(locale, 'Reboot', 'إعادة تشغيل') : t(locale, 'No reboot', 'بلا إعادة تشغيل')}</Chip>
            <Chip tone="bad" icon={Lock}>{t(locale, 'Not executed', 'لم يُنفذ')}</Chip>
          </div>
          <p className="rep-impact">{locale === 'ar' ? item.impactAr : item.impactEn}</p>
          <div className="rep-plan-grid">
            <div>
              <h4>{t(locale, 'Measured prerequisites', 'المتطلبات المقيسة')}</h4>
              <PrerequisiteList locale={locale} item={item} />
            </div>
            <div>
              <h4>{t(locale, 'Evidence snapshot', 'لقطة الأدلة')}</h4>
              <EvidenceRows locale={locale} item={item} />
            </div>
          </div>
          <div className="rep-plan-receipt">
            <span>{t(locale, 'Plan receipt', 'إيصال الخطة')}: <code>{controller.plan?.receipt || '—'}</code></span>
            <span>{t(locale, 'Items', 'العناصر')}: {controller.plan?.itemCount || 0}</span>
            <span>{t(locale, 'Journal', 'السجل')}: {controller.plan?.journalRecorded ? t(locale, 'recorded', 'مسجّل') : t(locale, 'not recorded', 'غير مسجّل')}</span>
          </div>
          <p className="rep-blocked-note">
            <Lock aria-hidden="true" />
            {controller.plan?.execution.reason}
          </p>
        </>
      ) : (
        <>
          <p className="rep-impact">
            {controller.plan
              ? t(
                locale,
                'A preview is currently staged for another tool. Stage this tool to review its own measured prerequisites.',
                'توجد معاينة مُهيَّأة لأداة أخرى حاليًا. هيّئ هذه الأداة لمراجعة متطلباتها المقيسة.',
              )
              : t(
                locale,
                'Nothing is staged yet. A preview computes prerequisites from the measured snapshot and records the immutable review locally. It does not run a repair.',
                'لم يُهيَّأ شيء بعد. تحسب المعاينة المتطلبات من اللقطة المقيسة وتسجل المراجعة الثابتة محليًا. لا تنفذ أي إصلاح.',
              )}
          </p>
          <EvidenceRows locale={locale} item={null} />
        </>
      )}
    </Panel>
  );
}

export function SafetyNote({ locale, children, tone = 'warn' }: { locale: RepairLocale; children?: ReactNode; tone?: 'warn' | 'bad' | 'good' }) {
  return (
    <div className={cx('rep-safety-note', `is-${tone}`)}>
      {tone === 'bad' ? <ShieldAlert aria-hidden="true" /> : tone === 'good' ? <ShieldCheck aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
      <div>{children || (tone === 'bad'
        ? t(locale, 'High-risk administrative action. Execution is not available in Mission 11.', 'إجراء إداري عالي الخطورة. التنفيذ غير متاح في المهمة 11.')
        : t(locale, 'Read-only evidence. Nothing on this machine is changed.', 'أدلة للقراءة فقط. لا يُغيَّر أي شيء على هذا الجهاز.'))}</div>
    </div>
  );
}
