'use strict';

/**
 * Settings profile file capability.
 *
 * The renderer owns no filesystem access and the hardened shell cancels every
 * download. This module is the only way a non-secret preferences profile can
 * leave or enter the application:
 *
 *  - the caller never supplies a path; the path comes from a real native dialog
 *    the owner drives;
 *  - the caller never supplies arbitrary JSON; it supplies the seven typed
 *    preference fields, and Main rebuilds the exported document itself;
 *  - imports are bounded to 64 KiB, must use a reviewed schema, and are refused
 *    if any credential-like key appears anywhere in the document;
 *  - writes are atomic (temp file + rename) so a failed export cannot truncate
 *    an existing profile;
 *  - no key, token, cookie or password can enter or leave through this
 *    capability, and no path is echoed back across IPC.
 */

const path = require('node:path');
const fsp = require('node:fs/promises');
const { ok, fail } = require('./security.cjs');

const CHANNELS = Object.freeze({
  settingsExport: 'knoux:settings:v1:export',
  settingsImport: 'knoux:settings:v1:import',
});

const PROFILE_SCHEMA = 'knoux.settings.profile.v1';
const EXPORT_SCHEMA = 'knoux.settings.export.v1';
const MAX_PROFILE_BYTES = 64 * 1024;
const DEFAULT_FILE_NAME = 'knoux-settings-profile.json';
const ACCENTS = ['neon_cyan', 'obsidian', 'cyber_purple', 'emerald_shield'];
const DENSITIES = ['comfortable', 'compact'];
const ENGINES = ['turbo', 'balanced', 'silent'];
const THREADS = ['4', '8', '16', '32'];
const PROFILE_KEYS = ['schema', 'accent', 'density', 'engineMode', 'ramLimitGB', 'cpuThreads', 'updatedAt'];
const EXPORT_KEYS = ['schema', 'exportedAt', 'secretsExcluded', 'aiProvidersExcluded', 'profile', 'notice'];
const SECRET_KEY = /^(?:api[_-]?key|apikey|key|token|secret|password|passphrase|authorization|cookie|credentials?|client[_-]?secret|refresh[_-]?token|access[_-]?token|bearer)$/i;
const EXPORT_NOTICE = 'Non-secret preferences only. API keys and tokens are never included in this export.';

function invalid(code, message) {
  const error = new Error(message);
  error.code = code;
  error.retryable = false;
  return error;
}

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Refuse a document that tries to smuggle a credential field through us. */
function assertNoSecretFields(value, depth = 0) {
  if (depth > 8 || value === null || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_KEY.test(key)) {
      throw invalid('SETTINGS_SECRET_FIELD_FORBIDDEN', 'A settings profile can never contain a credential field.');
    }
    assertNoSecretFields(entry, depth + 1);
  }
}

function normalizeProfile(input) {
  const value = plainObject(input) ? input : {};
  const threads = String(value.cpuThreads ?? '');
  const ram = Number(value.ramLimitGB);
  return {
    schema: PROFILE_SCHEMA,
    accent: ACCENTS.includes(value.accent) ? value.accent : 'neon_cyan',
    density: DENSITIES.includes(value.density) ? value.density : 'comfortable',
    engineMode: ENGINES.includes(value.engineMode) ? value.engineMode : 'balanced',
    ramLimitGB: Math.min(16, Math.max(1, Number.isFinite(ram) ? Math.round(ram) : 4)),
    cpuThreads: THREADS.includes(threads) ? threads : '8',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt.slice(0, 40) : '',
  };
}

/**
 * Strict typed validation at the trust boundary. `normalizeProfile` is the
 * tolerant form used for display and migration; an export request or an
 * imported file must carry reviewed values, because silently coercing a
 * mistyped preference would hide a real defect or a corrupted file.
 */
function assertProfileFields(profile, code) {
  const bad = (field) => invalid(code, `The settings profile field "${field}" does not carry a reviewed value.`);
  if (!plainObject(profile)) throw bad('profile');
  if (!ACCENTS.includes(profile.accent)) throw bad('accent');
  if (!DENSITIES.includes(profile.density)) throw bad('density');
  if (!ENGINES.includes(profile.engineMode)) throw bad('engineMode');
  if (!Number.isInteger(profile.ramLimitGB) || profile.ramLimitGB < 1 || profile.ramLimitGB > 16) throw bad('ramLimitGB');
  if (!THREADS.includes(String(profile.cpuThreads))) throw bad('cpuThreads');
  if (typeof profile.updatedAt !== 'string' || profile.updatedAt.length > 40) throw bad('updatedAt');
}

