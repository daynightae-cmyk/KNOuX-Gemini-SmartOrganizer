/**
 * KNOuX SmartOrganizer — measured KPI bar.
 *
 * Values come from ScanSession.kpis or are derived from the measured summary.
 * When no session exists, each card renders an explicit dash and an
 * "awaiting measured scan" note instead of a design number.
 */
import React from 'react';
import { Activity, AlertTriangle, FileStack, HardDrive, Shield, Target } from 'lucide-react';
import type { KpiMetric } from './smartScan.types';

export interface ScanMetricsProps {
  metrics: KpiMetric[];
  isArabic?: boolean;
  hasSession?: boolean;
}

const PLACEHOLDERS: Array<Pick<KpiMetric, 'id' | 'labelEn' | 'labelAr' | 'indicatorType' | 'accentColor'>> = [
  { id: 'coverage', labelEn: 'Stage coverage', labelAr: 'تغطية المراحل', indicatorType: 'ring', accentColor: 'cyan' },
  { id: 'files', labelEn: 'Files indexed', labelAr: 'الملفات المفهرسة', indicatorType: 'stack', accentColor: 'blue' },
  { id: 'issues', labelEn: 'Findings', labelAr: 'النتائج', indicatorType: 'alert', accentColor: 'red' },
  { id: 'space', labelEn: 'Verified duplicates', labelAr: 'مكررات متحقق منها', indicatorType: 'disk', accentColor: 'purple' },
  { id: 'privacy', labelEn: 'Origin markers', labelAr: 'علامات الأصل', indicatorType: 'shield', accentColor: 'teal' },
  { id: 'health', labelEn: 'Measured health score', labelAr: 'درجة الصحة المقيسة', indicatorType: 'sparkline', accentColor: 'green' },
];

const TONE: Record<KpiMetric['accentColor'], { border: string; icon: string; value: string; sub: string }> = {
  cyan: { border: 'hover:border-cyan-500/50', icon: 'bg-cyan-500/15 text-cyan-400 border-cyan-400/30', value: 'text-white', sub: 'text-cyan-300' },
  blue: { border: 'hover:border-blue-500/50', icon: 'bg-blue-500/15 text-blue-400 border-blue-400/30', value: 'text-white', sub: 'text-cyan-300' },
  red: { border: 'hover:border-rose-500/50', icon: 'bg-rose-500/15 text-rose-400 border-rose-400/30', value: 'text-rose-300', sub: 'text-rose-400' },
  purple: { border: 'hover:border-purple-500/50', icon: 'bg-purple-500/15 text-purple-400 border-purple-400/30', value: 'text-purple-300', sub: 'text-purple-300' },
  teal: { border: 'hover:border-teal-500/50', icon: 'bg-teal-500/15 text-teal-400 border-teal-400/30', value: 'text-teal-300', sub: 'text-teal-300' },
  green: { border: 'hover:border-emerald-500/50', icon: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30', value: 'text-emerald-400', sub: 'text-emerald-300' },
};

function IndicatorIcon({ type }: { type: KpiMetric['indicatorType'] }) {
  switch (type) {
    case 'stack':
      return <FileStack className="w-3.5 h-3.5" />;
    case 'alert':
      return <AlertTriangle className="w-3.5 h-3.5" />;
    case 'disk':
      return <HardDrive className="w-3.5 h-3.5" />;
    case 'shield':
      return <Shield className="w-3.5 h-3.5" />;
    case 'sparkline':
      return <Activity className="w-3.5 h-3.5" />;
    case 'ring':
    default:
      return <Target className="w-3.5 h-3.5" />;
  }
}

export const ScanMetrics: React.FC<ScanMetricsProps> = ({ metrics, isArabic = false, hasSession = false }) => {
  const rows: KpiMetric[] = metrics.length
    ? metrics
    : PLACEHOLDERS.map((placeholder) => ({
        ...placeholder,
        value: '—',
        subtextEn: 'Awaiting measured scan',
        subtextAr: 'بانتظار فحص مقيس',
        provenance: 'unavailable',
      }));

  return (
    <div className="scan-metrics grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0">
      {rows.map((metric) => {
        const tone = TONE[metric.accentColor];
        const unavailable = metric.provenance === 'unavailable';
        const badge = !hasSession || unavailable
          ? { label: isArabic ? 'غير متاح' : 'N/A', tone: 'bg-slate-900 border-slate-700 text-slate-500' }
          : metric.provenance === 'measured'
            ? { label: isArabic ? 'مقيس' : 'MEASURED', tone: 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300' }
            : { label: isArabic ? 'جزئي' : 'PARTIAL', tone: 'bg-amber-950/40 border-amber-500/30 text-amber-300' };
        return (
          <div
            key={metric.id}
            data-testid={`scan-kpi-${metric.id}`}
            className={`scan-metric-card bg-[#07152b]/90 border border-[#132c4f] rounded-xl p-3 flex flex-col justify-between transition-all shadow-md ${tone.border} ${unavailable ? 'opacity-70' : ''}`}
            title={unavailable ? (isArabic ? 'لم تُقس هذه القيمة في الجلسة المحددة' : 'This value was not measured in the selected session') : undefined}
          >
            <div className="flex items-center justify-between mb-1 gap-1">
              <span className="scan-metric-label text-[11px] font-medium text-slate-300 truncate">{isArabic ? metric.labelAr : metric.labelEn}</span>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${tone.icon}`}>
                <IndicatorIcon type={metric.indicatorType} />
              </div>
            </div>

            <div data-testid={`scan-kpi-${metric.id}-value`} className={`text-xl font-black font-mono tracking-tight ${tone.value}`}>{metric.value}</div>

            <div className="flex items-center justify-between text-[10px] mt-1 font-medium gap-1">
              <span className={`scan-metric-sub truncate ${tone.sub}`}>{isArabic ? metric.subtextAr : metric.subtextEn}</span>
              <span className={`px-1 py-0.2 rounded border text-[8px] font-mono shrink-0 ${badge.tone}`}>
                {badge.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
