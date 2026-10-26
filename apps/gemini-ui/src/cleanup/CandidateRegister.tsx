/**
 * Candidate ledger — every row is measured evidence from the Clean Room scan.
 */
import React, { useMemo } from 'react';
import {
  ArrowDownWideNarrow,
  CheckCheck,
  FileWarning,
  Filter,
  HardDrive,
  Search,
  ShieldAlert,
} from 'lucide-react';
import type { CleanupCandidate, CleanupCategory } from '../../shared/native-contracts';
import type { CleanupLocale } from './model';
import {
  CATEGORY_META,
  SCAN_CATEGORIES,
  categoryBytes,
  categoryCounts,
  categoryLabel,
  formatAge,
  formatBytes,
  formatCount,
  safetyLabel,
  t,
} from './model';
import type { CleanupFilters } from './model';

export interface CandidateRegisterProps {
  locale: CleanupLocale;
  candidates: CleanupCandidate[];
  filters: CleanupFilters;
  onChangeFilters: (next: Partial<CleanupFilters>) => void;
  onResetFilters: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  checkedIds: Set<string>;
  onToggleCheck: (id: string) => void;
  onToggleAll: () => void;
  onSelectSafeDefaults: () => void;
  loading: boolean;
  scanning: boolean;
}

function CategoryIcon({ category }: { category: CleanupCategory }) {
  if (category === 'temp') return <FileWarning className="w-3.5 h-3.5" />;
  if (category === 'browser') return <Search className="w-3.5 h-3.5" />;
  if (category === 'logs') return <FileWarning className="w-3.5 h-3.5" />;
  if (category === 'recycle') return <HardDrive className="w-3.5 h-3.5" />;
  if (category === 'update') return <ShieldAlert className="w-3.5 h-3.5" />;
  return <Filter className="w-3.5 h-3.5" />;
}

