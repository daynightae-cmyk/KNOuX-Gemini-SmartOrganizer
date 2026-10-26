/**
 * Flow Studio - canonical 12-tool workbench map and focus-trapped sheet.
 */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { AutomationSnapshot } from '../../shared/native-contracts';
import type { AutomationLocale } from './catalog';
import { TOOL_BY_ID, toolLabel } from './catalog';
import type { AutomationController } from './useAutomation';
import {
  CleanupPlanWorkbench,
  RunHistoryWorkbench,
  ScheduleManagerWorkbench,
  SchedulePlanWorkbench,
  SmartScanWorkbench,
  TemplatesWorkbench,
} from './AutomationCoreWorkbenches';
import {
  BackupPlanWorkbench,
  BatteryPolicyWorkbench,
  ExportWorkbench,
  NotifyWorkbench,
  QuietHoursWorkbench,
  RetentionWorkbench,
} from './AutomationPolicyWorkbenches';

export interface AutomationWorkbenchComponentProps {
  locale: AutomationLocale;
  snapshot: AutomationSnapshot;
  controller: AutomationController;
  toolId: (typeof import('./catalog'))['AUTOMATION_TOOLS'][number]['id'];
}

export const AUTOMATION_WORKBENCHES = {
  'auto-smart-scan': SmartScanWorkbench,
  'auto-schedule-manager': ScheduleManagerWorkbench,
  'auto-run-history': RunHistoryWorkbench,
  'auto-templates': TemplatesWorkbench,
  'auto-schedule-plan': SchedulePlanWorkbench,
  'auto-cleanup-plan': CleanupPlanWorkbench,
  'auto-notify': NotifyWorkbench,
  'auto-quiet-hours': QuietHoursWorkbench,
  'auto-battery-policy': BatteryPolicyWorkbench,
  'auto-retention': RetentionWorkbench,
  'auto-export': ExportWorkbench,
  'auto-backup-plan': BackupPlanWorkbench,
} as const;

export const AUTOMATION_WORKBENCH_IDS = Object.keys(AUTOMATION_WORKBENCHES) as Array<keyof typeof AUTOMATION_WORKBENCHES>;

export function hasAutomationWorkbench(id: string): id is keyof typeof AUTOMATION_WORKBENCHES {
  return Object.prototype.hasOwnProperty.call(AUTOMATION_WORKBENCHES, id);
}

export interface AutomationServiceWorkspaceProps {
  toolId: keyof typeof AUTOMATION_WORKBENCHES;
  locale: AutomationLocale;
  controller: AutomationController;
  onClose: () => void;
}

export function AutomationServiceWorkspace({ toolId, locale, controller, onClose }: AutomationServiceWorkspaceProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const snapshot = controller.snapshot;
  const Component = AUTOMATION_WORKBENCHES[toolId];
  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return; }
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((node) => node.offsetParent !== null);
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
    <div className="sys-service-overlay auto-service-overlay" role="dialog" aria-modal="true" aria-label={toolLabel(toolId, locale)}>
      <div className="sys-service-scrim" aria-hidden="true" onClick={onClose} />
      <div className="sys-service-sheet" data-testid={`automation-service-shell-${toolId}`} ref={sheetRef}>
        <button ref={closeRef} type="button" className="sys-service-close" aria-label={locale === 'ar' ? 'إغلاق الخدمة' : 'Close service'} onClick={onClose}><X aria-hidden="true" /><span>{locale === 'ar' ? 'إغلاق' : 'Close'}</span></button>
        <div className="sys-service-sheet-scroll auto-service-sheet-scroll">
          <Component locale={locale} snapshot={snapshot} controller={controller} toolId={toolId} />
        </div>
      </div>
    </div>
  );
}
