import React, { useId } from 'react';

export function KnouxMark({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return <svg className={className} viewBox="0 0 72 92" fill="none" aria-hidden="true">
    <defs><linearGradient id={id} x1="12" y1="7" x2="64" y2="82" gradientUnits="userSpaceOnUse"><stop stopColor="#fbf0ff"/><stop offset=".3" stopColor="#a66aff"/><stop offset=".63" stopColor="#6422e9"/><stop offset="1" stopColor="#b388ff"/></linearGradient></defs>
    <path d="M26 5c5-3 11-1 15 4l12 16c4 5 3 12-2 16L34 55c-5 4-12 3-16-2l-4-5c-4-5-3-12 2-16l13-11-9-3c-4-5-2-10 6-13Z" fill={`url(#${id})`}/>
    <path d="m30 45 15 18c4 5 3 12-2 16l-7 6c-5 4-12 3-16-2L8 68c-4-5-3-12 2-16l7-6c4-4 9-4 13-1Z" fill={`url(#${id})`}/>
    <circle cx="58" cy="53" r="10" fill={`url(#${id})`}/>
    <path d="M26 6c6-2 10 1 14 6l8 11M13 55c-4 4-4 9-1 14" stroke="white" strokeOpacity=".65" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
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
