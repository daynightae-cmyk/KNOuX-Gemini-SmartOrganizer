/**
 * Typed renderer access to the read-only Smart Scan coordinator.
 *
 * Smart Scan composes the measured Studio/Files/Storage and Windows providers.
 * This wrapper never fabricates a session, never falls back to fixtures and
 * never exposes a mutation channel.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type NativeEnvelope,
  type ScanCapabilities,
  type ScanCancelResult,
  type ScanProgressEvent,
  type ScanSession,
  type ScanShellApi,
  type ScanStartRequest,
  type ScanStarted,
  type ScanSummary,
  type StudioSource,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxScanV1?: ScanShellApi;
  }
}

export function getScanShell(): ScanShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxScanV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The Smart Scan ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  return envelope;
}

export async function loadScanCapabilities(): Promise<NativeEnvelope<ScanCapabilities> | null> {
  const api = getScanShell();
  if (!api) return null;
  return assertEnvelope(await api.capabilities(), 'scan.capabilities');
}

export async function loadScanSources(): Promise<NativeEnvelope<StudioSource[]> | null> {
  const api = getScanShell();
  if (!api) return null;
  return assertEnvelope(await api.listSources(), 'scan.sources');
}

export async function chooseScanSource(): Promise<NativeEnvelope<StudioSource | null> | null> {
  const api = getScanShell();
  if (!api) return null;
  return assertEnvelope(await api.chooseSource(), 'scan.source.choose');
}

export async function indexScanSource(sourceId: string): Promise<NativeEnvelope<StudioSource> | null> {
  const api = getScanShell();
  if (!api) return null;
  return assertEnvelope(await api.indexSource(sourceId), 'scan.source.index');
}

export async function startScan(request: ScanStartRequest): Promise<NativeEnvelope<ScanStarted> | null> {
  const api = getScanShell();
  if (!api) return null;
  return assertEnvelope(await api.start(request), 'scan.start');
}

export async function cancelScan(sessionId: string): Promise<NativeEnvelope<ScanCancelResult> | null> {
  const api = getScanShell();
  if (!api) return null;
  return assertEnvelope(await api.cancel(sessionId), 'scan.cancel');
}

export async function loadScanSession(sessionId: string): Promise<NativeEnvelope<ScanSession> | null> {
  const api = getScanShell();
  if (!api) return null;
  return assertEnvelope(await api.status(sessionId), 'scan.status');
}

export async function loadScanHistory(): Promise<NativeEnvelope<ScanSummary[]> | null> {
  const api = getScanShell();
  if (!api) return null;
  return assertEnvelope(await api.history(), 'scan.history');
}

export function subscribeScanEvents(callback: (event: ScanProgressEvent) => void): () => void {
  const api = getScanShell();
  if (!api) return () => {};
  return api.onEvent(callback);
}
