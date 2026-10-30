import {useMemo,useState} from 'react';
import {AlertTriangle,ArrowRight,Check,ChevronRight,Database,HardDrive,Monitor,PieChart,Search,Server,ShieldCheck,Trash2,TrendingDown} from 'lucide-react';
import type {VolumeItem} from '../lib/storage-inventory';
import {formatStorageBytes} from './useStorageNative';

const t=(ar:boolean,en:string,arabic:string)=>ar?arabic:en;

/** Four approved capacity tiles. Every value is a sum over measured volumes and
 * reads an em dash until the provider actually returns them. */
export function StorageHeroMetrics({ar,volumes,pending,error,scanning,onExplore}:{ar:boolean;volumes:VolumeItem[];pending:boolean;error:string|null;scanning:boolean;onExplore:()=>void}){
 const ready=volumes.length>0;
 const total=volumes.reduce((sum,volume)=>sum+volume.totalBytes,0);
 const used=volumes.reduce((sum,volume)=>sum+volume.usedBytes,0);
 const free=volumes.reduce((sum,volume)=>sum+volume.freeBytes,0);
 const tiles=[
  {icon:HardDrive,label:t(ar,'Drives','الأقراص'),value:ready?String(volumes.length):'—',note:ready?t(ar,'Measured volumes','أحجام مقيسة'):pending?t(ar,'Reading…','جارٍ القراءة'):t(ar,'Not measured','غير مقيس')},
  {icon:Database,label:t(ar,'Total Capacity','السعة الكلية'),value:ready?formatStorageBytes(total):'—',note:t(ar,'Sum of measured volumes','مجموع الأحجام المقيسة')},
  {icon:PieChart,label:t(ar,'Used Space','المساحة المستخدمة'),value:ready?formatStorageBytes(used):'—',note:ready?t(ar,'Reported by Windows','حسب ويندوز'):t(ar,'Not measured','غير مقيس')},
  {icon:TrendingDown,label:t(ar,'Free Space','المساحة الحرة'),value:ready?formatStorageBytes(free):'—',note:volumes.some(volume=>volume.isLowSpace)?t(ar,'A volume is low on space','وحدة منخفضة السعة'):ready?t(ar,'No low-space volume','لا وحدات منخفضة'):t(ar,'Not measured','غير مقيس')},
 ];
 return <div className="atl-hero-side">
  <div className="atl-hero-metrics" data-testid="storage-hero-metrics">{tiles.map(({icon:Icon,label,value,note})=><div key={label}><span className="atl-kpi-icon"><Icon aria-hidden="true"/></span><span className="atl-kpi-copy" title={note}><strong>{value}</strong><span>{label}</span></span></div>)}</div>
  <button type="button" className="atl-explore" data-testid="storage-explore" onClick={onExplore} disabled={scanning}><span>{t(ar,'Explore Storage','استكشف التخزين')}</span><ArrowRight aria-hidden="true"/></button>
  {error&&<p className="atl-hero-error" role="alert">{error}</p>}
 </div>;
}

