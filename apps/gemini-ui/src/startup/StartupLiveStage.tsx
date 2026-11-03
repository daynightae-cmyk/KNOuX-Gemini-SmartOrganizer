import {LiveServiceStage} from '../components/workbench/LiveServiceStage';
import type {StartupController} from './useStartup';
import {t,formatCount,formatTimestamp,type StartupServiceId} from './model';

/** Observes discovery only. Exact HKCU change approval remains in the original workbench. */
export function StartupLiveStage({controller:c,locale,service,title}:{controller:StartupController;locale:'en'|'ar';service:StartupServiceId|null;title:string}){
 const running=c.loading||c.refreshing||c.scanning||!!c.busy,capability=c.capabilities?.services.find(x=>x.id===service);
 const status=!c.nativeAvailable?'UNAVAILABLE':running?'RUNNING':c.actionError?'FAILED':c.session?.status==='cancelled'?'CANCELLED':capability?.state==='gated'?'GATED':c.inventory?(c.inventory.status==='partial'||c.inventory.warnings.length?'PARTIAL':'READY'):'IDLE';
 return <LiveServiceStage title={title} subtitle={c.actionError?.message||(c.scanning?t(locale,'Reading native startup providers; no startup setting changes.','قراءة مزودي بدء التشغيل الأصليين؛ لا تتغير إعدادات البدء.'):capability?(locale==='ar'?capability.noteAr:capability.noteEn):t(locale,'Measured autoruns and boot evidence; changes require a separate exact approval.','مداخل بدء وأدلة إقلاع مقيسة؛ التغييرات تتطلب موافقة دقيقة منفصلة.'))} running={running} progress={null} status={status} isArabic={locale==='ar'}>
  <div className="startup-live-facts"><span>{capability?.provider||'StartupBridge'}</span><span>{c.inventory?formatCount(c.inventory.entries.length):'—'} {t(locale,'measured entries','مدخلًا مقيسًا')}</span><span>{c.inventory?formatTimestamp(c.inventory.observedAt,locale):t(locale,'Not measured','غير مقيس')}</span>{c.scanning&&c.inventory?<span>{t(locale,'Previous measured snapshot retained','الأدلة السابقة المقيسة محفوظة')}</span>:null}<code data-testid="startup-native-session-id">{c.session?.id}</code></div>
  <ol className="startup-native-stages">{c.session?.stages.map(stage=><li key={stage.key} data-state={stage.status}><strong>{locale==='ar'?stage.labelAr:stage.labelEn}</strong><span>{stage.status}</span><span>{stage.detail}</span></li>)}</ol>
  {c.inventory?.warnings.map((warning,index)=><p key={index}>{warning}</p>)}
 </LiveServiceStage>;
}
