// Lightweight visual capture only. No smoke suite, grants, scans or mutations.
import {_electron as electron} from '@playwright/test';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const require=createRequire(import.meta.url);
const live=execFileSync('powershell.exe',['-NoProfile','-Command',"Get-CimInstance Win32_Process -Filter \"Name='electron.exe'\" | Select-Object -ExpandProperty CommandLine"],{encoding:'utf8'});
if(live.includes('KNOuX-Gemini-SmartOrganizer')) throw Error('Another Gemini Electron session is active; preserving its runtime ownership.');
const profile=await mkdtemp(path.join(os.tmpdir(),'knoux-canvas-preview-'));
const folder=path.resolve('../../docs/evidence/canvas-rollout/electron');await mkdir(folder,{recursive:true});
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:require('electron'),args:[path.resolve('electron/main.cjs'),`--knoux-user-data=${profile}`,'--disable-gpu'],env,timeout:60000});
const rows=[];
try {
 const page=await app.firstWindow();await page.waitForLoadState('domcontentloaded');
 await page.evaluate(()=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale','en');});
 await page.reload({waitUntil:'domcontentloaded'});
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setContentSize(1672,941));
 for(const theme of ['light','dark']) {
  if(await page.evaluate(()=>document.documentElement.dataset.theme==='light'?'light':'dark')!==theme) await page.getByRole('button',{name:`Switch to ${theme} theme`,exact:true}).click();
  for(const route of ['files','home','smart_scan','applications','storage','cleanup','startup','system','repair','services','automation','studio']) {
   await page.evaluate(route=>{location.hash=route;},route);
   await page.locator(`[data-visual-section="${route}"] main`).waitFor();await page.waitForTimeout(180);
   const geometry=await page.evaluate(()=>{const e=document.querySelector('main'),r=e.getBoundingClientRect();return {viewport:innerHeight,mainBottom:r.bottom,mainOverflow:e.scrollHeight-e.clientHeight,actualTheme:document.documentElement.dataset.theme==='light'?'light':'dark'};});
   await page.screenshot({path:path.join(folder,`${route}-${theme}.png`),animations:'disabled',timeout:15000});
   rows.push({route,theme,geometry,scope:'Visual only; current measured/loading/empty states, no scan or mutation requested'});
   await writeFile(path.join(folder,'preview.json'),JSON.stringify(rows,null,2));
  }
 }
} finally {await app.close();}
console.log(JSON.stringify(rows,null,2));
