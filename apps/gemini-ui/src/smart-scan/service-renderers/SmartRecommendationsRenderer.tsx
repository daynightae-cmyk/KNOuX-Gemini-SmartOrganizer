/**
 * SCAN-10 — Smart Recommendations measured workspace.
 *
 * Recommendations are produced by deterministic local rules over measured
 * findings. No AI provider, credential or external call is used.
 */
import React from 'react';
import { CheckCircle2, FlaskConical, Lightbulb, ShieldAlert, Sparkles } from 'lucide-react';
import { EmptyResult, Metric, StageStrip, type ServiceRendererProps } from './shared';

export const SmartRecommendationsRenderer: React.FC<ServiceRendererProps> = ({ service, session, isArabic }) => {
  if (!service) return <EmptyResult service={service} isArabic={isArabic} />;
  const data = service.data;
  const recommendations = data.recommendations?.length ? data.recommendations : session?.recommendations || [];
  const measuredCount = recommendations.filter((entry) => entry.confidence === 'measured').length;
  const derivedCount = recommendations.filter((entry) => entry.confidence === 'derived').length;
  const attentionCount = recommendations.filter((entry) => entry.risk === 'attention').length;

  return (
    <div className="space-y-3 text-slate-100 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-[#143058] pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-white">{isArabic ? 'توصيات مبنية على أدلة مقيسة' : 'Evidence-Based Recommendations'}</h3>
              <span className="px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 font-mono text-[9px] font-bold border border-amber-400/40">
                LOCAL RULES
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {data.method || (isArabic ? 'قواعد محلية حتمية فوق النتائج المقيسة' : 'Deterministic local rules over measured findings')}
            </p>
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px] font-bold border border-slate-700">
          NO AI PROVIDER
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Metric label={isArabic ? 'توصيات' : 'Recommendations'} value={String(recommendations.length)} sub={isArabic ? 'نتاج القواعد' : 'rule output'} />
        <Metric label={isArabic ? 'ثقة مقيسة' : 'Measured confidence'} value={String(measuredCount)} sub={isArabic ? 'دليل مباشر' : 'direct evidence'} tone="emerald" />
        <Metric label={isArabic ? 'ثقة مشتقة' : 'Derived confidence'} value={String(derivedCount)} sub={isArabic ? 'قاعدة فوق القياس' : 'rule over measurement'} tone="amber" />
        <Metric label={isArabic ? 'تحتاج انتباهًا' : 'Needs attention'} value={String(attentionCount)} sub={isArabic ? 'ليست إجراءً تلقائيًا' : 'not an automatic action'} tone={attentionCount ? 'rose' : 'cyan'} />
      </div>

      <div className="space-y-1.5 max-h-[290px] overflow-y-auto knx-custom-scrollbar pr-0.5">
        {recommendations.map((entry, index) => (
          <div key={entry.id} className="rounded-xl border border-[#133059] bg-[#091a38] p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <span className="w-5 h-5 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-100">{isArabic ? entry.titleAr : entry.titleEn}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{isArabic ? entry.detailAr : entry.detailEn}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${entry.confidence === 'measured' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30' : 'bg-amber-950/50 text-amber-300 border-amber-500/30'}`}>
                  {entry.confidence === 'measured' ? (isArabic ? 'مقيس' : 'MEASURED') : (isArabic ? 'مشتق' : 'DERIVED')}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${entry.risk === 'attention' ? 'bg-rose-950/50 text-rose-300 border-rose-500/30' : entry.risk === 'review' ? 'bg-amber-950/50 text-amber-300 border-amber-500/30' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
                  {entry.risk === 'attention' ? (isArabic ? 'انتباه' : 'ATTENTION') : entry.risk === 'review' ? (isArabic ? 'مراجعة' : 'REVIEW') : (isArabic ? 'معلومة' : 'INFO')}
                </span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px]">
              <span className="px-1.5 py-0.5 rounded bg-[#071731] border border-[#11284a] text-slate-400 font-mono">{entry.evidence}</span>
              <span className="px-1.5 py-0.5 rounded bg-[#071731] border border-[#11284a] text-cyan-300 font-mono">{entry.target}</span>
            </div>
          </div>
        ))}
        {!recommendations.length ? (
          <div className="rounded-xl border border-dashed border-[#1b3a63] bg-[#071731] p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-300">
              {isArabic ? 'لم تُطلق أي قاعدة توصية على الأدلة المقيسة.' : 'No recommendation rule fired on the measured evidence.'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              {isArabic ? 'هذه نتيجة صادقة، وليست قائمة تجريبية.' : 'This is an honest result, not a design list.'}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-950/15 p-2.5 text-[10px] text-amber-200/90">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          {isArabic
            ? 'التوصيات لا تنفذ أي تغيير. أي تنظيف أو تعطيل أو إلغاء تثبيت يتطلب مهمة محجوزة وموافقة صريحة.'
            : 'Recommendations perform no change. Any cleanup, disable or uninstall requires its gated mission and explicit approval.'}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <StageStrip service={service} isArabic={isArabic} />
        <span className="flex items-center gap-1 text-[9px] text-slate-500">
          <FlaskConical className="w-3 h-3 text-amber-400" />
          {isArabic ? 'اشتقاق حتمي بلا اتصال خارجي' : 'Deterministic; no external call'}
          <Sparkles className="w-3 h-3 ml-1 text-amber-400" />
        </span>
      </div>
    </div>
  );
};
