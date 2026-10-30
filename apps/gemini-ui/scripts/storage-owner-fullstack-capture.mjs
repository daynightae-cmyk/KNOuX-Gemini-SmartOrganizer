/**
 * KNOuX Storage Atlas — current-HEAD owner evidence capture.
 *
 * Deterministic, isolated-profile Electron run against the BUILT renderer
 * (dist/). It authorizes only a temporary controlled fixture with nested
 * folders and a byte-identical 1.5 MB duplicate pair, scans it with the real
 * native inventory, then captures the Storage overview and each of the twelve
 * service workbenches in DAY/NIGHT and EN/AR at the owner viewports.
 *
 * Duplicate verification and the SMART/manual probes run against the real
 * read-only providers. No delete, move, defrag, TRIM or owner-file mutation is
 * performed or exposed.
 */
import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { fixture, sha } = require('./live-organization-fixtures.cjs');

const OUT = path.resolve(process.env.KNOUX_STORAGE_CAPTURE_DIR || '../../docs/evidence/owner-fullstack-20261030/storage-current');
await mkdir(OUT, { recursive: true });

const f = await fixture(30);
const tracked = { ...f.originals };
async function put(relative, buffer) {
  const target = path.join(f.source, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buffer);
  tracked[relative.replace(/\\/g, '/')] = sha(buffer);
}

// Byte-identical pair above the 1 MB duplicate floor.
const duplicatePayload = Buffer.alloc(1536 * 1024, 0x5a);
await put('media/alpha-copy.bin', duplicatePayload);
await put('archive/alpha-copy.bin', duplicatePayload);
// Nested folders with distinct extensions for treemap, ranking and types.
await put('media/quadrant.png', Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(96 * 1024, 1)]));
await put('docs/ledger.csv', Buffer.from('id,bytes\n1,4096\n2,8192\n'));
await put('docs/notes.txt', Buffer.from('Storage Atlas disposable fixture. No owner data.\n'));
await put('bulk/heavy-archive.zip', Buffer.alloc(2 * 1024 * 1024, 0x33));

const TOTAL = Object.keys(tracked).length;

// Authorize and scan the disposable fixture through the real native bridge so
// the app boots into a measured scope of this temporary folder only.
const { StudioBridge } = require('../electron/native/studio-bridge.cjs');
const studio = new StudioBridge({ userDataPath: f.profile, nativeImage: null, isPackaged: false, chooseFolder: async () => f.source, emit: () => {} });
await studio.init();
const grant = await studio.addSource(f.source);
await studio.scanSource(grant.id);
await studio.dispose();

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({
  executablePath: require('electron'),
  args: [path.resolve('electron/main.cjs'), '--disable-gpu', '--knoux-user-data=' + f.profile],
  env,
  timeout: 60000,
});

const proof = {
  domain: 'Storage Atlas',
  runtime: null,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim(),
  fixture: { files: TOTAL, duplicatePairBytes: duplicatePayload.length, profileIsolated: true },
  sourceFiles: {},
  volumes: [],
  captures: [],
  services: [],
  probes: [],
  checks: [],
  errors: [],
  ok: false,
};

const WATCHED = [
  'src/pages/StoragePage.tsx',
  'src/storage/StorageServiceFocus.tsx',
  'src/storage/useStorageNative.ts',
  'src/storage/native.ts',
  'src/storage/StorageAtlasPanels.tsx',
  'src/components/workbench/ServiceWorkbenchHost.tsx',
  'electron/native/storage-bridge.cjs',
  'electron/preload.cjs',
  'shared/native-contracts.ts',
];

