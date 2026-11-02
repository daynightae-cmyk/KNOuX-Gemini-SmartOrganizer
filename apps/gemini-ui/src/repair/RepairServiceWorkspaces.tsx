/**
 * Recovery Lab - canonical 12-tool workbench map hosted in the shared
 * ServiceWorkbenchHost with pinned resizable side and expanded modes.
 */
import React, { useEffect, useRef } from 'react';
import type { RepairSnapshot, RepairToolId } from '../../shared/native-contracts';
import type { RepairLocale } from './catalog';
import { TOOL_BY_ID, toolLabel } from './catalog';
import type { RepairController } from './useRepair';
import {
  ComponentCheckWorkbench,
  ComponentRestoreWorkbench,
  ComponentScanWorkbench,
  FilesRepairWorkbench,
  FilesVerifyWorkbench,
} from './RepairServicingWorkbenches';
import {
  DnsFlushWorkbench,
  TcpipResetWorkbench,
  WinsockResetWorkbench,
} from './RepairNetworkWorkbenches';
import {
  RepairHistoryWorkbench,
  RestorePointWorkbench,
  TroubleshootersWorkbench,
  UpdateResetWorkbench,
} from './RepairSystemWorkbenches';
import { ServiceWorkbenchHost, type WorkbenchMode } from '../components/workbench/ServiceWorkbenchHost';

export interface RepairWorkbenchComponentProps {
  locale: RepairLocale;
  snapshot: RepairSnapshot;
  controller: RepairController;
  toolId: RepairToolId;
}

export const REPAIR_WORKBENCHES: Record<RepairToolId, React.ComponentType<RepairWorkbenchComponentProps>> = {
  'repair-component-check': ComponentCheckWorkbench,
  'repair-component-scan': ComponentScanWorkbench,
  'repair-component-restore': ComponentRestoreWorkbench,
  'repair-files-verify': FilesVerifyWorkbench,
  'repair-files-repair': FilesRepairWorkbench,
  'repair-dns-flush': DnsFlushWorkbench,
  'repair-winsock-reset': WinsockResetWorkbench,
  'repair-tcpip-reset': TcpipResetWorkbench,
  'repair-history': RepairHistoryWorkbench,
  'repair-troubleshooters': TroubleshootersWorkbench,
  'repair-restore-point': RestorePointWorkbench,
  'repair-update-reset': UpdateResetWorkbench,
};

export const REPAIR_WORKBENCH_IDS = Object.keys(REPAIR_WORKBENCHES) as RepairToolId[];

export function hasRepairWorkbench(id: string): id is RepairToolId {
  return Object.prototype.hasOwnProperty.call(REPAIR_WORKBENCHES, id);
}

export interface RepairServiceWorkspaceProps {
  toolId: RepairToolId;
  locale: RepairLocale;
  controller: RepairController;
  onClose: () => void;
  mode: WorkbenchMode;
  width: number;
  onModeChange: (mode: WorkbenchMode) => void;
  onResize: (width: number) => void;
  toolSelector?: React.ReactNode;
  embedded?: boolean;
}

export function RepairServiceWorkspace({ toolId, locale, controller, onClose, mode, width, onModeChange, onResize, toolSelector,embedded=false }: RepairServiceWorkspaceProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const snapshot = controller.snapshot;
  const Component = REPAIR_WORKBENCHES[toolId];

  useEffect(() => {
    if(embedded)return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({preventScroll:true});
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') {
        closeCallback.current();
        return;
      }
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )].filter((node) => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown',onKeyDown);
      if(opener?.isConnected)opener.focus({preventScroll:true});
    };
  }, [embedded]);

  if (!snapshot || !Component) return null;

  const isAr = locale === 'ar';
  const title = toolLabel(toolId, locale);
  const ToolIcon = TOOL_BY_ID[toolId]?.icon;
  const subtitle = isAr ? 'أدلة مقيسة · معاينة فقط' : 'Measured evidence · preview only';
  const body = (
    <>
      {controller.actionError ? <p role="alert" className="knx-tool-error"><strong>{controller.actionError.code}</strong> · {controller.actionError.message}</p> : null}
      {controller.scanning || controller.refreshing || controller.busy ? <div className="knx-tool-context" role="status"><progress aria-label={isAr ? 'المزود الأصلي نشط' : 'Native provider active'}/><span>{isAr ? 'بانتظار نتيجة المزود الأصلي…' : 'Waiting for native provider result…'}</span>{controller.scanning ? <button type="button" className="sys-btn" disabled={controller.cancelling} onClick={() => void controller.cancelScan()}>{isAr ? 'إلغاء الاكتشاف' : 'Cancel discovery'}</button> : null}</div> : null}
      <Component locale={locale} snapshot={snapshot} controller={controller} toolId={toolId} />
    </>
  );
  const footer = (
    <span className={isAr ? 'text-slate-300' : 'text-slate-400'}>
      {isAr ? 'مقيس فقط · لا تنفيذ لأمر إصلاح' : 'Measured only · no repair command execution'}
    </span>
  );

  if(embedded)return <div data-testid="repair-integrated-tool" data-tool={toolId}>{body}</div>;
  if (mode === 'side') {
    return (
      <div className="fixed end-3 top-14 bottom-20 z-50" style={{ width }} data-testid="repair-workbench-side-shell">
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
          testId={`repair-service-shell-${toolId}`}
          toolSelector={toolSelector}
          footer={footer}
        >
          <div ref={sheetRef} className="rep-service-sheet-scroll">
            {body}
          </div>
        </ServiceWorkbenchHost>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-3 top-14 bottom-20 z-50" data-testid="repair-workbench-expanded-shell">
      <ServiceWorkbenchHost
        serviceId={toolId}
        icon={ToolIcon ? <ToolIcon aria-hidden="true" /> : undefined}
        title={title}
        subtitle={subtitle}
        locale={locale}
        mode="expanded"
        onModeChange={onModeChange}
        onClose={onClose}
        testId={`repair-service-shell-${toolId}`}
        toolSelector={toolSelector}
        footer={footer}
      >
        <div ref={sheetRef} className="rep-service-sheet-scroll">
          {body}
        </div>
      </ServiceWorkbenchHost>
    </div>
  );
}
