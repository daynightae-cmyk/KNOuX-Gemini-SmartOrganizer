import {_electron as electron,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
const require=createRequire(import.meta.url),profile=await mkdtemp(path.join(os.tmpdir(),'knoux-m0-visual-'));
const phase=process.argv[2]||'staging',out=path.resolve('../../docs/evidence/m0-20261028',phase,'visual');await mkdir(out,{recursive:true});
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:require('electron'),args:['--disable-gpu','--disable-features=CalculateNativeWinOcclusion','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding',path.resolve('electron/main.cjs'),`--knoux-user-data=${profile}`],env,timeout:60000});
const proof={profile,views:[],errors:[],consoleErrors:[],intro:[],orbital:null,blocking:[],notTested:[],scope:'Isolated native renderer visual/navigation checks; no owner operation consent granted'};
try{
 proof.runtime=await app.evaluate(({app})=>({profile:app.getPath('userData'),isPackaged:app.isPackaged}));expect(path.resolve(proof.runtime.profile)).toBe(path.resolve(profile));
 const page=await app.firstWindow();page.on('pageerror',error=>proof.errors.push(error.message));page.on('crash',()=>proof.errors.push('RENDERER_PROCESS_CRASH'));page.on('console',message=>{if(message.type()==='error')proof.consoleErrors.push(message.text());});await page.waitForLoadState('domcontentloaded');
 await page.evaluate(()=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale','en');localStorage.setItem('knoux_theme','dark');location.hash='home';});await page.reload();
 const win=await app.browserWindow(page);await win.evaluate(w=>{w.setAlwaysOnTop(true);w.show();w.setContentSize(1366,768);});await page.locator('main').first().waitFor();
 const themeName=()=>page.evaluate(()=>document.documentElement.dataset.theme==='light'?'light':'dark');
 const switchTheme=async name=>{if(await themeName()===name)return;const switcher=page.locator('button[aria-pressed]').filter({has:page.locator('svg.lucide-sun, svg.lucide-moon')}).first();await switcher.click();await expect.poll(themeName).toBe(name);};
 const openRoute=async name=>{await page.evaluate(name=>{location.hash=name},name);await page.locator(`[data-visual-section="${name}"] main`).first().waitFor({timeout:30000});await page.waitForTimeout(120);};
 const capture=async name=>{let last;for(let attempt=0;attempt<6;attempt++){try{const image=await win.evaluate(async w=>{const i=await w.webContents.capturePage();return {png:i.toPNG().toString('base64'),width:i.getSize().width,height:i.getSize().height};});await writeFile(path.join(out,name),Buffer.from(image.png,'base64'));return {width:image.width,height:image.height};}catch(error){last=error;proof.captureRetries=(proof.captureRetries||0)+1;await page.waitForTimeout(500);await win.evaluate(w=>{w.show();w.moveTop();w.webContents.invalidate();});}}throw last;};
 for(const [name,action] of [['dark','Enter Workspace'],['light','Skip']]){
  await switchTheme(name);
  await page.evaluate(()=>window.dispatchEvent(new Event('knoux:replay-entry')));const overlay=page.locator('.entry-overlay');await expect(overlay).toBeVisible();
  await expect(page.getByRole('button',{name:action,exact:true})).toBeEnabled({timeout:20000});
  const geometry=await overlay.evaluate(e=>{const r=e.getBoundingClientRect();return {top:r.top,left:r.left,width:r.width,height:r.height,fullHeight:innerHeight,fullWidth:innerWidth,ownsTop:document.elementsFromPoint(innerWidth/2,10).some(x=>x===e||e.contains(x))};});
  expect(geometry.top).toBe(0);expect(geometry.left).toBe(0);expect(geometry.width).toBe(geometry.fullWidth);expect(geometry.height).toBe(geometry.fullHeight);expect(geometry.ownsTop).toBe(true);
  await page.waitForTimeout(400);await capture(`intro-${name}.png`);await page.getByRole('button',{name:action,exact:true}).click();await expect(overlay).toHaveCount(0);
  expect(await page.locator('.cinematic-workspace').getAttribute('aria-hidden')).toBeNull();proof.intro.push({theme:name,action,...geometry});
 }
 await page.addStyleTag({content:'*,*::before,*::after{animation-play-state:paused !important;transition:none !important}'});proof.captureMode='webContents.capturePage; CSS animations paused for deterministic frames';
 await openRoute('files');await switchTheme('light');
 const orbit=page.locator('[data-visual-section="files"] .knx-orbit').first();await expect(orbit.locator('.knx-orbit-tool')).toHaveCount(6);
 const orbitTool=async name=>{const tool=orbit.getByRole('button',{name,exact:true});await tool.scrollIntoViewIfNeeded();const hit=await tool.evaluate(el=>{const r=el.getBoundingClientRect();return document.elementsFromPoint(r.left+r.width/2,r.top+r.height/2).some(n=>n===el||el.contains(n));});expect(hit).toBe(true);return tool;};
 await (await orbitTool('Images')).click();await expect(page.getByTestId('files-category-images')).toHaveClass(/text-white/);
 await (await orbitTool('Filters')).click();expect(await page.locator('.knx-files-advanced').evaluate(e=>e.open)).toBe(true);
 await orbit.locator('.knx-orbit-core').click();expect(await page.evaluate(()=>document.activeElement?.getAttribute('data-testid'))).toBe('files-search');
 await (await orbitTool('Organize')).click();await expect(page.locator('[data-visual-section="studio"]')).toHaveCount(1);
 proof.orbital={tools:6,imagesCategory:true,filtersPanel:true,coreFocus:true,organizeNavigation:true};
 for(const [name,testid,panel] of [['files','files-live-organization','organization-live-workbench'],['storage','storage-live-vault','storage-cleanup-live'],['cleanup','cleanup-live-vault','storage-cleanup-live']]){
  await openRoute(name);const button=page.getByTestId(testid);await expect(button).toBeVisible();await button.scrollIntoViewIfNeeded();
  const topmost=await button.evaluate(el=>{const r=el.getBoundingClientRect();return document.elementsFromPoint(r.left+r.width/2,r.top+r.height/2).some(n=>n===el||el.contains(n));});expect(topmost).toBe(true);
  await button.click();await expect(page.getByTestId(panel)).toBeVisible({timeout:20000});
  if(panel==='organization-live-workbench')await page.getByTestId('workbench-close').click();else await page.keyboard.press('Escape');
  await expect(page.getByTestId(panel)).toHaveCount(0);proof.blocking.push({route:name,testid,topmost,opened:true});
 }
 for(const locale of ['en','ar']){
  if(await page.evaluate(()=>document.documentElement.lang)!==locale)await page.getByTitle('Toggle Arabic / English',{exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang',locale);await expect(page.locator('html')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
  for(const name of ['light','dark']){
   await switchTheme(name);
   for(const [width,height] of [[1366,768],[1672,941],[1920,1080]]){
    await win.evaluate((w,{width,height})=>{w.show();w.setContentSize(width,height);},{width,height});await page.waitForTimeout(350);
    for(const route of ['home','studio','files','storage','cleanup','smart_scan','applications','startup','system','repair','services','automation','workspace','settings']){
     await openRoute(route);
     const geometry=await page.evaluate(()=>{const main=document.querySelector('main'),r=main.getBoundingClientRect();return {dir:document.documentElement.dir,lang:document.documentElement.lang,theme:document.documentElement.dataset.theme==='light'?'light':'dark',outerX:document.documentElement.scrollWidth-innerWidth,outerY:document.documentElement.scrollHeight-innerHeight,mainOverflow:main.scrollHeight-main.clientHeight,mainBottom:r.bottom,viewport:innerHeight,wheels:document.querySelectorAll('.knx-orbit').length,satellites:document.querySelectorAll('.knx-orbit-tool').length};});
     expect(geometry.dir).toBe(locale==='ar'?'rtl':'ltr');expect(geometry.theme).toBe(name);
     const shot=await capture(`${route}-${locale}-${name}-${width}.png`);proof.views.push({route,locale,theme:name,width,height,zoom:1,...geometry,shot});
    }
    await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2));console.log(locale,name,width,'14 routes');
   }
  }
 }
 await win.evaluate(w=>{w.show();w.setContentSize(1672,941);});await page.waitForTimeout(200);
 for(const zoom of [1.25,1.5])for(const route of ['files','studio','repair','services']){
  await openRoute(route);await win.evaluate((w,z)=>{w.show();w.webContents.setZoomFactor(z);},zoom);await page.waitForTimeout(150);
  const geometry=await page.evaluate(()=>({outerX:document.documentElement.scrollWidth-innerWidth,outerY:document.documentElement.scrollHeight-innerHeight,width:innerWidth,height:innerHeight,dpr:devicePixelRatio}));
  expect(Math.abs(geometry.dpr-zoom)).toBeLessThan(0.02);
  const theme=await themeName();const shot=await capture(`dpi-${zoom}-${route}.png`);proof.views.push({route,locale:'ar',theme,zoom,...geometry,shot,index:proof.views.length});
 }
 await win.evaluate(w=>{w.webContents.setZoomFactor(1);w.setContentSize(1672,941);});await page.waitForTimeout(200);await openRoute('services');await switchTheme('light');await page.emulateMedia({reducedMotion:'reduce'});
 const tracks=page.locator('.knx-particle-track');expect(await tracks.count()).toBeGreaterThan(0);proof.reducedMotion=await tracks.evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).animationName));expect(proof.reducedMotion.every(a=>a==='none')).toBe(true);await capture('reduced-motion.png');
 const knownCspWarning=/^The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element\.$/;
 proof.ignoredConsole=proof.consoleErrors.filter(text=>knownCspWarning.test(text));proof.consoleErrors=proof.consoleErrors.filter(text=>!knownCspWarning.test(text));
 proof.geometryIssues=proof.views.filter(v=>v.outerX>4||v.outerY>4);expect(proof.errors).toEqual([]);expect(proof.consoleErrors).toEqual([]);expect(proof.geometryIssues).toEqual([]);proof.ok=true;
}finally{await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2));await app.close();}
console.log(JSON.stringify({ok:proof.ok,views:proof.views.length,errors:proof.errors,consoleErrors:proof.consoleErrors,ignoredConsole:proof.ignoredConsole,issues:proof.geometryIssues,orbital:proof.orbital,blocking:proof.blocking,reducedMotion:proof.reducedMotion},null,2));
