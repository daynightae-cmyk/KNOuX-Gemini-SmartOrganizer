import React from 'react';
import { CompactServiceDock } from '../components/workbench/CompactServiceDock';
import type { SystemLocale, SystemServiceState } from './catalog';
import { SERVICE_BY_ID, WORLD_META, shortServiceLabel } from './catalog';
import { formatBytes, formatClock, formatCount, formatPercent, formatRate, interfaceKind, t } from './model';
import type { SystemController } from './useSystem';

/**
 * Thirty-six measured System / Network / Hardware selectors rendered through the
 * shared CompactServiceDock, so System uses the same inner-workspace selection
 * pattern as the eight already-integrated domains.
 *
 * Selection only: the capability chip comes from the live SystemCapabilities
 * contract and the result string from the measured snapshot. A provider that
 * Windows did not answer is reported as unavailable here instead of being
 * back-filled with an estimate.
 */
export interface SystemServiceRailProps {
  locale: SystemLocale;
  controller: SystemController;
  /** Every registered System service id, in registry order. The dock scrolls and
   *  arrows through all 36; it is never narrowed by the overview's world tabs or
   *  search box. */
  ids: string[];
  selectedService: string | null;
  onOpenService: (id: string) => void;
  actions?: React.ReactNode;
}

const STATE_LABEL: Record<SystemServiceState, { en: string; ar: string }> = {
  available: { en: 'Measured', ar: 'مقيس' },
  partial: { en: 'Partial provider', ar: 'مزود جزئي' },
  gated: { en: 'Gated', ar: 'محمي' },
};

function capabilityLabel(id: string, c: SystemController, locale: SystemLocale): string {
  if (!c.nativeAvailable) return t(locale, 'Native unavailable', 'Native غير متاح');
  const capability = c.capabilities?.services.find((entry) => entry.id === id);
  if (capability) {
    const label = STATE_LABEL[capability.state];
    return locale === 'ar' ? label.ar : label.en;
  }
  const fallback = SERVICE_BY_ID[id]?.state;
  if (!fallback) return t(locale, 'Reading capabilities', 'قراءة القدرات');
  const label = STATE_LABEL[fallback];
  return locale === 'ar' ? label.ar : label.en;
}