/** Approved drive register: real filters, real rows, honest health column. */
export function StorageDrivesPanel({ar,volumes,pending,error,selectedId,activeAnalysis,onSelect,onWalk,onDetails,onAnalysis,onReclaim,onOpenSource,onReload,search,onSearch}:{
 ar:boolean;volumes:VolumeItem[];pending:boolean;error:string|null;selectedId:string|null;activeAnalysis:'treemap'|'large'|'types'|'age'|'folders';
 onSelect:(id:string)=>void;onWalk:(volume:VolumeItem)=>void;onDetails:(volume:VolumeItem)=>void;
 onAnalysis:(tab:'large'|'types'|'folders')=>void;onReclaim:()=>void;onOpenSource:()=>void;onReload:()=>void;search:string;onSearch:(value:string)=>void;
}){
 const [driveScope,setDriveScope]=useState<'all'|'local'|'external'>('all');
 const query=search.trim().toLowerCase();
 const rows=useMemo(()=>volumes.filter(volume=>!query||`${volume.letter} ${volume.name} ${volume.filesystem}`.toLowerCase().includes(query)),[volumes,query]);
 const tabs:[string,string,string,'filter'|'analysis',boolean][]=[
  ['all',t(ar,'All Drives','كل الأقراص'),volumes.length?' ('+volumes.length+')':'','filter',false],
  ['local',t(ar,'Local Disks','أقراص محلية'),'','filter',true],
  ['external',t(ar,'External Drives','أقراص خارجية'),'','filter',true],
  ['folders',t(ar,'Largest Folders','أكبر المجلدات'),'','analysis',false],
  ['types',t(ar,'File Types','أنواع الملفات'),'','analysis',false],
  ['reclaim',t(ar,'Reclaimable','قابل للاستعادة'),'','analysis',false],
 ];
 return <section className="atl-drives" aria-label={t(ar,'Drive register','سجل الأقراص')}>
  <header className="atl-drives-head">
   <div className="atl-tabs" role="group" aria-label={t(ar,'Drive views','عروض الأقراص')}>
    {tabs.map(([id,label,suffix,kind,blocked])=>kind==='analysis'
     ? <button key={id} type="button" data-testid={'storage-view-'+id} aria-pressed={id==='folders'?activeAnalysis==='folders':id==='types'?activeAnalysis==='types':false} onClick={()=>id==='reclaim'?onReclaim():onAnalysis(id as 'types'|'folders')}>{label}</button>
     : <button key={id} type="button" data-testid={'storage-scope-'+id} aria-pressed={driveScope===id} disabled={blocked} title={blocked?t(ar,'The volume provider does not expose whether a disk is local or external.','مزوّد الأحجام لا يكشف إن كان القرص محليًا أو خارجيًا.'):undefined} onClick={()=>setDriveScope(id as typeof driveScope)}>{label}{suffix}</button>
    )}
   </div>
   <label className="atl-drive-search"><Search aria-hidden="true"/><input aria-label={t(ar,'Search drives','البحث في الأقراص')} value={search} placeholder={t(ar,'Search drives…','ابحث في الأقراص…')} onChange={event=>onSearch(event.target.value)}/></label>
  </header>
  <div className="atl-table-scroll">
   <table className="atl-table" aria-label={t(ar,'Measured drives','الأقراص المقيسة')}>
    <thead><tr>
     <th scope="col">{t(ar,'Drive','القرص')}</th><th scope="col">{t(ar,'Label','التسمية')}</th><th scope="col">{t(ar,'File System','نظام الملفات')}</th>
     <th scope="col">{t(ar,'Capacity','السعة')}</th><th scope="col">{t(ar,'Used','المستخدم')}</th><th scope="col">{t(ar,'Free','الحرة')}</th>
     <th scope="col">{t(ar,'Usage','الاستخدام')}</th><th scope="col">{t(ar,'Status','الحالة')}</th><th scope="col"><span className="atl-sr">{t(ar,'Actions','إجراءات')}</span></th>
    </tr></thead>
    <tbody>{rows.map(volume=>{
     const selected=volume.id===selectedId;
     return <tr key={volume.id} data-testid={'storage-volume-'+volume.letter.replace(':','')} data-selected={selected} className={selected?'is-selected':''} onClick={()=>onSelect(volume.id)}>
      <td><span className="atl-drive-cell"><span className="atl-drive-icon"><HardDrive aria-hidden="true"/></span><button type="button" onClick={event=>{event.stopPropagation();onSelect(volume.id);}}>{volume.letter}</button></span></td>
      <td className="atl-strong">{volume.name}</td>
      <td>{volume.filesystem}</td>
      <td>{volume.totalDisplay}</td><td>{volume.usedDisplay}</td><td>{volume.freeDisplay}</td>
      <td><span className="atl-usage"><span className="atl-usage-track"><i style={{width:Math.min(100,Math.max(0,volume.usedPercent))+'%'}} className={volume.isLowSpace?'is-low':''}/></span><span>{volume.usedPercent}%</span></span></td>
      <td>{volume.isLowSpace
       ? <span className="atl-status is-low"><AlertTriangle aria-hidden="true"/>{t(ar,'Low space','سعة منخفضة')}</span>
       : <span className="atl-status is-ok"><Check aria-hidden="true"/>{t(ar,'Measured','مقيس')}</span>}</td>
      <td className="atl-row-actions">
       <button type="button" title={t(ar,'Open this volume in the treemap','فتح هذه الوحدة في الخريطة')} aria-label={t(ar,'Open in treemap','فتح في الخريطة')} onClick={event=>{event.stopPropagation();onWalk(volume);}}><ArrowRight aria-hidden="true"/></button>
       <button type="button" title={t(ar,'Volume details','تفاصيل الوحدة')} aria-label={t(ar,'Volume details','تفاصيل الوحدة')} onClick={event=>{event.stopPropagation();onDetails(volume);}}><Server aria-hidden="true"/></button>
      </td>
     </tr>;})}</tbody>
   </table>
   {!rows.length&&<div className="atl-empty" role="status">
    <HardDrive aria-hidden="true"/>
    <strong>{pending?t(ar,'Reading measured Windows volumes…','جارٍ قراءة أحجام Windows المقيسة…'):error?t(ar,'Measured volumes could not be read','تعذر قراءة الأحجام المقيسة'):query?t(ar,'No drive matches this search','لا قرص يطابق البحث'):t(ar,'No measured volumes','لا توجد أحجام مقيسة')}</strong>
    <span>{error??t(ar,'Fixture values are never substituted for a failed measurement.','لا تُستبدل بيانات التصميم بقياس فاشل.')}</span>
    <span className="atl-empty-actions">{!pending&&<button type="button" onClick={onOpenSource}>{t(ar,'Authorize a scope','تصريح نطاق')}</button>}<button type="button" data-testid="storage-reload-volumes" onClick={onReload}>{t(ar,'Reload volumes','إعادة تحميل الأحجام')}</button></span>
   </div>}
  </div>
  <p className="atl-drives-note"><ShieldCheck aria-hidden="true"/>{t(ar,'Health, SMART and disk-type attributes are not exposed by the current provider, so no health badge is shown.','مزوّد الأحجام الحالي لا يكشف الصحة أو SMART أو نوع القرص، لذلك لا تُعرض شارة صحة.')}</p>
 </section>;
}

