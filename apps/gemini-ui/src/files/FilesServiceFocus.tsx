import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSearch,
  FolderOpen,
  FolderMinus,
  Hash,
  ShieldAlert,
  X,
} from 'lucide-react';
import type {
  FilesEmptyFoldersResult,
  FilesHashResult,
  FilesItem,
  FilesMetadata,
  FilesOverview,
} from '../../shared/native-contracts';
import { FILES_DOMAIN_SERVICES, type FileResultItem, type FilesServiceKey } from '../lib/file-inventory';
import { formatBytes, type FilesQueryFilters } from './useFilesNative';

interface FilesServiceFocusProps {
  service: FilesServiceKey;
  locale: 'en' | 'ar';
  measured: boolean;
  overview: FilesOverview | null;
  selectedFile: FileResultItem;
  metadata: FilesMetadata | null;
  hash: FilesHashResult | null;
  hashLoading?: boolean;
  emptyFolders: FilesEmptyFoldersResult | null;
  emptyFoldersLoading: boolean;
  scopeCount: number;
  scopeBytes: string;
  onClose: () => void;
  onAdd: () => void;
  onRescan: () => void;
  onOpenStudio: (stageId?: number) => void;
  onLoadEmpty: () => void;
  onHash: () => void;
  onSort: (sort: 'date_desc' | 'size_desc' | 'name_asc') => void;
  query: FilesQueryFilters;
  results: FileResultItem[];
  queryError: string | null;
  onQueryChange: (patch: FilesQueryFilters) => void;
  onSelectFile: (file: FileResultItem) => void;
  onOpenService: (service: FilesServiceKey) => void;
  embedded?: boolean;
}

function EmptyNative({ locale, onAdd }: { locale: 'en' | 'ar'; onAdd?: () => void }) {
  return (
    <div className="text-[10px] text-amber-300/90 flex items-start gap-1.5">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>
        {locale === 'en'
          ? 'Choose a local folder to authorize this read-only tool. No native source is active.'
          : 'اختر مجلدًا محليًا للتصريح باستخدام هذه الأداة للقراءة فقط. لا يوجد مصدر أصلي نشط.'}
      </span>
      {onAdd ? <button type="button" className="knx-workbench-action" onClick={onAdd} aria-label={locale === 'en' ? 'Choose authorized folder' : 'اختيار مجلد مصرح'}><FolderOpen aria-hidden="true"/></button> : null}
    </div>
  );
}

