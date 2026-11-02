'use strict';
// Uses the existing Vite instance and canonical Electron main/preload, with a
// disposable app profile. No owner source is authorized or scanned.
const { _electron } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
(async () => {
  const phase = process.argv.includes('--after') ? 'after' : 'before';
  const root = path.resolve(__dirname, '../../..');
  const output = path.join(root, 'docs/evidence/reconciliation-20261102', phase);
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'knoux-reconcile-electron-'));
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, 'proof.json'), JSON.stringify({status:'running',phase,startedAt:new Date().toISOString()},null,2));
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  const app = await _electron.launch({ executablePath: require('electron'), args: [path.resolve(__dirname, '../electron/main.cjs'), '--dev', `--knoux-user-data=${profile}`], env, timeout: 60000 });
  const watchdog = setTimeout(() => { console.error('Only the isolated reconciliation test exceeded its 8-minute budget.'); app.process().kill(); }, 480000);
  const errors = [], warnings = [], checks = [], states = [];
  const cssPath = path.resolve(__dirname, '../tests/recovery/command-canvas.css');
  let originalCss, updatedCss;
  try {
    const page = await app.firstWindow(); page.setDefaultTimeout(30000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()); });
    await page.waitForURL('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true })));
    await page.goto('http://127.0.0.1:3000/tests/recovery/command-canvas.html', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('alpha draft').fill('alpha preserved');
    await page.getByLabel('beta draft').fill('beta preserved');
    await page.getByLabel('alpha selected').check();
    await page.getByRole('button', { name: 'Native observation update', exact: true }).click();
    assert.equal(await page.getByLabel('alpha draft').inputValue(), 'alpha preserved');
    assert.equal(await page.getByLabel('beta draft').inputValue(), 'beta preserved');
    assert(await page.getByLabel('alpha selected').isChecked());
    const detailTab = page.getByRole('button', { name: 'History & details', exact: true });
    await detailTab.click();
    await page.getByRole('button', { name: 'Workspace', exact: true }).click();
    assert.equal(await page.getByLabel('alpha draft').inputValue(), 'alpha preserved');
    checks.push('CommandCanvas preserves distinct same-position inspector drafts and selection across parent observations and tab changes');
    originalCss = await fs.readFile(cssPath, 'utf8');
    updatedCss = originalCss.replace('--recovery-hmr:before', '--recovery-hmr:after');
    assert.notEqual(originalCss, updatedCss);
    await fs.writeFile(cssPath, updatedCss);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.canvas-regression')).getPropertyValue('--recovery-hmr').trim() === 'after');
    assert.equal(await page.getByLabel('alpha draft').inputValue(), 'alpha preserved');
    assert.equal(await page.getByLabel('beta draft').inputValue(), 'beta preserved');
    assert(await page.getByLabel('alpha selected').isChecked());
    await fs.writeFile(cssPath, originalCss); updatedCss = null;
    checks.push('real Vite HMR updates a test-owned stylesheet without restarting the server or losing component state');
    console.log('[reconciliation] Current CommandCanvas and HMR state checks passed');
    await page.goto('http://127.0.0.1:3000/#home', { waitUntil: 'domcontentloaded' });
    const bridge = await page.evaluate(() => window.knouxShell.getStatus());
    assert.equal(bridge.status, 'available');
    const vault = await page.evaluate(() => window.knouxClipboardV1.status());
    assert.equal(vault.data.enabled, false);
    checks.push('canonical sandboxed main/preload is available; personal clipboard capture remains off');
    if (phase === 'after') {
      await page.evaluate(() => { location.hash = 'settings'; });
      await page.getByTestId('settings-tab-appearance').click();
      await page.emulateMedia({colorScheme:'light'});
      await page.getByTestId('settings-theme-system').click();
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
      await page.emulateMedia({colorScheme:'dark'});
      await page.waitForFunction(() => !document.documentElement.dataset.theme);
      await page.reload({waitUntil:'domcontentloaded'});
      await page.getByTestId('settings-tab-appearance').click();
      assert.equal(await page.getByTestId('settings-theme-system').getAttribute('aria-pressed'), 'true');
      await page.emulateMedia({colorScheme:'light'});
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
      await page.getByTestId('settings-theme-dark').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.documentElement.dataset.theme);
      await page.emulateMedia({colorScheme:'dark'});
      await page.emulateMedia({colorScheme:'light'});
      assert.equal(await page.evaluate(() => document.documentElement.dataset.theme || 'dark'), 'dark');
      await page.evaluate(() => { localStorage.removeItem('knoux_theme_preference'); localStorage.setItem('knoux_theme','light'); });
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
      assert.equal(await page.evaluate(() => localStorage.getItem('knoux_theme_preference')), 'light');
      await page.getByTestId('settings-tab-appearance').click();
      await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Test storage denied','SecurityError'); }; });
      await page.getByTestId('settings-theme-dark').click();
      await page.waitForFunction(() => !document.documentElement.dataset.theme);
      await page.reload({waitUntil:'domcontentloaded'});
      checks.push('System theme follows emulated OS media changes, survives reload, manual keyboard selection exits follow mode, legacy preference migrates, denied storage writes do not crash');
    }
    for (const viewport of [{width:1366,height:768},{width:1672,height:941},{width:1920,height:1080}]) {
      await app.evaluate(({ BrowserWindow }, size) => BrowserWindow.getAllWindows()[0].setContentSize(size.width, size.height), viewport);
      await page.waitForFunction(size => innerWidth === size.width && innerHeight === size.height, viewport);
      for (const route of ['home', 'files', 'studio', 'settings', 'smart_scan', 'repair', 'system']) {
        await page.evaluate(route => { location.hash = route; }, route);
        await page.locator(route === 'settings' ? '[data-testid="settings-root"] main' : `[data-visual-section="${route}"] main`).waitFor();
        for (const locale of ['en', 'ar']) {
          if (await page.evaluate(() => document.documentElement.lang) !== locale) {
            // Electron can leave Playwright's implicit navigation waiter pending
            // after hash routing. Verify the actual language postcondition instead.
            await page.locator('button').filter({ hasText: /^(English|EN|العربية|عربي)$/ }).first().click({noWaitAfter:true});
            await page.waitForFunction(locale => document.documentElement.lang === locale, locale);
          }
          for (const theme of ['dark', 'light']) {
            if (await page.evaluate(() => document.documentElement.dataset.theme || 'dark') !== theme) await page.getByRole('button', { name: /Switch to .* theme|التبديل إلى الوضع/ }).first().click();
            // Let the approved theme transitions settle before native capture.
            // The original before receipt used 80ms and includes transition frames.
            await page.waitForTimeout(450);
            const filename = `${route}-${theme}-${locale}-${viewport.width}x${viewport.height}.png`;
            const png = await app.evaluate(async ({ BrowserWindow }) => (await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString('base64'));
            await fs.writeFile(path.join(output, filename), Buffer.from(png, 'base64'));
            const state = await page.evaluate(() => {
              const box = selector => { const element = document.querySelector(selector); if (!element) return null; const {x,y,width,height} = element.getBoundingClientRect(); return {x,y,width,height}; };
              return {width:innerWidth,height:innerHeight,locale:document.documentElement.lang,dir:document.documentElement.dir,theme:document.documentElement.dataset.theme || 'dark',pageOverflow:document.documentElement.scrollHeight-innerHeight,horizontalOverflow:document.documentElement.scrollWidth-innerWidth,hero:box('.approved-hero, .os-hero, .knx-files-header, .knx-command-hero'),heading:document.querySelector('h1')?.textContent};
            });
            assert.equal(state.width, viewport.width); assert.equal(state.height, viewport.height);
            assert.equal(state.locale, locale); assert.equal(state.dir, locale === 'ar' ? 'rtl' : 'ltr'); assert.equal(state.theme, theme);
            states.push({route,filename,...state});
            if (phase === 'after' && route === 'settings') {
              await page.getByTestId('settings-tab-appearance').click();
              await page.getByTestId('settings-theme').scrollIntoViewIfNeeded();
              assert.equal(await page.getByTestId(`settings-theme-${theme}`).getAttribute('aria-pressed'),'true');
              await page.waitForTimeout(450);
              const appearance = await app.evaluate(async ({BrowserWindow}) => (await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString('base64'));
              await fs.writeFile(path.join(output,filename.replace('settings-','settings-appearance-')),Buffer.from(appearance,'base64'));
              await page.getByTestId('settings-tab-engine').click();
            }
            await fs.writeFile(path.join(output, 'proof-in-progress.json'), JSON.stringify({checks,states,errors,warnings},null,2));
          }
        }
      }
      console.log(`[reconciliation] ${phase} captured actual native content ${viewport.width}x${viewport.height}`);
    }
    assert.equal(errors.length, 0, errors.join('\n'));
    const result = {status:'verified',completedAt:new Date().toISOString(),scope:'Actual canonical development Electron, isolated profile, genuine read-only machine summaries, no owner-folder scan or write approval. Captures are evidence, not visual approval.',phase,checks,states,errors,warnings:[...new Set(warnings)]};
    await fs.writeFile(path.join(output, 'proof.json'), JSON.stringify(result,null,2));
    console.log(JSON.stringify({phase,checks,captures:states.length,errors,pageOverflowCases:states.filter(state=>state.pageOverflow>1||state.horizontalOverflow>1).map(state=>state.filename)},null,2));
  } catch (error) {
    await fs.writeFile(path.join(output,'proof.json'),JSON.stringify({status:'failed',phase,checks,states,errors,failure:String(error)},null,2));
    throw error;
  } finally {
    if (updatedCss && await fs.readFile(cssPath,'utf8') === updatedCss) await fs.writeFile(cssPath,originalCss);
    clearTimeout(watchdog); await app.close();
  }
})().catch(error => {console.error(error);process.exitCode=1;});
