'use strict';
const crypto = require('node:crypto');
const { ProtectedActionStore } = require('./protected-action-store.cjs');
const { nextOccurrences } = require('./automation-providers.cjs');
const { TaskScheduler, TASK_FOLDER, TASK_PREFIX, taskError } = require('./automation-task-scheduler.cjs');

const err = (code, message) => Object.assign(Error(message), { code });
const fingerprint = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function quietNow(workflow, date) {
  const q = workflow.quietHours;
  if (!q?.enabled) return false;
  const day = date.getDay();
  if (q.weekendRule === 'mute' && (day === 0 || day === 6)) return true;
  if (!q.days.includes(day)) return false;
  const minute = date.getHours() * 60 + date.getMinutes();
  const toMinutes = s => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
  const start = toMinutes(q.start);
  const end = toMinutes(q.end);
  return start <= end ? minute >= start && minute < end : minute >= start || minute < end;
}

class AutomationScheduler {
  constructor({ runner, userDataPath, safeStorage, isForeground = () => false, now = Date.now, autoTimers = true }) {
    this.runner = runner;
    this.store = new ProtectedActionStore({ userDataPath, namespace: 'automation-schedules', safeStorage });
    this.isForeground = isForeground;
    this.now = now;
    this.autoTimers = autoTimers;
    this.armed = new Map();  // foreground schedules
    this.backgroundArmed = new Map();  // Windows Task Scheduler tasks
    this.timer = null;
    this.ticking = false;
    this.taskScheduler = new TaskScheduler({ userDataPath });
    // Load persisted background schedules on startup
    this.loadBackgroundSchedules().catch(() => {
      // Background schedule loading failure is non-fatal
    });
  }

  next(workflow) {
    if (workflow.trigger.type !== 'schedule') throw err('AUTOMATION_SCHEDULE_GATED', 'Only typed local schedule triggers can be armed. Startup hooks remain gated.');
    const result = nextOccurrences(workflow.trigger, 1, new Date(this.now()));
    if (!result.valid || !result.next.length) throw err('AUTOMATION_SCHEDULE_INVALID', result.reason || 'No future occurrence.');
    return result.next[0].at;
  }

  async arm({ planId, planHash, approved, background = false }) {
    if (approved !== true) throw err('AUTOMATION_SCHEDULE_APPROVAL_REQUIRED', 'Approve the exact schedule.');
    const plan = this.runner.plans.get(planId);
    if (!plan || plan.planHash !== planHash || plan.expiresAt <= this.now()) throw err('AUTOMATION_PLAN_MISMATCH', 'Review a current workflow plan before arming.');
    if (this.runner.operations.active) throw err('AUTOMATION_BUSY', 'Finish the active operation before arming a schedule.');

    const workflow = await this.runner.saved(plan.workflowId);
    this.runner.validate(workflow);
    if (!workflow.enabled || fingerprint(workflow) !== plan.workflowHash) throw err('AUTOMATION_WORKFLOW_CHANGED', 'Enable and save the workflow, then review its current version.');

    // Register with Windows Task Scheduler for background execution
    if (background) {
      if (this.backgroundArmed.size >= 10) throw err('AUTOMATION_BACKGROUND_LIMIT', 'At most 10 background schedules can be armed.');
      if ([...this.backgroundArmed.values()].some(s => s.workflowId === workflow.id)) throw err('AUTOMATION_BACKGROUND_EXISTS', 'This workflow already has a background schedule.');

      const consent = await this.runner.operations.confirm({
        kind: 'automation-background-schedule',
        plan: { name: workflow.name, workflowId: workflow.id, trigger: workflow.trigger, planHash: plan.planHash }
      });
      if (!consent) throw err('AUTOMATION_CONSENT_DENIED', 'Background schedule confirmation was declined.');

      const taskResult = await this.taskScheduler.registerTask(workflow);
      const record = {
        id: crypto.randomUUID(),
        kind: 'background-automation-schedule-v1',
        workflowId: workflow.id,
        workflowHash: plan.workflowHash,
        name: workflow.name,
        sourceId: plan.sourceId,
        status: 'armed',
        armedAt: new Date(this.now()).toISOString(),
        nextAt: await this.taskScheduler.getNextRunTime(workflow.id),
        lastStatus: null,
        taskName: taskResult.taskName,
        rule: 'Windows Task Scheduler; runs independently of app window; per-run native consent required'
      };
      await this.store.save(record);
      this.backgroundArmed.set(record.id, record);
      this.runner.plans.delete(planId);
      this.event(record, 'armed-background');
      return record;
    }

    // Foreground schedule (existing behavior)
    if (this.armed.size >= 5 || [...this.armed.values()].some(s => s.workflowId === workflow.id)) throw err('AUTOMATION_SCHEDULE_LIMIT', 'Pause an existing matching schedule first; at most five can be armed.');
    const nextAt = this.next(workflow);
    if (!await this.runner.operations.confirm({ kind: 'automation-schedule', plan: { name: workflow.name, nextAt, source: plan.sourceLabel, planHash: plan.planHash } })) throw err('AUTOMATION_CONSENT_DENIED', 'Native foreground schedule confirmation was declined.');
    if (plan.expiresAt <= this.now()) throw err('AUTOMATION_PLAN_MISMATCH', 'Schedule preview expired during confirmation.');
    if (this.runner.plans.get(planId) !== plan || fingerprint(await this.runner.saved(plan.workflowId)) !== plan.workflowHash) throw err('AUTOMATION_WORKFLOW_CHANGED', 'Approval or saved workflow changed during confirmation.');

    const record = {
      id: crypto.randomUUID(),
      kind: 'foreground-observation-schedule-v1',
      workflowId: workflow.id,
      workflowHash: plan.workflowHash,
      name: workflow.name,
      sourceId: plan.sourceId,
      status: 'armed',
      armedAt: new Date(this.now()).toISOString(),
      nextAt,
      lastStatus: null,
      rule: 'Focused app only; quiet hours and power policy; per-run native consent; rearm after restart'
    };
    await this.store.save(record);
    this.armed.set(record.id, record);
    this.runner.plans.delete(planId);
    this.resetTimer();
    this.event(record, 'armed');
    return record;
  }

