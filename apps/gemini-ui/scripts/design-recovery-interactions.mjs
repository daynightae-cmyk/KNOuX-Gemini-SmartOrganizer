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
const proof={checks:[], errors:[]};
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
 await win.evaluate(w=>{if(w.isMaximized())w.unmaximize();w.setContentSize(1366,768,false);});
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
 const graph=page.locator('.auto-editor-grid');
 await page.screenshot({path:path.join(out,'automation-editor-1366.png'),animations:'disabled'});
 console.log(await page.evaluate(()=>[...document.querySelectorAll('.knx-command-canvas,.knx-command-hero,.knx-command-metrics,.knx-command-body,.auto-editor-grid')].map(e=>({name:e.className,h:e.getBoundingClientRect().height,y:e.getBoundingClientRect().y,rows:getComputedStyle(e).gridTemplateRows}))));
 await expect(graph).toBeVisible();
 const bounds=await graph.boundingBox();
 await page.screenshot({path:path.join(out,'automation-editor-1366.png'),animations:'disabled'});
 console.log('Flow editor bounds',bounds);
 if(!bounds || bounds.height<180) throw new Error('Flow editor is compressed below 180px');
 proof.checks.push(`Flow editor has ${Math.round(bounds.height)}px of operating height at 1366x768`);
 await page.screenshot({path:path.join(out,'automation-editor-1366.png'),animations:'disabled'});
 proof.ok=proof.errors.length===0;
} catch(error) { proof.errors.push(String(error)); proof.ok=false; }
finally { await app.close(); }
await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2));
console.log(JSON.stringify(proof,null,2));
if(!proof.ok)process.exitCode=1;
