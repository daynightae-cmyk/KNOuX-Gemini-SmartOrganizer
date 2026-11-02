import {LiveServiceStage} from '../components/workbench/LiveServiceStage';
import type {RepairController} from './useRepair';
import type {RepairToolId} from '../../shared/native-contracts';
import {TOOL_BY_ID,RISK_META,toolLabel} from './catalog';
import {t,formatTimestamp} from './model';

/** Discovery progress describes evidence collection; it never implies a repair ran. */
export function RepairLiveStage({controller:c,locale,toolId}:{controller:RepairController;locale:'en'|'ar';toolId:RepairToolId}){
 const tool=TOOL_BY_ID[toolId],running=c.loading||c.scanning||c.refreshing||!!c.busy;
 const capability=c.capabilities?.services.find(entry=>entry.id===toolId);
 const status=!c.nativeAvailable?'UNAVAILABLE':running?'RUNNING':c.actionError?'FAILED':c.session?.status==='cancelled'?'CANCELLED':!c.snapshot?'IDLE':(capability?.state||tool.state)==='gated'?'GATED':c.session?.status==='partial'||c.snapshot.coverage.some(entry=>entry.status!=='complete')?'PARTIAL':'READY';
 const subtitle=c.actionError?.message||(c.scanning?t(locale,'Collecting read-only repair evidence; no repair command runs.','جمع أدلة الإصلاح للقراءة فقط؛ لا يُنفذ أي أمر إصلاح.'):locale==='ar'?tool.blurbAr:tool.blurbEn);
 return <LiveServiceStage title={toolLabel(toolId,locale)} subtitle={subtitle} status={status} running={running} progress={c.scanning&&c.session?c.session.progress:null} isArabic={locale==='ar'}>
  <div className="repair-live-facts"><span>{capability?.provider||tool.provider}</span><span>{locale==='ar'?RISK_META[tool.risk].ar:RISK_META[tool.risk].en}</span><span>{c.snapshot?formatTimestamp(c.snapshot.generatedAt,locale):t(locale,'Not measured','غير مقيس')}</span>{c.snapshot&&(c.scanning||c.session?.status==='cancelled')?<span>{t(locale,'Previous measured snapshot retained','الأدلة السابقة المقيسة محفوظة')}</span>:null}<span>{t(locale,'Read-only evidence · repair execution unavailable','أدلة للقراءة فقط · تنفيذ الإصلاح غير متاح')}</span><code data-testid="repair-native-session-id">{c.session?.id}</code></div>
  <ol className="repair-native-stages">{c.session?.stages.map(stage=><li key={stage.key} data-state={stage.status}><strong>{locale==='ar'?stage.labelAr:stage.labelEn}</strong><span>{stage.status}</span><small>{stage.provider}</small></li>)}</ol>
  {c.snapshot?.warnings.map((warning,index)=><p key={index}>{warning}</p>)}
 </LiveServiceStage>;
}
