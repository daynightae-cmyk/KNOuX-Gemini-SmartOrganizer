/**
 * KNOuX SmartOrganizer — Studio Main Page Shell
 * Section 01: Smart Organization Studio
 * Reference composition: REF-01_Smart_Organization_Studio.png (1672x941 native)
 */

import React, { useEffect, useState } from 'react';
import { useStudio } from './context';
import {
  WindowsTitleBar,
  GlobalSidebar,
  CinematicHeader,
  TelemetryStrip,
  HorizontalStagesBar,
  StickyFooter,
} from './parts';
import { StudioModals } from './modals';
import { StudioCommandCenter } from './StudioCommandCenter';
import { NativeStudioBanner } from './NativeStudioBanner';
import { StudioVisualHeader } from '../visual/StudioVisualHeader';
import { KNOuXTitleBar } from '../components/shell/KNOuXShellComponents';
import { useNavigation } from '../context/NavigationContext';
import { StudioReferenceOverview } from '../visual/StudioReferenceOverview';

// Workspaces for each of the 9 stages
import { SourceGrantWorkspace } from './workspaces/SourceGrantWorkspace';
import { VisualLibraryWorkspace } from './workspaces/VisualLibraryWorkspace';
import { CollectionComposer } from './workspaces/CollectionComposer';
import { OrganizationRuleBuilder } from './workspaces/OrganizationRuleBuilder';
import { DestinationInspector } from './workspaces/DestinationInspector';
import { PlanReviewWorkspace } from './workspaces/PlanReviewWorkspace';
import { ExecutionMonitor } from './workspaces/ExecutionMonitor';
import { HistoryUndoInspector } from './workspaces/HistoryUndoInspector';
import { SuggestionsReview } from './workspaces/SuggestionsReview';
import { StudioStageContextPanel } from './StudioStageContextPanel';
import { ServiceWorkbenchHost, type WorkbenchMode } from '../components/workbench/ServiceWorkbenchHost';

