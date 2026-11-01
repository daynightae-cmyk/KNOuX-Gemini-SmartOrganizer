/**
 * Flow Studio - canonical 12-tool workbench map hosted in the shared
 * ServiceWorkbenchHost with pinned resizable side and expanded modes.
 */
import React, { useEffect, useRef } from 'react';
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
import { ServiceWorkbenchHost, type WorkbenchMode } from '../components/workbench/ServiceWorkbenchHost';

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
  mode: WorkbenchMode;
  width: number;
  onModeChange: (mode: WorkbenchMode) => void;
  onResize: (width: number) => void;
  toolSelector?: React.ReactNode;
}

export function AutomationServiceWorkspace({ toolId, locale, controller, onClose, mode, width, onModeChange, onResize, toolSelector }: AutomationServiceWorkspaceProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const snapshot = controller.snapshot;
  const Component = AUTOMATION_WORKBENCHES[toolId];
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({preventScroll:true});
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') { closeCallback.current(); return; }
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')].filter((node) => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown',onKeyDown);
      if(opener?.isConnected)opener.focus({preventScroll:true});
    };
  }, []);
  if (!snapshot || !Component) return null;

  const isAr = locale === 'ar';
  const title = toolLabel(toolId, locale);
  const ToolIcon = TOOL_BY_ID[toolId]?.icon;
  const subtitle = isAr ? 'سياق مقيس · تنفيذ بالموافقة' : 'Measured context · consent-gated execution';
  const body = (
    <>
      {controller.actionError ? <p role="alert" className="knx-tool-error"><strong>{controller.actionError.code}</strong> · {controller.actionError.message}</p> : null}
      {controller.scanning || controller.refreshing || controller.busy ? <div className="knx-tool-context" role="status"><progress aria-label={isAr ? 'المزود الأصلي نشط' : 'Native provider active'}/><span>{isAr ? 'بانتظار نتيجة المزود الأصلي…' : 'Waiting for native provider result…'}</span>{controller.scanning ? <button type="button" className="sys-btn" disabled={controller.cancelling} onClick={() => void controller.cancelScan()}>{isAr ? 'إلغاء الاكتشاف' : 'Cancel discovery'}</button> : null}</div> : null}
      <Component locale={locale} snapshot={snapshot} controller={controller} toolId={toolId} />
    </>
  );
  const footer = (
    <span className={isAr ? 'text-slate-300' : 'text-slate-400'}>
      {isAr ? 'مراقبة مقيسة بموافقة · الطفرات الخارجية مقيدة' : 'Consent-gated measured observation · external mutations gated'}
    </span>
  );

  if (mode === 'side') {
    return (
      <div className="fixed end-3 top-14 bottom-20 z-50" style={{ width }} data-testid="automation-workbench-side-shell">
        <ServiceWorkbenchHost
          serviceId={toolId}
          icon={ToolIcon ? <ToolIcon aria-hidden="true" /> : undefined}
          title={title}
          subtitle={subtitle}
          locale={locale}
          mode="side"
          onModeChange={onModeChange}
          onClose={onClose}
          onResize={onResize}
          minWidth={380}
          maxWidth={900}
          testId={`automation-service-shell-${toolId}`}
          toolSelector={toolSelector}
          footer={footer}
        >
          <div ref={sheetRef} className="auto-service-sheet-scroll">
            {body}
          </div>
        </ServiceWorkbenchHost>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-3 top-14 bottom-20 z-50" data-testid="automation-workbench-expanded-shell">
      <ServiceWorkbenchHost
        serviceId={toolId}
        icon={ToolIcon ? <ToolIcon aria-hidden="true" /> : undefined}
        title={title}
        subtitle={subtitle}
        locale={locale}
        mode="expanded"
        onModeChange={onModeChange}
        onClose={onClose}
        testId={`automation-service-shell-${toolId}`}
        toolSelector={toolSelector}
        footer={footer}
      >
        <div ref={sheetRef} className="auto-service-sheet-scroll">
          {body}
        </div>
      </ServiceWorkbenchHost>
    </div>
  );
}
