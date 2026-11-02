/**
 * SCAN-03 — Duplicate Finder measured workspace.
 * Size candidates are metadata only; content groups are SHA-256 verified.
 */
import React, {useState} from 'react';
import {FileIcon} from '../../components/files/FileIcon';
import { Copy, Fingerprint, Info, Layers } from 'lucide-react';
import { EmptyResult, Metric, WorkspaceLink, byteLabel, type ServiceRendererProps } from './shared';

export const DuplicateFinderRenderer: React.FC<ServiceRendererProps> = ({ service, isArabic, onNavigateToWorkspace }) => {
  const [query,setQuery] = useState('');
  if (!service) return <EmptyResult service={service} isArabic={isArabic} />;
  const data = service.data;
  const candidates = data.candidates || [];
  const verified = data.verified;
  const groups = (verified?.groups || []).filter(group => `${group.digest} ${group.files.map(file => file.relative).join(' ')}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  return (
    <div className="space-y-3 text-slate-100 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-[#143058] pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-md">
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">{isArabic ? 'مكتشف المكررات المقيس' : 'Measured Duplicate Finder'}</h3>
            <p className="text-[10px] text-slate-400">{isArabic ? 'بايتات متطابقة عبر SHA-256 داخل المجلد المصرح به' : 'Byte-identical files via SHA-256 inside the authorized folder'}</p>
          </div>
        </div>
        <WorkspaceLink workspace="storage" labelEn="Storage Atlas" labelAr="أطلس التخزين" isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />
      </div>

      <details className="scan-result-summary"><summary>{isArabic?'ملخص القياسات':'Measurement summary'}</summary>
      <div className="scan-metric-grid gap-2">
        <Metric label={isArabic ? 'مجموعات مؤكدة' : 'Verified groups'} value={verified ? String(verified.summary.verifiedGroups) : '—'} sub={byteLabel(verified?.summary?.reclaimableVerifiedBytes, isArabic)} tone="emerald" />
        <Metric label={isArabic ? 'ملفات مجزأة' : 'Files hashed'} value={verified ? String(verified.summary.filesHashed) : '—'} sub={byteLabel(verified?.summary?.bytesHashed, isArabic)} />
        <Metric label={isArabic ? 'مرشحات بالحجم' : 'Size candidates'} value={String(candidates.length)} sub={isArabic ? 'بيانات وصفية فقط' : 'metadata only'} tone="amber" />
        <Metric label={isArabic ? 'حد التجزئة' : 'Hash budget'} value={!verified ? (isArabic ? 'لم يُقس' : 'Not measured') : verified.summary.budgetReached ? (isArabic ? 'جزئي' : 'Partial') : (isArabic ? 'مكتمل' : 'Complete')} sub={`${verified?.summary?.maxFiles ?? '—'} ${isArabic ? 'ملف كحد أقصى' : 'max files'}`} tone={verified?.summary?.budgetReached ? 'amber' : 'cyan'} />
      </div>

      </details>
      <label className="knx-file-filter-label">{isArabic ? 'تصفية البصمات والمسارات المتحققة' : 'Filter verified digests and paths'}<input type="search" value={query} onChange={e => setQuery(e.target.value)}/></label>
      <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 mb-2">
          <Fingerprint className="w-3.5 h-3.5" />
          {isArabic ? 'مجموعات متطابقة بايتياً — متحقق منها' : 'Byte-identical groups — verified'}
        </div>
        <div className="space-y-2 max-h-52 overflow-y-auto knx-custom-scrollbar pr-1">
          {groups.map((group) => (
            <div key={`${group.digest}:${group.size}`} className="scan-duplicate-group rounded-lg border border-[#16355c] bg-[#071731] p-2">
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="font-mono text-cyan-300 knx-tool-path">SHA-256 {group.digest}</span>
                <span className="font-bold text-emerald-300 shrink-0">{byteLabel(group.wastedBytes, isArabic)} {isArabic ? 'مكرر' : 'wasted'}</span>
              </div>
              {group.files.map((file) => (
                <div key={file.id} className="scan-duplicate-member mt-1 flex justify-between gap-2 text-[9px] text-slate-400">
                  <FileIcon name={file.relative} type="file" className="scan-file-type-icon"/><span className="knx-tool-path">{file.relative}</span>
                  <span className="shrink-0">{byteLabel(file.size, isArabic)}</span>
                </div>
              ))}
            </div>
          ))}
          {!groups.length ? (
            <p className="text-[10px] text-slate-500">{!verified ? (isArabic ? 'لم يُجر تحقق المحتوى في هذه النتيجة.' : 'Content verification was not measured in this result.') : (isArabic ? 'لا توجد مجموعات متحققة مطابقة للتصفية في النتائج المعادة.' : 'No returned verified groups match this filter.')}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 mb-1">
          <Layers className="w-3.5 h-3.5" />
          {isArabic ? `${candidates.length} مجموعة بنفس الحجم (غير مؤكدة)` : `${candidates.length} same-size candidate group(s) (unverified)`}
        </div>
        <p className="text-[9px] text-amber-200/80">
          {isArabic
            ? 'تشابه الحجم ليس دليلاً على التطابق. المجموعات أعلاه فقط هي التي تحمل بصمة محتوى مؤكدة. الحذف غير متاح في هذه المهمة.'
            : 'Same size is not proof of duplication. Only the groups above carry a verified content digest. Deletion is not available in this mission.'}
        </p>
      </div>

      {verified?.errors?.length ? <details className="knx-tool-evidence"><summary>{isArabic ? 'تفاصيل أخطاء التجزئة' : 'Hashing error details'} ({verified.errors.length})</summary>{verified.errors.map((error,index) => <p key={index}>{error.name} · <code>{error.code}</code> · {error.message}</p>)}</details> : null}
      {verified?.errors?.length ? (
        <p className="text-[9px] text-rose-300 flex items-start gap-1">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          {verified.errors.length} {isArabic ? 'ملفاً تعذرت قراءته أثناء التجزئة.' : 'file(s) could not be read while hashing.'}
        </p>
      ) : null}
    </div>
  );
};
