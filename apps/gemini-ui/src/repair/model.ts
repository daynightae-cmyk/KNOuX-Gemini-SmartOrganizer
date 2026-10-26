/**
 * KNOuX Recovery Lab - deterministic presentation helpers (Mission 11).
 * Missing evidence renders as unknown; commands are display strings only.
 */
import type { RepairCommandSpec, RepairJournalEntry, RepairPlan, RepairSnapshot, RepairToolId } from '../../shared/native-contracts';
import { formatBytes, formatCount, formatTimestamp, t } from '../system/model';
import type { RepairLocale, RepairRisk } from './catalog';
import { RISK_META, TOOL_BY_ID } from './catalog';

export { formatBytes, formatCount, formatTimestamp, t };

export function riskMeta(risk: RepairRisk) {
  return RISK_META[risk];
}

export function commandForTool(snapshot: RepairSnapshot | null, toolId: RepairToolId): RepairCommandSpec | null {
  if (!snapshot) return null;
  return snapshot.commands.find((entry) => entry.toolId === toolId) || null;
}

export function planForTool(plan: RepairPlan | null, toolId: RepairToolId) {
  return plan?.items.find((entry) => entry.toolId === toolId) || null;
}

export function stageMeta(status: string): { en: string; ar: string; tone: 'good' | 'warn' | 'bad' | 'muted' | 'info' } {
  switch (status) {
    case 'complete': return { en: 'Complete', ar: 'مكتمل', tone: 'good' };
    case 'partial': return { en: 'Partial', ar: 'جزئي', tone: 'warn' };
    case 'running': return { en: 'Running', ar: 'قيد التنفيذ', tone: 'info' };
    case 'cancelled': return { en: 'Cancelled', ar: 'ملغى', tone: 'muted' };
    case 'failed':
    case 'unavailable': return { en: 'Unavailable', ar: 'غير متاح', tone: 'bad' };
    default: return { en: 'Pending', ar: 'بانتظار', tone: 'muted' };
  }
}

export function restoreStatusMeta(status: string): { en: string; ar: string; tone: 'good' | 'warn' | 'bad' | 'muted' } {
  if (status === 'available') return { en: 'Available', ar: 'متاح', tone: 'good' };
  if (status === 'permission_denied') return { en: 'Access denied', ar: 'الوصول مرفوض', tone: 'warn' };
  return { en: 'Unavailable', ar: 'غير متاح', tone: 'muted' };
}

export function fileEvidenceLabel(value: { exists: boolean | null; sizeBytes: number | null; lastWrite: string | null }, locale: RepairLocale): string {
  if (value.exists !== true) return t(locale, 'Not readable', 'غير مقروء');
  const size = value.sizeBytes == null ? t(locale, 'size unavailable', 'الحجم غير متاح') : formatBytes(value.sizeBytes);
  const when = value.lastWrite ? formatTimestamp(value.lastWrite, locale) : t(locale, 'timestamp unavailable', 'الطابع غير متاح');
  return `${size} · ${when}`;
}

export function serviceStateTone(status: string | null): 'good' | 'warn' | 'muted' {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'running') return 'good';
  if (normalized === 'stopped') return 'warn';
  return 'muted';
}

export function journalFilter(entries: RepairJournalEntry[], query: string, toolId: RepairToolId | 'all'): RepairJournalEntry[] {
  const needle = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (toolId !== 'all' && !entry.toolIds.includes(toolId)) return false;
    if (!needle) return true;
    return `${entry.title} ${entry.summary} ${entry.toolIds.join(' ')} ${entry.receipt}`.toLowerCase().includes(needle);
  });
}

export function journalTitle(entry: RepairJournalEntry, locale: RepairLocale): string {
  if (entry.toolIds.length === 1 && TOOL_BY_ID[entry.toolIds[0]]) {
    return locale === 'ar' ? TOOL_BY_ID[entry.toolIds[0]].ar : TOOL_BY_ID[entry.toolIds[0]].en;
  }
  return locale === 'ar' ? `${entry.toolIds.length} أدوات إصلاح` : `${entry.toolIds.length} repair tools`;
}

export function riskList(plan: RepairPlan | null): { elevation: boolean; reboot: boolean; administrative: number } {
  if (!plan) return { elevation: false, reboot: false, administrative: 0 };
  return {
    elevation: plan.elevationRequired,
    reboot: plan.rebootRequired,
    administrative: plan.items.filter((entry) => entry.risk === 'administrative').length,
  };
}

export function commandDisplay(command: RepairCommandSpec | null, locale: RepairLocale): string {
  if (!command) return t(locale, 'Windows settings handoff only', 'انتقال إعدادات Windows فقط');
  return command.display;
}

export function planLabel(plan: RepairPlan | null, locale: RepairLocale): string {
  if (!plan) return t(locale, 'No preview staged', 'لا توجد معاينة مُهيَّأة');
  return `${formatCount(plan.itemCount)} ${t(locale, 'item(s) · immutable preview', 'عنصرًا · معاينة ثابتة')}`;
}
