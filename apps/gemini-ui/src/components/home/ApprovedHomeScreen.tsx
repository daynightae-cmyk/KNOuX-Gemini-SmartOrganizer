import React, { useMemo, useState } from 'react';
import {
  Activity, Bell, Bot, Check, ChevronRight, CircleHelp, Cloud, Database, FileText,
  Folder, Grid2X2, HardDrive, Home, Menu, Moon, MoreHorizontal, Search, Settings,
  Shield, Sun, Wrench, Zap, Play, Pause, Gauge, Cpu, Monitor, Rocket, X,
} from 'lucide-react';
import { KnouxOrbit } from '../../visual/KnouxOrbit';
import type { HomeActivityItem, KpiMetric, PageId, PendingSafeAction, StorageVolumeSnapshot } from '../../lib/home-ui';
import './approved-home.css';

interface Props {
  isArabic: boolean;
  theme: any;
  setTheme: (theme: any) => void;
  onNavigate: (page: PageId | string) => void;
  onOpenPalette: () => void;
  onOpenNotifications?: () => void;
  kpis: KpiMetric[];
  activities: HomeActivityItem[];
  volumes: StorageVolumeSnapshot[];
  pendingActions: PendingSafeAction[];
}

const nav = [
  ['home', 'Home', Home], ['intro', 'Cinematic Intro', CircleHelp], ['smart_scan', 'Smart Scan', Search],
  ['studio', 'Organization Studio', Grid2X2], ['files', 'Files', FileText], ['storage', 'Storage', HardDrive],
  ['applications', 'Applications', Grid2X2], ['startup', 'Startup', Rocket], ['system', 'System', Shield],
  ['repair', 'Repair', Wrench], ['services', 'Services', Settings], ['automation', 'Automation', Zap],
  ['workspace', 'Google Workspace', Cloud], ['settings', 'Settings', Settings], ['assistant', 'AI Assistant', Bot],
] as const;

const access = [
  ['Smart Scan', 'Find and remove junk, duplicates, and issues.', Search, 'smart_scan'],
  ['Files', 'Search and organize your files with intelligent search.', Folder, 'files'],
  ['Applications', 'Manage installed applications and their startup impact.', Grid2X2, 'applications'],
  ['Storage', 'Analyze disk usage and find space consumers.', Database, 'storage'],
  ['Startup Control', 'Optimize startup programs for a faster boot.', Rocket, 'startup'],
  ['System Performance', 'Monitor and optimize your system health.', Monitor, 'system'],
] as const;

const satelliteTools = [
  { id: 'scan', label: 'Smart Scan', icon: Search, target: 'smart_scan' },
  { id: 'files', label: 'Files', icon: Folder, target: 'files' },
  { id: 'apps', label: 'Applications', icon: Grid2X2, target: 'applications' },
  { id: 'system', label: 'System', icon: Monitor, target: 'system' },
  { id: 'storage', label: 'Storage', icon: Database, target: 'storage' },
  { id: 'automation', label: 'Automation', icon: Zap, target: 'automation' },
];

function IconBox({ children, tone = 'violet' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`approved-icon approved-icon-${tone}`}>{children}</span>;
}

