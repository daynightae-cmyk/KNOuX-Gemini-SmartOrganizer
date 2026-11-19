/**
 * KNOuX Engine Profile — real application-owned worker concurrency,
 * scheduling and resource budgets.
 *
 * This is NOT a fake performance boost. It controls:
 *  - max concurrent workers for scan/processing operations
 *  - RAM budget for background caching
 *  - CPU thread allocation for native worker pools
 *  - idle/silent mode scheduling
 *
 * Settings are persisted via SettingsProfile and applied at runtime.
 * No overclocking, no hardware control, no fake boosts.
 */

import { loadSettingsProfile, type SettingsProfile } from '../settings/profile';

export type EngineMode = 'turbo' | 'balanced' | 'silent';

export interface EngineBudget {
  /** Maximum concurrent workers for scan/processing */
  maxWorkers: number;
  /** RAM budget in MB for background caching */
  ramBudgetMB: number;
  /** CPU thread count for native worker pools */
  cpuThreads: number;
  /** Whether to run at low priority (silent mode) */
  lowPriority: boolean;
  /** Idle timeout before pausing background work (ms) */
  idleTimeoutMs: number;
}

const MODE_DEFAULTS: Record<EngineMode, { maxWorkers: number; ramFraction: number; lowPriority: boolean; idleTimeoutMs: number }> = {
  turbo: { maxWorkers: 8, ramFraction: 0.5, lowPriority: false, idleTimeoutMs: 30000 },
  balanced: { maxWorkers: 4, ramFraction: 0.25, lowPriority: false, idleTimeoutMs: 15000 },
  silent: { maxWorkers: 2, ramFraction: 0.1, lowPriority: true, idleTimeoutMs: 5000 },
};

export function computeEngineBudget(profile: SettingsProfile): EngineBudget {
  const mode = profile.engineMode as EngineMode;
  const defaults = MODE_DEFAULTS[mode] || MODE_DEFAULTS.balanced;
  const cpuThreads = parseInt(profile.cpuThreads, 10) || 8;
  const ramLimitGB = Math.max(1, Math.min(16, profile.ramLimitGB || 4));
  const ramBudgetMB = Math.round(ramLimitGB * 1024 * defaults.ramFraction);

  return {
    maxWorkers: Math.min(defaults.maxWorkers, cpuThreads),
    ramBudgetMB,
    cpuThreads,
    lowPriority: defaults.lowPriority,
    idleTimeoutMs: defaults.idleTimeoutMs,
  };
}

export function loadEngineBudget(): EngineBudget {
  return computeEngineBudget(loadSettingsProfile());
}

/**
 * A real worker pool that respects the engine budget.
 * Used by scan, cleanup, storage and other processing operations.
 */
export class EngineWorkerPool {
  private budget: EngineBudget;
  private activeWorkers = 0;
  private queue: Array<() => Promise<void>> = [];
  private paused = false;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(budget?: EngineBudget) {
    this.budget = budget || loadEngineBudget();
  }

  updateBudget(budget: EngineBudget): void {
    this.budget = budget;
  }

  getBudget(): EngineBudget {
    return { ...this.budget };
  }

  async execute<T>(task: () => Promise<T>): Promise<T> {
    if (this.paused) {
      throw new Error('Engine worker pool is paused (silent mode idle timeout)');
    }

    if (this.activeWorkers >= this.budget.maxWorkers) {
      await new Promise<void>((resolve) => {
        this.queue.push(async () => { resolve(); });
      });
    }

    this.activeWorkers++;
    this.resetIdleTimer();

    try {
      return await task();
    } finally {
      this.activeWorkers--;
      this.drainQueue();
    }
  }

  private drainQueue(): void {
    if (this.queue.length > 0 && this.activeWorkers < this.budget.maxWorkers) {
      const next = this.queue.shift();
      if (next) next();
    }
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.budget.lowPriority) {
      this.idleTimer = setTimeout(() => {
        this.paused = true;
      }, this.budget.idleTimeoutMs);
    }
  }

  resume(): void {
    this.paused = false;
    this.resetIdleTimer();
  }

  pause(): void {
    this.paused = true;
    if (this.idleTimer) clearTimeout(this.idleTimer);
  }

  getActiveCount(): number {
    return this.activeWorkers;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isPaused(): boolean {
    return this.paused;
  }
}

// Singleton instance
let _pool: EngineWorkerPool | null = null;

export function getEnginePool(): EngineWorkerPool {
  if (!_pool) {
    _pool = new EngineWorkerPool();
  }
  return _pool;
}

export function refreshEnginePool(): EngineWorkerPool {
  _pool = new EngineWorkerPool(loadEngineBudget());
  return _pool;
}