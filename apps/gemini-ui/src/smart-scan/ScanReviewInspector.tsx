/**
 * KNOuX SmartOrganizer — measured finding review inspector.
 *
 * Shows the evidence and path preview of one measured finding. There is no
 * checkbox and no action button because this surface cannot mutate files.
 */
import React from 'react';
import { FileSearch, Info, Lock, ShieldCheck } from 'lucide-react';
import type { ScanResultItem } from './smartScan.types';
import { formatBytes } from './model';

export interface ScanReviewInspectorProps {
  selectedItem: ScanResultItem | null;
  isArabic?: boolean;
  hasSession?: boolean;
}

export const ScanReviewInspector: React.FC<ScanReviewInspectorProps> = ({ selectedItem, isArabic = false, hasSession = false }) => {
  if (!selectedItem) {
    return (
      <div data-testid="scan-review-inspector" className="bg-[#071329]/90 border border-[#11294a] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg h-full text-center">
        <FileSearch className="w-8 h-8 text-slate-600" />
        <p className="text-xs font-bold text-slate-300">
          {hasSession
            ? (isArabic ? 'لا توجد نتيجة محددة للمراجعة.' : 'No finding selected for review.')
            : (isArabic ? 'لا توجد جلسة مقيسة بعد.' : 'No measured session yet.')}
        </p>
        <p className="text-[10px] text-slate-500 max-w-[220px]">
          {hasSession
            ? (isArabic ? 'اختر صفًا من جدول النتائج لعرض دليله المقيس.' : 'Select a row in the findings table to inspect its measured evidence.')
            : (isArabic ? 'شغّل فحصًا سريعًا أو عميقًا؛ لن تُعرض بيانات تجريبية.' : 'Run a quick or deep scan; no fixture evidence is shown.')}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="scan-review-inspector" className="bg-[#071329]/90 border border-[#11294a] rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-lg h-full overflow-y-auto knx-custom-scrollbar">
      <div className="flex items-center justify-between border-b border-[#0f2545] pb-2">
        <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          {isArabic ? 'مراجعة الدليل' : 'Evidence Review'}
        </h3>
        <span className="text-[9px] font-mono text-slate-500">READ-ONLY</span>
      </div>

      <div className="bg-[#0c203f] p-3 rounded-xl border border-cyan-500/30">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-extrabold text-white text-xs sm:text-sm leading-snug">{isArabic ? selectedItem.nameAr : selectedItem.nameEn}</h4>
          <span className="px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 text-[9px] font-bold border border-cyan-500/40 shrink-0">
            {isArabic ? selectedItem.categoryLabelAr : selectedItem.categoryLabelEn}
          </span>
        </div>
        <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">{isArabic ? selectedItem.descriptionAr : selectedItem.descriptionEn}</p>
        <div className="flex items-center justify-between gap-2 mt-2 text-[10px] font-mono">
          <span className="text-cyan-300 font-bold">
            {selectedItem.itemCount.toLocaleString()} {isArabic ? 'عنصر' : 'items'}
          </span>
          <span className="text-white font-bold">{selectedItem.bytes > 0 ? formatBytes(selectedItem.bytes, isArabic) : (isArabic ? 'حجم غير مقيس' : 'size not measured')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0b1b36] p-2.5 rounded-xl border border-[#142e54]">
          <span className="text-[9px] text-slate-500 block mb-0.5 font-medium">{isArabic ? 'حالة المراجعة' : 'Review state'}</span>
          <div className={`font-extrabold text-xs ${selectedItem.status === 'attention' ? 'text-rose-300' : selectedItem.status === 'review' ? 'text-amber-300' : 'text-emerald-300'}`}>
            {isArabic ? selectedItem.statusLabelAr : selectedItem.statusLabelEn}
          </div>
          <span className="text-[9px] text-slate-500">{isArabic ? 'مشتقة من الخطورة المقيسة' : 'derived from measured severity'}</span>
        </div>
        <div className="bg-[#0b1b36] p-2.5 rounded-xl border border-[#142e54]">
          <span className="text-[9px] text-slate-500 block mb-0.5 font-medium">{isArabic ? 'المزود' : 'Provider'}</span>
          <div className="font-bold text-cyan-300 text-[10px] truncate" title={selectedItem.provenanceLabelEn}>{selectedItem.provenanceLabelEn}</div>
          <span className="text-[9px] text-slate-500">{isArabic ? 'قياس محلي' : 'local measurement'}</span>
        </div>
      </div>

      <p className="text-[10px] text-slate-300 bg-[#091830] p-2.5 rounded-xl border border-[#112747] leading-relaxed">
        {isArabic ? selectedItem.detailedDescriptionAr : selectedItem.detailedDescriptionEn}
      </p>

      <div>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-200 mb-1.5">
          <span>{isArabic ? 'معاينة المسارات المقيسة' : 'Measured path preview'}</span>
          <span className="text-[9px] text-slate-500 font-mono">{selectedItem.pathsPreview.length}</span>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto knx-custom-scrollbar">
          {selectedItem.pathsPreview.map((path) => (
            <div key={path.id} className="flex items-center justify-between gap-2 text-[9px] bg-[#08152b] p-1.5 rounded-lg border border-[#0f2442]">
              <span className="font-mono text-slate-300 truncate" title={path.path}>{path.path}</span>
              <span className="font-mono text-cyan-300 font-bold ml-1 shrink-0">{path.sizeDisplay}</span>
            </div>
          ))}
          {!selectedItem.pathsPreview.length ? (
            <p className="text-[9px] text-slate-500">{isArabic ? 'لم يُرجع المزود معاينة مسارات لهذه النتيجة.' : 'The provider returned no path preview for this finding.'}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-start gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-2 text-[9px] text-emerald-200/80 mt-auto">
        <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5" />
        <span>
          {isArabic
            ? 'دليل للقراءة فقط. لا يمنح تحديد نتيجة أي صلاحية حذف أو نقل.'
            : 'Read-only evidence. Selecting a finding grants no delete or move authority.'}
          <Lock className="w-2.5 h-2.5 inline ml-1" />
        </span>
      </div>
    </div>
  );
};
