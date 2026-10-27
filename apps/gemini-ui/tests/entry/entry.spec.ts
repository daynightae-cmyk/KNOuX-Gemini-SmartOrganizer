import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
const root = '.cinematic-boundary';
const key = 'knoux.cinematic.v1';
async function boot(page: Page, options: { locale?: string; theme?: string; reduced?: boolean; seen?: boolean; always?: boolean } = {}) {
  await page.emulateMedia({ reducedMotion: options.reduced ? 'reduce' : 'no-preference' });
  await page.addInitScript(({ key, options }) => {
    localStorage.setItem('knoux_locale', options.locale || 'en');
    localStorage.setItem('knoux_theme', options.theme || 'dark');
    if (options.seen) localStorage.setItem(key, JSON.stringify({ seen: true, always: Boolean(options.always), muted: true, reduced: false }));
  }, { key, options });
  await page.goto('/');
}
async function ready(page: Page) { await expect(page.locator(root)).toHaveAttribute('data-phase', 'READY'); }
async function active(page: Page) { await expect(page.locator(root)).toHaveAttribute('data-phase', 'ACTIVE'); }

test('real shell paints once; immediate response, overlapping reveal and focus', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await boot(page);
  await expect(page.getByRole('button', { name: 'Enter Workspace', exact: true })).toBeDisabled();
  await expect(page.locator('.cinematic-workspace')).toHaveAttribute('inert', '');
  await expect(page.getByRole('button', { name: 'Replay', exact: true })).toBeDisabled();
  await page.evaluate(() => {
    const w = window as any; w.originalMain = document.querySelector('main'); w.mainRemovals = 0;
    w.observer = new MutationObserver(records => { for (const record of records) for (const node of record.removedNodes) if (node === w.originalMain || (node instanceof Element && node.contains(w.originalMain))) w.mainRemovals++; });
    w.observer.observe(document.querySelector('.cinematic-workspace'), { childList: true, subtree: true });
  });
  await ready(page);
  await page.getByRole('button', { name: 'Enter Workspace', exact: true }).click();
  await expect(page.locator(root)).toHaveAttribute('data-phase', 'ENTERING');
  await page.waitForTimeout(700);
  const overlap = await page.locator('.entry-overlay').evaluate(el => Number(getComputedStyle(el).opacity));
  expect(overlap).toBeGreaterThan(0); expect(overlap).toBeLessThan(.95);
  await expect(page.locator('.cinematic-workspace')).toHaveCSS('opacity', '1');
  await active(page);
  expect(await page.evaluate(() => { const w = window as any; return document.querySelector('main') === w.originalMain && w.mainRemovals === 0; })).toBe(true);
  await expect(page.locator('.cinematic-workspace')).not.toHaveAttribute('inert');
  expect(await page.evaluate(() => document.querySelector('main')!.contains(document.activeElement))).toBe(true);
  expect(errors).toEqual([]);
});

test('gesture audio, repeated clicks, persistence and direct repeat launch', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any; w.audioEvents = []; const Original = window.AudioContext;
    w.AudioContext = class extends Original {
      constructor() { super(); w.audioEvents.push('created'); }
      resume() { w.audioEvents.push('resume'); return super.resume(); }
      createOscillator() { w.audioEvents.push('tone'); return super.createOscillator(); }
      close() { w.audioEvents.push('close'); return super.close(); }
    };
  });
  await boot(page);
  expect(await page.evaluate(() => (window as any).audioEvents)).toEqual([]);
  await page.getByRole('button', { name: 'Enable sound' }).click();
  await expect(page.locator(root)).toHaveAttribute('data-audio', 'played'); await ready(page);
  const before = await page.evaluate(() => (window as any).audioEvents.filter((x: string) => x === 'tone').length);
  await page.getByRole('button', { name: 'Enter Workspace', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); button.click(); });
  await active(page);
  expect(await page.evaluate(() => (window as any).audioEvents.filter((x: string) => x === 'tone').length) - before).toBe(7);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).seen, key)).toBe(true);
  await page.reload(); await active(page);
  expect(await page.evaluate(() => (window as any).audioEvents)).toEqual([]);
});

test('denied audio and unavailable Canvas/WebGL still enter', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).AudioContext = class { constructor() { throw Error('denied'); } };
    HTMLCanvasElement.prototype.getContext = (() => null) as any;
  });
  await boot(page, { reduced: true });
  await page.getByRole('button', { name: 'Enable sound' }).click();
  await expect(page.locator(root)).toHaveAttribute('data-audio', 'blocked'); await ready(page);
  await page.getByRole('button', { name: 'Enter Workspace', exact: true }).click(); await active(page);
});

