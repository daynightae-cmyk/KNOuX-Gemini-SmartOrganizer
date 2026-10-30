/**
 * KNOuX SmartOrganizer — measured service workspace.
 *
 * Hosts one of the ten service renderers and can run that service through the
 * native coordinator. The footer never claims a simulated result.
 */
import React from 'react';
import { Lock, Play, RotateCw, ShieldCheck, X } from 'lucide-react';
import type { ScanServiceResult, ScanSession } from '../../shared/native-contracts';
import type { ScanServiceMeta } from './smartScan.types';
import { QuickScanRenderer } from './service-renderers/QuickScanRenderer';
import { DeepScanRenderer } from './service-renderers/DeepScanRenderer';
import { DuplicateFinderRenderer } from './service-renderers/DuplicateFinderRenderer';
import { LargeFilesRenderer } from './service-renderers/LargeFilesRenderer';
import { JunkCleanerRenderer } from './service-renderers/JunkCleanerRenderer';
import { PrivacyTraceRenderer } from './service-renderers/PrivacyTraceRenderer';
import { StartupImpactRenderer } from './service-renderers/StartupImpactRenderer';
import { AppHealthRenderer } from './service-renderers/AppHealthRenderer';
import { SystemHealthPulseRenderer } from './service-renderers/SystemHealthPulseRenderer';
import { SmartRecommendationsRenderer } from './service-renderers/SmartRecommendationsRenderer';
import { EmptyResult } from './service-renderers/shared';

export interface ScanServiceWorkspaceProps {
  service: ScanServiceMeta;
  result?: ScanServiceResult;
  session?: ScanSession | null;
  isArabic?: boolean;
  busy?: boolean;
  scanActive?: boolean;
  canRun?: boolean;
  runBlockedReason?: string | null;
  onClose: () => void;
  onRunService: (serviceId: string) => void;
  onNavigateToWorkspace?: (workspace: string) => void;
  onOpenService?: (serviceId: string) => void;
  onOpenCleanupGate?: () => void;
  embedded?: boolean;
}

