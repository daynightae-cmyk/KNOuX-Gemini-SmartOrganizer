import {LiveServiceStage} from '../components/workbench/LiveServiceStage';
import type {CleanupController} from './useCleanup';
import {formatCount,formatTimestamp,t,type CleanupServiceId} from './model';

/** This adapter observes discovery/review. Approved quarantine uses the existing Safety Vault. */
export function CleanupLiveStage({controller:c,locale,service,title,selected}:{controller:CleanupController;locale:'en'|'ar';service:CleanupServiceId|null;title:string;selected:number}){
 const running=c.loading||c.refreshing||c.scanning||!!c.busy,capability=c.capabilities?.services.find(entry=>entry.id===service);
 const measured=service==='cleanup-estimate'?c.estimate?.status==='complete':service==='cleanup-unused'?!!c.unused:service==='cleanup-quarantine-list'||service==='cleanup-temp-undo'?!!c.quarantine:service==='cleanup-schedule'?!!c.schedule:service==='cleanup-reports'?!!c.report:c.inventory?.status==='complete';
 const status=!c.nativeAvailable?'UNAVAILABLE':running?'RUNNING':c.actionError?'FAILED':c.session?.status==='cancelled'?'CANCELLED':capability?.state==='gated'?'GATED':measured?(c.inventory?.warnings.length||capability?.state==='partial'?'PARTIAL':'READY'):'IDLE';
 const subtitle=c.actionError?.message||(c.scanning?t(locale,'Collecting native cleanup evidence; no cleanup action runs.','جمع أدلة التنظيف الأصلية؛ لا يُنفذ أي إجراء تنظيف.'):capability?(locale==='ar'?capability.noteAr:capability.noteEn):t(locale,'Measure the authorised cleanup sources first.','قس مصادر التنظيف المصرح بها أولًا.'));
 return <LiveServiceStage title={title} subtitle={subtitle} status={status} running={running} progress={c.scanning&&c.session?c.session.progressPercent:null} isArabic={locale==='ar'}>
  <div className="cleanup-live-facts"><span>{capability?.provider||'CleanupBridge · allowlisted roots'}</span><span>{c.inventory?.status==='complete'?formatCount(c.inventory.candidates.length):'—'} {t(locale,'measured candidates','مرشحًا مقيسًا')} · {selected} {t(locale,'selected','محدد')}</span><span>{c.inventory?.observedAt?formatTimestamp(c.inventory.observedAt,locale):t(locale,'Not measured','غير مقيس')}</span>{c.scanning&&c.inventory?.observedAt?<span>{t(locale,'Previous measured snapshot retained','الأدلة السابقة المقيسة محفوظة')}</span>:null}<code data-testid="cleanup-native-session-id">{c.session?.id}</code></div>
  <ol className="cleanup-native-stages">{c.session?.categories.map(stage=><li key={stage.key} data-state={stage.status}><strong>{stage.key}</strong><span>{stage.status}</span></li>)}</ol>
  {c.inventory?.warnings.map((warning,index)=><p key={index}>{warning}</p>)}
 </LiveServiceStage>;
}
