/**
 * KNOuX — theme token contract.
 *
 * Guards the invariant the night/day redesign depends on: one canonical token
 * layer, consumed by everything else. These are cheap static checks over the
 * actual shipped CSS, so they fail in CI when a screen invents a private
 * palette, when a theme gains a role the other theme does not have, or when the
 * generated navy bridge falls behind the source it was generated from.
 *
 * Run: node --test tests/theme/tokens.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const read = (...parts) => readFileSync(path.join(ROOT, ...parts), 'utf8');

const themeCss = read('src', 'visual', 'knox-theme.css');
const glassCss = read('src', 'visual', 'knox-glass.css');
const bridgeCss = read('src', 'visual', 'knox-night-bridge.css');

/** Return the body of the first rule whose selector matches `predicate`. */
function blockOf(css, predicate) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = re.exec(stripped))) blocks.push({ selector: match[1].trim(), body: match[2] });
  return blocks.filter((block) => predicate(block.selector));
}

const declarations = (body) => {
  const out = new Map();
  for (const line of body.split(';')) {
    const [name, ...rest] = line.split(':');
    const key = name?.trim();
    if (key?.startsWith('--')) out.set(key, rest.join(':').trim());
  }
  return out;
};

const nightBlock = blockOf(themeCss, (s) => s === "html:not([data-theme='light'])")[0];
const dayBlock = blockOf(themeCss, (s) => s === "html[data-theme='light']")[0];
const rootBlock = blockOf(themeCss, (s) => s === ':root')[0];

test('the canonical token layer declares both themes exactly once', () => {
  assert.ok(rootBlock, ':root geometry/type/motion block is missing');
  assert.ok(nightBlock, 'night theme block is missing');
  assert.ok(dayBlock, 'day theme block is missing');
});

test('night and day declare the same semantic roles', () => {
  const night = new Set(declarations(nightBlock.body).keys());
  const day = new Set(declarations(dayBlock.body).keys());
  const onlyNight = [...night].filter((key) => !day.has(key));
  const onlyDay = [...day].filter((key) => !night.has(key));
  assert.deepEqual(onlyNight, [], 'roles declared for night but not day');
  assert.deepEqual(onlyDay, [], 'roles declared for day but not night');
  assert.ok(night.size >= 30, `expected a full role set, found ${night.size}`);
});

const REQUIRED_ROLES = [
  '--knx-canvas', '--knx-surface', '--knx-surface-2', '--knx-raised', '--knx-hover',
  '--knx-inset', '--knx-line', '--knx-line-soft', '--knx-line-strong', '--knx-edge',
  '--knx-ink', '--knx-ink-2', '--knx-muted', '--knx-accent', '--knx-cyan',
  '--knx-success', '--knx-warning', '--knx-error', '--knx-info', '--knx-focus',
  '--knx-elev-1', '--knx-elev-2', '--knx-elev-3', '--knx-glow-accent',
];

test('every role the material layer depends on is declared', () => {
  const declared = new Set([...declarations(nightBlock.body).keys(), ...declarations(rootBlock.body).keys()]);
  const missing = REQUIRED_ROLES.filter((role) => !declared.has(role));
  assert.deepEqual(missing, [], `undeclared canonical roles: ${missing.join(', ')}`);
});

