/**
 * Recovery Lab - canonical 12-tool workbench map and focus-trapped sheet.
 */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
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
}

export function RepairServiceWorkspace({ toolId, locale, controller, onClose }: RepairServiceWorkspaceProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const snapshot = controller.snapshot;
  const Component = REPAIR_WORKBENCHES[toolId];

  useEffect(() => {
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
  }, []);

  if (!snapshot || !Component) return null;

  return (
    <div className="sys-service-overlay rep-service-overlay" role="dialog" aria-modal="true" aria-label={toolLabel(toolId, locale)}>
      <div className="sys-service-scrim" aria-hidden="true" onClick={onClose} />
      <div className="sys-service-sheet" data-testid={`repair-service-shell-${toolId}`} ref={sheetRef}>
        <button
          ref={closeRef}
          type="button"
          className="sys-service-close"
          aria-label={locale === 'ar' ? 'إغلاق الخدمة' : 'Close service'}
          onClick={onClose}
        >
          <X aria-hidden="true" />
          <span>{locale === 'ar' ? 'إغلاق' : 'Close'}</span>
        </button>
        <div className="sys-service-sheet-scroll rep-service-sheet-scroll">
          {controller.actionError ? <p role="alert" className="knx-tool-error"><strong>{controller.actionError.code}</strong> · {controller.actionError.message}</p> : null}
          {controller.scanning || controller.refreshing || controller.busy ? <div className="knx-tool-context" role="status"><progress aria-label={locale === 'ar' ? 'المزود الأصلي نشط' : 'Native provider active'}/><span>{locale === 'ar' ? 'بانتظار نتيجة المزود الأصلي…' : 'Waiting for native provider result…'}</span>{controller.scanning ? <button type="button" className="sys-btn" disabled={controller.cancelling} onClick={() => void controller.cancelScan()}>{locale === 'ar' ? 'إلغاء الاكتشاف' : 'Cancel discovery'}</button> : null}</div> : null}
          <Component locale={locale} snapshot={snapshot} controller={controller} toolId={toolId} />
        </div>
      </div>
    </div>
  );
}
