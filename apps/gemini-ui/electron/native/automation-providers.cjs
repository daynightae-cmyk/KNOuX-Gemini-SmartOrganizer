'use strict';

/**
 * KNOuX Gemini - Flow Studio automation providers (Mission 13).
 *
 * Local workflow schema, typed DAG validation, built-in templates, schedule
 * occurrence preview (host timezone + DST-aware) and import validation. No
 * workflow step is executed; there is no scheduler timer or action executor.
 */

const AUTOMATION_TOOLS = Object.freeze([
  { id: 'auto-smart-scan', world: 'automation', labelEn: 'Scheduled Smart Scan', labelAr: 'فحص ذكي مجدول', state: 'gated', risk: 'staged-change', provider: 'Local workflow draft + dry-run', noteEn: 'A scheduled scan chain can be drafted and dry-run; no background execution exists.', noteAr: 'يمكن تهيئة سلسلة فحص مجدولة وتشغيل معاينة جافة؛ لا يوجد تنفيذ خلفي.' },
  { id: 'auto-schedule-manager', world: 'automation', labelEn: 'Schedule Manager', labelAr: 'مدير الجدولة', state: 'gated', risk: 'staged-change', provider: 'Persisted schedule metadata', noteEn: 'Weekly schedule metadata and next occurrences. No timer runs in the background.', noteAr: 'بيانات جدولة أسبوعية والمواعيد التالية. لا يعمل مؤقت في الخلفية.' },
  { id: 'auto-run-history', world: 'automation', labelEn: 'Dry-run History', labelAr: 'سجل المعاينات الجافة', state: 'available', risk: 'read-only', provider: 'Local dry-run journal', noteEn: 'Only deterministic dry-runs are recorded. No workflow run has executed.', noteAr: 'تُسجل المعاينات الجافة الحتمية فقط. لم يُنفذ أي تشغيل سير عمل.' },
  { id: 'auto-templates', world: 'automation', labelEn: 'Template Gallery', labelAr: 'معرض القوالب', state: 'available', risk: 'staged-change', provider: 'Built-in workflow templates', noteEn: 'Built-in templates instantiate into local drafts after validation.', noteAr: 'تُنشأ القوالب المدمجة كمسودات محلية بعد التحقق.' },
  { id: 'auto-schedule-plan', world: 'automation', labelEn: 'Recurrence Composer', labelAr: 'منشئ التكرار', state: 'available', risk: 'staged-change', provider: 'Host-timezone schedule preview', noteEn: 'Computes the next five occurrences with local-time DST handling. No job is scheduled.', noteAr: 'يحسب المواعيد الخمسة التالية مع معالجة التوقيت الصيفي المحلي. لا تُجدول أي مهمة.' },
  { id: 'auto-cleanup-plan', world: 'automation', labelEn: 'Cleanup Pipeline', labelAr: 'مسار التنظيف', state: 'gated', risk: 'staged-change', provider: 'Preview-only pipeline draft', noteEn: 'Scan, classify, approval and report nodes. Cleanup execution belongs to Mission 08 and is absent.', noteAr: 'عقد فحص وتصنيف وموافقة وتقرير. تنفيذ التنظيف يخص المهمة 08 وهو غير متاح.' },
  { id: 'auto-notify', world: 'automation', labelEn: 'Notification Routing', labelAr: 'توجيه الإشعارات', state: 'gated', risk: 'staged-change', provider: 'Local channel policy', noteEn: 'In-app/journal channels only. No external message is sent.', noteAr: 'قنوات داخل التطبيق/السجل فقط. لا تُرسل رسالة خارجية.' },
  { id: 'auto-quiet-hours', world: 'automation', labelEn: 'Quiet Hours Dial', labelAr: 'قرص ساعات الهدوء', state: 'gated', risk: 'staged-change', provider: 'Local quiet-hours policy', noteEn: 'Draft quiet windows and muted event classes. Nothing is scheduled or muted at runtime.', noteAr: 'مسودات نوافذ الهدوء وفئات الأحداث المكتومة. لا يُجدول أو يُكتم شيء وقت التشغيل.' },
  { id: 'auto-battery-policy', world: 'automation', labelEn: 'Power-aware Scheduler', labelAr: 'جدولة واعية بالطاقة', state: 'partial', risk: 'staged-change', provider: 'Measured battery evidence', noteEn: 'Battery evidence is measured only when Windows exposes a battery. No power action is executed.', noteAr: 'تُقاس أدلة البطارية فقط عندما يوفرها Windows. لا يُنفذ إجراء طاقة.' },
  { id: 'auto-retention', world: 'automation', labelEn: 'Artifact Retention', labelAr: 'احتفاظ بالمخرجات', state: 'gated', risk: 'staged-change', provider: 'Local dry-run journal metadata', noteEn: 'Previews aged dry-run records. No deletion channel exists.', noteAr: 'يعاين سجلات المعاينات الجافة القديمة. لا توجد قناة حذف.' },
  { id: 'auto-export', world: 'automation', labelEn: 'Workflow Transfer', labelAr: 'نقل سير العمل', state: 'available', risk: 'staged-change', provider: 'knoux.workflow.v1 schema', noteEn: 'Exports a validated JSON schema and validates pasted imports. No code or command is embedded.', noteAr: 'يصدّر مخطط JSON متحقق ويحقق الاستيراد الملصق. لا يُ embedded كود أو أمر.' },
  { id: 'auto-backup-plan', world: 'automation', labelEn: 'Backup Flow Draft', labelAr: 'مسودة سير النسخ', state: 'partial', risk: 'staged-change', provider: 'Authorized Studio sources + destination gate', noteEn: 'Source/destination drafts only. No file copy channel exists; a destination grant is required.', noteAr: 'مسودات المصدر والوجهة فقط. لا توجد قناة نسخ ملفات؛ يلزم منح وجهة.' }
]);

