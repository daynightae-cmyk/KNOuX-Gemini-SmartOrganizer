/**
 * KNOuX Live Pulse - canonical 36-service workbench map (Mission 10).
 *
 * Every registry descriptor resolves to one specialised measured component.
 * There is no generic fallback panel and no fixture source: a missing mapping
 * is a contract error, not a reason to invent readings.
 */
import React from 'react';
import { ServiceWorkbenchHost, type WorkbenchMode } from '../components/workbench/ServiceWorkbenchHost';
import type { SystemLocale } from './catalog';
import { SERVICE_BY_ID, serviceLabel } from './catalog';
import { serviceStateTone } from './model';
import type { SystemController } from './useSystem';
import type { WorkbenchProps } from './types';
import {
  BootClockWorkbench,
  EventLedgerWorkbench,
  LivePulseWorkbench,
  PerformancePulseWorkbench,
  ProcessRegisterWorkbench,
  SignatureInspectorWorkbench,
} from './SystemWorkbenchesA';
import {
  AutostartLinksWorkbench,
  DriverInventoryWorkbench,
  LogChannelWorkbench,
  ServiceGraphWorkbench,
  TimelineWorkbench,
  TopConsumersWorkbench,
} from './SystemWorkbenchesB';
import {
  AdaptersWorkbench,
  ConnectivityWorkbench,
  DnsConfigWorkbench,
  HostsWorkbench,
  InterfacesWorkbench,
  ProxiesWorkbench,
  RepairPreviewWorkbench,
  SocketsWorkbench,
  ThroughputWorkbench,
  TopologyWorkbench,
  TracerouteWorkbench,
  WifiWorkbench,
} from './NetworkWorkbenches';
import {
  AudioWorkbench,
  BatteryWorkbench,
  CpuWorkbench,
  CycleLedgerWorkbench,
  DisplayWorkbench,
  DisksWorkbench,
  GpuWorkbench,
  HardwareInventoryWorkbench,
  HealthReportWorkbench,
  MemoryWorkbench,
  ThermalWorkbench,
  UsbWorkbench,
} from './HardwareWorkbenches';

export const SYSTEM_WORKBENCHES: Record<string, React.ComponentType<WorkbenchProps>> = {
  'system-health-check': LivePulseWorkbench,
  'system-events': EventLedgerWorkbench,
  'system-processes': ProcessRegisterWorkbench,
  'system-signatures': SignatureInspectorWorkbench,
  'system-uptime': BootClockWorkbench,
  'system-perf': PerformancePulseWorkbench,
  'system-drivers': DriverInventoryWorkbench,
  'system-logs': LogChannelWorkbench,
  'system-resources': TopConsumersWorkbench,
  'system-autostart': AutostartLinksWorkbench,
  'system-services-map': ServiceGraphWorkbench,
  'system-timeline': TimelineWorkbench,
  'network-interfaces': InterfacesWorkbench,
  'network-dns-config': DnsConfigWorkbench,
  'network-adapters': AdaptersWorkbench,
  'network-connectivity': ConnectivityWorkbench,
  'network-throughput': ThroughputWorkbench,
  'network-traceroute': TracerouteWorkbench,
  'network-topology': TopologyWorkbench,
  'network-ports': SocketsWorkbench,
  'network-wifi': WifiWorkbench,
  'network-hosts': HostsWorkbench,
  'network-proxies': ProxiesWorkbench,
  'network-repair-link': RepairPreviewWorkbench,
  'hardware-inventory': HardwareInventoryWorkbench,
  'hardware-battery': BatteryWorkbench,
  'hardware-cpu': CpuWorkbench,
  'hardware-gpu': GpuWorkbench,
  'hardware-memory': MemoryWorkbench,
  'hardware-cycles': CycleLedgerWorkbench,
  'hardware-thermal': ThermalWorkbench,
  'hardware-disks': DisksWorkbench,
  'hardware-usb': UsbWorkbench,
  'hardware-display': DisplayWorkbench,
  'hardware-audio': AudioWorkbench,
  'hardware-health-report': HealthReportWorkbench,
};

export const SYSTEM_WORKBENCH_IDS = Object.keys(SYSTEM_WORKBENCHES);

export function hasSystemWorkbench(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(SYSTEM_WORKBENCHES, id);
}

