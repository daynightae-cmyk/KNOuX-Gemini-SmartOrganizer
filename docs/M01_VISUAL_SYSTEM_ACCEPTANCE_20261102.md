# MISSION ACCEPTANCE RECEIPT — M01-VISUAL-SYSTEM

Premium glass NIGHT/DAY visual system. Owner override V3 §2. Recorded 2026-11-02.
Companion machine-readable record: [MISSION_LEDGER.json](MISSION_LEDGER.json).

## REALITY BEFORE THE CHANGE

The night theme was not one system. Three layers each owned a palette and
argued:

- `visual/visual-sprint.css` declared `--knx-night-canvas:#020b20`,
  `--knx-night-surface:#041735` — a sampled midnight **navy**, and re-pinned the
  shell on top of it with `.visual-sprint{--v-bg:#0c0b20}`;
- `visual/design-recovery.css` bridged `--v-*`, `--sys-*`, `--os-*`, `--ref-*`
  onto those navy names;
- `visual/reference-restraint.css` then defeated the bridge on purpose — it
  re-pinned the reference shells to `#070b18`, repainted the rail with a fixed
  navy gradient, and set `backdrop-filter:none` on the cards "to remove the blur
  fog".

Underneath all of it, the renderer painted its surfaces with **624 hard-coded
navy literals** in 145 distinct `bg-[#…]` utilities, all in hue 195–245. That is
why night read as flat navy rather than obsidian/violet glass: the literals were
the real palette, and the tokens were decoration. Home additionally pinned itself
to `font:13px/1.35 Arial` (`approved-home.css`) and `Segoe UI, Arial`
(`design-recovery.css`), while Plus Jakarta Sans, Tajawal and JetBrains Mono were
already loaded and unused.

Measured, not asserted: every frame of the baseline matrix reported
`panelBackdrop: "none"` — there was no backdrop blur anywhere in the product.

## WHAT LANDED

**1 — One canonical token layer.** `src/visual/knox-theme.css`, imported as the
first module in `App.tsx` so no domain stylesheet can define a palette before
it. `:root` carries geometry, type and motion; night and day each declare the
same 30+ semantic roles (canvas, surface, surface-2, raised, hover, inset, line,
line-soft, line-strong, edge, ink, ink-2, muted, accent, accent-strong,
accent-deep, on-accent, cyan, success, warning, error, info, glow, focus,
focus-ring, elev-1/2/3, atmosphere). Night is obsidian-violet
(`#07060f` canvas, translucent violet glass surfaces); day is porcelain-violet
(`#f1f0fa` canvas) authored as its own pair, not an inversion. The historical
`--knx-night-*` names are kept as aliases so the existing domain bridge keeps
working without a second palette.

**2 — A generated night material bridge.**
`scripts/generate-night-material-bridge.mjs` scans the real source, keeps only
neutral navy literals (hue 195–245 with saturation ≥0.25 — status greens, ambers
and violets are deliberately excluded), buckets them by measured relative
luminance into five surface tiers plus two line tiers, and emits
`src/visual/knox-night-bridge.css`. Result: **145 background + 63 border
literals, 624 surface uses, 100% coverage**, every rule scoped to
`html:not([data-theme='light'])`. `--check` mode fails when a new unmapped navy
literal appears, so the bridge cannot silently rot.

**3 — A single glass material pass.** `src/visual/knox-glass.css`, imported last
in the module graph. It owns type (Plus Jakarta Sans / Tajawal for `dir=rtl` /
JetBrains Mono), maps `.visual-sprint` shell aliases onto canonical roles, gives
the titlebar, rail, heroes, panels, cards, inspectors, workbenches and dialogs
one translucent fill with one blur recipe (`20px` + `saturate(155%)`), separates
inset wells (deeper, unblurred) from raised heroes (elev-3), restates the active
rail pill, styles inputs, dense rows, table heads, scrollbars, `kbd` and the
persistent footer strip, and adds three guards: `prefers-reduced-transparency`
swaps to genuinely opaque materials and drops all blur, `prefers-reduced-motion`
drops transitions, and `forced-colors: active` hands surfaces back to the system.

**4 — Competing overrides removed, not layered.** The navy pins, the fixed rail
gradient and the `backdrop-filter:none` rules are gone from
`reference-restraint.css`, which now keeps only the structural work it uniquely
owns (readable service-register columns, and never dropping the orbital dial
below 1500px). `visual-sprint.css` no longer declares a palette. Home's private
daylight palette and its inspector/access-card navy overrides now resolve to the
canonical roles.

**5 — Two defects found and fixed while measuring.**
- Chromium makes a scrollable region keyboard-focusable, and the content column
  is one. A focused route painted the user-agent's own `outline:auto` ring around
  the whole workspace in the inherited text colour — visible in every screenshot.
  Verified by DOM probe (`activeElement = MAIN.cln-main`,
  `outline: 1px auto rgb(3,105,161)`). The region now carries a deliberate,
  inset, on-theme focus treatment; the blanket control outline rule was narrowed
  from `[tabindex]` to actual interactive roles so keyboard affordances stay
  specific.
- `kbd` hints and the persistent footer strip were authored as dark chips, which
  turned into white-on-white ghosts in daylight.

## TESTS

`npm run test:theme` → `node --test tests/theme/tokens.test.mjs` (10 tests, 10
pass) plus `generate-night-material-bridge.mjs --check`. The contract asserts:
both themes declared exactly once; **night and day declare the same role set**
(no theme can gain a role the other lacks); every role the material layer
depends on exists; no stylesheet consumes an undefined token; the material layer
never paints a raw hex on a real property; **night and day body text clear WCAG
AA (4.5:1) over surface, raised and inset** with translucency composited against
its own canvas; accent hues clear the 3:1 large-text floor; the generated bridge
still matches its source; the bridge emits only night-scoped token-valued rules;
and the token layer is imported before every domain stylesheet with the material
pass imported last.

