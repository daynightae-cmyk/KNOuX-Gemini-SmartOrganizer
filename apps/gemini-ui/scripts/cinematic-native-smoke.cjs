'use strict';
// Windows-only acceptance of the real entry + existing sandboxed preload.
// Uses its own disposable Electron profile; no native mutations or account calls.
const { _electron, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
(async () => {
  if (process.platform !== 'win32') throw new Error('NOT_RUN: Windows runner required; Electron sandbox must remain enabled.');
  const packaged = process.argv.includes('--packaged');
  const evidence = path.resolve('visual-evidence/cinematic-entry');
  await fs.mkdir(evidence, { recursive: true });
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-cinematic-'));
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE; delete env.KNOUX_GEMINI_DEV;
  const packDir = path.resolve('release-gemini/win-unpacked');
  const executablePath = packaged ? path.join(packDir, (await fs.readdir(packDir)).find(file => file.endsWith('.exe') && !file.toLowerCase().includes('uninstall'))) : require('electron');
  const args = [...(packaged ? [] : [path.resolve('electron/main.cjs')]), `--knoux-user-data=${profile}`];
  let application;
  try {
    application = await _electron.launch({ executablePath, args, cwd: process.cwd(), env, timeout: 60000 });
    const page = await application.firstWindow();
    const boundary = page.locator('.cinematic-boundary');
    await expect(boundary).toHaveAttribute('data-phase', 'READY', { timeout: 30000 });
    await page.evaluate(() => { window.__entryOriginalMain = document.querySelector('main'); });
    const status = await page.evaluate(() => window.knouxShell.getStatus());
    assert.equal(status.contractVersion, 1); assert.equal(status.data.bridge, 'ready');
    const security = await application.evaluate(({ BrowserWindow }) => {
      const p = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
      return { contextIsolation: p.contextIsolation, sandbox: p.sandbox, nodeIntegration: p.nodeIntegration };
    });
    assert.deepEqual(security, { contextIsolation: true, sandbox: true, nodeIntegration: false });
    const mode = packaged ? 'packaged' : 'development';
    await page.screenshot({ path: path.join(evidence, `windows-${mode}-ready.png`) });
    await page.getByRole('button', { name: 'Enter Workspace', exact: true }).click();
    await expect(boundary).toHaveAttribute('data-phase', 'ENTERING');
    await expect(boundary).toHaveAttribute('data-phase', 'ACTIVE');
    assert(await page.evaluate(() => document.querySelector('main') === window.__entryOriginalMain));
    await expect(page.locator('.cinematic-workspace')).not.toHaveAttribute('inert');
    await page.screenshot({ path: path.join(evidence, `windows-${mode}-home.png`) });
    await fs.writeFile(path.join(evidence, `windows-${mode}.json`), JSON.stringify({ status: 'PASS', mode, security, bridge: status.data.bridge, sameWorkspaceMount: true, platform: process.platform }, null, 2));
    console.log(`PASS cinematic Windows ${mode}: real bridge, secure preferences, one workspace mount`);
  } finally {
    if (application) await application.close();
    await fs.rm(profile, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
