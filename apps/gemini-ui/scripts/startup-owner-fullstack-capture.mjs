/**
 * KNOuX Startup — current-HEAD owner evidence capture.
 *
 * Deterministic, isolated-profile Electron run against the BUILT renderer
 * (dist/). It reads the real Windows autorun register (Run keys, Startup
 * folders, services, logon tasks) through the read-only Startup coordinator,
 * then captures the overview and all twelve service workbenches in DAY/NIGHT
 * and EN/AR at the owner viewports.
 *
 * Every interaction below is read-only or plan-only: a register scan, a
 * journal read, an impact evidence read and an immutable staging plan. No
 * registry, task, service or file write exists in Mission 09.
 */
import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const OUT = path.resolve(process.env.KNOUX_STARTUP_CAPTURE_DIR || '../../docs/evidence/owner-fullstack-20261030/startup-current');
await mkdir(OUT, { recursive: true });

const profile = await mkdtemp(path.join(os.tmpdir(), 'knoux-startup-capture-'));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const app = await electron.launch({
  executablePath: require('electron'),
  args: [path.resolve('electron/main.cjs'), '--disable-gpu', '--knoux-user-data=' + profile],
  env,
  timeout: 60000,
});

const proof = {
  domain: 'Startup',
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
  'src/pages/StartupPage.tsx',
  'src/startup/StartupHero.tsx',
  'src/startup/AutorunRegister.tsx',
  'src/startup/AutorunInspector.tsx',
  'src/startup/ServiceRail.tsx',
  'src/startup/ServiceWorkspace.tsx',
  'src/startup/PlanGate.tsx',
  'src/startup/useStartup.ts',
  'src/startup/native.ts',
  'src/startup/model.ts',
  'src/startup.css',
  'src/components/workbench/ServiceWorkbenchHost.tsx',
  'electron/native/startup-bridge.cjs',
  'electron/preload.cjs',
  'shared/native-contracts.ts',
];

const SERVICES = [
  'startup-overview',
  'startup-disable',
  'startup-restore',
  'startup-sources',
  'startup-journal',
  'startup-filter',
  'startup-impact',
  'startup-services',
  'startup-tasks',
  'startup-delay',
  'startup-batch',
  'startup-undo-all',
];

