/**
 * SCAN-06 — Privacy Trace Check measured workspace.
 *
 * Samples Windows Zone.Identifier provenance for recently indexed files only.
 * Browser history, cookies and clipboard data are explicitly not read.
 */
import React from 'react';
import { EyeOff, Fingerprint, Globe2, Lock, Shield, ShieldAlert } from 'lucide-react';
import { CopyEvidence, EmptyResult, FilterChips, Metric, StageStrip, countLabel, type ServiceRendererProps } from './shared';

type SampleFilter = 'all' | 'marked' | 'unmarked';

export const PrivacyTraceRenderer: React.FC<ServiceRendererProps> = ({ service, isArabic }) => {
  const [sampleFilter, setSampleFilter] = React.useState<SampleFilter>('all');
  const [hostFilter, setHostFilter] = React.useState<string | null>(null);

  if (!service) return <EmptyResult service={service} isArabic={isArabic} />;
  const data = service.data;
  const sample = data.sample;
  const samples = sample?.samples || [];
  const hosts = sample?.hosts || [];
  const coverage = sample && sample.sampled > 0 ? Math.round((sample.withZone / sample.sampled) * 100) : null;
  const markedCount = samples.filter((entry) => entry.zoneAvailable).length;
  const visibleSamples = samples.filter((entry) => {
    if (hostFilter && entry.host !== hostFilter) return false;
    if (sampleFilter === 'marked') return entry.zoneAvailable;
    if (sampleFilter === 'unmarked') return !entry.zoneAvailable;
    return true;
  });

  return (
    <div className="space-y-3 text-slate-100 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-[#143058] pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">{isArabic ? 'فحص آثار الخصوصية — عينة مقيسة' : 'Privacy Trace Check — Measured Sample'}</h3>
            <p className="text-[10px] text-slate-400">
              {isArabic ? 'علامات أصل التنزيل من Zone.Identifier داخل المجلد المصرح به' : 'Download-origin markers from Zone.Identifier inside the authorized folder'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <CopyEvidence testId="scan-privacy_trace_check-copy" payload={{ serviceId: service.serviceId, status: service.status, sample }} isArabic={isArabic} />
          <span className="px-1.5 py-0.5 rounded bg-teal-400/15 text-teal-300 font-mono text-[9px] font-bold border border-teal-400/40">
            READ-ONLY
          </span>
        </div>
      </div>

      <div className="scan-metric-grid gap-2">
        <Metric label={isArabic ? 'ملفات معاينة' : 'Files sampled'} value={countLabel(sample?.sampled, isArabic)} sub={`${isArabic ? 'حد العينة' : 'sample limit'}: ${countLabel(sample?.sampleLimit, isArabic)}`} />
        <Metric label={isArabic ? 'بعلامة أصل' : 'With origin marker'} value={countLabel(sample?.withZone, isArabic)} sub={coverage == null ? (isArabic ? 'غير متاح' : 'unavailable') : `${coverage}% ${isArabic ? 'من العينة' : 'of sample'}`} tone="emerald" />
        <Metric label={isArabic ? 'مضيفون مقيسون' : 'Measured hosts'} value={String(hosts.length)} sub={hosts[0] || (isArabic ? 'لا مضيف' : 'no host')} />
        <Metric label={isArabic ? 'أخطاء قراءة' : 'Read errors'} value={countLabel(sample?.errors, isArabic)} sub={isArabic ? 'بيانات وصفية فقط' : 'metadata only'} tone={sample?.errors ? 'rose' : 'cyan'} />
      </div>

      <div className="scan-split gap-2">
        <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-300">
              <Globe2 className="w-3.5 h-3.5" />
              {isArabic ? 'المضيفون المقيسون' : 'Measured hosts'}
            </div>
            {hostFilter ? (
              <button
                type="button"
                onClick={() => setHostFilter(null)}
                data-testid="scan-privacy_trace_check-host-clear"
                className="px-1.5 py-0.5 rounded border border-teal-500/40 bg-teal-950/40 text-[9px] font-bold text-teal-200 cursor-pointer"
              >
                {isArabic ? 'إظهار الكل' : 'Show all'}
              </button>
            ) : null}
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto knx-custom-scrollbar">
            {hosts.map((host) => {
              const active = hostFilter === host;
              const hostCount = samples.filter((entry) => entry.host === host).length;
              return (
                <button
                  key={host}
                  type="button"
                  onClick={() => setHostFilter(active ? null : host)}
                  aria-pressed={active}
                  data-testid={`scan-privacy_trace_check-host-${host}`}
                  className={`w-full flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] text-start transition cursor-pointer ${
                    active ? 'border-teal-400/60 bg-teal-950/60' : 'border-[#11284a] bg-[#071731] hover:border-teal-500/40'
                  }`}
                >
                  <Fingerprint className="w-3 h-3 text-teal-400 shrink-0" />
                  <span className="font-mono text-slate-300 truncate min-w-0 flex-1">{host}</span>
                  <span className="font-mono text-[9px] text-slate-500 shrink-0">{hostCount}</span>
                </button>
              );
            })}
            {!hosts.length ? <p className="text-[10px] text-slate-500">{isArabic ? 'لم يُقرأ أي مضيف أصل في هذه العينة.' : 'No origin host was measured in this sample.'}</p> : null}
          </div>
        </div>

        <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-300 mb-2">
            <EyeOff className="w-3.5 h-3.5" />
            {isArabic ? 'بيانات لم تُقرأ — صراحةً' : 'Explicitly not read'}
          </div>
          <ul className="space-y-1 text-[10px] text-slate-400">
            <li className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-slate-500" />{isArabic ? 'سجل المتصفح' : 'Browser history'}: {isArabic ? 'لا' : 'no'}</li>
            <li className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-slate-500" />{isArabic ? 'ملفات تعريف الارتباط' : 'Cookies'}: {isArabic ? 'لا' : 'no'}</li>
            <li className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-slate-500" />{isArabic ? 'الحافظة' : 'Clipboard'}: {isArabic ? 'لا' : 'no'}</li>
          </ul>
          <p className="text-[9px] text-slate-500 mt-2 leading-relaxed">
            {isArabic
              ? 'العينة محدودة بالملفات المفهرسة حديثًا؛ لا تُمثل جردًا كاملًا لآثار الخصوصية.'
              : 'The sample is bounded to recently indexed files; it is not a complete privacy-trace inventory.'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            {isArabic ? 'عينة العلامات المقيسة' : 'Measured marker sample'}
          </div>
          <FilterChips
            testId="scan-privacy_trace_check-sample-filter"
            labelEn="Markers"
            labelAr="العلامات"
            value={sampleFilter}
            onChange={setSampleFilter}
            isArabic={isArabic}
            options={[
              { id: 'all' as SampleFilter, labelEn: 'All', labelAr: 'الكل', count: samples.length },
              { id: 'marked' as SampleFilter, labelEn: 'With origin', labelAr: 'بعلامة أصل', count: markedCount },
              { id: 'unmarked' as SampleFilter, labelEn: 'No marker', labelAr: 'بلا علامة', count: samples.length - markedCount },
            ]}
          />
        </div>
        {hostFilter ? (
          <p className="text-[9px] text-teal-300 mb-1 font-mono">{isArabic ? 'مضيف:' : 'host:'} {hostFilter}</p>
        ) : null}
        <div className="space-y-1 max-h-40 overflow-y-auto knx-custom-scrollbar" data-testid="scan-privacy_trace_check-sample-list">
          {visibleSamples.map((entry) => (
            <div key={`${entry.fileId}:${entry.relative}`} className="flex items-center justify-between gap-2 rounded-lg border border-[#11284a] bg-[#071731] px-2 py-1 text-[10px]">
              <span className="font-mono text-slate-300 truncate min-w-0" title={entry.relative}>{entry.name}</span>
              <span className="flex items-center gap-1 shrink-0">
                {entry.host ? <span className="px-1.5 py-0.5 rounded bg-teal-950/50 border border-teal-500/30 text-teal-300 font-mono text-[9px]">{entry.host}</span> : null}
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${entry.zoneAvailable ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30' : 'bg-slate-900 text-slate-500 border-slate-700'}`}>
                  {entry.zoneAvailable ? `Zone ${entry.zoneId ?? '?'}` : isArabic ? 'بلا علامة' : 'no marker'}
                </span>
              </span>
            </div>
          ))}
          {!samples.length ? <p className="text-[10px] text-slate-500">{isArabic ? 'لم تُقرأ عينة في هذه الجلسة.' : 'No sample was measured in this session.'}</p> : null}
          {samples.length && !visibleSamples.length ? (
            <p className="text-[10px] text-slate-500">{isArabic ? 'لا صفوف مطابقة للمرشح الحالي.' : 'No row matches the current filter.'}</p>
          ) : null}
        </div>
      </div>

      <StageStrip service={service} isArabic={isArabic} />
      <p className="text-[9px] text-slate-500">
        {isArabic
          ? 'لا يغيّر هذا الفحص أي ملف أو بيانات وصفية؛ عرض أصل التنزيل فقط.'
          : 'This check changes no file or metadata; it only reports download provenance.'}
      </p>
    </div>
  );
};
