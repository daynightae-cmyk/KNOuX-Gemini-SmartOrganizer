/**
 * Service Commander - canonical 12-tool workbench map hosted in the shared
 * ServiceWorkbenchHost with pinned resizable side and expanded modes.
 */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ServicesSnapshot, ServicesToolId } from '../../shared/native-contracts';
import type { ServicesLocale } from './catalog';
import { TOOL_BY_ID, toolLabel } from './catalog';
import { t } from './model';
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
import { ServiceWorkbenchHost, type WorkbenchMode } from '../components/workbench/ServiceWorkbenchHost';

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
  mode: WorkbenchMode;
  width: number;
  onModeChange: (mode: WorkbenchMode) => void;
  onResize: (width: number) => void;
  toolSelector?: React.ReactNode;
}

export function ServicesServiceWorkspace({ toolId, locale, controller, onClose, mode, width, onModeChange, onResize, toolSelector }: ServicesServiceWorkspaceProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const snapshot = controller.snapshot;
  const Component = SERVICES_WORKBENCHES[toolId];

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
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
  const subtitle = snapshot.readOnly ? (isAr ? 'مقيس · للقراءة فقط' : 'Measured · read-only') : (isAr ? 'تنفيذ مقيد بالموافقة' : 'Execution gated by consent');
  const body = (
    <>
      {controller.actionError ? <p role="alert" className="knx-tool-error"><strong>{controller.actionError.code}</strong> · {controller.actionError.message}</p> : null}
      {controller.scanning || controller.refreshing || controller.busy ? <div className="knx-tool-context" role="status"><progress aria-label={locale === 'ar' ? 'المزود الأصلي نشط' : 'Native provider active'}/><span>{locale === 'ar' ? 'بانتظار نتيجة المزود الأصلي…' : 'Waiting for native provider result…'}</span>{controller.scanning ? <button type="button" className="sys-btn" disabled={controller.cancelling} onClick={() => void controller.cancelScan()}>{locale === 'ar' ? 'إلغاء الاكتشاف' : 'Cancel discovery'}</button> : null}</div> : null}
      <Component locale={locale} snapshot={snapshot} controller={controller} toolId={toolId} />
    </>
  );

  const footer = (
    <span className={isAr ? 'text-slate-300' : 'text-slate-400'}>
      {snapshot ? `${formatCount(controller.journal.length)} ${t(locale, 'journal entries', 'مدخلات السجل')} · ${t(locale, '0 SCM writes', '0 كتابة SCM')}` : t(locale, 'Awaiting measured discovery', 'بانتظار الاكتشاف المقيس')}
    </span>
  );

  return (
    <ServiceWorkbenchHost
      serviceId={toolId}
      icon={<X aria-hidden="true" />}
      title={title}
      subtitle={subtitle}
      locale={locale}
      mode={mode}
      onModeChange={onModeChange}
      onClose={onClose}
      onResize={onResize}
      minWidth={360}
      maxWidth={900}
      testId={`services-service-shell-${toolId}`}
      toolSelector={toolSelector}
      footer={footer}
    >
      <div ref={sheetRef} className="svc-service-sheet-scroll">
        {body}
      </div>
    </ServiceWorkbenchHost>
  );
}

function formatCount(n: number) { return String(n); }
