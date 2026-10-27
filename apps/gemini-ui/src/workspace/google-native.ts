/**
 * Typed renderer access to the main-process Google OAuth coordinator.
 *
 * The bridge exposes named status/connect/cancel/disconnect and bounded Sheets
 * actions only. It has no token, client-secret, arbitrary URL or arbitrary path
 * capability. Live Google data is requested only after explicit user actions.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type GoogleConnectionStatus,
  type GoogleSelectionResult,
  type GoogleSheetMetadata,
  type GoogleSheetValues,
  type GoogleSheetsListResult,
  type GoogleShellApi,
  type NativeEnvelope,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxGoogleV1?: GoogleShellApi;
  }
}

export function getGoogleShell(): GoogleShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxGoogleV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The Google ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  return envelope;
}

export async function loadGoogleStatus(): Promise<NativeEnvelope<GoogleConnectionStatus> | null> {
  const api = getGoogleShell();
  if (!api) return null;
  return assertEnvelope(await api.getStatus(), 'google.status');
}

export async function beginGoogleConnect(): Promise<NativeEnvelope<GoogleConnectionStatus> | null> {
  const api = getGoogleShell();
  if (!api) return null;
  return assertEnvelope(await api.connect(), 'google.connect');
}

export async function cancelGoogleConnect(): Promise<NativeEnvelope<GoogleConnectionStatus> | null> {
  const api = getGoogleShell();
  if (!api) return null;
  return assertEnvelope(await api.cancel(), 'google.cancel');
}

export async function disconnectGoogle(): Promise<NativeEnvelope<GoogleConnectionStatus> | null> {
  const api = getGoogleShell();
  if (!api) return null;
  return assertEnvelope(await api.disconnect(), 'google.disconnect');
}

export async function listGoogleSheets(): Promise<NativeEnvelope<GoogleSheetsListResult> | null> {
  const api = getGoogleShell();
  if (!api) return null;
  return assertEnvelope(await api.listSheets(), 'google.sheets.list');
}

export async function addGoogleSpreadsheet(input: string): Promise<NativeEnvelope<GoogleSelectionResult> | null> {
  const api = getGoogleShell();
  if (!api) return null;
  return assertEnvelope(await api.addSpreadsheet(input), 'google.sheets.add');
}

export async function removeGoogleSpreadsheet(id: string): Promise<NativeEnvelope<GoogleSelectionResult> | null> {
  const api = getGoogleShell();
  if (!api) return null;
  return assertEnvelope(await api.removeSpreadsheet(id), 'google.sheets.remove');
}

export async function readGoogleSheet(request: {
  id: string;
  range?: string;
  majorDimension?: 'ROWS' | 'COLUMNS';
}): Promise<NativeEnvelope<GoogleSheetValues> | null> {
  const api = getGoogleShell();
  if (!api) return null;
  return assertEnvelope(await api.readSheet(request), 'google.sheets.read');
}

export type {
  GoogleConnectionStatus,
  GoogleSheetMetadata,
  GoogleSheetsListResult,
  GoogleSheetValues,
};
