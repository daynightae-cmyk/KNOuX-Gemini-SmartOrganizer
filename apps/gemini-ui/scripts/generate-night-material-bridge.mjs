/**
 * KNOuX — night material bridge generator.
 *
 * The renderer was authored before semantic tokens existed, so its dark surfaces
 * are hard-coded Tailwind arbitrary utilities (`bg-[#061226]`, `border-[#123]`).
 * Every one of those literals sits in the same navy hue band, which is why the
 * night theme reads as flat navy instead of the obsidian/violet glass identity.
 *
 * This script scans the actual source, keeps only the *neutral navy* literals
 * (hue 195-245 with real saturation — status greens, violets and ambers are left
 * completely alone), buckets them by measured relative luminance, and emits one
 * CSS rule per bucket that re-maps the literal onto the canonical night tokens.
 *
 * `--check` exits non-zero when a new unmapped navy literal appears, so the
 * bridge cannot silently rot as screens are added.
 *
 * Usage:
 *   node scripts/generate-night-material-bridge.mjs          # write the file
 *   node scripts/generate-night-material-bridge.mjs --check  # verify, no write
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(SRC, 'visual', 'knox-night-bridge.css');
const CHECK = process.argv.includes('--check');

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    const info = statSync(full);
    if (info.isDirectory()) yield* walk(full);
    else if (/\.(tsx|ts)$/.test(entry)) yield full;
  }
}

const parse = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  if (h.length !== 6) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};

const luminance = (hex) => {
  const rgb = parse(hex);
  if (!rgb) return 1;
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = rgb.map(f);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const hsv = (hex) => {
  const [r, g, b] = parse(hex) ?? [0, 0, 0];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { hue: (h * 60 + 360) % 360, sat: max === 0 ? 0 : d / max };
};

/** Neutral navy surface: dark, blue-band hue, and chromatic enough to be a
 *  deliberate navy fill rather than a grey or a status colour. */
const isNavy = (hex, maxLuminance) => {
  const L = luminance(hex);
  if (L >= maxLuminance) return false;
  const { hue, sat } = hsv(hex);
  return hue >= 195 && hue <= 245 && sat >= 0.25;
};

const counts = { bg: new Map(), border: new Map() };
for (const file of walk(SRC)) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/bg-\[(#[0-9a-fA-F]{3,6})\]/g)) {
    const hex = m[1].toLowerCase();
    counts.bg.set(hex, (counts.bg.get(hex) ?? 0) + 1);
  }
  for (const m of text.matchAll(/border-\[(#[0-9a-fA-F]{3,6})\]/g)) {
    const hex = m[1].toLowerCase();
    counts.border.set(hex, (counts.border.get(hex) ?? 0) + 1);
  }
}

/** Luminance tiers, measured rather than guessed. `--knx-night-inset` is kept
 *  as the deep well token that the existing bridge already consumes, so the
 *  generated literals land on the ascending surface ramp instead of it. */
const SURFACE_TIERS = [
  { token: '--knx-night-canvas', max: 0.005, note: 'page void' },
  { token: '--knx-night-surface', max: 0.009, note: 'base glass panel' },
  { token: '--knx-night-surface-2', max: 0.015, note: 'secondary panel' },
  { token: '--knx-night-raised', max: 0.025, note: 'raised panel' },
  { token: '--knx-night-hover', max: 0.14, note: 'hover, selected and strong fill' },
];
const LINE_TIERS = [
  { token: '--knx-night-line-soft', max: 0.1 },
  { token: '--knx-night-line', max: 0.3 },
];

const tierOf = (hex, tiers) => tiers.find((tier) => luminance(hex) < tier.max) ?? null;

const grouped = new Map();
for (const [hex, n] of counts.bg) {
  if (!isNavy(hex, 0.14)) continue;
  const tier = tierOf(hex, SURFACE_TIERS);
  if (!tier) continue;
  if (!grouped.has(tier.token)) grouped.set(tier.token, []);
  grouped.get(tier.token).push({ hex, n });
}
const lineGrouped = new Map();
for (const [hex, n] of counts.border) {
  if (!isNavy(hex, 0.3)) continue;
  const tier = tierOf(hex, LINE_TIERS);
  if (!tier) continue;
  if (!lineGrouped.has(tier.token)) lineGrouped.set(tier.token, []);
  lineGrouped.get(tier.token).push({ hex, n });
}

const NIGHT = "html:not([data-theme='light'])";

const block = (token, items, kind) => {
  if (!items?.length) return '';
  const sorted = [...items].sort((a, b) => b.n - a.n);
  const selectors = sorted.map((item) => `${NIGHT} [class*='${kind}-[${item.hex}]']`).join(',\n');
  const prop = kind === 'bg' ? 'background-color' : 'border-color';
  const covered = sorted.reduce((total, item) => total + item.n, 0);
  return [
    `/* ${token} — ${sorted.length} literals, ${covered} uses${kind === 'bg' ? '' : ' (border)'} */`,
    selectors,
    `{ ${prop}: var(${token}) !important; }`,
    '',
  ].join('\n');
};

const coveredBg = [...grouped.values()].flat().reduce((t, i) => t + i.n, 0);
const totalNavyBg = [...counts.bg.keys()].filter((h) => isNavy(h, 0.14)).reduce((t, h) => t + counts.bg.get(h), 0);

const css = `/*
 * GENERATED by scripts/generate-night-material-bridge.mjs — do not hand-edit.
 *
 * Night material bridge: the ${totalNavyBg} hard-coded navy surface literals found
 * in the renderer, re-mapped onto the canonical obsidian/violet night tokens by
 * measured luminance. Status colours outside the navy hue band are not emitted,
 * so semantic greens, ambers, violets and cyans keep their authored values.
 *
 * Night only: every selector is scoped to html:not([data-theme='light']).
 * Daylight has its own bridge in src/theme-light.css.
 *
 * Re-run after adding screens:  node scripts/generate-night-material-bridge.mjs
 */

${[...SURFACE_TIERS]
  .map((tier) => block(tier.token, grouped.get(tier.token), 'bg'))
  .join('\n')}
${[...LINE_TIERS]
  .map((tier) => block(tier.token, lineGrouped.get(tier.token), 'border'))
  .join('\n')}
`;

if (CHECK) {
  const existing = (() => {
    try {
      return readFileSync(OUT, 'utf8');
    } catch {
      return '';
    }
  })();
  const missing = [...counts.bg.keys()]
    .filter((hex) => isNavy(hex, 0.14) && !existing.includes(`bg-[${hex}]`))
    .concat([...counts.border.keys()].filter((hex) => isNavy(hex, 0.3) && !existing.includes(`border-[${hex}]`)));
  if (missing.length) {
    console.error(`unmapped navy literals (${missing.length}): ${missing.slice(0, 20).join(' ')}`);
    process.exit(1);
  }
  console.log(`night material bridge OK — ${totalNavyBg} navy surface uses mapped`);
  process.exit(0);
}

writeFileSync(OUT, css, 'utf8');
console.log(
  `wrote ${path.relative(ROOT, OUT)} — ${[...grouped.values()].flat().length} bg + ${[...lineGrouped.values()].flat().length} border literals (${coveredBg}/${totalNavyBg} surface uses)`,
);
