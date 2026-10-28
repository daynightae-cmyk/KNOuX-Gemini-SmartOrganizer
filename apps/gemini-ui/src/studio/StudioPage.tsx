import {useEffect,useState} from 'react';
import {GlobalSidebar} from './parts';
import {useStudio} from './context';
import {useNavigation} from '../context/NavigationContext';
import {KNOuXTitleBar} from '../components/shell/KNOuXShellComponents';
import {StudioReferenceOverview} from '../visual/StudioReferenceOverview';
import type {StudioStageId} from './types';

export function StudioPage({onNavigate}:{onNavigate?:(section:string)=>void}){
 const navigation=useNavigation(),studio=useStudio();
 const [overviewVisible,setOverviewVisible]=useState(false);
 const ar=navigation.isArabic;
 useEffect(()=>{studio.setLocale(navigation.locale);},[navigation.locale,studio.setLocale]);
 useEffect(()=>{const show=()=>setOverviewVisible(false);window.addEventListener('knoux:live-organization',show);return()=>window.removeEventListener('knoux:live-organization',show);},[]);
 const openStage=(stageId:StudioStageId)=>{setOverviewVisible(false);window.dispatchEvent(new CustomEvent('knoux:live-organization',{detail:{stageId}}));};
 return <div dir={ar?'rtl':'ltr'} data-testid="studio-workspace" className="w-screen h-screen flex flex-col overflow-hidden relative os-studio-shell">
  <KNOuXTitleBar sectionName={ar?'استوديو التنظيم':'Organization Studio'} isArabic={ar} onToggleArabic={()=>navigation.setLocale(ar?'en':'ar')} onNavigateHome={()=>navigation.navigateTo('home')}/>
  <div className="flex flex-1 min-h-0 overflow-hidden"><GlobalSidebar onNavigate={onNavigate}/><main className="os-studio-frame">
   <div className="os-view-switch"><button data-testid="studio-live-organization" aria-pressed={!overviewVisible} onClick={()=>setOverviewVisible(false)}>{ar?'استوديو التنظيم الحي':'Live Organization Studio'}</button><button aria-pressed={overviewVisible} onClick={()=>setOverviewVisible(true)}>{ar?'لوحة التنظيم':'Organization overview'}</button></div>
   {overviewVisible&&<StudioReferenceOverview onOpen={openStage}/>}
   <div id="knoux-studio-operation-stage" className="os-studio-mount" data-testid="studio-live-mount" style={{display:overviewVisible?'none':undefined}}/>
  </main></div>
 </div>;
}
