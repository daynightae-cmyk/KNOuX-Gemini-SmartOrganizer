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
  planId: string;
  executable: boolean;
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

export interface StartupEntry {
  id: string;
  name: string;
  sourceKind: 'registry-run' | 'registry-runonce' | 'startup-folder' | 'scheduled-task';
  scope: 'user' | 'machine';
  location: string;
  command: string | null;
  args: string | null;
  executable: string | null;
  publisher: string | null;
  signature: 'valid' | 'untrusted' | 'unsigned' | 'unavailable';
  state: 'enabled' | 'disabled' | 'unknown';
  approvedState: 'enabled' | 'disabled' | 'unknown';
  protection: 'protected' | 'standard';
  protectionReason: string | null;
  elevationRequired: boolean;
  active: boolean;
  description: string | null;
  triggers: string[];
  taskState: string | null;
  taskPath: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  userId: string | null;
  runLevel: string | null;
  evidence: string[];
}

export interface StartupServiceEntry {
  id: string;
  name: string;
  displayName: string;
  state: string;
  startupType: 'automatic' | 'delayed' | 'manual' | 'disabled' | 'unknown';
  delayedAuto: boolean;
  account: string;
  binaryPath: string | null;
  running: boolean;
  processId: number | null;
  protected: boolean;
  protectionReason: string | null;
  evidence: string[];
}

export interface StartupTaskEntry {
  id: string;
  name: string;
  path: string;
  state: string;
  author: string | null;
  userId: string | null;
  runLevel: string | null;
  triggers: string[];
  nextRunAt: string | null;
  lastRunAt: string | null;
  execute: string | null;
  args: string | null;
  protected: boolean;
  protectionReason: string | null;
}

export interface StartupBootEvent {
  id: string;
  eventId: number | null;
  timeCreated: string | null;
  level: string | null;
  provider: string;
  message: string | null;
  properties: string[];
  measured: boolean;
}

export interface StartupBootEvidence {
  available: boolean;
  lastBootAt: string | null;
  uptimeSeconds: number | null;
  eventCount: number;
  events: StartupBootEvent[];
  note: string;
}

export interface StartupSourceCoverage {
  registryKeys: number;
  startupFolders: number;
  scheduledTasks: number;
  servicesMeasured: number;
  errors: string[];
}

export interface StartupSummary {
  total: number;
  enabled: number;
  disabled: number;
  unknown: number;
  protectedCount: number;
  activeCount: number;
  elevationCount: number;
  registry: number;
  folders: number;
  tasks: number;
  services: number;
}

export interface StartupInventory {
  status: 'complete' | 'partial';
  source: string;
  observedAt: string;
  readOnly: true;
  mutation: 'none';
  entries: StartupEntry[];
  services: StartupServiceEntry[];
  tasks: StartupTaskEntry[];
  summary: StartupSummary;
  coverage: StartupSourceCoverage;
  boot: StartupBootEvidence;
  warnings: string[];
}

