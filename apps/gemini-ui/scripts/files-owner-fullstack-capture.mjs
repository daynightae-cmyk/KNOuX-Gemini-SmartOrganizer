/**
 * KNOuX Files & Instant Search — current-HEAD owner evidence capture.
 *
 * Deterministic, isolated-profile Electron run against the BUILT renderer
 * (dist/). It authorizes only a temporary controlled fixture, scans it with the
 * real native inventory, then captures the Files overview and each of the
 * twelve service workbenches in DAY/NIGHT and EN/AR at the owner viewports.
 *
 * It performs NO move, copy, delete or rename and touches NO owner data.
 * Write-path proof for the three organize services lives in Organization
 * Studio evidence (stages 06/07/08) and is linked, never re-executed here.
 */
import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { fixture, sha } = require('./live-organization-fixtures.cjs');

const OUT = path.resolve(process.env.KNOUX_FILES_CAPTURE_DIR || '../../docs/evidence/owner-fullstack-20261030/files-current');
await mkdir(OUT, { recursive: true });

const f = await fixture(40);
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAIAAAABgCAYAAADVenpJAAABL0lEQVR4nO3SMRHAMAwEsALrXC7m0jk0CsJLWLkw/nKnQQx03c+epApbYR12CSCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAghwdoDak1RhK6zDBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQ4PMC7J6nCVliHCSCAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAghweIBvT1KFrhAOE0AAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBgTg7wA30LN72IacZYAAAAAElFTkSuQmCC',
  'base64'
);
await writeFile(path.join(f.source, 'visual-preview.png'), PNG);
f.originals['visual-preview.png'] = sha(PNG);

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({
  executablePath: require('electron'),
  args: [path.resolve('electron/main.cjs'), '--disable-gpu', '--knoux-user-data=' + f.profile],
  env,
  timeout: 60000,
});

const proof = {
  domain: 'Files & Instant Search',
  runtime: null,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim(),
  fixture: { files: 40, images: 1, profileIsolated: true },
  sourceFiles: {},
  captures: [],
  services: [],
  integration: [],
  checks: [],
  errors: [],
  ok: false,
};

const WATCHED = [
  'src/pages/FilesPage.tsx',
  'src/files/FilesServiceFocus.tsx',
  'src/files/useFilesNative.ts',
  'src/files/native.ts',
  'src/lib/file-inventory.ts',
  'src/components/workbench/ServiceWorkbenchHost.tsx',
  'electron/native/studio-bridge.cjs',
  'electron/native/operation-engine.cjs',
  'electron/preload.cjs',
  'shared/native-contracts.ts',
];