`npm run lint` (tsc --noEmit) clean. `npm run build` clean.
CSS bundle: 968,957 B → 992,280 B (+2.4%) for the whole material system.

Regression suites run locally against the changed renderer, each as its own
command with its own exit code:

| Suite | Result |
|---|---|
| `test:native` | exit 0 |
| `test:navigation` | exit 0 |
| `test:workbench` | exit 0 |
| `test:settings` | exit 0 |
| `test:home` (the preserved real UI→preload→IPC→native search path) | exit 0 |
| `test:entry` (Playwright) | exit 0 |

The remaining domain suites are run by CI on the pushed SHA rather than locally
here; nothing in this mission touches native providers, IPC or contracts, so they
are the independent check rather than a suspected break.


## ACTUAL ELECTRON EVIDENCE

Real Electron windows, isolated profile, built renderer, no owner data.
`scripts/theme-evidence-matrix.mjs` captures every route in both themes and
records the DOM state that was actually applied, so a frame in the wrong theme is
detectable from the proof alone.

| Run | Frames | Route failures | Page errors | Page overflow |
|---|---:|---:|---:|---:|
| `theme-matrix-20261102-accept-1672` (EN, night+day) | 28 | 0 | 0 | 0 px on all 28 |
| `theme-matrix-20261102-accept-1366` (EN, 1366×768) | 28 | 0 | 0 | 0 px on all 28 |
| `theme-matrix-20261102-accept-1920` (EN, 1920×1080) | 28 | 0 | 0 | 0 px on all 28 |
| `theme-matrix-20261102-accept-ar` (AR/RTL, night+day) | 28 | 0 | 0 | 0 px on all 28 |

112 frames. Canvas resolves to `#07060f` in every night frame and `#f1f0fa` in
every day frame, which is the token layer winning rather than a literal.
`docs/evidence/baseline-20261102-m01/baseline-proof.json` records the pre-change
canonical state (local main = origin/main = `df655ab`, verifier PASS, one
worktree, exact-SHA CI run 41404203153 success) and is re-runnable with
`python scripts/capture-baseline-proof.py`.

## VISUAL REFERENCE POSITION

The 10 DAY + 10 NIGHT section pairs under
`missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/references/` remain the artwork
source of truth, and the approved Home picture
(`references/day/00_home-command-center.png`, sha256
`a777e4847a8bf8b44a6153b7795f05d325e23b3904025951a5b0015c0166569d`, verified
against `REFERENCES_MANIFEST.json`) is unchanged by this mission. This mission
changed **materials**, not composition: no route's geometry, controls, copy or
data source was altered. Side-by-side measured comparison against each reference
is Mission 02/03 work and is listed as open below.

## OPEN — WHY THIS IS NOT CLAIMED AS MISSION_COMPLETE

1. **The shared shell is still two shells.** Home and Studio render brand in the
   header; the other twelve render brand in the rail with a breadcrumb header.
   Unifying it is a composition change owned by Mission 02.
2. **No per-section measured comparison against the paired references yet.**
   `scripts/reference-geometry-probe.mjs` exists to produce those numbers; the
   comparison itself is Mission 02.
3. **Home's hero band still carries its own reference-tuned navy artwork
   gradients.** Left deliberately so Mission 02 can re-derive them against the
   approved picture instead of this mission fighting it.
4. **Performance was instrumented, not certified.**
   `scripts/renderer-performance-probe.mjs` measures frame pacing, long tasks,
   heap growth and the number of elements actually compositing a backdrop filter.
   Two findings are solid: the glass pass blurs **at most 6 elements on any route**
   (Applications; most routes blur 1), and **JS heap growth during idle was 0 bytes
   on every measured route**, so the material is bounded and does not leak.
   The frame-pacing metric is not trustworthy: Chromium throttles
   `requestAnimationFrame` in an unfocused or occluded window, and one sample
   came back at 1000 ms/frame (`files/day`) while the same route measured 16.7 ms
   in the run before it. Two routes — Studio and Workspace — did hold at
   p50 ≈ 33 ms (30 fps) in **both** independent runs, in both themes, and both
   have **zero blurred elements**, so the glass pass is not the driver; the cause
   is their own animation load and is not yet isolated. Settings could not be
   sampled by this probe (its `settings-theme` test id was not found in this
   harness) even though the route mounted in all 112 visual-matrix frames, so that
   is an instrument gap rather than a proven app defect. Certifying pacing needs a
   pinned, occlusion-proof harness (CDP frame timings), which is open work.
   No A/B against the previous build was performed; the only before/after number
   is the CSS bundle: 968,957 B → 992,280 B (+2.4%).

5. **Two inert surfaces found, not fixed here.** Settings offers four "Neon
   Color Accent Scheme" options persisted in `src/settings/profile.ts` with no
   consumer that changes anything, and Home's `home-qa-toolbar` puts a raw
   `LOADING` / `NOT_CONNECTED` status and a "Reference sample" checkbox on the
   product screen. Both are Mission 04 findings.
6. **A documented protection that does not exist.** `vite.config.ts` injects a
   `frame-ancestors 'none'` CSP into a `<meta>` tag and its comment claims the
   Electron main process "also adds a response header"; `grep` finds no
   `onHeadersReceived`/`webRequest` in `electron/main.cjs`. Chromium ignores
   `frame-ancestors` in a meta tag — the renderer logs exactly that on every
   load. Not a framing risk for a `file://` desktop window, but it is a false
   protection claim and the loopback dev preview is framable. Needs a dedicated
   security fix, not a visual commit.

Installed/packaged/signed verification remains a separate gate and is not claimed.