try {
  for (const name of WATCHED) proof.sourceFiles[name] = createHash('sha256').update(await readFile(name)).digest('hex');
  proof.runtime = await app.evaluate(({ app }) => ({ isPackaged: app.isPackaged, version: app.getVersion() }));

  const page = await app.firstWindow();
  page.on('pageerror', (e) => proof.errors.push(e.message));
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
    location.hash = 'startup';
  });

  async function boot(locale, theme) {
    await page.evaluate(({ locale, theme }) => {
      localStorage.setItem('knoux_locale', locale);
      localStorage.setItem('knoux_theme', theme);
      location.hash = 'startup';
    }, { locale, theme });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByTestId('startup-workspace').waitFor({ timeout: 30000 });
    await expect(page.getByTestId('startup-services').getByRole('button')).toHaveCount(12, { timeout: 30000 });
    // The register is populated only by the native coordinator, and the scan
    // reports staged progress while it runs. "0" is a valid transient value, so
    // wait for real rows and for the cancel control to disappear instead of
    // for any non-empty KPI.
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('[data-testid="startup-register"] tbody tr').length;
      const entries = Number((document.querySelector('[data-testid="startup-kpi-entries-value"]')?.textContent || '').replace(/\D/g, ''));
      const cancelling = Array.from(document.querySelectorAll('button')).some((button) => /cancel scan|إلغاء الفحص/i.test(button.textContent || ''));
      return rows > 0 && entries > 0 && !cancelling;
    }, null, { timeout: 180000 });
    await page.waitForTimeout(400);
  }

  async function viewport(width, height) {
    const w = await app.browserWindow(page);
    await w.evaluate((win, [ww, hh]) => win.setContentSize(ww, hh), [width, height]);
    await page.waitForTimeout(160);
  }

  async function capture(name, width, height, locale, theme, service) {
    await viewport(width, height);
    // A scan-completed status toast can overlap the workbench header. It is a
    // transient notification, not part of the surface under review: give it a
    // chance to expire, then dismiss it so the receipt shows the service.
    const toast = page.locator('.stp-toast');
    if (await toast.count()) {
      await page.waitForTimeout(2600);
      if (await toast.count()) {
        const dismiss = toast.first().locator('button[aria-label]');
        if (await dismiss.count()) await dismiss.first().click().catch(() => {});
        await page.waitForTimeout(180);
      }
    }
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    await page.waitForTimeout(220);
    const geo = await page.evaluate(() => {
      const workspace = document.querySelector('[data-testid="startup-workspace"]');
      return {
        overflow: document.documentElement.scrollHeight - innerHeight,
        width: innerWidth,
        height: innerHeight,
        theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
        dir: document.documentElement.getAttribute('dir'),
        mainOverflowX: workspace ? workspace.scrollWidth - workspace.clientWidth : null,
        tiles: document.querySelectorAll('[data-testid^="startup-service-"]').length,
        workbench: document.querySelector('[data-testid="startup-workbench"]')?.getAttribute('data-workbench-mode') || null,
      };
    });
    expect(geo.width).toBe(width);
    expect(geo.height).toBe(height);
    expect(geo.overflow).toBeLessThanOrEqual(2);
    expect(geo.theme).toBe(theme);
    expect(geo.dir).toBe(locale === 'ar' ? 'rtl' : 'ltr');
    expect(Math.abs(geo.mainOverflowX ?? 0)).toBeLessThanOrEqual(2);
    // Horizontal only: a tight line-height can make the digit glyph box a pixel
    // taller than the element without losing any text, but a KPI cut sideways
    // is a real loss.
    const kpiClipped = await page.evaluate(() => Array.from(document.querySelectorAll('.stp-kpi'))
      .flatMap((card) => Array.from(card.querySelectorAll('.stp-kpi-value,.stp-kpi-title,.stp-kpi-sub'))
        .filter((node) => node.scrollWidth - node.clientWidth > 1)
        .map((node) => ({ kpi: (card.querySelector('.stp-kpi-title') || card).textContent?.trim(), text: (node.textContent || '').trim() }))));
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
    const card = page.getByTestId(`startup-service-${key}`);
    await card.waitFor({ state: 'visible', timeout: 20000 });
    await card.scrollIntoViewIfNeeded().catch(() => {});
    // A transient status toast can sit over the rail right after a resize; one
    // retry keeps a flake from failing the evidence run.
    try {
      await card.click({ timeout: 15000 });
    } catch {
      await page.waitForTimeout(800);
      await card.click({ timeout: 20000 });
    }
    await expect(page.getByTestId('startup-workbench-side-shell')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('startup-service-focus')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(180);
  }

  async function closeWorkbench() {
    const gate = page.getByTestId('startup-plan-gate');
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

  async function idle(body, timeoutMs, label) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const busy = await body.locator('button[disabled]').count();
      const busyPrimary = await body.locator('.stp-btn-primary[disabled]').count();
      if (!busyPrimary || busy === 0) return true;
      await page.waitForTimeout(250);
    }
    proof.probes.push({ probe: 'busy-timeout', label });
    return false;
  }

  // Every preparation below is a read or a selection. Nothing stages a write:
  // a staged plan opens the immutable gate, which the evidence captures once.
  async function prepare(key) {
    const body = page.getByTestId('startup-service-focus');
    switch (key) {
      case 'startup-disable': {
        const row = body.locator('.stp-picker-row').first();
        if (await row.count()) {
          await row.click();
          await page.waitForTimeout(200);
        }
        break;
      }
      case 'startup-restore':
      case 'startup-undo-all': {
        const read = body.locator('.stp-btn-quiet').first();
        if (await read.count() && await read.isEnabled()) {
          await read.click();
          await idle(body, 30000, key);
          await page.waitForTimeout(300);
        }
        break;
      }
      case 'startup-impact': {
        const read = body.locator('.stp-btn-ghost').first();
        if (await read.count() && await read.isEnabled()) {
          await read.click();
          await idle(body, 30000, key);
          await page.waitForTimeout(300);
        }
        break;
      }
      case 'startup-filter': {
        const input = body.locator('.stp-query input').first();
        if (await input.count()) {
          await input.fill('a');
          await page.waitForTimeout(350);
        }
        break;
      }
      case 'startup-sources':
      case 'startup-services':
      case 'startup-tasks': {
        const tabs = body.locator('.stp-svc-facets button, .stp-tab-row button, .stp-svc-tabs button');
        if (await tabs.count() > 1) {
          await tabs.nth(1).click();
          await page.waitForTimeout(220);
        }
        break;
      }
      case 'startup-delay': {
        const toggle = body.locator('.stp-picker-row input, .stp-picker-check').first();
        if (await toggle.count()) {
          await toggle.click();
          await page.waitForTimeout(220);
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
    const body = page.getByTestId('startup-service-focus');
    const info = await body.evaluate((el) => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      controls: el.querySelectorAll('button,input,select,a[href]').length,
      visible: el.getBoundingClientRect().height > 0,
      overflowX: el.scrollWidth - el.clientWidth,
      scrollers: (() => {
        const out = [];
        el.querySelectorAll('*').forEach((node) => {
          const over = node.scrollWidth - node.clientWidth;
          // A deliberate scroll container (the picker lists) is allowed to be
          // narrower than its content; only non-scrollable overflow is a defect.
          const style = getComputedStyle(node);
          const scrolls = style.overflowX === 'auto' || style.overflowX === 'scroll';
          if (over > 2 && node.clientWidth > 0 && !scrolls) out.push({ tag: node.tagName, cls: String(node.className || '').slice(0, 120), over });
        });
        if (el.scrollWidth - el.clientWidth > 2) out.unshift({ tag: el.tagName, cls: 'BODY-ROOT', over: el.scrollWidth - el.clientWidth });
        return out.slice(0, 8);
      })(),
      // A capped subpanel must scroll, and a rail taller than the window must
      // still reach its last panel. Measure the host scroller: an overflow the
      // host cannot scroll is hidden content, not a layout preference.
      rail: (() => {
        const scroller = el.closest('.files-scrollbar');
        if (!scroller) return null;
        const style = getComputedStyle(scroller);
        const previous = scroller.scrollTop;
        scroller.scrollTop = scroller.scrollHeight;
        const panels = Array.from(el.querySelectorAll('.stp-subpanel'));
        const last = panels[panels.length - 1] || null;
        const scrollerRect = scroller.getBoundingClientRect();
        const lastRect = last ? last.getBoundingClientRect() : null;
        // Positive means the panel still hangs below the visible rail at full
        // scroll: unreachable.
        const lastPanelOverhang = lastRect ? Math.round(lastRect.bottom - scrollerRect.bottom) : 0;
        scroller.scrollTop = previous;
        return {
          over: scroller.scrollHeight - scroller.clientHeight,
          overflowY: style.overflowY,
          scrolledTo: Math.round(scroller.scrollHeight - previous),
          lastPanelOverhang,
        };
      })(),
      // Content taller than a capped subpanel must stay reachable: either the
      // body scrolls or the panel was tall enough. Hidden overflow is a cut.
      subpanels: Array.from(el.querySelectorAll('.stp-subpanel')).map((panel) => {
        const body = panel.querySelector('.stp-subpanel-body');
        if (!body) return null;
        const style = getComputedStyle(body);
        return {
          title: (panel.querySelector('h3')?.textContent || '').trim(),
          cut: body.scrollHeight - body.clientHeight,
          // A subpanel never scrolls sideways: a body wider than its box means
          // text is being clipped at the panel edge.
          wideX: body.scrollWidth - body.clientWidth,
          overflowY: style.overflowY,
        };
      }).filter(Boolean),
      // A table must fit its wrap: one that scrolls sideways hides the very
      // columns the service exists to show.
      tables: Array.from(el.querySelectorAll('.stp-mini-table-wrap table')).map((table) => {
        const wrap = table.parentElement;
        const th = Array.from(table.querySelectorAll('thead th')).map((cell) => {
          // Count the label's own line boxes with a Range: a table cell's
          // clientHeight is the shared row height.
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
          th,
        };
      }),
      // Measured values must never be cut. Text that ellipsizes or clamps is
      // acceptable only when a title tooltip reveals it; silently losing text
      // fails the run. KPI and stat values are strict.
      clipped: (() => {
        const strictCls = ['stp-kpi-value', 'stp-kpi-sub', 'stp-stat-value', 'stp-chip', 'stp-tag'];
        // Only leaves: a container whose children each ellipsize reports its
        // own scroll extent even when every child discloses its full text.
        const nodes = Array.from(el.querySelectorAll('*')).filter((node) => {
          if (node.childElementCount > 0) return false;
          if (!(node.textContent || '').trim()) return false;
          const style = getComputedStyle(node);
          const ellipsis = style.textOverflow === 'ellipsis';
          const clamp = style.webkitLineClamp;
          const clamped = clamp && clamp !== 'none' && clamp !== '0';
          return (ellipsis || clamped) && (node.scrollWidth - node.clientWidth > 1 || node.scrollHeight - node.clientHeight > 1);
        });
        const strict = (node) => strictCls.some((cls) => node.classList.contains(cls));
        return {
          clipped: nodes
            .filter((node) => strict(node) || !node.getAttribute('title'))
            .map((node) => ({ cls: String(node.className || '').slice(0, 60), text: (node.textContent || '').trim().slice(0, 80) }))
            .slice(0, 12),
          disclosed: nodes
            .filter((node) => !strict(node) && node.getAttribute('title'))
            .map((node) => ({ cls: String(node.className || '').slice(0, 60), text: (node.textContent || '').trim().slice(0, 80) }))
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
      subpanels: info.subpanels,
    });
    expect(info.visible, `${key} body hidden`).toBe(true);
    expect(info.controls, `${key} has no control :: ${info.text.slice(0, 160)}`).toBeGreaterThan(0);
    expect(info.overflowX, `${key} overflows horizontally`).toBeLessThanOrEqual(2);
    expect(info.clipped.clipped.map((n) => n.text), `${key} silently clipped text`).toEqual([]);
    if (info.rail) {
      proof.probes.push({ probe: `${key}-rail`, overflowY: info.rail.overflowY, over: info.rail.over, lastPanelOverhang: info.rail.lastPanelOverhang });
      expect(
        // A rail that overflows must scroll. Without this the bottom of the
        // service is simply painted outside the shell and lost.
        info.rail.over > 2 && !/auto|scroll/.test(info.rail.overflowY),
        `${key} rail overflows without a scroller`,
      ).toBe(false);
      expect(info.rail.lastPanelOverhang, `${key} last panel unreachable`).toBeLessThanOrEqual(2);
    }
    expect(
      info.subpanels.filter((panel) => panel.cut > 2 && !/auto|scroll/.test(panel.overflowY)).map((panel) => `${panel.title}:+${panel.cut}px hidden`),
      `${key} subpanel hides its own content`,
    ).toEqual([]);
    expect(
      info.subpanels.filter((panel) => panel.wideX > 2).map((panel) => `${panel.title}:+${panel.wideX}px sideways`),
      `${key} subpanel clips sideways`,
    ).toEqual([]);
    for (const table of info.tables) {
      expect(table.scroll, `${key} table scrolls sideways (${table.scroll} > ${table.wrap})`).toBeLessThanOrEqual(table.wrap + 2);
      expect(table.th.filter((cell) => cell.clipped).map((cell) => cell.text), `${key} clipped table header`).toEqual([]);
      expect(table.th.filter((cell) => cell.lines > 2).map((cell) => `${cell.text}:${cell.lines} lines`), `${key} stacked table header`).toEqual([]);
    }
    await capture(`${key}-${locale}-${theme}-1672`, 1672, 941, locale, theme, key);

    // The disable service stages the one immutable plan this domain can build.
    // Capture its gate so the review surface itself is in evidence.
    if (key === 'startup-disable' && locale === 'en') {
      const primary = body.locator('.stp-btn-primary').first();
      if (await primary.count() && await primary.isEnabled()) {
        await primary.click();
        await expect(page.getByTestId('startup-plan-gate')).toBeVisible({ timeout: 20000 });
        const gateText = (await page.getByTestId('startup-plan-gate').innerText()).replace(/\s+/g, ' ').trim();
        proof.probes.push({ probe: 'startup-plan-gate', gate: gateText.slice(0, 220), blocked: /blocked|no write|immutable/i.test(gateText) });
        await capture('startup-plan-gate-en-light-1672', 1672, 941, locale, theme, 'startup-disable');
      }
    }

    // The task rail stacks a 41-row scheduler tree above a dossier. Prove the
    // dossier's last row is reachable by scrolling the rail to its end.
    if (key === 'startup-tasks' && locale === 'en') {
      const scrolled = await page.getByTestId('startup-service-focus').evaluate((el) => {
        const scroller = el.closest('.files-scrollbar');
        if (!scroller) return null;
        scroller.scrollTop = scroller.scrollHeight;
        return { scrollTop: Math.round(scroller.scrollTop), scrollH: scroller.scrollHeight, clientH: scroller.clientHeight };
      });
      if (scrolled && scrolled.scrollTop > 0) {
        proof.probes.push({ probe: 'startup-tasks-rail-end', ...scrolled });
        await capture('startup-tasks-dossier-en-light-1672', 1672, 941, locale, theme, 'startup-tasks');
        await page.getByTestId('startup-service-focus').evaluate((el) => {
          el.closest('.files-scrollbar')?.scrollTo({ top: 0 });
        });
        await page.waitForTimeout(150);
      }
    }
    await closeWorkbench();
  }

  await boot('en', 'light');
  await capture('overview-1366x768-en-light', 1366, 768, 'en', 'light', 'overview');
  await capture('overview-1672x941-en-light', 1672, 941, 'en', 'light', 'overview');
  await capture('overview-1920x1080-en-light', 1920, 1080, 'en', 'light', 'overview');

  const registerSummary = await page.evaluate(() => ({
    entries: document.querySelector('[data-testid="startup-kpi-entries-value"]')?.textContent?.trim(),
    protected: document.querySelector('[data-testid="startup-kpi-protected-value"]')?.textContent?.trim(),
    registerRows: document.querySelectorAll('[data-testid="startup-register"] tbody tr').length,
    banner: document.querySelector('[data-testid="startup-native-banner"]')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 180),
  }));
  proof.probes.push({ probe: 'startup-register', ...registerSummary });

  for (const key of SERVICES) await inspectBody(key, 'en', 'light');

  // Expanded mode proves the same body fits the full-width host, not just the
  // pinned panel.
  for (const key of ['startup-overview', 'startup-filter', 'startup-services', 'startup-tasks']) {
    await openService(key);
    await prepare(key);
    await page.getByTestId('workbench-mode-toggle').click();
    await expect(page.getByTestId('startup-workbench-expanded-shell')).toBeVisible({ timeout: 15000 });
    const expanded = await page.getByTestId('startup-service-focus').evaluate((el) => ({
      wide: el.scrollWidth - el.clientWidth,
      wrap: Math.round((el.querySelector('.stp-mini-table-wrap') || el).clientWidth),
    }));
    proof.probes.push({ probe: `expanded-${key}`, overflowX: expanded.wide, tableWrap: expanded.wrap });
    expect(expanded.wide, `${key} expanded body overflows`).toBeLessThanOrEqual(2);
    await capture(`${key}-expanded-en-light-1672`, 1672, 941, 'en', 'light', `${key}-expanded`);
    await page.getByTestId('workbench-mode-toggle').click();
    await expect(page.getByTestId('startup-workbench-side-shell')).toBeVisible({ timeout: 15000 });
    await closeWorkbench();
  }

  // The tool selector must switch services inside the same host.
  await openService('startup-overview');
  await page.getByTestId('startup-workbench-tool-select').selectOption('startup-sources');
  await expect(page.getByTestId('startup-service-focus')).toContainText(/source|مصدر|lane|مسار/i, { timeout: 10000 });
  proof.probes.push({ probe: 'startup-tool-selector', switched: true });
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
  proof.checks.push('Twelve distinct Startup service bodies verified across DAY/NIGHT and EN/AR (12 signatures)');
  proof.checks.push('Every captured body exposes at least one measured control and no ellipsized value');
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
