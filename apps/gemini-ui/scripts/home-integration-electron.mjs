import {_electron as electron,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import os from 'node:os';import path from 'node:path';
const require=createRequire(import.meta.url),profile=await mkdtemp(path.join(os.tmpdir(),'knoux-home-integration-'));
const out=path.resolve(process.env.KNOUX_HOME_EVIDENCE||'../../docs/evidence/anima-v0/home');await mkdir(out,{recursive:true});
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const packaged=process.env.KNOUX_ORBIT_PACKAGED_EXE;
const app=await electron.launch({executablePath:packaged||require('electron'),args:['--disable-gpu','--disable-features=CalculateNativeWinOcclusion','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding',...(!packaged?[path.resolve('electron/main.cjs')]:[]),'--knoux-user-data='+profile],env,timeout:60000});
const proof={sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),profile,sourceFiles:{},cases:[],checks:[],errors:[],ok:false};
for(const file of ['src/pages/HomePage.tsx','src/components/home/ApprovedHomeScreen.tsx','src/components/home/approved-home.css','src/home/live.ts','src/visual/KnouxOrbit.tsx','src/visual/knoux-orbit.css'])proof.sourceFiles[file]=createHash('sha256').update(await readFile(file)).digest('hex');
let page;async function capture(name){await page.evaluate(()=>document.fonts.ready);const win=await app.browserWindow(page);await win.evaluate(w=>{w.show();w.webContents.invalidate();});await page.waitForTimeout(150);await writeFile(path.join(out,name),Buffer.from(await win.evaluate(async w=>(await w.webContents.capturePage()).toPNG().toString('base64')),'base64'));}
try{
 proof.runtime=await app.evaluate(({app})=>({packaged:app.isPackaged,version:app.getVersion()}));expect(proof.runtime.packaged).toBe(Boolean(packaged));

 page=await app.firstWindow();page.on('pageerror',e=>proof.errors.push(e.message));await page.waitForLoadState('domcontentloaded');await page.evaluate(()=>{window.__homeRoutes=[];addEventListener('hashchange',()=>window.__homeRoutes.push({hash:location.hash,at:Date.now()}));});
 await page.evaluate(()=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale','en');location.hash='home';});await page.reload();
 await expect(page.getByTestId('home-workspace')).toBeVisible();await expect(page.getByTestId('home-live-status')).not.toHaveAttribute('data-status','loading',{timeout:90000});
 const win=await app.browserWindow(page);
 for(const locale of ['en','ar'])for(const theme of ['light','dark'])for(const [width,height] of [[1672,941],[1366,768],[1920,1080]]){
  await win.evaluate((w,{width,height})=>w.setContentSize(width,height),{width,height});
  if(await page.getByTestId('home-workspace').getAttribute('dir')!==(locale==='ar'?'rtl':'ltr'))await page.getByRole('button',{name:'Toggle interface language'}).click();
  await page.getByLabel('Theme preference',{exact:true}).selectOption(theme);await page.waitForTimeout(120);
  const geometry=await page.evaluate(()=>{const bounds=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};return {pageOverflow:document.documentElement.scrollHeight-innerHeight,mainOverflow:document.querySelector('.approved-main').scrollHeight-document.querySelector('.approved-main').clientHeight,hero:bounds('.approved-hero'),orbit:bounds('.knoux-orbit'),lower:bounds('.approved-lower-grid'),tools:[...document.querySelectorAll('.knoux-orbit__tool')].map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent,x:r.x,y:r.y,width:r.width,height:r.height}})}});
  expect(geometry.pageOverflow).toBeLessThanOrEqual(2);expect(geometry.mainOverflow).toBeLessThanOrEqual(2);expect(geometry.tools).toHaveLength(6);
  proof.cases.push({locale,theme,width,height,...geometry});await capture(`home-${locale}-${theme}-${width}.png`);
 }
 if(await page.getByTestId('home-workspace').getAttribute('dir')==='rtl')await page.getByRole('button',{name:'Toggle interface language'}).click();
 for(const [label,target] of [['Smart Scan','smart_scan'],['Files','files'],['Applications','applications'],['System','system'],['Storage','storage'],['Automation','automation']]){
  await page.locator('.knoux-orbit__tool').filter({hasText:label}).click();await expect.poll(()=>page.evaluate(()=>location.hash.slice(1))).toBe(target);await page.evaluate(()=>location.hash='home');await expect(page.getByTestId('home-workspace')).toBeVisible();
 }
 proof.checks.push('Six orbital controls navigate existing routes');
 await page.locator('.knoux-orbit__tool').first().focus();await page.keyboard.press('Enter');await expect.poll(()=>page.evaluate(()=>location.hash.slice(1))).toBe('smart_scan');await page.evaluate(()=>location.hash='home');
 await page.keyboard.press('Control+k');await expect(page.getByRole('dialog')).toBeVisible();await page.getByLabel('Search workspaces',{exact:true}).fill('storage');await page.keyboard.press('Enter');await expect.poll(()=>page.evaluate(()=>location.hash.slice(1))).toBe('storage');await page.evaluate(()=>location.hash='home');proof.checks.push('Keyboard satellite and command palette Enter navigation');
 for(const width of [1366,1672,1920]){const day=proof.cases.find(c=>c.locale==='en'&&c.theme==='light'&&c.width===width),night=proof.cases.find(c=>c.locale==='en'&&c.theme==='dark'&&c.width===width);expect(day.hero).toEqual(night.hero);expect(day.orbit).toEqual(night.orbit);expect(day.tools).toEqual(night.tools);}
 await page.getByRole('button',{name:'Start a Quick Scan',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('scope');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 const toolBounds=()=>page.locator('.knoux-orbit__tool').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}));
 const stationary=await toolBounds();await page.getByLabel('Theme preference',{exact:true}).selectOption('dark');await page.locator('h1').click();await capture('motion-t0.png');await page.waitForTimeout(700);await capture('motion-t1.png');expect(await toolBounds()).toEqual(stationary);expect(createHash('sha256').update(await readFile(path.join(out,'motion-t0.png'))).digest('hex')).not.toBe(createHash('sha256').update(await readFile(path.join(out,'motion-t1.png'))).digest('hex'));proof.checks.push('Two real animation frames differ while six satellite bounds remain fixed');
 await page.emulateMedia({reducedMotion:'reduce'});proof.reducedMotion=await page.locator('.knoux-orbit').evaluate(e=>[...e.querySelectorAll('*')].every(n=>getComputedStyle(n).animationName==='none'));expect(proof.reducedMotion).toBe(true);
 proof.bridge=await page.evaluate(async()=>window.knouxShell?.getStatus?.());
 await page.getByRole('button',{name:'Notifications',exact:true}).click();proof.providerWarnings=await page.getByRole('dialog').innerText();await page.keyboard.press('Escape');
 proof.providerDetails=await page.locator('.home-provenance').innerText();
 proof.receipts=await page.evaluate(async()=>(await window.knouxOperationsV1.history()).data?.length);expect(proof.receipts).toBe(0);proof.checks.push('Scope review starts no operation; isolated native history remains empty; reduced motion stops decoration');
 const original=page,newPage=app.waitForEvent('window');await app.evaluate(async({BrowserWindow},url)=>{const w=new BrowserWindow({show:false,webPreferences:{contextIsolation:true,sandbox:true,nodeIntegration:false}});await w.loadURL(url)},page.url());page=await newPage;
 await expect(page.getByTestId('home-live-status')).toHaveAttribute('data-status','native-required',{timeout:30000});await expect(page.locator('.approved-kpi strong')).toHaveText(['—','—','—','—']);await capture('native-unavailable.png');await page.close();page=original;proof.checks.push('Actual Electron window without preload shows unknown measurements');
 expect(proof.errors).toEqual([]);proof.ok=true;
}finally{proof.finalRoute=await page?.evaluate(()=>({hash:location.hash,trace:window.__homeRoutes})).catch(()=>null);await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2));await app.close();}
console.log(JSON.stringify(proof,null,2));
