import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { toBreakdown, toRecentScans } from '../../src/smart-scan/model';
import type { ScanSession, ScanSummary } from '../../shared/native-contracts';

const { ScanBridge } = createRequire(import.meta.url)('../../electron/native/scan-bridge.cjs');

test('native low-space and system-pressure groups retain distinct identities and measurements', () => {
  // Disposable synthetic findings; the production grouping and adapter are real.
  const breakdown = ScanBridge.prototype.buildBreakdown([
    { kind: 'low-space', bytes: 42 },
    { kind: 'memory-pressure', bytes: 0 },
    { kind: 'cpu-load', bytes: 0 },
    { kind: 'startup-item', bytes: 0 },
  ]);
  const rows = toBreakdown({ breakdown } as ScanSession);
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
  assert.deepEqual(rows, breakdown);
  assert.equal(rows.reduce((sum, row) => sum + row.count, 0), 4);
  assert.equal(rows.reduce((sum, row) => sum + row.percentage, 0), 100);
  assert.equal(toBreakdown(null).length, 0);
});

test('every retained native session remains reachable, including older and cancelled records', () => {
  const history = Array.from({ length: 20 }, (_, i) => ({
    id: `test-history-${i}`, mode: 'service', sourceLabel: 'Disposable test source',
    status: i === 19 ? 'cancelled' : 'partial', filesIndexed: i,
    findingsCount: i, finishedAt: '2026-11-02T00:00:00.000Z',
  } as ScanSummary));
  const shown = toRecentScans(history);
  assert.deepEqual(shown.map(row => row.id), history.map(row => row.id));
  assert.equal(shown.at(-1)?.status, 'cancelled');
  assert.equal(shown.at(-1)?.filesIndexed, 19);
  assert.deepEqual(toRecentScans([]), []);
});
