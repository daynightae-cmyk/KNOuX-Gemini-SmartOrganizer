import { NativeAppIcon } from '../components/app/AppIcon';
/**
 * Application dossier: the measured evidence for one selected application.
 * Actions here verify/measure or build a review plan; none mutate the device.
 */
import React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Box,
  Database,
  Fingerprint,
  FolderSearch,
  HardDrive,
  Info,
  Lock,
  ShieldCheck,
  ShieldQuestion,
  Zap,
} from 'lucide-react';
import type {
  AppRecord,
  AppSignatureResult,
  AppSizeResult,
} from '../../shared/native-contracts';
import type { AppsLocale } from './model';
import {
  formatBytes,
  formatCount,
  formatDate,
  formatTimestamp,
  removalMethodLabel,
  scopeLabel,
  signatureLabel,
  signatureTone,
  sourceLabel,
  startupSourceLabel,
  t,
} from './model';

interface AppDossierProps {
  locale: AppsLocale;
  app: AppRecord | null;
  signature: AppSignatureResult | null;
  size: AppSizeResult | null;
  signatureBusy: boolean;
  sizeBusy: boolean;
  onVerifySignature: (appId: string) => void;
  onMeasureSize: (appId: string) => void;
  onReviewPlan: (appId: string) => void;
  onOpenService: (service: string) => void;
}

function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="apps-detail-row">
      <dt>{label}</dt>
      <dd className={mono ? 'apps-mono' : undefined}>{value ?? '—'}</dd>
    </div>
  );
}