/** Main owns the exported document; the renderer only supplies the profile. */
function buildExportDocument(profile, exportedAt = new Date().toISOString()) {
  return {
    schema: EXPORT_SCHEMA,
    exportedAt: typeof exportedAt === 'string' ? exportedAt.slice(0, 40) : new Date().toISOString(),
    secretsExcluded: true,
    aiProvidersExcluded: true,
    profile: normalizeProfile(profile),
    notice: EXPORT_NOTICE,
  };
}

/** Validate one imported document and return only the normalized profile. */
function profileFromDocument(document) {
  if (!plainObject(document)) {
    throw invalid('SETTINGS_FILE_INVALID', 'The settings file must contain a JSON object.');
  }
  assertNoSecretFields(document);
  const schema = document.schema;
  let profile;
  if (schema === EXPORT_SCHEMA) {
    const unknown = Object.keys(document).find((key) => !EXPORT_KEYS.includes(key));
    if (unknown) {
      throw invalid('SETTINGS_SCHEMA_INVALID', 'The settings export contains an unexpected field.');
    }
    if (!plainObject(document.profile)) {
      throw invalid('SETTINGS_SCHEMA_INVALID', 'The settings export has no profile object.');
    }
    profile = document.profile;
  } else if (schema === PROFILE_SCHEMA) {
    const unknown = Object.keys(document).find((key) => !PROFILE_KEYS.includes(key));
    if (unknown) {
      throw invalid('SETTINGS_SCHEMA_INVALID', 'The settings profile contains an unexpected field.');
    }
    profile = document;
  } else {
    throw invalid('SETTINGS_SCHEMA_INVALID', 'Only a KNOuX settings profile or export is accepted.');
  }
  const unknownProfileKey = Object.keys(profile).find((key) => !PROFILE_KEYS.includes(key));
  if (unknownProfileKey) {
    throw invalid('SETTINGS_SCHEMA_INVALID', 'The settings profile contains an unexpected field.');
  }
  assertProfileFields(profile, 'SETTINGS_SCHEMA_INVALID');
  return normalizeProfile(profile);
}

function ensureJsonPath(filePath) {
  return path.extname(filePath).toLowerCase() === '.json' ? filePath : `${filePath}.json`;
}

async function writeProfileFile(filePath, profile, exportedAt) {
  const target = ensureJsonPath(filePath);
  const document = buildExportDocument(profile, exportedAt);
  const text = `${JSON.stringify(document, null, 2)}\n`;
  const temp = `${target}.knoux-${process.pid}-${Date.now()}.tmp`;
  try {
    await fsp.writeFile(temp, text, { encoding: 'utf8' });
    await fsp.rename(temp, target);
  } catch (error) {
    await fsp.unlink(temp).catch(() => {});
    throw invalid('SETTINGS_WRITE_FAILED', 'The settings profile could not be written to the selected file.');
  }
  return {
    fileName: path.basename(target),
    bytes: Buffer.byteLength(text, 'utf8'),
    writtenAt: document.exportedAt,
  };
}

async function readProfileDocument(filePath) {
  let stat;
  try {
    stat = await fsp.stat(filePath);
  } catch {
    throw invalid('SETTINGS_READ_FAILED', 'The selected settings file could not be read.');
  }
  if (!stat.isFile()) {
    throw invalid('SETTINGS_FILE_INVALID', 'The selected path is not a settings file.');
  }
  if (stat.size > MAX_PROFILE_BYTES) {
    throw invalid('SETTINGS_FILE_TOO_LARGE', 'The selected settings file exceeds 64 KB.');
  }
  let text;
  try {
    text = await fsp.readFile(filePath, 'utf8');
  } catch {
    throw invalid('SETTINGS_READ_FAILED', 'The selected settings file could not be read.');
  }
  let document;
  try {
    document = JSON.parse(text);
  } catch {
    throw invalid('SETTINGS_FILE_INVALID', 'The selected file is not valid JSON.');
  }
  return {
    profile: profileFromDocument(document),
    fileName: path.basename(filePath),
    bytes: Buffer.byteLength(text, 'utf8'),
  };
}

