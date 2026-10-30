import {useMemo,useState,type CSSProperties} from 'react';
import {Archive,ArrowRight,Check,ChevronRight,Copy,FileCode,FileText,FolderOpen,FolderTree,History,Images,Layers3,ListChecks,Play,Search,ShieldCheck,SlidersHorizontal,Sparkles,Video,Workflow} from 'lucide-react';
import type {OperationFile,OperationReceipt} from '../../shared/operation-contract';
import {OrbitalControl} from '../visual/OrbitalControl';
import type {OrbitTone} from '../visual/KnouxOrbit';
import {facetOf,formatBytes,organizationSuggestions,overviewGroups} from './organization-studio-model';

interface CategorySpec{id:string;labelEn:string;labelAr:string;color:string;icon:typeof FileText;facets:string[]}
const CATEGORY_SPECS:CategorySpec[]=[
 {id:'document',labelEn:'Documents',labelAr:'المستندات',color:'#3b82f6',icon:FileText,facets:['document','pdf']},
 {id:'image',labelEn:'Images',labelAr:'الصور',color:'#ec4899',icon:Images,facets:['image']},
 {id:'video',labelEn:'Videos',labelAr:'الفيديو',color:'#ef4444',icon:Video,facets:['video']},
 {id:'archive',labelEn:'Archives',labelAr:'الأرشيف',color:'#f59e0b',icon:Archive,facets:['archive']},
 {id:'code',labelEn:'Code',labelAr:'الكود',color:'#8b5cf6',icon:FileCode,facets:['code']},
 {id:'other',labelEn:'Audio & Other',labelAr:'الصوت وأنواع أخرى',color:'#10b981',icon:Workflow,facets:['audio','other']},
];
const TABS:[string,string,typeof Layers3][]=[
 ['Overview','نظرة عامة',Layers3],['Sources','المصادر',FolderOpen],['Visual Library','المكتبة المرئية',Images],
 ['Collections','المجموعات',Copy],['Builder','القواعد',SlidersHorizontal],['Destinations','الوجهات',FolderTree],
 ['Plan Review','مراجعة الخطة',ListChecks],['Execution','التنفيذ',Play],['History','السجل والتراجع',History],
];
interface OrbitNode{id:string;labelEn:string;labelAr:string;icon:typeof FileText;tone:OrbitTone;x:number;y:number;facets:string[]}
const ORBIT_NODES:OrbitNode[]=[
 {id:'document',labelEn:'Documents',labelAr:'المستندات',icon:FileText,tone:'blue',x:21,y:14,facets:['document','pdf']},
 {id:'image',labelEn:'Images',labelAr:'الصور',icon:Images,tone:'rose',x:79,y:14,facets:['image']},
 {id:'archive',labelEn:'Archives',labelAr:'الأرشيف',icon:Archive,tone:'amber',x:92,y:50,facets:['archive']},
 {id:'duplicate',labelEn:'Duplicates',labelAr:'المكرر',icon:Copy,tone:'emerald',x:79,y:84,facets:[]},
 {id:'code',labelEn:'Code',labelAr:'الكود',icon:FileCode,tone:'violet',x:21,y:84,facets:['code']},
 {id:'video',labelEn:'Videos',labelAr:'الفيديو',icon:Video,tone:'red',x:8,y:50,facets:['video']},
];

export type StudioOverviewProps={
 ar:boolean;files:OperationFile[];scanned:boolean;partial:boolean;busy:boolean;
 selectedIds:Set<number>|null;receipt:OperationReceipt|null;
 onStage:(stage:number)=>void;onOverview:()=>void;onCategory:(ids:number[])=>void;
 onSuggestion:(ids:number[])=>void;onSelectAll:()=>void;onOpenFile:(id:number)=>void;
};

function membersOf(files:OperationFile[],facets:string[]){return files.filter(file=>facets.includes(facetOf(file)));}
function suggestionLabel(id:string,ar:boolean){
 const spec=CATEGORY_SPECS.find(entry=>entry.id===id.replace('category-',''));
 if(spec)return ar?spec.labelAr:spec.labelEn;
 if(id==='large')return ar?'ملفات كبيرة ≥ 100 MiB':'Large files ≥ 100 MiB';
 return ar?'أسماء متكررة · راجع التعارضات':'Repeated names · review collisions';
}

