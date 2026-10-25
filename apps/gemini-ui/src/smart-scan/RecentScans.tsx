/**
 * KNOuX SmartOrganizer — measured scan history.
 *
 * Selecting an entry loads that persisted session from the native coordinator.
 * No synthetic history is displayed when none exists.
 */
import React from 'react';
import { AlertTriangle, Ban, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import type { RecentScanRecord } from './smartScan.types';
import { modeLabel } from './model';

export interface RecentScansProps {
  records: RecentScanRecord[];
  isArabic?: boolean;
  selectedId?: string | null;
  onSelect?: (sessionId: string) => void;
  loading?: boolean;
}

function StatusIcon({ status }: { status: RecentScanRecord['status'] }) {
  if (status === 'complete') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  if (status === 'partial') return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  if (status === 'failed') return <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
  if (status === 'cancelled') return <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  return <Loader2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-spin" />;
}

export const RecentScans: React.FC<RecentScansProps> = ({ records, isArabic = false, selectedId, onSelect, loading = false }) => {
  return (
    <div className="bg-[#071329]/80 border border-[#11294a] rounded-2xl p-3 flex flex-col gap-2 shadow-lg">
      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          {isArabic ? 'الفحوصات الأخيرة' : 'Recent Scans'}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">{records.length}</span>
      </div>

      <div className="space-y-1.5 max-h-52 overflow-y-auto knx-custom-scrollbar">
        {records.map((record) => {
          const selected = selectedId === record.id;
          return (
            <button
              type="button"
              key={record.id}
              onClick={() => onSelect?.(record.id)}
              disabled={!onSelect || loading}
              className={`w-full text-start flex items-center justify-between gap-2 text-[11px] p-2 rounded-xl border transition cursor-pointer disabled:cursor-not-allowed ${
                selected ? 'bg-[#0d254b] border-cyan-400/50' : 'bg-[#0b1a33] border-[#122c54] hover:bg-[#0e2242]'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <StatusIcon status={record.status} />
                <div className="truncate min-w-0">
                  <div className="font-bold text-white truncate">{modeLabel(record.mode, isArabic)}</div>
                  <div className="text-[9px] text-slate-400 font-mono truncate">
                    {record.sourceLabel || (isArabic ? 'مزودات النظام فقط' : 'system providers only')}
                    {record.filesIndexed != null ? ` · ${record.filesIndexed.toLocaleString()} ${isArabic ? 'ملف' : 'files'}` : ''}
                    {` · ${record.findingsCount} ${isArabic ? 'نتيجة' : 'findings'}`}
                  </div>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono shrink-0">{isArabic ? record.timeDisplayAr : record.timeDisplayEn}</span>
            </button>
          );
        })}
        {!records.length ? (
          <div className="rounded-xl border border-dashed border-[#1b3a63] bg-[#071731] p-3 text-center">
            <Clock className="w-5 h-5 text-slate-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-400">{isArabic ? 'لا توجد فحوصات محفوظة بعد.' : 'No persisted scan history yet.'}</p>
          </div>
        ) : null}
      </div>

      {records.length ? (
        <p className="text-[8px] text-slate-500 font-mono">
          {isArabic ? 'الجلسات المحفوظة محدودة ومقيسة.' : 'Persisted sessions are bounded and measured.'}
        </p>
      ) : null}
    </div>
  );
};
