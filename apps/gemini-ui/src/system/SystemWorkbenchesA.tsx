/**
 * KNOuX Live Pulse - system world workbenches, part A (services 01-06).
 * Every value is read from the measured snapshot or a bounded native query.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  FileCode2,
  Gauge as GaugeIcon,
  HardDrive,
  Info,
  ListFilter,
  MemoryStick,
  Network,
  Pause,
  Play,
  RefreshCw,
  ScrollText,
  Search,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Zap,
} from 'lucide-react';
import type { SystemEventRecord, SystemMetrics, SystemProcess } from '../../shared/native-contracts';
import {
  EVENT_LEVEL_META,
  averageOf,
  bytesToMegabytes,
  eventLevelMeta,
  filterProcesses,
  formatBytes,
  formatClock,
  formatCount,
  formatDate,
  formatDuration,
  formatMHz,
  formatMs,
  formatPercent,
  formatRate,
  formatRelative,
  formatTime,
  formatTimestamp,
  isSafeTargetDraft,
  latestOf,
  maxOf,
  metricValues,
  percentageTone,
  signatureMeta,
  sortProcesses,
  t,
  type MetricKey,
  type ProcessSort,
  type Tone,
} from './model';
import type { SystemLocale } from './catalog';
import type { WorkbenchProps } from './types';
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
  LoadingLine,
  MeterBar,
  MiniStat,
  Panel,
  SearchBox,
  Seg,
  SelectBox,
  Sparkline,
  Toggle,
  WorkbenchFrame,
  cx,
} from './ui';

const AR = 'ar';

function metricColor(key: MetricKey): string {
  switch (key) {
    case 'memoryPercent':
    case 'memoryUsedBytes':
      return '#a78bfa';
    case 'diskReadBytesPerSec':
    case 'diskWriteBytesPerSec':
    case 'diskLatencyMs':
      return '#fbbf24';
    case 'networkInBytesPerSec':
    case 'networkOutBytesPerSec':
      return '#34d399';
    case 'cpuFrequencyMHz':
      return '#22d3ee';
    default:
      return '#22d3ee';
  }
}

/* ------------------------------------------------------------------------- */
/* 01 - Live Pulse Overview                                                  */
/* ------------------------------------------------------------------------- */

