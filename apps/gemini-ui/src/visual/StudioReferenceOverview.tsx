import React from 'react';
import { ArrowRight, Archive, Box, Check, ChevronRight, CircleHelp, Clock3, FileText, Folder, FolderOpen, History, Image, Layers3, ListChecks, Music, Plus, Rocket, ScanEye, ShieldCheck, SlidersHorizontal, Sparkles, Video, Workflow } from 'lucide-react';
import { useStudio } from '../studio/context';
import { renderCategoryIcon } from '../studio/parts';
import type { StudioStageId } from '../studio/types';
import { ReferenceAtmosphere } from './ReferenceAtmosphere';
import { OrbitalControl } from './OrbitalControl';

export function StudioReferenceOverview({ onOpen }: { onOpen: (id: StudioStageId) => void }) {
  const s = useStudio();
  const ar = s.locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const categories = ['document','image','video','audio','application','archive'].map(key => s.categories.find(c => c.key === key)).filter(Boolean);
  const actions = [
    { id: 1, icon: FolderOpen, label: t('Sources','المصادر') }, { id: 2, icon: Image, label: t('Visual Library','المكتبة المرئية') },
    { id: 7, icon: Rocket, label: t('Execution','التنفيذ') }, { id: 3, icon: Layers3, label: t('Collections','المجموعات') },
    { id: 6, icon: FileText, label: t('Plan Review','مراجعة الخطة') }, { id: 5, icon: Folder, label: t('Destinations','الوجهات') },
  ];
  const addSource = () => s.native.available ? void s.addNativeSource() : onOpen(1);
  return <div className="knx-studio-reference" data-testid="studio-reference-overview">
    <ReferenceAtmosphere />
    <div className="knx-studio-reference-grid">
      <div className="knx-ref-column knx-ref-left">
        <header className="knx-ref-intro">
          <span className="knx-ref-section-tag"><LayoutIcon />{t('ORGANIZATION STUDIO','استوديو التنظيم')}</span>
          <h1>{t('Organize with Clarity.','نظّم عالمك بوضوح.')}</h1>
          <p>{t('Thoughtful organization starts here. Bring your files together, find the right structure, and preview every change.','ابدأ تنظيمًا مدروسًا. اجمع ملفاتك، واختر هيكلها المناسب، وراجع كل تغيير.')}</p>
          <div className="knx-ref-values"><span><Sparkles/>{t('Understand','افهم')}<small>{t('Your Content','محتواك')}</small></span><span><Workflow/>{t('Smart','تصنيف')}<small>{t('Categorization','ذكي')}</small></span><span><ShieldCheck/>{t('Preview','المعاينة')}<small>{t('Before Changes','قبل التغيير')}</small></span></div>
        </header>
        <section className="knx-ref-card knx-ref-sources">
          <div className="knx-ref-card-head"><h2><FolderOpen/>{t('Your Sources','مصادرك')}</h2><button className="knx-ref-pill" onClick={addSource}><Plus/>{t('Add Source','إضافة مصدر')}</button></div>
          <div className="knx-ref-source-list">{s.authorizedSources.map((source,i) => <button key={source.id} className="knx-ref-source" onClick={() => onOpen(1)}>
            <span className="knx-ref-checkbox"><Check/></span><span className={`knx-ref-file-icon tone-${i % 4}`}><FolderOpen/></span>
            <span className="knx-ref-source-name"><strong>{source.path.split(/[\\/]/).filter(Boolean).at(-1) || source.path}</strong><small dir="ltr">{source.path}</small></span>
            <span className="knx-ref-source-count">{source.fileCount.toLocaleString()}<small>{t('files','ملف')}</small></span><ChevronRight/>
          </button>)}</div>
          <button className="knx-ref-add" onClick={addSource}><Plus/><Folder/>{t('Add Folder','إضافة مجلد')}<span>{t('Choose locations for analysis','اختر نطاق التحليل')}</span></button>
          <div className="knx-ref-source-status"><span className="knx-ref-dot"/>{s.native.mode === 'measured' ? t('Measured source inventory','جرد مصادر مقيس') : t('Design fixture · not your device','بيانات تصميم تجريبية · ليست لجهازك')}</div>
        </section>
        <section className="knx-ref-card knx-ref-library"><div className="knx-ref-card-head"><h2><Image/>{t('Visual Library','المكتبة المرئية')}</h2><button onClick={() => onOpen(2)}>{t('View All','عرض الكل')}<ChevronRight/></button></div>
          <button className="knx-ref-gallery" onClick={() => onOpen(2)} aria-label={t('Open visual library','فتح المكتبة المرئية')}>
            {s.files.filter(f => f.thumbnailUrl).slice(0,6).map(f => <span key={f.id} className="knx-ref-thumbnail"><Image/><img src={f.thumbnailUrl} alt={f.name} onError={e => { e.currentTarget.style.display = 'none'; }} /></span>)}
            {!s.files.some(f => f.thumbnailUrl) && <span className="knx-ref-empty"><Image/>{t('Choose a source to explore your library','اختر مصدرًا لاستكشاف مكتبتك')}</span>}
          </button>
        </section>
      </div>
      <div className="knx-ref-column knx-ref-center">
        <section className="knx-reference-orbit" aria-label={t('Organization tools','أدوات التنظيم')}>
          <OrbitalControl
            title={t('Build Organization Plan','بناء خطة التنظيم')}
            subtitle={t('Analyze · Organize · Preview','حلّل · نظّم · عاين')}
            onActivate={() => onOpen(6)}
            eyebrow={t('Organization Studio tools','أدوات استوديو التنظيم')}
            tools={actions.map((a, i) => ({
              id: String(a.id),
              label: a.label,
              icon: a.icon,
              active: a.id === 6,
              onClick: () => onOpen(a.id as StudioStageId),
              tone: (['violet', 'blue', 'teal', 'amber', 'emerald', 'rose'] as const)[i % 6],
            }))}
          />
        </section>
        <section className="knx-ref-card knx-ref-categories"><div className="knx-ref-card-head"><h2><Layers3/>{t('Category Suggestions','اقتراحات التصنيف')}</h2><button className="knx-ref-pill" onClick={() => onOpen(3)}><SlidersHorizontal/>{t('Customize','تخصيص')}</button></div>
          <div className="knx-ref-category-grid">{categories.map((category,i) => category && <button key={category.key} className="knx-ref-category" onClick={() => { s.setSelectedCategoryKey(category.key); onOpen(2); }}>
            <span className={`knx-ref-file-icon tone-${i}`}>{renderCategoryIcon(category.iconName)}</span><div><strong>{ar ? category.labelAr : category.labelEn}</strong><small>{category.fileCount.toLocaleString()} {t('files','ملف')}</small></div>
            <span className="knx-ref-extension-list">{category.defaultExtensions.slice(0,3).map(ext => <i key={ext}>{ext}</i>)}</span>
          </button>)}</div>
        </section>
        <section className="knx-ref-card knx-ref-rules"><div className="knx-ref-card-head"><h2><Workflow/>{t('Smart Rule Builder','منشئ القواعد الذكي')}</h2><button onClick={() => onOpen(4)}>{t('All options','كل الخيارات')}<ChevronRight/></button></div>
          <label><span>{t('Group by','التجميع')}</span><select value={s.groupingRule.groupBy} onChange={e => s.setGroupingRule(p => ({ ...p, groupBy: e.target.value as typeof p.groupBy }))}><option value="category">{t('File category','نوع الملف')}</option><option value="extension">{t('Extension','الامتداد')}</option><option value="capture_date">{t('Capture date','تاريخ الالتقاط')}</option><option value="size">{t('File size','حجم الملف')}</option><option value="project">{t('Project','المشروع')}</option></select><ArrowRight/><button onClick={() => onOpen(5)}><Folder/>{t('Destination','الوجهة')}</button></label>
          <label><span>{t('Naming','التسمية')}</span><select value={s.namingRule.strategy} onChange={e => s.setNamingRule(p => ({ ...p, strategy: e.target.value as typeof p.strategy }))}><option value="original">{t('Keep original name','الاسم الأصلي')}</option><option value="date_prefix">{t('Date prefix','بادئة التاريخ')}</option><option value="kebab_case">kebab-case</option><option value="custom_pattern">{t('Custom pattern','نمط مخصص')}</option></select><ArrowRight/><button onClick={() => onOpen(4)}><SlidersHorizontal/>{t('Options','الخيارات')}</button></label>
          <button className="knx-ref-add knx-ref-add-rule" onClick={() => onOpen(4)}><Plus/>{t('Configure Rules','ضبط القواعد')}</button>
        </section>
      </div>
      <aside className="knx-ref-column knx-ref-right">
        <section className="knx-ref-card knx-ref-plan"><div className="knx-ref-card-head"><h2>{t('Organization Plan','خطة التنظيم')}</h2><span className="knx-ref-status"><span className="knx-ref-dot"/>{t('Preview','معاينة')}</span></div>
          <div className="knx-ref-plan-kpis"><span><span className="knx-ref-file-icon"><Folder/></span><strong>{s.inventory.totalFiles.toLocaleString()}<small>{t('Files indexed','ملف مفهرس')}</small></strong></span><span><ScanEye/><strong>{s.native.plan ? s.native.plan.collisions.length : '—'}<small>{t('Plan conflicts','تعارضات الخطة')}</small></strong></span></div>
          <div className="knx-ref-destination-heading">{t('Destination Structure','هيكل الوجهة')}</div>
          <div className="knx-ref-destination-tree">{categories.map((category,i) => category && <button key={category.key} onClick={() => onOpen(5)}><span className={`knx-ref-folder tone-${i}`}><Folder fill="currentColor"/></span><strong>{ar ? category.labelAr : category.labelEn}</strong><span>{category.fileCount.toLocaleString()}</span><ChevronRight/></button>)}</div>
          <div className="knx-ref-safe-pair"><div><ShieldCheck/><strong>{t('Read-only','قراءة فقط')}</strong><small>{t('No file changes from analysis','التحليل لا يغيّر ملفاتك')}</small></div><div><ScanEye/><strong>{t('Preview First','المعاينة أولاً')}</strong><small>{t('Review each planned change','راجع كل تغيير مقترح')}</small></div></div>
          <button className="knx-ref-primary" onClick={() => onOpen(6)}>{t('Build Organization Plan','بناء خطة التنظيم')}<span><ArrowRight/></span></button>
          <p className="knx-ref-plan-note">{t('Preview only. File execution and undo are unavailable in this build.','معاينة فقط. تنفيذ تغييرات الملفات والتراجع غير متاحين في هذا البناء.')}</p>
        </section>
        <section className="knx-ref-card knx-ref-recent"><div className="knx-ref-card-head"><h2><FileText/>{t('Recent Plans','الخطط الأخيرة')}</h2><button onClick={() => onOpen(8)}>{t('View All','عرض الكل')}<ChevronRight/></button></div>
          {s.native.previewHistory.length ? <button className="knx-ref-history-row" onClick={() => onOpen(8)}><FileText/><span><strong>{t('Saved preview receipts','إيصالات المعاينة المحفوظة')}</strong><small>{s.native.previewHistory.length} {t('previews · no execution','معاينة · دون تنفيذ')}</small></span><ChevronRight/></button> : <div className="knx-ref-empty"><ListChecks/><strong>{t('Your next plan starts here','خطتك التالية تبدأ هنا')}</strong><small>{t('Reviewed previews will appear here.','ستظهر المعاينات المحفوظة هنا.')}</small></div>}
        </section>
        <section className="knx-ref-card knx-ref-history"><div className="knx-ref-card-head"><h2><History/>{t('History & Undo','السجل والتراجع')}</h2><button onClick={() => onOpen(8)}><ChevronRight/></button></div><div className="knx-ref-empty"><Clock3/><strong>{t('No executed operations','لا توجد عمليات منفذة')}</strong><small>{t('Nothing has been moved or deleted.','لم يُنقل أو يُحذف أي ملف.')}</small></div></section>
      </aside>
    </div>
  </div>;
}

function LayoutIcon() { return <Layers3 size={15}/>; }
