'use strict';

/**
 * KNOuX Gemini — minimal preload.
 *
 * The renderer receives four fixed read-only capabilities plus window chrome
 * controls. There is no raw ipcRenderer, no generic invoke, no Node, no path or
 * environment access. Channel names mirror shared/native-contract.json; the
 * native contract test checks the mirror.
 */

const { contextBridge, ipcRenderer } = require('electron');

const CONTRACT_VERSION = 1;
const CHANNELS = Object.freeze({
  status: 'knoux:native:v1:status',
  systemSummary: 'knoux:native:v1:system-summary',
  servicesSummary: 'knoux:native:v1:services-summary',
  chooseFolder: 'knoux:native:v1:choose-folder',
  windowControl: 'knoux:window:v1:control',
  studioSources: 'knoux:studio:v1:sources',
  studioSourceChoose: 'knoux:studio:v1:source-choose',
  studioSourceRemove: 'knoux:studio:v1:source-remove',
  studioInventoryScan: 'knoux:studio:v1:inventory-scan',
  studioInventoryCancel: 'knoux:studio:v1:inventory-cancel',
  studioInventoryQuery: 'knoux:studio:v1:inventory-query',
  studioThumbnails: 'knoux:studio:v1:thumbnails',
  studioDestinationChoose: 'knoux:studio:v1:destination-choose',
  studioPlanPreview: 'knoux:studio:v1:plan-preview',
  studioPreviewHistory: 'knoux:studio:v1:preview-history',
  studioEvent: 'knoux:studio:v1:event',
  filesSources: 'knoux:files:v1:sources',
  filesSourceChoose: 'knoux:files:v1:source-choose',
  filesInventoryScan: 'knoux:files:v1:inventory-scan',
  filesInventoryCancel: 'knoux:files:v1:inventory-cancel',
  filesInventoryQuery: 'knoux:files:v1:inventory-query',
  filesThumbnails: 'knoux:files:v1:thumbnails',
  filesOverview: 'knoux:files:v1:overview',
  filesMetadata: 'knoux:files:v1:metadata',
  filesHash: 'knoux:files:v1:hash',
  filesEmptyFolders: 'knoux:files:v1:empty-folders',
  filesOpen: 'knoux:files:v1:open',
  filesReveal: 'knoux:files:v1:reveal',
  storageVolumes: 'knoux:storage:v1:volumes',
  storageHistory: 'knoux:storage:v1:history',
  storageAnalysis: 'knoux:storage:v1:analysis',
  storageDuplicates: 'knoux:storage:v1:duplicates',
  scanCapabilities: 'knoux:scan:v1:capabilities',
  scanSources: 'knoux:scan:v1:sources',
  scanSourceChoose: 'knoux:scan:v1:source-choose',
  scanSourceIndex: 'knoux:scan:v1:source-index',
  scanStart: 'knoux:scan:v1:start',
  scanCancel: 'knoux:scan:v1:cancel',
  scanStatus: 'knoux:scan:v1:status',
  scanHistory: 'knoux:scan:v1:history',
  scanEvent: 'knoux:scan:v1:event',
  appsCapabilities: 'knoux:apps:v1:capabilities',
  appsInventory: 'knoux:apps:v1:inventory',
  appsSignature: 'knoux:apps:v1:signature',
  appsAssociations: 'knoux:apps:v1:associations',
  appsSizes: 'knoux:apps:v1:sizes',
  appsSizesCancel: 'knoux:apps:v1:sizes-cancel',
  appsLeftovers: 'knoux:apps:v1:leftovers',
  appsUpdates: 'knoux:apps:v1:updates',
  appsPlan: 'knoux:apps:v1:plan',
  appsPackages: 'knoux:apps:v1:packages',
  appsOpenSettings: 'knoux:apps:v1:open-settings',
  cleanupCapabilities: 'knoux:cleanup:v1:capabilities',
  cleanupStart: 'knoux:cleanup:v1:start',
  cleanupStatus: 'knoux:cleanup:v1:status',
  cleanupCancel: 'knoux:cleanup:v1:cancel',
  cleanupInventory: 'knoux:cleanup:v1:inventory',
  cleanupEstimate: 'knoux:cleanup:v1:estimate',
  cleanupQuarantine: 'knoux:cleanup:v1:quarantine',
  cleanupUnused: 'knoux:cleanup:v1:unused',
  cleanupPlan: 'knoux:cleanup:v1:plan',
  cleanupSchedule: 'knoux:cleanup:v1:schedule',
  cleanupReport: 'knoux:cleanup:v1:report',
  cleanupOpenSettings: 'knoux:cleanup:v1:open-settings',
  startupCapabilities: 'knoux:startup:v1:capabilities',
  startupStart: 'knoux:startup:v1:start',
  startupStatus: 'knoux:startup:v1:status',
  startupCancel: 'knoux:startup:v1:cancel',
  startupInventory: 'knoux:startup:v1:inventory',
  startupServices: 'knoux:startup:v1:services',
  startupTasks: 'knoux:startup:v1:tasks',
  startupImpact: 'knoux:startup:v1:impact',
  startupJournal: 'knoux:startup:v1:journal',
  startupSessions: 'knoux:startup:v1:sessions',
  startupPlan: 'knoux:startup:v1:plan',
  startupReport: 'knoux:startup:v1:report',
  startupOpenSettings: 'knoux:startup:v1:open-settings',
  systemCapabilities: 'knoux:system:v1:capabilities',
  systemStart: 'knoux:system:v1:start',
  systemStatus: 'knoux:system:v1:status',
  systemCancel: 'knoux:system:v1:cancel',
  systemSnapshot: 'knoux:system:v1:snapshot',
  systemSample: 'knoux:system:v1:sample',
  systemProcesses: 'knoux:system:v1:processes',
  systemEvents: 'knoux:system:v1:events',
  systemSignatures: 'knoux:system:v1:signatures',
  systemDiagnostics: 'knoux:system:v1:diagnostics',
  systemTraceroute: 'knoux:system:v1:traceroute',
  systemHosts: 'knoux:system:v1:hosts',
  systemHostsPlan: 'knoux:system:v1:hosts-plan',
  systemReport: 'knoux:system:v1:report',
  systemOpenSettings: 'knoux:system:v1:open-settings',
  repairCapabilities: 'knoux:repair:v1:capabilities',
  repairStart: 'knoux:repair:v1:start',
  repairStatus: 'knoux:repair:v1:status',
  repairCancel: 'knoux:repair:v1:cancel',
  repairSnapshot: 'knoux:repair:v1:snapshot',
  repairPlan: 'knoux:repair:v1:plan',
  repairJournal: 'knoux:repair:v1:journal',
  repairReport: 'knoux:repair:v1:report',
  repairOpenSettings: 'knoux:repair:v1:open-settings',
  servicesCapabilities: 'knoux:services:v1:capabilities',
  servicesStart: 'knoux:services:v1:start',
  servicesStatus: 'knoux:services:v1:status',
  servicesCancel: 'knoux:services:v1:cancel',
  servicesSnapshot: 'knoux:services:v1:snapshot',
  servicesPlan: 'knoux:services:v1:plan',
  servicesJournal: 'knoux:services:v1:journal',
  servicesReport: 'knoux:services:v1:report',
  automationCapabilities: 'knoux:automation:v1:capabilities',
  automationStart: 'knoux:automation:v1:start',
  automationStatus: 'knoux:automation:v1:status',
  automationCancel: 'knoux:automation:v1:cancel',
  automationSnapshot: 'knoux:automation:v1:snapshot',
  automationWorkflows: 'knoux:automation:v1:workflows',
  automationSave: 'knoux:automation:v1:save',
  automationTemplates: 'knoux:automation:v1:templates',
  automationDryRun: 'knoux:automation:v1:dry-run',
  automationSchedulePreview: 'knoux:automation:v1:schedule-preview',
  automationValidateImport: 'knoux:automation:v1:validate-import',
  automationJournal: 'knoux:automation:v1:journal',
  automationReport: 'knoux:automation:v1:report',
  googleStatus: 'knoux:google:v1:status',
  googleConnect: 'knoux:google:v1:connect',
  googleCancel: 'knoux:google:v1:cancel',
  googleDisconnect: 'knoux:google:v1:disconnect',
  googleSheetsList: 'knoux:google:v1:sheets',
  googleSheetAdd: 'knoux:google:v1:sheet-add',
  googleSheetRemove: 'knoux:google:v1:sheet-remove',
  googleSheetRead: 'knoux:google:v1:sheet-read',
});
const WINDOW_ACTIONS = Object.freeze(['minimize', 'maximize', 'close']);

