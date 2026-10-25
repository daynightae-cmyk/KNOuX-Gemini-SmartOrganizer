'use strict';

/**
 * Targeted read-only Applications test (Mission 05).
 *
 * Controlled temp folders and stub Windows providers prove the coordinator
 * derives all services from measured evidence, bounds every read, keeps
 * Authenticode/association/size results honest and never exposes a mutation.
 */

const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { AppBridge, SERVICE_DEFINITIONS, GATED_OPERATIONS } = require('../electron/native/app-bridge.cjs');

const failures = [];
const assert = (condition, label) => {
  if (!condition) failures.push(label);
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function sumBytes(value) {
  return Buffer.byteLength(String(value));
}

async function main() {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'knoux-apps-'));
  const appOne = path.join(root, 'Controlled App One');
  const appTwo = path.join(root, 'Controlled App Two');
  const localAppData = path.join(root, 'LocalAppData');
  const vestige = path.join(localAppData, 'Unrelated Vestige');
  await fsp.mkdir(path.join(appOne, 'data'), { recursive: true });
  await fsp.mkdir(path.join(appTwo, 'data'), { recursive: true });
  await fsp.mkdir(path.join(localAppData, 'Controlled App One'), { recursive: true });
  await fsp.mkdir(vestige, { recursive: true });
  await fsp.writeFile(path.join(appOne, 'app.exe'), Buffer.alloc(5000, 1));
  await fsp.writeFile(path.join(appOne, 'data', 'one.bin'), Buffer.alloc(3000, 2));
  await fsp.writeFile(path.join(appOne, 'data', 'two.bin'), Buffer.alloc(2000, 3));
  await fsp.writeFile(path.join(appTwo, 'data', 'orphan.bin'), Buffer.alloc(700, 4));
  await fsp.writeFile(path.join(localAppData, 'Controlled App One', 'cache.bin'), Buffer.alloc(1500, 5));
  await fsp.writeFile(path.join(vestige, 'left.bin'), Buffer.alloc(900, 6));

  const before = await fsp.readdir(root, { recursive: true });
  const beforeSizes = [];
  for (const entry of before) {
    const full = path.join(root, entry);
    try {
      const stat = await fsp.stat(full);
      if (stat.isFile()) beforeSizes.push(`${entry}:${stat.size}`);
    } catch {}
  }

  const startups = [
    {
      name: 'Controlled Sync Helper',
      command: `"${path.join(appOne, 'app.exe')}" --startup`,
      source: 'registry-run-user',
      sourceDetail: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      writable: true,
    },
    {
      name: 'Unlinked Background Agent',
      command: '"C:\\ProgramData\\Vendor\\background.exe" /quiet',
      source: 'startup-folder-common',
      sourceDetail: 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\StartUp',
      writable: false,
    },
  ];

  const provider = {
    collectUninstallApps: async () => ({
      items: [
        {
          name: 'Controlled App One',
          version: '1.2.3',
          publisher: 'KNOuX Test',
          installLocation: appOne,
          uninstallString: 'MsiExec.exe /X{11111111-2222-3333-4444-555555555555}',
          installDate: '20260102',
          installSource: path.join(root, 'source'),
          estimatedSize: '2048',
          releaseType: '',
          systemComponent: '',
          windowsInstaller: '1',
          displayIcon: path.join(appOne, 'app.exe'),
          source: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ControlledAppOne',
        },
        {
          name: 'Controlled Missing App',
          version: '4.5.6',
          publisher: 'KNOuX Test',
          installLocation: path.join(root, 'Absent Folder'),
          uninstallString: 'uninstall.exe',
          installDate: '20250110',
          estimatedSize: '512',
          source: 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ControlledMissing',
        },
        {
          name: 'Windows Shared Component',
          version: '10.0.0',
          publisher: 'Microsoft Corporation',
          installLocation: path.join(appOne, 'system'),
          estimatedSize: '16',
          systemComponent: '1',
          source: 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Shared',
        },
      ],
      sourceFailures: 0,
      entryFailures: 0,
    }),
    collectAppxApps: async () => [
      {
        name: 'Controlled.Store.App',
        version: '2.0.0',
        publisher: 'CN=KNOuX Test',
        installLocation: path.join(root, 'StoreApp'),
        architecture: 'x64',
        packageIdentity: 'Controlled.Store.App_2.0.0.0_x64__test',
        isFramework: false,
        nonRemovable: false,
        evidence: { packageFullName: 'Controlled.Store.App_2.0.0.0_x64__test' },
      },
      {
        name: 'Controlled.Framework',
        version: '1.0.0',
        publisher: 'CN=KNOuX Test',
        installLocation: path.join(root, 'Framework'),
        packageIdentity: 'Controlled.Framework_1.0.0.0_x64__test',
        isFramework: true,
        nonRemovable: true,
        evidence: { packageFullName: 'Controlled.Framework_1.0.0.0_x64__test' },
      },
    ],
    collectStartupItems: async () => startups,
  };

  const invocations = [];
  const runner = async (binary, args) => {
    invocations.push({ binary, args });
    if (args[0] === '--version') return { stdout: 'v1.9.0\n', stderr: '' };
    if (args[0] === 'upgrade') {
      return {
        stdout: [
          'Name                          Id                     Version   Available  Source',
          '-----------------------------------------------------------------------------',
          'Controlled App One            KNOuX.ControlledApp    1.2.3     1.3.0      winget',
          'Controlled Store App          KNOuX.StoreApp         2.0.0     2.1.0      msstore',
          '',
        ].join('\n'),
        stderr: '',
      };
    }
    if (args[0] === 'search') {
      return {
        stdout: [
          'Name                    Id                        Version  Source',
          '-----------------------------------------------------------------',
          'Controlled Viewer       KNOuX.ControlledViewer    3.2.1    winget',
          '',
        ].join('\n'),
        stderr: '',
      };
    }
    throw new Error(`unexpected runner call ${binary} ${args.join(' ')}`);
  };

  const bridge = new AppBridge({
    loadProvider: () => provider,
    platform: 'win32',
    env: { LOCALAPPDATA: localAppData, APPDATA: path.join(root, 'Roaming'), ProgramData: path.join(root, 'ProgramData') },
    homeDir: root,
    tempDir: root,
    runner,
    verifySignature: async (executable) => ({
      status: 'Valid',
      message: 'Signature verified',
      signer: 'CN=KNOuX Test, O=KNOuX',
      issuer: 'CN=KNOuX Test CA',
      thumbprint: 'AABBCCDDEEFF00112233445566778899AABBCCDD',
      notBefore: '2026-01-01T00:00:00.000Z',
      notAfter: '2027-01-01T00:00:00.000Z',
      chain: [
        { subject: 'CN=KNOuX Test, O=KNOuX', issuer: 'CN=KNOuX Test CA', thumbprint: 'AABBCCDDEEFF00112233445566778899AABBCCDD' },
        { subject: 'CN=KNOuX Test CA', issuer: 'CN=KNOuX Root', thumbprint: '1122334455667788990011223344556677889900' },
      ],
    }),
    readAssociations: async () => ({
      extensions: [
        {
          key: '.txt',
          progId: 'txtfile',
          userChoice: 'Controlled.Txt',
          handlerName: 'Controlled Text',
          command: '"C:\\Windows\\notepad.exe" "%1"',
        },
        {
          key: '.knoux',
          progId: 'KNOuX.Document',
          userChoice: null,
          handlerName: 'KNOuX Document',
          command: '"C:\\Program Files\\KNOuX\\knoux.exe" "%1"',
        },
      ],
      protocols: [
        { key: 'knoux', progId: 'knoux', handlerName: 'KNOuX Protocol', command: '"C:\\Program Files\\KNOuX\\knoux.exe" "%1"' },
      ],
      truncated: false,
    }),
  });

  const capabilities = bridge.capabilities();
  assert(capabilities.contract === 'apps.v1', 'capabilities declare apps.v1');
  assert(capabilities.readOnly === true && capabilities.mutation === 'none', 'capabilities are read-only');
  assert(capabilities.fixtureFallback === false, 'no fixture fallback');
  assert(capabilities.services.length === 12, 'twelve service descriptors');
  assert(SERVICE_DEFINITIONS.length === 12 && GATED_OPERATIONS.length >= 3, 'service and gate definitions exported');
  assert(capabilities.gatedOperations.some((gate) => gate.id === 'apps.uninstall.execute' && gate.mission === '08'), 'uninstall is gated to Mission 08');
  assert(bridge.settingsTarget('defaultapps').uri === 'ms-settings:defaultapps', 'default-apps handoff URI is fixed');
  let invalidSettings = false;
  try {
    bridge.settingsTarget('control');
  } catch (error) {
    invalidSettings = error.code === 'APP_SETTINGS_TARGET_INVALID';
  }
  assert(invalidSettings, 'non-allowlisted Settings URI is rejected');

  const inventory = await bridge.inventory();
  assert(inventory.contract === 'apps.v1' && inventory.readOnly === true && inventory.mutation === 'none', 'inventory envelope is read-only');
  assert(inventory.apps.length === 5, `five measured app records (got ${inventory.apps.length})`);
  assert(inventory.coverage.registryItems === 3 && inventory.coverage.appxItems === 2, 'coverage reports both sources');
  assert(inventory.kpis.installed === 5, 'KPI installed count is measured');
  assert(inventory.kpis.publishers === 3, `KPI publisher count is measured (got ${inventory.kpis.publishers})`);
  assert(inventory.kpis.packaged === 2, 'KPI packaged count is measured');
  assert(inventory.kpis.protectedCount === 2, `KPI protected count covers system and non-removable packages (got ${inventory.kpis.protectedCount})`);
  assert(inventory.kpis.startupLinked === 1 && inventory.kpis.startupEntries === 2, 'startup linkage is measured');
  assert(inventory.kpis.staleRegistrations === 2, `stale registration is measured (got ${inventory.kpis.staleRegistrations})`);
  assert(inventory.coverage.existenceChecked >= 3, 'existence was checked for bounded install locations');
  assert(inventory.startup.find((entry) => entry.name === 'Controlled Sync Helper')?.linkedAppName === 'Controlled App One', 'startup entry links to the measured app');
  assert(inventory.startup.every((entry) => entry.commandExposed === false && entry.bootSeconds === null), 'startup commands stay unexposed and boot seconds stay null');

  const appOneRecord = inventory.apps.find((app) => app.name === 'Controlled App One');
  const missingRecord = inventory.apps.find((app) => app.name === 'Controlled Missing App');
  const protectedRecord = inventory.apps.find((app) => app.name === 'Windows Shared Component');
  assert(appOneRecord?.scope === 'per-user' && appOneRecord?.productCode === '{11111111-2222-3333-4444-555555555555}', 'registry identity and MSI product code are derived');
  assert(appOneRecord?.installLocationExists === true, 'existing install location is confirmed');
  assert(missingRecord?.installLocationExists === false, 'missing install location is confirmed');
  assert(protectedRecord?.protected === true && protectedRecord?.isSystemComponent === true, 'system components are marked protected');
  assert(inventory.apps.every((app) => app.uninstallCommandExposed === false), 'raw uninstall commands are never exposed');
  assert(appOneRecord?.estimatedSizeBytes === 2048 * 1024, 'reported size is preserved separately');

  const signature = await bridge.signature(appOneRecord.id);
  assert(signature.status === 'valid', 'Authenticode status maps to valid');
  assert(signature.signer?.includes('KNOuX Test') && signature.chain.length === 2, 'signer and bounded chain are returned');
  assert(signature.thumbprint?.length === 40, 'certificate thumbprint is returned');
  assert((await bridge.signature(appOneRecord.id)).checkedAt === signature.checkedAt, 'signature result is cached per app');

  // The real PowerShell path must not inherit a mixed PSModulePath: Windows
  // PowerShell 5.1 otherwise loads PowerShell 7's Security module and refuses
  // Get-AuthenticodeSignature with duplicate type-data errors.
  const powershellCalls = [];
  const powershellBridge = new AppBridge({
    loadProvider: () => provider,
    platform: 'win32',
    env: { LOCALAPPDATA: localAppData, APPDATA: path.join(root, 'Roaming'), ProgramData: path.join(root, 'ProgramData') },
    homeDir: root,
    tempDir: root,
    runner: async (binary, args, options) => {
      powershellCalls.push({ binary, args, options });
      return {
        stdout: JSON.stringify({
          status: 'Valid',
          message: 'Signature verified from PowerShell stub',
          signer: 'CN=KNOuX Test, O=KNOuX',
          issuer: 'CN=KNOuX Test CA',
          thumbprint: 'AABBCCDDEEFF00112233445566778899AABBCCDD',
          notBefore: '2026-01-01T00:00:00.000Z',
          notAfter: '2027-01-01T00:00:00.000Z',
          chain: [],
        }),
        stderr: '',
      };
    },
  });
  const powershellInventory = await powershellBridge.inventory();
  const powershellApp = powershellInventory.apps.find((app) => app.name === 'Controlled App One');
  const powershellSignature = await powershellBridge.signature(powershellApp.id);
  assert(powershellSignature.status === 'valid', 'PowerShell signature output is parsed');
  assert(powershellCalls.length === 1 && powershellCalls[0].binary === 'powershell.exe', 'signature verification runs through Windows PowerShell');
  const powershellModulePath = powershellCalls[0]?.options?.env?.PSModulePath || '';
  assert(
    /WindowsPowerShell[\\/]v1\.0[\\/]Modules$/i.test(powershellModulePath) && !/PowerShell[\\/]7/i.test(powershellModulePath),
    'Authenticode uses the isolated Windows PowerShell module path'
  );

  const associations = await bridge.associations();
  assert(associations.extensions.length === 2 && associations.protocols.length === 1, 'bounded association sample is returned');
  const txt = associations.extensions.find((entry) => entry.key === '.txt');
  assert(txt?.conflict === true && txt?.userChoice === 'Controlled.Txt', 'UserChoice override is flagged');
  assert(associations.extensions.find((entry) => entry.key === '.knoux')?.commandExe === 'knoux.exe', 'handler command is reduced to an executable name');
  assert(associations.warnings.some((warning) => /handoff/i.test(warning)), 'association handoff is labelled as non-mutating');

  const sizes = await bridge.sizes({ appIds: [appOneRecord.id, missingRecord.id], operationId: 'test-size-op-0001' });
  assert(sizes.requested === 2 && sizes.measured === 1, 'size command counts requested versus measured');
  const measuredOne = sizes.results.find((result) => result.appId === appOneRecord.id);
  assert(measuredOne?.measuredBytes === 10000, `measured bytes equal the controlled files (got ${measuredOne?.measuredBytes})`);
  assert(measuredOne?.files === 3 && measuredOne?.folders >= 2, 'file and folder counts are measured');
  assert(measuredOne?.topFolders[0]?.name === 'data' && measuredOne?.topFolders[0]?.bytes === 5000, 'first-level contributions are measured');
  assert(measuredOne?.appData?.bytes === 1500 && measuredOne?.appData?.confidence === 'name-match', 'AppData contribution is a measured name match');
  assert(sizes.results.find((result) => result.appId === missingRecord.id)?.reason?.includes('does not exist'), 'missing folder is reported honestly');

  const refreshed = await bridge.inventory();
  const refreshedOne = refreshed.apps.find((app) => app.id === appOneRecord.id);
  assert(refreshedOne?.size.measuredBytes === 10000 && refreshedOne?.size.source === 'measured', 'measured footprint is retained in the inventory');

  const leftovers = await bridge.leftovers();
  assert(leftovers.mutation === 'none', 'leftovers are read-only');
  assert(leftovers.staleCount === 2 && leftovers.candidates.some((candidate) => candidate.kind === 'stale-registration'), 'stale registration is a candidate');
  assert(leftovers.candidates.some((candidate) => candidate.label === 'Unrelated Vestige'), 'unmatched AppData folder is a low-confidence candidate');
  assert(!leftovers.candidates.some((candidate) => candidate.label === 'Controlled App One'), 'name-matched AppData folder is not a leftover');

  const notChecked = await bridge.updates({ check: false });
  assert(notChecked.installed === true && notChecked.status === 'not-checked', 'WinGet presence is detected without a network query');
  const updates = await bridge.updates({ check: true });
  assert(updates.status === 'available' && updates.items.length === 2, 'WinGet upgrade table is parsed');
  assert(updates.items[0].id === 'KNOuX.ControlledApp' && updates.items[0].available === '1.3.0', 'upgrade identity and version are parsed');
  assert(invocations.filter((call) => call.args[0] === 'upgrade').every((call) => !call.args.includes('--accept-source-agreements')), 'WinGet agreements are never accepted');

  const packagesInstalled = await bridge.packages({ tab: 'installed' });
  assert(packagesInstalled.status === 'complete' && packagesInstalled.packages.length === 2, 'installed Appx packages are listed');
  const packagesDiscover = await bridge.packages({ tab: 'discover', query: 'controlled viewer' });
  assert(packagesDiscover.status === 'complete' && packagesDiscover.packages[0]?.id === 'KNOuX.ControlledViewer', 'WinGet discovery result is parsed');
  let invalidQuery = false;
  try {
    await bridge.packages({ tab: 'discover', query: '" & calc.exe' });
  } catch (error) {
    invalidQuery = error.code === 'APP_PACKAGE_QUERY_INVALID';
  }
  assert(invalidQuery, 'unsafe package query is rejected before spawning');

  const plan = await bridge.plan({ appIds: [appOneRecord.id, protectedRecord.id] });
  assert(plan.immutable === true && plan.mutation === 'none', 'plan is immutable and non-mutating');
  assert(plan.totals.count === 2 && plan.totals.blocked === 1, 'plan blocks protected system components');
  assert(plan.items.find((item) => item.appId === protectedRecord.id)?.risk === 'blocked', 'system component risk is blocked');
  assert(plan.items.find((item) => item.appId === appOneRecord.id)?.risk === 'high', 'startup-linked app needs high-risk review');
  assert(plan.items.every((item) => item.reversible === false), 'uninstall is never claimed reversible');
  assert(plan.execution.available === false && plan.execution.gate.includes('Mission 08'), 'execution is gated to Mission 08');
  assert(plan.restorePoint.status === 'not-checked', 'restore point is not claimed');
  assert(plan.totals.reclaimBytes === 10000 + 16 * 1024, 'plan reclaim preview mixes measured and reported evidence');

  // Cancellation must stop the remaining apps and say so.
  let cancelRequested = false;
  const cancelBridge = new AppBridge({
    loadProvider: () => provider,
    platform: 'win32',
    env: { LOCALAPPDATA: localAppData, APPDATA: path.join(root, 'Roaming'), ProgramData: path.join(root, 'ProgramData') },
    homeDir: root,
    tempDir: root,
    runner,
    measureFolderSize: async (folder, options) => {
      if (!cancelRequested) {
        cancelRequested = true;
        cancelBridge.cancelSizes('test-size-op-0002');
      }
      return { bytes: 10, files: 1, folders: 1, partial: Boolean(options.isCancelled?.()), reason: 'cancelled', topFolders: [] };
    },
  });
  await cancelBridge.inventory();
  const cancelled = await cancelBridge.sizes({ appIds: [appOneRecord.id, missingRecord.id], operationId: 'test-size-op-0002' });
  assert(cancelled.results.length === 1, 'cancellation stops after the in-flight app');
  assert(cancelled.warnings.some((warning) => /cancelled/i.test(warning)), 'cancellation is reported honestly');
  assert((await cancelBridge.cancelSizes('test-size-op-0002')).cancelled === false, 'cancel after completion is rejected');

  const unsupported = new AppBridge({ platform: 'linux', loadProvider: () => provider });
  let platformRejected = false;
  try {
    await unsupported.inventory();
  } catch (error) {
    platformRejected = error.code === 'APP_PLATFORM_UNSUPPORTED';
  }
  assert(platformRejected, 'non-Windows inventory is unsupported');

  const after = await fsp.readdir(root, { recursive: true });
  const afterSizes = [];
  for (const entry of after) {
    const full = path.join(root, entry);
    try {
      const stat = await fsp.stat(full);
      if (stat.isFile()) afterSizes.push(`${entry}:${stat.size}`);
    } catch {}
  }
  assert(before.length === after.length, 'no file was added or removed');
  assert(beforeSizes.sort().join('|') === afterSizes.sort().join('|'), 'no file content changed');
  assert(sumBytes(JSON.stringify(inventory)) > 1000, 'inventory evidence is serialisable for the renderer');

  await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
  await wait(10);

  const result = {
    ok: failures.length === 0,
    apps: inventory.apps.length,
    kpis: inventory.kpis,
    startup: inventory.startup.length,
    signature: signature.status,
    associations: associations.extensions.length + associations.protocols.length,
    measuredBytes: measuredOne?.measuredBytes ?? null,
    leftovers: leftovers.candidates.length,
    updates: updates.items.length,
    planBlocked: plan.totals.blocked,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('[apps-native-test] PASS');
}

main().catch((error) => {
  console.error('[apps-native-test] FAIL', error);
  process.exit(1);
});
