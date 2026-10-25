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
        return {
          href: location.href,
          readyState: document.readyState,
          rootChildren: document.querySelector('#root')?.childElementCount || 0,
          bridgePresent: Boolean(api),
          studioBridgePresent: Boolean(studioApi),
          filesBridgePresent: Boolean(filesApi),
          storageBridgePresent: Boolean(storageApi),
          scanBridgePresent: Boolean(scanApi),
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
      receipt.smartScanUiReady === true
    );
    receipt.checks = { securityOk, bridgeOk, providerOk, studioOk, filesOk, storageOk, scanOk, smartScanLayoutOk, screenshotOk, windowControlOk };
    receipt.ok = Boolean(securityOk && bridgeOk && providerOk && studioOk && filesOk && storageOk && scanOk && smartScanLayoutOk && screenshotOk && windowControlOk);
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
  scanBridge?.dispose();
  void filesBridge?.dispose();
  void studioBridge?.dispose();
});

app.on('window-all-closed', () => {
  app.quit();
});