/* Google Workspace v1 is the only network-capable namespace. It exposes
   named status/connect/cancel/disconnect and bounded Sheets actions; token
   and client-secret material never cross this bridge. */
contextBridge.exposeInMainWorld(
  'knouxGoogleV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    getStatus: () => ipcRenderer.invoke(CHANNELS.googleStatus),
    connect: () => ipcRenderer.invoke(CHANNELS.googleConnect),
    cancel: () => ipcRenderer.invoke(CHANNELS.googleCancel),
    disconnect: () => ipcRenderer.invoke(CHANNELS.googleDisconnect),
    listSheets: () => ipcRenderer.invoke(CHANNELS.googleSheetsList),
    addSpreadsheet: (input) => ipcRenderer.invoke(CHANNELS.googleSheetAdd, { input: String(input || '') }),
    removeSpreadsheet: (id) => ipcRenderer.invoke(CHANNELS.googleSheetRemove, { id: String(id || '') }),
    readSheet: (request) => ipcRenderer.invoke(CHANNELS.googleSheetRead, {
      id: String(request?.id || ''),
      range: typeof request?.range === 'string' ? request.range : undefined,
      majorDimension: request?.majorDimension === 'COLUMNS' ? 'COLUMNS' : 'ROWS',
    }),
  })
);

