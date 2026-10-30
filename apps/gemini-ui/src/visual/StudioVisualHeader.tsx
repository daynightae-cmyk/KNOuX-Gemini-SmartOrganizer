import React from 'react';
import { FolderOpen, Images, Workflow, ScanEye, History, ShieldCheck } from 'lucide-react';
import { useStudio } from '../studio/context';
import { OrbitalControl } from './OrbitalControl';
import { ServicePipeline } from './ServicePipeline';
import type { StudioStageId } from '../studio/types';

export function StudioVisualHeader() {
  const { locale, activeStageId, setActiveStageId, native } = useStudio();
  const ar = locale === 'ar';
  const tools = [
    { id: 1, label: ar ? 'المصادر' : 'Sources', icon: FolderOpen },
    { id: 2, label: ar ? 'المكتبة' : 'Library', icon: Images },
    { id: 4, label: ar ? 'القواعد' : 'Rules', icon: Workflow },
    { id: 6, label: ar ? 'المعاينة' : 'Preview', icon: ScanEye },
    { id: 8, label: ar ? 'السجل' : 'History', icon: History },
  ];
  return <section className="knx-studio-hero">
    <div className="knx-hero-copy">
      <div className="knx-eyebrow">KNOuX / {ar ? 'استوديو التنظيم' : 'ORGANIZATION STUDIO'}</div>
      <h1>{ar ? 'رتّب عالمك.' : 'Organize with'} <em>{ar ? 'بوضوح.' : 'clarity.'}</em></h1>
      <p>{ar ? 'من ملفات متفرقة إلى مساحة منظمة. اختر مصادرك، صمّم قواعدك وراجع كل خطوة.' : 'A place for everything. Bring your sources together, shape your rules, and see every change before it happens.'}</p>
      <ServicePipeline
        locale={ar ? 'ar' : 'en'}
        accent="violet"
        testId="studio-pipeline"
        flow="right"
        live={native.scanning || native.planLoading}
        onSelect={id => setActiveStageId(({source:1,classify:2,plan:4,review:6,execute:7,verify:8,undo:8} as Record<string,StudioStageId>)[id])}
        caption={native.available ? (ar ? 'المصدر الأصلي جاهز · لا نقل بدون خطة معتمدة' : 'Native source ready · nothing moves without an approved plan') : (ar ? 'معاينة تصميم · لا توجد بيانات ملفات حية' : 'Design preview · no live file data')}
        stages={[
          { id: 'source', label: ar ? 'المصدر' : 'Source', state: native.mode === 'measured' && native.sourceId ? 'complete' : 'pending' },
          { id: 'classify', label: ar ? 'التصنيف' : 'Classify', state: native.error ? 'failed' : native.scanning ? 'active' : native.mode === 'measured' && native.progress ? 'partial' : 'pending' },
          { id: 'plan', label: ar ? 'الخطة' : 'Plan', state: native.planError ? 'failed' : native.planLoading ? 'active' : native.plan ? 'complete' : 'pending' },
          { id: 'review', label: ar ? 'المراجعة' : 'Review', detail: ar ? 'معاينة' : 'Preview', state: native.plan ? 'partial' : 'pending' },
          { id: 'execute', label: ar ? 'التنفيذ' : 'Execute', state: 'gated' },
          { id: 'verify', label: ar ? 'التحقق' : 'Verify', state: 'pending' },
          { id: 'undo', label: ar ? 'التراجع' : 'Undo', state: 'pending' },
        ]}
      />
      <div className="knx-hero-assurance"><ShieldCheck size={17} />{ar ? 'المعاينة أولاً · لا تغييرات تلقائية' : 'Preview first · Your files stay in your control'}</div>
      <span className="knx-source-pill">{native.available ? (ar ? 'مصدر أصلي · قراءة فقط' : 'Native source · Read only') : (ar ? 'معاينة تجريبية · لا توجد بيانات حية' : 'Design preview · No live file data')}</span>
    </div>
    <OrbitalControl title={ar ? 'بناء خطة التنظيم' : 'Build Organization Plan'} subtitle={ar ? 'تحليل · تنظيم · معاينة' : 'Discover · Organize · Preview'} onActivate={() => setActiveStageId(6)}
      tools={tools.map(tool => ({ ...tool, id: String(tool.id), active: activeStageId === tool.id, onClick: () => setActiveStageId(tool.id as StudioStageId) }))} />
  </section>;
}
