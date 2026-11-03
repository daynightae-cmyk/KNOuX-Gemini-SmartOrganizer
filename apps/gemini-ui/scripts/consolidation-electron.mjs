/** Compact real Main + preload + renderer check. No account connection or OS effect. */
import {_electron as electron} from '@playwright/test';
import {createRequire} from 'node:module';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const require=createRequire(import.meta.url);
const out=path.resolve('../../docs/evidence/consolidation-20261103');
await mkdir(out,{recursive:true});
const profile=await mkdtemp(path.join(os.tmpdir(),'knoux-consolidation-'));
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
let app;
const receipt={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Development Electron; read-only bridge status and route rendering; no live cloud request, owner mutation or installed-app claim',routes:[],errors:[],ok:false};
try {
 app=await electron.launch({executablePath:require('electron'),args:[path.resolve('electron/main.cjs'),'--disable-gpu',`--knoux-user-data=${profile}`],env,timeout:90000});
 const page=await app.firstWindow({timeout:60000});
 page.on('pageerror',error=>receipt.errors.push(error.message));
 const win=await app.browserWindow(page);
 await win.evaluate(w=>{w.setIgnoreMouseEvents(true);w.setFocusable(false);w.setSkipTaskbar(true);});
 await page.evaluate(()=>{
  localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));
  localStorage.setItem('knoux_locale','en');localStorage.setItem('knoux_theme_preference','light');localStorage.setItem('knoux_theme','light');location.hash='home';
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('[data-testid="home-workspace"]',{timeout:90000});
 receipt.bridge=await page.evaluate(async()=>({
  shell:await window.knouxShell.getStatus(),ai:await window.knouxAiV1.status(),
  google:await window.knouxGoogleV1.workspaceCapabilities(),
  googleState:await window.knouxGoogleV1.getStatus(),
 }));
 for(const [name,value] of Object.entries(receipt.bridge)) assert(value?.contractVersion===1&&!value.error,`${name} IPC failed: ${value?.error?.code}`);
 assert.equal(receipt.bridge.ai.data.configured,false,'isolated profile has no owner AI credential');
 const roots={home:'home-workspace',studio:'studio-workspace',files:'files-workspace',smart_scan:'scan-workspace',applications:'apps-workspace',repair:'repair-workspace',cleanup:'cleanup-workspace',storage:'storage-workspace',startup:'startup-workspace',system:'system-workspace',services:'services-workspace',automation:'automation-workspace',workspace:'workspace-hub',settings:'settings-root'};
 for(const [section,id] of Object.entries(roots)){
  await page.evaluate(section=>{location.hash=section;},section);
  await page.waitForSelector(`[data-testid="${id}"]`,{timeout:60000});
  receipt.routes.push({section,rendered:true});
 }
 await page.evaluate(()=>{location.hash='home';});
 await page.waitForSelector('[data-testid="home-workspace"]');
 await page.evaluate(()=>window.dispatchEvent(new Event('knoux:open-commands')));
 await page.waitForSelector('dialog[open]');
 assert(await page.locator('[data-testid="home-search-history"]').isVisible(),'preserved Home history surface opens');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('dialog[open]').count(),0,'search closes with Escape');
 assert.deepEqual(receipt.errors,[]);
 receipt.ok=true;
} catch(error){receipt.failure=String(error?.stack||error);process.exitCode=1;}
finally {
 if(app)await app.close();
 await writeFile(path.join(out,'electron.json'),JSON.stringify(receipt,null,2));
 await rm(profile,{recursive:true,force:true});
 console.log(JSON.stringify({ok:receipt.ok,routes:receipt.routes.length,errors:receipt.errors,failure:receipt.failure}));
}
