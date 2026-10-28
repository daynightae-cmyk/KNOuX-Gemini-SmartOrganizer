/**
 * Derives Home UI models from measured bridge state. No synthetic counters:
 * an absent measurement becomes an explicit "not measured" card.
 */
import type {
  HomeActivityItem,
  KnouxInsightData,
  KpiMetric,
  PendingSafeAction,
  QuickAccessItem,
  StorageVolumeSnapshot,
} from '../lib/home-ui';
import type { HomeLiveState } from './live';

const GB = 1024 ** 3;

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB', 'PB'];
  let value = bytes / 1024;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - time) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function percent(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
}

export function deriveKpis(live: HomeLiveState): KpiMetric[] {
  const cpu = percent(live.system?.cpuLoadPercent);
  const memory = percent(live.system?.memoryUsedPercent);
  const cores = live.system?.cpuLogicalProcessors ?? live.system?.cpuCores;
  const indexed = live.sources.reduce((sum, source) => sum + (Number(source.fileCount) || 0), 0);
  const indexedBytes = live.sources.reduce((sum, source) => sum + (Number(source.totalBytes) || 0), 0);
  const latestScan = [...live.scans]
    .filter((scan) => scan.status === 'complete' || scan.status === 'partial')
    .sort((a, b) => new Date(b.finishedAt || b.startedAt).getTime() - new Date(a.finishedAt || a.startedAt).getTime())[0] || null;
  const reclaimable = latestScan?.verifiedReclaimableBytes || 0;
  const installed = live.apps?.kpis.installed ?? null;
  const services = live.services;

  return [
    {
      id: 'kpi-load',
      title: 'CPU Load · Live',
      titleAr: 'حمل المعالج · حي',
      value: cpu == null ? '—' : `${Math.round(cpu)}%`,
      badge: cpu == null ? (live.status === 'loading' ? 'Measuring…' : 'Not measured') : 'Measured sample',
      badgeColor: cpu == null ? '#f59e0b' : cpu > 85 ? '#f43f5e' : '#10b981',
      subtext: memory == null ? 'Memory not measured' : `Memory ${Math.round(memory)}%${cores ? ` · ${cores} logical cores` : ''}`,
      subtextAr: memory == null ? 'الذاكرة غير مقيسة' : `الذاكرة ${Math.round(memory)}%${cores ? ` · ${cores} نواة منطقية` : ''}`,
      status: cpu != null && cpu > 85 ? 'alert' : cpu != null && cpu > 70 ? 'warning' : cpu != null ? 'optimal' : 'info',
      trend: 'neutral',
      sparkline: [],
      color: '#38bdf8',
      targetPage: 'system',
      icon: 'shield',
    },
    {
      id: 'kpi-indexed',
      title: 'Indexed Files',
      titleAr: 'الملفات المفهرسة',
      value: live.sources.length ? formatNumber(indexed) : '—',
      badge: live.sources.length ? 'Measured inventory' : 'No authorized source',
      badgeColor: live.sources.length ? '#06b6d4' : '#f59e0b',
      subtext: live.sources.length ? `${live.sources.length} source${live.sources.length === 1 ? '' : 's'} · ${formatBytes(indexedBytes)}` : 'Authorize a folder in Files',
      subtextAr: live.sources.length ? `${live.sources.length} مصدر · ${formatBytes(indexedBytes)}` : 'صرّح بمجلد من الملفات',
      status: live.sources.length ? 'info' : 'warning',
      trend: 'neutral',
      sparkline: [],
      color: '#06b6d4',
      targetPage: 'files',
      icon: 'files',
    },
    {
      id: 'kpi-reclaimable',
      title: 'Verified Reclaimable',
      titleAr: 'مساحة موثقة قابلة للاسترداد',
      value: latestScan ? formatBytes(latestScan.verifiedReclaimableBytes) : '—',
      badge: latestScan ? `Latest ${latestScan.mode} scan` : 'No verified scan',
      badgeColor: latestScan ? '#a855f7' : '#f59e0b',
      subtext: latestScan ? `${formatNumber(latestScan.findingsCount)} findings · ${relativeTime(latestScan.finishedAt || latestScan.startedAt)}` : 'Run Smart Scan to measure',
      subtextAr: latestScan ? `${formatNumber(latestScan.findingsCount)} نتيجة · ${relativeTime(latestScan.finishedAt || latestScan.startedAt)}` : 'شغّل الفحص الذكي للقياس',
      status: reclaimable > 0 ? 'warning' : 'info',
      trend: 'neutral',
      sparkline: [],
      color: '#a855f7',
      targetPage: reclaimable > 0 ? 'cleanup' : 'scan',
      icon: 'database',
    },
    {
      id: 'kpi-automations',
      title: 'Workflow Drafts',
      titleAr: 'مسودات سير العمل',
      value: live.available.workflows?formatNumber(live.workflows.length):'—',
      badge: live.available.workflows?'Local drafts':'Provider unavailable',
      badgeColor: '#10b981',
      subtext: live.available.journal?`${formatNumber(live.journal.length)} dry-run${live.journal.length === 1 ? '' : 's'} · no execution by this provider`:'Journal not available',
      subtextAr: live.available.journal?`${formatNumber(live.journal.length)} معاينة جافة · هذا المزوّد لا ينفذ عمليات`:'سجل الأتمتة غير متاح',
      status: live.workflows.length ? 'info' : 'warning',
      trend: 'neutral',
      sparkline: [],
      color: '#10b981',
      targetPage: 'automation',
      icon: 'zap',
    },
    {
      id: 'kpi-apps',
      title: 'Installed Applications',
      titleAr: 'التطبيقات المثبتة',
      value: installed == null ? '—' : formatNumber(installed),
      badge: installed == null ? 'Not measured' : 'Measured inventory',
      badgeColor: installed == null ? '#f59e0b' : '#3b82f6',
      subtext: live.apps ? `${formatNumber(live.apps.kpis.publishers)} publishers · ${formatNumber(live.apps.kpis.packaged)} packaged` : 'Applications bridge unavailable',
      subtextAr: live.apps ? `${formatNumber(live.apps.kpis.publishers)} ناشر · ${formatNumber(live.apps.kpis.packaged)} حزمة` : 'جسر التطبيقات غير متاح',
      status: installed == null ? 'warning' : 'info',
      trend: 'neutral',
      sparkline: [],
      color: '#3b82f6',
      targetPage: 'applications',
      icon: 'grid',
    },
    {
      id: 'kpi-services',
      title: 'Services Running',
      titleAr: 'الخدمات العاملة',
      value: services ? `${formatNumber(services.running)} / ${formatNumber(services.total)}` : '—',
      badge: services ? 'Measured SCM' : 'Not measured',
      badgeColor: services ? '#10b981' : '#f59e0b',
      subtext: services ? `${formatNumber(services.stopped)} stopped · ${services.provider}` : 'Services summary unavailable',
      subtextAr: services ? `${formatNumber(services.stopped)} متوقفة · ${services.provider}` : 'ملخص الخدمات غير متاح',
      status: services && services.stopped > 0 ? 'info' : services ? 'optimal' : 'warning',
      trend: 'neutral',
      sparkline: [],
      color: '#10b981',
      targetPage: 'services',
      icon: 'settings',
    },
  ];
}

