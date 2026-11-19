import { useEffect, useRef, useState } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { useStudio } from './context';
import { useNavigation, useDeepLink } from '../context/NavigationContext';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import { STUDIO_STAGES } from '../operations/organization-studio-model';
import { CompactServiceDock } from '../components/workbench/CompactServiceDock';
import { StudioServiceWorkspace, hasStudioWorkbench, STUDIO_WORKBENCH_IDS, STAGE_LABELS, STAGE_ICONS, STAGE_DESCRIPTIONS, STAGE_STATES } from './StudioServiceWorkspaces';
import { ServiceWorkbenchHost, type WorkbenchMode } from '../components/workbench/ServiceWorkbenchHost';
import './studio-integration.css';

export interface StudioPageProps {
  onNavigate?: (section: string) => void;
}

/** Shared approved chrome around the existing native operation portal with full ServiceWorkbenchHost integration. */
export function StudioPage({ onNavigate }: StudioPageProps) {
  const navigation = useNavigation();
  const deepLink = useDeepLink();
  const studio = useStudio();
  const ar = navigation.isArabic;
  const locale = ar ? 'ar' : 'en';

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState(false);
  const [activeStage, setActiveStage] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(2);
  const [detached, setDetached] = useState(false);
  const [overview, setOverview] = useState(false);

  // Consume deep link from Home/other entry points to auto-open a workbench
  useEffect(() => {
    if (deepLink?.workbenchId) {
      const stageId = Number(deepLink.workbenchId);
      if (hasStudioWorkbench(stageId)) {
        setActiveStage(stageId);
        setOverview(false);
      }
    }
  }, [deepLink]);
  const [workbenchMode, setWorkbenchMode] = useState<WorkbenchMode>(() => {
    try { return localStorage.getItem('knoux.studio.workbench.mode') === 'expanded' ? 'expanded' : 'side'; } catch { return 'side'; }
  });
  const [workbenchWidth, setWorkbenchWidth] = useState<number>(() => {
    try { const value = Number(localStorage.getItem('knoux.studio.workbench.width')); return Number.isFinite(value) && value >= 380 ? Math.min(900, value) : 520; } catch { return 520; }
  });
  const integratedRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  useEffect(() => { if (integratedRef.current) integratedRef.current.scrollTop = 0; }, [activeStage]);
  useEffect(() => {
    try {
      localStorage.setItem('knoux.studio.workbench.mode', workbenchMode);
      localStorage.setItem('knoux.studio.workbench.width', String(workbenchWidth));
    } catch { /* private mode */ }
  }, [workbenchMode, workbenchWidth]);

  const stages = STUDIO_STAGES.map(([en, arabic], index) => ({ id: index + 1, en, arabic })).filter(s => (s.en + ' ' + s.arabic).toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => { studio.setLocale(navigation.locale); }, [navigation.locale, studio.setLocale]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(v => !v); } };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    if (!searchOpen) return;
    const previous = document.activeElement as HTMLElement | null; const current = dialog.current;
    current?.showModal(); return () => { current?.close(); previous?.isConnected && previous.focus(); };
  }, [searchOpen]);

  const choose = (stageId: number) => {
    setSearchOpen(false);
    setQuery('');
    if (hasStudioWorkbench(stageId)) {
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setActiveStage(stageId as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9);
      setOverview(false);
      setDetached(false);
    }
    window.dispatchEvent(new CustomEvent('knoux:live-organization', { detail: { stageId } }));
  };

  const closeWorkbench = () => {
    setDetached(false);
    setActiveStage(2);
    setOverview(true);
    window.setTimeout(() => triggerRef.current?.focus(), 30);
  };

  const stageSelector = activeStage ? (
    <select
      data-testid="studio-workbench-tool-select"
      aria-label={ar ? 'تبديل مرحلة الاستوديو' : 'Switch studio stage'}
      title={STAGE_LABELS[activeStage][locale]}
      value={activeStage}
      onChange={(event) => {
        const id = Number(event.target.value);
        if (hasStudioWorkbench(id)) setActiveStage(id);
      }}
      className="max-w-[170px] rounded border border-[#173866] bg-[#08162b] px-1.5 py-1 text-[10px] text-slate-200"
    >
      {STUDIO_WORKBENCH_IDS.map((id) => (
        <option key={id} value={id}>{locale === 'ar' ? STAGE_LABELS[id].ar : STAGE_LABELS[id].en}</option>
      ))}
    </select>
  ) : null;

  const renderStageCard = (entry: { id: number; en: string; arabic: string }) => {
    const state = STAGE_STATES[entry.id as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9];
    const StageIcon = STAGE_ICONS[entry.id as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9];
    const isActive = activeStage === entry.id;
    return (
      <button
        key={entry.id}
        type="button"
        className={`studio-stage-card ${isActive ? 'is-active' : ''}`}
        data-testid={`studio-stage-${entry.id}`}
        onClick={() => choose(entry.id)}
      >
        <span className="studio-stage-index">{String(entry.id).padStart(2, '0')}</span>
        <span className="studio-stage-icon" aria-hidden="true"><StageIcon className="w-4 h-4" /></span>
        <span className="studio-stage-copy"><strong>{ar ? entry.arabic : entry.en}</strong></span>
        <span className={`studio-stage-state is-${state}`}>{state === 'completed' ? (ar ? 'مكتمل' : 'Completed') : state === 'active' ? (ar ? 'نشط' : 'Active') : state === 'available' ? (ar ? 'متاح' : 'Available') : (ar ? 'محظور' : 'Blocked')}</span>
      </button>
    );
  };

  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <div dir={ar ? 'rtl' : 'ltr'} data-testid="studio-workspace" className="approved-home studio-integration-shell" data-theme-mode={navigation.theme === 'light' ? 'day' : 'night'}>
      <KNOuXTitleBar
        sectionName={ar ? 'استوديو التنظيم' : 'Organization Studio'}
        sectionSubtitle={ar ? '9 مراحل · فهرسة مقيسة · تنفيذ بموافقة' : '9 stages · measured index · consent-gated execution'}
        searchQuery={query}
        onSearchChange={value => { setQuery(value); setSearchOpen(true); }}
        searchPlaceholder={ar ? 'ابحث عن مرحلة في استوديو التنظيم…' : 'Find a stage in Organization Studio…'}
        isArabic={ar}
        onToggleArabic={navigation.toggleLocale}
        onNavigateHome={() => navigation.navigateTo('home')}
        onOpenSettings={() => navigation.navigateTo('settings')}
        onOpenNotifications={() => setNotice(v => !v)}
      />
      {notice && (
        <aside className="studio-integration-notice" role="status" data-testid="studio-status-notice">
          <strong>{ar ? 'حالة التنظيم' : 'Organization status'}</strong>
          <p>{ar ? 'البيانات والخطط والإيصالات متاحة داخل مراحل الاستوديو. الاتصال بالمحرّك لا يثبت اكتمال أي عملية.' : 'Measured inventory, plans and receipts are available in Studio stages. Engine connectivity does not establish operation completion.'}</p>
          <button data-testid="studio-open-history" onClick={() => { setNotice(false); choose(8); }}>{ar ? 'فتح السجل والتراجع' : 'Open History & Undo'}</button>
          <button onClick={() => setNotice(false)}>{ar ? 'إغلاق' : 'Close'}</button>
        </aside>
      )}
      {searchOpen && (
        <dialog ref={dialog} className="home-workspace-palette" aria-label={ar ? 'البحث في مراحل التنظيم' : 'Organization stage search'} onCancel={() => setSearchOpen(false)} onClick={e => { if (e.target === dialog.current) setSearchOpen(false); }}>
          <header><Search/><input autoFocus aria-label="Search organization stages" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && stages[0]) { e.preventDefault(); choose(stages[0].id); } }} /><button aria-label="Close stage search" onClick={() => setSearchOpen(false)}><X /></button></header>
          <nav aria-label="Organization stages">{stages.length ? stages.map(s => <button key={s.id} onClick={() => choose(s.id)}>{String(s.id).padStart(2, '0')} · {ar ? s.arabic : s.en}</button>) : <p role="status">{ar ? 'لا توجد مرحلة مطابقة' : 'No matching stage'}</p>}</nav>
          <footer>{ar ? 'تنقل فقط؛ التنفيذ يتطلب مراجعة وموافقة مستقلة.' : 'Navigation only; execution requires separate plan review and consent.'}</footer>
        </dialog>
      )}

      <div className="studio-integration-body">
        <KNOuXSidebar activeSection="studio" onNavigate={navigation.navigateTo} isArabic={ar} />
        <main className="os-studio-frame flex flex-col min-h-0">
          <div className="studio-compact-dock" data-testid="studio-stages">
            <CompactServiceDock
              testIdPrefix="studio"
              isArabic={ar}
              label={ar ? 'مراحل الاستوديو' : 'Studio stages'}
              selectedId={overview ? null : String(activeStage)}
              onSelect={id => { if (hasStudioWorkbench(Number(id))) choose(Number(id)); }}
              items={STUDIO_WORKBENCH_IDS.map((id) => {
                const StageIcon = STAGE_ICONS[id];
                const state = STAGE_STATES[id];
                return {
                  id: String(id),
                  label: locale === 'ar' ? STAGE_LABELS[id].ar : STAGE_LABELS[id].en,
                  icon: <StageIcon className="w-4 h-4" aria-hidden="true" />,
                  capability: state === 'completed' ? (ar ? 'مكتمل' : 'Completed') : state === 'active' ? (ar ? 'نشط' : 'Active') : state === 'available' ? (ar ? 'متاح' : 'Available') : (ar ? 'محظور' : 'Blocked'),
                  hint: STAGE_DESCRIPTIONS[id][locale],
                };
              })}
              actions={overview ? null : (
                <>
                  <button type="button" onClick={() => setOverview(true)} className="compact-dock-action" aria-pressed={overview} title={ar ? 'النظرة العامة' : 'Overview'}><ChevronRight className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => setDetached(true)} disabled={!studio.native.available} className="compact-dock-action" title={ar ? 'عرض جانبي' : 'Side view'}><ChevronRight className="w-3.5 h-3.5 rotate-90" /></button>
                </>
              )}
            />
          </div>

          <div className="studio-inner-workspace flex-1 flex flex-col min-h-0" data-testid="studio-inner-workspace">
            <div id="knoux-studio-operation-stage" className="os-studio-mount" data-testid="studio-live-mount" />
            <section
              ref={integratedRef}
              id="active-service-workspace"
              role="tabpanel"
              aria-labelledby={overview ? undefined : activeStage ? `service-tab-${activeStage}` : undefined}
              className="studio-integrated-service knx-service-workspace"
              data-testid="studio-integrated-service"
            >
              {overview ? (
                <div className="studio-overview-scroll" data-testid="studio-overview">
                  <div className="studio-overview-header">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center"><ChevronRight className="w-5 h-5 text-white" /></div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{ar ? 'استوديو التنظيم' : 'Organization Studio'}</h2>
                        <p className="text-sm text-slate-400">{ar ? '9 مراحل متخصصة للفهرسة والتنظيم المقيس' : '9 specialized stages for measured indexing & organization'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${studio.native.mode === 'measured' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/60 text-amber-300 border-amber-500/40'}`}>
                        {studio.native.mode === 'measured' ? (ar ? 'مقيس' : 'MEASURED') : (ar ? 'تجريبي' : 'FIXTURE')}
                      </span>
                    </div>
                  </div>
                  <div className="studio-stage-grid" data-testid="studio-stage-grid">
                    {STUDIO_WORKBENCH_IDS.map((id) => {
                      const StageIcon = STAGE_ICONS[id];
                      const state = STAGE_STATES[id];
                      return (
                        <button key={id} type="button" className={`studio-overview-stage-card ${state === 'blocked' ? 'is-blocked' : ''}`} onClick={() => choose(id)} data-testid={`studio-overview-stage-${id}`}>
                          <div className="studio-overview-stage-icon" aria-hidden="true"><StageIcon className="w-6 h-6" /></div>
                          <div className="studio-overview-stage-info">
                            <strong>{locale === 'ar' ? STAGE_LABELS[id].ar : STAGE_LABELS[id].en}</strong>
                            <span className={`studio-overview-stage-state is-${state}`}>{state === 'completed' ? (ar ? 'مكتمل' : 'Completed') : state === 'active' ? (ar ? 'نشط' : 'Active') : state === 'available' ? (ar ? 'متاح' : 'Available') : (ar ? 'محظور' : 'Blocked')}</span>
                          </div>
                          <p className="studio-overview-stage-desc">{STAGE_DESCRIPTIONS[id][locale]}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="studio-overview-footer">
                    <button type="button" className="studio-overview-primary" onClick={() => choose(1)}><ChevronRight className="w-3.5 h-3.5" />{ar ? 'بدء من المصادر' : 'Start from Sources'}</button>
                    <button type="button" className="studio-overview-secondary" onClick={() => navigation.navigateTo('files')}>{ar ? 'فتح الملفات' : 'Open Files'}</button>
                  </div>
                </div>
              ) : (
                <StudioServiceWorkspace
                  stageId={activeStage}
                  studio={studio}
                  locale={locale}
                  onClose={closeWorkbench}
                  embedded
                  mode={workbenchMode}
                  onModeChange={setWorkbenchMode}
                  width={workbenchWidth}
                  onResize={setWorkbenchWidth}
                />
              )}
            </section>
          </div>
        </main>
      </div>

      {activeStage && !overview && detached ? (
        <StudioServiceWorkspace
          stageId={activeStage}
          studio={studio}
          locale={locale}
          onClose={() => setDetached(false)}
          mode={workbenchMode}
          width={workbenchWidth}
          onModeChange={setWorkbenchMode}
          onResize={setWorkbenchWidth}
          toolSelector={stageSelector}
        />
      ) : null}
    </div>
  );
}