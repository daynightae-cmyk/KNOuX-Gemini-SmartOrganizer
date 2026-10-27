import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const phase = process.argv[2] || 'after';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = '1';
const folder = path.resolve('../../docs/evidence/files-owner-pilot', phase);
await mkdir(folder, { recursive: true });
const cached = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
const browser = await chromium.launch({ ...(existsSync(cached) ? { executablePath: cached } : { channel: 'chrome' }), headless: true });
const rows = [];
try {
  for (const theme of ['light', 'dark']) for (const locale of (process.env.KNOX_QUICK || phase === 'before' ? ['en'] : ['en', 'ar'])) for (const [physicalWidth, physicalHeight, zoom] of (process.env.KNOX_QUICK ? [[1672,941,1]] : phase === 'before' ? [[1366,768,1],[1672,941,1]] : [[1366,768,1],[1672,941,1],[1920,1080,1],[1672,941,1.25],[1920,1080,1.5]])) {
    // Browser zoom reduces the CSS viewport and increases pixel density. CSS
    // zoom on html alone leaves vw/vh unadjusted and is not equivalent.
    const width = Math.round(physicalWidth / zoom), height = Math.round(physicalHeight / zoom);
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: zoom, reducedMotion: 'reduce' });
    await page.addInitScript(({theme,locale}) => {
      localStorage.setItem('knoux_theme', theme);
      localStorage.setItem('knoux_locale', locale);
      localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
    }, {theme,locale});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${process.env.KNOX_PREVIEW_PORT || '3029'}/#files`, {waitUntil:'domcontentloaded'});
    await page.locator('[data-testid="files-workspace"]').waitFor();
    await page.waitForTimeout(350);
    const geometry = await page.evaluate(() => {
      const selectors = ['html','body','#root','.visual-sprint','[data-testid="files-workspace"]','.knx-files-header','.knx-files-heading','.knx-files-orbit','.knx-files-results','.knx-files-inspector','[data-testid="files-footer"]','[data-testid="files-search"]','[data-testid="files-plan-cta"]','.knx-files-intro','.knx-files-metrics'];
      const rect = e => { const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right}; };
      return {
        viewport: {width:innerWidth,height:innerHeight},
        elements: selectors.map(selector => { const e=document.querySelector(selector) || (selector === '.knx-files-results' ? document.querySelector('.knx-files-split > div:first-child') : null); return e ? {selector, ...rect(e),clientHeight:e.clientHeight,scrollHeight:e.scrollHeight,overflowY:getComputedStyle(e).overflowY} : {selector,missing:true}; }),
        orbit: [...document.querySelectorAll('.knx-files-orbit button')].map(e => { const label=e.querySelector('.knx-orbit-label') || e.querySelector('strong'); const r=label.getBoundingClientRect(); const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); return {text:e.textContent,...rect(e),labelVisible:!!hit && e.contains(hit)}; }),
        scrollers: [...document.querySelectorAll('main *')].filter(e => e.scrollHeight > e.clientHeight+4 && ['auto','scroll'].includes(getComputedStyle(e).overflowY)).map(e => ({class:e.className,...rect(e),clientHeight:e.clientHeight,scrollHeight:e.scrollHeight})),
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth+4,
      };
    });
    const failures = [];
    for (const e of geometry.elements.slice(0,5)) if (e.scrollHeight > e.clientHeight+4) failures.push(`outer scroll: ${e.selector} ${e.scrollHeight-e.clientHeight}px`);
    for (const selector of ['.knx-files-heading','.knx-files-results','[data-testid="files-footer"]','[data-testid="files-search"]','[data-testid="files-plan-cta"]']) {
      const e = geometry.elements.find(e=>e.selector===selector);
      if (e.missing || e.y < -4 || e.bottom > height+4 || e.right > width+4 || e.w < 10 || e.h < 10) failures.push(`primary block out of viewport: ${selector}`);
    }
    if (geometry.orbit.length !== 7 || geometry.orbit.some(e=>e.y<0 || e.bottom>height || e.x<0 || e.right>width)) failures.push('orbital controls absent or outside viewport');
    if (geometry.orbit.some(e=>!e.labelVisible)) failures.push('orbital label covered or clipped');
    const intro=geometry.elements.find(e=>e.selector==='.knx-files-intro'), metrics=geometry.elements.find(e=>e.selector==='.knx-files-metrics');
    if (!intro.missing && !metrics.missing && intro.bottom > metrics.y+4) failures.push('intro overlaps metric band');
    if (geometry.horizontalOverflow) failures.push('horizontal page overflow');
    failures.push(...errors);
    const tag = `${theme}-${locale}-${width}x${height}-z${zoom}`;
    await page.screenshot({ path:path.join(folder,`${tag}.png`), animations:'disabled' });
    rows.push({theme,locale,width,height,physicalWidth,physicalHeight,zoom,geometry,failures});
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(path.join(folder,'geometry.json'),JSON.stringify(rows,null,2));
console.log(JSON.stringify({phase,rows:rows.length,failed:rows.filter(row=>row.failures.length).map(({geometry,...row})=>row)},null,2));
if (phase !== 'before' && rows.some(r=>r.failures.length)) process.exitCode=1;
