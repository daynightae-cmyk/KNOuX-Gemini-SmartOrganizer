/**
 * Typed renderer access to the read-only Boot Control coordinator (Mission 09).
 *
 * Browser previews have no shell bridge, so every call returns null and the
 * page renders a native-required state instead of design fixtures.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type NativeEnvelope,
  type StartupCapabilities,
  type StartupImpact,
  type StartupInventory,
  type StartupJournal,
  type StartupPlan,
  type StartupReport,
  type StartupServiceEntry,
  type StartupSession,
  type StartupSessions,
  type StartupShellApi,
  type StartupTaskEntry,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxStartupV1?: StartupShellApi;
  }
}

export function getStartupShell(): StartupShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxStartupV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The Boot Control ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  if (envelope.error) {
    throw Object.assign(new Error(envelope.error.message), { code: envelope.error.code });
  }
  return envelope;
}

export async function loadStartupCapabilities(): Promise<NativeEnvelope<StartupCapabilities> | null> {
  const api = getStartupShell();
  if (!api) return null;
  return assertEnvelope(await api.capabilities(), 'startup.capabilities');
}

export async function startStartupScan(request: {
  includeTasks?: boolean;
  includeServices?: boolean;
  includeBoot?: boolean;
}): Promise<NativeEnvelope<StartupSession> | null> {
  const api = getStartupShell();
  if (!api) return null;
  return assertEnvelope(await api.start(request), 'startup.start');
}

export async function readStartupStatus(sessionId: string): Promise<NativeEnvelope<StartupSession> | null> {
  const api = getStartupShell();
  if (!api) return null;
  return assertEnvelope(await api.status(sessionId), 'startup.status');
}

export async function cancelStartupScan(sessionId: string): Promise<void> {
  const api = getStartupShell();
  if (!api) return;
  await assertEnvelope(await api.cancel(sessionId), 'startup.cancel');
}

export async function loadStartupInventory(): Promise<NativeEnvelope<StartupInventory> | null> {
  const api = getStartupShell();
  if (!api) return null;
  return assertEnvelope(await api.inventory(), 'startup.inventory');
}

export async function loadStartupServices(): Promise<NativeEnvelope<StartupServiceEntry[]> | null> {
  const api = getStartupShell();
  if (!api) return null;
  return assertEnvelope(await api.services(), 'startup.services');
}

export async function loadStartupTasks(): Promise<NativeEnvelope<StartupTaskEntry[]> | null> {
  const api = getStartupShell();
  if (!api) return null;
  return assertEnvelope(await api.tasks(), 'startup.tasks');
}

export async function loadStartupImpact(): Promise<NativeEnvelope<StartupImpact> | null> {
  const api = getStartupShell();
  if (!api) return null;
  return assertEnvelope(await api.impact(), 'startup.impact');
}

export async function loadStartupJournal(): Promise<NativeEnvelope<StartupJournal> | null> {
  const api = getStartupShell();
  if (!api) return null;
  return assertEnvelope(await api.journal(), 'startup.journal');
}

export async function loadStartupSessions(): Promise<NativeEnvelope<StartupSessions> | null> {
  const api = getStartupShell();
  if (!api) return null;
  return assertEnvelope(await api.sessions(), 'startup.sessions');
}

export async function buildStartupPlan(request: {
  entryIds: string[];
  mode: StartupPlan['mode'];
  delayMinutes?: number;
}): Promise<NativeEnvelope<StartupPlan> | null> {
  const api = getStartupShell();
  if (!api) return null;
  return assertEnvelope(await api.plan(request), 'startup.plan');
}

export async function loadStartupReport(): Promise<NativeEnvelope<StartupReport> | null> {
  const api = getStartupShell();
  if (!api) return null;
  return assertEnvelope(await api.report(), 'startup.report');
}

export async function openStartupSettings(): Promise<NativeEnvelope<{ opened: boolean; target: string }> | null> {
  const api = getStartupShell();
  if (!api) return null;
  return assertEnvelope(await api.openSettings('startupapps'), 'startup.settings.open');
}
