import {LiveServiceStage} from '../components/workbench/LiveServiceStage';
import type {OperationEvent,OperationReceipt} from '../../shared/operation-contract';
import {formatBytes} from './organization-studio-model';

/** State adapter only: no new coordinator, progress timer or filesystem access. */
export function StudioLiveStage({ar,title,available,busy,partial,scanned,error,source,destination,files,selected,bytes,stage,receipt,events}:{ar:boolean;title:string;available:boolean;busy:boolean;partial:boolean;scanned:boolean;error:string;source?:string;destination?:string;files:number;selected:number;bytes:number;stage:number;receipt:OperationReceipt|null;events:OperationEvent[]}){
 const latest=events.at(-1),progress=[...events].reverse().find(event=>event.opId===latest?.opId&&typeof event.total==='number'&&event.total>0&&typeof event.completed==='number');
 const status=!available?'UNAVAILABLE':busy?'RUNNING':partial?'PARTIAL':error?'FAILED':[7,8].includes(stage)&&receipt?receipt.status.toUpperCase():scanned?'READY':'IDLE';
 const subtitle=busy?(latest?.currentName||latest?.file?.name||latest?.phase||(ar?'طلب للمحرك الأصلي…':'Native request in progress…')):error||source||(ar?'صرّح بمجلد مصدر لبدء الاكتشاف.':'Authorize a source folder to begin discovery.');
 return <LiveServiceStage title={title} subtitle={subtitle} status={status} running={busy} progress={busy&&progress?100*progress.completed!/progress.total!:null} isArabic={ar}>
  <div className="studio-live-facts"><span>{source||(ar?'لا يوجد مصدر مصرح':'No authorized source')}</span><span>→ {destination||(ar?'لم تحدد الوجهة':'No destination selected')}</span><span>{scanned?files:'—'} {ar?'ملف مقيس':'measured files'} · {selected} {ar?'محدد':'selected'} · {formatBytes(bytes)}</span></div>
  <ol className="studio-native-events">{events.slice(-8).map(event=><li key={event.sequence}><time>{event.timestamp}</time><strong>{event.phase}</strong><span>{event.currentName||event.file?.name||''} {event.completed!==undefined?`${event.completed} / ${event.total??'—'}`:''}</span></li>)}</ol>
 </LiveServiceStage>;
}
