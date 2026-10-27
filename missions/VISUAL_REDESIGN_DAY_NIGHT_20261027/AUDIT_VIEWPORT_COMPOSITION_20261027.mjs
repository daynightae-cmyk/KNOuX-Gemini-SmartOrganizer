// KNOuX owner visual-rejection: NON-DESTRUCTIVE viewport geometry probe.
// Usage from any location:
// node "D:/KNOUX-Workspace/KNOuX-Gemini-SmartOrganizer/missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/AUDIT_VIEWPORT_COMPOSITION_20261027.mjs"
// Environment: KNOX_PREVIEW_PORT=3017, or KNOX_PREVIEW_URL=http://127.0.0.1:3017
// Does NOT start/stop Vite, modify app data or capture screenshots. Observations go to stdout.
// Exit code 2 = server/browser failure. Exit code 1 = unacceptable page-level vertical overflow.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const appRoot = 'D:/KNOUX-Workspace/KNOuX-Gemini-SmartOrganizer/apps/gemini-ui';
const { chromium } = require(resolve(appRoot, 'node_modules', '@playwright', 'test'));
const baseURL = process.env.KNOX_PREVIEW_URL || `http://127.0.0.1:${process.env.KNOX_PREVIEW_PORT || '3017'}`;
const sections = ['home', 'studio', 'files', 'smart_scan', 'applications', 'storage', 'cleanup', 'startup', 'system', 'repair', 'services', 'automation'];
const vp = [{width:1366,height:768},{width:1672,height:941},{width:1920,height:1080}];
const themes = ['light', 'dark'];
let fails=0;
let browser;
const pixels = x => Math.round(x * 10) / 10;
try {
 browser = await chromium.launch({headless:true, channel:'chrome'}).catch(()=>chromium.launch({headless:true}));
 for (const view of vp) for (const theme of themes) {
  const cx=await browser.newContext({viewport:view, reducedMotion:'reduce'});
  await cx.addInitScript(({theme})=>{
   localStorage.setItem('knoux_theme',theme);
   localStorage.setItem('knoux_locale','en');
   localStorage.setItem('knoux.cinematic.v1', JSON.stringify({seen:true,always:false,muted:true,reduced:true}));
  },{theme});
  const page=await cx.newPage();
  for(const section of sections){
   try{
    await page.goto(`${baseURL}/#${section}`,{waitUntil:'domcontentloaded',timeout:15000});
    const root=page.locator(`[data-visual-section="${section}"]`);
    await root.waitFor({timeout:10000});
    await page.waitForTimeout(320);
    const data=await page.evaluate(()=>{
     const roots = [document.documentElement,document.body,document.querySelector('#root'),document.querySelector('[data-visual-section]'),document.querySelector('main')].filter(Boolean);
     const unique=[...new Set(roots)];
     const geometry = unique.map(el=>{
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      return {node: el.tagName.toLowerCase() +(el.id?'#'+el.id:'')+(el.classList.length?'.'+[...el.classList].slice(0,2).join('.'):''),
       clientHeight:el.clientHeight, scrollHeight:el.scrollHeight, excess:el.scrollHeight-el.clientHeight,
       overflowY:cs.overflowY,boxTop:Math.round(r.top),boxBottom:Math.round(r.bottom)};
     });
     const scrollable=[...document.querySelectorAll('main, [class*=main], [class*=viewport], [class*=reference], [class*=content]')].filter(el=>{
      const cs=getComputedStyle(el);return el.scrollHeight-el.clientHeight>18&&el.clientHeight>200&&(['auto','scroll'].includes(cs.overflowY))
     }).slice(0,12).map(el=>({selector:el.tagName.toLowerCase()+'.'+[...el.classList].slice(0,3).join('.'),height:el.clientHeight,excess:el.scrollHeight-el.clientHeight}));
     const buttons=[...document.querySelectorAll('button')].filter(el=>getComputedStyle(el).display!=='none'&&el.offsetParent).map(el=>({txt:el.innerText.trim().slice(0,55),bottom:Math.round(el.getBoundingClientRect().bottom),top:Math.round(el.getBoundingClientRect().top)}));
     return {documentExcess:document.documentElement.scrollHeight-innerHeight,geometry, scrollable, offscreenButtons:buttons.filter(b=>b.top<0||b.bottom>innerHeight).length, buttonCount:buttons.length};
    });
    const outer=data.geometry.filter(x=> x.node==='html' || x.node==='body'||x.node.startsWith('div#root') || x.node.startsWith('main.'));
    // Prefer report to unilateral assertions because a nested list scroll may be a deliberate workbench.
    const pageOverflow=data.documentExcess>4;
    const primaryOverflow=outer.some(x=>x.excess>20 && /^(auto|scroll)$/.test(x.overflowY));
    if(pageOverflow||primaryOverflow)fails++;
    console.log(JSON.stringify({section, theme,viewport:`${view.width}x${view.height}`,pageOverflow,primaryOverflow,documentExcess:pixels(data.documentExcess),rootGeometry:data.geometry,largeScrollOwners:data.scrollable,offscreenButtons:data.offscreenButtons,buttonCount:data.buttonCount}));
   }catch(e){fails++;console.error(JSON.stringify({section,theme,viewport:`${view.width}x${view.height}`,error:String(e.message).slice(0,350)}));}
  }
  await cx.close();
 }
} catch(e){console.error('BROWSER_OR_SERVER_FAILURE '+String(e.message));process.exitCode=2}
finally{await browser?.close()}
if(fails){console.error(`VIEWPORT_REJECTION_GATES=${fails}; compare against screenshots and classify intentional inner-list vs forbidden route scroll`);if(!process.exitCode)process.exitCode=1}
else if(!process.exitCode)console.log('VIEWPORT_GEOMETRY_PRELIMINARY_PASS — STILL requires per-panel fold checks and manual reference comparison');
