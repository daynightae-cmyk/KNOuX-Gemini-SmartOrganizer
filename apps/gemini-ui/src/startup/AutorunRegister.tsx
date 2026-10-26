/**
 * Autorun register — every row is measured evidence from the read-only scan.
 * No boot delay is inferred from a name or a fixture.
 */
import React from 'react';
import {
  ArrowDownWideNarrow,
  CheckSquare,
  Filter,
  Lock,
  Search,
  ShieldCheck,
  Square,
} from 'lucide-react';
import type { StartupEntry } from '../../shared/native-contracts';
import {
  ENTRY_SOURCES,
  SIGNATURE_META,
  SOURCE_META,
  STATE_META,
  filterEntries,
  formatCount,
  protectionLabel,
  scopeLabel,
  signatureLabel,
  sourceLabel,
  stateLabel,
  t,
} from './model';
import type { StartupFilters, StartupLocale, StartupSourceKind } from './model';

export interface AutorunRegisterProps {
  locale: StartupLocale;
  entries: StartupEntry[];
  counts: Record<'all' | StartupSourceKind, number>;
  filters: StartupFilters;
  onChangeFilters: (next: Partial<StartupFilters>) => void;
  onResetFilters: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  checkedIds: Set<string>;
  onToggleCheck: (id: string) => void;
  onToggleAll: () => void;
  loading: boolean;
  scanning: boolean;
  totalCount: number;
}

function SignatureBadge({ signature, locale }: { signature: StartupEntry['signature']; locale: StartupLocale }) {
  const meta = SIGNATURE_META[signature];
  return (
    <span className={`stp-badge stp-badge-${meta.tone} stp-badge-signature`} title={signatureLabel(signature, locale)}>
      {signature === 'valid' ? <ShieldCheck className="w-3 h-3" /> : <span className="stp-badge-dot" />}
      <span>{locale === 'ar' ? meta.ar : meta.en}</span>
    </span>
  );
}

