/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — REF-00 Home Command Center UI Models & Fixtures
 * Matches the canonical Home Command Center reference image (image_9afc3816.png)
 */

export type PageId =
  | 'home'
  | 'scan'
  | 'studio'
  | 'applications'
  | 'files'
  | 'storage'
  | 'cleanup'
  | 'startup'
  | 'system'
  | 'repair'
  | 'services'
  | 'network'
  | 'hardware'
  | 'automation'
  | 'history'
  | 'settings';

export interface DeckTile {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  targetPage: PageId;
  accent: 'azure' | 'teal' | 'violet' | 'amber' | 'orange' | 'purple' | 'cyan' | 'coral';
  icon: 'scan' | 'folder' | 'cube' | 'disk' | 'broom' | 'rocket' | 'waveform' | 'wrench';
  tag?: string;
  badge?: string;
  isVisible: boolean;
  order: number;
}

export interface KpiMetric {
  id: string;
  title: string;
  titleAr: string;
  value: string;
  subtext: string;
  subtextAr: string;
  badge?: string;
  badgeColor?: string;
  status: 'optimal' | 'info' | 'warning' | 'alert';
  trend: 'up' | 'down' | 'neutral';
  sparkline: number[];
  color: string;
  targetPage: PageId;
  icon: 'shield' | 'files' | 'database' | 'zap' | 'grid' | 'settings';
}

export interface KnouxInsightData {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  actionText: string;
  actionTextAr: string;
  detailsText: string;
  detailsTextAr: string;
  reclaimGb: number;
  riskLevel: 'safe' | 'low' | 'moderate';
  targetPage: PageId;
}

export interface HomeActivityItem {
  id: string;
  title: string;
  titleAr: string;
  detail: string;
  detailAr: string;
  timeAgo: string;
  timeAgoAr: string;
  status: 'success' | 'info' | 'warning';
  icon: 'scan' | 'folder' | 'app' | 'startup' | 'repair' | 'service';
  targetPage: PageId;
  isChecked?: boolean;
}

export interface QuickAccessItem {
  id: string;
  name: string;
  path: string;
  category: 'document' | 'spreadsheet' | 'video' | 'picture' | 'archive' | 'folder';
  size: string;
  lastModified: string;
  lastModifiedAr: string;
  modifiedAt?: string;
  isPinned: boolean;
}

export interface StorageVolumeSnapshot {
  id: string;
  letter: string;
  label: string;
  labelAr: string;
  totalBytes: number;
  freeBytes: number;
  totalFormatted: string;
  freeFormatted: string;
  usedFormatted: string;
  usedPercent: number;
  freePercent: number;
  fileSystem: string;
  accentColor: string;
  status: 'healthy' | 'caution' | 'critical';
}

export interface PendingSafeAction {
  id: string;
  title: string;
  titleAr: string;
  scope: string;
  scopeAr: string;
  sizeFormatted: string;
  targetPage: PageId;
  previewSummary: string;
  previewSummaryAr: string;
  safetyLevel: string;
  safetyLevelAr: string;
  itemsCount: number;
  iconType: 'folder' | 'app' | 'browser';
}

export const INITIAL_DECK_TILES: DeckTile[] = [
  {
    id: 'tile-scan',
    title: 'Smart Scan',
    titleAr: 'الفحص الذكي',
    subtitle: 'Analyze & clean',
    subtitleAr: 'فحص وتنظيف شامل',
    targetPage: 'scan',
    accent: 'azure',
    icon: 'scan',
    isVisible: true,
    order: 1,
  },
  {
    id: 'tile-studio',
    title: 'Organize Files',
    titleAr: 'تنظيم الملفات',
    subtitle: 'Find & structure',
    subtitleAr: 'بحث وتصنيف ذكي',
    targetPage: 'studio',
    accent: 'teal',
    icon: 'folder',
    isVisible: true,
    order: 2,
  },
  {
    id: 'tile-apps',
    title: 'Applications',
    titleAr: 'التطبيقات',
    subtitle: 'Manage apps',
    subtitleAr: 'إدارة وتحديث البرامج',
    targetPage: 'applications',
    accent: 'violet',
    icon: 'cube',
    isVisible: true,
    order: 3,
  },
  {
    id: 'tile-storage',
    title: 'Storage',
    titleAr: 'التخزين',
    subtitle: 'Explore & analyze',
    subtitleAr: 'استكشاف وتحليل السعة',
    targetPage: 'storage',
    accent: 'amber',
    icon: 'disk',
    isVisible: true,
    order: 4,
  },
  {
    id: 'tile-cleanup',
    title: 'Cleanup',
    titleAr: 'تنظيف المخلفات',
    subtitle: 'Free up space',
    subtitleAr: 'تفريغ المساحة بأمان',
    targetPage: 'cleanup',
    accent: 'orange',
    icon: 'broom',
    isVisible: true,
    order: 5,
  },
  {
    id: 'tile-startup',
    title: 'Startup Control',
    titleAr: 'بدء التشغيل',
    subtitle: 'Optimize boot',
    subtitleAr: 'تسريع الإقلاع وتأخير البرامج',
    targetPage: 'startup',
    accent: 'purple',
    icon: 'rocket',
    isVisible: true,
    order: 6,
  },
  {
    id: 'tile-system',
    title: 'System Live Pulse',
    titleAr: 'نبض النظام الحي',
    subtitle: 'Monitor health',
    subtitleAr: 'مراقبة العتاد والأداء',
    targetPage: 'system',
    accent: 'cyan',
    icon: 'waveform',
    isVisible: true,
    order: 7,
  },
  {
    id: 'tile-repair',
    title: 'Repair Lab',
    titleAr: 'مختبر الصيانة',
    subtitle: 'Diagnose & fix',
    subtitleAr: 'تشخيص وإصلاح المشاكل',
    targetPage: 'repair',
    accent: 'coral',
    icon: 'wrench',
    isVisible: true,
    order: 8,
  },
];
