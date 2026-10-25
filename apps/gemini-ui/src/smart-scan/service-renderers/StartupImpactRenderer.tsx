/**
 * SCAN-07 — Startup Impact Check measured workspace.
 *
 * Reads Win32_StartupCommand entries. Boot-time seconds are not measured and
 * are never invented. Enable/disable remains gated to Mission 09.
 */
import React from 'react';
import { Info, Lock, Rocket, ShieldCheck } from 'lucide-react';
import { EmptyResult, GatedNote, Metric, StageStrip, WorkspaceLink, countLabel, type ServiceRendererProps } from './shared';

export const StartupImpactRenderer: React.FC<ServiceRendererProps> = ({ service, isArabic, onNavigateToWorkspace }) => {
  if (!service) return <EmptyResult service={service} isArabic={isArabic} />;
  const data = service.data;
  const items = data.items || [];
  const bySource = data.bySource || {};
  const sourceEntries = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
  const writable = data.writableCount ?? items.filter((item) => item.writable).length;

  return (
    <div className="space-y-3 text-slate-100 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-[#143058] pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-white shadow-md">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">{isArabic ? 'فحص تأثير الإقلاع — جرد مقيس' : 'Startup Impact — Measured Inventory'}</h3>
            <p className="text-[10px] text-slate-400">
              {isArabic ? 'عناصر بدء التشغيل من Win32_StartupCommand دون اختلاق زمن إقلاع' : 'Autostart entries from Win32_StartupCommand with no invented boot seconds'}
            </p>
          </div>
        </div>
        <WorkspaceLink workspace="startup" labelEn="Startup Control" labelAr="التحكم بالإقلاع" isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Metric label={isArabic ? 'عناصر الإقلاع' : 'Startup entries'} value={countLabel(items.length, isArabic)} sub={`${sourceEntries.length} ${isArabic ? 'مصادر مقيسة' : 'measured sources'}`} />
        <Metric label={isArabic ? 'قابلة للكتابة' : 'Writable entries'} value={countLabel(writable, isArabic)} sub={isArabic ? 'من الجرد المقيس' : 'from measured inventory'} tone="amber" />
        <Metric label={isArabic ? 'مصادر' : 'Sources'} value={String(sourceEntries.length)} sub={sourceEntries[0]?.[0] || (isArabic ? 'لا مصدر' : 'no source')} />
        <Metric label={isArabic ? 'زمن الإقلاع' : 'Boot time'} value={isArabic ? 'غير مقيس' : 'Not measured'} sub={isArabic ? 'لا تُعرض ثوانٍ مزعومة' : 'no fabricated seconds'} tone="rose" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        <div className="sm:col-span-2 rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="text-[10px] font-bold text-rose-300 mb-2">{isArabic ? 'التوزيع حسب المصدر' : 'Measured source distribution'}</div>
          <div className="space-y-1.5">
            {sourceEntries.map(([source, count]) => {
              const percent = items.length ? Math.round((count / items.length) * 100) : 0;
              return (
                <div key={source} className="text-[10px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-mono truncate">{source}</span>
                    <span className="font-mono text-slate-400 shrink-0">{count}</span>
                  </div>
                  <div className="mt-0.5 h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-rose-400" style={{ width: `${Math.max(3, percent)}%` }} />
                  </div>
                </div>
              );
            })}
            {!sourceEntries.length ? <p className="text-[10px] text-slate-500">{isArabic ? 'لم يُقرأ أي مصدر إقلاع.' : 'No startup source was measured.'}</p> : null}
          </div>
        </div>

        <div className="sm:col-span-3 rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="text-[10px] font-bold text-rose-300 mb-2">{isArabic ? 'العناصر المقيسة' : 'Measured entries'}</div>
          <div className="space-y-1 max-h-40 overflow-y-auto knx-custom-scrollbar">
            {items.map((item) => (
              <div key={`${item.source}:${item.name}`} className="rounded-lg border border-[#11284a] bg-[#071731] px-2 py-1 text-[10px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-200 truncate">{item.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${item.writable ? 'bg-amber-950/50 text-amber-300 border-amber-500/30' : 'bg-slate-900 text-slate-500 border-slate-700'}`}>
                    {item.writable ? (isArabic ? 'قابل للكتابة' : 'writable') : (isArabic ? 'محمي' : 'protected')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[9px] text-slate-500 font-mono mt-0.5">
                  <span className="truncate" title={item.location}>{item.location}</span>
                  <span className="shrink-0">{item.provider}</span>
                </div>
              </div>
            ))}
            {!items.length ? <p className="text-[10px] text-slate-500">{isArabic ? 'لا توجد عناصر إقلاع مقيسة.' : 'No startup entry was measured.'}</p> : null}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-950/15 p-2.5 text-[10px] text-rose-200/90">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          {isArabic
            ? 'هذا جرد للقراءة فقط. لا تُفعّل أو تُعطّل أي عناصر، ولا يُدّعى قياس زمن إقلاع أو توفير ثوانٍ. التغيير محجوز للمهمة 09 بموافقة صريحة.'
            : 'This is a read-only inventory. No entry is enabled or disabled, and no boot-time or time-saved figure is claimed. Mutation is gated to Mission 09 with explicit approval.'}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <StageStrip service={service} isArabic={isArabic} />
        <span className="flex items-center gap-1 text-[9px] text-slate-500">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          {isArabic ? 'لم يتم تغيير أي مفتاح أو خدمة.' : 'No registry key or service was changed.'}
          <Lock className="w-3 h-3 ml-1" />
        </span>
      </div>

      <GatedNote service={service} isArabic={isArabic} />
    </div>
  );
};