export function deriveActivities(live: HomeLiveState): HomeActivityItem[] {
  const scanItems: Array<HomeActivityItem & { timestamp: number }> = [...live.scans]
    .sort((a, b) => new Date(b.finishedAt || b.startedAt).getTime() - new Date(a.finishedAt || a.startedAt).getTime())
    .slice(0, 3)
    .map((scan) => {
      const at = scan.finishedAt || scan.startedAt;
      const detail = `${formatNumber(scan.findingsCount)} findings · ${formatBytes(scan.verifiedReclaimableBytes)} verified`;
      return {
        id: `scan-${scan.id}`,
        title: scan.status === 'complete' ? 'Smart Scan completed' : `Smart Scan ${scan.status}`,
        titleAr: scan.status === 'complete' ? 'اكتمل الفحص الذكي' : `الفحص الذكي ${scan.status}`,
        detail,
        detailAr: `${formatNumber(scan.findingsCount)} نتيجة · ${formatBytes(scan.verifiedReclaimableBytes)} موثقة`,
        timeAgo: relativeTime(at),
        timeAgoAr: relativeTime(at),
        status: scan.status === 'complete' ? 'success' : scan.status === 'partial' ? 'warning' : 'info',
        icon: 'scan',
        targetPage: scan.verifiedReclaimableBytes > 0 ? 'cleanup' : 'scan',
        isChecked: false,
        timestamp: new Date(at).getTime(),
      };
    });
  const journalItems: Array<HomeActivityItem & { timestamp: number }> = [...live.journal]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 3)
    .map((entry) => ({
      id: `journal-${entry.id}`,
      title: 'Workflow dry-run',
      titleAr: 'معاينة جافة لسير عمل',
      detail: `${entry.workflowName} · no execution`,
      detailAr: `${entry.workflowName} · بلا تنفيذ`,
      timeAgo: relativeTime(entry.at),
      timeAgoAr: relativeTime(entry.at),
      status: 'info',
      icon: 'folder',
      targetPage: 'automation',
      isChecked: false,
      timestamp: new Date(entry.at).getTime(),
    }));
  const receiptItems:Array<HomeActivityItem & {timestamp:number}>=(live.receipts||[]).map(receipt=>{
    const restored=receipt.undoCompletedFiles>0,at=receipt.updatedAt||receipt.createdAt||'';
    return {id:'organization-'+receipt.operationId,title:restored?'Organization restore verified':'Organization '+receipt.status,titleAr:restored?'استعادة التنظيم متحققة':'التنظيم · '+receipt.status,detail:`${receipt.completedFiles} verified · ${receipt.undoCompletedFiles} restored · ${receipt.failedFiles} failed`,detailAr:`${receipt.completedFiles} متحقق · ${receipt.undoCompletedFiles} مستعاد · ${receipt.failedFiles} فشل`,timeAgo:relativeTime(at),timeAgoAr:relativeTime(at),status:receipt.failedFiles?'warning':restored||receipt.status==='completed'?'success':'info',icon:'folder',targetPage:'studio',isChecked:false,timestamp:new Date(at).getTime()||0};
  });
  return [...scanItems, ...journalItems,...receiptItems].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5).map(({ timestamp: _timestamp, ...item }) => item);
}

