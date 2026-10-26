/**
 * Typed renderer access to the read-only Clean Room coordinator (Mission 08).
 *
 * Browser previews have no shell bridge, so every call returns null and the
 * page renders a native-required state instead of design fixtures.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type CleanupCapabilities,
  type CleanupCategory,
  type CleanupEstimate,
  type CleanupInventory,
  type CleanupPlan,
  type CleanupQuarantine,
  type CleanupReport,
  type CleanupScheduleDraft,
  type CleanupSession,
  type CleanupShellApi,
  type CleanupUnusedResult,
  type NativeEnvelope,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxCleanupV1?: CleanupShellApi;
  }
}

export function getCleanupShell(): CleanupShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxCleanupV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The Cleanup ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  if (envelope.error) {
    throw Object.assign(new Error(envelope.error.message), { code: envelope.error.code });
  }
  return envelope;
}

export async function loadCleanupCapabilities(): Promise<NativeEnvelope<CleanupCapabilities> | null> {
  const api = getCleanupShell();
  if (!api) return null;
  return assertEnvelope(await api.capabilities(), 'cleanup.capabilities');
}

export async function startCleanupScan(
  categories: CleanupCategory[],
  ageDays: number
): Promise<NativeEnvelope<CleanupSession> | null> {
  const api = getCleanupShell();
  if (!api) return null;
  return assertEnvelope(await api.start({ categories, ageDays }), 'cleanup.start');
}

export async function readCleanupStatus(sessionId: string): Promise<NativeEnvelope<CleanupSession> | null> {
  const api = getCleanupShell();
  if (!api) return null;
  return assertEnvelope(await api.status(sessionId), 'cleanup.status');
}

export async function cancelCleanupScan(sessionId: string): Promise<void> {
  const api = getCleanupShell();
  if (!api) return;
  await assertEnvelope(await api.cancel(sessionId), 'cleanup.cancel');
}

export async function loadCleanupInventory(): Promise<NativeEnvelope<CleanupInventory> | null> {
  const api = getCleanupShell();
  if (!api) return null;
  return assertEnvelope(await api.inventory(), 'cleanup.inventory');
}

export async function loadCleanupEstimate(): Promise<NativeEnvelope<CleanupEstimate> | null> {
  const api = getCleanupShell();
  if (!api) return null;
  return assertEnvelope(await api.estimate(), 'cleanup.estimate');
}

export async function loadCleanupQuarantine(): Promise<NativeEnvelope<CleanupQuarantine> | null> {
  const api = getCleanupShell();
  if (!api) return null;
  return assertEnvelope(await api.quarantine(), 'cleanup.quarantine');
}

export async function loadCleanupUnused(request: {
  sourceId?: string;
  ageDays: number;
  limit?: number;
}): Promise<NativeEnvelope<CleanupUnusedResult> | null> {
  const api = getCleanupShell();
  if (!api) return null;
  return assertEnvelope(await api.unused(request), 'cleanup.unused');
}

export async function buildCleanupPlan(
  candidateIds: string[],
  mode: CleanupPlan['mode']
): Promise<NativeEnvelope<CleanupPlan> | null> {
  const api = getCleanupShell();
  if (!api) return null;
  return assertEnvelope(await api.plan({ candidateIds, mode }), 'cleanup.plan');
}

export async function loadCleanupSchedule(request: {
  frequency: 'daily' | 'weekly';
  time: string;
  weekdays: number[];
  categories: CleanupCategory[];
}): Promise<NativeEnvelope<CleanupScheduleDraft> | null> {
  const api = getCleanupShell();
  if (!api) return null;
  return assertEnvelope(await api.schedule(request), 'cleanup.schedule');
}

export async function loadCleanupReport(): Promise<NativeEnvelope<CleanupReport> | null> {
  const api = getCleanupShell();
  if (!api) return null;
  return assertEnvelope(await api.report(), 'cleanup.report');
}

export async function openCleanupSettings(
  target: 'storage' | 'windowsupdate'
): Promise<NativeEnvelope<{ opened: boolean; target: string }> | null> {
  const api = getCleanupShell();
  if (!api) return null;
  return assertEnvelope(await api.openSettings(target), 'cleanup.settings.open');
}
