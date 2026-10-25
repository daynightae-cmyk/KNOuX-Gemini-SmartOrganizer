/**
 * Applications controller — measured only (Mission 05).
 *
 * Every number rendered by the Applications workspace comes from the read-only
 * native coordinator. There is no fixture fallback: in a browser preview the
 * hook reports `nativeAvailable: false` and the page renders an explicit
 * native-required state. Mutating actions (uninstall/update/association/startup)
 * do not exist in this controller; only plans and gates are exposed.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppAssociations,
  AppLeftoversResult,
  AppPackagesResult,
  AppPlan,
  AppSignatureResult,
  AppSizeResult,
  AppSizesResult,
  AppUpdatesResult,
  AppsCapabilities,
  AppsInventory,
} from '../../shared/native-contracts';
import {
  buildAppPlan,
  cancelAppSizes,
  checkAppUpdates,
  getAppsShell,
  loadAppAssociations,
  loadAppLeftovers,
  loadAppPackages,
  loadAppsCapabilities,
  loadAppsInventory,
  measureAppSizes,
  openWindowsSettings,
  verifyAppSignature,
} from './native';

export interface ActionError {
  code: string;
  message: string;
}

export interface SizesStatus {
  operationId: string;
  requested: number;
  measured: number;
  running: boolean;
  truncated: boolean;
  warnings: string[];
}

function toActionError(error: unknown, fallbackCode: string, fallbackMessage: string): ActionError {
  if (error && typeof error === 'object') {
    const candidate = error as { code?: unknown; message?: unknown };
    return {
      code: typeof candidate.code === 'string' ? candidate.code : fallbackCode,
      message: typeof candidate.message === 'string' ? candidate.message : fallbackMessage,
    };
  }
  return { code: fallbackCode, message: fallbackMessage };
}

function mergeSizes(results: AppSizeResult[]): Record<string, AppSizeResult> {
  const map: Record<string, AppSizeResult> = {};
  for (const result of results) map[result.appId] = result;
  return map;
}

function operationId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `apps-sz-${Date.now().toString(36)}-${random}`.slice(0, 64);
}

export function useApplications() {
  const nativeAvailable = useMemo(() => Boolean(getAppsShell()), []);
  const [capabilities, setCapabilities] = useState<AppsCapabilities | null>(null);
  const [inventory, setInventory] = useState<AppsInventory | null>(null);
  const [signatures, setSignatures] = useState<Record<string, AppSignatureResult>>({});
  const [sizes, setSizes] = useState<Record<string, AppSizeResult>>({});
  const [sizesStatus, setSizesStatus] = useState<SizesStatus | null>(null);
  const [associations, setAssociations] = useState<AppAssociations | null>(null);
  const [leftovers, setLeftovers] = useState<AppLeftoversResult | null>(null);
  const [updates, setUpdates] = useState<AppUpdatesResult | null>(null);
  const [packages, setPackages] = useState<AppPackagesResult | null>(null);
  const [plan, setPlan] = useState<AppPlan | null>(null);
  const [loading, setLoading] = useState(nativeAvailable);
  const [refreshing, setRefreshing] = useState(false);
  const [signatureBusyId, setSignatureBusyId] = useState<string | null>(null);
  const [sizesBusy, setSizesBusy] = useState(false);
  const [associationsBusy, setAssociationsBusy] = useState(false);
  const [leftoversBusy, setLeftoversBusy] = useState(false);
  const [updatesBusy, setUpdatesBusy] = useState(false);
  const [packagesBusy, setPackagesBusy] = useState(false);
  const [planBusy, setPlanBusy] = useState(false);
  const [actionError, setActionError] = useState<ActionError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const activeOperation = useRef<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 4200);
  }, []);

  const applyInventory = useCallback((next: AppsInventory) => {
    setInventory(next);
    setSignatures((current) => {
      const merged = { ...current };
      for (const app of next.apps) {
        if (app.signature.status === 'unchecked') continue;
        if (merged[app.id]) continue;
        merged[app.id] = {
          appId: app.id,
          executable: null,
          status: app.signature.status,
          message: null,
          signer: app.signature.signer,
          issuer: null,
          thumbprint: app.signature.thumbprint,
          notBefore: null,
          notAfter: null,
          chain: [],
          checkedAt: app.signature.checkedAt || next.observedAt,
          provider: 'Get-AuthenticodeSignature',
          note: 'Signature state restored from the measured inventory cache.',
        };
      }
      return merged;
    });
    setSizes((current) => {
      const merged = { ...current };
      for (const app of next.apps) {
        if (app.size.measuredBytes == null || merged[app.id]) continue;
        merged[app.id] = {
          appId: app.id,
          measuredBytes: app.size.measuredBytes,
          reportedBytes: app.size.reportedBytes,
          files: app.size.filesMeasured ?? 0,
          folders: 0,
          partial: Boolean(app.size.partial),
          reason: app.size.partial ? 'A previous bounded measurement was partial.' : null,
          topFolders: [],
          appData: null,
          durationMs: 0,
        };
      }
      return merged;
    });
  }, []);

  const refreshInventory = useCallback(async (announce = false) => {
    if (!nativeAvailable) return null;
    setRefreshing(true);
    setActionError(null);
    try {
      const envelope = await loadAppsInventory();
      if (!envelope) return null;
      if (envelope.data) applyInventory(envelope.data);
      if (envelope.status !== 'complete' && envelope.status !== 'partial') {
        setActionError({
          code: envelope.error?.code || 'APPS_INVENTORY_FAILED',
          message: envelope.error?.message || 'The installed-application inventory could not be read.',
        });
        return envelope;
      }
      if (announce && envelope.data) {
        showNotice(
          `Measured ${envelope.data.kpis.installed.toLocaleString()} installed application(s) in ${Math.max(1, Math.round(envelope.data.durationMs))} ms.`
        );
      }
      return envelope;
    } catch (error) {
      setActionError(toActionError(error, 'APPS_INVENTORY_FAILED', 'The installed-application inventory could not be read.'));
      return null;
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, [applyInventory, nativeAvailable, showNotice]);

  useEffect(() => {
    if (!nativeAvailable) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [capsEnvelope, inventoryEnvelope] = await Promise.all([
          loadAppsCapabilities(),
          loadAppsInventory(),
        ]);
        if (cancelled) return;
        if (capsEnvelope?.status === 'complete' && capsEnvelope.data) setCapabilities(capsEnvelope.data);
        else if (capsEnvelope) {
          setActionError({
            code: capsEnvelope.error?.code || 'APPS_CAPABILITIES_FAILED',
            message: capsEnvelope.error?.message || 'Applications capabilities could not be read.',
          });
        }
        if (inventoryEnvelope?.data) applyInventory(inventoryEnvelope.data);
        if (inventoryEnvelope && inventoryEnvelope.status !== 'complete' && inventoryEnvelope.status !== 'partial') {
          setActionError({
            code: inventoryEnvelope.error?.code || 'APPS_INVENTORY_FAILED',
            message: inventoryEnvelope.error?.message || 'The installed-application inventory could not be read.',
          });
        }
      } catch (error) {
        if (!cancelled) {
          setActionError(toActionError(error, 'APPS_RENDERER_FAILED', 'The Applications workspace could not initialize.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyInventory, nativeAvailable]);

  const verifySignature = useCallback(async (appId: string) => {
    setSignatureBusyId(appId);
    setActionError(null);
    try {
      const envelope = await verifyAppSignature(appId);
      if (!envelope) return null;
      if (envelope.data) {
        setSignatures((current) => ({ ...current, [appId]: envelope.data! }));
        setInventory((current) => {
          if (!current) return current;
          return {
            ...current,
            apps: current.apps.map((app) =>
              app.id === appId
                ? {
                    ...app,
                    signature: {
                      status: envelope.data!.status,
                      signer: envelope.data!.signer,
                      thumbprint: envelope.data!.thumbprint,
                      checkedAt: envelope.data!.checkedAt,
                    },
                  }
                : app
            ),
          };
        });
        showNotice(
          envelope.data.status === 'valid'
            ? 'Authenticode signature verified against the local certificate chain.'
            : `Authenticode result: ${envelope.data.status}.`
        );
      }
      if (envelope.status !== 'complete' && envelope.status !== 'partial') {
        setActionError({
          code: envelope.error?.code || 'APP_SIGNATURE_FAILED',
          message: envelope.error?.message || 'The signature could not be verified.',
        });
      }
      return envelope.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'APP_SIGNATURE_FAILED', 'The signature could not be verified.'));
      return null;
    } finally {
      if (mounted.current) setSignatureBusyId(null);
    }
  }, [showNotice]);

  const measureSizes = useCallback(async (appIds: string[]) => {
    const requested = [...new Set(appIds.filter(Boolean))];
    if (!requested.length) {
      setActionError({ code: 'APP_SIZE_EMPTY', message: 'Select at least one application with a measurable install location.' });
      return null;
    }
    const opId = operationId();
    activeOperation.current = opId;
    setSizesBusy(true);
    setActionError(null);
    setSizesStatus({ operationId: opId, requested: requested.length, measured: 0, running: true, truncated: false, warnings: [] });
    try {
      const envelope = await measureAppSizes(requested, opId);
      if (!envelope) return null;
      const data: AppSizesResult | undefined = envelope.data;
      if (data) {
        setSizes((current) => ({ ...current, ...mergeSizes(data.results) }));
        setInventory((current) => {
          if (!current) return current;
          const byId = mergeSizes(data.results);
          return {
            ...current,
            apps: current.apps.map((app) => {
              const measured = byId[app.id];
              if (!measured) return app;
              return {
                ...app,
                size: {
                  reportedBytes: measured.reportedBytes,
                  measuredBytes: measured.measuredBytes,
                  measuredAt: data.observedAt,
                  source: measured.measuredBytes == null ? app.size.source : 'measured',
                  partial: measured.partial,
                  filesMeasured: measured.files,
                },
              };
            }),
            kpis: {
              ...current.kpis,
              measuredFootprintBytes: (() => {
                const values = current.apps
                  .map((app) => byId[app.id]?.measuredBytes ?? app.size.measuredBytes)
                  .filter((value): value is number => value != null);
                return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
              })(),
              measuredFootprintApps:
                current.apps.filter((app) => (byId[app.id]?.measuredBytes ?? app.size.measuredBytes) != null).length,
            },
          };
        });
        setSizesStatus({
          operationId: opId,
          requested: data.requested,
          measured: data.measured,
          running: false,
          truncated: data.truncated,
          warnings: data.warnings,
        });
        showNotice(
          data.measured > 0
            ? `Measured ${data.measured} of ${data.requested} application footprint(s) within the bounded budget.`
            : 'No install location could be measured within the bounded budget.'
        );
      }
      if (envelope.status !== 'complete' && envelope.status !== 'partial') {
        setActionError({
          code: envelope.error?.code || 'APP_SIZE_FAILED',
          message: envelope.error?.message || 'The application footprint could not be measured.',
        });
      }
      return data || null;
    } catch (error) {
      setActionError(toActionError(error, 'APP_SIZE_FAILED', 'The application footprint could not be measured.'));
      return null;
    } finally {
      activeOperation.current = null;
      if (mounted.current) setSizesBusy(false);
    }
  }, [showNotice]);

  const cancelSizes = useCallback(async () => {
    const opId = activeOperation.current;
    if (!opId) return;
    try {
      await cancelAppSizes(opId);
      showNotice('Cancellation requested for the bounded size measurement.');
    } catch (error) {
      setActionError(toActionError(error, 'APP_SIZE_CANCEL_FAILED', 'Cancellation could not be requested.'));
    }
  }, [showNotice]);

  const loadAssociations = useCallback(async () => {
    setAssociationsBusy(true);
    setActionError(null);
    try {
      const envelope = await loadAppAssociations();
      if (!envelope) return null;
      if (envelope.data) setAssociations(envelope.data);
      if (envelope.status !== 'complete' && envelope.status !== 'partial') {
        setActionError({
          code: envelope.error?.code || 'APP_ASSOCIATIONS_FAILED',
          message: envelope.error?.message || 'File associations could not be read.',
        });
      }
      return envelope.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'APP_ASSOCIATIONS_FAILED', 'File associations could not be read.'));
      return null;
    } finally {
      if (mounted.current) setAssociationsBusy(false);
    }
  }, []);

  const loadLeftovers = useCallback(async () => {
    setLeftoversBusy(true);
    setActionError(null);
    try {
      const envelope = await loadAppLeftovers();
      if (!envelope) return null;
      if (envelope.data) setLeftovers(envelope.data);
      if (envelope.status !== 'complete' && envelope.status !== 'partial') {
        setActionError({
          code: envelope.error?.code || 'APP_LEFTOVERS_FAILED',
          message: envelope.error?.message || 'Leftover candidates could not be measured.',
        });
      }
      return envelope.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'APP_LEFTOVERS_FAILED', 'Leftover candidates could not be measured.'));
      return null;
    } finally {
      if (mounted.current) setLeftoversBusy(false);
    }
  }, []);

  const checkUpdates = useCallback(async () => {
    setUpdatesBusy(true);
    setActionError(null);
    try {
      const envelope = await checkAppUpdates();
      if (!envelope) return null;
      if (envelope.data) setUpdates(envelope.data);
      if (envelope.status !== 'complete' && envelope.status !== 'partial') {
        setActionError({
          code: envelope.error?.code || 'APP_UPDATES_FAILED',
          message: envelope.error?.message || 'WinGet update feeds could not be read.',
        });
      }
      return envelope.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'APP_UPDATES_FAILED', 'WinGet update feeds could not be read.'));
      return null;
    } finally {
      if (mounted.current) setUpdatesBusy(false);
    }
  }, []);

  const loadPackages = useCallback(async (tab: 'installed' | 'discover', query?: string) => {
    setPackagesBusy(true);
    setActionError(null);
    try {
      const envelope = await loadAppPackages(tab, query);
      if (!envelope) return null;
      if (envelope.data) setPackages(envelope.data);
      if (envelope.status !== 'complete' && envelope.status !== 'partial') {
        setActionError({
          code: envelope.error?.code || 'APP_PACKAGES_FAILED',
          message: envelope.error?.message || 'WinGet packages could not be read.',
        });
      }
      return envelope.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'APP_PACKAGES_FAILED', 'WinGet packages could not be read.'));
      return null;
    } finally {
      if (mounted.current) setPackagesBusy(false);
    }
  }, []);

  const reviewPlan = useCallback(async (appIds: string[]) => {
    const requested = [...new Set(appIds.filter(Boolean))];
    if (!requested.length) {
      setActionError({ code: 'APP_PLAN_EMPTY', message: 'Select at least one application to review a removal plan.' });
      return null;
    }
    setPlanBusy(true);
    setActionError(null);
    try {
      const envelope = await buildAppPlan(requested);
      if (!envelope) return null;
      if (envelope.data) setPlan(envelope.data);
      if (envelope.status !== 'complete' || !envelope.data) {
        setActionError({
          code: envelope.error?.code || 'APP_PLAN_FAILED',
          message: envelope.error?.message || 'The removal review plan could not be built.',
        });
        return null;
      }
      return envelope.data;
    } catch (error) {
      setActionError(toActionError(error, 'APP_PLAN_FAILED', 'The removal review plan could not be built.'));
      return null;
    } finally {
      if (mounted.current) setPlanBusy(false);
    }
  }, []);

  const clearPlan = useCallback(() => setPlan(null), []);

  const openSettings = useCallback(async (target: 'defaultapps' | 'appsfeatures') => {
    setActionError(null);
    try {
      const envelope = await openWindowsSettings(target);
      if (!envelope) return false;
      if (envelope.status === 'complete' && envelope.data?.opened) {
        showNotice(
          target === 'defaultapps'
            ? 'Windows Default Apps settings opened. KNOuX wrote no association.'
            : 'Windows Apps & Features settings opened. KNOuX uninstalled nothing.'
        );
        return true;
      }
      setActionError({
        code: envelope.error?.code || 'APP_SETTINGS_FAILED',
        message: envelope.error?.message || 'Windows Settings could not be opened.',
      });
      return false;
    } catch (error) {
      setActionError(toActionError(error, 'APP_SETTINGS_FAILED', 'Windows Settings could not be opened.'));
      return false;
    }
  }, [showNotice]);

  const exportInventory = useCallback(() => {
    if (!inventory) return;
    const payload = {
      contract: 'apps.v1',
      exportedAt: new Date().toISOString(),
      readOnly: true,
      mutation: 'none',
      inventory,
      signatures,
      measuredSizes: sizes,
      updates,
      associations,
      leftovers,
      plan,
      disclaimer:
        'Measured evidence exported from the read-only Applications coordinator. No files, registry values or packages were changed.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `knoux-applications-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showNotice('Measured application evidence exported as JSON.');
  }, [associations, inventory, leftovers, plan, showNotice, signatures, sizes, updates]);

  return {
    nativeAvailable,
    capabilities,
    inventory,
    signatures,
    sizes,
    sizesStatus,
    associations,
    leftovers,
    updates,
    packages,
    plan,
    loading,
    refreshing,
    signatureBusyId,
    sizesBusy,
    associationsBusy,
    leftoversBusy,
    updatesBusy,
    packagesBusy,
    planBusy,
    actionError,
    notice,
    clearError: () => setActionError(null),
    clearNotice: () => setNotice(null),
    refreshInventory,
    verifySignature,
    measureSizes,
    cancelSizes,
    loadAssociations,
    loadLeftovers,
    checkUpdates,
    loadPackages,
    reviewPlan,
    clearPlan,
    openSettings,
    exportInventory,
    showNotice,
  };
}

export type ApplicationsController = ReturnType<typeof useApplications>;
