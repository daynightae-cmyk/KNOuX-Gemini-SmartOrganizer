/**
 * KNOuX SmartOrganizer — measured service workspace.
 *
 * Hosts one of the ten service renderers and can run that service through the
 * native coordinator. The footer never claims a simulated result.
 */
import React, { useState } from 'react';
import { Lock, Play, RotateCw, ShieldCheck, X } from 'lucide-react';
import type { ScanServiceResult, ScanSession, StudioSource } from '../../shared/native-contracts';
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
import {ScanServiceReady} from './ScanServiceReady';
import { EmptyResult, CopyEvidence } from './service-renderers/shared';
import { scanOrganizationReview } from './model';

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
  onCancelScan?: () => void;
  source?: StudioSource | null;
  onAuthorizeSource?: () => void;
  onIndexSource?: () => void;
  actionError?: string | null;
  onNavigateToWorkspace?: (workspace: string) => void;
  onOpenService?: (serviceId: string) => void;
  onOpenCleanupGate?: () => void;
  embedded?: boolean;
  integrated?: boolean;
  extraActions?: React.ReactNode;
  previousMeasurement?: boolean;
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
  onCancelScan,
  source, onAuthorizeSource, onIndexSource, actionError,
  onNavigateToWorkspace,
  onOpenService,
  onOpenCleanupGate,
  embedded = false,
  integrated = false,
  extraActions,
  previousMeasurement=false,
}) => {
  const [reviewError, setReviewError] = useState('');
  const canReviewFiles = !busy && !scanActive && !!source && source.id === session?.sourceId && session.scope === 'authorized-folder';
  const reviewFiles = (fileIds: number[]) => {
    const detail = scanOrganizationReview(session, source, result, fileIds);
    if (!detail || !canReviewFiles) {
      setReviewError(isArabic ? 'الاختيار أو مصدر الجلسة تغير. اختر المصدر الأصلي وأعد القياس.' : 'The selection or session source changed. Select the original source and measure again.');
      return;
    }
    setReviewError('');
    window.dispatchEvent(new CustomEvent('knoux:live-organization', { detail }));
  };
  const renderRenderer = () => {
    const props = { service: result, session, isArabic, onNavigateToWorkspace, onOpenService, onReviewFiles: canReviewFiles ? reviewFiles : undefined, reviewUnavailableReason: isArabic ? 'اختر المصدر الأصلي لهذه الجلسة وانتظر انتهاء الفحص قبل مراجعة النقل.' : 'Select this session’s original source and finish the scan before reviewing a transfer.' };
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
  const body = result && !['failed','unsupported'].includes(result.status) ? (
    renderRenderer()
  ) : integrated && !result ? (
    <ScanServiceReady service={service} source={source} isArabic={isArabic} onAuthorize={onAuthorizeSource} onIndex={onIndexSource} busy={busy||scanActive} reason={runBlockedReason}/>
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
      <div data-testid="scan-service-focus" data-tool-body="smart_scan" data-tool={service.id} className={`scan-focused-service flex h-full min-h-0 flex-col gap-3 ${integrated?'is-integrated':''}`}>
        {!integrated && (busy || scanActive) ? <div className="knx-tool-context" role="status"><progress aria-label={isArabic ? 'جلسة فحص نشطة' : 'Scan session active'} /><span>{isArabic ? 'جلسة الفحص الأصلية نشطة؛ لم يكتمل القياس بعد.' : 'Native scan session active; measurement is not complete yet.'}</span>{scanActive && onCancelScan ? <button type="button" onClick={onCancelScan} data-testid="scan-workbench-cancel">{isArabic ? 'إلغاء الفحص' : 'Cancel scan'}</button> : null}</div> : null}
        {result && ['failed','unsupported'].includes(result.status) ? <p role="alert" className="knx-tool-error">{isArabic ? 'لم يرجع المزود نتيجة مكتملة لهذه الخدمة. راجع التحذيرات والتغطية أدناه.' : 'The provider did not return a completed result for this service. Review its warnings and coverage below.'}</p> : null}
        {!integrated && <section className="knx-tool-context"><ShieldCheck aria-hidden="true"/><div><strong>{isArabic ? service.titleAr : service.titleEn}</strong><small>{isArabic ? service.noteAr : service.noteEn}</small></div><span>{result ? result.status : (isArabic ? 'بانتظار القياس' : 'Awaiting measurement')}</span></section>}
        {!integrated && onAuthorizeSource ? <details className="knx-tool-evidence scan-scope-controls"><summary>{isArabic ? 'نطاق القياس التالي' : 'Next measurement scope'}: {source?.label || (isArabic ? 'لم يُحدد مجلد' : 'No folder selected')}</summary><p className="knx-tool-path">{source?.path || (isArabic ? 'بعض الخدمات تستخدم مزودي النظام فقط؛ خدمات الملفات تتطلب مجلدًا مصرحًا.' : 'Some tools use system providers only; file tools require an authorized folder.')}</p><div className="flex gap-2 flex-wrap"><button type="button" onClick={onAuthorizeSource} disabled={busy || scanActive}>{isArabic ? 'اختيار مجلد' : 'Choose folder'}</button>{source && onIndexSource ? <button type="button" onClick={onIndexSource} disabled={busy || scanActive}>{isArabic ? 'فهرسة المجلد' : 'Index folder'}</button> : null}<small>{source?.status}</small></div></details> : null}
        {actionError ? <p role="alert" className="knx-tool-error">{actionError}</p> : null}
        {/* Only the measured body scrolls, so the action row stays reachable
            instead of being pushed under the host footer. */}
        <div
          data-testid={`scan-${service.id}-workbench`}
          className="scan-service-body min-h-0 flex-1 overflow-y-auto knx-custom-scrollbar py-1"
        >
          {previousMeasurement?<p className="scan-previous-measurement" role="status">{isArabic?'نتيجة جلسة سابقة؛ الجلسة الحالية لم تنته بعد.':'Previous measured session; the current session is still running.'}</p>:null}
          {reviewError ? <p role="alert" className="knx-tool-error">{reviewError}</p> : null}
          {body}
        </div>
        {result ? <details className="knx-tool-evidence" data-testid="scan-service-evidence"><summary>{isArabic ? 'المصدر والتغطية والتحذيرات' : 'Source, coverage & warnings'}</summary><code>{result.source}</code><p>{result.startedAt} → {result.finishedAt || (isArabic ? 'قيد القياس' : 'In progress')}</p><ul>{[...result.warnings,...result.limitations].map((note,index)=><li key={index}>{note}</li>)}</ul><small>{result.permission} · {result.mutation}</small></details> : null}
        <div className="knx-tool-actions" data-testid="scan-service-actions">
          <span className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            {isArabic ? 'قراءة فقط · بلا قناة تغيير' : 'read-only · no mutation channel'}
          </span>
          {!canRun && runBlockedReason ? (
            <span className="text-[9px] text-amber-300 font-mono">{runBlockedReason}</span>
          ) : null}
          {result ? <CopyEvidence key={`${result.serviceId}:${result.startedAt}`} testId="scan-service-copy-evidence" payload={result} isArabic={isArabic}/> : null}
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
          {extraActions?<div className="scan-service-action-extras">{extraActions}</div>:null}
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

        <div className="scan-service-body py-1 overflow-y-auto knx-custom-scrollbar min-h-0">{reviewError ? <p role="alert" className="knx-tool-error">{reviewError}</p> : null}{body}</div>

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