const GATED_OPERATIONS = Object.freeze([
  { id: 'automation.execute', mission: '13', title: 'Execute a workflow', reason: 'No workflow executor or background scheduler is shipped. Dry-runs are preview-only.' },
  { id: 'automation.cleanup', mission: '08', title: 'Run a cleanup action', reason: 'Cleanup execution belongs to the approved Mission 08 executor and is not connected.' },
  { id: 'automation.backup', mission: '06', title: 'Copy a backup', reason: 'File copy requires authorized source and destination grants, verification and rollback; none is exposed.' },
  { id: 'automation.notify.external', mission: '13', title: 'Send an external notification', reason: 'Only in-app/journal events exist. No email, webhook, SMS or cloud channel is configured.' },
  { id: 'automation.artifact.delete', mission: '13', title: 'Prune stored artifacts', reason: 'Retention is a preview only; no delete channel exists.' }
]);

const STAGE_DEFINITIONS = Object.freeze([
  { key: 'storage', labelEn: 'Workflow store', labelAr: 'مخزن سير العمل' },
  { key: 'templates', labelEn: 'Built-in templates', labelAr: 'القوالب المدمجة' },
  { key: 'runtime', labelEn: 'Local runtime & power evidence', labelAr: 'وقت التشغيل وأدلة الطاقة' },
  { key: 'sources', labelEn: 'Authorized Studio sources', labelAr: 'مصادر Studio المصرح بها' },
  { key: 'journal', labelEn: 'Dry-run journal', labelAr: 'سجل المعاينات الجافة' }
]);

const NODE_TYPES = new Set(['trigger', 'condition', 'action', 'approval', 'report']);
const TOOL_IDS = new Set(AUTOMATION_TOOLS.map((entry) => entry.id));
const TOOL_IDS_ALLOWED = new Set([...TOOL_IDS, 'platform']);
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NAME_MAX = 80;
const NODE_MAX = 32;
const EDGE_MAX = 64;

function automationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
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

function hostTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
  } catch {
    return 'local';
  }
}

