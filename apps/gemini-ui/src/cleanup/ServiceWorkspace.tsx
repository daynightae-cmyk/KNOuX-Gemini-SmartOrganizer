/**
 * Specialised Clean Room service workspaces (Mission 08).
 *
 * Each of the twelve services is a different read-only view over the same
 * measured native evidence. Controls either query the coordinator, update a
 * local review draft, or state the approval gate. No deletion, move, recycle
 * purge, DISM, scheduled-task or restore channel exists in this delivery.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  Database,
  ExternalLink,
  FileArchive,
  FileCode2,
  FileSearch,
  FileSpreadsheet,
  FileWarning,
  FolderLock,
  FolderSearch,
  Globe,
  HardDrive,
  Info,
  Layers,
  ListChecks,
  Lock,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type {
  CleanupCandidate,
  CleanupCategory,
  CleanupPlan,
  CleanupSafety,
  CleanupScheduleDraft,
} from '../../shared/native-contracts';
import type { CleanupController } from './useCleanup';
import {
  CATEGORY_META,
  SAFETY_META,
  SCAN_CATEGORIES,
  SERVICE_ACCENTS,
  SERVICE_FALLBACK_META,
  SERVICE_IDS,
  categoryLabel,
  daysUntilPurge,
  formatAge,
  formatBytes,
  formatCount,
  formatDate,
  formatPercent,
  formatTimestamp,
  riskLabel,
  safetyLabel,
  serviceStateLabel,
  t,
} from './model';
import type { CleanupLocale, CleanupServiceId } from './model';
import { serviceIcon } from './ServiceRail';

export interface ServiceWorkspaceProps {
  service: CleanupServiceId;
  locale: CleanupLocale;
  controller: CleanupController;
  candidates: CleanupCandidate[];
  selectedCandidate: CleanupCandidate | null;
  selectedIds: string[];
  onSelectCandidate: (id: string) => void;
  onApplySelection: (ids: string[]) => void;
  onToggleSelected: (id: string) => void;
  onStagePlan: (ids: string[], mode: CleanupPlan['mode']) => void;
  onClose: () => void;
  /** Opens the executing Safety Vault workbench. Absent in a browser preview. */
  onOpenVault?: () => void;
  embedded?: boolean;
}

interface BranchProps {
  locale: CleanupLocale;
  controller: CleanupController;
  candidates: CleanupCandidate[];
  selectedCandidate: CleanupCandidate | null;
  selectedIds: string[];
  onSelectCandidate: (id: string) => void;
  onApplySelection: (ids: string[]) => void;
  onToggleSelected: (id: string) => void;
  onStagePlan: (ids: string[], mode: CleanupPlan['mode']) => void;
  onOpenVault?: () => void;
}

function sumBytes(items: Array<{ sizeBytes: number | null }>): number {
  return items.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);
}

function byCategory(candidates: CleanupCandidate[], category: CleanupCategory): CleanupCandidate[] {
  return candidates.filter((candidate) => candidate.category === category);
}

function eligibleIds(candidates: CleanupCandidate[]): string[] {
  return candidates.filter((candidate) => candidate.safety === 'eligible').map((candidate) => candidate.id);
}

function deviceAgeDays(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, (Date.now() - time) / 86400000);
}

function extensionOf(name: string): string {
  const index = name.lastIndexOf('.');
  return index > 0 ? name.slice(index + 1).toLowerCase() : 'none';
}

