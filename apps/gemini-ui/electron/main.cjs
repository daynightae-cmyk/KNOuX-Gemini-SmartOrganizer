'use strict';

/**
 * KNOuX Gemini — minimal, secure Windows desktop shell.
 *
 * This entrypoint is deliberately separate from the repository root Electron
 * entrypoint: it loads the Gemini renderer (never the legacy root renderer) and
 * exposes only the versioned, read-only platform capabilities. Section engines
 * remain preview-only until their own missions land.
 */

const { app, BrowserWindow, Menu, ipcMain, session, dialog, nativeImage, shell, safeStorage } = require('electron');
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
const { StartupBridge } = require('./native/startup-bridge.cjs');
const { SystemBridge } = require('./native/system-bridge.cjs');
const { RepairBridge } = require('./native/repair-bridge.cjs');
const { ServicesBridge } = require('./native/services-bridge.cjs');
const { AutomationBridge } = require('./native/automation-bridge.cjs');
const { GoogleOAuthService, TokenVault } = require('./native/google-auth.cjs');
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
let startupBridge = null;
let systemBridge = null;
let repairBridge = null;
let servicesBridge = null;
let automationBridge = null;
let googleOAuthService = null;

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

  const STARTUP_TARGET = /^(st|task|svc):[a-f0-9]{24}$/;
  const STARTUP_SESSION = /^[a-f0-9-]{8,64}$/i;
  const startupGuard = async (event, capability, permission, work) => {
    try {
      assertTrustedSender(event, { mainWindow, isDev, distRoot, devOrigin });
      if (!startupBridge) {
        throw Object.assign(new Error('The read-only Boot Control coordinator is not initialized.'), { code: 'STARTUP_UNAVAILABLE' });
      }
      const data = await work();
      return ok({
        capability,
        status: 'complete',
        source: 'KNOuX Boot Control read-only coordinator',
        permission,
        provenance: { mode: 'measured', mutation: 'none' },
        data,
      });
    } catch (error) {
      const untrusted = error?.code === 'UNTRUSTED_SENDER';
      return fail({
        capability,
        status: untrusted ? 'permission_denied' : 'failed',
        source: 'KNOuX Boot Control read-only coordinator',
        permission: untrusted ? 'not-granted' : permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'STARTUP_FAILURE',
          message: String(error?.message || 'Startup request failed.').replace(/\s+/g, ' ').slice(0, 300),
          retryable: Boolean(error?.retryable),
        },
      });
    }
  };
  const startupRequest = (args, code = 'STARTUP_INPUT_INVALID') => {
    if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
      throw Object.assign(new Error('A single structured startup request is required.'), { code });
    }
    return args[0];
  };

  ipcMain.handle(contract.channels.startupCapabilities, (event, ...args) =>
    startupGuard(event, 'startup.capabilities', 'read-only', () => {
      assertNoArguments(args, contract.channels.startupCapabilities);
      return startupBridge.capabilities();
    })
  );
  ipcMain.handle(contract.channels.startupStart, (event, ...args) =>
    startupGuard(event, 'startup.start', 'read-only', () => {
      let request = {};
      if (args.length) request = startupRequest(args);
      for (const key of ['includeTasks', 'includeServices', 'includeBoot']) {
        if (request[key] != null && typeof request[key] !== 'boolean') {
          throw Object.assign(new Error('Startup scan switches must be booleans.'), { code: 'STARTUP_SCAN_INPUT_INVALID' });
        }
      }
      return startupBridge.start(request);
    })
  );
  ipcMain.handle(contract.channels.startupStatus, (event, ...args) =>
    startupGuard(event, 'startup.status', 'read-only', () => {
      const request = startupRequest(args);
      if (typeof request.sessionId !== 'string' || !STARTUP_SESSION.test(request.sessionId)) {
        throw Object.assign(new Error('A valid startup session identifier is required.'), { code: 'STARTUP_SESSION_INVALID' });
      }
      return startupBridge.status(request.sessionId);
    })
  );
  ipcMain.handle(contract.channels.startupCancel, (event, ...args) =>
    startupGuard(event, 'startup.cancel', 'user-initiated', () => {
      const request = startupRequest(args);
      if (typeof request.sessionId !== 'string' || !STARTUP_SESSION.test(request.sessionId)) {
        throw Object.assign(new Error('A valid startup session identifier is required.'), { code: 'STARTUP_SESSION_INVALID' });
      }
      return startupBridge.cancel(request.sessionId);
    })
  );
  ipcMain.handle(contract.channels.startupInventory, (event, ...args) =>
    startupGuard(event, 'startup.inventory', 'read-only', () => {
      assertNoArguments(args, contract.channels.startupInventory);
      return startupBridge.inventory();
    })
  );
  ipcMain.handle(contract.channels.startupServices, (event, ...args) =>
    startupGuard(event, 'startup.services', 'read-only', () => {
      assertNoArguments(args, contract.channels.startupServices);
      return startupBridge.services();
    })
  );
  ipcMain.handle(contract.channels.startupTasks, (event, ...args) =>
    startupGuard(event, 'startup.tasks', 'read-only', () => {
      assertNoArguments(args, contract.channels.startupTasks);
      return startupBridge.tasks();
    })
  );
  ipcMain.handle(contract.channels.startupImpact, (event, ...args) =>
    startupGuard(event, 'startup.impact', 'read-only', () => {
      assertNoArguments(args, contract.channels.startupImpact);
      return startupBridge.impact();
    })
  );
  ipcMain.handle(contract.channels.startupJournal, (event, ...args) =>
    startupGuard(event, 'startup.journal', 'read-only', () => {
      assertNoArguments(args, contract.channels.startupJournal);
      return startupBridge.journal();
    })
  );
  ipcMain.handle(contract.channels.startupSessions, (event, ...args) =>
    startupGuard(event, 'startup.sessions', 'read-only', () => {
      assertNoArguments(args, contract.channels.startupSessions);
      return startupBridge.sessions();
    })
  );
  ipcMain.handle(contract.channels.startupPlan, (event, ...args) =>
    startupGuard(event, 'startup.plan', 'read-only', () => {
      const request = startupRequest(args);
      const ids = request.entryIds;
      if (!Array.isArray(ids) || ids.length < 1 || ids.length > 120
        || !ids.every((id) => typeof id === 'string' && STARTUP_TARGET.test(id))) {
        throw Object.assign(new Error('Between 1 and 120 measured startup target identifiers are required.'), { code: 'STARTUP_PLAN_INPUT_INVALID' });
      }
      if (!['disable', 'enable', 'delay', 'restore', 'batch', 'rollback'].includes(request.mode)) {
        throw Object.assign(new Error('The startup plan mode is not allowlisted.'), { code: 'STARTUP_PLAN_MODE_INVALID' });
      }
      if (request.delayMinutes != null
        && (typeof request.delayMinutes !== 'number' || !Number.isFinite(request.delayMinutes) || request.delayMinutes < 1 || request.delayMinutes > 240)) {
        throw Object.assign(new Error('A delay between 1 and 240 minutes is required.'), { code: 'STARTUP_PLAN_DELAY_INVALID' });
      }
      return startupBridge.plan({
        entryIds: [...new Set(ids)],
        mode: request.mode,
        ...(request.delayMinutes == null ? {} : { delayMinutes: Math.floor(request.delayMinutes) }),
      });
    })
  );
  ipcMain.handle(contract.channels.startupReport, (event, ...args) =>
    startupGuard(event, 'startup.report', 'read-only', () => {
      assertNoArguments(args, contract.channels.startupReport);
      return startupBridge.report();
    })
  );
  ipcMain.handle(contract.channels.startupOpenSettings, (event, ...args) =>
    startupGuard(event, 'startup.settings.open', 'user-initiated', async () => {
      const request = startupRequest(args);
      if (request.target !== 'startupapps') {
        throw Object.assign(new Error('The requested Windows Settings page is not allowlisted.'), { code: 'STARTUP_SETTINGS_TARGET_INVALID' });
      }
      const target = startupBridge.settingsTarget(request.target);
      await shell.openExternal(target.uri);
      return { opened: true, target: target.target };
    })
  );

  const SYSTEM_SESSION = /^[a-f0-9-]{8,64}$/i;
  const SYSTEM_READABLE = (value, max) => typeof value === 'string'
    && value.length <= max
    && !/[\r\n\0]/.test(value);
  const systemGuard = async (event, capability, permission, work) => {
    try {
      assertTrustedSender(event, { mainWindow, isDev, distRoot, devOrigin });
      if (!systemBridge) {
        throw Object.assign(new Error('The read-only Live Pulse observatory is not initialized.'), { code: 'SYSTEM_UNAVAILABLE' });
      }
      const data = await work();
      return ok({
        capability,
        status: 'complete',
        source: 'KNOuX Live Pulse read-only observatory',
        permission,
        provenance: { mode: 'measured', mutation: 'none' },
        data,
      });
    } catch (error) {
      const untrusted = error?.code === 'UNTRUSTED_SENDER';
      return fail({
        capability,
        status: untrusted ? 'permission_denied' : 'failed',
        source: 'KNOuX Live Pulse read-only observatory',
        permission: untrusted ? 'not-granted' : permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'SYSTEM_FAILURE',
          message: String(error?.message || 'System request failed.').replace(/\s+/g, ' ').slice(0, 300),
          retryable: Boolean(error?.retryable),
        },
      });
    }
  };
  const systemRequest = (args, code = 'SYSTEM_INPUT_INVALID') => {
    if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
      throw Object.assign(new Error('A single structured observatory request is required.'), { code });
    }
    return args[0];
  };

  ipcMain.handle(contract.channels.systemCapabilities, (event, ...args) =>
    systemGuard(event, 'system.capabilities', 'read-only', () => {
      assertNoArguments(args, contract.channels.systemCapabilities);
      return systemBridge.capabilities();
    })
  );
  ipcMain.handle(contract.channels.systemStart, (event, ...args) =>
    systemGuard(event, 'system.start', 'read-only', () => {
      assertNoArguments(args, contract.channels.systemStart);
      return systemBridge.start();
    })
  );
  ipcMain.handle(contract.channels.systemStatus, (event, ...args) =>
    systemGuard(event, 'system.status', 'read-only', () => {
      const request = systemRequest(args);
      if (typeof request.sessionId !== 'string' || !SYSTEM_SESSION.test(request.sessionId)) {
        throw Object.assign(new Error('A valid observatory session identifier is required.'), { code: 'SYSTEM_SESSION_INVALID' });
      }
      return systemBridge.status(request.sessionId);
    })
  );
  ipcMain.handle(contract.channels.systemCancel, (event, ...args) =>
    systemGuard(event, 'system.cancel', 'user-initiated', () => {
      const request = systemRequest(args);
      if (typeof request.sessionId !== 'string' || !SYSTEM_SESSION.test(request.sessionId)) {
        throw Object.assign(new Error('A valid observatory session identifier is required.'), { code: 'SYSTEM_SESSION_INVALID' });
      }
      return systemBridge.cancel(request.sessionId);
    })
  );
  ipcMain.handle(contract.channels.systemSnapshot, (event, ...args) =>
    systemGuard(event, 'system.snapshot', 'read-only', () => {
      assertNoArguments(args, contract.channels.systemSnapshot);
      return systemBridge.snapshot();
    })
  );
  ipcMain.handle(contract.channels.systemSample, (event, ...args) =>
    systemGuard(event, 'system.sample', 'read-only', () => {
      assertNoArguments(args, contract.channels.systemSample);
      return systemBridge.sample();
    })
  );
  ipcMain.handle(contract.channels.systemProcesses, (event, ...args) =>
    systemGuard(event, 'system.processes', 'read-only', () => {
      assertNoArguments(args, contract.channels.systemProcesses);
      return systemBridge.processes();
    })
  );
  ipcMain.handle(contract.channels.systemEvents, (event, ...args) =>
    systemGuard(event, 'system.events', 'read-only', () => {
      const request = systemRequest(args);
      const query = {};
      if (request.channel != null) {
        if (!SYSTEM_READABLE(request.channel, 200)) {
          throw Object.assign(new Error('The event channel filter is not valid.'), { code: 'SYSTEM_EVENT_QUERY_INVALID' });
        }
        if (request.channel.trim()) query.channel = request.channel.trim();
      }
      if (request.levels != null) {
        if (!Array.isArray(request.levels) || request.levels.length > 5
          || !request.levels.every((level) => Number.isInteger(level) && level >= 1 && level <= 5)) {
          throw Object.assign(new Error('Event levels must be integers from 1 to 5.'), { code: 'SYSTEM_EVENT_QUERY_INVALID' });
        }
        if (request.levels.length) query.levels = [...new Set(request.levels)];
      }
      if (request.sinceHours != null) {
        if (typeof request.sinceHours !== 'number' || !Number.isFinite(request.sinceHours)
          || request.sinceHours < 1 || request.sinceHours > 720) {
          throw Object.assign(new Error('The event window must be between 1 and 720 hours.'), { code: 'SYSTEM_EVENT_QUERY_INVALID' });
        }
        query.sinceHours = Math.floor(request.sinceHours);
      }
      if (request.search != null) {
        if (!SYSTEM_READABLE(request.search, 120)) {
          throw Object.assign(new Error('The event search text is not valid.'), { code: 'SYSTEM_EVENT_QUERY_INVALID' });
        }
        if (request.search.trim()) query.search = request.search.trim();
      }
      if (request.limit != null) {
        if (!Number.isInteger(request.limit) || request.limit < 1 || request.limit > 200) {
          throw Object.assign(new Error('The event limit must be an integer from 1 to 200.'), { code: 'SYSTEM_EVENT_QUERY_INVALID' });
        }
        query.limit = request.limit;
      }
      return systemBridge.events(query);
    })
  );
  ipcMain.handle(contract.channels.systemSignatures, (event, ...args) =>
    systemGuard(event, 'system.signatures', 'read-only', () => {
      const request = systemRequest(args);
      const paths = request.paths;
      if (!Array.isArray(paths) || paths.length < 1 || paths.length > 24) {
        throw Object.assign(new Error('Between 1 and 24 executable paths are required.'), { code: 'SYSTEM_SIGNATURE_INPUT_INVALID' });
      }
      if (!paths.every((entry) => typeof entry === 'string'
        && entry.length <= 520
        && /^[a-zA-Z]:\\/.test(entry.trim())
        && !/[\r\n\0]/.test(entry))) {
        throw Object.assign(new Error('Every signature path must be an absolute Windows path.'), { code: 'SYSTEM_SIGNATURE_INPUT_INVALID' });
      }
      return systemBridge.signatures([...new Set(paths.map((entry) => entry.trim()))]);
    })
  );
  ipcMain.handle(contract.channels.systemDiagnostics, (event, ...args) =>
    systemGuard(event, 'system.diagnostics', 'read-only', () => {
      const request = systemRequest(args);
      if (!['dns', 'tcp', 'http', 'ping'].includes(request.type)) {
        throw Object.assign(new Error('The diagnostic type must be dns, tcp, http or ping.'), { code: 'SYSTEM_DIAGNOSTIC_TYPE_INVALID' });
      }
      if (request.target == null) {
        throw Object.assign(new Error('A diagnostic target is required.'), { code: 'SYSTEM_TARGET_INVALID' });
      }
      if (request.port != null && (!Number.isInteger(request.port) || request.port < 1 || request.port > 65535)) {
        throw Object.assign(new Error('The TCP port must be an integer from 1 to 65535.'), { code: 'SYSTEM_PORT_INVALID' });
      }
      return systemBridge.diagnostics({
        type: request.type,
        target: request.target,
        ...(request.port == null ? {} : { port: request.port }),
      });
    })
  );
  ipcMain.handle(contract.channels.systemTraceroute, (event, ...args) =>
    systemGuard(event, 'system.traceroute', 'read-only', () => {
      const request = systemRequest(args);
      if (request.target == null) {
        throw Object.assign(new Error('A trace target is required.'), { code: 'SYSTEM_TARGET_INVALID' });
      }
      if (request.maxHops != null && (!Number.isInteger(request.maxHops) || request.maxHops < 1 || request.maxHops > 15)) {
        throw Object.assign(new Error('The hop limit must be an integer from 1 to 15.'), { code: 'SYSTEM_TRACE_INPUT_INVALID' });
      }
      return systemBridge.traceroute({
        target: request.target,
        ...(request.maxHops == null ? {} : { maxHops: request.maxHops }),
      });
    })
  );
  ipcMain.handle(contract.channels.systemHosts, (event, ...args) =>
    systemGuard(event, 'system.hosts', 'read-only', () => {
      assertNoArguments(args, contract.channels.systemHosts);
      return systemBridge.hosts();
    })
  );
  ipcMain.handle(contract.channels.systemHostsPlan, (event, ...args) =>
    systemGuard(event, 'system.hosts.plan', 'read-only', () => {
      const draft = systemRequest(args, 'SYSTEM_HOSTS_DRAFT_INVALID');
      if (!['comment', 'uncomment', 'replace', 'add'].includes(draft.mode)) {
        throw Object.assign(new Error('The hosts draft mode is not allowlisted.'), { code: 'SYSTEM_HOSTS_DRAFT_INVALID' });
      }
      if (draft.lineNumber != null && (!Number.isInteger(draft.lineNumber) || draft.lineNumber < 1 || draft.lineNumber > 5000)) {
        throw Object.assign(new Error('The hosts draft line number is not valid.'), { code: 'SYSTEM_HOSTS_DRAFT_INVALID' });
      }
      if (draft.ip != null && (typeof draft.ip !== 'string' || draft.ip.length > 64)) {
        throw Object.assign(new Error('The hosts draft address is not valid.'), { code: 'SYSTEM_HOSTS_DRAFT_INVALID' });
      }
      if (draft.hostnames != null && (!Array.isArray(draft.hostnames) || draft.hostnames.length > 12
        || !draft.hostnames.every((hostname) => SYSTEM_READABLE(hostname, 253)))) {
        throw Object.assign(new Error('The hosts draft hostnames are not valid.'), { code: 'SYSTEM_HOSTS_DRAFT_INVALID' });
      }
      if (draft.note != null && !SYSTEM_READABLE(draft.note, 240)) {
        throw Object.assign(new Error('The hosts draft note is not valid.'), { code: 'SYSTEM_HOSTS_DRAFT_INVALID' });
      }
      return systemBridge.hostsPlan({
        mode: draft.mode,
        ...(draft.lineNumber == null ? {} : { lineNumber: draft.lineNumber }),
        ...(draft.ip == null ? {} : { ip: draft.ip }),
        ...(draft.hostnames == null ? {} : { hostnames: draft.hostnames }),
        ...(draft.note == null ? {} : { note: draft.note }),
      });
    })
  );
  ipcMain.handle(contract.channels.systemReport, (event, ...args) =>
    systemGuard(event, 'system.report', 'read-only', () => {
      let redact = true;
      if (args.length) {
        const request = systemRequest(args);
        if (request.redact != null && typeof request.redact !== 'boolean') {
          throw Object.assign(new Error('The report redaction switch must be a boolean.'), { code: 'SYSTEM_REPORT_INPUT_INVALID' });
        }
        redact = request.redact !== false;
      }
      return systemBridge.report({ redact });
    })
  );
  ipcMain.handle(contract.channels.systemOpenSettings, (event, ...args) =>
    systemGuard(event, 'system.settings.open', 'user-initiated', async () => {
      const request = systemRequest(args);
      if (!['display', 'network', 'wifi', 'sound'].includes(request.target)) {
        throw Object.assign(new Error('The requested Windows Settings page is not allowlisted.'), { code: 'SYSTEM_SETTINGS_TARGET_INVALID' });
      }
      const target = systemBridge.settingsTarget(request.target);
      await shell.openExternal(target.uri);
      return { opened: true, target: target.target };
    })
  );

  const REPAIR_SESSION = /^[a-f0-9-]{8,64}$/i;
  const repairGuard = async (event, capability, permission, work) => {
    try {
      assertTrustedSender(event, { mainWindow, isDev, distRoot, devOrigin });
      if (!repairBridge) {
        throw Object.assign(new Error('The read-only Recovery Lab is not initialized.'), { code: 'REPAIR_UNAVAILABLE' });
      }
      const data = await work();
      return ok({
        capability,
        status: 'complete',
        source: 'KNOuX Recovery Lab read-only repair evidence',
        permission,
        provenance: { mode: 'measured', mutation: 'none' },
        data,
      });
    } catch (error) {
      const untrusted = error?.code === 'UNTRUSTED_SENDER';
      return fail({
        capability,
        status: untrusted ? 'permission_denied' : 'failed',
        source: 'KNOuX Recovery Lab read-only repair evidence',
        permission: untrusted ? 'not-granted' : permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'REPAIR_FAILURE',
          message: String(error?.message || 'Repair request failed.').replace(/\s+/g, ' ').slice(0, 300),
          retryable: Boolean(error?.retryable),
        },
      });
    }
  };
  const repairRequest = (args, code = 'REPAIR_INPUT_INVALID') => {
    if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
      throw Object.assign(new Error('A single structured Recovery Lab request is required.'), { code });
    }
    return args[0];
  };

  ipcMain.handle(contract.channels.repairCapabilities, (event, ...args) =>
    repairGuard(event, 'repair.capabilities', 'read-only', () => {
      assertNoArguments(args, contract.channels.repairCapabilities);
      return repairBridge.capabilities();
    })
  );
  ipcMain.handle(contract.channels.repairStart, (event, ...args) =>
    repairGuard(event, 'repair.start', 'read-only', () => {
      assertNoArguments(args, contract.channels.repairStart);
      return repairBridge.start();
    })
  );
  ipcMain.handle(contract.channels.repairStatus, (event, ...args) =>
    repairGuard(event, 'repair.status', 'read-only', () => {
      const request = repairRequest(args);
      if (typeof request.sessionId !== 'string' || !REPAIR_SESSION.test(request.sessionId)) {
        throw Object.assign(new Error('A valid repair session identifier is required.'), { code: 'REPAIR_SESSION_INVALID' });
      }
      return repairBridge.status(request.sessionId);
    })
  );
  ipcMain.handle(contract.channels.repairCancel, (event, ...args) =>
    repairGuard(event, 'repair.cancel', 'user-initiated', () => {
      const request = repairRequest(args);
      if (typeof request.sessionId !== 'string' || !REPAIR_SESSION.test(request.sessionId)) {
        throw Object.assign(new Error('A valid repair session identifier is required.'), { code: 'REPAIR_SESSION_INVALID' });
      }
      return repairBridge.cancel(request.sessionId);
    })
  );
  ipcMain.handle(contract.channels.repairSnapshot, (event, ...args) =>
    repairGuard(event, 'repair.snapshot', 'read-only', () => {
      assertNoArguments(args, contract.channels.repairSnapshot);
      return repairBridge.snapshot();
    })
  );
  ipcMain.handle(contract.channels.repairPlan, (event, ...args) =>
    repairGuard(event, 'repair.plan', 'read-only', () => {
      if (args.length !== 1 || !Array.isArray(args[0]) || args[0].length < 1 || args[0].length > 12) {
        throw Object.assign(new Error('A repair plan accepts between one and twelve tool identifiers.'), { code: 'REPAIR_INPUT_INVALID' });
      }
      const toolIds = args[0].filter((entry) => typeof entry === 'string' && entry.length <= 64);
      if (!toolIds.length) {
        throw Object.assign(new Error('No valid repair tool identifier was supplied.'), { code: 'REPAIR_INPUT_INVALID' });
      }
      return repairBridge.plan(toolIds);
    })
  );
  ipcMain.handle(contract.channels.repairJournal, (event, ...args) =>
    repairGuard(event, 'repair.journal', 'read-only', () => {
      assertNoArguments(args, contract.channels.repairJournal);
      return repairBridge.journal();
    })
  );
  ipcMain.handle(contract.channels.repairReport, (event, ...args) =>
    repairGuard(event, 'repair.report', 'read-only', () => {
      if (args.length > 1) {
        throw Object.assign(new Error('At most one report options object is accepted.'), { code: 'REPAIR_INPUT_INVALID' });
      }
      let options = {};
      if (args.length === 1) {
        if (!args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
          throw Object.assign(new Error('The repair report options must be an object.'), { code: 'REPAIR_INPUT_INVALID' });
        }
        options = { redact: args[0].redact !== false };
      }
      return repairBridge.report(options);
    })
  );
  ipcMain.handle(contract.channels.repairOpenSettings, (event, ...args) =>
    repairGuard(event, 'repair.settings.open', 'user-initiated', async () => {
      const request = repairRequest(args);
      if (!['windowsupdate', 'troubleshoot', 'recovery'].includes(request.target)) {
        throw Object.assign(new Error('The requested Windows recovery page is not allowlisted.'), { code: 'REPAIR_SETTINGS_TARGET_INVALID' });
      }
      const target = repairBridge.settingsTarget(request.target);
      await shell.openExternal(target.uri);
      return { opened: true, target: target.target };
    })
  );

  const SERVICES_SESSION = /^[a-f0-9-]{8,64}$/i;
  const servicesGuard = async (event, capability, permission, work) => {
    try {
      assertTrustedSender(event, { mainWindow, isDev, distRoot, devOrigin });
      if (!servicesBridge) {
        throw Object.assign(new Error('The read-only Service Commander is not initialized.'), { code: 'SERVICES_UNAVAILABLE' });
      }
      const data = await work();
      return ok({
        capability,
        status: 'complete',
        source: 'KNOuX Service Commander read-only SCM evidence',
        permission,
        provenance: { mode: 'measured', mutation: 'none' },
        data,
      });
    } catch (error) {
      const untrusted = error?.code === 'UNTRUSTED_SENDER';
      return fail({
        capability,
        status: untrusted ? 'permission_denied' : 'failed',
        source: 'KNOuX Service Commander read-only SCM evidence',
        permission: untrusted ? 'not-granted' : permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'SERVICES_FAILURE',
          message: String(error?.message || 'Service request failed.').replace(/\s+/g, ' ').slice(0, 300),
          retryable: Boolean(error?.retryable),
        },
      });
    }
  };
  const servicesRequest = (args) => {
    if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
      throw Object.assign(new Error('A single structured Service Commander request is required.'), { code: 'SERVICES_INPUT_INVALID' });
    }
    return args[0];
  };

  ipcMain.handle(contract.channels.servicesCapabilities, (event, ...args) =>
    servicesGuard(event, 'services.capabilities', 'read-only', () => {
      assertNoArguments(args, contract.channels.servicesCapabilities);
      return servicesBridge.capabilities();
    })
  );
  ipcMain.handle(contract.channels.servicesStart, (event, ...args) =>
    servicesGuard(event, 'services.start', 'read-only', () => {
      assertNoArguments(args, contract.channels.servicesStart);
      return servicesBridge.start();
    })
  );
  ipcMain.handle(contract.channels.servicesStatus, (event, ...args) =>
    servicesGuard(event, 'services.status', 'read-only', () => {
      const request = servicesRequest(args);
      if (typeof request.sessionId !== 'string' || !SERVICES_SESSION.test(request.sessionId)) {
        throw Object.assign(new Error('A valid service discovery session identifier is required.'), { code: 'SERVICES_SESSION_INVALID' });
      }
      return servicesBridge.status(request.sessionId);
    })
  );
  ipcMain.handle(contract.channels.servicesCancel, (event, ...args) =>
    servicesGuard(event, 'services.cancel', 'user-initiated', () => {
      const request = servicesRequest(args);
      if (typeof request.sessionId !== 'string' || !SERVICES_SESSION.test(request.sessionId)) {
        throw Object.assign(new Error('A valid service discovery session identifier is required.'), { code: 'SERVICES_SESSION_INVALID' });
      }
      return servicesBridge.cancel(request.sessionId);
    })
  );
  ipcMain.handle(contract.channels.servicesSnapshot, (event, ...args) =>
    servicesGuard(event, 'services.snapshot', 'read-only', () => {
      assertNoArguments(args, contract.channels.servicesSnapshot);
      return servicesBridge.snapshot();
    })
  );
  ipcMain.handle(contract.channels.servicesPlan, (event, ...args) =>
    servicesGuard(event, 'services.plan', 'read-only', () => {
      const request = servicesRequest(args);
      if (typeof request.serviceName !== 'string' || request.serviceName.length > 256) {
        throw Object.assign(new Error('A valid service name is required.'), { code: 'SERVICES_NAME_INVALID' });
      }
      if (!['start', 'stop', 'restart', 'startup-type'].includes(request.action)) {
        throw Object.assign(new Error('The requested service action is not supported.'), { code: 'SERVICES_ACTION_INVALID' });
      }
      const payload = { serviceName: request.serviceName, action: request.action };
      if (request.action === 'startup-type') {
        if (!['automatic', 'manual', 'disabled', 'delayed'].includes(request.startupType)) {
          throw Object.assign(new Error('A valid startup type is required.'), { code: 'SERVICES_STARTUP_INVALID' });
        }
        payload.startupType = request.startupType;
      }
      return servicesBridge.plan(payload);
    })
  );
  ipcMain.handle(contract.channels.servicesJournal, (event, ...args) =>
    servicesGuard(event, 'services.journal', 'read-only', () => {
      assertNoArguments(args, contract.channels.servicesJournal);
      return servicesBridge.journal();
    })
  );
  ipcMain.handle(contract.channels.servicesReport, (event, ...args) =>
    servicesGuard(event, 'services.report', 'read-only', () => {
      if (args.length > 1) throw Object.assign(new Error('At most one report options object is accepted.'), { code: 'SERVICES_INPUT_INVALID' });
      let options = {};
      if (args.length === 1) {
        if (!args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
          throw Object.assign(new Error('The service report options must be an object.'), { code: 'SERVICES_INPUT_INVALID' });
        }
        options = { redact: args[0].redact !== false };
      }
      return servicesBridge.report(options);
    })
  );

  const AUTOMATION_SESSION = /^[a-f0-9-]{8,64}$/i;
  const automationGuard = async (event, capability, permission, work) => {
    try {
      assertTrustedSender(event, { mainWindow, isDev, distRoot, devOrigin });
      if (!automationBridge) {
        throw Object.assign(new Error('The local Flow Studio is not initialized.'), { code: 'AUTOMATION_UNAVAILABLE' });
      }
      const data = await work();
      return ok({
        capability,
        status: 'complete',
        source: 'KNOuX Flow Studio local workflow drafts',
        permission,
        provenance: { mode: 'measured', mutation: capability === 'automation.save' ? 'local-draft' : 'none' },
        data,
      });
    } catch (error) {
      const untrusted = error?.code === 'UNTRUSTED_SENDER';
      return fail({
        capability,
        status: untrusted ? 'permission_denied' : 'failed',
        source: 'KNOuX Flow Studio local workflow drafts',
        permission: untrusted ? 'not-granted' : permission,
        error: {
          code: typeof error?.code === 'string' ? error.code : 'AUTOMATION_FAILURE',
          message: String(error?.message || 'Flow Studio request failed.').replace(/\s+/g, ' ').slice(0, 300),
          retryable: Boolean(error?.retryable),
        },
      });
    }
  };
  const automationWorkflowArg = (args, code = 'AUTOMATION_INPUT_INVALID') => {
    if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
      throw Object.assign(new Error('A single workflow object is required.'), { code });
    }
    return args[0];
  };

  ipcMain.handle(contract.channels.automationCapabilities, (event, ...args) =>
    automationGuard(event, 'automation.capabilities', 'read-only', () => {
      assertNoArguments(args, contract.channels.automationCapabilities);
      return automationBridge.capabilities();
    })
  );
  ipcMain.handle(contract.channels.automationStart, (event, ...args) =>
    automationGuard(event, 'automation.start', 'read-only', () => {
      assertNoArguments(args, contract.channels.automationStart);
      return automationBridge.start();
    })
  );
  ipcMain.handle(contract.channels.automationStatus, (event, ...args) =>
    automationGuard(event, 'automation.status', 'read-only', () => {
      if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || typeof args[0].sessionId !== 'string' || !AUTOMATION_SESSION.test(args[0].sessionId)) {
        throw Object.assign(new Error('A valid Flow Studio session identifier is required.'), { code: 'AUTOMATION_SESSION_INVALID' });
      }
      return automationBridge.status(args[0].sessionId);
    })
  );
  ipcMain.handle(contract.channels.automationCancel, (event, ...args) =>
    automationGuard(event, 'automation.cancel', 'user-initiated', () => {
      if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || typeof args[0].sessionId !== 'string' || !AUTOMATION_SESSION.test(args[0].sessionId)) {
        throw Object.assign(new Error('A valid Flow Studio session identifier is required.'), { code: 'AUTOMATION_SESSION_INVALID' });
      }
      return automationBridge.cancel(args[0].sessionId);
    })
  );
  ipcMain.handle(contract.channels.automationSnapshot, (event, ...args) =>
    automationGuard(event, 'automation.snapshot', 'read-only', () => {
      assertNoArguments(args, contract.channels.automationSnapshot);
      return automationBridge.snapshot();
    })
  );
  ipcMain.handle(contract.channels.automationWorkflows, (event, ...args) =>
    automationGuard(event, 'automation.workflows', 'read-only', () => {
      assertNoArguments(args, contract.channels.automationWorkflows);
      return automationBridge.workflows();
    })
  );
  ipcMain.handle(contract.channels.automationSave, (event, ...args) =>
    automationGuard(event, 'automation.save', 'user-initiated', () => automationBridge.save(automationWorkflowArg(args)))
  );
  ipcMain.handle(contract.channels.automationTemplates, (event, ...args) =>
    automationGuard(event, 'automation.templates', 'read-only', () => {
      assertNoArguments(args, contract.channels.automationTemplates);
      return automationBridge.templates();
    })
  );
  ipcMain.handle(contract.channels.automationDryRun, (event, ...args) =>
    automationGuard(event, 'automation.dryRun', 'read-only', () => automationBridge.dryRun(automationWorkflowArg(args)))
  );
  ipcMain.handle(contract.channels.automationSchedulePreview, (event, ...args) =>
    automationGuard(event, 'automation.schedulePreview', 'read-only', () => {
      if (args.length !== 1 || !args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) {
        throw Object.assign(new Error('A single schedule specification is required.'), { code: 'AUTOMATION_SCHEDULE_INVALID' });
      }
      return automationBridge.schedulePreview(args[0]);
    })
  );
  ipcMain.handle(contract.channels.automationValidateImport, (event, ...args) =>
    automationGuard(event, 'automation.validateImport', 'read-only', () => {
      if (args.length !== 1) throw Object.assign(new Error('A single workflow import payload is required.'), { code: 'AUTOMATION_INPUT_INVALID' });
      const payload = args[0];
      if (typeof payload === 'string' && payload.length > 200000) {
        throw Object.assign(new Error('The workflow import exceeds the 200 KB limit.'), { code: 'AUTOMATION_INPUT_INVALID' });
      }
      return automationBridge.validateImport(payload);
    })
  );
  ipcMain.handle(contract.channels.automationJournal, (event, ...args) =>
    automationGuard(event, 'automation.journal', 'read-only', () => {
      assertNoArguments(args, contract.channels.automationJournal);
      return automationBridge.journal();
    })
  );
  ipcMain.handle(contract.channels.automationReport, (event, ...args) =>
    automationGuard(event, 'automation.report', 'read-only', () => {
      if (args.length > 1) throw Object.assign(new Error('At most one report options object is accepted.'), { code: 'AUTOMATION_INPUT_INVALID' });
      let options = {};
      if (args.length === 1) {
        if (!args[0] || typeof args[0] !== 'object' || Array.isArray(args[0])) throw Object.assign(new Error('The Flow Studio report options must be an object.'), { code: 'AUTOMATION_INPUT_INVALID' });
        options = { redact: args[0].redact !== false };
      }
      return automationBridge.report(options);
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
  const googleGuard = (event, capability, args, permission, work) =>
    guard(event, capability, args, async (callArgs) => {
      if (!googleOAuthService) {
        return fail({
          capability,
          status: 'failed',
          source: 'Google OAuth main-process coordinator',
          permission: 'not-granted',
          error: { code: 'GOOGLE_UNAVAILABLE', message: 'The Google OAuth coordinator is not initialized.', retryable: false },
        });
      }
      try {
        const data = await work(callArgs);
        return ok({
          capability,
          status: 'complete',
          source: 'Google OAuth main-process coordinator',
          permission,
          data,
        });
      } catch (error) {
        return fail({
          capability,
          status: 'failed',
          source: 'Google OAuth main-process coordinator',
          permission: 'not-granted',
          error: {
            code: typeof error?.code === 'string' ? error.code : 'GOOGLE_ERROR',
            message: typeof error?.message === 'string' ? error.message : 'The Google operation failed.',
            retryable: Boolean(error?.retryable),
          },
        });
      }
    });

  ipcMain.handle(contract.channels.googleStatus, (event, ...args) =>
    googleGuard(event, 'google.status', args, 'read-only', async (callArgs) => {
      assertNoArguments(callArgs, 'google.status');
      return googleOAuthService.getStatus();
    })
  );

  ipcMain.handle(contract.channels.googleConnect, (event, ...args) =>
    googleGuard(event, 'google.connect', args, 'user-authorized', async (callArgs) => {
      assertNoArguments(callArgs, 'google.connect');
      return googleOAuthService.connect();
    })
  );

  ipcMain.handle(contract.channels.googleCancel, (event, ...args) =>
    googleGuard(event, 'google.cancel', args, 'user-authorized', async (callArgs) => {
      assertNoArguments(callArgs, 'google.cancel');
      return googleOAuthService.cancelConnect();
    })
  );

  ipcMain.handle(contract.channels.googleDisconnect, (event, ...args) =>
    googleGuard(event, 'google.disconnect', args, 'user-authorized', async (callArgs) => {
      assertNoArguments(callArgs, 'google.disconnect');
      return googleOAuthService.disconnect();
    })
  );

  ipcMain.handle(contract.channels.googleSheetsList, (event, ...args) =>
    googleGuard(event, 'google.sheets.list', args, 'read-only', async (callArgs) => {
      assertNoArguments(callArgs, 'google.sheets.list');
      return googleOAuthService.listSelectedSheets();
    })
  );

  ipcMain.handle(contract.channels.googleSheetAdd, (event, ...args) =>
    googleGuard(event, 'google.sheets.add', args, 'user-initiated', async (callArgs) => {
      const payload = callArgs[0];
      if (!payload || typeof payload !== 'object' || typeof payload.input !== 'string' || payload.input.length > 2048) {
        throw Object.assign(new Error('A spreadsheet URL or ID string is required.'), { code: 'GOOGLE_INPUT_INVALID' });
      }
      return googleOAuthService.addSpreadsheet(payload.input);
    })
  );

  ipcMain.handle(contract.channels.googleSheetRemove, (event, ...args) =>
    googleGuard(event, 'google.sheets.remove', args, 'user-initiated', async (callArgs) => {
      const payload = callArgs[0];
      if (!payload || typeof payload !== 'object' || typeof payload.id !== 'string' || payload.id.length > 160) {
        throw Object.assign(new Error('A spreadsheet ID string is required.'), { code: 'GOOGLE_INPUT_INVALID' });
      }
      return googleOAuthService.removeSpreadsheet(payload.id);
    })
  );

  ipcMain.handle(contract.channels.googleSheetRead, (event, ...args) =>
    googleGuard(event, 'google.sheets.read', args, 'read-only', async (callArgs) => {
      const payload = callArgs[0];
      if (!payload || typeof payload !== 'object' || typeof payload.id !== 'string' || payload.id.length > 160) {
        throw Object.assign(new Error('A selected spreadsheet ID is required.'), { code: 'GOOGLE_INPUT_INVALID' });
      }
      if (payload.range != null && (typeof payload.range !== 'string' || payload.range.length > 160)) {
        throw Object.assign(new Error('The sheet range is invalid.'), { code: 'GOOGLE_SHEET_RANGE_INVALID' });
      }
      if (payload.majorDimension != null && payload.majorDimension !== 'ROWS' && payload.majorDimension !== 'COLUMNS') {
        throw Object.assign(new Error('The sheet dimension is invalid.'), { code: 'GOOGLE_INPUT_INVALID' });
      }
      return googleOAuthService.readSheet(payload);
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
  const forceSize = async (width, height) => {
    try {
      if (win.isMaximized()) {
        win.unmaximize();
        await sleep(400);
      }
    } catch {
      // The size assertion below reports the real outcome.
    }
    if (!win.isVisible()) {
      win.show();
      await sleep(300);
    }
    // Frameless window: outer bounds equal the renderer content size. An
    // explicit position also leaves any Windows snap region before resizing.
    win.setBounds({ x: 40, y: 40, width, height }, false);
    await sleep(500);
    const [actualWidth, actualHeight] = win.getSize();
    trace(`smoke size requested=${width}x${height} actual=${actualWidth}x${actualHeight}`);
    return { width: actualWidth, height: actualHeight };
  };
  try {
    trace('smoke start');
    // The smoke window is shown for real captures. Ignore pointer input so a
    // person at the desktop cannot connect an account or change product state
    // while the automated evidence is being collected.
    try {
      win.setIgnoreMouseEvents(true, { forward: true });
      win.setFocusable(false);
    } catch {
      // Capture evidence still proceeds if the platform rejects these flags.
    }
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

    // Prove the real Windows safeStorage/DPAPI vault round trip with a
    // disposable, clearly fake token. No Google request or real credential is
    // involved; the probe file is removed immediately.
    try {
      const vaultPath = path.join(smokeUserData || app.getPath('userData'), 'google-vault-probe.bin');
      const probeVault = new TokenVault({ safeStorage, filePath: vaultPath });
      const dummy = {
        version: 1,
        refreshToken: 'smoke-only-not-a-real-google-refresh-token',
        account: null,
        grantedScopes: [],
        obtainedAt: new Date().toISOString(),
      };
      await probeVault.save(dummy);
      const loaded = await probeVault.load();
      const encrypted = await fsp.readFile(vaultPath);
      const noPlaintext = !encrypted.toString('utf8').includes(dummy.refreshToken);
      await probeVault.clear();
      const cleared = !(await fsp.stat(vaultPath).then(() => true).catch(() => false));
      receipt.googleVaultOk = loaded.refreshToken === dummy.refreshToken && noPlaintext && cleared;
    } catch (error) {
      receipt.googleVaultOk = false;
      receipt.googleVaultError = redactError(error);
    }

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
            // Persistence can settle just after the terminal status response.
            // Retry the read-only history for a bounded window instead of
            // turning a timing race into a false product failure.
            const historyDeadline = Date.now() + 6000;
            while ((!Array.isArray(history?.data) || history.data.length === 0) && Date.now() < historyDeadline) {
              await new Promise((resolve) => setTimeout(resolve, 250));
              history = await scanApi.history();
            }
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
        let cleanup = null;        if (cleanupApi) {
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
        const startupApi = window.knouxStartupV1;
        let startup = null;
        if (startupApi) {
          const capabilities = await startupApi.capabilities();
          const started = await startupApi.start({});
          let session = started;
          const sessionId = started?.data?.id || null;
          if (sessionId) {
            const startupDeadline = Date.now() + 85000;
            while (Date.now() < startupDeadline) {
              session = await startupApi.status(sessionId);
              if (['complete', 'partial', 'cancelled', 'failed'].includes(session?.data?.status)) break;
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
          const inventory = await startupApi.inventory();
          const services = await startupApi.services();
          const tasks = await startupApi.tasks();
          let impact = null;
          let journal = null;
          let sessions = null;
          let report = null;
          let plan = null;
          try {
            impact = await startupApi.impact();
            journal = await startupApi.journal();
            sessions = await startupApi.sessions();
            report = await startupApi.report();
            const firstEntryId = inventory?.data?.entries?.[0]?.id || inventory?.data?.services?.[0]?.id || null;
            if (firstEntryId) plan = await startupApi.plan({ entryIds: [firstEntryId], mode: 'disable' });
          } catch (error) {
            startup = {
              bridgePresent: true,
              error: { code: typeof error?.code === 'string' ? error.code : 'STARTUP_PROBE_FAILED' },
            };
          }
          const startupSummary = (envelope, transform) => envelope
            ? {
                status: envelope.status,
                capability: envelope.capability,
                permission: envelope.permission,
                data: envelope.data ? transform(envelope.data) : null,
                error: envelope.error ? { code: envelope.error.code } : null,
              }
            : null;
          if (!startup) {
            startup = {
              capabilities: startupSummary(capabilities, (data) => ({
                engine: data.engine,
                contract: data.contract,
                readOnly: data.readOnly,
                mutation: data.mutation,
                fixtureFallback: data.fixtureFallback,
                serviceCount: data.services?.length ?? 0,
                gatedCount: data.gatedOperations?.length ?? 0,
              })),
              started: startupSummary(started, (data) => ({ id: data.id, status: data.status })),
              session: startupSummary(session, (data) => ({
                id: data.id,
                status: data.status,
                entryCount: data.entryCount,
                stages: data.stages?.map((entry) => ({ key: entry.key, status: entry.status })) ?? [],
                warningCount: data.warningCount,
              })),
              inventory: startupSummary(inventory, (data) => ({
                status: data.status,
                readOnly: data.readOnly,
                mutation: data.mutation,
                observedAt: data.observedAt,
                entryCount: data.entries?.length ?? 0,
                serviceCount: data.services?.length ?? 0,
                taskCount: data.tasks?.length ?? 0,
                summary: data.summary,
                coverage: data.coverage,
                boot: data.boot ? { available: data.boot.available, eventCount: data.boot.eventCount, lastBootAt: data.boot.lastBootAt } : null,
                warningCount: data.warnings?.length ?? 0,
              })),
              services: startupSummary(services, (data) => ({
                count: data.length,
                automatic: data.filter((entry) => entry.startupType === 'automatic').length,
                delayed: data.filter((entry) => entry.startupType === 'delayed').length,
                protectedCount: data.filter((entry) => entry.protected).length,
              })),
              tasks: startupSummary(tasks, (data) => ({
                count: data.length,
                protectedCount: data.filter((entry) => entry.protected).length,
              })),
              impact: startupSummary(impact, (data) => ({
                available: data.available,
                eventCount: data.events?.length ?? 0,
                attributedCount: data.attributed?.length ?? 0,
              })),
              journal: startupSummary(journal, (data) => ({
                available: data.available,
                status: data.status,
                entryCount: data.entries?.length ?? 0,
                execution: data.execution,
              })),
              sessions: startupSummary(sessions, (data) => ({
                available: data.available,
                count: data.sessions?.length ?? 0,
                execution: data.execution,
              })),
              plan: startupSummary(plan, (data) => ({
                contract: data.contract,
                mode: data.mode,
                itemCount: data.items?.length ?? 0,
                conflictCount: data.conflictCount,
                estimatedSavingsMs: data.estimatedSavingsMs,
                execution: data.execution,
                immutable: data.immutable,
                mutation: data.mutation,
              })),
              report: startupSummary(report, (data) => ({
                readOnly: data.readOnly,
                mutation: data.mutation,
                entryCount: data.entries?.length ?? 0,
                summary: data.summary,
              })),
            };
          }
        }
        // Mission 10 + 11/12/13: prove the versioned bridges from the renderer
        // and warm their bounded read-only sessions in parallel. start() is
        // idempotent, so the route sections later join the same sessions.
        const warmDomain = async (api, contractName) => {
          if (!api) return null;
          const capabilities = await api.capabilities();
          const started = await api.start();
          const session = started?.data?.id ? await api.status(started.data.id) : null;
          const snapshot = await api.snapshot().catch(() => null);
          return {
            bridgePresent: true,
            capabilities,
            started,
            session,
            snapshotValidated: snapshot?.status === 'complete' && snapshot?.data?.contract === contractName,
          };
        };
        const [systemV1, repairV1, servicesV1, automationV1] = await Promise.all([
          warmDomain(window.knouxSystemV1, 'system.v1'),
          warmDomain(window.knouxRepairV1, 'repair.v1'),
          warmDomain(window.knouxServicesV1, 'services.v1'),
          warmDomain(window.knouxAutomationV1, 'automation.v1'),
        ]);
        const googleApi = window.knouxGoogleV1;
        let google = null;
        if (googleApi) {
          try {
            const googleStatus = await googleApi.getStatus();
            google = {
              bridgePresent: true,
              status: googleStatus,
            };
          } catch (error) {
            google = { bridgePresent: true, status: null, probeError: String(error?.message || error) };
          }
        }
        const systemV1Api = window.knouxSystemV1;
        const repairV1Api = window.knouxRepairV1;
        const servicesV1Api = window.knouxServicesV1;
        const automationV1Api = window.knouxAutomationV1;
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
          startupBridgePresent: Boolean(startupApi),
          systemV1BridgePresent: Boolean(systemV1Api),
          repairV1BridgePresent: Boolean(repairV1Api),
          servicesV1BridgePresent: Boolean(servicesV1Api),
          automationV1BridgePresent: Boolean(automationV1Api),
          googleBridgePresent: Boolean(googleApi),
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
          startup,
          systemV1,
          repairV1,
          servicesV1,
          automationV1,
          google,
          cspMeta: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') || null
        };
      })()`,
      true
    );
    const renderer = await Promise.race([
      rendererProbe,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Renderer bridge probe timed out after 300 seconds.')), 300000)),
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
        await sleep(300);
        if (!win.isVisible()) win.show();
        if (win.isMaximized()) win.unmaximize();
        await sleep(600);
        trace(`smoke window visible=${win.isVisible()} size=${JSON.stringify(win.getSize())} content=${JSON.stringify(win.getContentSize())}`);
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
        await forceSize(1366, 768);
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

        await forceSize(1920, 1080);
        await sleep(900);
        const smartScan1920Path = smartScanShotPath.replace(/\.png$/i, '-1920.png');
        const smartScan1920Image = await win.webContents.capturePage();
        await fsp.writeFile(smartScan1920Path, smartScan1920Image.toPNG());
        receipt.smartScan1920Screenshot = smartScan1920Path;
        receipt.smartScan1920ScreenshotBytes = (await fsp.stat(smartScan1920Path)).size;
        await forceSize(1672, 941);
        await sleep(400);

        // Measured Applications route: inventory, signature, associations,
        // leftovers, plan and updates were already probed through the real
        // preload bridge. Load the route and prove those measured values reach
        // the rendered register, then capture responsive, light and RTL states.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'applications'; return true; })()`,
          true
        );
        const appsStartedAt = Date.now();
        const appsDeadline = appsStartedAt + 90000;
        let appsUiReady = false;
        let appsRouteRetries = 0;
        while (Date.now() < appsDeadline) {
          await sleep(500);
          if (!appsUiReady && appsRouteRetries < 4 && Date.now() - appsStartedAt > (appsRouteRetries + 1) * 12000) {
            appsRouteRetries += 1;
            await win.webContents.executeJavaScript(
              `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'home'; return true; })()`,
              true
            );
            await sleep(400);
            await win.webContents.executeJavaScript(`(() => { location.hash = 'applications'; return true; })()`, true);
          }
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
        await forceSize(1366, 768);
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

        await forceSize(1920, 1080);
        await sleep(900);
        const apps1920Path = appsShotPath.replace(/\.png$/i, '-1920.png');
        const apps1920Image = await win.webContents.capturePage();
        await fsp.writeFile(apps1920Path, apps1920Image.toPNG());
        receipt.applications1920Screenshot = apps1920Path;
        receipt.applications1920ScreenshotBytes = (await fsp.stat(apps1920Path)).size;
        await forceSize(1672, 941);
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
               await wait(260);
               const workspace = document.querySelector('[data-testid="cleanup-workbench"]');
               const body = workspace ? workspace.querySelector('[data-testid="cleanup-service-focus"]') : null;
               const text = body ? String(body.innerText || '').trim() : '';
               if (!workspace || !body || text.length < 30) {
                 failures.push(id + ':render');
               } else {
                 const close = workspace.querySelector('[data-testid="workbench-close"]');
                 if (!close) failures.push(id + ':close-missing');
                 else close.click();
               }
               await wait(240);
               if (document.querySelector('[data-testid="cleanup-workbench"]') || document.querySelector('[data-testid="cleanup-workbench-expanded"]')) {
                 failures.push(id + ':close-failed');
                 const stray = document.querySelector('[data-testid="cleanup-workbench"] [data-testid="workbench-close"], [data-testid="cleanup-workbench-expanded"] [data-testid="workbench-close"]');
                 if (stray) stray.click();
                 await wait(180);
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
        await forceSize(1366, 768);
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

        await forceSize(1920, 1080);
        await sleep(900);
        const cleanup1920Path = cleanupShotPath.replace(/\.png$/i, '-1920.png');
        const cleanup1920Image = await win.webContents.capturePage();
        await fsp.writeFile(cleanup1920Path, cleanup1920Image.toPNG());
        receipt.cleanup1920Screenshot = cleanup1920Path;
        receipt.cleanup1920ScreenshotBytes = (await fsp.stat(cleanup1920Path)).size;
        await forceSize(1672, 941);
        await sleep(400);

        // Measured Boot Control route: the probe above ran a real bounded
        // startup inventory. Load the route, prove measured entries reach the
        // register, open all twelve workbenches, then capture theme and size
        // variants. No startup value is ever changed.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'startup'; return true; })()`,
          true
        );
        const startupDeadline = Date.now() + 45000;
        let startupUiReady = false;
        while (Date.now() < startupDeadline) {
          await sleep(500);
          startupUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const workspace = document.querySelector('[data-testid="startup-workspace"]');
               const banner = document.querySelector('[data-testid="startup-native-banner"]');
               const required = document.querySelector('[data-testid="startup-native-required"]');
               const entries = document.querySelector('[data-testid="startup-kpi-entries-value"]')?.textContent?.trim() || '';
               const protectedCount = document.querySelector('[data-testid="startup-kpi-protected-value"]')?.textContent?.trim() || '';
               const rows = document.querySelectorAll('[data-testid="startup-register-row"]').length;
               const inspector = document.querySelector('[data-testid="startup-inspector"]');
               const services = document.querySelector('[data-testid="startup-services"]');
               const bannerText = banner?.innerText || '';
               return Boolean(workspace) && Boolean(banner) && !required &&
                 entries !== '' && entries !== '—' &&
                 protectedCount !== '' && protectedCount !== '—' &&
                 rows >= 1 && Boolean(inspector) && Boolean(services) &&
                 /Measured Boot Control|تحكم الإقلاع المقيس/.test(bannerText);
             })()`,
            true
          );
          if (startupUiReady) break;
        }
        const startupServiceProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const ids = ${JSON.stringify([
               'startup-overview',
               'startup-disable',
               'startup-restore',
               'startup-sources',
               'startup-journal',
               'startup-filter',
               'startup-impact',
               'startup-services',
               'startup-tasks',
               'startup-delay',
               'startup-batch',
               'startup-undo-all',
             ])};
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             for (const id of ids) {
               const card = document.querySelector('[data-testid="startup-service-' + id + '"]');
               if (!card) { failures.push(id + ':card-missing'); continue; }
               card.click();
               await wait(260);
               const workspace = document.querySelector('[data-testid="startup-workbench"]');
               const body = workspace ? workspace.querySelector('[data-testid="startup-service-focus"]') : null;
               const text = body ? String(body.innerText || '').trim() : '';
               if (!workspace || !body || text.length < 30) {
                 failures.push(id + ':render');
               } else {
                 const close = workspace.querySelector('[data-testid="workbench-close"]');
                 if (!close) failures.push(id + ':close-missing');
                 else close.click();
               }
               await wait(240);
               if (document.querySelector('[data-testid="startup-workbench"]') || document.querySelector('[data-testid="startup-workbench-expanded"]')) {
                 failures.push(id + ':close-failed');
                 const stray = document.querySelector('[data-testid="startup-workbench"] [data-testid="workbench-close"], [data-testid="startup-workbench-expanded"] [data-testid="workbench-close"]');
                 if (stray) stray.click();
                 await wait(180);
               }
             }
             return { ok: failures.length === 0, checked: ids.length, failures };
           })()`,
          true
        );
        receipt.startupServiceProbe = startupServiceProbe;
        await sleep(500);
        const startupShotPath = smokeShotPath.replace(/native-bridge/i, 'startup-measured');
        const startupImage = await win.webContents.capturePage();
        await fsp.writeFile(startupShotPath, startupImage.toPNG());
        receipt.startupScreenshot = startupShotPath;
        receipt.startupScreenshotBytes = (await fsp.stat(startupShotPath)).size;
        receipt.startupUiReady = startupUiReady;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[aria-pressed]')?.click()`,
          true
        );
        await sleep(900);
        const startupLightPath = startupShotPath.replace(/\.png$/i, '-light.png');
        const startupLightImage = await win.webContents.capturePage();
        await fsp.writeFile(startupLightPath, startupLightImage.toPNG());
        receipt.startupLightScreenshot = startupLightPath;
        receipt.startupLightScreenshotBytes = (await fsp.stat(startupLightPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(1000);
        const startupArabicPath = startupShotPath.replace(/\.png$/i, '-ar-light.png');
        const startupArabicImage = await win.webContents.capturePage();
        await fsp.writeFile(startupArabicPath, startupArabicImage.toPNG());
        receipt.startupArabicScreenshot = startupArabicPath;
        receipt.startupArabicScreenshotBytes = (await fsp.stat(startupArabicPath)).size;

        await win.webContents.executeJavaScript(
          `(() => {
             document.querySelector('button[title="Toggle Arabic / English"]')?.click();
             document.querySelector('button[aria-pressed]')?.click();
             return true;
           })()`,
          true
        );
        await sleep(900);
        await forceSize(1366, 768);
        await sleep(900);
        const startup1366Path = startupShotPath.replace(/\.png$/i, '-1366.png');
        const startup1366Image = await win.webContents.capturePage();
        await fsp.writeFile(startup1366Path, startup1366Image.toPNG());
        receipt.startup1366Screenshot = startup1366Path;
        receipt.startup1366ScreenshotBytes = (await fsp.stat(startup1366Path)).size;

        const startup1366Layout = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="startup-workspace"]');
             const register = document.querySelector('[data-testid="startup-register"]');
             const inspector = document.querySelector('[data-testid="startup-inspector"]');
             const banner = document.querySelector('[data-testid="startup-native-banner"]');
             if (!main || !register || !inspector || !banner) return { ok: false, reason: 'startup panels missing' };
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
        receipt.startup1366Layout = startup1366Layout;
        await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="startup-workspace"]');
             if (main) main.scrollTop = 0;
             return true;
           })()`,
          true
        );
        await sleep(300);

        await forceSize(1920, 1080);
        await sleep(900);
        const startup1920Path = startupShotPath.replace(/\.png$/i, '-1920.png');
        const startup1920Image = await win.webContents.capturePage();
        await fsp.writeFile(startup1920Path, startup1920Image.toPNG());
        receipt.startup1920Screenshot = startup1920Path;
        receipt.startup1920ScreenshotBytes = (await fsp.stat(startup1920Path)).size;
        await forceSize(1672, 941);
        await sleep(400);

        // Measured Live Pulse route: run the real bounded observatory scan,
        // prove measured instruments, nine-stage coverage and all 36
        // specialised workbenches, then capture theme, RTL and size variants.
        // Nothing is mutated by Mission 10.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'system'; return true; })()`,
          true
        );
        const systemDeadline = Date.now() + 170000;
        let systemUiReady = false;
        while (Date.now() < systemDeadline) {
          await sleep(1000);
          systemUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const workspace = document.querySelector('[data-testid="system-workspace"]');
               const banner = document.querySelector('[data-testid="system-native-banner"]');
               const required = document.querySelector('[data-testid="system-native-required"]');
               const cpu = document.querySelector('[data-testid="system-kpi-cpu-value"]')?.textContent?.trim() || '';
               const worldTabs = document.querySelectorAll('[data-testid="system-world-tabs"] button').length;
               const cards = document.querySelectorAll('[data-testid="system-service-grid"] button[data-testid^="system-service-"]').length;
               const coverage = document.querySelectorAll('[data-testid="system-coverage"] .sys-coverage-row').length;
               const rows = document.querySelectorAll('[data-testid="system-process-row"]').length;
               const bannerText = banner?.innerText || '';
               return Boolean(workspace) && Boolean(banner) && !required &&
                 cpu !== '' && cpu !== '—' && cpu !== '-' &&
                 worldTabs === 3 && cards === 12 && coverage >= 1 && rows >= 1 &&
                 /Measured observatory|المرصد المقيس/.test(bannerText);
             })()`,
            true
          );
          if (systemUiReady) break;
        }
        const systemControlProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             const main = document.querySelector('[data-testid="system-workspace"]');
             if (!main) return { ok: false, failures: ['workspace-missing'] };
             const groups = Array.from(main.querySelectorAll('.sys-timeline-panel .sys-seg'));
             for (let index = 0; index < groups.length; index += 1) {
               const buttons = Array.from(groups[index].querySelectorAll('button'));
               if (buttons.length < 2) { failures.push('group-' + index + ':short'); continue; }
               buttons[1].click();
               await wait(60);
               if (!buttons[1].classList.contains('is-active')) failures.push('group-' + index + ':inactive');
               if (buttons[0]) buttons[0].click();
               await wait(30);
             }
             const pause = Array.from(main.querySelectorAll('.sys-timeline-panel button')).find((button) => /Pause|إيقاف/.test(button.textContent || ''));
             if (!pause) failures.push('pause:missing');
             else {
               pause.click();
               await wait(70);
               if (pause.getAttribute('aria-pressed') !== 'true') failures.push('pause:not-pressed');
               pause.click();
               await wait(50);
               if (pause.getAttribute('aria-pressed') !== 'false') failures.push('pause:not-released');
             }
             const search = main.querySelector('input[aria-label="Find a service"], input[aria-label="بحث عن خدمة"]');
             if (!search) failures.push('search:missing');
             else {
               const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
               setter.call(search, 'log');
               search.dispatchEvent(new Event('input', { bubbles: true }));
               await wait(140);
               const filtered = main.querySelectorAll('[data-testid="system-service-grid"] button[data-testid^="system-service-"]').length;
               if (filtered === 0 || filtered >= 12) failures.push('search:filter-' + filtered);
               setter.call(search, '');
               search.dispatchEvent(new Event('input', { bubbles: true }));
               await wait(140);
             }
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.systemControlProbe = systemControlProbe;
        const systemServiceProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             const seen = new Set();
             const tabs = Array.from(document.querySelectorAll('[data-testid="system-world-tabs"] button'));
             if (tabs.length !== 3) return { ok: false, checked: 0, failures: ['world-tabs:' + tabs.length] };
             for (let tabIndex = 0; tabIndex < tabs.length; tabIndex += 1) {
               tabs[tabIndex].click();
               await wait(240);
               const cards = Array.from(document.querySelectorAll('[data-testid="system-service-grid"] button[data-testid^="system-service-"]'));
               if (cards.length !== 12) failures.push('world-' + tabIndex + ':cards-' + cards.length);
               for (const card of cards) {
                 const id = (card.getAttribute('data-testid') || '').replace('system-service-', '');
                 if (!id) continue;
                 seen.add(id);
                 card.click();
                 let workbench = null;
                 for (let attempt = 0; attempt < 10; attempt += 1) {
                   await wait(100);
                   workbench = document.querySelector('[data-testid="sys-service-workspace-' + id + '"]');
                   if (workbench) break;
                 }
                 const shell = document.querySelector('[data-testid="sys-service-shell-' + id + '"]');
                 const body = workbench ? workbench.querySelector('.sys-wb-body') : null;
                 const text = workbench ? String(workbench.innerText || '').trim() : '';
                 if (!workbench || !shell || !body || text.length < 30) failures.push(id + ':render');
                 else {
                   const segGroups = Array.from(workbench.querySelectorAll('.sys-seg'));
                   for (let groupIndex = 0; groupIndex < Math.min(segGroups.length, 4); groupIndex += 1) {
                     const options = Array.from(segGroups[groupIndex].querySelectorAll('button'));
                     if (options.length < 2) continue;
                     options[1].click();
                     await wait(45);
                     if (!options[1].classList.contains('is-active')) failures.push(id + ':seg-' + groupIndex);
                     options[0].click();
                     await wait(25);
                   }
                   const row = workbench.querySelector('tbody tr');
                   if (row) { row.click(); await wait(45); }
                 }
                 const close = shell ? shell.querySelector('button[aria-label="Close service"], button[aria-label="إغلاق الخدمة"]') : null;
                 if (!close) failures.push(id + ':close-missing');
                 else close.click();
                 await wait(300);
                 if (document.querySelector('[data-testid="sys-service-shell-' + id + '"]')) failures.push(id + ':close-failed');
               }
             }
             tabs[0].click();
             await wait(220);
             return { ok: failures.length === 0 && seen.size === 36, checked: seen.size, failures };
           })()`,
          true
        );
        receipt.systemServiceProbe = systemServiceProbe;
        const systemKeyboardProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const card = document.querySelector('[data-testid="system-service-system-health-check"]');
             if (!card) return { ok: false, reason: 'card-missing' };
             card.focus();
             card.click();
             await wait(450);
             const shellSelector = '[data-testid="sys-service-shell-system-health-check"]';
             const shell = document.querySelector(shellSelector);
             const close = shell ? shell.querySelector('button[aria-label="Close service"], button[aria-label="إغلاق الخدمة"]') : null;
             const focused = Boolean(close) && document.activeElement === close;
             window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
             await wait(320);
             return { ok: focused && !document.querySelector(shellSelector), focused };
           })()`,
          true
        );
        receipt.systemKeyboardProbe = systemKeyboardProbe;
        try {
          const finalSession = systemBridge?.status?.(renderer.systemV1?.session?.data?.id);
          if (finalSession) {
            receipt.systemFinalSession = {
              id: finalSession.id,
              status: finalSession.status,
              progress: finalSession.progress,
              readOnly: finalSession.readOnly,
              mutation: finalSession.mutation,
              warnings: finalSession.warnings.length,
              stages: finalSession.stages.map((stage) => ({
                key: stage.key,
                status: stage.status,
                items: stage.items,
                durationMs: stage.durationMs,
              })),
            };
          }
          const measured = await systemBridge?.snapshot?.();
          if (measured) {
            receipt.systemMeasured = {
              generatedAt: measured.generatedAt,
              receipt: measured.receipt,
              processCount: measured.processCount,
              processRows: measured.processes.length,
              serviceRows: measured.services.length,
              driverRows: measured.drivers.length,
              eventRows: measured.events.length,
              channelRows: measured.eventChannels.length,
              interfaceRows: measured.interfaces.length,
              routeRows: measured.routes.length,
              neighborRows: measured.neighbors.length,
              socketRows: measured.sockets.length,
              startupLinkRows: measured.startupLinks.length,
              hardware: {
                cpu: measured.hardware.cpu.length,
                gpu: measured.hardware.gpu.length,
                memory: measured.hardware.memory.length,
                disks: measured.hardware.disks.length,
                batteries: measured.hardware.batteries.length,
                usb: measured.hardware.usb.length,
                monitors: measured.hardware.monitors.length,
                audio: measured.hardware.audio.length,
                thermalZones: measured.hardware.thermal.zones.length,
                availability: measured.hardware.availability,
              },
              coverage: measured.coverage.map((stage) => ({ key: stage.key, status: stage.status, items: stage.items })),
              warnings: measured.warnings.length,
              sources: measured.sources.length,
              metrics: measured.metrics,
            };
          }
        } catch (error) {
          receipt.systemFinalError = redactError(error);
        }
        await win.webContents.executeJavaScript(
          `(() => { const main = document.querySelector('[data-testid="system-workspace"]'); if (main) main.scrollTop = 0; return true; })()`,
          true
        );
        await sleep(600);
        const systemShotPath = smokeShotPath.replace(/native-bridge/i, 'system-measured');
        const systemImage = await win.webContents.capturePage();
        await fsp.writeFile(systemShotPath, systemImage.toPNG());
        receipt.systemScreenshot = systemShotPath;
        receipt.systemScreenshotBytes = (await fsp.stat(systemShotPath)).size;
        receipt.systemUiReady = systemUiReady;

        // Capture one measured workbench sheet as visual evidence for the
        // specialised service layout. Hardware identity is used deliberately:
        // process dossiers can contain user-profile paths, which must never
        // reach committed screenshots.
        await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const tabs = Array.from(document.querySelectorAll('[data-testid="system-world-tabs"] button'));
             if (tabs[2]) tabs[2].click();
             await wait(320);
             const card = document.querySelector('[data-testid="system-service-hardware-cpu"]');
             if (card) card.click();
             return true;
           })()`,
          true
        );
        await sleep(800);
        const systemWorkbenchPath = systemShotPath.replace(/system-measured/i, 'system-workbench');
        const systemWorkbenchImage = await win.webContents.capturePage();
        await fsp.writeFile(systemWorkbenchPath, systemWorkbenchImage.toPNG());
        receipt.systemWorkbenchScreenshot = systemWorkbenchPath;
        receipt.systemWorkbenchScreenshotBytes = (await fsp.stat(systemWorkbenchPath)).size;
        await win.webContents.executeJavaScript(
          `(() => {
             const close = document.querySelector('[data-testid="sys-service-shell-hardware-cpu"] button[aria-label="Close service"], [data-testid="sys-service-shell-hardware-cpu"] button[aria-label="إغلاق الخدمة"]');
             if (close) close.click();
             const tabs = Array.from(document.querySelectorAll('[data-testid="system-world-tabs"] button'));
             if (tabs[0]) tabs[0].click();
             return true;
           })()`,
          true
        );
        await sleep(500);

        await win.webContents.executeJavaScript(
          `(() => { document.querySelector('button[title="Switch to light theme"], button[title="Switch to dark theme"]')?.click(); return true; })()`,
          true
        );
        await sleep(900);
        const systemLightPath = systemShotPath.replace(/\.png$/i, '-light.png');
        const systemLightImage = await win.webContents.capturePage();
        await fsp.writeFile(systemLightPath, systemLightImage.toPNG());
        receipt.systemLightScreenshot = systemLightPath;
        receipt.systemLightScreenshotBytes = (await fsp.stat(systemLightPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(1000);
        const systemArabicPath = systemShotPath.replace(/\.png$/i, '-ar-light.png');
        const systemArabicImage = await win.webContents.capturePage();
        await fsp.writeFile(systemArabicPath, systemArabicImage.toPNG());
        receipt.systemArabicScreenshot = systemArabicPath;
        receipt.systemArabicScreenshotBytes = (await fsp.stat(systemArabicPath)).size;

        const systemRtlLayout = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="system-workspace"]');
             const kpis = Array.from(document.querySelectorAll('.sys-instrument'));
             if (!main || kpis.length !== 4) return { ok: false, reason: 'rtl panels missing' };
             const mainRect = main.getBoundingClientRect();
             const withinWidth = kpis.every((node) => {
               const rect = node.getBoundingClientRect();
               return rect.left >= mainRect.left - 1 && rect.right <= mainRect.right + 1;
             });
             const direction = getComputedStyle(main).direction;
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth
               || main.scrollWidth > main.clientWidth + 1;
             return { ok: direction === 'rtl' && withinWidth && !horizontalOverflow, direction, withinWidth, horizontalOverflow };
           })()`,
          true
        );
        receipt.systemRtlLayout = systemRtlLayout;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(600);
        await win.webContents.executeJavaScript(
          `(() => {
             const theme = document.querySelector('button[title="Switch to dark theme"], button[title="التبديل إلى الوضع الداكن"]');
             if (theme) theme.click();
             return true;
           })()`,
          true
        );
        await sleep(900);
        await forceSize(1366, 768);
        await sleep(1000);
        const system1366Path = systemShotPath.replace(/\.png$/i, '-1366.png');
        const system1366Image = await win.webContents.capturePage();
        await fsp.writeFile(system1366Path, system1366Image.toPNG());
        receipt.system1366Screenshot = system1366Path;
        receipt.system1366ScreenshotBytes = (await fsp.stat(system1366Path)).size;

        const system1366Layout = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="system-workspace"]');
             const kpis = Array.from(document.querySelectorAll('.sys-instrument'));
             const timeline = document.querySelector('.sys-timeline-panel');
             const facts = document.querySelector('.sys-facts-panel');
             if (!main || kpis.length !== 4 || !timeline || !facts) return { ok: false, reason: 'system panels missing' };
             const mainRect = main.getBoundingClientRect();
             const rects = kpis.map((node) => node.getBoundingClientRect());
             const withinWidth = rects.every((rect) => rect.left >= mainRect.left - 1 && rect.right <= mainRect.right + 1);
             const sameRow = Math.abs(rects[0].top - rects[1].top) <= 2
               && Math.abs(rects[0].top - rects[2].top) <= 2
               && Math.abs(rects[0].top - rects[3].top) <= 2;
             const timelineRect = timeline.getBoundingClientRect();
             const factsRect = facts.getBoundingClientRect();
             const sideBySide = Math.abs(timelineRect.top - factsRect.top) <= 4
               && timelineRect.right <= factsRect.left + 1;
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             const beforeTop = main.scrollTop;
             main.scrollTop = main.scrollHeight;
             const scrollWorked = main.scrollTop > beforeTop || main.scrollHeight <= main.clientHeight + 2;
             const cards = document.querySelectorAll('[data-testid="system-service-grid"] button[data-testid^="system-service-"]').length;
             const theme = document.documentElement.getAttribute('data-theme') || 'dark';
             return {
               ok: sameRow && withinWidth && sideBySide && !horizontalOverflow && scrollWorked && cards === 12 && theme === 'dark',
               horizontalOverflow,
               scrollWorked,
               sameRow,
               sideBySide,
               withinWidth,
               cards,
               theme,
               mainBottom: Math.round(mainRect.bottom),
               viewportWidth: window.innerWidth,
             };
           })()`,
          true
        );
        receipt.system1366Layout = system1366Layout;
        await win.webContents.executeJavaScript(
          `(() => { const main = document.querySelector('[data-testid="system-workspace"]'); if (main) main.scrollTop = 0; return true; })()`,
          true
        );
        await sleep(400);

        await forceSize(1920, 1080);
        await sleep(1000);
        const system1920Path = systemShotPath.replace(/\.png$/i, '-1920.png');
        const system1920Image = await win.webContents.capturePage();
        await fsp.writeFile(system1920Path, system1920Image.toPNG());
        receipt.system1920Screenshot = system1920Path;
        receipt.system1920ScreenshotBytes = (await fsp.stat(system1920Path)).size;
        await forceSize(1672, 941);
        await sleep(400);

        // Mission 11 Recovery Lab: measured read-only repair evidence, twelve
        // specialised workbenches, a staged preview, journal, keyboard and RTL.
        // No DISM/SFC/netsh/service/restore command is executed.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'repair'; return true; })()`,
          true
        );
        const repairDeadline = Date.now() + 90000;
        let repairUiReady = false;
        while (Date.now() < repairDeadline) {
          await sleep(700);
          repairUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const workspace = document.querySelector('[data-testid="repair-workspace"]');
               const banner = document.querySelector('[data-testid="repair-native-banner"]');
               const required = document.querySelector('[data-testid="repair-native-required"]');
               const elevation = document.querySelector('[data-testid="repair-kpi-elevation-value"]')?.textContent?.trim() || '';
               const cards = document.querySelectorAll('[data-testid="repair-tool-grid"] button[data-testid^="repair-tool-"]').length;
               const history = document.querySelector('[data-testid="repair-history-panel"]');
               const bannerText = banner?.innerText || '';
               return Boolean(workspace) && Boolean(banner) && !required &&
                 elevation !== '' && elevation !== '—' && elevation !== '-' &&
                 cards === 12 && Boolean(history) &&
                 /Measured Recovery Lab|مختبر الاستعادة المقيس/.test(bannerText);
             })()`,
            true
          );
          if (repairUiReady) break;
        }
        const repairControlProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             const main = document.querySelector('[data-testid="repair-workspace"]');
             if (!main) return { ok: false, failures: ['workspace-missing'] };
             const search = main.querySelector('input[aria-label="Search repair tools"], input[aria-label="بحث أدوات الإصلاح"]');
             if (!search) failures.push('search:missing');
             else {
               const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
               setter.call(search, 'dns');
               search.dispatchEvent(new Event('input', { bubbles: true }));
               await wait(140);
               const filtered = main.querySelectorAll('[data-testid="repair-tool-grid"] button[data-testid^="repair-tool-"]').length;
               if (filtered < 1 || filtered >= 12) failures.push('search:filter-' + filtered);
               setter.call(search, '');
               search.dispatchEvent(new Event('input', { bubbles: true }));
               await wait(140);
             }
             const dnsCard = document.querySelector('[data-testid="repair-tool-repair-dns-flush"]');
             if (!dnsCard) failures.push('dns-card:missing');
             else {
               dnsCard.click();
               await wait(120);
               const stage = document.querySelector('[data-testid="repair-stage-selected"]');
               if (!stage) failures.push('stage:missing');
               else {
                 stage.click();
                 await wait(500);
                 const rows = document.querySelectorAll('[data-testid="repair-journal-row"]').length;
                 if (rows < 1) failures.push('journal:no-row');
                 const receipt = document.querySelector('[data-testid="repair-brief"] .rep-plan-receipt');
                 if (!receipt) failures.push('plan:no-receipt');
               }
             }
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.repairControlProbe = repairControlProbe;
        const repairServiceProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             const seen = new Set();
             const ids = ${JSON.stringify([
               'repair-component-check',
               'repair-component-scan',
               'repair-component-restore',
               'repair-files-verify',
               'repair-files-repair',
               'repair-dns-flush',
               'repair-winsock-reset',
               'repair-tcpip-reset',
               'repair-history',
               'repair-troubleshooters',
               'repair-restore-point',
               'repair-update-reset',
             ])};
             for (const id of ids) {
               const card = document.querySelector('[data-testid="repair-tool-' + id + '"]');
               if (!card) { failures.push(id + ':card-missing'); continue; }
               card.click();
               await wait(110);
               const open = document.querySelector('[data-testid="repair-open-selected"]');
               if (!open) { failures.push(id + ':open-missing'); continue; }
               open.click();
               await wait(280);
               const workbench = document.querySelector('[data-testid="repair-service-workspace-' + id + '"]');
               const shell = document.querySelector('[data-testid="repair-service-shell-' + id + '"]');
               const body = workbench ? workbench.querySelector('.rep-wb-body') : null;
               const text = workbench ? String(workbench.innerText || '').trim() : '';
               if (workbench && shell && body && text.length >= 30) {
                 seen.add(id);
                 const segs = Array.from(workbench.querySelectorAll('.sys-seg'));
                 for (let index = 0; index < Math.min(segs.length, 3); index += 1) {
                   const options = Array.from(segs[index].querySelectorAll('button'));
                   if (options.length < 2) continue;
                   options[1].click();
                   await wait(40);
                   if (!options[1].classList.contains('is-active')) failures.push(id + ':seg-' + index);
                   options[0].click();
                   await wait(20);
                 }
               } else {
                 failures.push(id + ':render');
               }
               const close = shell ? shell.querySelector('button[aria-label="Close service"], button[aria-label="إغلاق الخدمة"]') : null;
               if (!close) failures.push(id + ':close-missing');
               else close.click();
               await wait(300);
               if (document.querySelector('[data-testid="repair-service-shell-' + id + '"]')) failures.push(id + ':close-failed');
             }
             return { ok: failures.length === 0 && seen.size === 12, checked: seen.size, failures };
           })()`,
          true
        );
        receipt.repairServiceProbe = repairServiceProbe;
        const repairKeyboardProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const card = document.querySelector('[data-testid="repair-tool-repair-files-verify"]');
             if (!card) return { ok: false, reason: 'card-missing' };
             card.focus();
             card.click();
             await wait(110);
             const open = document.querySelector('[data-testid="repair-open-selected"]');
             if (!open) return { ok: false, reason: 'open-missing' };
             open.click();
             await wait(320);
             const selector = '[data-testid="repair-service-shell-repair-files-verify"]';
             const shell = document.querySelector(selector);
             const close = shell ? shell.querySelector('button[aria-label="Close service"], button[aria-label="إغلاق الخدمة"]') : null;
             const focused = Boolean(close) && document.activeElement === close;
             window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
             await wait(300);
             return { ok: focused && !document.querySelector(selector), focused };
           })()`,
          true
        );
        receipt.repairKeyboardProbe = repairKeyboardProbe;
        try {
          const finalSession = repairBridge?.status?.(renderer.repairV1?.session?.data?.id);
          if (finalSession) {
            receipt.repairFinalSession = {
              id: finalSession.id,
              status: finalSession.status,
              progress: finalSession.progress,
              readOnly: finalSession.readOnly,
              mutation: finalSession.mutation,
              warnings: finalSession.warnings.length,
              stages: finalSession.stages.map((stage) => ({ key: stage.key, status: stage.status, items: stage.items, durationMs: stage.durationMs })),
            };
          }
          const measured = await repairBridge?.snapshot?.();
          if (measured) {            receipt.repairMeasured = {
              generatedAt: measured.generatedAt,
              receipt: measured.receipt,
              identity: {
                osName: measured.identity.osName,
                osBuild: measured.identity.osBuild,
                isAdmin: measured.identity.isAdmin,
                dismAvailable: measured.identity.dismAvailable,
                sfcAvailable: measured.identity.sfcAvailable,
                pendingReboot: measured.identity.pendingReboot,
              },
              adapters: measured.network.adapters.length,
              addresses: measured.network.addresses.length,
              dnsEntries: measured.network.dnsCache.entryCount,
              dnsStatus: measured.network.dnsCache.status,
              winsockProviders: measured.network.winsock.providerCount,
              winsockStatus: measured.network.winsock.status,
              updateServices: measured.update.services.length,
              downloadItems: measured.update.download.items,
              restoreStatus: measured.restore.status,
              restorePoints: measured.restore.points.length,
              journal: measured.journal.length,
              commands: measured.commands.length,
              gates: measured.gates.length,
              coverage: measured.coverage,
              warnings: measured.warnings.length,
              sources: measured.sources.length,
            };
          }
          const finalJournal = await repairBridge?.journal?.();
          receipt.repairJournalCount = Array.isArray(finalJournal) ? finalJournal.length : 0;
        } catch (error) {
          receipt.repairFinalError = redactError(error);
        }
        await win.webContents.executeJavaScript(
          `(() => { const main = document.querySelector('[data-testid="repair-workspace"]'); if (main) main.scrollTop = 0; return true; })()`,
          true
        );
        await sleep(500);
        const repairShotPath = smokeShotPath.replace(/native-bridge/i, 'repair-measured');
        const repairImage = await win.webContents.capturePage();
        await fsp.writeFile(repairShotPath, repairImage.toPNG());
        receipt.repairScreenshot = repairShotPath;
        receipt.repairScreenshotBytes = (await fsp.stat(repairShotPath)).size;
        receipt.repairUiReady = repairUiReady;

        await win.webContents.executeJavaScript(
          `(() => { document.querySelector('button[title="Switch to light theme"], button[title="Switch to dark theme"]')?.click(); return true; })()`,
          true
        );
        await sleep(850);
        const repairLightPath = repairShotPath.replace(/\.png$/i, '-light.png');
        const repairLightImage = await win.webContents.capturePage();
        await fsp.writeFile(repairLightPath, repairLightImage.toPNG());
        receipt.repairLightScreenshot = repairLightPath;
        receipt.repairLightScreenshotBytes = (await fsp.stat(repairLightPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(950);
        const repairArabicPath = repairShotPath.replace(/\.png$/i, '-ar-light.png');
        const repairArabicImage = await win.webContents.capturePage();
        await fsp.writeFile(repairArabicPath, repairArabicImage.toPNG());
        receipt.repairArabicScreenshot = repairArabicPath;
        receipt.repairArabicScreenshotBytes = (await fsp.stat(repairArabicPath)).size;

        const repairRtlLayout = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="repair-workspace"]');
             const kpis = Array.from(document.querySelectorAll('.rep-kpi'));
             if (!main || kpis.length !== 4) return { ok: false, reason: 'rtl panels missing' };
             const mainRect = main.getBoundingClientRect();
             const withinWidth = kpis.every((node) => {
               const rect = node.getBoundingClientRect();
               return rect.left >= mainRect.left - 1 && rect.right <= mainRect.right + 1;
             });
             const direction = getComputedStyle(main).direction;
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth || main.scrollWidth > main.clientWidth + 1;
             return { ok: direction === 'rtl' && withinWidth && !horizontalOverflow, direction, withinWidth, horizontalOverflow };
           })()`,
          true
        );
        receipt.repairRtlLayout = repairRtlLayout;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(600);
        await win.webContents.executeJavaScript(
          `(() => {
             const theme = document.querySelector('button[title="Switch to dark theme"], button[title="التبديل إلى الوضع الداكن"]');
             if (theme) theme.click();
             return true;
           })()`,
          true
        );
        await sleep(850);

        // Capture one privacy-safe workbench: DISM CheckHealth uses system log
        // metadata and contains no user-profile path.
        await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const card = document.querySelector('[data-testid="repair-tool-repair-component-check"]');
             if (card) card.click();
             await wait(140);
             const open = document.querySelector('[data-testid="repair-open-selected"]');
             if (open) open.click();
             return true;
           })()`,
          true
        );
        await sleep(650);
        const repairWorkbenchPath = repairShotPath.replace(/repair-measured/i, 'repair-workbench');
        const repairWorkbenchImage = await win.webContents.capturePage();
        await fsp.writeFile(repairWorkbenchPath, repairWorkbenchImage.toPNG());
        receipt.repairWorkbenchScreenshot = repairWorkbenchPath;
        receipt.repairWorkbenchScreenshotBytes = (await fsp.stat(repairWorkbenchPath)).size;
        await win.webContents.executeJavaScript(
          `(() => {
             const close = document.querySelector('[data-testid="repair-service-shell-repair-component-check"] button[aria-label="Close service"], [data-testid="repair-service-shell-repair-component-check"] button[aria-label="إغلاق الخدمة"]');
             if (close) close.click();
             return true;
           })()`,
          true
        );
        await sleep(450);

        await forceSize(1366, 768);
        await sleep(950);
        const repair1366Path = repairShotPath.replace(/\.png$/i, '-1366.png');
        const repair1366Image = await win.webContents.capturePage();
        await fsp.writeFile(repair1366Path, repair1366Image.toPNG());
        receipt.repair1366Screenshot = repair1366Path;
        receipt.repair1366ScreenshotBytes = (await fsp.stat(repair1366Path)).size;

        const repair1366Layout = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="repair-workspace"]');
             const kpis = Array.from(document.querySelectorAll('.rep-kpi'));
             const tools = document.querySelector('[data-testid="repair-tool-grid"]');
             const history = document.querySelector('[data-testid="repair-history-panel"]');
             const actionbar = document.querySelector('[data-testid="repair-actionbar"]');
             if (!main || kpis.length !== 4 || !tools || !history || !actionbar) return { ok: false, reason: 'repair panels missing' };
             const mainRect = main.getBoundingClientRect();
             const rects = kpis.map((node) => node.getBoundingClientRect());
             const withinWidth = rects.every((rect) => rect.left >= mainRect.left - 1 && rect.right <= mainRect.right + 1);
             const sameRow = Math.abs(rects[0].top - rects[1].top) <= 2 && Math.abs(rects[0].top - rects[2].top) <= 2 && Math.abs(rects[0].top - rects[3].top) <= 2;
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             const beforeTop = main.scrollTop;
             main.scrollTop = main.scrollHeight;
             const scrollWorked = main.scrollTop > beforeTop || main.scrollHeight <= main.clientHeight + 2;
             const historyRect = history.getBoundingClientRect();
             const actionRect = actionbar.getBoundingClientRect();
             const footerVisible = actionRect.bottom <= window.innerHeight + 1 && actionRect.top >= 0;
             const cards = document.querySelectorAll('[data-testid="repair-tool-grid"] button[data-testid^="repair-tool-"]').length;
             const theme = document.documentElement.getAttribute('data-theme') || 'dark';
             return {
               ok: sameRow && withinWidth && !horizontalOverflow && scrollWorked && footerVisible && cards === 12 && theme === 'dark',
               horizontalOverflow, scrollWorked, sameRow, withinWidth, footerVisible, cards, theme,
               historyHeight: Math.round(historyRect.height), viewportWidth: window.innerWidth,
             };
           })()`,
          true
        );
        receipt.repair1366Layout = repair1366Layout;
        await win.webContents.executeJavaScript(
          `(() => { const main = document.querySelector('[data-testid="repair-workspace"]'); if (main) main.scrollTop = 0; return true; })()`,
          true
        );
        await sleep(350);

        await forceSize(1920, 1080);
        await sleep(950);
        const repair1920Path = repairShotPath.replace(/\.png$/i, '-1920.png');
        const repair1920Image = await win.webContents.capturePage();
        await fsp.writeFile(repair1920Path, repair1920Image.toPNG());
        receipt.repair1920Screenshot = repair1920Path;
        receipt.repair1920ScreenshotBytes = (await fsp.stat(repair1920Path)).size;
        await forceSize(1672, 941);
        await sleep(400);

        // Mission 12 Service Commander: measured SCM evidence, twelve
        // specialised workbenches, one immutable preview, keyboard and RTL.
        // No service is started, stopped, restarted or reconfigured.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'services'; return true; })()`,
          true
        );
        const servicesDeadline = Date.now() + 90000;
        let servicesUiReady = false;
        while (Date.now() < servicesDeadline) {
          await sleep(700);
          servicesUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const workspace = document.querySelector('[data-testid="services-workspace"]');
               const banner = document.querySelector('[data-testid="services-native-banner"]');
               const required = document.querySelector('[data-testid="services-native-required"]');
               const total = document.querySelector('[data-testid="services-kpi-total-value"]')?.textContent?.trim() || '';
               const cards = document.querySelectorAll('[data-testid="services-tool-grid"] button[data-testid^="services-tool-"]').length;
               const graph = document.querySelector('[data-testid="services-dependency-graph"]');
               const op = document.querySelector('[data-testid="services-operation-preview"]');
               const activity = document.querySelector('[data-testid="services-mini-journal"]');
               const bannerText = banner?.innerText || '';
               return Boolean(workspace) && Boolean(banner) && !required &&
                 total !== '' && total !== '—' && total !== '-' &&
                 cards === 12 && Boolean(graph) && Boolean(op) && Boolean(activity) &&
                 /Measured Service Commander|قائد الخدمات المقيس/.test(bannerText);
             })()`,
            true
          );
          if (servicesUiReady) break;
        }
        const servicesControlProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             const main = document.querySelector('[data-testid="services-workspace"]');
             if (!main) return { ok: false, failures: ['workspace-missing'] };
             const rows = Array.from(main.querySelectorAll('[data-testid="services-register-row"]'));
             if (!rows.length) failures.push('register:empty');
             else {
               // Keep the page's initial running non-protected selection so the
               // preview exercises a representable state transition.
               const stage = main.querySelector('[data-testid="services-stage-preview"]');
               if (!stage) failures.push('stage:missing');
               else {
                 stage.click();
                 await wait(600);
                 if (!main.querySelector('[data-testid="services-plan-ready"]')) failures.push('plan:missing');
                 const journalRows = main.querySelectorAll('[data-testid="services-journal-row"]').length;
                 if (journalRows < 1) failures.push('journal:no-row');
                 const activityRows = main.querySelectorAll('[data-testid="services-mini-journal"] .svc-mini-row').length;
                 if (activityRows < 1) failures.push('activity:no-row');
               }
             }
             const search = main.querySelector('input[aria-label="Search services"], input[aria-label="بحث الخدمات"]');
             if (!search) failures.push('search:missing');
             else {
               const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
               setter.call(search, 'svc');
               search.dispatchEvent(new Event('input', { bubbles: true }));
               await wait(150);
               const filtered = main.querySelectorAll('[data-testid="services-register-row"]').length;
               if (filtered < 1 || filtered >= rows.length) failures.push('search:filter-' + filtered);
               setter.call(search, '');
               search.dispatchEvent(new Event('input', { bubbles: true }));
               await wait(150);
             }
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.servicesControlProbe = servicesControlProbe;
        const servicesToolProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             const seen = new Set();
             const ids = ${JSON.stringify([
               'services-inventory',
               'services-control',
               'services-undo',
               'services-dependencies',
               'services-protected',
               'services-search',
               'services-startup-report',
               'services-state-history',
               'services-dependents',
               'services-diagnose',
               'services-config',
               'services-perf',
             ])};
             for (const id of ids) {
               const card = document.querySelector('[data-testid="services-tool-' + id + '"]');
               if (!card) { failures.push(id + ':card-missing'); continue; }
               card.click();
               await wait(270);
               const workbench = document.querySelector('[data-testid="services-service-workspace-' + id + '"]');
               const shell = document.querySelector('[data-testid="services-service-shell-' + id + '"]');
               const body = workbench ? workbench.querySelector('.svc-wb-body') : null;
               const text = workbench ? String(workbench.innerText || '').trim() : '';
               if (workbench && shell && body && text.length >= 30) {
                 seen.add(id);
                 const segs = Array.from(workbench.querySelectorAll('.sys-seg'));
                 for (let index = 0; index < Math.min(segs.length, 3); index += 1) {
                   const options = Array.from(segs[index].querySelectorAll('button'));
                   if (options.length < 2) continue;
                   options[1].click();
                   await wait(40);
                   if (!options[1].classList.contains('is-active')) failures.push(id + ':seg-' + index);
                   options[0].click();
                   await wait(20);
                 }
               } else {
                 failures.push(id + ':render');
               }
               const close = shell ? shell.querySelector('button[aria-label="Close service"], button[aria-label="إغلاق الخدمة"]') : null;
               if (!close) failures.push(id + ':close-missing');
               else close.click();
               await wait(140);
               if (document.querySelector('[data-testid="services-service-shell-' + id + '"]')) failures.push(id + ':close-failed');
             }
             return { ok: failures.length === 0 && seen.size === 12, checked: seen.size, failures };
           })()`,
          true
        );
        receipt.servicesToolProbe = servicesToolProbe;
        const servicesKeyboardProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const card = document.querySelector('[data-testid="services-tool-services-inventory"]');
             if (!card) return { ok: false, reason: 'card-missing' };
             card.focus();
             card.click();
             await wait(320);
             const selector = '[data-testid="services-service-shell-services-inventory"]';
             const shell = document.querySelector(selector);
             const close = shell ? shell.querySelector('button[aria-label="Close service"], button[aria-label="إغلاق الخدمة"]') : null;
             const focused = Boolean(close) && document.activeElement === close;
             window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
             await wait(300);
             return { ok: focused && !document.querySelector(selector), focused };
           })()`,
          true
        );
        receipt.servicesKeyboardProbe = servicesKeyboardProbe;
        try {
          const finalSession = servicesBridge?.status?.(renderer.servicesV1?.session?.data?.id);
          if (finalSession) {
            receipt.servicesFinalSession = {
              id: finalSession.id,
              status: finalSession.status,
              progress: finalSession.progress,
              readOnly: finalSession.readOnly,
              mutation: finalSession.mutation,
              warnings: finalSession.warnings.length,
              stages: finalSession.stages.map((stage) => ({ key: stage.key, status: stage.status, items: stage.items, durationMs: stage.durationMs })),
            };
          }
          const measured = await servicesBridge?.snapshot?.();
          if (measured) {
            receipt.servicesMeasured = {
              generatedAt: measured.generatedAt,
              receipt: measured.receipt,
              total: measured.summary.total,
              running: measured.summary.running,
              stopped: measured.summary.stopped,
              protected: measured.summary.protected,
              automatic: measured.summary.automatic,
              manual: measured.summary.manual,
              disabled: measured.summary.disabled,
              delayed: measured.summary.delayed,
              thirdParty: measured.summary.thirdParty,
              edges: measured.edges.length,
              events: measured.events.length,
              eventCoverage: measured.eventCoverage,
              svchost: measured.svchost.length,
              elevation: measured.elevation,
              gates: measured.gates.length,
              coverage: measured.coverage,
              warnings: measured.warnings.length,
              sources: measured.sources.length,
            };
          }
          const finalJournal = await servicesBridge?.journal?.();
          receipt.servicesJournalCount = Array.isArray(finalJournal) ? finalJournal.length : 0;
        } catch (error) {
          receipt.servicesFinalError = redactError(error);
        }
        await win.webContents.executeJavaScript(
          `(() => { const main = document.querySelector('[data-testid="services-workspace"]'); if (main) main.scrollTop = 0; return true; })()`,
          true
        );
        await sleep(500);
        const servicesShotPath = smokeShotPath.replace(/native-bridge/i, 'services-measured');
        const servicesImage = await win.webContents.capturePage();
        await fsp.writeFile(servicesShotPath, servicesImage.toPNG());
        receipt.servicesScreenshot = servicesShotPath;
        receipt.servicesScreenshotBytes = (await fsp.stat(servicesShotPath)).size;
        receipt.servicesUiReady = servicesUiReady;

        // Privacy-safe workbench: service register and SCM dossier, no user path.
        await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const card = document.querySelector('[data-testid="services-tool-services-inventory"]');
             if (card) card.click();
             return true;
           })()`,
          true
        );
        await sleep(700);
        const servicesWorkbenchPath = servicesShotPath.replace(/services-measured/i, 'services-workbench');
        const servicesWorkbenchImage = await win.webContents.capturePage();
        await fsp.writeFile(servicesWorkbenchPath, servicesWorkbenchImage.toPNG());
        receipt.servicesWorkbenchScreenshot = servicesWorkbenchPath;
        receipt.servicesWorkbenchScreenshotBytes = (await fsp.stat(servicesWorkbenchPath)).size;
        await win.webContents.executeJavaScript(
          `(() => {
             const close = document.querySelector('[data-testid="services-service-shell-services-inventory"] button[aria-label="Close service"], [data-testid="services-service-shell-services-inventory"] button[aria-label="إغلاق الخدمة"]');
             if (close) close.click();
             return true;
           })()`,
          true
        );
        await sleep(450);

        await win.webContents.executeJavaScript(
          `(() => { document.querySelector('button[title="Switch to light theme"], button[title="Switch to dark theme"]')?.click(); return true; })()`,
          true
        );
        await sleep(850);
        const servicesLightPath = servicesShotPath.replace(/\.png$/i, '-light.png');
        const servicesLightImage = await win.webContents.capturePage();
        await fsp.writeFile(servicesLightPath, servicesLightImage.toPNG());
        receipt.servicesLightScreenshot = servicesLightPath;
        receipt.servicesLightScreenshotBytes = (await fsp.stat(servicesLightPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(950);
        const servicesArabicPath = servicesShotPath.replace(/\.png$/i, '-ar-light.png');
        const servicesArabicImage = await win.webContents.capturePage();
        await fsp.writeFile(servicesArabicPath, servicesArabicImage.toPNG());
        receipt.servicesArabicScreenshot = servicesArabicPath;
        receipt.servicesArabicScreenshotBytes = (await fsp.stat(servicesArabicPath)).size;

        const servicesRtlLayout = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="services-workspace"]');
             const kpis = Array.from(document.querySelectorAll('.svc-kpi'));
             if (!main || kpis.length !== 6) return { ok: false, reason: 'rtl panels missing' };
             const mainRect = main.getBoundingClientRect();
             const withinWidth = kpis.every((node) => {
               const rect = node.getBoundingClientRect();
               return rect.left >= mainRect.left - 1 && rect.right <= mainRect.right + 1;
             });
             const direction = getComputedStyle(main).direction;
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth || main.scrollWidth > main.clientWidth + 1;
             return { ok: direction === 'rtl' && withinWidth && !horizontalOverflow, direction, withinWidth, horizontalOverflow };
           })()`,
          true
        );
        receipt.servicesRtlLayout = servicesRtlLayout;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(600);
        await win.webContents.executeJavaScript(
          `(() => {
             const theme = document.querySelector('button[title="Switch to dark theme"], button[title="التبديل إلى الوضع الداكن"]');
             if (theme) theme.click();
             return true;
           })()`,
          true
        );
        await sleep(850);
        await forceSize(1366, 768);
        await sleep(950);
        const services1366Path = servicesShotPath.replace(/\.png$/i, '-1366.png');
        const services1366Image = await win.webContents.capturePage();
        await fsp.writeFile(services1366Path, services1366Image.toPNG());
        receipt.services1366Screenshot = services1366Path;
        receipt.services1366ScreenshotBytes = (await fsp.stat(services1366Path)).size;

        const services1366Layout = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="services-workspace"]');
             const kpis = Array.from(document.querySelectorAll('.svc-kpi'));
             const tools = document.querySelector('[data-testid="services-tool-grid"]');
             const operation = document.querySelector('[data-testid="services-operation-preview"]');
             const actionbar = document.querySelector('[data-testid="services-actionbar"]');
             if (!main || kpis.length !== 6 || !tools || !operation || !actionbar) return { ok: false, reason: 'services panels missing' };
             const mainRect = main.getBoundingClientRect();
             const rects = kpis.map((node) => node.getBoundingClientRect());
             const withinWidth = rects.every((rect) => rect.left >= mainRect.left - 1 && rect.right <= mainRect.right + 1);
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             const operationRect = operation.getBoundingClientRect();
             const operationVisible = operationRect.top >= mainRect.top - 1 && operationRect.top < window.innerHeight && operationRect.bottom > mainRect.top && operationRect.height > 80;
             const beforeTop = main.scrollTop;
             main.scrollTop = main.scrollHeight;
             const scrollWorked = main.scrollTop > beforeTop || main.scrollHeight <= main.clientHeight + 2;
             const actionRect = actionbar.getBoundingClientRect();
             const footerVisible = actionRect.bottom <= window.innerHeight + 1 && actionRect.top >= 0;
             const cards = document.querySelectorAll('[data-testid="services-tool-grid"] button[data-testid^="services-tool-"]').length;
             const theme = document.documentElement.getAttribute('data-theme') || 'dark';
             return {
               ok: withinWidth && !horizontalOverflow && scrollWorked && operationVisible && footerVisible && cards === 12 && theme === 'dark',
               horizontalOverflow, scrollWorked, withinWidth, operationVisible, footerVisible, cards, theme,
               operationTop: Math.round(operationRect.top), viewportWidth: window.innerWidth,
             };
           })()`,
          true
        );
        receipt.services1366Layout = services1366Layout;
        await win.webContents.executeJavaScript(
          `(() => { const main = document.querySelector('[data-testid="services-workspace"]'); if (main) main.scrollTop = 0; return true; })()`,
          true
        );
        await sleep(350);

        await forceSize(1920, 1080);
        await sleep(950);
        const services1920Path = servicesShotPath.replace(/\.png$/i, '-1920.png');
        const services1920Image = await win.webContents.capturePage();
        await fsp.writeFile(services1920Path, services1920Image.toPNG());
        receipt.services1920Screenshot = services1920Path;
        receipt.services1920ScreenshotBytes = (await fsp.stat(services1920Path)).size;
        await forceSize(1672, 941);
        await sleep(400);

        // Mission 13 Flow Studio: local workflow drafts, DAG validation, a
        // deterministic dry-run, twelve workbenches, keyboard and RTL. No
        // workflow action, notification, file copy or deletion is executed.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'automation'; return true; })()`,
          true
        );
        const automationDeadline = Date.now() + 60000;
        let automationUiReady = false;
        while (Date.now() < automationDeadline) {
          await sleep(600);
          automationUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const workspace = document.querySelector('[data-testid="automation-workspace"]');
               const banner = document.querySelector('[data-testid="automation-native-banner"]');
               const required = document.querySelector('[data-testid="automation-native-required"]');
               const workflows = document.querySelector('[data-testid="automation-kpi-workflows-value"]')?.textContent?.trim() || '';
               const templates = document.querySelector('[data-testid="automation-kpi-templates-value"]')?.textContent?.trim() || '';
               const canvas = document.querySelector('[data-testid="automation-canvas"]');
               const inspector = document.querySelector('[data-testid="automation-inspector"]');
               const cards = document.querySelectorAll('[data-testid="automation-tool-grid"] button[data-testid^="automation-tool-"]').length;
               const bannerText = banner?.innerText || '';
               return Boolean(workspace) && Boolean(banner) && !required &&
                 workflows !== '' && workflows !== '—' && templates === '8' &&
                 Boolean(canvas) && Boolean(inspector) && cards === 12 &&
                 /Local Flow Studio|استوديو التدفق المحلي/.test(bannerText);
             })()`,
            true
          );
          if (automationUiReady) break;
        }
        const automationControlProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             const main = document.querySelector('[data-testid="automation-workspace"]');
             if (!main) return { ok: false, failures: ['workspace-missing'] };
             const template = main.querySelector('[data-testid="automation-template-tpl-smart-scan"]');
             if (!template) failures.push('template:missing');
             else {
               template.click();
               await wait(250);
               const before = main.querySelectorAll('.auto-node').length;
               const add = main.querySelector('[data-testid="automation-add-node"]');
               if (!add) failures.push('add:missing');
               else {
                 add.click();
                 await wait(120);
                 const confirm = main.querySelector('[data-testid="automation-add-node-confirm"]');
                 if (!confirm) failures.push('add-confirm:missing');
                 else {
                   confirm.click();
                   await wait(180);
                   const after = main.querySelectorAll('.auto-node').length;
                   if (after !== before + 1) failures.push('add:count-' + before + '-' + after);
                 }
               }
               const dry = main.querySelector('[data-testid="automation-dryrun"]');
               if (!dry) failures.push('dryrun:missing');
               else {
                 dry.click();
                 await wait(700);
                 if (!main.querySelector('[data-testid="automation-dryrun-result"]')) failures.push('dryrun:no-result');
                 const rows = main.querySelectorAll('[data-testid="automation-journal-row"]').length;
                 if (rows < 1) failures.push('journal:no-row');
               }
               const save = main.querySelector('[data-testid="automation-save"]');
               if (!save) failures.push('save:missing');
               else {
                 save.click();
                 await wait(900);
                 const savedRows = main.querySelectorAll('[data-testid^="automation-workflow-row-"]').length;
                 if (savedRows < 1) failures.push('save:no-row');
                 const workflowKpi = main.querySelector('[data-testid="automation-kpi-workflows-value"]')?.textContent?.trim() || '';
                 if (workflowKpi === '0' || workflowKpi === '—') failures.push('save:kpi-' + workflowKpi);
               }
             }
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.automationControlProbe = automationControlProbe;
        const automationToolProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             const seen = new Set();
             const ids = ${JSON.stringify([
               'auto-smart-scan',
               'auto-schedule-manager',
               'auto-run-history',
               'auto-templates',
               'auto-schedule-plan',
               'auto-cleanup-plan',
               'auto-notify',
               'auto-quiet-hours',
               'auto-battery-policy',
               'auto-retention',
               'auto-export',
               'auto-backup-plan',
             ])};
             for (const id of ids) {
               const card = document.querySelector('[data-testid="automation-tool-' + id + '"]');
               if (!card) { failures.push(id + ':card-missing'); continue; }
               card.click();
               let workbench = null;
               for (let attempt = 0; attempt < 10; attempt += 1) {
                 await wait(100);
                 workbench = document.querySelector('[data-testid="automation-service-workspace-' + id + '"]');
                 if (workbench) break;
               }
               const shell = document.querySelector('[data-testid="automation-service-shell-' + id + '"]');
               const body = workbench ? workbench.querySelector('.auto-wb-body') : null;
               const text = workbench ? String(workbench.innerText || '').trim() : '';
               if (workbench && shell && body && text.length >= 30) {
                 seen.add(id);
                 const segs = Array.from(workbench.querySelectorAll('.sys-seg'));
                 for (let index = 0; index < Math.min(segs.length, 3); index += 1) {
                   const options = Array.from(segs[index].querySelectorAll('button'));
                   if (options.length < 2) continue;
                   options[1].click();
                   await wait(40);
                   if (!options[1].classList.contains('is-active')) failures.push(id + ':seg-' + index);
                   options[0].click();
                   await wait(20);
                 }
               } else {
                 failures.push(id + ':render');
               }
               const close = shell ? shell.querySelector('button[aria-label="Close service"], button[aria-label="إغلاق الخدمة"]') : null;
               if (!close) failures.push(id + ':close-missing');
               else close.click();
               await wait(140);
               if (document.querySelector('[data-testid="automation-service-shell-' + id + '"]')) failures.push(id + ':close-failed');
             }
             return { ok: failures.length === 0 && seen.size === 12, checked: seen.size, failures };
           })()`,
          true
        );
        receipt.automationToolProbe = automationToolProbe;
        const automationKeyboardProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const card = document.querySelector('[data-testid="automation-tool-auto-smart-scan"]');
             if (!card) return { ok: false, reason: 'card-missing' };
             card.focus();
             card.click();
             await wait(320);
             const selector = '[data-testid="automation-service-shell-auto-smart-scan"]';
             const shell = document.querySelector(selector);
             const close = shell ? shell.querySelector('button[aria-label="Close service"], button[aria-label="إغلاق الخدمة"]') : null;
             const focused = Boolean(close) && document.activeElement === close;
             window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
             await wait(300);
             return { ok: focused && !document.querySelector(selector), focused };
           })()`,
          true
        );
        receipt.automationKeyboardProbe = automationKeyboardProbe;
        try {
          const finalSession = automationBridge?.status?.(renderer.automationV1?.session?.data?.id);
          if (finalSession) {
            receipt.automationFinalSession = {
              id: finalSession.id,
              status: finalSession.status,
              progress: finalSession.progress,
              readOnly: finalSession.readOnly,
              mutation: finalSession.mutation,
              warnings: finalSession.warnings.length,
              stages: finalSession.stages.map((stage) => ({ key: stage.key, status: stage.status, items: stage.items, durationMs: stage.durationMs })),
            };
          }
          const measured = await automationBridge?.snapshot?.();
          if (measured) {
            receipt.automationMeasured = {
              generatedAt: measured.generatedAt,
              receipt: measured.receipt,
              workflows: measured.workflows.length,
              workflowHistory: measured.workflowHistory.length,
              templates: measured.templates.length,
              journal: measured.journal.length,
              runtime: measured.runtime,
              gates: measured.gates.length,
              coverage: measured.coverage,
              warnings: measured.warnings.length,
              sources: measured.sources.length,
            };
          }
          const finalJournal = await automationBridge?.journal?.();
          receipt.automationJournalCount = Array.isArray(finalJournal) ? finalJournal.length : 0;
        } catch (error) {
          receipt.automationFinalError = redactError(error);
        }
        await win.webContents.executeJavaScript(
          `(() => { const main = document.querySelector('[data-testid="automation-workspace"]'); if (main) main.scrollTop = 0; return true; })()`,
          true
        );
        await sleep(500);
        const automationShotPath = smokeShotPath.replace(/native-bridge/i, 'automation-measured');
        const automationImage = await win.webContents.capturePage();
        await fsp.writeFile(automationShotPath, automationImage.toPNG());
        receipt.automationScreenshot = automationShotPath;
        receipt.automationScreenshotBytes = (await fsp.stat(automationShotPath)).size;
        receipt.automationUiReady = automationUiReady;

        // Privacy-safe workbench: local workflow canvas and inspector.
        await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const card = document.querySelector('[data-testid="automation-tool-auto-smart-scan"]');
             if (card) card.click();
             return true;
           })()`,
          true
        );
        await sleep(700);
        const automationWorkbenchPath = automationShotPath.replace(/automation-measured/i, 'automation-workbench');
        const automationWorkbenchImage = await win.webContents.capturePage();
        await fsp.writeFile(automationWorkbenchPath, automationWorkbenchImage.toPNG());
        receipt.automationWorkbenchScreenshot = automationWorkbenchPath;
        receipt.automationWorkbenchScreenshotBytes = (await fsp.stat(automationWorkbenchPath)).size;
        await win.webContents.executeJavaScript(
          `(() => {
             const close = document.querySelector('[data-testid="automation-service-shell-auto-smart-scan"] button[aria-label="Close service"], [data-testid="automation-service-shell-auto-smart-scan"] button[aria-label="إغلاق الخدمة"]');
             if (close) close.click();
             return true;
           })()`,
          true
        );
        await sleep(450);

        await win.webContents.executeJavaScript(
          `(() => { document.querySelector('button[title="Switch to light theme"], button[title="Switch to dark theme"]')?.click(); return true; })()`,
          true
        );
        await sleep(850);
        const automationLightPath = automationShotPath.replace(/\.png$/i, '-light.png');
        const automationLightImage = await win.webContents.capturePage();
        await fsp.writeFile(automationLightPath, automationLightImage.toPNG());
        receipt.automationLightScreenshot = automationLightPath;
        receipt.automationLightScreenshotBytes = (await fsp.stat(automationLightPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(950);
        const automationArabicPath = automationShotPath.replace(/\.png$/i, '-ar-light.png');
        const automationArabicImage = await win.webContents.capturePage();
        await fsp.writeFile(automationArabicPath, automationArabicImage.toPNG());
        receipt.automationArabicScreenshot = automationArabicPath;
        receipt.automationArabicScreenshotBytes = (await fsp.stat(automationArabicPath)).size;

        const automationRtlLayout = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="automation-workspace"]');
             const kpis = Array.from(document.querySelectorAll('.auto-kpi'));
             if (!main || kpis.length !== 6) return { ok: false, reason: 'rtl panels missing' };
             const mainRect = main.getBoundingClientRect();
             const withinWidth = kpis.every((node) => {
               const rect = node.getBoundingClientRect();
               return rect.left >= mainRect.left - 1 && rect.right <= mainRect.right + 1;
             });
             const direction = getComputedStyle(main).direction;
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth || main.scrollWidth > main.clientWidth + 1;
             return { ok: direction === 'rtl' && withinWidth && !horizontalOverflow, direction, withinWidth, horizontalOverflow };
           })()`,
          true
        );
        receipt.automationRtlLayout = automationRtlLayout;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(600);
        await win.webContents.executeJavaScript(
          `(() => {
             const theme = document.querySelector('button[title="Switch to dark theme"], button[title="التبديل إلى الوضع الداكن"]');
             if (theme) theme.click();
             return true;
           })()`,
          true
        );
        await sleep(850);
        await forceSize(1366, 768);
        await sleep(950);
        await win.webContents.executeJavaScript(
          `(() => { const main = document.querySelector('[data-testid="automation-workspace"]'); if (main) main.scrollTop = 0; return true; })()`,
          true
        );
        await sleep(250);
        const automation1366Path = automationShotPath.replace(/\.png$/i, '-1366.png');
        const automation1366Image = await win.webContents.capturePage();
        await fsp.writeFile(automation1366Path, automation1366Image.toPNG());
        receipt.automation1366Screenshot = automation1366Path;
        receipt.automation1366ScreenshotBytes = (await fsp.stat(automation1366Path)).size;

        const automation1366Layout = await win.webContents.executeJavaScript(
          `(() => {
             const main = document.querySelector('[data-testid="automation-workspace"]');
             const kpis = Array.from(document.querySelectorAll('.auto-kpi'));
             const canvas = document.querySelector('[data-testid="automation-canvas"]');
             const inspector = document.querySelector('[data-testid="automation-inspector"]');
             const actionbar = document.querySelector('[data-testid="automation-actionbar"]');
             if (!main || kpis.length !== 6 || !canvas || !inspector || !actionbar) return { ok: false, reason: 'automation panels missing' };
             const mainRect = main.getBoundingClientRect();
             const rects = kpis.map((node) => node.getBoundingClientRect());
             const withinWidth = rects.every((rect) => rect.left >= mainRect.left - 1 && rect.right <= mainRect.right + 1);
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             const canvasRect = canvas.getBoundingClientRect();
             const canvasVisible = canvasRect.top >= mainRect.top - 1 && canvasRect.top < window.innerHeight && canvasRect.height >= 180;
             const beforeTop = main.scrollTop;
             main.scrollTop = main.scrollHeight;
             const scrollWorked = main.scrollTop > beforeTop || main.scrollHeight <= main.clientHeight + 2;
             const actionRect = actionbar.getBoundingClientRect();
             const footerVisible = actionRect.bottom <= window.innerHeight + 1 && actionRect.top >= 0;
             const cards = document.querySelectorAll('[data-testid="automation-tool-grid"] button[data-testid^="automation-tool-"]').length;
             const theme = document.documentElement.getAttribute('data-theme') || 'dark';
             return {
               ok: withinWidth && !horizontalOverflow && canvasVisible && scrollWorked && footerVisible && cards === 12 && theme === 'dark',
               horizontalOverflow, canvasVisible, scrollWorked, footerVisible, cards, theme,
               canvasTop: Math.round(canvasRect.top), viewportWidth: window.innerWidth,
             };
           })()`,
          true
        );
        receipt.automation1366Layout = automation1366Layout;
        await win.webContents.executeJavaScript(
          `(() => { const main = document.querySelector('[data-testid="automation-workspace"]'); if (main) main.scrollTop = 0; return true; })()`,
          true
        );
        await sleep(350);

        await forceSize(1920, 1080);
        await sleep(950);
        await win.webContents.executeJavaScript(
          `(() => { const main = document.querySelector('[data-testid="automation-workspace"]'); if (main) main.scrollTop = 0; return true; })()`,
          true
        );
        await sleep(250);
        const automation1920Path = automationShotPath.replace(/\.png$/i, '-1920.png');
        const automation1920Image = await win.webContents.capturePage();
        await fsp.writeFile(automation1920Path, automation1920Image.toPNG());
        receipt.automation1920Screenshot = automation1920Path;
        receipt.automation1920ScreenshotBytes = (await fsp.stat(automation1920Path)).size;
        await forceSize(1672, 941);
        await sleep(400);

        // Mission 04 Google Workspace honesty probe: no account is connected,
        // no fake connected state exists, and no Google request is sent. The
        // consent review is local-only; live OAuth remains blocked.
        await win.webContents.executeJavaScript(
          `(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); location.hash = 'workspace'; return true; })()`,
          true
        );
        const workspaceDeadline = Date.now() + 30000;
        let workspaceUiReady = false;
        while (Date.now() < workspaceDeadline) {
          await sleep(500);
          workspaceUiReady = await win.webContents.executeJavaScript(
            `Boolean(document.querySelector('[data-testid="workspace-hub"]') && document.querySelector('[data-testid="workspace-connection-state"]'))`,
            true
          );
          if (workspaceUiReady) break;
        }
        receipt.workspaceUiReady = workspaceUiReady;
        const workspaceControlProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             const ids = ['sheets','gmail','tasks','forms','contacts','calendar','picker','slides','chat','classroom'];
             const hub = document.querySelector('[data-testid="workspace-hub"]');
             if (!hub) return { ok: false, failures: ['hub-missing'], services: 0 };
             const state = document.querySelector('[data-testid="workspace-connection-state"]')?.innerText || '';
             if (!/Not connected|غير متصل/i.test(state)) failures.push('connection-state');
             if (document.body.innerText.includes('Simulate Connected State') || document.body.innerText.includes('Sandbox preview toggled on')) failures.push('fake-connected-control');
             const seen = new Set();
             for (const id of ids) {
               const button = document.querySelector('[data-testid="workspace-service-' + id + '"]');
               if (!button) { failures.push(id + ':missing'); continue; }
               button.click();
               await wait(90);
               const title = document.querySelector('[data-testid="workspace-service-title"]')?.textContent?.trim() || '';
               const action = document.querySelector('[data-testid="workspace-action"]');
               if (title) seen.add(id);
               if (id === 'sheets') {
                 if (!document.querySelector('[data-testid="workspace-sheets-workbench"]')) failures.push('sheets-workbench-missing');
                 if (!document.querySelector('[data-testid="workspace-google-state"]')) failures.push('sheets-state-missing');
                 if (!document.querySelector('[data-testid="workspace-google-disconnected"]')) failures.push('sheets-disconnected-state-missing');
               } else if (!action) {
                 failures.push(id + ':action-missing');
               }
             }
             const action = document.querySelector('[data-testid="workspace-action"]');
             if (action) {
               action.click();
               await wait(160);
               const toast = document.querySelector('[data-testid="workspace-toast"]')?.innerText || '';
               if (!/Preview only|معاينة فقط/.test(toast) || !/not executed|لم يُنفذ|لم ينفذ/i.test(toast)) failures.push('action-toast');
             } else failures.push('action-target');
             const connect = document.querySelector('[data-testid="workspace-connect-button"]');
             if (!connect) failures.push('connect-review-missing');
             else {
               connect.click();
               await wait(180);
               const modal = document.querySelector('[data-testid="workspace-oauth-modal"]');
               if (!modal) failures.push('oauth-modal-missing');
               else {
                 const scopeRows = modal.querySelectorAll('[data-testid="workspace-oauth-scopes"] > div').length;
                 if (scopeRows !== 4) failures.push('scope-count-' + scopeRows);
                 if (!modal.querySelector('[data-testid="workspace-oauth-status"]')) failures.push('oauth-status-missing');
                 if (!modal.querySelector('[data-testid="workspace-oauth-connect"]') && !modal.querySelector('[data-testid="workspace-oauth-disconnect"]')) failures.push('oauth-action-missing');
                 if (/refresh_token|access_token|client_secret/i.test(modal.innerText || '')) failures.push('token-text-in-modal');
                 window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                 await wait(120);
                 if (document.querySelector('[data-testid="workspace-oauth-modal"]')) failures.push('escape-close');
               }
             }
             return { ok: failures.length === 0 && seen.size === 10, services: seen.size, failures };
           })()`,
          true
        );
        receipt.workspaceControlProbe = workspaceControlProbe;
        await win.webContents.executeJavaScript(
          `document.querySelector('[data-testid="workspace-service-sheets"]')?.click()`,
          true
        );
        await sleep(3800);
        const workspaceShotPath = smokeShotPath.replace(/native-bridge/i, 'workspace-measured');
        const workspaceImage = await win.webContents.capturePage();
        await fsp.writeFile(workspaceShotPath, workspaceImage.toPNG());
        receipt.workspaceScreenshot = workspaceShotPath;
        receipt.workspaceScreenshotBytes = (await fsp.stat(workspaceShotPath)).size;
        await win.webContents.executeJavaScript(
          `document.querySelector('[data-testid="workspace-connect-button"]')?.click()`,
          true
        );
        await sleep(250);
        const workspaceOauthPath = workspaceShotPath.replace(/workspace-measured/i, 'workspace-oauth');
        const workspaceOauthImage = await win.webContents.capturePage();
        await fsp.writeFile(workspaceOauthPath, workspaceOauthImage.toPNG());
        receipt.workspaceOauthScreenshot = workspaceOauthPath;
        receipt.workspaceOauthScreenshotBytes = (await fsp.stat(workspaceOauthPath)).size;
        await win.webContents.executeJavaScript(
          `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`,
          true
        );
        await sleep(180);

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(700);
        const workspaceRtlLayout = await win.webContents.executeJavaScript(
          `(() => {
             const hub = document.querySelector('[data-testid="workspace-hub"]');
             const main = document.querySelector('[data-testid="workspace-posture"]');
             if (!hub || !main) return { ok: false, reason: 'panels-missing' };
             const direction = getComputedStyle(hub).direction;
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             return { ok: direction === 'rtl' && !horizontalOverflow, direction, horizontalOverflow };
           })()`,
          true
        );
        receipt.workspaceRtlLayout = workspaceRtlLayout;
        const workspaceArabicPath = workspaceShotPath.replace(/\.png$/i, '-ar.png');
        const workspaceArabicImage = await win.webContents.capturePage();
        await fsp.writeFile(workspaceArabicPath, workspaceArabicImage.toPNG());
        receipt.workspaceArabicScreenshot = workspaceArabicPath;
        receipt.workspaceArabicScreenshotBytes = (await fsp.stat(workspaceArabicPath)).size;
        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(500);

        await forceSize(1366, 768);
        await sleep(800);
        const workspace1366Path = workspaceShotPath.replace(/\.png$/i, '-1366.png');
        const workspace1366Image = await win.webContents.capturePage();
        await fsp.writeFile(workspace1366Path, workspace1366Image.toPNG());
        receipt.workspace1366Screenshot = workspace1366Path;
        receipt.workspace1366ScreenshotBytes = (await fsp.stat(workspace1366Path)).size;
        const workspace1366Layout = await win.webContents.executeJavaScript(
          `(() => {
             const hub = document.querySelector('[data-testid="workspace-hub"]');
             const posture = document.querySelector('[data-testid="workspace-posture"]');
             if (!hub || !posture) return { ok: false, reason: 'panels-missing' };
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             const postureRect = posture.getBoundingClientRect();
             const actionsVisible = postureRect.bottom <= window.innerHeight + 1 && postureRect.top >= 0;
             const rail = document.querySelectorAll('button[data-testid^="workspace-service-"]').length;
             return { ok: !horizontalOverflow && actionsVisible && rail === 10, horizontalOverflow, actionsVisible, services: rail, viewportWidth: window.innerWidth };
           })()`,
          true
        );
        receipt.workspace1366Layout = workspace1366Layout;
        await forceSize(1920, 1080);
        await sleep(800);
        const workspace1920Path = workspaceShotPath.replace(/\.png$/i, '-1920.png');
        const workspace1920Image = await win.webContents.capturePage();
        await fsp.writeFile(workspace1920Path, workspace1920Image.toPNG());
        receipt.workspace1920Screenshot = workspace1920Path;
        receipt.workspace1920ScreenshotBytes = (await fsp.stat(workspace1920Path)).size;
        receipt.workspaceLightSupported = false;
        receipt.workspaceLightNote = 'The approved Google Workspace hub is dark-only in this build; light theme parity remains BLOCKED.';
        await forceSize(1672, 941);
        await sleep(400);

        // Mission 14 settings honesty probe: real preference persistence,
        // credential-free export UI, disabled unsupported guards and no
        // simulated telemetry. No AI/provider request is made.
        await win.webContents.executeJavaScript(
          `(() => { location.hash = 'settings'; return true; })()`,
          true
        );
        const settingsDeadline = Date.now() + 30000;
        let settingsUiReady = false;
        while (Date.now() < settingsDeadline) {
          await sleep(500);
          settingsUiReady = await win.webContents.executeJavaScript(
            `Boolean(document.querySelector('[data-testid="settings-root"]') && document.querySelector('[data-testid="settings-footer"]'))`,
            true
          );
          if (settingsUiReady) break;
        }
        receipt.settingsUiReady = settingsUiReady;
        const settingsControlProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             const root = () => document.querySelector('[data-testid="settings-root"]');
             if (!root()) return { ok: false, failures: ['root-missing'] };
             if (/Turbo Active|Engine Status: Turbo Active/.test(root().innerText)) failures.push('fake-engine-status');
             if (/All configuration changes saved/.test(root().innerText)) failures.push('fake-save-toast');
             const tabs = document.querySelectorAll('[data-testid^="settings-tab-"]');
             if (tabs.length !== 7) failures.push('tab-count-' + tabs.length);
             document.querySelector('[data-testid="settings-tab-guard"]')?.click();
             await wait(120);
             const disabledGuards = document.querySelectorAll('input[type="checkbox"][disabled]').length;
             if (disabledGuards < 3) failures.push('guard-not-disabled-' + disabledGuards);
             if (!document.querySelector('[data-testid="settings-guard-notice"]')) failures.push('guard-notice-missing');
             document.querySelector('[data-testid="settings-tab-appearance"]')?.click();
             await wait(120);
             document.querySelector('[data-testid="settings-density-compact"]')?.click();
             await wait(80);
             document.querySelector('[data-testid="settings-save"]')?.click();
             await wait(350);
             let stored = null;
             try { stored = JSON.parse(localStorage.getItem('knoux_settings_profile_v1') || 'null'); } catch { stored = null; }
             if (stored?.density !== 'compact') failures.push('not-persisted');
             const toast = document.querySelector('[data-testid="settings-toast"]')?.innerText || '';
             if (!/saved|حُفظت|حفظت/i.test(toast)) failures.push('save-toast');
             location.hash = 'home';
             await wait(350);
             location.hash = 'settings';
             await wait(600);
             if (root()?.getAttribute('data-density') !== 'compact') failures.push('reload-not-persisted');
             document.querySelector('[data-testid="settings-tab-workspace"]')?.click();
             await wait(120);
             if (/Authorized credentials and scopes active/.test(root()?.innerText || '')) failures.push('fake-google-active');
             document.querySelector('[data-testid="settings-tab-engine"]')?.click();
             await wait(120);
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.settingsControlProbe = settingsControlProbe;
        await win.webContents.executeJavaScript(`location.hash = 'settings'`, true);
        await sleep(1200);
        const settingsShotPath = smokeShotPath.replace(/native-bridge/i, 'settings-measured');
        const settingsImage = await win.webContents.capturePage();
        await fsp.writeFile(settingsShotPath, settingsImage.toPNG());
        receipt.settingsScreenshot = settingsShotPath;
        receipt.settingsScreenshotBytes = (await fsp.stat(settingsShotPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(1200);
        const settingsRtlLayout = await win.webContents.executeJavaScript(
          `(() => {
             const root = document.querySelector('[data-testid="settings-root"]');
             if (!root) return { ok: false, reason: 'root-missing' };
             const direction = getComputedStyle(root).direction;
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             return { ok: direction === 'rtl' && !horizontalOverflow, direction, horizontalOverflow };
           })()`,
          true
        );
        receipt.settingsRtlLayout = settingsRtlLayout;
        const settingsArabicPath = settingsShotPath.replace(/\.png$/i, '-ar.png');
        const settingsArabicImage = await win.webContents.capturePage();
        await fsp.writeFile(settingsArabicPath, settingsArabicImage.toPNG());
        receipt.settingsArabicScreenshot = settingsArabicPath;
        receipt.settingsArabicScreenshotBytes = (await fsp.stat(settingsArabicPath)).size;
        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(450);

        await forceSize(1366, 768);
        await sleep(750);
        const settings1366Path = settingsShotPath.replace(/\.png$/i, '-1366.png');
        const settings1366Image = await win.webContents.capturePage();
        await fsp.writeFile(settings1366Path, settings1366Image.toPNG());
        receipt.settings1366Screenshot = settings1366Path;
        receipt.settings1366ScreenshotBytes = (await fsp.stat(settings1366Path)).size;
        const settings1366Layout = await win.webContents.executeJavaScript(
          `(() => {
             const root = document.querySelector('[data-testid="settings-root"]');
             const footer = document.querySelector('[data-testid="settings-footer"]');
             if (!root || !footer) return { ok: false, reason: 'panels-missing' };
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             const footerRect = footer.getBoundingClientRect();
             const footerVisible = footerRect.bottom <= window.innerHeight + 1 && footerRect.top >= 0;
             const tabs = document.querySelectorAll('[data-testid^="settings-tab-"]').length;
             return { ok: !horizontalOverflow && footerVisible && tabs === 7, horizontalOverflow, footerVisible, tabs, viewportWidth: window.innerWidth };
           })()`,
          true
        );
        receipt.settings1366Layout = settings1366Layout;
        await forceSize(1920, 1080);
        await sleep(750);
        const settings1920Path = settingsShotPath.replace(/\.png$/i, '-1920.png');
        const settings1920Image = await win.webContents.capturePage();
        await fsp.writeFile(settings1920Path, settings1920Image.toPNG());
        receipt.settings1920Screenshot = settings1920Path;
        receipt.settings1920ScreenshotBytes = (await fsp.stat(settings1920Path)).size;
        receipt.settingsLightSupported = false;
        receipt.settingsLightNote = 'The Settings hub is dark-only in this build; light-theme parity remains BLOCKED.';
        await forceSize(1672, 941);
        await sleep(400);

        // Mission 01 Home: measured KPIs, real journals/files/volumes and
        // functional deep links. No fake counters, paths or activity are
        // accepted. The live hook only reads existing bridges.
        await win.webContents.executeJavaScript(`(() => { location.hash = 'home'; return true; })()`, true);
        const homeDeadline = Date.now() + 45000;
        let homeUiReady = false;
        while (Date.now() < homeDeadline) {
          await sleep(500);
          homeUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const root = document.querySelector('[data-testid="home-workspace"]');
               const status = document.querySelector('[data-testid="home-live-status"]')?.innerText || '';
               return Boolean(root) && !/Measuring live data|جارٍ قياس/i.test(status);
             })()`,
            true
          );
          if (homeUiReady) break;
        }
        receipt.homeUiReady = homeUiReady;
        const homeControlProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             const root = () => document.querySelector('[data-testid="home-workspace"]');
             if (!root()) return { ok: false, failures: ['root-missing'] };
             const text = root().innerText || '';
             for (const fake of ['C:\\\\Users\\\\Alex', 'Organized 842 files', 'Microsoft Edge updated', 'Startup items optimized', 'Windows Update Cache:', 'Orphaned Application Residue']) {
               if (text.includes(fake)) failures.push('fake:' + fake);
             }
             const values = Array.from(document.querySelectorAll('[data-testid^="home-kpi-"][data-testid$="-value"]')).map((node) => String(node.textContent || '').trim());
             if (values.length !== 6) failures.push('kpi-count-' + values.length);
             if (values.some((value) => !value || value === '...')) failures.push('kpi-empty');
             const status = document.querySelector('[data-testid="home-live-status"]')?.innerText || '';
             if (!/Live measured|Partial measured|Native measurement required|بيانات حية|بيانات جزئية|القياس الأصلي/i.test(status)) failures.push('live-status');
             if (!document.querySelector('[data-testid="home-metric-cpu"]')) failures.push('cpu-metric-missing');
             if (document.querySelectorAll('[data-testid^="home-volume-"]').length < 1) failures.push('volumes-missing');
             const tile = document.querySelector('[data-testid="home-deck-tile-tile-studio"]');
             if (!tile) failures.push('studio-tile-missing');
             else {
               tile.click();
               await wait(350);
               const routed = location.hash.toLowerCase().includes('studio') || /Organization Studio|استوديو التنظيم/.test(document.body.innerText);
               if (!routed) failures.push('studio-navigation');
               location.hash = 'home';
               await wait(900);
             }
             if (!document.querySelector('[data-testid="home-workspace"]')) failures.push('home-return');
             return { ok: failures.length === 0, kpis: values.length, failures };
           })()`,
          true
        );
        receipt.homeControlProbe = homeControlProbe;
        const homeDataDeadline = Date.now() + 30000;
        while (Date.now() < homeDataDeadline) {
          const ready = await win.webContents.executeJavaScript(
            `(() => {
               const status = document.querySelector('[data-testid="home-live-status"]')?.innerText || '';
               const cpu = document.querySelector('[data-testid="home-cpu-value"]')?.textContent?.trim() || '';
               return Boolean(document.querySelector('[data-testid="home-workspace"]')) && !/Measuring live data|جارٍ قياس/i.test(status) && cpu !== '—' && cpu !== '';
             })()`,
            true
          );
          if (ready) break;
          await sleep(500);
        }
        await sleep(400);
        const homeShotPath = smokeShotPath.replace(/native-bridge/i, 'home-measured');
        const homeImage = await win.webContents.capturePage();
        await fsp.writeFile(homeShotPath, homeImage.toPNG());
        receipt.homeScreenshot = homeShotPath;
        receipt.homeScreenshotBytes = (await fsp.stat(homeShotPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Switch to light theme"], button[title="التبديل إلى الوضع الفاتح"]')?.click()`,
          true
        );
        await sleep(1500);
        const homeLightPath = homeShotPath.replace(/\.png$/i, '-light.png');
        const homeLightImage = await win.webContents.capturePage();
        await fsp.writeFile(homeLightPath, homeLightImage.toPNG());
        receipt.homeLightScreenshot = homeLightPath;
        receipt.homeLightScreenshotBytes = (await fsp.stat(homeLightPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(1500);
        const homeRtlLayout = await win.webContents.executeJavaScript(
          `(() => {
             const root = document.querySelector('[data-testid="home-workspace"]');
             if (!root) return { ok: false, reason: 'root-missing' };
             const direction = getComputedStyle(root).direction;
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             return { ok: direction === 'rtl' && !horizontalOverflow, direction, horizontalOverflow };
           })()`,
          true
        );
        receipt.homeRtlLayout = homeRtlLayout;
        const homeArabicPath = homeShotPath.replace(/\.png$/i, '-ar-light.png');
        const homeArabicImage = await win.webContents.capturePage();
        await fsp.writeFile(homeArabicPath, homeArabicImage.toPNG());
        receipt.homeArabicScreenshot = homeArabicPath;
        receipt.homeArabicScreenshotBytes = (await fsp.stat(homeArabicPath)).size;
        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Toggle Arabic / English"]')?.click()`,
          true
        );
        await sleep(500);
        await win.webContents.executeJavaScript(
          `document.querySelector('button[title="Switch to dark theme"], button[title="التبديل إلى الوضع الداكن"]')?.click()`,
          true
        );
        await sleep(1000);

        await forceSize(1366, 768);
        await sleep(750);
        const home1366Path = homeShotPath.replace(/\.png$/i, '-1366.png');
        const home1366Image = await win.webContents.capturePage();
        await fsp.writeFile(home1366Path, home1366Image.toPNG());
        receipt.home1366Screenshot = home1366Path;
        receipt.home1366ScreenshotBytes = (await fsp.stat(home1366Path)).size;
        const home1366Layout = await win.webContents.executeJavaScript(
          `(() => {
             const root = document.querySelector('[data-testid="home-workspace"]');
             const kpis = Array.from(document.querySelectorAll('[data-testid^="home-kpi-"]')).filter((node) => /-value$/.test(node.getAttribute('data-testid') || '') === false);
             if (!root) return { ok: false, reason: 'root-missing' };
             const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
             const rootRect = root.getBoundingClientRect();
             const withinWidth = kpis.every((node) => { const rect = node.getBoundingClientRect(); return rect.left >= rootRect.left - 1 && rect.right <= rootRect.right + 1; });
             return { ok: !horizontalOverflow && withinWidth && kpis.length === 6, horizontalOverflow, withinWidth, kpis: kpis.length, viewportWidth: window.innerWidth };
           })()`,
          true
        );
        receipt.home1366Layout = home1366Layout;
        await forceSize(1920, 1080);
        await sleep(750);
        const home1920Path = homeShotPath.replace(/\.png$/i, '-1920.png');
        const home1920Image = await win.webContents.capturePage();
        await fsp.writeFile(home1920Path, home1920Image.toPNG());
        receipt.home1920Screenshot = home1920Path;
        receipt.home1920ScreenshotBytes = (await fsp.stat(home1920Path)).size;
        await forceSize(1672, 941);
        await sleep(400);

        // Mission 15A first integration: Files side/expanded workbench host.
        await win.webContents.executeJavaScript(`(() => { location.hash = 'files'; return true; })()`, true);
        const filesWorkbenchDeadline = Date.now() + 30000;
        let filesWorkbenchUiReady = false;
        while (Date.now() < filesWorkbenchDeadline) {
          await sleep(500);
          filesWorkbenchUiReady = await win.webContents.executeJavaScript(
            `Boolean(document.querySelector('[data-testid="files-workspace"]') && document.querySelector('[data-testid="files-service-file-downloads-inventory"]'))`,
            true
          );
          if (filesWorkbenchUiReady) break;
        }
        receipt.filesWorkbenchUiReady = filesWorkbenchUiReady;
        const filesWorkbenchSideProbe = await win.webContents.executeJavaScript(
          `(async () => {
             const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
             const failures = [];
             document.querySelector('[data-testid="files-service-file-downloads-inventory"]')?.click();
             await wait(450);
             const host = document.querySelector('[data-testid="files-workbench"]');
             if (!host) return { ok: false, failures: ['side-host-missing'] };
             if (host.getAttribute('data-workbench-mode') !== 'side') failures.push('side-mode');
             if (!host.querySelector('[data-testid="files-workbench-tool-select"]')) failures.push('tool-selector-missing');
             if (String(host.innerText || '').trim().length < 30) failures.push('body-empty');
             if (!document.querySelector('[data-testid="files-select-all"]')) failures.push('originating-list-hidden');
             if (!document.querySelector('[data-testid="files-footer"]')) failures.push('footer-missing');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.filesWorkbenchSideProbe = filesWorkbenchSideProbe;
        const filesWorkbenchSidePath = smokeShotPath.replace(/native-bridge/i, 'files-workbench');
        const filesWorkbenchSideImage = await win.webContents.capturePage();
        await fsp.writeFile(filesWorkbenchSidePath, filesWorkbenchSideImage.toPNG());
        receipt.filesWorkbenchSideScreenshot = filesWorkbenchSidePath;
        receipt.filesWorkbenchSideScreenshotBytes = (await fsp.stat(filesWorkbenchSidePath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('[data-testid="files-workbench"] [data-testid="workbench-mode-toggle"]')?.click()`,
          true
        );
        await sleep(500);
        const filesWorkbenchExpandedProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             const expanded = document.querySelector('[data-testid="files-workbench-expanded"]');
             const main = document.querySelector('[data-testid="files-workspace"]');
             const footer = document.querySelector('[data-testid="files-footer"]');
             if (!expanded) return { ok: false, failures: ['expanded-host-missing'] };
             if (expanded.getAttribute('data-workbench-mode') !== 'expanded') failures.push('expanded-mode');
             if (!main) failures.push('main-missing');
             else {
               const mainRect = main.getBoundingClientRect();
               const rect = expanded.getBoundingClientRect();
               if (rect.top < mainRect.top - 1 || rect.bottom > mainRect.bottom + 1) failures.push('outside-main');
             }
             if (!footer) failures.push('footer-missing');
             else {
               const rect = footer.getBoundingClientRect();
               if (rect.bottom > window.innerHeight + 1) failures.push('footer-obscured');
             }
             if (document.querySelector('[data-testid="files-workbench"]')) failures.push('side-still-mounted');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.filesWorkbenchExpandedProbe = filesWorkbenchExpandedProbe;
        const filesWorkbenchExpandedPath = smokeShotPath.replace(/native-bridge/i, 'files-workbench-expanded');
        const filesWorkbenchExpandedImage = await win.webContents.capturePage();
        await fsp.writeFile(filesWorkbenchExpandedPath, filesWorkbenchExpandedImage.toPNG());
        receipt.filesWorkbenchExpandedScreenshot = filesWorkbenchExpandedPath;
        receipt.filesWorkbenchExpandedScreenshotBytes = (await fsp.stat(filesWorkbenchExpandedPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('[data-testid="files-workbench-expanded"] [data-testid="workbench-mode-toggle"]')?.click()`,
          true
        );
        await sleep(400);
        const filesWorkbenchEscape = await win.webContents.executeJavaScript(
          `(async () => {
             window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
             await new Promise((resolve) => setTimeout(resolve, 250));
             return { ok: !document.querySelector('[data-testid="files-workbench"]') && !document.querySelector('[data-testid="files-workbench-expanded"]') };
           })()`,
          true
        );
        receipt.filesWorkbenchEscape = filesWorkbenchEscape;
        await forceSize(1672, 941);
        await sleep(300);

        // Mission 15A: Studio stage workbench, side/expanded and context pane.
        await win.webContents.executeJavaScript(`(() => { location.hash = 'studio'; return true; })()`, true);
        const studioWorkbenchDeadline = Date.now() + 30000;
        let studioWorkbenchUiReady = false;
        while (Date.now() < studioWorkbenchDeadline) {
          await sleep(500);
          studioWorkbenchUiReady = await win.webContents.executeJavaScript(
            `Boolean(document.querySelector('[data-testid="studio-workspace"]') && document.querySelector('[data-testid="studio-workbench-pin"]'))`,
            true
          );
          if (studioWorkbenchUiReady) break;
        }
        receipt.studioWorkbenchUiReady = studioWorkbenchUiReady;
        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="studio-workbench-pin"]')?.click()`, true);
        await sleep(700);
        const studioWorkbenchSideProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             const host = document.querySelector('[data-testid="studio-workbench"]');
             const context = document.querySelector('[data-testid="studio-context-panel"]');
             const footer = document.querySelector('[data-testid="studio-footer"]');
             if (!host) return { ok: false, failures: ['side-host-missing'] };
             if (host.getAttribute('data-workbench-mode') !== 'side') failures.push('side-mode');
             if (!context) failures.push('context-missing');
             if (String(host.innerText || '').trim().length < 60) failures.push('body-empty');
             if (!footer) failures.push('footer-missing');
             if (document.documentElement.scrollWidth > window.innerWidth) failures.push('overflow');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.studioWorkbenchSideProbe = studioWorkbenchSideProbe;
        const studioWorkbenchPath = smokeShotPath.replace(/native-bridge/i, 'studio-workbench');
        const studioWorkbenchImage = await win.webContents.capturePage();
        await fsp.writeFile(studioWorkbenchPath, studioWorkbenchImage.toPNG());
        receipt.studioWorkbenchScreenshot = studioWorkbenchPath;
        receipt.studioWorkbenchScreenshotBytes = (await fsp.stat(studioWorkbenchPath)).size;

        await win.webContents.executeJavaScript(
          `document.querySelector('[data-testid="studio-workbench"] [data-testid="workbench-mode-toggle"]')?.click()`,
          true
        );
        await sleep(600);
        const studioWorkbenchExpandedProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             if (document.querySelector('[data-testid="studio-workbench"]')) failures.push('side-still-mounted');
             if (!document.querySelector('[data-testid="studio-workbench-pin"]')) failures.push('pin-missing');
             if (!document.querySelector('[data-testid="studio-footer"]')) failures.push('footer-missing');
             if (document.documentElement.scrollWidth > window.innerWidth) failures.push('overflow');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.studioWorkbenchExpandedProbe = studioWorkbenchExpandedProbe;
        const studioWorkbenchExpandedPath = smokeShotPath.replace(/native-bridge/i, 'studio-workbench-expanded');
        const studioWorkbenchExpandedImage = await win.webContents.capturePage();
        await fsp.writeFile(studioWorkbenchExpandedPath, studioWorkbenchExpandedImage.toPNG());
        receipt.studioWorkbenchExpandedScreenshot = studioWorkbenchExpandedPath;
        receipt.studioWorkbenchExpandedScreenshotBytes = (await fsp.stat(studioWorkbenchExpandedPath)).size;

        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="studio-workbench-pin"]')?.click()`, true);
        await sleep(500);
        await win.webContents.executeJavaScript(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`, true);
        await sleep(300);
        const studioWorkbenchEscape = await win.webContents.executeJavaScript(
          `({ ok: !document.querySelector('[data-testid="studio-workbench"]') && Boolean(document.querySelector('[data-testid="studio-workbench-pin"]')) })`,
          true
        );
        receipt.studioWorkbenchEscape = studioWorkbenchEscape;
        await forceSize(1366, 768);
        await sleep(700);
        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="studio-workbench-pin"]')?.click()`, true);
        await sleep(600);
        const studioWorkbench1366 = await win.webContents.executeJavaScript(
          `(() => {
             const host = document.querySelector('[data-testid="studio-workbench"]');
             const context = document.querySelector('[data-testid="studio-context-panel"]');
             const overflow = document.documentElement.scrollWidth > window.innerWidth;
             return { ok: Boolean(host && context) && !overflow, overflow, hostWidth: host ? Math.round(host.getBoundingClientRect().width) : 0, contextWidth: context ? Math.round(context.getBoundingClientRect().width) : 0, viewportWidth: window.innerWidth };
           })()`,
          true
        );
        receipt.studioWorkbench1366 = studioWorkbench1366;
        const studioWorkbench1366Path = smokeShotPath.replace(/native-bridge/i, 'studio-workbench-1366');
        const studioWorkbench1366Image = await win.webContents.capturePage();
        await fsp.writeFile(studioWorkbench1366Path, studioWorkbench1366Image.toPNG());
        receipt.studioWorkbench1366Screenshot = studioWorkbench1366Path;
        receipt.studioWorkbench1366ScreenshotBytes = (await fsp.stat(studioWorkbench1366Path)).size;
        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="studio-workbench"] [data-testid="workbench-close"]')?.click()`, true);
        await forceSize(1672, 941);
        await sleep(400);

        // Mission 15A: Storage side/expanded workbench.
        await win.webContents.executeJavaScript(`(() => { location.hash = 'storage'; return true; })()`, true);
        const storageWorkbenchDeadline = Date.now() + 30000;
        let storageWorkbenchUiReady = false;
        while (Date.now() < storageWorkbenchDeadline) {
          await sleep(500);
          storageWorkbenchUiReady = await win.webContents.executeJavaScript(
            `Boolean(document.querySelector('[data-testid="storage-workspace"]') && document.querySelector('[data-service-key="storage-disks"]'))`,
            true
          );
          if (storageWorkbenchUiReady) break;
        }
        receipt.storageWorkbenchUiReady = storageWorkbenchUiReady;
        const storageVolumeDeadline = Date.now() + 30000;
        let storageVolumeReady = false;
        while (Date.now() < storageVolumeDeadline) {
          await sleep(500);
          storageVolumeReady = await win.webContents.executeJavaScript(
            `document.querySelectorAll('[data-testid^="storage-volume-"]').length > 0 && Boolean(document.querySelector('[data-testid="storage-volume-count"]')) && document.querySelector('[data-testid="storage-volume-count"]').innerText.trim() !== '—'`,
            true
          );
          if (storageVolumeReady) break;
        }
        receipt.storageVolumeReady = storageVolumeReady;
        await sleep(500);
        await win.webContents.executeJavaScript(`document.querySelector('[data-service-key="storage-disks"]')?.click()`, true);
        await sleep(600);
        const storageWorkbenchSideProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             const host = document.querySelector('[data-testid="storage-workbench"]');
             if (!host) return { ok: false, failures: ['side-host-missing'] };
             if (host.getAttribute('data-workbench-mode') !== 'side') failures.push('side-mode');
             if (host.getBoundingClientRect().height < 100) failures.push('side-not-visible');
             if (!host.querySelector('[data-testid="storage-service-focus"]')) failures.push('body-missing');
             if (String(host.innerText || '').trim().length < 40) failures.push('body-empty');
             const volumeCount = document.querySelector('[data-testid="storage-volume-count"]');
             if (!volumeCount) failures.push('page-hidden');
             else if (volumeCount.innerText.trim() === '—') failures.push('volumes-not-measured');
             if (document.documentElement.scrollWidth > window.innerWidth) failures.push('overflow');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.storageWorkbenchSideProbe = storageWorkbenchSideProbe;
        const storageWorkbenchPath = smokeShotPath.replace(/native-bridge/i, 'storage-workbench');
        const storageWorkbenchImage = await win.webContents.capturePage();
        await fsp.writeFile(storageWorkbenchPath, storageWorkbenchImage.toPNG());
        receipt.storageWorkbenchScreenshot = storageWorkbenchPath;
        receipt.storageWorkbenchScreenshotBytes = (await fsp.stat(storageWorkbenchPath)).size;

        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="storage-workbench"] [data-testid="workbench-mode-toggle"]')?.click()`, true);
        await sleep(500);
        const storageWorkbenchExpandedProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             const expanded = document.querySelector('[data-testid="storage-workbench-expanded"]');
             if (!expanded) failures.push('expanded-host-missing');
             else if (expanded.getBoundingClientRect().height < 100) failures.push('expanded-not-visible');
             if (document.querySelector('[data-testid="storage-workbench"]')) failures.push('side-still-mounted');
             if (document.documentElement.scrollWidth > window.innerWidth) failures.push('overflow');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.storageWorkbenchExpandedProbe = storageWorkbenchExpandedProbe;
        const storageWorkbenchExpandedPath = smokeShotPath.replace(/native-bridge/i, 'storage-workbench-expanded');
        const storageWorkbenchExpandedImage = await win.webContents.capturePage();
        await fsp.writeFile(storageWorkbenchExpandedPath, storageWorkbenchExpandedImage.toPNG());
        receipt.storageWorkbenchExpandedScreenshot = storageWorkbenchExpandedPath;
        receipt.storageWorkbenchExpandedScreenshotBytes = (await fsp.stat(storageWorkbenchExpandedPath)).size;
        await win.webContents.executeJavaScript(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`, true);
        await sleep(300);
        receipt.storageWorkbenchEscape = await win.webContents.executeJavaScript(
          `({ ok: !document.querySelector('[data-testid="storage-workbench"]') && !document.querySelector('[data-testid="storage-workbench-expanded"]') })`,
          true
        );
        await forceSize(1672, 941);
        await sleep(300);

        // Mission 15A: Scan side/expanded workbench over measured services.
        await win.webContents.executeJavaScript(`(() => { location.hash = 'home'; return true; })()`, true);
        await sleep(500);
        await win.webContents.executeJavaScript(`(() => { location.hash = 'smart_scan'; return true; })()`, true);
        const scanWorkbenchDeadline = Date.now() + 30000;
        let scanWorkbenchUiReady = false;
        while (Date.now() < scanWorkbenchDeadline) {
          await sleep(500);
          scanWorkbenchUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const main = document.querySelector('[data-testid="scan-workspace"]');
               const tile = document.querySelector('[data-testid="scan-service-quick_scan"]');
               return Boolean(main && tile && main.getBoundingClientRect().width > 100 && tile.getBoundingClientRect().width > 0);
             })()`,
            true
          );
          if (scanWorkbenchUiReady) break;
        }
        receipt.scanWorkbenchUiReady = scanWorkbenchUiReady;
        await sleep(1200);
        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="scan-service-quick_scan"]')?.click()`, true);
        const scanWorkbenchHostDeadline = Date.now() + 15000;
        while (Date.now() < scanWorkbenchHostDeadline) {
          await sleep(300);
          const hostMounted = await win.webContents.executeJavaScript(
            `Boolean(document.querySelector('[data-testid="scan-workbench"]') || document.querySelector('[data-testid="scan-workbench-expanded"]'))`,
            true
          );
          if (hostMounted) break;
        }
        await sleep(400);
        const scanWorkbenchSideProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             const host = document.querySelector('[data-testid="scan-workbench"]');
             if (!host) return { ok: false, failures: ['side-host-missing'] };
             if (host.getAttribute('data-workbench-mode') !== 'side') failures.push('side-mode');
             if (host.getBoundingClientRect().height < 100) failures.push('side-not-visible');
             if (!host.querySelector('[data-testid="scan-service-focus"]')) failures.push('body-missing');
             if (!host.querySelector('[data-testid="scan-service-run"]')) failures.push('run-control-missing');
             if (String(host.innerText || '').trim().length < 40) failures.push('body-empty');
             if (!document.querySelector('[data-testid="scan-workspace"]')) failures.push('page-hidden');
             if (!document.querySelector('[data-testid="scan-workspace"] [data-testid="scan-service-quick_scan"]')) failures.push('originating-services-hidden');
             if (document.documentElement.scrollWidth > window.innerWidth) failures.push('overflow');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.scanWorkbenchSideProbe = scanWorkbenchSideProbe;
        const scanWorkbenchPath = smokeShotPath.replace(/native-bridge/i, 'scan-workbench');
        const scanWorkbenchImage = await win.webContents.capturePage();
        await fsp.writeFile(scanWorkbenchPath, scanWorkbenchImage.toPNG());
        receipt.scanWorkbenchScreenshot = scanWorkbenchPath;
        receipt.scanWorkbenchScreenshotBytes = (await fsp.stat(scanWorkbenchPath)).size;

        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="scan-workbench"] [data-testid="workbench-mode-toggle"]')?.click()`, true);
        await sleep(500);
        const scanWorkbenchExpandedProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             const expanded = document.querySelector('[data-testid="scan-workbench-expanded"]');
             if (!expanded) failures.push('expanded-host-missing');
             else if (expanded.getBoundingClientRect().height < 100) failures.push('expanded-not-visible');
             if (document.querySelector('[data-testid="scan-workbench"]')) failures.push('side-still-mounted');
             if (!document.querySelector('[data-testid="scan-workspace"]')) failures.push('page-hidden');
             if (document.documentElement.scrollWidth > window.innerWidth) failures.push('overflow');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.scanWorkbenchExpandedProbe = scanWorkbenchExpandedProbe;
        const scanWorkbenchExpandedPath = smokeShotPath.replace(/native-bridge/i, 'scan-workbench-expanded');
        const scanWorkbenchExpandedImage = await win.webContents.capturePage();
        await fsp.writeFile(scanWorkbenchExpandedPath, scanWorkbenchExpandedImage.toPNG());
        receipt.scanWorkbenchExpandedScreenshot = scanWorkbenchExpandedPath;
        receipt.scanWorkbenchExpandedScreenshotBytes = (await fsp.stat(scanWorkbenchExpandedPath)).size;
        await win.webContents.executeJavaScript(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`, true);
        await sleep(300);
        receipt.scanWorkbenchEscape = await win.webContents.executeJavaScript(
          `({ ok: !document.querySelector('[data-testid="scan-workbench"]') && !document.querySelector('[data-testid="scan-workbench-expanded"]') })`,
          true
        );
        await forceSize(1672, 941);
        await sleep(300);

        // Mission 15A: Applications side/expanded workbench over the register.
        await win.webContents.executeJavaScript(`(() => { location.hash = 'home'; return true; })()`, true);
        await sleep(500);
        await win.webContents.executeJavaScript(`(() => { location.hash = 'applications'; return true; })()`, true);
        const appsWorkbenchDeadline = Date.now() + 30000;
        let appsWorkbenchUiReady = false;
        while (Date.now() < appsWorkbenchDeadline) {
          await sleep(500);
          appsWorkbenchUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const main = document.querySelector('[data-testid="apps-workspace"]');
               const tile = document.querySelector('[data-testid="apps-service-app-inventory"]');
               return Boolean(main && tile && main.getBoundingClientRect().width > 100 && tile.getBoundingClientRect().width > 0);
             })()`,
            true
          );
          if (appsWorkbenchUiReady) break;
        }
        receipt.appsWorkbenchUiReady = appsWorkbenchUiReady;
        const appsWorkbenchDataDeadline = Date.now() + 60000;
        let appsWorkbenchDataReady = false;
        while (Date.now() < appsWorkbenchDataDeadline) {
          await sleep(500);
          appsWorkbenchDataReady = await win.webContents.executeJavaScript(
            `Boolean(document.querySelectorAll('[data-testid="apps-register-row"]').length > 0)`,
            true
          );
          if (appsWorkbenchDataReady) break;
        }
        receipt.appsWorkbenchDataReady = appsWorkbenchDataReady;
        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="apps-service-app-inventory"]')?.click()`, true);
        const appsWorkbenchHostDeadline = Date.now() + 15000;
        while (Date.now() < appsWorkbenchHostDeadline) {
          await sleep(300);
          const hostMounted = await win.webContents.executeJavaScript(
            `Boolean(document.querySelector('[data-testid="apps-workbench"]') || document.querySelector('[data-testid="apps-workbench-expanded"]'))`,
            true
          );
          if (hostMounted) break;
        }
        await sleep(400);
        const appsWorkbenchSideProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             const host = document.querySelector('[data-testid="apps-workbench"]');
             if (!host) return { ok: false, failures: ['side-host-missing'] };
             if (host.getAttribute('data-workbench-mode') !== 'side') failures.push('side-mode');
             if (host.getBoundingClientRect().height < 100) failures.push('side-not-visible');
             if (!host.querySelector('[data-testid="app-service-focus"]')) failures.push('body-missing');
             if (String(host.innerText || '').trim().length < 40) failures.push('body-empty');
             if (!document.querySelector('[data-testid="apps-register"]')) failures.push('originating-register-hidden');
             if (document.documentElement.scrollWidth > window.innerWidth) failures.push('overflow');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.appsWorkbenchSideProbe = appsWorkbenchSideProbe;
        const appsWorkbenchPath = smokeShotPath.replace(/native-bridge/i, 'apps-workbench');
        const appsWorkbenchImage = await win.webContents.capturePage();
        await fsp.writeFile(appsWorkbenchPath, appsWorkbenchImage.toPNG());
        receipt.appsWorkbenchScreenshot = appsWorkbenchPath;
        receipt.appsWorkbenchScreenshotBytes = (await fsp.stat(appsWorkbenchPath)).size;

        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="apps-workbench"] [data-testid="workbench-mode-toggle"]')?.click()`, true);
        await sleep(500);
        const appsWorkbenchExpandedProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             const expanded = document.querySelector('[data-testid="apps-workbench-expanded"]');
             if (!expanded) failures.push('expanded-host-missing');
             else if (expanded.getBoundingClientRect().height < 100) failures.push('expanded-not-visible');
             if (document.querySelector('[data-testid="apps-workbench"]')) failures.push('side-still-mounted');
             if (!document.querySelector('[data-testid="apps-workspace"]')) failures.push('page-hidden');
             if (document.documentElement.scrollWidth > window.innerWidth) failures.push('overflow');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.appsWorkbenchExpandedProbe = appsWorkbenchExpandedProbe;
        const appsWorkbenchExpandedPath = smokeShotPath.replace(/native-bridge/i, 'apps-workbench-expanded');
        const appsWorkbenchExpandedImage = await win.webContents.capturePage();
        await fsp.writeFile(appsWorkbenchExpandedPath, appsWorkbenchExpandedImage.toPNG());
        receipt.appsWorkbenchExpandedScreenshot = appsWorkbenchExpandedPath;
        receipt.appsWorkbenchExpandedScreenshotBytes = (await fsp.stat(appsWorkbenchExpandedPath)).size;
        await win.webContents.executeJavaScript(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`, true);
        await sleep(300);
        receipt.appsWorkbenchEscape = await win.webContents.executeJavaScript(
          `({ ok: !document.querySelector('[data-testid="apps-workbench"]') && !document.querySelector('[data-testid="apps-workbench-expanded"]') })`,
          true
        );
        await forceSize(1672, 941);
        await sleep(300);

        // Mission 15A: Cleanup side/expanded workbench over measured candidates.
        await win.webContents.executeJavaScript(`(() => { location.hash = 'home'; return true; })()`, true);
        await sleep(500);
        await win.webContents.executeJavaScript(`(() => { location.hash = 'cleanup'; return true; })()`, true);
        const cleanupWorkbenchDeadline = Date.now() + 30000;
        let cleanupWorkbenchUiReady = false;
        while (Date.now() < cleanupWorkbenchDeadline) {
          await sleep(500);
          cleanupWorkbenchUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const main = document.querySelector('[data-testid="cleanup-workspace"]');
               const tile = document.querySelector('[data-testid="cleanup-service-cleanup-temp-preview"]');
               return Boolean(main && tile && main.getBoundingClientRect().width > 100 && tile.getBoundingClientRect().width > 0);
             })()`,
            true
          );
          if (cleanupWorkbenchUiReady) break;
        }
        receipt.cleanupWorkbenchUiReady = cleanupWorkbenchUiReady;
        await sleep(1200);
        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="cleanup-service-cleanup-temp-preview"]')?.click()`, true);
        const cleanupWorkbenchHostDeadline = Date.now() + 15000;
        while (Date.now() < cleanupWorkbenchHostDeadline) {
          await sleep(300);
          const hostMounted = await win.webContents.executeJavaScript(
            `Boolean(document.querySelector('[data-testid="cleanup-workbench"]') || document.querySelector('[data-testid="cleanup-workbench-expanded"]'))`,
            true
          );
          if (hostMounted) break;
        }
        await sleep(400);
        const cleanupWorkbenchSideProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             const host = document.querySelector('[data-testid="cleanup-workbench"]');
             if (!host) return { ok: false, failures: ['side-host-missing'] };
             if (host.getAttribute('data-workbench-mode') !== 'side') failures.push('side-mode');
             if (host.getBoundingClientRect().height < 100) failures.push('side-not-visible');
             if (!host.querySelector('[data-testid="cleanup-service-focus"]')) failures.push('body-missing');
             if (String(host.innerText || '').trim().length < 40) failures.push('body-empty');
             if (!document.querySelector('[data-testid="cleanup-workspace"]')) failures.push('page-hidden');
             if (!document.querySelector('[data-testid="cleanup-actionbar"]')) failures.push('actionbar-hidden');
             if (document.documentElement.scrollWidth > window.innerWidth) failures.push('overflow');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.cleanupWorkbenchSideProbe = cleanupWorkbenchSideProbe;
        const cleanupWorkbenchPath = smokeShotPath.replace(/native-bridge/i, 'cleanup-workbench');
        const cleanupWorkbenchImage = await win.webContents.capturePage();
        await fsp.writeFile(cleanupWorkbenchPath, cleanupWorkbenchImage.toPNG());
        receipt.cleanupWorkbenchScreenshot = cleanupWorkbenchPath;
        receipt.cleanupWorkbenchScreenshotBytes = (await fsp.stat(cleanupWorkbenchPath)).size;

        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="cleanup-workbench"] [data-testid="workbench-mode-toggle"]')?.click()`, true);
        await sleep(500);
        const cleanupWorkbenchExpandedProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             const expanded = document.querySelector('[data-testid="cleanup-workbench-expanded"]');
             if (!expanded) failures.push('expanded-host-missing');
             else if (expanded.getBoundingClientRect().height < 100) failures.push('expanded-not-visible');
             if (document.querySelector('[data-testid="cleanup-workbench"]')) failures.push('side-still-mounted');
             if (!document.querySelector('[data-testid="cleanup-workspace"]')) failures.push('page-hidden');
             if (document.documentElement.scrollWidth > window.innerWidth) failures.push('overflow');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.cleanupWorkbenchExpandedProbe = cleanupWorkbenchExpandedProbe;
        const cleanupWorkbenchExpandedPath = smokeShotPath.replace(/native-bridge/i, 'cleanup-workbench-expanded');
        const cleanupWorkbenchExpandedImage = await win.webContents.capturePage();
        await fsp.writeFile(cleanupWorkbenchExpandedPath, cleanupWorkbenchExpandedImage.toPNG());
        receipt.cleanupWorkbenchExpandedScreenshot = cleanupWorkbenchExpandedPath;
        receipt.cleanupWorkbenchExpandedScreenshotBytes = (await fsp.stat(cleanupWorkbenchExpandedPath)).size;
        await win.webContents.executeJavaScript(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`, true);
        await sleep(300);
        receipt.cleanupWorkbenchEscape = await win.webContents.executeJavaScript(
          `({ ok: !document.querySelector('[data-testid="cleanup-workbench"]') && !document.querySelector('[data-testid="cleanup-workbench-expanded"]') })`,
          true
        );
        await forceSize(1672, 941);
        await sleep(300);

        // Mission 15A: Startup side/expanded workbench over measured autoruns.
        await win.webContents.executeJavaScript(`(() => { location.hash = 'home'; return true; })()`, true);
        await sleep(500);
        await win.webContents.executeJavaScript(`(() => { location.hash = 'startup'; return true; })()`, true);
        const startupWorkbenchDeadline = Date.now() + 30000;
        let startupWorkbenchUiReady = false;
        while (Date.now() < startupWorkbenchDeadline) {
          await sleep(500);
          startupWorkbenchUiReady = await win.webContents.executeJavaScript(
            `(() => {
               const main = document.querySelector('[data-testid="startup-workspace"]');
               const tile = document.querySelector('[data-testid="startup-service-startup-overview"]');
               return Boolean(main && tile && main.getBoundingClientRect().width > 100 && tile.getBoundingClientRect().width > 0);
             })()`,
            true
          );
          if (startupWorkbenchUiReady) break;
        }
        receipt.startupWorkbenchUiReady = startupWorkbenchUiReady;
        await sleep(1200);
        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="startup-service-startup-overview"]')?.click()`, true);
        const startupWorkbenchHostDeadline = Date.now() + 15000;
        while (Date.now() < startupWorkbenchHostDeadline) {
          await sleep(300);
          const hostMounted = await win.webContents.executeJavaScript(
            `Boolean(document.querySelector('[data-testid="startup-workbench"]') || document.querySelector('[data-testid="startup-workbench-expanded"]'))`,
            true
          );
          if (hostMounted) break;
        }
        await sleep(400);
        const startupWorkbenchSideProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             const host = document.querySelector('[data-testid="startup-workbench"]');
             if (!host) return { ok: false, failures: ['side-host-missing'] };
             if (host.getAttribute('data-workbench-mode') !== 'side') failures.push('side-mode');
             if (host.getBoundingClientRect().height < 100) failures.push('side-not-visible');
             if (!host.querySelector('[data-testid="startup-service-focus"]')) failures.push('body-missing');
             if (String(host.innerText || '').trim().length < 40) failures.push('body-empty');
             if (!document.querySelector('[data-testid="startup-workspace"]')) failures.push('page-hidden');
             if (!document.querySelector('[data-testid="startup-actionbar"]')) failures.push('actionbar-hidden');
             if (document.documentElement.scrollWidth > window.innerWidth) failures.push('overflow');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.startupWorkbenchSideProbe = startupWorkbenchSideProbe;
        const startupWorkbenchPath = smokeShotPath.replace(/native-bridge/i, 'startup-workbench');
        const startupWorkbenchImage = await win.webContents.capturePage();
        await fsp.writeFile(startupWorkbenchPath, startupWorkbenchImage.toPNG());
        receipt.startupWorkbenchScreenshot = startupWorkbenchPath;
        receipt.startupWorkbenchScreenshotBytes = (await fsp.stat(startupWorkbenchPath)).size;

        await win.webContents.executeJavaScript(`document.querySelector('[data-testid="startup-workbench"] [data-testid="workbench-mode-toggle"]')?.click()`, true);
        await sleep(500);
        const startupWorkbenchExpandedProbe = await win.webContents.executeJavaScript(
          `(() => {
             const failures = [];
             const expanded = document.querySelector('[data-testid="startup-workbench-expanded"]');
             if (!expanded) failures.push('expanded-host-missing');
             else if (expanded.getBoundingClientRect().height < 100) failures.push('expanded-not-visible');
             if (document.querySelector('[data-testid="startup-workbench"]')) failures.push('side-still-mounted');
             if (!document.querySelector('[data-testid="startup-workspace"]')) failures.push('page-hidden');
             if (document.documentElement.scrollWidth > window.innerWidth) failures.push('overflow');
             return { ok: failures.length === 0, failures };
           })()`,
          true
        );
        receipt.startupWorkbenchExpandedProbe = startupWorkbenchExpandedProbe;
        const startupWorkbenchExpandedPath = smokeShotPath.replace(/native-bridge/i, 'startup-workbench-expanded');
        const startupWorkbenchExpandedImage = await win.webContents.capturePage();
        await fsp.writeFile(startupWorkbenchExpandedPath, startupWorkbenchExpandedImage.toPNG());
        receipt.startupWorkbenchExpandedScreenshot = startupWorkbenchExpandedPath;
        receipt.startupWorkbenchExpandedScreenshotBytes = (await fsp.stat(startupWorkbenchExpandedPath)).size;
        await win.webContents.executeJavaScript(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`, true);
        await sleep(300);
        receipt.startupWorkbenchEscape = await win.webContents.executeJavaScript(
          `({ ok: !document.querySelector('[data-testid="startup-workbench"]') && !document.querySelector('[data-testid="startup-workbench-expanded"]') })`,
          true
        );
        await forceSize(1672, 941);
        await sleep(300);
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
    const startupData = renderer.startup;
    const startupSession = startupData?.session?.data || null;
    const startupInventory = startupData?.inventory?.data || null;
    const startupPlan = startupData?.plan?.data || null;
    const startupOk = Boolean(
      startupData?.capabilities?.status === 'complete' &&
      renderer.startupBridgePresent === true &&
      startupData.capabilities.data?.readOnly === true &&
      startupData.capabilities.data?.mutation === 'none' &&
      startupData.capabilities.data?.fixtureFallback === false &&
      startupData.capabilities.data?.serviceCount === 12 &&
      startupData.capabilities.data?.gatedCount >= 1 &&
      startupSession &&
      ['complete', 'partial', 'cancelled'].includes(startupSession.status) &&
      startupSession.stages?.length === 5 &&
      startupData?.inventory?.status === 'complete' &&
      startupInventory?.readOnly === true &&
      startupInventory?.mutation === 'none' &&
      startupInventory?.observedAt &&
      typeof startupInventory?.entryCount === 'number' &&
      typeof startupInventory?.warningCount === 'number' &&
      startupData?.services?.status === 'complete' &&
      typeof startupData.services.data?.count === 'number' &&
      startupData?.tasks?.status === 'complete' &&
      typeof startupData.tasks.data?.count === 'number' &&
      startupData?.impact?.status === 'complete' &&
      startupData.impact.data?.available === true &&
      startupData?.journal?.status === 'complete' &&
      startupData.journal.data?.available === false &&
      startupData.journal.data?.execution?.available === false &&
      startupData?.sessions?.status === 'complete' &&
      startupData.sessions.data?.available === false &&
      startupData?.report?.status === 'complete' &&
      startupData.report.data?.readOnly === true &&
      startupData.report.data?.mutation === 'none' &&
      receipt.startupServiceProbe?.ok === true &&
      receipt.startupServiceProbe?.checked === 12 &&
      (startupPlan === null || (
        startupPlan.contract === 'startup.v1' &&
        startupPlan.mutation === 'none' &&
        startupPlan.immutable === true &&
        startupPlan.execution?.available === false &&
        startupPlan.estimatedSavingsMs === null &&
        startupPlan.itemCount === 1
      ))
    );
    const startupLayoutOk = receipt.startup1366Layout?.ok === true
      && receipt.startup1366Layout?.horizontalOverflow === false;
    const systemV1Data = renderer.systemV1;
    const systemOk = Boolean(
      renderer.systemV1BridgePresent === true &&
      systemV1Data?.capabilities?.status === 'complete' &&
      systemV1Data.capabilities.capability === 'system.capabilities' &&
      systemV1Data.capabilities.data?.readOnly === true &&
      systemV1Data.capabilities.data?.mutation === 'none' &&
      systemV1Data.capabilities.data?.fixtureFallback === false &&
      systemV1Data.capabilities.data?.serviceCount === 36 &&
      systemV1Data.capabilities.data?.worldCount === 3 &&
      systemV1Data.capabilities.data?.gatedOperations?.length >= 1 &&
      systemV1Data?.started?.status === 'complete' &&
      systemV1Data.started.data?.contract === 'system.v1' &&
      systemV1Data.started.data?.readOnly === true &&
      systemV1Data.started.data?.mutation === 'none' &&
      systemV1Data?.session?.status === 'complete' &&
      systemV1Data.session.data?.contract === 'system.v1' &&
      systemV1Data.session.data?.stages?.length === 9 &&
      systemV1Data.session.data?.readOnly === true &&
      receipt.systemServiceProbe?.ok === true &&
      receipt.systemServiceProbe?.checked === 36 &&
      receipt.systemControlProbe?.ok === true &&
      receipt.systemKeyboardProbe?.ok === true &&
      receipt.systemRtlLayout?.ok === true &&
      receipt.systemUiReady === true &&
      ['complete', 'partial'].includes(receipt.systemFinalSession?.status) &&
      receipt.systemFinalSession?.progress === 100 &&
      receipt.systemFinalSession?.readOnly === true &&
      receipt.systemFinalSession?.mutation === 'none' &&
      receipt.systemFinalSession?.stages?.length === 9 &&
      receipt.systemMeasured?.processCount > 0 &&
      receipt.systemMeasured?.serviceRows > 0 &&
      receipt.systemMeasured?.metrics?.source &&
      receipt.systemMeasured?.coverage?.length === 9
    );
    const systemLayoutOk = receipt.system1366Layout?.ok === true
      && receipt.system1366Layout?.horizontalOverflow === false
      && receipt.systemRtlLayout?.ok === true;
    const repairV1Data = renderer.repairV1;
    const repairOk = Boolean(
      renderer.repairV1BridgePresent === true &&
      repairV1Data?.capabilities?.status === 'complete' &&
      repairV1Data.capabilities.capability === 'repair.capabilities' &&
      repairV1Data.capabilities.data?.readOnly === true &&
      repairV1Data.capabilities.data?.mutation === 'none' &&
      repairV1Data.capabilities.data?.fixtureFallback === false &&
      repairV1Data.capabilities.data?.serviceCount === 12 &&
      repairV1Data.capabilities.data?.commands?.length === 10 &&
      repairV1Data.capabilities.data?.gatedOperations?.length === 8 &&
      repairV1Data.capabilities.data?.elevation?.automaticElevation === false &&
      repairV1Data?.started?.status === 'complete' &&
      repairV1Data.started.data?.contract === 'repair.v1' &&
      repairV1Data.started.data?.readOnly === true &&
      repairV1Data?.session?.status === 'complete' &&
      repairV1Data.session.data?.contract === 'repair.v1' &&
      repairV1Data.session.data?.stages?.length === 6 &&
      repairV1Data.session.data?.readOnly === true &&
      ['complete', 'partial'].includes(receipt.repairFinalSession?.status) &&
      receipt.repairFinalSession?.progress === 100 &&
      receipt.repairFinalSession?.readOnly === true &&
      receipt.repairFinalSession?.mutation === 'none' &&
      receipt.repairFinalSession?.stages?.length === 6 &&
      receipt.repairMeasured?.commands === 10 &&
      receipt.repairMeasured?.gates === 8 &&
      receipt.repairJournalCount >= 1 &&
      receipt.repairControlProbe?.ok === true &&
      receipt.repairServiceProbe?.ok === true &&
      receipt.repairServiceProbe?.checked === 12 &&
      receipt.repairKeyboardProbe?.ok === true &&
      receipt.repairUiReady === true
    );
    const repairLayoutOk = receipt.repair1366Layout?.ok === true
      && receipt.repair1366Layout?.horizontalOverflow === false
      && receipt.repairRtlLayout?.ok === true;
    const servicesV1Data = renderer.servicesV1;
    const servicesOk = Boolean(
      renderer.servicesV1BridgePresent === true &&
      servicesV1Data?.capabilities?.status === 'complete' &&
      servicesV1Data.capabilities.capability === 'services.capabilities' &&
      servicesV1Data.capabilities.data?.readOnly === true &&
      servicesV1Data.capabilities.data?.mutation === 'none' &&
      servicesV1Data.capabilities.data?.fixtureFallback === false &&
      servicesV1Data.capabilities.data?.serviceCount === 12 &&
      servicesV1Data.capabilities.data?.gatedOperations?.length === 6 &&
      servicesV1Data.capabilities.data?.elevation?.automaticElevation === false &&
      servicesV1Data?.started?.status === 'complete' &&
      servicesV1Data.started.data?.contract === 'services.v1' &&
      servicesV1Data.started.data?.readOnly === true &&
      servicesV1Data?.session?.status === 'complete' &&
      servicesV1Data.session.data?.contract === 'services.v1' &&
      servicesV1Data.session.data?.stages?.length === 6 &&
      servicesV1Data.session.data?.readOnly === true &&
      ['complete', 'partial'].includes(receipt.servicesFinalSession?.status) &&
      receipt.servicesFinalSession?.progress === 100 &&
      receipt.servicesFinalSession?.readOnly === true &&
      receipt.servicesFinalSession?.mutation === 'none' &&
      receipt.servicesFinalSession?.stages?.length === 6 &&
      receipt.servicesMeasured?.total > 0 &&
      receipt.servicesMeasured?.protected > 0 &&
      receipt.servicesMeasured?.edges > 0 &&
      receipt.servicesMeasured?.eventCoverage?.status === 'available' &&
      receipt.servicesMeasured?.svchost > 0 &&
      receipt.servicesMeasured?.gates === 6 &&
      receipt.servicesJournalCount >= 1 &&
      receipt.servicesControlProbe?.ok === true &&
      receipt.servicesToolProbe?.ok === true &&
      receipt.servicesToolProbe?.checked === 12 &&
      receipt.servicesKeyboardProbe?.ok === true &&
      receipt.servicesUiReady === true
    );
    const servicesLayoutOk = receipt.services1366Layout?.ok === true
      && receipt.services1366Layout?.horizontalOverflow === false
      && receipt.servicesRtlLayout?.ok === true;
    const automationV1Data = renderer.automationV1;
    const automationOk = Boolean(
      renderer.automationV1BridgePresent === true &&
      automationV1Data?.capabilities?.status === 'complete' &&
      automationV1Data.capabilities.capability === 'automation.capabilities' &&
      automationV1Data.capabilities.data?.readOnly === true &&
      automationV1Data.capabilities.data?.mutation === 'none' &&
      automationV1Data.capabilities.data?.fixtureFallback === false &&
      automationV1Data.capabilities.data?.serviceCount === 12 &&
      automationV1Data.capabilities.data?.gatedOperations?.length === 5 &&
      automationV1Data?.started?.status === 'complete' &&
      automationV1Data.started.data?.contract === 'automation.v1' &&
      automationV1Data.started.data?.readOnly === true &&
      automationV1Data?.session?.status === 'complete' &&
      automationV1Data.session.data?.contract === 'automation.v1' &&
      automationV1Data.session.data?.stages?.length === 5 &&
      automationV1Data.session.data?.readOnly === true &&
      ['complete', 'partial'].includes(receipt.automationFinalSession?.status) &&
      receipt.automationFinalSession?.progress === 100 &&
      receipt.automationFinalSession?.readOnly === true &&
      receipt.automationFinalSession?.mutation === 'none' &&
      receipt.automationFinalSession?.stages?.length === 5 &&
      receipt.automationMeasured?.templates === 8 &&
      receipt.automationMeasured?.workflows >= 1 &&
      receipt.automationMeasured?.journal >= 1 &&
      receipt.automationMeasured?.gates === 5 &&
      receipt.automationMeasured?.coverage?.length === 5 &&
      typeof receipt.automationMeasured?.runtime?.timezone === 'string' &&
      receipt.automationMeasured?.runtime?.studioSources?.length >= 1 &&
      receipt.automationJournalCount >= 1 &&
      receipt.automationControlProbe?.ok === true &&
      receipt.automationToolProbe?.ok === true &&
      receipt.automationToolProbe?.checked === 12 &&
      receipt.automationKeyboardProbe?.ok === true &&
      receipt.automationUiReady === true
    );
    const automationLayoutOk = receipt.automation1366Layout?.ok === true
      && receipt.automation1366Layout?.horizontalOverflow === false
      && receipt.automation1366Layout?.viewportWidth === 1366
      && receipt.automationRtlLayout?.ok === true;
    const workspaceOk = Boolean(
      receipt.workspaceUiReady === true &&
      receipt.workspaceControlProbe?.ok === true &&
      receipt.workspaceControlProbe?.services === 10 &&
      receipt.workspaceRtlLayout?.ok === true &&
      receipt.workspaceScreenshotBytes > 20000 &&
      receipt.workspaceArabicScreenshotBytes > 20000 &&
      receipt.workspace1366ScreenshotBytes > 20000 &&
      receipt.workspace1920ScreenshotBytes > 20000 &&
      receipt.workspaceOauthScreenshotBytes > 20000
    );
    const workspaceLayoutOk = receipt.workspace1366Layout?.ok === true
      && receipt.workspace1366Layout?.horizontalOverflow === false
      && receipt.workspace1366Layout?.actionsVisible === true
      && receipt.workspace1366Layout?.viewportWidth === 1366
      && receipt.workspace1366Layout?.services === 10;
    const googleData = renderer.google;
    const googleStatusData = googleData?.status?.data;
    const googleOk = Boolean(
      renderer.googleBridgePresent === true &&
      googleData?.status?.status === 'complete' &&
      googleData.status.capability === 'google.status' &&
      googleStatusData?.contract === 'google.oauth.v1' &&
      googleStatusData?.connected === false &&
      googleStatusData?.connection !== 'connected' &&
      googleStatusData?.account === null &&
      googleStatusData?.storageAvailable === true &&
      receipt.googleVaultOk === true &&
      typeof googleStatusData?.configured === 'boolean' &&
      !/refresh_token|access_token|client_secret/i.test(JSON.stringify(googleStatusData || {}))
    );
    const settingsOk = Boolean(
      receipt.settingsUiReady === true &&
      receipt.settingsControlProbe?.ok === true &&
      receipt.settingsRtlLayout?.ok === true &&
      receipt.settingsScreenshotBytes > 20000 &&
      receipt.settingsArabicScreenshotBytes > 20000 &&
      receipt.settings1366ScreenshotBytes > 20000 &&
      receipt.settings1920ScreenshotBytes > 20000
    );
    const settingsLayoutOk = receipt.settings1366Layout?.ok === true
      && receipt.settings1366Layout?.horizontalOverflow === false
      && receipt.settings1366Layout?.footerVisible === true
      && receipt.settings1366Layout?.viewportWidth === 1366
      && receipt.settings1366Layout?.tabs === 7;
    const homeOk = Boolean(
      receipt.homeUiReady === true &&
      receipt.homeControlProbe?.ok === true &&
      receipt.homeRtlLayout?.ok === true &&
      receipt.homeScreenshotBytes > 20000 &&
      receipt.homeLightScreenshotBytes > 20000 &&
      receipt.homeArabicScreenshotBytes > 20000 &&
      receipt.home1366ScreenshotBytes > 20000 &&
      receipt.home1920ScreenshotBytes > 20000
    );
    const homeLayoutOk = receipt.home1366Layout?.ok === true
      && receipt.home1366Layout?.horizontalOverflow === false
      && receipt.home1366Layout?.withinWidth === true
      && receipt.home1366Layout?.viewportWidth === 1366
      && receipt.home1366Layout?.kpis === 6;
    const filesWorkbenchOk = Boolean(
      receipt.filesWorkbenchUiReady === true &&
      receipt.filesWorkbenchSideProbe?.ok === true &&
      receipt.filesWorkbenchExpandedProbe?.ok === true &&
      receipt.filesWorkbenchEscape?.ok === true &&
      receipt.filesWorkbenchSideScreenshotBytes > 20000 &&
      receipt.filesWorkbenchExpandedScreenshotBytes > 20000
    );
    const filesWorkbenchLayoutOk = receipt.filesWorkbenchSideProbe?.ok === true
      && receipt.filesWorkbenchExpandedProbe?.ok === true
      && receipt.filesWorkbenchExpandedProbe?.failures?.length === 0;
    const studioWorkbenchOk = Boolean(
      receipt.studioWorkbenchUiReady === true &&
      receipt.studioWorkbenchSideProbe?.ok === true &&
      receipt.studioWorkbenchExpandedProbe?.ok === true &&
      receipt.studioWorkbenchEscape?.ok === true &&
      receipt.studioWorkbench1366?.ok === true &&
      receipt.studioWorkbenchScreenshotBytes > 20000 &&
      receipt.studioWorkbenchExpandedScreenshotBytes > 20000 &&
      receipt.studioWorkbench1366ScreenshotBytes > 20000
    );
    const studioWorkbenchLayoutOk = receipt.studioWorkbenchSideProbe?.ok === true
      && receipt.studioWorkbenchExpandedProbe?.ok === true
      && receipt.studioWorkbench1366?.ok === true;
    const storageWorkbenchOk = Boolean(
      receipt.storageWorkbenchUiReady === true &&
      receipt.storageVolumeReady === true &&
      receipt.storageWorkbenchSideProbe?.ok === true &&
      receipt.storageWorkbenchExpandedProbe?.ok === true &&
      receipt.storageWorkbenchEscape?.ok === true &&
      receipt.storageWorkbenchScreenshotBytes > 20000 &&
      receipt.storageWorkbenchExpandedScreenshotBytes > 20000
    );
    const storageWorkbenchLayoutOk = receipt.storageWorkbenchSideProbe?.ok === true
      && receipt.storageWorkbenchExpandedProbe?.ok === true;
    const scanWorkbenchOk = Boolean(
      receipt.scanWorkbenchUiReady === true &&
      receipt.scanWorkbenchSideProbe?.ok === true &&
      receipt.scanWorkbenchExpandedProbe?.ok === true &&
      receipt.scanWorkbenchEscape?.ok === true &&
      receipt.scanWorkbenchScreenshotBytes > 20000 &&
      receipt.scanWorkbenchExpandedScreenshotBytes > 20000
    );
    const scanWorkbenchLayoutOk = receipt.scanWorkbenchSideProbe?.ok === true
      && receipt.scanWorkbenchExpandedProbe?.ok === true;
    const appsWorkbenchOk = Boolean(
      receipt.appsWorkbenchUiReady === true &&
      receipt.appsWorkbenchDataReady === true &&
      receipt.appsWorkbenchSideProbe?.ok === true &&
      receipt.appsWorkbenchExpandedProbe?.ok === true &&
      receipt.appsWorkbenchEscape?.ok === true &&
      receipt.appsWorkbenchScreenshotBytes > 20000 &&
      receipt.appsWorkbenchExpandedScreenshotBytes > 20000
    );
    const appsWorkbenchLayoutOk = receipt.appsWorkbenchSideProbe?.ok === true
      && receipt.appsWorkbenchExpandedProbe?.ok === true;
    const cleanupWorkbenchOk = Boolean(
      receipt.cleanupWorkbenchUiReady === true &&
      receipt.cleanupWorkbenchSideProbe?.ok === true &&
      receipt.cleanupWorkbenchExpandedProbe?.ok === true &&
      receipt.cleanupWorkbenchEscape?.ok === true &&
      receipt.cleanupWorkbenchScreenshotBytes > 20000 &&
      receipt.cleanupWorkbenchExpandedScreenshotBytes > 20000
    );
    const cleanupWorkbenchLayoutOk = receipt.cleanupWorkbenchSideProbe?.ok === true
      && receipt.cleanupWorkbenchExpandedProbe?.ok === true;
    const startupWorkbenchOk = Boolean(
      receipt.startupWorkbenchUiReady === true &&
      receipt.startupWorkbenchSideProbe?.ok === true &&
      receipt.startupWorkbenchExpandedProbe?.ok === true &&
      receipt.startupWorkbenchEscape?.ok === true &&
      receipt.startupWorkbenchScreenshotBytes > 20000 &&
      receipt.startupWorkbenchExpandedScreenshotBytes > 20000
    );
    const startupWorkbenchLayoutOk = receipt.startupWorkbenchSideProbe?.ok === true
      && receipt.startupWorkbenchExpandedProbe?.ok === true;
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
      receipt.cleanupUiReady === true &&
      receipt.startupScreenshotBytes > 20000 &&
      receipt.startupLightScreenshotBytes > 20000 &&
      receipt.startupArabicScreenshotBytes > 20000 &&
      receipt.startup1366ScreenshotBytes > 20000 &&
      receipt.startup1920ScreenshotBytes > 20000 &&
      receipt.startupUiReady === true &&
      receipt.systemScreenshotBytes > 20000 &&
      receipt.systemWorkbenchScreenshotBytes > 20000 &&
      receipt.systemLightScreenshotBytes > 20000 &&
      receipt.systemArabicScreenshotBytes > 20000 &&
      receipt.system1366ScreenshotBytes > 20000 &&
      receipt.system1920ScreenshotBytes > 20000 &&
      receipt.systemUiReady === true &&
      receipt.repairScreenshotBytes > 20000 &&
      receipt.repairWorkbenchScreenshotBytes > 20000 &&
      receipt.repairLightScreenshotBytes > 20000 &&
      receipt.repairArabicScreenshotBytes > 20000 &&
      receipt.repair1366ScreenshotBytes > 20000 &&
      receipt.repair1920ScreenshotBytes > 20000 &&
      receipt.repairUiReady === true &&
      receipt.servicesScreenshotBytes > 20000 &&
      receipt.servicesWorkbenchScreenshotBytes > 20000 &&
      receipt.servicesLightScreenshotBytes > 20000 &&
      receipt.servicesArabicScreenshotBytes > 20000 &&
      receipt.services1366ScreenshotBytes > 20000 &&
      receipt.services1920ScreenshotBytes > 20000 &&
      receipt.servicesUiReady === true &&
      receipt.automationScreenshotBytes > 20000 &&
      receipt.automationWorkbenchScreenshotBytes > 20000 &&
      receipt.automationLightScreenshotBytes > 20000 &&
      receipt.automationArabicScreenshotBytes > 20000 &&
      receipt.automation1366ScreenshotBytes > 20000 &&
      receipt.automation1920ScreenshotBytes > 20000 &&
      receipt.automationUiReady === true
    );
    receipt.checks = { securityOk, bridgeOk, providerOk, studioOk, filesOk, storageOk, scanOk, smartScanLayoutOk, appsOk, appsLayoutOk, cleanupOk, cleanupLayoutOk, startupOk, startupLayoutOk, systemOk, systemLayoutOk, repairOk, repairLayoutOk, servicesOk, servicesLayoutOk, automationOk, automationLayoutOk, workspaceOk, workspaceLayoutOk, googleOk, settingsOk, settingsLayoutOk, homeOk, homeLayoutOk, filesWorkbenchOk, filesWorkbenchLayoutOk, studioWorkbenchOk, studioWorkbenchLayoutOk, storageWorkbenchOk, storageWorkbenchLayoutOk, scanWorkbenchOk, scanWorkbenchLayoutOk, appsWorkbenchOk, appsWorkbenchLayoutOk, cleanupWorkbenchOk, cleanupWorkbenchLayoutOk, startupWorkbenchOk, startupWorkbenchLayoutOk, screenshotOk, windowControlOk };
    receipt.ok = Boolean(securityOk && bridgeOk && providerOk && studioOk && filesOk && storageOk && scanOk && smartScanLayoutOk && appsOk && appsLayoutOk && cleanupOk && cleanupLayoutOk && startupOk && startupLayoutOk && systemOk && systemLayoutOk && repairOk && repairLayoutOk && servicesOk && servicesLayoutOk && automationOk && automationLayoutOk && workspaceOk && workspaceLayoutOk && googleOk && settingsOk && settingsLayoutOk && homeOk && homeLayoutOk && filesWorkbenchOk && filesWorkbenchLayoutOk && studioWorkbenchOk && studioWorkbenchLayoutOk && storageWorkbenchOk && storageWorkbenchLayoutOk && scanWorkbenchOk && scanWorkbenchLayoutOk && appsWorkbenchOk && appsWorkbenchLayoutOk && cleanupWorkbenchOk && cleanupWorkbenchLayoutOk && startupWorkbenchOk && startupWorkbenchLayoutOk && screenshotOk && windowControlOk);
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
    try {
      startupBridge = new StartupBridge({
        loadProvider: () => loadProvider({ isPackaged: app.isPackaged }),
      });
      trace('startup bridge initialized');
    } catch (error) {
      trace(`startup bridge init failed: ${error?.message || error}`);
      console.error('[gemini-shell] Boot Control coordinator unavailable:', error?.message || error);
      startupBridge = null;
    }
    try {
      systemBridge = new SystemBridge({
        loadProvider: () => loadProvider({ isPackaged: app.isPackaged }),
      });
      trace('system bridge initialized');
    } catch (error) {
      trace(`system bridge init failed: ${error?.message || error}`);
      console.error('[gemini-shell] Live Pulse observatory unavailable:', error?.message || error);
      systemBridge = null;
    }
    try {
      repairBridge = new RepairBridge({
        userDataPath: app.getPath('userData'),
      });
      trace('repair bridge initialized');
    } catch (error) {
      trace(`repair bridge init failed: ${error?.message || error}`);
      console.error('[gemini-shell] Recovery Lab coordinator unavailable:', error?.message || error);
      repairBridge = null;
    }
    try {
      servicesBridge = new ServicesBridge({
        userDataPath: app.getPath('userData'),
        loadProvider: () => loadProvider({ isPackaged: app.isPackaged }),
      });
      trace('services bridge initialized');
    } catch (error) {
      trace(`services bridge init failed: ${error?.message || error}`);
      console.error('[gemini-shell] Service Commander coordinator unavailable:', error?.message || error);
      servicesBridge = null;
    }
    try {
      automationBridge = new AutomationBridge({
        userDataPath: app.getPath('userData'),
        loadProvider: () => loadProvider({ isPackaged: app.isPackaged }),
        loadStudioSources: () => studioBridge?.listSources?.() || [],
      });
      trace('automation bridge initialized');
    } catch (error) {
      trace(`automation bridge init failed: ${error?.message || error}`);
      console.error('[gemini-shell] Flow Studio coordinator unavailable:', error?.message || error);
      automationBridge = null;
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
  trace('constructing google oauth coordinator');
  if (isSmoke) {
    const oauthRoot = path.join(app.getPath('userData'), 'oauth');
    await fsp.rm(path.join(oauthRoot, 'google-refresh.bin'), { force: true }).catch(() => {});
    await fsp.rm(path.join(oauthRoot, 'selected-sheets.json'), { force: true }).catch(() => {});
  }
  googleOAuthService = new GoogleOAuthService({
    safeStorage,
    shell,
    userDataPath: app.getPath('userData'),
    env: process.env,
  });
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
  void systemBridge?.close?.();
  void repairBridge?.close?.();
  void servicesBridge?.close?.();
  void automationBridge?.close?.();
  startupBridge?.dispose();
  cleanupBridge?.dispose();
  appBridge?.dispose();
  scanBridge?.dispose();
  void filesBridge?.dispose();
  void studioBridge?.dispose();
});

app.on('window-all-closed', () => {
  app.quit();
});
