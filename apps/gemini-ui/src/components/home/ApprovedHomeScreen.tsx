import React, { useEffect, useRef, useState } from 'react';
import {
  Activity, Bot, Check, ChevronRight, Database, FileText, Folder, Grid2X2, HardDrive,
  MoreHorizontal, Search, Settings, Shield, Zap, Play, Pause, Gauge, Cpu, Monitor, Rocket, X,
} from 'lucide-react';
import { KnouxOrbit } from '../../visual/KnouxOrbit';
import type { AppTheme } from '../../context/NavigationContext';
import type { HomeSnapshot } from '../../home/snapshot';
import { deriveActivities, deriveVolumes, formatBytes } from '../../home/derive';
import { KNOUX_ASSISTANT_TOGGLE_EVENT } from '../shell/KNOuXShellComponents';
import {ReferenceHeader,ReferenceSidebar} from '../shell/ReferenceChrome';
import './approved-home.css';

interface Props {
  isArabic: boolean;
  theme: AppTheme;
  onNavigate: (page: string) => void;
  live: HomeSnapshot & { refresh: () => Promise<void> };
}
const access = [
  ['Smart Scan', 'Find and review junk, duplicates, and issues.', Search, 'smart_scan'],
  ['Files', 'Search and organize your files with intelligent search.', Folder, 'files'],
  ['Applications', 'Manage installed applications and their startup impact.', Grid2X2, 'applications'],
  ['Storage', 'Analyze disk usage and find space consumers.', Database, 'storage'],
  ['Startup Control', 'Optimize startup programs for a faster boot.', Rocket, 'startup'],
  ['System Performance', 'Monitor and optimize your system health.', Monitor, 'system'],
] as const;
const orbit = [access[0], access[1], access[2], ['System', '', Monitor, 'system'] as const, access[3], ['Automation', '', Zap, 'automation'] as const];
// Reference-only values. These are never merged into the native snapshot.
const sampleFindings = [['Temporary Files', '3.8 GB', 'High'], ['Duplicate Files', '248 items', 'Medium'], ['Privacy Traces', '12 items', 'High'], ['System Issues', '3 issues', 'Medium'], ['Startup Items', '18 items', 'Low']];
const sampleCategories = [['System Files', 120], ['Applications', 86], ['Documents', 54], ['Images', 32], ['Videos', 24], ['Other', 160]] as const;
const sampleInsights = [['CPU usage is stable', 'Average 65% over the last 5 minutes'], ['Memory usage is high', '72% used. Consider closing apps.'], ['Disk health is good', 'No issues detected'], ['Startup optimization available', '6 items can be optimized'], ['System is protected', 'All security components are active']];
const arabic:Record<string,string>={
 'Smart Scan':'الفحص الذكي','Files':'الملفات','Applications':'التطبيقات','Storage':'التخزين','System':'النظام','Automation':'الأتمتة','Startup Control':'بدء التشغيل','System Performance':'أداء النظام',
 'Find and review junk, duplicates, and issues.':'اعثر على المخلفات والتكرارات والمشاكل وراجعها.',
 'Search and organize your files with intelligent search.':'ابحث في ملفاتك ونظّمها من المصادر المصرح بها.',
 'Manage installed applications and their startup impact.':'راجع التطبيقات المثبتة وتأثيرها على بدء التشغيل.',
 'Analyze disk usage and find space consumers.':'حلّل استخدام الأقراص واعرف أكبر مستهلكي المساحة.',
 'Optimize startup programs for a faster boot.':'راجع برامج بدء التشغيل لتسريع الإقلاع.',
 'Monitor and optimize your system health.':'راقب قياسات النظام وحالته الفعلية.',
 'Total Findings':'إجمالي النتائج','Workflow Drafts':'مسودات الأتمتة','System Status':'حالة النظام',
 'Scheduled Tasks':'المهام المجدولة','Journal Entries':'سجل المعاينات','Paused':'متوقف مؤقتًا',
 'CPU load':'حمل المعالج','Memory usage':'استخدام الذاكرة','Disk health':'سلامة القرص','Observation time':'وقت القياس','Provider coverage':'تغطية المزوّدات',
 'Used':'المستخدم','Free':'المتاح','File types':'أنواع الملفات',
 'Clean junk files':'راجع المخلفات','Find large files':'اعثر على الملفات الكبيرة','Optimize startup':'راجع بدء التشغيل','Check system health':'افحص حالة النظام','Manage services':'إدارة الخدمات','Create automation':'أنشئ أتمتة'
};
const colors = ['#12c8b1', '#268bfa', '#8045ef', '#f64395', '#ff9255', '#f3cb64'];
function IconBox({ children }: { children: React.ReactNode }) { return <span className="approved-icon">{children}</span>; }
function Heading({ icon: Icon, title, onClick, action = 'View All' }: { icon: React.ElementType; title: string; onClick: () => void; action?: string }) {
  return <div className="approved-section-heading"><h2><Icon />{title}</h2><button onClick={onClick} aria-label={`${action} ${title}`}>{action === 'Options' ? <MoreHorizontal /> : action}</button></div>;
}
function Dialog({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement; const d = ref.current!; d.showModal(); return () => { d.close(); previous?.focus(); }; }, []);
  return <dialog className="home-dialog" ref={ref} onCancel={close} aria-label={title} onClick={e => { if (e.target === ref.current) close(); }}><header><h2>{title}</h2><button autoFocus onClick={close} aria-label="Close dialog"><X /></button></header>{children}</dialog>;
}

