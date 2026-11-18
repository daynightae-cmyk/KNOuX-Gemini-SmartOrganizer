/**
 * Typed renderer access to the fixed KNOUX identity destinations.
 *
 * The native bridge is authoritative when present: it owns the URI table and
 * the operating-system handoff. In a browser preview there is no bridge, so the
 * page falls back to the static mirror and opens a normal tab. A destination id
 * that is not in the mirror is refused rather than turned into a URL.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type IdentityLinkEntry,
  type NativeEnvelope,
  type IdentityShellApi,
} from '../../shared/native-contracts';
import { IDENTITY_LINKS } from './profile';

declare global {
  interface Window {
    knouxIdentityV1?: IdentityShellApi;
  }
}

export type IdentityOpenMode = 'native' | 'browser' | 'unavailable';

export interface IdentityOpenResult {
  mode: IdentityOpenMode;
  target: string;
  scheme: string;
}

export function getIdentityShell(): IdentityShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxIdentityV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

export function hasIdentityShell(): boolean {
  return Boolean(getIdentityShell());
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The identity ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  if (envelope.error) throw Object.assign(new Error(envelope.error.message), { code: envelope.error.code });
  return envelope;
}

/** The native table when the bridge answered, otherwise the reviewed mirror. */
export async function loadIdentityLinks(): Promise<IdentityLinkEntry[]> {
  const api = getIdentityShell();
  if (!api) return [...IDENTITY_LINKS];
  try {
    const envelope = assertEnvelope(await api.links(), 'identity.links');
    const links = envelope.data?.links;
    if (!Array.isArray(links) || !links.length) return [...IDENTITY_LINKS];
    return links.map((entry) => ({ ...entry }));
  } catch {
    // A failed handshake must not hide the contact surface; the mirror is the
    // same reviewed table the native module loads from source.
    return [...IDENTITY_LINKS];
  }
}

/**
 * Open one destination. The id is always validated against a local table before
 * anything is opened, so a renderer bug cannot smuggle a new URI.
 */
export async function openIdentityLink(target: string): Promise<IdentityOpenResult> {
  const entry = IDENTITY_LINKS.find((candidate) => candidate.id === target);
  if (!entry) throw Object.assign(new Error('Unknown identity destination.'), { code: 'IDENTITY_TARGET_INVALID' });

  const api = getIdentityShell();
  if (api) {
    const envelope = assertEnvelope(await api.open(entry.id), 'identity.open');
    const scheme = envelope.data?.scheme ?? entry.scheme;
    return { mode: 'native', target: entry.id, scheme };
  }

  if (typeof window !== 'undefined' && typeof window.open === 'function') {
    window.open(entry.uri, '_blank', 'noopener,noreferrer');
    return { mode: 'browser', target: entry.id, scheme: entry.scheme };
  }

  return { mode: 'unavailable', target: entry.id, scheme: entry.scheme };
}

/** Copy a displayed value; clipboard writes are the only permission the shell grants. */
export async function copyIdentityValue(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the legacy path; a denied write is reported, not hidden.
  }
  try {
    if (typeof document !== 'undefined') {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.insetInlineStart = '-9999px';
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(area);
      return copied;
    }
  } catch {
    // Reported by the false return below.
  }
  return false;
}

/** Human-readable value for a link row: mailto/tel stripped, web host shortened. */
export function displayIdentityUri(entry: IdentityLinkEntry): string {
  if (entry.scheme === 'mailto') return entry.uri.replace(/^mailto:/, '');
  if (entry.scheme === 'tel') return entry.uri.replace(/^tel:/, '').replace(/^\+971/, '0');
  try {
    const url = new URL(entry.uri);
    const path = url.pathname.replace(/\/$/, '');
    return `${url.host}${path}`;
  } catch {
    return entry.uri;
  }
}