contextBridge.exposeInMainWorld(
  'knouxShell',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    getStatus: () => ipcRenderer.invoke(CHANNELS.status),
    getSystemSummary: () => ipcRenderer.invoke(CHANNELS.systemSummary),
    getServicesSummary: () => ipcRenderer.invoke(CHANNELS.servicesSummary),
    chooseFolder: () => ipcRenderer.invoke(CHANNELS.chooseFolder),
    windowControl: (action) => {
      if (!WINDOW_ACTIONS.includes(action)) {
        return Promise.resolve({
          contractVersion: CONTRACT_VERSION,
          capability: 'window.control',
          status: 'failed',
          error: { code: 'INVALID_WINDOW_ACTION', message: 'Unsupported window action.', retryable: false },
        });
      }
      return ipcRenderer.invoke(CHANNELS.windowControl, action);
    },
  })
);

/* Studio v1 uses a separate namespace so the platform shell and the Studio
   domain stay independently auditable. All channels are fixed; there is no
   generic invoke and no raw ipcRenderer exposure. */
contextBridge.exposeInMainWorld(
  'knouxStudioV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    listSources: () => ipcRenderer.invoke(CHANNELS.studioSources),
    chooseSource: () => ipcRenderer.invoke(CHANNELS.studioSourceChoose),
    removeSource: (sourceId) => ipcRenderer.invoke(CHANNELS.studioSourceRemove, { sourceId }),
    scanSource: (sourceId) => ipcRenderer.invoke(CHANNELS.studioInventoryScan, { sourceId }),
    cancelScan: (sourceId) => ipcRenderer.invoke(CHANNELS.studioInventoryCancel, { sourceId }),
    query: (request) => ipcRenderer.invoke(CHANNELS.studioInventoryQuery, request),
    thumbnails: (sourceId, fileIds) => ipcRenderer.invoke(CHANNELS.studioThumbnails, { sourceId, fileIds }),
    chooseDestination: () => ipcRenderer.invoke(CHANNELS.studioDestinationChoose),
    previewPlan: (request) => ipcRenderer.invoke(CHANNELS.studioPlanPreview, request),
    previewHistory: () => ipcRenderer.invoke(CHANNELS.studioPreviewHistory),
    onEvent: (callback) => {
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on(CHANNELS.studioEvent, listener);
      return () => ipcRenderer.removeListener(CHANNELS.studioEvent, listener);
    },
  })
);

