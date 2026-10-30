/**
 * SCAN-09 — System Health Pulse measured workspace.
 *
 * CPU load, memory pressure and volume capacity are momentary measurements
 * from Windows providers. The health score is a deterministic derivation of
 * measured signals only, never a fabricated diagnostic.
 */
import React from 'react';
import { Activity, Cpu, HardDrive, Info, MemoryStick, Monitor, ShieldCheck } from 'lucide-react';
import { CopyEvidence, EmptyResult, Metric, StageStrip, WorkspaceLink, byteLabel, type ServiceRendererProps } from './shared';

type VolumeFilter = 'all' | 'low' | 'system';

export const SystemHealthPulseRenderer: React.FC<ServiceRendererProps> = ({ service, session, isArabic, onNavigateToWorkspace }) => {
  const [volumeFilter, setVolumeFilter] = React.useState<VolumeFilter>('all');

  if (!service) return <EmptyResult service={service} isArabic={isArabic} />;
  const data = service.data;
  const system = data.system;
  const volumes = data.volumes || [];
  const score = session?.summary.healthScore ?? data.healthScore ?? null;
  const basis = session?.summary.healthBasis?.length ? session.summary.healthBasis : data.basis || [];
  const systemDriveFreePercent =
    system?.systemDriveTotalBytes && system.systemDriveFreeBytes != null
      ? Math.round((system.systemDriveFreeBytes / system.systemDriveTotalBytes) * 100)
      : null;
  const systemLetter = system?.systemDrive?.replace(/:.*$/, '').toUpperCase() || null;
  const lowVolumeCount = volumes.filter((volume) => volume.freePercent < 10).length;
  const visibleVolumes = volumes.filter((volume) => {
    if (volumeFilter === 'low') return volume.freePercent < 10;
    if (volumeFilter === 'system') return systemLetter ? volumeLetter(volume) === systemLetter : false;
    return true;
  });
  const volumeFilters: Array<{ id: VolumeFilter; labelEn: string; labelAr: string; count: number }> = [
    { id: 'all', labelEn: 'All volumes', labelAr: 'كل الوحدات', count: volumes.length },
    { id: 'system', labelEn: 'System drive', labelAr: 'قرص النظام', count: volumes.filter((volume) => (systemLetter ? volumeLetter(volume) === systemLetter : false)).length },
    { id: 'low', labelEn: 'Low free', labelAr: 'مساحة منخفضة', count: lowVolumeCount },
  ];

  return (
    <div className="space-y-3 text-slate-100 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-[#143058] pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-lime-400 flex items-center justify-center text-white shadow-md">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">{isArabic ? 'نبض صحة النظام — قياس لحظي' : 'System Health Pulse — Momentary Measurement'}</h3>
            <p className="text-[10px] text-slate-400">
              {isArabic ? 'حمل المعالج والذاكرة وسعة الوحدات لحظة الفحص' : 'CPU load, memory pressure and volume capacity at scan time'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <CopyEvidence testId="scan-system_health_pulse-copy" payload={{ serviceId: service.serviceId, status: service.status, system, volumes, score, basis }} isArabic={isArabic} />
          <span className="px-1.5 py-0.5 rounded bg-emerald-400/15 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-400/40">
            SNAPSHOT
          </span>
        </div>
      </div>

      <div className="scan-metric-grid gap-2">
        <Metric label={isArabic ? 'حمل المعالج' : 'CPU load'} value={system?.cpuLoadPercent == null ? '—' : `${system.cpuLoadPercent}%`} sub={system?.cpuLoadSource || (isArabic ? 'لحظة الفحص' : 'scan moment')} />
        <Metric label={isArabic ? 'ضغط الذاكرة' : 'Memory pressure'} value={system?.memoryUsedPercent == null ? '—' : `${system.memoryUsedPercent}%`} sub={system?.memoryTotalBytes == null ? (isArabic ? 'غير متاح' : 'unavailable') : `${byteLabel(system.memoryFreeBytes, isArabic)} ${isArabic ? 'حرة' : 'free'}`} />
        <Metric label={isArabic ? 'مساحة قرص النظام' : 'System drive free'} value={systemDriveFreePercent == null ? '—' : `${systemDriveFreePercent}%`} sub={system?.systemDrive || (isArabic ? 'غير متاح' : 'unavailable')} tone={systemDriveFreePercent != null && systemDriveFreePercent < 10 ? 'rose' : 'emerald'} />
        <Metric label={isArabic ? 'درجة الصحة المقيسة' : 'Measured health score'} value={score == null ? '—' : `${score}/100`} sub={score == null ? (isArabic ? 'لا توجد إشارات رقمية كافية' : 'not enough numeric signals') : (isArabic ? 'مشتقة من إشارات مقيسة' : 'derived from measured signals')} tone={score == null ? 'amber' : 'emerald'} />
      </div>

      <div className="scan-split gap-2">
        <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300">
              <HardDrive className="w-3.5 h-3.5" />
              {isArabic ? 'سعة الوحدات المقيسة' : 'Measured volume capacity'}
            </div>
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label={isArabic ? 'مرشح الوحدات' : 'Volume filter'} data-testid="scan-system_health_pulse-volume-filter">
              {volumeFilters.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={volumeFilter === option.id}
                  data-filter-option={option.id}
                  onClick={() => setVolumeFilter(option.id)}
                  className={`px-1.5 py-0.5 rounded border text-[9px] font-bold transition cursor-pointer ${
                    volumeFilter === option.id
                      ? 'bg-emerald-600/25 border-emerald-400/50 text-emerald-100'
                      : 'bg-[#0b1c35] border-[#1b3a63] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isArabic ? option.labelAr : option.labelEn}
                  <span className="ms-1 font-mono opacity-70">{option.count}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto knx-custom-scrollbar" data-testid="scan-system_health_pulse-volume-list">
            {visibleVolumes.map((volume) => (
              <div key={volume.id} className="text-[10px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold truncate">{volume.letter} {volume.label ? `· ${volume.label}` : ''}</span>
                  <span className="font-mono shrink-0">{volume.freePercent}% {isArabic ? 'حر' : 'free'}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full ${volume.freePercent < 10 ? 'bg-rose-500' : 'bg-emerald-400'}`} style={{ width: `${Math.max(2, volume.usedPercent)}%` }} />
                </div>
              </div>
            ))}
            {!volumes.length ? <p className="text-[10px] text-slate-500">{isArabic ? 'لم تُقرأ وحدات تخزين.' : 'No mounted volume was measured.'}</p> : null}
            {volumes.length && !visibleVolumes.length ? <p className="text-[10px] text-slate-500">{isArabic ? 'لا وحدات مطابقة للمرشح الحالي.' : 'No volume matches the current filter.'}</p> : null}
          </div>
        </div>

        <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 mb-2">
            <Monitor className="w-3.5 h-3.5" />
            {isArabic ? 'لقطة النظام' : 'System snapshot'}
          </div>
          <div className="space-y-1 text-[10px] text-slate-300">
            <Row icon={<Monitor className="w-3 h-3" />} label={isArabic ? 'نظام التشغيل' : 'OS'} value={system?.osCaption || (isArabic ? 'غير متاح' : 'Unavailable')} />
            <Row icon={<ShieldCheck className="w-3 h-3" />} label={isArabic ? 'البناء' : 'Build'} value={system?.osBuild || (isArabic ? 'غير متاح' : 'Unavailable')} />
            <Row icon={<Activity className="w-3 h-3" />} label={isArabic ? 'مدة التشغيل' : 'Uptime'} value={system?.uptimeSeconds == null ? '—' : `${Math.floor(system.uptimeSeconds / 3600)}h ${Math.floor((system.uptimeSeconds % 3600) / 60)}m`} />
            <Row icon={<Cpu className="w-3 h-3" />} label={isArabic ? 'المعالج' : 'CPU'} value={system?.cpuModel || (isArabic ? 'غير متاح' : 'Unavailable')} />
            <Row icon={<Cpu className="w-3 h-3" />} label={isArabic ? 'الأنوية المنطقية' : 'Logical cores'} value={system?.cpuLogicalProcessors == null ? '—' : String(system.cpuLogicalProcessors)} />
            <Row icon={<MemoryStick className="w-3 h-3" />} label={isArabic ? 'إجمالي الذاكرة' : 'Total memory'} value={byteLabel(system?.memoryTotalBytes, isArabic)} />
          </div>
          {system?.degraded ? (
            <p className="mt-2 text-[9px] text-amber-300">{system.degradationReason || (isArabic ? 'بعض القيم غير متاحة.' : 'Some values are unavailable.')}</p>
          ) : null}
        </div>
      </div>

      {basis.length ? (
        <div className="rounded-xl border border-[#133059] bg-[#071731] p-2.5">
          <div className="text-[10px] font-bold text-slate-300 mb-1">{isArabic ? 'أساس درجة الصحة' : 'Health score basis'}</div>
          <div className="flex flex-wrap gap-1">
            {basis.map((entry) => (
              <span key={entry} className="px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/25 text-[9px] text-emerald-200">{entry}</span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-2.5 text-[10px] text-emerald-200/80">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          {isArabic
            ? 'القياسات لحظية وليست تشخيصًا طبيًا للجهاز. درجة الصحة اشتقاق حتمي من الإشارات المقيسة؛ القيم الناقصة لا تُملأ تجريبيًا.'
            : 'Readings are momentary, not a hardware diagnosis. The health score is a deterministic derivation of measured signals; missing values are never backfilled.'}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <StageStrip service={service} isArabic={isArabic} />
        <WorkspaceLink workspace="system" labelEn="System Workspace" labelAr="مساحة النظام" isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />
      </div>
    </div>
  );
};

function volumeLetter(volume: { letter: string }): string {
  return volume.letter.replace(/:.*$/, '').toUpperCase();
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1 text-slate-500 shrink-0">{icon}{label}</span>
      <span className="font-mono text-slate-200 truncate text-right" title={value}>{value}</span>
    </div>
  );
}
