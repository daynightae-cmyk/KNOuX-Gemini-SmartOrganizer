import {useId,type CSSProperties} from 'react';
import {Play,type LucideIcon} from 'lucide-react';
import {KnouxMark} from './ReferenceAtmosphere';
import './knoux-orbit.css';

export type OrbitTone='violet'|'blue'|'teal'|'amber'|'emerald'|'rose'|'indigo'|'sky';
export type OrbitToolState='available'|'active'|'loading'|'failed'|'disabled'|'unavailable';
export type KnouxOrbitState='ready'|'loading'|'partial'|'failed'|'unavailable';
export interface OrbitTool{
 id:string;label:string;icon:LucideIcon;onClick:()=>void;active?:boolean;disabled?:boolean;state?:OrbitToolState;hint?:string;tone?:OrbitTone;
 /** Reference-space percentages, independent of theme and reading direction. */
 position?:{x:number;y:number};testId?:string;
}
export interface KnouxOrbitProps{
 title:string;subtitle:string;tools:OrbitTool[];onActivate:()=>void;disabled?:boolean;running?:boolean;
 /** Caller-owned provider state. This component starts no timers or operations. */
 state?:KnouxOrbitState;eyebrow?:string;coreIcon?:LucideIcon;className?:string;testId?:string;
 decorativeMotion?:boolean;
}
const tones:OrbitTone[]=['violet','blue','teal','amber','emerald','rose','indigo','sky'];
const stateLabel:Record<OrbitToolState,string>={available:'available',active:'current',loading:'loading',failed:'failed',disabled:'disabled',unavailable:'unavailable'};
/** Shared vector instrument. Static controls sit above an independent decorative
 * SVG layer. A sweep is ambient light, never a percentage or simulated progress. */
export function KnouxOrbit({title,subtitle,tools,onActivate,disabled=false,running=false,state,eyebrow,coreIcon:CoreIcon,className='',testId,decorativeMotion=true}:KnouxOrbitProps){
 const id='knoux-orbit-'+useId().replace(/[^a-zA-Z0-9_-]/g,''),status=state??(running?'loading':disabled?'unavailable':'ready');
 return <div className={`knx-orbit knx-vector-orbit is-${status}${running?' is-running':''}${decorativeMotion?' has-decorative-motion':''} ${className}`} role="group" aria-label={eyebrow||title} data-orbit-state={status} data-testid={testId}>
  <svg className="knx-orbit-vector" viewBox="0 0 500 320" preserveAspectRatio="none" aria-hidden="true" focusable="false">
   <defs><linearGradient id={id+'-light'} x1="0%" y1="15%" x2="100%" y2="85%"><stop offset="0" stopColor="#cdbbff"/><stop offset=".35" stopColor="#8247ee"/><stop offset=".7" stopColor="#e9dcff"/><stop offset="1" stopColor="#a579f4"/></linearGradient></defs>
   <g fill="none"><ellipse className="knx-vector-ring outer" cx="250" cy="160" rx="212" ry="139"/><ellipse className="knx-vector-ring middle" cx="250" cy="160" rx="181" ry="119"/><ellipse className="knx-vector-ring inner" cx="250" cy="160" rx="145" ry="97" stroke={'url(#'+id+'-light)'}/><ellipse className="knx-vector-sweep" cx="250" cy="160" rx="181" ry="119" pathLength="1000" stroke={'url(#'+id+'-light)'}/><ellipse className="knx-vector-segments" cx="250" cy="160" rx="145" ry="97" pathLength="1000"/></g>
   <g className="knx-vector-highlights">{tools.map((tool,i)=>{const angle=(i*360/Math.max(1,tools.length)-90)*Math.PI/180;return <circle key={tool.id} cx={tool.position?tool.position.x*5:250+181*Math.cos(angle)} cy={tool.position?tool.position.y*3.2:160+119*Math.sin(angle)} r="3.5"/>;})}</g>
   <g className="knx-vector-particles">{Array.from({length:12},(_,i)=>{const angle=(i*30+13)*Math.PI/180;return <circle key={i} cx={250+(i%2?202:160)*Math.cos(angle)} cy={160+(i%2?132:105)*Math.sin(angle)} r={i%3?1.8:3} style={{'--particle-phase':i*-.43+'s'} as CSSProperties}/>;})}</g>
  </svg>
  <button type="button" className="knx-orbit-core" onClick={onActivate} disabled={disabled||status==='loading'||status==='unavailable'} aria-busy={status==='loading'||undefined}>
   <span className="knx-orbit-core-mark"><KnouxMark/>{CoreIcon&&<span className="knx-orbit-hub-service"><CoreIcon size={14} aria-hidden="true"/></span>}</span><strong>{title}</strong><span className="knx-orbit-core-sub">{subtitle}</span><span className="knx-orbit-play" aria-hidden="true"><Play size={15} fill="currentColor" strokeWidth={0}/></span>
  </button>
  <nav className="knx-orbit-tools" aria-label={eyebrow||title}>{tools.map((tool,i)=>{const nodeState=tool.state??(tool.disabled?'disabled':tool.active?'active':'available');return <button key={tool.id} type="button" className={`knx-orbit-tool is-${nodeState} tone-${tool.tone??tones[i%tones.length]}`} style={{transform:'translate(-50%,-50%)','--orbit-angle':(i*360/Math.max(1,tools.length)-90)+'deg',...(tool.position?{left:tool.position.x+'%',top:tool.position.y+'%'}:{})} as CSSProperties} onClick={tool.onClick} disabled={tool.disabled||['disabled','unavailable','loading'].includes(nodeState)} aria-pressed={tool.active} aria-current={nodeState==='active'&&tool.active===undefined?'step':undefined} aria-busy={nodeState==='loading'||undefined} title={tool.hint} data-testid={tool.testId}>
   <span className="knx-orbit-chip"><tool.icon size={24} strokeWidth={2.1} aria-hidden="true"/><span className="knx-orbit-chip-dot" aria-hidden="true"/></span><span className="knx-orbit-label">{tool.label}{!['available','active'].includes(nodeState)&&<span className="knx-sr-only"> ({stateLabel[nodeState]})</span>}</span>
  </button>;})}</nav>
 </div>;
}
