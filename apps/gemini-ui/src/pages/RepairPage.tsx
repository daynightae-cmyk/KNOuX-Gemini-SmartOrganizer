/**
 * KNOuX SmartOrganizer - Recovery Lab (Mission 11).
 *
 * Browser previews render an explicit native-required state. In Electron every
 * evidence value, command preview, prerequisite and journal entry comes from
 * the read-only RepairBridge. DISM, SFC, DNS/Winsock/TCPIP reset, restore and
 * update servicing have no execution channel.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  FileText,
  Globe2,
  HardDrive,
  History,
  Layers,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  X,
} from 'lucide-react';
import type { RepairJournalEntry, RepairToolId } from '../../shared/native-contracts';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXSidebar, KNOuXTitleBar } from '../components/shell/KNOuXShellComponents';
import { GUIDED_STEPS, REPAIR_TOOLS, RISK_META, STATE_META, TOOL_BY_ID, isRepairToolId, toolLabel, type RepairLocale } from '../repair/catalog';
import {
  commandDisplay,
  commandForTool,
  formatCount,
  formatTimestamp,
  journalTitle,
  planForTool,
  riskMeta,
  t,
} from '../repair/model';
import { useRepair } from '../repair/useRepair';
import { RepairServiceWorkspace } from '../repair/RepairServiceWorkspaces';
import { Chip, CopyButton, SearchBox, downloadJson, cx } from '../system/ui';
import { GuidedSequence } from '../repair/ui';
import '../repair.css';

export interface RepairPageProps {
  onNavigateSection?: (section: string) => void;
}

const AR = 'ar';

export function RepairPage({ onNavigateSection }: RepairPageProps) {
  const { navigateTo, locale: globalLocale, toggleLocale } = useNavigation();
  const [localLocale, setLocalLocale] = useState<RepairLocale | null>(null);
  const locale: RepairLocale = localLocale || (globalLocale === 'ar' ? 'ar' : 'en');
  const controller = useRepair();
  const snapshot = controller.snapshot;

  const [selectedToolId, setSelectedToolId] = useState<RepairToolId>('repair-component-scan');
  const [query, setQuery] = useState('');
  const [activeWorkbench, setActiveWorkbench] = useState<RepairToolId | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const selectedTool = TOOL_BY_ID[selectedToolId];
  const SelectedToolIcon = selectedTool.icon;
  const selectedPlan = planForTool(controller.plan, selectedToolId);
  const selectedCommand = commandForTool(snapshot, selectedToolId);

  const visibleTools = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return REPAIR_TOOLS;
    return REPAIR_TOOLS.filter((entry) =>
      [entry.id, entry.en, entry.ar, entry.shortEn, entry.shortAr, entry.provider, entry.blurbEn, entry.blurbAr]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);

  const journal = controller.journal.length ? controller.journal : snapshot?.journal || [];
  const recentJournal = journal.slice(0, 5);

  useEffect(() => {
    if (activeWorkbench && !snapshot) setActiveWorkbench(null);
  }, [activeWorkbench, snapshot]);

  const openWorkbench = useCallback((id: RepairToolId) => {
    if (!controller.snapshot) {
      controller.showNotice(t(locale, 'Run the measured Recovery Lab discovery before opening a workbench.', 'شغّل اكتشاف مختبر الاستعادة المقيس قبل فتح مساحة العمل.'));
      return;
    }
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setActiveWorkbench(id);
  }, [controller, locale]);

  const closeWorkbench = useCallback(() => {
    setActiveWorkbench(null);
    window.setTimeout(() => triggerRef.current?.focus(), 30);
  }, []);

  const stageSelected = useCallback(async () => {
    if (!snapshot) {
      controller.showNotice(t(locale, 'Measured evidence is required before staging a preview.', 'الأدلة المقيسة مطلوبة قبل تهيئة المعاينة.'));
      return;
    }
    await controller.stagePlan([selectedToolId]);
  }, [controller, locale, selectedToolId, snapshot]);

  const exportReport = useCallback(async () => {
    if (!snapshot) {
      controller.showNotice(t(locale, 'Run the measured discovery before exporting a report.', 'شغّل الاكتشاف المقيس قبل تصدير تقرير.'));
      return;
    }
    const report = await controller.loadReport(true);
    if (report) {
      const ok = downloadJson('knoux-recovery-lab-report.json', report);
      controller.showNotice(ok ? t(locale, 'Read-only recovery report exported.', 'صُدّر تقرير الاستعادة للقراءة فقط.') : t(locale, 'The report export could not start.', 'تعذّر بدء تصدير التقرير.'));
    }
  }, [controller, locale, snapshot]);

  const navigate = (section: string) => {
    if (onNavigateSection) onNavigateSection(section);
    else navigateTo(section);
  };

  const scanStatus = controller.scanning
    ? t(locale, 'Measuring repair evidence', 'جارٍ قياس أدلة الإصلاح')
    : snapshot
      ? t(locale, 'Measured evidence ready', 'الأدلة المقيسة جاهزة')
      : controller.nativeAvailable
        ? t(locale, 'Awaiting measured discovery', 'بانتظار الاكتشاف المقيس')
        : t(locale, 'Native measurement required', 'القياس الأصلي مطلوب');

  const elevationLabel = snapshot
    ? snapshot.identity.isAdmin == null
      ? t(locale, 'Unknown', 'مجهول')
      : snapshot.identity.isAdmin
        ? t(locale, 'Elevated', 'مرفوع الصلاحيات')
        : t(locale, 'Standard user', 'مستخدم عادي')
    : t(locale, 'Not measured', 'غير مقيس');

  const elevationTone = snapshot?.identity.isAdmin === true ? 'warn' : snapshot?.identity.isAdmin === false ? 'good' : 'muted';

  const selectedSettingsTarget = selectedToolId === 'repair-update-reset'
    ? 'windowsupdate'
    : selectedToolId === 'repair-restore-point'
      ? 'recovery'
      : ['repair-dns-flush', 'repair-winsock-reset', 'repair-tcpip-reset', 'repair-troubleshooters'].includes(selectedToolId)
        ? 'troubleshoot'
        : null;

  const renderToolCard = (entry: (typeof REPAIR_TOOLS)[number]) => {
    const risk = RISK_META[entry.risk];
    const state = STATE_META[entry.state];
    const Icon = entry.icon;
    return (
      <button
        key={entry.id}
        type="button"
        className={cx('rep-tool-card', entry.id === selectedToolId && 'is-active')}
        data-testid={`repair-tool-${entry.id}`}
        onClick={() => setSelectedToolId(entry.id)}
        aria-pressed={entry.id === selectedToolId}
      >
        <span className="rep-tool-index">{String(entry.index).padStart(2, '0')}</span>
        <span className="rep-tool-icon" style={{ color: entry.accent }} aria-hidden="true">
          <Icon />
        </span>
        <span className="rep-tool-copy">
          <strong>{locale === AR ? entry.ar : entry.en}</strong>
          <em>{entry.provider}</em>
        </span>
        <span className="rep-tool-badges">
          <Chip tone={state.tone}>{t(locale, state.en, state.ar)}</Chip>
          <Chip tone={risk.tone}>{t(locale, risk.en, risk.ar)}</Chip>
        </span>
      </button>
    );
  };

  return (
    <div className={cx('sys-viewport rep-viewport', locale === AR && 'is-rtl')} dir={locale === AR ? 'rtl' : 'ltr'}>
      <KNOuXTitleBar
        sectionName={t(locale, 'Repair', 'الإصلاح')}
        sectionSubtitle={t(locale, 'Recovery Lab · preview only', 'مختبر الاستعادة · معاينة فقط')}
        onNavigateHome={() => navigate('home')}
        searchPlaceholder={t(locale, 'Search measured repair tools… (Ctrl+K)', 'ابحث في أدوات الإصلاح المقيسة… (Ctrl+K)')}
        isArabic={locale === AR}
        onToggleArabic={() => {
          toggleLocale();
          setLocalLocale(locale === AR ? 'en' : 'ar');
        }}
        onOpenSettings={() => navigate('settings')}
      />

      {controller.notice ? (
        <div className="sys-toast sys-toast-good" role="status">
          <CheckCircle2 aria-hidden="true" />
          <span>{controller.notice}</span>
          <button type="button" onClick={controller.clearNotice} aria-label={t(locale, 'Dismiss', 'إغلاق')}><X aria-hidden="true" /></button>
        </div>
      ) : null}

      {controller.actionError ? (
        <div className="sys-toast sys-toast-bad" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>{controller.actionError.code}</strong>
            <span>{controller.actionError.message}</span>
          </div>
          <button type="button" onClick={controller.clearError} aria-label={t(locale, 'Dismiss', 'إغلاق')}><X aria-hidden="true" /></button>
        </div>
      ) : null}

      <div className="sys-shell">
        <KNOuXSidebar activeSection="repair" onNavigate={navigate} isArabic={locale === AR} />

        <div className="sys-shell-main">
          <main className="sys-main knx-custom-scrollbar rep-main" data-testid="repair-workspace">
            <section className="sys-hero rep-hero" data-testid="repair-hero">
              <div className="sys-hero-arc" aria-hidden="true">
                <svg viewBox="0 0 620 120" fill="none">
                  <defs>
                    <linearGradient id="rep-hero-wave" x1="0" y1="0" x2="620" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#38bdf8" />
                      <stop offset="0.5" stopColor="#818cf8" />
                      <stop offset="1" stopColor="#f472b6" />
                    </linearGradient>
                  </defs>
                  <path d="M8 62 C88 16, 150 108, 236 52 C322 -4, 386 100, 470 46 C534 6, 580 72, 616 52" stroke="url(#rep-hero-wave)" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M8 52 C76 88, 156 16, 240 78 C324 136, 400 24, 486 72 C548 108, 592 28, 616 56" stroke="url(#rep-hero-wave)" strokeWidth="1.4" strokeDasharray="4 5" opacity="0.55" />
                </svg>
              </div>

              <div className="sys-hero-copy">
                <span className="sys-hero-eyebrow">{t(locale, 'RECOVERY LAB · PREVIEW ONLY · NO REPAIR EXECUTION', 'مختبر الاستعادة · معاينة فقط · بلا تنفيذ إصلاح')}</span>
                <h1>{t(locale, 'Recovery', 'مختبر')} <span>{t(locale, 'Lab', 'الاستعادة')}</span></h1>
                <p>
                  {t(
                    locale,
                    'Diagnose Windows problems from measured evidence. Understand each repair, its scope, privileges and impact before authorizing anything.',
                    'شخّص مشكلات Windows من أدلة مقيسة. افهم كل إصلاح ونطاقه وصلاحياته وأثره قبل اعتماد أي شيء.',
                  )}
                </p>
                <div className="sys-hero-chips">
                  <Chip tone={snapshot ? 'good' : controller.scanning ? 'info' : 'muted'} icon={Sparkles}>{scanStatus}</Chip>
                  <Chip tone="info" icon={Wrench}>{formatCount(REPAIR_TOOLS.length)} {t(locale, 'repair tools', 'أداة إصلاح')}</Chip>
                  <Chip tone={elevationTone} icon={Lock}>{elevationLabel}</Chip>
                  <Chip tone="bad" icon={ShieldAlert}>{t(locale, '0 repairs executed', '0 إصلاحات منفذة')}</Chip>
                  {snapshot ? <Chip tone="violet" icon={Database}>{t(locale, 'receipt', 'إيصال')} {snapshot.receipt.slice(0, 12)}</Chip> : null}
                </div>
                <div className="sys-hero-actions">
                  <button
                    type="button"
                    className={cx('sys-btn', controller.scanning ? 'sys-btn-danger' : 'sys-btn-primary')}
                    onClick={() => (controller.scanning ? void controller.cancelScan() : void controller.startScan())}
                    disabled={!controller.nativeAvailable || controller.cancelling}
                  >
                    {controller.scanning ? <X aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                    {controller.scanning ? t(locale, 'Cancel discovery', 'إلغاء الاكتشاف') : snapshot ? t(locale, 'Re-discover', 'إعادة الاكتشاف') : t(locale, 'Start measured discovery', 'بدء الاكتشاف المقيس')}
                  </button>
                  <button type="button" className="sys-btn sys-btn-ghost" onClick={() => void controller.refreshSnapshot(true)} disabled={!snapshot || controller.refreshing || controller.scanning}>
                    <RefreshCw aria-hidden="true" className={controller.refreshing ? 'sys-spin' : undefined} />{t(locale, 'Refresh evidence', 'تحديث الأدلة')}
                  </button>
                  <button type="button" className="sys-btn sys-btn-ghost" onClick={() => void stageSelected()} disabled={!snapshot || controller.busy === 'plan'}>
                    <FileText aria-hidden="true" />{t(locale, 'Stage preview', 'تهيئة معاينة')}
                  </button>
                  <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void exportReport()} disabled={!snapshot || controller.busy === 'report'}>
                    <Download aria-hidden="true" />{t(locale, 'Export report', 'تصدير التقرير')}
                  </button>
                </div>
              </div>

              <aside className="sys-source-card rep-source-card" data-testid="repair-source-card">
                <span className={cx('sys-source-ring', snapshot ? 'is-live' : controller.scanning ? 'is-scanning' : 'is-idle')} aria-hidden="true"><span /></span>
                <div className="sys-source-copy">
                  <span>{t(locale, 'Evidence source', 'مصدر الأدلة')}</span>
                  <strong>{snapshot ? 'KNOuX RepairBridge v1' : controller.capabilities?.engine || 'KNOuX RepairBridge v1'}</strong>
                  <em>{scanStatus}</em>
                  <em>{snapshot ? formatTimestamp(snapshot.generatedAt, locale) : controller.nativeAvailable ? t(locale, 'Bounded read-only discovery', 'اكتشاف محدود للقراءة فقط') : t(locale, 'Browser preview', 'معاينة متصفح')}</em>
                </div>
                <div className="sys-source-badges">
                  <span className="sys-source-badge">{t(locale, 'Read-only', 'للقراءة فقط')}</span>
                  <span className="sys-source-badge">{t(locale, 'No auto elevation', 'بلا رفع تلقائي')}</span>
                </div>
              </aside>
            </section>

            {!controller.nativeAvailable ? (
              <div className="sys-banner is-required" data-testid="repair-native-required">
                <Lock aria-hidden="true" />
                <div>
                  <strong>{t(locale, 'Native measurement required', 'القياس الأصلي مطلوب')}</strong>
                  <p>{t(locale, 'This is a browser preview. The read-only RepairBridge is unavailable, so no log, service, adapter, restore point or journal is substituted. Open the native Electron app to measure this device.', 'هذه معاينة متصفح. جسر RepairBridge للقراءة فقط غير متاح، لذلك لا يُستبدل أي سجل أو خدمة أو محول أو نقطة استعادة أو سجل معاينات. افتح تطبيق Electron الأصلي لقياس هذا الجهاز.')}</p>
                </div>
              </div>
            ) : (
              <div className="sys-banner is-measured" data-testid="repair-native-banner">
                <ShieldCheck aria-hidden="true" />
                <div>
                  <strong>{t(locale, 'Measured Recovery Lab', 'مختبر الاستعادة المقيس')}</strong>
                  <p>
                    {snapshot
                      ? `${formatCount(snapshot.network.adapters.length)} ${t(locale, 'adapters', 'محول')} · ${formatCount(snapshot.update.services.length)} ${t(locale, 'update services', 'خدمة تحديث')} · ${formatCount(journal.length)} ${t(locale, 'journal previews', 'معاينة سجل')} · ${t(locale, 'mutation', 'التغيير')}: none`
                      : scanStatus}
                  </p>
                </div>
                <span className="sys-banner-chip">{snapshot ? t(locale, 'MEASURED', 'مقيس') : t(locale, 'MEASURING', 'جارٍ القياس')}</span>
              </div>
            )}

            {controller.scanning ? (
              <div className="sys-scan-progress" data-testid="repair-scan-progress">
                <div className="sys-scan-progress-head">
                  <span><Loader2 aria-hidden="true" className="sys-spin" />{t(locale, 'Bounded repair discovery in progress', 'اكتشاف الإصلاح المحدود قيد التنفيذ')}</span>
                  <em>{formatCount(controller.session?.progress || 0)}%</em>
                </div>
                <div className="sys-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={controller.session?.progress || 0}>
                  <span style={{ width: `${Math.max(2, Math.min(100, controller.session?.progress || 0))}%` }} />
                </div>
                <div className="sys-scan-stages">
                  {(controller.session?.stages || []).map((stage) => (
                    <span key={stage.key} className={`sys-scan-stage is-${stage.status}`} title={stage.provider}>
                      {locale === AR ? stage.labelAr : stage.labelEn}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="sys-kpi-row rep-kpi-row">
              <button type="button" className="sys-instrument rep-kpi" onClick={() => setSelectedToolId('repair-troubleshooters')} data-testid="repair-kpi-elevation">
                <span className="rep-kpi-head"><span className="rep-kpi-icon"><ShieldCheck aria-hidden="true" /></span><span>{t(locale, 'Session privilege', 'صلاحية الجلسة')}</span></span>
                <strong data-testid="repair-kpi-elevation-value">{elevationLabel}</strong>
                <em>{t(locale, 'No automatic elevation. Every administrative tool stays gated.', 'لا رفع صلاحيات تلقائي. كل أداة إدارية تبقى محجوبة.')}</em>
              </button>
              <button type="button" className="sys-instrument rep-kpi" onClick={() => setSelectedToolId('repair-component-check')} data-testid="repair-kpi-servicing">
                <span className="rep-kpi-head"><span className="rep-kpi-icon is-cyan"><HardDrive aria-hidden="true" /></span><span>{t(locale, 'Servicing evidence', 'أدلة الخدمة')}</span></span>
                <strong dir="ltr" data-testid="repair-kpi-servicing-value">{snapshot ? `${snapshot.servicing.dismLog.exists ? 'DISM' : '—'} / ${snapshot.servicing.cbsLog.exists ? 'CBS' : '—'}` : '—'}</strong>
                <em>{snapshot ? t(locale, 'Log metadata measured. Health is not inferred.', 'بيانات السجل مقيسة. الصحة لا تُستنتج.') : t(locale, 'Not measured yet.', 'لم تُقس بعد.')}</em>
              </button>
              <button type="button" className="sys-instrument rep-kpi" onClick={() => setSelectedToolId('repair-dns-flush')} data-testid="repair-kpi-network">
                <span className="rep-kpi-head"><span className="rep-kpi-icon is-violet"><Globe2 aria-hidden="true" /></span><span>{t(locale, 'Network evidence', 'أدلة الشبكة')}</span></span>
                <strong dir="ltr" data-testid="repair-kpi-network-value">{snapshot ? `${snapshot.network.adapters.length} · ${snapshot.network.dnsCache.entryCount ?? '—'} · ${snapshot.network.winsock.providerCount ?? '—'}` : '—'}</strong>
                <em>{t(locale, 'Adapters · DNS entries · Winsock providers', 'محولات · مدخلات DNS · مزودات Winsock')}</em>
              </button>
              <button type="button" className="sys-instrument rep-kpi" onClick={() => openWorkbench('repair-history')} data-testid="repair-kpi-journal">
                <span className="rep-kpi-head"><span className="rep-kpi-icon is-amber"><History aria-hidden="true" /></span><span>{t(locale, 'Repair journal', 'سجل الإصلاح')}</span></span>
                <strong dir="ltr" data-testid="repair-kpi-journal-value">{formatCount(journal.length)} / 0</strong>
                <em>{t(locale, 'Previews / executed repairs', 'معاينات / إصلاحات منفذة')}</em>
              </button>
            </div>

            <div className="rep-workspace-grid">
              <section className="rep-tools-panel" aria-labelledby="rep-tools-title">
                <div className="rep-panel-head">
                  <div>
                    <h2 id="rep-tools-title"><Wrench aria-hidden="true" />{t(locale, 'Repair tools', 'أدوات الإصلاح')} ({formatCount(REPAIR_TOOLS.length)})</h2>
                    <p>{t(locale, 'Choose a tool to inspect its measured evidence and staged preview.', 'اختر أداة لفحص أدلتها المقيسة ومعاينتها المُهيَّأة.')}</p>
                  </div>
                  <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search tools…', 'ابحث في الأدوات…')} ariaLabel={t(locale, 'Search repair tools', 'بحث أدوات الإصلاح')} />
                </div>
                <div className="rep-tool-grid" data-testid="repair-tool-grid">
                  {visibleTools.map(renderToolCard)}
                </div>
                {!visibleTools.length ? <p className="rep-empty-text">{t(locale, 'No repair tool matches that search.', 'لا أداة إصلاح تطابق هذا البحث.')}</p> : null}
              </section>

              <aside className="rep-brief" data-testid="repair-brief" style={{ '--rep-accent': selectedTool.accent } as React.CSSProperties}>
                <header className="rep-brief-head">
                  <span className="rep-brief-icon" aria-hidden="true"><SelectedToolIcon /></span>
                  <div>
                    <span className="sys-wb-eyebrow">{t(locale, 'Selected repair', 'الإصلاح المحدد')} · {String(selectedTool.index).padStart(2, '0')}</span>
                    <h2>{toolLabel(selectedToolId, locale)}</h2>
                    <p>{locale === AR ? selectedTool.blurbAr : selectedTool.blurbEn}</p>
                  </div>
                </header>
                <div className="rep-chip-row">
                  <Chip tone={STATE_META[selectedTool.state].tone}>{t(locale, STATE_META[selectedTool.state].en, STATE_META[selectedTool.state].ar)}</Chip>
                  <Chip tone={RISK_META[selectedTool.risk].tone}>{t(locale, RISK_META[selectedTool.risk].en, RISK_META[selectedTool.risk].ar)}</Chip>
                  <Chip tone="muted">{selectedTool.provider}</Chip>
                </div>

                <div className="rep-brief-block">
                  <h3><Layers aria-hidden="true" />{t(locale, 'Guided repair sequence', 'تسلسل الإصلاح الموجه')}</h3>
                  <GuidedSequence locale={locale} activeIndex={5} />
                </div>

                <div className="rep-brief-block">
                  <h3><Terminal aria-hidden="true" />{t(locale, 'Command preview', 'معاينة الأمر')}</h3>
                  <div className="rep-command-line">
                    <code>{commandDisplay(selectedCommand, locale)}</code>
                    {selectedCommand ? <CopyButton locale={locale} text={selectedCommand.display} label={t(locale, 'Copy', 'نسخ')} /> : null}
                  </div>
                  <div className="rep-chip-row">
                    <Chip tone={selectedCommand?.elevationRequired ? 'warn' : 'muted'} icon={selectedCommand?.elevationRequired ? ShieldAlert : ShieldCheck}>
                      {selectedCommand?.elevationRequired ? t(locale, 'Elevation required', 'يتطلب رفع صلاحيات') : t(locale, 'No elevation', 'بلا رفع صلاحيات')}
                    </Chip>
                    <Chip tone={selectedCommand?.rebootRequired ? 'bad' : 'muted'}>{selectedCommand?.rebootRequired ? t(locale, 'Reboot required', 'يتطلب إعادة تشغيل') : t(locale, 'No reboot', 'بلا إعادة تشغيل')}</Chip>
                    <Chip tone="bad" icon={Lock}>{t(locale, 'Not executable', 'غير قابل للتنفيذ')}</Chip>
                  </div>
                </div>

                <div className="rep-brief-block">
                  <h3><ShieldCheck aria-hidden="true" />{t(locale, 'Measured prerequisites', 'المتطلبات المقيسة')}</h3>
                  {selectedPlan ? (
                    <ul className="rep-prereq-list">
                      {selectedPlan.prerequisites.slice(0, 5).map((entry) => (
                        <li key={entry.id} className={cx('rep-prereq', `is-${entry.status}`)}>
                          {entry.status === 'passed' ? <CheckCircle2 aria-hidden="true" /> : entry.status === 'failed' ? <X aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
                          <div><strong>{locale === AR ? entry.labelAr : entry.labelEn}</strong><em>{entry.detail}</em></div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rep-empty-text">{t(locale, 'Stage a preview to evaluate this tool against the measured snapshot.', 'هيّئ معاينة لتقييم هذه الأداة مقابل اللقطة المقيسة.')}</p>
                  )}
                  {selectedPlan ? (
                    <div className="rep-plan-receipt">
                      <span>{t(locale, 'Receipt', 'الإيصال')}: <code>{controller.plan?.receipt}</code></span>
                      <span>{t(locale, 'Journal', 'السجل')}: {controller.plan?.journalRecorded ? t(locale, 'recorded', 'مسجّل') : t(locale, 'not recorded', 'غير مسجّل')}</span>
                    </div>
                  ) : null}
                </div>

                <div className="rep-brief-actions">
                  <button type="button" className="sys-btn sys-btn-primary" data-testid="repair-open-selected" onClick={() => openWorkbench(selectedToolId)} disabled={!snapshot}>
                    <ArrowRight aria-hidden="true" />{t(locale, 'Review repair', 'مراجعة الإصلاح')}
                  </button>
                  <button type="button" className="sys-btn sys-btn-ghost" data-testid="repair-stage-selected" onClick={() => void stageSelected()} disabled={!snapshot || controller.busy === 'plan'}>
                    <FileText aria-hidden="true" />{t(locale, 'Stage preview', 'تهيئة معاينة')}
                  </button>
                  {selectedSettingsTarget ? (
                    <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.openSettings(selectedSettingsTarget)}>
                      <ArrowRight aria-hidden="true" />{t(locale, 'Windows settings', 'إعدادات Windows')}
                    </button>
                  ) : null}
                </div>
              </aside>
            </div>

            <div className="rep-history-panel" data-testid="repair-history-panel">
              <div className="rep-panel-head">
                <div>
                  <h2><Clock3 aria-hidden="true" />{t(locale, 'Recent repair history', 'أحدث سجل الإصلاح')}</h2>
                  <p>{t(locale, 'Preview records only. Executed repairs: 0.', 'سجلات معاينات فقط. الإصلاحات المنفذة: 0.')}</p>
                </div>
                <div className="rep-history-actions">
                  <button type="button" className="sys-btn sys-btn-quiet" onClick={() => openWorkbench('repair-history')} disabled={!snapshot}>
                    <History aria-hidden="true" />{t(locale, 'Open journal', 'فتح السجل')}
                  </button>
                  <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void exportReport()} disabled={!snapshot || controller.busy === 'report'}>
                    <Download aria-hidden="true" />{t(locale, 'Export report', 'تصدير التقرير')}
                  </button>
                </div>
              </div>
              {recentJournal.length ? (
                <div className="rep-history-table" role="table" aria-label={t(locale, 'Recent repair history', 'أحدث سجل الإصلاح')}>
                  <div className="rep-history-head" role="row">
                    <span>{t(locale, 'Date & time', 'التاريخ والوقت')}</span>
                    <span>{t(locale, 'Tool', 'الأداة')}</span>
                    <span>{t(locale, 'Receipt', 'الإيصال')}</span>
                    <span>{t(locale, 'Result', 'النتيجة')}</span>
                  </div>
                  {recentJournal.map((entry: RepairJournalEntry) => (
                    <button key={entry.id} type="button" className="rep-history-row" role="row" onClick={() => openWorkbench('repair-history')} data-testid="repair-journal-row">
                      <span className="rep-history-time">{new Date(entry.at).toLocaleString(locale === AR ? 'ar' : 'en-GB')}</span>
                      <span>{journalTitle(entry, locale)}</span>
                      <span className="sys-mono">{entry.receipt}</span>
                      <span><Chip tone="info">{t(locale, 'Preview only', 'معاينة فقط')}</Chip></span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rep-empty">
                  <FileText aria-hidden="true" />
                  <strong>{t(locale, 'No repair previews yet', 'لا معاينات إصلاح بعد')}</strong>
                  <p>{t(locale, 'Stage a preview. The journal records the immutable review and keeps executed repairs at zero.', 'هيّئ معاينة. يسجل السجل المراجعة الثابتة ويبقي الإصلاحات المنفذة صفرًا.')}</p>
                </div>
              )}
            </div>

            <div className="rep-actions-row">
              <button type="button" className="rep-action-card is-primary" onClick={() => openWorkbench(selectedToolId)} disabled={!snapshot}>
                <span className="rep-action-icon"><FileText aria-hidden="true" /></span>
                <span><strong>{t(locale, 'Review Repair', 'مراجعة الإصلاح')}</strong><em>{t(locale, 'See full details, impact and what to expect.', 'اطّلع على التفاصيل الكاملة والأثر وما تتوقعه.')}</em></span>
              </button>
              <button type="button" className="rep-action-card" onClick={() => void stageSelected()} disabled={!snapshot || controller.busy === 'plan'}>
                <span className="rep-action-icon"><ShieldCheck aria-hidden="true" /></span>
                <span><strong>{t(locale, 'View Prerequisites', 'عرض المتطلبات')}</strong><em>{t(locale, 'Check requirements and system readiness.', 'تحقق من المتطلبات وجاهزية النظام.')}</em></span>
              </button>
              <button type="button" className="rep-action-card" onClick={() => void exportReport()} disabled={!snapshot || controller.busy === 'report'}>
                <span className="rep-action-icon"><Download aria-hidden="true" /></span>
                <span><strong>{t(locale, 'Export Diagnostic Notes', 'تصدير الملاحظات')}</strong><em>{t(locale, 'Save measured evidence for a later review.', 'احفظ الأدلة المقيسة لمراجعة لاحقة.')}</em></span>
              </button>
            </div>

            <div className="sys-foot-strip">
              <span><Database aria-hidden="true" />{t(locale, 'Source', 'المصدر')}: {t(locale, 'PowerShell CIM, fixed log metadata, ipconfig, netsh Winsock catalog and the local journal', 'PowerShell CIM وبيانات السجلات الثابتة وipconfig وكتالوج netsh Winsock والسجل المحلي')}</span>
              <span><Lock aria-hidden="true" />{t(locale, 'No DISM, SFC, DNS flush, Winsock/TCPIP reset, service reset, restore or driver command exists in Mission 11.', 'لا يوجد أمر DISM أو SFC أو مسح DNS أو إعادة Winsock/TCPIP أو خدمة أو استعادة أو تعريف في المهمة 11.')}</span>
              {snapshot?.warnings.length ? <span><AlertTriangle aria-hidden="true" />{formatCount(snapshot.warnings.length)} {t(locale, 'measured warning(s)', 'تحذير مقيس')}</span> : null}
            </div>
          </main>

          <footer className="sys-actionbar rep-actionbar" data-testid="repair-actionbar">
            <div className="sys-actionbar-summary">
              <strong>{scanStatus}</strong>
              <span className="sys-mono">{snapshot ? `${formatCount(REPAIR_TOOLS.length)} ${t(locale, 'tools', 'أداة')} · ${elevationLabel} · ${formatCount(journal.length)} ${t(locale, 'previews', 'معاينة')}` : t(locale, 'No measured repair evidence yet.', 'لا أدلة إصلاح مقيسة بعد.')}</span>
              <span className="sys-chip sys-chip-bad">{t(locale, '0 executed', '0 منفذ')}</span>
              {snapshot?.warnings.length ? <span className="sys-chip sys-chip-warn">{formatCount(snapshot.warnings.length)} {t(locale, 'warnings', 'تحذيرات')}</span> : null}
            </div>
            <div className="sys-actionbar-actions">
              <button type="button" className="sys-btn sys-btn-ghost" onClick={() => openWorkbench('repair-history')} disabled={!snapshot}>
                <History aria-hidden="true" />{t(locale, 'History', 'السجل')}
              </button>
              <button type="button" className="sys-btn sys-btn-ghost" onClick={() => openWorkbench(selectedToolId)} disabled={!snapshot}>
                <FileText aria-hidden="true" />{t(locale, 'Full review', 'مراجعة كاملة')}
              </button>
              <button type="button" className="sys-btn sys-btn-primary" onClick={() => void controller.refreshSnapshot(true)} disabled={!snapshot || controller.refreshing || controller.scanning}>
                <RefreshCw aria-hidden="true" className={controller.refreshing ? 'sys-spin' : undefined} />{t(locale, 'Refresh evidence', 'تحديث الأدلة')}
              </button>
            </div>
          </footer>
        </div>
      </div>

      {activeWorkbench && snapshot ? (
        <RepairServiceWorkspace
          toolId={activeWorkbench}
          locale={locale}
          controller={controller}
          onClose={closeWorkbench}
        />
      ) : null}
    </div>
  );
}
