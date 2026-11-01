import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {StartupEntry,NativeEnvelope} from '../../shared/native-contracts';
import type {StartupActionPlan,StartupActionReceipt} from '../../shared/operation-contract';
const unwrap=<T,>(result:NativeEnvelope<T>):T=>{if(result.error||!('data' in result))throw Error(result.error?.message||'Native provider returned no evidence.');return result.data as T;};

export function StartupActionWorkbench({entry,arabic,onChanged}:{entry:StartupEntry|null;arabic:boolean;onChanged:()=>void}){
 const api=window.knouxOperationsV1,t=(en:string,ar:string)=>arabic?ar:en;
 const [plan,setPlan]=useState<StartupActionPlan|null>(null),[approved,setApproved]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[receipts,setReceipts]=useState<StartupActionReceipt[]>([]);
 const running=useRef(false),selection=useRef(entry?.id);
 useLayoutEffect(()=>{selection.current=entry?.id;setPlan(null);setApproved(false);},[entry?.id]);
 async function run(work:()=>Promise<void>){if(running.current)return;running.current=true;setBusy(true);setError('');try{await work();}catch(e){setError(e instanceof Error?e.message:String(e));}finally{running.current=false;setBusy(false);}}
 const refresh=async()=>{if(api)setReceipts(unwrap(await api.startupReceipts()));};
 useEffect(()=>{if(api)void refresh().catch(e=>setError(String(e)));},[api]);
 const candidate=!!entry&&entry.sourceKind==='registry-run'&&entry.scope==='user'&&!entry.elevationRequired&&entry.protection==='standard'&&entry.state==='enabled';
 return <section className="knx-tool-evidence" data-testid="startup-live-actions">
  <h3>{t('Current-user Run · approved native change','مدخل Run للمستخدم الحالي · تغيير Native بموافقة')}</h3>
  <p>{t('Disable removes only the selected Run value; it does not terminate a running app. Recovery restores the original string and registry type after checking conflicts. Machine entries, tasks, services and delay remain gated.','التعطيل يزيل قيمة Run المختارة فقط؛ لا يغلق التطبيق الجاري. الاستعادة تعيد النص ونوع القيمة الأصليين بعد فحص التعارضات. مداخل النظام والمهام والخدمات والتأخير تظل محجوبة.')}</p>
  {!api?<p role="alert">{t('Open the Electron application to use the native provider.','افتح تطبيق Electron لاستخدام المزوّد الأصلي.')}</p>:null}
  {error?<p role="alert" className="knx-tool-error">{error}</p>:null}
  {busy?<div role="status"><progress aria-label={t('Native startup action','عملية بدء تشغيل أصلية')}/>{t('Waiting for native evidence or confirmation. The single registry write cannot be interrupted halfway.','بانتظار الدليل أو التأكيد الأصلي. لا يمكن إيقاف كتابة القيمة الواحدة في منتصفها.')}</div>:null}
  <fieldset disabled={busy} className="knx-tool-fieldset">
   <p>{t('Selected entry','المدخل المختار')}: <strong>{entry?.name||'—'}</strong></p>
   <button type="button" data-testid="startup-live-preview" disabled={!api||!candidate} onClick={()=>void run(async()=>{const requested=entry!.id;setPlan(null);setApproved(false);const next=unwrap(await api!.startupDisablePlan({entryId:requested}));if(selection.current===requested)setPlan(next);})}>{t('Preflight selected disable','فحص تعطيل المختار قبل التنفيذ')}</button>
   {!candidate?<p>{t('Select an enabled, unprotected current-user Registry Run entry. The native provider verifies eligibility again.','اختر مدخل Registry Run مفعّلًا وغير محمي للمستخدم الحالي. يعيد المزوّد الأصلي فحص الأهلية.')}</p>:null}
   {plan?<section className="knx-tool-evidence" data-testid="startup-live-plan"><h4>{plan.mode==='disable'?t('Disable plan','خطة التعطيل'):t('Restore plan','خطة الاستعادة')}: {plan.name}</h4><p className="knx-tool-path">HKCU\{plan.key}</p><p>{t('Expires','تنتهي')}: {plan.expiresAt}</p><code className="knx-tool-path">{plan.planHash}</code><p>{t('Original evidence SHA-256','بصمة الدليل الأصلي')}: <code className="knx-tool-path">{plan.originalHash}</code></p><label><input type="checkbox" data-testid="startup-live-approval" checked={approved} onChange={e=>setApproved(e.target.checked)}/>{t('Approve this exact startup change. Native confirmation follows.','أوافق على تغيير بدء التشغيل المحدد. يتبعه تأكيد Native.')}</label><button type="button" data-testid="startup-live-apply" disabled={!api||!approved} onClick={()=>void run(async()=>{const exact=plan;setApproved(false);const receipt=unwrap(await api!.startupApply({planId:exact.id,planHash:exact.planHash,approved:true}));setPlan(null);setReceipts(old=>[receipt,...old.filter(item=>item.id!==receipt.id)]);onChanged();})}>{t('Confirm exact change','تأكيد التغيير المحدد')}</button></section>:null}
   <div className="knx-tool-actions"><h4>{t('Protected receipts & recovery','الإيصالات المحمية والاستعادة')}</h4><button type="button" disabled={!api} onClick={()=>void run(refresh)}>{t('Refresh receipts','تحديث الإيصالات')}</button></div>
   {!receipts.length?<p>{t('No protected startup receipts in this profile.','لا توجد إيصالات بدء تشغيل محمية في هذا الملف الشخصي.')}</p>:null}
   {receipts.map(receipt=><article className="knx-tool-evidence" key={receipt.id}><strong>{receipt.name}</strong><p>{receipt.status} · {receipt.updatedAt||receipt.createdAt}</p><code className="knx-tool-path">{receipt.id}</code>{receipt.error?<p role="alert">{receipt.error}</p>:null}<button type="button" disabled={!api||!receipt.recoveryAvailable} onClick={()=>void run(async()=>{setPlan(null);setApproved(false);setPlan(unwrap(await api!.startupRestorePlan({receiptId:receipt.id})));})}>{t('Inspect & preview recovery','فحص ومعاينة الاستعادة')}</button></article>)}
  </fieldset>
 </section>;
}
