/**
 * KNOuX Live Pulse - deterministic renderer contract checks (Mission 10).
 *
 * These checks never call Windows. They prove that the 36-service catalog and
 * the 36-workbench map stay aligned, that gated services are declared gated,
 * and that missing readings render as unknown instead of zero.
 */
import {
  SERVICE_CATALOG,
  SERVICE_IDS,
  WORLD_SERVICES,
  WORLDS,
  SERVICE_BY_ID,
} from '../../system/catalog';
import { SYSTEM_WORKBENCH_IDS } from '../../system/SystemServiceWorkspaces';
import {
  averageOf,
  eventLevelMeta,
  formatBytes,
  formatClock,
  formatDuration,
  formatMHz,
  formatPercent,
  formatRate,
  latestOf,
  maxOf,
  metricValues,
  sparkGeometry,
  signatureMeta,
  sortProcesses,
  t,
} from '../../system/model';

export interface SystemTestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const EXPECTED_IDS = [
  'system-health-check', 'system-events', 'system-processes', 'system-signatures',
  'system-uptime', 'system-perf', 'system-drivers', 'system-logs', 'system-resources',
  'system-autostart', 'system-services-map', 'system-timeline',
  'network-interfaces', 'network-dns-config', 'network-adapters', 'network-connectivity',
  'network-throughput', 'network-traceroute', 'network-topology', 'network-ports',
  'network-wifi', 'network-hosts', 'network-proxies', 'network-repair-link',
  'hardware-inventory', 'hardware-battery', 'hardware-cpu', 'hardware-gpu',
  'hardware-memory', 'hardware-cycles', 'hardware-thermal', 'hardware-disks',
  'hardware-usb', 'hardware-display', 'hardware-audio', 'hardware-health-report',
];

function check(name: string, run: () => boolean | string): SystemTestResult {
  try {
    const result = run();
    if (typeof result === 'string') return { name, passed: false, message: result };
    return { name, passed: result };
  } catch (error) {
    return { name, passed: false, message: String(error) };
  }
}

export function runSystemVerificationSuite(): SystemTestResult[] {
  const results: SystemTestResult[] = [];

  results.push(check('36 unique service descriptors across three worlds', () => {
    if (SERVICE_CATALOG.length !== 36) return `expected 36, received ${SERVICE_CATALOG.length}`;
    if (new Set(SERVICE_IDS).size !== 36) return 'duplicate service id';
    if (SERVICE_IDS.join('|') !== EXPECTED_IDS.join('|')) return 'catalog order or ids changed';
    if (WORLDS.length !== 3) return 'world count is not three';
    for (const world of WORLDS) {
      if (WORLD_SERVICES[world].length !== 12) return `${world} has ${WORLD_SERVICES[world].length} services`;
    }
    return true;
  }));

  results.push(check('every descriptor resolves to one specialised workbench', () => {
    if (SYSTEM_WORKBENCH_IDS.length !== 36) return `workbench map has ${SYSTEM_WORKBENCH_IDS.length}`;
    const missing = SERVICE_IDS.filter((id) => !SYSTEM_WORKBENCH_IDS.includes(id));
    if (missing.length) return `missing workbenches: ${missing.join(', ')}`;
    const extra = SYSTEM_WORKBENCH_IDS.filter((id) => !SERVICE_BY_ID[id]);
    if (extra.length) return `unregistered workbenches: ${extra.join(', ')}`;
    return true;
  }));

  results.push(check('mutation-capable services remain explicitly gated', () => {
    const gated = SERVICE_CATALOG.filter((entry) => entry.state === 'gated').map((entry) => entry.id);
    return gated.length === 2 && gated.includes('network-hosts') && gated.includes('network-repair-link')
      ? true
      : `unexpected gated set: ${gated.join(', ')}`;
  }));

  results.push(check('missing readings stay unknown, never zero', () => {
    const values = [
      formatBytes(null),
      formatPercent(null),
      formatRate(null),
      formatMHz(null),
      formatDuration(null),
      formatClock(null),
    ];
    if (values.some((value) => value !== '-')) return `expected six dashes, received ${values.join('|')}`;
    if (formatClock(null) !== '--:--:--') return 'clock placeholder changed';
    if (formatBytes(0) !== '0 B') return 'a measured zero must render as zero';
    return true;
  }));

  results.push(check('sparkline geometry preserves gaps and refuses invented points', () => {
    const single = sparkGeometry([42]);
    if (single.line || single.points.length) return 'a single sample must not draw a line';
    const empty = sparkGeometry([]);
    if (empty.line) return 'empty series drew a line';
    const gapped = sparkGeometry([10, null, 20, 30]);
    if (!gapped.line || gapped.points.length !== 3) return 'gapped series geometry is wrong';
    return true;
  }));

  results.push(check('series statistics ignore unknown samples', () => {
    if (maxOf([null, 4, 9, null]) !== 9) return 'peak mismatch';
    if (latestOf([4, null, 7, null]) !== 7) return 'latest mismatch';
    if (averageOf([null, 2, 4, null]) !== 3) return 'average mismatch';
    const metrics = metricValues([{ cpuPercent: 5 } as never, { cpuPercent: null } as never], 'cpuPercent');
    if (metrics[0] !== 5 || metrics[1] !== null) return 'metric projection mismatch';
    return true;
  }));

  results.push(check('process sorting is deterministic and direction-aware', () => {
    const rows = [
      { pid: 2, name: 'beta', cpuPercent: 20, workingSetBytes: 10, threads: 2 },
      { pid: 1, name: 'alpha', cpuPercent: 5, workingSetBytes: 20, threads: 1 },
      { pid: 3, name: 'gamma', cpuPercent: 10, workingSetBytes: 5, threads: 3 },
    ] as never[];
    const byCpu = sortProcesses(rows, 'cpu', 'desc').map((row) => row.pid);
    if (byCpu.join(',') !== '2,3,1') return `cpu sort ${byCpu.join(',')}`;
    const byName = sortProcesses(rows, 'name', 'asc').map((row) => row.pid);
    if (byName.join(',') !== '1,2,3') return `name sort ${byName.join(',')}`;
    return true;
  }));

  results.push(check('severity and signature vocabulary stays honest', () => {
    if (eventLevelMeta(null).short !== 'UNK') return 'unknown severity is not UNK';
    if (eventLevelMeta(2).short !== 'ERR') return 'error severity changed';
    if (signatureMeta(null).tone !== 'muted') return 'unknown signature is not muted';
    if (signatureMeta('NotSigned').tone !== 'bad') return 'unsigned signature is not bad';
    return true;
  }));

  results.push(check('Arabic and English labels are both present', () => {
    for (const entry of SERVICE_CATALOG) {
      if (!entry.en || !entry.ar || !entry.shortEn || !entry.shortAr) return `${entry.id} lacks a bilingual label`;
    }
    if (t('ar', 'Measured', 'مقيس') !== 'مقيس') return 'Arabic translation failed';
    if (t('en', 'Measured', 'مقيس') !== 'Measured') return 'English translation failed';
    return true;
  }));

  return results;
}
