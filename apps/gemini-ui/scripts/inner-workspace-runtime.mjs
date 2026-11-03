/** Shared real-runtime evidence plumbing. Domain scripts own assertions and native actions. */
import {_electron as electron,chromium} from '@playwright/test';
import {createRequire} from 'node:module';
import {mkdir,mkdtemp,readFile,writeFile,statfs} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),uiRoot=fileURLToPath(new URL('..',import.meta.url));
export async function runtime({section,out:requested,scope}){
 const out=path.resolve(requested),disk=await statfs(path.dirname(out));assert(disk.bavail*disk.bsize>150*1024*1024,'Insufficient disk space for evidence; no existing files were removed.');await mkdir(out,{recursive:false});
 const temp=await mkdtemp(path.join(os.tmpdir(),`knoux-inner-${section}-`)),profile=path.join(temp,'profile'),env={...process.env},head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({executablePath:require('electron'),args:[path.join(uiRoot,'electron/main.cjs'),'--disable-gpu',`--knoux-user-data=${profile}`],env,timeout:60000}),page=await app.firstWindow(),checks=[],errors=[],consoleMessages=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleMessages.push(m.text())});const win=await app.browserWindow(page);await win.evaluate(w=>{w.setIgnoreMouseEvents(true);w.setFocusable(false);w.setSkipTaskbar(true)});
 await page.evaluate(section=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale','en');localStorage.setItem('knoux_theme_preference','light');localStorage.setItem('knoux_theme','light');location.hash=section},section);await page.reload({waitUntil:'domcontentloaded'});await page.locator('.knx-living-shell').waitFor();
 const capture=async name=>page.screenshot({path:path.join(out,name+'.png'),animations:'disabled'});
 async function size(w,h){await win.evaluate((v,[w,h])=>{if(v.isMaximized())v.unmaximize();v.setBounds({x:40,y:40,width:w,height:h});v.setContentSize(w,h,false)},[w,h]);await page.waitForFunction(([w,h])=>innerWidth===w&&innerHeight===h,[w,h]);}
 async function frame(locale,theme,w,h){if(await page.locator('.knx-living-shell').getAttribute('dir')!==(locale==='ar'?'rtl':'ltr'))await page.getByTitle('Toggle Arabic / English',{exact:true}).click();if(await page.evaluate(()=>document.documentElement.dataset.theme)!==(theme==='day'?'light':'dark'))await page.locator('.knx-living-chrome button[aria-pressed]').filter({has:page.locator('svg.lucide-sun,svg.lucide-moon')}).first().click();await size(w,h);await page.waitForTimeout(150)}
 async function probe(name,fn){try{const evidence=await fn();checks.push({name,ok:true,evidence});console.log(name+' OK')}catch(e){checks.push({name,ok:false,error:e.message});await capture(name+'-failure').catch(()=>{});throw e}}
 async function geometry(body,footer){return page.evaluate(({body,footer})=>{const d=document.querySelector('[data-testid=compact-service-dock]').getBoundingClientRect(),s=document.querySelector(body).getBoundingClientRect(),f=document.querySelector(footer).getBoundingClientRect(),hero=document.querySelector('[data-testid=unified-section-hero]').getBoundingClientRect();return{dockHeight:d.height,bodyHeight:s.height,bodyWidth:s.width,footerBottom:f.bottom,footerRight:f.right,hero:{w:hero.width,h:hero.height},overflow:document.documentElement.scrollWidth-innerWidth}},{body,footer})}
 async function unavailableBrowser(check){const dist=path.join(uiRoot,'dist'),server=createServer(async(req,res)=>{try{const target=path.resolve(dist,'.'+new URL(req.url,'http://localhost').pathname);assert(target===dist||target.startsWith(dist+path.sep));const file=target===dist?path.join(dist,'index.html'):target;res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(await readFile(file))}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{const tab=await browser.newPage({viewport:{width:1366,height:768}});await tab.addInitScript(()=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale','en')});await tab.goto(`http://127.0.0.1:${server.address().port}/#${section}`);await tab.locator(section==='home'?'[data-testid=home-workspace]':'[data-testid=live-service-stage]').waitFor();const result=await check(tab);await tab.screenshot({path:path.join(out,'browser-unavailable.png')});return result}finally{await browser.close();await new Promise(r=>server.close(r))}}
 const save=async(name,value)=>writeFile(path.join(out,name),JSON.stringify(value,null,2));
 function fail(error){errors.push(error.message);console.error(error.stack);process.exitCode=1;}
 async function finish(expectedChecks){const ok=checks.length===expectedChecks&&checks.every(c=>c.ok)&&errors.length===0;await save('proof.json',{head,profile,scope,checks,errors,consoleMessages:[...new Set(consoleMessages)],ok});await app.close();if(!ok)process.exitCode=1;}
 return{app,page,temp,profile,out,head,capture,size,frame,probe,geometry,unavailableBrowser,save,fail,finish};
}
export const desktopFrames=[['en','day',1672,941],['en','day',1920,1080],['ar','day',1366,768],['en','night',1672,941]];
