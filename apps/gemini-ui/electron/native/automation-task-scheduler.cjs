'use strict';

/**
 * KNOuX Gemini - Windows Task Scheduler integration for Automation.
 *
 * Registers, modifies, disables, and removes app-owned scheduled tasks.
 * Uses least-privilege approach: tasks run the KNOuX Electron app with
 * specific arguments. No credentials embedded. No arbitrary command execution.
 */

const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const path = require('node:path');
const crypto = require('node:crypto');

const execFileAsync = promisify(execFile);

const TASK_FOLDER = '\\KNOuX';
const TASK_PREFIX = 'KNOuX-Automation-';
const MAX_TASKS = 20;
const MAX_TASK_NAME_LENGTH = 200;

function taskError(code, message, retryable = false) {
  const error = new Error(message);
  error.code = code;
  error.retryable = retryable;
  return error;
}

function validateTaskName(name) {
  if (!name || typeof name !== 'string') throw taskError('TASK_NAME_INVALID', 'Task name is required.');
  if (name.length > MAX_TASK_NAME_LENGTH) throw taskError('TASK_NAME_INVALID', 'Task name too long.');
  if (!/^[A-Za-z0-9 _.-]+$/.test(name)) throw taskError('TASK_NAME_INVALID', 'Task name contains invalid characters.');
  return name;
}

function validateTrigger(trigger) {
  if (!trigger || typeof trigger !== 'object') throw taskError('TASK_TRIGGER_INVALID', 'Trigger configuration is required.');
  if (trigger.type === 'schedule') {
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(trigger.time || '')) {
      throw taskError('TASK_TRIGGER_INVALID', 'Schedule time must be HH:MM format.');
    }
    if (!Array.isArray(trigger.days) || trigger.days.length === 0) {
      throw taskError('TASK_TRIGGER_INVALID', 'At least one day must be selected.');
    }
    for (const day of trigger.days) {
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        throw taskError('TASK_TRIGGER_INVALID', 'Days must be 0-6 (Sunday-Saturday).');
      }
    }
  } else if (trigger.type === 'startup') {
    // Startup trigger - runs at system startup
  } else {
    throw taskError('TASK_TRIGGER_INVALID', 'Trigger type must be "schedule" or "startup".');
  }
  return true;
}

function buildArguments(workflowId, options = {}) {
  const args = ['--automation-run', workflowId];
  if (options.sourceId) args.push('--source', options.sourceId);
  return args;
}

function getElectronPath() {
  // In development, use the electron binary. In production, use the app executable.
  if (process.env.KNOUX_ELECTRON_PATH) return process.env.KNOUX_ELECTRON_PATH;
  const base = process.resourcesPath || process.cwd();
  const candidates = [
    path.join(base, 'electron.exe'),
    path.join(base, '..', 'electron.exe'),
    path.join(base, '..', '..', 'electron.exe'),
  ];
  for (const candidate of candidates) {
    try {
      require('node:fs').accessSync(candidate);
      return candidate;
    } catch { /* ignore */ }
  }
  // Fallback: assume electron is in PATH
  return 'electron';
}

function getAppEntryPoint() {
  // The main entry point for the automation runner
  return path.join(__dirname, '..', 'main.cjs');
}

class TaskScheduler {
  constructor(options = {}) {
    this.userDataPath = options.userDataPath || path.join(require('node:os').tmpdir(), 'knoux-automation-tasks');
    this.electronPath = options.electronPath || getElectronPath();
    this.appEntry = options.appEntry || getAppEntryPoint();
    this.now = options.now || (() => Date.now());
  }

  async ensureFolder() {
    try {
      await this.runSchTasks(['/Create', '/TN', TASK_FOLDER, '/F', '/RL', 'HIGHEST']);
    } catch (e) {
      // Folder might already exist, ignore
    }
  }

  async runSchTasks(args) {
    const result = await execFileAsync('schtasks.exe', args, {
      windowsHide: true,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });
    return { stdout: String(result?.stdout || ''), stderr: String(result?.stderr || '') };
  }

  async registerTask(workflow) {
    await this.ensureFolder();

    const taskName = `${TASK_PREFIX}${workflow.id}`;
    validateTaskName(taskName);

    const args = buildArguments(workflow.id, { sourceId: workflow.sourceId });
    const program = this.electronPath;
    const fullCommand = `"${program}" "${this.appEntry}" ${args.join(' ')}`;

    let triggerArgs;
    if (workflow.trigger.type === 'schedule') {
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const selectedDays = workflow.trigger.days.map(d => days[d]).join(',');
      triggerArgs = [
        '/SC', 'WEEKLY',
        '/D', selectedDays,
        '/ST', workflow.trigger.time,
      ];
    } else if (workflow.trigger.type === 'startup') {
      triggerArgs = ['/SC', 'ONSTART'];
    } else {
      throw taskError('TASK_TRIGGER_INVALID', 'Unsupported trigger type.');
    }

    const schArgs = [
      '/Create',
      '/TN', `"${TASK_FOLDER}\\${taskName}"`,
      '/TR', fullCommand,
      '/RL', 'HIGHEST',  // Run with highest privileges (UAC prompt if needed)
      '/F',              // Force overwrite if exists
      ...triggerArgs,
    ];

    try {
      await this.runSchTasks(schArgs);
      return { success: true, taskName, taskPath: `${TASK_FOLDER}\\${taskName}` };
    } catch (error) {
      const stderr = error?.stderr || String(error);
      if (/access denied|permission denied|UAC|elevation/i.test(stderr)) {
        throw taskError('TASK_ELEVATION_REQUIRED', 'Windows Task Scheduler requires elevation. Run KNOuX as Administrator to register tasks.', false);
      }
      throw taskError('TASK_REGISTER_FAILED', `Failed to register task: ${stderr}`, true);
    }
  }

