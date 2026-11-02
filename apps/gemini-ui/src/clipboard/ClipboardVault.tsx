import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clipboard, Copy, Image, FileText, Files, LockKeyhole, Pause, Pin, Play, RefreshCw, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { getClipboardApi, vaultResult, type ClipboardConfiguration, type ClipboardItem, type ClipboardListing, type ClipboardPolicy, type ClipboardQuery } from './native';
import './clipboard-vault.css';

export function ClipboardVault({ isArabic }: { isArabic: boolean }) {
  const api = getClipboardApi();
  const t = (en: string, ar: string) => isArabic ? ar : en;
  const [listing, setListing] = useState<ClipboardListing | null>(null);
  const [query, setQuery] = useState<ClipboardQuery>({ query: '', type: 'all', pinnedOnly: false });
  const [selected, setSelected] = useState<ClipboardItem | null>(null);
  const [policy, setPolicy] = useState<ClipboardPolicy | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const mounted = useRef(false);
  const sequence = useRef(0);
  const status = listing?.status;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; sequence.current++; }; }, []);
  const refresh = useCallback(async () => {
    if (!api) return;
    const generation = ++sequence.current;
    try {
      const next = await vaultResult('list', api.list(query));
      if (!mounted.current || generation !== sequence.current) return;
      setListing(next);
      setPolicy(current => current || next.status.policy);
      setSelected(current => current && next.items.some(item => item.id === current.id) ? current : null);
      setError('');
    } catch (cause) { if (mounted.current && generation === sequence.current) setError(cause instanceof Error ? cause.message : 'CLIPBOARD_UNAVAILABLE'); }
  }, [api, query]);
  useEffect(() => { const id = window.setTimeout(() => { void refresh(); }, 180); return () => window.clearTimeout(id); }, [refresh]);
  useEffect(() => {
    if (!status?.monitoring) return;
    const id = window.setInterval(() => { if (!document.hidden) void refresh(); }, 3000);
    return () => window.clearInterval(id);
  }, [status?.monitoring, refresh]);
  async function act(work: () => Promise<unknown>, success = '') {
    setBusy(true); setError(''); setNotice('');
    try { await work(); if (mounted.current) { setNotice(success); await refresh(); } }
    catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : 'CLIPBOARD_UNAVAILABLE'); }
    finally { if (mounted.current) setBusy(false); }
  }
  function configure(next: ClipboardConfiguration) { if (api) void act(() => vaultResult('configure', api.configure(next))); }
  async function select(item: ClipboardItem) {
    if (!api) return;
    const generation = ++sequence.current;
    try { const next = await vaultResult('get', api.get(item.id)); if (mounted.current && sequence.current === generation) setSelected(next); }
    catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : 'CLIPBOARD_UNAVAILABLE'); }
  }
  return <section className="clipboard-vault" data-testid="clipboard-vault" dir={isArabic ? 'rtl' : 'ltr'} aria-label={t('Clipboard Vault', 'خزنة الحافظة')}>
    <header className="cv-heading"><div className="cv-emblem"><Clipboard aria-hidden="true" /></div><div><span className="cv-eyebrow">KNOuX · LOCAL VAULT</span><h2>{t('Your clipboard, under your control', 'حافظتك تحت سيطرتك')}</h2><p>{t('Save useful copies, pin what matters, and return to them locally.', 'احتفظ بالنسخ المفيدة وثبّت المهم وارجع له محليًا.')}</p></div><span className="cv-state" data-monitoring={status?.monitoring || false}>{status?.monitoring ? t('Capturing', 'الالتقاط شغّال') : t('Capture off', 'الالتقاط مقفول')}</span></header>
    {!api ? <p role="status">{t('Open the Electron desktop app to use the native vault. No browser clipboard reader is substituted.', 'افتح تطبيق Electron لاستخدام الخزنة الأصلية. لا توجد قراءة بديلة من المتصفح.')}</p> : <>
      <div className="cv-safety"><ShieldCheck aria-hidden="true" /><p>{t('Capture needs a separate native approval. It stops on restart. Secret detection is imperfect: pause or use private mode before copying passwords or codes. No content is sent to AI or included in logs.', 'الالتقاط محتاج موافقة أصلية منفصلة، وبيقف بعد إعادة التشغيل. اكتشاف الأسرار مش مضمون: أوقف الالتقاط أو استخدم الوضع الخاص قبل نسخ كلمات السر والأكواد. المحتوى لا يُرسل للذكاء الاصطناعي ولا يُسجّل في السجلات.')}</p></div>
      <p className="cv-footnote">{t('File references are copied back as path text. Explorer file-drop capture depends on the formats offered by the source application and is not certified here.', 'مراجع الملفات بتتنسخ للحافظة كمسارات نصية. التقاط ملفات Explorer بيعتمد على الصيغ اللي بيتيحها التطبيق المصدر، ومش معتمد هنا.')}</p>
      {error && <p role="alert" className="cv-error">{error === 'CLIPBOARD_CONSENT_CANCELLED' ? t('Native approval cancelled. The requested action was not applied.', 'اتلغت الموافقة الأصلية؛ الإجراء المطلوب ما اتنفّذش.') : `${t('Vault request failed', 'تعذّر طلب الخزنة')}: ${error}`}</p>}
      {notice && <p role="status">{notice}</p>}
      {status && <><div className="cv-controls">
        <button disabled={busy || Boolean(status.lockedReason)} onClick={() => configure({ enabled: !status.enabled })}><span>{status.enabled ? t('Stop capture', 'إيقاف الالتقاط') : t('Enable capture…', 'تفعيل الالتقاط…')}</span></button>
        <button disabled={busy || !status.enabled} onClick={() => configure({ paused: !status.paused })}>{status.paused ? <Play /> : <Pause />}{status.paused ? t('Resume', 'استئناف') : t('Pause', 'إيقاف مؤقت')}</button>
        <button aria-pressed={status.privateMode} disabled={busy} onClick={() => configure({ privateMode: !status.privateMode })}><LockKeyhole />{t('Private mode', 'الوضع الخاص')}</button>
        <button disabled={busy} onClick={() => { void refresh(); }}><RefreshCw />{t('Refresh', 'تحديث')}</button>
        <button className="cv-danger" disabled={busy} onClick={() => { void act(() => vaultResult('clear', api.clear())); }}><Trash2 />{t('Clear vault…', 'مسح الخزنة…')}</button>
      </div><div className="cv-metrics"><span><b>{status.count}</b>{t('Saved items', 'عناصر محفوظة')}</span><span><b>{status.pinned}</b>{t('Pinned', 'مثبّت')}</span><span><b>{status.storageMode === 'encrypted' ? t('Encrypted', 'مشفّر') : status.storageMode === 'locked' ? t('Locked', 'مقفول') : t('Memory only', 'ذاكرة فقط')}</b>{t('Local storage', 'التخزين المحلي')}</span><span><b>{status.skippedSensitive}</b>{t('Suspected secrets skipped', 'أسرار محتملة تم تجاهلها')}</span></div>
      {(status.storageError || status.lockedReason) && <p role="alert" className="cv-error">{t('Disk persistence is unavailable. The existing encrypted store is preserved. Changes marked pending may not survive restart. An unreadable store can only be discarded through Clear vault.', 'الحفظ على القرص غير متاح. الملف المشفّر الموجود محفوظ. التغييرات المعلّقة ممكن ما تستمرش بعد إعادة التشغيل. تجاهل ملف غير مقروء متاح فقط من مسح الخزنة.')} <code>{status.storageError || status.lockedReason}</code></p>}
      <div className="cv-filters"><label><Search /><input aria-label={t('Search clipboard history', 'بحث في سجل الحافظة')} placeholder={t('Search saved text or file references', 'ابحث في النصوص أو مراجع الملفات')} value={query.query} onChange={event => setQuery(current => ({ ...current, query: event.target.value }))} maxLength={200} /></label><select aria-label={t('Clipboard item type', 'نوع عنصر الحافظة')} value={query.type} onChange={event => setQuery(current => ({ ...current, type: event.target.value as ClipboardQuery['type'] }))}>{[['all', 'All types', 'كل الأنواع'], ['text', 'Text', 'نصوص'], ['image', 'Images', 'صور'], ['files', 'File references', 'مراجع ملفات']].map(([value, en, ar]) => <option key={value} value={value}>{t(en, ar)}</option>)}</select><label><input type="checkbox" checked={query.pinnedOnly} onChange={event => setQuery(current => ({ ...current, pinnedOnly: event.target.checked }))} />{t('Pinned only', 'المثبّت فقط')}</label></div>
      <div className="cv-workspace"><div className="cv-history" aria-label={t('Saved clipboard items', 'عناصر الحافظة المحفوظة')}>
        {!listing.items.length && <div className="cv-empty"><Clipboard /><h3>{t('Nothing saved here yet', 'لسه مفيش عناصر محفوظة')}</h3><p>{t('Enable capture only when you are ready. Empty history never contains sample clipboard data.', 'فعّل الالتقاط لما تكون جاهز. السجل الفاضي لا يحتوي على بيانات حافظة تجريبية.')}</p></div>}
        {listing.items.map(item => { const Icon = item.type === 'image' ? Image : item.type === 'files' ? Files : FileText; return <button key={item.id} className="cv-item" aria-pressed={selected?.id === item.id} disabled={busy} onClick={() => { void select(item); }}><Icon /><span><strong>{item.preview}</strong><small>{new Date(item.createdAt).toLocaleString(isArabic ? 'ar' : 'en')} · {(item.sizeBytes / 1024).toFixed(1)} KB</small></span>{item.pinned && <Pin aria-label={t('Pinned', 'مثبّت')} />}</button>; })}
      </div><aside className="cv-inspector">{selected ? <><h3>{t('Saved item', 'العنصر المحفوظ')}</h3>{selected.payload?.type === 'image' ? <img alt={t('Saved clipboard image', 'صورة محفوظة من الحافظة')} src={`data:image/png;base64,${selected.payload.image}`} /> : <pre dir="auto">{selected.payload?.type === 'text' ? selected.payload.text : selected.payload?.type === 'files' ? selected.payload.files.join('\n') : selected.preview}</pre>}<div className="cv-controls"><button disabled={busy} onClick={() => { void act(() => vaultResult('copy', api.copy(selected.id)), t('Copied to system clipboard.', 'اتنسخ لحافظة النظام.')); }}><Copy />{t('Copy back…', 'نسخ للحافظة…')}</button><button disabled={busy} aria-pressed={selected.pinned} onClick={() => { void act(async () => { const item = await vaultResult('pin', api.pin(selected.id, !selected.pinned)); if (mounted.current) setSelected(current => current?.id === item.id ? { ...current, pinned: item.pinned } : current); }); }}><Pin />{selected.pinned ? t('Unpin', 'إلغاء التثبيت') : t('Pin', 'تثبيت')}</button><button disabled={busy} className="cv-danger" onClick={() => { void act(() => vaultResult('remove', api.remove(selected.id))); }}><Trash2 />{t('Remove…', 'إزالة…')}</button></div></> : <div className="cv-empty"><LockKeyhole /><p>{t('Select an item to inspect it. File references never open, move or upload the original files.', 'اختار عنصر لعرضه. مراجع الملفات لا تفتح ولا تنقل ولا ترفع الملفات الأصلية.')}</p></div>}</aside></div>
      {policy && <details className="cv-policy"><summary>{t('Retention & capture preferences', 'تفضيلات الاحتفاظ والالتقاط')}</summary><div className="cv-controls"><label>{t('Maximum items (10–500)', 'أقصى عدد (10–500)')}<input aria-label={t('Maximum saved items', 'أقصى عدد عناصر محفوظة')} type="number" min={10} max={500} value={policy.maxItems} onChange={event => setPolicy({ ...policy, maxItems: Number(event.target.value) })} /></label><label>{t('Retention days (1–365)', 'أيام الاحتفاظ (1–365)')}<input aria-label={t('Retention days', 'أيام الاحتفاظ')} type="number" min={1} max={365} value={policy.retentionDays} onChange={event => setPolicy({ ...policy, retentionDays: Number(event.target.value) })} /></label>{(['captureImages', 'captureFiles'] as const).map(key => <label key={key}><input type="checkbox" checked={policy[key]} onChange={event => setPolicy({ ...policy, [key]: event.target.checked })} />{key === 'captureImages' ? t('Capture images', 'التقاط الصور') : t('Capture file references', 'التقاط مراجع الملفات')}</label>)}<button disabled={busy} onClick={() => configure(policy)}>{t('Apply preferences', 'تطبيق التفضيلات')}</button></div><p>{t('Pinned items bypass age expiry but remain within the item and 32 MB total limits. Unpinned items expire automatically. Capture permission is never saved across restart.', 'العناصر المثبّتة لا تنتهي بالعمر، وتفضل داخل حدود العدد و32 MB إجماليًا. غير المثبّت بينتهي تلقائيًا. إذن الالتقاط لا يُحفظ بعد إعادة التشغيل.')}</p></details>}
      <p className="cv-footnote">{t('Skipped oversized items', 'عناصر كبيرة تم تجاهلها')}: {status.skippedOversize} · {t('Read failures', 'تعذّر قراءة')}: {status.readFailures} · {status.pendingPersistence ? t('Pending disk save', 'الحفظ معلّق') : t('No pending save', 'لا يوجد حفظ معلّق')}</p></>}
    </>}
  </section>;
}
