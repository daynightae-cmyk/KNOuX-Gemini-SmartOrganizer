/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Home Dashboard Panels
 * Matches the canonical Home Command Center reference image (image_9afc3816.png)
 * 
 * Left Column:
 * - Today's Command Deck (8 feature tiles)
 * - Lower Split:
 *   - Sub-panel 1: System Overview (tabs, 92 ring gauge, multi-line timeline chart with tooltip) & Storage Snapshot (C:, D:, E: drives)
 *   - Sub-panel 2: Quick Access (Word, Excel, Video, JPG, Zip with paths, recency, action menus)
 * 
 * Right Column:
 * - KNOuX Insight card fed by a measured scan or an explicit no-estimate state
 * - Recent Activity & Recommendations (5 items with checkboxes and status icons)
 * - Pending Safe Actions (3 items with checkboxes, Preview buttons, Apply button)
 */

import React, { useEffect, useState } from 'react';
import {
  Lightbulb,
  Activity,
  CheckCircle2,
  Clock,
  Pin,
  FileSpreadsheet,
  FileText,
  Video,
  Archive,
  Image as ImageIcon,
  Folder,
  HardDrive,
  ShieldCheck,
  Shield,
  Info,
  X,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Check,
  Settings,
  Sparkles,
  ArrowRight,
  Globe,
  Rocket,
  Trash2,
  Box,
  Layers,
} from 'lucide-react';
import {
  PageId,
  KnouxInsightData,
  HomeActivityItem,
  KpiMetric,
  QuickAccessItem,
  StorageVolumeSnapshot,
  PendingSafeAction,
} from '../../lib/home-ui';
import type { HomeLiveStatus } from '../../home/live';
import { formatBytes, type HomeSystemMetrics } from '../../home/derive';

export interface HomeDashboardPanelsProps {
  locale?: string;
  onNavigate: (page: PageId | string) => void;
  commandDeckNode?: React.ReactNode;
  activities?: HomeActivityItem[];
  quickAccess?: QuickAccessItem[];
  volumes?: StorageVolumeSnapshot[];
  insight?: KnouxInsightData | null;
  pendingActions?: PendingSafeAction[];
  systemMetrics?: HomeSystemMetrics | null;
  liveStatus?: HomeLiveStatus;
  kpis?: KpiMetric[];
}

