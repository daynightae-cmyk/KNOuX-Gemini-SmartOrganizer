/**
 * KNOuX Gemini — versioned native bridge contracts.
 *
 * This file is the renderer's source of truth. The Electron main/preload pair
 * reads the same capability/channel identifiers from native-contract.json.
 * Bump contractVersion for any breaking envelope or capability change; never
 * add a generic execute channel.
 */
import contract from './native-contract.json';

export const NATIVE_CONTRACT_VERSION = contract.contractVersion;
export const NATIVE_NAMESPACE = contract.namespace;
export const NATIVE_CHANNELS = contract.channels;
export const NATIVE_CAPABILITIES = contract.capabilities;
export const WINDOW_ACTIONS = contract.windowActions;

export type NativeStatus =
  | 'available'
  | 'unavailable'
  | 'unsupported'
  | 'permission_denied'
  | 'partial'
  | 'cancelled'
  | 'failed'
  | 'complete';

export type ProviderMode = 'measured' | 'fixture' | 'unavailable';
export type PermissionGate = 'read-only' | 'user-initiated' | 'not-granted';
export type RiskLevel = 'read-only' | 'safe-write' | 'system-change' | 'administrator' | 'destructive';

export interface SourceProvenance {
  provider: string;
  mode: ProviderMode;
  observedAt: string;
  coverage?: 'full' | 'partial' | 'unknown';
  permissions?: string[];
  warnings?: string[];
}

export interface NativeError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface NativeEnvelope<T = unknown> {
  contractVersion: number;
  capability: string;
  requestId: string;
  status: NativeStatus;
  source: string;
  observedAt: string;
  permission: PermissionGate;
  warnings: string[];
  data?: T;
  error?: NativeError;
  provenance?: SourceProvenance;
}

export interface ProviderCapability {
  id: string;
  title: string;
  mode: 'read-only' | 'user-initiated';
  channel: string;
  status: NativeStatus;
  detail?: string;
}

export interface NativeRequest<T = unknown> {
  contractVersion: number;
  capability: string;
  requestId?: string;
  payload?: T;
}

/**
 * Reserved for later section providers; platform version 1 does not stream
 * operations. Keeping the shape here prevents each section inventing its own.
 */
export interface OperationProgress {
  operationId: string;
  phase: string;
  current?: number;
  total?: number;
  percent?: number;
  message: string;
  at: string;
}

export interface OperationPlan {
  planId: string;
  capability: string;
  risk: RiskLevel;
  scopeSummary: string;
  effects: string[];
  reversible: boolean;
  requiresElevation: boolean;
  createdAt: string;
}

export interface OperationJournal {
  journalId: string;
  planId?: string;
  capability: string;
  startedAt: string;
  finishedAt?: string;
  status: NativeStatus;
  items: Array<Record<string, unknown>>;
  warnings: string[];
  errors: string[];
}

export interface Recoverability {
  recoverable: boolean;
  method?: 'undo' | 'restore-point' | 'recycle-bin' | 'manual' | 'none';
  notes?: string;
}

export interface BridgeStatusData {
  bridge: 'ready';
  platform: string;
  appVersion: string;
  packaged: boolean;
  providerMode: ProviderMode;
  fixtureEnabled: boolean;
  capabilities: ProviderCapability[];
  contractVersion: number;
  electronVersion?: string;
}

export interface SystemVolume {
  deviceId: string | null;
  label: string | null;
  fileSystem: string | null;
  sizeBytes: number | null;
  freeBytes: number | null;
}

export interface SystemSummaryData {
  platform: string;
  osCaption: string | null;
  osVersion: string | null;
  osBuild: string | null;
  osArchitecture: string | null;
  uptimeSeconds: number | null;
  uptimeSource: string;
  cpuModel: string | null;
  cpuCores: number | null;
  cpuLogicalProcessors: number | null;
  cpuLoadPercent: number | null;
  cpuLoadSource: string;
  memoryTotalBytes: number | null;
  memoryFreeBytes: number | null;
  memoryUsedPercent: number | null;
  systemDrive: string | null;
  systemDriveFreeBytes: number | null;
  systemDriveTotalBytes: number | null;
  volumes: SystemVolume[];
  degraded: boolean;
  degradationReason?: string;
}

export interface ServicesSummaryData {
  total: number;
  running: number;
  stopped: number;
  automatic: number;
  manual: number;
  disabled: number;
  protectedCount: number;
  provider: string;
}

export interface FolderChoiceData {
  canceled: boolean;
  path: string | null;
}

export interface StudioCategoryCount {
  key: string;
  count: number;
  bytes: number;
}

export interface StudioSource {
  id: string;
  path: string;
  label: string;
  addedAt: string;
  status: 'ready' | 'needs_scan' | 'scanning' | 'offline' | 'partial' | 'error';
  fileCount: number;
  folderCount: number;
  fileTypesCount: number;
  totalBytes: number;
  categories: StudioCategoryCount[];
  lastScanned: string | null;
  partial: boolean;
  warnings: string[];
}

export interface StudioQueryFile {
  id: number;
  name: string;
  relative: string;
  category: string;
  uiCategory: string;
  size: number;
  ext: string;
  modifiedAt: string;
  hasThumbnail: boolean;
}

export interface StudioQueryResult {
  sourceId: string;
  total: number;
  bytes: number;
  offset: number;
  limit: number;
  rows: StudioQueryFile[];
  partial: boolean;
  warnings: string[];
}

export interface StudioPlanFile {
  index: number;
  fileId: number;
  name: string;
  sourceRelative: string;
  sourceRoot: string;
  category: string;
  size: number;
  targetName: string;
  targetPath: string | null;
  targetRelative: string | null;
  status: string;
}

