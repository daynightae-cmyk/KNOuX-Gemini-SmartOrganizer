import {FolderPlus,FolderSearch,ShieldCheck} from 'lucide-react';
import type {ScanServiceMeta} from './smartScan.types';
import type {StudioSource} from '../../shared/native-contracts';
import {scanServiceIcon} from './ScanServices';

const topics:Record<string,[string[],string[]]>={
 quick_scan:[['Authorized inventory','File categories','Quick findings'],['المخزون المصرح','فئات الملفات','نتائج سريعة']],
 deep_scan:[['Extended provider stages','Coverage and skipped items','Detailed findings'],['مراحل المزود الموسعة','التغطية والعناصر المتخطاة','النتائج التفصيلية']],
 duplicate_finder:[['Size candidates','Actual hash verification','Side-by-side review'],['مرشحو الحجم','التحقق الفعلي بالبصمة','مراجعة الملفات جنبًا لجنب']],
 large_files_review:[['Measured size ranking','Name and location filters','Studio transfer review'],['ترتيب بالحجم المقيس','تصفية الاسم والمسار','مراجعة النقل في Studio']],
 junk_cleaner:[['Eligible candidates','Protected exclusions','Safe Cleanup handoff'],['العناصر المرشحة','الاستثناءات المحمية','تسليم آمن للتنظيف']],
 privacy_trace_check:[['Privacy categories','Zone metadata samples','Explicit scope limits'],['فئات الخصوصية','عينات بيانات المنطقة','حدود النطاق الواضحة']],
 startup_impact_check:[['Startup entries','Publisher and status','Available impact evidence'],['عناصر بدء التشغيل','الناشر والحالة','دليل التأثير المتاح']],
 app_health_review:[['Application inventory','Versions and publishers','Capability coverage'],['مخزون التطبيقات','الإصدارات والناشرون','تغطية القدرات']],
 system_health_pulse:[['CPU and memory observation','Storage measurements','Timestamped evidence'],['مراقبة المعالج والذاكرة','قياسات التخزين','دليل مؤرخ']],
 smart_recommendations:[['Evidence source','Priority and explanation','Destination workspace'],['مصدر الدليل','الأولوية والتفسير','مساحة العمل التالية']],
};
export function ScanServiceReady({service,source,isArabic:ar,onAuthorize,onIndex,busy,reason}:{service:ScanServiceMeta;source?:StudioSource|null;isArabic:boolean;onAuthorize?:()=>void;onIndex?:()=>void;busy:boolean;reason?:string|null}){
 const needsIndex=service.requiresSource&&source&&source.status!=='ready';
 return <div className="scan-ready-stage" data-testid="scan-service-ready">
  <div className="scan-ready-intro"><span className="scan-ready-icon">{scanServiceIcon(service.iconName)}</span><div><span className="scan-eyebrow">{ar?'مساحة قياس للقراءة فقط':'Read-only measurement workspace'}</span><h3>{ar?service.titleAr:service.titleEn}</h3><p>{ar?service.noteAr:service.noteEn}</p></div></div>
  <div className="scan-ready-topics">{(topics[service.id]?.[ar?1:0]||[]).map((label,i)=><div key={label}><span aria-hidden="true">{i===0?<FolderSearch/>:<ShieldCheck/>}</span><strong>{label}</strong></div>)}</div>
  <div className="scan-ready-scope"><FolderPlus aria-hidden="true"/><div><strong>{service.requiresSource?(source?.label||(ar?'اختار المجلد اللي تسمح بفحصه':'Choose the folder you authorize')):(ar?'مزودات النظام المتاحة':'Available system providers')}</strong><p>{service.requiresSource?(source?.path||(ar?'التصريح والفهرسة بيحددوا النطاق؛ مفيش فحص لكل ملفاتك تلقائيًا.':'Authorization and indexing define scope; your files are not scanned automatically.')):(ar?'الخدمة دي لا تتطلب مجلدًا. التغطية والقيود تظهر مع القياس الفعلي.':'This tool needs no folder. Coverage and limits are reported with the actual measurement.')}</p></div>
   {service.requiresSource&&onAuthorize?<button type="button" onClick={needsIndex?onIndex:onAuthorize} disabled={busy}>{needsIndex?(ar?'فهرسة المجلد':'Index folder'):(source?(ar?'تغيير المجلد':'Change folder'):(ar?'اختيار مجلد':'Choose folder'))}</button>:null}
  </div>{reason?<p className="scan-ready-notice">{reason}</p>:<p className="scan-ready-notice">{ar?'جاهز للقياس من زر تشغيل الخدمة. مفيش نتائج قبل بدء جلسة فعلية.':'Ready to measure using Run service. No results exist before a real session.'}</p>}
 </div>;
}