export function FilesServiceFocus({
  service,
  locale,
  measured,
  overview,
  selectedFile,
  metadata,
  hash,
  hashLoading = false,
  emptyFolders,
  emptyFoldersLoading,
  scopeCount,
  scopeBytes,
  onClose,
  onAdd,
  onRescan,
  onOpenStudio,
  onLoadEmpty,
  onHash,
  onSort,
  query, results, queryError, onQueryChange, onSelectFile, onOpenService,
  embedded = false,
}: FilesServiceFocusProps) {
  const meta = FILES_DOMAIN_SERVICES.find((entry) => entry.key === service);
  const title = meta ? (locale === 'en' ? meta.labelEn : meta.labelAr) : service;
  const description = meta ? (locale === 'en' ? meta.descEn : meta.descAr) : '';

  const [emptyQuery, setEmptyQuery] = useState('');
  const [typeMeasure, setTypeMeasure] = useState<'count' | 'bytes'>('count');
  const [overviewSelection, setOverviewSelection] = useState<FilesItem | null>(null);
  const [overviewQuery, setOverviewQuery] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  useEffect(() => setCopyStatus(''), [selectedFile.id, hash?.digest, service]);
  useEffect(() => { setOverviewSelection(null); setOverviewQuery(''); }, [overview?.source.id, overview?.scannedAt, service]);
  const copyText = async (text: string, success: string) => {
    try { await navigator.clipboard.writeText(text); setCopyStatus(success); }
    catch { setCopyStatus(locale === 'en' ? 'Clipboard unavailable' : 'الحافظة غير متاحة'); }
  };
  const copyDigest = async () => {
    if (!hash) return;
    await copyText(hash.digest, locale === 'en' ? 'Digest copied' : 'تم نسخ البصمة');
  };

  const renderBody = () => {
    if (!measured) return <EmptyNative locale={locale} onAdd={onAdd} />;

    switch (service) {
      case 'file-downloads-inventory':
        return (
          <div className="space-y-3" data-testid="files-downloads-workbench">
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: locale === 'en' ? 'Files' : 'ملفات', value: overview ? overview.totals.files.toLocaleString() : '—' },
                { label: locale === 'en' ? 'Bytes' : 'بايت', value: overview ? formatBytes(overview.totals.bytes) : '—' },
                { label: locale === 'en' ? 'Folders' : 'مجلدات', value: overview ? overview.totals.folders.toLocaleString() : '—' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[#132c52] bg-[#040d1c] p-2">
                  <div className="text-[9px] text-slate-500">{item.label}</div>
                  <div className="font-mono text-sm font-black text-white">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-[#132c52] bg-[#040d1c] p-2 text-[10px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">{locale === 'en' ? 'Authorized source' : 'المصدر المصرح'}</span>
                <span className="font-mono text-cyan-300 truncate">{overview?.source.label || '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="text-slate-400">{locale === 'en' ? 'Last scan' : 'آخر فحص'}</span>
                <span className="font-mono text-slate-300">{overview?.source.lastScanned || '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="text-slate-400">{locale === 'en' ? 'Coverage' : 'التغطية'}</span>
                <span className="font-mono text-amber-300">{overview?.coverage || '—'}</span>
              </div>
            </div>
            {overview ? (
              <div>
                <div className="text-[10px] font-semibold text-slate-300 mb-1">{locale === 'en' ? 'Category distribution' : 'توزيع الفئات'}</div>
                <div className="space-y-1">
                  {overview.categories.map((category) => {
                    const total = overview.totals.files || 1;
                    const width = Math.min(100, Math.max(0, (category.count / total) * 100));
                    return (
                      <div key={category.key}>
                        <div className="flex justify-between text-[9px] font-mono text-slate-400"><span>{category.key}</span><span>{category.count.toLocaleString()}</span></div>
                        <div role="meter" aria-label={category.key} aria-valuemin={0} aria-valuemax={100} aria-valuenow={width} className="h-1.5 rounded bg-[#0a1c38] overflow-hidden"><div className="h-full bg-gradient-to-r from-[#2476ff] to-[#26c6ff]" style={{ width: `${width}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {overview?.recent?.length ? (
              <div>
                <div className="text-[10px] font-semibold text-slate-300 mb-1">{locale === 'en' ? 'Recent indexed files' : 'ملفات مفهرسة حديثًا'}</div>
                <div className="space-y-1">
                  {overview.recent.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="truncate text-slate-300">{item.name}</span>
                      <span className="font-mono text-slate-500 shrink-0">{formatBytes(item.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={onAdd} className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer">
                {locale === 'en' ? 'Add folder' : 'إضافة مجلد'}
              </button>
              <button onClick={onRescan} className="px-2 py-1 rounded bg-[#0a1c38] border border-[#173766] text-slate-300 text-[10px] cursor-pointer">
                {locale === 'en' ? 'Rescan' : 'إعادة فحص'}
              </button>
              <button onClick={() => onOpenStudio(6)} className="px-2 py-1 rounded bg-[#1b1340] border border-purple-500/40 text-purple-200 text-[10px] cursor-pointer">
                {locale === 'en' ? 'Plan in Studio' : 'خطة في الاستوديو'}
              </button>
            </div>
          </div>
        );
      case 'file-organize-preview':
        return (
          <div className="space-y-2 text-[11px] text-slate-300" data-testid="files-organize-preview-workbench">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-lg border border-[#132c52] bg-[#040d1c] p-2">
                <div className="text-[9px] text-slate-500">{locale === 'en' ? 'Measured files' : 'ملفات مقيسة'}</div>
                <div className="font-mono text-sm font-black text-white">{overview ? overview.totals.files.toLocaleString() : '—'}</div>
              </div>
              <div className="rounded-lg border border-[#132c52] bg-[#040d1c] p-2">
                <div className="text-[9px] text-slate-500">{locale === 'en' ? 'Selected scope' : 'النطاق المحدد'}</div>
                <div className="font-mono text-sm font-black text-white">{scopeCount.toLocaleString()} · {scopeBytes}</div>
              </div>
            </div>
            <p>
              {locale === 'en'
                ? 'Plans are built from measured file identities and previewed as an exact before/after with a plan hash. Files never stages or executes a move from this screen.'
                : 'تُبنى الخطط من هويات الملفات المقيسة وتُعاين كخطة دقيقة قبل/بعد مع بصمة خطة. لا تُجهّز الملفات أو تنفّذ أي نقل من هذه الشاشة.'}
            </p>
            <button data-testid="files-open-studio-plan" onClick={() => onOpenStudio(6)} className="text-cyan-300 text-[10px] underline flex items-center gap-1">
              {locale === 'en' ? 'Open Studio Plan Review' : 'فتح مراجعة الخطة في الاستوديو'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        );
      case 'file-organize-apply':
        return (
          <div className="space-y-2 text-[11px] text-slate-300" data-testid="files-organize-apply-workbench">
            <div className="align-start flex items-start gap-2 text-amber-200">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {locale === 'en'
                  ? 'Execution happens only inside Studio stage 07: exact plan, plan hash, explicit native confirmation, per-file postcondition receipts and a verified inverse. No execute channel is exposed in Files.'
                  : 'يحدث التنفيذ فقط في المرحلة 07 من الاستوديو: خطة دقيقة وبصمة خطة وتأكيد Native صريح وإيصالات تحقق لكل ملف وعكس متحقق. لا توجد قناة تنفيذ مكشوفة في الملفات.'}
              </span>
            </div>
            <div className="rounded-lg border border-[#132c52] bg-[#040d1c] p-2 flex items-center justify-between gap-2">
              <span className="text-slate-400">{locale === 'en' ? 'Scope selected here' : 'النطاق المحدد هنا'}</span>
              <span className="font-mono text-white">{scopeCount.toLocaleString()} · {scopeBytes}</span>
            </div>
            <button data-testid="files-open-studio-execution" onClick={() => onOpenStudio(7)} className="text-cyan-300 text-[10px] underline flex items-center gap-1">
              {locale === 'en' ? 'Open Studio Execution (07)' : 'فتح التنفيذ في الاستوديو (07)'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        );
      case 'file-organize-undo':
        return (
          <div className="space-y-2 text-[11px] text-slate-300" data-testid="files-organize-undo-workbench">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-300" />
              <span>
                {locale === 'en'
                  ? 'Undo is derived from the verified receipt of the exact executed operation, then re-verified hash by hash before any file is restored. Files exposes no standalone undo channel.'
                  : 'يُشتق التراجع من إيصال العملية المنفذة المتحقق، ثم يُتحقق تجزئةً بتجزئة قبل استعادة أي ملف. لا تعرض الملفات قناة تراجع مستقلة.'}
              </span>
            </div>
            <button data-testid="files-open-studio-undo" onClick={() => onOpenStudio(8)} className="text-cyan-300 text-[10px] underline flex items-center gap-1">
              {locale === 'en' ? 'Open Studio History & Undo (08)' : 'فتح السجل والتراجع في الاستوديو (08)'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        );
      case 'file-empty-folders':
        return (
          <div className="space-y-2" data-testid="files-empty-folders-workbench">
            <button
              onClick={onLoadEmpty}
              disabled={emptyFoldersLoading}
              className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer disabled:opacity-50"
            >
              {emptyFoldersLoading
                ? (locale === 'en' ? 'Scanning directories…' : 'جارٍ فحص المجلدات…')
                : (locale === 'en' ? 'Scan empty folders' : 'فحص المجلدات الفارغة')}
            </button>
            {emptyFolders && (
              <div className="text-[10px] text-slate-300 space-y-1">
                <div className="font-mono text-white">
                  {emptyFolders.summary.emptyFolders.toLocaleString()} {locale === 'en' ? 'empty folders' : 'مجلد فارغ'} ·{' '}
                  {emptyFolders.summary.foldersScanned.toLocaleString()} scanned
                </div>
                <label className="knx-file-filter-label">{locale === 'en' ? 'Filter returned folders' : 'تصفية المجلدات المكتشفة'}<input type="search" value={emptyQuery} onChange={e => setEmptyQuery(e.target.value)} /></label>
                <div className="knx-file-result-list">{emptyFolders.items.filter(item => item.relative.toLocaleLowerCase().includes(emptyQuery.toLocaleLowerCase())).map(item => <p key={item.relative} className="knx-tool-path" title={item.fullPath}>{item.relative || '.'}</p>)}</div>
                <dl className="knx-file-metadata-grid"><div><dt>{locale === 'en' ? 'Skipped links' : 'روابط متخطاة'}</dt><dd>{emptyFolders.summary.skippedLinks}</dd></div><div><dt>{locale === 'en' ? 'Read errors' : 'أخطاء القراءة'}</dt><dd>{emptyFolders.summary.errors}</dd></div><div><dt>{locale === 'en' ? 'Provider limit' : 'حد المزود'}</dt><dd>{emptyFolders.summary.limit}</dd></div></dl>
                {emptyFolders.warnings.map((warning,index) => <p role="status" key={index}>{warning}</p>)}
                <p>{locale === 'en' ? 'Inspection only. This tool does not delete directories.' : 'فحص فقط. هذه الأداة لا تحذف المجلدات.'}</p>
                {emptyFolders.partial && (
                  <div className="text-[9px] text-amber-300">{locale === 'en' ? 'Partial bounded result.' : 'نتيجة جزئية محدودة.'}</div>
                )}
              </div>
            )}
          </div>
        );
      case 'file-hash':
        return (
          <div className="knx-hash-tool" data-testid="files-hash-workbench" aria-busy={hashLoading}>
            <section className="knx-tool-context"><Hash aria-hidden="true" /><div><strong>{selectedFile.name}</strong><small>{locale === 'en' ? 'Byte identity · SHA-256 · read-only' : 'هوية المحتوى · SHA-256 · قراءة فقط'}</small></div></section>
            <p>{locale === 'en' ? 'Read this file through the authorized source. Reliability is reported by the native provider after the read.' : 'قراءة الملف من المصدر المصرح. يحدد المزود موثوقية البصمة بعد اكتمال القراءة.'}</p>
            {hashLoading ? <div role="status" className="knx-tool-evidence"><progress aria-label={locale === 'en' ? 'Reading file bytes' : 'قراءة محتوى الملف'} />{locale === 'en' ? 'Reading file bytes…' : 'جارٍ قراءة محتوى الملف…'}</div> : null}
            {hash ? <section className="knx-tool-evidence" data-testid="files-hash-evidence">
              <strong>{hash.digestReliable ? (locale === 'en' ? 'Reliable digest' : 'بصمة موثوقة') : (locale === 'en' ? 'Reliability warning' : 'تحذير موثوقية')}</strong>
              <code className="knx-tool-path" data-testid="files-hash-digest">{hash.digest}</code>
              <dl><div><dt>{locale === 'en' ? 'Bytes read' : 'البايتات المقروءة'}</dt><dd>{hash.bytesRead.toLocaleString()} / {hash.sizeAtRead.toLocaleString()}</dd></div><div><dt>{locale === 'en' ? 'Changed during read' : 'تغير أثناء القراءة'}</dt><dd>{hash.changedDuringRead ? (locale === 'en' ? 'Yes' : 'نعم') : (locale === 'en' ? 'No' : 'لا')}</dd></div></dl>
              {hash.warnings.map((warning,index) => <p key={index} role="status">{warning}</p>)}
              <details><summary>{locale === 'en' ? 'Native identity evidence' : 'دليل الهوية الأصلي'}</summary><code className="knx-tool-path">{hash.fileIdentity || (locale === 'en' ? 'Identity unavailable' : 'الهوية غير متاحة')}</code><small>{hash.algorithm.toUpperCase()} · {hash.permission}</small></details>
            </section> : !hashLoading ? <p className="knx-tool-evidence">{locale === 'en' ? 'No digest measured for this file yet.' : 'لم تُقس بصمة هذا الملف بعد.'}</p> : null}
            <div className="knx-tool-actions"><button type="button" onClick={onHash} disabled={hashLoading} data-testid="files-hash-compute">{locale === 'en' ? (hashLoading ? 'Reading…' : 'Compute SHA-256') : (hashLoading ? 'جارٍ القراءة…' : 'حساب SHA-256')}</button><button type="button" onClick={() => void copyDigest()} disabled={!hash || hashLoading}>{locale === 'en' ? 'Copy digest' : 'نسخ البصمة'}</button><output role="status">{copyStatus}</output></div>
          </div>
        );
      case 'file-search':
        return (
          <section className="knx-file-search" data-testid="files-search-workbench">
            <div className="knx-tool-context"><FileSearch aria-hidden="true"/><div><strong>{locale === 'en' ? 'Search the authorized index' : 'البحث في الفهرس المصرح'}</strong><small>{overview?.source.label} · {locale === 'en' ? 'Metadata search, not file contents' : 'بحث في البيانات الوصفية، وليس محتوى الملفات'}</small></div></div>
            <div className="knx-file-filters">
              <label>{locale === 'en' ? 'Name or folder' : 'الاسم أو المجلد'}<input type="search" value={query.search || ''} onChange={e => onQueryChange({search:e.target.value})} data-testid="files-tool-search"/></label>
              <label>{locale === 'en' ? 'Extension group' : 'مجموعة الامتدادات'}<select value={query.extension || 'All'} onChange={e => onQueryChange({extension:e.target.value})}><option value="All">{locale === 'en' ? 'All extensions' : 'كل الامتدادات'}</option><option value="jpg">JPG / PNG / WEBP / GIF</option><option value="docx">DOCX / PDF / TXT / MD</option><option value="zip">ZIP / RAR / 7Z / TAR</option></select></label>
              <label>{locale === 'en' ? 'File size' : 'حجم الملف'}<select value={query.sizeFilter === 'Any' ? 'any' : query.sizeFilter || 'any'} onChange={e => onQueryChange({sizeFilter:e.target.value})}><option value="any">{locale === 'en' ? 'Any size' : 'أي حجم'}</option><option value="small">&lt; 10 MB</option><option value="medium">10–100 MB</option><option value="large">≥ 100 MB</option></select></label>
              <label>{locale === 'en' ? 'Modified' : 'التعديل'}<select value={query.dateFilter || 'any'} onChange={e => onQueryChange({dateFilter:e.target.value as FilesQueryFilters['dateFilter']})}><option value="any">{locale === 'en' ? 'Any time' : 'أي وقت'}</option><option value="today">{locale === 'en' ? 'Last 24 hours' : 'آخر 24 ساعة'}</option><option value="week">{locale === 'en' ? 'Last 7 days' : 'آخر 7 أيام'}</option><option value="month">{locale === 'en' ? 'Last 30 days' : 'آخر 30 يومًا'}</option></select></label>
              <label>{locale === 'en' ? 'Sort' : 'الترتيب'}<select value={query.sort || 'date_desc'} onChange={e => onQueryChange({sort:e.target.value as FilesQueryFilters['sort']})}><option value="date_desc">{locale === 'en' ? 'Newest first' : 'الأحدث أولًا'}</option><option value="size_desc">{locale === 'en' ? 'Largest first' : 'الأكبر أولًا'}</option><option value="name_asc">{locale === 'en' ? 'Name A–Z' : 'الاسم أ–ي'}</option></select></label>
            </div>
            <p role="status">{locale === 'en' ? `${results.length} loaded rows · bounded to 200 · uses the current category and location filters.` : `${results.length} صف محمل · بحد أقصى 200 · تطبق تصفية الفئة والموقع الحالية.`}</p>
            {queryError ? <p role="alert">{queryError}</p> : null}
            <div className="knx-file-result-list">{results.map(file => <button type="button" key={file.id} onClick={() => onSelectFile(file)} aria-pressed={selectedFile.id === file.id}><span><strong>{file.name}</strong><small className="knx-tool-path">{file.parentFolder}</small></span><code dir="ltr">{file.sizeFormatted}</code></button>)}</div>
            {!results.length && !queryError ? <p className="knx-tool-evidence">{locale === 'en' ? 'No loaded rows match. Change filters or rescan the authorized folder.' : 'لا توجد صفوف مطابقة. غيّر التصفية أو أعد فحص المجلد المصرح.'}</p> : null}
            <div className="knx-tool-actions"><button type="button" onClick={() => onQueryChange({search:'',extension:'All',sizeFilter:'any',dateFilter:'any'})}>{locale === 'en' ? 'Clear search filters' : 'مسح تصفية البحث'}</button><button type="button" onClick={onRescan}>{locale === 'en' ? 'Rescan source' : 'إعادة فحص المصدر'}</button></div>
          </section>
        );
      case 'file-type-map':
        return (
          <div className="space-y-3" data-testid="files-type-map-workbench">
            <div role="group" aria-label={locale === 'en' ? 'Distribution measure' : 'مقياس التوزيع'} className="knx-tool-actions">{(['count','bytes'] as const).map(measure => <button type="button" key={measure} aria-pressed={typeMeasure === measure} onClick={() => setTypeMeasure(measure)}>{measure === 'count' ? (locale === 'en' ? 'File count' : 'عدد الملفات') : (locale === 'en' ? 'Bytes' : 'الحجم')}</button>)}</div>
            <button onClick={() => onSort('size_desc')} className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer">
              {locale === 'en' ? 'Rank the ledger by size' : 'ترتيب السجل حسب الحجم'}
            </button>
            {(overview?.extensions || []).map((item) => {
              const total = typeMeasure === 'bytes' ? overview?.totals.bytes || 0 : overview?.totals.files || 0;
              const amount = typeMeasure === 'bytes' ? item.bytes : item.count;
              const percent = total > 0 ? Math.min(100, Math.max(0, (amount / total) * 100)) : 0;
              return (
                <div key={item.ext}>
                  <div className="flex justify-between text-[9px] font-mono text-slate-300">
                    <span>{item.ext ? `.${item.ext}` : (locale === 'en' ? 'No extension' : 'بدون امتداد')}</span><span>{typeMeasure === 'bytes' ? formatBytes(item.bytes) : item.count.toLocaleString()} · {percent.toFixed(1)}%</span>
                  </div>
                  <div role="meter" aria-label={item.ext || (locale === 'en' ? 'No extension' : 'بدون امتداد')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-1.5 rounded bg-[#0a1c38] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#2476ff] to-[#26c6ff]" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 'file-recents':
      case 'file-largest': {
        const rows = service === 'file-recents' ? overview?.recent || [] : overview?.largest || [];
        const visible = rows.filter(item => `${item.name} ${item.relative}`.toLocaleLowerCase().includes(overviewQuery.toLocaleLowerCase()));
        return (
          <section className="knx-file-ranked" data-testid={`files-${service === 'file-recents' ? 'recents' : 'largest'}-workbench`}>
            <div className="knx-tool-context"><Clock aria-hidden="true"/><div><strong>{locale === 'en' ? (service === 'file-recents' ? 'Recent modifications' : 'Largest indexed files') : (service === 'file-recents' ? 'أحدث التعديلات' : 'أكبر الملفات المفهرسة')}</strong><small>{overview?.source.label} · {overview?.scannedAt || '—'}</small></div></div>
            <label className="knx-file-filter-label">{locale === 'en' ? 'Filter returned files' : 'تصفية الملفات المكتشفة'}<input type="search" value={overviewQuery} onChange={e => setOverviewQuery(e.target.value)}/></label>
            <p>{locale === 'en' ? `${visible.length} of ${rows.length} provider-ranked rows. This is a bounded summary of the authorized index.` : `${visible.length} من ${rows.length} صف رتبها المزود. هذا ملخص محدود للفهرس المصرح.`}</p>
            <div className="knx-file-result-list">{visible.map(item => <button type="button" key={item.id} onClick={() => setOverviewSelection(item)} aria-pressed={overviewSelection?.id === item.id}><span><strong>{item.name}</strong><small className="knx-tool-path">{item.relative}</small></span><code dir="ltr">{formatBytes(item.size)}</code></button>)}</div>
            {overviewSelection ? <section className="knx-tool-evidence"><h3>{overviewSelection.name}</h3><dl className="knx-file-metadata-grid"><div><dt>{locale === 'en' ? 'Size' : 'الحجم'}</dt><dd dir="ltr">{overviewSelection.size.toLocaleString()} bytes</dd></div><div><dt>{locale === 'en' ? 'Modified' : 'التعديل'}</dt><dd dir="ltr">{overviewSelection.modifiedAt}</dd></div></dl><p className="knx-tool-path">{overviewSelection.relative}</p><button type="button" className="knx-workbench-action" onClick={() => {onQueryChange({search:overviewSelection.name});onOpenService('file-search');}} aria-label={locale === 'en' ? 'Find in indexed results' : 'البحث في النتائج المفهرسة'}><FileSearch aria-hidden="true"/></button></section> : null}
            {!visible.length ? <p>{locale === 'en' ? 'No returned files match this filter.' : 'لا توجد ملفات مطابقة لهذه التصفية.'}</p> : null}
            <div className="knx-tool-actions"><button type="button" onClick={() => onSort(service === 'file-recents' ? 'date_desc' : 'size_desc')}>{locale === 'en' ? 'Apply this ranking to the file ledger' : 'تطبيق هذا الترتيب على سجل الملفات'}</button><button type="button" onClick={onRescan}>{locale === 'en' ? 'Rescan authorized source' : 'إعادة فحص المصدر المصرح'}</button></div>
          </section>
        );
      }
      case 'file-metadata':
        return metadata ? (
          <section className="knx-file-metadata" data-testid="files-metadata-workbench">
            <div className="knx-tool-context"><FileSearch aria-hidden="true"/><div><strong>{metadata.name}</strong><small>{locale === 'en' ? 'Filesystem metadata · read-only' : 'بيانات نظام الملفات · قراءة فقط'}</small></div></div>
            <p className="knx-tool-path">{metadata.fullPath}</p>
            <dl className="knx-file-metadata-grid">{[
              [locale === 'en' ? 'Size' : 'الحجم', `${metadata.size.toLocaleString()} bytes`],
              [locale === 'en' ? 'Created' : 'الإنشاء', metadata.createdAt || '—'],
              [locale === 'en' ? 'Modified' : 'التعديل', metadata.modifiedAt],
              [locale === 'en' ? 'Native file identity' : 'هوية الملف الأصلية', metadata.fileIdentity || '—'],
              [locale === 'en' ? 'Volume serial' : 'معرّف وحدة التخزين', metadata.volumeSerial || '—'],
              [locale === 'en' ? 'Link count' : 'عدد الروابط', metadata.linkCount == null ? '—' : String(metadata.linkCount)],
              [locale === 'en' ? 'Attributes' : 'الخصائص', metadata.attributesAvailable ? String(metadata.attributes) : '—'],
              [locale === 'en' ? 'Internet zone' : 'منطقة الإنترنت', metadata.zone.zoneAvailable ? String(metadata.zone.zoneId ?? '—') : '—'],
            ].map(([label,value]) => <div key={label}><dt>{label}</dt><dd dir="ltr">{value}</dd></div>)}</dl>
            <details className="knx-tool-evidence"><summary>{locale === 'en' ? 'Origin information' : 'معلومات المصدر'}</summary><p className="knx-tool-path">{metadata.zone.host || '—'}</p><p className="knx-tool-path">{metadata.zone.referrer || '—'}</p></details>
            <p>{locale === 'en' ? 'EXIF, audio tags and PDF document properties are not provided by this filesystem contract.' : 'عقد نظام الملفات لا يوفر EXIF أو الوسوم الصوتية أو خصائص مستند PDF.'}</p>
            {metadata.warnings.map((warning,index) => <p role="status" key={index}>{warning}</p>)}
            <div className="knx-tool-actions"><button type="button" onClick={onHash} disabled={hashLoading}>{locale === 'en' ? 'Compute SHA-256' : 'حساب SHA-256'}</button></div>
            {hash ? <code className="knx-tool-path">{hash.digest}</code> : null}
          </section>
        ) : <p role="status" data-testid="files-metadata-workbench">{locale === 'en' ? 'Select a file to read its metadata.' : 'اختر ملفًا لقراءة بياناته.'}</p>;
      case 'file-provenance':
        return (
          <div className="space-y-1 text-[10px] text-slate-300" data-testid="files-provenance-workbench">
            <div className="flex items-center gap-1.5 text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" />{overview?.coverage || 'unknown'} coverage</div>
            <div className="font-mono break-all text-slate-500">{overview?.source.path}</div>
            <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{overview?.source.lastScanned || '—'}</div>
            <div>{locale === 'en' ? 'Metadata-only scan. No file contents were read to build this index.' : 'فحص للبيانات الوصفية فقط. لم يُقرأ محتوى الملفات لبناء الفهرس.'}</div>
            <button disabled={!overview?.source.path} onClick={() => { if (overview?.source.path) void copyText(overview.source.path, locale === 'en' ? 'Source path copied' : 'تم نسخ مسار المصدر'); }} className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer disabled:opacity-50">
              {locale === 'en' ? 'Copy source path' : 'نسخ مسار المصدر'}
            </button>
            <output role="status">{copyStatus}</output>
            {metadata?.zone.zoneAvailable ? <details className="knx-tool-evidence"><summary>Zone.Identifier</summary><p>Zone {metadata.zone.zoneId ?? '—'}</p><p className="knx-tool-path">{metadata.zone.host || '—'}</p><p className="knx-tool-path">{metadata.zone.referrer || '—'}</p></details> : null}
          </div>
        );
      default:
        return <EmptyNative locale={locale} />;
    }
  };

  if (embedded) {
    return (
      <div data-testid="files-service-focus" data-tool-body="files" data-tool={service} className="knx-file-tool space-y-3">
        <p className="text-[10px] text-slate-400">{description}</p>
        {queryError && service !== 'file-search' ? <p role="alert" className="knx-tool-error">{queryError}</p> : null}
        {renderBody()}
      </div>
    );
  }

  return (
    <div data-testid="files-service-focus" className="bg-[#07152b] rounded-xl p-3 border border-[#2476ff]/40 space-y-2 shadow-[0_0_12px_rgba(36,118,255,0.15)]">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#0f2545]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white min-w-0">
          {service === 'file-empty-folders' ? <FolderMinus className="w-3.5 h-3.5 text-cyan-400" /> : service === 'file-hash' ? <Hash className="w-3.5 h-3.5 text-cyan-400" /> : <FileSearch className="w-3.5 h-3.5 text-cyan-400" />}
          <span className="truncate">{title}</span>
          <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${measured ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/60 text-amber-300 border-amber-500/40'}`}>
            {measured ? 'MEASURED' : 'FIXTURE'}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white cursor-pointer" aria-label="Close service focus">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[10px] text-slate-400">{description}</p>
        {queryError && service !== 'file-search' ? <p role="alert" className="knx-tool-error">{queryError}</p> : null}
      {renderBody()}
    </div>
  );
}