export interface StudioPlanPreview {
  planHash: string;
  operation: string;
  structure: string;
  collisionPolicy: string;
  destinationSummary: string | null;
  files: StudioPlanFile[];
  truncated: boolean;
  categories: Array<{ category: string; files: number; bytes: number; folderName?: string; targetPath?: string | null }>;
  collisions: Array<Record<string, unknown>>;
  skipped: Array<Record<string, unknown>>;
  warnings: string[];
  totals: { files: number; bytes: number; categories: number; folderSteps: number; skipped: number; collisions: number };
  createdAt: string;
  expiresAt: string;
  previewOnly: true;
  execution: 'blocked_explicit_approval_required';
}

export interface StudioPreviewHistoryEntry {
  id: string;
  planHash: string;
  createdAt: string;
  operation: string;
  files: number;
  bytes: number;
  categories: number;
  sourceRoots: string[];
  destinationSummary: string | null;
  collisions: number;
  skipped: number;
  warnings: string[];
  previewOnly: true;
}

export interface StudioProgressEvent {
  type: 'scan-progress' | 'scan-complete' | 'scan-cancelled' | 'scan-failed';
  sourceId: string;
  at: string;
  files?: number;
  bytes?: number;
  folders?: number;
  message?: string;
}

export interface StudioShellApi {
  contractVersion: number;
  listSources: () => Promise<NativeEnvelope<StudioSource[]>>;
  chooseSource: () => Promise<NativeEnvelope<StudioSource | null>>;
  removeSource: (sourceId: string) => Promise<NativeEnvelope<{ removed: boolean }>>;
  scanSource: (sourceId: string) => Promise<NativeEnvelope<StudioSource>>;
  cancelScan: (sourceId: string) => Promise<NativeEnvelope<{ cancelled: boolean }>>;
  query: (request: {
    sourceId: string;
    category?: string;
    categories?: string[];
    search?: string;
    sort?: 'name' | 'size' | 'modified' | 'type';
    desc?: boolean;
    offset?: number;
    limit?: number;
  }) => Promise<NativeEnvelope<StudioQueryResult>>;
  thumbnails: (sourceId: string, fileIds: number[]) => Promise<NativeEnvelope<Record<string, { thumbnail: string | null; reason?: string }>>>;
  chooseDestination: () => Promise<NativeEnvelope<{ id: string; path: string } | null>>;
  previewPlan: (request: {
    sourceId: string;
    fileIds?: number[];
    category?: string;
    categories?: string[];
    all?: boolean;
    operation: 'copy' | 'move' | 'virtual';
    structure?: 'categorized' | 'flat';
    categoryFolderNames?: Record<string, string>;
    collisionPolicy?: 'skip' | 'rename' | 'review';
    destinationId?: string;
    relativePath?: string;
  }) => Promise<NativeEnvelope<StudioPlanPreview>>;
  previewHistory: () => Promise<NativeEnvelope<StudioPreviewHistoryEntry[]>>;
  onEvent: (callback: (event: StudioProgressEvent) => void) => () => void;
}

export interface NativeShellApi {
  contractVersion: number;
  getStatus: () => Promise<NativeEnvelope<BridgeStatusData>>;
  getSystemSummary: () => Promise<NativeEnvelope<SystemSummaryData>>;
  getServicesSummary: () => Promise<NativeEnvelope<ServicesSummaryData>>;
  chooseFolder: () => Promise<NativeEnvelope<FolderChoiceData>>;
  windowControl: (action: (typeof WINDOW_ACTIONS)[number]) => Promise<NativeEnvelope<{ action: string }>>;
}

export interface FilesItem {
  id: number;
  name: string;
  relative: string;
  parentFolder: string;
  category: string;
  size: number;
  ext: string;
  modifiedAt: string;
  modifiedMs: number;
  readonly: boolean;
  hidden: boolean;
}

export interface FilesOverview {
  source: StudioSource;
  totals: {
    files: number;
    bytes: number;
    folders: number;
    categories: number;
    partial: boolean;
  };
  categories: Array<{ key: string; count: number; bytes: number }>;
  extensions: Array<{ ext: string; count: number; bytes: number }>;
  ages: Array<{ key: string; label: string; count: number; bytes: number }>;
  recent: FilesItem[];
  largest: FilesItem[];
  scannedAt: string | null;
  warnings: string[];
  coverage: 'complete' | 'partial';
  permission: 'read-only';
}

export interface FilesQueryRequest {
  sourceId: string;
  category?: string;
  categories?: string[];
  search?: string;
  extension?: string;
  minBytes?: number;
  maxBytes?: number;
  modifiedAfterMs?: number;
  modifiedBeforeMs?: number;
  sort?: 'name' | 'size' | 'modified' | 'type';
  desc?: boolean;
  offset?: number;
  limit?: number;
}

export interface FilesMetadata {
  sourceId: string;
  sourceLabel: string;
  fileId: number;
  name: string;
  relative: string;
  parentFolder: string;
  fullPath: string;
  size: number;
  ext: string;
  category: string;
  modifiedAt: string;
  createdAt: string | null;
  entryKind: string;
  linkCount: number | null;
  hardlinked: boolean;
  fileIdentity: string | null;
  volumeSerial: string | null;
  readonly: boolean;
  hidden: boolean;
  attributesAvailable: boolean;
  attributes: number | null;
  zone: {
    zoneId: number | null;
    zoneAvailable: boolean;
    referrer: string | null;
    host: string | null;
  };
  reparse: unknown;
  permission: 'read-only';
  warnings: string[];
}

export interface FilesHashResult {
  sourceId: string;
  fileId: number;
  name: string;
  algorithm: 'sha256' | 'sha512';
  digest: string;
  bytesRead: number;
  sizeAtRead: number;
  fileIdentity: string | null;
  changedDuringRead: boolean;
  digestReliable: boolean;
  warnings: string[];
  permission: 'read-only';
}

