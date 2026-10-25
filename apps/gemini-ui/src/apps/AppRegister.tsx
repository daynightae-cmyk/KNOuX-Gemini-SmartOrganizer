/**
 * Dense measured application register. Every row is a native record; filters
 * only narrow the measured inventory and never synthesize rows.
 */
import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Database,
  FilterX,
  Search,
  ShieldAlert,
  ShieldQuestion,
  Layers,
} from 'lucide-react';
import type { AppRecord, AppSignatureResult } from '../../shared/native-contracts';
import type { AppsFilters, AppsLocale } from './model';
import {
  formatBytes,
  formatCount,
  formatDate,
  scopeLabel,
  signatureLabel,
  signatureTone,
  sizeOf,
  sourceLabel,
  t,
} from './model';

interface AppRegisterProps {
  locale: AppsLocale;
  apps: AppRecord[];
  totalCount: number;
  filters: AppsFilters;
  onChangeFilters: (next: Partial<AppsFilters>) => void;
  onResetFilters: () => void;
  selectedAppId: string | null;
  onSelectApp: (appId: string) => void;
  checkedIds: Set<string>;
  onToggleCheck: (appId: string) => void;
  onToggleAll: () => void;
  signatures: Record<string, AppSignatureResult>;
  loading: boolean;
}

function signatureIcon(status: string) {
  if (status === 'valid') return <CheckCircle2 className="w-3 h-3" />;
  if (status === 'invalid' || status === 'unsigned') return <ShieldAlert className="w-3 h-3" />;
  if (status === 'unavailable') return <ShieldQuestion className="w-3 h-3" />;
  return <ShieldQuestion className="w-3 h-3 opacity-60" />;
}

function statusChips(app: AppRecord, locale: AppsLocale) {
  const chips: Array<{ label: string; tone: string }> = [];
  if (app.protected) chips.push({ label: t(locale, 'PROTECTED', 'محمي'), tone: 'apps-tag-protected' });
  if (app.isFramework) chips.push({ label: t(locale, 'FRAMEWORK', 'إطار'), tone: 'apps-tag-muted' });
  if (app.installLocation && app.installLocationExists === false) {
    chips.push({ label: t(locale, 'STALE PATH', 'مسار قديم'), tone: 'apps-tag-warn' });
  }
  if (app.startup.linked) chips.push({ label: t(locale, 'STARTUP', 'إقلاع'), tone: 'apps-tag-startup' });
  return chips;
}

