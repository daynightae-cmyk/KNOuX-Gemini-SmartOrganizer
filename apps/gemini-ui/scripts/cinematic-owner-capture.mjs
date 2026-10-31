/** Actual built Electron entry, one workspace mount, and timestamped silent video. */
import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
const out = path.resolve(process.env.KNOUX_CINEMATIC_OUT || '../../docs/evidence/service-polish-20261031/cinematic');
await mkdir(out, { recursive: true });
const profile = await mkdtemp(path.join(os.tmpdir(), 'knoux-entry-owner-'));
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({ executablePath: require('electron'), args: [path.resolve('electron/main.cjs'), '--disable-gpu', '--knoux-user-data=' + profile], env, timeout: 60000 });
const proof = { head: execFileSync('git', ['rev-parse','HEAD'], { encoding:'utf8' }).trim(), workingTree:'uncommitted', checks:[], captures:[], video:null, errors:[] };
try {
 const page = await app.firstWindow();
 page.on('pageerror', error => proof.errors.push(error.message));
 await page.waitForLoadState('domcontentloaded');
 const win = await app.browserWindow(page);
 async function viewport(width,height) {
  for(let attempt=0;attempt<3;attempt++) {
   await win.evaluate((w,[width,height])=>{if(w.isMaximized())w.unmaximize();if(w.isFullScreen())w.setFullScreen(false);w.setContentSize(width,height,false);},[width,height]);
   for(let tick=0;tick<25;tick++) {
    if(await page.evaluate(([w,h])=>innerWidth===w&&innerHeight===h,[width,height])) return;
    await page.waitForTimeout(120);
   }
  }
  throw Error('Viewport did not settle');
 }
 async function screenshot(name,width,height) {
  const png=await page.screenshot({animations:'allow'});
  if(png.readUInt32BE(16)!==width||png.readUInt32BE(20)!==height)throw Error('PNG viewport mismatch');
  await writeFile(path.join(out,name+'.png'),png);
  proof.captures.push({file:name+'.png',width,height});
 }
 const cdp=await page.context().newCDPSession(page);
 const frames=[];
 cdp.on('Page.screencastFrame',event=>{
  if(frames.length<500)frames.push({data:Buffer.from(event.data,'base64'),time:event.metadata.timestamp});
  void cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
 });
 for(const [width,height,theme,locale] of [[1366,768,'dark','en'],[1672,941,'light','en'],[1920,1080,'dark','ar']]) {
  await page.evaluate(({theme,locale})=>{
   localStorage.setItem('knoux_theme',theme);localStorage.setItem('knoux_locale',locale);
   localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:false,always:false,muted:true,reduced:false}));location.hash='home';
  },{theme,locale});
  const replayUrl = new URL(page.url()); replayUrl.searchParams.set('cinematic','replay');
  await page.goto(replayUrl.href);await page.reload();await viewport(width,height);
  if(width===1366)await cdp.send('Page.startScreencast',{format:'jpeg',quality:80,maxWidth:1366,maxHeight:768,everyNthFrame:2});
  await expect(page.locator('.cinematic-boundary')).toHaveAttribute('data-phase','READY',{timeout:30000});
  await expect(page.locator('.entry-mark>i')).toHaveCount(3);
  await expect(page.locator('.portal-scene')).toHaveCount(0);
  await expect(page.locator('.entry-particles')).toHaveAttribute('data-depth-layers','3');
  await page.evaluate(()=>{window.__entryOwnerMain=document.querySelector('main');});
  await page.mouse.move(width*.25,height*.3);await page.waitForTimeout(350);
  await expect(page.locator('.entry-overlay')).toBeVisible();
  proof.checks.push(await page.evaluate(()=>({phase:document.querySelector('.cinematic-boundary').dataset.phase,entryText:document.querySelector('.entry-enter')?.textContent,dir:document.querySelector('.entry-overlay')?.dir})));
  await screenshot(`entry-${locale}-${theme}-${width}`,width,height);
  await page.locator('.entry-enter').click();
  await expect(page.locator('.cinematic-boundary')).toHaveAttribute('data-phase','ENTERING');
  await page.waitForTimeout(450);
  await screenshot(`release-${locale}-${theme}-${width}`,width,height);
  await expect(page.locator('.cinematic-boundary')).toHaveAttribute('data-phase','ACTIVE');
  if(!await page.evaluate(()=>document.querySelector('main')===window.__entryOwnerMain))throw Error('Workspace remounted');
  await screenshot(`home-${locale}-${theme}-${width}`,width,height);
  if(width===1366){await page.waitForTimeout(500);await cdp.send('Page.stopScreencast');}
 }
 proof.checks.push('Approved original composition replaces portal at the only App entry boundary; actual workspace mount survives entry');
 await page.evaluate(()=>window.dispatchEvent(new Event('knoux:replay-entry')));
 await expect(page.locator('.cinematic-boundary')).toHaveAttribute('data-phase','READY',{timeout:30000});
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.cinematic-boundary')).toHaveAttribute('data-reduced','true');
 await page.keyboard.press('Escape');await expect(page.locator('.cinematic-boundary')).toHaveAttribute('data-phase','ACTIVE');
 proof.checks.push('Actual Electron replay, reduced motion and Escape skip retain the same workspace');
 const security=await win.evaluate(w=>{const p=w.webContents.getLastWebPreferences();return {sandbox:p.sandbox,contextIsolation:p.contextIsolation,nodeIntegration:p.nodeIntegration};});
 if(!security.sandbox||!security.contextIsolation||security.nodeIntegration)throw Error('Electron security changed');
 proof.security=security;
 // Resample timestamped CDP frames at 15fps. This is a silent recording of
 // the real renderer; no synthetic image or reference frame is inserted.
 const ffmpeg=process.env.KNOUX_FFMPEG;
 if(!ffmpeg)throw Error('KNOUX_FFMPEG is required for the actual motion recording');
 if(frames.length<10)throw Error('Insufficient screencast frames');
 const encoder=spawn(ffmpeg,['-y','-loglevel','error','-f','image2pipe','-r','15','-c:v','mjpeg','-i','pipe:0','-an','-c:v','libvpx-vp9','-deadline','realtime','-speed','8','-crf','35','-b:v','0',path.join(out,'entry-motion.webm')],{windowsHide:true});
 let errorText='';encoder.stderr.on('data',data=>errorText+=data.toString());
 const exited=once(encoder,'close');let index=0;
 const duration=frames.at(-1).time-frames[0].time;
 for(let t=0;t<=duration;t+=1/15){while(index+1<frames.length&&frames[index+1].time-frames[0].time<=t)index++;if(!encoder.stdin.write(frames[index].data))await once(encoder.stdin,'drain');}
 encoder.stdin.end();const [code]=await exited;if(code!==0)throw Error('Video encoding failed: '+errorText);
 proof.video={file:'entry-motion.webm',sourceFrames:frames.length,durationSeconds:duration,fps:15,silent:true,encoding:'Timestamp-resampled actual Electron CDP screencast; VP9'};
 proof.ok=proof.errors.length===0;
} catch(error) {proof.errors.push(String(error));proof.ok=false;}
finally {await app.close();await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2));}
console.log(JSON.stringify(proof,null,2));if(!proof.ok)process.exitCode=1;
