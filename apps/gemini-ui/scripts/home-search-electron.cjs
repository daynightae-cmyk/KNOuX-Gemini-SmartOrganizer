'use strict';
// Canonical Electron/preload and real native indexes in a disposable profile.
// Only the two explicitly created fixture folders are authorized/indexed.
const {_electron,expect}=require('@playwright/test');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {StudioBridge}=require('../electron/native/studio-bridge.cjs');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'knoux-home-search-')),profile=path.join(root,'profile');
 const out=path.resolve(__dirname,'../../../docs/evidence/home-search-recovery-20261102');await fs.mkdir(out,{recursive:true});
 const originals=new Map(),sources=[];
 const studio=new StudioBridge({userDataPath:profile,nativeImage:null,isPackaged:false,chooseFolder:async()=>null,emit:()=>{}});
 await studio.init();
 try{for(const [folder,name] of [['Authorized A','knoux-search-alpha.txt'],['Authorized B','knoux-search-needle.txt']]){
  const dir=path.join(root,folder);await fs.mkdir(dir);const file=path.join(dir,name);await fs.writeFile(file,'Disposable search evidence '+name);originals.set(file,await fs.readFile(file));
  const source=await studio.addSource(dir);await studio.scanSource(source.id);sources.push(source.id);
 }}finally{await studio.dispose();}
 const hidden=path.join(root,'Not authorized');await fs.mkdir(hidden);await fs.writeFile(path.join(hidden,'offscope-secret-needle.txt'),'Not authorized for indexing');
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:require('electron'),args:[path.resolve(__dirname,'../electron/main.cjs'),'--dev',`--knoux-user-data=${profile}`],env,timeout:60000});
 const electronChild=app.process();
 const watchdog=setTimeout(()=>{try{electronChild.kill();}catch{}},600000),errors=[],warnings=[],checks=[],states=[];
 let successfulRun=null;
 const receipt=async(extra={})=>fs.writeFile(path.join(out,'proof.json'),JSON.stringify({status:'running',scope:'Two disposable indexed folders, actual read-only installed-app inventory, canonical development Electron. No owner folder grants, file opening, process launch or Windows writes.',checks,states,errors,warnings:[...new Set(warnings)],...extra},null,2));
 await receipt();
 try{
  const page=await app.firstWindow();page.setDefaultTimeout(30000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(()=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale','en');localStorage.setItem('knoux_theme_preference','dark');location.hash='home';});
  await page.reload({waitUntil:'domcontentloaded'});await page.getByTestId('home-workspace').waitFor();
  await expect(page.getByTestId('home-live-status')).not.toHaveAttribute('data-status','loading',{timeout:40000});
  const before=await page.evaluate(()=>window.knouxFilesV1.listSources());assert.equal(before.data.length,2);
  const openSearch=async(query)=>{await page.keyboard.press('Control+k');await page.getByLabel('Search workspaces',{exact:true}).fill(query);};
  await openSearch('knoux-search');
  await expect(page.getByTestId('home-search-file')).toHaveCount(2,{timeout:40000});
  await page.getByTestId('home-search-file').filter({hasText:'knoux-search-needle.txt'}).click({noWaitAfter:true});
  await page.getByTestId('files-workspace').waitFor();
  await expect(page.getByTestId('files-search')).toHaveValue('knoux-search-needle.txt');
  await expect(page.locator('.knx-files-inspector')).toContainText('knoux-search-needle.txt');
  await expect(page.getByTestId('files-native-banner')).toContainText('Native measured index');
  assert.equal(await page.locator('[data-testid^="files-row-native-"]').count(),1);
  checks.push('Home searches both actual native indexes; selecting the second source rechecks its authorization and selects the actual matching Files row');
  await page.evaluate(()=>location.hash='home');await page.getByTestId('home-workspace').waitFor();
  await openSearch('offscope-secret');await expect(page.getByTestId('home-inventory-search')).toHaveAttribute('aria-busy','false');
  await expect(page.getByTestId('home-search-file')).toHaveCount(0);await page.keyboard.press('Escape');
  checks.push('Unindexed fixture folder is not searched or granted');
  const apps=await page.evaluate(()=>window.knouxAppsV1.inventory());
  assert(apps.data?.apps?.length,'No actual installed-app inventory available for this acceptance case');
  const candidate=apps.data.apps.find(a=>a.name.length>=2&&a.name.length<=180);assert(candidate);
  await page.getByLabel('Refresh Home data',{exact:true}).click();
  await expect(page.getByTestId('home-live-status')).not.toHaveAttribute('data-status','loading',{timeout:40000});
  await openSearch(candidate.name);
  await expect(page.getByTestId('home-inventory-search')).toHaveAttribute('aria-busy','false',{timeout:30000});
  const appDiagnostic=await page.evaluate(()=>({homeStatus:document.querySelector('[data-testid="home-live-status"]')?.getAttribute('data-status'),results:document.querySelector('[data-testid="home-inventory-search"]')?.innerText}));
  console.log('[home-search] measured app diagnostic '+JSON.stringify(appDiagnostic));
  const appHit=page.getByTestId('home-search-app').filter({hasText:candidate.name}).first();await appHit.waitFor();await appHit.click({noWaitAfter:true});
  await expect(page.getByTestId('apps-dossier')).toContainText(candidate.name,{timeout:40000});
  checks.push('Measured installed-app result opens the existing Applications dossier; no executable is launched');
  const after=await page.evaluate(()=>window.knouxFilesV1.listSources());
  assert.deepEqual(after.data.map(s=>[s.id,s.scannedAt]),before.data.map(s=>[s.id,s.scannedAt]));
  for(const [file,content]of originals)assert.deepEqual(await fs.readFile(file),content);
  checks.push('Search/navigation grants no new source, does not reindex, and leaves fixture file bytes unchanged');
  const capture=async(name)=>{
   await page.waitForTimeout(450);
   const geometry=await page.evaluate(()=>({width:innerWidth,height:innerHeight,locale:document.documentElement.lang,dir:document.documentElement.dir,theme:document.documentElement.dataset.theme||'dark',overflow:document.documentElement.scrollHeight-innerHeight,horizontal:document.documentElement.scrollWidth-innerWidth}));
   const png=await app.evaluate(async({BrowserWindow})=>(await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString('base64'));
   await fs.writeFile(path.join(out,name+'.png'),Buffer.from(png,'base64'));states.push({name,...geometry});await receipt();
  };
  const visualRoutes=process.env.KNOUX_HOME_SEARCH_FULL_VISUAL==='1'
   ? ['home','files','studio','settings','smart_scan','applications']
   : ['home'];
  const visualSizes=process.env.KNOUX_HOME_SEARCH_NATIVE_ONLY==='1'?[]:[{width:1366,height:768},{width:1672,height:941},{width:1920,height:1080}];
  for(const size of visualSizes){
   let resized=false;
   for(let attempt=0;attempt<3&&!resized;attempt++){
    const actual=await app.evaluate(({BrowserWindow},size)=>{
     const win=BrowserWindow.getAllWindows()[0];
     if(win.isMinimized())win.restore();
     if(win.isMaximized())win.unmaximize();
     win.setContentSize(size.width,size.height);
     return win.getContentSize();
    },size);
    try{await page.waitForFunction(size=>innerWidth===size.width&&innerHeight===size.height,size,{timeout:10000});resized=true;}
    catch{if(attempt===2)throw new Error(`VIEWPORT_RESIZE_UNSTABLE: expected ${size.width}x${size.height}, native ${actual.join('x')}`);}
   }
   for(const route of visualRoutes){
    await page.evaluate(route=>location.hash=route,route);
    await page.locator(route==='settings'?'[data-testid="settings-root"] main':`[data-visual-section="${route}"] main`).waitFor();
    if(route==='home')await expect(page.getByTestId('home-live-status')).not.toHaveAttribute('data-status','loading',{timeout:40000});
    for(const locale of ['en','ar']){
     if(await page.evaluate(()=>document.documentElement.lang)!==locale){await page.locator('button').filter({hasText:/^(English|EN|العربية|عربي)$/}).first().click({noWaitAfter:true});await page.waitForFunction(locale=>document.documentElement.lang===locale,locale);}
     for(const theme of ['dark','light']){
      if(await page.evaluate(()=>document.documentElement.dataset.theme||'dark')!==theme)await page.getByRole('button',{name:/Switch to .* theme|التبديل إلى الوضع/}).first().click({noWaitAfter:true});
      await page.waitForFunction(theme=>(document.documentElement.dataset.theme||'dark')===theme,theme);
      const label=`${route}-${theme}-${locale}-${size.width}x${size.height}`;await capture(label);
      if(route==='home'){
       await openSearch('knoux-search');await expect(page.getByTestId('home-search-file')).toHaveCount(2);await capture(label+'-search');
       const bounds=await page.locator('dialog[open]').evaluate(el=>{const r=el.getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:innerHeight,background:getComputedStyle(el).backgroundColor};});
       assert(bounds.top>=0&&bounds.bottom<=bounds.height,'Home search dialog is outside native viewport');
       assert.equal(bounds.background,theme==='dark'?'rgb(17, 23, 53)':'rgb(247, 245, 255)');await page.keyboard.press('Escape');
      }
      if(route==='studio'){
       await page.keyboard.press('Control+k');await page.getByLabel('Search organization stages').fill('');await capture(label+'-search');await page.keyboard.press('Escape');
      }
     }
    }
   }
   console.log('[home-search] native content verified '+size.width+'x'+size.height);
  }
  assert.equal(errors.length,0,errors.join('\n'));assert(states.every(s=>s.overflow<=1&&s.horizontal<=1));
  successfulRun={completedAt:new Date().toISOString(),fixtures:{sourceIDs:sources,unchangedFiles:originals.size},visualRoutes,captureCount:states.length};
  await receipt({status:'closing',...successfulRun});
 }catch(error){await receipt({status:'failed',failure:String(error)});throw error;}
 finally{
  let closeTimer;
  try{await Promise.race([app.close(),new Promise(resolve=>{closeTimer=setTimeout(()=>{try{electronChild.kill();}catch{}resolve();},10000);})]);}
  finally{if(closeTimer)clearTimeout(closeTimer);clearTimeout(watchdog);}
 }
 if(successfulRun){await receipt({status:'verified',...successfulRun});console.log(JSON.stringify({status:'verified',checks,captures:states.length,errors},null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
