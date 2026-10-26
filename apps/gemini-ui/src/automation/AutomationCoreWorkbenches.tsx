/**
 * Flow Studio - core workbenches (01-06).
 * Drafts are local. Dry-runs are deterministic and block execution.
 */
import React, { useMemo, useState } from 'react';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  LayoutTemplate,
  Lock,
  Moon,
  Play,
  Power,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { AutomationDryRunResult, AutomationTemplate, AutomationWorkflow } from '../../shared/native-contracts';
import type { AutomationWorkbenchProps } from './ui';
import {
  AutomationToolFrame,
  DryRunTimeline,
  NodeInspector,
  PolicyEditor,
  QuietHoursEditor,
  SchedulePreviewList,
  TemplateCard,
  TriggerEditor,
  WorkflowCanvas,
  WorkflowSummary,
} from './ui';
import {
  CATEGORY_LABELS,
  appendNode,
  cloneWorkflow,
  initialWorkflow,
  nextNodeId,
  removeNode,
  recurrenceExpression,
  scheduleSpecFromWorkflow,
  setNodeConfig,
  triggerLabel,
  updateNode,
  workflowCategory,
  workflowDraftFromTemplate,
  formatTimestamp,
  t,
} from './model';
import type { AutomationCategory } from './model';
import { Chip, CodeBlock, DataRows, ExportButton, Panel, SearchBox, Seg, downloadJson } from '../system/ui';

function useDraft(snapshot: AutomationWorkbenchProps['snapshot'], templateId?: string) {
  const [draft, setDraft] = useState<AutomationWorkflow | null>(() => initialWorkflow(snapshot, templateId));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(draft?.nodes[0]?.id || null);
  return { draft, setDraft, selectedNodeId, setSelectedNodeId };
}

async function saveDraft(controller: AutomationWorkbenchProps['controller'], draft: AutomationWorkflow | null, setDraft: (value: AutomationWorkflow | null) => void) {
  if (!draft) return;
  const saved = await controller.saveWorkflow(draft);
  if (saved) setDraft(cloneWorkflow(saved));
}

