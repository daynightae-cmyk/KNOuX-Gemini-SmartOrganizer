/**
 * KNOuX Settings — inner-surface verification.
 *
 * Drives the REAL Electron Main + preload + renderer against the production
 * renderer build (dist/). Settings is the only place in the product that writes
 * a preferences file, so the evidence proves:
 *
 *  - the eight sections are one real roving-tabindex tablist;
 *  - preferences survive a real reload;
 *  - an export is a native dialog + a real file, credential-free by
 *    construction, and no path crosses IPC;
 *  - an import previews its diff and applies only on confirmation;
 *  - a secret-bearing or mistyped document fails closed without touching the
 *    saved profile;
 *  - the AI bridge state and the unsupported-engine notice are honest;
 *  - English/Arabic and Day/Night are one layout at four desktop frames;
 *  - the browser preview advertises itself and keeps the download fallback.
 *
 * The only stubbed surface is the native dialog itself (the owner cannot click
 * a real save dialog in an automated run); Main still performs every file read
 * and write against disposable fixtures outside the evidence directory.
 */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {runtime, desktopFrames} from './inner-workspace-runtime.mjs';

const SETTINGS_KEYS = ['contractVersion', 'exportProfile', 'importProfile'];
const EXPORT_KEYS = ['schema', 'exportedAt', 'secretsExcluded', 'aiProvidersExcluded', 'profile', 'notice'];
const PROFILE_KEYS = ['schema', 'accent', 'density', 'engineMode', 'ramLimitGB', 'cpuThreads', 'updatedAt'];

const ctx = await runtime({
  section: 'settings',
  out: process.argv.find((arg) => arg.startsWith('--out='))?.slice(6)
    || '../../docs/evidence/inner-workspaces-20261103/settings-inner-workspace',
  ready: '[data-testid="settings-root"]',
  browserReady: '[data-testid="settings-root"]',
  scope: 'Settings inner workspace: eight real sections behind one ARIA tablist with RTL-aware keyboard navigation, persisted non-secret preferences, native dialog export to a credential-free file, native import with a diff preview and fail-closed refusals, honest AI/engine states, bilingual Day/Night screenshots at four desktop frames, and an honest browser-preview fallback. No credential is written, read or exported in this run.',
});
const {page, app, probe, capture, save} = ctx;

const root = () => page.locator('[data-testid="settings-root"]');

async function tab(id) {
  await page.locator(`[data-testid="settings-tab-${id}"]`).click();
  await page.waitForFunction(
    (target) => document.querySelector('[data-testid="settings-panel"]')?.getAttribute('data-active-tab') === target,
    id,
  );
}

async function waitForText(testid, pattern) {
  await page.waitForFunction(
    ({testid, source}) => new RegExp(source, 'i').test(document.querySelector(`[data-testid="${testid}"]`)?.textContent || ''),
    {testid, source: pattern.source},
    {timeout: 30000},
  );
  return (await page.locator(`[data-testid="${testid}"]`).innerText()).trim();
}

async function locale(arabic) {
  const isRtl = await root().evaluate((node) => node.classList.contains('rtl'));
  if (isRtl !== arabic) await page.getByTitle('Toggle Arabic / English', {exact: true}).click();
  await page.waitForFunction(
    (want) => document.querySelector('[data-testid="settings-root"]')?.classList.contains('rtl') === want,
    arabic,
  );
}

