import type {CSSProperties} from 'react';
import artwork from '../../assets/anima/knoux-orbital-emblem.png';
import './recovered-home-orbit.css';

// Coordinates are percentages of the original 1328×784 image. The bitmap never
// mirrors, crops, filters or stretches; only the controls receive focus styling.
const actions=[
 {id:'clean',label:'Clean',ar:'تنظيف · فتح خزنة التنظيف',target:'cleanup',x:15,y:1,w:15,h:31},
 {id:'organize',label:'Organize',ar:'تنظيم · فتح استوديو التنظيم',target:'studio',x:64,y:1,w:17,h:30},
 {id:'protect',label:'Protect',ar:'حماية · فتح مختبر الفحص والإصلاح',target:'repair',x:2,y:37,w:16,h:29},
 {id:'optimize',label:'Optimize',ar:'تحسين · فتح التحكم في بدء التشغيل',target:'startup',x:77,y:37,w:17,h:29},
 {id:'scan',label:'Scan',ar:'فحص · فتح الفحص الذكي',target:'smart_scan',x:15,y:67,w:15,h:28},
 {id:'automate',label:'Automate',ar:'أتمتة · فتح استوديو الأتمتة',target:'automation',x:63,y:65,w:18,h:29},
] as const;
export function RecoveredHomeOrbit({isArabic,onNavigate}:{isArabic:boolean;onNavigate:(section:string)=>void}){
 return <div className="knx-recovered-orbit" data-testid="home-original-orbit" dir="ltr" role="group" aria-label={isArabic?'أدوات KNOuX المدارية الأصلية':'Original KNOuX orbital tools'}>
  <img src={artwork} width={1328} height={784} alt="KNOuX SmartOrganizer — Clean, Organize, Protect, Optimize, Scan, Automate" draggable={false} data-testid="home-original-orbit-image"/>
  {actions.map(action=><button key={action.id} type="button" className="knx-recovered-hotspot" data-testid={'home-orbit-'+action.id} aria-label={isArabic?action.ar:action.label+' · open '+action.target+' workspace'} title={isArabic?action.ar:action.label+' · open workspace; approval is required for changes'} style={{left:action.x+'%',top:action.y+'%',width:action.w+'%',height:action.h+'%'} as CSSProperties} onClick={()=>onNavigate(action.target)}><span className="knx-sr-only">{isArabic?action.ar:action.label}</span></button>)}
 </div>;
}
