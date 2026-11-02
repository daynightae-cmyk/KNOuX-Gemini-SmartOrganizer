import './service-stage.css';
import {useRef, type KeyboardEvent, type ReactNode} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';

export interface CompactServiceItem {id:string;label:string;icon:ReactNode;capability:string;result?:string;hint?:string}
/** Selection only: capability and result remain separate caller-owned facts. */
export function CompactServiceDock({items,selectedId,onSelect,isArabic=false,label,actions,testIdPrefix='scan'}:{items:CompactServiceItem[];selectedId:string|null;onSelect:(id:string)=>void;isArabic?:boolean;label:string;actions?:ReactNode;testIdPrefix?:string}){
 const strip=useRef<HTMLDivElement>(null);
 function key(event:KeyboardEvent<HTMLButtonElement>,index:number){
  let next=index;
  if(event.key==='Home')next=0;
  else if(event.key==='End')next=items.length-1;
  else if(event.key==='ArrowRight')next=(index+(isArabic?-1:1)+items.length)%items.length;
  else if(event.key==='ArrowLeft')next=(index+(isArabic?1:-1)+items.length)%items.length;
  else return;
  event.preventDefault();onSelect(items[next].id);
  strip.current?.querySelectorAll<HTMLButtonElement>('[data-service-id]')[next]?.focus({preventScroll:true});
  strip.current?.querySelectorAll<HTMLButtonElement>('[data-service-id]')[next]?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
 }
 const move=(direction:number)=>strip.current?.scrollBy({left:direction*(isArabic?-1:1)*strip.current.clientWidth*.8,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
 return <nav className="knx-compact-service-dock" aria-label={label} data-testid="compact-service-dock" dir={isArabic?'rtl':'ltr'}>
  <button type="button" onClick={()=>move(-1)} aria-label={isArabic?'الخدمات السابقة':'Previous services'} data-testid={`${testIdPrefix}-services-prev`}>{isArabic?<ChevronRight aria-hidden="true"/>:<ChevronLeft aria-hidden="true"/>}</button>
  <div className="knx-compact-service-strip" role="tablist" aria-label={label} ref={strip} data-testid={`${testIdPrefix}-services-strip`}>
   {items.map((item,i)=><button key={item.id} type="button" role="tab" id={`service-tab-${item.id}`} aria-selected={selectedId===item.id} aria-controls="active-service-workspace" tabIndex={selectedId===item.id||(!selectedId&&i===0)?0:-1} data-service-id={item.id} data-testid={`${testIdPrefix}-service-${item.id}`} onClick={()=>onSelect(item.id)} onKeyDown={e=>key(e,i)} title={item.hint}>
    <span className="knx-dock-icon" aria-hidden="true">{item.icon}</span><span className="knx-dock-copy"><strong>{item.label}</strong><small>{item.capability}{item.result?` · ${item.result}`:''}</small></span>
   </button>)}
  </div>
  <button type="button" onClick={()=>move(1)} aria-label={isArabic?'الخدمات التالية':'Next services'} data-testid={`${testIdPrefix}-services-next`}>{isArabic?<ChevronLeft aria-hidden="true"/>:<ChevronRight aria-hidden="true"/>}</button>{actions}
 </nav>;
}
