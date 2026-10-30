/**
 * KNOuX Live Pulse - system world workbenches, part B (services 07-12).
 * Driver, channel, consumer, autorun, dependency and timeline evidence is read
 * from the measured snapshot. No service control, log clear, process kill or
 * startup write channel exists.
 */
import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  Cpu,
  Database,
  FileCode2,
  Flame,
  GitBranch,
  HardDrive,
  Info,
  Layers,
  ListFilter,
  MemoryStick,
  Package,
  ScrollText,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type {
  SystemDriver,
  SystemEventChannelInfo,
  SystemProcess,
  SystemServiceNode,
  SystemStartupLink,
  SystemTimelineEvent,
} from '../../shared/native-contracts';
import type { SystemLocale } from './catalog';
import type { WorkbenchProps } from './types';
import {
  formatBytes,
  formatCount,
  formatDate,
  formatPercent,
  formatTimestamp,
  percentageTone,
  signatureMeta,
  sortProcesses,
  t,
  type ProcessSort,
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
  InfoNote,
  KeyValueGrid,
  MeterBar,
  MiniStat,
  Panel,
  SearchBox,
  Seg,
  SelectBox,
  Toggle,
  WorkbenchFrame,
  cx,
} from './ui';

const AR = 'ar';

const LANE_META: Record<SystemTimelineEvent['lane'], { en: string; ar: string; tone: Tone; icon: LucideIcon }> = {
  knoux: { en: 'KNOuX', ar: 'KNOuX', tone: 'violet', icon: BadgeCheck },
  windows: { en: 'Windows', ar: 'Windows', tone: 'info', icon: ScrollText },
  observation: { en: 'Observation', ar: 'المراقبة', tone: 'good', icon: Activity },
};

const SEVERITY_META: Record<SystemTimelineEvent['severity'], { en: string; ar: string; tone: Tone }> = {
  info: { en: 'Info', ar: 'معلومات', tone: 'info' },
  warning: { en: 'Warning', ar: 'تحذير', tone: 'warn' },
  error: { en: 'Error', ar: 'خطأ', tone: 'bad' },
  critical: { en: 'Critical', ar: 'حرج', tone: 'bad' },
};

function driverState(driver: SystemDriver): { en: string; ar: string; tone: Tone } {
  if (driver.signed === true) return { en: 'Signed', ar: 'موقّع', tone: 'good' };
  if (driver.signed === false) return { en: 'Unsigned', ar: 'غير موقّع', tone: 'bad' };
  return { en: 'Unknown', ar: 'مجهول', tone: 'muted' };
}

function valueOrDash(value: string | number | null | undefined, dash = '—'): string {
  if (value == null) return dash;
  const text = String(value).trim();
  return text ? text : dash;
}

/* ------------------------------------------------------------------------- */
/* 07 - Driver Inventory & Signatures                                        */
/* ------------------------------------------------------------------------- */

