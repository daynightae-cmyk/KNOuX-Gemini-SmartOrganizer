import {useEffect,useRef,useState} from 'react';
import {Search,X} from 'lucide-react';
import {useStudio} from './context';
import {useNavigation} from '../context/NavigationContext';
import {ReferenceHeader,ReferenceSidebar} from '../components/shell/ReferenceChrome';
import {STUDIO_STAGES} from '../operations/organization-studio-model';
import './studio-integration.css';

/** Shared approved chrome around the existing native operation portal. */
export function StudioPage({onNavigate:_onNavigate}:{onNavigate?:(section:string)=>void}){
 const navigation=useNavigation(),studio=useStudio(),ar=navigation.isArabic;
 const [searchOpen,setSearchOpen]=useState(false),[query,setQuery]=useState(''),[notice,setNotice]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const stages=STUDIO_STAGES.map(([en,arabic],index)=>({id:index+1,en,arabic})).filter(s=>(s.en+' '+s.arabic).toLowerCase().includes(query.trim().toLowerCase()));
 useEffect(()=>{studio.setLocale(navigation.locale);},[navigation.locale,studio.setLocale]);
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setSearchOpen(v=>!v);}};
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[]);
 useEffect(()=>{
  if(!searchOpen)return;
  const previous=document.activeElement as HTMLElement|null,current=dialog.current;
  current?.showModal();return()=>{current?.close();previous?.isConnected&&previous.focus();};
 },[searchOpen]);
 const choose=(stageId:number)=>{setSearchOpen(false);setQuery('');window.dispatchEvent(new CustomEvent('knoux:live-organization',{detail:{stageId}}));};
 return <div dir={ar?'rtl':'ltr'} data-testid="studio-workspace" className="approved-home studio-integration-shell" data-theme-mode={navigation.theme === 'light' ? 'day' : 'night'}>
  <ReferenceHeader preciseThemeLabels searchLabel={ar?'ابحث عن مرحلة في استوديو التنظيم…':'Find a stage in Organization Studio…'} onSearch={()=>setSearchOpen(true)} onNotifications={()=>setNotice(v=>!v)}/>
  <div className="studio-integration-body"><ReferenceSidebar active="studio" connected={!!window.knouxOperationsV1}/><main className="os-studio-frame">
   <div id="knoux-studio-operation-stage" className="os-studio-mount" data-testid="studio-live-mount"/>
  </main></div>
  {notice&&<aside className="studio-integration-notice" role="status" data-testid="studio-status-notice"><strong>{ar?'حالة التنظيم':'Organization status'}</strong><p>{ar?'البيانات والخطط والإيصالات متاحة داخل مراحل الاستوديو. الاتصال بالمحرّك لا يثبت اكتمال أي عملية.':'Measured inventory, plans and receipts are available in Studio stages. Engine connectivity does not establish operation completion.'}</p><button data-testid="studio-open-history" onClick={()=>{setNotice(false);choose(8);}}>{ar?'فتح السجل والتراجع':'Open History & Undo'}</button><button onClick={()=>setNotice(false)}>{ar?'إغلاق':'Close'}</button></aside>}
  {searchOpen&&<dialog ref={dialog} className="home-workspace-palette" aria-label={ar?'البحث في مراحل التنظيم':'Organization stage search'} onCancel={()=>setSearchOpen(false)} onClick={e=>{if(e.target===dialog.current)setSearchOpen(false);}}>
   <header><Search/><input autoFocus aria-label="Search organization stages" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&stages[0]){e.preventDefault();choose(stages[0].id);}}}/><button aria-label="Close stage search" onClick={()=>setSearchOpen(false)}><X/></button></header>
   <nav aria-label="Organization stages">{stages.length?stages.map(s=><button key={s.id} onClick={()=>choose(s.id)}>{String(s.id).padStart(2,'0')} · {ar?s.arabic:s.en}</button>):<p role="status">{ar?'لا توجد مرحلة مطابقة':'No matching stage'}</p>}</nav>
   <footer>{ar?'تنقل فقط؛ التنفيذ يتطلب مراجعة وموافقة مستقلة.':'Navigation only; execution requires separate plan review and consent.'}</footer>
  </dialog>}
 </div>;
}