export const HomeDashboardPanels: React.FC<HomeDashboardPanelsProps> = ({
  locale = 'en',
  onNavigate,
  commandDeckNode,
  activities: activitiesProp = [],
  quickAccess: quickAccessProp = [],
  volumes: volumesProp = [],
  insight: insightProp = null,
  pendingActions: pendingActionsProp = [],
  systemMetrics = null,
  liveStatus = 'loading',
  kpis = [],
}) => {
  const isAr = locale === 'ar';

  // State
  const insight = insightProp;
  const [isInsightDismissed, setIsInsightDismissed] = useState(false);
  const [insightDetailsOpen, setInsightDetailsOpen] = useState(false);

  // System Overview Tabs
  const [overviewTab, setOverviewTab] = useState<'health' | 'storage' | 'perf' | 'apps'>('health');

  // Quick Access Tabs & Filter
  const [quickTab, setQuickTab] = useState<'files' | 'folders' | 'pinned'>('files');
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('7d');
  const [quickItems, setQuickItems] = useState<QuickAccessItem[]>(quickAccessProp);
  useEffect(() => setQuickItems(quickAccessProp), [quickAccessProp]);

  // Activities
  const [activities, setActivities] = useState<HomeActivityItem[]>(activitiesProp);
  useEffect(() => setActivities(activitiesProp), [activitiesProp]);
  const [selectedActivity, setSelectedActivity] = useState<HomeActivityItem | null>(null);

  // Storage and pending actions are measured props, never fixture state.
  const volumes = volumesProp;
  const pendingActions = pendingActionsProp;
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [previewAction, setPreviewAction] = useState<PendingSafeAction | null>(null);

  const visibleQuickItems = quickItems.filter((item) => {
    if (quickTab === 'pinned' && !item.isPinned) return false;
    if (quickTab === 'folders' && item.category !== 'folder') return false;
    if (timeFilter !== 'all' && item.modifiedAt) {
      const windowMs = (timeFilter === '7d' ? 7 : 30) * 86400000;
      const modified = new Date(item.modifiedAt).getTime();
      if (Number.isFinite(modified) && modified < Date.now() - windowMs) return false;
    }
    return true;
  });

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPinned: !item.isPinned } : item))
    );
  };

  const handleActionToggle = (id: string) => {
    setSelectedActionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleActivityCheckToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivities((prev) =>
      prev.map((act) => (act.id === id ? { ...act, isChecked: !act.isChecked } : act))
    );
  };

  // Custom high-fidelity file icon renderer matching screenshot
  const renderCustomFileIcon = (category: QuickAccessItem['category']) => {
    switch (category) {
      case 'document':
        return (
          <div className="w-6 h-6 rounded bg-[#2b579a] flex items-center justify-center text-white font-bold text-[10px] shadow-sm shrink-0">
            W
          </div>
        );
      case 'spreadsheet':
        return (
          <div className="w-6 h-6 rounded bg-[#217346] flex items-center justify-center text-white font-bold text-[10px] shadow-sm shrink-0">
            X
          </div>
        );
      case 'video':
        return (
          <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Video className="w-3.5 h-3.5" />
          </div>
        );
      case 'picture':
        return (
          <div className="w-6 h-6 rounded bg-sky-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
        );
      case 'archive':
        return (
          <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Archive className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded bg-slate-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  // Render activity icon matching screenshot
  const renderActivityIcon = (icon: HomeActivityItem['icon']) => {
    switch (icon) {
      case 'scan':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'folder':
        return <Folder className="w-4 h-4 text-amber-400" />;
      case 'app':
        return <Globe className="w-4 h-4 text-sky-400" />;
      case 'startup':
        return <Rocket className="w-4 h-4 text-purple-400" />;
      case 'repair':
      default:
        return <ShieldCheck className="w-4 h-4 text-cyan-400" />;
    }
  };

  // Render safe action icon matching screenshot
  const renderSafeActionIcon = (type: PendingSafeAction['iconType']) => {
    switch (type) {
      case 'folder':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Folder className="w-4 h-4" />
          </div>
        );
      case 'app':
        return (
          <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Box className="w-4 h-4" />
          </div>
        );
      case 'browser':
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="flex gap-3 flex-1 min-h-0 overflow-hidden text-slate-100">
      {/* =========================================================================
         LEFT WORK AREA (~66% OF MAIN WIDTH)
         ========================================================================= */}
      <div className="flex-[66] flex flex-col gap-3 min-w-0 overflow-y-auto pr-0.5 knx-custom-scrollbar">
        {/* Today's Command Deck (4x2 cards) */}
        {commandDeckNode}

        {/* Lower Split: System Overview + Quick Access side-by-side */}
        <div className="grid grid-cols-2 gap-3 min-h-[220px]">
          {/* ================= CARD 1: SYSTEM OVERVIEW & STORAGE SNAPSHOT ================= */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#071329]/90 border border-[#152e50] shadow-sm">
            {/* Header with Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 border-b border-[#0d2342]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-white">
                  {isAr ? 'نظرة عامة على النظام' : 'System Overview'}
                </span>
                <span className="text-[8px] font-mono text-slate-500" data-testid="home-dashboard-status">
                  {liveStatus === 'live' ? 'LIVE' : liveStatus === 'partial' ? 'PARTIAL' : liveStatus === 'native-required' ? 'NO NATIVE' : 'MEASURING'}
                </span>
              </div>

              {/* Segmented control tabs */}
              <div className="flex items-center gap-1 bg-[#040c1d] p-0.5 rounded-lg border border-[#132847]">
                <button
                  onClick={() => setOverviewTab('health')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    overviewTab === 'health'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'الصحة' : 'System Health'}
                </button>
                <button
                  onClick={() => setOverviewTab('storage')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    overviewTab === 'storage'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'التخزين' : 'Storage'}
                </button>
                <button
                  onClick={() => setOverviewTab('perf')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    overviewTab === 'perf'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'الأداء' : 'Performance'}
                </button>
                <button
                  onClick={() => setOverviewTab('apps')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    overviewTab === 'apps'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'التطبيقات' : 'Apps & Services'}
                </button>
              </div>
            </div>

            {overviewTab === 'storage' ? (
              <div className="pt-1 space-y-2" data-testid="home-system-storage">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-[#122847] bg-[#040c1d] p-2">
                    <div className="text-[9px] text-slate-400">{isAr ? 'إجمالي المساحة' : 'Total capacity'}</div>
                    <div className="text-sm font-black text-white font-mono" dir="ltr">{formatBytes(volumes.reduce((sum, volume) => sum + volume.totalBytes, 0))}</div>
                  </div>
                  <div className="rounded-lg border border-[#122847] bg-[#040c1d] p-2">
                    <div className="text-[9px] text-slate-400">{isAr ? 'المساحة الحرة' : 'Free space'}</div>
                    <div className="text-sm font-black text-emerald-300 font-mono" dir="ltr">{formatBytes(volumes.reduce((sum, volume) => sum + volume.freeBytes, 0))}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{volumes.length} {isAr ? 'أحجام مقيسة' : 'measured volume(s)'}</span>
                  <button onClick={() => onNavigate('storage')} className="text-cyan-300 hover:text-white">{isAr ? 'فتح أطلس التخزين ←' : 'Open Volume Atlas →'}</button>
                </div>
              </div>
            ) : overviewTab === 'apps' ? (
              <div className="grid grid-cols-2 gap-2 pt-1" data-testid="home-system-apps">
                {[
                  { kpi: kpis.find((entry) => entry.id === 'kpi-apps'), page: 'applications' as const, label: isAr ? 'التطبيقات المثبتة' : 'Installed applications' },
                  { kpi: kpis.find((entry) => entry.id === 'kpi-services'), page: 'services' as const, label: isAr ? 'الخدمات العاملة' : 'Services running' },
                ].map((entry) => (
                  <button key={entry.page} onClick={() => onNavigate(entry.page)} className="rounded-lg border border-[#122847] bg-[#040c1d] p-2 text-start hover:border-cyan-500/50">
                    <div className="text-[9px] text-slate-400">{entry.label}</div>
                    <div className="text-sm font-black text-white font-mono" dir="ltr">{entry.kpi?.value || '—'}</div>
                    <div className="text-[8.5px] text-slate-500 truncate">{entry.kpi?.badge || (isAr ? 'غير مقيس' : 'Not measured')}</div>
                  </button>
                ))}
              </div>
            ) : (
            <div className="flex items-center gap-3 pt-1" data-testid="home-system-live">
              <div className="flex flex-col items-center justify-center shrink-0 cursor-pointer hover:brightness-110 transition-all" onClick={() => onNavigate('system')}>
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#0f294d" strokeWidth="8" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#gauge-cyan-teal)"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 * (1 - (systemMetrics?.cpuPercent ?? 0) / 100)}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <defs>
                      <linearGradient id="gauge-cyan-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="60%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-white leading-none" data-testid="home-cpu-value">
                      {systemMetrics?.cpuPercent == null ? '—' : Math.round(systemMetrics.cpuPercent)}
                    </span>
                    <span className="text-[9px] font-bold text-cyan-300 mt-0.5">
                      {systemMetrics?.cpuPercent == null ? (isAr ? 'غير مقيس' : 'Not measured') : (isAr ? 'حمل المعالج' : 'CPU load')}
                    </span>
                  </div>
                </div>
                <span className="text-[9.5px] text-slate-400 mt-1 text-center max-w-[100px] leading-tight">
                  {systemMetrics?.observedAt ? `${isAr ? 'عينة' : 'Sample'} ${new Date(systemMetrics.observedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : (isAr ? 'بانتظار القياس' : 'Awaiting measurement')}
                </span>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                {[
                  { key: 'cpu', label: isAr ? 'المعالج' : 'CPU', value: systemMetrics?.cpuPercent ?? null, color: '#3b82f6' },
                  { key: 'memory', label: isAr ? 'الذاكرة' : 'Memory', value: systemMetrics?.memoryPercent ?? null, color: '#a855f7' },
                  { key: 'disk', label: isAr ? 'قرص النظام' : 'System disk used', value: systemMetrics?.diskPercent ?? null, color: '#06b6d4' },
                ].map((metric) => (
                  <div key={metric.key} className="flex items-center gap-2" data-testid={`home-metric-${metric.key}`}>
                    <span className="w-20 text-[10px] text-slate-400 shrink-0 truncate">{metric.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${metric.value == null ? 0 : Math.max(1, Math.min(100, metric.value))}%`, backgroundColor: metric.color }} />
                    </div>
                    <span className="w-10 text-[10px] font-mono text-slate-200 text-end shrink-0" dir="ltr">
                      {metric.value == null ? '—' : `${Math.round(metric.value)}%`}
                    </span>
                  </div>
                ))}
                <div className="text-[9px] text-slate-500 leading-tight">
                  {isAr
                    ? 'قيم حالية من ملخص النظام الأصلي. لا تُعرض سلسلة تاريخية غير مقيسة.'
                    : 'Current values from the native system summary. No unmeasured historical series is shown.'}
                </div>
                {systemMetrics?.osCaption ? <div className="text-[9px] font-mono text-slate-500 truncate">{systemMetrics.osCaption}</div> : null}
              </div>
            </div>
            )}

            {/* Storage Snapshot Sub-panel directly underneath */}
            <div className="pt-2 border-t border-[#0d2342] mt-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs font-bold text-white">
                    {isAr ? 'لقطة التخزين' : 'Storage Snapshot'}
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('storage')}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{isAr ? 'عرض في أطلس التخزين' : 'View in Volume Atlas'}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Measured volumes: no invented drive labels or capacities. */}
              <div className="grid grid-cols-3 gap-2">
                {volumes.length ? volumes.slice(0, 3).map((volume, index) => (
                  <div
                    key={volume.id}
                    data-testid={`home-volume-${index}`}
                    onClick={() => onNavigate('storage')}
                    className="p-1.5 rounded-lg bg-[#040c1d] border border-[#122847] hover:border-sky-500/50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                        <HardDrive className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-white truncate" dir="ltr">{volume.letter}</div>
                        <div className="text-[8.5px] text-slate-400 truncate">{volume.label}</div>
                      </div>
                      <span className="text-[8.5px] font-mono text-emerald-400 ml-auto whitespace-nowrap">
                        {volume.freeFormatted}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 flex overflow-hidden mt-1.5">
                      <div className="h-full" style={{ width: `${volume.usedPercent}%`, backgroundColor: volume.accentColor }} />
                      <div className="h-full bg-emerald-400" style={{ width: `${volume.freePercent}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[7.5px] text-slate-400 mt-1">
                      <span>{isAr ? 'مستخدم' : 'Used'} {volume.usedPercent}%</span>
                      <span>{isAr ? 'حر' : 'Free'} {volume.freePercent}%</span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-3 rounded-lg border border-dashed border-[#17325c] p-3 text-center text-[10px] text-slate-400">
                    {isAr ? 'لا توجد أحجام مقيسة. افتح أطلس التخزين أو تحقق من جسر النظام.' : 'No measured volumes. Open Volume Atlas or check the native system bridge.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= CARD 2: QUICK ACCESS ================= */}
          <div className="flex flex-col p-3 rounded-xl bg-[#071329]/90 border border-[#152e50] shadow-sm">
            {/* Header with Dropdown Filter */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#0d2342]">
              <span className="text-xs font-bold text-white">
                {isAr ? 'الوصول السريع' : 'Quick Access'}
              </span>

              {/* Dropdown pill */}
              <div className="relative">
                <button
                  onClick={() => setTimeFilter((prev) => (prev === '7d' ? '30d' : '7d'))}
                  className="px-2 py-0.5 rounded text-[10px] bg-[#040c1d] border border-[#132847] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <span>{timeFilter === '7d' ? 'Last 7 Days' : 'Last 30 Days'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Tabs & View All */}
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-1 bg-[#040c1d] p-0.5 rounded-lg border border-[#132847]">
                <button
                  onClick={() => setQuickTab('files')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    quickTab === 'files'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'الملفات الأخيرة' : 'Recent Files'}
                </button>
                <button
                  onClick={() => setQuickTab('folders')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    quickTab === 'folders'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'المجلدات' : 'Recent Folders'}
                </button>
                <button
                  onClick={() => setQuickTab('pinned')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    quickTab === 'pinned'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'المثبتة' : 'Pinned'}
                </button>
              </div>

              <button
                onClick={() => onNavigate('files')}
                className="text-[10.5px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-0.5 cursor-pointer"
              >
                <span>{isAr ? 'عرض الكل' : 'View All'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Recent files measured from an authorized source only. */}
            <div className="flex-1 flex flex-col justify-between space-y-1 mt-0.5">
              {visibleQuickItems.length ? visibleQuickItems.slice(0, 5).map((file) => (
                <div
                  key={file.id}
                  data-testid="home-quick-row"
                  onClick={() => onNavigate('files')}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-[#040b19]/60 hover:bg-[#091830] border border-transparent hover:border-[#173866] transition cursor-pointer group"
                >
                  {/* Left: icon + name + path */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {renderCustomFileIcon(file.category)}
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                        {file.name}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono truncate">
                        {file.path}
                      </div>
                    </div>
                  </div>

                  {/* Right: time + action menu */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9.5px] text-slate-400 font-mono">
                      {isAr ? file.lastModifiedAr : file.lastModified}
                    </span>
                    <button
                      onClick={(e) => togglePin(file.id, e)}
                      className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition"
                      title={file.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-[#17325c] p-3 text-center text-[10px] text-slate-400">
                  {quickTab === 'folders'
                    ? (isAr ? 'لا توجد مجلدات مقيسة في هذه القائمة. افتح Files لاستكشاف المجلدات.' : 'No measured folders in this list. Open Files to browse folders.')
                    : quickTab === 'pinned'
                      ? (isAr ? 'لا توجد عناصر مثبتة. ثبّت ملفًا من القائمة.' : 'No pinned items. Pin a file from the list.')
                      : (isAr ? 'لا توجد ملفات حديثة مقيسة. صرّح بمجلد وفهرسه في Files.' : 'No measured recent files. Authorize and index a folder in Files.')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
         RIGHT INSIGHT & ACTIVITY COLUMN (~34% OF MAIN WIDTH)
         ========================================================================= */}
      <div className="flex-[34] flex flex-col gap-3 min-w-0 overflow-y-auto pr-0.5 knx-custom-scrollbar">
        {/* ================= CARD 1: KNOuX INSIGHT [AI] ================= */}
        {insight && !isInsightDismissed && (
          <section className="p-3.5 rounded-xl bg-gradient-to-b from-[#0b1730] to-[#060e20] border border-[#1b3f70] shadow-md relative overflow-hidden shrink-0">
            {/* Header: Sparkle + Title + AI badge + Three-dot menu */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-white tracking-wide">
                  KNOuX Insight
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-700 text-white font-bold text-[9px] shadow-sm">
                  {insight?.id==='insight-live'?(isAr?'دليل مقيس':'Measured'):(isAr?'غير مقيس':'Not measured')}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsInsightDismissed(true)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
                  title="Dismiss recommendation"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Glowing amber lightbulb icon + Text */}
            <div className="flex items-start gap-3 my-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-amber-500/20 to-amber-600/5 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.25)] shrink-0 mt-0.5">
                <Lightbulb className="w-5 h-5 text-amber-400" />
              </div>

              <div className="min-w-0">
                <h3 className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                  {isAr ? insight.titleAr : insight.title}
                </h3>
                <p className="text-[10.5px] text-slate-300 mt-1 leading-relaxed">
                  {isAr ? insight.descriptionAr : insight.description}
                </p>
              </div>
            </div>

            {/* Two Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => onNavigate(insight.targetPage)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(37,99,235,0.4)] transition cursor-pointer"
              >
                <span>{isAr ? insight.actionTextAr : insight.actionText}</span>
              </button>

              <button
                onClick={() => setInsightDetailsOpen(true)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-[#08152e] hover:bg-[#0e2147] text-slate-200 hover:text-white border border-[#1b3f70] text-xs flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? insight.detailsTextAr : insight.detailsText}</span>
              </button>
            </div>
          </section>
        )}

        {/* ================= CARD 2: RECENT ACTIVITY & RECOMMENDATIONS ================= */}
        <section className="p-3 rounded-xl bg-[#071329]/90 border border-[#152e50] shadow-sm flex flex-col justify-between shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#0d2342] mb-1.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold text-white">
                {isAr ? 'النشاط الأخير والتوصيات' : 'Recent Activity & Recommendations'}
              </span>
            </div>

            <button
              onClick={() => onNavigate('automation')}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Real measured activity only. */}
          <div className="space-y-1.5">
            {activities.length ? activities.map((act) => (
              <div
                key={act.id}
                data-testid="home-activity-row"
                onClick={() => setSelectedActivity(act)}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#0a1b38] transition cursor-pointer group"
              >
                {/* Left: Checkbox + Icon + Title + Detail */}
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {/* Styled Checkbox */}
                  <div
                    onClick={(e) => handleActivityCheckToggle(act.id, e)}
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition ${
                      act.isChecked
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'border-slate-600 bg-slate-900'
                    }`}
                  >
                    {act.isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>

                  {/* Icon */}
                  <div className="shrink-0">{renderActivityIcon(act.icon)}</div>

                  {/* Texts */}
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                      {isAr ? act.titleAr : act.title}
                    </div>
                    <div className="text-[9.5px] text-slate-400 truncate">
                      {isAr ? act.detailAr : act.detail}
                    </div>
                  </div>
                </div>

                {/* Right: Time + Chevron */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap">
                    {isAr ? act.timeAgoAr : act.timeAgo}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-white transition" />
                </div>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-[#17325c] p-3 text-center text-[10px] text-slate-400">
                {isAr ? 'لا يوجد نشاط موثق بعد. نفّذ فحصًا أو معاينة جافة حقيقية لتظهر هنا.' : 'No verified activity yet. Run a real scan or dry-run to populate this list.'}
              </div>
            )}
          </div>
        </section>

        {/* ================= CARD 3: PENDING SAFE ACTIONS ================= */}
        <section className="p-3 rounded-xl bg-[#071329]/90 border border-[#152e50] shadow-sm flex flex-col justify-between shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#0d2342] mb-1.5">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-white">
                {isAr ? 'الإجراءات الآمنة المعلقة' : 'Pending Safe Actions'}
              </span>
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                {pendingActions.length}
              </span>
            </div>

            <button
              onClick={() => onNavigate('cleanup')}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[9.5px] text-slate-400 mb-2">
            {isAr
              ? 'مراجعة المرشحات المقيسة؛ التنفيذ يتطلب موافقة داخل القسم المسؤول ولا يحدث من Home.'
              : 'Review measured candidates; execution requires approval inside the owning service and never happens from Home.'}
          </p>

          <div className="space-y-1.5 mb-2.5">
            {pendingActions.length ? pendingActions.map((act) => {
              const isSelected = selectedActionIds.includes(act.id);
              const isExpanded = expandedActionId === act.id;

              return (
                <div
                  key={act.id}
                  className="p-1.5 rounded-lg bg-[#040b19]/60 border border-[#102444] hover:border-[#1a3d6d] transition"
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Checkbox + Icon + Title + Scope */}
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleActionToggle(act.id)}
                        className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      {renderSafeActionIcon(act.iconType)}
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-200 truncate">
                          {isAr ? act.titleAr : act.title}
                        </div>
                        <div className="text-[9.5px] text-slate-400 truncate">
                          {isAr ? act.scopeAr : act.scope}
                        </div>
                      </div>
                    </div>

                    {/* Right: Preview button + Expand chevron */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setPreviewAction(act)}
                        className="px-2 py-0.5 rounded bg-[#091830] hover:bg-[#102952] border border-[#173866] text-slate-300 hover:text-white text-[10px] font-medium transition cursor-pointer"
                      >
                        {isAr ? 'معاينة' : 'Preview'}
                      </button>
                      <button
                        onClick={() => setExpandedActionId(isExpanded ? null : act.id)}
                        className="p-1 text-slate-500 hover:text-white transition cursor-pointer"
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Scope Details */}
                  {isExpanded && (
                    <div className="mt-1.5 pt-1.5 border-t border-[#0e223d] text-[10px] text-slate-300">
                      <p>{isAr ? act.previewSummaryAr : act.previewSummary}</p>
                      <div className="mt-1 flex items-center justify-between text-emerald-400 font-medium">
                        <span>{isAr ? act.safetyLevelAr : act.safetyLevel}</span>
                        <button
                          onClick={() => onNavigate(act.targetPage)}
                          className="text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{isAr ? 'فتح القسم' : 'Open Section'}</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="rounded-lg border border-dashed border-[#17325c] p-3 text-center text-[10px] text-slate-400">
                {isAr ? 'لا توجد إجراءات معلقة موثقة. نفّذ فحصًا ذكيًا لإنشاء مرشحات قابلة للمراجعة.' : 'No verified pending actions. Run Smart Scan to create reviewable candidates.'}
              </div>
            )}
          </div>

          {/* Sticky review footer: navigation, not an execution claim. */}
          <button
            onClick={() => onNavigate('cleanup')}
            className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
              selectedActionIds.length > 0
                ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                : 'bg-[#08152e] hover:bg-[#0c2044] border-[#183660] text-slate-400'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {isAr
                ? `مراجعة المحدد في التنظيف (${selectedActionIds.length})`
                : `Review selected in Cleanup (${selectedActionIds.length})`}
            </span>
          </button>
        </section>
      </div>

      {/* =========================================================================
         IN-APP MODALS (INSIGHT DETAILS, ACTIVITY INSPECTOR, PREVIEW SAFETY)
         ========================================================================= */}

      {/* INSIGHT DETAILS MODAL */}
      {insightDetailsOpen && insight && (
        <div className="knx-modal-backdrop" onClick={() => setInsightDetailsOpen(false)}>
          <div
            className="knx-modal-card max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  {isAr ? 'تفاصيل توصية KNOuX الذكية' : 'KNOuX Smart Insight Analysis'}
                </h3>
              </div>
              <button
                className="text-slate-400 hover:text-white p-1 rounded"
                onClick={() => setInsightDetailsOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-slate-300 my-3">
              <p>{isAr ? insight.descriptionAr : insight.description}</p>

              <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">{isAr ? 'مرشحات موثقة:' : 'Verified reclaimable:'}</span>
                  <span className="text-emerald-400 font-semibold">{insight.reclaimGb > 0 ? `${insight.reclaimGb} GB` : '—'}</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  {isAr
                    ? 'لا تُعرض تفاصيل فئات غير مقيسة. افتح التنظيف لفحص الخطة الثابتة والأدلة.'
                    : 'No unmeasured category breakdown is shown. Open Cleanup to inspect the immutable plan and evidence.'}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-amber-200 bg-amber-950/30 p-2 rounded border border-amber-800/60">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? 'هذه مراجعة فقط. لا تحذف Home أي ملف؛ يتطلب التنفيذ موافقة صريحة داخل قسم التنظيف.'
                    : 'Review only. Home deletes nothing; execution requires explicit approval inside Cleanup.'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-700">
              <button
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
                onClick={() => setInsightDetailsOpen(false)}
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <button
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5"
                onClick={() => {
                  setInsightDetailsOpen(false);
                  onNavigate('cleanup');
                }}
              >
                <span>{isAr ? 'الانتقال إلى مساحة التنظيف' : 'Open in Cleanup Center →'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY INSPECTOR MODAL */}
      {selectedActivity && (
        <div className="knx-modal-backdrop" onClick={() => setSelectedActivity(null)}>
          <div
            className="knx-modal-card max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  {isAr ? selectedActivity.titleAr : selectedActivity.title}
                </h3>
              </div>
              <button
                className="text-slate-400 hover:text-white p-1 rounded"
                onClick={() => setSelectedActivity(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-300 my-3">
              <p>{isAr ? selectedActivity.detailAr : selectedActivity.detail}</p>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{isAr ? selectedActivity.timeAgoAr : selectedActivity.timeAgo}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-700 text-xs">
              <button
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                onClick={() => setSelectedActivity(null)}
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <button
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1"
                onClick={() => {
                  const target = selectedActivity.targetPage;
                  setSelectedActivity(null);
                  onNavigate(target);
                }}
              >
                <span>{isAr ? 'الانتقال للقسم المعني' : 'Navigate to Workspace'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAFE ACTION PREVIEW MODAL */}
      {previewAction && (
        <div className="knx-modal-backdrop" onClick={() => setPreviewAction(null)}>
          <div
            className="knx-modal-card max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">
                  {isAr ? previewAction.titleAr : previewAction.title}
                </h3>
              </div>
              <button
                className="text-slate-400 hover:text-white p-1 rounded"
                onClick={() => setPreviewAction(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-slate-300 my-3">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'نطاق العملية:' : 'Scope:'}</span>
                  <span className="font-mono text-slate-200">
                    {isAr ? previewAction.scopeAr : previewAction.scope}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'المساحة المقدرة:' : 'Estimated Gain:'}</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {previewAction.sizeFormatted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'عدد العناصر المستهدفة:' : 'Items Count:'}</span>
                  <span className="font-mono text-cyan-400">
                    {previewAction.itemsCount} {isAr ? 'عنصر' : 'items'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1 text-emerald-400 font-semibold">
                  <span className="text-slate-400">{isAr ? 'مستوى الأمان المعتمد:' : 'Safety Level:'}</span>
                  <span>{isAr ? previewAction.safetyLevelAr : previewAction.safetyLevel}</span>
                </div>
              </div>

              <p className="text-slate-300">
                {isAr ? previewAction.previewSummaryAr : previewAction.previewSummary}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-700 text-xs">
              <button
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                onClick={() => setPreviewAction(null)}
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <button
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1"
                onClick={() => {
                  const target = previewAction.targetPage;
                  setPreviewAction(null);
                  onNavigate(target);
                }}
              >
                <span>{isAr ? 'فتح وإجراء في القسم المخصص' : 'Open in Target Section'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
