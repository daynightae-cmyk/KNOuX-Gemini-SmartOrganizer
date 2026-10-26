/**
 * Service Commander - register, control, undo, search and config (tools 01-05, 11).
 * Every operation is a preview; no SCM write channel exists.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  FileText,
  History,
  Lock,
  PlayCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Undo2,
} from 'lucide-react';
import type { ServicesJournalEntry, ServiceStartupType } from '../../shared/native-contracts';
import type { ServicesWorkbenchProps } from './ui';
import {
  Chip,
  DataRows,
  Panel,
  cx,
} from '../system/ui';
import {
  ServiceDossier,
  ServiceRegister,
  ServicesToolFrame,
  OperationDock,
  OperationCountdown,
} from './ui';
import {
  actionLabel,
  formatCount,
  formatTimestamp,
  planForService,
  startupMeta,
  stateTone,
  t,
} from './model';

/* 01 - SCM Service Register */
export function InventoryWorkbench({ locale, snapshot, controller }: ServicesWorkbenchProps) {
  const [selectedName, setSelectedName] = useState<string | null>(snapshot.services[0]?.name || null);
  const selected = snapshot.services.find((entry) => entry.name === selectedName) || null;
  return (
    <ServicesToolFrame
      toolId="services-inventory"
      locale={locale}
      foot={<><span><ChevronRight aria-hidden="true" />{formatCount(snapshot.summary.running)} {t(locale, 'running', 'تعمل')} · {formatCount(snapshot.summary.stopped)} {t(locale, 'stopped', 'متوقفة')}</span><span><Lock aria-hidden="true" />{t(locale, 'Read-only SCM register', 'سجل SCM للقراءة فقط')}</span></>}
    >
      <div className="svc-split-register">
        <Panel title={t(locale, 'Measured SCM register', 'سجل SCM المقيس')} sub={`${formatCount(snapshot.services.length)} ${t(locale, 'services', 'خدمة')}`} icon={FileText} bodyClassName="sys-panel-body-flush">
          <ServiceRegister locale={locale} services={snapshot.services} selectedName={selectedName} onSelect={setSelectedName} />
        </Panel>
        <div className="sys-stack">
          <Panel title={t(locale, 'Dossier', 'الملف')} icon={Search}>
            <ServiceDossier locale={locale} snapshot={snapshot} service={selected} />
          </Panel>
        </div>
      </div>
      <OperationDock locale={locale} snapshot={snapshot} controller={controller} service={selected} mode="both" />
    </ServicesToolFrame>
  );
}

/* 02 - State change review */
export function ControlWorkbench({ locale, snapshot, controller }: ServicesWorkbenchProps) {
  const [selectedName, setSelectedName] = useState<string | null>(snapshot.services.find((entry) => String(entry.state).toLowerCase() === 'running')?.name || snapshot.services[0]?.name || null);
  const selected = snapshot.services.find((entry) => entry.name === selectedName) || null;
  return (
    <ServicesToolFrame
      toolId="services-control"
      locale={locale}
      foot={<><span><PlayCircle aria-hidden="true" />{t(locale, 'Preview start/stop/restart', 'معاينة البدء/الإيقاف/إعادة التشغيل')}</span><span><Lock aria-hidden="true" />{t(locale, 'No SCM operation executed', 'لم تُنفذ أي عملية SCM')}</span></>}
    >
      <div className="svc-split-register">
        <Panel title={t(locale, 'Choose a service', 'اختر خدمة')} icon={SlidersHorizontal} bodyClassName="sys-panel-body-flush">
          <ServiceRegister locale={locale} services={snapshot.services} selectedName={selectedName} onSelect={setSelectedName} />
        </Panel>
        <div className="sys-stack">
          <Panel title={t(locale, 'Selected service', 'الخدمة المحددة')} icon={ShieldCheck}>
            <ServiceDossier locale={locale} snapshot={snapshot} service={selected} />
          </Panel>
        </div>
      </div>
      <OperationDock locale={locale} snapshot={snapshot} controller={controller} service={selected} mode="state" />
      <div className="svc-safety-row">
        <span><ShieldAlert aria-hidden="true" />{t(locale, 'Protected security/network/RPC/servicing/kernel services are denied by measured policy.', 'الخدمات الأمنية/الشبكية/RPC/الخدمة/النواة المحمية مرفوضة بالسياسة المقيسة.')}</span>
        <span><Lock aria-hidden="true" />{t(locale, 'High-risk operations never auto-elevate.', 'العمليات عالية الخطورة لا ترفع الصلاحيات تلقائيًا.')}</span>
      </div>
    </ServicesToolFrame>
  );
}

