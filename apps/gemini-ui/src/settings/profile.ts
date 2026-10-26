/**
 * KNOuX Settings profile — non-secret preferences only.
 *
 * API keys and provider credentials NEVER belong in this module or in
 * localStorage. They remain session-only until Mission 14's native secure
 * storage bridge is implemented and explicitly connected.
 */

export type SettingsAccent = 'neon_cyan' | 'obsidian' | 'cyber_purple' | 'emerald_shield';
export type SettingsDensity = 'comfortable' | 'compact';
export type EnginePreference = 'turbo' | 'balanced' | 'silent';

export interface SettingsProfile {
  schema: 'knoux.settings.profile.v1';
  accent: SettingsAccent;
  density: SettingsDensity;
  engineMode: EnginePreference;
  ramLimitGB: number;
  cpuThreads: '4' | '8' | '16' | '32';
  updatedAt: string;
}

export const SETTINGS_PROFILE_KEY = 'knoux_settings_profile_v1';

export const SETTINGS_DEFAULTS: SettingsProfile = Object.freeze({
  schema: 'knoux.settings.profile.v1',
  accent: 'neon_cyan',
  density: 'comfortable',
  engineMode: 'balanced',
  ramLimitGB: 4,
  cpuThreads: '8',
  updatedAt: '',
});

const ACCENTS: SettingsAccent[] = ['neon_cyan', 'obsidian', 'cyber_purple', 'emerald_shield'];
const DENSITIES: SettingsDensity[] = ['comfortable', 'compact'];
const ENGINES: EnginePreference[] = ['turbo', 'balanced', 'silent'];
const THREADS = ['4', '8', '16', '32'] as const;

export function normalizeSettingsProfile(input: unknown): SettingsProfile {
  const value = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
  return {
    schema: 'knoux.settings.profile.v1',
    accent: ACCENTS.includes(value.accent as SettingsAccent) ? value.accent as SettingsAccent : SETTINGS_DEFAULTS.accent,
    density: DENSITIES.includes(value.density as SettingsDensity) ? value.density as SettingsDensity : SETTINGS_DEFAULTS.density,
    engineMode: ENGINES.includes(value.engineMode as EnginePreference) ? value.engineMode as EnginePreference : SETTINGS_DEFAULTS.engineMode,
    ramLimitGB: Math.min(16, Math.max(1, Number.isFinite(Number(value.ramLimitGB)) ? Math.round(Number(value.ramLimitGB)) : SETTINGS_DEFAULTS.ramLimitGB)),
    cpuThreads: THREADS.includes(value.cpuThreads as typeof THREADS[number]) ? value.cpuThreads as typeof THREADS[number] : SETTINGS_DEFAULTS.cpuThreads,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt.slice(0, 40) : '',
  };
}

export function loadSettingsProfile(): SettingsProfile {
  if (typeof localStorage === 'undefined') return { ...SETTINGS_DEFAULTS };
  try {
    const raw = localStorage.getItem(SETTINGS_PROFILE_KEY);
    return raw ? normalizeSettingsProfile(JSON.parse(raw)) : { ...SETTINGS_DEFAULTS };
  } catch {
    return { ...SETTINGS_DEFAULTS };
  }
}

export function saveSettingsProfile(profile: SettingsProfile): { saved: boolean; profile: SettingsProfile } {
  const normalized = normalizeSettingsProfile({ ...profile, updatedAt: new Date().toISOString() });
  try {
    localStorage.setItem(SETTINGS_PROFILE_KEY, JSON.stringify(normalized));
    return { saved: true, profile: normalized };
  } catch {
    return { saved: false, profile: normalized };
  }
}

export function resetSettingsProfile(): { saved: boolean; profile: SettingsProfile } {
  const profile = normalizeSettingsProfile({ ...SETTINGS_DEFAULTS, updatedAt: new Date().toISOString() });
  try {
    localStorage.setItem(SETTINGS_PROFILE_KEY, JSON.stringify(profile));
    return { saved: true, profile };
  } catch {
    return { saved: false, profile };
  }
}

/** Credential-free export. The profile has no secret fields by construction. */
export function exportSettingsProfile(profile: SettingsProfile): Record<string, unknown> {
  const normalized = normalizeSettingsProfile(profile);
  return {
    schema: 'knoux.settings.export.v1',
    exportedAt: new Date().toISOString(),
    secretsExcluded: true,
    aiProvidersExcluded: true,
    profile: normalized,
    notice: 'Non-secret preferences only. API keys and tokens are never included in this export.',
  };
}

export interface SettingsDiffEntry {
  key: string;
  from: string;
  to: string;
}

export interface SettingsImportPreview {
  valid: boolean;
  errors: string[];
  profile: SettingsProfile | null;
  diff: SettingsDiffEntry[];
  secretsExcluded: boolean;
}

export function previewSettingsImport(payload: string, current: SettingsProfile): SettingsImportPreview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { valid: false, errors: ['The file is not valid JSON.'], profile: null, diff: [], secretsExcluded: true };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, errors: ['The import must be a settings object.'], profile: null, diff: [], secretsExcluded: true };
  }
  const value = parsed as Record<string, unknown>;
  if (value.schema !== 'knoux.settings.export.v1' && value.schema !== 'knoux.settings.profile.v1') {
    return { valid: false, errors: ['Only knoux.settings.export.v1 or knoux.settings.profile.v1 is accepted.'], profile: null, diff: [], secretsExcluded: true };
  }
  const incoming = normalizeSettingsProfile(value.profile ?? value);
  const normalizedCurrent = normalizeSettingsProfile(current);
  const diff: SettingsDiffEntry[] = [];
  const keys: Array<keyof SettingsProfile> = ['accent', 'density', 'engineMode', 'ramLimitGB', 'cpuThreads'];
  for (const key of keys) {
    const from = String(normalizedCurrent[key]);
    const to = String(incoming[key]);
    if (from !== to) diff.push({ key, from, to });
  }
  return { valid: true, errors: [], profile: incoming, diff, secretsExcluded: true };
}
