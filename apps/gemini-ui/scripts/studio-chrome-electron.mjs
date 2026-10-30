import {_electron as electron,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';import path from 'node:path';
const require=createRequire(import.meta.url),profile=await mkdtemp(path.join(os.tmpdir(),'knoux-studio-chrome-'));
const out=process.env.KNOUX_STUDIO_EVIDENCE;await mkdir(out,{recursive:true});
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:require('electron'),args:[path.resolve('electron/main.cjs'),'--disable-gpu','--knoux-user-data='+profile],env,timeout:60000});
const proof={profile,sourceFiles:{},cases:[],errors:[],ok:false};
for(const f of ['src/studio/StudioPage.tsx','src/studio/studio-integration.css'])proof.sourceFiles[f]=createHash('sha256').update(await readFile(f)).digest('hex');
try{
 const page=await app.firstWindow();page.on('pageerror',e=>proof.errors.push(e.message));await page.waitForLoadState('domcontentloaded');
 await page.evaluate(()=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale','en');location.hash='studio';});await page.reload();
 const win=await app.browserWindow(page);await expect(page.getByTestId('organization-live-workbench')).toBeVisible();
 for(const locale of ['en','ar'])for(const theme of ['light','dark'])for(const [width,height] of [[1366,768],[1672,941],[1920,1080]]){
  await win.evaluate((w,s)=>w.setContentSize(...s),[width,height]);
  if(await page.getByTestId('studio-workspace').getAttribute('dir')!==(locale==='ar'?'rtl':'ltr'))await page.getByLabel('Toggle interface language',{exact:true}).click();
  await page.getByLabel('Theme preference',{exact:true}).selectOption(theme);await page.waitForTimeout(180);
  const bounds=await page.evaluate(()=>{const r=document.querySelector('.os-action-dock').getBoundingClientRect();return {overflow:document.documentElement.scrollHeight-innerHeight,dockBottom:r.bottom,dockTop:r.top,width:innerWidth,height:innerHeight,orbits:document.querySelectorAll('.knx-orbit-tools button').length};});
  expect(bounds.overflow).toBeLessThanOrEqual(2);expect(bounds.dockBottom).toBeLessThanOrEqual(height);expect(bounds.dockTop).toBeGreaterThan(0);expect(bounds.orbits).toBe(6);proof.cases.push({locale,theme,...bounds});
  await win.evaluate(w=>{w.show();w.webContents.invalidate();});await page.waitForTimeout(150);await writeFile(path.join(out,`${locale}-${theme}-${width}.png`),Buffer.from(await win.evaluate(async w=>(await w.webContents.capturePage()).toPNG().toString('base64')),'base64'));
 }
 await page.getByLabel('Toggle interface language',{exact:true}).click();await expect(page.getByTestId('studio-workspace')).toHaveAttribute('dir','ltr');
 await page.keyboard.press('Control+k');await expect(page.getByRole('dialog')).toBeVisible();await page.getByLabel('Search organization stages').fill('Plan Review');await page.keyboard.press('Enter');
 await expect(page.getByTestId('organization-live-workbench')).toHaveAttribute('data-service-id','mission-03-06');await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.getByTestId('ops-execute')).toBeDisabled();await expect(page.getByTestId('studio-workspace')).toHaveAttribute('dir','ltr');
 await page.getByLabel('Notifications',{exact:true}).click();await expect(page.getByTestId('studio-status-notice')).toBeVisible();await page.getByTestId('studio-open-history').click();await expect(page.getByTestId('organization-live-workbench')).toHaveAttribute('data-service-id','mission-03-08');
 await page.keyboard.press('Control+k');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.locator('.approved-sidebar button').filter({hasText:/^Home$/}).click();await expect(page.getByTestId('home-workspace')).toBeVisible();
 proof.receipts=await page.evaluate(async()=>(await window.knouxOperationsV1.history()).data?.length);expect(proof.receipts).toBe(0);expect(proof.errors).toEqual([]);proof.ok=true;
}finally{const p=await app.firstWindow();await writeFile(path.join(out,'final-dom.txt'),await p.locator('body').innerText());await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2));await app.close();}
console.log(JSON.stringify({ok:proof.ok,cases:proof.cases.length,errors:proof.errors}));
