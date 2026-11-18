/**
 * KNOuX Home Command Center — inner-workspace verification.
 *
 * Drives the REAL Electron Main + preload + renderer against the production
 * renderer build (dist/). Home performs one bounded read-only aggregation
 * across existing bridges; every assertion reads the live snapshot, the
 * derived activities, or the renderer DOM.
 *
 * No scan, delete, install, uninstall, mutate, schedule, or execute action is
 * invoked from Home. Deep links are verified; the native providers behind those
 * links remain untouched.
 */
import assert from 'node:assert/strict';
import {runtime, desktopFrames} from './inner-workspace-runtime.mjs';

const KPI_IDS = ['health', 'indexes', 'reclaim', 'automations', 'apps', 'services'];
const DECK_IDS = ['smart_scan', 'files', 'applications', 'storage', 'cleanup', 'startup', 'system', 'repair'];

const ctx = await runtime({
  section: 'home',
  out: process.argv.find(a => a.startsWith('--out='))?.slice(6)
    || '../../docs/evidence/inner-workspaces-20261103/home-inner-workspace',
  scope: 'D01 Home Command Center Phase II: approved composition preserved, six measured KPI cards, eight deep-link deck tiles, system/quick-access tabs, honest insight, review-only activity and pending actions, workspace search with local history, dialogs, four layout frames, and browser native-required fallback. No mutation or execution is invoked from Home.',
});
const {page, probe, capture, frame, save} = ctx;

/** Wait for the Home composition to be interactive. */
async function settled() {
  await page.waitForFunction(
    () => document.querySelector('[data-testid="home-workspace"]') !== null,
    {},
    {timeout: 90000},
  );
}

/** Return to Home through the same hash router the app uses. */
async function backHome() {
  await page.evaluate(() => { location.hash = '#/home'; });
  await settled();
}

