/**
 * KNOuX System / Network / Hardware - inner-workspace verification.
 *
 * Drives the REAL Electron Main + preload + renderer against the production
 * renderer build (dist/). The first visit performs the bounded, read-only nine
 * stage native scan on this machine; every assertion below reads the measured
 * snapshot, the SystemBridge capabilities contract or the renderer DOM.
 *
 * No process, service, driver, proxy, adapter, hosts, repair, power, Settings
 * or clipboard write is exercised. Diagnostic, traceroute, signature, report
 * and Settings channels stay untouched: they require an explicit operator or
 * owner command and evidence is not permission to invoke them.
 */
import assert from 'node:assert/strict';
import {runtime,desktopFrames} from './inner-workspace-runtime.mjs';

const IDS = [
  'system-health-check', 'system-events', 'system-processes', 'system-signatures',
  'system-uptime', 'system-perf', 'system-drivers', 'system-logs',
  'system-resources', 'system-autostart', 'system-services-map', 'system-timeline',
  'network-interfaces', 'network-dns-config', 'network-adapters', 'network-connectivity',
  'network-throughput', 'network-traceroute', 'network-topology', 'network-ports',
  'network-wifi', 'network-hosts', 'network-proxies', 'network-repair-link',
  'hardware-inventory', 'hardware-battery', 'hardware-cpu', 'hardware-gpu',
  'hardware-memory', 'hardware-cycles', 'hardware-thermal', 'hardware-disks',
  'hardware-usb', 'hardware-display', 'hardware-audio', 'hardware-health-report',
];
const AR_REPRESENTATIVE = ['system-health-check', 'system-processes', 'network-interfaces', 'network-hosts', 'hardware-cpu', 'hardware-health-report'];
const ctx = await runtime({
  section: 'system',
  out: process.argv.find(a => a.startsWith('--out='))?.slice(6) || '../../docs/evidence/inner-workspaces-20261103/system-inner-workspace',
  scope: 'Five uncommitted System Phase II files completed in place: shared 36-service CompactServiceDock (testIdPrefix system-), measured SystemLiveStage, page-integrated specialized workspaces, hidden orbital header bridge. Read-only Windows evidence only. No mutation, Settings handoff, diagnostic, traceroute, signature, report or hosts/proxy/adapter/repair/power write is invoked.',
});
const {page,probe,capture,frame,save} = ctx;

async function settled(){
  await page.waitForFunction(
    () => { const s = document.querySelector('[data-testid=live-service-stage]')?.dataset.nativeStatus; return s && s !== 'RUNNING'; },
    {},
    {timeout: 300000},
  );
}

// The dock is always mounted and reports every registry id, but a service body
// only mounts once the measured snapshot exists. Wait for the real Phase II
// flow to be capable of selecting before asserting tab order.
async function dockIds(){
  return page.getByTestId('compact-service-dock').getByRole('tab').evaluateAll(es => es.map(e => e.dataset.serviceId));
}

async function service(id){
  await page.getByTestId('system-service-' + id).click();
  const panel = page.getByTestId('system-integrated-service');
  await panel.waitFor();
  await page.locator(`[data-testid="sys-service-workspace-${id}"]`).waitFor({timeout: 20000});
  assert.equal(await panel.getAttribute('aria-labelledby'), 'service-tab-' + id);
}