/** Approved Volume Analysis inspector: measured doughnut, metadata and an
 * itemised reclaim review that never estimates an unmeasured amount. */
export function StorageVolumeAnalysis({ar,volume,duplicateBytes,duplicatesVerified,onReclaim,onService,onOpenSource}:{ar:boolean;volume:VolumeItem|null;duplicateBytes:number|null;duplicatesVerified:boolean;onReclaim:()=>void;onService:(id:string)=>void;onOpenSource:()=>void}){
 const radius=52,circumference=2*Math.PI*radius;
 const usedShare=volume&&volume.totalBytes>0?Math.min(1,volume.usedBytes/volume.totalBytes):0;
 const reclaim:[string,string,string,number|null,string][]=[
  ['duplicates',t(ar,'Duplicate copies','نسخ مكررة'),t(ar,'Content-verified pairs','أزواج متحققة المحتوى'),duplicateBytes,'storage-duplicates'],
  ['recycle',t(ar,'Recycle Bin','سلة المحذوفات'),t(ar,'Not measured by this provider','غير مقيس من هذا المزوّد'),null,'storage-reclaim'],
  ['temp',t(ar,'Temporary files','ملفات مؤقتة'),t(ar,'Not measured by this provider','غير مقيس من هذا المزوّد'),null,'storage-reclaim'],
  ['update',t(ar,'Windows Update cache','ذاكرة تحديث Windows'),t(ar,'Not measured by this provider','غير مقيس من هذا المزوّد'),null,'storage-reclaim'],
  ['cache',t(ar,'Browser caches','ذواكر المتصفح'),t(ar,'Not measured by this provider','غير مقيس من هذا المزوّد'),null,'storage-reclaim'],
 ];
 return <section className="atl-analysis" data-testid="storage-volume-analysis">
  <header className="atl-analysis-head">
   {volume?<><span className="atl-analysis-icon"><HardDrive aria-hidden="true"/></span><div><h2 dir="ltr">{volume.letter} {volume.name}</h2><span className="atl-badge">{volume.filesystem}</span></div></>:<div><h2>{t(ar,'Volume Analysis','تحليل الوحدات')}</h2></div>}
  </header>
  {volume?<>
   <div className="atl-donut-row">
    <div className="atl-donut">
     <svg viewBox="0 0 128 128" role="img" aria-label={`${volume.usedPercent}% ${t(ar,'used','مستخدم')}`}>
      <circle className="atl-donut-track" cx="64" cy="64" r={radius}/>
      {usedShare>0&&<circle className="atl-donut-used" cx="64" cy="64" r={radius} style={{strokeDasharray:`${circumference*usedShare} ${circumference*(1-usedShare)}`}}/>}
     </svg>
     <div className="atl-donut-center"><strong>{volume.usedPercent}%</strong><span>{t(ar,'Used','مستخدم')}</span><small>{volume.usedDisplay}</small></div>
    </div>
    <ul className="atl-donut-legend">
     <li><i className="is-used"/><span>{t(ar,'Used Space','المساحة المستخدمة')}</span><strong>{volume.usedDisplay}</strong></li>
     <li><i className="is-free"/><span>{t(ar,'Free Space','المساحة الحرة')}</span><strong>{volume.freeDisplay}</strong></li>
     <li><i className="is-total"/><span>{t(ar,'Total Capacity','السعة الكلية')}</span><strong>{volume.totalDisplay}</strong></li>
    </ul>
   </div>
   <dl className="atl-meta">
    <div><dt>{t(ar,'File System','نظام الملفات')}</dt><dd>{volume.filesystem}</dd></div>
    <div><dt>{t(ar,'Label','التسمية')}</dt><dd>{volume.name}</dd></div>
    <div><dt>{t(ar,'Type','النوع')}</dt><dd>{volume.physicalDevice||t(ar,'Not exposed','غير مكشوف')}</dd></div>
    <div><dt>{t(ar,'Status','الحالة')}</dt><dd className={volume.isLowSpace?'is-low':''}>{volume.isLowSpace?t(ar,'Low space','سعة منخفضة'):t(ar,'Measured · read-only','مقيس · للقراءة فقط')}</dd></div>
    <div><dt>{t(ar,'Source','المصدر')}</dt><dd title={volume.scanSource}>{volume.scanSource||t(ar,'Windows volume provider','مزوّد أحجام Windows')}</dd></div>
   </dl>
  </>
  :<div className="atl-empty atl-empty-inline"><Monitor aria-hidden="true"/><strong>{t(ar,'No volume selected','لم تُحدد وحدة')}</strong><span>{t(ar,'Authorize a scope to measure volumes.','صرّح بنطاق لقياس الأحجام.')}</span><button type="button" onClick={onOpenSource}>{t(ar,'Authorize a scope','تصريح نطاق')}</button></div>}
  <h3 className="atl-reclaim-heading">{t(ar,'Reclaim Opportunities','فرص الاستعادة')}<small>{t(ar,'(reviewed, never automatic)','(بمراجعة، ليست تلقائية)')}</small></h3>
  <ul className="atl-reclaim-list">{reclaim.map(([id,label,detail,amount,service])=><li key={id}>
   <button type="button" onClick={()=>onService(service)} data-testid={'storage-reclaim-'+id}>
    <span className="atl-reclaim-icon">{id==='duplicates'?<PieChart aria-hidden="true"/>:id==='recycle'?<Trash2 aria-hidden="true"/>:<Database aria-hidden="true"/>}</span>
    <span className="atl-reclaim-copy"><strong>{label}</strong><small>{id==='duplicates'&&duplicatesVerified?t(ar,'Verified content pairs','أزواج متحققة المحتوى'):detail}</small></span>
    <span className={amount==null?'atl-amount is-unknown':'atl-amount'}>{amount==null?t(ar,'Not measured','غير مقيس'):formatStorageBytes(amount)}</span>
    <ChevronRight aria-hidden="true"/>
   </button>
  </li>)}</ul>
  <button type="button" className="atl-reclaim-cta" data-testid="storage-reclaim-cta" onClick={onReclaim}>{t(ar,'Analyze & Reclaim','تحليل واستعادة')}<ArrowRight aria-hidden="true"/></button>
  <p className="atl-reclaim-note">{t(ar,'These are review candidates. Nothing is deleted from this screen.','هذه مرشحات للمراجعة. لا يُحذف أي شيء من هذه الشاشة.')}</p>
 </section>;
}