/** Approved hero: the orbit sits left, identity and measurements right. Each
 * node selects a measured category; the core opens plan review. */
export function OrganizationStudioHero({ar,files,scanned,busy,receipt,onStage,onCategory,onSuggestion}:StudioOverviewProps){
 const t=(en:string,a:string)=>ar?a:en;
 const duplicates=useMemo(()=>organizationSuggestions(files).find(entry=>entry.id==='name-collisions'),[files]);
 const tools=ORBIT_NODES.map(node=>({
  id:node.id,label:ar?node.labelAr:node.labelEn,icon:node.icon,tone:node.tone,
  position:{x:node.x,y:node.y},testId:'studio-orbit-'+node.id,
  hint:node.id==='duplicate'
   ?t('Repeated file names. Same names do not prove identical content.','أسماء ملفات مكررة. تشابه الأسماء لا يثبت تطابق المحتوى.')
   :t('Select this measured category and open the library','اختيار هذه الفئة المقيسة وفتح المكتبة'),
  onClick:()=>{
   const ids=node.id==='duplicate'?(duplicates?.ids??[]):membersOf(files,node.facets).map(file=>file.id);
   if(ids.length)onCategory(ids);else onStage(node.id==='duplicate'?9:1);
  },
 }));
 const totalBytes=files.reduce((sum,file)=>sum+file.size,0);
 const metrics=[
  {icon:FileText,label:t('Total Files','إجمالي الملفات'),value:scanned?files.length.toLocaleString():'—',note:scanned?t('Measured','مقيس'):t('No source','لا مصدر'),detail:scanned?t('Counted from the native inventory','معدود من فهرس Native'):t('Authorize a source to count files','صرّح بمصدر لعد الملفات')},
  {icon:Layers3,label:t('Measured Space','المساحة المقيسة'),value:scanned?formatBytes(totalBytes):'—',note:scanned?t('Measured','مقيس'):t('Not measured','غير مقيس'),detail:scanned?t('Byte sum of the measured index','مجموع بايتات الفهرس المقيس'):t('Space is unknown until a scan completes','المساحة غير معروفة قبل اكتمال الفحص')},
  {icon:FolderTree,label:t('Categories','الفئات'),value:scanned?String(new Set(files.map(file=>facetOf(file))).size):'—',note:scanned?t('Detected','مكتشفة'):t('Awaiting','بالانتظار'),detail:scanned?t('Distinct measured categories','فئات مقيسة مختلفة'):t('No category has been measured yet','لم تُقس أي فئة بعد')},
  {icon:Copy,label:t('Duplicate Names','أسماء مكررة'),value:scanned?String(duplicates?.count??0):'—',note:duplicates?t('Names only','أسماء فقط'):t('None found','لا يوجد'),detail:t('Repeated names do not prove identical content','تطابق الأسماء لا يثبت تطابق المحتوى')},
 ];
 const features=[
  {icon:FolderOpen,title:t('Smart Organization','تنظيم ذكي'),description:t('Understand your content','افهم محتواك'),stage:1},
  {icon:Workflow,title:t('Clean Structure','هيكل نظيف'),description:t('Keep everything in place','أبقِ كل شيء في مكانه'),stage:4},
  {icon:Sparkles,title:t('Find Anything','اعثر على أي شيء'),description:t('Instant file discovery','اكتشاف فوري للملفات'),stage:2},
 ];
 return <header className="osa-hero" data-testid="studio-overview-hero">
  <div className="osa-hero-orbit">
   <OrbitalControl title={busy?t('Native active','Native نشط'):t('Run Organization','تشغيل التنظيم')} subtitle={t('Analyze and preview your files','حلّل ملفاتك وعاينها')} running={busy} tools={tools} onActivate={()=>onStage(scanned?6:1)} eyebrow={t('Organization categories','فئات التنظيم')} testId="studio-overview-orbit"/>
   {!scanned&&<p className="osa-orbit-note">{t('Authorize a source to measure these categories.','صرّح بمصدر لقياس هذه الفئات.')}</p>}
  </div>
  <div className="osa-hero-copy">
   <div className="osa-identity"><span className="osa-emblem" aria-hidden="true"><FolderOpen/></span><div><h1>{t('Organization Studio','استوديو التنظيم')}</h1><p className="osa-tagline">{t('Organize • Categorize • Structure • Find Everything','نظّم • صنّف • هيكل • اعثر على كل شيء')}</p></div></div>
   <p className="osa-lede">{t('Turn your measured files into a clean, previewed structure. Nothing moves without an exact plan and Native confirmation.','حوّل ملفاتك المقيسة إلى هيكل واضح ومعاين. لا شيء ينتقل دون خطة دقيقة وتأكيد Native.')}</p>
   <div className="osa-features">{features.map(({icon:Icon,title,description,stage})=><button key={title} type="button" onClick={()=>onStage(stage)}><span className="osa-feature-icon"><Icon aria-hidden="true"/></span><span><strong>{title}</strong><small>{description}</small></span></button>)}</div>
   <div className="osa-metrics">{metrics.map(({icon:Icon,label,value,note,detail})=><div key={label} title={detail}><span className="osa-kpi-icon"><Icon aria-hidden="true"/></span><span className="osa-kpi-copy"><strong>{value}</strong><span>{label}</span><small><i aria-hidden="true"/>{note}</small></span></div>)}</div>
   <button type="button" className="osa-duplicates" disabled={!duplicates} onClick={()=>onSuggestion(duplicates?.ids??[])} data-testid="studio-review-duplicates"><Copy aria-hidden="true"/><span><strong>{t('Review repeated names','مراجعة الأسماء المتكررة')}</strong><small>{duplicates?duplicates.count.toLocaleString()+' '+t('files share a name','ملفًا بأسماء متطابقة'):t('No repeated names in this inventory','لا أسماء متكررة في هذا الفهرس')}</small></span><ChevronRight aria-hidden="true"/></button>
   {receipt&&<p className="osa-receipt-line"><ShieldCheck aria-hidden="true"/>{t('Last Native receipt','آخر إيصال Native')}: {receipt.completedFiles} {t('verified','متحقق')} · {receipt.status}</p>}
  </div>
 </header>;
}

