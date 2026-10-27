# Section visual fidelity correction — 2026-10-27

Status: **PARTIALLY VERIFIED**. These are implemented visual corrections with renderer evidence, not a claim of pixel equality or native product acceptance.

## REALITY

Owner worktree: `.worktrees/visual-owner-rebuild`, branch `feat/knoux-visual-studio-rebuild-20261027`. Starting foundation: `08988d58fc205fcdca659140e3040372fa235f17`. Workspace verifier returned PASS. Files was explicitly accepted by the owner as the implementation foundation. Existing mission files, pilot evidence, other worktrees and the unrelated `src/features/cinematic-entry/entry.css` modification were preserved.

## IMPLEMENTED

- Home: confined cosmic horizon and particles to the right of the hero copy, restoring title contrast in Night mode.
- Repair: moved the inspector beside the hero; replaced seven squeezed sequence columns with readable vertical steps. Sequence content has its own scroll container; action buttons occupy a separate fixed flex region. End-of-sequence screenshots show the final steps remain reachable without overlapping buttons.
- Smart Scan: placed live status and findings inspector beside the hero; service controls remain visible above findings. Refreshed DAY/NIGHT captures at 1366×768 after the compact layout correction.
- Applications: restored hero/orbit, metrics, application register and full-height dossier hierarchy. Six orbit destinations invoke existing inventory, updates, export and service handlers. Service names wrap in the visible tool dock.
- System and Services: restored the right inspector, primary workspace and visible service catalog. System shows an explicitly empty performance grid when measured native samples are unavailable. No chart values were invented.
- Storage: volume cards remain above the storage map; analysis inspector spans the right column; six wheel destinations retain existing view/service setters.
- Cleanup: modules remain visible above candidates. Scope/age settings use a bounded disclosure to retain controls at compact heights; scanning opens it.
- Startup: retained register, dossier, tool rail and orbit. Compact boot timeline scrolls internally.
- Automation: added an orbit connected to existing scan and tool handlers, with unavailable native actions disabled honestly. Retained editor, decision controls and visible tool catalog.
- Shared: Files viewport ownership and internal result scrolling were reused. Primary tools no longer require a generic Tools tab. Optional secondary history/details stay mounted when hidden. Orbit particles stop under Reduced Motion. Organization Studio was not rebuilt.

## UNIQUE WORK & RISKS

Native hooks, providers, IPC and service executors were retained. No live cleanup, repair, service, registry or startup changes were executed. Storage's existing explicitly labeled design-fixture preview remains a fixture, not measured device proof. Other sections retain honest Native Unavailable/empty states.

## VERIFICATION

- `python scripts/verify-workspace.py`: PASS on the owner branch at foundation SHA.
- Vite production build: succeeded, 1861 modules transformed; existing large-chunk warning remains. Low-memory invocation: `node --single-threaded --v8-pool-size=1 --max-old-space-size=160 --optimize-for-size node_modules/vite/bin/vite.js build` with `RAYON_NUM_THREADS=1` and `UV_THREADPOOL_SIZE=1`.
- `node --max-old-space-size=128 scripts/canvas-preview.mjs`: 24 renderer captures across 12 sections, DAY/NIGHT. Geometry sampled at 1672×941 and 1366×768; no outer overflow above the 4px tolerance, no recorded page errors. Reduced Motion returned animation `none`.
- Focused Repair rerun: sequence scroll reached its end; content bottom 746.625px and actions top 760.625px in the recorded wide capture. This is positive separation, not text hidden beneath sticky buttons.
- Selected final images and original-reference comparison boards inspected. Overflow measurements alone were not treated as fidelity acceptance.
- No heavy Electron suite, native executor tests, CI or production checks were repeated in this correction pass. Renderer captures do not establish native Electron runtime acceptance.

## VISUAL EVIDENCE

Each before/after board reads left to right: DAY before, DAY after, NIGHT before, NIGHT after.

- [Home / Repair / Smart Scan before-after](evidence/canvas-rollout/fidelity-home-repair-smart_scan.png)
- [Applications / System / Services before-after](evidence/canvas-rollout/fidelity-applications-system-services.png)
- [Storage / Cleanup / Startup before-after](evidence/canvas-rollout/fidelity-storage-cleanup-startup.png)
- [Automation / Studio / Files before-after](evidence/canvas-rollout/fidelity-automation-studio-files.png)

Reference boards read DAY reference, DAY actual, NIGHT reference, NIGHT actual.

- [Home / Repair / Smart Scan reference-actual](evidence/canvas-rollout/reference-review-home-repair-smart_scan.png)
- [Applications / System / Services reference-actual](evidence/canvas-rollout/reference-review-applications-system-services.png)
- [Storage / Cleanup / Startup reference-actual](evidence/canvas-rollout/reference-review-storage-cleanup-startup.png)
- [Automation / Studio / Files reference-actual](evidence/canvas-rollout/reference-review-automation-studio-files.png)
- [Smart Scan compact DAY](evidence/canvas-rollout/smart_scan-light-compact.png), [NIGHT](evidence/canvas-rollout/smart_scan-dark-compact.png)
- [Repair final steps DAY](evidence/canvas-rollout/repair-light-sequence-end.png), [NIGHT](evidence/canvas-rollout/repair-dark-sequence-end.png)
- [Full renderer measurements](evidence/canvas-rollout/preview.json), [Repair scroll measurements](evidence/canvas-rollout/preview-repair.json)

## DELIVERY

Source changes and evidence saved locally on the visual branch. No push, PR, main merge, deployment or production acceptance is claimed.

## REMAINING GAPS

The original references contain populated device charts, application details and service data; unavailable-native previews intentionally retain empty states. Current hero copy, some card sizes, tool counts and the compact horizontal tool rails differ from the reference assets. Secondary history/details and compact Cleanup scope use disclosures. These differences are visible in the reference boards and require owner visual judgment; they are not described as exact fidelity.

No installed Automation reference (either mode) or Home NIGHT reference was found in the supplied reference set; boards label those cells explicitly. Automation therefore follows Files materials and the existing functional composition without claiming comparison to a missing image.