export function LivePulseWorkbench({ locale, snapshot, series, controller }: WorkbenchProps) {
  const [selected, setSelected] = useState<'cpu' | 'memory' | 'disk' | 'network'>('cpu');
  const [detailTab, setDetailTab] = useState<'detail' | 'sources'>('detail');
  const [windowMinutes, setWindowMinutes] = useState<1 | 5 | 15>(5);
  const metrics = snapshot.metrics;
  const samples = useMemo(() => {
    const max = Math.max(2, Math.round((windowMinutes * 60000) / Math.max(1000, controller.sampleIntervalMs)));
    return series.slice(-Math.min(120, max));
  }, [controller.sampleIntervalMs, series, windowMinutes]);

  const cards = useMemo(
    () => [
      {
        key: 'cpu' as const,
        title: t(locale, 'CPU load', 'حمل المعالج'),
        value: formatPercent(metrics.cpuPercent, 1),
        sub: formatMHz(metrics.cpuFrequencyMHz),
        numeric: metrics.cpuPercent,
        icon: Cpu,
        color: '#22d3ee',
        series: metricValues(samples, 'cpuPercent'),
      },
      {
        key: 'memory' as const,
        title: t(locale, 'Memory', 'الذاكرة'),
        value: formatPercent(metrics.memoryPercent, 1),
        sub: `${formatBytes(metrics.memoryUsedBytes)} / ${formatBytes(metrics.memoryTotalBytes)}`,
        numeric: metrics.memoryPercent,
        icon: MemoryStick,
        color: '#a78bfa',
        series: metricValues(samples, 'memoryPercent'),
      },
      {
        key: 'disk' as const,
        title: t(locale, 'Disk I/O', 'إدخال/إخراج القرص'),
        value: formatRate((metrics.diskReadBytesPerSec ?? 0) + (metrics.diskWriteBytesPerSec ?? 0)),
        sub: `${t(locale, 'Latency', 'الكمون')}: ${formatMs(metrics.diskLatencyMs)}`,
        numeric: metrics.diskLatencyMs,
        icon: HardDrive,
        color: '#fbbf24',
        series: metricValues(samples, 'diskReadBytesPerSec').map((value, index) => {
          const write = metricValues(samples, 'diskWriteBytesPerSec')[index];
          return value == null && write == null ? null : (value ?? 0) + (write ?? 0);
        }),
      },
      {
        key: 'network' as const,
        title: t(locale, 'Network', 'الشبكة'),
        value: formatRate((metrics.networkInBytesPerSec ?? 0) + (metrics.networkOutBytesPerSec ?? 0)),
        sub: `↓ ${formatRate(metrics.networkInBytesPerSec)} · ↑ ${formatRate(metrics.networkOutBytesPerSec)}`,
        numeric: metrics.networkInBytesPerSec,
        icon: Network,
        color: '#34d399',
        series: metricValues(samples, 'networkInBytesPerSec').map((value, index) => {
          const out = metricValues(samples, 'networkOutBytesPerSec')[index];
          return value == null && out == null ? null : (value ?? 0) + (out ?? 0);
        }),
      },
    ],
    [locale, metrics, samples],
  );

  const active = cards.find((card) => card.key === selected) || cards[0];
  const activeSeries = active.series;
  const current = latestOf(activeSeries) ?? active.numeric;
  const peak = maxOf(activeSeries);
  const average = averageOf(activeSeries);

  return (
    <WorkbenchFrame
      id="system-health-check"
      locale={locale}
      provider={metrics.source}
      foot={
        <>
          <span><Database aria-hidden="true" />{t(locale, 'Source', 'المصدر')}: {metrics.source}</span>
          <span><Clock aria-hidden="true" />{t(locale, 'Sample timestamp', 'طابع العينة')}: {formatTimestamp(metrics.timestamp, locale)}</span>
          <span><ShieldCheck aria-hidden="true" />{t(locale, 'No fixture fallback', 'لا بديل تجريبي')}</span>
        </>
      }
    >
      <div className="sys-live-grid">
        <div className="sys-live-gauges" role="group" aria-label={t(locale, 'Select metric gauge', 'اختر أداة القياس')}>
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.key}
                type="button"
                className={cx('sys-live-gauge', selected === card.key && 'is-active')}
                onClick={() => setSelected(card.key)}
                aria-pressed={selected === card.key}
              >
                <div className="sys-live-gauge-head">
                  <span className="sys-live-gauge-icon" style={{ color: card.color }}><Icon aria-hidden="true" /></span>
                  <span>{card.title}</span>
                  <Chip tone="good">{t(locale, 'Measured', 'مقيس')}</Chip>
                </div>
                <strong>{card.value}</strong>
                <em>{card.sub}</em>
                <Sparkline values={card.series} color={card.color} height={38} label={card.title} />
              </button>
            );
          })}
        </div>

        <Panel
          className="sys-live-detail"
          title={active.title}
          sub={`${t(locale, 'Window', 'النافذة')}: ${windowMinutes} ${t(locale, 'min', 'د')} · ${formatCount(samples.length)} ${t(locale, 'samples', 'عينة')}`}
          icon={GaugeIcon}
          actions={
            <>
              <Seg
                value={detailTab}
                onChange={setDetailTab}
                ariaLabel={t(locale, 'Change detail tab', 'تغيير تبويب التفاصيل')}
                compact
                options={[
                  { value: 'detail', label: t(locale, 'Detail', 'التفاصيل') },
                  { value: 'sources', label: t(locale, 'Provenance', 'المصدر') },
                ]}
              />
              <ExportButton
                fileName="knoux-live-pulse-snapshot.json"
                payload={snapshot}
                label={t(locale, 'Export snapshot', 'تصدير اللقطة')}
                onDone={(ok) => controller.showNotice(ok
                  ? t(locale, 'Measured snapshot exported as JSON.', 'صُدّرت اللقطة المقيسة بصيغة JSON.')
                  : t(locale, 'The snapshot export could not start.', 'تعذّر بدء تصدير اللقطة.'))}
              />
            </>
          }
        >
          {detailTab === 'detail' ? (
            <div className="sys-live-detail-grid">
              <Gauge value={active.numeric} label={active.title} color={active.color} />
              <div className="sys-live-stats">
                <MiniStat label={t(locale, 'Current', 'الحالي')} value={current == null ? '—' : formatPercent(current, 1)} icon={Activity} />
                <MiniStat label={t(locale, 'Peak', 'الذروة')} value={peak == null ? '—' : formatPercent(peak, 1)} icon={ArrowUp} />
                <MiniStat label={t(locale, 'Average', 'المتوسط')} value={average == null ? '—' : formatPercent(average, 1)} icon={GaugeIcon} />
              </div>
              <div className="sys-live-chart">
                <Sparkline values={activeSeries} color={active.color} height={104} label={`${active.title} measured series`} />
                <div className="sys-live-chart-foot">
                  <span>{t(locale, 'Interval', 'الفاصل')}: {formatCount(controller.sampleIntervalMs / 1000)}s</span>
                  <span>{t(locale, 'Latest', 'الأحدث')}: {formatTime(controller.lastSampleAt, locale)}</span>
                  <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.sampleNow()} disabled={controller.sampling}>
                    <RefreshCw aria-hidden="true" />
                    {controller.sampling ? t(locale, 'Sampling…', 'جارٍ القياس…') : t(locale, 'Sample now', 'قياس الآن')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="sys-live-sources">
              <Field label={t(locale, 'Counter provider', 'مزود العدادات')} value={metrics.source} mono />
              <Field label={t(locale, 'Sample timestamp', 'طابع العينة')} value={formatTimestamp(metrics.timestamp, locale)} />
              <Field label={t(locale, 'Logical processors', 'المعالجات المنطقية')} value={formatCount(snapshot.hardware.totals.logicalProcessors)} />
              <Field label={t(locale, 'Series cap', 'حد السلسلة')} value={`${formatCount(120)} ${t(locale, 'samples', 'عينة')}`} />
              <InfoNote tone="info">
                {t(
                  locale,
                  'Readings come from the measured Windows performance counters. A missing counter stays unknown and is never replaced with zero or a fixture.',
                  'تأتي القراءات من عدادات أداء Windows المقيسة. العداد المفقود يبقى مجهولًا ولا يُستبدل بصفر أو ببيانات تجريبية.',
                )}
              </InfoNote>
            </div>
          )}
        </Panel>
      </div>

      <div className="sys-grid-4">
        <Panel title={t(locale, 'CPU load & frequency', 'حمل المعالج والتردد')} icon={Cpu}>
          <Gauge value={metrics.cpuPercent} label={t(locale, 'CPU', 'المعالج')} color="#22d3ee" size={92} />
          <DataRows
            rows={[
              { label: t(locale, 'Frequency', 'التردد'), value: formatMHz(metrics.cpuFrequencyMHz) },
              { label: t(locale, 'Threads', 'الخيوط'), value: formatCount(metrics.threadCount) },
              { label: t(locale, 'Handles', 'المقابض'), value: formatCount(metrics.handleCount) },
            ]}
          />
        </Panel>
        <Panel title={t(locale, 'RAM usage & committed bytes', 'استخدام الذاكرة والبايتات المثبتة')} icon={MemoryStick}>
          <MeterBar value={metrics.memoryUsedBytes} max={metrics.memoryTotalBytes ?? 1} tone={percentageTone(metrics.memoryPercent)} label={t(locale, 'Used', 'المستخدم')} caption={formatPercent(metrics.memoryPercent, 1)} />
          <DataRows
            rows={[
              { label: t(locale, 'Used', 'المستخدم'), value: formatBytes(metrics.memoryUsedBytes) },
              { label: t(locale, 'Total', 'الإجمالي'), value: formatBytes(metrics.memoryTotalBytes) },
              { label: t(locale, 'Committed', 'المثبت'), value: formatBytes(metrics.memoryCommittedBytes) },
            ]}
          />
        </Panel>
        <Panel title={t(locale, 'Disk I/O & response time', 'إدخال/إخراج القرص وزمن الاستجابة')} icon={HardDrive}>
          <div className="sys-dual-rate">
            <span><ArrowDown aria-hidden="true" /> {formatRate(metrics.diskReadBytesPerSec)}</span>
            <span><ArrowUp aria-hidden="true" /> {formatRate(metrics.diskWriteBytesPerSec)}</span>
          </div>
          <DataRows
            rows={[
              { label: t(locale, 'Response time', 'زمن الاستجابة'), value: formatMs(metrics.diskLatencyMs) },
              { label: t(locale, 'Processes', 'العمليات'), value: formatCount(metrics.processCount) },
            ]}
          />
        </Panel>
        <Panel title={t(locale, 'Network throughput', 'صبيب الشبكة')} icon={Network}>
          <div className="sys-dual-rate">
            <span><ArrowDown aria-hidden="true" /> {formatRate(metrics.networkInBytesPerSec)}</span>
            <span><ArrowUp aria-hidden="true" /> {formatRate(metrics.networkOutBytesPerSec)}</span>
          </div>
          <DataRows
            rows={[
              { label: t(locale, 'Interfaces', 'الواجهات'), value: formatCount(snapshot.interfaces.length) },
              { label: t(locale, 'Sockets', 'المقابس'), value: formatCount(snapshot.sockets.length) },
            ]}
          />
        </Panel>
      </div>

      <div className="sys-toolbar-row">
        <span className="sys-toolbar-label"><TimerReset aria-hidden="true" />{t(locale, 'Historical interval', 'الفاصل الزمني التاريخي')}</span>
        <Seg
          value={windowMinutes}
          onChange={(value) => setWindowMinutes(value)}
          ariaLabel={t(locale, 'Toggle historical interval', 'تبديل الفاصل الزمني')}
          options={[
            { value: 1, label: '1m' },
            { value: 5, label: '5m' },
            { value: 15, label: '15m' },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <Chip tone="info" icon={Info}>{t(locale, 'Bounded to the measured series', 'محدود بالسلسلة المقيسة')}</Chip>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 02 - Event Severity Ledger                                                */
/* ------------------------------------------------------------------------- */

export function EventLedgerWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const [severity, setSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [channel, setChannel] = useState('all');
  const [hours, setHours] = useState<'24' | '168' | '720' | 'all'>('168');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const firstRun = useRef(false);

  const channels = useMemo(() => {
    const set = new Set<string>();
    for (const event of snapshot.events) if (event.channel) set.add(event.channel);
    return [...set].sort();
  }, [snapshot.events]);

  useEffect(() => {
    if (!firstRun.current) {
      firstRun.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      const levels = severity === 'all' ? [] : severity === 'error' ? [1, 2] : severity === 'warning' ? [3] : [4];
      void controller.queryEvents({
        ...(channel !== 'all' ? { channel } : {}),
        ...(levels.length ? { levels } : {}),
        ...(hours !== 'all' ? { sinceHours: Number(hours) } : {}),
        ...(query.trim() ? { search: query.trim() } : {}),
        limit: 100,
      });
    }, 380);
    return () => window.clearTimeout(timer);
  }, [channel, controller.queryEvents, hours, query, severity]);

  const events = controller.eventsResult?.events || snapshot.events;
  const selected = events.find((event) => event.id === selectedId) || events[0] || null;
  const correlation = useMemo(() => {
    if (!selected) return [];
    return snapshot.events
      .filter((event) => event.id !== selected.id && event.provider === selected.provider)
      .slice(0, 4);
  }, [selected, snapshot.events]);
  const counts = useMemo(() => {
    const result = { critical: 0, error: 0, warning: 0, info: 0, total: events.length };
    for (const event of events) {
      if (event.level === 1) result.critical += 1;
      else if (event.level === 2) result.error += 1;
      else if (event.level === 3) result.warning += 1;
      else result.info += 1;
    }
    return result;
  }, [events]);

  return (
    <WorkbenchFrame
      id="system-events"
      locale={locale}
      provider="Get-WinEvent System/Application"
      foot={
        <>
          <span><Database aria-hidden="true" />{t(locale, 'Query', 'الاستعلام')}: {controller.eventsResult ? t(locale, 'validated native query', 'استعلام أصلي متحقق') : t(locale, 'measured snapshot', 'لقطة مقيسة')}</span>
          <span><AlertTriangle aria-hidden="true" />{formatCount(counts.total)} {t(locale, 'matching events', 'حدث مطابق')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search provider, message or event ID…', 'ابحث في المزود أو الرسالة أو معرف الحدث…')} />
        <SelectBox
          value={channel}
          onChange={setChannel}
          ariaLabel={t(locale, 'Filter source & provider', 'تصفية المصدر والمزود')}
          options={[{ value: 'all', label: t(locale, 'All channels', 'كل القنوات') }, ...channels.map((entry) => ({ value: entry, label: entry }))]}
        />
        <Seg
          value={severity}
          onChange={setSeverity}
          ariaLabel={t(locale, 'Filter severity', 'تصفية الشدة')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All', 'الكل') },
            { value: 'error', label: t(locale, 'Error', 'خطأ') },
            { value: 'warning', label: t(locale, 'Warn', 'تحذير') },
            { value: 'info', label: t(locale, 'Info', 'معلومات') },
          ]}
        />
        <Seg<'24' | '168' | '720' | 'all'>
          value={hours}
          onChange={setHours}
          ariaLabel={t(locale, 'Time range picker', 'اختيار النطاق الزمني')}
          compact
          options={[
            { value: '24', label: t(locale, '24h', '24 ساعة') },
            { value: '168', label: t(locale, '7d', '7 أيام') },
            { value: '720', label: t(locale, '30d', '30 يومًا') },
            { value: 'all', label: t(locale, 'All', 'الكل') },
          ]}
        />
        {controller.busy === 'events' ? <LoadingLine label={t(locale, 'Querying…', 'جارٍ الاستعلام…')} /> : null}
      </div>

      <div className="sys-event-summary">
        <MiniStat label={t(locale, 'Critical', 'حرج')} value={formatCount(counts.critical)} tone="bad" />
        <MiniStat label={t(locale, 'Error', 'خطأ')} value={formatCount(counts.error)} tone="bad" />
        <MiniStat label={t(locale, 'Warning', 'تحذير')} value={formatCount(counts.warning)} tone="warn" />
        <MiniStat label={t(locale, 'Info', 'معلومات')} value={formatCount(counts.info)} tone="info" />
      </div>

      <div className="sys-split-2">
        <Panel title={t(locale, 'Severity timeline', 'خط الشدة الزمني')} sub={`${formatCount(events.length)} ${t(locale, 'measured rows', 'صف مقيس')}`} icon={ShieldAlert} bodyClassName="sys-panel-body-flush">
          {events.length ? (
            <div className="sys-event-list" role="listbox" aria-label={t(locale, 'Measured events', 'الأحداث المقيسة')}>
              {events.slice(0, 100).map((event) => {
                const meta = eventLevelMeta(event.level);
                return (
                  <button
                    type="button"
                    key={event.id}
                    role="option"
                    aria-selected={selected?.id === event.id}
                    className={cx('sys-event-row', selected?.id === event.id && 'is-active', `is-${meta.tone}`)}
                    onClick={() => setSelectedId(event.id)}
                  >
                    <span className={cx('sys-event-level', `is-${meta.tone}`)} title={locale === AR ? meta.ar : meta.en}>{meta.short}</span>
                    <span className="sys-event-time">{formatTimestamp(event.timeCreated, locale)}</span>
                    <span className="sys-event-body">
                      <strong>{event.provider} · {event.eventId ?? '—'}</strong>
                      <em>{event.message || t(locale, 'No message text returned.', 'لم يُعد نص الرسالة.')}</em>
                    </span>
                    <span className="sys-event-channel">{event.channel}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyBlock icon={CheckCircle2} title={t(locale, 'No matching measured events', 'لا أحداث مقيسة مطابقة')} message={t(locale, 'The bounded Get-WinEvent query returned no warning or error rows for this filter.', 'أعاد استعلام Get-WinEvent المحدود صفرًا من التحذيرات أو الأخطاء لهذا المرشح.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Event dossier', 'ملف الحدث')} sub={selected ? `${selected.channel} · ${selected.recordId ?? '—'}` : t(locale, 'Select a measured row', 'اختر صفًا مقيسًا')} icon={FileCode2}>
            {selected ? (
              <>
                <KeyValueGrid>
                  <Field label={t(locale, 'Event ID', 'معرف الحدث')} value={selected.eventId ?? '—'} />
                  <Field label={t(locale, 'Provider', 'المزود')} value={selected.provider} />
                  <Field label={t(locale, 'Channel', 'القناة')} value={selected.channel} />
                  <Field label={t(locale, 'Record ID', 'معرف السجل')} value={selected.recordId ?? '—'} mono />
                  <Field label={t(locale, 'Timestamp', 'الطابع الزمني')} value={formatTimestamp(selected.timeCreated, locale)} />
                  <Field label={t(locale, 'User SID', 'معرف المستخدم')} value={selected.userSid || t(locale, 'Not returned', 'لم يُعد')} mono />
                </KeyValueGrid>
                <CodeBlock label={t(locale, 'Message XML', 'رسالة XML')}>
                  {`<Event>\n  <System>\n    <Provider>${selected.provider}</Provider>\n    <EventID>${selected.eventId ?? 'unknown'}</EventID>\n    <Channel>${selected.channel}</Channel>\n    <TimeCreated>${selected.timeCreated ?? 'unknown'}</TimeCreated>\n  </System>\n  <Message>${(selected.message || '').slice(0, 900)}</Message>\n</Event>`}
                </CodeBlock>
                <InfoNote tone="muted">
                  {t(locale, 'The field structure above is rendered from measured values. Raw WinEvent XML is not exposed by this provider.', 'بُنية الحقول أعلاه مرسومة من قيم مقيسة. XML الخام من WinEvent غير متاح عبر هذا المزود.')}
                </InfoNote>
              </>
            ) : (
              <EmptyBlock compact icon={ShieldAlert} title={t(locale, 'No event selected', 'لا حدث محدد')} message={t(locale, 'Measured event rows are required before a dossier can be shown.', 'يلزم وجود صفوف أحداث مقيسة لعرض الملف.')} />
            )}
          </Panel>
          <Panel title={t(locale, 'Correlation preview', 'معاينة الارتباط')} icon={Activity}>
            {correlation.length ? (
              <DataRows
                rows={correlation.map((event) => ({
                  label: `${formatTime(event.timeCreated, locale)} · ${event.eventId ?? '—'}`,
                  value: event.message.slice(0, 72) || '—',
                  tone: eventLevelMeta(event.level).tone,
                }))}
              />
            ) : (
              <EmptyBlock compact icon={Search} title={t(locale, 'No same-provider neighbours', 'لا جيران من المزود نفسه')} message={t(locale, 'Correlation uses only measured events already present in this snapshot.', 'يستخدم الارتباط فقط الأحداث المقيسة الموجودة في هذه اللقطة.')} />
            )}
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 03 - Active Process Register                                              */
/* ------------------------------------------------------------------------- */

export function ProcessRegisterWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ProcessSort>('cpu');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [verifySignatures, setVerifySignatures] = useState(false);
  const pageSize = 45;

  const filtered = useMemo(() => sortProcesses(filterProcesses(snapshot.processes, query), sort, direction), [direction, query, snapshot.processes, sort]);
  const selected = filtered.find((process) => process.pid === selectedPid) || filtered[0] || null;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const parent = selected?.parentPid != null ? snapshot.processes.find((process) => process.pid === selected.parentPid) || null : null;
  const children = selected ? snapshot.processes.filter((process) => process.parentPid === selected.pid).slice(0, 6) : [];
  const verified = selected
    ? controller.signatureResult?.signatures.find((entry) => entry.path.toLowerCase() === (selected.executablePath || '').toLowerCase())
    : null;
  const signature = verified ? signatureMeta(verified.signatureStatus) : signatureMeta(selected?.signatureStatus);
  const verifying = controller.busy === 'signatures';
  const lastRequested = useRef<string | null>(null);

  useEffect(() => {
    setPage(0);
  }, [query, sort, direction]);

  useEffect(() => {
    if (!verifySignatures || !selected?.executablePath) return;
    if (lastRequested.current === selected.executablePath) return;
    lastRequested.current = selected.executablePath;
    void controller.verifySignatures([selected.executablePath]);
  }, [controller, selected?.executablePath, verifySignatures]);

  return (
    <WorkbenchFrame
      id="system-processes"
      locale={locale}
      provider="Win32_Process + PerfProc"
      foot={
        <>
          <span><Database aria-hidden="true" />{formatCount(snapshot.processes.length)} {t(locale, 'measured rows', 'صف مقيس')} / {formatCount(snapshot.processCount)} {t(locale, 'reported', 'مبلّغ')}</span>
          <span><ShieldCheck aria-hidden="true" />{t(locale, 'Termination channel', 'قناة الإنهاء')}: {t(locale, 'none', 'لا توجد')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search process name, PID, owner or path…', 'ابحث باسم العملية أو PID أو المالك أو المسار…')} />
        <Seg
          value={sort}
          onChange={setSort}
          ariaLabel={t(locale, 'Sort CPU, RAM, PID or threads', 'الترتيب حسب المعالج أو الذاكرة أو PID أو الخيوط')}
          compact
          options={[
            { value: 'cpu', label: t(locale, 'CPU', 'المعالج') },
            { value: 'memory', label: t(locale, 'RAM', 'الذاكرة') },
            { value: 'pid', label: 'PID' },
            { value: 'name', label: t(locale, 'Name', 'الاسم') },
            { value: 'threads', label: t(locale, 'Threads', 'الخيوط') },
          ]}
        />
        <button type="button" className="sys-icon-btn" onClick={() => setDirection((current) => (current === 'asc' ? 'desc' : 'asc'))} aria-label={t(locale, 'Toggle sort direction', 'تبديل اتجاه الترتيب')} title={direction === 'asc' ? 'Ascending' : 'Descending'}>
          {direction === 'asc' ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}
        </button>
        <Toggle checked={verifySignatures} onChange={setVerifySignatures} label={t(locale, 'Verify signature', 'تحقق من التوقيع')} />
        {verifying ? <LoadingLine label={t(locale, 'Verifying…', 'جارٍ التحقق…')} /> : null}
      </div>

      <div className="sys-split-ledger">
        <Panel className="sys-ledger-panel" title={t(locale, 'Process ledger', 'سجل العمليات')} sub={`${formatCount(filtered.length)} ${t(locale, 'matching', 'مطابق')} · ${t(locale, 'page', 'صفحة')} ${safePage + 1}/${pageCount}`} icon={Cpu} bodyClassName="sys-panel-body-flush">
          {rows.length ? (
            <div className="sys-table-wrap">
              <table className="sys-table">
                <thead>
                  <tr>
                    <th>PID</th>
                    <th>{t(locale, 'Process', 'العملية')}</th>
                    <th>CPU</th>
                    <th>RAM</th>
                    <th>{t(locale, 'Threads', 'الخيوط')}</th>
                    <th>{t(locale, 'Signature', 'التوقيع')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((process) => {
                    const meta = signatureMeta(process.signatureStatus);
                    return (
                      <tr key={process.id} className={cx(selected?.pid === process.pid && 'is-selected')} onClick={() => setSelectedPid(process.pid)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedPid(process.pid); } }} aria-selected={selected?.pid === process.pid}>
                        <td className="sys-mono">{process.pid}</td>
                        <td>
                          <strong className="sys-row-name">{process.name}</strong>
                          <span className="sys-row-sub">{process.owner || t(locale, 'Owner unavailable', 'المالك غير متاح')}</span>
                        </td>
                        <td className="sys-mono">{formatPercent(process.cpuPercent, 1)}</td>
                        <td className="sys-mono">{formatBytes(process.workingSetBytes)}</td>
                        <td className="sys-mono">{formatCount(process.threads)}</td>
                        <td><Chip tone={meta.tone}>{process.signatureAvailable ? (locale === AR ? meta.ar : meta.en) : t(locale, 'Not checked', 'لم يُفحص')}</Chip></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyBlock icon={Search} title={t(locale, 'No process matches', 'لا عملية مطابقة')} message={t(locale, 'Clear the search to return to the measured register.', 'امسح البحث للعودة إلى السجل المقيس.')} />
          )}
          <div className="sys-pager">
            <button type="button" className="sys-btn sys-btn-quiet" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={safePage === 0}><ChevronLeft aria-hidden="true" />{t(locale, 'Previous', 'السابق')}</button>
            <span>{formatCount(safePage * pageSize + 1)}–{formatCount(Math.min(filtered.length, (safePage + 1) * pageSize))} / {formatCount(filtered.length)}</span>
            <button type="button" className="sys-btn sys-btn-quiet" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={safePage >= pageCount - 1}>{t(locale, 'Next', 'التالي')}<ChevronRight aria-hidden="true" /></button>
          </div>
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Selected process', 'العملية المحددة')} sub={selected ? `${selected.name} · PID ${selected.pid}` : undefined} icon={FileCode2}>
            {selected ? (
              <>
                <div className="sys-process-identity">
                  <span className="sys-process-glyph" aria-hidden="true"><Cpu /></span>
                  <div>
                    <strong>{selected.name}</strong>
                    <em>{selected.description || t(locale, 'No description returned', 'لم يُعد وصف')}</em>
                  </div>
                  <Chip tone={signature.tone}>{locale === AR ? signature.ar : signature.en}</Chip>
                </div>
                <KeyValueGrid>
                  <Field label={t(locale, 'Executable path', 'مسار الملف التنفيذي')} value={selected.executablePath || t(locale, 'Access denied / unavailable', 'مرفوض / غير متاح')} mono className="sys-span-2" />
                  <Field label="PID" value={selected.pid} mono />
                  <Field label={t(locale, 'Parent PID', 'PID الأب')} value={selected.parentPid ?? '—'} mono />
                  <Field label={t(locale, 'Started', 'بدأت')} value={formatTimestamp(selected.startedAt, locale)} />
                  <Field label={t(locale, 'Owner', 'المالك')} value={selected.owner || '—'} />
                  <Field label={t(locale, 'Working set', 'مجموعة العمل')} value={formatBytes(selected.workingSetBytes)} />
                  <Field label={t(locale, 'Private bytes', 'بايتات خاصة')} value={formatBytes(selected.privateBytes)} />
                  <Field label={t(locale, 'Threads', 'الخيوط')} value={formatCount(selected.threads)} />
                  <Field label={t(locale, 'Handles', 'المقابض')} value={formatCount(selected.handles)} />
                </KeyValueGrid>
                <CopyButton locale={locale} text={selected.executablePath} label={t(locale, 'Copy path', 'نسخ المسار')} />
              </>
            ) : (
              <EmptyBlock compact icon={Cpu} title={t(locale, 'No process selected', 'لا عملية محددة')} message={t(locale, 'Select a measured row to inspect its identity.', 'اختر صفًا مقيسًا لفحص هويته.')} />
            )}
          </Panel>
          <Panel title={t(locale, 'Process tree', 'شجرة العمليات')} icon={ListFilter}>
            {selected ? (
              <>
                <Field label={t(locale, 'Parent', 'الأب')} value={parent ? `${parent.name} (${parent.pid})` : selected.parentPid == null ? t(locale, 'No parent reported', 'لم يُبلَّغ عن أب') : t(locale, 'Parent process not present in bounded list', 'العملية الأب غير موجودة في القائمة المحدودة')} />
                <DataRows
                  rows={children.map((child) => ({ label: `${child.name} · ${child.pid}`, value: formatPercent(child.cpuPercent, 1), mono: true }))}
                  empty={<em className="sys-muted-text">{t(locale, 'No measured child processes for this PID.', 'لا عمليات فرعية مقيسة لهذا المعرف.')}</em>}
                />
              </>
            ) : null}
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 04 - Authenticode Inspector                                               */
/* ------------------------------------------------------------------------- */

export function SignatureInspectorWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const candidates = useMemo(() => {
    const seen = new Map<string, SystemProcess>();
    for (const process of snapshot.processes) {
      if (!process.executablePath) continue;
      const key = process.executablePath.toLowerCase();
      if (!seen.has(key)) seen.set(key, process);
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [snapshot.processes]);
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [view, setView] = useState<'chain' | 'certificate' | 'file'>('chain');
  const [showThumbprint, setShowThumbprint] = useState(false);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return candidates;
    return candidates.filter((process) => `${process.name} ${process.executablePath} ${process.company ?? ''}`.toLowerCase().includes(needle));
  }, [candidates, query]);
  const selected = candidates.find((process) => process.executablePath === selectedPath) || filtered[0] || null;
  const signature = controller.signatureResult?.signatures.find((entry) => entry.path.toLowerCase() === (selected?.executablePath || '').toLowerCase()) || null;
  const status = signatureMeta(signature?.signatureStatus);
  const busy = controller.busy === 'signatures';

  const verify = async () => {
    if (!selected?.executablePath) return;
    const result = await controller.verifySignatures([selected.executablePath]);
    if (result) {
      controller.showNotice(t(locale, `Authenticode returned ${result.verified} verified record(s) of ${result.requested}.`, `أعاد Authenticode ${result.verified} سجلًا متحققًا من ${result.requested}.`));
    }
  };

  return (
    <WorkbenchFrame
      id="system-signatures"
      locale={locale}
      provider="Get-AuthenticodeSignature"
      foot={
        <>
          <span><ShieldCheck aria-hidden="true" />{t(locale, 'Bounded to', 'محدود بـ')} {formatCount(snapshot.processes.length)} {t(locale, 'measured process paths', 'مسار عملية مقيس')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'Only Authenticode status “Valid” counts as verified.', 'فقط حالة Authenticode «صالح» تُعد متحققًا منها.')}</span>
        </>
      }
    >
      <div className="sys-split-binary">
        <Panel title={t(locale, 'Measured binaries', 'الملفات المقيسة')} sub={`${formatCount(filtered.length)} ${t(locale, 'candidate paths', 'مسار مرشح')}`} icon={FileCode2} bodyClassName="sys-panel-body-flush">
          <div className="sys-panel-inline-search">
            <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search binary or publisher…', 'ابحث في الملف أو الناشر…')} />
          </div>
          <div className="sys-binary-list" role="listbox" aria-label={t(locale, 'Select binary', 'اختر ملفًا')}>
            {filtered.slice(0, 120).map((process) => (
              <button
                type="button"
                key={process.id}
                role="option"
                aria-selected={selected?.id === process.id}
                className={cx('sys-binary-row', selected?.id === process.id && 'is-active')}
                onClick={() => setSelectedPath(process.executablePath)}
              >
                <span className="sys-binary-name">{process.name}</span>
                <span className="sys-binary-path sys-mono">{process.executablePath}</span>
                <Chip tone={signatureMeta(process.signatureStatus).tone}>{process.signatureAvailable ? signatureMeta(process.signatureStatus).en : t(locale, 'Not checked', 'لم يُفحص')}</Chip>
              </button>
            ))}
            {!filtered.length ? <EmptyBlock compact icon={Search} title={t(locale, 'No matching binary', 'لا ملف مطابق')} message={t(locale, 'Paths are limited to measured process executables.', 'المسارات محدودة بالملفات التنفيذية للعمليات المقيسة.')} /> : null}
          </div>
        </Panel>

        <div className="sys-stack">
          <Panel
            title={t(locale, 'Signer chain', 'سلسلة الموقّع')}
            sub={selected?.executablePath || t(locale, 'Select a binary', 'اختر ملفًا')}
            icon={BadgeCheck}
            actions={
              <>
                <Seg
                  value={view}
                  onChange={setView}
                  ariaLabel={t(locale, 'Open evidence panels', 'فتح لوحات الأدلة')}
                  compact
                  options={[
                    { value: 'chain', label: t(locale, 'Chain', 'السلسلة') },
                    { value: 'certificate', label: t(locale, 'Certificate', 'الشهادة') },
                    { value: 'file', label: t(locale, 'File', 'الملف') },
                  ]}
                />
                <button type="button" className="sys-btn sys-btn-primary" onClick={() => void verify()} disabled={!selected?.executablePath || busy}>
                  {busy ? <RefreshCw className="sys-spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
                  {t(locale, 'Verify CA chain', 'تحقق من سلسلة CA')}
                </button>
              </>
            }
          >
            {signature ? (
              <>
                {view === 'chain' ? (
                  <div className="sys-cert-tree">
                    <div className={cx('sys-cert-node', 'is-leaf')}>
                      <span className="sys-cert-dot" />
                      <div><strong>{selected?.name || signature.path.split('\\').pop()}</strong><em className="sys-mono">{signature.path}</em></div>
                      <Chip tone={status.tone}>{locale === AR ? status.ar : status.en}</Chip>
                    </div>
                    <span className={cx('sys-cert-link', signature.signerSubject && 'is-live')} />
                    <div className={cx('sys-cert-node', !signature.signerSubject && 'is-unknown')}>
                      <span className="sys-cert-dot" />
                      <div><strong>{t(locale, 'Signer certificate', 'شهادة الموقّع')}</strong><em>{signature.signerSubject || t(locale, 'Not returned', 'لم تُعد')}</em></div>
                      {signature.signerNotAfter ? <Chip tone={new Date(signature.signerNotAfter).getTime() < Date.now() ? 'bad' : 'good'}>{formatDate(signature.signerNotAfter, locale)}</Chip> : null}
                    </div>
                    <span className={cx('sys-cert-link', signature.rootSubject && 'is-live')} />
                    <div className={cx('sys-cert-node', !signature.rootSubject && 'is-unknown')}>
                      <span className="sys-cert-dot" />
                      <div><strong>{t(locale, 'Root authority', 'الجهة الجذرية')}</strong><em>{signature.rootSubject || t(locale, 'Not returned', 'لم تُعد')}</em></div>
                      {signature.rootTrusted == null ? <Chip tone="muted">{t(locale, 'Trust unknown', 'الثقة مجهولة')}</Chip> : <Chip tone={signature.rootTrusted ? 'good' : 'bad'}>{signature.rootTrusted ? t(locale, 'Trusted', 'موثوق') : t(locale, 'Untrusted', 'غير موثوق')}</Chip>}
                    </div>
                  </div>
                ) : view === 'certificate' ? (
                  <KeyValueGrid>
                    <Field label={t(locale, 'Signer subject', 'موضوع الموقّع')} value={signature.signerSubject || t(locale, 'Not returned', 'لم تُعد')} className="sys-span-2" />
                    <Field label={t(locale, 'Root subject', 'موضوع الجذر')} value={signature.rootSubject || t(locale, 'Not returned', 'لم تُعد')} className="sys-span-2" />
                    <Field label={t(locale, 'Valid from', 'صالح من')} value={formatDate(signature.signerNotBefore, locale)} />
                    <Field label={t(locale, 'Valid to', 'صالح حتى')} value={formatDate(signature.signerNotAfter, locale)} />
                    <Field label={t(locale, 'Root trust', 'ثقة الجذر')} value={signature.rootTrusted == null ? t(locale, 'Unknown', 'مجهول') : signature.rootTrusted ? t(locale, 'Trusted', 'موثوق') : t(locale, 'Untrusted', 'غير موثوق')} tone={signature.rootTrusted === false ? 'bad' : signature.rootTrusted ? 'good' : 'muted'} />
                    <Field label={t(locale, 'Thumbprint', 'البصمة')} value={signature.signerThumbprint || t(locale, 'Not returned', 'لم تُعد')} mono />
                  </KeyValueGrid>
                ) : (
                  <KeyValueGrid>
                    <Field label={t(locale, 'Executable path', 'مسار الملف التنفيذي')} value={signature.path} mono className="sys-span-2" />
                    <Field label={t(locale, 'Process name', 'اسم العملية')} value={selected?.name || '—'} />
                    <Field label={t(locale, 'Publisher', 'الناشر')} value={selected?.company || t(locale, 'Not returned', 'لم يُعد')} />
                    <Field label={t(locale, 'Authenticode status', 'حالة Authenticode')} value={signature.signatureAvailable ? (locale === AR ? status.ar : status.en) : t(locale, 'Not checked', 'لم يُفحص')} tone={status.tone} />
                    <Field label={t(locale, 'Signature message', 'رسالة التوقيع')} value={signature.message || t(locale, 'No message returned', 'لم تُعد رسالة')} />
                    <Field label={t(locale, 'File hash', 'تجزئة الملف')} value={t(locale, 'Not returned by System v1', 'غير متاحة عبر System v1')} tone="muted" className="sys-span-2" />
                  </KeyValueGrid>
                )}
                <div className="sys-toolbar-row">
                  <button type="button" className="sys-btn sys-btn-quiet" onClick={() => setShowThumbprint((current) => !current)}>
                    <BadgeCheck aria-hidden="true" />
                    {showThumbprint ? t(locale, 'Hide thumbprint', 'إخفاء البصمة') : t(locale, 'Inspect thumbprint', 'فحص البصمة')}
                  </button>
                  <CopyButton locale={locale} text={signature.signerThumbprint} label={t(locale, 'Copy thumbprint', 'نسخ البصمة')} />
                  <Chip tone={signature.signatureAvailable ? 'info' : 'muted'}>{signature.source}</Chip>
                </div>
                {showThumbprint ? <CodeBlock label={t(locale, 'SHA-1 certificate thumbprint', 'بصمة شهادة SHA-1')}>{signature.signerThumbprint || t(locale, 'No thumbprint returned.', 'لم تُعد بصمة.')}</CodeBlock> : null}
                {signature.message ? <InfoNote tone={status.tone === 'good' ? 'good' : 'warn'}>{signature.message}</InfoNote> : null}
              </>
            ) : (
              <EmptyBlock icon={ShieldCheck} title={t(locale, 'No signature record yet', 'لا سجل توقيع بعد')} message={t(locale, 'Choose a measured binary and run explicit Authenticode verification. Nothing is verified in the background.', 'اختر ملفًا مقيسًا وشغّل تحقق Authenticode صراحةً. لا شيء يُتحقق منه في الخلفية.')} />
            )}
          </Panel>

          <Panel title={t(locale, 'Evidence panels', 'لوحات الأدلة')} icon={Info}>
            <KeyValueGrid>
              <Field
                label={t(locale, 'Certificate validity', 'صلاحية الشهادة')}
                value={signature?.signerNotBefore || signature?.signerNotAfter
                  ? `${formatDate(signature.signerNotBefore, locale)} → ${formatDate(signature.signerNotAfter, locale)}`
                  : '—'}
              />
              <Field label={t(locale, 'Root CA trust status', 'حالة ثقة CA الجذرية')} value={signature?.rootTrusted == null ? t(locale, 'Unknown', 'مجهول') : signature.rootTrusted ? t(locale, 'Trusted', 'موثوق') : t(locale, 'Untrusted', 'غير موثوق')} tone={signature?.rootTrusted === false ? 'bad' : signature?.rootTrusted ? 'good' : 'muted'} />
              <Field label={t(locale, 'File hash matching', 'مطابقة تجزئة الملف')} value={t(locale, 'Not returned by System v1', 'غير متاحة عبر System v1')} hint={t(locale, 'The Authenticode provider does not return a file hash; no digest is invented.', 'مزود Authenticode لا يعيد تجزئة الملف؛ لا تُختلق أي بصمة.')} />
              <Field label={t(locale, 'Requested', 'المطلوب')} value={`${formatCount(controller.signatureResult?.requested ?? 0)} · ${t(locale, 'verified', 'متحقق')}: ${formatCount(controller.signatureResult?.verified ?? 0)}`} />
            </KeyValueGrid>
            <InfoNote tone="muted">
              {t(locale, 'Verification is explicit and bounded to 24 paths. The server validates every absolute Windows path before Get-AuthenticodeSignature runs.', 'التحقق صريح ومحدود بـ24 مسارًا. يتحقق الخادم من كل مسار Windows مطلق قبل تشغيل Get-AuthenticodeSignature.')}
            </InfoNote>
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 05 - Boot & Session Clock                                                 */
/* ------------------------------------------------------------------------- */

export function BootClockWorkbench({ locale, snapshot, series, controller }: WorkbenchProps) {
  const boot = snapshot.boot;
  const identity = snapshot.identity;
  const [now, setNow] = useState(() => Date.now());
  const [windowHours, setWindowHours] = useState<'24' | '168' | 'all'>('168');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'this-boot'>('all');
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const uptimeSeconds = boot.lastBootTime
    ? Math.max(0, Math.floor((now - new Date(boot.lastBootTime).getTime()) / 1000))
    : identity.uptimeSeconds;
  const events = useMemo(() => {
    return boot.events.filter((event) => {
      if (windowHours !== 'all' && event.timeCreated) {
        if (now - new Date(event.timeCreated).getTime() > Number(windowHours) * 3600000) return false;
      }
      if (sessionFilter === 'this-boot' && event.timeCreated && boot.lastBootTime) {
        if (new Date(event.timeCreated).getTime() < new Date(boot.lastBootTime).getTime()) return false;
      }
      return true;
    });
  }, [boot.events, boot.lastBootTime, now, sessionFilter, windowHours]);
  const activeEvent = events[selectedEvent ?? 0] || null;
  const sampleCount = series.length;

  return (
    <WorkbenchFrame
      id="system-uptime"
      locale={locale}
      provider="Win32_OperatingSystem + Diagnostics-Performance"
      foot={
        <>
          <span><Clock aria-hidden="true" />{t(locale, 'Uptime is derived from the measured boot timestamp.', 'تُشتق مدة التشغيل من طابع الإقلاع المقيس.')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'Shutdown reason is not exposed by the provider and stays unknown.', 'سبب الإيقاف غير متاح عبر المزود ويبقى مجهولًا.')}</span>
        </>
      }
    >
      <div className="sys-boot-hero">
        <div className="sys-boot-clock">
          <span>{t(locale, 'Active session clock', 'ساعة الجلسة النشطة')}</span>
          <strong>{formatClock(uptimeSeconds)}</strong>
          <em>{formatDuration(uptimeSeconds)} · {formatTimestamp(boot.lastBootTime, locale)}</em>
        </div>
        <div className="sys-boot-ring" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(52,211,153,0.16)" strokeWidth="7" />
            <circle cx="60" cy="60" r="48" fill="none" stroke="#34d399" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${Math.min(301, ((uptimeSeconds ?? 0) % 86400) / 86400 * 301)} 301`} transform="rotate(-90 60 60)" />
          </svg>
          <span>{formatCount(sampleCount)}<em>{t(locale, 'samples', 'عينة')}</em></span>
        </div>
      </div>

      <div className="sys-toolbar-row">
        <Seg
          value={windowHours}
          onChange={setWindowHours}
          ariaLabel={t(locale, 'Switch time window', 'تبديل النافذة الزمنية')}
          compact
          options={[
            { value: '24', label: '24h' },
            { value: '168', label: '7d' },
            { value: 'all', label: t(locale, 'All', 'الكل') },
          ]}
        />
        <Seg
          value={sessionFilter}
          onChange={setSessionFilter}
          ariaLabel={t(locale, 'Filter session type', 'تصفية نوع الجلسة')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All sessions', 'كل الجلسات') },
            { value: 'this-boot', label: t(locale, 'This boot', 'هذا الإقلاع') },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <ExportButton
          fileName="knoux-uptime-stats.json"
          payload={{ identity, boot, uptimeSeconds, observedAt: new Date(now).toISOString(), source: 'SystemBridge measured boot evidence' }}
          label={t(locale, 'Export uptime stats', 'تصدير إحصاءات التشغيل')}
          onDone={(ok) => controller.showNotice(ok ? t(locale, 'Measured uptime statistics exported.', 'صُدّرت إحصاءات التشغيل المقيسة.') : t(locale, 'The uptime export could not start.', 'تعذّر بدء تصدير إحصاءات التشغيل.'))}
        />
      </div>

      <div className="sys-grid-4">
        <Panel title={t(locale, 'Uptime clock', 'ساعة مدة التشغيل')} icon={Clock}>
          <strong className="sys-hero-number">{formatClock(uptimeSeconds)}</strong>
          <Field label={t(locale, 'Measured boot time', 'وقت الإقلاع المقيس')} value={formatTimestamp(boot.lastBootTime, locale)} />
        </Panel>
        <Panel title={t(locale, 'Last boot timestamp', 'طابع آخر إقلاع')} icon={TimerReset}>
          <Field label={t(locale, 'Reported by', 'مُبلَّغ من')} value="Win32_OperatingSystem.LastBootUpTime" mono />
          <Field label={t(locale, 'Relative', 'نسبيًا')} value={formatRelative(boot.lastBootTime, locale)} />
          <Field label={t(locale, 'Time zone', 'المنطقة الزمنية')} value={identity.timeZone || '—'} />
        </Panel>
        <Panel title={t(locale, 'System shutdown reason', 'سبب إيقاف النظام')} icon={AlertTriangle}>
          <Field label={t(locale, 'Reported reason', 'السبب المبلَّغ')} value={boot.shutdownReason === 'unknown' ? t(locale, 'Unknown', 'مجهول') : boot.shutdownReason} tone="muted" />
          <p className="sys-muted-text">{boot.note}</p>
        </Panel>
        <Panel title={t(locale, 'Fast Startup status', 'حالة بدء التشغيل السريع')} icon={Zap}>
          <Field
            label={t(locale, 'State', 'الحالة')}
            value={!boot.fastStartupAvailable ? t(locale, 'Unavailable', 'غير متاح') : boot.fastStartupEnabled == null ? t(locale, 'Unknown', 'مجهول') : boot.fastStartupEnabled ? t(locale, 'Enabled', 'ممكّن') : t(locale, 'Disabled', 'معطّل')}
            tone={!boot.fastStartupAvailable ? 'muted' : boot.fastStartupEnabled ? 'warn' : 'good'}
          />
          <Field label={t(locale, 'Evidence', 'الدليل')} value={boot.fastStartupAvailable ? 'HiberbootEnabled' : t(locale, 'Not exposed on this system', 'غير متاح على هذا النظام')} mono />
        </Panel>
      </div>

      <div className="sys-split-2">
        <Panel title={t(locale, 'Restart-event ribbon', 'شريط أحداث إعادة التشغيل')} sub={`${formatCount(events.length)} ${t(locale, 'boot diagnostics events', 'أحداث تشخيص الإقلاع')}`} icon={Activity} bodyClassName="sys-panel-body-flush">
          {events.length ? (
            <div className="sys-ribbon">
              {events.map((event, index) => (
                <button
                  type="button"
                  key={`${event.timeCreated}-${event.eventId}-${index}`}
                  className={cx('sys-ribbon-item', (selectedEvent ?? 0) === index && 'is-active')}
                  onClick={() => setSelectedEvent(index)}
                >
                  <span className="sys-ribbon-dot" />
                  <strong>{formatTime(event.timeCreated, locale)}</strong>
                  <em>{event.provider} · {event.eventId ?? '—'}</em>
                </button>
              ))}
            </div>
          ) : (
            <EmptyBlock icon={Clock} title={t(locale, 'No boot diagnostics events', 'لا أحداث تشخيص إقلاع')} message={t(locale, 'Diagnostics-Performance returned no rows for this window. Nothing is substituted.', 'لم يُعد Diagnostics-Performance صفوفًا لهذه النافذة. لا يُستبدل شيء.')} />
          )}
        </Panel>
        <Panel title={t(locale, 'Restart event details', 'تفاصيل حدث إعادة التشغيل')} icon={ScrollText}>
          {activeEvent ? (
            <>
              <KeyValueGrid>
                <Field label={t(locale, 'Time', 'الوقت')} value={formatTimestamp(activeEvent.timeCreated, locale)} />
                <Field label={t(locale, 'Event ID', 'معرف الحدث')} value={activeEvent.eventId ?? '—'} />
                <Field label={t(locale, 'Provider', 'المزود')} value={activeEvent.provider} />
                <Field label={t(locale, 'Session', 'الجلسة')} value={sessionFilter === 'this-boot' ? t(locale, 'Current boot', 'الإقلاع الحالي') : t(locale, 'All measured', 'كل المقيس')} />
              </KeyValueGrid>
              <CodeBlock label={t(locale, 'Measured message', 'الرسالة المقيسة')}>{activeEvent.message || t(locale, 'No message text returned.', 'لم يُعد نص الرسالة.')}</CodeBlock>
            </>
          ) : (
            <EmptyBlock compact icon={ScrollText} title={t(locale, 'No event selected', 'لا حدث محدد')} message={t(locale, 'Select a measured ribbon marker.', 'اختر علامة مقيسة من الشريط.')} />
          )}
        </Panel>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 06 - Live Performance Pulse                                               */
/* ------------------------------------------------------------------------- */

const PERF_METRICS: Array<{
  key: 'cpu' | 'memory' | 'disk' | 'network';
  labelEn: string;
  labelAr: string;
  color: string;
  metric: MetricKey;
  secondary: MetricKey;
  format: (value: number | null) => string;
}> = [
  { key: 'cpu', labelEn: 'CPU', labelAr: 'المعالج', color: '#22d3ee', metric: 'cpuPercent', secondary: 'cpuFrequencyMHz', format: (value) => formatPercent(value, 1) },
  { key: 'memory', labelEn: 'Memory', labelAr: 'الذاكرة', color: '#a78bfa', metric: 'memoryPercent', secondary: 'memoryUsedBytes', format: (value) => formatPercent(value, 1) },
  { key: 'disk', labelEn: 'Disk', labelAr: 'القرص', color: '#fbbf24', metric: 'diskReadBytesPerSec', secondary: 'diskWriteBytesPerSec', format: (value) => formatRate(value) },
  { key: 'network', labelEn: 'Network', labelAr: 'الشبكة', color: '#34d399', metric: 'networkInBytesPerSec', secondary: 'networkOutBytesPerSec', format: (value) => formatRate(value) },
];

export function PerformancePulseWorkbench({ locale, snapshot, series, controller }: WorkbenchProps) {
  const [metricKey, setMetricKey] = useState<'cpu' | 'memory' | 'disk' | 'network'>('cpu');
  const [visible, setVisible] = useState<Record<string, boolean>>({ cpu: true, memory: true, disk: true, network: true });
  const active = PERF_METRICS.find((entry) => entry.key === metricKey) || PERF_METRICS[0];
  const values = useMemo(() => metricValues(series, active.metric), [active.metric, series]);
  const secondaryValues = useMemo(() => metricValues(series, active.secondary), [active.secondary, series]);
  const current = latestOf(values);
  const peak = maxOf(values);
  const average = averageOf(values);
  const sampleSeconds = Math.round(controller.sampleIntervalMs / 1000);
  const loadRating = current == null
    ? t(locale, 'Unknown', 'مجهول')
    : current >= 80 ? t(locale, 'Heavy', 'مرتفع')
      : current >= 45 ? t(locale, 'Moderate', 'متوسط')
        : t(locale, 'Light', 'خفيف');

  return (
    <WorkbenchFrame
      id="system-perf"
      locale={locale}
      provider="PerfOS / PerfDisk / Tcpip counters"
      foot={
        <>
          <span><Database aria-hidden="true" />{formatCount(series.length)} {t(locale, 'bounded samples', 'عينة محدودة')} · {t(locale, 'cap', 'الحد')} 120</span>
          <span><Clock aria-hidden="true" />{t(locale, 'Last sample', 'آخر عينة')}: {formatTime(controller.lastSampleAt, locale)}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Seg
          value={controller.sampleIntervalMs}
          onChange={(value) => controller.setSampleInterval(value)}
          ariaLabel={t(locale, 'Interval tabs', 'تبويبات الفاصل')}
          compact
          options={[
            { value: 1000, label: '1s' },
            { value: 5000, label: '5s' },
            { value: 15000, label: '15s' },
          ]}
        />
        <button type="button" className="sys-btn sys-btn-ghost" onClick={() => controller.setSamplingPaused(!controller.samplingPaused)}>
          {controller.samplingPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {controller.samplingPaused ? t(locale, 'Resume local chart', 'استئناف المخطط المحلي') : t(locale, 'Pause local chart', 'إيقاف المخطط مؤقتًا')}
        </button>
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.sampleNow()} disabled={controller.sampling}>
          <RefreshCw className={controller.sampling ? 'sys-spin' : undefined} aria-hidden="true" />
          {t(locale, 'Sample now', 'قياس الآن')}
        </button>
        <span className="sys-toolbar-spacer" />
        {PERF_METRICS.map((entry) => (
          <Toggle
            key={entry.key}
            checked={Boolean(visible[entry.key])}
            onChange={(checked) => setVisible((currentMap) => ({ ...currentMap, [entry.key]: checked }))}
            label={locale === AR ? entry.labelAr : entry.labelEn}
          />
        ))}
      </div>

      <div className="sys-perf-layout">
        <Panel
          className="sys-perf-chart-panel"
          title={t(locale, 'Synchronized pulse', 'النبض المتزامن')}
          sub={`${formatCount(series.length)} ${t(locale, 'samples', 'عينة')} · ${t(locale, 'interval', 'الفاصل')} ${sampleSeconds}s · ${controller.samplingPaused ? t(locale, 'paused', 'متوقف') : t(locale, 'live', 'حي')}`}
          icon={GaugeIcon}
          actions={
            <Seg
              value={metricKey}
              onChange={setMetricKey}
              ariaLabel={t(locale, 'Select metric tab', 'اختر تبويب القياس')}
              compact
              options={PERF_METRICS.map((entry) => ({ value: entry.key, label: locale === AR ? entry.labelAr : entry.labelEn }))}
            />
          }
        >
          <div className="sys-perf-main-chart">
            <Sparkline values={values} color={active.color} height={150} label={`${locale === AR ? active.labelAr : active.labelEn} measured series`} />
          </div>
          <div className="sys-perf-series">
            {PERF_METRICS.filter((entry) => visible[entry.key]).map((entry) => (
              <button
                type="button"
                key={entry.key}
                className={cx('sys-perf-series-row', metricKey === entry.key && 'is-active')}
                onClick={() => setMetricKey(entry.key)}
              >
                <span className="sys-perf-series-dot" style={{ background: entry.color }} />
                <strong>{locale === AR ? entry.labelAr : entry.labelEn}</strong>
                <Sparkline values={metricValues(series, entry.metric)} color={entry.color} height={28} showArea={false} label={entry.labelEn} />
                <em>{entry.format(latestOf(metricValues(series, entry.metric)))}</em>
              </button>
            ))}
            {!PERF_METRICS.some((entry) => visible[entry.key]) ? (
              <EmptyBlock compact icon={ListFilter} title={t(locale, 'All series hidden', 'كل السلاسل مخفية')} message={t(locale, 'Enable a measured series with the toggles above.', 'فعّل سلسلة مقيسة باستخدام المفاتيح أعلاه.')} />
            ) : null}
          </div>
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Current value & peak', 'القيمة الحالية والذروة')} icon={Activity}>
            <div className="sys-perf-kpis">
              <MiniStat label={t(locale, 'Current', 'الحالي')} value={active.format(current)} tone="info" />
              <MiniStat label={t(locale, 'Peak', 'الذروة')} value={active.format(peak)} tone="warn" />
              <MiniStat label={t(locale, 'Average', 'المتوسط')} value={active.format(average)} />
            </div>
          </Panel>
          <Panel title={t(locale, 'Sample interval status', 'حالة فاصل العينات')} icon={TimerReset}>
            <DataRows
              rows={[
                { label: t(locale, 'Requested interval', 'الفاصل المطلوب'), value: `${sampleSeconds}s` },
                { label: t(locale, 'Sampler state', 'حالة القياس'), value: controller.samplingPaused ? t(locale, 'Paused by user', 'متوقف بواسطة المستخدم') : controller.sampling ? t(locale, 'Sampling now', 'جارٍ القياس') : t(locale, 'Armed', 'مستعد'), tone: controller.samplingPaused ? 'warn' : 'good' },
                { label: t(locale, 'Last sample', 'آخر عينة'), value: formatTimestamp(controller.lastSampleAt, locale) },
                { label: t(locale, 'Secondary counter', 'العداد الثانوي'), value: active.format(latestOf(secondaryValues)) },
              ]}
            />
          </Panel>
          <Panel title={t(locale, 'System load rating', 'تقييم حمل النظام')} icon={Zap}>
            <strong className="sys-load-rating">{loadRating}</strong>
            <MeterBar value={current} tone={percentageTone(current)} label={t(locale, 'Selected metric', 'القياس المحدد')} caption={active.format(current)} />
            <InfoNote tone="muted">
              {t(locale, 'The rating is a presentation label derived from the measured value; it is not a fabricated health score.', 'التقييم وسم عرض مشتق من القيمة المقيسة؛ وليس درجة صحة مختلقة.')}
            </InfoNote>
          </Panel>
        </div>
      </div>

      <div className="sys-perf-footnote">
        <InfoNote tone={controller.samplingPaused ? 'warn' : 'info'}>
          {controller.samplingPaused
            ? t(locale, 'Local sampling is paused. Existing measured points remain visible; nothing is fabricated to fill the gap.', 'القياس المحلي متوقف مؤقتًا. تبقى النقاط المقيسة ظاهرة؛ لا يُختلق شيء لملء الفجوة.')
            : t(locale, 'Samples are appended only when the Windows performance counter call succeeds. Missing counters create gaps, not zeros.', 'تُضاف العينات فقط عند نجاح استدعاء عدادات أداء Windows. العدادات المفقودة تنشئ فجوات لا أصفارًا.')}
        </InfoNote>
        <Chip tone="good">{t(locale, 'Measured timestamps', 'طوابع زمنية مقيسة')}</Chip>
        <Chip tone="muted">{snapshot.metrics.source}</Chip>
      </div>
    </WorkbenchFrame>
  );
}
