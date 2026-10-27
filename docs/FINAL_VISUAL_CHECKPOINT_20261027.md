# Final visual checkpoint — 2026-10-27

## REALITY

Scope: finish the existing visual implementation, without a shell rebuild. Worktree `.worktrees/visual-owner-rebuild`, branch `feat/knoux-visual-studio-rebuild-20261027`, starting SHA `aa5eac268196c8e210445589dad326acf55ad90c`. Workspace Guard returned PASS. Starting dirty source was exactly the owner's two `entry.css` inset corrections; untracked missions, captures, helpers and RAR archive were retained.

## IMPLEMENTED

- Accepted the reviewed `entry.css` change from `inset:40px 0 0` to `inset:0` for overlay and atmosphere. Saved separately in `239f231` (`fix(entry): cover the complete viewport during cinematic intro`).
- System: catalogue ordinals occupy a separate grid cell, preventing collisions with tool titles.
- Repair: metric children no longer flex-shrink through their own text; compact values have a readable fixed line box. Compact hero typography leaves more room for the tools while retaining copy and actions. The guided sequence retains its own scroll area above separate buttons.
- Repair and Startup: five-destination wheels now place their upper destination away from the centre button. Pointer hit testing had identified the centre intercepting DISM and Startup Items before this correction.
- Services: inspector headings use a bounded 16px/1.35 line height.
- Home: reviewed existing cosmic clipping correction; no further source change justified.
- Files and Organization Studio: no page source edits. Neither is wrapped in CommandCanvas. Verified the existing wheel handlers and internal scrolling, retaining the approved foundation.

## VERIFICATION

Production renderer build succeeded (1861 modules, existing large-chunk warning). Command: `node --single-threaded --v8-pool-size=1 --max-old-space-size=160 --optimize-for-size node_modules/vite/bin/vite.js build`, with `RAYON_NUM_THREADS=1` and `UV_THREADPOOL_SIZE=1`.

Lightweight production-preview verification: `node --max-old-space-size=128 scripts/visual-checkpoint.mjs`. Captured 48 section views: 12 sections × DAY/NIGHT × 1366×768/1672×941. No recorded page errors or outer overflow above 4px tolerance. No obstructed enabled wheel-button centre points remained after the five-node correction. This measures reachability, not reference fidelity or execution of every service.

Four intro size/theme combinations: overlay top was 0, full viewport height, top hit target belonged to the intro, workspace was inert beneath it. Enter Workspace and Skip each transitioned to ACTIVE. Reduced Motion disabled intro formation animation and orbital particle animations; Skip also worked with Reduced Motion enabled.

Real renderer interactions:

- Files: core focuses search, Images selects its category, Filters opens the existing disclosure, Hash service opens its workbench, Escape closes it.
- Studio: core opens Plan Review; pin switches the expanded stage to the actual side workbench; return to overview works.
- Repair: SFC and DISM satellites update the selected repair inspector.
- Services: Running satellite reports the real measured-discovery prerequisite instead of simulating success.
- Files results/inspector and Studio columns had overflowing content and accepted nonzero internal scroll positions in both sizes/themes.

Focused reruns after final CSS changes: `visual-checkpoint.mjs system`, `visual-checkpoint.mjs repair services`, and final `visual-checkpoint.mjs repair`. Receipts are separate; old evidence is untouched. No native Electron/service-executor, installed-app, CI or production acceptance was attempted.

## ACCEPTANCE BY SECTION

Statuses describe this visual checkpoint. ACCEPTED for Files/Studio preserves the owner's existing quality decision; it does not claim exact pixel equality. Other judgments use the actual screenshots against supplied original references, not build/overflow results.

