/**
 * KNOuX SmartOrganizer — measured stage console.
 *
 * Replaces the former simulated telemetry console on Smart Scan. It renders
 * only stage statuses, durations and provider attribution reported by the
 * native coordinator.
 */
import React from 'react';
import { Activity, CheckCircle2, CircleDashed, Loader2, XCircle } from 'lucide-react';
import type { ScanSummary } from '../../shared/native-contracts';
import type { ActiveScanView, ScanStageView } from './smartScan.types';
import { stageStatusLabel } from './model';

export interface ScanStageConsoleProps {
  active: ActiveScanView | null;
  summary: ScanSummary | null;
  stages: ScanStageView[];
  isArabic?: boolean;
}

function iconFor(status: ScanStageView['status']) {
  if (status === 'complete') return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
  if (status === 'running') return <Loader2 className="w-3 h-3 text-cyan-300 animate-spin" />;
  if (status === 'failed') return <XCircle className="w-3 h-3 text-rose-400" />;
  if (status === 'partial' || status === 'skipped' || status === 'unsupported') return <CircleDashed className="w-3 h-3 text-amber-400" />;
  return <CircleDashed className="w-3 h-3 text-slate-600" />;
}

export const ScanStageConsole: React.FC<ScanStageConsoleProps> = ({ active, summary, stages, isArabic = false }) => {
  if (!summary && !active) return null;
  const progress = active?.progressPercent ?? summary?.progressPercent ?? 0;
  const executing = Boolean(active);
  const completed = stages.filter((stage) => ['complete', 'partial', 'failed', 'skipped', 'unsupported', 'cancelled'].includes(stage.status)).length;

  return (
    <div data-testid="scan-stage-console" className="rounded-2xl border border-[#11294a] bg-[#050f21]/95 px-3 py-2 shadow-[0_0_18px_rgba(4,11,24,0.65)] backdrop-blur-md shrink-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-200 shrink-0">
          <Activity className={`w-3.5 h-3.5 ${executing ? 'text-cyan-300 animate-pulse' : 'text-emerald-400'}`} />
          {isArabic ? 'سجل المراحل المقيسة' : 'Measured stage console'}
        </span>
        <span className="text-[9px] font-mono text-slate-500 shrink-0">
          {stages.length ? `${completed}/${stages.length}` : '0/0'} {isArabic ? 'مرحلة' : 'stages'}
        </span>
        <div className="flex-1 min-w-[140px] h-1.5 rounded-full bg-slate-800 overflow-hidden border border-cyan-500/20">
          <div
            className={`h-full transition-all duration-300 ${executing ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-emerald-500'}`}
            style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
          />
        </div>
        <span className={`text-[9px] font-mono shrink-0 ${executing ? 'text-cyan-300' : 'text-emerald-300'}`}>{progress}%</span>
        <span className="text-[9px] font-mono text-slate-500 shrink-0 truncate max-w-[180px]" title={active?.sourceLabel || summary?.sourceLabel || ''}>
          {active?.sourceLabel || summary?.sourceLabel || (isArabic ? 'مزودات النظام فقط' : 'system providers only')}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-1 overflow-x-auto knx-custom-scrollbar pb-0.5">
        {stages.map((stage) => (
          <span
            key={stage.id}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-mono whitespace-nowrap shrink-0 ${
              stage.status === 'complete'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/25'
                : stage.status === 'running'
                  ? 'bg-cyan-950/50 text-cyan-200 border-cyan-500/35'
                  : stage.status === 'failed'
                    ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                    : stage.status === 'partial' || stage.status === 'skipped' || stage.status === 'unsupported'
                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/25'
                      : 'bg-slate-900/60 text-slate-500 border-slate-700'
            }`}
            title={`${stage.provider}${stage.detail ? ` — ${stage.detail}` : ''}`}
          >
            {iconFor(stage.status)}
            <span>{isArabic ? stage.labelAr : stage.labelEn}</span>
            <span className="text-slate-500">·</span>
            <span>{stageStatusLabel(stage.status, isArabic)}</span>
            {stage.durationMs != null ? <span className="text-slate-500">{stage.durationMs}ms</span> : null}
          </span>
        ))}
        {!stages.length ? (
          <span className="text-[9px] text-slate-500 font-mono">
            {executing ? (isArabic ? 'بانتظار أول مرحلة مقيسة...' : 'Awaiting the first measured stage...') : (isArabic ? 'لا توجد مراحل في الجلسة المحددة.' : 'No stages in the selected session.')}
          </span>
        ) : null}
      </div>
    </div>
  );
};
