/**
 * KNOuX Clean Room — current-HEAD owner evidence capture.
 *
 * Deterministic, isolated-profile Electron run against the BUILT renderer
 * (dist/). The Clean Room provider measures real roots, so this harness points
 * USERPROFILE / LOCALAPPDATA / APPDATA / TEMP at a disposable fixture and scans
 * only the temporary, browser-cache and diagnostic-log categories. The Recycle
 * Bin and Windows Update categories are left out of the scan so no owner shell
 * metadata or servicing store is read for evidence.
 *
 * Everything captured here is read-only: the coordinator has no delete, move,
 * recycle-purge, DISM, task or restore channel.
 */
import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile, utimes, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);

const OUT = path.resolve(process.env.KNOUX_CLEANUP_CAPTURE_DIR || '../../docs/evidence/owner-fullstack-20261030/cleanup-current');
await mkdir(OUT, { recursive: true });

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

async function put(file, payload, ageDays) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, payload);
  const stamp = new Date(now - ageDays * DAY);
  await utimes(file, stamp, stamp);
}

// A disposable measurement root. Nothing here belongs to the owner.
const root = path.join(tmpdir(), `knoux-cleanup-evidence-${process.pid}`);
await rm(root, { recursive: true, force: true });
const home = path.join(root, 'home');
const local = path.join(home, 'AppData', 'Local');
const roaming = path.join(home, 'AppData', 'Roaming');
const temp = path.join(root, 'temp');
const profile = path.join(root, 'profile');

const tracked = {};
const sha = (buffer) => createHash('sha256').update(buffer).digest('hex');
async function seed(relativePath, payload, ageDays, base) {
  const file = path.join(base, relativePath);
  await put(file, payload, ageDays);
  tracked[path.relative(root, file).replace(/\\/g, '/')] = sha(payload);
}

await seed('old-session.tmp', Buffer.alloc(4096, 0x11), 30, temp);
await seed('nesting/mid-session.log', Buffer.from('clean-room fixture log line\n'), 3, temp);
await seed('fresh.partial.tmp', Buffer.alloc(1024, 0x22), 0, temp);
await seed('AppData/Local/CrashDumps/knoux-fixture.dmp', Buffer.alloc(16384, 0x33), 30, home);
await seed('AppData/Local/Microsoft/Windows/WER/ReportArchive/AppCrash_fixture/Report.wer', Buffer.from('[Report]\nEventType=APPCRASH\n'), 30, home);
await seed('AppData/Local/Google/Chrome/User Data/Default/Cache/Cache_Data/f_000001', Buffer.alloc(8192, 0x44), 30, home);
await seed('AppData/Local/Google/Chrome/User Data/Default/Cache/Cache_Data/index', Buffer.from('fixture-cache-index\n'), 30, home);
await seed('AppData/Local/Microsoft/Edge/User Data/Default/Cache/Cache_Data/f_000002', Buffer.alloc(6144, 0x55), 30, home);
await mkdir(roaming, { recursive: true });
await mkdir(profile, { recursive: true });

const env = {
  ...process.env,
  USERPROFILE: home,
  HOME: home,
  LOCALAPPDATA: local,
  APPDATA: roaming,
  TEMP: temp,
  TMP: temp,
};
delete env.ELECTRON_RUN_AS_NODE;

const app = await electron.launch({
  executablePath: require('electron'),
  args: [path.resolve('electron/main.cjs'), '--disable-gpu', '--knoux-user-data=' + profile],
  env,
  timeout: 60000,
});

const proof = {
  domain: 'Cleanup Safety Vault',
  runtime: null,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim(),
  isolation: {
    profile: true,
    userprofile: true,
    temp: true,
    localStorage: true,
    scannedCategories: ['temp', 'browser', 'logs'],
    excludedCategories: ['recycle', 'update'],
    excludedReason: 'Owner Recycle Bin metadata and the Windows servicing store are not read for evidence.',
  },
  fixture: { roots: 3, files: Object.keys(tracked).length },
  sourceFiles: {},
  captures: [],
  services: [],
  probes: [],
  checks: [],
  errors: [],
  ok: false,
};

