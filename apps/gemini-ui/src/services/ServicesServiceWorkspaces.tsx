/**
 * Service Commander - canonical 12-tool workbench map and focus-trapped sheet.
 */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ServicesSnapshot, ServicesToolId } from '../../shared/native-contracts';
import type { ServicesLocale } from './catalog';
import { TOOL_BY_ID, toolLabel } from './catalog';
import type { ServicesController } from './useServices';
import {
  ConfigWorkbench,
  ControlWorkbench,
  InventoryWorkbench,
  SearchWorkbench,
  UndoWorkbench,
} from './ServicesRegisterWorkbenches';
import {
  DependenciesWorkbench,
  DependentsWorkbench,
  DiagnoseWorkbench,
  ProtectedWorkbench,
} from './ServicesCoreWorkbenches';
import {
  PerfWorkbench,
  StartupReportWorkbench,
  StateHistoryWorkbench,
} from './ServicesAnalyticsWorkbenches';

export interface ServicesWorkbenchComponentProps {
  locale: ServicesLocale;
  snapshot: ServicesSnapshot;
  controller: ServicesController;
  toolId: ServicesToolId;
}

export const SERVICES_WORKBENCHES: Record<ServicesToolId, React.ComponentType<ServicesWorkbenchComponentProps>> = {
  'services-inventory': InventoryWorkbench,
  'services-control': ControlWorkbench,
  'services-undo': UndoWorkbench,
  'services-dependencies': DependenciesWorkbench,
  'services-protected': ProtectedWorkbench,
  'services-search': SearchWorkbench,
  'services-startup-report': StartupReportWorkbench,
  'services-state-history': StateHistoryWorkbench,
  'services-dependents': DependentsWorkbench,
  'services-diagnose': DiagnoseWorkbench,
  'services-config': ConfigWorkbench,
  'services-perf': PerfWorkbench,
};

export const SERVICES_WORKBENCH_IDS = Object.keys(SERVICES_WORKBENCHES) as ServicesToolId[];

export function hasServicesWorkbench(id: string): id is ServicesToolId {
  return Object.prototype.hasOwnProperty.call(SERVICES_WORKBENCHES, id);
}

export interface ServicesServiceWorkspaceProps {
  toolId: ServicesToolId;
  locale: ServicesLocale;
  controller: ServicesController;
  onClose: () => void;
}

export function ServicesServiceWorkspace({ toolId, locale, controller, onClose }: ServicesServiceWorkspaceProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const snapshot = controller.snapshot;
  const Component = SERVICES_WORKBENCHES[toolId];

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((node) => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!snapshot || !Component) return null;

  return (
    <div className="sys-service-overlay svc-service-overlay" role="dialog" aria-modal="true" aria-label={toolLabel(toolId, locale)}>
      <div className="sys-service-scrim" aria-hidden="true" onClick={onClose} />
      <div className="sys-service-sheet" data-testid={`services-service-shell-${toolId}`} ref={sheetRef}>
        <button ref={closeRef} type="button" className="sys-service-close" aria-label={locale === 'ar' ? 'إغلاق الخدمة' : 'Close service'} onClick={onClose}>
          <X aria-hidden="true" />
          <span>{locale === 'ar' ? 'إغلاق' : 'Close'}</span>
        </button>
        <div className="sys-service-sheet-scroll svc-service-sheet-scroll">
          <Component locale={locale} snapshot={snapshot} controller={controller} toolId={toolId} />
        </div>
      </div>
    </div>
  );
}