test('slow native bridge timeout is honest and never blocks renderer', async ({ page }) => {
  await page.addInitScript(() => { (window as any).knouxShell = { contractVersion: 1, getStatus: () => new Promise(() => {}) }; });
  await boot(page);
  await expect(page.locator('[data-native]')).toHaveAttribute('data-native', 'pending'); await ready(page);
  await expect(page.locator('[data-native]')).toHaveAttribute('data-native', 'unavailable');
  await page.getByRole('button', { name: 'Enter Workspace', exact: true }).click(); await active(page);
});

test('Escape skip and Settings replay preserve real route and mount', async ({ page }) => {
  await boot(page);
  await expect(page.locator('[data-painted]')).toHaveAttribute('data-painted', 'true');
  await page.keyboard.press('Escape'); await active(page);
  await page.goto('/#settings');
  const replay = page.getByRole('button', { name: 'Replay KNOuX intro · sound & motion preferences' });
  await expect(replay).toBeVisible();
  await page.evaluate(() => { (window as any).settingsMain = document.querySelector('main'); });
  await replay.click(); await ready(page);
  await page.getByRole('button', { name: 'Skip', exact: true }).click(); await active(page);
  expect(await page.evaluate(() => document.querySelector('main') === (window as any).settingsMain)).toBe(true);
  expect(page.url()).toContain('#settings');
});

test('keyboard focus and Space entry respect reduced motion', async ({ page }) => {
  await boot(page, { reduced: true }); await ready(page);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('.entry-overlay'))).toBe(true);
  await page.getByRole('button', { name: 'Enter Workspace', exact: true }).focus();
  await page.keyboard.press('Space'); await active(page);
  await expect(page.locator(root)).toHaveAttribute('data-reduced', 'true');
});

