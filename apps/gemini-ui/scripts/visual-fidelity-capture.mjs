/** Read-only route capture in a disposable Electron profile. No owner-folder grants. */
import { _electron as electron } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const arg = (key, fallback) => process.argv.find(x => x.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
const out = path.resolve(arg('out', '../../docs/evidence/visual-fidelity-handoff-20261102/baseline'));
// Fail closed instead of deleting or replacing previous evidence.
await mkdir(out, { recursive: false });
const sections = arg('sections', 'studio,home,workspace,startup,smart_scan,applications,services,system,repair,automation,files,storage,cleanup,settings').split(',');
const themes = arg('themes', 'day').split(',');
const locales = arg('locales', 'en').split(',');
const sizes = arg('sizes', '1672x941').split(',').map(s => s.split('x').map(Number));
const assertUnified = arg('assert-unified', 'false') === 'true';
const profile = await mkdtemp(path.join(os.tmpdir(), 'knoux-visual-fidelity-'));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const errors = [], consoleErrors = [], failedRequests = [], frames = [];
const app = await electron.launch({ executablePath: require('electron'), args: [path.resolve('electron/main.cjs'), '--disable-gpu', `--knoux-user-data=${profile}`], env, timeout: 60000 });
try {
  const page = await app.firstWindow();
  const captureWindow = await app.browserWindow(page);
  await captureWindow.evaluate(w=>{
    // The owner's desktop remains interactive behind this disposable capture
    // window. Native pointer input must not navigate, drag or snap our evidence.
    w.setIgnoreMouseEvents(true); w.setFocusable(false); w.setSkipTaskbar(true);
  });
  page.on('pageerror', e => errors.push({ route: page.url().split('#')[1], message: e.message }));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push({ route: page.url().split('#')[1], message: m.text().slice(0, 400) }); });
  page.on('requestfailed', r => failedRequests.push({ route: page.url().split('#')[1], url: r.url().split('?')[0], error: r.failure()?.errorText }));
  page.on('response', r => { if (r.status() >= 400) failedRequests.push({ route: page.url().split('#')[1], url: r.url().split('?')[0], status: r.status() }); });
  const roots = { studio: 'studio-workspace', home: 'home-workspace', workspace: 'workspace-hub', startup: 'startup-workspace', smart_scan: 'scan-workspace', applications: 'apps-workspace', services: 'services-workspace', system: 'system-workspace', repair: 'repair-workspace', automation: 'automation-workspace', files: 'files-workspace', storage: 'storage-workspace', cleanup: 'cleanup-workspace', settings: 'settings-root' };
  const selector = '[data-knx-hero], .home-hero, .knx-files-header, .knx-settings-hero, .approved-hero, .knx-command-hero, .sys-hero, .apps-hero, .cln-hero, .stp-hero, .svc-hero, .rep-hero, .auto-hero, .scan-hero, .knx-storage-hero, .atl-hero, .knx-workspace-hero, .osa-hero, .os-focus-header';
  for (const [width, height] of sizes) for (const locale of locales) for (const theme of themes) for (const section of sections) {
    const label = `${section}-${theme}-${locale}-${width}x${height}`;
    try {
      await page.evaluate(({ locale, theme, section }) => {
        localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
        localStorage.setItem('knoux_locale', locale);
        localStorage.setItem('knoux_theme_preference', theme === 'day' ? 'light' : 'dark');
        localStorage.setItem('knoux_theme', theme === 'day' ? 'light' : 'dark');
        location.hash = section;
      }, { locale, theme, section });
      await page.reload({ waitUntil: 'domcontentloaded' });
      const win = await app.browserWindow(page);
      const forceSize = async () => {
        await win.evaluate(async (w, [width, height]) => {
          if (w.isMaximized()) { w.unmaximize(); await new Promise(r=>setTimeout(r,400)); }
          if (w.isFullScreen()) w.setFullScreen(false);
          // Leave Windows snap regions, as the repository's native smoke does.
          w.setBounds({x:40,y:40,width,height},false);
          w.setContentSize(width,height,false);
        }, [width, height]);
        await page.waitForFunction(([w,h])=>innerWidth===w&&innerHeight===h,[width,height],{timeout:8000});
      };
      await forceSize();
      await page.waitForFunction(([width, height]) => innerWidth === width && innerHeight === height, [width, height], { timeout: 8000 });
      await page.getByTestId(roots[section]).waitFor({ timeout: 30000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1800);
      await page.keyboard.press('Escape');
      await page.waitForFunction(s=>document.querySelector('.visual-sprint')?.getAttribute('data-visual-section')===s,section,{timeout:8000});
      // Windows may asynchronously finish a snap/unmaximize operation after a
      // transient size match. Recheck at the actual measurement boundary.
      if (!await page.evaluate(([w,h])=>innerWidth===w&&innerHeight===h,[width,height])) { await forceSize(); await page.waitForTimeout(500); }
      const state = await page.evaluate(selector => {
        const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
        const visible = el => { const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 && el.checkVisibility({ visibilityProperty: true, opacityProperty: true }); };
        const heroes = [...document.querySelectorAll(selector)].filter(visible);
        const hero = [...document.querySelectorAll('[data-knx-hero]')].find(visible) ?? heroes[0];
        const controls = hero ? [...hero.querySelectorAll('button, input, select, summary, a')].filter(visible).map(el => {
          const r = el.getBoundingClientRect(); const x = r.x + r.width / 2, y = r.y + r.height / 2;
          const hit = document.elementFromPoint(x, y);
          return { label: (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || el.getAttribute('placeholder') || '').trim().slice(0, 70), rect: box(el), disabled: el.disabled === true, centerReachable: !!hit && (hit === el || el.contains(hit)), belowHero: r.bottom > hero.getBoundingClientRect().bottom + 1 };
        }) : [];
        const scrolls = [...document.querySelectorAll('main, section, [class]')].filter(el => {
          const cs = getComputedStyle(el), r = el.getBoundingClientRect();
          return r.width > 300 && r.height > 100 && el.scrollHeight > el.clientHeight + 10 && /auto|scroll/.test(cs.overflowY);
        });
        const filesWorkspace = document.querySelector('[data-testid="files-workspace"]');
        const filesGeometry = filesWorkspace ? {
          workspace: box(filesWorkspace), clientHeight: filesWorkspace.clientHeight, scrollHeight: filesWorkspace.scrollHeight,
          outerTools: box(document.querySelector('.knx-files-header')),
          results: box(document.querySelector('[data-testid="files-results-scroll"]')),
          search: box(document.querySelector('[data-testid="files-search"]')),
          footer: box(document.querySelector('[data-testid="files-footer"]')),
        } : null;
        const unifiedContent = box(document.querySelector('[data-testid="unified-content"]'));
        const scene = document.querySelector('[data-scene-artwork]');
        const chrome = document.querySelector('[data-testid="unified-shell-chrome"]');
        const rail = document.querySelector('[data-testid="unified-shell-navigation"]');
        return { theme: document.documentElement.dataset.theme === 'light' ? 'day' : 'night', dir: document.documentElement.dir, route: document.querySelector('.visual-sprint')?.dataset.visualSection, viewport: { width: innerWidth, height: innerHeight }, header: box(document.querySelector('.approved-header, .knoux-titlebar, header')), hero: box(hero), heroCount: heroes.length, heroClass: hero?.className, heroScrollHeight: hero?.scrollHeight, heroClientHeight: hero?.clientHeight, controls, filesGeometry, unified: { content: unifiedContent, scene: scene?.getAttribute('data-scene-artwork'), sceneKind:scene?.getAttribute('data-art-kind'), sceneReady:scene instanceof HTMLImageElement ? scene.complete&&scene.naturalWidth>0 : false, sceneCount: document.querySelectorAll('[data-scene-artwork]').length, liveOrbits: document.querySelectorAll('[data-testid="unified-live-orbit"] [data-live-hero-orbit]').length, chromeHeaders: chrome?.querySelectorAll('header').length, navigationRails: rail?.querySelectorAll('aside').length, particleSystems: document.querySelectorAll('[data-orbital-particles]').length }, horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), documentOverflow: Math.max(0, document.documentElement.scrollHeight - innerHeight), orbitCount: document.querySelectorAll('.knx-orbit, .knoux-orbit').length, pipelineCount: document.querySelectorAll('.knx-pipe').length, scrollRegions: scrolls.map(el => ({ class: el.className, rect: box(el), scrollHeight: el.scrollHeight, clientHeight: el.clientHeight })), headings: [...document.querySelectorAll('h1')].map(el => el.textContent.trim()) };
      }, selector);
      const screenshot = `${label}.png`;
      let captured=false;
      for(let attempt=0;attempt<3&&!captured;attempt++){
        try{await page.screenshot({path:path.join(out,screenshot),animations:'disabled',timeout:20000});captured=true;}
        catch(e){if(attempt===2)throw e;await forceSize();await page.waitForTimeout(400);}
      }
      if(!await page.evaluate(([w,h])=>innerWidth===w&&innerHeight===h,[width,height])) throw new Error('viewport changed while capturing; frame rejected');
      if(!await page.evaluate(s=>document.querySelector('.visual-sprint')?.getAttribute('data-visual-section')===s,section))throw new Error('route changed while capturing; frame rejected');
      const png=await readFile(path.join(out,screenshot));
      if(png.readUInt32BE(16)!==width||png.readUInt32BE(20)!==height)throw new Error('captured PNG dimensions do not match requested viewport');
      // Viewport capture remains the layout authority; hero capture only crops it.
      if (state.hero && state.hero.w > 0 && state.hero.h > 0 && state.hero.x >= 0 && state.hero.y >= 0 && state.hero.x + state.hero.w <= width && state.hero.y + state.hero.h <= height) {
        await page.screenshot({ path: path.join(out, `${label}-hero.png`), clip: { x: state.hero.x, y: state.hero.y, width: state.hero.w, height: state.hero.h }, animations: 'disabled' });
      }
      // Capture lower content without changing any application data.
      if (state.scrollRegions.length) {
        await page.evaluate(() => { for (const el of document.querySelectorAll('main, section, [class]')) { const cs = getComputedStyle(el), r = el.getBoundingClientRect(); if (r.width > 300 && r.height > 100 && /auto|scroll/.test(cs.overflowY)) el.scrollTop = el.scrollHeight; } });
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(out, `${label}-body-end.png`), animations: 'disabled' });
      }
      const ok = state.theme === theme && state.dir === (locale === 'ar' ? 'rtl' : 'ltr') && state.route === section;
      frames.push({ label, section, theme, locale, width, height, ok, screenshot, state });
      console.log(`${label} captured hero=${Math.round(state.hero?.w ?? 0)}x${Math.round(state.hero?.h ?? 0)} overflow=${state.horizontalOverflow} controlsBelow=${state.controls.filter(c => c.belowHero).length}`);
    } catch (e) {
      await page.screenshot({ path: path.join(out, `${label}-failure.png`), animations: 'disabled' }).catch(() => {});
      frames.push({ label, section, theme, locale, width, height, ok: false, error: String(e.message).slice(0, 400) });
      console.log(`${label} ERROR ${e.message.split('\n')[0]}`);
    }
  }
} finally {
  await app.close();
  const geometryErrors = [], groups = new Map();
  if (assertUnified) for (const f of frames) {
    const s = f.state, u = s?.unified, h = s?.hero, c = u?.content;
    if (!h || !c) { geometryErrors.push(`${f.label}: missing shared geometry`); continue; }
    if(s.viewport.width!==f.width||s.viewport.height!==f.height)geometryErrors.push(`${f.label}: viewport does not match label`);
    const key = `${f.width}x${f.height}/${f.theme}/${f.locale}`;
    const normalized = {x:h.x-c.x,y:h.y-c.y,w:h.w,h:h.h};
    if (!groups.has(key)) groups.set(key, normalized);
    const first = groups.get(key);
    for (const k of ['x','y','w','h']) if (Math.abs(normalized[k]-first[k]) > 2) geometryErrors.push(`${f.label}: ${k} differs by ${Math.abs(normalized[k]-first[k])}px`);
    if(u.sceneKind!=='bitmap'||!u.sceneReady)geometryErrors.push(`${f.label}: bitmap scene missing or undecoded`);
    if (u.scene !== f.section || u.sceneCount !== 1) geometryErrors.push(`${f.label}: incorrect artwork mapping`);
    if (u.liveOrbits !== 1 || u.chromeHeaders !== 1 || u.navigationRails !== 1 || u.particleSystems !== 1) geometryErrors.push(`${f.label}: shell/orbit duplication or missing mount ${JSON.stringify(u)}`);
    if (s.horizontalOverflow || s.documentOverflow) geometryErrors.push(`${f.label}: document overflow`);
    for (const control of s.controls.filter(x => !x.disabled)) if (!control.centerReachable) geometryErrors.push(`${f.label}: unreachable header control ${control.label}`);
  }
  const proof = { capturedAt: new Date().toISOString(), head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), profile, runtime: 'production dist in isolated Electron Main + Preload + Renderer; current dirty sources built before capture', frames, errors, consoleErrors, failedRequests, runtimeOk: frames.every(f => f.ok) && errors.length === 0, unifiedGeometryChecked:assertUnified, geometryTolerance:2, geometryErrors, unifiedGeometryOk:assertUnified ? geometryErrors.length===0 : null, geometryGroups:Object.fromEntries(groups), visualFidelityAccepted: false };
  await writeFile(path.join(out, 'proof.json'), JSON.stringify(proof, null, 2));
  console.log(`runtimeOk=${proof.runtimeOk}; visualFidelityAccepted=false`);
  if (!proof.runtimeOk || geometryErrors.length) process.exitCode = 1;
}