export const AppDossier: React.FC<AppDossierProps> = ({
  locale,
  app,
  signature,
  size,
  signatureBusy,
  sizeBusy,
  onVerifySignature,
  onMeasureSize,
  onReviewPlan,
  onOpenService,
}) => {
  if (!app) {
    return (
      <aside className="apps-panel apps-dossier" data-testid="apps-dossier" aria-labelledby="apps-dossier-title">
        <header className="apps-panel-head">
          <div>
            <h2 id="apps-dossier-title" className="apps-panel-title">
              {t(locale, 'Application dossier', 'ملف التطبيق')}
            </h2>
            <p className="apps-panel-sub">{t(locale, 'Measured evidence for one record', 'أدلة مقيسة لسجل واحد')}</p>
          </div>
        </header>
        <div className="apps-empty flex-1">
          <FolderSearch className="w-7 h-7 text-slate-500" />
          <p>{t(locale, 'Select a measured application from the register.', 'اختر تطبيقًا مقيسًا من السجل.')}</p>
        </div>
      </aside>
    );
  }

  const status = signature?.status || app.signature.status;
  const tone = signatureTone(status);
  const measured = size?.measuredBytes ?? app.size.measuredBytes;
  const reported = size?.reportedBytes ?? app.size.reportedBytes ?? app.estimatedSizeBytes;
  const files = size?.files ?? app.size.filesMeasured;
  const chain = signature?.chain || [];

  return (
    <aside className="apps-panel apps-dossier" data-testid="apps-dossier" aria-labelledby="apps-dossier-title">
      <header className="apps-panel-head">
        <div>
          <h2 id="apps-dossier-title" className="apps-panel-title">
            {t(locale, 'Application dossier', 'ملف التطبيق')}
          </h2>
          <p className="apps-panel-sub">
            {t(locale, 'Read-only evidence · no device mutation', 'أدلة للقراءة فقط · دون تغيير الجهاز')}
          </p>
        </div>
        <button
          type="button"
          className="apps-icon-btn"
          onClick={() => onOpenService('app-identity')}
          title={t(locale, 'Open the identity workspace', 'فتح مساحة الهوية')}
          aria-label={t(locale, 'Open the identity workspace', 'فتح مساحة الهوية')}
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </header>

      <div className="apps-dossier-scroll">
        <div className="apps-dossier-hero">
          <div className="apps-app-avatar"><NativeAppIcon appId={app.id} /></div>
          <div className="min-w-0 flex-1">
            <h3 className="apps-dossier-name" title={app.name}>{app.name}</h3>
            <p className="apps-dossier-publisher" title={app.publisher || ''}>
              {app.publisher || t(locale, 'Unknown publisher', 'ناشر غير معروف')}
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className={`apps-scope apps-scope-${app.scope}`}>{scopeLabel(app.scope, locale)}</span>
              <span className="apps-tag apps-tag-muted">{sourceLabel(app.source, locale)}</span>
              <span className="apps-tag apps-tag-muted">{app.version || t(locale, 'No version', 'بلا إصدار')}</span>
              {app.protected ? (
                <span className="apps-tag apps-tag-protected">{t(locale, 'PROTECTED', 'محمي')}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="apps-dossier-actions">
          <button
            type="button"
            className="apps-btn"
            onClick={() => onVerifySignature(app.id)}
            disabled={signatureBusy}
            title={t(locale, 'Verify Authenticode on the resolved executable', 'التحقق من Authenticode للملف التنفيذي')}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${signatureBusy ? 'animate-pulse' : ''}`} />
            {signatureBusy ? t(locale, 'Verifying…', 'جارٍ التحقق…') : t(locale, 'Verify signature', 'تحقق من التوقيع')}
          </button>
          <button
            type="button"
            className="apps-btn"
            onClick={() => onMeasureSize(app.id)}
            disabled={sizeBusy || !app.installLocation}
            title={
              app.installLocation
                ? t(locale, 'Measure the install folder within a bounded budget', 'قياس مجلد التثبيت ضمن ميزانية محدودة')
                : t(locale, 'No install location is registered', 'لا يوجد مسار تثبيت مسجل')
            }
          >
            <Database className={`w-3.5 h-3.5 ${sizeBusy ? 'animate-pulse' : ''}`} />
            {sizeBusy ? t(locale, 'Measuring…', 'جارٍ القياس…') : t(locale, 'Measure footprint', 'قياس البصمة')}
          </button>
          <button
            type="button"
            className="apps-btn apps-btn-danger"
            onClick={() => onReviewPlan(app.id)}
            title={t(locale, 'Build a Mission 08 review plan; execution stays blocked', 'بناء خطة مراجعة للمهمة 08؛ التنفيذ يبقى محجوبًا')}
          >
            <Lock className="w-3.5 h-3.5" />
            {t(locale, 'Review removal plan', 'مراجعة خطة الإزالة')}
          </button>
        </div>

        <section className="apps-dossier-block" data-testid="apps-dossier-signature">
          <div className="apps-block-head">
            <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
            <h4>{t(locale, 'Authenticode identity', 'هوية Authenticode')}</h4>
            <span className={`apps-sign apps-sign-${tone}`}>{signatureLabel(status, locale)}</span>
          </div>
          {signature ? (
            <div className="apps-block-body">
              <DetailRow
                label={t(locale, 'Executable', 'الملف التنفيذي')}
                value={signature.executable || t(locale, 'Not resolved', 'لم يُحدد')}
                mono
              />
              <DetailRow label={t(locale, 'Signer', 'الموقّع')} value={signature.signer || '—'} />
              <DetailRow label={t(locale, 'Issuer', 'المُصدر')} value={signature.issuer || '—'} />
              <DetailRow label={t(locale, 'Thumbprint', 'البصمة')} value={signature.thumbprint || '—'} mono />
              <DetailRow
                label={t(locale, 'Validity', 'الصلاحية')}
                value={
                  signature.notBefore || signature.notAfter
                    ? `${formatDate(signature.notBefore, locale)} → ${formatDate(signature.notAfter, locale)}`
                    : '—'
                }
              />
              <DetailRow label={t(locale, 'Checked', 'وقت الفحص')} value={formatTimestamp(signature.checkedAt, locale)} />
              {chain.length ? (
                <ol className="apps-chain">
                  {chain.map((element, index) => (
                    <li key={`${element.thumbprint}-${index}`}>
                      <span className="apps-chain-index">{index + 1}</span>
                      <div className="min-w-0">
                        <div className="apps-chain-subject" title={element.subject}>{element.subject || '—'}</div>
                        <div className="apps-chain-issuer" title={element.issuer}>{element.issuer || '—'}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}
              <p className="apps-note apps-note-warn">
                <Info className="w-3 h-3 shrink-0" />
                {signature.note}
              </p>
            </div>
          ) : (
            <p className="apps-note">
              <ShieldQuestion className="w-3.5 h-3.5 shrink-0" />
              {t(
                locale,
                'Not verified in this session. The inventory status is not a signature verdict until verification runs.',
                'لم يُتحقق منه في هذه الجلسة. حالة الجرد ليست حكمًا على التوقيع حتى يتم التحقق.'
              )}
            </p>
          )}
        </section>

        <section className="apps-dossier-block" data-testid="apps-dossier-size">
          <div className="apps-block-head">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <h4>{t(locale, 'Storage footprint', 'البصمة التخزينية')}</h4>
            <span className="apps-tag apps-tag-muted">
              {app.size.source === 'measured'
                ? t(locale, 'MEASURED', 'مقيس')
                : app.size.source === 'reported'
                  ? t(locale, 'REPORTED', 'مبلّغ')
                  : t(locale, 'UNKNOWN', 'غير معروف')}
            </span>
          </div>
          <div className="apps-block-body">
            <div className="apps-size-pair">
              <div>
                <span>{t(locale, 'Measured on disk', 'مقيس على القرص')}</span>
                <strong>{formatBytes(measured)}</strong>
              </div>
              <div>
                <span>{t(locale, 'Reported by registry', 'مبلّغ من السجل')}</span>
                <strong>{formatBytes(reported)}</strong>
              </div>
            </div>
            <DetailRow
              label={t(locale, 'Files measured', 'الملفات المقيسة')}
              value={files == null ? '—' : formatCount(files)}
            />
            {size?.partial ? (
              <p className="apps-note apps-note-warn">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {size.reason || t(locale, 'The bounded measurement stopped before completion.', 'توقف القياس المحدود قبل الاكتمال.')}
              </p>
            ) : null}
            {size?.topFolders?.length ? (
              <div className="apps-top-folders">
                {size.topFolders.slice(0, 4).map((folder) => (
                  <div key={folder.name} className="apps-top-folder">
                    <span title={folder.name}>{folder.name}</span>
                    <span className="apps-mono">{formatBytes(folder.bytes)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {size?.appData ? (
              <p className="apps-note">
                <FolderSearch className="w-3 h-3 shrink-0" />
                {t(locale, 'AppData name-match candidate', 'مرشح مطابقة اسم في AppData')}: {formatBytes(size.appData.bytes)} · {size.appData.path}
              </p>
            ) : null}
            <p className="apps-note">
              <Info className="w-3 h-3 shrink-0" />
              {t(
                locale,
                'Footprint measurement is bounded (entries, depth, time) and may be partial. It never scans a whole volume.',
                'قياس البصمة محدود (المدخلات والعمق والوقت) وقد يكون جزئيًا. لا يفحص قرصًا كاملًا أبدًا.'
              )}
            </p>
          </div>
        </section>

        <section className="apps-dossier-block">
          <div className="apps-block-head">
            <Box className="w-3.5 h-3.5 text-blue-400" />
            <h4>{t(locale, 'Installation evidence', 'أدلة التثبيت')}</h4>
          </div>
          <dl className="apps-block-body">
            <DetailRow label={t(locale, 'Install date', 'تاريخ التثبيت')} value={formatDate(app.installDate, locale)} />
            <DetailRow label={t(locale, 'Architecture', 'المعمارية')} value={app.architecture || '—'} />
            <DetailRow label={t(locale, 'Product code', 'رمز المنتج')} value={app.productCode || '—'} mono />
            <DetailRow
              label={t(locale, 'Install location', 'مسار التثبيت')}
              value={app.installLocation || '—'}
              mono
            />
            <DetailRow
              label={t(locale, 'Path exists', 'المسار موجود')}
              value={
                app.installLocationExists == null
                  ? '—'
                  : app.installLocationExists
                    ? t(locale, 'Yes', 'نعم')
                    : t(locale, 'No (stale registration)', 'لا (تسجيل قديم)')
              }
            />
            <DetailRow
              label={t(locale, 'Removal method', 'طريقة الإزالة')}
              value={removalMethodLabel(app.uninstallMethod, locale)}
            />
            <DetailRow
              label={t(locale, 'Registry view', 'عرض السجل')}
              value={app.registryView || '—'}
            />
            <DetailRow
              label={t(locale, 'Evidence', 'الدليل')}
              value={app.evidence.packageFullName || app.evidence.registryKeyRedacted || '—'}
              mono
            />
            <DetailRow label={t(locale, 'Last seen', 'آخر ظهور')} value={formatTimestamp(app.lastSeen, locale)} />
          </dl>
          <p className="apps-note">
            <Info className="w-3 h-3 shrink-0" />
            {t(
              locale,
              'Uninstall commands are never exposed to the renderer. Only the method and registry evidence are shown.',
              'أوامر إلغاء التثبيت لا تُعرض أبدًا للواجهة. تُعرض الطريقة وأدلة السجل فقط.'
            )}
          </p>
        </section>

        <section className="apps-dossier-block">
          <div className="apps-block-head">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <h4>{t(locale, 'Startup linkage', 'ارتباط الإقلاع')}</h4>
            <span className={`apps-tag ${app.startup.linked ? 'apps-tag-startup' : 'apps-tag-muted'}`}>
              {app.startup.linked ? t(locale, 'LINKED', 'مرتبط') : t(locale, 'NOT LINKED', 'غير مرتبط')}
            </span>
          </div>
          <div className="apps-block-body">
            <DetailRow
              label={t(locale, 'Measured entries', 'المدخلات المقيسة')}
              value={formatCount(app.startup.entryCount)}
            />
            <DetailRow
              label={t(locale, 'Sources', 'المصادر')}
              value={
                app.startup.sources.length
                  ? app.startup.sources.map((source) => startupSourceLabel(source, locale)).join(' · ')
                  : '—'
              }
            />
            <DetailRow
              label={t(locale, 'Boot seconds', 'ثواني الإقلاع')}
              value={t(locale, 'Not measured — never invented', 'غير مقيسة — لا تُختلق أبدًا')}
            />
            <p className="apps-note apps-note-warn">
              <Lock className="w-3 h-3 shrink-0" />
              {t(
                locale,
                'Startup enable/disable is gated to Mission 09. This dossier only reads Win32_StartupCommand linkage.',
                'تفعيل/تعطيل الإقلاع محجوب للمهمة 09. يعرض هذا الملف ارتباط Win32_StartupCommand فقط.'
              )}
            </p>
          </div>
        </section>

        <div className="apps-dossier-foot">
          <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {t(
              locale,
              'Read-only record. No uninstall, update, association or startup write exists in Mission 05.',
              'سجل للقراءة فقط. لا توجد كتابة إزالة أو تحديث أو ارتباط أو إقلاع في المهمة 05.'
            )}
          </span>
        </div>
      </div>
    </aside>
  );
};
