/**
 * Service Commander - startup analytics, transition history and svchost (07, 08, 12).
 */
import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Clock3,
  Cpu,
  Download,
  FileText,
  History,
  Layers,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import type { ServicesWorkbenchProps } from './ui';
import {
  Chip,
  DataRows,
  ExportButton,
  Panel,
  Seg,
  cx,
  downloadJson,
} from '../system/ui';
import {
  ServiceDossier,
  ServiceEventList,
  ServiceStateChip,
  ServicesToolFrame,
} from './ui';
import {
  eventLevelMeta,
  eventMatchesService,
  formatBytes,
  formatCount,
  formatTimestamp,
  startupMeta,
  t,
} from './model';

/* 07 - Startup policy analytics */
export function StartupReportWorkbench({ locale, snapshot }: ServicesWorkbenchProps) {
  const [segment, setSegment] = useState<'automatic' | 'manual' | 'disabled' | 'delayed'>('automatic');
  const counts = {
    automatic: snapshot.summary.automatic,
    manual: snapshot.summary.manual,
    disabled: snapshot.summary.disabled,
    delayed: snapshot.summary.delayed,
  };
  const filtered = useMemo(() => {
    if (segment === 'delayed') return snapshot.services.filter((entry) => entry.delayedAuto === true);
    if (segment === 'automatic') return snapshot.services.filter((entry) => entry.startupType === 'automatic' && entry.delayedAuto !== true);
    return snapshot.services.filter((entry) => entry.startupType === segment);
  }, [segment, snapshot.services]);
  const total = snapshot.summary.total || 1;
  const segments = [
    { key: 'automatic' as const, label: t(locale, 'Automatic', 'تلقائي'), color: 'is-automatic' },
    { key: 'delayed' as const, label: t(locale, 'Delayed', 'مؤجل'), color: 'is-delayed' },
    { key: 'manual' as const, label: t(locale, 'Manual', 'يدوي'), color: 'is-manual' },
    { key: 'disabled' as const, label: t(locale, 'Disabled', 'معطل'), color: 'is-disabled' },
  ];
  return (
    <ServicesToolFrame
      toolId="services-startup-report"
      locale={locale}
      foot={<><span><BarChart3 aria-hidden="true" />{formatCount(snapshot.summary.thirdParty)} {t(locale, 'non-Windows-path services', 'خدمة بمسار غير Windows')}</span><span><Lock aria-hidden="true" />{t(locale, 'Measured policy distribution', 'توزيع سياسة مقيس')}</span></>}
    >
      <div className="svc-policy-bar" role="group" aria-label={t(locale, 'Startup policy distribution', 'توزيع سياسة البدء')}>
        {segments.map((entry) => (
          <button
            key={entry.key}
            type="button"
            className={cx('svc-policy-segment', entry.color, segment === entry.key && 'is-active')}
            style={{ flexGrow: Math.max(0.12, counts[entry.key] / total) }}
            onClick={() => setSegment(entry.key)}
            aria-pressed={segment === entry.key}
            title={`${entry.label}: ${counts[entry.key]}`}
          >
            <span>{entry.label}</span>
            <strong>{formatCount(counts[entry.key])}</strong>
          </button>
        ))}
      </div>
      <div className="svc-policy-kpis">
        {segments.map((entry) => (
          <div key={entry.key} className={cx('svc-policy-kpi', entry.color, segment === entry.key && 'is-active')}>
            <span>{entry.label}</span>
            <strong>{formatCount(counts[entry.key])}</strong>
            <em>{((counts[entry.key] / total) * 100).toFixed(1)}%</em>
          </div>
        ))}
      </div>
      <div className="sys-split-2">
        <Panel title={`${segments.find((entry) => entry.key === segment)?.label} ${t(locale, 'services', 'خدمة')}`} sub={`${formatCount(filtered.length)} ${t(locale, 'measured entries', 'مدخل مقيس')}`} icon={Layers} bodyClassName="sys-panel-body-flush">
          <div className="svc-policy-list knx-custom-scrollbar">
            {filtered.map((entry) => (
              <div key={entry.name} className="svc-policy-row">
                <span className="svc-row-name"><strong>{entry.displayName || entry.name}</strong><em>{entry.name}</em></span>
                <ServiceStateChip state={entry.state} locale={locale} />
                <Chip tone={startupMeta(entry.startupType, entry.delayedAuto, locale).tone}>{startupMeta(entry.startupType, entry.delayedAuto, locale).label}</Chip>
                <span className="svc-row-account">{entry.account || '—'}</span>
              </div>
            ))}
            {!filtered.length ? <div className="svc-empty">{t(locale, 'No measured service in this policy group.', 'لا خدمة مقيسة في مجموعة السياسة هذه.')}</div> : null}
          </div>
        </Panel>
        <Panel title={t(locale, 'Policy comparison', 'مقارنة السياسات')} icon={BarChart3}>
          <DataRows
            rows={segments.map((entry) => ({
              label: entry.label,
              value: `${formatCount(counts[entry.key])} · ${((counts[entry.key] / total) * 100).toFixed(1)}%`,
              mono: true,
            }))}
          />
          <p className="svc-op-hint">{t(locale, 'Counts are computed from the measured StartMode/DelayedAutoStart fields. No target or recommended count is invented.', 'تُحسب الأعداد من حقلي StartMode/DelayedAutoStart المقيسين. لا يُختلق هدف أو عدد موصى به.')}</p>
        </Panel>
      </div>
    </ServicesToolFrame>
  );
}