/** Approved stage strip. Overview returns here; every other tab is a real stage. */
export function StudioStageTabs({ar,onStage,onOverview}:{ar:boolean;onStage:(stage:number)=>void;onOverview:()=>void}){
 const t=(en:string,a:string)=>ar?a:en;
 return <nav className="osa-tabs" aria-label={t('Organization Studio sections','أقسام استوديو التنظيم')} data-testid="studio-stage-tabs">
  {TABS.map(([en,arabic,Icon],index)=><button key={en} type="button" aria-pressed={index===0} data-testid={'studio-tab-'+index} onClick={()=>index===0?onOverview():onStage(index)}><Icon aria-hidden="true"/>{t(en,arabic)}</button>)}
 </nav>;
}

/** Categories, measured suggestions and the measured file table. */
export function OrganizationStudioCategories({ar,files,scanned,partial,selectedIds,onCategory,onSuggestion,onStage,onSelectAll,onOpenFile}:StudioOverviewProps){
 const t=(en:string,a:string)=>ar?a:en;
 const suggestions=organizationSuggestions(files).slice(0,4);
 return <div className="osa-body">
  <section className="osa-card osa-categories" aria-labelledby="osa-categories-title">
   <header><div><h2 id="osa-categories-title">{t('Organization Categories','فئات التنظيم')}</h2><p>{t('Organize your measured files into previewed categories. Every category stays editable.','نظّم ملفاتك المقيسة في فئات معاينة. كل فئة قابلة للتعديل.')}</p></div><div className="osa-card-actions"><button type="button" onClick={onSelectAll} disabled={!files.length} data-testid="studio-select-all"><Check aria-hidden="true"/>{t('Select All','تحديد الكل')}</button><button type="button" onClick={()=>onStage(2)} data-testid="ops-open-library"><Images aria-hidden="true"/>{t('Visual Library','المكتبة المرئية')}</button></div></header>
   <div className="osa-category-grid">{CATEGORY_SPECS.map(spec=>{
    const members=membersOf(files,spec.facets),bytes=members.reduce((sum,file)=>sum+file.size,0);
    const extensions=[...new Set(members.map(file=>file.name.split('.').at(-1)?.toUpperCase()||'').filter(Boolean))].slice(0,4);
    const checked=members.length>0&&(!selectedIds||members.every(file=>selectedIds.has(file.id)));
    return <button key={spec.id} type="button" className="osa-category" disabled={!members.length} style={{'--osa-tone':spec.color} as CSSProperties} onClick={()=>onCategory(members.map(file=>file.id))} data-testid={'studio-category-'+spec.id}>
     <span className="osa-category-icon"><spec.icon aria-hidden="true"/></span>
     <span className="osa-category-copy"><strong>{ar?spec.labelAr:spec.labelEn}</strong><span>{scanned?members.length.toLocaleString()+' '+t('files','ملف'):t('Not measured','غير مقيس')}</span><span>{scanned?formatBytes(bytes):'—'}</span><small>{extensions.join(' · ')||t('Awaiting discovery','بانتظار الاكتشاف')}</small></span>
     <span className={'osa-category-check'+(checked?' is-checked':'')} aria-hidden="true"><Check/></span>
     <span className="osa-category-arrow" aria-hidden="true"><ArrowRight/></span>
    </button>;})}</div>
  </section>
  <section className="osa-card osa-suggestions" aria-labelledby="osa-suggestions-title">
   <header><div><h2 id="osa-suggestions-title"><Sparkles aria-hidden="true"/>{t('Smart Suggestions','اقتراحات ذكية')}</h2><p>{t('Derived from measured names, sizes and categories — not AI analysis.','مشتقة من الأسماء والأحجام والفئات المقيسة — ليست تحليل ذكاء اصطناعي.')}</p></div><button type="button" onClick={()=>onStage(9)} data-testid="ops-see-all-suggestions">{t('View All','عرض الكل')}<ChevronRight aria-hidden="true"/></button></header>
   <div className="osa-suggestion-list">{suggestions.map(entry=><article key={entry.id}>
    <span className="osa-suggestion-icon" aria-hidden="true"><Copy/></span>
    <div><strong>{suggestionLabel(entry.id,ar)}</strong><small>{entry.count.toLocaleString()} {t('files','ملف')} · {formatBytes(entry.bytes)}</small></div>
    <button type="button" onClick={()=>onSuggestion(entry.ids)} data-testid={'ops-suggestion-'+entry.id}>{t('Review','مراجعة')}</button>
   </article>)}{!suggestions.length&&<div className="osa-empty"><FolderOpen aria-hidden="true"/><span>{t('Authorize a source to discover real organization opportunities.','صرّح بمصدر لاكتشاف فرص التنظيم الفعلية.')}</span><button type="button" onClick={()=>onStage(1)}>{t('Choose source','اختيار مصدر')}</button></div>}</div>
  </section>
  <section className="osa-card osa-files" aria-labelledby="osa-files-title">
   <header><div><h2 id="osa-files-title">{t('Measured Files','الملفات المقيسة')}</h2><p>{partial?t('Partial inventory · rescan before planning','فهرس غير مكتمل · أعد الفحص قبل التخطيط'):t('Every file this session can see and preview.','كل ملف تراه هذه الجلسة ويمكن معاينته.')}</p></div><button type="button" onClick={()=>onStage(2)} data-testid="ops-open-library-all">{t('Open in library','فتح في المكتبة')}<ChevronRight aria-hidden="true"/></button></header>
   <MeasuredFilesTable ar={ar} files={files} partial={partial} onOpenFile={onOpenFile}/>
  </section>
 </div>;
}

