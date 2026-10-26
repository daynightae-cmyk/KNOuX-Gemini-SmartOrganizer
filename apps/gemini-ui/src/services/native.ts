/**
 * Typed renderer access to the read-only Service Commander (Mission 12).
 */
import {
  NATIVE_CONTRACT_VERSION,
  type NativeEnvelope,
  type ServiceOperationPlan,
  type ServicesCapabilities,
  type ServicesJournalEntry,
  type ServicesReport,
  type ServicesSession,
  type ServicesShellApi,
  type ServicesSnapshot,
  type ServiceAction,
  type ServiceStartupType,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxServicesV1?: ServicesShellApi;
  }
}

export function getServicesShell(): ServicesShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxServicesV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The Service Commander ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  if (envelope.error) throw Object.assign(new Error(envelope.error.message), { code: envelope.error.code });
  return envelope;
}

export async function loadServicesCapabilities(): Promise<NativeEnvelope<ServicesCapabilities> | null> {
  const api = getServicesShell();
  if (!api) return null;
  return assertEnvelope(await api.capabilities(), 'services.capabilities');
}

export async function startServicesScan(): Promise<NativeEnvelope<ServicesSession> | null> {
  const api = getServicesShell();
  if (!api) return null;
  return assertEnvelope(await api.start(), 'services.start');
}

export async function readServicesStatus(sessionId: string): Promise<NativeEnvelope<ServicesSession> | null> {
  const api = getServicesShell();
  if (!api) return null;
  return assertEnvelope(await api.status(sessionId), 'services.status');
}

export async function cancelServicesScan(sessionId: string): Promise<void> {
  const api = getServicesShell();
  if (!api) return;
  await assertEnvelope(await api.cancel(sessionId), 'services.cancel');
}

export async function loadServicesSnapshot(): Promise<NativeEnvelope<ServicesSnapshot> | null> {
  const api = getServicesShell();
  if (!api) return null;
  return assertEnvelope(await api.snapshot(), 'services.snapshot');
}

export async function stageServicePlan(request: {
  serviceName: string;
  action: ServiceAction;
  startupType?: ServiceStartupType;
}): Promise<NativeEnvelope<ServiceOperationPlan> | null> {
  const api = getServicesShell();
  if (!api) return null;
  return assertEnvelope(await api.plan(request), 'services.plan');
}

export async function loadServicesJournal(): Promise<NativeEnvelope<ServicesJournalEntry[]> | null> {
  const api = getServicesShell();
  if (!api) return null;
  return assertEnvelope(await api.journal(), 'services.journal');
}

export async function loadServicesReport(options?: { redact?: boolean }): Promise<NativeEnvelope<ServicesReport> | null> {
  const api = getServicesShell();
  if (!api) return null;
  return assertEnvelope(await api.report(options || {}), 'services.report');
}
