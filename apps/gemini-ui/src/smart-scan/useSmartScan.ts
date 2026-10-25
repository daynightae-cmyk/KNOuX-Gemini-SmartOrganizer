/**
 * Smart Scan controller — measured only.
 *
 * Loads capabilities, authorized sources, persisted history and a selected
 * session from the read-only native coordinator. Progress is stage-weighted
 * truth from the bridge, with a polling fallback for a dropped event. There is
 * no fixture fallback and no client-side simulated progress.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ScanCapabilities,
  ScanProgressEvent,
  ScanSession,
  ScanStartRequest,
  ScanSummary,
  StudioSource,
} from '../../shared/native-contracts';
import {
  cancelScan,
  chooseScanSource,
  getScanShell,
  indexScanSource,
  loadScanCapabilities,
  loadScanHistory,
  loadScanSession,
  loadScanSources,
  startScan,
  subscribeScanEvents,
} from '../scan/native';
import type { ActiveScanView, ScanStageView } from './smartScan.types';

const TERMINAL_STATUSES = ['complete', 'partial', 'cancelled', 'failed'];

interface ActionError {
  code: string;
  message: string;
}

function envelopeError(envelope: { error?: { code?: string; message?: string } } | null, fallback: string): ActionError {
  return {
    code: envelope?.error?.code || 'SCAN_ACTION_FAILED',
    message: envelope?.error?.message || fallback,
  };
}

function mergeStageViews(previous: ScanStageView[], next: ScanStageView[]): ScanStageView[] {
  const rank: Record<string, number> = {
    pending: 0,
    running: 1,
    complete: 3,
    partial: 3,
    failed: 3,
    skipped: 3,
    unsupported: 3,
    cancelled: 3,
  };
  const byId = new Map(previous.map((stage) => [stage.id, stage]));
  for (const stage of next) {
    const current = byId.get(stage.id);
    if (!current || (rank[stage.status] ?? 0) >= (rank[current.status] ?? 0)) byId.set(stage.id, stage);
  }
  return [...byId.values()];
}

function activeFromSession(session: ScanSession): ActiveScanView {
  return {
    sessionId: session.id,
    mode: session.mode,
    sourceLabel: session.sourceLabel,
    scope: session.scope,
    progressPercent: session.progressPercent,
    status: session.status,
    stages: session.stages.map((stage) => ({
      id: stage.id,
      labelEn: stage.labelEn,
      labelAr: stage.labelAr,
      provider: stage.provider,
      status: stage.status,
      detail: stage.detail,
      durationMs: stage.durationMs,
      errorCode: stage.error?.code || null,
    })),
    startedAt: session.startedAt,
  };
}

export function useSmartScan() {
  const nativeAvailable = useMemo(() => Boolean(getScanShell()), []);
  const [capabilities, setCapabilities] = useState<ScanCapabilities | null>(null);
  const [sources, setSources] = useState<StudioSource[]>([]);
  const [history, setHistory] = useState<ScanSummary[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [session, setSession] = useState<ScanSession | null>(null);
  const [active, setActive] = useState<ActiveScanView | null>(null);
  const [loading, setLoading] = useState(nativeAvailable);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<ActionError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const settled = useRef(new Set<string>());
  const activeRef = useRef<ActiveScanView | null>(null);
  activeRef.current = active;

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 4200);
  }, []);

  const applyHistory = useCallback((entries: ScanSummary[]) => {
    setHistory(entries);
  }, []);

  const refreshHistory = useCallback(async () => {
    const envelope = await loadScanHistory();
    if (envelope?.data) applyHistory(envelope.data);
    return envelope?.data || [];
  }, [applyHistory]);

  const refreshSources = useCallback(async () => {
    const envelope = await loadScanSources();
    if (!envelope) return null;
    const entries = envelope.data;
    if (envelope.status !== 'complete' || !Array.isArray(entries)) {
      setActionError(envelopeError(envelope, 'Authorized sources could not be read.'));
      return envelope;
    }
    setSources(entries);
    setSelectedSourceId((current) => {
      if (current && entries.some((source) => source.id === current)) return current;
      const ready = entries.find((source) => source.status === 'ready' && source.fileCount > 0);
      return ready?.id || entries[0]?.id || null;
    });
    return envelope;
  }, []);

  const loadSession = useCallback(async (sessionId: string, options: { historical?: boolean } = {}) => {
    const envelope = await loadScanSession(sessionId);
    if (!envelope || envelope.status !== 'complete' || !envelope.data) {
      const error = envelopeError(envelope, 'The scan session could not be read.');
      setActionError(error);
      return null;
    }
    setSession(envelope.data);
    if (TERMINAL_STATUSES.includes(envelope.data.status)) {
      settled.current.add(sessionId);
      setActive((current) => (current?.sessionId === sessionId ? null : current));
    } else {
      setActive(activeFromSession(envelope.data));
    }
    if (!options.historical) await refreshHistory();
    return envelope.data;
  }, [refreshHistory]);

  const settleSession = useCallback(async (sessionId: string) => {
    if (settled.current.has(sessionId)) return;
    settled.current.add(sessionId);
    const envelope = await loadScanSession(sessionId);
    if (envelope?.status === 'complete' && envelope.data) {
      setSession(envelope.data);
      setActive((current) => (current?.sessionId === sessionId ? null : current));
    } else if (envelope) {
      setActionError(envelopeError(envelope, 'The completed scan could not be reloaded.'));
    }
    await refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    if (!nativeAvailable) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [caps, sourceEnvelope, historyEnvelope] = await Promise.all([
          loadScanCapabilities(),
          loadScanSources(),
          loadScanHistory(),
        ]);
        if (cancelled) return;
        if (caps?.status === 'complete' && caps.data) setCapabilities(caps.data);
        else if (caps) setActionError(envelopeError(caps, 'Smart Scan capabilities could not be read.'));

        if (sourceEnvelope?.status === 'complete' && Array.isArray(sourceEnvelope.data)) {
          setSources(sourceEnvelope.data);
          const ready = sourceEnvelope.data.find((source) => source.status === 'ready' && source.fileCount > 0);
          setSelectedSourceId(ready?.id || sourceEnvelope.data[0]?.id || null);
        } else if (sourceEnvelope) {
          setActionError(envelopeError(sourceEnvelope, 'Authorized sources could not be read.'));
        }

        if (historyEnvelope?.status === 'complete' && Array.isArray(historyEnvelope.data)) {
          setHistory(historyEnvelope.data);
          const latest = historyEnvelope.data[0];
          if (latest) {
            const loaded = await loadScanSession(latest.id);
            if (!cancelled && loaded?.status === 'complete' && loaded.data) setSession(loaded.data);
          }
        } else if (historyEnvelope) {
          setActionError(envelopeError(historyEnvelope, 'Scan history could not be read.'));
        }
      } catch (error) {
        if (!cancelled) {
          setActionError({ code: 'SCAN_RENDERER_FAILED', message: error instanceof Error ? error.message : 'Smart Scan could not initialize.' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nativeAvailable]);

  useEffect(() => {
    if (!nativeAvailable) return undefined;
    const unsubscribe = subscribeScanEvents((event: ScanProgressEvent) => {
      if (event.type === 'scan-started' && event.sessionId) {
        settled.current.delete(event.sessionId);
        setActive((current) => current?.sessionId === event.sessionId ? current : {
          sessionId: event.sessionId,
          mode: event.mode || 'custom',
          sourceLabel: null,
          scope: 'authorized-folder',
          progressPercent: 0,
          status: 'starting',
          stages: [],
          startedAt: event.at,
        });
      }
      if (event.type === 'scan-stage' && event.stage) {
        setActive((current) => {
          if (!current || current.sessionId !== event.sessionId) return current;
          const stage: ScanStageView = {
            id: event.stage!.id,
            labelEn: event.stage!.labelEn,
            labelAr: event.stage!.labelAr,
            provider: event.stage!.provider,
            status: event.stage!.status,
            detail: event.stage!.detail,
            durationMs: event.stage!.durationMs,
            errorCode: event.stage!.error?.code || null,
          };
          return {
            ...current,
            status: 'running',
            progressPercent: event.progressPercent ?? current.progressPercent,
            stages: mergeStageViews(current.stages, [stage]),
          };
        });
      }
      if (['scan-complete', 'scan-cancelled', 'scan-failed'].includes(event.type)) {
        void settleSession(event.sessionId);
      }
    });
    return unsubscribe;
  }, [nativeAvailable, settleSession]);

  // Polling fallback: events are ordered, but a long Windows provider stage can
  // outlive a renderer reload. This reads the same measured session, never a
  // fabricated progress value.
  useEffect(() => {
    if (!active || TERMINAL_STATUSES.includes(active.status)) return undefined;
    const sessionId = active.sessionId;
    const timer = window.setInterval(async () => {
      const envelope = await loadScanSession(sessionId);
      if (!envelope || envelope.status !== 'complete' || !envelope.data) return;
      const data = envelope.data;
      if (TERMINAL_STATUSES.includes(data.status)) {
        void settleSession(sessionId);
      } else {
        setActive((current) => current?.sessionId === sessionId ? activeFromSession(data) : current);
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [active?.sessionId, active?.status, settleSession]);

  const authorizeSource = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    try {
      const envelope = await chooseScanSource();
      if (!envelope) return;
      if (envelope.status === 'complete' && envelope.data) {
        await refreshSources();
        setSelectedSourceId(envelope.data.id);
        showNotice(`Authorized ${envelope.data.label}.`);
      } else if (envelope.status !== 'cancelled') {
        setActionError(envelopeError(envelope, 'The folder could not be authorized.'));
      }
    } finally {
      setBusy(false);
    }
  }, [refreshSources, showNotice]);

  const indexSource = useCallback(async (sourceId: string) => {
    setBusy(true);
    setActionError(null);
    try {
      const envelope = await indexScanSource(sourceId);
      if (!envelope) return;
      if (envelope.status === 'complete' && envelope.data) {
        await refreshSources();
        showNotice(`Indexed ${envelope.data.fileCount.toLocaleString()} file(s) read-only.`);
      } else {
        setActionError(envelopeError(envelope, 'The source could not be indexed.'));
      }
    } finally {
      setBusy(false);
    }
  }, [refreshSources, showNotice]);

  const runScan = useCallback(async (
    request: Pick<ScanStartRequest, 'mode' | 'services'> & { requiresSource?: boolean; options?: ScanStartRequest['options'] }
  ) => {
    setActionError(null);
    const needsSource = request.requiresSource !== false;
    const source = sources.find((entry) => entry.id === selectedSourceId) || null;
    if (needsSource) {
      if (!source) {
        setActionError({ code: 'SCAN_SOURCE_REQUIRED', message: 'Authorize a folder before this measured scan.' });
        return null;
      }
      if (source.status !== 'ready' || source.fileCount === 0) {
        setActionError({ code: 'SCAN_SOURCE_UNINDEXED', message: 'Index the authorized folder before scanning it.' });
        return null;
      }
    }
    setBusy(true);
    try {
      const envelope = await startScan({
        mode: request.mode,
        services: request.services,
        sourceId: needsSource ? source?.id : undefined,
        options: request.options,
      });
      if (!envelope) return null;
      if (envelope.status !== 'complete' || !envelope.data) {
        const error = envelopeError(envelope, 'The measured scan could not start.');
        setActionError(error);
        return null;
      }
      const started = envelope.data;
      settled.current.delete(started.sessionId);
      const nowActive: ActiveScanView = {
        sessionId: started.sessionId,
        mode: started.mode,
        sourceLabel: started.sourceLabel,
        scope: started.scope,
        progressPercent: 0,
        status: 'running',
        stages: started.stages.map((stage) => ({
          id: stage.id,
          labelEn: stage.labelEn,
          labelAr: stage.labelAr,
          provider: stage.provider,
          status: stage.status,
          detail: stage.detail,
          durationMs: stage.durationMs,
          errorCode: stage.error?.code || null,
        })),
        startedAt: started.startedAt,
      };
      setActive((current) => {
        if (current?.sessionId === started.sessionId) {
          return { ...current, ...nowActive, progressPercent: Math.max(current.progressPercent, nowActive.progressPercent), stages: mergeStageViews(current.stages, nowActive.stages) };
        }
        return nowActive;
      });
      return started.sessionId;
    } catch (error) {
      setActionError({ code: 'SCAN_START_FAILED', message: error instanceof Error ? error.message : 'The measured scan could not start.' });
      return null;
    } finally {
      setBusy(false);
    }
  }, [selectedSourceId, sources]);

  const cancelActive = useCallback(async () => {
    if (!active) return;
    setBusy(true);
    try {
      const envelope = await cancelScan(active.sessionId);
      if (envelope?.status === 'complete' && envelope.data?.cancelled) {
        showNotice(envelope.data.note);
      } else if (envelope) {
        setActionError(envelopeError(envelope, 'Cancellation could not be requested.'));
      }
    } finally {
      setBusy(false);
    }
  }, [active, showNotice]);

  const selectHistory = useCallback(async (sessionId: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await loadSession(sessionId, { historical: true });
    } finally {
      setBusy(false);
    }
  }, [loadSession]);

  const selectedSource = sources.find((source) => source.id === selectedSourceId) || null;

  return {
    nativeAvailable,
    capabilities,
    sources,
    selectedSourceId,
    selectedSource,
    setSelectedSourceId,
    history,
    session,
    active,
    loading,
    busy,
    actionError,
    notice,
    clearError: () => setActionError(null),
    clearNotice: () => setNotice(null),
    authorizeSource,
    indexSource,
    runScan,
    cancelActive,
    selectHistory,
    refreshSources,
    refreshHistory,
    loadSession,
    showNotice,
  };
}