/** Measured evidence per registry id. Returns undefined when nothing is measured yet. */
function measuredSummary(id: string, c: SystemController, locale: SystemLocale): string | undefined {
  const snapshot = c.snapshot;
  if (!snapshot) return undefined;
  const hardware = snapshot.hardware;
  const unavailable = t(locale, 'Provider unavailable', 'المزود غير متاح');
  const none = t(locale, 'None measured', 'لا شيء مقيس');

  switch (id) {
    case 'system-health-check': {
      const complete = snapshot.coverage.filter((stage) => stage.status === 'complete').length;
      return `${formatCount(complete)}/${formatCount(snapshot.coverage.length)} ${t(locale, 'stages complete', 'مرحلة مكتملة')}`;
    }
    case 'system-events':
      return snapshot.events.length
        ? `${formatCount(snapshot.events.length)} ${t(locale, 'bounded events', 'حدث محدود')}`
        : none;
    case 'system-processes':
      return `${formatCount(snapshot.processes.length)} ${t(locale, 'measured PIDs', 'معرف عملية مقيس')}`;
    case 'system-signatures':
      return c.signatureResult
        ? `${formatCount(c.signatureResult.verified)}/${formatCount(c.signatureResult.requested)} ${t(locale, 'verified', 'تم التحقق')}`
        : t(locale, 'Not verified yet', 'لم يتم التحقق بعد');
    case 'system-uptime':
      return snapshot.identity.uptimeSeconds == null
        ? unavailable
        : formatClock(snapshot.identity.uptimeSeconds);
    case 'system-perf':
      return `${formatCount(c.series.length)} ${t(locale, 'samples', 'عينة')} · ${formatPercent(snapshot.metrics.cpuPercent, 1)} CPU`;
    case 'system-drivers':
      return snapshot.drivers.length
        ? `${formatCount(snapshot.drivers.length)} ${t(locale, 'signed drivers', 'برنامج تشغيل موقع')}`
        : none;
    case 'system-logs':
      return snapshot.eventChannels.length
        ? `${formatCount(snapshot.eventChannels.length)} ${t(locale, 'channels', 'قناة')}`
        : none;
    case 'system-resources': {
      const top = [...snapshot.processes].sort((left, right) => (right.cpuPercent ?? -1) - (left.cpuPercent ?? -1))[0];
      return top ? `${top.name} · ${formatPercent(top.cpuPercent, 1)}` : none;
    }
    case 'system-autostart': {
      const linked = snapshot.startupLinks.filter((link) => link.processId != null || link.serviceName != null).length;
      return `${formatCount(linked)}/${formatCount(snapshot.startupLinks.length)} ${t(locale, 'links resolved', 'رابط محلول')}`;
    }
    case 'system-services-map':
      return `${formatCount(snapshot.services.length)} ${t(locale, 'nodes', 'عقدة')} · ${formatCount(snapshot.serviceEdges.length)} ${t(locale, 'edges', 'حافة')}`;
    case 'system-timeline':
      return snapshot.timeline.length
        ? `${formatCount(snapshot.timeline.length)} ${t(locale, 'lane events', 'حدث مسار')}`
        : none;
    case 'network-interfaces':
      return snapshot.interfaces.length
        ? `${formatCount(snapshot.interfaces.length)} ${t(locale, 'adapters', 'محول')}`
        : none;
    case 'network-dns-config': {
      const withResolvers = snapshot.interfaces.filter((entry) => (entry.dnsServers?.length ?? 0) > 0).length;
      return `${formatCount(withResolvers)}/${formatCount(snapshot.interfaces.length)} ${t(locale, 'with resolvers', 'بمحللات')}`;
    }
    case 'network-adapters': {
      const physical = snapshot.interfaces.filter((entry) => interfaceKind(entry) === 'physical').length;
      const virtual = snapshot.interfaces.filter((entry) => interfaceKind(entry) === 'virtual').length;
      return `${formatCount(physical)} ${t(locale, 'physical', 'فعلي')} · ${formatCount(virtual)} ${t(locale, 'virtual', 'افتراضي')}`;
    }
    case 'network-connectivity':
      return c.diagnostic
        ? `${c.diagnostic.ok ? t(locale, 'Passed', 'نجح') : t(locale, 'Failed', 'فشل')} · ${formatCount(c.diagnostic.stages.length)} ${t(locale, 'stages', 'مرحلة')}`
        : t(locale, 'On explicit request only', 'عند الطلب الصريح فقط');
    case 'network-throughput':
      return `${formatRate(snapshot.metrics.networkInBytesPerSec)} ↓ · ${formatRate(snapshot.metrics.networkOutBytesPerSec)} ↑`;
    case 'network-traceroute':
      return c.traceroute
        ? `${formatCount(c.traceroute.hops.length)} ${t(locale, 'hops', 'قفزة')} · ${c.traceroute.reached ? t(locale, 'reached', 'تم الوصول') : t(locale, 'not reached', 'لم يتم الوصول')}`
        : t(locale, 'Bounded trace on request', 'تتبع محدود عند الطلب');
    case 'network-topology':
      return `${formatCount(snapshot.neighbors.length)} ${t(locale, 'neighbors', 'جار')} · ${formatCount(snapshot.routes.length)} ${t(locale, 'routes', 'مسار')}`;
    case 'network-ports':
      return snapshot.sockets.length
        ? `${formatCount(snapshot.sockets.length)} ${t(locale, 'endpoints', 'نقطة نهاية')}`
        : none;
    case 'network-wifi':
      return snapshot.wifi.available
        ? snapshot.wifi.ssid
          ? `${snapshot.wifi.ssid} · ${formatPercent(snapshot.wifi.signalPercent, 0)}`
          : t(locale, 'Radio measured, no SSID', 'الراديو مقيس، لا يوجد SSID')
        : unavailable;
    case 'network-hosts':
      return snapshot.hosts.readable
        ? `${formatCount(snapshot.hosts.activeMappings)} ${t(locale, 'active mappings', 'تعيين نشط')}`
        : snapshot.hosts.exists
          ? t(locale, 'Not readable', 'غير قابل للقراءة')
          : t(locale, 'No hosts file', 'لا يوجد ملف hosts');
    case 'network-proxies':
      return `${formatCount(snapshot.proxies.lanes.length)} ${t(locale, 'lanes', 'مسار')} · ${snapshot.proxies.effective}`;
    case 'network-repair-link':
      return c.hostsPlan
        ? t(locale, 'Immutable preview staged', 'معاينة ثابتة مُهيأة')
        : t(locale, 'Preview only, execution gated', 'معاينة فقط، التنفيذ محمي');
    case 'hardware-inventory':
      return `${formatCount(hardware.totals.cores)} ${t(locale, 'cores', 'نواة')} · ${formatBytes(hardware.totals.memoryBytes)} · ${formatBytes(hardware.totals.diskBytes)}`;
    case 'hardware-battery':
      return hardware.batteries.length
        ? `${formatCount(hardware.batteries.length)} ${t(locale, 'batteries', 'بطارية')} · ${formatPercent(hardware.batteries[0].chargePercent, 0)}`
        : t(locale, 'No battery on this device', 'لا توجد بطارية في هذا الجهاز');
    case 'hardware-cpu':
      return hardware.availability.cpu
        ? `${formatCount(hardware.totals.cores)} ${t(locale, 'cores', 'نواة')} · ${formatCount(hardware.totals.logicalProcessors)} ${t(locale, 'logical', 'منطقي')}`
        : unavailable;
    case 'hardware-gpu':
      return hardware.gpu.length
        ? `${formatCount(hardware.gpu.length)} ${t(locale, 'adapters', 'محول')}`
        : unavailable;
    case 'hardware-memory':
      return hardware.memory.length
        ? `${formatCount(hardware.memory.length)} ${t(locale, 'modules', 'شريحة')} · ${formatBytes(hardware.totals.memoryBytes)}`
        : unavailable;
    case 'hardware-cycles': {
      const withCycles = hardware.batteries.filter((battery) => battery.cycleCountAvailable).length;
      return withCycles
        ? `${formatCount(withCycles)} ${t(locale, 'with cycle count', 'بعدد دورات')}`
        : t(locale, 'Windows reports no cycle counter', 'لا يبلّغ Windows عن عدّاد دورات');
    }
    case 'hardware-thermal':
      return hardware.thermal.available
        ? hardware.thermal.celsius == null
          ? t(locale, 'Sensor present, no reading', 'مستشعر موجود، بلا قراءة')
          : `${Math.round(hardware.thermal.celsius)} °C · ${hardware.thermal.provider ?? ''}`.trim()
        : unavailable;
    case 'hardware-disks':
      return hardware.disks.length
        ? `${formatCount(hardware.disks.length)} ${t(locale, 'disks', 'قرص')} · ${formatBytes(hardware.totals.diskBytes)}`
        : unavailable;
    case 'hardware-usb':
      return hardware.totals.usbDevices
        ? `${formatCount(hardware.totals.usbDevices)} ${t(locale, 'USB devices', 'جهاز USB')}`
        : unavailable;
    case 'hardware-display':
      return hardware.monitors.length
        ? `${formatCount(hardware.monitors.length)} ${t(locale, 'monitors', 'شاشة')}`
        : unavailable;
    case 'hardware-audio':
      return hardware.totals.audioEndpoints
        ? `${formatCount(hardware.totals.audioEndpoints)} ${t(locale, 'endpoints', 'نقطة صوت')}`
        : unavailable;
    case 'hardware-health-report':
      return c.report
        ? `${formatCount(c.report.sections.length)} ${t(locale, 'sections', 'قسم')} · ${c.report.redacted ? t(locale, 'redacted', 'مُنقّح') : t(locale, 'full', 'كامل')}`
        : t(locale, 'Built on request', 'يُبنى عند الطلب');
    default:
      return undefined;
  }
}

