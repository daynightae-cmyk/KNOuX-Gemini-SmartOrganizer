/**
 * Presentation adapters for measured Smart Scan sessions.
 *
 * Every helper here reads a real ScanSession/ScanSummary. Missing evidence is
 * rendered as an explicit dash or "not measured" state; nothing is backfilled
 * from design fixtures.
 */
import type {
  ScanCapabilities,
  ScanCapabilityService,
  ScanFinding,
  ScanKpi,
  ScanSession,
  ScanStage,
  ScanSummary,
} from '../../shared/native-contracts';
import type {
  BreakdownCategory,
  KpiMetric,
  RecentScanRecord,
  ScanCategory,
  ScanResultItem,
  ScanServiceMeta,
  ScanStageView,
} from './smartScan.types';

const CATEGORY_META: Record<ScanCategory, { en: string; ar: string; colorHex: string }> = {
  junk: { en: 'Junk', ar: 'مخلفات', colorHex: '#a855f7' },
  duplicates: { en: 'Duplicates', ar: 'مكررات', colorHex: '#06b6d4' },
  large: { en: 'Large files', ar: 'ملفات كبيرة', colorHex: '#3b82f6' },
  system: { en: 'System', ar: 'النظام', colorHex: '#f43f5e' },
  privacy: { en: 'Privacy', ar: 'الخصوصية', colorHex: '#14b8a6' },
  other: { en: 'Other', ar: 'أخرى', colorHex: '#8b5cf6' },
};

const SERVICE_VISUALS: Record<string, { iconName: string; accentGradient: string; targetWorkspace?: string }> = {
  quick_scan: { iconName: 'Zap', accentGradient: 'from-blue-500 to-cyan-400' },
  deep_scan: { iconName: 'Search', accentGradient: 'from-indigo-500 to-blue-400' },
  duplicate_finder: { iconName: 'Copy', accentGradient: 'from-cyan-500 to-teal-400', targetWorkspace: 'storage' },
  large_files_review: { iconName: 'HardDrive', accentGradient: 'from-sky-500 to-blue-500', targetWorkspace: 'storage' },
  junk_cleaner: { iconName: 'Trash2', accentGradient: 'from-purple-500 to-fuchsia-400', targetWorkspace: 'cleanup' },
  privacy_trace_check: { iconName: 'Shield', accentGradient: 'from-teal-500 to-emerald-400', targetWorkspace: 'files' },
  startup_impact_check: { iconName: 'Rocket', accentGradient: 'from-rose-500 to-orange-400', targetWorkspace: 'startup' },
  app_health_review: { iconName: 'Grid', accentGradient: 'from-violet-500 to-purple-400', targetWorkspace: 'applications' },
  system_health_pulse: { iconName: 'Activity', accentGradient: 'from-emerald-500 to-lime-400', targetWorkspace: 'system' },
  smart_recommendations: { iconName: 'Lightbulb', accentGradient: 'from-amber-500 to-yellow-400' },
};

const FINDING_CATEGORY: Record<string, ScanCategory> = {
  'large-file': 'large',
  'duplicate-verified': 'duplicates',
  'duplicate-candidate': 'duplicates',
  'low-space': 'system',
  'memory-pressure': 'system',
  'cpu-load': 'system',
  'startup-item': 'other',
  'privacy-origin': 'privacy',
  'empty-folder': 'junk',
};

const BREAKDOWN_CATEGORY: Record<string, ScanCategory> = {
  large: 'large',
  duplicates: 'duplicates',
  storage: 'system',
  startup: 'other',
  privacy: 'privacy',
  system: 'system',
  folders: 'junk',
};

const MODE_LABEL_EN: Record<ScanSummary['mode'], string> = {
  quick: 'Quick Scan',
  deep: 'Deep Scan',
  service: 'Service Scan',
  custom: 'Custom Scan',
};

const MODE_LABEL_AR: Record<ScanSummary['mode'], string> = {
  quick: 'فحص سريع',
  deep: 'فحص عميق',
  service: 'فحص خدمة',
  custom: 'فحص مخصص',
};

export function formatBytes(bytes: number | null | undefined, isArabic = false): string {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return isArabic ? '٠ بايت' : '0 B';
  const units = isArabic ? ['بايت', 'ك.ب', 'م.ب', 'ج.ب', 'ت.ب'] : ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  const digits = size >= 100 || index === 0 ? 0 : 1;
  return `${size.toFixed(digits)} ${units[index]}`;
}