function defaultTrigger() {
  return {
    type: 'schedule',
    cadence: 'weekly',
    time: '09:00',
    days: [1, 2, 3, 4, 5],
    intervalHours: 24,
    timezone: 'local',
    exclusions: []
  };
}

function defaultQuietHours() {
  return { enabled: true, start: '22:00', end: '07:00', days: [0, 1, 2, 3, 4, 5, 6], weekendRule: 'mute' };
}

function defaultPolicy() {
  return {
    requireApproval: true,
    batteryThreshold: 20,
    acOnly: false,
    retentionDays: 30,
    notifyChannels: ['in-app', 'journal'],
    severity: 'warning'
  };
}

function makeNode(id, type, label, toolId, config = {}) {
  return { id, type, label, toolId, config };
}

function templateWorkflow(nameEn, nodes, edges, trigger = defaultTrigger(), policy = {}) {
  return {
    name: nameEn,
    schemaVersion: '1.0',
    enabled: false,
    trigger,
    quietHours: defaultQuietHours(),
    policy: { ...defaultPolicy(), ...policy },
    nodes,
    edges,
    mutation: 'none',
    execution: 'not-implemented'
  };
}

const TEMPLATES = Object.freeze([
  {
    id: 'tpl-smart-scan',
    category: 'scan',
    labelEn: 'Scheduled Smart Scan',
    labelAr: 'فحص ذكي مجدول',
    blurbEn: 'Schedule -> read-only Smart Scan -> approval -> report.',
    blurbAr: 'جدولة -> فحص ذكي للقراءة فقط -> موافقة -> تقرير.',
    prerequisitesEn: ['An authorized Studio/Files source', 'Mission 02 read-only scan bridge'],
    prerequisitesAr: ['مصدر Studio/Files مصرح به', 'جسر الفحص للقراءة فقط من المهمة 02'],
    workflow: templateWorkflow('Scheduled Smart Scan', [
      makeNode('trigger-1', 'trigger', 'Weekday schedule', 'platform', { cadence: 'weekly', time: '09:00' }),
      makeNode('scan-1', 'action', 'Read-only Smart Scan', 'auto-smart-scan', { modules: ['inventory', 'capacity', 'system'], dryRunOnly: true }),
      makeNode('approval-1', 'approval', 'Operator approval', 'platform', { scope: 'scan' }),
      makeNode('report-1', 'report', 'Scan evidence report', 'auto-smart-scan', { format: 'json' })
    ], [
      { from: 'trigger-1', to: 'scan-1' },
      { from: 'scan-1', to: 'approval-1' },
      { from: 'approval-1', to: 'report-1' }
    ])
  },
  {
    id: 'tpl-weekly-organization',
    category: 'organization',
    labelEn: 'Weekly Organization Review',
    labelAr: 'مراجعة تنظيم أسبوعية',
    blurbEn: 'Weekly inventory -> large-file review -> report.',
    blurbAr: 'جرد أسبوعي -> مراجعة الملفات الكبيرة -> تقرير.',
    prerequisitesEn: ['Authorized Studio source'],
    prerequisitesAr: ['مصدر Studio مصرح به'],
    workflow: templateWorkflow('Weekly Organization Review', [
      makeNode('trigger-1', 'trigger', 'Monday schedule', 'platform', {}),
      makeNode('scan-1', 'action', 'Folder inventory', 'auto-smart-scan', { modules: ['inventory'] }),
      makeNode('review-1', 'condition', 'Large-file threshold', 'platform', { thresholdGb: 2 }),
      makeNode('report-1', 'report', 'Organization report', 'auto-templates', { format: 'json' })
    ], [
      { from: 'trigger-1', to: 'scan-1' },
      { from: 'scan-1', to: 'review-1' },
      { from: 'review-1', to: 'report-1' }
    ], { ...defaultTrigger(), time: '08:00', days: [1] })
  },
  {
    id: 'tpl-cleanup-pipeline',
    category: 'cleanup',
    labelEn: 'Safe Cleanup Pipeline',
    labelAr: 'مسار تنظيف آمن',
    blurbEn: 'Scan -> classify -> approval -> report. Cleanup execution stays in Mission 08.',
    blurbAr: 'فحص -> تصنيف -> موافقة -> تقرير. تنفيذ التنظيف يبقى في المهمة 08.',
    prerequisitesEn: ['Mission 08 read-only Clean Room bridge', 'Explicit approval for any delete'],
    prerequisitesAr: ['جسر غرفة التنظيف للقراءة فقط من المهمة 08', 'موافقة صريحة لأي حذف'],
    workflow: templateWorkflow('Safe Cleanup Pipeline', [
      makeNode('trigger-1', 'trigger', 'Sunday schedule', 'platform', {}),
      makeNode('scan-1', 'action', 'Cleanup candidate scan', 'auto-cleanup-plan', { categories: ['temp', 'browser', 'logs'], execute: false }),
      makeNode('classify-1', 'condition', 'Safety classification', 'platform', { minAgeDays: 7 }),
      makeNode('approval-1', 'approval', 'Per-run approval', 'platform', { scope: 'cleanup' }),
      makeNode('report-1', 'report', 'Cleanup estimate report', 'auto-cleanup-plan', { format: 'json' })
    ], [
      { from: 'trigger-1', to: 'scan-1' },
      { from: 'scan-1', to: 'classify-1' },
      { from: 'classify-1', to: 'approval-1' },
      { from: 'approval-1', to: 'report-1' }
    ], { ...defaultTrigger(), time: '03:00', days: [0] })
  },
  {
    id: 'tpl-startup-report',
    category: 'system',
    labelEn: 'Startup Evidence Report',
    labelAr: 'تقرير أدلة بدء التشغيل',
    blurbEn: 'Startup trigger -> read-only autorun evidence -> report.',
    blurbAr: 'محفز إقلاع -> أدلة بدء تشغيل للقراءة فقط -> تقرير.',
    prerequisitesEn: ['Mission 09 read-only Boot Control bridge'],
    prerequisitesAr: ['جسر تحكم الإقلاع للقراءة فقط من المهمة 09'],
    workflow: templateWorkflow('Startup Evidence Report', [
      makeNode('trigger-1', 'trigger', 'Startup trigger', 'platform', {}),
      makeNode('scan-1', 'action', 'Read-only autorun inventory', 'auto-schedule-manager', { execute: false }),
      makeNode('report-1', 'report', 'Startup report', 'auto-run-history', { format: 'json' })
    ], [
      { from: 'trigger-1', to: 'scan-1' },
      { from: 'scan-1', to: 'report-1' }
    ], { ...defaultTrigger(), type: 'startup' })
  },
  {
    id: 'tpl-driver-audit',
    category: 'system',
    labelEn: 'Driver Signature Audit',
    labelAr: 'تدقيق تواقيع برامج التشغيل',
    blurbEn: 'Weekly signed-driver inventory -> approval -> report.',
    blurbAr: 'جرد أسبوعي لبرامج التشغيل الموقعة -> موافقة -> تقرير.',
    prerequisitesEn: ['Mission 10 read-only System bridge'],
    prerequisitesAr: ['جسر النظام للقراءة فقط من المهمة 10'],
    workflow: templateWorkflow('Driver Signature Audit', [
      makeNode('trigger-1', 'trigger', 'Weekly schedule', 'platform', {}),
      makeNode('scan-1', 'action', 'Driver evidence', 'auto-smart-scan', { modules: ['drivers'], execute: false }),
      makeNode('report-1', 'report', 'Driver audit report', 'auto-export', { format: 'json' })
    ], [
      { from: 'trigger-1', to: 'scan-1' },
      { from: 'scan-1', to: 'report-1' }
    ])
  },
  {
    id: 'tpl-storage-watch',
    category: 'storage',
    labelEn: 'Storage Capacity Watch',
    labelAr: 'مراقبة سعة التخزين',
    blurbEn: 'Daily capacity condition -> report. No cleanup is executed.',
    blurbAr: 'شرط سعة يومي -> تقرير. لا يُنفذ تنظيف.',
    prerequisitesEn: ['Mission 07 read-only Storage bridge'],
    prerequisitesAr: ['جسر التخزين للقراءة فقط من المهمة 07'],
    workflow: templateWorkflow('Storage Capacity Watch', [
      makeNode('trigger-1', 'trigger', 'Daily interval', 'platform', {}),
      makeNode('condition-1', 'condition', 'Free space below 10%', 'platform', { thresholdPercent: 10 }),
      makeNode('report-1', 'report', 'Capacity report', 'auto-retention', { format: 'json' })
    ], [
      { from: 'trigger-1', to: 'condition-1' },
      { from: 'condition-1', to: 'report-1' }
    ], { ...defaultTrigger(), cadence: 'daily', time: '07:30', days: [0, 1, 2, 3, 4, 5, 6] })
  },
  {
    id: 'tpl-notification-digest',
    category: 'notifications',
    labelEn: 'Notification Digest',
    labelAr: 'ملخص الإشعارات',
    blurbEn: 'Daily in-app digest respecting quiet hours. No external channel.',
    blurbAr: 'ملخص يومي داخل التطبيق يحترم ساعات الهدوء. لا قناة خارجية.',
    prerequisitesEn: ['Local in-app notification channel'],
    prerequisitesAr: ['قناة إشعار محلية داخل التطبيق'],
    workflow: templateWorkflow('Notification Digest', [
      makeNode('trigger-1', 'trigger', 'Daily digest', 'platform', {}),
      makeNode('condition-1', 'condition', 'Quiet hours gate', 'platform', { honorQuietHours: true }),
      makeNode('report-1', 'report', 'In-app digest preview', 'auto-notify', { channel: 'in-app' })
    ], [
      { from: 'trigger-1', to: 'condition-1' },
      { from: 'condition-1', to: 'report-1' }
    ], { ...defaultTrigger(), cadence: 'daily', time: '18:00', days: [0, 1, 2, 3, 4, 5, 6] })
  },
  {
    id: 'tpl-backup-verify',
    category: 'backup',
    labelEn: 'Backup Verification Draft',
    labelAr: 'مسودة تحقق النسخ',
    blurbEn: 'Authorized source -> destination gate -> verification report.',
    blurbAr: 'مصدر مصرح به -> بوابة وجهة -> تقرير تحقق.',
    prerequisitesEn: ['Authorized Studio source', 'Destination grant and copy executor are NOT available'],
    prerequisitesAr: ['مصدر Studio مصرح به', 'منح الوجهة ومنفذ النسخ غير متاحين'],
    workflow: templateWorkflow('Backup Verification Draft', [
      makeNode('trigger-1', 'trigger', 'Daily backup window', 'platform', {}),
      makeNode('source-1', 'action', 'Authorized source snapshot', 'auto-backup-plan', { copy: false }),
      makeNode('approval-1', 'approval', 'Destination grant', 'platform', { scope: 'backup' }),
      makeNode('report-1', 'report', 'Verification report draft', 'auto-backup-plan', { algorithm: 'SHA-256' })
    ], [
      { from: 'trigger-1', to: 'source-1' },
      { from: 'source-1', to: 'approval-1' },
      { from: 'approval-1', to: 'report-1' }
    ], { ...defaultTrigger(), cadence: 'daily', time: '01:00', days: [0, 1, 2, 3, 4, 5, 6] })
  }
]);

