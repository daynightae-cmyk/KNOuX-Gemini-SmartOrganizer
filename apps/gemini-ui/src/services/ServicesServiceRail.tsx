import React from 'react';
import { CompactServiceDock } from '../components/workbench/CompactServiceDock';
import type { ServicesLocale } from './catalog';
import { SERVICES_TOOLS, TOOL_BY_ID } from './catalog';
import { formatCount, t } from './model';
import type { ServicesController } from './useServices';

/**
 * Twelve measured Service Commander selectors rendered through the shared
 * CompactServiceDock, so Services uses the same inner-workspace selection
 * pattern as the integrated domains.
 *
 * Selection only: the capability chip comes from the live ServicesCapabilities
 * contract and the result string comes from the measured SCM snapshot or live
 * plan/journal state. Nothing is invented and nothing executes a service.
 */
export interface ServicesServiceRailProps {
  locale: ServicesLocale;
  controller: ServicesController;
  selectedTool: string | null;
  onOpenTool: (id: string) => void;
  actions?: React.ReactNode;
}

const STATE_LABEL: Record<'available' | 'partial' | 'gated', { en: string; ar: string }> = {
  available: { en: 'Measured', ar: 'مقيس' },
  partial: { en: 'Partial provider', ar: 'مزود جزئي' },
  gated: { en: 'Preview only', ar: 'معاينة فقط' },
};

function capabilityLabel(id: string, c: ServicesController, locale: ServicesLocale): string {
  if (!c.nativeAvailable) return t(locale, 'Native unavailable', 'Native غير متاح');
  const capability = c.capabilities?.services.find((entry) => entry.id === id);
  if (capability) {
    const label = STATE_LABEL[capability.state];
    return locale === 'ar' ? label.ar : label.en;
  }
  const fallback = TOOL_BY_ID[id as keyof typeof TOOL_BY_ID]?.state;
  if (!fallback) return t(locale, 'Reading capabilities', 'قراءة القدرات');
  const label = STATE_LABEL[fallback];
  return locale === 'ar' ? label.ar : label.en;
}

/** Measured evidence per tool id. Returns undefined when nothing is measured yet. */
function measuredSummary(id: string, c: ServicesController, locale: ServicesLocale): string | undefined {
  const snapshot = c.snapshot;
  const unmeasured = t(locale, 'Not measured', 'غير مقيس');
  switch (id) {
    case 'services-inventory':
      return snapshot
        ? `${formatCount(snapshot.summary.total)} ${t(locale, 'services', 'خدمة')} · ${formatCount(snapshot.summary.running)} ${t(locale, 'running', 'تعمل')}`
        : unmeasured;
    case 'services-control':
      return c.plan
        ? t(locale, 'Immutable preview staged', 'معاينة ثابتة مُهيأة')
        : t(locale, 'Exact plan required', 'خطة محددة مطلوبة');
    case 'services-undo':
      return `${formatCount(c.journal.length)} ${t(locale, 'journal entries', 'مدخل سجل')}`;
    case 'services-dependencies':
      return snapshot
        ? `${formatCount(snapshot.edges.length)} ${t(locale, 'measured edges', 'حافة مقيسة')}`
        : unmeasured;
    case 'services-protected':
      return snapshot
        ? `${formatCount(snapshot.summary.protected)} ${t(locale, 'denied by policy', 'مرفوضة بالسياسة')}`
        : unmeasured;
    case 'services-search':
      return snapshot
        ? `${formatCount(snapshot.services.length)} ${t(locale, 'searchable rows', 'صف قابل للبحث')}`
        : unmeasured;
    case 'services-startup-report':
      return snapshot
        ? `${formatCount(snapshot.summary.automatic)} ${t(locale, 'automatic', 'تلقائي')} · ${formatCount(snapshot.summary.delayed)} ${t(locale, 'delayed', 'مؤجل')}`
        : unmeasured;
    case 'services-state-history':
      return snapshot
        ? `${formatCount(snapshot.events.length)} ${t(locale, 'events', 'حدث')} · ${snapshot.eventCoverage.status}`
        : unmeasured;
    case 'services-dependents':
      return snapshot
        ? `${formatCount(snapshot.edges.length)} ${t(locale, 'reverse edges', 'حافة عكسية')}`
        : unmeasured;
    case 'services-diagnose':
      return snapshot
        ? `${formatCount(snapshot.events.length)} ${t(locale, 'SCM events', 'حدث SCM')}`
        : unmeasured;
    case 'services-config':
      return c.plan
        ? t(locale, 'Policy diff preview staged', 'معاينة فرق السياسة مُهيأة')
        : t(locale, 'Diff preview only', 'معاينة فرق فقط');
    case 'services-perf':
      return snapshot
        ? `${formatCount(snapshot.svchost.length)} ${t(locale, 'shared hosts', 'مضيف مشترك')}`
        : unmeasured;
    default:
      return undefined;
  }
}

export function ServicesServiceRail({ locale, controller, selectedTool, onOpenTool, actions }: ServicesServiceRailProps) {
  const items = SERVICES_TOOLS.map((entry) => {
    const Icon = entry.icon;
    const capability = controller.capabilities?.services.find((service) => service.id === entry.id);
    return {
      id: entry.id,
      label: locale === 'ar' ? entry.shortAr : entry.shortEn,
      icon: Icon ? <Icon aria-hidden="true" /> : null,
      capability: capabilityLabel(entry.id, controller, locale),
      result: measuredSummary(entry.id, controller, locale),
      hint: capability
        ? `${capability.provider} · ${locale === 'ar' ? capability.noteAr : capability.noteEn}`
        : locale === 'ar'
          ? entry.blurbAr
          : entry.blurbEn,
    };
  });

  const label = t(locale, 'Service Commander tools', 'أدوات قائد الخدمات');

  return (
    <div className="svc-compact-dock" data-testid="services-services">
      <CompactServiceDock
        testIdPrefix="services"
        isArabic={locale === 'ar'}
        label={label}
        selectedId={selectedTool}
        onSelect={onOpenTool}
        items={items}
        actions={actions}
      />
    </div>
  );
}

export default ServicesServiceRail;
