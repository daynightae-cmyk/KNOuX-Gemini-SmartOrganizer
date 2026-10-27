import { chromium } from '@playwright/test';
import path from 'node:path';
const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe'), headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1672, height: 941 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => { localStorage.setItem('knoux_theme', 'light'); localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true })); });
  await page.goto('http://127.0.0.1:3017/#studio');
  await page.locator('.knx-reference-orbit-core').waitFor();
  console.log(await page.evaluate(() => ['.knx-studio-reference','.knx-ref-intro','.knx-reference-orbit-core','.knx-reference-orbit-core > svg','.knx-reference-orbit-core strong'].map(selector => {
    const element = document.querySelector(selector); const style = getComputedStyle(element); const rect = element.getBoundingClientRect();
    return { selector, text: element.textContent.slice(0,60), background: style.background, color: style.color, opacity: style.opacity, visibility: style.visibility, zIndex: style.zIndex, rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height } };
  })));
  await page.getByRole('button', { name: 'Build Organization Plan', exact: true }).first().click();
  await page.locator('[data-testid="studio-reference-overview"]').waitFor({ state: 'detached' });
  await page.getByRole('button', { name: '← Organization overview' }).click();
  await page.locator('[data-testid="studio-reference-overview"]').waitFor();
  await page.locator('.knx-ref-rules select').first().selectOption('category');
  await page.locator('.knx-ref-card-head button').filter({ hasText: 'All options' }).click();
  await page.getByRole('button', { name: '← Organization overview' }).click();
  if (await page.locator('.knx-ref-rules select').first().inputValue() !== 'category') throw new Error('Rule selection was lost');
  console.log('PASS: plan workbench, overview return, rule state continuity');
} finally { await browser.close(); }
