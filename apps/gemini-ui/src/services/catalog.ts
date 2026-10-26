/**
 * KNOuX Service Commander - canonical tool catalog (Mission 12).
 * Presentation metadata only; every service and operation value is measured.
 */
import {
  Activity,
  BarChart3,
  GitBranch,
  GitFork,
  History,
  List,
  PlayCircle,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Undo2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { ServicesToolId } from '../../shared/native-contracts';

export type ServicesLocale = 'en' | 'ar';

export interface ServicesCatalogEntry {
  id: ServicesToolId;
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

export const SERVICES_TOOLS: ServicesCatalogEntry[] = [
  { id: 'services-inventory', index: 1, en: 'SCM Service Register', ar: 'سجل خدمات SCM', shortEn: 'Register', shortAr: 'السجل', blurbEn: 'Dense measured service register and read-only SCM dossier.', blurbAr: 'سجل خدمات مقيس ومكثف وملف SCM للقراءة فقط.', state: 'available', risk: 'read-only', provider: 'Win32_Service', accent: '#22d3ee', icon: List },
  { id: 'services-control', index: 2, en: 'State Change Review', ar: 'مراجعة تغيير الحالة', shortEn: 'Control', shortAr: 'التحكم', blurbEn: 'Start, stop and restart previews with protected/dependency guards.', blurbAr: 'معاينات البدء والإيقاف وإعادة التشغيل مع حماية الاعتماديات.', state: 'gated', risk: 'staged-change', provider: 'Win32_Service + dependency graph', accent: '#f472b6', icon: PlayCircle },
  { id: 'services-undo', index: 3, en: 'Startup Policy Journal', ar: 'سجل سياسة البدء', shortEn: 'Undo', shortAr: 'الاستعادة', blurbEn: 'Immutable preview journal; no executed policy change exists.', blurbAr: 'سجل معاينات ثابت؛ لا يوجد تغيير سياسة منفذ.', state: 'gated', risk: 'staged-change', provider: 'Local preview journal', accent: '#a78bfa', icon: Undo2 },
  { id: 'services-dependencies', index: 4, en: 'Dependency Network', ar: 'شبكة الاعتماديات', shortEn: 'Graph', shortAr: 'الرسم', blurbEn: 'Directed measured edges with selected-service inspector.', blurbAr: 'حواف مقيسة موجهة مع فاحص الخدمة المحددة.', state: 'available', risk: 'read-only', provider: 'Win32_Service.Dependencies', accent: '#818cf8', icon: GitBranch },
  { id: 'services-protected', index: 5, en: 'Protected Core Atlas', ar: 'أطلس الخدمات المحمية', shortEn: 'Protected', shortAr: 'المحمية', blurbEn: 'Role, driver and stoppability policy with denied-operation context.', blurbAr: 'سياسة الدور والتعريف وقابلية الإيقاف مع سياق العمليات المرفوضة.', state: 'available', risk: 'read-only', provider: 'Capability protection policy', accent: '#fb7185', icon: ShieldAlert },
  { id: 'services-search', index: 6, en: 'SCM Query Console', ar: 'وحدة استعلام SCM', shortEn: 'Search', shortAr: 'البحث', blurbEn: 'Keyboard-first measured query with status/account/startup filters.', blurbAr: 'استعلام مقيس يبدأ بلوحة المفاتيح مع مرشحات الحالة والحساب والبدء.', state: 'available', risk: 'read-only', provider: 'Win32_Service', accent: '#38bdf8', icon: Search },
  { id: 'services-startup-report', index: 7, en: 'Startup Policy Analytics', ar: 'تحليلات سياسة البدء', shortEn: 'Policies', shortAr: 'السياسات', blurbEn: 'Measured automatic/manual/disabled/delayed distribution.', blurbAr: 'توزيع مقيس للتلقائي واليدوي والمعطل والمؤجل.', state: 'available', risk: 'read-only', provider: 'Win32_Service.StartMode', accent: '#34d399', icon: BarChart3 },
  { id: 'services-state-history', index: 8, en: 'Transition History', ar: 'تاريخ التحولات', shortEn: 'History', shortAr: 'التاريخ', blurbEn: 'Bounded SCM events for the last seven days when access is granted.', blurbAr: 'أحداث SCM محدودة لآخر سبعة أيام عند منح الوصول.', state: 'partial', risk: 'read-only', provider: 'Service Control Manager event log', accent: '#fbbf24', icon: History },
  { id: 'services-dependents', index: 9, en: 'Cascade Impact Tree', ar: 'شجرة الأثر المتسلسل', shortEn: 'Cascade', shortAr: 'التسلسل', blurbEn: 'Direct and indirect dependents computed from measured edges.', blurbAr: 'تبعيات مباشرة وغير مباشرة محسوبة من الحواف المقيسة.', state: 'available', risk: 'read-only', provider: 'Computed reverse dependency edges', accent: '#c084fc', icon: GitFork },
  { id: 'services-diagnose', index: 10, en: 'SCM Fault Diagnostics', ar: 'تشخيص أعطال SCM', shortEn: 'Diagnose', shortAr: 'التشخيص', blurbEn: 'Measured SCM excerpts and a safe checklist; no repair is run.', blurbAr: 'مقتطفات SCM مقيسة وقائمة آمنة؛ لا يُنفذ إصلاح.', state: 'partial', risk: 'read-only', provider: 'Service Control Manager event log', accent: '#f97316', icon: Wrench },
  { id: 'services-config', index: 11, en: 'Startup Policy Diff', ar: 'فرق سياسة البدء', shortEn: 'Config', shortAr: 'الإعداد', blurbEn: 'Current vs proposed startup policy preview; no write exists.', blurbAr: 'معاينة السياسة الحالية مقابل المقترحة؛ لا توجد كتابة.', state: 'gated', risk: 'staged-change', provider: 'Win32_Service.StartMode', accent: '#60a5fa', icon: SlidersHorizontal },
  { id: 'services-perf', index: 12, en: 'svchost Shared Host Monitor', ar: 'مراقب svchost المشترك', shortEn: 'svchost', shortAr: 'svchost', blurbEn: 'Service-to-PID crosslinks and shared-host working sets.', blurbAr: 'روابط الخدمة إلى PID ومجموعات عمل المضيف المشترك.', state: 'available', risk: 'read-only', provider: 'Win32_Service.ProcessId + Win32_Process', accent: '#fbbf24', icon: Activity },
];

export const TOOL_BY_ID = Object.fromEntries(SERVICES_TOOLS.map((entry) => [entry.id, entry])) as Record<ServicesToolId, ServicesCatalogEntry>;
export const SERVICES_TOOL_IDS = SERVICES_TOOLS.map((entry) => entry.id);
export const SERVICE_TOOL_IDS = SERVICES_TOOL_IDS;

export const STATE_META = {
  available: { en: 'Available', ar: 'متاح', tone: 'good' as const },
  partial: { en: 'Partial', ar: 'جزئي', tone: 'warn' as const },
  gated: { en: 'Gated', ar: 'محمي', tone: 'bad' as const },
};

export const RISK_META = {
  'read-only': { en: 'Read-only', ar: 'للقراءة فقط', tone: 'good' as const },
  'staged-change': { en: 'Preview only', ar: 'معاينة فقط', tone: 'warn' as const },
};

export function toolLabel(id: ServicesToolId, locale: ServicesLocale): string {
  return locale === 'ar' ? TOOL_BY_ID[id].ar : TOOL_BY_ID[id].en;
}

export function toolShortLabel(id: ServicesToolId, locale: ServicesLocale): string {
  return locale === 'ar' ? TOOL_BY_ID[id].shortAr : TOOL_BY_ID[id].shortEn;
}
