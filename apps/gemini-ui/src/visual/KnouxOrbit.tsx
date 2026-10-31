import {useId,type CSSProperties,type ComponentType,type ReactNode} from 'react';
import {Play,type LucideIcon} from 'lucide-react';
import {KnouxMark} from './ReferenceAtmosphere';
import './knoux-orbit.css';

export type OrbitTone='violet'|'blue'|'teal'|'amber'|'emerald'|'rose'|'indigo'|'sky'|'red';
export type OrbitToolState='available'|'active'|'loading'|'failed'|'disabled'|'unavailable';
export type KnouxOrbitState='ready'|'loading'|'partial'|'failed'|'unavailable';
export interface OrbitTool{
 id:string;label:string;icon:ComponentType<{className?:string;size?:number;strokeWidth?:number;'aria-hidden'?:boolean|'true'|'false'}>;onClick:()=>void;active?:boolean;disabled?:boolean;state?:OrbitToolState;hint?:string;tone?:OrbitTone;
 /** Reference-space percentages, independent of theme and reading direction. */
 position?:{x:number;y:number};testId?:string;
}
export interface KnouxOrbitProps{
 title:string;subtitle:string;tools:OrbitTool[];onActivate:()=>void;disabled?:boolean;running?:boolean;
 /** Caller-owned provider state. This component starts no timers or operations. */
 state?:KnouxOrbitState;eyebrow?:string;coreMark?:ReactNode;coreIcon?:LucideIcon;className?:string;testId?:string;
 optics?:'home';decorativeMotion?:boolean;
}
const tones:OrbitTone[]=['violet','blue','teal','amber','emerald','rose','indigo','sky','red'];
const stateLabel:Record<OrbitToolState,string>={available:'available',active:'current',loading:'loading',failed:'failed',disabled:'disabled',unavailable:'unavailable'};
/** Shared vector instrument. Static controls sit above an independent decorative
 * SVG layer. A sweep is ambient light, never a percentage or simulated progress. */