/* 01 - Scheduled Smart Scan */
export function SmartScanWorkbench({ locale, snapshot, controller }: AutomationWorkbenchProps) {
  const { draft, setDraft, selectedNodeId, setSelectedNodeId } = useDraft(snapshot, 'tpl-smart-scan');
  const [preview, setPreview] = useState<AutomationDryRunResult | null>(null);
  const selectedNode = draft?.nodes.find((node) => node.id === selectedNodeId) || null;
  const scopeNode = draft?.nodes.find((node) => node.type === 'action') || null;
  const scopeModules = Array.isArray(scopeNode?.config.modules) ? scopeNode.config.modules as string[] : ['inventory', 'capacity', 'system'];
  const toggleScope = (module: string) => {
    if (!scopeNode || !draft) return;
    const nextModules = scopeModules.includes(module) ? scopeModules.filter((entry) => entry !== module) : [...scopeModules, module];
    setDraft(setNodeConfig(draft, scopeNode.id, 'modules', nextModules));
  };
  return (
    <AutomationToolFrame
      toolId="auto-smart-scan"
      locale={locale}
      foot={<><span><Sparkles aria-hidden="true" />{draft?.nodes.length || 0} {t(locale, 'nodes', 'عقدة')}</span><span><Lock aria-hidden="true" />{t(locale, 'No scheduled execution', 'لا تنفيذ مجدول')}</span></>}
    >
      {draft ? (
        <>
          <div className="sys-toolbar-row">
            <Chip tone="info">{t(locale, 'Read-only scan chain', 'سلسلة فحص للقراءة فقط')}</Chip>
            <Chip tone="muted">{triggerLabel(draft, locale)}</Chip>
            <span className="sys-toolbar-spacer" />
            <button type="button" className="sys-btn sys-btn-ghost" onClick={() => void controller.previewSchedule(scheduleSpecFromWorkflow(draft))}><Clock3 aria-hidden="true" />{t(locale, 'Preview schedule', 'معاينة الجدولة')}</button>
            <button type="button" className="sys-btn sys-btn-primary" onClick={async () => { const result = await controller.dryRun(draft); if (result) setPreview(result); }} disabled={controller.busy === 'dry-run'}><Play aria-hidden="true" />{t(locale, 'Dry-run', 'معاينة جافة')}</button>
            <button type="button" className="sys-btn sys-btn-primary" onClick={() => void saveDraft(controller, draft, setDraft)} disabled={controller.busy === 'save'}><Save aria-hidden="true" />{t(locale, 'Save draft', 'حفظ المسودة')}</button>
          </div>
          <WorkflowCanvas locale={locale} workflow={draft} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} />
          <div className="sys-split-2">
            <Panel title={t(locale, 'Scan scope & schedule', 'نطاق الفحص والجدولة')} icon={CalendarDays}>
              <TriggerEditor locale={locale} workflow={draft} onChange={setDraft} />
              <div className="auto-channel-row" role="group" aria-label={t(locale, 'Scan modules', 'وحدات الفحص')}>
                {[
                  { key: 'inventory', en: 'Inventory', ar: 'الجرد' },
                  { key: 'capacity', en: 'Capacity', ar: 'السعة' },
                  { key: 'system', en: 'System evidence', ar: 'أدلة النظام' },
                ].map((entry) => (
                  <label key={entry.key} className="auto-channel">
                    <input type="checkbox" checked={scopeModules.includes(entry.key)} onChange={() => toggleScope(entry.key)} />
                    <Sparkles aria-hidden="true" />{t(locale, entry.en, entry.ar)}
                  </label>
                ))}
              </div>
              <DataRows rows={[
                { label: t(locale, 'Approval gate', 'بوابة الموافقة'), value: draft.policy.requireApproval ? t(locale, 'Required per future run', 'مطلوبة لكل تشغيل مستقبلي') : t(locale, 'Draft approval disabled', 'موافقة المسودة معطلة'), tone: draft.policy.requireApproval ? 'violet' : 'warn' },
                { label: t(locale, 'Permission scope', 'نطاق الإذن'), value: t(locale, 'Read-only inventory metadata', 'بيانات جرد للقراءة فقط') },
                { label: t(locale, 'Execution', 'التنفيذ'), value: t(locale, 'Dry-run only', 'معاينة جافة فقط'), tone: 'bad' },
              ]} />
            </Panel>
            <Panel title={t(locale, 'Node inspector', 'فاحص العقد')} icon={FileText}>
              <NodeInspector locale={locale} workflow={draft} node={selectedNode} onChange={setDraft} onRemove={(id) => setDraft(removeNode(draft, id))} />
            </Panel>
          </div>
          <div className="sys-split-2">
            <Panel title={t(locale, 'Quiet hours', 'ساعات الهدوء')} icon={Moon}>
              <QuietHoursEditor locale={locale} workflow={draft} onChange={setDraft} />
            </Panel>
            <Panel title={t(locale, 'Draft policy', 'مسودة السياسة')} icon={Lock}>
              <PolicyEditor locale={locale} workflow={draft} onChange={setDraft} />
            </Panel>
          </div>
          <Panel title={t(locale, 'Deterministic dry-run', 'معاينة جافة حتمية')} icon={Sparkles}>
            <DryRunTimeline locale={locale} result={preview} />
          </Panel>
          {controller.schedulePreview ? <Panel title={t(locale, 'Next occurrences', 'المواعيد التالية')} icon={Clock3}><SchedulePreviewList locale={locale} preview={controller.schedulePreview} /></Panel> : null}
        </>
      ) : <p className="auto-op-hint">{t(locale, 'No template is available.', 'لا قالب متاح.')}</p>}
    </AutomationToolFrame>
  );
}

