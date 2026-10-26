'use strict';

/**
 * KNOuX Gemini — minimal, secure Windows desktop shell.
 *
 * This entrypoint is deliberately separate from the repository root Electron
 * entrypoint: it loads the Gemini renderer (never the legacy root renderer) and
 * exposes only the versioned, read-only platform capabilities. Section engines
 * remain preview-only until their own missions land.
 */

const { app, BrowserWindow, Menu, ipcMain, session, dialog, nativeImage, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const crypto = require('node:crypto');
const contract = require('../shared/native-contract.json');
const appPackage = require('../package.json');
const {
  readSystemSummary,
  readServicesSummary,
  chooseFolder,
  fixturesEnabled,
  loadProvider,
} = require('./native/provider-bridge.cjs');
const { StudioBridge } = require('./native/studio-bridge.cjs');
const { FilesBridge } = require('./native/files-bridge.cjs');
const { StorageBridge } = require('./native/storage-bridge.cjs');
const { ScanBridge } = require('./native/scan-bridge.cjs');
const { AppBridge } = require('./native/app-bridge.cjs');
const { CleanupBridge } = require('./native/cleanup-bridge.cjs');
const {
  ok,
  fail,
  assertTrustedSender,
  assertNoArguments,
  assertWindowAction,
  hardenWebContents,
  applyPackagedCsp,
} = require('./native/security.cjs');

const argv = process.argv.slice(1);
const argValue = (name) => {
  const prefix = `${name}=`;
  const match = argv.find((entry) => entry.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
};

const isDev = argv.includes('--dev') || process.env.KNOUX_GEMINI_DEV === '1';
const devOrigin = process.env.KNOUX_GEMINI_DEV_URL || 'http://127.0.0.1:3000';
const distRoot = path.join(__dirname, '..', 'dist');
const preloadPath = path.join(__dirname, 'preload.cjs');
const smokeReceiptPath = argValue('--knoux-native-smoke');
const smokeShotPath = argValue('--knoux-native-smoke-shot');
const smokeUserData = argValue('--knoux-user-data');
const isSmoke = Boolean(smokeReceiptPath);
const tracePath = smokeReceiptPath ? `${smokeReceiptPath}.trace.log` : null;

function trace(message) {
  if (!tracePath) return;
  try {
    fs.mkdirSync(path.dirname(tracePath), { recursive: true });
    fs.appendFileSync(tracePath, `${new Date().toISOString()} ${message}\n`, 'utf8');
  } catch {
    // Trace failures must never affect the app.
  }
}

if (smokeUserData) {
  try {
    fs.mkdirSync(smokeUserData, { recursive: true });
    app.setPath('userData', smokeUserData);
    trace(`userData set to ${smokeUserData}`);
  } catch (error) {
    trace(`userData setup failed: ${error?.message || error}`);
    // A temp profile failure is reported by the smoke receipt rather than
    // silently falling back to a real user profile.
  }
}
trace(`bootstrap isSmoke=${isSmoke} isDev=${isDev} packaged=${app.isPackaged} cwd=${process.cwd()}`);

app.commandLine.appendSwitch('force-color-profile', 'srgb');

let mainWindow = null;
let ipcRegistered = false;
let studioBridge = null;
let filesBridge = null;
let storageBridge = null;
let scanBridge = null;
let appBridge = null;
let cleanupBridge = null;

if (!isSmoke && !app.requestSingleInstanceLock()) {
  app.quit();
} else if (!isSmoke) {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function bridgeStatusData() {
  const packagedFixtureBlocked = app.isPackaged && process.env.KNOUX_NATIVE_FIXTURES === '1';
  const fixture = fixturesEnabled({ isPackaged: app.isPackaged, env: process.env });
  const windows = process.platform === 'win32';
  const capabilities = Object.values(contract.capabilities).map((capability) => ({
    ...capability,
    status: capability.id === 'folder.choose' ? 'available' : windows ? 'available' : 'unsupported',
    ...(fixture ? { detail: 'Development fixture mode — no measured reading' } : {}),
  }));
  return {
    contractVersion: contract.contractVersion,
    requestId: crypto.randomUUID(),
    capability: 'bridge.status',
    status: 'available',
    source: 'KNOuX Gemini Electron main',
    observedAt: new Date().toISOString(),
    permission: 'read-only',
    warnings: [
      ...(fixture ? ['Development fixture mode is active. Values are not measured.'] : []),
      ...(packagedFixtureBlocked ? ['KNOUX_NATIVE_FIXTURES was ignored in the packaged application.'] : []),
      ...(!windows ? ['This platform is not Windows; Windows CIM capabilities are unsupported.'] : []),
    ],
    provenance: {
      provider: 'Electron main process',
      mode: fixture ? 'fixture' : windows ? 'measured' : 'unavailable',
      observedAt: new Date().toISOString(),
      coverage: 'full',
      permissions: ['read-only'],
      warnings: [],
    },
    data: {
      bridge: 'ready',
      platform: process.platform,
      appVersion: appPackage.version,
      packaged: app.isPackaged,
      providerMode: fixture ? 'fixture' : windows ? 'measured' : 'unavailable',
      fixtureEnabled: fixture,
      capabilities,
      contractVersion: contract.contractVersion,
      electronVersion: process.versions.electron,
    },
  };
}

function convertProviderResult(capability, result) {
  if (result?.error && !result?.data) {
    return fail({
      capability,
      status: result.status || 'failed',
      source: result.source,
      observedAt: result.observedAt,
      permission: result.permission,
      warnings: result.warnings,
      error: result.error,
    });
  }
  return ok({
    capability,
    status: result?.status || 'complete',
    source: result?.source,
    observedAt: result?.observedAt,
    permission: result?.permission,
    warnings: result?.warnings,
    provenance: result?.provenance,
    data: result?.data,
  });
}

function registerIpc() {
  if (ipcRegistered) return;
  ipcRegistered = true;

  const guard = async (event, capability, args, work) => {
    try {
      assertTrustedSender(event, {
        mainWindow,
        isDev,
        distRoot,
        devOrigin,
      });
      return await work(args);
    } catch (error) {
      const permission = error?.code === 'UNTRUSTED_SENDER' ? 'not-granted' : 'read-only';
      const status = error?.code === 'UNTRUSTED_SENDER' ? 'permission_denied' : 'failed';
      return fail({
        capability,
        status,
        source: 'native bridge',
        permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'NATIVE_ERROR',
          message:
            error?.code === 'UNTRUSTED_SENDER'
              ? 'The native request did not originate from the trusted application window.'
              : 'The native request was rejected at the security boundary.',
          retryable: false,
        },
      });
    }
  };

  ipcMain.handle(contract.channels.status, (event, ...args) =>
    guard(event, 'bridge.status', args, async (callArgs) => {
      assertNoArguments(callArgs, 'bridge.status');
      return bridgeStatusData();
    })
  );

  ipcMain.handle(contract.channels.systemSummary, (event, ...args) =>
    guard(event, 'system.summary', args, async (callArgs) => {
      assertNoArguments(callArgs, 'system.summary');
      const result = await readSystemSummary({ isPackaged: app.isPackaged, env: process.env });
      return convertProviderResult('system.summary', result);
    })
  );

  ipcMain.handle(contract.channels.servicesSummary, (event, ...args) =>
    guard(event, 'services.summary', args, async (callArgs) => {
      assertNoArguments(callArgs, 'services.summary');
      const result = await readServicesSummary({ isPackaged: app.isPackaged, env: process.env });
      return convertProviderResult('services.summary', result);
    })
  );

  ipcMain.handle(contract.channels.chooseFolder, (event, ...args) =>
    guard(event, 'folder.choose', args, async (callArgs) => {
      assertNoArguments(callArgs, 'folder.choose');
      const result = await chooseFolder({
        isPackaged: app.isPackaged,
        env: process.env,
        parentWindow: mainWindow,
      });
      return convertProviderResult('folder.choose', result);
    })
  );

  const studioGuard = async (event, capability, permission, work) => {
    try {
      assertTrustedSender(event, { mainWindow, isDev, distRoot, devOrigin });
      if (!studioBridge) {
        throw Object.assign(new Error('The read-only Studio adapter is not initialized.'), { code: 'STUDIO_UNAVAILABLE' });
      }
      const data = await work();
      return ok({
        capability,
        status: 'complete',
        source: 'KNOuX Studio read-only adapter',
        permission,
        data,
      });
    } catch (error) {
      const untrusted = error?.code === 'UNTRUSTED_SENDER';
      return fail({
        capability,
        status: untrusted ? 'permission_denied' : error?.code === 'STUDIO_DESTINATION_REQUIRED' ? 'permission_denied' : 'failed',
        source: 'KNOuX Studio read-only adapter',
        permission: untrusted ? 'not-granted' : permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'STUDIO_FAILURE',
          message: String(error?.message || 'Studio request failed.').replace(/\s+/g, ' ').slice(0, 300),
          retryable: false,
        },
      });
    }
  };
  const studioArg = (args) => {
    if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
      throw Object.assign(new Error('A single structured Studio request is required.'), { code: 'STUDIO_INPUT_INVALID' });
    }
    return args[0];
  };

  ipcMain.handle(contract.channels.studioSources, (event) =>
    studioGuard(event, 'studio.sources', 'read-only', () => studioBridge.listSources())
  );
  ipcMain.handle(contract.channels.studioSourceChoose, (event) =>
    studioGuard(event, 'studio.source.choose', 'user-initiated', () => studioBridge.chooseSource())
  );
  ipcMain.handle(contract.channels.studioSourceRemove, (event, ...args) =>
    studioGuard(event, 'studio.source.remove', 'user-initiated', () => studioBridge.removeSource(studioArg(args).sourceId))
  );
  ipcMain.handle(contract.channels.studioInventoryScan, (event, ...args) =>
    studioGuard(event, 'studio.inventory.scan', 'read-only', () => studioBridge.scanSource(studioArg(args).sourceId))
  );
  ipcMain.handle(contract.channels.studioInventoryCancel, (event, ...args) =>
    studioGuard(event, 'studio.inventory.cancel', 'user-initiated', () => studioBridge.cancelScan(studioArg(args).sourceId))
  );
  ipcMain.handle(contract.channels.studioInventoryQuery, (event, ...args) =>
    studioGuard(event, 'studio.inventory.query', 'read-only', () => studioBridge.query(studioArg(args)))
  );
  ipcMain.handle(contract.channels.studioThumbnails, (event, ...args) => {
    const request = studioArg(args);
    return studioGuard(event, 'studio.thumbnails', 'read-only', () => studioBridge.thumbnails(request.sourceId, request.fileIds));
  });
  ipcMain.handle(contract.channels.studioDestinationChoose, (event) =>
    studioGuard(event, 'studio.destination.choose', 'user-initiated', () => studioBridge.chooseDestination())
  );
  ipcMain.handle(contract.channels.studioPlanPreview, (event, ...args) =>
    studioGuard(event, 'studio.plan.preview', 'read-only', () => studioBridge.previewPlan(studioArg(args)))
  );
  ipcMain.handle(contract.channels.studioPreviewHistory, (event) =>
    studioGuard(event, 'studio.preview.history', 'read-only', () => studioBridge.previewHistory())
  );


  const filesGuard = async (event, capability, permission, work) => {
    try {
      assertTrustedSender(event, { mainWindow, isDev, distRoot, devOrigin });
      if (!filesBridge) {
        throw Object.assign(new Error('The read-only Files adapter is not initialized.'), { code: 'FILES_UNAVAILABLE' });
      }
      const data = await work();
      return ok({
        capability,
        status: 'complete',
        source: 'KNOuX Files read-only adapter',
        permission,
        data,
      });
    } catch (error) {
      const untrusted = error?.code === 'UNTRUSTED_SENDER';
      return fail({
        capability,
        status: untrusted ? 'permission_denied' : 'failed',
        source: 'KNOuX Files read-only adapter',
        permission: untrusted ? 'not-granted' : permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'FILES_FAILURE',
          message: String(error?.message || 'Files request failed.').replace(/\s+/g, ' ').slice(0, 300),
          retryable: false,
        },
      });
    }
  };
  const filesArg = (args) => {
    if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
      throw Object.assign(new Error('A single structured Files request is required.'), { code: 'FILES_INPUT_INVALID' });
    }
    return args[0];
  };

  ipcMain.handle(contract.channels.filesSources, (event, ...args) =>
    filesGuard(event, 'files.sources', 'read-only', () => {
      assertNoArguments(args, contract.channels.filesSources);
      return filesBridge.listSources();
    })
  );
  ipcMain.handle(contract.channels.filesSourceChoose, (event, ...args) =>
    filesGuard(event, 'files.source.choose', 'user-initiated', () => {
      assertNoArguments(args, contract.channels.filesSourceChoose);
      return filesBridge.chooseSource();
    })
  );
  ipcMain.handle(contract.channels.filesInventoryScan, (event, ...args) =>
    filesGuard(event, 'files.inventory.scan', 'read-only', () => filesBridge.scanSource(filesArg(args).sourceId))
  );
  ipcMain.handle(contract.channels.filesInventoryCancel, (event, ...args) =>
    filesGuard(event, 'files.inventory.cancel', 'user-initiated', () => filesBridge.cancelScan(filesArg(args).sourceId))
  );
  ipcMain.handle(contract.channels.filesInventoryQuery, (event, ...args) =>
    filesGuard(event, 'files.inventory.query', 'read-only', () => {
      const request = filesArg(args);
      return filesBridge.query(request.sourceId, request);
    })
  );
  ipcMain.handle(contract.channels.filesThumbnails, (event, ...args) =>
    filesGuard(event, 'files.thumbnails', 'read-only', () => {
      const request = filesArg(args);
      return filesBridge.thumbnails(request.sourceId, request.fileIds);
    })
  );
  ipcMain.handle(contract.channels.filesOverview, (event, ...args) =>
    filesGuard(event, 'files.overview', 'read-only', () => filesBridge.overview(filesArg(args).sourceId))
  );
  ipcMain.handle(contract.channels.filesMetadata, (event, ...args) =>
    filesGuard(event, 'files.metadata', 'read-only', () => {
      const request = filesArg(args);
      return filesBridge.metadata(request.sourceId, request.fileId);
    })
  );
  ipcMain.handle(contract.channels.filesHash, (event, ...args) =>
    filesGuard(event, 'files.hash', 'read-only', () => {
      const request = filesArg(args);
      return filesBridge.hash(request.sourceId, request.fileId, request.algorithm);
    })
  );
  ipcMain.handle(contract.channels.filesEmptyFolders, (event, ...args) =>
    filesGuard(event, 'files.emptyFolders', 'read-only', () => {
      const request = filesArg(args);
      return filesBridge.emptyFolders(request.sourceId, request.limit);
    })
  );
  ipcMain.handle(contract.channels.filesOpen, (event, ...args) =>
    filesGuard(event, 'files.open', 'user-initiated', () => {
      const request = filesArg(args);
      return filesBridge.open(request.sourceId, request.fileId);
    })
  );
  ipcMain.handle(contract.channels.filesReveal, (event, ...args) =>
    filesGuard(event, 'files.reveal', 'user-initiated', () => {
      const request = filesArg(args);
      return filesBridge.reveal(request.sourceId, request.fileId);
    })
  );


  const storageGuard = async (event, capability, permission, work) => {
    try {
      assertTrustedSender(event, { mainWindow, isDev, distRoot, devOrigin });
      if (!storageBridge) {
        throw Object.assign(new Error('The read-only Storage adapter is not initialized.'), { code: 'STORAGE_UNAVAILABLE' });
      }
      const data = await work();
      return ok({
        capability,
        status: 'complete',
        source: 'KNOuX Storage read-only adapter',
        permission,
        data,
      });
    } catch (error) {
      const untrusted = error?.code === 'UNTRUSTED_SENDER';
      return fail({
        capability,
        status: untrusted ? 'permission_denied' : 'failed',
        source: 'KNOuX Storage read-only adapter',
        permission: untrusted ? 'not-granted' : permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'STORAGE_FAILURE',
          message: String(error?.message || 'Storage request failed.').replace(/\s+/g, ' ').slice(0, 300),
          retryable: false,
        },
      });
    }
  };
  const storageArg = (args) => {
    if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
      throw Object.assign(new Error('A single structured Storage request is required.'), { code: 'STORAGE_INPUT_INVALID' });
    }
    return args[0];
  };

  ipcMain.handle(contract.channels.storageVolumes, (event, ...args) =>
    storageGuard(event, 'storage.volumes', 'read-only', () => {
      assertNoArguments(args, contract.channels.storageVolumes);
      return storageBridge.volumes();
    })
  );
  ipcMain.handle(contract.channels.storageHistory, (event, ...args) =>
    storageGuard(event, 'storage.history', 'read-only', () => {
      assertNoArguments(args, contract.channels.storageHistory);
      return storageBridge.history();
    })
  );
  ipcMain.handle(contract.channels.storageAnalysis, (event, ...args) =>
    storageGuard(event, 'storage.analysis', 'read-only', () => storageBridge.analysis(storageArg(args).sourceId))
  );
  ipcMain.handle(contract.channels.storageDuplicates, (event, ...args) =>
    storageGuard(event, 'storage.duplicates.verify', 'read-only', () => storageBridge.verifyDuplicates(storageArg(args).sourceId))
  );


  const scanGuard = async (event, capability, permission, work) => {
    try {
      assertTrustedSender(event, { mainWindow, isDev, distRoot, devOrigin });
      if (!scanBridge) {
        throw Object.assign(new Error('The read-only Smart Scan coordinator is not initialized.'), { code: 'SCAN_UNAVAILABLE' });
      }
      const data = await work();
      return ok({
        capability,
        status: 'complete',
        source: 'KNOuX Smart Scan read-only coordinator',
        permission,
        data,
      });
    } catch (error) {
      const untrusted = error?.code === 'UNTRUSTED_SENDER';
      return fail({
        capability,
        status: untrusted ? 'permission_denied' : 'failed',
        source: 'KNOuX Smart Scan read-only coordinator',
        permission: untrusted ? 'not-granted' : permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'SCAN_FAILURE',
          message: String(error?.message || 'Smart Scan request failed.').replace(/\s+/g, ' ').slice(0, 300),
          retryable: false,
        },
      });
    }
  };
  const scanArg = (args) => {
    if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
      throw Object.assign(new Error('A single structured Smart Scan request is required.'), { code: 'SCAN_INPUT_INVALID' });
    }
    return args[0];
  };

  ipcMain.handle(contract.channels.scanCapabilities, (event, ...args) =>
    scanGuard(event, 'scan.capabilities', 'read-only', () => {
      assertNoArguments(args, contract.channels.scanCapabilities);
      return scanBridge.capabilities();
    })
  );
  ipcMain.handle(contract.channels.scanSources, (event, ...args) =>
    scanGuard(event, 'scan.sources', 'read-only', () => {
      assertNoArguments(args, contract.channels.scanSources);
      return scanBridge.listSources();
    })
  );
  ipcMain.handle(contract.channels.scanSourceChoose, (event, ...args) =>
    scanGuard(event, 'scan.source.choose', 'user-initiated', () => {
      assertNoArguments(args, contract.channels.scanSourceChoose);
      return scanBridge.chooseSource();
    })
  );
  ipcMain.handle(contract.channels.scanSourceIndex, (event, ...args) =>
    scanGuard(event, 'scan.source.index', 'read-only', () => {
      const request = scanArg(args);
      return scanBridge.indexSource(request.sourceId);
    })
  );
  ipcMain.handle(contract.channels.scanStart, (event, ...args) =>
    scanGuard(event, 'scan.start', 'read-only', () => scanBridge.start(scanArg(args)))
  );
  ipcMain.handle(contract.channels.scanCancel, (event, ...args) =>
    scanGuard(event, 'scan.cancel', 'user-initiated', () => scanBridge.cancel(scanArg(args).sessionId))
  );
  ipcMain.handle(contract.channels.scanStatus, (event, ...args) =>
    scanGuard(event, 'scan.status', 'read-only', () => scanBridge.status(scanArg(args).sessionId))
  );
  ipcMain.handle(contract.channels.scanHistory, (event, ...args) =>
    scanGuard(event, 'scan.history', 'read-only', () => {
      assertNoArguments(args, contract.channels.scanHistory);
      return scanBridge.history();
    })
  );

  const APP_ID = /^[a-f0-9]{20}$/;
  const APP_OPERATION_ID = /^[A-Za-z0-9_-]{8,64}$/;
  const appsGuard = async (event, capability, permission, work) => {
    try {
      assertTrustedSender(event, { mainWindow, isDev, distRoot, devOrigin });
      if (!appBridge) {
        throw Object.assign(new Error('The read-only Applications coordinator is not initialized.'), { code: 'APPS_UNAVAILABLE' });
      }
      const data = await work();
      return ok({
        capability,
        status: 'complete',
        source: 'KNOuX Applications read-only coordinator',
        permission,
        data,
      });
    } catch (error) {
      const untrusted = error?.code === 'UNTRUSTED_SENDER';
      return fail({
        capability,
        status: untrusted ? 'permission_denied' : 'failed',
        source: 'KNOuX Applications read-only coordinator',
        permission: untrusted ? 'not-granted' : permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'APPS_FAILURE',
          message: String(error?.message || 'Applications request failed.').replace(/\s+/g, ' ').slice(0, 300),
          retryable: Boolean(error?.retryable),
        },
      });
    }
  };
  const appsRequest = (args, code = 'APPS_INPUT_INVALID') => {
    if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
      throw Object.assign(new Error('A single structured Applications request is required.'), { code });
    }
    return args[0];
  };
  const appIdsFrom = (request, code) => {
    const ids = Array.isArray(request.appIds) ? request.appIds : null;
    if (!ids || ids.length < 1 || ids.length > 50 || !ids.every((id) => typeof id === 'string' && APP_ID.test(id))) {
      throw Object.assign(new Error('Between 1 and 50 measured application identifiers are required.'), { code });
    }
    return ids;
  };

  ipcMain.handle(contract.channels.appsCapabilities, (event, ...args) =>
    appsGuard(event, 'apps.capabilities', 'read-only', () => {
      assertNoArguments(args, contract.channels.appsCapabilities);
      return appBridge.capabilities();
    })
  );
  ipcMain.handle(contract.channels.appsInventory, (event, ...args) =>
    appsGuard(event, 'apps.inventory', 'read-only', () => {
      assertNoArguments(args, contract.channels.appsInventory);
      return appBridge.inventory();
    })
  );
  ipcMain.handle(contract.channels.appsSignature, (event, ...args) =>
    appsGuard(event, 'apps.signature', 'read-only', () => {
      const request = appsRequest(args);
      if (typeof request.appId !== 'string' || !APP_ID.test(request.appId)) {
        throw Object.assign(new Error('A valid application identifier is required.'), { code: 'APP_ID_INVALID' });
      }
      return appBridge.signature(request.appId);
    })
  );
  ipcMain.handle(contract.channels.appsAssociations, (event, ...args) =>
    appsGuard(event, 'apps.associations', 'read-only', () => {
      assertNoArguments(args, contract.channels.appsAssociations);
      return appBridge.associations();
    })
  );
  ipcMain.handle(contract.channels.appsSizes, (event, ...args) =>
    appsGuard(event, 'apps.sizes', 'read-only', () => {
      const request = appsRequest(args);
      const appIds = appIdsFrom(request, 'APP_SIZE_SELECTION_INVALID').slice(0, 40);
      if (typeof request.operationId !== 'string' || !APP_OPERATION_ID.test(request.operationId)) {
        throw Object.assign(new Error('A valid operation identifier is required.'), { code: 'APP_OPERATION_INVALID' });
      }
      return appBridge.sizes({ appIds, operationId: request.operationId });
    })
  );
  ipcMain.handle(contract.channels.appsSizesCancel, (event, ...args) =>
    appsGuard(event, 'apps.sizes.cancel', 'user-initiated', () => {
      const request = appsRequest(args);
      if (typeof request.operationId !== 'string' || !APP_OPERATION_ID.test(request.operationId)) {
        throw Object.assign(new Error('A valid operation identifier is required.'), { code: 'APP_OPERATION_INVALID' });
      }
      return appBridge.cancelSizes(request.operationId);
    })
  );
  ipcMain.handle(contract.channels.appsLeftovers, (event, ...args) =>
    appsGuard(event, 'apps.leftovers', 'read-only', () => {
      assertNoArguments(args, contract.channels.appsLeftovers);
      return appBridge.leftovers();
    })
  );
  ipcMain.handle(contract.channels.appsUpdates, (event, ...args) =>
    appsGuard(event, 'apps.updates', 'read-only', () => {
      const request = appsRequest(args);
      if (typeof request.check !== 'boolean') {
        throw Object.assign(new Error('A boolean check flag is required.'), { code: 'APP_UPDATES_INPUT_INVALID' });
      }
      return appBridge.updates({ check: request.check });
    })
  );
  ipcMain.handle(contract.channels.appsPlan, (event, ...args) =>
    appsGuard(event, 'apps.plan', 'read-only', () => {
      const request = appsRequest(args);
      return appBridge.plan({ appIds: appIdsFrom(request, 'APP_PLAN_INPUT_INVALID') });
    })
  );
  ipcMain.handle(contract.channels.appsPackages, (event, ...args) =>
    appsGuard(event, 'apps.packages', 'read-only', () => {
      const request = appsRequest(args);
      if (request.tab !== 'installed' && request.tab !== 'discover') {
        throw Object.assign(new Error('The package tab must be installed or discover.'), { code: 'APP_PACKAGES_INPUT_INVALID' });
      }
      let query;
      if (request.tab === 'discover') {
        query = typeof request.query === 'string' ? request.query.trim() : '';
        if (!/^[\w .+@/-]{1,60}$/.test(query)) {
          throw Object.assign(new Error('A package query of 1–60 letters, digits or . + @ / - is required.'), { code: 'APP_PACKAGE_QUERY_INVALID' });
        }
      }
      return appBridge.packages({ tab: request.tab, query });
    })
  );
  ipcMain.handle(contract.channels.appsOpenSettings, (event, ...args) =>
    appsGuard(event, 'apps.settings.open', 'user-initiated', async () => {
      const request = appsRequest(args);
      if (request.target !== 'defaultapps' && request.target !== 'appsfeatures') {
        throw Object.assign(new Error('The requested Windows Settings page is not allowlisted.'), { code: 'APP_SETTINGS_TARGET_INVALID' });
      }
      const target = appBridge.settingsTarget(request.target);
      await shell.openExternal(target.uri);
      return { opened: true, target: target.target };
    })
  );

  const CLEANUP_ID = /^cln:[a-f0-9]{24}$/;
  const CLEANUP_SESSION = /^[a-f0-9-]{8,64}$/i;
  const CLEANUP_CATEGORY = ['temp', 'browser', 'logs', 'recycle', 'update'];
  const cleanupGuard = async (event, capability, permission, work) => {
    try {
      assertTrustedSender(event, { mainWindow, isDev, distRoot, devOrigin });
      if (!cleanupBridge) {
        throw Object.assign(new Error('The read-only Clean Room coordinator is not initialized.'), { code: 'CLEANUP_UNAVAILABLE' });
      }
      const data = await work();
      return ok({
        capability,
        status: 'complete',
        source: 'KNOuX Clean Room read-only coordinator',
        permission,
        provenance: { mode: 'measured', mutation: 'none' },
        data,
      });
    } catch (error) {
      const untrusted = error?.code === 'UNTRUSTED_SENDER';
      return fail({
        capability,
        status: untrusted ? 'permission_denied' : 'failed',
        source: 'KNOuX Clean Room read-only coordinator',
        permission: untrusted ? 'not-granted' : permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'CLEANUP_FAILURE',
          message: String(error?.message || 'Cleanup request failed.').replace(/\s+/g, ' ').slice(0, 300),
          retryable: Boolean(error?.retryable),
        },
      });
    }
  };
  const cleanupRequest = (args, code = 'CLEANUP_INPUT_INVALID') => {
    if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
      throw Object.assign(new Error('A single structured cleanup request is required.'), { code });
    }
    return args[0];
  };
  const cleanupCategories = (request, code, fallbackAll) => {
    const categories = request.categories;
    if (categories == null && fallbackAll) return [...CLEANUP_CATEGORY];
    if (!Array.isArray(categories) || categories.length < 1 || categories.length > CLEANUP_CATEGORY.length
      || !categories.every((key) => CLEANUP_CATEGORY.includes(key))) {
      throw Object.assign(new Error('Between 1 and 5 allowlisted cleanup categories are required.'), { code });
    }
    return [...new Set(categories)];
  };
  const cleanupAgeDays = (value, code) => {
    if (value == null) return undefined;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 3650) {
      throw Object.assign(new Error('An age threshold between 0 and 3650 days is required.'), { code });
    }
    return Math.floor(value);
  };

  ipcMain.handle(contract.channels.cleanupCapabilities, (event, ...args) =>
    cleanupGuard(event, 'cleanup.capabilities', 'read-only', () => {
      assertNoArguments(args, contract.channels.cleanupCapabilities);
      return cleanupBridge.capabilities();
    })
  );
  ipcMain.handle(contract.channels.cleanupStart, (event, ...args) =>
    cleanupGuard(event, 'cleanup.start', 'read-only', () => {
      const request = cleanupRequest(args);
      const categories = cleanupCategories(request, 'CLEANUP_CATEGORY_INVALID', false);
      const ageDays = cleanupAgeDays(request.ageDays, 'CLEANUP_AGE_INVALID');
      return cleanupBridge.start({ categories, ...(ageDays == null ? {} : { ageDays }) });
    })
  );
  ipcMain.handle(contract.channels.cleanupStatus, (event, ...args) =>
    cleanupGuard(event, 'cleanup.status', 'read-only', () => {
      const request = cleanupRequest(args);
      if (typeof request.sessionId !== 'string' || !CLEANUP_SESSION.test(request.sessionId)) {
        throw Object.assign(new Error('A valid cleanup session identifier is required.'), { code: 'CLEANUP_SESSION_INVALID' });
      }
      return cleanupBridge.status(request.sessionId);
    })
  );
  ipcMain.handle(contract.channels.cleanupCancel, (event, ...args) =>
    cleanupGuard(event, 'cleanup.cancel', 'user-initiated', () => {
      const request = cleanupRequest(args);
      if (typeof request.sessionId !== 'string' || !CLEANUP_SESSION.test(request.sessionId)) {
        throw Object.assign(new Error('A valid cleanup session identifier is required.'), { code: 'CLEANUP_SESSION_INVALID' });
      }
      return cleanupBridge.cancel(request.sessionId);
    })
  );
  ipcMain.handle(contract.channels.cleanupInventory, (event, ...args) =>
    cleanupGuard(event, 'cleanup.inventory', 'read-only', () => {
      assertNoArguments(args, contract.channels.cleanupInventory);
      return cleanupBridge.inventory();
    })
  );
  ipcMain.handle(contract.channels.cleanupEstimate, (event, ...args) =>
    cleanupGuard(event, 'cleanup.estimate', 'read-only', () => {
      assertNoArguments(args, contract.channels.cleanupEstimate);
      return cleanupBridge.estimate();
    })
  );
  ipcMain.handle(contract.channels.cleanupQuarantine, (event, ...args) =>
    cleanupGuard(event, 'cleanup.quarantine', 'read-only', () => {
      assertNoArguments(args, contract.channels.cleanupQuarantine);
      return cleanupBridge.quarantine();
    })
  );
  ipcMain.handle(contract.channels.cleanupUnused, (event, ...args) =>
    cleanupGuard(event, 'cleanup.unused', 'read-only', () => {
      const request = cleanupRequest(args);
      if (request.sourceId != null && (typeof request.sourceId !== 'string' || !/^[a-f0-9-]{8,64}$/i.test(request.sourceId))) {
        throw Object.assign(new Error('A valid authorized source identifier is required.'), { code: 'CLEANUP_SOURCE_INVALID' });
      }
      const ageDays = cleanupAgeDays(request.ageDays, 'CLEANUP_AGE_INVALID');
      const limit = request.limit == null
        ? undefined
        : (Number.isInteger(request.limit) && request.limit >= 1 && request.limit <= 200 ? request.limit : null);
      if (limit === null) throw Object.assign(new Error('A limit between 1 and 200 is required.'), { code: 'CLEANUP_LIMIT_INVALID' });
      return cleanupBridge.unused({
        ...(request.sourceId ? { sourceId: request.sourceId } : {}),
        ...(ageDays == null ? {} : { ageDays }),
        ...(limit == null ? {} : { limit }),
      });
    })
  );
  ipcMain.handle(contract.channels.cleanupPlan, (event, ...args) =>
    cleanupGuard(event, 'cleanup.plan', 'read-only', () => {
      const request = cleanupRequest(args);
      const ids = request.candidateIds;
      if (!Array.isArray(ids) || ids.length < 1 || ids.length > 120 || !ids.every((id) => typeof id === 'string' && CLEANUP_ID.test(id))) {
        throw Object.assign(new Error('Between 1 and 120 measured cleanup candidate identifiers are required.'), { code: 'CLEANUP_PLAN_INPUT_INVALID' });
      }
      if (!['quarantine', 'recycle', 'restore', 'purge', 'archive'].includes(request.mode)) {
        throw Object.assign(new Error('The cleanup plan mode is not allowlisted.'), { code: 'CLEANUP_PLAN_MODE_INVALID' });
      }
      return cleanupBridge.plan({ candidateIds: [...new Set(ids)], mode: request.mode });
    })
  );
  ipcMain.handle(contract.channels.cleanupSchedule, (event, ...args) =>
    cleanupGuard(event, 'cleanup.schedule', 'read-only', () => {
      const request = cleanupRequest(args);
      if (request.frequency !== 'daily' && request.frequency !== 'weekly') {
        throw Object.assign(new Error('The schedule frequency must be daily or weekly.'), { code: 'CLEANUP_SCHEDULE_INVALID' });
      }
      if (typeof request.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(request.time)) {
        throw Object.assign(new Error('A 24-hour HH:MM schedule time is required.'), { code: 'CLEANUP_SCHEDULE_TIME_INVALID' });
      }
      const weekdays = Array.isArray(request.weekdays) ? request.weekdays : [];
      if (!weekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)) {
        throw Object.assign(new Error('Weekdays must be integers from 0 to 6.'), { code: 'CLEANUP_SCHEDULE_DAYS_INVALID' });
      }
      const categories = cleanupCategories(request, 'CLEANUP_CATEGORY_INVALID', false);
      return cleanupBridge.schedule({
        frequency: request.frequency,
        time: request.time,
        weekdays: [...new Set(weekdays)],
        categories,
      });
    })
  );
  ipcMain.handle(contract.channels.cleanupReport, (event, ...args) =>
    cleanupGuard(event, 'cleanup.report', 'read-only', () => {
      assertNoArguments(args, contract.channels.cleanupReport);
      return cleanupBridge.report();
    })
  );
  ipcMain.handle(contract.channels.cleanupOpenSettings, (event, ...args) =>
    cleanupGuard(event, 'cleanup.settings.open', 'user-initiated', async () => {
      const request = cleanupRequest(args);
      if (request.target !== 'storage' && request.target !== 'windowsupdate') {
        throw Object.assign(new Error('The requested Windows Settings page is not allowlisted.'), { code: 'CLEANUP_SETTINGS_TARGET_INVALID' });
      }
      const target = cleanupBridge.settingsTarget(request.target);
      await shell.openExternal(target.uri);
      return { opened: true, target: target.target };
    })
  );

  ipcMain.handle(contract.channels.windowControl, (event, ...args) =>
    guard(event, 'window.control', args, async (callArgs) => {
      if (callArgs.length !== 1) {
        const error = new Error('A single window action is required.');
        error.code = 'INVALID_ARGUMENTS';
        throw error;
      }
      const action = assertWindowAction(callArgs[0]);
      if (!mainWindow || mainWindow.isDestroyed()) {
        const error = new Error('The application window is not available.');
        error.code = 'WINDOW_UNAVAILABLE';
        throw error;
      }
      if (action === 'minimize') mainWindow.minimize();
      if (action === 'maximize') {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
      }
      if (action === 'close') mainWindow.close();
      return ok({
        capability: 'window.control',
        status: 'complete',
        source: 'Electron BrowserWindow',
        permission: 'user-initiated',
        data: { action },
      });
    })
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1672,
    height: 941,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    show: false,
    backgroundColor: '#040a16',
    title: 'KNOuX Smart Gemini',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      spellcheck: false,
      backgroundThrottling: false,
      paintWhenInitiallyHidden: true,
    },
  });

  hardenWebContents(mainWindow.webContents, { isDev, devOrigin });

  mainWindow.once('ready-to-show', () => {
    trace('ready-to-show');
    if (!isSmoke) mainWindow.show();
  });

  mainWindow.webContents.once('did-finish-load', () => {
    trace('did-finish-load');
    if (isSmoke) {
      void runSmoke(mainWindow);
    } else if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    trace(`did-fail-load ${errorCode} ${errorDescription}`);
    // No native PowerShell window, and no retry loop. Development users get the
    // exact reason in the terminal; packaged users see Chromium's failure page.
    console.error(`[gemini-shell] renderer load failed (${errorCode}): ${errorDescription}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    trace(`loading dev URL ${devOrigin}`);
    void mainWindow.loadURL(devOrigin);
  } else {
    const indexPath = path.join(distRoot, 'index.html');
    trace(`loading file ${indexPath}`);
    void mainWindow.loadFile(indexPath);
  }
}

function redactError(error) {
  return {
    code: typeof error?.code === 'string' ? error.code : 'SMOKE_FAILED',
    message: typeof error?.message === 'string' ? error.message.slice(0, 300) : 'Native smoke failed.',
  };
}

async function runSmoke(win) {
  const startedAt = new Date().toISOString();
  const receipt = {
    schema: 'knoux.gemini.native-smoke.v1',
    startedAt,
    packaged: app.isPackaged,
    appVersion: appPackage.version,
    electronVersion: process.versions.electron,
    platform: process.platform,
    security: null,
    renderer: null,
    screenshot: smokeShotPath || null,
    ok: false,
  };
  try {
    trace('smoke start');
    await sleep(1200);
    const prefs = win.webContents.getLastWebPreferences() || {};
    receipt.security = {
      // Electron does not expose the preload path through getLastWebPreferences;
      // bridgePresent below proves the preload module actually executed.
      preloadExposedBridge: null,
      contextIsolation: Boolean(prefs.contextIsolation),
      sandbox: Boolean(prefs.sandbox),
      nodeIntegration: Boolean(prefs.nodeIntegration),
      webSecurity: prefs.webSecurity !== false,
      webviewTag: Boolean(prefs.webviewTag),
    };

    trace('executing renderer bridge probe');
    const rendererProbe = win.webContents.executeJavaScript(
      `(async () => {
        const api = window.knouxShell;
        const status = api ? await api.getStatus() : null;
        const system = api ? await api.getSystemSummary() : null;
        const services = api ? await api.getServicesSummary() : null;
        const studioApi = window.knouxStudioV1;
        let studio = null;
        if (studioApi) {
          const sources = await studioApi.listSources();
          const sourceId = sources?.data?.[0]?.id || null;
          const query = sourceId ? await studioApi.query({ sourceId, limit: 20 }) : null;
          const previewIds = (query?.data?.rows || []).filter((row) => row.hasThumbnail).slice(0, 4).map((row) => row.id);
          const thumbs = sourceId && previewIds.length ? await studioApi.thumbnails(sourceId, previewIds) : null;
          const plan = sourceId ? await studioApi.previewPlan({ sourceId, all: true, operation: 'virtual', structure: 'categorized', collisionPolicy: 'review' }) : null;
          const history = await studioApi.previewHistory();
          studio = { bridgePresent: true, sources, query, thumbs, plan, history };
        }
        const filesApi = window.knouxFilesV1;
        let files = null;
        if (filesApi) {
          const sources = await filesApi.listSources();
          const sourceId = sources?.data?.[0]?.id || null;
          const query = sourceId ? await filesApi.query({ sourceId, limit: 20 }) : null;
          const overview = sourceId ? await filesApi.overview(sourceId) : null;
          const row = (query?.data?.rows || [])[0] || null;
          const metadata = sourceId && row ? await filesApi.metadata(sourceId, row.id) : null;
          const hash = sourceId && row ? await filesApi.hash(sourceId, row.id, 'sha256') : null;
          const emptyFolders = sourceId ? await filesApi.emptyFolders(sourceId, 50) : null;
          const thumbIds = (query?.data?.rows || []).filter((entry) => entry.hasThumbnail).slice(0, 4).map((entry) => entry.id);
          const thumbs = sourceId && thumbIds.length ? await filesApi.thumbnails(sourceId, thumbIds) : null;
          files = { bridgePresent: true, sources, query, overview, metadata, hash, emptyFolders, thumbs };
        }
        const storageApi = window.knouxStorageV1;
        let storage = null;
        if (storageApi) {
          const storageSource = await window.knouxStudioV1?.listSources?.();
          const sourceId = storageSource?.data?.[0]?.id || null;
          const volumes = await storageApi.volumes();
          const history = await storageApi.history();
          const analysis = sourceId ? await storageApi.analysis(sourceId) : null;
          const duplicates = sourceId ? await storageApi.verifyDuplicates(sourceId) : null;
          storage = { bridgePresent: true, volumes, history, analysis, duplicates };
        }
        const scanApi = window.knouxScanV1;
        let scan = null;
        if (scanApi) {
          const capabilities = await scanApi.capabilities();
          const sources = await scanApi.listSources();
          let sourceId = sources?.data?.[0]?.id || null;
          if (sourceId && sources.data[0].status !== 'ready') {
            await scanApi.indexSource(sourceId);
            const refreshed = await scanApi.listSources();
            sourceId = refreshed?.data?.[0]?.id || sourceId;
          }
          let started = null;
          let session = null;
          let history = null;
          if (sourceId) {
            started = await scanApi.start({ mode: 'quick', sourceId });
            const sessionId = started?.data?.sessionId || null;
            if (sessionId) {
              const scanDeadline = Date.now() + 90000;
              while (Date.now() < scanDeadline) {
                session = await scanApi.status(sessionId);
                const status = session?.data?.status;
                if (['complete', 'partial', 'cancelled', 'failed'].includes(status)) break;
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            }
            history = await scanApi.history();
          }
          scan = { bridgePresent: true, capabilities, sources, started, session, history };
        }
        const appsApi = window.knouxAppsV1;
        let apps = null;
        if (appsApi) {
          const capabilities = await appsApi.capabilities();
          const inventory = await appsApi.inventory();
          const rows = inventory?.data?.apps || [];
          const firstApp = rows[0] || null;
          const signature = firstApp ? await appsApi.signature(firstApp.id) : null;
          const associations = await appsApi.associations();
          const leftovers = await appsApi.leftovers();
          const updates = await appsApi.updates({ check: false });
          const plan = firstApp ? await appsApi.plan({ appIds: [firstApp.id] }) : null;
          const summary = (envelope, transform) => envelope
            ? {
                status: envelope.status,
                capability: envelope.capability,
                permission: envelope.permission,
                data: envelope.data ? transform(envelope.data) : null,
                error: envelope.error ? { code: envelope.error.code } : null,
              }
            : null;
          apps = {
            bridgePresent: true,
            capabilities: summary(capabilities, (data) => ({
              engine: data.engine,
              contract: data.contract,
              readOnly: data.readOnly,
              mutation: data.mutation,
              fixtureFallback: data.fixtureFallback,
              serviceCount: data.services?.length ?? 0,
              gatedCount: data.gatedOperations?.length ?? 0,
            })),
            inventory: summary(inventory, (data) => ({
              contract: data.contract,
              readOnly: data.readOnly,
              mutation: data.mutation,
              observedAt: data.observedAt,
              durationMs: data.durationMs,
              appCount: data.apps?.length ?? 0,
              firstAppId: data.apps?.[0]?.id ?? null,
              kpis: data.kpis,
              coverage: data.coverage,
              warningCount: data.warnings?.length ?? 0,
            })),
            signature: summary(signature, (data) => ({
              appId: data.appId,
              status: data.status,
              hasSigner: Boolean(data.signer),
              thumbprintLength: data.thumbprint?.length ?? 0,
              chainLength: data.chain?.length ?? 0,
            })),
            associations: summary(associations, (data) => ({
              extensions: data.extensions?.length ?? 0,
              protocols: data.protocols?.length ?? 0,
              truncated: data.truncated,
              warningCount: data.warnings?.length ?? 0,
            })),
            leftovers: summary(leftovers, (data) => ({
              candidateCount: data.candidateCount,
              staleCount: data.staleCount,
              truncated: data.truncated,
              mutation: data.mutation,
              warningCount: data.warnings?.length ?? 0,
            })),
            updates: summary(updates, (data) => ({
              adapter: data.adapter,
              installed: data.installed,
              version: data.version,
              status: data.status,
              itemCount: data.items?.length ?? 0,
              note: data.note,
            })),
            plan: summary(plan, (data) => ({
              contract: data.contract,
              mode: data.mode,
              itemCount: data.items?.length ?? 0,
              totals: data.totals,
              execution: data.execution,
              immutable: data.immutable,
              mutation: data.mutation,
            })),
          };
        }
        const cleanupApi = window.knouxCleanupV1;
        let cleanup = null;
        if (cleanupApi) {
          const capabilities = await cleanupApi.capabilities();
          const started = await cleanupApi.start({ categories: ['temp', 'browser', 'logs', 'recycle', 'update'], ageDays: 1 });
          let session = started;
          const sessionId = started?.data?.id || null;
          if (sessionId) {
            const cleanupDeadline = Date.now() + 70000;
            while (Date.now() < cleanupDeadline) {
              session = await cleanupApi.status(sessionId);
              if (['complete', 'cancelled', 'failed'].includes(session?.data?.status)) break;
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
          const inventory = await cleanupApi.inventory();
          const estimate = await cleanupApi.estimate();
          const quarantine = await cleanupApi.quarantine();
          const schedule = await cleanupApi.schedule({
            frequency: 'daily',
            time: '02:30',
            weekdays: [],
            categories: ['temp', 'logs'],
          });
          const report = await cleanupApi.report();
          const firstCandidateId = inventory?.data?.candidates?.[0]?.id || null;
          const plan = firstCandidateId
            ? await cleanupApi.plan({ candidateIds: [firstCandidateId], mode: 'quarantine' })
            : null;
          const cleanupSummary = (envelope, transform) => envelope
            ? {
                status: envelope.status,
                capability: envelope.capability,
                permission: envelope.permission,
                data: envelope.data ? transform(envelope.data) : null,
                error: envelope.error ? { code: envelope.error.code } : null,
              }
            : null;
          cleanup = {
            bridgePresent: true,
            capabilities: cleanupSummary(capabilities, (data) => ({
              engine: data.engine,
              contract: data.contract,
              readOnly: data.readOnly,
              mutation: data.mutation,
              fixtureFallback: data.fixtureFallback,
              serviceCount: data.services?.length ?? 0,
              gatedCount: data.gatedOperations?.length ?? 0,
              categories: data.categories?.map((entry) => entry.key) ?? [],
            })),
            started: cleanupSummary(started, (data) => ({
              id: data.id,
              status: data.status,
              categories: data.requestedCategories,
            })),
            session: cleanupSummary(session, (data) => ({
              id: data.id,
              status: data.status,
              progressPercent: data.progressPercent,
              candidateCount: data.candidateCount,
              stages: data.categories?.map((entry) => ({ key: entry.key, status: entry.status, candidates: entry.candidates })) ?? [],
              coverage: data.coverage,
              eligibleBytes: data.estimatedEligibleBytes,
              reviewBytes: data.estimatedReviewBytes,
              blockedBytes: data.estimatedBlockedBytes,
              warningCount: data.warnings?.length ?? 0,
            })),
            inventory: cleanupSummary(inventory, (data) => ({
              status: data.status,
              readOnly: data.readOnly,
              mutation: data.mutation,
              observedAt: data.observedAt,
              candidateCount: data.candidates?.length ?? 0,
              summary: data.summary,
              recycleItemCount: data.recycleItems?.length ?? 0,
              coverage: data.coverage,
              warningCount: data.warnings?.length ?? 0,
            })),
            estimate: cleanupSummary(estimate, (data) => ({
              status: data.status,
              mutation: data.mutation,
              summary: data.summary,
              categoryCount: data.categories?.length ?? 0,
            })),
            quarantine: cleanupSummary(quarantine, (data) => ({
              mutation: data.mutation,
              vaultEntries: data.vault?.items?.length ?? 0,
              journalEntries: data.journal?.entries?.length ?? 0,
              execution: data.execution,
            })),
            schedule: cleanupSummary(schedule, (data) => ({
              mutation: data.mutation,
              scanOnly: data.draft?.scanOnly,
              occurrenceCount: data.occurrences?.length ?? 0,
              execution: data.execution,
            })),
            report: cleanupSummary(report, (data) => ({
              mutation: data.mutation,
              readOnly: data.readOnly,
              candidateCount: data.summary?.candidates ?? 0,
              recycleBytes: data.recycle?.bytes ?? 0,
              journalEntries: data.journal?.entries ?? 0,
            })),
            plan: cleanupSummary(plan, (data) => ({
              contract: data.contract,
              mode: data.mode,
              itemCount: data.items?.length ?? 0,
              totals: data.totals,
              execution: data.execution,
              immutable: data.immutable,
              mutation: data.mutation,
            })),
          };
        }
        return {
          href: location.href,
          readyState: document.readyState,
          rootChildren: document.querySelector('#root')?.childElementCount || 0,
          bridgePresent: Boolean(api),
          studioBridgePresent: Boolean(studioApi),
          filesBridgePresent: Boolean(filesApi),
          storageBridgePresent: Boolean(storageApi),
          scanBridgePresent: Boolean(scanApi),
          appsBridgePresent: Boolean(appsApi),
          cleanupBridgePresent: Boolean(cleanupApi),
          contractVersion: api?.contractVersion ?? null,
          nodeRequireType: typeof window.require,
          nodeProcessType: typeof window.process,
          status,
          system,
          services,
          studio,
          files,
          storage,
          scan,
          apps,
          cleanup,
          cspMeta: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') || null
        };
      })()`,
      true
    );
    const renderer = await Promise.race([
      rendererProbe,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Renderer bridge probe timed out after 90 seconds.')), 90000)),
    ]);
    trace(`renderer probe complete bridge=${Boolean(renderer?.bridgePresent)} system=${renderer?.system?.status} services=${renderer?.services?.status}`);
    receipt.renderer = renderer;
    receipt.security.preloadExposedBridge = renderer.bridgePresent === true;

    if (smokeShotPath) {
      try {
        await win.webContents.executeJavaScript(
          `(() => {
             const button = document.querySelector('[data-testid="native-bridge-status"]');
             if (button) button.click();
             return Boolean(button);
           })()`,
          true
        );
        // Give the visible read-only panel time to render the measured values
        // (the panel performs its own IPC read; this is intentionally not a
        // duplicate HTML injection).
        const deadline = Date.now() + 25000;
        while (Date.now() < deadline) {
          await sleep(500);
          const ready = await win.webContents.executeJavaScript(
            `(() => {
               const panel = document.querySelector('[data-testid="native-bridge-panel"]');
               if (!panel) return false;
               const text = panel.innerText || '';
               return text.includes('CPU load') && !text.includes('Calling the Windows provider');
             })()`,
            true
          );
          if (ready) break;
        }
        await sleep(500);
        win.showInactive();
        await sleep(500);
        const image = await win.webContents.capturePage();
        await fsp.mkdir(path.dirname(smokeShotPath), { recursive: true });
        await fsp.writeFile(smokeShotPath, image.toPNG());
        const stat = await fsp.stat(smokeShotPath);
        receipt.screenshotBytes = stat.size;

        // Prove the new native panel is not a dark-only island. The theme
        // toggle is the same real control used by the user.
        const lightShotPath = smokeShotPath.replace(/\.png$/i, '-light.png');
        await win.webContents.executeJavaScript(
          `document.querySelector('button[aria-pressed]')?.click()`,
          true
        );
        await sleep(800);
        const lightImage = await win.webContents.capturePage();
        await fsp.writeFile(lightShotPath, lightImage.toPNG());
        receipt.lightScreenshot = lightShotPath;
        receipt.lightScreenshotBytes = (await fsp.stat(lightShotPath)).size;

        // Arabic RTL proof for the same overlay.
        const arShotPath = smokeShotPath.replace(/\.png$/i, '-ar-light.png');
        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        const arDeadline = Date.now() + 25000;
        while (Date.now() < arDeadline) {
          await sleep(500);
          const ready = await win.webContents.executeJavaScript(
            `(() => {
               const panel = document.querySelector('[data-testid="native-bridge-panel"]');
               if (!panel) return false;
               const text = panel.innerText || '';
               return /حمل المعالج|CPU load/.test(text) && !/جارٍ استدعاء|Calling the Windows provider/.test(text);
             })()`,
            true
          );
          if (ready) break;
        }
        const arImage = await win.webContents.capturePage();
        await fsp.writeFile(arShotPath, arImage.toPNG());
        receipt.arabicScreenshot = arShotPath;
        receipt.arabicScreenshotBytes = (await fsp.stat(arShotPath)).size;

        // Real measured Studio evidence: the controlled smoke source was
        // indexed before this window loaded. Navigate to the Studio route,
        // wait for the measured banner, then capture the library.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'studio'; return true; })()`,
          true
        );
        const studioDeadline = Date.now() + 15000;
        let studioReady = false;
        while (Date.now() < studioDeadline) {
          await sleep(500);
          studioReady = await win.webContents.executeJavaScript(
            `(() => {
               const panel = document.querySelector('[data-testid="studio-native-banner"]');
               const text = document.body.innerText || '';
               return Boolean(panel) && (text.includes('Native measured index') || text.includes('فهرس أصلي مقيس'));
             })()`,
            true
          );
          if (studioReady) break;
        }
        await sleep(1200);
        const studioShotPath = smokeShotPath.replace(/native-bridge/i, 'studio-measured');
        const studioImage = await win.webContents.capturePage();
        await fsp.writeFile(studioShotPath, studioImage.toPNG());
        receipt.studioScreenshot = studioShotPath;
        receipt.studioScreenshotBytes = (await fsp.stat(studioShotPath)).size;
        receipt.studioUiReady = studioReady;

        // Stage 6 proves the measured plan reaches the rendered review surface,
        // not just the IPC probe, and that execution remains explicitly blocked.
        await win.webContents.executeJavaScript(
          `(() => {
             const stage = document.querySelector('button[title="Stage 6: Plan Review"]');
             if (stage) stage.click();
             return Boolean(stage);
           })()`,
          true
        );
        const planDeadline = Date.now() + 20000;
        let studioPlanReady = false;
        while (Date.now() < planDeadline) {
          await sleep(500);
          studioPlanReady = await win.webContents.executeJavaScript(
            `(() => {
               const text = document.body.innerText || '';
               return text.includes('MEASURED PREVIEW') &&
                 text.includes('Planned target') &&
                 text.includes('Execution is blocked');
             })()`,
            true
          );
          if (studioPlanReady) break;
        }
        await sleep(800);
        const planShotPath = smokeShotPath.replace(/native-bridge/i, 'studio-plan');
        const planImage = await win.webContents.capturePage();
        await fsp.writeFile(planShotPath, planImage.toPNG());
        receipt.studioPlanScreenshot = planShotPath;
        receipt.studioPlanScreenshotBytes = (await fsp.stat(planShotPath)).size;
        receipt.studioPlanUiReady = studioPlanReady;

        // Stage 8 must show persisted preview receipts, not a fixture journal.
        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Stage 8: History & Undo"]')?.click()`,
          true
        );
        const historyDeadline = Date.now() + 12000;
        let studioHistoryReady = false;
        while (Date.now() < historyDeadline) {
          await sleep(400);
          studioHistoryReady = await win.webContents.executeJavaScript(
            `(() => {
               const text = document.body.innerText || '';
               return text.includes('PREVIEW RECEIPTS') && text.includes('No undo') &&
                 !text.includes('Fixture journal only');
             })()`,
            true
          );
          if (studioHistoryReady) break;
        }
        await sleep(700);
        const historyShotPath = smokeShotPath.replace(/native-bridge/i, 'studio-history');
        const historyImage = await win.webContents.capturePage();
        await fsp.writeFile(historyShotPath, historyImage.toPNG());
        receipt.studioHistoryScreenshot = historyShotPath;
        receipt.studioHistoryScreenshotBytes = (await fsp.stat(historyShotPath)).size;
        receipt.studioHistoryUiReady = studioHistoryReady;

        // Measured Files route: the real adapter probe above has already
        // resolved the source. Capture the rendered ledger after it arrives.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'files'; return true; })()`,
          true
        );
        const filesDeadline = Date.now() + 20000;
        let filesUiReady = false;
        while (Date.now() < filesDeadline) {
          await sleep(500);
          filesUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const banner = document.querySelector('[data-testid="files-native-banner"]');
               const text = document.body.innerText || '';
               return Boolean(banner) &&
                 (text.includes('Native measured index') || text.includes('فهرس أصلي مقيس')) &&
                 (text.includes('Instant Find') || text.includes('البحث الفوري')) &&
                 text.includes('MEASURED') &&
                 (text.includes('Created') || text.includes('أُنشئ')) &&
                 (text.includes('Zone / MotW') || text.includes('المنطقة / MotW'));
             })()`,
            true
          );
          if (filesUiReady) break;
        }
        await sleep(2000);
        const filesShotPath = smokeShotPath.replace(/native-bridge/i, 'files-measured');
        const filesImage = await win.webContents.capturePage();
        await fsp.writeFile(filesShotPath, filesImage.toPNG());
        receipt.filesScreenshot = filesShotPath;
        receipt.filesScreenshotBytes = (await fsp.stat(filesShotPath)).size;
        receipt.filesUiReady = filesUiReady;

        // Measured Storage route: volumes come from the measured provider,
        // while treemap/folders use the same authorized inventory.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'storage'; return true; })()`,
          true
        );
        const storageDeadline = Date.now() + 20000;
        let storageUiReady = false;
        while (Date.now() < storageDeadline) {
          await sleep(500);
          storageUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const banner = document.querySelector('[data-testid="storage-native-banner"]');
               const text = document.body.innerText || '';
               const volumeCount = document.querySelector('[data-testid="storage-volume-count"]')?.textContent?.trim() || '';
               return Boolean(banner) && volumeCount !== '' && volumeCount !== '—' &&
                 (text.includes('Measured atlas') || text.includes('أطلس مقيس')) &&
                 (text.includes('MEASURED SCOPE') || text.includes('نطاق مقيس'));
             })()`,
            true
          );
          if (storageUiReady) break;
        }
        await sleep(1500);
        const storageShotPath = smokeShotPath.replace(/native-bridge/i, 'storage-measured');
        const storageImage = await win.webContents.capturePage();
        await fsp.writeFile(storageShotPath, storageImage.toPNG());
        receipt.storageScreenshot = storageShotPath;
        receipt.storageScreenshotBytes = (await fsp.stat(storageShotPath)).size;
        receipt.storageUiReady = storageUiReady;

        // Measured Smart Scan route: the probe above ran a real quick scan on
        // the controlled source. Load the route, wait for the persisted
        // session to render, then capture responsive and RTL/theme variants.
        await win.webContents.executeJavaScript(
          `(() => {
             const theme = document.documentElement.getAttribute('data-theme');
             if (theme === 'light') document.querySelector('button[aria-pressed]')?.click();
             if (document.documentElement.getAttribute('dir') === 'rtl') {
               document.querySelector('button[title="Toggle Arabic / English"]')?.click();
             }
             location.hash = 'smart_scan';
             return true;
           })()`,
          true
        );
        const scanDeadline = Date.now() + 30000;
        let smartScanUiReady = false;
        while (Date.now() < scanDeadline) {
          await sleep(500);
          smartScanUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const workspace = document.querySelector('[data-testid="scan-workspace"]');
               const sourceSelect = document.querySelector('[data-testid="scan-source-select"]');
               const filesValue = document.querySelector('[data-testid="scan-kpi-files-value"]')?.textContent?.trim() || '';
               const findingsValue = document.querySelector('[data-testid="scan-kpi-issues-value"]')?.textContent?.trim() || '';
               const stageText = document.querySelector('[data-testid="scan-stage-console"]')?.innerText || '';
               const commandText = document.querySelector('[data-testid="scan-command-bar"]')?.innerText || '';
               return Boolean(workspace) && Boolean(sourceSelect) &&
                 filesValue !== '' && filesValue !== '—' &&
                 findingsValue !== '' && findingsValue !== '—' &&
                 /Quick Scan|فحص سريع/.test(commandText) &&
                 /Measured stage console|سجل المراحل المقيسة/.test(stageText);
             })()`,
            true
          );
          if (smartScanUiReady) break;
        }
        await sleep(1200);
        const smartScanShotPath = smokeShotPath.replace(/native-bridge/i, 'smart-scan-measured');
        const smartScanImage = await win.webContents.capturePage();
        await fsp.writeFile(smartScanShotPath, smartScanImage.toPNG());
        receipt.smartScanScreenshot = smartScanShotPath;
        receipt.smartScanScreenshotBytes = (await fsp.stat(smartScanShotPath)).size;
        receipt.smartScanUiReady = smartScanUiReady;

        const wideLayout = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="scan-workspace"]');
             const inspector = document.querySelector('[data-testid="scan-review-inspector"]');
             const results = document.querySelector('[data-testid="scan-results"]');
             if (!main || !inspector || !results) return { ok: false, reason: 'scan panels missing' };
             const mainRect = main.getBoundingClientRect();
             const inspectorRect = inspector.getBoundingClientRect();
             const resultsRect = results.getBoundingClientRect();
             return {
               ok: inspectorRect.right <= mainRect.right + 1
                 && inspectorRect.bottom <= mainRect.bottom + 1
                 && resultsRect.bottom <= mainRect.bottom + 1,
               horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
               verticalOverflow: main.scrollHeight > main.clientHeight + 2,
               inspectorBottom: Math.round(inspectorRect.bottom),
               resultsBottom: Math.round(resultsRect.bottom),
               mainBottom: Math.round(mainRect.bottom),
             };
           })()`,
          true
        );
        receipt.smartScanWideLayout = wideLayout;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[aria-pressed]')?.click()`,
          true
        );
        await sleep(800);
        const smartScanLightPath = smartScanShotPath.replace(/\.png$/i, '-light.png');
        const smartScanLightImage = await win.webContents.capturePage();
        await fsp.writeFile(smartScanLightPath, smartScanLightImage.toPNG());
        receipt.smartScanLightScreenshot = smartScanLightPath;
        receipt.smartScanLightScreenshotBytes = (await fsp.stat(smartScanLightPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(1000);
        const smartScanArabicPath = smartScanShotPath.replace(/\.png$/i, '-ar-light.png');
        const smartScanArabicImage = await win.webContents.capturePage();
        await fsp.writeFile(smartScanArabicPath, smartScanArabicImage.toPNG());
        receipt.smartScanArabicScreenshot = smartScanArabicPath;
        receipt.smartScanArabicScreenshotBytes = (await fsp.stat(smartScanArabicPath)).size;

        await win.webContents.executeJavaScript(
          `(() => {
             document.querySelector('button[title="Toggle Arabic / English"]')?.click();
             document.querySelector('button[aria-pressed]')?.click();
             return true;
           })()`,
          true
        );
        await sleep(900);
        win.setContentSize(1366, 768);
        await sleep(900);
        const smartScan1366Path = smartScanShotPath.replace(/\.png$/i, '-1366.png');
        const smartScan1366Image = await win.webContents.capturePage();
        await fsp.writeFile(smartScan1366Path, smartScan1366Image.toPNG());
        receipt.smartScan1366Screenshot = smartScan1366Path;
        receipt.smartScan1366ScreenshotBytes = (await fsp.stat(smartScan1366Path)).size;

        const layout1366 = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="scan-workspace"]');
             const inspector = document.querySelector('[data-testid="scan-review-inspector"]');
             const results = document.querySelector('[data-testid="scan-results"]');
             if (!main || !inspector || !results) return { ok: false, reason: 'scan panels missing' };
             const mainRect = main.getBoundingClientRect();
             const resultsRect = results.getBoundingClientRect();
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             const scrollable = main.scrollHeight > main.clientHeight + 2;
             const withinWidth = (rect) => rect.left >= mainRect.left - 1 && rect.right <= mainRect.right + 1;
             const resultsFit = withinWidth(resultsRect) && resultsRect.bottom <= mainRect.bottom + 1;
             const beforeTop = main.scrollTop;
             main.scrollTop = main.scrollHeight;
             const scrollWorked = main.scrollTop > beforeTop;
             const inspectorRect = inspector.getBoundingClientRect();
             const inspectorFit = withinWidth(inspectorRect)
               && inspectorRect.top >= mainRect.top - 1
               && inspectorRect.bottom <= mainRect.bottom + 1;
             return {
               ok: resultsFit && inspectorFit && (!scrollable || scrollWorked),
               horizontalOverflow,
               scrollable,
               scrollWorked,
               resultsFit,
               inspectorFit,
               resultsTop: Math.round(resultsRect.top),
               resultsBottom: Math.round(resultsRect.bottom),
               resultsHeight: Math.round(resultsRect.height),
               mainTop: Math.round(mainRect.top),
               inspectorRight: Math.round(inspectorRect.right),
               mainRight: Math.round(mainRect.right),
               inspectorTop: Math.round(inspectorRect.top),
               inspectorBottom: Math.round(inspectorRect.bottom),
               mainBottom: Math.round(mainRect.bottom),
               mainScrollHeight: main.scrollHeight,
               mainClientHeight: main.clientHeight,
             };
           })()`,
          true
        );
        receipt.smartScan1366Layout = layout1366;
        await sleep(300);
        const smartScan1366BottomPath = smartScan1366Path.replace(/\.png$/i, '-bottom.png');
        const smartScan1366BottomImage = await win.webContents.capturePage();
        await fsp.writeFile(smartScan1366BottomPath, smartScan1366BottomImage.toPNG());
        receipt.smartScan1366BottomScreenshot = smartScan1366BottomPath;
        receipt.smartScan1366BottomScreenshotBytes = (await fsp.stat(smartScan1366BottomPath)).size;
        await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="scan-workspace"]');
             if (main) main.scrollTop = 0;
             return true;
           })()`,
          true
        );
        await sleep(200);

        win.setContentSize(1920, 1080);
        await sleep(900);
        const smartScan1920Path = smartScanShotPath.replace(/\.png$/i, '-1920.png');
        const smartScan1920Image = await win.webContents.capturePage();
        await fsp.writeFile(smartScan1920Path, smartScan1920Image.toPNG());
        receipt.smartScan1920Screenshot = smartScan1920Path;
        receipt.smartScan1920ScreenshotBytes = (await fsp.stat(smartScan1920Path)).size;
        win.setContentSize(1672, 941);
        await sleep(400);

        // Measured Applications route: inventory, signature, associations,
        // leftovers, plan and updates were already probed through the real
        // preload bridge. Load the route and prove those measured values reach
        // the rendered register, then capture responsive, light and RTL states.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'applications'; return true; })()`,
          true
        );
        const appsDeadline = Date.now() + 45000;
        let appsUiReady = false;
        while (Date.now() < appsDeadline) {
          await sleep(500);
          appsUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const workspace = document.querySelector('[data-testid="apps-workspace"]');
               const banner = document.querySelector('[data-testid="apps-native-banner"]');
               const required = document.querySelector('[data-testid="apps-native-required"]');
               const installed = document.querySelector('[data-testid="apps-kpi-installed-value"]')?.textContent?.trim() || '';
               const publishers = document.querySelector('[data-testid="apps-kpi-publishers-value"]')?.textContent?.trim() || '';
               const rows = document.querySelectorAll('[data-testid="apps-register-row"]').length;
               const dossier = document.querySelector('[data-testid="apps-dossier"]');
               const services = document.querySelector('[data-testid="apps-services"]');
               const bannerText = banner?.innerText || '';
               return Boolean(workspace) && Boolean(banner) && !required &&
                 installed !== '' && installed !== '—' &&
                 publishers !== '' && publishers !== '—' &&
                 rows >= 1 && Boolean(dossier) && Boolean(services) &&
                 /Measured native inventory|جرد أصلي مقيس/.test(bannerText);
             })()`,
            true
          );
          if (appsUiReady) break;
        }
        await sleep(1200);
        const appsShotPath = smokeShotPath.replace(/native-bridge/i, 'applications-measured');
        const appsImage = await win.webContents.capturePage();
        await fsp.writeFile(appsShotPath, appsImage.toPNG());
        receipt.applicationsScreenshot = appsShotPath;
        receipt.applicationsScreenshotBytes = (await fsp.stat(appsShotPath)).size;
        receipt.applicationsUiReady = appsUiReady;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[aria-pressed]')?.click()`,
          true
        );
        await sleep(900);
        const appsLightPath = appsShotPath.replace(/\.png$/i, '-light.png');
        const appsLightImage = await win.webContents.capturePage();
        await fsp.writeFile(appsLightPath, appsLightImage.toPNG());
        receipt.applicationsLightScreenshot = appsLightPath;
        receipt.applicationsLightScreenshotBytes = (await fsp.stat(appsLightPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(1000);
        const appsArabicPath = appsShotPath.replace(/\.png$/i, '-ar-light.png');
        const appsArabicImage = await win.webContents.capturePage();
        await fsp.writeFile(appsArabicPath, appsArabicImage.toPNG());
        receipt.applicationsArabicScreenshot = appsArabicPath;
        receipt.applicationsArabicScreenshotBytes = (await fsp.stat(appsArabicPath)).size;

        await win.webContents.executeJavaScript(
          `(() => {
             document.querySelector('button[title="Toggle Arabic / English"]')?.click();
             document.querySelector('button[aria-pressed]')?.click();
             return true;
           })()`,
          true
        );
        await sleep(900);
        win.setContentSize(1366, 768);
        await sleep(900);
        const apps1366Path = appsShotPath.replace(/\.png$/i, '-1366.png');
        const apps1366Image = await win.webContents.capturePage();
        await fsp.writeFile(apps1366Path, apps1366Image.toPNG());
        receipt.applications1366Screenshot = apps1366Path;
        receipt.applications1366ScreenshotBytes = (await fsp.stat(apps1366Path)).size;

        const apps1366Layout = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="apps-workspace"]');
             const register = document.querySelector('[data-testid="apps-register"]');
             const dossier = document.querySelector('[data-testid="apps-dossier"]');
             const banner = document.querySelector('[data-testid="apps-native-banner"]');
             if (!main || !register || !dossier || !banner) return { ok: false, reason: 'applications panels missing' };
             const mainRect = main.getBoundingClientRect();
             const registerRect = register.getBoundingClientRect();
             const dossierRect = dossier.getBoundingClientRect();
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             const withinWidth = (rect) => rect.left >= mainRect.left - 1 && rect.right <= mainRect.right + 1;
             const sideBySide = Math.abs(registerRect.top - dossierRect.top) <= 2
               && registerRect.right <= dossierRect.left + 1;
             const registerFit = withinWidth(registerRect) && registerRect.bottom <= mainRect.bottom + 1;
             const dossierFit = withinWidth(dossierRect) && dossierRect.bottom <= mainRect.bottom + 1;
             const beforeTop = main.scrollTop;
             main.scrollTop = main.scrollHeight;
             const scrollWorked = main.scrollTop > beforeTop || main.scrollHeight <= main.clientHeight + 2;
             return {
               ok: sideBySide && registerFit && dossierFit && !horizontalOverflow && scrollWorked,
               horizontalOverflow,
               scrollWorked,
               sideBySide,
               registerFit,
               dossierFit,
               registerWidth: Math.round(registerRect.width),
               dossierWidth: Math.round(dossierRect.width),
               registerTop: Math.round(registerRect.top),
               dossierTop: Math.round(dossierRect.top),
               mainBottom: Math.round(mainRect.bottom),
               viewportWidth: window.innerWidth,
             };
           })()`,
          true
        );
        receipt.applications1366Layout = apps1366Layout;
        await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="apps-workspace"]');
             if (main) main.scrollTop = 0;
             return true;
           })()`,
          true
        );
        await sleep(300);

        win.setContentSize(1920, 1080);
        await sleep(900);
        const apps1920Path = appsShotPath.replace(/\.png$/i, '-1920.png');
        const apps1920Image = await win.webContents.capturePage();
        await fsp.writeFile(apps1920Path, apps1920Image.toPNG());
        receipt.applications1920Screenshot = apps1920Path;
        receipt.applications1920ScreenshotBytes = (await fsp.stat(apps1920Path)).size;
        win.setContentSize(1672, 941);
        await sleep(400);

        // Measured Clean Room route: the probe above ran a real bounded
        // discovery session. Load the route, wait for the measured ledger and
        // capture light, RTL, compact and wide states.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'cleanup'; return true; })()`,
          true
        );
        const cleanupDeadline = Date.now() + 45000;
        let cleanupUiReady = false;
        while (Date.now() < cleanupDeadline) {
          await sleep(500);
          cleanupUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const workspace = document.querySelector('[data-testid="cleanup-workspace"]');
               const banner = document.querySelector('[data-testid="cleanup-native-banner"]');
               const required = document.querySelector('[data-testid="cleanup-native-required"]');
               const eligible = document.querySelector('[data-testid="cleanup-kpi-eligible-value"]')?.textContent?.trim() || '';
               const candidates = document.querySelector('[data-testid="cleanup-kpi-candidates-value"]')?.textContent?.trim() || '';
               const rows = document.querySelectorAll('[data-testid="cleanup-candidate-row"]').length;
               const inspector = document.querySelector('[data-testid="cleanup-inspector"]');
               const services = document.querySelector('[data-testid="cleanup-services"]');
               const bannerText = banner?.innerText || '';
               return Boolean(workspace) && Boolean(banner) && !required &&
                 eligible !== '' && eligible !== '—' &&
                 candidates !== '' && candidates !== '—' &&
                 rows >= 1 && Boolean(inspector) && Boolean(services) &&
                 /Measured Clean Room|غرفة تنظيف مقيسة/.test(bannerText);
             })()`,
            true
          );
          if (cleanupUiReady) break;
        }
        // Open every one of the twelve workbenches once. A branch that throws
        // would unmount the workspace, so this probe is the runtime proof that
        // each measured route renders and closes cleanly.
        const cleanupServiceProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const ids = ${JSON.stringify([
               'cleanup-temp-preview',
               'cleanup-temp-quarantine',
               'cleanup-temp-undo',
               'cleanup-quarantine-list',
               'cleanup-estimate',
               'cleanup-recycle',
               'cleanup-unused',
               'cleanup-update-cache',
               'cleanup-browser-cache',
               'cleanup-logs',
               'cleanup-schedule',
               'cleanup-reports',
             ])};
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             for (const id of ids) {
               const card = document.querySelector('[data-testid="cleanup-service-' + id + '"]');
               if (!card) { failures.push(id + ':card-missing'); continue; }
               card.click();
               await wait(220);
               const workspace = document.querySelector('[data-testid="cleanup-service-workspace-' + id + '"]');
               const body = workspace ? workspace.querySelector('.cln-service-body') : null;
               const text = workspace ? String(workspace.innerText || '').trim() : '';
               if (!workspace || !body || text.length < 30) {
                 failures.push(id + ':render');
               } else {
                 const close = workspace.querySelector('button[aria-label="Close service"], button[aria-label="إغلاق الخدمة"]');
                 if (!close) failures.push(id + ':close-missing');
                 else close.click();
               }
               await wait(180);
               if (document.querySelector('[data-testid="cleanup-service-workspace-' + id + '"]')) {
                 failures.push(id + ':close-failed');
                 const stray = document.querySelector('[data-testid="cleanup-service-workspace-' + id + '"] button[aria-label="Close service"], [data-testid="cleanup-service-workspace-' + id + '"] button[aria-label="إغلاق الخدمة"]');
                 if (stray) stray.click();
                 await wait(160);
               }
             }
             return { ok: failures.length === 0, checked: ids.length, failures };
           })()`,
          true
        );
        receipt.cleanupServiceProbe = cleanupServiceProbe;
        await sleep(500);
        const cleanupShotPath = smokeShotPath.replace(/native-bridge/i, 'cleanup-measured');
        const cleanupImage = await win.webContents.capturePage();
        await fsp.writeFile(cleanupShotPath, cleanupImage.toPNG());
        receipt.cleanupScreenshot = cleanupShotPath;
        receipt.cleanupScreenshotBytes = (await fsp.stat(cleanupShotPath)).size;
        receipt.cleanupUiReady = cleanupUiReady;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[aria-pressed]')?.click()`,
          true
        );
        await sleep(900);
        const cleanupLightPath = cleanupShotPath.replace(/\.png$/i, '-light.png');
        const cleanupLightImage = await win.webContents.capturePage();
        await fsp.writeFile(cleanupLightPath, cleanupLightImage.toPNG());
        receipt.cleanupLightScreenshot = cleanupLightPath;
        receipt.cleanupLightScreenshotBytes = (await fsp.stat(cleanupLightPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(1000);
        const cleanupArabicPath = cleanupShotPath.replace(/\.png$/i, '-ar-light.png');
        const cleanupArabicImage = await win.webContents.capturePage();
        await fsp.writeFile(cleanupArabicPath, cleanupArabicImage.toPNG());
        receipt.cleanupArabicScreenshot = cleanupArabicPath;
        receipt.cleanupArabicScreenshotBytes = (await fsp.stat(cleanupArabicPath)).size;

        await win.webContents.executeJavaScript(
          `(() => {
             document.querySelector('button[title="Toggle Arabic / English"]')?.click();
             document.querySelector('button[aria-pressed]')?.click();
             return true;
           })()`,
          true
        );
        await sleep(900);
        win.setContentSize(1366, 768);
        await sleep(900);
        const cleanup1366Path = cleanupShotPath.replace(/\.png$/i, '-1366.png');
        const cleanup1366Image = await win.webContents.capturePage();
        await fsp.writeFile(cleanup1366Path, cleanup1366Image.toPNG());
        receipt.cleanup1366Screenshot = cleanup1366Path;
        receipt.cleanup1366ScreenshotBytes = (await fsp.stat(cleanup1366Path)).size;

        const cleanup1366Layout = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="cleanup-workspace"]');
             const register = document.querySelector('[data-testid="cleanup-register"]');
             const inspector = document.querySelector('[data-testid="cleanup-inspector"]');
             const banner = document.querySelector('[data-testid="cleanup-native-banner"]');
             if (!main || !register || !inspector || !banner) return { ok: false, reason: 'cleanup panels missing' };
             const mainRect = main.getBoundingClientRect();
             const registerRect = register.getBoundingClientRect();
             const inspectorRect = inspector.getBoundingClientRect();
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             const withinWidth = (rect) => rect.left >= mainRect.left - 1 && rect.right <= mainRect.right + 1;
             const sideBySide = Math.abs(registerRect.top - inspectorRect.top) <= 2
               && registerRect.right <= inspectorRect.left + 1;
             const registerFit = withinWidth(registerRect) && registerRect.bottom <= mainRect.bottom + 1;
             const inspectorFit = withinWidth(inspectorRect) && inspectorRect.bottom <= mainRect.bottom + 1;
             const beforeTop = main.scrollTop;
             main.scrollTop = main.scrollHeight;
             const scrollWorked = main.scrollTop > beforeTop || main.scrollHeight <= main.clientHeight + 2;
             return {
               ok: sideBySide && registerFit && inspectorFit && !horizontalOverflow && scrollWorked,
               horizontalOverflow,
               scrollWorked,
               sideBySide,
               registerFit,
               inspectorFit,
               registerWidth: Math.round(registerRect.width),
               inspectorWidth: Math.round(inspectorRect.width),
               mainBottom: Math.round(mainRect.bottom),
               viewportWidth: window.innerWidth,
             };
           })()`,
          true
        );
        receipt.cleanup1366Layout = cleanup1366Layout;
        await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="cleanup-workspace"]');
             if (main) main.scrollTop = 0;
             return true;
           })()`,
          true
        );
        await sleep(300);

        win.setContentSize(1920, 1080);
        await sleep(900);
        const cleanup1920Path = cleanupShotPath.replace(/\.png$/i, '-1920.png');
        const cleanup1920Image = await win.webContents.capturePage();
        await fsp.writeFile(cleanup1920Path, cleanup1920Image.toPNG());
        receipt.cleanup1920Screenshot = cleanup1920Path;
        receipt.cleanup1920ScreenshotBytes = (await fsp.stat(cleanup1920Path)).size;
        win.setContentSize(1672, 941);
        await sleep(400);
      } catch (error) {
        receipt.screenshotError = redactError(error);
      }
    }

    let windowControlOk = false;
    try {
      await win.webContents.executeJavaScript(`window.knouxShell.windowControl('maximize')`, true);
      await sleep(500);
      const maximized = win.isMaximized();
      await win.webContents.executeJavaScript(`window.knouxShell.windowControl('maximize')`, true);
      await sleep(300);
      windowControlOk = maximized && !win.isMaximized();
      trace(`window control maximize toggle=${windowControlOk}`);
    } catch (error) {
      trace(`window control test failed: ${error?.message || error}`);
    }
    const securityOk =
      receipt.security.preloadExposedBridge === true &&
      receipt.security.contextIsolation === true &&
      receipt.security.sandbox === true &&
      receipt.security.nodeIntegration === false &&
      receipt.security.webSecurity === true &&
      receipt.security.webviewTag === false;
    const bridgeOk =
      renderer.bridgePresent === true &&
      renderer.contractVersion === contract.contractVersion &&
      renderer.nodeRequireType === 'undefined' &&
      renderer.nodeProcessType === 'undefined';
    const providerOk =
      ['complete', 'partial'].includes(renderer.system?.status) &&
      renderer.system?.source &&
      renderer.system?.provenance?.mode === 'measured' &&
      ['complete', 'partial'].includes(renderer.services?.status) &&
      Number.isFinite(renderer.services?.data?.total);
    const studioData = renderer.studio;
    const studioOk = Boolean(
      studioData?.bridgePresent &&
      studioData?.sources?.data?.length >= 1 &&
      studioData.sources.data[0].fileCount >= 4 &&
      studioData?.query?.status === 'complete' &&
      studioData.query.data?.total >= 4 &&
      studioData?.plan?.status === 'complete' &&
      studioData.plan.data?.previewOnly === true &&
      studioData.plan.data?.execution === 'blocked_explicit_approval_required' &&
      studioData.plan.data?.totals?.files >= 4 &&
      Array.isArray(studioData?.history?.data) &&
      studioData.history.data.length >= 1
    );
    const filesData = renderer.files;
    const filesOk = Boolean(
      filesData?.bridgePresent &&
      filesData?.sources?.data?.length >= 1 &&
      filesData?.query?.status === 'complete' &&
      filesData?.query?.data?.total >= 4 &&
      filesData?.overview?.status === 'complete' &&
      filesData.overview.data?.totals?.files >= 4 &&
      filesData.overview.data?.extensions?.length >= 1 &&
      filesData?.metadata?.status === 'complete' &&
      filesData.metadata.data?.fullPath &&
      filesData?.hash?.status === 'complete' &&
      filesData.hash.data?.digest?.length === 64 &&
      filesData?.emptyFolders?.status === 'complete' &&
      filesData.emptyFolders.data?.mutation === 'none'
    );
    const storageData = renderer.storage;
    const storageOk = Boolean(
      storageData?.bridgePresent &&
      storageData?.volumes?.status === 'complete' &&
      storageData.volumes.data?.volumes?.length >= 1 &&
      storageData?.history?.status === 'complete' &&
      Array.isArray(storageData.history.data?.points) &&
      storageData?.analysis?.status === 'complete' &&
      storageData.analysis.data?.totals?.files >= 4 &&
      storageData.analysis.data?.tree?.sizeBytes >= 1 &&
      storageData.analysis.data?.coverage?.coversWholeVolume === false &&
      storageData?.duplicates?.status === 'complete' &&
      storageData.duplicates.data?.mutation === 'none' &&
      storageData.duplicates.data?.permission === 'read-only'
    );
    const scanData = renderer.scan;
    const scanSession = scanData?.session?.data || null;
    const scanOk = Boolean(
      scanData?.bridgePresent &&
      scanData?.capabilities?.status === 'complete' &&
      scanData.capabilities.data?.readOnly === true &&
      scanData.capabilities.data?.mutation === 'none' &&
      scanData.capabilities.data?.fixtureFallback === false &&
      scanData.capabilities.data?.services?.length === 10 &&
      scanData?.sources?.data?.length >= 1 &&
      scanSession &&
      ['complete', 'partial'].includes(scanSession.status) &&
      scanSession.summary?.filesIndexed >= 4 &&
      scanSession.summary?.stagesCompleted >= 4 &&
      scanSession.services?.length >= 1 &&
      scanSession.services.every((service) => service.permission === 'read-only' && service.mutation === 'none') &&
      scanSession.findings?.length >= 1 &&
      Array.isArray(scanData?.history?.data) &&
      scanData.history.data.length >= 1
    );
    const smartScanLayoutOk = receipt.smartScan1366Layout?.ok === true
      && receipt.smartScan1366Layout?.horizontalOverflow === false
      && receipt.smartScanWideLayout?.ok === true
      && receipt.smartScanWideLayout?.horizontalOverflow === false;
    const appsData = renderer.apps;
    const appsInventory = appsData?.inventory?.data || null;
    const appsPlan = appsData?.plan?.data || null;
    const appsOk = Boolean(
      appsData?.bridgePresent &&
      renderer.appsBridgePresent === true &&
      appsData?.capabilities?.status === 'complete' &&
      appsData.capabilities.data?.readOnly === true &&
      appsData.capabilities.data?.mutation === 'none' &&
      appsData.capabilities.data?.fixtureFallback === false &&
      appsData.capabilities.data?.serviceCount === 12 &&
      appsData.capabilities.data?.gatedCount >= 1 &&
      appsData?.inventory?.status === 'complete' &&
      appsInventory?.contract === 'apps.v1' &&
      appsInventory?.readOnly === true &&
      appsInventory?.mutation === 'none' &&
      appsInventory?.appCount >= 1 &&
      appsInventory?.kpis?.installed === appsInventory.appCount &&
      appsInventory?.coverage?.returned === appsInventory.appCount &&
      typeof appsInventory?.warningCount === 'number' &&
      appsData?.signature?.status === 'complete' &&
      appsData.signature.data?.appId === appsInventory.firstAppId &&
      ['unchecked', 'valid', 'invalid', 'unsigned', 'unknown', 'unavailable'].includes(appsData.signature.data?.status) &&
      appsData?.associations?.status === 'complete' &&
      typeof appsData.associations.data?.extensions === 'number' &&
      typeof appsData.associations.data?.protocols === 'number' &&
      appsData?.leftovers?.status === 'complete' &&
      appsData.leftovers.data?.mutation === 'none' &&
      typeof appsData.leftovers.data?.candidateCount === 'number' &&
      appsData?.updates?.status === 'complete' &&
      ['not-checked', 'available', 'unavailable', 'failed', 'unsupported'].includes(appsData.updates.data?.status) &&
      appsData?.plan?.status === 'complete' &&
      appsPlan?.contract === 'apps.v1' &&
      appsPlan?.mutation === 'none' &&
      appsPlan?.immutable === true &&
      appsPlan?.execution?.available === false &&
      appsPlan?.execution?.gate &&
      appsPlan?.itemCount === 1
    );
    const appsLayoutOk = receipt.applications1366Layout?.ok === true
      && receipt.applications1366Layout?.horizontalOverflow === false;
    const cleanupData = renderer.cleanup;
    const cleanupSession = cleanupData?.session?.data || null;
    const cleanupInventory = cleanupData?.inventory?.data || null;
    const cleanupPlan = cleanupData?.plan?.data || null;
    const cleanupOk = Boolean(
      cleanupData?.bridgePresent &&
      renderer.cleanupBridgePresent === true &&
      cleanupData?.capabilities?.status === 'complete' &&
      cleanupData.capabilities.data?.readOnly === true &&
      cleanupData.capabilities.data?.mutation === 'none' &&
      cleanupData.capabilities.data?.fixtureFallback === false &&
      cleanupData.capabilities.data?.serviceCount === 12 &&
      cleanupData.capabilities.data?.gatedCount >= 1 &&
      cleanupData.capabilities.data?.categories?.length === 5 &&
      cleanupSession &&
      ['complete', 'partial', 'cancelled'].includes(cleanupSession.status) &&
      Array.isArray(cleanupSession.stages) &&
      cleanupSession.stages.length === 5 &&
      cleanupSession.coverage &&
      cleanupSession.coverage.rootsScanned >= 1 &&
      cleanupData?.inventory?.status === 'complete' &&
      cleanupInventory?.status === 'complete' &&
      cleanupInventory?.readOnly === true &&
      cleanupInventory?.mutation === 'none' &&
      cleanupInventory?.observedAt &&
      typeof cleanupInventory?.candidateCount === 'number' &&
      typeof cleanupInventory?.warningCount === 'number' &&
      cleanupData?.estimate?.status === 'complete' &&
      cleanupData.estimate.data?.mutation === 'none' &&
      cleanupData?.quarantine?.status === 'complete' &&
      cleanupData.quarantine.data?.mutation === 'none' &&
      cleanupData.quarantine.data?.execution?.available === false &&
      cleanupData?.schedule?.status === 'complete' &&
      cleanupData.schedule.data?.mutation === 'none' &&
      cleanupData.schedule.data?.scanOnly === true &&
      cleanupData.schedule.data?.execution?.available === false &&
      cleanupData?.report?.status === 'complete' &&
      cleanupData.report.data?.mutation === 'none' &&
      cleanupData.report.data?.readOnly === true &&
      receipt.cleanupServiceProbe?.ok === true &&
      receipt.cleanupServiceProbe?.checked === 12 &&
      (cleanupPlan === null || (
        cleanupPlan.contract === 'cleanup.v1' &&
        cleanupPlan.mutation === 'none' &&
        cleanupPlan.immutable === true &&
        cleanupPlan.execution?.available === false &&
        cleanupPlan.itemCount === 1
      ))
    );
    const cleanupLayoutOk = receipt.cleanup1366Layout?.ok === true
      && receipt.cleanup1366Layout?.horizontalOverflow === false;
    const screenshotOk = !smokeShotPath || (
      receipt.screenshotBytes > 20000 &&
      receipt.lightScreenshotBytes > 20000 &&
      receipt.arabicScreenshotBytes > 20000 &&
      receipt.studioScreenshotBytes > 20000 &&
      receipt.studioUiReady === true &&
      receipt.studioPlanScreenshotBytes > 20000 &&
      receipt.studioPlanUiReady === true &&
      receipt.studioHistoryScreenshotBytes > 20000 &&
      receipt.studioHistoryUiReady === true &&
      receipt.filesScreenshotBytes > 20000 &&
      receipt.filesUiReady === true &&
      receipt.storageScreenshotBytes > 20000 &&
      receipt.storageUiReady === true &&
      receipt.smartScanScreenshotBytes > 20000 &&
      receipt.smartScanLightScreenshotBytes > 20000 &&
      receipt.smartScanArabicScreenshotBytes > 20000 &&
      receipt.smartScan1366ScreenshotBytes > 20000 &&
      receipt.smartScan1366BottomScreenshotBytes > 20000 &&
      receipt.smartScan1920ScreenshotBytes > 20000 &&
      receipt.smartScanUiReady === true &&
      receipt.applicationsScreenshotBytes > 20000 &&
      receipt.applicationsLightScreenshotBytes > 20000 &&
      receipt.applicationsArabicScreenshotBytes > 20000 &&
      receipt.applications1366ScreenshotBytes > 20000 &&
      receipt.applications1920ScreenshotBytes > 20000 &&
      receipt.applicationsUiReady === true &&
      receipt.cleanupScreenshotBytes > 20000 &&
      receipt.cleanupLightScreenshotBytes > 20000 &&
      receipt.cleanupArabicScreenshotBytes > 20000 &&
      receipt.cleanup1366ScreenshotBytes > 20000 &&
      receipt.cleanup1920ScreenshotBytes > 20000 &&
      receipt.cleanupUiReady === true
    );
    receipt.checks = { securityOk, bridgeOk, providerOk, studioOk, filesOk, storageOk, scanOk, smartScanLayoutOk, appsOk, appsLayoutOk, cleanupOk, cleanupLayoutOk, screenshotOk, windowControlOk };
    receipt.ok = Boolean(securityOk && bridgeOk && providerOk && studioOk && filesOk && storageOk && scanOk && smartScanLayoutOk && appsOk && appsLayoutOk && cleanupOk && cleanupLayoutOk && screenshotOk && windowControlOk);
    receipt.finishedAt = new Date().toISOString();
    trace(`smoke complete ok=${receipt.ok} checks=${JSON.stringify(receipt.checks)}`);
    await fsp.mkdir(path.dirname(smokeReceiptPath), { recursive: true });
    await fsp.writeFile(smokeReceiptPath, JSON.stringify(receipt, null, 2), 'utf8');
    app.exit(receipt.ok ? 0 : 1);
  } catch (error) {
    receipt.error = redactError(error);
    receipt.finishedAt = new Date().toISOString();
    trace(`smoke failed ${receipt.error.code}: ${receipt.error.message}`);
    try {
      await fsp.mkdir(path.dirname(smokeReceiptPath), { recursive: true });
      await fsp.writeFile(smokeReceiptPath, JSON.stringify(receipt, null, 2), 'utf8');
    } catch {
      // Nothing else can be reported; the smoke runner will surface the exit code.
    }
    app.exit(1);
  }
}

