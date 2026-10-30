// Browser-preview layout probe for the cinematic entry (Chromium, not Electron).
// Requires the Vite dev server on http://127.0.0.1:3000. Proves 125% / 150% zoom
// keeps the real CTA above the fold in both themes and photographs FORMING.
import { chromium } from '@playwright/test';
const OUT = 'visual-evidence/cinematic-entry-layout';
const browser = await chromium.launch();

const open = async (width, height, theme, dpr = 1) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
  await page.addInitScript(({ theme }) => {
    localStorage.setItem('knoux_locale', 'en');
    localStorage.setItem('knoux_theme', theme);
    localStorage.removeItem('knoux.cinematic.v1');
  }, { theme });
  await page.goto('http://127.0.0.1:3000/');
  return page;
};

const measure = (page, name) => page.evaluate((name) => {
  const cta = document.querySelector('.entry-enter').getBoundingClientRect();
  const title = document.querySelector('.entry-headline').getBoundingClientRect();
  const doc = document.documentElement;
  return { name, sw: doc.scrollWidth, iw: doc.clientWidth, sh: doc.scrollHeight, ih: doc.clientHeight,
    cta: { top: Math.round(cta.top), bottom: Math.round(cta.bottom) }, titleTop: Math.round(title.top),
    compact: matchMedia('(max-height: 600px)').matches };
}, name);

const probe = async (width, height, dpr, name, theme) => {
  const page = await open(width, height, theme, dpr);
  await page.locator('.cinematic-boundary[data-phase=READY]').waitFor({ timeout: 30000 });
  const m = await measure(page, name);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await page.close();
  return { ...m, ctaVisible: m.cta.top > 0 && m.cta.bottom < m.ih, noH: m.sw === m.iw, noV: m.sh === m.ih };
};

for (const theme of ['dark', 'light']) {
  console.log(JSON.stringify(await probe(1093, 614, 1.25, `preview-zoom125-1366-${theme}`, theme)));
  console.log(JSON.stringify(await probe(911, 512, 1.5, `preview-zoom150-1366-${theme}`, theme)));
}

const forming = await open(1672, 941, 'light');
await forming.locator('.cinematic-boundary[data-phase=FORMING]').waitFor({ timeout: 30000 });
await forming.waitForTimeout(900);
await forming.screenshot({ path: `${OUT}/preview-forming-1672-en-light.png` });
await forming.close();

await browser.close();
