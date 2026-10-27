# Visual fidelity round 2 — 2026-10-27

Status: **RENDERER-VERIFIED, NATIVE ACCEPTANCE NOT CLAIMED**.

This pass corrected the section composition problem: the nine sections no longer
share a title-only clone of a generic canvas. Each reference composition now has
its own wheel destinations, hero hierarchy, metric row, primary ledger and right
rail while retaining the measured-only and native-required states.

## Composition implemented

- **Home:** taller reference-scale intro, stronger DAY cosmic planet/ring, larger
  KPI values, 112 px command-deck tiles, and the existing Insight, Recent
  Activity and Pending Safe Actions rail.
- **Smart Scan:** title, three reference feature rows, five wheel destinations
  (Quick, Deep, Privacy, System Health, Source), six measured metrics above the
  service strip, services in the main flow, findings ledger below, and source
  authorization moved into the Live Scan Status rail.
- **Applications:** Applications title, capability rows, 5-card measured metric
  row, full-width register, dossier, and the service workspaces moved into a
  readable one-column rail list.
- **Storage:** Volume Atlas title and capability rows; volume bays, Space Map and
  largest-items ledger stay in the main column; measured inspector and workflow
  remain in the right rail.
- **Cleanup:** Smart Cleanup title and reference capability rows; four
  discovery/candidate metrics; candidate ledger; bounded scope disclosure;
  safety preview and the 12 cleanup services in the right rail.
- **Startup:** Startup Control title and capability rows; measured KPI row; boot
  evidence strip outside the intro; autorun register; dossier and services rail.
- **System:** System Performance title and capability rows; chart-first main
  pane; four explicit empty instruments and the service catalog in the rail.
- **Repair:** Recovery Lab title and capability rows; 12-tool grid; evidence
  metrics; guided sequence in the right rail. The duplicate hero refresh was
  removed because the same action remains in the bottom action bar.
- **Services:** Service Commander title and capability rows; six measured
  metrics; SCM register; evidence, operation preview and service tools in the
  rail. The duplicate hero refresh was removed for the same reason.

## Verification

- Vite production build passed: **1862 modules transformed** using the
  documented low-memory invocation. Only the existing large-chunk warning remains.
- Final receipt: [checks.json](checks.json). **36 views** — 9 sections × 2 themes
  × 1672×941 and 1366×768.
- For every view: `mainOverflow = 0`, `pageOverflow = 0`, `horizontal = 0`, no
  page errors, no disabled/enabled wheel target obstructed by another element,
  and every internal scroll container responded to programmatic scroll.
- Existing `scripts/visual-preview.mjs` was reused without modification. Smart
  Scan is clean at both sizes. Services/Cleanup/Startup still report
  `Primary tools` as a clipped panel because the 12-tool rail intentionally
  scrolls; this is nested tool scrolling, not a page overflow. At 1366 the
  select-all checkbox in Cleanup/Startup sits below the register's internal
  viewport and is reached by scrolling the register; the page itself does not
  scroll.

## Evidence

- Comparison boards, each row left→right: DAY reference, DAY actual, NIGHT
  reference, NIGHT actual.
  - [Home / Repair / Smart Scan](reference-fidelity-home-repair-smart_scan.png)
  - [Applications / System / Services](reference-fidelity-applications-system-services.png)
  - [Storage / Cleanup / Startup](reference-fidelity-storage-cleanup-startup.png)
- 36 final renderer captures are stored in this folder as
  `{section}-{theme}-{width}.png`.
- Day/Night pairs at 1672: `home`, `smart_scan`, `applications`, `storage`,
  `cleanup`, `startup`, `system`, `repair`, `services`.
- Compact 1366 captures are alongside the 1672 captures for the same sections.

## Remaining differences — recorded, not hidden

1. **Measured-only emptiness.** Browser previews cannot call the native
   providers, so registers, charts, findings and dossiers show explicit
   unavailable states instead of the populated reference examples. No fixture
   numbers were introduced. Populating these views requires an owner-approved
   Electron run; renderer evidence is not native acceptance.
2. **Vertical budget.** The product still has bottom action bars and a compact
   status/tab row that the reference mock does not. At 1366 the main ledgers are
   therefore shorter (measured: Smart Scan body ≈154 px, Cleanup ≈117 px,
   Startup ≈133 px) and use internal scrolling. Primary actions and the wheel
   remain visible, and there is no outer page scroll.
3. **Right-rail tools.** The reference right rails are shorter. All 12 domain
   tools are retained in a one-column scrollable rail; subtitles are hidden and
   titles are 12 px to keep the row readable. Nothing is removed; the complete
   descriptions remain available through the tool/workbench.
4. **Smart Scan wheel.** Five destinations now match the reference count, but
   the wheel is 300 px at 1672 and 270 px at 1366 rather than the reference's
   ~420 px, because the hero also has to fit the measured metrics and the
   findings workspace without outer scrolling.
5. **Home art.** The cosmic planet/ring and horizon are CSS/product art, not the
   supplied reference illustration. The Home NIGHT reference was not supplied;
   the NIGHT capture follows the established dark cosmic identity.
6. **Cleanup discovery modules.** The six scope categories remain a bounded
   disclosure instead of six always-visible reference cards; the four measured
   discovery/candidate KPI cards remain visible. No module was deleted.
7. **Storage.** Two inspector panels are shown instead of the reference's three;
   physical-disk identity/serial data is unavailable from the current provider
   and is labeled unavailable rather than invented.
8. **System chart.** The plot is an explicit awaiting-native-samples grid; it is
   not a fixture chart. Four empty instruments make the unavailable state
   readable without fabricating values.
9. **Home activity/insight.** Insight, recent activity and pending actions are
   honest empty states; the reference examples are populated.

## Boundaries preserved

Files, Organization Studio, Automation, Sidebar/Titlebar, the cinematic intro,
native hooks, providers, IPC, service executors, consent and privacy protections
were not rebuilt. No Windows, registry, service, startup, cleanup or repair
mutation was executed. Reduced Motion remains honored. The Storage design-fixture
preview remains explicitly labeled as a fixture.
