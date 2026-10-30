/**
 * KNOuX Smart Scan — current-HEAD owner evidence capture.
 *
 * Deterministic, isolated-profile Electron run against the BUILT renderer
 * (dist/). It authorizes only a temporary controlled fixture (40 files plus
 * three Zone.Identifier ADS markers), indexes it with the real native Files
 * inventory, runs the real deep scan through the native coordinator, then
 * captures the overview and all ten service workspaces in DAY/NIGHT and EN/AR
 * at the owner viewports.
 *
 * It performs NO cleanup, delete, move, rename, service or startup mutation and
 * touches NO owner data. Every value in the frames is measured, and every
 * interaction probe reads the real DOM state that the app produced.
 */
import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { fixture, sha } = require('./live-organization-fixtures.cjs');

const OUT = path.resolve(process.env.KNOUX_SCAN_CAPTURE_DIR || '../../docs/evidence/owner-fullstack-20261030/scan-current');
await mkdir(OUT, { recursive: true });

const f = await fixture(40);

// Three files carry a real Zone.Identifier alternate data stream so the privacy
// sampler reads an actual download origin instead of an empty sample. These are
// disposable fixture streams, never owner data.
const ZONE = '[ZoneTransfer]\r\nZoneId=3\r\nHostUrl=https://downloads.example.test/setup.exe\r\n';
const MARKED = ['item-00.png', 'item-03.pdf', 'item-06.js'];
const zoneHashes = {};
for (const name of MARKED) {
  await writeFile(path.join(f.source, `${name}:Zone.Identifier`), ZONE);
  zoneHashes[name] = sha(Buffer.from(ZONE));
}
const TOTAL = Object.keys(f.originals).length;

// Pre-index through the real Studio bridge so the app boots with one authorized,
// measured source; Smart Scan reads that same Files inventory.
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
  domain: 'Smart Scan',
  runtime: null,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim(),
  fixture: { files: TOTAL, zoneMarked: MARKED.length, profileIsolated: true },
  sourceFiles: {},
  captures: [],
  services: [],
  probes: [],
  checks: [],
  errors: [],
  ok: false,
};

const WATCHED = [
  'src/smart-scan/SmartScanPage.tsx',
  'src/smart-scan/ScanServices.tsx',
  'src/smart-scan/ScanCommandBar.tsx',
  'src/smart-scan/ScanServiceWorkspace.tsx',
  'src/smart-scan/useSmartScan.ts',
  'src/smart-scan/service-renderers/shared.tsx',
  'src/smart-scan/service-renderers/DeepScanRenderer.tsx',
  'src/smart-scan/service-renderers/PrivacyTraceRenderer.tsx',
  'src/smart-scan/service-renderers/SmartRecommendationsRenderer.tsx',
  'src/smart-scan/service-renderers/SystemHealthPulseRenderer.tsx',
  'src/smart-scan/smartScan.css',
  'src/visual/section-fidelity.css',
  'src/components/workbench/ServiceWorkbenchHost.tsx',
  'electron/native/scan-bridge.cjs',
  'electron/preload.cjs',
  'shared/native-contracts.ts',
];

const SERVICES = [
  { key: 'quick_scan', body: 'scan-quick_scan-workbench' },
  { key: 'deep_scan', body: 'scan-deep_scan-workbench' },
  { key: 'duplicate_finder', body: 'scan-duplicate_finder-workbench' },
  { key: 'large_files_review', body: 'scan-large_files_review-workbench' },
  { key: 'junk_cleaner', body: 'scan-junk_cleaner-workbench' },
  { key: 'privacy_trace_check', body: 'scan-privacy_trace_check-workbench' },
  { key: 'startup_impact_check', body: 'scan-startup_impact_check-workbench' },
  { key: 'app_health_review', body: 'scan-app_health_review-workbench' },
  { key: 'system_health_pulse', body: 'scan-system_health_pulse-workbench' },
  { key: 'smart_recommendations', body: 'scan-smart_recommendations-workbench' },
];

