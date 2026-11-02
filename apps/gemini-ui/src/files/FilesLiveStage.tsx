import {LiveServiceStage} from '../components/workbench/LiveServiceStage';
import type {useFilesNative} from './useFilesNative';
import {formatBytes} from './useFilesNative';

export function FilesLiveStage({native,locale,query,returned,title}:{native:ReturnType<typeof useFilesNative>;locale:'en'|'ar';query:string;returned:number;title:string}){
 const ar=locale==='ar',running=native.scanning||native.querying||native.metadataLoading||native.hashLoading||native.emptyFoldersLoading;
 const status=native.error?'FAILED':!native.available?'UNAVAILABLE':running?'RUNNING':native.overview?.coverage==='partial'?'PARTIAL':native.overview?'READY':'IDLE';
 const description=native.scanning?(ar?'فهرسة النطاق المصرح؛ أعداد من أحداث المزود.':'Indexing authorized scope; counts come from provider events.'):native.querying?(ar?'بحث في الفهرس الأصلي…':'Querying the native index…'):native.hashLoading?(ar?'قراءة محتوى الملف لحساب البصمة…':'Reading selected file for hashing…'):native.metadataLoading?(ar?'قراءة البيانات الوصفية…':'Reading file metadata…'):native.error||(native.source?.label??(ar?'اختار مجلدًا للتصريح بالفهرسة.':'Choose a folder to authorize indexing.'));
 return <LiveServiceStage title={title} subtitle={description} status={status} running={running} progress={null} isArabic={ar}>
  <div className="files-live-facts"><span>{native.source?.path||(ar?'لا يوجد مصدر مصرح':'No authorized source')}</span>{native.lastIndexEvent?<span>{native.lastIndexEvent.type} · {native.lastIndexEvent.message}</span>:null}{native.progress&&native.scanning?<span>{native.progress.files} {ar?'ملف':'files'} · {native.progress.folders} {ar?'مجلد':'folders'} · {formatBytes(native.progress.bytes)}</span>:null}{native.overview?<><span>{returned} / {native.overview.totals.files} {ar?'صف محمل / ملف مفهرس':'loaded rows / indexed files'}</span><span>{native.overview.scannedAt}</span><span>{native.overview.coverage}</span></>:null}{query?<span>{ar?'البحث':'Search'}: {query}</span>:null}{native.warnings.map((warning,i)=><span key={i}>{warning}</span>)}</div>
 </LiveServiceStage>;
}