/**
 * Register the two fixed channels. Dialog functions are injected so this module
 * can be exercised without an interactive desktop while production still uses
 * the real Electron dialog.
 */
function registerSettingsProfileIpc({ ipcMain, assertSender, saveDialog, openDialog, now }) {
  const handle = (channel, capability, work) =>
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        assertSender(event);
        const data = await work(args);
        return ok({ capability, source: 'Electron native settings file capability', permission: 'user-initiated', data });
      } catch (error) {
        const known = /^(?:SETTINGS|UNTRUSTED_SENDER)[A-Z_]*$/.test(error?.code || '')
          ? error.code
          : 'SETTINGS_REQUEST_FAILED';
        return fail({
          capability,
          source: 'Settings profile file capability',
          permission: error?.code === 'UNTRUSTED_SENDER' ? 'not-granted' : 'user-initiated',
          error: {
            code: known,
            // Every throw below is authored here or by the trusted-sender guard;
            // filesystem and dialog exceptions are wrapped before this point, so
            // no path, provider response or stack can cross the boundary.
            message: typeof error?.message === 'string'
              ? error.message.slice(0, 240)
              : 'The settings file request was not completed.',
          },
        });
      }
    });

  handle(CHANNELS.settingsExport, 'settings.export', async (args) => {
    if (args.length !== 1 || !plainObject(args[0]) || Object.keys(args[0]).some((key) => key !== 'profile')) {
      throw invalid('SETTINGS_REQUEST_INVALID', 'The export request must contain a profile only.');
    }
    if (!plainObject(args[0].profile)) {
      throw invalid('SETTINGS_REQUEST_INVALID', 'The export request must contain a profile object.');
    }
    const unknown = Object.keys(args[0].profile).find((key) => !PROFILE_KEYS.includes(key));
    if (unknown) {
      throw invalid('SETTINGS_REQUEST_INVALID', 'The export request must contain typed preferences only.');
    }
    assertProfileFields(args[0].profile, 'SETTINGS_REQUEST_INVALID');
    const profile = normalizeProfile(args[0].profile);
    let selection;
    try {
      selection = await saveDialog({
        title: 'Export KNOuX preferences',
        defaultPath: DEFAULT_FILE_NAME,
        buttonLabel: 'Export preferences',
        filters: [{ name: 'KNOuX settings profile', extensions: ['json'] }],
        properties: ['createDirectory', 'showOverwriteConfirmation'],
      });
    } catch {
      throw invalid('SETTINGS_DIALOG_FAILED', 'The export file dialog could not be opened.');
    }
    if (selection?.canceled || !selection?.filePath) return { canceled: true };
    return { canceled: false, ...(await writeProfileFile(selection.filePath, profile, now?.())) };
  });

  handle(CHANNELS.settingsImport, 'settings.import', async (args) => {
    if (args.length !== 0) {
      throw invalid('SETTINGS_REQUEST_INVALID', 'Import does not accept a path or any other argument.');
    }
    let selection;
    try {
      selection = await openDialog({
        title: 'Import KNOuX preferences',
        buttonLabel: 'Import preferences',
        filters: [{ name: 'KNOuX settings profile', extensions: ['json'] }],
        properties: ['openFile'],
      });
    } catch {
      throw invalid('SETTINGS_DIALOG_FAILED', 'The import file dialog could not be opened.');
    }
    if (selection?.canceled || !Array.isArray(selection?.filePaths) || selection.filePaths.length !== 1) {
      return { canceled: true };
    }
    return { canceled: false, ...(await readProfileDocument(selection.filePaths[0])) };
  });
}

module.exports = {
  CHANNELS,
  PROFILE_SCHEMA,
  EXPORT_SCHEMA,
  MAX_PROFILE_BYTES,
  DEFAULT_FILE_NAME,
  PROFILE_KEYS,
  EXPORT_KEYS,
  normalizeProfile,
  buildExportDocument,
  profileFromDocument,
  writeProfileFile,
  readProfileDocument,
  registerSettingsProfileIpc,
};
