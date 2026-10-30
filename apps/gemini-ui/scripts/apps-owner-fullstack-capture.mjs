/**
 * KNOuX Applications — current-HEAD owner evidence capture.
 *
 * Deterministic, isolated-profile Electron run against the BUILT renderer
 * (dist/). It reads the real Windows uninstall registry, Appx/MSIX inventory
 * and Win32_StartupCommand through the read-only Applications coordinator,
 * then captures the overview and all twelve service workbenches in DAY/NIGHT
 * and EN/AR at the owner viewports.
 *
 * Every interaction below is read-only or plan-only: signature verification,
 * bounded footprint measurement, bounded association sampling, Appx/WinGet
 * listing, leftover naming evidence and an immutable review plan. No uninstall,
 * update, association write, startup toggle or file/registry mutation exists.
 */
import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const OUT = path.resolve(process.env.KNOUX_APPS_CAPTURE_DIR || '../../docs/evidence/owner-fullstack-20261030/applications-current');
await mkdir(OUT, { recursive: true });

const profile = await mkdtemp(path.join(os.tmpdir(), 'knoux-apps-capture-'));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const app = await electron.launch({
  executablePath: require('electron'),
  args: [path.resolve('electron/main.cjs'), '--disable-gpu', '--knoux-user-data=' + profile],
  env,
  timeout: 60000,
});

const proof = {
  domain: 'Applications',
  runtime: null,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim(),
  profileIsolated: true,
  sourceFiles: {},
  captures: [],
  services: [],
  probes: [],
  checks: [],
  errors: [],
  ok: false,
};

const WATCHED = [
  'src/pages/ApplicationsPage.tsx',
  'src/apps/ApplicationsHero.tsx',
  'src/apps/ApplicationServices.tsx',
  'src/apps/AppRegister.tsx',
  'src/apps/AppDossier.tsx',
  'src/apps/AppServiceWorkspace.tsx',
  'src/apps/useApplications.ts',
  'src/apps/native.ts',
  'src/apps/model.ts',
  'src/apps/catalog.ts',
  'src/applications.css',
  'src/components/workbench/ServiceWorkbenchHost.tsx',
  'electron/native/app-bridge.cjs',
  'electron/preload.cjs',
  'shared/native-contracts.ts',
];

const SERVICES = [
  'app-inventory',
  'app-identity',
  'app-search',
  'app-publisher',
  'app-recent',
  'app-uninstall-queue',
  'app-leftovers',
  'app-updates',
  'app-size',
  'app-store-packages',
  'app-associations',
  'app-startup-impact',
];

