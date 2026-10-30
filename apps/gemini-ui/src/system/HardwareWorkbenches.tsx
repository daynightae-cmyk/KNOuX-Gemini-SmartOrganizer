/**
 * KNOuX Live Pulse - hardware world workbenches (services 25-36).
 *
 * Every hardware value is read from the measured CIM/PnP snapshot. Missing
 * thermal zones, HDR flags, default audio endpoints, cycle counters and SMART
 * attributes remain explicitly unknown; no sensor or capability is invented.
 */
import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Database,
  FileCode2,
  Gauge as GaugeIcon,
  HardDrive,
  Info,
  Layers,
  MemoryStick,
  Monitor,
  MonitorPlay,
  RefreshCw,
  Repeat,
  Search,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Usb,
  Volume2,
  Wrench,
} from 'lucide-react';
import type {
  SystemAudioEndpoint,
  SystemBatteryInfo,
  SystemCpuInfo,
  SystemDiskInfo,
  SystemGpuInfo,
  SystemHardwareSnapshot,
  SystemMemoryModule,
  SystemMonitorInfo,
  SystemUsbNode,
} from '../../shared/native-contracts';
import type { SystemLocale } from './catalog';
import type { WorkbenchProps } from './types';
import {
  flattenUsbTree,
  formatBytes,
  formatCount,
  formatDate,
  formatMHz,
  formatPercent,
  formatTimestamp,
  percentageTone,
  t,
  type Tone,
} from './model';
import {
  Chip,
  CodeBlock,
  CopyButton,
  DataRows,
  EmptyBlock,
  ExportButton,
  Field,
  Gauge,
  InfoNote,
  KeyValueGrid,
  MeterBar,
  MiniStat,
  Panel,
  SearchBox,
  Seg,
  Toggle,
  WorkbenchFrame,
  cx,
} from './ui';

const AR = 'ar';

function orDash(value: string | number | null | undefined): string {
  if (value == null) return '—';
  const text = String(value).trim();
  return text ? text : '—';
}

function availabilityTone(available: boolean): Tone {
  return available ? 'good' : 'muted';
}

/* ------------------------------------------------------------------------- */
/* 25 - Device Hardware Atlas                                                */
/* ------------------------------------------------------------------------- */

const AVAILABILITY_LABELS: Array<{ key: keyof SystemHardwareSnapshot['availability']; en: string; ar: string }> = [
  { key: 'cpu', en: 'CPU', ar: 'المعالج' },
  { key: 'gpu', en: 'GPU', ar: 'الرسوميات' },
  { key: 'memory', en: 'Memory', ar: 'الذاكرة' },
  { key: 'disks', en: 'Disks', ar: 'الأقراص' },
  { key: 'batteries', en: 'Battery', ar: 'البطارية' },
  { key: 'usb', en: 'USB', ar: 'USB' },
  { key: 'monitors', en: 'Displays', ar: 'الشاشات' },
  { key: 'audio', en: 'Audio', ar: 'الصوت' },
  { key: 'thermal', en: 'Thermal', ar: 'الحرارة' },
  { key: 'smart', en: 'SMART', ar: 'SMART' },
];