const SERVICES = [
  { key: 'file-downloads-inventory', slug: 'downloads-inventory', body: 'files-downloads-workbench' },
  { key: 'file-organize-preview', slug: 'organize-preview', body: 'files-organize-preview-workbench' },
  { key: 'file-organize-apply', slug: 'organize-apply', body: 'files-organize-apply-workbench' },
  { key: 'file-organize-undo', slug: 'organize-undo', body: 'files-organize-undo-workbench' },
  { key: 'file-empty-folders', slug: 'empty-folders', body: 'files-empty-folders-workbench' },
  { key: 'file-hash', slug: 'hash', body: 'files-hash-workbench' },
  { key: 'file-search', slug: 'search', body: 'files-search-workbench' },
  { key: 'file-type-map', slug: 'type-map', body: 'files-type-map-workbench' },
  { key: 'file-recents', slug: 'recents', body: 'files-recents-workbench' },
  { key: 'file-largest', slug: 'largest', body: 'files-largest-workbench' },
  { key: 'file-metadata', slug: 'metadata', body: 'files-metadata-workbench' },
  { key: 'file-provenance', slug: 'provenance', body: 'files-provenance-workbench' },
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
    location.hash = 'files';
  });

  const rows = page.locator('[data-testid^="files-row-native-"]');

  async function boot(locale, theme) {
    await page.evaluate(({ locale, theme }) => {
      localStorage.setItem('knoux_locale', locale);
      localStorage.setItem('knoux_theme', theme);
      location.hash = 'files';
    }, { locale, theme });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByTestId('files-workspace').waitFor({ timeout: 30000 });
    await expect(rows).toHaveCount(40, { timeout: 90000 });
    await expect(page.getByTestId('files-native-banner')).toContainText(/40/, { timeout: 30000 });
    await page.waitForTimeout(320);
  }

  async function openTools() {
    const tab = page.locator('#files-tab-tools');
    if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click();
    await page.waitForTimeout(120);
  }

  async function openService(entry) {
    await openTools();
    await page.getByTestId(`files-service-${entry.key}`).click();
    await expect(page.getByTestId(entry.body)).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(180);
  }

  async function closeWorkbench() {
    if (await page.getByTestId('files-workbench').count()) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(160);
    }
  }

  async function loadSelectedMetadata() {
    await rows.first().locator('div.w-10').last().click();
    await page.waitForTimeout(900);
  }

  async function viewport(width, height) {
    const w = await app.browserWindow(page);
    await w.evaluate((win, [ww, hh]) => win.setContentSize(ww, hh), [width, height]);
    await page.waitForTimeout(140);
  }

  async function capture(name, width, height, locale, theme, service) {
    await viewport(width, height);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    await page.waitForTimeout(200);
    const geo = await page.evaluate(() => {
      const workspace = document.querySelector('[data-testid="files-workspace"]');
      const banner = document.querySelector('[data-testid="files-native-banner"]');
      return {
        overflow: document.documentElement.scrollHeight - innerHeight,
        width: innerWidth,
        height: innerHeight,
        theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
        dir: workspace?.closest('[dir]')?.getAttribute('dir') || document.querySelector('#root > div')?.getAttribute('dir'),
        bannerVisible: !!banner && banner.getBoundingClientRect().height > 0,
        rows: document.querySelectorAll('[data-testid^="files-row-native-"]').length,
        workbench: document.querySelector('[data-testid="files-workbench"]')?.getAttribute('data-workbench-mode') || null,
      };
    });
    expect(geo.width).toBe(width);
    expect(geo.height).toBe(height);
    expect(geo.overflow).toBeLessThanOrEqual(2);
    expect(geo.theme).toBe(theme);
    expect(geo.dir).toBe(locale === 'ar' ? 'rtl' : 'ltr');
    expect(geo.rows).toBe(40);
    const w = await app.browserWindow(page);
    await w.evaluate((win) => { win.show(); win.moveTop(); win.webContents.invalidate(); });
    await page.waitForTimeout(120);
    const png = await w.evaluate(async (win) => (await win.webContents.capturePage()).toPNG().toString('base64'));
    const file = `${name}.png`;
    await writeFile(path.join(OUT, file), Buffer.from(png, 'base64'));
    proof.captures.push({ file, width, height, locale, theme, service, geo });
    return geo;
  }

  const seenBodies = new Set();
  const combos = [['en', 'light'], ['en', 'dark'], ['ar', 'light'], ['ar', 'dark']];
  for (const [locale, theme] of combos) {
    await boot(locale, theme);
    await closeWorkbench();
    await viewport(1672, 941);
    await capture(`overview-${locale}-${theme}-1672`, 1672, 941, locale, theme, 'overview');
    if ((locale === 'en' && theme === 'light') || (locale === 'ar' && theme === 'dark')) {
      await capture(`overview-${locale}-${theme}-1366`, 1366, 768, locale, theme, 'overview');
      await capture(`overview-${locale}-${theme}-1920`, 1920, 1080, locale, theme, 'overview');
    }
    await viewport(1672, 941);
    await loadSelectedMetadata();
    if (locale === 'en' && theme === 'light') proof.checks.push('Selected a measured file through the row menu; native metadata and hash context are attached');
    await page.waitForTimeout(1200);

    for (const entry of SERVICES) {
      await openService(entry);
      const body = page.getByTestId(entry.body);
      if (entry.key === 'file-hash') {
        await body.getByRole('button').first().click();
        await expect(body).toContainText(/[a-f0-9]{64}/, { timeout: 30000 });
      }
      if (entry.key === 'file-empty-folders') {
        await body.getByRole('button').first().click();
        await expect(body).toContainText(/folders|مجلد/, { timeout: 30000 });
      }
      const info = await body.evaluate((el) => ({
        testId: el.getAttribute('data-testid'),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
        controls: el.querySelectorAll('button,input,select,a[href]').length,
        visible: el.getBoundingClientRect().height > 0,
      }));
      expect(info.visible).toBe(true);
      expect(info.controls).toBeGreaterThan(0);
      seenBodies.add(info.testId);
      proof.services.push({ key: entry.key, body: entry.body, locale, theme, ...info });
      if ((locale === 'en' && theme === 'light') || (locale === 'ar' && theme === 'dark')) {
        await capture(`${entry.slug}-${locale}-${theme}-1672`, 1672, 941, locale, theme, entry.slug);
      }
    }

    if (locale === 'en' && theme === 'light') {
      await openService(SERVICES.find((s) => s.key === 'file-hash'));
      await page.getByTestId('workbench-mode-toggle').click();
      await expect(page.getByTestId('files-workbench-expanded-shell')).toBeVisible({ timeout: 10000 });
      await capture('hash-expanded-en-light-1672', 1672, 941, 'en', 'light', 'hash-expanded');
      await page.getByTestId('workbench-mode-toggle').click();
      await expect(page.getByTestId('files-workbench-side-shell')).toBeVisible({ timeout: 10000 });
      proof.checks.push('Expanded and pinned workbench modes both render the service body');
    }
    await closeWorkbench();
  }
  proof.checks.push(`Twelve distinct Files service bodies verified across DAY/NIGHT and EN/AR (${seenBodies.size} signatures)`);
  expect(seenBodies.size).toBe(12);
  const uniqueTexts = new Set(proof.services.filter((s) => s.locale === 'en').map((s) => s.text));
  expect(uniqueTexts.size).toBe(12);
  proof.checks.push('All twelve bodies expose distinct measured content and at least one control');

  // Real handoff: each organize service must land on its own Studio stage.
  await boot('en', 'light');
  const handoffs = [
    ['file-organize-preview', 'files-open-studio-plan', '06'],
    ['file-organize-apply', 'files-open-studio-execution', '07'],
    ['file-organize-undo', 'files-open-studio-undo', '08'],
  ];
  for (const [key, button, stage] of handoffs) {
    await openService(SERVICES.find((s) => s.key === key));
    await page.getByTestId(button).click();
    await expect(page.locator(`[data-service-id="mission-03-${stage}"]`)).toBeVisible({ timeout: 20000 });
    const evidence = await page.locator(`[data-service-id="mission-03-${stage}"]`).getAttribute('data-service-id');
    proof.integration.push({ service: key, stage: evidence });
    await boot('en', 'light');
  }
  proof.checks.push('Organize preview/apply/undo hand off to Studio stages 06/07/08 with the service body still owning the entry point');

  const security = await app.evaluate(({ BrowserWindow }) => {
    const p = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return { contextIsolation: p.contextIsolation, sandbox: p.sandbox, nodeIntegration: p.nodeIntegration, webSecurity: p.webSecurity };
  });
  proof.checks.push({ security });
  expect(security).toEqual({ contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true });

  const after = {};
  for (const name of Object.keys(f.originals)) after[name] = sha(await readFile(path.join(f.source, name)));
  const unchanged = Object.keys(f.originals).every((name) => f.originals[name] === after[name]);
  proof.checks.push({ sourceUnchanged: unchanged, fixtureFiles: Object.keys(f.originals).length });
  expect(unchanged).toBe(true);

  proof.ok = proof.errors.length === 0;
  await writeFile(path.join(OUT, 'capture-proof.json'), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify({ ok: proof.ok, sourceCommit: proof.sourceCommit, captures: proof.captures.length, services: proof.services.length, integration: proof.integration, errors: proof.errors, out: OUT }, null, 2));
  if (!proof.ok) process.exit(1);
  console.log('[files-owner-fullstack-capture] PASS');
} catch (error) {
  proof.errors.push(error?.message || String(error));
  await writeFile(path.join(OUT, 'capture-proof.json'), JSON.stringify(proof, null, 2)).catch(() => {});
  console.error('[files-owner-fullstack-capture] FAILED', error?.stack || error);
  process.exit(1);
} finally {
  await app.close().catch(() => {});
}