export function SystemServiceRail({ locale, controller, ids, selectedService, onOpenService, actions }: SystemServiceRailProps) {
  const items = ids.map((id) => {
    const entry = SERVICE_BY_ID[id];
    const Icon = entry?.icon;
    const capability = controller.capabilities?.services.find((service) => service.id === id);
    return {
      id,
      label: shortServiceLabel(id, locale),
      icon: Icon ? <Icon aria-hidden="true" /> : null,
      capability: capabilityLabel(id, controller, locale),
      result: measuredSummary(id, controller, locale),
      hint: capability
        ? `${capability.provider} · ${locale === 'ar' ? capability.noteAr : capability.noteEn}`
        : (entry ? (locale === 'ar' ? entry.blurbAr : entry.blurbEn) : id),
    };
  });

  const world = selectedService ? SERVICE_BY_ID[selectedService]?.world : undefined;
  const label = world
    ? `${WORLD_META[world][locale === 'ar' ? 'ar' : 'en']} · ${t(locale, 'measured services', 'الخدمات المقيسة')}`
    : t(locale, 'System, network and hardware services', 'خدمات النظام والشبكة والعتاد');

  return (
    <div className="sys-compact-dock" data-testid="system-services">
      <CompactServiceDock
        testIdPrefix="system"
        isArabic={locale === 'ar'}
        label={label}
        selectedId={selectedService}
        onSelect={onOpenService}
        items={items}
        actions={actions}
      />
    </div>
  );
}

export default SystemServiceRail;
