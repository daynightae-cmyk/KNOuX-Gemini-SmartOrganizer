import {LiveServiceStage} from '../components/workbench/LiveServiceStage';
import {storageServiceLabel} from './StorageServiceFocus';
import {formatStorageBytes,useStorageNative} from './useStorageNative';

/** Scope indexing and volume inventory are separate native measurements. */
export function StorageLiveStage({native:n,service,isArabic:ar}:{native:ReturnType<typeof useStorageNative>;service:string|null;isArabic:boolean}){
 const label=(en:string,arabic:string)=>ar?arabic:en;
 const volumeService=!service||['storage-disks','storage-history','storage-removable'].includes(service);
 const unsupported=service==='storage-smart'||service==='storage-fragmentation';
 const running=n.scanning||n.analysisLoading||n.volumesLoading||n.verifying;
 const status=!n.available?'UNAVAILABLE':running?'RUNNING':n.error||n.volumesError?'FAILED':n.scanOutcome==='cancelled'?'CANCELLED':unsupported?'GATED':volumeService?(n.volumes.length?'READY':'IDLE'):n.analysis?((n.analysis.coverage.partial||n.analysis.coverage.warnings.length)?'PARTIAL':'READY'):'IDLE';
 return <LiveServiceStage title={service?storageServiceLabel(service,ar).title:label('Volume Atlas','أطلس التخزين')} subtitle={n.error||n.volumesError||(unsupported?label('Provider capability evidence; no SMART or defrag execution channel.','أدلة قدرات المزود؛ لا توجد قناة تنفيذ SMART أو إلغاء تجزئة.'):n.scanning?label('Indexing the authorised folder; volume capacity is measured separately.','فهرسة المجلد المصرح؛ سعة الأقراص تُقاس بشكل منفصل.'):label('Read-only native evidence. Folder intelligence requires an authorised scope.','أدلة أصلية للقراءة فقط. تحليل الملفات يحتاج نطاقًا مصرحًا.'))} running={running} progress={null} status={status} isArabic={ar}>
  <div className="storage-live-facts"><span>{n.volumes.length} {label('measured volumes','وحدات مقيسة')}</span><span data-testid="storage-source-id">{n.source?.id}</span><span>{n.source?.label||label('No authorised folder','لا يوجد مجلد مصرح')}</span><span>{n.analysis?`${n.analysis.totals.files} ${label('files','ملف')} · ${formatStorageBytes(n.analysis.totals.bytes)}`:label('Folder not measured','المجلد غير مقيس')}</span>{n.analysis?.coverage.lastScanned?<time>{n.analysis.coverage.lastScanned}</time>:null}{n.progress&&n.scanning?<span>{n.progress.files} {label('files indexed','ملفًا مفهرسًا')} · {n.progress.folders} {label('folders','مجلدًا')} · {formatStorageBytes(n.progress.bytes)}</span>:null}</div>
  {[...n.volumesWarnings,...(n.analysis?.coverage.warnings||[])].map((warning,i)=><p key={i}>{warning}</p>)}
 </LiveServiceStage>;
}