app.whenReady().then(async () => {
  trace('whenReady entered');
  Menu.setApplicationMenu(null);
  trace('menu applied');
  if (isDev) {
    console.info('[gemini-shell] development mode; CSP headers are enforced in packaged builds.');
  } else {
    applyPackagedCsp(session.defaultSession);
  }

  trace('constructing studio bridge');
  studioBridge = new StudioBridge({
    userDataPath: app.getPath('userData'),
    nativeImage,
    isPackaged: app.isPackaged,
    env: process.env,
    chooseFolder: async ({ title, buttonLabel }) => {
      const result = await dialog.showOpenDialog(mainWindow || undefined, {
        title,
        buttonLabel,
        properties: ['openDirectory', 'dontAddToRecent'],
      });
      return result.canceled ? null : (result.filePaths?.[0] || null);
    },
    emit: (payload) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(contract.channels.studioEvent, payload);
      }
    },
  });
  try {
    await studioBridge.init();
    filesBridge = new FilesBridge({ studio: studioBridge, shell });
    storageBridge = new StorageBridge({
      studio: studioBridge,
      files: filesBridge,
      readSystemSummary: () => readSystemSummary({ isPackaged: app.isPackaged, env: process.env }),
      userDataPath: app.getPath('userData'),
    });
    await storageBridge.init();
    try {
      scanBridge = new ScanBridge({
        studio: studioBridge,
        files: filesBridge,
        storage: storageBridge,
        readSystemSummary: () => readSystemSummary({ isPackaged: app.isPackaged, env: process.env }),
        readServicesSummary: () => readServicesSummary({ isPackaged: app.isPackaged, env: process.env }),
        loadProvider: () => loadProvider({ isPackaged: app.isPackaged }),
        userDataPath: app.getPath('userData'),
        emit: (payload) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(contract.channels.scanEvent, payload);
          }
        },
      });
      await scanBridge.init();
      trace('scan bridge initialized');
    } catch (error) {
      trace(`scan bridge init failed: ${error?.message || error}`);
      console.error('[gemini-shell] Smart Scan coordinator unavailable:', error?.message || error);
      scanBridge = null;
    }
    try {
      appBridge = new AppBridge({
        loadProvider: () => loadProvider({ isPackaged: app.isPackaged }),
      });
      trace('applications bridge initialized');
    } catch (error) {
      trace(`applications bridge init failed: ${error?.message || error}`);
      console.error('[gemini-shell] Applications coordinator unavailable:', error?.message || error);
      appBridge = null;
    }
    try {
      cleanupBridge = new CleanupBridge({
        studio: studioBridge,
        userDataPath: app.getPath('userData'),
      });
      trace('cleanup bridge initialized');
    } catch (error) {
      trace(`cleanup bridge init failed: ${error?.message || error}`);
      console.error('[gemini-shell] Clean Room coordinator unavailable:', error?.message || error);
      cleanupBridge = null;
    }
    trace('studio bridge initialized');
    const smokeStudioRoot = argValue('--knoux-studio-smoke-root');
    if (smokeStudioRoot && isSmoke && smokeUserData) {
      await studioBridge.addSmokeSource(smokeStudioRoot);
      trace(`studio smoke source indexed: ${smokeStudioRoot}`);
    }
  } catch (error) {
    trace(`studio bridge init failed: ${error?.message || error}`);
    console.error('[gemini-shell] Studio bridge unavailable:', error?.message || error);
  }
  trace('registering ipc');
  registerIpc();
  trace('creating window');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  // A startup rejection before createWindow would otherwise leave a headless
  // Electron process running until the smoke runner times out.
  trace(`startup failed: ${error?.stack || error?.message || error}`);
  console.error('[gemini-shell] startup failed:', error);
  if (isSmoke) app.exit(1);
});

app.on('before-quit', () => {
  cleanupBridge?.dispose();
  appBridge?.dispose();
  scanBridge?.dispose();
  void filesBridge?.dispose();
  void studioBridge?.dispose();
});

app.on('window-all-closed', () => {
  app.quit();
});
