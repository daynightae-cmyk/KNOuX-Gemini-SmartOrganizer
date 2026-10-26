'use strict';

/**
 * Runs the real Electron renderer in a temporary profile, calls one read-only
 * Windows provider through the preload IPC boundary, captures the visible
 * bridge panel and asserts the security envelope.
 *
 *   npm run desktop:smoke             # project Electron + built dist
 *   npm run desktop:packaged-smoke    # release/win-unpacked executable
 */

const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const { spawn } = require('node:child_process');

const appRoot = path.resolve(__dirname, '..');
const packaged = process.argv.includes('--packaged');
const packagedDirArg = process.argv.find((entry) => entry.startsWith('--packaged-dir='));
const packagedDir = packagedDirArg ? packagedDirArg.slice('--packaged-dir='.length) : process.env.KNOUX_PACKAGED_DIR;
const evidenceDir = path.join(appRoot, 'visual-evidence', 'platform-00');
const receiptPath = path.join(evidenceDir, packaged ? 'native-smoke-packaged.json' : 'native-smoke-dev.json');
const shotPath = path.join(evidenceDir, packaged ? 'native-bridge-packaged.png' : 'native-bridge-dev.png');
const summaryPath = path.join(evidenceDir, packaged ? 'native-smoke-summary-packaged.json' : 'native-smoke-summary-dev.json');
// Keep controlled smoke data inside the gitignored dependency cache so the
// committed screenshots/receipts never expose the Windows user profile.
const profilePath = path.join(appRoot, 'node_modules', '.cache', `knoux-gemini-smoke-${process.pid}-${Date.now()}`);
const homeDir = os.homedir();
const tempDir = os.tmpdir();
function redactDeep(value) {
  if (typeof value === 'string') {
    return value
      .split(homeDir).join('<home>')
      .split(tempDir).join('<temp>')
      // Also catch 8.3 short profile paths and forward-slash file URLs.
      .replace(/([A-Za-z]:[\\/]Users[\\/])[^\\/"']+/g, '$1<user>');
  }
  if (Array.isArray(value)) return value.map(redactDeep);
  if (value && typeof value === 'object') {
    const next = {};
    for (const [key, entry] of Object.entries(value)) next[key] = redactDeep(entry);
    return next;
  }
  return value;
}

function fail(message) {
  console.error(`[native-smoke] ${message}`);
  process.exit(1);
}

function resolvePackagedExe() {
  const candidates = [
    ...(packagedDir ? [path.resolve(packagedDir)] : []),
    path.join(appRoot, 'release-gemini', 'win-unpacked'),
    path.join(appRoot, 'release', 'win-unpacked'),
  ];
  const dir = candidates.find((candidate) => fs.existsSync(candidate));
  if (!dir) fail('release-gemini/win-unpacked is missing; run npm run desktop:pack first.');
  const exe = fs.readdirSync(dir).find((entry) => entry.toLowerCase().endsWith('.exe') && !/uninstall/i.test(entry));
  if (!exe) fail('No packaged executable found in the packaged output directory.');
  return path.join(dir, exe);
}

async function main() {
  await fsp.mkdir(evidenceDir, { recursive: true });
  await fsp.mkdir(profilePath, { recursive: true });
  const studioSource = path.join(profilePath, 'studio-source');
  await fsp.mkdir(path.join(studioSource, 'images'), { recursive: true });
  await fsp.mkdir(path.join(studioSource, 'nested'), { recursive: true });
  await fsp.writeFile(path.join(studioSource, 'notes.txt'), 'KNOuX controlled smoke fixture\n', 'utf8');
  await fsp.writeFile(path.join(studioSource, 'table.csv'), 'name,value\na,1\n', 'utf8');
  await fsp.writeFile(path.join(studioSource, 'app.ts'), 'export const fixture = true;\n', 'utf8');
  await fsp.writeFile(path.join(studioSource, 'nested', 'readme.md'), '# controlled fixture\n', 'utf8');
  const imageCandidates = [
    'image_091f4380.png',
    'image_0ab1aa96.png',
    'image_2294bf8c.png',
  ];
  for (const image of imageCandidates) {
    const from = path.join(appRoot, 'public', 'assets', 'aistudio', image);
    if (fs.existsSync(from)) await fsp.copyFile(from, path.join(studioSource, 'images', image));
  }
  const args = [
    `--knoux-native-smoke=${receiptPath}`,
    `--knoux-native-smoke-shot=${shotPath}`,
    `--knoux-user-data=${profilePath}`,
    `--knoux-studio-smoke-root=${studioSource}`,
  ];
  let command;
  let commandArgs;
  if (packaged) {
    command = resolvePackagedExe();
    commandArgs = args;
  } else {
    command = require('electron');
    commandArgs = [path.join(appRoot, 'electron', 'main.cjs'), ...args];
  }

  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.KNOUX_GEMINI_DEV;
  delete env.KNOUX_NATIVE_FIXTURES;

  const startedAt = new Date().toISOString();
  const child = spawn(command, commandArgs, {
    cwd: packaged ? path.dirname(command) : appRoot,
    env,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString().slice(0, 12000); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString().slice(0, 12000); });

  const timeout = setTimeout(() => {
    child.kill();
    fail('Electron smoke timed out after 360 seconds.');
  }, 360000);

  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  }).catch((error) => {
    clearTimeout(timeout);
    fail(`Electron launch failed: ${error.message}`);
  });
  clearTimeout(timeout);

  let receipt = null;
  try {
    receipt = redactDeep(JSON.parse(await fsp.readFile(receiptPath, 'utf8')));
    // The committed receipt must not contain the machine user profile.
    await fsp.writeFile(receiptPath, JSON.stringify(receipt, null, 2), 'utf8');
  } catch (error) {
    fail(`Smoke receipt was not written (${error.message}).\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
  }

  const shotExists = fs.existsSync(shotPath);
  const shotBytes = shotExists ? (await fsp.stat(shotPath)).size : 0;
  const smartScanBase = receipt?.smartScanScreenshot || shotPath.replace(/native-bridge/i, 'smart-scan-measured');
  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: packaged ? 'packaged' : 'development',
    command,
    args: commandArgs,
    exitCode,
    receiptPath,
    shotPath,
    shotBytes,
    lightShotPath: shotPath.replace(/\.png$/i, '-light.png'),
    arabicShotPath: shotPath.replace(/\.png$/i, '-ar-light.png'),
    studioShotPath: shotPath.replace(/native-bridge/i, 'studio-measured'),
    studioPlanShotPath: shotPath.replace(/native-bridge/i, 'studio-plan'),
    studioHistoryShotPath: shotPath.replace(/native-bridge/i, 'studio-history'),
    filesShotPath: shotPath.replace(/native-bridge/i, 'files-measured'),
    storageShotPath: shotPath.replace(/native-bridge/i, 'storage-measured'),
    smartScanShotPath: smartScanBase,
    smartScanLightShotPath: receipt?.smartScanLightScreenshot || smartScanBase.replace(/\.png$/i, '-light.png'),
    smartScanArabicShotPath: receipt?.smartScanArabicScreenshot || smartScanBase.replace(/\.png$/i, '-ar-light.png'),
    smartScan1366ShotPath: receipt?.smartScan1366Screenshot || smartScanBase.replace(/\.png$/i, '-1366.png'),
    smartScan1366BottomShotPath: receipt?.smartScan1366BottomScreenshot || smartScanBase.replace(/\.png$/i, '-1366-bottom.png'),
    smartScan1920ShotPath: receipt?.smartScan1920Screenshot || smartScanBase.replace(/\.png$/i, '-1920.png'),
    cleanupShotPath: receipt?.cleanupScreenshot || shotPath.replace(/native-bridge/i, 'cleanup-measured'),
    cleanupLightShotPath: receipt?.cleanupLightScreenshot || '',
    cleanupArabicShotPath: receipt?.cleanupArabicScreenshot || '',
    cleanup1366ShotPath: receipt?.cleanup1366Screenshot || '',
    cleanup1920ShotPath: receipt?.cleanup1920Screenshot || '',
    startupShotPath: receipt?.startupScreenshot || shotPath.replace(/native-bridge/i, 'startup-measured'),
    startupLightShotPath: receipt?.startupLightScreenshot || '',
    startupArabicShotPath: receipt?.startupArabicScreenshot || '',
    startup1366ShotPath: receipt?.startup1366Screenshot || '',
    startup1920ShotPath: receipt?.startup1920Screenshot || '',
    systemShotPath: receipt?.systemScreenshot || shotPath.replace(/native-bridge/i, 'system-measured'),
    systemWorkbenchShotPath: receipt?.systemWorkbenchScreenshot || '',
    systemLightShotPath: receipt?.systemLightScreenshot || '',
    systemArabicShotPath: receipt?.systemArabicScreenshot || '',
    system1366ShotPath: receipt?.system1366Screenshot || '',
    system1920ShotPath: receipt?.system1920Screenshot || '',
    repairShotPath: receipt?.repairScreenshot || shotPath.replace(/native-bridge/i, 'repair-measured'),
    repairWorkbenchShotPath: receipt?.repairWorkbenchScreenshot || '',
    repairLightShotPath: receipt?.repairLightScreenshot || '',
    repairArabicShotPath: receipt?.repairArabicScreenshot || '',
    repair1366ShotPath: receipt?.repair1366Screenshot || '',
    repair1920ShotPath: receipt?.repair1920Screenshot || '',
    servicesShotPath: receipt?.servicesScreenshot || shotPath.replace(/native-bridge/i, 'services-measured'),
    servicesWorkbenchShotPath: receipt?.servicesWorkbenchScreenshot || '',
    servicesLightShotPath: receipt?.servicesLightScreenshot || '',
    servicesArabicShotPath: receipt?.servicesArabicScreenshot || '',
    services1366ShotPath: receipt?.services1366Screenshot || '',
    services1920ShotPath: receipt?.services1920Screenshot || '',
    automationShotPath: receipt?.automationScreenshot || shotPath.replace(/native-bridge/i, 'automation-measured'),
    automationWorkbenchShotPath: receipt?.automationWorkbenchScreenshot || '',
    automationLightShotPath: receipt?.automationLightScreenshot || '',
    automationArabicShotPath: receipt?.automationArabicScreenshot || '',
    automation1366ShotPath: receipt?.automation1366Screenshot || '',
    automation1920ShotPath: receipt?.automation1920Screenshot || '',
    workspaceShotPath: receipt?.workspaceScreenshot || shotPath.replace(/native-bridge/i, 'workspace-measured'),
    workspaceArabicShotPath: receipt?.workspaceArabicScreenshot || '',
    workspace1366ShotPath: receipt?.workspace1366Screenshot || '',
    workspace1920ShotPath: receipt?.workspace1920Screenshot || '',
    workspaceOauthShotPath: receipt?.workspaceOauthScreenshot || '',
    settingsShotPath: receipt?.settingsScreenshot || shotPath.replace(/native-bridge/i, 'settings-measured'),
    settingsArabicShotPath: receipt?.settingsArabicScreenshot || '',
    settings1366ShotPath: receipt?.settings1366Screenshot || '',
    settings1920ShotPath: receipt?.settings1920Screenshot || '',
    lightShotBytes: receipt?.lightScreenshotBytes || 0,
    arabicShotBytes: receipt?.arabicScreenshotBytes || 0,
    studioShotBytes: receipt?.studioScreenshotBytes || 0,
    studioPlanShotBytes: receipt?.studioPlanScreenshotBytes || 0,
    studioHistoryShotBytes: receipt?.studioHistoryScreenshotBytes || 0,
    filesShotBytes: receipt?.filesScreenshotBytes || 0,
    storageShotBytes: receipt?.storageScreenshotBytes || 0,
    smartScanShotBytes: receipt?.smartScanScreenshotBytes || 0,
    smartScanLightShotBytes: receipt?.smartScanLightScreenshotBytes || 0,
    smartScanArabicShotBytes: receipt?.smartScanArabicScreenshotBytes || 0,
    smartScan1366ShotBytes: receipt?.smartScan1366ScreenshotBytes || 0,
    smartScan1366BottomShotBytes: receipt?.smartScan1366BottomScreenshotBytes || 0,
    smartScan1920ShotBytes: receipt?.smartScan1920ScreenshotBytes || 0,
    cleanupShotBytes: receipt?.cleanupScreenshotBytes || 0,
    cleanupLightShotBytes: receipt?.cleanupLightScreenshotBytes || 0,
    cleanupArabicShotBytes: receipt?.cleanupArabicScreenshotBytes || 0,
    cleanup1366ShotBytes: receipt?.cleanup1366ScreenshotBytes || 0,
    cleanup1920ShotBytes: receipt?.cleanup1920ScreenshotBytes || 0,
    startupShotBytes: receipt?.startupScreenshotBytes || 0,
    startupLightShotBytes: receipt?.startupLightScreenshotBytes || 0,
    startupArabicShotBytes: receipt?.startupArabicScreenshotBytes || 0,
    startup1366ShotBytes: receipt?.startup1366ScreenshotBytes || 0,
    startup1920ShotBytes: receipt?.startup1920ScreenshotBytes || 0,
    systemShotBytes: receipt?.systemScreenshotBytes || 0,
    systemWorkbenchShotBytes: receipt?.systemWorkbenchScreenshotBytes || 0,
    systemLightShotBytes: receipt?.systemLightScreenshotBytes || 0,
    systemArabicShotBytes: receipt?.systemArabicScreenshotBytes || 0,
    system1366ShotBytes: receipt?.system1366ScreenshotBytes || 0,
    system1920ShotBytes: receipt?.system1920ScreenshotBytes || 0,
    repairShotBytes: receipt?.repairScreenshotBytes || 0,
    repairWorkbenchShotBytes: receipt?.repairWorkbenchScreenshotBytes || 0,
    repairLightShotBytes: receipt?.repairLightScreenshotBytes || 0,
    repairArabicShotBytes: receipt?.repairArabicScreenshotBytes || 0,
    repair1366ShotBytes: receipt?.repair1366ScreenshotBytes || 0,
    repair1920ShotBytes: receipt?.repair1920ScreenshotBytes || 0,
    servicesShotBytes: receipt?.servicesScreenshotBytes || 0,
    servicesWorkbenchShotBytes: receipt?.servicesWorkbenchScreenshotBytes || 0,
    servicesLightShotBytes: receipt?.servicesLightScreenshotBytes || 0,
    servicesArabicShotBytes: receipt?.servicesArabicScreenshotBytes || 0,
    services1366ShotBytes: receipt?.services1366ScreenshotBytes || 0,
    services1920ShotBytes: receipt?.services1920ScreenshotBytes || 0,
    automationShotBytes: receipt?.automationScreenshotBytes || 0,
    automationWorkbenchShotBytes: receipt?.automationWorkbenchScreenshotBytes || 0,
    automationLightShotBytes: receipt?.automationLightScreenshotBytes || 0,
    automationArabicShotBytes: receipt?.automationArabicScreenshotBytes || 0,
    automation1366ShotBytes: receipt?.automation1366ScreenshotBytes || 0,
    automation1920ShotBytes: receipt?.automation1920ScreenshotBytes || 0,
    workspaceShotBytes: receipt?.workspaceScreenshotBytes || 0,
    workspaceArabicShotBytes: receipt?.workspaceArabicScreenshotBytes || 0,
    workspace1366ShotBytes: receipt?.workspace1366ScreenshotBytes || 0,
    workspace1920ShotBytes: receipt?.workspace1920ScreenshotBytes || 0,
    workspaceOauthShotBytes: receipt?.workspaceOauthScreenshotBytes || 0,
    settingsShotBytes: receipt?.settingsScreenshotBytes || 0,
    settingsArabicShotBytes: receipt?.settingsArabicScreenshotBytes || 0,
    settings1366ShotBytes: receipt?.settings1366ScreenshotBytes || 0,
    settings1920ShotBytes: receipt?.settings1920ScreenshotBytes || 0,
    receiptOk: receipt?.ok === true,
    checks: receipt?.checks || null,
    stdoutTail: stdout.slice(-2000),
    stderrTail: stderr.slice(-2000),
  };
  const safeSummary = redactDeep(summary);
  await fsp.writeFile(summaryPath, JSON.stringify(safeSummary, null, 2), 'utf8');

  await fsp.rm(profilePath, { recursive: true, force: true }).catch(() => {});

  const shotsOk = shotBytes > 20000 &&
    summary.lightShotBytes > 20000 &&
    summary.arabicShotBytes > 20000 &&
    summary.studioShotBytes > 20000 &&
    summary.studioPlanShotBytes > 20000 &&
    summary.studioHistoryShotBytes > 20000 &&
    summary.filesShotBytes > 20000 &&
    summary.storageShotBytes > 20000 &&
    summary.smartScanShotBytes > 20000 &&
    summary.smartScanLightShotBytes > 20000 &&
    summary.smartScanArabicShotBytes > 20000 &&
    summary.smartScan1366ShotBytes > 20000 &&
    summary.smartScan1366BottomShotBytes > 20000 &&
    summary.smartScan1920ShotBytes > 20000 &&
    summary.cleanupShotBytes > 20000 &&
    summary.cleanupLightShotBytes > 20000 &&
    summary.cleanupArabicShotBytes > 20000 &&
    summary.cleanup1366ShotBytes > 20000 &&
    summary.cleanup1920ShotBytes > 20000 &&
    summary.startupShotBytes > 20000 &&
    summary.startupLightShotBytes > 20000 &&
    summary.startupArabicShotBytes > 20000 &&
    summary.startup1366ShotBytes > 20000 &&
    summary.startup1920ShotBytes > 20000 &&
    summary.systemShotBytes > 20000 &&
    summary.systemWorkbenchShotBytes > 20000 &&
    summary.systemLightShotBytes > 20000 &&
    summary.systemArabicShotBytes > 20000 &&
    summary.system1366ShotBytes > 20000 &&
    summary.system1920ShotBytes > 20000 &&
    summary.repairShotBytes > 20000 &&
    summary.repairWorkbenchShotBytes > 20000 &&
    summary.repairLightShotBytes > 20000 &&
    summary.repairArabicShotBytes > 20000 &&
    summary.repair1366ShotBytes > 20000 &&
    summary.repair1920ShotBytes > 20000 &&
    summary.servicesShotBytes > 20000 &&
    summary.servicesWorkbenchShotBytes > 20000 &&
    summary.servicesLightShotBytes > 20000 &&
    summary.servicesArabicShotBytes > 20000 &&
    summary.services1366ShotBytes > 20000 &&
    summary.services1920ShotBytes > 20000 &&
    summary.automationShotBytes > 20000 &&
    summary.automationWorkbenchShotBytes > 20000 &&
    summary.automationLightShotBytes > 20000 &&
    summary.automationArabicShotBytes > 20000 &&
    summary.automation1366ShotBytes > 20000 &&
    summary.automation1920ShotBytes > 20000 &&
    summary.workspaceShotBytes > 20000 &&
    summary.workspaceArabicShotBytes > 20000 &&
    summary.workspace1366ShotBytes > 20000 &&
    summary.workspace1920ShotBytes > 20000 &&
    summary.workspaceOauthShotBytes > 20000 &&
    summary.settingsShotBytes > 20000 &&
    summary.settingsArabicShotBytes > 20000 &&
    summary.settings1366ShotBytes > 20000 &&
    summary.settings1920ShotBytes > 20000;
  console.log(JSON.stringify({ ok: summary.receiptOk && exitCode === 0 && shotsOk, ...safeSummary }, null, 2));
  if (!summary.receiptOk || exitCode !== 0 || !shotsOk) {
    console.error('[native-smoke] FAILED — inspect native-smoke-dev.json and native-bridge-dev.png');
    process.exit(1);
  }
  console.log('[native-smoke] PASS — secure renderer -> preload -> IPC -> Windows provider -> screenshot');
}

main().catch(async (error) => {
  await fsp.rm(profilePath, { recursive: true, force: true }).catch(() => {});
  fail(error.stack || error.message);
});