/* 02 - Weekly schedule manager */
export function ScheduleManagerWorkbench({ locale, snapshot, controller }: AutomationWorkbenchProps) {
  const [view, setView] = useState<'week' | 'list'>('week');
  const [category, setCategory] = useState<'all' | AutomationCategory>('all');
  const [selectedId, setSelectedId] = useState<string | null>(snapshot.workflows[0]?.id || null);
  const [draft, setDraft] = useState<AutomationWorkflow | null>(snapshot.workflows[0] ? cloneWorkflow(snapshot.workflows[0]) : initialWorkflow(snapshot));
  const selected = draft && draft.id === selectedId ? draft : snapshot.workflows.find((entry) => entry.id === selectedId) || draft;
  const days = selected?.trigger.days || [];
  const preview = controller.schedulePreview;
  const filtered = useMemo(() => snapshot.workflows.filter((workflow) => category === 'all' || workflowCategory(workflow) === category), [snapshot.workflows, category]);
  const categoryLabel = (workflow: AutomationWorkflow) => CATEGORY_LABELS[workflowCategory(workflow)][locale === 'ar' ? 'ar' : 'en'];
  const setEnabled = (value: boolean) => {
    if (!selected) return;
    const next = { ...cloneWorkflow(selected), enabled: value };
    setDraft(next);
    setSelectedId(next.id);
  };
  return (
    <AutomationToolFrame
      toolId="auto-schedule-manager"
      locale={locale}
      foot={<><span><CalendarDays aria-hidden="true" />{snapshot.workflows.length} {t(locale, 'local schedule drafts', 'مسودة جدولة محلية')}</span><span><Lock aria-hidden="true" />{t(locale, 'No background timer', 'لا مؤقت خلفي')}</span></>}
    >
      <div className="sys-toolbar-row">
        <Seg<'week' | 'list'>
          value={view}
          onChange={setView}
          ariaLabel={t(locale, 'Schedule view', 'عرض الجدولة')}
          compact
          options={[{ value: 'week', label: t(locale, 'Week', 'أسبوع') }, { value: 'list', label: t(locale, 'List', 'قائمة') }]}
        />
        <select className="sys-input auto-category-filter" aria-label={t(locale, 'Filter task category', 'تصفية فئة المهمة')} value={category} onChange={(event) => setCategory(event.target.value as 'all' | AutomationCategory)}>
          <option value="all">{t(locale, 'All categories', 'كل الفئات')}</option>
          {(Object.keys(CATEGORY_LABELS) as AutomationCategory[]).map((key) => <option key={key} value={key}>{CATEGORY_LABELS[key][locale === 'ar' ? 'ar' : 'en']}</option>)}
        </select>
        <span className="sys-toolbar-spacer" />
        <Chip tone="warn">{t(locale, 'Metadata only', 'بيانات فقط')}</Chip>
        <button type="button" className="sys-btn sys-btn-ghost" onClick={() => selected && void controller.previewSchedule(scheduleSpecFromWorkflow(selected))} disabled={!selected}><Clock3 aria-hidden="true" />{t(locale, 'Preview next', 'معاينة التالي')}</button>
        <button type="button" className="sys-btn sys-btn-quiet" aria-pressed={Boolean(selected?.enabled)} onClick={() => setEnabled(!selected?.enabled)} disabled={!selected}><Power aria-hidden="true" />{selected?.enabled ? t(locale, 'Disable metadata', 'تعطيل البيانات') : t(locale, 'Enable metadata', 'تفعيل البيانات')}</button>
        <button type="button" className="sys-btn sys-btn-primary" onClick={() => selected && void saveDraft(controller, selected, setDraft)} disabled={!selected || controller.busy === 'save'}><Save aria-hidden="true" />{t(locale, 'Save draft', 'حفظ المسودة')}</button>
      </div>
      <div className="auto-schedule-layout">
        <Panel title={t(locale, 'Saved workflow schedules', 'جدولة سير العمل المحفوظة')} sub={`${filtered.length} / ${snapshot.workflows.length} ${t(locale, 'workflows', 'سير عمل')}`} icon={CalendarDays} bodyClassName="sys-panel-body-flush">
          {filtered.length ? (
            <div className="auto-schedule-list" role="listbox" aria-label={t(locale, 'Workflow schedules', 'جدولة سير العمل')}>
              {filtered.map((workflow) => (
                <button key={workflow.id} type="button" role="option" aria-selected={selectedId === workflow.id} className={`auto-schedule-row ${selectedId === workflow.id ? 'is-active' : ''}`} onClick={() => { setSelectedId(workflow.id); setDraft(cloneWorkflow(workflow)); }}>
                  <span><strong>{workflow.name}</strong><em>{triggerLabel(workflow, locale)}</em></span>
                  <Chip tone="muted">{categoryLabel(workflow)}</Chip>
                  <Chip tone={workflow.enabled ? 'warn' : 'muted'}>{workflow.enabled ? t(locale, 'enabled metadata', 'بيانات مفعلة') : t(locale, 'disabled metadata', 'بيانات معطلة')}</Chip>
                  <Chip tone="muted">v{workflow.version}</Chip>
                </button>
              ))}
            </div>
          ) : <div className="auto-empty"><CalendarDays aria-hidden="true" /><strong>{t(locale, 'No saved schedule', 'لا جدولة محفوظة')}</strong><p>{snapshot.workflows.length ? t(locale, 'No workflow matches this category.', 'لا سير عمل يطابق هذه الفئة.') : t(locale, 'Save a workflow draft first.', 'احفظ مسودة سير عمل أولًا.')}</p></div>}
        </Panel>
        <div className="sys-stack">
          <Panel title={t(locale, 'Weekly calendar', 'التقويم الأسبوعي')} icon={CalendarDays}>
            <div className="auto-week" aria-label={t(locale, 'Weekly schedule metadata', 'بيانات الجدولة الأسبوعية')}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, index) => (
                <div key={label} className={`auto-week-day ${days.includes(index) ? 'is-active' : ''}`}>
                  <strong>{label}</strong>
                  <span>{days.includes(index) ? selected?.trigger.time || '—' : '—'}</span>
                  <em>{days.includes(index) ? t(locale, 'scheduled metadata', 'بيانات مجدولة') : t(locale, 'idle', 'خامل')}</em>
                </div>
              ))}
            </div>
            <p className="auto-op-hint">{t(locale, 'The calendar is generated from persisted metadata. No job will run at these times.', 'التقويم مُشتق من بيانات محفوظة. لن تعمل أي مهمة في هذه الأوقات.')}</p>
          </Panel>
          <Panel title={t(locale, 'Selected schedule', 'الجدولة المحددة')} icon={Clock3}>
            {selected ? (
              <>
                <WorkflowSummary locale={locale} workflow={selected} />
                <TriggerEditor locale={locale} workflow={selected} onChange={(next) => { setDraft(next); }} />
                <DataRows rows={[
                  { label: t(locale, 'Associated template', 'القالب المرتبط'), value: t(locale, 'Not recorded for local drafts', 'غير مسجل للمسودات المحلية') },
                  { label: t(locale, 'Draft status', 'حالة المسودة'), value: selected.enabled ? t(locale, 'Enabled metadata · not executed', 'بيانات مفعلة · غير منفذ') : t(locale, 'Disabled metadata', 'بيانات معطلة'), tone: selected.enabled ? 'warn' : 'muted' },
                  { label: t(locale, 'Approval required', 'الموافقة مطلوبة'), value: selected.policy.requireApproval ? t(locale, 'Yes · per future run', 'نعم · لكل تشغيل مستقبلي') : t(locale, 'No (draft only)', 'لا (مسودة فقط)'), tone: selected.policy.requireApproval ? 'violet' : 'warn' },
                  { label: t(locale, 'Retention', 'الاحتفاظ'), value: `${selected.policy.retentionDays} ${t(locale, 'days', 'يوم')}` },
                ]} />
              </>
            ) : <p className="auto-op-hint">{t(locale, 'Select a saved schedule.', 'اختر جدولة محفوظة.')}</p>}
          </Panel>
          <Panel title={t(locale, 'Next occurrences', 'المواعيد التالية')} icon={Clock3}>
            <SchedulePreviewList locale={locale} preview={preview} empty={t(locale, 'Press Preview next to compute occurrences in the host timezone.', 'اضغط معاينة التالي لحساب المواعيد في توقيت المضيف.')} />
          </Panel>
        </div>
      </div>
    </AutomationToolFrame>
  );
}

