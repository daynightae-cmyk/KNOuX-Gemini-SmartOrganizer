import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const section = process.argv[2] || 'studio';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = '1';
const folder = path.resolve('../../docs/evidence/visual-sprint', section);
await mkdir(folder, { recursive: true });
const cachedChromium = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const browser = await chromium.launch({ ...(existsSync(cachedChromium) ? { executablePath: cachedChromium } : { channel: 'chrome' }), headless: true });
const observations = [];
try {
  for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width: 1672, height: 941 }, reducedMotion: 'reduce' });
    await context.addInitScript(({ theme }) => {
      localStorage.setItem('knoux_theme', theme);
      localStorage.setItem('knoux_locale', 'en');
      localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
    }, { theme });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:3017/#${section}`, { waitUntil: 'domcontentloaded' });
    await page.locator(`[data-visual-section="${section}"]`).waitFor();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(folder, `${theme}-1672x941.png`), timeout: 15000, animations: 'disabled' });
    const layout = await page.evaluate(() => ({
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      headings: [...document.querySelectorAll('h1')].map(e => e.textContent),
      officialLogoLoaded: [...document.querySelectorAll('img.knx-official-mark')].every(img => img.complete && img.naturalWidth > 0),
      illustrationOverlapsSearch: (() => { const orbit = document.querySelector('.knx-files-orbit'); const field = document.querySelector('[data-testid="files-search"]'); return Boolean(orbit && field && orbit.getBoundingClientRect().bottom > field.getBoundingClientRect().top); })(),
      coveredFields: [...document.querySelectorAll('input,select,textarea')].filter(element => {
        if (!element.offsetParent || element.closest('details:not([open])')) return false;
        const r = element.getBoundingClientRect();
        if (r.width < 5 || r.height < 5 || r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) return false;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit && hit !== element && !element.contains(hit);
      }).map(element => element.getAttribute('data-testid') || element.getAttribute('aria-label') || element.tagName),
    }));
    observations.push({ theme, errors, ...layout });
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(path.join(folder, 'preview.json'), JSON.stringify(observations, null, 2));
console.log(JSON.stringify(observations));
if (observations.some(o => o.errors.length || o.horizontalOverflow || !o.officialLogoLoaded || o.illustrationOverlapsSearch || o.coveredFields.length)) process.exitCode = 1;
