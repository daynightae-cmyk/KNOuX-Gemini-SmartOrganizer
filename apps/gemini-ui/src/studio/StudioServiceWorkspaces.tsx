/**
 * KNOuX SmartOrganizer — Organization Studio workbench map (Mission 15A).
 *
 * Each of the 9 Studio stages resolves to a specialized measured workbench.
 * The shared ServiceWorkbenchHost handles chrome, docking, expand/reduce,
 * keyboard/Escape, scroll, close/back, and persisted panel preferences.
 */
import React from 'react';
import { ServiceWorkbenchHost, type WorkbenchMode } from '../components/workbench/ServiceWorkbenchHost';
import type { StudioContextValue } from './context';
import { Folder, Image, Video, FileText, Layers, HardDrive, Clipboard, Settings, Clock, Sparkles, ArrowRight, ShieldCheck, Lock, AlertTriangle, CheckCircle2, ExternalLink, Plus, Minus, Type, Database, Compass, Calendar, Search, Trash2, RefreshCw, MoreVertical, X, Grid, List, ChevronDown, Check, ShieldAlert, Compass as CompassIcon, Music, Archive, Box, Palette, Code, Table, Presentation, FileCheck2, BookOpen, Cog, Globe } from 'lucide-react';

function renderCategoryIconName(iconName: string, color: string, className = 'w-3.5 h-3.5') {
  switch (iconName) {
    case 'Image': return <Image className={className} style={{ color }} />;
    case 'Video': return <Video className={className} style={{ color }} />;
    case 'FileText': return <FileText className={className} style={{ color }} />;
    case 'Music': return <Music className={className} style={{ color }} />;
    case 'Archive': return <Archive className={className} style={{ color }} />;
    case 'Box': return <Box className={className} style={{ color }} />;
    case 'Palette': return <Palette className={className} style={{ color }} />;
    case 'Code': return <Code className={className} style={{ color }} />;
    case 'Table': return <Table className={className} style={{ color }} />;
    case 'Presentation': return <Presentation className={className} style={{ color }} />;
    case 'FileCheck2': return <FileCheck2 className={className} style={{ color }} />;
    case 'Type': return <Type className={className} style={{ color }} />;
    case 'Database': return <Database className={className} style={{ color }} />;
    case 'BookOpen': return <BookOpen className={className} style={{ color }} />;
    case 'Cog': return <Cog className={className} style={{ color }} />;
    case 'Globe': return <Globe className={className} style={{ color }} />;
    case 'Folder': return <Folder className={className} style={{ color }} />;
    default: return <MoreVertical className={className} style={{ color }} />;
  }
}

export type StudioStageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface StudioWorkbenchProps {
  studio: StudioContextValue;
  stageId: StudioStageId;
  locale: 'en' | 'ar';
}

export const STAGE_ICONS: Record<StudioStageId, React.ComponentType<{ className?: string }>> = {
  1: Folder,
  2: Image,
  3: Layers,
  4: Settings,
  5: HardDrive,
  6: Clipboard,
  7: ShieldCheck,
  8: Clock,
  9: Sparkles,
};

export const STAGE_LABELS: Record<StudioStageId, { en: string; ar: string }> = {
  1: { en: 'Sources', ar: 'المصادر' },
  2: { en: 'Visual Library', ar: 'المكتبة المرئية' },
  3: { en: 'Collections', ar: 'المجموعات' },
  4: { en: 'Organization Builder', ar: 'منشئ التنظيم' },
  5: { en: 'Destinations', ar: 'الوجهات' },
  6: { en: 'Plan Review', ar: 'مراجعة الخطة' },
  7: { en: 'Execution', ar: 'التنفيذ' },
  8: { en: 'History & Undo', ar: 'السجل والتراجع' },
  9: { en: 'Suggestions', ar: 'المقترحات' },
};

export const STAGE_DESCRIPTIONS: Record<StudioStageId, { en: string; ar: string }> = {
  1: { en: 'Grant access to local folders for indexing and organization', ar: 'امنح الإذن للمجلدات المحلية للفهرسة والتنظيم' },
  2: { en: 'Browse categorized files with thumbnails and multi-select', ar: 'تصفح الملفات المصنفة بالصور المصغرة والتحديد المتعدد' },
  3: { en: 'Compose and manage file collections with custom rules', ar: 'إنشاء وإدارة مجموعات الملفات بقواعد مخصصة' },
  4: { en: 'Define naming and grouping rules for organized output', ar: 'تعريف قواعد التسمية والتجميع للمخرجات المنظمة' },
  5: { en: 'Choose destination folders for organized files', ar: 'اختيار مجلدات الوجهة للملفات المنظمة' },
  6: { en: 'Review immutable native plan preview with totals and conflicts', ar: 'مراجعة معاينة الخطة الأصلية الثابتة مع الإجماليات والتعارضات' },
  7: { en: 'Execute approved plan with progress, receipts, and verification', ar: 'تنفيذ الخطة المعتمدة مع التقدم والإيصالات والتحقق' },
  8: { en: 'View preview history and reversible operations journal', ar: 'عرض سجل المعاينات والعمليات القابلة للتراجع' },
  9: { en: 'Review AI suggestions linked to plan and evidence', ar: 'مراجعة المقترحات المرتبطة بالخطة والأدلة' },
};

