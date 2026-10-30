/**
 * KNOuX SmartOrganizer — Smart Scan command dock.
 *
 * Actions are limited to measured operations: export the selected measured
 * session, cancel the running session, or open the Mission 08 cleanup approval
 * gate. The blue "cleanup" action no longer simulates deletion.
 */
import React from 'react';
import { Ban, Download, Lock, ShieldCheck, Sparkles, Target } from 'lucide-react';
import type { ScanSession } from '../../shared/native-contracts';
import { formatBytes, formatDateTime, modeLabel, sessionStatusLabel } from './model';
import type { ActiveScanView } from './smartScan.types';

export interface ScanCommandBarProps {
  session: ScanSession | null;
  active: ActiveScanView | null;
  isArabic?: boolean;
  busy?: boolean;
  /** An authorized folder is indexed and ready to measure. */
  sourceReady?: boolean;
  onCancelScan: () => void;
  onExport: () => void;
  onOpenCustomScan: () => void;
  onOpenCleanupGate: () => void;
}

export const ScanCommandBar: React.FC<ScanCommandBarProps> = ({
  session,
  active,
  isArabic = false,
  busy = false,
  sourceReady = false,
  onCancelScan,
  onExport,
  onOpenCustomScan,
  onOpenCleanupGate,
}) => {
  const stagesCompleted = session?.summary.stagesCompleted ?? 0;
  const stagesTotal = session?.summary.stagesTotal ?? 0;

  return (
    <div data-testid="scan-command-bar" className="relative bg-[#061226]/95 border border-[#11294a] backdrop-blur-md rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,0,0,0.6)] z-30 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${active ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300' : session ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300' : 'bg-slate-800/60 border-slate-600 text-slate-400'}`}>
          <Target className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-black text-white flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {active ? (
              <>
                <span>{modeLabel(active.mode as ScanSession['mode'], isArabic)} · {isArabic ? 'قيد القياس' : 'measuring'}</span>
                <span className="text-cyan-300 font-mono">{active.progressPercent}%</span>
              </>
            ) : session ? (
              <>
                <span>{modeLabel(session.mode, isArabic)}</span>
                <span className="text-slate-400 font-mono text-[10px]">{sessionStatusLabel(session.status, isArabic)}</span>
                <span className="text-cyan-300 font-mono text-[10px]">{session.summary.findingsCount} {isArabic ? 'نتيجة' : 'findings'}</span>
                {session.summary.verifiedReclaimableBytes > 0 ? (
                  <span className="text-purple-300 font-mono text-[10px]">{formatBytes(session.summary.verifiedReclaimableBytes, isArabic)} {isArabic ? 'مكرر موثق' : 'verified duplicate'}</span>
                ) : null}
              </>
            ) : (
              <span>{isArabic ? 'لا توجد جلسة مقيسة' : 'No measured session'}</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {active
              ? (isArabic ? 'التقدم مشتق من المراحل المكتملة؛ الإلغاء يوقف ما يمكن إيقافه فقط.' : 'Progress is stage-weighted; cancellation stops what it can, honestly.')
              : session
                ? `${session.sourceLabel || (isArabic ? 'مزودات النظام فقط' : 'system providers only')} · ${stagesCompleted}/${stagesTotal} ${isArabic ? 'مرحلة' : 'stages'} · ${formatDateTime(session.finishedAt, isArabic)}`
                : sourceReady
                  ? (isArabic ? 'المجلد المصرح مفهرس وجاهز لفحص مقيس.' : 'The authorized folder is indexed and ready to measure.')
                  : (isArabic ? 'صرّح بمجلد من الأعلى وشغّل فحصًا مقيسًا.' : 'Authorize a folder above and run a measured scan.')}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onOpenCustomScan}
          className="px-3 py-1.5 rounded-xl bg-[#0c1f3d] hover:bg-[#132c52] border border-[#173866] text-xs text-slate-200 font-bold transition cursor-pointer"
        >
          {isArabic ? 'فحص مخصص' : 'Custom Scan'}
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={!session || busy}
          className="px-3 py-1.5 rounded-xl bg-[#0c1f3d] hover:bg-[#132c52] border border-[#173866] text-xs text-slate-200 font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isArabic ? 'تصدير التقرير' : 'Export Report'}</span>
        </button>
        {active ? (
          <button
            type="button"
            onClick={onCancelScan}
            disabled={busy}
            className="px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-xs text-rose-200 font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Ban className="w-3.5 h-3.5" />
            {isArabic ? 'إلغاء الفحص' : 'Cancel Scan'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenCleanupGate}
          disabled={!session || busy}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black shadow-[0_0_20px_rgba(37,99,235,0.55)] border border-cyan-300/50 transition duration-200 cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{isArabic ? 'بوابة التنظيف (المهمة 08)' : 'Cleanup Gate (Mission 08)'}</span>
          <Sparkles className="w-3.5 h-3.5 opacity-70" />
        </button>
        <span className="hidden xl:flex items-center gap-1 text-[9px] text-emerald-300/80 font-mono">
          <ShieldCheck className="w-3 h-3" />
          {isArabic ? 'لا تغيير على الملفات' : 'no file mutation'}
        </span>
      </div>
    </div>
  );
};