export interface SystemServiceWorkspaceProps {
  serviceId: string;
  locale: SystemLocale;
  controller: SystemController;
  onOpenService: (id: string) => void;
  onClose: () => void;
  mode: WorkbenchMode;
  onModeChange: (mode: WorkbenchMode) => void;
  width: number;
  onResize: (width: number) => void;
  toolSelector?: React.ReactNode;
  /**
   * Render inside the page's own work grid instead of a floating host. The
   * integrated stage and the pinned/expanded host then show the identical
   * specialized measured body, so a service is never a different product
   * depending on where it was opened.
   */
  embedded?: boolean;
}

const LIVE_INSTRUMENTS = ['system-health-check', 'system-perf', 'system-timeline', 'network-throughput', 'hardware-cpu', 'hardware-memory'];

export interface SystemServiceBodyProps {
  serviceId: string;
  locale: SystemLocale;
  controller: SystemController;
  onOpenService: (id: string) => void;
}

/**
 * The specialized measured body of one registry descriptor, shared by every
 * surface that can host it. No generic fallback exists: an unmapped id renders
 * nothing rather than an invented panel.
 */
export function SystemServiceBody({ serviceId, locale, controller, onOpenService }: SystemServiceBodyProps) {
  const snapshot = controller.snapshot;
  const Component = SYSTEM_WORKBENCHES[serviceId];

  if (!snapshot || !Component) return null;

  const liveInstrument = LIVE_INSTRUMENTS.includes(serviceId);
  return (
    <div className="knx-system-tool">
    {controller.actionError ? <p role="alert" className="knx-tool-error"><strong>{controller.actionError.code}</strong> · {controller.actionError.message}<button type="button" className="sys-btn sys-btn-quiet" onClick={controller.clearError}>{locale === 'ar' ? 'إخفاء الرسالة' : 'Dismiss message'}</button></p> : null}
    <div className="knx-tool-context"><div><strong>{locale === 'ar' ? 'أدلة النظام الأصلية' : 'Native system evidence'}</strong>{liveInstrument ? <small>{locale === 'ar' ? 'آخر عينة' : 'Last sample'}: {controller.lastSampleAt || '—'}</small> : null}</div><button type="button" className="sys-btn sys-btn-quiet" disabled={!controller.nativeAvailable || controller.refreshing || controller.scanning} onClick={() => void controller.refreshSnapshot()}>{locale === 'ar' ? 'تحديث اللقطة' : 'Refresh snapshot'}</button>{controller.scanning ? <button type="button" className="sys-btn" disabled={controller.cancelling} onClick={() => void controller.cancelScan()}>{locale === 'ar' ? 'إلغاء الفحص' : 'Cancel scan'}</button> : null}</div>
    {liveInstrument ? <div className="knx-tool-actions"><button type="button" disabled={!controller.nativeAvailable || controller.sampling} onClick={() => void controller.sampleNow()}>{locale === 'ar' ? 'أخذ عينة الآن' : 'Sample now'}</button><button type="button" aria-pressed={controller.samplingPaused} onClick={() => controller.setSamplingPaused(!controller.samplingPaused)}>{controller.samplingPaused ? (locale === 'ar' ? 'استئناف العينات' : 'Resume sampling') : (locale === 'ar' ? 'إيقاف العينات مؤقتًا' : 'Pause sampling')}</button><label>{locale === 'ar' ? 'فاصل العينات' : 'Sample interval'}<select value={controller.sampleIntervalMs} onChange={e => controller.setSampleInterval(Number(e.target.value))}><option value={1000}>1 s</option><option value={3000}>3 s</option><option value={5000}>5 s</option>{![1000,3000,5000].includes(controller.sampleIntervalMs) ? <option value={controller.sampleIntervalMs}>{controller.sampleIntervalMs} ms</option> : null}</select></label></div> : null}
    <Component
      locale={locale}
      snapshot={snapshot}
      series={controller.series}
      controller={controller}
      onOpenService={(id) => {
        if (SERVICE_BY_ID[id] && hasSystemWorkbench(id)) onOpenService(id);
      }}
    />
    </div>
  );
}

/**
 * Pinned, expanded or integrated service workbench. The floating modes render on
 * top of the measured overview without unmounting it, so live samples keep
 * flowing while a workbench is open. The shared host owns chrome, resize, Escape
 * and the rail scroll; the integrated mode keeps the same body inside the page's
 * own work grid. Each service always supplies its own specialized measured body.
 */
