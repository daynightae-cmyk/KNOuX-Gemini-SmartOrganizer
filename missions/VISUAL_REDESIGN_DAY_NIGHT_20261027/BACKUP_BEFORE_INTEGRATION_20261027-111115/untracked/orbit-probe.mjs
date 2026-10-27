import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';

const theme = process.argv[2] || 'light';
const section = process.argv[3] || 'studio';
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
await page.waitForTimeout(1200);

const probe = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      sel, color: cs.color, bg: cs.backgroundColor, bgImage: cs.backgroundImage.slice(0, 90),
      font: cs.fontSize, weight: cs.fontWeight, colorVar: cs.getPropertyValue('--orbit-ink').trim(),
      box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  };
  const orbit = document.querySelector('.knx-orbit');
  const core = document.querySelector('.knx-orbit-core');
  return {
    orbitBox: orbit ? orbit.getBoundingClientRect().toJSON() : null,
    coreScroll: core ? { sw: core.scrollWidth, cw: core.clientWidth, sh: core.scrollHeight, ch: core.clientHeight } : null,
    label: pick('.knx-orbit-label'),
    coreStrong: pick('.knx-orbit-core strong'),
    play: pick('.knx-orbit-play'),
    chip: pick('.knx-orbit-chip'),
    satellites: [...document.querySelectorAll('.knx-orbit-tool')].map(el => {
      const r = el.getBoundingClientRect();
      return { label: el.textContent.trim().slice(0, 22), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }),
  };
});
console.log(JSON.stringify(probe, null, 2));
await browser.close();
