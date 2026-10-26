/**
 * Service Commander controller - measured only (Mission 12).
 * Service start/stop/restart/startup-type plans are immutable previews.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ServiceAction,
  ServiceOperationPlan,
  ServiceStartupType,
  ServicesCapabilities,
  ServicesJournalEntry,
  ServicesReport,
  ServicesSession,
  ServicesSnapshot,
} from '../../shared/native-contracts';
import {
  cancelServicesScan,
  getServicesShell,
  loadServicesCapabilities,
  loadServicesJournal,
  loadServicesReport,
  loadServicesSnapshot,
  readServicesStatus,
  stageServicePlan,
  startServicesScan,
} from './native';

export interface ServicesActionError { code: string; message: string }

function toActionError(error: unknown, code: string, message: string): ServicesActionError {
  if (error && typeof error === 'object') {
    const candidate = error as { code?: unknown; message?: unknown };
    return { code: typeof candidate.code === 'string' ? candidate.code : code, message: typeof candidate.message === 'string' ? candidate.message : message };
  }
  return { code, message };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useServices() {
  const nativeAvailable = useMemo(() => Boolean(getServicesShell()), []);
  const [capabilities, setCapabilities] = useState<ServicesCapabilities | null>(null);
  const [snapshot, setSnapshot] = useState<ServicesSnapshot | null>(null);
  const [session, setSession] = useState<ServicesSession | null>(null);
  const [plan, setPlan] = useState<ServiceOperationPlan | null>(null);
  const [journal, setJournal] = useState<ServicesJournalEntry[]>([]);
  const [report, setReport] = useState<ServicesReport | null>(null);
  const [loading, setLoading] = useState(nativeAvailable);
  const [scanning, setScanning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<ServicesActionError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const sessionRef = useRef<string | null>(null);
  const autoScanStarted = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 5400);
  }, []);

  const refreshJournal = useCallback(async () => {
    if (!nativeAvailable) return [];
    try {
      const envelope = await loadServicesJournal();
      const entries = envelope?.data || [];
      if (mounted.current) setJournal(entries);
      return entries;
    } catch (error) {
      if (mounted.current) setActionError(toActionError(error, 'SERVICES_JOURNAL_FAILED', 'The service preview journal could not be read.'));
      return [];
    }
  }, [nativeAvailable]);

  const applySnapshot = useCallback((next: ServicesSnapshot) => {
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
      const started = await startServicesScan();
      if (!started?.data) return null;
      const sessionId = started.data.id;
      sessionRef.current = sessionId;
      setSession(started.data);
      let current = started.data;
      const deadline = Date.now() + 200000;
      while (mounted.current && sessionRef.current === sessionId && Date.now() < deadline) {
        if (current.status !== 'running') break;
        await sleep(650);
        if (sessionRef.current !== sessionId) break;
        const envelope = await readServicesStatus(sessionId);
        if (!envelope?.data) break;
        current = envelope.data;
        setSession(current);
        if (current.status !== 'running') break;
      }
      if (!mounted.current || sessionRef.current !== sessionId) return current;
      if (current.status === 'complete' || current.status === 'partial') {
        const envelope = await loadServicesSnapshot();
        if (envelope?.data) {
          applySnapshot(envelope.data);
          const unavailable = envelope.data.coverage.filter((stage) => stage.status === 'unavailable').length;
          showNotice(
            current.status === 'partial'
              ? `Service discovery completed partially: ${unavailable} unavailable stage(s), ${envelope.data.warnings.length} warning(s).`
              : `Service discovery complete: ${envelope.data.summary.total} services, ${envelope.data.summary.protected} protected, ${envelope.data.events.length} SCM events.`,
          );
          await refreshJournal();
        }
        return current;
      }
      if (current.status === 'cancelled') showNotice('Service discovery cancelled. No partial register was published.');
      else if (current.status === 'failed') setActionError({ code: 'SERVICES_SCAN_FAILED', message: current.warnings[0] || 'The read-only service discovery failed.' });
      return current;
    } catch (error) {
      setActionError(toActionError(error, 'SERVICES_SCAN_FAILED', 'The read-only service discovery could not start.'));
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
        const capsEnvelope = await loadServicesCapabilities();
        if (cancelled) return;
        if (capsEnvelope?.data) setCapabilities(capsEnvelope.data);
        let snapshotEnvelope = null;
        try {
          snapshotEnvelope = await loadServicesSnapshot();
        } catch (error) {
          const code = error && typeof error === 'object' ? (error as { code?: unknown }).code : null;
          if (code !== 'SERVICES_NOT_MEASURED') throw error;
        }
        if (cancelled) return;
        if (snapshotEnvelope?.data) applySnapshot(snapshotEnvelope.data);
        else if (!autoScanStarted.current) {
          autoScanStarted.current = true;
          void startScan();
        }
      } catch (error) {
        if (!cancelled) setActionError(toActionError(error, 'SERVICES_INIT_FAILED', 'The Service Commander coordinator did not respond.'));
      } finally {
        if (!cancelled && mounted.current) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applySnapshot, nativeAvailable, startScan]);

  const cancelScan = useCallback(async () => {
    const sessionId = sessionRef.current || session?.id;
    if (!sessionId || !scanning) return;
    setCancelling(true);
    try {
      await cancelServicesScan(sessionId);
      sessionRef.current = null;
      if (mounted.current) {
        setSession((current) => (current && current.id === sessionId ? { ...current, status: 'cancelled' } : current));
        showNotice('Cancellation requested. Measured stages stop at the next safe boundary.');
      }
    } catch (error) {
      setActionError(toActionError(error, 'SERVICES_CANCEL_FAILED', 'The service discovery could not be cancelled.'));
    } finally {
      if (mounted.current) setCancelling(false);
    }
  }, [scanning, session?.id, showNotice]);

  const refreshSnapshot = useCallback(async (announce = false) => {
    if (!nativeAvailable) return null;
    setRefreshing(true);
    setActionError(null);
    try {
      const envelope = await loadServicesSnapshot();
      if (envelope?.data) {
        applySnapshot(envelope.data);
        if (announce) showNotice('The measured SCM register was re-read from the native coordinator.');
        return envelope.data;
      }
      return null;
    } catch (error) {
      setActionError(toActionError(error, 'SERVICES_SNAPSHOT_FAILED', 'The measured SCM register could not be read.'));
      return null;
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, [applySnapshot, nativeAvailable, showNotice]);

  const stagePlan = useCallback(async (request: { serviceName: string; action: ServiceAction; startupType?: ServiceStartupType }) => {
    if (!nativeAvailable) return null;
    setBusy('plan');
    setActionError(null);
    try {
      const envelope = await stageServicePlan(request);
      if (envelope?.data) {
        setPlan(envelope.data);
        await refreshJournal();
        showNotice(
          envelope.data.journalRecorded
            ? 'Immutable service preview staged and recorded. No service was changed.'
            : 'Preview staged, but the local journal could not be written.',
        );
        return envelope.data;
      }
      return null;
    } catch (error) {
      setActionError(toActionError(error, 'SERVICES_PLAN_FAILED', 'The immutable service preview could not be staged.'));
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
      const envelope = await loadServicesReport({ redact });
      if (envelope?.data) setReport(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'SERVICES_REPORT_FAILED', 'The measured service report could not be built.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const clearError = useCallback(() => setActionError(null), []);
  const clearNotice = useCallback(() => setNotice(null), []);
  const clearPlan = useCallback(() => setPlan(null), []);

  return {
    nativeAvailable, capabilities, snapshot, session, plan, journal, report,
    loading, scanning, cancelling, refreshing, busy, actionError, notice,
    startScan, cancelScan, refreshSnapshot, refreshJournal, stagePlan, loadReport,
    clearError, clearNotice, clearPlan, showNotice,
  };
}

export type ServicesController = ReturnType<typeof useServices>;