/* 03 - Dry-run history */
export function RunHistoryWorkbench({ locale, snapshot, controller }: AutomationWorkbenchProps) {
  const entries = controller.journal.length ? controller.journal : snapshot.journal;
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(entries[0]?.id || null);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const windows: Record<typeof range, number> = { all: Number.POSITIVE_INFINITY, '24h': 86400000, '7d': 604800000, '30d': 2592000000 };
    const cutoff = Date.now() - windows[range];
    return entries.filter((entry) => {
      const at = new Date(entry.at).getTime();
      if (Number.isFinite(at) && at < cutoff) return false;
      return !needle || `${entry.workflowName} ${entry.receipt} ${entry.workflowId}`.toLowerCase().includes(needle);
    });
  }, [entries, query, range]);
  const selected = entries.find((entry) => entry.id === selectedId) || filtered[0] || null;
  return (
    <AutomationToolFrame
      toolId="auto-run-history"
      locale={locale}
      provider="Local dry-run journal"
      foot={<><span><History aria-hidden="true" />{entries.length} {t(locale, 'dry-runs', 'معاينة جافة')}</span><span><Lock aria-hidden="true" />{t(locale, 'Executed workflows', 'سير العمل المنفذ')}: 0</span></>}
    >
      <div className="sys-toolbar-row">
        <Seg<'all' | '24h' | '7d' | '30d'>
          value={range}
          onChange={setRange}
          ariaLabel={t(locale, 'Filter by time', 'تصفية حسب الوقت')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All', 'الكل') },
            { value: '24h', label: t(locale, '24h', '24 ساعة') },
            { value: '7d', label: t(locale, '7d', '7 أيام') },
            { value: '30d', label: t(locale, '30d', '30 يومًا') },
          ]}
        />
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search dry-runs or receipts…', 'ابحث في المعاينات أو الإيصالات…')} ariaLabel={t(locale, 'Search dry-runs', 'بحث المعاينات')} />
        <span className="sys-toolbar-spacer" />
        <ExportButton fileName="knoux-flow-dry-runs.json" payload={{ readOnly: true, mutation: 'none', entries }} label={t(locale, 'Export history', 'تصدير السجل')} onDone={(ok) => controller.showNotice(ok ? t(locale, 'Dry-run history exported.', 'صُدّر سجل المعاينات.') : t(locale, 'Export could not start.', 'تعذّر بدء التصدير.'))} />
      </div>
      <div className="sys-split-ledger">
        <Panel className="sys-ledger-panel" title={t(locale, 'Dry-run ledger', 'سجل المعاينات الجافة')} sub={`${filtered.length} ${t(locale, 'entries', 'مدخل')}`} icon={History} bodyClassName="sys-panel-body-flush">
          {filtered.length ? (
            <div className="auto-journal-list" role="listbox" aria-label={t(locale, 'Dry-run entries', 'مدخلات المعاينات')}>
              {filtered.map((entry) => (
                <button key={entry.id} type="button" role="option" aria-selected={selected?.id === entry.id} className={`auto-journal-row ${selected?.id === entry.id ? 'is-active' : ''}`} onClick={() => setSelectedId(entry.id)}>
                  <span className="auto-journal-time">{formatTimestamp(entry.at, locale)}</span>
                  <span className="auto-journal-copy"><strong>{entry.workflowName}</strong><em>{entry.receipt}</em></span>
                  <Chip tone="info">v{entry.workflowVersion}</Chip>
                </button>
              ))}
            </div>
          ) : <div className="auto-empty"><History aria-hidden="true" /><strong>{t(locale, 'No dry-run recorded', 'لا معاينة جافة مسجلة')}</strong><p>{t(locale, 'Dry-run a workflow to create a deterministic record, or widen the time filter.', 'شغّل معاينة جافة لسير عمل لإنشاء سجل حتمي، أو وسّع مرشح الوقت.')}</p></div>}
        </Panel>
        <div className="sys-stack">
          <Panel title={t(locale, 'Dry-run evidence', 'أدلة المعاينة الجافة')} sub={selected?.receipt} icon={FileText}>
            {selected ? <DataRows rows={[
              { label: t(locale, 'Run ID', 'معرف التشغيل'), value: selected.id, mono: true },
              { label: t(locale, 'Timestamp', 'الطابع الزمني'), value: formatTimestamp(selected.at, locale) },
              { label: t(locale, 'Workflow', 'سير العمل'), value: selected.workflowName },
              { label: t(locale, 'Version', 'النسخة'), value: `v${selected.workflowVersion}` },
              { label: t(locale, 'Nodes / steps', 'العقد / الخطوات'), value: `${selected.nodeCount} / ${selected.stepCount}`, mono: true },
              { label: t(locale, 'Duration', 'المدة'), value: t(locale, 'Not measured · no execution', 'غير مقيسة · بلا تنفيذ') },
              { label: t(locale, 'Status', 'الحالة'), value: t(locale, 'Dry-run only · not executed', 'معاينة جافة فقط · غير منفذ'), tone: 'info' },
              { label: t(locale, 'Produced artifact', 'المخرج المنتج'), value: t(locale, 'None · preview receipt only', 'لا شيء · إيصال معاينة فقط'), tone: 'warn' },
              { label: t(locale, 'Failure log', 'سجل الفشل'), value: t(locale, 'None · execution was never attempted', 'لا شيء · لم تُحاول أي عملية تنفيذ') },
              { label: t(locale, 'Mutation', 'التغيير'), value: selected.mutation, tone: 'good' },
              { label: t(locale, 'Receipt', 'الإيصال'), value: selected.receipt, mono: true },
            ]} /> : <p className="auto-op-hint">{t(locale, 'Select a dry-run.', 'اختر معاينة جافة.')}</p>}
          </Panel>
          <Panel title={t(locale, 'History integrity', 'سلامة السجل')} icon={Lock}>
            <DataRows rows={[
              { label: t(locale, 'Execution engine', 'محرك التنفيذ'), value: t(locale, 'Not implemented', 'غير منفذ'), tone: 'bad' },
              { label: t(locale, 'Background scheduler', 'جدولة خلفية'), value: t(locale, 'None', 'لا يوجد'), tone: 'bad' },
              { label: t(locale, 'Machine changes', 'تغييرات الجهاز'), value: t(locale, 'None', 'لا شيء'), tone: 'good' },
            ]} />
          </Panel>
        </div>
      </div>
    </AutomationToolFrame>
  );
}

