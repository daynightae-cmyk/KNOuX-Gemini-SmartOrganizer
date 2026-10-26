/**
 * KNOuX Flow Studio - deterministic presentation helpers (Mission 13).
 */
import type {
  AutomationNode,
  AutomationNodeType,
  AutomationScheduleSpec,
  AutomationSnapshot,
  AutomationTemplate,
  AutomationTrigger,
  AutomationWorkflow,
} from '../../shared/native-contracts';
import { formatCount, formatTimestamp, t } from '../system/model';
import type { AutomationLocale } from './catalog';

export type { AutomationLocale } from './catalog';
export { formatCount, formatTimestamp, t };

export const NODE_TYPE_META: Record<AutomationNodeType, { en: string; ar: string; tone: 'good' | 'warn' | 'bad' | 'muted' | 'info' | 'violet' }> = {
  trigger: { en: 'Trigger', ar: 'محفز', tone: 'info' },
  condition: { en: 'Condition', ar: 'شرط', tone: 'warn' },
  action: { en: 'Action', ar: 'إجراء', tone: 'bad' },
  approval: { en: 'Approval', ar: 'موافقة', tone: 'violet' },
  report: { en: 'Report', ar: 'تقرير', tone: 'good' },
};

export const DAY_LABELS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
};

export const CHANNEL_LABELS: Record<string, { en: string; ar: string }> = {
  'in-app': { en: 'In-app banner', ar: 'شريط داخل التطبيق' },
  journal: { en: 'Journal entry', ar: 'مدخل السجل' },
  toast: { en: 'Transient toast', ar: 'إشعار عابر' },
};

export function workflowDraftFromTemplate(template: AutomationTemplate): AutomationWorkflow {
  const now = new Date().toISOString();
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    ...template.workflow,
    id: `wf-draft-${template.id.replace(/^tpl-/, '')}-${unique}`,
    version: 0,
    createdAt: now,
    updatedAt: now,
    enabled: false,
    nodes: template.workflow.nodes.map((node) => ({ ...node, config: { ...node.config } })),
    edges: template.workflow.edges.map((edge) => ({ ...edge })),
    trigger: { ...template.workflow.trigger, days: [...template.workflow.trigger.days], exclusions: [...template.workflow.trigger.exclusions] },
    quietHours: { ...template.workflow.quietHours, days: [...template.workflow.quietHours.days] },
    policy: { ...template.workflow.policy, notifyChannels: [...template.workflow.policy.notifyChannels] },
  } as AutomationWorkflow;
}

export function initialWorkflow(snapshot: AutomationSnapshot, preferredTemplateId?: string): AutomationWorkflow | null {
  if (snapshot.workflows.length) return cloneWorkflow(snapshot.workflows[0]);
  const template = snapshot.templates.find((entry) => entry.id === preferredTemplateId) || snapshot.templates[0];
  return template ? workflowDraftFromTemplate(template) : null;
}

export function cloneWorkflow(workflow: AutomationWorkflow): AutomationWorkflow {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) => ({ ...node, config: { ...node.config } })),
    edges: workflow.edges.map((edge) => ({ ...edge })),
    trigger: { ...workflow.trigger, days: [...workflow.trigger.days], exclusions: [...workflow.trigger.exclusions] },
    quietHours: { ...workflow.quietHours, days: [...workflow.quietHours.days] },
    policy: { ...workflow.policy, notifyChannels: [...workflow.policy.notifyChannels] },
  };
}

export function workflowNodeCount(workflow: AutomationWorkflow | null): number {
  return workflow?.nodes.length || 0;
}

export function workflowEdgeCount(workflow: AutomationWorkflow | null): number {
  return workflow?.edges.length || 0;
}

export function triggerLabel(workflow: AutomationWorkflow, locale: AutomationLocale): string {
  const trigger = workflow.trigger;
  if (trigger.type === 'manual') return t(locale, 'Manual only', 'يدوي فقط');
  if (trigger.type === 'startup') return t(locale, 'Startup metadata', 'بيانات بدء التشغيل');
  if (trigger.cadence === 'interval') return `${t(locale, 'Every', 'كل')} ${trigger.intervalHours} ${t(locale, 'hours', 'ساعة')}`;
  if (trigger.cadence === 'daily') return `${t(locale, 'Daily at', 'يوميًا عند')} ${trigger.time}`;
  const days = trigger.days.map((day) => DAY_LABELS[locale === 'ar' ? 'ar' : 'en'][day]).join(', ');
  return `${t(locale, 'Weekly', 'أسبوعيًا')} ${days} · ${trigger.time}`;
}

export function scheduleSpecFromWorkflow(workflow: AutomationWorkflow): AutomationScheduleSpec {
  return {
    cadence: workflow.trigger.cadence,
    time: workflow.trigger.time,
    days: [...workflow.trigger.days],
    intervalHours: workflow.trigger.intervalHours,
    timezone: workflow.trigger.timezone,
    exclusions: [...workflow.trigger.exclusions],
  };
}

export function scheduleSpecWith(spec: AutomationScheduleSpec, patch: Partial<AutomationScheduleSpec>): AutomationScheduleSpec {
  return { ...spec, ...patch, days: patch.days ? [...patch.days] : [...spec.days], exclusions: patch.exclusions ? [...patch.exclusions] : [...spec.exclusions] };
}

