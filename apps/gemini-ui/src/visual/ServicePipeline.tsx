/**
 * KNOuX — ServicePipeline.
 *
 * The shared, luminous glass workflow strip that replaces the three static
 * capability rows in every dense domain header. It is presentational only:
 * each hero owns the provider state and passes honest stage states in. No
 * timer here ever advances a stage, and no percentage is rendered unless the
 * caller supplies a measured numerator and denominator.
 */
import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Circle,
  Lock,
  MinusCircle,
  TimerReset, Activity, Database, FileText, FolderOpen, Search, ShieldCheck,
  Play, Eye, Settings, Workflow, Undo2, Fingerprint, ScanLine, Sparkles, type LucideIcon,
} from 'lucide-react';
import './service-pipeline.css';

export type PipelineStageState =
  | 'pending'
  | 'active'
  | 'complete'
  | 'partial'
  | 'failed'
  | 'gated'
  | 'skipped';

/** Terminal provider outcomes must not turn failures/cancellation into success. */
export function pipelineStateFromStatus(status?: string): PipelineStageState {
  if (status === 'running' || status === 'scanning') return 'active';
  if (status === 'complete' || status === 'completed') return 'complete';
  if (status === 'failed') return 'failed';
  if (status === 'partial' || status === 'cancelled') return 'partial';
  return 'pending';
}

export interface PipelineStage {
  id: string;
  label: string;
  /** Small honest caption under the label, e.g. "measured" or "approval required". */
  detail?: string;
  state: PipelineStageState;
  icon?: LucideIcon;
}

export interface PipelineProgress {
  done: number;
  total: number;
  /** Optional unit shown after the counts, e.g. "files". */
  unit?: string;
}

export interface ServicePipelineProps {
  stages: PipelineStage[];
  locale?: 'en' | 'ar';
  /** Measured item progress. Omit while no real total exists. */
  progress?: PipelineProgress | null;
  /** True only while a real provider is publishing work for this pipeline. */
  live?: boolean;
  /** Honest one-line provenance caption below the strip. */
  caption?: string;
  /** Accent hue family; domains pass their own service colour. */
  accent?: 'violet' | 'blue' | 'teal' | 'amber' | 'emerald' | 'rose' | 'indigo' | 'sky';
  /** Chronological origin: 'left' reads first→last, 'right' flows from the orbital hub. */
  flow?: 'left' | 'right';
  /** Tighter geometry for welcome heroes that already carry KPI chips. */
  dense?: boolean;
  /** Show chronological ordinal bubbles (reference Startup does). */
  numbered?: boolean;
  testId?: string;
  onSelect?: (id: string) => void;
}

const stageIcons: Record<string, LucideIcon> = {
  source: FolderOpen, authorize: ShieldCheck, connect: Workflow, collect: Database,
  measure: Activity, sample: FileText, summarize: FileText, recommend: Sparkles,
  classify: Settings, plan: FileText, review: Eye, execute: Play, verify: ShieldCheck,
  undo: Undo2, analyze: Activity, diagnose: Search, report: FileText,
  discover: Search, inventory: Database, inspect: ScanLine, updates: Workflow,
  signatures: Fingerprint, evidence: FileText,
  trigger: TimerReset, validate: ShieldCheck, 'dry-run': Play, approve: Fingerprint,
  quick: Search, deep: ScanLine, findings: FileText, 'cleanup-gate': Lock,
  filter: Settings, recover: Undo2, policy: ShieldCheck, preview: Eye,
  dependencies: Workflow, footprint: Database, uninstall: MinusCircle,
  'sync-state': TimerReset, 'preview-data': FileText, 'select-service': Settings,
  'review-scopes': ShieldCheck, confirm: Fingerprint, choose: Settings,
};
function StageGlyph({ stage }: { stage: PipelineStage }) {
  const Icon = stage.icon ?? stageIcons[stage.id] ?? Workflow;
  return <Icon aria-hidden="true" />;
}
function StateBadge({ state }: { state: PipelineStageState }) {
  const Icon = state === 'complete' ? Check : state === 'gated' ? Lock : state === 'failed' ? AlertTriangle : state === 'partial' ? TimerReset : state === 'skipped' ? MinusCircle : Circle;
  return <span className="knx-pipe-state" aria-hidden="true"><Icon /></span>;
}

const stateLabel: Record<PipelineStageState, string> = {
  pending: 'pending',
  active: 'current stage',
  complete: 'complete',
  partial: 'partial',
  failed: 'failed',
  gated: 'requires approval',
  skipped: 'skipped',
};

