import { CommandCanvas } from '../visual/CommandCanvas';
/**
 * KNOuX SmartOrganizer — Applications Software Register (Mission 05).
 *
 * Browser previews render an explicit native-required state. In Electron, every
 * row, signature, size, candidate and package comes from the read-only native
 * Applications coordinator. No design fixtures are imported here.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FolderLock,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { AppRecord } from '../../shared/native-contracts';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXSidebar, KNOuXTitleBar } from '../components/shell/KNOuXShellComponents';
import { ApplicationsHero } from '../apps/ApplicationsHero';
import { AppRegister } from '../apps/AppRegister';
import { AppDossier } from '../apps/AppDossier';
import { ApplicationServices } from '../apps/ApplicationServices';
import { AppServiceWorkspace } from '../apps/AppServiceWorkspace';
import { DEFAULT_FILTERS, filterApps, formatBytes, formatCount, formatTimestamp, serviceTitle, t } from '../apps/model';
import type { AppsFilters, AppsLocale } from '../apps/model';
import { DOMAIN_SERVICES_META } from '../apps/catalog';
import type { DomainServiceKey } from '../apps/catalog';
import { ServiceWorkbenchHost, type WorkbenchMode } from '../components/workbench/ServiceWorkbenchHost';
import { useApplications } from '../apps/useApplications';
import '../applications.css';

export interface ApplicationsPageProps {
  onNavigateSection?: (section: string) => void;
}

function appsErrorMessage(error: { code: string; message: string } | null, locale: AppsLocale): string | null {
  if (!error) return null;
  return `${error.code}: ${error.message}`;
}

export function ApplicationsPage({ onNavigateSection }: ApplicationsPageProps) {
  const { navigateTo, locale: globalLocale, toggleLocale } = useNavigation();
  const [localLocale, setLocalLocale] = useState<AppsLocale | null>(null);
  const locale: AppsLocale = localLocale || (globalLocale === 'ar' ? 'ar' : 'en');
  const controller = useApplications();
  const { inventory } = controller;
  const apps = useMemo<AppRecord[]>(() => inventory?.apps || [], [inventory]);

  const [filters, setFilters] = useState<AppsFilters>(DEFAULT_FILTERS);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [activeService, setActiveService] = useState<DomainServiceKey | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [workbenchMode, setWorkbenchMode] = useState<WorkbenchMode>(() => {
    try { return localStorage.getItem('knoux.apps.workbench.mode') === 'expanded' ? 'expanded' : 'side'; } catch { return 'side'; }
  });
  const [workbenchWidth, setWorkbenchWidth] = useState<number>(() => {
    try { const value = Number(localStorage.getItem('knoux.apps.workbench.width')); return Number.isFinite(value) && value >= 360 ? Math.min(760, value) : 540; } catch { return 540; }
  });
  useEffect(() => {
    try {
      localStorage.setItem('knoux.apps.workbench.mode', workbenchMode);
      localStorage.setItem('knoux.apps.workbench.width', String(workbenchWidth));
    } catch {
      // In-memory only when storage is unavailable.
    }
  }, [workbenchMode, workbenchWidth]);

  const filteredApps = useMemo(() => filterApps(apps, filters), [apps, filters]);
  const selectedApp = apps.find((app) => app.id === selectedAppId) || null;

  useEffect(() => {
    if (!apps.length) {
      setSelectedAppId(null);
      return;
    }
    setSelectedAppId((current) => (current && apps.some((app) => app.id === current) ? current : apps[0].id));
  }, [apps]);

  useEffect(() => {
    setCheckedIds((current) => {
      if (!current.size) return current;
      const next = new Set([...current].filter((id) => apps.some((app) => app.id === id)));
      return next.size === current.size ? current : next;
    });
  }, [apps]);

  const handleNavigate = (section: string) => {
    onNavigateSection?.(section);
  };

  const patchFilters = (next: Partial<AppsFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  const toggleCheck = (appId: string) => {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setCheckedIds((current) => {
      const everyVisible = filteredApps.length > 0 && filteredApps.every((app) => current.has(app.id));
      if (everyVisible) {
        const next = new Set(current);
        for (const app of filteredApps) next.delete(app.id);
        return next;
      }
      return new Set([...current, ...filteredApps.map((app) => app.id)]);
    });
  };

  const openPlan = async (appIds: string[]) => {
    const built = await controller.reviewPlan(appIds);
    if (built) setPlanOpen(true);
  };

  const buildPlanFromSelection = () => {
    const ids = checkedIds.size ? [...checkedIds] : selectedApp ? [selectedApp.id] : [];
    void openPlan(ids);
  };

  const exportPlan = () => {
    if (!controller.plan) return;
    const payload = {
      contract: 'apps.v1',
      exportedAt: new Date().toISOString(),
      readOnly: true,
      mutation: 'none',
      plan: controller.plan,
      disclaimer:
        'This is a non-executable review plan. No uninstall, update, association or startup change was performed.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `knoux-app-plan-${controller.plan.planId.slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    controller.showNotice('Immutable review plan exported as JSON.');
  };

  const errorText = appsErrorMessage(controller.actionError, locale);
  const warm = Boolean(inventory?.warnings?.length);

  const closeWorkbench = () => {
    if (!planOpen) setActiveService(null);
  };

  const renderAppServiceBody = () => activeService ? (
    <AppServiceWorkspace
      service={activeService}
      locale={locale}
      controller={controller}
      selectedApp={selectedApp}
      selectedIds={[...checkedIds]}
      onSelectApp={setSelectedAppId}
      onClose={closeWorkbench}
      onOpenPlan={() => setPlanOpen(true)}
      embedded
    />
  ) : null;

  const appsWorkbenchToolSelector = (
    <select
      data-testid="apps-workbench-tool-select"
      aria-label={t(locale, 'Switch application service', 'تبديل خدمة التطبيقات')}
      value={activeService || ''}
      onChange={(event) => setActiveService(event.target.value as DomainServiceKey)}
      className="max-w-[150px] rounded border border-[#173866] bg-[#08162b] px-1.5 py-1 text-[10px] text-slate-200"
    >
      {DOMAIN_SERVICES_META.map((entry) => (
        <option key={entry.key} value={entry.key}>{serviceTitle(entry.key, locale)}</option>
      ))}
    </select>
  );

  return (
    <div className={`apps-viewport relative text-slate-100 font-sans select-none ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      <KNOuXTitleBar
        sectionName={t(locale, 'Applications', 'التطبيقات')}
        sectionSubtitle={t(locale, 'Measured software register', 'سجل برمجيات مقيس')}
        onNavigateHome={() => handleNavigate('home')}
        searchPlaceholder={t(locale, 'Search installed software… (Ctrl+K)', 'ابحث في البرامج المثبتة… (Ctrl+K)')}
        isArabic={locale === 'ar'}
        onToggleArabic={() => {
          toggleLocale();
          setLocalLocale(locale === 'ar' ? 'en' : 'ar');
        }}
        onOpenSettings={() => handleNavigate('settings')}
      />

      {controller.notice ? (
        <div className="apps-toast apps-toast-good" role="status">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{controller.notice}</span>
          <button type="button" onClick={controller.clearNotice} aria-label={t(locale, 'Dismiss', 'إغلاق')}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {errorText ? (
        <div className="apps-toast apps-toast-bad" role="alert">
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
        <KNOuXSidebar activeSection="applications" onNavigate={handleNavigate} isArabic={locale === 'ar'} />

        <div className="flex-1 flex flex-col min-h-0">
          <main
            data-testid="apps-workspace"
            className="apps-main flex-1 min-h-0 overflow-y-auto knx-custom-scrollbar"
          >
          <CommandCanvas locale={locale} heroTypes={[ApplicationsHero]} toolTypes={[ApplicationServices]}>
            <ApplicationsHero
              locale={locale}
              controller={controller}
              selectedCount={checkedIds.size}
              onBuildPlan={buildPlanFromSelection}
              onOpenService={setActiveService}
            />

            {!controller.nativeAvailable ? (
              <div className="apps-native-banner apps-native-required" data-testid="apps-native-required">
                <FolderLock className="w-4 h-4 shrink-0" />
                <div>
                  <strong>{t(locale, 'Native inventory required', 'مطلوب جرد أصلي')}</strong>
                  <p>
                    {t(
                      locale,
                      'This is a browser preview. The read-only Applications bridge is unavailable, so no application, publisher, size or signature numbers are shown. Open the native Electron app to measure this device.',
                      'هذه معاينة متصفح. جسر التطبيقات للقراءة فقط غير متاح، لذلك لا تُعرض أرقام تطبيقات أو ناشرين أو أحجام أو تواقيع. افتح تطبيق Electron الأصلي لقياس هذا الجهاز.'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="apps-native-banner" data-testid="apps-native-banner">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <div className="min-w-0">
                  <strong>{t(locale, 'Measured native inventory', 'جرد أصلي مقيس')}</strong>
                  <p>
                    {inventory
                      ? `${formatCount(inventory.kpis.installed)} ${t(locale, 'applications', 'تطبيقًا')} · ${formatCount(inventory.coverage.registryItems + inventory.coverage.appxItems)} ${t(locale, 'source records', 'سجل مصدر')} · ${formatTimestamp(inventory.observedAt, locale)} · ${formatCount(inventory.durationMs)} ms`
                      : t(locale, 'Reading the registry and Appx/MSIX providers…', 'جارٍ قراءة السجل ومزوّدي Appx/MSIX…')}
                  </p>
                </div>
                <span className="apps-chip apps-chip-good ml-auto shrink-0">{t(locale, 'MEASURED', 'مقيس')}</span>
                {warm ? (
                  <span className="apps-chip apps-chip-warn shrink-0">
                    {formatCount(inventory?.warnings.length)} {t(locale, 'warnings', 'تحذيرات')}
                  </span>
                ) : null}
              </div>
            )}

            <div className="apps-work-grid">
              <AppRegister
                locale={locale}
                apps={filteredApps}
                totalCount={apps.length}
                filters={filters}
                onChangeFilters={patchFilters}
                onResetFilters={() => setFilters(DEFAULT_FILTERS)}
                selectedAppId={selectedAppId}
                onSelectApp={setSelectedAppId}
                checkedIds={checkedIds}
                onToggleCheck={toggleCheck}
                onToggleAll={toggleAllVisible}
                signatures={controller.signatures}
                loading={controller.loading}
              />
              <AppDossier
                locale={locale}
                app={selectedApp}
                signature={selectedApp ? controller.signatures[selectedApp.id] || null : null}
                size={selectedApp ? controller.sizes[selectedApp.id] || null : null}
                signatureBusy={Boolean(selectedApp && controller.signatureBusyId === selectedApp.id)}
                sizeBusy={controller.sizesBusy && Boolean(selectedApp && controller.sizesStatus?.operationId)}
                onVerifySignature={(appId) => void controller.verifySignature(appId)}
                onMeasureSize={(appId) => void controller.measureSizes([appId])}
                onReviewPlan={(appId) => void openPlan([appId])}
                onOpenService={(service) => setActiveService(service as DomainServiceKey)}
              />
            </div>

            <ApplicationServices
              locale={locale}
              controller={controller}
              selectedCount={checkedIds.size}
              onOpenService={setActiveService}
            />

            <div className="apps-foot-strip">
              <span>
                <Database className="w-3 h-3" />
                {t(locale, 'Source', 'المصدر')}: {t(locale, 'Uninstall registry + Get-AppxPackage + Win32_StartupCommand', 'سجل إلغاء التثبيت + Get-AppxPackage + Win32_StartupCommand')}
              </span>
              <span>
                <Lock className="w-3 h-3" />
                {t(locale, 'No uninstall, update, association or startup mutation exists in Mission 05.', 'لا توجد كتابة إزالة أو تحديث أو ارتباط أو إقلاع في المهمة 05.')}
              </span>
              {inventory ? (
                <span>
                  <ShieldCheck className="w-3 h-3" />
                  {t(locale, 'coverage', 'التغطية')}: {formatCount(inventory.coverage.existenceChecked)} {t(locale, 'paths checked', 'مسارًا مفحوصًا')}
                </span>
              ) : null}
            </div>

          </CommandCanvas>
          </main>
        </div>
      </div>

      {activeService ? (
        workbenchMode === 'side' ? (
          <div className="fixed end-3 top-14 bottom-5 z-50" style={{ width: `${workbenchWidth}px` }} data-testid="apps-workbench-side-shell">
            <ServiceWorkbenchHost
              serviceId={activeService}
              title={serviceTitle(activeService, locale)}
              subtitle={t(locale, 'Measured applications context · read-only', 'سياق التطبيقات المقيس · للقراءة فقط')}
              locale={locale}
              mode="side"
              onModeChange={setWorkbenchMode}
              onClose={closeWorkbench}
              onResize={(width) => setWorkbenchWidth(width)}
              minWidth={360}
              maxWidth={760}
              testId="apps-workbench"
              toolSelector={appsWorkbenchToolSelector}
              footer={<span className="text-amber-300">{t(locale, 'Review only · no uninstall, update or association write', 'مراجعة فقط · لا إزالة أو تحديث أو كتابة ارتباط')}</span>}
            >
              {renderAppServiceBody()}
            </ServiceWorkbenchHost>
          </div>
        ) : (
          <div className="fixed inset-x-3 top-14 bottom-5 z-50" data-testid="apps-workbench-expanded-shell">
            <ServiceWorkbenchHost
              serviceId={activeService}
              title={serviceTitle(activeService, locale)}
              subtitle={t(locale, 'Measured applications context · read-only', 'سياق التطبيقات المقيس · للقراءة فقط')}
              locale={locale}
              mode="expanded"
              onModeChange={setWorkbenchMode}
              onClose={closeWorkbench}
              testId="apps-workbench-expanded"
              toolSelector={appsWorkbenchToolSelector}
              footer={<span className="text-amber-300">{t(locale, 'Review only · no uninstall, update or association write', 'مراجعة فقط · لا إزالة أو تحديث أو كتابة ارتباط')}</span>}
            >
              {renderAppServiceBody()}
            </ServiceWorkbenchHost>
          </div>
        )
      ) : null}

      {planOpen && controller.plan ? (
        <div className="apps-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="apps-plan-gate-title">
          <div className="apps-plan-gate" data-testid="apps-plan-gate">
            <div className="apps-plan-gate-head">
              <div className="apps-plan-gate-icon">
                <Lock className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 id="apps-plan-gate-title">{t(locale, 'Removal approval gate', 'بوابة موافقة الإزالة')}</h2>
                <p>
                  {t(
                    locale,
                    'This plan is immutable and non-executable. Mission 08 owns execution and requires a separate explicit approval.',
                    'هذه الخطة ثابتة وغير قابلة للتنفيذ. المهمة 08 تملك التنفيذ وتتطلب موافقة صريحة منفصلة.'
                  )}
                </p>
              </div>
              <button
                type="button"
                className="apps-icon-btn"
                onClick={() => setPlanOpen(false)}
                aria-label={t(locale, 'Close', 'إغلاق')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="apps-plan-gate-summary">
              <div>
                <span>{t(locale, 'Plan', 'الخطة')}</span>
                <strong className="apps-mono">{controller.plan.planId.slice(0, 16)}</strong>
              </div>
              <div>
                <span>{t(locale, 'Applications', 'التطبيقات')}</span>
                <strong>{formatCount(controller.plan.totals.count)}</strong>
              </div>
              <div>
                <span>{t(locale, 'Blocked', 'محجوبة')}</span>
                <strong className={controller.plan.totals.blocked ? 'text-rose-300' : ''}>{formatCount(controller.plan.totals.blocked)}</strong>
              </div>
              <div>
                <span>{t(locale, 'Reclaim evidence', 'دليل الاستعادة')}</span>
                <strong>{formatBytes(controller.plan.totals.reclaimBytes)}</strong>
              </div>
              <div>
                <span>{t(locale, 'Reclaim source', 'مصدر الدليل')}</span>
                <strong>{controller.plan.totals.reclaimSource}</strong>
              </div>
            </div>

            <div className="apps-plan-gate-list knx-custom-scrollbar">
              {controller.plan.items.map((item) => (
                <div key={item.appId} className="apps-plan-gate-item">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="apps-row-name" title={item.name}>{item.name}</div>
                      <div className="apps-row-publisher">{item.publisher || '—'} · {item.method || t(locale, 'no registered method', 'بلا طريقة مسجلة')}</div>
                    </div>
                    <span className={`apps-tag ${item.risk === 'blocked' ? 'apps-tag-protected' : item.risk === 'high' ? 'apps-tag-warn' : 'apps-tag-muted'}`}>
                      {item.risk.toUpperCase()}
                    </span>
                  </div>
                  <ul className="apps-plan-reasons">
                    {item.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            <div className="apps-plan-gate-blocked">
              <Lock className="w-4 h-4 shrink-0" />
              <div>
                <strong>{controller.plan.execution.gate}</strong>
                <p>{controller.plan.execution.reason}</p>
                <p className="opacity-80">{controller.plan.restorePoint.reason}</p>
              </div>
            </div>

            <div className="apps-plan-gate-actions">
              <button type="button" className="apps-btn" onClick={exportPlan}>
                <Download className="w-3.5 h-3.5" />
                {t(locale, 'Export plan JSON', 'تصدير الخطة JSON')}
              </button>
              <button
                type="button"
                className="apps-btn"
                onClick={() => {
                  setPlanOpen(false);
                  handleNavigate('cleanup');
                }}
              >
                {t(locale, 'Open Cleanup workspace', 'فتح مساحة التنظيف')}
              </button>
              <button type="button" className="apps-btn apps-btn-primary" onClick={() => setPlanOpen(false)}>
                {t(locale, 'Close gate', 'إغلاق البوابة')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
