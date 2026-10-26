/**
 * KNOuX Flow Studio - deterministic renderer checks (Mission 13).
 * No Windows call, workflow execution or scheduler timer is involved.
 */
import { AUTOMATION_TOOL_IDS, AUTOMATION_TOOLS, RISK_META, STATE_META, TOOL_BY_ID, toolLabel } from '../../automation/catalog';
import { AUTOMATION_WORKBENCH_IDS } from '../../automation/AutomationServiceWorkspaces';
import {
  NODE_TYPE_META,
  appendNode,
  cloneWorkflow,
  initialWorkflow,
  journalWithinRetention,
  nextNodeId,
  removeNode,
  scheduleSpecFromWorkflow,
  triggerLabel,
  workflowDraftFromTemplate,
  workflowNodeCount,
  t,
} from '../../automation/model';
import type { AutomationSnapshot, AutomationTemplate } from '../../../shared/native-contracts';

export interface AutomationTestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const EXPECTED_IDS = [
  'auto-smart-scan',
  'auto-schedule-manager',
  'auto-run-history',
  'auto-templates',
  'auto-schedule-plan',
  'auto-cleanup-plan',
  'auto-notify',
  'auto-quiet-hours',
  'auto-battery-policy',
  'auto-retention',
  'auto-export',
  'auto-backup-plan',
];

function check(name: string, run: () => boolean | string): AutomationTestResult {
  try {
    const result = run();
    if (typeof result === 'string') return { name, passed: false, message: result };
    return { name, passed: result };
  } catch (error) {
    return { name, passed: false, message: String(error) };
  }
}

const template: AutomationTemplate = {
  id: 'tpl-test',
  category: 'test',
  labelEn: 'Test Template',
  labelAr: 'قالب اختبار',
  blurbEn: 'Test',
  blurbAr: 'اختبار',
  prerequisitesEn: ['none'],
  prerequisitesAr: ['لا شيء'],
  workflow: {
    name: 'Test Workflow',
    schemaVersion: '1.0',
    enabled: false,
    trigger: { type: 'schedule', cadence: 'weekly', time: '09:00', days: [1], intervalHours: 24, timezone: 'local', exclusions: [] },
    quietHours: { enabled: true, start: '22:00', end: '07:00', days: [0, 1, 2, 3, 4, 5, 6], weekendRule: 'mute' },
    policy: { requireApproval: true, batteryThreshold: 20, acOnly: false, retentionDays: 30, notifyChannels: ['in-app'], severity: 'warning' },
    nodes: [
      { id: 'trigger-1', type: 'trigger', label: 'Trigger', toolId: 'platform', config: {} },
      { id: 'action-1', type: 'action', label: 'Action', toolId: 'auto-smart-scan', config: {} },
    ],
    edges: [{ from: 'trigger-1', to: 'action-1' }],
    mutation: 'none',
    execution: 'not-implemented',
  },
};