for (const width of [1366, 1672, 1920]) for (const locale of ['en', 'ar']) for (const theme of ['dark', 'light']) {
  test(`visual ${width} ${locale} ${theme}: entry, release, actual Home`, async ({ page }) => {
    const height = width === 1366 ? 768 : width === 1672 ? 941 : 1080;
    await page.setViewportSize({ width, height }); await boot(page, { locale, theme }); await ready(page);
    const dir = 'visual-evidence/cinematic-entry'; await fs.mkdir(dir, { recursive: true });
    const tag = `${width}x${height}-${locale}-${theme}`;
    const visibleText = await page.locator('body').innerText();
    expect(visibleText).not.toMatch(/(?:github_pat_|gh[pousr]_[A-Za-z0-9]{20,}|[A-Z]:[\\/]Users[\\/])/);
    const cta = page.getByRole('button', { name: locale === 'ar' ? 'دخول مساحة العمل' : 'Enter Workspace', exact: true });
    const box = await cta.boundingBox(); expect(box!.y).toBeGreaterThan(40); expect(box!.y + box!.height).toBeLessThan(height - 50);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${dir}/${tag}-ready.png` });
    await cta.click(); await page.waitForTimeout(750);
    await page.screenshot({ path: `${dir}/${tag}-entering.png` }); await active(page);
    await page.screenshot({ path: `${dir}/${tag}-home.png` });
    await expect(page.locator('main')).toBeVisible();
    expect(await page.locator('main').evaluate(el => { const r = el.getBoundingClientRect(); return !!document.elementFromPoint(r.left + r.width / 2, r.top + 30)?.closest('main'); })).toBe(true);
  });
}

test('always-show preference survives reload; mute and hidden tab close audio', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any; w.closedContexts = 0;
    const Original = window.AudioContext;
    w.AudioContext = class extends Original { close() { w.closedContexts++; return super.close(); } };
  });
  await boot(page, { reduced: true, seen: true, always: true }); await ready(page);
  await page.getByRole('button', { name: 'Enable sound' }).click();
  await expect(page.locator(root)).toHaveAttribute('data-audio', 'played');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  expect(await page.evaluate(() => (window as any).closedContexts)).toBe(1);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.getByRole('button', { name: 'Mute sound' }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click(); await active(page);
  await page.reload(); await ready(page);
  await expect(page.getByRole('button', { name: 'Enable sound' })).toBeVisible();
});

test('particle RAF pauses while hidden, stops outside Home, and settles', async ({ page }) => {
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.clearRect;
    (window as any).canvasFrames = 0;
    CanvasRenderingContext2D.prototype.clearRect = function(...args) { if (this.canvas.classList.contains('entry-particles')) (window as any).canvasFrames++; return original.apply(this, args); };
  });
  await boot(page, { seen: true }); await active(page);
  await page.waitForTimeout(200);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(100);
  const frames = await page.evaluate(() => (window as any).canvasFrames);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => (window as any).canvasFrames)).toBe(frames);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); location.hash = 'settings'; });
  await page.waitForTimeout(250);
  const offHome = await page.evaluate(() => (window as any).canvasFrames);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as any).canvasFrames)).toBe(offHome);
  await page.evaluate(() => { location.hash = 'home'; });
  await page.waitForTimeout(12500);
  const settled = await page.evaluate(() => (window as any).canvasFrames);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as any).canvasFrames)).toBe(settled);
});

test('unmount cancels animation, timers, visibility listeners and pending audio', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any; w.created = 0; w.entryClosed = 0; w.activeFrames = new Set();
    const raf = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => { const id = raf(t => { w.activeFrames.delete(id); callback(t); }); w.activeFrames.add(id); return id; };
    window.cancelAnimationFrame = id => { w.activeFrames.delete(id); cancel(id); };
    w.AudioContext = class {
      state = 'running';
      constructor() { w.created++; }
      resume() { return new Promise(resolve => { w.resumePending = resolve; }); }
      close() { w.entryClosed++; return Promise.resolve(); }
      createOscillator() { throw Error('must never schedule after unmount'); }
    };
  });
  await page.goto('/tests/entry/lifecycle.html');
  await page.getByRole('button', { name: 'Enable sound' }).click();
  await page.evaluate(() => (window as any).unmountEntryFixture());
  expect(await page.evaluate(() => (window as any).entryClosed)).toBe(1);
  expect(await page.evaluate(() => (window as any).activeFrames.size)).toBe(0);
  await page.evaluate(() => { (window as any).resumePending(); window.dispatchEvent(new Event('knoux:replay-entry')); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(100);
  await expect(page.locator(root)).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).activeFrames.size)).toBe(0);
});

test('Settings choice cards remain keyboard-operable and survive entry replay', async ({ page }) => {
  await boot(page, { seen: true }); await active(page);
  await page.goto('/#settings');
  const turbo = page.getByRole('button', { name: /Maximum Turbo Engine/ });
  await turbo.focus(); await page.keyboard.press('Space');
  await expect(turbo).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('settings-tab-appearance').click();
  const accent = page.getByRole('button', { name: 'Cyberpunk Purple', exact: true });
  await accent.focus(); await page.keyboard.press('Enter');
  await expect(accent).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('settings-root')).toHaveAttribute('data-accent', 'cyber_purple');
  await page.getByTestId('settings-density-compact').click();
  await expect(page.getByTestId('settings-root')).toHaveAttribute('data-density', 'compact');
  await page.getByTestId('settings-save').click();
  await page.getByRole('button', { name: 'Replay KNOuX intro · sound & motion preferences' }).click();
  await ready(page); await page.getByRole('button', { name: 'Skip', exact: true }).click(); await active(page);
  await expect(accent).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('settings-root')).toHaveAttribute('data-density', 'compact');
});

test('Settings tabs retain permission notices and preference import preview behavior', async ({ page }) => {
  await boot(page, { seen: true }); await active(page); await page.goto('/#settings');
  for (const tab of ['engine', 'ai_keys', 'workspace', 'guard', 'appearance', 'language', 'backup']) {
    await page.getByTestId(`settings-tab-${tab}`).click();
    await expect(page.getByRole('button', { name: 'Replay KNOuX intro · sound & motion preferences' })).toBeVisible();
  }
  const input = page.locator('input[type=file]');
  await input.setInputFiles({ name: 'preferences.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schema: 'knoux.settings.profile.v1', accent: 'emerald_shield', density: 'compact', engineMode: 'silent', ramLimitGB: 3, cpuThreads: '4' })) });
  await expect(page.getByTestId('settings-import-preview')).toContainText('VALID');
  await page.getByRole('button', { name: 'Apply imported preferences', exact: true }).click();
  await expect(page.getByTestId('settings-root')).toHaveAttribute('data-accent', 'emerald_shield');
  await input.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.getByTestId('settings-import-preview')).toContainText('INVALID');
  await expect(page.getByRole('button', { name: 'Apply imported preferences', exact: true })).toBeDisabled();
});
