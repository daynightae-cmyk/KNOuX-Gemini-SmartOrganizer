'use strict';

/**
 * KNOuX Gemini - Home Command Center live-data regression test (Mission 01).
 *
 * Static guarantees plus the Electron smoke proof. No user path, fabricated KPI,
 * fake recent activity or fixture reclaimable total is allowed back into Home.
 */

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const appRoot = path.join(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), 'utf8');
const homePage = read('src/pages/HomePage.tsx');
const commandCenter = read('src/components/home/HomeCommandCenter.tsx');
const dashboard = read('src/components/home/HomeDashboardPanels.tsx');
const homeUi = read('src/lib/home-ui.ts');
const live = read('src/home/live.ts');
const derive = read('src/home/derive.ts');
const failures = [];

function check(name, run) {
  try {
    run();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push({ name, message: String(error?.message || error) });
    console.log(`  ✗ ${name}: ${error?.message || error}`);
  }
}

console.log('[home-live-test]');

check('Home retains local measured aggregation and mounts approved composition', () => {
  assert.match(homePage, /useHomeLive\(\)/);
  assert.match(homePage, /<ApprovedHomeScreen/);
  const screen=read('src/components/home/ApprovedHomeScreen.tsx');
  assert.match(screen, /deriveActivities\(live\)/);
  assert.match(screen, /deriveVolumes\(live\)/);
  assert.match(screen, /data-testid="home-workspace"/);
  // This used to assert `useState(false)` — the "Reference sample" toggle that
  // switched Home onto fabricated numbers. Owner directive 2026-11-02 correction
  // 6 removes QA-only controls from the product surface, and correction 2 forbids
  // fabricated metrics, so the contract is now the opposite: the sample switch
  // must not exist, and neither must the code paths that held invented values.
  assert.doesNotMatch(screen, /Reference sample|setSample\(|sampleFindings|sampleCategories|sampleInsights/);
  assert.doesNotMatch(screen, /home-qa-toolbar/);
  // The approved reference's bands, in the reference's order.
  for (const band of ['home-hero', 'home-kpis', 'home-deck-grid', 'home-lower', 'home-rail']) {
    assert.ok(screen.includes(band), `missing approved band ${band}`);
  }
  // Count inside the declared arrays only: the orbital instrument reuses the
  // same destination ids as the deck, so a whole-file match over-counts.
  const arrayOf = (name) => {
    const start = screen.indexOf(`const ${name} = [`);
    assert.notEqual(start, -1, `missing the ${name} array`);
    const end = screen.indexOf('] as const;', start);
    assert.notEqual(end, -1, `unterminated ${name} array`);
    return screen.slice(start, end).split("id: '").length - 1;
  };
  assert.equal(arrayOf('deck'), 8, "the command deck must carry the reference's eight tiles");
  const kpiBlock = screen.slice(screen.indexOf('const kpis = ['), screen.indexOf('];', screen.indexOf('const kpis = [')));
  assert.equal(kpiBlock.split("id: '").length - 1, 6, "the KPI strip must carry the reference's six cards");
});

check('the live hook reads only existing measured bridges', () => {
  for (const call of ['readSystemSummary', 'readServicesSummary', 'listFilesSources', 'queryFilesInventory', 'loadScanHistory', 'loadAppsInventory', 'loadAutomationWorkflows', 'loadAutomationJournal']) {
    assert.ok(live.includes(call), `missing ${call}`);
  }
  assert.ok(!/INITIAL_|SAMPLE_|fixture/i.test(live), 'live hook must not use fixtures');
});

check('all obsolete Home fixture totals are removed', () => {
  for (const fixture of ['INITIAL_KPIS', 'INITIAL_INSIGHT', 'INITIAL_ACTIVITIES', 'INITIAL_QUICK_ACCESS', 'INITIAL_STORAGE_VOLUMES', 'INITIAL_SAFE_ACTIONS']) {
    assert.ok(!homeUi.includes(fixture), `${fixture} must be deleted`);
    assert.ok(!dashboard.includes(fixture), `${fixture} must not be imported`);
  }
  for (const fake of ['1,248,632', '48.6 GB', 'C:\\\\Users\\\\Alex', 'Microsoft Edge updated', 'Organized 842 files', 'Windows Update Cache:', 'Orphaned Application Residue', '241 / 271']) {
    assert.ok(!homePage.includes(fake) && !dashboard.includes(fake) && !homeUi.includes(fake), `fake Home value remains: ${fake}`);
  }
});

check('KPI cards expose measured values and no decorative fake trend', () => {
  assert.match(commandCenter, /kpis\?: KpiMetric\[\]/);
  assert.match(commandCenter, /data-testid={`home-kpi-\$\{kpi.id\}`}/);
  assert.match(commandCenter, /data-testid={`home-kpi-\$\{kpi.id\}-value`}/);
  assert.ok(!/Sparkline curve or 7 vertical microbars/.test(commandCenter), 'decorative sparkline block must be gone');
  assert.match(commandCenter, /No fabricated trend/);
  assert.match(commandCenter, /home-live-status/);
});

check('system overview uses current native samples, not a fake timeline', () => {
  assert.match(dashboard, /home-system-live/);
  assert.match(dashboard, /systemMetrics\.cpuPercent|systemMetrics\?\.cpuPercent/);
  assert.match(dashboard, /No unmeasured historical series/);
  assert.ok(!/Apr 2[0-9]|32\.4 GB|16\.2 GB/.test(dashboard), 'fake chart/tooltip values must be gone');
  assert.match(dashboard, /home-system-storage/);
  assert.match(dashboard, /home-system-apps/);
});

check('storage, quick access and activity render only measured props', () => {
  assert.match(dashboard, /volumes: volumesProp = \[\]/);
  assert.match(dashboard, /data-testid={`home-volume-\$\{index\}`}/);
  assert.match(dashboard, /quickAccess: quickAccessProp = \[\]/);
  assert.match(dashboard, /data-testid="home-quick-row"/);
  assert.match(dashboard, /activities: activitiesProp = \[\]/);
  assert.match(dashboard, /data-testid="home-activity-row"/);
  assert.match(dashboard, /No verified activity yet/);
});

check('pending actions are review-only and never claim execution from Home', () => {
  assert.match(dashboard, /Review selected in Cleanup/);
  assert.match(dashboard, /execution requires approval inside the owning service/);
  assert.ok(!/Apply Selected Actions/.test(dashboard), 'Apply from Home must be removed');
  assert.match(derive, /Review only · no automatic deletion/);
});

check('Home insight is measured or explicitly unmeasured', () => {
  assert.match(derive, /No verified cleanup estimate yet/);
  assert.match(derive, /Verified reclaimable candidates/);
  assert.match(dashboard, /No unmeasured category breakdown/);
  assert.ok(!/Safety check passed|Zero risk/.test(dashboard), 'fake safety guarantee must be gone');
});

check('the command palette distinguishes measured inventory search from command execution', () => {
  assert.match(homePage, /Search workspaces, measured apps or indexed files/);
  assert.match(homePage, /searchHomeInventory/);
  assert.match(homePage, /No files opened or apps launched/);
  assert.match(homePage, /setQuery\(e.target.value\)/);
  assert.ok(!/Search for files, applications, settings, or run a command/.test(homePage + commandCenter), 'misleading global file search must be gone');
});

const result = { ok: failures.length === 0, checks: 10, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
console.log('[home-live-test] PASS');