const WATCHED = [
  'src/pages/CleanupPage.tsx',
  'src/cleanup/ServiceWorkspace.tsx',
  'src/cleanup/CleanupHero.tsx',
  'src/cleanup/CandidateRegister.tsx',
  'src/cleanup/useCleanup.ts',
  'src/cleanup/native.ts',
  'src/operations/StorageCleanupLiveWorkbench.tsx',
  'src/components/workbench/ServiceWorkbenchHost.tsx',
  'electron/native/cleanup-bridge.cjs',
  'electron/preload.cjs',
  'shared/native-contracts.ts',
];

const SERVICES = [
  { key: 'cleanup-temp-preview', slug: 'temp-preview' },
  { key: 'cleanup-temp-quarantine', slug: 'temp-quarantine' },
  { key: 'cleanup-temp-undo', slug: 'temp-undo' },
  { key: 'cleanup-quarantine-list', slug: 'quarantine-list' },
  { key: 'cleanup-estimate', slug: 'estimate' },
  { key: 'cleanup-recycle', slug: 'recycle' },
  { key: 'cleanup-unused', slug: 'unused' },
  { key: 'cleanup-update-cache', slug: 'update-cache' },
  { key: 'cleanup-browser-cache', slug: 'browser-cache' },
  { key: 'cleanup-logs', slug: 'logs' },
  { key: 'cleanup-schedule', slug: 'schedule' },
  { key: 'cleanup-reports', slug: 'reports' },
].map((entry) => ({ ...entry, body: `cleanup-${entry.key}-workbench` }));

