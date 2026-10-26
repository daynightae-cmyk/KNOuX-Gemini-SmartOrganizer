/**
 * Typed renderer access to the read-only Recovery Lab (Mission 11).
 * Browser previews have no shell bridge and render a native-required state.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type NativeEnvelope,
  type RepairCapabilities,
  type RepairJournalEntry,
  type RepairPlan,
  type RepairReport,
  type RepairSession,
  type RepairShellApi,
  type RepairSnapshot,
  type RepairToolId,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxRepairV1?: RepairShellApi;
  }
}

export function getRepairShell(): RepairShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxRepairV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The Recovery Lab ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  if (envelope.error) {
    throw Object.assign(new Error(envelope.error.message), { code: envelope.error.code });
  }
  return envelope;
}

export async function loadRepairCapabilities(): Promise<NativeEnvelope<RepairCapabilities> | null> {
  const api = getRepairShell();
  if (!api) return null;
  return assertEnvelope(await api.capabilities(), 'repair.capabilities');
}

export async function startRepairScan(): Promise<NativeEnvelope<RepairSession> | null> {
  const api = getRepairShell();
  if (!api) return null;
  return assertEnvelope(await api.start(), 'repair.start');
}

export async function readRepairStatus(sessionId: string): Promise<NativeEnvelope<RepairSession> | null> {
  const api = getRepairShell();
  if (!api) return null;
  return assertEnvelope(await api.status(sessionId), 'repair.status');
}

export async function cancelRepairScan(sessionId: string): Promise<void> {
  const api = getRepairShell();
  if (!api) return;
  await assertEnvelope(await api.cancel(sessionId), 'repair.cancel');
}

export async function loadRepairSnapshot(): Promise<NativeEnvelope<RepairSnapshot> | null> {
  const api = getRepairShell();
  if (!api) return null;
  return assertEnvelope(await api.snapshot(), 'repair.snapshot');
}

export async function stageRepairPlan(toolIds: RepairToolId[]): Promise<NativeEnvelope<RepairPlan> | null> {
  const api = getRepairShell();
  if (!api) return null;
  return assertEnvelope(await api.plan(toolIds), 'repair.plan');
}

export async function loadRepairJournal(): Promise<NativeEnvelope<RepairJournalEntry[]> | null> {
  const api = getRepairShell();
  if (!api) return null;
  return assertEnvelope(await api.journal(), 'repair.journal');
}

export async function loadRepairReport(options?: { redact?: boolean }): Promise<NativeEnvelope<RepairReport> | null> {
  const api = getRepairShell();
  if (!api) return null;
  return assertEnvelope(await api.report(options || {}), 'repair.report');
}

export async function openRepairSettings(
  target: 'windowsupdate' | 'troubleshoot' | 'recovery',
): Promise<NativeEnvelope<{ opened: boolean; target: string }> | null> {
  const api = getRepairShell();
  if (!api) return null;
  return assertEnvelope(await api.openSettings(target), 'repair.settings.open');
}
