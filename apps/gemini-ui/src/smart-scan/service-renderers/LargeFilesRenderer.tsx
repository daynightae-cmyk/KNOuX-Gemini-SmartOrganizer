/**
 * SCAN-04 — Large Files Review measured workspace.
 * Ranked strictly from measured file sizes inside the authorized folder.
 */
import React, {useState} from 'react';
import { FileWarning, HardDrive, ListOrdered } from 'lucide-react';
import { EmptyResult, Metric, WorkspaceLink, byteLabel, type ServiceRendererProps } from './shared';

export const LargeFilesRenderer: React.FC<ServiceRendererProps> = ({ service, session, isArabic, onNavigateToWorkspace, onReviewFiles, reviewUnavailableReason }) => {
  const [query,setQuery] = useState('');
  const [minimumMb,setMinimumMb] = useState(0);
  const [selected,setSelected] = useState<Set<string>>(() => new Set());
  if (!service) return <EmptyResult service={service} isArabic={isArabic} />;
  const data = service.data;
  const files = data.files || [];
  const threshold = data.thresholdBytes;
  const filtered = files.filter(file => `${file.name} ${file.relative}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()) && file.size >= minimumMb * 1024 * 1024);
  const selectionKey = (file: typeof files[number]) => `${session?.id || service.startedAt}:${file.id}:${file.relative}`;
  const selectedFiles = files.filter(file => selected.has(selectionKey(file)));

  return (
    <div className="space-y-3 text-slate-100 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-[#143058] pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-500 flex items-center justify-center text-white shadow-md">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">{isArabic ? 'مراجعة الملفات الكبيرة المقيسة' : 'Measured Large Files'}</h3>
            <p className="text-[10px] text-slate-400">{isArabic ? 'مرتبة من أحجام الملفات الفعلية داخل المجلد المصرح به' : 'Ranked from actual file sizes in the authorized folder'}</p>
          </div>
        </div>
        <WorkspaceLink workspace="storage" labelEn="Storage Atlas" labelAr="أطلس التخزين" isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />
      </div>

      <div className="scan-metric-trio gap-2">
        <Metric label={isArabic ? 'ملفات مرصودة' : 'Ranked files'} value={String(data.count ?? files.length)} sub={isArabic ? 'أكبر الملفات' : 'largest files'} />
        <Metric label={isArabic ? 'حجم مجمع' : 'Combined bytes'} value={byteLabel(data.totalBytes, isArabic)} sub={isArabic ? 'قياس فعلي' : 'measured'} tone="emerald" />
        <Metric label={isArabic ? 'عتبة التنبيه' : 'Finding threshold'} value={byteLabel(threshold, isArabic)} sub={isArabic ? 'ملفات أكبر تظهر كنتيجة' : 'larger files become findings'} tone="amber" />
      </div>

      <div className="knx-file-filters"><label>{isArabic ? 'الاسم أو المسار' : 'Name or path'}<input type="search" value={query} onChange={e => setQuery(e.target.value)}/></label><label>{isArabic ? 'أقل حجم بالميجابايت' : 'Minimum size (MB)'}<input type="number" min={0} step={1} value={minimumMb} onChange={e => setMinimumMb(Number.isFinite(e.target.valueAsNumber) ? Math.max(0,e.target.valueAsNumber) : 0)}/></label></div>
      <p role="status">{filtered.length} / {files.length} {isArabic ? 'ملفًا معادًا يطابق التصفية' : 'returned files match the filter'}</p>
      <div className="knx-tool-actions">
        <button type="button" disabled={!filtered.length} onClick={() => setSelected(new Set(filtered.map(selectionKey)))}>{isArabic ? 'اختيار المعروض' : 'Select shown'}</button>
        <button type="button" disabled={!selectedFiles.length} onClick={() => setSelected(new Set())}>{isArabic ? 'إلغاء الاختيار' : 'Clear selection'}</button>
        <button type="button" data-testid="scan-large-review-transfer" disabled={!onReviewFiles || !selectedFiles.length} title={!onReviewFiles ? reviewUnavailableReason : undefined} onClick={() => onReviewFiles?.(selectedFiles.map(file => file.id))}>{isArabic ? 'مراجعة نقل المختار في Studio' : 'Review selected transfer in Studio'} ({selectedFiles.length})</button>
      </div>
      <p>{isArabic ? 'سيفتح Studio لإعادة التصريح بالمصدر وفحص الاختيار ومراجعة خطة دقيقة. اختيار الملف لا ينفّذ نقلًا.' : 'Studio reauthorizes the source, re-indexes the selection and reviews an exact plan. Selecting a file performs no transfer.'}</p>
      {!onReviewFiles ? <p>{reviewUnavailableReason}</p> : null}
      <div className="rounded-xl border border-[#133059] bg-[#091a38] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#123055] text-[10px] font-bold text-cyan-300">
          <span className="flex items-center gap-1.5"><ListOrdered className="w-3.5 h-3.5" />{isArabic ? 'الترتيب حسب الحجم' : 'Size ranking'}</span>
          <span>{files.length}</span>
        </div>
        <div className="max-h-64 overflow-y-auto knx-custom-scrollbar">
          {filtered.map((file, index) => (
            <div key={`${file.id}:${index}`} className="flex items-center gap-2 px-3 py-1.5 border-b border-[#0d2442] last:border-0 text-[10px]">
              <input type="checkbox" aria-label={isArabic ? `اختيار ${file.relative}` : `Select ${file.relative}`} checked={selected.has(selectionKey(file))} onChange={e => {const checked = e.target.checked;setSelected(previous => {const next = new Set(previous);checked ? next.add(selectionKey(file)) : next.delete(selectionKey(file));return next;});}}/>
              <span className="w-5 text-slate-600 font-mono shrink-0">{index + 1}</span>
              <span className="flex-1 knx-tool-path text-slate-300">{file.relative}</span>
              <span className="font-mono font-bold text-sky-300 shrink-0">{byteLabel(file.size, isArabic)}</span>
            </div>
          ))}
          {!filtered.length ? (
            <div className="p-4 text-center text-[10px] text-slate-500">
              <FileWarning className="w-4 h-4 mx-auto mb-1 text-slate-600" />
              {isArabic ? 'لا توجد ملفات مقيسة بعد.' : 'No measured files yet.'}
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-[9px] text-slate-500 flex items-start gap-1">
        <FileWarning className="w-3 h-3 shrink-0 mt-0.5" />
        {isArabic
          ? 'الملف المرصود لا يعني أنه غير مهم. راجع مساره قبل أي إجراء؛ لا توجد عملية حذف في هذه المهمة.'
          : 'A ranked file is not inherently unimportant. Review its path before acting; this mission exposes no deletion.'}
      </p>
    </div>
  );
};
