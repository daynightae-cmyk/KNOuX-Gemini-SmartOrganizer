# Owner visual acceptance — Files pilot

Owner follow-up: Files was accepted as the implementation foundation and rollout to the remaining sections was authorized. The original pilot record below is retained as history. Current correction evidence and remaining fidelity differences are recorded in [SECTION_VISUAL_FIDELITY_20261027.md](SECTION_VISUAL_FIDELITY_20261027.md).

Status: **PARTIALLY VERIFIED — OWNER REVIEW PENDING**. Technical geometry and interaction checks do not certify visual reference acceptance. Work stops at Files until the owner reviews it.

## REALITY

Owned checkout: `.worktrees/visual-owner-rebuild`; branch `feat/knoux-visual-studio-rebuild-20261027`; starting HEAD `9eaa161ab8b7e81f629f69ec180021cf878f166f`. `python scripts/verify-workspace.py` returned PASS. No tracked edits existed at intake; the pre-existing untracked mission/audit files remain intact. Studio composition anchor: `d4eba0da18b02ec653a669ba0a0339071acff57f`.

## IMPLEMENTED

Files now has a bounded introduction/orbit stage, four data-backed summary tiles, searchable/filterable results and a persistent selected-file inspector. The results list scrolls within its own remaining-height track. Details, all twelve services and insights remain available through keyboard-operable inspector tabs. Filters and distribution details open bounded panels instead of extending the overview. The side/expanded workbench, service switcher, resizing, preview expansion and Studio handoff retain their actual handlers.

`files-reference.css` owns Files geometry and materials; `files-visual.css` owns typography/selection. Removed conflicting Files-only rules from `reference-polish.css` and `orbital-engine.css`. `OrbitalControl.tsx` accepts an optional core icon; other sections retain its existing default. Native hooks, providers, IPC and other pages were not modified.

## UNIQUE WORK & RISKS

No other checkout, branch, pending source, native engine or owner file was changed. Tests used disposable fixture directories and isolated Electron profiles. This is a visual pilot, not completion of effectful file organization or a production release.

The shared shell is preserved. Compared with the concepts, the implementation deliberately retains the real native-status notice, preview/permission boundaries, existing file schema, persistent footer, and real supported tools. Rename/move/delete and fabricated reference counts are not presented as working. Extra tools live in tabs; some metadata requires internal inspector scrolling. Reference spacing, table density, sidebar treatment and tool labels still differ; there is no pixel-perfect or owner-approved match claim.

## VERIFICATION

| Check | Evidence/result |
|---|---|
| Workspace verifier | PASS, correct owned branch/root/remote |
| `npm run lint` | VERIFIED; final successful run limited `GOMAXPROCS=2`, `GOMEMLIMIT=384MiB` after an earlier host-memory failure; [log](evidence/files-owner-pilot/lint.log) |
| `npm run build` | VERIFIED; 1857 modules; existing large-bundle warning remains; [log](evidence/files-owner-pilot/build.log) |
| `npm run test:files` | VERIFIED; disposable read-only scan, metadata/hash, source-preservation assertions and synthetic 100K in-memory index; not a scan of 100K owner files |
| `npm run test:workbench` | VERIFIED; 12 source-contract checks |
| Renderer viewport gate | [20 cases](evidence/files-owner-pilot/after/geometry.json): day/night, EN/AR, 1366×768 / 1672×941 / 1920×1080; effective CSS viewport/pixel-density simulation at 125% and 150%; reduced motion. This is not a change to Windows display scaling. |
| Renderer interactions | [Receipt](evidence/files-owner-pilot/interaction/checks.json): search/empty/filter/category/grid/list, inner scrolling/last-row selection, 12 services, resize, side/expanded/pin, tool switching, Escape, keyboard tabs, preview and Studio navigation |
| Actual Electron | [Receipt](evidence/files-owner-pilot/electron/checks.json): real preload/IPC with 40 disposable indexed files; actual theme asserted before screenshots; 1366/1672 day/night; native search by keyboard; isolated profile; source hash unchanged; sandbox/contextIsolation/webSecurity true, nodeIntegration false |
| Packaged/installed app, production, CI | UNVERIFIED for this local pilot |

### Fresh before/after geometry

The baseline is a separate source snapshot exported from `9eaa161`; the original and other worktrees were not edited to create it.

| Overview | Before main overflow | After main overflow |
|---|---:|---:|
| DAY 1366×768 | 2px | 0px |
| NIGHT 1366×768 | 23px; results outside intended viewport | 0px |
| DAY/NIGHT 1672×941 | 0px | 0px |

All final matrix cases also check primary block bounds, orbital label hit visibility and introduction/metric overlap. The results scroller was independently moved to its end, then the last result selected. No blanket screenshot-existence PASS is used.

## Visual review artifacts

| Section | Reference | Actual DAY/NIGHT and comparisons | Owner decision |
|---|---|---|---|
| Files | `missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/references/{day,night}/02_files-instant-search.png` | [DAY Electron comparison](evidence/files-owner-pilot/light-native-reference-vs-actual.png), [NIGHT Electron comparison](evidence/files-owner-pilot/dark-native-reference-vs-actual.png), [renderer screenshots](evidence/files-owner-pilot/after/), [DAY overlay](evidence/files-owner-pilot/light-overlay-50.png), [NIGHT overlay](evidence/files-owner-pilot/dark-overlay-50.png), [before/after 1366](evidence/files-owner-pilot/light-before-after-1366x768.png) | PENDING |
| Studio | Gold standard `d4eba0d`; unchanged | Not reworked in this pilot | No new acceptance claim |
| Home, Scan, Applications, Storage, Cleanup, Startup, System, Repair, Services, Automation, Google, Settings, onboarding | Outside the Files pilot | Untouched; no new acceptance claim | Deferred until Files owner review |

## DELIVERY

Modified and tested locally. No commit, push, PR, merge, deployment or production verification is claimed. Source/test hashes and build identity are recorded in `evidence/files-owner-pilot/source-manifest.json`.

## REMAINING GAPS

Owner review of the two actual Electron/reference comparisons is the next gate. Other sections stay untouched. Packaged/installed Windows, physical Windows DPI scaling, live owner-data acceptance and production/service activation remain separate work.