function normalizeTrigger(value) {
  const raw = value && typeof value === 'object' ? value : {};
  const type = ['manual', 'schedule', 'startup'].includes(raw.type) ? raw.type : 'manual';
  const cadence = ['daily', 'weekly', 'interval'].includes(raw.cadence) ? raw.cadence : 'weekly';
  const time = TIME_PATTERN.test(String(raw.time || '')) ? String(raw.time) : '09:00';
  const days = asArray(raw.days).map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  const intervalHours = Number.isFinite(Number(raw.intervalHours)) ? Math.max(1, Math.min(168, Math.round(Number(raw.intervalHours)))) : 24;
  const exclusions = asArray(raw.exclusions).map((entry) => String(entry)).filter((entry) => DATE_PATTERN.test(entry)).slice(0, 40);
  const timezone = text(raw.timezone) || 'local';
  if (type === 'schedule' && cadence === 'weekly' && !days.length) {
    throw automationError('AUTOMATION_SCHEDULE_INVALID', 'A weekly schedule requires at least one weekday.');
  }
  return { type, cadence, time, days: [...new Set(days)].sort(), intervalHours, timezone, exclusions: [...new Set(exclusions)] };
}

function normalizeQuietHours(value) {
  const raw = value && typeof value === 'object' ? value : {};
  const start = TIME_PATTERN.test(String(raw.start || '')) ? String(raw.start) : '22:00';
  const end = TIME_PATTERN.test(String(raw.end || '')) ? String(raw.end) : '07:00';
  const days = asArray(raw.days).map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return {
    enabled: raw.enabled !== false,
    start,
    end,
    days: days.length ? [...new Set(days)].sort() : [0, 1, 2, 3, 4, 5, 6],
    weekendRule: ['mute', 'allow', 'inherit'].includes(raw.weekendRule) ? raw.weekendRule : 'mute'
  };
}

