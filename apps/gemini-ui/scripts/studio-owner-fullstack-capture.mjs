/**
 * KNOuX Organization Studio — current-HEAD owner evidence capture.
 *
 * Deterministic, isolated-profile Electron run against the BUILT renderer
 * (dist/). It authorizes only a temporary controlled fixture, scans it with
 * the real native inventory, then captures the overview and each of the nine
 * Studio service workstations in DAY/NIGHT and EN/AR at the owner viewports.
 *
 * It performs NO move/undo and touches NO owner data. Functional move/undo
 * proof lives in live-organization-test.cjs / studio-exec-test.cjs.
 */
import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { fixture, sha } = require('./live-organization-fixtures.cjs');

const OUT = path.resolve(process.env.KNOUX_STUDIO_CAPTURE_DIR || '../../docs/evidence/owner-fullstack-20261030/studio-current');
await mkdir(OUT, { recursive: true });

const f = await fixture(40);
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIAAAABgCAYAAADVenpJAAABL0lEQVR4nO3SMRHAMAwEsALrXC7m0jk0CsJLWLkw/nKnQQx03c+epApbYR12CSCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAghwdoDak1RhK6zDBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQ4PMC7J6nCVliHCSCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIIAAAggggAACCCCAAAIIIIAAAghweIBvT1KFrhAOE0AAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBgTg7wA30LN72IacZYAAAAAElFTkSuQmCC', 'base64');
await writeFile(path.join(f.source, 'item-00.png'), PNG);
f.originals['item-00.png'] = sha(PNG);

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({
  executablePath: require('electron'),
  args: [path.resolve('electron/main.cjs'), '--disable-gpu', '--knoux-user-data=' + f.profile],
  env,
  timeout: 60000,
});

const proof = {
  runtime: null,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim(),
  sourceFiles: {},
  captures: [],
  checks: [],
  errors: [],
  ok: false,
};

const WATCHED = [
  'src/operations/OrganizationLiveWorkbench.tsx',
  'src/operations/OrganizationStudioOverview.tsx',
  'src/operations/OrganizationStudioFocus.tsx',
  'src/operations/OrganizationStudioViews.tsx',
  'src/operations/organization-live.css',
  'src/operations/organization-studio-model.ts',
  'src/studio/StudioPage.tsx',
  'src/visual/KnouxOrbit.tsx',
  'electron/native/studio-bridge.cjs',
  'shared/operation-contract.ts',
];

