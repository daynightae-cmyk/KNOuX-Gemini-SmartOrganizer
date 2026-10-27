import React from 'react';

/** Decorative atmosphere only. No timers, progress claims or pointer targets. */
export function OrbitParticles({ className = '' }: { className?: string }) {
  return <span className={`knx-orbit-particles ${className}`} aria-hidden="true">
    {[0, 1, 2].map(ring => <span className={`knx-particle-track track-${ring}`} key={ring}>
      {[0, 1, 2, 3].map(dot => <i key={dot} style={{ '--particle-angle': `${dot * 90 + ring * 27}deg`, '--particle-size': `${dot === 0 ? 7 : 3}px` } as React.CSSProperties} />)}
    </span>)}
  </span>;
}