export function deriveQuickAccess(live: HomeLiveState): QuickAccessItem[] {
  const source = live.sources[0] || null;
  return live.files.map((file) => {
    const known = new Set(['document', 'spreadsheet', 'video', 'picture', 'archive', 'folder']);
    const category = known.has(file.uiCategory) ? file.uiCategory as QuickAccessItem['category'] : 'document';
    const parent = file.relative.split(/[\\/]/).slice(0, -1).join(' / ');
    return {
      id: `quick-${file.id}`,
      name: file.name,
      path: parent || source?.label || 'Authorized source',
      category,
      size: formatBytes(file.size),
      lastModified: relativeTime(file.modifiedAt),
      lastModifiedAr: relativeTime(file.modifiedAt),
      modifiedAt: file.modifiedAt,
      isPinned: false,
    };
  });
}

export function deriveVolumes(live: HomeLiveState): StorageVolumeSnapshot[] {
  return (live.system?.volumes || []).slice(0, 3).map((volume, index) => {
    const total = volume.sizeBytes || 0;
    const free = volume.freeBytes || 0;
    const used = Math.max(0, total - free);
    const usedPercent = total > 0 ? Math.round((used / total) * 1000) / 10 : 0;
    const freePercent = total > 0 ? Math.round((free / total) * 1000) / 10 : 0;
    return {
      id: `vol-${index}-${volume.deviceId || index}`,
      letter: volume.deviceId || `Volume ${index + 1}`,
      label: `${volume.fileSystem || 'Volume'} · ${formatBytes(total)}`,
      labelAr: `${volume.fileSystem || 'وحدة'} · ${formatBytes(total)}`,
      totalBytes: total,
      freeBytes: free,
      totalFormatted: formatBytes(total),
      freeFormatted: `${formatBytes(free)} free`,
      usedFormatted: formatBytes(used),
      usedPercent,
      freePercent,
      fileSystem: volume.fileSystem || '—',
      accentColor: freePercent < 10 ? '#f43f5e' : freePercent < 20 ? '#f59e0b' : '#38bdf8',
      status: freePercent < 5 ? 'critical' : freePercent < 15 ? 'caution' : 'healthy',
    };
  });
}

