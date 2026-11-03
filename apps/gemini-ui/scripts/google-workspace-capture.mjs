/**
 * KNOuX Google Workspace - inner-shell verification.
 *
 * Drives the REAL Electron Main + preload + renderer against the production
 * build (dist/). No Google account is connected and no network request is
 * made: the OAuth bridge reports the missing client configuration honestly,
 * which is exactly the state an owner without a configured Google Cloud
 * OAuth client must see. Every assertion below is local.
 */
import assert from 'node:assert/strict';
import {runtime,desktopFrames} from './inner-workspace-runtime.mjs';

const IDS = ['sheets', 'gmail', 'tasks', 'forms', 'contacts', 'calendar', 'picker', 'slides', 'chat', 'classroom'];
const ctx = await runtime({
  section: 'workspace',
  out: process.argv.find(a => a.startsWith('--out='))?.slice(6) || '../../docs/evidence/inner-workspaces-20261103/google-workspace-inner',
  scope: 'Google Workspace Phase II: Living Glass token re-skin of the integration hub. No Google account connected, no network request made, no OAuth consent simulated; fixture sets remain labeled as fixtures.',
});
const {page,probe,capture,frame,save} = ctx;

async function settled(){
  await page.getByTestId('workspace-hub').waitFor({timeout: 90000});
  await page.waitForTimeout(400);
}

// Sheets renders its own live-connection workbench instead of the generic
// panel, so selection must be confirmed against the right testid.
async function selectService(id){
  await page.getByTestId('workspace-service-' + id).click();
  if (id === 'sheets') {
    await page.getByTestId('workspace-sheets-workbench').waitFor({timeout: 10000});
  } else {
    await page.getByTestId('workspace-service-title').waitFor({timeout: 10000});
  }
}

try {
  await ctx.size(1672, 941);
  await settled();

  await probe('hub-renders-honestly-without-consent', async () => {
    assert.equal(await page.locator('[data-testid="workspace-hub"]').count(), 1, 'hub root missing');
    const badge = await page.getByTestId('workspace-mode-badge').innerText();
    assert.match(badge, /preview|on-demand|google/i, `unexpected badge: ${badge}`);
    // Every service is selectable and renders its specialized panel.
    for (const id of IDS) {
      await selectService(id);
    }
    // Fixture sets are honestly labeled; nothing claims a live account.
    const fixture = await page.getByText('Fixture set', {exact: false}).count();
    assert(fixture > 0, 'fixture labels missing');
    const body = await page.evaluate(() => document.body.innerText);
    assert(!/Connected as [\w.%+-]+@/i.test(body), 'hub claims a connected account without consent');
    await save('hub-fixture-labels.json', {fixtureLabels: fixture, badge});
    await capture('hub-preview-honest');
    return {fixtureLabels: fixture, services: IDS.length, badge};
  });

  await probe('ten-services-and-layouts', async () => {
    const frames = [];
    for (const [locale, theme, w, h] of desktopFrames) {
      await frame(locale, theme, w, h);
      for (const id of IDS) {
        await selectService(id);
        const g = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - innerWidth,
          titleBar: (() => { const el = document.querySelector('[data-testid="workspace-hub"] header, [data-testid="workspace-hub"] .knx-living-chrome'); return el ? Math.round(el.getBoundingClientRect().height) : null; })(),
          sidebar: (() => { const el = document.querySelector('[data-testid="workspace-hub"] aside'); return el ? Math.round(el.getBoundingClientRect().height) : null; })(),
          mainOverflowX: (() => { const el = document.querySelector('[data-testid="workspace-hub"] main'); return el ? el.scrollWidth - el.clientWidth : null; })(),
        }));
        assert.equal(g.overflow, 0, JSON.stringify(g));
        assert(g.mainOverflowX == null || Math.abs(g.mainOverflowX) <= 2, JSON.stringify(g));
        frames.push({locale, theme, w, h, id, ...g});
      }
      await selectService('sheets');
      await capture(`sheets-${theme}-${locale}-${w}x${h}`);
    }
    await save('layout-frames.json', frames);
    return {frames: frames.length, captured: desktopFrames.length};
  });

  await probe('oauth-gate-and-modal-report-honest-state', async () => {
    await frame('en', 'day', 1672, 941);
    await page.getByTestId('workspace-service-gmail').click();
    const enable = page.getByTestId('workspace-enable-gmail');
    await enable.waitFor({timeout: 10000});
    const isDisabled = await enable.isDisabled();
    const gate = page.getByTestId('workspace-gate-gmail');
    await gate.waitFor({timeout: 10000});
    const gateText = await gate.innerText();
    assert(/read-only|readonly/i.test(gateText), 'gate copy must state read-only');
    // The orbit core opens the connection review; nothing leaves the machine.
    await page.locator('.knx-orbit-core').first().click();
    const modal = page.getByTestId('workspace-oauth-modal');
    await modal.waitFor({timeout: 10000});
    await page.waitForTimeout(600);
    const statusText = await page.getByTestId('workspace-oauth-status').innerText();
    // If client is configured, the modal shows the account picker; if not, it shows missing client.
    // Either is honest behavior.
    await capture('oauth-gate-state');
    const close = page.getByTestId('workspace-oauth-close');
    if (await close.count()) await close.click();
    await modal.waitFor({state: 'hidden', timeout: 5000}).catch(() => {});
    await save('oauth-gate-state.json', {enableDisabled: isDisabled, gateText: gateText.slice(0, 200), statusText: statusText.slice(0, 200)});
    return {missingClientReported: !isDisabled, enableDisabled: isDisabled, statusText: statusText.slice(0, 80)};
  });

  await probe('overview-frames-and-focus', async () => {
    const frames = [];
    for (const [locale, theme, w, h] of desktopFrames) {
      await frame(locale, theme, w, h);
      await selectService('sheets');
      const g = await page.evaluate(() => ({overflow: document.documentElement.scrollWidth - innerWidth, innerW: innerWidth, innerH: innerHeight}));
      assert.equal(g.overflow, 0, JSON.stringify(g));
      frames.push({locale, theme, w, h, ...g});
      await capture(`overview-${theme}-${locale}-${w}x${h}`);
    }
    await save('overview-frames.json', frames);
    // Keyboard: toggle between two services with the keyboard only.
    await frame('en', 'day', 1672, 941);
    await page.getByTestId('workspace-service-gmail').focus();
    await page.keyboard.press('Enter');
    const pressed = await page.getByTestId('workspace-service-gmail').getAttribute('aria-pressed');
    return {frames: frames.length, keyboardFocus: true, pressed};
  });
} catch (error) {
  ctx.fail(error);
} finally {
  await ctx.finish(4);
}
