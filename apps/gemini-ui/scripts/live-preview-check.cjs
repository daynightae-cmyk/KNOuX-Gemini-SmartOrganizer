'use strict';
// Attaches only to an already-running canonical Electron renderer. Never
// launches a browser/server, grants a source, reads clipboard data or scans.
const { chromium } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9333', { timeout: 15000 });
  const page = browser.contexts().flatMap(context => context.pages())
    .find(candidate => new URL(candidate.url()).origin === 'http://127.0.0.1:3000');
  if (!page) throw Error('The existing Electron preview was not found.');
  page.setDefaultTimeout(30000);
  const errors = [], warnings = [], requests = [], rows = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
    if (message.type() === 'warning') warnings.push(message.text());
  });
  page.on('requestfailed', request => requests.push({ url: request.url(), error: request.failure()?.errorText }));
  const output = path.resolve(__dirname, '../../../docs/evidence/native-activation-20261102');
  const noScreenshots = process.argv.includes('--no-screenshots');
  await fs.mkdir(output, { recursive: true });
  await page.bringToFront();
  for (const route of ['home', 'smart_scan']) {
    await page.evaluate(route => { location.hash = route; }, route);
    await page.locator(`[data-visual-section="${route}"] main`).waitFor();
    for (const locale of ['en', 'ar']) {
      const current = await page.evaluate(() => document.documentElement.lang);
      if (current !== locale) {
        await page.locator('button').filter({ hasText: /^(English|EN|العربية|عربي)$/ }).click();
      }
      for (const theme of ['dark', 'light']) {
        const currentTheme = await page.evaluate(() => localStorage.getItem('knoux_theme'));
        if (currentTheme !== theme) {
          await page.getByRole('button', { name: /Switch to .* theme|Switch to .* mode|التبديل إلى الوضع/ }).click();
        }
        await page.waitForTimeout(250);
        const filename = `${route}-${theme}-${locale}.png`;
        // Electron's CDP screenshot can stall on its compositor at a theme
        // transition. Do not silently count a missing screenshot as evidence.
        if (!noScreenshots) await page.screenshot({ path: path.join(output, filename), animations: 'disabled', timeout: 45000 });
        rows.push(await page.evaluate(({ route, theme, locale, filename }) => ({
          route, theme, locale, filename, url: location.href,
          viewport: { width: innerWidth, height: innerHeight },
          lang: document.documentElement.lang, dir: document.documentElement.dir,
          actualTheme: localStorage.getItem('knoux_theme'),
          native: typeof window.knouxShell?.getStatus === 'function',
          hmr: Boolean(document.querySelector('script[src="/@vite/client"]')),
          pageOverflow: document.documentElement.scrollHeight - innerHeight,
          horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
          heading: document.querySelector('h1')?.textContent,
        }), { route, theme, locale, filename }));
        if (noScreenshots) rows[rows.length - 1].filename = null;
        await fs.writeFile(path.join(output, 'preview-in-progress.json'), JSON.stringify({ rows, errors, warnings, requests }, null, 2));
      }
    }
  }
  if (await page.evaluate(() => document.documentElement.lang) !== 'en') {
    await page.locator('button').filter({ hasText: /^English$/ }).click();
  }
  if (await page.evaluate(() => localStorage.getItem('knoux_theme')) !== 'dark') {
    await page.getByRole('button', { name: /Switch to .* theme|Switch to .* mode|التبديل إلى الوضع/ }).click();
  }
  await page.evaluate(() => { location.hash = 'home'; });
  await page.locator('[data-visual-section="home"] main').waitFor();
  const result = { observedAt: new Date().toISOString(), scope: 'Existing development Electron, no scan or mutation', rows, errors, warnings: [...new Set(warnings)], requests };
  await fs.writeFile(path.join(output, 'preview-verification.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  process.exit(errors.length || requests.length || rows.some(row => row.dir !== (row.locale === 'ar' ? 'rtl' : 'ltr') || row.actualTheme !== row.theme || !row.native || !row.hmr) ? 1 : 0);
})().catch(error => { console.error(error); process.exit(1); });
