/**
 * KNOuX Service Commander - shared measured workbench primitives (Mission 12).
 * Every value is measured. Operation previews are immutable and non-executable.
 */
import React, { useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  Lock,
  PlayCircle,
  RotateCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Square,
  XCircle,
} from 'lucide-react';
import type {
  ServiceAction,
  ServiceEventRecord,
  ServiceOperationPlan,
  ServiceRecord,
  ServiceStartupType,
  ServicesSnapshot,
  ServicesToolId,
} from '../../shared/native-contracts';
import type { ServicesLocale } from './catalog';
import { RISK_META, STATE_META, TOOL_BY_ID, toolLabel } from './catalog';
import type { ServicesController } from './useServices';
import {
  actionLabel,
  dependencyImpact,
  eventLevelMeta,
  filterServices,
  formatBytes,
  formatCount,
  formatTimestamp,
  planForService,
  protectionRoleLabel,
  startupMeta,
  stateTone,
  t,
  type ServiceFilters,
} from './model';
import { DEFAULT_FILTERS } from './model';
import { Chip, DataRows, SearchBox, Seg, cx } from '../system/ui';

export interface ServicesWorkbenchProps {
  locale: ServicesLocale;
  snapshot: ServicesSnapshot;
  controller: ServicesController;
  toolId: ServicesToolId;
}

export function ServicesToolFrame({
  toolId,
  locale,
  children,
  foot,
  provider,
}: {
  toolId: ServicesToolId;
  locale: ServicesLocale;
  children: ReactNode;
  foot?: ReactNode;
  provider?: string;
}) {
  const entry = TOOL_BY_ID[toolId];
  const Icon = entry.icon;
  const state = STATE_META[entry.state];
  const risk = RISK_META[entry.risk];
  return (
    <section className="sys-workbench svc-workbench" data-testid={`services-service-workspace-${toolId}`}>
      <header className="sys-wb-head">
        <div className="sys-wb-identity">
          <span className="sys-wb-icon" style={{ color: entry.accent, borderColor: `${entry.accent}55` }} aria-hidden="true"><Icon /></span>
          <div className="sys-wb-copy">
            <span className="sys-wb-eyebrow">{t(locale, 'Service tool', 'أداة خدمات')} {String(entry.index).padStart(2, '0')} · {entry.id}</span>
            <h2>{toolLabel(toolId, locale)}</h2>
            <p>{locale === 'ar' ? entry.blurbAr : entry.blurbEn}</p>
          </div>
        </div>
        <div className="sys-wb-badges">
          <Chip tone={state.tone}>{t(locale, state.en, state.ar)}</Chip>
          <Chip tone={risk.tone} icon={ShieldCheck}>{t(locale, risk.en, risk.ar)}</Chip>
          <Chip tone="muted" title={provider || entry.provider}>{provider || entry.provider}</Chip>
        </div>
      </header>
      <div className="sys-service-body sys-wb-body svc-wb-body">{children}</div>
      {foot ? <footer className="sys-wb-foot">{foot}</footer> : null}
    </section>
  );
}

export function ServiceStateChip({ state, locale }: { state: string | null; locale: ServicesLocale }) {
  return <Chip tone={stateTone(state)}>{state || t(locale, 'Unknown', 'مجهول')}</Chip>;
}

export function ProtectionChip({ service, locale }: { service: ServiceRecord; locale: ServicesLocale }) {
  if (!service.protected) return <Chip tone="good" icon={ShieldCheck}>{t(locale, 'Controllable', 'قابل للتحكم')}</Chip>;
  return <Chip tone="bad" icon={ShieldAlert} title={service.protectionReason || undefined}>{protectionRoleLabel(service.protectionRole, locale)}</Chip>;
}

