/**
 * Specialised application service workspaces.
 *
 * Each panel is a different measured view over the same native inventory. The
 * only actions are read-only queries, local review plans and official Windows
 * Settings handoffs; there is no mutation channel behind any button.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  FileSearch,
  Fingerprint,
  FolderSearch,
  HardDrive,
  Info,
  Layers,
  Link2,
  ListChecks,
  Lock,
  Package,
  RefreshCw,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import type { AppRecord, AppSizeResult } from '../../shared/native-contracts';
import type { DomainServiceKey } from './catalog';
import { DOMAIN_SERVICES_META, SERVICE_ACCENTS } from './catalog';
import {
  formatBytes,
  formatClock,
  formatCount,
  formatDate,
  formatTimestamp,
  groupPublishers,
  recentApps,
  scopeLabel,
  serviceDescription,
  serviceStateLabel,
  serviceTitle,
  signatureLabel,
  signatureTone,
  sizeOf,
  startupSourceLabel,
  t,
  updateStatusLabel,
} from './model';
import type { ApplicationsController } from './useApplications';

interface AppServiceWorkspaceProps {
  service: DomainServiceKey;
  locale: 'en' | 'ar';
  controller: ApplicationsController;
  selectedApp: AppRecord | null;
  selectedIds: string[];
  onSelectApp: (appId: string) => void;
  onClose: () => void;
  onOpenPlan: () => void;
  embedded?: boolean;
}

function serviceIcon(key: DomainServiceKey, className = 'w-4 h-4') {
  switch (key) {
    case 'app-inventory': return <Layers className={className} />;
    case 'app-identity': return <Fingerprint className={className} />;
    case 'app-search': return <Search className={className} />;
    case 'app-publisher': return <Building2 className={className} />;
    case 'app-recent': return <Clock className={className} />;
    case 'app-uninstall-queue': return <Trash2 className={className} />;
    case 'app-leftovers': return <Sparkles className={className} />;
    case 'app-updates': return <RefreshCw className={className} />;
    case 'app-size': return <Database className={className} />;
    case 'app-store-packages': return <Package className={className} />;
    case 'app-associations': return <Link2 className={className} />;
    case 'app-startup-impact': return <Zap className={className} />;
    default: return <Sparkles className={className} />;
  }
}

function MiniKpi({ label, value, tone = 'default', title }: { label: string; value: string; tone?: 'default' | 'good' | 'warn' | 'bad'; title?: string }) {
  return (
    <div className={`apps-mini-kpi apps-mini-kpi-${tone}`}>
      <span title={label}>{label}</span>
      <strong title={title ?? value}>{value}</strong>
    </div>
  );
}

function PanelEmpty({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="apps-empty apps-empty-panel">
      {icon}
      <p className="font-bold text-slate-200">{title}</p>
      <p className="text-[10px] text-slate-400 max-w-md">{copy}</p>
    </div>
  );
}

export const AppServiceWorkspace: React.FC<AppServiceWorkspaceProps> = ({
  service,
  locale,
  controller,
  selectedApp,
  selectedIds,
  onSelectApp,
  onClose,
  onOpenPlan,
  embedded = false,
}) => {
  const meta = DOMAIN_SERVICES_META.find((entry) => entry.key === service);
  const capability = controller.capabilities?.services.find((entry) => entry.id === service);
  const accent = SERVICE_ACCENTS[service];
  const apps = controller.inventory?.apps || [];
  const kpis = controller.inventory?.kpis;

  const [identityQuery, setIdentityQuery] = useState('');
  const [identityAppId, setIdentityAppId] = useState<string | null>(selectedApp?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentRange, setRecentRange] = useState<30 | 90 | 'all'>(90);
  const [sizeIds, setSizeIds] = useState<string[]>(selectedIds.length ? selectedIds : selectedApp ? [selectedApp.id] : []);
  const [packagesTab, setPackagesTab] = useState<'installed' | 'discover'>('installed');
  const [packagesQuery, setPackagesQuery] = useState('');
  const [assocTab, setAssocTab] = useState<'extension' | 'protocol'>('extension');
  const [assocQuery, setAssocQuery] = useState('');
  const [startupQuery, setStartupQuery] = useState('');

  useEffect(() => {
    if (!identityAppId && selectedApp) setIdentityAppId(selectedApp.id);
  }, [identityAppId, selectedApp]);

  useEffect(() => {
    if (!identityAppId && apps.length) setIdentityAppId(selectedApp?.id || apps[0].id);
  }, [apps, identityAppId, selectedApp]);

  const identityApp = apps.find((app) => app.id === identityAppId) || selectedApp;
  const identityMatches = useMemo(() => {
    const query = identityQuery.trim().toLowerCase();
    const source = query
      ? apps.filter((app) =>
          [app.name, app.publisher, app.version].filter(Boolean).join(' ').toLowerCase().includes(query)
        )
      : apps;
    return [...source].sort((left, right) => left.name.localeCompare(right.name)).slice(0, 20);
  }, [apps, identityQuery]);

  const searchMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return apps.slice(0, 80);
    return apps
      .filter((app) =>
        [app.name, app.publisher, app.version, app.productCode, app.evidence.packageFullName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 120);
  }, [apps, searchQuery]);

  const publisherGroups = useMemo(
    () => groupPublishers(apps, controller.signatures),
    [apps, controller.signatures]
  );
  const recent = useMemo(() => recentApps(apps, recentRange).slice(0, 60), [apps, recentRange]);
  const queueApps = useMemo(() => {
    if (selectedIds.length) return apps.filter((app) => selectedIds.includes(app.id));
    return selectedApp ? [selectedApp] : [];
  }, [apps, selectedApp, selectedIds]);

  const sizeCandidates = useMemo(
    () => apps.filter((app) => app.installLocation).sort((left, right) => (sizeOf(right) || 0) - (sizeOf(left) || 0)).slice(0, 120),
    [apps]
  );
  const sizeResults = useMemo<Array<{ app: AppRecord; result: AppSizeResult | null }>>(
    () =>
      sizeIds
        .map((id) => {
          const app = apps.find((entry) => entry.id === id);
          if (!app) return null;
          const result = (controller.sizes[id] as AppSizeResult | undefined) ?? null;
          return { app, result };
        })
        .filter((entry): entry is { app: AppRecord; result: AppSizeResult | null } => entry !== null)
        .sort((left, right) => {
          const leftBytes = left.result?.measuredBytes ?? sizeOf(left.app) ?? 0;
          const rightBytes = right.result?.measuredBytes ?? sizeOf(right.app) ?? 0;
          return rightBytes - leftBytes;
        }),
    [apps, controller.sizes, sizeIds]
  );

  const assocRows = useMemo(() => {
    const source = controller.associations
      ? assocTab === 'extension'
        ? controller.associations.extensions
        : controller.associations.protocols
      : [];
    const query = assocQuery.trim().toLowerCase();
    if (!query) return source;
    return source.filter((entry) =>
      [entry.key, entry.progId, entry.handlerName, entry.userChoice, entry.commandExe]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [assocQuery, assocTab, controller.associations]);

  const startupRows = useMemo(() => {
    const source = controller.inventory?.startup || [];
    const query = startupQuery.trim().toLowerCase();
    if (!query) return source;
    return source.filter((entry) =>
      [entry.name, entry.source, entry.executable, entry.linkedAppName].filter(Boolean).join(' ').toLowerCase().includes(query)
    );
  }, [controller.inventory?.startup, startupQuery]);

  const toggleSizeId = (appId: string) => {
    setSizeIds((current) => {
      if (current.includes(appId)) return current.filter((id) => id !== appId);
      if (current.length >= 40) {
        controller.showNotice('A bounded size operation is limited to 40 applications.');
        return current;
      }
      return [...current, appId];
    });
  };

  const buildQueuePlan = async () => {
    const ids = queueApps.map((app) => app.id);
    const built = await controller.reviewPlan(ids);
    if (built) onOpenPlan();
  };

  const renderPanel = () => {
    switch (service) {
      case 'app-inventory': {
        const coverage = controller.inventory?.coverage;
        const scopes = {
          machine: apps.filter((app) => app.scope === 'per-machine').length,
          user: apps.filter((app) => app.scope === 'per-user').length,
          packaged: apps.filter((app) => app.scope === 'packaged').length,
        };
        return (
          <div className="apps-service-body">
            <div className="apps-service-kpis">
              <MiniKpi label={t(locale, 'Installed records', 'سجلات مثبتة')} value={formatCount(kpis?.installed)} />
              <MiniKpi label={t(locale, 'Per machine', 'لكل الجهاز')} value={formatCount(scopes.machine)} />
              <MiniKpi label={t(locale, 'Per user', 'لكل مستخدم')} value={formatCount(scopes.user)} />
              <MiniKpi label={t(locale, 'Packaged', 'حزم')} value={formatCount(scopes.packaged)} />
              <MiniKpi label={t(locale, 'Protected', 'محمية')} value={formatCount(kpis?.protectedCount)} tone="warn" />
              <MiniKpi
                label={t(locale, 'Stale registrations', 'تسجيلات قديمة')}
                value={formatCount(kpis?.staleRegistrations)}
                tone={kpis?.staleRegistrations ? 'bad' : 'good'}
              />
            </div>

            <div className="apps-service-grid-2">
              <section className="apps-subpanel">
                <h4>{t(locale, 'Measured coverage', 'التغطية المقيسة')}</h4>
                <dl className="apps-service-dl">
                  <div><dt>{t(locale, 'Registry items', 'عناصر السجل')}</dt><dd>{formatCount(coverage?.registryItems)}</dd></div>
                  <div><dt>{t(locale, 'Appx / MSIX items', 'عناصر Appx/MSIX')}</dt><dd>{formatCount(coverage?.appxItems)}</dd></div>
                  <div><dt>{t(locale, 'Returned records', 'السجلات المُعادة')}</dt><dd>{formatCount(coverage?.returned)}</dd></div>
                  <div><dt>{t(locale, 'Source failures', 'فشل المصادر')}</dt><dd>{coverage?.sourceFailures == null ? '—' : formatCount(coverage.sourceFailures)}</dd></div>
                  <div><dt>{t(locale, 'Entry failures', 'فشل العناصر')}</dt><dd>{coverage?.entryFailures == null ? '—' : formatCount(coverage.entryFailures)}</dd></div>
                  <div><dt>{t(locale, 'Existence checked', 'فحص الوجود')}</dt><dd>{formatCount(coverage?.existenceChecked)}</dd></div>
                  <div><dt>{t(locale, 'Missing paths', 'مسارات مفقودة')}</dt><dd>{formatCount(coverage?.existenceMissing)}</dd></div>
                  <div><dt>{t(locale, 'Startup entries', 'مدخلات الإقلاع')}</dt><dd>{formatCount(coverage?.startupEntries)}</dd></div>
                  <div><dt>{t(locale, 'Observation', 'وقت القياس')}</dt><dd>{formatTimestamp(controller.inventory?.observedAt, locale)}</dd></div>
                  <div><dt>{t(locale, 'Duration', 'المدة')}</dt><dd>{controller.inventory ? `${formatCount(controller.inventory.durationMs)} ms` : '—'}</dd></div>
                </dl>
                {coverage?.truncated ? (
                  <p className="apps-note apps-note-warn"><AlertTriangle className="w-3 h-3 shrink-0" />{t(locale, 'The inventory was truncated at the safety cap.', 'تم اقتطاع الجرد عند الحد الآمن.')}</p>
                ) : null}
              </section>

              <section className="apps-subpanel">
                <h4>{t(locale, 'Top publishers', 'أبرز الناشرين')}</h4>
                <div className="apps-mini-table">
                  {publisherGroups.slice(0, 8).map((group) => (
                    <div key={group.publisher} className="apps-mini-row">
                      <span title={group.publisher}>{group.publisher}</span>
                      <span className="apps-mono">{formatCount(group.count)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {controller.inventory?.warnings?.length ? (
              <section className="apps-subpanel">
                <h4>{t(locale, 'Provider warnings', 'تحذيرات المزوّد')}</h4>
                <ul className="apps-warning-list">
                  {controller.inventory.warnings.map((warning) => (
                    <li key={warning}><Info className="w-3 h-3 shrink-0" />{warning}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        );
      }

      case 'app-identity': {
        const signature = identityApp ? controller.signatures[identityApp.id] || null : null;
        const status = signature?.status || identityApp?.signature.status || 'unchecked';
        return (
          <div className="apps-service-body">
            <div className="apps-inline-search">
              <Search className="w-3.5 h-3.5" />
              <input
                value={identityQuery}
                onChange={(event) => setIdentityQuery(event.target.value)}
                placeholder={t(locale, 'Find an application to verify…', 'ابحث عن تطبيق للتحقق منه…')}
                aria-label={t(locale, 'Find an application', 'البحث عن تطبيق')}
              />
              <span>{formatCount(identityMatches.length)}</span>
            </div>
            <div className="apps-identity-layout">
              <div className="apps-identity-list">
                {identityMatches.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className={identityApp?.id === app.id ? 'apps-identity-row apps-identity-row-active' : 'apps-identity-row'}
                    onClick={() => {
                      setIdentityAppId(app.id);
                      onSelectApp(app.id);
                    }}
                  >
                    <span title={app.name}>{app.name}</span>
                    <span className="apps-muted" title={app.publisher || ''}>{app.publisher || '—'}</span>
                  </button>
                ))}
              </div>

              <div className="apps-identity-detail">
                {identityApp ? (
                  <>
                    <div className="apps-identity-head">
                      <div className="min-w-0">
                        <h4 title={identityApp.name}>{identityApp.name}</h4>
                        <p>{identityApp.publisher || t(locale, 'Unknown publisher', 'ناشر غير معروف')} · {identityApp.version || '—'}</p>
                      </div>
                      <span className={`apps-sign apps-sign-${signatureTone(status)}`}>{signatureLabel(status, locale)}</span>
                    </div>
                    <button
                      type="button"
                      className="apps-btn apps-btn-primary"
                      onClick={() => void controller.verifySignature(identityApp.id)}
                      disabled={controller.signatureBusyId === identityApp.id}
                    >
                      <ShieldCheck className={`w-3.5 h-3.5 ${controller.signatureBusyId === identityApp.id ? 'animate-pulse' : ''}`} />
                      {controller.signatureBusyId === identityApp.id
                        ? t(locale, 'Verifying Authenticode…', 'جارٍ التحقق من Authenticode…')
                        : t(locale, 'Verify Authenticode signature', 'تحقق من توقيع Authenticode')}
                    </button>

                    {signature ? (
                      <div className="apps-identity-evidence">
                        <dl className="apps-service-dl">
                          <div><dt>{t(locale, 'Executable', 'الملف التنفيذي')}</dt><dd className="apps-mono break-all">{signature.executable || '—'}</dd></div>
                          <div><dt>{t(locale, 'Signer', 'الموقّع')}</dt><dd>{signature.signer || '—'}</dd></div>
                          <div><dt>{t(locale, 'Issuer', 'المُصدر')}</dt><dd>{signature.issuer || '—'}</dd></div>
                          <div><dt>{t(locale, 'Thumbprint', 'البصمة')}</dt><dd className="apps-mono break-all">{signature.thumbprint || '—'}</dd></div>
                          <div><dt>{t(locale, 'Valid from', 'صالحة من')}</dt><dd>{formatDate(signature.notBefore, locale)}</dd></div>
                          <div><dt>{t(locale, 'Valid to', 'صالحة إلى')}</dt><dd>{formatDate(signature.notAfter, locale)}</dd></div>
                          <div><dt>{t(locale, 'Checked', 'وقت الفحص')}</dt><dd>{formatTimestamp(signature.checkedAt, locale)}</dd></div>
                          <div><dt>{t(locale, 'Provider', 'المزوّد')}</dt><dd>{signature.provider}</dd></div>
                        </dl>
                        {signature.chain.length ? (
                          <div className="apps-cert-chain">
                            <h5>{t(locale, 'Certificate chain', 'سلسلة الشهادات')}</h5>
                            {signature.chain.map((element, index) => (
                              <div key={`${element.thumbprint}-${index}`} className="apps-cert-row">
                                <span className="apps-chain-index">{index + 1}</span>
                                <div className="min-w-0">
                                  <div className="apps-chain-subject">{element.subject}</div>
                                  <div className="apps-chain-issuer">{element.issuer}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <p className="apps-note apps-note-warn"><Info className="w-3 h-3 shrink-0" />{signature.note}</p>
                      </div>
                    ) : (
                      <p className="apps-note">
                        <ShieldQuestion className="w-3.5 h-3.5 shrink-0" />
                        {t(locale, 'No signature has been verified in this session. Inventory status is not a verdict.', 'لم يُتحقق من أي توقيع في هذه الجلسة. حالة الجرد ليست حكمًا.')}
                      </p>
                    )}
                  </>
                ) : (
                  <PanelEmpty
                    icon={<Fingerprint className="w-7 h-7 text-cyan-400" />}
                    title={t(locale, 'No application selected', 'لم يُحدد تطبيق')}
                    copy={t(locale, 'Search the measured register, then verify its Authenticode signature.', 'ابحث في السجل المقيس ثم تحقق من توقيع Authenticode.')}
                  />
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'app-search': {
        return (
          <div className="apps-service-body">
            <div className="apps-inline-search">
              <Search className="w-3.5 h-3.5" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t(locale, 'Query the measured register by any parameter…', 'استعلم من السجل المقيس بأي معيار…')}
                aria-label={t(locale, 'Search applications', 'البحث في التطبيقات')}
              />
              <span>{formatCount(searchMatches.length)} / {formatCount(apps.length)}</span>
            </div>
            <div className="apps-table-wrap apps-table-wrap-service">
              <table className="apps-table">
                <colgroup>
                  <col style={{ width: '36%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '16%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>{t(locale, 'Application', 'التطبيق')}</th>
                    <th>{t(locale, 'Publisher', 'الناشر')}</th>
                    <th>{t(locale, 'Version', 'الإصدار')}</th>
                    <th>{t(locale, 'Scope', 'النطاق')}</th>
                    <th className="apps-col-num" title={t(locale, 'Measured footprint', 'البصمة المقيسة')}>{t(locale, 'Size', 'الحجم')}</th>
                  </tr>
                </thead>
                <tbody>
                  {searchMatches.map((app) => (
                    <tr key={app.id} onClick={() => onSelectApp(app.id)} className={selectedApp?.id === app.id ? 'apps-row-selected' : undefined}>
                      <td><span className="apps-row-name" title={app.name}>{app.name}</span></td>
                      <td className="apps-muted apps-cell-clip" title={app.publisher || undefined}>{app.publisher || '—'}</td>
                      <td className="apps-mono apps-cell-clip" title={app.version || undefined}>{app.version || '—'}</td>
                      <td><span className="apps-tag apps-tag-muted">{scopeLabel(app.scope, locale)}</span></td>
                      <td className="apps-col-num apps-mono">{formatBytes(sizeOf(app))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!searchMatches.length ? (
                <div className="apps-empty">
                  <Search className="w-6 h-6 text-slate-500" />
                  <p>{t(locale, 'No measured record matches this query.', 'لا يوجد سجل مقيس يطابق هذا الاستعلام.')}</p>
                </div>
              ) : null}
            </div>
          </div>
        );
      }

      case 'app-publisher': {
        return (
          <div className="apps-service-body">
            <p className="apps-note">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              {t(
                locale,
                'Trust is derived only from signatures verified in this session. Publisher names alone are not a trust claim.',
                'تُشتق الثقة فقط من التواقيع التي تم التحقق منها في هذه الجلسة. أسماء الناشرين وحدها ليست ادعاء ثقة.'
              )}
            </p>
            <div className="apps-table-wrap apps-table-wrap-service">
              <table className="apps-table">
                <colgroup>
                  <col style={{ width: '36%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '17%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>{t(locale, 'Publisher', 'الناشر')}</th>
                    <th className="apps-col-num">{t(locale, 'Apps', 'التطبيقات')}</th>
                    <th className="apps-col-num">{t(locale, 'Verified', 'موثّق')}</th>
                    <th className="apps-col-num" title={t(locale, 'Invalid / unsigned', 'غير صالح / بدون توقيع')}>{t(locale, 'Unsigned', 'بلا توقيع')}</th>
                    <th className="apps-col-num">{t(locale, 'Unverified', 'غير مؤكد')}</th>
                    <th title={t(locale, 'Trust evidence', 'دليل الثقة')}>{t(locale, 'Trust', 'الثقة')}</th>
                  </tr>
                </thead>
                <tbody>
                  {publisherGroups.slice(0, 200).map((group) => (
                    <tr key={group.publisher}>
                      <td><span className="apps-row-name" title={group.publisher}>{group.publisher}</span></td>
                      <td className="apps-col-num apps-mono">{formatCount(group.count)}</td>
                      <td className="apps-col-num apps-mono text-emerald-400">{formatCount(group.verified)}</td>
                      <td className="apps-col-num apps-mono text-rose-400">{formatCount(group.invalid)}</td>
                      <td className="apps-col-num apps-mono text-slate-400">{formatCount(group.unchecked)}</td>
                      <td>
                        <span className={`apps-tag ${group.trust === 'verified' ? 'apps-tag-good' : group.trust === 'mixed' ? 'apps-tag-warn' : 'apps-tag-muted'}`}>
                          {group.trust === 'verified'
                            ? t(locale, 'ALL VERIFIED', 'كلها موثقة')
                            : group.trust === 'mixed'
                              ? t(locale, 'MIXED', 'مختلطة')
                              : t(locale, 'UNVERIFIED', 'غير مؤكدة')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="apps-note apps-note-warn">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {t(locale, 'No reputation score is synthesized. Verify individual apps in the Identity workspace.', 'لا يتم توليد درجة سمعة. تحقق من التطبيقات فرديًا في مساحة الهوية.')}
            </p>
          </div>
        );
      }

      case 'app-recent': {
        return (
          <div className="apps-service-body">
            <div className="apps-service-toolbar">
              <div className="apps-segmented">
                {([30, 90, 'all'] as const).map((range) => (
                  <button
                    key={String(range)}
                    type="button"
                    onClick={() => setRecentRange(range)}
                    className={recentRange === range ? 'active' : undefined}
                  >
                    {range === 'all' ? t(locale, 'All dated', 'كل المؤرخة') : t(locale, `${range} days`, `${range} يومًا`)}
                  </button>
                ))}
              </div>
              <span className="apps-chip">{formatCount(recent.length)} {t(locale, 'records', 'سجل')}</span>
            </div>
            <p className="apps-note">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {t(
                locale,
                'Only registry InstallDate is measured. Update or modification history is not tracked and is never inferred.',
                'يُقاس فقط تاريخ التثبيت في السجل. سجل التحديث أو التعديل غير متتبع ولا يُستنتج أبدًا.'
              )}
            </p>
            <div className="apps-table-wrap apps-table-wrap-service">
              <table className="apps-table">
                <colgroup>
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '34%' }} />
                  <col style={{ width: '23%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>{t(locale, 'Install date', 'تاريخ التثبيت')}</th>
                    <th>{t(locale, 'Application', 'التطبيق')}</th>
                    <th>{t(locale, 'Publisher', 'الناشر')}</th>
                    <th>{t(locale, 'Version', 'الإصدار')}</th>
                    <th>{t(locale, 'Source', 'المصدر')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((app) => (
                    <tr key={app.id} onClick={() => onSelectApp(app.id)}>
                      <td className="apps-mono apps-cell-clip">{formatDate(app.installDate, locale)}</td>
                      <td><span className="apps-row-name" title={app.name}>{app.name}</span></td>
                      <td className="apps-muted apps-cell-clip" title={app.publisher || undefined}>{app.publisher || '—'}</td>
                      <td className="apps-mono apps-cell-clip" title={app.version || undefined}>{app.version || '—'}</td>
                      <td className="apps-muted apps-cell-clip">{app.source === 'appx-msix' ? 'Appx/MSIX' : t(locale, 'Registry', 'السجل')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!recent.length ? (
                <div className="apps-empty">
                  <Clock className="w-6 h-6 text-slate-500" />
                  <p>{t(locale, 'No measured install dates fall in this range.', 'لا توجد تواريخ تثبيت مقيسة ضمن هذا النطاق.')}</p>
                </div>
              ) : null}
            </div>
          </div>
        );
      }

      case 'app-uninstall-queue': {
        return (
          <div className="apps-service-body">
            <div className="apps-gate-banner">
              <Lock className="w-5 h-5 shrink-0" />
              <div>
                <strong>{t(locale, 'Execution is blocked — Mission 08', 'التنفيذ محجوب — المهمة 08')}</strong>
                <p>
                  {t(
                    locale,
                    'This workspace builds an immutable, non-executable review plan. This domain build ships no uninstall IPC, elevation or file/registry write; execution stays gated to Mission 08.',
                    'تنشئ هذه المساحة خطة مراجعة ثابتة غير قابلة للتنفيذ. لا تشحن هذه النسخة أي قناة إزالة أو رفع صلاحيات أو كتابة ملفات/سجل؛ ويبقى التنفيذ محجوبًا حتى المهمة 08.'
                  )}
                </p>
              </div>
            </div>

            <div className="apps-service-toolbar">
              <div>
                <span className="apps-chip">{formatCount(queueApps.length)} {t(locale, 'selected for review', 'محدد للمراجعة')}</span>
              </div>
              <button
                type="button"
                className="apps-btn apps-btn-primary"
                onClick={() => void buildQueuePlan()}
                disabled={!queueApps.length || controller.planBusy}
              >
                <ListChecks className="w-3.5 h-3.5" />
                {controller.planBusy ? t(locale, 'Building…', 'جارٍ البناء…') : t(locale, 'Build immutable review plan', 'بناء خطة مراجعة ثابتة')}
              </button>
            </div>

            {queueApps.length ? (
              <div className="apps-queue-list">
                {queueApps.map((app) => (
                  <div key={app.id} className="apps-queue-row">
                    <div className="min-w-0">
                      <div className="apps-row-name" title={app.name}>{app.name}</div>
                      <div className="apps-row-publisher">{app.publisher || '—'} · {app.version || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.protected ? <span className="apps-tag apps-tag-protected">{t(locale, 'PROTECTED', 'محمي')}</span> : null}
                      {app.startup.linked ? <span className="apps-tag apps-tag-startup">{t(locale, 'STARTUP', 'إقلاع')}</span> : null}
                      <span className="apps-mono text-[10px] text-slate-400">{formatBytes(sizeOf(app))}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <PanelEmpty
                icon={<ListChecks className="w-7 h-7 text-rose-400" />}
                title={t(locale, 'Nothing selected', 'لا شيء محدد')}
                copy={t(locale, 'Tick applications in the register or open one dossier to add it to a review plan.', 'حدد تطبيقات في السجل أو افتح ملف تطبيق لإضافته إلى خطة المراجعة.')}
              />
            )}

            {controller.plan ? (
              <section className="apps-plan-preview">
                <div className="apps-block-head">
                  <ListChecks className="w-3.5 h-3.5 text-rose-400" />
                  <h4>{t(locale, 'Immutable plan preview', 'معاينة خطة ثابتة')}</h4>
                  <span className="apps-tag apps-tag-muted">{controller.plan.planId.slice(0, 12)}</span>
                </div>
                <div className="apps-service-kpis">
                  <MiniKpi label={t(locale, 'Items', 'العناصر')} value={formatCount(controller.plan.totals.count)} />
                  <MiniKpi label={t(locale, 'Blocked', 'محجوبة')} value={formatCount(controller.plan.totals.blocked)} tone={controller.plan.totals.blocked ? 'bad' : 'good'} />
                  <MiniKpi label={t(locale, 'Reclaim evidence', 'دليل الاستعادة')} value={formatBytes(controller.plan.totals.reclaimBytes)} />
                  <MiniKpi label={t(locale, 'Reclaim source', 'مصدر الدليل')} value={controller.plan.totals.reclaimSource} />
                </div>
                <div className="apps-plan-items">
                  {controller.plan.items.map((item) => (
                    <div key={item.appId} className="apps-plan-item">
                      <div className="flex items-center justify-between gap-2">
                        <span className="apps-row-name">{item.name}</span>
                        <span className={`apps-tag ${item.risk === 'blocked' ? 'apps-tag-protected' : item.risk === 'high' ? 'apps-tag-warn' : 'apps-tag-muted'}`}>
                          {item.risk.toUpperCase()}
                        </span>
                      </div>
                      <ul>
                        {item.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                      </ul>
                      <div className="apps-plan-item-foot">
                        <span>{t(locale, 'Reclaim', 'الاستعادة')}: {formatBytes(item.reclaimBytes)} ({item.reclaimSource})</span>
                        <span>{t(locale, 'Reversible', 'قابل للتراجع')}: {t(locale, 'No', 'لا')}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="apps-note apps-note-warn">
                  <Info className="w-3 h-3 shrink-0" />
                  {controller.plan.execution.reason} {controller.plan.restorePoint.reason}
                </p>
                <div className="flex justify-end">
                  <button type="button" className="apps-btn" onClick={onOpenPlan}>
                    <Lock className="w-3.5 h-3.5" />
                    {t(locale, 'Open approval gate', 'فتح بوابة الموافقة')}
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        );
      }

      case 'app-leftovers': {
        return (
          <div className="apps-service-body">
            <div className="apps-service-toolbar">
              <div>
                <span className="apps-chip">{t(locale, 'mutation none', 'دون تغيير')}</span>
                <span className="apps-chip">{t(locale, 'candidates only', 'مرشحات فقط')}</span>
              </div>
              <button
                type="button"
                className="apps-btn apps-btn-primary"
                onClick={() => void controller.loadLeftovers()}
                disabled={controller.leftoversBusy}
              >
                <ScanLine className={`w-3.5 h-3.5 ${controller.leftoversBusy ? 'animate-pulse' : ''}`} />
                {controller.leftoversBusy
                  ? t(locale, 'Reading bounded folders…', 'جارٍ قراءة مجلدات محدودة…')
                  : t(locale, 'Measure leftover candidates', 'قياس مرشحات البقايا')}
              </button>
            </div>

            {controller.leftovers ? (
              <>
                <div className="apps-service-kpis">
                  <MiniKpi label={t(locale, 'Stale registrations', 'تسجيلات قديمة')} value={formatCount(controller.leftovers.staleCount)} tone="warn" />
                  <MiniKpi label={t(locale, 'AppData name candidates', 'مرشحات أسماء AppData')} value={formatCount(controller.leftovers.candidateCount)} />
                  <MiniKpi label={t(locale, 'Scanned roots', 'الجذور المفحوصة')} value={formatCount(controller.leftovers.scannedRoots.length)} />
                  <MiniKpi
                    label={t(locale, 'Observed at', 'وقت القياس')}
                    value={formatClock(controller.leftovers.observedAt, locale)}
                    title={formatTimestamp(controller.leftovers.observedAt, locale)}
                  />
                </div>
                <div className="apps-table-wrap apps-table-wrap-service">
                  <table className="apps-table">
                    <colgroup>
                      <col style={{ width: '32%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '38%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>{t(locale, 'Candidate', 'المرشح')}</th>
                        <th>{t(locale, 'Kind', 'النوع')}</th>
                        <th title={t(locale, 'Confidence', 'الثقة')}>{t(locale, 'Conf.', 'الثقة')}</th>
                        <th>{t(locale, 'Evidence', 'الدليل')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {controller.leftovers.candidates.map((candidate) => (
                        <tr key={candidate.id}>
                          <td>
                            <span className="apps-row-name" title={candidate.label}>{candidate.label}</span>
                            <span className="apps-mono apps-cell-clip block text-[9px] text-slate-500" title={candidate.path}>{candidate.path}</span>
                          </td>
                          <td className="apps-muted"><span className="apps-cell-clamp">{candidate.kind === 'stale-registration' ? t(locale, 'Stale registration', 'تسجيل قديم') : t(locale, 'AppData folder', 'مجلد AppData')}</span></td>
                          <td><span className={`apps-tag ${candidate.confidence === 'medium' ? 'apps-tag-warn' : 'apps-tag-muted'}`}>{candidate.confidence.toUpperCase()}</span></td>
                          <td className="apps-muted text-[10px]"><span className="apps-cell-clamp" title={candidate.reason}>{candidate.reason}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!controller.leftovers.candidates.length ? (
                    <div className="apps-empty">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      <p>{t(locale, 'No leftover candidates were measured in the bounded roots.', 'لم تُقس أي مرشحات بقايا في الجذور المحدودة.')}</p>
                    </div>
                  ) : null}
                </div>
                <div className="apps-service-grid-2">
                  <section className="apps-subpanel">
                    <h4>{t(locale, 'Bounded roots', 'الجذور المحدودة')}</h4>
                    <div className="apps-mini-table">
                      {controller.leftovers.scannedRoots.map((root) => (
                        <div key={root.root} className="apps-mini-row">
                          <span>{root.root}{root.truncated ? ` · ${t(locale, 'truncated', 'مقتطع')}` : ''}</span>
                          <span className="apps-mono">{formatCount(root.entries)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="apps-subpanel">
                    <h4>{t(locale, 'Safety statement', 'بيان السلامة')}</h4>
                    <ul className="apps-warning-list">
                      {controller.leftovers.warnings.map((warning) => (
                        <li key={warning}><ShieldAlert className="w-3 h-3 shrink-0" />{warning}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              </>
            ) : (
              <PanelEmpty
                icon={<FolderSearch className="w-7 h-7 text-amber-400" />}
                title={t(locale, 'Leftovers are not measured yet', 'لم تُقس البقايا بعد')}
                copy={t(locale, 'Press measure to sample name matches and stale registrations. A name match is evidence, never proof of orphanhood.', 'اضغط قياس لأخذ عينة مطابقات الأسماء والتسجيلات القديمة. مطابقة الاسم دليل وليست إثباتًا لليتم.')}
              />
            )}
          </div>
        );
      }

      case 'app-updates': {
        const updates = controller.updates;
        return (
          <div className="apps-service-body">
            <div className="apps-gate-banner">
              <Lock className="w-5 h-5 shrink-0" />
              <div>
                <strong>{t(locale, 'Install and update execution is blocked — Mission 11', 'تنفيذ التثبيت والتحديث محجوب — المهمة 11')}</strong>
                <p>
                  {t(
                    locale,
                    'WinGet is invoked read-only. Source agreements are never accepted automatically and no installer is run.',
                    'يُستدعى WinGet للقراءة فقط. لا تُقبل اتفاقيات المصدر تلقائيًا ولا يُشغّل أي مثبّت.'
                  )}
                </p>
              </div>
            </div>

            <div className="apps-service-toolbar">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="apps-chip">{t(locale, 'WinGet', 'WinGet')}: {updates ? (updates.installed ? updates.version || t(locale, 'installed', 'مثبت') : t(locale, 'not found', 'غير موجود')) : '—'}</span>
                <span className="apps-chip">{t(locale, 'status', 'الحالة')}: {updateStatusLabel(updates, locale)}</span>
              </div>
              <button
                type="button"
                className="apps-btn apps-btn-primary"
                onClick={() => void controller.checkUpdates()}
                disabled={controller.updatesBusy}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${controller.updatesBusy ? 'animate-spin' : ''}`} />
                {controller.updatesBusy
                  ? t(locale, 'Querying WinGet (bounded)…', 'جارٍ استعلام WinGet (محدود)…')
                  : t(locale, 'Check update feeds', 'فحص مصادر التحديث')}
              </button>
            </div>

            {updates ? (
              <>
                <p className="apps-note"><Info className="w-3.5 h-3.5 shrink-0" />{updates.note}</p>
                {updates.items.length ? (
                  <div className="apps-table-wrap apps-table-wrap-service">
                    <table className="apps-table">
                      <colgroup>
                        <col style={{ width: '42%' }} />
                        <col style={{ width: '17%' }} />
                        <col style={{ width: '17%' }} />
                        <col style={{ width: '24%' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>{t(locale, 'Application', 'التطبيق')}</th>
                          <th>{t(locale, 'Current', 'الحالي')}</th>
                          <th>{t(locale, 'Available', 'المتاح')}</th>
                          <th>{t(locale, 'Source', 'المصدر')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {updates.items.map((item) => (
                          <tr key={`${item.id}-${item.available}`}>
                            <td>
                              <span className="apps-row-name" title={item.name}>{item.name}</span>
                              <span className="apps-mono apps-cell-clip block text-[9px] text-slate-500" title={item.id}>{item.id}</span>
                            </td>
                            <td className="apps-mono apps-cell-clip" title={item.current || undefined}>{item.current || '—'}</td>
                            <td className="apps-mono apps-cell-clip text-cyan-300" title={item.available || undefined}>{item.available || '—'}</td>
                            <td className="apps-muted apps-cell-clip" title={item.source || undefined}>{item.source || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <PanelEmpty
                    icon={<RefreshCw className="w-7 h-7 text-cyan-400" />}
                    title={
                      updates.status === 'available'
                        ? t(locale, 'No upgrades were reported by WinGet', 'لم يُبلغ WinGet عن أي ترقيات')
                        : t(locale, 'No measured update list', 'لا توجد قائمة تحديثات مقيسة')
                    }
                    copy={updates.note}
                  />
                )}
              </>
            ) : (
              <PanelEmpty
                icon={<RefreshCw className="w-7 h-7 text-cyan-400" />}
                title={t(locale, 'Update feeds are queried on demand', 'تُستعلم مصادر التحديث عند الطلب')}
                copy={t(locale, 'Mission 05 never queries the network or WinGet during page load. Press check to run a bounded read.', 'لا تستعلم المهمة 05 الشبكة أو WinGet عند تحميل الصفحة. اضغط فحص لتشغيل قراءة محدودة.')}
              />
            )}
          </div>
        );
      }

      case 'app-size': {
        return (
          <div className="apps-service-body">
            <p className="apps-note">
              <HardDrive className="w-3.5 h-3.5 shrink-0" />
              {t(
                locale,
                'Measurement walks install folders only, skips reparse points and enforces entry/depth/time budgets. Reported sizes stay separate.',
                'يقيس مجلدات التثبيت فقط، ويتجاوز نقاط إعادة التحليل، ويفرض ميزانيات على العناصر والعمق والوقت. الأحجام المبلغة تبقى منفصلة.'
              )}
            </p>

            <div className="apps-service-toolbar">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="apps-chip">{formatCount(sizeIds.length)} / 40 {t(locale, 'selected', 'محدد')}</span>
                {controller.sizesStatus ? (
                  <span className="apps-chip">
                    {controller.sizesStatus.running
                      ? t(locale, 'measuring', 'جارٍ القياس')
                      : `${formatCount(controller.sizesStatus.measured)} / ${formatCount(controller.sizesStatus.requested)}`}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="apps-btn"
                  onClick={() => setSizeIds(selectedIds.length ? selectedIds : selectedApp ? [selectedApp.id] : [])}
                >
                  {t(locale, 'Use current selection', 'استخدام التحديد الحالي')}
                </button>
                <button
                  type="button"
                  className="apps-btn"
                  onClick={() => setSizeIds(sizeCandidates.slice(0, 8).map((app) => app.id))}
                >
                  {t(locale, 'Top 8 reported', 'أعلى 8 مبلغة')}
                </button>
                {controller.sizesBusy ? (
                  <button type="button" className="apps-btn apps-btn-danger" onClick={() => void controller.cancelSizes()}>
                    <X className="w-3.5 h-3.5" />
                    {t(locale, 'Cancel measurement', 'إلغاء القياس')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="apps-btn apps-btn-primary"
                    onClick={() => void controller.measureSizes(sizeIds)}
                    disabled={!sizeIds.length}
                  >
                    <PlayIcon />
                    {t(locale, 'Measure selected', 'قياس المحدد')}
                  </button>
                )}
              </div>
            </div>

            <div className="apps-size-layout">
              <div className="apps-size-picker">
                <h4>{t(locale, 'Measurable applications', 'تطبيقات قابلة للقياس')}</h4>
                <p className="apps-muted text-[9px]">{t(locale, 'Only records with a registered install location.', 'فقط السجلات التي لها مسار تثبيت مسجل.')}</p>
                <div className="apps-size-picker-list">
                  {sizeCandidates.map((app) => (
                    <label key={app.id} className="apps-check-row">
                      <input
                        type="checkbox"
                        checked={sizeIds.includes(app.id)}
                        onChange={() => toggleSizeId(app.id)}
                      />
                      <span className="min-w-0 flex-1" title={app.name}>{app.name}</span>
                      <span className="apps-mono text-[9px] text-slate-500">{formatBytes(sizeOf(app))}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="apps-size-results">
                {controller.sizesStatus?.warnings?.length ? (
                  <ul className="apps-warning-list">
                    {controller.sizesStatus.warnings.map((warning) => (
                      <li key={warning}><Info className="w-3 h-3 shrink-0" />{warning}</li>
                    ))}
                  </ul>
                ) : null}
                {sizeResults.length ? (
                  <div className="apps-size-result-list">
                    {sizeResults.map(({ app, result }) => (
                      <div key={app.id} className="apps-size-result">
                        <div className="flex items-start justify-between gap-2">
                          <span className="apps-row-name min-w-0" title={app.name}>{app.name}</span>
                          <span className="apps-mono text-[10px] text-emerald-300">{formatBytes(result?.measuredBytes ?? app.size.measuredBytes)}</span>
                        </div>
                        <div className="apps-size-bar">
                          <span
                            style={{
                              width: `${Math.max(
                                2,
                                Math.min(
                                  100,
                                  ((result?.measuredBytes ?? app.size.measuredBytes ?? 0) /
                                    Math.max(1, ...sizeResults.map((entry) => entry.result?.measuredBytes ?? entry.app.size.measuredBytes ?? 0))) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="apps-size-result-meta">
                          <span>{t(locale, 'reported', 'مبلّغ')}: {formatBytes(result?.reportedBytes ?? app.size.reportedBytes)}</span>
                          <span>{t(locale, 'files', 'ملفات')}: {result ? formatCount(result.files) : app.size.filesMeasured == null ? '—' : formatCount(app.size.filesMeasured)}</span>
                          {result?.partial ? <span className="text-amber-300">{t(locale, 'partial', 'جزئي')}</span> : null}
                        </div>
                        {result?.topFolders?.length ? (
                          <div className="apps-size-folders">
                            {result.topFolders.slice(0, 3).map((folder) => (
                              <span key={folder.name} title={folder.name}>{folder.name} · {formatBytes(folder.bytes)}</span>
                            ))}
                          </div>
                        ) : null}
                        {result?.reason ? <p className="apps-note apps-note-warn mt-1">{result.reason}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <PanelEmpty
                    icon={<Database className="w-7 h-7 text-emerald-400" />}
                    title={t(locale, 'No footprint measured in this session', 'لم تُقس أي بصمة في هذه الجلسة')}
                    copy={t(locale, 'Select up to 40 applications, then run a bounded measurement. Reported registry sizes remain visible in the register.', 'حدد حتى 40 تطبيقًا ثم شغّل قياسًا محدودًا. تبقى الأحجام المبلغة في السجل مرئية.')}
                  />
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'app-store-packages': {
        const packages = controller.packages;
        return (
          <div className="apps-service-body">
            <div className="apps-service-toolbar">
              <div className="apps-segmented">
                <button type="button" className={packagesTab === 'installed' ? 'active' : undefined} onClick={() => setPackagesTab('installed')}>
                  {t(locale, 'WinGet installed', 'مثبت عبر WinGet')}
                </button>
                <button type="button" className={packagesTab === 'discover' ? 'active' : undefined} onClick={() => setPackagesTab('discover')}>
                  {t(locale, 'Discover repository', 'استكشاف المستودع')}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {packagesTab === 'discover' ? (
                  <label className="apps-inline-input">
                    <Search className="w-3.5 h-3.5" />
                    <input
                      value={packagesQuery}
                      onChange={(event) => setPackagesQuery(event.target.value)}
                      placeholder={t(locale, 'Package query…', 'استعلام الحزمة…')}
                      aria-label={t(locale, 'Search WinGet packages', 'البحث في حزم WinGet')}
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  className="apps-btn apps-btn-primary"
                  onClick={() => void controller.loadPackages(packagesTab, packagesTab === 'discover' ? packagesQuery : undefined)}
                  disabled={controller.packagesBusy || (packagesTab === 'discover' && packagesQuery.trim().length < 2)}
                >
                  <Package className={`w-3.5 h-3.5 ${controller.packagesBusy ? 'animate-pulse' : ''}`} />
                  {controller.packagesBusy ? t(locale, 'Reading…', 'جارٍ القراءة…') : t(locale, 'Read package list', 'قراءة قائمة الحزم')}
                </button>
              </div>
            </div>

            <div className="apps-service-kpis">
              <MiniKpi label={t(locale, 'Measured Appx/MSIX records', 'سجلات Appx/MSIX المقيسة')} value={formatCount(kpis?.packaged)} />
              <MiniKpi label={t(locale, 'WinGet', 'WinGet')} value={packages ? (packages.installed ? packages.version || t(locale, 'installed', 'مثبت') : t(locale, 'not found', 'غير موجود')) : '—'} />
              <MiniKpi label={t(locale, 'Package rows', 'صفوف الحزم')} value={packages ? formatCount(packages.packages.length) : '—'} />
              <MiniKpi label={t(locale, 'Status', 'الحالة')} value={packages ? packages.status : t(locale, 'not queried', 'لم يُستعلم')} />
            </div>

            <p className="apps-note">
              <Info className="w-3.5 h-3.5 shrink-0" />
              {packages?.note || t(locale, 'Installed Appx/MSIX records are already measured in the register. WinGet repository discovery runs only on demand.', 'سجلات Appx/MSIX المثبتة مقيسة بالفعل في السجل. استكشاف مستودع WinGet يعمل عند الطلب فقط.')}
            </p>

            {packages?.packages.length ? (
              <div className="apps-table-wrap apps-table-wrap-service">
                <table className="apps-table">
                  <colgroup>
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '27%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '21%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>{t(locale, 'Package', 'الحزمة')}</th>
                      <th>{t(locale, 'Identifier', 'المعرّف')}</th>
                      <th>{t(locale, 'Version', 'الإصدار')}</th>
                      <th>{t(locale, 'Source', 'المصدر')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.packages.map((entry) => (
                      <tr key={`${entry.id}-${entry.version}`}>
                        <td><span className="apps-row-name" title={entry.name}>{entry.name}</span></td>
                        <td className="apps-mono apps-cell-clip text-[10px]" title={entry.id}>{entry.id}</td>
                        <td className="apps-mono apps-cell-clip" title={entry.version || undefined}>{entry.version || '—'}</td>
                        <td className="apps-muted apps-cell-clip" title={entry.source || undefined}>{entry.source || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <PanelEmpty
                icon={<Box className="w-7 h-7 text-yellow-400" />}
                title={t(locale, 'Package rows are read on demand', 'تُقرأ صفوف الحزم عند الطلب')}
                copy={t(locale, 'No automatic install or source agreement. Install execution is gated to Mission 11.', 'لا تثبيت تلقائي ولا قبول لاتفاقية مصدر. تنفيذ التثبيت محجوب للمهمة 11.')}
              />
            )}
          </div>
        );
      }

      case 'app-associations': {
        const associations = controller.associations;
        const conflicts = associations
          ? [...associations.extensions, ...associations.protocols].filter((entry) => entry.conflict).length
          : null;
        return (
          <div className="apps-service-body">
            <div className="apps-service-toolbar">
              <div className="apps-segmented">
                <button type="button" className={assocTab === 'extension' ? 'active' : undefined} onClick={() => setAssocTab('extension')}>
                  {t(locale, 'Extensions', 'الامتدادات')}
                </button>
                <button type="button" className={assocTab === 'protocol' ? 'active' : undefined} onClick={() => setAssocTab('protocol')}>
                  {t(locale, 'Protocols', 'البروتوكولات')}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="apps-btn" onClick={() => void controller.openSettings('defaultapps')}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t(locale, 'Open Windows Default Apps', 'فتح التطبيقات الافتراضية في ويندوز')}
                </button>
                <button
                  type="button"
                  className="apps-btn apps-btn-primary"
                  onClick={() => void controller.loadAssociations()}
                  disabled={controller.associationsBusy}
                >
                  <Link2 className={`w-3.5 h-3.5 ${controller.associationsBusy ? 'animate-pulse' : ''}`} />
                  {controller.associationsBusy ? t(locale, 'Sampling registry…', 'جارٍ أخذ عينة السجل…') : t(locale, 'Read bounded sample', 'قراءة عينة محدودة')}
                </button>
              </div>
            </div>

            <div className="apps-service-kpis">
              <MiniKpi label={t(locale, 'Extensions sampled', 'امتدادات في العينة')} value={associations ? formatCount(associations.extensions.length) : '—'} />
              <MiniKpi label={t(locale, 'Protocols sampled', 'بروتوكولات في العينة')} value={associations ? formatCount(associations.protocols.length) : '—'} />
              <MiniKpi label={t(locale, 'UserChoice conflicts', 'تعارضات UserChoice')} value={conflicts == null ? '—' : formatCount(conflicts)} tone={conflicts ? 'warn' : 'good'} />
              <MiniKpi label={t(locale, 'Registry writes', 'كتابات السجل')} value="0" tone="good" />
            </div>

            <div className="apps-gate-banner">
              <Lock className="w-5 h-5 shrink-0" />
              <div>
                <strong>{t(locale, 'Association write is blocked — Mission 14', 'كتابة الارتباط محجوبة — المهمة 14')}</strong>
                <p>{t(locale, 'Windows protects UserChoice. This workspace samples evidence and hands off to Settings; it never writes the association hash.', 'يحمي ويندوز UserChoice. تأخذ هذه المساحة عينة من الأدلة وتنتقل للإعدادات؛ ولا تكتب تجزئة الارتباط أبدًا.')}</p>
              </div>
            </div>

            {associations ? (
              <>
                <div className="apps-inline-search">
                  <Search className="w-3.5 h-3.5" />
                  <input
                    value={assocQuery}
                    onChange={(event) => setAssocQuery(event.target.value)}
                    placeholder={t(locale, 'Filter sampled associations…', 'تصفية الارتباطات في العينة…')}
                    aria-label={t(locale, 'Filter associations', 'تصفية الارتباطات')}
                  />
                  <span>{formatCount(assocRows.length)}</span>
                </div>
                <div className="apps-table-wrap apps-table-wrap-service">
                  <table className="apps-table">
                    <colgroup>
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>{t(locale, 'Key', 'المفتاح')}</th>
                        <th title={t(locale, 'Registered handler', 'المعالج المسجل')}>{t(locale, 'Handler', 'المعالج')}</th>
                        <th>{t(locale, 'UserChoice', 'اختيار المستخدم')}</th>
                        <th title={t(locale, 'Executable command', 'الملف التنفيذي')}>{t(locale, 'Exe', 'التنفيذي')}</th>
                        <th>{t(locale, 'State', 'الحالة')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assocRows.map((entry) => (
                        <tr key={`${entry.kind}-${entry.key}`}>
                          <td className="apps-mono apps-cell-clip" title={entry.key}>{entry.key}</td>
                          <td className="apps-muted text-[10px]"><span className="apps-cell-clamp" title={entry.handlerName || entry.progId || undefined}>{entry.handlerName || entry.progId || '—'}</span></td>
                          <td className="apps-muted text-[10px]"><span className="apps-cell-clamp" title={entry.userChoice || undefined}>{entry.userChoice || '—'}</span></td>
                          <td className="apps-mono text-[10px]"><span className="apps-cell-clamp" title={entry.commandExe || undefined}>{entry.commandExe || '—'}</span></td>
                          <td>
                            <span className={`apps-tag ${entry.conflict ? 'apps-tag-warn' : 'apps-tag-muted'}`}>
                              {entry.conflict ? t(locale, 'CONFLICT', 'تعارض') : t(locale, 'SAMPLED', 'عينة')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="apps-warning-list">
                  {associations.warnings.map((warning) => <li key={warning}><Info className="w-3 h-3 shrink-0" />{warning}</li>)}
                </ul>
              </>
            ) : (
              <PanelEmpty
                icon={<Link2 className="w-7 h-7 text-indigo-400" />}
                title={t(locale, 'Associations are not sampled yet', 'لم تُؤخذ عينة الارتباطات بعد')}
                copy={t(locale, 'Read a bounded HKCR/UserChoice sample. The official Settings handoff is the only way to change a default.', 'اقرأ عينة محدودة من HKCR/UserChoice. الانتقال الرسمي للإعدادات هو الطريقة الوحيدة لتغيير الافتراضي.')}
              />
            )}
          </div>
        );
      }

      case 'app-startup-impact': {
        return (
          <div className="apps-service-body">
            <div className="apps-gate-banner">
              <Lock className="w-5 h-5 shrink-0" />
              <div>
                <strong>{t(locale, 'Startup mutation is blocked — Mission 09', 'تغيير الإقلاع محجوب — المهمة 09')}</strong>
                <p>{t(locale, 'Only measured Win32_StartupCommand linkage is shown. Boot seconds are not measured and are never invented.', 'يُعرض فقط ارتباط Win32_StartupCommand المقيس. ثواني الإقلاع غير مقيسة ولا تُختلق أبدًا.')}</p>
              </div>
            </div>

            <div className="apps-service-kpis">
              <MiniKpi label={t(locale, 'Startup-linked apps', 'تطبيقات مرتبطة بالإقلاع')} value={formatCount(kpis?.startupLinked)} />
              <MiniKpi label={t(locale, 'Startup entries', 'مدخلات الإقلاع')} value={formatCount(kpis?.startupEntries)} />
              <MiniKpi label={t(locale, 'Boot seconds', 'ثواني الإقلاع')} value={t(locale, 'not measured', 'غير مقيسة')} tone="warn" />
              <MiniKpi label={t(locale, 'Writes', 'كتابات')} value="0" tone="good" />
            </div>

            <div className="apps-inline-search">
              <Search className="w-3.5 h-3.5" />
              <input
                value={startupQuery}
                onChange={(event) => setStartupQuery(event.target.value)}
                placeholder={t(locale, 'Filter measured startup entries…', 'تصفية مدخلات الإقلاع المقيسة…')}
                aria-label={t(locale, 'Filter startup entries', 'تصفية مدخلات الإقلاع')}
              />
              <span>{formatCount(startupRows.length)}</span>
            </div>

            <div className="apps-table-wrap apps-table-wrap-service">
              <table className="apps-table">
                <colgroup>
                  <col style={{ width: '21%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '14%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>{t(locale, 'Entry', 'المدخل')}</th>
                    <th>{t(locale, 'Source', 'المصدر')}</th>
                    <th title={t(locale, 'Executable command', 'الملف التنفيذي')}>{t(locale, 'Exe', 'التنفيذي')}</th>
                    <th title={t(locale, 'Linked application', 'التطبيق المرتبط')}>{t(locale, 'Linked app', 'التطبيق')}</th>
                    <th title={t(locale, 'Key writable', 'المفتاح قابل للكتابة')}>{t(locale, 'Writable', 'الكتابة')}</th>
                    <th title={t(locale, 'Boot seconds', 'ثواني الإقلاع')}>{t(locale, 'Boot s', 'الإقلاع')}</th>
                  </tr>
                </thead>
                <tbody>
                  {startupRows.map((entry) => (
                    <tr key={entry.id}>
                      <td><span className="apps-row-name" title={entry.name}>{entry.name}</span></td>
                      <td className="apps-muted"><span className="apps-cell-clamp">{startupSourceLabel(entry.source, locale)}</span></td>
                      <td className="apps-mono text-[10px]"><span className="apps-cell-clamp" title={entry.executable || undefined}>{entry.executable || '—'}</span></td>
                      <td className="apps-muted"><span className="apps-cell-clamp" title={entry.linkedAppName || undefined}>{entry.linkedAppName || '—'}</span></td>
                      <td>
                        <span className={`apps-tag ${entry.writable ? 'apps-tag-warn' : 'apps-tag-muted'}`}>
                          {entry.writable ? t(locale, 'YES', 'نعم') : t(locale, 'NO', 'لا')}
                        </span>
                      </td>
                      <td className="apps-muted"><span className="apps-cell-clamp">{t(locale, 'not measured', 'غير مقيسة')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!startupRows.length ? (
                <div className="apps-empty">
                  <Zap className="w-6 h-6 text-orange-400" />
                  <p>{t(locale, 'No measured startup entry matches this filter.', 'لا يوجد مدخل إقلاع مقيس يطابق هذه التصفية.')}</p>
                </div>
              ) : null}
            </div>

            <p className="apps-note apps-note-warn">
              <Info className="w-3 h-3 shrink-0" />
              {t(locale, 'Writable is registry evidence only, not a recommendation. No toggle or policy write exists in this mission.', 'قابلية الكتابة دليل سجل فقط وليست توصية. لا يوجد مفتاح تبديل أو كتابة سياسة في هذه المهمة.')}
            </p>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (!meta) return null;

  if (embedded) {
    return (
      <div data-testid="app-service-focus" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`apps-state apps-state-${capability?.state || 'partial'}`}>{serviceStateLabel(capability?.state || 'partial', locale)}</span>
          <span className="apps-chip">{t(locale, 'provider', 'المزوّد')}: {capability?.provider || 'ApplicationsBridge'}</span>
        </div>
        <p className="apps-note">{serviceDescription(service, locale)}</p>
        {renderPanel()}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-[#173866] pt-2">
          <span className="apps-chip apps-chip-good"><ShieldCheck className="w-3 h-3" />{t(locale, 'READ-ONLY', 'للقراءة فقط')}</span>
          <span className="apps-chip">{t(locale, 'mutation', 'التغيير')}: {t(locale, 'none', 'لا يوجد')}</span>
          <button type="button" className="apps-btn ms-auto" onClick={onClose}>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            {t(locale, 'Back to register', 'العودة للسجل')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="apps-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="apps-service-title">
      <div className="apps-service-modal" data-testid="apps-service-workspace">
        <header className="apps-service-modal-head">
          <span
            className="apps-service-icon apps-service-icon-lg"
            style={{ color: accent, borderColor: `${accent}55`, background: `${accent}18` }}
          >
            {serviceIcon(service, 'w-5 h-5')}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="apps-service-title" className="apps-panel-title">{serviceTitle(service, locale)}</h2>
              <span className={`apps-state apps-state-${capability?.state || 'partial'}`}>{serviceStateLabel(capability?.state || 'partial', locale)}</span>
            </div>
            <p className="apps-panel-sub">{serviceDescription(service, locale)}</p>
            <p className="apps-service-provider">
              {t(locale, 'Measured provider', 'المزوّد المقيس')}: {capability?.provider || 'ApplicationsBridge'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="apps-icon-btn apps-icon-btn-lg"
            aria-label={t(locale, 'Close workspace', 'إغلاق مساحة العمل')}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="apps-service-modal-body knx-custom-scrollbar">{renderPanel()}</div>

        <footer className="apps-service-modal-foot">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="apps-chip apps-chip-good"><ShieldCheck className="w-3 h-3" />{t(locale, 'READ-ONLY', 'للقراءة فقط')}</span>
            <span className="apps-chip">{t(locale, 'mutation', 'التغيير')}: {t(locale, 'none', 'لا يوجد')}</span>
            <span className="apps-chip">{t(locale, 'no fixture fallback', 'بلا بيانات وهمية')}</span>
          </div>
          <button type="button" className="apps-btn" onClick={onClose}>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            {t(locale, 'Back to register', 'العودة للسجل')}
          </button>
        </footer>
      </div>
    </div>
  );
};

function PlayIcon() {
  return <Sparkles className="w-3.5 h-3.5" />;
}