export const STAGE_STATES: Record<StudioStageId, 'completed' | 'active' | 'available' | 'blocked'> = {
  1: 'completed',
  2: 'active',
  3: 'available',
  4: 'available',
  5: 'available',
  6: 'available',
  7: 'blocked',
  8: 'available',
  9: 'available',
};

function stageStateTone(state: string): 'good' | 'warn' | 'bad' | 'muted' {
  if (state === 'completed') return 'good';
  if (state === 'active') return 'warn';
  if (state === 'available') return 'good';
  if (state === 'blocked') return 'bad';
  return 'muted';
}

function StageBadge({ state, locale }: { state: string; locale: 'en' | 'ar' }) {
  const tone = stageStateTone(state);
  const labels = {
    completed: { en: 'Completed', ar: 'مكتمل' },
    active: { en: 'Active', ar: 'نشط' },
    available: { en: 'Available', ar: 'متاح' },
    blocked: { en: 'Blocked', ar: 'محظور' },
  };
  const label = labels[state as keyof typeof labels] || { en: state, ar: state };
  const colors = {
    good: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
    warn: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
    bad: 'bg-rose-950/60 text-rose-300 border-rose-500/40',
    muted: 'bg-slate-950/60 text-slate-300 border-slate-500/40',
  };
  return (
    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${colors[tone]}`}>
      {locale === 'ar' ? label.ar : label.en}
    </span>
  );
}

/**
 * Stage 1: Sources - Authorized folder picker and inventory
 */
export function SourcesWorkbench({ studio, locale }: StudioWorkbenchProps) {
  const { authorizedSources, inventory, addNativeSource, removeAuthorizedSource, refreshSources, scanActiveSource, native } = studio;
  const t = (en: string, ar: string) => locale === 'ar' ? ar : en;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52] flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wide">{t('Authorized Sources', 'المصادر المصرح بها')}</h2>
            <StageBadge state={STAGE_STATES[1]} locale={locale} />
          </div>
          <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold border ${native.mode === 'measured' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/60 text-amber-300 border-amber-500/40'}`}>
            {native.mode === 'measured' ? t('MEASURED', 'مقيس') : t('FIXTURE', 'تجريبي')}
          </span>
        </div>

        <div className="py-2 space-y-2 flex-1 overflow-y-auto studio-scrollbar pr-0.5">
          {authorizedSources.length === 0 ? (
            <div className="p-4 text-center rounded-lg border border-dashed border-[#1a3d6d] bg-[#061427]/60">
              <Folder className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-300">{t('No authorized sources', 'لا توجد مصادر مصرح بها')}</div>
              <p className="text-[10px] text-slate-500 mt-1">
                {t('Grant access to local folders to index & organize.', 'امنح الإذن للمجلدات المحلية للبدء في الفهرسة والتنظيم.')}
              </p>
            </div>
          ) : (
            authorizedSources.map((folder) => (
              <div key={folder.id} className="relative p-2 rounded-lg bg-[#0a182e] hover:bg-[#0f2342] border border-[#142e56] hover:border-[#1d427b] transition-all group">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-start gap-2 min-w-0">
                    <Folder className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 fill-amber-400/20" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white" title={folder.path}>{folder.path}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{folder.fileCount.toLocaleString()} files &nbsp;|&nbsp; {folder.sizeGb} GB</div>
                    </div>
                  </div>
                  <div className="relative">
                    <button onClick={() => removeAuthorizedSource(folder.id)} className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-[#163663] transition-colors cursor-pointer" title={t('Revoke grant', 'إلغاء التصريح')}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-[#0f2545] space-y-1.5">
          <button onClick={() => native.available ? void addNativeSource() : studio.openModal('add_folder')} disabled={native.scanning} className="w-full py-1.5 rounded-lg bg-[#0d223f] hover:bg-[#143563] disabled:opacity-50 text-cyan-300 border border-[#2476ff]/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer">
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t(native.available ? 'Add native folder' : 'Add Folder (fixture)', native.available ? 'إضافة مجلد أصلي' : 'إضافة مجلد (تجريبي)')}</span>
          </button>
          <button onClick={() => native.available ? void scanActiveSource() : refreshSources()} disabled={native.scanning} className="w-full py-1.5 rounded-lg bg-[#081528] hover:bg-[#0c1f3b] disabled:opacity-50 text-slate-400 hover:text-slate-200 border border-[#132c52] text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer">
            <RefreshCw className={`w-3 h-3 text-slate-500 ${native.scanning ? 'animate-spin' : ''}`} />
            <span>{t('Re-scan measured source', 'إعادة فحص المصدر المقيس')}</span>
          </button>
        </div>
      </div>

      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52]">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white tracking-wide">{t('Inventory Summary', 'ملخص المخزون')}</h3>
          </div>
        </div>
        <div className="pt-2.5 space-y-2 text-xs">
          <div className="flex items-center justify-between"><span className="text-slate-400">{t('Total Files', 'إجمالي الملفات')}</span><span className="font-semibold text-white font-mono">{inventory.totalFiles.toLocaleString()}</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-400">{t('Total Size', 'الحجم الكلي')}</span><span className="font-semibold text-cyan-300 font-mono">{inventory.totalSizeGb} GB</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-400">{t('Folders', 'المجلدات')}</span><span className="font-semibold text-white font-mono">{inventory.totalFolders.toLocaleString()}</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-400">{t('File Types', 'أنواع الملفات')}</span><span className="font-semibold text-white font-mono">{inventory.fileTypesCount}</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-400">{t('Source Count', 'عدد المصادر')}</span><span className="font-semibold text-white font-mono">{inventory.sourceCount}</span></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Stage 2: Visual Library - File gallery with categories and thumbnails
 */
export function VisualLibraryWorkbench({ studio, locale }: StudioWorkbenchProps) {
  const { files, categories, selectedCategoryKey, setSelectedCategoryKey, viewMode, setViewMode, sortOrder, setSortOrder, selectedFileIds, toggleFileSelection, selectAllFiles, deselectAllFiles, native, locale: studioLocale } = studio;
  const t = (en: string, ar: string) => locale === 'ar' ? ar : en;
  const isAr = locale === 'ar';

  const filteredFiles = files.filter(f => f.category === selectedCategoryKey);
  const selectedCount = selectedFileIds.size;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52] flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wide">{t('Visual Library', 'المكتبة المرئية')}</h2>
            <StageBadge state={STAGE_STATES[2]} locale={locale} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          {categories.map((cat) => (
            <button key={cat.key} onClick={() => setSelectedCategoryKey(cat.key)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${selectedCategoryKey === cat.key ? 'bg-gradient-to-r from-[#173e80] to-[#2476ff] text-white border border-cyan-400/60 shadow-[0_0_12px_rgba(36,118,255,0.5)]' : 'bg-[#08172c] hover:bg-[#0e223d] text-slate-300 border border-[#132c52]'}`}>
              <span style={{ color: cat.colorAccent }}>{renderCategoryIconName(cat.iconName, cat.colorAccent)}</span>
              <span>{isAr ? cat.labelAr : cat.labelEn}</span>
              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-black/30">{cat.fileCount.toLocaleString()}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 bg-[#08172c] border border-[#132c52] rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#2476ff] text-white' : 'text-slate-400 hover:text-slate-200'}`}><Grid className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-[#2476ff] text-white' : 'text-slate-400 hover:text-slate-200'}`}><List className="w-3.5 h-3.5" /></button>
          </div>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="bg-[#08172c] text-slate-300 border border-[#142e56] rounded-md px-2 py-1 text-xs font-medium cursor-pointer appearance-none pr-6 outline-none">
            <option value="date_newest">{t('Newest', 'الأحدث')}</option>
            <option value="date_oldest">{t('Oldest', 'الأقدم')}</option>
            <option value="name_asc">{t('Name A-Z', 'الاسم أ-ي')}</option>
            <option value="size_desc">{t('Largest', 'الأكبر')}</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto studio-scrollbar relative" role="list" aria-label={t('Files', 'الملفات')}>
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Image className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">{t('No files in this category', 'لا توجد ملفات في هذه الفئة')}</p>
            </div>
          ) : (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 p-2">
                {filteredFiles.map((file) => (
                  <div key={file.id} className={`relative aspect-video rounded-lg overflow-hidden border cursor-pointer transition-all ${selectedFileIds.has(file.id) ? 'border-[#2476ff] bg-[#0e2447] shadow-[0_0_12px_rgba(36,118,255,0.35)]' : 'border-[#132c52] bg-[#08172c] hover:border-[#1d427b]'}`} onClick={() => toggleFileSelection(file.id)}>
                    <div className="relative w-full h-full">
                      {file.thumbnailUrl ? <img src={file.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#091a32] to-[#0d274d]"><FileText className="w-8 h-8 text-slate-500" /></div>}
                      <button onClick={e => { e.stopPropagation(); toggleFileSelection(file.id); }} className={`absolute top-1.5 left-1.5 w-4 h-4 rounded border flex items-center justify-center ${selectedFileIds.has(file.id) ? 'bg-[#2476ff] border-[#26c6ff] text-white' : 'bg-black/50 border-white/50'}`} aria-label={t('Select', 'تحديد')}>
                        {selectedFileIds.has(file.id) && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>
                    </div>
                    <div className="p-1.5"><div className="text-[11px] font-semibold text-slate-200 truncate" title={file.name}>{file.name}</div><div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center justify-between gap-1"><span className="truncate">{file.category}</span><span className="shrink-0">{file.sizeFormatted}</span></div></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredFiles.map((file) => (
                  <div key={file.id} className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all ${selectedFileIds.has(file.id) ? 'bg-[#0e2447] border border-[#2476ff]' : 'hover:bg-[#0e223d]'}`} onClick={() => toggleFileSelection(file.id)}>
                    <button onClick={e => { e.stopPropagation(); toggleFileSelection(file.id); }} className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedFileIds.has(file.id) ? 'bg-[#2476ff] border-[#26c6ff] text-white' : 'bg-transparent border-slate-600 hover:border-slate-400'}`}><Check className="w-2.5 h-2.5 stroke-[3]" /></button>
                    {file.thumbnailUrl ? <img src={file.thumbnailUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" /> : <FileText className="w-8 h-8 text-slate-500 shrink-0" />}
                    <div className="min-w-0 flex-1"><div className="text-xs font-semibold text-slate-200 truncate" title={file.name}>{file.name}</div><div className="text-[10px] text-slate-400 font-mono flex items-center gap-2"><span>{file.category}</span><span>{file.sizeFormatted}</span></div></div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div className="pt-2 border-t border-[#0f2545] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {selectedCount} {selectedCount === 1 ? t('file selected', 'ملف محدد') : t('files selected', 'ملفات محددة')} / {filteredFiles.length} {t('total', 'إجمالي')}
          </div>
          <div className="flex items-center gap-1">
            {selectedCount > 0 && <button onClick={deselectAllFiles} className="px-2 py-1 rounded bg-[#0a1828] hover:bg-[#0c1f3b] text-slate-400 hover:text-slate-200 border border-[#132c52] text-xs font-medium cursor-pointer">{t('Clear selection', 'مسح التحديد')}</button>}
            <button onClick={selectAllFiles} className="px-2 py-1 rounded bg-[#0d223f] hover:bg-[#143563] text-cyan-300 border border-[#2476ff]/50 text-xs font-semibold cursor-pointer">{t('Select all', 'تحديد الكل')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Stage 3: Collections - Collection composer and rule summary
 */
export function CollectionsWorkbench({ studio, locale }: StudioWorkbenchProps) {
  const { collections, native, files, selectedFileIds } = studio;
  const t = (en: string, ar: string) => locale === 'ar' ? ar : en;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52] flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wide">{t('Collections', 'المجموعات')}</h2>
            <StageBadge state={STAGE_STATES[3]} locale={locale} />
          </div>
        </div>

        <div className="text-[10px] text-slate-400 mb-3">{t('Collections are logical groupings of selected files. They persist across stages and can be used to build organization rules.', 'المجموعات هي تجمعات منطقية للملفات المحددة. تستمر عبر المراحل ويمكن استخدامها لبناء قواعد التنظيم.')}</div>

        <div className="space-y-2 flex-1 overflow-y-auto studio-scrollbar">
          {collections.length === 0 ? (
            <div className="p-4 text-center rounded-lg border border-dashed border-[#1a3d6d] bg-[#061427]/60">
              <Layers className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-300">{t('No collections yet', 'لا توجد مجموعات بعد')}</div>
              <p className="text-[10px] text-slate-500 mt-1">{t('Select files in Visual Library and create collections from the context menu.', 'حدد الملفات في المكتبة المرئية وأنشئ مجموعات من قائمة السياق.')}</p>
            </div>
          ) : (
            collections.map((collection) => (
              <div key={collection.id} className="p-2 rounded-lg bg-[#0a182e] hover:bg-[#0f2342] border border-[#142e56] hover:border-[#1d427b] transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <Layers className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">{collection.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{collection.fileCount} {t('files', 'ملفات')} · {t('Created', 'تم الإنشاء')}: {new Date(collection.createdDate).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-[#163663] transition-colors cursor-pointer" title={t('Rename', 'إعادة تسمية')}><Type className="w-3.5 h-3.5" /></button>
                    <button className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-[#163663] transition-colors cursor-pointer" title={t('Delete', 'حذف')}>×</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-[#0f2545]">
          <button className="w-full py-1.5 rounded-lg bg-[#0d223f] hover:bg-[#143563] text-cyan-300 border border-[#2476ff]/50 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('Create collection from selection', 'إنشاء مجموعة من التحديد')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Stage 4: Organization Builder - Naming and grouping rules
 */
export function OrganizationBuilderWorkbench({ studio, locale }: StudioWorkbenchProps) {
  const { namingRule, setNamingRule, groupingRule, setGroupingRule, operationMode, setOperationMode } = studio;
  const t = (en: string, ar: string) => locale === 'ar' ? ar : en;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52] flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wide">{t('Organization Builder', 'منشئ التنظيم')}</h2>
            <StageBadge state={STAGE_STATES[4]} locale={locale} />
          </div>
        </div>

        <div className="space-y-3 pt-2 flex-1 overflow-y-auto studio-scrollbar">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t('Operation Mode', 'وضع العملية')}</label>
            <div className="flex flex-wrap gap-2">
              {(['copy', 'move'] as const).map((mode) => (
                <button key={mode} onClick={() => setOperationMode(mode)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${operationMode === mode ? 'bg-gradient-to-r from-[#173e80] to-[#2476ff] text-white border border-cyan-400/60 shadow-[0_0_12px_rgba(36,118,255,0.5)]' : 'bg-[#08172c] hover:bg-[#0e223d] text-slate-300 border border-[#132c52]'}`}>
                  {mode === 'copy' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5 rotate-90" />}
                  <span>{t(mode === 'copy' ? 'Copy files' : 'Move files', mode === 'copy' ? 'نسخ الملفات' : 'نقل الملفات')}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t('Naming Rule', 'قاعدة التسمية')}</label>
            <select value={namingRule.strategy} onChange={e => setNamingRule({ ...namingRule, strategy: e.target.value as any })} className="w-full bg-[#08172c] text-slate-300 border border-[#142e56] rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer appearance-none pr-8 outline-none">
              <option value="original">{t('Keep original name', 'الاحتفاظ بالاسم الأصلي')}</option>
              <option value="prefix">{t('Add prefix', 'إضافة بادئة')}</option>
              <option value="suffix">{t('Add suffix', 'إضافة لاحقة')}</option>
              <option value="pattern">{t('Custom pattern', 'نمط مخصص')}</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">{namingRule.descriptionEn}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t('Grouping Rule', 'قاعدة التجميع')}</label>
            <select value={groupingRule.groupBy} onChange={e => setGroupingRule({ ...groupingRule, groupBy: e.target.value as any })} className="w-full bg-[#08172c] text-slate-300 border border-[#142e56] rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer appearance-none pr-8 outline-none">
              <option value="capture_date">{t('Capture Date', 'تاريخ الالتقاط')}</option>
              <option value="file_type">{t('File Type', 'نوع الملف')}</option>
              <option value="size">{t('File Size', 'حجم الملف')}</option>
              <option value="folder">{t('Source Folder', 'المجلد المصدر')}</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">{groupingRule.descriptionEn}</p>
          </div>

          <div className="pt-2 border-t border-[#0f2545] bg-[#050e1c] rounded-lg p-2">
            <div className="text-[10px] text-slate-300 mb-1">{t('Structure Preview', 'معاينة الهيكل')}</div>
            <div className="font-mono text-[11px] text-cyan-300 bg-black/30 rounded px-2 py-1">{groupingRule.structure}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Stage 5: Destinations - Destination picker
 */
export function DestinationsWorkbench({ studio, locale }: StudioWorkbenchProps) {
  const { destinationPath, setDestinationPath, chooseNativeDestination, native } = studio;
  const t = (en: string, ar: string) => locale === 'ar' ? ar : en;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52] flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wide">{t('Destinations', 'الوجهات')}</h2>
            <StageBadge state={STAGE_STATES[5]} locale={locale} />
          </div>
          <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold border ${native.destination ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-slate-950/60 text-slate-300 border-slate-500/40'}`}>
            {native.destination ? t('SET', 'مُحدَّد') : t('NOT SET', 'غير مُحدَّد')}
          </span>
        </div>

        <div className="pt-2 space-y-3 flex-1 overflow-y-auto studio-scrollbar">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t('Destination Folder', 'مجلد الوجهة')}</label>
            <div className="relative">
              <input value={destinationPath} onChange={e => setDestinationPath(e.target.value)} className="w-full bg-[#08172c] text-slate-300 border border-[#142e56] rounded-md px-2.5 py-1.5 text-xs font-mono cursor-pointer outline-none pr-10" readOnly />
              <button onClick={() => native.available ? void chooseNativeDestination() : studio.openModal('change_destination')} disabled={!native.available} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-slate-500 hover:text-cyan-300 disabled:opacity-50 cursor-pointer"><ExternalLink className="w-3.5 h-3.5" /></button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{t('Use the button to pick a folder via native dialog. Path must be writable.', 'استخدم الزر لاختيار مجلد عبر مربع الحوار الأصلي. يجب أن يكون المسار قابلاً للكتابة.')}</p>
          </div>

          {native.destination && (
            <div className="pt-2 border-t border-[#0f2545] bg-[#050e1c] rounded-lg p-2">
              <div className="text-[10px] text-slate-300 mb-1">{t('Confirmed Destination', 'الوجهة المؤكدة')}</div>
              <div className="font-mono text-[11px] text-emerald-300">{native.destination.path}</div>
            </div>
          )}

          <div className="text-[10px] text-slate-400">
            {t('Requirements:', 'المتطلبات:')}
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>{t('Folder must exist and be writable', 'يجب أن يوجد المجلد ويكون قابلاً للكتابة')}</li>
              <li>{t('Cannot be inside a source folder', 'لا يمكن أن يكون داخل مجلد مصدر')}</li>
              <li>{t('Network paths require prior authorization', 'مسارات الشبكة تتطلب تصريحًا مسبقًا')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Stage 6: Plan Review - Immutable native plan preview
 */
export function PlanReviewWorkbench({ studio, locale }: StudioWorkbenchProps) {
  const { native, previewNativePlan, operationMode, namingRule, groupingRule } = studio;
  const t = (en: string, ar: string) => locale === 'ar' ? ar : en;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52] flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <Clipboard className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wide">{t('Plan Review', 'مراجعة الخطة')}</h2>
            <StageBadge state={STAGE_STATES[6]} locale={locale} />
          </div>
        </div>

        <div className="pt-2 space-y-3 flex-1 overflow-y-auto studio-scrollbar">
          <button onClick={() => previewNativePlan(operationMode)} disabled={native.planLoading || !native.available} className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-black text-white border border-cyan-300/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer">
            {native.planLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{t('Computing plan…', 'جارٍ حساب الخطة…')}</span>
              </>
            ) : native.plan ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('Refresh plan preview', 'تحديث معاينة الخطة')}</span>
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5" />
                <span>{t('Generate plan preview', 'إنشاء معاينة الخطة')}</span>
              </>
            )}
          </button>

          {native.planError && (
            <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-200 text-[10px]">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
              <span>{native.planError}</span>
            </div>
          )}

          {native.plan && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: t('Files to process', 'ملفات للمعالجة'), value: native.plan.totals.files.toLocaleString() },
                  { label: t('Total size', 'الحجم الكلي'), value: (native.plan.totals.bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB' },
                  { label: t('Categories', 'فئات'), value: native.plan.categories.length.toLocaleString() },
                  { label: t('Collisions', 'تصادمات'), value: native.plan.collisions.length.toLocaleString() },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#132c52] bg-[#040d1c] p-2">
                    <div className="text-[9px] text-slate-500">{item.label}</div>
                    <div className="font-mono text-sm font-black text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <details className="knx-tool-evidence">
                <summary>{t('Plan details', 'تفاصيل الخطة')}</summary>
                <div className="space-y-1 text-[10px] font-mono">
                  <div><strong>{t('Plan ID', 'معرف الخطة')}:</strong> {native.plan.planId}</div>
                  <div><strong>{t('Generated', 'تم الإنشاء')}:</strong> {new Date(native.plan.createdAt).toLocaleString()}</div>
                  <div><strong>{t('Operation', 'العملية')}:</strong> {operationMode}</div>
                  <div><strong>{t('Naming', 'التسمية')}:</strong> {namingRule.strategy}</div>
                  <div><strong>{t('Grouping', 'التجميع')}:</strong> {groupingRule.groupBy}</div>
                </div>
              </details>
            </div>
          )}

          {!native.plan && !native.planLoading && (
            <div className="p-4 text-center rounded-lg border border-dashed border-[#1a3d6d] bg-[#061427]/60">
              <Clipboard className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-300">{t('No plan generated yet', 'لم يتم إنشاء خطة بعد')}</div>
              <p className="text-[10px] text-slate-500 mt-1">{t('Click "Generate plan preview" to compute the exact before/after plan with plan hash.', 'اضغط على "إنشاء معاينة الخطة" لحساب خطة دقيقة قبل/بعد مع بصمة الخطة.')}</p>
            </div>
          )}

          {native.plan && (
            <div className="pt-2 border-t border-[#0f2545] flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">{t('Review carefully before proceeding to Execution (stage 07).', 'راجع بعناية قبل المتابعة للتنفيذ (المرحلة 07).')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Stage 7: Execution - Execution status (blocked in current mission)
 */
export function ExecutionWorkbench({ studio, locale }: StudioWorkbenchProps) {
  const { native } = studio;
  const t = (en: string, ar: string) => locale === 'ar' ? ar : en;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52] flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wide">{t('Execution', 'التنفيذ')}</h2>
            <StageBadge state={STAGE_STATES[7]} locale={locale} />
          </div>
        </div>

        <div className="pt-2 space-y-3 flex-1 overflow-y-auto studio-scrollbar">
          <div className="align-start flex items-start gap-2 text-amber-200">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {t('Execution is blocked in this mission. Plan review (stage 06) must complete with explicit approval before any file operation executes. No execution channel is exposed in the current preview.', 'التنفيذ محظور في هذه المهمة. يجب أن تكتمل مراجعة الخطة (المرحلة 06) بموافقة صريحة قبل تنفيذ أي عملية ملف. لا توجد قناة تنفيذ مكشوفة في المعاينة الحالية.')}
            </span>
          </div>

          <div className="rounded-lg border border-[#132c52] bg-[#040d1c] p-2 flex items-center justify-between gap-2">
            <span className="text-slate-400">{t('Plan status', 'حالة الخطة')}</span>
            <span className="font-mono text-white">{native.plan ? t('Ready for approval', 'جاهز للموافقة') : t('No plan', 'لا توجد خطة')}</span>
          </div>

          <div className="text-[10px] text-slate-400">
            {t('When execution is enabled, this stage will show:', 'عند تفعيل التنفيذ، ستعرض هذه المرحلة:')}
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>{t('Real-time progress with per-file status', 'تقدم فوري مع حالة كل ملف')}</li>
              <li>{t('Pause/Cancel controls', 'أزرار إيقاف مؤقت/إلغاء')}</li>
              <li>{t('Per-file postcondition verification', 'تحقق ما بعد الشرط لكل ملف')}</li>
              <li>{t('Durable receipts with SHA-256 plan hash', 'إيصالات دائمة مع بصمة خطة SHA-256')}</li>
              <li>{t('Real undo/restore for reversible operations', 'تراجع/استعادة حقيقي للعمليات القابلة للعكس')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Stage 8: History & Undo - Preview history and reversible operations
 */
export function HistoryUndoWorkbench({ studio, locale }: StudioWorkbenchProps) {
  const { historyJournal, revertJournalEntry, native } = studio;
  const t = (en: string, ar: string) => locale === 'ar' ? ar : en;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52] flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wide">{t('History & Undo', 'السجل والتراجع')}</h2>
            <StageBadge state={STAGE_STATES[8]} locale={locale} />
          </div>
        </div>

        <div className="pt-2 space-y-3 flex-1 overflow-y-auto studio-scrollbar">
          {native.previewHistory.length === 0 && historyJournal.length === 0 ? (
            <div className="p-4 text-center rounded-lg border border-dashed border-[#1a3d6d] bg-[#061427]/60">
              <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-300">{t('No history yet', 'لا يوجد سجل بعد')}</div>
              <p className="text-[10px] text-slate-500 mt-1">{t('Plan previews and executed operations will appear here.', 'ستظهر معاينات الخطط والعمليات المنفذة هنا.')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {native.previewHistory.map((entry) => (
                <div key={entry.id} className="p-2 rounded-lg bg-[#0a182e] hover:bg-[#0f2342] border border-[#142e56] hover:border-[#1d427b] transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <Clipboard className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate">{t('Plan Preview', 'معاينة خطة')}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(entry.createdAt).toLocaleString()} · {entry.files} {t('files', 'ملفات')} · {(entry.bytes / (1024 * 1024 * 1024)).toFixed(1)} GB</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border-emerald-500/40">{t('PREVIEW', 'معاينة')}</span>
                  </div>
                </div>
              ))}
              {historyJournal.map((entry) => (
                <div key={entry.id} className="p-2 rounded-lg bg-[#0a182e] hover:bg-[#0f2342] border border-[#142e56] hover:border-[#1d427b] transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate">{entry.summaryEn} · {entry.filesProcessed} {t('files', 'ملفات')}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(entry.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {entry.canUndo && (
                        <button onClick={() => revertJournalEntry(entry.id)} className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-[10px] font-bold text-emerald-200 cursor-pointer">
                          {t('Undo', 'تراجع')}
                        </button>
                      )}
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold border ${entry.canUndo ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/60 text-rose-300 border-rose-500/40'}`}>
                        {entry.canUndo ? t('REVERSIBLE', 'قابل للتراجع') : t('IRREVERSIBLE', 'غير قابل للتراجع')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Stage 9: Suggestions - AI suggestions linked to plan/evidence
 */
export function SuggestionsWorkbench({ studio, locale }: StudioWorkbenchProps) {
  const { suggestions, dismissSuggestion } = studio;
  const t = (en: string, ar: string) => locale === 'ar' ? ar : en;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="studio-glass-panel rounded-xl p-3 border border-[#132c52] flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#0f2545]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wide">{t('Suggestions', 'المقترحات')}</h2>
            <StageBadge state={STAGE_STATES[9]} locale={locale} />
          </div>
        </div>

        <div className="pt-2 space-y-3 flex-1 overflow-y-auto studio-scrollbar">
          {suggestions.length === 0 ? (
            <div className="p-4 text-center rounded-lg border border-dashed border-[#1a3d6d] bg-[#061427]/60">
              <Sparkles className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-300">{t('No suggestions available', 'لا توجد مقترحات متاحة')}</div>
              <p className="text-[10px] text-slate-500 mt-1">{t('Suggestions appear after plan generation based on evidence.', 'تظهر المقترحات بعد إنشاء الخطة بناءً على الأدلة.')}</p>
            </div>
          ) : (
            suggestions.map((suggestion) => {
                const confidence = suggestion.confidenceScore;
                const priorityClass = confidence >= 0.8 ? 'bg-rose-950/60 text-rose-300 border-rose-500/40' : confidence >= 0.5 ? 'bg-amber-950/60 text-amber-300 border-amber-500/40' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
                const priorityLabel = confidence >= 0.8 ? 'HIGH' : confidence >= 0.5 ? 'MEDIUM' : 'LOW';
                return (
                  <div key={suggestion.id} className="p-2 rounded-lg bg-[#0a182e] hover:bg-[#0f2342] border border-[#142e56] hover:border-[#1d427b] transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-200 truncate">{suggestion.titleEn}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{suggestion.descriptionEn}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => dismissSuggestion(suggestion.id)} className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-[#163663] transition-colors cursor-pointer" title={t('Dismiss', 'إغلاق')}><X className="w-3.5 h-3.5" /></button>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold border ${priorityClass}`}>
                          {priorityLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Map of all Studio stage workbenches
 */
export const STUDIO_WORKBENCHES: Record<StudioStageId, React.ComponentType<StudioWorkbenchProps>> = {
  1: SourcesWorkbench,
  2: VisualLibraryWorkbench,
  3: CollectionsWorkbench,
  4: OrganizationBuilderWorkbench,
  5: DestinationsWorkbench,
  6: PlanReviewWorkbench,
  7: ExecutionWorkbench,
  8: HistoryUndoWorkbench,
  9: SuggestionsWorkbench,
};

export const STUDIO_WORKBENCH_IDS = Object.keys(STUDIO_WORKBENCHES).map(Number) as StudioStageId[];

export function hasStudioWorkbench(id: number): id is StudioStageId {
  return Object.prototype.hasOwnProperty.call(STUDIO_WORKBENCHES, id);
}

export interface StudioServiceWorkspaceProps {
  stageId: StudioStageId;
  studio: StudioContextValue;
  locale: 'en' | 'ar';
  onClose: () => void;
  mode: WorkbenchMode;
  onModeChange: (mode: WorkbenchMode) => void;
  width: number;
  onResize: (width: number) => void;
  toolSelector?: React.ReactNode;
  embedded?: boolean;
}

export function StudioServiceWorkspace({
  stageId,
  studio,
  locale,
  onClose,
  mode,
  onModeChange,
  width,
  onResize,
  toolSelector,
  embedded = false,
}: StudioServiceWorkspaceProps) {
  const StageIcon = STAGE_ICONS[stageId];
  const isAr = locale === 'ar';
  const state = STAGE_STATES[stageId];
  const title = STAGE_LABELS[stageId][locale];
  const description = STAGE_DESCRIPTIONS[stageId][locale];
  const WorkbenchComponent = STUDIO_WORKBENCHES[stageId];
  const body = <WorkbenchComponent studio={studio} stageId={stageId} locale={locale} />;
  const footer = (
    <span className={isAr ? 'text-slate-300' : 'text-slate-400'}>
      {isAr ? 'مقيس · للقراءة فقط' : 'Measured · read-only'}
    </span>
  );

  if (embedded) {
    return (
      <div className="studio-embedded-service" data-testid="studio-embedded-service">
        <header className="studio-embedded-head">
          <span className="studio-embedded-icon" aria-hidden="true"><StageIcon className="w-4 h-4" /></span>
          <span className="studio-embedded-copy">
            <strong>{title}</strong>
            <small>{description}</small>
          </span>
          <span className={`studio-embedded-state is-${stageStateTone(state)}`} data-testid="studio-embedded-state">
            {state === 'completed' ? (isAr ? 'مكتمل' : 'Completed') : state === 'active' ? (isAr ? 'نشط' : 'Active') : state === 'available' ? (isAr ? 'متاح' : 'Available') : (isAr ? 'محظور' : 'Blocked')}
          </span>
          <button type="button" className="sys-btn sys-btn-quiet" onClick={onClose} data-testid="studio-embedded-close">
            {isAr ? 'العودة إلى الاستوديو' : 'Back to Studio'}
          </button>
        </header>
        {body}
        <footer className="studio-embedded-foot">{footer}</footer>
      </div>
    );
  }

  if (mode === 'side') {
    return (
      <div className="fixed end-3 top-14 bottom-20 z-50" style={{ width }} data-testid="studio-workbench-side-shell">
        <ServiceWorkbenchHost
          serviceId={`studio-stage-${stageId}`}
          icon={<StageIcon aria-hidden="true" />}
          title={title}
          subtitle={description}
          locale={locale}
          mode="side"
          onModeChange={onModeChange}
          onClose={onClose}
          onResize={onResize}
          minWidth={380}
          maxWidth={900}
          testId={`studio-workbench-${stageId}`}
          toolSelector={toolSelector}
          footer={footer}
        >
          {body}
        </ServiceWorkbenchHost>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-3 top-14 bottom-20 z-50" data-testid="studio-workbench-expanded-shell">
      <ServiceWorkbenchHost
        serviceId={`studio-stage-${stageId}`}
        icon={<StageIcon aria-hidden="true" />}
        title={title}
        subtitle={description}
        locale={locale}
        mode="expanded"
        onModeChange={onModeChange}
        onClose={onClose}
        testId={`studio-workbench-${stageId}-expanded`}
        toolSelector={toolSelector}
        footer={footer}
      >
        {body}
      </ServiceWorkbenchHost>
    </div>
  );
}