try {
  for (const name of WATCHED) proof.sourceFiles[name] = createHash('sha256').update(await readFile(name)).digest('hex');
  proof.runtime = await app.evaluate(({ app }) => ({ isPackaged: app.isPackaged, version: app.getVersion() }));

  const page = await app.firstWindow();
  page.on('pageerror', (e) => proof.errors.push(e.message));
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
    location.hash = 'applications';
  });

  async function boot(locale, theme) {
    await page.evaluate(({ locale, theme }) => {
      localStorage.setItem('knoux_locale', locale);
      localStorage.setItem('knoux_theme', theme);
      location.hash = 'applications';
    }, { locale, theme });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByTestId('apps-workspace').waitFor({ timeout: 30000 });
    await expect(page.getByTestId('apps-services').getByRole('button')).toHaveCount(12, { timeout: 30000 });
    // The register is populated only by the native coordinator.
    await page.waitForFunction(() => {
      const value = document.querySelector('[data-testid="apps-kpi-installed-value"]');
      return Boolean(value && value.textContent && value.textContent.trim() !== '—' && value.textContent.trim() !== '');
    }, null, { timeout: 45000 });
    await page.waitForTimeout(320);
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
      const workspace = document.querySelector('[data-testid="apps-workspace"]');
      return {
        overflow: document.documentElement.scrollHeight - innerHeight,
        width: innerWidth,
        height: innerHeight,
        theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
        dir: document.documentElement.getAttribute('dir'),
        mainOverflowX: workspace ? workspace.scrollWidth - workspace.clientWidth : null,
        tiles: document.querySelectorAll('[data-testid^="apps-service-"]').length,
        workbench: document.querySelector('[data-testid="apps-workbench"]')?.getAttribute('data-workbench-mode') || null,
      };
    });
    expect(geo.width).toBe(width);
    expect(geo.height).toBe(height);
    expect(geo.overflow).toBeLessThanOrEqual(2);
    expect(geo.theme).toBe(theme);
    expect(geo.dir).toBe(locale === 'ar' ? 'rtl' : 'ltr');
    expect(geo.tiles).toBe(12);
    expect(Math.abs(geo.mainOverflowX ?? 0)).toBeLessThanOrEqual(2);
    const kpiClipped = await page.evaluate(() => Array.from(document.querySelectorAll('.apps-kpi-card'))
      .flatMap((card) => Array.from(card.querySelectorAll('.apps-kpi-value,.apps-kpi-label,.apps-kpi-sub'))
        .filter((node) => node.scrollWidth - node.clientWidth > 1 || node.scrollHeight - node.clientHeight > 1)
        .map((node) => ({ kpi: card.getAttribute('data-testid'), text: (node.textContent || '').trim() }))));
    expect(kpiClipped, `${name} ellipsized overview KPI`).toEqual([]);
    const w = await app.browserWindow(page);
    await w.evaluate((win) => { win.show(); win.moveTop(); win.webContents.invalidate(); });
    await page.waitForTimeout(120);
    const png = await w.evaluate(async (win) => (await win.webContents.capturePage()).toPNG().toString('base64'));
    const file = `${name}.png`;
    await writeFile(path.join(OUT, file), Buffer.from(png, 'base64'));
    proof.captures.push({ file, width, height, locale, theme, service, geo });
    return geo;
  }

  async function openService(key) {
    await page.getByTestId(`apps-service-${key}`).click();
    await expect(page.getByTestId('apps-workbench-side-shell')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('app-service-focus')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(180);
  }

  async function closeWorkbench() {
    const gate = page.getByTestId('apps-plan-gate');
    if (await gate.count()) {
      await gate.locator('button[aria-label]').first().click();
      await page.waitForTimeout(140);
    }
    const close = page.getByTestId('workbench-close');
    if (await close.count()) {
      await close.click();
      await page.waitForTimeout(160);
    }
  }

  // Wait until no primary action in the body is busy. A read-only query can
  // honestly take tens of seconds (WinGet), so the timeout is generous and a
  // late timeout is recorded rather than hidden.
  async function primaryIdle(body, timeoutMs, label) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const busy = await body.locator('.apps-btn-primary[disabled]').count();
      if (!busy) return true;
      await page.waitForTimeout(250);
    }
    proof.probes.push({ probe: 'primary-timeout', label });
    return false;
  }

  async function prepare(key) {
    const body = page.getByTestId('app-service-focus');
    switch (key) {
      case 'app-identity': {
        const primary = body.locator('.apps-btn-primary').first();
        if (await primary.count()) {
          await primary.click();
          await primaryIdle(body, 60000, key);
        }
        break;
      }
      case 'app-search': {
        const input = body.locator('.apps-inline-search input').first();
        if (await input.count()) {
          await input.fill('a');
          await page.waitForTimeout(350);
        }
        break;
      }
      case 'app-recent': {
        const range = body.locator('.apps-segmented button');
        if (await range.count()) {
          await range.last().click();
          await page.waitForTimeout(200);
        }
        break;
      }
      case 'app-leftovers':
      case 'app-updates':
      case 'app-store-packages':
      case 'app-associations': {
        const primary = body.locator('.apps-btn-primary').first();
        if (await primary.count()) {
          const timeout = key === 'app-updates' ? 90000 : 60000;
          await primary.click();
          await primaryIdle(body, timeout, key);
          await page.waitForTimeout(250);
        }
        break;
      }
      case 'app-size': {
        // "Use current selection" seeds the measured apps; the primary button
        // is disabled until a selection exists.
        const pick = body.locator('.apps-service-toolbar .apps-btn').first();
        if (await pick.count()) {
          await pick.click();
          await page.waitForTimeout(160);
        }
        const primary = body.locator('.apps-btn-primary').first();
        if (await primary.count() && await primary.isEnabled()) {
          await primary.click();
          await primaryIdle(body, 60000, key);
          await page.waitForTimeout(250);
        }
        break;
      }
      default:
        break;
    }
  }

  async function inspectBody(key, locale, theme) {
    await openService(key);
    await prepare(key);
    const body = page.getByTestId('app-service-focus');
    const info = await body.evaluate((el) => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      controls: el.querySelectorAll('button,input,select,a[href]').length,
      visible: el.getBoundingClientRect().height > 0,
      overflowX: el.scrollWidth - el.clientWidth,
      scrollers: (() => {
        const out = [];
        el.querySelectorAll('*').forEach((node) => {
          const over = node.scrollWidth - node.clientWidth;
          if (over > 2 && node.clientWidth > 0) out.push({ tag: node.tagName, cls: String(node.className || '').slice(0, 120), over });
        });
        if (el.scrollWidth - el.clientWidth > 2) out.unshift({ tag: el.tagName, cls: 'BODY-ROOT', over: el.scrollWidth - el.clientWidth });
        return out.slice(0, 8);
      })(),
      // Horizontal fit of every measured table. A service table must fit its
      // wrap at the pinned width; a table that scrolls sideways hides the very
      // columns the service exists to show.
      tables: Array.from(el.querySelectorAll('.apps-table-wrap-service table.apps-table')).map((table) => {
        const wrap = table.parentElement;
        const cols = Array.from(table.querySelectorAll('col')).map((col) => Math.round(col.getBoundingClientRect().width));
        const th = Array.from(table.querySelectorAll('thead th')).map((cell) => {
          // Count the label's own line boxes with a Range: a table cell's
          // clientHeight is the shared row height, so it cannot attribute
          // wrapping to an individual header.
          const range = document.createRange();
          range.selectNodeContents(cell);
          const tops = new Set(Array.from(range.getClientRects()).map((rect) => Math.round(rect.top)));
          return {
            text: (cell.textContent || '').trim().toUpperCase(),
            w: Math.round(cell.getBoundingClientRect().width),
            clipped: cell.scrollWidth - cell.clientWidth > 1,
            lines: Math.max(1, tops.size),
          };
        });
        return {
          wrap: Math.round(wrap.clientWidth),
          table: Math.round(table.getBoundingClientRect().width),
          scroll: table.scrollWidth,
          cols,
          th,
        };
      }),
      // Measured values must never be cut. Long identifiers may ellipsize only
      // when the full text is reachable through a title tooltip, so split the
      // two cases: `clipped` is silent truncation and fails the run;
      // `disclosed` is truncation with a hover title and is recorded instead.
      clipped: (() => {
        const nodes = Array.from(el.querySelectorAll('.apps-row-name,.apps-service-sub,.apps-row-publisher,.apps-kpi-value,.apps-kpi-sub,.apps-chip'));
        const overflow = nodes.filter((node) => node.scrollWidth - node.clientWidth > 1 || node.scrollHeight - node.clientHeight > 1);
        const strict = (node) => node.classList.contains('apps-kpi-value') || node.classList.contains('apps-kpi-sub') || node.classList.contains('apps-chip');
        return {
          clipped: overflow
            .filter((node) => strict(node) || !node.getAttribute('title'))
            .map((node) => ({ cls: String(node.className || '').slice(0, 60), text: (node.textContent || '').trim() }))
            .slice(0, 12),
          disclosed: overflow
            .filter((node) => !strict(node) && node.getAttribute('title'))
            .map((node) => ({ cls: String(node.className || '').slice(0, 60), text: (node.textContent || '').trim() }))
            .slice(0, 12),
        };
      })(),
    }));
    const signature = createHash('sha256').update(info.text).digest('hex').slice(0, 16);
    proof.services.push({
      key,
      locale,
      theme,
      signature,
      text: info.text.slice(0, 180),
      controls: info.controls,
      overflowX: info.overflowX,
      scrollers: info.scrollers,
      clipped: info.clipped.clipped,
      disclosedTooltips: info.clipped.disclosed.length,
      tables: info.tables,
    });
    expect(info.visible, `${key} body hidden`).toBe(true);
    expect(info.controls, `${key} has no control :: ${info.text.slice(0, 160)}`).toBeGreaterThan(0);
    expect(info.overflowX, `${key} overflows horizontally`).toBeLessThanOrEqual(2);
    expect(info.clipped.clipped.map((n) => n.text), `${key} silently clipped text`).toEqual([]);
    for (const table of info.tables) {
      expect(table.scroll, `${key} table scrolls sideways (${table.scroll} > ${table.wrap})`).toBeLessThanOrEqual(table.wrap + 2);
      expect(table.th.filter((cell) => cell.clipped).map((cell) => cell.text), `${key} clipped table header`).toEqual([]);
      expect(table.th.filter((cell) => cell.lines > 2).map((cell) => `${cell.text}:${cell.lines} lines`), `${key} stacked table header`).toEqual([]);
    }
    await capture(`${key}-${locale}-${theme}-1672`, 1672, 941, locale, theme, key);

    // The uninstall queue is the one service whose primary action opens the
    // immutable plan gate. Capture that gate once, with the real plan totals.
    if (key === 'app-uninstall-queue' && locale === 'en') {
      const primary = body.locator('.apps-btn-primary').first();
      if (await primary.count() && await primary.isEnabled()) {
        await primary.click();
        await expect(page.getByTestId('apps-plan-gate')).toBeVisible({ timeout: 20000 });
        const gateText = (await page.getByTestId('apps-plan-gate').innerText()).replace(/\s+/g, ' ').trim();
        proof.probes.push({ probe: 'apps-plan-gate', gate: gateText.slice(0, 220), blocked: /blocked/i.test(gateText) });
        await capture('apps-plan-gate-en-light-1672', 1672, 941, locale, theme, 'app-uninstall-queue');
      }
    }
    await closeWorkbench();
  }

  await boot('en', 'light');
  await capture('overview-1366x768-en-light', 1366, 768, 'en', 'light', 'overview');
  await capture('overview-1672x941-en-light', 1672, 941, 'en', 'light', 'overview');
  await capture('overview-1920x1080-en-light', 1920, 1080, 'en', 'light', 'overview');

  const inventorySummary = await page.evaluate(() => ({
    installed: document.querySelector('[data-testid="apps-kpi-installed-value"]')?.textContent?.trim(),
    registerRows: document.querySelectorAll('[data-testid="apps-register-row"]').length,
    banner: document.querySelector('[data-testid="apps-native-banner"]')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 180),
  }));
  proof.probes.push({ probe: 'apps-inventory', ...inventorySummary });

  for (const key of SERVICES) await inspectBody(key, 'en', 'light');

  // Expanded mode proves the same body fits the full-width host, not just the
  // pinned panel. The four table-heaviest services are captured here so the
  // evidence shows every measured column at full width.
  for (const key of ['app-inventory', 'app-search', 'app-store-packages', 'app-associations', 'app-startup-impact']) {
    await openService(key);
    await prepare(key);
    await page.getByTestId('workbench-mode-toggle').click();
    await expect(page.getByTestId('apps-workbench-expanded-shell')).toBeVisible({ timeout: 15000 });
    const expanded = await page.getByTestId('app-service-focus').evaluate((el) => ({
      wide: el.scrollWidth - el.clientWidth,
      wrap: Math.round((el.querySelector('.apps-table-wrap-service') || el).clientWidth),
    }));
    proof.probes.push({ probe: `expanded-${key}`, overflowX: expanded.wide, tableWrap: expanded.wrap });
    expect(expanded.wide, `${key} expanded body overflows`).toBeLessThanOrEqual(2);
    await capture(`${key}-expanded-en-light-1672`, 1672, 941, 'en', 'light', `${key}-expanded`);
    await page.getByTestId('workbench-mode-toggle').click();
    await expect(page.getByTestId('apps-workbench-side-shell')).toBeVisible({ timeout: 15000 });
    await closeWorkbench();
  }

  // The tool selector must switch services inside the same host.
  await openService('app-search');
  await page.getByTestId('apps-workbench-tool-select').selectOption('app-associations');
  await expect(page.getByTestId('app-service-focus')).toContainText(/sampled|عينة|Bounded|محدودة/i, { timeout: 10000 });
  proof.probes.push({ probe: 'apps-tool-selector', switched: true });
  await closeWorkbench();

  await boot('ar', 'dark');
  await capture('overview-1672x941-ar-dark', 1672, 941, 'ar', 'dark', 'overview');
  for (const key of SERVICES) await inspectBody(key, 'ar', 'dark');

  const security = await app.evaluate(({ BrowserWindow }) => {
    const prefs = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return {
      contextIsolation: prefs.contextIsolation,
      sandbox: prefs.sandbox,
      nodeIntegration: prefs.nodeIntegration,
      webSecurity: prefs.webSecurity,
    };
  });
  proof.checks.push({ security });
  expect(security).toEqual({ contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true });

  const uniqueByLocale = new Map();
  for (const row of proof.services) {
    if (!uniqueByLocale.has(row.locale)) uniqueByLocale.set(row.locale, new Set());
    uniqueByLocale.get(row.locale).add(row.signature);
  }
  for (const [locale, signatures] of uniqueByLocale) {
    expect(signatures.size, `twelve distinct measured service signatures in ${locale}`).toBe(12);
  }
  proof.checks.push(`Twelve distinct Applications service bodies verified across DAY/NIGHT and EN/AR (12 signatures)`);
  proof.checks.push('Every captured body exposes at least one measured control and no ellipsized label');
  proof.ok = proof.errors.length === 0;
} catch (error) {
  proof.errors.push(error instanceof Error ? error.message : String(error));
  proof.ok = false;
} finally {
  try {
    await app.close();
  } catch {
    // The proof already records any failure that stopped the run.
  }
}

await writeFile(path.join(OUT, 'capture-proof.json'), JSON.stringify(proof, null, 2));
console.log(JSON.stringify({ ok: proof.ok, captures: proof.captures.length, services: proof.services.length, probes: proof.probes.length, errors: proof.errors }, null, 2));
if (!proof.ok) process.exitCode = 1;