/* 08 - Transition history */
export function StateHistoryWorkbench({ locale, snapshot }: ServicesWorkbenchProps) {
  const serviceOptions = useMemo(() => {
    const names = new Set(snapshot.events.map((event) => event.serviceName).filter(Boolean) as string[]);
    return [...names].sort();
  }, [snapshot.events]);
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [windowHours, setWindowHours] = useState<'24' | '168' | 'all'>('168');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const service = serviceFilter === 'all' ? null : snapshot.services.find((entry) => entry.name === serviceFilter) || null;
  const events = useMemo(() => {
    const cutoff = windowHours === 'all' ? 0 : Date.now() - Number(windowHours) * 3600000;
    return snapshot.events.filter((event) => (serviceFilter === 'all' ? true : eventMatchesService(event, service)) && (!cutoff || (event.at && new Date(event.at).getTime() >= cutoff)));
  }, [service, serviceFilter, snapshot.events, windowHours]);
  const selectedEvent = events.find((entry) => entry.id === selectedEventId) || events[0] || null;
  return (
    <ServicesToolFrame
      toolId="services-state-history"
      locale={locale}
      foot={<><span><History aria-hidden="true" />{formatCount(events.length)} {t(locale, 'measured transitions', 'تحول مقيس')}</span><span><Lock aria-hidden="true" />{t(locale, 'Event log read-only', 'سجل الأحداث للقراءة فقط')}</span></>}
    >
      <div className="sys-toolbar-row">
        <label className="svc-inline-label" htmlFor="svc-history-service">{t(locale, 'Service', 'الخدمة')}</label>
        <select id="svc-history-service" className="sys-input" value={serviceFilter} onChange={(event) => { setServiceFilter(event.target.value); setSelectedEventId(null); }} aria-label={t(locale, 'Filter service', 'تصفية الخدمة')}>
          <option value="all">{t(locale, 'All matched services', 'كل الخدمات المطابقة')}</option>
          {serviceOptions.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <Seg<'24' | '168' | 'all'>
          value={windowHours}
          onChange={setWindowHours}
          ariaLabel={t(locale, 'Time range picker', 'اختيار النطاق الزمني')}
          compact
          options={[
            { value: '24', label: '24h' },
            { value: '168', label: '7d' },
            { value: 'all', label: t(locale, 'All', 'الكل') },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <Chip tone={snapshot.eventCoverage.status === 'available' ? 'good' : 'warn'}>{snapshot.eventCoverage.status} · {formatCount(snapshot.eventCoverage.count)}</Chip>
        <ExportButton
          fileName="knoux-service-transitions.json"
          payload={{ generatedAt: snapshot.generatedAt, eventCoverage: snapshot.eventCoverage, events }}
          label={t(locale, 'Export history', 'تصدير التاريخ')}
          onDone={() => undefined}
        />
      </div>

      {snapshot.eventCoverage.status !== 'available' ? (
        <div className="svc-coverage-warning"><ShieldAlert aria-hidden="true" />{snapshot.eventCoverage.reason || t(locale, 'SCM events are not readable.', 'أحداث SCM غير مقروءة.')}</div>
      ) : null}

      <div className="sys-split-ledger">
        <Panel className="sys-ledger-panel" title={t(locale, 'Transition timeline', 'خط التحولات الزمني')} sub={`${formatCount(events.length)} ${t(locale, 'matching events', 'حدث مطابق')}`} icon={Clock3} bodyClassName="sys-panel-body-flush">
          <ServiceEventList locale={locale} events={events} selectedId={selectedEvent?.id || null} onSelect={setSelectedEventId} max={120} />
        </Panel>
        <div className="sys-stack">
          <Panel title={t(locale, 'Transition dossier', 'ملف التحول')} sub={selectedEvent ? `Event ${selectedEvent.eventId}` : undefined} icon={FileText}>
            {selectedEvent ? (
              <>
                <DataRows
                  rows={[
                    { label: t(locale, 'Timestamp', 'الطابع'), value: formatTimestamp(selectedEvent.at, locale) },
                    { label: t(locale, 'Event ID', 'معرف الحدث'), value: String(selectedEvent.eventId ?? '—'), mono: true },
                    { label: t(locale, 'Level', 'المستوى'), value: eventLevelMeta(selectedEvent.level).en, tone: eventLevelMeta(selectedEvent.level).tone },
                    { label: t(locale, 'Service', 'الخدمة'), value: selectedEvent.serviceName || t(locale, 'Not attributed', 'غير منسوب') },
                    { label: t(locale, 'Source', 'المصدر'), value: selectedEvent.source },
                  ]}
                />
                <pre className="svc-event-message-full">{selectedEvent.message}</pre>
                <p className="svc-op-hint">{t(locale, 'Previous → new state is taken from the event message only when SCM states it. No transition is inferred.', 'الحالة السابقة → الجديدة تؤخذ من رسالة الحدث فقط عندما يذكرها SCM. لا يُستنتج تحول.')}</p>
              </>
            ) : <p className="svc-op-hint">{t(locale, 'Select an event marker.', 'اختر علامة حدث.')}</p>}
          </Panel>
          <Panel title={t(locale, 'Service stability', 'استقرار الخدمة')} icon={Activity}>
            <DataRows
              rows={[
                { label: t(locale, 'Events in window', 'أحداث في النافذة'), value: String(events.length) },
                { label: t(locale, 'Event errors', 'أخطاء الأحداث'), value: String(events.filter((event) => (event.level ?? 9) <= 2).length), tone: events.some((event) => (event.level ?? 9) <= 2) ? 'bad' : 'good' },
                { label: t(locale, 'Coverage', 'التغطية'), value: `${snapshot.eventCoverage.days} ${t(locale, 'days', 'يوم')}`, tone: snapshot.eventCoverage.status === 'available' ? 'good' : 'warn' },
              ]}
            />
            <p className="svc-op-hint">{t(locale, 'Stability is a count of measured events, not a fabricated health score.', 'الاستقرار عدد أحداث مقيسة وليس درجة صحة مختلقة.')}</p>
          </Panel>
        </div>
      </div>
    </ServicesToolFrame>
  );
}

/* 12 - svchost shared host monitor */
export function PerfWorkbench({ locale, snapshot, controller }: ServicesWorkbenchProps) {
  const [sort, setSort] = useState<'services' | 'memory'>('services');
  const [selectedPid, setSelectedPid] = useState<number | null>(snapshot.svchost[0]?.pid || null);
  const groups = useMemo(() => [...snapshot.svchost].sort((left, right) => sort === 'memory' ? (right.workingSetBytes ?? -1) - (left.workingSetBytes ?? -1) : right.serviceCount - left.serviceCount || left.pid - right.pid), [snapshot.svchost, sort]);
  const selected = groups.find((group) => group.pid === selectedPid) || groups[0] || null;
  const hosted = selected ? selected.services.map((name) => snapshot.services.find((entry) => entry.name === name)).filter(Boolean) : [];
  return (
    <ServicesToolFrame
      toolId="services-perf"
      locale={locale}
      provider="Win32_Process svchost.exe + Win32_Service.ProcessId"
      foot={<><span><Cpu aria-hidden="true" />{formatCount(snapshot.svchost.length)} {t(locale, 'shared hosts', 'مضيف مشترك')}</span><span><Lock aria-hidden="true" />{t(locale, 'Single measured host snapshot', 'لقطة مضيف مقيسة واحدة')}</span></>}
    >
      <div className="sys-toolbar-row">
        <Seg<'services' | 'memory'>
          value={sort}
          onChange={setSort}
          ariaLabel={t(locale, 'Sort hosts', 'ترتيب المضيفات')}
          compact
          options={[
            { value: 'services', label: t(locale, 'Most services', 'الأكثر خدمات') },
            { value: 'memory', label: t(locale, 'Largest memory', 'الأكبر ذاكرة') },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.refreshSnapshot(true)} disabled={controller.refreshing}>
          <RefreshCw aria-hidden="true" className={controller.refreshing ? 'sys-spin' : undefined} />{t(locale, 'Refresh host snapshot', 'تحديث لقطة المضيف')}
        </button>
        <Chip tone="warn" icon={ShieldAlert}>{t(locale, 'Shared attribution', 'إسناد مشترك')}</Chip>
      </div>

      <div className="sys-split-ledger">
        <Panel className="sys-ledger-panel" title={t(locale, 'svchost groups', 'مجموعات svchost')} sub={`${formatCount(groups.length)} ${t(locale, 'measured hosts', 'مضيف مقيس')}`} icon={Layers} bodyClassName="sys-panel-body-flush">
          <div className="svc-host-list" role="listbox" aria-label={t(locale, 'svchost groups', 'مجموعات svchost')}>
            {groups.map((group) => (
              <button key={group.pid} type="button" role="option" aria-selected={selected?.pid === group.pid} className={cx('svc-host-row', selected?.pid === group.pid && 'is-active')} onClick={() => setSelectedPid(group.pid)}>
                <span className="svc-host-pid">PID {group.pid}</span>
                <span className="svc-host-copy">
                  <strong>{group.group || t(locale, 'Group not reported', 'المجموعة غير مبلغة')}</strong>
                  <em>{formatCount(group.serviceCount)} {t(locale, 'hosted services', 'خدمة مستضافة')} · {formatBytes(group.workingSetBytes)}</em>
                </span>
                <Chip tone={group.serviceCount > 20 ? 'warn' : 'muted'}>{formatCount(group.serviceCount)}</Chip>
              </button>
            ))}
            {!groups.length ? <div className="svc-empty">{t(locale, 'No svchost group was measured.', 'لم تُقس أي مجموعة svchost.')}</div> : null}
          </div>
        </Panel>
        <div className="sys-stack">
          <Panel title={t(locale, 'Host dossier', 'ملف المضيف')} sub={selected ? `svchost.exe · PID ${selected.pid}` : undefined} icon={Cpu}>
            {selected ? (
              <>
                <div className="svc-host-hero">
                  <span className="svc-host-glyph" aria-hidden="true"><Cpu /></span>
                  <div>
                    <strong>{selected.group || t(locale, 'Group not reported', 'المجموعة غير مبلغة')}</strong>
                    <em>{formatBytes(selected.workingSetBytes)} {t(locale, 'working set', 'مجموعة عمل')} · {formatCount(selected.serviceCount)} {t(locale, 'services', 'خدمة')}</em>
                  </div>
                  <Chip tone="warn" icon={Lock}>{t(locale, 'Shared host', 'مضيف مشترك')}</Chip>
                </div>
                <div className="svc-chip-row">
                  {hosted.slice(0, 16).map((service) => <Chip key={service?.name || 'x'} tone="muted">{service?.name}</Chip>)}
                  {hosted.length > 16 ? <Chip tone="muted">+{hosted.length - 16}</Chip> : null}
                </div>
                <DataRows
                  rows={[
                    { label: t(locale, 'Host PID', 'PID المضيف'), value: String(selected.pid), mono: true },
                    { label: t(locale, 'Working set', 'مجموعة العمل'), value: formatBytes(selected.workingSetBytes) },
                    { label: t(locale, 'Hosted services', 'الخدمات المستضافة'), value: String(selected.serviceCount) },
                    { label: t(locale, 'Attribution', 'الإسناد'), value: t(locale, 'Shared — per-service memory is not attributed', 'مشترك — ذاكرة كل خدمة غير منسوبة'), tone: 'warn' },
                    { label: t(locale, 'Source', 'المصدر'), value: selected.source, mono: true },
                  ]}
                />
                <p className="svc-op-hint">{t(locale, 'A shared host working set is not a per-service memory reading. This app does not divide it by service count.', 'مجموعة عمل المضيف المشترك ليست قراءة ذاكرة لكل خدمة. لا يقسمها التطبيق على عدد الخدمات.')}</p>
              </>
            ) : <p className="svc-op-hint">{t(locale, 'Select a measured svchost group.', 'اختر مجموعة svchost مقيسة.')}</p>}
          </Panel>
        </div>
      </div>
    </ServicesToolFrame>
  );
}
