import {LiveServiceStage} from '../components/workbench/LiveServiceStage';
import type {ApplicationsController} from './useApplications';
import type {DomainServiceKey} from './catalog';
import {formatCount,formatTimestamp,t} from './model';

/** Real controller facts only; activity without a provider total is indeterminate. */
export function ApplicationsLiveStage({controller:c,locale,service,title,selected,selectedAppId}:{controller:ApplicationsController;locale:'en'|'ar';service:DomainServiceKey|null;title:string;selected:number;selectedAppId:string|null}){
 const running=c.loading||c.refreshing||!!c.signatureBusyId||c.sizesBusy||c.associationsBusy||c.leftoversBusy||c.updatesBusy||c.packagesBusy||c.planBusy;
 const capability=c.capabilities?.services.find(entry=>entry.id===service);
 const measured=service==='app-identity'?!!(selectedAppId&&c.signatures[selectedAppId]):service==='app-size'?!!c.sizesStatus&&!c.sizesStatus.running:service==='app-leftovers'?!!c.leftovers:service==='app-associations'?!!c.associations:service==='app-updates'?!!c.updates&&c.updates.status!=='not-checked':service==='app-store-packages'?!!c.packages:!!c.inventory;
 const providerStatus=service==='app-updates'?c.updates?.status:service==='app-store-packages'?c.packages?.status:null;
 const status=!c.nativeAvailable?'UNAVAILABLE':running?'RUNNING':c.actionError?'FAILED':capability?.state==='gated'?'GATED':providerStatus&&['unavailable','blocked','failed','unsupported'].includes(providerStatus)?providerStatus.toUpperCase():measured?(capability?.state==='partial'||c.inventory?.warnings.length?'PARTIAL':'READY'):'IDLE';
 const subtitle=c.actionError?.message||c.signatureBusyId?t(locale,c.actionError?.message||'Reading the selected executable signature…',c.actionError?.message||'قراءة توقيع الملف التنفيذي المحدد…'):c.sizesBusy?t(locale,'Measuring bounded application folders…','قياس مجلدات التطبيقات ضمن الحدود…'):c.updatesBusy?t(locale,'Querying the existing WinGet provider…','الاستعلام من مزود WinGet الحالي…'):running?t(locale,'Reading native application providers…','قراءة مزودي التطبيقات الأصليين…'):capability?(locale==='ar'?capability.noteAr:capability.noteEn):t(locale,'Read-only native application register','سجل التطبيقات الأصلي للقراءة فقط');
 const progress=c.sizesBusy&&c.sizesStatus?.requested?100*c.sizesStatus.measured/c.sizesStatus.requested:null;
 return <LiveServiceStage title={title} subtitle={subtitle} status={status} running={running} progress={progress} isArabic={locale==='ar'}>
  <div className="apps-live-facts"><span>{capability?.provider||'Uninstall registry · Appx/MSIX · Win32_StartupCommand'}</span><span>{c.inventory?formatCount(c.inventory.kpis.installed):'—'} {t(locale,'measured applications','تطبيقًا مقيسًا')} · {selected} {t(locale,'selected','محدد')}</span>{c.inventory?<time>{formatTimestamp(c.inventory.observedAt,locale)}</time>:null}{c.sizesStatus?<span>{c.sizesStatus.measured} / {c.sizesStatus.requested} {t(locale,'size measurements','قياس حجم')}</span>:null}</div>
  {c.inventory?.warnings.map((warning,index)=><p key={index}>{warning}</p>)}
  {service==='app-size'?c.sizesStatus?.warnings.map((warning,index)=><p key={'size-'+index}>{warning}</p>):null}
 </LiveServiceStage>;
}
