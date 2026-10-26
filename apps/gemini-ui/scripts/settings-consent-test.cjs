'use strict';

/**
 * KNOuX Gemini - Settings honesty and credential-boundary regression test.
 *
 * Static source guarantees only. The Electron smoke must still exercise real
 * persistence and the packaged app. Live AI/provider calls are not performed.
 */

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const appRoot = path.join(__dirname, '..');
const settingsPath = path.join(appRoot, 'src', 'pages', 'SettingsPage.tsx');
const profilePath = path.join(appRoot, 'src', 'settings', 'profile.ts');
const aiSessionPath = path.join(appRoot, 'src', 'lib', 'ai-session.ts');
const settings = fs.readFileSync(settingsPath, 'utf8');
const profile = fs.readFileSync(profilePath, 'utf8');
const aiSession = fs.readFileSync(aiSessionPath, 'utf8');
const failures = [];

function check(name, run) {
  try {
    run();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push({ name, message: String(error?.message || error) });
    console.log(`  ✗ ${name}: ${error?.message || error}`);
  }
}

console.log('[settings-consent-test]');

check('the simulated live process inspector and fake telemetry are gone', () => {
  assert.ok(!/LiveProcessInspector/.test(settings), 'Settings must not import/use the simulator');
  assert.ok(!/setInterval\(/.test(settings), 'Settings must not animate fake telemetry');
  assert.ok(!/Engine Status: Turbo Active|المحرك يعمل بأقصى كفاءة/.test(settings), 'fake engine status must be removed');
});

check('settings save is real and not a toast-only success', () => {
  assert.match(settings, /handleSaveAll/);
  assert.match(settings, /saveSettingsProfile\(currentProfile\(\)\)/);
  assert.match(settings, /data-testid="settings-save"/);
  assert.ok(!/All configuration changes saved!|تم حفظ كافة التغييرات في ملف التكوين/.test(settings), 'fake save toast must be gone');
});

check('export is credential-free and import is a typed preview', () => {
  assert.match(settings, /exportSettingsProfile\(currentProfile\(\)\)/);
  assert.match(settings, /previewSettingsImport\(text, currentProfile\(\)\)/);
  assert.match(settings, /data-testid="settings-export"/);
  assert.match(settings, /data-testid="settings-import-preview"/);
  assert.match(profile, /secretsExcluded: true/);
  assert.match(profile, /aiProvidersExcluded: true/);
  assert.ok(!/^\s*(apiKey|api_key|token|secret|authorization)\s*:/m.test(profile), 'profile module must not contain credential fields');
});

check('the non-secret profile persists only typed preferences', () => {
  assert.match(profile, /knoux_settings_profile_v1/);
  assert.match(profile, /normalizeSettingsProfile/);
  assert.match(profile, /saveSettingsProfile/);
  assert.match(profile, /loadSettingsProfile/);
  assert.match(profile, /ramLimitGB: Math\.min\(16, Math.max\(1/);
  assert.ok(!/localStorage\.setItem\([^)]*(apiKey|secret|token)/i.test(profile), 'no secret localStorage write');
});

check('AI keys remain session-only and are labelled insecure until a native vault exists', () => {
  assert.match(aiSession, /session-only/i);
  assert.ok(!/localStorage\.(getItem|setItem)|sessionStorage\./.test(aiSession), 'AI session must not persist credentials');
  assert.match(settings, /Credential security: the key remains in page memory only/);
  assert.match(settings, /native secure vault or native network proxy exists yet/);
});

check('unsupported engine and guard controls are explicitly disabled', () => {
  assert.match(settings, /data-testid="settings-engine-notice"/);
  assert.match(settings, /No native engine provider is connected/);
  assert.match(settings, /data-testid="settings-guard-notice"/);
  assert.match(settings, /checked=\{false\} disabled/);
  assert.match(settings, /NOT IMPLEMENTED|غير منفذ/);
});

check('Google Workspace reporting in Settings is honestly disconnected', () => {
  assert.match(settings, /No Google account is connected and no OAuth token is stored/);
  assert.ok(!/Authorized credentials and scopes active/.test(settings), 'fake active-scope claim must be gone');
});

check('no alert or direct credential persistence remains', () => {
  assert.ok(!/\balert\s*\(/.test(settings), 'alert() is forbidden');
  assert.ok(!/localStorage\.setItem\([^)]*(key|token|secret)/i.test(settings), 'no credential persistence in page');
});

const result = { ok: failures.length === 0, checks: 8, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
console.log('[settings-consent-test] PASS');
