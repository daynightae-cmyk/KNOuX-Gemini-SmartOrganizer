/**
 * KNOuX SmartOrganizer — measured Smart Scan view models.
 *
 * These types describe what the renderer can render from a real ScanSession.
 * There is no fixture shape: every value below is either measured, explicitly
 * unavailable, or an honest presentation of measured evidence.
 */

import type { ScanSessionStatus, ScanStageStatus } from '../../shared/native-contracts';

export type ScanCategory = 'junk' | 'duplicates' | 'large' | 'system' | 'privacy' | 'other';

export interface KpiMetric {
  id: string;
  labelEn: string;
  labelAr: string;
  value: string;
  subtextEn: string;
  subtextAr: string;
  accentColor: 'cyan' | 'blue' | 'red' | 'purple' | 'teal' | 'green';
  indicatorType: 'ring' | 'stack' | 'alert' | 'disk' | 'shield' | 'sparkline';
  provenance: 'measured' | 'partial' | 'unavailable';
}

export interface ScanServiceMeta {
  id: string;
  titleEn: string;
  titleAr: string;
  subtextEn: string;
  subtextAr: string;
  iconName: string;
  accentGradient: string;
  badge?: string;
  state: 'available' | 'partial' | 'gated';
  requiresSource: boolean;
  stages: string[];
  noteEn: string;
  noteAr: string;
  targetWorkspace?: string;
}

export interface PathPreviewItem {
  id: string;
  path: string;
  sizeDisplay: string;
}

export interface ScanResultItem {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: ScanCategory;
  categoryLabelEn: string;
  categoryLabelAr: string;
  itemCount: number;
  bytes: number;
  impactLevel: 'high' | 'medium' | 'low';
  status: 'info' | 'review' | 'attention';
  statusLabelEn: string;
  statusLabelAr: string;
  provenanceLabelEn: string;
  provenanceLabelAr: string;
  pathsPreview: PathPreviewItem[];
  detailedDescriptionEn: string;
  detailedDescriptionAr: string;
  evidence: string;
}

export interface BreakdownCategory {
  id: ScanCategory;
  labelEn: string;
  labelAr: string;
  count: number;
  bytes: number;
  percentage: number;
  colorHex: string;
}

export interface RecentScanRecord {
  id: string;
  mode: 'quick' | 'deep' | 'service' | 'custom';
  sourceLabel: string | null;
  status: ScanSessionStatus;
  filesIndexed: number | null;
  findingsCount: number;
  finishedAt: string | null;
  timeDisplayEn: string;
  timeDisplayAr: string;
}

export interface ScanStageView {
  id: string;
  labelEn: string;
  labelAr: string;
  provider: string;
  status: ScanStageStatus;
  detail: string | null;
  durationMs: number | null;
  errorCode: string | null;
}

export interface ActiveScanView {
  sessionId: string;
  mode: string;
  sourceLabel: string | null;
  scope: string;
  progressPercent: number;
  status: ScanSessionStatus | 'starting';
  stages: ScanStageView[];
  startedAt: string;
}
