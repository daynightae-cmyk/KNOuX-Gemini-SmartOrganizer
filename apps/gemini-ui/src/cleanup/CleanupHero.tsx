/**
 * Clean Room hero — measured coverage, candidate and reclaim evidence.
 * No value is rendered until the native coordinator returns it.
 */
import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  FlaskConical,
  HardDrive,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
} from 'lucide-react';
import type { CleanupCategory } from '../../shared/native-contracts';
import type { CleanupController } from './useCleanup';
import {
  CATEGORY_META,
  SCAN_CATEGORIES,
  categoryLabel,
  formatBytes,
  formatCount,
  formatPercent,
  t,
} from './model';
import type { CleanupLocale } from './model';
import { OrbitalControl } from '../visual/OrbitalControl';
import { HeroFeatures } from '../visual/HeroFeatures';

export interface CleanupHeroProps {
  locale: CleanupLocale;
  controller: CleanupController;
  selectedCount: number;
  onReviewSelection: () => void;
}

function coveragePercent(controller: CleanupController): number | null {
  const coverage = controller.inventory?.coverage;
  if (coverage) {
    const total = coverage.rootsScanned + coverage.rootsUnavailable;
    if (total > 0) return Math.round((coverage.rootsScanned / total) * 100);
  }
  if (controller.session) {
    return Math.max(0, Math.min(100, controller.session.progressPercent));
  }
  return null;
}

