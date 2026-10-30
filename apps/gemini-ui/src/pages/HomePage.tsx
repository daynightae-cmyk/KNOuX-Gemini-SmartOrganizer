import {useEffect,useRef,useState} from 'react';
import {Search,X,ChevronRight} from 'lucide-react';
import {ApprovedHomeScreen} from '../components/home/ApprovedHomeScreen';
import {SECTIONS_DIRECTORY,useNavigation} from '../context/NavigationContext';
import {useHomeLive} from '../home/live';

interface HomePageProps {onNavigateSection?:(section:string)=>void;onNavigate?:(section:string)=>void}
/** One existing route and local native aggregator; only the visual composition changes. */
export function HomePage({onNavigateSection,onNavigate}:HomePageProps){
 const navigation=useNavigation(),homeLive=useHomeLive();
 const [paletteOpen,setPaletteOpen]=useState(false),[query,setQuery]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);
 const navigate=(section:string)=>(onNavigateSection??onNavigate??navigation.navigateTo)(section);
 const sections=SECTIONS_DIRECTORY.filter(section=>(section.id+' '+section.labelEn+' '+section.labelAr).toLowerCase().includes(query.trim().toLowerCase()));
 useEffect(()=>{
  const open=()=>setPaletteOpen(true);
  const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setPaletteOpen(v=>!v);}if(e.key==='Escape')setPaletteOpen(false);};
  window.addEventListener('knoux:open-commands',open);window.addEventListener('keydown',key);
  document.documentElement.dataset.page='home';
  return()=>{window.removeEventListener('knoux:open-commands',open);window.removeEventListener('keydown',key);delete document.documentElement.dataset.page;};
 },[]);
 useEffect(()=>{
  if(!paletteOpen)return;
  const previous=document.activeElement as HTMLElement|null,current=dialog.current;
  current?.showModal();
  return()=>{current?.close();previous?.isConnected&&previous.focus();};
 },[paletteOpen]);
 const choose=(section:string)=>{setPaletteOpen(false);setQuery('');navigate(section);};
 return <>
  <ApprovedHomeScreen isArabic={navigation.isArabic} theme={navigation.theme} onNavigate={navigate} live={{...homeLive,observations:homeLive.observations??{}}}/>
  {paletteOpen&&<dialog ref={dialog} className="home-workspace-palette" aria-label={navigation.isArabic?'البحث في مساحات العمل':'Workspace tools'} onCancel={()=>setPaletteOpen(false)} onClick={event=>{if(event.target===dialog.current)setPaletteOpen(false);}}>
   <header><Search aria-hidden="true"/><input autoFocus aria-label="Search workspaces" value={query} placeholder={navigation.isArabic?'ابحث عن قسم أو أداة…':'Jump to a workspace, service, or tool…'} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&sections[0]){e.preventDefault();choose(sections[0].id);}}}/><button aria-label="Close workspace search" onClick={()=>setPaletteOpen(false)}><X/></button></header>
   <nav aria-label="Workspace search results">{sections.length?sections.map(section=><button key={section.id} onClick={()=>choose(section.id)}><span>{navigation.isArabic?section.labelAr:section.labelEn}</span><ChevronRight/></button>):<p role="status">{navigation.isArabic?'لا توجد أقسام مطابقة':'No matching workspace'}</p>}</nav>
   <footer>{navigation.isArabic?'Enter للفتح · Esc للإغلاق':'Enter to open · Esc to close'}</footer>
  </dialog>}
 </>;
}
export default HomePage;
