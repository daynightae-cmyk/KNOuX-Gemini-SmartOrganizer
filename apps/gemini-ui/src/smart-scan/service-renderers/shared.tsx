/**
 * Shared measured-data primitives for the ten Smart Scan service workspaces.
 * Each renderer keeps its own layout; these helpers only remove duplication
 * around evidence state, values and the read-only contract.
 */
import React from 'react';
import { AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
import type { ScanServiceResult, ScanSession } from '../../../shared/native-contracts';
import { formatBytes, stageStatusLabel } from '../model';

export interface ServiceRendererProps {
  service?: ScanServiceResult;
  session?: ScanSession | null;
  isArabic: boolean;
  onNavigateToWorkspace?: (workspace: string) => void;
}

export function EmptyResult({ service, isArabic }: { service?: ScanServiceResult; isArabic: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-[#1b3a63] bg-[#071731] p-4 text-center">
      <ShieldCheck className="w-5 h-5 text-slate-500 mx-auto mb-1.5" />
      <p className="text-xs font-bold text-slate-300">
        {isArabic ? 'لا توجد نتيجة مقيسة لهذه الخدمة في الجلسة المحددة.' : 'No measured result for this service in the selected session.'}
      </p>
      <p className="text-[10px] text-slate-500 mt-1">
        {isArabic ? 'شغّل الخدمة من الأعلى؛ لن تُعرض أي أرقام تجريبية.' : 'Run the service above; no design numbers will be shown.'}
      </p>
      {service?.limitations?.length ? (
        <p className="text-[10px] text-slate-500 mt-2">{service.limitations[0]}</p>
      ) : null}
    </div>
  );
}

export function Metric({ label, value, tone = 'cyan', sub }: { label: string; value: string; tone?: 'cyan' | 'rose' | 'amber' | 'emerald'; sub?: string }) {
  const tones = {
    cyan: 'text-cyan-300 border-cyan-500/30',
    rose: 'text-rose-300 border-rose-500/30',
    amber: 'text-amber-300 border-amber-500/30',
    emerald: 'text-emerald-300 border-emerald-500/30',
  };
  return (
    <div className={`rounded-xl border bg-[#071731] px-3 py-2 ${tones[tone]}`}>
      <div className="text-[9px] uppercase tracking-wide text-slate-500 font-bold">{label}</div>
      <div className="text-sm font-black font-mono mt-0.5">{value}</div>
      {sub ? <div className="text-[9px] text-slate-500 mt-0.5">{sub}</div> : null}
    </div>
  );
}

export function StageStrip({ service, isArabic }: { service?: ScanServiceResult; isArabic: boolean }) {
  if (!service?.stages?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {service.stages.map((stage) => (
        <span
          key={stage.id}
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
            stage.status === 'complete'
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
              : stage.status === 'failed'
                ? 'bg-rose-950/50 text-rose-300 border-rose-500/30'
                : stage.status === 'partial' || stage.status === 'skipped' || stage.status === 'unsupported'
                  ? 'bg-amber-950/50 text-amber-300 border-amber-500/30'
                  : stage.status === 'running'
                    ? 'bg-cyan-950/50 text-cyan-200 border-cyan-500/30'
                    : 'bg-slate-900 text-slate-500 border-slate-700'
          }`}
        >
          {isArabic ? stage.labelAr : stage.labelEn}: {stageStatusLabel(stage.status, isArabic)}
        </span>
      ))}
    </div>
  );
}

export function GatedNote({ service, isArabic }: { service?: ScanServiceResult; isArabic: boolean }) {
  const mission = service?.data?.gatedMission;
  if (!mission) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5 text-[10px] text-amber-200">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>
        {isArabic
          ? `أي إجراء تغييري (تنظيف/تعطيل/إلغاء تثبيت) محجوز للمهمة ${mission} ويتطلب موافقة صريحة. هذه الشاشة للقياس فقط.`
          : `Any mutating action (cleanup, disable, uninstall) is reserved for Mission ${mission} and explicit approval. This surface is measurement-only.`}
      </span>
    </div>
  );
}

export function WorkspaceLink({
  workspace,
  labelEn,
  labelAr,
  isArabic,
  onNavigateToWorkspace,
}: {
  workspace: string;
  labelEn: string;
  labelAr: string;
  isArabic: boolean;
  onNavigateToWorkspace?: (workspace: string) => void;
}) {
  if (!onNavigateToWorkspace) return null;
  return (
    <button
      type="button"
      onClick={() => onNavigateToWorkspace(workspace)}
      className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-400/40 text-[11px] font-bold text-cyan-200 transition cursor-pointer flex items-center gap-1.5"
    >
      <span>{isArabic ? labelAr : labelEn}</span>
      <ExternalLink className="w-3.5 h-3.5" />
    </button>
  );
}

export function byteLabel(bytes: number | null | undefined, isArabic: boolean): string {
  return formatBytes(bytes, isArabic);
}

export function countLabel(value: number | null | undefined, isArabic: boolean): string {
  if (value == null || !Number.isFinite(Number(value))) return isArabic ? 'غير متاح' : 'Unavailable';
  return Number(value).toLocaleString(isArabic ? 'ar' : 'en');
}
