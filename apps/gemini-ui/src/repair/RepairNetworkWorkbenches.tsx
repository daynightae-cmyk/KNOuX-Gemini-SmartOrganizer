/**
 * Recovery Lab - network repair workbenches (tools 06-08).
 * Cache counts, Winsock catalog metadata and adapter configuration are
 * measured. Flush/reset commands are immutable previews with no execution.
 */
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Cable,
  Globe2,
  Layers,
  Lock,
  Network,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import type { RepairWorkbenchProps } from './ui';
import {
  CommandPreview,
  GuidedSequence,
  PlanDock,
  RepairToolFrame,
  SafetyNote,
  EvidenceRows,
} from './ui';
import { planForTool, t } from './model';
import { Chip, CopyButton, DataRows, Panel, Seg } from '../system/ui';

/* 06 - DNS cache refresh */
export function DnsFlushWorkbench(props: RepairWorkbenchProps) {
  const { locale, snapshot } = props;
  const [view, setView] = useState<'cache' | 'adapters'>('cache');
  const adapters = useMemo(() => [...new Set(snapshot.network.adapters.map((entry) => entry.name))], [snapshot.network.adapters]);
  const [adapter, setAdapter] = useState<string>(adapters[0] || '');
  const planItem = planForTool(props.controller.plan, props.toolId);
  const dnsRows = snapshot.network.dnsServers.filter((entry) => entry.interfaceAlias === adapter);
  const addressRows = snapshot.network.addresses.filter((entry) => entry.interfaceAlias === adapter);
  const cache = snapshot.network.dnsCache;
  return (
    <RepairToolFrame
      {...props}
      provider="ipconfig.exe /displaydns + /flushdns preview"
      foot={<><span><Globe2 aria-hidden="true" />{t(locale, 'Cache entries', 'مدخلات الذاكرة')}: {cache.entryCount == null ? '—' : cache.entryCount}</span><span><Lock aria-hidden="true" />{t(locale, 'Flush not executed', 'لم يُنفذ المسح')}</span></>}
    >
      <div className="sys-toolbar-row">
        <Seg<'cache' | 'adapters'>
          value={view}
          onChange={setView}
          ariaLabel={t(locale, 'DNS view', 'عرض DNS')}
          compact
          options={[
            { value: 'cache', label: t(locale, 'Cache impact', 'أثر الذاكرة') },
            { value: 'adapters', label: t(locale, 'Adapter resolvers', 'محللات المحول') },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <Chip tone={cache.status === 'measured' ? 'good' : 'warn'}>{cache.status === 'measured' ? t(locale, 'Cache measured', 'الذاكرة مقيسة') : t(locale, 'Cache unavailable', 'الذاكرة غير متاحة')}</Chip>
      </div>

      {view === 'cache' ? (
        <div className="rep-cache-layout">
          <Panel title={t(locale, 'Resolver cache', 'ذاكرة المحلل')} sub={cache.note} icon={Globe2}>
            <div className="rep-cache-diagram">
              <div className="rep-cache-node">
                <span>{t(locale, 'Measured now', 'مقيس الآن')}</span>
                <strong>{cache.entryCount == null ? '—' : cache.entryCount}</strong>
                <em>{t(locale, 'record names', 'اسم سجل')}</em>
              </div>
              <ArrowRight className="rep-cache-arrow" aria-hidden="true" />
              <div className="rep-cache-node is-after">
                <span>{t(locale, 'After a future flush', 'بعد مسح مستقبلي')}</span>
                <strong>0</strong>
                <em>{t(locale, 'preview target only', 'هدف المعاينة فقط')}</em>
              </div>
            </div>
            <DataRows
              rows={[
                { label: t(locale, 'Measured entries', 'المدخلات المقيسة'), value: cache.entryCount == null ? '—' : String(cache.entryCount), mono: true },
                { label: t(locale, 'Domains displayed', 'النطاقات المعروضة'), value: t(locale, 'None (privacy)', 'لا شيء (خصوصية)'), tone: 'muted' },
                { label: t(locale, 'Source', 'المصدر'), value: cache.source, mono: true },
                { label: t(locale, 'Cache state', 'حالة الذاكرة'), value: cache.status, tone: cache.status === 'measured' ? 'good' : 'warn' },
              ]}
            />
          </Panel>
          <Panel title={t(locale, 'Impact & safety', 'الأثر والسلامة')} icon={ShieldAlert}>
            <SafetyNote locale={locale} tone="warn">
              {t(locale, 'Flushing clears cached name resolution. Names must be looked up again, but no saved password, cookie or host file is modified.', 'المسح يزيل تحليل الأسماء المخبأ. ستُبحث الأسماء مرة أخرى، لكن لا تُعدل كلمات مرور محفوظة أو ملفات تعريف ارتباط أو ملف hosts.')}
            </SafetyNote>
            <DataRows
              rows={[
                { label: t(locale, 'Adapters measured', 'المحولات المقيسة'), value: String(adapters.length) },
                { label: t(locale, 'Affected resolver groups', 'مجموعات المحللات المتأثرة'), value: String(snapshot.network.dnsServers.length) },
                { label: t(locale, 'Command elevation', 'صلاحيات الأمر'), value: t(locale, 'Not required for a standard preview', 'غير مطلوبة لمعاينة عادية'), tone: 'muted' },
                { label: t(locale, 'Execution', 'التنفيذ'), value: t(locale, 'Gated — preview only', 'محجوب — معاينة فقط'), tone: 'bad' },
              ]}
            />
            <EvidenceRows locale={locale} item={planItem} />
          </Panel>
        </div>
      ) : (
        <div className="sys-split-2">
          <Panel
            title={t(locale, 'Measured adapters', 'المحولات المقيسة')}
            sub={t(locale, 'Select an adapter to inspect its measured resolvers.', 'اختر محولًا لفحص محللاته المقيسة.')}
            icon={Cable}
            actions={
              adapter ? <CopyButton locale={locale} text={dnsRows.flatMap((entry) => entry.servers).join('\n')} label={t(locale, 'Copy resolvers', 'نسخ المحللات')} /> : null
            }
          >
            <div className="rep-select-row">
              <label htmlFor="repair-dns-adapter">{t(locale, 'Adapter', 'المحول')}</label>
              <select
                id="repair-dns-adapter"
                className="sys-input"
                value={adapter}
                onChange={(event) => setAdapter(event.target.value)}
                aria-label={t(locale, 'Select adapter', 'اختر المحول')}
              >
                {adapters.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <DataRows
              rows={[
                ...addressRows.map((entry) => ({ label: `${entry.interfaceAlias} · IPv4`, value: entry.prefixLength == null ? entry.address : `${entry.address}/${entry.prefixLength}`, mono: true })),
                ...dnsRows.flatMap((entry) => entry.servers.map((server, index) => ({ label: `${entry.interfaceAlias} · DNS ${index + 1}`, value: server, mono: true }))),
              ]}
              empty={<em className="sys-muted-text">{t(locale, 'No measured resolver row for this adapter.', 'لا يوجد صف محلل مقيس لهذا المحول.')}</em>}
            />
          </Panel>
          <Panel title={t(locale, 'Cache detail', 'تفاصيل الذاكرة')} icon={Globe2}>
            <DataRows
              rows={[
                { label: t(locale, 'Record names', 'أسماء السجلات'), value: cache.entryCount == null ? '—' : String(cache.entryCount) },
                { label: t(locale, 'Domains persisted', 'النطاقات المحفوظة'), value: t(locale, 'No — counts only', 'لا — العد فقط'), tone: 'good' },
                { label: t(locale, 'Source', 'المصدر'), value: cache.source, mono: true },
              ]}
            />
            <button type="button" className="sys-btn sys-btn-ghost" onClick={() => void props.controller.openSettings('troubleshoot')}>
              <Wifi aria-hidden="true" />{t(locale, 'Windows network troubleshooting', 'استكشاف شبكة Windows')}
            </button>
          </Panel>
        </div>
      )}

      <CommandPreview locale={locale} snapshot={snapshot} toolId={props.toolId} />
      <PlanDock locale={locale} controller={props.controller} toolId={props.toolId} />
    </RepairToolFrame>
  );
}

/* 07 - Winsock reset review */
export function WinsockResetWorkbench(props: RepairWorkbenchProps) {
  const { locale, snapshot } = props;
  const winsock = snapshot.network.winsock;
  const planItem = planForTool(props.controller.plan, props.toolId);
  const layers = [
    { en: 'Application sockets', ar: 'مقابس التطبيقات', state: t(locale, 'Active', 'نشطة') },
    { en: 'Layered service providers', ar: 'مزودات الخدمة الطبقية', state: winsock.categories.length ? `${winsock.categories.length} ${t(locale, 'catalogue types', 'نوع كتالوج')}` : t(locale, 'Not reported', 'غير مبلّغ') },
    { en: 'Base Winsock provider', ar: 'مزود Winsock الأساسي', state: winsock.providerCount == null ? t(locale, 'Unknown', 'مجهول') : `${winsock.providerCount} ${t(locale, 'entries', 'مدخل')}` },
    { en: 'Reset target', ar: 'هدف الإعادة', state: t(locale, 'Windows default catalogue (not executed)', 'كتالوج Windows الافتراضي (لم يُنفذ)') },
  ];
  return (
    <RepairToolFrame
      {...props}
      provider="netsh.exe winsock show catalog + reset preview"
      foot={<><span><Network aria-hidden="true" />{t(locale, 'Measured providers', 'المزودات المقيسة')}: {winsock.providerCount == null ? '—' : winsock.providerCount}</span><span><Lock aria-hidden="true" />{t(locale, 'Reset not executed', 'لم تُنفذ الإعادة')}</span></>}
    >
      <div className="rep-stack-hero">
        <div className="rep-stack-visual" aria-hidden="true">
          <Layers />
          <span>{winsock.providerCount == null ? '—' : winsock.providerCount}</span>
          <em>{t(locale, 'providers', 'مزود')}</em>
        </div>
        <div className="rep-stack-copy">
          <span className="sys-wb-eyebrow">{t(locale, 'WINSOCK CATALOG', 'كتالوج WINSOCK')}</span>
          <strong>{t(locale, 'Measured catalogue metadata, no reset.', 'بيانات كتالوج مقيسة، بلا إعادة تعيين.')}</strong>
          <p>{winsock.note}</p>
          <div className="rep-chip-row">
            {winsock.categories.length ? winsock.categories.map((category) => <Chip key={category} tone="violet">{category}</Chip>) : <Chip tone="muted">{t(locale, 'No category reported', 'لا فئة مبلغة')}</Chip>}
            <Chip tone="bad" icon={RotateCcw}>{t(locale, 'Reboot required', 'إعادة تشغيل مطلوبة')}</Chip>
          </div>
        </div>
      </div>

      <div className="sys-split-2">
        <Panel title={t(locale, 'Dependency stack', 'مكدس الاعتماديات')} sub={t(locale, 'Read from the Winsock catalog and the reset specification.', 'مقروء من كتالوج Winsock ومواصفة الإعادة.')} icon={Layers}>
          <ol className="rep-stack">
            {layers.map((layer, index) => (
              <li key={layer.en} className={index === 3 ? 'is-blocked' : ''}>
                <span className="rep-stack-index">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{locale === 'ar' ? layer.ar : layer.en}</strong>
                  <em>{layer.state}</em>
                </div>
                {index === 3 ? <Lock aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title={t(locale, 'Risk & impact', 'الخطورة والأثر')} icon={ShieldAlert}>
          <SafetyNote locale={locale} tone="bad">
            {t(locale, 'Winsock reset removes layered providers and can break VPN, proxy or capture software until reinstalled. It disconnects active networking and requires a reboot. No reset is executed.', 'إعادة Winsock تزيل المزودات الطبقية وقد تعطل VPN أو الوكيل أو برامج التقاط حتى إعادة التثبيت. تقطع الشبكة النشطة وتتطلب إعادة تشغيل. لا تُنفذ أي إعادة.')}
          </SafetyNote>
          <DataRows
            rows={[
              { label: t(locale, 'Provider entries', 'مدخلات المزود'), value: winsock.providerCount == null ? '—' : String(winsock.providerCount) },
              { label: t(locale, 'Catalogue categories', 'فئات الكتالوج'), value: winsock.categories.join(', ') || '—' },
              { label: t(locale, 'Elevation', 'رفع الصلاحيات'), value: t(locale, 'Required, not granted', 'مطلوب، غير ممنوح'), tone: 'warn' },
              { label: t(locale, 'Restart', 'إعادة التشغيل'), value: t(locale, 'Mandatory', 'إلزامية'), tone: 'bad' },
            ]}
          />
          <EvidenceRows locale={locale} item={planItem} />
        </Panel>
      </div>

      <CommandPreview locale={locale} snapshot={snapshot} toolId={props.toolId} />
      <GuidedSequence locale={locale} />
      <PlanDock locale={locale} controller={props.controller} toolId={props.toolId} />
    </RepairToolFrame>
  );
}

/* 08 - TCP/IP reset diff */
export function TcpipResetWorkbench(props: RepairWorkbenchProps) {
  const { locale, snapshot } = props;
  const adapters = useMemo(() => [...new Set(snapshot.network.adapters.map((entry) => entry.name))], [snapshot.network.adapters]);
  const [adapter, setAdapter] = useState(adapters[0] || '');
  const planItem = planForTool(props.controller.plan, props.toolId);
  const addresses = snapshot.network.addresses.filter((entry) => entry.interfaceAlias === adapter);
  const dns = snapshot.network.dnsServers.filter((entry) => entry.interfaceAlias === adapter);
  return (
    <RepairToolFrame
      {...props}
      provider="Get-NetIPConfiguration + netsh int ip reset preview"
      foot={<><span><Network aria-hidden="true" />{t(locale, 'Adapters', 'المحولات')}: {snapshot.network.adapters.length}</span><span><Lock aria-hidden="true" />{t(locale, 'Reset not executed', 'لم تُنفذ الإعادة')}</span></>}
    >
      <div className="sys-toolbar-row">
        <label className="rep-inline-label" htmlFor="repair-tcpip-adapter">{t(locale, 'Adapter', 'المحول')}</label>
        <select
          id="repair-tcpip-adapter"
          className="sys-input"
          value={adapter}
          onChange={(event) => setAdapter(event.target.value)}
          aria-label={t(locale, 'Select adapter', 'اختر المحول')}
        >
          {adapters.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <span className="sys-toolbar-spacer" />
        <Chip tone="warn" icon={AlertTriangle}>{t(locale, 'Restart required', 'إعادة التشغيل مطلوبة')}</Chip>
      </div>

      <div className="rep-diff-layout">
        <Panel title={t(locale, 'Measured configuration', 'التهيئة المقيسة')} sub={adapter || t(locale, 'No adapter selected', 'لا محول محدد')} icon={Network}>
          <DataRows
            rows={[
              ...addresses.map((entry) => ({ label: t(locale, 'IPv4 address', 'عنوان IPv4'), value: entry.prefixLength == null ? entry.address : `${entry.address}/${entry.prefixLength}`, mono: true })),
              ...dns.flatMap((entry) => entry.servers.map((server, index) => ({ label: `DNS ${index + 1}`, value: server, mono: true }))),
              { label: t(locale, 'Link speed', 'سرعة الوصلة'), value: snapshot.network.adapters.find((entry) => entry.name === adapter)?.linkSpeed || '—' },
              { label: t(locale, 'Status', 'الحالة'), value: snapshot.network.adapters.find((entry) => entry.name === adapter)?.status || '—' },
            ]}
            empty={<em className="sys-muted-text">{t(locale, 'No measured address row for this adapter.', 'لا صف عنوان مقيس لهذا المحول.')}</em>}
          />
        </Panel>
        <Panel title={t(locale, 'Reset target (preview)', 'هدف الإعادة (معاينة)')} sub={t(locale, 'Windows default stack — exact defaults are not enumerated by the read-only provider.', 'مكدس Windows الافتراضي — لا يسرد المزود للقراءة فقط القيم الافتراضية الدقيقة.')} icon={RefreshCw}>
          <div className="rep-diff-target">
            <span>{t(locale, 'Current measured values', 'القيم المقيسة الحالية')}</span>
            <ArrowRight aria-hidden="true" />
            <span>{t(locale, 'Windows default target', 'هدف Windows الافتراضي')}</span>
          </div>
          <DataRows
            rows={[
              { label: t(locale, 'Addressing', 'العنونة'), value: t(locale, 'Measured above', 'مقيسة أعلاه') },
              { label: t(locale, 'Reset result', 'نتيجة الإعادة'), value: t(locale, 'Not enumerated — no configuration is invented', 'غير مسرودة — لا تُختلق تهيئة'), tone: 'muted' },
              { label: t(locale, 'Downtime', 'التوقف'), value: t(locale, 'Active connections drop', 'تنقطع الاتصالات النشطة'), tone: 'bad' },
              { label: t(locale, 'Reboot', 'إعادة التشغيل'), value: t(locale, 'Required', 'مطلوبة'), tone: 'bad' },
            ]}
          />
          <SafetyNote locale={locale} tone="bad">
            {t(locale, 'TCP/IP reset can remove static addresses, DNS settings and custom routes. Back up the measured configuration before any future approved execution. No reset is run by this mission.', 'إعادة TCP/IP قد تزيل عناوين ثابتة وإعدادات DNS ومسارات مخصصة. احتفظ بالتهيئة المقيسة قبل أي تنفيذ معتمد مستقبلي. لا تشغل هذه المهمة أي إعادة.')}
          </SafetyNote>
          <EvidenceRows locale={locale} item={planItem} />
        </Panel>
      </div>

      <CommandPreview locale={locale} snapshot={snapshot} toolId={props.toolId} />
      <PlanDock locale={locale} controller={props.controller} toolId={props.toolId} />
      <GuidedSequence locale={locale} />
    </RepairToolFrame>
  );
}
