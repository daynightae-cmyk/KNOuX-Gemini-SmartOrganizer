/** Focused visual-regression probes. All state is in a disposable profile. */
import { _electron as electron } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const base = path.resolve('../../docs/evidence/visual-fidelity-handoff-20261102');
const out = path.join(base, process.argv.find(a => a.startsWith('--out-name='))?.slice(11) ?? 'controls');
await mkdir(out, { recursive: false });
const profile = await mkdtemp(path.join(os.tmpdir(), 'knoux-fidelity-controls-'));
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({ executablePath: require('electron'), args: [path.resolve('electron/main.cjs'), '--disable-gpu', `--knoux-user-data=${profile}`], env, timeout: 60000 });
const results = [], errors = [];
try {
  const page = await app.firstWindow();
  page.on('pageerror', e => errors.push(e.message));
  async function open(section, locale = 'ar', width = 1366, height = 768) {
    await page.evaluate(({ section, locale }) => {
      localStorage.setItem('knoux.cinematic.v1', JSON.stringify({ seen: true, always: false, muted: true, reduced: true }));
      localStorage.setItem('knoux_locale', locale);
      localStorage.setItem('knoux_theme_preference', 'light'); localStorage.setItem('knoux_theme', 'light'); location.hash = section;
    }, { section, locale });
    await page.reload({ waitUntil: 'domcontentloaded' });
    const win = await app.browserWindow(page);
    await win.evaluate((w, [x, y]) => { if (w.isMaximized()) w.unmaximize(); w.setContentSize(x, y, false); }, [width, height]);
    await page.waitForFunction(([w, h]) => innerWidth === w && innerHeight === h, [width, height]);
    await page.waitForTimeout(1600); await page.keyboard.press('Escape');
  }
  async function check(name, fn) {
    try { const evidence = await fn(); results.push({ name, ok: true, evidence }); console.log(`${name} OK`); }
    catch (e) { results.push({ name, ok: false, error: e.message }); console.log(`${name} FAILED ${e.message}`); }
    await page.screenshot({ path: path.join(out, `${name}.png`), animations: 'disabled' });
  }
  for (const locale of ['en', 'ar']) await check(`files-search-scroll-${locale}-1366`, async () => {
    await open('files', locale);
    const search = page.getByTestId('files-search');
    await search.fill('Readme');
    const ledger = page.getByTestId('files-results-scroll');
    await page.waitForFunction(() => document.querySelector('[data-testid="files-results-scroll"]')?.textContent.includes('Readme.md'));
    assert.match(await ledger.innerText(), /Readme\.md/);
    assert.equal(await ledger.locator('[data-testid^="files-row-"]').count(), 1);
    await search.fill('');
    const last = ledger.locator('[data-testid^="files-row-"]').last();
    await last.click(); // Actual fixture selection callback; no file is opened.
    const evidence = await last.evaluate(el => {
      const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      const footer = document.querySelector('[data-testid="files-footer"]').getBoundingClientRect();
      const tools = document.querySelector('.knx-files-header').getBoundingClientRect();
      const rows = document.querySelector('[data-testid="files-results-scroll"]').getBoundingClientRect();
      return { finalRow: el.textContent.trim(), finalRowCenterReachable: !!hit && el.contains(hit), footer: { top: footer.top, bottom: footer.bottom }, resultsHeight: rows.height, toolsBottom: tools.bottom, resultsTop: rows.top, documentOverflow: document.documentElement.scrollHeight - innerHeight };
    });
    assert(evidence.finalRowCenterReachable, 'last row is covered');
    assert(evidence.resultsHeight > 0, 'result ledger collapsed');
    assert(evidence.resultsTop >= evidence.toolsBottom - 1, 'tools overlap table');
    assert(evidence.footer.bottom <= 768 && evidence.footer.top >= 0, 'footer is outside viewport');
    assert.equal(evidence.documentOverflow, 0);
    return { ...evidence, dataScope: 'explicitly labelled built-in fixture; no owner folder authorized or file opened' };
  });
  await check('cleanup-expand-scope-ar-1366', async () => {
    await open('cleanup');
    const details = page.locator('details:has(.cln-scan-strip)');
    const before = await details.evaluate(el => ({ open: el.open, controls: [...el.querySelectorAll('button,select')].map(c => ({ label: c.textContent.trim(), visible: c.checkVisibility({ visibilityProperty: true }) })) }));
    assert.equal(before.open, false);
    assert(before.controls.every(c => !c.visible), 'closed details reported a visible descendant');
    await details.locator('summary').click();
    const category = details.locator('button').first(); await category.click();
    const evidence = await details.evaluate(el => ({ open: el.open, visibleControls: [...el.querySelectorAll('button,select')].filter(c => c.checkVisibility({ visibilityProperty: true })).length }));
    assert(evidence.open && evidence.visibleControls > 0);
    return { before, after: evidence, dataScope: 'local category choice only; discovery/quarantine/delete never triggered' };
  });
  await check('automation-show-overview-ar-1366', async () => {
    await open('automation');
    assert(await page.getByTestId('automation-focus-ribbon').isVisible());
    await page.getByTestId('automation-show-overview').click();
    await page.getByTestId('automation-hero').waitFor({ state: 'visible' });
    return { overviewVisible: await page.getByTestId('automation-hero').isVisible(), reason: 'short viewport intentionally starts in focused editor mode; existing Show overview restores the hero', dataScope: 'local view preference only; workflow not executed' };
  });
  // Side-by-side evidence sheets. Both originals keep their own aspect ratios;
  // no image is stretched and no score implies pixel correspondence.
  const manifest = JSON.parse(await readFile(path.join(base, 'reference-manifest.json'), 'utf8'));
  const refs = manifest.references.filter(r => r.section !== 'settings-duplicate');
  for (let offset = 0; offset < refs.length; offset += 3) {
    const entries = await Promise.all(refs.slice(offset, offset + 3).map(async r => ({ section: r.section, reference: `data:image/png;base64,${(await readFile(path.join(base, 'references', `${r.section}.png`))).toString('base64')}`, runtime: `data:image/png;base64,${(await readFile(path.join(base, 'after-day-en', `${r.section}-day-en-1672x941.png`))).toString('base64')}` })));
    const data = await page.evaluate(async entries => {
      const canvas = document.createElement('canvas'); canvas.width = 1800; canvas.height = entries.length * 560;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#f4f0ff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const [i, row] of entries.entries()) {
        ctx.fillStyle = '#23184f'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(`${row.section} — OWNER REFERENCE 2172×724`, 18, i * 560 + 28); ctx.fillText('ACTUAL ELECTRON 1672×941 · NOT ACCEPTED', 915, i * 560 + 28);
        for (const [x, src] of [[18, row.reference], [915, row.runtime]]) { const im = new Image(); im.src = src; await im.decode(); ctx.drawImage(im, x, i * 560 + 45, 865, 865 * im.height / im.width); }
      }
      return canvas.toDataURL('image/png').split(',')[1];
    }, entries);
    await writeFile(path.join(out, `comparison-sheet-${1 + offset / 3}.png`), Buffer.from(data, 'base64'));
  }
} finally {
  await app.close();
  const proof = { profile, results, errors, ok: results.length === 4 && results.every(r => r.ok) && errors.length === 0, visualFidelityAccepted: false };
  await writeFile(path.join(out, 'proof.json'), JSON.stringify(proof, null, 2));
  if (!proof.ok) process.exitCode = 1;
}
