import type { NativeEnvelope } from '../../shared/native-contracts';

export interface ClipboardPolicy {
  maxItems: number; retentionDays: number; captureImages: boolean; captureFiles: boolean;
}
export interface ClipboardStatus {
  enabled: boolean; paused: boolean; privateMode: boolean; monitoring: boolean;
  storageMode: 'encrypted' | 'memory-only' | 'locked'; storageError: string | null;
  lockedReason: string | null; pendingPersistence: boolean; count: number; pinned: number;
  storageBytes: number; skippedSensitive: number; skippedOversize: number; readFailures: number;
  policy: ClipboardPolicy; sensitiveProtection: string; consent: 'session-only';
}
export interface ClipboardItem {
  id: string; type: 'text' | 'image' | 'files'; createdAt: string; pinned: boolean; sizeBytes: number; preview: string;
  payload?: { type: 'text'; text: string } | { type: 'image'; image: string } | { type: 'files'; files: string[] };
}
export interface ClipboardQuery { query?: string; type?: 'all' | ClipboardItem['type']; pinnedOnly?: boolean }
export interface ClipboardListing { status: ClipboardStatus; items: ClipboardItem[] }
export type ClipboardConfiguration = Partial<ClipboardPolicy & { enabled: boolean; paused: boolean; privateMode: boolean }>;
interface ClipboardApi {
  contractVersion: number;
  status(): Promise<NativeEnvelope<ClipboardStatus>>;
  configure(request: ClipboardConfiguration): Promise<NativeEnvelope<ClipboardStatus>>;
  list(request?: ClipboardQuery): Promise<NativeEnvelope<ClipboardListing>>;
  get(id: string): Promise<NativeEnvelope<ClipboardItem>>;
  pin(id: string, pinned: boolean): Promise<NativeEnvelope<ClipboardItem>>;
  remove(id: string): Promise<NativeEnvelope<ClipboardStatus>>;
  clear(): Promise<NativeEnvelope<ClipboardStatus>>;
  copy(id: string): Promise<NativeEnvelope<{ copied: boolean; id: string }>>;
}
declare global { interface Window { knouxClipboardV1?: ClipboardApi } }
export function getClipboardApi() {
  const api = window.knouxClipboardV1;
  return api?.contractVersion === 1 ? api : null;
}
export async function vaultResult<T>(capability: string, result: Promise<NativeEnvelope<T>>): Promise<T> {
  const envelope = await result;
  if (envelope.contractVersion !== 1 || envelope.capability !== `clipboard.${capability}`) throw new Error('CLIPBOARD_CONTRACT_MISMATCH');
  if (envelope.error || envelope.data === undefined) throw new Error(envelope.error?.code || 'CLIPBOARD_UNAVAILABLE');
  return envelope.data;
}