export const ApprovedHomeScreen: React.FC<Props> = ({ isArabic, theme, setTheme, onNavigate, onOpenPalette, onOpenNotifications, kpis, activities, volumes, pendingActions }) => {
  const [assistantQuery, setAssistantQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const isNight = theme !== 'light';
  const drive = volumes[0];
  const health = kpis[0];
  const filteredActivities = useMemo(() => activities.slice(0, 5), [activities]);
  const go = (target: string) => { setSelected(target); onNavigate(target); };

  return (
    <div className="approved-home" dir={isArabic ? 'rtl' : 'ltr'} data-theme-mode={isNight ? 'night' : 'day'}>
      <header className="approved-header">
        <button className="approved-brand" onClick={() => go('home')} aria-label="KNOuX Home">
          <img src="/src/visual/assets/knoux-official-logo.png" alt="" /><span><strong>KNOuX</strong><small>SmartOrganizer</small></span>
        </button>
        <button className="approved-search" onClick={onOpenPalette} aria-label="Search files, content, people, projects, or ask KNOuX">
          <Search /> <span>Search files, content, people, projects, or Ask KNOuX...</span><kbd>Ctrl</kbd><kbd>K</kbd>
        </button>
        <div className="approved-header-actions">
          <button onClick={() => setTheme(isNight ? 'light' : 'dark')} aria-label={isNight ? 'Switch to day theme' : 'Switch to night theme'}>{isNight ? <Sun /> : <Moon />}</button>
          <button onClick={onOpenNotifications} aria-label="Notifications"><Bell /><i /></button><span className="approved-divider" />
          <button aria-label="Applications"><Menu /></button><span className="approved-divider" /><button className="approved-avatar" aria-label="Profile">JD</button>
        </div>
      </header>

      <div className="approved-body">
        <aside className="approved-sidebar">
          <nav aria-label="Primary navigation">
            {nav.map(([id, label, Icon]) => { const NavIcon = Icon as React.ElementType; return <button key={id} className={id === 'home' ? 'active' : ''} onClick={() => go(id)} aria-current={id === 'home' ? 'page' : undefined}><NavIcon /><span>{label}</span></button>; })}
          </nav>
          <div className="approved-engine"><span className="engine-dot" /><div><strong>KNOuX Engine</strong><small>Online</small></div><ChevronRight /></div>
          <small className="approved-version">v2.1.0&nbsp; | &nbsp;Premium Edition</small>
        </aside>

        <main className="approved-main">
          <section className="approved-hero">
            <div className="approved-orbit visual-sprint">
              <KnouxOrbit title="KNOuX" subtitle="SmartOrganizer" onActivate={() => go('smart_scan')} tools={satelliteTools.map((tool) => ({ id: tool.id, label: tool.label, icon: tool.icon, onClick: () => go(tool.target) }))} />
            </div>
            <div className="approved-welcome">
              <div className="approved-welcome-title"><IconBox tone="violet"><Zap /></IconBox><div><h1>Welcome to KNOuX</h1><p>Your intelligent system organizer for a cleaner,<br />faster, and more secure Windows experience.</p></div></div>
              <div className="approved-kpis">{[['Smart Tools', '12', Grid2X2], ['Total Findings', '263', FileText], ['Automations', '8', Zap], ['System Status', 'Healthy', Shield]].map(([label, value, Icon]) => { const KpiIcon = Icon as React.ElementType; return <div className="approved-kpi" key={String(label)}><IconBox><KpiIcon /></IconBox><div><strong>{String(value)}</strong><span>{String(label)}</span></div></div>})}</div>
              <div className="approved-hero-actions"><button className="approved-primary" onClick={() => go('smart_scan')}>Start a Quick Scan <ChevronRight /></button><button className="approved-secondary" onClick={onOpenPalette}><Grid2X2 /> Explore Tools</button></div>
            </div>
          </section>

          <section className="approved-section approved-quick"><div className="approved-section-heading"><div><h2><Grid2X2 /> Quick Access Tools</h2><p>Essential tools to keep your system clean, fast, and secure.</p></div><button className="approved-outline"><Settings /> Customize</button><button className="approved-more" aria-label="More quick access options"><MoreHorizontal /></button></div><div className="approved-access-grid">{access.map(([label, description, Icon, target]) => { const AccessIcon = Icon as React.ElementType; return <article className="approved-access-card" key={label}><IconBox><AccessIcon /></IconBox><h3>{label}</h3><p>{description}</p><button onClick={() => go(target)}>Open <ChevronRight /></button></article>})}</div></section>

          <div className="approved-lower-grid">
            <section className="approved-section approved-list"><div className="approved-section-heading"><h2><FileText /> Recent Findings</h2><button>View All</button></div>{[['Temporary Files', '3.8 GB', 'High'], ['Duplicate Files', '248 items', 'Medium'], ['Privacy Traces', '12 items', 'High'], ['System Issues', '3 issues', 'Medium'], ['Startup Items', '18 items', 'Low']].map(([name, value, level]) => <div className="approved-row" key={name}><IconBox tone={level === 'High' ? 'pink' : 'violet'}><FileText /></IconBox><strong>{name}</strong><span>{value}</span><b className={`risk risk-${level.toLowerCase()}`}>{level}</b></div>)}</section>
            <section className="approved-section approved-automation"><div className="approved-section-heading"><h2><Bot /> Automation Overview</h2><button>View All</button></div><div className="automation-stats"><div><Play /><strong>8</strong><span>Active Automations</span></div><div><Settings /><strong>12</strong><span>Scheduled Tasks</span></div><div><RotateIcon /><strong>6</strong><span>Total Runs</span></div><div><Pause /><strong>2</strong><span>Paused</span></div></div><h4>Next Scheduled</h4><button className="scheduled"><Rocket /> <span><strong>Clean Temporary Files</strong><small>Every day at 10:00 PM</small></span><ChevronRight /></button></section>
            <section className="approved-section approved-insights"><div className="approved-section-heading"><h2><Shield /> System Insights</h2><button>View All</button></div>{[['CPU usage is stable', 'Average 65% over the last 5 minutes', 'good'], ['Memory usage is high', '72% used. Consider closing apps.', 'warn'], ['Disk health is good', 'No issues detected', 'good'], ['Startup optimization available', '6 items can be optimized', 'info'], ['System is protected', 'All security components are active', 'good']].map(([title, detail, type]) => <div className="insight-row" key={title}><span className={`insight-dot ${type}`}><Check /></span><div><strong>{title}</strong><small>{detail}</small></div></div>)}</section>
          </div>
        </main>

        <aside className="approved-inspector">
          <section className="approved-side-card"><SideHeading icon={Gauge} title="System Health" /><div className="health-content"><div className="health-gauge"><strong>78%</strong><span>Good</span></div><div className="health-bars">{[['CPU','65%',65,Cpu],['Memory','72%',72,Database],['Disk','28%',28,HardDrive],['Network','12%',12,Activity]].map(([label,value,percent,Icon]) => { const HealthIcon = Icon as React.ElementType; return <div key={String(label)}><HealthIcon /><span>{String(label)}</span><i><b style={{width: `${Number(percent)}%`}} /></i><em>{String(value)}</em></div>})}</div></div><p className="side-note">Your system is running well</p></section>
          <section className="approved-side-card"><SideHeading icon={HardDrive} title="Storage Overview" /><div className="storage-drive"><IconBox tone="blue"><HardDrive /></IconBox><div><strong>C: System Drive</strong><span>{drive?.freeFormatted ?? '182 GB'} free of {drive?.totalFormatted ?? '476 GB'}</span><i><b style={{width: `${drive?.usedPercent ?? 62}%`}} /></i></div></div><div className="storage-chart"><div className="donut"><strong>476 GB</strong><span>Total</span></div><div className="legend">{[['System Files','120 GB'],['Applications','86 GB'],['Documents','54 GB'],['Images','32 GB'],['Videos','24 GB'],['Other','162 GB']].map(([a,b]) => <div key={a}><i />{a}<span>{b}</span></div>)}</div></div></section>
          <section className="approved-side-card approved-assistant"><SideHeading icon={Bot} title="AI Assistant" /><div className="assistant-input"><Search /><input value={assistantQuery} onChange={(e) => setAssistantQuery(e.target.value)} placeholder="Ask KNOuX anything..." aria-label="Ask KNOuX anything" /><button onClick={() => setAssistantQuery('')} aria-label="Send assistant question"><ChevronRight /></button></div><div className="assistant-chips">{['Clean junk files','Find large files','Optimize startup','Check system health','Manage services','Create automation'].map((x) => <button key={x} onClick={() => setAssistantQuery(x)}>{x}</button>)}</div></section>
          <section className="approved-side-card approved-activity"><SideHeading icon={Activity} title="Recent Activity" /><button className="side-view">View All</button>{(filteredActivities.length ? filteredActivities : []).map((item) => <button className="activity-row" key={`${item.id}-${item.title}`} onClick={() => go(item.targetPage)}><span><Check /></span><strong>{isArabic ? item.titleAr : item.title}</strong><small>{isArabic ? item.timeAgoAr : item.timeAgo}</small><ChevronRight /></button>)}</section>
        </aside>
      </div>
    </div>
  );
};

const SideHeading = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => <div className="side-heading"><h2><Icon />{title}</h2><button aria-label={`${title} options`}><MoreHorizontal /></button></div>;
const RotateIcon = () => <span className="rotate-icon"><Activity /></span>;
