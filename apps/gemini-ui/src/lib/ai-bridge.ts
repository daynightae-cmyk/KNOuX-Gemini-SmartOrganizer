/**
 * Typed renderer access to the Main-process AI provider bridge.
 *
 * The renderer is not allowed to hold a credential or to reach a provider
 * directly. This module only forwards bounded intents over the fixed
 * `knoux:ai:v1:*` channels and unwraps the native envelope into a plain
 * discriminated result, so a UI can show an honest error instead of guessing.
 *
 * A browser preview must never pretend the bridge exists: when the preload
 * handshake is absent every call resolves to `AI_BRIDGE_UNAVAILABLE`.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type AiBridgeStatus,
  type AiChatMessage,
  type AiCompletionResult,
  type AiConfigureResult,
  type AiProviderId,
  type AiShellApi,
  type AiVerifyResult,
  type NativeEnvelope,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxAiV1?: AiShellApi;
  }
}

export type AiBridgeFailure = {
  code: string;
  message: string;
  retryable: boolean;
};

export type AiBridgeResult<T> = { ok: true; data: T } | { ok: false; error: AiBridgeFailure };

export const AI_PROVIDERS: readonly AiProviderId[] = ['openrouter', 'openai', 'anthropic'] as const;

export function isAiProviderId(value: unknown): value is AiProviderId {
  return typeof value === 'string' && (AI_PROVIDERS as readonly string[]).includes(value);
}

export function getAiBridge(): AiShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxAiV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

export function hasAiBridge(): boolean {
  return getAiBridge() !== null;
}

const UNAVAILABLE: AiBridgeFailure = {
  code: 'AI_BRIDGE_UNAVAILABLE',
  message: 'The AI provider bridge requires the KNOuX desktop runtime. A browser preview has no native credential gate.',
  retryable: false,
};

function unwrap<T>(envelope: NativeEnvelope<T> | undefined | null, capability: string): AiBridgeResult<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    return { ok: false, error: { code: 'AI_CONTRACT_MISMATCH', message: `The native ${capability} response did not match the v${NATIVE_CONTRACT_VERSION} contract.`, retryable: false } };
  }
  if (envelope.error) {
    return { ok: false, error: { code: envelope.error.code, message: envelope.error.message, retryable: envelope.error.retryable } };
  }
  if (envelope.data === undefined) {
    return { ok: false, error: { code: 'AI_EMPTY_ENVELOPE', message: `The native ${capability} response carried no payload.`, retryable: true } };
  }
  return { ok: true, data: envelope.data };
}

async function call<T>(run: () => Promise<NativeEnvelope<T>>, capability: string): Promise<AiBridgeResult<T>> {
  const api = getAiBridge();
  if (!api) return { ok: false, error: UNAVAILABLE };
  try {
    return unwrap(await run(), capability);
  } catch (error) {
    // Never forward an unredacted thrown value; the bridge owns message safety.
    return { ok: false, error: { code: 'AI_BRIDGE_CALL_FAILED', message: `The ${capability} request did not reach the AI bridge.`, retryable: true } };
  }
}

export function readAiStatus(): Promise<AiBridgeResult<AiBridgeStatus>> {
  const api = getAiBridge();
  if (!api) return Promise.resolve({ ok: false, error: UNAVAILABLE });
  return call(() => api.status(), 'ai.status');
}

/**
 * One-way credential handoff to Main. The caller must drop its own copy
 * immediately; nothing here echoes the key back.
 */
export function configureAiProvider(request: { provider: AiProviderId; apiKey: string; persist?: boolean }): Promise<AiBridgeResult<AiConfigureResult>> {
  const api = getAiBridge();
  if (!api) return Promise.resolve({ ok: false, error: UNAVAILABLE });
  if (!isAiProviderId(request.provider)) {
    return Promise.resolve({ ok: false, error: { code: 'AI_PROVIDER_UNSUPPORTED', message: 'The requested AI provider is not supported.', retryable: false } });
  }
  return call(() => api.configure({ provider: request.provider, apiKey: request.apiKey, persist: request.persist === true }), 'ai.configure');
}

export function clearAiProvider(): Promise<AiBridgeResult<{ cleared: boolean }>> {
  const api = getAiBridge();
  if (!api) return Promise.resolve({ ok: false, error: UNAVAILABLE });
  return call(() => api.clear(), 'ai.clear');
}

export function verifyAiProvider(timeoutMs?: number): Promise<AiBridgeResult<AiVerifyResult>> {
  const api = getAiBridge();
  if (!api) return Promise.resolve({ ok: false, error: UNAVAILABLE });
  return call(() => api.verify({ timeoutMs }), 'ai.verify');
}

export function requestAiCompletion(request: {
  messages: AiChatMessage[];
  model?: string;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<AiBridgeResult<AiCompletionResult>> {
  const api = getAiBridge();
  if (!api) return Promise.resolve({ ok: false, error: UNAVAILABLE });
  return call(() => api.complete(request), 'ai.complete');
}

export function cancelAiRequests(): Promise<AiBridgeResult<{ cancelled: number }>> {
  const api = getAiBridge();
  if (!api) return Promise.resolve({ ok: false, error: UNAVAILABLE });
  return call(() => api.cancel(), 'ai.cancel');
}
