# Visual fidelity pass — Organization Studio (2026-11-20)

Surgical edits to the existing studio surfaces only; no new app, branch or
worktree. References are the design authority:

- DAY: `missions/SCREEN_EXECUTION_PACK_20261030/REFERENCE_IMAGES_UNIQUE/be739fbf4012__KNOuX Organization Studio Dashboard.png`
- NIGHT: `missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/references/night/01_organization-studio.png`

## What changed (studio overview)

- The measured seven-stage pipeline + live status merge into ONE slim strip
  inside the page hero (`.osa-hero`); identity/features/KPIs portal into the
  unified hero (DAY orbit left, NIGHT orbit right via theme CSS).
- The board's tab strip is the real nine-service dock rendered flat: Overview
  pill + 9 live stage tabs (board short labels) + icon-only Source/Discover/
  Inspector controls. The duplicate `osa-tabs` strip retires in both themes.
- DAY body: categories 3×2 + Smart Suggestions on the taller top row, measured
  file table below (category-first row split). Compact card headers give the
  category tiles ~57px at 1672×941 (was 27px).
- NIGHT body: full-width categories 3×2 + horizontal Smart Suggestions row,
  no file table (board has none; inventory stays one click away in Visual
  Library). Cards ~52px, suggestion row 39px, all four recommendations visible.
- Consent dock keeps every execution action; `studio-service-select` restored
  to visible (it was `display:none`, which broke the motion/interaction guards).
- TDZ engine fix in `electron/main.cjs`: `operationBridge.appActions` assigned
  after AppActions construction (restores all native services; verified live).

## Disclosed deviations (required, not cosmetic)

1. NIGHT keeps the compact overview tab strip although the NIGHT board has
   none: all nine live stages and the source/inspector controls must stay
   reachable from overview in both themes (reachability contract + native
   evidence gate drives them in overview).
2. Overview tool buttons are icon-only with `aria-label` (board strip is tabs
   only); full text labels remain in the service view. Testids unchanged.
3. At 1366×768 the tab strip and category grid scroll internally
   (`overflow-x:auto` / `overflow:auto`) — every tab/card stays reachable.

## Verification (final build, this iteration)

- `npm run lint` (tsc --noEmit): PASS
- `npm run test:theme`: PASS (night material bridge fresh, 564 uses mapped)
- `npm run test:i18n`: PASS
- `npm run test:workbench` (workbench-host-test.cjs): PASS
- `npm run test:studio` (studio-native-test.cjs): PASS
- `npm run test:studio-safety`: PASS
- `node scripts/studio-inner-evidence.mjs` (real Electron, disposable fixtures):
  **9/9 probes OK, 0 page errors, original hashes restored** — including
  idle dock keyboard (9 tabs, End/Home) in overview, native discovery of 40
  files, exact plan + invalidation, 40 verified native moves + 40 verified
  restores, 2 separate native confirmations, exported receipt, real
  cancellation PARTIAL and missing-source FAILED, overview source controls +
  revoke, browser UNAVAILABLE. Receipts: local run dirs (not committed here).
- `node scripts/theme-evidence-matrix.mjs --sections=studio`:
  - `iter5/`: EN day+night × 1672×941, 1366×768, 1920×1080, 1600×900 —
    8 frames, 0 failures, 0 outer overflow (matrix-proof.json ok:true).
  - `iter5-ar/`: AR RTL day+night × 1672×941, 1366×768 — 4 frames, 0 failures.
- Reduced motion: cinematic seeded `reduced:true` in captures; pipeline
  energy/flashback animation disabled under `prefers-reduced-motion` (existing
  ServicePipeline contract, unchanged).

## Known pre-existing harness gaps (NOT caused by this pass, not fixed here)

- `scripts/design-recovery-interactions.mjs` Home probe references
  `.approved-hero-actions`/`.approved-kpis`, which no longer exist in the
  current Home markup (HEAD already lacks them) — fails before reaching studio.
- `scripts/living-glass-motion.mjs` filters `*.png` in
  `src/visual/assets/living-glass`, but the committed assets are `*.webp`
  (converted in a1b2666) — asset assertion fails at HEAD.
- `scripts/visual-checkpoint.mjs` references `studio-workbench-pin`, absent
  from src (pre-existing, documented earlier).

The studio-specific contracts of those guards (dock keyboard, pipeline
semantics, stage round-trip, portal) are covered by the passing
`studio-inner-evidence.mjs` run above.

## Earlier iterations

`baseline/`, `iter1/`–`iter4/` are prior captures of this same pass, kept for
honesty; `iter5/` + `iter5-ar/` are the final verified frames.
`docs/evidence/inner-workspaces-20261102/` (prior agents) is untouched.
