/**
 * KNOuX Live Pulse - network world workbenches (services 13-24).
 *
 * Interfaces, routes, neighbours, sockets, Wi-Fi, hosts and proxy lanes are
 * read from the measured snapshot. DNS/TCP/HTTP/ICMP diagnostics and tracert
 * run only on explicit user request through validated native channels. No
 * adapter reset, host write, proxy write, DNS flush or socket close exists.
 */
import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Cable,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  FileCode2,
  Globe2,
  Info,
  Layers,
  Network,
  Pause,
  Play,
  PlugZap,
  Radar,
  RefreshCw,
  Route,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Split,
  TimerReset,
  Waypoints,
  Wifi,
  Wrench,
  XCircle,
} from 'lucide-react';
import type {
  HostsDraft,
  NetworkInterfaceInfo,
  NetworkSocket,
  SystemDiagnosticStage,
  SystemDiagnosticType,
  SystemTracerouteHop,
} from '../../shared/native-contracts';
import type { SystemLocale } from './catalog';
import type { WorkbenchProps } from './types';
import {
  activeInterfaces,
  averageOf,
  filterSockets,
  formatBytes,
  formatCount,
  formatDuration,
  formatMs,
  formatPercent,
  formatRate,
  formatTimestamp,
  interfaceAddress,
  interfaceKind,
  isSafeTargetDraft,
  latestOf,
  maxOf,
  metricValues,
  sanitizeTargetDraft,
  socketKey,
  t,
  type Tone,
} from './model';
import {
  Chip,
  CodeBlock,
  CopyButton,
  DataRows,
  EmptyBlock,
  ExportButton,
  Field,
  Gauge,
  InfoNote,
  KeyValueGrid,
  MeterBar,
  MiniStat,
  Panel,
  SearchBox,
  Seg,
  SelectBox,
  Sparkline,
  Toggle,
  WorkbenchFrame,
  cx,
} from './ui';

const AR = 'ar';

function macVendorLabel(mac: string | null): string | null {
  if (!mac) return null;
  const prefix = mac.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase();
  return prefix.length === 6 ? `OUI ${prefix}` : null;
}

function addressList(entry: NetworkInterfaceInfo): string[] {
  return [...entry.ipv4, ...entry.ipv6].map((address) => {
    if (!address.address) return '';
    return address.prefixLength == null ? address.address : `${address.address}/${address.prefixLength}`;
  }).filter(Boolean);
}

function stageTone(status: SystemDiagnosticStage['status']): Tone {
  if (status === 'passed') return 'good';
  if (status === 'failed') return 'bad';
  if (status === 'timeout') return 'warn';
  return 'muted';
}

/* ------------------------------------------------------------------------- */
/* 13 - Network Interfaces Console                                           */
/* ------------------------------------------------------------------------- */