| Section | Status | Reason / remaining visible difference | DAY/NIGHT evidence |
|---|---|---|---|
| Cinematic Intro | ACCEPTED | Full viewport coverage; no product bar visible above it; Enter/Skip and Reduced Motion verified. | [Both sizes and modes](evidence/visual-checkpoint-20261027/intro-day-night-sizes.png) |
| Files | ACCEPTED | Owner-approved foundation preserved; search/filter/workbench and internal scrolling still operate. Existing labeled browser fixture is not native device evidence. | [Reference vs current](evidence/visual-checkpoint-20261027/reference-automation-studio-files.png) |
| Organization Studio | ACCEPTED | Approved composition preserved; Plan Review, pin and column scrolling work. Existing fixture labeling remains visible. | [Reference vs current](evidence/visual-checkpoint-20261027/reference-automation-studio-files.png) |
| Home | NEEDS POLISH | Cosmic/title collision is resolved. Hero and dashboard proportions remain different from DAY reference; Home NIGHT reference is absent, so NIGHT exact comparison is unavailable. | [Reference vs current](evidence/visual-checkpoint-20261027/reference-home-repair-smart_scan.png) |
| Smart Scan | NEEDS POLISH | Controls/status/findings fit both sizes. Hero wording, wheel destinations and module density differ from reference; native-empty state remains honest. | [Reference vs current](evidence/visual-checkpoint-20261027/reference-home-repair-smart_scan.png) |
| Applications | NEEDS POLISH | Dossier and register hierarchy retained; tool rail and card density differ from original reference. Empty measured inventory is intentional. | [Reference vs current](evidence/visual-checkpoint-20261027/reference-applications-system-services.png) |
| Storage | NEEDS POLISH | Real existing volume/map controls retained. Map/volume/inspector proportions differ; screenshot's labeled design fixture cannot validate measured volume rendering. | [Reference vs current](evidence/visual-checkpoint-20261027/reference-storage-cleanup-startup.png) |
| Cleanup | NEEDS POLISH | Main tools remain visible; compact scope is a disclosure. Module/decision-panel proportions and density still differ from the supplied image. | [Reference vs current](evidence/visual-checkpoint-20261027/reference-storage-cleanup-startup.png) |
| Startup | NEEDS POLISH | Upper wheel destination is reachable; internal bootline/register preserved. Compact dossier/ledger balance and tool rail differ from original reference. | [Reference vs current](evidence/visual-checkpoint-20261027/reference-storage-cleanup-startup.png) |
| System | NEEDS POLISH | Tool ordinal overlap fixed. Empty performance stage and tall unavailable-source inspector differ substantially from populated reference; no sample data was invented. | [Reference vs current](evidence/visual-checkpoint-20261027/reference-applications-system-services.png) |
| Repair | NEEDS POLISH | Sequence/buttons and metric clipping fixed; SFC/DISM selection works. Seven-step inspector and tool-led workspace still differ from reference's health/playbook and results balance. | [Reference vs current](evidence/visual-checkpoint-20261027/reference-home-repair-smart_scan.png) |
| Services | NEEDS POLISH | Inspector heading and wheel reachability checked. Tool strip/operation-preview balance remains different from reference, with honest empty native register. | [Reference vs current](evidence/visual-checkpoint-20261027/reference-applications-system-services.png) |
| Automation | BLOCKED | Neither DAY nor NIGHT original reference exists in the supplied reference folders. Current view fits and remains interactive within native prerequisites, but exact visual acceptance has no comparison source. | [Current modes / missing refs marked](evidence/visual-checkpoint-20261027/reference-automation-studio-files.png) |

## EVIDENCE

- [Final small corrections before/after](evidence/visual-checkpoint-20261027/final-polish-before-after.png): DAY before, DAY after, NIGHT before, NIGHT after. Prior `aa5eac2` images remain untouched.
- [48-view receipt and intro/actions](evidence/visual-checkpoint-20261027/checks.json)
- [Final System receipt](evidence/visual-checkpoint-20261027/checks-system.json)
- [Repair/Services interaction receipt](evidence/visual-checkpoint-20261027/checks-repair-services.json)
- [Final compact Repair receipt](evidence/visual-checkpoint-20261027/checks-repair.json)

Full-size current images are saved in the same evidence directory with `{section}-{light|dark}-{1366|1672}.png` names. They are new captures, not replacements for the old rollout directory. Reference boards deliberately show missing reference cells instead of fabricating them.

## UNIQUE WORK & RISKS / DELIVERY

No WIP, old screenshot, reference folder or archive was removed. No `git add -A`, clean, reset or stash used. Staging is explicit and limited to the reviewed CSS, lightweight proof scripts, this report and selected new proof artifacts; no RAR or backup-reference directory is staged. No push, main merge or production deployment. Remaining visual differences are recorded above; native runtime and real service execution remain a separate authorized phase.
