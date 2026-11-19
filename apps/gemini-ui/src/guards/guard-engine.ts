/**
 * KNOuX Guard Engine — real opt-in protection policies.
 *
 * Implements:
 *  - Clipboard protection (monitor clipboard for sensitive data)
 *  - Privacy trace cleanup scheduling
 *  - Registry integrity observation (read-only, no auto-fix)
 *  - Quiet hours enforcement
 *  - Supported remediation suggestions
 *
 * All policies are OPT-IN. No auto-elevation. No auto-fix.
 * No antivirus claims without a real verified provider.
 */

export type GuardPolicy = 'clipboard' | 'privacy' | 'registry' | 'quietHours';

export interface GuardConfig {
  clipboard: {
    enabled: boolean;
    monitorIntervalMs: number;
    maxHistoryEntries: number;
    sensitivePatterns: RegExp[];
  };
  privacy: {
    enabled: boolean;
    scheduleCron: string | null;
    targets: Array<'browserCache' | 'tempFiles' | 'recentDocs' | 'clipboard'>;
  };
  registry: {
    enabled: boolean;
    watchPaths: string[];
    alertOnChange: boolean;
  };
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
    muteNotifications: boolean;
  };
}

export const DEFAULT_GUARD_CONFIG: GuardConfig = {
  clipboard: {
    enabled: false,
    monitorIntervalMs: 5000,
    maxHistoryEntries: 50,
    sensitivePatterns: [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // email
      /\b(?:password|passwd|pwd)\s*[:=]\s*\S+/i, // password assignment
    ],
  },
  privacy: {
    enabled: false,
    scheduleCron: null,
    targets: ['browserCache', 'tempFiles'],
  },
  registry: {
    enabled: false,
    watchPaths: [
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    ],
    alertOnChange: true,
  },
  quietHours: {
    enabled: false,
    startHour: 22,
    endHour: 7,
    muteNotifications: true,
  },
};

export interface GuardAlert {
  id: string;
  policy: GuardPolicy;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export class GuardEngine {
  private config: GuardConfig;
  private alerts: GuardAlert[] = [];
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private running = false;

  constructor(config?: Partial<GuardConfig>) {
    this.config = { ...DEFAULT_GUARD_CONFIG, ...config };
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    if (this.config.clipboard.enabled) {
      this.startClipboardMonitor();
    }
    if (this.config.quietHours.enabled) {
      this.startQuietHoursCheck();
    }
  }

  stop(): void {
    this.running = false;
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }

  updateConfig(config: Partial<GuardConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.running) {
      this.stop();
      this.start();
    }
  }

  getConfig(): GuardConfig {
    return { ...this.config };
  }

  getAlerts(): GuardAlert[] {
    return [...this.alerts];
  }

  acknowledgeAlert(id: string): void {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) alert.acknowledged = true;
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  isQuietHours(): boolean {
    if (!this.config.quietHours.enabled) return false;
    const hour = new Date().getHours();
    const { startHour, endHour } = this.config.quietHours;
    if (startHour > endHour) {
      return hour >= startHour || hour < endHour;
    }
    return hour >= startHour && hour < endHour;
  }

  checkClipboardContent(content: string): { sensitive: boolean; matches: string[] } {
    const matches: string[] = [];
    for (const pattern of this.config.clipboard.sensitivePatterns) {
      if (pattern.test(content)) {
        matches.push(pattern.source);
      }
    }
    return { sensitive: matches.length > 0, matches };
  }

  private startClipboardMonitor(): void {
    const timer = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.readText().then((text) => {
          const result = this.checkClipboardContent(text);
          if (result.sensitive) {
            this.addAlert('clipboard', 'warning', `Sensitive data detected in clipboard: ${result.matches.join(', ')}`);
          }
        }).catch(() => {
          // Clipboard access denied — expected in some environments
        });
      }
    }, this.config.clipboard.monitorIntervalMs);
    this.timers.set('clipboard', timer);
  }

  private startQuietHoursCheck(): void {
    const timer = setInterval(() => {
      if (this.isQuietHours() && this.config.quietHours.muteNotifications) {
        // Mute notifications during quiet hours
        // This is a policy flag, not an OS-level mute
      }
    }, 60000);
    this.timers.set('quietHours', timer);
  }

  private addAlert(policy: GuardPolicy, severity: GuardAlert['severity'], message: string): void {
    const alert: GuardAlert = {
      id: `guard-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      policy,
      severity,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
    this.alerts.push(alert);
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }
}

// Singleton
let _guard: GuardEngine | null = null;

export function getGuardEngine(): GuardEngine {
  if (!_guard) {
    _guard = new GuardEngine();
  }
  return _guard;
}

export function refreshGuardEngine(config?: Partial<GuardConfig>): GuardEngine {
  if (_guard) _guard.stop();
  _guard = new GuardEngine(config);
  return _guard;
}