import { CommandCanvas } from '../visual/CommandCanvas';
/**
 * KNOuX SmartOrganizer — Smart Scan master workspace (measured only).
 *
 * Everything rendered here comes from the native read-only ScanBridge:
 * capabilities, authorized sources, persisted history and scan sessions.
 * Browser preview shows explicit native-required states instead of fixtures.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FolderLock,
  Info,
  Layers,
  Lock,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { ScanServiceResult } from '../../shared/native-contracts';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import { SmartScanHero, SmartScanSourceBar } from './SmartScanHero';
import { ScanMetrics } from './ScanMetrics';
import { ScanServices } from './ScanServices';
import { ScanResults } from './ScanResults';
import { FindingsBreakdown } from './FindingsBreakdown';
import { RecentScans } from './RecentScans';
import { ScanReviewInspector } from './ScanReviewInspector';
import { ScanCommandBar } from './ScanCommandBar';
import { ScanServiceWorkspace } from './ScanServiceWorkspace';
import { ScanStageConsole } from './ScanStageConsole';
import { ServiceWorkbenchHost, type WorkbenchMode } from '../components/workbench/ServiceWorkbenchHost';
import { useSmartScan } from './useSmartScan';
import {
  formatBytes,
  modeLabel,
  sessionStatusLabel,
  toBreakdown,
  toKpiMetrics,
  toRecentScans,
  toResultItems,
  toServiceTiles,
  toStageViews,
} from './model';
import type { ScanServiceMeta } from './smartScan.types';
import './smartScan.css';

export interface SmartScanPageProps {
  onNavigateSection?: (section: string) => void;
}

export const SmartScanPage: React.FC<SmartScanPageProps> = ({ onNavigateSection }) => {
  const { isArabic: globalArabic, toggleLocale } = useNavigation();
  const [localArabic, setLocalArabic] = useState<boolean | null>(null);
  const isArabic = localArabic !== null ? localArabic : globalArabic;
  const scan = useSmartScan();

  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customServiceIds, setCustomServiceIds] = useState<string[]>([]);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [workbenchMode, setWorkbenchMode] = useState<WorkbenchMode>(() => {
    try { return localStorage.getItem('knoux.scan.workbench.mode') === 'expanded' ? 'expanded' : 'side'; } catch { return 'side'; }
  });
  const [workbenchWidth, setWorkbenchWidth] = useState<number>(() => {
    try { const value = Number(localStorage.getItem('knoux.scan.workbench.width')); return Number.isFinite(value) && value >= 340 ? Math.min(720, value) : 480; } catch { return 480; }
  });
  useEffect(() => {
    try {
      localStorage.setItem('knoux.scan.workbench.mode', workbenchMode);
      localStorage.setItem('knoux.scan.workbench.width', String(workbenchWidth));
    } catch {
      // In-memory only when storage is unavailable.
    }
  }, [workbenchMode, workbenchWidth]);

  const services = useMemo(() => toServiceTiles(scan.capabilities, isArabic), [scan.capabilities, isArabic]);
  const results = useMemo(() => toResultItems(scan.session), [scan.session]);
  const metrics = useMemo(() => toKpiMetrics(scan.session), [scan.session]);
  const breakdown = useMemo(() => toBreakdown(scan.session), [scan.session]);
  const recent = useMemo(() => toRecentScans(scan.history), [scan.history]);
  const stages = useMemo(
    () => (scan.active ? scan.active.stages : scan.session ? toStageViews(scan.session.stages) : []),
    [scan.active, scan.session]
  );
  const serviceResults: ScanServiceResult[] = scan.session?.services || [];

  const filteredResults = useMemo(() => {
    switch (activeFilter) {
      case 'junk':
        return results.filter((item) => item.category === 'junk');
      case 'duplicates':
        return results.filter((item) => item.category === 'duplicates');
      case 'large':
        return results.filter((item) => item.category === 'large');
      case 'privacy':
        return results.filter((item) => item.category === 'privacy');
      case 'other':
        return results.filter((item) => item.category === 'system' || item.category === 'other');
      case 'all':
      default:
        return results;
    }
  }, [results, activeFilter]);

  const selectedItem = results.find((item) => item.id === selectedResultId) || null;
  const activeService = services.find((service) => service.id === activeServiceId) || null;
  const activeServiceResult = activeService ? serviceResults.find((result) => result.serviceId === activeService.id) : undefined;
  const scanActive = Boolean(scan.active);

  useEffect(() => {
    if (!results.length) {
      setSelectedResultId(null);
      return;
    }
    setSelectedResultId((current) => (current && results.some((item) => item.id === current) ? current : results[0].id));
  }, [results]);

  const handleNavigate = (section: string) => {
    onNavigateSection?.(section);
  };

  const handleRunQuick = () => {
    setActiveFilter('all');
    void scan.runScan({ mode: 'quick' });
  };

  const handleRunDeep = () => {
    setActiveFilter('all');
    void scan.runScan({ mode: 'deep' });
  };

  const handleRunService = (serviceId: string) => {
    const capability = scan.capabilities?.services.find((entry) => entry.id === serviceId);
    if (!capability) return;
    void scan.runScan({
      mode: 'service',
      services: [serviceId],
      requiresSource: capability.requiresSource,
    });
  };

  const openCustomScan = () => {
    if (!customServiceIds.length) {
      setCustomServiceIds(services.filter((service) => service.id !== 'quick_scan' && service.id !== 'deep_scan').map((service) => service.id));
    }
    setCustomOpen(true);
  };

  const toggleCustomService = (serviceId: string) => {
    setCustomServiceIds((current) => (current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId]));
  };

  const runCustomScan = async () => {
    const selected = customServiceIds.filter((id) => services.some((service) => service.id === id));
    if (!selected.length) return;
    const needsSource = selected.some((id) => scan.capabilities?.services.find((entry) => entry.id === id)?.requiresSource);
    const started = await scan.runScan({ mode: 'custom', services: selected, requiresSource: needsSource });
    if (started) {
      setCustomOpen(false);
      setActiveFilter('all');
    }
  };

  const handleExport = () => {
    if (!scan.session) return;
    const exported = {
      contract: 'scan.v1',
      exportedAt: new Date().toISOString(),
      readOnly: true,
      mutation: 'none',
      session: scan.session,
    };
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `knoux-scan-${scan.session.id.slice(0, 8)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    scan.showNotice(isArabic ? 'تم تصدير جلسة الفحص المقيسة بصيغة JSON.' : 'Measured scan session exported as JSON.');
  };

  const handleSelectHistory = async (sessionId: string) => {
    setActiveFilter('all');
    await scan.selectHistory(sessionId);
  };

  const serviceRunState = (service: ScanServiceMeta): { canRun: boolean; reason: string | null } => {
    if (!scan.nativeAvailable) {
      return { canRun: false, reason: isArabic ? 'الجسر الأصلي غير متاح.' : 'The native bridge is unavailable.' };
    }
    if (scanActive) {
      return { canRun: false, reason: isArabic ? 'هناك فحص قيد التشغيل بالفعل.' : 'A measured scan is already running.' };
    }
    if (!service.requiresSource) return { canRun: true, reason: null };
    if (!scan.selectedSource) {
      return { canRun: false, reason: isArabic ? 'صرّح بمجلد أولًا.' : 'Authorize a folder first.' };
    }
    if (scan.selectedSource.status !== 'ready' || scan.selectedSource.fileCount === 0) {
      return { canRun: false, reason: isArabic ? 'افهرس المجلد المصرح به أولًا.' : 'Index the authorized folder first.' };
    }
    return { canRun: true, reason: null };
  };

  const cleanupSummary = scan.session?.summary;
  const junkResult = serviceResults.find((result) => result.serviceId === 'junk_cleaner');
  const measuredEmptyFolders = junkResult?.data.emptyFolders?.summary.emptyFolders ?? null;
  const customSelectedNeedsSource = customServiceIds.some((id) => scan.capabilities?.services.find((entry) => entry.id === id)?.requiresSource);

  const closeWorkbench = () => {
    if (!customOpen && !cleanupOpen) setActiveServiceId(null);
  };

  const renderScanServiceBody = () => activeService ? (
    <ScanServiceWorkspace
      service={activeService}
      result={activeServiceResult}
      session={scan.session}
      isArabic={isArabic}
      busy={scan.busy}
      scanActive={scanActive}
      canRun={serviceRunState(activeService).canRun}
      runBlockedReason={serviceRunState(activeService).reason}
      onClose={closeWorkbench}
      onRunService={handleRunService}
      onNavigateToWorkspace={(workspace) => {
        setActiveServiceId(null);
        handleNavigate(workspace);
      }}
      onOpenCleanupGate={() => setCleanupOpen(true)}
      embedded
    />
  ) : null;

  const scanWorkbenchToolSelector = (
    <select
      data-testid="scan-workbench-tool-select"
      aria-label={isArabic ? 'تبديل خدمة الفحص' : 'Switch scan service'}
      value={activeServiceId || ''}
      onChange={(event) => setActiveServiceId(event.target.value)}
      className="max-w-[140px] rounded border border-[#173866] bg-[#08162b] px-1.5 py-1 text-[10px] text-slate-200"
    >
      {services.map((entry) => (
        <option key={entry.id} value={entry.id}>{isArabic ? entry.titleAr : entry.titleEn}</option>
      ))}
    </select>
  );

  return (
    <div className={`smart-scan-viewport relative text-slate-100 font-sans select-none ${isArabic ? 'rtl' : 'ltr'}`}>
      <KNOuXTitleBar
        sectionName={isArabic ? 'الفحص الذكي' : 'Smart Scan'}
        sectionSubtitle={isArabic ? 'قياس شامل للقراءة فقط' : 'Measured read-only diagnostics'}
        onNavigateHome={() => handleNavigate('home')}
        isArabic={isArabic}
        onToggleArabic={() => {
          toggleLocale();
          setLocalArabic(!isArabic);
        }}
        onOpenSettings={() => handleNavigate('settings')}
      />

      {scan.notice ? (
        <div className="absolute top-12 right-6 z-[60] px-4 py-2 rounded-xl bg-emerald-950/95 border border-emerald-400 text-emerald-200 text-xs shadow-2xl flex items-center gap-2 animate-fade-in backdrop-blur-md max-w-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{scan.notice}</span>
          <button type="button" onClick={scan.clearNotice} className="text-emerald-300/70 hover:text-white ml-1" aria-label={isArabic ? 'إغلاق' : 'Dismiss'}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {scan.actionError ? (
        <div className="absolute top-12 right-6 z-[60] px-4 py-2 rounded-xl bg-rose-950/95 border border-rose-500/70 text-rose-100 text-xs shadow-2xl flex items-start gap-2 animate-fade-in backdrop-blur-md max-w-md">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-bold">{scan.actionError.code}</div>
            <div className="text-[10px] text-rose-200/90 break-words">{scan.actionError.message}</div>
          </div>
          <button type="button" onClick={scan.clearError} className="text-rose-300/70 hover:text-white ml-1" aria-label={isArabic ? 'إغلاق' : 'Dismiss'}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      <div className="flex flex-1 overflow-hidden relative">
        <KNOuXSidebar activeSection="smart_scan" onNavigate={handleNavigate} isArabic={isArabic} />

        <div className="flex-1 flex flex-col min-h-0">
          <main data-testid="scan-workspace" className="scan-main flex-1 flex flex-col overflow-y-auto 2xl:overflow-hidden bg-gradient-to-b from-[#040b18] via-[#06142a] to-[#040b18] p-3 gap-3 knx-custom-scrollbar min-h-0">
          <CommandCanvas locale={isArabic ? 'ar' : 'en'} heroTypes={[SmartScanHero]} metricTypes={[ScanMetrics]} primaryTypes={[ScanServices]}>
            <SmartScanHero
              isArabic={isArabic}
              nativeAvailable={scan.nativeAvailable}
              sources={scan.sources}
              selectedSource={scan.selectedSource}
              active={scan.active}
              session={scan.session}
              busy={scan.busy}
              onSelectSource={scan.setSelectedSourceId}
              onAuthorizeSource={() => void scan.authorizeSource()}
              onIndexSource={() => {
                if (scan.selectedSource) void scan.indexSource(scan.selectedSource.id);
              }}
              onRefreshSources={() => void scan.refreshSources()}
              onRunQuick={handleRunQuick}
              onRunDeep={handleRunDeep}
              onCancel={() => void scan.cancelActive()}
              onOpenService={(kind) => {
                const service = services.find((entry) => kind === 'privacy' ? entry.id.includes('privacy') : entry.id.includes('system_health'));
                if (service) setActiveServiceId(service.id);
              }}
            />
            <aside className="knx-scan-status">
              <h2>{isArabic ? 'حالة الفحص المباشرة' : 'Live Scan Status'}</h2>
              <p>{scan.active ? (isArabic ? 'الفحص جارٍ على النطاق المصرح.' : 'Measuring the authorized scope.') : (isArabic ? 'بانتظار فحص يبدأ باختيارك.' : 'Ready when you choose to scan.')}</p>
              <SmartScanSourceBar
                isArabic={isArabic}
                nativeAvailable={scan.nativeAvailable}
                sources={scan.sources}
                selectedSource={scan.selectedSource}
                active={scan.active}
                session={scan.session}
                busy={scan.busy}
                onSelectSource={scan.setSelectedSourceId}
                onAuthorizeSource={() => void scan.authorizeSource()}
                onIndexSource={() => {
                  if (scan.selectedSource) void scan.indexSource(scan.selectedSource.id);
                }}
                onRefreshSources={() => void scan.refreshSources()}
                onRunQuick={handleRunQuick}
                onRunDeep={handleRunDeep}
                onCancel={() => void scan.cancelActive()}
              />
              <ScanStageConsole active={scan.active} summary={scan.session?.summary || null} stages={stages} isArabic={isArabic} />
              {!scan.active && !scan.session && <div className="knx-ref-empty"><ShieldCheck/><strong>{isArabic ? 'لم يبدأ الفحص' : 'No scan has started'}</strong><small>{isArabic ? 'لا تُعرض نتائج أو نسبة نجاح قبل القياس.' : 'Results and progress appear only after measurement.'}</small></div>}
              <FindingsBreakdown categories={breakdown} isArabic={isArabic} hasSession={Boolean(scan.session)} />
              <RecentScans records={recent} isArabic={isArabic} selectedId={scan.session?.id || null} onSelect={sessionId => void handleSelectHistory(sessionId)} loading={scan.busy} />
            </aside>

            {!scan.nativeAvailable ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/35 bg-amber-950/20 px-3 py-2 text-[10px] text-amber-200 shrink-0">
                <FolderLock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {isArabic
                    ? 'جسر الفحص الأصلي غير متاح. افتح Electron لتصريح مجلد وقياس هذا الجهاز.'
                    : 'Native scan bridge unavailable. Authorize a folder in Electron to measure this device.'}
                </span>
              </div>
            ) : null}

            <ScanMetrics metrics={metrics} isArabic={isArabic} hasSession={Boolean(scan.session)} />

            <ScanServices
              services={services}
              results={serviceResults}
              activeServiceId={activeServiceId}
              onSelectService={(service) => setActiveServiceId(service.id)}
              onOpenCustomScan={openCustomScan}
              isArabic={isArabic}
              nativeAvailable={scan.nativeAvailable}
            />

            <div className="scan-results-grid grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-12 2xl:grid-rows-[minmax(0,1fr)] gap-3 2xl:flex-1 2xl:min-h-[240px]">
              <div className="scan-results-column lg:col-span-2 2xl:col-span-6 h-[280px] sm:h-[300px] lg:h-[180px] 2xl:h-full min-h-0">
                <ScanResults
                  results={filteredResults}
                  selectedId={selectedResultId}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  onSelectRow={setSelectedResultId}
                  isArabic={isArabic}
                  hasSession={Boolean(scan.session)}
                />
              </div>


              <div className="scan-inspector-column lg:col-span-1 2xl:col-span-3 h-[360px] 2xl:h-full min-h-0">
                <ScanReviewInspector selectedItem={selectedItem} isArabic={isArabic} hasSession={Boolean(scan.session)} />
              </div>
            </div>

          </CommandCanvas>
          </main>

          <div className="shrink-0 flex flex-col gap-2 px-3 sm:px-4 pb-3 pt-2 bg-[#050e1f]/90 border-t border-[#11294a] backdrop-blur-md z-30">
            <ScanCommandBar
              session={scan.session}
              active={scan.active}
              isArabic={isArabic}
              busy={scan.busy}
              onCancelScan={() => void scan.cancelActive()}
              onExport={handleExport}
              onOpenCustomScan={openCustomScan}
              onOpenCleanupGate={() => setCleanupOpen(true)}
            />
          </div>
        </div>
      </div>

      {activeService ? (
        workbenchMode === 'side' ? (
          <div className="fixed end-3 top-14 bottom-28 z-50" style={{ width: `${workbenchWidth}px` }} data-testid="scan-workbench-side-shell">
            <ServiceWorkbenchHost
              serviceId={activeService.id}
              title={isArabic ? activeService.titleAr : activeService.titleEn}
              subtitle={isArabic ? 'خدمة فحص مقيسة · للقراءة فقط' : 'Measured scan service · read-only'}
              locale={isArabic ? 'ar' : 'en'}
              mode="side"
              onModeChange={setWorkbenchMode}
              onClose={closeWorkbench}
              onResize={(width) => setWorkbenchWidth(width)}
              minWidth={340}
              maxWidth={720}
              testId="scan-workbench"
              toolSelector={scanWorkbenchToolSelector}
              footer={<span className="text-amber-300">{isArabic ? 'قياس فقط · لا حذف أو إصلاح' : 'Measure only · no delete or repair'}</span>}
            >
              {renderScanServiceBody()}
            </ServiceWorkbenchHost>
          </div>
        ) : (
          <div className="fixed inset-x-3 top-14 bottom-28 z-50" data-testid="scan-workbench-expanded-shell">
            <ServiceWorkbenchHost
              serviceId={activeService.id}
              title={isArabic ? activeService.titleAr : activeService.titleEn}
              subtitle={isArabic ? 'خدمة فحص مقيسة · للقراءة فقط' : 'Measured scan service · read-only'}
              locale={isArabic ? 'ar' : 'en'}
              mode="expanded"
              onModeChange={setWorkbenchMode}
              onClose={closeWorkbench}
              testId="scan-workbench-expanded"
              toolSelector={scanWorkbenchToolSelector}
              footer={<span className="text-amber-300">{isArabic ? 'قياس فقط · لا حذف أو إصلاح' : 'Measure only · no delete or repair'}</span>}
            >
              {renderScanServiceBody()}
            </ServiceWorkbenchHost>
          </div>
        )
      ) : null}

      {customOpen ? (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-[#08172e] border border-cyan-500/40 rounded-2xl w-full max-w-lg p-5 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-[#122e54] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  {isArabic ? 'فحص مخصص مقيس' : 'Measured Custom Scan'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isArabic ? 'اختر الخدمات؛ يُشتق نطاق المراحل من اختيارك فقط.' : 'Choose services; the measured stage set is derived only from your selection.'}
                </p>
              </div>
              <button type="button" onClick={() => setCustomOpen(false)} className="text-slate-400 hover:text-white cursor-pointer" aria-label={isArabic ? 'إغلاق' : 'Close'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">
                <Layers className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                {customServiceIds.length} / {services.length} {isArabic ? 'خدمة محددة' : 'services selected'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCustomServiceIds(services.filter((service) => service.id !== 'quick_scan' && service.id !== 'deep_scan').map((service) => service.id))}
                  className="px-2 py-1 rounded-lg bg-[#0d213e] hover:bg-[#16345e] border border-[#16345e] text-cyan-300 font-bold cursor-pointer"
                >
                  {isArabic ? 'تحديد الكل' : 'Select all'}
                </button>
                <button
                  type="button"
                  onClick={() => setCustomServiceIds([])}
                  className="px-2 py-1 rounded-lg bg-[#0d213e] hover:bg-[#16345e] border border-[#16345e] text-slate-300 font-bold cursor-pointer"
                >
                  {isArabic ? 'مسح' : 'Clear'}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 overflow-y-auto knx-custom-scrollbar pr-0.5">
              {services.filter((service) => service.id !== 'quick_scan' && service.id !== 'deep_scan').map((service) => {
                const checked = customServiceIds.includes(service.id);
                return (
                  <label
                    key={service.id}
                    className={`flex items-start justify-between gap-2 p-2.5 rounded-xl border cursor-pointer transition ${checked ? 'bg-[#0d254b] border-cyan-400/50' : 'bg-[#0d213e] border-[#16345e] hover:border-cyan-400/30'}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">{isArabic ? service.titleAr : service.titleEn}</span>
                        {service.state !== 'available' ? (
                          <span className={`px-1 py-0.2 rounded text-[8px] font-bold border ${service.state === 'gated' ? 'bg-rose-400/15 text-rose-300 border-rose-400/40' : 'bg-amber-400/15 text-amber-300 border-amber-400/40'}`}>
                            {service.state === 'gated' ? (isArabic ? 'مقيّد' : 'GATED') : (isArabic ? 'جزئي' : 'PARTIAL')}
                          </span>
                        ) : null}
                        {service.requiresSource ? (
                          <span className="px-1 py-0.2 rounded bg-[#071731] border border-[#1b3a63] text-[8px] font-mono text-slate-400">
                            {isArabic ? 'يتطلب مصدرًا' : 'SOURCE'}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">{isArabic ? service.noteAr : service.noteEn}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCustomService(service.id)}
                      className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer shrink-0"
                    />
                  </label>
                );
              })}
            </div>

            {customSelectedNeedsSource && !scan.selectedSource ? (
              <p className="text-[9px] text-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {isArabic ? 'الاختيار يتضمن خدمات تتطلب مجلدًا مصرحًا ومفهرسًا.' : 'This selection includes services that require an authorized, indexed folder.'}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-[#122e54] pt-3">
              <button type="button" onClick={() => setCustomOpen(false)} className="px-4 py-1.5 rounded-xl bg-[#0c1f3d] hover:bg-[#132c52] border border-[#173866] text-xs font-bold text-slate-200 cursor-pointer">
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => void runCustomScan()}
                disabled={!customServiceIds.length || scan.busy || scanActive}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-black text-white border border-cyan-300/40 shadow-[0_0_14px_rgba(37,99,235,0.45)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isArabic ? 'تشغيل الفحص المخصص' : 'Run custom scan'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cleanupOpen ? (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-[#08172e] border border-amber-400/50 rounded-2xl w-full max-w-md p-5 shadow-2xl text-slate-100 flex flex-col gap-4 text-center items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">{isArabic ? 'بوابة موافقة التنظيف' : 'Cleanup Approval Gate'}</h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {isArabic
                  ? 'لم يتم حذف أو نقل أي ملف. تنفيذ التنظيف محجوز للمهمة 08 ويتطلب موافقة صريحة؛ هذه النافذة تعرض الأدلة المقيسة فقط.'
                  : 'No file has been deleted or moved. Cleanup execution is reserved for Mission 08 and explicit approval; this gate only shows measured evidence.'}
              </p>
            </div>

            <div className="w-full grid grid-cols-1 gap-1.5 text-[10px] text-left">
              <div className="flex items-center justify-between rounded-lg border border-[#16345e] bg-[#0b1d38] px-2.5 py-1.5">
                <span className="text-slate-400">{isArabic ? 'بايتات مكررة متحقق منها' : 'Verified duplicate bytes'}</span>
                <span className="font-mono font-bold text-cyan-300">{formatBytes(cleanupSummary?.verifiedReclaimableBytes || 0, isArabic)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#16345e] bg-[#0b1d38] px-2.5 py-1.5">
                <span className="text-slate-400">{isArabic ? 'مجموعات مكررة متحقق منها' : 'Verified duplicate groups'}</span>
                <span className="font-mono font-bold text-purple-300">{cleanupSummary?.verifiedDuplicateGroups || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#16345e] bg-[#0b1d38] px-2.5 py-1.5">
                <span className="text-slate-400">{isArabic ? 'مجلدات فارغة مقيسة' : 'Measured empty folders'}</span>
                <span className="font-mono font-bold text-amber-300">{measuredEmptyFolders == null ? (isArabic ? 'لم تُقس' : 'not measured') : String(measuredEmptyFolders)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#16345e] bg-[#0b1d38] px-2.5 py-1.5">
                <span className="text-slate-400">{isArabic ? 'جلسة الفحص' : 'Scan session'}</span>
                <span className="font-mono text-slate-300 truncate max-w-[170px]">{scan.session ? `${modeLabel(scan.session.mode, isArabic)} · ${sessionStatusLabel(scan.session.status, isArabic)}` : (isArabic ? 'لا توجد' : 'none')}</span>
              </div>
            </div>

            <div className="w-full rounded-xl border border-amber-500/25 bg-amber-950/15 p-2.5 text-[9px] text-amber-200/90 flex items-start gap-2 text-left">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {isArabic
                  ? 'قناة الحذف غير موجودة في هذه المهمة. ستحتاج المهمة 08 إلى موافقة منفصلة قبل أي إجراء مدمر.'
                  : 'No deletion channel exists in this mission. Mission 08 will require a separate approval before any destructive action.'}
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setCleanupOpen(false)} className="px-4 py-1.5 rounded-xl bg-[#0c1f3d] hover:bg-[#132c52] border border-[#173866] text-xs font-bold text-slate-200 cursor-pointer">
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCleanupOpen(false);
                  handleNavigate('cleanup');
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-xs font-bold text-amber-200 cursor-pointer flex items-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5" />
                {isArabic ? 'فتح مساحة التنظيف' : 'Open Cleanup Workspace'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
