import {useEffect} from 'react';
import {GlobalSidebar} from './parts';
import {useStudio} from './context';
import {useNavigation} from '../context/NavigationContext';
import {KNOuXTitleBar} from '../components/shell/KNOuXShellComponents';

export function StudioPage({onNavigate}:{onNavigate?:(section:string)=>void}){
 const navigation=useNavigation(),studio=useStudio();
 const ar=navigation.isArabic;
 useEffect(()=>{studio.setLocale(navigation.locale);},[navigation.locale,studio.setLocale]);
 return <div dir={ar?'rtl':'ltr'} data-testid="studio-workspace" className="w-screen h-screen flex flex-col overflow-hidden relative os-studio-shell">
  <KNOuXTitleBar sectionName={ar?'استوديو التنظيم':'Organization Studio'} isArabic={ar} onToggleArabic={()=>navigation.setLocale(ar?'en':'ar')} onNavigateHome={()=>navigation.navigateTo('home')}/>
  <div className="flex flex-1 min-h-0 overflow-hidden"><GlobalSidebar onNavigate={onNavigate}/><main className="os-studio-frame">
   <div id="knoux-studio-operation-stage" className="os-studio-mount" data-testid="studio-live-mount"/>
  </main></div>
 </div>;
}
