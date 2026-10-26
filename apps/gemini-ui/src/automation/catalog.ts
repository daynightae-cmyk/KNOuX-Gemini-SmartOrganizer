/**
 * KNOuX Flow Studio - canonical tool catalog (Mission 13).
 */
import {
  Archive,
  Bell,
  BatteryCharging,
  CalendarDays,
  Clock3,
  Download,
  HardDriveDownload,
  History,
  LayoutTemplate,
  Moon,
  ScanLine,
  Sparkles,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import type { AutomationToolId } from '../../shared/native-contracts';

export type AutomationLocale = 'en' | 'ar';

export interface AutomationCatalogEntry {
  id: AutomationToolId;
  index: number;
  en: string;
  ar: string;
  shortEn: string;
  shortAr: string;
  blurbEn: string;
  blurbAr: string;
  state: 'available' | 'partial' | 'gated';
  risk: 'read-only' | 'staged-change';
  provider: string;
  accent: string;
  icon: LucideIcon;
}

export const AUTOMATION_TOOLS: AutomationCatalogEntry[] = [
  { id: 'auto-smart-scan', index: 1, en: 'Scheduled Smart Scan', ar: 'فحص ذكي مجدول', shortEn: 'Smart Scan', shortAr: 'فحص ذكي', blurbEn: 'Schedule -> read-only scan -> approval -> report.', blurbAr: 'جدولة -> فحص للقراءة فقط -> موافقة -> تقرير.', state: 'gated', risk: 'staged-change', provider: 'Local draft + dry-run', accent: '#22d3ee', icon: ScanLine },
  { id: 'auto-schedule-manager', index: 2, en: 'Schedule Manager', ar: 'مدير الجدولة', shortEn: 'Schedules', shortAr: 'الجدولة', blurbEn: 'Weekly schedule metadata and next occurrences.', blurbAr: 'بيانات جدولة أسبوعية والمواعيد التالية.', state: 'gated', risk: 'staged-change', provider: 'Persisted schedule metadata', accent: '#38bdf8', icon: CalendarDays },
  { id: 'auto-run-history', index: 3, en: 'Dry-run History', ar: 'سجل المعاينات الجافة', shortEn: 'History', shortAr: 'السجل', blurbEn: 'Deterministic dry-runs only; zero executions.', blurbAr: 'معاينات جافة حتمية فقط؛ صفر تنفيذات.', state: 'available', risk: 'read-only', provider: 'Local dry-run journal', accent: '#94a3b8', icon: History },
  { id: 'auto-templates', index: 4, en: 'Template Gallery', ar: 'معرض القوالب', shortEn: 'Templates', shortAr: 'القوالب', blurbEn: 'Built-in typed workflows to instantiate locally.', blurbAr: 'سير عمل مدمج ومهيكل لإنشائه محليًا.', state: 'available', risk: 'staged-change', provider: 'Built-in templates', accent: '#a78bfa', icon: LayoutTemplate },
  { id: 'auto-schedule-plan', index: 5, en: 'Recurrence Composer', ar: 'منشئ التكرار', shortEn: 'Recurrence', shortAr: 'التكرار', blurbEn: 'Host-timezone recurrence with DST-aware next occurrences.', blurbAr: 'تكرار بتوقيت المضيف مع مواعيد تالية تراعي التوقيت الصيفي.', state: 'available', risk: 'staged-change', provider: 'Intl host timezone', accent: '#34d399', icon: Clock3 },
  { id: 'auto-cleanup-plan', index: 6, en: 'Cleanup Pipeline', ar: 'مسار التنظيف', shortEn: 'Cleanup', shortAr: 'التنظيف', blurbEn: 'Scan, classify, approval and report preview; no delete.', blurbAr: 'معاينة فحص وتصنيف وموافقة وتقرير؛ بلا حذف.', state: 'gated', risk: 'staged-change', provider: 'Preview-only pipeline', accent: '#fb7185', icon: Trash2 },
  { id: 'auto-notify', index: 7, en: 'Notification Routing', ar: 'توجيه الإشعارات', shortEn: 'Notify', shortAr: 'الإشعارات', blurbEn: 'In-app and journal channels only. No external message.', blurbAr: 'قنوات داخل التطبيق والسجل فقط. لا رسالة خارجية.', state: 'gated', risk: 'staged-change', provider: 'Local channel policy', accent: '#f472b6', icon: Bell },
  { id: 'auto-quiet-hours', index: 8, en: 'Quiet Hours Dial', ar: 'قرص ساعات الهدوء', shortEn: 'Quiet Hours', shortAr: 'الهدوء', blurbEn: 'Draft quiet windows and muted event classes.', blurbAr: 'مسودات نوافذ الهدوء وفئات الأحداث المكتومة.', state: 'gated', risk: 'staged-change', provider: 'Local policy draft', accent: '#818cf8', icon: Moon },
  { id: 'auto-battery-policy', index: 9, en: 'Power-aware Scheduler', ar: 'جدولة واعية بالطاقة', shortEn: 'Power Policy', shortAr: 'الطاقة', blurbEn: 'Battery evidence measured only when Windows exposes it.', blurbAr: 'تُقاس أدلة البطارية فقط عندما يوفرها Windows.', state: 'partial', risk: 'staged-change', provider: 'Win32_Battery where available', accent: '#fbbf24', icon: BatteryCharging },
  { id: 'auto-retention', index: 10, en: 'Artifact Retention', ar: 'احتفاظ بالمخرجات', shortEn: 'Retention', shortAr: 'الاحتفاظ', blurbEn: 'Preview aged dry-run records; no delete channel.', blurbAr: 'معاينة سجلات جافة قديمة؛ لا قناة حذف.', state: 'gated', risk: 'staged-change', provider: 'Local journal metadata', accent: '#f97316', icon: Archive },
  { id: 'auto-export', index: 11, en: 'Workflow Transfer', ar: 'نقل سير العمل', shortEn: 'Export', shortAr: 'التصدير', blurbEn: 'Export and validate knoux.workflow.v1 JSON.', blurbAr: 'تصدير والتحقق من JSON بصيغة knoux.workflow.v1.', state: 'available', risk: 'staged-change', provider: 'knoux.workflow.v1', accent: '#60a5fa', icon: Download },
  { id: 'auto-backup-plan', index: 12, en: 'Backup Flow Draft', ar: 'مسودة سير النسخ', shortEn: 'Backup Draft', shortAr: 'مسودة النسخ', blurbEn: 'Authorized source + destination gate; no copy channel.', blurbAr: 'مصدر مصرح به + بوابة وجهة؛ لا قناة نسخ.', state: 'partial', risk: 'staged-change', provider: 'Studio sources + destination gate', accent: '#c084fc', icon: HardDriveDownload },
];

export const TOOL_BY_ID = Object.fromEntries(AUTOMATION_TOOLS.map((entry) => [entry.id, entry])) as Record<AutomationToolId, AutomationCatalogEntry>;
export const AUTOMATION_TOOL_IDS = AUTOMATION_TOOLS.map((entry) => entry.id);

export const STATE_META = {
  available: { en: 'Available', ar: 'متاح', tone: 'good' as const },
  partial: { en: 'Partial', ar: 'جزئي', tone: 'warn' as const },
  gated: { en: 'Gated', ar: 'محمي', tone: 'bad' as const },
};

export const RISK_META = {
  'read-only': { en: 'Read-only', ar: 'للقراءة فقط', tone: 'good' as const },
  'staged-change': { en: 'Draft only', ar: 'مسودة فقط', tone: 'warn' as const },
};

export function toolLabel(id: AutomationToolId, locale: AutomationLocale): string {
  return locale === 'ar' ? TOOL_BY_ID[id].ar : TOOL_BY_ID[id].en;
}