export const AppRegister: React.FC<AppRegisterProps> = ({
  locale,
  apps,
  totalCount,
  filters,
  onChangeFilters,
  onResetFilters,
  selectedAppId,
  onSelectApp,
  checkedIds,
  onToggleCheck,
  onToggleAll,
  signatures,
  loading,
}) => {
  const allChecked = apps.length > 0 && apps.every((app) => checkedIds.has(app.id));

  return (
    <section className="apps-panel apps-register" data-testid="apps-register" aria-labelledby="apps-register-title">
      <header className="apps-panel-head">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 id="apps-register-title" className="apps-panel-title">
              {t(locale, 'Measured application register', 'سجل التطبيقات المقيس')}
            </h2>
            <span className="apps-count-pill" data-testid="apps-register-count">
              {formatCount(apps.length)} / {formatCount(totalCount)}
            </span>
          </div>
          <p className="apps-panel-sub">
            {t(
              locale,
              'Uninstall registry (64-bit, WOW6432Node, HKCU) and Appx/MSIX. Select a row for its dossier.',
              'سجل إلغاء التثبيت (64-bit وWOW6432Node وHKCU) وحزم Appx/MSIX. اختر صفًا لعرض ملفه.'
            )}
          </p>
        </div>
        <div className="apps-register-tools">
          <label className="apps-search">
            <Search className="w-3.5 h-3.5 opacity-70" />
            <input
              value={filters.query}
              onChange={(event) => onChangeFilters({ query: event.target.value })}
              placeholder={t(locale, 'Search name, publisher, product code…', 'ابحث بالاسم أو الناشر أو رمز المنتج…')}
              aria-label={t(locale, 'Search measured applications', 'البحث في التطبيقات المقيسة')}
              spellCheck={false}
            />
          </label>
          <label className="apps-select-wrap" title={t(locale, 'Scope filter', 'تصفية النطاق')}>
            <select
              value={filters.scope}
              onChange={(event) => onChangeFilters({ scope: event.target.value as AppsFilters['scope'] })}
              aria-label={t(locale, 'Filter by scope', 'التصفية حسب النطاق')}
            >
              <option value="all">{t(locale, 'All scopes', 'كل النطاقات')}</option>
              <option value="per-machine">{t(locale, 'Per machine', 'لكل الجهاز')}</option>
              <option value="per-user">{t(locale, 'Per user', 'لكل مستخدم')}</option>
              <option value="packaged">{t(locale, 'Packaged', 'حزمة')}</option>
            </select>
            <ChevronDown className="w-3 h-3" />
          </label>
          <label className="apps-select-wrap" title={t(locale, 'Source filter', 'تصفية المصدر')}>
            <select
              value={filters.view}
              onChange={(event) => onChangeFilters({ view: event.target.value as AppsFilters['view'] })}
              aria-label={t(locale, 'Filter register view', 'تصفية عرض السجل')}
            >
              <option value="all">{t(locale, 'All records', 'كل السجلات')}</option>
              <option value="desktop">{t(locale, 'Desktop apps', 'تطبيقات سطح المكتب')}</option>
              <option value="packaged">{t(locale, 'Packaged apps', 'التطبيقات المحزمة')}</option>
              <option value="protected">{t(locale, 'Protected', 'محمية')}</option>
              <option value="startup">{t(locale, 'Startup-linked', 'مرتبطة بالإقلاع')}</option>
              <option value="stale">{t(locale, 'Stale path', 'مسار قديم')}</option>
            </select>
            <ChevronDown className="w-3 h-3" />
          </label>
          <label className="apps-select-wrap" title={t(locale, 'Sort records', 'ترتيب السجلات')}>
            <select
              value={filters.sort}
              onChange={(event) => onChangeFilters({ sort: event.target.value as AppsFilters['sort'] })}
              aria-label={t(locale, 'Sort applications', 'ترتيب التطبيقات')}
            >
              <option value="name">{t(locale, 'Name A–Z', 'الاسم أ–ي')}</option>
              <option value="publisher">{t(locale, 'Publisher', 'الناشر')}</option>
              <option value="size">{t(locale, 'Largest first', 'الأكبر أولًا')}</option>
              <option value="date">{t(locale, 'Newest first', 'الأحدث أولًا')}</option>
            </select>
            <ChevronDown className="w-3 h-3" />
          </label>
          <button
            type="button"
            className="apps-icon-btn"
            onClick={onResetFilters}
            title={t(locale, 'Reset filters', 'إعادة ضبط التصفية')}
            aria-label={t(locale, 'Reset filters', 'إعادة ضبط التصفية')}
          >
            <FilterX className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="apps-table-wrap">
        <table className="apps-table">
          <thead>
            <tr>
              <th className="apps-col-check">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={onToggleAll}
                  aria-label={t(locale, 'Select all visible applications', 'تحديد كل التطبيقات الظاهرة')}
                />
              </th>
              <th>{t(locale, 'Application', 'التطبيق')}</th>
              <th className="apps-col-optional">{t(locale, 'Version', 'الإصدار')}</th>
              <th>{t(locale, 'Scope', 'النطاق')}</th>
              <th className="apps-col-optional">{t(locale, 'Source', 'المصدر')}</th>
              <th className="apps-col-num">{t(locale, 'Footprint', 'البصمة')}</th>
              <th>{t(locale, 'Signature', 'التوقيع')}</th>
              <th className="apps-col-optional">{t(locale, 'Installed', 'التثبيت')}</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => {
              const status = signatures[app.id]?.status || app.signature.status;
              const tone = signatureTone(status);
              const size = sizeOf(app);
              return (
                <tr
                  key={app.id}
                  data-testid="apps-register-row"
                  data-app-id={app.id}
                  className={selectedAppId === app.id ? 'apps-row-selected' : undefined}
                  onClick={() => onSelectApp(app.id)}
                >
                  <td className="apps-col-check" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checkedIds.has(app.id)}
                      onChange={() => onToggleCheck(app.id)}
                      aria-label={`${t(locale, 'Select', 'تحديد')} ${app.name}`}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="apps-row-main"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectApp(app.id);
                      }}
                      title={app.name}
                    >
                      <span className="apps-row-name">{app.name}</span>
                      <span className="apps-row-publisher">
                        {app.publisher || t(locale, 'Unknown publisher', 'ناشر غير معروف')}
                      </span>
                    </button>
                    <div className="apps-row-tags">
                      {statusChips(app, locale).map((chip) => (
                        <span key={chip.label} className={`apps-tag ${chip.tone}`}>{chip.label}</span>
                      ))}
                    </div>
                  </td>
                  <td className="apps-col-optional apps-mono">{app.version || '—'}</td>
                  <td>
                    <span className={`apps-scope apps-scope-${app.scope}`}>{scopeLabel(app.scope, locale)}</span>
                  </td>
                  <td className="apps-col-optional apps-muted">{sourceLabel(app.source, locale)}</td>
                  <td className="apps-col-num apps-mono" title={size == null ? t(locale, 'Not measured', 'غير مقيس') : formatBytes(size)}>
                    <span className="flex items-center justify-end gap-1">
                      <Database className="w-3 h-3 opacity-50" />
                      {formatBytes(size)}
                    </span>
                    <span className="apps-size-source">
                      {app.size.source === 'measured'
                        ? t(locale, 'measured', 'مقيس')
                        : app.size.source === 'reported'
                          ? t(locale, 'reported', 'مبلّغ')
                          : t(locale, 'unknown', 'غير معروف')}
                    </span>
                  </td>
                  <td>
                    <span className={`apps-sign apps-sign-${tone}`} title={signatureLabel(status, locale)}>
                      {signatureIcon(status)}
                      {signatureLabel(status, locale)}
                    </span>
                  </td>
                  <td className="apps-col-optional apps-mono apps-muted">{formatDate(app.installDate, locale)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!apps.length ? (
          <div className="apps-empty" data-testid="apps-register-empty">
            {loading ? (
              <>
                <Database className="w-6 h-6 animate-pulse text-cyan-400" />
                <p>{t(locale, 'Reading the measured inventory…', 'جارٍ قراءة الجرد المقيس…')}</p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <p>{t(locale, 'No measured application matches these filters.', 'لا يوجد تطبيق مقيس يطابق هذه التصفية.')}</p>
                <button type="button" onClick={onResetFilters} className="apps-btn">
                  {t(locale, 'Reset filters', 'إعادة ضبط التصفية')}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
};
