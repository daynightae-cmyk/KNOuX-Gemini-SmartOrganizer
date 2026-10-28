import {_electron as electron,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import os from 'node:os';import path from 'node:path';
const require=createRequire(import.meta.url),profile=await mkdtemp(path.join(os.tmpdir(),'knoux-orbit-domains-'));
const out=path.resolve(process.env.KNOUX_ORBIT_EVIDENCE||'../../docs/evidence/shared-orbit/domains');await mkdir(out,{recursive:true});
const packaged=process.env.KNOUX_ORBIT_PACKAGED_EXE,env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:packaged||require('electron'),args:['--disable-gpu','--disable-features=CalculateNativeWinOcclusion','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding',...(!packaged?[path.resolve('electron/main.cjs')]:[]),'--knoux-user-data='+profile],env,timeout:60000});
const proof={sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),profile,errors:[],cases:[],checks:[]};let page;
async function capture(name){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});const w=await app.browserWindow(page);await w.evaluate(w=>{w.show();w.moveTop();w.webContents.invalidate();});await page.waitForTimeout(160);await writeFile(path.join(out,name),Buffer.from(await w.evaluate(async w=>(await w.webContents.capturePage()).toPNG().toString('base64')),'base64'));}
try{
 proof.runtime=await app.evaluate(({app})=>({packaged:app.isPackaged,version:app.getVersion()}));expect(proof.runtime.packaged).toBe(Boolean(packaged));
 await app.evaluate(({dialog})=>{dialog.showOpenDialog=async()=>({canceled:true,filePaths:[]});dialog.showMessageBox=async()=>({response:0,checkboxChecked:false});});
 page=await app.firstWindow();page.on('pageerror',e=>proof.errors.push(e.message));await page.waitForLoadState('domcontentloaded');await page.evaluate(()=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale','en');location.hash='home';});await page.reload();
 const win=await app.browserWindow(page);
 const sections=process.env.KNOUX_ORBIT_SECTIONS?.split(',')||['home','studio','files','smart_scan','applications','storage','cleanup','startup','system','repair','services','automation','workspace','settings'];
 for(const section of sections){
  await page.evaluate(section=>location.hash=section,section);await expect(page.locator('.visual-sprint')).toHaveAttribute('data-visual-section',section,{timeout:30000});
  const orbit=page.locator('.knx-vector-orbit').filter({visible:true}).first();await expect(orbit).toBeVisible({timeout:30000});
  for(const theme of ['light','dark']){
   if(await page.evaluate(()=>document.documentElement.dataset.theme==='light'?'light':'dark')!==theme)await page.locator('button[aria-pressed]').filter({has:page.locator('svg.lucide-sun,svg.lucide-moon')}).first().click();
   for(const [width,height] of [[1366,768],[1672,941],[1920,1080]]){
    await win.evaluate((w,{width,height})=>w.setContentSize(width,height),{width,height});await expect(orbit.locator('.knx-orbit-tools button')).toHaveCount(6);
    await expect(orbit.locator('svg.knx-orbit-vector')).toHaveCount(1);expect(await orbit.locator('ellipse').count()).toBeGreaterThanOrEqual(5);
    const geometry=await orbit.evaluate(e=>{const root=e.getBoundingClientRect();return {root:{x:root.x,y:root.y,width:root.width,height:root.height},buttons:[...e.querySelectorAll('.knx-orbit-tools button')].map(b=>{const r=b.getBoundingClientRect();return {text:b.textContent.trim(),disabled:b.disabled,x:r.x,y:r.y,width:r.width,height:r.height};}),pageOverflow:document.documentElement.scrollHeight-innerHeight,flattened:e.querySelectorAll('img[src*="orbital-emblem"],canvas').length};});
    expect(geometry.flattened).toBe(0);expect(geometry.buttons.every(b=>b.text.length&&b.width>0&&b.height>0)).toBe(true);expect(geometry.pageOverflow).toBeLessThanOrEqual(2);proof.cases.push({section,theme,width,height,...geometry});
    if(width===1672)await capture(section+'-'+theme+'.png');
   }
  }
 }
 proof.themeGeometry=[];
 for(const section of sections)for(const width of [1366,1672,1920]){const day=proof.cases.find(c=>c.section===section&&c.theme==='light'&&c.width===width),night=proof.cases.find(c=>c.section===section&&c.theme==='dark'&&c.width===width);const bounds=c=>({root:c.root,buttons:c.buttons.map(({x,y,width,height})=>({x,y,width,height}))});const equal=JSON.stringify(bounds(day))===JSON.stringify(bounds(night));proof.themeGeometry.push({section,width,equal});}
 await page.emulateMedia({reducedMotion:'reduce'});proof.reducedMotion=await page.locator('.knx-vector-orbit').first().evaluate(e=>[...e.querySelectorAll('*')].every(n=>getComputedStyle(n).animationName==='none'));expect(proof.reducedMotion).toBe(true);
 proof.receipts=await page.evaluate(async()=>(await window.knouxOperationsV1.history()).data?.length);expect(proof.receipts).toBe(0);expect(proof.errors).toEqual([]);proof.geometryParity=proof.themeGeometry.every(c=>c.equal);proof.ok=true;proof.checks.push('All section orbits use the shared SVG tree and six real labelled controls; no flattened image or canvas','DAY/NIGHT and three content sizes; Native consent dialogs cancel in isolated profile; no operation receipts created');
}finally{await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2));await app.close();}
console.log(JSON.stringify({ok:proof.ok,cases:proof.cases.length,errors:proof.errors,checks:proof.checks},null,2));