  async armBackground({ planId, planHash, approved }) {
    return this.arm({ planId, planHash, approved, background: true });
  }

  async list() {
    const result = [];
    // Foreground schedules
    for (const id of await this.store.ids()) {
      try {
        const record = await this.store.load(id);
        if (record.kind === 'foreground-observation-schedule-v1') {
          result.push({ ...record, status: this.armed.has(id) ? 'armed' : record.status === 'armed' ? 'paused-requires-rearm' : record.status });
        } else if (record.kind === 'background-automation-schedule-v1') {
          // Query actual task status from Windows Task Scheduler
          const taskStatus = await this.taskScheduler.getTaskStatus(record.workflowId);
          result.push({ ...record, status: taskStatus });
        }
      } catch {
        result.push({ id, name: 'Unreadable protected schedule', status: 'unreadable' });
      }
    }
    return result;
  }

  async listBackground() {
    const tasks = await this.taskScheduler.listAllTasks();
    return tasks.map(task => ({
      taskName: task.TaskName,
      status: task.Status,
      nextRun: task['Next Run Time'],
      lastRun: task['Last Run Time'],
      taskPath: task['Task Path']
    }));
  }

  async pause({ scheduleId }) {
    const record = await this.store.load(scheduleId);
    if (record.kind === 'foreground-observation-schedule-v1') {
      this.armed.delete(scheduleId);
      record.status = 'paused';
      await this.store.save(record);
      this.resetTimer();
      this.event(record, 'paused');
    } else if (record.kind === 'background-automation-schedule-v1') {
      await this.taskScheduler.disableTask(record.workflowId);
      record.status = 'disabled';
      await this.store.save(record);
      this.backgroundArmed.delete(scheduleId);
      this.event(record, 'paused-background');
    } else {
      throw Error('Schedule identity refused.');
    }
    return record;
  }

  async enableBackground({ scheduleId }) {
    const record = await this.store.load(scheduleId);
    if (record.kind !== 'background-automation-schedule-v1') throw Error('Not a background schedule.');
    await this.taskScheduler.enableTask(record.workflowId);
    record.status = 'armed';
    await this.store.save(record);
    this.backgroundArmed.set(scheduleId, record);
    this.event(record, 'armed-background');
    return record;
  }

  async unregisterBackground({ scheduleId }) {
    const record = await this.store.load(scheduleId);
    if (record.kind !== 'background-automation-schedule-v1') throw Error('Not a background schedule.');
    await this.taskScheduler.unregisterTask(record.workflowId);
    await this.store.remove(scheduleId);
    this.backgroundArmed.delete(scheduleId);
    this.event(record, 'unregistered-background');
    return { success: true, workflowId: record.workflowId };
  }

