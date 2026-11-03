/**
 * KNOuX SmartOrganizer — non-secret AI session mirror.
 *
 * Historically this module held the provider key in renderer page memory. The
 * credential now lives in the Electron Main process behind the fixed
 * `knoux:ai:v1:*` bridge, so this file keeps only what the UI needs to render
 * synchronously: which provider is selected, whether Main holds a credential,
 * and where that credential is stored. There is no key material here and there
 * is no storage of any kind — the values are refreshed from the bridge.
 *
 * Boundary: by default the credential stays in Main-process session memory and
 * is gone when KNOuX closes. A copy that survives a restart exists only after
 * the user explicitly opts in AND Windows reports its credential encryption is
 * available; `storage` then reads `windows-dpapi-safeStorage`. Anything else is
 * a claim this screen is not allowed to make.
 *
 * Why it stays a module-level mirror rather than a hook: Settings, the assistant
 * chat and the key modal all read the same state before their first paint, and
 * duplicating three async subscriptions would make the "is AI connected" badge
 * flicker. One small cache with an explicit refresh is honest and enough.
 */
import type { AiBridgeStatus, AiProviderId, AiStorageBoundary } from '../../shared/native-contracts';
import { isAiProviderId, readAiStatus } from './ai-bridge';

export type AiProvider = AiProviderId;

export interface AiSessionMirror {
  /** Provider currently held by the Main-process bridge. */
  provider: AiProvider;
  /** True only when Main confirms it holds a credential. Never inferred here. */
  hasKey: boolean;
  /** Truncated SHA-256 of the credential, for display only. */
  fingerprint: string | null;
  /** Actual storage boundary reported by Main. */
  storage: AiStorageBoundary;
  /** Whether the desktop bridge answered at all. */
  bridgeReachable: boolean;
  /** Whether Windows credential encryption is usable for an opt-in save. */
  storageAvailable: boolean;
  models: string[];
  defaultModel: string;
  lastVerifiedAt: string | null;
  /** Last non-secret error surfaced by the bridge. */
  lastError: { code: string; message: string; retryable: boolean } | null;
  observedAt: string | null;
}

const EMPTY: AiSessionMirror = {
  provider: 'openrouter',
  hasKey: false,
  fingerprint: null,
  storage: 'empty',
  bridgeReachable: false,
  storageAvailable: false,
  models: [],
  defaultModel: '',
  lastVerifiedAt: null,
  lastError: null,
  observedAt: null,
};

let mirror: AiSessionMirror = { ...EMPTY };

function project(status: AiBridgeStatus): AiSessionMirror {
  return {
    provider: isAiProviderId(status.provider) ? status.provider : 'openrouter',
    hasKey: Boolean(status.configured),
    fingerprint: typeof status.keyFingerprint === 'string' ? status.keyFingerprint : null,
    storage: status.storage,
    bridgeReachable: true,
    storageAvailable: Boolean(status.storageAvailable),
    models: Array.isArray(status.models) ? status.models : [],
    defaultModel: typeof status.defaultModel === 'string' ? status.defaultModel : '',
    lastVerifiedAt: typeof status.lastVerifiedAt === 'string' ? status.lastVerifiedAt : null,
    lastError: status.lastError ? { ...status.lastError } : null,
    observedAt: status.observedAt,
  };
}

/** Read the current non-secret mirror without awaiting. */
export function getAiSession(): AiSessionMirror {
  return mirror;
}

export function hasAiSession(): boolean {
  return mirror.hasKey;
}

/**
 * Pull the authoritative state from Main. A failed read resets the mirror: the
 * UI must not keep showing a stale "connected" badge after a bridge loss.
 */
export async function refreshAiSession(): Promise<AiSessionMirror> {
  const result = await readAiStatus();
  if (!result.ok) {
    mirror = { ...EMPTY, lastError: result.error };
    return mirror;
  }
  mirror = project(result.data);
  return mirror;
}

/** Optimistic local view right after a successful configure/clear round trip. */
export function applyAiSessionProjection(next: Partial<AiSessionMirror>): AiSessionMirror {
  mirror = { ...mirror, ...next };
  return mirror;
}

/** Drop the local view only. Main keeps its own state; use clearAiProvider(). */
export function resetAiSession(): AiSessionMirror {
  mirror = { ...EMPTY };
  return mirror;
}
