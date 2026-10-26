/**
 * Service Commander - dependencies, protected core, cascade and diagnostics (04, 05, 09, 10).
 */
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Copy,
  FileText,
  GitBranch,
  GitFork,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import type { ServicesWorkbenchProps } from './ui';
import {
  Chip,
  CopyButton,
  DataRows,
  Panel,
  Seg,
  cx,
} from '../system/ui';
import {
  DependencyGraph,
  ServiceDossier,
  ServiceEventList,
  ServiceRegister,
  ServicesToolFrame,
  OperationDock,
  ProtectionChip,
} from './ui';
import {
  dependencyImpact,
  eventLevelMeta,
  eventMatchesService,
  formatCount,
  formatTimestamp,
  protectionRoleLabel,
  startupMeta,
  stateTone,
  t,
} from './model';

/* 04 - Dependency network */
export function DependenciesWorkbench({ locale, snapshot, controller }: ServicesWorkbenchProps) {
  const [selectedName, setSelectedName] = useState<string | null>(snapshot.services.find((entry) => entry.dependencies.length || entry.dependents.length)?.name || snapshot.services[0]?.name || null);
  const selected = snapshot.services.find((entry) => entry.name === selectedName) || null;
  const impact = selected ? dependencyImpact(snapshot, selected) : null;
  return (
    <ServicesToolFrame
      toolId="services-dependencies"
      locale={locale}
      foot={<><span><GitBranch aria-hidden="true" />{formatCount(snapshot.edges.length)} {t(locale, 'measured edges', 'حافة مقيسة')}</span><span><Lock aria-hidden="true" />{t(locale, 'Read-only graph', 'رسم للقراءة فقط')}</span></>}
    >
      <div className="sys-split-ledger">
        <Panel title={t(locale, 'Dependency map', 'خريطة الاعتماديات')} sub={selected ? `${selected.name} · ${impact?.upstream.length || 0} upstream · ${impact?.directDependents.length || 0} downstream` : undefined} icon={GitBranch}>
          <DependencyGraph locale={locale} snapshot={snapshot} service={selected} onSelect={setSelectedName} />
        </Panel>
        <div className="sys-stack">
          <Panel title={t(locale, 'Dependency inspector', 'فاحص الاعتماديات')} icon={FileText}>
            {selected ? (
              <DataRows
                rows={[
                  { label: t(locale, 'Selected service', 'الخدمة المحددة'), value: `${selected.displayName || selected.name} (${selected.name})` },
                  { label: t(locale, 'Prerequisites', 'الاعتماديات السابقة'), value: selected.dependencies.length ? selected.dependencies.join(', ') : t(locale, 'None measured', 'لا يوجد مقيس'), mono: true },
                  { label: t(locale, 'Direct dependents', 'التبعيات المباشرة'), value: selected.dependents.length ? selected.dependents.join(', ') : t(locale, 'None measured', 'لا يوجد مقيس'), mono: true },
                  { label: t(locale, 'Cascade dependents', 'التسلسل'), value: String(impact?.cascadeDependents.length || 0), mono: true },
                  { label: t(locale, 'Protected affected', 'المحمية المتأثرة'), value: String(impact?.protectedDependents.length || 0), tone: impact?.protectedDependents.length ? 'bad' : 'good' },
                  { label: t(locale, 'Running affected', 'قيد التشغيل المتأثرة'), value: String(impact?.runningDependents.length || 0), tone: impact?.runningDependents.length ? 'warn' : 'good' },
                ]}
              />
            ) : <p className="svc-op-hint">{t(locale, 'Select a measured node.', 'اختر عقدة مقيسة.')}</p>}
          </Panel>
          <Panel title={t(locale, 'Protected neighbours', 'الجيران المحميون')} icon={ShieldAlert}>
            <div className="svc-chip-row">
              {[...(impact?.upstream || []), ...(impact?.cascadeDependents || [])].filter((name) => snapshot.services.find((entry) => entry.name === name)?.protected).slice(0, 12).map((name) => (
                <Chip key={name} tone="bad" icon={Lock}>{name}</Chip>
              ))}
              {![...(impact?.upstream || []), ...(impact?.cascadeDependents || [])].some((name) => snapshot.services.find((entry) => entry.name === name)?.protected) ? <Chip tone="good" icon={ShieldCheck}>{t(locale, 'No protected neighbour measured', 'لا جار محمي مقيس')}</Chip> : null}
            </div>
            <p className="svc-op-hint">{t(locale, 'Edges are computed from measured Win32_Service dependencies. Absent names are not drawn.', 'تُحسب الحواف من اعتماديات Win32_Service المقيسة. الأسماء الغائبة لا تُرسم.')}</p>
          </Panel>
        </div>
      </div>
      <Panel title={t(locale, 'Selected service dossier', 'ملف الخدمة المحددة')} icon={Search}>
        <ServiceDossier locale={locale} snapshot={snapshot} service={selected} />
      </Panel>
    </ServicesToolFrame>
  );
}

