/**
 * KNOuX SmartOrganizer — measured KPI bar.
 *
 * Values come from ScanSession.kpis or are derived from the measured summary.
 * When no session exists, each card renders an explicit dash and an
 * "awaiting measured scan" note instead of a design number.
 */
import React from 'react';
import { Activity, AlertTriangle, Clock3, FileStack, HardDrive, Shield, ShieldCheck, Target } from 'lucide-react';
import type { ScanSession } from '../../shared/native-contracts';
import { formatBytes, formatDateTime, modeLabel, sessionStatusLabel } from './model';
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
  { id: 'space', labelEn: 'Duplicate bytes', labelAr: 'بايتات مكررة', indicatorType: 'disk', accentColor: 'purple' },
  { id: 'privacy', labelEn: 'Origin markers', labelAr: 'علامات الأصل', indicatorType: 'shield', accentColor: 'teal' },
  { id: 'health', labelEn: 'Health score', labelAr: 'درجة الصحة', indicatorType: 'sparkline', accentColor: 'green' },
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
            {/* The icon shares the value row, not the label row: six cards at
                1366 leave barely 65 px beside an icon chip, which forced the
                label into a clamp with an ellipsis that hid what was measured. */}
            <span data-metric-label className="scan-metric-label text-[11px] font-medium leading-tight text-slate-300">{isArabic ? metric.labelAr : metric.labelEn}</span>

            <div className="flex items-center justify-between gap-1">
              <div data-testid={`scan-kpi-${metric.id}-value`} data-metric-value className={`text-xl font-black font-mono tracking-tight ${tone.value}`}>{metric.value}</div>
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${tone.icon}`}>
                <IndicatorIcon type={metric.indicatorType} />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] mt-1 font-medium gap-1">
              <span className={`scan-metric-sub leading-tight ${tone.sub}`} title={isArabic ? metric.subtextAr : metric.subtextEn}>{isArabic ? metric.subtextAr : metric.subtextEn}</span>
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

/**
 * The board's five hero KPI tiles (DAY column / NIGHT band share the same
 * measured set). Every figure comes from the selected native session summary
 * — never a design number. The DAY board's "Security Status: Safe" is derived
 * from measured high-severity findings, and the NIGHT board's "Critical
 * Issues" maps to the same measured high-severity count (the contract has no
 * separate critical tier). Unmeasured values render an explicit dash with a
 * Not-measured note.
 */
export interface ScanHeroTileSpec {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  labelEn: string;
  labelAr: string;
  noteEn: string;
  noteAr: string;
  tone: 'blue' | 'red' | 'green' | 'purple' | 'cyan';
}

export function scanHeroTiles(session: ScanSession | null, isArabic: boolean): ScanHeroTileSpec[] {
  const summary = session?.summary ?? null;
  const duplicateMeasured = Boolean(session?.services.some(
    (service) => service.serviceId === 'duplicate_finder' || service.serviceId === 'deep_scan',
  ));
  const high = summary?.highSeverityCount ?? 0;
  const lastAt = session?.finishedAt || session?.startedAt || null;
  const dash = '—';
  return [
    {
      id: 'scanned',
      icon: FileStack,
      value: summary?.filesIndexed == null ? dash : summary.filesIndexed.toLocaleString(isArabic ? 'ar' : 'en'),
      labelEn: 'Items Scanned',
      labelAr: 'عناصر مفحوصة',
      noteEn: summary?.filesIndexed == null || !session ? 'Not measured' : `${sessionStatusLabel(session.status, false)} · ${modeLabel(session.mode, false)}`,
      noteAr: summary?.filesIndexed == null || !session ? 'غير مقيس' : `${sessionStatusLabel(session.status, true)} · ${modeLabel(session.mode, true)}`,
      tone: 'blue',
    },
    {
      id: 'issues',
      icon: AlertTriangle,
      value: summary ? String(summary.findingsCount || 0) : dash,
      labelEn: 'Issues Found',
      labelAr: 'مشكلات مكتشفة',
      noteEn: summary ? (high > 0 ? `${high} high severity` : 'No high severity') : 'Not measured',
      noteAr: summary ? (high > 0 ? `${high} خطورة عالية` : 'لا خطورة عالية') : 'غير مقيس',
      tone: 'red',
    },
    {
      id: 'security',
      icon: ShieldCheck,
      value: !summary ? dash : high === 0 ? (isArabic ? 'آمن' : 'Safe') : (isArabic ? 'مراجعة' : 'Review'),
      labelEn: 'Security Status',
      labelAr: 'حالة الأمان',
      noteEn: !summary ? 'Not measured' : high === 0 ? 'No critical threats' : `${high} need attention`,
      noteAr: !summary ? 'غير مقيس' : high === 0 ? 'لا تهديدات حرجة' : `${high} تحتاج انتباهًا`,
      tone: 'green',
    },
    {
      id: 'reclaimable',
      icon: HardDrive,
      value: summary && duplicateMeasured ? formatBytes(summary.verifiedReclaimableBytes, isArabic) : dash,
      labelEn: 'Reclaimable Space',
      labelAr: 'مساحة قابلة للاستعادة',
      noteEn: !summary || !duplicateMeasured ? 'Not measured' : `${summary.verifiedDuplicateGroups || 0} verified group(s)`,
      noteAr: !summary || !duplicateMeasured ? 'غير مقيس' : `${summary.verifiedDuplicateGroups || 0} مجموعة متحقق منها`,
      tone: 'purple',
    },
    {
      id: 'last-scan',
      icon: Clock3,
      value: lastAt ? formatDateTime(lastAt, isArabic) : (isArabic ? 'لا سجل' : 'No record'),
      labelEn: 'Last Scan',
      labelAr: 'آخر فحص',
      noteEn: session ? `${modeLabel(session.mode, false)} · ${sessionStatusLabel(session.status, false)}` : 'No scan history yet',
      noteAr: session ? `${modeLabel(session.mode, true)} · ${sessionStatusLabel(session.status, true)}` : 'لا يوجد سجل فحص بعد',
      tone: 'cyan',
    },
  ];
}

export const ScanHeroTiles: React.FC<{ session: ScanSession | null; isArabic?: boolean }> = ({ session, isArabic = false }) => (
  <div className="scan-hero-tiles" data-testid="scan-hero-tiles">
    {scanHeroTiles(session, isArabic).map(({ id, icon: Icon, value, labelEn, labelAr, noteEn, noteAr, tone }) => (
      <div key={id} className={`scan-hero-tile is-${tone}`} data-testid={`scan-hero-tile-${id}`}>
        <span className="scan-hero-tile-icon" aria-hidden="true"><Icon className="w-4 h-4" /></span>
        <span className="scan-hero-tile-copy" title={isArabic ? noteAr : noteEn}>
          <strong>{value}</strong>
          <span>{isArabic ? labelAr : labelEn}</span>
          <small>{isArabic ? noteAr : noteEn}</small>
        </span>
      </div>
    ))}
  </div>
);