  event(record, phase) {
    const receiptId = record.lastReceiptId || record.receiptId;
    this.runner.operations.event(record.id, phase, {
      serviceId: phase.includes('background') ? 'auto-schedule-manager-background' : 'auto-schedule-manager',
      provenance: phase.includes('background') ? 'Windows Task Scheduler / background execution' : 'native in-app foreground schedule',
      receiptId
    });
  }

  resetTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (!this.autoTimers || !this.armed.size) return;
    const due = Math.min(...[...this.armed.values()].map(r => Math.max(Date.parse(r.nextAt), r.wakeAt || 0)));
    const wait = Math.min(60000, Math.max(1000, due - this.now()));
    this.timer = setTimeout(() => { void this.tick().catch(() => {}); }, wait);
    this.timer.unref?.();
  }

  async tick() {
    if (this.ticking) return;
    this.ticking = true;
    try {
      for (const record of [...this.armed.values()]) {
        if (Date.parse(record.nextAt) > this.now() || (record.wakeAt || 0) > this.now()) continue;
        const previous = record.lastStatus;
        try {
          const workflow = await this.runner.saved(record.workflowId);
          if (!workflow.enabled || fingerprint(workflow) !== record.workflowHash) throw err('AUTOMATION_WORKFLOW_CHANGED', 'Saved workflow changed; review and rearm.');
          if (!this.isForeground() || this.runner.operations.active || this.runner.operations.studio.engine.isBusy()) { record.lastStatus = 'deferred-foreground-or-busy'; record.wakeAt = this.now() + 60000; continue; }
          if (quietNow(workflow, new Date(this.now()))) { record.lastStatus = 'deferred-quiet-hours'; record.wakeAt = this.now() + 60000; continue; }
          if (workflow.policy.acOnly || workflow.policy.batteryThreshold > 0) {
            const power = await this.runner.automation.runtimeEvidence();
            if (workflow.policy.acOnly && !['AC', 'Battery'].includes(power.powerSource)) throw err('AUTOMATION_POWER_OWNER_ACTION_REQUIRED', 'AC evidence is unavailable; review the saved power policy.');
            if (workflow.policy.acOnly && power.powerSource !== 'AC') { record.lastStatus = 'deferred-ac-required'; record.wakeAt = this.now() + 60000; continue; }
            if (workflow.policy.batteryThreshold > 0 && (!power.batteryAvailable || !Number.isFinite(power.batteryChargePercent))) throw err('AUTOMATION_POWER_OWNER_ACTION_REQUIRED', 'Battery evidence is unavailable. Adjust the saved power policy deliberately, then rearm.');
            if (workflow.policy.batteryThreshold > 0 && power.batteryChargePercent < workflow.policy.batteryThreshold) { record.lastStatus = 'deferred-low-battery'; record.wakeAt = this.now() + 60000; continue; }
          }
          const plan = await this.runner.plan({ workflowId: record.workflowId, ...(record.sourceId ? { sourceId: record.sourceId } : {}) });
          const receipt = await this.runner.run({ planId: plan.id, planHash: plan.planHash, approved: true }, { scheduleId: record.id });
          record.lastReceiptId = receipt.id;
          record.lastStatus = receipt.status;
          record.lastRunAt = new Date(this.now()).toISOString();
          record.nextAt = this.next(workflow);
          record.wakeAt = null;
        } catch (e) {
          record.lastStatus = e.code || 'AUTOMATION_SCHEDULE_FAILED';
          record.error = String(e.message).slice(0, 300);
          if (e.code === 'AUTOMATION_CONSENT_DENIED') { record.nextAt = this.next(await this.runner.saved(record.workflowId)); record.wakeAt = null; }
          else { record.status = 'paused-needs-review'; this.armed.delete(record.id); }
        } finally {
          await this.store.save(record);
          if (previous !== record.lastStatus) this.event(record, record.status === 'armed' ? 'waiting' : 'gated');
        }
      }
    } finally {
      this.ticking = false;
      this.resetTimer();
    }
  }

  async loadBackgroundSchedules() {
    // Load persisted background schedules on startup
    const tasks = await this.taskScheduler.listAllTasks();
    for (const task of tasks) {
      if (task.TaskName?.startsWith(TASK_PREFIX)) {
        const workflowId = task.TaskName.slice(TASK_PREFIX.length);
        this.backgroundArmed.set(workflowId, { workflowId, taskName: task.TaskName, status: task.Status });
      }
    }
  }

  pauseAll() {
    this.armed.clear();
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  dispose() {
    this.pauseAll();
  }
}

module.exports = { AutomationScheduler, quietNow };