export interface FilesEmptyFoldersResult {
  items: Array<{ relative: string; fullPath: string }>;
  summary: {
    root: string;
    foldersScanned: number;
    emptyFolders: number;
    skippedLinks: number;
    errors: number;
    limit: number;
    elapsedMs: number;
  };
  partial: boolean;
  warnings: string[];
  permission: 'read-only';
  mutation: 'none';
}

export interface FilesShellApi {
  contractVersion: number;
  listSources: () => Promise<NativeEnvelope<StudioSource[]>>;
  chooseSource: () => Promise<NativeEnvelope<StudioSource | null>>;
  scanSource: (sourceId: string) => Promise<NativeEnvelope<StudioSource>>;
  cancelScan: (sourceId: string) => Promise<NativeEnvelope<{ cancelled: boolean }>>;
  query: (request: FilesQueryRequest) => Promise<NativeEnvelope<StudioQueryResult & { unsupported?: string }>>;
  thumbnails: (sourceId: string, fileIds: number[]) => Promise<NativeEnvelope<Record<string, { thumbnail: string | null; reason?: string }>>>;
  overview: (sourceId: string) => Promise<NativeEnvelope<FilesOverview>>;
  metadata: (sourceId: string, fileId: number) => Promise<NativeEnvelope<FilesMetadata>>;
  hash: (sourceId: string, fileId: number, algorithm?: 'sha256' | 'sha512') => Promise<NativeEnvelope<FilesHashResult>>;
  emptyFolders: (sourceId: string, limit?: number) => Promise<NativeEnvelope<FilesEmptyFoldersResult>>;
  open: (sourceId: string, fileId: number) => Promise<NativeEnvelope<{ opened: boolean; fileId: number; requestedPath: string }>>;
  reveal: (sourceId: string, fileId: number) => Promise<NativeEnvelope<{ requested: boolean; fileId: number; requestedPath: string }>>;
}

export interface StorageVolume {
  id: string;
  deviceId: string | null;
  letter: string;
  label: string;
  fileSystem: string;
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  usedPercent: number;
  freePercent: number;
  isLowSpace: boolean;
  physicalDevice: string | null;
  physicalDeviceAvailable: false;
  smartAvailable: false;
  readOnly: true;
}

export interface StorageCapacityPoint {
  capturedAt: string;
  source: string;
  volumes: Array<{ deviceId: string | null; totalBytes: number; freeBytes: number }>;
}

export interface StorageVolumesResult {
  volumes: StorageVolume[];
  history: StorageCapacityPoint[];
  observedAt: string;
  provider: string;
  status: string;
  coverage: string;
  warnings: string[];
  hardwareIdentityAvailable: false;
  smartAvailable: false;
}

export interface StorageHistoryResult {
  points: StorageCapacityPoint[];
  retention: number;
  note: string;
}

export interface StorageTreeNode {
  id: string;
  relative: string;
  name: string;
  sizeBytes: number;
  files: number;
  children: StorageTreeNode[];
}

export interface StorageFolderRecord {
  id: string;
  name: string;
  relative: string;
  sizeBytes: number;
  files: number;
  children: Array<{ id: string; name: string; relative: string; sizeBytes: number; files: number }>;
}

export interface StorageDuplicateCandidate {
  sizeBytes: number;
  count: number;
  wastedBytes: number;
  files: Array<{ id: number; name: string; relative: string; size: number; modifiedAt: string }>;
  truncatedFiles: number;
}

export interface StorageDuplicateGroup {
  size: number;
  digest: string;
  files: Array<{ id: number; name: string; relative: string; size: number; modifiedAt: string }>;
  count: number;
  wastedBytes: number;
}

export interface StorageDuplicateResult {
  groups: StorageDuplicateGroup[];
  summary: {
    candidates: number;
    filesHashed: number;
    bytesHashed: number;
    verifiedGroups: number;
    reclaimableVerifiedBytes: number;
    budgetReached: boolean;
    maxFiles: number;
    maxBytes: number;
  };
  errors: Array<{ fileId: number; name: string; code: string; message: string }>;
  warnings: string[];
  permission: 'read-only';
  mutation: 'none';
}

export interface StorageAnalysis {
  sourceId: string;
  source: StudioSource;
  totals: { files: number; bytes: number; folders: number; categories: number; partial: boolean; analyzedBytes: number };
  coverage: {
    files: number;
    folders: number;
    partial: boolean;
    warnings: string[];
    lastScanned: string | null;
    scope: string;
    scopeKind: 'authorized-folder';
    coversWholeVolume: false;
  };
  tree: StorageTreeNode;
  folders: StorageFolderRecord[];
  largest: FilesItem[];
  recent: FilesItem[];
  categories: Array<{ key: string; count: number; bytes: number }>;
  extensions: Array<{ ext: string; count: number; bytes: number }>;
  ages: Array<{ key: string; label: string; count: number; bytes: number }>;
  duplicateCandidates: StorageDuplicateCandidate[];
  duplicatePolicy: {
    candidatesAreSizeMatches: boolean;
    contentVerified: boolean;
    minimumBytes: number;
    maxGroups: number;
    maxVerifiedFiles: number;
    maxVerifiedBytes: number;
  };
  permission: 'read-only';
}

export interface StorageShellApi {
  contractVersion: number;
  volumes: () => Promise<NativeEnvelope<StorageVolumesResult>>;
  history: () => Promise<NativeEnvelope<StorageHistoryResult>>;
  analysis: (sourceId: string) => Promise<NativeEnvelope<StorageAnalysis>>;
  verifyDuplicates: (sourceId: string) => Promise<NativeEnvelope<StorageDuplicateResult>>;
}

