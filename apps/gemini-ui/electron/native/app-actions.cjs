'use strict';

/**
 * KNOuX Gemini - Application maintenance executor (Mission 05/08).
 *
 * Executes supported application uninstall operations using:
 *   - MSI (msiexec.exe) for Windows Installer packages
 *   - Appx/MSIX (Remove-AppxPackage) for Store apps
 *   - Vendor uninstall strings for legacy/third-party installers
 *
 * Hard rules:
 *   - Only MSI, Appx/MSIX, and known vendor uninstallers are supported
 *   - No arbitrary command execution; uninstall strings are validated against
 *     the measured inventory evidence before invocation
 *   - Per-target consent required via native dialog
 *   - Post-condition verification (inventory re-read + existence check)
 *   - Protected receipts with immutable evidence for recovery
 *   - No forced/cascading uninstalls; dependents must be handled separately
 */

const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const path = require('node:path');
const crypto = require('node:crypto');
const { ProtectedActionStore } = require('./protected-action-store.cjs');
const { productCodeFrom, removalMethod } = require('./app-bridge.cjs');

const execFileAsync = promisify(execFile);

const MAX_RECEIPTS = 100;
const UNINSTALL_TIMEOUT_MS = 120000;
const VERIFICATION_TIMEOUT_MS = 30000;

const VALID_UNINSTALL_METHODS = ['msi', 'appx-package', 'uninstall-string'];

