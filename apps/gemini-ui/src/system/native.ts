/**
 * Typed renderer access to the read-only Live Pulse coordinator (Mission 10).
 *
 * Browser previews have no shell bridge, so every call returns null and the
 * page renders a native-required state instead of design fixtures.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type NativeEnvelope,
  type HostsDraft,
  type HostsFileInfo,
  type HostsPlan,
  type SystemCapabilities,
  type SystemDiagnosticResult,
  type SystemDiagnosticType,
  type SystemEventQuery,
  type SystemEventsResult,
  type SystemMetrics,
  type SystemProcessResult,
  type SystemReport,
  type SystemSession,
  type SystemShellApi,
  type SystemSignatureResult,
  type SystemSnapshot,
  type SystemTracerouteResult,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxSystemV1?: SystemShellApi;
  }
}

export function getSystemShell(): SystemShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxSystemV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The Live Pulse ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  if (envelope.error) {
    throw Object.assign(new Error(envelope.error.message), { code: envelope.error.code });
  }
  return envelope;
}

export async function loadSystemCapabilities(): Promise<NativeEnvelope<SystemCapabilities> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.capabilities(), 'system.capabilities');
}

export async function startSystemScan(): Promise<NativeEnvelope<SystemSession> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.start(), 'system.start');
}

export async function readSystemStatus(sessionId: string): Promise<NativeEnvelope<SystemSession> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.status(sessionId), 'system.status');
}

export async function cancelSystemScan(sessionId: string): Promise<void> {
  const api = getSystemShell();
  if (!api) return;
  await assertEnvelope(await api.cancel(sessionId), 'system.cancel');
}

export async function loadSystemSnapshot(): Promise<NativeEnvelope<SystemSnapshot> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.snapshot(), 'system.snapshot');
}

export async function readSystemSample(): Promise<NativeEnvelope<SystemMetrics> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.sample(), 'system.sample');
}

export async function loadSystemProcesses(): Promise<NativeEnvelope<SystemProcessResult> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.processes(), 'system.processes');
}

export async function querySystemEvents(query: SystemEventQuery): Promise<NativeEnvelope<SystemEventsResult> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.events(query), 'system.events');
}

export async function verifySystemSignatures(paths: string[]): Promise<NativeEnvelope<SystemSignatureResult> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.signatures(paths), 'system.signatures');
}

export async function runSystemDiagnostic(request: {
  type: SystemDiagnosticType;
  target: string;
  port?: number;
}): Promise<NativeEnvelope<SystemDiagnosticResult> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.diagnostics(request), 'system.diagnostics');
}

export async function runSystemTraceroute(request: {
  target: string;
  maxHops?: number;
}): Promise<NativeEnvelope<SystemTracerouteResult> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.traceroute(request), 'system.traceroute');
}

export async function loadHostsFile(): Promise<NativeEnvelope<HostsFileInfo> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.hosts(), 'system.hosts');
}

export async function stageHostsPlan(draft: HostsDraft): Promise<NativeEnvelope<HostsPlan> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.hostsPlan(draft), 'system.hosts.plan');
}

export async function loadSystemReport(options?: { redact?: boolean }): Promise<NativeEnvelope<SystemReport> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.report(options || {}), 'system.report');
}

export async function openSystemSettings(
  target: 'display' | 'network' | 'wifi' | 'sound',
): Promise<NativeEnvelope<{ opened: boolean; target: string }> | null> {
  const api = getSystemShell();
  if (!api) return null;
  return assertEnvelope(await api.openSettings(target), 'system.settings.open');
}
