/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BOOT_EVENT_META,
  DEFAULT_FILTERS,
  ENTRY_SOURCES,
  PLAN_MODE_META,
  SERVICE_ACCENTS,
  SERVICE_FALLBACK_META,
  SERVICE_IDS,
  SERVICE_STARTUP_META,
  SIGNATURE_META,
  SOURCE_META,
  STATE_META,
  bootEventLabel,
  filterEntries,
  formatCount,
  formatDelay,
  formatTimestamp,
  formatUptime,
  planModeLabel,
  serviceStateLabel,
  sourceCounts,
  sourceLabel,
  stateLabel,
  t,
  visibleServices,
  visibleTasks,
} from '../../startup/model';
import type { StartupEntry, StartupServiceEntry, StartupTaskEntry } from '../../../shared/native-contracts';

export interface StartupTestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const ARABIC = /[\u0600-\u06FF]/;

/**
 * Pure-function checks for the Boot Control presentation model.
 *
 * No screenshot number is asserted: every count, timestamp and boot event shown
 * by Mission 09 is measured by the native coordinator at runtime. The synthetic
 * entries below only exercise deterministic filtering and aggregation and never
 * reach a production surface.
 */
export function runStartupVerificationSuite(): StartupTestResult[] {
  const results: StartupTestResult[] = [];
  const check = (name: string, run: () => boolean, pass: string, fail: string) => {
    try {
      const passed = run();
      results.push({ name, passed, message: passed ? pass : fail });
    } catch (error) {
      results.push({ name, passed: false, message: String(error) });
    }
  };

  check(
    'Boot Control service catalog matches the native contract (12 services)',
    () =>
      SERVICE_IDS.length === 12 &&
      new Set(SERVICE_IDS).size === 12 &&
      SERVICE_IDS.every((id) => Boolean(SERVICE_ACCENTS[id]) && Boolean(SERVICE_FALLBACK_META[id])),
    '12 unique service IDs with accent and fallback metadata',
    'Service catalog is incomplete or duplicated'
  );

  check(
    'Boot Control bilingual metadata contains real Arabic',
    () =>
      Object.values(SOURCE_META).every((meta) => ARABIC.test(meta.ar)) &&
      Object.values(SIGNATURE_META).every((meta) => ARABIC.test(meta.ar)) &&
      Object.values(STATE_META).every((meta) => ARABIC.test(meta.ar)) &&
      Object.values(SERVICE_STARTUP_META).every((meta) => ARABIC.test(meta.ar)) &&
      Object.values(BOOT_EVENT_META).every((meta) => ARABIC.test(meta.ar)) &&
      Object.values(PLAN_MODE_META).every((meta) => ARABIC.test(meta.ar)) &&
      Object.values(SERVICE_FALLBACK_META).every((meta) => ARABIC.test(meta.titleAr) && ARABIC.test(meta.descAr)) &&
      sourceLabel('registry-run', 'ar') === 'تسجيل Run' &&
      stateLabel('disabled', 'ar') === 'معطّل' &&
      serviceStateLabel('gated', 'ar') === 'محجوب' &&
      t('ar', 'Measured', 'مقيس') === 'مقيس',
    'Arabic labels are authored, not placeholder characters',
    'Arabic metadata is missing or corrupted'
  );

  check(
    'Boot Control formatting is deterministic and never invents values',
    () =>
      formatCount(null) === '—' &&
      formatCount(0) === '0' &&
      formatCount(2841) === '2,841' &&
      formatUptime(null) === '—' &&
      formatUptime(3725) === '1h 2m' &&
      formatUptime(90061) === '1d 1h' &&
      formatDelay(null, 'en') === 'Not published' &&
      formatDelay(750, 'en') === '750 ms' &&
      formatDelay(30000, 'en') === '30 s' &&
      formatTimestamp(null, 'en') === '—' &&
      formatTimestamp('not-a-date', 'en') === '—' &&
      bootEventLabel(101, 'en') === 'Slow startup' &&
      bootEventLabel(999, 'en') === 'Boot event 999',
    'Formatting matches the measured display contract',
    'Formatting drifted from the display contract'
  );

  check(
    'Boot Control plan and service states stay declared gates',
    () =>
      planModeLabel('disable', 'en') === 'Disable review' &&
      planModeLabel('rollback', 'ar') === 'مراجعة التراجع' &&
      serviceStateLabel('available', 'en') === 'Available' &&
      serviceStateLabel('partial', 'en') === 'Partial' &&
      serviceStateLabel('gated', 'en') === 'Gated' &&
      SERVICE_STARTUP_META.automatic.tone === 'warn' &&
      SERVICE_STARTUP_META.delayed.tone === 'good' &&
      SERVICE_STARTUP_META.disabled.tone === 'bad',
    'Every mutation family is represented as reviewed, partial or gated',
    'A service state or plan mode lost its honest gate'
  );

  const synthetic: StartupEntry[] = [
    {
      id: 'st:aaaaaaaaaaaaaaaaaaaaaaaa',
      name: 'Alpha Sync Agent',
      sourceKind: 'registry-run',
      scope: 'user',
      location: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      command: '"C:\\Apps\\alpha.exe" --background',
      args: '--background',
      executable: 'C:\\Apps\\alpha.exe',
      publisher: 'Alpha Software Ltd',
      signature: 'valid',
      state: 'enabled',
      approvedState: 'enabled',
      protection: 'standard',
      protectionReason: null,
      elevationRequired: false,
      active: true,
      description: 'synthetic',
      triggers: [],
      taskState: null,
      taskPath: null,
      nextRunAt: null,
      lastRunAt: null,
      userId: null,
      runLevel: null,
      evidence: ['synthetic'],
    },
    {
      id: 'task:bbbbbbbbbbbbbbbbbbbbbbbb',
      name: 'Beta Maintenance Task',
      sourceKind: 'scheduled-task',
      scope: 'machine',
      location: '\\Microsoft\\Windows\\Beta\\Maintenance',
      command: 'C:\\Windows\\System32\\beta.exe',
      args: null,
      executable: 'C:\\Windows\\System32\\beta.exe',
      publisher: null,
      signature: 'unsigned',
      state: 'disabled',
      approvedState: 'disabled',
      protection: 'protected',
      protectionReason: 'Microsoft maintenance task',
      elevationRequired: true,
      active: false,
      description: 'synthetic',
      triggers: ['At logon'],
      taskState: 'Disabled',
      taskPath: '\\Microsoft\\Windows\\Beta\\',
      nextRunAt: '2026-11-01T06:00:00.000Z',
      lastRunAt: '2026-10-01T06:00:00.000Z',
      userId: 'SYSTEM',
      runLevel: 'Highest',
      evidence: ['synthetic'],
    },
  ];

  check(
    'Boot Control register filtering and aggregation stay pure',
    () => {
      const all = filterEntries(synthetic, DEFAULT_FILTERS);
      const byQuery = filterEntries(synthetic, { ...DEFAULT_FILTERS, query: 'alpha' });
      const byProtected = filterEntries(synthetic, { ...DEFAULT_FILTERS, prevention: 'protected' });
      const byUnsigned = filterEntries(synthetic, { ...DEFAULT_FILTERS, signature: 'unsigned' });
      const bySource = filterEntries(synthetic, { ...DEFAULT_FILTERS, source: 'scheduled-task' });
      const counts = sourceCounts(synthetic);
      return (
        all.map((entry) => entry.name).join('|') === 'Beta Maintenance Task|Alpha Sync Agent' &&
        byQuery.length === 1 &&
        byQuery[0].id === synthetic[0].id &&
        byProtected.length === 1 &&
        byProtected[0].id === synthetic[1].id &&
        byUnsigned.length === 1 &&
        bySource.length === 1 &&
        counts.all === 2 &&
        counts['registry-run'] === 1 &&
        counts['scheduled-task'] === 1 &&
        counts['startup-folder'] === 0 &&
        ENTRY_SOURCES.length === 4
      );
    },
    'Filters, source counts and stable ordering are deterministic',
    'Register aggregation produced unexpected output'
  );

  const services: StartupServiceEntry[] = [
    {
      id: 'svc:cccccccccccccccccccccccc',
      name: 'AlphaSvc',
      displayName: 'Alpha Background Service',
      state: 'Running',
      startupType: 'automatic',
      delayedAuto: false,
      account: 'LocalSystem',
      binaryPath: 'C:\\Windows\\System32\\svchost.exe -k alpha',
      running: true,
      processId: 1234,
      protected: false,
      protectionReason: null,
      evidence: ['synthetic'],
    },
  ];

  const tasks: StartupTaskEntry[] = [
    {
      id: 'task:dddddddddddddddddddddddd',
      name: 'Delta Logon Helper',
      path: '\\Microsoft\\Windows\\Delta\\',
      state: 'Ready',
      author: 'Delta Software',
      userId: 'SYSTEM',
      runLevel: 'Highest',
      triggers: ['At logon'],
      nextRunAt: '2026-11-01T06:00:00.000Z',
      lastRunAt: '2026-10-01T06:00:00.000Z',
      execute: 'C:\\Windows\\System32\\delta.exe',
      args: null,
      protected: false,
      protectionReason: null,
    },
  ];

  check(
    'Boot Control service and logon-task search is read-only and bounded',
    () =>
      visibleServices(services, '').length === 1 &&
      visibleServices(services, 'alpha background').length === 1 &&
      visibleServices(services, 'nomatch').length === 0 &&
      visibleTasks(tasks, '').length === 1 &&
      visibleTasks(tasks, 'delta software').length === 1 &&
      visibleTasks(tasks, 'nomatch').length === 0,
    'Service and task filters search measured fields only',
    'Service or task filtering produced unexpected output'
  );

  return results;
}
