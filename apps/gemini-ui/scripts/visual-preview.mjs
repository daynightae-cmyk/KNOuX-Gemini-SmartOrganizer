import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

// Preview server port is configurable so parallel worktrees can capture
// evidence without fighting for a single dev server.
const previewPort = process.env.KNOX_PREVIEW_PORT || '3017';
const section = process.argv[2] || 'studio';
// Third argument opts into a second, smaller viewport pass for overflow review.
const compact = process.argv[3] === 'compact';
const viewports = compact
  ? [{ width: 1672, height: 941, tag: '1672x941' }, { width: 1366, height: 768, tag: '1366x768' }]
  : [{ width: 1672, height: 941, tag: '1672x941' }];
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = '1';
const folder = path.resolve('../../docs/evidence/visual-sprint', section);
await mkdir(folder, { recursive: true });
const cachedChromium = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const browser = await chromium.launch({ ...(existsSync(cachedChromium) ? { executablePath: cachedChromium } : { channel: 'chrome' }), headless: true });
const observations = [];
try {
  for (const theme of ['dark', 'light']) {
    for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
    await context.addInitScript(({ theme }) => {
      localStorage.setItem('knoux_theme', theme);
      localStorage.setItem('knoux_locale', 'en');
      localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
    }, { theme });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${previewPort}/#${section}`, { waitUntil: 'domcontentloaded' });
    await page.locator(`[data-visual-section="${section}"]`).waitFor();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(folder, `${theme}-${viewport.tag}.png`), timeout: 15000, animations: 'disabled' });
    const layout = await page.evaluate(() => ({
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      headings: [...document.querySelectorAll('h1')].map(e => e.textContent),
      officialLogoLoaded: [...document.querySelectorAll('img.knx-official-mark')].every(img => img.complete && img.naturalWidth > 0),
      // Brand integrity: the approved artwork must be a bare circle. Any opaque
      // tile or hairline behind it re-creates the square backing the brand rules
      // forbid, so it is measured rather than assumed.
      brand: (() => {
        const visible = (el) => Boolean(el) && Boolean(el.offsetParent) && el.getBoundingClientRect().width > 0;
        const emblems = [...document.querySelectorAll('img.knx-circular-mark')].filter(visible);
        const loaded = emblems.filter(img => img.complete && img.naturalWidth > 0);
        const framed = emblems.filter(img => {
          const host = img.parentElement;
          if (!host) return false;
          const s = getComputedStyle(host);
          const opaque = s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent';
          const bordered = parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderLeftWidth) > 0;
          const painted = s.backgroundImage !== 'none';
          return opaque || bordered || painted;
        }).map(img => img.parentElement.getAttribute('class') || img.parentElement.tagName);
        return {
          circularEmblemsVisible: emblems.length,
          circularEmblemsLoaded: loaded.length,
          circularEmblemsSquared: framed,
          lettermarkVisible: [...document.querySelectorAll('.knx-shell-lettermark')].filter(visible).length,
        };
      })(),
      // A panel only fails if real content is cut off. Decorative pseudo-elements
      // are allowed to bleed past an overflow-hidden edge by design.
      clippedPanels: [...document.querySelectorAll('section,[class*="rounded-xl"]')].filter(el => {
        const box = el.getBoundingClientRect();
        if (getComputedStyle(el).overflow === 'visible') return false;
        return [...el.children].some(child => {
          const c = child.getBoundingClientRect();
          return c.height > 0 && c.bottom > box.bottom + 2;
        });
      }).map(el => el.getAttribute('aria-label') || el.getAttribute('data-testid') || el.tagName).slice(0, 8),
      illustrationOverlapsSearch: (() => { const orbit = document.querySelector('.knx-files-orbit'); const field = document.querySelector('[data-testid="files-search"]'); return Boolean(orbit && field && orbit.getBoundingClientRect().bottom > field.getBoundingClientRect().top); })(),
      coveredFields: [...document.querySelectorAll('input,select,textarea')].filter(element => {
        if (!element.offsetParent || element.closest('details:not([open])')) return false;
        const r = element.getBoundingClientRect();
        if (r.width < 5 || r.height < 5 || r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) return false;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit && hit !== element && !element.contains(hit);
      }).map(element => element.getAttribute('data-testid') || element.getAttribute('aria-label') || element.tagName),
    }));
    observations.push({ theme, viewport: viewport.tag, errors, ...layout });
    await context.close();
    }
  }
} finally { await browser.close(); }
await writeFile(path.join(folder, 'preview.json'), JSON.stringify(observations, null, 2));
console.log(JSON.stringify(observations));
// Home is the screen that must carry the circular emblem; other sections keep
// their own already-approved mark treatment and are not gated on it.
const brandFailures = observations.filter(o =>
  o.errors.length || o.horizontalOverflow || !o.officialLogoLoaded || o.illustrationOverlapsSearch || o.coveredFields.length
  || (section === 'home' && (o.brand.circularEmblemsVisible === 0 || o.brand.circularEmblemsLoaded !== o.brand.circularEmblemsVisible || o.brand.circularEmblemsSquared.length > 0))
);
if (brandFailures.length) process.exitCode = 1;