/* 03 - Startup policy journal / undo review */
export function UndoWorkbench({ locale, snapshot, controller }: ServicesWorkbenchProps) {
  const entries = controller.journal.length ? controller.journal : snapshot.journal;
  const startupEntries = entries.filter((entry) => entry.action === 'startup-type');
  const [selectedId, setSelectedId] = useState<string | null>(startupEntries[0]?.id || entries[0]?.id || null);
  const selected = entries.find((entry) => entry.id === selectedId) || entries[0] || null;
  const service = selected ? snapshot.services.find((entry) => entry.name === selected.serviceName) : null;
  const restoreTarget = (entry: ServicesJournalEntry | null): ServiceStartupType | null => {
    if (!entry?.currentStartupType) return null;
    const type = entry.currentStartupType === 'delayed' ? 'delayed' : entry.currentStartupType;
    return ['automatic', 'manual', 'disabled', 'delayed'].includes(type) ? type as ServiceStartupType : null;
  };
  const target = restoreTarget(selected);
  const plan = planForService(controller.plan, selected?.serviceName || null);
  return (
    <ServicesToolFrame
      toolId="services-undo"
      locale={locale}
      provider="Local preview journal"
      foot={<><span><History aria-hidden="true" />{formatCount(entries.length)} {t(locale, 'preview entries', 'مدخل معاينة')}</span><span><Lock aria-hidden="true" />{t(locale, 'No executed change to restore', 'لا تغيير منفذ للاستعادة')}</span></>}
    >
      <div className="sys-split-ledger">
        <Panel className="sys-ledger-panel" title={t(locale, 'Startup policy journal', 'سجل سياسة البدء')} sub={t(locale, 'Immutable previews only.', 'معاينات ثابتة فقط.')} icon={Undo2} bodyClassName="sys-panel-body-flush">
          {entries.length ? (
            <div className="svc-journal-list" role="listbox" aria-label={t(locale, 'Service journal entries', 'مدخلات سجل الخدمات')}>
              {entries.map((entry) => (
                <button key={entry.id} type="button" role="option" aria-selected={selected?.id === entry.id} className={cx('svc-journal-row', selected?.id === entry.id && 'is-active')} onClick={() => setSelectedId(entry.id)}>
                  <span className="svc-journal-time">{formatTimestamp(entry.at, locale)}</span>
                  <span className="svc-journal-copy">
                    <strong>{entry.title}</strong>
                    <em>{entry.summary}</em>
                  </span>
                  <Chip tone={entry.kind === 'blocked-preview' ? 'bad' : 'info'}>{actionLabel(entry.action, locale)}</Chip>
                </button>
              ))}
            </div>
          ) : (
            <div className="svc-empty"><FileText aria-hidden="true" /><strong>{t(locale, 'No preview entries yet', 'لا مدخلات معاينة بعد')}</strong><p>{t(locale, 'Stage a service preview first. The app never executes a service change.', 'هيّئ معاينة خدمة أولًا. لا ينفذ التطبيق أي تغيير خدمة.')}</p></div>
          )}
        </Panel>
        <div className="sys-stack">
          <Panel title={t(locale, 'Journal entry', 'مدخل السجل')} sub={selected?.receipt} icon={FileText}>
            {selected ? (
              <>
                <DataRows
                  rows={[
                    { label: t(locale, 'Service', 'الخدمة'), value: selected.displayName || selected.serviceName },
                    { label: t(locale, 'Action', 'الإجراء'), value: actionLabel(selected.action, locale) },
                    { label: t(locale, 'Original startup policy', 'سياسة البدء الأصلية'), value: selected.currentStartupType || '—' },
                    { label: t(locale, 'Proposed startup policy', 'سياسة البدء المقترحة'), value: selected.proposedStartupType || '—' },
                    { label: t(locale, 'Current measured policy', 'السياسة المقيسة الحالية'), value: service ? startupMeta(service.startupType, service.delayedAuto, locale).label : t(locale, 'Service not present', 'الخدمة غير موجودة') },
                    { label: t(locale, 'State', 'الحالة'), value: selected.currentState || '—' },
                    { label: t(locale, 'Protected', 'محمية'), value: selected.protected ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا'), tone: selected.protected ? 'bad' : 'good' },
                    { label: t(locale, 'Mutation', 'التغيير'), value: selected.mutation, tone: 'good' },
                  ]}
                />
                <p className="svc-op-hint">{t(locale, 'This is a recorded review, not an executed change. There is no original service state to roll back because nothing was changed.', 'هذه مراجعة مسجلة وليست تغييرًا منفذًا. لا توجد حالة خدمة أصلية للاستعادة لأن شيئًا لم يتغير.')}</p>
              </>
            ) : <p className="svc-op-hint">{t(locale, 'Select a journal entry.', 'اختر مدخل سجل.')}</p>}
          </Panel>
          <Panel title={t(locale, 'Restoration review', 'مراجعة الاستعادة')} icon={Undo2}>
            <p className="svc-op-hint">{t(locale, 'A restore draft is only a preview of returning the startup policy to the recorded original. It is not applied.', 'مسودة الاستعادة هي معاينة لإعادة سياسة البدء إلى الأصل المسجل فقط. لا تُطبق.')}</p>
            <button
              type="button"
              className="sys-btn sys-btn-primary"
              disabled={!service || !target || controller.busy === 'plan'}
              onClick={() => {
                if (service && target) void controller.stagePlan({ serviceName: service.name, action: 'startup-type', startupType: target });
              }}
            >
              <Undo2 aria-hidden="true" />{t(locale, 'Stage startup restore draft', 'تهيئة مسودة استعادة البدء')}
            </button>
            {plan ? <OperationCountdown plan={plan} locale={locale} /> : null}
            {plan ? (
              <div className="svc-op-facts">
                <div><span>{t(locale, 'Current', 'الحالي')}</span><strong>{plan.item.current.startupType || '—'}</strong></div>
                <div><span>{t(locale, 'Proposed', 'المقترح')}</span><strong>{plan.item.proposed.startupType || '—'}</strong></div>
                <div><span>{t(locale, 'Conflicts', 'التعارضات')}</span><strong>{formatCount(plan.item.conflicts.length)}</strong></div>
                <div><span>{t(locale, 'Executed', 'المنفذ')}</span><strong>0</strong></div>
              </div>
            ) : null}
          </Panel>
        </div>
      </div>
    </ServicesToolFrame>
  );
}

/* 06 - SCM keyboard-first query console */
export function SearchWorkbench({ locale, snapshot, controller }: ServicesWorkbenchProps) {
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedName, setSelectedName] = useState<string | null>(snapshot.services[0]?.name || null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return snapshot.services.slice(0, 60);
    return snapshot.services.filter((entry) => `${entry.name} ${entry.displayName || ''} ${entry.description || ''} ${entry.binaryPath || ''}`.toLowerCase().includes(needle)).slice(0, 80);
  }, [query, snapshot.services]);
  const selected = snapshot.services.find((entry) => entry.name === selectedName) || results[0] || null;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  return (
    <ServicesToolFrame
      toolId="services-search"
      locale={locale}
      foot={<><span><Search aria-hidden="true" />{formatCount(results.length)} {t(locale, 'matches', 'مطابقة')}</span><span><ChevronRight aria-hidden="true" />{t(locale, 'Press / to focus, ↑↓ to navigate', 'اضغط / للتركيز، ↑↓ للتنقل')}</span></>}
    >
      <div className="svc-search-console">
        <div className="svc-search-input">
          <Search aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setFocusedIndex(0); }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                const next = Math.min(results.length - 1, focusedIndex + 1);
                setFocusedIndex(next);
                if (results[next]) setSelectedName(results[next].name);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                const next = Math.max(0, focusedIndex - 1);
                setFocusedIndex(next);
                if (results[next]) setSelectedName(results[next].name);
              } else if (event.key === 'Enter' && results[focusedIndex]) {
                setSelectedName(results[focusedIndex].name);
              }
            }}
            placeholder={t(locale, 'Query service name, description or binary path…', 'استعلم باسم الخدمة أو الوصف أو المسار…')}
            aria-label={t(locale, 'SCM query', 'استعلام SCM')}
            autoFocus
          />
          <span className="svc-kbd">/</span>
        </div>
        <div className="sys-split-ledger">
          <Panel className="sys-ledger-panel" title={t(locale, 'Query results', 'نتائج الاستعلام')} sub={`${formatCount(results.length)} ${t(locale, 'matching services', 'خدمة مطابقة')}`} icon={Search} bodyClassName="sys-panel-body-flush">
            <div className="svc-query-list" role="listbox" aria-label={t(locale, 'SCM query results', 'نتائج استعلام SCM')}>
              {results.map((entry, index) => (
                <button
                  key={entry.name}
                  type="button"
                  role="option"
                  aria-selected={selected?.name === entry.name}
                  className={cx('svc-query-row', selected?.name === entry.name && 'is-active', focusedIndex === index && 'is-focused')}
                  onClick={() => { setSelectedName(entry.name); setFocusedIndex(index); }}
                >
                  <span className="svc-row-name"><strong>{entry.displayName || entry.name}</strong><em>{entry.name}</em></span>
                  <span><Chip tone={stateTone(entry.state)}>{entry.state || '—'}</Chip></span>
                  <span><Chip tone={startupMeta(entry.startupType, entry.delayedAuto, locale).tone}>{startupMeta(entry.startupType, entry.delayedAuto, locale).label}</Chip></span>
                  <span className="svc-row-account">{entry.account || '—'}</span>
                </button>
              ))}
              {!results.length ? <div className="svc-empty">{t(locale, 'No measured service matches the query.', 'لا خدمة مقيسة تطابق الاستعلام.')}</div> : null}
            </div>
          </Panel>
          <Panel title={t(locale, 'Quick inspection', 'فحص سريع')} icon={FileText}>
            <ServiceDossier locale={locale} snapshot={snapshot} service={selected} />
          </Panel>
        </div>
      </div>
    </ServicesToolFrame>
  );
}

