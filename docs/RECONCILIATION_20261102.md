# Main-only recovery and reconciliation — 2026-11-02

Status: **PARTIALLY VERIFIED** overall. The accepted implementation increment is tested separately below. Historical preservation is not a claim that every archived design is approved or every product mission is finished.

## A — CURRENT WORK FINISHED

The continuation began on clean canonical main `0b7f5af567330ce60b23fa5afd54150140d04eac`, matching origin/main. `python scripts/verify-workspace.py` passed. No branch/worktree was created, switched, removed or reset.

The active Clipboard Vault and ancestry-qualified CommandCanvas keys were retained. Commit `0b7513f108da9ac4a0fe52f7099e547eae2d793f` added actual same-position inspector draft/selection, parent-update, tab-switch and Vite HMR regression proof, native Electron captures, and bounded Windows metadata cold-start handling. It was normally pushed to main, remote SHA verified, and [matching Windows CI 41393798003](https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer/actions/runs/41393798003) completed successfully, including all configured build/test steps. See `CURRENT_WORK_CLOSURE_20261102.md`.

Live preview reuses Vite PID 8540 at `http://127.0.0.1:3000/`, renderer debugging on loopback 9333. The original visible Electron PID 1840 (window handle 3212606) was reused until it exited during the session; the precise exit cause is unproven. After checking that no desktop preview remained, the existing project launcher opened replacement Electron PID 18724 (window handle 329786), launcher PID 15648. Home/Smart Scan and bridge/HMR were verified again. The unrelated port 4174 preview was left alone. A controlled renderer reload had also recovered a blank original window after context HMR; no Vite restart was used. Checks against the original populated-profile Smart Scan found a separate duplicate-key defect, fixed in this recovery increment rather than hidden. Continuous Electron uptime across that interruption is not claimed.

## B — ALREADY MERGED CODEX WORK

`codex/service-workspaces-20261101` at `6d4c0c39ef010ffd1298afb6563c3359d371265b` is an ancestor of main with zero commits outstanding. Reflog/history establish the existing 19-commit fast-forward sequence, not a fresh merge by this task:

`701df54`, `d71aa8f`, `09f5e04`, `e61eb39`, `d3285a8`, `09da5cb`, `f21c8be`, `17a6d9d`, `32fff6d`, `cfbbc46`, `7a4f38c`, `dd56185`, `10d6ca7`, `e4fb466`, `bab58ca`, `2f4af0f`, `d7fc25e`, `2f7924a`, `6d4c0c3`.

Native Files/Storage/Scan/Apps/Cleanup/Startup workbenches, cancellation, identity checks, removable media, Studio scope/destination rules, Settings import, service recovery and foreground automation remain in place. Later shared Services/Repair/Automation host integrations were also retained. No older UI snapshot was substituted for them. Ancestry is integration evidence; it does not certify every live owner-file/SCM/Registry action or installed package.

All inspected local/origin refs except the PR #4 source have zero commits outside main. The exact ref SHAs and counts are in `evidence/reconciliation-20261102/preservation-inventory.json`.

## C — PR #4 VISUAL RECOVERY

