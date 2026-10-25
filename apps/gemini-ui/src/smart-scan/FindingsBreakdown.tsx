/**
 * KNOuX SmartOrganizer — measured findings breakdown.
 *
 * The donut is computed from the measured finding counts in ScanSession.breakdown.
 * Byte totals are shown as supporting measured evidence, never as ring share.
 * No design percentages are drawn when the session has no breakdown.
 */
import React from 'react';
import { PieChart } from 'lucide-react';
import type { BreakdownCategory } from './smartScan.types';
import { formatBytes } from './model';

export interface FindingsBreakdownProps {
  categories: BreakdownCategory[];
  isArabic?: boolean;
  hasSession?: boolean;
}

export const FindingsBreakdown: React.FC<FindingsBreakdownProps> = ({ categories, isArabic = false, hasSession = false }) => {
  const totalBytes = categories.reduce((sum, entry) => sum + (Number(entry.bytes) || 0), 0);
  const totalCount = categories.reduce((sum, entry) => sum + (Number(entry.count) || 0), 0);
  let offset = 0;

  return (
    <div className="bg-[#071329]/80 border border-[#11294a] rounded-2xl p-3.5 flex flex-col justify-between gap-3 shadow-lg">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" />
            {isArabic ? 'تفصيل النتائج' : 'Findings Breakdown'}
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">{isArabic ? 'حصة النتائج' : 'share of findings'}</span>
        </div>

        {categories.length ? (
          <>
            <div className="relative flex flex-col items-center justify-center my-2.5">
              <svg className="w-32 h-32 sm:w-36 sm:h-36" viewBox="0 0 36 36" role="img" aria-label={isArabic ? 'توزيع عدد النتائج المقيسة' : 'Measured finding count distribution'}>
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#0f2647" strokeWidth="3.8" />
                <g transform="rotate(-90 18 18)">
                  {categories.map((entry) => {
                    const percent = Math.max(0, Math.min(100, Number(entry.percentage) || 0));
                    const circle = (
                      <circle
                        key={entry.id}
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke={entry.colorHex}
                        strokeWidth="3.8"
                        pathLength={100}
                        strokeDasharray={`${percent} ${100 - percent}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="butt"
                      />
                    );
                    offset += percent;
                    return circle;
                  })}
                </g>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-sm sm:text-base font-black text-white">{totalCount}</span>
                <span className="text-[10px] text-cyan-300 font-semibold">{isArabic ? 'نتيجة مقيسة' : totalCount === 1 ? 'measured finding' : 'measured findings'}</span>
                <span className="text-[9px] text-slate-400 font-mono">{formatBytes(totalBytes, isArabic)}</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] border-t border-[#0e223d] pt-2.5">
              {categories.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-slate-300 gap-1">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.colorHex }} />
                    <span className="truncate">{isArabic ? entry.labelAr : entry.labelEn}</span>
                  </span>
                  <span className="font-mono text-slate-300 font-medium shrink-0">
                    {entry.count} × · {formatBytes(entry.bytes, isArabic)} · {entry.percentage}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-slate-500 mt-1.5 leading-snug">
              {isArabic
                ? 'النسبة هي حصة النتيجة من العدد المقيس؛ البايتات دليل مقيس لكل مجموعة.'
                : 'Percentage is the finding share of the measured count; bytes are per-group measured evidence.'}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <PieChart className="w-7 h-7 text-slate-600 mb-2" />
            <p className="text-[11px] font-bold text-slate-300">
              {hasSession
                ? (isArabic ? 'لا توجد مجموعات بايتات مقيسة.' : 'No measured byte groups.')
                : (isArabic ? 'بانتظار فحص مقيس.' : 'Awaiting a measured scan.')}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              {isArabic ? 'لا تُرسم نسب تجريبية.' : 'No design percentages are drawn.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