export function formatDateTime(iso: string | null | undefined, isArabic = false): string {
  if (!iso) return isArabic ? 'غير متاح' : 'Unavailable';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return isArabic ? 'غير متاح' : 'Unavailable';
  return date.toLocaleString(isArabic ? 'ar' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function modeLabel(mode: ScanSummary['mode'], isArabic = false): string {
  return isArabic ? MODE_LABEL_AR[mode] : MODE_LABEL_EN[mode];
}

export function sessionStatusLabel(status: ScanSummary['status'], isArabic = false): string {
  const labels: Record<string, { en: string; ar: string }> = {
    running: { en: 'Running', ar: 'قيد التشغيل' },
    complete: { en: 'Complete', ar: 'مكتمل' },
    partial: { en: 'Partial evidence', ar: 'أدلة جزئية' },
    cancelled: { en: 'Cancelled', ar: 'ملغى' },
    failed: { en: 'Failed', ar: 'فشل' },
  };
  return (isArabic ? labels[status]?.ar : labels[status]?.en) || status;
}

export function stageStatusLabel(status: ScanStageView['status'], isArabic = false): string {
  const labels: Record<string, { en: string; ar: string }> = {
    pending: { en: 'Pending', ar: 'بالانتظار' },
    running: { en: 'Measuring', ar: 'جارٍ القياس' },
    complete: { en: 'Measured', ar: 'مقيس' },
    partial: { en: 'Partial', ar: 'جزئي' },
    failed: { en: 'Failed', ar: 'فشل' },
    skipped: { en: 'Skipped', ar: 'تم التجاوز' },
    unsupported: { en: 'Unsupported', ar: 'غير مدعوم' },
    cancelled: { en: 'Cancelled', ar: 'ملغى' },
  };
  return (isArabic ? labels[status]?.ar : labels[status]?.en) || status;
}

export function toServiceTiles(capabilities: ScanCapabilities | null, isArabic = false): ScanServiceMeta[] {
  if (!capabilities) return [];
  return capabilities.services.map((service: ScanCapabilityService) => {
    const visual = SERVICE_VISUALS[service.id] || { iconName: 'Lightbulb', accentGradient: 'from-slate-500 to-slate-400' };
    const stateSubtext = {
      available: { en: 'Measured read-only scope', ar: 'نطاق مقيس للقراءة فقط' },
      partial: { en: 'Measured subset; scope disclosed', ar: 'جزء مقيس والنطاق موضح' },
      gated: { en: 'Approval-gated', ar: 'يتطلب موافقة' },
    }[service.state] || { en: 'Read-only', ar: 'للقراءة فقط' };
    return {
      id: service.id,
      titleEn: service.labelEn,
      titleAr: service.labelAr,
      subtextEn: stateSubtext.en,
      subtextAr: stateSubtext.ar,
      iconName: visual.iconName,
      accentGradient: visual.accentGradient,
      badge: service.state === 'partial' ? (isArabic ? 'جزئي' : 'PARTIAL') : service.state === 'gated' ? (isArabic ? 'مقيّد' : 'GATED') : undefined,
      state: service.state,
      requiresSource: service.requiresSource,
      stages: service.stages,
      noteEn: service.noteEn,
      noteAr: service.noteAr,
      targetWorkspace: visual.targetWorkspace,
    };
  });
}

function kpiFromSummary(session: ScanSession): KpiMetric[] {
  const summary = session.summary;
  const measured = 'measured' as const;
  const coverage = summary.stagesTotal
    ? Math.round((summary.stagesCompleted / summary.stagesTotal) * 100)
    : 0;
  const duplicateMeasured = session.services.some(
    (service) => service.serviceId === 'duplicate_finder' || service.serviceId === 'deep_scan',
  );
  return [
    {
      id: 'coverage',
      labelEn: 'Stage coverage',
      labelAr: 'تغطية المراحل',
      value: `${coverage}%`,
      subtextEn: `${summary.stagesCompleted}/${summary.stagesTotal} stages returned`,
      subtextAr: `${summary.stagesCompleted}/${summary.stagesTotal} مرحلة اكتملت`,
      accentColor: 'cyan',
      indicatorType: 'ring',
      provenance: measured,
    },
    {
      id: 'files',
      labelEn: 'Files indexed',
      labelAr: 'الملفات المفهرسة',
      value: summary.filesIndexed == null ? '—' : summary.filesIndexed.toLocaleString(),
      subtextEn: summary.bytesIndexed == null ? 'No authorized folder' : formatBytes(summary.bytesIndexed, false),
      subtextAr: summary.bytesIndexed == null ? 'لا يوجد مجلد مصرح' : formatBytes(summary.bytesIndexed, true),
      accentColor: 'blue',
      indicatorType: 'stack',
      provenance: summary.filesIndexed == null ? 'unavailable' : measured,
    },
    {
      id: 'issues',
      labelEn: 'Findings',
      labelAr: 'النتائج',
      value: String(summary.findingsCount || 0),
      subtextEn: `${summary.highSeverityCount || 0} high severity`,
      subtextAr: `${summary.highSeverityCount || 0} خطورة عالية`,
      accentColor: 'red',
      indicatorType: 'alert',
      provenance: measured,
    },
    {
      id: 'space',
      labelEn: 'Verified duplicate bytes',
      labelAr: 'بايتات مكررة متحقق منها',
      value: duplicateMeasured ? formatBytes(summary.verifiedReclaimableBytes, false) : '—',
      subtextEn: duplicateMeasured
        ? `${summary.verifiedDuplicateGroups || 0} verified group(s)`
        : 'Duplicate stage not in this scope',
      subtextAr: duplicateMeasured
        ? `${summary.verifiedDuplicateGroups || 0} مجموعة متحقق منها`
        : 'مرحلة التكرار غير مشمولة في هذا الفحص',
      accentColor: 'purple',
      indicatorType: 'disk',
      provenance: duplicateMeasured ? measured : 'unavailable',
    },
    {
      id: 'privacy',
      labelEn: 'Origin markers',
      labelAr: 'علامات الأصل',
      value: summary.privacySignalCount == null ? '—' : String(summary.privacySignalCount),
      subtextEn: summary.privacySignalCount == null ? 'privacy sample not run' : 'Windows Zone.Identifier sample',
      subtextAr: summary.privacySignalCount == null ? 'لم تُشغّل عينة الخصوصية' : 'عينة Zone.Identifier من ويندوز',
      accentColor: 'teal',
      indicatorType: 'shield',
      provenance: summary.privacySignalCount == null ? 'unavailable' : measured,
    },
    {
      id: 'health',
      labelEn: 'Measured health score',
      labelAr: 'درجة الصحة المقيسة',
      value: summary.healthScore == null ? '—' : `${summary.healthScore}/100`,
      subtextEn: summary.healthScore == null ? 'No numeric signals' : 'Measured signals',
      subtextAr: summary.healthScore == null ? 'لا توجد إشارات رقمية' : 'إشارات مقيسة',
      accentColor: 'green',
      indicatorType: 'sparkline',
      provenance: summary.healthScore == null ? 'unavailable' : 'partial',
    },
  ];
}

export function toKpiMetrics(session: ScanSession | null): KpiMetric[] {
  if (!session) return [];
  const source: ScanKpi[] = Array.isArray(session.kpis) && session.kpis.length ? session.kpis : [];
  if (!source.length) return kpiFromSummary(session);
  return source.map((kpi) => ({
    id: kpi.id,
    labelEn: kpi.labelEn,
    labelAr: kpi.labelAr,
    value: kpi.value,
    subtextEn: kpi.subtextEn,
    subtextAr: kpi.subtextAr,
    accentColor: kpi.accentColor,
    indicatorType: kpi.indicatorType,
    provenance: kpi.provenance,
  }));
}

function findingDescriptionAr(finding: ScanFinding): string {
  const parts: string[] = [];
  if (finding.bytes > 0) parts.push(`الحجم المقيس: ${formatBytes(finding.bytes, true)}.`);
  if (finding.itemCount > 1) parts.push(`عدد العناصر المقيسة: ${finding.itemCount}.`);
  parts.push(`النطاق: ${finding.scope === 'system' ? 'النظام' : finding.scope === 'mounted-volume' ? 'وحدة تخزين' : 'المجلد المصرح به'}.`);
  parts.push('دليل مقيس للقراءة فقط.');
  return parts.join(' ');
}

function findingStatus(finding: ScanFinding): ScanResultItem['status'] {
  if (finding.risk === 'review') return 'review';
  if (finding.risk === 'attention') return 'attention';
  return 'info';
}

const STATUS_LABEL: Record<ScanResultItem['status'], { en: string; ar: string }> = {
  info: { en: 'Measured', ar: 'مقيس' },
  review: { en: 'Review', ar: 'مراجعة' },
  attention: { en: 'Attention', ar: 'انتباه' },
};

export function toResultItems(session: ScanSession | null): ScanResultItem[] {
  if (!session) return [];
  return session.findings.map((finding) => {
    const category = FINDING_CATEGORY[finding.kind] || 'other';
    const meta = CATEGORY_META[category];
    const status = findingStatus(finding);
    return {
      id: finding.stableId,
      nameEn: finding.titleEn,
      nameAr: finding.titleAr,
      descriptionEn: finding.evidence,
      descriptionAr: findingDescriptionAr(finding),
      category,
      categoryLabelEn: meta.en,
      categoryLabelAr: meta.ar,
      itemCount: finding.itemCount,
      bytes: finding.bytes,
      impactLevel: finding.severity === 'high' ? 'high' : finding.severity === 'medium' ? 'medium' : 'low',
      status,
      statusLabelEn: STATUS_LABEL[status].en,
      statusLabelAr: STATUS_LABEL[status].ar,
      provenanceLabelEn: finding.provenance.provider,
      provenanceLabelAr: `المصدر: ${finding.provenance.provider}`,
      pathsPreview: finding.pathPreview.map((path, index) => ({
        id: `${finding.stableId}:path:${index}`,
        path,
        sizeDisplay: formatBytes(finding.bytes, false),
      })),
      detailedDescriptionEn: `${finding.evidence} Provider: ${finding.provenance.provider}. Read-only evidence; no file, service, startup item or registry value was changed.`,
      detailedDescriptionAr: `${findingDescriptionAr(finding)} المصدر: ${finding.provenance.provider}.`,
      evidence: finding.evidence,
    };
  });
}

export function toBreakdown(session: ScanSession | null): BreakdownCategory[] {
  if (!session) return [];
  return session.breakdown.map((group) => {
    const category = BREAKDOWN_CATEGORY[group.id] || 'other';
    return {
      id: category,
      labelEn: group.labelEn,
      labelAr: group.labelAr,
      count: group.count,
      bytes: group.bytes,
      percentage: group.percentage,
      colorHex: group.colorHex,
    };
  });
}

export function toRecentScans(history: ScanSummary[]): RecentScanRecord[] {
  return history.slice(0, 6).map((entry) => ({
    id: entry.id,
    mode: entry.mode,
    sourceLabel: entry.sourceLabel,
    status: entry.status,
    filesIndexed: entry.filesIndexed,
    findingsCount: entry.findingsCount,
    finishedAt: entry.finishedAt,
    timeDisplayEn: formatDateTime(entry.finishedAt, false),
    timeDisplayAr: formatDateTime(entry.finishedAt, true),
  }));
}

export function toStageViews(stages: ScanStage[]): ScanStageView[] {
  return stages.map((stage) => ({
    id: stage.id,
    labelEn: stage.labelEn,
    labelAr: stage.labelAr,
    provider: stage.provider,
    status: stage.status,
    detail: stage.detail,
    durationMs: stage.durationMs,
    errorCode: stage.error?.code || null,
  }));
}

export function findingsFilterCounts(results: ScanResultItem[]): Array<{ id: string; en: string; ar: string; count: number }> {
  const count = (predicate: (item: ScanResultItem) => boolean) => results.filter(predicate).length;
  return [
    { id: 'all', en: `All (${results.length})`, ar: `الكل (${results.length})`, count: results.length },
    { id: 'large', en: `Large (${count((item) => item.category === 'large')})`, ar: `كبيرة (${count((item) => item.category === 'large')})`, count: count((item) => item.category === 'large') },
    { id: 'duplicates', en: `Duplicates (${count((item) => item.category === 'duplicates')})`, ar: `مكررات (${count((item) => item.category === 'duplicates')})`, count: count((item) => item.category === 'duplicates') },
    { id: 'junk', en: `Junk (${count((item) => item.category === 'junk')})`, ar: `مخلفات (${count((item) => item.category === 'junk')})`, count: count((item) => item.category === 'junk') },
    { id: 'privacy', en: `Privacy (${count((item) => item.category === 'privacy')})`, ar: `خصوصية (${count((item) => item.category === 'privacy')})`, count: count((item) => item.category === 'privacy') },
    { id: 'other', en: `System (${count((item) => item.category === 'system' || item.category === 'other')})`, ar: `النظام (${count((item) => item.category === 'system' || item.category === 'other')})`, count: count((item) => item.category === 'system' || item.category === 'other') },
  ];
}
