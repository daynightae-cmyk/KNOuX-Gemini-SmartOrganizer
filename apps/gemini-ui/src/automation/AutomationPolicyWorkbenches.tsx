/**
 * Flow Studio - policy and transfer workbenches (07-12).
 * All drafts are local metadata. No notification, power action, deletion or
 * file copy is executed.
 */
import React, { useMemo, useState } from 'react';
import {
  Archive,
  BatteryCharging,
  Bell,
  Clock3,
  FileText,
  HardDriveDownload,
  Lock,
  Moon,
  Play,
  Save,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { AutomationWorkflow } from '../../shared/native-contracts';
import type { AutomationWorkbenchProps } from './ui';
import {
  AutomationToolFrame,
  DryRunTimeline,
  PolicyEditor,
  QuietHoursEditor,
  SchedulePreviewList,
  TriggerEditor,
  WorkflowCanvas,
} from './ui';
import {
  ageDays,
  cloneWorkflow,
  initialWorkflow,
  journalWithinRetention,
  scheduleSpecFromWorkflow,
  t,
  workflowDraftFromTemplate,
  CHANNEL_LABELS,
} from './model';
import { Chip, CodeBlock, CopyButton, DataRows, ExportButton, Panel, Seg, downloadJson } from '../system/ui';

async function saveDraft(controller: AutomationWorkbenchProps['controller'], draft: AutomationWorkflow | null, setDraft: (value: AutomationWorkflow | null) => void) {
  if (!draft) return;
  const saved = await controller.saveWorkflow(draft);
  if (saved) setDraft(cloneWorkflow(saved));
}

/* 07 - Notification routing */
export function NotifyWorkbench({ locale, snapshot, controller }: AutomationWorkbenchProps) {
  const [draft, setDraft] = useState<AutomationWorkflow | null>(() => initialWorkflow(snapshot, 'tpl-notification-digest'));
  const [sampleAt, setSampleAt] = useState<string | null>(null);
  return (
    <AutomationToolFrame
      toolId="auto-notify"
      locale={locale}
      foot={<><span><Bell aria-hidden="true" />{t(locale, 'Local channels only', 'قنوات محلية فقط')}</span><span><Lock aria-hidden="true" />{t(locale, 'No external message', 'لا رسالة خارجية')}</span></>}
    >
      {draft ? (
        <div className="sys-split-2">
          <Panel title={t(locale, 'Routing policy', 'سياسة التوجيه')} icon={Bell}>
            <PolicyEditor locale={locale} workflow={draft} onChange={setDraft} />
            <DataRows rows={[
              { label: t(locale, 'Active channels', 'القنوات النشطة'), value: draft.policy.notifyChannels.map((channel) => CHANNEL_LABELS[channel]?.[locale === 'ar' ? 'ar' : 'en'] || channel).join(', ') },
              { label: t(locale, 'Quiet hours', 'ساعات الهدوء'), value: draft.quietHours.enabled ? `${draft.quietHours.start}–${draft.quietHours.end}` : t(locale, 'disabled', 'معطلة'), tone: draft.quietHours.enabled ? 'warn' : 'muted' },
              { label: t(locale, 'External delivery', 'التسليم الخارجي'), value: t(locale, 'Not available', 'غير متاح'), tone: 'bad' },
            ]} />
            <div className="sys-toolbar-row">
              <button type="button" className="sys-btn sys-btn-ghost" onClick={() => { controller.showNotice(t(locale, 'In-app sample only. No OS notification, email or webhook was sent.', 'عينة داخل التطبيق فقط. لم يُرسل إشعار نظام أو بريد أو webhook.')); setSampleAt(new Date().toISOString()); }}><Bell aria-hidden="true" />{t(locale, 'Test in-app sample', 'اختبار عينة داخل التطبيق')}</button>
              <button type="button" className="sys-btn sys-btn-primary" onClick={() => void saveDraft(controller, draft, setDraft)} disabled={controller.busy === 'save'}><Save aria-hidden="true" />{t(locale, 'Save policy draft', 'حفظ مسودة السياسة')}</button>
            </div>
            {sampleAt ? <p className="auto-op-hint">{t(locale, 'Last in-app sample', 'آخر عينة داخل التطبيق')}: {sampleAt}</p> : null}
          </Panel>
          <Panel title={t(locale, 'Event severity filter', 'مرشح شدة الأحداث')} icon={ShieldAlert}>
            <div className="auto-severity-ladder">
              {[
                { key: 'info', label: t(locale, 'Information', 'معلومات') },
                { key: 'warning', label: t(locale, 'Warning', 'تحذير') },
                { key: 'error', label: t(locale, 'Error', 'خطأ') },
              ].map((entry, index) => (
                <div key={entry.key} className={`auto-severity-level ${draft.policy.severity === entry.key ? 'is-active' : ''}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{entry.label}</strong>
                  {draft.policy.severity === entry.key ? <Chip tone="warn">{t(locale, 'threshold', 'الحد')}</Chip> : null}
                </div>
              ))}
            </div>
            <p className="auto-op-hint">{t(locale, 'Severity is a draft threshold. No event is routed because no notification engine exists.', 'الشدة حد في المسودة. لا يُوجه أي حدث لعدم وجود محرك إشعارات.')}</p>
          </Panel>
        </div>
      ) : <p className="auto-op-hint">{t(locale, 'No workflow draft is available.', 'لا مسودة سير عمل متاحة.')}</p>}
    </AutomationToolFrame>
  );
}

/* 08 - Quiet hours */
export function QuietHoursWorkbench({ locale, snapshot, controller }: AutomationWorkbenchProps) {
  const [draft, setDraft] = useState<AutomationWorkflow | null>(() => initialWorkflow(snapshot, 'tpl-notification-digest'));
  return (
    <AutomationToolFrame
      toolId="auto-quiet-hours"
      locale={locale}
      foot={<><span><Moon aria-hidden="true" />{draft ? `${draft.quietHours.start}–${draft.quietHours.end}` : '—'}</span><span><Lock aria-hidden="true" />{t(locale, 'Policy metadata only', 'بيانات سياسة فقط')}</span></>}
    >
      {draft ? (
        <>
          <QuietHoursEditor locale={locale} workflow={draft} onChange={setDraft} />
          <div className="sys-split-2">
            <Panel title={t(locale, 'Muted event classes', 'فئات الأحداث المكتومة')} icon={Moon}>
              <DataRows rows={[
                { label: t(locale, 'Information', 'معلومات'), value: draft.quietHours.weekendRule === 'mute' ? t(locale, 'Muted in quiet window', 'مكتومة في نافذة الهدوء') : t(locale, 'Policy inherited', 'سياسة موروثة') },
                { label: t(locale, 'Warning', 'تحذير'), value: t(locale, 'Policy preview only', 'معاينة سياسة فقط'), tone: 'warn' },
                { label: t(locale, 'Error', 'خطأ'), value: t(locale, 'Never suppressed by this draft', 'لا تكتمها هذه المسودة'), tone: 'good' },
              ]} />
              <p className="auto-op-hint">{t(locale, 'No runtime suppression exists. This draft documents intended policy only.', 'لا يوجد كتم وقت التشغيل. توثق هذه المسودة السياسة المقصودة فقط.')}</p>
            </Panel>
            <Panel title={t(locale, 'Gated automation rules', 'قواعد الأتمتة المحجوبة')} icon={Lock}>
              <DataRows rows={[
                { label: t(locale, 'Scheduled actions', 'الإجراءات المجدولة'), value: t(locale, '0 executing', '0 قيد التنفيذ'), tone: 'muted' },
                { label: t(locale, 'Quiet window', 'نافذة الهدوء'), value: `${draft.quietHours.start}–${draft.quietHours.end}` },
                { label: t(locale, 'Days', 'الأيام'), value: draft.quietHours.days.join(', '), mono: true },
              ]} />
              <button type="button" className="sys-btn sys-btn-primary" onClick={() => void saveDraft(controller, draft, setDraft)} disabled={controller.busy === 'save'}><Save aria-hidden="true" />{t(locale, 'Save quiet-hours draft', 'حفظ مسودة الهدوء')}</button>
            </Panel>
          </div>
        </>
      ) : <p className="auto-op-hint">{t(locale, 'No workflow draft is available.', 'لا مسودة سير عمل متاحة.')}</p>}
    </AutomationToolFrame>
  );
}

/* 09 - Power-aware policy */
export function BatteryPolicyWorkbench({ locale, snapshot, controller }: AutomationWorkbenchProps) {
  const [draft, setDraft] = useState<AutomationWorkflow | null>(() => initialWorkflow(snapshot, 'tpl-storage-watch'));
  const runtime = snapshot.runtime;
  return (
    <AutomationToolFrame
      toolId="auto-battery-policy"
      locale={locale}
      foot={<><span><BatteryCharging aria-hidden="true" />{runtime.batteryAvailable ? `${runtime.batteryCount} ${t(locale, 'battery measured', 'بطارية مقيسة')}` : t(locale, 'No battery measured', 'لا بطارية مقيسة')}</span><span><Lock aria-hidden="true" />{t(locale, 'No power action', 'لا إجراء طاقة')}</span></>}
    >
      <div className="sys-split-2">
        <Panel title={t(locale, 'Measured power evidence', 'أدلة الطاقة المقيسة')} icon={BatteryCharging}>
          <DataRows rows={[
            { label: t(locale, 'Battery available', 'البطارية متاحة'), value: runtime.batteryAvailable ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا'), tone: runtime.batteryAvailable ? 'good' : 'warn' },
            { label: t(locale, 'Charge', 'الشحن'), value: runtime.batteryChargePercent == null ? '—' : `${runtime.batteryChargePercent}%` },
            { label: t(locale, 'Power source', 'مصدر الطاقة'), value: runtime.powerSource || '—' },
          ]} />
          <div className={`auto-branch ${runtime.batteryAvailable ? 'is-live' : 'is-unavailable'}`}>
            <div><strong>{t(locale, 'AC branch', 'فرع التيار')}</strong><em>{runtime.powerSource === 'AC' ? t(locale, 'Measured AC', 'تيار متردد مقيس') : t(locale, 'Not measured', 'غير مقيس')}</em></div>
            <div><strong>{t(locale, 'Battery branch', 'فرع البطارية')}</strong><em>{runtime.batteryAvailable ? (runtime.batteryChargePercent ?? '—') + '%' : t(locale, 'Cannot evaluate', 'لا يمكن التقييم')}</em></div>
          </div>
          <p className="auto-op-hint">{t(locale, 'A missing battery is reported as unavailable. No charge or AC state is invented.', 'البطارية الغائبة تُعرض كغير متاحة. لا تُختلق حالة شحن أو تيار.')}</p>
        </Panel>
        <Panel title={t(locale, 'Policy draft', 'مسودة السياسة')} icon={ShieldAlert}>
          {draft ? (
            <>
              <label className="auto-field"><span>{t(locale, 'Battery threshold', 'حد البطارية')}: {draft.policy.batteryThreshold}%</span><input type="range" min={0} max={100} value={draft.policy.batteryThreshold} onChange={(event) => setDraft({ ...draft, policy: { ...draft.policy, batteryThreshold: Number(event.target.value) } })} /></label>
              <label className="auto-field"><span>{t(locale, 'Require AC power', 'يتطلب التيار المتردد')}</span><input type="checkbox" checked={draft.policy.acOnly} onChange={(event) => setDraft({ ...draft, policy: { ...draft.policy, acOnly: event.target.checked } })} /></label>
              <DataRows rows={[
                { label: t(locale, 'Threshold', 'الحد'), value: `${draft.policy.batteryThreshold}%` },
                { label: t(locale, 'Evaluation', 'التقييم'), value: runtime.batteryAvailable ? (runtime.batteryChargePercent != null && runtime.batteryChargePercent >= draft.policy.batteryThreshold ? t(locale, 'Would pass', 'سيمر') : t(locale, 'Would gate', 'سيُحجب')) : t(locale, 'Unavailable on this device', 'غير متاح على هذا الجهاز'), tone: runtime.batteryAvailable ? 'info' : 'warn' },
                { label: t(locale, 'Power action', 'إجراء الطاقة'), value: t(locale, 'Not available', 'غير متاح'), tone: 'bad' },
              ]} />
              <button type="button" className="sys-btn sys-btn-primary" onClick={() => void saveDraft(controller, draft, setDraft)} disabled={controller.busy === 'save'}><Save aria-hidden="true" />{t(locale, 'Save power policy draft', 'حفظ مسودة سياسة الطاقة')}</button>
            </>
          ) : <p className="auto-op-hint">{t(locale, 'No draft is available.', 'لا مسودة متاحة.')}</p>}
        </Panel>
      </div>
    </AutomationToolFrame>
  );
}

/* 10 - Artifact retention */
export function RetentionWorkbench({ locale, snapshot, controller }: AutomationWorkbenchProps) {
  const entries = controller.journal.length ? controller.journal : snapshot.journal;
  const [days, setDays] = useState<14 | 30 | 90>(30);
  const counts = useMemo(() => ({ 14: journalWithinRetention(entries, 14).aged.length, 30: journalWithinRetention(entries, 30).aged.length, 90: journalWithinRetention(entries, 90).aged.length }), [entries]);
  const aged = journalWithinRetention(entries, days).aged;
  return (
    <AutomationToolFrame
      toolId="auto-retention"
      locale={locale}
      foot={<><span><Archive aria-hidden="true" />{entries.length} {t(locale, 'dry-run records', 'سجل معاينة جافة')}</span><span><Lock aria-hidden="true" />{t(locale, 'No deletion channel', 'لا قناة حذف')}</span></>}
    >
      <div className="auto-retention-bar">
        {([14, 30, 90] as const).map((value) => (
          <button key={value} type="button" className={`auto-retention-segment ${days === value ? 'is-active' : ''}`} onClick={() => setDays(value)} aria-pressed={days === value}>
            <strong>{value}d</strong>
            <span>{counts[value]} {t(locale, 'aged', 'قديم')}</span>
          </button>
        ))}
      </div>
      <div className="sys-split-2">
        <Panel title={t(locale, 'Aged artifacts', 'المخرجات القديمة')} sub={`${aged.length} ${t(locale, 'records beyond', 'سجل يتجاوز')} ${days}d`} icon={Archive}>
          <div className="auto-aged-list">
            {aged.slice(0, 20).map((entry) => (
              <div key={entry.id} className="auto-aged-row">
                <span><strong>{entry.workflowName}</strong><em>{entry.receipt}</em></span>
                <Chip tone="warn">{ageDays(entry.at)} {t(locale, 'days', 'يوم')}</Chip>
              </div>
            ))}
            {!aged.length ? <p className="auto-op-hint">{t(locale, 'No dry-run record is older than this window.', 'لا سجل معاينة أقدم من هذه النافذة.')}</p> : null}
          </div>
          <p className="auto-op-hint">{t(locale, 'Estimated reclaimed storage is not calculated because no artifact files exist. Dry-runs store metadata only.', 'لا تُحسب المساحة المستعادة لأنه لا توجد ملفات مخرجات. تخزن المعاينات بيانات وصفية فقط.')}</p>
        </Panel>
        <Panel title={t(locale, 'Retention policy', 'سياسة الاحتفاظ')} icon={Lock}>
          <DataRows rows={[
            { label: t(locale, 'Window', 'النافذة'), value: `${days} ${t(locale, 'days', 'يوم')}` },
            { label: t(locale, 'Aged records', 'السجلات القديمة'), value: String(aged.length) },
            { label: t(locale, 'Auto-prune', 'التقليم التلقائي'), value: t(locale, 'Not available', 'غير متاح'), tone: 'bad' },
            { label: t(locale, 'Delete channel', 'قناة الحذف'), value: t(locale, 'None', 'لا يوجد'), tone: 'bad' },
          ]} />
          <ExportButton fileName="knoux-flow-retention-preview.json" payload={{ windowDays: days, aged, mutation: 'none' }} label={t(locale, 'Export retention preview', 'تصدير معاينة الاحتفاظ')} onDone={(ok) => controller.showNotice(ok ? t(locale, 'Retention preview exported.', 'صُدّرت معاينة الاحتفاظ.') : t(locale, 'Export could not start.', 'تعذّر بدء التصدير.'))} />
        </Panel>
      </div>
    </AutomationToolFrame>
  );
}

/* 11 - Workflow export & import validation */
export function ExportWorkbench({ locale, snapshot, controller }: AutomationWorkbenchProps) {
  const draft = initialWorkflow(snapshot);
  const json = draft ? JSON.stringify(draft, null, 2) : '';
  const [importText, setImportText] = useState('');
  const validation = controller.importValidation;
  return (
    <AutomationToolFrame
      toolId="auto-export"
      locale={locale}
      provider="knoux.workflow.v1"
      foot={<><span><FileText aria-hidden="true" />{t(locale, 'Schema', 'المخطط')}: 1.0</span><span><Lock aria-hidden="true" />{t(locale, 'No embedded commands or credentials', 'لا أوامر أو بيانات اعتماد مضمّنة')}</span></>}
    >
      <div className="sys-split-2">
        <Panel title={t(locale, 'Export preview', 'معاينة التصدير')} sub={draft?.name} icon={FileText} actions={draft ? <ExportButton fileName="knoux-workflow.json" payload={draft} label={t(locale, 'Export JSON', 'تصدير JSON')} onDone={(ok) => controller.showNotice(ok ? t(locale, 'Workflow JSON exported.', 'صُدّر JSON سير العمل.') : t(locale, 'Export could not start.', 'تعذّر بدء التصدير.'))} /> : null}>
          {draft ? (
            <>
              <CodeBlock label="knoux.workflow.v1">{json.slice(0, 4000)}</CodeBlock>
              <div className="sys-toolbar-row">
                <CopyButton locale={locale} text={json} label={t(locale, 'Copy JSON', 'نسخ JSON')} />
                <ExportButton fileName="knoux-workflow.json" payload={draft} label={t(locale, 'Download', 'تنزيل')} onDone={(ok) => controller.showNotice(ok ? t(locale, 'Downloaded.', 'تم التنزيل.') : t(locale, 'Download could not start.', 'تعذّر بدء التنزيل.'))} />
              </div>
              <DataRows rows={[
                { label: t(locale, 'Workflow', 'سير العمل'), value: draft.name },
                { label: t(locale, 'Schema', 'المخطط'), value: draft.schemaVersion },
                { label: t(locale, 'Nodes / edges', 'العقد / الحواف'), value: `${draft.nodes.length} / ${draft.edges.length}` },
                { label: t(locale, 'Execution', 'التنفيذ'), value: draft.execution, tone: 'bad' },
              ]} />
            </>
          ) : <p className="auto-op-hint">{t(locale, 'No workflow is available to export.', 'لا سير عمل متاح للتصدير.')}</p>}
        </Panel>
        <Panel title={t(locale, 'Import validation', 'التحقق من الاستيراد')} icon={ShieldCheck}>
          <textarea className="auto-import-text" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={t(locale, 'Paste a knoux.workflow.v1 JSON object…', 'ألصق كائن JSON بصيغة knoux.workflow.v1…')} aria-label={t(locale, 'Workflow JSON import', 'استيراد JSON سير العمل')} />
          <button type="button" className="sys-btn sys-btn-primary" onClick={() => void controller.validateImport(importText)} disabled={!importText.trim() || controller.busy === 'import'}><ShieldCheck aria-hidden="true" />{t(locale, 'Validate import', 'تحقق من الاستيراد')}</button>
          {validation ? (
            <div className={`auto-validation ${validation.valid ? 'is-valid' : 'is-invalid'}`} data-testid="automation-import-validation">
              <Chip tone={validation.valid ? 'good' : 'bad'}>{validation.valid ? t(locale, 'Valid schema', 'مخطط صحيح') : t(locale, 'Invalid', 'غير صحيح')}</Chip>
              <DataRows rows={[
                { label: t(locale, 'Name', 'الاسم'), value: validation.workflowName || '—' },
                { label: t(locale, 'Schema', 'المخطط'), value: validation.schemaVersion || '—' },
                { label: t(locale, 'Nodes / edges', 'العقد / الحواف'), value: `${validation.nodeCount} / ${validation.edgeCount}` },
              ]} />
              {validation.errors.map((error) => <p key={error} className="auto-validation-error">{error}</p>)}
              {validation.warnings.map((warning) => <p key={warning} className="auto-op-hint">{warning}</p>)}
            </div>
          ) : null}
          <p className="auto-op-hint">{t(locale, 'Validation never saves or runs the imported workflow. Save requires a separate editor action.', 'التحقق لا يحفظ أو يشغل سير العمل المستورد. الحفظ يتطلب إجراء محرر منفصلًا.')}</p>
        </Panel>
      </div>
    </AutomationToolFrame>
  );
}

/* 12 - Backup flow draft */
export function BackupPlanWorkbench({ locale, snapshot, controller }: AutomationWorkbenchProps) {
  const [draft, setDraft] = useState<AutomationWorkflow | null>(() => initialWorkflow(snapshot, 'tpl-backup-verify'));
  const [sourceId, setSourceId] = useState<string>(snapshot.runtime.studioSources[0]?.id || '');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(draft?.nodes[0]?.id || null);
  const source = snapshot.runtime.studioSources.find((entry) => entry.id === sourceId) || null;
  return (
    <AutomationToolFrame
      toolId="auto-backup-plan"
      locale={locale}
      foot={<><span><HardDriveDownload aria-hidden="true" />{snapshot.runtime.studioSources.length} {t(locale, 'authorized source(s)', 'مصدر مصرح به')}</span><span><Lock aria-hidden="true" />{t(locale, 'No file copy channel', 'لا قناة نسخ ملفات')}</span></>}
    >
      {draft ? (
        <>
          <div className="sys-split-2">
            <Panel title={t(locale, 'Authorized source', 'المصدر المصرح به')} icon={HardDriveDownload}>
              {snapshot.runtime.studioSources.length ? (
                <select className="sys-input" value={sourceId} onChange={(event) => setSourceId(event.target.value)} aria-label={t(locale, 'Authorized source', 'المصدر المصرح به')}>
                  {snapshot.runtime.studioSources.map((entry) => <option key={entry.id} value={entry.id}>{entry.label} · {entry.fileCount ?? '—'} files</option>)}
                </select>
              ) : <p className="auto-op-hint">{t(locale, 'No authorized Studio source is connected. Connect one in Organization Studio first.', 'لا مصدر Studio مصرح به. اتصل بواحد في استوديو التنظيم أولًا.')}</p>}
              <DataRows rows={[
                { label: t(locale, 'Selected source', 'المصدر المحدد'), value: source ? source.label : '—' },
                { label: t(locale, 'Source status', 'حالة المصدر'), value: source?.status || '—', tone: source?.status === 'ready' ? 'good' : 'warn' },
                { label: t(locale, 'Indexed files', 'الملفات المفهرسة'), value: source?.fileCount == null ? '—' : String(source.fileCount) },
                { label: t(locale, 'Destination', 'الوجهة'), value: t(locale, 'No destination grant — not selectable', 'لا منح وجهة — غير قابل للاختيار'), tone: 'bad' },
              ]} />
              <p className="auto-op-hint">{t(locale, 'A destination grant and copy executor are not shipped. The flow cannot copy or verify files.', 'منح الوجهة ومنفذ النسخ غير متوفرين. لا يمكن للسير نسخ أو التحقق من الملفات.')}</p>
            </Panel>
            <Panel title={t(locale, 'Backup flow draft', 'مسودة سير النسخ')} icon={ShieldCheck}>
              <TriggerEditor locale={locale} workflow={draft} onChange={setDraft} />
              <DataRows rows={[
                { label: t(locale, 'Verification', 'التحقق'), value: 'SHA-256' },
                { label: t(locale, 'Retention', 'الاحتفاظ'), value: `${draft.policy.retentionDays} ${t(locale, 'days', 'يوم')}` },
                { label: t(locale, 'Execution', 'التنفيذ'), value: t(locale, 'Not implemented', 'غير منفذ'), tone: 'bad' },
              ]} />
              <div className="sys-toolbar-row">
                <button type="button" className="sys-btn sys-btn-ghost" onClick={() => void controller.previewSchedule(scheduleSpecFromWorkflow(draft))}><Clock3 aria-hidden="true" />{t(locale, 'Preview schedule', 'معاينة الجدولة')}</button>
                <button type="button" className="sys-btn sys-btn-primary" onClick={() => void saveDraft(controller, draft, setDraft)} disabled={controller.busy === 'save'}><Save aria-hidden="true" />{t(locale, 'Save draft', 'حفظ المسودة')}</button>
                <button type="button" className="sys-btn sys-btn-primary" onClick={() => void controller.dryRun(draft)} disabled={controller.busy === 'dry-run'}><Play aria-hidden="true" />{t(locale, 'Dry-run', 'معاينة جافة')}</button>
              </div>
            </Panel>
          </div>
          <WorkflowCanvas locale={locale} workflow={draft} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} />
          <DryRunTimeline locale={locale} result={controller.dryRunResult} />
        </>
      ) : <p className="auto-op-hint">{t(locale, 'No backup template is available.', 'لا قالب نسخ متاح.')}</p>}
    </AutomationToolFrame>
  );
}
