import {Brush,FolderOpen,ShieldCheck,Rocket,Search,Settings2} from 'lucide-react';
import {KnouxOrbit,type OrbitTool} from '../../visual/KnouxOrbit';
import type {HomeLiveStatus} from '../../home/live';
import './home-orbit.css';

export function HomeOrbit({isArabic,onNavigate,providerStatus}:{isArabic:boolean;onNavigate:(section:string)=>void;providerStatus:HomeLiveStatus}){
 const t=(en:string,ar:string)=>isArabic?ar:en;
 const actions=[{id:'clean',label:t('Clean','تنظيف'),target:'cleanup',icon:Brush,tone:'blue',x:25,y:17},{id:'organize',label:t('Organize','تنظيم'),target:'studio',icon:FolderOpen,tone:'violet',x:75,y:17},{id:'protect',label:t('Protect','حماية'),target:'repair',icon:ShieldCheck,tone:'emerald',x:10,y:51},{id:'optimize',label:t('Optimize','تحسين'),target:'startup',icon:Rocket,tone:'blue',x:90,y:51},{id:'scan',label:t('Scan','فحص'),target:'smart_scan',icon:Search,tone:'indigo',x:25,y:85},{id:'automate',label:t('Automate','أتمتة'),target:'automation',icon:Settings2,tone:'amber',x:75,y:85}] as const;
 const tools:OrbitTool[]=actions.map(action=>({id:action.id,label:action.label,icon:action.icon,tone:action.tone,position:{x:action.x,y:action.y},onClick:()=>onNavigate(action.target),hint:t('Open '+action.target+' workspace; changes require its approval.','فتح مساحة '+action.target+'؛ أي تغيير يتطلب موافقتها.'),testId:'home-orbit-'+action.id}));
 return <div className="knx-home-vector-instrument" data-testid="home-original-orbit" dir="ltr"><KnouxOrbit title="KNOuX" subtitle="SmartOrganizer" eyebrow={t('KNOuX service orbit','مدار خدمات KNOuX')} tools={tools} state={providerStatus==='native-required'?'unavailable':providerStatus==='live'?'ready':providerStatus} onActivate={()=>onNavigate('smart_scan')}/></div>;
}