function normalizePolicy(value) {
  const raw = value && typeof value === 'object' ? value : {};
  const channels = asArray(raw.notifyChannels).map((entry) => String(entry)).filter((entry) => ['in-app', 'journal', 'toast'].includes(entry));
  const retention = [14, 30, 90].includes(Number(raw.retentionDays)) ? Number(raw.retentionDays) : 30;
  const threshold = Number.isFinite(Number(raw.batteryThreshold)) ? Math.max(0, Math.min(100, Math.round(Number(raw.batteryThreshold)))) : 20;
  return {
    requireApproval: raw.requireApproval !== false,
    batteryThreshold: threshold,
    acOnly: raw.acOnly === true,
    retentionDays: retention,
    notifyChannels: channels.length ? [...new Set(channels)] : ['in-app', 'journal'],
    severity: ['info', 'warning', 'error'].includes(raw.severity) ? raw.severity : 'warning'
  };
}

function normalizeNode(raw, index) {
  if (!raw || typeof raw !== 'object') throw automationError('AUTOMATION_NODE_INVALID', `Node ${index + 1} is not an object.`);
  const id = text(raw.id);
  if (!id || !/^[a-z0-9-]{1,40}$/.test(id)) throw automationError('AUTOMATION_NODE_INVALID', `Node ${index + 1} has an invalid id.`);
  if (!NODE_TYPES.has(raw.type)) throw automationError('AUTOMATION_NODE_INVALID', `Node ${id} has an unsupported type.`);
  const label = text(raw.label);
  if (!label || label.length > NAME_MAX) throw automationError('AUTOMATION_NODE_INVALID', `Node ${id} has an invalid label.`);
  const toolId = text(raw.toolId);
  if (!toolId || !TOOL_IDS_ALLOWED.has(toolId)) throw automationError('AUTOMATION_NODE_INVALID', `Node ${id} uses an unregistered tool.`);
  const config = {};
  if (raw.config && typeof raw.config === 'object' && !Array.isArray(raw.config)) {
    for (const [key, value] of Object.entries(raw.config).slice(0, 24)) {
      if (typeof value === 'string') config[key] = value.slice(0, 240);
      else if (typeof value === 'number' || typeof value === 'boolean' || value === null) config[key] = value;
      else if (Array.isArray(value)) config[key] = value.slice(0, 20).map((entry) => String(entry).slice(0, 80));
    }
  }
  return { id, type: raw.type, label, toolId, config };
}

