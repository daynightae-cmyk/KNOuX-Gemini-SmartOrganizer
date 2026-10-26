/**
 * Clean Room controller — measured only (Mission 08).
 *
 * Every number rendered by the Clean Room comes from the read-only native
 * coordinator. There is no fixture fallback: in a browser preview the hook
 * reports `nativeAvailable: false` and the page states that native measurement
 * is required. Destructive actions do not exist here; plans and gates only.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CleanupCapabilities,
  CleanupCategory,
  CleanupEstimate,
  CleanupInventory,
  CleanupPlan,
  CleanupQuarantine,
  CleanupReport,
  CleanupScheduleDraft,
  CleanupSession,
  CleanupUnusedResult,
} from '../../shared/native-contracts';
import {
  buildCleanupPlan,
  cancelCleanupScan,
  getCleanupShell,
  loadCleanupCapabilities,
  loadCleanupEstimate,
  loadCleanupInventory,
  loadCleanupQuarantine,
  loadCleanupReport,
  loadCleanupSchedule,
  loadCleanupUnused,
  openCleanupSettings,
  readCleanupStatus,
  startCleanupScan,
} from './native';

export interface CleanupActionError {
  code: string;
  message: string;
}

function toActionError(error: unknown, fallbackCode: string, fallbackMessage: string): CleanupActionError {
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

export function useCleanup() {
  const nativeAvailable = useMemo(() => Boolean(getCleanupShell()), []);
  const [capabilities, setCapabilities] = useState<CleanupCapabilities | null>(null);
  const [inventory, setInventory] = useState<CleanupInventory | null>(null);
  const [estimate, setEstimate] = useState<CleanupEstimate | null>(null);
  const [quarantine, setQuarantine] = useState<CleanupQuarantine | null>(null);
  const [unused, setUnused] = useState<CleanupUnusedResult | null>(null);
  const [plan, setPlan] = useState<CleanupPlan | null>(null);
  const [schedule, setSchedule] = useState<CleanupScheduleDraft | null>(null);
  const [report, setReport] = useState<CleanupReport | null>(null);
  const [session, setSession] = useState<CleanupSession | null>(null);
  const [loading, setLoading] = useState(nativeAvailable);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<CleanupActionError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 4600);
  }, []);

  const applyInventory = useCallback((next: CleanupInventory) => {
    setInventory(next);
  }, []);

  const refresh = useCallback(async (announce = false) => {
    if (!nativeAvailable) return;
    setRefreshing(true);
    setActionError(null);
    try {
      const envelope = await loadCleanupInventory();
      if (!envelope) return;
      if (envelope.data) applyInventory(envelope.data);
      const estimateEnvelope = await loadCleanupEstimate();
      if (estimateEnvelope?.data) setEstimate(estimateEnvelope.data);
      if (announce && envelope.data) {
        showNotice(
          `Measured ${envelope.data.candidates.length.toLocaleString()} cleanup candidate(s) from the read-only scan.`
        );
      }
    } catch (error) {
      setActionError(toActionError(error, 'CLEANUP_INVENTORY_FAILED', 'The cleanup inventory could not be read.'));
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
        const [capsEnvelope, inventoryEnvelope, estimateEnvelope] = await Promise.all([
          loadCleanupCapabilities(),
          loadCleanupInventory(),
          loadCleanupEstimate(),
        ]);
        if (cancelled) return;
        if (capsEnvelope?.data) setCapabilities(capsEnvelope.data);
        if (inventoryEnvelope?.data) applyInventory(inventoryEnvelope.data);
        if (estimateEnvelope?.data) setEstimate(estimateEnvelope.data);
      } catch (error) {
        if (!cancelled) {
          setActionError(toActionError(error, 'CLEANUP_INIT_FAILED', 'The Clean Room coordinator did not respond.'));
        }
      } finally {
        if (!cancelled && mounted.current) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyInventory, nativeAvailable]);

  const startScan = useCallback(async (categories: CleanupCategory[], ageDays: number) => {
    if (!nativeAvailable) return null;
    if (!categories.length) {
      setActionError({ code: 'CLEANUP_CATEGORY_INVALID', message: 'Select at least one category before scanning.' });
      return null;
    }
    setScanning(true);
    setCancelling(false);
    setActionError(null);
    setPlan(null);
    try {
      const started = await startCleanupScan(categories, ageDays);
      if (!started?.data) return null;
      const sessionId = started.data.id;
      sessionRef.current = sessionId;
      setSession(started.data);
      let current = started.data;
      const deadline = Date.now() + 180000;
      while (mounted.current && sessionRef.current === sessionId && Date.now() < deadline) {
        if (current.status !== 'running') break;
        await sleep(600);
        if (sessionRef.current !== sessionId) break;
        const envelope = await readCleanupStatus(sessionId);
        if (!envelope?.data) break;
        current = envelope.data;
        setSession(current);
        if (current.status !== 'running') break;
      }
      if (!mounted.current || sessionRef.current !== sessionId) return current;
      if (current.status === 'complete') {
        await refresh();
        showNotice(
          `Measured discovery complete: ${current.candidateCount.toLocaleString()} candidate(s) across ${current.categories.length} stage(s).`
        );
      } else if (current.status === 'cancelled') {
        showNotice('Discovery cancelled. No partial inventory was published.');
      } else if (current.status === 'failed') {
        setActionError({
          code: 'CLEANUP_SCAN_FAILED',
          message: current.error || 'The measured discovery session failed.',
        });
      }
      return current;
    } catch (error) {
      setActionError(toActionError(error, 'CLEANUP_SCAN_FAILED', 'The measured discovery session could not start.'));
      return null;
    } finally {
      if (mounted.current) {
        setScanning(false);
        setCancelling(false);
        sessionRef.current = null;
      }
    }
  }, [nativeAvailable, refresh, showNotice]);

  const cancelScan = useCallback(async () => {
    const sessionId = sessionRef.current || session?.id;
    if (!sessionId || !scanning) return;
    setCancelling(true);
    try {
      await cancelCleanupScan(sessionId);
      sessionRef.current = null;
      if (mounted.current) {
        setSession((current) => (current && current.id === sessionId ? { ...current, status: 'cancelled' } : current));
        showNotice('Cancellation requested. Measured stages stop at the next safe boundary.');
      }
    } catch (error) {
      setActionError(toActionError(error, 'CLEANUP_CANCEL_FAILED', 'The discovery session could not be cancelled.'));
    } finally {
      if (mounted.current) setCancelling(false);
    }
  }, [scanning, session?.id, showNotice]);

  const loadQuarantine = useCallback(async () => {
    if (!nativeAvailable) return null;
    setBusy('quarantine');
    setActionError(null);
    try {
      const envelope = await loadCleanupQuarantine();
      if (envelope?.data) setQuarantine(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'CLEANUP_QUARANTINE_FAILED', 'The quarantine vault could not be read.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const loadUnused = useCallback(async (ageDays: number, sourceId?: string) => {
    if (!nativeAvailable) return null;
    setBusy('unused');
    setActionError(null);
    try {
      const envelope = await loadCleanupUnused({ ageDays, ...(sourceId ? { sourceId } : {}), limit: 120 });
      if (envelope?.data) setUnused(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'CLEANUP_UNUSED_FAILED', 'Dormant files could not be measured.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const stagePlan = useCallback(async (candidateIds: string[], mode: CleanupPlan['mode']) => {
    if (!nativeAvailable) return null;
    setBusy('plan');
    setActionError(null);
    try {
      const envelope = await buildCleanupPlan(candidateIds, mode);
      if (envelope?.data) setPlan(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'CLEANUP_PLAN_FAILED', 'The review plan could not be staged.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const loadSchedule = useCallback(async (request: {
    frequency: 'daily' | 'weekly';
    time: string;
    weekdays: number[];
    categories: CleanupCategory[];
  }) => {
    if (!nativeAvailable) return null;
    setBusy('schedule');
    setActionError(null);
    try {
      const envelope = await loadCleanupSchedule(request);
      if (envelope?.data) setSchedule(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'CLEANUP_SCHEDULE_FAILED', 'The read-only schedule draft could not be composed.'));
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
      const envelope = await loadCleanupReport();
      if (envelope?.data) setReport(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'CLEANUP_REPORT_FAILED', 'The measured report could not be built.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const openSettings = useCallback(async (target: 'storage' | 'windowsupdate') => {
    if (!nativeAvailable) return;
    setBusy(`settings:${target}`);
    setActionError(null);
    try {
      const envelope = await openCleanupSettings(target);
      if (envelope?.data?.opened) {
        showNotice(
          target === 'storage'
            ? 'Windows Storage settings opened for the supported servicing handoff.'
            : 'Windows Update settings opened for the supported servicing handoff.'
        );
      }
    } catch (error) {
      setActionError(toActionError(error, 'CLEANUP_SETTINGS_FAILED', 'The Windows Settings page could not be opened.'));
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable, showNotice]);

  return {
    nativeAvailable,
    capabilities,
    inventory,
    estimate,
    quarantine,
    unused,
    plan,
    schedule,
    report,
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
    loadQuarantine,
    loadUnused,
    stagePlan,
    loadSchedule,
    loadReport,
    openSettings,
    dismissPlan: () => setPlan(null),
  };
}

export type CleanupController = ReturnType<typeof useCleanup>;