/* 04 - Template gallery */
export function TemplatesWorkbench({ locale, snapshot, controller }: AutomationWorkbenchProps) {
  const [selectedId, setSelectedId] = useState<string | null>(snapshot.templates[0]?.id || null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const categories = useMemo(() => [...new Set(snapshot.templates.map((template) => template.category))], [snapshot.templates]);
  const visibleTemplates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return snapshot.templates.filter((template) => {
      if (category !== 'all' && template.category !== category) return false;
      if (!needle) return true;
      return `${template.labelEn} ${template.labelAr} ${template.blurbEn} ${template.blurbAr} ${template.category}`.toLowerCase().includes(needle);
    });
  }, [snapshot.templates, query, category]);
  const selected = snapshot.templates.find((entry) => entry.id === selectedId) || visibleTemplates[0] || snapshot.templates[0] || null;
  const [draft, setDraft] = useState<AutomationWorkflow | null>(selected ? workflowDraftFromTemplate(selected) : null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(draft?.nodes[0]?.id || null);
  const choose = (template: AutomationTemplate) => {
    setSelectedId(template.id);
    const next = workflowDraftFromTemplate(template);
    setDraft(next);
    setSelectedNodeId(next.nodes[0]?.id || null);
  };
  return (
    <AutomationToolFrame
      toolId="auto-templates"
      locale={locale}
      foot={<><span><LayoutTemplate aria-hidden="true" />{snapshot.templates.length} {t(locale, 'built-in templates', 'قالب مدمج')}</span><span><Lock aria-hidden="true" />{t(locale, 'Instantiation saves a local draft only', 'الإنشاء يحفظ مسودة محلية فقط')}</span></>}
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search templates…', 'ابحث في القوالب…')} ariaLabel={t(locale, 'Search templates', 'بحث القوالب')} />
        <select className="sys-input auto-category-filter" aria-label={t(locale, 'Filter template category', 'تصفية فئة القالب')} value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">{t(locale, 'All categories', 'كل الفئات')}</option>
          {categories.map((key) => <option key={key} value={key}>{key}</option>)}
        </select>
        <span className="sys-toolbar-spacer" />
        <Chip tone="muted">{visibleTemplates.length} / {snapshot.templates.length}</Chip>
      </div>
      {visibleTemplates.length ? (
        <div className="auto-template-grid">
          {visibleTemplates.map((template) => <TemplateCard key={template.id} locale={locale} template={template} onInstantiate={choose} />)}
        </div>
      ) : <div className="auto-empty"><LayoutTemplate aria-hidden="true" /><strong>{t(locale, 'No template matches', 'لا قالب يطابق البحث')}</strong><p>{t(locale, 'Clear the search or choose another category.', 'امسح البحث أو اختر فئة أخرى.')}</p></div>}
      {selected && draft ? (
        <div className="sys-split-2">
          <Panel title={locale === 'ar' ? selected.labelAr : selected.labelEn} sub={selected.category} icon={LayoutTemplate}>
            <p className="auto-op-hint">{locale === 'ar' ? selected.blurbAr : selected.blurbEn}</p>
            <h4>{t(locale, 'Prerequisites', 'المتطلبات')}</h4>
            <ul className="auto-prereq">{selected.prerequisitesEn.map((item, index) => <li key={item}>{locale === 'ar' ? selected.prerequisitesAr[index] || item : item}</li>)}</ul>
            <DataRows rows={[
              { label: t(locale, 'Node flow', 'تدفق العقد'), value: `${selected.workflow.nodes.length} ${t(locale, 'nodes', 'عقدة')} / ${selected.workflow.edges.length} ${t(locale, 'edges', 'حافة')}`, mono: true },
              { label: t(locale, 'Estimated time saved', 'الوقت المقدر الموفر'), value: t(locale, 'Not measured · no estimate invented', 'غير مقيس · لا تقدير مختلق'), tone: 'warn' },
              { label: t(locale, 'Execution', 'التنفيذ'), value: t(locale, 'Draft only', 'مسودة فقط'), tone: 'bad' },
            ]} />
            <button type="button" className="sys-btn sys-btn-primary" onClick={() => void saveDraft(controller, draft, setDraft)} disabled={controller.busy === 'save'}><Save aria-hidden="true" />{t(locale, 'Instantiate & save draft', 'إنشاء وحفظ المسودة')}</button>
            {draft.version ? <Chip tone="good">{t(locale, 'Saved', 'محفوظ')} v{draft.version}</Chip> : null}
          </Panel>
          <Panel title={t(locale, 'Template flow preview', 'معاينة تدفق القالب')} icon={FileText}>
            <WorkflowCanvas locale={locale} workflow={draft} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} />
            <NodeInspector locale={locale} workflow={draft} node={draft.nodes.find((node) => node.id === selectedNodeId) || null} onChange={setDraft} onRemove={(id) => setDraft(removeNode(draft, id))} />
          </Panel>
        </div>
      ) : null}
    </AutomationToolFrame>
  );
}

