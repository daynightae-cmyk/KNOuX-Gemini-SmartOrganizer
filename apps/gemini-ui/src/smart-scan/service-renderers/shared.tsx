/**
 * Shared measured-data primitives for the ten Smart Scan service workspaces.
 * Each renderer keeps its own layout; these helpers only remove duplication
 * around evidence state, values and the read-only contract.
 */
import React from 'react';
import { AlertTriangle, Check, ClipboardCopy, ExternalLink, Play, ShieldCheck } from 'lucide-react';
import type { ScanServiceResult, ScanSession } from '../../../shared/native-contracts';
import { formatBytes, stageStatusLabel } from '../model';

export interface ServiceRendererProps {
  service?: ScanServiceResult;
  session?: ScanSession | null;
  isArabic: boolean;
  onNavigateToWorkspace?: (workspace: string) => void;
  /** Opens another Smart Scan service in the same workbench shell. */
  onOpenService?: (serviceId: string) => void;
}

export function EmptyResult({
  service,
  isArabic,
  onMeasure,
  measureDisabled = false,
  measureReason,
}: {
  service?: ScanServiceResult;
  isArabic: boolean;
  /** Measures this service in the current session instead of showing a dead end. */
  onMeasure?: () => void;
  measureDisabled?: boolean;
  measureReason?: string | null;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#1b3a63] bg-[#071731] p-4 text-center" data-testid="scan-empty-result">
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
      {onMeasure ? (
        <button
          type="button"
          onClick={onMeasure}
          disabled={measureDisabled}
          title={measureReason || undefined}
          data-testid="scan-empty-measure"
          className="mt-2.5 px-3 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-400/40 text-[10px] font-bold text-cyan-200 transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-3 h-3" />
          {isArabic ? 'قِس هذه الخدمة الآن' : 'Measure this service now'}
        </button>
      ) : null}
      {measureReason ? <p className="text-[9px] text-amber-300 mt-1.5 font-mono">{measureReason}</p> : null}
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
    <div className={`rounded-xl border bg-[#071731] px-3 py-2 min-w-0 overflow-hidden ${tones[tone]}`}>
      <div className="text-[9px] uppercase tracking-wide text-slate-500 font-bold truncate" title={label}>{label}</div>
      <div className="text-sm font-black font-mono mt-0.5 truncate" title={value}>{value}</div>
      {sub ? <div className="text-[9px] text-slate-500 mt-0.5 truncate" title={sub}>{sub}</div> : null}
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

/**
 * Copies the measured payload of the current service to the clipboard so the
 * owner can paste real evidence elsewhere. Nothing leaves the machine and no
 * file is written; when the clipboard is unavailable the control says so
 * instead of pretending to have copied.
 */
export function CopyEvidence({
  testId,
  payload,
  isArabic,
}: {
  testId: string;
  payload: unknown;
  isArabic: boolean;
}) {
  const [state, setState] = React.useState<'idle' | 'copied' | 'unavailable'>('idle');
  const timer = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const resetLater = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 2400);
  };

  const handleCopy = async () => {
    try {
      const text = JSON.stringify(payload ?? null, null, 2);
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('unavailable');
    }
    resetLater();
  };

  const label =
    state === 'copied'
      ? isArabic
        ? 'نُسخت الأدلة'
        : 'Evidence copied'
      : state === 'unavailable'
        ? isArabic
          ? 'الحافظة غير متاحة'
          : 'Clipboard unavailable'
        : isArabic
          ? 'نسخ الأدلة المقيسة'
          : 'Copy measured evidence';

  return (
    <button
      type="button"
      data-testid={testId}
      data-copy-state={state}
      onClick={handleCopy}
      aria-live="polite"
      className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
        state === 'copied'
          ? 'bg-emerald-600/20 border-emerald-400/40 text-emerald-200'
          : state === 'unavailable'
            ? 'bg-amber-600/20 border-amber-400/40 text-amber-200'
            : 'bg-[#0e213d] hover:bg-[#14305a] border-[#1b3a63] text-slate-300'
      }`}
    >
      {state === 'copied' ? <Check className="w-3 h-3" /> : <ClipboardCopy className="w-3 h-3" />}
      <span>{label}</span>
    </button>
  );
}

/** A small segmented filter over already-measured rows; it never re-queries. */
export function FilterChips<T extends string>({
  testId,
  labelEn,
  labelAr,
  options,
  value,
  onChange,
  isArabic,
}: {
  testId: string;
  labelEn: string;
  labelAr: string;
  options: Array<{ id: T; labelEn: string; labelAr: string; count?: number }>;
  value: T;
  onChange: (next: T) => void;
  isArabic: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1" data-testid={testId} role="group" aria-label={isArabic ? labelAr : labelEn}>
      <span className="text-[9px] uppercase tracking-wide font-bold text-slate-500 me-1">{isArabic ? labelAr : labelEn}</span>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          data-filter-option={option.id}
          onClick={() => onChange(option.id)}
          className={`px-1.5 py-0.5 rounded border text-[9px] font-bold transition cursor-pointer ${
            value === option.id
              ? 'bg-cyan-600/25 border-cyan-400/50 text-cyan-100'
              : 'bg-[#0b1c35] border-[#1b3a63] text-slate-400 hover:text-slate-200'
          }`}
        >
          {isArabic ? option.labelAr : option.labelEn}
          {option.count == null ? null : <span className="ms-1 font-mono opacity-70">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function byteLabel(bytes: number | null | undefined, isArabic: boolean): string {
  return formatBytes(bytes, isArabic);
}

export function countLabel(value: number | null | undefined, isArabic: boolean): string {
  if (value == null || !Number.isFinite(Number(value))) return isArabic ? 'غير متاح' : 'Unavailable';
  return Number(value).toLocaleString(isArabic ? 'ar' : 'en');
}