/* ------------------------------------------------------------------------- */
/* Smart Scan v1 — read-only coordinator over the measured providers.        */
/* ------------------------------------------------------------------------- */

export type ScanStageStatus =
  | 'pending'
  | 'running'
  | 'complete'
  | 'partial'
  | 'failed'
  | 'skipped'
  | 'unsupported'
  | 'cancelled';

export type ScanSessionStatus = 'running' | 'complete' | 'partial' | 'cancelled' | 'failed';
export type ScanSeverity = 'high' | 'medium' | 'low' | 'info';
export type ScanRisk = 'review' | 'attention' | 'info';

export interface ScanFindingProvenance {
  provider: string;
  mode: 'measured';
  scope: string;
}

export interface ScanFinding {
  stableId: string;
  kind:
    | 'large-file'
    | 'duplicate-verified'
    | 'duplicate-candidate'
    | 'low-space'
    | 'startup-item'
    | 'privacy-origin'
    | 'empty-folder'
    | 'memory-pressure'
    | 'cpu-load'
    | string;
  serviceId: string;
  titleEn: string;
  titleAr: string;
  evidence: string;
  bytes: number;
  itemCount: number;
  severity: ScanSeverity;
  risk: ScanRisk;
  scope: string;
  provenance: ScanFindingProvenance;
  pathPreview: string[];
}

export interface ScanRecommendation {
  id: string;
  titleEn: string;
  titleAr: string;
  detailEn: string;
  detailAr: string;
  evidence: string;
  serviceId: string;
  confidence: 'measured' | 'derived';
  risk: ScanRisk;
  target: string;
}

export interface ScanStage {
  id: string;
  labelEn: string;
  labelAr: string;
  provider: string;
  weight: number;
  status: ScanStageStatus;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  detail: string | null;
  error: NativeError | null;
}

export interface ScanBreakdownGroup {
  id: string;
  labelEn: string;
  labelAr: string;
  colorHex: string;
  count: number;
  bytes: number;
  percentage: number;
}

