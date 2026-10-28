import { _electron as electron, expect } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const base=path.resolve('../../docs/evidence/shared-orbit');
const previous=JSON.parse(await readFile(path.join(base,'packaged-home/proof.json'),'utf8'));
const out=path.join(base,'owner-gallery');await mkdir(out,{recursive:true});
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:process.env.KNOUX_ORBIT_PACKAGED_EXE,args:['--disable-gpu','--disable-features=CalculateNativeWinOcclusion','--knoux-user-data='+previous.profile],env,timeout:60000});
const proof={sourceCommit:previous.sourceCommit,packaged:true,captures:[],errors:[],note:'Read-only machine providers; organization activity from disposable move/restore fixture.'};
try{
 const page=await app.firstWindow(),win=await app.browserWindow(page);page.on('pageerror',e=>proof.errors.push(e.message));
 const initial=page.url();
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>{localStorage.setItem('knoux_theme',theme);localStorage.setItem('knoux_locale','en');localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));},theme);
  await page.goto(initial.split('?')[0].split('#')[0]+'#home');await page.reload();
  await expect(page.getByTestId('home-live-status')).not.toHaveAttribute('data-status','loading',{timeout:60000});
  await win.evaluate(w=>{w.unmaximize();w.setContentSize(1672,941);w.show();w.moveTop();});
  await expect.poll(()=>page.evaluate(()=>[innerWidth,innerHeight])).toEqual([1672,941]);
  await page.evaluate(async()=>{document.activeElement?.blur();for(const e of document.querySelectorAll('*'))if(e.scrollTop)e.scrollTop=0;await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  await page.waitForTimeout(200);
  let png=await win.evaluate(async w=>{const i=await w.webContents.capturePage();return {size:i.getSize(),png:i.toPNG().toString('base64')};});expect(png.size).toEqual({width:1672,height:941});
  await writeFile(path.join(out,'home-'+theme+'.png'),Buffer.from(png.png,'base64'));proof.captures.push({section:'home',theme,...png.size});
  await page.evaluate(()=>window.dispatchEvent(new Event('knoux:replay-entry')));
  await expect(page.locator('.cinematic-boundary')).toHaveAttribute('data-phase','READY');
  await page.waitForTimeout(200);png=await win.evaluate(async w=>{const i=await w.webContents.capturePage();return {size:i.getSize(),png:i.toPNG().toString('base64')};});
  expect(png.size).toEqual({width:1672,height:941});await writeFile(path.join(out,'intro-'+theme+'.png'),Buffer.from(png.png,'base64'));proof.captures.push({section:'intro',theme,...png.size});
  await page.getByRole('button',{name:theme==='light'?'Enter Workspace':'Skip',exact:true}).click();await expect(page.locator('.cinematic-boundary')).toHaveAttribute('data-phase','ACTIVE');
 }
 expect(proof.errors).toEqual([]);proof.ok=true;
}finally{await writeFile(path.join(out,'capture-proof.json'),JSON.stringify(proof,null,2));await app.close();}
console.log(JSON.stringify(proof,null,2));
