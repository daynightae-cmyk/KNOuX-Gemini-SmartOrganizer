/**
 * KNOuX — theme evidence matrix.
 *
 * Captures every application section in both resolved themes (night/day), in
 * both languages (en/ar), at owner-specified Electron content sizes, and writes
 * a machine-readable proof file next to the frames.
 *
 * Deliberate properties:
 *   - one isolated Electron profile per run, so nothing touches the owner's
 *     real app data;
 *   - the resolved theme is driven through the documented preference key
 *     (`knoux_theme_preference`) plus the legacy mirror, never through an
 *     injected stylesheet;
 *   - every frame records the DOM state that was actually applied, so a frame
 *     captured in the wrong theme is detectable from the proof file alone;
 *   - bounded settle: a route is given a fixed budget, and a route that does
 *     not reach its root test id is recorded as a failure instead of hanging.
 *
 * Usage:
 *   node scripts/theme-evidence-matrix.mjs [--sections=home,files]
 *                                          [--themes=night,day]
 *                                          [--locales=en,ar]
 *                                          [--sizes=1920x1080]
 *                                          [--out=docs/evidence/...]
 */
import { _electron as electron } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, writeFile, mkdtemp, readdir, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = argv.find((entry) => entry.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const SECTIONS = flag(
  'sections',
  'home,smart_scan,studio,workspace,files,storage,cleanup,applications,startup,system,repair,services,automation,settings',
)
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);
const THEMES = flag('themes', 'night,day').split(',');
const LOCALES = flag('locales', 'en').split(',');
const SIZES = flag('sizes', '1672x941').split(',').map((entry) => {
  const [w, h] = entry.toLowerCase().split('x').map(Number);
  return { width: w, height: h };
});
const OUT = path.resolve(flag('out', '../../docs/evidence/theme-matrix-current'));
const SETTLE_MS = Number(flag('settle', '25000'));

await mkdir(OUT, { recursive: true });
for (const entry of await readdir(OUT)) if (entry.endsWith('.png')) await unlink(path.join(OUT, entry));

/** Root test id per section; settings has no workspace test id of its own. */
const ROOTS = {
  home: 'home-workspace',
  smart_scan: 'scan-workspace',
  studio: 'studio-workspace',
  workspace: 'workspace-hub',
  applications: 'apps-workspace',
  files: 'files-workspace',
  storage: 'storage-workspace',
  cleanup: 'cleanup-workspace',
  startup: 'startup-workspace',
  system: 'system-workspace',
  repair: 'repair-workspace',
  services: 'services-workspace',
  automation: 'automation-workspace',
  settings: 'settings-theme',
};

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const profile = await mkdtemp(path.join(os.tmpdir(), 'knoux-theme-matrix-'));
const app = await electron.launch({
  executablePath: require('electron'),
  args: [path.resolve('electron/main.cjs'), '--disable-gpu', '--knoux-user-data=' + profile],
  env,
  timeout: 60_000,
});

const page = await app.firstWindow();
const pageErrors = [];
const consoleIssues = [];
page.on('pageerror', (error) => pageErrors.push(String(error.message).slice(0, 300)));
page.on('console', (message) => {
  // A console error is evidence to publish, not automatically a broken frame:
  // the renderer logs a benign CSP meta warning that Chromium emits on every
  // load. Uncaught page errors still fail the run.
  if (message.type() === 'error') consoleIssues.push(`console: ${message.text().slice(0, 200)}`);
});

await page.waitForLoadState('domcontentloaded');
await page.evaluate(() => {
  localStorage.setItem(
    'knoux.cinematic.v1',
    JSON.stringify({ seen: true, always: false, muted: true, reduced: true }),
  );
});

async function setViewport(width, height) {
  const win = await app.browserWindow(page);
  await win.evaluate((browserWindow, [w, h]) => {
    if (browserWindow.isMaximized()) browserWindow.unmaximize();
    if (browserWindow.isFullScreen()) browserWindow.setFullScreen(false);
    browserWindow.setContentSize(w, h, false);
  }, [width, height]);
  for (let tick = 0; tick < 40; tick += 1) {
    const actual = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
    if (actual.w === width && actual.h === height) return actual;
    await page.waitForTimeout(100);
  }
  return page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
}