export function AutorunRegister({
  locale,
  entries,
  counts,
  filters,
  onChangeFilters,
  onResetFilters,
  selectedId,
  onSelect,
  checkedIds,
  onToggleCheck,
  onToggleAll,
  loading,
  scanning,
  totalCount,
}: AutorunRegisterProps) {
  const everyChecked = entries.length > 0 && entries.every((entry) => checkedIds.has(entry.id));
  const selectedCount = checkedIds.size;

  return (
    <section className="stp-panel stp-register" data-testid="startup-register">
      <header className="stp-panel-head">
        <div>
          <h2 className="stp-panel-title">{t(locale, 'Windows Autorun Register', 'سجل بدء تشغيل Windows')}</h2>
          <p className="stp-panel-sub">
            {t(
              locale,
              'Measured Registry Run, Startup folder and logon task evidence. Nothing is toggled here.',
              'أدلة مقيسة من Run ومجلدات البدء ومهام تسجيل الدخول. لا يُغيَّر أي شيء هنا.'
            )}
          </p>
        </div>
        <div className="stp-panel-tools">
          <button
            type="button"
            className="stp-btn stp-btn-quiet"
            onClick={onToggleAll}
            disabled={!entries.length}
            aria-label={t(locale, 'Select all visible entries', 'تحديد كل المداخل الظاهرة')}
          >
            {everyChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            {everyChecked ? t(locale, 'Clear visible', 'مسح الظاهر') : t(locale, 'Select visible', 'تحديد الظاهر')}
          </button>
          <button
            type="button"
            className="stp-icon-btn"
            onClick={onResetFilters}
            aria-label={t(locale, 'Reset filters', 'إعادة ضبط المرشحات')}
            title={t(locale, 'Reset filters', 'إعادة ضبط المرشحات')}
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="stp-tabs" role="tablist" aria-label={t(locale, 'Autorun sources', 'مصادر بدء التشغيل')}>
        <button
          type="button"
          role="tab"
          aria-selected={filters.source === 'all'}
          className={`stp-tab ${filters.source === 'all' ? 'is-active' : ''}`}
          onClick={() => onChangeFilters({ source: 'all' })}
        >
          {t(locale, 'All Sources', 'كل المصادر')}
          <span className="stp-tab-count">{formatCount(counts.all)}</span>
        </button>
        {ENTRY_SOURCES.map((source) => (
          <button
            key={source}
            type="button"
            role="tab"
            aria-selected={filters.source === source}
            className={`stp-tab ${filters.source === source ? 'is-active' : ''}`}
            style={{ '--stp-source': SOURCE_META[source].accent } as React.CSSProperties}
            onClick={() => onChangeFilters({ source })}
          >
            <span className="stp-source-dot" />
            {sourceLabel(source, locale)}
            <span className="stp-tab-count">{formatCount(counts[source])}</span>
          </button>
        ))}
      </div>

      <div className="stp-filter-row">
        <label className="stp-search">
          <Search className="w-3.5 h-3.5" />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => onChangeFilters({ query: event.target.value })}
            placeholder={t(locale, 'Search name, publisher, command, path…', 'ابحث بالاسم أو الناشر أو الأمر أو المسار…')}
            aria-label={t(locale, 'Search measured autoruns', 'بحث في مداخل البدء المقيسة')}
          />
        </label>

        <div className="stp-seg" role="group" aria-label={t(locale, 'Autorun state', 'حالة بدء التشغيل')}>
          {(['all', 'enabled', 'disabled', 'unknown'] as const).map((state) => (
            <button
              key={state}
              type="button"
              className={filters.state === state ? 'is-active' : ''}
              aria-pressed={filters.state === state}
              onClick={() => onChangeFilters({ state })}
            >
              {state === 'all' ? t(locale, 'All states', 'كل الحالات') : stateLabel(state, locale)}
            </button>
          ))}
        </div>

        <select
          className="stp-select"
          value={filters.scope}
          onChange={(event) => onChangeFilters({ scope: event.target.value as StartupFilters['scope'] })}
          aria-label={t(locale, 'Scope filter', 'مرشح النطاق')}
        >
          <option value="all">{t(locale, 'All scopes', 'كل النطاقات')}</option>
          <option value="user">{t(locale, 'Current user', 'المستخدم الحالي')}</option>
          <option value="machine">{t(locale, 'All users', 'كل المستخدمين')}</option>
        </select>

        <select
          className="stp-select stp-select-sort"
          value={filters.sort}
          onChange={(event) => onChangeFilters({ sort: event.target.value as StartupFilters['sort'] })}
          aria-label={t(locale, 'Sort autoruns', 'ترتيب مداخل البدء')}
        >
          <option value="name">{t(locale, 'Name A–Z', 'الاسم أ–ي')}</option>
          <option value="source">{t(locale, 'Source', 'المصدر')}</option>
          <option value="state">{t(locale, 'State', 'الحالة')}</option>
          <option value="signature">{t(locale, 'Signature', 'التوقيع')}</option>
        </select>
      </div>

      <div className="stp-table-wrap knx-custom-scrollbar">
        <table className="stp-table">
          <thead>
            <tr>
              <th className="stp-col-check">
                <input
                  type="checkbox"
                  checked={everyChecked}
                  onChange={onToggleAll}
                  disabled={!entries.length}
                  aria-label={t(locale, 'Select all visible rows', 'تحديد كل الصفوف الظاهرة')}
                />
              </th>
              <th>{t(locale, 'Application & publisher', 'التطبيق والناشر')}</th>
              <th className="stp-col-source">{t(locale, 'Source', 'المصدر')}</th>
              <th className="stp-col-signature">{t(locale, 'Signature', 'التوقيع')}</th>
              <th className="stp-col-state">{t(locale, 'State', 'الحالة')}</th>
              <th className="stp-col-protect">{t(locale, 'Protection', 'الحماية')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const selected = entry.id === selectedId;
              const checked = checkedIds.has(entry.id);
              const state = STATE_META[entry.state];
              return (
                <tr
                  key={entry.id}
                  data-testid="startup-register-row"
                  tabIndex={0}
                  aria-selected={selected}
                  className={`${selected ? 'is-selected' : ''} ${checked ? 'is-checked' : ''}`}
                  onClick={() => onSelect(entry.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(entry.id);
                    }
                  }}
                >
                  <td className="stp-col-check" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleCheck(entry.id)}
                      aria-label={`${t(locale, 'Select', 'تحديد')} ${entry.name}`}
                    />
                  </td>
                  <td>
                    <div className="stp-row-main">
                      <div className="min-w-0">
                        <div className="stp-row-name" title={entry.name}>{entry.name}</div>
                        <div className="stp-row-sub" title={entry.publisher || undefined}>
                          {entry.publisher || t(locale, 'Publisher not measured', 'لم يُقس الناشر')}
                          {entry.elevationRequired ? (
                            <span className="stp-row-flag"> · {t(locale, 'elevation', 'رفع صلاحيات')}</span>
                          ) : null}
                        </div>
                      </div>
                      {entry.protection === 'protected' ? (
                        <Lock className="w-3.5 h-3.5 stp-icon-amber" aria-label={protectionLabel('protected', locale)} />
                      ) : null}
                    </div>
                  </td>
                  <td className="stp-col-source">
                    <span className="stp-source-chip" style={{ '--stp-source': SOURCE_META[entry.sourceKind].accent } as React.CSSProperties}>
                      {SOURCE_META[entry.sourceKind].short}
                    </span>
                    <div className="stp-row-sub stp-ellipsis" title={entry.location}>{entry.location}</div>
                    <div className="stp-row-faint">{scopeLabel(entry.scope, locale)}</div>
                  </td>
                  <td className="stp-col-signature">
                    <SignatureBadge signature={entry.signature} locale={locale} />
                  </td>
                  <td className="stp-col-state">
                    <span className={`stp-badge stp-badge-${state.tone}`}>
                      <span className="stp-badge-dot" />
                      {state[locale === 'ar' ? 'ar' : 'en']}
                    </span>
                  </td>
                  <td className="stp-col-protect">
                    {entry.protection === 'protected' ? (
                      <span className="stp-protect-chip" title={entry.protectionReason || undefined}>
                        <Lock className="w-3 h-3" />
                        {t(locale, 'Protected', 'محمي')}
                      </span>
                    ) : (
                      <span className="stp-row-faint">{t(locale, 'Standard', 'قياسي')}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && !entries.length ? (
          <div className="stp-skeleton-list" aria-hidden="true">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="stp-skeleton-row" style={{ opacity: 1 - index * 0.1 }}>
                <span className="stp-skeleton stp-skeleton-dot" />
                <span className="stp-skeleton stp-skeleton-line" />
                <span className="stp-skeleton stp-skeleton-short" />
                <span className="stp-skeleton stp-skeleton-short" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && !entries.length ? (
          <div className="stp-empty">
            <div className="stp-empty-icon"><Search className="w-5 h-5" /></div>
            <strong>
              {scanning
                ? t(locale, 'Measuring autoruns…', 'جارٍ قياس مداخل البدء…')
                : totalCount
                  ? t(locale, 'No autorun matches these filters', 'لا يوجد مدخل بدء يطابق هذه المرشحات')
                  : t(locale, 'No autorun entry was measured', 'لم يُقس أي مدخل بدء')}
            </strong>
            <p>
              {scanning
                ? t(locale, 'The read-only registry, folder and task stages are running.', 'مراحل التسجيل والمجلدات والمهام للقراءة فقط قيد التشغيل.')
                : totalCount
                  ? t(locale, 'Reset the filters to return to the measured register.', 'أعد ضبط المرشحات للعودة إلى السجل المقيس.')
                  : t(locale, 'Windows returned no Run, startup-folder or logon-task entry, or access was denied. Nothing is substituted.', 'لم يُرجع Windows أي مدخل Run أو مجلد بدء أو مهمة دخول، أو رُفض الوصول. لا يُستبدل أي شيء.')}
            </p>
          </div>
        ) : null}
      </div>

      <footer className="stp-register-foot">
        <span>
          <ArrowDownWideNarrow className="w-3 h-3" />
          {formatCount(entries.length)} {t(locale, 'of', 'من')} {formatCount(totalCount)} {t(locale, 'measured entries', 'مدخلًا مقيسًا')}
        </span>
        <span className="stp-foot-actions">
          <button
            type="button"
            className={`stp-link ${filters.prevention === 'protected' ? 'is-active' : ''}`}
            onClick={() => onChangeFilters({ prevention: filters.prevention === 'protected' ? 'all' : 'protected' })}
          >
            <Lock className="w-3 h-3" />
            {t(locale, 'Protected only', 'المحمي فقط')}
          </button>
          <button
            type="button"
            className={`stp-link ${filters.signature === 'unsigned' ? 'is-active' : ''}`}
            onClick={() => onChangeFilters({ signature: filters.signature === 'unsigned' ? 'all' : 'unsigned' })}
          >
            <ShieldCheck className="w-3 h-3" />
            {t(locale, 'Unsigned only', 'غير الموقّع فقط')}
          </button>
        </span>
      </footer>
    </section>
  );
}

export function filterRegister(entries: StartupEntry[], filters: StartupFilters): StartupEntry[] {
  return filterEntries(entries, filters);
}
