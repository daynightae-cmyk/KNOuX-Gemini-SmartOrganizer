import React, { useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowRight, Check, ChevronRight, Database, FileText, Folder, Gauge,
  Grid2X2, HardDrive, Monitor, Rocket, Search, Settings, Shield, Sparkles, Trash2,
  Wrench, X, Zap,
} from 'lucide-react';
import { KnouxOrbit } from '../../visual/KnouxOrbit';
import { ServicePipeline } from '../../visual/ServicePipeline';
import { KNOuXSidebar, KNOuXTitleBar, KNOUX_ASSISTANT_TOGGLE_EVENT } from '../shell/KNOuXShellComponents';
import type { AppTheme } from '../../context/NavigationContext';
import type { HomeSnapshot } from '../../home/snapshot';
import { deriveActivities, deriveVolumes, formatBytes } from '../../home/derive';
import './home-command.css';

interface Props {
  isArabic: boolean;
  theme: AppTheme;
  onNavigate: (page: string) => void;
  live: HomeSnapshot & { refresh: () => Promise<void> };
  /** The real federated workspace + measured-inventory palette owned by HomePage. */
  query: string;
  onQueryChange: (value: string) => void;
  onOpenCommands: () => void;
}

/**
 * KNOuX Home — command-centre composition.
 *
 * Geometry follows the single approved Home picture in the repository
 * (references/day/00_home-command-center.png, manifest order 0). No night Home
 * picture was ever installed, so the same geometry is rendered with the
 * canonical night tokens rather than inventing a second reference.
 *
 * The reference's numbers are design examples. Nothing here fabricates a
 * measurement: every value is either a real read-only observation, or it is
 * shown as unmeasured with the owning workspace as the next step.
 */

const t = (isArabic: boolean, en: string, ar: string) => (isArabic ? ar : en);

const deck = [
  { id: 'smart_scan', icon: Search, en: 'Smart Scan', ar: 'الفحص الذكي', subEn: 'Analyze and clean', subAr: 'فحص وتنظيف' },
  { id: 'files', icon: Folder, en: 'Organize Files', ar: 'تنظيم الملفات', subEn: 'Find and structure', subAr: 'بحث وتنظيم' },
  { id: 'applications', icon: Grid2X2, en: 'Applications', ar: 'التطبيقات', subEn: 'Manage apps', subAr: 'إدارة التطبيقات' },
  { id: 'storage', icon: Database, en: 'Storage', ar: 'التخزين', subEn: 'Explore and analyze', subAr: 'استكشاف وتحليل' },
  { id: 'cleanup', icon: Trash2, en: 'Cleanup', ar: 'التنظيف', subEn: 'Free up space', subAr: 'تحرير المساحة' },
  { id: 'startup', icon: Rocket, en: 'Startup Control', ar: 'بدء التشغيل', subEn: 'Optimize boot', subAr: 'تحسين الإقلاع' },
  { id: 'system', icon: Activity, en: 'System Live Pulse', ar: 'نبض النظام', subEn: 'Monitor health', subAr: 'مراقبة الحالة' },
  { id: 'repair', icon: Wrench, en: 'Repair Lab', ar: 'معمل الإصلاح', subEn: 'Diagnose and fix', subAr: 'تشخيص وإصلاح' },
] as const;

