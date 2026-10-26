/**
 * KNOuX Recovery Lab - deterministic renderer contract checks (Mission 11).
 * No Windows call is made. These checks keep the 12 descriptors, 12
 * workbenches, risk vocabulary and unknown-value rendering aligned.
 */
import { GUIDED_STEPS, REPAIR_TOOLS, RISK_META, STATE_META, TOOL_BY_ID, TOOL_IDS, toolLabel } from '../../repair/catalog';
import { REPAIR_WORKBENCH_IDS } from '../../repair/RepairServiceWorkspaces';
import { journalFilter, journalTitle, planForTool, restoreStatusMeta, stageMeta, t } from '../../repair/model';
import type { RepairJournalEntry, RepairPlan } from '../../../shared/native-contracts';

export interface RepairTestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const EXPECTED_IDS = [
  'repair-component-check',
  'repair-component-scan',
  'repair-component-restore',
  'repair-files-verify',
  'repair-files-repair',
  'repair-dns-flush',
  'repair-winsock-reset',
  'repair-tcpip-reset',
  'repair-history',
  'repair-troubleshooters',
  'repair-restore-point',
  'repair-update-reset',
];

function check(name: string, run: () => boolean | string): RepairTestResult {
  try {
    const result = run();
    if (typeof result === 'string') return { name, passed: false, message: result };
    return { name, passed: result };
  } catch (error) {
    return { name, passed: false, message: String(error) };
  }
}

export function runRepairVerificationSuite(): RepairTestResult[] {
  const results: RepairTestResult[] = [];
  results.push(check('12 unique repair descriptors in canonical order', () => {
    if (REPAIR_TOOLS.length !== 12) return `expected 12, received ${REPAIR_TOOLS.length}`;
    if (new Set(TOOL_IDS).size !== 12) return 'duplicate repair id';
    if (TOOL_IDS.join('|') !== EXPECTED_IDS.join('|')) return 'catalog order or ids changed';
    return true;
  }));
  results.push(check('every descriptor maps to one specialised workbench', () => {
    if (REPAIR_WORKBENCH_IDS.length !== 12) return `workbench map has ${REPAIR_WORKBENCH_IDS.length}`;
    const missing = TOOL_IDS.filter((id) => !REPAIR_WORKBENCH_IDS.includes(id));
    if (missing.length) return `missing workbenches: ${missing.join(', ')}`;
    return true;
  }));
  results.push(check('risk and state vocabulary is complete', () => {
    for (const risk of ['read-only', 'elevated-read-only', 'administrative'] as const) {
      if (!RISK_META[risk].en || !RISK_META[risk].ar) return `risk ${risk} lacks a bilingual label`;
    }
    for (const state of ['available', 'partial', 'gated'] as const) {
      if (!STATE_META[state].en || !STATE_META[state].ar) return `state ${state} lacks a bilingual label`;
    }
    if (REPAIR_TOOLS.filter((entry) => entry.risk === 'administrative').length < 6) return 'administrative tools are under-declared';
    return true;
  }));
  results.push(check('seven guided steps end in a blocked execution', () => {
    if (GUIDED_STEPS.length !== 7) return `expected 7 steps, received ${GUIDED_STEPS.length}`;
    if (GUIDED_STEPS[5].en !== 'Execute' || GUIDED_STEPS[6].en !== 'Verify result') return 'execution steps changed';
    return true;
  }));
  results.push(check('status helpers never claim completion for an absent stage', () => {
    if (stageMeta('pending').tone !== 'muted') return 'pending is not muted';
    if (stageMeta('unavailable').tone !== 'bad') return 'unavailable is not bad';
    if (restoreStatusMeta('permission_denied').tone !== 'warn') return 'denied restore access is not warned';
    return true;
  }));
  results.push(check('journal filtering is deterministic', () => {
    const entries = [
      { id: 'a', at: '2026-01-01T00:00:00.000Z', kind: 'preview', title: 'alpha', summary: 'preview one', toolIds: ['repair-dns-flush'], risk: 'administrative', elevationRequired: false, rebootRequired: false, receipt: 'plan:1', readOnly: true, mutation: 'none' },
      { id: 'b', at: '2026-01-02T00:00:00.000Z', kind: 'preview', title: 'beta', summary: 'preview two', toolIds: ['repair-files-verify'], risk: 'elevated-read-only', elevationRequired: true, rebootRequired: false, receipt: 'plan:2', readOnly: true, mutation: 'none' },
    ] as RepairJournalEntry[];
    if (journalFilter(entries, '', 'all').length !== 2) return 'all filter failed';
    if (journalFilter(entries, '', 'repair-dns-flush').length !== 1) return 'tool filter failed';
    if (journalFilter(entries, 'two', 'all').length !== 1) return 'query filter failed';
    if (!journalTitle(entries[0], 'en').toLowerCase().includes('dns')) return 'journal title failed';
    return true;
  }));
  results.push(check('plan lookup is scoped to one tool', () => {
    const plan = {
      items: [
        { toolId: 'repair-dns-flush', id: 'item-a' },
        { toolId: 'repair-files-verify', id: 'item-b' },
      ],
    } as unknown as RepairPlan;
    const found = planForTool(plan, 'repair-files-verify');
    return found && found.id === 'item-b' ? true : 'wrong plan item selected';
  }));
  results.push(check('bilingual catalog and translation stay intact', () => {
    for (const entry of REPAIR_TOOLS) {
      if (!entry.en || !entry.ar || !entry.blurbAr) return `${entry.id} lacks a bilingual label`;
    }
    if (t('ar', 'Read-only', 'للقراءة فقط') !== 'للقراءة فقط') return 'Arabic translation failed';
    if (toolLabel('repair-dns-flush', 'en') !== 'DNS Cache Refresh') return 'English tool label changed';
    return true;
  }));
  results.push(check('history is read-only and execution is absent', () => {
    const history = TOOL_BY_ID['repair-history'];
    if (history.risk !== 'read-only') return 'history is not read-only';
    for (const id of TOOL_IDS) {
      if (TOOL_BY_ID[id].state === 'available' && TOOL_BY_ID[id].risk === 'administrative') return `${id} is falsely available`;
    }
    return true;
  }));
  return results;
}