export function InterfacesWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'up' | 'down'>('all');
  const [showVirtual, setShowVirtual] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const interfaces = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return snapshot.interfaces.filter((entry) => {
      if (!showVirtual && entry.virtual === true) return false;
      if (filter === 'up' && String(entry.status).toLowerCase() !== 'up') return false;
      if (filter === 'down' && String(entry.status).toLowerCase() === 'up') return false;
      if (needle && !`${entry.name} ${entry.description} ${entry.mac ?? ''} ${entry.gateway ?? ''}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [filter, query, showVirtual, snapshot.interfaces]);

  const selected = snapshot.interfaces.find((entry) => entry.id === selectedId) || interfaces[0] || null;
  const upCount = activeInterfaces(snapshot.interfaces).length;
  const dnsCount = new Set(snapshot.interfaces.flatMap((entry) => entry.dnsServers)).size;

  return (
    <WorkbenchFrame
      id="network-interfaces"
      locale={locale}
      provider="Get-NetAdapter + Get-NetIPAddress + Get-DnsClient"
      foot={
        <>
          <span><Network aria-hidden="true" />{formatCount(snapshot.interfaces.length)} {t(locale, 'interfaces', 'واجهة')} · {formatCount(upCount)} {t(locale, 'up', 'متصلة')}</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'Adapter reset, address change and disable are not exposed.', 'إعادة تعيين المحول وتغيير العنوان والتعطيل غير متاحة.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search adapter, MAC or gateway…', 'ابحث في المحول أو MAC أو البوابة…')} />
        <Seg
          value={filter}
          onChange={setFilter}
          ariaLabel={t(locale, 'Filter interface status', 'تصفية حالة الواجهة')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All', 'الكل') },
            { value: 'up', label: t(locale, 'Up', 'متصلة') },
            { value: 'down', label: t(locale, 'Down', 'غير متصلة') },
          ]}
        />
        <Toggle checked={showVirtual} onChange={setShowVirtual} label={t(locale, 'Show virtual', 'إظهار الافتراضية')} />
        <span className="sys-toolbar-spacer" />
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.openSettings('network')} disabled={controller.busy === 'settings'}>
          <Wrench aria-hidden="true" />
          {t(locale, 'Windows network settings', 'إعدادات الشبكة في Windows')}
        </button>
      </div>

      <div className="sys-mini-row">
        <MiniStat label={t(locale, 'Up interfaces', 'الواجهات المتصلة')} value={formatCount(upCount)} tone="good" icon={Network} />
        <MiniStat label={t(locale, 'IPv4 addresses', 'عناوين IPv4')} value={formatCount(snapshot.interfaces.reduce((sum, entry) => sum + entry.ipv4.length, 0))} />
        <MiniStat label={t(locale, 'IPv6 addresses', 'عناوين IPv6')} value={formatCount(snapshot.interfaces.reduce((sum, entry) => sum + entry.ipv6.length, 0))} />
        <MiniStat label={t(locale, 'Unique resolvers', 'محللات فريدة')} value={formatCount(dnsCount)} tone="info" icon={Globe2} />
      </div>

      <div className="sys-split-ledger">
        <Panel
          className="sys-ledger-panel"
          title={t(locale, 'Interface console', 'وحدة تحكم الواجهات')}
          sub={`${formatCount(interfaces.length)} ${t(locale, 'matching adapters', 'محول مطابق')}`}
          icon={Cable}
          bodyClassName="sys-panel-body-flush"
        >
          {interfaces.length ? (
            <div className="sys-table-wrap">
              <table className="sys-table">
                <thead>
                  <tr>
                    <th>{t(locale, 'Adapter', 'المحول')}</th>
                    <th>{t(locale, 'Address', 'العنوان')}</th>
                    <th>{t(locale, 'Gateway', 'البوابة')}</th>
                    <th>{t(locale, 'Link', 'الوصلة')}</th>
                    <th>{t(locale, 'Status', 'الحالة')}</th>
                  </tr>
                </thead>
                <tbody>
                  {interfaces.map((entry) => (
                    <tr
                      key={entry.id}
                      className={cx(selected?.id === entry.id && 'is-selected')}
                      onClick={() => setSelectedId(entry.id)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedId(entry.id);
                        }
                      }}
                      aria-selected={selected?.id === entry.id}
                    >
                      <td>
                        <strong className="sys-row-name">{entry.name}</strong>
                        <span className="sys-row-sub">{entry.description || entry.interfaceType || '—'}</span>
                      </td>
                      <td className="sys-mono">{interfaceAddress(entry) || '—'}</td>
                      <td className="sys-mono">{entry.gateway || '—'}</td>
                      <td className="sys-mono">{entry.linkSpeed || '—'}</td>
                      <td>
                        <Chip tone={String(entry.status).toLowerCase() === 'up' ? 'good' : 'muted'}>{entry.status || t(locale, 'Unknown', 'مجهول')}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyBlock icon={Network} title={t(locale, 'No interface matches', 'لا واجهة مطابقة')} message={t(locale, 'Clear the search or status filter.', 'امسح البحث أو مرشح الحالة.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel
            title={t(locale, 'Adapter dossier', 'ملف المحول')}
            sub={selected?.name}
            icon={Network}
            actions={
              selected ? (
                <ExportButton
                  fileName={`knoux-interface-${selected.id}.json`}
                  payload={selected}
                  label={t(locale, 'Export adapter', 'تصدير المحول')}
                  onDone={(ok) => controller.showNotice(ok ? t(locale, 'Adapter evidence exported.', 'صُدّدت أدلة المحول.') : t(locale, 'The adapter export could not start.', 'تعذّر بدء تصدير المحول.'))}
                />
              ) : null
            }
          >
            {selected ? (
              <>
                <KeyValueGrid>
                  <Field label={t(locale, 'Status', 'الحالة')} value={selected.status || '—'} tone={String(selected.status).toLowerCase() === 'up' ? 'good' : 'muted'} />
                  <Field label={t(locale, 'Kind', 'النوع')} value={selected.virtual == null ? t(locale, 'Unknown', 'مجهول') : selected.virtual ? t(locale, 'Virtual', 'افتراضي') : t(locale, 'Physical', 'فعلي')} />
                  <Field label={t(locale, 'MAC address', 'عنوان MAC')} value={selected.mac || '—'} mono />
                  <Field label={t(locale, 'Link speed', 'سرعة الوصلة')} value={selected.linkSpeed || formatRate(selected.speedBps)} />
                  <Field label={t(locale, 'Interface index', 'فهرس الواجهة')} value={selected.interfaceIndex ?? '—'} mono />
                  <Field label={t(locale, 'MTU', 'MTU')} value={selected.mtu ?? '—'} mono />
                  <Field label={t(locale, 'DHCP', 'DHCP')} value={selected.dhcp || '—'} />
                  <Field label={t(locale, 'Connection', 'الاتصال')} value={selected.connectionState || '—'} />
                  <Field label={t(locale, 'DNS suffix', 'لاحقة DNS')} value={selected.dnsSuffix || '—'} className="sys-span-2" />
                  <Field label={t(locale, 'Source', 'المصدر')} value={selected.source} className="sys-span-2" />
                </KeyValueGrid>
                <div className="sys-kv-section">
                  <h4>{t(locale, 'Addresses', 'العناوين')}</h4>
                  <DataRows
                    rows={[...selected.ipv4, ...selected.ipv6].map((address) => ({
                      label: `${address.family}${address.origin ? ` · ${address.origin}` : ''}`,
                      value: address.prefixLength == null ? address.address : `${address.address}/${address.prefixLength}`,
                      mono: true,
                      tone: address.state && address.state.toLowerCase() !== 'preferred' ? 'warn' : undefined,
                    }))}
                    empty={<em className="sys-muted-text">{t(locale, 'No address was returned for this adapter.', 'لم يُعد عنوان لهذا المحول.')}</em>}
                  />
                </div>
                <div className="sys-kv-section">
                  <h4>{t(locale, 'Resolvers & gateway', 'المحللات والبوابة')}</h4>
                  <DataRows
                    rows={[
                      { label: t(locale, 'Gateway', 'البوابة'), value: selected.gateway || '—', mono: true },
                      ...selected.dnsServers.map((server) => ({ label: t(locale, 'DNS server', 'خادم DNS'), value: server, mono: true })),
                    ]}
                  />
                </div>
                <div className="sys-toolbar-row">
                  <CopyButton locale={locale} text={selected.mac} label={t(locale, 'Copy MAC', 'نسخ MAC')} />
                  <CopyButton locale={locale} text={addressList(selected).join('\n')} label={t(locale, 'Copy addresses', 'نسخ العناوين')} />
                  <Chip tone="muted">{macVendorLabel(selected.mac) || t(locale, 'Vendor not resolved', 'المصنّع غير محلول')}</Chip>
                </div>
              </>
            ) : (
              <EmptyBlock compact icon={Network} title={t(locale, 'No adapter selected', 'لا محول محدد')} message={t(locale, 'Select a measured interface row.', 'اختر صف واجهة مقيسًا.')} />
            )}
          </Panel>
          <Panel title={t(locale, 'Live throughput', 'الصبيب الحي')} icon={ArrowUpDown}>
            <Sparkline values={metricValues(controller.series, 'networkInBytesPerSec')} color="#34d399" height={52} label={t(locale, 'Network receive series', 'سلسلة استقبال الشبكة')} />
            <DataRows
              rows={[
                { label: t(locale, 'Receive now', 'الاستقبال الآن'), value: formatRate(snapshot.metrics.networkInBytesPerSec), tone: 'good' },
                { label: t(locale, 'Send now', 'الإرسال الآن'), value: formatRate(snapshot.metrics.networkOutBytesPerSec), tone: 'info' },
                { label: t(locale, 'Samples in memory', 'العينات في الذاكرة'), value: formatCount(controller.series.length) },
              ]}
            />
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 14 - DNS Resolver Dossier                                                 */
/* ------------------------------------------------------------------------- */

export function DnsConfigWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [target, setTarget] = useState('example.com');
  const [view, setView] = useState<'resolvers' | 'test'>('resolvers');

  const adapters = snapshot.interfaces.filter((entry) => String(entry.status).toLowerCase() === 'up' || entry.dnsServers.length);
  const selected = snapshot.interfaces.find((entry) => entry.id === selectedId) || adapters[0] || null;
  const resolvers = useMemo(() => {
    const seen = new Map<string, NetworkInterfaceInfo[]>();
    for (const entry of snapshot.interfaces) {
      for (const server of entry.dnsServers) {
        const list = seen.get(server) || [];
        list.push(entry);
        seen.set(server, list);
      }
    }
    return [...seen.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [snapshot.interfaces]);
  const safe = isSafeTargetDraft(target);
  const running = controller.busy === 'diagnostics';
  const result = controller.diagnostic;

  const run = async () => {
    if (!safe) {
      controller.showNotice(t(locale, 'The DNS target contains unsupported characters. Use a hostname or literal IP only.', 'يحتوي هدف DNS على محارف غير مدعومة. استخدم اسم مضيف أو عنوان IP فقط.'));
      return;
    }
    const value = await controller.diagnose('dns', sanitizeTargetDraft(target));
    if (value) controller.showNotice(t(locale, `DNS resolution returned ${value.stages[0]?.evidence.length || 0} address record(s).`, `أعاد حل DNS ${value.stages[0]?.evidence.length || 0} سجل عنوان.`));
  };

  return (
    <WorkbenchFrame
      id="network-dns-config"
      locale={locale}
      provider="Get-DnsClient + DNS lookup"
      foot={
        <>
          <span><Globe2 aria-hidden="true" />{formatCount(resolvers.length)} {t(locale, 'unique measured resolvers', 'محلل مقيس فريد')}</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'Resolver addresses are never changed by this page.', 'لا تُغيَّر عناوين المحللات عبر هذه الصفحة.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Seg
          value={view}
          onChange={setView}
          ariaLabel={t(locale, 'DNS view', 'عرض DNS')}
          options={[
            { value: 'resolvers', label: t(locale, 'Resolver map', 'خريطة المحللات') },
            { value: 'test', label: t(locale, 'Test query', 'استعلام اختبار') },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.openSettings('network')} disabled={controller.busy === 'settings'}>
          <Wrench aria-hidden="true" />
          {t(locale, 'Windows network settings', 'إعدادات الشبكة في Windows')}
        </button>
      </div>

      <div className="sys-mini-row">
        <MiniStat label={t(locale, 'Unique resolvers', 'محللات فريدة')} value={formatCount(resolvers.length)} icon={Globe2} />
        <MiniStat label={t(locale, 'Adapters with DNS', 'محولات مع DNS')} value={formatCount(snapshot.interfaces.filter((entry) => entry.dnsServers.length).length)} />
        <MiniStat label={t(locale, 'Suffixes observed', 'اللواحق المرصودة')} value={formatCount(new Set(snapshot.interfaces.map((entry) => entry.dnsSuffix).filter(Boolean)).size)} />
        <MiniStat label={t(locale, 'Last test', 'آخر اختبار')} value={result ? formatTimestamp(result.startedAt, locale) : '—'} tone={result ? (result.ok ? 'good' : 'warn') : 'muted'} />
      </div>

      {view === 'resolvers' ? (
        <div className="sys-split-ledger">
          <Panel
            className="sys-ledger-panel"
            title={t(locale, 'Resolver dossier', 'ملف المحللات')}
            sub={`${formatCount(resolvers.length)} ${t(locale, 'measured servers', 'خادم مقيس')}`}
            icon={Globe2}
            bodyClassName="sys-panel-body-flush"
          >
            {resolvers.length ? (
              <div className="sys-resolver-list">
                {resolvers.map(([server, owners]) => (
                  <div className="sys-resolver-row" key={server}>
                    <span className="sys-resolver-glyph" aria-hidden="true"><Server /></span>
                    <div className="sys-resolver-copy">
                      <strong className="sys-mono">{server}</strong>
                      <em>{owners.map((owner) => owner.name).join(' · ')}</em>
                    </div>
                    <Chip tone="info">{formatCount(owners.length)} {t(locale, 'adapter(s)', 'محول')}</Chip>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBlock icon={Globe2} title={t(locale, 'No resolver returned', 'لم يُعد أي محلل')} message={t(locale, 'Get-DnsClient returned no server addresses for the measured adapters.', 'لم يُعد Get-DnsClient عناوين خوادم للمحولات المقيسة.')} />
            )}
          </Panel>

          <div className="sys-stack">
            <Panel title={t(locale, 'Per-adapter DNS', 'DNS لكل محول')} sub={selected?.name} icon={Network}>
              {adapters.length ? (
                <>
                  <SelectBox
                    value={selected?.id || ''}
                    onChange={setSelectedId}
                    ariaLabel={t(locale, 'Choose adapter', 'اختر المحول')}
                    options={adapters.map((entry) => ({ value: entry.id, label: entry.name }))}
                  />
                  {selected ? (
                    <>
                      <KeyValueGrid>
                        <Field label={t(locale, 'DNS suffix', 'لاحقة DNS')} value={selected.dnsSuffix || '—'} />
                        <Field label={t(locale, 'DHCP', 'DHCP')} value={selected.dhcp || '—'} />
                        <Field label={t(locale, 'Resolvers', 'المحللات')} value={formatCount(selected.dnsServers.length)} />
                        <Field label={t(locale, 'Source', 'المصدر')} value="Get-DnsClient" mono />
                      </KeyValueGrid>
                      <DataRows
                        rows={selected.dnsServers.map((server, index) => ({ label: `${t(locale, 'Resolver', 'محلل')} ${index + 1}`, value: server, mono: true }))}
                        empty={<em className="sys-muted-text">{t(locale, 'No resolver was returned for this adapter.', 'لم يُعد محلل لهذا المحول.')}</em>}
                      />
                      <div className="sys-toolbar-row">
                        <CopyButton locale={locale} text={selected.dnsServers.join('\n')} label={t(locale, 'Copy resolvers', 'نسخ المحللات')} />
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <EmptyBlock compact icon={Network} title={t(locale, 'No measured adapter', 'لا محول مقيس')} message={t(locale, 'DNS configuration requires a measured interface.', 'يتطلب إعداد DNS واجهة مقيسة.')} />
              )}
            </Panel>
            <Panel title={t(locale, 'Suffix search order', 'ترتيب بحث اللواحق')} icon={Globe2}>
              <DataRows
                rows={snapshot.interfaces.filter((entry) => entry.dnsSuffix).map((entry) => ({ label: entry.name, value: entry.dnsSuffix || '—', mono: true }))}
                empty={<em className="sys-muted-text">{t(locale, 'Windows returned no connection-specific suffix.', 'لم يُعد Windows أي لاحقة خاصة بالاتصال.')}</em>}
              />
            </Panel>
          </div>
        </div>
      ) : (
        <div className="sys-split-2">
          <Panel title={t(locale, 'Bounded DNS query', 'استعلام DNS محدود')} sub={t(locale, 'One validated hostname or literal IP per request.', 'اسم مضيف متحقق أو عنوان IP واحد لكل طلب.')} icon={Radar}>
            <label className="sys-field sys-field-edit">
              <span className="sys-field-label">{t(locale, 'Target', 'الهدف')}</span>
              <input
                className="sys-input"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                placeholder="example.com"
                spellCheck={false}
                dir="ltr"
                aria-label={t(locale, 'DNS target', 'هدف DNS')}
              />
              <em className={cx('sys-field-hint', !safe && 'is-bad')}>
                {safe ? t(locale, 'Validated target shape. The native bridge re-validates it.', 'شكل هدف متحقق. يعيد الجسر الأصلي التحقق منه.') : t(locale, 'Spaces, shell characters and empty targets are rejected before any call.', 'تُرفض المسافات ومحارف الصدفة والأهداف الفارغة قبل أي استدعاء.')}
              </em>
            </label>
            <div className="sys-toolbar-row">
              <button type="button" className="sys-btn sys-btn-primary" onClick={() => void run()} disabled={!safe || running}>
                {running ? <RefreshCw className="sys-spin" aria-hidden="true" /> : <Radar aria-hidden="true" />}
                {t(locale, 'Resolve now', 'حل الآن')}
              </button>
              <Chip tone="muted" icon={ShieldCheck}>{t(locale, 'No recursion beyond the system resolver', 'لا تكرار خارج محلل النظام')}</Chip>
            </div>
            <InfoNote tone="muted">
              {t(locale, 'The native bridge uses dns.lookup with the operating system resolver. It does not enumerate records, perform zone transfers or contact arbitrary DNS servers.', 'يستخدم الجسر الأصلي dns.lookup مع محلل نظام التشغيل. لا يعدد السجلات ولا ينفذ نقل مناطق ولا يتصل بخوادم DNS عشوائية.')}
            </InfoNote>
          </Panel>
          <Panel title={t(locale, 'Measured result', 'النتيجة المقيسة')} sub={result ? `${result.target} · ${formatDuration(result.durationMs / 1000)}` : undefined} icon={Activity}>
            {result ? (
              <>
                <KeyValueGrid>
                  <Field label={t(locale, 'Outcome', 'النتيجة')} value={result.ok ? t(locale, 'Passed', 'ناجح') : t(locale, 'Failed', 'فاشل')} tone={result.ok ? 'good' : 'bad'} />
                  <Field label={t(locale, 'Duration', 'المدة')} value={formatMs(result.durationMs)} />
                  <Field label={t(locale, 'Receipt', 'الإيصال')} value={result.receipt} mono className="sys-span-2" />
                </KeyValueGrid>
                <div className="sys-stage-list">
                  {result.stages.map((stage) => (
                    <div className="sys-stage-row" key={stage.stage}>
                      <span className={cx('sys-stage-mark', `is-${stageTone(stage.status)}`)} aria-hidden="true" />
                      <div>
                        <strong>{stage.label}</strong>
                        <em>{stage.detail}</em>
                        {stage.evidence.length ? <span className="sys-stage-evidence sys-mono">{stage.evidence.join(' · ')}</span> : null}
                      </div>
                      <Chip tone={stageTone(stage.status)}>{stage.status}</Chip>
                      <em className="sys-stage-latency">{formatMs(stage.latencyMs)}</em>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyBlock icon={Globe2} title={t(locale, 'No DNS test has run', 'لم يُشغّل اختبار DNS')} message={t(locale, 'A test only runs when you press “Resolve now”. No background query is made.', 'لا يُشغّل الاختبار إلا عند الضغط على «حل الآن». لا استعلام في الخلفية.')} />
            )}
          </Panel>
        </div>
      )}
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 15 - Network Hardware Atlas                                               */
/* ------------------------------------------------------------------------- */

export function AdaptersWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const [kind, setKind] = useState<'all' | 'physical' | 'virtual' | 'unknown'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(
    () => snapshot.interfaces.filter((entry) => kind === 'all' || interfaceKind(entry) === kind),
    [kind, snapshot.interfaces],
  );
  const selected = snapshot.interfaces.find((entry) => entry.id === selectedId) || rows[0] || null;
  const physical = snapshot.interfaces.filter((entry) => interfaceKind(entry) === 'physical').length;
  const virtual = snapshot.interfaces.filter((entry) => interfaceKind(entry) === 'virtual').length;
  const unknown = snapshot.interfaces.length - physical - virtual;

  return (
    <WorkbenchFrame
      id="network-adapters"
      locale={locale}
      provider="Get-NetAdapter + Win32_NetworkAdapter"
      foot={
        <>
          <span><Cable aria-hidden="true" />{formatCount(snapshot.interfaces.length)} {t(locale, 'measured adapters', 'محول مقيس')}</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'Disable, reset and driver changes are not exposed.', 'التعطيل وإعادة التعيين وتغيير برنامج التشغيل غير متاحة.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Seg
          value={kind}
          onChange={setKind}
          ariaLabel={t(locale, 'Adapter kind', 'نوع المحول')}
          options={[
            { value: 'all', label: t(locale, 'All adapters', 'كل المحولات') },
            { value: 'physical', label: t(locale, 'Physical', 'فعلية') },
            { value: 'virtual', label: t(locale, 'Virtual', 'افتراضية') },
            { value: 'unknown', label: t(locale, 'Unknown', 'مجهولة') },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.openSettings('network')} disabled={controller.busy === 'settings'}>
          <Wrench aria-hidden="true" />
          {t(locale, 'Windows network settings', 'إعدادات الشبكة في Windows')}
        </button>
      </div>

      <div className="sys-mini-row">
        <MiniStat label={t(locale, 'Physical', 'فعلية')} value={formatCount(physical)} tone="good" icon={Cable} />
        <MiniStat label={t(locale, 'Virtual', 'افتراضية')} value={formatCount(virtual)} tone="violet" icon={Layers} />
        <MiniStat label={t(locale, 'Unknown', 'مجهولة')} value={formatCount(unknown)} tone="muted" icon={Info} />
        <MiniStat label={t(locale, 'Link speed (max)', 'سرعة الوصلة (الأقصى)')} value={formatRate(maxOf(snapshot.interfaces.map((entry) => entry.speedBps)))} />
      </div>

      <div className="sys-adapter-rack">
        {rows.map((entry) => (
          <button
            type="button"
            key={entry.id}
            className={cx('sys-adapter-card', selected?.id === entry.id && 'is-active')}
            onClick={() => setSelectedId(entry.id)}
          >
            <span className={cx('sys-adapter-led', String(entry.status).toLowerCase() === 'up' ? 'is-live' : 'is-idle')} aria-hidden="true" />
            <span className="sys-adapter-kind">{interfaceKind(entry) === 'virtual' ? t(locale, 'Virtual', 'افتراضي') : interfaceKind(entry) === 'physical' ? t(locale, 'Physical', 'فعلي') : t(locale, 'Unknown', 'مجهول')}</span>
            <strong>{entry.name}</strong>
            <em>{entry.description || entry.interfaceType || t(locale, 'No description returned', 'لم يُعد وصف')}</em>
            <span className="sys-adapter-meta">
              <span className="sys-mono">{entry.mac || '—'}</span>
              <span>{entry.linkSpeed || '—'}</span>
            </span>
          </button>
        ))}
        {!rows.length ? <EmptyBlock icon={Cable} title={t(locale, 'No adapter in this rack', 'لا محول في هذا الرف')} message={t(locale, 'Choose another adapter kind.', 'اختر نوع محول آخر.')} /> : null}
      </div>

      <div className="sys-split-2">
        <Panel title={t(locale, 'Selected adapter', 'المحول المحدد')} sub={selected?.name} icon={Cable}>
          {selected ? (
            <KeyValueGrid>
              <Field label={t(locale, 'Status', 'الحالة')} value={selected.status || '—'} tone={String(selected.status).toLowerCase() === 'up' ? 'good' : 'muted'} />
              <Field label={t(locale, 'Media type', 'نوع الوسائط')} value={selected.mediaType || '—'} />
              <Field label={t(locale, 'MAC', 'MAC')} value={selected.mac || '—'} mono />
              <Field label={t(locale, 'Link speed', 'سرعة الوصلة')} value={selected.linkSpeed || formatRate(selected.speedBps)} />
              <Field label={t(locale, 'Interface index', 'فهرس الواجهة')} value={selected.interfaceIndex ?? '—'} mono />
              <Field label={t(locale, 'Interface type', 'نوع الواجهة')} value={selected.interfaceType || '—'} />
              <Field label={t(locale, 'Gateway', 'البوابة')} value={selected.gateway || '—'} mono />
              <Field label={t(locale, 'MTU', 'MTU')} value={selected.mtu ?? '—'} mono />
            </KeyValueGrid>
          ) : (
            <EmptyBlock compact icon={Cable} title={t(locale, 'No adapter selected', 'لا محول محدد')} message={t(locale, 'Select an adapter card.', 'اختر بطاقة محول.')} />
          )}
        </Panel>
        <Panel title={t(locale, 'Bus & driver evidence', 'أدلة الناقل والبرنامج')} icon={Info}>
          {selected ? (
            <>
              <DataRows
                rows={[
                  { label: t(locale, 'Physical adjacency', 'التجاور الفعلي'), value: selected.virtual == null ? t(locale, 'Not reported', 'غير مبلّغ') : selected.virtual ? t(locale, 'Virtual adapter', 'محول افتراضي') : t(locale, 'Physical adapter', 'محول فعلي') },
                  { label: t(locale, 'Interface description', 'وصف الواجهة'), value: selected.description || '—' },
                  { label: t(locale, 'Connection state', 'حالة الاتصال'), value: selected.connectionState || '—' },
                  { label: t(locale, 'DHCP', 'DHCP'), value: selected.dhcp || '—' },
                  { label: t(locale, 'Source', 'المصدر'), value: selected.source },
                ]}
              />
              <InfoNote tone="muted">
                {t(locale, 'Hardware adjacency is taken from the adapter Virtual flag plus measured link evidence. It is not a PCI bus scan.', 'يُؤخذ التجاور العتادي من علم Virtual للمحول مع أدلة الوصلة المقيسة. وهو ليس مسحًا لناقل PCI.')}
              </InfoNote>
            </>
          ) : null}
        </Panel>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 16 - Connectivity Diagnostic                                              */
/* ------------------------------------------------------------------------- */

const DIAGNOSTIC_TYPES: Array<{ value: SystemDiagnosticType; en: string; ar: string }> = [
  { value: 'dns', en: 'DNS', ar: 'DNS' },
  { value: 'tcp', en: 'TCP', ar: 'TCP' },
  { value: 'http', en: 'HTTP', ar: 'HTTP' },
  { value: 'ping', en: 'ICMP', ar: 'ICMP' },
];

export function ConnectivityWorkbench({ locale, controller }: WorkbenchProps) {
  const [type, setType] = useState<SystemDiagnosticType>('dns');
  const [target, setTarget] = useState('example.com');
  const [port, setPort] = useState('443');
  const [view, setView] = useState<'stages' | 'raw'>('stages');
  const safe = isSafeTargetDraft(target);
  const numericPort = Number(port);
  const portValid = type !== 'tcp' || (Number.isInteger(numericPort) && numericPort >= 1 && numericPort <= 65535);
  const valid = safe && portValid;
  const running = controller.busy === 'diagnostics';
  const result = controller.diagnostic;

  const run = async () => {
    if (!valid) {
      controller.showNotice(t(locale, 'The target or TCP port is invalid. Nothing was sent.', 'الهدف أو منفذ TCP غير صالح. لم يُرسل شيء.'));
      return;
    }
    const value = await controller.diagnose(type, sanitizeTargetDraft(target), type === 'tcp' ? numericPort : undefined);
    if (value) controller.showNotice(t(locale, `Diagnostic ${value.ok ? 'passed' : 'reported a failure'} in ${formatMs(value.durationMs)}.`, `أُنجز التشخيص ${value.ok ? 'بنجاح' : 'بفشل'} في ${formatMs(value.durationMs)}.`));
  };

  return (
    <WorkbenchFrame
      id="network-connectivity"
      locale={locale}
      provider="Node dns / net / http + ping"
      foot={
        <>
          <span><TimerReset aria-hidden="true" />{t(locale, 'Timeouts are bounded per stage; no unbounded retry loop exists.', 'المهلات محدودة لكل مرحلة؛ لا حلقة إعادة محاولة غير محدودة.')}</span>
          <span><ShieldCheck aria-hidden="true" />{t(locale, 'One target per explicit request.', 'هدف واحد لكل طلب صريح.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Seg value={type} onChange={setType} ariaLabel={t(locale, 'Diagnostic type', 'نوع التشخيص')} options={DIAGNOSTIC_TYPES.map((entry) => ({ value: entry.value, label: locale === AR ? entry.ar : entry.en }))} />
        <label className="sys-inline-input">
          <span>{t(locale, 'Target', 'الهدف')}</span>
          <input
            className="sys-input"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="example.com"
            dir="ltr"
            spellCheck={false}
            aria-label={t(locale, 'Diagnostic target', 'هدف التشخيص')}
          />
        </label>
        {type === 'tcp' ? (
          <label className="sys-inline-input is-narrow">
            <span>{t(locale, 'Port', 'المنفذ')}</span>
            <input
              className="sys-input"
              value={port}
              onChange={(event) => setPort(event.target.value.replace(/[^\d]/g, '').slice(0, 5))}
              inputMode="numeric"
              aria-label={t(locale, 'TCP port', 'منفذ TCP')}
              dir="ltr"
            />
          </label>
        ) : null}
        <button type="button" className="sys-btn sys-btn-primary" onClick={() => void run()} disabled={!valid || running}>
          {running ? <RefreshCw className="sys-spin" aria-hidden="true" /> : <Radar aria-hidden="true" />}
          {t(locale, 'Run diagnostic', 'تشغيل التشخيص')}
        </button>
        <span className="sys-toolbar-spacer" />
        <Chip tone={valid ? 'good' : 'bad'} icon={valid ? ShieldCheck : AlertTriangle}>
          {valid ? t(locale, 'Target validated', 'الهدف متحقق') : t(locale, 'Target rejected', 'الهدف مرفوض')}
        </Chip>
      </div>

      <div className="sys-diag-layout">
        <Panel
          title={t(locale, 'Diagnostic sequence', 'تسلسل التشخيص')}
          sub={result ? `${result.type.toUpperCase()} · ${result.target}${result.port != null ? `:${result.port}` : ''}` : t(locale, 'No diagnostic has run', 'لم يُشغّل أي تشخيص')}
          icon={Radar}
          actions={
            <Seg
              value={view}
              onChange={setView}
              ariaLabel={t(locale, 'Result view', 'عرض النتيجة')}
              compact
              options={[
                { value: 'stages', label: t(locale, 'Stages', 'المراحل') },
                { value: 'raw', label: t(locale, 'Evidence', 'الأدلة') },
              ]}
            />
          }
        >
          {result ? (
            view === 'stages' ? (
              <div className="sys-diag-stages">
                {result.stages.map((stage, index) => (
                  <div className="sys-diag-stage" key={stage.stage}>
                    <span className={cx('sys-diag-stage-index', `is-${stageTone(stage.status)}`)}>{String(index + 1).padStart(2, '0')}</span>
                    <div className="sys-diag-stage-copy">
                      <strong>{stage.label}</strong>
                      <em>{stage.detail}</em>
                      {stage.evidence.length ? <span className="sys-mono">{stage.evidence.join(' · ')}</span> : null}
                    </div>
                    <span className="sys-diag-stage-latency">{formatMs(stage.latencyMs)}</span>
                    <Chip tone={stageTone(stage.status)}>{stage.status}</Chip>
                  </div>
                ))}
              </div>
            ) : (
              <CodeBlock label={t(locale, 'Measured diagnostic receipt', 'إيصال التشخيص المقيس')}>{JSON.stringify(result, null, 2)}</CodeBlock>
            )
          ) : (
            <EmptyBlock icon={Radar} title={t(locale, 'Ready for an explicit probe', 'جاهز لفحص صريح')} message={t(locale, 'Choose a diagnostic type, validate a target and press Run. No traffic is generated on page load.', 'اختر نوع التشخيص وتحقق من الهدف ثم اضغط تشغيل. لا يُولّد مرور عند تحميل الصفحة.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Outcome', 'النتيجة')} icon={result?.ok ? CheckCircle2 : XCircle}>
            <DataRows
              rows={[
                { label: t(locale, 'Status', 'الحالة'), value: result ? (result.ok ? t(locale, 'Passed', 'ناجح') : t(locale, 'Failed', 'فاشل')) : '—', tone: result ? (result.ok ? 'good' : 'bad') : 'muted' },
                { label: t(locale, 'Duration', 'المدة'), value: result ? formatMs(result.durationMs) : '—' },
                { label: t(locale, 'Port', 'المنفذ'), value: result?.port ?? '—', mono: true },
                { label: t(locale, 'Receipt', 'الإيصال'), value: result?.receipt || '—', mono: true },
              ]}
            />
            {result ? (
              <div className="sys-toolbar-row">
                <CopyButton locale={locale} text={result.receipt} label={t(locale, 'Copy receipt', 'نسخ الإيصال')} />
                <ExportButton
                  fileName={`knoux-diagnostic-${result.type}.json`}
                  payload={result}
                  label={t(locale, 'Export result', 'تصدير النتيجة')}
                  onDone={(ok) => controller.showNotice(ok ? t(locale, 'Diagnostic evidence exported.', 'صُدّدت أدلة التشخيص.') : t(locale, 'The diagnostic export could not start.', 'تعذّر بدء تصدير التشخيص.'))}
                />
              </div>
            ) : null}
          </Panel>
          <Panel title={t(locale, 'Safety boundary', 'حدود السلامة')} icon={ShieldCheck}>
            <InfoNote tone="muted">
              {t(locale, 'Targets are limited to one hostname or IP and re-validated by the native process. TCP and HTTP use fixed libraries with timeouts; ICMP uses the Windows ping executable with a validated argument vector. No shell is invoked.', 'الأهداف محدودة باسم مضيف أو IP واحد ويعيد التحقق منها العملية الأصلية. يستخدم TCP وHTTP مكتبات ثابتة مع مهلات؛ ويستخدم ICMP أداة ping في Windows بمتجه وسائط متحقق. لا تُستدعى أي صدفة.')}
            </InfoNote>
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 17 - Real-Time Traffic Pulse                                              */
/* ------------------------------------------------------------------------- */

export function ThroughputWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const [unit, setUnit] = useState<'auto' | 'KB' | 'MB'>('auto');
  const [showTotal, setShowTotal] = useState(true);
  const inbound = metricValues(controller.series, 'networkInBytesPerSec');
  const outbound = metricValues(controller.series, 'networkOutBytesPerSec');
  const currentIn = latestOf(inbound);
  const currentOut = latestOf(outbound);
  const peakIn = maxOf(inbound);
  const peakOut = maxOf(outbound);
  const avgIn = averageOf(inbound);
  const avgOut = averageOf(outbound);
  const totalNow = currentIn != null || currentOut != null ? (currentIn || 0) + (currentOut || 0) : null;

  const formatUnit = (value: number | null): string => {
    if (value == null) return '—';
    if (unit === 'KB') return `${(value / 1024).toFixed(value / 1024 >= 100 ? 0 : 1)} KB/s`;
    if (unit === 'MB') return `${(value / (1024 * 1024)).toFixed(2)} MB/s`;
    return formatRate(value);
  };
  const sampleSeconds = Math.round(controller.sampleIntervalMs / 1000);

  return (
    <WorkbenchFrame
      id="network-throughput"
      locale={locale}
      provider="Get-Counter Network Interface"
      foot={
        <>
          <span><Database aria-hidden="true" />{formatCount(controller.series.length)} {t(locale, 'samples in memory', 'عينة في الذاكرة')} · {t(locale, 'cap', 'الحد')} 120</span>
          <span><ShieldCheck aria-hidden="true" />{t(locale, 'No traffic is generated by this workbench.', 'لا يُولّد هذا الملف أي مرور.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Seg
          value={controller.sampleIntervalMs}
          onChange={(value) => controller.setSampleInterval(value)}
          ariaLabel={t(locale, 'Sampling interval', 'فاصل القياس')}
          compact
          options={[
            { value: 1000, label: '1s' },
            { value: 5000, label: '5s' },
            { value: 15000, label: '15s' },
          ]}
        />
        <Seg
          value={unit}
          onChange={setUnit}
          ariaLabel={t(locale, 'Byte unit', 'وحدة البايت')}
          compact
          options={[
            { value: 'auto', label: t(locale, 'Auto', 'تلقائي') },
            { value: 'KB', label: 'KB/s' },
            { value: 'MB', label: 'MB/s' },
          ]}
        />
        <button type="button" className="sys-btn sys-btn-ghost" onClick={() => controller.setSamplingPaused(!controller.samplingPaused)}>
          {controller.samplingPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {controller.samplingPaused ? t(locale, 'Resume sampling', 'استئناف القياس') : t(locale, 'Pause sampling', 'إيقاف القياس')}
        </button>
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.sampleNow()} disabled={controller.sampling}>
          <RefreshCw className={controller.sampling ? 'sys-spin' : undefined} aria-hidden="true" />
          {t(locale, 'Sample now', 'قياس الآن')}
        </button>
        <Toggle checked={showTotal} onChange={setShowTotal} label={t(locale, 'Combined line', 'الخط المدمج')} />
        <span className="sys-toolbar-spacer" />
        <Chip tone={controller.samplingPaused ? 'warn' : 'good'}>{controller.samplingPaused ? t(locale, 'Paused', 'متوقف') : t(locale, 'Live', 'حي')}</Chip>
      </div>

      <div className="sys-throughput-hero">
        <div className="sys-throughput-gauge">
          <Gauge value={currentIn == null ? null : Math.min(100, (currentIn / Math.max(1, peakIn || currentIn)) * 100)} label={t(locale, 'Receive', 'الاستقبال')} sub={formatUnit(currentIn)} color="#34d399" unit="%" />
          <div className="sys-throughput-gauge-copy">
            <span>{t(locale, 'Download', 'التنزيل')}</span>
            <strong>{formatUnit(currentIn)}</strong>
            <em>{t(locale, 'Peak', 'الذروة')} {formatUnit(peakIn)} · {t(locale, 'avg', 'متوسط')} {formatUnit(avgIn)}</em>
          </div>
        </div>
        <div className="sys-throughput-gauge">
          <Gauge value={currentOut == null ? null : Math.min(100, (currentOut / Math.max(1, peakOut || currentOut)) * 100)} label={t(locale, 'Send', 'الإرسال')} sub={formatUnit(currentOut)} color="#818cf8" unit="%" />
          <div className="sys-throughput-gauge-copy">
            <span>{t(locale, 'Upload', 'الرفع')}</span>
            <strong>{formatUnit(currentOut)}</strong>
            <em>{t(locale, 'Peak', 'الذروة')} {formatUnit(peakOut)} · {t(locale, 'avg', 'متوسط')} {formatUnit(avgOut)}</em>
          </div>
        </div>
      </div>

      <div className="sys-split-2">
        <Panel title={t(locale, 'Receive series', 'سلسلة الاستقبال')} sub={`${formatCount(inbound.length)} ${t(locale, 'points', 'نقطة')} · ${sampleSeconds}s`} icon={ArrowDown}>
          <Sparkline values={inbound} color="#34d399" height={140} label={t(locale, 'Receive throughput', 'صبيب الاستقبال')} />
          <DataRows
            rows={[
              { label: t(locale, 'Current', 'الحالي'), value: formatUnit(currentIn), tone: 'good' },
              { label: t(locale, 'Peak', 'الذروة'), value: formatUnit(peakIn) },
              { label: t(locale, 'Average', 'المتوسط'), value: formatUnit(avgIn) },
            ]}
          />
        </Panel>
        <Panel title={t(locale, 'Send series', 'سلسلة الإرسال')} sub={`${formatCount(outbound.length)} ${t(locale, 'points', 'نقطة')} · ${sampleSeconds}s`} icon={ArrowUp}>
          <Sparkline values={outbound} color="#818cf8" height={140} label={t(locale, 'Send throughput', 'صبيب الإرسال')} />
          <DataRows
            rows={[
              { label: t(locale, 'Current', 'الحالي'), value: formatUnit(currentOut), tone: 'info' },
              { label: t(locale, 'Peak', 'الذروة'), value: formatUnit(peakOut) },
              { label: t(locale, 'Average', 'المتوسط'), value: formatUnit(avgOut) },
            ]}
          />
        </Panel>
      </div>

      {showTotal ? (
        <Panel title={t(locale, 'Combined counter', 'العداد المدمج')} icon={ArrowUpDown}>
          <div className="sys-throughput-wrap">
            <Sparkline values={controller.series.map((sample) => (sample.networkInBytesPerSec == null && sample.networkOutBytesPerSec == null ? null : (sample.networkInBytesPerSec || 0) + (sample.networkOutBytesPerSec || 0)))} color="#22d3ee" height={64} label={t(locale, 'Combined throughput', 'الصبيب المدمج')} />
            <strong>{formatUnit(totalNow)}</strong>
            <Chip tone={controller.samplingPaused ? 'warn' : 'good'}>{controller.samplingPaused ? t(locale, 'Local chart paused', 'المخطط المحلي متوقف') : t(locale, 'Measured counters', 'عدادات مقيسة')}</Chip>
          </div>
          <InfoNote tone="muted">
            {t(locale, 'Receive and send counters are read from the Windows Network Interface counter set. Missing samples leave gaps; they are never replaced with zero to smooth the chart.', 'تُقرأ عدادات الاستقبال والإرسال من مجموعة عدادات واجهة الشبكة في Windows. العينات المفقودة تترك فجوات؛ ولا تُستبدل بصفر لتنعيم المخطط.')}
          </InfoNote>
        </Panel>
      ) : null}

      <div className="sys-toolbar-row sys-foot-row">
        <Chip tone="muted">{snapshot.metrics.source}</Chip>
        <Chip tone="muted">{t(locale, 'Last sample', 'آخر عينة')} {formatTimestamp(controller.lastSampleAt, locale)}</Chip>
        <Chip tone={controller.sampledOnce ? 'good' : 'muted'}>{controller.sampledOnce ? t(locale, 'Sampling observed', 'القياس مرصود') : t(locale, 'Awaiting first sample', 'بانتظار أول عينة')}</Chip>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 18 - Hop Route Visualizer                                                 */
/* ------------------------------------------------------------------------- */

export function TracerouteWorkbench({ locale, controller }: WorkbenchProps) {
  const [target, setTarget] = useState('example.com');
  const [maxHops, setMaxHops] = useState('10');
  const safe = isSafeTargetDraft(target);
  const running = controller.busy === 'traceroute';
  const result = controller.traceroute;

  const run = async () => {
    if (!safe) {
      controller.showNotice(t(locale, 'The trace target contains unsupported characters. Nothing was executed.', 'يحتوي هدف التتبع على محارف غير مدعومة. لم يُنفّذ شيء.'));
      return;
    }
    const value = await controller.traceRoute(sanitizeTargetDraft(target), Number(maxHops));
    if (value) controller.showNotice(t(locale, `Hop trace completed with ${value.hops.length} measured hop(s); reached: ${value.reached ? 'yes' : 'no'}.`, `اكتمل تتبع القفزات مع ${value.hops.length} قفزة مقيسة؛ الوصول: ${value.reached ? 'نعم' : 'لا'}.`));
  };

  const hopLabel = (hop: SystemTracerouteHop): string => hop.address || t(locale, 'Request timed out', 'انتهت مهلة الطلب');

  return (
    <WorkbenchFrame
      id="network-traceroute"
      locale={locale}
      provider="tracert executable, fixed arguments"
      foot={
        <>
          <span><ShieldCheck aria-hidden="true" />{t(locale, 'Trace runs only when you press Trace route.', 'يعمل التتبع فقط عند الضغط على تتبع المسار.')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'Hops are capped at 15; ASN lookup is not performed.', 'القفزات محدودة بـ15؛ لا يُنفّذ بحث ASN.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <label className="sys-inline-input">
          <span>{t(locale, 'Target', 'الهدف')}</span>
          <input className="sys-input" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="example.com" dir="ltr" spellCheck={false} aria-label={t(locale, 'Trace target', 'هدف التتبع')} />
        </label>
        <SelectBox
          value={maxHops}
          onChange={setMaxHops}
          ariaLabel={t(locale, 'Maximum hops', 'أقصى عدد قفزات')}
          options={[5, 8, 10, 12, 15].map((value) => ({ value: String(value), label: `${value} ${t(locale, 'hops', 'قفزة')}` }))}
        />
        <button type="button" className="sys-btn sys-btn-primary" onClick={() => void run()} disabled={!safe || running}>
          {running ? <RefreshCw className="sys-spin" aria-hidden="true" /> : <Route aria-hidden="true" />}
          {t(locale, 'Trace route', 'تتبع المسار')}
        </button>
        <Chip tone={safe ? 'good' : 'bad'} icon={safe ? ShieldCheck : AlertTriangle}>{safe ? t(locale, 'Target validated', 'الهدف متحقق') : t(locale, 'Target rejected', 'الهدف مرفوض')}</Chip>
      </div>

      <div className="sys-split-trace">
        <Panel
          title={t(locale, 'Measured hop ladder', 'سلم القفزات المقيس')}
          sub={result ? `${result.target} · ${formatDuration(result.durationMs / 1000)}` : t(locale, 'No route has been traced', 'لم يُتتبع أي مسار')}
          icon={Waypoints}
          bodyClassName="sys-panel-body-flush"
        >
          {result ? (
            result.hops.length ? (
              <div className="sys-hop-ladder">
                {result.hops.map((hop) => (
                  <div className={cx('sys-hop-row', hop.timedOut && 'is-timeout')} key={hop.hop}>
                    <span className="sys-hop-index">{String(hop.hop).padStart(2, '0')}</span>
                    <span className="sys-hop-line" aria-hidden="true" />
                    <div className="sys-hop-copy">
                      <strong className="sys-mono">{hopLabel(hop)}</strong>
                      <em>{hop.timedOut ? t(locale, 'No response in the bounded window', 'لا استجابة في النافذة المحددة') : `${hop.latencyMs.length} ${t(locale, 'probe(s)', 'فحص')}`}</em>
                    </div>
                    <span className="sys-hop-latency sys-mono">{hop.latencyMs.length ? hop.latencyMs.map((value) => formatMs(value)).join(' · ') : '—'}</span>
                    <Chip tone={hop.timedOut ? 'warn' : 'good'}>{hop.timedOut ? t(locale, 'Timeout', 'مهلة') : t(locale, 'Replied', 'استجاب')}</Chip>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBlock icon={Route} title={t(locale, 'No hop was parsed', 'لم تُحلّل أي قفزة')} message={t(locale, 'tracert returned no addressable hop in the bounded window.', 'لم يُعد tracert أي قفزة قابلة للعنونة في النافذة المحددة.')} />
            )
          ) : (
            <EmptyBlock icon={Route} title={t(locale, 'Ready for an explicit trace', 'جاهز لتتبع صريح')} message={t(locale, 'Enter a validated host and press Trace route. No ICMP packet is sent on page load.', 'أدخل مضيفًا متحققًا واضغط تتبع المسار. لا تُرسل حزمة ICMP عند تحميل الصفحة.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Route summary', 'ملخص المسار')} icon={TimerReset}>
            <DataRows
              rows={[
                { label: t(locale, 'Target', 'الهدف'), value: result?.target || '—', mono: true },
                { label: t(locale, 'Reached', 'تم الوصول'), value: result ? (result.reached ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا')) : '—', tone: result ? (result.reached ? 'good' : 'warn') : 'muted' },
                { label: t(locale, 'Hop limit', 'حد القفزات'), value: result?.maxHops ?? '—' },
                { label: t(locale, 'Measured hops', 'القفزات المقيسة'), value: result ? formatCount(result.hops.length) : '—' },
                { label: t(locale, 'Timeouts', 'المهلات'), value: result ? formatCount(result.hops.filter((hop) => hop.timedOut).length) : '—' },
                { label: t(locale, 'Duration', 'المدة'), value: result ? formatMs(result.durationMs) : '—' },
                { label: t(locale, 'Receipt', 'الإيصال'), value: result?.receipt || '—', mono: true },
              ]}
            />
            {result ? (
              <div className="sys-toolbar-row">
                <CopyButton locale={locale} text={result.receipt} label={t(locale, 'Copy receipt', 'نسخ الإيصال')} />
                <ExportButton
                  fileName="knoux-traceroute.json"
                  payload={result}
                  label={t(locale, 'Export hops', 'تصدير القفزات')}
                  onDone={(ok) => controller.showNotice(ok ? t(locale, 'Trace evidence exported.', 'صُدّدت أدلة التتبع.') : t(locale, 'The trace export could not start.', 'تعذّر بدء تصدير التتبع.'))}
                />
              </div>
            ) : null}
          </Panel>
          <Panel title={t(locale, 'ASN honesty', 'صدق ASN')} icon={Info}>
            <InfoNote tone="muted">
              {t(locale, 'No ASN, ISP name or geolocation is inferred from an address. The asn field stays null unless a future audited provider supplies it.', 'لا يُستنتج ASN أو اسم مزود أو موقع جغرافي من عنوان. يبقى حقل asn فارغًا ما لم يوفره مزود مدقق مستقبلي.')}
            </InfoNote>
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 19 - LAN Topology Map                                                     */
/* ------------------------------------------------------------------------- */

export function TopologyWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const [family, setFamily] = useState<'all' | 'IPv4' | 'IPv6'>('all');
  const [query, setQuery] = useState('');
  const [showRoutes, setShowRoutes] = useState(false);

  const neighbours = useMemo(() => snapshot.neighbors.filter((entry) => {
    if (family !== 'all' && entry.family !== family) return false;
    if (query.trim() && !`${entry.ip} ${entry.mac ?? ''} ${entry.interfaceAlias ?? ''} ${entry.vendor ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  }), [family, query, snapshot.neighbors]);

  const byInterface = useMemo(() => {
    const map = new Map<string, typeof neighbours>();
    for (const entry of neighbours) {
      const key = entry.interfaceAlias || t(locale, 'Unknown interface', 'واجهة مجهولة');
      const list = map.get(key) || [];
      list.push(entry);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [locale, neighbours]);

  const routeList = useMemo(() => snapshot.routes.filter((route) => family === 'all' || (family === 'IPv4' ? !route.destination.includes(':') : route.destination.includes(':'))).slice(0, 120), [family, snapshot.routes]);

  return (
    <WorkbenchFrame
      id="network-topology"
      locale={locale}
      state="partial"
      provider="Get-NetNeighbor + Get-NetRoute"
      foot={
        <>
          <span><Waypoints aria-hidden="true" />{formatCount(snapshot.neighbors.length)} {t(locale, 'observed neighbours', 'جار مرصود')} · {formatCount(snapshot.routes.length)} {t(locale, 'routes', 'مسار')}</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'No subnet sweep, ARP injection or packet capture is performed.', 'لا مسح شبكة فرعية ولا حقن ARP ولا التقاط حزم.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search neighbour IP, MAC or vendor prefix…', 'ابحث في IP الجار أو MAC أو بادئة المصنّع…')} />
        <Seg
          value={family}
          onChange={setFamily}
          ariaLabel={t(locale, 'Address family', 'عائلة العناوين')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All', 'الكل') },
            { value: 'IPv4', label: 'IPv4' },
            { value: 'IPv6', label: 'IPv6' },
          ]}
        />
        <Seg
          value={showRoutes ? 'routes' : 'neighbours'}
          onChange={(value) => setShowRoutes(value === 'routes')}
          ariaLabel={t(locale, 'Topology layer', 'طبقة الطوبولوجيا')}
          compact
          options={[
            { value: 'neighbours', label: t(locale, 'Neighbours', 'الجيران') },
            { value: 'routes', label: t(locale, 'Routes', 'المسارات') },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <Chip tone="info" icon={Info}>{t(locale, 'Observed LAN only', 'شبكة LAN المرصودة فقط')}</Chip>
      </div>

      <div className="sys-mini-row">
        <MiniStat label={t(locale, 'Observed neighbours', 'الجيران المرصودون')} value={formatCount(snapshot.neighbors.length)} icon={Waypoints} />
        <MiniStat label={t(locale, 'Inferred rows', 'الصفوف المستنتجة')} value={formatCount(snapshot.neighbors.filter((entry) => entry.inferred).length)} tone="warn" />
        <MiniStat label={t(locale, 'IPv4 / IPv6', 'IPv4 / IPv6')} value={`${formatCount(snapshot.neighbors.filter((entry) => entry.family === 'IPv4').length)} / ${formatCount(snapshot.neighbors.filter((entry) => entry.family === 'IPv6').length)}`} />
        <MiniStat label={t(locale, 'Default routes', 'المسارات الافتراضية')} value={formatCount(snapshot.routes.filter((route) => route.destination === '0.0.0.0/0' || route.destination === '::/0').length)} />
      </div>

      {showRoutes ? (
        <Panel title={t(locale, 'Measured routing table', 'جدول التوجيه المقيس')} sub={`${formatCount(routeList.length)} ${t(locale, 'route rows', 'صف مسار')}`} icon={Route} bodyClassName="sys-panel-body-flush">
          {routeList.length ? (
            <div className="sys-table-wrap">
              <table className="sys-table">
                <thead>
                  <tr>
                    <th>{t(locale, 'Destination', 'الوجهة')}</th>
                    <th>{t(locale, 'Next hop', 'القفزة التالية')}</th>
                    <th>{t(locale, 'Interface', 'الواجهة')}</th>
                    <th>{t(locale, 'Metric', 'المقياس')}</th>
                  </tr>
                </thead>
                <tbody>
                  {routeList.map((route) => (
                    <tr key={route.id}>
                      <td className="sys-mono">{route.destination}</td>
                      <td className="sys-mono">{route.nextHop || '—'}</td>
                      <td>{route.interfaceAlias || '—'}</td>
                      <td className="sys-mono">{route.metric ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyBlock icon={Route} title={t(locale, 'No route returned', 'لم يُعد مسار')} message={t(locale, 'Get-NetRoute returned no row for this family.', 'لم يُعد Get-NetRoute أي صف لهذه العائلة.')} />
          )}
        </Panel>
      ) : (
        <div className="sys-topology-map">
          {byInterface.map(([alias, entries]) => (
            <section className="sys-topology-lane" key={alias}>
              <header>
                <span className="sys-topology-lane-dot" aria-hidden="true" />
                <strong>{alias}</strong>
                <em>{formatCount(entries.length)} {t(locale, 'observed neighbours', 'جار مرصود')}</em>
              </header>
              <div className="sys-topology-nodes">
                {entries.map((entry) => (
                  <div className={cx('sys-topology-node', entry.inferred && 'is-inferred')} key={entry.id}>
                    <span className="sys-topology-node-led" aria-hidden="true" />
                    <strong className="sys-mono">{entry.ip}</strong>
                    <em className="sys-mono">{entry.mac || t(locale, 'MAC not returned', 'MAC غير متاح')}</em>
                    <div className="sys-topology-node-meta">
                      <span>{entry.state || t(locale, 'State unknown', 'الحالة مجهولة')}</span>
                      <span>{entry.vendor || (entry.mac ? macVendorLabel(entry.mac) : t(locale, 'Vendor unknown', 'المصنّع مجهول'))}</span>
                    </div>
                    <Chip tone={entry.inferred ? 'warn' : 'good'}>{entry.inferred ? t(locale, 'Inferred', 'مستنتج') : t(locale, 'Observed', 'مرصود')}</Chip>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {!byInterface.length ? <EmptyBlock icon={Waypoints} title={t(locale, 'No neighbour matches', 'لا جار مطابق')} message={t(locale, 'The measured neighbour cache is empty for this filter.', 'ذاكرة الجيران المقيسة فارغة لهذا المرشح.')} /> : null}
        </div>
      )}

      <Panel title={t(locale, 'Topology boundary', 'حدود الطوبولوجيا')} icon={Info}>
        <InfoNote tone="muted">
          {t(locale, 'Nodes are entries already present in the Windows neighbour cache. “Inferred” means the MAC or reachable state was not fully reported; it is not a successful discovery probe.', 'العقد هي مدخلات موجودة مسبقًا في ذاكرة جيران Windows. «مستنتج» يعني أن MAC أو حالة الوصول لم تُبلَّغ كاملة؛ وليس فحص اكتشاف ناجحًا.')}
        </InfoNote>
        <div className="sys-toolbar-row">
          <ExportButton
            fileName="knoux-lan-topology.json"
            payload={{ observedAt: snapshot.generatedAt, neighbours, routes: snapshot.routes }}
            label={t(locale, 'Export topology', 'تصدير الطوبولوجيا')}
            onDone={(ok) => controller.showNotice(ok ? t(locale, 'Observed topology exported.', 'صُدّدت الطوبولوجيا المرصودة.') : t(locale, 'The topology export could not start.', 'تعذّر بدء تصدير الطوبولوجيا.'))}
          />
        </div>
      </Panel>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 20 - Active Socket Explorer                                               */
/* ------------------------------------------------------------------------- */

export function SocketsWorkbench({ locale, snapshot, controller, onOpenService }: WorkbenchProps) {
  const [protocol, setProtocol] = useState<'all' | 'TCP' | 'UDP'>('all');
  const [state, setState] = useState<'all' | 'listening' | 'established'>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const pageSize = 40;

  const sockets = useMemo(() => filterSockets(snapshot.sockets, { protocol, state, query }), [protocol, query, snapshot.sockets, state]);
  const pageCount = Math.max(1, Math.ceil(sockets.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const rows = sockets.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const selected = sockets.find((socket) => socketKey(socket) === selectedKey) || rows[0] || null;
  const listening = snapshot.sockets.filter((socket) => socket.state === 'LISTEN').length;
  const established = snapshot.sockets.filter((socket) => socket.state === 'ESTABLISHED').length;

  return (
    <WorkbenchFrame
      id="network-ports"
      locale={locale}
      provider="Get-NetTCPConnection + Get-NetUDPEndpoint"
      foot={
        <>
          <span><PlugZap aria-hidden="true" />{formatCount(snapshot.sockets.length)} {t(locale, 'measured endpoints', 'نقطة مقيسة')} · {t(locale, 'cap', 'الحد')} 420</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'No socket is closed, blocked or re-bound.', 'لا يُغلق أي مقبس أو يُحظر أو يُعاد ربطه.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={(value) => { setQuery(value); setPage(0); }} placeholder={t(locale, 'Search address, port, process or PID…', 'ابحث في العنوان أو المنفذ أو العملية أو PID…')} />
        <Seg
          value={protocol}
          onChange={(value) => { setProtocol(value); setPage(0); }}
          ariaLabel={t(locale, 'Socket protocol', 'بروتوكول المقبس')}
          compact
          options={[
            { value: 'all', label: t(locale, 'All', 'الكل') },
            { value: 'TCP', label: 'TCP' },
            { value: 'UDP', label: 'UDP' },
          ]}
        />
        <Seg
          value={state}
          onChange={(value) => { setState(value); setPage(0); }}
          ariaLabel={t(locale, 'Socket state', 'حالة المقبس')}
          compact
          options={[
            { value: 'all', label: t(locale, 'Any state', 'أي حالة') },
            { value: 'listening', label: t(locale, 'Listening', 'يستمع') },
            { value: 'established', label: t(locale, 'Established', 'مؤسس') },
          ]}
        />
      </div>

      <div className="sys-mini-row">
        <MiniStat label="TCP" value={formatCount(snapshot.sockets.filter((socket) => socket.protocol === 'TCP').length)} tone="info" />
        <MiniStat label="UDP" value={formatCount(snapshot.sockets.filter((socket) => socket.protocol === 'UDP').length)} />
        <MiniStat label={t(locale, 'Listening', 'يستمع')} value={formatCount(listening)} />
        <MiniStat label={t(locale, 'Established', 'مؤسس')} value={formatCount(established)} tone="good" />
      </div>

      <div className="sys-split-ledger">
        <Panel
          className="sys-ledger-panel"
          title={t(locale, 'Socket explorer', 'مستكشف المقابس')}
          sub={`${formatCount(sockets.length)} ${t(locale, 'matching', 'مطابق')} · ${t(locale, 'page', 'صفحة')} ${safePage + 1}/${pageCount}`}
          icon={PlugZap}
          bodyClassName="sys-panel-body-flush"
        >
          {rows.length ? (
            <>
              <div className="sys-table-wrap">
                <table className="sys-table">
                  <thead>
                    <tr>
                      <th>{t(locale, 'Proto', 'البروتو')}</th>
                      <th>{t(locale, 'Local', 'المحلي')}</th>
                      <th>{t(locale, 'Remote', 'البعيد')}</th>
                      <th>{t(locale, 'State', 'الحالة')}</th>
                      <th>{t(locale, 'Process', 'العملية')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((socket) => (
                      <tr
                        key={socket.id}
                        className={cx(selected && socketKey(selected) === socketKey(socket) && 'is-selected')}
                        onClick={() => setSelectedKey(socketKey(socket))}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedKey(socketKey(socket));
                          }
                        }}
                        aria-selected={selected ? socketKey(selected) === socketKey(socket) : false}
                      >
                        <td><Chip tone={socket.protocol === 'TCP' ? 'info' : 'violet'}>{socket.protocol}</Chip></td>
                        <td className="sys-mono">{socket.localAddress}:{socket.localPort ?? '—'}</td>
                        <td className="sys-mono">{socket.remoteAddress ? `${socket.remoteAddress}:${socket.remotePort ?? '—'}` : '—'}</td>
                        <td>{socket.state || '—'}</td>
                        <td>
                          <strong className="sys-row-name">{socket.processName || t(locale, 'Unresolved', 'غير محلول')}</strong>
                          <span className="sys-row-sub sys-mono">{socket.pid ?? '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sys-pager">
                <button type="button" className="sys-btn sys-btn-quiet" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={safePage === 0}>{t(locale, 'Previous', 'السابق')}</button>
                <span>{formatCount(safePage * pageSize + 1)}–{formatCount(Math.min(sockets.length, (safePage + 1) * pageSize))} / {formatCount(sockets.length)}</span>
                <button type="button" className="sys-btn sys-btn-quiet" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={safePage >= pageCount - 1}>{t(locale, 'Next', 'التالي')}</button>
              </div>
            </>
          ) : (
            <EmptyBlock icon={Search} title={t(locale, 'No endpoint matches', 'لا نقطة مطابقة')} message={t(locale, 'Clear the protocol, state or search filter.', 'امسح مرشح البروتوكول أو الحالة أو البحث.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Endpoint dossier', 'ملف النقطة')} sub={selected ? `${selected.protocol} ${selected.localPort ?? ''}` : undefined} icon={PlugZap}>
            {selected ? (
              <>
                <KeyValueGrid>
                  <Field label={t(locale, 'Local endpoint', 'النقطة المحلية')} value={`${selected.localAddress}:${selected.localPort ?? '—'}`} mono />
                  <Field label={t(locale, 'Remote endpoint', 'النقطة البعيدة')} value={selected.remoteAddress ? `${selected.remoteAddress}:${selected.remotePort ?? '—'}` : '—'} mono />
                  <Field label={t(locale, 'State', 'الحالة')} value={selected.state || '—'} />
                  <Field label={t(locale, 'PID', 'PID')} value={selected.pid ?? '—'} mono />
                  <Field label={t(locale, 'Process', 'العملية')} value={selected.processName || t(locale, 'Not resolved', 'غير محلول')} />
                  <Field label={t(locale, 'Created', 'أُنشئ')} value={formatTimestamp(selected.createdAt, locale)} />
                  <Field label={t(locale, 'Process path', 'مسار العملية')} value={selected.processPath || t(locale, 'Not returned', 'لم يُعد')} mono className="sys-span-2" />
                  <Field label={t(locale, 'Source', 'المصدر')} value={selected.source} className="sys-span-2" />
                </KeyValueGrid>
                <div className="sys-toolbar-row">
                  <CopyButton locale={locale} text={`${selected.localAddress}:${selected.localPort ?? ''}`} label={t(locale, 'Copy endpoint', 'نسخ النقطة')} />
                  <button type="button" className="sys-btn sys-btn-quiet" onClick={() => onOpenService('system-processes')}>
                    <CpuIcon />
                    {t(locale, 'Inspect process register', 'فحص سجل العمليات')}
                  </button>
                </div>
              </>
            ) : (
              <EmptyBlock compact icon={PlugZap} title={t(locale, 'No endpoint selected', 'لا نقطة محددة')} message={t(locale, 'Select a measured socket row.', 'اختر صف مقبس مقيسًا.')} />
            )}
          </Panel>
          <Panel title={t(locale, 'Owner resolution', 'حل المالك')} icon={Info}>
            <MeterBar label={t(locale, 'Resolved owners', 'المالكون المحلولون')} value={snapshot.sockets.filter((socket) => socket.pid != null && socket.processName).length} max={Math.max(1, snapshot.sockets.length)} caption={`${formatCount(snapshot.sockets.filter((socket) => socket.pid != null && socket.processName).length)} / ${formatCount(snapshot.sockets.length)}`} tone="info" />
            <InfoNote tone="muted">
              {t(locale, 'A socket whose PID cannot be matched to the bounded process list is shown as unresolved. The process is never guessed from a port number.', 'يُعرض المقبس الذي لا يمكن مطابقة PID الخاص به بقائمة العمليات المحدودة كغير محلول. لا تُخمّن العملية من رقم المنفذ.')}
            </InfoNote>
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

function CpuIcon() {
  return <Layers aria-hidden="true" />;
}

/* ------------------------------------------------------------------------- */
/* 21 - Wi-Fi Signal Instrument                                              */
/* ------------------------------------------------------------------------- */

export function WifiWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const wifi = snapshot.wifi;
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const profile = wifi.profiles.find((entry) => entry.name === selectedProfile) || wifi.profiles[0] || null;
  const active = wifi.state === 'connected';

  return (
    <WorkbenchFrame
      id="network-wifi"
      locale={locale}
      state="partial"
      provider="netsh wlan show interfaces / profiles"
      foot={
        <>
          <span><Wifi aria-hidden="true" />{wifi.available ? t(locale, 'WLAN provider answered', 'استجاب مزود WLAN') : t(locale, 'WLAN provider unavailable', 'مزود WLAN غير متاح')}</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'Connect, disconnect and profile edits are not exposed.', 'الاتصال والقطع وتعديل الملفات الشخصية غير متاحة.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Chip tone={active ? 'good' : wifi.state === 'unsupported' ? 'muted' : 'warn'} icon={Wifi}>{wifi.state}</Chip>
        <span className="sys-toolbar-spacer" />
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.openSettings('wifi')} disabled={controller.busy === 'settings'}>
          <Wrench aria-hidden="true" />
          {t(locale, 'Windows Wi-Fi settings', 'إعدادات Wi-Fi في Windows')}
        </button>
      </div>

      <div className="sys-wifi-hero">
        <div className="sys-wifi-signal">
          <Gauge value={wifi.signalPercent} label={t(locale, 'Signal', 'الإشارة')} sub={wifi.rssiDbm == null ? undefined : `${wifi.rssiDbm} dBm`} color="#f472b6" size={148} />
          <div className="sys-wifi-identity">
            <span>{t(locale, 'Connected network', 'الشبكة المتصلة')}</span>
            <strong>{wifi.ssid || t(locale, 'No SSID returned', 'لم يُعد SSID')}</strong>
            <em>{wifi.adapterName || t(locale, 'Adapter not reported', 'المحول غير مبلّغ')}</em>
            <div className="sys-wifi-chips">
              <Chip tone="info">{wifi.radioType || t(locale, 'Radio unknown', 'الراديو مجهول')}</Chip>
              <Chip tone="violet">{wifi.band || t(locale, 'Band unknown', 'النطاق مجهول')}</Chip>
              <Chip tone="muted">{wifi.channel == null ? t(locale, 'Channel unknown', 'القناة مجهولة') : `${t(locale, 'Channel', 'القناة')} ${wifi.channel}`}</Chip>
            </div>
          </div>
        </div>
        <div className="sys-wifi-facts">
          <KeyValueGrid>
            <Field label={t(locale, 'SSID', 'SSID')} value={wifi.ssid || '—'} />
            <Field label={t(locale, 'BSSID', 'BSSID')} value={wifi.bssid || '—'} mono />
            <Field label={t(locale, 'Receive rate', 'معدل الاستقبال')} value={wifi.receiveRateMbps == null ? '—' : `${wifi.receiveRateMbps} Mbps`} />
            <Field label={t(locale, 'Transmit rate', 'معدل الإرسال')} value={wifi.transmitRateMbps == null ? '—' : `${wifi.transmitRateMbps} Mbps`} />
            <Field label={t(locale, 'Authentication', 'المصادقة')} value={wifi.authentication || '—'} />
            <Field label={t(locale, 'Cipher', 'التشفير')} value={wifi.cipher || '—'} />
            <Field label={t(locale, 'Source', 'المصدر')} value={wifi.source} className="sys-span-2" />
          </KeyValueGrid>
        </div>
      </div>

      {!wifi.available || wifi.state === 'unsupported' || wifi.state === 'unavailable' ? (
        <InfoNote tone="warn">
          <strong>{t(locale, 'Measured unavailability', 'عدم توفر مقيس')}</strong>
          <span>{wifi.reason || t(locale, 'The WLAN service did not expose radio state to this process. No signal value is simulated.', 'لم تكشف خدمة WLAN حالة الراديو لهذه العملية. لا تُحاكى قيمة إشارة.')}</span>
        </InfoNote>
      ) : null}

      <div className="sys-split-2">
        <Panel title={t(locale, 'Known Wi-Fi profiles', 'ملفات Wi-Fi المعروفة')} sub={`${formatCount(wifi.profiles.length)} ${t(locale, 'profiles', 'ملف شخصي')}`} icon={Wifi} bodyClassName="sys-panel-body-flush">
          {wifi.profiles.length ? (
            <div className="sys-profile-list">
              {wifi.profiles.map((entry) => (
                <button
                  type="button"
                  key={entry.name}
                  className={cx('sys-profile-row', profile?.name === entry.name && 'is-active')}
                  onClick={() => setSelectedProfile(entry.name)}
                >
                  <span className="sys-profile-glyph" aria-hidden="true"><Wifi /></span>
                  <span className="sys-profile-copy">
                    <strong>{entry.name}</strong>
                    <em>{entry.authentication || t(locale, 'Auth unknown', 'المصادقة مجهولة')} · {entry.encryption || t(locale, 'Encryption unknown', 'التشفير مجهول')}</em>
                  </span>
                  <Chip tone="muted">{entry.connectionMode || t(locale, 'Mode unknown', 'الوضع مجهول')}</Chip>
                </button>
              ))}
            </div>
          ) : (
            <EmptyBlock icon={Wifi} title={t(locale, 'No profile returned', 'لم يُعد ملف شخصي')} message={t(locale, 'netsh wlan show profiles returned no saved profile for this user.', 'لم يُعد netsh wlan show profiles أي ملف محفوظ لهذا المستخدم.')} />
          )}
        </Panel>
        <Panel title={t(locale, 'Selected profile', 'الملف المحدد')} sub={profile?.name} icon={ShieldCheck}>
          {profile ? (
            <>
              <DataRows
                rows={[
                  { label: t(locale, 'Name', 'الاسم'), value: profile.name },
                  { label: t(locale, 'Connection mode', 'وضع الاتصال'), value: profile.connectionMode || '—' },
                  { label: t(locale, 'Authentication', 'المصادقة'), value: profile.authentication || '—' },
                  { label: t(locale, 'Encryption', 'التشفير'), value: profile.encryption || '—' },
                ]}
              />
              <InfoNote tone="muted">
                {t(locale, 'Profile contents are not expanded into keys or passwords. The provider returns metadata only.', 'لا تُوسّع محتويات الملف الشخصي إلى مفاتيح أو كلمات مرور. يعيد المزود بيانات وصفية فقط.')}
              </InfoNote>
            </>
          ) : (
            <EmptyBlock compact icon={Wifi} title={t(locale, 'No profile selected', 'لا ملف محدد')} message={t(locale, 'Select a measured Wi-Fi profile.', 'اختر ملف Wi-Fi مقيسًا.')} />
          )}
        </Panel>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 22 - Windows Hosts Inspector                                              */
/* ------------------------------------------------------------------------- */

export function HostsWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const hosts = snapshot.hosts;
  const [query, setQuery] = useState('');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [mode, setMode] = useState<HostsDraft['mode']>('comment');
  const [ip, setIp] = useState('127.0.0.1');
  const [hostnames, setHostnames] = useState('knoux.local');
  const [note, setNote] = useState('');

  const entries = useMemo(() => hosts.entries.filter((entry) => {
    if (!query.trim()) return true;
    return `${entry.ip ?? ''} ${entry.hostnames.join(' ')} ${entry.raw}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [hosts.entries, query]);

  const selected = hosts.entries.find((entry) => entry.lineNumber === selectedLine) || null;
  const plan = controller.hostsPlan;
  const busy = controller.busy === 'hosts';
  const canStage = hostnameList().length > 0 && (mode === 'add' || selected != null);

  function hostnameList(): string[] {
    return hostnames.split(/[\s,]+/).map((value) => value.trim()).filter(Boolean);
  }

  const stage = async () => {
    const draft: HostsDraft = mode === 'add'
      ? { mode, ip: ip.trim(), hostnames: hostnameList(), ...(note.trim() ? { note: note.trim() } : {}) }
      : { mode, lineNumber: selected?.lineNumber, ...(mode === 'replace' ? { ip: ip.trim(), hostnames: hostnameList() } : {}), ...(note.trim() ? { note: note.trim() } : {}) };
    if (!canStage) {
      controller.showNotice(t(locale, 'Select a hosts line or provide an IP and hostnames before staging.', 'حدد سطر hosts أو قدّم عنوان IP وأسماء مضيفين قبل التهيئة.'));
      return;
    }
    const result = await controller.stageHosts(draft);
    if (result) controller.showNotice(result.allowed ? t(locale, 'Immutable hosts preview staged. Nothing was written.', 'هُيّئت معاينة hosts الثابتة. لم يُكتب شيء.') : t(locale, 'The hosts preview was rejected; review its warnings.', 'رُفضت معاينة hosts؛ راجع تحذيراتها.'));
  };

  const modes: Array<{ value: HostsDraft['mode']; en: string; ar: string }> = [
    { value: 'comment', en: 'Comment', ar: 'تعليق' },
    { value: 'uncomment', en: 'Uncomment', ar: 'إلغاء التعليق' },
    { value: 'replace', en: 'Replace', ar: 'استبدال' },
    { value: 'add', en: 'Add', ar: 'إضافة' },
  ];

  return (
    <WorkbenchFrame
      id="network-hosts"
      locale={locale}
      state="gated"
      provider={hosts.path}
      foot={
        <>
          <span><FileCode2 aria-hidden="true" />{formatCount(hosts.totalLines)} {t(locale, 'lines', 'سطر')} · {formatCount(hosts.activeMappings)} {t(locale, 'active mappings', 'تعيين نشط')}</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'Draft previews are immutable. File writing remains gated.', 'معاينات المسودات ثابتة. كتابة الملف تبقى محمية.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <SearchBox value={query} onChange={setQuery} placeholder={t(locale, 'Search IP, hostname or comment…', 'ابحث في IP أو اسم المضيف أو التعليق…')} />
        <Chip tone={hosts.readable ? 'good' : 'bad'}>{hosts.readable ? t(locale, 'Readable', 'مقروء') : t(locale, 'Unreadable', 'غير مقروء')}</Chip>
        <CopyButton locale={locale} text={hosts.path} label={t(locale, 'Copy path', 'نسخ المسار')} />
        <CopyButton locale={locale} text={hosts.sha256} label={t(locale, 'Copy SHA-256', 'نسخ SHA-256')} />
        <span className="sys-toolbar-spacer" />
        <Chip tone="muted">{formatTimestamp(hosts.lastWriteTime, locale)}</Chip>
      </div>

      <div className="sys-hosts-layout">
        <Panel
          className="sys-ledger-panel"
          title={t(locale, 'Hosts file map', 'خريطة ملف hosts')}
          sub={`${formatCount(entries.length)} / ${formatCount(hosts.entries.length)} ${t(locale, 'lines', 'سطر')}`}
          icon={FileCode2}
          bodyClassName="sys-panel-body-flush"
        >
          {hosts.readable ? (
            <div className="sys-hosts-list" role="listbox" aria-label={t(locale, 'Measured hosts lines', 'أسطر hosts المقيسة')}>
              {entries.map((entry) => (
                <button
                  type="button"
                  key={entry.lineNumber}
                  role="option"
                  aria-selected={selectedLine === entry.lineNumber}
                  className={cx('sys-hosts-row', selectedLine === entry.lineNumber && 'is-active', entry.active && 'is-active-mapping')}
                  onClick={() => { setSelectedLine(entry.lineNumber); if (entry.active && mode === 'comment') setIp(entry.ip || ip); }}
                  title={entry.raw}
                >
                  <span className="sys-hosts-line">{entry.lineNumber}</span>
                  <span className="sys-hosts-raw sys-mono">{entry.raw || ' '}</span>
                  <Chip tone={entry.active ? 'good' : 'muted'}>{entry.active ? t(locale, 'Active', 'نشط') : t(locale, 'Inactive', 'غير نشط')}</Chip>
                </button>
              ))}
              {!entries.length ? <EmptyBlock compact icon={Search} title={t(locale, 'No hosts line matches', 'لا سطر hosts مطابق')} message={t(locale, 'Clear the search to see all measured lines.', 'امسح البحث لعرض كل الأسطر المقيسة.')} /> : null}
            </div>
          ) : (
            <EmptyBlock icon={ShieldAlert} title={t(locale, 'Hosts file not readable', 'ملف hosts غير مقروء')} message={hosts.reason || t(locale, 'Windows denied read access to the hosts file.', 'رفض Windows وصول القراءة إلى ملف hosts.')} />
          )}
        </Panel>

        <div className="sys-stack">
          <Panel title={t(locale, 'Immutable draft', 'مسودة ثابتة')} sub={t(locale, 'Staging returns a preview only.', 'التهيئة تعيد معاينة فقط.')} icon={ShieldCheck}>
            <div className="sys-toolbar-row">
              <Seg
                value={mode}
                onChange={setMode}
                ariaLabel={t(locale, 'Draft mode', 'وضع المسودة')}
                compact
                options={modes.map((entry) => ({ value: entry.value, label: locale === AR ? entry.ar : entry.en }))}
              />
            </div>
            <div className="sys-form-grid">
              {mode !== 'comment' && mode !== 'uncomment' ? (
                <label className="sys-field sys-field-edit">
                  <span className="sys-field-label">{t(locale, 'IP address', 'عنوان IP')}</span>
                  <input className="sys-input" value={ip} onChange={(event) => setIp(event.target.value)} dir="ltr" spellCheck={false} aria-label={t(locale, 'Draft IP address', 'عنوان IP للمسودة')} />
                </label>
              ) : null}
              {mode !== 'comment' && mode !== 'uncomment' ? (
                <label className="sys-field sys-field-edit">
                  <span className="sys-field-label">{t(locale, 'Hostnames', 'أسماء المضيفين')}</span>
                  <input className="sys-input" value={hostnames} onChange={(event) => setHostnames(event.target.value)} dir="ltr" spellCheck={false} aria-label={t(locale, 'Draft hostnames', 'أسماء المضيفين للمسودة')} />
                </label>
              ) : null}
              <label className="sys-field sys-field-edit">
                <span className="sys-field-label">{t(locale, 'Note', 'ملاحظة')}</span>
                <input className="sys-input" value={note} onChange={(event) => setNote(event.target.value)} aria-label={t(locale, 'Draft note', 'ملاحظة المسودة')} />
              </label>
            </div>
            <div className="sys-toolbar-row">
              <span className="sys-muted-text">
                {mode === 'add' || mode === 'replace'
                  ? `${ip || '—'} → ${hostnameList().join(' ') || '—'}`
                  : selected
                    ? `${t(locale, 'Line', 'سطر')} ${selected.lineNumber}: ${selected.raw}`
                    : t(locale, 'Select a hosts line', 'حدد سطر hosts')}
              </span>
              <button type="button" className="sys-btn sys-btn-primary" onClick={() => void stage()} disabled={!canStage || busy || !hosts.readable}>
                {busy ? <RefreshCw className="sys-spin" aria-hidden="true" /> : <FileCode2 aria-hidden="true" />}
                {t(locale, 'Stage preview', 'تهيئة المعاينة')}
              </button>
            </div>
            <InfoNote tone="muted">
              {t(locale, 'The native bridge validates the mode, line number, IP and up to twelve hostnames. It returns before/after lines, counts and warnings; the write execution object is always unavailable.', 'يتحقق الجسر الأصلي من الوضع ورقم السطر وIP وحتى اثني عشر اسم مضيف. يعيد الأسطر قبل/بعد والعدادات والتحذيرات؛ كائن تنفيذ الكتابة غير متاح دائمًا.')}
            </InfoNote>
          </Panel>

          <Panel title={t(locale, 'Staged plan', 'الخطة المهيأة')} sub={plan ? `${plan.receipt} · ${formatTimestamp(plan.stagedAt, locale)}` : undefined} icon={Database}>
            {plan ? (
              <>
                <DataRows
                  rows={[
                    { label: t(locale, 'Allowed', 'مسموح'), value: plan.allowed ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا'), tone: plan.allowed ? 'good' : 'bad' },
                    { label: t(locale, 'Added lines', 'أسطر مضافة'), value: formatCount(plan.addedLines) },
                    { label: t(locale, 'Removed lines', 'أسطر محذوفة'), value: formatCount(plan.removedLines) },
                    { label: t(locale, 'Execution', 'التنفيذ'), value: t(locale, 'Unavailable', 'غير متاح'), tone: 'bad' },
                  ]}
                />
                {plan.warnings.length ? (
                  <InfoNote tone="warn">{plan.warnings.join(' ')}</InfoNote>
                ) : null}
                <div className="sys-diff">
                  {plan.after.map((line, index) => {
                    const before = plan.before[index];
                    const changed = before !== line;
                    return (
                      <div className={cx('sys-diff-row', changed && 'is-changed')} key={`${index}-${line}`}>
                        <span className="sys-diff-line">{index + 1}</span>
                        <span className="sys-diff-mark">{changed ? '±' : ' '}</span>
                        <span className="sys-diff-text sys-mono">{line || ' '}</span>
                      </div>
                    );
                  })}
                </div>
                <CodeBlock label={t(locale, 'Execution gate', 'بوابة التنفيذ')}>{plan.execution.reason}</CodeBlock>
                <div className="sys-toolbar-row">
                  <CopyButton locale={locale} text={plan.receipt} label={t(locale, 'Copy receipt', 'نسخ الإيصال')} />
                  <ExportButton
                    fileName="knoux-hosts-plan.json"
                    payload={plan}
                    label={t(locale, 'Export preview', 'تصدير المعاينة')}
                    onDone={(ok) => controller.showNotice(ok ? t(locale, 'Immutable hosts preview exported.', 'صُدّدت معاينة hosts الثابتة.') : t(locale, 'The preview export could not start.', 'تعذّر بدء تصدير المعاينة.'))}
                  />
                </div>
              </>
            ) : (
              <EmptyBlock compact icon={FileCode2} title={t(locale, 'No preview staged', 'لا معاينة مهيأة')} message={t(locale, 'Select a line or add a mapping, then stage an immutable preview.', 'حدد سطرًا أو أضف تعيينًا ثم هيّئ معاينة ثابتة.')} />
            )}
          </Panel>
        </div>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 23 - Proxy & WinHTTP Graph                                                */
/* ------------------------------------------------------------------------- */

export function ProxiesWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const proxies = snapshot.proxies;
  const [lane, setLane] = useState<string | null>(null);
  const selected = proxies.lanes.find((entry) => entry.lane === lane) || proxies.lanes[0] || null;

  return (
    <WorkbenchFrame
      id="network-proxies"
      locale={locale}
      provider="Internet Settings + netsh winhttp"
      foot={
        <>
          <span><Split aria-hidden="true" />{formatCount(proxies.lanes.length)} {t(locale, 'measured lanes', 'مسار مقيس')} · {t(locale, 'effective', 'الفعال')}: {proxies.effective}</span>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'No proxy value is written or toggled.', 'لا تُكتب أي قيمة وكيل أو تُبدّل.')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Chip tone={proxies.effective === 'direct' ? 'good' : proxies.effective === 'unknown' ? 'muted' : 'warn'} icon={Split}>
          {t(locale, 'Effective', 'الفعال')}: {proxies.effective}
        </Chip>
        <span className="sys-toolbar-spacer" />
        <button type="button" className="sys-btn sys-btn-quiet" onClick={() => void controller.openSettings('network')} disabled={controller.busy === 'settings'}>
          <Wrench aria-hidden="true" />
          {t(locale, 'Windows network settings', 'إعدادات الشبكة في Windows')}
        </button>
      </div>

      <div className="sys-proxy-lanes">
        {proxies.lanes.map((entry) => (
          <button
            type="button"
            key={entry.lane}
            className={cx('sys-proxy-card', selected?.lane === entry.lane && 'is-active')}
            onClick={() => setLane(entry.lane)}
          >
            <span className={cx('sys-proxy-led', entry.enabled ? 'is-live' : 'is-idle')} aria-hidden="true" />
            <span className="sys-proxy-lane">{entry.lane}</span>
            <strong>{entry.enabled == null ? t(locale, 'Unknown', 'مجهول') : entry.enabled ? t(locale, 'Enabled', 'ممكّن') : t(locale, 'Direct', 'مباشر')}</strong>
            <em className="sys-mono">{entry.proxyServer || t(locale, 'No proxy server', 'لا خادم وكيل')}</em>
            <span className="sys-proxy-source">{entry.source}</span>
          </button>
        ))}
      </div>

      <div className="sys-split-2">
        <Panel title={t(locale, 'Lane dossier', 'ملف المسار')} sub={selected?.lane} icon={Split}>
          {selected ? (
            <>
              <KeyValueGrid>
                <Field label={t(locale, 'Enabled', 'ممكّن')} value={selected.enabled == null ? t(locale, 'Unknown', 'مجهول') : selected.enabled ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا')} tone={selected.enabled ? 'warn' : 'good'} />
                <Field label={t(locale, 'Auto-detect', 'اكتشاف تلقائي')} value={selected.autoDetect == null ? t(locale, 'Unknown', 'مجهول') : selected.autoDetect ? t(locale, 'On', 'مفعّل') : t(locale, 'Off', 'معطّل')} />
                <Field label={t(locale, 'Proxy server', 'خادم الوكيل')} value={selected.proxyServer || '—'} mono />
                <Field label={t(locale, 'Bypass list', 'قائمة التجاوز')} value={selected.bypassList || '—'} />
                <Field label={t(locale, 'PAC URL', 'رابط PAC')} value={selected.autoConfigUrl || '—'} mono className="sys-span-2" />
                <Field label={t(locale, 'Provenance', 'المصدر')} value={selected.provenance} className="sys-span-2" />
                <Field label={t(locale, 'Provider', 'المزود')} value={selected.source} className="sys-span-2" />
              </KeyValueGrid>
              <CopyButton locale={locale} text={selected.proxyServer} label={t(locale, 'Copy proxy server', 'نسخ خادم الوكيل')} />
            </>
          ) : (
            <EmptyBlock compact icon={Split} title={t(locale, 'No lane selected', 'لا مسار محدد')} message={t(locale, 'Select a measured proxy lane.', 'اختر مسار وكيل مقيسًا.')} />
          )}
        </Panel>
        <Panel title={t(locale, 'Provenance graph', 'رسم المصدر')} icon={Waypoints}>
          <div className="sys-proxy-graph">
            {proxies.lanes.map((entry) => (
              <div className="sys-proxy-graph-row" key={entry.lane}>
                <span className={cx('sys-proxy-graph-node', entry.enabled ? 'is-live' : 'is-idle')} aria-hidden="true" />
                <span className="sys-proxy-graph-copy">
                  <strong>{entry.lane}</strong>
                  <em>{entry.provenance}</em>
                </span>
                <Chip tone={entry.enabled ? 'warn' : 'muted'}>{entry.enabled == null ? 'unknown' : entry.enabled ? 'on' : 'off'}</Chip>
              </div>
            ))}
          </div>
          {proxies.warnings.length ? <InfoNote tone="warn">{proxies.warnings.join(' ')}</InfoNote> : null}
          <InfoNote tone="muted">
            {t(locale, 'WinINET is read from the current-user Internet Settings key. WinHTTP is parsed from netsh output. WPAD reports only the measured auto-detect flag; no PAC discovery request is made.', 'يُقرأ WinINET من مفتاح إعدادات الإنترنت للمستخدم الحالي. ويُحلّل WinHTTP من مخرجات netsh. يبلّغ WPAD فقط عن علم الاكتشاف التلقائي المقيس؛ ولا يُنفّذ طلب اكتشاف PAC.')}
          </InfoNote>
          <ExportButton
            fileName="knoux-proxy-lanes.json"
            payload={proxies}
            label={t(locale, 'Export proxy evidence', 'تصدير أدلة الوكيل')}
            onDone={(ok) => controller.showNotice(ok ? t(locale, 'Proxy lane evidence exported.', 'صُدّدت أدلة مسارات الوكيل.') : t(locale, 'The proxy export could not start.', 'تعذّر بدء تصدير الوكيل.'))}
          />
        </Panel>
      </div>
    </WorkbenchFrame>
  );
}

/* ------------------------------------------------------------------------- */
/* 24 - Network Recovery Preview                                             */
/* ------------------------------------------------------------------------- */

export function RepairPreviewWorkbench({ locale, snapshot, controller }: WorkbenchProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(['flush-dns']));
  const [preview, setPreview] = useState<null | { id: string; createdAt: string; steps: Array<{ id: string; title: string; command: string; impact: string; needsReboot: boolean }> }>(null);
  const [elevated, setElevated] = useState(false);

  const steps = [
    { id: 'flush-dns', en: 'Flush DNS resolver cache', ar: 'مسح ذاكرة محلل DNS', command: 'ipconfig /flushdns', impact: 'Clears cached name resolutions. Active connections are unaffected.', arImpact: 'يمسح حلول الأسماء المخزنة. لا يؤثر على الاتصالات النشطة.', reboot: false },
    { id: 'renew-dhcp', en: 'Renew DHCP leases', ar: 'تجديد عقود DHCP', command: 'ipconfig /release && ipconfig /renew', impact: 'Drops and reacquires addresses; connectivity is interrupted.', arImpact: 'يسقط العناوين ويعيد الحصول عليها؛ ينقطع الاتصال.', reboot: false },
    { id: 'reset-winsock', en: 'Reset Winsock catalog', ar: 'إعادة تعيين كتالوج Winsock', command: 'netsh winsock reset', impact: 'Requires an elevated shell and a restart; LSPs are removed.', arImpact: 'يتطلب صدفة مرتفعة وإعادة تشغيل؛ تُزال LSPs.', reboot: true },
    { id: 'reset-tcpip', en: 'Reset TCP/IP stack', ar: 'إعادة تعيين مكدس TCP/IP', command: 'netsh int ip reset', impact: 'Requires an elevated shell and a restart; network configuration may be rewritten.', arImpact: 'يتطلب صدفة مرتفعة وإعادة تشغيل؛ قد تُعاد كتابة إعدادات الشبكة.', reboot: true },
  ] as const;

  const chosen = steps.filter((step) => selected.has(step.id));
  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const prepare = () => {
    setPreview({
      id: `repair-preview-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      steps: chosen.map((step) => ({ id: step.id, title: step.en, command: step.command, impact: step.impact, needsReboot: step.reboot })),
    });
    controller.showNotice(t(locale, 'A read-only recovery preview was assembled. No command was executed.', 'جُمعت معاينة استعادة للقراءة فقط. لم يُنفّذ أي أمر.'));
  };
  const before = snapshot.interfaces.filter((entry) => String(entry.status).toLowerCase() === 'up').length;

  return (
    <WorkbenchFrame
      id="network-repair-link"
      locale={locale}
      state="gated"
      provider="Local gated preview over measured evidence"
      foot={
        <>
          <span><ShieldAlert aria-hidden="true" />{t(locale, 'Execution is not exposed. This page builds a preview only.', 'التنفيذ غير متاح. تبني هذه الصفحة معاينة فقط.')}</span>
          <span><Info aria-hidden="true" />{t(locale, 'No command is dispatched to a shell.', 'لا يُرسل أي أمر إلى صدفة.')}</span>
        </>
      }
    >
      <div className="sys-repair-hero">
        <div>
          <span>{t(locale, 'Recovery preview', 'معاينة الاستعادة')}</span>
          <h3>{t(locale, 'Stage a network recovery plan without executing it.', 'هيّئ خطة استعادة شبكة دون تنفيذها.')}</h3>
          <p>{t(locale, 'Select the steps you would consider, inspect the exact commands and gate conditions, then export the preview for approval. Nothing on this page can run them.', 'حدد الخطوات التي قد تنظر فيها، وافحص الأوامر وشروط البوابة بدقة، ثم صدّر المعاينة للموافقة. لا شيء في هذه الصفحة يمكنه تشغيلها.')}</p>
        </div>
        <div className="sys-repair-evidence">
          <MiniStat label={t(locale, 'Up interfaces now', 'الواجهات المتصلة الآن')} value={`${formatCount(before)} / ${formatCount(snapshot.interfaces.length)}`} />
          <MiniStat label={t(locale, 'Physical adapters', 'المحولات الفعلية')} value={formatCount(snapshot.interfaces.filter((entry) => interfaceKind(entry) === 'physical').length)} />
          <MiniStat label={t(locale, 'Neighbours observed', 'الجيران المرصودون')} value={formatCount(snapshot.neighbors.length)} />
        </div>
      </div>

      <div className="sys-repair-grid">
        {steps.map((step) => (
          <label className={cx('sys-repair-step', selected.has(step.id) && 'is-selected')} key={step.id}>
            <input type="checkbox" checked={selected.has(step.id)} onChange={() => toggle(step.id)} />
            <span className="sys-repair-check" aria-hidden="true"><CheckCircle2 /></span>
            <div className="sys-repair-copy">
              <strong>{locale === AR ? step.ar : step.en}</strong>
              <em>{locale === AR ? step.arImpact : step.impact}</em>
              <code className="sys-mono">{step.command}</code>
              <span className="sys-repair-flags">
                <Chip tone="bad">ADMIN</Chip>
                {step.reboot ? <Chip tone="warn">{t(locale, 'REBOOT', 'إعادة تشغيل')}</Chip> : null}
              </span>
            </div>
          </label>
        ))}
      </div>

      <div className="sys-toolbar-row">
        <Toggle checked={elevated} onChange={setElevated} label={t(locale, 'I understand this plan requires elevation', 'أفهم أن هذه الخطة تتطلب رفع الصلاحيات')} />
        <button type="button" className="sys-btn sys-btn-ghost" onClick={prepare} disabled={!chosen.length}>
          <Wrench aria-hidden="true" />
          {t(locale, 'Assemble preview', 'تجميع المعاينة')}
        </button>
        <button type="button" className="sys-btn sys-btn-primary" disabled>
          <ShieldAlert aria-hidden="true" />
          {t(locale, 'Execute (blocked)', 'تنفيذ (محظور)')}
        </button>
        <span className="sys-toolbar-spacer" />
        <Chip tone="bad" icon={ShieldCheck}>{t(locale, 'Approval gate required', 'مطلوب بوابة موافقة')}</Chip>
      </div>

      <div className="sys-split-2">
        <Panel title={t(locale, 'Preview receipt', 'إيصال المعاينة')} sub={preview ? `${preview.id} · ${formatTimestamp(preview.createdAt, locale)}` : undefined} icon={FileCode2}>
          {preview ? (
            <>
              <DataRows
                rows={[
                  { label: t(locale, 'Steps', 'الخطوات'), value: formatCount(preview.steps.length) },
                  { label: t(locale, 'Elevation acknowledged', 'الصلاحيات مُقرّة'), value: elevated ? t(locale, 'Yes (local acknowledgement)', 'نعم (إقرار محلي)') : t(locale, 'No', 'لا'), tone: elevated ? 'warn' : 'muted' },
                  { label: t(locale, 'Execution', 'التنفيذ'), value: t(locale, 'Not available in Mission 10', 'غير متاح في المهمة 10'), tone: 'bad' },
                  { label: t(locale, 'Mutation', 'التغيير'), value: 'none' },
                ]}
              />
              <div className="sys-command-stack">
                {preview.steps.map((step, index) => (
                  <div className="sys-command-row" key={step.id}>
                    <span className="sys-command-index">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <code className="sys-mono">{step.command}</code>
                      <em>{step.impact}{step.needsReboot ? ` · ${t(locale, 'restart required', 'يتطلب إعادة تشغيل')}` : ''}</em>
                    </div>
                  </div>
                ))}
              </div>
              <div className="sys-toolbar-row">
                <CopyButton locale={locale} text={preview.steps.map((step) => step.command).join('\n')} label={t(locale, 'Copy commands', 'نسخ الأوامر')} />
                <ExportButton
                  fileName="knoux-recovery-preview.json"
                  payload={{ ...preview, execution: { available: false, reason: 'Mission 10 ships a read-only preview; execution requires a future approved mission with restore-point evidence and elevation handling.' } }}
                  label={t(locale, 'Export preview', 'تصدير المعاينة')}
                  onDone={(ok) => controller.showNotice(ok ? t(locale, 'Recovery preview exported.', 'صُدّدت معاينة الاستعادة.') : t(locale, 'The recovery export could not start.', 'تعذّر بدء تصدير الاستعادة.'))}
                />
              </div>
            </>
          ) : (
            <EmptyBlock icon={Wrench} title={t(locale, 'No preview assembled', 'لم تُجمع معاينة')} message={t(locale, 'Select at least one step and assemble a preview. No command runs.', 'حدد خطوة واحدة على الأقل وجمّع معاينة. لا يُنفّذ أي أمر.')} />
          )}
        </Panel>
        <Panel title={t(locale, 'Gate conditions', 'شروط البوابة')} icon={ShieldCheck}>
          <DataRows
            rows={[
              { label: t(locale, 'Immutable plan', 'خطة ثابتة'), value: t(locale, 'Required before any future execution', 'مطلوبة قبل أي تنفيذ مستقبلي'), tone: 'warn' },
              { label: t(locale, 'Restore point', 'نقطة استعادة'), value: t(locale, 'Not created by this mission', 'لا تُنشأ في هذه المهمة'), tone: 'muted' },
              { label: t(locale, 'Elevation', 'رفع الصلاحيات'), value: t(locale, 'Not requested', 'غير مطلوب'), tone: 'muted' },
              { label: t(locale, 'Reboot handling', 'معالجة إعادة التشغيل'), value: t(locale, 'Not implemented', 'غير منفذة'), tone: 'muted' },
              { label: t(locale, 'Postcondition proof', 'إثبات ما بعد الشرط'), value: t(locale, 'Not implemented', 'غير منفذة'), tone: 'muted' },
            ]}
          />
          <InfoNote tone="warn">
            {t(locale, 'This preview is a planning aid. A future mission must obtain explicit approval, verified backups, elevation handling and measured postconditions before any of these commands could be executed.', 'هذه المعاينة مساعدة تخطيط. يجب على مهمة مستقبلية الحصول على موافقة صريحة ونسخ احتياطية متحقق منها ومعالجة رفع الصلاحيات وشروط لاحقة مقيسة قبل تنفيذ أي من هذه الأوامر.')}
          </InfoNote>
        </Panel>
      </div>
    </WorkbenchFrame>
  );
}
