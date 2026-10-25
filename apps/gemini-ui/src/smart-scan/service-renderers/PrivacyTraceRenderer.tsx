/**
 * SCAN-06 — Privacy Trace Check measured workspace.
 *
 * Samples Windows Zone.Identifier provenance for recently indexed files only.
 * Browser history, cookies and clipboard data are explicitly not read.
 */
import React from 'react';
import { EyeOff, Fingerprint, Globe2, Lock, Shield, ShieldAlert } from 'lucide-react';
import { EmptyResult, Metric, StageStrip, countLabel, type ServiceRendererProps } from './shared';

export const PrivacyTraceRenderer: React.FC<ServiceRendererProps> = ({ service, isArabic }) => {
  if (!service) return <EmptyResult service={service} isArabic={isArabic} />;
  const data = service.data;
  const sample = data.sample;
  const samples = sample?.samples || [];
  const hosts = sample?.hosts || [];
  const coverage = sample && sample.sampled > 0 ? Math.round((sample.withZone / sample.sampled) * 100) : null;

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
        <span className="px-1.5 py-0.5 rounded bg-teal-400/15 text-teal-300 font-mono text-[9px] font-bold border border-teal-400/40">
          READ-ONLY
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Metric label={isArabic ? 'ملفات معاينة' : 'Files sampled'} value={countLabel(sample?.sampled, isArabic)} sub={`${isArabic ? 'حد العينة' : 'sample limit'}: ${countLabel(sample?.sampleLimit, isArabic)}`} />
        <Metric label={isArabic ? 'بعلامة أصل' : 'With origin marker'} value={countLabel(sample?.withZone, isArabic)} sub={coverage == null ? (isArabic ? 'غير متاح' : 'unavailable') : `${coverage}% ${isArabic ? 'من العينة' : 'of sample'}`} tone="emerald" />
        <Metric label={isArabic ? 'مضيفون مقيسون' : 'Measured hosts'} value={String(hosts.length)} sub={hosts[0] || (isArabic ? 'لا مضيف' : 'no host')} />
        <Metric label={isArabic ? 'أخطاء قراءة' : 'Read errors'} value={countLabel(sample?.errors, isArabic)} sub={isArabic ? 'بيانات وصفية فقط' : 'metadata only'} tone={sample?.errors ? 'rose' : 'cyan'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-300 mb-2">
            <Globe2 className="w-3.5 h-3.5" />
            {isArabic ? 'المضيفون المقيسون' : 'Measured hosts'}
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto knx-custom-scrollbar">
            {hosts.map((host) => (
              <div key={host} className="flex items-center gap-1.5 rounded-lg border border-[#11284a] bg-[#071731] px-2 py-1 text-[10px]">
                <Fingerprint className="w-3 h-3 text-teal-400 shrink-0" />
                <span className="font-mono text-slate-300 truncate">{host}</span>
              </div>
            ))}
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
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-300 mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          {isArabic ? 'عينة العلامات المقيسة' : 'Measured marker sample'}
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto knx-custom-scrollbar">
          {samples.map((entry) => (
            <div key={`${entry.fileId}:${entry.relative}`} className="flex items-center justify-between gap-2 rounded-lg border border-[#11284a] bg-[#071731] px-2 py-1 text-[10px]">
              <span className="font-mono text-slate-300 truncate" title={entry.relative}>{entry.name}</span>
              <span className="flex items-center gap-1 shrink-0">
                {entry.host ? <span className="px-1.5 py-0.5 rounded bg-teal-950/50 border border-teal-500/30 text-teal-300 font-mono text-[9px]">{entry.host}</span> : null}
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${entry.zoneAvailable ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30' : 'bg-slate-900 text-slate-500 border-slate-700'}`}>
                  {entry.zoneAvailable ? `Zone ${entry.zoneId ?? '?'}` : isArabic ? 'بلا علامة' : 'no marker'}
                </span>
              </span>
            </div>
          ))}
          {!samples.length ? <p className="text-[10px] text-slate-500">{isArabic ? 'لم تُقرأ عينة في هذه الجلسة.' : 'No sample was measured in this session.'}</p> : null}
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
