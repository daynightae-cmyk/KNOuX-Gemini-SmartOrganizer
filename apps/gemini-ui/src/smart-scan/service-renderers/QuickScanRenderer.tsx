/**
 * SCAN-01 — Quick Scan measured workspace.
 * Authorized inventory + capacity + system + service summary. Read-only.
 */
import React from 'react';
import { Activity, CheckCircle2, Gauge, HardDrive, Layers, Server, ShieldCheck } from 'lucide-react';
import { EmptyResult, Metric, StageStrip, WorkspaceLink, byteLabel, countLabel, type ServiceRendererProps } from './shared';

export const QuickScanRenderer: React.FC<ServiceRendererProps> = ({ service, isArabic, onNavigateToWorkspace }) => {
  if (!service) return <EmptyResult service={service} isArabic={isArabic} />;
  const data = service.data;
  const totals = data.totals;
  const system = data.system;
  const summary = data.services;
  const volumes = data.volumes || [];

  return (
    <div className="space-y-3 text-slate-100 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-[#143058] pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-md">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">{isArabic ? 'مركز الفحص السريع المقيس' : 'Measured Quick Scan'}</h3>
            <p className="text-[10px] text-slate-400">
              {isArabic ? 'فهرس المجلد المصرح به + السعة + النظام + الخدمات' : 'Authorized inventory + capacity + system + services'}
            </p>
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-emerald-400/15 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-400/40">
          READ-ONLY
        </span>
      </div>

      <div className="scan-metric-grid gap-2">
        <Metric label={isArabic ? 'ملفات مفهرسة' : 'Indexed files'} value={countLabel(totals?.files, isArabic)} sub={byteLabel(totals?.bytes, isArabic)} />
        <Metric label={isArabic ? 'وحدات تخزين' : 'Mounted volumes'} value={String(volumes.length)} sub={`${volumes.filter((volume) => volume.isLowSpace).length} ${isArabic ? 'منخفضة' : 'low space'}`} tone="amber" />
        <Metric label={isArabic ? 'حمل المعالج' : 'CPU load'} value={system?.cpuLoadPercent == null ? '—' : `${system.cpuLoadPercent}%`} sub={isArabic ? 'لحظة الفحص' : 'momentary sample'} />
        <Metric label={isArabic ? 'خدمات ويندوز' : 'Windows services'} value={summary ? countLabel(summary.total, isArabic) : '—'} sub={summary ? `${countLabel(summary.running, isArabic)} ${isArabic ? 'قيد التشغيل' : 'running'}` : (isArabic ? 'غير متاح' : 'unavailable')} tone="emerald" />
      </div>

      <div className="scan-split gap-2">
        <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-300 mb-2">
            <HardDrive className="w-3.5 h-3.5" />
            {isArabic ? 'سعة الوحدات المقيسة' : 'Measured volume capacity'}
          </div>
          <div className="space-y-1.5">
            {volumes.map((volume) => (
              <div key={volume.id} className="text-[10px]">
                <div className="flex justify-between text-slate-300">
                  <span className="font-bold">{volume.letter} {volume.label ? `· ${volume.label}` : ''}</span>
                  <span className="font-mono">{volume.freePercent}% {isArabic ? 'حر' : 'free'}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full ${volume.freePercent < 10 ? 'bg-rose-500' : 'bg-cyan-400'}`} style={{ width: `${Math.max(2, 100 - volume.usedPercent)}%` }} />
                </div>
              </div>
            ))}
            {!volumes.length ? <p className="text-[10px] text-slate-500">{isArabic ? 'لم تُقرأ وحدات تخزين.' : 'No mounted volume was measured.'}</p> : null}
          </div>
        </div>

        <div className="rounded-xl border border-[#133059] bg-[#091a38] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-300 mb-2">
            <Activity className="w-3.5 h-3.5" />
            {isArabic ? 'نبض النظام المقيس' : 'Measured system pulse'}
          </div>
          <div className="space-y-1 text-[10px] text-slate-300">
            <Row icon={<Server className="w-3 h-3" />} label={isArabic ? 'نظام التشغيل' : 'OS'} value={system?.osCaption || (isArabic ? 'غير متاح' : 'Unavailable')} />
            <Row icon={<Layers className="w-3 h-3" />} label={isArabic ? 'الذاكرة' : 'Memory'} value={system?.memoryUsedPercent == null ? '—' : `${system.memoryUsedPercent}%`} />
            <Row icon={<CheckCircle2 className="w-3 h-3" />} label={isArabic ? 'مدة التشغيل' : 'Uptime'} value={system?.uptimeSeconds == null ? '—' : `${Math.floor(system.uptimeSeconds / 3600)}h`} />
            <Row icon={<ShieldCheck className="w-3 h-3" />} label={isArabic ? 'المزود' : 'Provider'} value={system?.uptimeSource || (isArabic ? 'مقيس' : 'Measured')} />
          </div>
        </div>
      </div>

      <StageStrip service={service} isArabic={isArabic} />

      <div className="flex items-center justify-between">
        <p className="text-[9px] text-slate-500">
          {isArabic ? 'كل القيم من مزودات ويندوز المقيسة؛ لا توجد أرقام تجريبية.' : 'All values come from measured Windows providers; no design numbers.'}
        </p>
        <WorkspaceLink workspace="storage" labelEn="Storage Atlas" labelAr="أطلس التخزين" isArabic={isArabic} onNavigateToWorkspace={onNavigateToWorkspace} />
      </div>
    </div>
  );
};

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1 text-slate-500 shrink-0">{icon}{label}</span>
      <span className="font-mono text-slate-200 truncate text-right">{value}</span>
    </div>
  );
}
