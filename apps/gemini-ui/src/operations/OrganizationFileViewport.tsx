import {useMemo,useState,useRef,useLayoutEffect,type ReactNode} from 'react';
import type {OperationFile,OrganizationPlan} from '../../shared/operation-contract';

// Keep the full measured index available to the planner, but never mount tens
// of thousands of checkboxes/paths in the renderer. Small fixture sets remain
// fully rendered for keyboard access and existing Electron contract tests.
const ROW_HEIGHT = 54;
const VIRTUAL_THRESHOLD = 250;
const VIEWPORT_HEIGHT = 238;
const OVERSCAN = 6;

export function WindowedRows<T>({rows,render,empty,label}:{
 rows:T[];render:(row:T)=>ReactNode;empty:string;label:string
}) {
 const [top,setTop]=useState(0),[height,setHeight]=useState(VIEWPORT_HEIGHT);
 const viewport=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{const element=viewport.current;if(!element)return;const update=()=>setHeight(element.clientHeight||VIEWPORT_HEIGHT);update();const observer=new ResizeObserver(update);observer.observe(element);return()=>observer.disconnect();},[rows.length>VIRTUAL_THRESHOLD]);
 if (!rows.length) return <div role="status" className="ops-empty">{empty}</div>;
 if (rows.length<=VIRTUAL_THRESHOLD) return <div className="ops-scroll" tabIndex={0} aria-label={label}>{rows.map(render)}</div>;
 const first=Math.max(0,Math.min(rows.length-1,Math.floor(top/ROW_HEIGHT)-OVERSCAN));
 const last=Math.min(rows.length,first+Math.ceil(height/ROW_HEIGHT)+OVERSCAN*2);
 return <div ref={viewport} className="ops-scroll ops-virtual-scroll" tabIndex={0} aria-label={label}
   onScroll={event=>setTop(event.currentTarget.scrollTop)}>
   <div style={{height:rows.length*ROW_HEIGHT,position:'relative'}}>
    {rows.slice(first,last).map((row,i)=><div className="ops-virtual-row"
      key={first+i} style={{position:'absolute',top:(first+i)*ROW_HEIGHT,height:ROW_HEIGHT,width:'100%'}}>
      {render(row)}
    </div>)}
   </div>
 </div>;
}

export function OrganizationFileViewport({files,selected,selectionChanged,busy,onToggle,locale}:{
 files:OperationFile[];
 selected:Set<number>;
 selectionChanged:boolean;
 busy:boolean;
 onToggle:(fileId:number,checked:boolean)=>void;
 locale:'ar'|'en';
}) {
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('');
 const ar=locale==='ar';
 const categories=useMemo(()=>Array.from(new Set(files.map(file=>file.category))).sort(),[files]);
 const visible=useMemo(()=>{
   const q=query.trim().toLocaleLowerCase();
   return files.filter(file=>(!category||file.category===category)&&(!q||file.relative.toLocaleLowerCase().includes(q)));
 },[files,query,category]);
 return <div className="ops-index">
  <div className="ops-index-controls">
   <input data-testid="ops-file-search" type="search" value={query}
    onChange={e=>setQuery(e.target.value)} placeholder={ar?'بحث في الملفات المقيسة':'Search measured file paths'}
    aria-label={ar?'بحث في الملفات':'Search measured files'}/>
   <select data-testid="ops-category-filter" value={category} onChange={e=>setCategory(e.target.value)}
    aria-label={ar?'فلتر الفئة':'Filter by category'}>
    <option value="">{ar?'جميع الفئات':'All categories'}</option>
    {categories.map(name=><option key={name} value={name}>{name}</option>)}
   </select>
  </div>
  <output data-testid="ops-result-count" className="ops-index-count" aria-live="polite">
   {visible.length.toLocaleString()} / {files.length.toLocaleString()} {ar?'ملف ظاهر':'measured files shown'}
   {' · '}{selectionChanged?selected.size.toLocaleString():(ar?'الكل':'all')} {ar?'محدد للتنفيذ':'selected for plan'}
  </output>
  <WindowedRows key={query+'|'+category} rows={visible} empty={ar?'لا توجد ملفات مطابقة':'No matching measured files'}
   label={ar?'الملفات المصدر':'Source file rows'} render={file=><label key={file.id}>
    <input type="checkbox" disabled={busy} checked={!selectionChanged||selected.has(file.id)}
     onChange={e=>onToggle(file.id,e.target.checked)} aria-label={file.relative}/>
    <code>{file.relative}</code><small>{file.category} · {file.size} B</small>
   </label>}/>
 </div>;
}

export function OrganizationPlanViewport({plan,locale}:{
 plan:OrganizationPlan|null;locale:'ar'|'en'
}) {
 const ar=locale==='ar';
 return <WindowedRows rows={plan?.files||[]}
  empty={ar?'أنشئ خطة لمراجعة مسارات الوجهة الفعلية':'Build a plan to review exact destination paths'}
  label={ar?'الوجهات المخطط لها':'Planned destination paths'}
  render={file=><div key={file.index}>
    <code>{file.sourceRelative} → {file.targetRelative||file.targetPath}</code>
    <small>{file.status}</small>
  </div>}/>;
}
