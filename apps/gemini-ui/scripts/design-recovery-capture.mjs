/**
 * KNOuX — compact current-state visual pass over the eleven owner references.
 *
 * One isolated-profile Electron run against the built renderer. Captures the
 * ten referenced routes in the reference language (EN, LTR) at 1672x941 in
 * their reference theme. This is a delta-finding pass, not a full evidence
 * matrix: one frame per route, no service-level sweeps.
 */
import { _electron as electron } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, writeFile, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const OUT = path.resolve(process.env.KNOUX_VISUAL_OUT || '../../docs/evidence/design-recovery-20261030/before');
await mkdir(OUT, { recursive: true });
const ROUTES = [
  { section: 'home', root: 'home-workspace', theme: 'light' },
  { section: 'studio', root: 'studio-workspace', theme: 'light' },
  { section: 'workspace', root: 'workspace-hub', theme: 'light' },
  { section: 'startup', root: 'startup-workspace', theme: 'light' },
  { section: 'smart_scan', root: 'scan-workspace', theme: 'light' },
  { section: 'applications', root: 'apps-workspace', theme: 'dark' },
  { section: 'services', root: 'services-workspace', theme: 'dark' },
  { section: 'repair', root: 'repair-workspace', theme: 'dark' },
  { section: 'system', root: 'system-workspace', theme: 'dark' },
  { section: 'automation', root: 'automation-workspace', theme: 'dark' },
];

const profile = await mkdtemp(path.join(os.tmpdir(), 'knoux-visual-pass-'));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const app = await electron.launch({
  executablePath: require('electron'),
  args: [path.resolve('electron/main.cjs'), '--disable-gpu', '--knoux-user-data=' + profile],
  env,
  timeout: 60000,
});

const sourcePaths=['src/visual/ServicePipeline.tsx','src/visual/design-recovery.css','src/operations/OrganizationStudioOverview.tsx','electron/native/scan-bridge.cjs'];
const sourceHashes=Object.fromEntries(await Promise.all(sourcePaths.map(async file=>[file,createHash('sha256').update(await readFile(file)).digest('hex')])));
const proof = { sourceHashes, head: (await import('node:child_process')).execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), workingTree: 'uncommitted', capturedAt: new Date().toISOString(), frames: [], errors: [] };

const page = await app.firstWindow();
page.on('pageerror', (e) => proof.errors.push(String(e.message).slice(0, 300)));
await page.waitForLoadState('domcontentloaded');
await page.evaluate(() => {
  localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
});

async function setViewport(width, height) {
  const w = await app.browserWindow(page);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await w.evaluate((win, [ww, hh]) => {
      if (win.isMaximized()) win.unmaximize();
      if (win.isFullScreen()) win.setFullScreen(false);
      win.setContentSize(ww, hh, false);
    }, [width, height]);
    let actual = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
    for (let tick = 0; tick < 25 && (actual.w !== width || actual.h !== height); tick += 1) {
      await page.waitForTimeout(120);
      actual = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
    }
    if (actual.w === width && actual.h === height) return;
  }
  throw new Error('viewport did not settle');
}

for (const { section, root, theme: referenceTheme } of ROUTES.filter(r => !process.env.KNOUX_VISUAL_ROUTES || process.env.KNOUX_VISUAL_ROUTES.split(',').includes(r.section))) {
  const theme = process.env.KNOUX_VISUAL_THEME === 'opposite' ? (referenceTheme === 'light' ? 'dark' : 'light') : process.env.KNOUX_VISUAL_THEME || referenceTheme;
  const locale = process.env.KNOUX_VISUAL_LOCALE || 'en';
  const [width,height] = (process.env.KNOUX_VISUAL_SIZE || '1672x941').split('x').map(Number);
  await page.evaluate(({ section, theme, locale }) => {
    localStorage.setItem('knoux_locale', locale);
    localStorage.setItem('knoux_theme', theme);
    location.hash = section;
  }, { section, theme, locale });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByTestId(root).waitFor({ timeout: 45000 });
  // Settle: wait until no domain is still publishing a native measurement.
  // "Not measured" is a settled state, so it must not count as progress.
  const started = Date.now();
  while (Date.now() - started < Number(process.env.KNOUX_VISUAL_WAIT_MS || 18000)) {
    const state = await page.evaluate(() => ({
      scanning:
        Boolean(document.querySelector('[data-testid$="-scan-progress"]')) ||
        /Reading the measured inventory…|Reading the measured inventory\.\.\.|Awaiting measured|Measuring live data|Start discovery/i.test(document.body.innerText.slice(0, 8000)),
    }));
    if (!state.scanning && Date.now() - started > 4000) break;
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => {});
  await setViewport(width, height);
  await page.waitForTimeout(700);
  const file = path.join(OUT, `${section}-${locale}-${theme}-${width}.png`);
  await page.screenshot({ path: file, animations: 'disabled' });
  const applied = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
    dir: document.documentElement.getAttribute('dir'),
    scrollHeight: document.scrollingElement?.scrollHeight ?? 0,
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
    scrollWidth: document.scrollingElement?.scrollWidth,
    geometry: Object.fromEntries(['.approved-hero','.approved-hero-actions','.approved-quick','.osa-hero','.osa-body','.knx-command-hero','.knx-command-metrics','.knx-command-inspector'].flatMap(selector=>{
      const el=document.querySelector(selector);if(!el)return [];const r=el.getBoundingClientRect();return [[selector,{x:r.x,y:r.y,width:r.width,height:r.height}]];
    })),
    pipelines: [...document.querySelectorAll('.knx-pipe')].map(el=>({id:el.getAttribute('data-testid'), stages:[...el.querySelectorAll('.knx-pipe-node')].map(n=>({id:n.getAttribute('data-stage'),state:n.getAttribute('data-state'),text:n.textContent}))})),
    criticalClipping: ['.approved-hero-actions','.approved-kpis','.osa-metrics'].flatMap(selector=>{
      const el=document.querySelector(selector);const hero=el?.closest('.approved-hero,.osa-hero');if(!el||!hero)return [];
      const r=el.getBoundingClientRect(),h=hero.getBoundingClientRect();return r.bottom>h.bottom+1||r.top<h.top-1?[selector]:[];
    }),
    orbitalConnections:[...document.querySelectorAll('.knx-pipe-glass')].map(el=>({outletX:el.dataset.outletX,outletY:el.dataset.outletY,trackWidth:el.parentElement.getBoundingClientRect().width})),
  }));
  if(applied.theme!==theme || applied.dir!==(locale==='ar'?'rtl':'ltr') || applied.innerWidth!==width || applied.innerHeight!==height || applied.scrollHeight>height || applied.scrollWidth>width) proof.errors.push(`${section}: geometry/theme/locale mismatch`);
  if(applied.criticalClipping.length) proof.errors.push(`${section}: critical clipping: ${applied.criticalClipping.join(', ')}`);
  proof.frames.push({ section, theme, file: path.basename(file), applied });
  console.log(`${section}: ${path.basename(file)} · ${applied.theme}/${applied.dir} · ${applied.innerWidth}x${applied.innerHeight}`);
}

proof.ok = proof.errors.length === 0;
await writeFile(path.join(OUT, 'visual-pass-proof.json'), JSON.stringify(proof, null, 2));
await app.close();
console.log('done', proof.ok ? 'OK' : 'WITH ERRORS', JSON.stringify(proof.errors));
if(!proof.ok) process.exitCode=1;