export function ApprovedHomeScreen({ isArabic, theme, onNavigate, live }: Props) {
  const t=(en:string,ar:string)=>isArabic?ar:en;
  const resolvedTheme=theme;
  const [sample, setSample] = useState(false);
  const [modal, setModal] = useState<'notifications' | 'customize' | 'scan' | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [assistantTarget, setAssistantTarget] = useState('');
  const [chartSelection, setChartSelection] = useState('');
  const [selectedVolume, setSelectedVolume] = useState('');
  const go = (target: string) => {
    if (target === 'intro') window.dispatchEvent(new Event('knoux:replay-entry'));
    else if (target === 'assistant') window.dispatchEvent(new Event(KNOUX_ASSISTANT_TOGGLE_EVENT));
    else onNavigate(target);
  };
  const provenance=(domain:keyof HomeSnapshot['observations'])=>{const o=live.observations[domain];return o?`${o.source} · ${o.observedAt}${o.stale?' · STALE':''}${o.partial?' · PARTIAL':''}`:'No observed source';};
  const stamp=(domain:keyof HomeSnapshot['observations'])=>{const o=live.observations[domain];return o?`${t('Observed','قياس')} ${new Date(o.observedAt).toLocaleTimeString(isArabic?'ar-EG':'en-GB')}${o.stale?' · STALE':''}${o.partial?' · PARTIAL':''}`:t('Not measured','غير مقيس');};
  const volumes = deriveVolumes(live);
  const drive = volumes.find(x => x.id === selectedVolume) ?? volumes[0];
  const activities = deriveActivities(live);
  const latest = [...live.scans].filter(x => ['complete', 'partial'].includes(x.status)).sort((a, b) => (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt))[0];
  const cpu = sample ? 65 : live.system?.cpuLoadPercent;
  const memory = sample ? 72 : live.system?.memoryUsedPercent;
  const disk = sample ? 28 : drive?.usedPercent;
  const score = sample ? 78 : latest?.healthScore;
  const mode = sample ? 'SAMPLE — NOT DEVICE DATA' : live.status === 'native-required' ? 'NOT_CONNECTED' : live.status.toUpperCase();
  const findings = sample ? sampleFindings : live.scans.slice(0, 5).map(x => [`${x.mode} scan`, `${x.findingsCount} findings`, x.status]);
  const stats = sample ? ['8', '12', '6', '2'] : [live.observations.workflows ? String(live.workflows.length) : '—', '—', live.observations.journal ? String(live.journal.length) : '—', '—'];
  const kpis = sample ? ['12', '263', '8', 'Healthy'] : [live.apps ? String(live.apps.kpis.installed) : '—', latest ? String(latest.findingsCount) : '—', live.observations.workflows ? String(live.workflows.length) : '—', score == null ? '—' : `${score}%`];
  const bytesTotal = sample ? '476 GB' : drive?.totalFormatted ?? '—';
  const total = sampleCategories.reduce((s, [, n]) => s + n, 0);
  let degrees = 0;
  const gradient = sample ? sampleCategories.map(([, value], i) => { const start = degrees; degrees += value / total * 360; return `${colors[i]} ${start}deg ${degrees}deg`; }).join(',') : `${colors[2]} 0 ${drive?.usedPercent ?? 0}%,var(--track) ${drive?.usedPercent ?? 0}% 100%`;
  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    const q = assistantQuery.toLowerCase().trim();
    if (!q) return;
    const target = /clean|junk|مخلفات|نظف/.test(q) ? 'cleanup' : /file|large|ملف|كبيرة/.test(q) ? 'files' : /start|boot|بدء|إقلاع/.test(q) ? 'startup' : /health|system|حالة|نظام/.test(q) ? 'system' : /service|خدمات/.test(q) ? 'services' : /automat|أتمتة/.test(q) ? 'automation' : '';
    setAssistantTarget(target);
    setAssistantReply(target ? `Local navigation suggestion: ${target}. No action has been executed.` : 'AI provider NOT_CONNECTED. Open the assistant to review connection settings; no request was sent.');
  };

  return <div className="approved-home home-corrective" data-testid="home-workspace" data-home-sample={sample} dir={isArabic ? 'rtl' : 'ltr'} data-theme-mode={resolvedTheme === 'light' ? 'day' : 'night'}>
    <ReferenceHeader preciseThemeLabels searchLabel={t("Search workspaces and tools…","ابحث عن مساحات العمل والأدوات…")} onSearch={()=>window.dispatchEvent(new Event('knoux:open-commands'))} onNotifications={()=>setModal('notifications')}/>
    <div className="home-qa-toolbar" aria-label="Data mode and source controls">            <div className="home-mode"><span className="home-data-mode" role="status" data-testid="home-live-status" data-status={live.status}>{mode}</span><label><input type="checkbox" checked={sample} onChange={e => {setSample(e.target.checked); setChartSelection('');}} /> {t('Reference sample','بيانات توضيحية')}</label><button onClick={() => void live.refresh()} disabled={live.status === 'loading'} aria-label="Refresh Home data">↻</button></div>
{!sample&&live.observedAt&&<details className="home-provenance"><summary>Measured sources · {live.status} · oldest observation {live.observedAt}</summary>{Object.entries(live.observations).map(([domain,stamp])=><p key={domain}>{domain}: {stamp.source} · {stamp.observedAt}{stamp.stale?' · STALE':''}{stamp.partial?' · PARTIAL':''}</p>)}</details>}
</div>
    <div className="approved-body">
      <ReferenceSidebar active="home" connected={live.status==='live'||live.status==='partial'}/>
      <main className="approved-main">
        <section className="approved-hero">
          <div className="approved-orbit"><KnouxOrbit optics="home" state={live.status==='loading'?'loading':live.status==='native-required'?'unavailable':live.status==='partial'?'partial':'ready'} title="KNOuX" subtitle="SmartOrganizer" onActivate={() => setModal('scan')} tools={orbit.map(([label, , icon, target]) => ({ id: target, label:t(label,arabic[label]??label), icon, onClick: () => go(target) }))} /></div>
          <div className="approved-welcome"><div className="home-hero-heading"><IconBox><Zap/></IconBox><h1>{t('Welcome to','مرحبًا بك في')} <span>KNOuX</span></h1></div><p>{t('Your intelligent system organizer for a cleaner,','منظّم نظامك الذكي لتجربة Windows أنظف،')}<br />{t('faster, and more secure Windows experience.','وأسرع وأكثر أمانًا.')}</p>
            <div className="approved-kpis">{[Grid2X2, FileText, Zap, Shield].map((Icon, i) => <button className="approved-kpi" key={i} onClick={() => go(['applications', 'smart_scan', 'automation', 'system'][i])}><Icon /><span><strong>{kpis[i]}</strong><small>{t(['Applications', 'Total Findings', sample ? 'Automations' : 'Workflow Drafts', 'System Status'][i],arabic[['Applications', 'Total Findings', sample ? 'Automations' : 'Workflow Drafts', 'System Status'][i]]??'الأتمتة')}</small></span></button>)}</div>
            <div className="approved-hero-actions"><button className="approved-primary" onClick={() => setModal('scan')}>{t('Start a Quick Scan','بدء مراجعة الفحص')} <ChevronRight /></button><button className="approved-secondary" onClick={() => window.dispatchEvent(new Event('knoux:open-commands'))}><Grid2X2 />{t('Explore Tools','استكشاف الأدوات')}</button></div>
          </div>
        </section>

        <section className="approved-section approved-quick"><div className="approved-section-heading"><div><h2><Grid2X2 />{t('Quick Access Tools','أدوات الوصول السريع')}</h2><p>{t('Essential tools to keep your system clean, fast, and secure.','أدوات أساسية للحفاظ على نظافة النظام وسرعته وأمانه.')}</p></div><button className="approved-outline" onClick={() => setModal('customize')}><Settings />{t('Customize','تخصيص')}</button><button className="approved-more" onClick={() => setModal('customize')} aria-label="More quick access options"><MoreHorizontal /></button></div><div className="approved-access-grid">{access.filter(([name]) => !hidden.includes(name)).map(([label, description, Icon, target]) => <article className="approved-access-card" key={label}><IconBox><Icon /></IconBox><h3>{t(label,arabic[label]??label)}</h3><p title={t(description,arabic[description]??description)}>{t(description,arabic[description]??description)}</p><button onClick={() => go(target)} aria-label={`Open ${label}`}>{t('Open','فتح')}<ChevronRight /></button></article>)}</div></section>
        <div className="approved-lower-grid">
          <section className="approved-section approved-list"><Heading icon={FileText} title={t("Recent Findings","أحدث النتائج")} onClick={() => go('smart_scan')} />{!sample&&live.scans.length>0&&<small className="measurement-provenance">{stamp('scans')}</small>}{findings.length ? findings.map(([name, value, level], i) => <button className="approved-row" key={`${name}-${i}`} onClick={() => go('smart_scan')}><FileText /><strong>{name}</strong><span>{value}</span><b className={`risk risk-${level.toLowerCase()}`}>{level}</b></button>) : <div className="home-empty">{t('No verified findings yet.','لا توجد نتائج موثقة بعد.')}<button onClick={() => setModal('scan')}>{t('Review scan scope','راجع نطاق الفحص')}</button></div>}</section>
          <section className="approved-section approved-automation"><Heading icon={Bot} title={t("Automation Overview","نظرة على الأتمتة")} onClick={() => go('automation')} />{!sample&&live.observations.workflows&&<small className="measurement-provenance">{stamp('workflows')}</small>}<div className="automation-stats">{[Play, Settings, Activity, Pause].map((Icon, i) => <button key={i} onClick={() => go('automation')}><Icon /><strong>{stats[i]}</strong><span>{[sample ? 'Active Automations' : 'Workflow Drafts', 'Scheduled Tasks', sample ? 'Total Runs' : 'Journal Entries', 'Paused'][i]}</span></button>)}</div><h4>{t('Next Scheduled','الموعد القادم')}</h4><button className="scheduled" onClick={() => go('automation')}><Rocket /><span><strong>{sample ? 'Clean Temporary Files' : t('Schedule not measured','لا يوجد موعد مقيس')}</strong><small>{sample ? 'Every day at 10:00 PM' : t('Open Automation to review','افتح الأتمتة للمراجعة')}</small></span><ChevronRight /></button></section>
          <section className="approved-section approved-insights"><Heading icon={Shield} title={t("System Insights","معلومات النظام")} onClick={() => go('system')} />{(sample ? sampleInsights : [['CPU load', cpu == null ? 'Not measured' : `${cpu}% · latest observation`], ['Memory usage', memory == null ? 'Not measured' : `${memory}% · latest observation`], ['Disk health', 'Unavailable · no supported health evidence'], ['Observation time', live.observedAt ?? 'No native snapshot'], ['Provider coverage', live.status === 'partial' ? 'Partial · review warnings' : mode]]).map(([title, detail], i) => <button className="insight-row" key={title} onClick={() => go('system')}><span className={`insight-dot ${sample ? (i === 1 ? 'warn' : 'good') : 'info'}`}>{sample ? <Check /> : <Activity />}</span><span><strong>{t(title,arabic[title]??title)}</strong><small>{detail}</small></span></button>)}</section>
        </div>
      </main>
      <aside className="approved-inspector">
        <section className="approved-side-card" data-measurement="system"><Heading icon={Gauge} title={t("System Health","صحة النظام")} action="Options" onClick={() => go('system')} /><div className="health-content"><button className={`health-gauge ${score == null ? 'unmeasured' : ''}`} onClick={() => go('system')} aria-label="Review system health evidence"><strong>{score == null ? '—' : `${score}%`}</strong><span>{sample ? 'Good' : score == null ? 'Not measured' : 'Scan score'}</span></button><div className="health-bars">{[['CPU', cpu, Cpu], ['Memory', memory, Database], ['Disk', disk, HardDrive], ['Network', sample ? 12 : null, Activity]].map(([label, value, Icon]) => { const MetricIcon = Icon as React.ElementType; return <button key={String(label)} onClick={() => go('system')}><MetricIcon /><span>{String(label)}</span><i><b style={{ width: value == null ? 0 : `${value}%` }} /></i><em>{value == null ? '—' : `${value}%`}</em></button>; })}</div></div><p className="side-note">{sample ? 'SAMPLE · Your system is running well' : latest ? `Score from scan ${latest.id}` : 'No measured overall health score'}{!sample&&<small className="measurement-provenance">{stamp('system')}{latest?` · ${stamp('scans')}`:''}</small>}</p></section>
        <section className="approved-side-card" data-measurement="storage"><Heading icon={HardDrive} title={t("Storage Overview","نظرة على التخزين")} action="Options" onClick={() => go('storage')} /><div className="storage-drive"><IconBox><HardDrive /></IconBox><div>{volumes.length && !sample ? <select aria-label="Select storage volume" value={drive?.id} onChange={e => { setSelectedVolume(e.target.value); setChartSelection(''); }}>{volumes.map(v => <option key={v.id} value={v.id}>{v.letter} {v.label}</option>)}</select> : <strong>{sample ? 'C: System Drive' : 'No volume connected'}</strong>}<span>{sample ? '182 GB free of 476 GB' : drive ? `${drive.freeFormatted} free of ${drive.totalFormatted}` : 'Connect the desktop provider'}</span><i><b style={{ width: `${sample ? 62 : drive?.usedPercent ?? 0}%` }} /></i></div></div><div className="storage-chart"><button className="donut" style={{ background: `conic-gradient(${gradient})` }} onClick={() => setChartSelection(sample ? 'SAMPLE · total capacity 476 GB' : drive ? `${drive.letter}: ${drive.usedFormatted} used` : 'NOT_CONNECTED · no measured volume')} aria-label="Select total storage"><strong>{bytesTotal}</strong><span>{sample?'Sample total':'Total'}</span></button><div className="legend">{(sample ? sampleCategories.map(([name, value]) => [name, `${value} GB`]) : [['Used', drive?.usedFormatted ?? '—'], ['Free', drive?.freeFormatted ?? '—'], ['File types', 'Not measured']]).map(([name, value], i) => <button key={name} onClick={() => setChartSelection(`${sample ? 'SAMPLE · ' : ''}${name}: ${value}`)}><i style={{ background: colors[i] }} />{name}<span>{value}</span></button>)}</div></div><p className="chart-caption" aria-live="polite">{chartSelection || (sample ? 'SAMPLE · illustrative 476 GB breakdown, not audited disk bytes' : 'Volume capacity only · no inferred file categories')}{!sample&&<small className="measurement-provenance">{stamp('system')}</small>}</p></section>
        <section className="approved-side-card approved-assistant"><Heading icon={Bot} title={t("AI Assistant","المساعد الذكي")} action="Options" onClick={() => go('assistant')} /><form className="assistant-input" onSubmit={ask}><Search /><input value={assistantQuery} onChange={e => setAssistantQuery(e.target.value)} placeholder="Ask KNOuX anything..." aria-label="Ask KNOuX anything" /><button type="submit" aria-label="Send assistant question"><ChevronRight /></button></form><div className="assistant-chips">{['Clean junk files', 'Find large files', 'Optimize startup', 'Check system health', 'Manage services', 'Create automation'].map(x => <button key={x} onClick={() => { setAssistantQuery(x); setAssistantReply(''); }}>{t(x,arabic[x]??x)}</button>)}</div>{assistantReply && <div className="assistant-reply" role="status">{assistantReply}<button onClick={() => go(assistantTarget || 'assistant')}>Open {assistantTarget || 'assistant'}</button></div>}</section>
        <section className="approved-side-card approved-activity"><Heading icon={Activity} title={t("Recent Activity","النشاط الأخير")} onClick={() => setModal('notifications')} />{activities.length ? activities.slice(0, 5).map(item => <button className="activity-row" key={item.id} onClick={() => go(item.targetPage)}><Check /><strong>{isArabic ? item.titleAr : item.title}</strong><small>{item.timeAgo}</small><ChevronRight /></button>) : <p className="home-empty">{t('No verified activity yet.','لا يوجد نشاط موثق بعد.')}</p>}</section>
      </aside>
    </div>
    {modal && <Dialog title={{ notifications: 'Notifications & provider evidence', customize: 'Customize Quick Access', scan: 'Quick Scan · scope review' }[modal]} close={() => setModal(null)}>

      {modal === 'notifications' && <><p>{mode} · Local native observations; each effect requires its own approval.</p>{Object.entries(live.observations).map(([name, stamp]) => <p key={name}>{name}: {stamp.source} · {stamp.observedAt}{stamp.stale ? ' · STALE' : ''}</p>)}{live.errors.map(e => <p key={e}>{e}</p>)}{activities.map(item=><button className="activity-row" key={item.id} onClick={()=>go(item.targetPage)}><span><strong>{isArabic?item.titleAr:item.title}</strong><small>{isArabic?item.detailAr:item.detail}</small><small>{item.timeAgo}</small></span><ChevronRight/></button>)}{!activities.length && <p>{t('No verified notifications yet.','لا توجد إشعارات موثقة بعد.')}</p>}<button onClick={() => void live.refresh()}>Refresh observations</button></>}
      {modal === 'customize' && access.map(([name]) => <label className="home-check" key={name}><input type="checkbox" checked={!hidden.includes(name)} onChange={e => setHidden(x => e.target.checked ? x.filter(n => n !== name) : [...x, name])} />{name}</label>)}
      {modal === 'scan' && <><p>Preview only. Home does not start a scan, delete files, or execute device changes.</p><p>{live.sources.length ? `${live.sources.length} authorized source(s) available. Select the exact scope in Smart Scan.` : 'NOT_CONNECTED or no authorized source. Choose scope in the existing Smart Scan workbench.'}</p><p>The current scan bridge has no immutable plan endpoint. Review its supported scan workflow in Smart Scan; no plan or receipt is fabricated here.</p><button className="approved-primary" onClick={() => go('smart_scan')}>Open Smart Scan scope review<ChevronRight /></button></>}
    </Dialog>}
  </div>;
}
