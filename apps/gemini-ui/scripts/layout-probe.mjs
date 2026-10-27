import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';

const theme = process.argv[2] || 'light';
const section = process.argv[3] || 'services';
const selector = process.argv[4] || '.svc-kpi';
const cached = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const browser = await chromium.launch({ ...(existsSync(cached) ? { executablePath: cached } : { channel: 'chrome' }), headless: true });
const ctx = await browser.newContext({ viewport: { width: 1672, height: 941 }, reducedMotion: 'reduce' });
await ctx.addInitScript(({ theme }) => {
  localStorage.setItem('knoux_theme', theme);
  localStorage.setItem('knoux_locale', 'en');
  localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
}, { theme });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:3017/#${section}`, { waitUntil: 'domcontentloaded' });
await page.locator(`[data-visual-section="${section}"]`).waitFor();
await page.waitForTimeout(1000);
const out = await page.evaluate((sel) => {
  const describe = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const chain = [];
    let p = el.parentElement, depth = 0;
    while (p && depth < 4) { const ps = getComputedStyle(p); chain.push(`${p.className || p.tagName} h=${Math.round(p.getBoundingClientRect().height)} display=${ps.display} align=${ps.alignItems} rows=${ps.gridTemplateRows}`); p = p.parentElement; depth++; }
    return {
      tag: el.tagName, cls: el.className, box: { w: Math.round(r.width), h: Math.round(r.height) },
      minHeight: cs.minHeight, height: cs.height, alignSelf: cs.alignSelf, marginTop: cs.marginTop,
      parents: chain,
    };
  };
  return [...document.querySelectorAll(sel)].slice(0, 3).map(describe);
}, selector);
console.log(JSON.stringify(out, null, 2));
await browser.close();
