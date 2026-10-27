import { CommandCanvas } from '../visual/CommandCanvas';
/**
 * KNOuX SmartOrganizer — Clean Room (Mission 08).
 *
 * Browser previews render an explicit native-required state. In Electron every
 * KPI, candidate, vault entry, journal row, recycle item and report value comes
 * from the read-only CleanupBridge. No design fixtures are imported here.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FolderLock,
  Lock,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import type { CleanupCandidate } from '../../shared/native-contracts';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXSidebar, KNOuXTitleBar } from '../components/shell/KNOuXShellComponents';
import { CleanupHero, CleanupMetrics } from '../cleanup/CleanupHero';
import { CandidateRegister } from '../cleanup/CandidateRegister';
import { CandidateInspector } from '../cleanup/CandidateInspector';
import { ServiceRail } from '../cleanup/ServiceRail';
import { ServiceWorkspace } from '../cleanup/ServiceWorkspace';
import { PlanGate } from '../cleanup/PlanGate';
import { ServiceWorkbenchHost, type WorkbenchMode } from '../components/workbench/ServiceWorkbenchHost';
import { useCleanup } from '../cleanup/useCleanup';
import {
  DEFAULT_FILTERS,
  SERVICE_FALLBACK_META,
  SERVICE_IDS,
  filterCandidates,
  formatBytes,
  formatCount,
  formatTimestamp,
  t,
} from '../cleanup/model';
import type { CleanupFilters, CleanupLocale, CleanupServiceId } from '../cleanup/model';
import '../cleanup.css';

export interface CleanupPageProps {
  onNavigateSection?: (section: string) => void;
}

export function CleanupPage({ onNavigateSection }: CleanupPageProps) {
  const { navigateTo, locale: globalLocale, toggleLocale } = useNavigation();
  const [localLocale, setLocalLocale] = useState<CleanupLocale | null>(null);
  const locale: CleanupLocale = localLocale || (globalLocale === 'ar' ? 'ar' : 'en');
  const controller = useCleanup();
  const { inventory } = controller;
  const candidates = useMemo<CleanupCandidate[]>(() => inventory?.candidates || [], [inventory]);

  const [filters, setFilters] = useState<CleanupFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [activeService, setLegacyActiveService] = useState<CleanupServiceId | null>(null);
  const setActiveService=(id:CleanupServiceId|null)=>{if(id&&['cleanup-temp-preview', 'cleanup-temp-quarantine', 'cleanup-temp-undo', 'cleanup-quarantine-list', 'cleanup-estimate', 'cleanup-reports'].includes(id)){setLegacyActiveService(null);window.dispatchEvent(new CustomEvent('knoux:storage-cleanup-live',{detail:{serviceId:id}}));}else setLegacyActiveService(id);};
  const [planOpen, setPlanOpen] = useState(false);
  const [workbenchMode, setWorkbenchMode] = useState<WorkbenchMode>(() => {
    try { return localStorage.getItem('knoux.cleanup.workbench.mode') === 'expanded' ? 'expanded' : 'side'; } catch { return 'side'; }
  });
  const [workbenchWidth, setWorkbenchWidth] = useState<number>(() => {
    try { const value = Number(localStorage.getItem('knoux.cleanup.workbench.width')); return Number.isFinite(value) && value >= 340 ? Math.min(720, value) : 560; } catch { return 560; }
  });
  useEffect(() => {
    try {
      localStorage.setItem('knoux.cleanup.workbench.mode', workbenchMode);
      localStorage.setItem('knoux.cleanup.workbench.width', String(workbenchWidth));
    } catch {
      // In-memory only when storage is unavailable.
    }
  }, [workbenchMode, workbenchWidth]);

  const filteredCandidates = useMemo(() => filterCandidates(candidates, filters), [candidates, filters]);
  const selectedCandidate = candidates.find((candidate) => candidate.id === selectedId) || null;
  const checkedCandidates = candidates.filter((candidate) => checkedIds.has(candidate.id));
  const checkedBytes = checkedCandidates.reduce((sum, candidate) => sum + (candidate.sizeBytes || 0), 0);
  const reviewCount = checkedCandidates.filter((candidate) => candidate.safety === 'review').length;

  useEffect(() => {
    if (!candidates.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => (current && candidates.some((candidate) => candidate.id === current) ? current : candidates[0].id));
  }, [candidates]);

  useEffect(() => {
    setCheckedIds((current) => {
      if (!current.size) return current;
      const next = new Set([...current].filter((id) => candidates.some((candidate) => candidate.id === id)));
      return next.size === current.size ? current : next;
    });
  }, [candidates]);

  const handleNavigate = (section: string) => {
    onNavigateSection?.(section);
  };

  const patchFilters = (next: Partial<CleanupFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setCheckedIds((current) => {
      const everyVisible = filteredCandidates.length > 0 && filteredCandidates.every((candidate) => current.has(candidate.id));
      if (everyVisible) {
        const next = new Set(current);
        for (const candidate of filteredCandidates) next.delete(candidate.id);
        return next;
      }
      return new Set([...current, ...filteredCandidates.map((candidate) => candidate.id)]);
    });
  };

  const selectSafeDefaults = () => {
    setCheckedIds(new Set(candidates.filter((candidate) => candidate.safety === 'eligible').map((candidate) => candidate.id)));
    controller.showNotice(
      t(locale, 'Safe defaults selected every eligible measured candidate. Nothing was executed.', 'حدّد الافتراضي الآمن كل مرشح مقيس مؤهل. لم يُنفّذ شيء.')
    );
  };

  const stagePlan = async (ids: string[], mode: Parameters<typeof controller.stagePlan>[1]) => {
    if (!ids.length) {
      controller.showNotice(t(locale, 'Select at least one measured candidate first.', 'حدد مرشحًا مقيسًا واحدًا على الأقل أولًا.'));
      return;
    }
    const plan = await controller.stagePlan(ids, mode);
    if (plan) setPlanOpen(true);
  };

  const reviewSelection = () => {
    const ids = checkedIds.size ? [...checkedIds] : selectedCandidate ? [selectedCandidate.id] : [];
    void stagePlan(ids, 'quarantine');
  };

  const adjustScope = () => {
    setFilters(DEFAULT_FILTERS);
    controller.showNotice(t(locale, 'Scope filters reset. Choose categories in the hero or filter the ledger directly.', 'أُعيد ضبط مرشحات النطاق. اختر الفئات في الترويسة أو رشّح السجل مباشرة.'));
    window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('[data-testid="cleanup-register"] input[type="search"]');
      input?.focus();
    }, 60);
  };

  const openService = (serviceId: string) => {
    if ((SERVICE_IDS as readonly string[]).includes(serviceId)) {
      setActiveService(serviceId as CleanupServiceId);
    } else {
      controller.showNotice(t(locale, 'That cleanup service is not registered in this contract.', 'خدمة التنظيف هذه غير مسجلة في هذا العقد.'));
    }
  };

  const applySelection = (ids: string[]) => {
    setCheckedIds(new Set(ids));
    if (ids.length) setSelectedId(ids[0]);
  };

  const errorText = controller.actionError ? `${controller.actionError.code}: ${controller.actionError.message}` : null;
  const warm = Boolean(inventory?.warnings?.length);

  const closeWorkbench = () => {
    if (!planOpen) setActiveService(null);
  };

  const cleanupServiceLabel = (service: CleanupServiceId): string => {
    const capability = controller.capabilities?.services.find((entry) => entry.id === service);
    if (capability) return locale === 'ar' ? capability.labelAr : capability.labelEn;
    const fallback = SERVICE_FALLBACK_META[service];
    return locale === 'ar' ? fallback.titleAr : fallback.titleEn;
  };

  const renderCleanupServiceBody = () => activeService ? (
    <ServiceWorkspace
      service={activeService}
      locale={locale}
      controller={controller}
      candidates={candidates}
      selectedCandidate={selectedCandidate}
      selectedIds={[...checkedIds]}
      onSelectCandidate={setSelectedId}
      onApplySelection={applySelection}
      onToggleSelected={toggleCheck}
      onStagePlan={(ids, mode) => void stagePlan(ids, mode)}
      onClose={closeWorkbench}
      embedded
    />
  ) : null;

  const cleanupWorkbenchToolSelector = (
    <select
      data-testid="cleanup-workbench-tool-select"
      aria-label={t(locale, 'Switch cleanup service', 'تبديل خدمة التنظيف')}
      value={activeService || ''}
      onChange={(event) => {
        if ((SERVICE_IDS as readonly string[]).includes(event.target.value)) {
          setActiveService(event.target.value as CleanupServiceId);
        }
      }}
      className="max-w-[150px] rounded border border-[#173866] bg-[#08162b] px-1.5 py-1 text-[10px] text-slate-200"
    >
      {SERVICE_IDS.map((id) => (
        <option key={id} value={id}>{cleanupServiceLabel(id)}</option>
      ))}
    </select>
  );

  return (
    <div className={`cln-viewport relative text-slate-100 font-sans select-none ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      <KNOuXTitleBar
        sectionName={t(locale, 'Cleanup', 'التنظيف')}
        sectionSubtitle={t(locale, 'Measured clean room', 'غرفة تنظيف مقيسة')}
        onNavigateHome={() => handleNavigate('home')}
        searchPlaceholder={t(locale, 'Search cleanup candidates… (Ctrl+K)', 'ابحث في مرشحي التنظيف… (Ctrl+K)')}
        isArabic={locale === 'ar'}
        onToggleArabic={() => {
          toggleLocale();
          setLocalLocale(locale === 'ar' ? 'en' : 'ar');
        }}
        onOpenSettings={() => handleNavigate('settings')}
      />

      {controller.notice ? (
        <div className="cln-toast cln-toast-good" role="status">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{controller.notice}</span>
          <button type="button" onClick={controller.clearNotice} aria-label={t(locale, 'Dismiss', 'إغلاق')}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {errorText ? (
        <div className="cln-toast cln-toast-bad" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div className="min-w-0">
            <div className="font-bold">{controller.actionError?.code}</div>
            <div className="text-[10px] opacity-90 break-words">{controller.actionError?.message}</div>
          </div>
          <button type="button" onClick={controller.clearError} aria-label={t(locale, 'Dismiss', 'إغلاق')}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <KNOuXSidebar activeSection="cleanup" onNavigate={handleNavigate} isArabic={locale === 'ar'} />

        <div className="flex-1 flex flex-col min-h-0">
          <main
            data-testid="cleanup-workspace"
            className="cln-main flex-1 min-h-0 overflow-y-auto knx-custom-scrollbar"
          >
          <CommandCanvas locale={locale} heroTypes={[CleanupHero]} metricTypes={[CleanupMetrics]} toolTypes={[ServiceRail]} toolPlacement="rail">
            <CleanupHero
              locale={locale}
              controller={controller}
              selectedCount={checkedIds.size}
              onReviewSelection={reviewSelection}
            />

            <CleanupMetrics locale={locale} controller={controller} />

            {!controller.nativeAvailable ? (
              <div className="cln-native-banner cln-native-required" data-testid="cleanup-native-required">
                <FolderLock className="w-4 h-4 shrink-0" />
                <div>
                  <strong>{t(locale, 'Native Clean Room required', 'مطلوب غرفة تنظيف أصلية')}</strong>
                  <p>
                    {t(
                      locale,
                      'This is a browser preview. The read-only Cleanup bridge is unavailable, so no candidate, size, vault, recycle or report number is substituted. Open the native Electron app to measure this device.',
                      'هذه معاينة متصفح. جسر التنظيف للقراءة فقط غير متاح، لذلك لا تُستبدل أرقام المرشحين أو الأحجام أو الحجر أو السلة أو التقارير. افتح تطبيق Electron الأصلي لقياس هذا الجهاز.'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="cln-native-banner" data-testid="cleanup-native-banner">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <div className="min-w-0">
                  <strong>{t(locale, 'Measured Clean Room', 'غرفة تنظيف مقيسة')}</strong>
                  <p>
                    {inventory
                      ? `${formatCount(inventory.candidates.length)} ${t(locale, 'candidates', 'مرشحًا')} · ${formatCount(inventory.coverage?.rootsScanned || 0)} ${t(locale, 'roots measured', 'جذرًا مقيسًا')} · ${formatTimestamp(inventory.observedAt, locale)} · ${t(locale, 'mutation', 'التغيير')}: ${inventory.mutation}`
                      : t(locale, 'Reading the read-only coordinator…', 'جارٍ قراءة المنسق للقراءة فقط…')}
                  </p>
                </div>
                <span className="cln-chip cln-chip-good ml-auto shrink-0">{t(locale, 'MEASURED', 'مقيس')}</span>
                {warm ? (
                  <span className="cln-chip cln-chip-warn shrink-0">
                    {formatCount(inventory?.warnings.length || 0)} {t(locale, 'warnings', 'تحذيرات')}
                  </span>
                ) : null}
              </div>
            )}

            <div className="cln-work-grid">
              <CandidateRegister
                locale={locale}
                candidates={filteredCandidates}
                filters={filters}
                onChangeFilters={patchFilters}
                onResetFilters={() => setFilters(DEFAULT_FILTERS)}
                selectedId={selectedId}
                onSelect={setSelectedId}
                checkedIds={checkedIds}
                onToggleCheck={toggleCheck}
                onToggleAll={toggleAllVisible}
                onSelectSafeDefaults={selectSafeDefaults}
                loading={controller.loading}
                scanning={controller.scanning}
              />
              <CandidateInspector
                locale={locale}
                candidate={selectedCandidate}
                checkedCandidates={checkedCandidates}
                busy={controller.busy === 'plan'}
                planStaged={Boolean(controller.plan)}
                onStagePlan={(ids) => void stagePlan(ids, 'quarantine')}
                onOpenService={openService}
              />
            </div>

            <ServiceRail
              locale={locale}
              controller={controller}
              selectedCount={checkedIds.size}
              onOpenService={setActiveService}
            />

            <div className="cln-foot-strip">
              <span>
                <Database className="w-3 h-3" />
                {t(locale, 'Source', 'المصدر')}: {t(locale, 'Allowlisted temp, browser cache, log, Recycle Bin and servicing roots', 'جذور مؤقتة وذاكرة متصفح وسجلات وسلة محذوفات وخدمة مسموح بها')}
              </span>
              <span>
                <Lock className="w-3 h-3" />
                {t(locale, 'No delete, move, recycle-empty, DISM, task or restore mutation exists in Mission 08.', 'لا توجد كتابة حذف أو نقل أو إفراغ سلة أو DISM أو مهمة أو استعادة في المهمة 08.')}
              </span>
              {inventory?.coverage ? (
                <span>
                  <ShieldCheck className="w-3 h-3" />
                  {t(locale, 'coverage', 'التغطية')}: {formatCount(inventory.coverage.filesMeasured)} {t(locale, 'files', 'ملفًا')} · {formatCount(inventory.coverage.skippedLinks)} {t(locale, 'links skipped', 'رابطًا متجاوزًا')}
                </span>
              ) : null}
            </div>

          </CommandCanvas>
          </main>

          <footer className="cln-actionbar" data-testid="cleanup-actionbar">
            <div className="cln-actionbar-summary">
              <strong>
                {formatCount(checkedIds.size)} {t(locale, 'selected', 'محدد')}
              </strong>
              <span className="cln-mono">{formatBytes(checkedBytes)}</span>
              {reviewCount ? (
                <span className="cln-chip cln-chip-warn">
                  {formatCount(reviewCount)} {t(locale, 'need review', 'تحتاج مراجعة')}
                </span>
              ) : null}
            </div>
            <div className="cln-actionbar-actions">
              <button data-testid="cleanup-live-vault" className="cln-btn cln-btn-primary" onClick={()=>setActiveService('cleanup-temp-preview')}>{locale==='ar'?'خزنة حية آمنة':'Live Safety Vault'}</button>
              <button
                type="button"
                className="cln-btn cln-btn-primary"
                onClick={reviewSelection}
                disabled={!checkedIds.size || controller.busy === 'plan'}
              >
                <Lock className="w-3.5 h-3.5" />
                {t(locale, 'Review selected items', 'مراجعة العناصر المحددة')}
              </button>
              <button type="button" className="cln-btn cln-btn-ghost" onClick={() => setActiveService('cleanup-reports')}>
                <Save className="w-3.5 h-3.5" />
                {t(locale, 'Save report', 'حفظ التقرير')}
              </button>
              <button type="button" className="cln-btn cln-btn-ghost" onClick={adjustScope}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {t(locale, 'Adjust scope', 'ضبط النطاق')}
              </button>
              <button
                type="button"
                className="cln-btn cln-btn-danger"
                onClick={() => setCheckedIds(new Set())}
                disabled={!checkedIds.size}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t(locale, 'Cancel selection', 'إلغاء التحديد')}
              </button>
            </div>
          </footer>
        </div>
      </div>

      {activeService ? (
        workbenchMode === 'side' ? (
          <div className="fixed end-3 top-14 bottom-20 z-50" style={{ width: `${workbenchWidth}px` }} data-testid="cleanup-workbench-side-shell">
            <ServiceWorkbenchHost
              serviceId={activeService}
              title={cleanupServiceLabel(activeService)}
              subtitle={t(locale, 'Measured cleanup context · review only', 'سياق التنظيف المقيس · للمراجعة فقط')}
              locale={locale}
              mode="side"
              onModeChange={setWorkbenchMode}
              onClose={closeWorkbench}
              onResize={(width) => setWorkbenchWidth(width)}
              minWidth={340}
              maxWidth={720}
              testId="cleanup-workbench"
              toolSelector={cleanupWorkbenchToolSelector}
              footer={<span className="text-amber-300">{t(locale, 'Review only · no delete, move or quarantine', 'مراجعة فقط · لا حذف أو نقل أو حجر')}</span>}
            >
              {renderCleanupServiceBody()}
            </ServiceWorkbenchHost>
          </div>
        ) : (
          <div className="fixed inset-x-3 top-14 bottom-20 z-50" data-testid="cleanup-workbench-expanded-shell">
            <ServiceWorkbenchHost
              serviceId={activeService}
              title={cleanupServiceLabel(activeService)}
              subtitle={t(locale, 'Measured cleanup context · review only', 'سياق التنظيف المقيس · للمراجعة فقط')}
              locale={locale}
              mode="expanded"
              onModeChange={setWorkbenchMode}
              onClose={closeWorkbench}
              testId="cleanup-workbench-expanded"
              toolSelector={cleanupWorkbenchToolSelector}
              footer={<span className="text-amber-300">{t(locale, 'Review only · no delete, move or quarantine', 'مراجعة فقط · لا حذف أو نقل أو حجر')}</span>}
            >
              {renderCleanupServiceBody()}
            </ServiceWorkbenchHost>
          </div>
        )
      ) : null}

      {planOpen && controller.plan ? (
        <PlanGate
          locale={locale}
          plan={controller.plan}
          onClose={() => {
            setPlanOpen(false);
            controller.dismissPlan();
          }}
          onNotice={controller.showNotice}
        />
      ) : null}
    </div>
  );
}

export default CleanupPage;