/* Files v1 is a separate read-only namespace. It exposes no write operation,
   no generic invoke and no raw IPC object. Scan progress is shared with the
   Studio event channel through the Studio namespace. */
contextBridge.exposeInMainWorld(
  'knouxFilesV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    listSources: () => ipcRenderer.invoke(CHANNELS.filesSources),
    chooseSource: () => ipcRenderer.invoke(CHANNELS.filesSourceChoose),
    scanSource: (sourceId) => ipcRenderer.invoke(CHANNELS.filesInventoryScan, { sourceId }),
    cancelScan: (sourceId) => ipcRenderer.invoke(CHANNELS.filesInventoryCancel, { sourceId }),
    query: (request) => ipcRenderer.invoke(CHANNELS.filesInventoryQuery, request),
    thumbnails: (sourceId, fileIds) => ipcRenderer.invoke(CHANNELS.filesThumbnails, { sourceId, fileIds }),
    overview: (sourceId) => ipcRenderer.invoke(CHANNELS.filesOverview, { sourceId }),
    metadata: (sourceId, fileId) => ipcRenderer.invoke(CHANNELS.filesMetadata, { sourceId, fileId }),
    hash: (sourceId, fileId, algorithm) => ipcRenderer.invoke(CHANNELS.filesHash, { sourceId, fileId, algorithm }),
    emptyFolders: (sourceId, limit) => ipcRenderer.invoke(CHANNELS.filesEmptyFolders, { sourceId, limit }),
    open: (sourceId, fileId) => ipcRenderer.invoke(CHANNELS.filesOpen, { sourceId, fileId }),
    reveal: (sourceId, fileId) => ipcRenderer.invoke(CHANNELS.filesReveal, { sourceId, fileId }),
  })
);

/* Storage v1 is a read-only namespace over measured volumes and the same
   authorized inventory used by Files. No cleanup, defrag, TRIM or mutation. */
contextBridge.exposeInMainWorld(
  'knouxStorageV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    volumes: () => ipcRenderer.invoke(CHANNELS.storageVolumes),
    history: () => ipcRenderer.invoke(CHANNELS.storageHistory),
    analysis: (sourceId) => ipcRenderer.invoke(CHANNELS.storageAnalysis, { sourceId }),
    verifyDuplicates: (sourceId) => ipcRenderer.invoke(CHANNELS.storageDuplicates, { sourceId }),
  })
);

/* Smart Scan v1 is a read-only coordinator over the measured Studio, Files,
   Storage and Windows providers. It exposes no delete, move, clean, service,
   startup or registry mutation and no generic invoke. */
contextBridge.exposeInMainWorld(
  'knouxScanV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    capabilities: () => ipcRenderer.invoke(CHANNELS.scanCapabilities),
    listSources: () => ipcRenderer.invoke(CHANNELS.scanSources),
    chooseSource: () => ipcRenderer.invoke(CHANNELS.scanSourceChoose),
    indexSource: (sourceId) => ipcRenderer.invoke(CHANNELS.scanSourceIndex, { sourceId }),
    start: (request) => ipcRenderer.invoke(CHANNELS.scanStart, request),
    cancel: (sessionId) => ipcRenderer.invoke(CHANNELS.scanCancel, { sessionId }),
    status: (sessionId) => ipcRenderer.invoke(CHANNELS.scanStatus, { sessionId }),
    history: () => ipcRenderer.invoke(CHANNELS.scanHistory),
    onEvent: (callback) => {
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on(CHANNELS.scanEvent, listener);
      return () => ipcRenderer.removeListener(CHANNELS.scanEvent, listener);
    },
  })
);

