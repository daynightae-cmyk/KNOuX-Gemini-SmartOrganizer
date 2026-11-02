import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { toBreakdown } from '../../src/smart-scan/model';
import type { ScanSession } from '../../shared/native-contracts';

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