export interface ScanKpi {
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

export interface ScanSystemSnapshot {
  platform?: string;
  osCaption?: string | null;
  osVersion?: string | null;
  osBuild?: string | null;
  uptimeSeconds?: number | null;
  uptimeSource?: string;
  cpuModel?: string | null;
  cpuCores?: number | null;
  cpuLogicalProcessors?: number | null;
  cpuLoadPercent?: number | null;
  cpuLoadSource?: string;
  memoryTotalBytes?: number | null;
  memoryFreeBytes?: number | null;
  memoryUsedPercent?: number | null;
  systemDrive?: string | null;
  systemDriveFreeBytes?: number | null;
  systemDriveTotalBytes?: number | null;
  degraded?: boolean;
  degradationReason?: string | null;
  basis?: string[];
}

export interface ScanStartupItem {
  name: string;
  source: string;
  location: string;
  writable: boolean;
  managedBySmartOrganizer: boolean;
  provider: string;
}

export interface ScanPrivacySample {
  fileId: number;
  relative: string;
  name: string;
  zoneId: number | null;
  zoneAvailable: boolean;
  host: string | null;
  referrer: string | null;
}

export interface ScanServiceData {
  scope?: string;
  sourceLabel?: string | null;
  stageCount?: number;
  readOnly?: true;
  totals?: {
    files: number;
    bytes: number;
    folders: number;
    categories: number;
    partial: boolean;
    analyzedBytes?: number;
  } | null;
  coverage?: StorageAnalysis['coverage'] | null;
  volumes?: StorageVolume[];
  system?: ScanSystemSnapshot | null;
  services?: ServicesSummaryData | null;
  findings?: number;
  duplicateSummary?: StorageDuplicateResult['summary'] | null;
  startupCount?: number | null;
  appCount?: number | null;
  privacySample?: { sampled: number; withZone: number } | null;
  emptyFolders?: {
    items: Array<{ relative: string }>;
    summary: FilesEmptyFoldersResult['summary'];
    partial: boolean;
    mutation?: 'none';
  } | null;
  options?: { verifyDuplicates: boolean; includeSlowProviders: boolean };
  candidates?: StorageDuplicateCandidate[];
  candidatePolicy?: StorageAnalysis['duplicatePolicy'] | null;
  verified?: {
    groups: StorageDuplicateGroup[];
    summary: StorageDuplicateResult['summary'];
    errors: StorageDuplicateResult['errors'];
  } | null;
  minimumBytes?: number | null;
  thresholdBytes?: number;
  files?: FilesItem[];
  totalBytes?: number;
  count?: number;
  cleanupAvailable?: boolean;
  gatedMission?: string;
  unsupported?: string[];
  sample?: {
    sampled: number;
    withZone: number;
    hosts: string[];
    samples: ScanPrivacySample[];
    errors: number;
    sampleLimit: number;
    browserHistoryRead: false;
    cookiesRead: false;
    clipboardRead: false;
  } | null;
  browserHistoryRead?: false;
  cookiesRead?: false;
  clipboardRead?: false;
  items?: ScanStartupItem[];
  bySource?: Record<string, number>;
  writableCount?: number | null;
  bootTimeMeasured?: false;
  mutationAvailable?: false;
  total?: number | null;
  publishers?: Array<{ publisher: string; count: number }>;
  apps?: Array<{ name: string; version: string | null; publisher: string | null }>;
  unusedClassification?: false;
  uninstallAvailable?: false;
  healthScore?: number | null;
  basis?: string[];
  recommendations?: ScanRecommendation[];
  aiProviderUsed?: false;
  method?: string;
}

export interface ScanServiceResult {
  serviceId: string;
  labelEn: string;
  labelAr: string;
  state: 'available' | 'partial' | 'gated';
  status: ScanSessionStatus | 'unsupported';
  permission: 'read-only';
  mutation: 'none';
  source: string;
  startedAt: string;
  finishedAt: string | null;
  stages: Array<{ id: string; labelEn: string; labelAr: string; status: ScanStageStatus }>;
  data: ScanServiceData;
  warnings: string[];
  limitations: string[];
}

export interface ScanSummary {
  id: string;
  mode: 'quick' | 'deep' | 'service' | 'custom';
  status: ScanSessionStatus;
  sourceId: string | null;
  sourceLabel: string | null;
  scope: 'authorized-folder' | 'system-providers-only';
  startedAt: string;
  finishedAt: string | null;
  progressPercent: number;
  progressDeterminate: boolean;
  stagesTotal: number;
  stagesCompleted: number;
  stagesFailed: number;
  findingsCount: number;
  highSeverityCount: number;
  filesIndexed: number | null;
  bytesIndexed: number | null;
  verifiedReclaimableBytes: number;
  verifiedDuplicateGroups: number;
  privacySignalCount: number | null;
  healthScore: number | null;
  healthBasis: string[];
  warnings: string[];
  limitations: string[];
  requestedServices: string[];
}

export interface ScanSession {
  id: string;
  mode: 'quick' | 'deep' | 'service' | 'custom';
  requestedServices: string[];
  sourceId: string | null;
  sourceLabel: string | null;
  scope: 'authorized-folder' | 'system-providers-only';
  status: ScanSessionStatus;
  startedAt: string;
  finishedAt: string | null;
  cancelRequested: boolean;
  progressPercent: number;
  progressDeterminate: boolean;
  stages: ScanStage[];
  services: ScanServiceResult[];
  findings: ScanFinding[];
  recommendations: ScanRecommendation[];
  breakdown: ScanBreakdownGroup[];
  kpis: ScanKpi[];
  summary: ScanSummary;
  warnings: string[];
  limitations: string[];
  error: NativeError | null;
}

export interface ScanCapabilityStage {
  id: string;
  labelEn: string;
  labelAr: string;
  provider: string;
  requiresSource: boolean;
}

export interface ScanCapabilityService {
  id: string;
  labelEn: string;
  labelAr: string;
  state: 'available' | 'partial' | 'gated';
  requiresSource: boolean;
  stages: string[];
  noteEn: string;
  noteAr: string;
}

export interface ScanGatedOperation {
  id: string;
  mission: string;
  title: string;
  reason: string;
}

export interface ScanCapabilities {
  engine: string;
  contract: 'scan.v1';
  readOnly: true;
  mutation: 'none';
  wholeVolumeAnalysis: false;
  fixtureFallback: false;
  sourceScope: 'authorized-folder';
  stages: ScanCapabilityStage[];
  services: ScanCapabilityService[];
  gatedOperations: ScanGatedOperation[];
}

export interface ScanStartRequest {
  mode: 'quick' | 'deep' | 'service' | 'custom';
  services?: string[];
  sourceId?: string | null;
  options?: {
    verifyDuplicates?: boolean;
    includeSlowProviders?: boolean;
  };
}

export interface ScanStarted {
  sessionId: string;
  status: ScanSessionStatus;
  mode: ScanSession['mode'];
  stages: ScanStage[];
  startedAt: string;
  sourceLabel: string | null;
  scope: ScanSession['scope'];
}

export interface ScanCancelResult {
  cancelled: boolean;
  sessionId: string;
  note: string;
}

export interface ScanIndexResult {
  id: string;
  label: string;
  fileCount: number;
  folderCount: number;
  totalBytes: number;
  status: StudioSource['status'];
  partial: boolean;
}

export interface ScanProgressEvent {
  type:
    | 'scan-started'
    | 'scan-stage'
    | 'scan-complete'
    | 'scan-cancelled'
    | 'scan-failed'
    | 'scan-cancelled-requested';
  sessionId: string;
  at: string;
  stage?: ScanStage;
  progressPercent?: number;
  summary?: ScanSummary;
  error?: NativeError;
  mode?: ScanSession['mode'];
  services?: string[];
  stageCount?: number;
}

export interface ScanShellApi {
  contractVersion: number;
  capabilities: () => Promise<NativeEnvelope<ScanCapabilities>>;
  listSources: () => Promise<NativeEnvelope<StudioSource[]>>;
  chooseSource: () => Promise<NativeEnvelope<StudioSource | null>>;
  indexSource: (sourceId: string) => Promise<NativeEnvelope<StudioSource>>;
  start: (request: ScanStartRequest) => Promise<NativeEnvelope<ScanStarted>>;
  cancel: (sessionId: string) => Promise<NativeEnvelope<ScanCancelResult>>;
  status: (sessionId: string) => Promise<NativeEnvelope<ScanSession>>;
  history: () => Promise<NativeEnvelope<ScanSummary[]>>;
  onEvent: (callback: (event: ScanProgressEvent) => void) => () => void;
}

/* ------------------------------------------------------------------------- *
 * Applications / Software Command Center v1 (Mission 05)
 *
 * The bridge reads one measured software inventory (uninstall registry across
 * the three hives/views plus Appx/MSIX) and derives all twelve services from
 * that evidence. Signature, size, association, leftover, package and WinGet
 * reads are explicit, bounded, read-only operations. There is no uninstall,
 * install, update or settings-write channel: every mutation surfaces a gate.
 * ------------------------------------------------------------------------- */

export type AppSourceKind = 'uninstall-registry' | 'appx-msix';
export type AppScopeKind = 'per-user' | 'per-machine' | 'packaged';
export type AppSignatureState = 'unchecked' | 'valid' | 'invalid' | 'unsigned' | 'unknown' | 'unavailable';
export type AppRemovalMethod = 'msi' | 'uninstall-string' | 'appx-package' | null;

export interface AppStartupEvidence {
  linked: boolean;
  entryCount: number;
  sources: string[];
}

export interface AppSizeEvidence {
  reportedBytes: number | null;
  measuredBytes: number | null;
  measuredAt: string | null;
  source: 'reported' | 'measured' | 'unknown';
  partial: boolean | null;
  filesMeasured: number | null;
}

export interface AppSignatureSummary {
  status: AppSignatureState;
  signer: string | null;
  thumbprint: string | null;
  checkedAt: string | null;
}

export interface AppRecord {
  id: string;
  name: string;
  publisher: string | null;
  version: string | null;
  scope: AppScopeKind;
  architecture: string | null;
  source: AppSourceKind;
  registryRoot: string | null;
  registryView: '32-bit' | '64-bit' | null;
  productCode: string | null;
  installDate: string | null;
  installLocation: string | null;
  installLocationExists: boolean | null;
  installSource: string | null;
  uninstallMethod: AppRemovalMethod;
  uninstallCommandExposed: false;
  displayIcon: string | null;
  estimatedSizeBytes: number | null;
  isFramework: boolean;
  isSystemComponent: boolean;
  nonRemovable: boolean;
  protected: boolean;
  startup: AppStartupEvidence;
  size: AppSizeEvidence;
  signature: AppSignatureSummary;
  lastSeen: string;
  evidence: {
    registryKeyRedacted: string | null;
    packageFullName: string | null;
    provider: string;
  };
}

export interface AppCoverage {
  registryItems: number;
  appxItems: number;
  returned: number;
  sourceFailures: number | null;
  entryFailures: number | null;
  startupEntries: number;
  existenceChecked: number;
  existenceMissing: number;
  truncated: boolean;
}

export interface AppKpis {
  installed: number;
  publishers: number;
  packaged: number;
  protectedCount: number;
  startupLinked: number;
  startupEntries: number;
  staleRegistrations: number;
  reportedFootprintBytes: number | null;
  measuredFootprintBytes: number | null;
  measuredFootprintApps: number;
  updatesAvailable: number | null;
}

export interface AppStartupEntry {
  id: string;
  name: string;
  source: string;
  location: string | null;
  executable: string | null;
  linkedAppId: string | null;
  linkedAppName: string | null;
  writable: boolean;
  bootSeconds: null;
  commandExposed: false;
}

export interface AppsInventory {
  contract: 'apps.v1';
  readOnly: true;
  mutation: 'none';
  observedAt: string;
  durationMs: number;
  apps: AppRecord[];
  kpis: AppKpis;
  coverage: AppCoverage;
  startup: AppStartupEntry[];
  warnings: string[];
}

export interface AppCapabilityService {
  id: string;
  labelEn: string;
  labelAr: string;
  state: 'available' | 'partial' | 'gated';
  provider: string;
  noteEn: string;
  noteAr: string;
}

export interface AppGatedOperation {
  id: string;
  mission: string;
  title: string;
  reason: string;
}

export interface AppsCapabilities {
  engine: string;
  contract: 'apps.v1';
  readOnly: true;
  mutation: 'none';
  fixtureFallback: false;
  services: AppCapabilityService[];
  gatedOperations: AppGatedOperation[];
  nativeOnly: string[];
}

export interface AppSignatureChainElement {
  subject: string;
  issuer: string;
  thumbprint: string;
  notBefore: string | null;
  notAfter: string | null;
}

export interface AppSignatureResult {
  appId: string;
  executable: string | null;
  status: AppSignatureState;
  message: string | null;
  signer: string | null;
  issuer: string | null;
  thumbprint: string | null;
  notBefore: string | null;
  notAfter: string | null;
  chain: AppSignatureChainElement[];
  checkedAt: string;
  provider: string;
  note: string;
}

export interface AppAssociationEntry {
  key: string;
  kind: 'extension' | 'protocol';
  progId: string | null;
  handlerName: string | null;
  userChoice: string | null;
  commandExe: string | null;
  conflict: boolean;
}

export interface AppAssociations {
  observedAt: string;
  extensions: AppAssociationEntry[];
  protocols: AppAssociationEntry[];
  sources: string[];
  truncated: boolean;
  warnings: string[];
}

export interface AppFolderContribution {
  name: string;
  bytes: number;
}

export interface AppSizeResult {
  appId: string;
  measuredBytes: number | null;
  reportedBytes: number | null;
  files: number;
  folders: number;
  partial: boolean;
  reason: string | null;
  topFolders: AppFolderContribution[];
  appData: { path: string; bytes: number; confidence: 'name-match' } | null;
  durationMs: number;
}

export interface AppSizesResult {
  observedAt: string;
  results: AppSizeResult[];
  requested: number;
  measured: number;
  truncated: boolean;
  warnings: string[];
}

export interface AppLeftoverCandidate {
  id: string;
  kind: 'stale-registration' | 'appdata-folder';
  label: string;
  path: string;
  confidence: 'low' | 'medium';
  reason: string;
  appId: string | null;
  sizeBytes: null;
}

export interface AppLeftoversResult {
  observedAt: string;
  candidates: AppLeftoverCandidate[];
  scannedRoots: Array<{ root: string; entries: number; truncated: boolean }>;
  staleCount: number;
  candidateCount: number;
  truncated: boolean;
  mutation: 'none';
  warnings: string[];
}

export interface AppUpdateItem {
  name: string;
  id: string;
  current: string | null;
  available: string | null;
  source: string | null;
}

export interface AppUpdatesResult {
  observedAt: string;
  adapter: 'winget';
  installed: boolean;
  version: string | null;
  status: 'not-checked' | 'available' | 'unavailable' | 'failed' | 'unsupported';
  items: AppUpdateItem[];
  note: string;
  rawLines: number | null;
}

export interface AppPlanItem {
  appId: string;
  name: string;
  publisher: string | null;
  method: AppRemovalMethod;
  risk: 'blocked' | 'high' | 'review';
  reasons: string[];
  reclaimBytes: number | null;
  reclaimSource: 'measured' | 'reported' | 'unknown';
  reversible: false;
}

export interface AppPlan {
  planId: string;
  contract: 'apps.v1';
  createdAt: string;
  mode: 'uninstall';
  items: AppPlanItem[];
  totals: {
    count: number;
    blocked: number;
    reclaimBytes: number | null;
    reclaimSource: 'measured' | 'reported' | 'mixed' | 'unknown';
  };
  restorePoint: { status: 'not-checked'; reason: string };
  execution: { available: false; gate: string; reason: string };
  immutable: true;
  mutation: 'none';
}

export interface AppPackageEntry {
  name: string;
  id: string;
  version: string | null;
  source: string | null;
}

export interface AppPackagesResult {
  observedAt: string;
  tab: 'installed' | 'discover';
  adapter: 'winget';
  installed: boolean;
  version: string | null;
  status: 'complete' | 'unavailable' | 'blocked' | 'failed' | 'unsupported';
  packages: AppPackageEntry[];
  note: string;
  rawLines: number | null;
}

export type CleanupSafety = 'eligible' | 'review' | 'blocked';
export type CleanupCategory = 'temp' | 'browser' | 'logs' | 'recycle' | 'update' | 'unused';
export type CleanupRisk = 'low' | 'medium' | 'high' | 'blocked';

export interface CleanupCandidate {
  id: string;
  name: string;
  path: string | null;
  category: CleanupCategory;
  source: string;
  safety: CleanupSafety;
  risk: CleanupRisk;
  sizeBytes: number | null;
  fileCount: number | null;
  folderCount: number | null;
  modifiedAt: string | null;
  ageDays: number | null;
  reasons: string[];
  action: string;
  permission: string;
  recoverable: string;
  provider: string;
  active: boolean;
  virtual: boolean;
  evidence: string[];
}

export interface CleanupSummary {
  candidates: number;
  eligibleBytes: number;
  reviewBytes: number;
  blockedBytes: number;
  eligibleCount: number;
  reviewCount: number;
  blockedCount: number;
  categories: Record<string, {
    count: number;
    bytes: number;
    eligibleBytes?: number;
    reviewBytes?: number;
    blockedBytes?: number;
  }>;
}

export interface CleanupCoverage {
  rootsScanned: number;
  rootsUnavailable: number;
  filesMeasured: number;
  foldersMeasured: number;
  bytesMeasured: number;
  truncated: boolean;
  skippedLinks: number;
  errors: number;
}

export interface CleanupStage {
  key: CleanupCategory;
  status: 'pending' | 'running' | 'complete' | 'failed' | 'cancelled';
  candidates: number;
  warnings: string[];
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

export interface CleanupSession {
  id: string;
  status: 'running' | 'complete' | 'cancelled' | 'failed';
  mode: string;
  requestedCategories: CleanupCategory[];
  ageDays: number;
  startedAt: string;
  finishedAt: string | null;
  progressPercent: number;
  cancelRequested: boolean;
  categories: CleanupStage[];
  warnings: string[];
  coverage: CleanupCoverage;
  candidates?: CleanupCandidate[];
  candidateCount: number;
  estimatedEligibleBytes: number;
  estimatedReviewBytes: number;
  estimatedBlockedBytes: number;
  error: string | null;
}

export interface CleanupRecycleItem {
  id: string;
  name: string;
  originalPath: string | null;
  volume: string;
  sizeBytes: number;
  deletedAt: string | null;
  ageDays: number | null;
}

export interface CleanupInventory {
  observedAt: string | null;
  status: 'complete' | 'unscanned';
  readOnly: true;
  mutation: 'none';
  candidates: CleanupCandidate[];
  summary: CleanupSummary | null;
  coverage: CleanupCoverage | null;
  recycleItems: CleanupRecycleItem[];
  warnings: string[];
}

export interface CleanupEstimate {
  observedAt: string | null;
  status: 'complete' | 'unscanned';
  readOnly: true;
  mutation: 'none';
  summary: CleanupSummary;
  categories: Array<{ key: CleanupCategory; count: number; bytes: number; eligibleBytes: number; reviewBytes: number; blockedBytes: number }>;
  note: string;
}

export interface CleanupVaultItem {
  id: string;
  name: string;
  kind: 'file' | 'folder';
  sizeBytes: number | null;
  quarantinedAt: string;
  originalPath: string | null;
  journalId: string | null;
}

export interface CleanupJournalEntry {
  id: string;
  createdAt: string | null;
  operation: string;
  status: string;
  itemCount: number | null;
  bytes: number | null;
  vaultPath: string | null;
  verified: boolean;
  recovery: string;
}

export interface CleanupQuarantine {
  observedAt: string;
  readOnly: true;
  mutation: 'none';
  vault: {
    vaultPath: string | null;
    exists: boolean;
    retentionDays: number;
    items: CleanupVaultItem[];
    totalBytes: number;
    warnings: string[];
    readOnly: true;
    mutation: 'none';
  };
  journal: {
    entries: CleanupJournalEntry[];
    path: string | null;
    exists: boolean;
    readOnly: true;
    mutation: 'none';
    warnings: string[];
  };
  execution: { available: false; gate: string; reason: string };
}

export interface CleanupUnusedResult {
  observedAt: string;
  readOnly: true;
  mutation: 'none';
  ageDays: number;
  source: { id: string; label: string; path: string | null; fileCount: number } | null;
  status: 'complete' | 'unavailable' | 'needs-source' | 'index-required';
  items: Array<{
    id: string;
    name: string;
    relative: string;
    path: string | null;
    sizeBytes: number | null;
    modifiedAt: string | null;
    ageDays: number | null;
    safety: CleanupSafety;
  }>;
  warnings: string[];
  atimeNote: string;
}

export interface CleanupPlanItem {
  candidateId: string;
  name: string;
  category: CleanupCategory;
  path: string | null;
  safety: CleanupSafety;
  sizeBytes: number | null;
  reclaimBytes: number;
  risk: 'low' | 'review' | 'blocked';
  reasons: string[];
  reversible: boolean | string;
}

export interface CleanupPlan {
  contract: 'cleanup.v1';
  planId: string;
  createdAt: string;
  observedAt: string | null;
  mode: 'quarantine' | 'recycle' | 'restore' | 'purge' | 'archive';
  items: CleanupPlanItem[];
  totals: { count: number; blocked: number; eligibleBytes: number; reviewBytes: number; reclaimSource: 'measured' | 'unknown' };
  execution: { available: false; gate: string; reason: string };
  rollback: { available: false; reason: string };
  immutable: true;
  mutation: 'none';
  fingerprint: string;
}

export interface CleanupScheduleDraft {
  draft: { frequency: 'daily' | 'weekly'; time: string; weekdays: number[]; categories: CleanupCategory[]; scanOnly: true };
  occurrences: string[];
  quietHours: { from: string; to: string; respected: boolean };
  execution: { available: false; gate: string; reason: string };
  readOnly: true;
  mutation: 'none';
}

export interface CleanupReport {
  contract: 'cleanup.v1';
  generatedAt: string;
  readOnly: true;
  mutation: 'none';
  session: { id: string; observedAt: string; categories: CleanupCategory[]; coverage: CleanupCoverage } | null;
  summary: CleanupSummary;
  recycle: { items: number; bytes: number };
  vault: { entries: number; bytes: number; exists: boolean };
  journal: { entries: number; exists: boolean };
  warnings: string[];
  note: string;
}

export interface CleanupCapabilityService {
  id: string;
  labelEn: string;
  labelAr: string;
  state: 'available' | 'partial' | 'gated';
  provider: string;
  noteEn: string;
  noteAr: string;
}

export interface CleanupCapabilities {
  engine: string;
  contract: 'cleanup.v1';
  readOnly: true;
  mutation: 'none';
  fixtureFallback: false;
  serviceCount: number;
  services: CleanupCapabilityService[];
  gatedOperations: Array<{ id: string; mission: string; title: string; reason: string }>;
  categories: Array<{ key: CleanupCategory }>;
  safety: { eligible: string; review: string; blocked: string };
  exclusions: string[];
  limits: {
    tempFiles: number;
    recycleItems: number;
    unusedItems: number;
    planItems: number;
    measureBudgetMs: number;
    treeEntries: number;
  };
  nativeOnly: string[];
}

export interface CleanupShellApi {
  contractVersion: number;
  capabilities: () => Promise<NativeEnvelope<CleanupCapabilities>>;
  start: (request: { categories: CleanupCategory[]; ageDays: number }) => Promise<NativeEnvelope<CleanupSession>>;
  status: (sessionId: string) => Promise<NativeEnvelope<CleanupSession>>;
  cancel: (sessionId: string) => Promise<NativeEnvelope<{ cancelled: boolean; status: string; sessionId: string }>>;
  inventory: () => Promise<NativeEnvelope<CleanupInventory>>;
  estimate: () => Promise<NativeEnvelope<CleanupEstimate>>;
  quarantine: () => Promise<NativeEnvelope<CleanupQuarantine>>;
  unused: (request: { sourceId?: string; ageDays: number; limit?: number }) => Promise<NativeEnvelope<CleanupUnusedResult>>;
  plan: (request: { candidateIds: string[]; mode: CleanupPlan['mode'] }) => Promise<NativeEnvelope<CleanupPlan>>;
  schedule: (request: { frequency: 'daily' | 'weekly'; time: string; weekdays: number[]; categories: CleanupCategory[] }) => Promise<NativeEnvelope<CleanupScheduleDraft>>;
  report: () => Promise<NativeEnvelope<CleanupReport>>;
  openSettings: (target: 'storage' | 'windowsupdate') => Promise<NativeEnvelope<{ opened: boolean; target: string }>>;
}

export interface AppsShellApi {
  contractVersion: number;
  capabilities: () => Promise<NativeEnvelope<AppsCapabilities>>;
  inventory: () => Promise<NativeEnvelope<AppsInventory>>;
  signature: (appId: string) => Promise<NativeEnvelope<AppSignatureResult>>;
  associations: () => Promise<NativeEnvelope<AppAssociations>>;
  sizes: (request: { appIds: string[]; operationId: string }) => Promise<NativeEnvelope<AppSizesResult>>;
  cancelSizes: (operationId: string) => Promise<NativeEnvelope<{ cancelled: boolean; operationId: string }>>;
  leftovers: () => Promise<NativeEnvelope<AppLeftoversResult>>;
  updates: (request: { check: boolean }) => Promise<NativeEnvelope<AppUpdatesResult>>;
  plan: (request: { appIds: string[] }) => Promise<NativeEnvelope<AppPlan>>;
  packages: (request: { tab: 'installed' | 'discover'; query?: string }) => Promise<NativeEnvelope<AppPackagesResult>>;
  openSettings: (target: 'defaultapps' | 'appsfeatures') => Promise<NativeEnvelope<{ opened: boolean; target: string }>>;
}
