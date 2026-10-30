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
}

/**
 * Pinned or expanded service workbench. It renders on top of the measured
 * overview without unmounting it, so live samples keep flowing while a
 * workbench is open. The shared host owns chrome, resize, Escape and the rail
 * scroll; each service supplies its own specialized measured body.
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
}: SystemServiceWorkspaceProps) {
  const snapshot = controller.snapshot;
  const Component = SYSTEM_WORKBENCHES[serviceId];

  if (!snapshot || !Component) return null;

  const body = (
    <Component
      locale={locale}
      snapshot={snapshot}
      series={controller.series}
      controller={controller}
      onOpenService={(id) => {
        if (SERVICE_BY_ID[id] && hasSystemWorkbench(id)) onOpenService(id);
      }}
    />
  );
  const footer = (
    <span className="text-amber-300">
      {locale === 'ar'
        ? 'للقراءة فقط · لا كتابة للعملية أو الخدمة أو السجل أو الشبكة أو الطاقة'
        : 'Read-only · no process, service, driver, log, network or power write'}
    </span>
  );

  if (mode === 'side') {
    return (
      <div
        className="fixed end-3 top-14 bottom-20 z-50"
        style={{ width }}
        data-testid="system-workbench-side-shell"
      >
        <ServiceWorkbenchHost
          serviceId={serviceId}
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