/* 05 - Recurrence composer */
export function SchedulePlanWorkbench({ locale, snapshot, controller }: AutomationWorkbenchProps) {
  const [draft, setDraft] = useState<AutomationWorkflow | null>(() => initialWorkflow(snapshot, 'tpl-storage-watch'));
  const [preview, setPreview] = useState(controller.schedulePreview);
  const expression = draft ? recurrenceExpression(draft.trigger) : '—';
  const compute = async () => {
    if (!draft) return;
    const result = await controller.previewSchedule(scheduleSpecFromWorkflow(draft));
    if (result) setPreview(result);
  };
  return (
    <AutomationToolFrame
      toolId="auto-schedule-plan"
      locale={locale}
      foot={<><span><Clock3 aria-hidden="true" />{t(locale, 'Host timezone', 'توقيت المضيف')}: {snapshot.runtime.timezone}</span><span><Lock aria-hidden="true" />{t(locale, 'No job is scheduled', 'لا تُجدول أي مهمة')}</span></>}
    >
      {draft ? (
        <>
          <div className="sys-split-2">
            <Panel title={t(locale, 'Recurrence builder', 'منشئ التكرار')} icon={Clock3}>
              <TriggerEditor locale={locale} workflow={draft} onChange={setDraft} />
              <div className="sys-toolbar-row">
                <button type="button" className="sys-btn sys-btn-primary" onClick={() => void compute()}><Play aria-hidden="true" />{t(locale, 'Validate & preview occurrences', 'تحقق ومعاينة المواعيد')}</button>
                <button type="button" className="sys-btn sys-btn-ghost" onClick={() => void saveDraft(controller, draft, setDraft)} disabled={controller.busy === 'save'}><Save aria-hidden="true" />{t(locale, 'Save schedule draft', 'حفظ مسودة الجدولة')}</button>
                {preview ? <Chip tone={preview.valid ? 'good' : 'warn'}>{preview.valid ? t(locale, 'Valid', 'صالح') : t(locale, 'No occurrence', 'لا موعد')}</Chip> : null}
              </div>
              <CodeBlock label={t(locale, 'Derived recurrence expression', 'تعبير التكرار المشتق')}>{expression}</CodeBlock>
              <DataRows rows={[
                { label: t(locale, 'Timezone', 'المنطقة الزمنية'), value: `${snapshot.runtime.timezone} (${t(locale, 'host only', 'المضيف فقط')})` },
                { label: t(locale, 'Exclusion rules', 'قواعد الاستبعاد'), value: draft.trigger.exclusions.length ? draft.trigger.exclusions.join(', ') : t(locale, 'None', 'لا يوجد'), mono: draft.trigger.exclusions.length > 0 },
                { label: t(locale, 'Policy approval', 'موافقة السياسة'), value: draft.policy.requireApproval ? t(locale, 'Required', 'مطلوبة') : t(locale, 'Draft disabled', 'معطلة بالمسودة'), tone: draft.policy.requireApproval ? 'violet' : 'warn' },
              ]} />
              <p className="auto-op-hint">{t(locale, 'The expression is descriptive: the native provider validates typed recurrence in the host timezone with local DST rules and refuses foreign timezones. Arbitrary cron text is never parsed or executed.', 'التعبير وصفي: يتحقق المزود الأصلي من التكرار المهيكل في توقيت المضيف بقواعد التوقيت الصيفي المحلي ويرفض المناطق الأخرى. لا يُحلل نص cron عشوائي أو يُنفذ أبدًا.')}</p>
            </Panel>
            <Panel title={t(locale, 'Next five occurrences', 'المواعيد الخمسة التالية')} icon={CalendarDays}>
              <SchedulePreviewList locale={locale} preview={preview} />
              {draft.trigger.exclusions.length ? <p className="auto-op-hint">{t(locale, 'Excluded dates are applied by the native preview. None of the occurrences above falls on an excluded date.', 'تُطبق التواريخ المستبعدة في المعاينة الأصلية. لا يقع أي موعد أعلاه في تاريخ مستبعد.')}</p> : null}
            </Panel>
          </div>
          <Panel title={t(locale, 'Draft policy review', 'مراجعة سياسة المسودة')} icon={Lock}>
            <PolicyEditor locale={locale} workflow={draft} onChange={setDraft} />
          </Panel>
        </>
      ) : <p className="auto-op-hint">{t(locale, 'No schedule draft is available.', 'لا مسودة جدولة متاحة.')}</p>}
    </AutomationToolFrame>
  );
}

