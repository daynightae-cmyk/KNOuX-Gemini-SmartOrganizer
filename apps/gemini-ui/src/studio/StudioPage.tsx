import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useStudio } from './context';
import { useNavigation, useDeepLink } from '../context/NavigationContext';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import { STUDIO_STAGES } from '../operations/organization-studio-model';
import { StudioServiceWorkspace, hasStudioWorkbench, STUDIO_WORKBENCH_IDS, STAGE_LABELS } from './StudioServiceWorkspaces';
import type { WorkbenchMode } from '../components/workbench/ServiceWorkbenchHost';
import './studio-integration.css';

export interface StudioPageProps {
  onNavigate?: (section: string) => void;
}

/** Shared approved chrome around the existing native operation portal. The
 *  approved Organization Studio overview/stage surface is owned entirely by
 *  OrganizationLiveWorkbench, which portals into #knoux-studio-operation-stage.
 *  Deep links and Home entry points may still open a detached typed workbench;
 *  that path keeps the existing ServiceWorkbenchHost integration. */
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

  // Consume deep link from Home/other entry points to auto-open a workbench
  useEffect(() => {
    if (deepLink?.workbenchId) {
      const stageId = Number(deepLink.workbenchId);
      if (hasStudioWorkbench(stageId)) {
        setActiveStage(stageId);
        setDetached(true);
      }
    }
  }, [deepLink]);
  const [workbenchMode, setWorkbenchMode] = useState<WorkbenchMode>(() => {
    try { return localStorage.getItem('knoux.studio.workbench.mode') === 'expanded' ? 'expanded' : 'side'; } catch { return 'side'; }
  });
  const [workbenchWidth, setWorkbenchWidth] = useState<number>(() => {
    try { const value = Number(localStorage.getItem('knoux.studio.workbench.width')); return Number.isFinite(value) && value >= 380 ? Math.min(900, value) : 520; } catch { return 520; }
  });
  const triggerRef = useRef<HTMLElement | null>(null);
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
      setDetached(false);
    }
    window.dispatchEvent(new CustomEvent('knoux:live-organization', { detail: { stageId } }));
  };

  const closeWorkbench = () => {
    setDetached(false);
    window.dispatchEvent(new Event('knoux:studio-overview'));
    window.setTimeout(() => triggerRef.current?.focus(), 30);
  };

  const stageSelector = detached ? (
    <select
      data-testid="studio-workbench-tool-select"
      aria-label={ar ? 'تبديل مرحلة الاستوديو' : 'Switch studio stage'}
      title={STAGE_LABELS[activeStage][locale]}
      value={activeStage}
      onChange={(event) => {
        const id = Number(event.target.value);
        if (hasStudioWorkbench(id)) { setActiveStage(id); choose(id); setDetached(true); }
      }}
      className="max-w-[170px] rounded border border-[#173866] bg-[#08162b] px-1.5 py-1 text-[10px] text-slate-200"
    >
      {STUDIO_WORKBENCH_IDS.map((id) => (
        <option key={id} value={id}>{locale === 'ar' ? STAGE_LABELS[id].ar : STAGE_LABELS[id].en}</option>
      ))}
    </select>
  ) : null;

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
          <div id="knoux-studio-operation-stage" className="os-studio-mount flex-1 min-h-0" data-testid="studio-live-mount" />
        </main>
      </div>

      {detached ? (
        <StudioServiceWorkspace
          stageId={activeStage}
          studio={studio}
          locale={locale}
          onClose={closeWorkbench}
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
