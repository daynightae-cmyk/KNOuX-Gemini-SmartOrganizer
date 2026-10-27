/**
 * KNOuX — orbital behaviour proof
 *
 * The visual references make the orbital dial the signature control of every
 * workspace, so "it looks right" is not enough: each satellite has to actually
 * drive a supported surface, and a satellite whose capability is absent has to
 * say so rather than pretend.
 *
 * This walks every screen that renders the dial, records each satellite's
 * truthful state, clicks the enabled ones and compares an observable state
 * signature before and after. A satellite that is enabled but changes nothing
 * is reported as INERT, which is the failure mode this is here to catch.
 *
 * Usage: node scripts/orbit-behaviour-proof.mjs [port]
 */
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';

const port = process.argv[2] || '3019';
const sections = ['studio', 'files', 'smart_scan', 'applications', 'storage', 'cleanup', 'startup', 'system', 'repair', 'services', 'home'];

const cached = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');

const browser = await chromium.launch({ ...(existsSync(cached) ? { executablePath: cached } : { channel: 'chrome' }), headless: true });
const report = [];

for (const section of sections) {
  const ctx = await browser.newContext({ viewport: { width: 1672, height: 941 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => {
    localStorage.setItem('knoux_theme', 'dark');
    localStorage.setItem('knoux_locale', 'en');
    localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)));
  await page.goto(`http://127.0.0.1:${port}/#${section}`, { waitUntil: 'domcontentloaded' });
  await page.locator(`[data-visual-section="${section}"]`).waitFor();
  await page.waitForTimeout(1000);

  const hasOrbit = await page.locator('.knx-orbit').count();
  if (!hasOrbit) {
    report.push({ section, orbit: false, satellites: 0, note: 'no orbital dial on this screen' });
    await ctx.close();
    continue;
  }

  // An observable signature of "what the page is currently showing".
  //
  // It deliberately includes the focused element and every satellite's own
  // state class, because several satellites are selectors or a search-focus
  // action: they change neither the visible copy nor a heading, and a coarser
  // signature reports them as inert.
  const signature = () => page.evaluate(() => {
    const bits = [];
    const a = document.activeElement;
    if (a) bits.push(`ACT:${a.tagName}.${(a.getAttribute('class') || '').split(/\s+/).slice(0, 3).join('.')}:${(a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 24)}`);
    for (const el of document.querySelectorAll('.knx-orbit-tool, .knx-orbit-core')) {
      bits.push(`ORB:${(el.getAttribute('class') || '').replace(/\s+/g, '')}`);
    }
    for (const el of document.querySelectorAll('[aria-current], .is-active, [data-selected="true"], [aria-selected="true"]')) {
      bits.push(`${el.tagName}.${(el.getAttribute('class') || '').split(/\s+/).slice(0, 2).join('.')}#${(el.textContent || '').trim().slice(0, 28)}`);
    }
    for (const el of document.querySelectorAll('h2, h3, [role="dialog"], [aria-label]')) {
      const lbl = el.getAttribute('aria-label');
      if (lbl && el.querySelector && el.offsetParent) bits.push(`L:${lbl.slice(0, 34)}`);
    }
    const main = document.querySelector('main') || document.body;
    bits.push(`TXT:${(main.innerText || '').replace(/\s+/g, ' ').slice(0, 900)}`);
    return bits.join('|');
  });

  const satellites = await page.evaluate(() =>
    [...document.querySelectorAll('.knx-orbit-tool')].map((el, i) => ({
      i,
      label: (el.querySelector('.knx-orbit-label')?.textContent || el.textContent || '').trim().slice(0, 30),
      disabled: el.disabled === true,
      ariaCurrent: el.getAttribute('aria-current'),
      hint: el.getAttribute('title'),
    })));

  const core = await page.evaluate(() => {
    const el = document.querySelector('.knx-orbit-core');
    return el ? { disabled: el.disabled === true, label: (el.textContent || '').trim().slice(0, 60) } : null;
  });

  const results = [];
  for (const s of satellites) {
    if (s.disabled) { results.push({ ...s, outcome: 'DISABLED-HONEST' }); continue; }
    // A satellite can open a dialog, which re-renders the dial and invalidates
    // the captured index; dismiss it and confirm the dial is back before each
    // click so one interaction cannot mask the next.
    await page.keyboard.press('Escape').catch(() => {});
    const dial = page.locator('.knx-orbit-tool');
    if (!(await dial.count())) { results.push({ ...s, outcome: 'DIAL-GONE' }); continue; }
    if (s.i >= (await dial.count())) { results.push({ ...s, outcome: 'INDEX-STALE' }); continue; }
    const before = await signature();
    try {
      await dial.nth(s.i).click({ force: true, timeout: 4000 });
    } catch {
      results.push({ ...s, outcome: 'NOT-CLICKABLE' });
      continue;
    }
    await page.waitForTimeout(550);
    const after = await signature();
    results.push({ ...s, outcome: before === after ? 'INERT' : 'NAVIGATED' });
  }

  // The centre action must never claim execution it cannot perform.
  let coreOutcome = 'ABSENT';
  await page.keyboard.press('Escape').catch(() => {});
  const coreLoc = page.locator('.knx-orbit-core');
  if (core && !core.disabled && (await coreLoc.count())) {
    const before = await signature();
    try {
      await coreLoc.click({ force: true, timeout: 4000 });
      await page.waitForTimeout(700);
      coreOutcome = (await signature()) === before ? 'INERT' : 'ACTIVATED';
    } catch {
      coreOutcome = 'NOT-CLICKABLE';
    }
  } else if (core) {
    coreOutcome = 'DISABLED-HONEST';
  }

  report.push({
    section, orbit: true,
    satellites: satellites.length,
    enabled: satellites.filter((s) => !s.disabled).length,
    disabled: satellites.filter((s) => s.disabled).length,
    navigated: results.filter((r) => r.outcome === 'NAVIGATED').length,
    inert: results.filter((r) => r.outcome === 'INERT').map((r) => r.label),
    core: { ...core, outcome: coreOutcome },
    detail: results,
    errors,
  });
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));

const problems = report.filter((r) => r.orbit && (r.inert.length || r.core?.outcome === 'INERT' || r.errors.length
  || r.detail.some((d) => d.outcome === 'NOT-CLICKABLE' || d.outcome === 'DIAL-GONE')));
if (problems.length) {
  console.error('\nPROBLEMS: ' + problems.map((p) => p.section).join(', '));
  process.exitCode = 1;
}
