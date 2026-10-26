'use strict';

/**
 * KNOuX Gemini - Flow Studio local coordinator (Mission 13).
 *
 * Persists versioned local workflow drafts and dry-run journal entries. There
 * is no workflow executor, no scheduler timer, no file/registry/privileged
 * action and no external notification channel. Schedule previews are computed
 * in the host timezone with DST-aware local Date construction.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  AUTOMATION_TOOLS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS,
  TEMPLATES,
  hostTimezone,
  normalizeWorkflow,
  nextOccurrences,
  validateImport
} = require('./automation-providers.cjs');

const CONTRACT = 'automation.v1';
const MAX_WORKFLOWS = 50;
const MAX_JOURNAL = 50;
const MAX_OCCURRENCES = 5;
const DISCOVERY_TIMEOUT_MS = 60000;

function automationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function text(value) {
  if (value == null) return null;
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  return normalized || null;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

class AutomationBridge {
  constructor(options = {}) {
    this.userDataPath = options.userDataPath || path.join(os.tmpdir(), 'knoux-automation');
    this.directory = path.join(this.userDataPath, 'knoux-automation');
    this.workflowPath = path.join(this.directory, 'workflows.json');
    this.journalPath = path.join(this.directory, 'journal.json');
    this.now = options.now || (() => new Date());
    this.loadProvider = options.loadProvider || (() => null);
    this.loadStudioSources = options.loadStudioSources || (async () => []);
    this.session = null;
    this.snapshotCache = null;
    this.cancelled = false;
    this.limits = { workflows: MAX_WORKFLOWS, nodes: 32, journalEntries: MAX_JOURNAL, occurrences: MAX_OCCURRENCES };
  }

  capabilities() {
    return {
      engine: 'KNOuX Flow Studio local workflow drafts and dry-runs',
      contract: CONTRACT,
      readOnly: true,
      mutation: 'none',
      fixtureFallback: false,
      serviceCount: AUTOMATION_TOOLS.length,
      worldCount: 1,
      services: AUTOMATION_TOOLS.map((entry) => ({ ...entry })),
      gatedOperations: GATED_OPERATIONS.map((entry) => ({ ...entry })),
      limits: { ...this.limits },
      nativeOnly: [
        'Persisted local workflow drafts with version history',
        'Typed DAG validation and cycle rejection',
        'Deterministic dry-runs with no execution',
        'Host-timezone schedule occurrence preview',
        'Measured power and Studio source evidence',
        'Local dry-run journal and redacted report'
      ]
    };
  }

  stageTemplate() {
    return STAGE_DEFINITIONS.map((entry) => ({
      ...entry,
      status: 'pending',
      provider: 'Not started',
      startedAt: null,
      completedAt: null,
      durationMs: null,
      items: null,
      warning: null
    }));
  }

  publicSession() {
    if (!this.session) return null;
    return { ...this.session, stages: this.session.stages.map((stage) => ({ ...stage })), warnings: [...this.session.warnings] };
  }

  start() {
    if (this.session && this.session.status === 'running') return this.publicSession();
    this.cancelled = false;
    this.snapshotCache = null;
    const session = {
      contract: CONTRACT,
      id: crypto.randomUUID(),
      status: 'running',
      startedAt: this.now().toISOString(),
      completedAt: null,
      progress: 0,
      stages: this.stageTemplate(),
      warnings: [],
      readOnly: true,
      mutation: 'none'
    };
    this.session = session;
    this.runScan(session).catch((error) => {
      session.status = 'failed';
      session.completedAt = this.now().toISOString();
      session.warnings.push(error?.message || 'Flow Studio discovery failed.');
    });
    return this.publicSession();
  }

  status(sessionId) {
    if (!this.session || this.session.id !== sessionId) {
      throw automationError('AUTOMATION_SESSION_NOT_FOUND', 'The requested Flow Studio session does not exist.');
    }
    return this.publicSession();
  }

  cancel(sessionId) {
    if (!this.session || this.session.id !== sessionId) {
      throw automationError('AUTOMATION_SESSION_NOT_FOUND', 'The requested Flow Studio session does not exist.');
    }
    if (this.session.status !== 'running') return { cancelled: false, status: this.session.status, sessionId };
    this.cancelled = true;
    return { cancelled: true, status: this.session.status, sessionId };
  }

  updateProgress(session) {
    const completed = session.stages.filter((stage) => ['complete', 'partial', 'unavailable', 'cancelled'].includes(stage.status)).length;
    session.progress = Math.round((completed / session.stages.length) * 100);
  }

  async readStore() {
    try {
      const raw = await fs.promises.readFile(this.workflowPath, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        workflows: asArray(parsed.workflows).filter((entry) => entry && typeof entry.id === 'string').slice(0, MAX_WORKFLOWS),
        history: asArray(parsed.history).filter((entry) => entry && typeof entry.workflowId === 'string').slice(0, 200)
      };
    } catch (error) {
      return { workflows: [], history: [], warning: error?.code === 'ENOENT' ? null : String(error?.message || 'The workflow store could not be read.') };
    }
  }

  async writeStore(store) {
    await fs.promises.mkdir(this.directory, { recursive: true });
    const temporary = `${this.workflowPath}.${process.pid}.tmp`;
    await fs.promises.writeFile(temporary, JSON.stringify(store, null, 2), 'utf8');
    await fs.promises.rename(temporary, this.workflowPath);
  }

  async readJournal() {
    try {
      const raw = await fs.promises.readFile(this.journalPath, 'utf8');
      const parsed = JSON.parse(raw);
      return asArray(parsed).filter((entry) => entry && typeof entry.id === 'string').slice(0, MAX_JOURNAL);
    } catch {
      return [];
    }
  }

  async writeJournal(entries) {
    await fs.promises.mkdir(this.directory, { recursive: true });
    const temporary = `${this.journalPath}.${process.pid}.tmp`;
    await fs.promises.writeFile(temporary, JSON.stringify(entries.slice(0, MAX_JOURNAL), null, 2), 'utf8');
    await fs.promises.rename(temporary, this.journalPath);
  }

  async runtimeEvidence() {
    let batteryCount = 0;
    let chargePercent = null;
    let powerSource = null;
    let batteryAvailable = false;
    try {
      const provider = this.loadProvider();
      if (provider && typeof provider.collectBatteries === 'function') {
        const batteries = await provider.collectBatteries({ timeout: 20000 });
        const rows = asArray(batteries);
        batteryCount = rows.length;
        batteryAvailable = rows.length > 0;
        chargePercent = rows[0]?.chargePercent ?? null;
        if (rows[0]?.powerOnline === true) powerSource = 'AC';
        else if (rows[0]?.powerOnline === false) powerSource = 'Battery';
      }
    } catch {
      batteryAvailable = false;
    }
    let sources = [];
    try {
      const raw = await this.loadStudioSources();
      const rows = asArray(raw?.data ?? raw);
      sources = rows.map((entry) => ({
        id: text(entry?.id) || '',
        label: text(entry?.label) || 'Studio source',
        status: text(entry?.status) || 'unknown',
        fileCount: Number.isFinite(Number(entry?.fileCount)) ? Number(entry.fileCount) : null
      })).filter((entry) => entry.id);
    } catch {
      sources = [];
    }
    const now = this.now();
    return {
      timezone: hostTimezone(),
      localTime: new Intl.DateTimeFormat('en-GB', {
        timeZone: hostTimezone(), year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short'
      }).format(now),
      batteryAvailable,
      batteryCount,
      batteryChargePercent: chargePercent,
      powerSource,
      studioSources: sources
    };
  }

  async runScan(session) {
    const warnings = session.warnings;
    const sources = [];
    let store = { workflows: [], history: [] };
    let runtime = null;
    let journal = [];

    const runStage = async (key, providerLabel, work) => {
      if (this.cancelled) return { cancelled: true };
      const stage = session.stages.find((entry) => entry.key === key);
      stage.status = 'running';
      stage.provider = providerLabel;
      stage.startedAt = this.now().toISOString();
      const started = Date.now();
      try {
        const result = await work();
        stage.status = result?.partial ? 'partial' : 'complete';
        stage.items = Number.isFinite(result?.items) ? result.items : null;
        if (result?.warning) stage.warning = result.warning;
        return result;
      } catch (error) {
        stage.status = 'unavailable';
        stage.warning = String(error?.message || 'The measured source did not answer.').slice(0, 300);
        warnings.push(`${stage.labelEn}: ${stage.warning}`);
        return null;
      } finally {
        stage.completedAt = this.now().toISOString();
        stage.durationMs = Date.now() - started;
        this.updateProgress(session);
      }
    };

    await runStage('storage', 'Local workflow store', async () => {
      store = await this.readStore();
      sources.push('Local workflow store');
      if (store.warning) warnings.push(store.warning);
      return { items: store.workflows.length };
    });
    if (this.cancelled) return this.finishCancelled(session);

    await runStage('templates', 'Built-in template library', async () => {
      sources.push('Built-in templates');
      return { items: TEMPLATES.length };
    });
    if (this.cancelled) return this.finishCancelled(session);

    await runStage('runtime', 'Host timezone + measured battery evidence', async () => {
      runtime = await this.runtimeEvidence();
      sources.push('Intl host timezone', 'Win32_Battery where available');
      const partial = !runtime.batteryAvailable;
      return {
        items: runtime.batteryAvailable ? runtime.batteryCount : 0,
        partial,
        warning: partial ? 'No battery was measured. Battery-gated workflow conditions cannot be evaluated on this device.' : null
      };
    });
    if (this.cancelled) return this.finishCancelled(session);

    await runStage('sources', 'Authorized Studio sources', async () => {
      if (!runtime) runtime = await this.runtimeEvidence();
      sources.push('Studio authorized source list');
      const partial = runtime.studioSources.length === 0;
      return { items: runtime.studioSources.length, partial, warning: partial ? 'No authorized Studio source is connected; backup drafts remain incomplete.' : null };
    });
    if (this.cancelled) return this.finishCancelled(session);

    await runStage('journal', 'Local dry-run journal', async () => {
      journal = await this.readJournal();
      sources.push('Local dry-run journal');
      return { items: journal.length };
    });
    if (this.cancelled) return this.finishCancelled(session);

    const coverage = session.stages.map((stage) => ({
      key: stage.key,
      status: stage.status === 'complete' ? 'complete' : stage.status === 'partial' ? 'partial' : stage.status === 'cancelled' ? 'cancelled' : 'unavailable',
      items: stage.items,
      note: stage.warning
    }));
    const snapshot = {
      contract: CONTRACT,
      generatedAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      fixtureFallback: false,
      workflows: store.workflows,
      workflowHistory: store.history.slice(0, 50),
      templates: TEMPLATES.map((template) => ({ ...template })),
      journal,
      runtime: runtime || await this.runtimeEvidence(),
      gates: GATED_OPERATIONS.map((entry) => ({ ...entry })),
      coverage,
      warnings: [...new Set(warnings)],
      sources: [...new Set(sources)],
      limits: { ...this.limits },
      receipt: `workflows:${sha256(`${store.workflows.length}:${TEMPLATES.length}:${journal.length}:${runtime?.timezone || 'local'}`).slice(0, 24)}`
    };
    this.snapshotCache = snapshot;
    session.status = session.stages.some((stage) => stage.status === 'unavailable') ? 'partial' : 'complete';
    session.completedAt = this.now().toISOString();
    session.progress = 100;
    return this.publicSession();
  }

  finishCancelled(session) {
    session.status = 'cancelled';
    session.completedAt = this.now().toISOString();
    for (const stage of session.stages) {
      if (stage.status === 'pending' || stage.status === 'running') stage.status = 'cancelled';
    }
    session.progress = 100;
    return this.publicSession();
  }

  async snapshot() {
    if (!this.snapshotCache) throw automationError('AUTOMATION_NOT_MEASURED', 'No Flow Studio snapshot is available. Start discovery first.');
    return this.snapshotCache;
  }

  async workflows() {
    const store = await this.readStore();
    return store.workflows;
  }

  async save(input) {
    const store = await this.readStore();
    const existing = input && typeof input === 'object' && typeof input.id === 'string'
      ? store.workflows.find((entry) => entry.id === input.id) || null
      : null;
    const workflow = normalizeWorkflow(input, existing);
    if (!existing && store.workflows.length >= MAX_WORKFLOWS) {
      throw automationError('AUTOMATION_LIMIT', `At most ${MAX_WORKFLOWS} local workflows are stored.`);
    }
    const workflows = existing
      ? store.workflows.map((entry) => (entry.id === workflow.id ? workflow : entry))
      : [workflow, ...store.workflows];
    const history = [{
      workflowId: workflow.id,
      version: workflow.version,
      savedAt: workflow.updatedAt,
      name: workflow.name,
      nodeCount: workflow.nodes.length
    }, ...store.history].slice(0, 200);
    await this.writeStore({ schemaVersion: '1', workflows, history });
    if (this.snapshotCache) {
      this.snapshotCache.workflows = workflows;
      this.snapshotCache.workflowHistory = history.slice(0, 50);
    }
    return workflow;
  }

  async templates() {
    return TEMPLATES;
  }

  topologicalOrder(workflow) {
    const inDegree = new Map(workflow.nodes.map((node) => [node.id, 0]));
    const outgoing = new Map(workflow.nodes.map((node) => [node.id, []]));
    for (const edge of workflow.edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
      outgoing.get(edge.from)?.push(edge.to);
    }
    const queue = workflow.nodes.filter((node) => inDegree.get(node.id) === 0).map((node) => node.id);
    const order = [];
    while (queue.length) {
      const current = queue.shift();
      order.push(current);
      for (const next of outgoing.get(current) || []) {
        inDegree.set(next, inDegree.get(next) - 1);
        if (inDegree.get(next) === 0) queue.push(next);
      }
    }
    return order;
  }

  async dryRun(input) {
    const store = await this.readStore();
    const existing = input && typeof input === 'object' && typeof input.id === 'string'
      ? store.workflows.find((entry) => entry.id === input.id) || null
      : null;
    const workflow = normalizeWorkflow(input, existing);
    const order = this.topologicalOrder(workflow);
    let triggerDetail = 'Manual trigger.';
    const triggerNodes = workflow.nodes.filter((node) => node.type === 'trigger');
    if (workflow.trigger.type === 'startup') triggerDetail = 'Startup trigger metadata; no background startup hook exists.';
    else if (workflow.trigger.type === 'schedule') {
      try {
        const preview = nextOccurrences(workflow.trigger, 1, this.now());
        triggerDetail = preview.next[0] ? `Next schedule occurrence: ${preview.next[0].local}.` : preview.reason || 'No schedule occurrence.';
      } catch (error) {
        triggerDetail = `Schedule cannot be previewed: ${error.message}`;
      }
    }
    const steps = order.map((id) => {
      const node = workflow.nodes.find((entry) => entry.id === id);
      if (node.type === 'trigger') return { nodeId: id, label: node.label, type: node.type, status: 'would-fire', detail: triggerDetail };
      if (node.type === 'condition') return { nodeId: id, label: node.label, type: node.type, status: 'evaluated-preview', detail: 'Conditions are evaluated only at execution; no live condition source is connected.' };
      if (node.type === 'approval') return { nodeId: id, label: node.label, type: node.type, status: 'required', detail: 'Explicit operator approval is required before any future execution.' };
      if (node.type === 'report') return { nodeId: id, label: node.label, type: node.type, status: 'preview-artifact', detail: 'Dry-run receipt only; no artifact file was produced.' };
      return { nodeId: id, label: node.label, type: node.type, status: 'blocked', detail: 'Workflow execution is not implemented; the action preview stops here.' };
    });
    const result = {
      contract: CONTRACT,
      id: crypto.randomUUID(),
      at: this.now().toISOString(),
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowVersion: workflow.version,
      steps,
      nodeCount: workflow.nodes.length,
      edgeCount: workflow.edges.length,
      order,
      valid: true,
      readOnly: true,
      mutation: 'none',
      execution: 'not-implemented',
      receipt: `dryrun:${sha256(`${workflow.id}:${workflow.version}:${order.join(',')}`).slice(0, 24)}`,
      warnings: triggerNodes.length > 1 ? ['Multiple trigger nodes exist; all are shown in topological order.'] : []
    };
    const entry = {
      id: `auto-journal-${crypto.randomUUID()}`,
      at: result.at,
      kind: 'dry-run',
      workflowId: result.workflowId,
      workflowName: result.workflowName,
      workflowVersion: result.workflowVersion,
      nodeCount: result.nodeCount,
      stepCount: result.steps.length,
      receipt: result.receipt,
      readOnly: true,
      mutation: 'none',
      execution: 'not-implemented'
    };
    const existingJournal = await this.readJournal();
    try {
      await this.writeJournal([entry, ...existingJournal]);
      if (this.snapshotCache) this.snapshotCache.journal = [entry, ...existingJournal].slice(0, MAX_JOURNAL);
    } catch {
      result.warnings.push('The local dry-run journal could not be written.');
    }
    return result;
  }

  async schedulePreview(spec) {
    const preview = nextOccurrences(spec, MAX_OCCURRENCES, this.now());
    return {
      contract: CONTRACT,
      valid: preview.valid,
      spec: preview.spec,
      timezone: preview.timezone,
      next: preview.next,
      reason: preview.reason,
      readOnly: true,
      mutation: 'none'
    };
  }

  async validateImport(payload) {
    const validation = validateImport(payload);
    return {
      contract: CONTRACT,
      ...validation,
      readOnly: true,
      mutation: 'none'
    };
  }

  async journal() {
    return this.readJournal();
  }

  async report(options = {}) {
    const snapshot = await this.snapshot();
    const redact = options.redact !== false;
    const redactText = (value) => {
      let result = String(value);
      if (!redact) return result;
      const home = os.homedir();
      const temp = os.tmpdir();
      result = result.split(home).join('<home>').split(temp).join('<temp>');
      return result.replace(/([A-Za-z]:[\\/]Users[\\/])[^\\/"']+/g, '$1<user>');
    };
    const section = (id, titleEn, titleAr, items) => {
      const measured = items.filter((item) => item.status === 'measured').length;
      const unknown = items.length - measured;
      return { id, titleEn, titleAr, status: unknown === 0 ? 'validated' : measured ? 'partial' : 'unavailable', measured, unknown, items: items.map((item) => ({ label: redactText(item.label), value: redactText(item.value), status: item.status })) };
    };
    const sections = [
      section('library', 'Workflow library', 'مكتبة سير العمل', [
        { label: 'Saved workflows', value: String(snapshot.workflows.length), status: 'measured' },
        { label: 'Version history entries', value: String(snapshot.workflowHistory.length), status: 'measured' },
        { label: 'Built-in templates', value: String(snapshot.templates.length), status: 'measured' }
      ]),
      section('runtime', 'Runtime evidence', 'أدلة وقت التشغيل', [
        { label: 'Host timezone', value: snapshot.runtime.timezone, status: 'measured' },
        { label: 'Battery', value: snapshot.runtime.batteryAvailable ? `${snapshot.runtime.batteryCount} measured` : 'unavailable', status: snapshot.runtime.batteryAvailable ? 'measured' : 'warning' },
        { label: 'Authorized Studio sources', value: String(snapshot.runtime.studioSources.length), status: snapshot.runtime.studioSources.length ? 'measured' : 'warning' }
      ]),
      section('journal', 'Dry-run journal', 'سجل المعاينات الجافة', [
        { label: 'Entries', value: String(snapshot.journal.length), status: 'measured' },
        { label: 'Executed workflows', value: '0', status: 'measured' }
      ]),
      section('gates', 'Mutation gates', 'بوابات التغيير', snapshot.gates.map((gate) => ({ label: gate.id, value: `${gate.title} (Mission ${gate.mission})`, status: 'measured' })))
    ];
    return {
      contract: CONTRACT,
      generatedAt: this.now().toISOString(),
      readOnly: true,
      mutation: 'none',
      redacted: redact,
      summary: `Read-only Flow Studio report: ${snapshot.workflows.length} local workflow(s), ${snapshot.workflowHistory.length} version record(s), ${snapshot.journal.length} dry-run(s). No workflow was executed.`,
      sections,
      warnings: [...snapshot.warnings],
      receipt: `workflows-report:${sha256(JSON.stringify(sections)).slice(0, 24)}`
    };
  }

  async close() {
    this.cancelled = true;
    this.snapshotCache = null;
  }
}

module.exports = {
  AutomationBridge,
  AUTOMATION_TOOLS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS
};
