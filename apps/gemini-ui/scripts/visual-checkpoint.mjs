import {chromium, expect} from '@playwright/test';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const out=path.resolve('../../docs/evidence/visual-checkpoint-20261027');
await mkdir(out,{recursive:true});
const cached=path.join(process.env.LOCALAPPDATA,'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const browser=await chromium.launch({...(existsSync(cached)?{executablePath:cached}:{channel:'chrome'}),headless:true,args:['--disable-gpu','--renderer-process-limit=1']});
const rows=[],intro=[],interactions=[];
const selected=process.argv.slice(2);
const routes=selected.length?selected:['files','studio','home','smart_scan','applications','storage','cleanup','startup','system','repair','services','automation'];
const save=()=>writeFile(path.join(out,selected.length?`checks-${selected.join('-')}.json`:'checks.json'),JSON.stringify({intro,rows,interactions},null,2));
const init=theme=>{localStorage.setItem('knoux_theme',theme);localStorage.setItem('knoux_locale','en');localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:false}));};
try {
 for(const theme of ['light','dark']) {
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(init,theme);
  await page.goto('http://127.0.0.1:3029/?cinematic=replay#home',{waitUntil:'domcontentloaded'});
  for(const [width,height] of [[1366,768],[1672,941]]) {
   await page.setViewportSize({width,height});
   if(!await page.locator('.entry-overlay').count()) await page.evaluate(()=>dispatchEvent(new Event('knoux:replay-entry')));
   await expect(page.locator('.entry-enter')).toBeEnabled({timeout:10000});
   const geometry=await page.evaluate(()=>{
    const d=document.querySelector('.entry-overlay').getBoundingClientRect();
    return {top:d.top,bottom:d.bottom,width:d.width,height:d.height,topSurface:!!document.elementFromPoint(innerWidth/2,10)?.closest('.entry-overlay'),workspaceInert:document.querySelector('.cinematic-workspace').inert};
   });
   if(geometry.top!==0 || geometry.height!==height || !geometry.topSurface || !geometry.workspaceInert) throw Error('Intro fails viewport coverage');
   await page.screenshot({path:path.join(out,`intro-${theme}-${width}.png`),animations:'disabled'});
   await page.getByRole('button',{name:'Enter Workspace',exact:true}).click();
   await expect(page.locator('.cinematic-boundary')).toHaveAttribute('data-phase','ACTIVE');
   await expect(page.locator('.cinematic-workspace')).not.toHaveAttribute('inert','');
   await page.evaluate(()=>dispatchEvent(new Event('knoux:replay-entry')));
   await expect(page.getByRole('button',{name:'Skip',exact:true})).toBeEnabled();
   await page.getByRole('button',{name:'Skip',exact:true}).click();
   await expect(page.locator('.cinematic-boundary')).toHaveAttribute('data-phase','ACTIVE');
   intro.push({theme,width,height,...geometry,enter:true,skip:true});await save();
  }
  for(const route of routes) {
   await page.evaluate(route=>{location.hash=route;},route);
   await page.locator(`[data-visual-section="${route}"] main`).waitFor();
   for(const [width,height] of [[1366,768],[1672,941]]) {
    await page.setViewportSize({width,height});await page.waitForTimeout(100);
    const geometry=await page.evaluate(()=>{
     const main=document.querySelector('main');
     const wheels=[...document.querySelectorAll('.knx-orbit button')].map(b=>{const r=b.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {label:b.textContent.trim(),disabled:b.disabled,hit:b===hit || b.contains(hit),inside:r.top>=0&&r.bottom<=innerHeight};});
     const scrolls=[...document.querySelectorAll('main *')].filter(e=>getComputedStyle(e).overflowY.match(/auto|scroll/) && e.scrollHeight>e.clientHeight+4).map(e=>{const before=e.scrollTop;e.scrollTop=20;const moved=e.scrollTop>0;e.scrollTop=before;return{className:String(e.className).slice(0,90),moved,height:e.clientHeight,content:e.scrollHeight};});
     return{mainOverflow:main.scrollHeight-main.clientHeight,pageOverflow:document.documentElement.scrollHeight-innerHeight,horizontal:document.documentElement.scrollWidth-innerWidth,wheels,scrolls};
    });
    await page.screenshot({path:path.join(out,`${route}-${theme}-${width}.png`),animations:'disabled'});
    await page.emulateMedia({reducedMotion:'reduce'});
    const reduced=await page.locator('.knx-particle-track').evaluateAll(nodes=>nodes.map(e=>getComputedStyle(e).animationName));
    rows.push({route,theme,width,height,...geometry,reduced,errors:[...errors]});await save();
    await page.emulateMedia({reducedMotion:'no-preference'});
   }
   if(route==='files') {
    await page.locator('.knx-orbit-core').click();await expect(page.getByTestId('files-search')).toBeFocused();
    await page.locator('.knx-orbit-tools button').filter({hasText:'Images'}).click();
    await expect(page.getByTestId('files-category-images')).toHaveAttribute('class',/purple|violet|active|bg-/);
    await page.locator('.knx-orbit-tools button').filter({hasText:'Filters'}).click();
    await expect(page.locator('.knx-files-advanced')).toHaveAttribute('open','');
    await page.locator('.knx-files-advanced').evaluate(e=>{e.open=false;});
    await page.getByRole('tab',{name:'Tools',exact:true}).click();
    await page.getByTestId('files-service-file-hash').click();
    await expect(page.getByTestId('files-workbench')).toBeVisible();
    await page.keyboard.press('Escape');await expect(page.getByTestId('files-workbench')).toHaveCount(0);
    interactions.push({theme,route,coreFocus:true,imageFilter:true,filters:true,hashWorkbench:true});await save();
   }
   if(route==='studio') {
    await page.locator('.knx-orbit-core').click();
    await expect(page.getByTestId('studio-workbench-pin')).toBeVisible();
    await page.getByTestId('studio-workbench-pin').click();
    await expect(page.getByTestId('studio-workbench-side-shell')).toBeVisible();
    interactions.push({theme,route,planWorkbench:true});await save();
    await page.locator('.knx-reference-back').click();
   }
   if(route==='repair') {
    await page.locator('.knx-orbit-tools button').filter({hasText:'SFC'}).click();
    await expect(page.locator('.rep-brief-head')).toContainText('SFC');
    await page.locator('.knx-orbit-tools button').filter({hasText:'DISM'}).click();
    await expect(page.locator('.rep-brief-head')).toContainText('DISM');
    interactions.push({theme,route,repairWheelSelection:true});await save();
   }
   if(route==='services') {
    await page.locator('.knx-orbit-tools button').filter({hasText:'Running'}).click();
    await expect(page.getByText('Run the measured Service Commander discovery before opening a tool.',{exact:true})).toBeVisible();
    interactions.push({theme,route,nativeGateNotice:true});await save();
   }
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>dispatchEvent(new Event('knoux:replay-entry')));
  await expect(page.locator('.entry-enter')).toBeEnabled();
  const reducedIntro=await page.locator('.entry-medallion').evaluate(e=>getComputedStyle(e).animationName);
  if(reducedIntro!=='none') throw Error('Intro reduced motion is still animated');
  await page.getByRole('button',{name:'Skip',exact:true}).click();
  await expect(page.locator('.cinematic-boundary')).toHaveAttribute('data-phase','ACTIVE');
  interactions.push({theme,reducedIntro,skipReduced:true});await save();await page.close();
 }
} finally {await save();await browser.close();}
console.log(JSON.stringify({intro:intro.length,views:rows.length,interactions,errors:rows.filter(r=>r.errors.length),overflow:rows.filter(r=>r.mainOverflow>4||r.pageOverflow>4||r.horizontal>4),wheelObstruction:rows.flatMap(r=>r.wheels.filter(w=>!w.disabled&&(!w.hit||!w.inside)).map(w=>({route:r.route,theme:r.theme,width:r.width,...w})))},null,2));