export function ServiceRegister({
  locale,
  services,
  selectedName,
  onSelect,
  initialProtectedOnly = false,
  title,
  sub,
}: {
  locale: ServicesLocale;
  services: ServiceRecord[];
  selectedName: string | null;
  onSelect: (name: string) => void;
  initialProtectedOnly?: boolean;
  title?: string;
  sub?: string;
}) {
  const [filters, setFilters] = useState<ServiceFilters>({ ...DEFAULT_FILTERS, protectedOnly: initialProtectedOnly });
  const filtered = useMemo(() => filterServices(services, filters), [filters, services]);
  const showProtected = filters.protectedOnly;
  return (
    <div className="svc-register">
      <div className="svc-register-head">
        <div>
          <h3>{title || t(locale, 'Service register', 'سجل الخدمات')}</h3>
          <p>{sub || `${formatCount(filtered.length)} / ${formatCount(services.length)} ${t(locale, 'measured services', 'خدمة مقيسة')}`}</p>
        </div>
        <SearchBox
          value={filters.query}
          onChange={(query) => setFilters((current) => ({ ...current, query }))}
          placeholder={t(locale, 'Search name, display, account or path…', 'ابحث في الاسم أو العرض أو الحساب أو المسار…')}
          ariaLabel={t(locale, 'Search services', 'بحث الخدمات')}
        />
      </div>
      <div className="svc-register-filters">
        <Seg<'all' | 'running' | 'stopped'>
          value={filters.state}
          onChange={(state) => setFilters((current) => ({ ...current, state }))}
          ariaLabel={t(locale, 'Filter status', 'تصفية الحالة')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All', 'الكل') },
            { value: 'running', label: t(locale, 'Running', 'تعمل') },
            { value: 'stopped', label: t(locale, 'Stopped', 'متوقفة') },
          ]}
        />
        <Seg<'all' | 'automatic' | 'manual' | 'disabled'>
          value={filters.startup}
          onChange={(startup) => setFilters((current) => ({ ...current, startup }))}
          ariaLabel={t(locale, 'Filter startup type', 'تصفية نوع البدء')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All starts', 'كل أنواع البدء') },
            { value: 'automatic', label: t(locale, 'Auto', 'تلقائي') },
            { value: 'manual', label: t(locale, 'Manual', 'يدوي') },
            { value: 'disabled', label: t(locale, 'Disabled', 'معطل') },
          ]}
        />
        <Seg<'all' | 'system' | 'user'>
          value={filters.account}
          onChange={(account) => setFilters((current) => ({ ...current, account }))}
          ariaLabel={t(locale, 'Filter account type', 'تصفية نوع الحساب')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All accounts', 'كل الحسابات') },
            { value: 'system', label: t(locale, 'System', 'نظام') },
            { value: 'user', label: t(locale, 'User', 'مستخدم') },
          ]}
        />
        <button
          type="button"
          className={cx('sys-btn sys-btn-quiet', showProtected && 'is-active')}
          aria-pressed={showProtected}
          onClick={() => setFilters((current) => ({ ...current, protectedOnly: !current.protectedOnly }))}
        >
          <ShieldAlert aria-hidden="true" />{t(locale, 'Protected only', 'المحمية فقط')}
        </button>
      </div>
      <div className="svc-table-head" aria-hidden="true">
        <span>{t(locale, 'Service', 'الخدمة')}</span>
        <span>{t(locale, 'State', 'الحالة')}</span>
        <span>{t(locale, 'Startup', 'البدء')}</span>
        <span>{t(locale, 'Account', 'الحساب')}</span>
        <span>PID</span>
      </div>
      <div className="svc-table-body knx-custom-scrollbar" role="listbox" aria-label={t(locale, 'Measured services', 'الخدمات المقيسة')}>
        {filtered.map((service) => (
          <button
            key={service.name}
            type="button"
            role="option"
            aria-selected={selectedName === service.name}
            className={cx('svc-row', selectedName === service.name && 'is-active')}
            onClick={() => onSelect(service.name)}
            data-testid="services-register-row"
          >
            <span className="svc-row-name">
              <strong>{service.displayName || service.name}</strong>
              <em>{service.name}</em>
            </span>
            <span><ServiceStateChip state={service.state} locale={locale} /></span>
            <span className="svc-row-startup">{startupMeta(service.startupType, service.delayedAuto, locale).label}</span>
            <span className="svc-row-account" title={service.account || ''}>{service.account || '—'}</span>
            <span className="svc-row-pid">{service.pid == null ? '—' : service.pid}</span>
          </button>
        ))}
        {!filtered.length ? (
          <div className="svc-empty">{t(locale, 'No measured service matches these filters.', 'لا خدمة مقيسة تطابق هذه المرشحات.')}</div>
        ) : null}
      </div>
    </div>
  );
}

