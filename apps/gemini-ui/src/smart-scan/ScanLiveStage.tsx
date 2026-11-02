import {LiveServiceStage} from '../components/workbench/LiveServiceStage';
import type {ScanServiceMeta,ActiveScanView,ScanStageView} from './smartScan.types';
import type {ScanSession,StudioSource} from '../../shared/native-contracts';
import {ScanStageConsole} from './ScanStageConsole';
import {sessionStatusLabel,formatBytes,modeLabel} from './model';

export function ScanLiveStage({service,active,session,source,stages,nativeAvailable,busy,error,isArabic}:{service:ScanServiceMeta|null;active:ActiveScanView|null;session:ScanSession|null;source:StudioSource|null;stages:ScanStageView[];nativeAvailable:boolean;busy:boolean;error:string|null;isArabic:boolean}){
 const ar=isArabic;
 const currentSession=active&&session?.id!==active.sessionId?null:session;
 const measuredService=currentSession?.services.find(s=>s.serviceId===service?.id);
 const status=error?'FAILED':active?active.status.toUpperCase():!nativeAvailable?'UNAVAILABLE':busy?'RUNNING':measuredService?measuredService.status.toUpperCase():source?.status==='ready'||service&&!service.requiresSource?'READY':'IDLE';
 const lastStage=active?.stages.filter(s=>s.status!=='pending').at(-1);
 const summary=measuredService||active?currentSession?.summary:undefined;
 const scopeLabel=active?.sourceLabel||(measuredService?currentSession?.sourceLabel:source?.label)||(service&&!service.requiresSource?(ar?'مزودات النظام فقط':'System providers only'):(ar?'لا يوجد مجلد مصرح':'No authorized folder'));
 const description=error||lastStage?.detail||lastStage?.provider||(active?(ar?'جلسة القياس الأصلية قيد التشغيل؛ التقدم من أحداث المزود.':'Native scan session running; progress comes from provider events.'):measuredService?`${measuredService.source} · ${measuredService.finishedAt||measuredService.startedAt}`:(ar?'اختار خدمة وحدد نطاقها. النتائج تظهر بعد القياس فقط.':'Choose a service and its scope. Results appear only after measurement.'));
 return <LiveServiceStage title={active?`${ar?'جلسة نشطة':'Active session'} · ${modeLabel(active.mode as ScanSession['mode'],ar)}`:service?(ar?service.titleAr:service.titleEn):(ar?'استوديو الفحص':'Scan operations')} subtitle={description} status={status} running={!!active||busy} progress={active?.stages.length?active.progressPercent:null} isArabic={ar}>
  <div className="scan-stage-facts"><span>{ar?'النطاق':'Scope'}: {scopeLabel}</span><span>{service?.state||(!nativeAvailable?'native-required':'read-only')}</span>{summary?<><span>{summary.filesIndexed==null?(ar?'عدد الملفات غير متاح':'File count unavailable'):`${summary.filesIndexed.toLocaleString()} ${ar?'ملف مقيس':'indexed files'}`}</span><span>{summary.bytesIndexed==null?'—':formatBytes(summary.bytesIndexed,ar)}</span><span>{summary.findingsCount} {ar?'نتيجة للجلسة':'session findings'} · {sessionStatusLabel(currentSession!.status,ar)}</span></>:null}</div>
  <ScanStageConsole active={active} summary={summary||null} stages={stages} isArabic={ar}/>
 </LiveServiceStage>;
}
