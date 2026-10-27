import {chromium} from '@playwright/test';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const folder=path.resolve('../../docs/evidence/canvas-rollout'); await mkdir(folder,{recursive:true});
const cached=path.join(process.env.LOCALAPPDATA,'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const browser=await chromium.launch({...(existsSync(cached)?{executablePath:cached}:{channel:'chrome'}),headless:true,args:['--disable-gpu','--renderer-process-limit=1']});
const routes=process.argv.slice(2).length?process.argv.slice(2):['files','home','smart_scan','applications','storage','cleanup','startup','system','repair','services','automation','studio'];
const rows=[];
try {
 for(const theme of ['light','dark']) {
  const page=await browser.newPage({viewport:{width:1672,height:941}});
  await page.addInitScript(theme=>{localStorage.setItem('knoux_theme',theme);localStorage.setItem('knoux_locale','en');localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));},theme);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:3029/#${routes[0]}`,{waitUntil:'domcontentloaded',timeout:60000});
  for(const route of routes) {
  await page.setViewportSize({width:1672,height:941});
  await page.evaluate(route=>{location.hash=route;},route);
  await page.locator(`[data-visual-section="${route}"] main`).waitFor();
  await page.waitForTimeout(120);
  const measure=()=>page.evaluate(()=>{
   const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom};};
   const main=document.querySelector('main');
   return {viewport:{w:innerWidth,h:innerHeight},pageOverflow:document.documentElement.scrollHeight-innerHeight,mainOverflow:main.scrollHeight-main.clientHeight,horizontal:document.documentElement.scrollWidth-innerWidth,main:box(main),footer:[...document.querySelectorAll('main ~ footer, [data-testid="files-footer"]')].map(box),hero:[...document.querySelectorAll('.knx-command-hero,.knx-files-heading')].map(box),tabs:[...document.querySelectorAll('.knx-command-tabs button')].map(e=>({text:e.textContent,...box(e)})),panels:[...document.querySelectorAll('.knx-command-body,.knx-files-results')].map(box),particles:document.querySelectorAll('.knx-particle-track').length,animation:document.querySelector('.knx-particle-track')?getComputedStyle(document.querySelector('.knx-particle-track')).animationName:null};
  });
  const wide=await measure();
  await page.screenshot({path:path.join(folder,`${route}-${theme}.png`),animations:'disabled',timeout:15000});
  let repairRail=null;
  if(route==='repair') {
    repairRail=await page.locator('.rep-brief-content').evaluate(e=>{const r=e.getBoundingClientRect(),a=e.parentElement.querySelector('.rep-brief-actions').getBoundingClientRect();e.scrollTop=e.scrollHeight;return{contentBottom:r.bottom,actionsTop:a.top,scrollTop:e.scrollTop,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};});
    await page.screenshot({path:path.join(folder,`repair-${theme}-sequence-end.png`),animations:'disabled',timeout:15000});
  }
  await page.setViewportSize({width:1366,height:768}); const compact=await measure();
  if(route==='smart_scan' || compact.mainOverflow>4 || compact.panels.some(p=>p.h<60)) await page.screenshot({path:path.join(folder,`${route}-${theme}-compact.png`),animations:'disabled',timeout:15000});
  await page.emulateMedia({reducedMotion:'reduce'}); const reduced=await page.evaluate(()=>{const e=document.querySelector('.knx-particle-track');return e?getComputedStyle(e).animationName:null;});
  rows.push({route,theme,wide,compact,reduced,repairRail,errors});
  await writeFile(path.join(folder,`preview${routes.length<12?'-'+routes.join('-'):''}.json`),JSON.stringify(rows,null,2));
  await page.emulateMedia({reducedMotion:'no-preference'});
  }
  await page.close();
 }
} finally {await browser.close();}
await writeFile(path.join(folder,`preview${routes.length<12?'-'+routes.join('-'):''}.json`),JSON.stringify(rows,null,2));
console.log(JSON.stringify(rows.map(({route,theme,wide,compact,errors})=>({route,theme,wideOverflow:wide.mainOverflow,compactOverflow:compact.mainOverflow,bodyHeight:compact.panels[0]?.h,errors})),null,2));