/* 11 - Startup policy diff */
export function ConfigWorkbench({ locale, snapshot, controller }: ServicesWorkbenchProps) {
  const [selectedName, setSelectedName] = useState<string | null>(snapshot.services[0]?.name || null);
  const selected = snapshot.services.find((entry) => entry.name === selectedName) || null;
  const current = selected ? startupMeta(selected.startupType, selected.delayedAuto, locale) : null;
  return (
    <ServicesToolFrame
      toolId="services-config"
      locale={locale}
      foot={<><span><SlidersHorizontal aria-hidden="true" />{t(locale, 'Startup policy preview', 'معاينة سياسة البدء')}</span><span><Lock aria-hidden="true" />{t(locale, 'No configuration write exists', 'لا توجد كتابة تهيئة')}</span></>}
    >
      <div className="sys-split-2">
        <Panel title={t(locale, 'Choose a service', 'اختر خدمة')} icon={SlidersHorizontal} bodyClassName="sys-panel-body-flush">
          <ServiceRegister locale={locale} services={snapshot.services} selectedName={selectedName} onSelect={setSelectedName} />
        </Panel>
        <div className="sys-stack">
          <Panel title={t(locale, 'Current vs proposed', 'الحالي مقابل المقترح')} icon={FileText}>
            {selected ? (
              <>
                <DataRows
                  rows={[
                    { label: t(locale, 'Service', 'الخدمة'), value: `${selected.displayName || selected.name} (${selected.name})` },
                    { label: t(locale, 'Current startup policy', 'سياسة البدء الحالية'), value: current?.label || '—', tone: current?.tone },
                    { label: t(locale, 'Locked binary path', 'مسار الملف المقفل'), value: selected.binaryPath || '—', mono: true },
                    { label: t(locale, 'Locked logon account', 'حساب الدخول المقفل'), value: selected.account || '—' },
                    { label: t(locale, 'Privilege requirement', 'متطلب الصلاحية'), value: t(locale, 'Administrator (not granted in this session)', 'مسؤول (غير ممنوح في هذه الجلسة)'), tone: 'warn' },
                  ]}
                />
                <p className="svc-op-hint">{t(locale, 'Binary path, account and service identity are locked and never editable in this preview.', 'مسار الملف والحساب وهوية الخدمة مقفلة وغير قابلة للتعديل في هذه المعاينة.')}</p>
              </>
            ) : <p className="svc-op-hint">{t(locale, 'Select a measured service.', 'اختر خدمة مقيسة.')}</p>}
          </Panel>
          <Panel title={t(locale, 'Read-only fields', 'حقول للقراءة فقط')} icon={Lock}>
            <div className="svc-locked-fields">
              <span><Lock aria-hidden="true" />{t(locale, 'Binary path', 'مسار الملف')}</span>
              <span><Lock aria-hidden="true" />{t(locale, 'Service account', 'حساب الخدمة')}</span>
              <span><Lock aria-hidden="true" />{t(locale, 'Service type', 'نوع الخدمة')}</span>
            </div>
            <p className="svc-op-hint">{t(locale, 'Only a startup-type preview is available. No configuration is written.', 'تتوفر معاينة نوع البدء فقط. لا تُكتب أي تهيئة.')}</p>
          </Panel>
        </div>
      </div>
      <OperationDock locale={locale} snapshot={snapshot} controller={controller} service={selected} mode="startup" />
    </ServicesToolFrame>
  );
}
