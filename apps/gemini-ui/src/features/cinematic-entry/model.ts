export type EntryPhase = 'INIT' | 'FORMING' | 'READY' | 'ENTERING' | 'ACTIVE';
export type EntryEvent = 'FORM' | 'READY' | 'ENTER' | 'FINISH' | 'REPLAY';
export const FORMATION_MS = 3200;
export const ENTRY_MS = 1600;
export const PREFERENCES_KEY = 'knoux.cinematic.v1';
export interface EntryPreferences { seen: boolean; always: boolean; muted: boolean; reduced: boolean }
export const defaults: EntryPreferences = { seen: false, always: false, muted: true, reduced: false };
export function transition(phase: EntryPhase, event: EntryEvent): EntryPhase {
  if (event === 'REPLAY' && phase === 'ACTIVE') return 'INIT';
  if (event === 'FORM' && phase === 'INIT') return 'FORMING';
  if (event === 'READY' && (phase === 'FORMING' || phase === 'INIT')) return 'READY';
  if (event === 'ENTER' && phase === 'READY') return 'ENTERING';
  if (event === 'FINISH' && phase === 'ENTERING') return 'ACTIVE';
  return phase;
}
export function loadPreferences(storage?: Pick<Storage, 'getItem'>): EntryPreferences {
  try {
    const v = JSON.parse((storage ?? localStorage).getItem(PREFERENCES_KEY) || '{}');
    return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, typeof v?.[key] === 'boolean' ? v[key] : fallback])) as unknown as EntryPreferences;
  } catch { return { ...defaults }; }
}
export function savePreferences(value: EntryPreferences): boolean {
  try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(value)); return true; } catch { return false; }
}
