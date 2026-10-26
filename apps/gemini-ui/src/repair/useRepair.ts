/**
 * Recovery Lab controller - measured only (Mission 11).
 *
 * Six read-only stages. No DISM/SFC/netsh/service/restore execution exists in
 * this controller; plans are immutable previews and the journal is local.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  RepairCapabilities,
  RepairJournalEntry,
  RepairPlan,
  RepairReport,
  RepairSession,
  RepairSnapshot,
  RepairToolId,
} from '../../shared/native-contracts';
import {
  cancelRepairScan,
  getRepairShell,
  loadRepairCapabilities,
  loadRepairJournal,
  loadRepairReport,
  loadRepairSnapshot,
  openRepairSettings,
  readRepairStatus,
  stageRepairPlan,
  startRepairScan,
} from './native';

export interface RepairActionError {
  code: string;
  message: string;
}

function toActionError(error: unknown, fallbackCode: string, fallbackMessage: string): RepairActionError {
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

export function useRepair() {
  const nativeAvailable = useMemo(() => Boolean(getRepairShell()), []);
  const [capabilities, setCapabilities] = useState<RepairCapabilities | null>(null);
  const [snapshot, setSnapshot] = useState<RepairSnapshot | null>(null);
  const [session, setSession] = useState<RepairSession | null>(null);
  const [plan, setPlan] = useState<RepairPlan | null>(null);
  const [journal, setJournal] = useState<RepairJournalEntry[]>([]);
  const [report, setReport] = useState<RepairReport | null>(null);
  const [loading, setLoading] = useState(nativeAvailable);
  const [scanning, setScanning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<RepairActionError | null>(null);
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
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 5400);
  }, []);

  const refreshJournal = useCallback(async () => {
    if (!nativeAvailable) return [];
    try {
      const envelope = await loadRepairJournal();
      const entries = envelope?.data || [];
      if (mounted.current) setJournal(entries);
      return entries;
    } catch (error) {
      if (mounted.current) setActionError(toActionError(error, 'REPAIR_JOURNAL_FAILED', 'The local repair journal could not be read.'));
      return [];
    }
  }, [nativeAvailable]);

  const applySnapshot = useCallback(async (next: RepairSnapshot) => {
    setSnapshot(next);
    setJournal(next.journal);
    setPlan(null);
  }, []);

  const startScan = useCallback(async () => {
    if (!nativeAvailable) return null;
    setScanning(true);
    setCancelling(false);
    setActionError(null);
    try {
      const started = await startRepairScan();
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
        const envelope = await readRepairStatus(sessionId);
        if (!envelope?.data) break;
        current = envelope.data;
        setSession(current);
        if (current.status !== 'running') break;
      }
      if (!mounted.current || sessionRef.current !== sessionId) return current;
      if (current.status === 'complete' || current.status === 'partial') {
        const envelope = await loadRepairSnapshot();
        if (envelope?.data) {
          await applySnapshot(envelope.data);
          const unavailable = envelope.data.coverage.filter((stage) => stage.status === 'unavailable').length;
          showNotice(
            current.status === 'partial'
              ? `Recovery Lab discovery completed partially: ${unavailable} unavailable stage(s), ${envelope.data.warnings.length} warning(s).`
              : `Recovery Lab discovery complete: ${envelope.data.network.adapters.length} adapter(s), ${envelope.data.update.services.length} update service(s), ${envelope.data.journal.length} journal preview(s).`,
          );
          await refreshJournal();
        }
        return current;
      }
      if (current.status === 'cancelled') {
        showNotice('Recovery Lab discovery cancelled. No partial snapshot was published.');
      } else if (current.status === 'failed') {
        setActionError({
          code: 'REPAIR_SCAN_FAILED',
          message: current.warnings[0] || 'The read-only repair discovery failed.',
        });
      }
      return current;
    } catch (error) {
      setActionError(toActionError(error, 'REPAIR_SCAN_FAILED', 'The read-only repair discovery could not start.'));
      return null;
    } finally {
      if (mounted.current) {
        setScanning(false);
        setCancelling(false);
        sessionRef.current = null;
      }
    }
  }, [applySnapshot, nativeAvailable, refreshJournal, showNotice]);

  useEffect(() => {
    if (!nativeAvailable) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const capsEnvelope = await loadRepairCapabilities();
        if (cancelled) return;
        if (capsEnvelope?.data) setCapabilities(capsEnvelope.data);
        let snapshotEnvelope = null;
        try {
          snapshotEnvelope = await loadRepairSnapshot();
        } catch (error) {
          const code = error && typeof error === 'object' ? (error as { code?: unknown }).code : null;
          if (code !== 'REPAIR_NOT_MEASURED') throw error;
        }
        if (cancelled) return;
        if (snapshotEnvelope?.data) {
          await applySnapshot(snapshotEnvelope.data);
        } else if (!autoScanStarted.current) {
          autoScanStarted.current = true;
          void startScan();
        }
      } catch (error) {
        if (!cancelled) {
          setActionError(toActionError(error, 'REPAIR_INIT_FAILED', 'The Recovery Lab coordinator did not respond.'));
        }
      } finally {
        if (!cancelled && mounted.current) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySnapshot, nativeAvailable, startScan]);

  const cancelScan = useCallback(async () => {
    const sessionId = sessionRef.current || session?.id;
    if (!sessionId || !scanning) return;
    setCancelling(true);
    try {
      await cancelRepairScan(sessionId);
      sessionRef.current = null;
      if (mounted.current) {
        setSession((current) => (current && current.id === sessionId ? { ...current, status: 'cancelled' } : current));
        showNotice('Cancellation requested. Measured stages stop at the next safe boundary.');
      }
    } catch (error) {
      setActionError(toActionError(error, 'REPAIR_CANCEL_FAILED', 'The repair discovery could not be cancelled.'));
    } finally {
      if (mounted.current) setCancelling(false);
    }
  }, [scanning, session?.id, showNotice]);

  const refreshSnapshot = useCallback(async (announce = false) => {
    if (!nativeAvailable) return null;
    setRefreshing(true);
    setActionError(null);
    try {
      const envelope = await loadRepairSnapshot();
      if (envelope?.data) {
        await applySnapshot(envelope.data);
        if (announce) showNotice('The measured repair evidence was re-read from the native coordinator.');
        return envelope.data;
      }
      return null;
    } catch (error) {
      setActionError(toActionError(error, 'REPAIR_SNAPSHOT_FAILED', 'The measured repair evidence could not be read.'));
      return null;
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, [applySnapshot, nativeAvailable, showNotice]);

  const stagePlan = useCallback(async (toolIds: RepairToolId[]) => {
    if (!nativeAvailable) return null;
    if (!toolIds.length) {
      setActionError({ code: 'REPAIR_PLAN_EMPTY', message: 'Select at least one repair tool first.' });
      return null;
    }
    setBusy('plan');
    setActionError(null);
    try {
      const envelope = await stageRepairPlan(toolIds);
      if (envelope?.data) {
        setPlan(envelope.data);
        await refreshJournal();
        showNotice(
          envelope.data.journalRecorded
            ? 'Immutable preview staged and recorded. Nothing was executed.'
            : 'Preview staged, but the local journal could not be written.',
        );
        return envelope.data;
      }
      return null;
    } catch (error) {
      setActionError(toActionError(error, 'REPAIR_PLAN_FAILED', 'The immutable repair preview could not be staged.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable, refreshJournal, showNotice]);

  const loadReport = useCallback(async (redact = true) => {
    if (!nativeAvailable) return null;
    setBusy('report');
    setActionError(null);
    try {
      const envelope = await loadRepairReport({ redact });
      if (envelope?.data) setReport(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'REPAIR_REPORT_FAILED', 'The measured recovery report could not be built.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const openSettings = useCallback(async (target: 'windowsupdate' | 'troubleshoot' | 'recovery') => {
    if (!nativeAvailable) return;
    setBusy('settings');
    setActionError(null);
    try {
      const envelope = await openRepairSettings(target);
      if (envelope?.data?.opened) {
        showNotice(`Windows Settings opened at the allowlisted ${target} handoff.`);
      }
    } catch (error) {
      setActionError(toActionError(error, 'REPAIR_SETTINGS_FAILED', 'The Windows settings handoff failed.'));
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable, showNotice]);

  const clearError = useCallback(() => setActionError(null), []);
  const clearNotice = useCallback(() => setNotice(null), []);
  const clearPlan = useCallback(() => setPlan(null), []);

  return {
    nativeAvailable,
    capabilities,
    snapshot,
    session,
    plan,
    journal,
    report,
    loading,
    scanning,
    cancelling,
    refreshing,
    busy,
    actionError,
    notice,
    startScan,
    cancelScan,
    refreshSnapshot,
    refreshJournal,
    stagePlan,
    loadReport,
    openSettings,
    clearError,
    clearNotice,
    clearPlan,
    showNotice,
  };
}

export type RepairController = ReturnType<typeof useRepair>;
