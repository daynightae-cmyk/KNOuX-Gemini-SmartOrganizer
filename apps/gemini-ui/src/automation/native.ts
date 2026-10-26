/**
 * Typed renderer access to Flow Studio (Mission 13).
 */
import {
  NATIVE_CONTRACT_VERSION,
  type AutomationCapabilities,
  type AutomationDryRunResult,
  type AutomationImportValidation,
  type AutomationJournalEntry,
  type AutomationReport,
  type AutomationSchedulePreview,
  type AutomationScheduleSpec,
  type AutomationSession,
  type AutomationShellApi,
  type AutomationSnapshot,
  type AutomationTemplate,
  type AutomationWorkflow,
  type NativeEnvelope,
} from '../../shared/native-contracts';

declare global {
  interface Window {
    knouxAutomationV1?: AutomationShellApi;
  }
}

export function getAutomationShell(): AutomationShellApi | null {
  if (typeof window === 'undefined') return null;
  const candidate = window.knouxAutomationV1;
  if (!candidate || candidate.contractVersion !== NATIVE_CONTRACT_VERSION) return null;
  return candidate;
}

function assertEnvelope<T>(envelope: NativeEnvelope<T> | undefined, capability: string): NativeEnvelope<T> {
  if (!envelope || envelope.contractVersion !== NATIVE_CONTRACT_VERSION || envelope.capability !== capability) {
    throw new Error(`The Flow Studio ${capability} response did not match contract v${NATIVE_CONTRACT_VERSION}.`);
  }
  if (envelope.error) throw Object.assign(new Error(envelope.error.message), { code: envelope.error.code });
  return envelope;
}

export async function loadAutomationCapabilities(): Promise<NativeEnvelope<AutomationCapabilities> | null> {
  const api = getAutomationShell();
  if (!api) return null;
  return assertEnvelope(await api.capabilities(), 'automation.capabilities');
}

export async function startAutomationScan(): Promise<NativeEnvelope<AutomationSession> | null> {
  const api = getAutomationShell();
  if (!api) return null;
  return assertEnvelope(await api.start(), 'automation.start');
}

export async function readAutomationStatus(sessionId: string): Promise<NativeEnvelope<AutomationSession> | null> {
  const api = getAutomationShell();
  if (!api) return null;
  return assertEnvelope(await api.status(sessionId), 'automation.status');
}

export async function cancelAutomationScan(sessionId: string): Promise<void> {
  const api = getAutomationShell();
  if (!api) return;
  await assertEnvelope(await api.cancel(sessionId), 'automation.cancel');
}

export async function loadAutomationSnapshot(): Promise<NativeEnvelope<AutomationSnapshot> | null> {
  const api = getAutomationShell();
  if (!api) return null;
  return assertEnvelope(await api.snapshot(), 'automation.snapshot');
}

export async function loadAutomationWorkflows(): Promise<NativeEnvelope<AutomationWorkflow[]> | null> {
  const api = getAutomationShell();
  if (!api) return null;
  return assertEnvelope(await api.workflows(), 'automation.workflows');
}

export async function saveAutomationWorkflow(workflow: AutomationWorkflow | Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<NativeEnvelope<AutomationWorkflow> | null> {
  const api = getAutomationShell();
  if (!api) return null;
  return assertEnvelope(await api.save(workflow), 'automation.save');
}

export async function loadAutomationTemplates(): Promise<NativeEnvelope<AutomationTemplate[]> | null> {
  const api = getAutomationShell();
  if (!api) return null;
  return assertEnvelope(await api.templates(), 'automation.templates');
}

export async function dryRunAutomation(workflow: AutomationWorkflow | Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<NativeEnvelope<AutomationDryRunResult> | null> {
  const api = getAutomationShell();
  if (!api) return null;
  return assertEnvelope(await api.dryRun(workflow), 'automation.dryRun');
}

export async function previewAutomationSchedule(spec: AutomationScheduleSpec): Promise<NativeEnvelope<AutomationSchedulePreview> | null> {
  const api = getAutomationShell();
  if (!api) return null;
  return assertEnvelope(await api.schedulePreview(spec), 'automation.schedulePreview');
}

export async function validateAutomationImport(payload: unknown): Promise<NativeEnvelope<AutomationImportValidation> | null> {
  const api = getAutomationShell();
  if (!api) return null;
  return assertEnvelope(await api.validateImport(payload), 'automation.validateImport');
}

export async function loadAutomationJournal(): Promise<NativeEnvelope<AutomationJournalEntry[]> | null> {
  const api = getAutomationShell();
  if (!api) return null;
  return assertEnvelope(await api.journal(), 'automation.journal');
}

export async function loadAutomationReport(options?: { redact?: boolean }): Promise<NativeEnvelope<AutomationReport> | null> {
  const api = getAutomationShell();
  if (!api) return null;
  return assertEnvelope(await api.report(options || {}), 'automation.report');
}