try {
  await app.evaluate(({ dialog }, f) => {
    dialog.showOpenDialog = async (_p, options) => {
      const t = options.title || '';
      const selected = /source/i.test(t) ? f.source : null;
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
    location.hash = 'smart_scan';
  });

  async function boot(locale, theme) {
    await page.evaluate(({ locale, theme }) => {
      localStorage.setItem('knoux_locale', locale);
      localStorage.setItem('knoux_theme', theme);
      location.hash = 'smart_scan';
    }, { locale, theme });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByTestId('scan-workspace').waitFor({ timeout: 30000 });
    await expect(page.getByTestId('scan-services')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('scan-services-strip').locator('> button')).toHaveCount(10, { timeout: 30000 });
    await page.waitForTimeout(320);
  }

  async function runDeep() {
    await expect(page.getByTestId('scan-source-select')).toBeVisible({ timeout: 20000 });
    await page.locator('.knx-scan-run.is-deep').click();
    // While a scan runs the source bar is replaced by the measured progress
    // panel; it returns only when the native session reaches a terminal state.
    await expect(page.getByTestId('scan-source-select')).toBeVisible({ timeout: 240000 });
    await expect(page.getByTestId('scan-services-strip')).toContainText(/last result|آخر نتيجة/, { timeout: 30000 });
  }

  async function openService(entry) {
    if (await page.getByTestId('scan-workbench').count()) {
      await page.getByTestId('scan-workbench-tool-select').selectOption(entry.key);
    } else {
      await page.getByTestId(`scan-service-${entry.key}`).click();
    }
    await expect(page.getByTestId(entry.body)).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(200);
  }

  async function closeWorkbench() {
    if (await page.getByTestId('scan-workbench').count()) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(160);
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
    await page.waitForTimeout(200);
    const geo = await page.evaluate(() => {
      const workspace = document.querySelector('[data-testid="scan-workspace"]');
      const main = workspace;
      return {
        overflow: document.documentElement.scrollHeight - innerHeight,
        width: innerWidth,
        height: innerHeight,
        theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
        dir: workspace?.closest('[dir]')?.getAttribute('dir') || document.querySelector('#root > div')?.getAttribute('dir'),
        mainOverflowX: main ? main.scrollWidth - main.clientWidth : null,
        tiles: document.querySelectorAll('[data-testid="scan-services-strip"] > button').length,
        workbench: document.querySelector('[data-testid="scan-workbench"]')?.getAttribute('data-workbench-mode') || null,
      };
    });
    expect(geo.width).toBe(width);
    expect(geo.height).toBe(height);
    expect(geo.overflow).toBeLessThanOrEqual(2);
    expect(geo.theme).toBe(theme);
    expect(geo.dir).toBe(locale === 'ar' ? 'rtl' : 'ltr');
    expect(geo.tiles).toBe(10);
    expect(Math.abs(geo.mainOverflowX ?? 0)).toBeLessThanOrEqual(2);
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
  const CUSTOM_KEYS = ['duplicate_finder', 'large_files_review', 'junk_cleaner', 'privacy_trace_check', 'startup_impact_check', 'app_health_review', 'system_health_pulse', 'smart_recommendations'];
  const fullCombo = (locale, theme) => (locale === 'en' && theme === 'light') || (locale === 'ar' && theme === 'dark');

  async function run(kind) {
    await closeWorkbench();
    if (kind === 'custom') {
      await page.getByTestId('scan-services').getByRole('button', { name: /Custom Scan|فحص مخصص/ }).first().click();
      await expect(page.getByRole('button', { name: /Select all|تحديد الكل/ })).toBeVisible({ timeout: 10000 });
      await page.getByRole('button', { name: /Select all|تحديد الكل/ }).click();
      await page.getByRole('button', { name: /Run custom scan|تشغيل الفحص المخصص/ }).click();
    } else {
      await page.locator(`.knx-scan-run.is-${kind}`).click();
    }
    // A terminal session is proven by the tiles reporting a measured result for
    // every service the mode requested, not by the progress panel disappearing.
    const expected = kind === 'quick' ? ['quick_scan'] : kind === 'deep' ? ['deep_scan'] : CUSTOM_KEYS;
    await page.waitForTimeout(900);
    for (const key of expected) {
      await expect(page.getByTestId(`scan-service-${key}`), `${kind} did not measure ${key}`).toContainText(/last result|آخر نتيجة/, { timeout: 240000 });
    }
    await expect(page.getByTestId('scan-source-select')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(300);
  }

  async function captureService(entry, locale, theme, name = entry.key) {
    await openService(entry);
    const body = page.getByTestId(entry.body);
    const info = await body.evaluate((el) => ({
      testId: el.getAttribute('data-testid'),
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      controls: el.querySelectorAll('button,input,select,a[href]').length,
      visible: el.getBoundingClientRect().height > 0,
      overflowX: el.scrollWidth - el.clientWidth,
      measured: !el.querySelector('[data-testid="scan-empty-result"]'),
      html: el.innerHTML.slice(0, 400),
      offenders: (() => {
        const base = el.getBoundingClientRect().right;
        const out = [];
        el.querySelectorAll('*').forEach((node) => {
          const rect = node.getBoundingClientRect();
          if (rect.right > base + 1) out.push({ tag: node.tagName, cls: String(node.className || '').slice(0, 120), over: Math.round(rect.right - base) });
        });
        return out.slice(0, 6);
      })(),
      scrollers: (() => {
        const out = [];
        el.querySelectorAll('*').forEach((node) => {
          const over = node.scrollWidth - node.clientWidth;
          if (over > 2 && node.clientWidth > 0) out.push({ tag: node.tagName, cls: String(node.className || '').slice(0, 140), over, cw: node.clientWidth });
        });
        if (el.scrollWidth - el.clientWidth > 2) out.unshift({ tag: el.tagName, cls: 'BODY-ROOT', over: el.scrollWidth - el.clientWidth, cw: el.clientWidth });
        return out.slice(0, 8);
      })(),
    }));
    // Ellipsized KPI text is invisible to an overflow check: the container is
    // exactly as wide as its box and the label simply loses its tail. Compare
    // each measured label and value against its own scroll box instead.
    const clipped = await body.evaluate((el) => {
      const read = (sel) => Array.from(el.querySelectorAll(sel)).map((node) => ({
        text: (node.textContent || '').trim(),
        lost: node.scrollWidth - node.clientWidth,
      }));
      return {
        labels: read('[data-metric-label]').filter((n) => n.lost > 1),
        values: read('[data-metric-value]').filter((n) => n.lost > 1),
        subs: read('[data-metric-sub]').filter((n) => n.lost > 1).map((n) => n.text),
      };
    });
    seenBodies.add(info.testId);
    proof.services.push({ key: name, body: entry.body, locale, theme, ...info, clipped });
    expect(info.visible).toBe(true);
    expect(info.controls, `${name} body controls :: ${info.html}`).toBeGreaterThan(0);
    expect(info.overflowX).toBeLessThanOrEqual(2);
    expect(clipped.labels.map((n) => n.text), `${name} ellipsized KPI labels`).toEqual([]);
    expect(clipped.values.map((n) => n.text), `${name} ellipsized KPI values`).toEqual([]);
    await capture(`${name}-${locale}-${theme}-1672`, 1672, 941, locale, theme, name);
    return info;
  }

  const combos = [['en', 'light'], ['en', 'dark'], ['ar', 'light'], ['ar', 'dark']];
  for (const [locale, theme] of combos) {
    await boot(locale, theme);
    if (!fullCombo(locale, theme)) {
      await closeWorkbench();
      await capture(`overview-${locale}-${theme}-1672`, 1672, 941, locale, theme, 'overview');
      continue;
    }

    // A session only contains the services it measured, so the three run modes
    // are exercised in order and each body is captured against its own session.
    await viewport(1672, 941);
    await run('quick');
    expect((await captureService(SERVICES[0], locale, theme)).measured).toBe(true);

    await run('deep');
    expect((await captureService(SERVICES[1], locale, theme)).measured).toBe(true);

    if (locale === 'en') {
      // Focused in-body probes on the measured deep session.
      await openService(SERVICES[1]);
      const deep = page.getByTestId('scan-deep_scan-workbench');
      const completeOption = deep.locator('[data-filter-option="complete"]');
      const expectedComplete = Number(((await completeOption.textContent()) || '').replace(/\D+/g, '')) || 0;
      await completeOption.click();
      await expect(completeOption).toHaveAttribute('aria-pressed', 'true');
      const completeRows = await deep.locator('[data-stage-status]').count();
      const nonComplete = await deep.locator('[data-stage-status]:not([data-stage-status="complete"])').count();
      expect(nonComplete).toBe(0);
      expect(completeRows).toBe(expectedComplete);
      proof.probes.push({ probe: 'deep-stage-filter', option: 'complete', rows: completeRows, expectedComplete });
      await deep.locator('[data-filter-option="all"]').click();
      const firstStage = deep.locator('[data-stage-status]').first();
      await firstStage.locator('button').click();
      await expect(firstStage.locator('button')).toHaveAttribute('aria-expanded', 'true');
      const stagePanel = (await firstStage.textContent()) || '';
      proof.probes.push({ probe: 'deep-stage-inspector', expanded: stagePanel.replace(/\s+/g, ' ').trim().slice(0, 160) });
      const copy = deep.getByTestId('scan-deep_scan-copy');
      await copy.click();
      await page.waitForTimeout(400);
      proof.probes.push({ probe: 'deep-copy-evidence', state: await copy.getAttribute('data-copy-state') });

      await page.getByTestId('workbench-mode-toggle').click();
      await expect(page.getByTestId('scan-workbench-expanded-shell')).toBeVisible({ timeout: 10000 });
      await capture('deep_scan-expanded-en-light-1672', 1672, 941, 'en', 'light', 'deep_scan-expanded');
      await page.getByTestId('workbench-mode-toggle').click();
      await expect(page.getByTestId('scan-workbench-side-shell')).toBeVisible({ timeout: 10000 });
      proof.checks.push('Expanded and pinned workbench modes both render the measured service body');
    }

    await run('custom');
    for (const key of CUSTOM_KEYS) {
      const info = await captureService(SERVICES.find((s) => s.key === key), locale, theme);
      expect(info.measured).toBe(true);
    }

    if (locale === 'en') {
      await openService(SERVICES.find((s) => s.key === 'privacy_trace_check'));
      const privacy = page.getByTestId('scan-privacy_trace_check-workbench');
      const marked = privacy.locator('[data-filter-option="marked"]');
      await marked.click();
      await expect(marked).toHaveAttribute('aria-pressed', 'true');
      const rows = await privacy.locator('[data-testid="scan-privacy_trace_check-sample-list"] > div').count();
      const zoneRows = await privacy.getByText(/Zone \d/).count();
      expect(rows).toBeGreaterThan(0);
      expect(zoneRows).toBe(rows);
      proof.probes.push({ probe: 'privacy-marker-filter', rows, zoneRows });
      const hostButton = privacy.locator('[data-testid^="scan-privacy_trace_check-host-"]:not([data-testid="scan-privacy_trace_check-host-clear"])').first();
      if (await hostButton.count()) {
        await hostButton.click();
        await expect(hostButton).toHaveAttribute('aria-pressed', 'true');
        proof.probes.push({ probe: 'privacy-host-filter', host: ((await hostButton.textContent()) || '').trim().slice(0, 80) });
        await privacy.getByTestId('scan-privacy_trace_check-host-clear').click();
      }

      await openService(SERVICES.find((s) => s.key === 'smart_recommendations'));
      const recs = page.getByTestId('scan-smart_recommendations-workbench');
      const recCount = await recs.locator('[data-testid^="scan-recommendation-open-"]').count();
      const toggle = recs.getByTestId('scan-smart_recommendations-attention-toggle');
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      const attentionCards = await recs.locator('[data-testid^="scan-recommendation-open-"]').count();
      proof.probes.push({ probe: 'recommendation-attention-filter', before: recCount, after: attentionCards });
      await toggle.click();
      if (recCount > 0) {
        const openButton = recs.locator('[data-testid^="scan-recommendation-open-"]').first();
        const targetService = (await openButton.getAttribute('data-service-id')) || '';
        await openButton.click();
        await page.waitForTimeout(400);
        const selected = await page.getByTestId('scan-workbench-tool-select').inputValue();
        expect(selected).toBe(targetService);
        proof.probes.push({ probe: 'recommendation-open-service', targetService, selected });
      }

      await openService(SERVICES.find((s) => s.key === 'system_health_pulse'));
      const health = page.getByTestId('scan-system_health_pulse-workbench');
      const lowOption = health.locator('[data-filter-option="low"]');
      const expectedLow = Number(((await lowOption.textContent()) || '').replace(/\D+/g, '')) || 0;
      await lowOption.click();
      const lowRows = await health.locator('[data-testid="scan-system_health_pulse-volume-list"] > div').count();
      expect(lowRows).toBe(expectedLow);
      proof.probes.push({ probe: 'health-volume-filter', option: 'low', rows: lowRows, expectedLow });
      await health.locator('[data-filter-option="all"]').click();
      const healthCopy = health.getByTestId('scan-system_health_pulse-copy');
      await healthCopy.click();
      await page.waitForTimeout(400);
      proof.probes.push({ probe: 'health-copy-evidence', state: await healthCopy.getAttribute('data-copy-state') });

      // The service strip must be reachable by pointer without a mouse wheel.
      await closeWorkbench();
      const scrollBefore = await page.getByTestId('scan-services-strip').evaluate((el) => el.scrollLeft);
      await page.getByTestId('scan-services-next').click();
      await page.waitForTimeout(600);
      const scrollAfter = await page.getByTestId('scan-services-strip').evaluate((el) => el.scrollLeft);
      expect(scrollAfter).not.toBe(scrollBefore);
      proof.probes.push({ probe: 'services-strip-scroll', scrollBefore, scrollAfter });
    }

    await closeWorkbench();
    // The strip probe above leaves the dock scrolled to the last tiles; the
    // overview frame must show the first service, not a mid-scroll state.
    await page.getByTestId('scan-services-strip').evaluate((el) => { el.scrollLeft = 0; });
    await page.waitForTimeout(250);
    await capture(`overview-${locale}-${theme}-1672`, 1672, 941, locale, theme, 'overview');
    await capture(`overview-${locale}-${theme}-1366`, 1366, 768, locale, theme, 'overview');
    await capture(`overview-${locale}-${theme}-1920`, 1920, 1080, locale, theme, 'overview');
  }

  proof.checks.push(`Ten distinct Smart Scan service bodies verified across DAY/NIGHT and EN/AR (${seenBodies.size} signatures)`);
  expect(seenBodies.size).toBe(10);
  const uniqueTexts = new Set(proof.services.filter((s) => s.locale === 'en').map((s) => s.text));
  expect(uniqueTexts.size).toBe(10);
  proof.checks.push('All ten bodies expose distinct measured content and at least one control');

  const security = await app.evaluate(({ BrowserWindow }) => {
    const p = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return { contextIsolation: p.contextIsolation, sandbox: p.sandbox, nodeIntegration: p.nodeIntegration, webSecurity: p.webSecurity };
  });
  proof.checks.push({ security });
  expect(security).toEqual({ contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true });

  // Read-only proof: base file bytes and the three Zone streams are unchanged.
  const after = {};
  for (const name of Object.keys(f.originals)) after[name] = sha(await readFile(path.join(f.source, name)));
  const unchanged = Object.keys(f.originals).every((name) => f.originals[name] === after[name]);
  const zoneAfter = {};
  for (const name of MARKED) zoneAfter[name] = sha(await readFile(path.join(f.source, `${name}:Zone.Identifier`)));
  const zoneUnchanged = MARKED.every((name) => zoneHashes[name] === zoneAfter[name]);
  proof.checks.push({ sourceUnchanged: unchanged, zoneUnchanged, fixtureFiles: Object.keys(f.originals).length, zoneMarked: MARKED.length });
  expect(unchanged).toBe(true);
  expect(zoneUnchanged).toBe(true);

  proof.ok = proof.errors.length === 0;
  await writeFile(path.join(OUT, 'capture-proof.json'), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify({ ok: proof.ok, sourceCommit: proof.sourceCommit, captures: proof.captures.length, services: proof.services.length, probes: proof.probes, errors: proof.errors, out: OUT }, null, 2));
  await app.close();
  if (!proof.ok) process.exit(1);
  console.log('[scan-owner-fullstack-capture] PASS');
} catch (error) {
  proof.errors.push(error instanceof Error ? error.message : String(error));
  await writeFile(path.join(OUT, 'capture-proof.json'), JSON.stringify(proof, null, 2)).catch(() => {});
  await app.close().catch(() => {});
  throw error;
}