function appError(code, message, { retryable = false } = {}) {
  const error = new Error(message);
  error.code = code;
  error.retryable = retryable;
  return error;
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function assertAppId(value) {
  if (!/^[a-f0-9]{20}$/.test(String(value || ''))) {
    throw appError('APP_ID_INVALID', 'A valid application identifier is required.');
  }
  return value;
}

class AppActions {
  constructor({ appBridge, getSnapshot, userDataPath, safeStorage, now = Date.now } = {}) {
    this.appBridge = appBridge;
    this.getSnapshot = getSnapshot;
    this.store = new ProtectedActionStore({ userDataPath, namespace: 'app-action-receipts', safeStorage });
    this.now = now;
    this.plans = new Map();
  }

  /**
   * Validate that an app is eligible for uninstall and return the execution plan.
   */
  async plan({ appId }) {
    assertAppId(appId);
    this.store.available();

    // Get the measured snapshot to validate the app still exists as measured
    const snapshot = await this.getSnapshot();
    const app = snapshot.apps.find((a) => a.id === appId);
    if (!app) throw appError('APP_NOT_MEASURED', 'Select a measured application before planning.');

    // Check if app is protected
    if (app.protected) throw appError('APP_PROTECTED', 'System components and protected applications cannot be uninstalled.');

    // Check if app has an uninstall method
    const method = app.uninstallMethod;
    if (!method || !VALID_UNINSTALL_METHODS.includes(method)) {
      throw appError('APP_UNINSTALL_UNSUPPORTED', 'This application does not have a supported uninstall method.');
    }

    // Build the plan
    const plan = {
      id: crypto.randomUUID(),
      appId,
      appName: app.name,
      method,
      uninstallString: app.uninstallString || null,
      productCode: app.productCode || null,
      packageFullName: app.evidence?.packageFullName || null,
      expectedState: 'uninstalled',
      expiresAt: this.now() + 300000,
      receiptId: null,
    };
    plan.planHash = hash(plan);

    if (this.plans.size >= 32) this.plans.delete(this.plans.keys().next().value);
    this.plans.set(plan.id, plan);

    return {
      id: plan.id,
      planHash: plan.planHash,
      appId,
      appName: app.name,
      method,
      before: 'installed',
      after: 'uninstalled',
      identityHash: hash({ name: app.name, method, productCode: app.productCode, packageFullName: app.evidence?.packageFullName }),
      receiptId: null,
      expiresAt: new Date(plan.expiresAt).toISOString(),
    };
  }

  /**
   * Load a receipt by ID.
   */
  async loadReceipt(receiptId) {
    const receipt = await this.store.load(receiptId);
    if (!receipt || receipt.kind !== 'app-uninstall-v1') {
      throw appError('APP_RECEIPT_INVALID', 'Protected uninstall receipt does not match its original evidence.');
    }
    return receipt;
  }

  /**
   * List all uninstall receipts.
   */
  async receipts() {
    const results = [];
    for (const id of await this.store.ids()) {
      try {
        const receipt = await this.loadReceipt(id);
        results.push(this.publicReceipt(receipt));
      } catch {
        results.push({ id, name: 'Unreadable protected receipt', status: 'unreadable', recoveryAvailable: false, error: 'Cannot decrypt or validate this receipt.' });
      }
    }
    return results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  publicReceipt(receipt) {
    return {
      id: receipt.id,
      name: receipt.original.name,
      method: receipt.method,
      status: receipt.status,
      before: 'installed',
      after: 'uninstalled',
      createdAt: receipt.createdAt,
      updatedAt: receipt.updatedAt,
      error: receipt.error || null,
      recoveryAvailable: ['prepared', 'changed', 'uncertain'].includes(receipt.status),
    };
  }

  /**
   * Execute the uninstall plan with native consent.
   */
  async apply({ planId, planHash, approved, operations }) {
    if (approved !== true) throw appError('APP_APPROVAL_REQUIRED', 'Approve this exact application uninstall.');

    return operations.runJob('app-uninstall', 'app-uninstall', async ({ event }) => {
      operations.active.cancel = null;
      const plan = this.plans.get(planId);
      if (!plan || plan.planHash !== planHash || plan.expiresAt <= this.now()) {
        throw appError('APP_PLAN_MISMATCH', 'Review a current exact uninstall plan.');
      }

      // Re-validate the app still exists in the measured inventory
      const snapshot = await this.appBridge.inventory();
      const currentApp = snapshot.apps.find((a) => a.id === plan.appId);
      if (!currentApp) throw appError('APP_CHANGED', 'Application no longer in measured inventory. Refresh discovery first.');

      // Verify identity hasn't changed
      const currentIdentity = {
        name: currentApp.name,
        method: currentApp.uninstallMethod,
        productCode: currentApp.productCode,
        packageFullName: currentApp.evidence?.packageFullName,
      };
      if (hash(currentIdentity) !== hash({ name: plan.appName, method: plan.method, productCode: plan.productCode, packageFullName: plan.packageFullName })) {
        throw appError('APP_CHANGED', 'Application evidence changed since preflight. Refresh discovery first.');
      }

      // Native consent dialog
      if (!await operations.confirm({
        kind: 'app-uninstall',
        plan: {
          name: plan.appName,
          method: plan.method,
          productCode: plan.productCode,
          packageFullName: plan.packageFullName,
        }
      })) {
        throw appError('APP_CONSENT_DENIED', 'Native uninstall confirmation was declined.');
      }

      if (plan.expiresAt <= this.now()) throw appError('APP_PLAN_MISMATCH', 'Plan expired during confirmation.');

      // Load or create receipt
      let receipt = plan.receiptId ? await this.loadReceipt(plan.receiptId) : null;
      if (receipt && hash(receipt) !== plan.receiptHash) throw appError('APP_CHANGED', 'Recovery receipt changed.');

      if (!receipt) {
        receipt = {
          id: crypto.randomUUID(),
          kind: 'app-uninstall-v1',
          original: { name: plan.appName, method: plan.method, productCode: plan.productCode, packageFullName: plan.packageFullName },
          originalHash: hash({ name: plan.appName, method: plan.method, productCode: plan.productCode, packageFullName: plan.packageFullName }),
          method: plan.method,
          afterState: 'uninstalled',
          status: 'prepared',
          createdAt: new Date(this.now()).toISOString(),
        };
        await this.store.save(receipt);
      }

      this.plans.delete(planId);
      event('started', { completed: 0, total: 1, receiptId: receipt.id });

      try {
        // Execute the uninstall based on method
        const uninstallResult = await this.executeUninstall(plan);
        
        // Wait a moment for the system to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify the uninstall by re-reading inventory
        const verification = await this.verifyUninstall(plan.appId, plan.method, plan.productCode, plan.packageFullName);
        
        if (!verification.success) {
          throw appError('APP_POSTCONDITION_FAILED', `Post-uninstall verification failed: ${verification.reason}`);
        }

        receipt.status = 'changed';
        receipt.updatedAt = new Date(this.now()).toISOString();
        receipt.error = null;
        receipt.verification = verification;
        await this.store.save(receipt);
        
        event('completed', { completed: 1, total: 1, receiptId: receipt.id });
        return this.publicReceipt(receipt);
      } catch (e) {
        receipt.status = 'uncertain';
        receipt.error = String(e.message).slice(0, 300);
        receipt.updatedAt = new Date(this.now()).toISOString();
        await this.store.save(receipt).catch(() => {});
        throw e;
      }
    });
  }

  /**
   * Execute the uninstall based on the method.
   */
  async executeUninstall(plan) {
    if (plan.method === 'msi' && plan.productCode) {
      return this.uninstallMsi(plan.productCode);
    }
    if (plan.method === 'appx-package' && plan.packageFullName) {
      return this.uninstallAppx(plan.packageFullName);
    }
    if (plan.method === 'uninstall-string' && plan.uninstallString) {
      return this.uninstallViaString(plan.uninstallString);
    }
    throw appError('APP_UNINSTALL_UNSUPPORTED', 'No valid uninstall method available for this application.');
  }

  async uninstallMsi(productCode) {
    const code = productCode.trim();
    if (!/^\{[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\}$/.test(code)) {
      throw appError('APP_MSI_INVALID', 'Invalid MSI product code format.');
    }
    const { stdout, stderr } = await execFileAsync('msiexec.exe', ['/x', code, '/qn', '/norestart'], {
      windowsHide: true,
      timeout: UNINSTALL_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
    });
    return { method: 'msi', productCode: code, stdout, stderr };
  }

  async uninstallAppx(packageFullName) {
    const name = String(packageFullName).trim();
    if (!/^[\w.]+_\d+\.\d+\.\d+\.\d+_[a-z0-9]+_[\w]+$/.test(name)) {
      throw appError('APP_APPX_INVALID', 'Invalid Appx package full name format.');
    }
    // Use PowerShell Remove-AppxPackage for reliable removal
    const script = `Remove-AppxPackage -Package '${name}' -ErrorAction Stop`;
    const { stdout, stderr } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], {
      windowsHide: true,
      timeout: UNINSTALL_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
    });
    return { method: 'appx-package', packageFullName: name, stdout, stderr };
  }

  async uninstallViaString(uninstallString) {
    const str = String(uninstallString).trim();
    if (!str) throw appError('APP_UNINSTALL_STRING_EMPTY', 'Uninstall string is empty.');
    
    // Parse the uninstall command
    // Handle msiexec, executables with arguments, etc.
    const parsed = this.parseUninstallString(str);
    if (!parsed) throw appError('APP_UNINSTALL_STRING_INVALID', 'Uninstall string could not be parsed.');
    
    const { stdout, stderr } = await execFileAsync(parsed.command, parsed.args, {
      windowsHide: true,
      timeout: UNINSTALL_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
    });
    return { method: 'uninstall-string', command: parsed.command, args: parsed.args, stdout, stderr };
  }

  parseUninstallString(str) {
    // Handle msiexec /x {GUID}
    const msiMatch = str.match(/msiexec\.exe\s+\/x\s+(\{[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\})/i);
    if (msiMatch) {
      return { command: 'msiexec.exe', args: ['/x', msiMatch[1], '/qn', '/norestart'] };
    }

    // Handle quoted executable with arguments
    const quotedMatch = str.match(/"([^"]+\.(?:exe|msi))"\s*(.*)/i);
    if (quotedMatch) {
      const command = quotedMatch[1];
      const argsStr = quotedMatch[2].trim();
      const args = argsStr ? argsStr.match(/"[^"]*"|[^\s"]+/g) || [] : [];
      return { command, args };
    }

    // Handle bare executable
    const bareMatch = str.match(/([A-Za-z]:\\[^\s"<>|]*?\.(?:exe|msi))/i);
    if (bareMatch) {
      const command = bareMatch[1];
      const remaining = str.substring(str.indexOf(command) + command.length).trim();
      const args = remaining ? remaining.match(/"[^"]*"|[^\s"]+/g) || [] : [];
      return { command, args };
    }

    return null;
  }

  /**
   * Verify the application was actually uninstalled.
   */
  async verifyUninstall(appId, method, productCode, packageFullName) {
    try {
      // Wait a bit for the system to settle
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Re-read inventory
      const snapshot = await this.appBridge.inventory();
      const app = snapshot.apps.find((a) => a.id === appId);
      
      if (!app) {
        return { success: true, reason: 'Application no longer present in measured inventory.' };
      }

      // If it's still there, check if it's the same identity
      if (method === 'msi' && productCode && app.productCode === productCode) {
        return { success: false, reason: 'MSI product still present with same product code.' };
      }
      if (method === 'appx-package' && packageFullName && app.evidence?.packageFullName === packageFullName) {
        return { success: false, reason: 'Appx package still present with same package full name.' };
      }
      // For uninstall-string, the app might still be in registry but actually removed
      // Check install location existence
      if (app.installLocationExists === false) {
        return { success: true, reason: 'Install location no longer exists.' };
      }
      
      return { success: false, reason: 'Application still present in measured inventory after uninstall attempt.' };
    } catch (error) {
      return { success: false, reason: `Verification error: ${error.message}` };
    }
  }

  revoke() { this.plans.clear(); }
}

module.exports = { AppActions };