test('no stylesheet consumes a token the theme layer never defines', () => {
  const declared = new Set([
    ...declarations(rootBlock.body).keys(),
    ...declarations(nightBlock.body).keys(),
    ...declarations(dayBlock.body).keys(),
  ]);
  const consumed = new Set();
  for (const css of [glassCss, bridgeCss]) {
    for (const match of css.matchAll(/var\(\s*(--knx-[a-z0-9-]+)/g)) consumed.add(match[1]);
  }
  const unknown = [...consumed].filter((name) => !declared.has(name));
  assert.deepEqual(unknown, [], `material layer consumes unknown tokens: ${unknown.join(', ')}`);
});

test('the material layer never hard-codes a colour on a real property', () => {
  // knox-theme.css is the definition site, so hexes are expected there. In the
  // material layer a hex is only allowed while *redefining a token* (the
  // reduced-transparency fallback); painting a property with a raw hex is how
  // the old per-section drift started.
  const offenders = [];
  for (const line of glassCss.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('//')) continue;
    if (!/#[0-9a-fA-F]{3,8}\b/.test(trimmed)) continue;
    if (/^--knx-[a-z0-9-]+:/.test(trimmed)) continue;
    if (/rgba\(/.test(trimmed)) continue;
    offenders.push(trimmed);
  }
  assert.deepEqual(offenders, [], `raw hexes painted directly in knox-glass.css:\n${offenders.join('\n')}`);
});

/* ---- colour maths, for the contrast contract --------------------------- */
const channel = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const rgb = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const luminance = ([r, g, b]) => 0.2126 * channel(r / 255) + 0.7152 * channel(g / 255) + 0.0722 * channel(b / 255);
const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** Flatten a translucent token over an opaque base, as the browser composites it. */
const over = (value, base) => {
  const alpha = value.match(/rgba\(([^)]+),\s*([0-9.]+)\)/);
  if (!alpha) return rgb(value);
  const [r, g, b] = alpha[1].split(',').map((part) => Number(part.trim()));
  const a = Number(alpha[2]);
  const back = rgb(base);
  return [r, g, b].map((part, i) => Math.round(part * a + back[i] * (1 - a)));
};

test('night and day body text clear WCAG AA over their own panels', () => {
  for (const [label, block] of [['night', nightBlock], ['day', dayBlock]]) {
    const tokens = declarations(block.body);
    const canvas = tokens.get('--knx-canvas');
    const panel = over(tokens.get('--knx-surface'), canvas);
    const raised = over(tokens.get('--knx-raised'), canvas);
    const inset = over(tokens.get('--knx-inset'), canvas);
    for (const [role, min] of [['--knx-ink', 4.5], ['--knx-ink-2', 4.5], ['--knx-muted', 4.5]]) {
      const ink = rgb(tokens.get(role));
      for (const [surfaceLabel, surface] of [['surface', panel], ['raised', raised], ['inset', inset]]) {
        const contrast = ratio(ink, surface);
        assert.ok(
          contrast >= min,
          `${label} ${role} on ${surfaceLabel}: ${contrast.toFixed(2)}:1 is below ${min}:1`,
        );
      }
    }
  }
});

test('accent hues stay legible as text on their own theme canvas', () => {
  for (const [label, block] of [['night', nightBlock], ['day', dayBlock]]) {
    const tokens = declarations(block.body);
    const canvas = rgb(tokens.get('--knx-canvas'));
    const panel = over(tokens.get('--knx-surface'), tokens.get('--knx-canvas'));
    for (const role of ['--knx-accent', '--knx-cyan']) {
      const ink = rgb(tokens.get(role));
      const contrast = Math.min(ratio(ink, canvas), ratio(ink, panel));
      // Large/bold accent text only needs 3:1; anything smaller must be paired
      // with an ink colour by the consuming screen.
      assert.ok(contrast >= 3, `${label} ${role}: ${contrast.toFixed(2)}:1 is below the 3:1 large-text floor`);
    }
  }
});

test('the generated navy bridge still matches the source it was built from', () => {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'generate-night-material-bridge.mjs'), '--check'], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `bridge is stale:\n${result.stderr}${result.stdout}`);
});

test('the bridge only ever emits night-scoped, token-valued rules', () => {
  const rules = blockOf(bridgeCss, () => true);
  const offenders = [];
  for (const rule of rules) {
    const selectors = rule.selector.split(',').map((s) => s.trim()).filter(Boolean);
    for (const selector of selectors) {
      if (!selector.startsWith("html:not([data-theme='light'])")) offenders.push(`unscoped: ${selector}`);
    }
    if (!/var\(--knx-night-[a-z0-9-]+\)/.test(rule.body)) offenders.push(`non-token value: ${rule.body.trim()}`);
  }
  assert.deepEqual(offenders, [], `bridge rules escaped the contract:\n${offenders.slice(0, 10).join('\n')}`);
});

test('the token layer is imported before every domain stylesheet', () => {
  const app = read('src', 'App.tsx');
  const lines = app.split('\n');
  const at = (needle) => lines.findIndex((line) => line.includes(needle));
  const tokens = at("import './visual/knox-theme.css'");
  const firstDomain = at("import './studio/styles/studio.css'");
  const glass = at("import './visual/knox-glass.css'");
  const lastDomain = Math.max(
    ...lines.map((line, index) => (/^import '\.\/.*\.css';$/.test(line.trim()) ? index : -1)),
  );
  assert.ok(tokens >= 0 && firstDomain > tokens, 'knox-theme.css must precede the domain stylesheets');
  assert.ok(glass === lastDomain, 'knox-glass.css must be the final stylesheet import');
});

test('no stylesheet is imported twice', () => {
  // A duplicated token import is invisible in the browser — Vite dedupes it —
  // but it means the layering contract is being edited by trial and error.
  const offenders = [];
  for (const file of ['src/App.tsx', 'src/main.tsx']) {
    const seen = new Map();
    for (const match of read(file).matchAll(/^import '(\.\/[^']+\.css)';$/gm)) {
      seen.set(match[1], (seen.get(match[1]) ?? 0) + 1);
    }
    for (const [spec, count] of seen) if (count > 1) offenders.push(`${file}: ${spec} x${count}`);
  }
  assert.deepEqual(offenders, [], `duplicate stylesheet imports:\n${offenders.join('\n')}`);
});

test('the shell rail rule never targets every aside', () => {
  // `.visual-sprint aside` also matched each section's right-hand inspector,
  // painting chrome material onto content panels. A rule may still *descend*
  // from the rail (aside nav button); what is forbidden is styling the bare
  // aside element itself, because that element is used for content rails too.
  const offenders = [];
  for (const rule of blockOf(glassCss, () => true)) {
    for (const selector of rule.selector.split(',')) {
      if (/\.visual-sprint\s+aside\s*$/.test(selector.trim())) offenders.push(selector.trim());
    }
  }
  assert.deepEqual(offenders, [], `bare aside selectors in the material layer: ${offenders.join(' | ')}`);
});
