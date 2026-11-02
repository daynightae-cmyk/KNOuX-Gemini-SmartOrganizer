/**
 * Twelve application services. Cards are navigation into measured workspaces;
 * no card claims a capability the native bridge did not report.
 */
import React from 'react';
import {CompactServiceDock} from '../components/workbench/CompactServiceDock';
import {
  Building2,
  Clock,
  Database,
  LayoutGrid,
  Link2,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import type { AppsLocale } from './model';
import {
  formatCount,
  serviceStateLabel,
  serviceTitle,
  t,
} from './model';
import { DOMAIN_SERVICES_META } from './catalog';
import type { DomainServiceKey } from './catalog';
import type { ApplicationsController } from './useApplications';

interface ApplicationServicesProps {
  locale: AppsLocale;
  controller: ApplicationsController;
  selectedCount: number;
  onOpenService: (service: DomainServiceKey) => void;
  selectedService?:DomainServiceKey|null;
}

export function serviceIcon(key: DomainServiceKey, className = 'w-3.5 h-3.5') {
  switch (key) {
    case 'app-inventory': return <LayoutGrid className={className} />;
    case 'app-identity': return <ShieldCheck className={className} />;
    case 'app-search': return <Search className={className} />;
    case 'app-publisher': return <Building2 className={className} />;
    case 'app-recent': return <Clock className={className} />;
    case 'app-uninstall-queue': return <Trash2 className={className} />;
    case 'app-leftovers': return <Sparkles className={className} />;
    case 'app-updates': return <RefreshCw className={className} />;
    case 'app-size': return <Database className={className} />;
    case 'app-store-packages': return <Package className={className} />;
    case 'app-associations': return <Link2 className={className} />;
    case 'app-startup-impact': return <Zap className={className} />;
    default: return <Sparkles className={className} />;
  }
}

function serviceSummary(
  key: DomainServiceKey,
  controller: ApplicationsController,
  selectedCount: number,
  locale: AppsLocale
): string {
  const { inventory, leftovers, updates, associations, sizes, signatures, capabilities } = controller;
  const kpis = inventory?.kpis;
  switch (key) {
    case 'app-inventory':
      return kpis ? `${formatCount(kpis.installed)} ${t(locale, 'measured apps', 'تطبيقًا مقيسًا')}` : t(locale, 'Not read', 'لم يُقرأ');
    case 'app-identity':
      return `${formatCount(Object.keys(signatures).length)} ${t(locale, 'verified this session', 'تم التحقق منها في هذه الجلسة')}`;
    case 'app-search':
      return kpis ? `${formatCount(kpis.installed)} ${t(locale, 'searchable records', 'سجلًا قابلًا للبحث')}` : t(locale, 'Not read', 'لم يُقرأ');
    case 'app-publisher':
      return kpis ? `${formatCount(kpis.publishers)} ${t(locale, 'measured publishers', 'ناشرًا مقيسًا')}` : t(locale, 'Not read', 'لم يُقرأ');
    case 'app-recent':
      return kpis ? `${formatCount(kpis.installed)} ${t(locale, 'dated records', 'سجلًا مؤرخًا')}` : t(locale, 'Not read', 'لم يُقرأ');
    case 'app-uninstall-queue':
      return selectedCount
        ? `${formatCount(selectedCount)} ${t(locale, 'selected for review', 'محدد للمراجعة')}`
        : t(locale, 'Execution gated to Mission 08', 'التنفيذ محجوب للمهمة 08');
    case 'app-leftovers':
      return leftovers
        ? `${formatCount(leftovers.staleCount)} ${t(locale, 'stale', 'قديم')} · ${formatCount(leftovers.candidateCount)} ${t(locale, 'candidates', 'مرشحًا')}`
        : t(locale, 'Candidates not measured', 'لم تُقس المرشحات');
    case 'app-updates':
      if (!updates) return t(locale, 'WinGet not queried', 'لم يُستعلم WinGet');
      if (updates.status === 'available') return `${formatCount(updates.items.length)} ${t(locale, 'measured updates', 'تحديثًا مقيسًا')}`;
      return updates.status === 'not-checked'
        ? t(locale, 'WinGet ready, not queried', 'WinGet جاهز، لم يُستعلم')
        : updates.status;
    case 'app-size':
      return kpis
        ? `${formatCount(kpis.measuredFootprintApps)} / ${formatCount(kpis.installed)} ${t(locale, 'footprints measured', 'بصمة مقيسة')}`
        : t(locale, 'Not measured', 'لم تُقس');
    case 'app-store-packages':
      return kpis ? `${formatCount(kpis.packaged)} ${t(locale, 'measured packages', 'حزمة مقيسة')}` : t(locale, 'Not read', 'لم يُقرأ');
    case 'app-associations':
      return associations
        ? `${formatCount(associations.extensions.length + associations.protocols.length)} ${t(locale, 'associations sampled', 'ارتباطًا في العينة')}`
        : t(locale, 'Sample not read', 'لم تُقرأ العينة');
    case 'app-startup-impact':
      return kpis
        ? `${formatCount(kpis.startupLinked)} ${t(locale, 'apps linked', 'تطبيقًا مرتبطًا')}`
        : t(locale, 'Not read', 'لم يُقرأ');
    default:
      return capabilities?.services.find((entry) => entry.id === key)?.noteEn || '';
  }
}

export const ApplicationServices: React.FC<ApplicationServicesProps> = ({
  locale,
  controller,
  selectedCount,
  onOpenService,
  selectedService=null,
}) => {
  return <div className="apps-compact-dock" data-testid="apps-services"><CompactServiceDock testIdPrefix="apps" label={t(locale,'Application services','خدمات التطبيقات')} isArabic={locale==='ar'} selectedId={selectedService} onSelect={id=>onOpenService(id as DomainServiceKey)} items={DOMAIN_SERVICES_META.map(service=>{const capability=controller.capabilities?.services.find(entry=>entry.id===service.key);return{id:service.key,label:serviceTitle(service.key,locale),icon:serviceIcon(service.key),capability:!controller.nativeAvailable?t(locale,'Native unavailable','Native غير متاح'):capability?serviceStateLabel(capability.state,locale):t(locale,'Checking capabilities','جارٍ قراءة القدرات'),result:serviceSummary(service.key,controller,selectedCount,locale),hint:capability?`${capability.provider} · ${locale==='ar'?capability.noteAr:capability.noteEn}`:serviceTitle(service.key,locale)}})}/></div>;
};