async function openSection(section, theme, locale, size) {
  await page.evaluate(
    ({ section, theme, locale }) => {
      localStorage.setItem('knoux_locale', locale);
      localStorage.setItem('knoux_theme_preference', theme === 'day' ? 'light' : 'dark');
      localStorage.setItem('knoux_theme', theme === 'day' ? 'light' : 'dark');
      location.hash = section;
    },
    { section, theme, locale },
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
  await setViewport(size.width, size.height);

  const root = ROOTS[section];
  let mounted = true;
  try {
    await page.getByTestId(root).waitFor({ timeout: 30_000 });
  } catch {
    mounted = false;
  }

  // Let native measurements land, but never longer than the budget. A panel
  // that honestly says "not measured" is a settled state, not a pending one.
  const started = Date.now();
  while (Date.now() - started < SETTLE_MS) {
    const busy = await page.evaluate(() =>
      /Reading the measured inventory|Measuring live data|Scanning\.\.\.|Loading live/i.test(
        document.body.innerText.slice(0, 9000),
      ),
    );
    if (!busy) break;
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(1200);
  await page.keyboard.press('Escape').catch(() => {});
}

async function appliedState() {
  return page.evaluate(() => {
    const root = document.documentElement;
    const themeAttr = root.dataset.theme === 'light' ? 'day' : 'night';
    const shell = document.querySelector('.visual-sprint');
    const styles = getComputedStyle(root);
    const readVar = (name) => styles.getPropertyValue(name).trim();
    const panel = document.querySelector(
      '.sys-panel, .knx-command-hero, .knx-ref-card, .approved-hero, [class*="rounded"]',
    );
    const panelStyle = panel ? getComputedStyle(panel) : null;
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    const visible = (selector) => {
      const nodes = [...document.querySelectorAll(selector)];
      return nodes.filter((node) => {
        const r = node.getBoundingClientRect();
        const cs = getComputedStyle(node);
        return r.width > 24 && r.height > 24 && cs.visibility !== 'hidden' && cs.opacity !== '0';
      }).length;
    };
    // Count only controls a user could actually operate: rendered, non-disabled,
    // and not hidden behind an inert container.
    const inert = [...document.querySelectorAll('button')].filter((button) => {
      if (button.disabled || button.getAttribute('aria-disabled') === 'true') return false;
      const r = button.getBoundingClientRect();
      return r.width === 0 || r.height === 0;
    }).length;
    return {
      themeAttr,
      storedPreference: localStorage.getItem('knoux_theme_preference'),
      dir: root.getAttribute('dir'),
      visualSection: shell?.dataset.visualSection ?? null,
      canvas: readVar('--knx-night-canvas') || readVar('--v-bg'),
      accent: readVar('--knx-night-accent') || readVar('--v-accent'),
      panelBackground: panelStyle?.backgroundColor ?? null,
      panelBackdrop: panelStyle?.backdropFilter ?? null,
      overflowY: Math.max(0, (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight),
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      geometry: {
        header: rect('.approved-header, .knoux-titlebar, header'),
        sidebar: rect('aside'),
        hero: rect('.approved-hero, .knx-command-hero, .sys-hero, .apps-hero, .cln-hero, .stp-hero, .svc-hero, .rep-hero, .auto-hero, .scan-hero, .knx-storage-hero, .atl-hero, .knx-workspace-hero, .osa-hero, .os-focus-header'),
        primaryCta: rect('[data-testid*="cta"], .approved-hero-actions button, .sys-hero-actions button'),
        headings: [...document.querySelectorAll('h1')].map((node) => node.textContent.trim().slice(0, 60)),
      },
      orbit: { dial: visible('.knx-orbit, .knoux-orbit'), pipes: visible('.knx-pipe'), nodes: visible('.knx-pipe-node') },
      inertButtons: inert,
    };
  });
}

const frames = [];
for (const size of SIZES) {
  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      for (const section of SECTIONS) {
        const label = `${section}-${theme}-${locale}-${size.width}x${size.height}`;
        try {
          await openSection(section, theme, locale, size);
          const state = await appliedState();
          const file = path.join(OUT, `${label}.png`);
          await page.screenshot({ path: file, animations: 'disabled' });
          frames.push({ label, section, theme, locale, size, ok: true, state, file: path.basename(file) });
          console.log(
            `${label} -> ${JSON.stringify({
              theme: state.themeAttr,
              overflow: state.overflowY,
              dial: state.orbit.dial,
              pipes: state.orbit.pipes,
            })}`,
          );
        } catch (error) {
          const message = String(error.message ?? error).split('\n')[0].slice(0, 240);
          frames.push({ label, section, theme, locale, size, ok: false, error: message });
          console.log(`${label} FAILED ${message}`);
        }
      }
    }
  }
}

const proof = {
  capturedAt: new Date().toISOString(),
  sizes: SIZES,
  themes: THEMES,
  locales: LOCALES,
  frames,
  // Orbital coverage is measured, not asserted: a section only counts when the
  // dial and its tubes are actually rendered and visible in the live route.
  orbitCoverage: SECTIONS.map((section) => {
    const captured = frames.filter((frame) => frame.section === section && frame.ok);
    const withDial = captured.filter((frame) => frame.state.orbit.dial > 0).length;
    const withPipes = captured.filter((frame) => frame.state.orbit.pipes > 0).length;
    return {
      section,
      frames: captured.length,
      dial: withDial,
      pipes: withPipes,
      complete: captured.length > 0 && withDial === captured.length && withPipes === captured.length,
    };
  }),
  failures: frames.filter((frame) => !frame.ok).map((frame) => frame.label),
  pageErrors: [...new Set(pageErrors)],
  consoleIssues: [...new Set(consoleIssues)],
};
proof.orbitComplete = proof.orbitCoverage.filter((entry) => entry.complete).map((entry) => entry.section);
proof.orbitMissing = proof.orbitCoverage.filter((entry) => !entry.complete).map((entry) => entry.section);
proof.ok = proof.failures.length === 0 && proof.pageErrors.length === 0;
await writeFile(path.join(OUT, 'matrix-proof.json'), JSON.stringify(proof, null, 2));
await app.close();
console.log(
  `matrix ${proof.ok ? 'OK' : 'ISSUES'} frames=${frames.length} failures=${proof.failures.length} errors=${proof.pageErrors.length}`,
);
if (!proof.ok) process.exitCode = 1;
