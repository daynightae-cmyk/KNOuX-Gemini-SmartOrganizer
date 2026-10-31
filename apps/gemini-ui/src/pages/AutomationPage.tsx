import { CommandCanvas } from '../visual/CommandCanvas';
import { OrbitalControl } from '../visual/OrbitalControl';
import { ServicePipeline } from '../visual/ServicePipeline';
/**
 * KNOuX SmartOrganizer - Flow Studio (Mission 13).
 *
 * Browser previews render an explicit native-required state. In Electron every
 * workflow, template, schedule occurrence, power reading and dry-run record is
 * measured or locally persisted. No workflow executor or scheduler timer exists.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  FileText,
  GitBranch,
  History,
  LayoutTemplate,
  Loader2,
  Lock,
  Play,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { AutomationNode, AutomationNodeType, AutomationWorkflow } from '../../shared/native-contracts';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXSidebar, KNOuXTitleBar } from '../components/shell/KNOuXShellComponents';
import { AUTOMATION_TOOLS, RISK_META, STATE_META, TOOL_BY_ID, toolLabel, type AutomationLocale } from '../automation/catalog';
import {
  appendNode,
  cloneWorkflow,
  formatCount,
  formatTimestamp,
  initialWorkflow,
  nextNodeId,
  removeNode,
  scheduleSpecFromWorkflow,
  t,
  triggerLabel,
  workflowDraftFromTemplate,
  workflowStatusLabel,
} from '../automation/model';
import { useAutomation } from '../automation/useAutomation';
import { AutomationServiceWorkspace } from '../automation/AutomationServiceWorkspaces';
import {
  DryRunTimeline,
  NodeInspector,
  NodePalette,
  SchedulePreviewList,
  TemplateCard,
  TriggerEditor,
  WorkflowCanvas,
} from '../automation/ui';
import { Chip, Panel, SearchBox, Seg, downloadJson, cx } from '../system/ui';
import '../automation.css';

export interface AutomationPageProps {
  onNavigateSection?: (section: string) => void;
}

export function AutomationPage({ onNavigateSection }: AutomationPageProps) {
  const { navigateTo, locale: globalLocale, toggleLocale } = useNavigation();
  const [localLocale, setLocalLocale] = useState<AutomationLocale | null>(null);
  const locale: AutomationLocale = localLocale || (globalLocale === 'ar' ? 'ar' : 'en');
  const controller = useAutomation();
  const snapshot = controller.snapshot;

  const [draft, setDraft] = useState<AutomationWorkflow | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<keyof typeof import('../automation/AutomationServiceWorkspaces')['AUTOMATION_WORKBENCHES'] | null>(null);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!snapshot) return;
    setDraft((current) => {
      if (current) return current;
      const initial = initialWorkflow(snapshot);
      setSelectedNodeId(initial?.nodes[0]?.id || null);
      return initial;
    });
  }, [snapshot]);

  useEffect(() => {
    if (activeTool && !snapshot) setActiveTool(null);
  }, [activeTool, snapshot]);

  const savedWorkflows = useMemo(() => {
    const needle = libraryQuery.trim().toLowerCase();
    if (!needle) return snapshot?.workflows || [];
    return (snapshot?.workflows || []).filter((entry) => `${entry.name} ${entry.id}`.toLowerCase().includes(needle));
  }, [libraryQuery, snapshot]);

  const visibleTemplates = useMemo(() => {
    const needle = libraryQuery.trim().toLowerCase();
    if (!needle) return snapshot?.templates || [];
    return (snapshot?.templates || []).filter((entry) => `${entry.labelEn} ${entry.labelAr} ${entry.category}`.toLowerCase().includes(needle));
  }, [libraryQuery, snapshot]);

  const selectedNode = draft?.nodes.find((node) => node.id === selectedNodeId) || null;
  const journal = controller.journal.length ? controller.journal : snapshot?.journal || [];
  const dryRun = controller.dryRunResult;

  const loadSaved = (workflow: AutomationWorkflow) => {
    const next = cloneWorkflow(workflow);
    setDraft(next);
    setSelectedNodeId(next.nodes[0]?.id || null);
  };

  const instantiate = (templateId: string) => {
    const template = snapshot?.templates.find((entry) => entry.id === templateId);
    if (!template) return;
    const next = workflowDraftFromTemplate(template);
    setDraft(next);
    setSelectedNodeId(next.nodes[0]?.id || null);
    controller.showNotice(t(locale, 'Template loaded as a local draft. Nothing was executed or scheduled.', 'حُمّل القالب كمسودة محلية. لم يُنفذ أو يُجدول شيء.'));
  };

  const saveDraft = async () => {
    if (!draft) return;
    const saved = await controller.saveWorkflow(draft);
    if (saved) {
      const next = cloneWorkflow(saved);
      setDraft(next);
      setSelectedNodeId((current) => (next.nodes.some((node) => node.id === current) ? current : next.nodes[0]?.id || null));
    }
  };

  const runDryRun = async () => {
    if (!draft) return;
    await controller.dryRun(draft);
  };

  const addNode = (type: AutomationNodeType, toolId: string) => {
    if (!draft) return;
    const node: AutomationNode = {
      id: nextNodeId(draft, type),
      type,
      label: `${type} ${draft.nodes.length + 1}`,
      toolId: toolId as AutomationNode['toolId'],
      config: type === 'condition' ? { thresholdPercent: 10 } : type === 'approval' ? { scope: 'review' } : {},
    };
    const next = appendNode(draft, node);
    setDraft(next);
    setSelectedNodeId(node.id);
    setAddOpen(false);
  };

  const removeSelectedNode = (nodeId: string) => {
    if (!draft) return;
    const next = removeNode(draft, nodeId);
    setDraft(next);
    setSelectedNodeId(next.nodes[0]?.id || null);
  };

  const previewSchedule = async () => {
    if (!draft) return;
    await controller.previewSchedule(scheduleSpecFromWorkflow(draft));
  };

  const exportDraft = () => {
    if (!draft) return;
    const ok = downloadJson('knoux-flow-workflow.json', draft);
    controller.showNotice(ok ? t(locale, 'Workflow draft exported as JSON.', 'صُدّرت مسودة سير العمل بصيغة JSON.') : t(locale, 'The export could not start.', 'تعذّر بدء التصدير.'));
  };

  const exportReport = async () => {
    if (!snapshot) return;
    const report = await controller.loadReport(true);
    if (report) {
      const ok = downloadJson('knoux-flow-studio-report.json', report);
      controller.showNotice(ok ? t(locale, 'Read-only Flow Studio report exported.', 'صُدّر تقرير Flow Studio للقراءة فقط.') : t(locale, 'The report export could not start.', 'تعذّر بدء تصدير التقرير.'));
    }
  };

  const openTool = (id: keyof typeof import('../automation/AutomationServiceWorkspaces')['AUTOMATION_WORKBENCHES']) => {
    if (!snapshot) {
      controller.showNotice(t(locale, 'Run Flow Studio discovery before opening a tool.', 'شغّل اكتشاف Flow Studio قبل فتح أداة.'));
      return;
    }
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setActiveTool(id);
  };

  const closeTool = () => {
    setActiveTool(null);
    window.setTimeout(() => triggerRef.current?.focus(), 30);
  };

  const navigate = (section: string) => {
    if (onNavigateSection) onNavigateSection(section);
    else navigateTo(section);
  };

  const scanStatus = controller.scanning
    ? t(locale, 'Discovering local workflow evidence', 'جارٍ اكتشاف أدلة سير العمل المحلية')
    : snapshot
      ? t(locale, 'Local workflow store ready', 'مخزن سير العمل المحلي جاهز')
      : controller.nativeAvailable
        ? t(locale, 'Awaiting measured discovery', 'بانتظار الاكتشاف المقيس')
        : t(locale, 'Native measurement required', 'القياس الأصلي مطلوب');

  const renderToolCard = (entry: (typeof AUTOMATION_TOOLS)[number]) => {
    const Icon = entry.icon;
    const state = STATE_META[entry.state];
    const risk = RISK_META[entry.risk];
    return (
      <button key={entry.id} type="button" className="auto-tool-card" data-testid={`automation-tool-${entry.id}`} onClick={() => openTool(entry.id)}>
        <span className="auto-tool-index">{String(entry.index).padStart(2, '0')}</span>
        <span className="auto-tool-icon" style={{ color: entry.accent }} aria-hidden="true"><Icon /></span>
        <span className="auto-tool-copy"><strong>{locale === 'ar' ? entry.ar : entry.en}</strong><em>{entry.provider}</em></span>
        <span className="auto-tool-badges"><Chip tone={state.tone}>{t(locale, state.en, state.ar)}</Chip><Chip tone={risk.tone}>{t(locale, risk.en, risk.ar)}</Chip></span>
      </button>
    );
  };

  return (
    <div className={cx('sys-viewport auto-viewport', locale === 'ar' && 'is-rtl')} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <KNOuXTitleBar
        sectionName={t(locale, 'Automation', 'الأتمتة')}
        sectionSubtitle={t(locale, 'Flow Studio · local drafts', 'استوديو التدفق · مسودات محلية')}
        onNavigateHome={() => navigate('home')}
        searchPlaceholder={t(locale, 'Search workflows and templates… (Ctrl+K)', 'ابحث في سير العمل والقوالب… (Ctrl+K)')}
        isArabic={locale === 'ar'}
        onToggleArabic={() => { toggleLocale(); setLocalLocale(locale === 'ar' ? 'en' : 'ar'); }}
        onOpenSettings={() => navigate('settings')}
      />
      {controller.notice ? (
        <div className="sys-toast sys-toast-good" role="status"><CheckCircle2 aria-hidden="true" /><span>{controller.notice}</span><button type="button" onClick={controller.clearNotice} aria-label={t(locale, 'Dismiss', 'إغلاق')}><X aria-hidden="true" /></button></div>
      ) : null}
      {controller.actionError ? (
        <div className="sys-toast sys-toast-bad" role="alert"><AlertTriangle aria-hidden="true" /><div><strong>{controller.actionError.code}</strong><span>{controller.actionError.message}</span></div><button type="button" onClick={controller.clearError} aria-label={t(locale, 'Dismiss', 'إغلاق')}><X aria-hidden="true" /></button></div>
      ) : null}

      <div className="sys-shell">
        <KNOuXSidebar activeSection="automation" onNavigate={navigate} isArabic={locale === 'ar'} />
        <div className="sys-shell-main">
          <main className="sys-main knx-custom-scrollbar auto-main" data-testid="automation-workspace">
          <CommandCanvas locale={locale}>
            <section className="sys-hero auto-hero" data-testid="automation-hero">
              <div className="sys-hero-arc" aria-hidden="true">
                <svg viewBox="0 0 620 120" fill="none">
                  <defs><linearGradient id="auto-hero-wave" x1="0" y1="0" x2="620" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#34d399" /><stop offset="0.5" stopColor="#818cf8" /><stop offset="1" stopColor="#f472b6" /></linearGradient></defs>
                  <path d="M8 62 C88 16, 150 108, 236 52 C322 -4, 386 100, 470 46 C534 6, 580 72, 616 52" stroke="url(#auto-hero-wave)" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M8 52 C76 88, 156 16, 240 78 C324 136, 400 24, 486 72 C548 108, 592 28, 616 56" stroke="url(#auto-hero-wave)" strokeWidth="1.4" strokeDasharray="4 5" opacity="0.55" />
                </svg>
              </div>
              <div className="sys-hero-copy">
                <span className="sys-hero-eyebrow">{t(locale, 'FLOW STUDIO · LOCAL DRAFTS · NO EXECUTION', 'استوديو التدفق · مسودات محلية · بلا تنفيذ')}</span>
                <h1>{t(locale, 'Flow', 'استوديو')} <span>{t(locale, 'Studio', 'التدفق')}</span></h1>
                <p>{t(locale, 'Design typed workflow drafts, validate the DAG and inspect every blocked action before any future approval.', 'صمم مسودات سير عمل مهيكلة، وتحقق من DAG، وافحص كل إجراء محجوب قبل أي موافقة مستقبلية.')}</p>
                <ServicePipeline
                  locale={locale}
                  accent="emerald"
                  testId="automation-pipeline"
                  onSelect={id => openTool(id==='trigger'?'auto-schedule-plan':id==='dry-run'||id==='verify'?'auto-run-history':'auto-smart-scan')}
                  dense
                  live={controller.scanning || Boolean(controller.busy)}
                  caption={t(locale, 'Draft only · no executor shipped · nothing is scheduled', 'مسودة فقط · لا منفذ متوفر · لا شيء مجدول')}
                  stages={[
                    {
                      id: 'trigger',
                      label: t(locale, 'Trigger', 'مشغّل'),
                      detail: t(locale, 'Draft', 'مسودة'),
                      state: draft ? 'partial' : 'pending',
                    },
                    {
                      id: 'validate',
                      label: t(locale, 'Validate', 'تحقق'),
                      state: dryRun?.workflowId === draft?.id && dryRun?.workflowVersion === draft?.version && dryRun?.valid ? 'complete' : 'pending',
                    },
                    {
                      id: 'dry-run',
                      label: t(locale, 'Dry run', 'تجربة جافة'),
                      detail: t(locale, 'Preview only', 'معاينة فقط'),
                      state: dryRun && draft && dryRun.workflowId === draft.id && dryRun.workflowVersion === draft.version ? 'complete' : 'pending',
                    },
                    {
                      id: 'approve',
                      label: t(locale, 'Approve', 'موافقة'),
                      state: 'gated',
                    },
                    {
                      id: 'execute',
                      label: t(locale, 'Execute', 'تنفيذ'),
                      state: 'gated',
                    },
                    {
                      id: 'verify',
                      label: t(locale, 'Verify', 'تحقق نهائي'),
                      state: 'pending',
                    },
                  ]}
                />
                <div className="sys-hero-chips">
                  <Chip tone={snapshot ? 'good' : controller.scanning ? 'info' : 'muted'} icon={Sparkles}>{scanStatus}</Chip>
                  <Chip tone="info" icon={LayoutTemplate}>{formatCount(snapshot?.templates.length || 0)} {t(locale, 'templates', 'قالب')}</Chip>
                  <Chip tone="violet" icon={Save}>{formatCount(snapshot?.workflows.length || 0)} {t(locale, 'saved drafts', 'مسودة محفوظة')}</Chip>
                  <Chip tone="bad" icon={Lock}>{t(locale, '0 workflows executed', '0 سير عمل منفذ')}</Chip>
                  {snapshot ? <Chip tone="muted" icon={Database}>{t(locale, 'receipt', 'إيصال')} {snapshot.receipt.slice(0, 12)}</Chip> : null}
                </div>
                <div className="sys-hero-actions">
                  <button type="button" className={cx('sys-btn', controller.scanning ? 'sys-btn-danger' : 'sys-btn-primary')} onClick={() => (controller.scanning ? void controller.cancelScan() : void controller.startScan())} disabled={!controller.nativeAvailable || controller.cancelling}>
                    {controller.scanning ? <X aria-hidden="true" /> : <Sparkles aria-hidden="true" />}{controller.scanning ? t(locale, 'Cancel discovery', 'إلغاء الاكتشاف') : snapshot ? t(locale, 'Re-discover', 'إعادة الاكتشاف') : t(locale, 'Start measured discovery', 'بدء الاكتشاف المقيس')}
                  </button>
                  <button type="button" className="sys-btn sys-btn-ghost" onClick={() => void controller.refreshSnapshot(true)} disabled={!snapshot || controller.refreshing || controller.scanning}><RefreshIcon />{t(locale, 'Refresh store', 'تحديث المخزن')}</button>
                  <button type="button" className="sys-btn sys-btn-ghost" onClick={() => void previewSchedule()} disabled={!draft || controller.busy === 'schedule'}><Clock3 aria-hidden="true" />{t(locale, 'Preview schedule', 'معاينة الجدولة')}</button>
                  <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void exportReport()} disabled={!snapshot || controller.busy === 'report'}><Download aria-hidden="true" />{t(locale, 'Export report', 'تصدير التقرير')}</button>
                </div>
              </div>
              <OrbitalControl title={t(locale, 'Flow Studio', 'استوديو التدفق')} subtitle={t(locale, 'Compose · Preview · Review', 'أنشئ · عاين · راجع')}
                onActivate={() => void controller.startScan()} disabled={!controller.nativeAvailable || controller.scanning} running={controller.scanning}
                tools={[
                  {id:'templates', label:t(locale,'Templates','القوالب'), icon:LayoutTemplate, onClick:() => openTool('auto-templates'), disabled:!snapshot},
                  {id:'schedule', label:t(locale,'Schedule','الجدولة'), icon:Clock3, onClick:() => openTool('auto-schedule-plan'), disabled:!snapshot},
                  {id:'history', label:t(locale,'History','السجل'), icon:History, onClick:() => openTool('auto-run-history'), disabled:!snapshot},
                    {id:'scheduled-scan',label:t(locale,'Scan Draft','مسودة الفحص'),icon:Search,onClick:()=>openTool('auto-smart-scan'),disabled:!snapshot,hint:'Schedule preview only; no task is installed'},
                    {id:'transfer',label:t(locale,'Transfer','النقل'),icon:Download,onClick:()=>openTool('auto-export'),disabled:!snapshot},
                    {id:'retention',label:t(locale,'Retention','الاحتفاظ'),icon:History,onClick:()=>openTool('auto-retention'),disabled:!snapshot,hint:'Review-only retention preview; no deletion'},
                ]}/>
              <aside className="sys-source-card auto-source-card" data-testid="automation-source-card">
                <span className={cx('sys-source-ring', snapshot ? 'is-live' : controller.scanning ? 'is-scanning' : 'is-idle')} aria-hidden="true"><span /></span>
                <div className="sys-source-copy"><span>{t(locale, 'Evidence source', 'مصدر الأدلة')}</span><strong>KNOuX AutomationBridge v1</strong><em>{scanStatus}</em><em>{snapshot ? formatTimestamp(snapshot.generatedAt, locale) : controller.nativeAvailable ? t(locale, 'Bounded local discovery', 'اكتشاف محلي محدود') : t(locale, 'Browser preview', 'معاينة متصفح')}</em></div>
                <div className="sys-source-badges"><span className="sys-source-badge">{t(locale, 'Draft only', 'مسودة فقط')}</span><span className="sys-source-badge">{t(locale, 'No timer', 'لا مؤقت')}</span></div>
              </aside>
            </section>

            {!controller.nativeAvailable ? (
              <div className="sys-banner is-required" data-testid="automation-native-required"><Lock aria-hidden="true" /><div><strong>{t(locale, 'Native measurement required', 'القياس الأصلي مطلوب')}</strong><p>{t(locale, 'This is a browser preview. The local Flow Studio bridge is unavailable, so no workflow, template, schedule occurrence or dry-run is substituted. Open the native Electron app.', 'هذه معاينة متصفح. جسر Flow Studio المحلي غير متاح، لذلك لا يُستبدل أي سير عمل أو قالب أو موعد أو معاينة جافة. افتح تطبيق Electron الأصلي.')}</p></div></div>
            ) : (
              <div className="sys-banner is-measured" data-testid="automation-native-banner"><ShieldCheck aria-hidden="true" /><div><strong>{t(locale, 'Local Flow Studio', 'استوديو التدفق المحلي')}</strong><p>{snapshot ? `${formatCount(snapshot.workflows.length)} ${t(locale, 'saved drafts', 'مسودة محفوظة')} · ${formatCount(snapshot.journal.length)} ${t(locale, 'dry-runs', 'معاينة جافة')} · ${snapshot.runtime.timezone} · ${t(locale, 'execution', 'التنفيذ')}: not-implemented` : scanStatus}</p></div><span className="sys-banner-chip">{snapshot ? t(locale, 'LOCAL', 'محلي') : t(locale, 'MEASURING', 'جارٍ القياس')}</span></div>
            )}

            {controller.scanning ? (
              <div className="sys-scan-progress" data-testid="automation-scan-progress"><div className="sys-scan-progress-head"><span><Loader2 aria-hidden="true" className="sys-spin" />{t(locale, 'Bounded local discovery', 'اكتشاف محلي محدود')}</span><em>{formatCount(controller.session?.progress || 0)}%</em></div><div className="sys-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={controller.session?.progress || 0}><span style={{ width: `${Math.max(2, Math.min(100, controller.session?.progress || 0))}%` }} /></div><div className="sys-scan-stages">{(controller.session?.stages || []).map((stage) => <span key={stage.key} className={`sys-scan-stage is-${stage.status}`} title={stage.provider}>{locale === 'ar' ? stage.labelAr : stage.labelEn}</span>)}</div></div>
            ) : null}

            <div className="sys-kpi-row auto-kpi-row">
              {[
                { key: 'workflows', label: t(locale, 'Saved drafts', 'مسودات محفوظة'), value: snapshot ? formatCount(snapshot.workflows.length) : '—', note: t(locale, 'Versioned local workflows', 'سير عمل محلي بنسخ'), icon: Save },
                { key: 'templates', label: t(locale, 'Templates', 'القوالب'), value: snapshot ? formatCount(snapshot.templates.length) : '—', note: t(locale, 'Built-in typed flows', 'تدفقات مهيكلة مدمجة'), icon: LayoutTemplate },
                { key: 'dryruns', label: t(locale, 'Dry-runs', 'معاينات جافة'), value: formatCount(journal.length), note: t(locale, 'Deterministic only', 'حتمية فقط'), icon: History },
                { key: 'nodes', label: t(locale, 'Draft nodes', 'عقد المسودة'), value: draft ? formatCount(draft.nodes.length) : '—', note: draft ? workflowStatusLabel(draft, locale) : t(locale, 'No draft', 'لا مسودة'), icon: GitBranch },
                { key: 'battery', label: t(locale, 'Power evidence', 'أدلة الطاقة'), value: snapshot ? (snapshot.runtime.batteryAvailable ? `${snapshot.runtime.batteryChargePercent ?? '—'}%` : '—') : '—', note: snapshot?.runtime.batteryAvailable ? t(locale, 'Measured battery', 'بطارية مقيسة') : t(locale, 'Battery unavailable', 'البطارية غير متاحة'), icon: BatteryCharging },
                { key: 'executed', label: t(locale, 'Executed', 'المنفذ'), value: '0', note: t(locale, 'No executor shipped', 'لا منفذ متوفر'), icon: Lock },
              ].map((kpi) => {
                const Icon = kpi.icon;
                return <div key={kpi.key} className="sys-instrument auto-kpi" data-testid={`automation-kpi-${kpi.key}`}><span className="auto-kpi-head"><span className="auto-kpi-icon"><Icon aria-hidden="true" /></span><span>{kpi.label}</span></span><strong dir="ltr" data-testid={`automation-kpi-${kpi.key}-value`}>{kpi.value}</strong><em>{kpi.note}</em></div>;
              })}
            </div>

            <div className="auto-editor-grid">
              <Panel className="auto-library" title={t(locale, 'Workflow library', 'مكتبة سير العمل')} sub={t(locale, 'Saved drafts and built-in templates.', 'مسودات محفوظة وقوالب مدمجة.')} icon={LayoutTemplate} bodyClassName="sys-panel-body-flush">
                <div className="auto-library-search"><SearchBox value={libraryQuery} onChange={setLibraryQuery} placeholder={t(locale, 'Search workflows…', 'ابحث في سير العمل…')} ariaLabel={t(locale, 'Search workflows', 'بحث سير العمل')} /></div>
                <div className="auto-library-section">
                  <h4>{t(locale, 'Saved workflows', 'سير العمل المحفوظ')}</h4>
                  <div className="auto-library-list">
                    {savedWorkflows.map((workflow) => (
                      <button key={workflow.id} type="button" className={cx('auto-workflow-row', draft?.id === workflow.id && 'is-active')} data-testid={`automation-workflow-row-${workflow.id}`} onClick={() => loadSaved(workflow)}>
                        <span><strong>{workflow.name}</strong><em>{triggerLabel(workflow, locale)}</em></span>
                        <Chip tone="muted">v{workflow.version}</Chip>
                      </button>
                    ))}
                    {!savedWorkflows.length ? <p className="auto-op-hint">{t(locale, 'No saved workflow yet.', 'لا سير عمل محفوظ بعد.')}</p> : null}
                  </div>
                </div>
                <div className="auto-library-section">
                  <h4>{t(locale, 'Templates', 'القوالب')}</h4>
                  <div className="auto-library-templates">
                    {visibleTemplates.map((template) => {
                      const Icon = TOOL_BY_ID[template.workflow.nodes.find((node) => node.toolId !== 'platform')?.toolId as keyof typeof TOOL_BY_ID]?.icon || GitBranch;
                      return (
                      <button key={template.id} type="button" className="auto-library-template" data-testid={`automation-template-${template.id}`} onClick={() => instantiate(template.id)}>
                        <Icon aria-hidden="true" />
                        <strong>{locale === 'ar' ? template.labelAr : template.labelEn}</strong>
                        <em>{template.workflow.nodes.length} {t(locale, 'nodes', 'عقدة')} · {template.category}</em>
                      </button>
                    ); })}
                  </div>
                </div>
              </Panel>

              <div className="auto-editor-center">
                <div className="auto-editor-toolbar">
                  <label className="auto-name-field"><span>{t(locale, 'Workflow name', 'اسم سير العمل')}</span><input className="sys-input" value={draft?.name || ''} onChange={(event) => draft && setDraft({ ...draft, name: event.target.value })} maxLength={80} aria-label={t(locale, 'Workflow name', 'اسم سير العمل')} data-testid="automation-name-input" /></label>
                  <Chip tone={draft?.version ? 'good' : 'warn'}>{draft?.version ? `v${draft.version}` : t(locale, 'unsaved', 'غير محفوظ')}</Chip>
                  <span className="sys-toolbar-spacer" />
                  <button type="button" className="sys-btn sys-btn-quiet" onClick={() => setAddOpen((value) => !value)} aria-pressed={addOpen} data-testid="automation-add-node"><Plus aria-hidden="true" />{t(locale, 'Add node', 'إضافة عقدة')}</button>
                  <button type="button" className="sys-btn sys-btn-ghost" onClick={exportDraft} disabled={!draft}><Download aria-hidden="true" />{t(locale, 'Export', 'تصدير')}</button>
                  <button type="button" className="sys-btn sys-btn-ghost" onClick={() => void runDryRun()} disabled={!draft || controller.busy === 'dry-run'} data-testid="automation-dryrun"><Play aria-hidden="true" />{t(locale, 'Dry-run', 'معاينة جافة')}</button>
                  <button type="button" className="sys-btn sys-btn-primary" onClick={() => void saveDraft()} disabled={!draft || controller.busy === 'save'} data-testid="automation-save"><Save aria-hidden="true" />{t(locale, 'Save draft', 'حفظ المسودة')}</button>
                </div>
                {addOpen ? <NodePalette locale={locale} onAdd={addNode} /> : null}
                {draft ? (
                  <WorkflowCanvas locale={locale} workflow={draft} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} />
                ) : <div className="auto-empty"><GitBranch aria-hidden="true" /><strong>{t(locale, 'No workflow loaded', 'لا سير عمل محمّل')}</strong><p>{t(locale, 'Choose a saved workflow or template from the library.', 'اختر سير عمل محفوظًا أو قالبًا من المكتبة.')}</p></div>}
                {draft ? (
                  <details className="auto-workflow-details">
                    <summary><CalendarDays aria-hidden="true" />{t(locale, 'Schedule & dry-run details', 'الجدولة وتفاصيل المعاينة')}</summary>
                  <div className="auto-editor-lower">
                    <Panel title={t(locale, 'Trigger & schedule', 'المحفز والجدولة')} icon={CalendarDays}>
                      <TriggerEditor locale={locale} workflow={draft} onChange={setDraft} />
                      <div className="auto-occurrence-inline"><SchedulePreviewList locale={locale} preview={controller.schedulePreview} empty={t(locale, 'Preview the schedule to compute local occurrences.', 'عاين الجدولة لحساب المواعيد المحلية.')} /></div>
                    </Panel>
                    <Panel title={t(locale, 'Dry-run timeline', 'خط المعاينة الجافة')} icon={Play}>
                      <DryRunTimeline locale={locale} result={dryRun} />
                    </Panel>
                  </div>
                  </details>
                ) : null}
              </div>

              <div className="auto-editor-rail" data-testid="automation-inspector">
                <Panel title={t(locale, 'Node inspector', 'فاحص العقد')} icon={FileText}>
                  <NodeInspector locale={locale} workflow={draft || emptyWorkflow} node={selectedNode} onChange={setDraft} onRemove={removeSelectedNode} />
                </Panel>
                <Panel title={t(locale, 'Workflow metadata', 'بيانات سير العمل')} icon={ShieldCheck}>
                  {draft ? (
                    <>
                      <div className="auto-meta-row"><span>{t(locale, 'Trigger', 'المحفز')}</span><strong>{triggerLabel(draft, locale)}</strong></div>
                      <div className="auto-meta-row"><span>{t(locale, 'Nodes / edges', 'العقد / الحواف')}</span><strong>{draft.nodes.length} / {draft.edges.length}</strong></div>
                      <div className="auto-meta-row"><span>{t(locale, 'Quiet hours', 'ساعات الهدوء')}</span><strong>{draft.quietHours.start}–{draft.quietHours.end}</strong></div>
                      <div className="auto-meta-row"><span>{t(locale, 'Execution', 'التنفيذ')}</span><strong className="is-bad">{t(locale, 'Not implemented', 'غير منفذ')}</strong></div>
                    </>
                  ) : <p className="auto-op-hint">{t(locale, 'Select a workflow.', 'اختر سير عمل.')}</p>}
                </Panel>
              </div>
            </div>

            <section className="auto-tools-panel" aria-labelledby="auto-tools-title">
              <div className="auto-panel-head"><div><h2 id="auto-tools-title"><Sparkles aria-hidden="true" />{t(locale, 'Flow tools', 'أدوات التدفق')} ({formatCount(AUTOMATION_TOOLS.length)})</h2><p>{t(locale, 'Each tool opens a specialised draft/policy workbench. No action is executed.', 'تفتح كل أداة مساحة عمل مسودة/سياسة متخصصة. لا يُنفذ إجراء.')}</p></div></div>
              <div className="auto-tool-grid" data-testid="automation-tool-grid">{AUTOMATION_TOOLS.map(renderToolCard)}</div>
            </section>

            <div className="auto-lower-grid">
              <Panel title={t(locale, 'Dry-run journal', 'سجل المعاينات الجافة')} sub={t(locale, 'Deterministic records only. Executed workflows: 0.', 'سجلات حتمية فقط. سير العمل المنفذ: 0.')} icon={History} actions={<button type="button" className="sys-btn sys-btn-quiet" onClick={() => openTool('auto-run-history')} disabled={!snapshot}><History aria-hidden="true" />{t(locale, 'Open history', 'فتح السجل')}</button>}>
                {journal.length ? (
                  <div className="auto-history">
                    {journal.slice(0, 5).map((entry) => (
                      <button key={entry.id} type="button" className="auto-history-row" data-testid="automation-journal-row" onClick={() => openTool('auto-run-history')}>
                        <span>{formatTimestamp(entry.at, locale)}</span><span>{entry.workflowName}</span><span className="sys-mono">{entry.receipt}</span><Chip tone="info">{t(locale, 'Dry-run', 'معاينة جافة')}</Chip>
                      </button>
                    ))}
                  </div>
                ) : <div className="auto-empty"><History aria-hidden="true" /><strong>{t(locale, 'No dry-run yet', 'لا معاينة جافة بعد')}</strong><p>{t(locale, 'Dry-run a draft; no workflow action will execute.', 'شغّل معاينة جافة لمسودة؛ لن يُنفذ أي إجراء.')}</p></div>}
              </Panel>
              <Panel title={t(locale, 'Persistent actions', 'إجراءات دائمة')} icon={Lock}>
                <div className="auto-action-stack">
                  <button type="button" className="auto-action-card is-primary" onClick={() => void runDryRun()} disabled={!draft || controller.busy === 'dry-run'}><Play aria-hidden="true" /><span><strong>{t(locale, 'Dry-run current draft', 'معاينة المسودة الحالية')}</strong><em>{t(locale, 'Deterministic validation, zero execution', 'تحقق حتمي، صفر تنفيذ')}</em></span></button>
                  <button type="button" className="auto-action-card" onClick={() => void saveDraft()} disabled={!draft || controller.busy === 'save'}><Save aria-hidden="true" /><span><strong>{t(locale, 'Save new version', 'حفظ نسخة جديدة')}</strong><em>{t(locale, 'Local draft only', 'مسودة محلية فقط')}</em></span></button>
                  <button type="button" className="auto-action-card" onClick={() => void exportReport()} disabled={!snapshot || controller.busy === 'report'}><Download aria-hidden="true" /><span><strong>{t(locale, 'Export evidence report', 'تصدير تقرير الأدلة')}</strong><em>{t(locale, 'Read-only, redacted', 'للقراءة فقط، منقح')}</em></span></button>
                </div>
                <div className="auto-chip-row"><Chip tone="bad" icon={Lock}>{t(locale, 'No executor', 'لا منفذ')}</Chip><Chip tone="warn" icon={Clock3}>{t(locale, 'No background timer', 'لا مؤقت خلفي')}</Chip></div>
              </Panel>
            </div>

            <div className="sys-foot-strip">
              <span><Database aria-hidden="true" />{t(locale, 'Source', 'المصدر')}: local workflow store · Intl host timezone · Win32_Battery where available · Studio sources</span>
              <span><Lock aria-hidden="true" />{t(locale, 'No file delete, registry write, privileged action or external notification exists in Mission 13.', 'لا حذف ملفات أو كتابة تسجيل أو إجراء مرفوع أو إشعار خارجي في المهمة 13.')}</span>
              {snapshot?.warnings.length ? <span><AlertTriangle aria-hidden="true" />{formatCount(snapshot.warnings.length)} {t(locale, 'measured warning(s)', 'تحذير مقيس')}</span> : null}
            </div>

          </CommandCanvas>
          </main>

          <footer className="sys-actionbar auto-actionbar" data-testid="automation-actionbar">
            <div className="sys-actionbar-summary"><strong>{scanStatus}</strong><span className="sys-mono">{draft ? `${draft.name} · v${draft.version || 0} · ${draft.nodes.length} ${t(locale, 'nodes', 'عقدة')}` : t(locale, 'No workflow draft yet.', 'لا مسودة سير عمل بعد.')}</span><span className="sys-chip sys-chip-bad">{t(locale, '0 executed', '0 منفذ')}</span>{snapshot?.warnings.length ? <span className="sys-chip sys-chip-warn">{formatCount(snapshot.warnings.length)} {t(locale, 'warnings', 'تحذيرات')}</span> : null}</div>
            <div className="sys-actionbar-actions"><button type="button" className="sys-btn sys-btn-ghost" onClick={() => openTool('auto-run-history')} disabled={!snapshot}><History aria-hidden="true" />{t(locale, 'History', 'السجل')}</button><button type="button" className="sys-btn sys-btn-ghost" onClick={() => void runDryRun()} disabled={!draft || controller.busy === 'dry-run'}><Play aria-hidden="true" />{t(locale, 'Dry-run', 'معاينة جافة')}</button><button type="button" className="sys-btn sys-btn-primary" onClick={() => void controller.refreshSnapshot(true)} disabled={!snapshot || controller.refreshing || controller.scanning}><RefreshIcon />{t(locale, 'Refresh store', 'تحديث المخزن')}</button></div>
          </footer>
        </div>
      </div>

      {activeTool && snapshot ? <AutomationServiceWorkspace toolId={activeTool} locale={locale} controller={controller} onClose={closeTool} /> : null}
    </div>
  );
}

const emptyWorkflow: AutomationWorkflow = {
  id: 'wf-empty',
  name: '',
  schemaVersion: '1.0',
  version: 0,
  createdAt: '',
  updatedAt: '',
  enabled: false,
  trigger: { type: 'manual', cadence: 'daily', time: '09:00', days: [], intervalHours: 24, timezone: 'local', exclusions: [] },
  quietHours: { enabled: false, start: '22:00', end: '07:00', days: [], weekendRule: 'mute' },
  policy: { requireApproval: true, batteryThreshold: 20, acOnly: false, retentionDays: 30, notifyChannels: ['in-app'], severity: 'warning' },
  nodes: [],
  edges: [],
  mutation: 'none',
  execution: 'not-implemented',
};

function RefreshIcon() {
  return <Sparkles className="auto-refresh-icon" aria-hidden="true" />;
}
