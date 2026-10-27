import React from 'react';

export function KnouxMark({ className = '' }: { className?: string }) {
  return <img className={`knx-official-mark ${className}`} src={new URL('./assets/knoux-official-logo.png', import.meta.url).href} alt="" aria-hidden="true" draggable={false} />;
}

/**
 * Approved circular KNOuX brand emblem (daylight master).
 *
 * The source PNG carries its own transparent alpha outside the circular
 * silhouette, so this renders the artwork alone: no gradient tile, no border
 * and no rounded-rectangle backing. The accessible product name is supplied by
 * the adjacent real text wherever the emblem is smaller than the artwork's own
 * wordmark can legibly read.
 */
export function KnouxCircularEmblem({
  className = '',
  label = '',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <img
      className={`knx-circular-emblem ${className}`}
      src={new URL('./assets/knoux-circular-logo-day.png', import.meta.url).href}
      alt={label ? label : ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
    />
  );
}

/** Procedural decorative light; contains no telemetry or simulated operation state. */
export function ReferenceAtmosphere() {
  const points = Array.from({ length: 190 }, (_, i) => ({ x: ((i * 137 + 31) % 997), y: ((i * 89 + 17) % 601), r: i % 17 === 0 ? 2.5 : .7 }));
  return <div className="knx-reference-atmosphere" aria-hidden="true"><svg viewBox="0 0 1000 600" preserveAspectRatio="none">
    <g className="knx-neural-lines" fill="none">
      {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M ${i * 93 - 220} -20 Q ${500 - i * 31} ${180 + i * 26} ${1005 - i * 57} 630`} />)}
      {Array.from({ length: 6 }, (_, i) => <path key={`arc${i}`} d={`M -40 ${i * 119} Q ${380 + i * 90} ${560 - i * 135} 1040 ${100 + i * 81}`} />)}
    </g>
    <g>{points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={i % 4 === 0 ? '#fff5ff' : '#b18aff'} />)}</g>
    <g className="knx-starbursts" fill="#fff3ff">{points.filter((_, i) => i % 11 === 0).map((p, i) => <path key={i} d={`M${p.x} ${p.y-9}q1 8 10 9-9 1-10 9-1-8-10-9 9-1 10-9Z`} />)}</g>
  </svg></div>;
}
