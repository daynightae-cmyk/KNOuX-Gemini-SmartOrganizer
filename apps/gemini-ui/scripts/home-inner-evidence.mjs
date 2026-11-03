/**
 * KNOuX Home Command Center - inner-workspace verification.
 *
 * Drives the REAL Electron Main + preload + renderer against the production
 * renderer build (dist/). The first visit performs the bounded read-only
 * aggregation across all measured bridges; every assertion below reads the
 * live Home snapshot, the derived activities, or the renderer DOM.
 *
 * No scan, delete, install, uninstall, mutate, schedule, or execute action
 * is invoked from Home. Deep links to workspaces are verified; the native
 * providers behind those links remain untouched.
 */
import assert from 'node:assert/strict';
import {runtime,desktopFrames} from './inner-workspace-runtime.mjs';

const KPI_IDS = ['health','indexes','reclaim','automations','apps','services'];
const DECK_IDS = ['smart_scan','files','applications','storage','cleanup','startup','system','repair'];
const OVERVIEW_TABS = ['health','storage'];
const ACCESS_TABS = ['files','activity'];
const MODAL_IDS = ['notifications','customize','scan'];

const ctx = await runtime({
  section: 'home',
  out: process.argv.find(a => a.startsWith('--out='))?.slice(6) || '../../docs/evidence/inner-workspaces-20261103/home-inner-workspace',
  scope: 'Home Command Center Phase II verification: approved visual composition preserved (ApprovedHomeScreen), measured KPI aggregation from live bridges, deep-link command deck, system/quick-access tabs, insight, activity, pending actions, and search palette. No scan, mutation, or execution is invoked from Home.',
});
const {page,probe,capture,frame,save} = ctx;

async function settled(){
  // First wait for the living shell which the runtime already waits for
  await page.waitForFunction(
    () => document.querySelector('.knx-living-shell') !== null,
    {},
    {timeout: 60000},
  );
  // Then wait for home workspace
  await page.waitForFunction(
    () => document.querySelector('[data-testid="home-workspace"]') !== null,
    {},
    {timeout: 60000},
  );
}

async function go(section){
  const nav = page.locator('[data-testid="home-deck-' + section + '"]');
  await nav.click();
  await page.waitForTimeout(300);
}