export interface StartupStage {
  key: string;
  labelEn: string;
  labelAr: string;
  status: 'pending' | 'running' | 'complete' | 'partial' | 'failed' | 'skipped';
  detail: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface StartupSession {
  id: string;
  status: 'running' | 'complete' | 'partial' | 'cancelled' | 'failed';
  startedAt: string;
  finishedAt: string | null;
  stages: StartupStage[];
  entryCount: number | null;
  warningCount: number;
  cancelled: boolean;
  error: string | null;
}

export interface StartupImpact {
  available: boolean;
  observedAt: string;
  lastBootAt: string | null;
  uptimeSeconds: number | null;
  events: StartupBootEvent[];
  attributed: Array<{ entryId: string | null; name: string; evidence: string; delayMs: number | null }>;
  note: string;
  warnings: string[];
}

export interface StartupPlanItem {
  entryId: string;
  name: string;
  sourceKind: StartupEntry['sourceKind'] | 'service';
  location: string;
  action: 'disable' | 'enable' | 'delay' | 'restore' | 'rollback';
  before: string;
  after: string;
  protected: boolean;
  elevationRequired: boolean;
  conflicts: string[];
}

export interface StartupPlan {
  id: string;
  contract: 'startup.v1';
  mode: 'disable' | 'enable' | 'delay' | 'restore' | 'batch' | 'rollback';
  createdAt: string;
  immutable: true;
  mutation: 'none';
  itemCount: number;
  items: StartupPlanItem[];
  protectedCount: number;
  elevationCount: number;
  conflictCount: number;
  estimatedSavingsMs: null;
  execution: { available: false; gate: string; reason: string };
  warnings: string[];
}

export interface StartupJournal {
  available: false;
  status: 'empty' | 'gated';
  entries: [];
  reason: string;
  execution: { available: false; gate: string; reason: string };
}

export interface StartupSessions {
  available: false;
  sessions: [];
  reason: string;
  execution: { available: false; gate: string; reason: string };
}

export interface StartupReport {
  generatedAt: string;
  source: string;
  readOnly: true;
  mutation: 'none';
  summary: StartupSummary;
  coverage: StartupSourceCoverage;
  boot: StartupBootEvidence;
  entries: StartupEntry[];
  note: string;
}

export interface StartupCapabilityService {
  id: string;
  labelEn: string;
  labelAr: string;
  state: 'available' | 'partial' | 'gated';
  provider: string;
  noteEn: string;
  noteAr: string;
}

export interface StartupCapabilities {
  engine: string;
  contract: 'startup.v1';
  readOnly: true;
  mutation: 'none';
  fixtureFallback: false;
  serviceCount: number;
  services: StartupCapabilityService[];
  gatedOperations: Array<{ id: string; mission: string; title: string; reason: string }>;
  sources: string[];
  limits: { entries: number; services: number; tasks: number; bootEvents: number; planItems: number; scanTimeoutMs: number };
  nativeOnly: string[];
}

export interface StartupShellApi {
  contractVersion: number;
  capabilities: () => Promise<NativeEnvelope<StartupCapabilities>>;
  start: (request: { includeTasks?: boolean; includeServices?: boolean; includeBoot?: boolean }) => Promise<NativeEnvelope<StartupSession>>;
  status: (sessionId: string) => Promise<NativeEnvelope<StartupSession>>;
  cancel: (sessionId: string) => Promise<NativeEnvelope<{ cancelled: boolean; status: string; sessionId: string }>>;
  inventory: () => Promise<NativeEnvelope<StartupInventory>>;
  icon: (entryId: string) => Promise<NativeEnvelope<{ dataUrl: string | null; status: 'available' | 'unavailable' }>>;
  services: () => Promise<NativeEnvelope<StartupServiceEntry[]>>;
  tasks: () => Promise<NativeEnvelope<StartupTaskEntry[]>>;
  impact: () => Promise<NativeEnvelope<StartupImpact>>;
  journal: () => Promise<NativeEnvelope<StartupJournal>>;
  sessions: () => Promise<NativeEnvelope<StartupSessions>>;
  plan: (request: { entryIds: string[]; mode: StartupPlan['mode']; delayMinutes?: number }) => Promise<NativeEnvelope<StartupPlan>>;
  report: () => Promise<NativeEnvelope<StartupReport>>;
  openSettings: (target: 'startupapps') => Promise<NativeEnvelope<{ opened: boolean; target: string }>>;
}

/* ------------------------------------------------------------------------- */
/* Mission 10 - Live Pulse observatory (system + network + hardware)          */
/* ------------------------------------------------------------------------- */

export type SystemWorld = 'system' | 'network' | 'hardware';

export type SystemStageKey =
  | 'system'
  | 'processes'
  | 'services'
  | 'events'
  | 'drivers'
  | 'network'
  | 'sockets'
  | 'hardware'
  | 'timeline';

export interface SystemStage {
  key: SystemStageKey;
  labelEn: string;
  labelAr: string;
  status: 'pending' | 'running' | 'complete' | 'partial' | 'failed' | 'cancelled';
  provider: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  items: number | null;
  warning: string | null;
}

export interface SystemSession {
  contract: 'system.v1';
  id: string;
  status: 'running' | 'complete' | 'partial' | 'cancelled' | 'failed';
  startedAt: string;
  completedAt: string | null;
  progress: number;
  stages: SystemStage[];
  warnings: string[];
  readOnly: true;
  mutation: 'none';
}

export interface SystemIdentity {
  osName: string | null;
  osVersion: string | null;
  osBuild: string | null;
  osEdition: string | null;
  architecture: string | null;
  manufacturer: string | null;
  model: string | null;
  processor: string | null;
  installedRamBytes: number | null;
  installDate: string | null;
  bootTime: string | null;
  uptimeSeconds: number | null;
  fastStartupEnabled: boolean | null;
  fastStartupAvailable: boolean;
  timeZone: string | null;
  locale: string | null;
}

export interface SystemMetrics {
  timestamp: string;
  cpuPercent: number | null;
  cpuFrequencyMHz: number | null;
  memoryPercent: number | null;
  memoryUsedBytes: number | null;
  memoryTotalBytes: number | null;
  memoryCommittedBytes: number | null;
  diskReadBytesPerSec: number | null;
  diskWriteBytesPerSec: number | null;
  diskLatencyMs: number | null;
  networkInBytesPerSec: number | null;
  networkOutBytesPerSec: number | null;
  processCount: number | null;
  threadCount: number | null;
  handleCount: number | null;
  source: string;
}

export interface SystemSeries {
  contract: 'system.v1';
  samples: SystemMetrics[];
  intervalMs: number;
  maxSamples: number;
  source: string;
  readOnly: true;
}

export interface SystemProcess {
  id: string;
  pid: number;
  parentPid: number | null;
  name: string;
  executablePath: string | null;
  commandLine: string | null;
  owner: string | null;
  ownerAvailable: boolean;
  cpuPercent: number | null;
  cpuSeconds: number | null;
  workingSetBytes: number | null;
  privateBytes: number | null;
  threads: number | null;
  handles: number | null;
  startedAt: string | null;
  company: string | null;
  description: string | null;
  signatureStatus: string | null;
  signatureAvailable: boolean;
  protected: boolean;
  source: string;
}

export interface SystemProcessResult {
  contract: 'system.v1';
  processes: SystemProcess[];
  total: number;
  truncated: boolean;
  observedAt: string;
}

export interface SystemDriver {
  id: string;
  deviceName: string;
  provider: string | null;
  version: string | null;
  driverDate: string | null;
  infName: string | null;
  signed: boolean | null;
  signer: string | null;
  whqlStatus: 'signed' | 'unsigned' | 'unknown';
  deviceId: string | null;
  hardwareIds: string[];
  deviceClass: string | null;
  source: string;
}

export interface SystemServiceNode {
  id: string;
  name: string;
  displayName: string;
  state: string | null;
  startMode: string | null;
  delayedAutoStart: boolean | null;
  processId: number | null;
  executablePath: string | null;
  description: string | null;
  protected: boolean;
  source: string;
}

export interface SystemServiceEdge {
  from: string;
  to: string;
  relation: 'depends-on' | 'required-by';
}

export interface SystemStartupLink {
  id: string;
  name: string;
  command: string;
  source: string;
  location: string;
  scope: string;
  processId: number | null;
  serviceName: string | null;
  appName: string | null;
  linkType: 'process-match' | 'service-match' | 'app-match' | 'unlinked';
  confidence: 'measured' | 'inferred';
  evidence: string;
}

export interface SystemEventRecord {
  id: string;
  channel: string;
  recordId: number | null;
  eventId: number | null;
  provider: string;
  level: number | null;
  levelName: string | null;
  timeCreated: string | null;
  message: string;
  userSid: string | null;
  activityId: string | null;
  source: string;
}

export interface SystemEventChannelInfo {
  name: string;
  recordCount: number | null;
  fileSizeBytes: number | null;
  enabled: boolean | null;
  retention: string | null;
  logFilePath: string | null;
  lastWriteTime: string | null;
  source: string;
}

export interface SystemBootEvent {
  timeCreated: string | null;
  eventId: number | null;
  provider: string;
  message: string;
}

export interface SystemBootEvidence {
  lastBootTime: string | null;
  uptimeSeconds: number | null;
  fastStartupEnabled: boolean | null;
  fastStartupAvailable: boolean;
  shutdownReason: 'unknown';
  events: SystemBootEvent[];
  note: string;
}

export interface SystemTimelineEvent {
  id: string;
  at: string | null;
  lane: 'knoux' | 'windows' | 'observation';
  kind: string;
  title: string;
  detail: string;
  source: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  recordId: string | null;
}

export interface SystemCoverageStage {
  key: SystemStageKey;
  status: 'complete' | 'partial' | 'unavailable' | 'cancelled';
  provider: string;
  durationMs: number | null;
  items: number | null;
  note: string | null;
}

export interface NetworkAddress {
  address: string;
  prefixLength: number | null;
  family: 'IPv4' | 'IPv6';
  origin: string | null;
  state: string | null;
}

export interface NetworkInterfaceInfo {
  id: string;
  name: string;
  description: string;
  status: string | null;
  mac: string | null;
  linkSpeed: string | null;
  speedBps: number | null;
  mediaType: string | null;
  interfaceIndex: number | null;
  interfaceType: string | null;
  connectionState: string | null;
  dhcp: string | null;
  mtu: number | null;
  ipv4: NetworkAddress[];
  ipv6: NetworkAddress[];
  dnsServers: string[];
  gateway: string | null;
  dnsSuffix: string | null;
  virtual: boolean | null;
  source: string;
}

export interface NetworkRoute {
  id: string;
  destination: string;
  nextHop: string;
  metric: number | null;
  interfaceAlias: string | null;
  source: string;
}

export interface NetworkNeighbor {
  id: string;
  ip: string;
  mac: string | null;
  state: string | null;
  interfaceAlias: string | null;
  family: 'IPv4' | 'IPv6' | null;
  inferred: boolean;
  vendor: string | null;
  source: string;
}

export interface NetworkSocket {
  id: string;
  protocol: 'TCP' | 'UDP';
  localAddress: string;
  localPort: number | null;
  remoteAddress: string | null;
  remotePort: number | null;
  state: string | null;
  pid: number | null;
  processName: string | null;
  processPath: string | null;
  createdAt: string | null;
  source: string;
}

export interface NetworkWifiProfile {
  name: string;
  connectionMode: string | null;
  authentication: string | null;
  encryption: string | null;
}

export interface NetworkWifi {
  available: boolean;
  state: 'connected' | 'disconnected' | 'unsupported' | 'unavailable';
  adapterName: string | null;
  ssid: string | null;
  bssid: string | null;
  signalPercent: number | null;
  rssiDbm: number | null;
  radioType: string | null;
  band: string | null;
  channel: number | null;
  receiveRateMbps: number | null;
  transmitRateMbps: number | null;
  cipher: string | null;
  authentication: string | null;
  profiles: NetworkWifiProfile[];
  reason: string | null;
  source: string;
}

export interface HostsEntry {
  lineNumber: number;
  ip: string | null;
  hostnames: string[];
  comment: string | null;
  active: boolean;
  raw: string;
}

export interface HostsFileInfo {
  path: string;
  exists: boolean;
  readable: boolean;
  totalLines: number;
  activeMappings: number;
  entries: HostsEntry[];
  sha256: string | null;
  lastWriteTime: string | null;
  readOnly: true;
  reason: string | null;
}

export type HostsDraftMode = 'comment' | 'uncomment' | 'replace' | 'add';

export interface HostsDraft {
  mode: HostsDraftMode;
  lineNumber?: number;
  ip?: string;
  hostnames?: string[];
  note?: string;
}

export interface HostsPlan {
  contract: 'system.v1';
  immutable: true;
  readOnly: true;
  mutation: 'none';
  targetPath: string;
  draft: HostsDraft;
  allowed: boolean;
  before: string[];
  after: string[];
  addedLines: number;
  removedLines: number;
  warnings: string[];
  execution: { available: false; reason: string };
  stagedAt: string;
  receipt: string;
}

export interface NetworkProxyLane {
  lane: 'WinINET' | 'WinHTTP' | 'WPAD';
  enabled: boolean | null;
  proxyServer: string | null;
  bypassList: string | null;
  autoConfigUrl: string | null;
  autoDetect: boolean | null;
  source: string;
  provenance: string;
}

export interface NetworkProxyInfo {
  lanes: NetworkProxyLane[];
  effective: 'direct' | 'manual' | 'pac' | 'auto-detect' | 'unknown';
  warnings: string[];
  readOnly: true;
}

export interface SystemCpuInfo {
  id: string;
  name: string;
  vendor: string | null;
  cores: number | null;
  logicalProcessors: number | null;
  maxClockMHz: number | null;
  socket: string | null;
  architecture: string | null;
  l2CacheBytes: number | null;
  l3CacheBytes: number | null;
  virtualizationFirmwareEnabled: boolean | null;
  vmMonitorModeExtensions: boolean | null;
  processorId: string | null;
  source: string;
}

export interface SystemGpuInfo {
  id: string;
  name: string;
  vendor: string | null;
  adapterRamBytes: number | null;
  driverVersion: string | null;
  driverDate: string | null;
  videoProcessor: string | null;
  status: string | null;
  pnpDeviceId: string | null;
  videoMode: string | null;
  source: string;
}

export interface SystemMemoryModule {
  id: string;
  manufacturer: string | null;
  partNumber: string | null;
  capacityBytes: number | null;
  speedMHz: number | null;
  configuredSpeedMHz: number | null;
  formFactor: string | null;
  locator: string | null;
  bankLabel: string | null;
  memoryType: string | null;
  source: string;
}

export interface SystemDiskInfo {
  id: string;
  deviceId: string | null;
  model: string;
  serial: string | null;
  mediaType: string | null;
  busType: string | null;
  sizeBytes: number | null;
  healthStatus: string | null;
  operationalStatus: string[];
  partitionCount: number | null;
  smartStatus: string | null;
  powerOnHours: number | null;
  temperatureCelsius: number | null;
  wearPercent: number | null;
  source: string;
}

export interface SystemBatteryInfo {
  id: string;
  name: string;
  deviceId: string | null;
  chargePercent: number | null;
  status: string | null;
  designCapacityMilliWattHours: number | null;
  fullChargeCapacityMilliWattHours: number | null;
  estimatedRunTimeMinutes: number | null;
  powerOnline: boolean | null;
  charging: boolean | null;
  discharging: boolean | null;
  cycleCount: number | null;
  cycleCountAvailable: boolean;
  voltageMillivolts: number | null;
  manufacturer: string | null;
  chemistry: string | null;
  healthPercent: number | null;
  source: string;
}

export interface SystemUsbNode {
  id: string;
  parentId: string | null;
  name: string;
  deviceClass: string | null;
  manufacturer: string | null;
  status: string | null;
  vendorId: string | null;
  productId: string | null;
  busSpeed: string | null;
  powerMilliAmps: number | null;
  pnpDeviceId: string | null;
  nodeType: 'controller' | 'hub' | 'device';
  source: string;
}

export interface SystemMonitorInfo {
  id: string;
  name: string;
  manufacturer: string | null;
  year: number | null;
  week: number | null;
  width: number | null;
  height: number | null;
  refreshHz: number | null;
  primary: boolean;
  hdrAvailable: boolean | null;
  hdrEnabled: boolean | null;
  bitsPerPixel: number | null;
  connection: string | null;
  pnpDeviceId: string | null;
  source: string;
}

export interface SystemAudioEndpoint {
  id: string;
  name: string;
  manufacturer: string | null;
  status: string | null;
  kind: 'output' | 'input';
  isDefault: boolean | null;
  driver: string | null;
  formats: string[];
  pnpDeviceId: string | null;
  source: string;
}

export interface SystemThermalZone {
  id: string;
  name: string;
  celsius: number | null;
  warningCelsius: number | null;
  source: string;
}

export interface SystemThermalInfo {
  available: boolean;
  provider: string | null;
  celsius: number | null;
  zones: SystemThermalZone[];
  throttling: boolean | null;
  reason: string;
  readOnly: true;
}

export interface SystemHardwareSnapshot {
  system: {
    manufacturer: string | null;
    model: string | null;
    baseboardManufacturer: string | null;
    baseboardProduct: string | null;
    biosVendor: string | null;
    biosVersion: string | null;
    biosDate: string | null;
  };
  cpu: SystemCpuInfo[];
  gpu: SystemGpuInfo[];
  memory: SystemMemoryModule[];
  disks: SystemDiskInfo[];
  batteries: SystemBatteryInfo[];
  usb: SystemUsbNode[];
  monitors: SystemMonitorInfo[];
  audio: SystemAudioEndpoint[];
  thermal: SystemThermalInfo;
  problemDevices: Array<{ id: string; name: string; problemCode: number | null; manufacturer: string | null; pnpDeviceId: string | null }>;
  totals: {
    cores: number | null;
    logicalProcessors: number | null;
    memoryBytes: number | null;
    diskBytes: number | null;
    monitors: number;
    usbDevices: number;
    audioEndpoints: number;
    batteries: number;
  };
  availability: {
    cpu: boolean;
    gpu: boolean;
    memory: boolean;
    disks: boolean;
    batteries: boolean;
    usb: boolean;
    monitors: boolean;
    audio: boolean;
    thermal: boolean;
    smart: boolean;
  };
}

export interface SystemSnapshot {
  contract: 'system.v1';
  generatedAt: string;
  readOnly: true;
  mutation: 'none';
  fixtureFallback: false;
  identity: SystemIdentity;
  metrics: SystemMetrics;
  processes: SystemProcess[];
  processCount: number;
  drivers: SystemDriver[];
  services: SystemServiceNode[];
  serviceEdges: SystemServiceEdge[];
  startupLinks: SystemStartupLink[];
  events: SystemEventRecord[];
  eventChannels: SystemEventChannelInfo[];
  boot: SystemBootEvidence;
  interfaces: NetworkInterfaceInfo[];
  routes: NetworkRoute[];
  neighbors: NetworkNeighbor[];
  sockets: NetworkSocket[];
  wifi: NetworkWifi;
  hosts: HostsFileInfo;
  proxies: NetworkProxyInfo;
  hardware: SystemHardwareSnapshot;
  timeline: SystemTimelineEvent[];
  coverage: SystemCoverageStage[];
  warnings: string[];
  receipt: string;
  sources: string[];
}

export interface SystemEventQuery {
  channel?: string;
  levels?: number[];
  sinceHours?: number;
  search?: string;
  limit?: number;
}

export interface SystemEventsResult {
  contract: 'system.v1';
  events: SystemEventRecord[];
  total: number;
  truncated: boolean;
  query: SystemEventQuery;
  channels: SystemEventChannelInfo[];
  observedAt: string;
}

export interface SystemSignature {
  path: string;
  signatureStatus: string | null;
  signatureAvailable: boolean;
  signerSubject: string | null;
  signerThumbprint: string | null;
  signerNotBefore: string | null;
  signerNotAfter: string | null;
  rootSubject: string | null;
  rootTrusted: boolean | null;
  message: string | null;
  source: string;
}

export interface SystemSignatureResult {
  contract: 'system.v1';
  signatures: SystemSignature[];
  requested: number;
  verified: number;
  truncated: boolean;
  observedAt: string;
}

export type SystemDiagnosticType = 'dns' | 'tcp' | 'http' | 'ping';

export interface SystemDiagnosticStage {
  stage: 'dns' | 'tcp' | 'http' | 'ping' | 'summary';
  label: string;
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  latencyMs: number | null;
  detail: string;
  evidence: string[];
}

export interface SystemDiagnosticResult {
  contract: 'system.v1';
  type: SystemDiagnosticType;
  target: string;
  port: number | null;
  ok: boolean;
  startedAt: string;
  durationMs: number;
  stages: SystemDiagnosticStage[];
  receipt: string;
  readOnly: true;
}

export interface SystemTracerouteHop {
  hop: number;
  address: string | null;
  latencyMs: number[];
  timedOut: boolean;
  asn: string | null;
}

export interface SystemTracerouteResult {
  contract: 'system.v1';
  target: string;
  maxHops: number;
  hops: SystemTracerouteHop[];
  reached: boolean;
  startedAt: string;
  durationMs: number;
  receipt: string;
  readOnly: true;
}

export interface SystemReportSection {
  id: string;
  titleEn: string;
  titleAr: string;
  status: 'validated' | 'partial' | 'unavailable';
  measured: number;
  unknown: number;
  items: Array<{ label: string; value: string; status: 'measured' | 'unknown' | 'warning' }>;
}

export interface SystemReport {
  contract: 'system.v1';
  generatedAt: string;
  readOnly: true;
  mutation: 'none';
  redacted: boolean;
  summary: string;
  sections: SystemReportSection[];
  warnings: string[];
  receipt: string;
}

export interface SystemCapabilityService {
  id: string;
  world: SystemWorld;
  labelEn: string;
  labelAr: string;
  state: 'available' | 'partial' | 'gated';
  provider: string;
  noteEn: string;
  noteAr: string;
}

export interface SystemCapabilities {
  engine: string;
  contract: 'system.v1';
  readOnly: true;
  mutation: 'none';
  fixtureFallback: false;
  serviceCount: 36;
  worldCount: 3;
  services: SystemCapabilityService[];
  gatedOperations: Array<{ id: string; mission: string; title: string; reason: string }>;
  sources: string[];
  limits: {
    processes: number;
    drivers: number;
    services: number;
    events: number;
    channels: number;
    sockets: number;
    neighbors: number;
    signaturePaths: number;
    traceHops: number;
    scanTimeoutMs: number;
  };
  nativeOnly: string[];
}

export interface SystemShellApi {
  contractVersion: number;
  capabilities: () => Promise<NativeEnvelope<SystemCapabilities>>;
  start: () => Promise<NativeEnvelope<SystemSession>>;
  status: (sessionId: string) => Promise<NativeEnvelope<SystemSession>>;
  cancel: (sessionId: string) => Promise<NativeEnvelope<{ cancelled: boolean; status: string; sessionId: string }>>;
  snapshot: () => Promise<NativeEnvelope<SystemSnapshot>>;
  sample: () => Promise<NativeEnvelope<SystemMetrics>>;
  processes: () => Promise<NativeEnvelope<SystemProcessResult>>;
  events: (query: SystemEventQuery) => Promise<NativeEnvelope<SystemEventsResult>>;
  signatures: (paths: string[]) => Promise<NativeEnvelope<SystemSignatureResult>>;
  diagnostics: (request: { type: SystemDiagnosticType; target: string; port?: number }) => Promise<NativeEnvelope<SystemDiagnosticResult>>;
  traceroute: (request: { target: string; maxHops?: number }) => Promise<NativeEnvelope<SystemTracerouteResult>>;
  hosts: () => Promise<NativeEnvelope<HostsFileInfo>>;
  hostsPlan: (draft: HostsDraft) => Promise<NativeEnvelope<HostsPlan>>;
  report: (options?: { redact?: boolean }) => Promise<NativeEnvelope<SystemReport>>;
  openSettings: (target: 'display' | 'network' | 'wifi' | 'sound') => Promise<NativeEnvelope<{ opened: boolean; target: string }>>;
}

/* -------------------------------------------------------------------------- */
/* Repair v1 - Recovery Lab (Mission 11)                                      */
/* -------------------------------------------------------------------------- */

export type RepairToolId =
  | 'repair-component-check'
  | 'repair-component-scan'
  | 'repair-component-restore'
  | 'repair-files-verify'
  | 'repair-files-repair'
  | 'repair-dns-flush'
  | 'repair-winsock-reset'
  | 'repair-tcpip-reset'
  | 'repair-history'
  | 'repair-troubleshooters'
  | 'repair-restore-point'
  | 'repair-update-reset';

export type RepairStageKey = 'identity' | 'servicing' | 'network' | 'update' | 'restore' | 'journal';

export interface RepairStage {
  key: RepairStageKey;
  labelEn: string;
  labelAr: string;
  status: 'pending' | 'running' | 'complete' | 'partial' | 'failed' | 'cancelled';
  provider: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  items: number | null;
  warning: string | null;
}

export interface RepairSession {
  contract: 'repair.v1';
  id: string;
  status: 'running' | 'complete' | 'partial' | 'cancelled' | 'failed';
  startedAt: string;
  completedAt: string | null;
  progress: number;
  stages: RepairStage[];
  warnings: string[];
  readOnly: true;
  mutation: 'none';
}

export interface RepairToolState {
  id: RepairToolId;
  world: 'repair';
  labelEn: string;
  labelAr: string;
  state: 'available' | 'partial' | 'gated';
  risk: 'read-only' | 'elevated-read-only' | 'administrative';
  provider: string;
  noteEn: string;
  noteAr: string;
}

export interface RepairCommandSpec {
  id: string;
  toolId: RepairToolId;
  labelEn: string;
  labelAr: string;
  display: string;
  elevationRequired: boolean;
  risk: 'read-only' | 'elevated-read-only' | 'administrative';
  rebootRequired: boolean;
  execution: { available: false; reason: string };
}

export interface RepairPrerequisite {
  id: string;
  labelEn: string;
  labelAr: string;
  status: 'passed' | 'failed' | 'unknown' | 'unavailable';
  detail: string;
}

export interface RepairIdentity {
  osName: string | null;
  osVersion: string | null;
  osBuild: string | null;
  architecture: string | null;
  isAdmin: boolean | null;
  elevationMethod: 'user-initiated UAC only';
  powershellVersion: string | null;
  dismAvailable: boolean | null;
  sfcAvailable: boolean | null;
  safeBoot: boolean | null;
  pendingReboot: boolean | null;
  systemRoot: string | null;
  observedAt: string;
}

export interface RepairFileEvidence {
  path: string | null;
  exists: boolean | null;
  sizeBytes: number | null;
  lastWrite: string | null;
}

export interface RepairServicingEvidence {
  dismLog: RepairFileEvidence;
  cbsLog: RepairFileEvidence;
  componentStore: RepairFileEvidence;
  pendingCbs: boolean | null;
  pendingWindowsUpdate: boolean | null;
  componentStoreHealth: 'not-run' | 'unknown';
  note: string;
}

export interface RepairNetworkAdapter {
  name: string;
  description: string | null;
  status: string | null;
  linkSpeed: string | null;
  mac: string | null;
}

export interface RepairNetworkAddress {
  interfaceAlias: string;
  address: string;
  prefixLength: number | null;
  origin: string | null;
}

export interface RepairNetworkEvidence {
  adapters: RepairNetworkAdapter[];
  addresses: RepairNetworkAddress[];
  dnsServers: Array<{ interfaceAlias: string; servers: string[] }>;
  dnsCache: {
    status: 'measured' | 'unavailable';
    entryCount: number | null;
    note: string;
    source: string;
  };
  winsock: {
    status: 'measured' | 'unavailable';
    providerCount: number | null;
    categories: string[];
    note: string;
    source: string;
  };
}

export interface RepairServiceEvidence {
  name: string;
  displayName: string | null;
  status: string | null;
  startType: string | null;
}

export interface RepairUpdateEvidence {
  services: RepairServiceEvidence[];
  softwareDistribution: { path: string | null; exists: boolean | null };
  download: { path: string | null; exists: boolean | null; items: number | null };
  pendingReboot: boolean | null;
  note: string;
}

export interface RepairRestorePoint {
  sequenceNumber: number;
  description: string | null;
  createdAt: string | null;
  type: string | null;
}

export interface RepairRestoreEvidence {
  status: 'available' | 'permission_denied' | 'unavailable';
  points: RepairRestorePoint[];
  enabled: boolean | null;
  reason: string | null;
  source: string;
}

export interface RepairTroubleshooterCategory {
  id: 'network' | 'audio' | 'printer' | 'update';
  labelEn: string;
  labelAr: string;
  checklistEn: string[];
  checklistAr: string[];
  settingsTarget: string;
}

export interface RepairTroubleshooterEvidence {
  msdtAvailable: boolean | null;
  commandAvailable: boolean | null;
  settingsTarget: 'troubleshoot';
  categories: RepairTroubleshooterCategory[];
  note: string;
}

export interface RepairJournalEntry {
  id: string;
  at: string;
  kind: 'preview' | 'blocked-attempt';
  title: string;
  summary: string;
  toolIds: RepairToolId[];
  risk: 'read-only' | 'elevated-read-only' | 'administrative';
  elevationRequired: boolean;
  rebootRequired: boolean;
  receipt: string;
  readOnly: true;
  mutation: 'none';
}

export interface RepairSnapshot {
  contract: 'repair.v1';
  generatedAt: string;
  readOnly: true;
  mutation: 'none';
  fixtureFallback: false;
  identity: RepairIdentity;
  servicing: RepairServicingEvidence;
  network: RepairNetworkEvidence;
  update: RepairUpdateEvidence;
  restore: RepairRestoreEvidence;
  troubleshooters: RepairTroubleshooterEvidence;
  journal: RepairJournalEntry[];
  commands: RepairCommandSpec[];
  gates: Array<{ id: string; mission: string; title: string; reason: string }>;
  coverage: Array<{ key: RepairStageKey; status: 'complete' | 'partial' | 'unavailable' | 'cancelled'; items: number | null; note: string | null }>;
  warnings: string[];
  sources: string[];
  receipt: string;
}

export interface RepairPlanItem {
  id: string;
  toolId: RepairToolId;
  titleEn: string;
  titleAr: string;
  provider: string;
  risk: 'read-only' | 'elevated-read-only' | 'administrative';
  elevationRequired: boolean;
  rebootRequired: boolean;
  command: RepairCommandSpec | null;
  prerequisites: RepairPrerequisite[];
  evidence: Array<{ label: string; value: string; status: 'measured' | 'unavailable' | 'permission_denied' }>;
  impactEn: string;
  impactAr: string;
  execution: { available: false; reason: string };
}

export interface RepairPlan {
  contract: 'repair.v1';
  id: string;
  createdAt: string;
  readOnly: true;
  mutation: 'none';
  immutable: true;
  mode: 'preview';
  itemCount: number;
  items: RepairPlanItem[];
  elevationRequired: boolean;
  rebootRequired: boolean;
  execution: { available: false; reason: string };
  journalRecorded: boolean;
  receipt: string;
  warnings: string[];
}

export interface RepairReport {
  contract: 'repair.v1';
  generatedAt: string;
  readOnly: true;
  mutation: 'none';
  redacted: boolean;
  summary: string;
  sections: Array<{
    id: string;
    titleEn: string;
    titleAr: string;
    status: 'validated' | 'partial' | 'unavailable';
    measured: number;
    unknown: number;
    items: Array<{ label: string; value: string; status: 'measured' | 'unknown' | 'warning' }>;
  }>;
  warnings: string[];
  receipt: string;
}

export interface RepairCapabilities {
  engine: string;
  contract: 'repair.v1';
  readOnly: true;
  mutation: 'none';
  fixtureFallback: false;
  serviceCount: 12;
  worldCount: 1;
  services: RepairToolState[];
  commands: RepairCommandSpec[];
  gatedOperations: Array<{ id: string; mission: string; title: string; reason: string }>;
  elevation: { isAdmin: boolean | null; method: 'user-initiated UAC only'; automaticElevation: false };
  limits: {
    journalEntries: number;
    planItems: number;
    diagnosticsTimeoutMs: number;
    discoveryTimeoutMs: number;
  };
  nativeOnly: string[];
}

export interface RepairShellApi {
  contractVersion: number;
  capabilities: () => Promise<NativeEnvelope<RepairCapabilities>>;
  start: () => Promise<NativeEnvelope<RepairSession>>;
  status: (sessionId: string) => Promise<NativeEnvelope<RepairSession>>;
  cancel: (sessionId: string) => Promise<NativeEnvelope<{ cancelled: boolean; status: string; sessionId: string }>>;
  snapshot: () => Promise<NativeEnvelope<RepairSnapshot>>;
  plan: (toolIds: RepairToolId[]) => Promise<NativeEnvelope<RepairPlan>>;
  journal: () => Promise<NativeEnvelope<RepairJournalEntry[]>>;
  report: (options?: { redact?: boolean }) => Promise<NativeEnvelope<RepairReport>>;
  openSettings: (target: 'windowsupdate' | 'troubleshoot' | 'recovery') => Promise<NativeEnvelope<{ opened: boolean; target: string }>>;
}

/* -------------------------------------------------------------------------- */
/* Services v1 - Service Commander (Mission 12)                               */
/* -------------------------------------------------------------------------- */

export type ServicesToolId =
  | 'services-inventory'
  | 'services-control'
  | 'services-undo'
  | 'services-dependencies'
  | 'services-protected'
  | 'services-search'
  | 'services-startup-report'
  | 'services-state-history'
  | 'services-dependents'
  | 'services-diagnose'
  | 'services-config'
  | 'services-perf';

export type ServicesStageKey = 'inventory' | 'graph' | 'protected' | 'events' | 'processes' | 'journal';

export interface ServicesStage {
  key: ServicesStageKey;
  labelEn: string;
  labelAr: string;
  status: 'pending' | 'running' | 'complete' | 'partial' | 'failed' | 'cancelled';
  provider: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  items: number | null;
  warning: string | null;
}

export interface ServicesSession {
  contract: 'services.v1';
  id: string;
  status: 'running' | 'complete' | 'partial' | 'cancelled' | 'failed';
  startedAt: string;
  completedAt: string | null;
  progress: number;
  stages: ServicesStage[];
  warnings: string[];
  readOnly: true;
  mutation: 'none';
}

export type ServiceAction = 'start' | 'stop' | 'restart' | 'startup-type';
export type ServiceStartupType = 'automatic' | 'manual' | 'disabled' | 'delayed';

export interface ServiceRecord {
  name: string;
  displayName: string | null;
  description: string | null;
  state: string | null;
  startupType: 'automatic' | 'manual' | 'disabled' | 'unknown';
  delayedAuto: boolean | null;
  account: string | null;
  pid: number | null;
  binaryPath: string | null;
  serviceType: string | null;
  acceptsStop: boolean | null;
  dependencies: string[];
  dependents: string[];
  protected: boolean;
  protectionRole: 'security' | 'rpc' | 'networking' | 'servicing' | 'system' | 'audio' | 'kernel-driver' | 'non-stoppable' | null;
  protectionReason: string | null;
  controllable: boolean;
  source: string;
}

export interface ServiceDependencyEdge {
  from: string;
  to: string;
}

export interface ServiceEventRecord {
  id: string;
  at: string | null;
  eventId: number | null;
  level: number | null;
  provider: string;
  serviceName: string | null;
  message: string;
  source: string;
}

export interface ServiceSvchostGroup {
  pid: number;
  group: string | null;
  workingSetBytes: number | null;
  serviceCount: number;
  services: string[];
  source: string;
}

export interface ServicesJournalEntry {
  id: string;
  at: string;
  kind: 'preview' | 'blocked-preview';
  serviceName: string;
  displayName: string | null;
  action: ServiceAction;
  title: string;
  summary: string;
  currentState: string | null;
  proposedState: string | null;
  currentStartupType: string | null;
  proposedStartupType: string | null;
  protected: boolean;
  elevationRequired: boolean;
  receipt: string;
  readOnly: true;
  mutation: 'none';
}

export interface ServicesSnapshot {
  contract: 'services.v1';
  generatedAt: string;
  readOnly: true;
  mutation: 'none';
  fixtureFallback: false;
  services: ServiceRecord[];
  total: number;
  truncated: boolean;
  elevation: { isAdmin: boolean | null };
  summary: {
    total: number;
    running: number;
    stopped: number;
    automatic: number;
    manual: number;
    disabled: number;
    delayed: number;
    protected: number;
    thirdParty: number;
  };
  edges: ServiceDependencyEdge[];
  events: ServiceEventRecord[];
  eventCoverage: { status: 'available' | 'permission_denied' | 'unavailable'; count: number; days: number; reason: string | null };
  svchost: ServiceSvchostGroup[];
  journal: ServicesJournalEntry[];
  gates: Array<{ id: string; mission: string; title: string; reason: string }>;
  coverage: Array<{ key: ServicesStageKey; status: 'complete' | 'partial' | 'unavailable' | 'cancelled'; items: number | null; note: string | null }>;
  warnings: string[];
  sources: string[];
  receipt: string;
}

export interface ServiceDependencyImpact {
  directDependents: string[];
  cascadeDependents: string[];
  runningDependents: string[];
  protectedDependents: string[];
  upstream: string[];
}

export interface ServiceOperationPlanItem {
  id: string;
  serviceName: string;
  displayName: string | null;
  action: ServiceAction;
  actionLabelEn: string;
  actionLabelAr: string;
  current: { state: string | null; startupType: string | null; delayedAuto: boolean | null };
  proposed: { state: string | null; startupType: string | null; delayedAuto: boolean | null };
  protected: boolean;
  protectionRole: string | null;
  protectionReason: string | null;
  elevationRequired: true;
  rebootRequired: false;
  dependencyImpact: ServiceDependencyImpact;
  conflicts: string[];
  prerequisites: Array<{ id: string; labelEn: string; labelAr: string; status: 'passed' | 'failed' | 'unknown'; detail: string }>;
  execution: { available: false; reason: string };
  receipt: string;
}

export interface ServiceOperationPlan {
  contract: 'services.v1';
  id: string;
  createdAt: string;
  readOnly: true;
  mutation: 'none';
  immutable: true;
  mode: 'preview';
  itemCount: 1;
  item: ServiceOperationPlanItem;
  execution: { available: false; reason: string };
  journalRecorded: boolean;
  warnings: string[];
  receipt: string;
}

export interface ServicesReport {
  contract: 'services.v1';
  generatedAt: string;
  readOnly: true;
  mutation: 'none';
  redacted: boolean;
  summary: string;
  sections: Array<{
    id: string;
    titleEn: string;
    titleAr: string;
    status: 'validated' | 'partial' | 'unavailable';
    measured: number;
    unknown: number;
    items: Array<{ label: string; value: string; status: 'measured' | 'unknown' | 'warning' }>;
  }>;
  warnings: string[];
  receipt: string;
}

export interface ServicesCapabilities {
  engine: string;
  contract: 'services.v1';
  readOnly: true;
  mutation: 'none';
  fixtureFallback: false;
  serviceCount: 12;
  worldCount: 1;
  services: Array<{
    id: ServicesToolId;
    world: 'services';
    labelEn: string;
    labelAr: string;
    state: 'available' | 'partial' | 'gated';
    risk: 'read-only' | 'staged-change';
    provider: string;
    noteEn: string;
    noteAr: string;
  }>;
  gatedOperations: Array<{ id: string; mission: string; title: string; reason: string }>;
  elevation: { isAdmin: boolean | null; method: 'user-initiated UAC only'; automaticElevation: false };
  limits: { services: number; events: number; journalEntries: number; discoveryTimeoutMs: number };
  nativeOnly: string[];
}

export interface ServicesShellApi {
  contractVersion: number;
  capabilities: () => Promise<NativeEnvelope<ServicesCapabilities>>;
  start: () => Promise<NativeEnvelope<ServicesSession>>;
  status: (sessionId: string) => Promise<NativeEnvelope<ServicesSession>>;
  cancel: (sessionId: string) => Promise<NativeEnvelope<{ cancelled: boolean; status: string; sessionId: string }>>;
  snapshot: () => Promise<NativeEnvelope<ServicesSnapshot>>;
  plan: (request: { serviceName: string; action: ServiceAction; startupType?: ServiceStartupType }) => Promise<NativeEnvelope<ServiceOperationPlan>>;
  journal: () => Promise<NativeEnvelope<ServicesJournalEntry[]>>;
  report: (options?: { redact?: boolean }) => Promise<NativeEnvelope<ServicesReport>>;
}

/* -------------------------------------------------------------------------- */
/* Automation v1 - Flow Studio (Mission 13)                                   */
/* -------------------------------------------------------------------------- */

export type AutomationToolId =
  | 'auto-smart-scan'
  | 'auto-schedule-manager'
  | 'auto-run-history'
  | 'auto-templates'
  | 'auto-schedule-plan'
  | 'auto-cleanup-plan'
  | 'auto-notify'
  | 'auto-quiet-hours'
  | 'auto-battery-policy'
  | 'auto-retention'
  | 'auto-export'
  | 'auto-backup-plan';

export type AutomationNodeType = 'trigger' | 'condition' | 'action' | 'approval' | 'report';

export interface AutomationNode {
  id: string;
  type: AutomationNodeType;
  label: string;
  toolId: AutomationToolId | 'platform';
  config: Record<string, string | number | boolean | string[] | null>;
}

export interface AutomationEdge {
  from: string;
  to: string;
}

export interface AutomationTrigger {
  type: 'manual' | 'schedule' | 'startup';
  cadence: 'daily' | 'weekly' | 'interval';
  time: string;
  days: number[];
  intervalHours: number;
  timezone: string;
  exclusions: string[];
}

export interface AutomationQuietHours {
  enabled: boolean;
  start: string;
  end: string;
  days: number[];
  weekendRule: 'mute' | 'allow' | 'inherit';
}

export interface AutomationPolicy {
  requireApproval: boolean;
  batteryThreshold: number;
  acOnly: boolean;
  retentionDays: 14 | 30 | 90;
  notifyChannels: string[];
  severity: 'info' | 'warning' | 'error';
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  schemaVersion: '1.0';
  version: number;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  quietHours: AutomationQuietHours;
  policy: AutomationPolicy;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  mutation: 'none';
  execution: 'not-implemented';
}

export interface AutomationWorkflowHistoryEntry {
  version: number;
  savedAt: string;
  name: string;
  nodeCount: number;
}

export interface AutomationTemplate {
  id: string;
  category: string;
  labelEn: string;
  labelAr: string;
  blurbEn: string;
  blurbAr: string;
  prerequisitesEn: string[];
  prerequisitesAr: string[];
  workflow: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'version'>;
}

export type AutomationStageKey = 'storage' | 'templates' | 'runtime' | 'sources' | 'journal';

export interface AutomationStage {
  key: AutomationStageKey;
  labelEn: string;
  labelAr: string;
  status: 'pending' | 'running' | 'complete' | 'partial' | 'failed' | 'cancelled';
  provider: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  items: number | null;
  warning: string | null;
}

export interface AutomationSession {
  contract: 'automation.v1';
  id: string;
  status: 'running' | 'complete' | 'partial' | 'cancelled' | 'failed';
  startedAt: string;
  completedAt: string | null;
  progress: number;
  stages: AutomationStage[];
  warnings: string[];
  readOnly: true;
  mutation: 'none';
}

export interface AutomationDryRunStep {
  nodeId: string;
  label: string;
  type: AutomationNodeType;
  status: 'would-fire' | 'evaluated-preview' | 'blocked' | 'required' | 'preview-artifact';
  detail: string;
}

export interface AutomationDryRunResult {
  contract: 'automation.v1';
  id: string;
  at: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  steps: AutomationDryRunStep[];
  nodeCount: number;
  edgeCount: number;
  order: string[];
  valid: true;
  readOnly: true;
  mutation: 'none';
  execution: 'not-implemented';
  receipt: string;
  warnings: string[];
}

export interface AutomationScheduleSpec {
  cadence: 'daily' | 'weekly' | 'interval';
  time: string;
  days: number[];
  intervalHours: number;
  timezone: string;
  exclusions: string[];
}

export interface AutomationScheduleOccurrence {
  at: string;
  local: string;
}

export interface AutomationSchedulePreview {
  contract: 'automation.v1';
  valid: boolean;
  spec: AutomationScheduleSpec;
  timezone: string;
  next: AutomationScheduleOccurrence[];
  reason: string | null;
  readOnly: true;
  mutation: 'none';
}

export interface AutomationImportValidation {
  contract: 'automation.v1';
  valid: boolean;
  errors: string[];
  warnings: string[];
  nodeCount: number;
  edgeCount: number;
  workflowName: string | null;
  schemaVersion: string | null;
  readOnly: true;
  mutation: 'none';
}

export interface AutomationJournalEntry {
  id: string;
  at: string;
  kind: 'dry-run';
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  nodeCount: number;
  stepCount: number;
  receipt: string;
  readOnly: true;
  mutation: 'none';
  execution: 'not-implemented';
}

export interface AutomationRuntimeEvidence {
  timezone: string;
  localTime: string;
  batteryAvailable: boolean;
  batteryCount: number;
  batteryChargePercent: number | null;
  powerSource: string | null;
  studioSources: Array<{ id: string; label: string; status: string; fileCount: number | null }>;
}

export interface AutomationSnapshot {
  contract: 'automation.v1';
  generatedAt: string;
  readOnly: true;
  mutation: 'none';
  fixtureFallback: false;
  workflows: AutomationWorkflow[];
  workflowHistory: AutomationWorkflowHistoryEntry[];
  templates: AutomationTemplate[];
  journal: AutomationJournalEntry[];
  runtime: AutomationRuntimeEvidence;
  gates: Array<{ id: string; mission: string; title: string; reason: string }>;
  coverage: Array<{ key: AutomationStageKey; status: 'complete' | 'partial' | 'unavailable' | 'cancelled'; items: number | null; note: string | null }>;
  warnings: string[];
  sources: string[];
  limits: { workflows: number; nodes: number; journalEntries: number; occurrences: number };
  receipt: string;
}

export interface AutomationReport {
  contract: 'automation.v1';
  generatedAt: string;
  readOnly: true;
  mutation: 'none';
  redacted: boolean;
  summary: string;
  sections: Array<{
    id: string;
    titleEn: string;
    titleAr: string;
    status: 'validated' | 'partial' | 'unavailable';
    measured: number;
    unknown: number;
    items: Array<{ label: string; value: string; status: 'measured' | 'unknown' | 'warning' }>;
  }>;
  warnings: string[];
  receipt: string;
}

export interface AutomationCapabilities {
  engine: string;
  contract: 'automation.v1';
  readOnly: true;
  mutation: 'none';
  fixtureFallback: false;
  serviceCount: 12;
  worldCount: 1;
  services: Array<{
    id: AutomationToolId;
    world: 'automation';
    labelEn: string;
    labelAr: string;
    state: 'available' | 'partial' | 'gated';
    risk: 'read-only' | 'staged-change';
    provider: string;
    noteEn: string;
    noteAr: string;
  }>;
  gatedOperations: Array<{ id: string; mission: string; title: string; reason: string }>;
  limits: { workflows: number; nodes: number; journalEntries: number; occurrences: number };
  nativeOnly: string[];
}

export interface AutomationShellApi {
  contractVersion: number;
  capabilities: () => Promise<NativeEnvelope<AutomationCapabilities>>;
  start: () => Promise<NativeEnvelope<AutomationSession>>;
  status: (sessionId: string) => Promise<NativeEnvelope<AutomationSession>>;
  cancel: (sessionId: string) => Promise<NativeEnvelope<{ cancelled: boolean; status: string; sessionId: string }>>;
  snapshot: () => Promise<NativeEnvelope<AutomationSnapshot>>;
  workflows: () => Promise<NativeEnvelope<AutomationWorkflow[]>>;
  save: (workflow: AutomationWorkflow | Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<NativeEnvelope<AutomationWorkflow>>;
  templates: () => Promise<NativeEnvelope<AutomationTemplate[]>>;
  dryRun: (workflow: AutomationWorkflow | Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<NativeEnvelope<AutomationDryRunResult>>;
  schedulePreview: (spec: AutomationScheduleSpec) => Promise<NativeEnvelope<AutomationSchedulePreview>>;
  validateImport: (payload: unknown) => Promise<NativeEnvelope<AutomationImportValidation>>;
  journal: () => Promise<NativeEnvelope<AutomationJournalEntry[]>>;
  report: (options?: { redact?: boolean }) => Promise<NativeEnvelope<AutomationReport>>;
}


export interface AppsShellApi {
  contractVersion: number;
  capabilities: () => Promise<NativeEnvelope<AppsCapabilities>>;
  inventory: () => Promise<NativeEnvelope<AppsInventory>>;
  icon: (appId: string) => Promise<NativeEnvelope<{ appId: string; dataUrl: string | null; status: 'available' | 'unavailable' }>>;
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

/* Google Workspace desktop OAuth v1. Token and client-secret material never
   appear in these types; only a minimized account label and read-only Sheets
   metadata/values cross the main-process boundary. */
export type GoogleConnectionState = 'disconnected' | 'connecting' | 'connected' | 'permission-missing' | 'error';

export interface GoogleAccountSummary {
  email: string | null;
  displayName: string;
}

export interface GoogleConnectionStatus {
  contract: 'google.oauth.v1';
  configured: boolean;
  connection: GoogleConnectionState;
  connected: boolean;
  account: GoogleAccountSummary | null;
  grantedScopes: string[];
  missingScopes: string[];
  tokenStorage: 'windows-dpapi-safeStorage' | 'unavailable';
  storageAvailable: boolean;
  selectedSpreadsheetCount: number;
  obtainedAt: string | null;
  lastError: { code: string; message: string; retryable: boolean } | null;
  updatedAt: string;
}

export interface GoogleSheetTab {
  sheetId: number;
  title: string;
  index: number;
  rows: number;
  columns: number;
}

export interface GoogleSheetMetadata {
  id: string;
  title: string;
  tabs: GoogleSheetTab[];
  observedAt: string;
}

export interface GoogleSheetsListResult {
  sheets: GoogleSheetMetadata[];
  failures: Array<{ id: string; code: string }>;
  selectedCount: number;
}

export interface GoogleSheetValues {
  spreadsheetId: string;
  range: string;
  majorDimension: 'ROWS' | 'COLUMNS';
  values: string[][];
  rowCount: number;
  columnCount: number;
  observedAt: string;
}

export interface GoogleSelectionResult {
  ids: string[];
  added?: boolean;
  removed?: boolean;
}

export interface GoogleShellApi {
  contractVersion: number;
  getStatus: () => Promise<NativeEnvelope<GoogleConnectionStatus>>;
  connect: () => Promise<NativeEnvelope<GoogleConnectionStatus>>;
  cancel: () => Promise<NativeEnvelope<GoogleConnectionStatus>>;
  disconnect: () => Promise<NativeEnvelope<GoogleConnectionStatus>>;
  listSheets: () => Promise<NativeEnvelope<GoogleSheetsListResult>>;
  addSpreadsheet: (input: string) => Promise<NativeEnvelope<GoogleSelectionResult>>;
  removeSpreadsheet: (id: string) => Promise<NativeEnvelope<GoogleSelectionResult>>;
  readSheet: (request: { id: string; range?: string; majorDimension?: 'ROWS' | 'COLUMNS' }) => Promise<NativeEnvelope<GoogleSheetValues>>;
}
