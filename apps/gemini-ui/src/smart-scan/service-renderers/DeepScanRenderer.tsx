/**
 * SCAN-02 — Deep Scan measured workspace.
 * Every read-only provider stage with explicit coverage and gated scope.
 */
import React from 'react';
import { CheckCircle2, CircleDashed, Search, ShieldAlert, XCircle } from 'lucide-react';
import { EmptyResult, GatedNote, Metric, byteLabel, countLabel, type ServiceRendererProps } from './shared';
import { stageStatusLabel } from '../model';

export const DeepScanRenderer: React.FC<ServiceRendererProps> = ({ service, isArabic }) => {
  if (!service) return <EmptyResult service={service} isArabic={isArabic} />;
  const data = service.data;

  return (
    <div className="space-y-3 text-slate-100 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-[#143058] pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-400 flex items-center justify-center text-white shadow-md">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">{isArabic ? 'مساحة الفحص العميق المقيس' : 'Measured Deep Scan'}</h3>
            <p className="text-[10px] text-slate-400">
              {isArabic ? 'جميع المزودات للقراءة فقط مع تجزئة مكررات محدودة' : 'All read-only providers with bounded duplicate hashing'}
            </p>
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-cyan-400/15 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-400/40">
          {service.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Metric label={isArabic ? 'ملفات مفهرسة' : 'Indexed files'} value={countLabel(data.totals?.files, isArabic)} sub={byteLabel(data.totals?.bytes, isArabic)} />
        <Metric label={isArabic ? 'مجموعات مكررة متحقق منها' : 'Verified duplicate groups'} value={String(data.duplicateSummary?.verifiedGroups ?? 0)} sub={byteLabel(data.duplicateSummary?.reclaimableVerifiedBytes, isArabic)} tone="emerald" />
        <Metric label={isArabic ? 'عناصر الإقلاع' : 'Startup entries'} value={countLabel(data.startupCount, isArabic)} sub={isArabic ? 'بدون زمن إقلاع مزعوم' : 'no invented boot seconds'} tone="amber" />
        <Metric label={isArabic ? 'برامج مثبتة' : 'Installed apps'} value={countLabel(data.appCount, isArabic)} sub={isArabic ? 'من سجل إلغاء التثبيت' : 'from uninstall registry'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="text-[10px] font-bold text-cyan-300 mb-2">{isArabic ? 'خط زمني للمراحل المقيسة' : 'Measured stage timeline'}</div>
          <div className="space-y-1.5">
            {service.stages.map((stage) => (
              <div key={stage.id} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="flex items-center gap-1.5 text-slate-300">
                  {stage.status === 'complete' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : stage.status === 'failed' ? <XCircle className="w-3 h-3 text-rose-400" /> : <CircleDashed className="w-3 h-3 text-slate-500" />}
                  {isArabic ? stage.labelAr : stage.labelEn}
                </span>
                <span className="font-mono text-slate-500">{stageStatusLabel(stage.status, isArabic)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="text-[10px] font-bold text-cyan-300 mb-2">{isArabic ? 'ملخص الأدلة' : 'Evidence summary'}</div>
          <div className="space-y-1 text-[10px] text-slate-300">
            <Line label={isArabic ? 'عينة الخصوصية' : 'Privacy sample'} value={data.privacySample ? `${data.privacySample.sampled} / ${data.privacySample.withZone} ${isArabic ? 'بعلامة أصل' : 'with origin'}` : (isArabic ? 'لم تُشغّل' : 'not run')} />
            <Line label={isArabic ? 'مجلدات فارغة' : 'Empty folders'} value={countLabel(data.emptyFolders?.summary?.emptyFolders, isArabic)} />
            <Line label={isArabic ? 'مسارح مسحها' : 'Folders walked'} value={countLabel(data.emptyFolders?.summary?.foldersScanned, isArabic)} />
            <Line label={isArabic ? 'ملفات مجزأة' : 'Files hashed'} value={countLabel(data.duplicateSummary?.filesHashed, isArabic)} />
            <Line label={isArabic ? 'ميزانية التجزئة' : 'Hash budget reached'} value={data.duplicateSummary?.budgetReached ? (isArabic ? 'نعم — جزئي' : 'Yes — partial') : (isArabic ? 'لا' : 'No')} />
          </div>
        </div>
      </div>

      {data.options ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#133059] bg-[#071731] p-2.5 text-[9px] text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>{isArabic ? 'خيارات الجلسة:' : 'Session options:'}</span>
          <span className="font-mono">{data.options.verifyDuplicates ? 'verifyDuplicates' : 'no duplicate hashing'}</span>
          <span className="font-mono">{data.options.includeSlowProviders ? 'includeSlowProviders' : 'fast providers only'}</span>
        </div>
      ) : null}

      <GatedNote service={service} isArabic={isArabic} />
      <p className="text-[9px] text-slate-500">
        {isArabic
          ? 'لا يقوم الفحص العميق بتحليل قطاعات وحدة التخزين كاملة؛ النطاق هو المجلد المصرح به.'
          : 'Deep Scan does not analyze raw whole-volume sectors; the scope is the authorized folder.'}
      </p>
    </div>
  );
};

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-200 text-right">{value}</span>
    </div>
  );
}
