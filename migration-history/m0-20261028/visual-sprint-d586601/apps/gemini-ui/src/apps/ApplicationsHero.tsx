/**
 * Applications hero: measured coverage and the five KPI cards.
 * All values are read from the native inventory; nothing is estimated here.
 */
import React from 'react';
import {
  Building2,
  Database,
  Download,
  LayoutGrid,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { AppsInventory } from '../../shared/native-contracts';
import type { AppsLocale } from './model';
import {
  formatBytes,
  formatCount,
  formatTimestamp,
  t,
  updateStatusLabel,
} from './model';
import type { ApplicationsController } from './useApplications';
import { OrbitalControl } from '../visual/OrbitalControl';

interface ApplicationsHeroProps {
  locale: AppsLocale;
  controller: ApplicationsController;
  selectedCount: number;
  onBuildPlan: () => void;
  /** Opens a real application service workbench. */
  onOpenService?: (service: string) => void;
}

function KpiCard({
  testId,
  label,
  value,
  sub,
  icon,
  accent,
}: {
  testId: string;
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="apps-kpi-card" data-testid={testId}>
      <div className="apps-kpi-icon" style={{ color: accent, borderColor: `${accent}55`, background: `${accent}18` }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div
          className="apps-kpi-value"
          data-testid={`${testId}-value`}
          title={value}
        >
          {value}
        </div>
        <div className="apps-kpi-label">{label}</div>
        <div className="apps-kpi-sub" title={sub}>{sub}</div>
      </div>
    </div>
  );
}

function coverageText(inventory: AppsInventory | null, locale: AppsLocale): string {
  if (!inventory) return t(locale, 'Reading the measured inventory…', 'جارٍ قراءة الجرد المقيس…');
  const coverage = inventory.coverage;
  const parts = [
    `${formatCount(coverage.registryItems)} registry`,
    `${formatCount(coverage.appxItems)} Appx/MSIX`,
    `${formatCount(coverage.returned)} returned`,
  ];
  if (coverage.truncated) parts.push(t(locale, 'truncated', 'مقتطع'));
  return parts.join(' · ');
}

export const ApplicationsHero: React.FC<ApplicationsHeroProps> = ({
  locale,
  controller,
  selectedCount,
  onBuildPlan,
  onOpenService,
}) => {
  const { inventory, updates, capabilities, refreshing } = controller;
  const kpis = inventory?.kpis;
  const updatesMeasured = updates && updates.status === 'available' ? updates.items.length : null;
  const footprint = kpis?.measuredFootprintBytes;
  const footprintSub = kpis
    ? `${formatCount(kpis.measuredFootprintApps)} ${t(locale, 'app(s) measured', 'تطبيقًا مقيسًا')} · ${t(locale, 'reported', 'مبلّغ')} ${formatBytes(kpis.reportedFootprintBytes)}`
    : t(locale, 'Not measured yet', 'لم تُقس بعد');
  const updatesSub = updates
    ? updateStatusLabel(updates, locale)
    : t(locale, 'WinGet not queried yet', 'لم يُستعلم WinGet بعد');

  return (
    <section className="apps-hero" aria-labelledby="apps-hero-title">
      <div className="apps-hero-arc" aria-hidden="true" />
      <div className="apps-hero-beam" aria-hidden="true" />

      <div className="knx-apps-hero-layout relative z-10">
        <div className="min-w-0">
          <div className="apps-breadcrumb">
            <span>{t(locale, 'Workspace', 'مساحة العمل')}</span>
            <span aria-hidden="true">/</span>
            <span>{t(locale, 'Applications', 'التطبيقات')}</span>
          </div>
          <h1 id="apps-hero-title" className="apps-hero-title">
            {t(locale, 'Master every app.', 'كل تطبيق. تحت سيطرتك.')}
          </h1>
          <p className="apps-hero-copy">
            {t(
              locale,
              'A measured, read-only view of every installed application, package, signature and startup link on this Windows device.',
              'عرض مقيس للقراءة فقط لكل تطبيق وحزمة وتوقيع وارتباط إقلاع مثبت على جهاز ويندوز هذا.'
            )}
          </p>
        </div>

        <OrbitalControl title={t(locale, 'Analyze Applications', 'تحليل التطبيقات')} subtitle={t(locale, 'Inventory · Inspect · Review', 'جرد · فحص · مراجعة')}
          eyebrow={t(locale, 'Application scopes', 'نطاقات التطبيقات')}
          onActivate={() => void controller.refreshInventory(true)} disabled={refreshing || !controller.nativeAvailable} running={refreshing}
          tools={[
            { id: 'inventory', label: t(locale, 'Installed Apps', 'التطبيقات المثبتة'), icon: LayoutGrid, onClick: () => onOpenService?.('app-inventory'), disabled: !onOpenService, hint: t(locale, 'Measured inventory register', 'سجل الجرد المقيس') },
            { id: 'publishers', label: t(locale, 'Publishers', 'الناشرون'), icon: Building2, onClick: () => onOpenService?.('app-publisher'), disabled: !onOpenService, hint: t(locale, 'Publisher signatures', 'توقيعات الناشرين') },
            { id: 'updates', label: t(locale, 'Updates', 'التحديثات'), icon: RefreshCw, onClick: () => onOpenService?.('app-updates'), disabled: !onOpenService, hint: t(locale, 'WinGet update review', 'مراجعة تحديثات WinGet') },
            { id: 'footprint', label: t(locale, 'Footprint', 'البصمة'), icon: Database, onClick: () => onOpenService?.('app-size'), disabled: !onOpenService, hint: t(locale, 'Measured install size', 'حجم التثبيت المقيس') },
            { id: 'startup', label: t(locale, 'Startup Links', 'روابط البدء'), icon: Zap, onClick: () => onOpenService?.('app-startup-impact'), disabled: !onOpenService, hint: t(locale, 'Startup linkage evidence', 'دليل ارتباط البدء') },
            { id: 'search', label: t(locale, 'App Search', 'بحث التطبيقات'), icon: Search, onClick: () => onOpenService?.('app-search'), disabled: !onOpenService, hint: t(locale, 'Query the measured register', 'استعلام السجل المقيس') },
          ]} />
        <div className="knx-apps-hero-actions flex flex-wrap items-center justify-end gap-2">
          {selectedCount > 0 ? (
            <button
              type="button"
              onClick={onBuildPlan}
              disabled={controller.planBusy}
              className="apps-btn apps-btn-danger"
              title={t(locale, 'Build a non-executable Mission 08 review plan', 'بناء خطة مراجعة غير قابلة للتنفيذ للمهمة 08')}
            >
              <Lock className="w-3.5 h-3.5" />
              {controller.planBusy
                ? t(locale, 'Building plan…', 'جارٍ بناء الخطة…')
                : `${t(locale, 'Review plan', 'مراجعة الخطة')} (${selectedCount})`}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void controller.refreshInventory(true)}
            disabled={refreshing || !controller.nativeAvailable}
            className="apps-btn"
            title={t(locale, 'Re-read the measured inventory', 'إعادة قراءة الجرد المقيس')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? t(locale, 'Reading…', 'جارٍ القراءة…') : t(locale, 'Refresh inventory', 'تحديث الجرد')}
          </button>
          <button
            type="button"
            onClick={controller.exportInventory}
            disabled={!inventory}
            className="apps-btn"
            title={t(locale, 'Export measured evidence as JSON', 'تصدير الأدلة المقيسة بصيغة JSON')}
          >
            <Download className="w-3.5 h-3.5" />
            {t(locale, 'Export JSON', 'تصدير JSON')}
          </button>
        </div>
      </div>

      <div className="apps-hero-meta relative z-10">
        <span className="apps-chip apps-chip-good">
          <ShieldCheck className="w-3 h-3" />
          {t(locale, 'READ-ONLY ENGINE', 'محرك للقراءة فقط')}
        </span>
        <span className="apps-chip">
          {t(locale, 'engine', 'المحرك')}: {capabilities?.engine || 'ApplicationsBridge'}
        </span>
        <span className="apps-chip">
          {t(locale, 'coverage', 'التغطية')}: {coverageText(inventory, locale)}
        </span>
        {inventory ? (
          <span className="apps-chip">
            {t(locale, 'observed', 'وقت القياس')}: {formatTimestamp(inventory.observedAt, locale)}
          </span>
        ) : null}
        <span className="apps-chip apps-chip-warn">
          {t(locale, 'no fixtures', 'بلا بيانات وهمية')}
        </span>
      </div>

      <div className="apps-kpi-grid relative z-10">
        <KpiCard
          testId="apps-kpi-installed"
          label={t(locale, 'Installed applications', 'التطبيقات المثبتة')}
          value={kpis ? formatCount(kpis.installed) : '—'}
          sub={
            kpis
              ? `${formatCount(kpis.packaged)} ${t(locale, 'packaged', 'حزمة')} · ${formatCount(kpis.protectedCount)} ${t(locale, 'protected', 'محمي')}`
              : t(locale, 'Waiting for the native provider', 'بانتظار المزوّد الأصلي')
          }
          icon={<LayoutGrid className="w-4 h-4" />}
          accent="#2476ff"
        />
        <KpiCard
          testId="apps-kpi-publishers"
          label={t(locale, 'Publishers', 'الناشرون')}
          value={kpis ? formatCount(kpis.publishers) : '—'}
          sub={t(locale, 'Distinct measured registry/package publishers', 'ناشرون متمايزون في السجل/الحزم')}
          icon={<Building2 className="w-4 h-4" />}
          accent="#a855f7"
        />
        <KpiCard
          testId="apps-kpi-startup"
          label={t(locale, 'Startup-linked apps', 'تطبيقات مرتبطة بالإقلاع')}
          value={kpis ? formatCount(kpis.startupLinked) : '—'}
          sub={
            kpis
              ? `${formatCount(kpis.startupEntries)} ${t(locale, 'measured startup entries', 'مدخل إقلاع مقيس')}`
              : t(locale, 'Startup linkage not read', 'لم يُقرأ ارتباط الإقلاع')
          }
          icon={<Zap className="w-4 h-4" />}
          accent="#f97316"
        />
        <KpiCard
          testId="apps-kpi-size"
          label={t(locale, 'Measured footprint', 'البصمة المقيسة')}
          value={formatBytes(footprint)}
          sub={footprintSub}
          icon={<Database className="w-4 h-4" />}
          accent="#10b981"
        />
        <KpiCard
          testId="apps-kpi-updates"
          label={t(locale, 'Updates available', 'التحديثات المتاحة')}
          value={updatesMeasured == null ? '—' : formatCount(updatesMeasured)}
          sub={updatesSub}
          icon={<RefreshCw className="w-4 h-4" />}
          accent="#26c6ff"
        />
      </div>
    </section>
  );
};
