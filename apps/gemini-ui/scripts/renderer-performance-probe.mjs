/**
 * KNOuX — renderer performance probe.
 *
 * The glass pass adds translucency and backdrop blur, so "it looks right" is not
 * enough: the material has to be affordable. This measures what the owner can
 * actually feel, inside real Electron, on the routes that were changed.
 *
 * Per route it records:
 *   - frame pacing: the distribution of requestAnimationFrame deltas over a
 *     fixed observation window, reported as p50/p95 and the share of frames that
 *     missed a 60 Hz budget;
 *   - long tasks: count and worst duration, via PerformanceObserver;
 *   - JS heap: taken before and after the window, so a leak during idle shows up
 *     as growth rather than as a reassuring single sample;
 *   - the count of elements that actually composite a backdrop filter, because
 *     that is the cost the glass recipe buys.
 *
 * It is read-only: an isolated profile, no permission grant, no native effect.
 *
 * Usage: node scripts/renderer-performance-probe.mjs [--sections=a,b]
 *                                                     [--themes=night,day]
 *                                                     [--ms=3000]
 */
import { _electron as electron } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = argv.find((entry) => entry.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const SECTIONS = flag('sections', 'home,smart_scan,studio,workspace,files,storage,cleanup,applications,startup,system,repair,services,automation,settings')
  .split(',').map((entry) => entry.trim()).filter(Boolean);
const THEMES = flag('themes', 'night,day').split(',');
const WINDOW_MS = Number(flag('ms', '3000'));
const OUT = path.resolve(flag('out', '../../docs/evidence/performance-current'));
const SETTLE_MS = Number(flag('settle', '20000'));

mkdirSync(OUT, { recursive: true });

const ROOTS = {
  home: 'home-workspace', smart_scan: 'scan-workspace', studio: 'studio-workspace',
  workspace: 'workspace-hub', applications: 'apps-workspace', files: 'files-workspace',
  storage: 'storage-workspace', cleanup: 'cleanup-workspace', startup: 'startup-workspace',
  system: 'system-workspace', repair: 'repair-workspace', services: 'services-workspace',
  automation: 'automation-workspace', settings: 'settings-theme',
};

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const profile = mkdtempSync(path.join(os.tmpdir(), 'knoux-perf-'));
const app = await electron.launch({
  executablePath: require('electron'),
  args: [path.resolve('electron/main.cjs'), '--js-flags=--expose-gc', '--knoux-user-data=' + profile],
  env,
  timeout: 60_000,
});
const page = await app.firstWindow();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error.message).slice(0, 240)));
await page.waitForLoadState('domcontentloaded');
await page.evaluate(() => {
  localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
});

const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return Number(sorted[Math.min(sorted.length - 1, Math.floor((sorted.length * p) / 100))].toFixed(2));
};

