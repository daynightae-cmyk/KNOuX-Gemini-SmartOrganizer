/** Built Electron UI matrix. Only disposable fixture reads; no owner effects. */
import {_electron as electron,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const require=createRequire(import.meta.url),{fixture}=require('./live-organization-fixtures.cjs');
const f=await fixture(40),out=path.resolve(process.env.KNOUX_SERVICE_OUT||'../../docs/evidence/service-workspaces-20261101/matrix');await mkdir(out,{recursive:true});
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:require('electron'),args:[path.resolve('electron/main.cjs'),'--disable-gpu','--knoux-user-data='+f.profile],env,timeout:60000});
const proof={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:'uncommitted',frames:[],checks:[],errors:[],sourceHashes:{},ok:false};
const routes=[['home','home-workspace'],['studio','studio-workspace'],['files','files-workspace'],['smart_scan','scan-workspace'],['applications','apps-workspace'],['storage','storage-workspace'],['cleanup','cleanup-workspace'],['startup','startup-workspace'],['system','system-workspace'],['repair','repair-workspace'],['services','services-workspace'],['automation','automation-workspace'],['settings','settings-root'],['workspace','workspace-hub']].filter(([route])=>!process.env.KNOUX_SERVICE_ROUTES||process.env.KNOUX_SERVICE_ROUTES.split(',').includes(route));
try{
 await app.evaluate(({dialog},source)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[source]});dialog.showMessageBox=async()=>({response:1,checkboxChecked:false});},f.source);
 const page=await app.firstWindow();page.on('pageerror',error=>proof.errors.push(error.message));await page.waitForLoadState('domcontentloaded');
 await page.evaluate(()=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale','en');localStorage.setItem('knoux_theme','dark');});await page.reload();
 await page.getByTestId('home-workspace').waitFor({timeout:60000});
 let measured; for(let attempt=0;attempt<4;attempt++){try{measured=await page.evaluate(async()=>{const picked=await window.knouxFilesV1.chooseSource();if(!picked.data)throw Error('Fixture source not authorized: '+JSON.stringify(picked));const scan=await window.knouxFilesV1.scanSource(picked.data.id);if(scan.error)throw Error(scan.error.message);return scan.data;});break;}catch(error){if(attempt===3)throw error;await page.waitForTimeout(600);}}
 proof.checks.push({nativeFixtureSource:measured?.path,fixtureCount:40,note:'Native Files index; picker constrained to disposable fixture'});
 const win=await app.browserWindow(page);
 async function viewport(w,h){for(let attempt=0;attempt<3;attempt++){await win.evaluate((win,[w,h])=>{if(win.isMaximized())win.unmaximize();if(win.isFullScreen())win.setFullScreen(false);win.setContentSize(w,h,false);},[w,h]);for(let tick=0;tick<25;tick++){if(await page.evaluate(([w,h])=>innerWidth===w&&innerHeight===h,[w,h]))return;await page.waitForTimeout(100);}}throw Error('Viewport did not settle '+JSON.stringify({expected:[w,h],actual:await page.evaluate(()=>[innerWidth,innerHeight]),bounds:await win.evaluate(w=>w.getBounds())}));}
 async function chrome(theme,locale){
  if(await page.evaluate(()=>(document.documentElement.dataset.theme==='light'?'light':'dark'))!==theme){const select=page.getByLabel('Theme preference',{exact:true});if(await select.count())await select.selectOption(theme);else await page.locator('button[aria-label="Switch to dark theme"],button[aria-label="Switch to light theme"],button[aria-label="التبديل إلى الوضع الداكن"],button[aria-label="التبديل إلى الوضع الفاتح"]').first().click();}
  if(await page.evaluate(()=>document.documentElement.dir)!==(locale==='ar'?'rtl':'ltr')){const ref=page.getByLabel('Toggle interface language',{exact:true});if(await ref.count())await ref.click();else await page.locator('button[title="Toggle Arabic / English"]').first().click();}
  await expect.poll(()=>page.evaluate(()=>document.documentElement.dir)).toBe(locale==='ar'?'rtl':'ltr');await expect.poll(()=>page.evaluate(()=>(document.documentElement.dataset.theme==='light'?'light':'dark'))).toBe(theme);
 }
 async function openTool(route){
  if(route==='home'){await page.getByRole('button',{name:/^(Customize|تخصيص)$/}).click();return;}
  if(route==='studio'){await page.evaluate(()=>window.dispatchEvent(new CustomEvent('knoux:live-organization',{detail:{stageId:4}})));return;}
  if(route==='files'){await page.getByTestId('files-service-file-hash').click();await expand();if(await page.getByTestId('files-hash-compute').count()){await page.getByTestId('files-hash-compute').click();await expect(page.getByTestId('files-hash-digest')).toHaveText(/[0-9a-f]{64}/,{timeout:30000});}return;}
  if(route==='applications'){await page.getByTestId('apps-service-app-search').click();await expand();return;}
  if(route==='storage'){await page.getByTestId('storage-inspect').click();await expand();return;}
  if(route==='smart_scan'){await page.getByTestId('scan-service-duplicate_finder').click();await expand();return;}
  if(route==='cleanup'){await page.getByTestId('cleanup-service-cleanup-estimate').click();await expand();return;}
  if(route==='startup'){await page.getByTestId('startup-service-startup-impact').click();await expand();return;}
  if(route==='system'){await page.getByTestId('system-service-system-health-check').click();await expand();return;}
  if(route==='repair'){await page.getByTestId('repair-tool-repair-component-check').click();return;}
  if(route==='services'){await page.getByTestId('services-tool-services-inventory').click();return;}
  if(route==='automation'){await page.locator('.auto-library-template').first().click();return;}
  if(route==='settings'){await page.getByTestId('settings-tab-appearance').click();}
 }
 async function expand(){const toggle=page.getByTestId('workbench-mode-toggle');if(await toggle.count()){const mode=await page.locator('[data-service-workbench]').first().getAttribute('data-workbench-mode');if(mode==='side')await toggle.click();}}
 for(const [route,root]of routes){
  await page.evaluate(route=>{location.hash=route;},route);await page.getByTestId(root).waitFor({timeout:90000});
  // Native discovery is started by each existing page/controller; wait for its
  // actual tool controls rather than fabricating a snapshot or measured values.
  const ready={applications:'apps-service-app-search',cleanup:'cleanup-service-cleanup-estimate',startup:'startup-service-startup-impact',system:'system-service-system-health-check',repair:'repair-tool-repair-component-check',services:'services-tool-services-inventory'}[route];
  if(route==='applications')await page.getByTestId('apps-register-row').first().waitFor({timeout:120000});
  if(ready)await expect(page.getByTestId(ready)).toBeEnabled({timeout:120000});
  if(route==='automation')await page.locator('.auto-library-template').first().waitFor({timeout:120000});
  let opened=false;
  for(const [width,height]of [[1366,768],[1672,941],[1920,1080]])for(const theme of ['dark','light'])for(const locale of ['en','ar']){
   const modal=route==='home'||route==='repair'||route==='services';
   if(opened&&modal){await page.keyboard.press('Escape');await page.waitForTimeout(100);opened=false;}
   await chrome(theme,locale);await viewport(width,height);
   if(!opened){await openTool(route);opened=true;}
   await page.waitForTimeout(180);
   const surface=page.locator('[data-service-workbench],.sys-service-sheet,dialog[open],.home-dialog').first();
   const metrics=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dir:document.documentElement.dir,theme:(document.documentElement.dataset.theme==='light'?'light':'dark'),scrollWidth:document.scrollingElement.scrollWidth,scrollHeight:document.scrollingElement.scrollHeight,canvas:(()=>{const e=document.querySelector('[data-testid=automation-canvas]');if(!e)return null;const r=e.getBoundingClientRect();return {width:r.width,height:r.height};})()}));
   if(metrics.scrollWidth>width||metrics.scrollHeight>height)throw Error(route+' page overflow '+JSON.stringify(metrics));
   if(route==='automation'&&height===768&&metrics.canvas?.height<280)throw Error('Compressed Flow canvas');
   if(await surface.count()){const b=await surface.boundingBox();if(b&&(b.x< -1||b.y< -1||b.x+b.width>width+1||b.y+b.height>height+1))throw Error(route+' service bounds outside viewport '+JSON.stringify(b));}
   const name=`${route}-${locale}-${theme}-${width}.png`,png=await page.screenshot({animations:'allow',timeout:60000});if(png.readUInt32BE(16)!==width||png.readUInt32BE(20)!==height)throw Error('PNG dimensions mismatch');await writeFile(path.join(out,name),png);
   proof.frames.push({route,file:name,...metrics});
  }
  if(route==='files'){await page.getByTestId('files-workbench-tool-select').selectOption('file-search');await expect(page.getByTestId('files-search-workbench')).toBeVisible();}
  if(opened&&route!=='automation'&&route!=='settings'&&route!=='workspace'&&route!=='studio')await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.cinematic-boundary')).toHaveAttribute('data-reduced','true');await page.emulateMedia({reducedMotion:'no-preference'});
  console.log(route+': '+proof.frames.filter(f=>f.route===route).length+' actual service frames');
 }
 proof.checks.push('Three viewport sizes × DAY/NIGHT × EN/AR for each captured service surface; actual UI theme/locale changes, PNG dimensions, page bounds and reduced motion checked');
 for(const file of ['src/visual/visual-sprint.css','src/visual/reference-restraint.css','src/components/workbench/ServiceWorkbenchHost.tsx','src/visual/service-workspaces.css','src/visual/design-recovery.css','src/pages/AutomationPage.tsx','src/apps/AppServiceWorkspace.tsx','src/files/FilesServiceFocus.tsx','src/smart-scan/ScanServiceWorkspace.tsx'])proof.sourceHashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
 proof.ok=proof.errors.length===0;
}catch(error){proof.errors.push(String(error));}finally{await app.close();await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2));}
console.log(JSON.stringify({ok:proof.ok,frames:proof.frames.length,errors:proof.errors},null,2));if(!proof.ok)process.exitCode=1;
