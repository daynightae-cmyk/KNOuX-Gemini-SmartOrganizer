/**
 * KNOuX Live Pulse - shared observatory primitives (Mission 10).
 *
 * Presentational only. These primitives never synthesize a reading; callers
 * pass measured values or null, and null is rendered as an explicit unknown.
 */
import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Loader2,
  Search,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { SystemLocale } from './catalog';
import { SERVICE_BY_ID } from './catalog';
import { SERVICE_STATE_META, sparkGeometry, t, type Tone } from './model';

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function toneClass(tone: Tone | undefined): string {
  return tone ? `sys-tone-${tone}` : '';
}

export function Chip({
  children,
  tone = 'muted',
  icon: Icon,
  title,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
  title?: string;
  className?: string;
}) {
  return (
    <span className={cx('sys-chip', `sys-chip-${tone}`, className)} title={title}>
      {Icon ? <Icon className="sys-chip-icon" aria-hidden="true" /> : null}
      <span className="sys-chip-text">{children}</span>
    </span>
  );
}

export function Panel({
  title,
  sub,
  actions,
  children,
  className,
  bodyClassName,
  icon: Icon,
}: {
  title?: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  icon?: LucideIcon;
}) {
  return (
    <section className={cx('sys-panel', className)}>
      {title || sub || actions ? (
        <header className="sys-panel-head">
          <div className="sys-panel-heading">
            {Icon ? (
              <span className="sys-panel-icon" aria-hidden="true">
                <Icon />
              </span>
            ) : null}
            <div className="sys-panel-copy">
              {title ? <h3 className="sys-panel-title">{title}</h3> : null}
              {sub ? <p className="sys-panel-sub">{sub}</p> : null}
            </div>
          </div>
          {actions ? <div className="sys-panel-tools">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx('sys-panel-body', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  value,
  hint,
  mono = false,
  tone,
  className,
  icon: Icon,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  mono?: boolean;
  tone?: Tone;
  className?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className={cx('sys-field', className)}>
      <span className="sys-field-label">
        {Icon ? <Icon aria-hidden="true" /> : null}
        {label}
      </span>
      <strong className={cx('sys-field-value', mono && 'sys-mono', toneClass(tone))} title={typeof value === 'string' ? value : undefined}>
        {value}
      </strong>
      {hint ? <em className="sys-field-hint">{hint}</em> : null}
    </div>
  );
}

export function KeyValueGrid({ children, columns = 2 }: { children: ReactNode; columns?: 1 | 2 | 3 | 4 }) {
  return <div className={cx('sys-kv-grid', `sys-kv-grid-${columns}`)}>{children}</div>;
}

export function EmptyBlock({
  title,
  message,
  icon: Icon,
  compact = false,
}: {
  title: ReactNode;
  message: ReactNode;
  icon?: LucideIcon;
  compact?: boolean;
}) {
  return (
    <div className={cx('sys-empty', compact && 'is-compact')}>
      {Icon ? (
        <span className="sys-empty-icon" aria-hidden="true">
          <Icon />
        </span>
      ) : null}
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

export function LoadingLine({ label }: { label: ReactNode }) {
  return (
    <div className="sys-loading-line" role="status">
      <Loader2 className="sys-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Sparkline({
  values,
  color = '#22d3ee',
  height = 62,
  className,
  label,
  showArea = true,
}: {
  values: Array<number | null | undefined>;
  color?: string;
  height?: number;
  className?: string;
  label?: string;
  showArea?: boolean;
}) {
  const width = 260;
  const geometry = useMemo(() => sparkGeometry(values, width, height, 4), [height, values]);
  const id = useMemo(() => `sys-spark-${Math.random().toString(36).slice(2, 9)}`, []);
  if (!geometry.line) {
    return (
      <div className={cx('sys-spark-empty', className)} style={{ height }} role="img" aria-label={label || 'No measured samples'}>
        <span>—</span>
      </div>
    );
  }
  return (
    <svg
      className={cx('sys-spark', className)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label || 'Measured sample series'}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.33" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea && geometry.area ? <path d={geometry.area} fill={`url(#${id})`} /> : null}
      <path d={geometry.line} fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
      {geometry.points.length ? (
        <circle cx={geometry.points[geometry.points.length - 1].x} cy={geometry.points[geometry.points.length - 1].y} r="2.2" fill={color} />
      ) : null}
    </svg>
  );
}

export function Gauge({
  value,
  label,
  sub,
  color = '#22d3ee',
  size = 116,
  unit = '%',
}: {
  value: number | null | undefined;
  label: ReactNode;
  sub?: ReactNode;
  color?: string;
  size?: number;
  unit?: string;
}) {
  const safe = value != null && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dash = safe == null ? 0 : (safe / 100) * circumference;
  return (
    <div className="sys-gauge" style={{ width: size }}>
      <svg viewBox="0 0 100 100" className="sys-gauge-svg" role="img" aria-label={`${typeof label === 'string' ? label : 'Metric'}: ${safe == null ? 'unknown' : `${safe.toFixed(1)}${unit}`}`}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="sys-gauge-track" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 50 50)"
          className="sys-gauge-value"
        />
        <circle cx="50" cy="50" r="34" fill="none" stroke={color} strokeWidth="0.6" opacity="0.16" />
      </svg>
      <div className="sys-gauge-center">
        <strong style={{ color }}>{safe == null ? '—' : `${safe >= 100 ? Math.round(safe) : safe.toFixed(safe < 10 ? 1 : 0)}${unit}`}</strong>
        <span>{label}</span>
      </div>
      {sub ? <em className="sys-gauge-sub">{sub}</em> : null}
    </div>
  );
}

export function MeterBar({
  value,
  max = 100,
  tone = 'info',
  label,
  caption,
  height = 7,
}: {
  value: number | null | undefined;
  max?: number;
  tone?: Tone;
  label?: ReactNode;
  caption?: ReactNode;
  height?: number;
}) {
  const safe = value != null && Number.isFinite(value) && max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : null;
  return (
    <div className="sys-meter">
      {label || caption ? (
        <div className="sys-meter-head">
          <span>{label}</span>
          <em>{caption ?? (safe == null ? '—' : `${safe.toFixed(0)}%`)}</em>
        </div>
      ) : null}
      <div className="sys-meter-track" style={{ height }}>
        <span className={cx('sys-meter-fill', `is-${tone}`)} style={{ width: `${safe ?? 0}%` }} />
      </div>
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  ariaLabel,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  return (
    <label className="sys-search">
      <Search aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        disabled={disabled}
        spellCheck={false}
      />
    </label>
  );
}

export function Seg<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  compact = false,
  disabled = false,
}: {
  value: T;
  options: Array<{ value: T; label: ReactNode; title?: string; disabled?: boolean }>;
  onChange: (value: T) => void;
  ariaLabel: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className={cx('sys-seg', compact && 'is-compact')} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={cx('sys-seg-button', option.value === value && 'is-active')}
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
          title={option.title}
          disabled={disabled || option.disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cx('sys-toggle', disabled && 'is-disabled')}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
      <span className="sys-toggle-track" aria-hidden="true">
        <span className="sys-toggle-thumb" />
      </span>
      <span className="sys-toggle-label">{label}</span>
    </label>
  );
}

export function SelectBox({
  value,
  onChange,
  options,
  ariaLabel,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <label className="sys-select">
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel} disabled={disabled}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" />
    </label>
  );
}

export function CopyButton({
  text,
  label,
  onCopied,
  className,
  locale = 'en',
}: {
  text: string | null | undefined;
  label: ReactNode;
  onCopied?: (ok: boolean) => void;
  className?: string;
  locale?: SystemLocale;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  const copy = async () => {
    if (!text) {
      onCopied?.(false);
      return;
    }
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        ok = document.execCommand('copy');
        document.body.removeChild(area);
      }
    } catch {
      ok = false;
    }
    onCopied?.(ok);
    if (ok) {
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    }
  };
  return (
    <button type="button" className={cx('sys-btn sys-btn-quiet', className)} onClick={() => void copy()} disabled={!text}>
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copied ? t(locale, 'Copied', 'تم النسخ') : label}
    </button>
  );
}

export function downloadJson(fileName: string, payload: unknown): boolean {
  try {
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    return true;
  } catch {
    return false;
  }
}

export function ExportButton({
  fileName,
  payload,
  label,
  onDone,
  disabled = false,
  className,
}: {
  fileName: string;
  payload: unknown;
  label: ReactNode;
  onDone?: (ok: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cx('sys-btn sys-btn-quiet', className)}
      disabled={disabled}
      onClick={() => onDone?.(downloadJson(fileName, payload))}
    >
      <Download aria-hidden="true" />
      {label}
    </button>
  );
}

export function DataRows({
  rows,
  empty,
  className,
}: {
  rows: Array<{ label: ReactNode; value: ReactNode; tone?: Tone; mono?: boolean }>;
  empty?: ReactNode;
  className?: string;
}) {
  if (!rows.length) return <>{empty ?? null}</>;
  return (
    <div className={cx('sys-data-rows', className)}>
      {rows.map((row, index) => (
        <div className="sys-data-row" key={`${index}-${String(row.label)}`}>
          <span>{row.label}</span>
          <strong className={cx(row.mono && 'sys-mono', toneClass(row.tone))}>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function WorkbenchFrame({
  id,
  locale,
  provider,
  state,
  children,
  foot,
}: {
  id: string;
  locale: SystemLocale;
  provider?: string | null;
  state?: keyof typeof SERVICE_STATE_META;
  children: ReactNode;
  foot?: ReactNode;
}) {
  const entry = SERVICE_BY_ID[id];
  const Icon = entry?.icon;
  const stateMeta = SERVICE_STATE_META[state || entry?.state || 'available'];
  return (
    <section className="sys-workbench" data-testid={`sys-service-workspace-${id}`} aria-labelledby={`sys-wb-title-${id}`}>
      <header className="sys-wb-head">
        <div className="sys-wb-identity">
          <span className="sys-wb-icon" style={{ color: entry?.accent || '#22d3ee', borderColor: `${entry?.accent || '#22d3ee'}55` }}>
            {Icon ? <Icon aria-hidden="true" /> : null}
          </span>
          <div className="sys-wb-copy">
            <span className="sys-wb-eyebrow">
              {t(locale, 'Service', 'خدمة')} {String(entry?.index || '').padStart(2, '0')} · {entry?.id}
            </span>
            <h2 id={`sys-wb-title-${id}`}>{locale === 'ar' ? entry?.ar : entry?.en}</h2>
            <p>{locale === 'ar' ? entry?.blurbAr : entry?.blurbEn}</p>
          </div>
        </div>
        <div className="sys-wb-badges">
          <Chip tone={stateMeta.tone}>{t(locale, stateMeta.en, stateMeta.ar)}</Chip>
          <Chip tone="info" icon={ShieldCheck}>{t(locale, 'Read-only', 'للقراءة فقط')}</Chip>
          <Chip tone="muted" title={provider || undefined}>
            {provider ? provider.split(' + ')[0] : t(locale, 'Native provider', 'مزود أصلي')}
          </Chip>
        </div>
      </header>
      <div className="sys-service-body sys-wb-body">{children}</div>
      {foot ? <footer className="sys-wb-foot">{foot}</footer> : null}
    </section>
  );
}

export function MiniStat({
  label,
  value,
  sub,
  tone,
  icon: Icon,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
}) {
  return (
    <div className={cx('sys-mini-stat', tone && `sys-mini-stat-${tone}`)}>
      <span className="sys-mini-stat-label">
        {Icon ? <Icon aria-hidden="true" /> : null}
        {label}
      </span>
      <strong>{value}</strong>
      {sub ? <em>{sub}</em> : null}
    </div>
  );
}

export function InfoNote({ children, tone = 'info' }: { children: ReactNode; tone?: Tone }) {
  return <div className={cx('sys-info-note', `is-${tone}`)}>{children}</div>;
}

export function CodeBlock({ children, label }: { children: ReactNode; label?: ReactNode }) {
  return (
    <div className="sys-code-block">
      {label ? <span className="sys-code-label">{label}</span> : null}
      <pre>{children}</pre>
    </div>
  );
}

export function LoadingSpinner({ label }: { label?: ReactNode }) {
  return (
    <span className="sys-inline-spin">
      <Loader2 className="sys-spin" aria-hidden="true" />
      {label}
    </span>
  );
}
