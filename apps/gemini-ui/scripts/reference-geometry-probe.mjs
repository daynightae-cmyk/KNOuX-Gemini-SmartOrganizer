/**
 * KNOuX — reference geometry probe.
 *
 * Turns an owner-approved reference picture into numbers instead of impressions.
 * The picture is decoded in the same Chromium that runs the app (no image
 * library is added to the project), painted to a canvas at its natural size, and
 * then read back as pixels:
 *
 *   - vertical / horizontal edge profiles, so column and band boundaries are
 *     measured rather than eyeballed;
 *   - a coarse palette grid, so a rebuild can be checked against the reference's
 *     own light distribution instead of a designer's memory of it;
 *   - the dominant background tone and the strongest accent, which is what tells
 *     a night rebuild whether it is still the same artwork.
 *
 * Usage:
 *   node scripts/reference-geometry-probe.mjs <reference.png> [out.json]
 */
import { _electron as electron } from '@playwright/test';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const require = createRequire(import.meta.url);
const [source, target] = process.argv.slice(2);
if (!source) {
  console.error('usage: node scripts/reference-geometry-probe.mjs <reference.png> [out.json]');
  process.exit(2);
}
const image = path.resolve(source);
const bytes = readFileSync(image);
const sha256 = createHash('sha256').update(bytes).digest('hex');
const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({
  executablePath: require('electron'),
  args: [path.resolve('electron/main.cjs'), '--disable-gpu'],
  env,
  timeout: 60_000,
});
const page = await app.firstWindow();
await page.waitForLoadState('domcontentloaded');

const report = await page.evaluate(
  async ({ dataUrl, name }) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(img, 0, 0);
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);

    const lumAt = (x, y) => {
      const i = (y * width + x) * 4;
      return (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    };
    const hex = (r, g, b) =>
      `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

    // Edge profiles: mean luminance per column / row, then the steepest steps.
    const columnMean = new Array(width).fill(0);
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (let y = 0; y < height; y += 4) sum += lumAt(x, y);
      columnMean[x] = sum / Math.ceil(height / 4);
    }
    const rowMean = new Array(height).fill(0);
    for (let y = 0; y < height; y += 1) {
      let sum = 0;
      for (let x = 0; x < width; x += 4) sum += lumAt(x, y);
      rowMean[y] = sum / Math.ceil(width / 4);
    }
    const steps = (profile, minDelta) => {
      const found = [];
      for (let i = 2; i < profile.length - 2; i += 1) {
        const delta = profile[i + 2] - profile[i - 2];
        if (Math.abs(delta) < minDelta) continue;
        if (found.length && i - found[found.length - 1].at < 12) {
          if (Math.abs(delta) > Math.abs(found[found.length - 1].delta)) found[found.length - 1] = { at: i, delta };
        } else found.push({ at: i, delta });
      }
      return found.map((edge) => ({ position: edge.at, delta: Number(edge.delta.toFixed(3)) }));
    };

    // Coarse palette grid, so the rebuild can be compared region by region.
    const gridX = 8;
    const gridY = 6;
    const cells = [];
    for (let gy = 0; gy < gridY; gy += 1) {
      for (let gx = 0; gx < gridX; gx += 1) {
        const x0 = Math.floor((gx * width) / gridX);
        const x1 = Math.floor(((gx + 1) * width) / gridX);
        const y0 = Math.floor((gy * height) / gridY);
        const y1 = Math.floor(((gy + 1) * height) / gridY);
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let y = y0; y < y1; y += 3) {
          for (let x = x0; x < x1; x += 3) {
            const i = (y * width + x) * 4;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            n += 1;
          }
        }
        cells.push({
          cell: `${gx}:${gy}`,
          box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
          color: hex(r / n, g / n, b / n),
          luminance: Number((((r / n) * 0.2126 + (g / n) * 0.7152 + (b / n) * 0.0722) / 255).toFixed(3)),
        });
      }
    }

    // Saturation scan: the reference's own accent, measured rather than assumed.
    let strongest = { saturation: 0, color: '#000000' };
    const counts = new Map();
    for (let y = 0; y < height; y += 5) {
      for (let x = 0; x < width; x += 5) {
        const i = (y * width + x) * 4;
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        if (saturation > 0.35 && max > 0.25) {
          const key = hex(data[i], data[i + 1], data[i + 2]);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        if (saturation > strongest.saturation) strongest = { saturation, color: hex(data[i], data[i + 1], data[i + 2]) };
      }
    }
    const topAccents = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

    return {
      name,
      natural: { width, height },
      meanLuminance: Number((rowMean.reduce((a, c) => a + c, 0) / rowMean.length).toFixed(4)),
      verticalEdges: steps(columnMean, 0.05).slice(0, 24),
      horizontalEdges: steps(rowMean, 0.05).slice(0, 24),
      paletteGrid: cells,
      strongestAccent: { color: strongest.color, saturation: Number(strongest.saturation.toFixed(3)) },
      topAccents,
    };
  },
  { dataUrl, name: path.basename(image) },
);

await app.close();
const out = target ? path.resolve(target) : path.join('..', '..', 'docs', 'evidence', 'reference-geometry', `${path.basename(image, '.png')}.json`);
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ probedAt: new Date().toISOString(), source: image, sha256, ...report }, null, 2));
console.log(
  `${report.name} ${report.natural.width}x${report.natural.height} meanL=${report.meanLuminance} ` +
    `vEdges=${report.verticalEdges.length} hEdges=${report.horizontalEdges.length} accent=${report.strongestAccent.color} -> ${out}`,
);
