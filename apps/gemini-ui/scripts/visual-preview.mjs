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
      // Brand integrity: the approved artwork must sit on a bare, transparent
      // field. Any opaque tile or hairline behind it re-creates the square
      // backing the brand rules forbid, so it is measured rather than assumed.
      //
      // This is deliberately emblem-agnostic: Home renders .knx-circular-mark
      // while the reference-shell screens (including Services) render the
      // ribbon mark, and both must be square-backing free.
      brand: (() => {
        const visible = (el) => Boolean(el) && Boolean(el.offsetParent) && el.getBoundingClientRect().width > 0;
        const emblems = [...document.querySelectorAll('img.knx-circular-mark, img.knx-shell-ribbonmark, img.knx-official-mark')].filter(visible);
        const loaded = emblems.filter(img => img.complete && img.naturalWidth > 0);
        const squaredHosts = [...document.querySelectorAll('.knx-title-brand-emblem, .knx-sidebar-brand-emblem')].filter(visible).filter(host => {
          const s = getComputedStyle(host);
          const opaque = s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent';
          const bordered = parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderLeftWidth) > 0;
          const painted = s.backgroundImage !== 'none';
          return opaque || bordered || painted;
        }).map(host => (host.getAttribute('class') || '').slice(0, 60));
        return {
          emblemsVisible: emblems.length,
          emblemsLoaded: loaded.length,
          squaredEmblemHosts: squaredHosts,
          lettermarkVisible: [...document.querySelectorAll('.knx-shell-lettermark')].filter(visible).length,
        };
      })(),
      // A panel only fails if real content is cut off. Decorative pseudo-elements
      // are allowed to bleed past an overflow-hidden edge by design, and a host
      // with no rendered area (display:contents, a collapsed or hidden variant)
      // cannot clip anything a user can see.
      clippedPanels: [...document.querySelectorAll('section,[class*="rounded-xl"]')].filter(el => {
        const box = el.getBoundingClientRect();
        if (getComputedStyle(el).overflow === 'visible') return false;
        if (box.width < 2 || box.height < 2) return false;
        return [...el.children].some(child => {
          const c = child.getBoundingClientRect();
          return c.height > 0 && c.bottom > box.bottom + 2;
        });
      }).map(el => el.getAttribute('aria-label') || el.getAttribute('data-testid') || `${el.tagName}.${(el.getAttribute('class') || '').slice(0, 40)}`),
      // The orbital dial is the signature control, so its theme tokens are
      // asserted rather than eyeballed: a night dial that silently keeps the
      // daylight palette is the failure this catches.
      //
      // Visibility is measured too, not just presence. Counting satellites in
      // the DOM reported six dials that were display:none below a 1370-1500px
      // breakpoint, i.e. absent at the 1366x768 viewport while still "present".
      orbit: (() => {
        const el = document.querySelector('.knx-orbit');
        if (!el) return null;
        const core = document.querySelector('.knx-orbit-core');
        const cs = getComputedStyle(el);
        const tools = [...document.querySelectorAll('.knx-orbit-tool')];
        const toolsVisible = tools.filter(t => t.offsetParent !== null && t.getBoundingClientRect().width > 0);
        return {
          ink: cs.getPropertyValue('--orbit-ink').trim(),
          coreBg: core ? getComputedStyle(core).backgroundImage.slice(0, 60) : null,
          display: cs.display,
          visible: el.offsetParent !== null,
          satellites: tools.length,
          satellitesVisible: toolsVisible.length,
          disabledSatellites: tools.filter(b => b.disabled).length,
        };
      })(),
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
// Home and Services are the two screens the brand review calls out by name, so
// both must show a loaded emblem with no square backing. The remaining sections
// keep their own already-approved mark treatment and are not gated on it.
const brandGated = ['home', 'services'];
const brandFailures = observations.filter(o =>
  o.errors.length || o.horizontalOverflow || !o.officialLogoLoaded || o.illustrationOverlapsSearch || o.coveredFields.length
  || (brandGated.includes(section) && (o.brand.emblemsVisible === 0 || o.brand.emblemsLoaded !== o.brand.emblemsVisible || o.brand.squaredEmblemHosts.length > 0))
);
// Any screen that shows a dial must not show a squared emblem host either.
const squareBacked = observations.filter(o => o.brand.squaredEmblemHosts.length > 0);
// A dial that exists in the DOM but is hidden, or that has lost satellites at a
// viewport we evidence, is a silent loss of navigation rather than a pass.
const dialHidden = observations.filter(o => o.orbit && (!o.orbit.visible || o.orbit.satellitesVisible !== o.orbit.satellites));
if (brandFailures.length || squareBacked.length || dialHidden.length) process.exitCode = 1;
if (dialHidden.length) {
  console.error('HIDDEN DIAL: ' + dialHidden.map(o => `${o.theme}/${o.viewport} ${o.orbit.satellitesVisible}/${o.orbit.satellites}`).join(', '));
}
