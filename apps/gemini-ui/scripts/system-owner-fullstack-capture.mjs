/**
 * KNOuX System / Network / Hardware — current-HEAD owner evidence capture.
 *
 * Deterministic, isolated-profile Electron run against the BUILT renderer
 * (dist/). It reads the real Windows machine through the read-only SystemBridge
 * scan (system, processes, services, drivers, events, network, sockets,
 * hardware, timeline), then captures the overview and all thirty-six service
 * workbenches in DAY/NIGHT and EN/AR at the owner viewports.
 *
 * Every interaction below is a read, a selection or an explicitly bounded
 * read-only probe. Mission 10 exposes no process, service, driver, proxy,
 * hosts, adapter, repair or power write.
 */
import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const OUT = path.resolve(process.env.KNOUX_SYSTEM_CAPTURE_DIR || '../../docs/evidence/owner-fullstack-20261030/system-current');
await mkdir(OUT, { recursive: true });

const profile = await mkdtemp(path.join(os.tmpdir(), 'knoux-system-capture-'));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const app = await electron.launch({
  executablePath: require('electron'),
  args: [path.resolve('electron/main.cjs'), '--disable-gpu', '--knoux-user-data=' + profile],
  env,
  timeout: 60000,
});

const proof = {
  domain: 'System',
  runtime: null,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true }).trim(),
  profileIsolated: true,
  sourceFiles: {},
  captures: [],
  services: [],
  probes: [],
  issues: [],
  checks: [],
  errors: [],
  ok: false,
};

const WATCHED = [
  'src/pages/SystemPage.tsx',
  'src/system/catalog.ts',
  'src/system/model.ts',
  'src/system/native.ts',
  'src/system/useSystem.ts',
  'src/system/ui.tsx',
  'src/system/SystemServiceWorkspaces.tsx',
  'src/system/SystemWorkbenchesA.tsx',
  'src/system/SystemWorkbenchesB.tsx',
  'src/system/NetworkWorkbenches.tsx',
  'src/system/HardwareWorkbenches.tsx',
  'src/system.css',
  'src/components/workbench/ServiceWorkbenchHost.tsx',
  'electron/native/system-bridge.cjs',
  'electron/native/system-providers.cjs',
  'electron/preload.cjs',
  'shared/native-contracts.ts',
];

const SERVICES = [
  'system-health-check', 'system-events', 'system-processes', 'system-signatures',
  'system-uptime', 'system-perf', 'system-drivers', 'system-logs',
  'system-resources', 'system-autostart', 'system-services-map', 'system-timeline',
  'network-interfaces', 'network-dns-config', 'network-adapters', 'network-connectivity',
  'network-throughput', 'network-traceroute', 'network-topology', 'network-ports',
  'network-wifi', 'network-hosts', 'network-proxies', 'network-repair-link',
  'hardware-inventory', 'hardware-battery', 'hardware-cpu', 'hardware-gpu',
  'hardware-memory', 'hardware-cycles', 'hardware-thermal', 'hardware-disks',
  'hardware-usb', 'hardware-display', 'hardware-audio', 'hardware-health-report',
];