/** Sortable, searchable projection of the measured inventory. The open contract
 * exposes no timestamp or MIME type, so neither column is invented. */
function MeasuredFilesTable({ar,files,partial,onOpenFile}:{ar:boolean;files:OperationFile[];partial:boolean;onOpenFile:(id:number)=>void}){
 const t=(en:string,a:string)=>ar?a:en,[query,setQuery]=useState(''),[sort,setSort]=useState<'name'|'size'|'category'>('name');
 const rows=useMemo(()=>{
  const needle=query.trim().toLowerCase();
  return files.filter(file=>!needle||file.name.toLowerCase().includes(needle)||file.relative.toLowerCase().includes(needle))
   .slice()
   .sort((a,b)=>sort==='size'?b.size-a.size:sort==='category'?a.category.localeCompare(b.category)||a.name.localeCompare(b.name):a.name.localeCompare(b.name))
   .slice(0,120);
 },[files,query,sort]);
 if(!files.length)return <div className="osa-empty osa-files-empty"><FileText aria-hidden="true"/><strong>{t('No measured files yet','لا ملفات مقيسة بعد')}</strong><span>{t('Authorize and scan a source to populate this table.','صرّح بمصدر وافحصه لملء هذا الجدول.')}</span></div>;
 return <>
  <div className="osa-files-tools">
   <label className="osa-search"><Search aria-hidden="true"/><input aria-label={t('Search measured files','البحث في الملفات المقيسة')} value={query} placeholder={t('Search by name or path','ابحث بالاسم أو المسار')} onChange={event=>setQuery(event.target.value)}/></label>
   <label className="osa-sort">{t('Sort','الترتيب')}<select aria-label={t('Sort measured files','ترتيب الملفات المقيسة')} value={sort} onChange={event=>setSort(event.target.value as typeof sort)}><option value="name">{t('Name','الاسم')}</option><option value="size">{t('Largest first','الأكبر أولًا')}</option><option value="category">{t('Category','الفئة')}</option></select></label>
   <span className="osa-row-count" data-testid="studio-files-count">{rows.length.toLocaleString()} / {files.length.toLocaleString()}</span>
  </div>
  <div className="osa-table-scroll">
   <table className="osa-table"><thead><tr><th scope="col">{t('Name','الاسم')}</th><th scope="col">{t('Type','النوع')}</th><th scope="col">{t('Location','الموقع')}</th><th scope="col">{t('Size','الحجم')}</th><th scope="col">{t('Category','الفئة')}</th><th scope="col">{t('Status','الحالة')}</th></tr></thead>
    <tbody>{rows.map(file=>{const folder=file.relative.replace(/\\/g,'/').split('/').slice(0,-1).join('/')||'.';const extension=file.name.split('.').at(-1)?.toUpperCase()||facetOf(file).toUpperCase();return <tr key={file.id}><th scope="row"><button type="button" onClick={()=>onOpenFile(file.id)} title={file.relative}>{file.name}</button></th><td><span className="osa-pill">{extension}</span></td><td className="osa-path" title={file.relative} dir="ltr">{folder}</td><td>{formatBytes(file.size)}</td><td><span className="osa-pill">{facetOf(file)}</span></td><td><span className={'osa-status'+(partial?' is-partial':'')}>{partial?t('Partial','جزئي'):t('Measured','مقيس')}</span></td></tr>;})}</tbody>
   </table>
   {!rows.length&&<p className="osa-empty-inline" role="status">{t('No file matches this search.','لا ملف يطابق هذا البحث.')}</p>}
  </div>
 </>;
}

