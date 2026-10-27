// Targeted Files acceptance only. Uses a new temporary profile/source and the
// real preload/IPC/provider, never the owner's profile or folders.
import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
const require=createRequire(import.meta.url);
const live=execFileSync('powershell.exe',['-NoProfile','-Command',"Get-CimInstance Win32_Process -Filter \"Name='electron.exe'\" | Select-Object -ExpandProperty CommandLine"],{encoding:'utf8'});
if(live.includes('KNOuX-Gemini-SmartOrganizer')) throw Error('Another Gemini Electron session is active; targeted runtime deferred to avoid contention.');
const root=await mkdtemp(path.join(os.tmpdir(),'knoux-files-pilot-'));
const source=path.join(root,'Disposable Files'); const profile=path.join(root,'profile');
await mkdir(source);
for(let i=1;i<=40;i++) await writeFile(path.join(source,`Pilot-document-${String(i).padStart(2,'0')}.txt`),`Disposable Files visual acceptance document ${i}\n`);
const {StudioBridge}=require('../electron/native/studio-bridge.cjs');
const studio=new StudioBridge({userDataPath:profile,nativeImage:null,isPackaged:false,chooseFolder:async()=>source,emit:()=>{}});
await studio.init(); const granted=await studio.addSource(source); await studio.scanSource(granted.id); await studio.dispose();
const fixtureFile=path.join(source,'Pilot-document-01.txt');
const before=createHash('sha256').update(await readFile(fixtureFile)).digest('hex');
const folder=path.resolve('../../docs/evidence/files-owner-pilot/electron'); await mkdir(folder,{recursive:true});
const env={...process.env}; delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:require('electron'),args:[path.resolve('electron/main.cjs'),`--knoux-user-data=${profile}`],env,timeout:60000});
const checks=[];
try {
  const page=await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(()=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale','en');localStorage.setItem('knoux_theme','light');});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{location.hash='files';});
  await page.getByTestId('files-workspace').waitFor();
  for(const theme of ['light','dark']) for(const [width,height] of [[1672,941],[1366,768]]) {
    await app.evaluate(({BrowserWindow},{width,height})=>BrowserWindow.getAllWindows()[0].setContentSize(width,height),{width,height});
    if(await page.evaluate(()=>document.documentElement.dataset.theme==='light'?'light':'dark') !== theme) await page.getByRole('button',{name:`Switch to ${theme} theme`,exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.theme==='light'?'light':'dark')).toBe(theme);
    await expect(page.getByTestId('files-native-banner')).toContainText('Native measured index', {timeout:30000});
    await expect(page.locator('[data-testid^="files-row-native-"]')).toHaveCount(40);
    await page.bringToFront();
    await page.getByTestId('files-search').click();
    await page.getByTestId('files-search').pressSequentially('Pilot-document-01',{delay:30});
    await expect(page.getByTestId('files-search')).toHaveValue('Pilot-document-01');
    await expect(page.locator('[data-testid^="files-row-native-"]')).toHaveCount(1);
    await page.locator('[data-testid^="files-row-native-"]').first().click();
    await page.getByTestId('files-search').press('Control+A');
    await page.getByTestId('files-search').press('Backspace');
    await expect(page.locator('[data-testid^="files-row-native-"]')).toHaveCount(40);
    const geometry=await page.getByTestId('files-workspace').evaluate(e=>({height:e.clientHeight,total:e.scrollHeight,document:document.documentElement.scrollHeight,viewport:innerHeight}));
    if(geometry.total>geometry.height+4 || geometry.document>geometry.viewport+4) throw Error('Electron Files outer scrolling regression');
    await page.screenshot({path:path.join(folder,`${theme}-${width}x${height}.png`),animations:'disabled',timeout:15000});
    checks.push({theme,actualTheme:await page.evaluate(()=>document.documentElement.dataset.theme==='light'?'light':'dark'),width,height,geometry,rows:40,mode:'Real native measured index of disposable test-only source'});
  }
  const security=await app.evaluate(({BrowserWindow})=>{const p=BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();return {contextIsolation:p.contextIsolation,sandbox:p.sandbox,nodeIntegration:p.nodeIntegration,webSecurity:p.webSecurity};});
  const after=createHash('sha256').update(await readFile(fixtureFile)).digest('hex');
  if(before!==after) throw Error('Disposable source content changed');
  checks.push({security,sourceUnchanged:before===after,profile,source});
} finally {await app.close(); await writeFile(path.join(folder,'checks.json'),JSON.stringify(checks,null,2));}
console.log(JSON.stringify(checks,null,2));