/* 06 - Cleanup pipeline */
export function CleanupPlanWorkbench({ locale, snapshot, controller }: AutomationWorkbenchProps) {
  const [draft, setDraft] = useState<AutomationWorkflow | null>(() => initialWorkflow(snapshot, 'tpl-cleanup-pipeline'));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(draft?.nodes[0]?.id || null);
  const [preview, setPreview] = useState<AutomationDryRunResult | null>(null);
  return (
    <AutomationToolFrame
      toolId="auto-cleanup-plan"
      locale={locale}
      foot={<><span><ShieldAlert aria-hidden="true" />{t(locale, 'Delete execution belongs to Mission 08', 'تنفيذ الحذف يخص المهمة 08')}</span><span><Lock aria-hidden="true" />{t(locale, 'Pipeline preview only', 'معاينة المسار فقط')}</span></>}
    >
      {draft ? (
        <>
          <div className="sys-toolbar-row">
            <Chip tone="bad">{t(locale, 'No delete channel', 'لا قناة حذف')}</Chip>
            <Chip tone="violet">{t(locale, 'Per-run approval required', 'موافقة لكل تشغيل مطلوبة')}</Chip>
            <span className="sys-toolbar-spacer" />
            <button type="button" className="sys-btn sys-btn-primary" onClick={async () => { const result = await controller.dryRun(draft); if (result) setPreview(result); }} disabled={controller.busy === 'dry-run'}><Play aria-hidden="true" />{t(locale, 'Dry-run pipeline', 'معاينة المسار جافة')}</button>
            <button type="button" className="sys-btn sys-btn-primary" onClick={() => void saveDraft(controller, draft, setDraft)} disabled={controller.busy === 'save'}><Save aria-hidden="true" />{t(locale, 'Save draft', 'حفظ المسودة')}</button>
          </div>
          <WorkflowCanvas locale={locale} workflow={draft} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} />
          <div className="sys-split-2">
            <Panel title={t(locale, 'Safety classification', 'تصنيف السلامة')} icon={ShieldAlert}>
              <DataRows rows={[
                { label: t(locale, 'Protected paths', 'مسارات محمية'), value: t(locale, 'Excluded by Mission 08 policy', 'مستبعدة بسياسة المهمة 08') },
                { label: t(locale, 'Personal folders', 'مجلدات شخصية'), value: t(locale, 'Excluded', 'مستبعدة'), tone: 'good' },
                { label: t(locale, 'Quarantine', 'الحجر'), value: t(locale, 'Preview only', 'معاينة فقط'), tone: 'bad' },
                { label: t(locale, 'Approval gate', 'بوابة الموافقة'), value: t(locale, 'Required', 'مطلوبة'), tone: 'violet' },
              ]} />
              <p className="auto-op-hint">{t(locale, 'The pipeline cannot delete or quarantine anything. It records a dry-run plan only.', 'لا يمكن للمسار حذف أو حجر أي شيء. يسجل خطة معاينة جافة فقط.')}</p>
            </Panel>
            <Panel title={t(locale, 'Pipeline dry-run', 'معاينة المسار')} icon={Play}>
              <DryRunTimeline locale={locale} result={preview} />
            </Panel>
          </div>
        </>
      ) : <p className="auto-op-hint">{t(locale, 'No cleanup template is available.', 'لا قالب تنظيف متاح.')}</p>}
    </AutomationToolFrame>
  );
}
