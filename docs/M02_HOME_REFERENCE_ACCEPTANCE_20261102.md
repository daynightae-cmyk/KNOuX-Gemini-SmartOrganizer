# MISSION RECEIPT (CHECKPOINT) — M02-HOME-REFERENCE

Home rebuilt against the approved reference. Owner directive 2026-11-02,
corrections 1, 2 and 6. Recorded 2026-11-02. Status: **PARTIAL / CHECKPOINT**.

## THE REFERENCE, VERIFIED NOT ASSUMED

`missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/references/day/00_home-command-center.png`
1672×941, sha256 `a777e4847a8bf8b44a6153b7795f05d325e23b3904025951a5b0015c0166569d`,
recomputed with `certutil` and matched against `REFERENCES_MANIFEST.json`
(order 0, `"approved new daylight Home reference; FIRST priority"`).

The manifest states the limitation explicitly: *"Dark Home screenshot is in user
chat, not installed as a night PNG."* There is no approved NIGHT Home picture in
the repository, and none was invented. The approved daylight **geometry** is
preserved and rendered with the canonical NIGHT tokens, so night Home is the same
composition in the same light system as the other thirteen sections.

## WHAT CHANGED

**Composition.** `ApprovedHomeScreen.tsx` and the new `home-command.css` replace
the old welcome-screen arrangement with the reference's bands, in the reference's
order: hero (title, lede, two actions at the reading start; live orbital
instrument at the far side) → **six** full-width KPI cards → a two-column split
whose left side is *Today's Command Deck* with **eight** tool tiles in four
across and two down, over the *System Overview* / *Quick Access* pair, and whose
right side is *KNOuX Insight* → *Recent Activity* → *Pending Safe Actions*.

**Shared shell.** Home now renders `KNOuXTitleBar` and `KNOuXSidebar`, the same
chrome the other twelve sections use, instead of `ReferenceHeader` /
`ReferenceSidebar`. The app has one shell, not two.

**QA controls removed from the product surface.** The `home-qa-toolbar` — a raw
`LOADING` / `NOT_CONNECTED` status strip and a checkbox labelled *Reference
sample* that switched Home onto fabricated numbers — is gone from the render.
Authentic state is still told honestly: the rail's engine card reports the real
bridge state, every card carries its own `Not measured` value, and the
notifications dialog lists provider observations, warnings and errors.

**Fabrication removed, not hidden.** The `sample` flag and its
`sampleFindings` / `sampleCategories` / `sampleInsights` / hard-coded 65 % / 72 %
/ 476 GB branches were deleted with it. Home can no longer render an invented
number even by accident, because there is no code path that holds one.

## DATA INTEGRITY — REAL VALUES OR AN EXPLICIT ABSENCE

The reference's `1,248,632 indexed files`, `48.6 GB`, `358 apps`, `241 / 271`
are design examples; the manifest says so. The rebuilt Home maps each card onto a
provider that actually answers:

| Card | Source | When unmeasured |
|---|---|---|
| System Health | last completed/partial scan `healthScore` | `—`, "No measured score" |
| Authorized Indexes | `files sources` observation → authorized root count | `—`, "No folder authorized" |
| Space Reclaimable | **no Home-layer measurement exists** | `—`, "Run Cleanup to measure", routes to Cleanup |
| Workflow Drafts | `automation workflows` observation → count | `—` |
| Apps Monitored | `applications inventory` → `kpis.installed` (+ packaged, publishers) | `—` |
| Services Running | `services summary` → `running / total` (+ protected count) | `—` |

The *System Overview* health tab shows CPU, Memory, Disk and score from the
single bounded read Home performs, and a provenance line states plainly that a
performance timeline needs repeated samples and Home **never draws a curve it did
not measure** — the reference's line chart is deliberately not faked.

*Pending Safe Actions* lists only real staged organization receipts and the
findings count of an actually completed scan. With nothing staged it says
"Nothing staged. Home never queues an effect on its own." rather than showing a
placeholder row.

## MEASURED COMPARISON, NOT A CAPTURE CLAIM

`scripts/reference-side-by-side.mjs` composites the approved picture and the real
Electron frame at the same size and publishes numbers next to it. Both are
1672×941.

| Metric | First rebuilt frame | After the geometry pass |
|---|---:|---:|
| Mean 10×8 grid colour distance (0–255) | 9 | **8** |
| Mean luminance (reference 0.924) | 0.940 | 0.941 |
| Horizontal band edges detected | 24 | 23 (reference 28) |

The first pass put the energy pipeline across the full hero width, which pushed
the KPI strip about 200 px below the reference position. Moving the pipeline into
the copy column and shortening the orbit brought the bands back onto the
reference's positions; composites are in
`docs/evidence/m02-home-compare/`.

**This is a measured comparison, not a fidelity claim from a screenshot passing.**
Remaining known differences are listed under Open.

## A DEFECT CLASS THIS MISSION EXPOSED

Six bilingual calls were written as `t(isArabic, arabic, english)` — arguments in
the wrong slot. TypeScript cannot see it, and an English-only screenshot cannot
see it either; the rebuilt Home rendered Arabic lede text in the English build.
Caught by eye, fixed, and now guarded by `tests/home/i18n-slots.test.mjs`
(`npm run test:i18n`, wired into CI), which scans every `t(isArabic, …, …)` call
site in `src` and fails when the English slot holds Arabic script — with a second
test asserting the scanner actually sees the Home call sites, so a regex that
matches nothing cannot pass.

## TESTS AND EVIDENCE

`npm run lint` clean. `npm run build` clean. `npm run test:theme` 12/12.
`npm run test:i18n` 2/2. `test:home`, `test:navigation`, `test:workbench` — see
the ledger record for their exit codes. Real-Electron matrices: 14 sections ×
night/day at 1672×941 and 1366×768, plus AR/RTL at 1672×941, each frame recording
the theme, direction, route, band geometry, orbit/tube counts and page overflow
that were actually observed.

## OPEN — WHY THIS IS A CHECKPOINT

1. **Deck tile proportions still differ.** The reference tiles are taller and
   carry 3D cube artwork; the rebuilt tiles are compact rows with real icons.
   Matching the height would push the lower pair out of a 941 px window, so this
   is a deliberate trade, not an oversight.
2. **No KNOuX Pro card at the rail foot.** The reference shows a paid-tier upsell.
   There is no paid tier in the product, so it is not rendered.
3. **Header brand appears twice** (titlebar and rail card). This matches the
   approved Files night reference, which does the same, so it was left alone
   rather than "fixed" away from the artwork.
4. **The night Home frame has no reference to be measured against**, by the
   manifest's own statement. Its geometry is the daylight geometry; its light is
   the canonical night system.
5. **Studio still uses the old `ReferenceChrome` shell**, so the shell unification
   is 13 of 14 routes, not 14. Studio's composition is a separately reviewed
   gold standard and was not disturbed here.
6. **Window controls mirror to the top-left in RTL.** Pre-existing shared-shell
   behaviour, wrong for a Windows app; owned by MISSION-04.
