/**
 * Boot Control controller — measured only (Mission 09).
 *
 * Every number rendered by the workspace comes from the read-only Startup
 * coordinator. There is no fixture fallback: in a browser preview the hook
 * reports `nativeAvailable: false` and the page states that native measurement
 * is required. No startup value can be enabled, disabled, delayed or restored
 * here; plans and explicit gates only.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  StartupCapabilities,
  StartupImpact,
  StartupInventory,
  StartupJournal,
  StartupPlan,
  StartupReport,
  StartupSession,
  StartupSessions,
} from '../../shared/native-contracts';
import {
  buildStartupPlan,
  cancelStartupScan,
  getStartupShell,
  loadStartupCapabilities,
  loadStartupImpact,
  loadStartupInventory,
  loadStartupJournal,
  loadStartupReport,
  loadStartupSessions,
  openStartupSettings,
  readStartupStatus,
  startStartupScan,
} from './native';

export interface StartupActionError {
  code: string;
  message: string;
}

function toActionError(error: unknown, fallbackCode: string, fallbackMessage: string): StartupActionError {
  if (error && typeof error === 'object') {
    const candidate = error as { code?: unknown; message?: unknown };
    return {
      code: typeof candidate.code === 'string' ? candidate.code : fallbackCode,
      message: typeof candidate.message === 'string' ? candidate.message : fallbackMessage,
    };
  }
  return { code: fallbackCode, message: fallbackMessage };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useStartup() {
  const nativeAvailable = useMemo(() => Boolean(getStartupShell()), []);
  const [capabilities, setCapabilities] = useState<StartupCapabilities | null>(null);
  const [inventory, setInventory] = useState<StartupInventory | null>(null);
  const [impact, setImpact] = useState<StartupImpact | null>(null);
  const [journal, setJournal] = useState<StartupJournal | null>(null);
  const [sessions, setSessions] = useState<StartupSessions | null>(null);
  const [report, setReport] = useState<StartupReport | null>(null);
  const [plan, setPlan] = useState<StartupPlan | null>(null);
  const [session, setSession] = useState<StartupSession | null>(null);
  const [loading, setLoading] = useState(nativeAvailable);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<StartupActionError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const autoScanStarted = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 4800);
  }, []);

  const applyInventory = useCallback((next: StartupInventory) => {
    setInventory(next);
  }, []);

  const refresh = useCallback(async (announce = false) => {
    if (!nativeAvailable) return null;
    setRefreshing(true);
    setActionError(null);
    try {
      const envelope = await loadStartupInventory();
      if (!envelope) return null;
      if (envelope.data) applyInventory(envelope.data);
      if (announce && envelope.data) {
        showNotice(
          `Measured ${envelope.data.entries.length.toLocaleString()} startup entry(s), ${envelope.data.services.length.toLocaleString()} service(s) and ${envelope.data.tasks.length.toLocaleString()} logon task(s).`
        );
      }
      return envelope.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'STARTUP_INVENTORY_FAILED', 'The startup inventory could not be read.'));
      return null;
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, [applyInventory, nativeAvailable, showNotice]);

  const startScan = useCallback(async (options?: {
    includeTasks?: boolean;
    includeServices?: boolean;
    includeBoot?: boolean;
  }) => {
    if (!nativeAvailable) return null;
    setScanning(true);
    setCancelling(false);
    setActionError(null);
    setPlan(null);
    try {
      const started = await startStartupScan({
        includeTasks: options?.includeTasks !== false,
        includeServices: options?.includeServices !== false,
        includeBoot: options?.includeBoot !== false,
      });
      if (!started?.data) return null;
      const sessionId = started.data.id;
      sessionRef.current = sessionId;
      setSession(started.data);
      let current = started.data;
      const deadline = Date.now() + 120000;
      while (mounted.current && sessionRef.current === sessionId && Date.now() < deadline) {
        if (current.status !== 'running') break;
        await sleep(700);
        if (sessionRef.current !== sessionId) break;
        const envelope = await readStartupStatus(sessionId);
        if (!envelope?.data) break;
        current = envelope.data;
        setSession(current);
        if (current.status !== 'running') break;
      }
      if (!mounted.current || sessionRef.current !== sessionId) return current;
      if (current.status === 'complete' || current.status === 'partial') {
        const next = await refresh();
        try {
          const impactEnvelope = await loadStartupImpact();
          if (impactEnvelope?.data) setImpact(impactEnvelope.data);
        } catch {
          // Boot diagnostics can be unavailable without failing the whole scan.
        }
        showNotice(
          current.status === 'partial'
            ? `Measured discovery completed partially: ${current.entryCount ?? 0} entry(s) with ${current.warningCount} warning(s). Review the evidence before staging anything.`
            : `Measured discovery complete: ${current.entryCount ?? 0} startup entry(s) across 5 read-only stages.`
        );
        return current;
      }
      if (current.status === 'cancelled') {
        showNotice('Discovery cancelled. No partial inventory was published.');
      } else if (current.status === 'failed') {
        setActionError({
          code: 'STARTUP_SCAN_FAILED',
          message: current.error || 'The measured startup discovery session failed.',
        });
      }
      return current;
    } catch (error) {
      setActionError(toActionError(error, 'STARTUP_SCAN_FAILED', 'The measured startup discovery session could not start.'));
      return null;
    } finally {
      if (mounted.current) {
        setScanning(false);
        setCancelling(false);
        sessionRef.current = null;
      }
    }
  }, [nativeAvailable, refresh, showNotice]);

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
          loadStartupCapabilities(),
          loadStartupInventory(),
        ]);
        if (cancelled) return;
        if (capsEnvelope?.data) setCapabilities(capsEnvelope.data);
        if (inventoryEnvelope?.data) {
          applyInventory(inventoryEnvelope.data);
          const empty = inventoryEnvelope.data.entries.length === 0
            && inventoryEnvelope.data.services.length === 0
            && inventoryEnvelope.data.tasks.length === 0;
          if (empty && !autoScanStarted.current) {
            autoScanStarted.current = true;
            void startScan();
          }
        }
      } catch (error) {
        if (!cancelled) {
          setActionError(toActionError(error, 'STARTUP_INIT_FAILED', 'The Boot Control coordinator did not respond.'));
        }
      } finally {
        if (!cancelled && mounted.current) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyInventory, nativeAvailable, startScan]);

  const cancelScan = useCallback(async () => {
    const sessionId = sessionRef.current || session?.id;
    if (!sessionId || !scanning) return;
    setCancelling(true);
    try {
      await cancelStartupScan(sessionId);
      sessionRef.current = null;
      if (mounted.current) {
        setSession((current) => (current && current.id === sessionId ? { ...current, status: 'cancelled' } : current));
        showNotice('Cancellation requested. Measured stages stop at the next safe boundary.');
      }
    } catch (error) {
      setActionError(toActionError(error, 'STARTUP_CANCEL_FAILED', 'The discovery session could not be cancelled.'));
    } finally {
      if (mounted.current) setCancelling(false);
    }
  }, [scanning, session?.id, showNotice]);

  const loadJournal = useCallback(async () => {
    if (!nativeAvailable) return null;
    setBusy('journal');
    setActionError(null);
    try {
      const envelope = await loadStartupJournal();
      if (envelope?.data) setJournal(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'STARTUP_JOURNAL_FAILED', 'The startup change journal could not be read.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const loadSessions = useCallback(async () => {
    if (!nativeAvailable) return null;
    setBusy('sessions');
    setActionError(null);
    try {
      const envelope = await loadStartupSessions();
      if (envelope?.data) setSessions(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'STARTUP_SESSIONS_FAILED', 'The batch recovery sessions could not be read.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const loadImpact = useCallback(async () => {
    if (!nativeAvailable) return null;
    setBusy('impact');
    setActionError(null);
    try {
      const envelope = await loadStartupImpact();
      if (envelope?.data) setImpact(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'STARTUP_IMPACT_FAILED', 'Boot impact evidence could not be read.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const loadReport = useCallback(async () => {
    if (!nativeAvailable) return null;
    setBusy('report');
    setActionError(null);
    try {
      const envelope = await loadStartupReport();
      if (envelope?.data) setReport(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'STARTUP_REPORT_FAILED', 'The measured startup report could not be built.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const stagePlan = useCallback(async (
    entryIds: string[],
    mode: StartupPlan['mode'],
    delayMinutes?: number
  ) => {
    if (!nativeAvailable) return null;
    if (!entryIds.length) {
      setActionError({ code: 'STARTUP_PLAN_INPUT_INVALID', message: 'Select at least one measured startup target first.' });
      return null;
    }
    setBusy('plan');
    setActionError(null);
    try {
      const envelope = await buildStartupPlan({
        entryIds,
        mode,
        ...(delayMinutes == null ? {} : { delayMinutes }),
      });
      if (envelope?.data) setPlan(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'STARTUP_PLAN_FAILED', 'The immutable startup review plan could not be staged.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const openSettings = useCallback(async () => {
    if (!nativeAvailable) return;
    setBusy('settings');
    setActionError(null);
    try {
      const envelope = await openStartupSettings();
      if (envelope?.data?.opened) {
        showNotice('Windows Startup Apps settings opened for the supported official handoff.');
      }
    } catch (error) {
      setActionError(toActionError(error, 'STARTUP_SETTINGS_FAILED', 'The Windows Startup Apps page could not be opened.'));
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable, showNotice]);

  return {
    nativeAvailable,
    capabilities,
    inventory,
    impact,
    journal,
    sessions,
    report,
    plan,
    session,
    loading,
    refreshing,
    scanning,
    cancelling,
    busy,
    actionError,
    notice,
    showNotice,
    clearNotice: () => setNotice(null),
    clearError: () => setActionError(null),
    refresh,
    startScan,
    cancelScan,
    loadJournal,
    loadSessions,
    loadImpact,
    loadReport,
    stagePlan,
    openSettings,
    dismissPlan: () => setPlan(null),
  };
}

export type StartupController = ReturnType<typeof useStartup>;
