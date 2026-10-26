/**
 * KNOuX Service Commander - deterministic renderer checks (Mission 12).
 * No Windows SCM call is made.
 */
import { RISK_META, SERVICES_TOOL_IDS, SERVICES_TOOLS, STATE_META, TOOL_BY_ID, toolLabel } from '../../services/catalog';
import { SERVICES_WORKBENCH_IDS } from '../../services/ServicesServiceWorkspaces';
import {
  DEFAULT_FILTERS,
  dependencyImpact,
  eventMatchesService,
  filterServices,
  planForService,
  protectionRoleLabel,
  startupMeta,
  t,
} from '../../services/model';
import type { ServiceOperationPlan, ServiceRecord, ServicesSnapshot } from '../../../shared/native-contracts';

export interface ServicesTestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const EXPECTED_IDS = [
  'services-inventory',
  'services-control',
  'services-undo',
  'services-dependencies',
  'services-protected',
  'services-search',
  'services-startup-report',
  'services-state-history',
  'services-dependents',
  'services-diagnose',
  'services-config',
  'services-perf',
];

function check(name: string, run: () => boolean | string): ServicesTestResult {
  try {
    const result = run();
    if (typeof result === 'string') return { name, passed: false, message: result };
    return { name, passed: result };
  } catch (error) {
    return { name, passed: false, message: String(error) };
  }
}

const service = (overrides: Partial<ServiceRecord>): ServiceRecord => ({
  name: 'TestSvc',
  displayName: 'Test Service',
  description: 'fixture description',
  state: 'Running',
  startupType: 'automatic',
  delayedAuto: false,
  account: 'LocalSystem',
  pid: 100,
  binaryPath: 'C:\\Windows\\System32\\test.exe',
  serviceType: 'Win32OwnProcess',
  acceptsStop: true,
  dependencies: [],
  dependents: [],
  protected: false,
  protectionRole: null,
  protectionReason: null,
  controllable: true,
  source: 'Win32_Service',
  ...overrides,
});

export function runServicesVerificationSuite(): ServicesTestResult[] {
  const results: ServicesTestResult[] = [];
  results.push(check('12 unique service tools in canonical order', () => {
    if (SERVICES_TOOLS.length !== 12) return `expected 12, received ${SERVICES_TOOLS.length}`;
    if (new Set(SERVICES_TOOL_IDS).size !== 12) return 'duplicate tool id';
    if (SERVICES_TOOL_IDS.join('|') !== EXPECTED_IDS.join('|')) return 'tool order or ids changed';
    return true;
  }));
  results.push(check('every service tool resolves to one specialised workbench', () => {
    if (SERVICES_WORKBENCH_IDS.length !== 12) return `workbench map has ${SERVICES_WORKBENCH_IDS.length}`;
    const missing = SERVICES_TOOL_IDS.filter((id) => !SERVICES_WORKBENCH_IDS.includes(id));
    if (missing.length) return `missing workbenches: ${missing.join(', ')}`;
    return true;
  }));
  results.push(check('risk/state vocabulary and Arabic labels stay intact', () => {
    for (const state of ['available', 'partial', 'gated'] as const) {
      if (!STATE_META[state].en || !STATE_META[state].ar) return `state ${state} lacks bilingual text`;
    }
    for (const risk of ['read-only', 'staged-change'] as const) {
      if (!RISK_META[risk].en || !RISK_META[risk].ar) return `risk ${risk} lacks bilingual text`;
    }
    for (const entry of SERVICES_TOOLS) {
      if (!/[\u0600-\u06FF]/.test(entry.ar) || !/[\u0600-\u06FF]/.test(entry.blurbAr)) return `${entry.id} lacks Arabic text`;
    }
    return toolLabel('services-inventory', 'en') === 'SCM Service Register';
  }));
  results.push(check('service filters are deterministic', () => {
    const records = [
      service({ name: 'RpcSs', state: 'Running', startupType: 'automatic', account: 'LocalSystem' }),
      service({ name: 'Spooler', state: 'Running', startupType: 'manual', account: 'LocalSystem' }),
      service({ name: 'TestSvc', state: 'Stopped', startupType: 'manual', account: 'NT AUTHORITY\\LocalService' }),
    ];
    if (filterServices(records, { ...DEFAULT_FILTERS, state: 'running' }).length !== 2) return 'state filter failed';
    if (filterServices(records, { ...DEFAULT_FILTERS, startup: 'manual' }).length !== 2) return 'startup filter failed';
    if (filterServices(records, { ...DEFAULT_FILTERS, account: 'user' }).length !== 1) return 'account filter failed';
    if (filterServices(records, { ...DEFAULT_FILTERS, query: 'spool' }).length !== 1) return 'query filter failed';
    return true;
  }));
  results.push(check('startup labels distinguish delayed automatic', () => {
    if (startupMeta('automatic', true, 'en').label !== 'Automatic (delayed)') return 'delayed label changed';
    if (startupMeta('disabled', false, 'ar').label !== 'معطل') return 'Arabic disabled label changed';
    return true;
  }));
  results.push(check('dependency impact walks the measured cascade', () => {
    const records = [
      service({ name: 'RpcSs', dependents: ['Spooler', 'TestSvc'] }),
      service({ name: 'Spooler', dependents: ['AppSvc'], state: 'Running' }),
      service({ name: 'TestSvc', state: 'Running' }),
      service({ name: 'AppSvc', state: 'Stopped' }),
    ];
    const snapshot = { services: records } as unknown as ServicesSnapshot;
    const impact = dependencyImpact(snapshot, records[0]);
    if (impact.cascadeDependents.length !== 3) return `cascade ${impact.cascadeDependents.length}`;
    if (!impact.cascadeDependents.includes('AppSvc')) return 'indirect dependent missing';
    return true;
  }));
  results.push(check('plan lookup is scoped to the selected service', () => {
    const plan = { item: { serviceName: 'Spooler' } } as unknown as ServiceOperationPlan;
    if (!planForService(plan, 'spooler')) return 'case-insensitive plan lookup failed';
    if (planForService(plan, 'RpcSs')) return 'wrong plan selected';
    return true;
  }));
  results.push(check('SCM events match by name, display name or message', () => {
    const record = service({ name: 'Spooler', displayName: 'Print Spooler' });
    const event = { id: 'e', at: null, eventId: 7036, level: 4, provider: 'Service Control Manager', serviceName: null, message: 'The Print Spooler service entered the running state.', source: 'System' };
    if (!eventMatchesService(event, record)) return 'message match failed';
    if (eventMatchesService({ ...event, message: 'unrelated' }, record)) return 'false positive event match';
    return true;
  }));
  results.push(check('protection role labels are bilingual', () => {
    if (!protectionRoleLabel('security', 'ar').includes('أمن')) return 'security role Arabic label changed';
    if (protectionRoleLabel(null, 'en') !== 'Unprotected') return 'unprotected label changed';
    return true;
  }));
  results.push(check('translation and history are read-only', () => {
    if (t('ar', 'Read-only', 'للقراءة فقط') !== 'للقراءة فقط') return 'translation failed';
    const history = TOOL_BY_ID['services-state-history'];
    if (history.risk !== 'read-only') return 'state history is not read-only';
    const control = TOOL_BY_ID['services-control'];
    if (control.risk !== 'staged-change') return 'control is not staged-change';
    return true;
  }));
  return results;
}