export function ServicePipeline({
  stages,
  locale = 'en',
  progress = null,
  live = false,
  caption,
  accent = 'violet',
  flow = 'right',
  dense = false,
  numbered = false,
  testId = 'service-pipeline',
  onSelect,
}: ServicePipelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const glassId = `pipe-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [geometry, setGeometry] = useState({ width: 1000, outletX: 1000, outletY: 22, nodeY: 22 });
  // Measure only on layout changes. The tube shares the real orbital outlet;
  // no animation loop, provider timer, or navigation-derived progress exists here.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const hero = track.closest('.approved-hero, .osa-hero, .knx-studio-hero, .knx-command-hero, .knx-workspace-hero, header');
    const orbit = hero?.querySelector<HTMLElement>('.knx-orbit-core, .knoux-orbit__core');
    const measure = () => {
      const box = track.getBoundingClientRect();
      const dot = track.querySelector('.knx-pipe-dot')?.getBoundingClientRect();
      const hub = orbit?.getBoundingClientRect();
      const nodeY = dot ? dot.top + dot.height / 2 - box.top : 22;
      const connected = hub && hub.left > box.left + box.width / 2;
      const next = { width: box.width, outletX: connected ? hub.left - box.left + 5 : box.width,
        outletY: connected ? hub.top + hub.height / 2 - box.top : nodeY, nodeY };
      setGeometry(previous => Object.keys(next).every(key => Math.abs(next[key as keyof typeof next] - previous[key as keyof typeof next]) < .5) ? previous : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    if (hero) observer.observe(hero);
    if (orbit) observer.observe(orbit);
    measure();
    return () => observer.disconnect();
  }, [dense, stages.length, flow]);
  if (!stages.length) return null;
  const ar = locale === 'ar';
  const chronoIndex = (displayIndex: number) => (flow === 'right' ? stages.length - displayIndex : displayIndex + 1);
  const ordered = flow === 'right' ? [...stages].reverse() : stages;
  const determinate = Boolean(progress && Number.isFinite(progress.done) && Number.isFinite(progress.total) && progress.total > 0 && progress.done >= 0);
  const percent = determinate && progress ? Math.max(0, Math.min(100, Math.round((progress.done / progress.total) * 100))) : null;
  const completed = stages.filter((stage) => stage.state === 'complete').length;
  const anyActive = stages.some((stage) => stage.state === 'active');
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const { width, outletX, outletY, nodeY } = geometry;
  const curve = `M${outletX} ${outletY} C${outletX - 65} ${outletY} ${width + 35} ${nodeY} ${width} ${nodeY} C${width * .78} ${nodeY - 14} ${width * .7} ${nodeY + 14} ${width * .5} ${nodeY} S${width * .2} ${nodeY - 12} 0 ${nodeY}`;

  return (
    <section
      className={`knx-pipe knx-pipe-${accent}${live ? ' is-live' : ''}${anyActive ? ' has-active' : ''}${reduced ? ' is-reduced' : ''}${flow === 'right' ? ' is-flow-right' : ''}${dense ? ' is-dense' : ''}${numbered ? ' is-numbered' : ''}`}
      data-testid={testId}
      data-stage-count={stages.length}
      dir={ar ? 'rtl' : 'ltr'}
      aria-label={caption || (ar ? 'مسار الخدمة' : 'Service workflow')}
    >
      <div ref={trackRef} className="knx-pipe-track" dir={flow === 'right' ? 'ltr' : undefined} style={{ ['--knx-pipe-count' as string]: stages.length }} role="list">
        <div className="knx-pipe-flashbacks" aria-hidden="true">{ordered.map(stage => <span key={stage.id} className={`is-${stage.state}`}><StageGlyph stage={stage} /></span>)}</div>
        <svg className="knx-pipe-glass" style={{width:Math.max(width,outletX)}} height="80" aria-hidden="true" focusable="false" data-outlet-x={Math.round(outletX)} data-outlet-y={Math.round(outletY)}>
          <defs><linearGradient id={glassId} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#b988ff"/><stop offset=".45" stopColor="#36ddff"/><stop offset=".8" stopColor="#bd72ff"/><stop offset="1" stopColor="#d6d4ff"/></linearGradient></defs>
          <path className="knx-glass-shadow" d={curve}/>
          <path className="knx-glass-body" d={curve} stroke={`url(#${glassId})`}/>
          <path className="knx-glass-refraction" d={curve}/>
          <path className="knx-glass-energy" d={curve} pathLength="1000"/>
          <path className="knx-glass-particles" d={curve} pathLength="1000"/>
        </svg>
        {ordered.map((stage, index) => {
          const interactive = Boolean(onSelect);
          const Tag = interactive ? 'button' : 'div';
          return (
            <div key={stage.id} role="listitem" className="knx-pipe-item">
            <Tag
              {...(interactive ? { type: 'button' as const, onClick: () => onSelect?.(stage.id) } : {})}
              className={`knx-pipe-node is-${stage.state}`}
              dir={ar ? 'rtl' : 'ltr'}
              data-stage={stage.id}
              data-state={stage.state}
              aria-current={stage.state === 'active' ? 'step' : undefined}
              title={`${stage.label} · ${stateLabel[stage.state]}`}
            >
              <span className="knx-pipe-dot">
                <span className="knx-pipe-order" aria-hidden="true">{String(chronoIndex(index)).padStart(2, '0')}</span>
                <StageGlyph stage={stage} /><StateBadge state={stage.state} />
              </span>
              <span className="knx-pipe-label">{stage.label}</span>
              {stage.detail ? <span className="knx-pipe-detail">{stage.detail}</span> : null}
            </Tag>
            </div>
          );
        })}
      </div>
      {(determinate || live || completed > 0) && (
        <div className="knx-pipe-meter">
          <span className="knx-pipe-meter-rail" aria-hidden="true">
            {determinate ? (
              <i className="knx-pipe-meter-fill" style={{ width: `${percent}%` }} />
            ) : (
              live ? <i className="knx-pipe-meter-echo" /> : null
            )}
          </span>
          <span className="knx-pipe-meter-label" data-testid={`${testId}-meter`}>
            {determinate && progress ? (
              <>
                <strong>{percent}%</strong>
                {progress.unit === '%' ? null : (
                  <span>
                    {progress.done.toLocaleString()} / {progress.total.toLocaleString()} {progress.unit || ''}
                  </span>
                )}
              </>
            ) : live ? (
              <span>{ar ? 'جارٍ القياس…' : 'Measuring…'}</span>
            ) : (
              <span>
                {completed} / {stages.length} {ar ? 'مراحل مكتملة' : 'stages complete'}
              </span>
            )}
          </span>
          {caption ? <span className="knx-pipe-caption">{caption}</span> : null}
        </div>
      )}
      {!determinate && !live && completed === 0 && caption ? <p className="knx-pipe-caption is-standalone">{caption}</p> : null}
    </section>
  );
}
