import React, { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { KnouxMark } from './ReferenceAtmosphere';
import './knoux-orbit.css';

export interface KnouxOrbitTool {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  hint?: string;
}

const POSITIONS = [
  { x: '50%', y: '8%' },
  { x: '82%', y: '28%' },
  { x: '86%', y: '58%' },
  { x: '62%', y: '84%' },
  { x: '30%', y: '84%' },
  { x: '18%', y: '48%' },
] as const;

export function KnouxOrbit({ title, subtitle, tools, onActivate }: { title: string; subtitle: string; tools: KnouxOrbitTool[]; onActivate: () => void }) {
  const id = useId().replace(/:/g, '');
  const visibleTools = tools.slice(0, 6);

  return (
    <div className="knoux-orbit" role="group" aria-label={`${title} ${subtitle}`}>
      <svg className="knoux-orbit__svg" viewBox="0 0 540 344" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#ffffff" stopOpacity=".82" /><stop offset=".34" stopColor="#cbb8ff" stopOpacity=".35" /><stop offset="1" stopColor="#7d42f5" stopOpacity="0" /></radialGradient>
          <linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0" /><stop offset=".5" stopColor="#ffffff" stopOpacity=".9" /><stop offset="1" stopColor="#7d3df4" stopOpacity="0" /></linearGradient>
        </defs>
        <ellipse className="knoux-orbit__ring knoux-orbit__ring--outer" cx="270" cy="172" rx="208" ry="140" />
        <ellipse className="knoux-orbit__ring knoux-orbit__ring--mid" cx="270" cy="172" rx="165" ry="110" />
        <ellipse className="knoux-orbit__ring knoux-orbit__ring--inner" cx="270" cy="172" rx="123" ry="82" />
        <ellipse className="knoux-orbit__sweep" cx="270" cy="172" rx="208" ry="140" stroke={`url(#${id}-sweep)`} />
        <circle className="knoux-orbit__glow" cx="270" cy="172" r="108" fill={`url(#${id}-glow)`} />
        <g className="knoux-orbit__particles">
          {Array.from({ length: 24 }, (_, index) => { const angle = (index / 24) * Math.PI * 2; const rx = index % 2 ? 183 : 151; const ry = index % 2 ? 124 : 99; return <circle key={index} cx={270 + Math.cos(angle) * rx} cy={172 + Math.sin(angle) * ry} r={index % 5 === 0 ? 2.4 : 1.25} />; })}
        </g>
      </svg>

      <span className="knoux-orbit__reflection" aria-hidden="true" />
      <button className="knoux-orbit__core" type="button" onClick={onActivate} aria-label={`${title} ${subtitle}`}>
        <span className="knoux-orbit__mark"><KnouxMark /></span>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </button>

      <nav className="knoux-orbit__tools" aria-label={`${title} tools`}>
        {visibleTools.map((tool, index) => {
          const Icon = tool.icon;
          const position = POSITIONS[index];
          return <button key={tool.id} type="button" className="knoux-orbit__tool" style={{ '--orbit-x': position.x, '--orbit-y': position.y } as React.CSSProperties} onClick={tool.onClick} title={tool.hint ?? tool.label} aria-label={tool.label}>
            <span className="knoux-orbit__capsule"><Icon aria-hidden="true" /><span>{tool.label}</span></span>
          </button>;
        })}
      </nav>
    </div>
  );
}
