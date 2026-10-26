/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CATEGORY_META,
  DEFAULT_FILTERS,
  PLAN_MODE_META,
  SERVICE_ACCENTS,
  SERVICE_FALLBACK_META,
  SERVICE_IDS,
  categoryBytes,
  categoryCounts,
  filterCandidates,
  formatBytes,
  formatCount,
  planModeLabel,
  serviceStateLabel,
} from '../../cleanup/model';
import type { CleanupCandidate } from '../../../shared/native-contracts';

export interface CleanupTestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const ARABIC = /[\u0600-\u06FF]/;

/**
 * Pure-function checks for the Clean Room presentation model.
 *
 * These tests never assert screenshot numbers: every byte, count and candidate
 * shown by Mission 08 is measured by the native coordinator at runtime. The
 * synthetic candidates below exist only to exercise deterministic sorting and
 * aggregation logic, and never reach production surfaces.
 */
export function runCleanupVerificationSuite(): CleanupTestResult[] {
  const results: CleanupTestResult[] = [];
  const check = (name: string, run: () => boolean, pass: string, fail: string) => {
    try {
      const passed = run();
      results.push({ name, passed, message: passed ? pass : fail });
    } catch (error) {
      results.push({ name, passed: false, message: String(error) });
    }
  };

  check(
    'Clean Room service catalog matches the native contract (12 services)',
    () =>
      SERVICE_IDS.length === 12 &&
      new Set(SERVICE_IDS).size === 12 &&
      SERVICE_IDS.every((id) => Boolean(SERVICE_ACCENTS[id]) && Boolean(SERVICE_FALLBACK_META[id])),
    '12 unique service IDs with accent and fallback metadata',
    'Service catalog is incomplete or duplicated'
  );

  check(
    'Clean Room bilingual metadata contains real Arabic',
    () =>
      Object.values(CATEGORY_META).every((meta) => ARABIC.test(meta.ar)) &&
      Object.values(PLAN_MODE_META).every((meta) => ARABIC.test(meta.ar)) &&
      Object.values(SERVICE_FALLBACK_META).every((meta) => ARABIC.test(meta.titleAr) && ARABIC.test(meta.descAr)) &&
      serviceStateLabel('gated', 'ar') === 'محجوب' &&
      planModeLabel('quarantine', 'ar') === 'تهيئة الحجر',
    'Arabic labels are authored, not placeholder characters',
    'Arabic metadata is missing or corrupted'
  );

  check(
    'Clean Room byte and count formatting is deterministic',
    () =>
      formatBytes(null) === '—' &&
      formatBytes(0) === '0 B' &&
      formatBytes(1536) === '1.50 KB' &&
      formatBytes(1024 * 1024 * 1024 * 2.5) === '2.50 GB' &&
      formatCount(null) === '—' &&
      formatCount(24893) === '24,893',
    'Formatting matches the measured display contract',
    'Formatting drifted from the display contract'
  );

  const synthetic: CleanupCandidate[] = [
    {
      id: 'cln:aaaaaaaaaaaaaaaaaaaaaaaa',
      name: 'Alpha temporary pool',
      path: 'C:\\Windows\\Temp',
      category: 'temp',
      source: 'temp',
      safety: 'eligible',
      risk: 'low',
      sizeBytes: 2048,
      fileCount: 4,
      folderCount: 1,
      modifiedAt: '2026-10-01T10:00:00.000Z',
      ageDays: 25,
      reasons: ['fixture'],
      action: 'Quarantine',
      permission: 'Standard user',
      recoverable: 'Yes',
      provider: 'CleanupBridge',
      active: false,
      virtual: true,
      evidence: ['synthetic'],
    },
    {
      id: 'cln:bbbbbbbbbbbbbbbbbbbbbbbb',
      name: 'Beta log archive',
      path: 'C:\\ProgramData\\logs',
      category: 'logs',
      source: 'logs',
      safety: 'review',
      risk: 'medium',
      sizeBytes: 4096,
      fileCount: 2,
      folderCount: 0,
      modifiedAt: '2026-09-01T10:00:00.000Z',
      ageDays: 55,
      reasons: ['fixture'],
      action: 'Review',
      permission: 'Standard user',
      recoverable: 'Yes',
      provider: 'CleanupBridge',
      active: false,
      virtual: true,
      evidence: ['synthetic'],
    },
  ];

  check(
    'Clean Room register filtering and aggregation stay pure',
    () => {
      const bySize = filterCandidates(synthetic, DEFAULT_FILTERS);
      const byQuery = filterCandidates(synthetic, { ...DEFAULT_FILTERS, query: 'beta' });
      const counts = categoryCounts(synthetic);
      const bytes = categoryBytes(synthetic);
      const temp = bytes.find((entry) => entry.key === 'temp');
      const logs = bytes.find((entry) => entry.key === 'logs');
      return (
        bySize.map((item) => item.name).join('|') === 'Beta log archive|Alpha temporary pool' &&
        byQuery.length === 1 &&
        byQuery[0].id === synthetic[1].id &&
        counts.all === 2 &&
        counts.temp === 1 &&
        counts.logs === 1 &&
        temp?.bytes === 2048 &&
        logs?.bytes === 4096
      );
    },
    'Filters, counts and byte aggregation are deterministic',
    'Register aggregation produced unexpected output'
  );

  return results;
}