/* Applications v1 exposes only the measured software services and fixed,
   read-only operations. There is no uninstall, install, update, association
   write or generic invoke channel. */
contextBridge.exposeInMainWorld(
  'knouxAppsV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    capabilities: () => ipcRenderer.invoke(CHANNELS.appsCapabilities),
    inventory: () => ipcRenderer.invoke(CHANNELS.appsInventory),
    signature: (appId) => ipcRenderer.invoke(CHANNELS.appsSignature, { appId }),
    associations: () => ipcRenderer.invoke(CHANNELS.appsAssociations),
    sizes: (request) => ipcRenderer.invoke(CHANNELS.appsSizes, request),
    cancelSizes: (operationId) => ipcRenderer.invoke(CHANNELS.appsSizesCancel, { operationId }),
    leftovers: () => ipcRenderer.invoke(CHANNELS.appsLeftovers),
    updates: (request) => ipcRenderer.invoke(CHANNELS.appsUpdates, request),
    plan: (request) => ipcRenderer.invoke(CHANNELS.appsPlan, request),
    packages: (request) => ipcRenderer.invoke(CHANNELS.appsPackages, request),
    openSettings: (target) => ipcRenderer.invoke(CHANNELS.appsOpenSettings, { target }),
  })
);

/* Cleanup v1 is a read-only Clean Room coordinator. Destructive actions do
   not exist here: plans are review-only and every execution is gated. */
contextBridge.exposeInMainWorld(
  'knouxCleanupV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    capabilities: () => ipcRenderer.invoke(CHANNELS.cleanupCapabilities),
    start: (request) => ipcRenderer.invoke(CHANNELS.cleanupStart, request),
    status: (sessionId) => ipcRenderer.invoke(CHANNELS.cleanupStatus, { sessionId }),
    cancel: (sessionId) => ipcRenderer.invoke(CHANNELS.cleanupCancel, { sessionId }),
    inventory: () => ipcRenderer.invoke(CHANNELS.cleanupInventory),
    estimate: () => ipcRenderer.invoke(CHANNELS.cleanupEstimate),
    quarantine: () => ipcRenderer.invoke(CHANNELS.cleanupQuarantine),
    unused: (request) => ipcRenderer.invoke(CHANNELS.cleanupUnused, request),
    plan: (request) => ipcRenderer.invoke(CHANNELS.cleanupPlan, request),
    schedule: (request) => ipcRenderer.invoke(CHANNELS.cleanupSchedule, request),
    report: () => ipcRenderer.invoke(CHANNELS.cleanupReport),
    openSettings: (target) => ipcRenderer.invoke(CHANNELS.cleanupOpenSettings, { target }),
  })
);

/* Startup v1 is a read-only Boot Control coordinator. Enable/disable/delay,
   restoration, journal writes and service policy changes do not exist here:
   plans are review-only and every execution is gated. */
contextBridge.exposeInMainWorld(
  'knouxStartupV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    capabilities: () => ipcRenderer.invoke(CHANNELS.startupCapabilities),
    start: (request) => ipcRenderer.invoke(CHANNELS.startupStart, request),
    status: (sessionId) => ipcRenderer.invoke(CHANNELS.startupStatus, { sessionId }),
    cancel: (sessionId) => ipcRenderer.invoke(CHANNELS.startupCancel, { sessionId }),
    inventory: () => ipcRenderer.invoke(CHANNELS.startupInventory),
    services: () => ipcRenderer.invoke(CHANNELS.startupServices),
    tasks: () => ipcRenderer.invoke(CHANNELS.startupTasks),
    impact: () => ipcRenderer.invoke(CHANNELS.startupImpact),
    journal: () => ipcRenderer.invoke(CHANNELS.startupJournal),
    sessions: () => ipcRenderer.invoke(CHANNELS.startupSessions),
    plan: (request) => ipcRenderer.invoke(CHANNELS.startupPlan, request),
    report: () => ipcRenderer.invoke(CHANNELS.startupReport),
    openSettings: (target) => ipcRenderer.invoke(CHANNELS.startupOpenSettings, { target }),
  })
);

