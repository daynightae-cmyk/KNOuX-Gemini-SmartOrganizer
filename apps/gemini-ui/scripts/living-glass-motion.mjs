import {_electron as electron} from '@playwright/test';
import {createRequire} from 'node:module';
import {mkdir,mkdtemp,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';

const require=createRequire(import.meta.url);
const out=path.resolve(process.argv.find(x=>x.startsWith('--out='))?.slice(6)??'../../docs/evidence/living-glass-20261102/motion-and-controls');
await mkdir(out,{recursive:false});
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const profile=await mkdtemp(path.join(os.tmpdir(),'knoux-living-motion-'));
const app=await electron.launch({executablePath:require('electron'),args:[path.resolve('electron/main.cjs'),'--disable-gpu',`--knoux-user-data=${profile}`],env,timeout:60000});
const motion=[],interactions=[],errors=[];
let artworkAssets=[];
try{
 const assetDir=path.resolve('src/visual/assets/living-glass');
 const assetPaths=(await readdir(assetDir)).filter(x=>x.endsWith('.png')).map(x=>path.join(assetDir,x));
 artworkAssets=await app.evaluate(({nativeImage},paths)=>paths.map(file=>{
  const image=nativeImage.createFromPath(file),size=image.getSize(),bitmap=image.toBitmap();let zero=0,partial=0,opaque=0;
  for(let i=3;i<bitmap.length;i+=4){const a=bitmap[i];if(a===0)zero++;else if(a===255)opaque++;else partial++;}
  return{file,size,zeroAlpha:zero,partialAlpha:partial,opaqueAlpha:opaque,genuineTransparency:zero>0&&partial>0};
 }),assetPaths);
 assert.equal(artworkAssets.length,14);assert(artworkAssets.every(x=>x.genuineTransparency),'decorative artwork lacks genuine transparent alpha');
 const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));
 async function open(section,locale='en',width=1672,height=941){
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(({section,locale})=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:false}));localStorage.setItem('knoux_locale',locale);localStorage.setItem('knoux_theme_preference','light');localStorage.setItem('knoux_theme','light');location.hash=section;},{section,locale});
  await page.reload({waitUntil:'domcontentloaded'});const win=await app.browserWindow(page);
  await win.evaluate((w,[x,y])=>{if(w.isMaximized())w.unmaximize();w.setContentSize(x,y,false);},[width,height]);
  await page.waitForFunction(([w,h])=>innerWidth===w&&innerHeight===h,[width,height]);
  await page.getByTestId('unified-section-hero').waitFor();await page.waitForTimeout(1300);await page.keyboard.press('Escape');
 }
 async function sample(){return page.evaluate(()=>{
  const svg=document.querySelector('[data-orbital-particles]');const center=new DOMPoint(200,200).matrixTransform(svg.getCTM());
  const radii=[126,151,176],scale=svg.getBoundingClientRect().width/400;
  return{transforms:[...svg.querySelectorAll('.knx-living-revolution')].map(g=>getComputedStyle(g).transform),animations:[...svg.querySelectorAll('.knx-living-revolution')].map(g=>getComputedStyle(g).animationName),radii:[...svg.querySelectorAll('.knx-living-trail')].map((c,i)=>{const p=new DOMPoint(c.cx.baseVal.value,c.cy.baseVal.value).matrixTransform(c.getCTM());return{actual:Math.hypot(p.x-center.x,p.y-center.y),expected:radii[Math.floor(i/4)]*scale};}),controls:[...document.querySelectorAll('[data-testid="unified-live-orbit"] button')].map(b=>{const r=b.getBoundingClientRect();return{label:(b.title||b.textContent).trim(),x:r.x,y:r.y,w:r.width,h:r.height};})};
 });}
 for(const section of ['studio','home','workspace','startup','smart_scan','applications','services','system','repair','automation','files','storage','cleanup','settings']){
  try{
   await open(section);const a=await sample();assert.equal(a.controls.length>0,true);assert(a.animations.every(n=>n==='knx-orbital-revolution'));
   const hero=page.getByTestId('unified-section-hero');await hero.screenshot({path:path.join(out,`${section}-motion-0.png`)});
   await page.waitForTimeout(400);const b=await sample();await hero.screenshot({path:path.join(out,`${section}-motion-1.png`)});
   assert(a.transforms.some((t,i)=>t!==b.transforms[i]),'decorative tracks did not move');
   const targetDeviation=Math.max(...a.controls.flatMap((c,i)=>['x','y','w','h'].map(k=>Math.abs(c[k]-b.controls[i][k]))));
   assert(targetDeviation<=.5,`interactive targets moved ${targetDeviation}px`);
   const radiusError=Math.max(...a.radii.concat(b.radii).map(r=>Math.abs(r.actual-r.expected)));
   assert(radiusError<=1,`particles left their tracks ${radiusError}px`);
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(120);const reducedA=await sample();await page.waitForTimeout(300);const reducedB=await sample();
   assert(reducedA.animations.every(x=>x==='none'));assert.deepEqual(reducedA.transforms,reducedB.transforms);
   motion.push({section,ok:true,particles:a.radii.length,targetDeviation,radiusError,reducedMotionStopped:true,transformsBefore:a.transforms,transformsAfter:b.transforms});console.log(`${section} motion OK targets=${targetDeviation.toFixed(3)} radiusError=${radiusError.toFixed(3)}`);
  }catch(e){motion.push({section,ok:false,error:String(e.message)});console.log(`${section} MOTION FAILED ${e.message}`);}
 }
 async function probe(name,fn){try{const evidence=await fn();interactions.push({name,ok:true,evidence});console.log(`${name} OK`);}catch(e){interactions.push({name,ok:false,error:String(e.message)});console.log(`${name} FAILED ${e.message}`);}await page.screenshot({path:path.join(out,`${name}.png`),animations:'disabled'});}
 for(const locale of ['en','ar'])await probe(`files-portaled-search-${locale}`,async()=>{
  await open('files',locale,1366,768);const chromeSearch=page.locator('.knx-living-chrome input').first();await chromeSearch.fill('Readme');
  const localSearch=page.getByTestId('files-search');assert.equal(await localSearch.inputValue(),'Readme');
  const rows=page.getByTestId('files-results-scroll').locator('[data-testid^="files-row-"]');await rows.first().waitFor();assert.equal(await rows.count(),1);assert.match(await rows.first().innerText(),/Readme\.md/);
  await chromeSearch.fill('');const last=rows.last();await last.click();const geometry=await last.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2),f=document.querySelector('[data-testid="files-footer"]').getBoundingClientRect();return{lastRowReachable:!!hit&&el.contains(hit),footerTop:f.top,footerBottom:f.bottom,documentOverflow:document.documentElement.scrollHeight-innerHeight};});assert(geometry.lastRowReachable);assert(geometry.footerBottom<=768);assert.equal(geometry.documentOverflow,0);return{...geometry,scope:'explicit built-in fixture; owner file not opened or authorized'};
 });
 await probe('studio-state-and-native-portal',async()=>{
  await open('studio');const select=page.getByTestId('studio-service-select');await select.selectOption('2');await page.getByTestId('studio-focus-header').waitFor();assert.equal(await page.locator('.os-focus-header').getAttribute('data-service'),'2');assert.equal(await page.locator('[data-testid="unified-live-orbit"] [data-live-hero-orbit]').count(),1);await select.selectOption('0');await page.getByTestId('studio-overview-hero').waitFor();return{stageRoundTrip:'overview -> stage 2 -> overview',portalMounted:await page.getByTestId('studio-live-mount').count(),ownerSourceAuthorized:false};
 });
 await probe('shared-navigation-callback',async()=>{
  const nav=page.getByTestId('unified-shell-navigation');await nav.getByText('Files',{exact:true}).click();await page.getByTestId('files-workspace').waitFor();assert.equal(await page.getByTestId('unified-section-hero').getAttribute('data-hero-section'),'files');return{route:'files',chromeHeaders:await page.locator('.knx-living-chrome header').count(),navigationRails:await nav.locator('aside').count()};
 });
}finally{
 await app.close();const proof={capturedAt:new Date().toISOString(),profile,artworkAssets,motion,interactions,errors,ok:artworkAssets.length===14&&artworkAssets.every(x=>x.genuineTransparency)&&motion.length===14&&motion.every(x=>x.ok)&&interactions.length===4&&interactions.every(x=>x.ok)&&errors.length===0};await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2));if(!proof.ok)process.exitCode=1;
}