/* 05 - Protected core atlas */
export function ProtectedWorkbench({ locale, snapshot, controller }: ServicesWorkbenchProps) {
  const protectedServices = useMemo(() => snapshot.services.filter((entry) => entry.protected), [snapshot.services]);
  const roles = useMemo(() => [...new Set(protectedServices.map((entry) => entry.protectionRole).filter(Boolean))] as string[], [protectedServices]);
  const [role, setRole] = useState<string | 'all'>('all');
  const [selectedName, setSelectedName] = useState<string | null>(protectedServices[0]?.name || null);
  const visible = role === 'all' ? protectedServices : protectedServices.filter((entry) => entry.protectionRole === role);
  const selected = protectedServices.find((entry) => entry.name === selectedName) || visible[0] || null;
  return (
    <ServicesToolFrame
      toolId="services-protected"
      locale={locale}
      foot={<><span><ShieldAlert aria-hidden="true" />{formatCount(protectedServices.length)} {t(locale, 'protected services', 'خدمة محمية')}</span><span><Lock aria-hidden="true" />{t(locale, 'Control denied by policy', 'التحكم مرفوض بالسياسة')}</span></>}
    >
      <div className="sys-toolbar-row">
        <Seg<string | 'all'>
          value={role}
          onChange={setRole}
          ariaLabel={t(locale, 'Filter protection reason', 'تصفية سبب الحماية')}
          compact
          options={[{ value: 'all', label: t(locale, 'All roles', 'كل الأدوار') }, ...roles.map((entry) => ({ value: entry, label: protectionRoleLabel(entry, locale) }))]}
        />
        <span className="sys-toolbar-spacer" />
        <Chip tone="bad" icon={ShieldAlert}>{t(locale, 'Capability policy', 'سياسة القدرات')}</Chip>
      </div>
      <div className="sys-split-ledger">
        <Panel className="sys-ledger-panel" title={t(locale, 'Protected register', 'السجل المحمي')} sub={`${formatCount(visible.length)} ${t(locale, 'matching', 'مطابق')}`} icon={ShieldAlert} bodyClassName="sys-panel-body-flush">
          <ServiceRegister locale={locale} services={visible} selectedName={selected?.name || null} onSelect={setSelectedName} initialProtectedOnly title={t(locale, 'Protected services', 'الخدمات المحمية')} sub={t(locale, 'Derived from role, driver type, account and stoppability.', 'مشتقة من الدور ونوع التعريف والحساب وقابلية الإيقاف.')} />
        </Panel>
        <div className="sys-stack">
          <Panel title={t(locale, 'Protection explanation', 'شرح الحماية')} sub={selected?.name} icon={ShieldCheck}>
            {selected ? (
              <>
                <div className="svc-protection-hero">
                  <span className="svc-protection-icon" aria-hidden="true"><ShieldAlert /></span>
                  <div>
                    <strong>{protectionRoleLabel(selected.protectionRole, locale)}</strong>
                    <em>{selected.protectionReason || t(locale, 'Denied by capability policy.', 'مرفوضة بسياسة القدرات.')}</em>
                  </div>
                  <ProtectionChip service={selected} locale={locale} />
                </div>
                <DataRows
                  rows={[
                    { label: t(locale, 'Critical role', 'الدور الحرج'), value: protectionRoleLabel(selected.protectionRole, locale), tone: 'bad' },
                    { label: t(locale, 'Service type', 'نوع الخدمة'), value: selected.serviceType || '—', mono: true },
                    { label: t(locale, 'Account', 'الحساب'), value: selected.account || '—' },
                    { label: t(locale, 'Accepts stop', 'يقبل الإيقاف'), value: selected.acceptsStop == null ? '—' : selected.acceptsStop ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا'), tone: selected.acceptsStop ? 'warn' : 'bad' },
                    { label: t(locale, 'Denied operations', 'العمليات المرفوضة'), value: t(locale, 'Start · Stop · Restart · Startup policy', 'بدء · إيقاف · إعادة تشغيل · سياسة بدء'), tone: 'bad' },
                  ]}
                />
              </>
            ) : <p className="svc-op-hint">{t(locale, 'No protected service matched.', 'لا خدمة محمية مطابقة.')}</p>}
          </Panel>
          <Panel title={t(locale, 'Denied operation preview', 'معاينة العملية المرفوضة')} icon={Lock}>
            <p className="svc-op-hint">{t(locale, 'The preview can still be staged so the denial is visible and recorded. Nothing can execute.', 'يمكن تهيئة المعاينة لإظهار الرفض وتسجيله. لا شيء قابل للتنفيذ.')}</p>
            <OperationDock locale={locale} snapshot={snapshot} controller={controller} service={selected} mode="state" />
          </Panel>
        </div>
      </div>
    </ServicesToolFrame>
  );
}

/* 09 - Cascade impact tree */
export function DependentsWorkbench({ locale, snapshot, controller }: ServicesWorkbenchProps) {
  const candidates = useMemo(() => snapshot.services.filter((entry) => entry.dependents.length), [snapshot.services]);
  const [selectedName, setSelectedName] = useState<string | null>(candidates[0]?.name || snapshot.services[0]?.name || null);
  const selected = snapshot.services.find((entry) => entry.name === selectedName) || null;
  const impact = selected ? dependencyImpact(snapshot, selected) : null;
  const risk = impact ? (impact.protectedDependents.length ? 'high' : impact.runningDependents.length ? 'medium' : 'low') : 'unknown';
  return (
    <ServicesToolFrame
      toolId="services-dependents"
      locale={locale}
      foot={<><span><GitFork aria-hidden="true" />{formatCount(impact?.cascadeDependents.length || 0)} {t(locale, 'cascade dependents', 'تبعية متسلسلة')}</span><span><Lock aria-hidden="true" />{t(locale, 'Read-only impact', 'أثر للقراءة فقط')}</span></>}
    >
      <div className="sys-split-2">
        <Panel title={t(locale, 'Select root service', 'اختر الخدمة الجذر')} icon={GitFork} bodyClassName="sys-panel-body-flush">
          <ServiceRegister locale={locale} services={candidates.length ? candidates : snapshot.services} selectedName={selectedName} onSelect={setSelectedName} />
        </Panel>
        <div className="sys-stack">
          <Panel title={t(locale, 'Cascade impact', 'الأثر المتسلسل')} sub={selected?.name} icon={AlertTriangle}>
            {selected ? (
              <>
                <div className="svc-risk-hero">
                  <div className={`svc-risk-meter is-${risk}`}><span /></div>
                  <div>
                    <strong>{risk === 'high' ? t(locale, 'High cascade risk', 'خطر تسلسل مرتفع') : risk === 'medium' ? t(locale, 'Medium cascade risk', 'خطر تسلسل متوسط') : t(locale, 'Low cascade risk', 'خطر تسلسل منخفض')}</strong>
                    <em>{formatCount(impact?.directDependents.length || 0)} {t(locale, 'direct', 'مباشر')} · {formatCount(impact?.cascadeDependents.length || 0)} {t(locale, 'cascade', 'متسلسل')} · {formatCount(impact?.runningDependents.length || 0)} {t(locale, 'running', 'قيد التشغيل')}</em>
                  </div>
                </div>
                <div className="svc-tree">
                  <div className="svc-tree-root">
                    <span className="svc-tree-dot" aria-hidden="true" />
                    <div><strong>{selected.name}</strong><em>{t(locale, 'Root service', 'الخدمة الجذر')}</em></div>
                    <Chip tone={stateTone(selected.state)}>{selected.state || '—'}</Chip>
                  </div>
                  {impact?.directDependents.map((name) => {
                    const node = snapshot.services.find((entry) => entry.name === name);
                    return (
                      <div className="svc-tree-branch" key={name}>
                        <span className="svc-tree-line" aria-hidden="true" />
                        <span className="svc-tree-dot" aria-hidden="true" />
                        <div><strong>{node?.displayName || name}</strong><em>{name} · {node?.state || '—'} · {startupMeta(node?.startupType || null, node?.delayedAuto || null, locale).label}</em></div>
                        {node?.protected ? <Chip tone="bad">{t(locale, 'Protected', 'محمية')}</Chip> : null}
                      </div>
                    );
                  })}
                  {!impact?.directDependents.length ? <p className="svc-op-hint">{t(locale, 'No direct dependent is measured for this service.', 'لا تبعية مباشرة مقيسة لهذه الخدمة.')}</p> : null}
                </div>
              </>
            ) : <p className="svc-op-hint">{t(locale, 'Select a root service.', 'اختر خدمة جذر.')}</p>}
          </Panel>
          <Panel title={t(locale, 'Stop risk review', 'مراجعة خطر الإيقاف')} icon={Lock}>
            <OperationDock locale={locale} snapshot={snapshot} controller={controller} service={selected} mode="state" />
          </Panel>
        </div>
      </div>
    </ServicesToolFrame>
  );
}

/* 10 - SCM fault diagnostics */
export function DiagnoseWorkbench({ locale, snapshot, controller }: ServicesWorkbenchProps) {
  const [selectedName, setSelectedName] = useState<string | null>(snapshot.services[0]?.name || null);
  const [windowHours, setWindowHours] = useState<'24' | '168' | 'all'>('168');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const selected = snapshot.services.find((entry) => entry.name === selectedName) || null;
  const events = useMemo(() => {
    const cutoff = windowHours === 'all' ? 0 : Date.now() - Number(windowHours) * 3600000;
    return snapshot.events.filter((event) => eventMatchesService(event, selected) && (!cutoff || (event.at && new Date(event.at).getTime() >= cutoff)));
  }, [selected, snapshot.events, windowHours]);
  const selectedEvent = events.find((entry) => entry.id === selectedEventId) || events[0] || null;
  const checklist = [
    { id: 'state', en: 'Confirm measured state and start type.', ar: 'تحقق من الحالة ونوع البدء المقيسين.' },
    { id: 'deps', en: 'Review prerequisite services and dependent impact.', ar: 'راجع الخدمات السابقة وأثر التبعيات.' },
    { id: 'events', en: 'Read SCM event excerpts in the selected time window.', ar: 'اقرأ مقتطفات أحداث SCM في النافذة المحددة.' },
    { id: 'protected', en: 'Confirm the service is not denied by protection policy.', ar: 'تأكد أن الخدمة غير مرفوضة بسياسة الحماية.' },
    { id: 'approval', en: 'Any real operation needs a separate elevated approval.', ar: 'أي عملية حقيقية تتطلب موافقة مرفوعة منفصلة.' },
  ];
  return (
    <ServicesToolFrame
      toolId="services-diagnose"
      locale={locale}
      foot={<><span><Wrench aria-hidden="true" />{formatCount(events.length)} {t(locale, 'matching events', 'حدث مطابق')}</span><span><Lock aria-hidden="true" />{t(locale, 'No repair executed', 'لم يُنفذ إصلاح')}</span></>}
    >
      <div className="sys-toolbar-row">
        <Search className="svc-inline-icon" aria-hidden="true" />
        <label className="svc-inline-label" htmlFor="svc-diagnose-service">{t(locale, 'Service', 'الخدمة')}</label>
        <select id="svc-diagnose-service" className="sys-input" value={selectedName || ''} onChange={(event) => { setSelectedName(event.target.value); setSelectedEventId(null); }} aria-label={t(locale, 'Choose service', 'اختر الخدمة')}>
          {snapshot.services.map((entry) => <option key={entry.name} value={entry.name}>{entry.name} — {entry.displayName || ''}</option>)}
        </select>
        <Seg<'24' | '168' | 'all'>
          value={windowHours}
          onChange={setWindowHours}
          ariaLabel={t(locale, 'Time range', 'النطاق الزمني')}
          compact
          options={[
            { value: '24', label: '24h' },
            { value: '168', label: '7d' },
            { value: 'all', label: t(locale, 'All', 'الكل') },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <Chip tone={snapshot.eventCoverage.status === 'available' ? 'good' : 'warn'}>{snapshot.eventCoverage.status}</Chip>
      </div>

      <div className="sys-split-ledger">
        <Panel title={t(locale, 'SCM event waterfall', 'تدفق أحداث SCM')} sub={selected ? `${selected.name} · ${events.length} ${t(locale, 'events', 'حدث')}` : undefined} icon={AlertTriangle} bodyClassName="sys-panel-body-flush">
          <ServiceEventList locale={locale} events={events} selectedId={selectedEvent?.id || null} onSelect={setSelectedEventId} max={80} />
        </Panel>
        <div className="sys-stack">
          <Panel title={t(locale, 'Event excerpt', 'مقتطف الحدث')} sub={selectedEvent ? `Event ${selectedEvent.eventId}` : undefined} icon={FileText}>
            {selectedEvent ? (
              <>
                <DataRows
                  rows={[
                    { label: t(locale, 'Timestamp', 'الطابع'), value: formatTimestamp(selectedEvent.at, locale) },
                    { label: t(locale, 'Event ID', 'معرف الحدث'), value: String(selectedEvent.eventId ?? '—'), mono: true },
                    { label: t(locale, 'Level', 'المستوى'), value: eventLevelMeta(selectedEvent.level).en, tone: eventLevelMeta(selectedEvent.level).tone },
                    { label: t(locale, 'Service', 'الخدمة'), value: selectedEvent.serviceName || selected?.name || '—', mono: true },
                    { label: t(locale, 'Provider', 'المزود'), value: selectedEvent.provider },
                  ]}
                />
                <pre className="svc-event-message-full">{selectedEvent.message || t(locale, 'No message returned.', 'لم تُعد رسالة.')}</pre>
                <CopyButton locale={locale} text={`Event ${selectedEvent.eventId}: ${selectedEvent.message}`} label={t(locale, 'Copy error evidence', 'نسخ دليل الخطأ')} />
                <p className="svc-op-hint">{t(locale, 'SCM event IDs are shown as measured. Exit codes are not inferred from a message.', 'تُعرض معرفات أحداث SCM كما قيست. لا تُستنتج رموز الخروج من الرسالة.')}</p>
              </>
            ) : <p className="svc-op-hint">{t(locale, 'No event is selected or available.', 'لا حدث محدد أو متاح.')}</p>}
          </Panel>
          <Panel title={t(locale, 'Safe diagnostic checklist', 'قائمة تشخيص آمنة')} icon={ShieldCheck}>
            <ul className="svc-checklist">
              {checklist.map((item) => (
                <li key={item.id}>
                  <label>
                    <input type="checkbox" checked={checked.has(item.id)} onChange={() => setChecked((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })} />
                    <span>{locale === 'ar' ? item.ar : item.en}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="svc-op-hint">{t(locale, 'Checklist state is local and does not authorize any operation.', 'حالة القائمة محلية ولا تصرح بأي عملية.')}</p>
          </Panel>
        </div>
      </div>
    </ServicesToolFrame>
  );
}
