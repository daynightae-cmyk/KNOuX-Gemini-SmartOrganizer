/**
 * Service Commander - canonical 12-tool workbench map. Each tool is measured
 * through its specialized measured workbench; there is no generic fallback.
 * The shared ServiceWorkbenchHost owns chrome, resize and Escape; the page may
 * also host the specialized body inline (embedded) or inside the pinned/
 * expanded host on explicit detach.
 */
import React from 'react';
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

/**
 * The specialized measured body of one Service Commander tool, shared by every
 * surface that can host it. There is no generic fallback content: an unmapped
 * id renders nothing rather than an invented panel.
 */
export interface ServicesServiceBodyProps {
  toolId: ServicesToolId;
  locale: ServicesLocale;
  controller: ServicesController;
}

export function ServicesServiceBody({ toolId, locale, controller }: ServicesServiceBodyProps) {
  const snapshot = controller.snapshot;
  const Component = SERVICES_WORKBENCHES[toolId];

  if (!snapshot || !Component) return null;

  return (
    <>
      {controller.actionError ? <p role="alert" className="knx-tool-error"><strong>{controller.actionError.code}</strong> · {controller.actionError.message}</p> : null}
      {controller.scanning || controller.refreshing || controller.busy ? <div className="knx-tool-context" role="status"><progress aria-label={locale === 'ar' ? 'المزود الأصلي نشط' : 'Native provider active'}/><span>{locale === 'ar' ? 'بانتظار نتيجة المزود الأصلي…' : 'Waiting for native provider result…'}</span>{controller.scanning ? <button type="button" className="sys-btn" disabled={controller.cancelling} onClick={() => void controller.cancelScan()}>{locale === 'ar' ? 'إلغاء الاكتشاف' : 'Cancel discovery'}</button> : null}</div> : null}
      <Component locale={locale} snapshot={snapshot} controller={controller} toolId={toolId} />
    </>
  );
}

export interface ServicesServiceWorkspaceProps {
  toolId: ServicesToolId;
  locale: ServicesLocale;
  controller: ServicesController;
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

const EMBEDDED_FOOTER = 'signed third-party start/stop only · restart, force, cascade, policy and sc.exe remain gated';
const EMBEDDED_FOOTER_AR = 'بدء/إيقاف موقع لطرف ثالث فقط · إعادة التشغيل والفرض والتتالي والسياسة وsc.exe تبقى مقيدة';

export function ServicesServiceWorkspace({ toolId, locale, controller, onClose, mode, width, onModeChange, onResize, toolSelector, embedded = false }: ServicesServiceWorkspaceProps) {
  const snapshot = controller.snapshot;
  const ToolIcon = TOOL_BY_ID[toolId]?.icon;
  const isAr = locale === 'ar';

  if (!snapshot) return null;

  const title = toolLabel(toolId, locale);
  const entry = TOOL_BY_ID[toolId];
  const subtitle = snapshot.readOnly ? (isAr ? 'مقيس · للقراءة فقط' : 'Measured · read-only') : (isAr ? 'تنفيذ مقيد بالموافقة' : 'Execution gated by consent');
  const body = <ServicesServiceBody toolId={toolId} locale={locale} controller={controller} />;
  const footer = (
    <span className={isAr ? 'text-slate-300' : 'text-slate-400'}>
      {`${formatCount(controller.journal.length)} ${t(locale, 'journal entries', 'مدخلات السجل')} · ${isAr ? EMBEDDED_FOOTER_AR : EMBEDDED_FOOTER}`}
    </span>
  );

  if (embedded) {
    const capability = controller.capabilities?.services.find((service) => service.id === toolId);
    const state = capability?.state || entry?.state || 'gated';
    const chipTone = state === 'available' ? 'is-good' : state === 'partial' ? 'is-warn' : 'is-bad';
    return (
      <div className="svc-embedded-service" data-testid="services-embedded-service">
        <header className="svc-embedded-head">
          <span className="svc-embedded-icon" style={entry ? { color: entry.accent } : undefined} aria-hidden="true">
            {ToolIcon ? <ToolIcon /> : null}
          </span>
          <span className="svc-embedded-copy">
            <strong>{title}</strong>
            <small>{capability?.provider || entry?.provider || toolId}</small>
          </span>
          <span className={`svc-embedded-state ${chipTone}`} data-testid="services-embedded-state">
            {state === 'available' ? (isAr ? 'مقيس' : 'Measured') : state === 'partial' ? (isAr ? 'مزود جزئي' : 'Partial provider') : (isAr ? 'مقيد بموافقة' : 'Consent gated')}
          </span>
          <button type="button" className="sys-btn sys-btn-quiet" onClick={onClose} data-testid="services-embedded-close">
            {isAr ? 'العودة إلى السجل' : 'Back to register'}
          </button>
        </header>
        {capability ? <p className="svc-embedded-note">{isAr ? capability.noteAr : capability.noteEn}</p> : null}
        {body}
        <footer className="svc-embedded-foot">{footer}</footer>
      </div>
    );
  }

  if (mode === 'side') {
    return (
      <div className="fixed end-3 top-14 bottom-20 z-50" style={{ width }} data-testid="services-workbench-side-shell">
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
          minWidth={360}
          maxWidth={900}
          testId={`services-service-shell-${toolId}`}
          toolSelector={toolSelector}
          footer={footer}
        >
          {body}
        </ServiceWorkbenchHost>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-3 top-14 bottom-20 z-50" data-testid="services-workbench-expanded-shell">
      <ServiceWorkbenchHost
        serviceId={toolId}
        icon={ToolIcon ? <ToolIcon aria-hidden="true" /> : undefined}
        title={title}
        subtitle={subtitle}
        locale={locale}
        mode="expanded"
        onModeChange={onModeChange}
        onClose={onClose}
        testId={`services-service-shell-${toolId}`}
        toolSelector={toolSelector}
        footer={footer}
      >
        {body}
      </ServiceWorkbenchHost>
    </div>
  );
}

function formatCount(n: number) { return String(n); }
