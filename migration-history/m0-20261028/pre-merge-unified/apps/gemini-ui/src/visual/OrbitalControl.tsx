import React from 'react';
import { Play, type LucideIcon } from 'lucide-react';
import { KnouxMark } from './ReferenceAtmosphere';
import { OrbitParticles } from './OrbitParticles';

export type OrbitTone = 'violet' | 'blue' | 'teal' | 'amber' | 'emerald' | 'rose' | 'indigo' | 'sky';

export type OrbitToolState = 'available' | 'active' | 'loading' | 'failed' | 'disabled' | 'unavailable';

export interface OrbitTool {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  /** Selected/current destination. Mirrors OrbitToolState 'active'. */
  active?: boolean;
  disabled?: boolean;
  /** Explicit runtime state. Falls back to active/disabled when omitted. */
  state?: OrbitToolState;
  /** Short truthful qualifier rendered as a tooltip + screen-reader text. */
  hint?: string;
  tone?: OrbitTone;
}

const TONES: OrbitTone[] = ['violet', 'blue', 'teal', 'amber', 'emerald', 'rose', 'indigo', 'sky'];

const STATE_LABEL: Record<OrbitToolState, string> = {
  available: 'available',
  active: 'current',
  loading: 'loading',
  failed: 'failed',
  disabled: 'disabled',
  unavailable: 'unavailable',
};

function resolveState(tool: OrbitTool): OrbitToolState {
  if (tool.state) return tool.state;
  if (tool.disabled) return 'disabled';
  return tool.active ? 'active' : 'available';
}

/**
 * KNOuX Orbital Service Engine.
 *
 * A navigation, scope and preview control shared by every workspace. It owns no
 * service state: each satellite invokes an existing page handler and the centre
 * action opens the workspace's genuine review/preview surface. Native consent,
 * progress and measured results stay inside each service.
 */
export function OrbitalControl({
  title,
  subtitle,
  tools,
  onActivate,
  disabled = false,
  running = false,
  state,
  eyebrow,
  coreIcon: CoreIcon,
}: {
  title: string;
  subtitle: string;
  tools: OrbitTool[];
  onActivate: () => void;
  disabled?: boolean;
  running?: boolean;
  state?: 'ready' | 'loading' | 'failed' | 'unavailable';
  eyebrow?: string;
  coreIcon?: LucideIcon;
}) {
  const count = Math.max(tools.length, 1);
  const coreState = state ?? (running ? 'loading' : disabled ? 'unavailable' : 'ready');
  const span = 360 / count;

  return (
    <div
      className={`knx-orbit is-${coreState}${running ? ' is-running' : ''}`}
      role="group"
      aria-label={title}
      data-orbit-state={coreState}
    >
      <span className="knx-orbit-halo" aria-hidden="true" />
      <OrbitParticles />
      <span className="knx-orbit-ring knx-orbit-ring-outer" aria-hidden="true" />
      <span className="knx-orbit-ring knx-orbit-ring-inner" aria-hidden="true" />
      <span className="knx-orbit-arc" aria-hidden="true" />

      {tools.map((tool, index) => (
        <span
          key={`node-${tool.id}`}
          className="knx-orbit-node"
          aria-hidden="true"
          style={{ '--orbit-angle': `${index * span - 90}deg` } as React.CSSProperties}
        />
      ))}
      {tools.map((tool, index) => (
        <span
          key={`spark-${tool.id}`}
          className="knx-orbit-node knx-orbit-node-soft"
          aria-hidden="true"
          style={{ '--orbit-angle': `${index * span - 90 + span / 2}deg` } as React.CSSProperties}
        />
      ))}

      <button
        type="button"
        className="knx-orbit-core"
        onClick={onActivate}
        disabled={disabled || coreState === 'loading' || coreState === 'unavailable'}
        aria-busy={coreState === 'loading' || undefined}
      >
        <span className="knx-orbit-core-mark">{CoreIcon ? <CoreIcon aria-hidden="true"/> : <KnouxMark />}</span>
        <strong>{title}</strong>
        <span className="knx-orbit-core-sub">{subtitle}</span>
        <span className="knx-orbit-play" aria-hidden="true">
          {coreState === 'loading'
            ? <span className="knx-orbit-spinner" />
            : <Play size={15} fill="currentColor" strokeWidth={0} />}
        </span>
      </button>

      <nav className="knx-orbit-tools" aria-label={eyebrow || title}>
        {tools.map((tool, index) => {
          const toolState = resolveState(tool);
          const tone = tool.tone ?? TONES[index % TONES.length];
          return (
            <button
              key={tool.id}
              type="button"
              className={`knx-orbit-tool is-${toolState} tone-${tone}`}
              style={{ '--orbit-angle': `${index * span - 90}deg` } as React.CSSProperties}
              onClick={tool.onClick}
              disabled={tool.disabled || toolState === 'disabled' || toolState === 'unavailable' || toolState === 'loading'}
              aria-current={toolState === 'active' ? 'step' : undefined}
              aria-busy={toolState === 'loading' || undefined}
              title={tool.hint ? `${tool.label} — ${tool.hint}` : undefined}
            >
              <span className="knx-orbit-chip">
                <tool.icon size={20} strokeWidth={2.1} aria-hidden="true" />
                <span className="knx-orbit-chip-dot" aria-hidden="true" />
              </span>
              <span className="knx-orbit-label">
                {tool.label}
                {toolState !== 'available' && toolState !== 'active' && (
                  <span className="knx-sr-only"> ({STATE_LABEL[toolState]})</span>
                )}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
