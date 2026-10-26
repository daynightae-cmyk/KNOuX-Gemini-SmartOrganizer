/**
 * Recovery Lab - journal, handoff, restore and update workbenches (tools 09-12).
 * The journal is local and append-only; every entry states mutation:'none'.
 */
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileText,
  History,
  LifeBuoy,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import type { RepairJournalEntry, RepairToolId } from '../../shared/native-contracts';
import type { RepairWorkbenchProps } from './ui';
import {
  CommandPreview,
  PlanDock,
  RepairToolFrame,
  SafetyNote,
  EvidenceRows,
} from './ui';
import { journalFilter, journalTitle, planForTool, serviceStateTone, t } from './model';
import { Chip, DataRows, ExportButton, Panel, SearchBox, Seg, downloadJson } from '../system/ui';
import { toolLabel, TOOL_BY_ID } from './catalog';

/* 09 - Repair audit journal */
export function RepairHistoryWorkbench(props: RepairWorkbenchProps) {
  const { locale, snapshot, controller } = props;
  const entries = controller.journal.length ? controller.journal : snapshot.journal;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RepairToolId | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => journalFilter(entries, query, filter), [entries, filter, query]);
  const selected = entries.find((entry) => entry.id === selectedId) || filtered[0] || null;
  const filterOptions: Array<{ value: RepairToolId | 'all'; label: string }> = useMemo(() => {
    const ids = [...new Set(entries.flatMap((entry) => entry.toolIds))];
    return [{ value: 'all', label: t(locale, 'All tools', 'كل الأدوات') }, ...ids.map((id) => ({ value: id, label: toolLabel(id, locale) }))];
  }, [entries, locale]);
  return (
    <RepairToolFrame
      {...props}
      provider="Local append-only repair journal"
      foot={<><span><History aria-hidden="true" />{t(locale, 'Entries', 'المدخلات')}: {entries.length}</span><span><ShieldCheck aria-hidden="true" />{t(locale, 'Executed repairs', 'الإصلاحات المنفذة')}: 0</span></>}
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search previews or receipts…', 'ابحث في المعاينات أو الإيصالات…')} ariaLabel={t(locale, 'Search journal', 'بحث في السجل')} />
        <Seg<RepairToolId | 'all'>
          value={filter}
          onChange={setFilter}
          ariaLabel={t(locale, 'Filter by tool', 'تصفية حسب الأداة')}
          compact
          options={filterOptions}
        />
        <span className="sys-toolbar-spacer" />
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.refreshJournal()}>
          <RefreshCw aria-hidden="true" />{t(locale, 'Reload', 'إعادة تحميل')}
        </button>
        <ExportButton
          fileName="knoux-repair-journal.json"
          payload={{ exportedAt: new Date().toISOString(), readOnly: true, mutation: 'none', entries }}
          label={t(locale, 'Export journal', 'تصدير السجل')}
          onDone={(ok) => controller.showNotice(ok ? t(locale, 'Journal exported.', 'صُدّر السجل.') : t(locale, 'The journal export could not start.', 'تعذّر بدء تصدير السجل.'))}
        />
      </div>

      <div className="sys-split-ledger">
        <Panel className="sys-ledger-panel" title={t(locale, 'Repair audit journal', 'سجل تدقيق الإصلاح')} sub={`${filtered.length} ${t(locale, 'matching entries', 'مدخل مطابق')}`} icon={History} bodyClassName="sys-panel-body-flush">
          {filtered.length ? (
            <div className="rep-journal-list" role="listbox" aria-label={t(locale, 'Repair journal entries', 'مدخلات سجل الإصلاح')}>
              {filtered.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="option"
                  aria-selected={selected?.id === entry.id}
                  className={`rep-journal-row ${selected?.id === entry.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedId(entry.id)}
                >
                  <span className="rep-journal-time">{new Date(entry.at).toLocaleString(locale === 'ar' ? 'ar' : 'en-GB')}</span>
                  <span className="rep-journal-copy">
                    <strong>{journalTitle(entry, locale)}</strong>
                    <em>{entry.summary}</em>
                  </span>
                  <Chip tone={entry.kind === 'preview' ? 'info' : 'warn'}>{entry.kind}</Chip>
                </button>
              ))}
            </div>
          ) : (
            <div className="rep-empty">
              <FileText aria-hidden="true" />
              <strong>{t(locale, 'No repair previews yet', 'لا معاينات إصلاح بعد')}</strong>
              <p>{t(locale, 'Stage a preview from any repair tool. The journal records the immutable review, not a repair.', 'هيّئ معاينة من أي أداة إصلاح. يسجل السجل المراجعة الثابتة، وليس إصلاحًا.')}</p>
            </div>
          )}
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Journal entry', 'مدخل السجل')} sub={selected ? selected.receipt : undefined} icon={FileText}>
            {selected ? (
              <>
                <DataRows
                  rows={[
                    { label: t(locale, 'Recorded at', 'سُجل في'), value: new Date(selected.at).toLocaleString(locale === 'ar' ? 'ar' : 'en-GB') },
                    { label: t(locale, 'Kind', 'النوع'), value: selected.kind },
                    { label: t(locale, 'Tools', 'الأدوات'), value: selected.toolIds.map((id) => toolLabel(id, locale)).join(', ') },
                    { label: t(locale, 'Risk', 'الخطورة'), value: selected.risk },
                    { label: t(locale, 'Elevation', 'رفع الصلاحيات'), value: selected.elevationRequired ? t(locale, 'Required', 'مطلوب') : t(locale, 'Not required', 'غير مطلوب'), tone: selected.elevationRequired ? 'warn' : 'muted' },
                    { label: t(locale, 'Reboot', 'إعادة التشغيل'), value: selected.rebootRequired ? t(locale, 'Required', 'مطلوبة') : t(locale, 'Not required', 'غير مطلوبة'), tone: selected.rebootRequired ? 'bad' : 'muted' },
                    { label: t(locale, 'Mutation', 'التغيير'), value: selected.mutation, tone: 'good' },
                    { label: t(locale, 'Receipt', 'الإيصال'), value: selected.receipt, mono: true },
                  ]}
                />
                <p className="rep-impact">{selected.summary}</p>
                <Chip tone="good" icon={ShieldCheck}>{t(locale, 'Read-only entry', 'مدخل للقراءة فقط')}</Chip>
              </>
            ) : (
              <div className="rep-empty">
                <History aria-hidden="true" />
                <strong>{t(locale, 'Select an entry', 'اختر مدخلًا')}</strong>
                <p>{t(locale, 'A measured journal entry appears here.', 'يظهر مدخل سجل مقيس هنا.')}</p>
              </div>
            )}
          </Panel>
          <Panel title={t(locale, 'Journal integrity', 'سلامة السجل')} icon={ShieldCheck}>
            <DataRows
              rows={[
                { label: t(locale, 'Storage', 'التخزين'), value: t(locale, 'Local application profile', 'ملف التطبيق المحلي') },
                { label: t(locale, 'Executed repairs', 'الإصلاحات المنفذة'), value: '0', tone: 'good' },
                { label: t(locale, 'Machine changes', 'تغييرات الجهاز'), value: t(locale, 'None', 'لا شيء'), tone: 'good' },
                { label: t(locale, 'External upload', 'رفع خارجي'), value: t(locale, 'None', 'لا شيء'), tone: 'good' },
              ]}
            />
            <button type="button" className="sys-btn sys-btn-ghost" onClick={() => downloadJson('knoux-repair-journal.json', { entries, readOnly: true })}>
              <FileText aria-hidden="true" />{t(locale, 'Download journal copy', 'تنزيل نسخة السجل')}
            </button>
          </Panel>
        </div>
      </div>
    </RepairToolFrame>
  );
}

/* 10 - Troubleshooter gateway */
export function TroubleshootersWorkbench(props: RepairWorkbenchProps) {
  const { locale, snapshot } = props;
  const categories = snapshot.troubleshooters.categories;
  const [selectedId, setSelectedId] = useState(categories[0]?.id || 'network');
  const selected = categories.find((entry) => entry.id === selectedId) || categories[0] || null;
  return (
    <RepairToolFrame
      {...props}
      provider="Measured OS capability + allowlisted settings handoff"
      foot={<><span><LifeBuoy aria-hidden="true" />{t(locale, 'Categories', 'الفئات')}: {categories.length}</span><span><Lock aria-hidden="true" />{t(locale, 'No silent repair launch', 'لا إطلاق إصلاح صامت')}</span></>}
    >
      <div className="rep-capability-row">
        <Chip tone={snapshot.troubleshooters.msdtAvailable === true ? 'good' : snapshot.troubleshooters.msdtAvailable === false ? 'warn' : 'muted'}>
          msdt.exe: {snapshot.troubleshooters.msdtAvailable == null ? t(locale, 'unknown', 'مجهول') : snapshot.troubleshooters.msdtAvailable ? t(locale, 'present', 'موجود') : t(locale, 'not found', 'غير موجود')}
        </Chip>
        <Chip tone={snapshot.troubleshooters.commandAvailable === true ? 'good' : 'muted'}>
          Get-TroubleshootingPack: {snapshot.troubleshooters.commandAvailable == null ? t(locale, 'unknown', 'مجهول') : snapshot.troubleshooters.commandAvailable ? t(locale, 'available', 'متاح') : t(locale, 'not available', 'غير متاح')}
        </Chip>
        <Chip tone="info">{t(locale, 'Windows settings handoff', 'انتقال إعدادات Windows')}</Chip>
      </div>

      <div className="rep-category-grid">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`rep-category-card ${category.id === selectedId ? 'is-active' : ''}`}
            onClick={() => setSelectedId(category.id)}
            aria-pressed={category.id === selectedId}
          >
            <span className="rep-category-icon" aria-hidden="true">
              {category.id === 'network' ? <RefreshCw /> : category.id === 'audio' ? <LifeBuoy /> : category.id === 'printer' ? <FileText /> : <Terminal />}
            </span>
            <strong>{locale === 'ar' ? category.labelAr : category.labelEn}</strong>
            <em>{category.checklistEn.length} {t(locale, 'checkpoints', 'نقاط فحص')}</em>
          </button>
        ))}
      </div>

      <div className="sys-split-2">
        <Panel title={selected ? (locale === 'ar' ? selected.labelAr : selected.labelEn) : t(locale, 'Category', 'الفئة')} sub={t(locale, 'Read-only guided checklist', 'قائمة فحص موجهة للقراءة فقط')} icon={LifeBuoy}>
          {selected ? (
            <ol className="rep-check-list">
              {(locale === 'ar' ? selected.checklistAr : selected.checklistEn).map((item, index) => (
                <li key={item} className="is-done">
                  <span className="rep-check-index">{String(index + 1).padStart(2, '0')}</span>
                  <div><strong>{item}</strong><em>{t(locale, 'Guidance only — no status is assumed', 'إرشاد فقط — لا تُفترض أي حالة')}</em></div>
                  <ShieldCheck aria-hidden="true" />
                </li>
              ))}
            </ol>
          ) : null}
          <button type="button" className="sys-btn sys-btn-primary" onClick={() => void props.controller.openSettings(selected?.settingsTarget === 'windowsupdate' ? 'windowsupdate' : 'troubleshoot')}>
            <ArrowRight aria-hidden="true" />{t(locale, 'Open Windows troubleshooter settings', 'فتح إعدادات مستكشف الأعطال')}
          </button>
        </Panel>
        <Panel title={t(locale, 'Honest capability', 'قدرة صادقة')} icon={ShieldAlert}>
          <p className="rep-impact">{snapshot.troubleshooters.note}</p>
          <DataRows
            rows={[
              { label: t(locale, 'Launch a troubleshooter silently', 'إطلاق مستكشف أعطال بصمت'), value: t(locale, 'Not available', 'غير متاح'), tone: 'bad' },
              { label: t(locale, 'Open fixed settings', 'فتح إعدادات ثابتة'), value: t(locale, 'Available (user-initiated)', 'متاح (يبدأه المستخدم)'), tone: 'good' },
              { label: t(locale, 'Claim a troubleshooter exists', 'ادعاء وجود مستكشف'), value: t(locale, 'No — only measured capability', 'لا — القدرة المقيسة فقط'), tone: 'muted' },
            ]}
          />
          <SafetyNote locale={locale} tone="good">
            {t(locale, 'The category cards are guidance and settings handoffs. They do not run MSDT, PowerShell repair packs or silent commands.', 'بطاقات الفئات إرشاد وانتقالات إعدادات. لا تشغل MSDT أو حزم إصلاح PowerShell أو أوامر صامتة.')}
          </SafetyNote>
        </Panel>
      </div>
    </RepairToolFrame>
  );
}

/* 11 - System restore inspector */
export function RestorePointWorkbench(props: RepairWorkbenchProps) {
  const { locale, snapshot } = props;
  const points = snapshot.restore.points;
  const [selectedSequence, setSelectedSequence] = useState<number | null>(points[0]?.sequenceNumber ?? null);
  const selected = points.find((entry) => entry.sequenceNumber === selectedSequence) || points[0] || null;
  const planItem = planForTool(props.controller.plan, props.toolId);
  const statusLabel = snapshot.restore.status === 'available'
    ? t(locale, 'Available', 'متاح')
    : snapshot.restore.status === 'permission_denied'
      ? t(locale, 'Access denied', 'الوصول مرفوض')
      : t(locale, 'Unavailable', 'غير متاح');
  return (
    <RepairToolFrame
      {...props}
      provider="Get-ComputerRestorePoint"
      foot={<><span><Clock3 aria-hidden="true" />{t(locale, 'Restore points', 'نقاط الاستعادة')}: {points.length}</span><span><Lock aria-hidden="true" />{t(locale, 'Apply is gated', 'التطبيق محجوب')}</span></>}
    >
      <div className="rep-capability-row">
        <Chip tone={snapshot.restore.status === 'available' ? 'good' : snapshot.restore.status === 'permission_denied' ? 'warn' : 'muted'}>{statusLabel}</Chip>
        <Chip tone="muted">{snapshot.restore.source}</Chip>
        <Chip tone={snapshot.identity.isAdmin ? 'warn' : 'muted'}>{snapshot.identity.isAdmin ? t(locale, 'Elevated', 'مرفوع') : t(locale, 'Standard user', 'مستخدم عادي')}</Chip>
      </div>

      <div className="sys-split-ledger">
        <Panel className="sys-ledger-panel" title={t(locale, 'Restore point chain', 'سلسلة نقاط الاستعادة')} sub={snapshot.restore.reason || `${points.length} ${t(locale, 'measured point(s)', 'نقطة مقيسة')}`} icon={Clock3} bodyClassName="sys-panel-body-flush">
          {points.length ? (
            <div className="rep-points" role="listbox" aria-label={t(locale, 'Restore points', 'نقاط الاستعادة')}>
              {points.map((point) => (
                <button
                  key={point.sequenceNumber}
                  type="button"
                  role="option"
                  aria-selected={selected?.sequenceNumber === point.sequenceNumber}
                  className={`rep-point-row ${selected?.sequenceNumber === point.sequenceNumber ? 'is-active' : ''}`}
                  onClick={() => setSelectedSequence(point.sequenceNumber)}
                >
                  <span className="rep-point-index">{String(point.sequenceNumber).padStart(4, '0')}</span>
                  <span className="rep-point-copy">
                    <strong>{point.description || t(locale, 'No description', 'لا وصف')}</strong>
                    <em>{point.createdAt ? new Date(point.createdAt).toLocaleString(locale === 'ar' ? 'ar' : 'en-GB') : t(locale, 'timestamp unavailable', 'الطابع غير متاح')}</em>
                  </span>
                  <Chip tone="muted">{point.type || t(locale, 'Unknown type', 'نوع مجهول')}</Chip>
                </button>
              ))}
            </div>
          ) : (
            <div className="rep-empty">
              <ShieldAlert aria-hidden="true" />
              <strong>{statusLabel}</strong>
              <p>{snapshot.restore.reason || t(locale, 'Windows returned no restore point. None is invented.', 'لم يُعد Windows أي نقطة استعادة. لا يُختلق أي شيء.')}</p>
              <button type="button" className="sys-btn sys-btn-ghost" onClick={() => void props.controller.openSettings('recovery')}>
                <ArrowRight aria-hidden="true" />{t(locale, 'Open Windows recovery settings', 'فتح إعدادات استرداد Windows')}
              </button>
            </div>
          )}
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Restore metadata', 'بيانات الاستعادة')} sub={selected ? `#${selected.sequenceNumber}` : undefined} icon={Clock3}>
            {selected ? (
              <DataRows
                rows={[
                  { label: t(locale, 'Sequence', 'التسلسل'), value: String(selected.sequenceNumber), mono: true },
                  { label: t(locale, 'Description', 'الوصف'), value: selected.description || '—' },
                  { label: t(locale, 'Created', 'أُنشئت'), value: selected.createdAt ? new Date(selected.createdAt).toLocaleString(locale === 'ar' ? 'ar' : 'en-GB') : '—' },
                  { label: t(locale, 'Type', 'النوع'), value: selected.type || '—' },
                  { label: t(locale, 'Affected drives', 'الأقراص المتأثرة'), value: t(locale, 'Not exposed by Get-ComputerRestorePoint', 'غير متاح من Get-ComputerRestorePoint'), tone: 'muted' },
                ]}
              />
            ) : (
              <p className="sys-muted-text">{t(locale, 'No measured restore point is selected.', 'لا نقطة استعادة مقيسة محددة.')}</p>
            )}
            <EvidenceRows locale={locale} item={planItem} />
          </Panel>
          <PlanDock locale={locale} controller={props.controller} toolId={props.toolId} />
        </div>
      </div>

      {points.length ? (
        <button type="button" className="sys-btn sys-btn-ghost" onClick={() => void props.controller.openSettings('recovery')}>
          <ArrowRight aria-hidden="true" />{t(locale, 'Open Windows System Restore UI', 'فتح واجهة استعادة النظام في Windows')}
        </button>
      ) : null}
      <CommandPreview locale={locale} snapshot={snapshot} toolId={props.toolId} />
      <SafetyNote locale={locale} tone="bad">
        {t(locale, 'Applying a restore point reverts system state and may remove installed software. It is a user-initiated Windows action and is not available through this bridge.', 'تطبيق نقطة استعادة يعيد حالة النظام وقد يزيل برامج مثبتة. إجراء Windows يبدأه المستخدم وغير متاح عبر هذا الجسر.')}
      </SafetyNote>
    </RepairToolFrame>
  );
}

/* 12 - Windows Update reset */
export function UpdateResetWorkbench(props: RepairWorkbenchProps) {
  const { locale, snapshot } = props;
  const [view, setView] = useState<'services' | 'sequence'>('services');
  const planItem = planForTool(props.controller.plan, props.toolId);
  const steps = [
    { en: 'Capture service and cache evidence', ar: 'التقاط أدلة الخدمة والذاكرة', done: true },
    { en: 'Stop Windows Update and BITS', ar: 'إيقاف Windows Update وBITS', done: false },
    { en: 'Rename the SoftwareDistribution cache', ar: 'إعادة تسمية ذاكرة SoftwareDistribution', done: false },
    { en: 'Restart services and verify', ar: 'إعادة تشغيل الخدمات والتحقق', done: false },
  ];
  return (
    <RepairToolFrame
      {...props}
      provider="Get-Service + SoftwareDistribution metadata"
      foot={<><span><RefreshCw aria-hidden="true" />{t(locale, 'Update services', 'خدمات التحديث')}: {snapshot.update.services.length}</span><span><Lock aria-hidden="true" />{t(locale, 'Reset not executed', 'لم تُنفذ الإعادة')}</span></>}
    >
      <div className="sys-toolbar-row">
        <Seg<'services' | 'sequence'>
          value={view}
          onChange={setView}
          ariaLabel={t(locale, 'Update reset view', 'عرض إعادة التحديث')}
          compact
          options={[
            { value: 'services', label: t(locale, 'Services & cache', 'الخدمات والذاكرة') },
            { value: 'sequence', label: t(locale, 'Reset sequence', 'تسلسل الإعادة') },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <Chip tone={snapshot.identity.pendingReboot ? 'warn' : 'muted'}>{snapshot.identity.pendingReboot ? t(locale, 'Reboot pending', 'إعادة تشغيل معلقة') : t(locale, 'No pending reboot', 'لا إعادة تشغيل معلقة')}</Chip>
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void props.controller.openSettings('windowsupdate')}>
          <ArrowRight aria-hidden="true" />{t(locale, 'Windows Update settings', 'إعدادات Windows Update')}
        </button>
      </div>

      {view === 'services' ? (
        <div className="sys-split-2">
          <Panel title={t(locale, 'Update services', 'خدمات التحديث')} sub={t(locale, 'Measured state, no service is stopped.', 'حالة مقيسة، لا تُوقف أي خدمة.')} icon={Terminal}>
            <div className="rep-service-list">
              {snapshot.update.services.map((service) => (
                <div className="rep-service-row" key={service.name}>
                  <span className="rep-service-name">
                    <strong>{service.name}</strong>
                    <em>{service.displayName || '—'}</em>
                  </span>
                  <Chip tone={serviceStateTone(service.status)}>{service.status || '—'}</Chip>
                  <Chip tone="muted">{service.startType || '—'}</Chip>
                </div>
              ))}
              {!snapshot.update.services.length ? <p className="sys-muted-text">{t(locale, 'No update service row was measured.', 'لم يُقس أي صف خدمة تحديث.')}</p> : null}
            </div>
          </Panel>
          <Panel title={t(locale, 'Update cache', 'ذاكرة التحديث')} icon={FileText}>
            <DataRows
              rows={[
                { label: t(locale, 'SoftwareDistribution', 'SoftwareDistribution'), value: snapshot.update.softwareDistribution.exists ? t(locale, 'Present', 'موجود') : t(locale, 'Not found', 'غير موجود'), tone: snapshot.update.softwareDistribution.exists ? 'good' : 'warn' },
                { label: t(locale, 'Download folder', 'مجلد التنزيل'), value: snapshot.update.download.exists ? t(locale, 'Present', 'موجود') : t(locale, 'Not found', 'غير موجود') },
                { label: t(locale, 'Download items', 'عناصر التنزيل'), value: snapshot.update.download.items == null ? '—' : String(snapshot.update.download.items), mono: true },
                { label: t(locale, 'Pending reboot', 'إعادة التشغيل المعلقة'), value: snapshot.identity.pendingReboot ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا'), tone: snapshot.identity.pendingReboot ? 'warn' : 'muted' },
                { label: t(locale, 'Cache reset', 'إعادة الذاكرة'), value: t(locale, 'Preview only', 'معاينة فقط'), tone: 'bad' },
              ]}
            />
            <p className="rep-impact">{snapshot.update.note}</p>
            <EvidenceRows locale={locale} item={planItem} />
          </Panel>
        </div>
      ) : (
        <Panel title={t(locale, 'Servicing reset sequence (planned)', 'تسلسل إعادة الخدمة (مخطط)')} sub={t(locale, 'Every step is gated. Nothing is stopped or renamed.', 'كل خطوة محجوبة. لا يُوقف أو يُعاد تسمية أي شيء.')} icon={RefreshCw}>
          <ol className="rep-check-list">
            {steps.map((step, index) => (
              <li key={step.en} className={step.done ? 'is-done' : 'is-pending'}>
                <span className="rep-check-index">{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{locale === 'ar' ? step.ar : step.en}</strong><em>{step.done ? t(locale, 'Measured evidence available', 'دليل مقيس متاح') : t(locale, 'Not executed — administrative gate', 'لم يُنفذ — بوابة إدارية')}</em></div>
                {step.done ? <ShieldCheck aria-hidden="true" /> : <Lock aria-hidden="true" />}
              </li>
            ))}
          </ol>
          <SafetyNote locale={locale} tone="bad">
            {t(locale, 'A servicing reset stops update services and renames the update cache. It can remove pending downloads and requires a restart. No execution is available here.', 'إعادة تهيئة الخدمة توقف خدمات التحديث وتعيد تسمية ذاكرة التحديث. قد تزيل تنزيلات معلقة وتتطلب إعادة تشغيل. لا تنفيذ متاح هنا.')}
          </SafetyNote>
          <EvidenceRows locale={locale} item={planItem} />
        </Panel>
      )}

      <CommandPreview locale={locale} snapshot={snapshot} toolId={props.toolId} />
      <PlanDock locale={locale} controller={props.controller} toolId={props.toolId} />
    </RepairToolFrame>
  );
}