try {
  await app.evaluate(({ dialog }) => {
    dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] });
    dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false });
  });

  for (const name of WATCHED) proof.sourceFiles[name] = createHash('sha256').update(await readFile(name)).digest('hex');
  proof.runtime = await app.evaluate(({ app }) => ({ isPackaged: app.isPackaged, version: app.getVersion() }));

  const page = await app.firstWindow();
  page.on('pageerror', (e) => proof.errors.push(e.stack || e.message));
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
    location.hash = 'cleanup';
  });

  async function boot(locale, theme) {
    await page.evaluate(({ locale, theme }) => {
      localStorage.setItem('knoux_locale', locale);
      localStorage.setItem('knoux_theme', theme);
      location.hash = 'cleanup';
    }, { locale, theme });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByTestId('cleanup-workspace').waitFor({ timeout: 30000 });
    await page.waitForTimeout(500);
  }

  async function runScan() {
    // Keep owner shell metadata and servicing stores out of the measurement.
    await page.locator('.cln-scope-details summary').first().click();
    const toggles = page.locator('.cln-cat-toggle');
    for (const index of [3, 4]) {
      const toggle = toggles.nth(index);
      if ((await toggle.getAttribute('aria-pressed')) === 'true') await toggle.click();
    }
    await page.getByTestId('cleanup-scan-btn').click();
    await expect
      .poll(async () => {
        const text = (await page.getByTestId('cleanup-kpi-candidates-value').textContent({ timeout: 2000 }).catch(() => '—')) || '—';
        return Number(text.replace(/[^\d]/g, '')) || 0;
      }, { timeout: 180000 })
      .toBeGreaterThan(0);
    await expect(page.getByTestId('cleanup-scan-btn')).toBeVisible({ timeout: 180000 });
    const details = page.locator('.cln-scope-details').first();
    if (await details.evaluate((el) => el.open)) await details.locator('summary').first().click();
    await page.waitForTimeout(700);
    const state = await page.getByTestId('cleanup-scan-state').evaluate((el) => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const banner = await page.getByTestId('cleanup-native-banner').evaluate((el) => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const kpi = await page.evaluate(() => ({
      candidates: document.querySelector('[data-testid="cleanup-kpi-candidates-value"]')?.textContent || null,
      eligible: document.querySelector('[data-testid="cleanup-kpi-eligible-value"]')?.textContent || null,
      review: document.querySelector('[data-testid="cleanup-kpi-review-value"]')?.textContent || null,
    }));
    proof.probes.push({ probe: 'measured-discovery', state, banner: banner.slice(0, 200), kpi });
    proof.checks.push({ scannedCategories: ['temp', 'browser', 'logs'], measuredKpi: kpi });
  }

  async function openService(entry) {
    if (await page.getByTestId('cleanup-workbench').count()) {
      await page.getByTestId('cleanup-workbench-tool-select').selectOption(entry.key);
    } else {
      await page.getByTestId(`cleanup-service-${entry.key}`).click();
    }
    await expect(page.getByTestId(entry.body)).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(200);
  }

  async function closeWorkbench() {
    if (await page.getByTestId('cleanup-workbench').count()) {
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
      const workspace = document.querySelector('[data-testid="cleanup-workspace"]');
      return {
        overflow: document.documentElement.scrollHeight - innerHeight,
        width: innerWidth,
        height: innerHeight,
        theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
        dir: workspace?.closest('[dir]')?.getAttribute('dir') || document.querySelector('#root > div')?.getAttribute('dir'),
        scrollsInternally: !!workspace && workspace.scrollHeight > workspace.clientHeight,
        workbench: document.querySelector('[data-testid="cleanup-workbench"]')?.getAttribute('data-workbench-mode') || null,
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

  const seenBodies = new Set();
  let scanned = false;
  const combos = [['en', 'light'], ['en', 'dark'], ['ar', 'light'], ['ar', 'dark']];
  for (const [locale, theme] of combos) {
    await boot(locale, theme);
    if (!scanned && locale === 'en' && theme === 'light') {
      await runScan();
      scanned = true;
    } else {
      const candidates = (await page.getByTestId('cleanup-kpi-candidates-value').textContent()) || '—';
      expect(Number(candidates.replace(/[^\d]/g, '')) || 0).toBeGreaterThan(0);
    }
    await closeWorkbench();
    await viewport(1672, 941);
    await capture(`overview-${locale}-${theme}-1672`, 1672, 941, locale, theme, 'overview');
    if ((locale === 'en' && theme === 'light') || (locale === 'ar' && theme === 'dark')) {
      await capture(`overview-${locale}-${theme}-1366`, 1366, 768, locale, theme, 'overview');
      await capture(`overview-${locale}-${theme}-1920`, 1920, 1080, locale, theme, 'overview');
    }
    await viewport(1672, 941);

    for (const entry of SERVICES) {
      await openService(entry);
      const body = page.getByTestId(entry.body);
      const info = await body.evaluate((el) => ({
        testId: el.getAttribute('data-testid'),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
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
      // Expanded workbench mode renders the same measured body.
      await openService(SERVICES.find((s) => s.key === 'cleanup-estimate'));
      await page.getByTestId('workbench-mode-toggle').click();
      await expect(page.getByTestId('cleanup-workbench-expanded-shell')).toBeVisible({ timeout: 10000 });
      await capture('estimate-expanded-en-light-1672', 1672, 941, 'en', 'light', 'estimate-expanded');
      await page.getByTestId('workbench-mode-toggle').click();
      await expect(page.getByTestId('cleanup-workbench-side-shell')).toBeVisible({ timeout: 10000 });
      proof.checks.push('Expanded and pinned workbench modes both render the Cleanup service body');

      // Real controls, one probe per interactive service.
      await openService(SERVICES.find((s) => s.key === 'cleanup-estimate'));
      await page.getByTestId('cleanup-estimate-recalc').click();
      await expect(page.getByTestId('cleanup-cleanup-estimate-workbench')).toContainText(/recalculated|أُعيد حساب/i, { timeout: 10000 });
      proof.probes.push({ probe: 'estimate-recalc', summary: 'Recalculated the measured estimate draft; nothing executed.' });

      await openService(SERVICES.find((s) => s.key === 'cleanup-schedule'));
      await page.getByTestId('cleanup-schedule-compose').click();
      await expect(page.locator('.cln-occurrences li').first()).toBeVisible({ timeout: 20000 });
      const occurrences = await page.locator('.cln-occurrences li').count();
      proof.probes.push({ probe: 'schedule-compose', occurrences });

      await openService(SERVICES.find((s) => s.key === 'cleanup-reports'));
      await page.getByTestId('cleanup-reports-export').click();
      const reportToast = page.locator('.cln-toast').filter({ hasText: /report|تقرير/i }).first();
      await expect(reportToast).toBeVisible({ timeout: 8000 });
      proof.probes.push({ probe: 'report-export', toast: ((await reportToast.textContent()) || '').trim().slice(0, 160) });

      await openService(SERVICES.find((s) => s.key === 'cleanup-temp-preview'));
      await page.getByTestId('cleanup-cleanup-temp-preview-workbench').getByRole('button', { name: /safe defaults|الافتراضي الآمن/i }).click();
      const selected = await page.getByTestId('cleanup-actionbar').evaluate((el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80));
      proof.probes.push({ probe: 'safe-defaults', actionbar: selected });
    }
    await closeWorkbench();
  }
  proof.checks.push(`Twelve distinct Cleanup service bodies verified across DAY/NIGHT and EN/AR (${seenBodies.size} signatures)`);
  expect(seenBodies.size).toBe(12);
  const uniqueTexts = new Set(proof.services.filter((s) => s.locale === 'en' && s.theme === 'light').map((s) => s.text));
  expect(uniqueTexts.size).toBe(12);
  proof.checks.push('All twelve bodies expose distinct measured content and at least one control');

  // Real handoff: quarantine review opens the executing Safety Vault, and the
  // twelve services are not replaced by it.
  await boot('en', 'light');
  await openService(SERVICES.find((s) => s.key === 'cleanup-temp-quarantine'));
  await page.getByTestId('cleanup-temp-quarantine-vault').click();
  await expect(page.getByTestId('storage-cleanup-live')).toBeVisible({ timeout: 15000 });
  // The service scene must survive the handoff: the vault overlays it instead
  // of replacing it, which is exactly what the old redirect bug did.
  await expect(page.getByTestId('cleanup-cleanup-temp-quarantine-workbench')).toHaveCount(1);
  proof.checks.push('cleanup-temp-quarantine hands off to the executing Safety Vault without replacing its own scene');
  await page.getByTestId('storage-cleanup-live').getByTestId('workbench-close').click();
  await expect(page.getByTestId('storage-cleanup-live')).toHaveCount(0);

  const security = await app.evaluate(({ BrowserWindow }) => {
    const p = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return { contextIsolation: p.contextIsolation, sandbox: p.sandbox, nodeIntegration: p.nodeIntegration, webSecurity: p.webSecurity };
  });
  proof.checks.push({ security });
  expect(security).toEqual({ contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true });

  const after = {};
  for (const name of Object.keys(tracked)) after[name] = sha(await readFile(path.join(root, name)));
  const unchanged = Object.keys(tracked).every((name) => tracked[name] === after[name]);
  proof.checks.push({ fixtureUnchanged: unchanged, fixtureFiles: Object.keys(tracked).length });
  expect(unchanged).toBe(true);

  proof.ok = proof.errors.length === 0;
  await writeFile(path.join(OUT, 'capture-proof.json'), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify({ ok: proof.ok, sourceCommit: proof.sourceCommit, captures: proof.captures.length, services: proof.services.length, probes: proof.probes, errors: proof.errors, out: OUT }, null, 2));
  if (!proof.ok) process.exit(1);
  console.log('[cleanup-owner-fullstack-capture] PASS');
} catch (error) {
  proof.errors.push(error?.message || String(error));
  await writeFile(path.join(OUT, 'capture-proof.json'), JSON.stringify(proof, null, 2)).catch(() => {});
  console.error('[cleanup-owner-fullstack-capture] FAILED', error?.stack || error);
  process.exit(1);
} finally {
  await app.close().catch(() => {});
  await rm(root, { recursive: true, force: true }).catch(() => {});
}
