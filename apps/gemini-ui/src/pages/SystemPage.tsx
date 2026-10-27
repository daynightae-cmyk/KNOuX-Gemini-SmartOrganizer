import { CommandCanvas } from '../visual/CommandCanvas';
/**
 * KNOuX SmartOrganizer — System Live Pulse (Mission 10).
 *
 * Browser previews render an explicit native-required state. In Electron every
 * instrument, timeline sample, process, event, driver, socket, adapter, hosts
 * line, hardware field and coverage badge comes from the read-only SystemBridge
 * scan. No design fixture is imported and no process, service, driver, proxy,
 * hosts, adapter, repair or power mutation is exposed here.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Download,
  Gauge,
  HardDrive,
  Layers,
  ListFilter,
  Loader2,
  Lock,
  MemoryStick,
  Monitor,
  Network,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { SystemCoverageStage, SystemMetrics } from '../../shared/native-contracts';
import { useNavigation } from '../context/NavigationContext';
import { KNOuXSidebar, KNOuXTitleBar } from '../components/shell/KNOuXShellComponents';
import { OrbitalControl } from '../visual/OrbitalControl';
import {
  SERVICE_CATALOG,
  WORLD_META,
  WORLD_SERVICES,
  WORLDS,
  isSystemServiceId,
  serviceLabel,
  shortServiceLabel,
  type SystemLocale,
  type SystemServiceState,
  type SystemWorld,
} from '../system/catalog';
import {
  averageOf,
  formatBytes,
  formatClock,
  formatCount,
  formatDuration,
  formatMHz,
  formatMs,
  formatPercent,
  formatRate,
  formatTimestamp,
  latestOf,
  maxOf,
  metricValues,
  percentageTone,
  t,
} from '../system/model';
import {
  Chip,
  ExportButton,
  Field,
  InfoNote,
  KeyValueGrid,
  LoadingLine,
  MeterBar,
  Panel,
  SearchBox,
  Seg,
  Sparkline,
  cx,
  downloadJson,
} from '../system/ui';
import { useSystem } from '../system/useSystem';
import { SystemServiceWorkspace, hasSystemWorkbench } from '../system/SystemServiceWorkspaces';
import '../system.css';

export interface SystemPageProps {
  onNavigateSection?: (section: string) => void;
}

type TimelineMetric = 'cpuPercent' | 'memoryPercent' | 'disk' | 'network';
type IntervalOption = 1000 | 5000 | 15000;

const AR = 'ar';

function serviceStateTone(state: SystemServiceState) {
  if (state === 'available') return 'good' as const;
  if (state === 'partial') return 'warn' as const;
  return 'bad' as const;
}

function coverageTone(status: SystemCoverageStage['status']) {
  if (status === 'complete') return 'good' as const;
  if (status === 'partial') return 'warn' as const;
  if (status === 'cancelled') return 'muted' as const;
  return 'bad' as const;
}

function combinedSeries(series: SystemMetrics[], first: keyof SystemMetrics, second: keyof SystemMetrics): Array<number | null> {
  return series.map((sample) => {
    const left = sample[first];
    const right = sample[second];
    if ((left == null || typeof left !== 'number') && (right == null || typeof right !== 'number')) return null;
    return (typeof left === 'number' ? left : 0) + (typeof right === 'number' ? right : 0);
  });
}

function ratioOf(value: number | null | undefined, peak: number | null | undefined): number | null {
  if (value == null || peak == null || !Number.isFinite(value) || !Number.isFinite(peak) || peak <= 0) return null;
  return Math.max(0, Math.min(100, (value / peak) * 100));
}

function InstrumentDial({ ratio, color, children }: { ratio: number | null; color: string; children: React.ReactNode }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const dash = ratio == null ? 0 : (ratio / 100) * circumference;
  return (
    <div className="sys-instrument-dial">
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="6" fill="none" className="sys-instrument-track" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div className="sys-instrument-dial-center">{children}</div>
    </div>
  );
}

interface InstrumentProps {
  id: string;
  locale: SystemLocale;
  icon: LucideIcon;
  color: string;
  title: string;
  sub: string;
  value: string;
  ratio: number | null;
  state: string;
  values: Array<number | null>;
  stats: Array<{ label: string; value: string }>;
  sampleCount: number;
  onOpen: () => void;
}

const INSTRUMENT_COLORS: Record<string, string> = {
  cpu: '#22d3ee',
  memory: '#a78bfa',
  disk: '#fbbf24',
  network: '#34d399',
};

function InstrumentCard({ id, locale, icon: Icon, color, title, sub, value, ratio, state, values, stats, sampleCount, onOpen }: InstrumentProps) {
  return (
    <button
      type="button"
      className="sys-instrument"
      data-testid={`system-kpi-${id}`}
      onClick={onOpen}
      style={{ '--sys-instrument-accent': color } as React.CSSProperties}
    >
      <span className="sys-instrument-head">
        <span className="sys-instrument-icon" aria-hidden="true">
          <Icon />
        </span>
        <span className="sys-instrument-copy">
          <strong>{title}</strong>
          <em>{sub}</em>
        </span>
        <span className={cx('sys-instrument-state', state === 'measured' ? 'is-measured' : 'is-idle')}>{state}</span>
      </span>
      <span className="sys-instrument-body">
        <InstrumentDial ratio={ratio} color={color}>
          <strong data-testid={`system-kpi-${id}-value`}>{value}</strong>
          <em>{sampleCount > 1 ? `${formatCount(sampleCount)} ${t(locale, 'samples', 'عينات')}` : t(locale, 'Awaiting sample', 'بانتظار عينة')}</em>
        </InstrumentDial>
        <span className="sys-instrument-spark">
          <Sparkline values={values} color={color} height={40} label={title} />
        </span>
      </span>
      <span className="sys-instrument-stats">
        {stats.map((stat) => (
          <span key={stat.label}>
            <em>{stat.label}</em>
            <strong>{stat.value}</strong>
          </span>
        ))}
      </span>
    </button>
  );
}

function processSearchMatches(entry: { name: string; pid: number; owner: string | null; company: string | null }, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [entry.name, String(entry.pid), entry.owner, entry.company]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

export function SystemPage({ onNavigateSection }: SystemPageProps) {
  const { navigateTo, locale: globalLocale, toggleLocale } = useNavigation();
  const [localLocale, setLocalLocale] = useState<SystemLocale | null>(null);
  const locale: SystemLocale = localLocale || (globalLocale === 'ar' ? 'ar' : 'en');
  const controller = useSystem();
  const snapshot = controller.snapshot;

  const [activeService, setActiveService] = useState<string | null>(null);
  const [world, setWorld] = useState<SystemWorld>('system');
  const [serviceQuery, setServiceQuery] = useState('');
  const [processQuery, setProcessQuery] = useState('');
  const [timelineMetric, setTimelineMetric] = useState<TimelineMetric>('cpuPercent');
  const triggerRef = useRef<HTMLElement | null>(null);

  const series = controller.series;
  const metrics = snapshot?.metrics ?? null;
  const sampleCount = series.length;

  const capabilitiesById = useMemo(() => {
    const map = new Map<string, NonNullable<typeof controller.capabilities>['services'][number]>();
    for (const service of controller.capabilities?.services || []) map.set(service.id, service);
    return map;
  }, [controller.capabilities]);

  const cpuSeries = useMemo(() => metricValues(series, 'cpuPercent'), [series]);
  const memorySeries = useMemo(() => metricValues(series, 'memoryPercent'), [series]);
  const diskSeries = useMemo(() => combinedSeries(series, 'diskReadBytesPerSec', 'diskWriteBytesPerSec'), [series]);
  const networkSeries = useMemo(() => combinedSeries(series, 'networkInBytesPerSec', 'networkOutBytesPerSec'), [series]);

  const diskNow = metrics ? (metrics.diskReadBytesPerSec ?? 0) + (metrics.diskWriteBytesPerSec ?? 0) : null;
  const networkNow = metrics ? (metrics.networkInBytesPerSec ?? 0) + (metrics.networkOutBytesPerSec ?? 0) : null;
  const diskPeak = maxOf(diskSeries);
  const networkPeak = maxOf(networkSeries);

  const processMatches = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.processes.filter((entry) => processSearchMatches(entry, processQuery));
  }, [snapshot, processQuery]);

  const topProcesses = useMemo(
    () => [...processMatches].sort((left, right) => (right.cpuPercent ?? -1) - (left.cpuPercent ?? -1)).slice(0, 8),
    [processMatches],
  );

  const visibleServices = useMemo(() => {
    const needle = serviceQuery.trim().toLowerCase();
    if (!needle) return WORLD_SERVICES[world];
    return SERVICE_CATALOG.filter((entry) =>
      [entry.id, entry.en, entry.ar, entry.shortEn, entry.shortAr, entry.blurbEn, entry.blurbAr]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [serviceQuery, world]);

  useEffect(() => {
    if (activeService && !snapshot) setActiveService(null);
  }, [activeService, snapshot]);

  const openService = useCallback(
    (id: string) => {
      if (!isSystemServiceId(id) || !hasSystemWorkbench(id)) {
        controller.showNotice(t(locale, 'That service is not registered in the measured contract.', 'هذه الخدمة غير مسجلة في العقد المقيس.'));
        return;
      }
      if (!controller.snapshot) {
        controller.showNotice(
          t(
            locale,
            'Run the measured observatory scan before opening a service workspace.',
            'شغّل مسح المرصد المقيس قبل فتح مساحة عمل الخدمة.',
          ),
        );
        return;
      }
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setActiveService(id);
    },
    [controller, locale],
  );

  const closeService = useCallback(() => {
    setActiveService(null);
    window.setTimeout(() => triggerRef.current?.focus(), 30);
  }, []);

  const timelineSeries = useMemo(() => {
    if (timelineMetric === 'cpuPercent') return cpuSeries;
    if (timelineMetric === 'memoryPercent') return memorySeries;
    if (timelineMetric === 'disk') return diskSeries;
    return networkSeries;
  }, [cpuSeries, diskSeries, memorySeries, networkSeries, timelineMetric]);

  const timelineLatest = latestOf(timelineSeries);
  const timelinePeak = maxOf(timelineSeries);
  const timelineAverage = averageOf(timelineSeries);
  const timelineFormatter = timelineMetric === 'cpuPercent' || timelineMetric === 'memoryPercent'
    ? (value: number | null) => formatPercent(value, 1)
    : (value: number | null) => formatRate(value);

  const navigate = (section: string) => {
    if (onNavigateSection) onNavigateSection(section);
    else navigateTo(section);
  };

  const summary = snapshot
    ? `${formatCount(snapshot.processes.length)} ${t(locale, 'processes', 'عملية')} · ${formatCount(snapshot.services.length)} ${t(locale, 'services', 'خدمة')} · ${formatCount(snapshot.events.length)} ${t(locale, 'events', 'حدث')} · ${formatCount(snapshot.interfaces.length)} ${t(locale, 'interfaces', 'واجهة')}`
    : t(locale, 'No measured snapshot yet.', 'لا توجد لقطة مقيسة بعد.');

  const scanStatus = controller.scanning
    ? t(locale, 'Scanning measured providers', 'جارٍ مسح المزودات المقيسة')
    : snapshot
      ? t(locale, 'Measured snapshot ready', 'اللقطة المقيسة جاهزة')
      : controller.nativeAvailable
        ? t(locale, 'Awaiting measured scan', 'بانتظار المسح المقيس')
        : t(locale, 'Native measurement required', 'القياس الأصلي مطلوب');

  const renderServiceCard = (entry: (typeof SERVICE_CATALOG)[number]) => {
    const capability = capabilitiesById.get(entry.id);
    const state = capability?.state || entry.state;
    const live = Boolean(snapshot);
    const Icon = entry.icon;
    return (
      <button
        key={entry.id}
        type="button"
        className="sys-service-card"
        data-testid={`system-service-${entry.id}`}
        onClick={() => openService(entry.id)}
        title={`${entry.id} · ${live ? capability?.provider || entry.blurbEn : t(locale, 'Native measurement required', 'القياس الأصلي مطلوب')}`}
      >
        <span className="sys-service-index">{String(entry.index).padStart(2, '0')}</span>
        <span className="sys-service-icon" style={{ color: entry.accent }} aria-hidden="true">
          <Icon />
        </span>
        <span className="sys-service-copy">
          <strong>{shortServiceLabel(entry.id, locale)}</strong>
          <em>{live ? capability?.provider || serviceLabel(entry.id, locale) : t(locale, 'Native measurement required', 'القياس الأصلي مطلوب')}</em>
        </span>
        <span className={cx('sys-service-state', `is-${live ? serviceStateTone(state) : 'muted'}`)}>
          {!live
            ? t(locale, 'Native', 'أصلي')
            : state === 'available'
              ? t(locale, 'Measured', 'مقيس')
              : state === 'partial'
                ? t(locale, 'Partial', 'جزئي')
                : t(locale, 'Gated', 'محمي')}
        </span>
      </button>
    );
  };

  const renderCoverage = () => {
    const coverage = snapshot?.coverage || [];
    return (
      <Panel
        title={t(locale, 'Measured coverage', 'التغطية المقيسة')}
        sub={`${formatCount(coverage.length)} ${t(locale, 'stages', 'مرحلة')} · ${formatCount(snapshot?.sources.length || 0)} ${t(locale, 'source groups', 'مجموعة مصدر')}`}
        icon={ShieldCheck}
        bodyClassName="sys-panel-body-flush"
      >
        <div className="sys-coverage-list" data-testid="system-coverage">
          {coverage.map((stage) => (
            <div className="sys-coverage-row" key={stage.key}>
              <span className={cx('sys-coverage-dot', `is-${coverageTone(stage.status)}`)} aria-hidden="true" />
              <span className="sys-coverage-copy">
                <strong>{stage.provider}</strong>
                <em>{stage.items == null ? t(locale, 'No item count reported', 'لم يُبلَّغ عن عدد عناصر') : `${formatCount(stage.items)} ${t(locale, 'items', 'عنصر')}`}</em>
              </span>
              <span className={cx('sys-coverage-status', `is-${coverageTone(stage.status)}`)}>
                {stage.status === 'complete' ? t(locale, 'Complete', 'مكتمل') : stage.status === 'partial' ? t(locale, 'Partial', 'جزئي') : stage.status === 'cancelled' ? t(locale, 'Cancelled', 'ملغى') : t(locale, 'Unavailable', 'غير متاح')}
              </span>
            </div>
          ))}
          {!coverage.length ? (
            <div className="sys-coverage-empty">
              {controller.scanning ? t(locale, 'Measured stages are running…', 'المراحل المقيسة قيد التنفيذ…') : t(locale, 'No stage coverage was published.', 'لم تُنشر تغطية المراحل.')}
            </div>
          ) : null}
        </div>
        {snapshot?.warnings.length ? (
          <div className="sys-coverage-warnings" data-testid="system-warnings">
            <InfoNote tone="warn">
              <strong>{formatCount(snapshot.warnings.length)}</strong> {t(locale, 'measured warning(s)', 'تحذير مقيس')}
            </InfoNote>
          </div>
        ) : null}
      </Panel>
    );
  };

  const sessionStages = controller.session?.stages || [];
  const scanProgress = controller.session?.progress || 0;

  return (
    <div className={cx('sys-viewport', locale === AR && 'is-rtl')} dir={locale === AR ? 'rtl' : 'ltr'}>
      <KNOuXTitleBar
        sectionName={t(locale, 'System', 'النظام')}
        sectionSubtitle={t(locale, 'Measured Live Pulse', 'النبض الحيوي المقيس')}
        onNavigateHome={() => navigate('home')}
        searchPlaceholder={t(locale, 'Search measured services… (Ctrl+K)', 'ابحث في الخدمات المقيسة… (Ctrl+K)')}
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
          <button type="button" onClick={controller.clearNotice} aria-label={t(locale, 'Dismiss', 'إغلاق')}>
            <X aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {controller.actionError ? (
        <div className="sys-toast sys-toast-bad" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>{controller.actionError.code}</strong>
            <span>{controller.actionError.message}</span>
          </div>
          <button type="button" onClick={controller.clearError} aria-label={t(locale, 'Dismiss', 'إغلاق')}>
            <X aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="sys-shell">
        <KNOuXSidebar activeSection="system" onNavigate={navigate} isArabic={locale === AR} />

        <div className="sys-shell-main">
          <main className="sys-main knx-custom-scrollbar" data-testid="system-workspace">
          <CommandCanvas locale={locale}>
            <section className="sys-hero" data-testid="system-hero">
              <div className="sys-hero-arc" aria-hidden="true">
                <svg viewBox="0 0 620 120" fill="none">
                  <defs>
                    <linearGradient id="sys-hero-wave" x1="0" y1="0" x2="620" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#a855f7" />
                      <stop offset="0.5" stopColor="#22d3ee" />
                      <stop offset="1" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <path d="M8 62 C88 16, 150 108, 236 52 C322 -4, 386 100, 470 46 C534 6, 580 72, 616 52" stroke="url(#sys-hero-wave)" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M8 52 C76 88, 156 16, 240 78 C324 136, 400 24, 486 72 C548 108, 592 28, 616 56" stroke="url(#sys-hero-wave)" strokeWidth="1.4" strokeDasharray="4 5" opacity="0.55" />
                </svg>
              </div>

              <div className="sys-hero-copy">
                <span className="sys-hero-eyebrow">{t(locale, 'SYSTEM OBSERVATORY · READ-ONLY', 'مرصد النظام · للقراءة فقط')}</span>
                <h1>{t(locale, 'Feel your', 'راقب نبض')} <span>{t(locale, 'system live.', 'نظامك مباشرة.')}</span></h1>
                <p>
                  {t(
                    locale,
                    'Your Windows environment, measured by bounded native providers. Every reading carries its source, and unavailable sensors stay unknown.',
                    'بيئة Windows الخاصة بك، مقيسة عبر مزودات أصلية محدودة. كل قراءة تحمل مصدرها، والمستشعرات غير المتاحة تبقى مجهولة.',
                  )}
                </p>
                <div className="sys-hero-chips">
                  <Chip tone={snapshot ? 'good' : controller.scanning ? 'info' : 'muted'} icon={Activity}>
                    {scanStatus}
                  </Chip>
                  <Chip tone="info" icon={Layers}>{formatCount(SERVICE_CATALOG.length)} {t(locale, 'services', 'خدمة')}</Chip>
                  <Chip tone="muted" icon={Lock}>{t(locale, 'Mutation', 'التغيير')}: none</Chip>
                  {snapshot ? <Chip tone="violet" icon={Database}>{t(locale, 'receipt', 'إيصال')} {snapshot.receipt.slice(0, 10)}</Chip> : null}
                </div>
                <div className="sys-hero-actions">
                  <button
                    type="button"
                    className={cx('sys-btn', controller.scanning ? 'sys-btn-danger' : 'sys-btn-primary')}
                    onClick={() => (controller.scanning ? void controller.cancelScan() : void controller.startScan())}
                    disabled={!controller.nativeAvailable || controller.cancelling}
                  >
                    {controller.scanning ? <X aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                    {controller.scanning
                      ? t(locale, 'Cancel scan', 'إلغاء المسح')
                      : snapshot
                        ? t(locale, 'Re-scan', 'إعادة المسح')
                        : t(locale, 'Start measured scan', 'بدء المسح المقيس')}
                  </button>
                  <button
                    type="button"
                    className="sys-btn sys-btn-ghost"
                    onClick={() => void controller.refreshSnapshot(true)}
                    disabled={!snapshot || controller.refreshing || controller.scanning}
                  >
                    <RefreshCw aria-hidden="true" className={controller.refreshing ? 'sys-spin' : undefined} />
                    {t(locale, 'Refresh snapshot', 'تحديث اللقطة')}
                  </button>
                  <button
                    type="button"
                    className="sys-btn sys-btn-ghost"
                    onClick={() => void controller.sampleNow()}
                    disabled={!snapshot || controller.sampling}
                  >
                    {controller.sampling ? <Loader2 aria-hidden="true" className="sys-spin" /> : <Zap aria-hidden="true" />}
                    {t(locale, 'Sample now', 'قياس الآن')}
                  </button>
                  <button
                    type="button"
                    className="sys-btn sys-btn-quiet"
                    onClick={() => {
                      if (!snapshot) return;
                      const ok = downloadJson('knoux-live-pulse-snapshot.json', snapshot);
                      controller.showNotice(ok
                        ? t(locale, 'Measured snapshot exported as JSON.', 'صُدّرت اللقطة المقيسة بصيغة JSON.')
                        : t(locale, 'The snapshot export could not start.', 'تعذّر بدء تصدير اللقطة.'));
                    }}
                    disabled={!snapshot}
                  >
                    <Download aria-hidden="true" />
                    {t(locale, 'Export snapshot', 'تصدير اللقطة')}
                  </button>
                </div>
              </div>

              <OrbitalControl title={t(locale, 'Run Health Pulse', 'قياس نبض النظام')} subtitle={t(locale, 'Real readings. Clear sources.', 'قراءات حقيقية. مصادر واضحة.')}
                onActivate={() => void controller.startScan()} disabled={!controller.nativeAvailable || controller.scanning} running={controller.scanning || controller.sampling}
                tools={[
                  { id: 'cpu', label: 'CPU', icon: Cpu, onClick: () => openService('hardware-cpu'), disabled: !snapshot },
                  { id: 'gpu', label: 'GPU', icon: Monitor, onClick: () => openService('hardware-gpu'), disabled: !snapshot },
                  { id: 'memory', label: t(locale, 'Memory', 'الذاكرة'), icon: MemoryStick, onClick: () => openService('hardware-memory'), disabled: !snapshot },
                  { id: 'disk', label: t(locale, 'Disk', 'القرص'), icon: HardDrive, onClick: () => openService('hardware-disks'), disabled: !snapshot },
                  { id: 'events', label: t(locale, 'Events', 'الأحداث'), icon: Activity, onClick: () => openService('system-events'), disabled: !snapshot },
                  { id: 'network', label: t(locale, 'Network', 'الشبكة'), icon: Network, onClick: () => openService('network-interfaces'), disabled: !snapshot },
                ]} />
              <aside className="sys-source-card" data-testid="system-source-card">
                <span className={cx('sys-source-ring', snapshot ? 'is-live' : controller.scanning ? 'is-scanning' : 'is-idle')} aria-hidden="true">
                  <span />
                </span>
                <div className="sys-source-copy">
                  <span>{t(locale, 'Telemetry source', 'مصدر القياس')}</span>
                  <strong>{snapshot ? snapshot.metrics.source : controller.capabilities?.engine || 'KNOuX SystemBridge v1'}</strong>
                  <em>{scanStatus}</em>
                  <em>{snapshot ? formatTimestamp(snapshot.generatedAt, locale) : controller.nativeAvailable ? t(locale, 'Bounded native scan', 'مسح أصلي محدود') : t(locale, 'Browser preview', 'معاينة متصفح')}</em>
                </div>
                <div className="sys-source-badges">
                  <span className="sys-source-badge">{t(locale, 'Read-only', 'للقراءة فقط')}</span>
                  <span className="sys-source-badge">{t(locale, 'No fixtures', 'بلا بيانات تجريبية')}</span>
                </div>
              </aside>
            </section>

            {!controller.nativeAvailable ? (
              <div className="sys-banner is-required" data-testid="system-native-required">
                <Lock aria-hidden="true" />
                <div>
                  <strong>{t(locale, 'Native measurement required', 'القياس الأصلي مطلوب')}</strong>
                  <p>
                    {t(
                      locale,
                      'This is a browser preview. The read-only SystemBridge is unavailable, so no gauge, process, event, driver, socket, adapter, hosts line or hardware field is substituted. Open the native Electron app to measure this device.',
                      'هذه معاينة متصفح. جسر SystemBridge للقراءة فقط غير متاح، لذلك لا تُستبدل أي أداة قياس أو عملية أو حدث أو برنامج تشغيل أو مقبس أو محول أو سطر hosts أو حقل عتاد. افتح تطبيق Electron الأصلي لقياس هذا الجهاز.',
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="sys-banner is-measured" data-testid="system-native-banner">
                <ShieldCheck aria-hidden="true" />
                <div>
                  <strong>{t(locale, 'Measured observatory', 'المرصد المقيس')}</strong>
                  <p>{snapshot ? `${summary} · ${formatTimestamp(snapshot.generatedAt, locale)}` : scanStatus}</p>
                </div>
                <span className="sys-banner-chip">{snapshot ? t(locale, 'MEASURED', 'مقيس') : t(locale, 'MEASURING', 'جارٍ القياس')}</span>
              </div>
            )}

            {controller.scanning ? (
              <div className="sys-scan-progress" data-testid="system-scan-progress">
                <div className="sys-scan-progress-head">
                  <span><Loader2 aria-hidden="true" className="sys-spin" /> {t(locale, 'Bounded scan in progress', 'مسح محدود قيد التنفيذ')}</span>
                  <em>{formatCount(scanProgress)}%</em>
                </div>
                <div className="sys-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={scanProgress}>
                  <span style={{ width: `${Math.max(2, Math.min(100, scanProgress))}%` }} />
                </div>
                <div className="sys-scan-stages">
                  {sessionStages.map((stage) => (
                    <span key={stage.key} className={cx('sys-scan-stage', `is-${stage.status}`)} title={stage.provider}>
                      {locale === AR ? stage.labelAr : stage.labelEn}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {snapshot ? (
              <>
                <div className="sys-kpi-row" data-testid="system-kpi-row">
                  <InstrumentCard
                    id="cpu"
                    locale={locale}
                    icon={Cpu}
                    color={INSTRUMENT_COLORS.cpu}
                    title={t(locale, 'CPU load', 'حمل المعالج')}
                    sub={t(locale, 'Processor activity', 'نشاط المعالج')}
                    value={formatPercent(metrics?.cpuPercent ?? null, 1)}
                    ratio={metrics?.cpuPercent ?? null}
                    state={metrics?.cpuPercent == null ? t(locale, 'Unavailable', 'غير متاح') : 'measured'}
                    values={cpuSeries}
                    stats={[
                      { label: t(locale, 'Frequency', 'التردد'), value: formatMHz(metrics?.cpuFrequencyMHz) },
                      { label: t(locale, 'Processes', 'العمليات'), value: formatCount(metrics?.processCount) },
                      { label: t(locale, 'Threads', 'الخيوط'), value: formatCount(metrics?.threadCount) },
                    ]}
                    sampleCount={sampleCount}
                    onOpen={() => openService('system-health-check')}
                  />
                  <InstrumentCard
                    id="memory"
                    locale={locale}
                    icon={MemoryStick}
                    color={INSTRUMENT_COLORS.memory}
                    title={t(locale, 'Memory', 'الذاكرة')}
                    sub={t(locale, 'Physical memory usage', 'استخدام الذاكرة الفعلية')}
                    value={formatPercent(metrics?.memoryPercent ?? null, 1)}
                    ratio={metrics?.memoryPercent ?? null}
                    state={metrics?.memoryPercent == null ? t(locale, 'Unavailable', 'غير متاح') : 'measured'}
                    values={memorySeries}
                    stats={[
                      { label: t(locale, 'In use', 'المستخدم'), value: formatBytes(metrics?.memoryUsedBytes) },
                      { label: t(locale, 'Total', 'الإجمالي'), value: formatBytes(metrics?.memoryTotalBytes) },
                      { label: t(locale, 'Committed', 'المُلتزم'), value: formatBytes(metrics?.memoryCommittedBytes) },
                    ]}
                    sampleCount={sampleCount}
                    onOpen={() => openService('system-health-check')}
                  />
                  <InstrumentCard
                    id="disk"
                    locale={locale}
                    icon={HardDrive}
                    color={INSTRUMENT_COLORS.disk}
                    title={t(locale, 'Disk I/O', 'إدخال/إخراج القرص')}
                    sub={t(locale, 'Read + write activity', 'نشاط القراءة والكتابة')}
                    value={formatRate(diskNow)}
                    ratio={ratioOf(diskNow, diskPeak)}
                    state={diskNow == null ? t(locale, 'Unavailable', 'غير متاح') : 'measured'}
                    values={diskSeries}
                    stats={[
                      { label: t(locale, 'Read', 'قراءة'), value: formatRate(metrics?.diskReadBytesPerSec) },
                      { label: t(locale, 'Write', 'كتابة'), value: formatRate(metrics?.diskWriteBytesPerSec) },
                      { label: t(locale, 'Latency', 'الكمون'), value: formatMs(metrics?.diskLatencyMs) },
                    ]}
                    sampleCount={sampleCount}
                    onOpen={() => openService('system-health-check')}
                  />
                  <InstrumentCard
                    id="network"
                    locale={locale}
                    icon={Network}
                    color={INSTRUMENT_COLORS.network}
                    title={t(locale, 'Network', 'الشبكة')}
                    sub={t(locale, 'Inbound / outbound traffic', 'حركة الوارد والصادر')}
                    value={formatRate(networkNow)}
                    ratio={ratioOf(networkNow, networkPeak)}
                    state={networkNow == null ? t(locale, 'Unavailable', 'غير متاح') : 'measured'}
                    values={networkSeries}
                    stats={[
                      { label: t(locale, 'Download', 'تنزيل'), value: formatRate(metrics?.networkInBytesPerSec) },
                      { label: t(locale, 'Upload', 'رفع'), value: formatRate(metrics?.networkOutBytesPerSec) },
                      { label: t(locale, 'Interfaces', 'الواجهات'), value: formatCount(snapshot.interfaces.length) },
                    ]}
                    sampleCount={sampleCount}
                    onOpen={() => openService('system-health-check')}
                  />
                </div>

                <div className="sys-overview-grid">
                  <Panel
                    className="sys-timeline-panel"
                    title={t(locale, 'Performance timeline', 'الخط الزمني للأداء')}
                    sub={`${t(locale, 'Latest', 'الأحدث')}: ${timelineFormatter(timelineLatest)} · ${t(locale, 'Peak', 'الذروة')}: ${timelineFormatter(timelinePeak)} · ${t(locale, 'Average', 'المتوسط')}: ${timelineFormatter(timelineAverage)}`}
                    icon={Activity}
                    actions={
                      <>
                        <Seg<TimelineMetric>
                          value={timelineMetric}
                          onChange={setTimelineMetric}
                          ariaLabel={t(locale, 'Select metric tab', 'اختر تبويب المقياس')}
                          compact
                          options={[
                            { value: 'cpuPercent', label: 'CPU' },
                            { value: 'memoryPercent', label: t(locale, 'Memory', 'الذاكرة') },
                            { value: 'disk', label: t(locale, 'Disk', 'القرص') },
                            { value: 'network', label: t(locale, 'Network', 'الشبكة') },
                          ]}
                        />
                        <Seg<IntervalOption>
                          value={(controller.sampleIntervalMs as IntervalOption)}
                          onChange={controller.setSampleInterval}
                          ariaLabel={t(locale, 'Sample interval', 'فاصل القياس')}
                          compact
                          options={[
                            { value: 1000, label: '1s' },
                            { value: 5000, label: '5s' },
                            { value: 15000, label: '15s' },
                          ]}
                        />
                        <button
                          type="button"
                          className={cx('sys-btn sys-btn-quiet', controller.samplingPaused && 'is-active')}
                          onClick={() => controller.setSamplingPaused(!controller.samplingPaused)}
                          aria-pressed={controller.samplingPaused}
                        >
                          {controller.samplingPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                          {controller.samplingPaused ? t(locale, 'Resume', 'استئناف') : t(locale, 'Pause', 'إيقاف')}
                        </button>
                      </>
                    }
                  >
                    <div className="sys-timeline-chart">
                      <Sparkline values={timelineSeries} color={timelineMetric === 'memoryPercent' ? '#a78bfa' : timelineMetric === 'disk' ? '#fbbf24' : timelineMetric === 'network' ? '#34d399' : '#22d3ee'} height={132} showArea label={t(locale, 'Measured performance series', 'سلسلة أداء مقيسة')} />
                      <div className="sys-timeline-axis">
                        <span>{series.length ? formatTimestamp(series[0].timestamp, locale) : '—'}</span>
                        <span>{sampleCount} {t(locale, 'samples', 'عينة')}</span>
                        <span>{series.length ? formatTimestamp(series[series.length - 1].timestamp, locale) : '—'}</span>
                      </div>
                    </div>
                    <div className="sys-timeline-foot">
                      <span><Database aria-hidden="true" />{metrics?.source || '—'}</span>
                      <span><Clock aria-hidden="true" />{t(locale, 'Uptime', 'مدة التشغيل')}: {formatClock(snapshot.identity.uptimeSeconds)}</span>
                      <span><ShieldCheck aria-hidden="true" />{t(locale, 'Sampling', 'القياس')}: {controller.samplingPaused ? t(locale, 'paused', 'متوقف') : `${Math.round(controller.sampleIntervalMs / 1000)}s`}</span>
                    </div>
                  </Panel>

                  <Panel
                    className="sys-facts-panel"
                    title={t(locale, 'System information', 'معلومات النظام')}
                    sub={t(locale, 'Measured Windows identity, never inferred.', 'هوية Windows المقيسة، بلا استنتاج.')}
                    icon={MonitorIcon}
                  >
                    <KeyValueGrid columns={2}>
                      <Field label={t(locale, 'Operating system', 'نظام التشغيل')} value={snapshot.identity.osName || '—'} hint={snapshot.identity.osEdition || undefined} />
                      <Field label={t(locale, 'Version / build', 'الإصدار / البناء')} value={snapshot.identity.osBuild ? `${snapshot.identity.osVersion || ''} (${snapshot.identity.osBuild})` : snapshot.identity.osVersion || '—'} />
                      <Field label={t(locale, 'Manufacturer', 'المصنّع')} value={snapshot.identity.manufacturer || '—'} />
                      <Field label={t(locale, 'Model', 'الطراز')} value={snapshot.identity.model || '—'} />
                      <Field label={t(locale, 'Processor', 'المعالج')} value={snapshot.identity.processor || '—'} />
                      <Field label={t(locale, 'Installed RAM', 'الذاكرة المثبتة')} value={formatBytes(snapshot.identity.installedRamBytes)} />
                      <Field label={t(locale, 'Last boot', 'آخر إقلاع')} value={formatTimestamp(snapshot.identity.bootTime, locale)} />
                      <Field label={t(locale, 'Uptime', 'مدة التشغيل')} value={`${formatClock(snapshot.identity.uptimeSeconds)} · ${formatDuration(snapshot.identity.uptimeSeconds)}`} tone="good" />
                    </KeyValueGrid>
                    <div className="sys-facts-meta">
                      <span><Clock aria-hidden="true" />{t(locale, 'Time zone', 'المنطقة الزمنية')}: {snapshot.identity.timeZone || '—'}</span>
                      <span><Layers aria-hidden="true" />{t(locale, 'Architecture', 'البنية')}: {snapshot.identity.architecture || '—'}</span>
                      <span><Lock aria-hidden="true" />{t(locale, 'Fast Startup', 'بدء التشغيل السريع')}: {snapshot.identity.fastStartupEnabled == null ? t(locale, 'unknown', 'مجهول') : snapshot.identity.fastStartupEnabled ? t(locale, 'enabled', 'مفعّل') : t(locale, 'disabled', 'معطّل')}</span>
                    </div>
                  </Panel>
                </div>

                <div className="sys-overview-lower">
                  <Panel
                    className="sys-ledger-panel"
                    title={t(locale, 'Process ledger', 'سجل العمليات')}
                    sub={`${formatCount(processMatches.length)} ${t(locale, 'measured processes', 'عملية مقيسة')} · ${t(locale, 'top CPU share', 'أعلى حصة معالج')}`}
                    icon={ListFilter}
                    actions={
                      <>
                        <SearchBox
                          value={processQuery}
                          onChange={setProcessQuery}
                          placeholder={t(locale, 'Search processes…', 'ابحث في العمليات…')}
                          ariaLabel={t(locale, 'Search processes', 'بحث في العمليات')}
                        />
                        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => openService('system-processes')}>
                          {t(locale, 'Full register', 'السجل الكامل')}
                        </button>
                      </>
                    }
                    bodyClassName="sys-panel-body-flush"
                  >
                    <div className="sys-ledger-head">
                      <span>{t(locale, 'Process', 'العملية')}</span>
                      <span>PID</span>
                      <span>CPU</span>
                      <span>{t(locale, 'Memory', 'الذاكرة')}</span>
                      <span>{t(locale, 'Threads', 'الخيوط')}</span>
                    </div>
                    <div className="sys-ledger-body knx-custom-scrollbar">
                      {topProcesses.map((process) => (
                        <button
                          key={process.id}
                          type="button"
                          className="sys-ledger-row"
                          data-testid="system-process-row"
                          onClick={() => openService('system-processes')}
                          title={process.executablePath || process.name}
                        >
                          <span className="sys-ledger-name">
                            <strong>{process.name}</strong>
                            <em>{process.owner || t(locale, 'owner unknown', 'المالك مجهول')}</em>
                          </span>
                          <span className="sys-mono">{process.pid}</span>
                          <span className="sys-ledger-cpu">
                            <MeterBar value={process.cpuPercent} tone={percentageTone(process.cpuPercent)} height={4} />
                            <em>{formatPercent(process.cpuPercent, 1)}</em>
                          </span>
                          <span className="sys-mono">{formatBytes(process.workingSetBytes)}</span>
                          <span className="sys-mono">{formatCount(process.threads)}</span>
                        </button>
                      ))}
                      {!topProcesses.length ? (
                        <div className="sys-ledger-empty">
                          {t(locale, 'No measured process matches that search.', 'لا توجد عملية مقيسة تطابق هذا البحث.')}
                        </div>
                      ) : null}
                    </div>
                  </Panel>

                  {renderCoverage()}
                </div>

                <section className="sys-services-panel" aria-labelledby="sys-services-title">
                  <div className="sys-services-head">
                    <div className="sys-services-title">
                      <Layers aria-hidden="true" />
                      <div>
                        <h2 id="sys-services-title">{t(locale, 'Service workbenches', 'مساحات عمل الخدمات')}</h2>
                        <p>{t(locale, 'Thirty-six measured services across system, network and hardware. No generic modal is used.', 'ست وثلاثون خدمة مقيسة عبر النظام والشبكة والعتاد. لا يُستخدم نافذة عامة.')}</p>
                      </div>
                    </div>
                    <div className="sys-services-tools">
                      <SearchBox
                        value={serviceQuery}
                        onChange={setServiceQuery}
                        placeholder={t(locale, 'Find a service…', 'ابحث عن خدمة…')}
                        ariaLabel={t(locale, 'Find a service', 'بحث عن خدمة')}
                      />
                      <div className="sys-world-tabs" data-testid="system-world-tabs">
                        <Seg<SystemWorld>
                          value={world}
                          onChange={(next) => {
                            setWorld(next);
                            setServiceQuery('');
                          }}
                          ariaLabel={t(locale, 'Service world', 'عالم الخدمة')}
                          compact
                          options={WORLDS.map((entry) => ({ value: entry, label: `${WORLD_META[entry][locale === AR ? 'ar' : 'en']} · ${WORLD_SERVICES[entry].length}` }))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="sys-service-grid" data-testid="system-service-grid">
                    {visibleServices.map(renderServiceCard)}
                  </div>
                  {!visibleServices.length ? (
                    <div className="sys-service-empty">{t(locale, 'No service matches that search.', 'لا توجد خدمة تطابق هذا البحث.')}</div>
                  ) : null}
                </section>

                {controller.capabilities?.gatedOperations.length ? (
                  <div className="sys-gated-strip">
                    <Lock aria-hidden="true" />
                    <div>
                      <strong>{formatCount(controller.capabilities.gatedOperations.length)} {t(locale, 'gated operation(s)', 'عملية محمية')}</strong>
                      <span>
                        {controller.capabilities.gatedOperations.slice(0, 4).map((operation) => `${operation.title} (${t(locale, 'Mission', 'المهمة')} ${operation.mission})`).join(' · ')}
                      </span>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="sys-loading-grid" data-testid="system-loading">
                <Panel title={t(locale, 'Awaiting measured snapshot', 'بانتظار اللقطة المقيسة')} icon={Activity}>
                  <LoadingLine
                    label={
                      controller.scanning
                        ? t(locale, 'Running the bounded native scan…', 'جارٍ تشغيل المسح الأصلي المحدود…')
                        : controller.nativeAvailable
                          ? t(locale, 'No measured snapshot yet. Start a scan or review the reported error.', 'لا توجد لقطة مقيسة بعد. ابدأ مسحًا أو راجع الخطأ المُبلَّغ.')
                          : t(locale, 'Native Electron measurement is required.', 'القياس عبر Electron الأصلي مطلوب.')
                    }
                  />
                  <div className="sys-loading-copy">
                    {t(
                      locale,
                      'The nine measured stages read system identity, processes, services, events, drivers, network, sockets, hardware and the timeline. Until they answer, this page shows no numbers.',
                      'تقرأ المراحل التسع المقيسة هوية النظام والعمليات والخدمات والأحداث وبرامج التشغيل والشبكة والمقابس والعتاد والخط الزمني. حتى تجيب، لا تعرض هذه الصفحة أي أرقام.',
                    )}
                  </div>
                </Panel>
                <Panel title={t(locale, 'Service catalog', 'دليل الخدمات')} icon={Layers}>
                  <div className="sys-service-grid is-loading">{SERVICE_CATALOG.slice(0, 12).map(renderServiceCard)}</div>
                </Panel>
              </div>
            )}

            <div className="sys-foot-strip">
              <span><Database aria-hidden="true" />{t(locale, 'Source', 'المصدر')}: {t(locale, 'CIM, performance counters, event log, Authenticode, Net* and bounded DNS/TCP probes', 'CIM وعدادات الأداء وسجل الأحداث وAuthenticode وNet* وفحوص DNS/TCP المحدودة')}</span>
              <span><Lock aria-hidden="true" />{t(locale, 'No process, service, driver, hosts, proxy, adapter, repair or power write exists in Mission 10.', 'لا توجد كتابة للعمليات أو الخدمات أو برامج التشغيل أو hosts أو الوكيل أو المحول أو الإصلاح أو الطاقة في المهمة 10.')}</span>
              {controller.lastSampleAt ? <span><Clock aria-hidden="true" />{t(locale, 'Last sample', 'آخر عينة')}: {formatTimestamp(controller.lastSampleAt, locale)}</span> : null}
            </div>

          </CommandCanvas>
          </main>

          <footer className="sys-actionbar" data-testid="system-actionbar">
            <div className="sys-actionbar-summary">
              <strong>{scanStatus}</strong>
              <span className="sys-mono">{summary}</span>
              {snapshot?.warnings.length ? (
                <span className="sys-chip sys-chip-warn">{formatCount(snapshot.warnings.length)} {t(locale, 'warnings', 'تحذيرات')}</span>
              ) : null}
              {sampleCount ? <span className="sys-chip sys-chip-good">{formatCount(sampleCount)} {t(locale, 'live samples', 'عينة حية')}</span> : null}
            </div>
            <div className="sys-actionbar-actions">
              <button type="button" className="sys-btn sys-btn-ghost" onClick={() => openService('hardware-health-report')} disabled={!snapshot}>
                <ShieldCheck aria-hidden="true" />
                {t(locale, 'Hardware report', 'تقرير العتاد')}
              </button>
              <button type="button" className="sys-btn sys-btn-ghost" onClick={() => openService('system-health-check')} disabled={!snapshot}>
                <Gauge aria-hidden="true" />
                {t(locale, 'Full pulse', 'النبض الكامل')}
              </button>
              <button
                type="button"
                className="sys-btn sys-btn-primary"
                onClick={() => void controller.refreshSnapshot(true)}
                disabled={!snapshot || controller.refreshing || controller.scanning}
              >
                <RefreshCw aria-hidden="true" className={controller.refreshing ? 'sys-spin' : undefined} />
                {t(locale, 'Refresh data', 'تحديث البيانات')}
              </button>
            </div>
          </footer>
        </div>
      </div>

      {activeService && snapshot ? (
        <SystemServiceWorkspace
          serviceId={activeService}
          locale={locale}
          controller={controller}
          onOpenService={openService}
          onClose={closeService}
        />
      ) : null}
    </div>
  );
}

const MonitorIcon = Monitor;
