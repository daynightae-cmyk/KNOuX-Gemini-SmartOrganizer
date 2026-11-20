/**
 * Typed renderer access to the read-only Applications coordinator (Mission 05).
 *
 * Browser previews have no shell bridge, so every call returns null and the
 * page renders a native-required state instead of design fixtures.
 */
import {
  NATIVE_CONTRACT_VERSION,
  type AppAssociations,
  type AppLeftoversResult,
  type AppPackagesResult,
  type AppPlan,
  type AppSignatureResult,
  type AppSizesResult,
  type AppUninstallPlan,
  type AppUninstallReceipt,
  type AppUpdatesResult,
  type AppsCapabilities,
  type AppsInventory,
  type AppsShellApi,
  type NativeEnvelope,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxAppsV1?: AppsShellApi;
    // knouxOperationsV1 is exposed by preload - do not declare here to avoid conflict with inferred type
    // Use (window as any).knouxOperationsV1 when accessing
  }
}

export function getAppsShell(): AppsShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxAppsV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function getOperationsShell(): {
  appUninstallPlan: (request: { appId: string }) => Promise<any>;
  appUninstallApply: (request: { planId: string; planHash: string; approved: boolean }) => Promise<any>;
  appUninstallReceipts: () => Promise<any>;
  contractVersion: number;
} | null {
  if (typeof window === 'undefined') return null;
  const candidate = (window as unknown as { knouxOperationsV1?: {
    appUninstallPlan: (request: { appId: string }) => Promise<any>;
    appUninstallApply: (request: { planId: string; planHash: string; approved: boolean }) => Promise<any>;
    appUninstallReceipts: () => Promise<any>;
    contractVersion: number;
  } }).knouxOperationsV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The Applications ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  if (envelope.error) {
    throw Object.assign(new Error(envelope.error.message), { code: envelope.error.code });
  }
  return envelope;
}

export async function loadAppsCapabilities(): Promise<NativeEnvelope<AppsCapabilities> | null> {
  const api = getAppsShell();
  if (!api) return null;
  return assertEnvelope(await api.capabilities(), 'apps.capabilities');
}

export async function loadAppsInventory(): Promise<NativeEnvelope<AppsInventory> | null> {
  const api = getAppsShell();
  if (!api) return null;
  return assertEnvelope(await api.inventory(), 'apps.inventory');
}

export async function verifyAppSignature(appId: string): Promise<NativeEnvelope<AppSignatureResult> | null> {
  const api = getAppsShell();
  if (!api) return null;
  return assertEnvelope(await api.signature(appId), 'apps.signature');
}

export async function loadAppAssociations(): Promise<NativeEnvelope<AppAssociations> | null> {
  const api = getAppsShell();
  if (!api) return null;
  return assertEnvelope(await api.associations(), 'apps.associations');
}

export async function measureAppSizes(
  appIds: string[],
  operationId: string
): Promise<NativeEnvelope<AppSizesResult> | null> {
  const api = getAppsShell();
  if (!api) return null;
  return assertEnvelope(await api.sizes({ appIds, operationId }), 'apps.sizes');
}

export async function cancelAppSizes(operationId: string): Promise<void> {
  await getAppsShell()?.cancelSizes(operationId);
}

export async function loadAppLeftovers(): Promise<NativeEnvelope<AppLeftoversResult> | null> {
  const api = getAppsShell();
  if (!api) return null;
  return assertEnvelope(await api.leftovers(), 'apps.leftovers');
}

export async function checkAppUpdates(): Promise<NativeEnvelope<AppUpdatesResult> | null> {
  const api = getAppsShell();
  if (!api) return null;
  return assertEnvelope(await api.updates({ check: true }), 'apps.updates');
}

export async function buildAppPlan(appIds: string[]): Promise<NativeEnvelope<AppPlan> | null> {
  const api = getAppsShell();
  if (!api) return null;
  return assertEnvelope(await api.plan({ appIds }), 'apps.plan');
}

export async function loadAppPackages(
  tab: 'installed' | 'discover',
  query?: string
): Promise<NativeEnvelope<AppPackagesResult> | null> {
  const api = getAppsShell();
  if (!api) return null;
  return assertEnvelope(await api.packages({ tab, query }), 'apps.packages');
}

export async function openWindowsSettings(
  target: 'defaultapps' | 'appsfeatures'
): Promise<NativeEnvelope<{ opened: boolean; target: string }> | null> {
  const api = getAppsShell();
  if (!api) return null;
  return assertEnvelope(await api.openSettings(target), 'apps.settings.open');
}

/**
 * Stage an immutable uninstall plan for a measured application.
 */
export async function stageAppUninstallPlan(appId: string): Promise<NativeEnvelope<any> | null> {
  const api = getOperationsShell();
  if (!api) return null;
  return assertEnvelope(await api.appUninstallPlan({ appId }), 'operations.appUninstallPlan');
}

/**
 * Execute an approved uninstall plan with native consent.
 */
export async function applyAppUninstallPlan(
  planId: string,
  planHash: string,
  approved: boolean
): Promise<NativeEnvelope<any> | null> {
  const api = getOperationsShell();
  if (!api) return null;
  return assertEnvelope(await api.appUninstallApply({ planId, planHash, approved }), 'operations.appUninstallApply');
}

/**
 * List all protected uninstall receipts.
 */
export async function loadAppUninstallReceipts(): Promise<NativeEnvelope<any> | null> {
  const api = getOperationsShell();
  if (!api) return null;
  return assertEnvelope(await api.appUninstallReceipts(), 'operations.appUninstallReceipts');
}
