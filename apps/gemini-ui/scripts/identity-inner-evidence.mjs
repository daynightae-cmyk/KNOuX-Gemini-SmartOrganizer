/**
 * KNOuX Founder & Developer identity — inner-surface verification.
 *
 * Drives the REAL Electron Main + preload + renderer against the production
 * renderer build (dist/). The identity surface is the only place in the product
 * that hands a destination to the operating system, so the evidence proves:
 *
 *  - the native bridge answers with exactly the reviewed ten destinations;
 *  - the page renders its real roles, pillars, facts and channels;
 *  - copying writes the real corporate email to the Windows clipboard;
 *  - an unknown destination is refused by Main and opens nothing;
 *  - English/Arabic and Day/Night are one layout, with no overflow;
 *  - Escape returns to Home, and both discovery entry points work;
 *  - the browser preview degrades honestly instead of pretending to be native.
 *
 * No destination is actually opened during this run: the positive open path is
 * proven by the static allowlist test plus the refusal probe, so no browser,
 * mail client or dialer is launched on the owner's machine.
 */
import assert from 'node:assert/strict';
import {runtime, desktopFrames} from './inner-workspace-runtime.mjs';

const IDENTITY_IDS = [
  'website',
  'product',
  'email',
  'phone',
  'whatsapp',
  'github_engineer',
  'github_company',
  'facebook_founder',
  'facebook_company',
  'tiktok',
];

const EXPECTED_URIS = {
  website: 'https://knoux.store/',
  product: 'https://smart.knoux.store/',
  email: 'mailto:admin@knoux.store',
  phone: 'tel:+971503281920',
  whatsapp: 'https://wa.me/971503281920',
  github_engineer: 'https://github.com/daynightae-cmyk',
  github_company: 'https://github.com/knoux-io',
  facebook_founder: 'https://www.facebook.com/CopSadek',
  facebook_company: 'https://www.facebook.com/knouxStore/',
  tiktok: 'https://www.tiktok.com/@knoux_7',
};

const ctx = await runtime({
  section: 'identity',
  out: process.argv.find((arg) => arg.startsWith('--out='))?.slice(6)
    || '../../docs/evidence/inner-workspaces-20261103/identity-inner-workspace',
  ready: '[data-testid="identity-page"]',
  browserReady: '[data-testid="identity-page"]',
  scope: 'Founder & Developer identity surface: real native destination table (10 fixed KNOUX contacts), copy-to-clipboard, refusal of unknown destinations, bilingual Day/Night layout at four desktop frames, Escape-to-Home, sidebar and command-palette discovery, and honest browser-preview fallback. No external destination is opened during the run.',
});
const {page, app, probe, capture, save} = ctx;

/** Wait for the identity surface after a hash navigation. */
async function settled() {
  await page.waitForFunction(
    () => document.querySelector('[data-testid="identity-page"]') !== null,
    {},
    {timeout: 90000},
  );
}

/** Navigate through the same hash router the product uses. */
async function go(section) {
  await page.evaluate((target) => { location.hash = target; }, section);
  if (section === 'home') {
    await page.waitForFunction(
      () => document.querySelector('[data-testid="home-workspace"]') !== null,
      {},
      {timeout: 90000},
    );
  } else {
    await settled();
  }
}