export function SystemServiceWorkspace({
  serviceId,
  locale,
  controller,
  onOpenService,
  onClose,
  mode,
  onModeChange,
  width,
  onResize,
  toolSelector,
  embedded = false,
}: SystemServiceWorkspaceProps) {
  const snapshot = controller.snapshot;
  const Component = SYSTEM_WORKBENCHES[serviceId];
  const ServiceIcon = SERVICE_BY_ID[serviceId]?.icon;

  if (!snapshot || !Component) return null;

  const body = (
    <SystemServiceBody
      serviceId={serviceId}
      locale={locale}
      controller={controller}
      onOpenService={onOpenService}
    />
  );
  const footer = (
    <span className="text-amber-300">
      {locale === 'ar'
        ? 'للقراءة فقط · لا كتابة للعملية أو الخدمة أو السجل أو الشبكة أو الطاقة'
        : 'Read-only · no process, service, driver, log, network or power write'}
    </span>
  );

  if (embedded) {
    const entry = SERVICE_BY_ID[serviceId];
    const capability = controller.capabilities?.services.find((service) => service.id === serviceId);
    const state = capability?.state || entry?.state || 'gated';
    return (
      <div className="sys-embedded-service" data-testid="system-embedded-service">
        <header className="sys-embedded-head">
          <span className="sys-embedded-icon" style={entry ? { color: entry.accent } : undefined} aria-hidden="true">
            {ServiceIcon ? <ServiceIcon /> : null}
          </span>
          <span className="sys-embedded-copy">
            <strong>{serviceLabel(serviceId, locale)}</strong>
            <small>
              {capability?.provider || (entry ? (locale === 'ar' ? entry.blurbAr : entry.blurbEn) : serviceId)}
            </small>
          </span>
          <span className={`sys-embedded-state is-${serviceStateTone(state)}`} data-testid="system-embedded-state">
            {state === 'available'
              ? locale === 'ar' ? 'مقيس' : 'Measured'
              : state === 'partial'
                ? locale === 'ar' ? 'مزود جزئي' : 'Partial provider'
                : locale === 'ar' ? 'محمي بموافقة' : 'Consent gated'}
          </span>
          <button type="button" className="sys-btn sys-btn-quiet" onClick={onClose} data-testid="system-embedded-close">
            {locale === 'ar' ? 'العودة إلى النظرة العامة' : 'Back to overview'}
          </button>
        </header>
        {capability ? (
          <p className="sys-embedded-note">{locale === 'ar' ? capability.noteAr : capability.noteEn}</p>
        ) : null}
        {body}
        <footer className="sys-embedded-foot">{footer}</footer>
      </div>
    );
  }

  if (mode === 'side') {
    return (
      <div
        className="fixed end-3 top-14 bottom-20 z-50"
        style={{ width }}
        data-testid="system-workbench-side-shell"
      >
        <ServiceWorkbenchHost
          serviceId={serviceId}
        icon={ServiceIcon ? <ServiceIcon aria-hidden="true" /> : undefined}
          title={serviceLabel(serviceId, locale)}
          subtitle={locale === 'ar' ? 'سياق مقيس · للقراءة فقط' : 'Measured context · read-only'}
          locale={locale}
          mode="side"
          onModeChange={onModeChange}
          onClose={onClose}
          onResize={onResize}
          minWidth={380}
          maxWidth={860}
          testId="system-workbench"
          toolSelector={toolSelector}
          footer={footer}
        >
          {body}
        </ServiceWorkbenchHost>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-3 top-14 bottom-20 z-50" data-testid="system-workbench-expanded-shell">
      <ServiceWorkbenchHost
        serviceId={serviceId}
        icon={ServiceIcon ? <ServiceIcon aria-hidden="true" /> : undefined}
        title={serviceLabel(serviceId, locale)}
        subtitle={locale === 'ar' ? 'سياق مقيس · للقراءة فقط' : 'Measured context · read-only'}
        locale={locale}
        mode="expanded"
        onModeChange={onModeChange}
        onClose={onClose}
        testId="system-workbench-expanded"
        toolSelector={toolSelector}
        footer={footer}
      >
        {body}
      </ServiceWorkbenchHost>
    </div>
  );
}
