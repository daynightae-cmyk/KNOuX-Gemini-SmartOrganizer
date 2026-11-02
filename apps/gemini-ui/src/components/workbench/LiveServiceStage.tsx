import {useState,type ReactNode} from 'react';
import {Activity,ChevronDown} from 'lucide-react';

/** Presentation only. Native status strings and measured values come from the domain. */
export function LiveServiceStage({title,subtitle,status,running,progress,children,isArabic=false}:{title:string;subtitle:string;status:string;running:boolean;progress:number|null;children:ReactNode;isArabic?:boolean}){
 const [expanded,setExpanded]=useState(false);
 return <section className="knx-live-service-stage" data-testid="live-service-stage" data-native-status={status} aria-label={isArabic?'معاينة العملية':'Process preview'}>
  <div className="knx-stage-line"><Activity className={running?'is-active':''} aria-hidden="true"/><div><strong>{title}</strong><small>{subtitle}</small></div><span className="knx-stage-state" role="status">{status}</span>
   {running?<progress aria-label={isArabic?'تقدم الجلسة المقيس':'Measured session progress'} {...(progress==null?{}:{value:Math.max(0,Math.min(100,progress)),max:100})}/>:null}
   <button type="button" aria-expanded={expanded} aria-label={isArabic?'تفاصيل العملية':'Process details'} onClick={()=>setExpanded(v=>!v)}><ChevronDown aria-hidden="true"/></button>
  </div><div className="knx-stage-detail" data-expanded={expanded}>{children}</div>
 </section>;
}
