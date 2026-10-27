import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const repo = path.resolve(import.meta.dirname, '../../..');
const out = path.join(repo, 'docs/evidence/visual-fidelity-20261027');
const refs = path.join(repo, 'missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/references');
await mkdir(out, { recursive: true });
const names = {
  home: '00_home-command-center', smart_scan: '03_smart-scan', applications: '04_applications',
  storage: '05_storage', cleanup: '06_cleanup', startup: '07_startup', system: '08_system',
  repair: '09_repair', services: '10_services',
};
const dataUri = async file => `data:image/png;base64,${(await readFile(file)).toString('base64')}`;
const browser = await chromium.launch({ ...(existsSync(path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe')) ? { executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe') } : { channel: 'chrome' }), headless: true });
const page = await browser.newPage({ viewport: { width: 2400, height: 1180 } });
for (const group of [['home', 'repair', 'smart_scan'], ['applications', 'system', 'services'], ['storage', 'cleanup', 'startup']]) {
  const rows = [];
  for (const section of group) {
    const cells = [];
    for (const [theme, kind] of [['day', 'reference'], ['light', 'actual'], ['night', 'reference'], ['dark', 'actual']]) {
      const file = kind === 'reference' ? path.join(refs, theme, `${names[section]}.png`) : path.join(out, `${section}-${theme}-1672.png`);
      cells.push({ label: `${section} / ${theme.toUpperCase()} / ${kind}`, src: existsSync(file) ? await dataUri(file) : null });
    }
    rows.push(cells);
  }
  const html = `<!doctype html><html><head><style>
    *{box-sizing:border-box} body{margin:0;background:#0b1120;color:#f8fafc;font-family:Segoe UI,Arial,sans-serif}
    .grid{display:grid;grid-template-columns:repeat(4,600px);}
    .cell{width:600px;height:378px;padding:0 8px 8px;overflow:hidden}
    .label{height:38px;display:flex;align-items:center;padding:0 10px;font-size:19px;color:#e5e7ff}
    img{display:block;width:584px;height:330px;object-fit:cover;border:1px solid #263355;border-radius:4px;background:#111a2e}
    .missing{display:grid;place-items:center;width:584px;height:330px;border:1px dashed #44507a;border-radius:4px;color:#c4b5fd;font-size:20px;background:#111a2e}
  </style></head><body><div class="grid">${rows.flat().map(c => `<div class="cell"><div class="label">${c.label}</div>${c.src ? `<img src="${c.src}">` : '<div class="missing">REFERENCE NOT SUPPLIED</div>'}</div>`).join('')}</div></body></html>`;
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(out, `reference-fidelity-${group.join('-')}.png`), fullPage: true, animations: 'disabled' });
  console.log('board', group.join('-'));
}
await browser.close();
