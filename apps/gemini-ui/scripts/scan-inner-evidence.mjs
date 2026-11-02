/** Actual isolated Electron + real read-only ScanBridge, restricted disposable folder. */
import {_electron as electron,chromium} from '@playwright/test';
import {createRequire} from 'node:module';
import {mkdir,mkdtemp,writeFile,readFile,open,rename,readdir} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const arg=(key,fallback)=>process.argv.find(a=>a.startsWith(`--${key}=`))?.slice(key.length+3)??fallback;
const out=path.resolve(arg('out','../../docs/evidence/inner-workspaces-20261102/scan-runtime'));
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
await mkdir(out,{recursive:false});
const temp=await mkdtemp(path.join(os.tmpdir(),'knoux-inner-scan-')),profile=path.join(temp,'profile'),fixture=path.join(temp,'AUTHORIZED-DISPOSABLE-FIXTURE');
await mkdir(fixture);await mkdir(path.join(fixture,'empty-folder'));
for(let i=0;i<24;i++)await writeFile(path.join(fixture,`measured-document-${String(i).padStart(2,'0')}.txt`),`Disposable native UI verification ${i}\n`.repeat(i+1));
for(const name of ['duplicate-a.bin','duplicate-b.bin'])await writeFile(path.join(fixture,name),Buffer.alloc(1024*1024+19,73));
for(const [name,text]of [['report.csv','name,value\nfixture,1'],['source.ts','export const fixture = true;'],['archive.zip','Disposable fixture metadata; not an actual archive'],['clip.mp4','Disposable fixture metadata; not actual media']])await writeFile(path.join(fixture,name),text);
const large=await open(path.join(fixture,'measured-large-fixture.bin'),'w');await large.truncate(201*1024*1024);await large.close();
async function hashes(){const records=[];for(const name of await readdir(fixture)){if(name==='empty-folder')continue;records.push({name,sha256:createHash('sha256').update(await readFile(path.join(fixture,name))).digest('hex')})}return records}
const before=await hashes();
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:require('electron'),args:[path.resolve('electron/main.cjs'),'--disable-gpu',`--knoux-user-data=${profile}`],env,timeout:60000});
const checks=[],errors=[],consoleMessages=[],nativeEvents=[];const sessionByService={};let sessionId=null;
try{
 const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleMessages.push(m.text())});
 await page.exposeFunction('__recordScanEvent',event=>nativeEvents.push(event));
 const win=await app.browserWindow(page);await win.evaluate(w=>{w.setIgnoreMouseEvents(true);w.setFocusable(false);w.setSkipTaskbar(true)});
 async function size(w,h){await win.evaluate((v,[w,h])=>{if(v.isMaximized())v.unmaximize();v.setBounds({x:40,y:40,width:w,height:h});v.setContentSize(w,h,false)},[w,h]);await page.waitForFunction(([w,h])=>innerWidth===w&&innerHeight===h,[w,h]);}
 async function init(locale='en',theme='day',w=1672,h=941){await page.evaluate(({locale,theme})=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale',locale);localStorage.setItem('knoux_theme_preference',theme==='day'?'light':'dark');localStorage.setItem('knoux_theme',theme==='day'?'light':'dark');location.hash='smart_scan'},{locale,theme});await page.reload({waitUntil:'domcontentloaded'});await size(w,h);await page.getByTestId('scan-service-quick_scan').waitFor();await page.waitForTimeout(400);await page.evaluate(()=>window.knouxScanV1.onEvent(e=>window.__recordScanEvent(e)));}
 async function capture(name){await page.screenshot({path:path.join(out,name+'.png'),animations:'disabled',timeout:30000})}
 async function probe(name,fn){try{const evidence=await fn();checks.push({name,ok:true,evidence});console.log(name+' OK')}catch(e){checks.push({name,ok:false,error:e.message});await capture(name+'-failure').catch(()=>{});throw e}}
 await init();
 await probe('idle-geometry-keyboard-all-ten',async()=>{
  const states=[];
  for(const[locale,theme,w,h]of [['en','day',1672,941],['en','day',1920,1080],['ar','day',1366,768],['en','night',1672,941]]){
   await init(locale,theme,w,h);
   const dock=page.getByTestId('compact-service-dock'),tabs=dock.getByRole('tab');assert.equal(await tabs.count(),10);
   const dimensions=await dock.evaluate(el=>{const r=el.getBoundingClientRect(),hero=document.querySelector('[data-testid=unified-section-hero]').getBoundingClientRect(),body=document.querySelector('[data-testid=scan-workspace]').getBoundingClientRect();return{dockHeight:r.height,dockRight:r.right,hero:{x:hero.x,y:hero.y,w:hero.width,h:hero.height},body:{w:body.width,h:body.height},horizontalOverflow:document.documentElement.scrollWidth-innerWidth}});
   assert(dimensions.dockHeight>=56&&dimensions.dockHeight<=76,JSON.stringify(dimensions));assert(dimensions.dockRight<=w);assert.equal(dimensions.horizontalOverflow,0);
   await tabs.first().focus();await page.keyboard.press('End');await page.getByTestId('scan-service-focus').waitFor();assert.equal(await page.getByTestId('scan-service-focus').getAttribute('data-tool'),'smart_recommendations');await page.keyboard.press('Home');assert.equal(await page.getByTestId('scan-service-focus').getAttribute('data-tool'),'quick_scan');
   assert.equal(await page.getByTestId('scan-workbench-side-shell').count(),0);
   for(const id of await tabs.evaluateAll(es=>es.map(e=>e.dataset.serviceId))){await page.getByTestId('scan-service-'+id).click();await page.getByTestId('scan-service-ready').waitFor();assert.equal(await page.getByTestId('scan-service-focus').getAttribute('data-tool'),id)}
   await page.getByTestId('scan-service-quick_scan').click();await capture(`idle-${theme}-${locale}-${w}x${h}`);states.push(dimensions);
  }return states;
 });
 await init();
 // Only the folder dialog is answered by the harness; native authorization,
 // indexing, coordinator, IPC and service results are production implementations.
 await app.evaluate(({dialog},fixture)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[fixture]})},fixture);
 await probe('native-authorization-index',async()=>{
  await page.locator('.scan-workspace-tools').getByRole('button',{name:'Choose folder',exact:true}).click();
  await page.getByTestId('scan-service-ready').getByRole('button',{name:'Index folder',exact:true}).click();
  await page.waitForFunction(async()=>{const s=await window.knouxScanV1.listSources();return s.data?.some(s=>s.status==='ready'&&s.fileCount>=31)});
  await page.waitForFunction(()=>!document.querySelector('[data-testid=scan-service-run]')?.disabled);
  return await page.evaluate(async()=>{const s=await window.knouxScanV1.listSources();return s.data.map(x=>({id:x.id,label:x.label,fileCount:x.fileCount,status:x.status}))});
 });
 const ids=await page.getByTestId('compact-service-dock').getByRole('tab').evaluateAll(es=>es.map(e=>e.dataset.serviceId));
 for(const id of ids)await probe('native-service-'+id,async()=>{
  await page.getByTestId('scan-service-'+id).click();await page.getByTestId('scan-service-run').click();
  await page.waitForFunction(async(id)=>{const h=await window.knouxScanV1.history();return h.data?.some(s=>s.requestedServices.includes(id)&&['complete','partial','failed','cancelled'].includes(s.status))},id,{timeout:180000});
  await page.waitForFunction(()=>!document.querySelector('[data-testid=scan-service-run]')?.disabled,{},{timeout:180000});
  const actual=await page.evaluate(async id=>{const h=await window.knouxScanV1.history(),s=h.data.find(s=>s.requestedServices.includes(id));return (await window.knouxScanV1.status(s.id)).data},id);sessionId=actual.id;sessionByService[id]=actual.id;
  assert(actual.services.some(s=>s.serviceId===id));assert(actual.services.every(s=>s.mutation==='none'));
  await writeFile(path.join(out,`${id}-native-session.json`),JSON.stringify(actual,null,2));await capture(`${id}-measured-1672`);
  if(id==='large_files_review'){
   await page.locator('.scan-ranked-file').first().click();await page.getByTestId('scan-file-detail').waitFor();assert.match(await page.getByTestId('scan-file-detail').innerText(),/measured-large-fixture/);
   await page.locator('.scan-large-tools>summary').click();const query=page.getByRole('searchbox',{name:'Name or path'});await query.fill('no-matching-disposable-file');assert.equal(await page.locator('.scan-ranked-file').count(),0);await query.fill('');await page.locator('.scan-ranked-file').last().scrollIntoViewIfNeeded();await capture('large-files-final-row-and-inspector');
  }
  if(id==='duplicate_finder')assert(actual.services.find(s=>s.serviceId===id).data.verified.summary.verifiedGroups>=1);
  return {sessionId:actual.id,status:actual.status,serviceStatus:actual.services.find(s=>s.serviceId===id).status,findings:actual.findings.length,stages:actual.stages.map(s=>({id:s.id,status:s.status})),dataSource:'Real native providers; file observations restricted to disposable fixture'};
 });
 await probe('history-populated-responsive-matrix',async()=>{
  const frames=[];
  for(const[locale,theme,w,h]of [['en','day',1672,941],['en','day',1920,1080],['ar','day',1366,768],['en','night',1672,941]]){
   await init(locale,theme,w,h);await page.getByTestId('scan-service-large_files_review').click();
   await page.locator('.scan-workspace-tools').getByRole('button',{name:locale==='ar'?'النتائج والسجل':'Findings & history',exact:true}).click();
   await page.locator('.scan-evidence-rail>details>summary').click();await page.getByTestId('recent-scan-'+sessionByService.large_files_review).click();
   await page.locator('.scan-ranked-file').first().waitFor();await page.locator('.scan-workspace-tools').getByRole('button',{name:locale==='ar'?'النتائج والسجل':'Findings & history',exact:true}).click();
   const first=page.locator('.scan-ranked-file').first();await first.scrollIntoViewIfNeeded();await first.click();await page.getByTestId('scan-file-detail').waitFor();
   await page.locator('.scan-service-body').evaluate(el=>el.scrollTop=0);await capture(`measured-${theme}-${locale}-${w}x${h}`);
   const geometry=await page.getByTestId('scan-service-run').evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2),body=document.querySelector('.scan-service-body').getBoundingClientRect(),first=document.querySelector('.scan-ranked-file')?.getBoundingClientRect();return{firstRowCenterVisible:!!first&&first.y+first.height/2>=body.y&&first.y+first.height/2<=body.bottom,runReachable:el.contains(hit),runBottom:r.bottom,bodyHeight:body.height,overflow:document.documentElement.scrollWidth-innerWidth}});
   assert(geometry.firstRowCenterVisible,JSON.stringify(geometry));assert(geometry.runReachable);assert(geometry.runBottom<=h);assert(geometry.bodyHeight>=100,JSON.stringify(geometry));assert.equal(geometry.overflow,0);frames.push({locale,theme,w,h,...geometry});
  }
  await init();return frames;
 });
 await probe('export-actual-session-report',async()=>{
  const target=path.join(temp,'exported-scan.json');assert(path.dirname(target)===temp);
  await app.evaluate(({session},target)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(target))},target);
  await page.getByTestId('scan-command-bar').getByRole('button',{name:'Export Report',exact:true}).click();
  let report;const deadline=Date.now()+20000;while(Date.now()<deadline){try{report=JSON.parse(await readFile(target,'utf8'));break}catch{await new Promise(resolve=>setTimeout(resolve,100))}}
  assert(report?.session?.id);assert.equal(report.contract,'scan.v1');assert.equal(report.readOnly,true);assert.equal(report.mutation,'none');
  const native=await page.evaluate(async id=>(await window.knouxScanV1.status(id)).data,report.session.id);assert.equal(native.id,report.session.id);assert.equal(native.summary.findingsCount,report.session.summary.findingsCount);return{target,sessionId:report.session.id,readOnly:report.readOnly,actualReportBytes:(await readFile(target)).length};
 });
 await probe('native-cancellation-events',async()=>{
  await page.getByTestId('scan-service-deep_scan').click();await page.getByTestId('scan-service-run').click();
  await page.waitForFunction(()=>document.querySelector('[data-testid=live-service-stage]')?.dataset.nativeStatus==='RUNNING');await capture('running-before-cancel');
  await page.getByTestId('scan-command-bar').getByRole('button',{name:'Cancel Scan',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('[data-testid=scan-service-run]')?.disabled,{},{timeout:180000});
  const events=nativeEvents;await writeFile(path.join(out,'native-events.json'),JSON.stringify(events,null,2));assert(events.some(e=>e.type==='scan-cancelled-requested'));assert(events.some(e=>e.type==='scan-cancelled'));
  await capture('cancelled-native');return{types:[...new Set(events.map(e=>e.type))],count:events.length};
 });
 await probe('real-missing-scope-error-recovery',async()=>{
  const moved=fixture+'-temporarily-unavailable';assert(path.dirname(fixture)===temp&&path.dirname(moved)===temp);
  await rename(fixture,moved);
  try{const result=await page.evaluate(async()=>{const s=await window.knouxScanV1.listSources();return await window.knouxScanV1.indexSource(s.data[0].id)});assert.notEqual(result.status,'complete');
   // Trigger the same real failure through the existing page callback.
   await page.locator('.scan-workspace-tools').getByRole('button',{name:'Choose folder',exact:true}).click();await page.locator('.scan-inline-message.is-error').waitFor();await capture('missing-scope-failed');return{code:result.error?.code,status:result.status};
  }finally{await rename(moved,fixture)}
 });
 await probe('gallery-side-view-reduced-motion',async()=>{
  await page.locator('.scan-workspace-tools').getByRole('button',{name:'All services',exact:true}).click();await page.getByTestId('scan-service-gallery').waitFor();assert.equal(await page.locator('.scan-service-gallery>div>button').count(),10);await capture('large-service-gallery');
  await page.getByTestId('scan-service-system_health_pulse').click();await page.locator('.scan-workspace-tools').getByRole('button',{name:'Side view',exact:true}).click();await page.getByTestId('scan-workbench').waitFor();await page.keyboard.press('Escape');await page.getByTestId('scan-integrated-workspace').waitFor();assert.equal(await page.getByTestId('scan-workbench-side-shell').count(),0);
  await page.emulateMedia({reducedMotion:'reduce'});return{galleryServices:10,sideViewRoundTrip:true,reducedMotion:await page.locator('.knx-living-revolution').first().evaluate(el=>getComputedStyle(el).animationName)};
 });
 await probe('unavailable-browser-has-no-fake-native',async()=>{
  const dist=path.resolve('dist');const server=createServer(async(req,res)=>{try{const target=path.resolve(dist,'.'+new URL(req.url,'http://localhost').pathname);assert(target===dist||target.startsWith(dist+path.sep));const file=target===dist?path.join(dist,'index.html'):target;const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';res.setHeader('Content-Type',mime);res.end(await readFile(file))}catch{res.writeHead(404);res.end('Missing asset')}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true});try{const tab=await browser.newPage({viewport:{width:1366,height:768}});await tab.addInitScript(()=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_theme','light');localStorage.setItem('knoux_theme_preference','light');localStorage.setItem('knoux_locale','en')});await tab.goto(`http://127.0.0.1:${server.address().port}/#smart_scan`);await tab.getByTestId('live-service-stage').waitFor();assert.equal(await tab.getByTestId('live-service-stage').getAttribute('data-native-status'),'UNAVAILABLE');assert.equal(await tab.locator('[data-service-id]').count(),0);await tab.screenshot({path:path.join(out,'unavailable-browser.png')});return{nativeAPI:await tab.evaluate(()=>typeof window.knouxScanV1),status:'UNAVAILABLE',fixtureFallback:false}}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
 });
}catch(e){errors.push(e.message);console.error(e.stack);process.exitCode=1}
finally{await app.close();const after=await hashes();const fixtureUnchanged=JSON.stringify(before)===JSON.stringify(after);assert(fixtureUnchanged);await writeFile(path.join(out,'proof.json'),JSON.stringify({head,profile,fixture,scope:'Disposable source only; native Windows observations remain read-only; no cleanup/mutation executed',checks,errors,consoleMessages:[...new Set(consoleMessages)],fixtureUnchanged,ok:checks.length===18&&checks.every(x=>x.ok)&&errors.length===0},null,2))}