export function KnouxOrbit({title,subtitle,tools,onActivate,disabled=false,running=false,state,eyebrow,coreMark,coreIcon:CoreIcon,className='',testId,optics,decorativeMotion=true}:KnouxOrbitProps){
 const home=optics==='home';
 const id='knoux-orbit-'+useId().replace(/[^a-zA-Z0-9_-]/g,''),status=state??(running?'loading':disabled?'unavailable':'ready');
 return <div className={`knx-orbit knx-vector-orbit is-${status}${running?' is-running':''}${decorativeMotion?' has-decorative-motion':''} ${home?'knoux-orbit':''} ${className}`} role="group" aria-label={eyebrow||title} data-orbit-state={status} data-testid={testId}>
  <svg className={`knx-orbit-vector ${home?'knoux-orbit__svg':''}`} viewBox={home?'0 0 540 344':'0 0 500 320'} preserveAspectRatio="none" aria-hidden="true" focusable="false">
   {home?<>{/* v0 procedural optics; controls retain the local typed contract. */}        <defs>
          <radialGradient id={`${id}-halo`}><stop stopColor="#ead6ff" stopOpacity=".8"/><stop offset=".4" stopColor="#a44fff" stopOpacity=".38"/><stop offset="1" stopColor="#5422b8" stopOpacity="0"/></radialGradient>
          <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e8cfff" stopOpacity=".95"/><stop offset=".3" stopColor="#9e4aff" stopOpacity=".24"/><stop offset=".6" stopColor="#66ddff" stopOpacity=".65"/><stop offset="1" stopColor="#cba0ff" stopOpacity=".9"/></linearGradient>
          <linearGradient id={`${id}-comet`}><stop stopColor="#b15aff" stopOpacity="0"/><stop offset=".8" stopColor="#caa2ff"/><stop offset="1" stopColor="#ffffff"/></linearGradient>
          {optics==='home'&&<radialGradient id={`${id}-floor`} cx="50%" cy="50%" r="50%"><stop stopColor="#c98fff" stopOpacity=".55"/><stop offset=".45" stopColor="#8b54fa" stopOpacity=".28"/><stop offset="1" stopColor="#6924d0" stopOpacity="0"/></radialGradient>}
        </defs>
        <ellipse className="knoux-orbit__nebula" cx="270" cy="172" rx="260" ry="180" fill={`url(#${id}-halo)`}/>
        {optics==='home'&&<g className="knoux-orbit__home-optics" aria-hidden="true">
          <ellipse className="knoux-orbit__floor-light" cx="270" cy="300" rx="195" ry="34" fill={`url(#${id}-floor)`}/>
          <g className="knoux-orbit__rear-glass" fill="none" stroke={`url(#${id}-glass)`}>
            <ellipse cx="270" cy="172" rx="218" ry="142" transform="rotate(-18 270 172)"/>
            <ellipse cx="270" cy="172" rx="214" ry="138" transform="rotate(-18 270 172)"/>
            <ellipse cx="270" cy="172" rx="163" ry="160" transform="rotate(34 270 172)"/>
          </g>
          <g className="knoux-orbit__rim-lights" fill="none"><ellipse cx="270" cy="172" rx="105" ry="101"/><ellipse cx="270" cy="172" rx="108" ry="104"/></g>
          <g className="knoux-orbit__fine-glints">{Array.from({length:18},(_,i)=>{const angle=i*2.39996,x=270+Math.cos(angle)*(165+i%3*20),y=172+Math.sin(angle)*(110+i%4*8);return <circle key={i} cx={x} cy={y} r={i%4===0?1.8:.65} className="knoux-orbit__sparkle" style={{animationDelay:`${-i*.61}s`}}/>;})}</g>
        </g>}
        <g className="knoux-orbit__wavefronts" stroke={`url(#${id}-glass)`} fill="none">
          <ellipse cx="270" cy="172" rx="236" ry="149" transform="rotate(-24 270 172)"/>
          <ellipse cx="270" cy="172" rx="213" ry="133" transform="rotate(30 270 172)"/>
          <ellipse cx="270" cy="172" rx="195" ry="156" transform="rotate(-58 270 172)"/>
        </g>
        <g className="knoux-orbit__glass-tracks" stroke={`url(#${id}-glass)`} fill="none">
          <ellipse cx="270" cy="172" rx="210" ry="137"/>
          <ellipse cx="270" cy="172" rx="186" ry="148" transform="rotate(-30 270 172)"/>
          <ellipse cx="270" cy="172" rx="147" ry="157" transform="rotate(18 270 172)"/>
          <ellipse cx="270" cy="172" rx="125" ry="112"/>
          <ellipse cx="270" cy="172" rx="112" ry="101"/>
        </g>
        <g className="knoux-orbit__constellation" fill="none">
          <ellipse cx="270" cy="172" rx="168" ry="122"/>
          <ellipse cx="270" cy="172" rx="134" ry="147" transform="rotate(25 270 172)"/>
        </g>
        <g className="knoux-orbit__comets" fill="none" stroke={`url(#${id}-comet)`}>
          <ellipse className="knoux-orbit__comet" cx="270" cy="172" rx="210" ry="137" pathLength="1000"/>
          <ellipse className="knoux-orbit__comet knoux-orbit__comet--reverse" cx="270" cy="172" rx="147" ry="157" pathLength="1000" transform="rotate(18 270 172)"/>
          <ellipse className="knoux-orbit__comet knoux-orbit__comet--fine" cx="270" cy="172" rx="125" ry="112" pathLength="1000"/>
        </g>
        <g className="knoux-orbit__starfield">
          {Array.from({length:54},(_,i)=>{
            const angle=i*2.39996,rx=115+(i*37%120),ry=88+(i*19%70);
            const x=270+Math.cos(angle)*rx,y=172+Math.sin(angle)*ry;
            return <circle key={i} className="knoux-orbit__sparkle" cx={x} cy={y} r={i%9===0?2.6:i%4===0?1.6:.75} style={{animationDelay:`${-(i%11)*.43}s`,animationDuration:`${3+i%5}s`}}/>;
          })}
          {[{x:91,y:62},{x:410,y:80},{x:399,y:230},{x:175,y:271},{x:342,y:40}].map(({x,y},i)=><path key={i} className="knoux-orbit__pinpoint" d={`M${x} ${y-9}Q${x+1} ${y-1} ${x+9} ${y}Q${x+1} ${y+1} ${x} ${y+9}Q${x-1} ${y+1} ${x-9} ${y}Q${x-1} ${y-1} ${x} ${y-9}Z`} style={{animationDelay:`${-i*1.2}s`}}/>)}
        </g>
        <g className="knoux-orbit__travellers">
          {Array.from({length:14},(_,i)=><circle key={i} data-orbit-particle={i} className={`knoux-orbit__traveller knoux-orbit__traveller--${i%3}`} r={i%4===0?2.5:1.2} style={{animationDelay:`${-i*1.77}s`,animationDuration:`${12+i%4*3}s`}}/>)}
        </g>
</>:<>   <defs><linearGradient id={id+'-light'} x1="0%" y1="15%" x2="100%" y2="85%"><stop offset="0" stopColor="#cdbbff"/><stop offset=".35" stopColor="#8247ee"/><stop offset=".7" stopColor="#e9dcff"/><stop offset="1" stopColor="#a579f4"/></linearGradient></defs>
   <g fill="none"><ellipse className="knx-vector-ring outer" cx="250" cy="160" rx="212" ry="139"/><ellipse className="knx-vector-ring middle" cx="250" cy="160" rx="181" ry="119"/><ellipse className="knx-vector-ring inner" cx="250" cy="160" rx="145" ry="97" stroke={'url(#'+id+'-light)'}/><ellipse className="knx-vector-sweep" cx="250" cy="160" rx="181" ry="119" pathLength="1000" stroke={'url(#'+id+'-light)'}/><ellipse className="knx-vector-segments" cx="250" cy="160" rx="145" ry="97" pathLength="1000"/></g>
   <g className="knx-vector-highlights">{tools.map((tool,i)=>{const angle=(i*360/Math.max(1,tools.length)-90)*Math.PI/180;return <circle key={tool.id} cx={tool.position?tool.position.x*5:250+181*Math.cos(angle)} cy={tool.position?tool.position.y*3.2:160+119*Math.sin(angle)} r="3.5"/>;})}</g>
   <g className="knx-vector-particles">{Array.from({length:12},(_,i)=>{const angle=(i*30+13)*Math.PI/180;return <circle key={i} cx={250+(i%2?202:160)*Math.cos(angle)} cy={160+(i%2?132:105)*Math.sin(angle)} r={i%3?1.8:3} style={{'--particle-phase':i*-.43+'s'} as CSSProperties}/>;})}</g></>}
  </svg>
  <button type="button" className={home?'knoux-orbit__core':'knx-orbit-core'} onClick={onActivate} disabled={disabled||status==='loading'||status==='unavailable'} aria-busy={status==='loading'||undefined}>
   <span className={home?'knoux-orbit__mark':'knx-orbit-core-mark'}>{coreMark||<KnouxMark/>}{CoreIcon&&<span className="knx-orbit-hub-service"><CoreIcon size={14} aria-hidden="true"/></span>}</span><strong>{title}</strong><span className="knx-orbit-core-sub">{subtitle}</span>{!home&&<span className="knx-orbit-play" aria-hidden="true"><Play size={15} fill="currentColor" strokeWidth={0}/></span>}
  </button>
  <nav className={home?'knoux-orbit__tools':'knx-orbit-tools'} aria-label={eyebrow||title}>{tools.map((tool,i)=>{const nodeState=tool.state??(tool.disabled?'disabled':tool.active?'active':'available');return <button key={tool.id} type="button" className={`${home?'knoux-orbit__tool':'knx-orbit-tool'} is-${nodeState} tone-${tool.tone??tones[i%tones.length]}`} style={{transform:'translate(-50%,-50%)',...{'--orbit-angle':(i*360/Math.max(1,tools.length)-90)+'deg'},...(home?{'--orbit-x':(tool.position?.x??[50,82,86,62,30,18][i])+'%','--orbit-y':(tool.position?.y??[8,28,58,84,84,48][i])+'%'}:tool.position?{left:tool.position.x+'%',top:tool.position.y+'%'}:{})} as CSSProperties} onClick={tool.onClick} disabled={tool.disabled||['disabled','unavailable','loading'].includes(nodeState)} aria-pressed={tool.active} aria-current={nodeState==='active'&&tool.active===undefined?'step':undefined} aria-busy={nodeState==='loading'||undefined} title={tool.hint??tool.label} data-testid={tool.testId}>
   {home?<span className="knoux-orbit__capsule"><tool.icon size={24} aria-hidden="true"/><span>{tool.label}</span></span>:<>   <span className="knx-orbit-chip"><tool.icon size={24} strokeWidth={2.1} aria-hidden="true"/><span className="knx-orbit-chip-dot" aria-hidden="true"/></span><span className="knx-orbit-label">{tool.label}{!['available','active'].includes(nodeState)&&<span className="knx-sr-only"> ({stateLabel[nodeState]})</span>}</span></>}
  </button>;})}</nav>
 </div>;
}
