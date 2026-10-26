/**
 * KNOuX Live Pulse - deterministic presentation model (Mission 10).
 *
 * Pure formatting, filtering and geometry helpers. No function in this file
 * invents a measured value: missing readings return '-', empty arrays stay
 * empty, and unsupported sensors remain explicitly unavailable.
 */
import type {
  NetworkInterfaceInfo,
  NetworkSocket,
  SystemEventRecord,
  SystemMetrics,
  SystemProcess,
  SystemUsbNode,
  SystemWorld,
} from '../../shared/native-contracts';
import type { SystemLocale, SystemServiceState } from './catalog';

const NUMBER = new Intl.NumberFormat('en-US');
const ONE_DECIMAL = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function t(locale: SystemLocale, en: string, ar: string): string {
  return locale === 'ar' ? ar : en;
}

export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return NUMBER.format(Math.round(value));
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return `${value.toFixed(digits)}%`;
}

export function formatBytes(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 0) return '-';
  if (value < 1024) return `${Math.round(value)} B`;
  const units = ['KB', 'MB', 'GB', 'TB', 'PB'];
  let size = value / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size >= 100 ? size.toFixed(0) : ONE_DECIMAL.format(size)} ${units[unit]}`;
}

export function formatRate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 0) return '-';
  return `${formatBytes(value)}/s`;
}

export function formatMHz(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '-';
  if (value >= 1000) return `${ONE_DECIMAL.format(value / 1000)} GHz`;
  return `${Math.round(value)} MHz`;
}

export function formatMs(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-';
  if (value >= 1000) return `${ONE_DECIMAL.format(value / 1000)} s`;
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ms`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '-';
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${total % 60}s`;
  return `${total}s`;
}

export function formatClock(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '--:--:--';
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const clock = [hours, minutes, secs].map((part) => String(part).padStart(2, '0')).join(':');
  return days > 0 ? `${days}d ${clock}` : clock;
}

export function formatTimestamp(value: string | null | undefined, locale: SystemLocale): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(value: string | null | undefined, locale: SystemLocale): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function formatTime(value: string | null | undefined, locale: SystemLocale): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function formatRelative(value: string | null | undefined, locale: SystemLocale): string {
  if (!value) return '-';
  const at = new Date(value).getTime();
  if (!Number.isFinite(at)) return '-';
  const diff = Math.round((at - Date.now()) / 1000);
  const abs = Math.abs(diff);
  let amount: number;
  let unit: Intl.RelativeTimeFormatUnit;
  if (abs < 60) {
    amount = diff;
    unit = 'second';
  } else if (abs < 3600) {
    amount = Math.round(diff / 60);
    unit = 'minute';
  } else if (abs < 86400) {
    amount = Math.round(diff / 3600);
    unit = 'hour';
  } else {
    amount = Math.round(diff / 86400);
    unit = 'day';
  }
  return new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar' : 'en', { numeric: 'auto' }).format(amount, unit);
}

export type Tone = 'good' | 'warn' | 'bad' | 'muted' | 'info' | 'violet';

export const SERVICE_STATE_META: Record<
  SystemServiceState,
  { en: string; ar: string; tone: Tone }
> = {
  available: { en: 'Available', ar: 'متاح', tone: 'good' },
  partial: { en: 'Partial', ar: 'جزئي', tone: 'warn' },
  gated: { en: 'Gated', ar: 'محمي', tone: 'bad' },
};

export const EVENT_LEVEL_META: Record<
  number,
  { en: string; ar: string; tone: Tone; short: string }
> = {
  1: { en: 'Critical', ar: 'حرج', tone: 'bad', short: 'CRT' },
  2: { en: 'Error', ar: 'خطأ', tone: 'bad', short: 'ERR' },
  3: { en: 'Warning', ar: 'تحذير', tone: 'warn', short: 'WRN' },
  4: { en: 'Information', ar: 'معلومات', tone: 'info', short: 'INF' },
  5: { en: 'Verbose', ar: 'تفصيلي', tone: 'muted', short: 'VRB' },
};

export function eventLevelMeta(level: number | null | undefined): { en: string; ar: string; tone: Tone; short: string } {
  if (level != null && EVENT_LEVEL_META[level]) return EVENT_LEVEL_META[level];
  return { en: 'Unknown', ar: 'غير معروف', tone: 'muted', short: 'UNK' };
}

export const PROCESS_SIGNATURE_META: Record<string, { en: string; ar: string; tone: Tone }> = {
  valid: { en: 'Valid signature', ar: 'توقيع صالح', tone: 'good' },
  validbutuntrustedroot: { en: 'Untrusted root', ar: 'جذر غير موثوق', tone: 'warn' },
  unknownerror: { en: 'Signature error', ar: 'خطأ في التوقيع', tone: 'warn' },
  notsigned: { en: 'Unsigned', ar: 'غير موقع', tone: 'bad' },
  unsigned: { en: 'Unsigned', ar: 'غير موقع', tone: 'bad' },
  unavailable: { en: 'Not checked', ar: 'لم يُفحص', tone: 'muted' },
};

export function signatureMeta(status: string | null | undefined): { en: string; ar: string; tone: Tone } {
  const key = String(status || '').toLowerCase().replace(/[^a-z]/g, '');
  if (PROCESS_SIGNATURE_META[key]) return PROCESS_SIGNATURE_META[key];
  if (!status) return PROCESS_SIGNATURE_META.unavailable;
  return { en: status, ar: status, tone: 'muted' };
}

export function serviceStateTone(state: SystemServiceState): Tone {
  return SERVICE_STATE_META[state].tone;
}

export function percent(value: number | null | undefined, total: number | null | undefined): number | null {
  if (value == null || total == null || !Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return null;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

export function finiteOrNull(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? value : null;
}

export function maxOf(values: Array<number | null | undefined>): number | null {
  let peak: number | null = null;
  for (const value of values) {
    if (value != null && Number.isFinite(value) && (peak == null || value > peak)) peak = value;
  }
  return peak;
}

export function minOf(values: Array<number | null | undefined>): number | null {
  let low: number | null = null;
  for (const value of values) {
    if (value != null && Number.isFinite(value) && (low == null || value < low)) low = value;
  }
  return low;
}

export function averageOf(values: Array<number | null | undefined>): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (!finite.length) return null;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

export function latestOf(values: Array<number | null | undefined>): number | null {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (value != null && Number.isFinite(value)) return value;
  }
  return null;
}

export type MetricKey =
  | 'cpuPercent'
  | 'memoryPercent'
  | 'diskReadBytesPerSec'
  | 'diskWriteBytesPerSec'
  | 'networkInBytesPerSec'
  | 'networkOutBytesPerSec'
  | 'processCount'
  | 'threadCount'
  | 'handleCount'
  | 'cpuFrequencyMHz'
  | 'memoryUsedBytes'
  | 'diskLatencyMs';

export function metricValues(series: SystemMetrics[], key: MetricKey): Array<number | null> {
  return series.map((sample) => (sample[key] == null ? null : Number(sample[key])));
}

export interface SparkGeometry {
  line: string;
  area: string;
  points: Array<{ x: number; y: number }>;
  min: number;
  max: number;
}

/**
 * Builds a sparkline path while preserving gaps for missing samples. A null
 * reading never becomes zero. When fewer than two finite readings exist, the
 * geometry is empty and the UI shows an unsupported/awaiting state.
 */
export function sparkGeometry(
  values: Array<number | null | undefined>,
  width = 240,
  height = 64,
  padding = 4,
): SparkGeometry {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (finite.length < 2 || width <= padding * 2 || height <= padding * 2) {
    return { line: '', area: '', points: [], min: 0, max: 0 };
  }
  const rawMin = Math.min(...finite);
  const rawMax = Math.max(...finite);
  const span = rawMax - rawMin || Math.max(1, Math.abs(rawMax) * 0.1);
  const min = rawMin;
  const max = rawMax === rawMin ? rawMin + span : rawMax;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;
  const points: Array<{ x: number; y: number }> = [];
  const segments: string[] = [];
  let current: string[] = [];
  values.forEach((value, index) => {
    if (value == null || !Number.isFinite(value)) {
      if (current.length) {
        segments.push(`M${current.join(' L')}`);
        current = [];
      }
      return;
    }
    const x = padding + (values.length <= 1 ? usableW / 2 : (index / (values.length - 1)) * usableW);
    const y = padding + usableH - ((value - min) / (max - min)) * usableH;
    points.push({ x, y });
    current.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  });
  if (current.length) segments.push(`M${current.join(' L')}`);
  const line = segments.join(' ');
  const first = points[0];
  const last = points[points.length - 1];
  const area = first && last
    ? `${line} L${last.x.toFixed(2)} ${(height - padding).toFixed(2)} L${first.x.toFixed(2)} ${(height - padding).toFixed(2)} Z`
    : '';
  return { line, area, points, min, max };
}

export type ProcessSort = 'cpu' | 'memory' | 'pid' | 'name' | 'threads';

export function sortProcesses(processes: SystemProcess[], sort: ProcessSort, direction: 'asc' | 'desc' = 'desc'): SystemProcess[] {
  const factor = direction === 'asc' ? 1 : -1;
  const value = (process: SystemProcess): number | string => {
    switch (sort) {
      case 'memory':
        return process.workingSetBytes ?? -1;
      case 'pid':
        return process.pid;
      case 'name':
        return process.name.toLowerCase();
      case 'threads':
        return process.threads ?? -1;
      default:
        return process.cpuPercent ?? -1;
    }
  };
  return [...processes].sort((left, right) => {
    const a = value(left);
    const b = value(right);
    if (typeof a === 'string' || typeof b === 'string') {
      const result = String(a).localeCompare(String(b));
      return result === 0 ? left.pid - right.pid : result * factor;
    }
    return a === b ? left.pid - right.pid : (a - b) * factor;
  });
}

export function filterProcesses(processes: SystemProcess[], query: string): SystemProcess[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return processes;
  return processes.filter((process) =>
    [
      process.name,
      process.executablePath,
      String(process.pid),
      process.owner,
      process.company,
      process.description,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle)),
  );
}

export function filterEvents(
  events: SystemEventRecord[],
  options: { query?: string; levels?: number[]; channel?: string },
): SystemEventRecord[] {
  const needle = (options.query || '').trim().toLowerCase();
  return events.filter((event) => {
    if (options.channel && event.channel !== options.channel) return false;
    if (options.levels?.length && (event.level == null || !options.levels.includes(event.level))) return false;
    if (needle) {
      const haystack = `${event.provider} ${event.message} ${event.eventId ?? ''} ${event.levelName ?? ''} ${event.channel}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function filterSockets(
  sockets: NetworkSocket[],
  options: { protocol?: 'all' | 'TCP' | 'UDP'; state?: 'all' | 'listening' | 'established'; query?: string },
): NetworkSocket[] {
  const needle = (options.query || '').trim().toLowerCase();
  return sockets.filter((socket) => {
    if (options.protocol && options.protocol !== 'all' && socket.protocol !== options.protocol) return false;
    if (options.state === 'listening' && socket.state !== 'LISTEN') return false;
    if (options.state === 'established' && socket.state !== 'ESTABLISHED') return false;
    if (needle) {
      const haystack = `${socket.localAddress}:${socket.localPort ?? ''} ${socket.remoteAddress ?? ''}:${socket.remotePort ?? ''} ${socket.processName ?? ''} ${socket.pid ?? ''}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function activeInterfaces(interfaces: NetworkInterfaceInfo[]): NetworkInterfaceInfo[] {
  return interfaces.filter((entry) => String(entry.status || '').toLowerCase() === 'up');
}

export function interfaceAddress(entry: NetworkInterfaceInfo): string | null {
  const v4 = entry.ipv4.find((address) => address.address);
  if (v4) return v4.address;
  const v6 = entry.ipv6.find((address) => address.address && !address.address.startsWith('fe80'));
  return v6?.address || null;
}

export function interfaceKind(entry: NetworkInterfaceInfo): 'physical' | 'virtual' | 'unknown' {
  if (entry.virtual === true) return 'virtual';
  if (entry.virtual === false) return 'physical';
  return 'unknown';
}

export interface UsbTreeNode {
  node: SystemUsbNode;
  depth: number;
}

export function flattenUsbTree(nodes: SystemUsbNode[]): UsbTreeNode[] {
  const byParent = new Map<string | null, SystemUsbNode[]>();
  const ids = new Set(nodes.map((node) => node.id));
  for (const node of nodes) {
    const parent = node.parentId && ids.has(node.parentId) ? node.parentId : null;
    const list = byParent.get(parent) || [];
    list.push(node);
    byParent.set(parent, list);
  }
  const result: UsbTreeNode[] = [];
  const visited = new Set<string>();
  const walk = (parent: string | null, depth: number) => {
    const list = (byParent.get(parent) || []).slice().sort((a, b) => {
      const rank = { controller: 0, hub: 1, device: 2 } as Record<string, number>;
      return (rank[a.nodeType] ?? 3) - (rank[b.nodeType] ?? 3) || a.name.localeCompare(b.name);
    });
    for (const node of list) {
      if (visited.has(node.id)) continue;
      visited.add(node.id);
      result.push({ node, depth });
      walk(node.id, depth + 1);
    }
  };
  walk(null, 0);
  for (const node of nodes) {
    if (!visited.has(node.id)) result.push({ node, depth: 0 });
  }
  return result;
}

export function sanitizeTargetDraft(value: string): string {
  return value.trim().slice(0, 253);
}

export function isSafeTargetDraft(value: string): boolean {
  const target = value.trim();
  if (!target || target.length > 253) return false;
  if (/[\s;&|<>`$'"\\%]/.test(target)) return false;
  return /^[A-Za-z0-9][A-Za-z0-9.:-]*$/.test(target);
}

export function worldFromService(id: string): SystemWorld {
  if (id.startsWith('network-')) return 'network';
  if (id.startsWith('hardware-')) return 'hardware';
  return 'system';
}

export function safeFileName(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

export function bytesToMegabytes(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value / (1024 * 1024);
}

export function percentageTone(value: number | null | undefined, warn = 70, bad = 88): Tone {
  if (value == null || !Number.isFinite(value)) return 'muted';
  if (value >= bad) return 'bad';
  if (value >= warn) return 'warn';
  return 'good';
}

export function socketKey(socket: NetworkSocket): string {
  return socket.id || `${socket.protocol}:${socket.localAddress}:${socket.localPort}:${socket.remoteAddress || '*'}:${socket.remotePort || '*'}`;
}

export function timelineLaneCount(events: Array<{ lane: string }>, lane: string): number {
  return events.filter((event) => event.lane === lane).length;
}
