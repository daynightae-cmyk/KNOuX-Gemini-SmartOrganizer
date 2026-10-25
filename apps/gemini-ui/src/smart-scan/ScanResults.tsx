/**
 * KNOuX SmartOrganizer — measured findings table.
 *
 * Rows are real ScanFinding records adapted by model.toResultItems. There are
 * no selection checkboxes because selecting a file never authorizes a mutation.
 */
import React from 'react';
import { Filter, SearchX } from 'lucide-react';
import type { ScanResultItem } from './smartScan.types';
import { findingsFilterCounts, formatBytes } from './model';

export interface ScanResultsProps {
  results: ScanResultItem[];
  selectedId: string | null;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onSelectRow: (id: string) => void;
  isArabic?: boolean;
  hasSession?: boolean;
}

const CATEGORY_STYLE: Record<ScanResultItem['category'], string> = {
  junk: 'bg-purple-950/60 text-purple-300 border-purple-500/40',
  duplicates: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40',
  large: 'bg-blue-950/60 text-blue-300 border-blue-500/40',
  privacy: 'bg-teal-950/60 text-teal-300 border-teal-500/40',
  system: 'bg-rose-950/60 text-rose-300 border-rose-500/40',
  other: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40',
};

const STATUS_STYLE: Record<ScanResultItem['status'], string> = {
  info: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
  review: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
  attention: 'bg-rose-950/60 text-rose-300 border-rose-500/40',
};

export const ScanResults: React.FC<ScanResultsProps> = ({
  results,
  selectedId,
  activeFilter,
  onFilterChange,
  onSelectRow,
  isArabic = false,
  hasSession = false,
}) => {
  const filters = findingsFilterCounts(results);
  const totalBytes = results.reduce((sum, row) => sum + (Number(row.bytes) || 0), 0);

  return (
    <div data-testid="scan-results" className="scan-results-panel bg-[#071329]/80 border border-[#11294a] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-lg h-full overflow-hidden">
      <div className="flex flex-col h-full overflow-hidden min-h-0">
        <div className="scan-results-head flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#0f2545] shrink-0">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              {isArabic ? 'النتائج المقيسة' : 'Measured Findings'}
            </h3>
            <p className="text-[11px] text-slate-300 font-medium">
              {hasSession
                ? `${results.length.toLocaleString()} ${isArabic ? 'نتيجة' : 'findings'} · ${formatBytes(totalBytes, isArabic)}`
                : (isArabic ? 'لا توجد جلسة فحص محددة' : 'No measured scan session selected')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {filters.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)] border border-cyan-400/40'
                    : 'bg-[#0b1b36] hover:bg-[#12284c] text-slate-300 border border-[#142e54]'
                }`}
              >
                {isArabic ? tab.ar : tab.en}
              </button>
            ))}
          </div>
        </div>

        <div className="scan-results-table flex-1 overflow-x-auto overflow-y-auto knx-custom-scrollbar min-h-0">
          <table className="w-full text-left rtl:text-right text-xs border-collapse">
            <thead className="sticky top-0 bg-[#071329] z-10 border-b border-[#0f2545] text-[10px] text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-2">{isArabic ? 'النتيجة' : 'Finding'}</th>
                <th className="p-2">{isArabic ? 'الفئة' : 'Category'}</th>
                <th className="p-2 text-right">{isArabic ? 'العناصر' : 'Items'}</th>
                <th className="p-2 text-right">{isArabic ? 'الحجم المقيس' : 'Measured'}</th>
                <th className="p-2 text-center">{isArabic ? 'الخطورة' : 'Risk'}</th>
                <th className="p-2 hidden 2xl:table-cell">{isArabic ? 'المزود' : 'Provider'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0c1d38]">
              {results.map((row) => {
                const isSelected = selectedId === row.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectRow(row.id)}
                    className={`group hover:bg-[#0c203f] transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#0d254b] border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <td className="p-2 max-w-[260px]">
                      <div className="font-bold text-white group-hover:text-cyan-200 truncate">
                        {isArabic ? row.nameAr : row.nameEn}
                      </div>
                      <div className="scan-row-desc text-[10px] text-slate-400 truncate" title={row.evidence}>
                        {row.evidence}
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${CATEGORY_STYLE[row.category]}`}>
                        {isArabic ? row.categoryLabelAr : row.categoryLabelEn}
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono text-slate-300">{row.itemCount.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono font-bold text-white">
                      {row.bytes > 0 ? formatBytes(row.bytes, isArabic) : '—'}
                    </td>
                    <td className="p-2 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${STATUS_STYLE[row.status]}`}>
                        {isArabic ? row.statusLabelAr : row.statusLabelEn}
                      </span>
                    </td>
                    <td className="p-2 text-[9px] text-slate-500 font-mono max-w-[150px] truncate hidden 2xl:table-cell" title={row.provenanceLabelEn}>
                      {isArabic ? row.provenanceLabelAr : row.provenanceLabelEn}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!results.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <SearchX className="w-7 h-7 text-slate-600 mb-2" />
              <p className="text-xs font-bold text-slate-300">
                {hasSession
                  ? (isArabic ? 'لا توجد نتائج مقيسة في هذه الفئة.' : 'No measured findings in this category.')
                  : (isArabic ? 'شغّل فحصًا مقيسًا لعرض النتائج الحقيقية.' : 'Run a measured scan to see real findings.')}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-xs">
                {hasSession
                  ? (isArabic ? 'الفلاتر تعرض فقط ما قاسته الجلسة المحددة.' : 'Filters only show what the selected session measured.')
                  : (isArabic ? 'لا تُستخدم بيانات تجريبية عند غياب الجلسة.' : 'No fixture data is substituted when a session is absent.')}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
