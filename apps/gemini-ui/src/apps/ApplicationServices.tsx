/**
 * Twelve application services. Cards are navigation into measured workspaces;
 * no card claims a capability the native bridge did not report.
 */
import React from 'react';
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
import { DOMAIN_SERVICES_META, SERVICE_ACCENTS } from './catalog';
import type { DomainServiceKey } from './catalog';
import type { ApplicationsController } from './useApplications';

interface ApplicationServicesProps {
  locale: AppsLocale;
  controller: ApplicationsController;
  selectedCount: number;
  onOpenService: (service: DomainServiceKey) => void;
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

function fallbackState(key: DomainServiceKey): 'available' | 'partial' | 'gated' {
  if (key === 'app-inventory' || key === 'app-identity' || key === 'app-search') return 'available';
  if (key === 'app-uninstall-queue') return 'gated';
  return 'partial';
}

export const ApplicationServices: React.FC<ApplicationServicesProps> = ({
  locale,
  controller,
  selectedCount,
  onOpenService,
}) => {
  const capabilityMap = new Map((controller.capabilities?.services || []).map((service) => [service.id, service]));
  const measuredCount = Object.keys(controller.sizes).length;

  return (
    <section className="apps-panel apps-services" data-testid="apps-services" aria-labelledby="apps-services-title">
      <header className="apps-panel-head">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 id="apps-services-title" className="apps-panel-title">
              {t(locale, 'Application service workspaces', 'مساحات خدمات التطبيقات')}
            </h2>
          </div>
          <p className="apps-panel-sub">
            {t(
              locale,
              'Twelve measured specialisations over the same inventory. Partial and gated states are explicit.',
              'اثنتا عشرة تخصصًا مقيسًا على الجرد نفسه. الحالات الجزئية والمقيّدة معلنة.'
            )}
          </p>
        </div>
        <span className="apps-chip">
          {t(locale, 'footprints measured', 'بصمات مقيسة')}: {formatCount(measuredCount)}
        </span>
      </header>

      <div className="apps-service-grid">
        {DOMAIN_SERVICES_META.map((service) => {
          const capability = capabilityMap.get(service.key);
          const state = capability?.state || fallbackState(service.key);
          const accent = SERVICE_ACCENTS[service.key];
          return (
            <button
              key={service.key}
              type="button"
              data-testid={`apps-service-${service.key}`}
              className="apps-service-card"
              onClick={() => onOpenService(service.key)}
              title={capability ? `${capability.provider} — ${locale === 'ar' ? capability.noteAr : capability.noteEn}` : serviceTitle(service.key, locale)}
            >
              <span
                className="apps-service-icon"
                style={{ color: accent, borderColor: `${accent}55`, background: `${accent}18` }}
              >
                {serviceIcon(service.key)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="apps-service-title">{serviceTitle(service.key, locale)}</span>
                <span className="apps-service-sub" title={serviceSummary(service.key, controller, selectedCount, locale)}>
                  {serviceSummary(service.key, controller, selectedCount, locale)}
                </span>
              </span>
              <span className={`apps-state apps-state-${state}`}>{serviceStateLabel(state, locale)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
