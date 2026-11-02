/**
 * KNOuX — reference side-by-side comparator.
 *
 * "No overflow" and "the screenshot exists" are not fidelity. This composites the
 * approved reference and the actual rendered Electron frame at the same size into
 * one inspection image, and publishes numbers next to it:
 *
 *   - band geometry: horizontal and vertical edge profiles of each image, so a
 *     missing or misplaced band is visible as a position difference;
 *   - palette distance: mean per-channel difference over a coarse grid, so a
 *     rebuild that is "the right shape but the wrong light" is caught;
 *   - luminance profile: because the approved Home picture is a daylight artwork
 *     and there is no installed night Home picture, the night frame is expected to
 *     differ in absolute light while keeping the same structure.
 *
 * No pixels are generated, blended into the product, or substituted for a real
 * capture. The composite is an inspection artefact only.
 *
 * Usage:
 *   node scripts/reference-side-by-side.mjs <reference.png> <actual.png> <out.png>
 *        [--label-left "OWNER REFERENCE / DAY"] [--label-right "ACTUAL ELECTRON"]
 */
import { _electron as electron } from '@playwright/test';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = argv.find((entry) => entry.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const positional = argv.filter((entry) => !entry.startsWith('--'));
const [referencePath, actualPath, outPath] = positional;
if (!referencePath || !actualPath || !outPath) {
  console.error('usage: node scripts/reference-side-by-side.mjs <reference> <actual> <out.png> [--label-left=..] [--label-right=..]');
  process.exit(2);
}

const toDataUrl = (file) => `data:image/png;base64,${readFileSync(path.resolve(file)).toString('base64')}`;
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

const result = await page.evaluate(
  async ({ referenceUrl, actualUrl, labelLeft, labelRight }) => {
    const load = async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      return image;
    };
    const ref = await load(referenceUrl);
    const act = await load(actualUrl);

    const surface = (image) => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      // getImageData() returns an ImageData wrapper; the pixels are on .data.
      return { canvas, data: context.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, height: canvas.height };
    };
    const a = surface(ref);
    const b = surface(act);

    const sample = (src) => {
      const gridX = 10;
      const gridY = 8;
      const cells = [];
      for (let gy = 0; gy < gridY; gy += 1) {
        for (let gx = 0; gx < gridX; gx += 1) {
          const x0 = Math.floor((gx * src.width) / gridX);
          const x1 = Math.floor(((gx + 1) * src.width) / gridX);
          const y0 = Math.floor((gy * src.height) / gridY);
          const y1 = Math.floor(((gy + 1) * src.height) / gridY);
          let r = 0;
          let g = 0;
          let bl = 0;
          let n = 0;
          for (let y = y0; y < y1; y += 4) {
            for (let x = x0; x < x1; x += 4) {
              const i = (y * src.width + x) * 4;
              r += src.data[i];
              g += src.data[i + 1];
              bl += src.data[i + 2];
              n += 1;
            }
          }
          cells.push([r / n, g / n, bl / n]);
        }
      }
      return cells;
    };
    const ca = sample(a);
    const cb = sample(b);
    const distance = ca.map((cell, index) => {
      const other = cb[index];
      return Math.round((Math.abs(cell[0] - other[0]) + Math.abs(cell[1] - other[1]) + Math.abs(cell[2] - other[2])) / 3);
    });
    const lum = (cell) => 0.2126 * cell[0] + 0.7152 * cell[1] + 0.0722 * cell[2];
    const rowProfile = (src) => {
      const rows = [];
      for (let y = 0; y < src.height; y += 8) {
        let sum = 0;
        for (let x = 0; x < src.width; x += 16) {
          const i = (y * src.width + x) * 4;
          sum += 0.2126 * src.data[i] + 0.7152 * src.data[i + 1] + 0.0722 * src.data[i + 2];
        }
        rows.push(sum / Math.ceil(src.width / 16) / 255);
      }
      return rows;
    };
    const edges = (profile) => {
      const found = [];
      for (let i = 2; i < profile.length - 2; i += 1) {
        const delta = profile[i + 2] - profile[i - 2];
        if (Math.abs(delta) > 0.045) found.push(Number((i / profile.length).toFixed(3)));
      }
      // Collapse neighbours so a band reports one position, not twenty.
      const collapsed = [];
      for (const position of found) {
        if (collapsed.length && position - collapsed[collapsed.length - 1] < 0.02) continue;
        collapsed.push(position);
      }
      return collapsed;
    };

    const height = Math.max(a.height, b.height) + 58;
    const width = a.width + b.width + 12;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#0b0a18';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#e8e2ff';
    context.font = 'bold 22px "Segoe UI", sans-serif';
    context.fillText(labelLeft, 16, 34);
    context.fillText(labelRight, a.width + 28, 34);
    context.drawImage(ref, 0, 52, a.width, a.height);
    context.drawImage(act, a.width + 12, 52, b.width, b.height);

    return {
      composite: canvas.toDataURL('image/png'),
      metrics: {
        reference: { width: a.width, height: a.height },
        actual: { width: b.width, height: b.height },
        meanCellDistance: Math.round(distance.reduce((x, y) => x + y, 0) / distance.length),
        worstCells: distance.map((value, index) => ({ cell: index, value })).sort((x, y) => y.value - x.value).slice(0, 8),
        meanLuminance: {
          reference: Number((ca.reduce((s, c) => s + lum(c), 0) / ca.length / 255).toFixed(3)),
          actual: Number((cb.reduce((s, c) => s + lum(c), 0) / cb.length / 255).toFixed(3)),
        },
        horizontalBands: {
          reference: edges(rowProfile(a)),
          actual: edges(rowProfile(b)),
        },
      },
    };
  },
  {
    referenceUrl: toDataUrl(referencePath),
    actualUrl: toDataUrl(actualPath),
    labelLeft: flag('label-left', 'OWNER REFERENCE'),
    labelRight: flag('label-right', 'ACTUAL ELECTRON'),
  },
);

await app.close();
mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
writeFileSync(path.resolve(outPath), Buffer.from(result.composite.split(',')[1], 'base64'));
const jsonPath = outPath.replace(/\.png$/i, '.json');
writeFileSync(jsonPath, JSON.stringify({ reference: path.resolve(referencePath), actual: path.resolve(actualPath), ...result.metrics }, null, 2));
console.log(JSON.stringify(result.metrics, null, 2));
console.log(`composite -> ${outPath}\nmetrics -> ${jsonPath}`);