export function CandidateRegister({
  locale,
  candidates,
  filters,
  onChangeFilters,
  onResetFilters,
  selectedId,
  onSelect,
  checkedIds,
  onToggleCheck,
  onToggleAll,
  onSelectSafeDefaults,
  loading,
  scanning,
}: CandidateRegisterProps) {
  const counts = useMemo(() => categoryCounts(candidates), [candidates]);
  const distribution = useMemo(() => categoryBytes(candidates), [candidates]);
  const totalBytes = distribution.reduce((sum, entry) => sum + entry.bytes, 0);
  const everyChecked = candidates.length > 0 && candidates.every((candidate) => checkedIds.has(candidate.id));

  return (
    <section className="cln-panel cln-register" data-testid="cleanup-register">
      <header className="cln-panel-head">
        <div>
          <h2 className="cln-panel-title">{t(locale, 'Cleanup Candidates', 'العناصر المرشحة للتنظيف')}</h2>
          <p className="cln-panel-sub">
            {t(
              locale,
              'Measured metadata only. No file is opened, moved, renamed or deleted.',
              'بيانات وصفية مقيسة فقط. لا يُفتح أي ملف أو يُنقل أو يُعاد تسميته أو يُحذف.'
            )}
          </p>
        </div>
        <div className="cln-panel-tools">
          <button type="button" className="cln-btn cln-btn-quiet" onClick={onSelectSafeDefaults} disabled={!candidates.length}>
            <CheckCheck className="w-3.5 h-3.5" />
            {t(locale, 'Safe defaults', 'الافتراضي الآمن')}
          </button>
          <button type="button" className="cln-icon-btn" onClick={onResetFilters} aria-label={t(locale, 'Reset filters', 'إعادة ضبط المرشحات')}>
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="cln-tabs" role="tablist" aria-label={t(locale, 'Candidate categories', 'فئات المرشحين')}>
        <button
          type="button"
          role="tab"
          aria-selected={filters.category === 'all'}
          className={`cln-tab ${filters.category === 'all' ? 'is-active' : ''}`}
          onClick={() => onChangeFilters({ category: 'all' })}
        >
          {categoryLabel('all', locale)}
          <span className="cln-tab-count">{formatCount(counts.all)}</span>
        </button>
        {SCAN_CATEGORIES.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filters.category === key}
            className={`cln-tab ${filters.category === key ? 'is-active' : ''}`}
            style={{ '--cln-cat': CATEGORY_META[key].color } as React.CSSProperties}
            onClick={() => onChangeFilters({ category: key })}
          >
            <span className="cln-cat-dot" />
            {categoryLabel(key, locale)}
            <span className="cln-tab-count">{formatCount(counts[key])}</span>
          </button>
        ))}
      </div>

      <div className="cln-distribution">
        <div className="cln-distribution-bar" aria-hidden="true">
          {distribution.length ? distribution.map((entry) => (
            <div
              key={entry.key}
              className="cln-distribution-seg"
              style={{ width: `${totalBytes ? (entry.bytes / totalBytes) * 100 : 0}%`, background: entry.color }}
              title={`${categoryLabel(entry.key, locale)}: ${formatBytes(entry.bytes)}`}
            />
          )) : <div className="cln-distribution-empty" />}
        </div>
        <div className="cln-legend">
          {distribution.length ? distribution.map((entry) => (
            <span key={entry.key} className="cln-legend-item">
              <i style={{ background: entry.color }} />
              {categoryLabel(entry.key, locale)}
              <strong>{formatBytes(entry.bytes)}</strong>
            </span>
          )) : (
            <span className="cln-legend-item cln-muted">
              {t(locale, 'Run discovery to build the measured distribution.', 'شغّل الاستكشاف لبناء التوزيع المقيس.')}
            </span>
          )}
        </div>
      </div>

      <div className="cln-filter-row">
        <label className="cln-search">
          <Search className="w-3.5 h-3.5" />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => onChangeFilters({ query: event.target.value })}
            placeholder={t(locale, 'Filter by name, path or source…', 'رشّح بالاسم أو المسار أو المصدر…')}
            aria-label={t(locale, 'Filter candidates', 'ترشيح المرشحين')}
          />
        </label>
        <select
          className="cln-select"
          value={filters.safety}
          onChange={(event) => onChangeFilters({ safety: event.target.value as CleanupFilters['safety'] })}
          aria-label={t(locale, 'Safety filter', 'مرشح الأمان')}
        >
          <option value="all">{t(locale, 'All safety states', 'كل حالات الأمان')}</option>
          <option value="eligible">{safetyLabel('eligible', locale)}</option>
          <option value="review">{safetyLabel('review', locale)}</option>
          <option value="blocked">{safetyLabel('blocked', locale)}</option>
        </select>
        <label className="cln-sort">
          <ArrowDownWideNarrow className="w-3.5 h-3.5" />
          <select
            value={filters.sort}
            onChange={(event) => onChangeFilters({ sort: event.target.value as CleanupFilters['sort'] })}
            aria-label={t(locale, 'Sort candidates', 'ترتيب المرشحين')}
          >
            <option value="size">{t(locale, 'Largest first', 'الأكبر أولًا')}</option>
            <option value="age">{t(locale, 'Oldest first', 'الأقدم أولًا')}</option>
            <option value="name">{t(locale, 'Name', 'الاسم')}</option>
          </select>
        </label>
        <span className="cln-filter-count">
          {formatCount(candidates.length)} {t(locale, 'visible', 'ظاهر')}
        </span>
      </div>

      <div className="cln-table-wrap knx-custom-scrollbar" data-testid="cleanup-register-scroll">
        <table className="cln-table">
          <thead>
            <tr>
              <th className="cln-col-check">
                <input
                  type="checkbox"
                  checked={everyChecked}
                  onChange={onToggleAll}
                  disabled={!candidates.length}
                  aria-label={t(locale, 'Select all visible candidates', 'تحديد كل المرشحين الظاهرين')}
                />
              </th>
              <th>{t(locale, 'Name / Path', 'الاسم / المسار')}</th>
              <th>{t(locale, 'Source', 'المصدر')}</th>
              <th>{t(locale, 'Age', 'العمر')}</th>
              <th className="cln-col-num">{t(locale, 'Size', 'الحجم')}</th>
              <th>{t(locale, 'Safety', 'الأمان')}</th>
              <th className="cln-col-action">{t(locale, 'Inspect', 'فحص')}</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => {
              const selected = candidate.id === selectedId;
              const checked = checkedIds.has(candidate.id);
              return (
                <tr
                  key={candidate.id}
                  data-testid="cleanup-candidate-row"
                  className={`${selected ? 'is-selected' : ''} ${checked ? 'is-checked' : ''}`}
                  onClick={() => onSelect(candidate.id)}
                >
                  <td className="cln-col-check" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleCheck(candidate.id)}
                      aria-label={`${t(locale, 'Select', 'تحديد')} ${candidate.name}`}
                    />
                  </td>
                  <td>
                    <div className="cln-row-name" title={candidate.name}>{candidate.name}</div>
                    <div className="cln-row-path cln-mono" title={candidate.path || ''}>{candidate.path || '—'}</div>
                  </td>
                  <td>
                    <div className="cln-row-source">
                      <span className="cln-source-icon" style={{ color: CATEGORY_META[candidate.category].color }}>
                        <CategoryIcon category={candidate.category} />
                      </span>
                      {candidate.source}
                    </div>
                    <div className="cln-row-provider">{candidate.provider}</div>
                  </td>
                  <td className="cln-row-age">{formatAge(candidate.ageDays, locale)}</td>
                  <td className="cln-col-num cln-mono">{formatBytes(candidate.sizeBytes)}</td>
                  <td>
                    <span className={`cln-badge cln-badge-${candidate.safety}`}>
                      {safetyLabel(candidate.safety, locale)}
                    </span>
                  </td>
                  <td className="cln-col-action">
                    <button
                      type="button"
                      className="cln-icon-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(candidate.id);
                      }}
                      aria-label={`${t(locale, 'Inspect', 'فحص')} ${candidate.name}`}
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!candidates.length ? (
          <div className="cln-empty">
            <FileWarning className="w-7 h-7" />
            <strong>{scanning ? t(locale, 'Discovery is measuring…', 'الاستكشاف يقيس…') : t(locale, 'No measured candidates', 'لا يوجد مرشحون مقيسون')}</strong>
            <p>
              {scanning
                ? t(locale, 'Rows appear as each bounded stage completes.', 'تظهر الصفوف مع اكتمال كل مرحلة محدودة.')
                : loading
                  ? t(locale, 'Reading the last measured inventory…', 'جارٍ قراءة آخر جرد مقيس…')
                  : t(locale, 'Run a measured discovery or relax the filters. No example rows are substituted.', 'شغّل استكشافًا مقيسًا أو خفّف المرشحات. لا تُستبدل صفوف مثال.')}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