  async unregisterTask(workflowId) {
    const taskName = `${TASK_PREFIX}${workflowId}`;
    validateTaskName(taskName);

    try {
      await this.runSchTasks(['/Delete', '/TN', `"${TASK_FOLDER}\\${taskName}"`, '/F']);
      return { success: true, taskName };
    } catch (error) {
      const stderr = error?.stderr || String(error);
      if (/not found|cannot find|system cannot find/i.test(stderr)) {
        return { success: true, taskName, notFound: true };
      }
      throw taskError('TASK_UNREGISTER_FAILED', `Failed to unregister task: ${stderr}`, true);
    }
  }

  async disableTask(workflowId) {
    const taskName = `${TASK_PREFIX}${workflowId}`;
    validateTaskName(taskName);

    try {
      await this.runSchTasks(['/Change', '/TN', `"${TASK_FOLDER}\\${taskName}"`, '/DISABLE']);
      return { success: true, taskName, disabled: true };
    } catch (error) {
      throw taskError('TASK_DISABLE_FAILED', `Failed to disable task: ${error?.stderr || error}`, true);
    }
  }

  async enableTask(workflowId) {
    const taskName = `${TASK_PREFIX}${workflowId}`;
    validateTaskName(taskName);

    try {
      await this.runSchTasks(['/Change', '/TN', `"${TASK_FOLDER}\\${taskName}"`, '/ENABLE']);
      return { success: true, taskName, enabled: true };
    } catch (error) {
      throw taskError('TASK_ENABLE_FAILED', `Failed to enable task: ${error?.stderr || error}`, true);
    }
  }

  async queryTask(workflowId) {
    const taskName = `${TASK_PREFIX}${workflowId}`;
    validateTaskName(taskName);

    try {
      const result = await this.runSchTasks(['/Query', '/TN', `"${TASK_FOLDER}\\${taskName}"`, '/V', '/FO', 'LIST']);
      return { success: true, taskName, output: result.stdout };
    } catch (error) {
      const stderr = error?.stderr || String(error);
      if (/not found|cannot find|system cannot find/i.test(stderr)) {
        return { success: false, taskName, notFound: true };
      }
      throw taskError('TASK_QUERY_FAILED', `Failed to query task: ${stderr}`, true);
    }
  }

  async listAllTasks() {
    try {
      const result = await this.runSchTasks(['/Query', '/TN', TASK_FOLDER, '/FO', 'CSV', '/V']);
      return this.parseTaskList(result.stdout);
    } catch (error) {
      const stderr = error?.stderr || String(error);
      if (/not found|cannot find|system cannot find/i.test(stderr)) {
        return [];
      }
      throw taskError('TASK_LIST_FAILED', `Failed to list tasks: ${stderr}`, true);
    }
  }

  parseTaskList(csvOutput) {
    const lines = csvOutput.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const tasks = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values.length !== headers.length) continue;
      const task = {};
      for (let j = 0; j < headers.length; j++) {
        task[headers[j]] = values[j]?.replace(/"/g, '').trim();
      }
      if (task['TaskName'] && task['TaskName'].startsWith(TASK_PREFIX)) {
        tasks.push(task);
      }
    }
    return tasks;
  }

  parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  async getNextRunTime(workflowId) {
    const taskName = `${TASK_PREFIX}${workflowId}`;
    const query = await this.queryTask(workflowId);
    if (!query.success) return null;

    // Parse Next Run Time from output
    const lines = query.output.split('\n');
    for (const line of lines) {
      if (line.includes('Next Run Time') || line.includes('Next Run')) {
        const match = line.match(/:\s*(.+)$/);
        if (match) return match[1].trim();
      }
    }
    return null;
  }

  async getTaskStatus(workflowId) {
    const query = await this.queryTask(workflowId);
    if (!query.success) return 'not-found';

    const lines = query.output.split('\n');
    for (const line of lines) {
      if (line.includes('Status') || line.includes('State')) {
        const match = line.match(/:\s*(.+)$/);
        if (match) {
          const status = match[1].trim().toLowerCase();
          if (status.includes('running')) return 'running';
          if (status.includes('ready') || status.includes('enabled')) return 'enabled';
          if (status.includes('disabled')) return 'disabled';
        }
      }
    }
    return 'unknown';
  }
}

module.exports = {
  TaskScheduler,
  TASK_FOLDER,
  TASK_PREFIX,
  taskError,
  validateTrigger,
  validateTaskName,
};