'use strict';
// Real Electron capture of the cinematic portal at every accepted viewport.
// Uses a disposable profile, the real sandboxed preload and the real bridge.
// No native mutation, no account call, no window shown to the owner.
const { _electron, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { execSync } = require('node:child_process');

const OUT = path.resolve(process.env.KNOUX_ENTRY_EVIDENCE || 'visual-evidence/cinematic-entry-final');
const COMMIT = (() => { try { return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(); } catch { return ''; } })();

(async () => {
  if (process.platform !== 'win32') throw new Error('NOT_RUN: Windows runner required; Electron sandbox must remain enabled.');
  await fs.mkdir(OUT, { recursive: true });
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-portal-'));
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.KNOUX_GEMINI_DEV;
  const proof = { status: 'FAIL', commit: COMMIT, platform: process.platform, bridge: null, screens: [], checks: [] };
  let ok = false;
  let application;
  try {
    application = await _electron.launch({
      executablePath: require('electron'),
      args: [path.resolve('electron/main.cjs'), `--knoux-user-data=${profile}`],
      cwd: process.cwd(), env, timeout: 60000,
    });
    const page = await application.firstWindow();
    page.on('pageerror', error => proof.errors = [...(proof.errors || []), error.message]);
    const boundary = page.locator('.cinematic-boundary');
    await expect(boundary).toHaveAttribute('data-phase', 'READY', { timeout: 30000 });
    const status = await page.evaluate(() => window.knouxShell.getStatus());
    assert.equal(status.contractVersion, 1); assert.equal(status.data.bridge, 'ready');
    proof.bridge = status.data.bridge;
    const window = await application.browserWindow(page);
    const security = await application.evaluate(({ BrowserWindow }) => {
      const prefs = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
      return { contextIsolation: prefs.contextIsolation, sandbox: prefs.sandbox, nodeIntegration: prefs.nodeIntegration };
    });
    assert.deepEqual(security, { contextIsolation: true, sandbox: true, nodeIntegration: false });
    proof.security = security;

    const capture = async (name) => {
      await page.evaluate(async () => { await document.fonts.ready; });
      await page.screenshot({ path: path.join(OUT, `${name}.png`) });
      proof.screens.push(name);
    };

    const boot = async ({ width, height, locale, theme, reduced = false }) => {
      await window.evaluate((w, size) => { w.setContentSize(size.width, size.height); }, { width, height });
      await page.evaluate(({ locale, theme, reduced }) => {
        localStorage.setItem('knoux_locale', locale);
        localStorage.setItem('knoux_theme', theme);
        localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: false, always: true, muted: true, reduced }));
      }, { locale, theme, reduced });
      await page.reload();
      await expect(boundary).toHaveAttribute('data-phase', 'READY', { timeout: 30000 });
      await page.waitForTimeout(280);
      const size = await page.evaluate(() => ({ w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }));
      assert.equal(size.sw, size.w, 'no horizontal overflow');
      const cta = await page.getByRole('button', { name: locale === 'ar' ? 'دخول مساحة العمل' : 'Enter Workspace', exact: true }).boundingBox();
      assert(cta.y > 40 && cta.y + cta.height < size.h - 50, 'CTA fully visible without scrolling');
      return size;
    };

    // Presence set: the reference size first, then the two extra accepted viewports.
    for (const view of [
      { width: 1672, height: 941, locale: 'en', theme: 'dark' },
      { width: 1672, height: 941, locale: 'ar', theme: 'dark' },
      { width: 1672, height: 941, locale: 'en', theme: 'light' },
      { width: 1366, height: 768, locale: 'en', theme: 'dark' },
      { width: 1366, height: 768, locale: 'ar', theme: 'light' },
      { width: 1920, height: 1080, locale: 'en', theme: 'dark' },
      { width: 1920, height: 1080, locale: 'ar', theme: 'light' },
    ]) {
      const size = await boot(view);
      await capture(`ready-${view.width}x${view.height}-${view.locale}-${view.theme}`);
      assert.equal(size.w, view.width); assert.equal(size.h, view.height);
      proof.checks.push(`viewport ${size.w}x${size.h} ${view.locale} ${view.theme}`);
    }

    // release frame: hold the phase timer so the mid-dissolve can be photographed
    await boot({ width: 1672, height: 941, locale: 'en', theme: 'dark' });
    await page.evaluate(() => {
      const real = window.setTimeout;
      window.setTimeout = (fn, ms, ...rest) => (ms >= 1000 ? 0 : real(fn, ms, ...rest));
    });
    await page.getByRole('button', { name: 'Enter Workspace', exact: true }).click();
    await expect(boundary).toHaveAttribute('data-phase', 'ENTERING');
    await page.waitForTimeout(320);
    proof.enteringOpacity = await page.evaluate(() => {
      const overlay = document.querySelector('.entry-overlay');
      const before = Number(getComputedStyle(overlay).opacity);
      // Pin only the release animations at the real 320 ms mark so a loaded
      // machine cannot skip past the frame before the photograph.
      const release = new Set(['entry-dissolve', 'portal-enter', 'entry-copy-release']);
      for (const animation of overlay.getAnimations({ subtree: true })) {
        if (release.has(animation.animationName)) { animation.pause(); animation.currentTime = 320; }
      }
      return { before, pinned: Number(getComputedStyle(overlay).opacity) };
    });
    await page.screenshot({ path: path.join(OUT, 'entering-1672x941-en-dark.png') });
    proof.screens.push('entering-1672x941-en-dark');
    proof.checks.push(`release frame pinned at the real 320 ms animation mark (overlay ${proof.enteringOpacity.before.toFixed(3)} before pin, ${proof.enteringOpacity.pinned.toFixed(3)} at the photographed frame)`);
    assert(proof.enteringOpacity.pinned > 0 && proof.enteringOpacity.pinned < 1, 'release frame is mid-dissolve');
    proof.enteringOpacity = proof.enteringOpacity.pinned;

    // real release into the actual Home
    await boot({ width: 1672, height: 941, locale: 'en', theme: 'dark' });
    await page.getByRole('button', { name: 'Enter Workspace', exact: true }).click();
    await expect(boundary).toHaveAttribute('data-phase', 'ACTIVE', { timeout: 8000 });
    await page.waitForTimeout(400);
    await capture('home-1672x941-en-dark');
    assert(await page.evaluate(() => !!document.querySelector('main')));
    proof.checks.push('Real Home mounted after ACTIVE at 1672x941');

    // reduced motion + keyboard focus + replay from the real Settings screen
    await boot({ width: 1672, height: 941, locale: 'ar', theme: 'dark', reduced: true });
    await capture('reduced-motion-1672x941-ar-dark');
    assert.equal(await boundary.getAttribute('data-reduced'), 'true');
    // the honest native note is read while the portal is still on screen
    proof.lastNativeNote = await page.evaluate(() => document.querySelector('[data-native]')?.getAttribute('data-native') ?? null);
    await page.keyboard.press('Tab');
    assert(await page.evaluate(() => !!document.activeElement?.closest('.entry-overlay')));
    await page.keyboard.press('Escape');
    await expect(boundary).toHaveAttribute('data-phase', 'ACTIVE', { timeout: 5000 });
    proof.checks.push('Reduced motion static frame, Tab focus inside dialog, Escape skips into the real Home');

    const visible = await page.locator('body').innerText();
    assert(!/(?:github_pat_|gh[pousr]_[A-Za-z0-9]{20,})/.test(visible), 'no token material on screen');

    ok = true;
    proof.status = 'PASS';
    console.log(JSON.stringify({ ok: true, screens: proof.screens.length, bridge: proof.bridge, checks: proof.checks }, null, 1));
  } finally {
    await fs.writeFile(path.join(OUT, 'proof.json'), JSON.stringify(proof, null, 2));
    if (application) await application.close();
    await fs.rm(profile, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