function normalizeWorkflow(input, existing = null) {
  if (!input || typeof input !== 'object') throw automationError('AUTOMATION_WORKFLOW_INVALID', 'A workflow object is required.');
  const name = text(input.name);
  if (!name || name.length > NAME_MAX) throw automationError('AUTOMATION_WORKFLOW_INVALID', 'A workflow name of 1–80 characters is required.');
  const rawNodes = asArray(input.nodes);
  if (rawNodes.length < 1 || rawNodes.length > NODE_MAX) throw automationError('AUTOMATION_WORKFLOW_INVALID', `A workflow requires 1–${NODE_MAX} nodes.`);
  const nodes = rawNodes.map((node, index) => normalizeNode(node, index));
  if (new Set(nodes.map((node) => node.id)).size !== nodes.length) {
    throw automationError('AUTOMATION_WORKFLOW_INVALID', 'Node ids must be unique.');
  }
  if (!nodes.some((node) => node.type === 'trigger')) throw automationError('AUTOMATION_WORKFLOW_INVALID', 'At least one trigger node is required.');
  if (!nodes.some((node) => node.type === 'action')) throw automationError('AUTOMATION_WORKFLOW_INVALID', 'At least one action node is required.');
  const ids = new Set(nodes.map((node) => node.id));
  const rawEdges = asArray(input.edges);
  if (rawEdges.length > EDGE_MAX) throw automationError('AUTOMATION_WORKFLOW_INVALID', `At most ${EDGE_MAX} edges are accepted.`);
  const edges = [];
  const edgeKeys = new Set();
  for (const edge of rawEdges) {
    const from = text(edge?.from);
    const to = text(edge?.to);
    if (!from || !to || from === to || !ids.has(from) || !ids.has(to)) {
      throw automationError('AUTOMATION_EDGE_INVALID', 'Every edge must connect two distinct measured nodes.');
    }
    const key = `${from}->${to}`;
    if (edgeKeys.has(key)) throw automationError('AUTOMATION_EDGE_INVALID', `Duplicate edge ${key}.`);
    edgeKeys.add(key);
    edges.push({ from, to });
  }
  // Kahn cycle detection.
  const inDegree = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    outgoing.get(edge.from)?.push(edge.to);
  }
  const queue = nodes.filter((node) => inDegree.get(node.id) === 0).map((node) => node.id);
  const order = [];
  while (queue.length) {
    const current = queue.shift();
    order.push(current);
    for (const next of outgoing.get(current) || []) {
      inDegree.set(next, inDegree.get(next) - 1);
      if (inDegree.get(next) === 0) queue.push(next);
    }
  }
  if (order.length !== nodes.length) throw automationError('AUTOMATION_CYCLE', 'The workflow graph contains a cycle and was rejected.');
  const reachable = new Set();
  const walk = (id) => {
    if (reachable.has(id)) return;
    reachable.add(id);
    for (const next of outgoing.get(id) || []) walk(next);
  };
  for (const node of nodes.filter((entry) => entry.type === 'trigger')) walk(node.id);
  const unreachable = nodes.filter((node) => !reachable.has(node.id)).map((node) => node.id);
  if (unreachable.length) throw automationError('AUTOMATION_UNREACHABLE', `Unreachable node(s): ${unreachable.join(', ')}.`);
  const trigger = normalizeTrigger(input.trigger);
  const quietHours = normalizeQuietHours(input.quietHours);
  const policy = normalizePolicy(input.policy);
  const now = new Date().toISOString();
  return {
    id: existing?.id || (text(input.id) && /^wf-[a-z0-9-]{8,60}$/.test(String(input.id)) ? String(input.id) : `wf-${cryptoRandom()}`),
    name,
    schemaVersion: '1.0',
    version: existing ? existing.version + 1 : 1,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    enabled: input.enabled === true,
    trigger,
    quietHours,
    policy,
    nodes,
    edges,
    mutation: 'none',
    execution: 'not-implemented'
  };
}

