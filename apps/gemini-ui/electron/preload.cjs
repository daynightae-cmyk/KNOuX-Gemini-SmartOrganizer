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
});
const WINDOW_ACTIONS = Object.freeze(['minimize', 'maximize', 'close']);

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
