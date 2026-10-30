/**
 * KNOuX — compact current-state visual pass over the eleven owner references.
 *
 * One isolated-profile Electron run against the built renderer. Captures the
 * ten referenced routes in the reference language (EN, LTR) at 1672x941 in
 * their reference theme. This is a delta-finding pass, not a full evidence
 * matrix: one frame per route, no service-level sweeps.
 */
import { _electron as electron } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, writeFile, mkdtemp, readdir, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const OUT = path.resolve('../../docs/evidence/visual-pass-20261030');
await mkdir(OUT, { recursive: true });
for (const entry of await readdir(OUT)) {
  if (entry.endsWith('.png')) await unlink(path.join(OUT, entry));
}

const ROUTES = [
  { section: 'home', root: 'home-workspace', theme: 'light' },
  { section: 'studio', root: 'studio-workspace', theme: 'light' },
  { section: 'workspace', root: 'workspace-hub', theme: 'light' },
  { section: 'startup', root: 'startup-workspace', theme: 'light' },
  { section: 'smart_scan', root: 'scan-workspace', theme: 'light' },
  { section: 'applications', root: 'apps-workspace', theme: 'dark' },
  { section: 'services', root: 'services-workspace', theme: 'dark' },
  { section: 'repair', root: 'repair-workspace', theme: 'dark' },
  { section: 'system', root: 'system-workspace', theme: 'dark' },
  { section: 'automation', root: 'automation-workspace', theme: 'dark' },
];

const profile = await mkdtemp(path.join(os.tmpdir(), 'knoux-visual-pass-'));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const app = await electron.launch({
  executablePath: require('electron'),
  args: [path.resolve('electron/main.cjs'), '--disable-gpu', '--knoux-user-data=' + profile],
  env,
  timeout: 60000,
});

const proof = { capturedAt: new Date().toISOString(), frames: [], errors: [] };

const page = await app.firstWindow();
page.on('pageerror', (e) => proof.errors.push(String(e.message).slice(0, 300)));
await page.waitForLoadState('domcontentloaded');
await page.evaluate(() => {
  localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
});

async function setViewport(width, height) {
  const w = await app.browserWindow(page);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await w.evaluate((win, [ww, hh]) => {
      if (win.isMaximized()) win.unmaximize();
      if (win.isFullScreen()) win.setFullScreen(false);
      win.setContentSize(ww, hh, false);
    }, [width, height]);
    let actual = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
    for (let tick = 0; tick < 25 && (actual.w !== width || actual.h !== height); tick += 1) {
      await page.waitForTimeout(120);
      actual = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
    }
    if (actual.w === width && actual.h === height) return;
  }
  throw new Error('viewport did not settle');
}

for (const { section, root, theme } of ROUTES) {
  await page.evaluate(({ section, theme }) => {
    localStorage.setItem('knoux_locale', 'en');
    localStorage.setItem('knoux_theme', theme);
    location.hash = section;
  }, { section, theme });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByTestId(root).waitFor({ timeout: 45000 });
  // Settle: wait until no domain is still publishing a native measurement.
  // "Not measured" is a settled state, so it must not count as progress.
  const started = Date.now();
  while (Date.now() - started < 120000) {
    const state = await page.evaluate(() => ({
      scanning:
        Boolean(document.querySelector('[data-testid$="-scan-progress"]')) ||
        /Reading the measured inventory…|Reading the measured inventory\.\.\.|Awaiting measured|Measuring live data|Start discovery/i.test(document.body.innerText.slice(0, 8000)),
    }));
    if (!state.scanning && Date.now() - started > 4000) break;
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => {});
  await setViewport(1672, 941);
  await page.waitForTimeout(700);
  const file = path.join(OUT, `${section}-en-${theme}-1672.png`);
  await page.screenshot({ path: file, animations: 'disabled' });
  const applied = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
    dir: document.documentElement.getAttribute('dir'),
    scrollHeight: document.scrollingElement?.scrollHeight ?? 0,
    innerHeight: window.innerHeight,
  }));
  proof.frames.push({ section, theme, file: path.basename(file), applied });
  console.log(`${section}: ${file} ${JSON.stringify(applied)}`);
}

proof.ok = proof.errors.length === 0;
await writeFile(path.join(OUT, 'visual-pass-proof.json'), JSON.stringify(proof, null, 2));
await app.close();
console.log('done', proof.ok ? 'OK' : 'WITH ERRORS', JSON.stringify(proof.errors));