function cryptoRandom() {
  // Avoid importing crypto here; Math.random is enough for a local draft id.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function validateScheduleSpec(input) {
  const spec = normalizeTrigger({ ...input, type: 'schedule' });
  const timezone = spec.timezone === 'local' ? hostTimezone() : spec.timezone;
  if (timezone !== hostTimezone() && spec.timezone !== 'local') {
    throw automationError('AUTOMATION_TIMEZONE_UNSUPPORTED', `Only the host timezone (${hostTimezone()}) is supported.`);
  }
  return { spec: { ...spec, timezone }, timezone };
}

function localTimestamp(date, timezone) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short'
  }).format(date);
}

function nextOccurrences(input, count = 5, now = new Date()) {
  const { spec, timezone } = validateScheduleSpec(input);
  const [hour, minute] = spec.time.split(':').map(Number);
  const exclusions = new Set(spec.exclusions);
  const occurrences = [];
  if (spec.cadence === 'interval') {
    for (let index = 1; index <= count; index += 1) {
      const at = new Date(now.getTime() + spec.intervalHours * 3600000 * index);
      occurrences.push({ at: at.toISOString(), local: localTimestamp(at, timezone) });
    }
    return { valid: true, spec, timezone, next: occurrences, reason: null };
  }
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let dayOffset = 0; dayOffset < 370 && occurrences.length < count; dayOffset += 1) {
    const candidateDay = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + dayOffset);
    const candidate = new Date(candidateDay.getFullYear(), candidateDay.getMonth(), candidateDay.getDate(), hour, minute, 0, 0);
    if (candidate.getTime() <= now.getTime()) continue;
    if (spec.cadence === 'weekly' && !spec.days.includes(candidate.getDay())) continue;
    const dateKey = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, '0')}-${String(candidate.getDate()).padStart(2, '0')}`;
    if (exclusions.has(dateKey)) continue;
    occurrences.push({ at: candidate.toISOString(), local: localTimestamp(candidate, timezone) });
  }
  return {
    valid: occurrences.length >= 1,
    spec,
    timezone,
    next: occurrences,
    reason: occurrences.length ? null : 'No occurrence fits the current schedule and exclusions.'
  };
}

function validateImport(payload) {
  try {
    let value = payload;
    if (typeof payload === 'string') value = JSON.parse(payload);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { valid: false, errors: ['The import must be a JSON workflow object.'], warnings: [], nodeCount: 0, edgeCount: 0, workflowName: null, schemaVersion: null };
    }
    if (value.schemaVersion !== '1.0') {
      return { valid: false, errors: ['Only knoux.workflow schemaVersion 1.0 is accepted.'], warnings: [], nodeCount: 0, edgeCount: 0, workflowName: text(value.name), schemaVersion: text(value.schemaVersion) };
    }
    const normalized = normalizeWorkflow(value);
    return {
      valid: true,
      errors: [],
      warnings: normalized.nodes.some((node) => node.type === 'action' && /delete|remove|execute|copy/i.test(node.label)) ? ['An action label mentions execution; the engine still cannot execute it.'] : [],
      nodeCount: normalized.nodes.length,
      edgeCount: normalized.edges.length,
      workflowName: normalized.name,
      schemaVersion: normalized.schemaVersion
    };
  } catch (error) {
    return {
      valid: false,
      errors: [String(error?.message || 'The workflow import is invalid.')],
      warnings: [],
      nodeCount: 0,
      edgeCount: 0,
      workflowName: null,
      schemaVersion: null
    };
  }
}

module.exports = {
  AUTOMATION_TOOLS,
  GATED_OPERATIONS,
  STAGE_DEFINITIONS,
  TEMPLATES,
  NODE_TYPES,
  hostTimezone,
  defaultTrigger,
  defaultQuietHours,
  defaultPolicy,
  normalizeTrigger,
  normalizeWorkflow,
  validateScheduleSpec,
  nextOccurrences,
  validateImport,
  localTimestamp
};