export function CleanupHero({ locale, controller, selectedCount, onReviewSelection }: CleanupHeroProps) {
  const [categories, setCategories] = useState<CleanupCategory[]>([...SCAN_CATEGORIES]);
  const [ageDays, setAgeDays] = useState(1);
  const scanning = controller.scanning;
  const runningStage = controller.session?.categories.find((stage) => stage.status === 'running')?.key || null;

  const toggleCategory = (key: CleanupCategory) => {
    if (scanning) return;
    setCategories((current) => (
      current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]
    ));
  };

  const canScan = categories.length > 0 && !scanning;

  return (
    <section className="cln-hero">
      <div className="cln-hero-arc" aria-hidden="true" />
      <div className="cln-hero-beam" aria-hidden="true" />
      <div className="cln-hero-grain" aria-hidden="true" />

      <div className="cln-hero-head">
        <div className="cln-hero-mark">
          <FlaskConical className="w-6 h-6" />
        </div>
        <div className="cln-hero-title-wrap">
          <div className="cln-breadcrumb">
            <span>{t(locale, 'Protect', 'الحماية')}</span>
            <ArrowRight className="w-3 h-3" />
            <span>{t(locale, 'Clean Room', 'غرفة التنظيف')}</span>
            <span className="cln-breadcrumb-tag">{t(locale, 'MISSION 08', 'المهمة 08')}</span>
          </div>
          <h1 className="cln-hero-title">{t(locale, 'Smart Cleanup', 'التنظيف الذكي')}</h1>
          <p className="cln-hero-copy">
            {t(
              locale,
              'Remove junk, clear unnecessary files, and protect your privacy with measured, safe cleanup tools.',
              'أزل الملفات غير الضرورية ونظّف الفوضى واحمِ خصوصيتك بأدوات تنظيف مقيسة وآمنة.'
            )}
          </p>
          <HeroFeatures
            items={[
              {
                icon: <ShieldCheck className="w-4 h-4" />,
                title: t(locale, 'Safe & secure', 'آمن ومحمي'),
                detail: t(locale, 'Discovery is read-only; quarantine and deletion stay gated.', 'الاستكشاف للقراءة فقط؛ الحجر والحذف محجوبان حتى الموافقة.'),
                tone: '#7c5cff',
              },
              {
                icon: <HardDrive className="w-4 h-4" />,
                title: t(locale, 'Frees up space', 'يوفّر المساحة'),
                detail: t(locale, 'Every reclaim figure comes from a measured candidate.', 'كل رقم مساحة مستعادة يأتي من مرشح مقيس.'),
                tone: '#f59e0b',
              },
              {
                icon: <FileText className="w-4 h-4" />,
                title: t(locale, 'Keeps you private', 'يحفظ خصوصيتك'),
                detail: t(locale, 'Review browser, log and temporary-file evidence before acting.', 'راجع أدلة المتصفح والسجلات والملفات المؤقتة قبل الإجراء.'),
                tone: '#10b981',
              },
            ]}
          />
        </div>
        <OrbitalControl title={t(locale, 'Analyze Cleanup', 'تحليل التنظيف')} subtitle={t(locale, 'Discover · Review · Confirm', 'استكشف · راجع · وافق')}
          onActivate={() => void controller.startScan(categories, ageDays)} disabled={!controller.nativeAvailable || !canScan} running={scanning}
          tools={[
            { id: 'analyze', label: t(locale, 'Analyze', 'تحليل'), icon: FlaskConical, onClick: () => void controller.startScan(categories, ageDays), disabled: !controller.nativeAvailable || !canScan },
            { id: 'review', label: t(locale, 'Review', 'مراجعة'), icon: FileText, onClick: onReviewSelection, disabled: selectedCount === 0 },
            { id: 'refresh', label: t(locale, 'Refresh', 'تحديث'), icon: RotateCcw, onClick: () => void controller.refresh(true), disabled: !controller.nativeAvailable || scanning },
          ]} />
        <div className="cln-hero-actions">
          <button
            type="button"
            className="cln-btn cln-btn-ghost"
            onClick={() => void controller.refresh(true)}
            disabled={!controller.nativeAvailable || controller.refreshing || scanning}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${controller.refreshing ? 'cln-spin' : ''}`} />
            {t(locale, 'Refresh evidence', 'تحديث الأدلة')}
          </button>
          {scanning ? (
            <button
              type="button"
              className="cln-btn cln-btn-danger"
              onClick={() => void controller.cancelScan()}
              disabled={controller.cancelling}
            >
              <Square className="w-3.5 h-3.5" />
              {controller.cancelling ? t(locale, 'Cancelling…', 'جارٍ الإلغاء…') : t(locale, 'Cancel discovery', 'إلغاء الاستكشاف')}
            </button>
          ) : (
            <button
              type="button"
              className="cln-btn cln-btn-primary"
              data-testid="cleanup-scan-btn"
              onClick={() => void controller.startScan(categories, ageDays)}
              disabled={!controller.nativeAvailable || !canScan}
            >
              <Play className="w-3.5 h-3.5" />
              {t(locale, 'Run measured discovery', 'تشغيل استكشاف مقيس')}
            </button>
          )}
        </div>
      </div>

      <details className="cln-scope-details" open={scanning || undefined}>
        <summary>{t(locale, 'Discovery scope & age', 'نطاق الاستكشاف وعمر الملفات')} · {categories.length}</summary>
      <div className="cln-scan-strip">
        <div className="cln-category-toggles" role="group" aria-label={t(locale, 'Discovery categories', 'فئات الاستكشاف')}>
          {SCAN_CATEGORIES.map((key) => {
            const active = categories.includes(key);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                className={`cln-cat-toggle ${active ? 'is-active' : ''}`}
                style={{ '--cln-cat': CATEGORY_META[key].color } as React.CSSProperties}
                onClick={() => toggleCategory(key)}
                disabled={scanning}
              >
                <span className="cln-cat-dot" />
                {categoryLabel(key, locale)}
              </button>
            );
          })}
        </div>
        <label className="cln-age-select">
          <span>{t(locale, 'Older than', 'أقدم من')}</span>
          <select
            value={ageDays}
            onChange={(event) => setAgeDays(Number(event.target.value))}
            disabled={scanning}
            aria-label={t(locale, 'Minimum candidate age', 'الحد الأدنى لعمر المرشح')}
          >
            <option value={0}>{t(locale, 'Any age', 'أي عمر')}</option>
            <option value={1}>{t(locale, '1 day', 'يوم واحد')}</option>
            <option value={7}>{t(locale, '7 days', '7 أيام')}</option>
            <option value={30}>{t(locale, '30 days', '30 يومًا')}</option>
          </select>
        </label>
        <div className="cln-scan-state" data-testid="cleanup-scan-state">
          {scanning ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span>
                {t(locale, 'Measuring', 'جارٍ القياس')} {runningStage ? categoryLabel(runningStage, locale) : t(locale, 'read-only roots', 'جذور للقراءة فقط')}
              </span>
              <div className="cln-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={controller.session?.progressPercent ?? 0}>
                <div className="cln-progress-fill" style={{ width: `${controller.session?.progressPercent ?? 0}%` }} />
              </div>
              <span className="cln-mono">{formatPercent(controller.session?.progressPercent ?? 0)}</span>
            </>
          ) : controller.inventory?.observedAt ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {t(locale, 'Last measured', 'آخر قياس')} {new Date(controller.inventory.observedAt).toLocaleTimeString(locale === 'ar' ? 'ar' : 'en-GB')}
              </span>
              <span className="cln-chip cln-chip-muted">{t(locale, 'READ-ONLY', 'للقراءة فقط')}</span>
            </>
          ) : (
            <span>{t(locale, 'Nothing is read until you run discovery.', 'لا شيء يُقرأ حتى تشغّل الاستكشاف.')}</span>
          )}
        </div>
        {selectedCount > 0 ? (
          <button type="button" className="cln-btn cln-btn-quiet ml-auto" onClick={onReviewSelection}>
            {t(locale, 'Review', 'مراجعة')} {formatCount(selectedCount)}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
      </details>
    </section>
  );
}

/** Reference metrics row below the intro card. Values stay measured or empty. */
export function CleanupMetrics({ locale, controller }: { locale: CleanupLocale; controller: CleanupController }) {
  const summary = controller.inventory?.summary;
  const coverage = coveragePercent(controller);
  return (
    <div className="cln-kpis">
      <div className="cln-kpi cln-kpi-coverage">
        <div className="cln-gauge" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="cln-gauge-svg">
            <path className="cln-gauge-track" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path
              className="cln-gauge-value"
              strokeDasharray={`${coverage ?? 0}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span>{coverage == null ? '—' : formatPercent(coverage)}</span>
        </div>
        <div className="min-w-0">
          <div className="cln-kpi-title">{t(locale, 'Scan Coverage', 'تغطية الفحص')}</div>
          <div className="cln-kpi-sub">
            {controller.inventory?.coverage
              ? `${formatCount(controller.inventory.coverage.rootsScanned)} ${t(locale, 'roots measured', 'جذرًا مقيسًا')} · ${formatCount(controller.inventory.coverage.rootsUnavailable)} ${t(locale, 'unavailable', 'غير متاح')}`
              : t(locale, 'No measured discovery yet', 'لا يوجد استكشاف مقيس بعد')}
          </div>
          {controller.inventory?.coverage?.truncated ? (
            <div className="cln-kpi-note cln-warn">{t(locale, 'A bounded budget truncated a tree; bytes are a lower bound.', 'ميزانية محدودة قطعت شجرة؛ الأحجام حد أدنى.')}</div>
          ) : null}
        </div>
      </div>

      <div className="cln-kpi cln-kpi-candidates">
        <div className="cln-kpi-icon"><FileText className="w-5 h-5" /></div>
        <div className="min-w-0">
          <div className="cln-kpi-value" data-testid="cleanup-kpi-candidates-value">
            {summary ? formatCount(summary.candidates) : '—'}
          </div>
          <div className="cln-kpi-title">{t(locale, 'Candidate Files', 'ملفات مرشحة')}</div>
          <div className="cln-kpi-sub">
            {summary
              ? `${formatCount(summary.eligibleCount)} ${t(locale, 'eligible', 'مؤهل')} · ${formatCount(summary.reviewCount)} ${t(locale, 'review', 'مراجعة')}`
              : t(locale, 'Awaiting measured discovery', 'بانتظار استكشاف مقيس')}
          </div>
        </div>
      </div>

      <div className="cln-kpi cln-kpi-reclaim">
        <div className="cln-kpi-icon"><HardDrive className="w-5 h-5" /></div>
        <div className="min-w-0">
          <div className="cln-kpi-value cln-amber" data-testid="cleanup-kpi-eligible-value">
            {summary ? formatBytes(summary.eligibleBytes) : '—'}
          </div>
          <div className="cln-kpi-title">{t(locale, 'Eligible Reclaim Evidence', 'دليل المساحة المؤهلة')}</div>
          <div className="cln-kpi-sub">
            {summary
              ? `${formatBytes(summary.reviewBytes)} ${t(locale, 'needs review', 'تحتاج مراجعة')} · ${formatBytes(summary.blockedBytes)} ${t(locale, 'blocked', 'محجوب')}`
              : t(locale, 'Measured sizes only; never a reclaimed claim', 'أحجام مقيسة فقط؛ ليست مطالبة باستعادة')}
          </div>
        </div>
      </div>

      <div className="cln-kpi cln-kpi-review">
        <div className="cln-kpi-icon"><AlertTriangle className="w-5 h-5" /></div>
        <div className="min-w-0">
          <div className="cln-kpi-value cln-rose" data-testid="cleanup-kpi-review-value">
            {summary ? formatCount(summary.reviewCount) : '—'}
          </div>
          <div className="cln-kpi-title">{t(locale, 'Items Requiring Review', 'عناصر تحتاج مراجعة')}</div>
          <div className="cln-kpi-sub">
            {summary
              ? `${formatCount(summary.blockedCount)} ${t(locale, 'protected by policy', 'محمية بالسياسة')}`
              : t(locale, 'Windows-owned roots stay blocked', 'جذور Windows تبقى محجوبة')}
          </div>
        </div>
      </div>
    </div>
  );
}