export function DriverInventoryWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | 'signed' | 'unsigned' | 'unknown'>('all');
  const [classFilter, setClassFilter] = useState('all');
  const [sort, setSort] = useState<'name' | 'provider' | 'date'>('name');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const classes = useMemo(() => {
    const set = new Set<string>();
    for (const driver of snapshot.drivers) if (driver.deviceClass) set.add(driver.deviceClass);
    return [...set].sort();
  }, [snapshot.drivers]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = snapshot.drivers.filter((driver) => {
      if (stateFilter === 'signed' && driver.signed !== true) return false;
      if (stateFilter === 'unsigned' && driver.signed !== false) return false;
      if (stateFilter === 'unknown' && driver.signed != null) return false;
      if (classFilter !== 'all' && driver.deviceClass !== classFilter) return false;
      if (needle) {
        const haystack = `${driver.deviceName} ${driver.provider ?? ''} ${driver.version ?? ''} ${driver.signer ?? ''} ${driver.infName ?? ''} ${driver.deviceId ?? ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    return rows.sort((left, right) => {
      if (sort === 'provider') return (left.provider || '').localeCompare(right.provider || '') || left.deviceName.localeCompare(right.deviceName);
      if (sort === 'date') return (right.driverDate || '').localeCompare(left.driverDate || '') || left.deviceName.localeCompare(right.deviceName);
      return left.deviceName.localeCompare(right.deviceName);
    });
  }, [classFilter, query, snapshot.drivers, sort, stateFilter]);

  const selected = filtered.find((driver) => driver.id === selectedId) || filtered[0] || null;
  const counts = useMemo(() => {
    const result = { signed: 0, unsigned: 0, unknown: 0 };
    for (const driver of snapshot.drivers) {
      if (driver.signed === true) result.signed += 1;
      else if (driver.signed === false) result.unsigned += 1;
      else result.unknown += 1;
    }
    return result;
  }, [snapshot.drivers]);

  return (
    <WorkbenchFrame
      id="system-drivers"
      locale={locale}
      provider="Win32_PnPSignedDriver"
      foot={
        <>
          <span><Database aria-hidden="true" />{formatCount(snapshot.drivers.length)} {t(locale, 'measured driver rows', 'صف برنامج تشغيل مقيس')} · {t(locale, 'cap', 'الحد')} 300</span>
          <span><ShieldCheck aria-hidden="true" />{t(locale, 'Driver installation, update and rollback are not exposed.', 'تثبيت برامج التشغيل وتحديثها والرجوع عنها غير متاحة.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search device, provider, signer or INF…', 'ابحث في الجهاز أو المزود أو الموقّع أو INF…')} />
        <SelectBox
          value={classFilter}
          onChange={setClassFilter}
          ariaLabel={t(locale, 'Filter device class', 'تصفية فئة الجهاز')}
          options={[{ value: 'all', label: t(locale, 'All classes', 'كل الفئات') }, ...classes.map((entry) => ({ value: entry, label: entry }))]}
        />
        <Seg
          value={stateFilter}
          onChange={setStateFilter}
          ariaLabel={t(locale, 'Filter signature state', 'تصفية حالة التوقيع')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All', 'الكل') },
            { value: 'signed', label: t(locale, 'Signed', 'موقّع') },
            { value: 'unsigned', label: t(locale, 'Unsigned', 'غير موقّع') },
            { value: 'unknown', label: t(locale, 'Unknown', 'مجهول') },
          ]}
        />
        <SelectBox
          value={sort}
          onChange={(value) => setSort(value as 'name' | 'provider' | 'date')}
          ariaLabel={t(locale, 'Sort drivers', 'ترتيب برامج التشغيل')}
          options={[
            { value: 'name', label: t(locale, 'Sort: device', 'الترتيب: الجهاز') },
            { value: 'provider', label: t(locale, 'Sort: provider', 'الترتيب: المزود') },
            { value: 'date', label: t(locale, 'Sort: newest', 'الترتيب: الأحدث') },
          ]}
        />
      </div>

      <div className="sys-mini-row">
        <MiniStat label={t(locale, 'Signed', 'موقّع')} value={formatCount(counts.signed)} tone="good" icon={BadgeCheck} />
        <MiniStat label={t(locale, 'Unsigned', 'غير موقّع')} value={formatCount(counts.unsigned)} tone={counts.unsigned ? 'bad' : 'muted'} icon={ShieldAlert} />
        <MiniStat label={t(locale, 'Unknown', 'مجهول')} value={formatCount(counts.unknown)} tone="muted" icon={Info} />
        <MiniStat label={t(locale, 'Matching filter', 'مطابق للمرشح')} value={formatCount(filtered.length)} icon={ListFilter} />
      </div>

      <div className="sys-split-ledger">
        <Panel
          className="sys-ledger-panel"
          title={t(locale, 'Driver register', 'سجل برامج التشغيل')}
          sub={`${formatCount(filtered.length)} ${t(locale, 'rows', 'صف')}`}
          icon={HardDrive}
          bodyClassName="sys-panel-body-flush"
        >
          {filtered.length ? (
            <div className="sys-table-wrap">
              <table className="sys-table">
                <thead>
                  <tr>
                    <th>{t(locale, 'Device', 'الجهاز')}</th>
                    <th>{t(locale, 'Class', 'الفئة')}</th>
                    <th>{t(locale, 'Provider', 'المزود')}</th>
                    <th>{t(locale, 'Version', 'الإصدار')}</th>
                    <th>{t(locale, 'Signature', 'التوقيع')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 200).map((driver) => {
                    const state = driverState(driver);
                    return (
                      <tr
                        key={driver.id}
                        className={cx(selected?.id === driver.id && 'is-selected')}
                        onClick={() => setSelectedId(driver.id)}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedId(driver.id);
                          }
                        }}
                        aria-selected={selected?.id === driver.id}
                      >
                        <td>
                          <strong className="sys-row-name" title={driver.deviceName} dir="auto">{driver.deviceName}</strong>
                          <span className="sys-row-sub" title={driver.infName || undefined} dir="auto">{driver.infName || t(locale, 'INF not returned', 'INF غير متاح')}</span>
                        </td>
                        <td className="sys-mono">{driver.deviceClass || '—'}</td>
                        <td>{driver.provider || '—'}</td>
                        <td className="sys-mono">{driver.version || '—'}</td>
                        <td><Chip tone={state.tone}>{locale === AR ? state.ar : state.en}</Chip></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyBlock icon={Search} title={t(locale, 'No driver matches', 'لا برنامج تشغيل مطابق')} message={t(locale, 'Clear the search or signature filter to return to the measured inventory.', 'امسح البحث أو مرشح التوقيع للعودة إلى الجرد المقيس.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel
            title={t(locale, 'Driver dossier', 'ملف برنامج التشغيل')}
            sub={selected ? valueOrDash(selected.deviceId) : t(locale, 'Select a measured row', 'اختر صفًا مقيسًا')}
            icon={Package}
            actions={
              selected ? (
                <ExportButton
                  fileName={`knoux-driver-${selected.id}.json`}
                  payload={selected}
                  label={t(locale, 'Export row', 'تصدير الصف')}
                  onDone={(ok) => controller.showNotice(ok ? t(locale, 'Driver evidence exported.', 'صُدّرت أدلة برنامج التشغيل.') : t(locale, 'The driver export could not start.', 'تعذّر بدء تصدير برنامج التشغيل.'))}
                />
              ) : null
            }
          >
            {selected ? (
              <>
                <KeyValueGrid>
                  <Field label={t(locale, 'Device name', 'اسم الجهاز')} value={selected.deviceName} className="sys-span-2" />
                  <Field label={t(locale, 'Provider', 'المزود')} value={selected.provider || '—'} />
                  <Field label={t(locale, 'Device class', 'فئة الجهاز')} value={selected.deviceClass || '—'} />
                  <Field label={t(locale, 'Driver version', 'إصدار برنامج التشغيل')} value={selected.version || '—'} mono />
                  <Field label={t(locale, 'Driver date', 'تاريخ برنامج التشغيل')} value={formatDate(selected.driverDate, locale)} />
                  <Field label={t(locale, 'INF file', 'ملف INF')} value={selected.infName || '—'} mono />
                  <Field label={t(locale, 'WHQL / signed', 'WHQL / موقّع')} value={driverState(selected)[locale === AR ? 'ar' : 'en']} tone={driverState(selected).tone} />
                  <Field label={t(locale, 'Signer', 'الموقّع')} value={selected.signer || t(locale, 'Not returned', 'لم يُعد')} className="sys-span-2" />
                  <Field label={t(locale, 'Source', 'المصدر')} value={selected.source} mono className="sys-span-2" />
                </KeyValueGrid>
                <div className="sys-toolbar-row">
                  <CopyButton locale={locale} text={selected.deviceId} label={t(locale, 'Copy device ID', 'نسخ معرف الجهاز')} />
                  <Chip tone="muted" icon={ShieldCheck}>{t(locale, 'Read-only inventory', 'جرد للقراءة فقط')}</Chip>
                </div>
                {selected.hardwareIds.length ? (
                  <CodeBlock label={t(locale, 'Hardware IDs', 'معرفات العتاد')}>{selected.hardwareIds.slice(0, 8).join('\n')}</CodeBlock>
                ) : (
                  <InfoNote tone="muted">{t(locale, 'No hardware ID was returned for this driver row.', 'لم يُعد معرف عتاد لصف برنامج التشغيل هذا.')}</InfoNote>
                )}
              </>
            ) : (
              <EmptyBlock compact icon={HardDrive} title={t(locale, 'No driver selected', 'لا برنامج تشغيل محدد')} message={t(locale, 'Select a measured driver row to inspect its signer and INF evidence.', 'اختر صف برنامج تشغيل مقيسًا لفحص أدلة الموقّع وINF.')} />
            )}
          </Panel>
          <Panel title={t(locale, 'Signature policy', 'سياسة التوقيع')} icon={ShieldCheck}>
            <DataRows
              rows={[
                { label: t(locale, 'Signed rows', 'الصفوف الموقعة'), value: formatCount(counts.signed), tone: 'good' },
                { label: t(locale, 'Unsigned rows', 'الصفوف غير الموقعة'), value: formatCount(counts.unsigned), tone: counts.unsigned ? 'bad' : 'good' },
                { label: t(locale, 'Unknown rows', 'الصفوف المجهولة'), value: formatCount(counts.unknown), tone: 'muted' },
                { label: t(locale, 'Measurement', 'القياس'), value: 'Win32_PnPSignedDriver.IsSigned' },
              ]}
            />
            <InfoNote tone="warn">
              {t(locale, 'WHQL is not a separate provider value here: the badge mirrors the measured IsSigned flag and never claims a Microsoft signature that Windows did not report.', 'WHQL ليست قيمة مزود منفصلة هنا: تعكس الشارة علم IsSigned المقيس ولا تدّعي توقيع Microsoft لم يبلّغ عنه Windows.')}
            </InfoNote>
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 08 - Event Log Channel Explorer                                           */
/* ------------------------------------------------------------------------- */

export function LogChannelWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const [query, setQuery] = useState('');
  const [onlyEnabled, setOnlyEnabled] = useState(false);
  const [sort, setSort] = useState<'records' | 'size' | 'name'>('records');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [view, setView] = useState<'channels' | 'records'>('channels');

  const channels = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return snapshot.eventChannels
      .filter((channel) => {
        if (onlyEnabled && channel.enabled === false) return false;
        if (needle && !`${channel.name} ${channel.logFilePath ?? ''} ${channel.retention ?? ''}`.toLowerCase().includes(needle)) return false;
        return true;
      })
      .sort((left, right) => {
        if (sort === 'size') return (right.fileSizeBytes ?? -1) - (left.fileSizeBytes ?? -1);
        if (sort === 'name') return left.name.localeCompare(right.name);
        return (right.recordCount ?? -1) - (left.recordCount ?? -1);
      });
  }, [onlyEnabled, query, snapshot.eventChannels, sort]);

  const selected = channels.find((channel) => channel.name === selectedName) || channels[0] || null;
  const channelEvents = useMemo(() => {
    const source = controller.eventsResult?.events || snapshot.events;
    if (!selected) return source.slice(0, 80);
    return source.filter((event) => event.channel === selected.name).slice(0, 80);
  }, [controller.eventsResult, selected, snapshot.events]);
  const totalRecords = useMemo(() => snapshot.eventChannels.reduce((sum, channel) => sum + (channel.recordCount || 0), 0), [snapshot.eventChannels]);
  const totalBytes = useMemo(() => snapshot.eventChannels.reduce((sum, channel) => sum + (channel.fileSizeBytes || 0), 0), [snapshot.eventChannels]);

  const queryChannel = async () => {
    if (!selected) return;
    const result = await controller.queryEvents({ channel: selected.name, limit: 100 });
    if (result) controller.showNotice(t(locale, `${result.events.length} measured record(s) returned from ${selected.name}.`, `أُعيد ${result.events.length} سجلًا مقيسًا من ${selected.name}.`));
  };

  return (
    <WorkbenchFrame
      id="system-logs"
      locale={locale}
      provider="Get-WinEvent -ListLog"
      foot={
        <>
          <span><Database aria-hidden="true" />{formatCount(snapshot.eventChannels.length)} {t(locale, 'channels', 'قناة')} · {formatBytes(totalBytes)}</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'Log clearing and write channels are not exposed.', 'مسح السجلات وقنوات الكتابة غير متاحة.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search channel path or log file…', 'ابحث في مسار القناة أو ملف السجل…')} />
        <Seg
          value={sort}
          onChange={setSort}
          ariaLabel={t(locale, 'Sort channels', 'ترتيب القنوات')}
          compact
          options={[
            { value: 'records', label: t(locale, 'Records', 'السجلات') },
            { value: 'size', label: t(locale, 'Size', 'الحجم') },
            { value: 'name', label: t(locale, 'Name', 'الاسم') },
          ]}
        />
        <Toggle checked={onlyEnabled} onChange={setOnlyEnabled} label={t(locale, 'Enabled only', 'الممكّنة فقط')} />
        <Seg
          value={view}
          onChange={setView}
          ariaLabel={t(locale, 'Switch channel view', 'تبديل عرض القناة')}
          compact
          options={[
            { value: 'channels', label: t(locale, 'Channels', 'القنوات') },
            { value: 'records', label: t(locale, 'Records', 'السجلات') },
          ]}
        />
        {controller.busy === 'events' ? <Chip tone="info">{t(locale, 'Querying…', 'جارٍ الاستعلام…')}</Chip> : null}
      </div>

      <div className="sys-mini-row">
        <MiniStat label={t(locale, 'Channels', 'القنوات')} value={formatCount(snapshot.eventChannels.length)} icon={ScrollText} />
        <MiniStat label={t(locale, 'Measured records', 'السجلات المقيسة')} value={formatCount(totalRecords)} />
        <MiniStat label={t(locale, 'On-disk size', 'الحجم على القرص')} value={formatBytes(totalBytes)} />
        <MiniStat label={t(locale, 'Sampled events', 'الأحداث المعاينة')} value={formatCount(snapshot.events.length)} tone="info" />
      </div>

      <div className="sys-split-ledger">
        <Panel
          className="sys-ledger-panel"
          title={t(locale, 'Channel register', 'سجل القنوات')}
          sub={`${formatCount(channels.length)} ${t(locale, 'matching channels', 'قناة مطابقة')}`}
          icon={ScrollText}
          bodyClassName="sys-panel-body-flush"
        >
          {channels.length ? (
            <div className="sys-table-wrap">
              <table className="sys-table">
                <thead>
                  <tr>
                    <th>{t(locale, 'Channel', 'القناة')}</th>
                    <th>{t(locale, 'Records', 'السجلات')}</th>
                    <th>{t(locale, 'Size', 'الحجم')}</th>
                    <th>{t(locale, 'Retention', 'الاحتفاظ')}</th>
                    <th>{t(locale, 'Enabled', 'ممكّنة')}</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.slice(0, 240).map((channel) => (
                    <tr
                      key={channel.name}
                      className={cx(selected?.name === channel.name && 'is-selected')}
                      onClick={() => setSelectedName(channel.name)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedName(channel.name);
                        }
                      }}
                      aria-selected={selected?.name === channel.name}
                    >
                      <td><strong className="sys-row-name sys-mono" title={channel.name} dir="auto">{channel.name}</strong></td>
                      <td className="sys-mono">{formatCount(channel.recordCount)}</td>
                      <td className="sys-mono">{formatBytes(channel.fileSizeBytes)}</td>
                      <td>{channel.retention || '—'}</td>
                      <td>
                        <Chip tone={channel.enabled === false ? 'muted' : channel.enabled ? 'good' : 'warn'}>
                          {channel.enabled == null ? t(locale, 'Unknown', 'مجهول') : channel.enabled ? t(locale, 'Enabled', 'ممكّنة') : t(locale, 'Disabled', 'معطّلة')}
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyBlock icon={ScrollText} title={t(locale, 'No channel matches', 'لا قناة مطابقة')} message={t(locale, 'Only channels enumerated by Get-WinEvent -ListLog are shown.', 'تُعرض فقط القنوات التي عددها Get-WinEvent -ListLog.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel
            title={view === 'channels' ? t(locale, 'Channel dossier', 'ملف القناة') : t(locale, 'Measured channel records', 'سجلات القناة المقيسة')}
            sub={selected?.name}
            icon={Database}
            actions={
              <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void queryChannel()} disabled={!selected || controller.busy === 'events'}>
                <Search aria-hidden="true" />
                {t(locale, 'Query channel', 'استعلام القناة')}
              </button>
            }
          >
            {view === 'channels' ? (
              selected ? (
                <>
                  <KeyValueGrid>
                    <Field label={t(locale, 'Records', 'السجلات')} value={formatCount(selected.recordCount)} mono />
                    <Field label={t(locale, 'File size', 'حجم الملف')} value={formatBytes(selected.fileSizeBytes)} mono />
                    <Field label={t(locale, 'Retention mode', 'وضع الاحتفاظ')} value={selected.retention || '—'} />
                    <Field label={t(locale, 'Enabled', 'ممكّنة')} value={selected.enabled == null ? t(locale, 'Unknown', 'مجهول') : selected.enabled ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا')} tone={selected.enabled ? 'good' : 'muted'} />
                    <Field label={t(locale, 'Last write', 'آخر كتابة')} value={formatTimestamp(selected.lastWriteTime, locale)} />
                    <Field label={t(locale, 'Source', 'المصدر')} value={selected.source} />
                  </KeyValueGrid>
                  <CodeBlock label={t(locale, 'Log file path', 'مسار ملف السجل')}>{selected.logFilePath || t(locale, 'No file path returned.', 'لم يُعد مسار ملف.')}</CodeBlock>
                  <InfoNote tone="muted">
                    {t(locale, 'A record count is the provider-reported value at snapshot time. It is not a live subscription.', 'عدد السجلات هو القيمة التي أبلغ عنها المزود وقت اللقطة. وليس اشتراكًا حيًا.')}
                  </InfoNote>
                </>
              ) : (
                <EmptyBlock compact icon={ScrollText} title={t(locale, 'No channel selected', 'لا قناة محددة')} message={t(locale, 'Select a measured channel row.', 'اختر صف قناة مقيسًا.')} />
              )
            ) : channelEvents.length ? (
              <div className="sys-event-list">
                {channelEvents.map((event) => (
                  <div className="sys-event-row is-static" key={event.id}>
                    <span className="sys-event-level">{event.level ?? '—'}</span>
                    <span className="sys-event-time">{formatTimestamp(event.timeCreated, locale)}</span>
                    <span className="sys-event-body">
                      <strong>{event.provider} · {event.eventId ?? '—'}</strong>
                      <em>{event.message || t(locale, 'No message text returned.', 'لم يُعد نص الرسالة.')}</em>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBlock compact icon={Search} title={t(locale, 'No sampled records for this channel', 'لا سجلات معاينة لهذه القناة')} message={t(locale, 'Run an explicit channel query to read the bounded latest records.', 'شغّل استعلام قناة صريحًا لقراءة أحدث السجلات المحدودة.')} />
            )}
          </Panel>
          <Panel title={t(locale, 'Channel distribution', 'توزيع القنوات')} icon={Layers}>
            {channels.slice(0, 8).map((channel) => (
              <MeterBar
                key={channel.name}
                label={<span className="sys-mono">{channel.name.length > 44 ? `${channel.name.slice(0, 44)}…` : channel.name}</span>}
                value={channel.fileSizeBytes}
                max={Math.max(1, ...channels.map((entry) => entry.fileSizeBytes || 0))}
                caption={formatBytes(channel.fileSizeBytes)}
                tone="info"
              />
            ))}
            {!channels.length ? <em className="sys-muted-text">{t(locale, 'No measured channel sizes to chart.', 'لا أحجام قنوات مقيسة للرسم.')}</em> : null}
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 09 - Top Resource Consumers                                               */
/* ------------------------------------------------------------------------- */

type ConsumerMetric = 'cpu' | 'memory' | 'handles' | 'threads';

export function TopConsumersWorkbench({ locale, snapshot, controller, onOpenService }: WorkbenchProps) {
  const [metric, setMetric] = useState<ConsumerMetric>('cpu');
  const [limit, setLimit] = useState<'10' | '20' | '30'>('10');
  const [includeProtected, setIncludeProtected] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedPid, setSelectedPid] = useState<number | null>(null);

  const rows = useMemo(() => {
    const pool = snapshot.processes.filter((process) => {
      if (!includeProtected && process.protected) return false;
      if (query.trim()) return `${process.name} ${process.pid} ${process.owner ?? ''}`.toLowerCase().includes(query.trim().toLowerCase());
      return true;
    });
    const sorted = metric === 'cpu'
      ? sortProcesses(pool, 'cpu')
      : metric === 'memory'
        ? sortProcesses(pool, 'memory')
        : [...pool].sort((left, right) => {
          const pick = (process: SystemProcess) => (metric === 'handles' ? process.handles : process.threads) ?? -1;
          return pick(right) - pick(left);
        });
    return sorted.slice(0, Number(limit));
  }, [includeProtected, limit, metric, query, snapshot.processes]);

  const valueOf = (process: SystemProcess): number | null => {
    if (metric === 'cpu') return process.cpuPercent;
    if (metric === 'memory') return process.workingSetBytes;
    if (metric === 'handles') return process.handles;
    return process.threads;
  };
  const format = (process: SystemProcess): string => {
    if (metric === 'cpu') return formatPercent(process.cpuPercent, 1);
    if (metric === 'memory') return formatBytes(process.workingSetBytes);
    if (metric === 'handles') return formatCount(process.handles);
    return formatCount(process.threads);
  };
  const max = Math.max(1, ...rows.map((process) => valueOf(process) || 0));
  const selected = rows.find((process) => process.pid === selectedPid) || rows[0] || null;
  const totals = useMemo(() => {
    const workingSet = snapshot.processes.reduce((sum, process) => sum + (process.workingSetBytes || 0), 0);
    const threads = snapshot.processes.reduce((sum, process) => sum + (process.threads || 0), 0);
    const handles = snapshot.processes.reduce((sum, process) => sum + (process.handles || 0), 0);
    const protectedCount = snapshot.processes.filter((process) => process.protected).length;
    return { workingSet, threads, handles, protectedCount };
  }, [snapshot.processes]);

  const metricMeta: Record<ConsumerMetric, { en: string; ar: string; icon: LucideIcon }> = {
    cpu: { en: 'CPU share', ar: 'حصة المعالج', icon: Cpu },
    memory: { en: 'Working set', ar: 'مجموعة العمل', icon: MemoryStick },
    handles: { en: 'Handles', ar: 'المقابض', icon: ListFilter },
    threads: { en: 'Threads', ar: 'الخيوط', icon: Activity },
  };

  return (
    <WorkbenchFrame
      id="system-resources"
      locale={locale}
      provider="Win32_Process + PerfProc"
      foot={
        <>
          <span><Database aria-hidden="true" />{formatCount(snapshot.processes.length)} {t(locale, 'measured processes', 'عملية مقيسة')}</span>
          <span><ShieldCheck aria-hidden="true" />{t(locale, 'No process is terminated, suspended or prioritized by this page.', 'لا تُنهى أي عملية أو تُعلّق أو تُعطى أولوية عبر هذه الصفحة.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Seg
          value={metric}
          onChange={setMetric}
          ariaLabel={t(locale, 'Rank by metric', 'الترتيب حسب القياس')}
          options={(Object.keys(metricMeta) as ConsumerMetric[]).map((key) => ({
            value: key,
            label: locale === AR ? metricMeta[key].ar : metricMeta[key].en,
          }))}
        />
        <SelectBox
          value={limit}
          onChange={(value) => setLimit(value as '10' | '20' | '30')}
          ariaLabel={t(locale, 'Row limit', 'حد الصفوف')}
          options={[
            { value: '10', label: t(locale, 'Top 10', 'الأعلى 10') },
            { value: '20', label: t(locale, 'Top 20', 'الأعلى 20') },
            { value: '30', label: t(locale, 'Top 30', 'الأعلى 30') },
          ]}
        />
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Filter by process name or PID…', 'تصفية باسم العملية أو PID…')} />
        <Toggle checked={includeProtected} onChange={setIncludeProtected} label={t(locale, 'Include protected', 'تضمين المحمية')} />
      </div>

      <div className="sys-mini-row">
        <MiniStat label={t(locale, 'Measured working set', 'مجموعة العمل المقيسة')} value={formatBytes(totals.workingSet)} icon={MemoryStick} />
        <MiniStat label={t(locale, 'Threads', 'الخيوط')} value={formatCount(totals.threads)} />
        <MiniStat label={t(locale, 'Handles', 'المقابض')} value={formatCount(totals.handles)} />
        <MiniStat label={t(locale, 'Protected rows', 'الصفوف المحمية')} value={formatCount(totals.protectedCount)} tone="warn" icon={ShieldAlert} />
      </div>

      <div className="sys-split-consumers">
        <Panel
          className="sys-ledger-panel"
          title={`${t(locale, 'Top', 'أعلى')} ${rows.length} · ${locale === AR ? metricMeta[metric].ar : metricMeta[metric].en}`}
          sub={t(locale, 'Ranked from the measured process register only.', 'مرتبة من سجل العمليات المقيس فقط.')}
          icon={Flame}
          bodyClassName="sys-panel-body-flush"
        >
          {rows.length ? (
            <div className="sys-consumer-list">
              {rows.map((process, index) => (
                <button
                  type="button"
                  key={process.id}
                  className={cx('sys-consumer-row', selected?.pid === process.pid && 'is-active')}
                  onClick={() => setSelectedPid(process.pid)}
                >
                  <span className="sys-consumer-rank">{String(index + 1).padStart(2, '0')}</span>
                  <span className="sys-consumer-name">
                    <strong>{process.name}</strong>
                    <em>PID {process.pid} · {process.owner || t(locale, 'owner unavailable', 'المالك غير متاح')}</em>
                  </span>
                  <span className="sys-consumer-meter">
                    <MeterBar value={valueOf(process)} max={max} tone={percentageTone(metric === 'cpu' ? process.cpuPercent : (valueOf(process) || 0) / max * 100)} height={5} />
                  </span>
                  <strong className="sys-consumer-value sys-mono">{format(process)}</strong>
                  {process.protected ? <Chip tone="warn">{t(locale, 'Protected', 'محمية')}</Chip> : null}
                </button>
              ))}
            </div>
          ) : (
            <EmptyBlock icon={Search} title={t(locale, 'No measured process matches', 'لا عملية مقيسة مطابقة')} message={t(locale, 'Clear the filter or include protected processes.', 'امسح المرشح أو ضمّن العمليات المحمية.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Consumer dossier', 'ملف المستهلك')} sub={selected ? `${selected.name} · PID ${selected.pid}` : undefined} icon={Cpu}>
            {selected ? (
              <>
                <KeyValueGrid>
                  <Field label={t(locale, 'CPU share', 'حصة المعالج')} value={formatPercent(selected.cpuPercent, 1)} tone={percentageTone(selected.cpuPercent)} />
                  <Field label={t(locale, 'Working set', 'مجموعة العمل')} value={formatBytes(selected.workingSetBytes)} />
                  <Field label={t(locale, 'Private bytes', 'بايتات خاصة')} value={formatBytes(selected.privateBytes)} />
                  <Field label={t(locale, 'Handles', 'المقابض')} value={formatCount(selected.handles)} />
                  <Field label={t(locale, 'Threads', 'الخيوط')} value={formatCount(selected.threads)} />
                  <Field label={t(locale, 'Signature', 'التوقيع')} value={selected.signatureAvailable ? signatureMeta(selected.signatureStatus)[locale === AR ? 'ar' : 'en'] : t(locale, 'Not checked', 'لم يُفحص')} />
                </KeyValueGrid>
                <div className="sys-toolbar-row">
                  <button
                    type="button"
                    className="sys-btn sys-btn-quiet"
                    onClick={() => {
                      controller.showNotice(`Process Register opened for PID ${selected.pid} (${selected.name}).`);
                      onOpenService('system-processes');
                    }}
                  >
                    <ListFilter aria-hidden="true" />
                    {t(locale, 'Open process register', 'فتح سجل العمليات')}
                  </button>
                  <CopyButton locale={locale} text={selected.executablePath} label={t(locale, 'Copy path', 'نسخ المسار')} />
                </div>
              </>
            ) : (
              <EmptyBlock compact icon={Cpu} title={t(locale, 'No consumer selected', 'لا مستهلك محدد')} message={t(locale, 'Select a ranked measured process.', 'اختر عملية مقيسة مرتبة.')} />
            )}
          </Panel>
          <Panel title={t(locale, 'Measurement honesty', 'صدق القياس')} icon={Info}>
            <InfoNote tone="muted">
              {t(locale, 'Per-process disk throughput is not exposed by Win32_Process in this provider set; the disk instrument stays at the system level. CPU shares are the provider-reported instantaneous values and may sum above 100% on multi-core systems.', 'لا يتاح صبيب القرص لكل عملية عبر Win32_Process في هذه المجموعة؛ يبقى مقياس القرص على مستوى النظام. حصص المعالج هي القيم اللحظية التي يبلغ عنها المزود وقد يتجاوز مجموعها 100% في الأنظمة متعددة النوى.')}
            </InfoNote>
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 10 - App-to-Process Links                                                 */
/* ------------------------------------------------------------------------- */

const LINK_META: Record<SystemStartupLink['linkType'], { en: string; ar: string; tone: Tone }> = {
  'process-match': { en: 'Process match', ar: 'مطابقة عملية', tone: 'good' },
  'service-match': { en: 'Service match', ar: 'مطابقة خدمة', tone: 'info' },
  'app-match': { en: 'App match', ar: 'مطابقة تطبيق', tone: 'info' },
  unlinked: { en: 'Unlinked', ar: 'غير مرتبط', tone: 'muted' },
};

export function AutostartLinksWorkbench({ locale, snapshot, controller, onOpenService }: WorkbenchProps) {
  const [query, setQuery] = useState('');
  const [linkType, setLinkType] = useState<'all' | SystemStartupLink['linkType']>('all');
  const [scope, setScope] = useState<'all' | 'user' | 'machine' | 'unknown'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const links = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return snapshot.startupLinks.filter((link) => {
      if (linkType !== 'all' && link.linkType !== linkType) return false;
      if (scope !== 'all' && link.scope !== scope) return false;
      if (needle && !`${link.name} ${link.command} ${link.source} ${link.evidence}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [linkType, query, scope, snapshot.startupLinks]);

  const selected = links.find((link) => link.id === selectedId) || links[0] || null;
  const linkedProcess = selected?.processId != null ? snapshot.processes.find((process) => process.pid === selected.processId) || null : null;
  const linkedService = selected?.serviceName ? snapshot.services.find((service) => service.name === selected.serviceName) || null : null;
  const counts = useMemo(() => {
    const result = { process: 0, service: 0, unlinked: 0 };
    for (const link of snapshot.startupLinks) {
      if (link.linkType === 'process-match') result.process += 1;
      else if (link.linkType === 'service-match') result.service += 1;
      else result.unlinked += 1;
    }
    return result;
  }, [snapshot.startupLinks]);

  return (
    <WorkbenchFrame
      id="system-autostart"
      locale={locale}
      state="partial"
      provider="Win32_StartupCommand + Win32_Process + Win32_Service"
      foot={
        <>
          <span><GitBranch aria-hidden="true" />{formatCount(snapshot.startupLinks.length)} {t(locale, 'measured autoruns', 'مدخل بدء مقيس')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'Cross-links use executable evidence only; unresolved rows stay unlinked.', 'تستخدم الروابط أدلة الملفات التنفيذية فقط؛ الصفوف غير المحلولة تبقى غير مرتبطة.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search autorun, command or evidence…', 'ابحث في مدخل البدء أو الأمر أو الدليل…')} />
        <Seg
          value={linkType}
          onChange={setLinkType}
          ariaLabel={t(locale, 'Filter link type', 'تصفية نوع الرابط')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All', 'الكل') },
            { value: 'process-match', label: t(locale, 'Process', 'عملية') },
            { value: 'service-match', label: t(locale, 'Service', 'خدمة') },
            { value: 'unlinked', label: t(locale, 'Unlinked', 'غير مرتبط') },
          ]}
        />
        <SelectBox
          value={scope}
          onChange={(value) => setScope(value as typeof scope)}
          ariaLabel={t(locale, 'Filter registry scope', 'تصفية نطاق السجل')}
          options={[
            { value: 'all', label: t(locale, 'All scopes', 'كل النطاقات') },
            { value: 'user', label: t(locale, 'Current user', 'المستخدم الحالي') },
            { value: 'machine', label: t(locale, 'Machine', 'الجهاز') },
            { value: 'unknown', label: t(locale, 'Unknown scope', 'نطاق مجهول') },
          ]}
        />
      </div>

      <div className="sys-mini-row">
        <MiniStat label={t(locale, 'Process matched', 'مطابقة عملية')} value={formatCount(counts.process)} tone="good" icon={Cpu} />
        <MiniStat label={t(locale, 'Service matched', 'مطابقة خدمة')} value={formatCount(counts.service)} tone="info" icon={Layers} />
        <MiniStat label={t(locale, 'Unlinked', 'غير مرتبط')} value={formatCount(counts.unlinked)} tone="muted" icon={Search} />
        <MiniStat label={t(locale, 'Total measured', 'الإجمالي المقيس')} value={formatCount(snapshot.startupLinks.length)} />
      </div>

      <div className="sys-split-links">
        <Panel
          className="sys-ledger-panel"
          title={t(locale, 'Autorun-to-process ledger', 'سجل ربط البدء بالعمليات')}
          sub={`${formatCount(links.length)} ${t(locale, 'matching rows', 'صف مطابق')}`}
          icon={GitBranch}
          bodyClassName="sys-panel-body-flush"
          actions={
            <ExportButton
              fileName="knoux-autostart-links.json"
              payload={{ observedAt: snapshot.generatedAt, receipt: snapshot.receipt, links }}
              label={t(locale, 'Export links', 'تصدير الروابط')}
              onDone={(ok) => controller.showNotice(ok ? t(locale, 'Autorun linkage evidence exported.', 'صُدّدت أدلة ربط مداخل البدء.') : t(locale, 'The linkage export could not start.', 'تعذّر بدء تصدير الروابط.'))}
            />
          }
        >
          {links.length ? (
            <div className="sys-link-list" role="listbox" aria-label={t(locale, 'Measured autorun links', 'روابط البدء المقيسة')}>
              {links.map((link) => {
                const meta = LINK_META[link.linkType];
                return (
                  <button
                    type="button"
                    key={link.id}
                    role="option"
                    aria-selected={selected?.id === link.id}
                    className={cx('sys-link-row', selected?.id === link.id && 'is-active')}
                    onClick={() => setSelectedId(link.id)}
                  >
                    <span className={cx('sys-link-node', `is-${meta.tone}`)} aria-hidden="true" />
                    <span className="sys-link-copy" dir="auto">
                      <strong>{link.name}</strong>
                      <em className="sys-mono">{link.source} · {link.scope}</em>
                    </span>
                    <Chip tone={meta.tone}>{locale === AR ? meta.ar : meta.en}</Chip>
                    <ChevronRight className="sys-link-chevron" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyBlock icon={GitBranch} title={t(locale, 'No autorun matches', 'لا مدخل بدء مطابق')} message={t(locale, 'Only Win32_StartupCommand rows measured in this snapshot are listed.', 'تُدرج فقط صفوف Win32_StartupCommand المقيسة في هذه اللقطة.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Link evidence', 'دليل الربط')} sub={selected?.name} icon={FileCode2}>
            {selected ? (
              <>
                <KeyValueGrid>
                  <Field label={t(locale, 'Link type', 'نوع الرابط')} value={LINK_META[selected.linkType][locale === AR ? 'ar' : 'en']} tone={LINK_META[selected.linkType].tone} />
                  <Field label={t(locale, 'Confidence', 'الثقة')} value={selected.confidence === 'measured' ? t(locale, 'Measured', 'مقيس') : t(locale, 'Inferred', 'مستنتج')} tone={selected.confidence === 'measured' ? 'good' : 'warn'} />
                  <Field label={t(locale, 'Scope', 'النطاق')} value={selected.scope} />
                  <Field label={t(locale, 'PID', 'PID')} value={selected.processId ?? '—'} mono />
                  <Field label={t(locale, 'Service', 'الخدمة')} value={selected.serviceName || '—'} />
                  <Field label={t(locale, 'App', 'التطبيق')} value={selected.appName || '—'} />
                  <Field label={t(locale, 'Location', 'الموقع')} value={selected.location || '—'} className="sys-span-2" mono />
                </KeyValueGrid>
                <CodeBlock label={t(locale, 'Measured command', 'الأمر المقيس')}>{selected.command || t(locale, 'No command text returned.', 'لم يُعد نص الأمر.')}</CodeBlock>
                <InfoNote tone={selected.linkType === 'unlinked' ? 'warn' : 'info'}>{selected.evidence}</InfoNote>
                <div className="sys-toolbar-row">
                  <CopyButton locale={locale} text={selected.command} label={t(locale, 'Copy command', 'نسخ الأمر')} />
                  {linkedProcess ? (
                    <button type="button" className="sys-btn sys-btn-quiet" onClick={() => onOpenService('system-processes')}>
                      <Cpu aria-hidden="true" />
                      {t(locale, 'Inspect process register', 'فحص سجل العمليات')}
                    </button>
                  ) : null}
                  {linkedService ? (
                    <button type="button" className="sys-btn sys-btn-quiet" onClick={() => onOpenService('system-services-map')}>
                      <Share2 aria-hidden="true" />
                      {t(locale, 'Inspect service graph', 'فحص رسم الخدمات')}
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <EmptyBlock compact icon={GitBranch} title={t(locale, 'No link selected', 'لا رابط محدد')} message={t(locale, 'Select a measured autorun row.', 'اختر صف بدء مقيسًا.')} />
            )}
          </Panel>
          <Panel title={t(locale, 'Boundary', 'الحدود')} icon={ShieldCheck}>
            <InfoNote tone="muted">
              {t(locale, 'This view links measured startup commands to processes and services. Scheduled tasks and registry writes belong to the accepted Startup mission and are not duplicated here.', 'يربط هذا العرض أوامر البدء المقيسة بالعمليات والخدمات. المهام المجدولة والكتابة في السجل تنتمي لمهمة بدء التشغيل المقبولة ولا تتكرر هنا.')}
            </InfoNote>
            <DataRows
              rows={[
                { label: t(locale, 'Scheduled tasks', 'المهام المجدولة'), value: t(locale, 'Not part of this inventory', 'ليست جزءًا من هذا الجرد') },
                { label: t(locale, 'Startup writes', 'كتابة مداخل البدء'), value: t(locale, 'Gated elsewhere', 'محمية في موضع آخر'), tone: 'warn' },
              ]}
            />
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 11 - Service Dependency Graph                                             */
/* ------------------------------------------------------------------------- */

export function ServiceGraphWorkbench({ locale, snapshot, controller, onOpenService }: WorkbenchProps) {
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [protectedOnly, setProtectedOnly] = useState(false);
  const [relation, setRelation] = useState<'depends-on' | 'required-by'>('depends-on');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const services = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return snapshot.services.filter((service) => {
      if (protectedOnly && !service.protected) return false;
      if (stateFilter === 'running' && String(service.state).toLowerCase() !== 'running') return false;
      if (stateFilter === 'stopped' && String(service.state).toLowerCase() !== 'stopped') return false;
      if (needle && !`${service.name} ${service.displayName} ${service.executablePath ?? ''}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [protectedOnly, query, snapshot.services, stateFilter]);

  const selected = snapshot.services.find((service) => service.id === selectedId) || services[0] || null;
  const neighbours = useMemo(() => {
    if (!selected) return [];
    const edges = snapshot.serviceEdges.filter((edge) => edge.from === selected.id && edge.relation === relation);
    const ids = new Set(edges.map((edge) => edge.to));
    return snapshot.services.filter((service) => ids.has(service.id));
  }, [relation, selected, snapshot.serviceEdges, snapshot.services]);
  const protectedCount = snapshot.services.filter((service) => service.protected).length;
  const runningCount = snapshot.services.filter((service) => String(service.state).toLowerCase() === 'running').length;

  return (
    <WorkbenchFrame
      id="system-services-map"
      locale={locale}
      provider="Win32_Service + Win32_DependentService"
      foot={
        <>
          <span><Share2 aria-hidden="true" />{formatCount(snapshot.services.length)} {t(locale, 'services', 'خدمة')} · {formatCount(snapshot.serviceEdges.length)} {t(locale, 'directed edges', 'حافة موجهة')}</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'Start, stop, pause and configuration changes are not exposed.', 'البدء والإيقاف والتعليق وتغيير الإعدادات غير متاحة.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search service name, display name or binary…', 'ابحث باسم الخدمة أو اسم العرض أو الملف…')} />
        <Seg
          value={stateFilter}
          onChange={setStateFilter}
          ariaLabel={t(locale, 'Filter service state', 'تصفية حالة الخدمة')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All', 'الكل') },
            { value: 'running', label: t(locale, 'Running', 'قيد التشغيل') },
            { value: 'stopped', label: t(locale, 'Stopped', 'متوقفة') },
          ]}
        />
        <Toggle checked={protectedOnly} onChange={setProtectedOnly} label={t(locale, 'Protected only', 'المحمية فقط')} />
        <span className="sys-toolbar-spacer" />
        <Chip tone="info" icon={Info}>{formatCount(runningCount)} {t(locale, 'running', 'قيد التشغيل')}</Chip>
        <Chip tone="warn" icon={ShieldCheck}>{formatCount(protectedCount)} {t(locale, 'protected', 'محمية')}</Chip>
      </div>

      <div className="sys-graph-layout">
        <Panel
          className="sys-ledger-panel"
          title={t(locale, 'Service nodes', 'عقد الخدمات')}
          sub={`${formatCount(services.length)} ${t(locale, 'matching', 'مطابق')}`}
          icon={Share2}
          bodyClassName="sys-panel-body-flush"
        >
          {services.length ? (
            <div className="sys-node-list" role="listbox" aria-label={t(locale, 'Measured services', 'الخدمات المقيسة')}>
              {services.slice(0, 200).map((service) => (
                <button
                  type="button"
                  key={service.id}
                  role="option"
                  aria-selected={selected?.id === service.id}
                  className={cx('sys-node-row', selected?.id === service.id && 'is-active')}
                  onClick={() => setSelectedId(service.id)}
                >
                  <span className={cx('sys-node-dot', String(service.state).toLowerCase() === 'running' ? 'is-live' : 'is-idle')} aria-hidden="true" />
                  <span className="sys-node-copy">
                    <strong>{service.displayName || service.name}</strong>
                    <em className="sys-mono">{service.name} · {service.startMode || t(locale, 'start mode unknown', 'وضع البدء مجهول')}</em>
                  </span>
                  {service.protected ? <Chip tone="warn">{t(locale, 'Protected', 'محمية')}</Chip> : null}
                  <Chip tone={String(service.state).toLowerCase() === 'running' ? 'good' : 'muted'}>{service.state || t(locale, 'Unknown', 'مجهول')}</Chip>
                </button>
              ))}
            </div>
          ) : (
            <EmptyBlock icon={Search} title={t(locale, 'No service matches', 'لا خدمة مطابقة')} message={t(locale, 'Clear the search, state or protection filter.', 'امسح البحث أو مرشح الحالة أو الحماية.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel
            title={t(locale, 'Dependency edges', 'حواف الاعتماد')}
            sub={selected ? (selected.displayName || selected.name) : t(locale, 'Select a service', 'اختر خدمة')}
            icon={GitBranch}
            actions={
              <Seg
                value={relation}
                onChange={setRelation}
                ariaLabel={t(locale, 'Choose edge direction', 'اختر اتجاه الحافة')}
                compact
                options={[
                  { value: 'depends-on', label: t(locale, 'Depends on', 'يعتمد على') },
                  { value: 'required-by', label: t(locale, 'Required by', 'مطلوب من') },
                ]}
              />
            }
          >
            {selected ? (
              <>
                <div className="sys-graph-focus">
                  <span className={cx('sys-graph-focus-dot', String(selected.state).toLowerCase() === 'running' ? 'is-live' : 'is-idle')} />
                  <div>
                    <strong>{selected.displayName || selected.name}</strong>
                    <em className="sys-mono">{selected.name}</em>
                  </div>
                  <Chip tone={selected.protected ? 'warn' : 'info'}>{selected.protected ? t(locale, 'Protected', 'محمية') : t(locale, 'Standard', 'قياسية')}</Chip>
                </div>
                {neighbours.length ? (
                  <div className="sys-graph-edges">
                    {neighbours.map((node) => (
                      <button type="button" key={node.id} className="sys-graph-edge" onClick={() => setSelectedId(node.id)}>
                        <span className="sys-graph-edge-line" aria-hidden="true" />
                        <span className="sys-graph-edge-copy">
                          <strong>{node.displayName || node.name}</strong>
                          <em className="sys-mono">{node.name} · {node.state || '—'}</em>
                        </span>
                        <Chip tone={String(node.state).toLowerCase() === 'running' ? 'good' : 'muted'}>{node.state || '—'}</Chip>
                        <ChevronRight aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyBlock compact icon={GitBranch} title={t(locale, 'No measured edge in this direction', 'لا حافة مقيسة في هذا الاتجاه')} message={t(locale, 'Win32_DependentService returned no matching dependency for this node.', 'لم يُعد Win32_DependentService أي اعتمادية مطابقة لهذه العقدة.')} />
                )}
                <div className="sys-toolbar-row">
                  <CopyButton locale={locale} text={selected.executablePath} label={t(locale, 'Copy binary path', 'نسخ مسار الملف')} />
                  <button type="button" className="sys-btn sys-btn-quiet" onClick={() => onOpenService('system-processes')}>
                    <Cpu aria-hidden="true" />
                    {t(locale, 'Find owning process', 'العثور على العملية المالكة')}
                  </button>
                </div>
              </>
            ) : (
              <EmptyBlock compact icon={Share2} title={t(locale, 'No service selected', 'لا خدمة محددة')} message={t(locale, 'Select a measured service node.', 'اختر عقدة خدمة مقيسة.')} />
            )}
          </Panel>
          <Panel title={t(locale, 'Service facts', 'حقائق الخدمة')} icon={Database}>
            {selected ? (
              <KeyValueGrid>
                <Field label={t(locale, 'State', 'الحالة')} value={selected.state || '—'} tone={String(selected.state).toLowerCase() === 'running' ? 'good' : 'muted'} />
                <Field label={t(locale, 'Start mode', 'وضع البدء')} value={selected.startMode || '—'} />
                <Field label={t(locale, 'Delayed autostart', 'بدء تلقائي مؤجل')} value={selected.delayedAutoStart == null ? t(locale, 'Unknown', 'مجهول') : selected.delayedAutoStart ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا')} />
                <Field label={t(locale, 'Process ID', 'معرف العملية')} value={selected.processId ?? '—'} mono />
                <Field label={t(locale, 'Binary path', 'مسار الملف')} value={selected.executablePath || t(locale, 'Not returned', 'لم يُعد')} mono className="sys-span-2" />
                <Field label={t(locale, 'Description', 'الوصف')} value={selected.description || t(locale, 'No description returned', 'لم يُعد وصف')} className="sys-span-2" />
              </KeyValueGrid>
            ) : (
              <EmptyBlock compact icon={Database} title={t(locale, 'No facts to show', 'لا حقائق للعرض')} message={t(locale, 'Select a measured service.', 'اختر خدمة مقيسة.')} />
            )}
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 12 - Unified Event Timeline                                               */
/* ------------------------------------------------------------------------- */

const KNOUX_LANE_NOTE =
  'The KNOuX lane is intentionally empty: this delivery performed no mutation, so no change event can be claimed.';

export function TimelineWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const [lane, setLane] = useState<'all' | SystemTimelineEvent['lane']>('all');
  const [severity, setSeverity] = useState<'all' | SystemTimelineEvent['severity']>('all');
  const [query, setQuery] = useState('');
  const [windowLimit, setWindowLimit] = useState<'25' | '50' | '100' | 'all'>('50');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const events = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = snapshot.timeline.filter((event) => {
      if (lane !== 'all' && event.lane !== lane) return false;
      if (severity !== 'all' && event.severity !== severity) return false;
      if (needle && !`${event.title} ${event.detail} ${event.kind} ${event.source}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    return windowLimit === 'all' ? rows : rows.slice(0, Number(windowLimit));
  }, [lane, query, severity, snapshot.timeline, windowLimit]);

  const selected = events.find((event) => event.id === selectedId) || events[0] || null;
  const laneCounts = useMemo(() => {
    const counts = { knoux: 0, windows: 0, observation: 0 };
    for (const event of snapshot.timeline) counts[event.lane] += 1;
    return counts;
  }, [snapshot.timeline]);
  const severityCounts = useMemo(() => {
    const counts = { info: 0, warning: 0, error: 0, critical: 0 };
    for (const event of snapshot.timeline) counts[event.severity] += 1;
    return counts;
  }, [snapshot.timeline]);

  return (
    <WorkbenchFrame
      id="system-timeline"
      locale={locale}
      state="partial"
      provider="Measured Windows events + observation markers"
      foot={
        <>
          <span><Clock aria-hidden="true" />{formatCount(snapshot.timeline.length)} {t(locale, 'timeline markers', 'علامة زمنية')}</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'No KNOuX mutation is fabricated into the timeline.', 'لا يُختلق أي تغيير KNOuX في الخط الزمني.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search timeline title, detail or source…', 'ابحث في عنوان الخط الزمني أو التفاصيل أو المصدر…')} />
        <Seg
          value={lane}
          onChange={setLane}
          ariaLabel={t(locale, 'Filter lane', 'تصفية المسار')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All lanes', 'كل المسارات') },
            { value: 'windows', label: 'Windows' },
            { value: 'observation', label: t(locale, 'Observation', 'المراقبة') },
            { value: 'knoux', label: 'KNOuX' },
          ]}
        />
        <SelectBox
          value={severity}
          onChange={(value) => setSeverity(value as typeof severity)}
          ariaLabel={t(locale, 'Filter severity', 'تصفية الشدة')}
          options={[
            { value: 'all', label: t(locale, 'All severities', 'كل الشدائد') },
            { value: 'info', label: t(locale, 'Info', 'معلومات') },
            { value: 'warning', label: t(locale, 'Warning', 'تحذير') },
            { value: 'error', label: t(locale, 'Error', 'خطأ') },
            { value: 'critical', label: t(locale, 'Critical', 'حرج') },
          ]}
        />
        <SelectBox
          value={windowLimit}
          onChange={(value) => setWindowLimit(value as typeof windowLimit)}
          ariaLabel={t(locale, 'Timeline window', 'نافذة الخط الزمني')}
          options={[
            { value: '25', label: t(locale, 'Latest 25', 'أحدث 25') },
            { value: '50', label: t(locale, 'Latest 50', 'أحدث 50') },
            { value: '100', label: t(locale, 'Latest 100', 'أحدث 100') },
            { value: 'all', label: t(locale, 'All measured', 'كل المقيس') },
          ]}
        />
      </div>

      <div className="sys-lane-strip">
        {(['windows', 'observation', 'knoux'] as SystemTimelineEvent['lane'][]).map((key) => {
          const meta = LANE_META[key];
          const Icon = meta.icon;
          return (
            <button
              type="button"
              key={key}
              className={cx('sys-lane-card', lane === key && 'is-active', `is-${meta.tone}`)}
              onClick={() => setLane(lane === key ? 'all' : key)}
              aria-pressed={lane === key}
            >
              <span className="sys-lane-card-icon"><Icon aria-hidden="true" /></span>
              <span>
                <strong>{locale === AR ? meta.ar : meta.en}</strong>
                <em>{formatCount(laneCounts[key])} {t(locale, 'markers', 'علامة')}</em>
              </span>
            </button>
          );
        })}
        <div className="sys-lane-sev">
          {(['info', 'warning', 'error', 'critical'] as SystemTimelineEvent['severity'][]).map((key) => (
            <Chip key={key} tone={SEVERITY_META[key].tone}>{formatCount(severityCounts[key])} {locale === AR ? SEVERITY_META[key].ar : SEVERITY_META[key].en}</Chip>
          ))}
        </div>
      </div>

      <div className="sys-split-timeline">
        <Panel
          title={t(locale, 'Measured timeline', 'الخط الزمني المقيس')}
          sub={`${formatCount(events.length)} ${t(locale, 'visible markers', 'علامة ظاهرة')}`}
          icon={TimerReset}
          bodyClassName="sys-panel-body-flush"
        >
          {events.length ? (
            <div className="sys-timeline-list" role="listbox" aria-label={t(locale, 'Measured timeline events', 'أحداث الخط الزمني المقيسة')}>
              {events.map((event) => {
                const meta = LANE_META[event.lane];
                const sev = SEVERITY_META[event.severity];
                return (
                  <button
                    type="button"
                    key={event.id}
                    role="option"
                    aria-selected={selected?.id === event.id}
                    className={cx('sys-timeline-row', selected?.id === event.id && 'is-active', `is-${meta.tone}`)}
                    onClick={() => setSelectedId(event.id)}
                  >
                    <span className="sys-timeline-axis">
                      <span className={cx('sys-timeline-dot', `is-${meta.tone}`)} />
                    </span>
                    <span className="sys-timeline-time">
                      <strong>{formatTimestamp(event.at, locale)}</strong>
                      <em>{locale === AR ? meta.ar : meta.en}</em>
                    </span>
                    <span className="sys-timeline-copy" dir="auto">
                      <strong title={event.title}>{event.title}</strong>
                      <em title={`${event.kind} · ${event.source}`}>{event.kind} · {event.source}</em>
                    </span>
                    <Chip tone={sev.tone}>{locale === AR ? sev.ar : sev.en}</Chip>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyBlock icon={TimerReset} title={t(locale, 'No timeline marker matches', 'لا علامة زمنية مطابقة')} message={t(locale, 'Clear the lane, severity or search filters.', 'امسح مرشحات المسار أو الشدة أو البحث.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Marker dossier', 'ملف العلامة')} sub={selected ? formatTimestamp(selected.at, locale) : undefined} icon={Clock}>
            {selected ? (
              <>
                <KeyValueGrid>
                  <Field label={t(locale, 'Lane', 'المسار')} value={LANE_META[selected.lane][locale === AR ? 'ar' : 'en']} tone={LANE_META[selected.lane].tone} />
                  <Field label={t(locale, 'Severity', 'الشدة')} value={SEVERITY_META[selected.severity][locale === AR ? 'ar' : 'en']} tone={SEVERITY_META[selected.severity].tone} />
                  <Field label={t(locale, 'Kind', 'النوع')} value={selected.kind} />
                  <Field label={t(locale, 'Record ID', 'معرف السجل')} value={selected.recordId || '—'} mono />
                  <Field label={t(locale, 'Source', 'المصدر')} value={selected.source} className="sys-span-2" />
                </KeyValueGrid>
                <CodeBlock label={t(locale, 'Measured detail', 'التفاصيل المقيسة')}>{selected.detail || t(locale, 'No detail returned.', 'لم تُعد تفاصيل.')}</CodeBlock>
                <div className="sys-toolbar-row">
                  <CopyButton locale={locale} text={selected.detail} label={t(locale, 'Copy detail', 'نسخ التفاصيل')} />
                  <ExportButton
                    fileName={`knoux-timeline-${selected.id}.json`}
                    payload={selected}
                    label={t(locale, 'Export marker', 'تصدير العلامة')}
                    onDone={(ok) => controller.showNotice(ok ? t(locale, 'Timeline marker exported.', 'صُدّدت علامة الخط الزمني.') : t(locale, 'The marker export could not start.', 'تعذّر بدء تصدير العلامة.'))}
                  />
                </div>
              </>
            ) : (
              <EmptyBlock compact icon={Clock} title={t(locale, 'No marker selected', 'لا علامة محددة')} message={t(locale, 'Select a measured timeline row.', 'اختر صفًا زمنيًا مقيسًا.')} />
            )}
          </Panel>
          <Panel title={t(locale, 'KNOuX lane', 'مسار KNOuX')} icon={BadgeCheck}>
            <DataRows
              rows={[
                { label: t(locale, 'KNOuX change markers', 'علامات تغيير KNOuX'), value: formatCount(laneCounts.knoux), tone: laneCounts.knoux ? 'info' : 'good' },
                { label: t(locale, 'Windows events', 'أحداث Windows'), value: formatCount(laneCounts.windows) },
                { label: t(locale, 'Observation markers', 'علامات المراقبة'), value: formatCount(laneCounts.observation) },
              ]}
            />
            <InfoNote tone={laneCounts.knoux ? 'warn' : 'muted'}>{laneCounts.knoux ? t(locale, 'Unexpected mutation markers were returned; review them before trusting this snapshot.', 'أُعيدت علامات تغيير غير متوقعة؛ راجعها قبل الوثوق بهذه اللقطة.') : t(locale, KNOUX_LANE_NOTE, 'مسار KNOuX فارغ عمدًا: لم يُنفّذ هذا التسليم أي تغيير، لذلك لا يمكن ادعاء حدث تغيير.')}</InfoNote>
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}