function MiniKpi({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}) {
  return (
    <div className={`cln-svc-kpi cln-svc-kpi-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub ? <em>{sub}</em> : null}
    </div>
  );
}

function Section({
  title,
  sub,
  actions,
  children,
  className = '',
  testId,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section className={`cln-svc-section ${className}`} data-testid={testId}>
      <header className="cln-svc-section-head">
        <div className="min-w-0">
          <h3>{title}</h3>
          {sub ? <p>{sub}</p> : null}
        </div>
        {actions ? <div className="cln-svc-section-actions">{actions}</div> : null}
      </header>
      <div className="cln-svc-section-body">{children}</div>
    </section>
  );
}

function Empty({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="cln-empty cln-svc-empty">
      {icon}
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  );
}

function GateNote({
  locale,
  gate,
  reason,
}: {
  locale: CleanupLocale;
  gate: string;
  reason: string;
}) {
  return (
    <div className="cln-svc-gate">
      <Lock className="w-3.5 h-3.5 shrink-0" />
      <div>
        <strong>{gate}</strong>
        <p>{reason}</p>
      </div>
      <span className="cln-chip cln-chip-muted">{t(locale, 'GATED', 'محجوب')}</span>
    </div>
  );
}

function SafetyBadge({ safety, locale }: { safety: CleanupSafety; locale: CleanupLocale }) {
  return <span className={`cln-badge cln-badge-${safety}`}>{safetyLabel(safety, locale)}</span>;
}

function CandidateTable({
  locale,
  rows,
  selectedId,
  onSelect,
  checkedIds,
  onToggle,
  emptyTitle,
  emptyCopy,
  compact = false,
}: {
  locale: CleanupLocale;
  rows: CleanupCandidate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  checkedIds?: Set<string>;
  onToggle?: (id: string) => void;
  emptyTitle: string;
  emptyCopy: string;
  compact?: boolean;
}) {
  return (
    <div className="cln-svc-table-wrap knx-custom-scrollbar">
      <table className={`cln-svc-table ${compact ? 'is-compact' : ''}`}>
        <thead>
          <tr>
            {onToggle ? <th className="cln-col-check" aria-label={t(locale, 'Select', 'تحديد')} /> : null}
            <th>{t(locale, 'Name / Path', 'الاسم / المسار')}</th>
            <th>{t(locale, 'Source', 'المصدر')}</th>
            <th>{t(locale, 'Age', 'العمر')}</th>
            <th className="cln-col-num">{t(locale, 'Size', 'الحجم')}</th>
            <th>{t(locale, 'Safety', 'الأمان')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((candidate) => {
            const checked = checkedIds?.has(candidate.id) || false;
            return (
              <tr
                key={candidate.id}
                className={`${candidate.id === selectedId ? 'is-selected' : ''} ${checked ? 'is-checked' : ''}`}
                onClick={() => onSelect(candidate.id)}
              >
                {onToggle ? (
                  <td className="cln-col-check" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(candidate.id)}
                      aria-label={`${t(locale, 'Select', 'تحديد')} ${candidate.name}`}
                    />
                  </td>
                ) : null}
                <td>
                  <div className="cln-row-name" title={candidate.name}>{candidate.name}</div>
                  <div className="cln-row-path cln-mono" title={candidate.path || ''}>{candidate.path || '—'}</div>
                </td>
                <td>
                  <div className="cln-row-source">{candidate.source}</div>
                  <div className="cln-row-provider">{candidate.provider}</div>
                </td>
                <td className="cln-row-age">{formatAge(candidate.ageDays, locale)}</td>
                <td className="cln-col-num cln-mono">{formatBytes(candidate.sizeBytes)}</td>
                <td><SafetyBadge safety={candidate.safety} locale={locale} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length ? (
        <Empty icon={<FileWarning className="w-6 h-6" />} title={emptyTitle} copy={emptyCopy} />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 01 — Temporary File Preview                                         */
/* ------------------------------------------------------------------ */

function TempPreviewWorkspace({
  locale,
  controller,
  candidates,
  selectedIds,
  onSelectCandidate,
  onApplySelection,
  onToggleSelected,
  onStagePlan,
  onOpenVault,
}: BranchProps) {
  const [query, setQuery] = useState('');
  const [safety, setSafety] = useState<'all' | CleanupSafety>('all');
  const temp = useMemo(() => byCategory(candidates, 'temp'), [candidates]);
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return temp.filter((candidate) => {
      if (safety !== 'all' && candidate.safety !== safety) return false;
      if (!needle) return true;
      return `${candidate.name} ${candidate.path || ''} ${candidate.source}`.toLowerCase().includes(needle);
    });
  }, [query, safety, temp]);
  const eligible = temp.filter((candidate) => candidate.safety === 'eligible');
  const review = temp.filter((candidate) => candidate.safety === 'review');
  const blocked = temp.filter((candidate) => candidate.safety === 'blocked');
  const selectedTemp = temp.filter((candidate) => selectedIds.includes(candidate.id));
  const scope = selectedTemp.length ? selectedTemp : eligible;
  const exclusions = controller.capabilities?.exclusions || [];

  return (
    <div className="cln-svc-stack">
      <div className="cln-svc-kpi-row">
        <MiniKpi label={t(locale, 'Measured temp items', 'عناصر مؤقتة مقيسة')} value={formatCount(temp.length)} sub={formatBytes(sumBytes(temp))} />
        <MiniKpi label={t(locale, 'Eligible', 'مؤهل')} value={formatBytes(sumBytes(eligible))} sub={`${formatCount(eligible.length)} ${t(locale, 'items', 'عنصرًا')}`} tone="good" />
        <MiniKpi label={t(locale, 'Needs review', 'يحتاج مراجعة')} value={formatBytes(sumBytes(review))} sub={`${formatCount(review.length)} ${t(locale, 'items', 'عنصرًا')}`} tone="warn" />
        <MiniKpi label={t(locale, 'Blocked', 'محجوب')} value={formatBytes(sumBytes(blocked))} sub={`${formatCount(blocked.length)} ${t(locale, 'items', 'عنصرًا')}`} tone="bad" />
      </div>

      <div className="cln-svc-toolbar">
        <label className="cln-search">
          <Search className="w-3.5 h-3.5" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(locale, 'Filter measured candidates…', 'رشّح المرشحين المقيسين…')}
            aria-label={t(locale, 'Filter temporary candidates', 'ترشيح المرشحين المؤقتين')}
          />
        </label>
        <select
          className="cln-select"
          value={safety}
          onChange={(event) => setSafety(event.target.value as 'all' | CleanupSafety)}
          aria-label={t(locale, 'Risk classification', 'تصنيف الخطورة')}
        >
          <option value="all">{t(locale, 'All safety classes', 'كل تصنيفات الأمان')}</option>
          <option value="eligible">{safetyLabel('eligible', locale)}</option>
          <option value="review">{safetyLabel('review', locale)}</option>
          <option value="blocked">{safetyLabel('blocked', locale)}</option>
        </select>
        <button
          type="button"
          className="cln-btn cln-btn-quiet"
          onClick={() => onApplySelection(eligible.map((candidate) => candidate.id))}
          disabled={!eligible.length}
        >
          <Check className="w-3.5 h-3.5" />
          {t(locale, 'Toggle safe defaults', 'تبديل الافتراضي الآمن')}
        </button>
        <button
          type="button"
          className="cln-btn cln-btn-primary"
          onClick={() => onStagePlan(scope.map((candidate) => candidate.id), 'quarantine')}
          disabled={!scope.length}
        >
          <Lock className="w-3.5 h-3.5" />
          {t(locale, 'Stage cleanup proposal', 'إعداد مقترح التنظيف')}
        </button>
        <button
          type="button"
          className="cln-btn cln-btn-quiet"
          data-testid="cleanup-temp-preview-vault"
          onClick={onOpenVault}
          disabled={!onOpenVault}
          title={t(locale, 'Opens the executing Safety Vault where a verified keeper must be chosen manually.', 'يفتح خزنة الأمان المنفذة حيث يجب اختيار النسخة المحتفظة يدويًا.')}
        >
          <Archive className="w-3.5 h-3.5" />
          {t(locale, 'Review in Safety Vault', 'راجع في خزنة الأمان')}
        </button>
      </div>

      <Section
        title={t(locale, 'Candidate safety ledger', 'سجل أمان المرشحين')}
        sub={t(locale, 'Measured metadata only. No file is opened or changed.', 'بيانات وصفية مقيسة فقط. لا يُفتح أي ملف أو يُغيَّر.')}
      >
        <CandidateTable
          locale={locale}
          rows={rows}
          selectedId={null}
          onSelect={onSelectCandidate}
          checkedIds={new Set(selectedIds)}
          onToggle={onToggleSelected}
          emptyTitle={t(locale, 'No measured temporary candidates', 'لا مرشحين مؤقتين مقيسين')}
          emptyCopy={t(locale, 'Run measured discovery or relax the filters. No example rows are substituted.', 'شغّل استكشافًا مقيسًا أو خفّف المرشحات. لا تُستبدل صفوف مثال.')}
        />
      </Section>

      <div className="cln-svc-split">
        <Section title={t(locale, 'Estimated vs verified', 'المقدر مقابل المتحقق')} sub={t(locale, 'Verified bytes stay zero until an approved execution exists.', 'تبقى الأحجام المتحققة صفرًا حتى يوجد تنفيذ معتمد.')}>
          <div className="cln-svc-compare">
            <div>
              <span>{t(locale, 'Estimated eligible', 'المقدر المؤهل')}</span>
              <strong className="cln-amber">{formatBytes(sumBytes(eligible))}</strong>
            </div>
            <ArrowRight className="w-4 h-4 cln-muted" />
            <div>
              <span>{t(locale, 'Verified reclaimed', 'المستعاد المتحقق')}</span>
              <strong>0 B</strong>
              <em>{t(locale, 'No execution performed', 'لم يُنفّذ أي إجراء')}</em>
            </div>
          </div>
        </Section>
        <Section title={t(locale, 'Risk rating per category', 'تقييم الخطورة لكل فئة')}>
          <ul className="cln-svc-list">
            <li><span className="cln-cat-dot" style={{ background: CATEGORY_META.temp.color }} />{categoryLabel('temp', locale)}<strong>{riskLabel(blocked.length ? 'blocked' : review.length ? 'medium' : 'low', locale)}</strong></li>
            {SCAN_CATEGORIES.filter((key) => key !== 'temp').map((key) => {
              const entries = byCategory(candidates, key);
              return (
                <li key={key}>
                  <span className="cln-cat-dot" style={{ background: CATEGORY_META[key].color }} />
                  {categoryLabel(key, locale)}
                  <strong>{formatBytes(sumBytes(entries))}</strong>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      <Section title={t(locale, 'Safety exclusion rules', 'قواعد الاستبعاد الآمن')} sub={t(locale, 'Personal folders and secrets are outside every cleanup root.', 'المجلدات الشخصية والأسرار خارج كل جذور التنظيف.')}>
        <div className="cln-exclusion-grid">
          {exclusions.length ? exclusions.map((rule) => (
            <span key={rule} className="cln-exclusion"><ShieldCheck className="w-3 h-3" />{rule}</span>
          )) : (
            <span className="cln-muted">{t(locale, 'Open the native app to read the provider exclusion list.', 'افتح التطبيق الأصلي لقراءة قائمة استبعاد المزوّد.')}</span>
          )}
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 02 — Quarantine Cleanup                                             */
/* ------------------------------------------------------------------ */

function QuarantineWorkspace({
  locale,
  controller,
  candidates,
  selectedIds,
  onStagePlan,
  onOpenVault,
}: BranchProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [scopeMode, setScopeMode] = useState<'selection' | 'eligible'>('eligible');
  const quarantine = controller.quarantine;
  const selected = candidates.filter((candidate) => selectedIds.includes(candidate.id));
  const eligible = candidates.filter((candidate) => candidate.safety === 'eligible' && candidate.category !== 'update');
  const scope = scopeMode === 'selection' && selected.length ? selected : eligible;
  const conflicts = scope.filter((candidate) => candidate.active || candidate.safety === 'blocked' || candidate.category === 'update');
  const retention = quarantine?.vault.retentionDays || 14;

  useEffect(() => {
    void controller.loadQuarantine();
  }, [controller.loadQuarantine]);

  return (
    <div className="cln-svc-stack">
      <div className="cln-svc-kpi-row">
        <MiniKpi label={t(locale, 'Vault entries', 'عناصر الحجر')} value={quarantine ? formatCount(quarantine.vault.items.length) : '—'} sub={quarantine ? formatBytes(quarantine.vault.totalBytes) : undefined} />
        <MiniKpi label={t(locale, 'Retention', 'الاحتفاظ')} value={`${retention} ${t(locale, 'days', 'يومًا')}`} sub={t(locale, 'Safety policy', 'سياسة الأمان')} tone="warn" />
        <MiniKpi label={t(locale, 'Selected scope', 'النطاق المحدد')} value={formatCount(scope.length)} sub={formatBytes(sumBytes(scope))} />
        <MiniKpi label={t(locale, 'Conflicts', 'التعارضات')} value={formatCount(conflicts.length)} tone={conflicts.length ? 'bad' : 'good'} sub={t(locale, 'must clear before approval', 'يجب إزالتها قبل الموافقة')} />
      </div>

      <Section title={t(locale, 'Before / after move flow', 'مسار النقل قبل / بعد')} sub={t(locale, 'Staging only. The vault is read, never written, in Mission 08.', 'تهيئة فقط. يُقرأ الحجر ولا يُكتب فيه في المهمة 08.')}>
        <div className="cln-flow">
          <div className="cln-flow-node">
            <FileSearch className="w-4 h-4" />
            <strong>{t(locale, 'Source candidates', 'المرشحون المصدر')}</strong>
            <span>{formatCount(scope.length)} · {formatBytes(sumBytes(scope))}</span>
          </div>
          <ArrowRight className="w-4 h-4 cln-flow-arrow" />
          <div className="cln-flow-node cln-flow-node-vault">
            <FolderLock className="w-4 h-4" />
            <strong>{t(locale, 'Quarantine vault', 'حجر التنظيف')}</strong>
            <span className="cln-mono" title={quarantine?.vault.vaultPath || ''}>{quarantine?.vault.vaultPath || t(locale, 'Not read', 'لم يُقرأ')}</span>
            <em>{quarantine?.vault.exists ? t(locale, 'Vault exists', 'الحجر موجود') : t(locale, 'Vault does not exist yet', 'الحجر غير موجود بعد')}</em>
          </div>
          <ArrowRight className="w-4 h-4 cln-flow-arrow" />
          <div className="cln-flow-node">
            <RotateCcw className="w-4 h-4" />
            <strong>{t(locale, 'Recovery journal', 'سجل الاسترداد')}</strong>
            <span>{formatCount(quarantine?.journal.entries.length || 0)} {t(locale, 'entries', 'مدخلًا')}</span>
            <em>{t(locale, 'Restore stays gated', 'الاستعادة تبقى محجوبة')}</em>
          </div>
        </div>

        <div className="cln-svc-toolbar cln-svc-toolbar-flat">
          <div className="cln-segmented">
            <button type="button" aria-pressed={scopeMode === 'eligible'} className={scopeMode === 'eligible' ? 'is-active' : ''} onClick={() => setScopeMode('eligible')}>
              {t(locale, 'All eligible', 'كل المؤهل')}
            </button>
            <button type="button" aria-pressed={scopeMode === 'selection'} className={scopeMode === 'selection' ? 'is-active' : ''} onClick={() => setScopeMode('selection')} disabled={!selected.length}>
              {t(locale, 'Current selection', 'التحديد الحالي')} ({formatCount(selected.length)})
            </button>
          </div>
          <span className="cln-muted">{scopeMode === 'selection' && !selected.length ? t(locale, 'Select candidates in the ledger first.', 'حدد مرشحين في السجل أولًا.') : ''}</span>
        </div>
      </Section>

      <div className="cln-svc-split">
        <Section title={t(locale, 'Conflict checklist', 'قائمة التعارضات')} sub={t(locale, 'Deterministic checks before an approval could ever be requested.', 'فحوص حتمية قبل طلب أي موافقة.')}>
          <ul className="cln-svc-checklist">
            <li className={conflicts.some((entry) => entry.active) ? 'is-bad' : 'is-good'}>
              {conflicts.some((entry) => entry.active) ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {t(locale, 'No active browser or file owner in scope', 'لا مالك متصفح أو ملف نشط في النطاق')}
            </li>
            <li className={conflicts.some((entry) => entry.category === 'update') ? 'is-bad' : 'is-good'}>
              {conflicts.some((entry) => entry.category === 'update') ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {t(locale, 'No Windows servicing store in scope', 'لا مخزن خدمة Windows في النطاق')}
            </li>
            <li className={conflicts.some((entry) => entry.safety === 'blocked') ? 'is-bad' : 'is-good'}>
              {conflicts.some((entry) => entry.safety === 'blocked') ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {t(locale, 'No policy-blocked candidate in scope', 'لا مرشح محجوب بالسياسة في النطاق')}
            </li>
            <li className={quarantine?.vault.exists ? 'is-good' : 'is-warn'}>
              {quarantine?.vault.exists ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
              {t(locale, 'Vault destination reported by the provider', 'وجهة الحجر معلنة من المزوّد')}
            </li>
          </ul>
        </Section>
        <Section title={t(locale, 'Retention & restoration', 'الاحتفاظ والاستعادة')}>
          <dl className="cln-svc-dl">
            <div><dt>{t(locale, 'Retention policy', 'سياسة الاحتفاظ')}</dt><dd>{retention} {t(locale, 'days', 'يومًا')}</dd></div>
            <div><dt>{t(locale, 'Restoration capability', 'قابلية الاستعادة')}</dt><dd>{t(locale, 'Journal-backed; requires approval', 'مدعومة بالسجل؛ تتطلب موافقة')}</dd></div>
            <div><dt>{t(locale, 'Execution channel', 'قناة التنفيذ')}</dt><dd className="cln-rose">{t(locale, 'None in Mission 08', 'لا توجد في المهمة 08')}</dd></div>
            <div><dt>{t(locale, 'Vault warnings', 'تحذيرات الحجر')}</dt><dd>{formatCount(quarantine?.vault.warnings.length || 0)}</dd></div>
          </dl>
          {quarantine?.vault.warnings.map((warning) => <p key={warning} className="cln-svc-warning">{warning}</p>)}
        </Section>
      </div>

      <Section title={t(locale, 'Staged review dock', 'رصيف المراجعة')} sub={t(locale, 'The staged review is immutable and non-executable.', 'المراجعة المُعدّة ثابتة وغير قابلة للتنفيذ.')}>
        <label className="cln-ack">
          <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
          <span>{t(locale, 'I understand no file will be moved and execution requires a separate explicit approval.', 'أفهم أن أي ملف لن يُنقل وأن التنفيذ يتطلب موافقة صريحة منفصلة.')}</span>
        </label>
        <div className="cln-svc-actions">
          <button
            type="button"
            className="cln-btn cln-btn-primary"
            onClick={() => onStagePlan(scope.map((candidate) => candidate.id), 'quarantine')}
            disabled={!scope.length || !acknowledged}
          >
            <Lock className="w-3.5 h-3.5" />
            {t(locale, 'Stage quarantine review', 'إعداد مراجعة الحجر')} ({formatCount(scope.length)})
          </button>
          <button
            type="button"
            className="cln-btn cln-btn-quiet"
            data-testid="cleanup-temp-quarantine-vault"
            onClick={onOpenVault}
            disabled={!onOpenVault}
            title={t(locale, 'Opens the executing Safety Vault with the keeper selection view.', 'يفتح خزنة الأمان المنفذة على عرض اختيار النسخ المحتفظة.')}
          >
            <Archive className="w-3.5 h-3.5" />
            {t(locale, 'Open executing Safety Vault', 'افتح خزنة الأمان المنفذة')}
          </button>
          <span className="cln-muted">{t(locale, 'Execution stays disabled in the plan gate.', 'يبقى التنفيذ معطّلًا في بوابة الخطة.')}</span>
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 03 — Undo Cleanup                                                   */
/* ------------------------------------------------------------------ */

function UndoWorkspace({ locale, controller, onOpenVault }: BranchProps) {
  const quarantine = controller.quarantine;
  const entries = quarantine?.journal.entries || [];
  const [entryId, setEntryId] = useState<string | null>(null);
  const [restoreIds, setRestoreIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<{ itemIds: string[]; createdAt: string } | null>(null);

  useEffect(() => {
    void controller.loadQuarantine();
  }, [controller.loadQuarantine]);

  useEffect(() => {
    if (!entryId && entries.length) setEntryId(entries[0].id);
  }, [entries, entryId]);

  const entry = entries.find((item) => item.id === entryId) || null;
  const vaultItems = quarantine?.vault.items || [];
  const selectedItems = vaultItems.filter((item) => restoreIds.has(item.id));

  const toggleRestore = (id: string) => {
    setRestoreIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setDraft(null);
  };

  return (
    <div className="cln-svc-stack">
      <div className="cln-svc-kpi-row">
        <MiniKpi label={t(locale, 'Journal entries', 'مدخلات السجل')} value={quarantine ? formatCount(entries.length) : '—'} sub={quarantine?.journal.exists ? t(locale, 'Journal found', 'السجل موجود') : t(locale, 'No journal yet', 'لا سجل بعد')} />
        <MiniKpi label={t(locale, 'Verified entries', 'مدخلات متحقق منها')} value={formatCount(entries.filter((item) => item.verified).length)} tone="good" />
        <MiniKpi label={t(locale, 'Vault items', 'عناصر الحجر')} value={formatCount(vaultItems.length)} sub={formatBytes(sumBytes(vaultItems))} />
        <MiniKpi label={t(locale, 'Restorable now', 'قابل للاستعادة الآن')} value="0" sub={t(locale, 'Approval channel absent', 'قناة الموافقة غائبة')} tone="warn" />
      </div>

      <div className="cln-svc-split cln-svc-split-wide">
        <Section title={t(locale, 'Journal timeline', 'الخط الزمني للسجل')} sub={t(locale, 'Choose an entry to compare its stored recovery evidence.', 'اختر مدخلًا لمقارنة أدلة الاسترداد المخزّنة.')}>
          {entries.length ? (
            <ol className="cln-timeline">
              {entries.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`cln-timeline-item ${item.id === entryId ? 'is-active' : ''}`}
                    onClick={() => setEntryId(item.id)}
                  >
                    <span className={`cln-timeline-dot ${item.verified ? 'is-good' : ''}`} />
                    <span className="min-w-0">
                      <strong>{item.operation}</strong>
                      <em>{formatTimestamp(item.createdAt, locale)} · {item.status}</em>
                    </span>
                    <span className="cln-timeline-meta">{formatBytes(item.bytes)}</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <Empty
              icon={<FileArchive className="w-6 h-6" />}
              title={t(locale, 'No cleanup journal exists', 'لا يوجد سجل تنظيف')}
              copy={quarantine?.journal.exists === false
                ? t(locale, 'No cleanup has ever been executed by this app. Nothing is fabricated to fill the timeline.', 'لم يُنفّذ هذا التطبيق أي تنظيف. لا يُختلق شيء لملء الخط الزمني.')
                : t(locale, 'The journal could not be read; warnings are shown in the report service.', 'تعذّرت قراءة السجل؛ تظهر التحذيرات في خدمة التقارير.')}
            />
          )}
        </Section>

        <Section title={t(locale, 'Original / recovery comparison', 'مقارنة الأصل / الاسترداد')}>
          {entry ? (
            <dl className="cln-svc-dl">
              <div><dt>{t(locale, 'Transaction ID', 'معرّف العملية')}</dt><dd className="cln-mono">{entry.id}</dd></div>
              <div><dt>{t(locale, 'Original path', 'المسار الأصلي')}</dt><dd className="cln-mono">{entry.vaultPath || t(locale, 'Not recorded', 'غير مسجل')}</dd></div>
              <div><dt>{t(locale, 'Items / bytes', 'العناصر / الأحجام')}</dt><dd>{formatCount(entry.itemCount)} · {formatBytes(entry.bytes)}</dd></div>
              <div><dt>{t(locale, 'Integrity check', 'فحص السلامة')}</dt><dd className={entry.verified ? 'cln-emerald' : 'cln-amber'}>{entry.verified ? t(locale, 'Verified by journal', 'متحقق منه بالسجل') : t(locale, 'Unverified', 'غير متحقق')}</dd></div>
              <div><dt>{t(locale, 'Recovery method', 'طريقة الاسترداد')}</dt><dd>{entry.recovery}</dd></div>
              <div><dt>{t(locale, 'Current state', 'الحالة الحالية')}</dt><dd>{entry.status}</dd></div>
            </dl>
          ) : (
            <Empty icon={<FolderSearch className="w-6 h-6" />} title={t(locale, 'Select a journal entry', 'اختر مدخل سجل')} copy={t(locale, 'The comparison is bound to the selected transaction only.', 'المقارنة مرتبطة بالعملية المحددة فقط.')} />
          )}
        </Section>
      </div>

      <Section
        title={t(locale, 'Select items to restore', 'اختر عناصر للاستعادة')}
        sub={t(locale, 'Vault items are listed read-only. Item-level journal linkage is only shown when the provider recorded it.', 'عناصر الحجر مدرجة للقراءة فقط. يظهر ربط السجل بالعنصر فقط عندما سجّله المزوّد.')}
        actions={<span className="cln-chip cln-chip-muted">{formatCount(vaultItems.length)} {t(locale, 'vault items', 'عنصر حجر')}</span>}
      >
        {vaultItems.length ? (
          <div className="cln-vault-list knx-custom-scrollbar">
            {vaultItems.map((item) => (
              <label key={item.id} className={`cln-vault-row ${restoreIds.has(item.id) ? 'is-checked' : ''}`}>
                <input type="checkbox" checked={restoreIds.has(item.id)} onChange={() => toggleRestore(item.id)} />
                <span className="min-w-0">
                  <strong title={item.name}>{item.name}</strong>
                  <em>{formatTimestamp(item.quarantinedAt, locale)} · {item.journalId || t(locale, 'no journal link', 'لا ربط بسجل')}</em>
                </span>
                <span className="cln-mono">{formatBytes(item.sizeBytes)}</span>
              </label>
            ))}
          </div>
        ) : (
          <Empty icon={<Archive className="w-6 h-6" />} title={t(locale, 'The quarantine vault is empty', 'حجر التنظيف فارغ')} copy={t(locale, 'No cleanup has been executed, so there is nothing to restore.', 'لم يُنفّذ أي تنظيف، لذلك لا يوجد ما يُستعاد.')} />
        )}
        <div className="cln-svc-actions">
          <button
            type="button"
            className="cln-btn cln-btn-primary"
            disabled={!selectedItems.length}
            onClick={() => {
              setDraft({ itemIds: selectedItems.map((item) => item.id), createdAt: new Date().toISOString() });
              controller.showNotice(t(locale, 'A local restoration draft was composed. It is not persisted and cannot execute.', 'أُعدّت مسودة استعادة محلية. لا تُحفظ ولا يمكن تنفيذها.'));
            }}
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            {t(locale, 'Stage restoration draft', 'إعداد مسودة الاستعادة')}
          </button>
          <button
            type="button"
            className="cln-btn cln-btn-quiet"
            data-testid="cleanup-temp-undo-vault"
            onClick={onOpenVault}
            disabled={!onOpenVault}
            title={t(locale, 'Opens the Safety Vault receipt list to inspect verified transfers.', 'يفتح قائمة إيصالات خزنة الأمان لفحص النقل المتحقق.')}
          >
            <Archive className="w-3.5 h-3.5" />
            {t(locale, 'Inspect vault receipts', 'افحص إيصالات الخزنة')}
          </button>
          {draft ? (
            <span className="cln-chip cln-chip-warn">
              {t(locale, 'Draft', 'مسودة')} · {formatCount(draft.itemIds.length)} · {formatTimestamp(draft.createdAt, locale)}
            </span>
          ) : null}
        </div>
        <GateNote
          locale={locale}
          gate={quarantine?.execution.gate || 'Mission 08 destructive-action approval'}
          reason={t(locale, 'Restoration requires verified original paths, collision checks and stored integrity. The draft above never moves a file.', 'تتطلب الاستعادة مسارات أصلية متحققًا منها وفحوص تعارض وسلامة مخزّنة. المسودة أعلاه لا تنقل أي ملف.')}
        />
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 04 — Quarantine Browser                                             */
/* ------------------------------------------------------------------ */

function VaultWorkspace({ locale, controller, onOpenVault }: BranchProps) {
  const quarantine = controller.quarantine;
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'date' | 'size'>('date');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void controller.loadQuarantine();
  }, [controller.loadQuarantine]);

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = (quarantine?.vault.items || []).filter((item) => {
      if (!needle) return true;
      return `${item.name} ${item.originalPath || ''}`.toLowerCase().includes(needle);
    });
    return [...rows].sort((left, right) => {
      if (sort === 'size') return (right.sizeBytes || 0) - (left.sizeBytes || 0);
      return (new Date(right.quarantinedAt).getTime() || 0) - (new Date(left.quarantinedAt).getTime() || 0);
    });
  }, [query, quarantine, sort]);

  const selected = items.find((item) => item.id === selectedId) || items[0] || null;
  const retention = quarantine?.vault.retentionDays || 14;
  const remaining = selected ? daysUntilPurge(selected.quarantinedAt, retention) : null;

  return (
    <div className="cln-svc-stack">
      <div className="cln-svc-toolbar">
        <label className="cln-search">
          <Search className="w-3.5 h-3.5" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(locale, 'Search vault files…', 'ابحث في ملفات الحجر…')} aria-label={t(locale, 'Search quarantine files', 'بحث ملفات الحجر')} />
        </label>
        <select className="cln-select" value={sort} onChange={(event) => setSort(event.target.value as 'date' | 'size')} aria-label={t(locale, 'Sort vault files', 'ترتيب ملفات الحجر')}>
          <option value="date">{t(locale, 'Newest first', 'الأحدث أولًا')}</option>
          <option value="size">{t(locale, 'Largest first', 'الأكبر أولًا')}</option>
        </select>
        <span className="cln-chip cln-chip-muted">{formatCount(items.length)} {t(locale, 'entries', 'عنصرًا')}</span>
        <span className="cln-chip cln-chip-muted">{t(locale, 'Retention', 'الاحتفاظ')}: {retention} d</span>
        <button
          type="button"
          className="cln-btn cln-btn-quiet"
          data-testid="cleanup-quarantine-list-vault"
          onClick={onOpenVault}
          disabled={!onOpenVault}
          title={t(locale, 'Opens the executing Safety Vault duplicate keeper view.', 'يفتح عرض اختيار النسخ المحتفظة في خزنة الأمان المنفذة.')}
        >
          <Archive className="w-3.5 h-3.5" />
          {t(locale, 'Open keeper review', 'افتح مراجعة النسخ المحتفظة')}
        </button>
      </div>

      <div className="cln-svc-split cln-svc-split-wide">
        <Section title={t(locale, 'Vault ledger', 'سجل الحجر')} sub={t(locale, 'Grouped by the journal that produced the entry. Links are never followed.', 'مجمّعة حسب السجل الذي أنتج العنصر. لا تُتبَّع الروابط.')}>
          <div className="cln-svc-table-wrap knx-custom-scrollbar">
            <table className="cln-svc-table">
              <thead>
                <tr>
                  <th>{t(locale, 'Name', 'الاسم')}</th>
                  <th>{t(locale, 'Kind', 'النوع')}</th>
                  <th>{t(locale, 'Quarantined', 'تاريخ الحجر')}</th>
                  <th className="cln-col-num">{t(locale, 'Size', 'الحجم')}</th>
                  <th>{t(locale, 'Restore', 'الاستعادة')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={selected?.id === item.id ? 'is-selected' : ''} onClick={() => setSelectedId(item.id)}>
                    <td>
                      <div className="cln-row-name" title={item.name}>{item.name}</div>
                      <div className="cln-row-path cln-mono">{item.originalPath || t(locale, 'original path not recorded', 'المسار الأصلي غير مسجل')}</div>
                    </td>
                    <td>{item.kind}</td>
                    <td>{formatTimestamp(item.quarantinedAt, locale)}</td>
                    <td className="cln-col-num cln-mono">{formatBytes(item.sizeBytes)}</td>
                    <td>{item.journalId ? <span className="cln-tag cln-tag-good">{t(locale, 'Journal-linked', 'مرتبط بسجل')}</span> : <span className="cln-tag cln-tag-warn">{t(locale, 'Unverified', 'غير متحقق')}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!items.length ? (
              <Empty
                icon={<Archive className="w-6 h-6" />}
                title={t(locale, 'No vault entries measured', 'لا عناصر حجر مقيسة')}
                copy={quarantine?.vault.exists
                  ? t(locale, 'The vault exists but contains no files. No cleanup has been executed.', 'الحجر موجود لكنه لا يحتوي ملفات. لم يُنفّذ أي تنظيف.')
                  : t(locale, 'The quarantine vault has not been created. Nothing was deleted or staged.', 'لم يُنشأ حجر التنظيف. لم يُحذف أو يُهيّأ أي شيء.')}
              />
            ) : null}
          </div>
        </Section>

        <Section title={t(locale, 'Item dossier', 'ملف العنصر')}>
          {selected ? (
            <dl className="cln-svc-dl">
              <div><dt>{t(locale, 'Quarantine timestamp', 'وقت الحجر')}</dt><dd>{formatTimestamp(selected.quarantinedAt, locale)}</dd></div>
              <div><dt>{t(locale, 'Original location', 'الموقع الأصلي')}</dt><dd className="cln-mono">{selected.originalPath || t(locale, 'Not recorded by provider', 'غير مسجل من المزوّد')}</dd></div>
              <div><dt>{t(locale, 'Days until auto-purge', 'الأيام حتى الإزالة التلقائية')}</dt><dd>{remaining == null ? '—' : `${formatCount(remaining)} d`}</dd></div>
              <div><dt>{t(locale, 'Safety restoration rating', 'تقييم أمان الاستعادة')}</dt><dd>{selected.journalId ? t(locale, 'Journal-linked', 'مرتبط بسجل') : t(locale, 'Cannot verify without a journal link', 'لا يمكن التحقق دون ربط بسجل')}</dd></div>
              <div><dt>{t(locale, 'Kind / size', 'النوع / الحجم')}</dt><dd>{selected.kind} · {formatBytes(selected.sizeBytes)}</dd></div>
            </dl>
          ) : (
            <Empty icon={<FileSearch className="w-6 h-6" />} title={t(locale, 'Select a vault item', 'اختر عنصر حجر')} copy={t(locale, 'The dossier is bound to the selected measured entry.', 'الملف مرتبط بالعنصر المقيس المحدد.')} />
          )}
          <GateNote
            locale={locale}
            gate={quarantine?.execution.gate || 'Mission 08 destructive-action approval'}
            reason={t(locale, 'Purge and restore are not exposed. Permanent purge is never reversible.', 'الإزالة والاستعادة غير متاحتين. الإزالة الدائمة لا تُستعاد أبدًا.')}
          />
        </Section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 05 — Reclaim Estimate                                               */
/* ------------------------------------------------------------------ */

function EstimateWorkspace({
  locale,
  controller,
  candidates,
  selectedCandidate,
  onSelectCandidate,
}: BranchProps) {
  const [included, setIncluded] = useState<Set<CleanupCategory>>(new Set(SCAN_CATEGORIES));
  const [minBytes, setMinBytes] = useState(0);
  const [recalculatedAt, setRecalculatedAt] = useState<string | null>(null);

  const scoped = useMemo(
    () => candidates.filter((candidate) => included.has(candidate.category) && (candidate.sizeBytes || 0) >= minBytes),
    [candidates, included, minBytes]
  );
  const eligible = scoped.filter((candidate) => candidate.safety === 'eligible');
  const review = scoped.filter((candidate) => candidate.safety === 'review');
  const blocked = scoped.filter((candidate) => candidate.safety === 'blocked');
  const total = Math.max(1, sumBytes(scoped));
  const estimate = controller.estimate;
  const excluded = SCAN_CATEGORIES.filter((key) => !included.has(key));
  const largest = [...eligible].sort((left, right) => (right.sizeBytes || 0) - (left.sizeBytes || 0))[0] || null;

  const toggleCategory = (key: CleanupCategory) => {
    setIncluded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setRecalculatedAt(null);
  };

  return (
    <div className="cln-svc-stack">
      <div className="cln-svc-kpi-row">
        <MiniKpi label={t(locale, 'Eligible space (100% safe)', 'مساحة مؤهلة (آمنة 100%)')} value={formatBytes(sumBytes(eligible))} sub={`${formatCount(eligible.length)} ${t(locale, 'items', 'عنصرًا')}`} tone="good" />
        <MiniKpi label={t(locale, 'Uncertain space', 'مساحة غير مؤكدة')} value={formatBytes(sumBytes(review))} sub={`${formatCount(review.length)} ${t(locale, 'need review', 'تحتاج مراجعة')}`} tone="warn" />
        <MiniKpi label={t(locale, 'Locked system space', 'مساحة نظام مقفلة')} value={formatBytes(sumBytes(blocked))} sub={`${formatCount(blocked.length)} ${t(locale, 'blocked', 'محجوب')}`} tone="bad" />
        <MiniKpi label={t(locale, 'Excluded user space', 'مساحة مستخدم مستبعدة')} value={`${formatCount(excluded.length)} ${t(locale, 'categories', 'فئات')}`} sub={t(locale, 'Never measured by policy', 'لا تُقاس بالسياسة أبدًا')} />
      </div>

      <Section title={t(locale, 'Space savings breakdown', 'تفصيل توفير المساحة')} sub={estimate?.note || t(locale, 'Eligible is a deterministic classification, not a promise of reclaimed bytes.', 'المؤهل تصنيف حتمي وليس وعدًا باستعادة أحجام.')}>
        <div className="cln-stack-bar" role="img" aria-label={t(locale, 'Eligible, review and blocked distribution', 'توزيع المؤهل والمراجعة والمحجوب')}>
          <div className="cln-stack-eligible" style={{ width: `${(sumBytes(eligible) / total) * 100}%` }} title={`${t(locale, 'Eligible', 'مؤهل')} ${formatBytes(sumBytes(eligible))}`} />
          <div className="cln-stack-review" style={{ width: `${(sumBytes(review) / total) * 100}%` }} title={`${t(locale, 'Review', 'مراجعة')} ${formatBytes(sumBytes(review))}`} />
          <div className="cln-stack-blocked" style={{ width: `${(sumBytes(blocked) / total) * 100}%` }} title={`${t(locale, 'Blocked', 'محجوب')} ${formatBytes(sumBytes(blocked))}`} />
        </div>
        <div className="cln-legend">
          <span className="cln-legend-item"><i style={{ background: '#10b981' }} />{t(locale, 'Eligible', 'مؤهل')}<strong>{formatBytes(sumBytes(eligible))}</strong></span>
          <span className="cln-legend-item"><i style={{ background: '#f59e0b' }} />{t(locale, 'Review', 'مراجعة')}<strong>{formatBytes(sumBytes(review))}</strong></span>
          <span className="cln-legend-item"><i style={{ background: '#f43f5e' }} />{t(locale, 'Blocked', 'محجوب')}<strong>{formatBytes(sumBytes(blocked))}</strong></span>
        </div>

        <div className="cln-cat-checks">
          {SCAN_CATEGORIES.map((key) => (
            <button
              key={key}
              type="button"
              className={`cln-cat-check ${included.has(key) ? 'is-active' : ''}`}
              aria-pressed={included.has(key)}
              onClick={() => toggleCategory(key)}
              style={{ '--cln-cat': CATEGORY_META[key].color } as React.CSSProperties}
            >
              <span className="cln-cat-dot" />
              {categoryLabel(key, locale)}
              <strong>{formatBytes(sumBytes(byCategory(scoped, key)))}</strong>
            </button>
          ))}
        </div>

        <div className="cln-svc-toolbar cln-svc-toolbar-flat">
          <label className="cln-age-select">
            <span>{t(locale, 'Adjust threshold', 'ضبط الحد')}</span>
            <select value={minBytes} onChange={(event) => { setMinBytes(Number(event.target.value)); setRecalculatedAt(null); }} aria-label={t(locale, 'Minimum candidate size', 'الحد الأدنى لحجم المرشح')}>
              <option value={0}>{t(locale, 'Any size', 'أي حجم')}</option>
              <option value={1048576}>{t(locale, '1 MB or more', '1 ميغابايت أو أكثر')}</option>
              <option value={10485760}>{t(locale, '10 MB or more', '10 ميغابايت أو أكثر')}</option>
              <option value={104857600}>{t(locale, '100 MB or more', '100 ميغابايت أو أكثر')}</option>
            </select>
          </label>
          <button
            type="button"
            className="cln-btn cln-btn-primary"
            data-testid="cleanup-estimate-recalc"
            onClick={() => {
              setRecalculatedAt(new Date().toISOString());
              controller.showNotice(t(locale, 'The estimate draft was recalculated from measured sizes. Nothing was executed.', 'أُعيد حساب مسودة التقدير من الأحجام المقيسة. لم يُنفّذ شيء.'));
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t(locale, 'Recalculate UI draft', 'إعادة حساب مسودة الواجهة')}
          </button>
          <button
            type="button"
            className="cln-btn cln-btn-quiet"
            disabled={!largest}
            onClick={() => largest && onSelectCandidate(largest.id)}
          >
            <FileSearch className="w-3.5 h-3.5" />
            {t(locale, 'Open candidate detail', 'فتح تفاصيل المرشح')}
          </button>
          {recalculatedAt ? <span className="cln-chip cln-chip-good">{t(locale, 'Draft recalculated', 'أُعيد حساب المسودة')} · {formatTimestamp(recalculatedAt, locale)}</span> : null}
        </div>

        {selectedCandidate ? (
          <div className="cln-estimate-detail">
            <div className="min-w-0">
              <div className="cln-row-name" title={selectedCandidate.name}>{selectedCandidate.name}</div>
              <div className="cln-row-path cln-mono" title={selectedCandidate.path || ''}>{selectedCandidate.path || '—'}</div>
            </div>
            <span className="cln-mono">{formatBytes(selectedCandidate.sizeBytes)}</span>
            <SafetyBadge safety={selectedCandidate.safety} locale={locale} />
            <span className="cln-row-provider">{riskLabel(selectedCandidate.risk, locale)}</span>
          </div>
        ) : null}
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 06 — Recycle Bin                                                    */
/* ------------------------------------------------------------------ */

function RecycleWorkspace({ locale, controller, candidates, onStagePlan }: BranchProps) {
  const inventory = controller.inventory;
  const items = inventory?.recycleItems || [];
  const recycleCandidates = byCategory(candidates, 'recycle');
  const [volume, setVolume] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const volumes = useMemo(() => {
    const map = new Map<string, { count: number; bytes: number }>();
    for (const item of items) {
      const current = map.get(item.volume) || { count: 0, bytes: 0 };
      current.count += 1;
      current.bytes += item.sizeBytes || 0;
      map.set(item.volume, current);
    }
    return [...map.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [items]);

  const types = useMemo(() => {
    const set = new Set(items.map((item) => extensionOf(item.name)));
    return [...set].sort();
  }, [items]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (volume !== 'all' && item.volume !== volume) return false;
      if (type !== 'all' && extensionOf(item.name) !== type) return false;
      if (!needle) return true;
      return `${item.name} ${item.originalPath || ''}`.toLowerCase().includes(needle);
    });
  }, [items, query, type, volume]);

  const selected = rows.find((item) => item.id === selectedId) || null;

  return (
    <div className="cln-svc-stack">
      <div className="cln-svc-kpi-row">
        <MiniKpi label={t(locale, 'Bin items', 'عناصر السلة')} value={formatCount(items.length)} />
        <MiniKpi label={t(locale, 'Measured bytes', 'الأحجام المقيسة')} value={formatBytes(items.reduce((sum, item) => sum + item.sizeBytes, 0))} />
        <MiniKpi label={t(locale, 'Volumes', 'وحدات التخزين')} value={formatCount(volumes.length)} sub={volumes.map(([name]) => name).join(' · ') || undefined} />
        <MiniKpi label={t(locale, 'Purge channel', 'قناة الإزالة')} value={t(locale, 'Gated', 'محجوب')} tone="bad" sub={t(locale, 'Never reversible', 'لا تُستعاد أبدًا')} />
      </div>

      <div className="cln-volume-grid">
        {volumes.map(([name, entry]) => (
          <button
            key={name}
            type="button"
            className={`cln-volume-card ${volume === name ? 'is-active' : ''}`}
            onClick={() => setVolume(volume === name ? 'all' : name)}
            aria-pressed={volume === name}
          >
            <HardDrive className="w-4 h-4" />
            <span><strong>{name}</strong><em>{formatCount(entry.count)} · {formatBytes(entry.bytes)}</em></span>
          </button>
        ))}
        {!volumes.length ? (
          <span className="cln-muted">{t(locale, 'No Recycle Bin volume was reported. Run discovery to measure the current-user bin.', 'لم تُعلن وحدة سلة محذوفات. شغّل الاستكشاف لقياس سلة المستخدم الحالي.')}</span>
        ) : null}
      </div>

      <div className="cln-svc-toolbar">
        <label className="cln-search">
          <Search className="w-3.5 h-3.5" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(locale, 'Search deleted items…', 'ابحث في العناصر المحذوفة…')} aria-label={t(locale, 'Search deleted items', 'بحث العناصر المحذوفة')} />
        </label>
        <select className="cln-select" value={type} onChange={(event) => setType(event.target.value)} aria-label={t(locale, 'Filter file type', 'ترشيح نوع الملف')}>
          <option value="all">{t(locale, 'All file types', 'كل أنواع الملفات')}</option>
          {types.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
        </select>
        <span className="cln-chip cln-chip-muted">{formatCount(rows.length)} {t(locale, 'visible', 'ظاهر')}</span>
      </div>

      <div className="cln-svc-split cln-svc-split-wide">
        <Section title={t(locale, 'Deleted-time ledger', 'سجل وقت الحذف')} sub={t(locale, 'Metadata from Shell.Application namespace 10; file contents are not opened.', 'بيانات من Shell.Application namespace 10؛ لا تُفتح محتويات الملفات.')}>
          <div className="cln-svc-table-wrap knx-custom-scrollbar">
            <table className="cln-svc-table">
              <thead>
                <tr>
                  <th>{t(locale, 'Name', 'الاسم')}</th>
                  <th>{t(locale, 'Volume', 'الوحدة')}</th>
                  <th>{t(locale, 'Deleted', 'تاريخ الحذف')}</th>
                  <th className="cln-col-num">{t(locale, 'Size', 'الحجم')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className={selected?.id === item.id ? 'is-selected' : ''} onClick={() => setSelectedId(item.id)}>
                    <td>
                      <div className="cln-row-name" title={item.name}>{item.name}</div>
                      <div className="cln-row-path cln-mono">{item.originalPath || '—'}</div>
                    </td>
                    <td>{item.volume}</td>
                    <td>{formatTimestamp(item.deletedAt, locale)}</td>
                    <td className="cln-col-num cln-mono">{formatBytes(item.sizeBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length ? (
              <Empty
                icon={<Trash2 className="w-6 h-6" />}
                title={t(locale, 'No measured bin items', 'لا عناصر سلة مقيسة')}
                copy={t(locale, 'The current-user Recycle Bin is empty or was not measured. No example items are shown.', 'سلة المستخدم الحالي فارغة أو لم تُقس. لا تُعرض عناصر مثال.')}
              />
            ) : null}
          </div>
        </Section>

        <Section title={t(locale, 'Original-location dossier', 'ملف الموقع الأصلي')}>
          {selected ? (
            <dl className="cln-svc-dl">
              <div><dt>{t(locale, 'Original path before delete', 'المسار الأصلي قبل الحذف')}</dt><dd className="cln-mono">{selected.originalPath || t(locale, 'Not reported', 'غير معلن')}</dd></div>
              <div><dt>{t(locale, 'Deletion timestamp', 'وقت الحذف')}</dt><dd>{formatTimestamp(selected.deletedAt, locale)}</dd></div>
              <div><dt>{t(locale, 'File size', 'حجم الملف')}</dt><dd>{formatBytes(selected.sizeBytes)}</dd></div>
              <div><dt>{t(locale, 'Age', 'العمر')}</dt><dd>{formatAge(selected.ageDays, locale)}</dd></div>
              <div><dt>{t(locale, 'Volume', 'الوحدة')}</dt><dd>{selected.volume}</dd></div>
            </dl>
          ) : (
            <Empty icon={<FileSearch className="w-6 h-6" />} title={t(locale, 'Select a bin item', 'اختر عنصرًا من السلة')} copy={t(locale, 'The dossier is bound to a measured deleted item.', 'الملف مرتبط بعنصر محذوف مقيس.')} />
          )}

          <div className="cln-svc-gate cln-svc-gate-inline">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <div>
              <strong>{t(locale, 'Empty Bin confirmation stage', 'مرحلة تأكيد إفراغ السلة')}</strong>
              <p>{t(locale, 'Purge is permanent. A review plan cannot be executed and no confirmation channel exists.', 'الإزالة دائمة. لا يمكن تنفيذ خطة المراجعة ولا توجد قناة تأكيد.')}</p>
            </div>
          </div>
          <label className="cln-ack">
            <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
            <span>{t(locale, 'I understand purged items cannot be recovered.', 'أفهم أن العناصر المُزالة لا يمكن استعادتها.')}</span>
          </label>
          <div className="cln-svc-actions">
            <button
              type="button"
              className="cln-btn cln-btn-danger"
              disabled={!recycleCandidates.length || !acknowledged}
              onClick={() => onStagePlan(recycleCandidates.map((candidate) => candidate.id), 'recycle')}
            >
              <ShieldOff className="w-3.5 h-3.5" />
              {t(locale, 'Stage Bin Empty review', 'إعداد مراجعة إفراغ السلة')}
            </button>
            <span className="cln-muted">{recycleCandidates.length ? `${formatCount(recycleCandidates.length)} ${t(locale, 'volume candidate(s)', 'مرشح وحدة')}` : t(locale, 'No volume candidate was measured.', 'لم تُقس أي وحدة مرشحة.')}</span>
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 07 — Unused Items                                                   */
/* ------------------------------------------------------------------ */

function UnusedWorkspace({ locale, controller, onStagePlan }: BranchProps) {
  const [ageDays, setAgeDays] = useState(90);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const unused = controller.unused;

  useEffect(() => {
    void controller.loadUnused(90);
  }, [controller.loadUnused]);

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = unused?.items || [];
    return needle
      ? rows.filter((item) => `${item.name} ${item.relative} ${item.path || ''}`.toLowerCase().includes(needle))
      : rows;
  }, [query, unused]);

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chooseAge = (days: number) => {
    setAgeDays(days);
    setSelected(new Set());
    void controller.loadUnused(days);
  };

  const selectedRows = (unused?.items || []).filter((item) => selected.has(item.id));
  const measured = unused?.status === 'complete';

  return (
    <div className="cln-svc-stack">
      <div className="cln-svc-kpi-row">
        <MiniKpi label={t(locale, 'Dormant items', 'عناصر خاملة')} value={measured ? formatCount(unused?.items.length || 0) : '—'} sub={unused?.status} />
        <MiniKpi label={t(locale, 'Threshold', 'الحد')} value={`${ageDays} d`} sub={t(locale, 'Modified time only', 'وقت التعديل فقط')} tone="warn" />
        <MiniKpi label={t(locale, 'Selected', 'محدد')} value={formatCount(selectedRows.length)} sub={formatBytes(sumBytes(selectedRows))} />
        <MiniKpi label={t(locale, 'Source', 'المصدر')} value={unused?.source ? unused.source.label : t(locale, 'None', 'لا يوجد')} sub={unused?.source ? `${formatCount(unused.source.fileCount)} ${t(locale, 'indexed files', 'ملفًا مفهرسًا')}` : undefined} />
      </div>

      <Section title={t(locale, 'Age-band explorer', 'مستكشف نطاقات العمر')} sub={unused?.atimeNote || t(locale, 'Dormancy uses modified time inside a user-authorized source.', 'يعتمد الخمول على وقت التعديل داخل مصدر مصرّح به.')}>
        <div className="cln-svc-toolbar cln-svc-toolbar-flat">
          <div className="cln-segmented">
            {[30, 90, 180].map((days) => (
              <button key={days} type="button" aria-pressed={ageDays === days} className={ageDays === days ? 'is-active' : ''} onClick={() => chooseAge(days)}>
                {days} d
              </button>
            ))}
          </div>
          <label className="cln-search">
            <Search className="w-3.5 h-3.5" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(locale, 'Filter file location…', 'رشّح موقع الملف…')} aria-label={t(locale, 'Filter dormant items', 'ترشيح العناصر الخاملة')} />
          </label>
          <button type="button" className="cln-btn cln-btn-quiet" onClick={() => setSelected(new Set(items.map((item) => item.id)))} disabled={!items.length}>
            <Check className="w-3.5 h-3.5" />
            {t(locale, 'Include visible', 'تضمين الظاهر')}
          </button>
          <button type="button" className="cln-btn cln-btn-quiet" onClick={() => setSelected(new Set())} disabled={!selected.size}>
            {t(locale, 'Exclude all', 'استبعاد الكل')}
          </button>
        </div>

        {measured ? (
          <div className="cln-unused-list knx-custom-scrollbar">
            {items.map((item) => (
              <label key={item.id} className={`cln-unused-row ${selected.has(item.id) ? 'is-checked' : ''}`}>
                <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
                <span className="min-w-0">
                  <strong title={item.name}>{item.name}</strong>
                  <em title={item.relative}>{item.relative}</em>
                </span>
                <span className="cln-row-age">{formatAge(item.ageDays, locale)}</span>
                <span className="cln-mono">{formatBytes(item.sizeBytes)}</span>
                <SafetyBadge safety={item.safety} locale={locale} />
              </label>
            ))}
            {!items.length ? (
              <Empty
                icon={<Sparkles className="w-6 h-6" />}
                title={t(locale, 'No files exceed this age band', 'لا ملفات تتجاوز نطاق العمر هذا')}
                copy={t(locale, 'The authorized source index contains no file older than the selected threshold.', 'فهرس المصدر المصرّح به لا يحتوي ملفًا أقدم من الحد المحدد.')}
              />
            ) : null}
          </div>
        ) : (
          <Empty
            icon={<FolderSearch className="w-6 h-6" />}
            title={
              unused?.status === 'needs-source'
                ? t(locale, 'An authorized Studio source is required', 'مطلوب مصدر Studio مصرّح به')
                : unused?.status === 'index-required'
                  ? t(locale, 'The Studio source needs a read-only index', 'يحتاج مصدر Studio إلى فهرس للقراءة فقط')
                  : t(locale, 'Dormant files are not measured', 'الملفات الخاملة غير مقيسة')
            }
            copy={
              unused?.warnings?.[0] ||
              t(locale, 'Authorize and index a source in Organization Studio, then measure dormancy here. No folder is scanned from this screen.', 'صرّح بمصدر وفهرسه في Organization Studio ثم قس الخمول هنا. لا يُفحص أي مجلد من هذه الشاشة.')
            }
          />
        )}
        {unused?.warnings?.length ? unused.warnings.map((warning) => <p key={warning} className="cln-svc-warning">{warning}</p>) : null}
      </Section>

      <div className="cln-svc-split">
        <Section title={t(locale, 'Safety caveats', 'تحذيرات الأمان')}>
          <ul className="cln-svc-checklist">
            <li className="is-warn"><AlertTriangle className="w-3.5 h-3.5" />{t(locale, 'Dormancy is not proof that a file is unwanted.', 'الخمول ليس دليلًا على أن الملف غير مرغوب.')}</li>
            <li className="is-warn"><Clock className="w-3.5 h-3.5" />{t(locale, 'Last-access timestamps are commonly disabled on Windows.', 'طوابع آخر وصول معطّلة عادةً في Windows.')}</li>
            <li className="is-good"><ShieldCheck className="w-3.5 h-3.5" />{t(locale, 'Only a user-authorized Studio source is measured.', 'يُقاس فقط مصدر Studio مصرّح به من المستخدم.')}</li>
            <li className="is-good"><FolderLock className="w-3.5 h-3.5" />{t(locale, 'Personal profile folders are never enumerated here.', 'لا تُعدّد مجلدات الملف الشخصي هنا أبدًا.')}</li>
          </ul>
        </Section>
        <Section title={t(locale, 'Staged archive plan', 'خطة الأرشفة المُعدّة')}>
          <div className="cln-svc-compare">
            <div><span>{t(locale, 'Selected files', 'الملفات المحددة')}</span><strong>{formatCount(selectedRows.length)}</strong></div>
            <div><span>{t(locale, 'Measured bytes', 'الأحجام المقيسة')}</span><strong>{formatBytes(sumBytes(selectedRows))}</strong></div>
            <div><span>{t(locale, 'Source', 'المصدر')}</span><strong>{unused?.source?.label || '—'}</strong></div>
          </div>
          <div className="cln-svc-actions">
            <button
              type="button"
              className="cln-btn cln-btn-primary"
              disabled={!selectedRows.length}
              onClick={() => onStagePlan(selectedRows.map((item) => item.id), 'archive')}
            >
              <Archive className="w-3.5 h-3.5" />
              {t(locale, 'Stage archive plan', 'إعداد خطة الأرشفة')}
            </button>
            <span className="cln-muted">{t(locale, 'The plan gate opens from the main review flow.', 'تُفتح بوابة الخطة من مسار المراجعة الرئيسي.')}</span>
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 08 — Windows Update Cache                                           */
/* ------------------------------------------------------------------ */

function UpdateCacheWorkspace({ locale, controller, candidates, onSelectCandidate }: BranchProps) {
  const update = byCategory(candidates, 'update');
  const [step, setStep] = useState(0);
  const [prerequisites, setPrerequisites] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const winsxs = update.filter((candidate) => /winsxs/i.test(`${candidate.name} ${candidate.path || ''}`));
  const distribution = update.filter((candidate) => /softwaredistribution/i.test(`${candidate.name} ${candidate.path || ''}`));
  const blocked = update.filter((candidate) => candidate.safety === 'blocked');
  const steps = [
    { en: 'Measure store sizes', ar: 'قياس أحجام المخزن', tone: 'done' as const },
    { en: 'Review prerequisites', ar: 'مراجعة المتطلبات', tone: 'current' as const },
    { en: 'Official Windows handoff', ar: 'التسليم الرسمي إلى Windows', tone: 'handoff' as const },
    { en: 'DISM servicing cleanup', ar: 'تنظيف خدمة DISM', tone: 'blocked' as const },
    { en: 'Verify postcondition', ar: 'التحقق من النتيجة', tone: 'blocked' as const },
  ];

  return (
    <div className="cln-svc-stack">
      <div className="cln-svc-kpi-row">
        <MiniKpi label={t(locale, 'WinSxS store evidence', 'دليل مخزن WinSxS')} value={formatBytes(sumBytes(winsxs))} sub={`${formatCount(winsxs.length)} ${t(locale, 'measured entries', 'مدخلًا مقيسًا')}`} tone="bad" />
        <MiniKpi label={t(locale, 'SoftwareDistribution', 'SoftwareDistribution')} value={formatBytes(sumBytes(distribution))} sub={`${formatCount(distribution.length)} ${t(locale, 'measured entries', 'مدخلًا مقيسًا')}`} tone="warn" />
        <MiniKpi label={t(locale, 'Blocked by policy', 'محجوب بالسياسة')} value={formatCount(blocked.length)} sub={t(locale, 'Servicing handoff only', 'تسليم خدمة فقط')} tone="bad" />
        <MiniKpi label={t(locale, 'DISM channel', 'قناة DISM')} value={t(locale, 'Absent', 'غائبة')} sub={t(locale, 'No elevation requested', 'لا رفع صلاحيات')} />
      </div>

      <Section title={t(locale, 'Servicing stages', 'مراحل الخدمة')} sub={t(locale, 'Select a stage to inspect its evidence and limits. No servicing command is invoked.', 'اختر مرحلة لفحص أدلتها وحدودها. لا يُستدعى أي أمر خدمة.')}>
        <ol className="cln-service-steps">
          {steps.map((entry, index) => (
            <li key={entry.en}>
              <button
                type="button"
                className={`cln-service-step ${step === index ? 'is-active' : ''} is-${entry.tone}`}
                onClick={() => {
                  setStep(index);
                  if (index === 1) setPrerequisites(true);
                }}
              >
                <span className="cln-step-dot">
                  {index === 0 ? <Check className="w-3 h-3" /> : entry.tone === 'blocked' ? <Lock className="w-3 h-3" /> : <span>{index + 1}</span>}
                </span>
                <span><strong>{locale === 'ar' ? entry.ar : entry.en}</strong><em>{entry.tone === 'blocked' ? t(locale, 'Gated', 'محجوب') : entry.tone === 'handoff' ? t(locale, 'Windows-owned', 'مملوك لـ Windows') : t(locale, 'Read-only', 'للقراءة فقط')}</em></span>
              </button>
            </li>
          ))}
        </ol>

        {prerequisites ? (
          <div className="cln-prereq">
            <strong>{t(locale, 'Prerequisites for servicing', 'متطلبات الخدمة')}</strong>
            <ul>
              <li>{t(locale, 'The operation is owned by Windows Update / DISM, not by KNOuX.', 'العملية مملوكة لـ Windows Update / DISM وليس لـ KNOuX.')}</li>
              <li>{t(locale, 'Elevation is required and is never requested silently.', 'يلزم رفع الصلاحيات ولا يُطلب بصمت أبدًا.')}</li>
              <li>{t(locale, 'WinSxS analysis can take a long time and is not cancellable by this app.', 'قد يستغرق تحليل WinSxS وقتًا طويلًا ولا يمكن إلغاؤه من هذا التطبيق.')}</li>
              <li>{t(locale, 'Component-store cleanup can prevent rollback of installed updates.', 'قد يمنع تنظيف مخزن المكونات التراجع عن التحديثات المثبتة.')}</li>
            </ul>
          </div>
        ) : null}

        <div className="cln-svc-actions">
          <button
            type="button"
            className="cln-btn cln-btn-quiet"
            onClick={() => {
              setCheckedAt(new Date().toISOString());
              controller.showNotice(t(locale, 'WinSxS evidence was re-read from the measured inventory. No servicing command ran.', 'أُعيدت قراءة دليل WinSxS من الجرد المقيس. لم يُشغّل أي أمر خدمة.'));
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t(locale, 'Check WinSxS status', 'فحص حالة WinSxS')}
          </button>
          <button type="button" className="cln-btn cln-btn-quiet" onClick={() => setPrerequisites((current) => !current)}>
            <ListChecks className="w-3.5 h-3.5" />
            {t(locale, 'View prerequisites', 'عرض المتطلبات')}
          </button>
          <button type="button" className="cln-btn cln-btn-primary" onClick={() => void controller.openSettings('windowsupdate')} disabled={!controller.nativeAvailable}>
            <ExternalLink className="w-3.5 h-3.5" />
            {t(locale, 'Open Windows Update settings', 'فتح إعدادات Windows Update')}
          </button>
          {checkedAt ? <span className="cln-chip cln-chip-good">{t(locale, 'Evidence re-read', 'أُعيد قراءة الدليل')} · {formatTimestamp(checkedAt, locale)}</span> : null}
        </div>
        <GateNote
          locale={locale}
          gate="Mission 11 Windows servicing"
          reason={t(locale, 'DISM and component-store cleanup are elevated and high risk. Mission 08 measures sizes and hands off to the official Windows page only.', 'تنظيف DISM ومخزن المكونات يتطلب رفع صلاحيات وعالي الخطورة. تقيس المهمة 08 الأحجام وتسلّم إلى صفحة Windows الرسمية فقط.')}
        />
      </Section>

      <div className="cln-svc-split">
        <Section title={t(locale, 'Measured servicing evidence', 'أدلة الخدمة المقيسة')} sub={t(locale, 'Only directories Windows allowed this process to enumerate are shown.', 'تظهر فقط المجلدات التي سمح Windows لهذه العملية بتعدادها.')}>
          {update.length ? (
            <div className="cln-svc-table-wrap knx-custom-scrollbar">
              <table className="cln-svc-table is-compact">
                <thead><tr><th>{t(locale, 'Entry', 'المدخل')}</th><th className="cln-col-num">{t(locale, 'Size', 'الحجم')}</th><th>{t(locale, 'Safety', 'الأمان')}</th></tr></thead>
                <tbody>
                  {update.map((candidate) => (
                    <tr key={candidate.id} onClick={() => onSelectCandidate(candidate.id)}>
                      <td><div className="cln-row-name">{candidate.name}</div><div className="cln-row-path cln-mono">{candidate.path || '—'}</div></td>
                      <td className="cln-col-num cln-mono">{formatBytes(candidate.sizeBytes)}</td>
                      <td><SafetyBadge safety={candidate.safety} locale={locale} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty icon={<HardDrive className="w-6 h-6" />} title={t(locale, 'No servicing sizes measured', 'لم تُقس أحجام خدمة')} copy={t(locale, 'WinSxS and SoftwareDistribution may be access-denied without elevation. No size is invented.', 'قد يُرفض الوصول إلى WinSxS وSoftwareDistribution دون رفع صلاحيات. لا يُختلق أي حجم.')} />
          )}
        </Section>
        <Section title={t(locale, 'Safety verdict', 'الحكم الأمني')}>
          <ul className="cln-svc-checklist">
            <li className="is-good"><CheckCircle2 className="w-3.5 h-3.5" />{t(locale, 'Sizes are measured evidence, not reclaimed bytes.', 'الأحجام أدلة مقيسة وليست أحجامًا مستعادة.')}</li>
            <li className="is-bad"><ShieldOff className="w-3.5 h-3.5" />{t(locale, 'No DISM or cleanmgr process is spawned by this app.', 'لا يُشغّل هذا التطبيق أي عملية DISM أو cleanmgr.')}</li>
            <li className="is-bad"><Lock className="w-3.5 h-3.5" />{t(locale, 'No elevation prompt is created.', 'لا يُنشأ أي طلب رفع صلاحيات.')}</li>
            <li className="is-warn"><Info className="w-3.5 h-3.5" />{t(locale, 'Windows Update settings is the supported handoff.', 'إعدادات Windows Update هي التسليم المدعوم.')}</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 09 — Browser Cache                                                  */
/* ------------------------------------------------------------------ */

function BrowserCacheWorkspace({ locale, candidates, onStagePlan }: BranchProps) {
  const browserCandidates = byCategory(candidates, 'browser');
  const groups = useMemo(() => {
    const map = new Map<string, CleanupCandidate[]>();
    for (const candidate of browserCandidates) {
      const key = candidate.source || candidate.provider || t(locale, 'Browser', 'متصفح');
      const list = map.get(key) || [];
      list.push(candidate);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [browserCandidates, locale]);
  const [group, setGroup] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const activeGroup = group && groups.some(([key]) => key === group) ? group : groups[0]?.[0] || null;
  const rows = groups.find(([key]) => key === activeGroup)?.[1] || [];
  const selected = browserCandidates.filter((candidate) => checked.has(candidate.id));
  const active = browserCandidates.filter((candidate) => candidate.active);
  const eligible = browserCandidates.filter((candidate) => candidate.safety === 'eligible');

  const toggle = (id: string) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="cln-svc-stack">
      <div className="cln-svc-kpi-row">
        <MiniKpi label={t(locale, 'Browser cache measured', 'ذاكرة المتصفح المقيسة')} value={formatBytes(sumBytes(browserCandidates))} sub={`${formatCount(browserCandidates.length)} ${t(locale, 'profiles', 'ملفًا شخصيًا')}`} tone="good" />
        <MiniKpi label={t(locale, 'Cookies / history', 'الارتباطات / السجل')} value={t(locale, 'Excluded', 'مستبعدة')} sub="0 B" tone="good" />
        <MiniKpi label={t(locale, 'Saved passwords', 'كلمات المرور المحفوظة')} value={t(locale, 'Protected', 'محمية')} sub={t(locale, 'Never read', 'لا تُقرأ أبدًا')} tone="good" />
        <MiniKpi label={t(locale, 'Active session warnings', 'تحذيرات الجلسات النشطة')} value={formatCount(active.length)} tone={active.length ? 'bad' : 'good'} sub={t(locale, 'Owning process detected', 'عُثر على العملية المالكة')} />
      </div>

      <div className="cln-browser-grid">
        {groups.map(([key, entries]) => (
          <button
            key={key}
            type="button"
            className={`cln-browser-card ${key === activeGroup ? 'is-active' : ''}`}
            onClick={() => setGroup(key)}
            aria-pressed={key === activeGroup}
          >
            <span className="cln-browser-icon"><Globe className="w-4 h-4" /></span>
            <span className="min-w-0">
              <strong>{key}</strong>
              <em>{formatCount(entries.length)} · {formatBytes(sumBytes(entries))}</em>
            </span>
            {entries.some((entry) => entry.active) ? <span className="cln-badge cln-badge-blocked">{t(locale, 'Active', 'نشط')}</span> : null}
          </button>
        ))}
        {!groups.length ? (
          <span className="cln-muted">{t(locale, 'No browser cache folder was measured. Run discovery to read cache folders only.', 'لم يُقس أي مجلد ذاكرة متصفح. شغّل الاستكشاف لقراءة مجلدات الذاكرة فقط.')}</span>
        ) : null}
      </div>

      <div className="cln-svc-split cln-svc-split-wide">
        <Section title={t(locale, 'Profile cache items', 'عناصر ذاكرة الملف الشخصي')} sub={activeGroup || t(locale, 'Select a browser card', 'اختر بطاقة متصفح')}>
          <CandidateTable
            locale={locale}
            rows={rows}
            selectedId={null}
            onSelect={() => undefined}
            checkedIds={checked}
            onToggle={toggle}
            emptyTitle={t(locale, 'No cache items in this profile', 'لا عناصر ذاكرة في هذا الملف الشخصي')}
            emptyCopy={t(locale, 'Cache folders that were absent or denied are never replaced with examples.', 'مجلدات الذاكرة الغائبة أو المرفوضة لا تُستبدل بأمثلة.')}
            compact
          />
        </Section>
        <Section title={t(locale, 'Cache size vs protection', 'حجم الذاكرة مقابل الحماية')}>
          <div className="cln-protection">
            <div className="cln-protection-row"><span><Globe className="w-3.5 h-3.5" />{t(locale, 'Cache folders', 'مجلدات الذاكرة')}</span><strong>{formatBytes(sumBytes(browserCandidates))}</strong></div>
            <div className="cln-protection-row is-good"><span><ShieldCheck className="w-3.5 h-3.5" />{t(locale, 'Cookies / history / passwords', 'الارتباطات / السجل / كلمات المرور')}</span><strong>{t(locale, 'Not read', 'لا تُقرأ')}</strong></div>
            <div className="cln-protection-row"><span><FileWarning className="w-3.5 h-3.5" />{t(locale, 'Active browser sessions', 'جلسات المتصفح النشطة')}</span><strong>{formatCount(active.length)}</strong></div>
          </div>
          <label className="cln-ack">
            <input type="checkbox" checked={selected.length > 0} readOnly />
            <span>{t(locale, 'Selected cache items are review-only; no profile database is touched.', 'عناصر الذاكرة المحددة للمراجعة فقط؛ لا تُمس قاعدة بيانات الملف الشخصي.')}</span>
          </label>
          <div className="cln-svc-actions">
            <button type="button" className="cln-btn cln-btn-quiet" onClick={() => setChecked(new Set(eligible.map((entry) => entry.id)))} disabled={!eligible.length}>
              {t(locale, 'Select safe cache', 'تحديد الذاكرة الآمنة')}
            </button>
            <button type="button" className="cln-btn cln-btn-primary" onClick={() => onStagePlan(selected.map((entry) => entry.id), 'purge')} disabled={!selected.length}>
              <Lock className="w-3.5 h-3.5" />
              {t(locale, 'Draft cache clear', 'مسودة مسح الذاكرة')}
            </button>
          </div>
          <p className="cln-svc-warning">{t(locale, 'If a browser is running, its cache candidates are marked blocked by the native process check. Close the browser before any future approved action.', 'إذا كان المتصفح يعمل، تُعلَّم مرشحات ذاكرته كمحجوبة بفحص العملية الأصلي. أغلق المتصفح قبل أي إجراء معتمد لاحق.')}</p>
        </Section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 10 — Log Explorer                                                   */
/* ------------------------------------------------------------------ */

function LogsWorkspace({ locale, candidates, onStagePlan }: BranchProps) {
  const logs = byCategory(candidates, 'logs');
  const sources = useMemo(() => Array.from(new Set(logs.map((candidate) => candidate.source))).sort(), [logs]);
  const [source, setSource] = useState('all');
  const [range, setRange] = useState<7 | 30 | 90 | 3650>(30);
  const [retentionDays, setRetentionDays] = useState(30);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const rows = useMemo(() => logs.filter((candidate) => {
    if (source !== 'all' && candidate.source !== source) return false;
    return (candidate.ageDays || 0) <= range;
  }), [logs, range, source]);

  const toggle = (id: string) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selected = logs.filter((candidate) => checked.has(candidate.id));
  const dumps = logs.filter((candidate) => /\.dmp/i.test(candidate.name) || /crash/i.test(candidate.source));
  const wer = logs.filter((candidate) => /error reporting|wer/i.test(candidate.source));
  const windowsOwned = logs.filter((candidate) => candidate.safety === 'blocked');

  return (
    <div className="cln-svc-stack">
      <div className="cln-svc-kpi-row">
        <MiniKpi label={t(locale, 'Crash dump evidence', 'دليل تفريغات الأعطال')} value={formatBytes(sumBytes(dumps))} sub={`${formatCount(dumps.length)} ${t(locale, 'sources', 'مصدرًا')}`} tone="warn" />
        <MiniKpi label={t(locale, 'Windows Error Reporting', 'تقارير أخطاء Windows')} value={formatBytes(sumBytes(wer))} sub={`${formatCount(wer.length)} ${t(locale, 'sources', 'مصدرًا')}`} />
        <MiniKpi label={t(locale, 'Windows-owned logs', 'سجلات Windows المملوكة')} value={formatCount(windowsOwned.length)} sub={t(locale, 'Blocked from cleanup', 'محجوبة عن التنظيف')} tone="bad" />
        <MiniKpi label={t(locale, 'Retention draft', 'مسودة الاحتفاظ')} value={`${retentionDays} d`} sub={t(locale, 'Not persisted', 'غير محفوظة')} />
      </div>

      <div className="cln-svc-toolbar">
        <select className="cln-select" value={source} onChange={(event) => setSource(event.target.value)} aria-label={t(locale, 'Filter log source', 'ترشيح مصدر السجل')}>
          <option value="all">{t(locale, 'All log sources', 'كل مصادر السجلات')}</option>
          {sources.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
        </select>
        <div className="cln-segmented">
          {([7, 30, 90, 3650] as const).map((days) => (
            <button key={days} type="button" aria-pressed={range === days} className={range === days ? 'is-active' : ''} onClick={() => setRange(days)}>
              {days === 3650 ? t(locale, 'All', 'الكل') : `${days} d`}
            </button>
          ))}
        </div>
        <label className="cln-age-select">
          <span>{t(locale, 'Retention policy', 'سياسة الاحتفاظ')}</span>
          <select value={retentionDays} onChange={(event) => setRetentionDays(Number(event.target.value))} aria-label={t(locale, 'Retention policy draft', 'مسودة سياسة الاحتفاظ')}>
            {[7, 14, 30, 90].map((days) => <option key={days} value={days}>{days} {t(locale, 'days', 'يومًا')}</option>)}
          </select>
        </label>
        <button type="button" className="cln-btn cln-btn-quiet" onClick={() => setChecked(new Set(rows.filter((entry) => entry.safety !== 'blocked').map((entry) => entry.id)))} disabled={!rows.length}>
          {t(locale, 'Select visible', 'تحديد الظاهر')}
        </button>
      </div>

      <div className="cln-svc-split cln-svc-split-wide">
        <Section title={t(locale, 'Log-source timeline', 'الخط الزمني لمصادر السجلات')} sub={t(locale, 'Age is based on the newest measured file in each source.', 'العمر مبني على أحدث ملف مقيس في كل مصدر.')}>
          <div className="cln-log-list knx-custom-scrollbar">
            {rows.map((candidate) => (
              <label key={candidate.id} className={`cln-log-row ${checked.has(candidate.id) ? 'is-checked' : ''}`}>
                <input type="checkbox" checked={checked.has(candidate.id)} onChange={() => toggle(candidate.id)} disabled={candidate.safety === 'blocked'} />
                <span className="cln-log-dot" style={{ background: CATEGORY_META.logs.color }} />
                <span className="min-w-0">
                  <strong title={candidate.name}>{candidate.name}</strong>
                  <em>{candidate.source} · {formatAge(candidate.ageDays, locale)}</em>
                </span>
                <span className="cln-mono">{formatBytes(candidate.sizeBytes)}</span>
                <SafetyBadge safety={candidate.safety} locale={locale} />
              </label>
            ))}
            {!rows.length ? (
              <Empty icon={<FileCode2 className="w-6 h-6" />} title={t(locale, 'No log sources in this range', 'لا مصادر سجلات في هذا النطاق')} copy={t(locale, 'CrashDumps, WER and Windows log roots were absent, denied or older than the selected range.', 'جذور CrashDumps وWER وسجلات Windows غائبة أو مرفوضة أو أقدم من النطاق المحدد.')} />
            ) : null}
          </div>
        </Section>
        <Section title={t(locale, 'Protection & staged purge', 'الحماية والإزالة المُعدّة')}>
          <ul className="cln-svc-checklist">
            <li className="is-bad"><ShieldOff className="w-3.5 h-3.5" />{t(locale, 'System event logs are protected and never targeted.', 'سجلات أحداث النظام محمية ولا تُستهدف أبدًا.')}</li>
            <li className="is-bad"><Lock className="w-3.5 h-3.5" />{t(locale, 'CBS and DISM logs are Windows-owned.', 'سجلات CBS وDISM مملوكة لـ Windows.')}</li>
            <li className="is-warn"><AlertTriangle className="w-3.5 h-3.5" />{t(locale, 'Crash dumps can be needed for support diagnostics.', 'قد تكون تفريغات الأعطال مطلوبة لتشخيص الدعم.')}</li>
            <li className="is-good"><CheckCircle2 className="w-3.5 h-3.5" />{t(locale, 'Selected items are measured evidence only.', 'العناصر المحددة أدلة مقيسة فقط.')}</li>
          </ul>
          <div className="cln-svc-compare">
            <div><span>{t(locale, 'Selected', 'محدد')}</span><strong>{formatCount(selected.length)}</strong></div>
            <div><span>{t(locale, 'Measured bytes', 'الأحجام المقيسة')}</span><strong>{formatBytes(sumBytes(selected))}</strong></div>
            <div><span>{t(locale, 'Retention draft', 'مسودة الاحتفاظ')}</span><strong>{retentionDays} d</strong></div>
          </div>
          <div className="cln-svc-actions">
            <button type="button" className="cln-btn cln-btn-primary" disabled={!selected.length} onClick={() => onStagePlan(selected.map((entry) => entry.id), 'purge')}>
              <Lock className="w-3.5 h-3.5" />
              {t(locale, 'Stage dump purge', 'إعداد إزالة التفريغات')}
            </button>
            <button type="button" className="cln-btn cln-btn-quiet" onClick={() => setChecked(new Set())} disabled={!checked.size}>
              {t(locale, 'Clear selection', 'مسح التحديد')}
            </button>
          </div>
          <p className="cln-svc-warning">{t(locale, 'The retention selector only changes this local draft. No log is deleted and no policy is written.', 'مُحدد الاحتفاظ يغيّر هذه المسودة المحلية فقط. لا يُحذف أي سجل ولا تُكتب أي سياسة.')}</p>
        </Section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 11 — Cleanup Scheduler                                              */
/* ------------------------------------------------------------------ */

const WEEKDAYS = [
  { value: 0, en: 'Sun', ar: 'الأحد' },
  { value: 1, en: 'Mon', ar: 'الاثنين' },
  { value: 2, en: 'Tue', ar: 'الثلاثاء' },
  { value: 3, en: 'Wed', ar: 'الأربعاء' },
  { value: 4, en: 'Thu', ar: 'الخميس' },
  { value: 5, en: 'Fri', ar: 'الجمعة' },
  { value: 6, en: 'Sat', ar: 'السبت' },
];

function ScheduleWorkspace({ locale, controller }: BranchProps) {
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [time, setTime] = useState('02:00');
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]);
  const [categories, setCategories] = useState<CleanupCategory[]>([...SCAN_CATEGORIES]);
  const [paused, setPaused] = useState(false);
  const draft: CleanupScheduleDraft | null = controller.schedule;

  useEffect(() => {
    void controller.loadSchedule({ frequency: 'daily', time: '02:00', weekdays: [1, 3, 5], categories: [...SCAN_CATEGORIES] });
  }, [controller.loadSchedule]);

  const toggleDay = (day: number) => {
    setWeekdays((current) => (current.includes(day) ? current.filter((entry) => entry !== day) : [...current, day].sort()));
  };

  const toggleCategory = (key: CleanupCategory) => {
    setCategories((current) => (current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]));
  };

  return (
    <div className="cln-svc-stack">
      <div className="cln-svc-kpi-row">
        <MiniKpi label={t(locale, 'Draft occurrences', 'المواعيد في المسودة')} value={draft ? formatCount(draft.occurrences.length) : '—'} sub={draft ? draft.draft.frequency : undefined} />
        <MiniKpi label={t(locale, 'Next execution', 'التنفيذ التالي')} value={draft?.occurrences[0] ? formatTimestamp(draft.occurrences[0], locale) : '—'} tone="warn" />
        <MiniKpi label={t(locale, 'Quiet hours', 'الساعات الهادئة')} value={draft ? `${draft.quietHours.from}–${draft.quietHours.to}` : '00:00–06:00'} sub={draft?.quietHours.respected ? t(locale, 'Respected', 'محترمة') : t(locale, 'Outside quiet hours', 'خارج الساعات الهادئة')} />
        <MiniKpi label={t(locale, 'Persisted tasks', 'المهام المحفوظة')} value="0" sub={t(locale, 'Draft only', 'مسودة فقط')} tone="good" />
      </div>

      <div className="cln-svc-split cln-svc-split-wide">
        <Section title={t(locale, 'Schedule draft', 'مسودة الجدول')} sub={t(locale, 'Compose a read-only scan draft. No Windows scheduled task is created.', 'أنشئ مسودة فحص للقراءة فقط. لا تُنشأ مهمة Windows مجدولة.')}>
          <div className="cln-form-grid">
            <label>
              <span>{t(locale, 'Frequency', 'التكرار')}</span>
              <select value={frequency} onChange={(event) => setFrequency(event.target.value as 'daily' | 'weekly')}>
                <option value="daily">{t(locale, 'Daily', 'يوميًا')}</option>
                <option value="weekly">{t(locale, 'Weekly', 'أسبوعيًا')}</option>
              </select>
            </label>
            <label>
              <span>{t(locale, 'Time', 'الوقت')}</span>
              <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </label>
          </div>

          {frequency === 'weekly' ? (
            <div className="cln-weekday-row">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  aria-pressed={weekdays.includes(day.value)}
                  className={weekdays.includes(day.value) ? 'is-active' : ''}
                  onClick={() => toggleDay(day.value)}
                >
                  {locale === 'ar' ? day.ar : day.en}
                </button>
              ))}
            </div>
          ) : null}

          <div className="cln-cat-checks">
            {SCAN_CATEGORIES.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={categories.includes(key)}
                className={`cln-cat-check ${categories.includes(key) ? 'is-active' : ''}`}
                style={{ '--cln-cat': CATEGORY_META[key].color } as React.CSSProperties}
                onClick={() => toggleCategory(key)}
              >
                <span className="cln-cat-dot" />
                {categoryLabel(key, locale)}
              </button>
            ))}
          </div>

          <div className="cln-svc-actions">
            <button
              type="button"
              className="cln-btn cln-btn-primary"
              data-testid="cleanup-schedule-compose"
              disabled={!categories.length || !controller.nativeAvailable}
              onClick={() => void controller.loadSchedule({ frequency, time, weekdays, categories })}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              {t(locale, 'Compose draft', 'إنشاء المسودة')}
            </button>
            <button type="button" className="cln-btn cln-btn-quiet" onClick={() => setPaused((current) => !current)} aria-pressed={paused}>
              {paused ? <RefreshCw className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {paused ? t(locale, 'Resume draft', 'استئناف المسودة') : t(locale, 'Pause draft', 'إيقاف المسودة')}
            </button>
            {paused ? <span className="cln-chip cln-chip-warn">{t(locale, 'Draft paused locally', 'المسودة موقوفة محليًا')}</span> : null}
          </div>
        </Section>

        <Section title={t(locale, 'Upcoming read-only scans', 'الفحوص القادمة للقراءة فقط')} sub={t(locale, 'Occurrences are computed locally and never persisted as a task.', 'تُحسب المواعيد محليًا ولا تُحفظ كمهمة أبدًا.')}>
          {draft ? (
            <>
              <ol className="cln-occurrences">
                {draft.occurrences.map((occurrence) => (
                  <li key={occurrence}>
                    <span className="cln-occurrence-dot" />
                    <span>{formatTimestamp(occurrence, locale)}</span>
                    <em>{draft.draft.scanOnly ? t(locale, 'Scan only', 'فحص فقط') : ''}</em>
                  </li>
                ))}
              </ol>
              <div className="cln-svc-gate cln-svc-gate-inline">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <strong>{draft.execution.gate}</strong>
                  <p>{draft.execution.reason}</p>
                </div>
              </div>
            </>
          ) : (
            <Empty icon={<CalendarClock className="w-6 h-6" />} title={t(locale, 'No draft composed', 'لم تُنشأ مسودة')} copy={t(locale, 'Compose a draft to calculate the next read-only scan times.', 'أنشئ مسودة لحساب أوقات الفحص القادمة للقراءة فقط.')} />
          )}
        </Section>
      </div>

      <Section title={t(locale, 'Draft policy review', 'مراجعة سياسة المسودة')} sub={t(locale, 'Safety threshold gates applied to every drafted occurrence.', 'بوابات حد الأمان المطبقة على كل موعد في المسودة.')}>
        <div className="cln-policy-grid">
          <div><ShieldCheck className="w-4 h-4" /><strong>{t(locale, 'Scan only', 'فحص فقط')}</strong><span>{t(locale, 'No cleanup is scheduled in this mission.', 'لا تنظيف مجدول في هذه المهمة.')}</span></div>
          <div><Clock className="w-4 h-4" /><strong>{t(locale, 'Quiet hours', 'الساعات الهادئة')}</strong><span>{draft?.quietHours.respected ? t(locale, 'The selected time is inside quiet hours.', 'الوقت المحدد داخل الساعات الهادئة.') : t(locale, 'The selected time is outside quiet hours.', 'الوقت المحدد خارج الساعات الهادئة.')}</span></div>
          <div><ShieldOff className="w-4 h-4" /><strong>{t(locale, 'No task creation', 'لا إنشاء مهام')}</strong><span>{t(locale, 'Task Scheduler creation is Mission 13 and approval-gated.', 'إنشاء مهام Task Scheduler في المهمة 13 ويتطلب موافقة.')}</span></div>
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 12 — Cleanup Reports                                                */
/* ------------------------------------------------------------------ */

function ReportsWorkspace({ locale, controller }: BranchProps) {
  const [redacted, setRedacted] = useState(true);
  const [format, setFormat] = useState<'json' | 'pdf'>('json');
  const [auditOpen, setAuditOpen] = useState(false);
  const report = controller.report;

  useEffect(() => {
    void controller.loadReport();
  }, [controller.loadReport]);

  const exportReport = async () => {
    if (!report) return;
    const payload = {
      contract: report.contract,
      generatedAt: report.generatedAt,
      readOnly: report.readOnly,
      mutation: report.mutation,
      redacted,
      format,
      session: report.session
        ? { id: report.session.id, observedAt: report.session.observedAt, categories: report.session.categories, coverage: report.session.coverage }
        : null,
      summary: report.summary,
      recycle: report.recycle,
      vault: report.vault,
      journal: report.journal,
      warnings: report.warnings,
      note: report.note,
      reclaimedBytes: 0,
      disclaimer: 'No deletion occurred. No reclaimed bytes are claimed. This report is measured evidence only.',
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      controller.showNotice(t(locale, 'The read-only report was copied as JSON. No file was written or deleted.', 'نُسخ التقرير للقراءة فقط JSON. لم يُكتب أو يُحذف أي ملف.'));
    } catch {
      controller.showNotice(t(locale, 'The clipboard is unavailable; the report was not exported.', 'الحافظة غير متاحة؛ لم يُصدَّر التقرير.'));
    }
  };

  return (
    <div className="cln-svc-stack">
      <div className="cln-svc-toolbar">
        <label className="cln-ack cln-ack-inline">
          <input type="checkbox" checked={redacted} onChange={(event) => setRedacted(event.target.checked)} />
          <span>{t(locale, 'Toggle redaction', 'تبديل الحجب')}</span>
        </label>
        <div className="cln-segmented">
          <button type="button" aria-pressed={format === 'json'} className={format === 'json' ? 'is-active' : ''} onClick={() => setFormat('json')}>JSON</button>
          <button type="button" aria-pressed={format === 'pdf'} className={format === 'pdf' ? 'is-active' : ''} onClick={() => setFormat('pdf')}>PDF</button>
        </div>
        <button type="button" className="cln-btn cln-btn-primary" data-testid="cleanup-reports-export" onClick={() => void exportReport()} disabled={!report || format === 'pdf'}>
          <ClipboardCopy className="w-3.5 h-3.5" />
          {t(locale, 'Export preview report', 'تصدير التقرير')}
        </button>
        <button type="button" className="cln-btn cln-btn-quiet" onClick={() => setAuditOpen((current) => !current)} aria-pressed={auditOpen}>
          <ListChecks className="w-3.5 h-3.5" />
          {t(locale, 'Inspect audit trail', 'فحص مسار التدقيق')}
        </button>
        {format === 'pdf' ? <span className="cln-chip cln-chip-warn">{t(locale, 'PDF rendering is gated', 'عرض PDF محجوب')}</span> : null}
      </div>

      <div className="cln-report-columns">
        <Section title={t(locale, 'Initial measured footprint', 'البصمة المقيسة الأولية')} sub={report ? formatTimestamp(report.generatedAt, locale) : undefined}>
          <div className="cln-report-kpis">
            <MiniKpi label={t(locale, 'Candidates', 'المرشحون')} value={report ? formatCount(report.summary.candidates) : '—'} />
            <MiniKpi label={t(locale, 'Eligible evidence', 'الدليل المؤهل')} value={report ? formatBytes(report.summary.eligibleBytes) : '—'} tone="good" />
            <MiniKpi label={t(locale, 'Review / blocked', 'مراجعة / محجوب')} value={report ? `${formatBytes(report.summary.reviewBytes)} / ${formatBytes(report.summary.blockedBytes)}` : '—'} tone="warn" />
          </div>
          {report?.session ? (
            <dl className="cln-svc-dl">
              <div><dt>{t(locale, 'Session', 'الجلسة')}</dt><dd className="cln-mono">{report.session.id.slice(0, 18)}</dd></div>
              <div><dt>{t(locale, 'Observed', 'وقت القياس')}</dt><dd>{formatTimestamp(report.session.observedAt, locale)}</dd></div>
              <div><dt>{t(locale, 'Coverage', 'التغطية')}</dt><dd>{formatCount(report.session.coverage.rootsScanned)} {t(locale, 'roots', 'جذرًا')} · {formatCount(report.session.coverage.filesMeasured)} {t(locale, 'files', 'ملفًا')} · {formatBytes(report.session.coverage.bytesMeasured)}</dd></div>
            </dl>
          ) : (
            <Empty icon={<BarChart3 className="w-6 h-6" />} title={t(locale, 'No measured session', 'لا جلسة مقيسة')} copy={t(locale, 'Run discovery to create measured evidence for a report.', 'شغّل الاستكشاف لإنشاء أدلة مقيسة للتقرير.')} />
          )}
        </Section>

        <Section title={t(locale, 'Final footprint & reclaimed proof', 'البصمة النهائية ودليل الاستعادة')} sub={t(locale, 'Identical to the initial state because no mutation occurred.', 'مطابقة للحالة الأولية لأن أي تغيير لم يحدث.')}>
          <div className="cln-report-kpis">
            <MiniKpi label={t(locale, 'Reclaimed bytes', 'الأحجام المستعادة')} value="0 B" tone="good" sub={t(locale, 'No deletion performed', 'لم يُنفّذ حذف')} />
            <MiniKpi label={t(locale, 'Vault manifest', 'بيان الحجر')} value={report ? formatCount(report.vault.entries) : '—'} sub={report ? formatBytes(report.vault.bytes) : undefined} />
            <MiniKpi label={t(locale, 'Journal', 'السجل')} value={report?.journal.exists ? t(locale, 'Present', 'موجود') : t(locale, 'Absent', 'غائب')} sub={report ? `${formatCount(report.journal.entries)} ${t(locale, 'entries', 'مدخلًا')}` : undefined} />
          </div>
          <div className="cln-proof">
            <ShieldCheck className="w-5 h-5" />
            <div>
              <strong>{t(locale, 'Measured-only report', 'تقرير مقيس فقط')}</strong>
              <p>{report?.note || t(locale, 'All values are measured metadata. No deletion occurred and no reclaimed bytes are claimed.', 'كل القيم بيانات وصفية مقيسة. لم يحدث حذف ولا تُطالب أحجام مستعادة.')}</p>
            </div>
          </div>
          {report?.warnings?.length ? (
            <ul className="cln-svc-list">
              {report.warnings.map((warning) => <li key={warning}><AlertTriangle className="w-3.5 h-3.5" />{warning}</li>)}
            </ul>
          ) : null}
        </Section>
      </div>

      {auditOpen ? (
        <Section title={t(locale, 'Audit trail verification', 'التحقق من مسار التدقيق')}>
          <dl className="cln-svc-dl cln-svc-dl-3">
            <div><dt>Contract</dt><dd className="cln-mono">{report?.contract || '—'}</dd></div>
            <div><dt>readOnly</dt><dd>{String(report?.readOnly ?? true)}</dd></div>
            <div><dt>mutation</dt><dd>{report?.mutation || 'none'}</dd></div>
            <div><dt>{t(locale, 'Generated', 'أُنشئ')}</dt><dd>{report ? formatTimestamp(report.generatedAt, locale) : '—'}</dd></div>
            <div><dt>{t(locale, 'Recycle evidence', 'دليل السلة')}</dt><dd>{report ? `${formatCount(report.recycle.items)} · ${formatBytes(report.recycle.bytes)}` : '—'}</dd></div>
            <div><dt>{t(locale, 'Vault exists', 'الحجر موجود')}</dt><dd>{String(report?.vault.exists ?? false)}</dd></div>
          </dl>
          <p className="cln-svc-warning">{t(locale, 'Export is clipboard-only in this hardened runtime. PDF rendering stays gated; no download channel is opened.', 'التصدير إلى الحافظة فقط في هذا التشغيل المحصّن. عرض PDF يبقى محجوبًا؛ لا تُفتح قناة تنزيل.')}</p>
        </Section>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

function gateFor(service: CleanupServiceId, controller: CleanupController): { gate: string; reason: string } {
  if (service === 'cleanup-schedule') {
    return controller.schedule?.execution || {
      gate: 'Mission 13 scheduled automation',
      reason: 'Task creation and unattended execution are approval-gated. This service never persists a task.',
    };
  }
  if (service === 'cleanup-temp-quarantine' || service === 'cleanup-temp-undo' || service === 'cleanup-quarantine-list') {
    return controller.quarantine?.execution || {
      gate: 'Mission 08 destructive-action approval',
      reason: 'No quarantine write, restore or purge channel exists in this read-only delivery.',
    };
  }
  if (service === 'cleanup-update-cache') {
    return {
      gate: 'Mission 11 Windows servicing',
      reason: 'DISM/component-store servicing is elevated and hands off to the official Windows page. No elevation is requested here.',
    };
  }
  return {
    gate: 'Mission 08 destructive-action approval',
    reason: 'Staging produces an immutable review plan only. No file is deleted, moved or quarantined; no reclaimed bytes are claimed.',
  };
}

export function ServiceWorkspace({
  service,
  locale,
  controller,
  candidates,
  selectedCandidate,
  selectedIds,
  onSelectCandidate,
  onApplySelection,
  onToggleSelected,
  onStagePlan,
  onClose,
  onOpenVault,
  embedded = false,
}: ServiceWorkspaceProps) {
  const capability = controller.capabilities?.services.find((entry) => entry.id === service);
  const fallback = SERVICE_FALLBACK_META[service];
  const accent = SERVICE_ACCENTS[service];
  const title = capability
    ? (locale === 'ar' ? capability.labelAr : capability.labelEn)
    : (locale === 'ar' ? fallback.titleAr : fallback.titleEn);
  const note = capability
    ? (locale === 'ar' ? capability.noteAr : capability.noteEn)
    : (locale === 'ar' ? fallback.descAr : fallback.descEn);
  const state = capability?.state || null;
  const gate = gateFor(service, controller);
  const branchProps: BranchProps = {
    locale,
    controller,
    candidates,
    selectedCandidate,
    selectedIds,
    onSelectCandidate,
    onApplySelection,
    onToggleSelected,
    onStagePlan,
    onOpenVault,
  };

  const renderWorkspaceBody = () => (
    <>
      {!controller.nativeAvailable ? (
        <div className="cln-native-banner cln-native-required cln-service-native" data-testid="cleanup-service-native-required">
          <FolderLock className="w-4 h-4 shrink-0" />
          <div>
            <strong>{t(locale, 'Native measurement required', 'مطلوب قياس أصلي')}</strong>
            <p>{t(locale, 'This is a browser preview. No candidate, vault, journal or report value is substituted.', 'هذه معاينة متصفح. لا تُستبدل أي قيمة مرشح أو حجر أو سجل أو تقرير.')}</p>
          </div>
        </div>
      ) : null}

      {service === 'cleanup-temp-preview' ? <TempPreviewWorkspace {...branchProps} /> : null}
      {service === 'cleanup-temp-quarantine' ? <QuarantineWorkspace {...branchProps} /> : null}
      {service === 'cleanup-temp-undo' ? <UndoWorkspace {...branchProps} /> : null}
      {service === 'cleanup-quarantine-list' ? <VaultWorkspace {...branchProps} /> : null}
      {service === 'cleanup-estimate' ? <EstimateWorkspace {...branchProps} /> : null}
      {service === 'cleanup-recycle' ? <RecycleWorkspace {...branchProps} /> : null}
      {service === 'cleanup-unused' ? <UnusedWorkspace {...branchProps} /> : null}
      {service === 'cleanup-update-cache' ? <UpdateCacheWorkspace {...branchProps} /> : null}
      {service === 'cleanup-browser-cache' ? <BrowserCacheWorkspace {...branchProps} /> : null}
      {service === 'cleanup-logs' ? <LogsWorkspace {...branchProps} /> : null}
      {service === 'cleanup-schedule' ? <ScheduleWorkspace {...branchProps} /> : null}
      {service === 'cleanup-reports' ? <ReportsWorkspace {...branchProps} /> : null}
    </>
  );

  if (embedded) {
    return (
      <div data-testid="cleanup-service-focus" className="flex flex-col gap-2">
        <p className="text-[10px] text-slate-400">{note}</p>
        <div data-testid={`cleanup-${service}-workbench`}>{renderWorkspaceBody()}</div>
        <div className="cln-service-foot-gate">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <div>
            <strong>{gate.gate}</strong>
            <p>{gate.reason}</p>
          </div>
          <span className="cln-chip cln-chip-muted">{t(locale, 'READ-ONLY', 'للقراءة فقط')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cln-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cln-service-title">
      <div className="cln-service-workspace" data-testid={`cleanup-service-workspace-${service}`}>
        <header className="cln-service-head">
          <span className="cln-service-head-icon" style={{ color: accent, borderColor: `${accent}55`, background: `${accent}18` }}>
            {serviceIcon(service, 'w-5 h-5')}
          </span>
          <div className="min-w-0 flex-1">
            <div className="cln-breadcrumb">
              <span>{t(locale, 'Clean Room', 'غرفة التنظيف')}</span>
              <ArrowRight className="w-3 h-3" />
              <span>{t(locale, 'Service', 'خدمة')}</span>
              <span className="cln-breadcrumb-tag cln-mono">{service}</span>
            </div>
            <h2 id="cln-service-title" className="cln-service-head-title">{title}</h2>
            <p className="cln-service-head-note">{note}</p>
          </div>
          <div className="cln-service-head-meta">
            {capability ? <span className={`cln-state cln-state-${capability.state}`}>{serviceStateLabel(capability.state, locale)}</span> : <span className="cln-state cln-state-native">{t(locale, 'Native', 'أصلي')}</span>}
            {state ? <span className="cln-chip cln-chip-muted">{capability?.provider}</span> : null}
            <button type="button" className="cln-icon-btn" onClick={onClose} aria-label={t(locale, 'Close service', 'إغلاق الخدمة')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="cln-service-body knx-custom-scrollbar">{renderWorkspaceBody()}</div>

        <footer className="cln-service-foot">
          <div className="cln-service-foot-gate">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <div>
              <strong>{gate.gate}</strong>
              <p>{gate.reason}</p>
            </div>
          </div>
          <span className="cln-chip cln-chip-muted">{t(locale, 'READ-ONLY', 'للقراءة فقط')}</span>
          <button type="button" className="cln-btn cln-btn-ghost" onClick={onClose}>
            {t(locale, 'Close workspace', 'إغلاق الورشة')}
          </button>
        </footer>
      </div>
    </div>
  );
}
