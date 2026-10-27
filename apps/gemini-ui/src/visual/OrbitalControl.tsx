import React from 'react';
import { ArrowUpRight, Sparkles, type LucideIcon } from 'lucide-react';

export interface OrbitTool { id: string; label: string; icon: LucideIcon; onClick: () => void; active?: boolean; disabled?: boolean }

/** Navigation and preview control only. Native consent remains in each tool. */
export function OrbitalControl({ title, subtitle, tools, onActivate, disabled = false, running = false }: {
  title: string; subtitle: string; tools: OrbitTool[]; onActivate: () => void; disabled?: boolean; running?: boolean;
}) {
  return <div className={`knx-orbit ${running ? 'is-running' : ''}`}>
    <div className="knx-orbit-track" aria-hidden="true" />
    <div className="knx-orbit-track knx-orbit-track-inner" aria-hidden="true" />
    <button className="knx-orbit-core" onClick={onActivate} disabled={disabled}>
      <Sparkles size={32} aria-hidden="true" /><strong>{title}</strong><span>{subtitle}</span>
      <span className="knx-orbit-arrow"><ArrowUpRight size={21} /></span>
    </button>
    <nav className="knx-orbit-tools" aria-label={title}>
      {tools.map((tool, index) => <button key={tool.id} type="button" className={`knx-orbit-tool ${tool.active ? 'is-active' : ''}`}
        style={{ '--orbit-index': index, '--orbit-count': tools.length } as React.CSSProperties}
        onClick={tool.onClick} disabled={tool.disabled} aria-current={tool.active ? 'step' : undefined}>
        <tool.icon size={20} aria-hidden="true" /><span>{tool.label}</span>
      </button>)}
    </nav>
  </div>;
}