const SERVICES = [
  { key: 'storage-disks', slug: 'disks', body: 'storage-storage-disks-workbench' },
  { key: 'storage-large-files', slug: 'large-files', body: 'storage-storage-large-files-workbench' },
  { key: 'storage-duplicates', slug: 'duplicates', body: 'storage-storage-duplicates-workbench' },
  { key: 'storage-treemap', slug: 'treemap', body: 'storage-storage-treemap-workbench' },
  { key: 'storage-top-folders', slug: 'top-folders', body: 'storage-storage-top-folders-workbench' },
  { key: 'storage-filetypes', slug: 'filetypes', body: 'storage-storage-filetypes-workbench' },
  { key: 'storage-scan-overview', slug: 'scan-overview', body: 'storage-storage-scan-overview-workbench' },
  { key: 'storage-fragmentation', slug: 'fragmentation', body: 'storage-storage-fragmentation-workbench' },
  { key: 'storage-smart', slug: 'smart', body: 'storage-storage-smart-workbench' },
  { key: 'storage-reclaim', slug: 'reclaim', body: 'storage-storage-reclaim-workbench' },
  { key: 'storage-history', slug: 'history', body: 'storage-storage-history-workbench' },
  { key: 'storage-removable', slug: 'removable', body: 'storage-storage-removable-workbench' },
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
  page.on('pageerror', (e) => proof.errors.push(e.stack || e.message));
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
    location.hash = 'storage';
  });

  async function boot(locale, theme) {
    await page.evaluate(({ locale, theme }) => {
      localStorage.setItem('knoux_locale', locale);
      localStorage.setItem('knoux_theme', theme);
      location.hash = 'storage';
    }, { locale, theme });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByTestId('storage-workspace').waitFor({ timeout: 30000 });
    // The banner only reports the fixture's measured file count after the real
    // native analysis hydrates, so this is a data assertion, not a timer.
    await expect(page.getByTestId('storage-native-banner')).toContainText(new RegExp(`(?:^|\\D)${TOTAL}(?:\\D|$)`), { timeout: 90000 });
    // Wait for *measured volume rows* (drive letters), not the analysis panel,
    // whose test id also starts with "storage-volume-".
    await expect
      .poll(async () => page.locator('[data-testid^="storage-volume-"]').evaluateAll((els) => els
        .map((el) => (el.getAttribute('data-testid') || '').replace('storage-volume-', ''))
        .filter((value) => /^[A-Z]$/.test(value)).length), { timeout: 60000 })
      .toBeGreaterThan(0);
    await page.waitForTimeout(600);
  }

  async function openService(entry) {
    if (await page.getByTestId('storage-workbench').count()) {
      await page.getByTestId('storage-workbench-tool-select').selectOption(entry.key);
    } else {
      await page.locator(`[data-service-key="${entry.key}"]`).first().click();
    }
    try {
      await expect(page.getByTestId(entry.body)).toBeVisible({ timeout: 20000 });
    } catch (error) {
      const state = await page.evaluate(() => ({
        shells: [...document.querySelectorAll('[data-testid*="workbench"]')].map((el) => el.getAttribute('data-testid')),
        bodies: [...document.querySelectorAll('[data-testid^="storage-storage-"]')].map((el) => el.getAttribute('data-testid')),
        active: document.querySelector('[data-testid="storage-workbench-tool-select"]')?.value || null,
      }));
      console.error('[openService] ' + entry.key, JSON.stringify(state));
      throw error;
    }
    await page.waitForTimeout(200);
  }

  async function closeWorkbench() {
    if (await page.getByTestId('storage-workbench').count()) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(180);
    }
  }

  async function viewport(width, height) {
    const w = await app.browserWindow(page);
    await w.evaluate((win, [ww, hh]) => win.setContentSize(ww, hh), [width, height]);
    await page.waitForTimeout(160);
  }

  async function capture(name, width, height, locale, theme, service) {
    await viewport(width, height);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    await page.waitForTimeout(220);
    const geo = await page.evaluate(() => {
      const workspace = document.querySelector('[data-testid="storage-workspace"]');
      return {
        overflow: document.documentElement.scrollHeight - innerHeight,
        width: innerWidth,
        height: innerHeight,
        theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
        dir: workspace?.closest('[dir]')?.getAttribute('dir') || document.querySelector('#root > div')?.getAttribute('dir'),
        scrollsInternally: !!workspace && workspace.scrollHeight >= workspace.clientHeight,
        workbench: document.querySelector('[data-testid="storage-workbench"]')?.getAttribute('data-workbench-mode') || null,
      };
    });
    expect(geo.width).toBe(width);
    expect(geo.height).toBe(height);
    expect(geo.overflow).toBeLessThanOrEqual(2);
    expect(geo.theme).toBe(theme);
    expect(geo.dir).toBe(locale === 'ar' ? 'rtl' : 'ltr');
    const w = await app.browserWindow(page);
    await w.evaluate((win) => { win.show(); win.moveTop(); win.webContents.invalidate(); });
    await page.waitForTimeout(120);
    const png = await w.evaluate(async (win) => (await win.webContents.capturePage()).toPNG().toString('base64'));
    const file = `${name}.png`;
    await writeFile(path.join(OUT, file), Buffer.from(png, 'base64'));
    proof.captures.push({ file, width, height, locale, theme, service, geo });
    return geo;
  }

  const verifyDuplicates = async () => {
    const entry = SERVICES.find((service) => service.key === 'storage-duplicates');
    await openService(entry);
    await page.getByTestId('storage-duplicates-verify').click();
    await expect(page.getByTestId(entry.body)).toContainText(/[a-f0-9]{16}/, { timeout: 90000 });
    const summary = await page.getByTestId(entry.body).evaluate((el) => (el.textContent || '').replace(/\s+/g, ' ').trim());
    proof.probes.push({ probe: 'duplicate-verification', summary: summary.slice(0, 220) });
  };

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

    if (locale === 'en' && theme === 'light') {
      const volumes = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="storage-volume-"]')]
        .map((el) => (el.getAttribute('data-testid') || '').replace('storage-volume-', ''))
        .filter((value) => /^[A-Z]$/.test(value)));
      proof.volumes = volumes;
      proof.checks.push({ measuredVolumeLetters: volumes });
      expect(volumes.length).toBeGreaterThan(0);
    }

    for (const entry of SERVICES) {
      await openService(entry);
      const body = page.getByTestId(entry.body);
      if (entry.key === 'storage-duplicates') {
        await verifyDuplicates();
      }
      if (entry.key === 'storage-smart') {
        await page.getByTestId('storage-smart-probe').click();
        await expect(body).toContainText(/\d{4}-\d{2}-\d{2}T/, { timeout: 30000 });
        const smartSummary = await body.evaluate((el) => (el.textContent || '').replace(/\s+/g, ' ').trim());
        proof.probes.push({ probe: 'smart-support', summary: smartSummary.slice(0, 220) });
      }
      if (entry.key === 'storage-fragmentation') {
        await page.getByTestId('storage-frag-probe').click();
        await expect(body).toContainText(/\d{4}-\d{2}-\d{2}T/, { timeout: 30000 });
      }
      if (entry.key === 'storage-scan-overview') {
        await page.getByTestId('storage-scan-copy').click();
        const toast = await page.locator('text=/copied to the clipboard|Clipboard access is unavailable/').first().textContent({ timeout: 5000 }).catch(() => null);
        proof.checks.push({ exportProbe: toast });
      }
      const info = await body.evaluate((el) => ({
        testId: el.getAttribute('data-testid'),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140),
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
      await openService(SERVICES.find((service) => service.key === 'storage-smart'));
      await page.getByTestId('workbench-mode-toggle').click();
      await expect(page.getByTestId('storage-workbench-expanded-shell')).toBeVisible({ timeout: 10000 });
      await capture('smart-expanded-en-light-1672', 1672, 941, 'en', 'light', 'smart-expanded');
      await page.getByTestId('workbench-mode-toggle').click();
      await expect(page.getByTestId('storage-workbench-side-shell')).toBeVisible({ timeout: 10000 });
      proof.checks.push('Expanded and pinned workbench modes both render the Storage service body');
    }
    await closeWorkbench();
  }
  proof.checks.push(`Twelve distinct Storage service bodies verified across DAY/NIGHT and EN/AR (${seenBodies.size} signatures)`);
  expect(seenBodies.size).toBe(12);
  // Capacity history grows on every real volume read, so uniqueness is checked
  // within one locale/theme pass rather than across the whole run.
  const uniqueTexts = new Set(proof.services.filter((s) => s.locale === 'en' && s.theme === 'light').map((s) => s.text));
  expect(uniqueTexts.size).toBe(12);
  proof.checks.push('All twelve bodies expose distinct measured content and at least one control');

  // Real handoff: the reclaim planner must open the executing Safety Vault.
  await boot('en', 'light');
  await openService(SERVICES.find((service) => service.key === 'storage-reclaim'));
  await page.getByTestId('storage-reclaim-cleanup').click();
  await expect(page.getByTestId('storage-cleanup-live')).toBeVisible({ timeout: 15000 });
  proof.checks.push('storage-reclaim hands off to the executing Safety Vault with its keeper selection view');
  await page.getByTestId('workbench-close').click();
  await expect(page.getByTestId('storage-cleanup-live')).toHaveCount(0);

  const security = await app.evaluate(({ BrowserWindow }) => {
    const p = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return { contextIsolation: p.contextIsolation, sandbox: p.sandbox, nodeIntegration: p.nodeIntegration, webSecurity: p.webSecurity };
  });
  proof.checks.push({ security });
  expect(security).toEqual({ contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true });

  const after = {};
  for (const name of Object.keys(tracked)) after[name] = sha(await readFile(path.join(f.source, name)));
  const unchanged = Object.keys(tracked).every((name) => tracked[name] === after[name]);
  proof.checks.push({ sourceUnchanged: unchanged, fixtureFiles: Object.keys(tracked).length });
  expect(unchanged).toBe(true);

  proof.ok = proof.errors.length === 0;
  await writeFile(path.join(OUT, 'capture-proof.json'), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify({ ok: proof.ok, sourceCommit: proof.sourceCommit, captures: proof.captures.length, services: proof.services.length, probes: proof.probes, errors: proof.errors, out: OUT }, null, 2));
  if (!proof.ok) process.exit(1);
  console.log('[storage-owner-fullstack-capture] PASS');
} catch (error) {
  proof.errors.push(error?.message || String(error));
  await writeFile(path.join(OUT, 'capture-proof.json'), JSON.stringify(proof, null, 2)).catch(() => {});
  console.error('[storage-owner-fullstack-capture] FAILED', error?.stack || error);
  process.exit(1);
} finally {
  await app.close().catch(() => {});
}