try {
  for (const name of WATCHED) proof.sourceFiles[name] = createHash('sha256').update(await readFile(name)).digest('hex');
  proof.runtime = await app.evaluate(({ app }) => ({ isPackaged: app.isPackaged, version: app.getVersion() }));

  const page = await app.firstWindow();
  page.on('pageerror', (e) => proof.errors.push(e.message));
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
    location.hash = 'system';
  });

  async function waitMeasured(limitMs = 360000) {
    const start = Date.now();
    let last = null;
    while (Date.now() - start < limitMs) {
      last = await page.evaluate(() => ({
        chip: document.querySelector('[data-testid="system-native-banner"] .sys-banner-chip')?.textContent?.trim() || '',
        scanning: Boolean(document.querySelector('[data-testid="system-scan-progress"]')),
        cards: document.querySelectorAll('[data-testid^="system-service-"]').length,
        error: document.querySelector('.sys-error')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 180) || null,
      }));
      if (/measured|مقيس/i.test(last.chip) && !last.scanning && last.cards >= 12) return;
      await page.waitForTimeout(1000);
    }
    throw new Error(`measured snapshot did not settle: ${JSON.stringify(last)}`);
  }

  async function boot(locale, theme) {
    await page.evaluate(({ locale, theme }) => {
      localStorage.setItem('knoux_locale', locale);
      localStorage.setItem('knoux_theme', theme);
      location.hash = 'system';
    }, { locale, theme });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByTestId('system-workspace').waitFor({ timeout: 45000 });
    // The first visit starts a bounded nine-stage native scan. Wait for a real
    // measured snapshot: the banner chip flips to MEASURED and the progress
    // panel disappears. No number is taken from a loading state. The poll runs
    // from Node so an occluded renderer cannot throttle it into a false timeout.
    await waitMeasured();
    await page.waitForTimeout(1200);
    await clearOverlays();
  }

  async function viewport(width, height) {
    const w = await app.browserWindow(page);
    // Windows can refuse or defer a content resize while the window is
    // maximized or a previous resize is still settling, which would silently
    // capture the old viewport. Normalize the window state, apply the size,
    // verify the renderer actually sees it, and report the real dimensions if
    // three attempts still fail.
    let state = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      state = await w.evaluate((win, [ww, hh]) => {
        if (win.isMaximized()) win.unmaximize();
        if (win.isFullScreen()) win.setFullScreen(false);
        if (win.isMinimized()) win.restore();
        win.setContentSize(ww, hh, false);
        return { maximized: win.isMaximized(), fullScreen: win.isFullScreen(), bounds: win.getBounds() };
      }, [width, height]);
      try {
        // Poll from the Node side: an occluded renderer throttles rAF, so a
        // waitForFunction could time out even though the resize already landed.
        let actual = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
        for (let tick = 0; tick < 25 && (actual.width !== width || actual.height !== height); tick += 1) {
          await page.waitForTimeout(120);
          actual = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
        }
        if (actual.width !== width || actual.height !== height) {
          if (attempt === 2) {
            throw new Error(`viewport did not reach ${width}x${height}; renderer reported ${actual.width}x${actual.height}; window ${JSON.stringify(state)}`);
          }
          await page.waitForTimeout(500);
        } else {
          break;
        }
      } catch (error) {
        if (attempt === 2) throw error;
        await page.waitForTimeout(500);
      }
    }
    await page.waitForTimeout(160);
  }

  async function capture(name, width, height, locale, theme, service) {
    await viewport(width, height);
    const toast = page.locator('.sys-toast');
    if (await toast.count()) {
      await page.waitForTimeout(2400);
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
      const workspace = document.querySelector('[data-testid="system-workspace"]');
      const host = document.querySelector('[data-workbench-mode]');
      return {
        overflow: document.documentElement.scrollHeight - innerHeight,
        width: innerWidth,
        height: innerHeight,
        theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
        dir: document.documentElement.getAttribute('dir'),
        mainOverflowX: workspace ? workspace.scrollWidth - workspace.clientWidth : null,
        cards: document.querySelectorAll('[data-testid^="system-service-"]').length,
        workbench: host?.getAttribute('data-workbench-mode') || null,
      };
    });
    expect(geo.width).toBe(width);
    expect(geo.height).toBe(height);
    expect(geo.overflow).toBeLessThanOrEqual(2);
    expect(geo.theme).toBe(theme);
    expect(geo.dir).toBe(locale === 'ar' ? 'rtl' : 'ltr');
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

  async function openFirst() {
    const card = page.getByTestId('system-service-system-health-check');
    await card.waitFor({ state: 'visible', timeout: 30000 });
    await card.scrollIntoViewIfNeeded().catch(() => {});
    try {
      await card.click({ timeout: 15000 });
    } catch {
      await page.waitForTimeout(800);
      await card.click({ timeout: 20000 });
    }
    await expect(page.getByTestId('system-workbench-side-shell')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(300);
  }

  async function openService(key) {
    await clearOverlays();
    if (!(await page.getByTestId('system-workbench-side-shell').count())) await openFirst();
    const select = page.getByTestId('system-workbench-tool-select');
    await select.selectOption(key);
    await expect(page.getByTestId(`sys-service-workspace-${key}`)).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(450);
  }

  // The AI Copilot is a user-invoked overlay anchored to the same bottom-end
  // corner as the service rail. It must never be open while a measured body is
  // being inspected, or Playwright would be clicking panel chrome instead of
  // the workbench. Close it through its own Minimize control, record that the
  // state existed, and never fake a clean run.
  async function clearOverlays() {
    const panel = page.locator('[class*="bottom-[7.5rem]"]');
    if (!(await panel.count())) return;
    const minimize = panel.first().locator('button[title="Minimize"]');
    if (await minimize.count()) await minimize.first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(200);
    proof.probes.push({ probe: 'assistant-overlay-closed', stillOpen: (await panel.count()) > 0 });
  }

  async function closeWorkbench() {
    const close = page.getByTestId('workbench-close');
    if (await close.count()) {
      await close.click();
      await page.waitForTimeout(200);
    }
  }

  async function idle(body, timeoutMs, label) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const running = await body.locator('.sys-btn-primary[disabled]').count();
      if (!running) return true;
      await page.waitForTimeout(250);
    }
    proof.probes.push({ probe: 'busy-timeout', label });
    return false;
  }

  // Every preparation below is a read, a selection or a bounded read-only
  // probe. Nothing stages a hosts, proxy, adapter, repair or power write.
  async function prepare(key) {
    const body = page.locator('[data-testid^="sys-service-workspace-"]').first();
    const rowSelectors = [
      '.sys-event-row', '.sys-consumer-row', '.sys-binary-row', '.sys-hop-row',
      '.sys-hosts-row', '.sys-link-row', '.sys-node-row', '.sys-timeline-row',
      '.sys-usb-row', '.sys-gpu-card', '.sys-disk-bay', '.sys-audio-strip',
      '.sys-monitor-card', '.sys-thermal-card', '.sys-profile-row',
    ];
    switch (key) {
      case 'network-connectivity':
      case 'network-traceroute':
      case 'hardware-health-report': {
        const run = body.locator('.sys-btn-primary').first();
        if (await run.count() && await run.isEnabled()) {
          await run.click();
          await idle(body, 45000, key);
          await page.waitForTimeout(500);
        }
        break;
      }
      case 'system-signatures': {
        const verify = body.locator('.sys-btn-primary').first();
        if (await verify.count() && await verify.isEnabled()) {
          await verify.click();
          await idle(body, 45000, key);
          await page.waitForTimeout(400);
        }
        break;
      }
      default:
        break;
    }
    for (const selector of rowSelectors) {
      const rows = body.locator(selector);
      if (await rows.count() > 1) {
        // Never force a click here. A forced click ignores the hit test, so a
        // card that is momentarily under the footer bar or a backdrop would
        // send the pointer into the overlay chrome (which can close the
        // workbench) instead of selecting the row. A refused click is skipped
        // and the body itself remains the evidence.
        await rows.nth(1).click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(260);
        break;
      }
    }
  }

  async function inspectBody(key, locale, theme) {
    await openService(key);
    await prepare(key);
    const body = page.locator(`[data-testid="sys-service-workspace-${key}"]`).first();
    const info = await body.evaluate((el) => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      controls: el.querySelectorAll('button,input,select,a[href]').length,
      visible: el.getBoundingClientRect().height > 0,
      overflowX: el.scrollWidth - el.clientWidth,
      scrollers: (() => {
        const out = [];
        el.querySelectorAll('*').forEach((node) => {
          const over = node.scrollWidth - node.clientWidth;
          const style = getComputedStyle(node);
          const scrolls = style.overflowX === 'auto' || style.overflowX === 'scroll';
          if (over > 2 && node.clientWidth > 0 && !scrolls) out.push({ tag: node.tagName, cls: String(node.className || '').slice(0, 120), over });
        });
        if (el.scrollWidth - el.clientWidth > 2) out.unshift({ tag: el.tagName, cls: 'BODY-ROOT', over: el.scrollWidth - el.clientWidth });
        return out.slice(0, 8);
      })(),
      rail: (() => {
        const scroller = el.closest('.files-scrollbar');
        if (!scroller) return null;
        const style = getComputedStyle(scroller);
        const previous = scroller.scrollTop;
        scroller.scrollTop = scroller.scrollHeight;
        const panels = Array.from(el.querySelectorAll('.sys-panel'));
        const last = panels[panels.length - 1] || null;
        const scrollerRect = scroller.getBoundingClientRect();
        const lastRect = last ? last.getBoundingClientRect() : null;
        const lastPanelOverhang = lastRect ? Math.round(lastRect.bottom - scrollerRect.bottom) : 0;
        scroller.scrollTop = previous;
        return {
          over: scroller.scrollHeight - scroller.clientHeight,
          overflowY: style.overflowY,
          scrolledTo: Math.round(scroller.scrollHeight - previous),
          lastPanelOverhang,
        };
      })(),
      tables: Array.from(el.querySelectorAll('.sys-table-wrap')).map((wrap) => {
        const table = wrap.querySelector('table');
        const style = getComputedStyle(wrap);
        return {
          wrap: Math.round(wrap.clientWidth),
          table: table ? Math.round(table.getBoundingClientRect().width) : null,
          scroll: table ? table.scrollWidth : null,
          overflowX: style.overflowX,
          height: wrap.scrollHeight - wrap.clientHeight,
          overflowY: style.overflowY,
        };
      }),
      clipped: (() => {
        const nodes = Array.from(el.querySelectorAll('*')).filter((node) => {
          if (node.childElementCount > 0) return false;
          if (!(node.textContent || '').trim()) return false;
          const style = getComputedStyle(node);
          const ellipsis = style.textOverflow === 'ellipsis';
          const clamp = style.webkitLineClamp;
          const clamped = clamp && clamp !== 'none' && clamp !== '0';
          return (ellipsis || clamped) && (node.scrollWidth - node.clientWidth > 1 || node.scrollHeight - node.clientHeight > 1);
        });
        return {
          clipped: nodes
            .filter((node) => !node.getAttribute('title'))
            .map((node) => ({ cls: String(node.className || '').slice(0, 60), text: (node.textContent || '').trim().slice(0, 90) }))
            .slice(0, 12),
          disclosed: nodes
            .filter((node) => node.getAttribute('title'))
            .map((node) => ({ cls: String(node.className || '').slice(0, 60), text: (node.textContent || '').trim().slice(0, 90) }))
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
      text: info.text.slice(0, 200),
      controls: info.controls,
      overflowX: info.overflowX,
      scrollers: info.scrollers,
      clipped: info.clipped.clipped,
      disclosedTooltips: info.clipped.disclosed.length,
      tables: info.tables,
    });
    // Collect every loss class instead of stopping at the first: one run should
    // list all defects across the thirty-six bodies so they can be fixed and
    // re-proved together.
    const record = (kind, detail) => proof.issues.push({ key, locale, kind, detail });
    if (!info.visible) record('hidden-body', 'body is not visible');
    if (!info.controls) record('no-controls', info.text.slice(0, 120));
    if (info.overflowX > 2) record('body-overflow-x', { over: info.overflowX, nodes: info.scrollers });
    if (info.clipped.clipped.length) record('clipped-text', info.clipped.clipped);
    if (info.rail) {
      proof.probes.push({ probe: `${key}-rail`, overflowY: info.rail.overflowY, over: info.rail.over, lastPanelOverhang: info.rail.lastPanelOverhang });
      if (info.rail.over > 2 && !/auto|scroll/.test(info.rail.overflowY)) record('rail-no-scroller', info.rail.over);
      if (info.rail.lastPanelOverhang > 2) record('last-panel-unreachable', info.rail.lastPanelOverhang);
    }
    const sideways = info.tables.filter((table) => table.scroll != null && table.scroll > table.wrap + 2);
    if (sideways.length) proof.probes.push({ probe: `${key}-tables-scroll`, tables: sideways });
    const hiddenTables = info.tables.filter((table) => table.height > 2 && !/auto|scroll/.test(table.overflowY));
    if (hiddenTables.length) record('table-hidden', hiddenTables.map((table) => table.height));
    await capture(`${key}-${locale}-${theme}-1672`, 1672, 941, locale, theme, key);
    await closeWorkbench();
  }

  await boot('en', 'light');
  await capture('overview-1366x768-en-light', 1366, 768, 'en', 'light', 'overview');
  await capture('overview-1672x941-en-light', 1672, 941, 'en', 'light', 'overview');
  await capture('overview-1920x1080-en-light', 1920, 1080, 'en', 'light', 'overview');

  const summary = await page.evaluate(() => ({
    banner: document.querySelector('[data-testid="system-native-banner"]')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 220),
    footer: document.querySelector('[data-testid="system-actionbar"]')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 220),
    cards: document.querySelectorAll('[data-testid^="system-service-"]').length,
    coverage: document.querySelectorAll('[data-testid="system-coverage"] .sys-coverage-row').length,
    warnings: document.querySelector('[data-testid="system-warnings"]')?.textContent?.replace(/\s+/g, ' ').trim() || null,
  }));
  proof.probes.push({ probe: 'system-snapshot', ...summary });

  for (const key of SERVICES) await inspectBody(key, 'en', 'light');

  // Expanded mode proves the same body fits the full-width host, not only the
  // pinned rail.
  for (const key of ['system-health-check', 'system-processes', 'system-events', 'system-services-map', 'network-topology', 'network-hosts', 'hardware-inventory', 'hardware-health-report']) {
    await openService(key);
    await page.getByTestId('workbench-mode-toggle').click();
    await expect(page.getByTestId('system-workbench-expanded-shell')).toBeVisible({ timeout: 15000 });
    const expanded = await page.getByTestId(`sys-service-workspace-${key}`).first().evaluate((el) => ({
      wide: el.scrollWidth - el.clientWidth,
      tables: Array.from(el.querySelectorAll('.sys-table-wrap')).map((wrap) => {
        const table = wrap.querySelector('table');
        return { wrap: Math.round(wrap.clientWidth), scroll: table ? table.scrollWidth : null };
      }),
    }));
    proof.probes.push({ probe: `expanded-${key}`, overflowX: expanded.wide, tables: expanded.tables });
    expect(expanded.wide, `${key} expanded body overflows`).toBeLessThanOrEqual(2);
    expect(expanded.tables.filter((table) => table.scroll != null && table.scroll > table.wrap + 2), `${key} expanded table scrolls`).toEqual([]);
    await capture(`${key}-expanded-en-light-1672`, 1672, 941, 'en', 'light', `${key}-expanded`);
    await page.getByTestId('workbench-mode-toggle').click();
    await expect(page.getByTestId('system-workbench-side-shell')).toBeVisible({ timeout: 15000 });
    await closeWorkbench();
  }

  // The tool selector must switch services inside the same host.
  await openService('system-health-check');
  await page.getByTestId('system-workbench-tool-select').selectOption('network-wifi');
  await expect(page.getByTestId('sys-service-workspace-network-wifi')).toBeVisible({ timeout: 10000 });
  proof.probes.push({ probe: 'system-tool-selector', switched: true });
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
    expect(signatures.size, `thirty-six distinct measured service signatures in ${locale}`).toBe(36);
  }
  proof.checks.push('Thirty-six distinct System/Network/Hardware service bodies verified across DAY/NIGHT and EN/AR (36 signatures)');
  proof.checks.push('Every captured body exposes at least one measured control and no undisclosed ellipsized value');
  proof.checks.push('Every pinned rail scrolls and reaches its last measured panel; no body clips sideways');
  expect(proof.issues, 'layout defects across the captured bodies').toEqual([]);
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
console.log(JSON.stringify({ ok: proof.ok, captures: proof.captures.length, services: proof.services.length, probes: proof.probes.length, issues: proof.issues.length, errors: proof.errors }, null, 2));
if (!proof.ok) process.exitCode = 1;
