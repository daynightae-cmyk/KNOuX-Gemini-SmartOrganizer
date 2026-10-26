/**
 * KNOuX Flow Studio - measured workflow primitives (Mission 13).
 * Canvas, node inspector, schedule builder, quiet-hours dial and dry-run view.
 * No node is executed; the canvas is a local draft editor.
 */
import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  FileText,
  GitBranch,
  Lock,
  Moon,
  Play,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  AutomationDryRunResult,
  AutomationNode,
  AutomationNodeType,
  AutomationScheduleOccurrence,
  AutomationSchedulePreview,
  AutomationScheduleSpec,
  AutomationTemplate,
  AutomationWorkflow,
} from '../../shared/native-contracts';
import type { AutomationLocale } from './catalog';
import { AUTOMATION_TOOLS, RISK_META, STATE_META, TOOL_BY_ID, toolLabel } from './catalog';
import type { AutomationController } from './useAutomation';
import {
  DAY_LABELS,
  NODE_TYPE_META,
  triggerLabel,
  t,
  type AutomationLocale as Locale,
} from './model';
import { Chip, CodeBlock, CopyButton, DataRows, Panel, SearchBox, Seg, cx } from '../system/ui';

export interface AutomationWorkbenchProps {
  locale: Locale;
  snapshot: NonNullable<AutomationController['snapshot']>;
  controller: AutomationController;
  toolId: (typeof AUTOMATION_TOOLS)[number]['id'];
}

export function AutomationToolFrame({
  toolId,
  locale,
  children,
  foot,
  provider,
}: {
  toolId: (typeof AUTOMATION_TOOLS)[number]['id'];
  locale: Locale;
  children: ReactNode;
  foot?: ReactNode;
  provider?: string;
}) {
  const entry = TOOL_BY_ID[toolId];
  const Icon = entry.icon;
  const state = STATE_META[entry.state];
  const risk = RISK_META[entry.risk];
  return (
    <section className="sys-workbench auto-workbench" data-testid={`automation-service-workspace-${toolId}`}>
      <header className="sys-wb-head">
        <div className="sys-wb-identity">
          <span className="sys-wb-icon" style={{ color: entry.accent, borderColor: `${entry.accent}55` }} aria-hidden="true"><Icon /></span>
          <div className="sys-wb-copy">
            <span className="sys-wb-eyebrow">{t(locale, 'Automation tool', 'أداة أتمتة')} {String(entry.index).padStart(2, '0')} · {entry.id}</span>
            <h2>{toolLabel(toolId, locale)}</h2>
            <p>{locale === 'ar' ? entry.blurbAr : entry.blurbEn}</p>
          </div>
        </div>
        <div className="sys-wb-badges">
          <Chip tone={state.tone}>{t(locale, state.en, state.ar)}</Chip>
          <Chip tone={risk.tone} icon={Lock}>{t(locale, risk.en, risk.ar)}</Chip>
          <Chip tone="muted" title={provider || entry.provider}>{provider || entry.provider}</Chip>
        </div>
      </header>
      <div className="sys-service-body sys-wb-body auto-wb-body">{children}</div>
      {foot ? <footer className="sys-wb-foot">{foot}</footer> : null}
    </section>
  );
}

const NODE_ICONS: Record<AutomationNodeType, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  trigger: Play,
  condition: GitBranch,
  action: Zap,
  approval: ShieldCheck,
  report: FileText,
};