export function ApprovedHomeScreen({ isArabic, theme, onNavigate, live, query, onQueryChange, onOpenCommands }: Props) {
  const resolvedTheme = theme;
  const [modal, setModal] = useState<'notifications' | 'customize' | 'scan' | null>(null);
  const [overviewTab, setOverviewTab] = useState<'health' | 'storage'>('health');
  const [accessTab, setAccessTab] = useState<'files' | 'activity'>('files');

  const go = (target: string) => {
    if (target === 'intro') window.dispatchEvent(new Event('knoux:replay-entry'));
    else if (target === 'assistant') window.dispatchEvent(new Event(KNOUX_ASSISTANT_TOGGLE_EVENT));
    else onNavigate(target);
  };

  const observed = (domain: keyof HomeSnapshot['observations']) => live.observations[domain];
  const stamp = (domain: keyof HomeSnapshot['observations']) => {
    const o = observed(domain);
    if (!o) return t(isArabic, 'Not measured', 'غير مقيس');
    return t(isArabic, 'Observed', 'قياس') + ' ' + new Date(o.observedAt).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-GB')
      + (o.stale ? ' · STALE' : '') + (o.partial ? ' · PARTIAL' : '');
  };

  const volumes = deriveVolumes(live);
  const drive = volumes[0];
  // Home's own aggregation of the measured sources: scan history, automation
  // journal and organization receipts, ordered by real timestamps. This is the
  // accepted local-aggregation contract, asserted by test:home.
  const activities = deriveActivities(live);
  const completedScan = [...live.scans]
    .filter((x) => ['complete', 'partial'].includes(x.status))
    .sort((a, b) => (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt))[0];
  const score = completedScan?.healthScore;
  const cpu = live.system?.cpuLoadPercent;
  const memory = live.system?.memoryUsedPercent;

  /**
   * Six KPI cards, in the reference's positions. A card is `ready` only when its
   * own provider actually answered; otherwise it says so and links to the
   * workspace that owns the measurement. No card carries an invented number.
   */
  const kpis = [
    {
      id: 'health', icon: Gauge, label: t(isArabic, 'System Health', 'صحة النظام'),
      value: score == null ? '—' : String(score), unit: score == null ? '' : '/ 100',
      state: score == null ? 'unmeasured' : 'ready', target: 'system',
      detail: score == null ? t(isArabic, 'No measured score', 'لا درجة مقيسة') : t(isArabic, 'From the last scan', 'من آخر فحص'),
    },
    {
      id: 'indexes', icon: FileText, label: t(isArabic, 'Authorized Indexes', 'الفهارس المصرح بها'),
      value: observed('sources') ? String(live.sources.length) : '—',
      unit: observed('sources') && live.sources.length ? t(isArabic, 'roots', 'جذور') : '',
      state: observed('sources') ? (live.sources.length ? 'ready' : 'unmeasured') : 'unmeasured', target: 'files',
      detail: live.sources.length ? t(isArabic, 'Searchable sources', 'مصادر قابلة للبحث') : t(isArabic, 'No folder authorized', 'لا مجلد مصرح به'),
    },
    {
      id: 'reclaim', icon: HardDrive, label: t(isArabic, 'Space Reclaimable', 'المساحة القابلة للتحرير'),
      value: '—', unit: '',
      state: 'unmeasured', target: 'cleanup',
      detail: t(isArabic, 'Run Cleanup to measure', 'شغّل التنظيف للقياس'),
    },
    {
      id: 'automations', icon: Zap, label: t(isArabic, 'Workflow Drafts', 'مسودات الأتمتة'),
      value: observed('workflows') ? String(live.workflows.length) : '—',
      unit: observed('workflows') && live.workflows.length ? t(isArabic, 'drafts', 'مسودة') : '',
      state: observed('workflows') ? 'ready' : 'unmeasured', target: 'automation',
      detail: t(isArabic, 'Local drafts, none scheduled', 'مسودات محلية بلا جدولة'),
    },
    {
      id: 'apps', icon: Grid2X2, label: t(isArabic, 'Apps Monitored', 'التطبيقات المرصودة'),
      value: live.apps ? String(live.apps.kpis.installed) : '—',
      unit: live.apps ? t(isArabic, 'installed', 'مثبت') : '',
      state: live.apps ? 'ready' : 'unmeasured', target: 'applications',
      detail: live.apps ? `${live.apps.kpis.packaged} ${t(isArabic, 'packaged', 'مغلّفة')} · ${live.apps.kpis.publishers} ${t(isArabic, 'publishers', 'ناشرين')}` : t(isArabic, 'Not measured', 'غير مقيس'),
    },
    {
      id: 'services', icon: Shield, label: t(isArabic, 'Services Running', 'الخدمات العاملة'),
      value: live.services ? String(live.services.running) : '—',
      unit: live.services ? `/ ${live.services.total}` : '',
      state: live.services ? 'ready' : 'unmeasured', target: 'services',
      detail: live.services ? `${live.services.protectedCount} ${t(isArabic, 'protected', 'محمية')}` : t(isArabic, 'Not measured', 'غير مقيس'),
    },
  ];

  /**
   * The reference's insight card. The recommendation is derived from what was
   * actually measured; with no measured basis it says so instead of guessing.
   */
  const insight = (() => {
    if (!observed('sources') && !observed('system') && !observed('apps')) {
      return {
        lead: t(isArabic, 'No measured basis yet', 'لا أساس مقيس بعد'),
        note: t(isArabic,
          'Home reads only existing native observations. Nothing has been measured in this session, so no recommendation is offered.',
          'تقرأ الصفحة الرئيسية القياسات الأصلية الموجودة فقط. لم يُقَس شيء في هذه الجلسة، لذا لا تُقدَّم توصية.'),
        action: t(isArabic, 'Open Smart Scan', 'افتح الفحص الذكي'), target: 'smart_scan',
      };
    }
    if (live.sources.length === 0) {
      return {
        lead: t(isArabic, 'Authorize a folder to organize', 'صرّح بمجلد للتنظيم'),
        note: t(isArabic,
          'Machine measurements are available, but no file index is authorized, so file and duplicate findings cannot be measured.',
          'قياسات الجهاز متاحة، لكن لا فهرس ملفات مصرح به، لذا لا يمكن قياس النتائج أو التكرارات.'),
        action: t(isArabic, 'Choose a folder', 'اختر مجلدًا'), target: 'files',
      };
    }
    if (completedScan && completedScan.findingsCount > 0) {
      return {
        lead: `${completedScan.findingsCount} ${t(isArabic, 'measured findings to review', 'نتيجة مقيسة للمراجعة')}`,
        note: t(isArabic,
          'The last measured scan reported findings. Review them with their evidence before any action; nothing is applied from Home.',
          'أبلغ آخر فحص مقيس عن نتائج. راجعها مع أدلتها قبل أي إجراء؛ لا يُطبَّق شيء من الصفحة الرئيسية.'),
        action: t(isArabic, 'Review findings', 'راجع النتائج'), target: 'smart_scan',
      };
    }
    return {
      lead: t(isArabic, 'Measurements are current', 'القياسات محدّثة'),
      note: t(isArabic,
        'No pending finding was reported by the measured scan history. Refresh to take a new observation.',
        'لم تُبلّغ سجلات الفحص المقيسة عن نتيجة معلّقة. حدّث لأخذ قياس جديد.'),
      action: t(isArabic, 'Refresh observations', 'حدّث القياسات'), target: 'refresh',
    };
  })();

  /**
   * Pending safe actions: real receipts and real scan findings only. An empty
   * list is an honest empty state, not a placeholder row.
   */
  const pending = [
    // An organization receipt is the only real staged effect Home can show. Its
    // fields come from the native OperationReceipt contract; nothing is invented.
    ...live.receipts.filter((r) => r.status !== 'undone').slice(0, 4).map((r) => ({
      id: `receipt-${r.operationId}`,
      title: `${r.mode} · ${r.completedFiles} ${t(isArabic, 'files completed', 'ملفًا مكتملًا')}`,
      detail: `${r.status}${r.failedFiles ? ` · ${r.failedFiles} ${t(isArabic, 'failed', 'فاشل')}` : ''} · ${r.undoAvailable ? t(isArabic, 'undo available', 'التراجع متاح') : t(isArabic, 'no undo', 'لا تراجع')}`,
      target: 'studio',
    })),
    ...(completedScan && completedScan.findingsCount > 0 ? [{
      id: `scan-${completedScan.id}`,
      title: `${completedScan.findingsCount} ${t(isArabic, 'findings awaiting review', 'نتيجة بانتظار المراجعة')}`,
      detail: `${completedScan.mode} · ${completedScan.status}`,
      target: 'smart_scan',
    }] : []),
  ];

  const orbitTools = [
    { id: 'smart_scan', label: t(isArabic, 'Smart Scan', 'الفحص الذكي'), icon: Search, onClick: () => go('smart_scan') },
    { id: 'files', label: t(isArabic, 'Files', 'الملفات'), icon: Folder, onClick: () => go('files') },
    { id: 'applications', label: t(isArabic, 'Applications', 'التطبيقات'), icon: Grid2X2, onClick: () => go('applications') },
    { id: 'system', label: t(isArabic, 'System', 'النظام'), icon: Monitor, onClick: () => go('system') },
    { id: 'storage', label: t(isArabic, 'Storage', 'التخزين'), icon: Database, onClick: () => go('storage') },
    { id: 'automation', label: t(isArabic, 'Automation', 'الأتمتة'), icon: Zap, onClick: () => go('automation') },
  ];

  return (
    <div
      className="home-command"
      data-testid="home-workspace"
      data-home-sample={false}
      dir={isArabic ? 'rtl' : 'ltr'}
      data-theme-mode={resolvedTheme === 'light' ? 'day' : 'night'}
    >
      <KNOuXTitleBar
        sectionName={t(isArabic, 'Home', 'الرئيسية')}
        sectionSubtitle={t(isArabic, 'Command Center', 'مركز التحكم')}
        searchPlaceholder={t(isArabic, 'Search workspaces, files, tools, or ask KNOuX… (Ctrl+K)', 'ابحث في مساحات العمل والملفات والأدوات… (Ctrl+K)')}
        searchQuery={query}
        onSearchChange={onQueryChange}
        isArabic={isArabic}
        onToggleArabic={() => go('settings')}
        onOpenNotifications={() => setModal('notifications')}
      />

      <div className="home-command-body">
        <KNOuXSidebar activeSection="home" onNavigate={go} isArabic={isArabic} />

        <main className="home-command-main">
          <section className="home-hero">
            <div className="home-hero-copy">
              <h1>
                {t(isArabic, 'Home Command', 'مركز تحكم')} <em>{t(isArabic, 'Center', 'الرئيسية')}</em>
              </h1>
              <p className="home-hero-lede">
                {t(isArabic,
                  'Your complete system. Organized, optimized and in control — from real read-only measurements on this device only.',
                  'نظامك الكامل، منظم ومحسّن وتحت سيطرتك — بقراءات أصلية من هذا الجهاز فقط.')}
              </p>
              <div className="home-hero-actions">
                <button className="home-primary" onClick={() => setModal('scan')}>
                  {t(isArabic, 'Start a Quick Scan', 'بدء فحص سريع')}<ArrowRight />
                </button>
                <button className="home-ghost" onClick={onOpenCommands}>
                  <Search />{t(isArabic, 'Search files and tools', 'ابحث في الملفات والأدوات')}
                </button>
              </div>
            </div>

            <div className="home-hero-orbit">
              <KnouxOrbit
                optics="home"
                state={live.status === 'loading' ? 'loading' : live.status === 'native-required' ? 'unavailable' : live.status === 'partial' ? 'partial' : 'ready'}
                title="KNOuX"
                subtitle="SmartOrganizer"
                onActivate={() => setModal('scan')}
                tools={orbitTools}
              />
            </div>

            <div className="home-hero-pipeline">
              <ServicePipeline
                locale={isArabic ? 'ar' : 'en'}
                accent="violet"
                dense
                onSelect={(id) => go(({ connect: 'system', measure: 'smart_scan', summarize: 'system', recommend: 'smart_scan' } as Record<string, string>)[id] ?? 'smart_scan')}
                testId="home-pipeline"
                live={live.status === 'loading'}
                caption={
                  live.status === 'loading' ? t(isArabic, 'Measuring live data…', 'جارٍ القياس…')
                    : live.status === 'live' ? t(isArabic, 'Measured provider snapshot', 'قياسات حية')
                      : live.status === 'partial' ? t(isArabic, 'Partial measured — see notes', 'قياس جزئي')
                        : t(isArabic, 'Native measurement required', 'يلزم قياس أصلي')
                }
                stages={[
                  { id: 'connect', label: t(isArabic, 'Connect', 'اتصال'), state: live.status === 'native-required' ? 'gated' : Object.keys(live.observations).length ? 'complete' : 'pending' },
                  { id: 'measure', label: t(isArabic, 'Measure', 'قياس'), state: live.status === 'loading' ? 'active' : Object.keys(live.observations).length ? 'complete' : 'pending' },
                  { id: 'summarize', label: t(isArabic, 'Summarize', 'تلخيص'), state: live.status === 'loading' ? 'pending' : observed('scans') && observed('system') ? 'complete' : live.status === 'partial' ? 'partial' : 'pending' },
                  { id: 'recommend', label: t(isArabic, 'Recommend', 'توصية'), detail: t(isArabic, 'Preview', 'معاينة'), state: completedScan ? 'partial' : 'pending' },
                ]}
              />
            </div>
          </section>

          <section className="home-kpis" aria-label={t(isArabic, 'Measured system indicators', 'مؤشرات النظام المقيسة')}>
            {kpis.map((kpi) => (
              <button
                key={kpi.id}
                className="home-kpi"
                data-state={kpi.state}
                data-testid={`home-kpi-${kpi.id}`}
                onClick={() => go(kpi.target)}
                title={kpi.detail}
              >
                <kpi.icon aria-hidden="true" />
                <span className="home-kpi-label">{kpi.label}</span>
                <span className="home-kpi-value">
                  {kpi.value}
                  {kpi.unit ? <small>{kpi.unit}</small> : null}
                </span>
              </button>
            ))}
          </section>

          <div className="home-columns">
            <div className="home-column">
              <section className="home-panel" aria-label={t(isArabic, 'Today command deck', 'منصة اليوم')}>
                <header className="home-panel-head">
                  <div>
                    <h2><Grid2X2 />{t(isArabic, "Today's Command Deck", 'منصة التحكم اليوم')}</h2>
                    <p>{t(isArabic, 'Launch core tools and start organizing your digital world.', 'شغّل الأدوات الأساسية وابدأ تنظيم عالمك الرقمي.')}</p>
                  </div>
                  <button onClick={() => setModal('customize')}><Settings />{t(isArabic, 'Customize', 'تخصيص')}</button>
                </header>
                <div className="home-deck-grid">
                  {deck.map((entry) => (
                    <button key={entry.id} className="home-deck-tile" data-testid={`home-deck-${entry.id}`} onClick={() => go(entry.id)}>
                      <span className="home-deck-icon"><entry.icon aria-hidden="true" /></span>
                      <strong>{t(isArabic, entry.en, entry.ar)}</strong>
                      <span className="home-deck-sub">{t(isArabic, entry.subEn, entry.subAr)}</span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>

              <div className="home-lower">
                <section className="home-panel" aria-label={t(isArabic, 'System overview', 'نظرة عامة على النظام')}>
                  <header className="home-panel-head">
                    <h2><Gauge />{t(isArabic, 'System Overview', 'نظرة عامة على النظام')}</h2>
                    <button onClick={() => go('system')}>{t(isArabic, 'Details', 'تفاصيل')}<ChevronRight /></button>
                  </header>
                  <div className="home-tabs" role="tablist">
                    <button role="tab" aria-selected={overviewTab === 'health'} onClick={() => setOverviewTab('health')}>{t(isArabic, 'Health', 'الصحة')}</button>
                    <button role="tab" aria-selected={overviewTab === 'storage'} onClick={() => setOverviewTab('storage')}>{t(isArabic, 'Storage', 'التخزين')}</button>
                  </div>
                  <div className="home-scroll">
                    {overviewTab === 'health' && (
                      <>
                        <div className="home-metric-row"><Activity aria-hidden="true" /><span><strong>CPU</strong><small>{stamp('system')}</small></span><em>{cpu == null ? '—' : `${cpu}%`}</em></div>
                        <div className="home-metric-row"><Database aria-hidden="true" /><span><strong>{t(isArabic, 'Memory', 'الذاكرة')}</strong><small>{cpu == null ? t(isArabic, 'Not measured', 'غير مقيس') : t(isArabic, 'Live observation', 'قياس مباشر')}</small></span><em>{memory == null ? '—' : `${memory}%`}</em></div>
                        <div className="home-metric-row"><HardDrive aria-hidden="true" /><span><strong>{t(isArabic, 'Disk', 'القرص')}</strong><small>{drive ? `${drive.letter} · ${drive.label}` : t(isArabic, 'No measured volume', 'لا حجم مقيس')}</small></span><em>{drive ? `${drive.usedPercent}%` : '—'}</em></div>
                        <div className="home-metric-row"><Shield aria-hidden="true" /><span><strong>{t(isArabic, 'Health score', 'درجة الصحة')}</strong><small>{completedScan ? stamp('scans') : t(isArabic, 'No completed scan', 'لا فحص مكتمل')}</small></span><em>{score == null ? '—' : `${score}`}</em></div>
                        <p className="home-provenance-line">{t(isArabic,
                          'A live performance timeline needs repeated samples; Home takes one bounded read and never draws a curve it did not measure.',
                          'الخط الزمني للأداء يحتاج عينات متكررة؛ تقرأ الصفحة الرئيسية مرة واحدة محدودة ولا ترسم منحنى لم تقيسه.')}</p>
                      </>
                    )}
                    {overviewTab === 'storage' && (
                      volumes.length ? volumes.map((volume) => (
                        <div className="home-metric-row" key={volume.id}>
                          <HardDrive aria-hidden="true" />
                          <span><strong>{volume.letter} · {volume.label}</strong><small>{volume.freeFormatted} {t(isArabic, 'free of', 'متاح من')} {volume.totalFormatted}</small></span>
                          <em>{volume.usedPercent}%</em>
                        </div>
                      )) : <div className="home-empty"><HardDrive /><p>{t(isArabic, 'No volume measured.', 'لم يُقَس أي حجم.')}</p><button onClick={() => go('storage')}>{t(isArabic, 'Open Storage Atlas', 'افتح أطلس التخزين')}</button></div>
                    )}
                  </div>
                </section>

                <section className="home-panel" aria-label={t(isArabic, 'Quick access', 'وصول سريع')}>
                  <header className="home-panel-head">
                    <h2><FileText />{t(isArabic, 'Quick Access', 'وصول سريع')}</h2>
                    <button onClick={onOpenCommands}><Search />{t(isArabic, 'Search', 'بحث')}</button>
                  </header>
                  <div className="home-tabs" role="tablist">
                    <button role="tab" aria-selected={accessTab === 'files'} onClick={() => setAccessTab('files')}>{t(isArabic, 'Recent files', 'الملفات الأخيرة')}</button>
                    <button role="tab" aria-selected={accessTab === 'activity'} onClick={() => setAccessTab('activity')}>{t(isArabic, 'Scans', 'الفحوص')}</button>
                  </div>
                  <div className="home-scroll">
                    {accessTab === 'files' && (live.files.length ? live.files.map((file) => (
                      <button className="home-metric-row" key={file.id} onClick={() => go('files')}>
                        <FileText aria-hidden="true" />
                        <span><strong>{file.name}</strong><small>{file.relative}</small></span>
                        <em>{file.size ? formatBytes(file.size) : '—'}</em>
                      </button>
                    )) : (
                      <div className="home-empty">
                        <Folder />
                        <p>{live.sources.length
                          ? t(isArabic, 'Authorized, but no file has been indexed in this read.', 'مصرّح به، لكن لم يفهرس ملف في هذه القراءة.')
                          : t(isArabic, 'No file index is authorized.', 'لا فهرس ملفات مصرح به.')}</p>
                        <button onClick={() => go('files')}>{t(isArabic, 'Open Files', 'افتح الملفات')}</button>
                      </div>
                    ))}
                    {accessTab === 'activity' && (live.scans.length ? live.scans.slice(0, 6).map((scan) => (
                      <button className="home-metric-row" key={scan.id} onClick={() => go('smart_scan')}>
                        <Search aria-hidden="true" />
                        <span><strong>{scan.mode}</strong><small>{new Date(scan.startedAt).toLocaleString(isArabic ? 'ar-EG' : 'en-GB')} · {scan.status}</small></span>
                        <em>{scan.findingsCount}</em>
                      </button>
                    )) : <div className="home-empty"><Search /><p>{t(isArabic, 'No scan history measured.', 'لا سجل فحوص مقيس.')}</p><button onClick={() => go('smart_scan')}>{t(isArabic, 'Open Smart Scan', 'افتح الفحص الذكي')}</button></div>)}
                  </div>
                </section>
              </div>
            </div>

            <aside className="home-rail">
              <section className="home-panel home-insight" aria-label={t(isArabic, 'KNOuX insight', 'رؤية KNOuX')}>
                <header className="home-panel-head">
                  <h2><Sparkles />{t(isArabic, 'KNOuX Insight', 'رؤية KNOuX')}</h2>
                  <button onClick={() => go('smart_scan')}>{t(isArabic, 'Details', 'تفاصيل')}<ChevronRight /></button>
                </header>
                <div className="home-insight-body">
                  <p className="home-insight-lead">{insight.lead}</p>
                  <p className="home-insight-note">{insight.note}</p>
                  <div className="home-insight-actions">
                    <button className="home-primary" onClick={() => (insight.target === 'refresh' ? void live.refresh() : go(insight.target))}>
                      {insight.action}<ArrowRight />
                    </button>
                  </div>
                  <p className="home-provenance-line">{t(isArabic, 'Derived from measured observations only.', 'مشتقة من قياسات مقيسة فقط.')} {stamp('system')} · {stamp('apps')}</p>
                </div>
              </section>

              <section className="home-panel" aria-label={t(isArabic, 'Recent activity', 'النشاط الأخير')}>
                <header className="home-panel-head">
                  <h2><Activity />{t(isArabic, 'Recent Activity', 'النشاط الأخير')}</h2>
                  <button onClick={() => setModal('notifications')}>{t(isArabic, 'View all', 'عرض الكل')}<ChevronRight /></button>
                </header>
                <div className="home-scroll">
                  {activities.length ? activities.slice(0, 6).map((item) => (
                    <button className="home-metric-row" key={item.id} onClick={() => go(item.targetPage)}>
                      <Check aria-hidden="true" />
                      <span><strong>{isArabic ? item.titleAr : item.title}</strong><small>{isArabic ? item.detailAr : item.detail} · {isArabic ? item.timeAgoAr : item.timeAgo}</small></span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  )) : (
                    <div className="home-empty">
                      <Activity />
                      <p>{t(isArabic, 'No verified activity yet.', 'لا نشاط موثق بعد.')}</p>
                      <button onClick={() => void live.refresh()}>{t(isArabic, 'Refresh observations', 'حدّث القياسات')}</button>
                    </div>
                  )}
                </div>
              </section>

              <section className="home-panel" aria-label={t(isArabic, 'Pending safe actions', 'إجراءات آمنة معلّقة')}>
                <header className="home-panel-head">
                  <h2><Shield />{t(isArabic, 'Pending Safe Actions', 'إجراءات آمنة معلّقة')}</h2>
                  <button onClick={() => go(pending[0]?.target ?? 'smart_scan')}>{t(isArabic, 'View all', 'عرض الكل')}<ChevronRight /></button>
                </header>
                <div className="home-scroll">
                  {pending.length ? pending.map((item) => (
                    <button className="home-metric-row" key={item.id} onClick={() => go(item.target)}>
                      <Wrench aria-hidden="true" />
                      <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                      <em>{t(isArabic, 'Preview', 'معاينة')}</em>
                    </button>
                  )) : (
                    <div className="home-empty">
                      <Check />
                      <p>{t(isArabic, 'Nothing staged. Home never queues an effect on its own.', 'لا شيء مرحّل. لا تخطط الصفحة الرئيسية أي أثر بمفردها.')}</p>
                      <button onClick={() => go('cleanup')}>{t(isArabic, 'Open Cleanup', 'افتح التنظيف')}</button>
                    </div>
                  )}
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>

      {modal && <HomeDialog title={{
        notifications: t(isArabic, 'Notifications and provider evidence', 'الإشعارات وأدلة المزودين'),
        customize: t(isArabic, 'Command deck destinations', 'وجهات منصة التحكم'),
        scan: t(isArabic, 'Quick scan scope', 'نطاق الفحص السريع'),
      }[modal]} close={() => setModal(null)}>
        {modal === 'notifications' && (
          <>
            <p>{live.status.toUpperCase()} · {t(isArabic, 'Local native observations; each effect requires its own approval.', 'قياسات محلية؛ كل إجراء يحتاج موافقته الخاصة.')}</p>
            {Object.entries(live.observations).map(([name, o]) => <p key={name}>{name}: {o.source} · {o.observedAt}{o.stale ? ' · STALE' : ''}</p>)}
            {live.errors.map((error) => <p key={error}>{error}</p>)}
            {!live.errors.length && <p>{t(isArabic, 'No provider warnings.', 'لا تحذيرات من المزودين.')}</p>}
            <button onClick={() => void live.refresh()}>{t(isArabic, 'Refresh observations', 'حدّث القياسات')}</button>
          </>
        )}
        {modal === 'customize' && (
          <p>{t(isArabic,
            'The eight deck tiles are the approved reference destinations and are not user-removable in this build. Use the workspace search (Ctrl+K) to reach any of the fourteen sections.',
            'بلاطات المنصة الثماني هي وجهات المرجع المعتمد ولا يمكن حذفها في هذا الإصدار. استخدم البحث (Ctrl+K) للوصول إلى أي من الأقسام الأربعة عشر.')}</p>
        )}
        {modal === 'scan' && (
          <>
            <p>{t(isArabic, 'Preview only. Home does not start a scan, delete files, or execute device changes.', 'معاينة فقط. لا تبدأ الصفحة الرئيسية فحصًا ولا تحذف ملفًا ولا تنفذ تغييرًا.')}</p>
            <p>{live.sources.length
              ? `${live.sources.length} ${t(isArabic, 'authorized source(s). Select the exact scope in Smart Scan.', 'مصدرًا مصرحًا به. اختر النطاق في الفحص الذكي.')}`
              : t(isArabic, 'No authorized source. Choose a folder in the Files workbench first.', 'لا مصدر مصرح به. اختر مجلدًا في منصة الملفات أولًا.')}</p>
            <button className="home-primary" onClick={() => go('smart_scan')}>{t(isArabic, 'Open Smart Scan scope review', 'افتح مراجعة نطاق الفحص')}<ChevronRight /></button>
          </>
        )}
      </HomeDialog>}
    </div>
  );
}

function HomeDialog({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const node = ref.current!;
    node.showModal();
    return () => { node.close(); previous?.isConnected && previous.focus(); };
  }, []);
  return (
    <dialog className="home-dialog" ref={ref} onCancel={close} aria-label={title}
      onClick={(event) => { if (event.target === ref.current) close(); }}>
      <header><h2>{title}</h2><button autoFocus onClick={close} aria-label="Close dialog"><X /></button></header>
      {children}
    </dialog>
  );
}

export default ApprovedHomeScreen;
