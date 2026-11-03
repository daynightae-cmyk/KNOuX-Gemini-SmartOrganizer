/**
 * Flow Studio - canonical 12-tool workbench map. Each tool is consent-gated
 * and renders through the shared ServiceWorkbenchHost with pinned resizable
 * side and expanded modes, or inside the page's integrated grid when embedded.
 * Escape and chrome belong to the shared host; no local focus trap exists.
 */
import React from 'react';
import type { AutomationSnapshot } from '../../shared/native-contracts';
import type { AutomationLocale } from './catalog';
import { TOOL_BY_ID, toolLabel } from './catalog';
import { t } from './model';
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

export interface AutomationServiceBodyProps {
  toolId: keyof typeof AUTOMATION_WORKBENCHES;
  locale: AutomationLocale;
  controller: AutomationController;
}

/**
 * The specialized measured body of one Flow Studio tool, shared by every
 * surface that can host it. An unmapped id renders nothing rather than an
 * invented panel.
 */
export function AutomationServiceBody({ toolId, locale, controller }: AutomationServiceBodyProps) {
  const snapshot = controller.snapshot;
  const Component = AUTOMATION_WORKBENCHES[toolId];

  if (!snapshot || !Component) return null;

  const isAr = locale === 'ar';
  return (
    <>
      {controller.actionError ? <p role="alert" className="knx-tool-error"><strong>{controller.actionError.code}</strong> · {controller.actionError.message}</p> : null}
      {controller.scanning || controller.refreshing || controller.busy ? <div className="knx-tool-context" role="status"><progress aria-label={isAr ? 'المزود الأصلي نشط' : 'Native provider active'}/><span>{isAr ? 'بانتظار نتيجة المزود الأصلي…' : 'Waiting for native provider result…'}</span>{controller.scanning ? <button type="button" className="sys-btn" disabled={controller.cancelling} onClick={() => void controller.cancelScan()}>{isAr ? 'إلغاء الاكتشاف' : 'Cancel discovery'}</button> : null}</div> : null}
      <Component locale={locale} snapshot={snapshot} controller={controller} toolId={toolId} />
    </>
  );
}

export interface AutomationServiceWorkspaceProps {
  toolId: keyof typeof AUTOMATION_WORKBENCHES;
  locale: AutomationLocale;
  controller: AutomationController;
  onClose: () => void;
  mode: WorkbenchMode;
  width?: number;
  onModeChange: (mode: WorkbenchMode) => void;
  onResize: (width: number) => void;
  toolSelector?: React.ReactNode;
  /**
   * Render inside the page's own work grid instead of a floating host. The
   * integrated stage and the pinned/expanded host then show the identical
   * specialized measured body, so a tool is never a different product
   * depending on where it was opened.
   */
  embedded?: boolean;
}

export function AutomationServiceWorkspace({ toolId, locale, controller, onClose, mode, width, onModeChange, onResize, toolSelector, embedded = false }: AutomationServiceWorkspaceProps) {
  const snapshot = controller.snapshot;
  const ToolIcon = TOOL_BY_ID[toolId]?.icon;
  const isAr = locale === 'ar';

  if (!snapshot) return null;

  const title = toolLabel(toolId, locale);
  const entry = TOOL_BY_ID[toolId];
  const subtitle = isAr ? 'سياق مقيس · تنفيذ بالموافقة' : 'Measured context · consent-gated execution';
  const body = <AutomationServiceBody toolId={toolId} locale={locale} controller={controller} />;
  const footer = (
    <span className={isAr ? 'text-slate-300' : 'text-slate-400'}>
      {isAr ? 'مراقبة مقيسة بموافقة · الطفرات الخارجية مقيدة' : 'Consent-gated measured observation · external mutations gated'}
    </span>
  );

  if (embedded) {
    const capability = controller.capabilities?.services.find((tool) => tool.id === toolId);
    const state = capability?.state || entry?.state || 'gated';
    const chipTone = state === 'available' ? 'is-good' : state === 'partial' ? 'is-warn' : 'is-bad';
    return (
      <div className="auto-embedded-service" data-testid="automation-embedded-service">
        <header className="auto-embedded-head">
          <span className="auto-embedded-icon" style={entry ? { color: entry.accent } : undefined} aria-hidden="true">
            {ToolIcon ? <ToolIcon /> : null}
          </span>
          <span className="auto-embedded-copy">
            <strong>{title}</strong>
            <small>{capability?.provider || entry?.provider || toolId}</small>
          </span>
          <span className={`auto-embedded-state ${chipTone}`} data-testid="automation-embedded-state">
            {state === 'available' ? (isAr ? 'مقيس' : 'Measured') : state === 'partial' ? (isAr ? 'مزود جزئي' : 'Partial provider') : (isAr ? 'مقيد بموافقة' : 'Consent gated')}
          </span>
          <button type="button" className="sys-btn sys-btn-quiet" onClick={onClose} data-testid="automation-embedded-close">
            {isAr ? 'العودة إلى الأستوديو' : 'Back to Flow Studio'}
          </button>
        </header>
        {capability ? <p className="auto-embedded-note">{isAr ? capability.noteAr : capability.noteEn}</p> : null}
        {body}
        <footer className="auto-embedded-foot">{footer}</footer>
      </div>
    );
  }

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
          {body}
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
        {body}
      </ServiceWorkbenchHost>
    </div>
  );
}
