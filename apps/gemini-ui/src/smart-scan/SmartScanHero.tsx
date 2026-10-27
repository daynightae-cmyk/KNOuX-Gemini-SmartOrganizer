/**
 * KNOuX SmartOrganizer — Smart Scan Hero & measured scan control.
 *
 * This surface only offers operations the native coordinator actually
 * exposes: authorize/index an existing Studio source, run a measured quick or
 * deep read-only plan, or cancel the active measured session.
 */
import React from 'react';
import {
  Activity,
  Ban,
  CheckCircle2,
  FolderCheck,
  FolderPlus,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react';
import type { ScanSession, StudioSource } from '../../shared/native-contracts';
import { modeLabel, sessionStatusLabel } from './model';
import type { ActiveScanView } from './smartScan.types';
import { OrbitalControl } from '../visual/OrbitalControl';

export interface SmartScanHeroProps {
  isArabic: boolean;
  nativeAvailable: boolean;
  sources: StudioSource[];
  selectedSource: StudioSource | null;
  active: ActiveScanView | null;
  session: ScanSession | null;
  busy: boolean;
  onSelectSource: (sourceId: string) => void;
  onAuthorizeSource: () => void;
  onIndexSource: () => void;
  onRefreshSources: () => void;
  onRunQuick: () => void;
  onRunDeep: () => void;
  onCancel: () => void;
}

export const SmartScanHero: React.FC<SmartScanHeroProps> = ({
  isArabic,
  nativeAvailable,
  sources,
  selectedSource,
  active,
  session,
  busy,
  onSelectSource,
  onAuthorizeSource,
  onIndexSource,
  onRefreshSources,
  onRunQuick,
  onRunDeep,
  onCancel,
}) => {
  const isScanning = Boolean(active) || busy;
  const sourceReady = Boolean(selectedSource && selectedSource.status === 'ready' && selectedSource.fileCount > 0);
  const runningStage = active?.stages.find((stage) => stage.status === 'running') || null;
  const completedStages = active?.stages.filter((stage) => ['complete', 'partial', 'failed', 'skipped', 'unsupported', 'cancelled'].includes(stage.status)).length || 0;
  const totalStages = active?.stages.length || 0;

  return (
    <div data-testid="scan-hero" className="scan-hero shrink-0 min-h-fit relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#061833] via-[#0b264e] to-[#06142a] border border-cyan-400/40 p-3.5 sm:p-4 shadow-[0_0_25px_rgba(14,165,233,0.22)] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="z-10 flex items-center gap-3.5 min-w-0">
        <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-[#1e40af] via-[#2563eb] to-[#38bdf8] flex items-center justify-center shadow-[0_0_18px_rgba(56,189,248,0.6)] border border-cyan-300/60 shrink-0">
          <Target className="w-5 h-5 text-white" />
          <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#061833] ${isScanning ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span className="px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-200 text-[10px] font-mono font-bold tracking-wider uppercase border border-cyan-400/40">
              scan.v1 · read-only
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border ${nativeAvailable ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/80 text-amber-300 border-amber-500/40'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${nativeAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {nativeAvailable ? (isArabic ? 'مزودات ويندوز مقيسة' : 'Measured Windows providers') : (isArabic ? 'الجسر الأصلي غير متاح' : 'Native bridge unavailable')}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900/80 text-slate-400 text-[10px] font-mono font-bold flex items-center gap-1 border border-slate-600/60">
              <Lock className="w-2.5 h-2.5" />
              {isArabic ? 'لا تغيير' : 'no mutation'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 tracking-tight leading-snug">
            {isArabic ? 'فحص أذكى. رؤية أوضح.' : 'Scan smarter. See clearly.'}
          </h1>
          <p className="scan-hero-copy text-[11px] text-slate-300 max-w-2xl font-medium leading-relaxed">
            {isArabic
              ? 'قياس حقيقي للمجلد المصرح به، والسعة، وصحة النظام، والمكررات، والإقلاع، والبرامج. لا أرقام تجريبية.'
              : 'Real measurement of the authorized folder, capacity, system health, duplicates, startup and software. No design numbers.'}
          </p>
        </div>
      </div>

      <OrbitalControl title={isArabic ? 'بدء الفحص الذكي' : 'Start Smart Scan'} subtitle={isArabic ? 'تحليل آمن للقراءة فقط' : 'Safe, read-only analysis'}
        onActivate={sourceReady ? onRunQuick : onAuthorizeSource} disabled={!nativeAvailable || isScanning} running={isScanning}
        tools={[
          { id: 'quick', label: isArabic ? 'سريع' : 'Quick', icon: Zap, onClick: onRunQuick, disabled: !nativeAvailable || !sourceReady || isScanning },
          { id: 'deep', label: isArabic ? 'عميق' : 'Deep', icon: Search, onClick: onRunDeep, disabled: !nativeAvailable || !sourceReady || isScanning },
          { id: 'source', label: isArabic ? 'المصدر' : 'Source', icon: FolderPlus, onClick: onAuthorizeSource, disabled: !nativeAvailable || isScanning },
        ]} />
      <div className="knx-scan-controls z-10 w-full xl:w-auto shrink-0">
        {active ? (
          <div className="rounded-xl border border-cyan-500/35 bg-[#041226]/80 p-2.5 sm:min-w-[340px]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {modeLabel(active.mode as ScanSession['mode'], isArabic)} · {sessionStatusLabel(active.status === 'starting' ? 'running' : active.status, isArabic)}
              </span>
              <button
                type="button"
                onClick={onCancel}
                disabled={busy || active.status === 'starting'}
                className="px-2 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-[10px] font-bold text-rose-200 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Ban className="w-3 h-3" />
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-slate-800 overflow-hidden border border-cyan-500/20">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.max(2, Math.min(100, active.progressPercent))}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[9px] font-mono">
              <span className="text-slate-400 truncate">
                {active.status === 'starting'
                  ? (isArabic ? 'جارٍ بدء المزودات المقيسة...' : 'Starting measured providers...')
                  : runningStage
                    ? `${isArabic ? runningStage.labelAr : runningStage.labelEn} · ${runningStage.provider}`
                    : (isArabic ? 'جارٍ القياس...' : 'Measuring...')}
              </span>
              <span className="text-cyan-300 shrink-0">
                {active.progressPercent}% · {completedStages}/{totalStages}
              </span>
            </div>
            {active.sourceLabel ? (
              <div className="mt-1 text-[9px] text-slate-500 font-mono truncate">
                {isArabic ? 'المصدر' : 'Source'}: {active.sourceLabel}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-[#16406f] bg-[#041226]/70 p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <FolderCheck className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <select
                value={selectedSource?.id || ''}
                onChange={(event) => onSelectSource(event.target.value)}
                disabled={busy || !nativeAvailable || !sources.length}
                className="min-w-0 flex-1 rounded-lg bg-[#071731] border border-[#16406f] text-[10px] text-slate-200 px-2 py-1.5 outline-none focus:border-cyan-400/60 disabled:opacity-50 cursor-pointer"
                data-testid="scan-source-select"
                aria-label={isArabic ? 'المجلد المصرح به' : 'Authorized source folder'}
              >
                {!sources.length ? <option value="">{isArabic ? 'لا يوجد مجلد مصرح' : 'No authorized folder'}</option> : null}
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label} · {source.fileCount.toLocaleString()} {isArabic ? 'ملف' : 'files'}
                    {source.status !== 'ready' ? (isArabic ? ' · يحتاج فهرسة' : ' · needs indexing') : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onAuthorizeSource}
                disabled={busy || !nativeAvailable}
                title={isArabic ? 'تصريح مجلد' : 'Authorize folder'}
                className="p-1.5 rounded-lg bg-[#0d2748] hover:bg-[#153a63] border border-cyan-500/30 text-cyan-300 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onRefreshSources}
                disabled={busy || !nativeAvailable}
                title={isArabic ? 'تحديث المصادر' : 'Refresh sources'}
                className="p-1.5 rounded-lg bg-[#0d2748] hover:bg-[#153a63] border border-[#1b3a63] text-slate-300 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 text-[9px]">
              <span className={`flex items-center gap-1 font-mono truncate ${sourceReady ? 'text-emerald-300' : 'text-amber-300'}`}>
                {sourceReady ? <ShieldCheck className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                {selectedSource
                  ? sourceReady
                    ? `${selectedSource.fileCount.toLocaleString()} ${isArabic ? 'ملف مفهرس' : 'files indexed'}`
                    : (isArabic ? 'المجلد يحتاج فهرسة قبل الفحص' : 'Folder needs indexing before scanning')
                  : (isArabic ? 'صرّح بمجلد لبدء الفحص المقيس' : 'Authorize a folder to start a measured scan')}
              </span>
              {selectedSource && !sourceReady ? (
                <button
                  type="button"
                  onClick={onIndexSource}
                  disabled={busy}
                  className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-[9px] font-bold text-amber-200 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {isArabic ? 'فهرسة الآن' : 'Index now'}
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onRunQuick}
                disabled={busy || !nativeAvailable || !sourceReady}
                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-[10px] font-black shadow-[0_0_14px_rgba(37,99,235,0.45)] border border-cyan-300/40 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                {isArabic ? 'فحص سريع' : 'Quick Scan'}
              </button>
              <button
                type="button"
                onClick={onRunDeep}
                disabled={busy || !nativeAvailable || !sourceReady}
                className="px-2.5 py-1.5 rounded-lg bg-[#0d2748] hover:bg-[#153a63] border border-indigo-400/40 text-indigo-200 text-[10px] font-black transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                {isArabic ? 'فحص عميق' : 'Deep Scan'}
              </button>
            </div>
          </div>
        )}

        {!active && session?.summary ? (
          <div className="mt-1.5 flex items-center justify-end gap-1 text-[9px] text-slate-400 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {isArabic ? 'آخر جلسة' : 'Last session'}: {modeLabel(session.summary.mode, isArabic)} · {sessionStatusLabel(session.summary.status, isArabic)}
          </div>
        ) : null}
      </div>
    </div>
  );
};
