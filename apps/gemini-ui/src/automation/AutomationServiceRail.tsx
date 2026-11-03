import React from 'react';
import { CompactServiceDock } from '../components/workbench/CompactServiceDock';
import type { AutomationLocale } from './catalog';
import { AUTOMATION_TOOLS, TOOL_BY_ID } from './catalog';
import { formatCount, t } from './model';
import type { AutomationController } from './useAutomation';

/**
 * Twelve consent-gated Flow Studio selectors rendered through the shared
 * CompactServiceDock, so Automation uses the same inner-workspace selection
 * pattern as the integrated domains.
 *
 * Selection only: capability chips come from the live AutomationCapabilities
 * contract and result strings from the measured local store. Nothing here
 * executes, schedules or approves anything; execution lives exclusively
 * behind exact-plan native consent.
 */
export interface AutomationServiceRailProps {
  locale: AutomationLocale;
  controller: AutomationController;
  selectedTool: string | null;
  onOpenTool: (id: string) => void;
  actions?: React.ReactNode;
}

const STATE_LABEL: Record<'available' | 'partial' | 'gated', { en: string; ar: string }> = {
  available: { en: 'Available', ar: 'متاح' },
  partial: { en: 'Partial provider', ar: 'مزود جزئي' },
  gated: { en: 'Consent gated', ar: 'مقيد بموافقة' },
};

function capabilityLabel(id: string, c: AutomationController, locale: AutomationLocale): string {
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
function measuredSummary(id: string, c: AutomationController, locale: AutomationLocale): string | undefined {
  const snapshot = c.snapshot;
  const unmeasured = t(locale, 'Not measured', 'غير مقيس');
  switch (id) {
    case 'auto-smart-scan':
      return snapshot ? unmeasured : undefined;
    case 'auto-schedule-manager':
      return snapshot
        ? `${formatCount(snapshot.workflows.length)} ${t(locale, 'drafts', 'مسودة')}`
        : unmeasured;
    case 'auto-run-history':
      return `${formatCount(c.journal.length)} ${t(locale, 'dry-runs', 'تشغيل تجريبي')}`;
    case 'auto-templates':
      return snapshot ? `${formatCount(snapshot.templates.length)} ${t(locale, 'templates', 'قالب')}` : unmeasured;
    case 'auto-schedule-plan':
      return c.schedulePreview ? t(locale, 'Occurrences previewed', 'تم عرض الظهور') : t(locale, 'Preview locally', 'معاينة محليًا');
    case 'auto-cleanup-plan':
      return snapshot ? t(locale, 'Preview only', 'معاينة فقط') : unmeasured;
    case 'auto-notify':
      return snapshot ? t(locale, 'In-app and journal only', 'داخل التطبيق والسجل فقط') : unmeasured;
    case 'auto-quiet-hours':
      return snapshot ? t(locale, 'Local policy draft', 'مسودة سياسة محلية') : unmeasured;
    case 'auto-battery-policy':
      return snapshot
        ? snapshot.runtime.batteryAvailable
          ? `${snapshot.runtime.batteryChargePercent ?? '—'}% ${t(locale, 'battery', 'بطارية')}`
          : t(locale, 'Battery not measured', 'البطارية غير مقيسة')
        : unmeasured;
    case 'auto-retention':
      return `${formatCount(c.journal.length)} ${t(locale, 'journal entries', 'مدخل سجل')}`;
    case 'auto-export':
      return t(locale, 'knoux.workflow.v1 JSON', 'JSON knoux.workflow.v1');
    case 'auto-backup-plan':
      return snapshot ? `${formatCount(snapshot.runtime.studioSources.length)} ${t(locale, 'Studio sources', 'مصدر Studio')}` : unmeasured;
    default:
      return undefined;
  }
}

export function AutomationServiceRail({ locale, controller, selectedTool, onOpenTool, actions }: AutomationServiceRailProps) {
  const items = AUTOMATION_TOOLS.map((entry) => {
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

  const label = t(locale, 'Flow Studio tools', 'أدوات Flow Studio');

  return (
    <div className="auto-compact-dock" data-testid="automation-services">
      <CompactServiceDock
        testIdPrefix="automation"
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

export default AutomationServiceRail;