export function runAutomationVerificationSuite(): AutomationTestResult[] {
  const results: AutomationTestResult[] = [];
  results.push(check('12 automation tools in canonical order', () => {
    if (AUTOMATION_TOOLS.length !== 12) return `expected 12, received ${AUTOMATION_TOOLS.length}`;
    if (new Set(AUTOMATION_TOOL_IDS).size !== 12) return 'duplicate tool id';
    if (AUTOMATION_TOOL_IDS.join('|') !== EXPECTED_IDS.join('|')) return 'tool order or ids changed';
    return true;
  }));
  results.push(check('every automation tool resolves to one workbench', () => {
    if (AUTOMATION_WORKBENCH_IDS.length !== 12) return `workbench map has ${AUTOMATION_WORKBENCH_IDS.length}`;
    const missing = AUTOMATION_TOOL_IDS.filter((id) => !AUTOMATION_WORKBENCH_IDS.includes(id));
    if (missing.length) return `missing workbenches: ${missing.join(', ')}`;
    return true;
  }));
  results.push(check('node, state and risk vocabularies are complete', () => {
    for (const type of ['trigger', 'condition', 'action', 'approval', 'report'] as const) {
      if (!NODE_TYPE_META[type].en || !NODE_TYPE_META[type].ar) return `node ${type} lacks bilingual text`;
    }
    for (const state of ['available', 'partial', 'gated'] as const) {
      if (!STATE_META[state].en || !STATE_META[state].ar) return `state ${state} lacks bilingual text`;
    }
    for (const risk of ['read-only', 'staged-change'] as const) {
      if (!RISK_META[risk].en || !RISK_META[risk].ar) return `risk ${risk} lacks bilingual text`;
    }
    if (toolLabel('auto-smart-scan', 'en') !== 'Scheduled Smart Scan') return 'English tool label changed';
    return true;
  }));
  results.push(check('template instantiation is an isolated deep draft', () => {
    const first = workflowDraftFromTemplate(template);
    const second = workflowDraftFromTemplate(template);
    if (first.id === second.id) return 'draft ids must be unique';
    first.nodes[0].label = 'Changed';
    if (second.nodes[0].label === 'Changed') return 'draft node objects are shared';
    if (first.version !== 0 || first.execution !== 'not-implemented') return 'draft metadata is wrong';
    return true;
  }));
  results.push(check('node append/remove updates edges deterministically', () => {
    const draft = workflowDraftFromTemplate(template);
    const id = nextNodeId(draft, 'report');
    const next = appendNode(draft, { id, type: 'report', label: 'Report', toolId: 'auto-export', config: {} });
    if (next.nodes.length !== 3 || !next.edges.some((edge) => edge.to === id)) return 'append failed';
    const removed = removeNode(next, id);
    if (removed.nodes.length !== 2 || removed.edges.some((edge) => edge.from === id || edge.to === id)) return 'remove failed';
    return true;
  }));
  results.push(check('cloning a workflow does not share arrays', () => {
    const draft = workflowDraftFromTemplate(template);
    const copy = cloneWorkflow(draft);
    copy.trigger.days.push(5);
    if (draft.trigger.days.includes(5)) return 'trigger days shared';
    copy.policy.notifyChannels.push('journal');
    if (draft.policy.notifyChannels.includes('journal')) return 'channels shared';
    return true;
  }));
  results.push(check('schedule metadata keeps weekly days', () => {
    const draft = workflowDraftFromTemplate(template);
    const spec = scheduleSpecFromWorkflow(draft);
    if (spec.days.join(',') !== '1') return 'days changed';
    if (!triggerLabel(draft, 'en').includes('Mon')) return 'weekly label missing day';
    if (workflowNodeCount(draft) !== 2) return 'node count wrong';
    return true;
  }));
  results.push(check('initial workflow prefers saved drafts over templates', () => {
    const saved = workflowDraftFromTemplate(template);
    const snapshot = { workflows: [saved], templates: [template] } as unknown as AutomationSnapshot;
    const initial = initialWorkflow(snapshot);
    if (!initial || initial.id !== saved.id) return 'saved workflow not selected';
    const templatesOnly = { workflows: [], templates: [template] } as unknown as AutomationSnapshot;
    const fromTemplate = initialWorkflow(templatesOnly);
    if (!fromTemplate || fromTemplate.version !== 0) return 'template draft not selected';
    return true;
  }));
  results.push(check('retention splits aged records without deleting', () => {
    const old = { at: '2020-01-01T00:00:00.000Z' };
    const fresh = { at: new Date().toISOString() };
    const result = journalWithinRetention([old, fresh], 30);
    if (result.aged.length !== 1 || result.retained.length !== 1) return 'retention split failed';
    if (!/[\u0600-\u06FF]/.test(t('ar', 'Read-only', 'للقراءة فقط'))) return 'Arabic label failed';
    return true;
  }));
  results.push(check('templates and execution policy stay explicit', () => {
    for (const entry of AUTOMATION_TOOLS) {
      const tool = TOOL_BY_ID[entry.id];
      if (tool.state === 'available' && tool.id !== 'auto-run-history' && tool.id !== 'auto-templates' && tool.id !== 'auto-schedule-plan' && tool.id !== 'auto-export') {
        return `${entry.id} is falsely available`;
      }
    }
    return true;
  }));
  return results;
}
