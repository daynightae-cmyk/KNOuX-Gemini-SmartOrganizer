# KNOuX Service Workbench Host — First Integration Audit (Mission 15A)

Date: 2026-10-27
Repository: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`
Branch: `feat/gemini-missions`
Starting HEAD: `66d8808a729bae6a51b40c01a6f6e0b011b2156c`

## 1. Delivered in this increment

The reusable `ServiceWorkbenchHost` now provides:

- `side` mode in the page's trailing rail, with the originating Files register
  and footer still visible.
- `expanded` mode inside the Files main content; it covers content below the
  global titlebar and leaves the Files footer visible.
- Resizable side width (pointer + Arrow keys, 320–560 px for Files), persisted
  in `knoux.files.workbench.width`.
- Mode persisted in `knoux.files.workbench.mode`; selection/filter state stays
  in `FilesPage`, so switching modes does not discard the selected file or the
  table filters.
- Close button, Escape, focus-on-open, tool selector to switch among the 12
  Files services without leaving the workbench.
- No generic modal, no old fixture renderer host, no overlay over titlebar or
  footer.
- Files specialized bodies render inside the host. Downloads Inventory now
  shows measured totals, source label, last scan/coverage, category
  distribution, recent indexed files and Add/Rescan/Plan-in-Studio controls.

## 2. Files coverage (12/12 UI host)

All 12 `FILES_DOMAIN_SERVICES` entries open a distinct specialized body inside
the same host. Nine are measured read-only; organize preview is preview-only;
organize apply and undo remain explicitly BLOCKED with no fake control. There
is still **no real file mutation executor** in this increment.

## 3. Evidence

- `test:workbench` PASS — host modes, resize/Escape, Files integration,
  persistence, no old generic host.
- Development Electron smoke: `filesWorkbenchOk`/`filesWorkbenchLayoutOk`
  PASS; side mode keeps `files-select-all` and `files-footer`; expanded mode
  stays inside `files-workspace` and leaves the footer visible; Escape closes.
- Packaged `win-unpacked` smoke: same checks PASS.
- Screenshots: `files-workbench-dev.png` (side) and
  `files-workbench-expanded-dev.png`; packaged equivalents.
- CI run `40399994447` (Files) and `40409858626` (Studio) are SUCCESS.

## 3b. Studio integration (9/9 stages)

Studio now has a typed side/expanded stage workbench:

- "Pin stage workbench" moves the active one of the nine stage workspaces into
  the host beside a persistent workflow context pane (stage progress, source,
  selected files, destination/operation, native plan state and preview action).
- Expanding returns the stage to the full main canvas; Escape/close also
  returns to the expanded stage. Mode/width persist; source paths are
  shortened to the last two segments for privacy.
- The global Studio titlebar, stage bar and footer remain visible in side mode.
- `studioWorkbenchOk`/`studioWorkbenchLayoutOk` PASS in dev and packaged smoke;
  side/expanded/1366/Escape checks pass. `test:workbench` covers the host,
  Files and Studio.
- Screenshots: `studio-workbench-dev.png`, `studio-workbench-expanded-dev.png`,
  `studio-workbench-1366-dev.png` and packaged equivalents.

## 3c. Storage integration (12/12 tools)

Storage's 12 tools now open in the same host as a pinned fixed side dock
(340–680 px, persisted), with the Volume Atlas still visible, and expand inside
the app content while leaving the footer visible. The body uses the existing
measured `StorageServiceFocus` with real volume/capacity, large-file,
duplicate-verification, treemap, folder, type, coverage and history evidence.
Fragmentation, SMART, reclaim execution and drive-type classification remain
explicitly unsupported/blocked.

`storageWorkbenchOk`/`storageWorkbenchLayoutOk` PASS in dev and packaged smoke;
screenshots `storage-workbench-dev.png` / `storage-workbench-expanded-dev.png`
and packaged equivalents. CI is recorded in the mission ledger.

## 3d. Smart Scan integration (10/10 measured services)

Smart Scan's ten capability services open in a pinned fixed side dock
(340–720 px, persisted in `knoux.scan.workbench.mode|width`) with the measured
overview, service tiles, findings, recent scans and command bar still visible.
Expanded mode fills the content above the command bar. Bodies reuse
`ScanServiceWorkspace` in an `embedded` mode: each service keeps its measured
renderer plus a real Run/Re-measure control, source/index prerequisite text and
the Mission 08 cleanup gate for the junk service. No scan service can delete,
repair or write.

The initial route navigation was hardened in the smoke after a run reproduced
the page remaining on a previously visited route; the probe now forces a
`home` hash before `smart_scan` and waits for a visible tile and mounted host.
This is a test-harness fix, not a relaxation of product assertions.

`scanWorkbenchOk`/`scanWorkbenchLayoutOk` PASS in dev and packaged smoke;
screenshots `scan-workbench-dev.png` / `scan-workbench-expanded-dev.png` and
packaged equivalents.

## 3e. Applications integration (12/12 measured services)

Applications' twelve services open in the same host as a pinned side dock
(360–760 px, persisted in `knoux.apps.workbench.mode|width`) while the measured
register and dossier remain visible. The embedded `AppServiceWorkspace`
preserves every existing real control: inventory KPIs/coverage, Authenticode
verification, multi-parameter search, publisher evidence, date filters,
immutable uninstall review plan, bounded leftover measurement, bounded WinGet
feed, footprint measurement with cancel, package rows, association sampling and
startup evidence. Uninstall/update/association/startup writes remain blocked.

The smoke waits for measured register rows before opening the workbench so the
side/expanded evidence shows real inventory instead of an in-flight loader.
`appsWorkbenchOk`/`appsWorkbenchLayoutOk` PASS in dev and packaged smoke;
screenshots `apps-workbench-dev.png` / `apps-workbench-expanded-dev.png` and
packaged equivalents.

## 4. Honest limits / next

- Cleanup, Startup, System, Repair, Services, Automation, Workspace, Settings
  and Home still use their existing specialized panels/modal sheets and must be
  migrated next.
- No file apply/undo or application uninstall/update executor was added; those
  remain blocked.
- No real user file, account, service, registry, startup, Windows setting or
  paid API was touched.

## 5. Release record

Files committed at `578f7fac5494d10f929786164d4ba2b041307b48`; Studio
at `62e3ce6d5bcc97993f8e4a5d78dbafdf02a9cd4c`; Storage at
`3e3f16c`. Smart Scan and Applications are committed at `9b582e3`; CI run
`40428396212` is SUCCESS and `main` was merged at `af00af6` with an identical
tree. Earlier CI runs `40399994447` and `40409858626` are also SUCCESS.
Per-increment records live in `missions/MISSION_SEQUENCE_PROGRESS.md`.
