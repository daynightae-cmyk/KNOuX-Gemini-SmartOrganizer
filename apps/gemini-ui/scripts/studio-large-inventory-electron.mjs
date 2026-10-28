import {_electron as electron,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url),{fixture}=require('./live-organization-fixtures.cjs');
const out=path.resolve(process.env.KNOUX_STUDIO_STRESS_DIR||'../../docs/evidence/studio-domain/stress');await mkdir(out,{recursive:true});
const counts=process.env.KNOUX_STUDIO_STRESS_COUNTS?process.env.KNOUX_STUDIO_STRESS_COUNTS.split(',').map(Number):[0,600,10001];if(!counts.length||counts.some(n=>![0,600,10001].includes(n)))throw Error('Only bounded acceptance fixtures are allowed');
const proof={checks:[],cases:[],ownerDataTouched:false,errors:[],sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim()};
try{
 for(const count of counts){
  const f=await fixture(0),extensions=['png','mp4','txt','pdf','zip','mp3','js','bin'];
  const deep=path.join('deep','nested','source','folders');await mkdir(path.join(f.source,deep),{recursive:true});
  for(let i=0;i<count;i++){const name=`item-${String(i).padStart(5,'0')}.${extensions[i%8]}`;const relative=i===0?path.join(deep,'long-'+('n'.repeat(100))+'.txt'):name;await writeFile(path.join(f.source,relative),'Disposable measured inventory '+i);}
  const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
  const app=await electron.launch({executablePath:require('electron'),args:['--disable-gpu','--js-flags=--max-old-space-size=180',path.resolve('electron/main.cjs'),'--knoux-user-data='+f.profile],env,timeout:60000});let page;const result={count,fixture:f.root};
  try{
   await app.evaluate(({dialog},f)=>{dialog.showOpenDialog=async(_p,o)=>({canceled:false,filePaths:[o.title.includes('source')?f.source:f.destination]});dialog.showMessageBox=async()=>{throw Error('Mutation forbidden in inventory-only test');};},f);
   page=await app.firstWindow();page.on('pageerror',e=>proof.errors.push(e.message));await page.waitForLoadState('domcontentloaded');await page.evaluate(()=>{localStorage.setItem('knoux.cinematic.v1',JSON.stringify({seen:true,always:false,muted:true,reduced:true}));localStorage.setItem('knoux_locale','en');location.hash='studio';});await page.reload();
   await page.getByTestId('studio-service-select').selectOption('1');await page.getByTestId('ops-source').click();const start=Date.now();await page.getByTestId('ops-scan').click();await expect(page.getByTestId('ops-result-count')).toContainText(count.toLocaleString()+' / '+count.toLocaleString(),{timeout:180000});result.scanMs=Date.now()-start;
   const mounted=await page.getByTestId('ops-file-card').count();result.mountedCards=mounted;expect(mounted).toBeLessThan(100);
   await page.getByTestId('ops-destination').click();
   if(!count){await expect(page.getByTestId('ops-plan')).toBeDisabled();proof.checks.push('Empty Native inventory reports zero; no fabricated content or executable plan');}
   else{
    await page.getByTestId('ops-file-search').fill('long-');await expect(page.getByTestId('ops-file-card')).toHaveCount(1);await page.getByTestId('ops-file-card').locator('input').uncheck();await page.getByTestId('ops-file-search').fill('');await page.getByTestId('ops-file-sort').selectOption('size');await expect(page.getByTestId('ops-result-count')).toContainText((count-1).toLocaleString()+' selected');
    await page.getByTestId('ops-file-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);await page.waitForTimeout(100);expect(await page.getByTestId('ops-file-card').count()).toBeLessThan(100);
    await page.getByTestId('ops-select-all').click();if(count>10000){await expect(page.getByTestId('ops-plan')).toBeDisabled();expect(await page.getByTestId('ops-plan').getAttribute('title')).toContain('10,000');await page.getByTestId('ops-select-none').click();await page.getByTestId('ops-file-search').fill('long-');await page.getByTestId('ops-file-card').locator('input').check();}
    const plannedCount=count>10000?1:count;const planStart=Date.now();await page.getByTestId('ops-plan').click();await expect(page.locator('.ops-plan-proof')).toContainText(plannedCount+' files',{timeout:180000});result.planMs=Date.now()-planStart;
    await page.getByTestId('ops-before-after').locator('.os-hierarchy').nth(1).getByRole('button',{name:'Expand',exact:true}).click();expect(await page.getByTestId('ops-before-after').locator('.os-tree-row').count()).toBeLessThan(120);
    await page.getByTestId('ops-select-none').click();await expect(page.getByTestId('ops-plan')).toBeDisabled();await expect(page.getByTestId('ops-approve')).toBeDisabled();
    await page.getByTestId('studio-service-select').selectOption('2');await page.getByTestId('ops-file-search').fill('long-');await page.getByTestId('ops-file-card').locator('input').check();await expect(page.getByTestId('ops-plan')).toBeEnabled();
    proof.checks.push(`${count} Native files: bounded DOM; deep/long paths; search/sort selection persistence; exact Native plan within the independent 10,000-file bound; empty-selection refusal`);
   }
   await page.screenshot({path:path.join(out,`inventory-${count}.png`),animations:'disabled'});result.ok=true;
  }finally{if(page&&!result.ok)await page.screenshot({path:path.join(out,`failure-${count}.png`)}).catch(()=>{});proof.cases.push(result);await app.close();}
 }
 expect(proof.errors).toEqual([]);proof.ok=true;
}finally{await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2));}
console.log(JSON.stringify(proof,null,2));