async function theme(day) {
  const isLight = (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light';
  if (isLight === day) return;
  await page
    .locator('button[title="Switch to dark theme"], button[title="Switch to light theme"], button[title="التبديل إلى الوضع الداكن"], button[title="التبديل إلى الوضع الفاتح"]')
    .first()
    .click();
  await page.waitForFunction(
    (want) => (document.documentElement.getAttribute('data-theme') === 'light') === want,
    day,
  );
}

/** Replace only the two dialog calls; Main still reads and writes the files. */
async function installDialogStubs() {
  await app.evaluate(({dialog}) => {
    globalThis.__knouxSettings = {saveTarget: '', openTarget: '', calls: []};
    dialog.showSaveDialog = async (...args) => {
      const options = args[args.length - 1];
      globalThis.__knouxSettings.calls.push({kind: 'save', options});
      return globalThis.__knouxSettings.saveTarget
        ? {canceled: false, filePath: globalThis.__knouxSettings.saveTarget}
        : {canceled: true, filePath: ''};
    };
    dialog.showOpenDialog = async (...args) => {
      const options = args[args.length - 1];
      globalThis.__knouxSettings.calls.push({kind: 'open', options});
      return globalThis.__knouxSettings.openTarget
        ? {canceled: false, filePaths: [globalThis.__knouxSettings.openTarget]}
        : {canceled: true, filePaths: []};
    };
  });
}

async function dialogTarget(kind, target) {
  await app.evaluate((_electron, payload) => {
    globalThis.__knouxSettings[payload.kind === 'save' ? 'saveTarget' : 'openTarget'] = payload.target;
  }, {kind, target});
}

const dialogCalls = () => app.evaluate(() => globalThis.__knouxSettings.calls);

/** Force a real repaint before a screenshot; offscreen Electron windows can
 * keep a stale composited shell patch after a theme/locale change. */
async function settlePainting() {
  const win = await app.browserWindow(page);
  await win.evaluate((window) => window.webContents.invalidate());
  await page.waitForTimeout(280);
}

try {
  await ctx.size(1672, 941);
  await page.locator('[data-testid="settings-root"]').waitFor();
  await installDialogStubs();

  /* ------------------------------------------------------------------ 1/11 */

  await probe('eight-sections-are-one-real-tablist', async () => {
    const state = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="settings-tablist"]');
      const panel = document.querySelector('[data-testid="settings-panel"]');
      const tabs = Array.from(list?.querySelectorAll('[role="tab"]') || []);
      return {
        listRole: list?.getAttribute('role'),
        orientation: list?.getAttribute('aria-orientation'),
        tabs: tabs.length,
        labels: tabs.map((node) => node.textContent.trim()),
        selected: tabs.filter((node) => node.getAttribute('aria-selected') === 'true').map((node) => node.id),
        roving: tabs.filter((node) => node.tabIndex === 0).map((node) => node.id),
        controlsResolve: tabs.every((node) => document.getElementById(node.getAttribute('aria-controls'))),
        panelRole: panel?.getAttribute('role'),
        labelledBy: panel?.getAttribute('aria-labelledby'),
        activeTab: panel?.getAttribute('data-active-tab'),
        dir: document.querySelector('[data-testid="settings-root"]')?.classList.contains('rtl') ? 'rtl' : 'ltr',
      };
    });
    assert.equal(state.listRole, 'tablist', 'the ribbon is a tablist');
    assert.equal(state.orientation, 'horizontal', 'the tablist is horizontal');
    assert.equal(state.tabs, 8, 'eight reviewed sections');
    assert.equal(state.selected.length, 1, 'exactly one selected tab');
    assert.equal(state.selected[0], 'settings-tab-engine', 'the engine section opens first');
    assert.deepEqual(state.roving, ['settings-tab-engine'], 'one roving tabstop');
    assert(state.controlsResolve, 'every tab controls a real panel');
    assert.equal(state.panelRole, 'tabpanel', 'the panel is a tabpanel');
    assert.equal(state.labelledBy, 'settings-tab-engine', 'the panel is labelled by its tab');
    assert.equal(state.activeTab, 'engine', 'the panel shows the engine section');
    assert.equal(state.dir, 'ltr', 'the seeded locale is English');
    return {tabs: state.tabs, labels: state.labels};
  });

  /* ------------------------------------------------------------------ 2/11 */

  await probe('keyboard-navigation-follows-the-reading-direction', async () => {
    const focused = () => page.evaluate(() => document.activeElement?.getAttribute('data-testid') || '');
    const panel = () => page.evaluate(() => document.querySelector('[data-testid="settings-panel"]')?.getAttribute('data-active-tab'));

    await page.locator('[data-testid="settings-tab-engine"]').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.activeElement?.getAttribute('data-testid') === 'settings-tab-ai_keys');
    assert.equal(await panel(), 'ai_keys', 'ArrowRight advances the panel (LTR)');
    await page.keyboard.press('End');
    await page.waitForFunction(() => document.activeElement?.getAttribute('data-testid') === 'settings-tab-backup');
    assert.equal(await panel(), 'backup', 'End reaches the last section');
    await page.keyboard.press('Home');
    await page.waitForFunction(() => document.activeElement?.getAttribute('data-testid') === 'settings-tab-engine');
    assert.equal(await panel(), 'engine', 'Home returns to the first section');

    await locale(true);
    await page.locator('[data-testid="settings-tab-engine"]').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.activeElement?.getAttribute('data-testid') === 'settings-tab-backup');
    assert.equal(await panel(), 'backup', 'ArrowRight walks backwards in RTL');
    assert.equal(await focused(), 'settings-tab-backup', 'focus follows the selection');

    await locale(false);
    await tab('engine');
    return {ltr: 'engine>ai_keys', rtl: 'engine>backup'};
  });

  /* ------------------------------------------------------------------ 3/11 */

  await probe('native-bridge-exposes-only-the-two-fixed-calls', async () => {
    await tab('backup');
    const shape = await page.evaluate(() => ({
      keys: Object.keys(window.knouxSettingsV1).sort(),
      version: window.knouxSettingsV1.contractVersion,
      fs: typeof window.fs,
      require: typeof window.require,
      process: typeof window.process,
      ipc: typeof window.ipcRenderer,
      exportMode: document.querySelector('[data-testid="settings-export"]')?.getAttribute('data-export-mode'),
      notice: document.querySelector('[data-testid="settings-export-notice"]')?.textContent || '',
    }));
    assert.deepEqual(shape.keys, SETTINGS_KEYS, 'the bridge exposes exactly the reviewed calls');
    assert.equal(shape.version, 1, 'the bridge reports the shared contract version');
    assert.equal(shape.fs, 'undefined', 'no filesystem on the renderer');
    assert.equal(shape.require, 'undefined', 'no Node require on the renderer');
    assert.equal(shape.process, 'undefined', 'no Node process on the renderer');
    assert.equal(shape.ipc, 'undefined', 'no raw ipcRenderer on the renderer');
    assert.equal(shape.exportMode, 'native', 'the export button chooses the native route');
    assert.match(shape.notice, /never exported/i, 'the page states the credential boundary');
    return shape;
  });

  /* ------------------------------------------------------------------ 4/11 */

  await probe('preferences-survive-a-real-reload', async () => {
    await tab('engine');
    await page.locator('[data-testid="settings-engine-silent"]').click();
    await tab('appearance');
    await page.locator('[data-testid="settings-accent-emerald_shield"]').click();
    await page.locator('[data-testid="settings-density-compact"]').click();
    await page.locator('[data-testid="settings-save"]').click();
    const toast = await waitForText('settings-toast', /saved locally/i);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('knoux_settings_profile_v1')));
    assert.equal(stored.engineMode, 'silent');
    assert.equal(stored.accent, 'emerald_shield');
    assert.equal(stored.density, 'compact');
    assert(stored.updatedAt.length > 10, 'the save stamps an update time');

    await page.reload({waitUntil: 'domcontentloaded'});
    await root().waitFor();
    await tab('appearance');
    const pressed = await page.evaluate(() => ({
      accent: document.querySelector('[data-testid="settings-accent-emerald_shield"]')?.getAttribute('aria-pressed'),
      density: document.querySelector('[data-testid="settings-density-compact"]')?.getAttribute('aria-pressed'),
    }));
    assert.equal(pressed.accent, 'true', 'the accent survives the reload');
    assert.equal(pressed.density, 'true', 'the density survives the reload');
    await tab('engine');
    assert.equal(await page.locator('[data-testid="settings-engine-silent"]').getAttribute('aria-pressed'), 'true', 'the engine preference survives');
    return {toast, stored: {engineMode: stored.engineMode, accent: stored.accent, density: stored.density}};
  });

  /* ------------------------------------------------------------------ 5/11 */

  const exportPath = path.join(ctx.temp, 'native-export');
  const importPath = path.join(ctx.temp, 'import-profile.json');
  const secretPath = path.join(ctx.temp, 'secret-profile.json');
  const shadowPath = path.join(ctx.temp, 'typed-only');
  let exportedDocument = null;

  await probe('native-export-writes-a-credential-free-file', async () => {
    await dialogTarget('save', exportPath);
    await tab('backup');
    await page.locator('[data-testid="settings-export"]').click();
    const toast = await waitForText('settings-toast', /exported/i);
    const fileName = path.basename(`${exportPath}.json`);
    const text = await readFile(`${exportPath}.json`, 'utf8');
    exportedDocument = JSON.parse(text);

    assert.deepEqual(Object.keys(exportedDocument), EXPORT_KEYS, 'the file carries exactly the export document');
    assert.equal(exportedDocument.schema, 'knoux.settings.export.v1');
    assert.equal(exportedDocument.secretsExcluded, true);
    assert.equal(exportedDocument.aiProvidersExcluded, true);
    assert.match(exportedDocument.notice, /never included/);
    assert.deepEqual(Object.keys(exportedDocument.profile), PROFILE_KEYS, 'exactly the seven typed preferences');
    assert.equal(exportedDocument.profile.accent, 'emerald_shield');
    assert.equal(exportedDocument.profile.engineMode, 'silent');
    assert.equal(exportedDocument.profile.density, 'compact');
    assert.equal(exportedDocument.profile.schema, 'knoux.settings.profile.v1');
    assert.ok(!/apiKey|client_secret|refresh_token|password/i.test(JSON.stringify(exportedDocument)), 'no credential-shaped field or value in the file');
    assert.ok(toast.includes(fileName), 'the toast names the written file');
    assert.ok(!toast.includes(ctx.temp), 'the toast never echoes the chosen directory');

    const calls = await dialogCalls();
    const lastSave = calls.filter((entry) => entry.kind === 'save').at(-1);
    assert.equal(lastSave.options.defaultPath, 'knoux-settings-profile.json', 'the dialog proposes the reviewed file name');
    assert.deepEqual(lastSave.options.filters[0].extensions, ['json'], 'only JSON files are offered');
    assert.ok(!(lastSave.options.properties || []).includes('openDirectory'), 'the export dialog selects a file, not a folder');
    await save('native-export.json', {fileName, bytes: exportedDocument && Buffer.byteLength(text), document: exportedDocument});
    return {fileName, accent: exportedDocument.profile.accent, engineMode: exportedDocument.profile.engineMode, toast};
  });

  /* ------------------------------------------------------------------ 6/11 */

  await probe('native-import-previews-and-applies-only-on-confirmation', async () => {
    assert(exportedDocument, 'the export probe must run first');
    const next = structuredClone(exportedDocument);
    next.profile.engineMode = 'turbo';
    next.profile.accent = 'cyber_purple';
    next.profile.ramLimitGB = 12;
    next.profile.cpuThreads = '16';
    await writeFile(importPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    await dialogTarget('open', importPath);

    await page.locator('[data-testid="settings-import"]').click();
    await page.locator('[data-testid="settings-import-preview"]').waitFor();
    const preview = await page.evaluate(() => {
      const node = document.querySelector('[data-testid="settings-import-preview"]');
      return {
        text: node?.innerText || '',
        rows: Array.from(node?.querySelectorAll('.font-mono') || []).map((entry) => entry.textContent.trim()),
        diffRows: node?.querySelectorAll('.space-y-1 > div').length ?? 0,
        applyEnabled: !document.querySelector('[data-testid="settings-import-apply"]')?.disabled,
      };
    });
    assert(preview.applyEnabled, 'a valid import offers an apply action');
    assert.equal(preview.diffRows, 4, 'the preview names the four changed preferences');
    for (const expected of ['silent', 'turbo', 'emerald_shield', 'cyber_purple', '4', '12', '8', '16']) {
      assert(preview.rows.includes(expected), `the diff names ${expected}`);
    }
    assert.match(preview.text, /Import preview/i);

    const before = await page.evaluate(() => localStorage.getItem('knoux_settings_profile_v1'));
    await page.locator('[data-testid="settings-import-apply"]').click();
    const toast = await waitForText('settings-toast', /applied/i);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('knoux_settings_profile_v1')));
    assert.equal(stored.engineMode, 'turbo');
    assert.equal(stored.accent, 'cyber_purple');
    assert.equal(stored.ramLimitGB, 12);
    assert.equal(stored.cpuThreads, '16');
    assert.notEqual(JSON.stringify(stored), before, 'apply really changed the saved profile');

    await tab('engine');
    assert.equal(await page.locator('[data-testid="settings-engine-turbo"]').getAttribute('aria-pressed'), 'true', 'the imported engine preference is live');
    await tab('appearance');
    assert.equal(await page.locator('[data-testid="settings-accent-cyber_purple"]').getAttribute('aria-pressed'), 'true', 'the imported accent is live');
    await save('import-applied.json', {rows: preview.rows.length, diffRows: preview.diffRows, stored, toast});
    return {diffRows: preview.diffRows, toast};
  });

  /* ------------------------------------------------------------------ 7/11 */

  await probe('a-secret-bearing-import-fails-closed', async () => {
    const secret = {
      schema: 'knoux.settings.profile.v1',
      accent: 'obsidian',
      density: 'comfortable',
      engineMode: 'balanced',
      ramLimitGB: 8,
      cpuThreads: '8',
      updatedAt: '2026-11-19T00:00:00.000Z',
      apiKey: 'sk-or-v1-must-never-enter',
    };
    await writeFile(secretPath, JSON.stringify(secret), 'utf8');
    await dialogTarget('open', secretPath);
    const before = await page.evaluate(() => localStorage.getItem('knoux_settings_profile_v1'));

    await tab('backup');
    await page.locator('[data-testid="settings-import"]').click();
    const error = await waitForText('settings-import-error', /credential/i);
    const previewCount = await page.locator('[data-testid="settings-import-preview"]').count();
    assert.equal(previewCount, 0, 'a refused file produces no preview');
    assert.equal(await page.evaluate(() => localStorage.getItem('knoux_settings_profile_v1')), before, 'a refused import changes nothing');

    await page.reload({waitUntil: 'domcontentloaded'});
    await root().waitFor();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('knoux_settings_profile_v1')));
    assert.equal(stored.engineMode, 'turbo', 'the applied profile is intact after the refusal');
    assert.equal(stored.accent, 'cyber_purple');
    return {error, previewCount};
  });

  /* ------------------------------------------------------------------ 8/11 */

  await probe('ai-and-engine-states-stay-honest', async () => {
    await tab('ai_keys');
    await page.waitForFunction(
      () => /READY|ARMED|UNAVAILABLE/.test(document.querySelector('[data-testid="settings-ai-bridge-mode"]')?.textContent || ''),
      {},
      {timeout: 30000},
    );
    const ai = await page.evaluate(() => ({
      bridge: document.querySelector('[data-testid="settings-ai-bridge-mode"]')?.textContent?.trim(),
      security: document.querySelector('[data-testid="settings-ai-security"]')?.textContent || '',
      storage: Object.keys(localStorage).filter((key) => /key|token|secret|api/i.test(key)),
      passwordInputs: Array.from(document.querySelectorAll('input[type="password"]')).filter((input) => input.value).length,
    }));
    assert(['READY · NO KEY', 'ARMED', 'UNAVAILABLE · DESKTOP ONLY'].includes(ai.bridge), `bridge state is measured, got ${ai.bridge}`);
    assert.match(ai.security, /Credential boundary/i, 'the credential boundary is stated');
    assert.deepEqual(ai.storage, [], 'no credential-shaped localStorage key');
    assert.equal(ai.passwordInputs, 0, 'no credential value is left in a password input');
    await settlePainting();
    await capture('settings-ai-keys');

    await tab('engine');
    const engine = await page.evaluate(() => ({
      notice: document.querySelector('[data-testid="settings-engine-notice"]')?.textContent || '',
      pressed: Array.from(document.querySelectorAll('button[data-testid^="settings-engine-"]')).map((node) => node.getAttribute('aria-pressed')),
    }));
    assert.match(engine.notice, /No native engine provider is connected/i, 'the engine page admits it is preferences only');
    assert.equal(engine.pressed.filter((value) => value === 'true').length, 1, 'exactly one engine preference is selected');
    return {aiBridge: ai.bridge, enginePressed: engine.pressed};
  });

  /* ------------------------------------------------------------------ 9/11 */

  await probe('a-renderer-supplied-path-is-never-accepted', async () => {
    await dialogTarget('save', shadowPath);
    await dialogTarget('open', '');
    const before = (await dialogCalls()).length;

    const clean = await page.evaluate(async (smuggled) => {
      const valid = {
        schema: 'knoux.settings.profile.v1',
        accent: 'neon_cyan',
        density: 'comfortable',
        engineMode: 'balanced',
        ramLimitGB: 8,
        cpuThreads: '8',
        updatedAt: '2026-11-19T00:00:00.000Z',
      };
      return window.knouxSettingsV1.exportProfile({profile: {...valid, path: smuggled}, path: smuggled});
    }, 'C:\\Windows\\win.ini');
    const afterClean = (await dialogCalls()).length;
    assert.equal(afterClean, before + 1, 'a clean export opens exactly one save dialog');
    assert.equal(clean.status, 'complete', JSON.stringify(clean.error));
    assert.equal(clean.permission, 'user-initiated');
    assert.deepEqual(Object.keys(clean.data).sort(), ['bytes', 'canceled', 'fileName', 'writtenAt'], 'no path is returned');
    assert.ok(!JSON.stringify(clean).includes(ctx.temp), 'the fixture path never crosses IPC');
    assert.equal(clean.data.fileName, 'typed-only.json');
    const written = JSON.parse(await readFile(`${shadowPath}.json`, 'utf8'));
    assert.deepEqual(Object.keys(written.profile), PROFILE_KEYS, 'the smuggled path is not part of the profile');
    assert.ok(!JSON.stringify(written).includes('Windows'), 'the smuggled path is not written anywhere');

    const typedRefusal = await page.evaluate(() => window.knouxSettingsV1.exportProfile({
      profile: {
        schema: 'knoux.settings.profile.v1',
        accent: 'not_a_theme',
        density: 'comfortable',
        engineMode: 'balanced',
        ramLimitGB: 8,
        cpuThreads: '8',
        updatedAt: '2026-11-19T00:00:00.000Z',
      },
    }));
    assert.equal(typedRefusal.status, 'failed', 'a mistyped preference is refused');
    assert.equal(typedRefusal.error.code, 'SETTINGS_REQUEST_INVALID');
    assert.equal((await dialogCalls()).length, afterClean, 'the refused export opened no dialog and wrote nothing');

    const importAttempt = await page.evaluate(
      (smuggled) => window.knouxSettingsV1.importProfile(smuggled),
      'C:\\Windows\\win.ini',
    );
    assert.equal(importAttempt.status, 'complete');
    assert.equal(importAttempt.data.canceled, true, 'a renderer-supplied import path is ignored, not used');
    return {clean: clean.data, typedRefusal: typedRefusal.error.code, importCanceled: importAttempt.data.canceled};
  });

  /* ----------------------------------------------------------------- 10/11 */

  await probe('four-layout-frames-bilingual-day-night', async () => {
    await tab('backup');
    const frames = [];
    for (const [language, mode, width, height] of desktopFrames) {
      await locale(language === 'ar');
      await theme(mode === 'day');
      await ctx.size(width, height);
      await page.waitForTimeout(180);
      await page.locator('[data-testid="settings-export"]').scrollIntoViewIfNeeded();
      await settlePainting();
      const metrics = await page.evaluate(() => {
        const main = document.querySelector('[data-testid="settings-root"] main');
        const list = document.querySelector('[data-testid="settings-tablist"]');
        const panel = document.querySelector('[data-testid="settings-panel"]');
        const action = document.querySelector('[data-testid="settings-export"]');
        const before = main ? main.scrollLeft : 0;
        if (main) main.scrollLeft = 100000;
        const maxScrollLeft = main ? main.scrollLeft : -1;
        if (main) main.scrollLeft = before;
        return {
          dir: document.querySelector('[data-testid="settings-root"]')?.classList.contains('rtl') ? 'rtl' : 'ltr',
          theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
          overflowX: main ? main.scrollWidth - main.clientWidth : -1,
          maxScrollLeft,
          tablistVisible: !!list && list.getBoundingClientRect().height > 0,
          tablistInView: !!list && list.getBoundingClientRect().top >= 0 && list.getBoundingClientRect().bottom <= innerHeight,
          activeTab: panel?.getAttribute('data-active-tab'),
          exportVisible: !!action && action.getBoundingClientRect().height > 0,
          actionAboveFold: !!action && action.getBoundingClientRect().bottom <= innerHeight && action.getBoundingClientRect().top >= 0,
          tabs: document.querySelectorAll('[data-testid="settings-tablist"] [role="tab"]').length,
        };
      });
      assert.equal(metrics.dir, language === 'ar' ? 'rtl' : 'ltr', `${language}: direction`);
      assert.equal(metrics.theme, mode === 'day' ? 'light' : 'dark', `${mode}: theme`);
      assert(metrics.maxScrollLeft <= 0, `${language}/${mode}/${width}x${height}: horizontal overflow ${metrics.overflowX}`);
      assert(metrics.tablistVisible, `${language}/${mode}: tablist visible`);
      assert.equal(metrics.activeTab, 'backup', `${language}/${mode}: backup section active`);
      assert(metrics.tabs, `${language}/${mode}: eight tabs`);
      assert(metrics.exportVisible, `${language}/${mode}: export action rendered`);
      assert(metrics.actionAboveFold, `${language}/${mode}/${width}x${height}: primary action above the fold`);
      frames.push({language, mode, width, height, ...metrics});
      await capture(`settings-${mode}-${language}-${width}x${height}`);
    }
    /* A second Arabic view at the smallest frame, scrolled to the top, proves
       the full tab ribbon and hero are bilingual even when the backup card
       needs a scroll on a 768px-tall window. */
    await locale(true);
    await theme(true);
    await ctx.size(1366, 768);
    await page.evaluate(() => {
      const main = document.querySelector('[data-testid="settings-root"] main');
      if (main) main.scrollTop = 0;
    });
    await settlePainting();
    await capture('settings-day-ar-1366x768-top');

    await locale(false);
    await theme(true);
    await ctx.size(1672, 941);
    await tab('backup');
    await page.locator('[data-testid="settings-export"]').scrollIntoViewIfNeeded();
    await settlePainting();
    await capture('settings-export-native');

    await save('layout-frames.json', frames);
    return {frames: frames.length};
  });

  /* ----------------------------------------------------------------- 11/11 */

  await probe('browser-preview-degrades-honestly', async () => {
    const result = await ctx.unavailableBrowser(async (tab) => {
      await tab.locator('[data-testid="settings-root"]').waitFor();
      await tab.locator('[data-testid="settings-tab-backup"]').click();
      const state = await tab.evaluate(() => ({
        bridge: typeof window.knouxSettingsV1,
        exportMode: document.querySelector('[data-testid="settings-export"]')?.getAttribute('data-export-mode'),
        tabs: document.querySelectorAll('[data-testid="settings-tablist"] [role="tab"]').length,
        notice: document.querySelector('[data-testid="settings-export-notice"]')?.textContent || '',
      }));
      assert.equal(state.bridge, 'undefined', 'a browser has no native settings bridge');
      assert.equal(state.exportMode, 'download', 'the browser keeps the download fallback');
      assert.equal(state.tabs, 8, 'the browser mirror still renders all eight sections');
      assert.match(state.notice, /never exported/i, 'the browser mirror states the same credential boundary');
      return state;
    });
    return result;
  });
} catch (error) {
  ctx.fail(error);
} finally {
  await ctx.finish(11);
}