try {
  await ctx.size(1672, 941);
  await settled();

  await probe('native-measured-snapshot-and-registry', async () => {
    const caps = await page.evaluate(() => window.knouxSystemV1.capabilities());
    assert.equal(caps.data.contract, 'system.v1');
    assert.equal(caps.data.readOnly, true);
    assert.equal(caps.data.mutation, 'none');
    assert.equal(caps.data.serviceCount, 36);
    assert.equal(caps.data.services.length, 36);
    const snap = await page.evaluate(() => window.knouxSystemV1.snapshot());
    assert(typeof snap.data.receipt === 'string' && snap.data.receipt.length > 0, 'measured receipt missing');
    assert(typeof snap.data.generatedAt === 'string' && snap.data.generatedAt.length > 0, 'measured timestamp missing');
    assert(Array.isArray(snap.data.coverage) && snap.data.coverage.length > 0, 'coverage missing');
    const ids = await dockIds();
    assert.equal(ids.length, 36, JSON.stringify(ids));
    assert.equal(new Set(ids).size, 36, 'dock tabs are not unique');
    assert.deepEqual([...ids].sort(), [...IDS].sort(), 'dock does not register every System service');
    assert.equal(await page.locator('[data-testid="system-embedded-service"]').count(), 0, 'overview must render before a selection');
    await save('native-capabilities.json', {
      contract: caps.data.contract,
      engine: caps.data.engine,
      readOnly: caps.data.readOnly,
      mutation: caps.data.mutation,
      serviceCount: caps.data.serviceCount,
      services: caps.data.services.map(s => ({id: s.id, state: s.state, provider: s.provider})),
      coverage: snap.data.coverage.map(c => ({key: c.key, status: c.status, provider: c.provider, items: c.items})),
      warnings: snap.data.warnings,
      generatedAt: snap.data.generatedAt,
    });
    await capture('measured-overview-resources');
    return {serviceCount: 36, stages: snap.data.coverage.length, receiptPrefix: snap.data.receipt.slice(0, 12)};
  });

  await probe('thirty-six-services-and-layouts', async () => {
    const frames = [];
    for (const [locale, theme, w, h] of desktopFrames) {
      await frame(locale, theme, w, h);
      for (const id of IDS) {
        await service(id);
        const g = await ctx.geometry('[data-testid=system-integrated-service]', '[data-testid=system-actionbar]');
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
    return {frames: frames.length, captured: 36 + AR_REPRESENTATIVE.length};
  });

  await probe('dock-keyboard-and-detached-side-view', async () => {
    await frame('en', 'day', 1672, 941);
    const first = page.getByTestId('compact-service-dock').getByRole('tab').first();
    await first.focus();
    await page.keyboard.press('End');
    assert.equal(await page.getByTestId('system-integrated-service').getAttribute('aria-labelledby'), 'service-tab-' + IDS[IDS.length - 1]);
    assert.equal(await page.locator('[data-testid="system-embedded-service"]').count(), 1);
    await page.keyboard.press('Home');
    assert.equal(await page.getByTestId('system-integrated-service').getAttribute('aria-labelledby'), 'service-tab-' + IDS[0]);
    await page.locator('.sys-process-tools').getByRole('button', {name: 'Side view', exact: true}).click();
    await page.getByTestId('system-workbench-side-shell').waitFor();
    assert.equal(await page.locator('[data-testid="system-embedded-service"]').count(), 0, 'detached view must unmount the embedded body, never duplicate it');
    assert.equal(await page.locator('[data-testid="system-overview"]').count(), 1, 'detached view keeps the overview available behind the pinned host');
    assert.equal(await page.locator('[data-testid="system-workbench-side-shell"]').count(), 1);
    await capture('detached-side-view');
    await page.keyboard.press('Escape');
    await page.getByTestId('system-workbench-side-shell').waitFor({state: 'hidden'});
    assert.equal(await page.locator('[data-testid="system-embedded-service"]').count(), 1, 'Escape returns the pinned host to the embedded workspace');
    await page.locator('.sys-process-tools').getByRole('button', {name: 'Overview', exact: true}).click();
    await page.getByTestId('system-overview').waitFor();
    assert.equal(await page.locator('[data-testid="system-embedded-service"]').count(), 0);
    return {keyboardHomeEnd: true, sideEscape: true, noDuplicatedBody: true, overviewReturn: true};
  });

  await probe('embedded-state-matches-native-capabilities', async () => {
    const caps = await page.evaluate(() => window.knouxSystemV1.capabilities());
    const expected = new Map(caps.data.services.map(s => [s.id, s.state]));
    const tone = {available: 'is-good', partial: 'is-warn', gated: 'is-bad'};
    const mismatches = [];
    for (const id of IDS) {
      await page.getByTestId('system-service-' + id).click();
      await page.locator(`[data-testid="sys-service-workspace-${id}"]`).waitFor({timeout: 20000});
      const cls = await page.getByTestId('system-embedded-state').getAttribute('class');
      const want = tone[expected.get(id)];
      if (!cls || !cls.includes(want)) mismatches.push({id, capability: expected.get(id), cls});
    }
    assert.deepEqual(mismatches, [], JSON.stringify(mismatches));
    return {verified: expected.size, mismatches: 0};
  });

  await probe('browser-unavailable-no-fabricated-readings', () =>
    ctx.unavailableBrowser(async tab => {
      assert.equal(await tab.getByTestId('live-service-stage').getAttribute('data-native-status'), 'UNAVAILABLE');
      assert.equal(await tab.getByTestId('system-scan-action').isDisabled(), true);
      assert.equal(await tab.getByTestId('compact-service-dock').getByRole('tab').count(), 36);
      assert.equal(await tab.locator('[data-testid="system-embedded-service"]').count(), 0, 'no measured body may mount without the native bridge');
      assert.equal(await tab.getByTestId('system-native-required').count(), 1, 'explicit native-required notice expected');
      return {status: 'UNAVAILABLE', selectors: 36, fixtures: 0};
    }),
  );

  await probe('overview-preserved-at-four-frames', async () => {
    const frames = [];
    for (const [locale, theme, w, h] of desktopFrames) {
      const isArabic = locale === 'ar';
      await frame(locale, theme, w, h);
      // The Overview control is disabled while the overview is already shown;
      // that is a valid starting state, not a failure.
      const overviewButton = page.locator('.sys-process-tools').getByRole('button', {name: isArabic ? 'نظرة عامة' : 'Overview', exact: true});
      if (await overviewButton.isEnabled()) await overviewButton.click();
      await page.getByTestId('system-overview').waitFor();
      const g = await ctx.geometry('[data-testid=system-overview]', '[data-testid=system-actionbar]');
      assert(g.footerBottom <= h && g.footerRight <= w, JSON.stringify(g));
      assert.equal(g.overflow, 0, JSON.stringify(g));
      frames.push({locale, theme, w, h, ...g});
      await capture(`overview-${theme}-${locale}-${w}x${h}`);
    }
    await save('overview-frames.json', frames);
    return {frames: frames.length};
  });

  await probe('back-to-overview-and-aria-association', async () => {
    await frame('en', 'day', 1672, 941);
    const id = 'hardware-cpu';
    await service(id);
    assert.equal(await page.getByTestId('system-integrated-service').getAttribute('aria-labelledby'), 'service-tab-' + id);
    const selected = await page.getByTestId('compact-service-dock').getByRole('tab').evaluateAll((nodes, value) => nodes.find(n => n.dataset.serviceId === value)?.getAttribute('aria-selected'), id);
    assert.equal(selected, 'true');
    await page.getByTestId('system-embedded-close').click();
    await page.getByTestId('system-overview').waitFor();
    assert.equal(await page.locator('[data-testid="system-embedded-service"]').count(), 0);
    return {embeddedBack: true, ariaLabelledby: true, ariaSelected: true};
  });
} catch (error) {
  ctx.fail(error);
} finally {
  await ctx.finish(7);
}
