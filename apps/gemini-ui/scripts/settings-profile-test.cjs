'use strict';

/**
 * KNOuX Gemini - Settings profile file capability test.
 *
 * Exercises the real native module (no mocks for filesystem work) plus a fake
 * IPC host so every refusal path is proven without an interactive dialog. The
 * only stubbed surface is the Electron dialog itself, exactly as the runtime
 * evidence stubs it.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const appRoot = path.join(__dirname, '..');
const profileModule = require('../electron/native/settings-profile.cjs');
const contract = require('../shared/native-contract.json');

const failures = [];
let checkCount = 0;
const check = (name, run) => {
  checkCount += 1;
  try {
    run();
    console.log(`  ok ${name}`);
  } catch (error) {
    failures.push({ name, message: String(error?.message || error) });
    console.log(`  FAIL ${name}: ${error?.message || error}`);
  }
};
const checkAsync = async (name, run) => {
  checkCount += 1;
  try {
    await run();
    console.log(`  ok ${name}`);
  } catch (error) {
    failures.push({ name, message: String(error?.message || error) });
    console.log(`  FAIL ${name}: ${error?.message || error}`);
  }
};

const PROFILE = {
  schema: 'knoux.settings.profile.v1',
  accent: 'emerald_shield',
  density: 'compact',
  engineMode: 'turbo',
  ramLimitGB: 12,
  cpuThreads: '32',
  updatedAt: '2026-11-19T10:00:00.000Z',
};

async function main() {
  const fixtureRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'knoux-settings-profile-'));
  const settingsSource = await fsp.readFile(path.join(appRoot, 'src', 'pages', 'SettingsPage.tsx'), 'utf8');
  const profileSource = await fsp.readFile(path.join(appRoot, 'src', 'settings', 'profile.ts'), 'utf8');
  const preloadSource = await fsp.readFile(path.join(appRoot, 'electron', 'preload.cjs'), 'utf8');
  const mainSource = await fsp.readFile(path.join(appRoot, 'electron', 'main.cjs'), 'utf8');
  const securitySource = await fsp.readFile(path.join(appRoot, 'electron', 'native', 'security.cjs'), 'utf8');

  try {
    check('the native module mirrors the reviewed contract channels', () => {
      assert.equal(contract.channels.settingsExport, profileModule.CHANNELS.settingsExport);
      assert.equal(contract.channels.settingsImport, profileModule.CHANNELS.settingsImport);
      assert.equal(contract.capabilities['settings.export'].mode, 'user-initiated');
      assert.equal(contract.capabilities['settings.import'].mode, 'user-initiated');
      assert.equal(contract.capabilities['settings.export'].channel, profileModule.CHANNELS.settingsExport);
      assert.equal(contract.capabilities['settings.import'].channel, profileModule.CHANNELS.settingsImport);
      assert.equal(profileModule.MAX_PROFILE_BYTES, 64 * 1024);
    });

    check('renderer and main agree on enums, clamps and the credential-free schema', () => {
      for (const token of ['neon_cyan', 'obsidian', 'cyber_purple', 'emerald_shield', 'comfortable', 'compact', 'turbo', 'balanced', 'silent']) {
        assert(profileSource.includes(token), `renderer profile keeps ${token}`);
      }
      assert.match(profileSource, /Math\.min\(16, Math\.max\(1/);
      assert.equal(profileModule.normalizeProfile({}).accent, 'neon_cyan');
      assert.equal(profileModule.normalizeProfile({ ramLimitGB: 999 }).ramLimitGB, 16);
      assert.equal(profileModule.normalizeProfile({ ramLimitGB: -3 }).ramLimitGB, 1);
      assert.equal(profileModule.normalizeProfile({ cpuThreads: '64' }).cpuThreads, '8');
      assert.equal(profileModule.normalizeProfile({ density: 'dense' }).density, 'comfortable');
      assert.equal(profileModule.normalizeProfile({ engineMode: 'max' }).engineMode, 'balanced');
      assert.deepEqual(Object.keys(profileModule.normalizeProfile(PROFILE)), profileModule.PROFILE_KEYS);
    });

    check('the exported document is credential-free by construction', () => {
      const document = profileModule.buildExportDocument(PROFILE, '2026-11-19T11:00:00.000Z');
      assert.deepEqual(Object.keys(document), profileModule.EXPORT_KEYS);
      assert.equal(document.schema, 'knoux.settings.export.v1');
      assert.equal(document.secretsExcluded, true);
      assert.equal(document.aiProvidersExcluded, true);
      assert.match(document.notice, /never included/);
      assert.deepEqual(document.profile, PROFILE);
      assert.deepEqual(Object.keys(document.profile), profileModule.PROFILE_KEYS);
      assert.ok(!/apiKey|token|secret|password/i.test(JSON.stringify(document.profile)), 'no credential-shaped field is exported');
    });

    await checkAsync('a real file round trip preserves exactly the typed profile', async () => {
      const target = path.join(fixtureRoot, 'roundtrip');
      const written = await profileModule.writeProfileFile(target, PROFILE, '2026-11-19T11:00:00.000Z');
      assert.equal(written.fileName, 'roundtrip.json', 'the .json extension is enforced');
      assert.ok(written.bytes > 0);
      const onDisk = JSON.parse(await fsp.readFile(path.join(fixtureRoot, 'roundtrip.json'), 'utf8'));
      assert.deepEqual(onDisk.profile, PROFILE);
      const read = await profileModule.readProfileDocument(path.join(fixtureRoot, 'roundtrip.json'));
      assert.deepEqual(read.profile, PROFILE);
      assert.equal(read.bytes, written.bytes);
      assert.equal(read.fileName, 'roundtrip.json');
    });

    await checkAsync('oversize, invalid, secret-bearing and unknown-field documents fail closed', async () => {
      const big = path.join(fixtureRoot, 'big.json');
      await fsp.writeFile(big, JSON.stringify({ schema: 'knoux.settings.profile.v1', accent: 'x'.repeat(70 * 1024) }));
      await assert.rejects(profileModule.readProfileDocument(big), (error) => error.code === 'SETTINGS_FILE_TOO_LARGE');

      const broken = path.join(fixtureRoot, 'broken.json');
      await fsp.writeFile(broken, '{"schema":');
      await assert.rejects(profileModule.readProfileDocument(broken), (error) => error.code === 'SETTINGS_FILE_INVALID');

      const secret = path.join(fixtureRoot, 'secret.json');
      await fsp.writeFile(secret, JSON.stringify({ schema: 'knoux.settings.profile.v1', accent: 'obsidian', apiKey: 'sk-or-v1-never' }));
      await assert.rejects(profileModule.readProfileDocument(secret), (error) => error.code === 'SETTINGS_SECRET_FIELD_FORBIDDEN');

      const unknown = path.join(fixtureRoot, 'unknown.json');
      await fsp.writeFile(unknown, JSON.stringify({ schema: 'knoux.settings.profile.v1', accent: 'obsidian', extra: true }));
      await assert.rejects(profileModule.readProfileDocument(unknown), (error) => error.code === 'SETTINGS_SCHEMA_INVALID');

      const wrong = path.join(fixtureRoot, 'wrong.json');
      await fsp.writeFile(wrong, JSON.stringify({ schema: 'other.v1', accent: 'obsidian' }));
      await assert.rejects(profileModule.readProfileDocument(wrong), (error) => error.code === 'SETTINGS_SCHEMA_INVALID');

      const array = path.join(fixtureRoot, 'array.json');
      await fsp.writeFile(array, '[]');
      await assert.rejects(profileModule.readProfileDocument(array), (error) => error.code === 'SETTINGS_FILE_INVALID');

      await assert.rejects(profileModule.readProfileDocument(fixtureRoot), (error) => error.code === 'SETTINGS_FILE_INVALID');
    });

    /* ------------------------------------------------------------------ IPC */

    const handlers = new Map();
    const ipcMain = { handle: (channel, handler) => handlers.set(channel, handler) };
    let trusted = true;
    const assertSender = () => {
      if (!trusted) {
        const error = new Error('The native request did not originate from the trusted application window.');
        error.code = 'UNTRUSTED_SENDER';
        throw error;
      }
    };
    const dialogs = { save: null, open: null };
    profileModule.registerSettingsProfileIpc({
      ipcMain,
      assertSender: () => assertSender(),
      saveDialog: async (options) => {
        assert.equal(options.defaultPath, profileModule.DEFAULT_FILE_NAME);
        assert.deepEqual(options.filters[0].extensions, ['json']);
        return dialogs.save;
      },
      openDialog: async () => dialogs.open,
      now: () => '2026-11-19T12:00:00.000Z',
    });

    const event = {};
    const invoke = (channel, ...args) => handlers.get(channel)(event, ...args);

    check('exactly two fixed channels are registered', () => {
      assert.equal(handlers.size, 2);
      assert(handlers.has(profileModule.CHANNELS.settingsExport));
      assert(handlers.has(profileModule.CHANNELS.settingsImport));
      assert(!preloadSource.includes('knoux:settings:v1:write'));
    });

    await checkAsync('export writes a real file through the native dialog and never returns a path', async () => {
      const target = path.join(fixtureRoot, 'native export');
      dialogs.save = { canceled: false, filePath: target };
      const envelope = await invoke(profileModule.CHANNELS.settingsExport, { profile: { ...PROFILE, accent: 'neon_cyan' } });
      assert.equal(envelope.status, 'complete', JSON.stringify(envelope.error));
      assert.equal(envelope.permission, 'user-initiated');
      assert.equal(envelope.data.canceled, false);
      assert.equal(envelope.data.fileName, 'native export.json');
      assert.equal(envelope.data.writtenAt, '2026-11-19T12:00:00.000Z');
      assert.ok(!JSON.stringify(envelope).includes(fixtureRoot), 'the chosen directory is not echoed over IPC');
      const written = JSON.parse(await fsp.readFile(target + '.json', 'utf8'));
      assert.equal(written.profile.accent, 'neon_cyan');
      assert.equal(written.profile.ramLimitGB, 12);
    });

    await checkAsync('a cancelled dialog writes nothing and reports cancellation', async () => {
      const before = new Set(await fsp.readdir(fixtureRoot));
      dialogs.save = { canceled: true, filePath: '' };
      const envelope = await invoke(profileModule.CHANNELS.settingsExport, { profile: PROFILE });
      assert.equal(envelope.status, 'complete');
      assert.equal(envelope.data.canceled, true);
      assert.deepEqual(new Set(await fsp.readdir(fixtureRoot)), before);
    });

    await checkAsync('export refusals never touch the disk', async () => {
      dialogs.save = { canceled: false, filePath: path.join(fixtureRoot, 'must-not-exist') };
      for (const payload of [
        {},
        { profile: PROFILE, path: 'C:\\Windows\\System32\\drivers\\etc\\hosts' },
        { profile: { ...PROFILE, apiKey: 'sk-never' } },
        { profile: { ...PROFILE, accent: 42 } },
        PROFILE,
      ]) {
        const envelope = await invoke(profileModule.CHANNELS.settingsExport, payload);
        assert.equal(envelope.status, 'failed', `payload ${JSON.stringify(payload).slice(0, 60)} must fail`);
        assert.equal(envelope.error.code, 'SETTINGS_REQUEST_INVALID');
      }
      assert.ok(!fs.existsSync(path.join(fixtureRoot, 'must-not-exist.json')));
    });

    await checkAsync('import reads only the dialog-selected file and rejects extra arguments', async () => {
      dialogs.open = { canceled: false, filePaths: [path.join(fixtureRoot, 'native export.json')] };
      const smuggled = await invoke(profileModule.CHANNELS.settingsImport, 'C:\\Windows\\win.ini');
      assert.equal(smuggled.status, 'failed');
      assert.equal(smuggled.error.code, 'SETTINGS_REQUEST_INVALID');
      assert.ok(!JSON.stringify(smuggled).includes(fixtureRoot));

      const imported = await invoke(profileModule.CHANNELS.settingsImport);
      assert.equal(imported.status, 'complete', JSON.stringify(imported.error));
      assert.equal(imported.data.profile.accent, 'neon_cyan');
      assert.equal(imported.data.fileName, 'native export.json');
      assert.ok(!JSON.stringify(imported).includes(fixtureRoot));

      dialogs.open = { canceled: true, filePaths: [] };
      const cancelled = await invoke(profileModule.CHANNELS.settingsImport);
      assert.equal(cancelled.status, 'complete');
      assert.equal(cancelled.data.canceled, true);
    });

    await checkAsync('an untrusted sender is refused before any dialog or disk access', async () => {
      trusted = false;
      dialogs.save = { canceled: false, filePath: path.join(fixtureRoot, 'untrusted') };
      const envelope = await invoke(profileModule.CHANNELS.settingsExport, { profile: PROFILE });
      trusted = true;
      assert.equal(envelope.status, 'failed');
      assert.equal(envelope.permission, 'not-granted');
      assert.equal(envelope.error.code, 'UNTRUSTED_SENDER');
      assert.ok(!fs.existsSync(path.join(fixtureRoot, 'untrusted.json')));
    });

    check('the renderer bridge can name no path and main registers the capability', () => {
      assert.match(preloadSource, /exposeInMainWorld\(\s*'knouxSettingsV1'/);
      assert.match(preloadSource, /CHANNELS\.settingsExport/);
      assert.match(preloadSource, /CHANNELS\.settingsImport/);
      assert.ok(!/showSaveDialog|showOpenDialog|node:fs|require\('fs'\)/.test(preloadSource), 'preload has no dialog or filesystem access');
      assert.match(mainSource, /registerSettingsProfileIpc\(\{/);
      assert.match(mainSource, /dialog\.showSaveDialog\(mainWindow, options\)/);
      assert.match(mainSource, /dialog\.showOpenDialog\(mainWindow, options\)/);
      assert.match(settingsSource, /exportProfileNative\(profile\)/);
      assert.match(settingsSource, /importProfileNative\(\)/);
      assert.match(settingsSource, /previewSettingsProfile\(result\.data\.profile, currentProfile\(\)\)/);
      const exportBody = settingsSource.slice(
        settingsSource.indexOf('const handleExportProfile'),
        settingsSource.indexOf('const handleImportRequest'),
      );
      assert.match(exportBody, /if \(getSettingsBridge\(\)\)/);
      assert.ok(
        exportBody.indexOf('exportProfileNative(profile)') < exportBody.indexOf('anchor.download'),
        'the native branch runs and returns before the browser download fallback',
      );
      assert.match(utilsSource(), /settings-export|previewSettingsProfile|exportProfileNative/);
    });

    check('downloads stay cancelled in the hardened shell, so the native pair is required', () => {
      assert.match(securitySource, /contents\.on\('will-download', \(event\) => \{/);
      assert.match(securitySource, /event\.preventDefault\(\)/);
    });

    const result = {
      ok: failures.length === 0,
      checks: checkCount,
      failures,
      fixture: fixtureRoot,
    };
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    else console.log('[settings-profile-test] PASS');
  } finally {
    await fsp.rm(fixtureRoot, { recursive: true, force: true }).catch(() => {});
  }
}

function utilsSource() {
  return fs.readFileSync(path.join(appRoot, 'src', 'settings', 'native.ts'), 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