async function measure(section, theme) {
  await page.evaluate(({ section, theme }) => {
    localStorage.setItem('knoux_locale', 'en');
    localStorage.setItem('knoux_theme_preference', theme === 'day' ? 'light' : 'dark');
    localStorage.setItem('knoux_theme', theme === 'day' ? 'light' : 'dark');
    location.hash = section;
  }, { section, theme });
  await page.reload({ waitUntil: 'domcontentloaded' });
  try {
    await page.getByTestId(ROOTS[section]).waitFor({ timeout: 30_000 });
  } catch {
    return { section, theme, ok: false, error: 'root did not mount' };
  }

  const started = Date.now();
  while (Date.now() - started < SETTLE_MS) {
    const busy = await page.evaluate(() =>
      /Reading the measured inventory|Measuring live data|Scanning\.\.\.|Loading live|Bounded scan in progress/i.test(
        document.body.innerText.slice(0, 9000),
      ));
    if (!busy) break;
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(800);

  const heapBefore = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null);
  const stats = await page.evaluate(async ({ windowMs }) => {
    // Runs in the renderer, so it needs its own percentile helper.
    const pct = (values, p) => {
      if (!values.length) return null;
      const sorted = [...values].sort((a, b) => a - b);
      return Number(sorted[Math.min(sorted.length - 1, Math.floor((sorted.length * p) / 100))].toFixed(2));
    };
    const longTasks = [];
    let observer = null;
    try {
      observer = new PerformanceObserver((list) => longTasks.push(...list.getEntries().map((e) => e.duration)));
      observer.observe({ entryTypes: ['longtask'] });
    } catch { /* the browser window may not expose longtask; pacing still tells the story */ }

    const deltas = [];
    let last = performance.now();
    const startedAt = last;
    await new Promise((resolve) => {
      const tick = (now) => {
        deltas.push(now - last);
        last = now;
        if (now - startedAt < windowMs) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    observer?.disconnect();

    const blurred = [...document.querySelectorAll('*')].filter((node) => {
      const value = getComputedStyle(node).backdropFilter || getComputedStyle(node).webkitBackdropFilter;
      return value && value !== 'none' && value.includes('blur');
    }).length;
    const animated = [...document.querySelectorAll('*')].filter((node) => {
      const name = getComputedStyle(node).animationName;
      return name && name !== 'none';
    }).length;

    // Chromium throttles requestAnimationFrame in an occluded or unfocused
    // window, which would otherwise be reported as a slow renderer. Record the
    // visibility the sample was actually taken under so a throttled run is
    // detectable from the artefact instead of being believed.
    const visibility = document.visibilityState;
    const dropped = deltas.slice(1).filter((delta) => delta > 20).length;
    return {
      frames: deltas.length,
      p50: pct(deltas.slice(1), 50),
      p95: pct(deltas.slice(1), 95),
      worst: Number(Math.max(0, ...deltas.slice(1)).toFixed(2)),
      droppedFrames: dropped,
      droppedShare: deltas.length > 1 ? Number((dropped / (deltas.length - 1)).toFixed(3)) : null,
      longTaskCount: longTasks.length,
      longTaskWorst: longTasks.length ? Number(Math.max(...longTasks).toFixed(1)) : 0,
      backdropElements: blurred,
      animatedElements: animated,
      usedJSHeapAfter: performance.memory?.usedJSHeapSize ?? null,
      visibility,
    };
  }, { windowMs: WINDOW_MS });

  const valid = stats.visibility === 'visible';
  return {
    section,
    theme,
    ok: valid,
    invalidReason: valid ? null : `sample taken while ${stats.visibility}`,
    visibility: stats.visibility,
    ...stats,
    heapBefore,
    heapGrowth: stats.usedJSHeapAfter && heapBefore ? stats.usedJSHeapAfter - heapBefore : null,
  };
}

async function prepareWindow(width, height) {
  const win = await app.browserWindow(page);
  await win.evaluate((browserWindow, [w, h]) => {
    if (browserWindow.isMinimized()) browserWindow.restore();
    if (browserWindow.isMaximized()) browserWindow.unmaximize();
    browserWindow.setContentSize(w, h, false);
    browserWindow.show();
    browserWindow.focus();
    browserWindow.moveTop();
  }, [width, height]);
}

const results = [];
await prepareWindow(Number(flag('width', '1672')), Number(flag('height', '941')));
for (const theme of THEMES) {
  for (const section of SECTIONS) {
    await prepareWindow(Number(flag('width', '1672')), Number(flag('height', '941')));
    const entry = await measure(section, theme);
    results.push(entry);
    console.log(
      entry.ok
        ? `${section}/${theme}: p50=${entry.p50}ms p95=${entry.p95}ms dropped=${entry.droppedShare} blur=${entry.backdropElements} anim=${entry.animatedElements} longTasks=${entry.longTaskCount}`
        : `${section}/${theme}: ${entry.error}`,
    );
  }
}

const ok = results.filter((entry) => entry.ok);
const report = {
  capturedAt: new Date().toISOString(),
  electron: { window: 'real Electron, GPU enabled', observationMs: WINDOW_MS },
  results,
  summary: {
    routes: ok.length,
    worstP95: Math.max(...ok.map((entry) => entry.p95 ?? 0)),
    worstDroppedShare: Math.max(...ok.map((entry) => entry.droppedShare ?? 0)),
    maxBackdropElements: Math.max(...ok.map((entry) => entry.backdropElements ?? 0)),
    routesOverBudget: ok.filter((entry) => (entry.p95 ?? 0) > 33).map((entry) => `${entry.section}/${entry.theme}`),
    invalidSamples: results.filter((entry) => !entry.ok).map((entry) => `${entry.section}/${entry.theme}: ${entry.error ?? entry.invalidReason}`),
    heapGrowthBytes: Math.max(...ok.map((entry) => entry.heapGrowth ?? 0)),
  },
  pageErrors: [...new Set(pageErrors)],
};
report.ok = report.summary.routesOverBudget.length === 0 && report.pageErrors.length === 0;

const file = path.join(OUT, 'performance-proof.json');
writeFileSync(file, JSON.stringify(report, null, 2));
await app.close();
console.log(`performance ${report.ok ? 'OK' : 'OVER BUDGET'} -> ${file}`);
console.log(JSON.stringify(report.summary));
if (!report.ok) process.exitCode = 1;
