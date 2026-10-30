/**
 * Live Pulse controller - measured only (Mission 10).
 *
 * Every number rendered by the observatory comes from the read-only System
 * coordinator. There is no fixture fallback: in a browser preview the hook
 * reports `nativeAvailable: false` and the page states that native measurement
 * is required. No process, service, driver, socket, proxy, hosts file, adapter,
 * repair or power mutation exists in this controller.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  HostsDraft,
  HostsPlan,
  SystemCapabilities,
  SystemDiagnosticResult,
  SystemDiagnosticType,
  SystemEventQuery,
  SystemEventsResult,
  SystemMetrics,
  SystemReport,
  SystemSession,
  SystemSignatureResult,
  SystemSnapshot,
  SystemTracerouteResult,
} from '../../shared/native-contracts';
import {
  cancelSystemScan,
  getSystemShell,
  loadSystemCapabilities,
  loadSystemReport,
  loadSystemSnapshot,
  openSystemSettings,
  querySystemEvents,
  readSystemSample,
  readSystemStatus,
  runSystemDiagnostic,
  runSystemTraceroute,
  stageHostsPlan,
  startSystemScan,
  verifySystemSignatures,
} from './native';
import type { SystemLocale } from './catalog';
import { t } from './model';

export interface SystemActionError {
  code: string;
  message: string;
}function toActionError(error: unknown, fallbackCode: string, fallbackMessage: string): SystemActionError {
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
const MAX_SERIES = 120;

export function useSystem(locale: SystemLocale = 'en') {
  const nativeAvailable = useMemo(() => Boolean(getSystemShell()), []);
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [session, setSession] = useState<SystemSession | null>(null);
  const [series, setSeries] = useState<SystemMetrics[]>([]);
  const [eventsResult, setEventsResult] = useState<SystemEventsResult | null>(null);
  const [signatureResult, setSignatureResult] = useState<SystemSignatureResult | null>(null);
  const [diagnostic, setDiagnostic] = useState<SystemDiagnosticResult | null>(null);
  const [traceroute, setTraceroute] = useState<SystemTracerouteResult | null>(null);
  const [hostsPlan, setHostsPlan] = useState<HostsPlan | null>(null);
  const [report, setReport] = useState<SystemReport | null>(null);

  const [loading, setLoading] = useState(nativeAvailable);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [sampling, setSampling] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<SystemActionError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sampleIntervalMs, setSampleIntervalMs] = useState(5000);
  const [samplingPaused, setSamplingPaused] = useState(false);
  const [lastSampleAt, setLastSampleAt] = useState<string | null>(null);

  const sessionRef = useRef<string | null>(null);
  const autoScanStarted = useRef(false);
  const sampledOnce = useRef(false);
  const samplingRef = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 5200);
  }, []);

  const applySnapshot = useCallback((next: SystemSnapshot) => {
    setSnapshot(next);
    setSeries([next.metrics]);
    setLastSampleAt(next.metrics.timestamp || next.generatedAt);
  }, []);

  const queryEvents = useCallback(async (query: SystemEventQuery = {}): Promise<SystemEventsResult | null> => {
    if (!nativeAvailable) return null;
    setBusy('events');
    try {
      const envelope = await querySystemEvents(query);
      if (envelope?.data) {
        setEventsResult(envelope.data);
        return envelope.data;
      }
      return null;
    } catch (error) {
      setActionError(toActionError(error, 'SYSTEM_EVENTS_FAILED', 'The measured event query failed.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const startScan = useCallback(async () => {
    if (!nativeAvailable) return null;
    setScanning(true);
    setCancelling(false);
    setActionError(null);
    try {
      const started = await startSystemScan();
      if (!started?.data) return null;
      const sessionId = started.data.id;
      sessionRef.current = sessionId;
      setSession(started.data);
      let current = started.data;
      const deadline = Date.now() + 190000;
      while (mounted.current && sessionRef.current === sessionId && Date.now() < deadline) {
        if (current.status !== 'running') break;
        await sleep(700);
        if (sessionRef.current !== sessionId) break;
        const envelope = await readSystemStatus(sessionId);
        if (!envelope?.data) break;
        current = envelope.data;
        setSession(current);
        if (current.status !== 'running') break;
      }
      if (!mounted.current || sessionRef.current !== sessionId) return current;
      if (current.status === 'complete' || current.status === 'partial') {
        const envelope = await loadSystemSnapshot();
        if (envelope?.data) {
          applySnapshot(envelope.data);
          const failedStages = envelope.data.coverage.filter((stage) => stage.status === 'unavailable').length;
          showNotice(
            current.status === 'partial'
              ? t(
                  locale,
                  `Measured observatory completed partially: ${envelope.data.processCount} process(es), ${failedStages} unavailable stage(s), ${envelope.data.warnings.length} warning(s).`,
                  `اكتمل المرصد المقيس جزئيًا: ${envelope.data.processCount} عملية، ${failedStages} مرحلة غير متاحة، ${envelope.data.warnings.length} تحذير.`,
                )
              : t(
                  locale,
                  `Measured observatory complete: ${envelope.data.processCount} process(es), ${envelope.data.services.length} service(s), ${envelope.data.events.length} event(s).`,
                  `اكتمل المرصد المقيس: ${envelope.data.processCount} عملية، ${envelope.data.services.length} خدمة، ${envelope.data.events.length} حدث.`,
                ),
          );
          void queryEvents({ limit: 100 });
        }
        return current;
      }
      if (current.status === 'cancelled') {
        showNotice(t(locale, 'Observatory scan cancelled. No partial snapshot was published.', 'أُلغي مسح المرصد. لم تُنشر أي لقطة جزئية.'));
      } else if (current.status === 'failed') {
        setActionError({
          code: 'SYSTEM_SCAN_FAILED',
          message: current.warnings[0] || 'The measured observatory session failed.',
        });
      }
      return current;
    } catch (error) {
      setActionError(toActionError(error, 'SYSTEM_SCAN_FAILED', 'The measured observatory session could not start.'));
      return null;
    } finally {
      if (mounted.current) {
        setScanning(false);
        setCancelling(false);
        sessionRef.current = null;
      }
    }
  }, [applySnapshot, locale, nativeAvailable, queryEvents, showNotice]);

  useEffect(() => {
    if (!nativeAvailable) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const capsEnvelope = await loadSystemCapabilities();
        if (cancelled) return;
        if (capsEnvelope?.data) setCapabilities(capsEnvelope.data);
        let snapshotEnvelope = null;
        try {
          snapshotEnvelope = await loadSystemSnapshot();
        } catch (error) {
          // The first visit has no snapshot yet; that is the normal state that
          // starts the bounded scan below, not an initialization failure.
          const code = error && typeof error === 'object' ? (error as { code?: unknown }).code : null;
          if (code !== 'SYSTEM_NOT_MEASURED') throw error;
        }
        if (cancelled) return;
        if (snapshotEnvelope?.data) {
          applySnapshot(snapshotEnvelope.data);
          void queryEvents({ limit: 100 });
        } else if (!autoScanStarted.current) {
          autoScanStarted.current = true;
          void startScan();
        }
      } catch (error) {
        if (!cancelled) {
          setActionError(toActionError(error, 'SYSTEM_INIT_FAILED', 'The Live Pulse coordinator did not respond.'));
        }
      } finally {
        if (!cancelled && mounted.current) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySnapshot, nativeAvailable, queryEvents, startScan]);

  const cancelScan = useCallback(async () => {
    const sessionId = sessionRef.current || session?.id;
    if (!sessionId || !scanning) return;
    setCancelling(true);
    try {
      await cancelSystemScan(sessionId);
      sessionRef.current = null;
      if (mounted.current) {
        setSession((current) => (current && current.id === sessionId ? { ...current, status: 'cancelled' } : current));
        showNotice(t(locale, 'Cancellation requested. Measured stages stop at the next safe boundary.', 'طُلب الإلغاء. تتوقف المراحل المقيسة عند أقرب حد آمن.'));
      }
    } catch (error) {
      setActionError(toActionError(error, 'SYSTEM_CANCEL_FAILED', 'The observatory session could not be cancelled.'));
    } finally {
      if (mounted.current) setCancelling(false);
    }
  }, [locale, scanning, session?.id, showNotice]);

  const refreshSnapshot = useCallback(async (announce = false) => {
    if (!nativeAvailable) return null;
    setRefreshing(true);
    setActionError(null);
    try {
      const envelope = await loadSystemSnapshot();
      if (envelope?.data) {
        applySnapshot(envelope.data);
        if (announce) showNotice(t(locale, 'The measured snapshot was re-read from the native coordinator.', 'أُعيدت قراءة اللقطة المقيسة من المنسّق الأصلي.'));
        return envelope.data;
      }
      return null;
    } catch (error) {
      setActionError(toActionError(error, 'SYSTEM_SNAPSHOT_FAILED', 'The measured snapshot could not be read.'));
      return null;
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, [applySnapshot, locale, nativeAvailable, showNotice]);

  const sampleNow = useCallback(async (silent = false) => {
    if (!nativeAvailable || samplingRef.current) return null;
    samplingRef.current = true;
    setSampling(true);
    try {
      const envelope = await readSystemSample();
      if (!envelope?.data) return null;
      const metrics = envelope.data;
      if (mounted.current) {
        setSeries((current) => [...current.slice(-(MAX_SERIES - 1)), metrics]);
        setLastSampleAt(metrics.timestamp || new Date().toISOString());
        sampledOnce.current = true;
      }
      return metrics;
    } catch (error) {
      if (!silent) {
        setActionError(toActionError(error, 'SYSTEM_SAMPLE_FAILED', 'The performance counter sample failed.'));
      }
      return null;
    } finally {
      samplingRef.current = false;
      if (mounted.current) setSampling(false);
    }
  }, [nativeAvailable]);

  useEffect(() => {
    if (!nativeAvailable || !snapshot || samplingPaused) return;
    const timer = window.setInterval(() => {
      void sampleNow(true);
    }, Math.max(1000, sampleIntervalMs));
    return () => window.clearInterval(timer);
  }, [nativeAvailable, sampleIntervalMs, sampleNow, samplingPaused, snapshot]);

  const verifySignatures = useCallback(async (paths: string[]) => {
    if (!nativeAvailable) return null;
    const unique = [...new Set(paths.map((entry) => entry.trim()).filter(Boolean))].slice(0, 24);
    if (!unique.length) {
      setActionError({ code: 'SYSTEM_SIGNATURE_INPUT_INVALID', message: 'Select at least one measured executable path first.' });
      return null;
    }
    setBusy('signatures');
    setActionError(null);
    try {
      const envelope = await verifySystemSignatures(unique);
      if (envelope?.data) setSignatureResult(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'SYSTEM_SIGNATURE_FAILED', 'Authenticode verification failed.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const diagnose = useCallback(async (type: SystemDiagnosticType, target: string, port?: number) => {
    if (!nativeAvailable) return null;
    setBusy('diagnostics');
    setActionError(null);
    try {
      const envelope = await runSystemDiagnostic({ type, target, ...(port == null ? {} : { port }) });
      if (envelope?.data) setDiagnostic(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'SYSTEM_DIAGNOSTIC_FAILED', 'The bounded network diagnostic failed.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const traceRoute = useCallback(async (target: string, maxHops?: number) => {
    if (!nativeAvailable) return null;
    setBusy('traceroute');
    setActionError(null);
    try {
      const envelope = await runSystemTraceroute({ target, ...(maxHops == null ? {} : { maxHops }) });
      if (envelope?.data) setTraceroute(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'SYSTEM_TRACEROUTE_FAILED', 'The bounded hop trace failed.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const stageHosts = useCallback(async (draft: HostsDraft) => {
    if (!nativeAvailable) return null;
    setBusy('hosts');
    setActionError(null);
    try {
      const envelope = await stageHostsPlan(draft);
      if (envelope?.data) setHostsPlan(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'SYSTEM_HOSTS_PLAN_FAILED', 'The immutable hosts preview could not be staged.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const loadReport = useCallback(async (redact: boolean) => {
    if (!nativeAvailable) return null;
    setBusy('report');
    setActionError(null);
    try {
      const envelope = await loadSystemReport({ redact });
      if (envelope?.data) setReport(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'SYSTEM_REPORT_FAILED', 'The measured hardware report could not be built.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const openSettings = useCallback(async (target: 'display' | 'network' | 'wifi' | 'sound') => {
    if (!nativeAvailable) return;
    setBusy('settings');
    setActionError(null);
    try {
      const envelope = await openSystemSettings(target);
      if (envelope?.data?.opened) {
        showNotice(t(locale, `Windows Settings opened at the supported ${target} handoff.`, `فُتحت إعدادات Windows عند انتقال ${target} المدعوم.`));
      }
    } catch (error) {
      setActionError(toActionError(error, 'SYSTEM_SETTINGS_FAILED', 'The Windows Settings handoff failed.'));
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [locale, nativeAvailable, showNotice]);

  const clearError = useCallback(() => setActionError(null), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  return {
    nativeAvailable,
    capabilities,
    snapshot,
    session,
    series,
    eventsResult,
    signatureResult,
    diagnostic,
    traceroute,
    hostsPlan,
    report,
    loading,
    refreshing,
    scanning,
    cancelling,
    sampling,
    sampledOnce: sampledOnce.current,
    busy,
    actionError,
    notice,
    sampleIntervalMs,
    samplingPaused,
    lastSampleAt,
    setSampleInterval: setSampleIntervalMs,
    setSamplingPaused,
    startScan,
    cancelScan,
    refreshSnapshot,
    sampleNow,
    queryEvents,
    verifySignatures,
    diagnose,
    traceRoute,
    stageHosts,
    loadReport,
    openSettings,
    clearError,
    clearNotice,
    showNotice,
  };
}

export type SystemController = ReturnType<typeof useSystem>;
