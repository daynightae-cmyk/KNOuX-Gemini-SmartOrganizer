import { CommandCanvas } from '../visual/CommandCanvas';
/**
 * KNOuX SmartOrganizer — Boot Control (Mission 09).
 *
 * Browser previews render an explicit native-required state. In Electron every
 * autorun row, service, task, boot event and plan value comes from the
 * read-only StartupBridge. No design fixtures are imported here and no registry,
 * task, service, startup-folder or journal write is available.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FolderLock,
  Lock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { StartupEntry, StartupPlan } from '../../shared/native-contracts';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXSidebar, KNOuXTitleBar } from '../components/shell/KNOuXShellComponents';
import { StartupHero } from '../startup/StartupHero';
import { AutorunRegister } from '../startup/AutorunRegister';
import { AutorunInspector } from '../startup/AutorunInspector';
import { ServiceRail } from '../startup/ServiceRail';
import { ServiceWorkspace } from '../startup/ServiceWorkspace';
import { PlanGate } from '../startup/PlanGate';
import { ServiceWorkbenchHost, type WorkbenchMode } from '../components/workbench/ServiceWorkbenchHost';
import { useStartup } from '../startup/useStartup';
import {
  DEFAULT_FILTERS,
  SERVICE_FALLBACK_META,
  SERVICE_IDS,
  filterEntries,
  formatCount,
  formatTimestamp,
  t,
} from '../startup/model';
import type { StartupFilters, StartupLocale, StartupServiceId } from '../startup/model';
import '../startup.css';

export interface StartupPageProps {
  onNavigateSection?: (section: string) => void;
}

export function StartupPage({ onNavigateSection }: StartupPageProps) {
  const { navigateTo, locale: globalLocale, toggleLocale } = useNavigation();
  const [localLocale, setLocalLocale] = useState<StartupLocale | null>(null);
  const locale: StartupLocale = localLocale || (globalLocale === 'ar' ? 'ar' : 'en');
  const controller = useStartup();
  const { inventory } = controller;
  const entries = useMemo<StartupEntry[]>(() => inventory?.entries || [], [inventory]);

  const [filters, setFilters] = useState<StartupFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [activeService, setActiveService] = useState<StartupServiceId | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [workbenchMode, setWorkbenchMode] = useState<WorkbenchMode>(() => {
    try { return localStorage.getItem('knoux.startup.workbench.mode') === 'expanded' ? 'expanded' : 'side'; } catch { return 'side'; }
  });
  const [workbenchWidth, setWorkbenchWidth] = useState<number>(() => {
    try { const value = Number(localStorage.getItem('knoux.startup.workbench.width')); return Number.isFinite(value) && value >= 340 ? Math.min(720, value) : 560; } catch { return 560; }
  });
  useEffect(() => {
    try {
      localStorage.setItem('knoux.startup.workbench.mode', workbenchMode);
      localStorage.setItem('knoux.startup.workbench.width', String(workbenchWidth));
    } catch {
      // In-memory only when storage is unavailable.
    }
  }, [workbenchMode, workbenchWidth]);

  const filteredEntries = useMemo(() => filterEntries(entries, filters), [entries, filters]);
  const counts = useMemo(() => {
    const next = { all: entries.length, 'registry-run': 0, 'registry-runonce': 0, 'startup-folder': 0, 'scheduled-task': 0 };
    for (const entry of entries) next[entry.sourceKind] += 1;
    return next;
  }, [entries]);
  const selectedEntry = entries.find((entry) => entry.id === selectedId) || null;
  const checkedEntries = entries.filter((entry) => checkedIds.has(entry.id));
  const protectedChecked = checkedEntries.filter((entry) => entry.protection === 'protected').length;
  const elevationChecked = checkedEntries.filter((entry) => entry.elevationRequired).length;
  const unsignedChecked = checkedEntries.filter((entry) => entry.signature === 'unsigned').length;

  useEffect(() => {
    if (!entries.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => (current && entries.some((entry) => entry.id === current) ? current : entries[0].id));
  }, [entries]);

  useEffect(() => {
    setCheckedIds((current) => {
      if (!current.size) return current;
      const next = new Set([...current].filter((id) => entries.some((entry) => entry.id === id)));
      return next.size === current.size ? current : next;
    });
  }, [entries]);

  const handleNavigate = (section: string) => {
    onNavigateSection?.(section);
  };

  const patchFilters = (next: Partial<StartupFilters>) => {
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
      const everyVisible = filteredEntries.length > 0 && filteredEntries.every((entry) => current.has(entry.id));
      if (everyVisible) {
        const next = new Set(current);
        for (const entry of filteredEntries) next.delete(entry.id);
        return next;
      }
      return new Set([...current, ...filteredEntries.map((entry) => entry.id)]);
    });
  };

  const applySelection = (ids: string[]) => {
    setCheckedIds(new Set(ids));
    if (ids.length) setSelectedId(ids[0]);
  };

  const stagePlan = async (ids: string[], mode: StartupPlan['mode'], delayMinutes?: number) => {
    if (!ids.length) {
      controller.showNotice(t(locale, 'Select at least one measured startup entry first.', 'حدد مدخل بدء مقيسًا واحدًا على الأقل أولًا.'));
      return;
    }
    const plan = await controller.stagePlan(ids, mode, delayMinutes);
    if (plan) setPlanOpen(true);
  };

  const reviewSelection = () => {
    const ids = checkedIds.size ? [...checkedIds] : selectedEntry ? [selectedEntry.id] : [];
    const enabled = checkedIds.size
      ? checkedEntries.some((entry) => entry.state === 'enabled')
      : selectedEntry?.state === 'enabled';
    void stagePlan(ids, enabled ? 'disable' : 'enable');
  };

  const adjustScope = () => {
    setFilters(DEFAULT_FILTERS);
    controller.showNotice(t(locale, 'Scope filters reset over the measured register. Nothing was changed.', 'أُعيد ضبط مرشحات النطاق على السجل المقيس. لم يتغير شيء.'));
    window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('[data-testid="startup-register"] input[type="search"]');
      input?.focus();
    }, 60);
  };

  const openService = (serviceId: string) => {
    if ((SERVICE_IDS as readonly string[]).includes(serviceId)) {
      setActiveService(serviceId as StartupServiceId);
    } else {
      controller.showNotice(t(locale, 'That startup service is not registered in this contract.', 'خدمة بدء التشغيل هذه غير مسجلة في هذا العقد.'));
    }
  };

  const errorText = controller.actionError ? `${controller.actionError.code}: ${controller.actionError.message}` : null;
  const boot = inventory?.boot;
  const serviceCount = inventory?.services.length || 0;
  const taskCount = inventory?.tasks.length || 0;

  const closeWorkbench = () => {
    if (!planOpen) setActiveService(null);
  };

  const startupServiceLabel = (service: StartupServiceId): string => {
    const capability = controller.capabilities?.services.find((entry) => entry.id === service);
    if (capability) return locale === 'ar' ? capability.labelAr : capability.labelEn;
    const fallback = SERVICE_FALLBACK_META[service];
    return locale === 'ar' ? fallback.titleAr : fallback.titleEn;
  };

  const renderStartupServiceBody = () => activeService ? (
    <ServiceWorkspace
      service={activeService}
      locale={locale}
      controller={controller}
      entries={entries}
      selectedEntry={selectedEntry}
      selectedIds={[...checkedIds]}
      onSelectEntry={setSelectedId}
      onApplySelection={applySelection}
      onStagePlan={(ids, mode, delayMinutes) => void stagePlan(ids, mode, delayMinutes)}
      onClose={closeWorkbench}
      onNotice={controller.showNotice}
      onNavigateSection={handleNavigate}
      embedded
    />
  ) : null;

  const startupWorkbenchToolSelector = (
    <select
      data-testid="startup-workbench-tool-select"
      aria-label={t(locale, 'Switch startup service', 'تبديل خدمة الإقلاع')}
      value={activeService || ''}
      onChange={(event) => {
        if ((SERVICE_IDS as readonly string[]).includes(event.target.value)) {
          setActiveService(event.target.value as StartupServiceId);
        }
      }}
      className="max-w-[150px] rounded border border-[#173866] bg-[#08162b] px-1.5 py-1 text-[10px] text-slate-200"
    >
      {SERVICE_IDS.map((id) => (
        <option key={id} value={id}>{startupServiceLabel(id)}</option>
      ))}
    </select>
  );

  return (
    <div className={`stp-viewport relative text-slate-100 font-sans select-none ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      <KNOuXTitleBar
        sectionName={t(locale, 'Startup', 'بدء التشغيل')}
        sectionSubtitle={t(locale, 'Measured Boot Control', 'تحكم الإقلاع المقيس')}
        onNavigateHome={() => handleNavigate('home')}
        searchPlaceholder={t(locale, 'Search measured autoruns… (Ctrl+K)', 'ابحث في مداخل البدء المقيسة… (Ctrl+K)')}
        isArabic={locale === 'ar'}
        onToggleArabic={() => {
          toggleLocale();
          setLocalLocale(locale === 'ar' ? 'en' : 'ar');
        }}
        onOpenSettings={() => handleNavigate('settings')}
      />

      {controller.notice ? (
        <div className="stp-toast stp-toast-good" role="status">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{controller.notice}</span>
          <button type="button" onClick={controller.clearNotice} aria-label={t(locale, 'Dismiss', 'إغلاق')}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {errorText ? (
        <div className="stp-toast stp-toast-bad" role="alert">
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
        <KNOuXSidebar activeSection="startup" onNavigate={handleNavigate} isArabic={locale === 'ar'} />

        <div className="flex-1 flex flex-col min-h-0">
          <main
            data-testid="startup-workspace"
            className="stp-main flex-1 min-h-0 overflow-y-auto knx-custom-scrollbar"
          >
          <CommandCanvas locale={locale} heroTypes={[StartupHero]} toolTypes={[ServiceRail]}>
            <StartupHero locale={locale} controller={controller} onOpenService={openService} />

            {!controller.nativeAvailable ? (
              <div className="stp-native-banner stp-native-required" data-testid="startup-native-required">
                <FolderLock className="w-4 h-4 shrink-0" />
                <div>
                  <strong>{t(locale, 'Native Boot Control required', 'مطلوب تحكم إقلاع أصلي')}</strong>
                  <p>
                    {t(
                      locale,
                      'This is a browser preview. The read-only Startup bridge is unavailable, so no autorun, service, task, boot event or saving number is substituted. Open the native Electron app to measure this device.',
                      'هذه معاينة متصفح. جسر بدء التشغيل للقراءة فقط غير متاح، لذلك لا تُستبدل أرقام مداخل البدء أو الخدمات أو المهام أو أحداث الإقلاع أو التوفير. افتح تطبيق Electron الأصلي لقياس هذا الجهاز.'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="stp-native-banner" data-testid="startup-native-banner">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <div className="min-w-0">
                  <strong>{t(locale, 'Measured Boot Control', 'تحكم الإقلاع المقيس')}</strong>
                  <p>
                    {inventory
                      ? `${formatCount(inventory.entries.length)} ${t(locale, 'autoruns', 'مدخل بدء')} · ${formatCount(serviceCount)} ${t(locale, 'services', 'خدمة')} · ${formatCount(taskCount)} ${t(locale, 'logon tasks', 'مهمة دخول')} · ${formatTimestamp(inventory.observedAt, locale)} · ${t(locale, 'mutation', 'التغيير')}: ${inventory.mutation}`
                      : t(locale, 'Reading the read-only coordinator…', 'جارٍ قراءة المنسق للقراءة فقط…')}
                  </p>
                </div>
                <span className="stp-chip stp-chip-good ml-auto shrink-0">{t(locale, 'MEASURED', 'مقيس')}</span>
                {inventory?.warnings?.length ? (
                  <span className="stp-chip stp-chip-warn shrink-0">
                    {formatCount(inventory.warnings.length)} {t(locale, 'warnings', 'تحذيرات')}
                  </span>
                ) : null}
              </div>
            )}

            <div className="stp-work-grid">
              <AutorunRegister
                locale={locale}
                entries={filteredEntries}
                counts={counts}
                filters={filters}
                onChangeFilters={patchFilters}
                onResetFilters={() => setFilters(DEFAULT_FILTERS)}
                selectedId={selectedId}
                onSelect={setSelectedId}
                checkedIds={checkedIds}
                onToggleCheck={toggleCheck}
                onToggleAll={toggleAllVisible}
                loading={controller.loading}
                scanning={controller.scanning}
                totalCount={inventory?.entries.length || 0}
              />
              <AutorunInspector
                locale={locale}
                entry={selectedEntry}
                checkedEntries={checkedEntries}
                busy={controller.busy === 'plan'}
                planStaged={Boolean(controller.plan)}
                onStagePlan={(ids, mode) => void stagePlan(ids, mode)}
                onOpenService={openService}
                onNotice={controller.showNotice}
              />
            </div>

            <ServiceRail
              locale={locale}
              controller={controller}
              selectedCount={checkedIds.size}
              onOpenService={setActiveService}
            />

            <div className="stp-foot-strip">
              <span>
                <Database className="w-3 h-3" />
                {t(locale, 'Source', 'المصدر')}: {t(locale, 'HKCU/HKLM Run, startup folders, logon tasks and boot diagnostics events', 'Run في HKCU/HKLM ومجلدات البدء ومهام الدخول وأحداث تشخيص الإقلاع')}
              </span>
              <span>
                <Lock className="w-3 h-3" />
                {t(locale, 'No registry, task, service, startup-folder or journal write exists in Mission 09.', 'لا توجد كتابة تسجيل أو مهمة أو خدمة أو مجلد بدء أو سجل في المهمة 09.')}
              </span>
              {inventory?.coverage ? (
                <span>
                  <ShieldCheck className="w-3 h-3" />
                  {t(locale, 'coverage', 'التغطية')}: {formatCount(inventory.coverage.registryKeys)} {t(locale, 'keys', 'مفتاح')} · {formatCount(inventory.coverage.startupFolders)} {t(locale, 'folders', 'مجلد')} · {formatCount(inventory.coverage.scheduledTasks)} {t(locale, 'tasks', 'مهمة')} · {formatCount(inventory.coverage.servicesMeasured)} {t(locale, 'services', 'خدمة')}
                </span>
              ) : null}
              {boot?.available ? (
                <span>
                  <RefreshCw className="w-3 h-3" />
                  {t(locale, 'boot events', 'أحداث الإقلاع')}: {formatCount(boot.eventCount)} · {t(locale, 'attributed', 'منسوبة')}: {formatCount(controller.impact?.attributed.length || 0)}
                </span>
              ) : null}
            </div>

          </CommandCanvas>
          </main>

          <footer className="stp-actionbar" data-testid="startup-actionbar">
            <div className="stp-actionbar-summary">
              <strong>
                {formatCount(checkedIds.size)} {t(locale, 'selected', 'محدد')}
              </strong>
              <span className="stp-mono">{formatCount(inventory?.entries.length || 0)} {t(locale, 'measured', 'مقيس')}</span>
              {protectedChecked ? (
                <span className="stp-chip stp-chip-bad">
                  {formatCount(protectedChecked)} {t(locale, 'protected', 'محمي')}
                </span>
              ) : null}
              {elevationChecked ? (
                <span className="stp-chip stp-chip-warn">
                  {formatCount(elevationChecked)} {t(locale, 'elevation', 'رفع صلاحيات')}
                </span>
              ) : null}
              {unsignedChecked ? (
                <span className="stp-chip stp-chip-muted">
                  {formatCount(unsignedChecked)} {t(locale, 'unsigned', 'غير موقّع')}
                </span>
              ) : null}
            </div>
            <div className="stp-actionbar-actions">
              <button
                type="button"
                className="stp-btn stp-btn-primary"
                onClick={reviewSelection}
                disabled={(!checkedIds.size && !selectedEntry) || controller.busy === 'plan'}
              >
                <Lock className="w-3.5 h-3.5" />
                {t(locale, 'Stage review', 'تهيئة المراجعة')}
              </button>
              <button
                type="button"
                className="stp-btn stp-btn-ghost"
                onClick={() => setActiveService('startup-delay')}
                disabled={!checkedIds.size && !selectedEntry}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {t(locale, 'Plan a delay', 'تخطيط تأخير')}
              </button>
              <button type="button" className="stp-btn stp-btn-ghost" onClick={() => setActiveService('startup-restore')}>
                <RotateCcw className="w-3.5 h-3.5" />
                {t(locale, 'Restore & journal', 'الاستعادة والسجل')}
              </button>
              <button type="button" className="stp-btn stp-btn-ghost" onClick={adjustScope}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {t(locale, 'Adjust scope', 'ضبط النطاق')}
              </button>
              <button
                type="button"
                className="stp-btn stp-btn-danger"
                onClick={() => setCheckedIds(new Set())}
                disabled={!checkedIds.size}
              >
                <X className="w-3.5 h-3.5" />
                {t(locale, 'Cancel selection', 'إلغاء التحديد')}
              </button>
            </div>
          </footer>
        </div>
      </div>

      {activeService ? (
        workbenchMode === 'side' ? (
          <div className="fixed end-3 top-14 bottom-20 z-50" style={{ width: `${workbenchWidth}px` }} data-testid="startup-workbench-side-shell">
            <ServiceWorkbenchHost
              serviceId={activeService}
              title={startupServiceLabel(activeService)}
              subtitle={t(locale, 'Measured boot context · read-only', 'سياق الإقلاع المقيس · للقراءة فقط')}
              locale={locale}
              mode="side"
              onModeChange={setWorkbenchMode}
              onClose={closeWorkbench}
              onResize={(width) => setWorkbenchWidth(width)}
              minWidth={340}
              maxWidth={720}
              testId="startup-workbench"
              toolSelector={startupWorkbenchToolSelector}
              footer={<span className="text-amber-300">{t(locale, 'Read-only · no startup, task, service or registry write', 'للقراءة فقط · لا كتابة إقلاع أو مهمة أو خدمة أو سجل')}</span>}
            >
              {renderStartupServiceBody()}
            </ServiceWorkbenchHost>
          </div>
        ) : (
          <div className="fixed inset-x-3 top-14 bottom-20 z-50" data-testid="startup-workbench-expanded-shell">
            <ServiceWorkbenchHost
              serviceId={activeService}
              title={startupServiceLabel(activeService)}
              subtitle={t(locale, 'Measured boot context · read-only', 'سياق الإقلاع المقيس · للقراءة فقط')}
              locale={locale}
              mode="expanded"
              onModeChange={setWorkbenchMode}
              onClose={closeWorkbench}
              testId="startup-workbench-expanded"
              toolSelector={startupWorkbenchToolSelector}
              footer={<span className="text-amber-300">{t(locale, 'Read-only · no startup, task, service or registry write', 'للقراءة فقط · لا كتابة إقلاع أو مهمة أو خدمة أو سجل')}</span>}
            >
              {renderStartupServiceBody()}
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

export default StartupPage;