export const ScanServiceWorkspace: React.FC<ScanServiceWorkspaceProps> = ({
  service,
  result,
  session,
  isArabic = false,
  busy = false,
  scanActive = false,
  canRun = true,
  runBlockedReason = null,
  onClose,
  onRunService,
  onNavigateToWorkspace,
  onOpenService,
  onOpenCleanupGate,
  embedded = false,
}) => {
  const renderRenderer = () => {
    const props = { service: result, session, isArabic, onNavigateToWorkspace, onOpenService };
    switch (service.id) {
      case 'quick_scan':
        return <QuickScanRenderer {...props} />;
      case 'deep_scan':
        return <DeepScanRenderer {...props} />;
      case 'duplicate_finder':
        return <DuplicateFinderRenderer {...props} />;
      case 'large_files_review':
        return <LargeFilesRenderer {...props} />;
      case 'junk_cleaner':
        return <JunkCleanerRenderer {...props} />;
      case 'privacy_trace_check':
        return <PrivacyTraceRenderer {...props} />;
      case 'startup_impact_check':
        return <StartupImpactRenderer {...props} />;
      case 'app_health_review':
        return <AppHealthRenderer {...props} />;
      case 'system_health_pulse':
        return <SystemHealthPulseRenderer {...props} />;
      case 'smart_recommendations':
      default:
        return <SmartRecommendationsRenderer {...props} />;
    }
  };

  const disabled = busy || scanActive || !canRun;
  // A session only holds the services it measured, so a service that was not
  // part of it must offer its own measurement instead of a dead end.
  const body = result ? (
    renderRenderer()
  ) : (
    <EmptyResult
      service={result}
      isArabic={isArabic}
      onMeasure={() => onRunService(service.id)}
      measureDisabled={disabled}
      measureReason={!canRun ? runBlockedReason : null}
    />
  );

  if (embedded) {
    return (
      <div data-testid="scan-service-focus" className="flex flex-col gap-3">
        <p className="text-[10px] text-slate-400">{isArabic ? service.noteAr : service.noteEn}</p>
        <div data-testid={`scan-${service.id}-workbench`} className="scan-service-body min-h-0 py-1">{body}</div>
        <div className="flex flex-wrap items-center gap-2 border-t border-[#122e54] pt-2" data-testid="scan-service-actions">
          <span className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            {isArabic ? 'قراءة فقط · بلا قناة تغيير' : 'read-only · no mutation channel'}
          </span>
          {!canRun && runBlockedReason ? (
            <span className="text-[9px] text-amber-300 font-mono">{runBlockedReason}</span>
          ) : null}
          {service.id === 'junk_cleaner' && onOpenCleanupGate ? (
            <button
              type="button"
              onClick={onOpenCleanupGate}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-[10px] font-bold text-amber-200 transition cursor-pointer"
            >
              {isArabic ? 'بوابة موافقة المهمة 08' : 'Mission 08 approval gate'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onRunService(service.id)}
            disabled={disabled}
            data-testid="scan-service-run"
            className="ms-auto px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-[10px] font-black border border-cyan-300/40 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {result ? <RotateCw className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isArabic ? (result ? 'إعادة القياس' : 'تشغيل الخدمة') : (result ? 'Re-measure' : 'Run service')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-[#081830] border border-cyan-400/50 rounded-2xl w-full max-w-2xl p-5 shadow-2xl text-slate-100 flex flex-col gap-4 relative animate-fadeIn max-h-[92vh]">
        <div className="flex items-start justify-between gap-3 border-b border-[#122e54] pb-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                {isArabic ? 'مساحة خدمة مقيسة' : 'Measured service workspace'}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${service.state === 'available' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : service.state === 'partial' ? 'bg-amber-950/60 text-amber-300 border-amber-500/40' : 'bg-rose-950/60 text-rose-300 border-rose-500/40'}`}>
                {service.state === 'available' ? (isArabic ? 'متاح' : 'AVAILABLE') : service.state === 'partial' ? (isArabic ? 'جزئي' : 'PARTIAL') : (isArabic ? 'مقيّد' : 'GATED')}
              </span>
              {result ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#0b1d38] text-slate-300 border border-[#173866]">
                  {result.status.toUpperCase()}
                </span>
              ) : null}
            </div>
            <h2 className="text-base font-extrabold text-white mt-0.5">{isArabic ? service.titleAr : service.titleEn}</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">{isArabic ? service.noteAr : service.noteEn}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-[#0b1d38] hover:bg-rose-900/60 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            aria-label={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="scan-service-body py-1 overflow-y-auto knx-custom-scrollbar min-h-0">{body}</div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#122e54] pt-3">
          <span className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            {isArabic ? 'سطح أصلي · قراءة فقط · بلا قناة تغيير' : 'native surface · read-only · no mutation channel'}
            <Lock className="w-3 h-3 ml-1" />
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {service.id === 'junk_cleaner' && onOpenCleanupGate ? (
              <button
                type="button"
                onClick={onOpenCleanupGate}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-[11px] font-bold text-amber-200 transition cursor-pointer"
              >
                {isArabic ? 'بوابة موافقة المهمة 08' : 'Mission 08 approval gate'}
              </button>
            ) : null}
            {!canRun && runBlockedReason ? (
              <span className="text-[9px] text-amber-300 font-mono max-w-[220px] text-right">{runBlockedReason}</span>
            ) : null}
            <button
              type="button"
              onClick={() => onRunService(service.id)}
              disabled={disabled}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black shadow-[0_0_16px_rgba(37,99,235,0.45)] border border-cyan-300/40 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {result ? <RotateCw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isArabic ? (result ? 'إعادة القياس' : 'تشغيل الخدمة') : (result ? 'Re-measure' : 'Run service')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#0c1f3d] hover:bg-[#132c52] border border-[#173866] text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              {isArabic ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
