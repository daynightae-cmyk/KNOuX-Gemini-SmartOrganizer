/**
 * KNOuX Studio — persistent context pane shown beside the pinned stage
 * workbench. It exposes the workflow/source/selection state that would
 * otherwise be hidden when a stage is docked.
 */
import React from 'react';
import { ArrowLeft, ArrowRight, FolderTree, HardDrive, Layers, Lock, ShieldCheck } from 'lucide-react';
import { useStudio } from './context';
import type { StudioStageId } from './types';

export function StudioStageContextPanel() {
  const {
    stages,
    activeStageId,
    setActiveStageId,
    authorizedSources,
    inventory,
    selectedFileIds,
    destinationPath,
    operationMode,
    native,
    locale,
    openModal,
    previewNativePlan,
  } = useStudio();
  const isAr = locale === 'ar';
  const activeStage = stages.find((stage) => stage.id === activeStageId) || stages[0];
  const source = authorizedSources[0] || null;
  const sourceLabel = source?.path ? source.path.split(/[\/]/).filter(Boolean).slice(-2).join(' / ') : null;

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3 px-6 py-3 overflow-y-auto studio-scrollbar" data-testid="studio-context-panel">
      <section className="studio-glass-panel rounded-xl border border-[#132c52] p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">
              {isAr ? 'مرحلة العمل النشطة' : 'Active workflow stage'}
            </div>
            <h2 className="text-lg font-bold text-white truncate">
              {isAr ? activeStage?.nameAr : activeStage?.nameEn}
            </h2>
          </div>
          <span className="rounded-full border border-[#1b3f70] bg-[#091a33] px-2 py-1 text-[10px] font-mono text-slate-300">
            {activeStageId} / 9
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: isAr ? 'مصادر مصرح بها' : 'Authorized sources', value: String(authorizedSources.length) },
            { label: isAr ? 'ملفات مقيسة' : 'Measured files', value: inventory.totalFiles.toLocaleString() },
            { label: isAr ? 'محددة' : 'Selected', value: String(selectedFileIds.size) },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-[#132c52] bg-[#040d1c] p-2">
              <div className="text-[9px] text-slate-500">{item.label}</div>
              <div className="font-mono text-sm font-black text-white">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveStageId(Math.max(1, activeStageId - 1) as StudioStageId)}
            disabled={activeStageId === 1}
            className="rounded border border-[#173866] bg-[#08162b] px-2 py-1 text-[10px] text-slate-300 disabled:opacity-40"
            aria-label={isAr ? 'المرحلة السابقة' : 'Previous stage'}
          >
            <ArrowLeft className="inline h-3 w-3" /> {isAr ? 'السابق' : 'Previous'}
          </button>
          <button
            type="button"
            onClick={() => setActiveStageId(Math.min(9, activeStageId + 1) as StudioStageId)}
            disabled={activeStageId === 9}
            className="rounded border border-[#173866] bg-[#08162b] px-2 py-1 text-[10px] text-slate-300 disabled:opacity-40"
            aria-label={isAr ? 'المرحلة التالية' : 'Next stage'}
          >
            {isAr ? 'التالي' : 'Next'} <ArrowRight className="inline h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => openModal('add_folder')}
            className="ms-auto rounded bg-[#0e274d] border border-[#2476ff]/50 px-2 py-1 text-[10px] text-cyan-200"
          >
            {isAr ? 'إضافة مصدر' : 'Add source'}
          </button>
        </div>
      </section>

      <section className="studio-glass-panel rounded-xl border border-[#132c52] p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-white"><FolderTree className="h-4 w-4 text-cyan-400" />{isAr ? 'المصدر الحالي' : 'Current source'}</div>
        {source ? (
          <>
            <div className="font-mono text-[10px] text-slate-300 truncate" title={sourceLabel || undefined}>{sourceLabel}</div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{source.fileCount.toLocaleString()} {isAr ? 'ملف' : 'files'}</span>
              <span className="font-mono text-cyan-300">{source.sizeGb.toFixed(1)} GB</span>
              <span className={source.status === 'authorized' ? 'text-emerald-300' : 'text-amber-300'}>{source.status}</span>
            </div>
          </>
        ) : (
          <p className="text-[10px] text-amber-300">{isAr ? 'لا يوجد مصدر مصرح به.' : 'No authorized source yet.'}</p>
        )}
        <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-[#0f2545] pt-2">
          <span>{isAr ? 'الوضع' : 'Data mode'}</span>
          <span className="font-mono text-slate-200">{native.mode}</span>
          <span>{native.available ? (isAr ? 'الجسر متاح' : 'bridge available') : (isAr ? 'الجسر غير متاح' : 'bridge unavailable')}</span>
        </div>
        {native.error ? <p className="text-[10px] text-rose-300">{native.error}</p> : null}
      </section>

      <section className="studio-glass-panel rounded-xl border border-[#132c52] p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-white"><Layers className="h-4 w-4 text-purple-400" />{isAr ? 'خطة التنظيم' : 'Organization plan'}</div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{isAr ? 'الوجهة' : 'Destination'}</span>
          <span className="font-mono text-slate-200 truncate max-w-[55%]" dir="ltr">{destinationPath || '—'}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{isAr ? 'العملية' : 'Operation'}</span>
          <span className="font-mono text-amber-300">{operationMode}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{isAr ? 'الخطة الأصلية' : 'Native plan'}</span>
          <span className={`font-mono ${native.plan ? 'text-emerald-300' : 'text-slate-500'}`}>{native.plan ? (isAr ? 'معاينة متاحة' : 'preview available') : (isAr ? 'غير محسوبة' : 'not computed')}</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => void previewNativePlan()}
            disabled={native.planLoading || !native.available}
            className="rounded bg-[#1b1340] border border-purple-500/40 px-2 py-1 text-[10px] text-purple-200 disabled:opacity-40"
          >
            {native.planLoading ? (isAr ? 'جارٍ الحساب…' : 'Computing…') : (isAr ? 'معاينة الخطة الأصلية' : 'Preview native plan')}
          </button>
          <span className="inline-flex items-center gap-1 text-[9px] text-amber-300"><Lock className="h-3 w-3" />{isAr ? 'التنفيذ محجوب' : 'Execution blocked'}</span>
        </div>
      </section>

      <section className="studio-glass-panel rounded-xl border border-[#132c52] p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-white"><HardDrive className="h-4 w-4 text-sky-400" />{isAr ? 'مسار المراحل' : 'Stage progress'}</div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {stages.map((stage) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStageId(stage.id)}
              className={`rounded border px-1.5 py-1 text-start text-[9px] ${stage.id === activeStageId ? 'border-cyan-400 bg-[#0d254c] text-white' : 'border-[#132c52] bg-[#040d1c] text-slate-400'}`}
            >
              <span className="font-mono text-[8px] text-cyan-300">{String(stage.id).padStart(2, '0')}</span>{' '}
              <span className="truncate">{isAr ? stage.nameAr : stage.nameEn}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1 text-[9.5px] text-amber-300"><ShieldCheck className="h-3 w-3" />{isAr ? 'المعاينة فقط؛ لا تغيير ملفات تلقائي.' : 'Preview only; no automatic file mutation.'}</p>
      </section>
    </div>
  );
}
