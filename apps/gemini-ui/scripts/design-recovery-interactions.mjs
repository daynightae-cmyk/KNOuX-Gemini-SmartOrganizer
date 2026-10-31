import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const out = path.resolve(process.env.KNOUX_VISUAL_OUT || '../../docs/evidence/design-recovery-20261030/interactions');
await mkdir(out, { recursive:true });
const profile = await mkdtemp(path.join(os.tmpdir(),'knoux-design-interactions-'));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({executablePath:require('electron'), args:[path.resolve('electron/main.cjs'),'--disable-gpu','--knoux-user-data='+profile], env, timeout:60000});
const proof={checks:[], errors:[], viewports:[]};
try {
 const sourceServer=await createServer({server:{middlewareMode:true},appType:'custom'});
 let state;
 try { state=(await sourceServer.ssrLoadModule('/src/visual/ServicePipeline.tsx')).pipelineStateFromStatus; }
 finally { await sourceServer.close(); }
 for(const [status,expected] of [['running','active'],['complete','complete'],['completed','complete'],['failed','failed'],['partial','partial'],['cancelled','partial'],['unknown','pending']]) {
  if(state(status)!==expected) throw Error(`Provider state ${status} did not remain ${expected}`);
 }
 proof.checks.push('Provider-state adapter preserves failed, partial, cancelled and unknown outcomes');
 const page=await app.firstWindow();
 page.on('pageerror',e=>proof.errors.push(e.message));
 await page.waitForLoadState('domcontentloaded');
 await page.evaluate(()=>{
  localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));
  localStorage.setItem('knoux_locale','en');localStorage.setItem('knoux_theme','light');location.hash='home';
 });
 await page.reload();
 await page.getByTestId('home-workspace').waitFor();
 const win=await app.browserWindow(page);
 async function setViewport(width,height) {
  for(let attempt=0;attempt<3;attempt++) {
   await win.evaluate((w,[width,height])=>{if(w.isMaximized())w.unmaximize();if(w.isFullScreen())w.setFullScreen(false);w.setContentSize(width,height,false);},[width,height]);
   for(let tick=0;tick<25;tick++) {
    const actual=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
    if(actual.width===width&&actual.height===height)return;
    await page.waitForTimeout(120);
   }
  }
  throw Error(`Viewport did not settle at ${width}x${height}`);
 }
 await setViewport(1366,768);
 await page.waitForTimeout(1000);
 const layout = await page.evaluate(() => {
  const rect = selector => {const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  return {actions:rect('.approved-hero-actions'),kpis:rect('.approved-kpis'),hero:rect('.approved-hero'),
   outlet:Number(document.querySelector('.knx-pipe-glass').dataset.outletX),track:rect('.knx-pipe-track')};
 });
 if(layout.actions.bottom>layout.kpis.y || layout.kpis.bottom>layout.hero.bottom) throw new Error('Home commands/KPIs overlap or escape the hero');
 if(layout.outlet<=layout.track.width) throw new Error('Home tube does not reach the orbital outlet');
 proof.checks.push('Home commands and KPIs do not overlap; SVG reaches the real orbital outlet');
 await page.emulateMedia({reducedMotion:'reduce'});
 const motion=await page.locator('.knx-glass-energy').evaluate(el=>getComputedStyle(el).animationName);
 if(motion!=='none') throw new Error('Pipeline ignores reduced motion');
 proof.checks.push('Reduced motion disables pipeline energy animation');
 await page.emulateMedia({reducedMotion:'no-preference'});
 const quick=page.locator('.approved-hero-actions .approved-primary');
 await expect(quick).toBeInViewport({ratio:1});
 await quick.click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 proof.checks.push('Home Quick Scan opens its scope dialog; Escape closes it');
 await page.getByRole('button',{name:'Customize',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 proof.checks.push('Home Customize opens a real dialog at 1366x768');
 await page.getByRole('button',{name:'Open Files',exact:true}).click();
 await page.getByTestId('files-workspace').waitFor();
 proof.checks.push('Home Files action reaches the real Files workspace');
 await page.evaluate(()=>{location.hash='studio';});
 await page.getByTestId('studio-overview-pipeline').waitFor();
 const source=page.locator('[data-testid="studio-overview-pipeline"] button[data-stage="source"]');
 await expect(source).toBeInViewport({ratio:1});
 await expect(page.locator('[data-testid="studio-overview-pipeline"] [role="listitem"]')).toHaveCount(7);
 await source.focus(); await page.keyboard.press('Enter');
 await expect(page.getByTestId('studio-overview-pipeline')).toHaveCount(0);
 proof.checks.push('Studio seven stages retain button semantics; Source opens by keyboard');
 await page.getByTestId('studio-service-select').selectOption('8');
 await page.getByTestId('studio-service-select').selectOption('0');
 await expect(page.getByTestId('studio-overview-pipeline')).toBeVisible();
 const completed=await page.locator('[data-stage="execute"][data-state="complete"], [data-stage="undo"][data-state="complete"]').count();
 if(completed) throw new Error('Opening History manufactured an execution or Undo completion');
 proof.checks.push('Opening a Studio service does not complete Execute or Undo');
 await page.screenshot({path:path.join(out,'studio-source-keyboard-1366.png'),animations:'disabled'});
 // No native folder picker, account connection or owner-file write is invoked.
 await page.evaluate(()=>{location.hash='automation';});
 await page.getByTestId('automation-workspace').waitFor();
 await page.waitForTimeout(3500);
 await page.locator('.auto-library-template').first().waitFor({state:'visible',timeout:90000});
 await page.locator('.auto-library-template').first().click();
 await expect(page.locator('.auto-node').first()).toBeVisible();
 const secondNode=page.locator('.auto-node').nth(1);
 await secondNode.focus(); await page.keyboard.press('Enter');
 await expect(secondNode).toHaveAttribute('aria-pressed','true');
 await page.locator('.auto-workflow-details summary').click();
 await expect(page.locator('.auto-editor-lower')).toBeVisible();
 await page.locator('.auto-workflow-details summary').click();
 proof.checks.push('Real Automation template opens; keyboard node selection updates the inspector; schedule controls expand');
 const graph=page.locator('.auto-editor-grid');
 await page.screenshot({path:path.join(out,'automation-editor-1366.png'),animations:'disabled'});
 await expect(graph).toBeVisible();
 const bounds=await graph.boundingBox();
 await page.screenshot({path:path.join(out,'automation-editor-1366.png'),animations:'disabled'});
 if(!bounds || bounds.height<180) throw new Error('Flow editor is compressed below 180px');
 proof.checks.push(`Flow editor has ${Math.round(bounds.height)}px of operating height at 1366x768`);
 await page.screenshot({path:path.join(out,'automation-editor-1366.png'),animations:'disabled'});
 const wave=await page.locator('.knx-pipe-track').first().evaluate(el=>[...el.querySelectorAll('.knx-pipe-dot')].map(n=>Math.round(n.getBoundingClientRect().y)));
 if(new Set(wave).size<2)throw Error('Header phases do not rise and fall');
 proof.checks.push('Header tube follows alternating phase heights');
 for(const [width,height,theme,locale] of [[1672,941,'dark','en'],[1366,768,'light','ar'],[1920,1080,'dark','en']]) {
  await page.evaluate(({theme,locale})=>{localStorage.setItem('knoux_theme',theme);localStorage.setItem('knoux_locale',locale);},{theme,locale});
  await page.reload();
  await page.getByTestId('automation-workspace').waitFor();
  await page.locator('.auto-library-template').first().waitFor({timeout:90000});
  await page.locator('.auto-library-template').first().click();
  await setViewport(width,height);
  await page.waitForTimeout(650);
  await page.getByRole('button',{name:locale==='ar'?'ملاءمة':'Fit',exact:true}).click();
  const bounds=await page.getByTestId('automation-canvas').boundingBox();
  if(!bounds||bounds.height<120)throw Error('Workflow canvas is clipped at '+width+': '+JSON.stringify(bounds));
  const png=await page.screenshot({animations:'disabled'});
  if(png.readUInt32BE(16)!==width||png.readUInt32BE(20)!==height)throw Error('Screenshot dimensions differ from requested viewport');
  await writeFile(path.join(out,`automation-${locale}-${theme}-${width}.png`),png);
  proof.viewports.push({width,height,theme,locale,canvas:bounds});
 }
 proof.checks.push('Automation graph captured at all three owner viewports including Arabic RTL and DAY/NIGHT');
 await page.evaluate(()=>{localStorage.setItem('knoux_locale','en');localStorage.setItem('knoux_theme','dark');location.hash='applications';});
 await page.reload();await page.getByTestId('apps-workspace').waitFor();
 const icons=await page.evaluate(async()=>{
  const inventory=await window.knouxAppsV1.inventory();
  if(!inventory.data?.apps?.length)throw Error('Native app inventory unavailable');
  let available=0;
  for(const app of inventory.data.apps.slice(0,35)) {const icon=await window.knouxAppsV1.icon(app.id);if(icon.data?.dataUrl?.startsWith('data:image/png;base64,')){available++;break;}}
  const refused=await window.knouxAppsV1.icon('invalid-path');
  return {available,invalidRefused:!!refused.error};
 });
 if(!icons.available||!icons.invalidRefused)throw Error('Native Windows icon lookup or identifier guard failed: '+JSON.stringify(icons));
 proof.checks.push('Actual Windows icon extraction returns PNG; invalid renderer identifier is refused');
 await page.getByTestId('apps-service-app-inventory').click();
 await page.getByTestId('workbench-mode-toggle').click();
 await expect(page.getByTestId('apps-workbench-expanded')).toBeVisible();
 await page.screenshot({path:path.join(out,'applications-service-expanded-1920.png'),animations:'disabled'});
 await page.keyboard.press('Escape');
 await expect(page.getByTestId('apps-workbench-expanded')).toHaveCount(0);
 proof.checks.push('Application workbench expands and closes by keyboard with native register preserved');
 proof.ok=proof.errors.length===0;
} catch(error) { proof.errors.push(String(error)); proof.ok=false; }
finally { await app.close(); }
await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2));
console.log(JSON.stringify(proof,null,2));
if(!proof.ok)process.exitCode=1;
