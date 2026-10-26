/**
 * Flow Studio controller - local drafts, dry-runs and schedule previews only.
 * No workflow executor or background scheduler exists.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AutomationCapabilities,
  AutomationDryRunResult,
  AutomationImportValidation,
  AutomationJournalEntry,
  AutomationReport,
  AutomationSchedulePreview,
  AutomationScheduleSpec,
  AutomationSession,
  AutomationSnapshot,
  AutomationTemplate,
  AutomationWorkflow,
} from '../../shared/native-contracts';
import {
  cancelAutomationScan,
  dryRunAutomation,
  getAutomationShell,
  loadAutomationCapabilities,
  loadAutomationJournal,
  loadAutomationReport,
  loadAutomationSnapshot,
  loadAutomationTemplates,
  loadAutomationWorkflows,
  previewAutomationSchedule,
  readAutomationStatus,
  saveAutomationWorkflow,
  startAutomationScan,
  validateAutomationImport,
} from './native';

export interface AutomationActionError { code: string; message: string }

function toActionError(error: unknown, code: string, message: string): AutomationActionError {
  if (error && typeof error === 'object') {
    const candidate = error as { code?: unknown; message?: unknown };
    return { code: typeof candidate.code === 'string' ? candidate.code : code, message: typeof candidate.message === 'string' ? candidate.message : message };
  }
  return { code, message };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useAutomation() {
  const nativeAvailable = useMemo(() => Boolean(getAutomationShell()), []);
  const [capabilities, setCapabilities] = useState<AutomationCapabilities | null>(null);
  const [snapshot, setSnapshot] = useState<AutomationSnapshot | null>(null);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [journal, setJournal] = useState<AutomationJournalEntry[]>([]);
  const [session, setSession] = useState<AutomationSession | null>(null);
  const [dryRunResult, setDryRunResult] = useState<AutomationDryRunResult | null>(null);
  const [schedulePreview, setSchedulePreview] = useState<AutomationSchedulePreview | null>(null);
  const [importValidation, setImportValidation] = useState<AutomationImportValidation | null>(null);
  const [report, setReport] = useState<AutomationReport | null>(null);
  const [loading, setLoading] = useState(nativeAvailable);
  const [scanning, setScanning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<AutomationActionError | null>(null);
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

  const applySnapshot = useCallback((next: AutomationSnapshot) => {
    setSnapshot(next);
    setWorkflows(next.workflows);
    setTemplates(next.templates);
    setJournal(next.journal);
  }, []);

  const refreshJournal = useCallback(async () => {
    if (!nativeAvailable) return [];
    try {
      const envelope = await loadAutomationJournal();
      const entries = envelope?.data || [];
      if (mounted.current) setJournal(entries);
      return entries;
    } catch (error) {
      if (mounted.current) setActionError(toActionError(error, 'AUTOMATION_JOURNAL_FAILED', 'The dry-run journal could not be read.'));
      return [];
    }
  }, [nativeAvailable]);

  const startScan = useCallback(async () => {
    if (!nativeAvailable) return null;
    setScanning(true);
    setCancelling(false);
    setActionError(null);
    try {
      const started = await startAutomationScan();
      if (!started?.data) return null;
      const sessionId = started.data.id;
      sessionRef.current = sessionId;
      setSession(started.data);
      let current = started.data;
      const deadline = Date.now() + 90000;
      while (mounted.current && sessionRef.current === sessionId && Date.now() < deadline) {
        if (current.status !== 'running') break;
        await sleep(500);
        if (sessionRef.current !== sessionId) break;
        const envelope = await readAutomationStatus(sessionId);
        if (!envelope?.data) break;
        current = envelope.data;
        setSession(current);
        if (current.status !== 'running') break;
      }
      if (!mounted.current || sessionRef.current !== sessionId) return current;
      if (current.status === 'complete' || current.status === 'partial') {
        const envelope = await loadAutomationSnapshot();
        if (envelope?.data) {
          applySnapshot(envelope.data);
          showNotice(
            current.status === 'partial'
              ? `Flow Studio discovery completed partially: ${envelope.data.warnings.length} warning(s).`
              : `Flow Studio ready: ${envelope.data.workflows.length} local workflow(s), ${envelope.data.templates.length} template(s), ${envelope.data.journal.length} dry-run(s).`,
          );
        }
        return current;
      }
      if (current.status === 'cancelled') showNotice('Flow Studio discovery cancelled.');
      else if (current.status === 'failed') setActionError({ code: 'AUTOMATION_SCAN_FAILED', message: current.warnings[0] || 'Flow Studio discovery failed.' });
      return current;
    } catch (error) {
      setActionError(toActionError(error, 'AUTOMATION_SCAN_FAILED', 'Flow Studio discovery could not start.'));
      return null;
    } finally {
      if (mounted.current) {
        setScanning(false);
        setCancelling(false);
        sessionRef.current = null;
      }
    }
  }, [applySnapshot, nativeAvailable, showNotice]);

  useEffect(() => {
    if (!nativeAvailable) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const capsEnvelope = await loadAutomationCapabilities();
        if (cancelled) return;
        if (capsEnvelope?.data) setCapabilities(capsEnvelope.data);
        let snapshotEnvelope = null;
        try {
          snapshotEnvelope = await loadAutomationSnapshot();
        } catch (error) {
          const code = error && typeof error === 'object' ? (error as { code?: unknown }).code : null;
          if (code !== 'AUTOMATION_NOT_MEASURED') throw error;
        }
        if (cancelled) return;
        if (snapshotEnvelope?.data) applySnapshot(snapshotEnvelope.data);
        else if (!autoScanStarted.current) {
          autoScanStarted.current = true;
          void startScan();
        }
      } catch (error) {
        if (!cancelled) setActionError(toActionError(error, 'AUTOMATION_INIT_FAILED', 'The Flow Studio coordinator did not respond.'));
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
      await cancelAutomationScan(sessionId);
      sessionRef.current = null;
      if (mounted.current) {
        setSession((current) => (current && current.id === sessionId ? { ...current, status: 'cancelled' } : current));
        showNotice('Cancellation requested. Measured stages stop at the next safe boundary.');
      }
    } catch (error) {
      setActionError(toActionError(error, 'AUTOMATION_CANCEL_FAILED', 'Flow Studio discovery could not be cancelled.'));
    } finally {
      if (mounted.current) setCancelling(false);
    }
  }, [scanning, session?.id, showNotice]);

  const refreshSnapshot = useCallback(async (announce = false) => {
    if (!nativeAvailable) return null;
    setRefreshing(true);
    setActionError(null);
    try {
      const envelope = await loadAutomationSnapshot();
      if (envelope?.data) {
        applySnapshot(envelope.data);
        if (announce) showNotice('Flow Studio evidence was re-read from the native coordinator.');
        return envelope.data;
      }
      return null;
    } catch (error) {
      setActionError(toActionError(error, 'AUTOMATION_SNAPSHOT_FAILED', 'Flow Studio evidence could not be read.'));
      return null;
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, [applySnapshot, nativeAvailable, showNotice]);

  const saveWorkflow = useCallback(async (workflow: AutomationWorkflow) => {
    if (!nativeAvailable) return null;
    setBusy('save');
    setActionError(null);
    try {
      const envelope = await saveAutomationWorkflow(workflow);
      if (envelope?.data) {
        const saved = envelope.data;
        setWorkflows((current) => [saved, ...current.filter((entry) => entry.id !== saved.id)]);
        if (mounted.current) await refreshSnapshot(false);
        showNotice(`Workflow saved locally as version ${saved.version}. Nothing was executed.`);
        return saved;
      }
      return null;
    } catch (error) {
      setActionError(toActionError(error, 'AUTOMATION_SAVE_FAILED', 'The workflow draft could not be saved.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable, refreshSnapshot, showNotice]);

  const dryRun = useCallback(async (workflow: AutomationWorkflow) => {
    if (!nativeAvailable) return null;
    setBusy('dry-run');
    setActionError(null);
    try {
      const envelope = await dryRunAutomation(workflow);
      if (envelope?.data) {
        setDryRunResult(envelope.data);
        await refreshJournal();
        showNotice('Deterministic dry-run complete. No workflow action was executed.');
        return envelope.data;
      }
      return null;
    } catch (error) {
      setActionError(toActionError(error, 'AUTOMATION_DRYRUN_FAILED', 'The workflow dry-run could not be completed.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable, refreshJournal, showNotice]);

  const previewSchedule = useCallback(async (spec: AutomationScheduleSpec) => {
    if (!nativeAvailable) return null;
    setBusy('schedule');
    setActionError(null);
    try {
      const envelope = await previewAutomationSchedule(spec);
      if (envelope?.data) {
        setSchedulePreview(envelope.data);
        return envelope.data;
      }
      return null;
    } catch (error) {
      setActionError(toActionError(error, 'AUTOMATION_SCHEDULE_FAILED', 'The schedule preview could not be computed.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const validateImport = useCallback(async (payload: unknown) => {
    if (!nativeAvailable) return null;
    setBusy('import');
    setActionError(null);
    try {
      const envelope = await validateAutomationImport(payload);
      if (envelope?.data) {
        setImportValidation(envelope.data);
        return envelope.data;
      }
      return null;
    } catch (error) {
      setActionError(toActionError(error, 'AUTOMATION_IMPORT_FAILED', 'The workflow import could not be validated.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const loadReport = useCallback(async (redact = true) => {
    if (!nativeAvailable) return null;
    setBusy('report');
    setActionError(null);
    try {
      const envelope = await loadAutomationReport({ redact });
      if (envelope?.data) setReport(envelope.data);
      return envelope?.data || null;
    } catch (error) {
      setActionError(toActionError(error, 'AUTOMATION_REPORT_FAILED', 'The Flow Studio report could not be built.'));
      return null;
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, [nativeAvailable]);

  const clearError = useCallback(() => setActionError(null), []);
  const clearNotice = useCallback(() => setNotice(null), []);
  const clearDryRun = useCallback(() => setDryRunResult(null), []);
  const clearSchedule = useCallback(() => setSchedulePreview(null), []);
  const clearValidation = useCallback(() => setImportValidation(null), []);

  return {
    nativeAvailable, capabilities, snapshot, workflows, templates, journal, session,
    dryRunResult, schedulePreview, importValidation, report,
    loading, scanning, cancelling, refreshing, busy, actionError, notice,
    startScan, cancelScan, refreshSnapshot, refreshJournal, saveWorkflow, dryRun,
    previewSchedule, validateImport, loadReport,
    clearError, clearNotice, clearDryRun, clearSchedule, clearValidation, showNotice,
  };
}

export type AutomationController = ReturnType<typeof useAutomation>;