/* System v1 is a read-only Live Pulse observatory. Process termination,
   service control, hosts writes, proxy changes, adapter resets, driver
   changes and power actions do not exist here: only measured reads, bounded
   diagnostics and review-only plans are exposed. */
contextBridge.exposeInMainWorld(
  'knouxSystemV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    capabilities: () => ipcRenderer.invoke(CHANNELS.systemCapabilities),
    start: () => ipcRenderer.invoke(CHANNELS.systemStart),
    status: (sessionId) => ipcRenderer.invoke(CHANNELS.systemStatus, { sessionId }),
    cancel: (sessionId) => ipcRenderer.invoke(CHANNELS.systemCancel, { sessionId }),
    snapshot: () => ipcRenderer.invoke(CHANNELS.systemSnapshot),
    sample: () => ipcRenderer.invoke(CHANNELS.systemSample),
    processes: () => ipcRenderer.invoke(CHANNELS.systemProcesses),
    events: (query) => ipcRenderer.invoke(CHANNELS.systemEvents, query || {}),
    signatures: (paths) => ipcRenderer.invoke(CHANNELS.systemSignatures, { paths }),
    diagnostics: (request) => ipcRenderer.invoke(CHANNELS.systemDiagnostics, request),
    traceroute: (request) => ipcRenderer.invoke(CHANNELS.systemTraceroute, request),
    hosts: () => ipcRenderer.invoke(CHANNELS.systemHosts),
    hostsPlan: (draft) => ipcRenderer.invoke(CHANNELS.systemHostsPlan, draft),
    report: (options) => ipcRenderer.invoke(CHANNELS.systemReport, options || {}),
    openSettings: (target) => ipcRenderer.invoke(CHANNELS.systemOpenSettings, { target }),
  })
);

/* Repair v1 is the read-only Recovery Lab. DISM, SFC, DNS/Winsock/TCPIP
   reset, restore and update servicing have no execution channel. Plans are
   immutable previews and the journal is local to the application profile. */
contextBridge.exposeInMainWorld(
  'knouxRepairV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    capabilities: () => ipcRenderer.invoke(CHANNELS.repairCapabilities),
    start: () => ipcRenderer.invoke(CHANNELS.repairStart),
    status: (sessionId) => ipcRenderer.invoke(CHANNELS.repairStatus, { sessionId }),
    cancel: (sessionId) => ipcRenderer.invoke(CHANNELS.repairCancel, { sessionId }),
    snapshot: () => ipcRenderer.invoke(CHANNELS.repairSnapshot),
    plan: (toolIds) => ipcRenderer.invoke(CHANNELS.repairPlan, toolIds),
    journal: () => ipcRenderer.invoke(CHANNELS.repairJournal),
    report: (options) => ipcRenderer.invoke(CHANNELS.repairReport, options || {}),
    openSettings: (target) => ipcRenderer.invoke(CHANNELS.repairOpenSettings, { target }),
  })
);

/* Services v1 is the read-only Service Commander. Start/stop/restart and
   startup-policy changes have no execution channel; plans are immutable
   previews and the journal is local to the application profile. */