export function StudioPage({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { activeStageId, locale, setLocale, stages, authorizedSources, selectedFileIds } = useStudio();
  const navigation = useNavigation();
  const [overviewVisible, setOverviewVisible] = useState(true);
  const studio = useStudio();
  useEffect(() => { setLocale(navigation.locale); }, [navigation.locale, setLocale]);
  const openStage = (id: import('./types').StudioStageId) => { studio.setActiveStageId(id); setOverviewVisible(false); };
  useEffect(() => {
    const openKeyboardStage = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      if (/^[1-9]$/.test(event.key)) setOverviewVisible(false);
    };
    window.addEventListener('keydown', openKeyboardStage);
    return () => window.removeEventListener('keydown', openKeyboardStage);
  }, []);
  const [dpiScale, setDpiScale] = useState<'100%' | '125%' | '150%'>('100%');
  const [stageWorkbenchMode, setStageWorkbenchMode] = useState<WorkbenchMode>(() => {
    try { return localStorage.getItem('knoux.studio.workbench.mode') === 'side' ? 'side' : 'expanded'; } catch { return 'expanded'; }
  });
  const [stageDockWidth, setStageDockWidth] = useState<number>(() => {
    try { const value = Number(localStorage.getItem('knoux.studio.workbench.width')); return Number.isFinite(value) && value >= 360 ? Math.min(720, value) : 560; } catch { return 560; }
  });
  useEffect(() => {
    try {
      localStorage.setItem('knoux.studio.workbench.mode', stageWorkbenchMode);
      localStorage.setItem('knoux.studio.workbench.width', String(stageDockWidth));
    } catch {
      // In-memory only when storage is unavailable.
    }
  }, [stageWorkbenchMode, stageDockWidth]);
  const activeStage = stages.find((stage) => stage.id === activeStageId) || stages[0];
  const activeSource = authorizedSources[0] || null;
  const activeSourceLabel = activeSource?.path ? activeSource.path.split(/[\/]/).filter(Boolean).slice(-2).join(' / ') : null;

  const renderActiveWorkspace = () => {
    switch (activeStageId) {
      case 1:
        return <SourceGrantWorkspace />;
      case 2:
        return <VisualLibraryWorkspace />;
      case 3:
        return <CollectionComposer />;
      case 4:
        return <OrganizationRuleBuilder />;
      case 5:
        return <DestinationInspector />;
      case 6:
        return <PlanReviewWorkspace />;
      case 7:
        return <ExecutionMonitor />;
      case 8:
        return <HistoryUndoInspector />;
      case 9:
        return <SuggestionsReview />;
      default:
        return <VisualLibraryWorkspace />;
    }
  };

  const scaleClass =
    dpiScale === '125%'
      ? 'scale-90 origin-top-left w-[111.1%] h-[111.1%]'
      : dpiScale === '150%'
      ? 'scale-75 origin-top-left w-[133.3%] h-[133.3%]'
      : 'w-full h-full';

  return (
    <div
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      data-testid="studio-workspace"
      className="w-screen h-screen flex flex-col bg-[#050d1d] text-slate-100 overflow-hidden font-sans select-none relative"
      style={{
        fontFamily:
          locale === 'ar'
            ? "'Tajawal', system-ui, sans-serif"
            : "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <StudioCommandCenter />
      <StudioModals />

      {/* 00 — Thin Windows Title Bar */}
      <KNOuXTitleBar sectionName={locale === 'ar' ? 'استوديو التنظيم' : 'Organization Studio'} isArabic={locale === 'ar'}
        onToggleArabic={() => { const next = locale === 'ar' ? 'en' : 'ar'; setLocale(next); navigation.setLocale(next); }}
        onNavigateHome={() => navigation.navigateTo('home')} />

      {/* Main App Container */}
      <div className={`flex flex-1 min-h-0 overflow-hidden ${scaleClass}`}>
        {/* Global Left Navigation Sidebar */}
        <GlobalSidebar onNavigate={onNavigate} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#061226] relative overflow-hidden">
          {overviewVisible ? <StudioReferenceOverview onOpen={openStage} /> : <>
          <button className="knx-reference-back" onClick={() => setOverviewVisible(true)}>{locale === 'ar' ? '→ العودة إلى لوحة التنظيم' : '← Organization overview'}</button>
          {/* Top Atmospheric Header Area */}
          <div className="shrink-0 bg-gradient-to-b from-[#08172e] to-[#061226] border-b border-[#0f2444] pb-1">
            {/* 01 — Cinematic Planet Header */}
            <StudioVisualHeader />

            {/* 02 — Authorization Telemetry Strip + provenance boundary */}
            <TelemetryStrip />
            <NativeStudioBanner />

            {/* 03 — Nine Horizontal Stages */}
            <HorizontalStagesBar />
          </div>

          {/* Dynamic Workspace Container (Active Stage 1-9) */}
          {stageWorkbenchMode === 'side' ? (
            <div className="flex-1 flex min-h-0 overflow-hidden relative">
              <StudioStageContextPanel />
              <div className="shrink-0 h-full min-h-0" style={{ width: `${stageDockWidth}px` }} data-testid="studio-workbench-side-shell">
                <ServiceWorkbenchHost
                  serviceId={`studio-stage-${activeStageId}`}
                  title={(locale === 'en' ? activeStage?.nameEn : activeStage?.nameAr) || `Stage ${activeStageId}`}
                  subtitle={activeSource ? `${activeSourceLabel} · ${selectedFileIds.size} selected` : (locale === 'en' ? 'No authorized source' : 'لا يوجد مصدر مصرح')}
                  locale={locale === 'ar' ? 'ar' : 'en'}
                  mode="side"
                  onModeChange={(mode) => setStageWorkbenchMode(mode)}
                  onClose={() => setStageWorkbenchMode('expanded')}
                  onResize={(width) => setStageDockWidth(width)}
                  minWidth={360}
                  maxWidth={720}
                  testId="studio-workbench"
                  footer={<><span className="text-amber-300">{locale === 'en' ? 'Preview only · execution blocked' : 'معاينة فقط · التنفيذ محجوب'}</span></>}
                >
                  {renderActiveWorkspace()}
                </ServiceWorkbenchHost>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
              <div className="flex justify-end px-6 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setStageWorkbenchMode('side')}
                  data-testid="studio-workbench-pin"
                  className="rounded-lg border border-cyan-400/50 bg-[#071b38]/95 px-2.5 py-1 text-[10px] font-semibold text-cyan-200 shadow-lg hover:bg-[#0c2850]"
                >
                  {locale === 'en' ? 'Pin stage workbench' : 'تثبيت مساحة المرحلة'}
                </button>
              </div>
              {renderActiveWorkspace()}
            </div>
          )}

          {/* 08 — Sticky Footer (hosts the DPI preview switch in its center slot) */}
          <StickyFooter
            dpiControl={
              <div className="hidden md:flex items-center gap-1 bg-[#091a33]/90 border border-[#173663] px-1.5 py-0.5 rounded text-[10px] text-slate-400">
                <span>DPI:</span>
                {(['100%', '125%', '150%'] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setDpiScale(scale)}
                    className={`px-1 py-0.5 rounded cursor-pointer ${
                      dpiScale === scale ? 'bg-[#2476ff] text-white font-bold' : 'hover:text-white'
                    }`}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            }
          />
          </>}
        </main>
      </div>
    </div>
  );
}