/** Frame the identity surface using its own real controls. */
async function applyFrame(locale, theme, width, height) {
  const root = page.locator('[data-testid="identity-page"]');
  if (await root.getAttribute('dir') !== (locale === 'ar' ? 'rtl' : 'ltr')) {
    await page.locator('[data-testid="identity-locale"]').click();
  }
  const isLight = (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light';
  if (isLight !== (theme === 'day')) {
    await page.locator('[data-testid="identity-theme"]').click();
  }
  await ctx.size(width, height);
  await page.waitForTimeout(180);
}

try {
  await ctx.size(1672, 941);
  await settled();

  /* ------------------------------------------------------------------ 1/9 */

  await probe('entry-points-sidebar-and-command-palette', async () => {
    await go('home');
    const sidebar = page.locator('[data-testid="sidebar-identity"]');
    await sidebar.waitFor({state: 'visible'});

    await page.keyboard.press('Control+KeyK');
    const dialog = page.locator('dialog.home-workspace-palette');
    await dialog.waitFor({state: 'visible'});
    const input = dialog.locator('input[aria-label="Search workspaces"]');
    await input.fill('founder');
    await page.waitForTimeout(180);
    const paletteRow = dialog.locator('[data-testid="home-search-identity"]');
    assert.equal(await paletteRow.count(), 1, 'palette must offer exactly one identity row');
    await paletteRow.click();
    await settled();
    assert.equal(await page.evaluate(() => document.querySelector('[data-testid="identity-page"]')?.getAttribute('dir')), 'ltr');

    await go('home');
    await sidebar.click();
    await settled();
    return {sidebar: true, palette: true};
  });

  /* ------------------------------------------------------------------ 2/9 */

  await probe('native-bridge-exposes-exactly-the-reviewed-table', async () => {
    const envelope = await page.evaluate(() => window.knouxIdentityV1.links());
    assert.equal(envelope.contractVersion, 1, 'bridge contract version');
    assert.equal(envelope.capability, 'identity.links', 'links capability name');
    assert.equal(envelope.status, 'complete', 'links call must complete');
    assert.equal(envelope.permission, 'read-only', 'links permission is read-only');
    assert(Array.isArray(envelope.data?.links), 'links payload');
    const entries = envelope.data.links;
    assert.equal(entries.length, IDENTITY_IDS.length, 'ten destinations');
    assert.deepEqual(entries.map((entry) => entry.id), IDENTITY_IDS, 'destination order');
    for (const entry of entries) {
      assert.equal(entry.uri, EXPECTED_URIS[entry.id], `${entry.id} uri`);
      assert(entry.labelEn.trim() && entry.labelAr.trim(), `${entry.id} bilingual labels`);
    }
    const mode = await page.locator('[data-testid="identity-page"]').getAttribute('data-identity-mode');
    assert.equal(mode, 'native', 'Electron must use the native bridge');
    return {mode, destinations: entries.length};
  });

  /* ------------------------------------------------------------------ 3/9 */

  await probe('surface-composition-roles-pillars-facts-and-channels', async () => {
    const view = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="identity-page"]');
      const links = Array.from(document.querySelectorAll('li[data-testid^="identity-link-"]'));
      return {
        dir: root?.getAttribute('dir'),
        lang: root?.getAttribute('lang'),
        name: document.querySelector('.id-name')?.textContent?.trim(),
        nameAr: document.querySelector('.id-name-ar')?.textContent?.trim(),
        roles: Array.from(document.querySelectorAll('[data-testid="identity-roles"] li')).map((node) => node.textContent.trim()),
        pillars: document.querySelectorAll('[data-testid^="identity-pillar-"]').length,
        facts: Array.from(document.querySelectorAll('[data-testid="identity-facts"] > div')).map((row) => ({
          label: row.querySelector('dt')?.textContent?.trim(),
          value: row.querySelector('dd')?.textContent?.trim(),
        })),
        links: links.map((row) => ({
          id: row.getAttribute('data-testid'),
          href: row.getAttribute('data-uri'),
          buttons: row.querySelectorAll('button').length,
          copy: !!row.querySelector('[data-testid^="identity-link-copy-"]'),
        })),
        signature: document.querySelector('.id-sign-name')?.textContent?.trim(),
        version: document.querySelector('.id-foot-version')?.textContent?.trim(),
        body: root?.innerText || '',
      };
    });

    assert.equal(view.dir, 'ltr');
    assert.equal(view.lang, 'en');
    assert.equal(view.name, 'Eng. Sadek Elgazar');
    assert.equal(view.nameAr, 'م. صادق الجزار');
    assert.equal(view.roles.length, 4, 'four reviewed roles');
    assert(view.roles.includes('Founder') && view.roles.includes('AI Automation Engineer'), 'roles are the canonical ones');
    assert.equal(view.pillars, 4, 'four pillars');
    assert.equal(view.facts.length, 4, 'four product facts');
    assert(view.facts.some((fact) => fact.value === '0.4.0-gemini.0'), 'build fact shows the real version');
    assert.equal(view.links.length, IDENTITY_IDS.length, 'ten channel rows');
    for (const row of view.links) {
      const id = row.id.replace('identity-link-', '');
      assert.equal(row.href, EXPECTED_URIS[id], `${id} row href`);
      assert.equal(row.buttons, 2, `${id} row exposes exactly one open and one copy control`);
      assert(row.copy, `${id} row exposes copy`);
    }
    assert(view.signature.includes('Sadek Elgazar'), 'signature names the founder');
    assert.equal(view.version, '0.4.0-gemini.0', 'footer version is the package version');
    for (const invented of ['48.6 GB', '358 Apps', '8.4s', '12 Active']) {
      assert(!view.body.includes(invented), `identity must not reuse reference design number ${invented}`);
    }
    return {
      roles: view.roles.length,
      pillars: view.pillars,
      facts: view.facts.length,
      channels: view.links.length,
    };
  });

  /* ------------------------------------------------------------------ 4/9 */

  await probe('copy-corporate-email-writes-the-real-clipboard', async () => {
    const win = await app.browserWindow(page);
    await win.evaluate((window) => { window.setFocusable(true); window.focus(); });
    await app.evaluate(({ clipboard }) => clipboard.writeText('knoux-clipboard-sentinel'));
    await page.locator('[data-testid="identity-link-copy-email"]').click();
    const toast = page.locator('[data-testid="identity-copy-toast"]');
    await toast.waitFor({state: 'visible'});
    const toastText = (await toast.innerText()).trim();
    const copied = await app.evaluate(({ clipboard }) => clipboard.readText());
    await win.evaluate((window) => { window.setFocusable(false); window.setIgnoreMouseEvents(true); });
    assert.equal(copied, 'admin@knoux.store', 'clipboard must hold the corporate email');
    assert(/Copied/i.test(toastText) && /Corporate email/i.test(toastText), 'toast must name the copied channel');
    await save('clipboard-check.json', {toastText, copied});
    return {toastText, copied};
  });

  /* ------------------------------------------------------------------ 5/9 */

  await probe('unknown-destination-is-refused-and-opens-nothing', async () => {
    const pagesBefore = page.context().pages().length;
    const result = await page.evaluate(async () => {
      const api = window.knouxIdentityV1;
      const unknown = await api.open('evil.example');
      const prototype = await api.open('__proto__');
      const traversal = await api.open('../website');
      return {unknown, prototype, traversal};
    });
    for (const [label, envelope] of Object.entries(result)) {
      assert.equal(envelope.contractVersion, 1, `${label} keeps the contract version`);
      assert.equal(envelope.status, 'failed', `${label} must fail`);
      assert.equal(envelope.error?.code, 'IDENTITY_TARGET_INVALID', `${label} refusal code`);
      assert.equal(envelope.error?.retryable, false, `${label} refusal is final`);
    }
    const pagesAfter = page.context().pages().length;
    assert.equal(pagesAfter, pagesBefore, 'a refused destination must open nothing');
    return {codes: Object.values(result).map((envelope) => envelope.error.code)};
  });

  /* ------------------------------------------------------------------ 6/9 */

  await probe('locale-and-theme-toggles-are-real', async () => {
    await page.locator('[data-testid="identity-locale"]').click();
    await page.waitForTimeout(120);
    const arabic = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="identity-page"]');
      return {
        dir: root?.getAttribute('dir'),
        lang: root?.getAttribute('lang'),
        nameAr: document.querySelector('.id-name-ar')?.textContent?.trim(),
      };
    });
    assert.equal(arabic.dir, 'rtl', 'Arabic direction');
    assert.equal(arabic.lang, 'ar', 'Arabic language');
    assert.equal(arabic.nameAr, 'م. صادق الجزار');

    await page.locator('[data-testid="identity-theme"]').click();
    await page.waitForTimeout(120);
    /* Night is the absence of data-theme="light"; that is the token layer's
       documented contract, not a missing value. */
    const themeMode = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    assert.equal(themeMode, 'dark', 'theme toggle reaches the document');

    await page.locator('[data-testid="identity-locale"]').click();
    await page.locator('[data-testid="identity-theme"]').click();
    await page.waitForTimeout(120);
    return {arabicDir: arabic.dir, darkTheme: themeMode};
  });

  /* ------------------------------------------------------------------ 7/9 */

  await probe('four-layout-frames-bilingual-day-night', async () => {
    const frames = [];
    for (const [locale, theme, width, height] of desktopFrames) {
      await applyFrame(locale, theme, width, height);
      const metrics = await page.evaluate(() => {
        const root = document.querySelector('[data-testid="identity-page"]');
        const action = document.querySelector('[data-testid="identity-action-phone"]');
        return {
          dir: root?.getAttribute('dir'),
          lang: root?.getAttribute('lang'),
          theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
          overflowX: document.documentElement.scrollWidth - innerWidth,
          overflowY: document.documentElement.scrollHeight - innerHeight,
          roles: document.querySelectorAll('[data-testid="identity-roles"] li').length,
          pillars: document.querySelectorAll('[data-testid^="identity-pillar-"]').length,
          links: document.querySelectorAll('li[data-testid^="identity-link-"]').length,
          actionsAboveFold: !!action && action.getBoundingClientRect().bottom <= innerHeight,
          rootWidth: root?.getBoundingClientRect().width,
        };
      });
      assert.equal(metrics.dir, locale === 'ar' ? 'rtl' : 'ltr', `${locale}: direction`);
      assert.equal(metrics.lang, locale, `${locale}: language`);
      assert.equal(metrics.theme, theme === 'day' ? 'light' : 'dark', `${theme}: theme`);
      assert.equal(metrics.overflowX, 0, `${locale}/${theme}/${width}x${height}: horizontal overflow ${metrics.overflowX}`);
      assert.equal(metrics.overflowY, 0, `${locale}/${theme}/${width}x${height}: page-wide vertical scroll ${metrics.overflowY}`);
      assert.equal(metrics.roles, 4, `${locale}: roles`);
      assert.equal(metrics.pillars, 4, `${locale}: pillars`);
      assert.equal(metrics.links, IDENTITY_IDS.length, `${locale}: channels`);
      assert(metrics.actionsAboveFold, `${locale}/${theme}/${width}x${height}: primary actions must stay above the fold`);
      frames.push({locale, theme, width, height, ...metrics});
      await capture(`identity-${theme}-${locale}-${width}x${height}`);
    }
    await save('layout-frames.json', frames);
    return {frames: frames.length};
  });

  /* ------------------------------------------------------------------ 8/9 */

  await probe('escape-returns-to-the-workspace', async () => {
    await page.keyboard.press('Escape');
    await page.waitForFunction(
      () => document.querySelector('[data-testid="home-workspace"]') !== null,
      {},
      {timeout: 90000},
    );
    const state = await page.evaluate(() => ({hash: location.hash, identity: !!document.querySelector('[data-testid="identity-page"]')}));
    assert.equal(state.identity, false, 'identity must unmount after Escape');
    return state;
  });

  /* ------------------------------------------------------------------ 9/9 */

  await probe('browser-preview-degrades-honestly', async () => {
    const result = await ctx.unavailableBrowser(async (tab) => {
      const root = tab.locator('[data-testid="identity-page"]');
      await root.waitFor();
      const mode = await root.getAttribute('data-identity-mode');
      assert.equal(mode, 'browser', 'browser preview must advertise itself');
      const bridge = await tab.evaluate(() => typeof window.knouxIdentityV1);
      assert.equal(bridge, 'undefined', 'no native bridge in a browser');
      assert.equal(await tab.locator('li[data-testid^="identity-link-"]').count(), IDENTITY_IDS.length, 'mirror still lists ten channels');
      assert.equal(await tab.locator('[data-testid^="identity-pillar-"]').count(), 4, 'mirror still renders four pillars');
      const footer = (await tab.locator('.id-foot-mode').innerText()).trim();
      assert(/Browser preview/i.test(footer), 'footer must state the browser boundary');
      return {mode, channels: IDENTITY_IDS.length, footer};
    });
    return result;
  });
} catch (error) {
  ctx.fail(error);
} finally {
  await ctx.finish(9);
}
