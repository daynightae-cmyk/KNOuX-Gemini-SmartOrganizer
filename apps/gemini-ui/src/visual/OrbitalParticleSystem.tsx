import type {CSSProperties} from 'react';

/** Stable circular tracks; only decorative groups rotate. No progress timers. */
export function OrbitalParticleSystem() {
 return <svg className="knx-living-orbital-light" viewBox="0 0 400 400" aria-hidden="true" focusable="false" data-orbital-particles>
  {[126,151,176].map((radius,track)=><g key={radius}>
   <circle className="knx-living-track" cx="200" cy="200" r={radius}/>
   <g className={`knx-living-revolution track-${track}`} style={{'--orbit-period':`${19+track*12}s`,'--orbit-direction':track%2?'reverse':'normal'} as CSSProperties}>
    {[0,1,2,3].map(p=>{const angle=(p*90+track*19)*Math.PI/180;return <g key={p}>
     <circle className="knx-living-trail" cx={200+radius*Math.cos(angle)} cy={200+radius*Math.sin(angle)} r="7"/>
     <path className="knx-living-star" transform={`translate(${200+radius*Math.cos(angle)} ${200+radius*Math.sin(angle)})`} d="M0 -4.5 1.2 -1.2 4.5 0 1.2 1.2 0 4.5 -1.2 1.2 -4.5 0 -1.2 -1.2Z"/>
    </g>;})}
   </g>
  </g>)}
 </svg>;
}
