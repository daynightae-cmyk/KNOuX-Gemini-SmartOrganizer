/**
 * Twelve specialised Boot Control workbenches (Mission 09).
 *
 * Every panel is bound to the selected measured entity and the real read-only
 * inventory. Staged actions produce immutable review plans; no registry, task,
 * service, startup-folder or journal write is available here.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  Clock3,
  Cpu,
  Database,
  FileCheck2,
  FileCode2,
  Filter,
  FolderTree,
  Gauge,
  KeyRound,
  Layers,
  ListFilter,
  Lock,
  PowerOff,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Timer,
  UserRound,
  X,
} from 'lucide-react';
import type {
  StartupEntry,
  StartupPlan,
  StartupServiceEntry,
  StartupTaskEntry,
} from '../../shared/native-contracts';
import type { StartupController } from './useStartup';
import {
  BOOT_EVENT_META,
  ENTRY_SOURCES,
  SERVICE_ACCENTS,
  SERVICE_FALLBACK_META,
  SERVICE_IDS,
  SERVICE_STARTUP_META,
  SIGNATURE_META,
  SOURCE_META,
  STATE_META,
  bootEventLabel,
  eventLevelTone,
  filterEntries,
  formatCount,
  formatDate,
  formatDelay,
  formatTime,
  formatTimestamp,
  planActionLabel,
  planModeLabel,
  protectionLabel,
  scopeLabel,
  serviceStartupLabel,
  serviceStateLabel,
  shortId,
  signatureLabel,
  sourceLabel,
  stateLabel,
  t,
  taskTriggerLabel,
  visibleServices,
  visibleTasks,
} from './model';
import type { StartupLocale, StartupServiceId } from './model';

export interface ServiceWorkspaceProps {
  service: StartupServiceId;
  locale: StartupLocale;
  controller: StartupController;
  entries: StartupEntry[];
  selectedEntry: StartupEntry | null;
  selectedIds: string[];
  onSelectEntry: (id: string) => void;
  onApplySelection: (ids: string[]) => void;
  onStagePlan: (ids: string[], mode: StartupPlan['mode'], delayMinutes?: number) => void;
  onClose: () => void;
  onNotice: (message: string) => void;
  onNavigateSection?: (section: string) => void;
}

interface SubPanelProps {
  title: string;
  sub?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

function SubPanel({ title, sub, children, right, className = '' }: SubPanelProps) {
  return (
    <section className={`stp-subpanel ${className}`}>
      <header className="stp-subpanel-head">
        <div>
          <h3>{title}</h3>
          {sub ? <p>{sub}</p> : null}
        </div>
        {right}
      </header>
      <div className="stp-subpanel-body">{children}</div>
    </section>
  );
}

function GateNote({ locale, children }: { locale: StartupLocale; children?: React.ReactNode }) {
  return (
    <div className="stp-gate-note stp-gate-note-block">
      <Lock className="w-3.5 h-3.5" />
      <span>
        {children || t(
          locale,
          'No write channel exists in Mission 09. This action produces an immutable review plan with execution.available:false.',
          'لا توجد قناة كتابة في المهمة 09. هذا الإجراء ينتج خطة مراجعة ثابتة مع execution.available:false.'
        )}
      </span>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  copy,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="stp-empty stp-empty-block">
      <div className="stp-empty-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{copy}</p>
      {children}
    </div>
  );
}

function StatTile({
  label,
  value,
  note,
  tone = 'cyan',
}: {
  label: string;
  value: string;
  note?: string;
  tone?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'muted';
}) {
  return (
    <div className={`stp-stat stp-stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <em>{note}</em> : null}
    </div>
  );
}

function EntryRow({
  entry,
  locale,
  active,
  onClick,
  right,
}: {
  entry: StartupEntry;
  locale: StartupLocale;
  active: boolean;
  onClick: () => void;
  right?: React.ReactNode;
}) {
  return (
    <button type="button" className={`stp-entry-row ${active ? 'is-active' : ''}`} onClick={onClick}>
      <span className="stp-entry-icon" style={{ color: SOURCE_META[entry.sourceKind].accent }}>
        <FileCode2 className="w-3.5 h-3.5" />
      </span>
      <span className="stp-entry-copy">
        <span className="stp-entry-name" title={entry.name}>{entry.name}</span>
        <span className="stp-entry-sub" title={entry.location}>{sourceLabel(entry.sourceKind, locale)} · {entry.location}</span>
      </span>
      <span className={`stp-badge stp-badge-${STATE_META[entry.state].tone}`}>
        <span className="stp-badge-dot" />
        {stateLabel(entry.state, locale)}
      </span>
      {right}
    </button>
  );
}

function EntryIdentity({ entry, locale }: { entry: StartupEntry; locale: StartupLocale }) {
  return (
    <div className="stp-entry-identity">
      <div className="stp-entry-identity-icon" style={{ borderColor: SOURCE_META[entry.sourceKind].accent }}>
        {entry.sourceKind === 'scheduled-task'
          ? <CalendarClock className="w-5 h-5" style={{ color: SOURCE_META[entry.sourceKind].accent }} />
          : <FileCode2 className="w-5 h-5" style={{ color: SOURCE_META[entry.sourceKind].accent }} />}
      </div>
      <div className="min-w-0">
        <div className="stp-entry-identity-name" title={entry.name}>{entry.name}</div>
        <div className="stp-entry-identity-sub">
          {sourceLabel(entry.sourceKind, locale)} · {scopeLabel(entry.scope, locale)} · {stateLabel(entry.state, locale)}
        </div>
      </div>
      {entry.protection === 'protected' ? (
        <span className="stp-chip stp-chip-bad"><Lock className="w-3 h-3" />{t(locale, 'Protected', 'محمي')}</span>
      ) : (
        <span className="stp-chip stp-chip-good">{t(locale, 'Standard', 'قياسي')}</span>
      )}
    </div>
  );
}

function EntryPicker({
  entries,
  locale,
  selectedIds,
  onToggle,
  maxHeight = 260,
  emptyCopy,
}: {
  entries: StartupEntry[];
  locale: StartupLocale;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  maxHeight?: number;
  emptyCopy?: string;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => filterEntries(entries, {
    query,
    source: 'all',
    scope: 'all',
    state: 'all',
    signature: 'all',
    prevention: 'all',
    sort: 'name',
  }), [entries, query]);

  return (
    <div className="stp-picker">
      <label className="stp-search stp-search-compact">
        <Search className="w-3.5 h-3.5" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(locale, 'Filter measured entries…', 'رشّح المداخل المقيسة…')}
          aria-label={t(locale, 'Filter entries', 'ترشيح المداخل')}
        />
      </label>
      <div className="stp-picker-list knx-custom-scrollbar" style={{ maxHeight }}>
        {filtered.map((entry) => {
          const checked = selectedIds.has(entry.id);
          return (
            <button
              key={entry.id}
              type="button"
              className={`stp-picker-row ${checked ? 'is-checked' : ''}`}
              onClick={() => onToggle(entry.id)}
              aria-pressed={checked}
            >
              <span className={`stp-picker-check ${checked ? 'is-on' : ''}`}>{checked ? <CheckCircle2 className="w-3 h-3" /> : null}</span>
              <span className="min-w-0">
                <span className="stp-picker-name" title={entry.name}>{entry.name}</span>
                <span className="stp-picker-sub">{sourceLabel(entry.sourceKind, locale)} · {stateLabel(entry.state, locale)}</span>
              </span>
              {entry.protection === 'protected' ? <Lock className="w-3 h-3 stp-icon-amber" /> : null}
            </button>
          );
        })}
        {!filtered.length ? (
          <div className="stp-picker-empty">
            {emptyCopy || t(locale, 'No measured entry matches the filter.', 'لا يوجد مدخل مقيس يطابق المرشح.')}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BootTimeline({ controller, locale }: { controller: StartupController; locale: StartupLocale }) {
  const events = controller.impact?.events || controller.inventory?.boot.events || [];
  if (!events.length) {
    return (
      <EmptyState
        icon={<Activity className="w-5 h-5" />}
        title={t(locale, 'No measured boot event', 'لا يوجد حدث إقلاع مقيس')}
        copy={t(
          locale,
          'Windows did not publish a Diagnostics-Performance event. No boot stage duration is inferred or drawn.',
          'لم ينشر Windows حدث Diagnostics-Performance. لا تُستنتج أي مدة لمراحل الإقلاع أو تُرسم.'
        )}
      />
    );
  }
  return (
    <div className="stp-boot-timeline" role="list">
      {events.map((event) => (
        <div key={event.id} role="listitem" className={`stp-boot-event is-${eventLevelTone(event.level)}`}>
          <div className="stp-boot-time">
            <strong>{formatTime(event.timeCreated, locale)}</strong>
            <span>{formatDate(event.timeCreated, locale)}</span>
          </div>
          <span className="stp-boot-node" />
          <div className="stp-boot-copy">
            <div className="stp-boot-title">
              {event.eventId ? `#${event.eventId}` : t(locale, 'Boot event', 'حدث إقلاع')} · {bootEventLabel(event.eventId, locale)}
              {event.level ? <span className="stp-chip stp-chip-muted">{event.level}</span> : null}
            </div>
            <div className="stp-boot-message" title={event.message || undefined}>{event.message || t(locale, 'No message text was published.', 'لم يُنشر نص الرسالة.')}</div>
            <div className="stp-boot-provider">{event.provider}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ServiceWorkspace({
  service,
  locale,
  controller,
  entries,
  selectedEntry,
  selectedIds,
  onSelectEntry,
  onApplySelection,
  onStagePlan,
  onClose,
  onNotice,
  onNavigateSection,
}: ServiceWorkspaceProps) {
  const capability = controller.capabilities?.services.find((item) => item.id === service);
  const fallback = SERVICE_FALLBACK_META[service];
  const title = capability ? (locale === 'ar' ? capability.labelAr : capability.labelEn) : (locale === 'ar' ? fallback.titleAr : fallback.titleEn);
  const description = capability ? (locale === 'ar' ? capability.noteAr : capability.noteEn) : (locale === 'ar' ? fallback.descAr : fallback.descEn);
  const serviceIndex = SERVICE_IDS.indexOf(service) + 1;
  const accent = SERVICE_ACCENTS[service];
  const inventory = controller.inventory;
  const summary = inventory?.summary;
  const services = inventory?.services || [];
  const tasks = inventory?.tasks || [];

  const [selectedId, setSelectedId] = useState<string | null>(selectedEntry?.id || entries[0]?.id || null);
  const [stageAcknowledged, setStageAcknowledged] = useState(false);
  const [sourceLane, setSourceLane] = useState<'all' | StartupEntry['sourceKind']>('all');
  const [disableMode, setDisableMode] = useState<'disable' | 'enable'>('disable');
  const [journalRange, setJournalRange] = useState('all');
  const [journalSource, setJournalSource] = useState('all');
  const [journalSelected, setJournalSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [publisherFilter, setPublisherFilter] = useState<'all' | StartupEntry['signature']>('all');
  const [keyboardIndex, setKeyboardIndex] = useState(0);
  const [impactWindow, setImpactWindow] = useState('all');
  const [impactLevel, setImpactLevel] = useState('all');
  const [impactSort, setImpactSort] = useState<'newest' | 'oldest'>('newest');
  const [impactSelected, setImpactSelected] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<'all' | StartupServiceEntry['startupType']>('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [taskState, setTaskState] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [batchIds, setBatchIds] = useState<Set<string>>(new Set(selectedIds.length ? selectedIds : selectedId ? [selectedId] : []));
  const [delayIds, setDelayIds] = useState<Set<string>>(new Set(selectedIds.length ? selectedIds : selectedId ? [selectedId] : []));
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const selected = useMemo(
    () => entries.find((entry) => entry.id === selectedId) || selectedEntry || null,
    [entries, selectedEntry, selectedId]
  );
  const selectedService = useMemo(
    () => services.find((item) => item.id === selectedServiceId) || services[0] || null,
    [selectedServiceId, services]
  );
  const selectedTask = useMemo(
    () => tasks.find((item) => item.id === selectedTaskId) || tasks[0] || null,
    [selectedTaskId, tasks]
  );

  useEffect(() => {
    if (service === 'startup-restore' || service === 'startup-journal') {
      if (!controller.journal) void controller.loadJournal();
    }
    if (service === 'startup-impact' && !controller.impact) void controller.loadImpact();
    if (service === 'startup-undo-all' && !controller.sessions) void controller.loadSessions();
    // Intentionally keyed to the opened service only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  const measuredEntries = useMemo(() => filterEntries(entries, {
    query,
    source: 'all',
    scope: 'all',
    state: 'all',
    signature: publisherFilter,
    prevention: 'all',
    sort: 'name',
  }), [entries, publisherFilter, query]);

  const impactEvents = useMemo(() => {
    const events = controller.impact?.events || [];
    const now = Date.now();
    const cutoff = impactWindow === '24h' ? now - 86400000
      : impactWindow === '7d' ? now - 7 * 86400000
        : impactWindow === '30d' ? now - 30 * 86400000
          : null;
    const filtered = events.filter((event) => {
      if (cutoff != null) {
        const time = event.timeCreated ? new Date(event.timeCreated).getTime() : Number.NaN;
        if (!Number.isFinite(time) || time < cutoff) return false;
      }
      if (impactLevel !== 'all' && eventLevelTone(event.level) !== impactLevel) return false;
      return true;
    });
    return [...filtered].sort((left, right) => {
      const leftTime = left.timeCreated ? new Date(left.timeCreated).getTime() : 0;
      const rightTime = right.timeCreated ? new Date(right.timeCreated).getTime() : 0;
      return impactSort === 'newest' ? rightTime - leftTime : leftTime - rightTime;
    });
  }, [controller.impact, impactLevel, impactSort, impactWindow]);

  const selectedImpact = impactEvents.find((event) => event.id === impactSelected) || impactEvents[0] || null;
  const filteredServices = useMemo(
    () => visibleServices(services, query).filter((item) => serviceType === 'all' || item.startupType === serviceType),
    [query, serviceType, services]
  );
  const filteredTasks = useMemo(
    () => visibleTasks(tasks, query).filter((task) => taskState === 'all' || (taskState === 'disabled' ? task.state.toLowerCase() === 'disabled' : task.state.toLowerCase() !== 'disabled')),
    [query, taskState, tasks]
  );
  const keyboardResults = useMemo(() => {
    const filter = {
      query,
      source: sourceLane,
      scope: 'all' as const,
      state: 'all' as const,
      signature: publisherFilter,
      prevention: 'all' as const,
      sort: 'name' as const,
    };
    return filterEntries(entries, filter);
  }, [entries, publisherFilter, query, sourceLane]);
  const keyboardSelected = keyboardResults[Math.min(keyboardIndex, Math.max(0, keyboardResults.length - 1))] || null;

  const delayConflicts = useMemo(() => {
    return entries
      .filter((entry) => delayIds.has(entry.id))
      .map((entry) => {
        const conflicts: string[] = [];
        if (entry.protection === 'protected') conflicts.push(entry.protectionReason || 'Protected Windows component.');
        if (entry.elevationRequired) conflicts.push('Requires administrator context for a machine-scope change.');
        if (entry.sourceKind !== 'scheduled-task') conflicts.push('This source has no in-place delay semantics; a launcher shim is not supported.');
        return { entry, conflicts };
      });
  }, [delayIds, entries]);

  const batchEntries = useMemo(() => entries.filter((entry) => batchIds.has(entry.id)), [batchIds, entries]);
  const batchSources = useMemo(() => [...new Set(batchEntries.map((entry) => entry.sourceKind))], [batchEntries]);
  const batchElevation = batchEntries.filter((entry) => entry.elevationRequired).length;
  const batchProtected = batchEntries.filter((entry) => entry.protection === 'protected').length;

  const toggleSet = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  const stageSingle = (mode: 'disable' | 'enable' | 'delay') => {
    if (!selected) return;
    onStagePlan([selected.id], mode);
  };

  const copyJson = async (label: string, value: unknown) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
      onNotice(t(locale, `${label} copied to the clipboard.`, `نُسخ ${label} إلى الحافظة.`));
    } catch {
      onNotice(t(locale, 'The clipboard is unavailable; nothing was copied.', 'الحافظة غير متاحة؛ لم يُنسخ شيء.'));
    }
  };

  const renderOverview = () => (
    <div className="stp-svc-stack">
      <div className="stp-svc-stats">
        <StatTile label={t(locale, 'Registry autoruns', 'مداخل التسجيل')} value={formatCount(summary?.registry)} note={t(locale, 'HKCU + HKLM', 'HKCU + HKLM')} />
        <StatTile label={t(locale, 'Startup folders', 'مجلدات البدء')} value={formatCount(summary?.folders)} note={t(locale, 'User + all users', 'المستخدم + كل المستخدمين')} tone="violet" />
        <StatTile label={t(locale, 'Logon tasks', 'مهام الدخول')} value={formatCount(summary?.tasks)} note={t(locale, 'At logon / at boot', 'عند الدخول / الإقلاع')} tone="amber" />
        <StatTile label={t(locale, 'Protected entries', 'مداخل محمية')} value={formatCount(summary?.protectedCount)} note={t(locale, 'Blocked from staging', 'محجوبة عن التهيئة')} tone="rose" />
      </div>

      <div className="stp-svc-split">
        <SubPanel
          title={t(locale, 'Measured boot evidence', 'أدلة الإقلاع المقيسة')}
          sub={t(locale, 'Only Windows Diagnostics-Performance events are shown', 'تُعرض أحداث Windows Diagnostics-Performance فقط')}
          right={<span className="stp-chip stp-chip-muted">{formatCount(controller.impact?.events.length ?? inventory?.boot.eventCount ?? 0)} {t(locale, 'events', 'حدث')}</span>}
        >
          <BootTimeline controller={controller} locale={locale} />
        </SubPanel>

        <SubPanel
          title={t(locale, 'Source coverage', 'تغطية المصادر')}
          sub={t(locale, 'Exactly what the read-only scan could read', 'ما استطاع الفحص للقراءة فقط قراءته بدقة')}
        >
          <div className="stp-source-lanes">
            {ENTRY_SOURCES.map((source) => {
              const count = entries.filter((entry) => entry.sourceKind === source).length;
              const protectedCount = entries.filter((entry) => entry.sourceKind === source && entry.protection === 'protected').length;
              return (
                <button
                  key={source}
                  type="button"
                  className={`stp-source-lane ${sourceLane === source ? 'is-active' : ''}`}
                  onClick={() => setSourceLane(sourceLane === source ? 'all' : source)}
                  style={{ '--stp-source': SOURCE_META[source].accent } as React.CSSProperties}
                >
                  <span className="stp-source-lane-icon"><FolderTree className="w-4 h-4" /></span>
                  <span className="min-w-0">
                    <strong>{sourceLabel(source, locale)}</strong>
                    <em>{formatCount(count)} {t(locale, 'measured', 'مقيس')} · {formatCount(protectedCount)} {t(locale, 'protected', 'محمي')}</em>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
          <div className="stp-kv-list stp-kv-compact">
            <div><span>{t(locale, 'Registry keys read', 'مفاتيح التسجيل المقروءة')}</span><code>{formatCount(inventory?.coverage.registryKeys)}</code></div>
            <div><span>{t(locale, 'Startup folders read', 'مجلدات البدء المقروءة')}</span><code>{formatCount(inventory?.coverage.startupFolders)}</code></div>
            <div><span>{t(locale, 'Services measured', 'الخدمات المقيسة')}</span><code>{formatCount(inventory?.coverage.servicesMeasured)}</code></div>
          </div>
        </SubPanel>
      </div>

      <SubPanel
        title={t(locale, 'Dense autorun register', 'سجل بدء كثيف')}
        sub={t(locale, 'Select a row to inspect it in the register inspector', 'حدد صفًا لفحصه في مفتش السجل')}
        right={<span className="stp-chip stp-chip-muted">{formatCount(entries.length)} {t(locale, 'entries', 'مدخل')}</span>}
      >
        <div className="stp-mini-table-wrap knx-custom-scrollbar">
          <table className="stp-mini-table">
            <thead>
              <tr>
                <th>{t(locale, 'Entry', 'المدخل')}</th>
                <th>{t(locale, 'Source', 'المصدر')}</th>
                <th>{t(locale, 'Signature', 'التوقيع')}</th>
                <th>{t(locale, 'State', 'الحالة')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 40).map((entry) => (
                <tr key={entry.id} className={entry.id === selected?.id ? 'is-selected' : ''} onClick={() => setSelectedId(entry.id)}>
                  <td><span className="stp-row-name" title={entry.name}>{entry.name}</span><span className="stp-row-sub">{entry.publisher || t(locale, 'Publisher not measured', 'لم يُقس الناشر')}</span></td>
                  <td>{sourceLabel(entry.sourceKind, locale)}</td>
                  <td>{signatureLabel(entry.signature, locale)}</td>
                  <td><span className={`stp-badge stp-badge-${STATE_META[entry.state].tone}`}><span className="stp-badge-dot" />{stateLabel(entry.state, locale)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SubPanel>
    </div>
  );

  const renderDisable = () => {
    const target = selected;
    if (!target) {
      return <EmptyState icon={<ShieldAlert className="w-5 h-5" />} title={t(locale, 'Select a measured autorun', 'حدد مدخل بدء مقيسًا')} copy={t(locale, 'The preview is bound to a measured entry; no fixture is substituted.', 'المعاينة مرتبطة بمدخل مقيس؛ لا يُستبدل أي شيء.')} />;
    }
    const protectedTarget = target.protection === 'protected' || target.protectionReason;
    const conflicts = [
      protectedTarget ? target.protectionReason || 'Protected Windows component.' : null,
      target.elevationRequired ? 'Requires administrator context for a machine-scope change.' : null,
    ].filter(Boolean) as string[];
    return (
      <div className="stp-svc-stack">
        <div className="stp-svc-split">
          <SubPanel title={t(locale, 'Selected startup card', 'بطاقة البدء المحددة')} sub={t(locale, 'Measured source and state', 'المصدر والحالة المقيسة')}>
            <EntryIdentity entry={target} locale={locale} />
            <div className="stp-review-flow">
              <div className="stp-review-node">
                <span>{t(locale, 'Current state', 'الحالة الحالية')}</span>
                <strong className={target.state === 'enabled' ? 'stp-tone-good' : 'stp-tone-bad'}>{stateLabel(target.state, locale)}</strong>
                <em>{sourceLabel(target.sourceKind, locale)}</em>
              </div>
              <span className="stp-review-arrow"><ArrowRight className="w-4 h-4" /></span>
              <div className="stp-review-node is-proposed">
                <span>{t(locale, 'Proposed state', 'الحالة المقترحة')}</span>
                <strong className={disableMode === 'disable' ? 'stp-tone-bad' : 'stp-tone-good'}>
                  {disableMode === 'disable' ? t(locale, 'Disabled', 'معطّل') : t(locale, 'Enabled', 'مفعّل')}
                </strong>
                <em>{t(locale, 'Preview only', 'معاينة فقط')}</em>
              </div>
            </div>
            <div className="stp-seg stp-seg-wide" role="group" aria-label={t(locale, 'Change mode', 'وضع التغيير')}>
              <button type="button" className={disableMode === 'disable' ? 'is-active' : ''} onClick={() => setDisableMode('disable')}>{t(locale, 'Disable entry', 'تعطيل المدخل')}</button>
              <button type="button" className={disableMode === 'enable' ? 'is-active' : ''} onClick={() => setDisableMode('enable')}>{t(locale, 'Enable entry', 'تفعيل المدخل')}</button>
            </div>
            <div className="stp-command-block">
              <span>{t(locale, 'Measured command', 'الأمر المقيس')}</span>
              <code>{target.command || t(locale, 'No command published', 'لم يُنشر أمر')}</code>
            </div>
          </SubPanel>

          <SubPanel title={t(locale, 'Before / after review', 'مراجعة قبل / بعد')} sub={t(locale, 'Impact is not invented for a plan', 'لا يُختلق الأثر للخطة')}>
            <div className="stp-diff-grid">
              <div><span>{t(locale, 'Before', 'قبل')}</span><strong>{target.state}</strong><em>{target.approvedState === 'unknown' ? t(locale, 'No StartupApproved value', 'لا قيمة StartupApproved') : `StartupApproved: ${target.approvedState}`}</em></div>
              <div><span>{t(locale, 'After (preview)', 'بعد (معاينة)')}</span><strong>{disableMode === 'disable' ? 'disabled' : 'enabled'}</strong><em>{t(locale, 'Not written', 'لم يُكتب')}</em></div>
              <div><span>{t(locale, 'Measured boot delay', 'تأخير الإقلاع المقيس')}</span><strong>{t(locale, 'Not published', 'غير منشور')}</strong><em>{t(locale, 'No per-entry value from Windows', 'لا قيمة لكل مدخل من Windows')}</em></div>
              <div><span>{t(locale, 'Estimated boot saving', 'توفير الإقلاع المقدر')}</span><strong className="stp-tone-muted">{t(locale, 'Not claimed', 'غير مُدّعى')}</strong><em>{t(locale, 'mission constraint', 'قيد المهمة')}</em></div>
            </div>
            <div className="stp-check-list">
              <div className={protectedTarget ? 'is-bad' : 'is-good'}>
                {protectedTarget ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{t(locale, 'Protected system component check', 'فحص مكوّن النظام المحمي')}: {protectedTarget ? t(locale, 'Blocked', 'محجوب') : t(locale, 'Passed', 'ناجح')}</span>
              </div>
              <div className={target.elevationRequired ? 'is-warn' : 'is-good'}>
                {target.elevationRequired ? <KeyRound className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{t(locale, 'Elevation requirement', 'متطلب رفع الصلاحيات')}: {target.elevationRequired ? t(locale, 'Administrator context', 'سياق مسؤول') : t(locale, 'Not required', 'غير مطلوب')}</span>
              </div>
              <div className="is-warn"><Lock className="w-3.5 h-3.5" /><span>{t(locale, 'Immutable plan and explicit approval are required before any write.', 'الخطة الثابتة والموافقة الصريحة مطلوبتان قبل أي كتابة.')}</span></div>
            </div>
            {conflicts.length ? (
              <div className="stp-warning">
                <AlertTriangle className="w-4 h-4" />
                <div><strong>{t(locale, 'Review conflicts', 'تعارضات المراجعة')}</strong><ul>{conflicts.map((conflict) => <li key={conflict}>{conflict}</li>)}</ul></div>
              </div>
            ) : null}
          </SubPanel>
        </div>

        <SubPanel title={t(locale, 'Staged review dock', 'رصيف المراجعة المُهيَّأة')} sub={t(locale, 'Nothing is executed; the plan is immutable', 'لا يُنفَّذ شيء؛ الخطة ثابتة')}>
          <div className="stp-dock">
            <div className="stp-dock-copy">
              <strong>{t(locale, 'Acknowledge the review warning', 'أقرّ بتحذير المراجعة')}</strong>
              <p>{t(locale, 'The system does not verify a postcondition because no mutation channel exists in Mission 09.', 'لا يتحقق النظام من نتيجة لاحقة لأنه لا توجد قناة تغيير في المهمة 09.')}</p>
            </div>
            <label className="stp-checkbox">
              <input type="checkbox" checked={stageAcknowledged} onChange={(event) => setStageAcknowledged(event.target.checked)} />
              <span>{t(locale, 'I understand this stages a review only', 'أفهم أن هذا يهيّئ مراجعة فقط')}</span>
            </label>
            <button
              type="button"
              className="stp-btn stp-btn-primary"
              disabled={!stageAcknowledged || Boolean(protectedTarget) || controller.busy === 'plan'}
              onClick={() => onStagePlan([target.id], disableMode)}
            >
              <Lock className="w-3.5 h-3.5" />
              {t(locale, 'Stage immutable review', 'تهيئة مراجعة ثابتة')}
            </button>
          </div>
          <GateNote locale={locale} />
        </SubPanel>
        {controller.plan ? (
          <div className="stp-plan-inline">
            <div><strong>{t(locale, 'Plan staged', 'خُطت الخطة')}</strong><span>{planModeLabel(controller.plan.mode, locale)} · {formatCount(controller.plan.itemCount)} {t(locale, 'item(s)', 'عنصر')}</span></div>
            <button type="button" className="stp-link" onClick={() => onNotice(t(locale, 'Use the plan gate to inspect the immutable review.', 'استخدم بوابة الخطة لفحص المراجعة الثابتة.'))}>{t(locale, 'Review in plan gate', 'مراجعة في بوابة الخطة')}<ChevronRight className="w-3 h-3" /></button>
          </div>
        ) : null}
      </div>
    );
  };

  const renderRestore = () => {
    const journal = controller.journal;
    return (
      <div className="stp-svc-stack">
        <div className="stp-svc-banner is-gated">
          <Lock className="w-4 h-4" />
          <div>
            <strong>{t(locale, 'Restoration is gated', 'الاستعادة محجوبة')}</strong>
            <p>{journal?.execution.reason || t(locale, 'No startup change was executed, so the journal is empty.', 'لم يُنفَّذ أي تغيير في بدء التشغيل، لذا السجل فارغ.')}</p>
          </div>
          <span className="stp-chip stp-chip-bad">{t(locale, 'BLOCKED', 'محجوب')}</span>
        </div>
        <div className="stp-svc-split">
          <SubPanel
            title={t(locale, 'Journal timeline', 'الخط الزمني للسجل')}
            sub={t(locale, 'Append-only entries, newest first', 'مداخل إضافية فقط، الأحدث أولًا')}
            right={<button type="button" className="stp-btn stp-btn-quiet" onClick={() => void controller.loadJournal()}><RefreshCw className="w-3 h-3" />{t(locale, 'Read journal', 'قراءة السجل')}</button>}
          >
            {journal?.entries.length ? (
              <div className="stp-journal-list">
                {journal.entries.map((entry: { id: string; at?: string; action?: string; entryName?: string; before?: string; after?: string }) => (
                  <div key={entry.id} className="stp-journal-row">
                    <span className="stp-journal-time">{formatTimestamp(entry.at, locale)}</span>
                    <div><strong>{entry.entryName || entry.id}</strong><em>{entry.action || '—'}</em></div>
                    <span>{entry.before || '—'} → {entry.after || '—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<RotateCcw className="w-5 h-5" />}
                title={t(locale, 'No restoration entry', 'لا يوجد مدخل استعادة')}
                copy={journal?.reason || t(locale, 'The journal has no entry because no startup value was changed.', 'لا يحتوي السجل على أي مدخل لأن أي قيمة بدء لم تتغير.')}
              />
            )}
          </SubPanel>
          <SubPanel title={t(locale, 'Original / current value', 'القيمة الأصلية / الحالية')} sub={t(locale, 'Bound to an eligible journal entry', 'مرتبط بمدخل سجل مؤهل')}>
            <div className="stp-kv-list">
              <div><span>{t(locale, 'Selected journal entry', 'مدخل السجل المحدد')}</span><code>{journalSelected || t(locale, 'None', 'لا شيء')}</code></div>
              <div><span>{t(locale, 'Original registry value', 'قيمة التسجيل الأصلية')}</span><code>{t(locale, 'Not journaled', 'غير مسجل')}</code></div>
              <div><span>{t(locale, 'Current registry value', 'قيمة التسجيل الحالية')}</span><code>{t(locale, 'Not changed', 'لم تتغير')}</code></div>
              <div><span>{t(locale, 'Restoration eligibility', 'أهلية الاستعادة')}</span><code>{t(locale, 'No eligible entry', 'لا مدخل مؤهل')}</code></div>
            </div>
            <div className="stp-dock-actions">
              <button type="button" className="stp-btn stp-btn-ghost" disabled>{t(locale, 'Choose eligible entry', 'اختيار مدخل مؤهل')}</button>
              <button type="button" className="stp-btn stp-btn-ghost" disabled>{t(locale, 'Preview registry conflict', 'معاينة تعارض التسجيل')}</button>
              <button type="button" className="stp-btn stp-btn-primary" disabled>{t(locale, 'Stage restore draft', 'تهيئة مسودة استعادة')}</button>
            </div>
            <GateNote locale={locale}>{t(locale, 'Restoration requires a prior immutable change, verified original values/ACL and a journal entry. None exists.', 'الاستعادة تتطلب تغييرًا ثابتًا سابقًا وقيمًا أصلية وأذونات متحققًا منها ومدخل سجل. لا يوجد أي منها.')}</GateNote>
          </SubPanel>
        </div>
      </div>
    );
  };

  const renderSources = () => {
    const lanes = ENTRY_SOURCES.map((source) => {
      const sourceEntries = entries.filter((entry) => entry.sourceKind === source);
      return {
        source,
        entries: sourceEntries,
        user: sourceEntries.filter((entry) => entry.scope === 'user').length,
        machine: sourceEntries.filter((entry) => entry.scope === 'machine').length,
        protectedCount: sourceEntries.filter((entry) => entry.protection === 'protected').length,
      };
    });
    const activeLane = sourceLane === 'all' ? null : lanes.find((lane) => lane.source === sourceLane) || null;
    return (
      <div className="stp-svc-stack">
        <div className="stp-svc-stats">
          <StatTile label={t(locale, 'Registry keys', 'مفاتيح التسجيل')} value={formatCount(inventory?.coverage.registryKeys)} note={t(locale, 'Allowlisted Run/RunOnce + StartupApproved', 'Run/RunOnce وStartupApproved المسموح بها')} />
          <StatTile label={t(locale, 'Startup folders', 'مجلدات البدء')} value={formatCount(inventory?.coverage.startupFolders)} note="%APPDATA% + %ProgramData%" tone="violet" />
          <StatTile label={t(locale, 'Scheduled tasks', 'المهام المجدولة')} value={formatCount(inventory?.coverage.scheduledTasks)} note={t(locale, 'Logon and boot triggers', 'محفزات الدخول والإقلاع')} tone="amber" />
          <StatTile label={t(locale, 'Services measured', 'الخدمات المقيسة')} value={formatCount(inventory?.coverage.servicesMeasured)} note={t(locale, 'Automatic + delayed-auto', 'تلقائي + مؤجل')} tone="emerald" />
        </div>

        <div className="stp-swimlanes">
          {lanes.map((lane) => (
            <button
              key={lane.source}
              type="button"
              className={`stp-swimlane ${sourceLane === lane.source ? 'is-active' : ''}`}
              onClick={() => setSourceLane(sourceLane === lane.source ? 'all' : lane.source)}
              style={{ '--stp-source': SOURCE_META[lane.source].accent } as React.CSSProperties}
            >
              <span className="stp-swimlane-title"><FolderTree className="w-3.5 h-3.5" />{sourceLabel(lane.source, locale)}</span>
              <span className="stp-swimlane-track">
                <span className="stp-swimlane-bar is-user" style={{ width: `${lane.entries.length ? Math.max(8, (lane.user / lane.entries.length) * 100) : 0}%` }} />
                <span className="stp-swimlane-bar is-machine" style={{ width: `${lane.entries.length ? Math.max(8, (lane.machine / lane.entries.length) * 100) : 0}%` }} />
              </span>
              <span className="stp-swimlane-meta">
                <strong>{formatCount(lane.entries.length)}</strong>
                <span>{t(locale, 'measured', 'مقيس')} · {formatCount(lane.protectedCount)} {t(locale, 'protected', 'محمي')}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="stp-svc-split">
          <SubPanel
            title={activeLane ? sourceLabel(activeLane.source, locale) : t(locale, 'Coverage evidence', 'أدلة التغطية')}
            sub={activeLane ? t(locale, 'Every measured row in this lane', 'كل صف مقيس في هذا المسار') : t(locale, 'Select a swimlane to inspect its rows', 'حدد مسارًا لفحص صفوفه')}
          >
            {activeLane ? (
              <div className="stp-picker-list knx-custom-scrollbar" style={{ maxHeight: 280 }}>
                {activeLane.entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} locale={locale} active={entry.id === selected?.id} onClick={() => setSelectedId(entry.id)} />
                ))}
                {!activeLane.entries.length ? <div className="stp-picker-empty">{t(locale, 'No measured entry in this source.', 'لا يوجد مدخل مقيس في هذا المصدر.')}</div> : null}
              </div>
            ) : (
              <div className="stp-kv-list">
                <div><span>{t(locale, 'HKCU Run & RunOnce', 'HKCU Run وRunOnce')}</span><code>{formatCount(entries.filter((entry) => entry.sourceKind.startsWith('registry') && entry.scope === 'user').length)} {t(locale, 'entries', 'مدخل')}</code></div>
                <div><span>{t(locale, 'HKLM Run, RunOnce & 32-bit', 'HKLM Run وRunOnce و32-bit')}</span><code>{formatCount(entries.filter((entry) => entry.sourceKind.startsWith('registry') && entry.scope === 'machine').length)} {t(locale, 'entries', 'مدخل')}</code></div>
                <div><span>{t(locale, 'Startup Folder (%APPDATA%)', 'مجلد البدء (%APPDATA%)')}</span><code>{formatCount(entries.filter((entry) => entry.sourceKind === 'startup-folder' && entry.scope === 'user').length)} {t(locale, 'entries', 'مدخل')}</code></div>
                <div><span>{t(locale, 'Common Startup (%ProgramData%)', 'البدء المشترك (%ProgramData%)')}</span><code>{formatCount(entries.filter((entry) => entry.sourceKind === 'startup-folder' && entry.scope === 'machine').length)} {t(locale, 'entries', 'مدخل')}</code></div>
                <div><span>{t(locale, 'Scheduled tasks & services', 'المهام والخدمات')}</span><code>{formatCount(tasks.length)} + {formatCount(services.length)}</code></div>
              </div>
            )}
          </SubPanel>

          <SubPanel title={t(locale, 'Selected evidence', 'الدليل المحدد')} sub={t(locale, 'Detail bound to the selected row', 'تفصيل مرتبط بالصف المحدد')} right={<span className="stp-chip stp-chip-muted">{selected ? shortId(selected.id) : '—'}</span>}>
            {selected ? (
              <>
                <EntryIdentity entry={selected} locale={locale} />
                <div className="stp-kv-list">
                  <div><span>{t(locale, 'Location', 'الموقع')}</span><code title={selected.location}>{selected.location}</code></div>
                  <div><span>{t(locale, 'Signature', 'التوقيع')}</span><code>{signatureLabel(selected.signature, locale)}</code></div>
                  <div><span>{t(locale, 'Protection', 'الحماية')}</span><code>{protectionLabel(selected.protection, locale)}</code></div>
                  <div><span>{t(locale, 'Executable', 'الملف التنفيذي')}</span><code title={selected.executable || undefined}>{selected.executable || '—'}</code></div>
                </div>
              </>
            ) : <div className="stp-picker-empty">{t(locale, 'Select a measured row.', 'حدد صفًا مقيسًا.')}</div>}
          </SubPanel>
        </div>
      </div>
    );
  };

  const renderJournal = () => {
    const journal = controller.journal;
    return (
      <div className="stp-svc-stack">
        <div className="stp-svc-banner is-gated">
          <FileCheck2 className="w-4 h-4" />
          <div>
            <strong>{t(locale, 'The append-only startup journal is empty', 'سجل بدء التشغيل الإضافي فارغ')}</strong>
            <p>{journal?.reason || t(locale, 'No startup change was executed in this delivery.', 'لم يُنفَّذ أي تغيير في بدء التشغيل في هذا التسليم.')}</p>
          </div>
          <span className="stp-chip stp-chip-muted">{t(locale, '0 events', '0 حدث')}</span>
        </div>

        <div className="stp-filter-row">
          <label className="stp-search">
            <CalendarClock className="w-3.5 h-3.5" />
            <select value={journalRange} onChange={(event) => setJournalRange(event.target.value)} aria-label={t(locale, 'Date range', 'نطاق التاريخ')}>
              <option value="all">{t(locale, 'All dates', 'كل التواريخ')}</option>
              <option value="7d">{t(locale, 'Last 7 days', 'آخر 7 أيام')}</option>
              <option value="30d">{t(locale, 'Last 30 days', 'آخر 30 يومًا')}</option>
              <option value="90d">{t(locale, 'Last 90 days', 'آخر 90 يومًا')}</option>
            </select>
          </label>
          <label className="stp-search">
            <FolderTree className="w-3.5 h-3.5" />
            <select value={journalSource} onChange={(event) => setJournalSource(event.target.value)} aria-label={t(locale, 'Source location', 'موقع المصدر')}>
              <option value="all">{t(locale, 'All source locations', 'كل مواقع المصدر')}</option>
              <option value="registry">{t(locale, 'Registry', 'التسجيل')}</option>
              <option value="folder">{t(locale, 'Startup folder', 'مجلد البدء')}</option>
              <option value="task">{t(locale, 'Scheduled task', 'مهمة مجدولة')}</option>
            </select>
          </label>
          <button type="button" className="stp-btn stp-btn-ghost" onClick={() => void copyJson(t(locale, 'Audit log', 'سجل التدقيق'), journal || {})}>
            <ClipboardCopy className="w-3.5 h-3.5" />
            {t(locale, 'Export audit log', 'تصدير سجل التدقيق')}
          </button>
        </div>

        <div className="stp-svc-split">
          <SubPanel title={t(locale, 'Chronological events', 'الأحداث الزمنية')} sub={t(locale, 'Before/after chips and undo eligibility', 'شرائح قبل/بعد وأهلية التراجع')}>
            <EmptyState
              icon={<FileCheck2 className="w-5 h-5" />}
              title={t(locale, 'No audit event', 'لا يوجد حدث تدقيق')}
              copy={t(locale, 'Filters are active but the journal is empty. No event is fabricated to fill the table.', 'المرشحات نشطة لكن السجل فارغ. لا يُختلق أي حدث لملء الجدول.')}
            />
          </SubPanel>
          <SubPanel title={t(locale, 'Audit event details', 'تفاصيل حدث التدقيق')} sub={t(locale, 'Bound to the selected event row', 'مرتبط بصف الحدث المحدد')}>
            <div className="stp-kv-list">
              <div><span>{t(locale, 'Audit event ID', 'معرف حدث التدقيق')}</span><code>{journalSelected || '—'}</code></div>
              <div><span>{t(locale, 'Action type', 'نوع الإجراء')}</span><code>{t(locale, 'No enable / disable / delay event', 'لا حدث تفعيل / تعطيل / تأخير')}</code></div>
              <div><span>{t(locale, 'Before → after', 'قبل → بعد')}</span><code>— → —</code></div>
              <div><span>{t(locale, 'Eligibility rating', 'تقييم الأهلية')}</span><code>{t(locale, 'Not eligible', 'غير مؤهل')}</code></div>
            </div>
            <GateNote locale={locale}>{t(locale, 'Only an approved executor may append a journal entry. No write channel exists.', 'فقط منفذ معتمد يمكنه إضافة مدخل للسجل. لا توجد قناة كتابة.')}</GateNote>
          </SubPanel>
        </div>
      </div>
    );
  };

  const renderFilter = () => (
    <div className="stp-svc-stack">
      <div className="stp-query-console">
        <label className="stp-query">
          <Search className="w-5 h-5" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setKeyboardIndex(0); }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setKeyboardIndex((index) => Math.min(keyboardResults.length - 1, index + 1));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setKeyboardIndex((index) => Math.max(0, index - 1));
              } else if (event.key === 'Enter' && keyboardSelected) {
                event.preventDefault();
                setSelectedId(keyboardSelected.id);
                onSelectEntry(keyboardSelected.id);
              }
            }}
            placeholder={t(locale, 'Type a name, publisher, path, trigger… then use ↑ ↓ Enter', 'اكتب اسمًا أو ناشرًا أو مسارًا أو محفزًا… ثم استخدم ↑ ↓ Enter')}
            aria-label={t(locale, 'Keyboard autorun query', 'استعلام بدء التشغيل بلوحة المفاتيح')}
          />
          <span className="stp-query-hint">↑↓ · Enter</span>
        </label>
        <div className="stp-query-facets">
          <button type="button" className={sourceLane === 'all' ? 'is-active' : ''} onClick={() => setSourceLane('all')}>{t(locale, 'All sources', 'كل المصادر')}</button>
          {ENTRY_SOURCES.map((source) => (
            <button key={source} type="button" className={sourceLane === source ? 'is-active' : ''} onClick={() => setSourceLane(source)}>{sourceLabel(source, locale)}</button>
          ))}
        </div>
        <div className="stp-query-facets">
          <span className="stp-facet-label">{t(locale, 'Publisher verification', 'تحقق الناشر')}</span>
          {(['all', 'valid', 'untrusted', 'unsigned', 'unavailable'] as const).map((signature) => (
            <button key={signature} type="button" className={publisherFilter === signature ? 'is-active' : ''} onClick={() => setPublisherFilter(signature)}>
              {signature === 'all' ? t(locale, 'Any', 'الكل') : signatureLabel(signature, locale)}
            </button>
          ))}
        </div>
        <div className="stp-query-stats">
          <StatTile label={t(locale, 'Matched autoruns', 'مداخل مطابقة')} value={formatCount(keyboardResults.length)} note={`${t(locale, 'of', 'من')} ${formatCount(entries.length)}`} />
          <StatTile label={t(locale, 'Execution path summary', 'ملخص مسار التنفيذ')} value={keyboardSelected ? (keyboardSelected.executable ? t(locale, 'Resolved', 'محلول') : t(locale, 'Unresolved', 'غير محلول')) : '—'} note={keyboardSelected?.executable || t(locale, 'Select a result', 'حدد نتيجة')} tone="violet" />
          <StatTile label={t(locale, 'Protected in results', 'محمي في النتائج')} value={formatCount(keyboardResults.filter((entry) => entry.protection === 'protected').length)} note={t(locale, 'staging blocked', 'التهيئة محجوبة')} tone="rose" />
        </div>
      </div>

      <div className="stp-svc-split">
        <SubPanel title={t(locale, 'Keyboard-first results', 'نتائج لوحة المفاتيح')} sub={t(locale, 'Arrow keys move focus; Enter selects', 'الأسهم تنقل التركيز؛ Enter يحدد')}>
          <div className="stp-picker-list knx-custom-scrollbar" style={{ maxHeight: 330 }}>
            {keyboardResults.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                className={`stp-picker-row ${index === keyboardIndex ? 'is-focused' : ''} ${entry.id === selected?.id ? 'is-checked' : ''}`}
                onClick={() => { setKeyboardIndex(index); setSelectedId(entry.id); onSelectEntry(entry.id); }}
              >
                <span className={`stp-picker-check ${entry.id === selected?.id ? 'is-on' : ''}`}>{entry.id === selected?.id ? <CheckCircle2 className="w-3 h-3" /> : null}</span>
                <span className="min-w-0">
                  <span className="stp-picker-name" title={entry.name}>{entry.name}</span>
                  <span className="stp-picker-sub">{sourceLabel(entry.sourceKind, locale)} · {signatureLabel(entry.signature, locale)}</span>
                </span>
                <span className="stp-picker-path" title={entry.executable || entry.location}>{entry.executable || entry.location}</span>
              </button>
            ))}
            {!keyboardResults.length ? <div className="stp-picker-empty">{t(locale, 'No measured autorun matches this query.', 'لا يوجد مدخل بدء مقيس يطابق هذا الاستعلام.')}</div> : null}
          </div>
        </SubPanel>
        <SubPanel title={t(locale, 'Quick inspection', 'فحص سريع')} sub={t(locale, 'The selected result, not a generic card', 'النتيجة المحددة، وليس بطاقة عامة')}>
          {keyboardSelected ? (
            <>
              <EntryIdentity entry={keyboardSelected} locale={locale} />
              <div className="stp-kv-list">
                <div><span>{t(locale, 'Source', 'المصدر')}</span><code>{sourceLabel(keyboardSelected.sourceKind, locale)}</code></div>
                <div><span>{t(locale, 'Signature', 'التوقيع')}</span><code>{signatureLabel(keyboardSelected.signature, locale)}</code></div>
                <div><span>{t(locale, 'Command', 'الأمر')}</span><code title={keyboardSelected.command || undefined}>{keyboardSelected.command || '—'}</code></div>
                <div><span>{t(locale, 'Protection', 'الحماية')}</span><code>{protectionLabel(keyboardSelected.protection, locale)}</code></div>
              </div>
              <button type="button" className="stp-btn stp-btn-ghost" onClick={() => setSelectedId(keyboardSelected.id)}>
                {t(locale, 'Inspect in register', 'فحص في السجل')}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : <div className="stp-picker-empty">{t(locale, 'Type a query to inspect measured entries.', 'اكتب استعلامًا لفحص المداخل المقيسة.')}</div>}
        </SubPanel>
      </div>
    </div>
  );

  const renderImpact = () => {
    const impact = controller.impact;
    return (
      <div className="stp-svc-stack">
        <div className="stp-svc-stats">
          <StatTile label={t(locale, 'Measured events', 'الأحداث المقيسة')} value={formatCount(impact?.events.length)} note={t(locale, 'Diagnostics-Performance', 'Diagnostics-Performance')} />
          <StatTile label={t(locale, 'Attributed entries', 'المداخل المنسوبة')} value={formatCount(impact?.attributed.length)} note={t(locale, 'Name evidence only', 'دليل الاسم فقط')} tone="violet" />
          <StatTile label={t(locale, 'Last boot', 'آخر إقلاع')} value={impact?.lastBootAt ? formatDate(impact.lastBootAt, locale) : '—'} note={formatTime(impact?.lastBootAt, locale)} tone="amber" />
          <StatTile label={t(locale, 'Measured uptime', 'مدة التشغيل')} value={formatCount(impact?.uptimeSeconds)} note={t(locale, 'seconds', 'ثانية')} tone="emerald" />
        </div>

        <div className="stp-filter-row">
          <select className="stp-select" value={impactWindow} onChange={(event) => setImpactWindow(event.target.value)} aria-label={t(locale, 'Time window', 'نافذة الوقت')}>
            <option value="all">{t(locale, 'All measured time', 'كل الوقت المقيس')}</option>
            <option value="24h">{t(locale, 'Last 24 hours', 'آخر 24 ساعة')}</option>
            <option value="7d">{t(locale, 'Last 7 days', 'آخر 7 أيام')}</option>
            <option value="30d">{t(locale, 'Last 30 days', 'آخر 30 يومًا')}</option>
          </select>
          <select className="stp-select" value={impactLevel} onChange={(event) => setImpactLevel(event.target.value)} aria-label={t(locale, 'Impact level', 'مستوى الأثر')}>
            <option value="all">{t(locale, 'All levels', 'كل المستويات')}</option>
            <option value="good">{t(locale, 'Information', 'معلومات')}</option>
            <option value="warn">{t(locale, 'Warning', 'تحذير')}</option>
            <option value="bad">{t(locale, 'Error / critical', 'خطأ / حرج')}</option>
          </select>
          <select className="stp-select" value={impactSort} onChange={(event) => setImpactSort(event.target.value as 'newest' | 'oldest')} aria-label={t(locale, 'Sort events', 'ترتيب الأحداث')}>
            <option value="newest">{t(locale, 'Newest first', 'الأحدث أولًا')}</option>
            <option value="oldest">{t(locale, 'Oldest first', 'الأقدم أولًا')}</option>
          </select>
          <button type="button" className="stp-btn stp-btn-ghost" onClick={() => void controller.loadImpact()}><RefreshCw className="w-3.5 h-3.5" />{t(locale, 'Re-read evidence', 'إعادة قراءة الأدلة')}</button>
        </div>

        <div className="stp-svc-split">
          <SubPanel title={t(locale, 'Boot event timeline', 'الخط الزمني لأحداث الإقلاع')} sub={t(locale, 'No duration is synthesized', 'لا تُصنع أي مدة')}>
            {impactEvents.length ? (
              <div className="stp-impact-list knx-custom-scrollbar" style={{ maxHeight: 360 }}>
                {impactEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className={`stp-impact-row is-${eventLevelTone(event.level)} ${event.id === selectedImpact?.id ? 'is-active' : ''}`}
                    onClick={() => setImpactSelected(event.id)}
                  >
                    <span className="stp-impact-time">{formatTime(event.timeCreated, locale)}<em>{formatDate(event.timeCreated, locale)}</em></span>
                    <span className="stp-impact-node" />
                    <span className="stp-impact-copy">
                      <strong>{event.eventId ? `#${event.eventId}` : t(locale, 'Event', 'حدث')} · {bootEventLabel(event.eventId, locale)}</strong>
                      <span>{event.message || t(locale, 'No message text.', 'لا يوجد نص رسالة.')}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Activity className="w-5 h-5" />}
                title={t(locale, 'No matching boot event', 'لا يوجد حدث إقلاع مطابق')}
                copy={impact?.note || t(locale, 'Windows did not publish a Diagnostics-Performance event for this window.', 'لم ينشر Windows حدث Diagnostics-Performance لهذه النافذة.')}
              />
            )}
          </SubPanel>

          <SubPanel title={t(locale, 'Selected event evidence', 'دليل الحدث المحدد')} sub={t(locale, 'Bound to the selected measured event', 'مرتبط بالحدث المقيس المحدد')}>
            {selectedImpact ? (
              <>
                <div className="stp-kv-list">
                  <div><span>{t(locale, 'Event ID', 'معرف الحدث')}</span><code>{selectedImpact.eventId ?? '—'}</code></div>
                  <div><span>{t(locale, 'Provider', 'المزود')}</span><code>{selectedImpact.provider}</code></div>
                  <div><span>{t(locale, 'Level', 'المستوى')}</span><code>{selectedImpact.level || '—'}</code></div>
                  <div><span>{t(locale, 'Created', 'أُنشئ')}</span><code>{formatTimestamp(selectedImpact.timeCreated, locale)}</code></div>
                  <div><span>{t(locale, 'CPU & I/O during boot', 'المعالج والإدخال/الإخراج أثناء الإقلاع')}</span><code>{t(locale, 'Not published by this event', 'لم ينشرها هذا الحدث')}</code></div>
                  <div><span>{t(locale, 'Per-entry boot delay', 'تأخير الإقلاع لكل مدخل')}</span><code>{t(locale, 'Not attributed by Windows', 'لم ينسبه Windows')}</code></div>
                </div>
                <div className="stp-command-block">
                  <span>{t(locale, 'Published message', 'الرسالة المنشورة')}</span>
                  <code>{selectedImpact.message || '—'}</code>
                </div>
                {selectedImpact.properties.length ? (
                  <div className="stp-property-chips">
                    {selectedImpact.properties.map((property, index) => <span key={`${property}-${index}`}>{property}</span>)}
                  </div>
                ) : null}
              </>
            ) : <div className="stp-picker-empty">{t(locale, 'Select a measured event.', 'حدد حدثًا مقيسًا.')}</div>}
          </SubPanel>
        </div>

        <SubPanel title={t(locale, 'Attributed entries & recommendation', 'المداخل المنسوبة والتوصية')} sub={t(locale, 'Name matches are evidence, not a measured delay', 'تطابق الاسم دليل، وليس تأخيرًا مقيسًا')}>
          {impact?.attributed.length ? (
            <div className="stp-attribution-list">
              {impact.attributed.map((item, index) => (
                <div key={`${item.entryId || item.name}-${index}`} className="stp-attribution-row">
                  <div><strong>{item.name}</strong><span>{item.evidence}</span></div>
                  <span className={`stp-chip ${item.delayMs == null ? 'stp-chip-muted' : 'stp-chip-warn'}`}>{formatDelay(item.delayMs, locale)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="stp-picker-empty">{t(locale, 'No boot event named a measured autorun. No attribution is invented.', 'لم يذكر أي حدث إقلاع مدخل بدء مقيسًا. لا يُختلق أي إسناد.')}</div>
          )}
          <div className="stp-recommendation">
            <ShieldCheck className="w-4 h-4" />
            <span>{t(locale, 'Recommendation: inspect the measured source and stage a review only where the source supports it. Boot seconds remain unclaimed until Windows publishes an explicit value.', 'التوصية: افحص المصدر المقيس وجهّز مراجعة فقط حيث يدعمه المصدر. تبقى ثواني الإقلاع غير مُدّعاة حتى ينشر Windows قيمة صريحة.')}</span>
          </div>
        </SubPanel>
      </div>
    );
  };

  const renderServices = () => (
    <div className="stp-svc-stack">
      <div className="stp-svc-stats">
        <StatTile label={t(locale, 'Boot services', 'خدمات الإقلاع')} value={formatCount(services.length)} note={t(locale, 'Automatic + delayed-auto', 'تلقائي + مؤجل')} />
        <StatTile label={t(locale, 'Delayed auto', 'تلقائي مؤجل')} value={formatCount(services.filter((item) => item.startupType === 'delayed').length)} note={t(locale, 'Scheduling evidence', 'دليل الجدولة')} tone="emerald" />
        <StatTile label={t(locale, 'Running', 'قيد التشغيل')} value={formatCount(services.filter((item) => item.running).length)} note={t(locale, 'Measured process state', 'حالة عملية مقيسة')} tone="amber" />
        <StatTile label={t(locale, 'Protected', 'محمي')} value={formatCount(services.filter((item) => item.protected).length)} note={t(locale, 'Policy staging blocked', 'تهيئة السياسة محجوبة')} tone="rose" />
      </div>

      <div className="stp-filter-row">
        <label className="stp-search">
          <Search className="w-3.5 h-3.5" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(locale, 'Filter service name or account…', 'رشّح اسم الخدمة أو الحساب…')} aria-label={t(locale, 'Filter services', 'ترشيح الخدمات')} />
        </label>
        <div className="stp-seg" role="group" aria-label={t(locale, 'Startup policy', 'سياسة البدء')}>
          {(['all', 'automatic', 'delayed', 'manual'] as const).map((type) => (
            <button key={type} type="button" className={serviceType === type ? 'is-active' : ''} onClick={() => setServiceType(type)}>
              {type === 'all' ? t(locale, 'All', 'الكل') : serviceStartupLabel(type, locale)}
            </button>
          ))}
        </div>
        <button type="button" className="stp-btn stp-btn-ghost" onClick={() => onNavigateSection?.('services')}>
          <Cpu className="w-3.5 h-3.5" />
          {t(locale, 'Service Commander', 'قائد الخدمات')}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="stp-svc-split">
        <SubPanel title={t(locale, 'Service boot policy matrix', 'مصفوفة سياسة بدء الخدمات')} sub={t(locale, 'Grouped by measured startup type', 'مجمعة حسب نوع البدء المقيس')} right={<span className="stp-chip stp-chip-muted">{formatCount(filteredServices.length)}</span>}>
          <div className="stp-mini-table-wrap knx-custom-scrollbar" style={{ maxHeight: 330 }}>
            <table className="stp-mini-table">
              <thead><tr><th>{t(locale, 'Service', 'الخدمة')}</th><th>{t(locale, 'Startup', 'البدء')}</th><th>{t(locale, 'State', 'الحالة')}</th><th>PID</th></tr></thead>
              <tbody>
                {filteredServices.map((item) => (
                  <tr key={item.id} className={item.id === selectedService?.id ? 'is-selected' : ''} onClick={() => setSelectedServiceId(item.id)}>
                    <td><span className="stp-row-name" title={item.displayName || item.name}>{item.displayName || item.name}</span><span className="stp-row-sub">{item.name}</span></td>
                    <td><span className={`stp-badge stp-badge-${SERVICE_STARTUP_META[item.startupType].tone}`}>{serviceStartupLabel(item.startupType, locale)}</span></td>
                    <td>{item.running ? t(locale, 'Running', 'قيد التشغيل') : item.state}</td>
                    <td className="stp-mono">{item.processId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredServices.length ? <div className="stp-picker-empty">{t(locale, 'No measured service matches the filter.', 'لا توجد خدمة مقيسة تطابق المرشح.')}</div> : null}
          </div>
        </SubPanel>

        <SubPanel title={t(locale, 'Selected service dossier', 'ملف الخدمة المحددة')} sub={t(locale, 'PID, account and protection evidence', 'PID والحساب وأدلة الحماية')}>
          {selectedService ? (
            <>
              <div className="stp-entry-identity">
                <div className="stp-entry-identity-icon"><Cpu className="w-5 h-5" /></div>
                <div className="min-w-0"><div className="stp-entry-identity-name" title={selectedService.displayName || selectedService.name}>{selectedService.displayName || selectedService.name}</div><div className="stp-entry-identity-sub">{selectedService.name}</div></div>
                {selectedService.protected ? <span className="stp-chip stp-chip-bad"><Lock className="w-3 h-3" />{t(locale, 'Protected', 'محمي')}</span> : <span className="stp-chip stp-chip-good">{t(locale, 'Standard', 'قياسي')}</span>}
              </div>
              <div className="stp-kv-list">
                <div><span>{t(locale, 'Startup type', 'نوع البدء')}</span><code>{serviceStartupLabel(selectedService.startupType, locale)}</code></div>
                <div><span>{t(locale, 'Delayed auto', 'تلقائي مؤجل')}</span><code>{selectedService.delayedAuto ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا')}</code></div>
                <div><span>{t(locale, 'Account', 'الحساب')}</span><code>{selectedService.account || '—'}</code></div>
                <div><span>{t(locale, 'Service state / PID', 'حالة الخدمة / PID')}</span><code>{selectedService.state} · {selectedService.processId ?? '—'}</code></div>
                <div><span>{t(locale, 'Binary path', 'مسار الملف')}</span><code title={selectedService.binaryPath || undefined}>{selectedService.binaryPath || '—'}</code></div>
                <div><span>{t(locale, 'Protection reason', 'سبب الحماية')}</span><code>{selectedService.protectionReason || t(locale, 'No protected rule matched', 'لا قاعدة حماية مطابقة')}</code></div>
              </div>
              <div className="stp-dock-actions">
                <button type="button" className="stp-btn stp-btn-primary" disabled={selectedService.protected || controller.busy === 'plan'} onClick={() => onStagePlan([selectedService.id], 'disable')}>
                  <Lock className="w-3.5 h-3.5" />
                  {t(locale, 'Stage policy draft', 'تهيئة مسودة السياسة')}
                </button>
                <button type="button" className="stp-btn stp-btn-ghost" onClick={() => onNavigateSection?.('services')}>{t(locale, 'Drill to Service Commander', 'الانتقال إلى قائد الخدمات')}</button>
              </div>
              <GateNote locale={locale}>{t(locale, 'Service start-mode changes belong to Mission 12 and require elevation; this plan is a read-only review.', 'تغييرات وضع بدء الخدمة تخص المهمة 12 وتتطلب رفع صلاحيات؛ هذه الخطة مراجعة للقراءة فقط.')}</GateNote>
            </>
          ) : <div className="stp-picker-empty">{t(locale, 'No measured service selected.', 'لم تُحدد خدمة مقيسة.')}</div>}
        </SubPanel>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="stp-svc-stack">
      <div className="stp-svc-stats">
        <StatTile label={t(locale, 'Logon tasks', 'مهام الدخول')} value={formatCount(tasks.length)} note={t(locale, 'Logon + boot triggers', 'محفزات الدخول والإقلاع')} tone="violet" />
        <StatTile label={t(locale, 'Enabled', 'مفعّلة')} value={formatCount(tasks.filter((task) => task.state.toLowerCase() !== 'disabled').length)} note={t(locale, 'Measured task state', 'حالة المهمة المقيسة')} tone="emerald" />
        <StatTile label={t(locale, 'Protected', 'محمية')} value={formatCount(tasks.filter((task) => task.protected).length)} note={t(locale, 'Windows maintenance', 'صيانة Windows')} tone="rose" />
        <StatTile label={t(locale, 'Highest run level', 'أعلى مستوى تشغيل')} value={formatCount(tasks.filter((task) => String(task.runLevel || '').toLowerCase() === 'highest').length)} note={t(locale, 'Elevation evidence', 'دليل رفع الصلاحيات')} tone="amber" />
      </div>

      <div className="stp-filter-row">
        <label className="stp-search">
          <Search className="w-3.5 h-3.5" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(locale, 'Filter task name, path or author…', 'رشّح اسم المهمة أو المسار أو المؤلف…')} aria-label={t(locale, 'Filter tasks', 'ترشيح المهام')} />
        </label>
        <div className="stp-seg" role="group" aria-label={t(locale, 'Task status', 'حالة المهمة')}>
          {(['all', 'enabled', 'disabled'] as const).map((state) => (
            <button key={state} type="button" className={taskState === state ? 'is-active' : ''} onClick={() => setTaskState(state)}>
              {state === 'all' ? t(locale, 'All tasks', 'كل المهام') : state === 'enabled' ? t(locale, 'Enabled', 'مفعّلة') : t(locale, 'Disabled', 'معطّلة')}
            </button>
          ))}
        </div>
      </div>

      <div className="stp-svc-split">
        <SubPanel title={t(locale, 'Scheduler tree', 'شجرة المجدول')} sub={t(locale, 'Grouped by measured task path', 'مجمعة حسب مسار المهمة المقيس')} right={<span className="stp-chip stp-chip-muted">{formatCount(filteredTasks.length)}</span>}>
          <div className="stp-task-tree knx-custom-scrollbar" style={{ maxHeight: 340 }}>
            {Object.entries(filteredTasks.reduce<Record<string, StartupTaskEntry[]>>((groups, task) => {
              const key = task.path || '\\';
              groups[key] = groups[key] || [];
              groups[key].push(task);
              return groups;
            }, {})).map(([group, groupTasks]) => (
              <div key={group} className="stp-task-group">
                <div className="stp-task-group-head"><FolderTree className="w-3 h-3" />{group}</div>
                {groupTasks.map((task) => (
                  <button key={task.id} type="button" className={`stp-task-row ${task.id === selectedTask?.id ? 'is-active' : ''}`} onClick={() => setSelectedTaskId(task.id)}>
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span className="min-w-0"><strong>{task.name}</strong><em>{taskTriggerLabel(task.triggers, locale)}</em></span>
                    <span className={`stp-badge stp-badge-${task.state.toLowerCase() === 'disabled' ? 'bad' : 'good'}`}>{task.state}</span>
                    {task.protected ? <Lock className="w-3 h-3 stp-icon-amber" /> : null}
                  </button>
                ))}
              </div>
            ))}
            {!filteredTasks.length ? <div className="stp-picker-empty">{t(locale, 'No measured logon task matches the filter.', 'لا توجد مهمة دخول مقيسة تطابق المرشح.')}</div> : null}
          </div>
        </SubPanel>

        <SubPanel title={t(locale, 'Trigger & runtime dossier', 'ملف المحفز والتشغيل')} sub={t(locale, 'Bound to the selected measured task', 'مرتبط بالمهمة المقيسة المحددة')}>
          {selectedTask ? (
            <>
              <EntryIdentity entry={{
                ...selectedTask,
                sourceKind: 'scheduled-task',
                scope: /^\\Microsoft\\Windows\\/i.test(selectedTask.path) ? 'machine' : 'user',
                location: `${selectedTask.path}${selectedTask.name}`,
                command: selectedTask.execute,
                executable: selectedTask.execute,
                publisher: null,
                signature: 'unavailable',
                state: selectedTask.state.toLowerCase() === 'disabled' ? 'disabled' : 'enabled',
                approvedState: selectedTask.state.toLowerCase() === 'disabled' ? 'disabled' : 'enabled',
                protection: selectedTask.protected ? 'protected' : 'standard',
                protectionReason: selectedTask.protectionReason,
                elevationRequired: String(selectedTask.runLevel || '').toLowerCase() === 'highest',
                active: false,
                description: null,
                triggers: selectedTask.triggers,
                taskState: selectedTask.state,
                taskPath: selectedTask.path,
                nextRunAt: selectedTask.nextRunAt,
                lastRunAt: selectedTask.lastRunAt,
                userId: selectedTask.userId,
                runLevel: selectedTask.runLevel,
                evidence: [],
              }} locale={locale} />
              <div className="stp-kv-list">
                <div><span>{t(locale, 'Trigger (at logon / at boot)', 'المحفز (دخول / إقلاع)')}</span><code>{taskTriggerLabel(selectedTask.triggers, locale)}</code></div>
                <div><span>{t(locale, 'Task author', 'مؤلف المهمة')}</span><code>{selectedTask.author || t(locale, 'Not published', 'غير منشور')}</code></div>
                <div><span>{t(locale, 'Publisher', 'الناشر')}</span><code>{t(locale, 'Not published for this task', 'غير منشور لهذه المهمة')}</code></div>
                <div><span>{t(locale, 'Run account / level', 'حساب التشغيل / المستوى')}</span><code>{selectedTask.userId || '—'} · {selectedTask.runLevel || '—'}</code></div>
                <div><span>{t(locale, 'Next run', 'التشغيل التالي')}</span><code>{formatTimestamp(selectedTask.nextRunAt, locale)}</code></div>
                <div><span>{t(locale, 'Last run', 'آخر تشغيل')}</span><code>{formatTimestamp(selectedTask.lastRunAt, locale)}</code></div>
                <div><span>{t(locale, 'Execute', 'التنفيذ')}</span><code title={selectedTask.execute || undefined}>{selectedTask.execute || '—'}</code></div>
              </div>
              <div className="stp-dock-actions">
                <button type="button" className="stp-btn stp-btn-primary" disabled={selectedTask.protected || controller.busy === 'plan'} onClick={() => onStagePlan([selectedTask.id], 'disable')}>
                  <Lock className="w-3.5 h-3.5" />
                  {t(locale, 'Stage task disable draft', 'تهيئة مسودة تعطيل المهمة')}
                </button>
                <button type="button" className="stp-btn stp-btn-ghost" disabled>{t(locale, 'Inspect full trigger XML', 'فحص XML المحفز الكامل')}</button>
              </div>
              <GateNote locale={locale} />
            </>
          ) : <div className="stp-picker-empty">{t(locale, 'No measured task selected.', 'لم تُحدد مهمة مقيسة.')}</div>}
        </SubPanel>
      </div>
    </div>
  );

  const renderDelay = () => (
    <div className="stp-svc-stack">
      <div className="stp-svc-split">
        <SubPanel title={t(locale, 'Choose entries', 'اختيار المداخل')} sub={t(locale, 'Delay semantics depend on the measured source', 'دلالات التأخير تعتمد على المصدر المقيس')}>
          <EntryPicker entries={entries} locale={locale} selectedIds={delayIds} onToggle={(id) => setDelayIds((current) => toggleSet(current, id))} />
          <div className="stp-delay-control">
            <label>
              <span>{t(locale, 'Delay offset', 'إزاحة التأخير')}</span>
              <strong>{delayMinutes} {t(locale, 'minutes', 'دقيقة')}</strong>
            </label>
            <input
              type="range"
              min={1}
              max={240}
              step={1}
              value={delayMinutes}
              onChange={(event) => setDelayMinutes(Number(event.target.value))}
              aria-label={t(locale, 'Delay minutes', 'دقائق التأخير')}
            />
            <input
              type="number"
              min={1}
              max={240}
              value={delayMinutes}
              onChange={(event) => setDelayMinutes(Math.min(240, Math.max(1, Number(event.target.value) || 1)))}
              aria-label={t(locale, 'Delay minutes numeric', 'دقائق التأخير رقميًا')}
            />
          </div>
        </SubPanel>

        <SubPanel title={t(locale, 'Original vs proposed lanes', 'المسارات الأصلية مقابل المقترحة')} sub={t(locale, 'No delay is applied; this is a staged review', 'لا يُطبق أي تأخير؛ هذه مراجعة مُهيَّأة')}>
          <div className="stp-delay-lanes">
            {delayConflicts.map(({ entry, conflicts }) => (
              <div key={entry.id} className="stp-delay-lane">
                <div className="stp-delay-lane-name"><strong>{entry.name}</strong><span>{sourceLabel(entry.sourceKind, locale)}</span></div>
                <div className="stp-delay-track">
                  <span className="stp-delay-original">{t(locale, 'Original', 'الأصلي')}</span>
                  <span className="stp-delay-arrow"><ArrowRight className="w-3 h-3" /></span>
                  <span className="stp-delay-proposed" style={{ left: `${Math.min(80, 12 + delayMinutes / 4)}%` }}>+{delayMinutes}m</span>
                </div>
                <div className="stp-delay-conflict">
                  {conflicts.length ? conflicts.map((conflict) => <span key={conflict} className="stp-tone-amber">{conflict}</span>) : <span className="stp-tone-good">{t(locale, 'No measured conflict on this row', 'لا تعارض مقيس في هذا الصف')}</span>}
                </div>
              </div>
            ))}
            {!delayConflicts.length ? <div className="stp-picker-empty">{t(locale, 'Select at least one measured entry.', 'حدد مدخلًا مقيسًا واحدًا على الأقل.')}</div> : null}
          </div>
        </SubPanel>
      </div>

      <SubPanel title={t(locale, 'Delay review dock', 'رصيف مراجعة التأخير')} sub={t(locale, 'Conflict check and responsiveness evidence', 'فحص التعارض ودليل الاستجابة')}>
        <div className="stp-svc-stats">
          <StatTile label={t(locale, 'Selected entries', 'المداخل المحددة')} value={formatCount(delayIds.size)} note={t(locale, 'measured targets', 'أهداف مقيسة')} />
          <StatTile label={t(locale, 'Conflict check', 'فحص التعارض')} value={formatCount(delayConflicts.reduce((sum, row) => sum + row.conflicts.length, 0))} note={t(locale, 'conflicts found', 'تعارضًا موجودًا')} tone="amber" />
          <StatTile label={t(locale, 'Original boot impact', 'أثر الإقلاع الأصلي')} value={t(locale, 'Not published', 'غير منشور')} note={t(locale, 'per-entry Windows value', 'قيمة Windows لكل مدخل')} tone="muted" />
          <StatTile label={t(locale, 'Estimated responsiveness', 'الاستجابة المقدرة')} value={t(locale, 'Not measured', 'غير مقيسة')} note={t(locale, 'no fabricated saving', 'لا توفير مختلق')} tone="muted" />
        </div>
        <div className="stp-dock-actions">
          <button type="button" className="stp-btn stp-btn-primary" disabled={!delayIds.size || controller.busy === 'plan'} onClick={() => onStagePlan([...delayIds], 'delay', delayMinutes)}>
            <Lock className="w-3.5 h-3.5" />
            {t(locale, 'Stage delay review', 'تهيئة مراجعة التأخير')}
          </button>
          <button type="button" className="stp-btn stp-btn-ghost" onClick={() => setDelayIds(new Set())} disabled={!delayIds.size}>{t(locale, 'Clear selection', 'مسح التحديد')}</button>
        </div>
        <GateNote locale={locale} />
      </SubPanel>
    </div>
  );

  const renderBatch = () => (
    <div className="stp-svc-stack">
      <div className="stp-svc-split">
        <SubPanel title={t(locale, 'Add measured items', 'إضافة عناصر مقيسة')} sub={t(locale, 'Selection is bound to the measured inventory', 'التحديد مرتبط بالجرد المقيس')}>
          <EntryPicker entries={entries} locale={locale} selectedIds={batchIds} onToggle={(id) => setBatchIds((current) => toggleSet(current, id))} maxHeight={330} />
        </SubPanel>
        <SubPanel title={t(locale, 'Batch staging tray', 'صينية تهيئة الدفعة')} sub={t(locale, 'Reorder the review order; nothing is executed', 'أعد ترتيب المراجعة؛ لا يُنفَّذ شيء')} right={<span className="stp-chip stp-chip-muted">{formatCount(batchEntries.length)}</span>}>
          <div className="stp-batch-list knx-custom-scrollbar" style={{ maxHeight: 300 }}>
            {batchEntries.map((entry, index) => (
              <div key={entry.id} className="stp-batch-card">
                <span className="stp-batch-index">{index + 1}</span>
                <div className="min-w-0"><strong>{entry.name}</strong><em>{sourceLabel(entry.sourceKind, locale)} · {stateLabel(entry.state, locale)}</em></div>
                <div className="stp-batch-controls">
                  <button type="button" className="stp-icon-btn" disabled={index === 0} onClick={() => {
                    setBatchIds((current) => {
                      const ids = [...current];
                      const position = ids.indexOf(entry.id);
                      if (position > 0) [ids[position - 1], ids[position]] = [ids[position], ids[position - 1]];
                      return new Set(ids);
                    });
                  }} aria-label={t(locale, 'Move up', 'نقل لأعلى')}><ArrowUp className="w-3 h-3" /></button>
                  <button type="button" className="stp-icon-btn" disabled={index === batchEntries.length - 1} onClick={() => {
                    setBatchIds((current) => {
                      const ids = [...current];
                      const position = ids.indexOf(entry.id);
                      if (position >= 0 && position < ids.length - 1) [ids[position + 1], ids[position]] = [ids[position], ids[position + 1]];
                      return new Set(ids);
                    });
                  }} aria-label={t(locale, 'Move down', 'نقل لأسفل')}><ArrowDown className="w-3 h-3" /></button>
                  <button type="button" className="stp-icon-btn" onClick={() => setBatchIds((current) => toggleSet(current, entry.id))} aria-label={t(locale, 'Remove from batch', 'إزالة من الدفعة')}><X className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            {!batchEntries.length ? <div className="stp-picker-empty">{t(locale, 'No item is queued for batch staging.', 'لا يوجد عنصر في قائمة الدفعة.')}</div> : null}
          </div>
        </SubPanel>
      </div>

      <SubPanel title={t(locale, 'Execution review dock', 'رصيف مراجعة التنفيذ')} sub={t(locale, 'Rights and affected sources are measured per item', 'الحقوق والمصادر المتأثرة مقيسة لكل عنصر')}>
        <div className="stp-svc-stats">
          <StatTile label={t(locale, 'Total queued actions', 'إجمالي الإجراءات المصطفة')} value={formatCount(batchEntries.length)} note={t(locale, 'immutable review only', 'مراجعة ثابتة فقط')} />
          <StatTile label={t(locale, 'Affected registry locations', 'مواقع التسجيل المتأثرة')} value={formatCount(batchSources.filter((source) => source.startsWith('registry')).length)} note={`${formatCount(batchSources.length)} ${t(locale, 'source kinds', 'أنواع مصادر')}`} tone="violet" />
          <StatTile label={t(locale, 'Administrative rights', 'حقوق إدارية')} value={formatCount(batchElevation)} note={t(locale, 'items require elevation', 'عنصرًا يتطلب رفع صلاحيات')} tone="amber" />
          <StatTile label={t(locale, 'Protected blockers', 'حاجبات محمية')} value={formatCount(batchProtected)} note={t(locale, 'cannot be staged', 'لا يمكن تهيئتها')} tone="rose" />
        </div>
        <div className="stp-source-chip-row">
          {batchSources.map((source) => <span key={source} className="stp-chip stp-chip-muted"><FolderTree className="w-3 h-3" />{sourceLabel(source, locale)}</span>)}
          {!batchSources.length ? <span className="stp-row-faint">{t(locale, 'No source is affected yet.', 'لا يوجد مصدر متأثر بعد.')}</span> : null}
        </div>
        <div className="stp-dock-actions">
          <button type="button" className="stp-btn stp-btn-primary" disabled={!batchIds.size || controller.busy === 'plan'} onClick={() => onStagePlan([...batchIds], 'batch')}>
            <Lock className="w-3.5 h-3.5" />
            {t(locale, 'Stage batch review', 'تهيئة مراجعة الدفعة')}
          </button>
          <button type="button" className="stp-btn stp-btn-ghost" onClick={() => onApplySelection([...batchIds])} disabled={!batchIds.size}>{t(locale, 'Send to register selection', 'إرسال إلى تحديد السجل')}</button>
        </div>
        <GateNote locale={locale} />
      </SubPanel>
    </div>
  );

  const renderUndoAll = () => (
    <div className="stp-svc-stack">
      <div className="stp-svc-banner is-gated">
        <ShieldAlert className="w-4 h-4" />
        <div>
          <strong>{t(locale, 'Mass rollback is gated', 'التراجع الجماعي محجوب')}</strong>
          <p>{controller.sessions?.execution.reason || t(locale, 'No batch session exists because no startup change was executed.', 'لا توجد جلسة دفعة لأن أي تغيير في بدء التشغيل لم يُنفَّذ.')}</p>
        </div>
        <span className="stp-chip stp-chip-bad">{t(locale, 'BLOCKED', 'محجوب')}</span>
      </div>

      <div className="stp-svc-split">
        <SubPanel title={t(locale, 'Journal sessions', 'جلسات السجل')} sub={t(locale, 'Select an eligible prior batch session', 'حدد جلسة دفعة سابقة مؤهلة')} right={<button type="button" className="stp-btn stp-btn-quiet" onClick={() => void controller.loadSessions()}><RefreshCw className="w-3 h-3" />{t(locale, 'Re-read', 'إعادة قراءة')}</button>}>
          <EmptyState
            icon={<Layers className="w-5 h-5" />}
            title={t(locale, 'No batch session', 'لا توجد جلسة دفعة')}
            copy={controller.sessions?.reason || t(locale, 'There is no prior immutable batch plan or verified execution to roll back.', 'لا توجد خطة دفعة ثابتة سابقة أو تنفيذ متحقق منه للتراجع عنه.')}
          />
          <div className="stp-session-picker">
            {selectedSessionId ? <div className="stp-picker-row is-checked">{selectedSessionId}</div> : null}
          </div>
        </SubPanel>

        <SubPanel title={t(locale, 'Rollback review', 'مراجعة التراجع')} sub={t(locale, 'Restoration order and collision warnings', 'ترتيب الاستعادة وتحذيرات التعارض')}>
          <div className="stp-kv-list">
            <div><span>{t(locale, 'Session timestamp', 'طابع وقت الجلسة')}</span><code>{t(locale, 'No session', 'لا جلسة')}</code></div>
            <div><span>{t(locale, 'Total restored autorun items', 'إجمالي عناصر البدء المستعادة')}</span><code>0</code></div>
            <div><span>{t(locale, 'Registry integrity check', 'فحص سلامة التسجيل')}</span><code>{t(locale, 'Not run — no session', 'لم يُشغّل — لا جلسة')}</code></div>
            <div><span>{t(locale, 'Rollback collision warnings', 'تحذيرات تعارض التراجع')}</span><code>{t(locale, 'None measured', 'لا شيء مقيس')}</code></div>
          </div>
          <div className="stp-dock-actions">
            <button type="button" className="stp-btn stp-btn-ghost" disabled>{t(locale, 'Select eligible session', 'اختيار جلسة مؤهلة')}</button>
            <button type="button" className="stp-btn stp-btn-ghost" disabled>{t(locale, 'Re-order safe rollback plan', 'إعادة ترتيب خطة تراجع آمنة')}</button>
            <button type="button" className="stp-btn stp-btn-primary" disabled>{t(locale, 'Stage rollback review', 'تهيئة مراجعة التراجع')}</button>
          </div>
          <GateNote locale={locale}>{t(locale, 'A rollback requires a verified prior batch execution, journal hashes and collision-free restoration. None exists.', 'التراجع يتطلب تنفيذ دفعة سابقًا متحققًا منه وتجزئات سجل واستعادة خالية من التعارض. لا يوجد أي منها.')}</GateNote>
        </SubPanel>
      </div>
    </div>
  );

  const renderService = () => {
    switch (service) {
      case 'startup-overview': return renderOverview();
      case 'startup-disable': return renderDisable();
      case 'startup-restore': return renderRestore();
      case 'startup-sources': return renderSources();
      case 'startup-journal': return renderJournal();
      case 'startup-filter': return renderFilter();
      case 'startup-impact': return renderImpact();
      case 'startup-services': return renderServices();
      case 'startup-tasks': return renderTasks();
      case 'startup-delay': return renderDelay();
      case 'startup-batch': return renderBatch();
      case 'startup-undo-all': return renderUndoAll();
      default: return null;
    }
  };

  return (
    <div className="stp-service-workspace" data-testid={`startup-service-workspace-${service}`} style={{ '--stp-accent': accent } as React.CSSProperties}>
      <header className="stp-service-head">
        <div className="stp-service-mark">{serviceIconFor(service)}</div>
        <div className="stp-service-head-copy">
          <div className="stp-service-eyebrow">
            {t(locale, 'Boot Control', 'التحكم في الإقلاع')} · {String(serviceIndex).padStart(2, '0')} / 12
          </div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="stp-service-head-meta">
          <span className={`stp-state stp-state-${capability?.state || 'available'}`}>
            {capability ? serviceStateLabel(capability.state, locale) : t(locale, 'Native', 'أصلي')}
          </span>
          <span className="stp-chip stp-chip-muted">{capability?.provider || 'StartupBridge'}</span>
          <button type="button" className="stp-icon-btn stp-service-close" onClick={onClose} aria-label={t(locale, 'Close service', 'إغلاق الخدمة')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="stp-service-body knx-custom-scrollbar">
        {renderService()}
      </div>

      <footer className="stp-service-foot">
        <span className="stp-gate-note">
          <Lock className="w-3 h-3" />
          {t(locale, 'Read-only workbench · no mutation channel', 'ورشة للقراءة فقط · لا قناة تغيير')}
        </span>
        <span className="stp-service-foot-actions">
          <button type="button" className="stp-btn stp-btn-ghost" onClick={() => void controller.refresh(true)} disabled={controller.refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 ${controller.refreshing ? 'stp-spin' : ''}`} />
            {t(locale, 'Refresh evidence', 'تحديث الأدلة')}
          </button>
          <button type="button" className="stp-btn stp-btn-primary" onClick={onClose}>
            {t(locale, 'Back to register', 'العودة إلى السجل')}
          </button>
        </span>
      </footer>
    </div>
  );
}

function serviceIconFor(service: StartupServiceId) {
  switch (service) {
    case 'startup-overview': return <Layers className="w-5 h-5" />;
    case 'startup-disable': return <PowerOff className="w-5 h-5" />;
    case 'startup-restore': return <RotateCcw className="w-5 h-5" />;
    case 'startup-sources': return <FolderTree className="w-5 h-5" />;
    case 'startup-journal': return <FileCheck2 className="w-5 h-5" />;
    case 'startup-filter': return <ListFilter className="w-5 h-5" />;
    case 'startup-impact': return <Gauge className="w-5 h-5" />;
    case 'startup-services': return <Cpu className="w-5 h-5" />;
    case 'startup-tasks': return <CalendarClock className="w-5 h-5" />;
    case 'startup-delay': return <Clock3 className="w-5 h-5" />;
    case 'startup-batch': return <Sparkles className="w-5 h-5" />;
    case 'startup-undo-all': return <ShieldAlert className="w-5 h-5" />;
    default: return <Activity className="w-5 h-5" />;
  }
}