export function HardwareInventoryWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const hardware = snapshot.hardware;
  const [tab, setTab] = useState<'overview' | 'components' | 'problems'>('overview');
  const [includeIdentifiers, setIncludeIdentifiers] = useState(false);
  const totals = hardware.totals;

  const exportPayload = useMemo(() => {
    if (includeIdentifiers) return hardware;
    return {
      ...hardware,
      disks: hardware.disks.map((disk) => ({ ...disk, serial: null, deviceId: null })),
      monitors: hardware.monitors.map((monitor) => ({ ...monitor, pnpDeviceId: null })),
      audio: hardware.audio.map((endpoint) => ({ ...endpoint, pnpDeviceId: null })),
      usb: hardware.usb.map((node) => ({ ...node, pnpDeviceId: null })),
      problemDevices: hardware.problemDevices.map((device) => ({ ...device, pnpDeviceId: null })),
    };
  }, [hardware, includeIdentifiers]);

  return (
    <WorkbenchFrame
      id="hardware-inventory"
      locale={locale}
      provider="CIM + PnP inventory"
      foot={
        <>
          <span><Database aria-hidden="true" />{formatCount(snapshot.sources.length)} {t(locale, 'native source groups', 'مجموعة مصدر أصلي')} · {formatTimestamp(snapshot.generatedAt, locale)}</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'Device changes and driver operations are not exposed.', 'تغييرات الأجهزة وعمليات برامج التشغيل غير متاحة.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Seg
          value={tab}
          onChange={setTab}
          ariaLabel={t(locale, 'Inventory view', 'عرض الجرد')}
          options={[
            { value: 'overview', label: t(locale, 'Overview', 'نظرة عامة') },
            { value: 'components', label: t(locale, 'Components', 'المكونات') },
            { value: 'problems', label: t(locale, 'Problem devices', 'الأجهزة المعطوبة') },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <Toggle checked={includeIdentifiers} onChange={setIncludeIdentifiers} label={t(locale, 'Include identifiers', 'تضمين المعرفات')} />
        <ExportButton
          fileName="knoux-hardware-atlas.json"
          payload={{ observedAt: snapshot.generatedAt, receipt: snapshot.receipt, hardware: exportPayload }}
          label={t(locale, 'Export atlas', 'تصدير الأطلس')}
          onDone={(ok) => controller.showNotice(ok ? t(locale, 'Hardware atlas exported.', 'صُدّد أطلس العتاد.') : t(locale, 'The hardware export could not start.', 'تعذّر بدء تصدير العتاد.'))}
        />
      </div>

      <div className="sys-mini-row">
        <MiniStat label={t(locale, 'CPU cores', 'نوى المعالج')} value={formatCount(totals.cores)} icon={Cpu} />
        <MiniStat label={t(locale, 'Logical processors', 'المعالجات المنطقية')} value={formatCount(totals.logicalProcessors)} />
        <MiniStat label={t(locale, 'Installed memory', 'الذاكرة المثبتة')} value={formatBytes(totals.memoryBytes)} icon={MemoryStick} />
        <MiniStat label={t(locale, 'Physical disk capacity', 'سعة الأقراص الفعلية')} value={formatBytes(totals.diskBytes)} icon={HardDrive} />
      </div>

      {tab === 'overview' ? (
        <div className="sys-hw-overview">
          <Panel title={t(locale, 'Component availability', 'توفر المكونات')} sub={t(locale, 'Measured provider answers, not capability guesses.', 'إجابات المزود المقيسة، وليست تخمينات قدرات.')} icon={Boxes}>
            <div className="sys-availability-grid">
              {AVAILABILITY_LABELS.map((entry) => (
                <div className={cx('sys-availability-card', hardware.availability[entry.key] ? 'is-on' : 'is-off')} key={entry.key}>
                  <span className="sys-availability-dot" aria-hidden="true" />
                  <strong>{locale === AR ? entry.ar : entry.en}</strong>
                  <em>{hardware.availability[entry.key] ? t(locale, 'Measured', 'مقيس') : t(locale, 'Unavailable', 'غير متاح')}</em>
                </div>
              ))}
            </div>
          </Panel>

          <div className="sys-split-2">
            <Panel title={t(locale, 'Machine identity', 'هوية الجهاز')} icon={Monitor}>
              <KeyValueGrid>
                <Field label={t(locale, 'Manufacturer', 'المصنّع')} value={orDash(hardware.system.manufacturer)} />
                <Field label={t(locale, 'Model', 'الطراز')} value={orDash(hardware.system.model)} />
                <Field label={t(locale, 'Baseboard', 'اللوحة الأساسية')} value={orDash([hardware.system.baseboardManufacturer, hardware.system.baseboardProduct].filter(Boolean).join(' '))} />
                <Field label={t(locale, 'BIOS', 'BIOS')} value={orDash([hardware.system.biosVendor, hardware.system.biosVersion].filter(Boolean).join(' '))} />
                <Field label={t(locale, 'BIOS date', 'تاريخ BIOS')} value={formatDate(hardware.system.biosDate, locale)} />
                <Field label={t(locale, 'Operating system', 'نظام التشغيل')} value={orDash(snapshot.identity.osName)} />
              </KeyValueGrid>
            </Panel>
            <Panel title={t(locale, 'Counted components', 'المكونات المعدودة')} icon={Layers}>
              <DataRows
                rows={[
                  { label: t(locale, 'Graphics adapters', 'محولات الرسوميات'), value: formatCount(hardware.gpu.length) },
                  { label: t(locale, 'Memory modules', 'شرائح الذاكرة'), value: formatCount(hardware.memory.length) },
                  { label: t(locale, 'Physical disks', 'الأقراص الفعلية'), value: formatCount(hardware.disks.length) },
                  { label: t(locale, 'Batteries', 'البطاريات'), value: formatCount(hardware.batteries.length) },
                  { label: t(locale, 'USB nodes', 'عقد USB'), value: formatCount(hardware.usb.length) },
                  { label: t(locale, 'Monitors', 'الشاشات'), value: formatCount(hardware.monitors.length) },
                  { label: t(locale, 'Audio endpoints', 'نقاط الصوت'), value: formatCount(hardware.audio.length) },
                  { label: t(locale, 'Thermal zones', 'مناطق حرارية'), value: formatCount(hardware.thermal.zones.length) },
                ]}
              />
            </Panel>
          </div>
        </div>
      ) : tab === 'components' ? (
        <div className="sys-hw-components">
          <Panel title={t(locale, 'Processor', 'المعالج')} icon={Cpu} bodyClassName="sys-panel-body-flush">
            <DataRows rows={hardware.cpu.map((entry) => ({ label: entry.name, value: `${entry.cores ?? '—'}C / ${entry.logicalProcessors ?? '—'}T · ${formatMHz(entry.maxClockMHz)}` }))} empty={<em className="sys-muted-text">{t(locale, 'No processor row returned.', 'لم يُعد صف معالج.')}</em>} />
          </Panel>
          <Panel title={t(locale, 'Graphics', 'الرسوميات')} icon={MonitorPlay} bodyClassName="sys-panel-body-flush">
            <DataRows rows={hardware.gpu.map((entry) => ({ label: entry.name, value: `${formatBytes(entry.adapterRamBytes)} · ${entry.driverVersion || '—'}` }))} empty={<em className="sys-muted-text">{t(locale, 'No graphics adapter returned.', 'لم يُعد محول رسوميات.')}</em>} />
          </Panel>
          <Panel title={t(locale, 'Memory', 'الذاكرة')} icon={MemoryStick} bodyClassName="sys-panel-body-flush">
            <DataRows rows={hardware.memory.map((entry) => ({ label: `${entry.locator || t(locale, 'Module', 'شريحة')} · ${entry.manufacturer || '—'}`, value: `${formatBytes(entry.capacityBytes)} · ${formatMHz(entry.configuredSpeedMHz || entry.speedMHz)}` }))} empty={<em className="sys-muted-text">{t(locale, 'No memory module returned.', 'لم تُعد شريحة ذاكرة.')}</em>} />
          </Panel>
          <Panel title={t(locale, 'Disks', 'الأقراص')} icon={HardDrive} bodyClassName="sys-panel-body-flush">
            <DataRows rows={hardware.disks.map((entry) => ({ label: entry.model, value: `${formatBytes(entry.sizeBytes)} · ${entry.healthStatus || '—'}` }))} empty={<em className="sys-muted-text">{t(locale, 'No physical disk returned.', 'لم يُعد قرص فعلي.')}</em>} />
          </Panel>
          <Panel title={t(locale, 'Batteries', 'البطاريات')} icon={BatteryCharging} bodyClassName="sys-panel-body-flush">
            <DataRows rows={hardware.batteries.map((entry) => ({ label: entry.name, value: `${formatPercent(entry.chargePercent)} · ${entry.status || '—'}` }))} empty={<em className="sys-muted-text">{t(locale, 'No battery returned.', 'لم تُعد بطارية.')}</em>} />
          </Panel>
          <Panel title={t(locale, 'Displays', 'الشاشات')} icon={Monitor} bodyClassName="sys-panel-body-flush">
            <DataRows rows={hardware.monitors.map((entry) => ({ label: entry.name, value: `${entry.width ?? '—'}×${entry.height ?? '—'} @ ${entry.refreshHz ?? '—'} Hz` }))} empty={<em className="sys-muted-text">{t(locale, 'No monitor returned.', 'لم تُعد شاشة.')}</em>} />
          </Panel>
          <Panel title={t(locale, 'Audio', 'الصوت')} icon={Volume2} bodyClassName="sys-panel-body-flush">
            <DataRows rows={hardware.audio.map((entry) => ({ label: entry.name, value: `${entry.kind} · ${entry.status || '—'}` }))} empty={<em className="sys-muted-text">{t(locale, 'No audio endpoint returned.', 'لم تُعد نقطة صوت.')}</em>} />
          </Panel>
          <Panel title={t(locale, 'USB', 'USB')} icon={Usb} bodyClassName="sys-panel-body-flush">
            <DataRows rows={hardware.usb.slice(0, 20).map((entry) => ({ label: entry.name, value: entry.nodeType }))} empty={<em className="sys-muted-text">{t(locale, 'No USB node returned.', 'لم تُعد عقدة USB.')}</em>} />
          </Panel>
        </div>
      ) : (
        <Panel title={t(locale, 'Problem devices', 'الأجهزة المعطوبة')} sub={t(locale, 'CIM ConfigManagerErrorCode is not zero for these rows.', 'رمز خطأ مدير التكوين في CIM ليس صفرًا لهذه الصفوف.')} icon={AlertTriangle} bodyClassName="sys-panel-body-flush">
          {hardware.problemDevices.length ? (
            <div className="sys-table-wrap">
              <table className="sys-table">
                <thead>
                  <tr>
                    <th>{t(locale, 'Device', 'الجهاز')}</th>
                    <th>{t(locale, 'Manufacturer', 'المصنّع')}</th>
                    <th>{t(locale, 'Problem code', 'رمز المشكلة')}</th>
                  </tr>
                </thead>
                <tbody>
                  {hardware.problemDevices.map((device) => (
                    <tr key={device.id}>
                      <td><strong className="sys-row-name">{device.name}</strong><span className="sys-row-sub sys-mono">{device.pnpDeviceId || '—'}</span></td>
                      <td>{device.manufacturer || '—'}</td>
                      <td><Chip tone="bad">{device.problemCode ?? t(locale, 'Unknown', 'مجهول')}</Chip></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyBlock icon={CheckCircle2} title={t(locale, 'No problem device reported', 'لم يُبلَّغ عن جهاز معطوب')} message={t(locale, 'Win32_PnPEntity returned no device with a non-zero configuration error code.', 'لم يُعد Win32_PnPEntity أي جهاز برمز خطأ تكوين غير صفري.')} />
          )}
        </Panel>
      )}

      <InfoNote tone="muted">
        {t(locale, 'Identifiers are excluded from exports until you enable them. Inventory values are provider-reported and may be incomplete on virtualized hardware; unavailable fields remain “unknown” rather than being filled from a model name.', 'تُستثنى المعرفات من التصدير حتى تفعّلها. قيم الجرد يبلّغ عنها المزود وقد تكون ناقصة على العتاد الافتراضي؛ تبقى الحقول غير المتاحة «مجهولة» بدل ملئها من اسم الطراز.')}
      </InfoNote>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 26 - Battery Charge & Health                                              */
/* ------------------------------------------------------------------------- */

export function BatteryWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const batteries = snapshot.hardware.batteries;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = batteries.find((battery) => battery.id === selectedId) || batteries[0] || null;
  const health = selected?.healthPercent ?? (selected?.fullChargeCapacityMilliWattHours && selected?.designCapacityMilliWattHours
    ? (selected.fullChargeCapacityMilliWattHours / selected.designCapacityMilliWattHours) * 100
    : null);
  const charging = selected?.charging === true || String(selected?.status || '').toLowerCase().includes('charg');
  const draining = selected?.discharging === true || String(selected?.status || '').toLowerCase().includes('discharg');
  const energy = selected?.fullChargeCapacityMilliWattHours != null ? selected.fullChargeCapacityMilliWattHours / 1000 : null;

  return (
    <WorkbenchFrame
      id="hardware-battery"
      locale={locale}
      state="partial"
      provider="Win32_Battery + BatteryStatus + BatteryStaticData"
      foot={
        <>
          <span><BatteryCharging aria-hidden="true" />{formatCount(batteries.length)} {t(locale, 'battery devices', 'جهاز بطارية')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'Power plan changes are not exposed.', 'تغييرات خطة الطاقة غير متاحة.')}</span>
        </>
      }
    >
      {batteries.length ? (
        <>
          {batteries.length > 1 ? (
            <div className="sys-toolbar-row">
              <Seg
                value={selected?.id || ''}
                onChange={setSelectedId}
                ariaLabel={t(locale, 'Select battery', 'اختر البطارية')}
                options={batteries.map((battery) => ({ value: battery.id, label: battery.name }))}
              />
            </div>
          ) : null}

          <div className="sys-battery-hero">
            <div className="sys-battery-gauge">
              <Gauge value={selected?.chargePercent} label={t(locale, 'Charge', 'الشحن')} sub={selected?.status || undefined} color={charging ? '#34d399' : draining ? '#fbbf24' : '#22d3ee'} size={160} />
              <div className="sys-battery-identity">
                <span>{t(locale, 'Battery device', 'جهاز البطارية')}</span>
                <strong>{selected?.name}</strong>
                <em>{selected?.manufacturer || t(locale, 'Manufacturer not returned', 'المصنّع غير متاح')} · {selected?.chemistry || t(locale, 'Chemistry unknown', 'الكيمياء مجهولة')}</em>
                <div className="sys-battery-chips">
                  <Chip tone={selected?.powerOnline ? 'good' : 'muted'} icon={BatteryCharging}>{selected?.powerOnline == null ? t(locale, 'Power source unknown', 'مصدر الطاقة مجهول') : selected.powerOnline ? t(locale, 'AC connected', 'متصل بالتيار') : t(locale, 'On battery', 'على البطارية')}</Chip>
                  <Chip tone={charging ? 'good' : draining ? 'warn' : 'muted'}>{charging ? t(locale, 'Charging', 'يشحن') : draining ? t(locale, 'Discharging', 'يفرغ') : t(locale, 'Idle / unknown', 'خامل / مجهول')}</Chip>
                </div>
              </div>
            </div>

            <div className="sys-battery-facts">
              <KeyValueGrid>
                <Field label={t(locale, 'Charge', 'الشحن')} value={formatPercent(selected?.chargePercent)} tone={percentageTone(selected?.chargePercent, 25, 12)} />
                <Field label={t(locale, 'Health (derived)', 'الصحة (مشتقة)')} value={health == null ? t(locale, 'Unknown', 'مجهول') : `${health.toFixed(1)}%`} tone={health == null ? 'muted' : health >= 80 ? 'good' : health >= 60 ? 'warn' : 'bad'} />
                <Field label={t(locale, 'Design capacity', 'السعة التصميمية')} value={selected?.designCapacityMilliWattHours == null ? '—' : `${formatCount(selected.designCapacityMilliWattHours)} mWh`} />
                <Field label={t(locale, 'Full charge capacity', 'سعة الشحن الكامل')} value={selected?.fullChargeCapacityMilliWattHours == null ? '—' : `${formatCount(selected.fullChargeCapacityMilliWattHours)} mWh`} />
                <Field label={t(locale, 'Estimated runtime', 'مدة التشغيل المقدرة')} value={selected?.estimatedRunTimeMinutes == null ? '—' : `${formatCount(selected.estimatedRunTimeMinutes)} min`} />
                <Field label={t(locale, 'Voltage', 'الجهد')} value={selected?.voltageMillivolts == null ? '—' : `${formatCount(selected.voltageMillivolts)} mV`} />
                <Field label={t(locale, 'Cycle count', 'عدد الدورات')} value={selected?.cycleCountAvailable ? formatCount(selected.cycleCount) : t(locale, 'Not exposed by Windows', 'غير متاح عبر Windows')} tone={selected?.cycleCountAvailable ? 'info' : 'muted'} />
                <Field label={t(locale, 'Energy (derived)', 'الطاقة (مشتقة)')} value={energy == null ? '—' : `${energy.toFixed(1)} Wh`} />
              </KeyValueGrid>
            </div>
          </div>

          <div className="sys-split-2">
            <Panel title={t(locale, 'Charge history in this session', 'سجل الشحن في هذه الجلسة')} icon={Activity}>
              <p className="sys-muted-text">
                {t(locale, 'The provider returns an instantaneous charge reading, not a battery history. No charge curve is drawn because no historical samples exist in this contract.', 'يعيد المزود قراءة شحن لحظية وليست سجل بطارية. لا يُرسم منحنى شحن لعدم وجود عينات تاريخية في هذا العقد.')}
              </p>
              <MeterBar label={t(locale, 'Current charge', 'الشحن الحالي')} value={selected?.chargePercent} tone={percentageTone(selected?.chargePercent, 25, 12)} caption={formatPercent(selected?.chargePercent)} height={10} />
              <MeterBar label={t(locale, 'Measured health', 'الصحة المقيسة')} value={health} tone={health == null ? 'muted' : health >= 80 ? 'good' : health >= 60 ? 'warn' : 'bad'} caption={health == null ? '—' : `${health.toFixed(1)}%`} height={10} />
            </Panel>
            <Panel title={t(locale, 'Health derivation', 'اشتقاق الصحة')} icon={Info}>
              <CodeBlock label={t(locale, 'Formula', 'المعادلة')}>{'healthPercent = fullChargeCapacityMilliWattHours / designCapacityMilliWattHours × 100'}</CodeBlock>
              <InfoNote tone="muted">
                {t(locale, 'Health is derived only when both measured capacities are present. Windows does not expose cycle count on every battery; when it is absent the field stays unknown.', 'تُشتق الصحة فقط عند وجود سعتي القياس. لا يتيح Windows عدد الدورات لكل بطارية؛ وعند غيابه يبقى الحقل مجهولًا.')}
              </InfoNote>
              <div className="sys-toolbar-row">
                <CopyButton locale={locale} text={selected?.deviceId} label={t(locale, 'Copy device ID', 'نسخ معرف الجهاز')} />
                <ExportButton
                  fileName="knoux-battery.json"
                  payload={batteries}
                  label={t(locale, 'Export battery evidence', 'تصدير أدلة البطارية')}
                  onDone={(ok) => controller.showNotice(ok ? t(locale, 'Battery evidence exported.', 'صُدّدت أدلة البطارية.') : t(locale, 'The battery export could not start.', 'تعذّر بدء تصدير البطارية.'))}
                />
              </div>
            </Panel>
          </div>
        </>
      ) : (
        <>
          <EmptyBlock icon={BatteryCharging} title={t(locale, 'No battery reported', 'لم تُبلَّغ أي بطارية')} message={t(locale, 'Win32_Battery returned no device. This is normal on a desktop; no synthetic battery or charge value is shown.', 'لم يُعد Win32_Battery أي جهاز. هذا طبيعي على سطح المكتب؛ لا تُعرض بطارية أو قيمة شحن اصطناعية.')} />
          <Panel title={t(locale, 'What is not claimed', 'ما لا يُدّعى')} icon={ShieldAlert}>
            <DataRows
              rows={[
                { label: t(locale, 'Charge level', 'مستوى الشحن'), value: t(locale, 'Not measured', 'غير مقيس'), tone: 'muted' },
                { label: t(locale, 'Design capacity', 'السعة التصميمية'), value: t(locale, 'Not measured', 'غير مقيسة'), tone: 'muted' },
                { label: t(locale, 'Full charge capacity', 'سعة الشحن الكامل'), value: t(locale, 'Not measured', 'غير مقيسة'), tone: 'muted' },
                { label: t(locale, 'Cycle count', 'عدد الدورات'), value: t(locale, 'Not measured', 'غير مقيس'), tone: 'muted' },
              ]}
            />
            <InfoNote tone="muted">
              {t(locale, 'A desktop or virtual machine may expose no battery. The instrument stays explicitly empty instead of drawing a charge, health or runtime estimate from nothing.', 'قد لا يكشف سطح المكتب أو الجهاز الافتراضي أي بطارية. تبقى الأداة فارغة صراحةً بدل رسم شحن أو صحة أو مدة تشغيل من لا شيء.')}
            </InfoNote>
            <div className="sys-toolbar-row">
              <button type="button" className="sys-btn sys-btn-quiet" onClick={() => controller.refreshSnapshot(true)} disabled={controller.refreshing}>
                <RefreshCw aria-hidden="true" />
                {t(locale, 'Re-read hardware', 'إعادة قراءة العتاد')}
              </button>
              <ExportButton
                fileName="knoux-battery.json"
                payload={batteries}
                label={t(locale, 'Export empty battery evidence', 'تصدير أدلة بطارية فارغة')}
                onDone={(ok) => controller.showNotice(ok ? t(locale, 'Battery evidence exported.', 'صُدّدت أدلة البطارية.') : t(locale, 'The battery export could not start.', 'تعذّر بدء تصدير البطارية.'))}
              />
            </div>
          </Panel>
          <Panel title={t(locale, 'Instrument contract', 'عقد الأداة')} icon={Database}>
            <DataRows
              rows={[
                { label: t(locale, 'Source', 'المصدر'), value: 'Win32_Battery · root/WMI BatteryStaticData · BatteryFullChargedCapacity' },
                { label: t(locale, 'Scope', 'النطاق'), value: t(locale, 'Physical batteries only; a desktop or virtual machine returns no row', 'البطاريات الفعلية فقط؛ سطح المكتب أو الجهاز الافتراضي لا يُعيد أي صف'), tone: 'muted' },
                { label: t(locale, 'Charge math', 'حساب الشحن'), value: t(locale, 'Ratios of measured capacities only; never a default value', 'نسب من السعات المقيسة فقط؛ لا قيمة افتراضية أبدًا'), tone: 'muted' },
                { label: t(locale, 'Mutation', 'الكتابة'), value: t(locale, 'None; power and thermal policy is gated to Mission 14', 'لا توجد؛ سياسة الطاقة والحرارة محجوبة للمهمة 14'), tone: 'muted' },
              ]}
            />
          </Panel>
        </>
      )}
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 27 - Processor Architecture & Core Die                                    */
/* ------------------------------------------------------------------------- */

export function CpuWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const cpus = snapshot.hardware.cpu;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = cpus.find((cpu) => cpu.id === selectedId) || cpus[0] || null;
  const [showId, setShowId] = useState(false);

  return (
    <WorkbenchFrame
      id="hardware-cpu"
      locale={locale}
      provider="Win32_Processor"
      foot={
        <>
          <span><Cpu aria-hidden="true" />{formatCount(cpus.length)} {t(locale, 'processor package(s)', 'حزمة معالج')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'Clock and cache values are the provider-reported maxima.', 'قيم التردد والذاكرة المخبئية هي الحدود القصوى التي يبلغ عنها المزود.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        {cpus.length > 1 ? (
          <Seg value={selected?.id || ''} onChange={setSelectedId} ariaLabel={t(locale, 'Select processor', 'اختر المعالج')} options={cpus.map((cpu, index) => ({ value: cpu.id, label: `CPU ${index + 1}` }))} />
        ) : null}
        <span className="sys-toolbar-spacer" />
        <Toggle checked={showId} onChange={setShowId} label={t(locale, 'Show processor ID', 'إظهار معرف المعالج')} />
      </div>

      {selected ? (
        <>
          <div className="sys-cpu-hero">
            <div className="sys-cpu-die" aria-hidden="true">
              <span className="sys-cpu-die-core" />
              <span className="sys-cpu-die-label">CPU</span>
              <span className="sys-cpu-die-pins" />
            </div>
            <div className="sys-cpu-identity">
              <span>{t(locale, 'Processor package', 'حزمة المعالج')}</span>
              <strong>{selected.name}</strong>
              <em>{selected.vendor || t(locale, 'Vendor not returned', 'المصنّع غير متاح')} · {selected.architecture || '—'} · {selected.socket || t(locale, 'Socket unknown', 'المقبس مجهول')}</em>
              <div className="sys-cpu-chips">
                <Chip tone="info">{selected.cores == null ? '—' : `${selected.cores} ${t(locale, 'cores', 'نواة')}`}</Chip>
                <Chip tone="violet">{selected.logicalProcessors == null ? '—' : `${selected.logicalProcessors} ${t(locale, 'threads', 'خيط')}`}</Chip>
                <Chip tone="good">{formatMHz(selected.maxClockMHz)}</Chip>
              </div>
            </div>
          </div>

          <div className="sys-split-2">
            <Panel title={t(locale, 'Core topology', 'طوبولوجيا النوى')} icon={Layers}>
              <div className="sys-core-grid">
                {Array.from({ length: Math.min(64, selected.cores || 0) }).map((_, index) => (
                  <span className="sys-core-cell" key={index} title={`${t(locale, 'Core', 'نواة')} ${index + 1}`} />
                ))}
                {!selected.cores ? <em className="sys-muted-text">{t(locale, 'Core count was not returned; no die is drawn.', 'لم يُعد عدد النوى؛ لا يُرسم قالب.')}</em> : null}
              </div>
              <InfoNote tone="muted">
                {t(locale, 'The grid mirrors the measured physical core count. It is a topology summary, not per-core utilisation; per-core counters are not collected by this provider.', 'تعكس الشبكة عدد النوى الفعلية المقيس. وهي ملخص طوبولوجيا وليست استغلالًا لكل نواة؛ لا تُجمع عدادات لكل نواة عبر هذا المزود.')}
              </InfoNote>
            </Panel>
            <Panel title={t(locale, 'Package facts', 'حقائق الحزمة')} icon={Cpu}>
              <KeyValueGrid>
                <Field label={t(locale, 'Physical cores', 'النوى الفعلية')} value={formatCount(selected.cores)} />
                <Field label={t(locale, 'Logical processors', 'المعالجات المنطقية')} value={formatCount(selected.logicalProcessors)} />
                <Field label={t(locale, 'Max clock', 'أقصى تردد')} value={formatMHz(selected.maxClockMHz)} />
                <Field label={t(locale, 'Socket', 'المقبس')} value={selected.socket || '—'} />
                <Field label={t(locale, 'Architecture', 'البنية')} value={selected.architecture || '—'} />
                <Field label={t(locale, 'L2 cache', 'ذاكرة L2')} value={formatBytes(selected.l2CacheBytes)} />
                <Field label={t(locale, 'L3 cache', 'ذاكرة L3')} value={formatBytes(selected.l3CacheBytes)} />
                <Field label={t(locale, 'Firmware virtualization', 'المحاكاة في البرنامج الثابت')} value={selected.virtualizationFirmwareEnabled == null ? t(locale, 'Unknown', 'مجهول') : selected.virtualizationFirmwareEnabled ? t(locale, 'Enabled', 'ممكّن') : t(locale, 'Disabled', 'معطّل')} tone={selected.virtualizationFirmwareEnabled ? 'good' : 'muted'} />
                <Field label={t(locale, 'VM monitor extensions', 'امتدادات مراقب VM')} value={selected.vmMonitorModeExtensions == null ? t(locale, 'Unknown', 'مجهول') : selected.vmMonitorModeExtensions ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا')} />
              </KeyValueGrid>
              {showId ? <CodeBlock label={t(locale, 'Processor ID', 'معرف المعالج')}>{selected.processorId || t(locale, 'Not returned.', 'غير متاح.')}</CodeBlock> : null}
              <div className="sys-toolbar-row">
                <CopyButton locale={locale} text={selected.name} label={t(locale, 'Copy model', 'نسخ الطراز')} />
                <ExportButton
                  fileName="knoux-processor.json"
                  payload={cpus}
                  label={t(locale, 'Export CPU evidence', 'تصدير أدلة المعالج')}
                  onDone={(ok) => controller.showNotice(ok ? t(locale, 'Processor evidence exported.', 'صُدّدت أدلة المعالج.') : t(locale, 'The processor export could not start.', 'تعذّر بدء تصدير المعالج.'))}
                />
              </div>
            </Panel>
          </div>

          <Panel title={t(locale, 'Live processor counters', 'عدادات المعالج الحية')} icon={Activity}>
            <div className="sys-grid-3">
              <MiniStat label={t(locale, 'CPU load', 'حمل المعالج')} value={formatPercent(snapshot.metrics.cpuPercent, 1)} tone={percentageTone(snapshot.metrics.cpuPercent)} />
              <MiniStat label={t(locale, 'Frequency', 'التردد')} value={formatMHz(snapshot.metrics.cpuFrequencyMHz)} />
              <MiniStat label={t(locale, 'Logical processors', 'المعالجات المنطقية')} value={formatCount(snapshot.metrics.threadCount)} />
            </div>
          </Panel>
        </>
      ) : (
        <EmptyBlock icon={Cpu} title={t(locale, 'No processor returned', 'لم يُعد معالج')} message={t(locale, 'Win32_Processor returned no row; no architecture is invented.', 'لم يُعد Win32_Processor أي صف؛ لا تُختلق بنية.')} />
      )}
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 28 - Graphics Adapter Bay                                                 */
/* ------------------------------------------------------------------------- */

export function GpuWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const gpus = snapshot.hardware.gpu;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = gpus.find((gpu) => gpu.id === selectedId) || gpus[0] || null;

  return (
    <WorkbenchFrame
      id="hardware-gpu"
      locale={locale}
      state="partial"
      provider="Win32_VideoController + PnP"
      foot={
        <>
          <span><MonitorPlay aria-hidden="true" />{formatCount(gpus.length)} {t(locale, 'graphics adapter(s)', 'محول رسوميات')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'DirectX/Vulkan capability is not inferred from an adapter name.', 'لا تُستنتج قدرة DirectX/Vulkan من اسم المحول.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <span className="sys-toolbar-spacer" />
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.openSettings('display')} disabled={controller.busy === 'settings'}>
          <Wrench aria-hidden="true" />
          {t(locale, 'Windows display settings', 'إعدادات العرض في Windows')}
        </button>
      </div>

      <div className="sys-gpu-bay">
        {gpus.map((gpu) => (
          <button type="button" key={gpu.id} className={cx('sys-gpu-card', selected?.id === gpu.id && 'is-active')} onClick={() => setSelectedId(gpu.id)}>
            <span className="sys-gpu-fan" aria-hidden="true"><MonitorPlay /></span>
            <span className="sys-gpu-copy">
              <strong>{gpu.name}</strong>
              <em>{gpu.vendor || t(locale, 'Vendor not returned', 'المصنّع غير متاح')}</em>
              <span className="sys-mono">{gpu.driverVersion || t(locale, 'Driver unknown', 'البرنامج مجهول')}</span>
            </span>
            <Chip tone={String(gpu.status).toLowerCase() === 'ok' ? 'good' : 'warn'}>{gpu.status || t(locale, 'Unknown', 'مجهول')}</Chip>
          </button>
        ))}
        {!gpus.length ? <EmptyBlock icon={MonitorPlay} title={t(locale, 'No graphics adapter returned', 'لم يُعد محول رسوميات')} message={t(locale, 'Win32_VideoController returned no row.', 'لم يُعد Win32_VideoController أي صف.')} /> : null}
      </div>

      {selected ? (
        <div className="sys-split-2">
          <Panel title={t(locale, 'Adapter dossier', 'ملف المحول')} sub={selected.name} icon={MonitorPlay}>
            <KeyValueGrid>
              <Field label={t(locale, 'Vendor', 'المصنّع')} value={selected.vendor || '—'} />
              <Field label={t(locale, 'Adapter RAM', 'ذاكرة المحول')} value={formatBytes(selected.adapterRamBytes)} />
              <Field label={t(locale, 'Driver version', 'إصدار البرنامج')} value={selected.driverVersion || '—'} mono />
              <Field label={t(locale, 'Driver date', 'تاريخ البرنامج')} value={formatDate(selected.driverDate, locale)} />
              <Field label={t(locale, 'Status', 'الحالة')} value={selected.status || '—'} tone={String(selected.status).toLowerCase() === 'ok' ? 'good' : 'warn'} />
              <Field label={t(locale, 'Video processor', 'معالج الفيديو')} value={selected.videoProcessor || '—'} />
              <Field label={t(locale, 'Current video mode', 'وضع الفيديو الحالي')} value={selected.videoMode || '—'} mono />
              <Field label={t(locale, 'PNP device', 'جهاز PNP')} value={selected.pnpDeviceId || '—'} mono />
            </KeyValueGrid>
            <div className="sys-toolbar-row">
              <CopyButton locale={locale} text={selected.driverVersion} label={t(locale, 'Copy driver version', 'نسخ إصدار البرنامج')} />
              <ExportButton
                fileName="knoux-graphics.json"
                payload={gpus}
                label={t(locale, 'Export graphics evidence', 'تصدير أدلة الرسوميات')}
                onDone={(ok) => controller.showNotice(ok ? t(locale, 'Graphics evidence exported.', 'صُدّدت أدلة الرسوميات.') : t(locale, 'The graphics export could not start.', 'تعذّر بدء تصدير الرسوميات.'))}
              />
            </div>
          </Panel>
          <Panel title={t(locale, 'Capability honesty', 'صدق القدرات')} icon={ShieldCheck}>
            <div className="sys-grid-2">
              <MiniStat label={t(locale, 'DirectX version', 'إصدار DirectX')} value={t(locale, 'Not measured', 'غير مقيس')} tone="muted" />
              <MiniStat label={t(locale, 'Vulkan support', 'دعم Vulkan')} value={t(locale, 'Not measured', 'غير مقيس')} tone="muted" />
              <MiniStat label={t(locale, 'Hardware video decode', 'فك ترميز الفيديو العتادي')} value={t(locale, 'Not measured', 'غير مقيس')} tone="muted" />
              <MiniStat label={t(locale, 'VRAM (reported)', 'VRAM (المبلّغ)')} value={formatBytes(selected.adapterRamBytes)} />
            </div>
            <InfoNote tone="muted">
              {t(locale, 'Win32_VideoController reports adapter RAM, driver and mode only. DirectX, Vulkan, ray tracing and encode capability require dedicated APIs and are not claimed here. Reported adapter RAM can be truncated on large cards.', 'يبلّغ Win32_VideoController عن ذاكرة المحول والبرنامج والوضع فقط. تتطلب قدرات DirectX وVulkan وتتبع الأشعة والترميز واجهات مخصصة ولا تُدّعى هنا. قد تُقتطع ذاكرة المحول المبلّغة على البطاقات الكبيرة.')}
            </InfoNote>
          </Panel>
        </div>
      ) : null}
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 29 - DIMM Slots & Memory Layout                                           */
/* ------------------------------------------------------------------------- */

export function MemoryWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const modules = snapshot.hardware.memory;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = modules.find((module) => module.id === selectedId) || modules[0] || null;
  const total = modules.reduce((sum, module) => sum + (module.capacityBytes || 0), 0);
  const slots = useMemo(() => {
    const map = new Map<string, SystemMemoryModule>();
    for (const module of modules) map.set(module.locator || module.id, module);
    return [...map.values()];
  }, [modules]);

  return (
    <WorkbenchFrame
      id="hardware-memory"
      locale={locale}
      provider="Win32_PhysicalMemory"
      foot={
        <>
          <span><MemoryStick aria-hidden="true" />{formatCount(modules.length)} {t(locale, 'populated module(s)', 'شريحة مأهولة')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'Empty motherboard slots are not enumerated by this provider.', 'لا يُعدّد هذا المزود المنافذ الفارغة في اللوحة الأم.')}</span>
        </>
      }
    >
      <div className="sys-mini-row">
        <MiniStat label={t(locale, 'Reported total', 'الإجمالي المبلّغ')} value={formatBytes(total)} icon={MemoryStick} />
        <MiniStat label={t(locale, 'Modules', 'الشرائح')} value={formatCount(modules.length)} />
        <MiniStat label={t(locale, 'Locators', 'المواقع')} value={formatCount(slots.length)} />
        <MiniStat label={t(locale, 'Live usage', 'الاستخدام الحي')} value={formatPercent(snapshot.metrics.memoryPercent, 1)} tone={percentageTone(snapshot.metrics.memoryPercent)} />
      </div>

      <div className="sys-dimm-board">
        {slots.map((module, index) => (
          <button
            type="button"
            key={module.id}
            className={cx('sys-dimm-slot', selected?.id === module.id && 'is-active')}
            onClick={() => setSelectedId(module.id)}
          >
            <span className="sys-dimm-notch" aria-hidden="true" />
            <span className="sys-dimm-index">{String(index + 1).padStart(2, '0')}</span>
            <strong>{formatBytes(module.capacityBytes)}</strong>
            <em>{module.locator || t(locale, 'Locator unknown', 'الموقع مجهول')}</em>
            <span className="sys-dimm-bank">{module.bankLabel || t(locale, 'Bank unknown', 'البنك مجهول')}</span>
            <span className="sys-dimm-speed">{formatMHz(module.configuredSpeedMHz || module.speedMHz)}</span>
          </button>
        ))}
        {!slots.length ? <EmptyBlock icon={MemoryStick} title={t(locale, 'No memory module returned', 'لم تُعد شريحة ذاكرة')} message={t(locale, 'Win32_PhysicalMemory returned no populated module.', 'لم يُعد Win32_PhysicalMemory أي شريحة مأهولة.')} /> : null}
      </div>

      <div className="sys-split-2">
        <Panel title={t(locale, 'Module dossier', 'ملف الشريحة')} sub={selected?.locator || selected?.id} icon={MemoryStick}>
          {selected ? (
            <>
              <KeyValueGrid>
                <Field label={t(locale, 'Manufacturer', 'المصنّع')} value={selected.manufacturer || '—'} />
                <Field label={t(locale, 'Part number', 'رقم القطعة')} value={selected.partNumber || '—'} mono />
                <Field label={t(locale, 'Capacity', 'السعة')} value={formatBytes(selected.capacityBytes)} />
                <Field label={t(locale, 'Configured speed', 'السرعة المهيأة')} value={formatMHz(selected.configuredSpeedMHz)} />
                <Field label={t(locale, 'Rated speed', 'السرعة المقدرة')} value={formatMHz(selected.speedMHz)} />
                <Field label={t(locale, 'Form factor', 'عامل الشكل')} value={selected.formFactor || '—'} />
                <Field label={t(locale, 'Memory type', 'نوع الذاكرة')} value={selected.memoryType || '—'} />
                <Field label={t(locale, 'Bank label', 'البنك')} value={selected.bankLabel || '—'} />
                <Field label={t(locale, 'Locator', 'الموقع')} value={selected.locator || '—'} mono />
                <Field label={t(locale, 'Source', 'المصدر')} value={selected.source} />
              </KeyValueGrid>
              <div className="sys-toolbar-row">
                <CopyButton locale={locale} text={selected.partNumber} label={t(locale, 'Copy part number', 'نسخ رقم القطعة')} />
                <ExportButton
                  fileName="knoux-memory-layout.json"
                  payload={modules}
                  label={t(locale, 'Export memory layout', 'تصدير تخطيط الذاكرة')}
                  onDone={(ok) => controller.showNotice(ok ? t(locale, 'Memory layout exported.', 'صُدّد تخطيط الذاكرة.') : t(locale, 'The memory export could not start.', 'تعذّر بدء تصدير الذاكرة.'))}
                />
              </div>
            </>
          ) : (
            <EmptyBlock compact icon={MemoryStick} title={t(locale, 'No module selected', 'لا شريحة محددة')} message={t(locale, 'Select a populated DIMM slot.', 'اختر منفذ DIMM مأهولًا.')} />
          )}
        </Panel>
        <Panel title={t(locale, 'Layout notes', 'ملاحظات التخطيط')} icon={Info}>
          <InfoNote tone="muted">
            {t(locale, 'Only populated modules are known. The number of physical slots, channel population and rank cannot be derived from Win32_PhysicalMemory alone, so no empty slot is drawn.', 'تُعرف فقط الشرائح المأهولة. لا يمكن استنتاج عدد المنافذ الفعلية وتعبئة القنوات والرتبة من Win32_PhysicalMemory وحده، لذلك لا يُرسم منفذ فارغ.')}
          </InfoNote>
          <MeterBar label={t(locale, 'Live used memory', 'الذاكرة المستخدمة الآن')} value={snapshot.metrics.memoryPercent} tone={percentageTone(snapshot.metrics.memoryPercent)} caption={formatPercent(snapshot.metrics.memoryPercent, 1)} />
          <DataRows
            rows={[
              { label: t(locale, 'Installed (identity)', 'المثبتة (الهوية)'), value: formatBytes(snapshot.identity.installedRamBytes) },
              { label: t(locale, 'Reported by modules', 'المبلّغة بالشرائح'), value: formatBytes(total) },
              { label: t(locale, 'Used now', 'المستخدم الآن'), value: formatBytes(snapshot.metrics.memoryUsedBytes) },
            ]}
          />
        </Panel>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 30 - Battery Wear & Cycle Ledger                                          */
/* ------------------------------------------------------------------------- */

function batteryHealth(battery: SystemBatteryInfo): number | null {
  if (battery.healthPercent != null) return battery.healthPercent;
  if (battery.fullChargeCapacityMilliWattHours && battery.designCapacityMilliWattHours) {
    return (battery.fullChargeCapacityMilliWattHours / battery.designCapacityMilliWattHours) * 100;
  }
  return null;
}

export function CycleLedgerWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const batteries = snapshot.hardware.batteries;
  const disks = snapshot.hardware.disks;
  const [view, setView] = useState<'battery' | 'storage'>('battery');

  return (
    <WorkbenchFrame
      id="hardware-cycles"
      locale={locale}
      state="partial"
      provider="BatteryCycleCount + Storage reliability counters"
      foot={
        <>
          <span><Repeat aria-hidden="true" />{formatCount(batteries.length)} {t(locale, 'battery device(s)', 'جهاز بطارية')} · {formatCount(disks.length)} {t(locale, 'disk(s)', 'قرص')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'Only counters Windows actually returned are shown.', 'تُعرض فقط العدادات التي أعادها Windows فعليًا.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Seg
          value={view}
          onChange={setView}
          ariaLabel={t(locale, 'Ledger scope', 'نطاق السجل')}
          options={[
            { value: 'battery', label: t(locale, 'Battery wear', 'تآكل البطارية') },
            { value: 'storage', label: t(locale, 'Storage reliability', 'موثوقية التخزين') },
          ]}
        />
      </div>

      {view === 'battery' ? (
        batteries.length ? (
          <div className="sys-wear-grid">
            {batteries.map((battery) => {
              const health = batteryHealth(battery);
              const wear = health == null ? null : Math.max(0, 100 - health);
              return (
                <Panel key={battery.id} title={battery.name} sub={battery.manufacturer || battery.chemistry || undefined} icon={BatteryCharging}>
                  <div className="sys-wear-hero">
                    <Gauge value={health} label={t(locale, 'Health', 'الصحة')} color={health == null ? '#94a3b8' : health >= 80 ? '#34d399' : health >= 60 ? '#fbbf24' : '#fb7185'} size={132} />
                    <div>
                      <strong>{formatPercent(health, 1)}</strong>
                      <em>{t(locale, 'Measured health', 'الصحة المقيسة')}</em>
                      <span>{t(locale, 'Derived wear', 'التآكل المشتق')}: {wear == null ? '—' : `${wear.toFixed(1)}%`}</span>
                    </div>
                  </div>
                  <DataRows
                    rows={[
                      { label: t(locale, 'Design capacity', 'السعة التصميمية'), value: battery.designCapacityMilliWattHours == null ? '—' : `${formatCount(battery.designCapacityMilliWattHours)} mWh` },
                      { label: t(locale, 'Full charge capacity', 'سعة الشحن الكامل'), value: battery.fullChargeCapacityMilliWattHours == null ? '—' : `${formatCount(battery.fullChargeCapacityMilliWattHours)} mWh` },
                      { label: t(locale, 'Cycle count', 'عدد الدورات'), value: battery.cycleCountAvailable ? formatCount(battery.cycleCount) : t(locale, 'Unavailable from Windows', 'غير متاح من Windows'), tone: battery.cycleCountAvailable ? 'info' : 'muted' },
                      { label: t(locale, 'Charge state', 'حالة الشحن'), value: formatPercent(battery.chargePercent), tone: percentageTone(battery.chargePercent, 25, 12) },
                      { label: t(locale, 'Power source', 'مصدر الطاقة'), value: battery.powerOnline == null ? t(locale, 'Unknown', 'مجهول') : battery.powerOnline ? t(locale, 'AC', 'تيار متردد') : t(locale, 'Battery', 'بطارية') },
                    ]}
                  />
                  <InfoNote tone={battery.cycleCountAvailable ? 'info' : 'muted'}>
                    {battery.cycleCountAvailable
                      ? t(locale, 'Cycle count came from a Windows battery provider for this device.', 'جاء عدد الدورات من مزود بطارية Windows لهذا الجهاز.')
                      : t(locale, 'Windows did not expose a cycle count for this battery. The row stays unknown; no estimate is substituted.', 'لم يتيح Windows عدد دورات لهذه البطارية. يبقى الصف مجهولًا؛ لا يُستبدل بتقدير.')}
                  </InfoNote>
                </Panel>
              );
            })}
          </div>
        ) : (
          <>
            <EmptyBlock icon={BatteryCharging} title={t(locale, 'No battery to audit', 'لا بطارية للتدقيق')} message={t(locale, 'The battery provider returned no device; there is no wear or cycle evidence to show.', 'لم يُعد مزود البطارية أي جهاز؛ لا توجد أدلة تآكل أو دورات للعرض.')} />
            <Panel title={t(locale, 'What is not claimed', 'ما لا يُدّعى')} icon={ShieldAlert}>
              <DataRows
                rows={[
                  { label: t(locale, 'Design capacity', 'السعة التصميمية'), value: t(locale, 'Not measured', 'غير مقيسة'), tone: 'muted' },
                  { label: t(locale, 'Full charge capacity', 'سعة الشحن الكامل'), value: t(locale, 'Not measured', 'غير مقيسة'), tone: 'muted' },
                  { label: t(locale, 'Cycle count', 'عدد الدورات'), value: t(locale, 'Not measured', 'غير مقيس'), tone: 'muted' },
                  { label: t(locale, 'Derived wear', 'التآكل المشتق'), value: t(locale, 'Not measured', 'غير مقيس'), tone: 'muted' },
                ]}
              />
              <InfoNote tone="muted">
                {t(locale, 'The wear ledger needs a measured battery. No percentage, cycle count or wear estimate is substituted when Windows returns no device.', 'يحتاج سجل التآكل إلى بطارية مقيسة. لا تُستبدل أي نسبة أو عدد دورات أو تقدير تآكل عندما لا يعيد Windows جهازًا.')}
              </InfoNote>
            </Panel>
            <Panel title={t(locale, 'Ledger contract', 'عقد السجل')} icon={Database}>
              <DataRows
                rows={[
                  { label: t(locale, 'Source', 'المصدر'), value: 'root/WMI BatteryStaticData · BatteryFullChargedCapacity · Win32_Battery' },
                  { label: t(locale, 'Wear math', 'حساب التآكل'), value: t(locale, '1 − full ÷ design, only when both capacities are measured', '1 − الكامل ÷ التصميمي، فقط عند قياس السعتين'), tone: 'muted' },
                  { label: t(locale, 'Cycle count', 'عدد الدورات'), value: t(locale, 'Reported by Windows only when exposed; never estimated', 'يبلغ عنه Windows فقط عند إتاحته؛ لا يُقدَّر أبدًا'), tone: 'muted' },
                  { label: t(locale, 'Mutation', 'الكتابة'), value: t(locale, 'None; power and thermal policy is gated to Mission 14', 'لا توجد؛ سياسة الطاقة والحرارة محجوبة للمهمة 14'), tone: 'muted' },
                ]}
              />
            </Panel>
          </>
        )
      ) : disks.length ? (
        <div className="sys-split-2">
          <Panel title={t(locale, 'Storage reliability', 'موثوقية التخزين')} sub={`${formatCount(disks.length)} ${t(locale, 'physical disks', 'قرص فعلي')}`} icon={HardDrive} bodyClassName="sys-panel-body-flush">
            <div className="sys-table-wrap">
              <table className="sys-table">
                <thead>
                  <tr>
                    <th>{t(locale, 'Disk', 'القرص')}</th>
                    <th>{t(locale, 'Health', 'الصحة')}</th>
                    <th>{t(locale, 'Wear', 'التآكل')}</th>
                    <th>{t(locale, 'Power-on', 'التشغيل')}</th>
                    <th>{t(locale, 'Temp', 'الحرارة')}</th>
                  </tr>
                </thead>
                <tbody>
                  {disks.map((disk) => (
                    <tr key={disk.id}>
                      <td><strong className="sys-row-name">{disk.model}</strong><span className="sys-row-sub">{disk.busType || disk.mediaType || '—'}</span></td>
                      <td><Chip tone={String(disk.healthStatus).toLowerCase() === 'healthy' ? 'good' : disk.healthStatus ? 'warn' : 'muted'}>{disk.healthStatus || t(locale, 'Unknown', 'مجهول')}</Chip></td>
                      <td className="sys-mono">{disk.wearPercent == null ? '—' : `${disk.wearPercent}%`}</td>
                      <td className="sys-mono">{disk.powerOnHours == null ? '—' : `${formatCount(disk.powerOnHours)} h`}</td>
                      <td className="sys-mono">{disk.temperatureCelsius == null ? '—' : `${disk.temperatureCelsius} °C`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sys-panel-pad">
              <InfoNote tone="muted">
                {t(locale, 'Wear, temperature and power-on hours depend on the storage reliability provider. Empty fields mean the provider did not return them.', 'يعتمد التآكل والحرارة وساعات التشغيل على مزود موثوقية التخزين. الحقول الفارغة تعني أن المزود لم يعدها.')}
              </InfoNote>
            </div>
          </Panel>
          <Panel title={t(locale, 'SMART evidence', 'أدلة SMART')} icon={ShieldCheck}>
            <DataRows
              rows={disks.map((disk) => ({ label: disk.model, value: disk.smartStatus || (snapshot.hardware.availability.smart ? t(locale, 'Not returned', 'غير متاح') : t(locale, 'Provider unavailable', 'المزود غير متاح')), tone: disk.smartStatus ? 'good' : 'muted' }))}
            />
            <InfoNote tone="muted">
              {t(locale, 'No SMART command is executed. Values are reported only when Windows already exposes them.', 'لا يُنفّذ أي أمر SMART. تُعرض القيم فقط عندما يتيحها Windows مسبقًا.')}
            </InfoNote>
            <ExportButton
              fileName="knoux-reliability-ledger.json"
              payload={{ observedAt: snapshot.generatedAt, batteries, disks }}
              label={t(locale, 'Export reliability ledger', 'تصدير سجل الموثوقية')}
              onDone={(ok) => controller.showNotice(ok ? t(locale, 'Reliability ledger exported.', 'صُدّد سجل الموثوقية.') : t(locale, 'The reliability export could not start.', 'تعذّر بدء تصدير الموثوقية.'))}
            />
          </Panel>
        </div>
      ) : (
        <EmptyBlock icon={HardDrive} title={t(locale, 'No storage device returned', 'لم يُعد جهاز تخزين')} message={t(locale, 'Get-PhysicalDisk returned no row.', 'لم يُعد Get-PhysicalDisk أي صف.')} />
      )}
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 31 - Thermal Sensors Board                                                */
/* ------------------------------------------------------------------------- */

export function ThermalWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const thermal = snapshot.hardware.thermal;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = thermal.zones.find((zone) => zone.id === selectedId) || thermal.zones[0] || null;
  const hottest = thermal.celsius;

  return (
    <WorkbenchFrame
      id="hardware-thermal"
      locale={locale}
      state="partial"
      provider="MSAcpi_ThermalZoneTemperature"
      foot={
        <>
          <span><Thermometer aria-hidden="true" />{formatCount(thermal.zones.length)} {t(locale, 'thermal zone(s)', 'منطقة حرارية')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'No fan, voltage or clock sensor is invented.', 'لا يُختلق مستشعر مروحة أو جهد أو تردد.')}</span>
        </>
      }
    >
      {thermal.available && thermal.zones.length ? (
        <>
          <div className="sys-thermal-hero">
            <div className="sys-thermal-readout">
              <span>{t(locale, 'Hottest measured zone', 'أحر منطقة مقيسة')}</span>
              <strong>{hottest == null ? '—' : `${hottest.toFixed(1)}°C`}</strong>
              <em>{thermal.provider || t(locale, 'Provider not reported', 'المزود غير مبلّغ')}</em>
            </div>
            <div className="sys-thermal-scale" aria-hidden="true">
              {[0, 30, 60, 90, 100].map((mark) => (
                <span key={mark} className="sys-thermal-tick" style={{ insetInlineStart: `${mark}%` }}>{mark}°</span>
              ))}
              <span className="sys-thermal-bar" />
              {hottest != null ? <span className="sys-thermal-pointer" style={{ insetInlineStart: `${Math.max(0, Math.min(100, hottest))}%` }} /> : null}
            </div>
          </div>

          <div className="sys-thermal-grid">
            {thermal.zones.map((zone) => (
              <button
                type="button"
                key={zone.id}
                className={cx('sys-thermal-card', selected?.id === zone.id && 'is-active')}
                onClick={() => setSelectedId(zone.id)}
              >
                <span className="sys-thermal-icon" aria-hidden="true"><Thermometer /></span>
                <span className="sys-thermal-copy">
                  <strong>{zone.name}</strong>
                  <em>{zone.source}</em>
                </span>
                <span className={cx('sys-thermal-value', zone.celsius != null && zone.celsius >= 80 ? 'is-hot' : zone.celsius != null && zone.celsius >= 65 ? 'is-warm' : '')}>
                  {zone.celsius == null ? '—' : `${zone.celsius.toFixed(1)}°C`}
                </span>
                <MeterBar value={zone.celsius} max={100} tone={zone.celsius != null && zone.celsius >= 80 ? 'bad' : zone.celsius != null && zone.celsius >= 65 ? 'warn' : 'good'} height={5} />
              </button>
            ))}
          </div>

          <div className="sys-split-2">
            <Panel title={t(locale, 'Zone dossier', 'ملف المنطقة')} sub={selected?.name} icon={Thermometer}>
              {selected ? (
                <DataRows
                  rows={[
                    { label: t(locale, 'Measured temperature', 'الحرارة المقيسة'), value: selected.celsius == null ? '—' : `${selected.celsius.toFixed(1)} °C` },
                    { label: t(locale, 'Warning threshold', 'حد التحذير'), value: selected.warningCelsius == null ? t(locale, 'Not exposed by firmware', 'غير متاح من البرنامج الثابت') : `${selected.warningCelsius} °C` },
                    { label: t(locale, 'Throttling', 'خفض التردد'), value: thermal.throttling == null ? t(locale, 'Unknown — needs a platform counter', 'مجهول — يتطلب عداد منصة') : thermal.throttling ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا'), tone: 'muted' },
                    { label: t(locale, 'Source', 'المصدر'), value: selected.source },
                  ]}
                />
              ) : null}
            </Panel>
            <Panel title={t(locale, 'Sensor boundary', 'حدود المستشعر')} icon={ShieldCheck}>
              <InfoNote tone="warn">{thermal.reason}</InfoNote>
              <InfoNote tone="muted">
                {t(locale, 'ACPI thermal zones are not CPU core temperatures. The board shows only what firmware exposed. If Windows denies access, the board remains empty instead of showing a simulated reading.', 'مناطق ACPI الحرارية ليست حرارة أنوية المعالج. تعرض اللوحة فقط ما كشفه البرنامج الثابت. إذا منع Windows الوصول تبقى اللوحة فارغة بدل عرض قراءة محاكاة.')}
              </InfoNote>
              <ExportButton
                fileName="knoux-thermal.json"
                payload={{ observedAt: snapshot.generatedAt, thermal }}
                label={t(locale, 'Export thermal evidence', 'تصدير أدلة الحرارة')}
                onDone={(ok) => controller.showNotice(ok ? t(locale, 'Thermal evidence exported.', 'صُدّدت أدلة الحرارة.') : t(locale, 'The thermal export could not start.', 'تعذّر بدء تصدير الحرارة.'))}
              />
            </Panel>
          </div>
        </>
      ) : (
        <>
          <div className="sys-thermal-vacant">
            <span className="sys-thermal-vacant-icon" aria-hidden="true"><Thermometer /></span>
            <div>
              <span>{t(locale, 'No thermal reading available', 'لا قراءة حرارية متاحة')}</span>
              <strong>{t(locale, 'Firmware did not expose a thermal zone', 'البرنامج الثابت لم يكشف منطقة حرارية')}</strong>
              <p>{thermal.reason}</p>
            </div>
          </div>
          <Panel title={t(locale, 'What is not claimed', 'ما لا يُدّعى')} icon={ShieldAlert}>
            <DataRows
              rows={[
                { label: t(locale, 'CPU temperature', 'حرارة المعالج'), value: t(locale, 'Not measured', 'غير مقيسة'), tone: 'muted' },
                { label: t(locale, 'GPU temperature', 'حرارة الرسوميات'), value: t(locale, 'Not measured', 'غير مقيسة'), tone: 'muted' },
                { label: t(locale, 'Fan speed', 'سرعة المروحة'), value: t(locale, 'Not measured', 'غير مقيسة'), tone: 'muted' },
                { label: t(locale, 'Throttling', 'خفض التردد'), value: t(locale, 'Not measured', 'غير مقيس'), tone: 'muted' },
              ]}
            />
            <InfoNote tone="muted">
              {t(locale, 'A future mission may add a signed kernel driver or vendor API for these sensors. Mission 10 does not install drivers or elevate.', 'قد تضيف مهمة مستقبلية برنامج تشغيل نواة موقّعًا أو واجهة مورّد لهذه المستشعرات. لا تثبّت المهمة 10 برامج تشغيل ولا ترفع الصلاحيات.')}
            </InfoNote>
            <button type="button" className="sys-btn sys-btn-quiet" onClick={() => controller.refreshSnapshot(true)} disabled={controller.refreshing}>
              <RefreshCw className={controller.refreshing ? 'sys-spin' : undefined} aria-hidden="true" />
              {t(locale, 'Re-read measured snapshot', 'إعادة قراءة اللقطة المقيسة')}
            </button>
          </Panel>
        </>
      )}
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 32 - Physical Disks & Bus Interface                                       */
/* ------------------------------------------------------------------------- */

export function DisksWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const disks = snapshot.hardware.disks;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = disks.find((disk) => disk.id === selectedId) || disks[0] || null;

  return (
    <WorkbenchFrame
      id="hardware-disks"
      locale={locale}
      provider="Get-PhysicalDisk + Win32_DiskDrive"
      foot={
        <>
          <span><HardDrive aria-hidden="true" />{formatCount(disks.length)} {t(locale, 'physical disk(s)', 'قرص فعلي')} · {formatBytes(snapshot.hardware.totals.diskBytes)}</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'Format, partition, optimize and firmware operations are not exposed.', 'عمليات التهيئة والتقسيم والتحسين والبرنامج الثابت غير متاحة.')}</span>
        </>
      }
    >
      <div className="sys-mini-row">
        <MiniStat label={t(locale, 'Physical disks', 'الأقراص الفعلية')} value={formatCount(disks.length)} icon={HardDrive} />
        <MiniStat label={t(locale, 'Reported capacity', 'السعة المبلّغة')} value={formatBytes(snapshot.hardware.totals.diskBytes)} />
        <MiniStat label={t(locale, 'Healthy', 'سليمة')} value={formatCount(disks.filter((disk) => String(disk.healthStatus).toLowerCase() === 'healthy').length)} tone="good" />
        <MiniStat label={t(locale, 'Reliability counters', 'عدادات الموثوقية')} value={snapshot.hardware.availability.smart ? t(locale, 'Available', 'متاحة') : t(locale, 'Unavailable', 'غير متاحة')} tone={snapshot.hardware.availability.smart ? 'good' : 'muted'} />
      </div>

      <div className="sys-disk-bays">
        {disks.map((disk) => (
          <button type="button" key={disk.id} className={cx('sys-disk-bay', selected?.id === disk.id && 'is-active')} onClick={() => setSelectedId(disk.id)}>
            <span className="sys-disk-platter" aria-hidden="true"><HardDrive /></span>
            <span className="sys-disk-copy">
              <strong>{disk.model}</strong>
              <em>{disk.mediaType || t(locale, 'Media unknown', 'الوسائط مجهولة')} · {disk.busType || t(locale, 'Bus unknown', 'الناقل مجهول')}</em>
              <span className="sys-mono">{formatBytes(disk.sizeBytes)}</span>
            </span>
            <Chip tone={String(disk.healthStatus).toLowerCase() === 'healthy' ? 'good' : disk.healthStatus ? 'warn' : 'muted'}>{disk.healthStatus || t(locale, 'Unknown', 'مجهول')}</Chip>
          </button>
        ))}
        {!disks.length ? <EmptyBlock icon={HardDrive} title={t(locale, 'No physical disk returned', 'لم يُعد قرص فعلي')} message={t(locale, 'Get-PhysicalDisk returned no row; no capacity is invented.', 'لم يُعد Get-PhysicalDisk أي صف؛ لا تُختلق سعة.')} /> : null}
      </div>

      {selected ? (
        <div className="sys-split-2">
          <Panel title={t(locale, 'Disk dossier', 'ملف القرص')} sub={selected.model} icon={HardDrive}>
            <KeyValueGrid>
              <Field label={t(locale, 'Size', 'الحجم')} value={formatBytes(selected.sizeBytes)} />
              <Field label={t(locale, 'Media type', 'نوع الوسائط')} value={selected.mediaType || '—'} />
              <Field label={t(locale, 'Bus type', 'نوع الناقل')} value={selected.busType || '—'} />
              <Field label={t(locale, 'Health', 'الصحة')} value={selected.healthStatus || '—'} tone={String(selected.healthStatus).toLowerCase() === 'healthy' ? 'good' : 'warn'} />
              <Field label={t(locale, 'Operational status', 'حالة التشغيل')} value={selected.operationalStatus.length ? selected.operationalStatus.join(', ') : '—'} />
              <Field label={t(locale, 'Partitions', 'الأقسام')} value={formatCount(selected.partitionCount)} />
              <Field label={t(locale, 'SMART status', 'حالة SMART')} value={selected.smartStatus || t(locale, 'Not returned', 'غير متاح')} tone={selected.smartStatus ? 'good' : 'muted'} />
              <Field label={t(locale, 'Power-on hours', 'ساعات التشغيل')} value={selected.powerOnHours == null ? '—' : `${formatCount(selected.powerOnHours)} h`} />
              <Field label={t(locale, 'Temperature', 'الحرارة')} value={selected.temperatureCelsius == null ? '—' : `${selected.temperatureCelsius} °C`} />
              <Field label={t(locale, 'Wear', 'التآكل')} value={selected.wearPercent == null ? '—' : `${selected.wearPercent}%`} />
              <Field label={t(locale, 'Device ID', 'معرف الجهاز')} value={selected.deviceId || '—'} mono className="sys-span-2" />
              <Field label={t(locale, 'Serial', 'الرقم التسلسلي')} value={selected.serial || '—'} mono className="sys-span-2" />
            </KeyValueGrid>
            <div className="sys-toolbar-row">
              <CopyButton locale={locale} text={selected.serial} label={t(locale, 'Copy serial', 'نسخ الرقم التسلسلي')} />
              <ExportButton
                fileName="knoux-physical-disks.json"
                payload={disks}
                label={t(locale, 'Export disk evidence', 'تصدير أدلة الأقراص')}
                onDone={(ok) => controller.showNotice(ok ? t(locale, 'Disk evidence exported.', 'صُدّدت أدلة الأقراص.') : t(locale, 'The disk export could not start.', 'تعذّر بدء تصدير الأقراص.'))}
              />
            </div>
          </Panel>
          <Panel title={t(locale, 'Bus & reliability boundary', 'حدود الناقل والموثوقية')} icon={Info}>
            <DataRows
              rows={[
                { label: t(locale, 'SMART provider', 'مزود SMART'), value: snapshot.hardware.availability.smart ? t(locale, 'Answered', 'استجاب') : t(locale, 'No counters returned', 'لم تُعد عدادات'), tone: snapshot.hardware.availability.smart ? 'good' : 'muted' },
                { label: t(locale, 'NVMe / SATA distinction', 'تمييز NVMe / SATA'), value: t(locale, 'From measured bus type only', 'من نوع الناقل المقيس فقط') },
                { label: t(locale, 'SMART command', 'أمر SMART'), value: t(locale, 'Never executed', 'لا يُنفّذ أبدًا'), tone: 'muted' },
                { label: t(locale, 'Firmware update', 'تحديث البرنامج الثابت'), value: t(locale, 'Not exposed', 'غير متاح'), tone: 'muted' },
              ]}
            />
            <InfoNote tone="muted">
              {t(locale, 'Windows storage reliability counters are used when present. The app never sends SMART commands, guesses an SSD from a model name or estimates remaining life from wear alone.', 'تُستخدم عدادات موثوقية التخزين في Windows عند وجودها. لا يرسل التطبيق أوامر SMART ولا يخمّن SSD من اسم الطراز ولا يقدّر العمر المتبقي من التآكل وحده.')}
            </InfoNote>
          </Panel>
        </div>
      ) : null}
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 33 - USB Controller & Device Tree                                         */
/* ------------------------------------------------------------------------- */

export function UsbWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'controller' | 'hub' | 'device'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tree = useMemo(() => flattenUsbTree(snapshot.hardware.usb), [snapshot.hardware.usb]);
  const rows = useMemo(() => tree.filter(({ node }) => {
    if (type !== 'all' && node.nodeType !== type) return false;
    if (query.trim() && !`${node.name} ${node.manufacturer ?? ''} ${node.vendorId ?? ''} ${node.productId ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  }), [query, tree, type]);
  const selected = snapshot.hardware.usb.find((node) => node.id === selectedId) || rows[0]?.node || null;
  const counts = useMemo(() => {
    const result = { controller: 0, hub: 0, device: 0 };
    for (const node of snapshot.hardware.usb) result[node.nodeType] += 1;
    return result;
  }, [snapshot.hardware.usb]);

  return (
    <WorkbenchFrame
      id="hardware-usb"
      locale={locale}
      provider="Win32_USBController + USBHub + PnP"
      foot={
        <>
          <span><Usb aria-hidden="true" />{formatCount(counts.controller)} {t(locale, 'controller(s)', 'وحدة')} · {formatCount(counts.hub)} {t(locale, 'hub(s)', 'موزع')} · {formatCount(counts.device)} {t(locale, 'device(s)', 'جهاز')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'Speed and power stay unknown when Windows omits them.', 'تبقى السرعة والطاقة مجهولة عندما يغفلها Windows.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search USB device, vendor or product ID…', 'ابحث في جهاز USB أو معرف المورّد أو المنتج…')} />
        <Seg
          value={type}
          onChange={setType}
          ariaLabel={t(locale, 'USB node type', 'نوع عقدة USB')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All', 'الكل') },
            { value: 'controller', label: t(locale, 'Controllers', 'وحدات') },
            { value: 'hub', label: t(locale, 'Hubs', 'موزعات') },
            { value: 'device', label: t(locale, 'Devices', 'أجهزة') },
          ]}
        />
      </div>

      <div className="sys-split-ledger">
        <Panel
          className="sys-ledger-panel"
          title={t(locale, 'USB device tree', 'شجرة أجهزة USB')}
          sub={`${formatCount(rows.length)} ${t(locale, 'matching nodes', 'عقدة مطابقة')}`}
          icon={Usb}
          bodyClassName="sys-panel-body-flush"
        >
          {rows.length ? (
            <div className="sys-usb-tree" role="tree" aria-label={t(locale, 'Measured USB tree', 'شجرة USB المقيسة')}>
              {rows.map(({ node, depth }) => (
                <button
                  type="button"
                  key={node.id}
                  role="treeitem"
                  aria-selected={selected?.id === node.id}
                  className={cx('sys-usb-row', selected?.id === node.id && 'is-active', `is-${node.nodeType}`)}
                  style={{ paddingInlineStart: `${12 + depth * 18}px` }}
                  onClick={() => setSelectedId(node.id)}
                >
                  <span className="sys-usb-glyph" aria-hidden="true">{node.nodeType === 'device' ? <Usb /> : node.nodeType === 'hub' ? <Layers /> : <Boxes />}</span>
                  <span className="sys-usb-copy">
                    <strong>{node.name}</strong>
                    <em>{node.manufacturer || t(locale, 'Manufacturer unknown', 'المصنّع مجهول')} · {node.nodeType}</em>
                  </span>
                  <Chip tone={String(node.status).toLowerCase() === 'ok' ? 'good' : node.status ? 'warn' : 'muted'}>{node.status || '—'}</Chip>
                </button>
              ))}
            </div>
          ) : (
            <EmptyBlock icon={Usb} title={t(locale, 'No USB node matches', 'لا عقدة USB مطابقة')} message={t(locale, 'Clear the search or node-type filter.', 'امسح البحث أو مرشح نوع العقدة.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Device dossier', 'ملف الجهاز')} sub={selected?.name} icon={Usb}>
            {selected ? (
              <>
                <KeyValueGrid>
                  <Field label={t(locale, 'Node type', 'نوع العقدة')} value={selected.nodeType} />
                  <Field label={t(locale, 'Class', 'الفئة')} value={selected.deviceClass || '—'} />
                  <Field label={t(locale, 'Manufacturer', 'المصنّع')} value={selected.manufacturer || '—'} />
                  <Field label={t(locale, 'Status', 'الحالة')} value={selected.status || '—'} tone={String(selected.status).toLowerCase() === 'ok' ? 'good' : 'warn'} />
                  <Field label={t(locale, 'Vendor ID', 'معرف المورّد')} value={selected.vendorId || '—'} mono />
                  <Field label={t(locale, 'Product ID', 'معرف المنتج')} value={selected.productId || '—'} mono />
                  <Field label={t(locale, 'Bus speed', 'سرعة الناقل')} value={selected.busSpeed || t(locale, 'Not reported', 'غير مبلّغة')} />
                  <Field label={t(locale, 'Power draw', 'سحب الطاقة')} value={selected.powerMilliAmps == null ? t(locale, 'Not reported', 'غير مبلّغ') : `${formatCount(selected.powerMilliAmps)} mA`} />
                  <Field label={t(locale, 'PNP device', 'جهاز PNP')} value={selected.pnpDeviceId || '—'} mono className="sys-span-2" />
                  <Field label={t(locale, 'Source', 'المصدر')} value={selected.source} className="sys-span-2" />
                </KeyValueGrid>
                <div className="sys-toolbar-row">
                  <CopyButton locale={locale} text={selected.pnpDeviceId} label={t(locale, 'Copy PNP ID', 'نسخ معرف PNP')} />
                  <ExportButton
                    fileName="knoux-usb-tree.json"
                    payload={snapshot.hardware.usb}
                    label={t(locale, 'Export USB tree', 'تصدير شجرة USB')}
                    onDone={(ok) => controller.showNotice(ok ? t(locale, 'USB tree exported.', 'صُدّدت شجرة USB.') : t(locale, 'The USB export could not start.', 'تعذّر بدء تصدير USB.'))}
                  />
                </div>
              </>
            ) : (
              <EmptyBlock compact icon={Usb} title={t(locale, 'No USB node selected', 'لا عقدة USB محددة')} message={t(locale, 'Select a measured USB node.', 'اختر عقدة USB مقيسة.')} />
            )}
          </Panel>
          <Panel title={t(locale, 'Topology boundary', 'حدود الطوبولوجيا')} icon={Info}>
            <InfoNote tone="muted">
              {t(locale, 'Parent links are derived from measured controller-device associations and PNP ancestry. Missing parent links are shown at the root; the app does not invent a port path.', 'تُشتق روابط الأب من ارتباطات الوحدة-الجهاز المقيسة ونسب PNP. تُعرض الروابط المفقودة في الجذر؛ لا يختلق التطبيق مسار منفذ.')}
            </InfoNote>
            <DataRows
              rows={[
                { label: t(locale, 'Reported speed', 'السرعة المبلّغة'), value: t(locale, 'Only when Windows returns it', 'فقط عندما يعيدها Windows') },
                { label: t(locale, 'Port path', 'مسار المنفذ'), value: t(locale, 'Not measured', 'غير مقيس'), tone: 'muted' },
              ]}
            />
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 34 - Monitor Topology & Resolution                                        */
/* ------------------------------------------------------------------------- */

export function DisplayWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const monitors = snapshot.hardware.monitors;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = monitors.find((monitor) => monitor.id === selectedId) || monitors[0] || null;

  return (
    <WorkbenchFrame
      id="hardware-display"
      locale={locale}
      state="partial"
      provider="WmiMonitorID + Win32_DesktopMonitor"
      foot={
        <>
          <span><Monitor aria-hidden="true" />{formatCount(monitors.length)} {t(locale, 'monitor(s)', 'شاشة')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'HDR is unknown when no supported provider answers.', 'HDR يبقى مجهولًا عندما لا يستجيب مزود مدعوم.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <span className="sys-toolbar-spacer" />
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.openSettings('display')} disabled={controller.busy === 'settings'}>
          <Wrench aria-hidden="true" />
          {t(locale, 'Windows display settings', 'إعدادات العرض في Windows')}
        </button>
      </div>

      <div className="sys-display-canvas">
        {monitors.map((monitor) => (
          <button
            type="button"
            key={monitor.id}
            className={cx('sys-monitor-card', selected?.id === monitor.id && 'is-active', monitor.primary && 'is-primary')}
            onClick={() => setSelectedId(monitor.id)}
          >
            <span className="sys-monitor-screen" aria-hidden="true">
              <span className="sys-monitor-resolution">{monitor.width ?? '—'}×{monitor.height ?? '—'}</span>
            </span>
            <span className="sys-monitor-stand" aria-hidden="true" />
            <span className="sys-monitor-copy">
              <strong>{monitor.name}</strong>
              <em>{monitor.manufacturer || t(locale, 'Manufacturer unknown', 'المصنّع مجهول')} · {monitor.refreshHz == null ? '—' : `${monitor.refreshHz} Hz`}</em>
            </span>
            {monitor.primary ? <Chip tone="good">{t(locale, 'Primary', 'أساسية')}</Chip> : <Chip tone="muted">{t(locale, 'Secondary', 'ثانوية')}</Chip>}
          </button>
        ))}
        {!monitors.length ? <EmptyBlock icon={Monitor} title={t(locale, 'No monitor returned', 'لم تُعد شاشة')} message={t(locale, 'WmiMonitorID and Win32_DesktopMonitor returned no row.', 'لم يُعد WmiMonitorID وWin32_DesktopMonitor أي صف.')} /> : null}
      </div>

      {selected ? (
        <div className="sys-split-2">
          <Panel title={t(locale, 'Display dossier', 'ملف الشاشة')} sub={selected.name} icon={Monitor}>
            <KeyValueGrid>
              <Field label={t(locale, 'Resolution', 'الدقة')} value={selected.width == null || selected.height == null ? '—' : `${selected.width} × ${selected.height}`} />
              <Field label={t(locale, 'Refresh', 'التحديث')} value={selected.refreshHz == null ? '—' : `${selected.refreshHz} Hz`} />
              <Field label={t(locale, 'Bits per pixel', 'بت لكل بكسل')} value={selected.bitsPerPixel ?? '—'} />
              <Field label={t(locale, 'Primary', 'أساسية')} value={selected.primary ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا')} tone={selected.primary ? 'good' : 'muted'} />
              <Field label={t(locale, 'Manufacturer', 'المصنّع')} value={selected.manufacturer || '—'} />
              <Field label={t(locale, 'Model year', 'سنة الطراز')} value={selected.year ?? '—'} />
              <Field label={t(locale, 'Manufacture week', 'أسبوع التصنيع')} value={selected.week ?? '—'} />
              <Field label={t(locale, 'Connection', 'الاتصال')} value={selected.connection || '—'} />
              <Field label={t(locale, 'PNP device', 'جهاز PNP')} value={selected.pnpDeviceId || '—'} mono className="sys-span-2" />
            </KeyValueGrid>
            <div className="sys-toolbar-row">
              <CopyButton locale={locale} text={selected.pnpDeviceId} label={t(locale, 'Copy PNP ID', 'نسخ معرف PNP')} />
              <ExportButton
                fileName="knoux-displays.json"
                payload={monitors}
                label={t(locale, 'Export display evidence', 'تصدير أدلة الشاشات')}
                onDone={(ok) => controller.showNotice(ok ? t(locale, 'Display evidence exported.', 'صُدّدت أدلة الشاشات.') : t(locale, 'The display export could not start.', 'تعذّر بدء تصدير الشاشات.'))}
              />
            </div>
          </Panel>
          <Panel title={t(locale, 'HDR & color boundary', 'حدود HDR والألوان')} icon={Info}>
            <DataRows
              rows={[
                { label: t(locale, 'HDR available', 'HDR متاح'), value: selected.hdrAvailable == null ? t(locale, 'Unknown — no supported provider', 'مجهول — لا مزود مدعوم') : selected.hdrAvailable ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا'), tone: selected.hdrAvailable == null ? 'muted' : selected.hdrAvailable ? 'good' : 'muted' },
                { label: t(locale, 'HDR enabled', 'HDR مفعّل'), value: selected.hdrEnabled == null ? t(locale, 'Unknown', 'مجهول') : selected.hdrEnabled ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا') },
                { label: t(locale, 'Color profile', 'ملف الألوان'), value: t(locale, 'Not measured', 'غير مقيس'), tone: 'muted' },
                { label: t(locale, 'Variable refresh', 'التحديث المتغير'), value: t(locale, 'Not measured', 'غير مقيس'), tone: 'muted' },
              ]}
            />
            <InfoNote tone="muted">
              {t(locale, 'Win32_VideoController and WmiMonitorID do not expose HDR state or color profiles. The fields above stay unknown instead of being inferred from the resolution or panel name.', 'لا يتيح Win32_VideoController وWmiMonitorID حالة HDR أو ملفات الألوان. تبقى الحقول أعلاه مجهولة بدل استنتاجها من الدقة أو اسم اللوحة.')}
            </InfoNote>
          </Panel>
        </div>
      ) : null}
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 35 - Audio Endpoint Mixer                                                 */
/* ------------------------------------------------------------------------- */

export function AudioWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const endpoints = snapshot.hardware.audio;
  const [kind, setKind] = useState<'all' | 'output' | 'input'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => endpoints.filter((endpoint) => {
    if (kind !== 'all' && endpoint.kind !== kind) return false;
    if (query.trim() && !`${endpoint.name} ${endpoint.manufacturer ?? ''} ${endpoint.driver ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  }), [endpoints, kind, query]);
  const selected = endpoints.find((endpoint) => endpoint.id === selectedId) || rows[0] || null;

  return (
    <WorkbenchFrame
      id="hardware-audio"
      locale={locale}
      state="partial"
      provider="Win32_SoundDevice + PnP AudioEndpoint"
      foot={
        <>
          <span><Volume2 aria-hidden="true" />{formatCount(endpoints.length)} {t(locale, 'audio endpoint(s)', 'نقطة صوت')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'Default-device claims require CoreAudio and are not inferred.', 'ادعاءات الجهاز الافتراضي تتطلب CoreAudio ولا تُستنتج.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search endpoint, manufacturer or driver…', 'ابحث في نقطة الصوت أو المصنّع أو البرنامج…')} />
        <Seg
          value={kind}
          onChange={setKind}
          ariaLabel={t(locale, 'Endpoint kind', 'نوع النقطة')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All', 'الكل') },
            { value: 'output', label: t(locale, 'Output', 'إخراج') },
            { value: 'input', label: t(locale, 'Input', 'إدخال') },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.openSettings('sound')} disabled={controller.busy === 'settings'}>
          <Wrench aria-hidden="true" />
          {t(locale, 'Windows sound settings', 'إعدادات الصوت في Windows')}
        </button>
      </div>

      <div className="sys-audio-mixer">
        {rows.map((endpoint) => (
          <button type="button" key={endpoint.id} className={cx('sys-audio-strip', selected?.id === endpoint.id && 'is-active')} onClick={() => setSelectedId(endpoint.id)}>
            <span className="sys-audio-glyph" aria-hidden="true">{endpoint.kind === 'output' ? <Volume2 /> : <Activity />}</span>
            <span className="sys-audio-copy" dir="auto">
              <strong title={endpoint.name}>{endpoint.name}</strong>
              <em title={endpoint.manufacturer || undefined}>{endpoint.manufacturer || t(locale, 'Manufacturer unknown', 'المصنّع مجهول')}</em>
            </span>
            <span className="sys-audio-fader" aria-hidden="true"><span /></span>
            <Chip tone={String(endpoint.status).toLowerCase() === 'ok' ? 'good' : endpoint.status ? 'warn' : 'muted'}>{endpoint.status || '—'}</Chip>
          </button>
        ))}
        {!rows.length ? <EmptyBlock icon={Volume2} title={t(locale, 'No audio endpoint matches', 'لا نقطة صوت مطابقة')} message={t(locale, 'Clear the kind or search filter.', 'امسح مرشح النوع أو البحث.')} /> : null}
      </div>

      {selected ? (
        <div className="sys-split-2">
          <Panel title={t(locale, 'Endpoint dossier', 'ملف النقطة')} sub={selected.name} icon={Volume2}>
            <KeyValueGrid>
              <Field label={t(locale, 'Kind', 'النوع')} value={selected.kind === 'output' ? t(locale, 'Output', 'إخراج') : t(locale, 'Input', 'إدخال')} />
              <Field label={t(locale, 'Manufacturer', 'المصنّع')} value={selected.manufacturer || '—'} />
              <Field label={t(locale, 'Status', 'الحالة')} value={selected.status || '—'} tone={String(selected.status).toLowerCase() === 'ok' ? 'good' : 'warn'} />
              <Field label={t(locale, 'Default device', 'الجهاز الافتراضي')} value={selected.isDefault == null ? t(locale, 'Unknown — CoreAudio not queried', 'مجهول — لم يُستعلم CoreAudio') : selected.isDefault ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا')} tone="muted" />
              <Field label={t(locale, 'Driver', 'البرنامج')} value={selected.driver || '—'} />
              <Field label={t(locale, 'Formats', 'التنسيقات')} value={selected.formats.length ? selected.formats.join(', ') : t(locale, 'Not returned', 'غير متاحة')} />
              <Field label={t(locale, 'PNP device', 'جهاز PNP')} value={selected.pnpDeviceId || '—'} mono className="sys-span-2" />
              <Field label={t(locale, 'Source', 'المصدر')} value={selected.source} className="sys-span-2" />
            </KeyValueGrid>
            <div className="sys-toolbar-row">
              <CopyButton locale={locale} text={selected.pnpDeviceId} label={t(locale, 'Copy PNP ID', 'نسخ معرف PNP')} />
              <ExportButton
                fileName="knoux-audio-endpoints.json"
                payload={endpoints}
                label={t(locale, 'Export audio evidence', 'تصدير أدلة الصوت')}
                onDone={(ok) => controller.showNotice(ok ? t(locale, 'Audio evidence exported.', 'صُدّدت أدلة الصوت.') : t(locale, 'The audio export could not start.', 'تعذّر بدء تصدير الصوت.'))}
              />
            </div>
          </Panel>
          <Panel title={t(locale, 'Mixer boundary', 'حدود المازج')} icon={Info}>
            <DataRows
              rows={[
                { label: t(locale, 'Default output', 'الإخراج الافتراضي'), value: t(locale, 'Unknown without CoreAudio', 'مجهول دون CoreAudio'), tone: 'muted' },
                { label: t(locale, 'Volume level', 'مستوى الصوت'), value: t(locale, 'Not measured', 'غير مقيس'), tone: 'muted' },
                { label: t(locale, 'Mute state', 'حالة الكتم'), value: t(locale, 'Not measured', 'غير مقيس'), tone: 'muted' },
                { label: t(locale, 'Per-app audio', 'صوت لكل تطبيق'), value: t(locale, 'Not measured', 'غير مقيس'), tone: 'muted' },
              ]}
            />
            <InfoNote tone="muted">
              {t(locale, 'Endpoint names, status and controllers come from PnP/CIM. Windows does not identify the default endpoint through these providers, so no fader position or default badge is fabricated.', 'تأتي أسماء نقاط الصوت وحالتها ووحدات التحكم من PnP/CIM. لا يحدد Windows النقطة الافتراضية عبر هذه المزودات، لذلك لا يُختلق موضع منزلق أو شارة افتراضية.')}
            </InfoNote>
          </Panel>
        </div>
      ) : null}
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 36 - Hardware Evidence Report                                             */
/* ------------------------------------------------------------------------- */

export function HealthReportWorkbench({ locale, controller }: WorkbenchProps) {
  const [redact, setRedact] = useState(true);
  const report = controller.report;
  const busy = controller.busy === 'report';

  const build = async () => {
    const value = await controller.loadReport(redact);
    if (value) controller.showNotice(t(locale, `Hardware report built with ${value.sections.length} section(s) and ${value.warnings.length} warning(s).`, `بُني تقرير العتاد مع ${value.sections.length} قسمًا و${value.warnings.length} تحذيرًا.`));
  };

  return (
    <WorkbenchFrame
      id="hardware-health-report"
      locale={locale}
      provider="Measured snapshot only"
      foot={
        <>
          <span><ClipboardCheck aria-hidden="true" />{report ? `${report.receipt} · ${formatTimestamp(report.generatedAt, locale)}` : t(locale, 'No report built in this session', 'لم يُبنَ تقرير في هذه الجلسة')}</span>
          <span><ShieldCheck aria-hidden="true" />{t(locale, 'Reports are read-only and built from the measured snapshot.', 'التقارير للقراءة فقط ومبنية من اللقطة المقيسة.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Toggle checked={redact} onChange={setRedact} label={t(locale, 'Redact serials and device identifiers', 'تنقيح الأرقام التسلسلية ومعرفات الأجهزة')} />
        <button type="button" className="sys-btn sys-btn-primary" onClick={() => void build()} disabled={busy}>
          {busy ? <RefreshCw className="sys-spin" aria-hidden="true" /> : <ClipboardCheck aria-hidden="true" />}
          {t(locale, 'Build measured report', 'بناء التقرير المقيس')}
        </button>
        <span className="sys-toolbar-spacer" />
        {report ? <Chip tone="good" icon={CheckCircle2}>{t(locale, 'Generated', 'مُنشأ')}</Chip> : <Chip tone="muted">{t(locale, 'Not generated', 'غير منشأ')}</Chip>}
      </div>

      {report ? (
        <>
          <div className="sys-report-hero">
            <div>
              <span>{t(locale, 'Hardware evidence report', 'تقرير أدلة العتاد')}</span>
              <strong>{report.summary}</strong>
              <em>{report.redacted ? t(locale, 'Redacted identifiers', 'معرفات منقّحة') : t(locale, 'Identifiers included by request', 'المعرفات مضمنة بطلب')}</em>
            </div>
            <div className="sys-report-stats">
              {report.sections.map((section) => (
                <div className="sys-report-stat" key={section.id}>
                  <span>{locale === AR ? section.titleAr : section.titleEn}</span>
                  <strong>{formatCount(section.measured)}</strong>
                  <em>{t(locale, 'measured', 'مقيس')} · {formatCount(section.unknown)} {t(locale, 'unknown', 'مجهول')}</em>
                  <Chip tone={section.status === 'validated' ? 'good' : section.status === 'partial' ? 'warn' : 'muted'}>{section.status}</Chip>
                </div>
              ))}
            </div>
          </div>

          <div className="sys-report-sections">
            {report.sections.map((section) => (
              <Panel
                key={section.id}
                title={locale === AR ? section.titleAr : section.titleEn}
                sub={`${formatCount(section.measured)} ${t(locale, 'measured', 'مقيس')} · ${formatCount(section.unknown)} ${t(locale, 'unknown', 'مجهول')}`}
                icon={FileCode2}
                actions={<Chip tone={section.status === 'validated' ? 'good' : section.status === 'partial' ? 'warn' : 'muted'}>{section.status}</Chip>}
                bodyClassName="sys-panel-body-flush"
              >
                <div className="sys-report-rows">
                  {section.items.map((item, index) => (
                    <div className={cx('sys-report-row', `is-${item.status}`)} key={`${section.id}-${index}-${item.label}`}>
                      <span>{item.label}</span>
                      <strong className="sys-mono">{item.value}</strong>
                      <em>{item.status}</em>
                    </div>
                  ))}
                </div>
              </Panel>
            ))}
          </div>

          {report.warnings.length ? (
            <Panel title={t(locale, 'Report warnings', 'تحذيرات التقرير')} icon={AlertTriangle}>
              <DataRows rows={report.warnings.map((warning, index) => ({ label: `W${index + 1}`, value: warning, tone: 'warn' }))} />
            </Panel>
          ) : null}

          <div className="sys-toolbar-row">
            <CopyButton locale={locale} text={report.receipt} label={t(locale, 'Copy receipt', 'نسخ الإيصال')} />
            <ExportButton
              fileName={`knoux-hardware-report-${report.redacted ? 'redacted' : 'full'}.json`}
              payload={report}
              label={t(locale, 'Export report', 'تصدير التقرير')}
              onDone={(ok) => controller.showNotice(ok ? t(locale, 'Hardware report exported.', 'صُدّد تقرير العتاد.') : t(locale, 'The report export could not start.', 'تعذّر بدء تصدير التقرير.'))}
            />
            <Chip tone="muted">{t(locale, 'Sections', 'الأقسام')}: {formatCount(report.sections.length)}</Chip>
          </div>
        </>
      ) : (
        <div className="sys-split-2">
          <Panel title={t(locale, 'What the report contains', 'ماذا يتضمن التقرير')} icon={ClipboardCheck}>
            <DataRows
              rows={[
                { label: t(locale, 'Identity', 'الهوية'), value: t(locale, 'OS, build, board, BIOS', 'النظام والبناء واللوحة وBIOS') },
                { label: t(locale, 'Compute', 'الحوسبة'), value: t(locale, 'CPU, GPU, memory modules', 'المعالج والرسوميات وشرائح الذاكرة') },
                { label: t(locale, 'Storage', 'التخزين'), value: t(locale, 'Physical disks and reliability counters', 'الأقراص الفعلية وعدادات الموثوقية') },
                { label: t(locale, 'Power & sensors', 'الطاقة والمستشعرات'), value: t(locale, 'Battery and thermal evidence', 'أدلة البطارية والحرارة') },
                { label: t(locale, 'Peripherals', 'الأجهزة الملحقة'), value: t(locale, 'USB, displays, audio endpoints', 'USB والشاشات ونقاط الصوت') },
                { label: t(locale, 'Network', 'الشبكة'), value: t(locale, 'Interfaces, routes, sockets, Wi-Fi', 'الواجهات والمسارات والمقابس وWi-Fi') },
              ]}
            />
          </Panel>
          <Panel title={t(locale, 'Validation rules', 'قواعد التحقق')} icon={ShieldCheck}>
            <InfoNote tone="muted">
              {t(locale, 'Each section counts measured and unknown values. A section becomes partial when any required reading is unknown, and unavailable when the provider returned nothing. The report never fills a gap with a model default.', 'يعد كل قسم القيم المقيسة والمجهولة. يصبح القسم جزئيًا عند جهل أي قراءة مطلوبة، وغير متاح عندما لا يعيد المزود شيئًا. لا يملأ التقرير فجوة بقيمة افتراضية للطراز.')}
            </InfoNote>
            <InfoNote tone="info">
              {t(locale, 'Build the report explicitly. Redaction is on by default; turning it off includes measured serials and PNP identifiers in the exported JSON.', 'ابنِ التقرير صراحةً. التنقيح مفعّل افتراضيًا؛ إيقافه يضمّن الأرقام التسلسلية المقيسة ومعرفات PNP في JSON المصدّر.')}
            </InfoNote>
          </Panel>
        </div>
      )}
    </WorkbenchFrame>
  );
}
