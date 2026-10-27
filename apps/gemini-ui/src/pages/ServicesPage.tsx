import { CommandCanvas } from '../visual/CommandCanvas';
/**
 * KNOuX SmartOrganizer - Service Commander (Mission 12).
 *
 * Browser previews render an explicit native-required state. In Electron every
 * service, edge, event, host and operation preview comes from the read-only
 * ServicesBridge. No SCM start/stop/restart/startup-type write exists.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  FileText,
  GitBranch,
  History,
  Layers,
  List,
  Loader2,
  Lock,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Square,
  Wrench,
  X,
} from 'lucide-react';
import type { ServicesJournalEntry, ServicesToolId } from '../../shared/native-contracts';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXSidebar, KNOuXTitleBar } from '../components/shell/KNOuXShellComponents';
import { RISK_META, SERVICES_TOOLS, STATE_META, TOOL_BY_ID, type ServicesLocale } from '../services/catalog';
import {
  actionLabel,
  dependencyImpact,
  formatCount,
  formatTimestamp,
  startupMeta,
  t,
} from '../services/model';
import { useServices } from '../services/useServices';
import { ServicesServiceWorkspace } from '../services/ServicesServiceWorkspaces';
import {
  DependencyGraph,
  OperationDock,
  ServiceDossier,
  ServiceRegister,
  ServiceStateChip,
} from '../services/ui';
import { Chip, DataRows, Panel, downloadJson, cx } from '../system/ui';
import { OrbitalControl } from '../visual/OrbitalControl';
import '../services.css';

export interface ServicesPageProps {
  onNavigateSection?: (section: string) => void;
}

const AR = 'ar';

export function ServicesPage({ onNavigateSection }: ServicesPageProps) {
  const { navigateTo, locale: globalLocale, toggleLocale } = useNavigation();
  const [localLocale, setLocalLocale] = useState<ServicesLocale | null>(null);
  const locale: ServicesLocale = localLocale || (globalLocale === 'ar' ? 'ar' : 'en');
  const controller = useServices();
  const snapshot = controller.snapshot;

  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ServicesToolId | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!snapshot) {
      setSelectedName(null);
      return;
    }
    setSelectedName((current) => {
      if (current && snapshot.services.some((entry) => entry.name === current)) return current;
      return snapshot.services.find((entry) => String(entry.state).toLowerCase() === 'running' && !entry.protected)?.name || snapshot.services[0]?.name || null;
    });
  }, [snapshot]);

  useEffect(() => {
    if (activeTool && !snapshot) setActiveTool(null);
  }, [activeTool, snapshot]);

  const selected = useMemo(() => snapshot?.services.find((entry) => entry.name === selectedName) || null, [selectedName, snapshot]);
  const impact = useMemo(() => (snapshot && selected ? dependencyImpact(snapshot, selected) : null), [selected, snapshot]);
  const journal = controller.journal.length ? controller.journal : snapshot?.journal || [];

  const openTool = useCallback((id: ServicesToolId) => {
    if (!controller.snapshot) {
      controller.showNotice(t(locale, 'Run the measured Service Commander discovery before opening a tool.', 'شغّل اكتشاف Service Commander المقيس قبل فتح أداة.'));
      return;
    }
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setActiveTool(id);
  }, [controller, locale]);

  const closeTool = useCallback(() => {
    setActiveTool(null);
    window.setTimeout(() => triggerRef.current?.focus(), 30);
  }, []);

  const exportReport = useCallback(async () => {
    if (!snapshot) {
      controller.showNotice(t(locale, 'Run the measured discovery before exporting a report.', 'شغّل الاكتشاف المقيس قبل تصدير تقرير.'));
      return;
    }
    const report = await controller.loadReport(true);
    if (report) {
      const ok = downloadJson('knoux-service-commander-report.json', report);
      controller.showNotice(ok ? t(locale, 'Read-only service report exported.', 'صُدّر تقرير الخدمات للقراءة فقط.') : t(locale, 'The report export could not start.', 'تعذّر بدء تصدير التقرير.'));
    }
  }, [controller, locale, snapshot]);

  const navigate = (section: string) => {
    if (onNavigateSection) onNavigateSection(section);
    else navigateTo(section);
  };

  const scanStatus = controller.scanning
    ? t(locale, 'Measuring SCM evidence', 'جارٍ قياس أدلة SCM')
    : snapshot
      ? t(locale, 'Measured register ready', 'السجل المقيس جاهز')
      : controller.nativeAvailable
        ? t(locale, 'Awaiting measured discovery', 'بانتظار الاكتشاف المقيس')
        : t(locale, 'Native measurement required', 'القياس الأصلي مطلوب');

  const renderToolCard = (entry: (typeof SERVICES_TOOLS)[number]) => {
    const Icon = entry.icon;
    const state = STATE_META[entry.state];
    const risk = RISK_META[entry.risk];
    return (
      <button
        key={entry.id}
        type="button"
        className="svc-tool-card"
        data-testid={`services-tool-${entry.id}`}
        onClick={() => openTool(entry.id)}
      >
        <span className="svc-tool-index">{String(entry.index).padStart(2, '0')}</span>
        <span className="svc-tool-icon" style={{ color: entry.accent }} aria-hidden="true"><Icon /></span>
        <span className="svc-tool-copy">
          <strong>{locale === AR ? entry.ar : entry.en}</strong>
          <em>{entry.provider}</em>
        </span>
        <span className="svc-tool-badges">
          <Chip tone={state.tone}>{t(locale, state.en, state.ar)}</Chip>
          <Chip tone={risk.tone}>{t(locale, risk.en, risk.ar)}</Chip>
        </span>
      </button>
    );
  };

  return (
    <div className={cx('sys-viewport svc-viewport', locale === AR && 'is-rtl')} dir={locale === AR ? 'rtl' : 'ltr'}>
      <KNOuXTitleBar
        sectionName={t(locale, 'Services', 'الخدمات')}
        sectionSubtitle={t(locale, 'Service Commander · preview only', 'قائد الخدمات · معاينة فقط')}
        onNavigateHome={() => navigate('home')}
        searchPlaceholder={t(locale, 'Search measured services… (Ctrl+K)', 'ابحث في الخدمات المقيسة… (Ctrl+K)')}
        isArabic={locale === AR}
        onToggleArabic={() => { toggleLocale(); setLocalLocale(locale === AR ? 'en' : 'ar'); }}
        onOpenSettings={() => navigate('settings')}
      />

      {controller.notice ? (
        <div className="sys-toast sys-toast-good" role="status">
          <CheckCircle2 aria-hidden="true" />
          <span>{controller.notice}</span>
          <button type="button" onClick={controller.clearNotice} aria-label={t(locale, 'Dismiss', 'إغلاق')}><X aria-hidden="true" /></button>
        </div>
      ) : null}
      {controller.actionError ? (
        <div className="sys-toast sys-toast-bad" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div><strong>{controller.actionError.code}</strong><span>{controller.actionError.message}</span></div>
          <button type="button" onClick={controller.clearError} aria-label={t(locale, 'Dismiss', 'إغلاق')}><X aria-hidden="true" /></button>
        </div>
      ) : null}

      <div className="sys-shell">
        <KNOuXSidebar activeSection="services" onNavigate={navigate} isArabic={locale === AR} />
        <div className="sys-shell-main">
          <main className="sys-main knx-custom-scrollbar svc-main" data-testid="services-workspace">
          <CommandCanvas locale={locale}>
            <section className="sys-hero svc-hero" data-testid="services-hero">
              <div className="sys-hero-arc" aria-hidden="true">
                <svg viewBox="0 0 620 120" fill="none">
                  <defs>
                    <linearGradient id="svc-hero-wave" x1="0" y1="0" x2="620" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#f472b6" />
                      <stop offset="0.5" stopColor="#818cf8" />
                      <stop offset="1" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                  <path d="M8 62 C88 16, 150 108, 236 52 C322 -4, 386 100, 470 46 C534 6, 580 72, 616 52" stroke="url(#svc-hero-wave)" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M8 52 C76 88, 156 16, 240 78 C324 136, 400 24, 486 72 C548 108, 592 28, 616 56" stroke="url(#svc-hero-wave)" strokeWidth="1.4" strokeDasharray="4 5" opacity="0.55" />
                </svg>
              </div>
              <div className="sys-hero-copy">
                <span className="sys-hero-eyebrow">{t(locale, 'SERVICE COMMANDER · READ-ONLY · NO SCM WRITES', 'قائد الخدمات · للقراءة فقط · بلا كتابة SCM')}</span>
                <h1>{t(locale, 'Service', 'قائد')} <span>{t(locale, 'Commander', 'الخدمات')}</span></h1>
                <p>{t(locale, 'Inspect Windows services through the measured SCM register, understand dependency impact and review every operation before authorizing it.', 'افحص خدمات Windows عبر سجل SCM المقيس، وافهم أثر الاعتماديات، وراجع كل عملية قبل اعتمادها.')}</p>
                <div className="sys-hero-chips">
                  <Chip tone={snapshot ? 'good' : controller.scanning ? 'info' : 'muted'} icon={Sparkles}>{scanStatus}</Chip>
                  <Chip tone="info" icon={List}>{formatCount(SERVICES_TOOLS.length)} {t(locale, 'service tools', 'أداة خدمات')}</Chip>
                  <Chip tone={snapshot?.elevation.isAdmin === true ? 'warn' : 'muted'} icon={Lock}>{snapshot ? (snapshot.elevation.isAdmin === true ? t(locale, 'Elevated', 'مرفوع') : t(locale, 'Standard user', 'مستخدم عادي')) : t(locale, 'Privilege not measured', 'الصلاحية غير مقيسة')}</Chip>
                  <Chip tone="bad" icon={ShieldAlert}>{t(locale, '0 SCM operations executed', '0 عملية SCM منفذة')}</Chip>
                  {snapshot ? <Chip tone="violet" icon={Database}>{t(locale, 'receipt', 'إيصال')} {snapshot.receipt.slice(0, 12)}</Chip> : null}
                </div>
                <div className="sys-hero-actions">
                  <button type="button" className={cx('sys-btn', controller.scanning ? 'sys-btn-danger' : 'sys-btn-primary')} onClick={() => (controller.scanning ? void controller.cancelScan() : void controller.startScan())} disabled={!controller.nativeAvailable || controller.cancelling}>
                    {controller.scanning ? <X aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                    {controller.scanning ? t(locale, 'Cancel discovery', 'إلغاء الاكتشاف') : snapshot ? t(locale, 'Re-discover', 'إعادة الاكتشاف') : t(locale, 'Start measured discovery', 'بدء الاكتشاف المقيس')}
                  </button>
                  <button type="button" className="sys-btn sys-btn-ghost" onClick={() => void controller.refreshSnapshot(true)} disabled={!snapshot || controller.refreshing || controller.scanning}>
                    <RefreshCw aria-hidden="true" className={controller.refreshing ? 'sys-spin' : undefined} />{t(locale, 'Refresh register', 'تحديث السجل')}
                  </button>
                  <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void exportReport()} disabled={!snapshot || controller.busy === 'report'}>
                    <Download aria-hidden="true" />{t(locale, 'Export report', 'تصدير التقرير')}
                  </button>
                </div>
              </div>
              <div className="svc-hero-orbit">
                <OrbitalControl
                  title={t(locale, 'Service Commander', 'قائد الخدمات')}
                  subtitle={t(locale, 'Review the measured SCM register', 'راجع سجل SCM المقيس')}
                  eyebrow={t(locale, 'Service Commander scopes', 'نطاقات قائد الخدمات')}
                  state={controller.scanning ? 'loading' : controller.nativeAvailable ? 'ready' : 'unavailable'}
                  disabled={!snapshot}
                  onActivate={() => openTool('services-inventory')}
                  tools={[
                    { id: 'running', label: t(locale, 'Running', 'تعمل'), icon: PlayCircle, onClick: () => openTool('services-inventory'), hint: t(locale, 'Measured running states', 'حالات التشغيل المقيسة') },
                    { id: 'stopped', label: t(locale, 'Stopped', 'متوقفة'), icon: Square, onClick: () => openTool('services-search'), hint: t(locale, 'Status query, read-only', 'استعلام الحالة، للقراءة فقط') },
                    { id: 'dependencies', label: t(locale, 'Dependencies', 'الاعتماديات'), icon: GitBranch, onClick: () => openTool('services-dependencies'), hint: t(locale, 'Measured dependency edges', 'حواف اعتماديات مقيسة') },
                    { id: 'recovery', label: t(locale, 'Recovery', 'الاستعادة'), icon: RotateCcw, onClick: () => openTool('services-diagnose'), hint: t(locale, 'Fault diagnostics, no repair runs', 'تشخيص الأعطال، دون إصلاح') },
                    { id: 'events', label: t(locale, 'Events', 'الأحداث'), icon: History, onClick: () => openTool('services-state-history'), hint: t(locale, 'Bounded SCM events', 'أحداث SCM محدودة') },
                    { id: 'startup-type', label: t(locale, 'Startup Type', 'نوع البدء'), icon: SlidersHorizontal, onClick: () => openTool('services-config'), hint: t(locale, 'Policy preview only', 'معاينة السياسة فقط') },
                  ]}
                />
              </div>
              <aside className="sys-source-card svc-source-card" data-testid="services-source-card">
                <span className={cx('sys-source-ring', snapshot ? 'is-live' : controller.scanning ? 'is-scanning' : 'is-idle')} aria-hidden="true"><span /></span>
                <div className="sys-source-copy">
                  <span>{t(locale, 'Evidence source', 'مصدر الأدلة')}</span>
                  <strong>KNOuX ServicesBridge v1</strong>
                  <em>{scanStatus}</em>
                  <em>{snapshot ? formatTimestamp(snapshot.generatedAt, locale) : controller.nativeAvailable ? t(locale, 'Bounded read-only discovery', 'اكتشاف محدود للقراءة فقط') : t(locale, 'Browser preview', 'معاينة متصفح')}</em>
                </div>
                <div className="sys-source-badges">
                  <span className="sys-source-badge">{t(locale, 'Read-only', 'للقراءة فقط')}</span>
                  <span className="sys-source-badge">{t(locale, 'No auto elevation', 'بلا رفع تلقائي')}</span>
                </div>
              </aside>
            </section>

            {!controller.nativeAvailable ? (
              <div className="sys-banner is-required" data-testid="services-native-required">
                <Lock aria-hidden="true" />
                <div><strong>{t(locale, 'Native measurement required', 'القياس الأصلي مطلوب')}</strong><p>{t(locale, 'This is a browser preview. The read-only ServicesBridge is unavailable, so no service, edge, event, host or plan is substituted. Open the native Electron app to measure this machine.', 'هذه معاينة متصفح. جسر ServicesBridge للقراءة فقط غير متاح، لذلك لا تُستبدل أي خدمة أو حافة أو حدث أو مضيف أو خطة. افتح تطبيق Electron الأصلي لقياس هذا الجهاز.')}</p></div>
              </div>
            ) : (
              <div className="sys-banner is-measured" data-testid="services-native-banner">
                <ShieldCheck aria-hidden="true" />
                <div><strong>{t(locale, 'Measured Service Commander', 'قائد الخدمات المقيس')}</strong><p>{snapshot ? `${formatCount(snapshot.summary.total)} ${t(locale, 'services', 'خدمة')} · ${formatCount(snapshot.summary.running)} ${t(locale, 'running', 'تعمل')} · ${formatCount(snapshot.summary.protected)} ${t(locale, 'protected', 'محمية')} · ${t(locale, 'mutation', 'التغيير')}: none` : scanStatus}</p></div>
                <span className="sys-banner-chip">{snapshot ? t(locale, 'MEASURED', 'مقيس') : t(locale, 'MEASURING', 'جارٍ القياس')}</span>
              </div>
            )}

            {controller.scanning ? (
              <div className="sys-scan-progress" data-testid="services-scan-progress">
                <div className="sys-scan-progress-head"><span><Loader2 aria-hidden="true" className="sys-spin" />{t(locale, 'Bounded SCM discovery in progress', 'اكتشاف SCM المحدود قيد التنفيذ')}</span><em>{formatCount(controller.session?.progress || 0)}%</em></div>
                <div className="sys-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={controller.session?.progress || 0}><span style={{ width: `${Math.max(2, Math.min(100, controller.session?.progress || 0))}%` }} /></div>
                <div className="sys-scan-stages">{(controller.session?.stages || []).map((stage) => <span key={stage.key} className={`sys-scan-stage is-${stage.status}`} title={stage.provider}>{locale === AR ? stage.labelAr : stage.labelEn}</span>)}</div>
              </div>
            ) : null}

            <div className="sys-kpi-row svc-kpi-row">
              {[
                { key: 'total', label: t(locale, 'Services', 'الخدمات'), value: snapshot ? formatCount(snapshot.summary.total) : '—', note: t(locale, 'Measured SCM rows', 'صفوف SCM مقيسة'), icon: List, tone: '' },
                { key: 'running', label: t(locale, 'Running', 'تعمل'), value: snapshot ? formatCount(snapshot.summary.running) : '—', note: t(locale, 'Measured state', 'حالة مقيسة'), icon: CheckCircle2, tone: 'is-good' },
                { key: 'protected', label: t(locale, 'Protected', 'محمية'), value: snapshot ? formatCount(snapshot.summary.protected) : '—', note: t(locale, 'Control denied by policy', 'التحكم مرفوض بالسياسة'), icon: ShieldAlert, tone: 'is-bad' },
                { key: 'automatic', label: t(locale, 'Automatic', 'تلقائي'), value: snapshot ? formatCount(snapshot.summary.automatic) : '—', note: t(locale, 'Non-delayed automatic', 'تلقائي غير مؤجل'), icon: Layers, tone: 'is-cyan' },
                { key: 'events', label: t(locale, 'SCM events', 'أحداث SCM'), value: snapshot ? formatCount(snapshot.events.length) : '—', note: snapshot?.eventCoverage.status || t(locale, 'not measured', 'غير مقيس'), icon: FileText, tone: 'is-warn' },
                { key: 'hosts', label: t(locale, 'svchost hosts', 'مضيفات svchost'), value: snapshot ? formatCount(snapshot.svchost.length) : '—', note: t(locale, 'Shared process groups', 'مجموعات عمليات مشتركة'), icon: RefreshCw, tone: 'is-violet' },
              ].map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <button key={kpi.key} type="button" className={cx('sys-instrument svc-kpi', kpi.tone)} onClick={() => openTool(kpi.key === 'events' ? 'services-state-history' : kpi.key === 'hosts' ? 'services-perf' : kpi.key === 'protected' ? 'services-protected' : 'services-inventory')} data-testid={`services-kpi-${kpi.key}`}>
                    <span className="svc-kpi-head"><span className="svc-kpi-icon"><Icon aria-hidden="true" /></span><span>{kpi.label}</span></span>
                    <strong dir="ltr" data-testid={`services-kpi-${kpi.key}-value`}>{kpi.value}</strong>
                    <em>{kpi.note}</em>
                  </button>
                );
              })}
            </div>

            <div className="svc-main-grid">
              <Panel className="svc-register-panel" title={t(locale, 'SCM service register', 'سجل خدمات SCM')} sub={snapshot ? `${formatCount(snapshot.summary.total)} ${t(locale, 'measured services', 'خدمة مقيسة')}` : t(locale, 'Awaiting measured discovery', 'بانتظار الاكتشاف المقيس')} icon={List} bodyClassName="sys-panel-body-flush">
                {snapshot ? (
                  <ServiceRegister locale={locale} services={snapshot.services} selectedName={selectedName} onSelect={setSelectedName} />
                ) : <div className="svc-empty"><Lock aria-hidden="true" /><strong>{t(locale, 'No SCM register yet', 'لا سجل SCM بعد')}</strong><p>{scanStatus}</p></div>}
              </Panel>
              <div className="svc-main-rail">
                <OperationDock locale={locale} snapshot={snapshot || emptySnapshot} controller={controller} service={selected} mode="both" />
                <Panel
                  className="svc-mini-journal"
                  title={t(locale, 'Recent service activity', 'أحدث نشاط للخدمات')}
                  sub={t(locale, 'Previews only · 0 executed.', 'معاينات فقط · 0 منفذ.')}
                  icon={History}
                  actions={<button type="button" className="sys-btn sys-btn-quiet" onClick={() => openTool('services-undo')} disabled={!snapshot}>{t(locale, 'Journal', 'السجل')}<ChevronRight aria-hidden="true" /></button>}
                >
                  <div data-testid="services-mini-journal">
                    {journal.length ? journal.slice(0, 2).map((entry: ServicesJournalEntry) => (
                      <button key={entry.id} type="button" className="svc-mini-row" onClick={() => openTool('services-undo')}>
                        <span>{entry.displayName || entry.serviceName}</span>
                        <em>{actionLabel(entry.action, locale)} · {formatTimestamp(entry.at, locale)}</em>
                        <Chip tone={entry.kind === 'blocked-preview' ? 'bad' : 'info'}>{t(locale, 'Preview', 'معاينة')}</Chip>
                      </button>
                    )) : (
                      <p className="svc-op-hint">{t(locale, 'No preview staged yet. Stage one above; it is recorded without executing a service change.', 'لا معاينة مُهيَّأة بعد. هيّئ واحدة أعلاه؛ تُسجّل دون تنفيذ تغيير خدمة.')}</p>
                    )}
                  </div>
                </Panel>
                <Panel className="svc-dossier-panel" title={t(locale, 'Service dossier', 'ملف الخدمة')} sub={selected?.name} icon={Search}>
                  <ServiceDossier locale={locale} snapshot={snapshot || emptySnapshot} service={selected} />
                </Panel>
              </div>
            </div>

            {snapshot ? (
              <Panel className="svc-graph-panel" title={t(locale, 'Dependency network', 'شبكة الاعتماديات')} sub={selected ? `${selected.name} · ${impact?.upstream.length || 0} upstream · ${impact?.directDependents.length || 0} downstream · ${formatCount(snapshot.edges.length)} ${t(locale, 'measured edges', 'حافة مقيسة')}` : undefined} icon={GitBranch}>
                <div data-testid="services-dependency-graph"><DependencyGraph locale={locale} snapshot={snapshot} service={selected} onSelect={setSelectedName} /></div>
              </Panel>
            ) : null}

            <section className="svc-tools-panel" aria-labelledby="svc-tools-title">
              <div className="svc-panel-head">
                <div><h2 id="svc-tools-title"><Wrench aria-hidden="true" />{t(locale, 'Service tools', 'أدوات الخدمات')} ({formatCount(SERVICES_TOOLS.length)})</h2><p>{t(locale, 'Each tool opens a specialised measured workbench. No operation is executed.', 'تفتح كل أداة مساحة عمل مقيسة متخصصة. لا تُنفذ أي عملية.')}</p></div>
              </div>
              <div className="svc-tool-grid" data-testid="services-tool-grid">
                {SERVICES_TOOLS.map(renderToolCard)}
              </div>
            </section>

            <div className="svc-lower-grid">
              <Panel title={t(locale, 'Service activity journal', 'سجل نشاط الخدمات')} sub={t(locale, 'Immutable previews only. Executed operations: 0.', 'معاينات ثابتة فقط. العمليات المنفذة: 0.')} icon={History} actions={<button type="button" className="sys-btn sys-btn-quiet" onClick={() => openTool('services-undo')} disabled={!snapshot}><History aria-hidden="true" />{t(locale, 'Open journal', 'فتح السجل')}</button>}>
                {journal.length ? (
                  <div className="svc-history">
                    <div className="svc-history-head"><span>{t(locale, 'Date & time', 'التاريخ والوقت')}</span><span>{t(locale, 'Service', 'الخدمة')}</span><span>{t(locale, 'Action', 'الإجراء')}</span><span>{t(locale, 'Result', 'النتيجة')}</span></div>
                    {journal.slice(0, 5).map((entry: ServicesJournalEntry) => (
                      <button key={entry.id} type="button" className="svc-history-row" data-testid="services-journal-row" onClick={() => openTool('services-undo')}>
                        <span>{formatTimestamp(entry.at, locale)}</span>
                        <span>{entry.displayName || entry.serviceName}</span>
                        <span>{actionLabel(entry.action, locale)}</span>
                        <span><Chip tone={entry.kind === 'blocked-preview' ? 'bad' : 'info'}>{t(locale, 'Preview only', 'معاينة فقط')}</Chip></span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="svc-empty"><FileText aria-hidden="true" /><strong>{t(locale, 'No service preview yet', 'لا معاينة خدمة بعد')}</strong><p>{t(locale, 'Stage an operation preview. The journal records the review and keeps executed operations at zero.', 'هيّئ معاينة عملية. يسجل السجل المراجعة ويبقي العمليات المنفذة صفرًا.')}</p></div>
                )}
              </Panel>
              <Panel title={t(locale, 'Persistent actions', 'إجراءات دائمة')} icon={Lock}>
                <div className="svc-action-stack">
                  <button type="button" className="svc-action-card is-primary" onClick={() => openTool('services-control')} disabled={!snapshot} data-testid="services-review-selected">
                    <FileText aria-hidden="true" /><span><strong>{t(locale, 'Review selected service', 'مراجعة الخدمة المحددة')}</strong><em>{selected ? selected.displayName || selected.name : t(locale, 'Select a service first', 'اختر خدمة أولًا')}</em></span><ArrowRight aria-hidden="true" />
                  </button>
                  <button type="button" className="svc-action-card" onClick={() => openTool('services-dependencies')} disabled={!snapshot}>
                    <GitBranch aria-hidden="true" /><span><strong>{t(locale, 'Open dependency map', 'فتح خريطة الاعتماديات')}</strong><em>{impact ? `${impact.upstream.length} upstream · ${impact.directDependents.length} downstream` : t(locale, 'No service selected', 'لا خدمة محددة')}</em></span><ChevronRight aria-hidden="true" />
                  </button>
                  <button type="button" className="svc-action-card" onClick={() => void exportReport()} disabled={!snapshot || controller.busy === 'report'}>
                    <Download aria-hidden="true" /><span><strong>{t(locale, 'Export service evidence', 'تصدير أدلة الخدمات')}</strong><em>{t(locale, 'Measured report, redacted by default', 'تقرير مقيس منقح افتراضيًا')}</em></span><ArrowRight aria-hidden="true" />
                  </button>
                </div>
                <div className="svc-chip-row">
                  <Chip tone="bad" icon={Lock}>{t(locale, 'Start/stop/restart not executable', 'البدء/الإيقاف/إعادة التشغيل غير قابل للتنفيذ')}</Chip>
                  <Chip tone="warn" icon={ShieldAlert}>{t(locale, 'Protected deny by policy', 'منع الحماية بالسياسة')}</Chip>
                </div>
              </Panel>
            </div>

            <div className="sys-foot-strip">
              <span><Database aria-hidden="true" />{t(locale, 'Source', 'المصدر')}: Win32_Service · Win32_Process · System event log · local preview journal</span>
              <span><Lock aria-hidden="true" />{t(locale, 'No StartService/StopService/ChangeServiceConfig or sc.exe channel exists in Mission 12.', 'لا توجد قناة StartService/StopService/ChangeServiceConfig أو sc.exe في المهمة 12.')}</span>
              {snapshot?.warnings.length ? <span><AlertTriangle aria-hidden="true" />{formatCount(snapshot.warnings.length)} {t(locale, 'measured warning(s)', 'تحذير مقيس')}</span> : null}
            </div>

          </CommandCanvas>
          </main>

          <footer className="sys-actionbar svc-actionbar" data-testid="services-actionbar">
            <div className="sys-actionbar-summary">
              <strong>{scanStatus}</strong>
              <span className="sys-mono">{snapshot ? `${formatCount(snapshot.summary.total)} ${t(locale, 'services', 'خدمة')} · ${formatCount(snapshot.summary.protected)} ${t(locale, 'protected', 'محمية')} · ${formatCount(snapshot.events.length)} ${t(locale, 'events', 'حدث')}` : t(locale, 'No measured service register yet.', 'لا سجل خدمات مقيس بعد.')}</span>
              <span className="sys-chip sys-chip-bad">{t(locale, '0 executed', '0 منفذ')}</span>
              {snapshot?.warnings.length ? <span className="sys-chip sys-chip-warn">{formatCount(snapshot.warnings.length)} {t(locale, 'warnings', 'تحذيرات')}</span> : null}
            </div>
            <div className="sys-actionbar-actions">
              <button type="button" className="sys-btn sys-btn-ghost" onClick={() => openTool('services-undo')} disabled={!snapshot}><History aria-hidden="true" />{t(locale, 'Journal', 'السجل')}</button>
              <button type="button" className="sys-btn sys-btn-ghost" onClick={() => openTool('services-control')} disabled={!snapshot}><FileText aria-hidden="true" />{t(locale, 'Review selected', 'مراجعة المحدد')}</button>
              <button type="button" className="sys-btn sys-btn-primary" onClick={() => void controller.refreshSnapshot(true)} disabled={!snapshot || controller.refreshing || controller.scanning}><RefreshCw aria-hidden="true" className={controller.refreshing ? 'sys-spin' : undefined} />{t(locale, 'Refresh evidence', 'تحديث الأدلة')}</button>
            </div>
          </footer>
        </div>
      </div>

      {activeTool && snapshot ? <ServicesServiceWorkspace toolId={activeTool} locale={locale} controller={controller} onClose={closeTool} /> : null}
    </div>
  );
}

const emptySnapshot = {
  contract: 'services.v1',
  generatedAt: '',
  readOnly: true,
  mutation: 'none',
  fixtureFallback: false,
  services: [],
  total: 0,
  truncated: false,
  elevation: { isAdmin: null },
  summary: { total: 0, running: 0, stopped: 0, automatic: 0, manual: 0, disabled: 0, delayed: 0, protected: 0, thirdParty: 0 },
  edges: [],
  events: [],
  eventCoverage: { status: 'unavailable', count: 0, days: 7, reason: null },
  svchost: [],
  journal: [],
  gates: [],
  coverage: [],
  warnings: [],
  sources: [],
  receipt: '',
} as never;
