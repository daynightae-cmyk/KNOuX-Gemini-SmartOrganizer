/**
 * KNOuX Recovery Lab - canonical repair catalog (Mission 11).
 *
 * Twelve registry descriptors. Labels, icons and accents are presentation
 * metadata; every evidence value and plan item comes from the read-only
 * RepairBridge at runtime.
 */
import {
  Clock3,
  FileCheck2,
  FileWarning,
  Globe2,
  History,
  LifeBuoy,
  Network,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { RepairToolId } from '../../shared/native-contracts';

export type RepairLocale = 'en' | 'ar';
export type RepairRisk = 'read-only' | 'elevated-read-only' | 'administrative';
export type RepairToolState = 'available' | 'partial' | 'gated';

export interface RepairCatalogEntry {
  id: RepairToolId;
  index: number;
  en: string;
  ar: string;
  shortEn: string;
  shortAr: string;
  blurbEn: string;
  blurbAr: string;
  risk: RepairRisk;
  state: RepairToolState;
  provider: string;
  accent: string;
  icon: LucideIcon;
}

export const REPAIR_TOOLS: RepairCatalogEntry[] = [
  {
    id: 'repair-component-check',
    index: 1,
    en: 'DISM CheckHealth',
    ar: 'فحص صحة المكونات',
    shortEn: 'CheckHealth',
    shortAr: 'فحص الصحة',
    blurbEn: 'Read-only component-store health inspection. Requires elevation; not executed here.',
    blurbAr: 'فحص صحة مخزن المكونات للقراءة فقط. يتطلب رفع صلاحيات؛ لا يُنفذ هنا.',
    risk: 'elevated-read-only',
    state: 'partial',
    provider: 'DISM.exe /CheckHealth',
    accent: '#22d3ee',
    icon: ShieldCheck,
  },
  {
    id: 'repair-component-scan',
    index: 2,
    en: 'DISM ScanHealth',
    ar: 'مسح صحة المكونات',
    shortEn: 'ScanHealth',
    shortAr: 'مسح الصحة',
    blurbEn: 'Seven-stage component-store scan plan with measured log metadata.',
    blurbAr: 'خطة مسح مخزن المكونات على سبع مراحل مع بيانات السجل المقيسة.',
    risk: 'elevated-read-only',
    state: 'partial',
    provider: 'DISM.exe /ScanHealth',
    accent: '#38bdf8',
    icon: ScanLine,
  },
  {
    id: 'repair-component-restore',
    index: 3,
    en: 'DISM RestoreHealth',
    ar: 'استعادة صحة المكونات',
    shortEn: 'RestoreHealth',
    shortAr: 'استعادة الصحة',
    blurbEn: 'Repairs component files. Administrative execution is gated; preview only.',
    blurbAr: 'يصلح ملفات المكونات. التنفيذ الإداري محجوب؛ معاينة فقط.',
    risk: 'administrative',
    state: 'gated',
    provider: 'DISM.exe /RestoreHealth',
    accent: '#a78bfa',
    icon: Wrench,
  },
  {
    id: 'repair-files-verify',
    index: 4,
    en: 'SFC VerifyOnly',
    ar: 'تحقق سلامة الملفات',
    shortEn: 'SFC Verify',
    shortAr: 'تحقق SFC',
    blurbEn: 'Verifies protected system files without repairing them. Elevation required.',
    blurbAr: 'يتحقق من ملفات النظام المحمية دون إصلاحها. يتطلب رفع صلاحيات.',
    risk: 'elevated-read-only',
    state: 'partial',
    provider: 'sfc.exe /verifyonly',
    accent: '#34d399',
    icon: FileCheck2,
  },
  {
    id: 'repair-files-repair',
    index: 5,
    en: 'SFC ScanNow',
    ar: 'إصلاح ملفات النظام',
    shortEn: 'SFC Repair',
    shortAr: 'إصلاح SFC',
    blurbEn: 'Repairs protected system files. Administrative execution is gated.',
    blurbAr: 'يصلح ملفات النظام المحمية. التنفيذ الإداري محجوب.',
    risk: 'administrative',
    state: 'gated',
    provider: 'sfc.exe /scannow',
    accent: '#fbbf24',
    icon: FileWarning,
  },
  {
    id: 'repair-dns-flush',
    index: 6,
    en: 'DNS Cache Refresh',
    ar: 'تحديث ذاكرة DNS',
    shortEn: 'Flush DNS',
    shortAr: 'مسح DNS',
    blurbEn: 'Counts the resolver cache without exposing domains; flushing is preview-only.',
    blurbAr: 'يعدّ ذاكرة المحلل دون كشف النطاقات؛ المسح معاينة فقط.',
    risk: 'administrative',
    state: 'gated',
    provider: 'ipconfig.exe /displaydns',
    accent: '#22d3ee',
    icon: Globe2,
  },
  {
    id: 'repair-winsock-reset',
    index: 7,
    en: 'Winsock Reset Review',
    ar: 'مراجعة إعادة Winsock',
    shortEn: 'Winsock',
    shortAr: 'Winsock',
    blurbEn: 'Reads the measured Winsock catalog. Reset requires elevation and a reboot.',
    blurbAr: 'يقرأ كتالوج Winsock المقيس. تتطلب الإعادة رفع صلاحيات وإعادة تشغيل.',
    risk: 'administrative',
    state: 'gated',
    provider: 'netsh.exe winsock show catalog',
    accent: '#fb7185',
    icon: Network,
  },
  {
    id: 'repair-tcpip-reset',
    index: 8,
    en: 'TCP/IP Reset Diff',
    ar: 'فرق إعادة TCP/IP',
    shortEn: 'TCP/IP',
    shortAr: 'TCP/IP',
    blurbEn: 'Compares measured adapter configuration with a Windows-default reset preview.',
    blurbAr: 'يقارن تهيئة المحول المقيسة مع معاينة إعادة إلى افتراضي Windows.',
    risk: 'administrative',
    state: 'gated',
    provider: 'Get-NetIPConfiguration',
    accent: '#60a5fa',
    icon: RefreshCw,
  },
  {
    id: 'repair-history',
    index: 9,
    en: 'Repair Audit Journal',
    ar: 'سجل تدقيق الإصلاح',
    shortEn: 'Journal',
    shortAr: 'السجل',
    blurbEn: 'Immutable previews and blocked attempts. Zero executed repairs.',
    blurbAr: 'معاينات ثابتة ومحاولات محجوبة. صفر إصلاحات منفذة.',
    risk: 'read-only',
    state: 'available',
    provider: 'Local append-only journal',
    accent: '#94a3b8',
    icon: History,
  },
  {
    id: 'repair-troubleshooters',
    index: 10,
    en: 'Troubleshooter Gateway',
    ar: 'بوابة مستكشفات الأعطال',
    shortEn: 'Troubleshooters',
    shortAr: 'مستكشفات الأعطال',
    blurbEn: 'Guided checklists and a fixed Windows settings handoff.',
    blurbAr: 'قوائم فحص موجهة وانتقال ثابت لإعدادات Windows.',
    risk: 'read-only',
    state: 'available',
    provider: 'Measured OS capability',
    accent: '#c084fc',
    icon: LifeBuoy,
  },
  {
    id: 'repair-restore-point',
    index: 11,
    en: 'System Restore Inspector',
    ar: 'فاحص نقاط الاستعادة',
    shortEn: 'Restore Points',
    shortAr: 'نقاط الاستعادة',
    blurbEn: 'Measured restore points when Windows grants access. Apply is gated.',
    blurbAr: 'نقاط استعادة مقيسة عندما يسمح Windows. التطبيق محجوب.',
    risk: 'administrative',
    state: 'partial',
    provider: 'Get-ComputerRestorePoint',
    accent: '#f472b6',
    icon: Clock3,
  },
  {
    id: 'repair-update-reset',
    index: 12,
    en: 'Windows Update Reset',
    ar: 'إعادة تهيئة Windows Update',
    shortEn: 'Update Reset',
    shortAr: 'إعادة التحديث',
    blurbEn: 'Measured update services and cache metadata; reset sequence is preview-only.',
    blurbAr: 'خدمات تحديث وبيانات ذاكرة مقيسة؛ تسلسل الإعادة معاينة فقط.',
    risk: 'administrative',
    state: 'gated',
    provider: 'Get-Service + SoftwareDistribution',
    accent: '#38bdf8',
    icon: RefreshCw,
  },
];

export const TOOL_BY_ID = Object.fromEntries(REPAIR_TOOLS.map((entry) => [entry.id, entry])) as Record<RepairToolId, RepairCatalogEntry>;
export const TOOL_IDS = REPAIR_TOOLS.map((entry) => entry.id);

export const GUIDED_STEPS = [
  { index: 1, en: 'Diagnose', ar: 'تشخيص', noteEn: 'Identify the failing component from measured evidence.', noteAr: 'حدد المكوّن المتعطل من الأدلة المقيسة.' },
  { index: 2, en: 'Inspect evidence', ar: 'فحص الأدلة', noteEn: 'Review logs, services and network state.', noteAr: 'راجع السجلات والخدمات وحالة الشبكة.' },
  { index: 3, en: 'Choose repair', ar: 'اختيار الإصلاح', noteEn: 'Select the exact fixed-argument tool.', noteAr: 'اختر الأداة ذات الوسائط الثابتة.' },
  { index: 4, en: 'Review impact', ar: 'مراجعة الأثر', noteEn: 'Read downtime, reboot and data effects.', noteAr: 'اقرأ آثار التوقف وإعادة التشغيل والبيانات.' },
  { index: 5, en: 'Confirm permission', ar: 'تأكيد الإذن', noteEn: 'Elevation is user-initiated; no silent UAC.', noteAr: 'رفع الصلاحيات يبدأه المستخدم؛ لا UAC صامت.' },
  { index: 6, en: 'Execute', ar: 'تنفيذ', noteEn: 'Not available in Mission 11 preview.', noteAr: 'غير متاح في معاينة المهمة 11.' },
  { index: 7, en: 'Verify result', ar: 'تحقق النتيجة', noteEn: 'No postcondition exists because nothing ran.', noteAr: 'لا يوجد تحقق لعدم تنفيذ شيء.' },
] as const;

export function isRepairToolId(value: string): value is RepairToolId {
  return Object.prototype.hasOwnProperty.call(TOOL_BY_ID, value);
}

export function toolLabel(id: RepairToolId, locale: RepairLocale): string {
  return locale === 'ar' ? TOOL_BY_ID[id].ar : TOOL_BY_ID[id].en;
}

export function toolShortLabel(id: RepairToolId, locale: RepairLocale): string {
  return locale === 'ar' ? TOOL_BY_ID[id].shortAr : TOOL_BY_ID[id].shortEn;
}

export const RISK_META: Record<RepairRisk, { en: string; ar: string; tone: 'good' | 'warn' | 'bad' }> = {
  'read-only': { en: 'Read-only', ar: 'للقراءة فقط', tone: 'good' },
  'elevated-read-only': { en: 'Elevated read-only', ar: 'قراءة تتطلب رفع صلاحيات', tone: 'warn' },
  administrative: { en: 'Administrative', ar: 'إداري', tone: 'bad' },
};

export const STATE_META: Record<RepairToolState, { en: string; ar: string; tone: 'good' | 'warn' | 'bad' }> = {
  available: { en: 'Available', ar: 'متاح', tone: 'good' },
  partial: { en: 'Partial', ar: 'جزئي', tone: 'warn' },
  gated: { en: 'Gated', ar: 'محمي', tone: 'bad' },
};