export function nextNodeId(workflow: AutomationWorkflow, type: AutomationNodeType): string {
  const base = type === 'trigger' ? 'trigger' : type;
  let index = 1;
  while (workflow.nodes.some((node) => node.id === `${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export function appendNode(workflow: AutomationWorkflow, node: AutomationNode): AutomationWorkflow {
  const last = workflow.nodes[workflow.nodes.length - 1];
  const edges = last && node.type !== 'trigger' ? [...workflow.edges, { from: last.id, to: node.id }] : workflow.edges;
  return { ...workflow, nodes: [...workflow.nodes, node], edges };
}

export function removeNode(workflow: AutomationWorkflow, nodeId: string): AutomationWorkflow {
  return {
    ...workflow,
    nodes: workflow.nodes.filter((node) => node.id !== nodeId),
    edges: workflow.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
  };
}

export function updateNode(workflow: AutomationWorkflow, nodeId: string, patch: Partial<AutomationNode>): AutomationWorkflow {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch, config: patch.config ? { ...patch.config } : node.config } : node)),
  };
}

export function nodeConfigValue(workflow: AutomationWorkflow, nodeId: string | null, key: string): string | number | boolean | string[] | null {
  const node = workflow.nodes.find((entry) => entry.id === nodeId);
  return node?.config[key] ?? null;
}

export function setNodeConfig(workflow: AutomationWorkflow, nodeId: string, key: string, value: string | number | boolean | string[] | null): AutomationWorkflow {
  const node = workflow.nodes.find((entry) => entry.id === nodeId);
  if (!node) return workflow;
  return updateNode(workflow, nodeId, { config: { ...node.config, [key]: value } });
}

export function ageDays(value: string, now = Date.now()): number {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((now - time) / 86400000));
}

export function journalWithinRetention<T extends { at: string }>(entries: T[], days: number): { retained: T[]; aged: T[] } {
  const now = Date.now();
  const retained: T[] = [];
  const aged: T[] = [];
  for (const entry of entries) {
    if (ageDays(entry.at, now) <= days) retained.push(entry);
    else aged.push(entry);
  }
  return { retained, aged };
}

export function workflowStatusLabel(workflow: AutomationWorkflow | null, locale: AutomationLocale): string {
  if (!workflow) return t(locale, 'No workflow loaded', 'لا سير عمل محمّل');
  if (!workflow.enabled) return t(locale, 'Draft · disabled metadata', 'مسودة · بيانات معطلة');
  return t(locale, 'Scheduled metadata · not executed', 'بيانات جدولة · غير منفذ');
}

export function scheduleLabel(spec: AutomationScheduleSpec | null, locale: AutomationLocale): string {
  if (!spec) return '—';
  if (spec.cadence === 'interval') return `${t(locale, 'Every', 'كل')} ${spec.intervalHours}h`;
  if (spec.cadence === 'daily') return `${t(locale, 'Daily', 'يوميًا')} ${spec.time}`;
  return `${t(locale, 'Weekly', 'أسبوعيًا')} ${spec.time}`;
}

/**
 * Descriptive recurrence expression derived from the typed trigger. It is
 * shown for review only; the native provider validates typed recurrence and
 * never parses arbitrary cron input. Interval schedules are not cron.
 */
export function recurrenceExpression(trigger: AutomationTrigger): string {
  if (trigger.type === 'manual') return 'manual';
  if (trigger.type === 'startup') return 'startup-event';
  if (trigger.cadence === 'interval') return `every ${trigger.intervalHours}h`;
  const [hour, minute] = trigger.time.split(':').map(Number);
  if (trigger.cadence === 'daily') return `${minute} ${hour} * * *`;
  const days = trigger.days.length ? [...trigger.days].sort((a, b) => a - b).join(',') : '*';
  return `${minute} ${hour} * * ${days}`;
}

export type AutomationCategory = 'general' | 'scan' | 'cleanup' | 'system' | 'notifications' | 'backup';

/** Category derived from the tools bound to a draft; never stored separately. */
export function workflowCategory(workflow: AutomationWorkflow): AutomationCategory {
  const tools = new Set(workflow.nodes.map((node) => node.toolId));
  if (tools.has('auto-cleanup-plan')) return 'cleanup';
  if (tools.has('auto-backup-plan')) return 'backup';
  if (tools.has('auto-notify') || tools.has('auto-quiet-hours')) return 'notifications';
  if (tools.has('auto-battery-policy') || tools.has('auto-retention') || tools.has('auto-export')) return 'system';
  if (tools.has('auto-smart-scan')) return 'scan';
  return 'general';
}

export const CATEGORY_LABELS: Record<AutomationCategory, { en: string; ar: string }> = {
  general: { en: 'General', ar: 'عام' },
  scan: { en: 'Scan', ar: 'فحص' },
  cleanup: { en: 'Cleanup', ar: 'تنظيف' },
  system: { en: 'System', ar: 'نظام' },
  notifications: { en: 'Notifications', ar: 'إشعارات' },
  backup: { en: 'Backup', ar: 'نسخ احتياطي' },
};
