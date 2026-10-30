/**
 * SCAN-05 — Junk Cleaner measured workspace.
 * Measures empty folders only. Temp/browser cache discovery and all deletion
 * remain gated to Mission 08; no cleanup is simulated here.
 */
import React from 'react';
import { FolderX, Trash2, Lock } from 'lucide-react';
import { EmptyResult, GatedNote, Metric, WorkspaceLink, type ServiceRendererProps } from './shared';

export const JunkCleanerRenderer: React.FC<ServiceRendererProps> = ({ service, isArabic, onNavigateToWorkspace }) => {
  if (!service) return <EmptyResult service={service} isArabic={isArabic} />;
  const data = service.data;
  const empty = data.emptyFolders;
  const items = empty?.items || [];

  return (
    <div className="space-y-3 text-slate-100 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-[#143058] pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-fuchsia-400 flex items-center justify-center text-white shadow-md">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">{isArabic ? 'منظف المخلفات — قياس فقط' : 'Junk Cleaner — Measurement Only'}</h3>
            <p className="text-[10px] text-slate-400">{isArabic ? 'اكتشاف المجلدات الفارغة داخل المجلد المصرح به' : 'Empty-folder discovery inside the authorized folder'}</p>
          </div>
        </div>
        <WorkspaceLink workspace="cleanup" labelEn="Cleanup Workspace" labelAr="مساحة التنظيف" isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />
      </div>

      <div className="scan-metric-trio gap-2">
        <Metric label={isArabic ? 'مجلدات فارغة' : 'Empty folders'} value={String(empty?.summary?.emptyFolders ?? 0)} sub={isArabic ? 'مقيسة' : 'measured'} tone="amber" />
        <Metric label={isArabic ? 'مجلدات مفحوصة' : 'Folders walked'} value={String(empty?.summary?.foldersScanned ?? 0)} sub={isArabic ? 'ضمن الحد' : 'bounded walk'} />
        <Metric label={isArabic ? 'التنظيف' : 'Cleanup'} value={isArabic ? 'محجوز' : 'Gated'} sub={isArabic ? 'المهمة 08' : 'Mission 08'} tone="rose" />
      </div>

      <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-300 mb-2">
          <FolderX className="w-3.5 h-3.5" />
          {isArabic ? 'مجلدات فارغة مقيسة' : 'Measured empty folders'}
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto knx-custom-scrollbar">
          {items.map((item) => (
            <div key={item.relative} className="flex items-center gap-2 rounded-lg border border-[#11284a] bg-[#071731] px-2 py-1 text-[10px]">
              <FolderX className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="font-mono text-slate-300 truncate">{item.relative}</span>
            </div>
          ))}
          {!items.length ? <p className="text-[10px] text-slate-500">{isArabic ? 'لا توجد مجلدات فارغة مقيسة.' : 'No empty folder was measured.'}</p> : null}
        </div>
        {empty?.partial ? (
          <p className="text-[9px] text-amber-300 mt-2">{isArabic ? 'اكتمل الاكتشاف ضمن حد أقصى؛ النتيجة جزئية.' : 'Discovery reached a bounded limit; the result is partial.'}</p>
        ) : null}
      </div>

      <div className="rounded-xl border border-rose-500/25 bg-rose-950/15 p-2.5 text-[9px] text-rose-200/90 flex items-start gap-2">
        <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          {isArabic
            ? 'لم يتم حذف أو نقل أي مجلد. اكتشاف ملفات النظام المؤقتة وكاش المتصفح وسلة المحذوفات محجوز للمهمة 08.'
            : 'No folder was deleted or moved. System temp, browser cache and Recycle Bin discovery are gated to Mission 08.'}
        </span>
      </div>

      {Array.isArray(data.unsupported) && data.unsupported.length ? (
        <div className="flex flex-wrap gap-1">
          {data.unsupported.map((entry) => (
            <span key={entry} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] text-slate-500">{entry}</span>
          ))}
        </div>
      ) : null}

      <GatedNote service={service} isArabic={isArabic} />
    </div>
  );
};