try {
  await app.evaluate(({ dialog }, f) => {
    dialog.showOpenDialog = async (_p, options) => {
      const t = options.title || '';
      const selected = /source/i.test(t) ? f.source : /destination/i.test(t) ? f.destination : null;
      if (!selected) throw Error('Unexpected picker: ' + t);
      return { canceled: false, filePaths: [selected] };
    };
    dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false });
  }, f);

  for (const name of WATCHED) proof.sourceFiles[name] = createHash('sha256').update(await readFile(name)).digest('hex');
  proof.runtime = await app.evaluate(({ app }) => ({ isPackaged: app.isPackaged, version: app.getVersion() }));

  const page = await app.firstWindow();
  page.on('pageerror', (e) => proof.errors.push(e.message));
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
    localStorage.setItem('knoux_locale', 'en');
    localStorage.setItem('knoux_theme', 'light');
    location.hash = 'files';
  });
  await page.reload();

  await expect(page.getByTestId('files-live-organization')).toBeEnabled({ timeout: 30000 });
  await page.getByTestId('files-live-organization').click();
  await expect(page.getByTestId('organization-live-workbench')).toBeVisible({ timeout: 30000 });

  for (let attempt = 0; attempt < 6; attempt++) {
    if (await page.getByTestId('ops-scan').isEnabled().catch(() => false)) break;
    await expect(page.getByTestId('ops-source')).toBeEnabled({ timeout: 15000 });
    await page.getByTestId('ops-source').click();
    await page.waitForTimeout(600);
  }
  await page.getByTestId('ops-scan').click();
  await expect(page.getByTestId('ops-result-count')).toContainText('40 / 40', { timeout: 120000 });
  await expect(page.getByTestId('ops-file-card')).toHaveCount(40);
  proof.checks.push('Native inventory measured 40/40 on the controlled fixture');

  const win = await app.browserWindow(page);
  const aspect = async () => page.evaluate(() => ({
    dir: document.querySelector('[data-testid="studio-workspace"]')?.getAttribute('dir'),
    theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  }));

  async function setLocale(locale) {
    for (let i = 0; i < 4; i++) {
      if ((await aspect()).dir === (locale === 'ar' ? 'rtl' : 'ltr')) return;
      await page.getByLabel('Toggle interface language', { exact: true }).click();
      await page.waitForTimeout(120);
    }
    throw Error('locale switch failed: ' + locale);
  }
  async function setTheme(theme) {
    const select = page.getByLabel('Theme preference', { exact: true });
    for (let i = 0; i < 4; i++) {
      if ((await aspect()).theme === theme) return;
      if (await select.count()) {
        await select.selectOption(theme);
      } else {
        await page.locator('button[aria-pressed]').filter({ has: page.locator('svg.lucide-sun,svg.lucide-moon') }).first().click();
      }
      await page.waitForTimeout(160);
    }
    throw Error('theme switch failed: ' + theme + ' current=' + JSON.stringify(await aspect()));
  }
  async function selectService(value) {
    await page.getByTestId('studio-service-select').selectOption(String(value));
    await page.waitForTimeout(260);
    if (value === 0) {
      await expect(page.locator('.osa-left')).toBeVisible({ timeout: 10000 });
      return 'overview';
    }
    await expect(page.locator(`[data-service-id="mission-03-${String(value).padStart(2, '0')}"]`)).toBeVisible({ timeout: 10000 });
    return `mission-03-${String(value).padStart(2, '0')}`;
  }
  async function capture(name, width, height, locale, theme, service) {
    const w = await app.browserWindow(page);
    await w.evaluate((win, [ww, hh]) => win.setContentSize(ww, hh), [width, height]);
    await setLocale(locale);
    await setTheme(theme);
    await page.evaluate(async () => { await document.fonts.ready; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); });
    await page.waitForTimeout(220);
    const geo = await page.evaluate(() => {
      const dock = document.querySelector('.os-action-dock')?.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollHeight - innerHeight,
        dockVisible: !!dock && dock.top > 0 && dock.bottom <= innerHeight + 1,
        dockBottom: dock ? Math.round(dock.bottom) : null,
        orbits: document.querySelectorAll('.knx-orbit-tools button').length,
        width: innerWidth,
        height: innerHeight,
        theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
        dir: document.querySelector('[data-testid="studio-workspace"]')?.getAttribute('dir'),
        serviceId: document.querySelector('[data-testid="organization-live-workbench"]')?.getAttribute('data-service-id') || 'overview',
      };
    });
    expect(geo.width).toBe(width);
    expect(geo.height).toBe(height);
    expect(geo.overflow).toBeLessThanOrEqual(2);
    expect(geo.dockVisible).toBe(true);
    expect(geo.orbits).toBe(6);
    expect(geo.theme).toBe(theme);
    expect(geo.dir).toBe(locale === 'ar' ? 'rtl' : 'ltr');
    const ww = await app.browserWindow(page);
    await ww.evaluate((win) => { win.show(); win.moveTop(); win.webContents.invalidate(); });
    await page.waitForTimeout(140);
    const png = await ww.evaluate(async (win) => (await win.webContents.capturePage()).toPNG().toString('base64'));
    const file = `${name}.png`;
    await writeFile(path.join(OUT, file), Buffer.from(png, 'base64'));
    proof.captures.push({ file, width, height, locale, theme, service, geo });
  }

  // Overview + all nine services at the primary viewport, DAY and NIGHT, EN and AR.
  const services = [
    [0, 'overview'], [1, 'sources'], [2, 'visual-library'], [3, 'collections'], [4, 'builder'],
    [5, 'destinations'], [6, 'plan-review'], [7, 'execution'], [8, 'history-undo'], [9, 'suggestions'],
  ];
  for (const [value, slug] of services) {
    await selectService(value);
    for (const [locale, theme] of [['en', 'light'], ['en', 'dark'], ['ar', 'light']]) {
      await capture(`${slug}-${locale}-${theme}-1672`, 1672, 941, locale, theme, slug);
    }
  }
  // Viewport matrix on the overview and the library (the densest service).
  for (const [value, slug] of [[0, 'overview'], [2, 'visual-library']]) {
    await selectService(value);
    await capture(`${slug}-en-light-1366`, 1366, 768, 'en', 'light', slug);
    await capture(`${slug}-en-light-1920`, 1920, 1080, 'en', 'light', slug);
    await capture(`${slug}-ar-dark-1366`, 1366, 768, 'ar', 'dark', slug);
    await capture(`${slug}-ar-dark-1920`, 1920, 1080, 'ar', 'dark', slug);
  }

  proof.checks.push('Captured 30 overview/service frames across DAY/NIGHT, EN/AR and 1366/1672/1920');
  proof.ok = proof.errors.length === 0;
  await writeFile(path.join(OUT, 'capture-proof.json'), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify({ ok: proof.ok, sourceCommit: proof.sourceCommit, captures: proof.captures.length, errors: proof.errors, out: OUT }, null, 2));
  if (!proof.ok) process.exit(1);
  console.log('[studio-owner-fullstack-capture] PASS');
} catch (error) {
  proof.errors.push(error?.message || String(error));
  await writeFile(path.join(OUT, 'capture-proof.json'), JSON.stringify(proof, null, 2)).catch(() => {});
  console.error('[studio-owner-fullstack-capture] FAILED', error?.stack || error);
  process.exit(1);
} finally {
  await app.close().catch(() => {});
}