export function ServiceDossier({ locale, snapshot, service }: { locale: ServicesLocale; snapshot: ServicesSnapshot; service: ServiceRecord | null }) {
  if (!service) {
    return (
      <div className="svc-empty">
        <Search aria-hidden="true" />
        <strong>{t(locale, 'Select a measured service', 'اختر خدمة مقيسة')}</strong>
        <p>{t(locale, 'The dossier is bound to the measured SCM register.', 'الملف مرتبط بسجل SCM المقيس.')}</p>
      </div>
    );
  }
  const startup = startupMeta(service.startupType, service.delayedAuto, locale);
  return (
    <div className="svc-dossier">
      <div className="svc-dossier-head">
        <div>
          <span className="sys-wb-eyebrow">{service.name}</span>
          <h3>{service.displayName || service.name}</h3>
          <p>{service.description || t(locale, 'No description was returned.', 'لم يُعد وصف.')}</p>
        </div>
        <div className="svc-chip-row">
          <ServiceStateChip state={service.state} locale={locale} />
          <Chip tone={startup.tone}>{startup.label}</Chip>
          <ProtectionChip service={service} locale={locale} />
        </div>
      </div>
      <DataRows
        rows={[
          { label: t(locale, 'Service name', 'اسم الخدمة'), value: service.name, mono: true },
          { label: t(locale, 'Startup type', 'نوع البدء'), value: startup.label, tone: startup.tone },
          { label: t(locale, 'Account', 'الحساب'), value: service.account || '—' },
          { label: t(locale, 'Process ID', 'معرف العملية'), value: service.pid == null ? '—' : String(service.pid), mono: true },
          { label: t(locale, 'Binary path', 'مسار الملف'), value: service.binaryPath || '—', mono: true },
          { label: t(locale, 'Accepts stop', 'يقبل الإيقاف'), value: service.acceptsStop == null ? '—' : service.acceptsStop ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا'), tone: service.acceptsStop ? 'good' : 'warn' },
          { label: t(locale, 'Upstream prerequisites', 'الاعتماديات السابقة'), value: service.dependencies.length ? service.dependencies.join(', ') : t(locale, 'None measured', 'لا يوجد مقيس'), mono: true },
          { label: t(locale, 'Downstream dependents', 'التبعيات اللاحقة'), value: service.dependents.length ? service.dependents.join(', ') : t(locale, 'None measured', 'لا يوجد مقيس'), mono: true },
          { label: t(locale, 'Protection policy', 'سياسة الحماية'), value: service.protectionReason || t(locale, 'No rule matched', 'لا قاعدة مطابقة'), tone: service.protected ? 'bad' : 'good' },
        ]}
      />
      <div className="svc-chip-row">
        <Chip tone="muted">{t(locale, 'Source', 'المصدر')}: {service.source}</Chip>
        {service.protected ? <Chip tone="bad" icon={Lock}>{t(locale, 'Control denied by policy', 'التحكم مرفوض بالسياسة')}</Chip> : <Chip tone="good" icon={ShieldCheck}>{t(locale, 'Preview allowed', 'المعاينة مسموحة')}</Chip>}
      </div>
    </div>
  );
}

export function OperationDock({
  locale,
  snapshot,
  controller,
  service,
  mode = 'both',
}: {
  locale: ServicesLocale;
  snapshot: ServicesSnapshot;
  controller: ServicesController;
  service: ServiceRecord | null;
  mode?: 'state' | 'startup' | 'both';
}) {
  const allowedActions: ServiceAction[] = mode === 'state' ? ['start', 'stop', 'restart'] : mode === 'startup' ? ['startup-type'] : ['start', 'stop', 'restart', 'startup-type'];
  const [action, setAction] = useState<ServiceAction>(mode === 'startup' ? 'startup-type' : 'stop');
  const [startup, setStartup] = useState<ServiceStartupType>('manual');
  const plan = planForService(controller.plan, service?.name || null);
  const activeAction = allowedActions.includes(action) ? action : allowedActions[0];
  const impact = service ? dependencyImpact(snapshot, service) : null;
  const stage = async () => {
    if (!service) return;
    await controller.stagePlan({ serviceName: service.name, action: activeAction, ...(activeAction === 'startup-type' ? { startupType: startup } : {}) });
  };
  return (
    <div className="svc-op" data-testid="services-operation-preview">
      <div className="svc-op-head">
        <div>
          <h3><PlayCircle aria-hidden="true" />{t(locale, 'Operation preview', 'معاينة العملية')}</h3>
          <p>{t(locale, 'Immutable review. No SCM operation is executed.', 'مراجعة ثابتة. لا تُنفذ أي عملية SCM.')}</p>
        </div>
        <Chip tone="bad" icon={Lock}>{t(locale, 'Not executable', 'غير قابل للتنفيذ')}</Chip>
      </div>
      <div className="svc-op-controls">
        <Seg<ServiceAction>
          value={activeAction}
          onChange={setAction}
          ariaLabel={t(locale, 'Operation action', 'إجراء العملية')}
          compact
          options={allowedActions.map((entry) => ({ value: entry, label: actionLabel(entry, locale) }))}
        />
        {activeAction === 'startup-type' ? (
          <Seg<ServiceStartupType>
            value={startup}
            onChange={setStartup}
            ariaLabel={t(locale, 'Proposed startup type', 'نوع البدء المقترح')}
            compact
            options={[
              { value: 'automatic', label: t(locale, 'Automatic', 'تلقائي') },
              { value: 'manual', label: t(locale, 'Manual', 'يدوي') },
              { value: 'disabled', label: t(locale, 'Disabled', 'معطل') },
              { value: 'delayed', label: t(locale, 'Delayed', 'مؤجل') },
            ]}
          />
        ) : null}
        <button type="button" className="sys-btn sys-btn-primary" data-testid="services-stage-preview" onClick={() => void stage()} disabled={!service || controller.busy === 'plan'}>
          <ShieldCheck aria-hidden="true" />{plan ? t(locale, 'Re-stage preview', 'إعادة تهيئة المعاينة') : t(locale, 'Stage preview', 'تهيئة معاينة')}
        </button>
      </div>

      {service ? (
        <>
          <div className="svc-op-diff">
            <div className="svc-op-card">
              <span>{t(locale, 'Current', 'الحالي')}</span>
              <strong>{service.state || '—'}</strong>
              <em>{startupMeta(service.startupType, service.delayedAuto, locale).label}</em>
            </div>
            <ArrowRight className="svc-op-arrow" aria-hidden="true" />
            <div className={cx('svc-op-card', 'is-proposed', service.protected && 'is-blocked')}>
              <span>{t(locale, 'Proposed (preview)', 'المقترح (معاينة)')}</span>
              <strong>{plan ? plan.item.proposed.state || '—' : activeAction === 'stop' ? 'Stopped' : activeAction === 'start' || activeAction === 'restart' ? 'Running' : startup === 'delayed' ? 'Automatic' : startup}</strong>
              <em>{plan ? (plan.item.proposed.delayedAuto ? t(locale, 'Delayed automatic', 'تلقائي مؤجل') : startupMeta(plan.item.proposed.startupType, plan.item.proposed.delayedAuto, locale).label) : t(locale, 'Not staged', 'غير مُهيَّأ')}</em>
            </div>
          </div>
          <div className="svc-op-facts">
            <div><span>{t(locale, 'Direct dependents', 'تبعيات مباشرة')}</span><strong>{formatCount(impact?.directDependents.length || 0)}</strong></div>
            <div><span>{t(locale, 'Cascade dependents', 'تبعيات متسلسلة')}</span><strong>{formatCount(impact?.cascadeDependents.length || 0)}</strong></div>
            <div><span>{t(locale, 'Running affected', 'قيد التشغيل متأثرة')}</span><strong>{formatCount(impact?.runningDependents.length || 0)}</strong></div>
            <div><span>{t(locale, 'Protected affected', 'محمية متأثرة')}</span><strong>{formatCount(impact?.protectedDependents.length || 0)}</strong></div>
          </div>

          {plan ? (
            <div className="svc-op-plan" data-testid="services-plan-ready">
              <div className="svc-chip-row">
                <Chip tone={plan.item.protected ? 'bad' : 'warn'} icon={plan.item.protected ? ShieldAlert : Lock}>{plan.item.protected ? t(locale, 'Protected deny', 'منع الحماية') : t(locale, 'Review required', 'مراجعة مطلوبة')}</Chip>
                <Chip tone="warn">{t(locale, 'Elevation required', 'رفع صلاحيات مطلوب')}</Chip>
                <Chip tone="bad">{t(locale, 'Not executed', 'لم يُنفذ')}</Chip>
                <Chip tone="muted">{plan.receipt}</Chip>
              </div>
              {plan.item.conflicts.length ? (
                <ul className="svc-conflicts">
                  {plan.item.conflicts.map((conflict) => (
                    <li key={conflict}><AlertTriangle aria-hidden="true" />{conflict}</li>
                  ))}
                </ul>
              ) : <p className="svc-no-conflict"><CheckCircle2 aria-hidden="true" />{t(locale, 'No measured conflict. Execution still requires a separate approved executor.', 'لا تعارض مقيس. التنفيذ ما زال يتطلب منفذًا معتمدًا منفصلًا.')}</p>}
              <div className="svc-prereq-grid">
                {plan.item.prerequisites.map((entry) => (
                  <div key={entry.id} className={cx('svc-prereq', `is-${entry.status}`)}>
                    {entry.status === 'passed' ? <CheckCircle2 aria-hidden="true" /> : entry.status === 'failed' ? <XCircle aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
                    <div><strong>{locale === 'ar' ? entry.labelAr : entry.labelEn}</strong><em>{entry.detail}</em></div>
                  </div>
                ))}
              </div>
              <p className="svc-blocked-note"><Lock aria-hidden="true" />{plan.execution.reason}</p>
            </div>
          ) : (
            <p className="svc-op-hint">{t(locale, 'Stage a preview to compute measured conflicts and dependencies. Nothing is executed.', 'هيّئ معاينة لحساب التعارضات والاعتماديات المقيسة. لا يُنفذ شيء.')}</p>
          )}
        </>
      ) : (
        <p className="svc-op-hint">{t(locale, 'Select a service to preview an operation.', 'اختر خدمة لمعاينة عملية.')}</p>
      )}
    </div>
  );
}

export function DependencyGraph({
  locale,
  snapshot,
  service,
  onSelect,
}: {
  locale: ServicesLocale;
  snapshot: ServicesSnapshot;
  service: ServiceRecord | null;
  onSelect: (name: string) => void;
}) {
  const [hideProtected, setHideProtected] = useState(false);
  const byName = useMemo(() => new Map(snapshot.services.map((entry) => [entry.name.toLowerCase(), entry])), [snapshot.services]);
  const upstreamAll = (service?.dependencies || []).map((name) => byName.get(name.toLowerCase())).filter(Boolean) as ServiceRecord[];
  const downstreamAll = (service?.dependents || []).map((name) => byName.get(name.toLowerCase())).filter(Boolean) as ServiceRecord[];
  const upstream = upstreamAll.slice(0, 8);
  const downstream = downstreamAll.slice(0, 8);
  const filteredUp = hideProtected ? upstream.filter((entry) => !entry.protected) : upstream;
  const filteredDown = hideProtected ? downstream.filter((entry) => !entry.protected) : downstream;
  const positions = (count: number) => Array.from({ length: count }, (_, index) => (count <= 1 ? 50 : 14 + (index * 72) / (count - 1)));
  const upY = positions(filteredUp.length);
  const downY = positions(filteredDown.length);
  return (
    <div className="svc-graph-wrap">
      <div className="svc-graph-toolbar">
        <GitBranch aria-hidden="true" />
        <span>{t(locale, 'Measured dependency graph', 'رسم الاعتماديات المقيس')}</span>
        <button type="button" className={cx('sys-btn sys-btn-quiet', hideProtected && 'is-active')} aria-pressed={hideProtected} onClick={() => setHideProtected((value) => !value)}>
          <ShieldAlert aria-hidden="true" />{t(locale, 'Hide protected', 'إخفاء المحمية')}
        </button>
      </div>
      <div className="svc-graph">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {filteredUp.map((entry, index) => (
            <line key={`up-${entry.name}`} x1="20" y1={upY[index]} x2="50" y2="50" className="svc-graph-line" />
          ))}
          {filteredDown.map((entry, index) => (
            <line key={`down-${entry.name}`} x1="50" y1="50" x2="80" y2={downY[index]} className="svc-graph-line is-down" />
          ))}
        </svg>
        <div className="svc-graph-column is-up">
          {filteredUp.map((entry, index) => (
            <button key={entry.name} type="button" className={cx('svc-graph-node', entry.protected && 'is-protected')} style={{ top: `${upY[index]}%` }} onClick={() => onSelect(entry.name)} title={entry.protected ? entry.protectionReason || '' : entry.displayName || entry.name}>
              <strong>{entry.name}</strong>
              <em>{startupMeta(entry.startupType, entry.delayedAuto, locale).label}</em>
            </button>
          ))}
          {!filteredUp.length ? <span className="svc-graph-empty">{t(locale, 'No upstream', 'لا اعتماديات سابقة')}</span> : null}
        </div>
        <div className="svc-graph-center">
          {service ? (
            <button type="button" className={cx('svc-graph-node', 'is-center', service.protected && 'is-protected')} onClick={() => onSelect(service.name)}>
              <strong>{service.name}</strong>
              <em>{service.state || '—'}</em>
            </button>
          ) : <span className="svc-graph-empty">{t(locale, 'Select a service', 'اختر خدمة')}</span>}
        </div>
        <div className="svc-graph-column is-down">
          {filteredDown.map((entry, index) => (
            <button key={entry.name} type="button" className={cx('svc-graph-node', entry.protected && 'is-protected')} style={{ top: `${downY[index]}%` }} onClick={() => onSelect(entry.name)} title={entry.protected ? entry.protectionReason || '' : entry.displayName || entry.name}>
              <strong>{entry.name}</strong>
              <em>{startupMeta(entry.startupType, entry.delayedAuto, locale).label}</em>
            </button>
          ))}
          {!filteredDown.length ? <span className="svc-graph-empty">{t(locale, 'No dependents', 'لا تبعيات لاحقة')}</span> : null}
        </div>
      </div>
      <div className="svc-graph-legend">
        <span><ChevronRight aria-hidden="true" />{t(locale, 'Prerequisites', 'الاعتماديات السابقة')} {upstreamAll.length > 8 ? `(+${upstreamAll.length - 8})` : ''}</span>
        <span><ArrowRight aria-hidden="true" />{t(locale, 'Dependents', 'التبعيات اللاحقة')} {downstreamAll.length > 8 ? `(+${downstreamAll.length - 8})` : ''}</span>
      </div>
    </div>
  );
}

export function ServiceEventList({
  locale,
  events,
  selectedId,
  onSelect,
  max = 60,
}: {
  locale: ServicesLocale;
  events: ServiceEventRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  max?: number;
}) {
  const rows = events.slice(0, max);
  return (
    <div className="svc-events" role="listbox" aria-label={t(locale, 'Measured SCM events', 'أحداث SCM المقيسة')}>
      {rows.map((event) => {
        const level = eventLevelMeta(event.level);
        return (
          <button
            key={event.id}
            type="button"
            role="option"
            aria-selected={selectedId === event.id}
            className={cx('svc-event-row', selectedId === event.id && 'is-active', `is-${level.tone}`)}
            onClick={() => onSelect(event.id)}
          >
            <span className="svc-event-time">{formatTimestamp(event.at, locale)}</span>
            <span className={cx('svc-event-level', `is-${level.tone}`)}>{event.eventId ?? '—'}</span>
            <span className="svc-event-message">{event.message || t(locale, 'No message returned.', 'لم تُعد رسالة.')}</span>
            {event.serviceName ? <Chip tone="muted">{event.serviceName}</Chip> : null}
          </button>
        );
      })}
      {!rows.length ? <div className="svc-empty">{t(locale, 'No measured SCM event is available.', 'لا حدث SCM مقيس متاح.')}</div> : null}
    </div>
  );
}

export function OperationCountdown({ plan, locale }: { plan: ServiceOperationPlan | null; locale: ServicesLocale }) {
  if (!plan) return null;
  return (
    <div className="svc-op-footer">
      <span>{t(locale, 'Plan', 'الخطة')}: <code>{plan.receipt}</code></span>
      <span>{t(locale, 'Journal', 'السجل')}: {plan.journalRecorded ? t(locale, 'recorded', 'مسجّل') : t(locale, 'not recorded', 'غير مسجّل')}</span>
      <span><Lock aria-hidden="true" />{t(locale, 'Nothing executed', 'لم يُنفذ شيء')}</span>
    </div>
  );
}
