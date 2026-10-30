/**
 * SCAN-08 — App Health Review measured workspace.
 *
 * Reads the installed-software registry inventory only. "Unused" verdicts and
 * uninstall actions are not measured and remain gated to Mission 05.
 */
import React from 'react';
import { Building2, Grid, Info, Lock, Package } from 'lucide-react';
import { EmptyResult, GatedNote, Metric, StageStrip, WorkspaceLink, countLabel, type ServiceRendererProps } from './shared';

export const AppHealthRenderer: React.FC<ServiceRendererProps> = ({ service, isArabic, onNavigateToWorkspace }) => {
  if (!service) return <EmptyResult service={service} isArabic={isArabic} />;
  const data = service.data;
  const publishers = data.publishers || [];
  const apps = data.apps || [];
  const total = data.total;
  const listed = apps.length;

  return (
    <div className="space-y-3 text-slate-100 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-[#143058] pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-purple-400 flex items-center justify-center text-white shadow-md">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">{isArabic ? 'صحة البرامج — جرد التثبيت المقيس' : 'App Health — Measured Install Inventory'}</h3>
            <p className="text-[10px] text-slate-400">
              {isArabic ? 'من سجل إلغاء التثبيت؛ دون حكم "غير مستخدم" أو إلغاء تثبيت' : 'From the uninstall registry; no “unused” verdict or uninstall action'}
            </p>
          </div>
        </div>
        <WorkspaceLink workspace="applications" labelEn="Applications Hub" labelAr="مركز التطبيقات" isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />
      </div>

      <div className="scan-metric-grid gap-2">
        <Metric label={isArabic ? 'برامج مثبتة' : 'Installed apps'} value={countLabel(total, isArabic)} sub={isArabic ? 'من السجل المقيس' : 'from measured registry'} />
        <Metric label={isArabic ? 'ناشرون' : 'Publishers'} value={String(publishers.length)} sub={publishers[0]?.publisher || (isArabic ? 'غير متاح' : 'unavailable')} />
        <Metric label={isArabic ? 'معروضة هنا' : 'Listed here'} value={String(listed)} sub={isArabic ? 'عينة عرض محدودة' : 'bounded display sample'} />
        <Metric label={isArabic ? 'إلغاء التثبيت' : 'Uninstall'} value={isArabic ? 'محجوز' : 'Gated'} sub={isArabic ? 'المهمة 05' : 'Mission 05'} tone="rose" />
      </div>

      <div className="scan-split scan-split-2-3 gap-2">
        <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-300 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            {isArabic ? 'الناشرون المقيسون' : 'Measured publishers'}
          </div>
          <div className="space-y-1.5 max-h-44 overflow-y-auto knx-custom-scrollbar">
            {publishers.slice(0, 10).map((entry) => {
              const percent = total ? Math.round((entry.count / total) * 100) : 0;
              return (
                <div key={entry.publisher} className="text-[10px]">
                  <div className="flex items-center justify-between text-slate-300 gap-2">
                    <span className="truncate">{entry.publisher}</span>
                    <span className="font-mono text-slate-400 shrink-0">{entry.count}</span>
                  </div>
                  <div className="mt-0.5 h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-violet-400" style={{ width: `${Math.max(3, percent)}%` }} />
                  </div>
                </div>
              );
            })}
            {!publishers.length ? <p className="text-[10px] text-slate-500">{isArabic ? 'لم يُقرأ أي ناشر.' : 'No publisher was measured.'}</p> : null}
          </div>
        </div>

        <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-300 mb-2">
            <Package className="w-3.5 h-3.5" />
            {isArabic ? 'أحدث البرامج المقيسة' : 'Measured installed software'}
          </div>
          <div className="space-y-1 max-h-44 overflow-y-auto knx-custom-scrollbar">
            {apps.map((app, index) => (
              <div key={`${app.name}:${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-[#11284a] bg-[#071731] px-2 py-1 text-[10px]">
                <div className="min-w-0">
                  <div className="font-bold text-slate-200 truncate">{app.name}</div>
                  <div className="text-[9px] text-slate-500 truncate">{app.publisher || (isArabic ? 'ناشر غير متاح' : 'publisher unavailable')}</div>
                </div>
                <span className="font-mono text-[9px] text-slate-400 shrink-0">{app.version || '—'}</span>
              </div>
            ))}
            {!apps.length ? <p className="text-[10px] text-slate-500">{isArabic ? 'لم يُقرأ أي برنامج.' : 'No installed application was measured.'}</p> : null}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-violet-500/25 bg-violet-950/15 p-2.5 text-[10px] text-violet-200/90">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          {isArabic
            ? 'لا يحكم هذا الفحص على برنامج بأنه "غير مستخدم" ولا يقيس إلغاء التثبيت. هذا الجرد للقراءة فقط، وأي إجراء محجوز للمهمة 05 بموافقة صريحة.'
            : 'This check does not classify software as “unused” and does not measure uninstall. The inventory is read-only; any mutation is gated to Mission 05 with explicit approval.'}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <StageStrip service={service} isArabic={isArabic} />
        <span className="flex items-center gap-1 text-[9px] text-slate-500">
          <Lock className="w-3 h-3" />
          {isArabic ? 'لا توجد قناة إلغاء تثبيت.' : 'No uninstall channel is exposed.'}
        </span>
      </div>

      <GatedNote service={service} isArabic={isArabic} />
    </div>
  );
};
