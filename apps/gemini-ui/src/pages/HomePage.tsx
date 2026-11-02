import {useEffect,useRef,useState} from 'react';
import {Search,X,ChevronRight} from 'lucide-react';
import {ApprovedHomeScreen} from '../components/home/ApprovedHomeScreen';
import {SECTIONS_DIRECTORY,useNavigation} from '../context/NavigationContext';
import {useHomeLive} from '../home/live';
import {searchHomeInventory,publishSearchIntent,type InventoryHit} from '../home/search';

interface HomePageProps {onNavigateSection?:(section:string)=>void;onNavigate?:(section:string)=>void}
/** One existing route and local native aggregator; only the visual composition changes. */
export function HomePage({onNavigateSection,onNavigate}:HomePageProps){
 const navigation=useNavigation(),homeLive=useHomeLive();
 const [paletteOpen,setPaletteOpen]=useState(false),[query,setQuery]=useState('');
 const [inventoryHits,setInventoryHits]=useState<InventoryHit[]>([]),[searchBusy,setSearchBusy]=useState(false),[searchPartial,setSearchPartial]=useState(false);
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
 useEffect(()=>{
  let active=true;
  setInventoryHits([]);setSearchPartial(false);
  if(!paletteOpen||query.trim().length<2){setSearchBusy(false);return;}
  setSearchBusy(true);
  const timer=window.setTimeout(()=>{
   void searchHomeInventory(query,homeLive).then(result=>{if(active){setInventoryHits(result.hits);setSearchPartial(result.warnings.length>0);}})
    .catch(()=>{if(active)setSearchPartial(true);}).finally(()=>{if(active)setSearchBusy(false);});
  },180);
  return()=>{active=false;window.clearTimeout(timer);};
 },[paletteOpen,query,homeLive.sources,homeLive.apps,homeLive.observations]);
 const chooseInventory=(hit:InventoryHit)=>{publishSearchIntent(hit);choose(hit.kind==='file'?'files':'applications');};
 return <>
  <ApprovedHomeScreen isArabic={navigation.isArabic} theme={navigation.theme} onNavigate={navigate} live={{...homeLive,observations:homeLive.observations??{}}}/>
  {paletteOpen&&<dialog ref={dialog} className="home-workspace-palette" aria-label={navigation.isArabic?'البحث في مساحات العمل':'Workspace tools'} onCancel={()=>setPaletteOpen(false)} onClick={event=>{if(event.target===dialog.current)setPaletteOpen(false);}}>
   <header><Search aria-hidden="true"/><input autoFocus aria-label="Search workspaces" maxLength={200} value={query} placeholder={navigation.isArabic?'ابحث عن قسم أو تطبيق أو ملف مفهرس…':'Search workspaces, measured apps or indexed files…'} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();if(sections[0])choose(sections[0].id);else if(inventoryHits[0])chooseInventory(inventoryHits[0]);}}}/><button aria-label="Close workspace search" onClick={()=>setPaletteOpen(false)}><X/></button></header>
   <nav aria-label="Workspace search results">{sections.length?sections.map(section=><button key={section.id} onClick={()=>choose(section.id)}><span>{navigation.isArabic?section.labelAr:section.labelEn}</span><ChevronRight/></button>):<p role="status">{navigation.isArabic?'لا توجد أقسام مطابقة':'No matching workspace'}</p>}</nav>
   {query.trim().length>=2&&<nav aria-label="Measured inventory search" data-testid="home-inventory-search" aria-busy={searchBusy}>
    {searchBusy&&<p role="status">{navigation.isArabic?'جارٍ قراءة الفهارس المصرح بها…':'Reading authorized indexes…'}</p>}
    {inventoryHits.map(hit=><button key={hit.key} data-testid={`home-search-${hit.kind}`} onClick={()=>chooseInventory(hit)}><span>{hit.label}<small style={{display:'block'}}>{hit.kind==='file'?(navigation.isArabic?'بحث في الملفات':'Find in Files'):(navigation.isArabic?'مراجعة التطبيق':'Review application')} · {hit.source}</small></span><ChevronRight/></button>)}
    {!searchBusy&&!inventoryHits.length&&<p role="status">{navigation.isArabic?'لا توجد نتائج مقيسة مطابقة.':'No matching measured inventory results.'}</p>}
    {searchPartial&&<p role="status">{navigation.isArabic?'التغطية محدودة أو بعض المزوّدات غير متاحة. راجع القسم المختص.':'Coverage is limited or some providers are unavailable. Review the owning workspace.'}</p>}
   </nav>}
   <footer>{navigation.isArabic?'Enter للانتقال · Esc للإغلاق · لا يتم فتح ملفات أو تشغيل تطبيقات':'Enter to navigate · Esc to close · No files opened or apps launched'}</footer>
  </dialog>}
 </>;
}
export default HomePage;
