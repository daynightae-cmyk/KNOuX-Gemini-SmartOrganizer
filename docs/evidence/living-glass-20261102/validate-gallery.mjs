import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(path.resolve(base,'../../../apps/gemini-ui/package.json'));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});
const results=[],errors=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(base,'index.html')).href);
 const sections=await page.locator('#section option').evaluateAll(es=>es.map(e=>e.value));
 const scenarios=await page.locator('#scenario option').evaluateAll(es=>es.map(e=>e.value));
 for(const scenario of scenarios)for(const section of sections){
  await page.selectOption('#scenario',scenario);await page.selectOption('#section',section);
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  results.push({scenario,section,loadedImages:await page.locator('img').count()});
 }
 assert.equal(results.length,56);assert.deepEqual(errors,[]);
}finally{await browser.close();await writeFile(path.join(base,'gallery-validation.json'),JSON.stringify({ok:results.length===56&&errors.length===0,results,errors},null,2))}
console.log('56 gallery selections loaded: references, actual hero/full/end views and motion frames.');