/** Honest proportional readout of measured bytes. A neutral ring appears when
 * nothing has been measured; no illustrative share is ever drawn. */
export function StudioCategoryDonut({ar,files}:{ar:boolean;files:OperationFile[]}){
 const t=(en:string,a:string)=>ar?a:en;
 const groups=overviewGroups(files).map(group=>({...group,spec:CATEGORY_SPECS.find(spec=>spec.id===group.id)!}));
 const totalBytes=groups.reduce((sum,group)=>sum+group.bytes,0),totalFiles=groups.reduce((sum,group)=>sum+group.count,0);
 const radius=52,circumference=2*Math.PI*radius;
 let offset=0;
 return <div className="osa-donut-block" data-testid="studio-category-donut">
  <div className="osa-donut">
   <svg viewBox="0 0 128 128" role="img" aria-label={totalFiles?totalFiles.toLocaleString()+' '+(ar?'ملف مقيس':'measured files'):t('No measured files','لا ملفات مقيسة')}>
    <circle className="osa-donut-track" cx="64" cy="64" r={radius}/>
    {totalBytes>0&&groups.filter(group=>group.bytes>0).map(group=>{const length=circumference*(group.bytes/totalBytes);const dash={strokeDasharray:length+' '+(circumference-length),strokeDashoffset:-offset};offset+=length;return <circle key={group.id} className="osa-donut-segment" cx="64" cy="64" r={radius} style={{...dash,stroke:group.spec.color}}/>;})}
   </svg>
   <div className="osa-donut-center"><strong>{totalFiles?totalFiles.toLocaleString():'—'}</strong><span>{t('Total Files','إجمالي الملفات')}</span></div>
  </div>
  <ul className="osa-donut-legend">{groups.map(group=><li key={group.id}><i style={{background:group.spec.color}} aria-hidden="true"/><span>{ar?group.spec.labelAr:group.spec.labelEn}</span><strong>{group.count.toLocaleString()}</strong><small>{formatBytes(group.bytes)}</small></li>)}</ul>
 </div>;
}
