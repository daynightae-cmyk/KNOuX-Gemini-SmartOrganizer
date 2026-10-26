/**
 * KNOuX Live Pulse - canonical 36-service workbench map (Mission 10).
 *
 * Every registry descriptor resolves to one specialised measured component.
 * There is no generic fallback panel and no fixture source: a missing mapping
 * is a contract error, not a reason to invent readings.
 */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
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
}

/**
 * Full-height, focus-managed service sheet. It renders on top of the measured
 * overview without unmounting it, so live samples keep flowing while a
 * workbench is open and every panel keeps its own inner scroll.
 */
export function SystemServiceWorkspace({ serviceId, locale, controller, onOpenService, onClose }: SystemServiceWorkspaceProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const snapshot = controller.snapshot;
  const Component = SYSTEM_WORKBENCHES[serviceId];

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
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!snapshot || !Component) return null;

  return (
    <div className="sys-service-overlay" role="dialog" aria-modal="true" aria-label={serviceLabel(serviceId, locale)}>
      <div className="sys-service-scrim" aria-hidden="true" onClick={onClose} />
      <div className="sys-service-sheet" data-testid={`sys-service-shell-${serviceId}`} ref={sheetRef}>
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
        <div className="sys-service-sheet-scroll">
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
      </div>
    </div>
  );
}
