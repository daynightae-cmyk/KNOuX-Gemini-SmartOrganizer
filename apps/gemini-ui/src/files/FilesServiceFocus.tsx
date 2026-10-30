import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSearch,
  FolderMinus,
  Hash,
  ShieldAlert,
  X,
} from 'lucide-react';
import type {
  FilesEmptyFoldersResult,
  FilesHashResult,
  FilesMetadata,
  FilesOverview,
} from '../../shared/native-contracts';
import { FILES_DOMAIN_SERVICES, type FileResultItem, type FilesServiceKey } from '../lib/file-inventory';
import { formatBytes } from './useFilesNative';

interface FilesServiceFocusProps {
  service: FilesServiceKey;
  locale: 'en' | 'ar';
  measured: boolean;
  overview: FilesOverview | null;
  selectedFile: FileResultItem;
  metadata: FilesMetadata | null;
  hash: FilesHashResult | null;
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
  embedded?: boolean;
}

function EmptyNative({ locale }: { locale: 'en' | 'ar' }) {
  return (
    <div className="text-[10px] text-amber-300/90 flex items-start gap-1.5">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>
        {locale === 'en'
          ? 'This service is design-fixture only until an Electron source is authorized.'
          : 'هذه الخدمة معاينة تصميم فقط حتى يتم التصريح بمصدر في Electron.'}
      </span>
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
  embedded = false,
}: FilesServiceFocusProps) {
  const meta = FILES_DOMAIN_SERVICES.find((entry) => entry.key === service);
  const title = meta ? (locale === 'en' ? meta.labelEn : meta.labelAr) : service;
  const description = meta ? (locale === 'en' ? meta.descEn : meta.descAr) : '';

  const renderBody = () => {
    if (!measured) return <EmptyNative locale={locale} />;

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
                  {overview.categories.slice(0, 5).map((category) => {
                    const total = overview.totals.files || 1;
                    const width = Math.max(2, Math.round((category.count / total) * 100));
                    return (
                      <div key={category.key}>
                        <div className="flex justify-between text-[9px] font-mono text-slate-400"><span>{category.key}</span><span>{category.count.toLocaleString()}</span></div>
                        <div className="h-1.5 rounded bg-[#0a1c38] overflow-hidden"><div className="h-full bg-gradient-to-r from-[#2476ff] to-[#26c6ff]" style={{ width: `${width}%` }} /></div>
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
                {emptyFolders.items.slice(0, 6).map((item) => (
                  <div key={item.relative} className="font-mono text-[9px] text-slate-400 truncate" title={item.fullPath}>{item.relative}</div>
                ))}
                {emptyFolders.partial && (
                  <div className="text-[9px] text-amber-300">{locale === 'en' ? 'Partial bounded result.' : 'نتيجة جزئية محدودة.'}</div>
                )}
              </div>
            )}
          </div>
        );
      case 'file-hash':
        return (
          <div className="space-y-2" data-testid="files-hash-workbench">
            <div className="text-[10px] text-slate-400 font-mono truncate" title={selectedFile.name}>{selectedFile.name}</div>
            <button onClick={onHash} className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer">
              {locale === 'en' ? 'Compute SHA-256' : 'حساب SHA-256'}
            </button>
            {hash && (
              <div className="text-[9px] font-mono text-emerald-300 break-all">{hash.digest}</div>
            )}
          </div>
        );
      case 'file-search':
        return (
          <div className="text-[11px] text-slate-300 space-y-1" data-testid="files-search-workbench">
            <div className="flex items-center gap-1.5 text-cyan-300"><FileSearch className="w-3.5 h-3.5" />{locale === 'en' ? 'Read-only native query' : 'استعلام أصلي للقراءة فقط'}</div>
            <div>{locale === 'en' ? 'Search, category, extension, size and date filters call the measured index. The ledger shows the first 200 matches.' : 'البحث والفئة والامتداد والحجم والتاريخ تستدعي الفهرس المقيس. يعرض السجل أول 200 نتيجة.'}</div>
            <button onClick={() => document.querySelector<HTMLInputElement>('[data-testid="files-search"]')?.focus()} className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer">
              {locale === 'en' ? 'Focus the search field' : 'الانتقال إلى حقل البحث'}
            </button>
          </div>
        );
      case 'file-type-map':
        return (
          <div className="space-y-1.5" data-testid="files-type-map-workbench">
            <button onClick={() => onSort('size_desc')} className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer">
              {locale === 'en' ? 'Rank the ledger by size' : 'ترتيب السجل حسب الحجم'}
            </button>
            {(overview?.extensions || []).slice(0, 6).map((item) => {
              const total = overview?.totals.files || 1;
              const percent = Math.max(2, Math.round((item.count / total) * 100));
              return (
                <div key={item.ext}>
                  <div className="flex justify-between text-[9px] font-mono text-slate-300">
                    <span>.{item.ext}</span><span>{item.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded bg-[#0a1c38] overflow-hidden">
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
        return (
          <div className="space-y-1" data-testid={`files-${service === 'file-recents' ? 'recents' : 'largest'}-workbench`}>
            <button onClick={() => onSort(service === 'file-recents' ? 'date_desc' : 'size_desc')} className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer">
              {service === 'file-recents'
                ? (locale === 'en' ? 'Sort the ledger by newest' : 'ترتيب السجل بالأحدث')
                : (locale === 'en' ? 'Sort the ledger by largest' : 'ترتيب السجل بالأكبر')}
            </button>
            {rows.slice(0, 5).map((item) => (
              <div key={`${service}-${item.id}`} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="text-slate-300 truncate">{item.name}</span>
                <span className="font-mono text-slate-500 shrink-0">{formatBytes(item.size)}</span>
              </div>
            ))}
            {!rows.length && <div className="text-[10px] text-slate-500">{locale === 'en' ? 'No rows in the measured index.' : 'لا توجد صفوف في الفهرس المقيس.'}</div>}
          </div>
        );
      }
      case 'file-metadata':
        return metadata ? (
          <div className="space-y-1 text-[10px] font-mono text-slate-300" data-testid="files-metadata-workbench">
            <div className="text-white truncate">{metadata.name}</div>
            <div>{metadata.size.toLocaleString()} bytes</div>
            <div className="break-all text-slate-500">{metadata.fullPath}</div>
            <div className="text-cyan-300">{metadata.zone.zoneAvailable ? `Zone ${metadata.zone.zoneId}` : 'No Zone.Identifier'}</div>
            <button onClick={onHash} className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer">
              {locale === 'en' ? 'Compute SHA-256' : 'حساب SHA-256'}
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500" data-testid="files-metadata-workbench">{locale === 'en' ? 'Select a file to read its metadata.' : 'اختر ملفًا لقراءة بياناته.'}</div>
        );
      case 'file-provenance':
        return (
          <div className="space-y-1 text-[10px] text-slate-300" data-testid="files-provenance-workbench">
            <div className="flex items-center gap-1.5 text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" />{overview?.coverage || 'unknown'} coverage</div>
            <div className="font-mono break-all text-slate-500">{overview?.source.path}</div>
            <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{overview?.source.lastScanned || '—'}</div>
            <div>{locale === 'en' ? 'Metadata-only scan. No file contents were read to build this index.' : 'فحص للبيانات الوصفية فقط. لم يُقرأ محتوى الملفات لبناء الفهرس.'}</div>
            <button disabled={!overview?.source.path} onClick={() => { if (overview?.source.path) void navigator.clipboard.writeText(overview.source.path); }} className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer disabled:opacity-50">
              {locale === 'en' ? 'Copy source path' : 'نسخ مسار المصدر'}
            </button>
          </div>
        );
      default:
        return <EmptyNative locale={locale} />;
    }
  };

  if (embedded) {
    return (
      <div data-testid="files-service-focus" className="space-y-2">
        <p className="text-[10px] text-slate-400">{description}</p>
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
      {renderBody()}
    </div>
  );
}
