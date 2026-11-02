'use strict';
// Disposable Electron + real preload + real Windows safeStorage. Its clipboard
// provider is injected test data; this file NEVER imports Electron.clipboard.
const path = require('node:path');
const fs = require('node:fs/promises');
const os = require('node:os');
const { createClipboardVault } = require('../electron/native/clipboard-vault.cjs');
const { registerClipboardIpc } = require('../electron/native/clipboard-ipc.cjs');
if (process.versions.electron) {
  const { app, BrowserWindow, ipcMain, safeStorage, nativeImage } = require('electron');
  const profile = process.argv.find(value => value.startsWith('--fixture-profile=')).slice('--fixture-profile='.length);
  app.setPath('userData', profile);
  global.fixture = { approve: false, prompts: [], text: 'Clipboard fixture phrase for isolated Electron', reads: 0, writes: 0 };
  app.whenReady().then(async () => {
    const vault = createClipboardVault({ safeStorage, nativeImage, storagePath: path.join(profile, 'vault.bin'), clipboard: {
      availableFormats: () => { global.fixture.reads++; return ['text/plain']; },
      readText: () => { global.fixture.reads++; return global.fixture.text; },
      writeText: text => { global.fixture.writes++; global.fixture.text = text; },
    } });
    await vault.init(); global.fixtureVault = vault;
    const win = new BrowserWindow({ width: 1672, height: 941, show: true, title: 'KNOuX Clipboard Fixture — disposable test', webPreferences: { preload: path.resolve(__dirname, '../electron/preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false } });
    win.on('page-title-updated', event => event.preventDefault());
    global.fixtureCapture = async destination => {
      const picture = await win.webContents.capturePage();
      await fs.writeFile(destination, picture.toPNG());
    };
    global.fixtureRestart = async () => {
      await global.fixtureVault.dispose();
      global.fixtureVault = createClipboardVault({ safeStorage, storagePath: path.join(profile, 'vault.bin'), clipboard: { readText() { throw Error('restart must not read'); } } });
      await global.fixtureVault.init();
    };
    registerClipboardIpc({ ipcMain, getVault: () => global.fixtureVault, assertSender: event => {
      if (event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame || new URL(event.senderFrame.url).origin !== 'http://127.0.0.1:3000') throw Object.assign(Error('untrusted'), { code: 'UNTRUSTED_SENDER' });
    }, confirm: async action => { global.fixture.prompts.push(action); return global.fixture.approve; } });
    await win.loadURL('http://127.0.0.1:3000/#settings');
    app.on('before-quit', () => { void global.fixtureVault.dispose(); });
  }).catch(error => { console.error(error); app.exit(1); });
  app.on('window-all-closed', () => app.quit());
} else {
  const assert = require('node:assert/strict');
  const { _electron } = require('playwright');
  (async () => {
    const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-clipboard-electron-'));
    const output = path.resolve(__dirname, '../../../docs/evidence/native-activation-20261102');
    await fs.mkdir(output, { recursive: true });
    const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
    const electron = await _electron.launch({ executablePath: require('electron'), args: [__filename, `--fixture-profile=${profile}`], env, timeout: 60000 });
    const checks = [], errors = [], screenshots = [];
    const watchdog = setTimeout(() => { console.error('Fixture exceeded its bounded 180-second budget. Stopping only this test process.'); electron.process().kill(); }, 180000);
    const record = label => { checks.push(label); console.log(`[clipboard-electron] ${label}`); };
    try {
      const page = await electron.firstWindow(); page.setDefaultTimeout(15000);
      page.on('pageerror', error => errors.push(error.message));
      await page.waitForURL('http://127.0.0.1:3000/#settings', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.getByTestId('settings-tab-clipboard').waitFor();
      console.log('[clipboard-electron] Settings rendered');
      if (await page.locator('.entry-overlay').isVisible()) {
        await page.getByRole('button', { name: /^Skip/ }).click();
        await page.locator('.entry-overlay').waitFor({ state: 'hidden' });
      }
      await page.getByTestId('settings-tab-clipboard').click();
      await page.getByTestId('clipboard-vault').waitFor();
      const panel = page.getByTestId('clipboard-vault');
      await panel.getByRole('button', { name: 'Enable capture…', exact: true }).waitFor();
      assert.equal(await electron.evaluate(() => global.fixture.reads), 0);
      record('real renderer/preload/list/status display off without observing the personal or fixture clipboard');
      await panel.getByRole('button', { name: 'Enable capture…', exact: true }).click();
      await panel.getByRole('alert').filter({ hasText: 'cancelled' }).waitFor();
      assert.equal(await electron.evaluate(() => global.fixture.reads), 0);
      record('native consent cancellation returns through IPC to visible UI');
      await electron.evaluate(() => { global.fixture.approve = true; });
      await panel.getByRole('button', { name: 'Enable capture…', exact: true }).click();
      await panel.getByRole('button', { name: 'Stop capture', exact: true }).waitFor();
      await electron.evaluate(async () => { await global.fixtureVault.poll(); });
      await panel.getByRole('button', { name: 'Refresh', exact: true }).click();
      await panel.getByRole('button').filter({ hasText: 'Clipboard fixture phrase' }).click();
      await panel.getByRole('button', { name: 'Pin', exact: true }).click();
      await panel.getByRole('button', { name: 'Unpin', exact: true }).waitFor();
      await panel.getByRole('button', { name: 'Copy back…', exact: true }).click();
      await panel.getByRole('status').filter({ hasText: 'Copied to system clipboard.' }).waitFor();
      assert.equal(await electron.evaluate(() => global.fixture.writes), 1);
      record('capture → list → inspect → pin → copy-back reaches injected provider through actual sandboxed preload');
      await panel.getByRole('button', { name: 'Pause', exact: true }).click();
      await panel.getByRole('button', { name: 'Resume', exact: true }).waitFor();
      const reads = await electron.evaluate(() => global.fixture.reads);
      await electron.evaluate(async () => { await global.fixtureVault.poll(); });
      assert.equal(await electron.evaluate(() => global.fixture.reads), reads);
      record('real pause control prevents native reads');
      for (const locale of ['en', 'ar']) {
        if (await page.evaluate(() => document.documentElement.lang) !== locale) await page.locator('button').filter({ hasText: /^(English|EN|العربية|عربي)$/ }).click();
        for (const theme of ['dark', 'light']) {
          if (await page.evaluate(() => document.documentElement.dataset.theme || 'dark') !== theme) await page.getByRole('button', { name: /Switch to .* theme|التبديل إلى الوضع/ }).click();
          await page.waitForTimeout(150);
          await panel.evaluate(element => element.scrollIntoView({ block: 'start' }));
          const filename = `clipboard-fixture-${theme}-${locale}.png`;
          if (process.argv.includes('--screenshots')) await electron.evaluate(async (_electron, destination) => global.fixtureCapture(destination), path.join(output, filename));
          screenshots.push({ filename: process.argv.includes('--screenshots') ? filename : null, ...await panel.evaluate(element => ({ lang: document.documentElement.lang, dir: element.dir, theme: document.documentElement.dataset.theme || 'dark', width: innerWidth, height: innerHeight, horizontalOverflow: document.documentElement.scrollWidth - innerWidth, panelWidth: element.getBoundingClientRect().width })) });
          assert.equal(screenshots.at(-1).theme, theme);
          assert.equal(screenshots.at(-1).dir, locale === 'ar' ? 'rtl' : 'ltr');
          assert.equal(screenshots.at(-1).horizontalOverflow, 0);
        }
      }
      await electron.evaluate(async () => global.fixtureRestart());
      const restarted = await page.evaluate(() => window.knouxClipboardV1.list({ pinnedOnly: true }));
      assert.equal(restarted.data.status.enabled, false); assert.equal(restarted.data.items.length, 1); assert.equal(restarted.data.status.storageMode, 'encrypted');
      const encrypted = await fs.readFile(path.join(profile, 'vault.bin')); assert.equal(encrypted.includes(Buffer.from('Clipboard fixture phrase')), false);
      record('real Windows safeStorage encrypt/decrypt restores pinned fixture history with capture off');
      const raw = await page.evaluate(() => ({ node: typeof window.require, rawIpc: typeof window.ipcRenderer }));
      assert.deepEqual(raw, { node: 'undefined', rawIpc: 'undefined' });
      assert.equal(errors.length, 0);
      const result = { status: 'PASS', observedAt: new Date().toISOString(), scope: 'Real development Electron + native Windows encryption + injected test clipboard. No personal clipboard access. Packaged/installed clipboard effect remains unverified.', checks, screenshots, errors };
      await fs.writeFile(path.join(output, 'clipboard-electron.json'), JSON.stringify(result, null, 2));
      console.log(JSON.stringify(result, null, 2));
    } finally { clearTimeout(watchdog); await electron.close(); }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