export function WorkflowCanvas({
  locale,
  workflow,
  selectedNodeId,
  onSelect,
}: {
  locale: Locale;
  workflow: AutomationWorkflow;
  selectedNodeId: string | null;
  onSelect: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [minimap, setMinimap] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layout = useMemo(() => {
    const depth = new Map<string, number>();
    for (const node of workflow.nodes) depth.set(node.id, node.type === 'trigger' ? 0 : 1);
    for (let pass = 0; pass < workflow.nodes.length; pass += 1) {
      let changed = false;
      for (const edge of workflow.edges) {
        const next = (depth.get(edge.from) || 0) + 1;
        if (next > (depth.get(edge.to) || 0)) {
          depth.set(edge.to, next);
          changed = true;
        }
      }
      if (!changed) break;
    }
    const groups = new Map<number, string[]>();
    for (const node of workflow.nodes) {
      const level = depth.get(node.id) || 0;
      const list = groups.get(level) || [];
      list.push(node.id);
      groups.set(level, list);
    }
    const positions = new Map<string, { x: number; y: number }>();
    for (const [level, ids] of groups) {
      ids.forEach((id, index) => {
        positions.set(id, { x: 30 + level * 205, y: 24 + index * 94 });
      });
    }
    const maxLevel = Math.max(0, ...groups.keys());
    const maxRows = Math.max(1, ...[...groups.values()].map((entries) => entries.length));
    return { positions, width: 60 + maxLevel * 205 + 175, height: 48 + maxRows * 94 + 50 };
  }, [workflow.edges, workflow.nodes]);

  const fit = () => {
    const element = containerRef.current;
    if (!element) return;
    const scaleX = (element.clientWidth - 32) / layout.width;
    const scaleY = (element.clientHeight - 32) / layout.height;
    setZoom(Math.max(0.55, Math.min(1, scaleX, scaleY)));
    element.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const scaleX = (element.clientWidth - 24) / layout.width;
    const scaleY = (element.clientHeight - 24) / layout.height;
    setZoom(Math.max(0.55, Math.min(1, scaleX, scaleY)));
    element.scrollTo({ left: 0, top: 0 });
  }, [layout.height, layout.width, workflow.id, workflow.nodes.length]);

  return (
    <div className="auto-canvas-wrap">
      <div className="auto-canvas-toolbar">
        <span><GitBranch aria-hidden="true" />{t(locale, 'Workflow canvas', 'لوحة سير العمل')}</span>
        <span className="auto-canvas-count">{workflow.nodes.length} {t(locale, 'nodes', 'عقدة')} · {workflow.edges.length} {t(locale, 'edges', 'حافة')}</span>
        <div className="auto-canvas-controls">
          <button type="button" className="sys-icon-btn" aria-label={t(locale, 'Zoom out', 'تصغير')} onClick={() => setZoom((value) => Math.max(0.35, Number((value - 0.1).toFixed(2))))}>−</button>
          <span className="auto-zoom-label">{Math.round(zoom * 100)}%</span>
          <button type="button" className="sys-icon-btn" aria-label={t(locale, 'Zoom in', 'تكبير')} onClick={() => setZoom((value) => Math.min(1.6, Number((value + 0.1).toFixed(2))))}>+</button>
          <button type="button" className="sys-btn sys-btn-quiet" onClick={fit}><Sparkles aria-hidden="true" />{t(locale, 'Fit', 'ملاءمة')}</button>
          <button type="button" className={cx('sys-btn sys-btn-quiet', minimap && 'is-active')} aria-pressed={minimap} onClick={() => setMinimap((value) => !value)}>{t(locale, 'Minimap', 'خريطة مصغرة')}</button>
        </div>
      </div>
      <div ref={containerRef} className="auto-canvas knx-custom-scrollbar" data-testid="automation-canvas">
        <div className="auto-canvas-inner" style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="auto-canvas-edges" aria-hidden="true">
            {workflow.edges.map((edge) => {
              const from = layout.positions.get(edge.from);
              const to = layout.positions.get(edge.to);
              if (!from || !to) return null;
              const x1 = from.x + 152;
              const y1 = from.y + 34;
              const x2 = to.x;
              const y2 = to.y + 34;
              const mid = (x1 + x2) / 2;
              return <path key={`${edge.from}-${edge.to}`} d={`M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`} className="auto-edge" />;
            })}
          </svg>
          {workflow.nodes.map((node) => {
            const position = layout.positions.get(node.id);
            if (!position) return null;
            const Icon = NODE_ICONS[node.type];
            const meta = NODE_TYPE_META[node.type];
            return (
              <button
                key={node.id}
                type="button"
                className={cx('auto-node', selectedNodeId === node.id && 'is-active', `is-${node.type}`)}
                style={{ left: position.x, top: position.y }}
                onClick={() => onSelect(node.id)}
                data-testid={`automation-node-${node.id}`}
              >
                <span className="auto-node-port is-in" aria-hidden="true" />
                <span className="auto-node-head">
                  <span className="auto-node-icon" aria-hidden="true"><Icon /></span>
                  <Chip tone={meta.tone}>{locale === 'ar' ? meta.ar : meta.en}</Chip>
                </span>
                <strong>{node.label}</strong>
                <em>{node.toolId === 'platform' ? t(locale, 'Platform node', 'عقدة منصة') : toolLabel(node.toolId, locale)}</em>
                <span className="auto-node-port is-out" aria-hidden="true" />
              </button>
            );
          })}
        </div>
        {minimap ? (
          <div className="auto-minimap" aria-hidden="true">
            {workflow.nodes.map((node) => {
              const position = layout.positions.get(node.id);
              return position ? <span key={node.id} style={{ left: `${(position.x / layout.width) * 100}%`, top: `${(position.y / layout.height) * 100}%` }} /> : null;
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function NodeInspector({
  locale,
  workflow,
  node,
  onChange,
  onRemove,
}: {
  locale: Locale;
  workflow: AutomationWorkflow;
  node: AutomationNode | null;
  onChange: (next: AutomationWorkflow) => void;
  onRemove: (nodeId: string) => void;
}) {
  if (!node) {
    return <p className="auto-op-hint">{t(locale, 'Select a node to inspect its typed configuration.', 'اختر عقدة لفحص تهيئتها المُهيكلة.')}</p>;
  }
  const meta = NODE_TYPE_META[node.type];
  const configEntries = Object.entries(node.config);
  const setLabel = (label: string) => onChange({ ...workflow, nodes: workflow.nodes.map((entry) => (entry.id === node.id ? { ...entry, label } : entry)) });
  const setConfig = (key: string, value: string | number | boolean | string[] | null) => {
    onChange({ ...workflow, nodes: workflow.nodes.map((entry) => (entry.id === node.id ? { ...entry, config: { ...entry.config, [key]: value } } : entry)) });
  };
  return (
    <div className="auto-inspector">
      <div className="auto-inspector-head">
        <Chip tone={meta.tone}>{locale === 'ar' ? meta.ar : meta.en}</Chip>
        <Chip tone="muted">{node.toolId === 'platform' ? t(locale, 'Platform node', 'عقدة منصة') : toolLabel(node.toolId, locale)}</Chip>
        <button type="button" className="sys-icon-btn" aria-label={t(locale, 'Remove node', 'إزالة العقدة')} title={t(locale, 'Remove node', 'إزالة العقدة')} onClick={() => onRemove(node.id)}><Trash2 aria-hidden="true" /></button>
      </div>
      <label className="auto-field">
        <span>{t(locale, 'Node label', 'عنوان العقدة')}</span>
        <input className="sys-input" value={node.label} maxLength={80} onChange={(event) => setLabel(event.target.value)} />
      </label>
      <div className="auto-config">
        {configEntries.map(([key, value]) => (
          <label className="auto-field" key={key}>
            <span>{key}</span>
            {typeof value === 'boolean' ? (
              <input type="checkbox" checked={value} onChange={(event) => setConfig(key, event.target.checked)} />
            ) : typeof value === 'number' ? (
              <input className="sys-input" type="number" value={value} onChange={(event) => setConfig(key, Number(event.target.value))} />
            ) : Array.isArray(value) ? (
              <input className="sys-input" value={value.join(', ')} onChange={(event) => setConfig(key, event.target.value.split(',').map((entry) => entry.trim()).filter(Boolean))} />
            ) : (
              <input className="sys-input" value={String(value ?? '')} onChange={(event) => setConfig(key, event.target.value)} />
            )}
          </label>
        ))}
        {!configEntries.length ? <p className="auto-op-hint">{t(locale, 'This node has no editable configuration.', 'لا تهيئة قابلة للتعديل لهذه العقدة.')}</p> : null}
      </div>
      <p className="auto-op-hint">{t(locale, 'Changes are local draft edits. Save creates a version; nothing is executed.', 'التغييرات تعديلات مسودة محلية. الحفظ ينشئ نسخة؛ لا يُنفذ شيء.')}</p>
    </div>
  );
}

export function NodePalette({ locale, onAdd }: { locale: Locale; onAdd: (type: AutomationNodeType, toolId: string) => void }) {
  const [type, setType] = useState<AutomationNodeType>('action');
  const [tool, setTool] = useState<string>('auto-smart-scan');
  return (
    <div className="auto-palette">
      <Seg<AutomationNodeType>
        value={type}
        onChange={setType}
        ariaLabel={t(locale, 'Node type', 'نوع العقدة')}
        compact
        options={[
          { value: 'action', label: t(locale, 'Action', 'إجراء') },
          { value: 'condition', label: t(locale, 'Condition', 'شرط') },
          { value: 'approval', label: t(locale, 'Approval', 'موافقة') },
          { value: 'report', label: t(locale, 'Report', 'تقرير') },
        ]}
      />
      <select className="sys-input" value={tool} onChange={(event) => setTool(event.target.value)} aria-label={t(locale, 'Tool binding', 'ربط الأداة')}>
        {AUTOMATION_TOOLS.map((entry) => <option key={entry.id} value={entry.id}>{locale === 'ar' ? entry.ar : entry.en}</option>)}
      </select>
      <button type="button" className="sys-btn sys-btn-primary" onClick={() => onAdd(type, tool)} data-testid="automation-add-node-confirm"><Plus aria-hidden="true" />{t(locale, 'Add node', 'إضافة عقدة')}</button>
    </div>
  );
}

export function TriggerEditor({
  locale,
  workflow,
  onChange,
}: {
  locale: Locale;
  workflow: AutomationWorkflow;
  onChange: (next: AutomationWorkflow) => void;
}) {
  const trigger = workflow.trigger;
  return (
    <div className="auto-trigger-editor">
      <div className="auto-field-row">
        <label className="auto-field"><span>{t(locale, 'Trigger', 'المحفز')}</span>
          <select className="sys-input" value={trigger.type} onChange={(event) => onChange({ ...workflow, trigger: { ...trigger, type: event.target.value as AutomationWorkflow['trigger']['type'] } })}>
            <option value="schedule">{t(locale, 'Schedule', 'جدولة')}</option>
            <option value="manual">{t(locale, 'Manual', 'يدوي')}</option>
            <option value="startup">{t(locale, 'Startup metadata', 'بيانات الإقلاع')}</option>
          </select>
        </label>
        <label className="auto-field"><span>{t(locale, 'Cadence', 'التكرار')}</span>
          <select className="sys-input" value={trigger.cadence} onChange={(event) => onChange({ ...workflow, trigger: { ...trigger, cadence: event.target.value as AutomationWorkflow['trigger']['cadence'] } })}>
            <option value="daily">{t(locale, 'Daily', 'يومي')}</option>
            <option value="weekly">{t(locale, 'Weekly', 'أسبوعي')}</option>
            <option value="interval">{t(locale, 'Interval', 'فاصل')}</option>
          </select>
        </label>
        <label className="auto-field"><span>{t(locale, 'Time', 'الوقت')}</span><input className="sys-input" type="time" value={trigger.time} onChange={(event) => onChange({ ...workflow, trigger: { ...trigger, time: event.target.value } })} /></label>
        <label className="auto-field"><span>{t(locale, 'Interval hours', 'ساعات الفاصل')}</span><input className="sys-input" type="number" min={1} max={168} value={trigger.intervalHours} onChange={(event) => onChange({ ...workflow, trigger: { ...trigger, intervalHours: Number(event.target.value) } })} /></label>
      </div>
      {trigger.cadence === 'weekly' ? (
        <div className="auto-day-row" role="group" aria-label={t(locale, 'Weekdays', 'أيام الأسبوع')}>
          {DAY_LABELS[locale === 'ar' ? 'ar' : 'en'].map((label, index) => (
            <button key={label} type="button" className={cx('auto-day', trigger.days.includes(index) && 'is-active')} aria-pressed={trigger.days.includes(index)} onClick={() => onChange({ ...workflow, trigger: { ...trigger, days: trigger.days.includes(index) ? trigger.days.filter((day) => day !== index) : [...trigger.days, index].sort() } })}>{label}</button>
          ))}
        </div>
      ) : null}
      <label className="auto-field"><span>{t(locale, 'Exclusion dates (YYYY-MM-DD, comma separated)', 'تواريخ الاستبعاد (YYYY-MM-DD مفصولة بفواصل)')}</span><input className="sys-input" value={trigger.exclusions.join(', ')} onChange={(event) => onChange({ ...workflow, trigger: { ...trigger, exclusions: event.target.value.split(',').map((entry) => entry.trim()).filter(Boolean) } })} /></label>
      <p className="auto-op-hint">{t(locale, 'Timezone', 'المنطقة الزمنية')}: {trigger.timezone === 'local' ? t(locale, 'Host timezone', 'توقيت المضيف') : trigger.timezone}. {t(locale, 'No scheduler timer is started.', 'لا يبدأ أي مؤقت جدولة.')}</p>
    </div>
  );
}

export function SchedulePreviewList({ locale, preview, empty }: { locale: Locale; preview: AutomationSchedulePreview | null; empty?: string }) {
  if (!preview) return <p className="auto-op-hint">{empty || t(locale, 'Compute the next occurrences from the current schedule. Nothing is scheduled.', 'احسب المواعيد التالية من الجدولة الحالية. لا يُجدول شيء.')}</p>;
  return (
    <div className="auto-occurrences">
      <div className="auto-occurrence-head">
        <Chip tone={preview.valid ? 'good' : 'warn'}>{preview.valid ? t(locale, 'Valid preview', 'معاينة صحيحة') : t(locale, 'No occurrence', 'لا موعد')}</Chip>
        <span>{t(locale, 'Timezone', 'المنطقة الزمنية')}: {preview.timezone}</span>
      </div>
      {preview.next.map((entry: AutomationScheduleOccurrence, index) => (
        <div className="auto-occurrence" key={entry.at}>
          <span className="auto-occurrence-index">{String(index + 1).padStart(2, '0')}</span>
          <span>{entry.local}</span>
          <code>{entry.at}</code>
        </div>
      ))}
      {preview.reason ? <p className="auto-op-hint">{preview.reason}</p> : null}
    </div>
  );
}

export function QuietHoursEditor({
  locale,
  workflow,
  onChange,
}: {
  locale: Locale;
  workflow: AutomationWorkflow;
  onChange: (next: AutomationWorkflow) => void;
}) {
  const quiet = workflow.quietHours;
  const startMinutes = Number(quiet.start.split(':')[0]) * 60 + Number(quiet.start.split(':')[1]);
  const endMinutes = Number(quiet.end.split(':')[0]) * 60 + Number(quiet.end.split(':')[1]);
  const circumference = 2 * Math.PI * 44;
  const duration = (endMinutes - startMinutes + 1440) % 1440;
  const offset = (startMinutes / 1440) * circumference;
  const dash = (duration / 1440) * circumference;
  return (
    <div className="auto-quiet">
      <div className="auto-quiet-dial" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="44" fill="none" stroke="var(--sys-line-2)" strokeWidth="9" />
          <circle cx="60" cy="60" r="44" fill="none" stroke="var(--sys-accent, #818cf8)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)" />
        </svg>
        <span><Moon aria-hidden="true" />{quiet.start}<em>{quiet.end}</em></span>
      </div>
      <div className="auto-quiet-controls">
        <label className="auto-field"><span>{t(locale, 'Quiet start', 'بداية الهدوء')}</span><input className="sys-input" type="time" value={quiet.start} onChange={(event) => onChange({ ...workflow, quietHours: { ...quiet, start: event.target.value } })} /></label>
        <label className="auto-field"><span>{t(locale, 'Quiet end', 'نهاية الهدوء')}</span><input className="sys-input" type="time" value={quiet.end} onChange={(event) => onChange({ ...workflow, quietHours: { ...quiet, end: event.target.value } })} /></label>
        <label className="auto-field"><span>{t(locale, 'Weekend rule', 'قاعدة نهاية الأسبوع')}</span>
          <select className="sys-input" value={quiet.weekendRule} onChange={(event) => onChange({ ...workflow, quietHours: { ...quiet, weekendRule: event.target.value as typeof quiet.weekendRule } })}>
            <option value="mute">{t(locale, 'Mute', 'كتم')}</option>
            <option value="allow">{t(locale, 'Allow', 'سماح')}</option>
            <option value="inherit">{t(locale, 'Inherit', 'وراثة')}</option>
          </select>
        </label>
        <div className="auto-day-row">{DAY_LABELS[locale === 'ar' ? 'ar' : 'en'].map((label, index) => (
          <button key={label} type="button" className={cx('auto-day', quiet.days.includes(index) && 'is-active')} aria-pressed={quiet.days.includes(index)} onClick={() => onChange({ ...workflow, quietHours: { ...quiet, days: quiet.days.includes(index) ? quiet.days.filter((day) => day !== index) : [...quiet.days, index].sort() } })}>{label}</button>
        ))}</div>
        <p className="auto-op-hint">{t(locale, 'Quiet hours are draft policy metadata. No runtime notification is suppressed because no notification engine exists.', 'ساعات الهدوء بيانات سياسة مسودة. لا يُكتم إشعار وقت التشغيل لعدم وجود محرك إشعارات.')}</p>
      </div>
    </div>
  );
}

export function DryRunTimeline({ locale, result }: { locale: Locale; result: AutomationDryRunResult | null }) {
  if (!result) return <p className="auto-op-hint">{t(locale, 'Run a deterministic dry-run to see node order and blocked actions.', 'شغّل معاينة جافة حتمية لرؤية ترتيب العقد والإجراءات المحجوبة.')}</p>;
  return (
    <div className="auto-dryrun" data-testid="automation-dryrun-result">
      <div className="auto-dryrun-head">
        <Chip tone="good" icon={CheckCircle2}>{t(locale, 'Valid DAG', 'DAG صحيح')}</Chip>
        <Chip tone="bad" icon={Lock}>{t(locale, 'No execution', 'بلا تنفيذ')}</Chip>
        <span className="sys-mono">{result.receipt}</span>
      </div>
      <ol className="auto-dryrun-steps">
        {result.steps.map((step, index) => {
          const Icon = NODE_ICONS[step.type];
          return (
            <li key={step.nodeId} className={`is-${step.status}`}>
              <span className="auto-step-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="auto-step-icon" aria-hidden="true"><Icon /></span>
              <span className="auto-step-copy"><strong>{step.label}</strong><em>{step.detail}</em></span>
              <Chip tone={step.status === 'blocked' ? 'bad' : step.status === 'required' ? 'violet' : step.status === 'preview-artifact' ? 'good' : 'info'}>{step.status}</Chip>
            </li>
          );
        })}
      </ol>
      <p className="auto-op-hint">{t(locale, 'Dry-runs evaluate graph order only. Conditions, actions and artifacts are not produced.', 'المعاينات الجافة تقيّم ترتيب الرسم فقط. لا تُنتج الشروط أو الإجراءات أو المخرجات.')}</p>
    </div>
  );
}

export function TemplateCard({
  locale,
  template,
  onInstantiate,
}: {
  locale: Locale;
  template: AutomationTemplate;
  onInstantiate: (template: AutomationTemplate) => void;
}) {
  return (
    <button type="button" className="auto-template-card" onClick={() => onInstantiate(template)} data-testid={`automation-template-${template.id}`}>
      <div className="auto-template-head">
        <span className="auto-template-icon" aria-hidden="true"><CalendarDays /></span>
        <span className="auto-template-copy"><strong>{locale === 'ar' ? template.labelAr : template.labelEn}</strong><em>{template.category}</em></span>
        <ChevronRight aria-hidden="true" />
      </div>
      <p>{locale === 'ar' ? template.blurbAr : template.blurbEn}</p>
      <div className="auto-template-nodes">
        {template.workflow.nodes.slice(0, 6).map((node) => (
          <span key={node.id} className={`is-${node.type}`} title={node.label}>{node.type.slice(0, 1).toUpperCase()}</span>
        ))}
        <em>{template.workflow.nodes.length} {t(locale, 'nodes', 'عقدة')}</em>
      </div>
    </button>
  );
}

export function PolicyEditor({
  locale,
  workflow,
  onChange,
}: {
  locale: Locale;
  workflow: AutomationWorkflow;
  onChange: (next: AutomationWorkflow) => void;
}) {
  const policy = workflow.policy;
  return (
    <div className="auto-policy">
      <label className="auto-field"><span>{t(locale, 'Approval required', 'الموافقة مطلوبة')}</span><input type="checkbox" checked={policy.requireApproval} onChange={(event) => onChange({ ...workflow, policy: { ...policy, requireApproval: event.target.checked } })} /></label>
      <label className="auto-field"><span>{t(locale, 'Retention days', 'أيام الاحتفاظ')}</span>
        <select className="sys-input" value={policy.retentionDays} onChange={(event) => onChange({ ...workflow, policy: { ...policy, retentionDays: Number(event.target.value) as typeof policy.retentionDays } })}>
          <option value={14}>14</option><option value={30}>30</option><option value={90}>90</option>
        </select>
      </label>
      <label className="auto-field"><span>{t(locale, 'Battery threshold %', 'حد البطارية %')}</span><input className="sys-input" type="number" min={0} max={100} value={policy.batteryThreshold} onChange={(event) => onChange({ ...workflow, policy: { ...policy, batteryThreshold: Number(event.target.value) } })} /></label>
      <label className="auto-field"><span>{t(locale, 'AC power required', 'يلزم تيار متردد')}</span><input type="checkbox" checked={policy.acOnly} onChange={(event) => onChange({ ...workflow, policy: { ...policy, acOnly: event.target.checked } })} /></label>
      <label className="auto-field"><span>{t(locale, 'Severity threshold', 'حد الشدة')}</span>
        <select className="sys-input" value={policy.severity} onChange={(event) => onChange({ ...workflow, policy: { ...policy, severity: event.target.value as typeof policy.severity } })}>
          <option value="info">info</option><option value="warning">warning</option><option value="error">error</option>
        </select>
      </label>
      <div className="auto-channel-row">
        {['in-app', 'journal', 'toast'].map((channel) => (
          <label key={channel} className="auto-channel">
            <input type="checkbox" checked={policy.notifyChannels.includes(channel)} onChange={() => onChange({ ...workflow, policy: { ...policy, notifyChannels: policy.notifyChannels.includes(channel) ? policy.notifyChannels.filter((entry) => entry !== channel) : [...policy.notifyChannels, channel] } })} />
            <Bell aria-hidden="true" />{channel}
          </label>
        ))}
      </div>
      <p className="auto-op-hint">{t(locale, 'Channels are local policy labels. No external message is sent.', 'القنوات تسميات سياسة محلية. لا تُرسل رسالة خارجية.')}</p>
    </div>
  );
}

export function WorkflowSummary({ locale, workflow }: { locale: Locale; workflow: AutomationWorkflow | null }) {
  if (!workflow) return null;
  return (
    <DataRows
      rows={[
        { label: t(locale, 'Workflow', 'سير العمل'), value: workflow.name },
        { label: t(locale, 'Version', 'النسخة'), value: workflow.version ? `v${workflow.version}` : t(locale, 'unsaved draft', 'مسودة غير محفوظة') },
        { label: t(locale, 'Trigger', 'المحفز'), value: triggerLabel(workflow, locale) },
        { label: t(locale, 'Nodes / edges', 'العقد / الحواف'), value: `${workflow.nodes.length} / ${workflow.edges.length}`, mono: true },
        { label: t(locale, 'Execution', 'التنفيذ'), value: t(locale, 'Not implemented', 'غير منفذ'), tone: 'bad' },
        { label: t(locale, 'Mutation', 'التغيير'), value: 'none', tone: 'good' },
      ]}
    />
  );
}

export function EmptyWorkflowBlock({ locale }: { locale: Locale }) {
  return (
    <div className="auto-empty">
      <FileText aria-hidden="true" />
      <strong>{t(locale, 'No workflow draft yet', 'لا مسودة سير عمل بعد')}</strong>
      <p>{t(locale, 'Choose a saved workflow or instantiate a template to start a local draft.', 'اختر سير عمل محفوظًا أو أنشئ من قالب لبدء مسودة محلية.')}</p>
    </div>
  );
}