try {
  await ctx.size(1672, 941);
  await settled();

  await probe('approved-composition-and-six-kpi-cards', async () => {
    const view = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="home-workspace"]');
      const cards = Array.from(document.querySelectorAll('[data-testid^="home-kpi-"]'));
      return {
        rootDir: root?.getAttribute('dir'),
        theme: root?.getAttribute('data-theme-mode'),
        hero: !!document.querySelector('.home-hero'),
        // The approved hero instrument is mounted into the shared header slot by
        // LivingOrbitMount so only the orbital artwork travels, never the page.
        orbitSvg: !!document.querySelector('[data-testid="unified-live-orbit"] svg.knx-orbit-vector'),
        orbitState: document.querySelector('[data-testid="unified-live-orbit"] .knx-orbit')?.getAttribute('data-orbit-state'),
        pipeline: !!document.querySelector('[data-testid="home-pipeline"]'),
        deckTiles: document.querySelectorAll('[data-testid^="home-deck-"]').length,
        cards: cards.map(card => ({
          id: card.getAttribute('data-testid'),
          state: card.getAttribute('data-state'),
          value: card.querySelector('.home-kpi-value')?.textContent?.trim(),
        })),
      };
    });
    assert.equal(view.rootDir, 'ltr');
    assert.equal(view.theme, 'day', 'runtime seeded light theme');
    assert(view.hero && view.orbitSvg && view.pipeline, 'hero, orbit SVG and pipeline must render');
    assert.equal(view.deckTiles, 8, 'eight command-deck tiles expected');
    assert.equal(view.cards.length, 6, 'six KPI cards expected');
    for (const id of KPI_IDS) {
      assert(view.cards.some(card => card.id === `home-kpi-${id}`), `missing KPI ${id}`);
    }
    for (const card of view.cards) {
      assert(['ready', 'unmeasured'].includes(card.state || ''), `unexpected KPI state ${card.state}`);
      if (card.state === 'unmeasured') {
        assert(card.value === '—' || card.value === '-', `unmeasured KPI ${card.id} must show a dash, got ${card.value}`);
      }
    }
    await save('kpi-states.json', view.cards);
    return {
      measured: view.cards.filter(c => c.state === 'ready').length,
      unmeasured: view.cards.filter(c => c.state === 'unmeasured').length,
    };
  });

  await probe('eight-command-deck-deep-links', async () => {
    const visited = [];
    for (const id of DECK_IDS) {
      await page.locator(`[data-testid="home-deck-${id}"]`).click();
      await page.waitForFunction(target => location.hash.includes(target), id, {timeout: 30000});
      visited.push(await page.evaluate(() => location.hash));
      await backHome();
    }
    assert.equal(visited.length, DECK_IDS.length);
    return {visited};
  });

  await probe('system-overview-health-and-storage-tabs', async () => {
    const health = page.locator('.home-panel', {has: page.locator('text=System Overview')}).first();
    await page.locator('button[role="tab"]', {hasText: 'Health'}).first().click();
    await page.waitForTimeout(150);
    const healthRows = await health.locator('.home-metric-row').count();
    assert(healthRows >= 4, `expected CPU/memory/disk/health rows, got ${healthRows}`);
    const values = await health.locator('.home-metric-row em').allInnerTexts();
    assert(values.length >= 4, 'each metric row must expose a value slot');
    for (const value of values) {
      assert(value.trim().length > 0, 'metric value must render a measurement or a dash');
    }
    await page.locator('button[role="tab"]', {hasText: 'Storage'}).first().click();
    await page.waitForTimeout(150);
    const storageText = await health.innerText();
    assert(storageText.length > 0, 'storage tab must render volumes or an honest empty state');
    await page.locator('button[role="tab"]', {hasText: 'Health'}).first().click();
    return {healthRows, values};
  });

  await probe('quick-access-files-and-scans-tabs', async () => {
    const quick = page.locator('.home-panel', {has: page.locator('text=Quick Access')}).first();
    await page.locator('button[role="tab"]', {hasText: 'Recent files'}).first().click();
    await page.waitForTimeout(120);
    const filesText = (await quick.innerText()).trim();
    assert(filesText.length > 0, 'recent files tab must render files or an honest empty state');
    await page.locator('button[role="tab"]', {hasText: 'Scans'}).first().click();
    await page.waitForTimeout(120);
    const scansText = (await quick.innerText()).trim();
    assert(scansText.length > 0, 'scans tab must render history or an honest empty state');
    return {filesChars: filesText.length, scansChars: scansText.length};
  });

  await probe('insight-is-measured-or-explicitly-unmeasured', async () => {
    const insight = page.locator('.home-insight');
    const lead = (await insight.locator('.home-insight-lead').innerText()).trim();
    const note = (await insight.locator('.home-insight-note').innerText()).trim();
    const action = (await insight.locator('.home-insight-actions button').innerText()).trim();
    assert(lead.length > 0, 'insight lead must render');
    assert(note.length > 0, 'insight note must render');
    assert(action.length > 0, 'insight action must render');
    const combined = `${lead} ${note}`;
    assert(!/\b(48\.6|12\.4|838)\b/.test(combined), 'insight must not reuse reference design numbers');
    await insight.locator('.home-insight-actions button').click();
    await page.waitForTimeout(400);
    await backHome();
    return {lead, action};
  });

  await probe('activity-and-pending-actions-are-review-only', async () => {
    const activity = page.locator('.home-panel', {has: page.locator('text=Recent Activity')}).first();
    const pending = page.locator('.home-panel', {has: page.locator('text=Pending Safe Actions')}).first();
    const activityText = (await activity.innerText()).trim();
    const pendingText = (await pending.innerText()).trim();
    assert(activityText.length > 0, 'activity panel must render');
    assert(pendingText.length > 0, 'pending panel must render');
    const pendingPreviews = await pending.locator('.home-metric-row em', {hasText: 'Preview'}).count();
    const pendingRows = await pending.locator('.home-metric-row').count();
    assert.equal(pendingPreviews, pendingRows, 'every pending row must be labelled Preview');
    // Home never reports that it applied anything itself.
    for (const claim of ['Applied by Home', 'Deleted by Home', 'Executed by Home', 'Removed by Home']) {
      assert(!activityText.includes(claim) && !pendingText.includes(claim), `unexpected execution claim: ${claim}`);
    }
    return {activityChars: activityText.length, pendingRows, pendingPreviews};
  });

  await probe('workspace-search-and-local-history', async () => {
    await page.keyboard.press('Control+KeyK');
    const dialog = page.locator('dialog.home-workspace-palette');
    await dialog.waitFor({state: 'visible'});
    const input = dialog.locator('input[aria-label="Search workspaces"]');

    // Section search must resolve a real route.
    await input.fill('storage');
    await page.waitForTimeout(120);
    const sectionResults = await dialog.locator('nav[aria-label="Workspace search results"] button').count();
    assert(sectionResults > 0, 'section search must find Storage');

    // Inventory search must never invent a hit for a non-match.
    await input.fill('zz-no-such-inventory-zz');
    await page.waitForTimeout(700);
    const hits = await dialog.locator('[data-testid="home-search-file"], [data-testid="home-search-app"]').count();
    assert.equal(hits, 0, 'non-matching inventory query must return zero measured hits');

    // History is local, capped at eight, and clears for real.
    await input.fill('');
    await page.waitForTimeout(120);
    const historyNav = dialog.locator('[data-testid="home-search-history"]');
    await historyNav.waitFor({state: 'visible'});
    const historyEntries = await historyNav.locator('div button').count();
    assert(historyEntries <= 8, 'history must be capped at eight entries');
    if (historyEntries > 0) {
      await dialog.locator('[data-testid="home-search-history-clear"]').click();
      await page.waitForTimeout(120);
      const remaining = await historyNav.locator('div button').count();
      assert.equal(remaining, 0, 'clear must empty the local history');
    }

    await page.keyboard.press('Escape');
    await dialog.waitFor({state: 'hidden'});
    return {sectionResults, historyEntries};
  });

  await probe('three-dialogs-honest-and-escape-closes', async () => {
    const opened = [];
    const openers = [
      ['scan', 'button.home-primary', /Preview only|preview only/],
      ['customize', 'button:has-text("Customize")', /fourteen sections|not user-removable/],
      ['notifications', '.home-panel button:has-text("View all")', /LOCAL|NATIVE|provider|No provider warnings/i],
    ];
    for (const [name, selector, expected] of openers) {
      await page.locator(selector).first().click();
      const dialog = page.locator('dialog.home-dialog');
      await dialog.waitFor({state: 'visible'});
      const text = await dialog.innerText();
      assert(expected.test(text), `${name} dialog copy must state its real boundary`);
      opened.push(name);
      await page.keyboard.press('Escape');
      await dialog.waitFor({state: 'hidden'});
    }
    return {opened};
  });

  await probe('four-layout-frames', async () => {
    const frames = [];
    for (const [locale, theme, w, h] of desktopFrames) {
      await frame(locale, theme, w, h);
      const g = await page.evaluate(() => {
        const root = document.querySelector('[data-testid="home-workspace"]');
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          dir: root?.getAttribute('dir'),
          theme: document.documentElement.dataset.theme || 'dark',
          kpis: document.querySelectorAll('[data-testid^="home-kpi-"]').length,
          deck: document.querySelectorAll('[data-testid^="home-deck-"]').length,
        };
      });
      assert.equal(g.overflow, 0, `${locale}/${theme}/${w}x${h}: horizontal overflow ${g.overflow}`);
      assert.equal(g.dir, locale === 'ar' ? 'rtl' : 'ltr', `${locale}: wrong text direction`);
      assert.equal(g.theme, theme === 'day' ? 'light' : 'dark', `${theme}: wrong theme`);
      assert.equal(g.kpis, 6);
      assert.equal(g.deck, 8);
      frames.push({locale, theme, w, h, ...g});
      await capture(`home-${theme}-${locale}-${w}x${h}`);
    }
    await save('layout-frames.json', frames);
    return {frames: frames.length};
  });

  await probe('browser-preview-requires-native', async () => {
    const result = await ctx.unavailableBrowser(async tab => {
      const root = tab.locator('[data-testid="home-workspace"]');
      await root.waitFor();
      const sample = await root.getAttribute('data-home-sample');
      assert.equal(sample, 'false', 'browser preview must not claim a sample data mode');
      const values = await tab.locator('.home-kpi-value').allInnerTexts();
      assert(values.length === 6, 'six KPI cards must render without native');
      for (const value of values) {
        assert(['—', '-'].includes(value.trim()), `browser KPI must be unmeasured, got ${value}`);
      }
      const pending = await tab.locator('.home-empty').count();
      assert(pending > 0, 'browser preview must show honest empty states');
      return {sample, values};
    });
    return result;
  });

} catch (error) {
  ctx.fail(error);
} finally {
  await ctx.finish(10);
}
