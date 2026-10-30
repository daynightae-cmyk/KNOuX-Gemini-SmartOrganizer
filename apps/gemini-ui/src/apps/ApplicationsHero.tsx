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
import { ServicePipeline } from '../visual/ServicePipeline';
import type { DomainServiceKey } from '../lib/app-inventory';

interface ApplicationsHeroProps {
  locale: AppsLocale;
  controller: ApplicationsController;
  selectedCount: number;
  onBuildPlan: () => void;
  onOpenService: (service: DomainServiceKey) => void;
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
  const { inventory, capabilities, refreshing } = controller;

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
            {t(locale, 'Applications', 'التطبيقات')}
          </h1>
          <p className="apps-hero-copy">
            {t(
              locale,
              'Manage, update, and understand every installed application. The register is measured, read-only and leaves Windows untouched.',
              'أدر كل تطبيق مثبت وحدّثه وافهمه. السجل مقيس وللقراءة فقط، ولا يغيّر Windows.'
            )}
          </p>
          <ServicePipeline
            locale={locale}
            accent="rose"
            testId="apps-pipeline"
            onSelect={id => onOpenService(id==='inventory'?'app-inventory':id==='inspect'||id==='signatures'?'app-identity':id==='updates'?'app-updates':id==='uninstall'?'app-uninstall-queue':id==='footprint'?'app-size':'app-search')}
            live={refreshing || Boolean(controller.signatureBusyId) || controller.sizesBusy || controller.updatesBusy}
            caption={coverageText(inventory, locale)}
            stages={[
              {
                id: 'inventory',
                label: t(locale, 'Inventory', 'جرد'),
                state: inventory ? 'complete' : refreshing ? 'active' : 'pending',
              },
              {
                id: 'inspect',
                label: t(locale, 'Inspect', 'فحص'),
                state: controller.signatures ? 'complete' : controller.signatureBusyId ? 'active' : 'pending',
              },
              {
                id: 'updates',
                label: t(locale, 'Updates', 'تحديثات'),
                state: controller.updates ? 'complete' : controller.updatesBusy ? 'active' : 'pending',
              },
              {
                id: 'footprint',
                label: t(locale, 'Footprint', 'بصمة'),
                state: controller.sizes ? 'complete' : controller.sizesBusy ? 'active' : 'pending',
              },
              {
                id: 'uninstall',
                label: t(locale, 'Uninstall review', 'مراجعة الإزالة'),
                state: 'gated',
              },
              {
                id: 'evidence',
                label: t(locale, 'Evidence', 'أدلة'),
                state: inventory ? 'complete' : 'pending',
              },
            ]}
          />
        </div>

        <OrbitalControl title={t(locale, 'Analyze Applications', 'تحليل التطبيقات')} subtitle={t(locale, 'Inventory · Inspect · Review', 'جرد · فحص · مراجعة')}
          eyebrow={t(locale, 'Application scopes', 'نطاقات التطبيقات')}
          onActivate={() => void controller.refreshInventory(true)} disabled={refreshing || !controller.nativeAvailable} running={refreshing}
          tools={[
            { id: 'inventory', label: t(locale, 'Inventory', 'الجرد'), icon: LayoutGrid, onClick: () => void controller.refreshInventory(true), disabled: refreshing || !controller.nativeAvailable },
            { id: 'updates', label: t(locale, 'Updates', 'التحديثات'), icon: RefreshCw, onClick: () => void controller.checkUpdates(), disabled: !controller.nativeAvailable },
            { id: 'export', label: t(locale, 'Export', 'تصدير'), icon: Download, onClick: controller.exportInventory, disabled: !inventory },
            { id: 'publishers', label: t(locale, 'Publishers', 'الناشرون'), icon: Building2, onClick: () => onOpenService('app-publisher') },
            { id: 'footprint', label: t(locale, 'Footprint', 'المساحة'), icon: Database, onClick: () => onOpenService('app-size') },
            { id: 'startup', label: t(locale, 'Startup links', 'روابط الإقلاع'), icon: Zap, onClick: () => onOpenService('app-startup-impact') },
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
    </section>
  );
};

/** Reference metrics row: measured values only, separated from the intro card. */
export const ApplicationsMetrics: React.FC<{ locale: AppsLocale; controller: ApplicationsController }> = ({ locale, controller }) => {
  const { inventory, updates } = controller;
  const kpis = inventory?.kpis;
  const updatesMeasured = updates && updates.status === 'available' ? updates.items.length : null;
  const footprint = kpis?.measuredFootprintBytes;
  return (
    <div className="apps-kpi-grid">
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
        sub={t(locale, 'Measured registry + Appx', 'السجل + Appx')}
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
        sub={
          kpis
            ? `${formatCount(kpis.measuredFootprintApps)} ${t(locale, 'app(s) measured', 'تطبيقًا مقيسًا')} · ${t(locale, 'reported', 'مبلّغ')} ${formatBytes(kpis.reportedFootprintBytes)}`
            : t(locale, 'Not measured yet', 'لم تُقس بعد')
        }
        icon={<Database className="w-4 h-4" />}
        accent="#10b981"
      />
      <KpiCard
        testId="apps-kpi-updates"
        label={t(locale, 'Updates available', 'التحديثات المتاحة')}
        value={updatesMeasured == null ? '—' : formatCount(updatesMeasured)}
        sub={updates ? updateStatusLabel(updates, locale) : t(locale, 'WinGet not queried yet', 'لم يُستعلم WinGet بعد')}
        icon={<RefreshCw className="w-4 h-4" />}
        accent="#26c6ff"
      />
    </div>
  );
};
