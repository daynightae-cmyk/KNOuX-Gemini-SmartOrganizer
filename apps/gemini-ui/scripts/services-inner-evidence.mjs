/**
 * KNOuX Service Commander - inner-workspace verification.
 *
 * Drives the REAL Electron Main + preload + renderer against the production
 * renderer build (dist/). The first visit performs the bounded, read-only SCM
 * discovery on this machine; every assertion below reads the measured snapshot,
 * the ServicesBridge capabilities contract or the renderer DOM.
 *
 * No service start, stop, restart, cascade, force or startup-policy change is
 * staged, approved or executed. The OperationDock journals are left untouched;
 * evidence is never permission to mutate SCM.
 */
import assert from 'node:assert/strict';
import {runtime,desktopFrames} from './inner-workspace-runtime.mjs';

const IDS = [
  'services-inventory', 'services-control', 'services-undo', 'services-dependencies',
  'services-protected', 'services-search', 'services-startup-report', 'services-state-history',
  'services-dependents', 'services-diagnose', 'services-config', 'services-perf',
];
const AR_REPRESENTATIVE = ['services-inventory', 'services-control', 'services-protected', 'services-perf'];
const ctx = await runtime({
  section: 'services',
  out: process.argv.find(a => a.startsWith('--out='))?.slice(6) || '../../docs/evidence/inner-workspaces-20261103/services-inner-workspace',
  scope: 'Phase II Service Commander interior: shared 12-tool CompactServiceDock (testIdPrefix services), measured ServicesLiveStage, page-integrated specialized workspaces, hidden orbital header bridge. Bounded read-only SCM evidence only. No service, cascade, force, startup-policy or sc.exe write and no OperationDock approval is invoked.',
});
const {page,probe,capture,frame,save} = ctx;

async function settled(){
  await page.waitForFunction(
    () => { const s = document.querySelector('[data-testid=live-service-stage]')?.dataset.nativeStatus; return s && s !== 'RUNNING'; },
    {},
    {timeout: 300000},
  );
}

async function dockIds(){
  return page.getByTestId('compact-service-dock').getByRole('tab').evaluateAll(es => es.map(e => e.dataset.serviceId));
}

async function tool(id){
  await page.getByTestId('services-service-' + id).click();
  const panel = page.getByTestId('services-integrated-service');
  await panel.waitFor();
  await page.locator(`[data-testid="services-service-workspace-${id}"]`).waitFor({timeout: 20000});
  assert.equal(await panel.getAttribute('aria-labelledby'), 'service-tab-' + id);
}

