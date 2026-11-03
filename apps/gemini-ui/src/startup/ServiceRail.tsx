/**
 * Twelve Boot Control service workspaces. Every card navigates to measured
 * evidence; no card claims a mutation channel that does not exist.
 */
import React from 'react';
import {CompactServiceDock} from '../components/workbench/CompactServiceDock';
import {
  Activity,
  CalendarClock,
  Clock3,
  Cpu,
  FileCheck2,
  FolderTree,
  Gauge,
  Layers,
  ListFilter,
  PowerOff,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type { StartupController } from './useStartup';
import {
  SERVICE_FALLBACK_META,
  SERVICE_IDS,
  formatCount,
  serviceStateLabel,
  t,
} from './model';
import type { StartupLocale, StartupServiceId } from './model';

export interface ServiceRailProps {
  locale: StartupLocale;
  controller: StartupController;
  selectedCount: number;
  onOpenService: (service: StartupServiceId) => void;
  selectedService?:StartupServiceId|null;
}

export function serviceIcon(key: StartupServiceId, className = 'w-3.5 h-3.5') {
  switch (key) {
    case 'startup-overview': return <Layers className={className} />;
    case 'startup-disable': return <PowerOff className={className} />;
    case 'startup-restore': return <RotateCcw className={className} />;
    case 'startup-sources': return <FolderTree className={className} />;
    case 'startup-journal': return <FileCheck2 className={className} />;
    case 'startup-filter': return <ListFilter className={className} />;
    case 'startup-impact': return <Gauge className={className} />;
    case 'startup-services': return <Cpu className={className} />;
    case 'startup-tasks': return <CalendarClock className={className} />;
    case 'startup-delay': return <Clock3 className={className} />;
    case 'startup-batch': return <Sparkles className={className} />;
    case 'startup-undo-all': return <ShieldAlert className={className} />;
    default: return <Activity className={className} />;
  }
}

function measuredSummary(
  key: StartupServiceId,
  controller: StartupController,
  selectedCount: number,
  locale: StartupLocale
): string {
  const { inventory, impact, journal, sessions, plan } = controller;
  const summary = inventory?.summary;
  const fallback = SERVICE_FALLBACK_META[key][locale === 'ar' ? 'descAr' : 'descEn'];

  switch (key) {
    case 'startup-overview':
      return summary
        ? `${formatCount(summary.total)} ${t(locale, 'autoruns', 'مدخل بدء')} · ${formatCount(summary.registry)} ${t(locale, 'registry', 'تسجيل')}`
        : fallback;
    case 'startup-disable':
      return plan && (plan.mode === 'disable' || plan.mode === 'enable')
        ? `${formatCount(plan.itemCount)} ${t(locale, 'staged item(s)', 'عنصرًا مُهيَّأ')} · ${t(locale, 'gated', 'محجوب')}`
        : selectedCount
          ? `${formatCount(selectedCount)} ${t(locale, 'selected for review', 'محدد للمراجعة')}`
          : fallback;
    case 'startup-restore':
      return journal
        ? (journal.entries.length
          ? `${formatCount(journal.entries.length)} ${t(locale, 'journal entries', 'مدخل سجل')}`
          : t(locale, 'No change to restore', 'لا يوجد تغيير للاستعادة'))
        : fallback;
    case 'startup-sources':
      return inventory?.coverage
        ? `${formatCount(inventory.coverage.registryKeys)} ${t(locale, 'keys', 'مفتاح')} · ${formatCount(inventory.coverage.startupFolders)} ${t(locale, 'folders', 'مجلد')}`
        : fallback;
    case 'startup-journal':
      return journal
        ? t(locale, 'Empty append-only journal', 'سجل إضافي فارغ')
        : fallback;
    case 'startup-filter':
      return summary
        ? `${formatCount(summary.total)} ${t(locale, 'queryable entries', 'مدخلًا قابلًا للاستعلام')}`
        : fallback;
    case 'startup-impact':
      return impact
        ? (impact.available
          ? `${formatCount(impact.events.length)} ${t(locale, 'measured boot events', 'حدث إقلاع مقيس')}`
          : t(locale, 'Boot diagnostics unavailable', 'تشخيص الإقلاع غير متاح'))
        : fallback;
    case 'startup-services':
      return inventory?.services.length
        ? `${formatCount(inventory.services.length)} ${t(locale, 'boot services', 'خدمة إقلاع')}`
        : fallback;
    case 'startup-tasks':
      return inventory?.tasks.length
        ? `${formatCount(inventory.tasks.length)} ${t(locale, 'logon tasks', 'مهمة دخول')}`
        : fallback;
    case 'startup-delay':
      return plan?.mode === 'delay'
        ? `${formatCount(plan.itemCount)} ${t(locale, 'delay drafts', 'مسودة تأخير')}`
        : selectedCount
          ? `${formatCount(selectedCount)} ${t(locale, 'selected for delay', 'محدد للتأخير')}`
          : fallback;
    case 'startup-batch':
      return plan?.mode === 'batch'
        ? `${formatCount(plan.itemCount)} ${t(locale, 'batched item(s)', 'عنصرًا في الدفعة')}`
        : selectedCount
          ? `${formatCount(selectedCount)} ${t(locale, 'queued for batch', 'في قائمة الدفعة')}`
          : fallback;
    case 'startup-undo-all':
      return sessions
        ? t(locale, 'No batch session exists', 'لا توجد جلسة دفعة')
        : fallback;
    default:
      return fallback;
  }
}

export function ServiceRail({locale,controller,selectedCount,onOpenService,selectedService=null}:ServiceRailProps){
 return <div className="startup-compact-dock" data-testid="startup-services"><CompactServiceDock testIdPrefix="startup" isArabic={locale==='ar'} label={t(locale,'Startup services','خدمات بدء التشغيل')} selectedId={selectedService} onSelect={id=>onOpenService(id as StartupServiceId)} items={SERVICE_IDS.map(id=>{const c=controller.capabilities?.services.find(x=>x.id===id),m=SERVICE_FALLBACK_META[id];return{id,label:c?(locale==='ar'?c.labelAr:c.labelEn):(locale==='ar'?m.titleAr:m.titleEn),icon:serviceIcon(id),capability:!controller.nativeAvailable?t(locale,'Native unavailable','Native غير متاح'):c?serviceStateLabel(c.state,locale):t(locale,'Reading capabilities','قراءة القدرات'),result:measuredSummary(id,controller,selectedCount,locale),hint:c?(c.provider+' · '+(locale==='ar'?c.noteAr:c.noteEn)):measuredSummary(id,controller,selectedCount,locale)}})}/></div>;
}
