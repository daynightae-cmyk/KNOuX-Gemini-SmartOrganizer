import React from 'react';
import { FolderOpen, Images, Workflow, ScanEye, History, ShieldCheck } from 'lucide-react';
import { useStudio } from '../studio/context';
import { OrbitalControl } from './OrbitalControl';
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
      <div className="knx-hero-assurance"><ShieldCheck size={17} />{ar ? 'المعاينة أولاً · لا تغييرات تلقائية' : 'Preview first · Your files stay in your control'}</div>
      <span className="knx-source-pill">{native.available ? (ar ? 'مصدر أصلي · قراءة فقط' : 'Native source · Read only') : (ar ? 'معاينة تجريبية · لا توجد بيانات حية' : 'Design preview · No live file data')}</span>
    </div>
    <OrbitalControl title={ar ? 'بناء خطة التنظيم' : 'Build Organization Plan'} subtitle={ar ? 'تحليل · تنظيم · معاينة' : 'Discover · Organize · Preview'} onActivate={() => setActiveStageId(6)}
      tools={tools.map(tool => ({ ...tool, id: String(tool.id), active: activeStageId === tool.id, onClick: () => setActiveStageId(tool.id as StudioStageId) }))} />
  </section>;
}