contextBridge.exposeInMainWorld(
  'knouxServicesV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    capabilities: () => ipcRenderer.invoke(CHANNELS.servicesCapabilities),
    start: () => ipcRenderer.invoke(CHANNELS.servicesStart),
    status: (sessionId) => ipcRenderer.invoke(CHANNELS.servicesStatus, { sessionId }),
    cancel: (sessionId) => ipcRenderer.invoke(CHANNELS.servicesCancel, { sessionId }),
    snapshot: () => ipcRenderer.invoke(CHANNELS.servicesSnapshot),
    plan: (request) => ipcRenderer.invoke(CHANNELS.servicesPlan, request),
    journal: () => ipcRenderer.invoke(CHANNELS.servicesJournal),
    report: (options) => ipcRenderer.invoke(CHANNELS.servicesReport, options || {}),
  })
);

/* Automation v1 is Flow Studio: local versioned workflow drafts, validation,
   dry-runs and schedule previews. There is no executor, scheduler timer,
   external notification, file copy or privileged action. */
contextBridge.exposeInMainWorld(
  'knouxAutomationV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    capabilities: () => ipcRenderer.invoke(CHANNELS.automationCapabilities),
    start: () => ipcRenderer.invoke(CHANNELS.automationStart),
    status: (sessionId) => ipcRenderer.invoke(CHANNELS.automationStatus, { sessionId }),
    cancel: (sessionId) => ipcRenderer.invoke(CHANNELS.automationCancel, { sessionId }),
    snapshot: () => ipcRenderer.invoke(CHANNELS.automationSnapshot),
    workflows: () => ipcRenderer.invoke(CHANNELS.automationWorkflows),
    save: (workflow) => ipcRenderer.invoke(CHANNELS.automationSave, workflow),
    templates: () => ipcRenderer.invoke(CHANNELS.automationTemplates),
    dryRun: (workflow) => ipcRenderer.invoke(CHANNELS.automationDryRun, workflow),
    schedulePreview: (spec) => ipcRenderer.invoke(CHANNELS.automationSchedulePreview, spec),
    validateImport: (payload) => ipcRenderer.invoke(CHANNELS.automationValidateImport, payload),
    journal: () => ipcRenderer.invoke(CHANNELS.automationJournal),
    report: (options) => ipcRenderer.invoke(CHANNELS.automationReport, options || {}),
  })
);

/* Fixed live-operation endpoints. Never exposes paths, shell, or generic IPC. */
contextBridge.exposeInMainWorld('knouxOperationsV1', Object.freeze({
  contractVersion: 1,
  chooseSource: (request) => ipcRenderer.invoke('knoux:operations:v1:chooseSource', ...(request === undefined ? [] : [request])),
  chooseDestination: (request) => ipcRenderer.invoke('knoux:operations:v1:chooseDestination', ...(request === undefined ? [] : [request])),
  scan: (request) => ipcRenderer.invoke('knoux:operations:v1:scan', ...(request === undefined ? [] : [request])),
  plan: (request) => ipcRenderer.invoke('knoux:operations:v1:plan', ...(request === undefined ? [] : [request])),
  execute: (request) => ipcRenderer.invoke('knoux:operations:v1:execute', ...(request === undefined ? [] : [request])),
  cancel: (request) => ipcRenderer.invoke('knoux:operations:v1:cancel', ...(request === undefined ? [] : [request])),
  history: (request) => ipcRenderer.invoke('knoux:operations:v1:history', ...(request === undefined ? [] : [request])),
  undoPreview: (request) => ipcRenderer.invoke('knoux:operations:v1:undoPreview', ...(request === undefined ? [] : [request])),
  undo: (request) => ipcRenderer.invoke('knoux:operations:v1:undo', ...(request === undefined ? [] : [request])),
  revoke: (request) => ipcRenderer.invoke('knoux:operations:v1:revoke', ...(request === undefined ? [] : [request])),
  onEvent: callback => { const listener=(_event,payload)=>callback(payload); ipcRenderer.on('knoux:operations:v1:event',listener); return ()=>ipcRenderer.removeListener('knoux:operations:v1:event',listener); },
}));