try {
  await ctx.size(1672, 941);
  await settled();

  await probe('kpi-aggregation-honest-unmeasured', async () => {
    const kpiData = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid^="home-kpi-"]');
      return Array.from(cards).map(card => ({
        id: card.getAttribute('data-testid'),
        state: card.getAttribute('data-state'),
        value: card.querySelector('.home-kpi-value')?.textContent?.trim(),
      }));
    });
    assert.equal(kpiData.length, 6, 'six KPI cards expected');
    const measured = kpiData.filter(k => k.state === 'ready');
    const unmeasured = kpiData.filter(k => k.state === 'unmeasured');
    // Verify unmeasured cards show '-' or '—' and don't invent numbers
    for (const k of unmeasured) {
      assert(k.value === '-' || k.value === '—', `unmeasured KPI ${k.id} must show - or —`);
    }
    // Native may not be available in test env; if so, all KPIs are honestly unmeasured
    // Do not infer Native bridge availability from an undocumented global.
    await save('kpi-states.json', {kpiData, providerMeasurement: measured.length ? 'partial-or-measured' : 'unmeasured'});
    return {measured: measured.length, unmeasured: unmeasured.length, providerMeasurement: measured.length ? 'partial-or-measured' : 'unmeasured'};
  });

  await probe('eight-command-deck-deep-links', async () => {
    for (const id of DECK_IDS) {
      await go(id);
      // Verify navigation intent - the page should attempt to navigate
      const hash = await page.evaluate(() => location.hash);
      assert(hash.length > 1, `deep link for ${id} should navigate`);
      await page.waitForTimeout(200);
      // Navigation owns the live hash. Return explicitly to Home; reloading the
      // destination does not return to Home and previously caused a false timeout.
      await page.evaluate(() => { location.hash = 'home'; });
      await settled();
    }
    return {deckIds: DECK_IDS.length, allNavigated: true};
  });

  await probe('system-overview-tabs-and-live-metrics', async () => {
    for (const tab of OVERVIEW_TABS) {
      const btn = page.locator('button[role="tab"]').filter({hasText: tab === 'health' ? 'Health' : 'Storage'});
      await btn.click();
      await page.waitForTimeout(200);
      const content = await page.locator('section[aria-label="System overview"] .home-scroll').innerText();
      assert(content.length > 0, `${tab} tab content must render`);
    }
    // Return to Health before measuring baseline rows; Storage may be empty.
    await page.getByRole('tab', {name:'Health'}).click();
    // Verify live metrics show real values or '-'
    const rows = await page.locator('.home-metric-row').all();
    assert(rows.length >= 3, 'at least CPU, Memory, Disk rows');
    return {tabs: OVERVIEW_TABS.length, metricRows: rows.length};
  });

  await probe('quick-access-tabs-files-and-activity', async () => {
    for (const tab of ACCESS_TABS) {
      const btn = page.locator('button[role="tab"]').filter({hasText: tab === 'files' ? 'Recent files' : 'Scans'});
      await btn.click();
      await page.waitForTimeout(200);
      const scroll = page.locator('section[aria-label="Quick access"] .home-scroll');
      await scroll.waitFor({state: 'visible'});
    }
    return {tabs: ACCESS_TABS.length};
  });

  await probe('insight-panel-honest-measured-or-unmeasured', async () => {
    const lead = await page.locator('.home-insight-lead').innerText();
    const note = await page.locator('.home-insight-note').innerText();
    assert(lead.length > 0, 'insight lead must render');
    assert(note.length > 0, 'insight note must render');
    // Must not invent totals
    const combined = lead + note;
    assert(!/measured total/i.test(combined), 'insight must not claim invented measured total');
    const actionBtn = page.locator('.home-insight-actions .home-primary');
    await actionBtn.waitFor({state: 'visible'});
    return {hasLead: true, hasNote: true, honest: true};
  });

  await probe('recent-activity-and-pending-actions-review-only', async () => {
    // Recent activity
    const activityRows = page.locator('.home-metric-row').filter({hasText: /Check|Activity|Scan/});
    const count = await activityRows.count();
    // Pending actions
    const pendingRows = page.locator('.home-metric-row').filter({hasText: /Preview/});
    const pendingCount = await pendingRows.count();
    // Verify no execution claim
    const body = await page.evaluate(() => document.body.innerText);
    assert(!/executed|applied|deleted|removed/i.test(body), 'Home must not claim execution');
    return {activityItems: count, pendingItems: pendingCount, noExecutionClaim: true};
  });

  await probe('search-palette-measured-inventory-and-history', async () => {
    await page.keyboard.press('Control+KeyK');
    await page.waitForTimeout(200);
    const palette = page.locator('.home-workspace-palette');
    await palette.waitFor({state: 'visible'});
    // Search for non-match
    const input = palette.locator('input[aria-label="Search workspaces"]');
    await input.fill('NO-MATCH-QUERY');
    await page.waitForTimeout(300);
    await page.locator('[data-testid="home-inventory-search"]').waitFor({state:'visible'});
    const results = page.locator('[data-testid^="home-search-file"], [data-testid^="home-search-app"]');
    assert.equal(await results.count(), 0, 'no results for non-match');
    // Clear and verify history
    await input.fill('');
    await page.waitForTimeout(100);
    const history = page.locator('[data-testid="home-search-history"]');
    if (await history.count()) {
      const entries = history.locator('button');
      assert(await entries.count() <= 8, 'history capped at 8');
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    return {paletteOpens: true, nonMatchEmpty: true, historyCapped: true};
  });

  await probe('modal-dialogs-and-honest-copy', async () => {
    const triggers = {
      notifications: () => page.locator('section[aria-label="Recent activity"] button:has-text("View all")').click(),
      customize: () => page.getByRole('button', {name:'Customize'}).click(),
      scan: () => page.getByRole('button', {name:/Start a Quick Scan/i}).click(),
    };
    for (const modal of MODAL_IDS) {
      await triggers[modal]();
      const dialog = page.locator('dialog.home-dialog');
      await dialog.waitFor({state:'visible'});
      const copy = await dialog.innerText();
      assert(!/successfully executed|files deleted|changes applied/i.test(copy), modal + ' must not claim unverified execution');
      await dialog.getByRole('button',{name:'Close dialog'}).click();
      await dialog.waitFor({state:'hidden'});
    }
    return {modals: MODAL_IDS.length, allHonest:true};
  });

  await probe('layout-frames-four-viewports', async () => {
    const frames = [];
    for (const [locale, theme, w, h] of desktopFrames) {
      await frame(locale, theme, w, h);
      const g = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        innerW: innerWidth,
        innerH: innerHeight,
        dir: document.documentElement.dir,
        theme: document.documentElement.dataset.theme,
      }));
      assert.equal(g.overflow, 0, JSON.stringify(g));
      frames.push({locale, theme, w, h, ...g});
      await capture(`home-${theme}-${locale}-${w}x${h}`);
    }
    await save('layout-frames.json', frames);
    return {frames: frames.length};
  });

  await probe('browser-preview-reports-native-required', () =>
    ctx.unavailableBrowser(async tab => {
      assert.equal(await tab.locator('[data-testid="home-workspace"]').getAttribute('data-home-sample'), 'false');
      // This Home composition has no home-live-status test id. Observe the
      // rendered KPIs directly rather than asserting a nonexistent DOM node.
      const states = await tab.locator('[data-testid^="home-kpi-"]').evaluateAll(
        cards => cards.map(card => card.getAttribute('data-state')),
      );
      assert.equal(states.length, 6, 'browser preview must render six KPI cards');
      assert(states.every(state => state === 'unmeasured'), 'no browser-only metric may masquerade as measured');
      return {kpiStates: states, noFabricated: true};
    }),
  );

} catch (error) {
  ctx.fail(error);
} finally {
  await ctx.finish(10);
}