export function deriveInsight(live: HomeLiveState): KnouxInsightData {
  const latest = [...live.scans]
    .filter((scan) => scan.status === 'complete' || scan.status === 'partial')
    .sort((a, b) => new Date(b.finishedAt || b.startedAt).getTime() - new Date(a.finishedAt || a.startedAt).getTime())[0];
  if (latest && latest.verifiedReclaimableBytes > 0) {
    return {
      id: 'insight-live',
      title: `Verified reclaimable candidates: ${formatBytes(latest.verifiedReclaimableBytes)}`,
      titleAr: `مرشحات موثقة للاسترداد: ${formatBytes(latest.verifiedReclaimableBytes)}`,
      description: `The latest ${latest.mode} scan found ${formatNumber(latest.findingsCount)} findings. Review the measured candidates in Cleanup; nothing is deleted automatically.`,
      descriptionAr: `وجد آخر فحص ${latest.mode} عدد ${formatNumber(latest.findingsCount)} نتيجة. راجع المرشحات المقيسة في التنظيف؛ لا يُحذف شيء تلقائيًا.`,
      actionText: 'Review measured candidates →',
      actionTextAr: 'مراجعة المرشحات المقيسة ←',
      detailsText: 'See Details',
      detailsTextAr: 'عرض التفاصيل',
      reclaimGb: Math.round((latest.verifiedReclaimableBytes / GB) * 100) / 100,
      riskLevel: 'low',
      targetPage: 'cleanup',
    };
  }
  return {
    id: 'insight-unmeasured',
    title: 'No verified cleanup estimate yet',
    titleAr: 'لا يوجد تقدير تنظيف موثق بعد',
    description: 'Run a bounded Smart Scan to measure candidates. Home does not invent reclaimable sizes or savings.',
    descriptionAr: 'شغّل فحصًا ذكيًا محدودًا لقياس المرشحات. لا تخترع Home أحجامًا أو توفيرًا غير مقيس.',
    actionText: 'Open Smart Scan →',
    actionTextAr: 'فتح الفحص الذكي ←',
    detailsText: 'See Details',
    detailsTextAr: 'عرض التفاصيل',
    reclaimGb: 0,
    riskLevel: 'safe',
    targetPage: 'scan',
  };
}

export function derivePendingActions(live: HomeLiveState): PendingSafeAction[] {
  const latest = [...live.scans]
    .filter((scan) => scan.status === 'complete' || scan.status === 'partial')
    .sort((a, b) => new Date(b.finishedAt || b.startedAt).getTime() - new Date(a.finishedAt || a.startedAt).getTime())[0];
  if (!latest || latest.verifiedReclaimableBytes <= 0) return [];
  return [{
    id: `review-${latest.id}`,
    title: 'Review measured cleanup candidates',
    titleAr: 'مراجعة مرشحات التنظيف المقيسة',
    scope: `${formatNumber(latest.findingsCount)} findings · ${formatBytes(latest.verifiedReclaimableBytes)}`,
    scopeAr: `${formatNumber(latest.findingsCount)} نتيجة · ${formatBytes(latest.verifiedReclaimableBytes)}`,
    sizeFormatted: formatBytes(latest.verifiedReclaimableBytes),
    targetPage: 'cleanup',
    previewSummary: 'Measured by the latest scan. Home does not execute cleanup; open the Cleanup workbench to inspect the immutable plan and request approval.',
    previewSummaryAr: 'مقيسة بواسطة آخر فحص. لا تنفذ Home التنظيف؛ افتح مساحة التنظيف لفحص الخطة الثابتة وطلب الموافقة.',
    safetyLevel: 'Review only · no automatic deletion',
    safetyLevelAr: 'مراجعة فقط · لا حذف تلقائي',
    itemsCount: latest.findingsCount,
    iconType: 'folder',
  }];
}

export interface HomeSystemMetrics {
  cpuPercent: number | null;
  memoryPercent: number | null;
  diskPercent: number | null;
  systemDriveFreeBytes: number | null;
  observedAt: string | null;
  uptimeSeconds: number | null;
  osCaption: string | null;
}

export function deriveSystemMetrics(live: HomeLiveState): HomeSystemMetrics {
  const drive = live.system?.systemDrive?.replace(/:$/, '') || '';
  const volume = live.system?.volumes.find((entry) => (entry.deviceId || '').replace(/:$/, '') === drive) || live.system?.volumes[0] || null;
  const total = volume?.sizeBytes || 0;
  const free = volume?.freeBytes || 0;
  return {
    cpuPercent: percent(live.system?.cpuLoadPercent),
    memoryPercent: percent(live.system?.memoryUsedPercent),
    diskPercent: total > 0 ? Math.round(((total - free) / total) * 100) : null,
    systemDriveFreeBytes: live.system?.systemDriveFreeBytes ?? (volume?.freeBytes ?? null),
    observedAt: live.observedAt,
    uptimeSeconds: live.system?.uptimeSeconds ?? null,
    osCaption: live.system?.osCaption ?? null,
  };
}