try {
  await ctx.size(1672, 941);
  await settled();

  await probe('native-measured-snapshot-and-registry', async () => {
    const caps = await page.evaluate(() => window.knouxServicesV1.capabilities());
    assert.equal(caps.data.contract, 'services.v1');
    assert.equal(caps.data.readOnly, true);
    assert.equal(caps.data.mutation, 'none');
    assert.equal(caps.data.serviceCount, 12);
    assert.equal(caps.data.services.length, 12);
    const snap = await page.evaluate(() => window.knouxServicesV1.snapshot());
    assert(typeof snap.data.receipt === 'string' && snap.data.receipt.length > 0, 'measured receipt missing');
    assert(typeof snap.data.generatedAt === 'string' && snap.data.generatedAt.length > 0, 'measured timestamp missing');
    assert(Array.isArray(snap.data.coverage) && snap.data.coverage.length > 0, 'coverage missing');
    const ids = await dockIds();
    assert.equal(ids.length, 12, JSON.stringify(ids));
    assert.equal(new Set(ids).size, 12, 'dock tabs are not unique');
    assert.deepEqual([...ids].sort(), [...IDS].sort(), 'dock does not register every Service Commander tool');
    assert.equal(await page.locator('[data-testid="services-embedded-service"]').count(), 0, 'register overview must render before a selection');
    await save('native-capabilities.json', {
      contract: caps.data.contract,
      engine: caps.data.engine,
      readOnly: caps.data.readOnly,
      mutation: caps.data.mutation,
      serviceCount: caps.data.serviceCount,
      elevation: caps.data.elevation,
      services: caps.data.services.map(s => ({id: s.id, state: s.state, risk: s.risk, provider: s.provider})),
      coverage: snap.data.coverage.map(c => ({key: c.key, status: c.status, provider: c.provider, items: c.items})),
      summary: snap.data.summary,
      warnings: snap.data.warnings,
      generatedAt: snap.data.generatedAt,
    });
    await capture('measured-register-resources');
    return {serviceCount: 12, stages: snap.data.coverage.length, receiptPrefix: snap.data.receipt.slice(0, 12)};
  });

  await probe('twelve-tools-and-layouts', async () => {
    const frames = [];
    for (const [locale, theme, w, h] of desktopFrames) {
      await frame(locale, theme, w, h);
      for (const id of IDS) {
        await tool(id);
        const g = await ctx.geometry('[data-testid=services-integrated-service]', '[data-testid=services-actionbar]');
        assert(g.dockHeight >= 56 && g.dockHeight <= 76, JSON.stringify(g));
        assert(g.bodyHeight >= 120 && g.bodyWidth >= 700, JSON.stringify(g));
        assert(g.footerBottom <= h && g.footerRight <= w, JSON.stringify(g));
        assert.equal(g.overflow, 0, JSON.stringify(g));
        frames.push({locale, theme, w, h, id, ...g});
        if (theme === 'day' && locale === 'en' && w === 1672 && h === 941) {
          await capture(`${id}-day-en-1672x941`);
        } else if (locale === 'ar' && theme === 'day' && AR_REPRESENTATIVE.includes(id)) {
          await capture(`${id}-day-ar-1366x768`);
        }
      }
    }
    await save('layout-frames.json', frames);
    return {frames: frames.length, captured: 12 + AR_REPRESENTATIVE.length};
  });

  await probe('dock-keyboard-and-detached-side-view', async () => {
    await frame('en', 'day', 1672, 941);
    const first = page.getByTestId('compact-service-dock').getByRole('tab').first();
    await first.focus();
    await page.keyboard.press('End');
    assert.equal(await page.getByTestId('services-integrated-service').getAttribute('aria-labelledby'), 'service-tab-' + IDS[IDS.length - 1]);
    assert.equal(await page.locator('[data-testid="services-embedded-service"]').count(), 1);
    await page.keyboard.press('Home');
    assert.equal(await page.getByTestId('services-integrated-service').getAttribute('aria-labelledby'), 'service-tab-' + IDS[0]);
    await page.locator('.svc-process-tools').getByRole('button', {name: 'Side view', exact: true}).click();
    await page.getByTestId('services-workbench-side-shell').waitFor();
    assert.equal(await page.locator('[data-testid="services-embedded-service"]').count(), 0, 'detached view must unmount the embedded body, never duplicate it');
    assert.equal(await page.locator('[data-testid="services-overview"]').count(), 1, 'detached view keeps the register available behind the pinned host');
    assert.equal(await page.locator('[data-testid="services-workbench-side-shell"]').count(), 1);
    await capture('detached-side-view');
    await page.keyboard.press('Escape');
    await page.getByTestId('services-workbench-side-shell').waitFor({state: 'hidden'});
    assert.equal(await page.locator('[data-testid="services-embedded-service"]').count(), 1, 'Escape returns the pinned host to the embedded workspace');
    await page.locator('.svc-process-tools').getByRole('button', {name: 'Overview', exact: true}).click();
    await page.getByTestId('services-overview').waitFor();
    assert.equal(await page.locator('[data-testid="services-embedded-service"]').count(), 0);
    return {keyboardHomeEnd: true, sideEscape: true, noDuplicatedBody: true, overviewReturn: true};
  });

  await probe('embedded-state-matches-native-capabilities', async () => {
    const caps = await page.evaluate(() => window.knouxServicesV1.capabilities());
    const expected = new Map(caps.data.services.map(s => [s.id, s.state]));
    const mapping = {available: 'is-good', partial: 'is-warn', gated: 'is-bad'};
    const mismatches = [];
    for (const id of IDS) {
      await page.getByTestId('services-service-' + id).click();
      await page.locator(`[data-testid="services-service-workspace-${id}"]`).waitFor({timeout: 20000});
      const chip = page.getByTestId('services-embedded-state');
      const cls = await chip.getAttribute('class');
      const want = mapping[expected.get(id)];
      if (!cls || !cls.includes(want)) mismatches.push({id, capability: expected.get(id), cls});
    }
    assert.deepEqual(mismatches, [], JSON.stringify(mismatches));
    return {verified: expected.size, mismatches: 0};
  });

  await probe('browser-unavailable-no-fabricated-readings', () =>
    ctx.unavailableBrowser(async tab => {
      assert.equal(await tab.getByTestId('live-service-stage').getAttribute('data-native-status'), 'UNAVAILABLE');
      assert.equal(await tab.getByTestId('services-scan-action').isDisabled(), true);
      assert.equal(await tab.getByTestId('compact-service-dock').getByRole('tab').count(), 12);
      assert.equal(await tab.locator('[data-testid="services-embedded-service"]').count(), 0, 'no measured body may mount without the native bridge');
      assert.equal(await tab.getByTestId('services-native-required').count(), 1, 'explicit native-required notice expected');
      return {status: 'UNAVAILABLE', selectors: 12, fixtures: 0};
    }),
  );

  await probe('overview-preserved-at-four-frames', async () => {
    const frames = [];
    for (const [locale, theme, w, h] of desktopFrames) {
      const isArabic = locale === 'ar';
      await frame(locale, theme, w, h);
      // The Overview control is disabled while the overview is already shown;
      // that is a valid starting state, not a failure.
      const overviewButton = page.locator('.svc-process-tools').getByRole('button', {name: isArabic ? 'نظرة عامة' : 'Overview', exact: true});
      if (await overviewButton.isEnabled()) await overviewButton.click();
      await page.getByTestId('services-overview').waitFor();
      const g = await ctx.geometry('[data-testid=services-overview]', '[data-testid=services-actionbar]');
      assert(g.footerBottom <= h && g.footerRight <= w, JSON.stringify(g));
      assert.equal(g.overflow, 0, JSON.stringify(g));
      frames.push({locale, theme, w, h, ...g});
      await capture(`overview-${theme}-${locale}-${w}x${h}`);
    }
    await save('overview-frames.json', frames);
    return {frames: frames.length};
  });

  await probe('back-to-register-and-aria-association', async () => {
    await frame('en', 'day', 1672, 941);
    const id = 'services-inventory';
    await tool(id);
    assert.equal(await page.getByTestId('services-integrated-service').getAttribute('aria-labelledby'), 'service-tab-' + id);
    const selected = await page.getByTestId('compact-service-dock').getByRole('tab').evaluateAll((nodes, value) => nodes.find(n => n.dataset.serviceId === value)?.getAttribute('aria-selected'), id);
    assert.equal(selected, 'true');
    await page.getByTestId('services-embedded-close').click();
    await page.getByTestId('services-overview').waitFor();
    assert.equal(await page.locator('[data-testid="services-embedded-service"]').count(), 0);
    return {embeddedBack: true, ariaLabelledby: true, ariaSelected: true};
  });
} catch (error) {
  ctx.fail(error);
} finally {
  await ctx.finish(7);
}
