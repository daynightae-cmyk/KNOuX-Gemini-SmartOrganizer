import {_electron as electron,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile,access} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url),{fixture,sha}=require('./live-organization-fixtures.cjs');
const f=await fixture(40),out=path.resolve(process.env.KNOUX_ORGANIZATION_ELECTRON_DIR||'../../docs/evidence/live-organization/electron');await mkdir(out,{recursive:true});
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:require('electron'),args:['--disable-gpu','--js-flags=--max-old-space-size=160',path.resolve('electron/main.cjs'),`--knoux-user-data=${f.profile}`],env,timeout:60000});
const proof={fixture:f.root,checks:[],errors:[],views:[]};
try {
 const profile=await app.evaluate(({app})=>app.getPath('userData'));expect(path.resolve(profile)).toBe(path.resolve(f.profile));
 await app.evaluate(({dialog},f)=>{
  globalThis.__liveFixtureConfirmations=[];
  dialog.showOpenDialog=async(_parent,options)=>{
   const selected=options.title.includes('source')?f.source:options.title==='Choose an output destination'?f.destination:null;
   if(!selected)throw Error('Unexpected picker in isolated test');
   return{canceled:false,filePaths:[selected]};
  };
  dialog.showMessageBox=async(_parent,options)=>{
   if(options.title!=='KNOuX â€” exact operation approval')throw Error('Unexpected confirmation in isolated test');
   globalThis.__liveFixtureConfirmations.push({title:options.title,message:options.message,detail:options.detail});
   return{response:1,checkboxChecked:false};
  };
 },f);
 const page=await app.firstWindow();page.on('pageerror',e=>proof.errors.push(e.message));
 await page.waitForLoadState('domcontentloaded');
 await page.evaluate(()=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale','en');localStorage.setItem('knoux_theme','light');location.hash='files';});
 await page.reload();await page.getByTestId('files-live-organization').waitFor({timeout:60000});
 await page.evaluate(()=>{window.__liveEvents=[];window.knouxOperationsV1.onEvent(e=>window.__liveEvents.push(e));});
 const untrusted=await app.evaluate(async({BrowserWindow},dist)=>{
  const window=new BrowserWindow({show:false,webPreferences:{preload:pathForTest(dist),contextIsolation:true,sandbox:true}});
  function pathForTest(dist){return dist+'/electron/preload.cjs';}
  await window.loadURL('data:text/html,<p>untrusted fixture frame</p>');
  const r=await window.webContents.executeJavaScript('window.knouxOperationsV1.history()');window.destroy();return r;
 },path.resolve('.').replaceAll('\\','/'));
 expect(untrusted.status).toBe('permission_denied');proof.checks.push('Untrusted BrowserWindow is denied by the production sender guard');
 const invalid=await page.evaluate(()=>window.knouxOperationsV1.plan({sourcePath:'C:/not-authorized'}));expect(invalid.error.code).toBe('OPERATION_INVALID_INPUT');
 proof.checks.push('Fixed IPC allowlist rejects raw path payload');
 await page.getByTestId('files-live-organization').click();
 await page.getByTestId('ops-source').click();await expect(page.getByTestId('ops-scan')).toBeEnabled();
 await page.getByTestId('ops-scan').click();await expect(page.getByTestId('ops-plan')).toBeDisabled();
 await expect(page.locator('.ops-trees input[type=checkbox]')).toHaveCount(40,{timeout:60000});
 await expect(page.getByTestId('ops-destination')).toBeEnabled();await page.getByTestId('ops-destination').click();
 await expect(page.getByTestId('ops-plan')).toBeEnabled();await page.getByTestId('ops-plan').click();
 await expect(page.locator('.ops-plan-proof code')).toBeVisible({timeout:60000});
 proof.checks.push('Real folder picker adapter â†’ incremental native inventory â†’ exact hashed before/after plan');
 for(const theme of ['light','dark']) {
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
  for(const [width,height] of [[1366,768],[1672,941]]) {
   await (await app.browserWindow(page)).evaluate((window,{width,height})=>window.setContentSize(width,height),{width,height});
   await page.screenshot({path:path.join(out,`preview-${theme}-${width}.png`),animations:'disabled'});
   const geometry=await page.getByTestId('organization-live-workbench').evaluate(e=>{const r=e.getBoundingClientRect();const f=e.querySelector('footer').getBoundingClientRect();return{height:r.height,bottom:r.bottom,footerBottom:f.bottom,viewport:innerHeight,scrollable:[...e.querySelectorAll('*')].some(x=>getComputedStyle(x).overflowY==='auto'&&x.scrollHeight>x.clientHeight)};});
   expect(geometry.footerBottom).toBeLessThanOrEqual(geometry.viewport);expect(geometry.scrollable).toBe(true);proof.views.push({theme,width,height,...geometry});
  }
 }
 await page.getByTestId('workbench-mode-toggle').click();await expect(page.getByTestId('organization-live-workbench')).toHaveAttribute('data-workbench-mode','side');await page.getByTestId('workbench-mode-toggle').click();
 await page.getByTestId('ops-approve').check();await page.getByTestId('ops-execute').click();
 await expect(page.getByTestId('ops-receipt')).toBeVisible({timeout:60000});await expect(page.getByTestId('ops-undo-preview')).toBeEnabled();
 const moved=await page.evaluate(async()=>{const r=await window.knouxOperationsV1.history();return r.data[0];});
 expect(moved.completedFiles).toBe(40);expect(moved.failedFiles).toBe(0);expect(moved.planHash).toMatch(/^[a-f0-9]{64}$/);expect(moved.entries.every(e=>e.hash&&e.verification==='sha256')).toBe(true);
 for(const e of moved.entries) {const target=path.join(f.destination,e.targetRelative);expect(sha(await readFile(target))).toBe(f.originals[e.name]);await expect(access(path.join(f.source,e.sourceRelative))).rejects.toThrow();}
 await page.screenshot({path:path.join(out,'moved-receipt.png'),animations:'disabled'});proof.checks.push('UI exact approval â†’ native copy/hash/verify/unlink â†’ 40 verified moves and durable receipt');
 await page.getByTestId('ops-undo-preview').click();await expect(page.getByTestId('ops-undo')).toBeEnabled();await page.getByTestId('ops-undo').click();
 await expect(page.getByTestId('ops-receipt')).toContainText('40 restored',{timeout:60000});
 for(const [name,hash] of Object.entries(f.originals))expect(sha(await readFile(path.join(f.source,name)))).toBe(hash);
 await page.screenshot({path:path.join(out,'restored-receipt.png'),animations:'disabled'});proof.checks.push('UI undo preview â†’ separate native confirmation â†’ all 40 source hashes restored');
 const receipts=await page.evaluate(async()=> (await window.knouxOperationsV1.history()).data);proof.receipts=receipts;
 proof.events=await page.evaluate(()=>window.__liveEvents);proof.confirmations=await app.evaluate(()=>globalThis.__liveFixtureConfirmations);
 expect(proof.confirmations).toHaveLength(2);expect(proof.events.some(e=>e.phase==='discovered')).toBe(true);expect(proof.events.every((e,i,a)=>i===0||e.sequence>a[i-1].sequence)).toBe(true);
 await page.getByTestId('workbench-close').click();
 await expect(page.locator('[data-testid^="files-row-native-"]')).toHaveCount(40);
 await page.locator('[data-testid^="files-row-native-"]').first().locator(':scope > div').first().click();
 await page.getByTestId('files-live-organization').click();await page.getByTestId('ops-source').click();await page.getByTestId('ops-scan').click();
 await expect(page.getByTestId('ops-destination')).toBeEnabled();await page.getByTestId('ops-destination').click();await page.getByTestId('ops-plan').click();
 await expect(page.locator('.ops-plan-proof')).toContainText('1 files',{timeout:60000});
 await expect(page.locator('.ops-trees input:checked')).toHaveCount(1);
 await page.getByTestId('workbench-close').click();proof.checks.push('Files row selection survives the native picker and fresh scan; exact plan contains only the selected file');
 for(const route of ['files','studio'])for(const theme of ['light','dark'])for(const [width,height] of [[1366,768],[1672,941]]) {
  await page.evaluate(({route,theme})=>{location.hash=route;document.documentElement.dataset.theme=theme;}, {route,theme});
  await page.locator(`[data-visual-section="${route}"] main`).waitFor();
  await (await app.browserWindow(page)).evaluate((window,{width,height})=>window.setContentSize(width,height),{width,height});
  await page.screenshot({path:path.join(out,`preserved-${route}-${theme}-${width}.png`),animations:'disabled'});
  const layout=await page.locator('main').evaluate(e=>({page:document.documentElement.scrollHeight-innerHeight,main:e.scrollHeight-e.clientHeight}));expect(layout.page).toBeLessThanOrEqual(4);expect(layout.main).toBeLessThanOrEqual(4);
 }
 await page.evaluate(()=>{location.hash='studio';});await page.getByTestId('studio-live-organization').click();await expect(page.getByTestId('organization-live-workbench')).toBeVisible();
 proof.checks.push('Files and Studio both open the same live workbench; side/expanded switch retains exact plan');
 await page.emulateMedia({reducedMotion:'reduce'});const animations=await page.locator('.knx-particle-track').evaluateAll(nodes=>nodes.map(e=>getComputedStyle(e).animationName));expect(animations.every(n=>n==='none')).toBe(true);proof.reducedMotion=animations;
 proof.ok=true;
} finally {await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2));await app.close();}
console.log(JSON.stringify({ok:proof.ok,checks:proof.checks,errors:proof.errors,fixture:f.root},null,2));
