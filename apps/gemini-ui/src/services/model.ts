/**
 * KNOuX Service Commander - deterministic presentation helpers (Mission 12).
 */
import type {
  ServiceAction,
  ServiceDependencyImpact,
  ServiceEventRecord,
  ServiceOperationPlan,
  ServiceRecord,
  ServiceSvchostGroup,
  ServicesSnapshot,
} from '../../shared/native-contracts';
import { formatBytes, formatCount, formatTimestamp, t } from '../system/model';
import type { ServicesLocale as Locale } from './catalog';

export type { ServicesLocale } from './catalog';
export { formatBytes, formatCount, formatTimestamp, t };

export function stateTone(state: string | null): 'good' | 'warn' | 'bad' | 'muted' | 'info' {
  const normalized = String(state || '').toLowerCase();
  if (normalized === 'running') return 'good';
  if (normalized === 'stopped') return 'warn';
  if (normalized === 'paused' || normalized === 'start pending' || normalized === 'stop pending') return 'info';
  return 'muted';
}

export function startupMeta(type: string | null, delayed: boolean | null, locale: Locale): { label: string; tone: 'good' | 'warn' | 'bad' | 'muted' | 'info' } {
  if (delayed) return { label: locale === 'ar' ? 'تلقائي مؤجل' : 'Automatic (delayed)', tone: 'info' };
  if (type === 'automatic') return { label: locale === 'ar' ? 'تلقائي' : 'Automatic', tone: 'good' };
  if (type === 'manual') return { label: locale === 'ar' ? 'يدوي' : 'Manual', tone: 'warn' };
  if (type === 'disabled') return { label: locale === 'ar' ? 'معطل' : 'Disabled', tone: 'bad' };
  return { label: locale === 'ar' ? 'غير معروف' : 'Unknown', tone: 'muted' };
}

export function protectionRoleLabel(role: string | null, locale: Locale): string {
  const map: Record<string, { en: string; ar: string }> = {
    security: { en: 'Security core', ar: 'أمن النظام' },
    rpc: { en: 'RPC core', ar: 'نواة RPC' },
    networking: { en: 'Networking base', ar: 'أساس الشبكة' },
    servicing: { en: 'Servicing stack', ar: 'مكدس الخدمة' },
    system: { en: 'System core', ar: 'نواة النظام' },
    audio: { en: 'Audio core', ar: 'نواة الصوت' },
    'kernel-driver': { en: 'Kernel driver', ar: 'تعريف نواة' },
    'non-stoppable': { en: 'Non-stoppable', ar: 'غير قابل للإيقاف' },
  };
  if (!role) return locale === 'ar' ? 'غير محمي' : 'Unprotected';
  return map[role]?.[locale === 'ar' ? 'ar' : 'en'] || role;
}

export function actionLabel(action: ServiceAction, locale: Locale): string {
  const map: Record<ServiceAction, { en: string; ar: string }> = {
    start: { en: 'Start', ar: 'بدء' },
    stop: { en: 'Stop', ar: 'إيقاف' },
    restart: { en: 'Restart', ar: 'إعادة تشغيل' },
    'startup-type': { en: 'Startup policy', ar: 'سياسة البدء' },
  };
  return map[action][locale === 'ar' ? 'ar' : 'en'];
}

export interface ServiceFilters {
  query: string;
  state: 'all' | 'running' | 'stopped';
  startup: 'all' | 'automatic' | 'manual' | 'disabled';
  account: 'all' | 'system' | 'user';
  protectedOnly: boolean;
}

export const DEFAULT_FILTERS: ServiceFilters = {
  query: '',
  state: 'all',
  startup: 'all',
  account: 'all',
  protectedOnly: false,
};

export function filterServices(services: ServiceRecord[], filters: ServiceFilters): ServiceRecord[] {
  const needle = filters.query.trim().toLowerCase();
  return services.filter((service) => {
    if (filters.protectedOnly && !service.protected) return false;
    if (filters.state !== 'all' && String(service.state).toLowerCase() !== filters.state) return false;
    if (filters.startup !== 'all' && service.startupType !== filters.startup) return false;
    if (filters.account === 'system' && !/localsystem|local system/i.test(service.account || '')) return false;
    if (filters.account === 'user' && /localsystem|local system|localservice|networkservice/i.test(service.account || '')) return false;
    if (!needle) return true;
    return `${service.name} ${service.displayName || ''} ${service.description || ''} ${service.account || ''} ${service.binaryPath || ''}`.toLowerCase().includes(needle);
  });
}

export function serviceByName(snapshot: ServicesSnapshot | null, name: string | null): ServiceRecord | null {
  if (!snapshot || !name) return null;
  return snapshot.services.find((service) => service.name.toLowerCase() === name.toLowerCase()) || null;
}

export function planForService(plan: ServiceOperationPlan | null, name: string | null): ServiceOperationPlan | null {
  if (!plan || !name) return null;
  return plan.item.serviceName.toLowerCase() === name.toLowerCase() ? plan : null;
}

export function dependencyImpact(snapshot: ServicesSnapshot, service: ServiceRecord): ServiceDependencyImpact {
  const byName = new Map(snapshot.services.map((entry) => [entry.name.toLowerCase(), entry]));
  const cascade: string[] = [];
  const queue = [...service.dependents];
  const seen = new Set<string>();
  while (queue.length) {
    const next = queue.shift();
    if (!next || seen.has(next)) continue;
    seen.add(next);
    cascade.push(next);
    const node = byName.get(next.toLowerCase());
    if (node) queue.push(...node.dependents);
  }
  return {
    directDependents: [...service.dependents],
    cascadeDependents: cascade,
    runningDependents: cascade.filter((name) => String(byName.get(name.toLowerCase())?.state).toLowerCase() === 'running'),
    protectedDependents: cascade.filter((name) => byName.get(name.toLowerCase())?.protected === true),
    upstream: [...service.dependencies],
  };
}

export function eventMatchesService(event: ServiceEventRecord, service: ServiceRecord | null): boolean {
  if (!service) return true;
  if (event.serviceName && event.serviceName.toLowerCase() === service.name.toLowerCase()) return true;
  const message = event.message.toLowerCase();
  return message.includes(service.name.toLowerCase()) || (service.displayName ? message.includes(service.displayName.toLowerCase()) : false);
}

export function eventLevelMeta(level: number | null): { en: string; ar: string; tone: 'good' | 'warn' | 'bad' | 'muted' | 'info'; short: string } {
  if (level === 1) return { en: 'Critical', ar: 'حرج', tone: 'bad', short: 'CRT' };
  if (level === 2) return { en: 'Error', ar: 'خطأ', tone: 'bad', short: 'ERR' };
  if (level === 3) return { en: 'Warning', ar: 'تحذير', tone: 'warn', short: 'WRN' };
  if (level === 4) return { en: 'Information', ar: 'معلومات', tone: 'info', short: 'INF' };
  return { en: 'Unknown', ar: 'مجهول', tone: 'muted', short: 'UNK' };
}

export function svchostLabel(group: ServiceSvchostGroup, locale: Locale): string {
  return `svchost.exe · PID ${group.pid}${group.group ? ` · ${group.group}` : ''}`;
}

export function percentOf(value: number, total: number): number {
  if (!total) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

export function planConflictsLabel(plan: ServiceOperationPlan | null, locale: Locale): string {
  if (!plan) return t(locale, 'No operation preview staged.', 'لا توجد معاينة عملية مُهيَّأة.');
  if (!plan.item.conflicts.length) return t(locale, 'No measured conflict.', 'لا تعارض مقيس.');
  return plan.item.conflicts.join(' · ');
}
