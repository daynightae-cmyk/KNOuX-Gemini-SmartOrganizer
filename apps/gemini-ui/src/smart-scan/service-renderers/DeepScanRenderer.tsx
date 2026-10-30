/**
 * SCAN-02 — Deep Scan measured workspace.
 * Every read-only provider stage with explicit coverage and gated scope.
 */
import React from 'react';
import { CheckCircle2, CircleDashed, ChevronDown, Search, ShieldAlert, XCircle } from 'lucide-react';
import { CopyEvidence, EmptyResult, FilterChips, GatedNote, Metric, byteLabel, countLabel, type ServiceRendererProps } from './shared';
import { stageStatusLabel } from '../model';

type StageFilter = 'all' | 'complete' | 'attention';

const isAttentionStage = (status: string) => status === 'failed' || status === 'partial' || status === 'skipped' || status === 'unsupported';

export const DeepScanRenderer: React.FC<ServiceRendererProps> = ({ service, session, isArabic }) => {
  const [stageFilter, setStageFilter] = React.useState<StageFilter>('all');
  const [openStageId, setOpenStageId] = React.useState<string | null>(null);

  if (!service) return <EmptyResult service={service} isArabic={isArabic} />;
  const data = service.data;
  const stages = service.stages || [];
  const sessionStages = new Map((session?.stages || []).map((stage) => [stage.id, stage]));
  const completeStages = stages.filter((stage) => stage.status === 'complete').length;
  const attentionStages = stages.filter((stage) => isAttentionStage(stage.status)).length;
  const visibleStages = stages.filter((stage) => {
    if (stageFilter === 'complete') return stage.status === 'complete';
    if (stageFilter === 'attention') return isAttentionStage(stage.status);
    return true;
  });

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
        <div className="flex items-center gap-1.5 shrink-0">
          <CopyEvidence testId="scan-deep_scan-copy" payload={{ serviceId: service.serviceId, status: service.status, data, stages }} isArabic={isArabic} />
          <span className="px-1.5 py-0.5 rounded bg-cyan-400/15 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-400/40">
            {service.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="scan-metric-grid gap-2">
        <Metric label={isArabic ? 'ملفات مفهرسة' : 'Indexed files'} value={countLabel(data.totals?.files, isArabic)} sub={byteLabel(data.totals?.bytes, isArabic)} />
        <Metric label={isArabic ? 'مجموعات مكررة متحقق منها' : 'Verified duplicate groups'} value={String(data.duplicateSummary?.verifiedGroups ?? 0)} sub={byteLabel(data.duplicateSummary?.reclaimableVerifiedBytes, isArabic)} tone="emerald" />
        <Metric label={isArabic ? 'عناصر الإقلاع' : 'Startup entries'} value={countLabel(data.startupCount, isArabic)} sub={isArabic ? 'بدون زمن إقلاع مزعوم' : 'no invented boot seconds'} tone="amber" />
        <Metric label={isArabic ? 'برامج مثبتة' : 'Installed apps'} value={countLabel(data.appCount, isArabic)} sub={isArabic ? 'من سجل إلغاء التثبيت' : 'from uninstall registry'} />
      </div>

      <div className="scan-split gap-2">
        <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
            <div className="text-[10px] font-bold text-cyan-300">{isArabic ? 'خط زمني للمراحل المقيسة' : 'Measured stage timeline'}</div>
            <FilterChips
              testId="scan-deep_scan-stage-filter"
              labelEn="Stages"
              labelAr="المراحل"
              value={stageFilter}
              onChange={setStageFilter}
              isArabic={isArabic}
              options={[
                { id: 'all' as StageFilter, labelEn: 'All', labelAr: 'الكل', count: stages.length },
                { id: 'complete' as StageFilter, labelEn: 'Complete', labelAr: 'مكتملة', count: completeStages },
                { id: 'attention' as StageFilter, labelEn: 'Attention', labelAr: 'تحتاج انتباهًا', count: attentionStages },
              ]}
            />
          </div>
          <div className="space-y-1">
            {visibleStages.map((stage) => {
              const open = openStageId === stage.id;
              const detailed = sessionStages.get(stage.id);
              const facts = [
                detailed?.provider ? `${isArabic ? 'المزود' : 'provider'}: ${detailed.provider}` : null,
                detailed?.durationMs == null ? null : `${isArabic ? 'المدة' : 'duration'}: ${detailed.durationMs} ms`,
                detailed?.detail,
                detailed?.error ? `${detailed.error.code}: ${detailed.error.message}` : null,
              ].filter(Boolean) as string[];
              return (
                <div key={stage.id} data-testid={`scan-stage-${stage.id}`} data-stage-status={stage.status}>
                  <button
                    type="button"
                    onClick={() => setOpenStageId(open ? null : stage.id)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between gap-2 text-[10px] rounded-lg px-1.5 py-1 hover:bg-[#0d2246] transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-slate-300 min-w-0">
                      {stage.status === 'complete' ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> : isAttentionStage(stage.status) ? <XCircle className="w-3 h-3 text-rose-400 shrink-0" /> : <CircleDashed className="w-3 h-3 text-slate-500 shrink-0" />}
                      <span className="truncate">{isArabic ? stage.labelAr : stage.labelEn}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="font-mono text-slate-500">{stageStatusLabel(stage.status, isArabic)}</span>
                      <ChevronDown className={`w-3 h-3 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {open ? (
                    <div className="ms-4 mb-1 rounded-lg border border-[#11284a] bg-[#071731] px-2 py-1 space-y-0.5">
                      {facts.length ? (
                        facts.map((fact) => (
                          <div key={fact} className="font-mono text-[9px] text-slate-400 break-words">{fact}</div>
                        ))
                      ) : (
                        <div className="text-[9px] text-slate-500">{isArabic ? 'لا تفاصيل إضافية مسجلة لهذه المرحلة.' : 'No extra detail was recorded for this stage.'}</div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {!visibleStages.length ? <p className="text-[10px] text-slate-500">{isArabic ? 'لا مراحل مطابقة لهذا المرشح.' : 'No stage matches this filter.'}</p> : null}
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