[PR #4](https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer/pull/4) was OPEN/unmerged at head `c01638ddc224054a21010205e5e91be037316365`. It remains open. All six unique commits were inspected against current main:

| Commit | Intent | Content decision |
|---|---|---|
| `d2c4b89e49a8dfae82bccb0b00dd3a2fbbdfe27b` | Home day/night geometry and contrast | Preserve newer main composition, orbit, localized measured cards and bounded layout. No old fixed columns/global font override. |
| `6856007455d8008b9504e078c544d0e85fde5f7b` | Midnight Home palette | Keep current premium night surfaces; no reduction of current orbit to the old .68 scale. |
| `f00f6616fb304c9a161ecc1c8e2cf8382ca64124` | Files reference CSS | Do not import broad aside overrides or incompatible `html[data-theme=dark]` rules: current dark theme removes that attribute. Preserve live native Files. |
| `c7e9fecbbe95a5cb13764376953ac88d60aaaa42` | Studio pastel glass | Preserve current native portal and responsive stages. Old grouped surface selector leaks day styling into night; fixed geometry and forced overview stages are unsafe to import wholesale. |
| `f815c4bc347f59b3fa3bc93501481463b8cb89d7` | Settings reference dashboard | Reject early return that hides real tabs, persistence, import/review and Clipboard Vault. Do not add inert provider/permission controls or hardcoded activity. |
| `c01638ddc224054a21010205e5e91be037316365` | Theme/provider wiring | Recover functional theme intent in existing context/Appearance tab. Implement real Windows-follow mode missing from donor. Keep actual provider test state rather than treating a nonempty key as connection proof. |

All eight changed files are classified:

| Donor path under `apps/gemini-ui/src/` | Unique value / current equivalent / action |
|---|---|
| `App.tsx` | Four old stylesheet imports only; excluded to avoid duplicate cascades. Current routing, portals and native shell retained. |
| `components/home/approved-home.css` | Older palettes/geometry; later main owner-reference composition retained. Reference equality remains unapproved. |
| `pages/SettingsPage.tsx` | Existing functional implementation retained; add bilingual Day/Night/Follow Windows controls here. |
| `settings/SettingsReferenceDashboard.tsx` | Absent by design; donor has toast-only Save, inert section tabs/buttons, local-only permission toggles, fake usage/activity, and partial theme wiring. Do not introduce a dead duplicate screen. |
| `visual/files-reference-final.css` | Older incompatible global/theme selectors; not imported. |
| `visual/organization-reference-final.css` | Older geometry and partially unscoped light selectors; not imported. |
| `visual/settings-reference-final.css` | Belongs to rejected dashboard; no dead stylesheet imported. |
| `visual/settings-reference-night.css` | Same old dashboard dependency; preserve source ref, exclude runtime import. |

The adapted theme preference preserves the existing resolved `AppTheme` dark/light API and manual controls. System mode subscribes to OS color-scheme changes, persists a separate preference, migrates legacy Day/Night storage, and cleans up its media listener. Manual changes exit system mode. A denied preference write does not crash theme switching. Settings changes are immediate; existing accent/density/profile controls retain their previous behavior. No Windows personalization setting is changed.

Native screenshots: `evidence/reconciliation-20261102/before/` and `after/`, seven screens (Home, Files, Studio, Settings, Smart Scan, Repair, System), all three required actual content sizes, both themes and languages. There are also 12 Appearance captures. **Before captures used an 80ms theme delay and can show transition frames; they are not reliable settled-color reference comparisons.** The after harness waits for the actual content dimensions and 450ms theme/tab settling. Geometry and runtime evidence are separate from owner visual acceptance. Original before evidence is retained rather than relabelled.

The final after run completed at `2026-11-02T05:52:26.167Z`: 84 checked states, 96 native PNGs, zero renderer errors and zero page/horizontal overflow cases. Eight labelled contact sheets were visually inspected, alongside full-size Appearance captures. Geometry comparison matches 82/84 hero bounds; Repair AR at 1672×941 is 29px taller in both themes (native discovery content differs between observations). No Repair source/style was changed here. This difference is recorded, not labelled pixel-equivalent. Existing disabled/unmeasured states and the Files screen's explicitly labelled design fixture are visible; these captures are not proof of a populated owner-folder inventory.

## D — LOCAL WIP AND BACKUP RECOVERY

Only canonical main is registered by Git. The dormant `anima-v0-integration`, `live-organization` and `unified-20261028` directories had no non-vendor source/evidence in the scoped inspection; their folders were left intact. Stash list is empty. Reflogs and unreachable commits were inspected without checkout/reset or new refs.

The `_wip-backups/visual-sprint-20261027-095125` patch was read, including its original `de3c7d5472d1671efac787f6d71999a909ca91da` metadata. App's Repair stylesheet/reference-shell integration, Repair orbital DISM/SFC/Network/Restore/Journal controls and System empty-instrument/service-card layouts already exist in current main, with later native hosts and truthfulness improvements: **RECOVERED_OR_EQUIVALENT**, not reapplied.

The preservation inventory contains 677 source/asset records from the named scoped backup roots, with original SHA-256, normalized blob identity and current target. At its recorded baseline: 210 current byte-equivalent, 277 present in main history, 190 content-review candidates; zero read errors. **Historical blob presence proves retained history, not current behavioral equivalence.** Package/vendor files, credentials, unrelated conversations and retired executable projects were excluded.

Accepted unique native detail: the Anima incoming `startup-bridge.cjs` uses Windows basename semantics for Windows collector executable paths even on portable hosts. The one-line correction was recovered while retaining current `actionTarget` and safety controls. Existing coordinator fixtures now run with native and injected POSIX host path behavior. Replacing the fix in memory with the old behavior makes three running-process assertions fail; the fixed code passes both runs. No owner startup/Registry/service action was executed.

Other inspected families retain newer main: StorageVault restore source/vault scoping and accounting, main-process lifecycle, native Studio portal instead of the older workbench shell, and newer receipt-based ServicePipeline states instead of older read-only/fake completion copy. The overlay `candidate-triage.json` explicitly separates 54 archived PNGs, 3 newer native/lifecycle files, 6 superseded Studio files, 12 later visual/native files, one older capture harness and the accepted startup correction.

113 Anima source/test/reference records remain preserved for fine-grained review. Inspected models include explicit demo Apps data and pure dry-run automation actions; importing the alternative reference application would compete with current native workbenches. Theme intent has been adapted, but this is **not a claim that every remaining reference asset/interaction is reconciled**. Their exact source/target/hash is retained in `candidate-triage.json`. No backup was deleted or overwritten.

Of 21 unreachable commits, ten historical security-transport commits were kept local with payloads uninspected/unpublished. The other snapshot trees were checked for source blobs absent from main history: only checkpoint `96ec1ba674c98f9ae6c8f701f07a2eee837a3b18` has seven such blobs. Its Repair/Services/Smart Scan HeroFeatures, old read-only copy and shared geometry were compared to current ServicePipeline/native hosts and later bounded CSS; preserve current implementation. See `orphan-source-review.json`.

All 141 objects reachable from those commits but unprotected by current refs were preserved in an external **local-only** pack, without adding a ref/branch. Pack SHA-256 `0b20fccaf39c0c3e3699ba81462e784f3389fe10f377072ed92ee01a12a42867`, 17,247,285 bytes; `git index-pack` verified its checksum. Only the receipt is published, never the historic pack or potentially sensitive transport blobs.

Concurrent execution-control/prompt/evidence files that appeared during this work are retained and excluded from this increment's staging. They are not claimed as authored or tested here.

## E — CI AND PRODUCT QUALITY

Original Windows run 41363396551 failed `test:studio` at `5d27ec1` with `DESTINATION_LINK_REFUSED`; attempt 2 passed unchanged. Exact original cause is unproven because old helper diagnostics were discarded. Controlled cold-start failure was reproduced, then a finite 30-second initial PowerShell budget and categorical failure diagnostics were added; warm queries remain bounded at 8 seconds. Junction/offline/recall/protected-destination checks remain fail-closed. New safety suite is in Windows CI. The complete run 41393798003 passed at `0b7513f`.

Local recovery checks: `npm run lint` (TypeScript), `build`, `test:native`, `test:settings`, `test:workbench`, `test:navigation`, `test:startup` (including portable-host regression), `test:studio-safety`, `test:studio` and `test:scan` (including actual grouping-to-renderer adapter regression). Production build retains the existing >500KB chunk warning.

The original live profile exposed duplicate `system` React keys in FindingsBreakdown: presentation remapped native `storage` and `system` group IDs to one category. The adapter now preserves native group IDs, labels, counts, bytes and percentages. Tests exercise real native grouping with synthetic findings, not owner scans. Original preview Home/Smart Scan checks then reported zero errors/failed requests.

The Electron harness exercises the canonical main/preload, native status, disabled clipboard capture, actual HMR and component state, system-theme changes under emulated OS media, reload persistence, legacy migration and keyboard manual override. It neither changes Windows settings nor grants/scans an owner source. Development CSP warnings remain visible in the native test receipt. A renderer reload after context changes was needed for the original preview. Intermittent screenshot harness resize/navigation waits were corrected with explicit dimensions/language postconditions; failed attempts are not counted as completed runs.

## F — FINAL GIT REALITY

Starting SHA `0b7f5af567330ce60b23fa5afd54150140d04eac`; phase-zero published SHA `0b7513f108da9ac4a0fe52f7099e547eae2d793f`. The subsequent recovery commit, exact remote SHA and matching CI are verified after publication and reported in the delivery message; a document cannot embed its own final commit SHA before that commit exists. The staged manifest names exactly this increment's files. Unrelated concurrent files are excluded.

No blind merge, cleanup, branch/worktree creation, history rewriting, SCM/Registry action, deployment or PR closure occurred. PR #4 remains open; 113 fine-grained archive candidates and owner visual acceptance remain open. Installed/packaged effects and the broader Ultimate activation mission are **UNVERIFIED / NOT COMPLETED by this reconciliation increment**.
