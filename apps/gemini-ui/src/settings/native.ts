/**
 * Typed renderer access to the native settings-profile file capability.
 *
 * The desktop shell cancels every browser download, so a preferences export
 * cannot be an anchor + blob. This module is the only export/import path in
 * Electron: Main owns the dialog, the filesystem and the exported document,
 * and the renderer contributes typed non-secret preferences only.
 *
 * A browser preview has no such bridge and must say so instead of pretending.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type NativeEnvelope,
  type SettingsExportData,
  type SettingsImportData,
  type SettingsProfileDocument,
  type SettingsShellApi,
} from '../../shared/native-contracts';
import type { SettingsProfile } from './profile';

declare global {
  interface Window {
    knouxSettingsV1?: SettingsShellApi;
  }
}

export type SettingsFileFailure = {
  code: string;
  message: string;
  retryable: boolean;
};

export type SettingsFileResult<T> = { ok: true; data: T } | { ok: false; error: SettingsFileFailure };

export const SETTINGS_BRIDGE_UNAVAILABLE: SettingsFileFailure = {
  code: 'SETTINGS_BRIDGE_UNAVAILABLE',
  message: 'Native profile files require the KNOuX desktop runtime. A browser preview keeps the download and file-picker fallback.',
  retryable: false,
};

export function getSettingsBridge(): SettingsShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxSettingsV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

export function hasSettingsBridge(): boolean {
  return getSettingsBridge() !== null;
}

function unwrap<T>(envelope: NativeEnvelope<T> | undefined | null, capability: string): SettingsFileResult<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    return {
      ok: false,
      error: {
        code: 'SETTINGS_CONTRACT_MISMATCH',
        message: `The native ${capability} response did not match the v${NATIVE_CONTRACT_VERSION} contract.`,
        retryable: false,
      },
    };
  }
  if (envelope.error) {
    return {
      ok: false,
      error: { code: envelope.error.code, message: envelope.error.message, retryable: envelope.error.retryable },
    };
  }
  if (envelope.data === undefined) {
    return {
      ok: false,
      error: { code: 'SETTINGS_EMPTY_ENVELOPE', message: `The native ${capability} response carried no payload.`, retryable: true },
    };
  }
  return { ok: true, data: envelope.data };
}

async function call<T>(run: () => Promise<NativeEnvelope<T>>, capability: string): Promise<SettingsFileResult<T>> {
  const bridge = getSettingsBridge();
  if (!bridge) return { ok: false, error: SETTINGS_BRIDGE_UNAVAILABLE };
  try {
    return unwrap(await run(), capability);
  } catch {
    return {
      ok: false,
      error: {
        code: 'SETTINGS_BRIDGE_CALL_FAILED',
        message: `The ${capability} request did not reach the native settings capability.`,
        retryable: true,
      },
    };
  }
}

/** The bridge carries the typed profile only; no path is ever accepted here. */
export function exportProfileNative(profile: SettingsProfile): Promise<SettingsFileResult<SettingsExportData>> {
  const document: SettingsProfileDocument = {
    schema: 'knoux.settings.profile.v1',
    accent: profile.accent,
    density: profile.density,
    engineMode: profile.engineMode,
    ramLimitGB: profile.ramLimitGB,
    cpuThreads: profile.cpuThreads,
    updatedAt: profile.updatedAt,
  };
  return call(() => {
    const bridge = getSettingsBridge();
    if (!bridge) throw new Error('unavailable');
    return bridge.exportProfile({ profile: document });
  }, 'settings.export');
}

export function importProfileNative(): Promise<SettingsFileResult<SettingsImportData>> {
  return call(() => {
    const bridge = getSettingsBridge();
    if (!bridge) throw new Error('unavailable');
    return bridge.importProfile();
  }, 'settings.import');
}
