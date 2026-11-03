# KNOuX SmartOrganizer — Volume 8: Current-Reality Reconciliation (corrected 2026-11-03)

> **NEWER DIRECT WINDOWS SNAPSHOT — 2026-11-03 04:30:48 +04:00**: Local `main` advanced again to **`0c853c9a66fb6e39317c0c13dc22d89aec62f995`**, adding `feat(storage): integrate native atlas workspaces and scoped scan state`. It is **8 commits ahead** of independently observed GitHub `main` at `8871103…`; **8** tracked modified paths and **3,106** untracked paths were observed. Current active WIP is **Home + Startup**, not Storage. `storage-main-verified.json` records 7 check groups with `ok: true`, and the exact-SHA `storage-main-sha-runtime/proof.json` was inspected: `head=0c853c9…`, `ok=true`, 7 check groups, 0 errors; scoped to actual StorageBridge and Files indexing over disposable authorized folders + actual Windows volume reads. **No owner-file mutation, Optimize/TRIM, defrag, eject, clipboard or Settings launch was performed.** Current snapshot is still subject to later agent commits; always recheck HEAD. No production packaging claimed.

> **OLDER LIVE-SNAPSHOT AMENDMENT (2026-11-03 04:20 +04:00).** The original audit below examined a source snapshot at `ef25624`. At a subsequent direct read of the authorized Windows repository, local `main` HEAD was `11875da98b460ecc4ac28fcee1ff9ee14d0790d7` (seven commits ahead of the last verified remote `8871103c7fd2a274a70fe2a069bb435f2ccb12ac`), with eight modified tracked files and 3,117 untracked paths. The new commit is `feat(cleanup): integrate measured service workspaces and scope controls`. Existing exact-SHA evidence for Smart Scan, Files, Studio, Applications and Repair remains attributable to its own historical SHA. Cleanup has a local committed UI integration with `cleanup-main-verified.json` and earlier `cleanup-native-ui-v2/proof.json`; no owner-file mutation or packaged production proof is implied. Current Startup and Home changes are dirty WIP and belong to their active agent. **The original snapshot counts, WIP references and evidence claims below are historical; never use them as up-to-the-minute truth.** See `01_LIVE_REPOSITORY_REALITY.md`, `02_CORRECTION_REGISTER.md`, and the final execution prompt first. No test was run afresh by the documentation pack author.


**Baseline.** Local `main` HEAD `ef25624bbf40a915aa38ca27e62b9263755982b3` (snapshot 2026-11-03T03:50:42+04:00, non-atomic: another agent is writing). Remote `origin/main` = `8871103c7fd2a274a70fe2a069bb435f2ccb12ac`. Local is **six commits ahead**, with **10 modified tracked files** and **2 903 untracked paths**. Four worktrees exist (one `prunable`).

**Nature of this document.** It corrects the specification from the supplied CurrentSource (436 files, 1 excluded by secret signature), the manifest, the six exact-SHA proof receipts and the 181-row reconciliation CSV. **It reports no runtime result of its own.** Where the package contains no proof, the status is `NOT VERIFIED` — never `FAILED`, never `COMPLETE`. Nothing here claims packaged-installer, production, owner-data or Windows-VM acceptance.

---

# Part A — Source-of-truth precedence and what this volume overrides

## A.1 Precedence (highest first)
1. Current source at the exact commit/working tree **plus** a native runtime receipt at an exact SHA.
2. Current source without a receipt (status: `SOURCE_PRESENT`, proof: `NOT VERIFIED`).
3. This Volume 8.
4. Volumes 1–7, `00_front_a/b.md`, `d01…d14.py`, `gen.py` — **requirements text only**, never status.
5. Historical ledgers (`LIVE_SERVICE_EXECUTION_STATUS_181.csv`, `SERVICE_WORKSPACE_IMPLEMENTATION.csv`, registry 2026-10-26): **identity of the 181 services only**.

## A.2 Statements in earlier volumes that are now wrong or conflicting (all superseded)
| Earlier statement | Correction |
|---|---|
| Snapshot HEAD `8ff81311…`; "2 commits on local main absent from origin"; "5 modified tracked files" | Original audit HEAD `ef25624…` with 6 local commits, 10 modified files, and 2,903 untracked at snapshot; subsequent observed local HEAD `11875da…` with 7 commits, 8 modified files, 3,117 untracked. Confirm anew at execution time. `8ff8131` is now one of five integration commits, not HEAD. |
| `docs/LIVE_SERVICE_EXECUTION_STATUS_181.csv` is the "source of truth for IDs" and drives priority ("Not implemented / Preview-only first") | Identity only. Status comes from this volume's matrix. 157 `NOT_REASSESSED` rows are **not** "not implemented". |
| 89 `UNASSESSED` / 39 `READ_ONLY` in `SERVICE_WORKSPACE_IMPLEMENTATION.csv` | Predates the last six commits; replaced by Appendix 1. |
| Smart Scan, Files, Studio, Applications, Repair Lab "workspaces to be built" | They exist, with exact-SHA Electron receipts (Part C). Codex **audits and closes gaps**; it does not rebuild. |
| Organization Studio engine needs building / re-verifying from scratch | `operation-engine.cjs`, `operation-ipc.cjs`, `studio-bridge.cjs` exist; 40 real fixture moves + 40 hash-verified restores at `8cf9d96`. **Do not recreate.** |
| Startup (D09) and Services (D12) are read-only / need executors | `startup-actions.cjs` (HKCU Run disable/restore) and `service-actions.cjs` (third-party start/stop) exist with mock-verified tests. The correct gap is **live effect proof + UI reasons + the unimplemented siblings**. |
| Automation is plan-only | Runner executes observation-only Smart Scan nodes; scheduler arms occurrences (virtual-clock tested). Mutation nodes remain gated. |
| Cleanup (D08) is wholly future work | Read-only coordinator + Vault hand-off exist; **committed native-UI work at `11875da`** with eight-group read-only proof at exact SHA and an earlier receipt at `ef25624`. |
| Google Workspace "all ten connectors absent / only Sheets planned" (ambiguous) | Traced: only `spreadsheets.readonly` + identity scopes are wired. Services 04-02…04-10 are absent by **scope/channel/provider trace**, not by string search. |
| Branch strategy that starts from remote `main` or the older checkout | **Forbidden.** Start from local `main` @ `ef25624` and its dirty tree (Part B). |
| Any instruction to merge, rebase onto `origin/main`, reset, clean, stash-drop, or force | Removed. See Part B hard rules. |

## A.3 Evidence-distinction rules (binding on Codex and on every status cell)
- Exact-ID string absence ≠ missing feature (44 CSV rows have no literal ID hit; D01/D02/D14 are mostly implemented under other symbols). Trace catalogs, routes, operation IDs, preload calls, providers, journals, tests, postconditions.
- Exact-ID string presence ≠ execution proof (137 rows have hits).
- UI component present ≠ native executor present.
- Read-only diagnostic or immutable preview ≠ executed Windows repair.
- `IMPLEMENTED_AND_TESTED_FIXTURES` ≠ packaged Windows acceptance.
- Mock-registry/mock-SCM success ≠ live OS effect.

---

# Part B — Mandatory preservation protocol (corrected, supersedes old bulk-backup instructions)

**Evidence-only observation first.** Run `git rev-parse HEAD`, `git rev-parse origin/main`, `git status --porcelain=v1 -uno`, `git ls-files --others --exclude-standard`, `git worktree list --porcelain`, `git branch -avv`, `git stash list`, and recent log. Do not modify the canonical checkout while its owner is active. The 04:30 observed HEAD `0c853c9…` is a **historical baseline, not a condition Codex should force to match**.

**Current snapshot ownership:** Eight local-main-only commits through `0c853c9`; eight dirty tracked files (theme-evidence-matrix script, Home search/page, Startup page/PlanGate/ServiceRail, mission ledger, one approved Smart Scan PNG) and thousands of untracked evidence/checkpoints. Cleanup was COMMITTED at `11875da` and Storage at `0c853c9`; neither should be described as uncommitted simply because older snapshots had WIP. Worktree `C:/KNOuX-OpenHands-NativeServices` was **marked prunable** in Git metadata but its path was absent when checked. Never prune or remove it until unique work and ownership are fully assessed. Two other OpenHands worktrees remain listed.

**Safety-net policy — capacity-aware and non-destructive:** Before ANY repository operation, inspect available storage and existing verified checkpoints, identify unique uncommitted and untracked work by ownership, and choose the smallest verifiable preservation method. Prefer existing checksummed archives for unchanged historical evidence, streaming hashes/inventory for large untracked trees, and a scoped `git diff --binary` copy (including only explicitly owned files) saved outside the repo when needed. Optional `git bundle` on committed refs is useful **only after checking free space**; it does not preserve untracked files or dirty changes. Do **not** automatically archive all untracked files, and do **not** create an annotated tag on main or any reference without evaluating ownership/collisions. No broad zip without size estimates, sufficient storage and an integrity check. No forced cleanup even when disks are low.

**Isolated worktree procedure (already executed successfully; do NOT redo while the branch exists):** From a clean committed local-main HEAD that contains the latest reviewed integrated features, create an unused branch named `codex/knoux-all-services-20261103` (or suffix if taken) with `git worktree add -b <new-branch> <new-path> <verified-local-HEAD>`. The path should be outside every existing checkout, e.g. `C:/KNOUX-Codex-AllServices-20261103`, after verifying no path/branch collisions and sufficient space. The command must be run only if Codex truly has the authorized local repo and there is no other agent claiming that destination. **Never switch branch in dirty canonical main.** A new worktree contains only committed files; it does **not** include Home/Storage uncommitted work or untracked assets. Preserve and respect their ownership, then deliberately integrate those changes after their owners safely commit them, with reviewed diffs and regression tests.

**No destructive operations:** No `reset --hard`, `clean`, worktree/branch deletion, prune, force-push, history rewrite, replacing the canonical working tree, overwriting files owned by other agents, or automatically merging into main. Existing branches may contain unique work even if stale. Do not create a competing frontend or duplicate native engines. Keep all work confined to the new worktree/branch. If two agents need the same file, coordinate and work on an independently safe task instead.

**Verification:** The new Codex worktree was actually created and verified on 2026-11-03 at 04:35: `C:/KNOUX-Codex-AllServices-20261103`, branch `codex/knoux-all-services-20261103`, HEAD `0c853c9`; **reuse rather than recreate**. Record current path, branch, HEAD, `git status`, and the relationship to local `main` and `origin/main`. Capture baseline tests as `NOT RUN` if not executed; no automatic production declarations. Read `00_CODEX_EXECUTION_PROMPT_FINAL.md`, `01_LIVE_REPOSITORY_REALITY.md`, and `02_CORRECTION_REGISTER.md` before following service instructions below.

---

# Part C — Verified implementation evidence (current source + exact-SHA receipts)

| Domain | Commit | Receipt (EvidenceRecent/docs/evidence/inner-workspaces-20261102/…) | Checks | What the receipt shows | What it does NOT show |
|---|---|---|---|---|---|
| Smart Scan | `8ff8131` | `scan-main-sha-runtime/proof.json` | 18 | 10 services with native evidence on a disposable fixture, cancellation events, missing-scope recovery, real session export | owner data, installer, full coverage |
| Files | `518ec7f` | `files-main-sha-runtime/proof.json` | 11 | native index (44 rows), query, metadata/hash/empty-folder, cancel, `fixtureUnchanged=true` | any mutation, installer |
| Studio | `8cf9d96` | `studio-main-sha-runtime/proof.json` | 9 | 9 workspaces; **40 real moves + 40 verified restores; hashes restored** | owner data, packaged app, per-stage crash tests |
| Applications | `e86fbf6` | `apps-main-sha-runtime/proof.json` | 8 | 148 real rows (52 registry + 96 AppX), Authenticode, associations, packages, bounded size + cancel, immutable plan + real export | install/update/uninstall, elevation |
| Repair Lab | `ef25624` | `repair-main-sha-runtime/proof.json` | 7 | real read-only discovery (identity/servicing/network/update/restore), 12 immutable previews | any DISM/SFC/reset/restore execution |
| Cleanup | `ef25624` (WIP) | `cleanup-native-ui-v2/proof.json` | — | read-only CleanupBridge discovery (141 candidates; 1 root scanned, 1 unavailable) + Vault hand-off | committed code; any owner-file effect |

Domains **without** a post-archive receipt in the package: Home, Google, Storage, Startup, System/Network/Hardware, Services, Automation, Settings/AI → `NOT VERIFIED`.

## C.1 The real executors that already exist (Codex reuses; never duplicates)
| Engine (file) | Effect | Gate | Verified by |
|---|---|---|---|
| `operation-engine.cjs` + `operation-ipc.cjs` | move/copy with journal, hash verify, undo (`operations:v1`) | planHash + native confirm | Studio receipt (real fixture), `studio-exec-test` |
| `storage-vault.cjs` | reversible same-volume quarantine/restore (`cleanup-quarantine-v1`) with keeper witness check | planHash + native confirm | `storage-vault-*` scripts (historical) |
| `startup-actions.cjs` | disable/restore HKCU `Run` value | planHash, 5-min expiry, native confirm, receipt-before-mutation, DPAPI receipts | `startup-actions-test` (mock registry) |
| `service-actions.cjs` | start/stop signed non-Microsoft third-party service | same + protection policy, no cascade/force | `service-actions-test` (mock SCM) |
| `automation-runner.cjs` / `automation-scheduler.cjs` | observation-only Smart Scan runs; per-occurrence-consent schedules | exact-plan approval | runner/scheduler tests (virtual clock) |
| `google-auth.cjs` | PKCE connect/disconnect; Sheets read-only | browser consent | `google-oauth-test` (offline) |
| `clipboard-vault.cjs` | DPAPI clipboard vault | settings | `clipboard-electron-test` (excluded from snapshot) |

**Capabilities that do NOT exist anywhere in source (traced):** app install/update/uninstall; any DISM/SFC/ipconfig/netsh/restore-point execution; hosts write; Task-Scheduler/service-policy writes; Recycle-Bin empty; Windows-Update-cache purge; permanent purge of quarantine; Optimize/TRIM; notification delivery; backup executor; elevation helper (SP-07); AI provider proxy; Gmail/Tasks/Forms/Contacts/Calendar/Picker/Slides/Chat/Classroom.

## C.1a How the "does not exist" list was verified
Searched `electron/`, `src/`, `shared/` for: Notification constructors, `RunAs`/elevation, `SHEmptyRecycleBin`/`Clear-RecycleBin`, scheduled-task create/change/disable, `Optimize-Volume`, `Set-Service`/`sc config` writes, hosts writes, and WinGet `install`/`uninstall`/`upgrade --id`. Result: **no executing call sites**. The only hits are descriptive provider labels or previews (`repair-providers.cjs` lists `DISM.exe …/CheckHealth`, `sfc.exe /scannow`, `ipconfig.exe /flushdns` as *provider descriptors*; `app-bridge.cjs` runs `winget upgrade --include-unknown --disable-interactivity` and `winget search` as **read queries** and never accepts source agreements). `repair-bridge.cjs` has a generic `runExe`/`runFile`: Codex must confirm by call-site audit that every caller is a read-only query before relying on this, and must add a regression test that fails if a mutating argument (`/scannow`, `/RestoreHealth`, `/flushdns`, `reset`, `uninstall`) is passed to it without the future executor path.

## C.2 Security finding requiring immediate action
`SettingsPage.tsx` keeps the AI key in renderer memory (`src/lib/ai-session.ts`) and performs `fetch` to the provider with `Authorization: Bearer` from the renderer. This violates "tokens only in Main" (SP-08). See service D14.02 and Part E gate G-S1.

## C.3 External authorization and source-inspection dependencies (do not guess)
1. `scripts/clipboard-native-test.cjs` was excluded from a previous sharing snapshot because it matched a token-like pattern. Codex must inspect the local file safely in place (no printing matched secrets), distinguish a fixture from a credential, and report any actual exposure; owner input is not required merely to inspect a test fixture.
2. `docs/evidence/home-search-recovery-20261102` had 97 paths in the prior source handoff and was not included in that archive. Codex should inspect the current local checkout and verify actual artifacts/runs before changing Home 01-09; it must not infer failure or missing capability from omitted archive files.
3. RESOLVED: `system/catalog.ts` was directly checked and has 36 service ID declarations matching all 36 D10 rows. Earlier claim of 39 was a counting error; no owner answer required.
4. Blockers B-G1/B-G2 (Google verification, live consent), B-S2 (disposable Windows VM) are owner-held.

---

# Part D — Domain chapters (current source-backed)


## D01 — Home (12 services)

- **Proof:** `NONE_IN_PACKAGE` — SHA `none in package`.
- **UI / workspace:** src/components/home/{ApprovedHomeScreen,HomeCommandCenter,HomeDashboardPanels,HomeOrbit,RecoveredHomeOrbit}.tsx; src/pages/HomePage.tsx (MODIFIED, uncommitted); src/lib/home-ui.ts
- **Native provider:** no dedicated bridge; reads via system-bridge.cjs / services-bridge.cjs summaries and the per-domain *Summary IPC (systemSummary, servicesSummary), src/home/{live,native-read,snapshot,derive,search,search-history,provider-result}.ts (search.ts MODIFIED, uncommitted)
- **IPC / contract symbols:** systemSummary, servicesSummary, storageVolumes, scanHistory, cleanupReport, startupImpact (read-only reuse of domain channels)
- **Existing tests / receipts:** scripts/home-live-test, home-provider-test, home-integration-electron, home-search-electron, home-anima-electron; tests/home/*
- **Real execution capability:** No executor; Home only navigates and shows measured values (boundedHomeRead has a 20 s availability deadline, not progress).
- **Consent / privilege:** None required (read-only). Any hand-off opens the owning domain, which owns consent.
- **Missing runtime / packaged proof:** No exact-SHA runtime receipt in the package. docs/evidence/home-search-recovery-20261102 (97 untracked files) exists on the owner machine but was NOT supplied; HomePage/search.ts are dirty. => NOT VERIFIED.
- **State counts:** SOURCE_PRESENT_READ_ONLY = 12

### D01.01 — Smart Scan (`mission-01-01`, class B)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** NAVIGATION_AND_MEASURED_READ · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Card value must derive from the latest persisted ScanBridge session (scanHistory) and show `not measured` when none exists.
- **Missing integration:** Route to Smart Scan; no scan is started from Home without opening the workspace.
- **Codex instruction:** Trace HomePage.tsx -> src/home/derive.ts for the Smart Scan card. Bind value to scanHistory; delete any literal fallback number. Do not touch HomePage.tsx/search.ts hunks already modified in the working tree - extend them.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D01.01-1 No scan history -> card shows `not measured`, no digits.
  - AT8-D01.01-2 After a fixture scan the card equals the session counts; restart restores it with its sample time.
  - AT8-D01.01-3 Click opens Smart Scan with the session focused.

### D01.02 — Organize Files (`mission-01-02`, class B)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** NAVIGATION_AND_MEASURED_READ · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Card must reflect Studio journal (operations history) not a mock count.
- **Missing integration:** Open Studio; never execute from Home.
- **Codex instruction:** Bind to operations:v1 history (receipt count, last status). Reuse the Studio model; add no second counter.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D01.02-1 Empty history -> `no operations`.
  - AT8-D01.02-2 After one fixture move the card shows 1 completed receipt matching Studio History.
  - AT8-D01.02-3 Home exposes no execute/undo control (channel assertion).

### D01.03 — Applications (`mission-01-03`, class B)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** NAVIGATION_AND_MEASURED_READ · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Count must come from appsInventory coverage (registryItems + appxItems), with `partial` shown when sourceFailures>0.
- **Missing integration:** Open Applications.
- **Codex instruction:** Read appsInventory through the existing native client; show coverage state, not just a number.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D01.03-1 Count equals Applications register total for the same snapshot.
  - AT8-D01.03-2 Inject a source failure -> Home marks partial.
  - AT8-D01.03-3 Browser (no native) -> `unavailable`, no invented apps.

### D01.04 — Storage (`mission-01-04`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** NAVIGATION_AND_MEASURED_READ · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Volumes/free-space from storageVolumes only.
- **Missing integration:** Open Storage.
- **Codex instruction:** Use storageVolumes; label removable vs fixed from the provider.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D01.04-1 Volume list equals Storage Volume Bays.
  - AT8-D01.04-2 Unknown capacity -> `unknown`, not 0.
  - AT8-D01.04-3 Click opens Storage Volume Bays.

### D01.05 — Cleanup (`mission-01-05`, class B)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** NAVIGATION_AND_MEASURED_READ · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Cleanup card is in the dirty tree: reconcile with the uncommitted Cleanup WIP before changing it.
- **Missing integration:** Open Cleanup; candidate bytes are estimates, never "freed".
- **Codex instruction:** Do not overwrite working-tree edits to CleanupHero/PlanGate; bind to cleanupReport/cleanupEstimate with `estimated` label.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D01.05-1 Card text says `estimated` and never `freed`.
  - AT8-D01.05-2 No candidates -> `no candidates measured`.
  - AT8-D01.05-3 Opening Cleanup preserves the active session.

### D01.06 — Startup Control (`mission-01-06`, class B)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** NAVIGATION_AND_MEASURED_READ · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Startup count must equal startupInventory; no impact claim without boot evidence.
- **Missing integration:** Open Startup.
- **Codex instruction:** Bind to startupInventory/startupImpact; `not measured` when no boot evidence.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D01.06-1 Count equals D09-01 register.
  - AT8-D01.06-2 No boot evidence -> impact `not measured`.
  - AT8-D01.06-3 No write channel from Home.

### D01.07 — System Live Pulse (`mission-01-07`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** NAVIGATION_AND_MEASURED_READ · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Live pulse values must come from systemSample with sample time; no synthetic jitter.
- **Missing integration:** Open System.
- **Codex instruction:** Bind pulse to systemSample/systemSummary; show stale age when the last sample is old.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D01.07-1 Sample older than threshold -> stale label.
  - AT8-D01.07-2 Provider failure -> `unavailable`, not zero.
  - AT8-D01.07-3 Values equal System Pulse for the same sample id.

### D01.08 — Repair Lab (`mission-01-08`, class B)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** NAVIGATION_AND_MEASURED_READ · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Card must reflect repairJournal/repairSnapshot; Home must not imply any repair ran.
- **Missing integration:** Open Repair Lab.
- **Codex instruction:** Bind to repairSnapshot coverage; copy states `read-only evidence`.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D01.08-1 No repair command exists in Home IPC calls.
  - AT8-D01.08-2 Journal empty -> `no repairs recorded`.
  - AT8-D01.08-3 Coverage keys equal Repair Lab identity/servicing/network/update/restore.

### D01.09 — Global Search (`mission-01-09`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** MEASURED_READ (WIP: search.ts MODIFIED) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Global Search scope must be explicit: workspace routes + services + authorized-file index (filesInventoryQuery); historic note said global indexed search was not implemented - verify the dirty search.ts/search-history.ts state before editing.
- **Missing integration:** Results route to the owning service; file hits open Files metadata.
- **Codex instruction:** Read src/home/search.ts and the uncommitted diff first. Keep one index: the Files authorized-source inventory. Add no second indexer. Persist search history locally and clearable.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D01.09-1 Query hits a service name, a route and an authorized file in one result list with typed groups.
  - AT8-D01.09-2 No authorized source -> file group shows `no authorized sources`, not empty-as-zero.
  - AT8-D01.09-3 Cancel/clear history removes persisted entries.
  - AT8-D01.09-4 Arabic query and RTL layout render correctly.

### D01.10 — KNOuX Insight (`mission-01-10`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** MEASURED_READ · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Insights must be deterministic rules over persisted evidence with evidenceRefs; no model call.
- **Missing integration:** Each insight links to exactly one owning service.
- **Codex instruction:** Implement/verify a versioned rule list in src/home/derive.ts; each rule cites evidence ids; no AI call.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D01.10-1 Remove the evidence -> insight disappears.
  - AT8-D01.10-2 Insight text cites evidence id and rule version.
  - AT8-D01.10-3 No network call (egress spy = 0).

### D01.11 — Recent Activity (`mission-01-11`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** MEASURED_READ · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Recent Activity must merge operations history, startup/service/automation receipts and scan history with true timestamps.
- **Missing integration:** Entries link to receipts in the owning journal.
- **Codex instruction:** Aggregate read-only from operations:v1 history, startupReceipts, serviceReceipts, automationRunReceipts, scanHistory.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D01.11-1 Entries sorted by real timestamps across 4 journals.
  - AT8-D01.11-2 Unreadable receipt shows `unreadable`, not hidden.
  - AT8-D01.11-3 Click opens the owning journal row.

### D01.12 — Pending Safe Actions (`mission-01-12`, class B)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** REVIEW_ONLY_NO_EXECUTOR · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Pending Safe Actions lists prepared-but-unapplied plans/receipts (status prepared/uncertain/interrupted) and recovery offers; it must never apply.
- **Missing integration:** Route to the owner (Startup/Services/Studio/Vault) where approval lives.
- **Codex instruction:** Source from startupReceipts/serviceReceipts (recoveryAvailable) and operations history (interrupted); no apply control.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D01.12-1 A `prepared` startup receipt appears with a link to Startup recovery.
  - AT8-D01.12-2 No apply/approve control exists on Home (channel assertion).
  - AT8-D01.12-3 Expired plans are not listed as actionable.


## D02 — Smart Scan (10 services)

- **Proof:** `DOMAIN_RUNTIME_PROOF` — SHA `8ff8131`.
- **UI / workspace:** src/smart-scan/{ScanServiceWorkspace,ScanStageConsole,ScanReviewInspector,ScanCommandBar,ScanLiveStage,ScanResults,ScanServices}.tsx + service-renderers/{QuickScan,DeepScan,DuplicateFinder,LargeFiles,JunkCleaner,PrivacyTrace,StartupImpact,AppHealth,SystemHealthPulse,SmartRecommendations}Renderer.tsx
- **Native provider:** electron/native/scan-bridge.cjs (ScanBridge, 75 KB)
- **IPC / contract symbols:** scanCapabilities, scanSources, scanSourceChoose, scanSourceIndex, scanStart, scanCancel, scanStatus, scanHistory, scanEvent
- **Existing tests / receipts:** scripts/scan-native-test, scan-inner-evidence, scan-transfer-review-test, scan-owner-fullstack-capture; proof: scan-main-sha-runtime/proof.json (18 checks incl. native-service-<each of 10>, cancellation events, missing-scope recovery, export of actual session report)
- **Real execution capability:** Read-only measurement. One real hand-off: Large Files -> Studio transfer review (scan-transfer-review-test: native scan -> selected plan -> move 1 -> Undo, seven files preserved).
- **Consent / privilege:** Folder authorization via native chooser; no mutation, no elevation.
- **Missing runtime / packaged proof:** Proof ran on a disposable fixture with native Windows observations; coverage may be partial/unsupported per capability; no owner-data run; not packaged-installer proof.
- **State counts:** READ_ONLY_PLUS_HANDOFF = 4, SOURCE_PRESENT_READ_ONLY = 6

### D02.01 — Quick Scan (`mission-02-01`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Verify bounded depth/time for quick, explicit coverage object (seen/skipped/errors) and that results never imply whole-disk coverage.
- **Missing integration:** Persisted session shared with Home 01-01 and Insight 01-10.
- **Codex instruction:** Audit scan-bridge.cjs quick profile; add missing coverage fields only; do not add a second walker (use the existing one).
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D02.01-1 1 000-file fixture: counts equal independent walk.
  - AT8-D02.01-2 Junction + denied directory appear in skipped with reasons.
  - AT8-D02.01-3 Cancel at 30% -> `cancelled` with partial labelled; restart restores session.

### D02.02 — Deep Scan (`mission-02-02`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Deep profile: confirm long-path (>260) and locked-file handling, memory ceiling and hash-only-on-size-equal rule.
- **Missing integration:** Shares the session model with quick.
- **Codex instruction:** Audit deep branch of scan-bridge.cjs; add tests for 270-char path and locked file; do not rewrite the engine.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D02.02-1 270-char path scanned; locked file in skipped(E_LOCKED).
  - AT8-D02.02-2 Hash invoked only for size-equal candidates (count assertion).
  - AT8-D02.02-3 Cancel leaves 0 worker processes.

### D02.03 — Duplicate Finder (`mission-02-03`, class B)
- **Implementation:** `READ_ONLY_PLUS_HANDOFF` · **Execution:** READ_ONLY+HANDOFF · **Proof:** `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Confirm byte-exact pipeline (size -> partial hash -> full SHA-256) and the fingerprint-carrying hand-off to the Vault (D07-03); no keeper heuristic that deletes.
- **Missing integration:** Hand-off must open the owning service with the selection preloaded; the owner re-validates everything. Target: D07-03 vault plan.
- **Codex instruction:** Verify DuplicateFinderRenderer hand-off payload; wire to storage-vault vaultPlan selection with fingerprints.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D02.03-1 3 identical + 1 same-size different file -> one group of 3.
  - AT8-D02.03-2 Member modified before vaultPlan -> refused (fingerprint).
  - AT8-D02.03-3 No delete channel reachable from the workspace.

### D02.04 — Large Files (`mission-02-04`, class A)
- **Implementation:** `READ_ONLY_PLUS_HANDOFF` · **Execution:** READ_ONLY+HANDOFF (Studio transfer review, tested) · **Proof:** `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Existing: selection + Studio hand-off (scan-transfer-review-test exit 0 historical). Missing: ranking equality with D06-10 and D07-02; packaged re-run.
- **Missing integration:** Hand-off -> Studio plan (do NOT rebuild transfer logic).
- **Codex instruction:** Add a shared ranking function used by Smart Scan, Files and Storage; add cross-service equality test.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D02.04-1 Same scope -> identical top-N in Smart Scan, Files and Storage.
  - AT8-D02.04-2 Source replaced between scan and hand-off -> Studio refuses.
  - AT8-D02.04-3 Old approval invalid after new hand-off.

### D02.05 — Junk Cleaner (`mission-02-05`, class C)
- **Implementation:** `READ_ONLY_PLUS_HANDOFF` · **Execution:** READ_ONLY+HANDOFF · **Proof:** `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Junk is an allowlist with rule IDs and protected-location exclusion; hand-off to Cleanup (D08-01); no clean-now button.
- **Missing integration:** Hand-off must open the owning service with the selection preloaded; the owner re-validates everything. Target: D08-01.
- **Codex instruction:** Verify rule catalog versioning in scan-bridge.cjs; ensure Cleanup recomputes independently.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D02.05-1 Temp fixture files carry the right ruleId; protected path excluded and listed.
  - AT8-D02.05-2 No delete/quarantine IPC reachable.
  - AT8-D02.05-3 Cleanup recomputes and flags differences.

### D02.06 — Privacy Trace Check (`mission-02-06`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Privacy trace is metadata-only: confirm existence/size/age only and zero content reads; `not present` vs `0`.
- **Missing integration:** Links to D08-09 and Clipboard Vault.
- **Codex instruction:** Add a read-spy test; document the trace catalog.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D02.06-1 Content-read count = 0 (spy).
  - AT8-D02.06-2 Missing location -> `not present`.
  - AT8-D02.06-3 Partial scope disclosed.

### D02.07 — Startup Impact (`mission-02-07`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Must reuse D09 inventory/impact (startupInventory, startupImpact) - verify no second registry reader.
- **Missing integration:** Counts equal D09-01 and D05-12.
- **Codex instruction:** Replace any duplicate collector with calls to startup-bridge read APIs.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D02.07-1 Counts equal D09-01 and D05-12.
  - AT8-D02.07-2 No boot evidence -> `not measured`.
  - AT8-D02.07-3 No write channel.

### D02.08 — App Health (`mission-02-08`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Indicators limited to obtainable facts (missing install dir, bad uninstall target, invalid signature, orphan AppX); no health score.
- **Missing integration:** Reuse appsInventory/appsSignature.
- **Codex instruction:** Verify AppHealthRenderer consumes app-bridge facts; remove any composite score.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D02.08-1 Missing install dir flagged with evidence.
  - AT8-D02.08-2 Signed fixture not flagged.
  - AT8-D02.08-3 No composite score string in UI.

### D02.09 — System Health Pulse (`mission-02-09`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Must call System providers (events, drivers, disk, memory) not re-implement; no overall score.
- **Missing integration:** Counts equal D10-02 for the same window.
- **Codex instruction:** Verify SystemHealthPulseRenderer reads system-bridge.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D02.09-1 Events fixture shows window + count.
  - AT8-D02.09-2 Access denied -> `unavailable` with reason.
  - AT8-D02.09-3 No score rendered.

### D02.10 — Smart Recommendations (`mission-02-10`, class B)
- **Implementation:** `READ_ONLY_PLUS_HANDOFF` · **Execution:** READ_ONLY+HANDOFF · **Proof:** `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Recommendations: deterministic, evidence-cited, one owner hand-off each, no auto-apply, no model call.
- **Missing integration:** Opens owning service only.
- **Codex instruction:** Verify SmartRecommendationsRenderer rule list is versioned and cites session finding IDs.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D02.10-1 Duplicates + temp junk fixture -> exactly two recommendations with evidence refs.
  - AT8-D02.10-2 Remove evidence -> recommendation removed.
  - AT8-D02.10-3 Click starts no operation.


## D03 — Organization Studio (9 services)

- **Proof:** `DOMAIN_RUNTIME_PROOF_WITH_EFFECTS` — SHA `8cf9d96`.
- **UI / workspace:** src/studio/workspaces/{SourceGrantWorkspace,VisualLibraryWorkspace,CollectionComposer,OrganizationRuleBuilder,DestinationInspector,PlanReviewWorkspace,ExecutionMonitor,HistoryUndoInspector,SuggestionsReview}.tsx; src/studio/{StudioPage,StudioCommandCenter,StudioStageContextPanel}.tsx; src/operations/{OrganizationLiveWorkbench,OrganizationStudioViews,StudioLiveStage}.tsx
- **Native provider:** electron/native/studio-bridge.cjs (inventory/thumbnails/preview) + electron/native/operation-engine.cjs + operation-ipc.cjs (plan/execute/undo journal)
- **IPC / contract symbols:** studioSources, studioSourceChoose/Remove, studioInventoryScan/Cancel/Query, studioThumbnails, studioDestinationChoose, studioPlanPreview, studioPreviewHistory; operations:v1 chooseSource, chooseDestination, scan, plan, execute, cancel, revoke, history, undoPreview, undo
- **Existing tests / receipts:** scripts/studio-native-test, studio-domain-native-test, studio-exec-test, studio-selection-rule-test, studio-transfer-names-test, studio-category-destinations-test, studio-plan-performance, live-organization-{test,negative,fixtures,electron}; proof: studio-main-sha-runtime/proof.json (9 checks: 40 real fixture moves + 40 verified restores, original hashes restored)
- **Real execution capability:** REAL move/copy executor with immutable planHash, native confirmation, per-file journal, hash-verified restore and conflict-aware undo preview. DO NOT RECREATE.
- **Consent / privilege:** In-app approval bound to planHash + native confirmation; undo preview with previewHash; no elevation.
- **Missing runtime / packaged proof:** Proof is disposable-fixture only: NOT owner-data, NOT installed/packaged-app acceptance, NOT crash-injection at every journal stage (verify existing tests before claiming).
- **State counts:** EXECUTOR_PRESENT = 2, PREVIEW_OR_DRAFT_ONLY = 3, SOURCE_PRESENT_READ_ONLY = 4

### D03.01 — Sources (`mission-03-01`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (authorization) · **Proof:** `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL`
- **Missing (functional / verification):** Source grant stage exists (SourceGrantWorkspace; studioSources/Choose/Remove; revoke). Missing: owner-data run.
- **Missing integration:** Shared with Files authorized sources.
- **Codex instruction:** Do not rebuild. Verify revoke clears plans/approvals (proof overview-source-inspector-and-revoke).
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D03.01-1 Revoke invalidates an unexecuted plan.
  - AT8-D03.01-2 Missing source -> typed error (proof native-cancel-and-missing-source).
  - AT8-D03.01-3 No path escapes the grant (negative corpus).

### D03.02 — Visual Library (`mission-03-02`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL`
- **Missing (functional / verification):** Visual library with native thumbnails exists (VisualLibraryWorkspace; studioThumbnails). Missing: large-library memory/virtualization proof beyond 40 files at HEAD.
- **Missing integration:** Selection feeds Collections/Builder.
- **Codex instruction:** Run studio-large-inventory-electron at HEAD and record; add no new inventory.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D03.02-1 10 000-file synthetic inventory stays virtualized.
  - AT8-D03.02-2 Thumbnail failure shows placeholder with reason.
  - AT8-D03.02-3 Query/filter equals Files search for same source.

### D03.03 — Collections (`mission-03-03`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** LOCAL_STATE · **Proof:** `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL`
- **Missing (functional / verification):** Collections exist (CollectionComposer, localCollection check). Verify persistence and that deletes only the collection record, never files.
- **Missing integration:** Collection -> plan selection.
- **Codex instruction:** Confirm persistence across restart; add test that removing a collection does not touch files.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D03.03-1 Collection survives restart.
  - AT8-D03.03-2 Delete collection leaves all files byte-identical.
  - AT8-D03.03-3 Plan built from a collection lists exactly its members.

### D03.04 — Organization Builder (`mission-03-04`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PLAN_BUILDING · **Proof:** `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL`
- **Missing (functional / verification):** Builder produces plan inputs (structure categorized|flat, collisionPolicy, categoryFolderNames, fileNames). Verify rule semantics are deterministic and shown.
- **Missing integration:** Feeds operations:v1 plan.
- **Codex instruction:** Do not fork the planner; extend request fields only if absent.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D03.04-1 Same inputs -> identical planHash.
  - AT8-D03.04-2 Changing any rule invalidates prior approval.
  - AT8-D03.04-3 Per-category destination honored (studio-category-destinations-test).

### D03.05 — Destinations (`mission-03-05`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PLAN_BUILDING · **Proof:** `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL`
- **Missing (functional / verification):** Destinations stage exists (DestinationInspector; chooseDestination). Verify destination validation (writable, same-root, protected path refusal).
- **Missing integration:** Feeds plan.
- **Codex instruction:** Add negative tests for ungranted/category/path.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D03.05-1 Ungranted destination refused.
  - AT8-D03.05-2 Protected path refused.
  - AT8-D03.05-3 Destination deleted after plan -> execute refuses.

### D03.06 — Plan Review (`mission-03-06`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PLAN_REVIEW · **Proof:** `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL`
- **Missing (functional / verification):** Plan review exists (PlanReviewWorkspace) with immutable planHash and expiry; proof destination-plan-and-invalidation.
- **Missing integration:** Approval is bound to planHash.
- **Codex instruction:** Do not rebuild. Add 40-file plan-performance record at HEAD.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D03.06-1 Approval for plan A rejected for plan B.
  - AT8-D03.06-2 Expired plan refuses execute.
  - AT8-D03.06-3 Collision shown with chosen policy.

### D03.07 — Execution (`mission-03-07`, class B)
- **Implementation:** `EXECUTOR_PRESENT` · **Execution:** EXECUTOR_PRESENT_FIXTURE_VERIFIED · **Proof:** `RUNTIME_PROOF_8cf9d96_FIXTURE_EFFECTS`
- **Missing (functional / verification):** Verified: 40 real fixture moves + 40 hash-checked restores at 8cf9d96. MISSING: crash-recovery at each journal stage, packaged/installed-app run, owner-data run (BLOCKED_REQUIRES_USER_ACTION).
- **Missing integration:** Used by Smart Scan 02-04, Files 06-03, Storage/Cleanup via the same engine.
- **Codex instruction:** DO NOT recreate operation-engine.cjs. Add stage-crash tests (kill after each journal stage) and a packaged-Electron effect test (G-B13).
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D03.07-1 Kill the process after each journal stage -> restart shows `interrupted` with last verified stage.
  - AT8-D03.07-2 Packaged Electron repeats the 40-file move/restore with hashes.
  - AT8-D03.07-3 Cancel stops new items and finishes/rolls back in-flight item.

### D03.08 — History & Undo (`mission-03-08`, class B)
- **Implementation:** `EXECUTOR_PRESENT` · **Execution:** EXECUTOR_PRESENT_FIXTURE_VERIFIED · **Proof:** `RUNTIME_PROOF_8cf9d96_FIXTURE_EFFECTS`
- **Missing (functional / verification):** undoPreview/undo with previewHash and rename/skip resolution exist; hashes restored in proof. MISSING: conflict matrix at HEAD, packaged run.
- **Missing integration:** Journal shared with Home 01-11.
- **Codex instruction:** Add destination-conflict and deleted-source undo cases; do not alter journal format without migration.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D03.08-1 Destination occupied -> undo refuses or renames per resolution with explanation.
  - AT8-D03.08-2 Undo twice -> second is a no-op with state shown.
  - AT8-D03.08-3 Hashes equal originals after restore.

### D03.09 — Suggestions (`mission-03-09`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (suggestions) · **Proof:** `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL`
- **Missing (functional / verification):** SuggestionsReview exists; must be deterministic from inventory, cite rules, never auto-apply.
- **Missing integration:** Feeds Builder only as editable proposals.
- **Codex instruction:** Verify no model call; add rule versioning.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D03.09-1 Same inventory -> same suggestions.
  - AT8-D03.09-2 Applying a suggestion only edits the draft rule.
  - AT8-D03.09-3 No egress.


## D04 — Google Workspace (10 services)

- **Proof:** `NONE` — SHA `none in package`.
- **UI / workspace:** Settings -> Google hub tab only (src/pages/SettingsPage.tsx); no per-service Google workspaces found
- **Native provider:** electron/native/google-auth.cjs (PKCE connect/cancel/disconnect + Sheets list/add/remove/read)
- **IPC / contract symbols:** googleStatus, googleConnect, googleCancel, googleDisconnect, googleSheetsList, googleSheetAdd, googleSheetRemove, googleSheetRead
- **Existing tests / receipts:** scripts/google-oauth-test (offline); historical registry: CONNECTABLE_AWAITING_CONSENT
- **Real execution capability:** REQUIRED_SCOPES = openid, userinfo.email, userinfo.profile, spreadsheets.readonly. Only Sheets read-only is wired. No Gmail/Tasks/Forms/Contacts/Calendar/Picker/Slides/Chat/Classroom scope, channel, provider or UI exists (traced by scope list + 140-channel contract, not by ID string).
- **Consent / privilege:** Browser PKCE consent (verify it never uses an embedded webview); tokens in Main only.
- **Missing runtime / packaged proof:** No live-account run (blocker B-G2: owner-performed). Offline mock OAuth only.
- **State counts:** NOT_IMPLEMENTED_TRACED_ABSENT = 9, PARTIAL_OR_UNSUPPORTED = 1

### D04.01 — Google Sheets (`mission-04-01`, class D)
- **Implementation:** `PARTIAL_OR_UNSUPPORTED` · **Execution:** READ_ONLY_CONNECTOR_PARTIAL · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** google-auth.cjs implements PKCE connect/cancel/disconnect and Sheets list/add/remove/read (scope spreadsheets.readonly). Missing: live consent run (owner), revoke-at-Google verification, quota/backoff evidence, dedicated Sheets workspace distinct from the Settings hub.
- **Missing integration:** Settings hub status vs workspace must share one connection state.
- **Codex instruction:** Extend google-auth.cjs (do NOT add a second OAuth stack). Build the Sheets workspace in ServiceWorkbenchHost reading via googleSheetRead; add 401/403/429 handling and disconnect-purge tests on the mock server.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D04.01-1 Mock server: 401 -> needs-reauthorization; 403 scope -> SCOPE_NOT_GRANTED; 429 -> backoff with Retry-After.
  - AT8-D04.01-2 Disconnect revokes (mock) and deletes cached sheet data.
  - AT8-D04.01-3 Renderer never receives token/code/verifier (leak scan).
  - AT8-D04.01-4 LIVE run recorded separately as owner-performed or BLOCKED_REQUIRES_USER_ACTION.

### D04.02 — Gmail (`mission-04-02`, class D)
- **Implementation:** `NOT_IMPLEMENTED_TRACED_ABSENT` · **Execution:** NOT_IMPLEMENTED (traced: no scope, channel, provider or UI) · **Proof:** `NOT_APPLICABLE`
- **Missing (functional / verification):** Gmail has no scope in REQUIRED_SCOPES, no channel in the 140-channel contract, no provider and no workspace. Gmail scopes are restricted: requires Google verification (blocker B-G1) before any public release.
- **Missing integration:** Must reuse the single Google connection and token vault in google-auth.cjs.
- **Codex instruction:** Add least-privilege scope for Gmail requested incrementally at first use; add channels to shared/native-contract.json + native-contracts.ts + preload.cjs together; provider in google-auth.cjs or a sibling file that imports its token client; read-first, preview-first writes. No renderer-side tokens.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D04.02-1 Scope is requested only when the Gmail workspace first opens.
  - AT8-D04.02-2 Mock-server read renders provenance and quota state; offline != API error != auth error.
  - AT8-D04.02-3 Write (if any) is preview-first with operation-specific consent and read-back verification.
  - AT8-D04.02-4 Disconnect purges local Gmail copies.

### D04.03 — Google Tasks (`mission-04-03`, class D)
- **Implementation:** `NOT_IMPLEMENTED_TRACED_ABSENT` · **Execution:** NOT_IMPLEMENTED (traced: no scope, channel, provider or UI) · **Proof:** `NOT_APPLICABLE`
- **Missing (functional / verification):** Google Tasks has no scope in REQUIRED_SCOPES, no channel in the 140-channel contract, no provider and no workspace.
- **Missing integration:** Must reuse the single Google connection and token vault in google-auth.cjs.
- **Codex instruction:** Add least-privilege scope for Google Tasks requested incrementally at first use; add channels to shared/native-contract.json + native-contracts.ts + preload.cjs together; provider in google-auth.cjs or a sibling file that imports its token client; read-first, preview-first writes. No renderer-side tokens.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D04.03-1 Scope is requested only when the Google Tasks workspace first opens.
  - AT8-D04.03-2 Mock-server read renders provenance and quota state; offline != API error != auth error.
  - AT8-D04.03-3 Write (if any) is preview-first with operation-specific consent and read-back verification.
  - AT8-D04.03-4 Disconnect purges local Google Tasks copies.

### D04.04 — Google Forms (`mission-04-04`, class D)
- **Implementation:** `NOT_IMPLEMENTED_TRACED_ABSENT` · **Execution:** NOT_IMPLEMENTED (traced: no scope, channel, provider or UI) · **Proof:** `NOT_APPLICABLE`
- **Missing (functional / verification):** Google Forms has no scope in REQUIRED_SCOPES, no channel in the 140-channel contract, no provider and no workspace.
- **Missing integration:** Must reuse the single Google connection and token vault in google-auth.cjs.
- **Codex instruction:** Add least-privilege scope for Google Forms requested incrementally at first use; add channels to shared/native-contract.json + native-contracts.ts + preload.cjs together; provider in google-auth.cjs or a sibling file that imports its token client; read-first, preview-first writes. No renderer-side tokens.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D04.04-1 Scope is requested only when the Google Forms workspace first opens.
  - AT8-D04.04-2 Mock-server read renders provenance and quota state; offline != API error != auth error.
  - AT8-D04.04-3 Write (if any) is preview-first with operation-specific consent and read-back verification.
  - AT8-D04.04-4 Disconnect purges local Google Forms copies.

### D04.05 — Google Contacts (`mission-04-05`, class D)
- **Implementation:** `NOT_IMPLEMENTED_TRACED_ABSENT` · **Execution:** NOT_IMPLEMENTED (traced: no scope, channel, provider or UI) · **Proof:** `NOT_APPLICABLE`
- **Missing (functional / verification):** Google Contacts has no scope in REQUIRED_SCOPES, no channel in the 140-channel contract, no provider and no workspace.
- **Missing integration:** Must reuse the single Google connection and token vault in google-auth.cjs.
- **Codex instruction:** Add least-privilege scope for Google Contacts requested incrementally at first use; add channels to shared/native-contract.json + native-contracts.ts + preload.cjs together; provider in google-auth.cjs or a sibling file that imports its token client; read-first, preview-first writes. No renderer-side tokens.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D04.05-1 Scope is requested only when the Google Contacts workspace first opens.
  - AT8-D04.05-2 Mock-server read renders provenance and quota state; offline != API error != auth error.
  - AT8-D04.05-3 Write (if any) is preview-first with operation-specific consent and read-back verification.
  - AT8-D04.05-4 Disconnect purges local Google Contacts copies.

### D04.06 — Google Calendar (`mission-04-06`, class D)
- **Implementation:** `NOT_IMPLEMENTED_TRACED_ABSENT` · **Execution:** NOT_IMPLEMENTED (traced: no scope, channel, provider or UI) · **Proof:** `NOT_APPLICABLE`
- **Missing (functional / verification):** Google Calendar has no scope in REQUIRED_SCOPES, no channel in the 140-channel contract, no provider and no workspace.
- **Missing integration:** Must reuse the single Google connection and token vault in google-auth.cjs.
- **Codex instruction:** Add least-privilege scope for Google Calendar requested incrementally at first use; add channels to shared/native-contract.json + native-contracts.ts + preload.cjs together; provider in google-auth.cjs or a sibling file that imports its token client; read-first, preview-first writes. No renderer-side tokens.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D04.06-1 Scope is requested only when the Google Calendar workspace first opens.
  - AT8-D04.06-2 Mock-server read renders provenance and quota state; offline != API error != auth error.
  - AT8-D04.06-3 Write (if any) is preview-first with operation-specific consent and read-back verification.
  - AT8-D04.06-4 Disconnect purges local Google Calendar copies.

### D04.07 — Google Picker (`mission-04-07`, class D)
- **Implementation:** `NOT_IMPLEMENTED_TRACED_ABSENT` · **Execution:** NOT_IMPLEMENTED (traced: no scope, channel, provider or UI) · **Proof:** `NOT_APPLICABLE`
- **Missing (functional / verification):** Google Picker has no scope in REQUIRED_SCOPES, no channel in the 140-channel contract, no provider and no workspace.
- **Missing integration:** Must reuse the single Google connection and token vault in google-auth.cjs.
- **Codex instruction:** Add least-privilege scope for Google Picker requested incrementally at first use; add channels to shared/native-contract.json + native-contracts.ts + preload.cjs together; provider in google-auth.cjs or a sibling file that imports its token client; read-first, preview-first writes. No renderer-side tokens.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D04.07-1 Scope is requested only when the Google Picker workspace first opens.
  - AT8-D04.07-2 Mock-server read renders provenance and quota state; offline != API error != auth error.
  - AT8-D04.07-3 Write (if any) is preview-first with operation-specific consent and read-back verification.
  - AT8-D04.07-4 Disconnect purges local Google Picker copies.

### D04.08 — Google Slides (`mission-04-08`, class D)
- **Implementation:** `NOT_IMPLEMENTED_TRACED_ABSENT` · **Execution:** NOT_IMPLEMENTED (traced: no scope, channel, provider or UI) · **Proof:** `NOT_APPLICABLE`
- **Missing (functional / verification):** Google Slides has no scope in REQUIRED_SCOPES, no channel in the 140-channel contract, no provider and no workspace.
- **Missing integration:** Must reuse the single Google connection and token vault in google-auth.cjs.
- **Codex instruction:** Add least-privilege scope for Google Slides requested incrementally at first use; add channels to shared/native-contract.json + native-contracts.ts + preload.cjs together; provider in google-auth.cjs or a sibling file that imports its token client; read-first, preview-first writes. No renderer-side tokens.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D04.08-1 Scope is requested only when the Google Slides workspace first opens.
  - AT8-D04.08-2 Mock-server read renders provenance and quota state; offline != API error != auth error.
  - AT8-D04.08-3 Write (if any) is preview-first with operation-specific consent and read-back verification.
  - AT8-D04.08-4 Disconnect purges local Google Slides copies.

### D04.09 — Google Chat (`mission-04-09`, class D)
- **Implementation:** `NOT_IMPLEMENTED_TRACED_ABSENT` · **Execution:** NOT_IMPLEMENTED (traced: no scope, channel, provider or UI) · **Proof:** `NOT_APPLICABLE`
- **Missing (functional / verification):** Google Chat has no scope in REQUIRED_SCOPES, no channel in the 140-channel contract, no provider and no workspace.
- **Missing integration:** Must reuse the single Google connection and token vault in google-auth.cjs.
- **Codex instruction:** Add least-privilege scope for Google Chat requested incrementally at first use; add channels to shared/native-contract.json + native-contracts.ts + preload.cjs together; provider in google-auth.cjs or a sibling file that imports its token client; read-first, preview-first writes. No renderer-side tokens.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D04.09-1 Scope is requested only when the Google Chat workspace first opens.
  - AT8-D04.09-2 Mock-server read renders provenance and quota state; offline != API error != auth error.
  - AT8-D04.09-3 Write (if any) is preview-first with operation-specific consent and read-back verification.
  - AT8-D04.09-4 Disconnect purges local Google Chat copies.

### D04.10 — Google Classroom (`mission-04-10`, class D)
- **Implementation:** `NOT_IMPLEMENTED_TRACED_ABSENT` · **Execution:** NOT_IMPLEMENTED (traced: no scope, channel, provider or UI) · **Proof:** `NOT_APPLICABLE`
- **Missing (functional / verification):** Google Classroom has no scope in REQUIRED_SCOPES, no channel in the 140-channel contract, no provider and no workspace.
- **Missing integration:** Must reuse the single Google connection and token vault in google-auth.cjs.
- **Codex instruction:** Add least-privilege scope for Google Classroom requested incrementally at first use; add channels to shared/native-contract.json + native-contracts.ts + preload.cjs together; provider in google-auth.cjs or a sibling file that imports its token client; read-first, preview-first writes. No renderer-side tokens.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D04.10-1 Scope is requested only when the Google Classroom workspace first opens.
  - AT8-D04.10-2 Mock-server read renders provenance and quota state; offline != API error != auth error.
  - AT8-D04.10-3 Write (if any) is preview-first with operation-specific consent and read-back verification.
  - AT8-D04.10-4 Disconnect purges local Google Classroom copies.


## D05 — Applications (12 services)

- **Proof:** `DOMAIN_RUNTIME_PROOF` — SHA `e86fbf6`.
- **UI / workspace:** src/apps/{ApplicationServices,AppServiceWorkspace,AppRegister,AppDossier,ApplicationsHero,ApplicationsLiveStage}.tsx, catalog.ts, model.ts, native.ts, useApplications.ts; src/lib/app-inventory.ts
- **Native provider:** electron/native/app-bridge.cjs (65 KB)
- **IPC / contract symbols:** appsCapabilities, appsInventory, appsIcon, appsSignature, appsAssociations, appsSizes, appsSizesCancel, appsLeftovers, appsUpdates, appsPlan, appsPackages, appsOpenSettings
- **Existing tests / receipts:** scripts/apps-native-test, apps-inner-evidence, apps-owner-fullstack-capture; proof: apps-main-sha-runtime/proof.json (8 checks; 148 rows = 52 registry + 96 AppX, 0 source failures, bounded size + cancel, immutable review plan + real report export)
- **Real execution capability:** Read-only inventory, Authenticode query, association/package/WinGet reads, bounded size measurement. appsPlan yields an IMMUTABLE REVIEW PLAN and a real exported report. NO install/update/uninstall executor exists or was exercised.
- **Consent / privilege:** None for reads. Future executor: Class C, per-action native confirmation + SP-07 UAC.
- **Missing runtime / packaged proof:** No uninstall/update/install effect proof; no elevation proof; owner machine inventory only.
- **State counts:** PREVIEW_OR_DRAFT_ONLY = 1, SOURCE_PRESENT_READ_ONLY = 11

### D05.01 — Installed Applications Register (`app-inventory`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY`
- **Source-declared state:** `available` — provider: UninstallRegistry + Get-AppxPackage
- **Missing (functional / verification):** Verified: 148 rows (52 registry + 96 AppX), coverage object, no truncation. Missing: HKLM 32-bit/per-user parity statement per row and elevation-needed flag.
- **Missing integration:** Feeds Home 01-03, Smart Scan 02-08, Startup 09-12.
- **Codex instruction:** Trace app-bridge.cjs inventory fields; expose source+scope per row; add no second collector.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D05.01-1 Fixture registry+AppX -> counts equal independent enumeration.
  - AT8-D05.01-2 Source failure -> coverage.sourceFailures>0 and UI partial.
  - AT8-D05.01-3 Browser mode shows unavailable, no invented apps.

### D05.02 — App Identity & Authenticode Trust (`app-identity`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY`
- **Source-declared state:** `available` — provider: Get-AuthenticodeSignature
- **Missing (functional / verification):** Authenticode query exists (appsSignature, proof native-authenticode-query). Missing: timestamp/chain status and signer-vs-publisher mismatch rule.
- **Missing integration:** Feeds Smart Scan 02-08.
- **Codex instruction:** Extend the signature record with chain/timestamp fields only if Get-AuthenticodeSignature returns them; unsigned != malicious copy.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D05.02-1 Signed/unsigned/invalid fixtures classified; no `safe`/`malware` words.
  - AT8-D05.02-2 Signature check is bounded and cancellable.
  - AT8-D05.02-3 Result carries provenance (provider, time).

### D05.03 — Multi-Parameter Software Search (`app-search`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY`
- **Source-declared state:** `available` — provider: Measured inventory
- **Missing (functional / verification):** Multi-parameter query/selection/dossier verified in proof. Missing: saved queries and keyboard focus tests at 3 viewports (partly in all-twelve-tools-and-responsive-layouts).
- **Missing integration:** Shares query model with Home search.
- **Codex instruction:** Keep in-memory query over the inventory; no new index.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D05.03-1 Combined filters (publisher+scope+state) return the independent result.
  - AT8-D05.03-2 Empty result shows empty state, not error.
  - AT8-D05.03-3 Arabic query works.

### D05.04 — Publisher Intelligence & Reputation (`app-publisher`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY`
- **Source-declared state:** `partial` — provider: Registry publisher + verified signatures
- **Missing (functional / verification):** Publisher grouping is derived from inventory fields; no external reputation feed exists and none may be claimed.
- **Missing integration:** Links to app-identity.
- **Codex instruction:** Label as `publisher grouping from install metadata`; remove any `reputation` score wording.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D05.04-1 No reputation score string in UI.
  - AT8-D05.04-2 Group counts equal inventory.
  - AT8-D05.04-3 Unknown publisher grouped as `unknown`.

### D05.05 — Recently Changed Applications (`app-recent`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY`
- **Source-declared state:** `partial` — provider: Registry InstallDate
- **Missing (functional / verification):** Recently changed uses install-date/AppX data; install dates are often missing - must show `unknown`.
- **Missing integration:** Feeds Home activity.
- **Codex instruction:** Verify date parsing for registry InstallDate formats; no fabricated dates.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D05.05-1 Missing date -> `unknown`.
  - AT8-D05.05-2 Order stable for equal dates.
  - AT8-D05.05-3 Window filter correct at boundaries.

### D05.06 — Bulk Uninstall Queue & Batch Manager (`app-uninstall-queue`, class C)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW_ONLY (appsPlan immutable review plan; gated) · **Proof:** `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY`
- **Source-declared state:** `gated` — provider: Immutable plan preview
- **Missing (functional / verification):** NO uninstall executor. Queue is a review plan + real report export only.
- **Missing integration:** Would be the first Class C executor in Apps.
- **Codex instruction:** Implement apps-actions.cjs following service-actions.cjs/startup-actions.cjs (operations.runJob, ProtectedActionStore, native confirm, planHash+expiry). Scope: launch the app's own registered UninstallString/winget uninstall by identity, one app per approval, no silent flags unless the package declares them, verify by re-reading inventory. Mark `irreversible`; NO Undo control; elevation only through SP-07 when the uninstaller requires it.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D05.06-1 Plan hash mismatch/expired -> refused, nothing launched.
  - AT8-D05.06-2 Mock uninstaller removes entry -> postcondition verified; failure -> E_VERIFY shown as unverified.
  - AT8-D05.06-3 Protected/system app refused even with approval.
  - AT8-D05.06-4 No Undo control rendered; irreversibility copy before and after.

### D05.07 — Orphaned Leftover Trace Analysis (`app-leftovers`, class C)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY`
- **Source-declared state:** `partial` — provider: Bounded AppData/ProgramData naming
- **Missing (functional / verification):** appsLeftovers reads trace candidates; leftover deletion has no executor and must hand off to Vault/Cleanup.
- **Missing integration:** Hand-off to D07-03/D08 vault for reversible quarantine.
- **Codex instruction:** Add typed handoff with fingerprints; never delete from Apps.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D05.07-1 Leftover candidate list equals independent fixture traces.
  - AT8-D05.07-2 Hand-off carries fingerprints; stale -> refused by vault.
  - AT8-D05.07-3 Registry leftovers are listed read-only (no registry delete).

### D05.08 — Software Update Center (`app-updates`, class C)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (WinGet read; update executor absent) · **Proof:** `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY`
- **Source-declared state:** `partial` — provider: WinGet CLI (optional)
- **Missing (functional / verification):** Update check via WinGet is read-only; no update executor; WinGet has no rollback (must be stated).
- **Missing integration:** Class C future executor.
- **Codex instruction:** Add per-package `winget upgrade --id` executor only after exact-version plan + native confirmation; verify by re-query; record that no rollback exists.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D05.08-1 Version-pinned plan refuses if installed version changed.
  - AT8-D05.08-2 WinGet absent -> `unavailable` not `0 updates`.
  - AT8-D05.08-3 No rollback control shown.

### D05.09 — Software Storage Footprint Treemap (`app-size`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY`
- **Source-declared state:** `partial` — provider: Bounded install-location measurement
- **Missing (functional / verification):** Bounded size measurement + cancel verified (proof). Missing: treemap accuracy statement for AppX/protected dirs (access denied counted, not zero).
- **Missing integration:** Feeds Storage treemap.
- **Codex instruction:** Report `measured/denied/unknown` byte classes.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D05.09-1 Fixture dir sizes equal independent sum.
  - AT8-D05.09-2 Denied subtree reported as denied.
  - AT8-D05.09-3 Cancel stops the measurer.

### D05.10 — Package Center & WinGet Browser (`app-store-packages`, class C)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY`
- **Source-declared state:** `partial` — provider: Get-AppxPackage + WinGet discovery
- **Missing (functional / verification):** Package center/WinGet browser is read-only (appsPackages; proof native-association-and-package-queries). No install executor.
- **Missing integration:** Shares executor with app-updates.
- **Codex instruction:** Keep read-only; install is out of scope until the apps executor exists.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D05.10-1 Search returns provider results with source; offline -> unavailable.
  - AT8-D05.10-2 No install control enabled.
  - AT8-D05.10-3 Package ids shown verbatim.

### D05.11 — File Extension & Protocol Matrix (`app-associations`, class C)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY`
- **Source-declared state:** `partial` — provider: HKCR sample + UserChoice
- **Missing (functional / verification):** File-type/protocol associations are read (appsAssociations). Class C provisional label refers to future change of defaults, which Windows restricts - keep read-only.
- **Missing integration:** Linked from Files type map.
- **Codex instruction:** Reclassify to A in the ledger; changing defaults is not supported programmatically (UserChoice hash).
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D05.11-1 Association rows equal independent registry read.
  - AT8-D05.11-2 No change control.
  - AT8-D05.11-3 Missing handler shown as `none`.

### D05.12 — Software Boot Impact Analyzer (`app-startup-impact`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY`
- **Source-declared state:** `partial` — provider: Win32_StartupCommand linkage
- **Missing (functional / verification):** Must be a join of appsInventory x startupInventory x startupImpact; no second collector.
- **Missing integration:** Equals D09-01/D09-07.
- **Codex instruction:** Verify join keys (path/signer); show `not measured` without boot evidence.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D05.12-1 Counts equal Startup register.
  - AT8-D05.12-2 App without startup entry shows none.
  - AT8-D05.12-3 No impact claim without boot evidence.


## D06 — Files (12 services)

- **Proof:** `DOMAIN_RUNTIME_PROOF` — SHA `518ec7f`.
- **UI / workspace:** src/files/{FilesServiceFocus,FilesLiveStage,FilesNativeBanner}.tsx, native.ts, useFilesNative.ts; src/pages/FilesPage.tsx; src/lib/file-inventory.ts; src/operations/OrganizationFileViewport.tsx
- **Native provider:** electron/native/files-bridge.cjs (shares the authorized-source model with studio-bridge)
- **IPC / contract symbols:** filesSources, filesSourceChoose, filesInventoryScan/Cancel/Query, filesThumbnails, filesOverview, filesMetadata, filesHash, filesEmptyFolders, filesOpen, filesReveal
- **Existing tests / receipts:** scripts/files-native-test, files-inner-evidence, files-interaction-check, files-viewport-check; proof: files-main-sha-runtime/proof.json (11 checks; 44 native rows; fixtureUnchanged=true)
- **Real execution capability:** Read-only index/search/metadata/SHA-256/empty-folder discovery plus open/reveal. Organize preview/apply/undo are NOT a second engine: they must route to the Studio OperationEngine (operations:v1).
- **Consent / privilege:** Folder authorization only; open/reveal are user-initiated shell calls.
- **Missing runtime / packaged proof:** No owner mutation (by design); no deletion of empty folders exists; provenance/Zone.Identifier depth must be traced in files-bridge.cjs before claiming.
- **State counts:** PREVIEW_OR_DRAFT_ONLY = 1, READ_ONLY_PLUS_HANDOFF = 2, SOURCE_PRESENT_READ_ONLY = 9

### D06.01 — Downloads Folder Inventory (`file-downloads-inventory`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Index/query verified (44 native rows). Missing: explicit Downloads-folder resolution (known-folder API) vs user-chosen source.
- **Missing integration:** Shares source grants with Studio.
- **Codex instruction:** Use the same authorized-source model; Downloads is just a grant.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D06.01-1 Fixture count equals independent walk.
  - AT8-D06.01-2 No source -> idle, no fabricated rows.
  - AT8-D06.01-3 Cancel returns partial labelled.

### D06.02 — Visual Rule Builder & Organization Studio (`file-organize-preview`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW (hand-off to Studio planner) · **Proof:** `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Preview must be the Studio plan (studioPlanPreview), not a Files-local planner.
- **Missing integration:** Files -> Studio plan.
- **Codex instruction:** Hand off selection+rules to Studio; show the returned plan read-only.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D06.02-1 Preview equals Studio plan for the same inputs.
  - AT8-D06.02-2 No execute control in Files.
  - AT8-D06.02-3 Rule change invalidates preview.

### D06.03 — Organization Staging & Change Review (`file-organize-apply`, class B)
- **Implementation:** `READ_ONLY_PLUS_HANDOFF` · **Execution:** HANDOFF to OperationEngine (real executor, fixture-verified) · **Proof:** `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Files has no apply path of its own and must not get one.
- **Missing integration:** Opens Studio Plan Review/Execution.
- **Codex instruction:** Wire a button that opens Studio at Plan Review with the plan loaded; Studio owns approval.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D06.03-1 Apply only reachable through Studio approval.
  - AT8-D06.03-2 Files IPC list contains no execute/move channel (assertion).
  - AT8-D06.03-3 Executed receipt appears in Files History view read-only.

### D06.04 — File Organization Undo Timeline (`file-organize-undo`, class B)
- **Implementation:** `READ_ONLY_PLUS_HANDOFF` · **Execution:** HANDOFF to OperationEngine undo (fixture-verified) · **Proof:** `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Same: Files shows the timeline; undo executes only in Studio via undoPreview/undo.
- **Missing integration:** Timeline reads operations history.
- **Codex instruction:** Render history from operations:v1 history; Undo opens Studio History&Undo.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D06.04-1 Timeline equals Studio history.
  - AT8-D06.04-2 Undo preview shown with conflicts.
  - AT8-D06.04-3 No direct undo channel in Files.

### D06.05 — Sparse Empty Folder Explorer (`file-empty-folders`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** filesEmptyFolders reads sparse/empty folders. No deletion path; deletion (if wanted) goes to Vault-style reversible handling.
- **Missing integration:** Optional handoff to a reversible directory-quarantine (not implemented).
- **Codex instruction:** Keep read-only; do not add rmdir. If deletion is required, extend the vault engine with directory entries under a new plan kind.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D06.05-1 Folder containing only empty folders is reported once.
  - AT8-D06.05-2 Folder with a hidden file is not empty.
  - AT8-D06.05-3 No delete channel.

### D06.06 — Cryptographic Hash Inspector (`file-hash`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** SHA-256 via filesHash verified. Missing: large-file cancellation timing and algorithm choice labelling.
- **Missing integration:** Used by Storage duplicate verification.
- **Codex instruction:** Show algorithm and bytes hashed; cancel within 1 s.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D06.06-1 Known-vector files match.
  - AT8-D06.06-2 Cancel stops hashing within 1 s.
  - AT8-D06.06-3 Locked file -> E_LOCKED.

### D06.07 — Instant Everything-Style File Search (`file-search`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** filesInventoryQuery with category/query verified. Missing: regex/size/date operators if the historical spec required them; verify in files-bridge.cjs.
- **Missing integration:** Home 01-09 consumes this index.
- **Codex instruction:** Add operators only in the existing query function.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D06.07-1 Query equals independent filter.
  - AT8-D06.07-2 Empty query handled.
  - AT8-D06.07-3 Index never includes unauthorized roots.

### D06.08 — File Format Type Distribution (`file-type-map`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Derived from inventory categories; verify category table is the same one Storage uses.
- **Missing integration:** Equal to D07-06 for same scope.
- **Codex instruction:** Share one category map module.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D06.08-1 Counts equal Storage by-category for same scope.
  - AT8-D06.08-2 Unknown extensions in `other`.
  - AT8-D06.08-3 Bytes sum equals inventory total.

### D06.09 — Recent File Timeline Histogram (`file-recents`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Timeline histogram from mtime; verify timezone/DST handling and `unknown` mtime.
- **Missing integration:** Home activity may link.
- **Codex instruction:** Add DST boundary tests.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D06.09-1 DST boundary files bucket correctly.
  - AT8-D06.09-2 Missing mtime -> `unknown`.
  - AT8-D06.09-3 Bucket counts sum to total.

### D06.10 — Ranked Large File Explorer (`file-largest`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Ranking must equal Smart Scan large files and Storage heavy ledger.
- **Missing integration:** Cross-service equality (02-04, 07-02).
- **Codex instruction:** Use the shared ranking function from 02-04.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D06.10-1 Top-N identical across three services.
  - AT8-D06.10-2 Ties ordered deterministically.
  - AT8-D06.10-3 Hardlinks counted once.

### D06.11 — Deep File Metadata & Attributes Dossier (`file-metadata`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** filesMetadata verified. Missing: attribute set completeness (ADS count, reparse, readonly, hidden, system) - verify fields.
- **Missing integration:** Provenance 06-12.
- **Codex instruction:** Add missing attribute fields in files-bridge.cjs only.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D06.11-1 Attribute fixture flags equal independent read.
  - AT8-D06.11-2 Denied -> `denied` not blank.
  - AT8-D06.11-3 No file content read.

### D06.12 — Trust Evidence & Provenance Board (`file-provenance`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Provenance depth (Zone.Identifier, source URL) must be traced in files-bridge.cjs; if absent, `unavailable` not `trusted`.
- **Missing integration:** Uses metadata ADS read.
- **Codex instruction:** Read Zone.Identifier metadata only; never label a file safe/trusted.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D06.12-1 Zone.Identifier fixture shown (ZoneId, host URL).
  - AT8-D06.12-2 No Zone data -> `no provenance data`.
  - AT8-D06.12-3 No trust verdict wording.


## D07 — Storage (12 services)

- **Proof:** `LOCAL_MAIN_STORAGE_UI_AND_READ_ONLY_ELECTRON_RECEIPT` at **`0c853c9`**. The real `storage-main-verified.json` points to `storage-main-sha-runtime/proof.json` (7 passing groups, zero errors at exact SHA); scope: actual StorageBridge + Files index on disposable source folders, actual Windows volume observations, no owner-file mutation/defrag/TRIM/eject/clipboard or Settings writes. Older no-receipt claims below are HISTORICAL. None of the 12 rows should be upgraded to effectful/packaged COMPLETE solely from this domain proof.
- **UI / workspace:** src/storage/{StorageServiceFocus,StorageAtlasPanels,StorageSpaceMap,StorageTabContent,StorageBanner}.tsx; src/pages/StoragePage.tsx; src/lib/storage-inventory.ts; src/components/storage/*; src/operations/StorageCleanupLiveWorkbench.tsx
- **Native provider:** electron/native/storage-bridge.cjs + storage-vault.cjs (StorageVault over OperationEngine, KIND cleanup-quarantine-v1)
- **IPC / contract symbols:** storageVolumes, storageHistory, storageAnalysis, storageDuplicates; operations:v1 storageScan, vaultPlan, vaultExecute, vaultList, vaultReport, vaultRestorePreview, vaultRestore
- **Existing tests / receipts:** scripts/storage-native-test, storage-vault-test, storage-vault-negative, storage-vault-fixtures, storage-vault-electron, storage-owner-fullstack-capture; historical ledger: storage-native-test exit 0 (media connect/disconnect, history), live read-only CIM 3 fixed/0 removable
- **Real execution capability:** Read-only volume/analysis/duplicate-verify + a REAL reversible same-volume quarantine executor (vaultPlan -> vaultExecute -> vaultRestorePreview -> vaultRestore) with keeper witness re-check (checkKeepers).
- **Consent / privilege:** planHash + native confirmation; same-volume quarantine frees no bytes until a (not yet implemented) permanent-purge step.
- **Missing runtime / packaged proof:** New exact-commit 0c853c9 domain Electron receipt is available and scoped to read-only observation / disposable sources. Effectful packaged/owner-data acceptance remains NOT VERIFIED. Permanent purge, TRIM/Optimize and S.M.A.R.T. beyond CIM require separate capability/permission proof.
- **State counts:** EXECUTOR_PRESENT = 1, PREVIEW_OR_DRAFT_ONLY = 2, SOURCE_PRESENT_READ_ONLY = 9

### D07.01 — Volume Bays & Partition Manager (`storage-disks`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** storageVolumes reads fixed/removable; partition manager must stay read-only (no repartition).
- **Missing integration:** Home 01-04.
- **Codex instruction:** Verify provider fields (capacity, free, FS, label); unknown -> unknown.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D07.01-1 Volume list equals independent CIM/WMI read.
  - AT8-D07.01-2 Unknown capacity shown unknown.
  - AT8-D07.01-3 No partition-change control.

### D07.02 — Heavy-File Storage Ledger (`storage-large-files`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Must equal shared ranking.
- **Missing integration:** Cross-service equality.
- **Codex instruction:** Use shared ranking function.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D07.02-1 Equals Files largest.
  - AT8-D07.02-2 Cancel stops scan.
  - AT8-D07.02-3 Denied folders disclosed.

### D07.03 — Byte-Exact Duplicate Hash Groups (`storage-duplicates`, class B)
- **Implementation:** `EXECUTOR_PRESENT` · **Execution:** EXECUTOR_PRESENT_UNVERIFIED_AT_HEAD (Vault: reversible same-volume quarantine) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** storageDuplicates verify + vaultPlan/Execute/RestorePreview/Restore exist with tests (storage-vault-test/negative/fixtures/electron). Missing: HEAD re-run, crash-stage tests, permanent purge (not implemented; same-volume quarantine frees no bytes).
- **Missing integration:** Receives Smart Scan 02-03 hand-off; Cleanup 08-02.
- **Codex instruction:** Do NOT write a second quarantine engine. Re-run vault suite at HEAD; add purge as a separate, irreversible, explicitly confirmed plan kind only if required (Class C).
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D07.03-1 Keeper changed after plan -> vaultExecute refuses.
  - AT8-D07.03-2 Restore preview detects destination conflict.
  - AT8-D07.03-3 Packaged Electron repeats fixture quarantine/restore with hashes.
  - AT8-D07.03-4 Report states bytes NOT freed until purge.

### D07.04 — Interactive Storage Space Treemap (`storage-treemap`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Treemap built from storageAnalysis; verify unreadable-bytes accounting.
- **Missing integration:** Equals folders ranking 07-05.
- **Codex instruction:** Show denied/unknown area.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D07.04-1 Rect areas sum to measured bytes.
  - AT8-D07.04-2 Denied area visible.
  - AT8-D07.04-3 Keyboard navigation works.

### D07.05 — Folder Ranking Waterfall (`storage-top-folders`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Folder ranking from analysis.
- **Missing integration:** Equals treemap.
- **Codex instruction:** Share the analysis result object.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D07.05-1 Ranking equals independent du.
  - AT8-D07.05-2 Ties deterministic.
  - AT8-D07.05-3 Hardlink handling stated.

### D07.06 — Storage Byte Distribution by Category (`storage-filetypes`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Category bytes from analysis.
- **Missing integration:** Equals Files type map.
- **Codex instruction:** Share category map.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D07.06-1 Sum equals total.
  - AT8-D07.06-2 Equals Files type map.
  - AT8-D07.06-3 Unknown bucket present.

### D07.07 — Drive Coverage & Scan Dashboard (`storage-scan-overview`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Coverage dashboard from analysis history (storageHistory).
- **Missing integration:** Home 01-04.
- **Codex instruction:** Show coverage per volume and age of last scan.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D07.07-1 Coverage equals scanned roots.
  - AT8-D07.07-2 Stale scan labelled.
  - AT8-D07.07-3 Restart restores history.

### D07.08 — Drive Optimization & TRIM Dossier (`storage-fragmentation`, class C)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW_ONLY/NOT_EXECUTABLE (Class C: Optimize/TRIM not implemented) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** No optimize/TRIM executor. Read of optimization state is the only honest scope; fragmentation % must come from a provider (Optimize-Volume -Analyze needs elevation).
- **Missing integration:** Needs SP-07 helper for analysis; execution is a separate Class C plan.
- **Codex instruction:** Report media type (SSD/HDD) and last-optimize date from provider; if elevation is required show `requires administrator` and offer no run. Implement Optimize only with per-action UAC and verified result, SSD: TRIM only.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D07.08-1 SSD fixture -> no defrag option.
  - AT8-D07.08-2 Without elevation analysis shows `requires administrator`.
  - AT8-D07.08-3 No run without exact plan + UAC.

### D07.09 — Disk Reliability & S.M.A.R.T. Health (`storage-smart`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Reliability limited to CIM/Get-PhysicalDisk fields; SMART attributes are not generally exposed without vendor tools - show unavailable.
- **Missing integration:** None.
- **Codex instruction:** Display only fields returned; no health score.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D07.09-1 Provider returns Unknown -> UI Unknown.
  - AT8-D07.09-2 No predictive-failure claim.
  - AT8-D07.09-3 USB disks flagged unsupported.

### D07.10 — Storage Reclaim Planner & Basket (`storage-reclaim`, class C)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PLAN_ONLY + Vault handoff · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Reclaim planner/basket exists (StorageAtlasPanels, StorageCleanupLiveWorkbench); execution only via Vault quarantine; savings are estimates.
- **Missing integration:** Executes through D07-03 vault.
- **Codex instruction:** Basket -> vaultPlan; label `estimated`; do not add a delete path.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D07.10-1 Basket total equals estimate rules.
  - AT8-D07.10-2 Execute only via vault approval.
  - AT8-D07.10-3 Report separates quarantined from freed.

### D07.11 — Capacity Trend Timeline (`storage-history`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Capacity trend from persisted storageHistory (needs repeated samples).
- **Missing integration:** Home.
- **Codex instruction:** Show sample times; no interpolation.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D07.11-1 Two samples -> two points; no smoothing.
  - AT8-D07.11-2 Restart restores.
  - AT8-D07.11-3 Gap labelled.

### D07.12 — Removable USB & External Volume Dock (`storage-removable`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Removable dock with connect/disconnect history (storage-native-test historical); no eject/format executor.
- **Missing integration:** None.
- **Codex instruction:** Keep read-only; no eject.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D07.12-1 Connect/disconnect events recorded.
  - AT8-D07.12-2 Unknown type/capacity shown unknown.
  - AT8-D07.12-3 No eject/format control.


## D08 — Cleanup (12 services)

- **Proof:** `LOCAL_MAIN_UI_INTEGRATION_COMMITTED` at `11875da`; `cleanup-main-verified.json` says `ok: true` and references **`cleanup-main-sha-runtime-v2/proof.json` with eight passing read-only Electron checks at `11875da`**. Earlier `cleanup-native-ui-v2/proof.json` gives eight read-only groups on the precommit `ef25624` snapshot. This is domain UI/native-preview evidence, NOT proof of effectful cleanup nor complete per-service acceptance.
- **UI / workspace:** src/cleanup/{ServiceWorkspace,ServiceRail,CandidateRegister,CandidateInspector,PlanGate,CleanupHero,CleanupLiveStage}.tsx, model.ts, native.ts, useCleanup.ts; src/pages/CleanupPage.tsx. These five Cleanup workspace files were incorporated in committed local `main` at `11875da`; latest dirty work has moved to Storage/Home.
- **Native provider:** electron/native/cleanup-bridge.cjs (read-only Clean Room coordinator, readOnly:true, mutation:none; GATED_OPERATIONS lists cleanup.execute) + StorageVault handoff for quarantine/restore
- **IPC / contract symbols:** cleanupCapabilities, cleanupStart, cleanupStatus, cleanupCancel, cleanupInventory, cleanupEstimate, cleanupQuarantine, cleanupUnused, cleanupPlan, cleanupSchedule, cleanupReport, cleanupOpenSettings; vault* via operations:v1
- **Existing tests / receipts:** scripts/cleanup-native-test, cleanup-inner-evidence, cleanup-owner-fullstack-capture; proof: cleanup-native-ui-v2/proof.json at ef25624 (141 candidates, 1 root scanned/1 unavailable, 140 files measured)
- **Real execution capability:** Discovery/estimate/report are real and read-only. Quarantine/restore are performed by the EXISTING Storage Vault, not by cleanup-bridge. Direct delete is gated (cleanup.execute).
- **Consent / privilege:** Vault plan: planHash + native confirmation. Update-cache/Recycle/browser-cache/log deletion are Class B/C and have NO executor.
- **Missing runtime / packaged proof:** Cleanup UI integration is committed locally but not pushed. No owner-file quarantine/restore/delete or packaged production effect was proven by these domain checks; do not treat any of the 12 rows as automatically complete.
- **State counts:** PREVIEW_OR_DRAFT_ONLY = 1, SOURCE_PRESENT_READ_ONLY = 11

### D08.01 — Temporary Files Candidate Safety Ledger (`cleanup-temp-preview`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF`
- **Source-declared state:** `available` — provider: Bounded user/Win temp measurement
- **Missing (functional / verification):** Candidate discovery verified at ef25624 WIP (141 candidates; coverage rootsScanned/Unavailable). Missing: reverify against the committed latest Cleanup UI and complete the allowlist rule catalog evidence.
- **Missing integration:** Receives Smart Scan 02-05.
- **Codex instruction:** Commit the existing WIP unchanged first (owner decides) - do not rewrite it. Then verify rule IDs/protected exclusion.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D08.01-1 Protected path never listed as candidate.
  - AT8-D08.01-2 Candidates carry ruleId and fingerprints.
  - AT8-D08.01-3 Unavailable root disclosed.

### D08.02 — Quarantine Review & Safety Vault (`cleanup-temp-quarantine`, class B)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** GATED here; executes through Storage Vault · **Proof:** `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF`
- **Source-declared state:** `gated` — provider: Quarantine vault reader
- **Missing (functional / verification):** cleanup-bridge lists quarantine as gated; real quarantine is vaultPlan/Execute. Missing: single approved flow Cleanup->Vault with preserved selection and independent re-classification.
- **Missing integration:** D07-03 vault.
- **Codex instruction:** Wire PlanGate to vaultPlan with the selected candidates (existing handoff in proof); no new engine; recompute classification at plan time.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D08.02-1 Selection reaches vaultPlan with fingerprints.
  - AT8-D08.02-2 Changed file refused at execute.
  - AT8-D08.02-3 Quarantine+restore hashes verified on fixture.

### D08.03 — Cleanup Recovery Console & Journal (`cleanup-temp-undo`, class B)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ journal; restore via Vault · **Proof:** `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF`
- **Source-declared state:** `available` — provider: Cleanup journal reader
- **Missing (functional / verification):** Undo console reads local journal; restore must go through vaultRestorePreview/vaultRestore.
- **Missing integration:** D07-03.
- **Codex instruction:** Render vaultList/receipts; restore via vault only.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D08.03-1 Restore preview shows conflicts.
  - AT8-D08.03-2 Hashes equal after restore.
  - AT8-D08.03-3 No direct file move from Cleanup.

### D08.04 — Quarantine Vault File Inspector (`cleanup-quarantine-list`, class B)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF`
- **Source-declared state:** `available` — provider: Quarantine vault listing
- **Missing (functional / verification):** Vault file inspector over vaultList; read-only.
- **Missing integration:** D07-03.
- **Codex instruction:** Show quarantine metadata (origin, time, hash).
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D08.04-1 List equals vault receipts.
  - AT8-D08.04-2 Missing quarantined file flagged.
  - AT8-D08.04-3 No delete control.

### D08.05 — Space Savings Breakdown & Calculator (`cleanup-estimate`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF`
- **Source-declared state:** `available` — provider: Measured candidate sizes
- **Missing (functional / verification):** Estimate is measured bytes per category; must say `estimated`.
- **Missing integration:** Home 01-05.
- **Codex instruction:** Label estimate vs reclaimable.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D08.05-1 Estimate equals sum of candidate sizes.
  - AT8-D08.05-2 Same-volume quarantine labelled 0 bytes freed.
  - AT8-D08.05-3 Denied folders excluded and disclosed.

### D08.06 — Recycle Bin Multi-Volume Inspector (`cleanup-recycle`, class C)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (partial; Shell.Application namespace 10) · **Proof:** `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF`
- **Source-declared state:** `partial` — provider: Shell.Application namespace 10
- **Missing (functional / verification):** Reads current-user Recycle Bin metadata only; empty-bin is Class C and has no executor.
- **Missing integration:** None.
- **Codex instruction:** Keep read-only until a Class C plan (SHEmptyRecycleBin per drive, irreversible, no Undo) is specified and approved.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D08.06-1 Multi-volume bin metadata shown per volume.
  - AT8-D08.06-2 No empty control enabled.
  - AT8-D08.06-3 Unreadable volume disclosed.

### D08.07 — Dormancy & Unused Files Explorer (`cleanup-unused`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF`
- **Source-declared state:** `partial` — provider: Authorized Studio source index
- **Missing (functional / verification):** Dormancy uses mtime/atime; atime is often disabled - must say `access time not reliable`.
- **Missing integration:** Hand-off to vault.
- **Codex instruction:** Disclose NTFS last-access setting state.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D08.07-1 atime disabled -> warning shown.
  - AT8-D08.07-2 Threshold changes recompute.
  - AT8-D08.07-3 No delete control.

### D08.08 — Windows Update & Servicing Cache Gateway (`cleanup-update-cache`, class C)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** GATED (measure only) · **Proof:** `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF`
- **Source-declared state:** `gated` — provider: Bounded SoftwareDistribution/WinSxS measurement
- **Missing (functional / verification):** SoftwareDistribution/WinSxS measurement only; deletion is Class C and not implemented (stop services + purge cache).
- **Missing integration:** D12/D11 update reset overlap.
- **Codex instruction:** Keep gated. Never delete WinSxS. If SoftwareDistribution purge is required, implement as Repair Lab update-reset plan (D11-12), not here.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D08.08-1 WinSxS never offered for deletion.
  - AT8-D08.08-2 Measurement bounded and cancellable.
  - AT8-D08.08-3 Gated copy explains why.

### D08.09 — Web Browser Profile Cache Inspector (`cleanup-browser-cache`, class B)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ (existence/size only) · **Proof:** `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF`
- **Source-declared state:** `available` — provider: Chromium/Firefox cache folders + process check
- **Missing (functional / verification):** Browser profile cache measured; browser-running detection required before any future delete; no content parsing.
- **Missing integration:** Hand-off to vault for cache files.
- **Codex instruction:** Add running-browser lock detection; no history/cookies/passwords touch.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D08.09-1 Browser running -> action blocked.
  - AT8-D08.09-2 No credential store path ever listed.
  - AT8-D08.09-3 Content read count 0.

### D08.10 — Log Retention & Dump Explorer (`cleanup-logs`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF`
- **Source-declared state:** `partial` — provider: WER/CrashDumps/Windows log measurement
- **Missing (functional / verification):** Log/dump explorer with retention classes; deletion gated.
- **Missing integration:** Vault hand-off.
- **Codex instruction:** Protect event logs and active logs.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D08.10-1 Active log excluded.
  - AT8-D08.10-2 Dump files listed with age.
  - AT8-D08.10-3 No delete control.

### D08.11 — Automated Cleanup Schedule Composer (`cleanup-schedule`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** DRAFT_ONLY (local occurrence calculator; gated) · **Proof:** `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF`
- **Source-declared state:** `gated` — provider: Local draft occurrence calculator
- **Missing (functional / verification):** Schedule composer drafts the next read-only scan occurrence; no scheduled task is registered and no cleanup is scheduled.
- **Missing integration:** Must delegate to Automation scheduler (D13-02), not a second scheduler.
- **Codex instruction:** Create a workflow in the Automation scheduler engine (automationScheduleArm) rather than a cleanup-local timer; cleanup runs stay read-only.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D08.11-1 Draft occurrence equals scheduler preview.
  - AT8-D08.11-2 Arming requires per-occurrence consent.
  - AT8-D08.11-3 Changed plan pauses the schedule.

### D08.12 — Before/After Cleanup Report Studio (`cleanup-reports`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF`
- **Source-declared state:** `available` — provider: Measured session + vault + journal
- **Missing (functional / verification):** Before/after report from session+vault+journal; ensure it never calls estimated bytes `freed`.
- **Missing integration:** Home activity.
- **Codex instruction:** Report schema versioned; sanitize paths on export option.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D08.12-1 Report equals journal totals.
  - AT8-D08.12-2 Estimated vs verified separated.
  - AT8-D08.12-3 Export has no secret.


## D09 — Startup (12 services)

- **Proof:** `NONE_POST_ARCHIVE` — SHA `none in package`.
- **UI / workspace:** src/startup/{ServiceWorkspace,ServiceRail,AutorunRegister,AutorunInspector,PlanGate,StartupActionWorkbench,StartupHero}.tsx, model.ts, native.ts, useStartup.ts; src/pages/StartupPage.tsx
- **Native provider:** electron/native/startup-bridge.cjs (read inventory/services/tasks/impact/journal), startup-actions.cjs (StartupActions), startup-registry.cjs, protected-action-store.cjs (DPAPI receipts)
- **IPC / contract symbols:** startupCapabilities/Start/Status/Cancel/Inventory/Icon/Services/Tasks/Impact/Journal/Sessions/Plan/Report/OpenSettings; operations:v1 startupDisablePlan, startupRestorePlan, startupApply, startupReceipts
- **Existing tests / receipts:** scripts/startup-actions-test (mock Registry: disable/restore, stale/denied/expired plans, protected-source refusal, interrupted-write recovery, authenticated encrypted receipts, strict IPC), startup-native-test, startup-owner-fullstack-capture; isolated Electron (historical ledger)
- **Real execution capability:** REAL executor (mock-verified only): disable/restore of HKCU\...\Run values with expiry-bound plan, registry read-back postcondition, receipt saved BEFORE mutation, status prepared->disabled/restored/uncertain. Eligibility: scope user, sourceKind registry-run, protection standard, no elevation. Everything else (HKLM, services, tasks, Startup folder, delay, batch, undo-all) has NO executor.
- **Consent / privilege:** planHash + 5-minute expiry + native confirmation; Windows-protected receipt storage required (STARTUP_SECURE_STORAGE_REQUIRED).
- **Missing runtime / packaged proof:** Real HKCU effect on owner/VM Windows NOT RUN; no post-archive Electron receipt in the package.
- **State counts:** EXECUTOR_PRESENT = 2, NOT_IMPLEMENTED_TRACED_ABSENT = 1, PREVIEW_OR_DRAFT_ONLY = 2, SOURCE_PRESENT_READ_ONLY = 7

### D09.01 — Windows Boot Autorun Register (`startup-overview`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Registry + Startup folders + logon tasks
- **Missing (functional / verification):** Register of Run keys/StartupApproved/folders/tasks/services read by startup-bridge. Verify HKLM and 32-bit view coverage and the coverage object.
- **Missing integration:** Home 01-06, Apps 05-12, Scan 02-07.
- **Codex instruction:** Verify coverage per source; no second reader.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D09.01-1 Mock registry fixture -> counts equal independent read.
  - AT8-D09.01-2 Unreadable source -> coverage partial.
  - AT8-D09.01-3 Counts equal across Home/Apps/Scan.

### D09.02 — Autorun State Change Preview (`startup-disable`, class B)
- **Implementation:** `EXECUTOR_PRESENT` · **Execution:** EXECUTOR_PRESENT_MOCK_VERIFIED (HKCU\...\Run only) · **Proof:** `MOCK_TEST_ONLY_(historical)_NO_LIVE_EFFECT_NOT_VERIFIED_AT_HEAD`
- **Source-declared state:** `partial` — provider: Immutable plan preview
- **Missing (functional / verification):** Executor exists (startup-actions.cjs: disablePlan->apply with registry read-back, receipt BEFORE mutation). Verified only against mock registry. Missing: live HKCU effect on a disposable Windows profile (NOT RUN), StartupApproved parity, per-entry eligibility messaging in UI.
- **Missing integration:** Hand-off from Apps 05-12.
- **Codex instruction:** Do not rewrite. Add an L6 test on a disposable Windows profile (create HKCU Run test value -> disable -> verify -> restore). Surface eligibility reason strings (scope, elevation, protection) in AutorunInspector.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D09.02-1 HKLM/elevation-required/protected entry -> refused with reason.
  - AT8-D09.02-2 Value changed between plan and apply -> STARTUP_CHANGED.
  - AT8-D09.02-3 Receipt exists (prepared) before registry write (ordering assertion).
  - AT8-D09.02-4 L6: real HKCU test value disabled and restored with identical ACL/SID/StartupApproved.

### D09.03 — Startup Restoration & Rollback (`startup-restore`, class B)
- **Implementation:** `EXECUTOR_PRESENT` · **Execution:** EXECUTOR_PRESENT_MOCK_VERIFIED · **Proof:** `MOCK_TEST_ONLY_(historical)_NO_LIVE_EFFECT_NOT_VERIFIED_AT_HEAD`
- **Source-declared state:** `gated` — provider: Local change journal reader
- **Missing (functional / verification):** restorePlan/apply with conflict refusal (value exists or ACL/SID/approved changed) verified on mock. Missing: live L6; interrupted-write recovery UI path at HEAD.
- **Missing integration:** Receipts shared with Home 01-12.
- **Codex instruction:** Add UI for `uncertain` receipts with recover/abandon; keep conflict refusal.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D09.03-1 Existing value -> STARTUP_RESTORE_CONFLICT.
  - AT8-D09.03-2 Uncertain receipt offers recovery.
  - AT8-D09.03-3 Restored value byte-equal to original.

### D09.04 — Autorun Source Coverage Map (`startup-sources`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Per-source measured coverage
- **Missing (functional / verification):** Source coverage map from startup-bridge coverage.
- **Missing integration:** None.
- **Codex instruction:** Show which sources were readable/denied.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D09.04-1 Denied source listed.
  - AT8-D09.04-2 Counts per source sum to inventory.
  - AT8-D09.04-3 No write.

### D09.05 — Startup Change Audit Journal (`startup-journal`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `gated` — provider: Append-only journal (no writes yet)
- **Missing (functional / verification):** Audit journal reads startupJournal + protected receipts (startupReceipts).
- **Missing integration:** Home 01-11.
- **Codex instruction:** Show unreadable receipts as unreadable.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D09.05-1 Journal equals receipts.
  - AT8-D09.05-2 Tampered receipt -> unreadable.
  - AT8-D09.05-3 Sorted by real time.

### D09.06 — Keyboard-First Autorun Query Console (`startup-filter`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Measured entry query
- **Missing (functional / verification):** Query console over inventory.
- **Missing integration:** None.
- **Codex instruction:** Keyboard-first; no new index.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D09.06-1 Query equals independent filter.
  - AT8-D09.06-2 Keyboard-only operation.
  - AT8-D09.06-3 Empty state shown.

### D09.07 — Boot Sequence Impact Timeline (`startup-impact`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `partial` — provider: Windows Diagnostics-Performance events
- **Missing (functional / verification):** Boot timeline uses boot events (startupImpact); 11 renderer files reference it. Missing: statement of evidence window and `not measured` when no events.
- **Missing integration:** Apps 05-12, Scan 02-07.
- **Codex instruction:** Show event window; no estimated seconds.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D09.07-1 No events -> not measured.
  - AT8-D09.07-2 Window displayed.
  - AT8-D09.07-3 Equals Apps impact for same entry.

### D09.08 — Service Boot Policy Matrix (`startup-services`, class C)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (Class C label: policy changes not implemented) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `partial` — provider: Win32_Service automatic/delayed
- **Missing (functional / verification):** Service boot policy matrix is read-only; start-type change is gated (service-actions rejects startup policy).
- **Missing integration:** D12-11 config diff.
- **Codex instruction:** Keep read-only; policy change would be a new Class C plan (sc config) with receipt + UAC, only if specified.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D09.08-1 Matrix equals services snapshot.
  - AT8-D09.08-2 No policy-change control.
  - AT8-D09.08-3 Protected services labelled.

### D09.09 — Logon Scheduled Task Timeline (`startup-tasks`, class C)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (Class C label: task changes not implemented) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `partial` — provider: Get-ScheduledTask logon/boot triggers
- **Missing (functional / verification):** Logon task timeline read-only (startupTasks); no Task Scheduler write.
- **Missing integration:** None.
- **Codex instruction:** Keep read-only; disable-task executor would need schtasks plan + XML receipt + elevation analysis.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D09.09-1 Task list equals schtasks query.
  - AT8-D09.09-2 Hidden/disabled states preserved.
  - AT8-D09.09-3 No change control.

### D09.10 — Delayed Launch Planner (`startup-delay`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `partial` — provider: Draft delay plan
- **Missing (functional / verification):** Delayed launch planner: no executor (no scheduler/registry write for delay). Must not claim delay applied.
- **Missing integration:** Could use Automation scheduler.
- **Codex instruction:** Keep preview; implement only via a documented mechanism (Task Scheduler logon trigger delay) as a new plan kind with receipt.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D09.10-1 Preview shows exact change.
  - AT8-D09.10-2 No apply control.
  - AT8-D09.10-3 Copy states not applied.

### D09.11 — Autorun Batch Staging Tray (`startup-batch`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW_ONLY (partial: Immutable batch plan) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `partial` — provider: Immutable batch plan
- **Missing (functional / verification):** Batch tray builds an immutable batch plan; apply path handles ONE entry per approval. No batch executor.
- **Missing integration:** Uses startupApply sequentially.
- **Codex instruction:** Implement batch as N individually receipted startupApply calls under one reviewed batch plan with per-item confirmation or one confirm listing all hashes; stop on first failure.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D09.11-1 3-item batch -> 3 receipts or stop at first failure.
  - AT8-D09.11-2 Changed item aborts remaining.
  - AT8-D09.11-3 Batch plan hash covers all items.

### D09.12 — Batch Recovery & Mass Rollback Workspace (`startup-undo-all`, class B)
- **Implementation:** `NOT_IMPLEMENTED_TRACED_ABSENT` · **Execution:** NOT_IMPLEMENTED (single-receipt restore only) · **Proof:** `NOT_APPLICABLE`
- **Source-declared state:** `gated` — provider: Journal session reader
- **Missing (functional / verification):** Mass rollback has no executor; restorePlan restores one receipt.
- **Missing integration:** Receipts store.
- **Codex instruction:** Implement as ordered restorePlan chain over recoverable receipts with conflict stop and a summary receipt; no `force`.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D09.12-1 3 disabled entries restored in reverse order.
  - AT8-D09.12-2 Conflict on item 2 stops with 1 restored, 2 untouched.
  - AT8-D09.12-3 Summary lists exact outcomes.


## D10 — System / Network / Hardware (36 services; catalog IDs confirmed = 36)

- **Proof:** `NONE_POST_ARCHIVE` — SHA `none in package`.
- **UI / workspace:** src/system/{SystemServiceWorkspaces,SystemWorkbenchesA,SystemWorkbenchesB,NetworkWorkbenches,HardwareWorkbenches}.tsx, catalog.ts (36 catalog ID entries, equal to the 36 registered D10 services (direct catalog recount 2026-11-03)), model.ts, native.ts, useSystem.ts; src/pages/SystemPage.tsx
- **Native provider:** electron/native/system-bridge.cjs (52 KB) + system-providers.cjs (74 KB)
- **IPC / contract symbols:** systemCapabilities, systemStart, systemStatus, systemCancel, systemSnapshot, systemSample, systemProcesses, systemEvents, systemSignatures, systemDiagnostics, systemTraceroute, systemHosts, systemHostsPlan, systemReport, systemOpenSettings
- **Existing tests / receipts:** scripts/system-native-test, system-owner-fullstack-capture; src/pages/tests/SystemPage.test.tsx
- **Real execution capability:** Read-only providers; tracert is a bounded active read; systemHostsPlan is an immutable PREVIEW (no hosts write); network recovery is preview only (see D11).
- **Consent / privilege:** None for reads; no elevation path.
- **Missing runtime / packaged proof:** No post-archive Electron receipt; CPU/GPU temperature, battery cycles, SMART depth depend on what Windows exposes -> must show unavailable, never invented.
- **State counts:** PREVIEW_OR_DRAFT_ONLY = 1, SOURCE_PRESENT_READ_ONLY = 35

### D10.01 — System Pulse Overview Console (`system-health-check`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Overview aggregates systemSnapshot/systemSample. No post-archive Electron receipt for D10; re-run system-native-test and the isolated Electron smoke at HEAD before any claim.
- **Missing integration:** Home 01-07, Scan 02-09.
- **Codex instruction:** Verify every tile is bound to a provider field with sample time.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.01-1 Provider failure -> tile `unavailable`.
  - AT8-D10.01-2 Values equal Pulse for same sample id.
  - AT8-D10.01-3 No score.

### D10.02 — Windows Event Log Severity Ledger (`system-events`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** systemEvents severity ledger; verify window/limit disclosure and Security-log access-denied handling.
- **Missing integration:** Scan 02-09.
- **Codex instruction:** Show window and truncation.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.02-1 3 critical fixture events -> count 3 + window.
  - AT8-D10.02-2 Access denied -> unavailable with reason.
  - AT8-D10.02-3 Truncated flag shown.

### D10.03 — Active Process Register & Resources (`system-processes`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** systemProcesses register; verify CPU% sampling interval is stated and PID reuse handled.
- **Missing integration:** Links 10-10.
- **Codex instruction:** Two-sample CPU delta with interval.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.03-1 Interval displayed.
  - AT8-D10.03-2 Exited PID row handled.
  - AT8-D10.03-3 Denied process path -> `denied`.

### D10.04 — System Binary Certificate Inspector (`system-signatures`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** systemSignatures via Authenticode; bounded batch with cancel.
- **Missing integration:** Apps 05-02.
- **Codex instruction:** Reuse the Apps signature function if present; one implementation.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.04-1 Signed/invalid fixtures.
  - AT8-D10.04-2 Cancel stops batch.
  - AT8-D10.04-3 No trust verdict wording.

### D10.05 — System Boot & Session Clock Timeline (`system-uptime`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Boot/session clock from OS timestamps; fast-startup hybrid boot must not be shown as a cold boot.
- **Missing integration:** Startup 09-07.
- **Codex instruction:** Show last boot vs last full shutdown if provider exposes it.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.05-1 Uptime equals independent calc.
  - AT8-D10.05-2 Hybrid boot labelled.
  - AT8-D10.05-3 Time zone stated.

### D10.06 — Live Performance Pulse Charts (`system-perf`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** systemSample charts with real sample times; no smoothing/synthetic jitter.
- **Missing integration:** Home 01-07.
- **Codex instruction:** Ring buffer with timestamps; gaps shown.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.06-1 N samples -> N points.
  - AT8-D10.06-2 Missed sample -> gap.
  - AT8-D10.06-3 Cancel stops sampler.

### D10.07 — Device Driver Inventory & Signatures (`system-drivers`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Driver inventory with signature state.
- **Missing integration:** Scan 02-09.
- **Codex instruction:** Unsigned count from provider fields only.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.07-1 Unsigned fixture counted.
  - AT8-D10.07-2 Provider failure -> unavailable.
  - AT8-D10.07-3 No driver-update/repair control.

### D10.08 — Event Log Channel Explorer (`system-logs`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Event channel explorer; channel list from provider.
- **Missing integration:** None.
- **Codex instruction:** Paged reads with cap.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.08-1 Channel list equals wevtutil el.
  - AT8-D10.08-2 Page limit enforced.
  - AT8-D10.08-3 Access denied shown per channel.

### D10.09 — Top Resource Consuming Processes (`system-resources`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Top processes derived from 10-03 sample.
- **Missing integration:** None.
- **Codex instruction:** Share sample object.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.09-1 Order equals independent sort.
  - AT8-D10.09-2 Interval shown.
  - AT8-D10.09-3 Ties deterministic.

### D10.10 — App-to-Process Cross-Service Links (`system-autostart`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** App<->process links join appsInventory and processes (path/signer).
- **Missing integration:** Apps 05, Startup 09.
- **Codex instruction:** Join on normalized image path; ambiguous matches listed as ambiguous.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.10-1 Known app maps to its process.
  - AT8-D10.10-2 Ambiguity flagged.
  - AT8-D10.10-3 No match -> `unlinked`.

### D10.11 — System Service Dependency Graph (`system-services-map`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Dependency graph from services snapshot (D12-04 same data).
- **Missing integration:** D12-04.
- **Codex instruction:** One data source.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.11-1 Edges equal sc qc depend.
  - AT8-D10.11-2 Cycle handled.
  - AT8-D10.11-3 Protected nodes marked.

### D10.12 — Unified System Event Timeline (`system-timeline`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Unified timeline merges events/boot/service transitions with true times.
- **Missing integration:** D12-08.
- **Codex instruction:** Time-zone normalized merge.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.12-1 Merge order by timestamp.
  - AT8-D10.12-2 Source labelled per row.
  - AT8-D10.12-3 Missing source disclosed.

### D10.13 — Network Interfaces Console (`network-interfaces`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Interfaces console from provider.
- **Missing integration:** Repair 11-06..08.
- **Codex instruction:** IPv4/IPv6/MAC/state only.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.13-1 Fixture adapters listed.
  - AT8-D10.13-2 Disabled adapter shown disabled.
  - AT8-D10.13-3 No change control.

### D10.14 — DNS Resolver Configuration Dossier (`network-dns-config`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** DNS configuration dossier.
- **Missing integration:** Repair 11-06.
- **Codex instruction:** Servers per interface; DoH state if exposed.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.14-1 Servers equal Get-DnsClientServerAddress.
  - AT8-D10.14-2 Missing -> unknown.
  - AT8-D10.14-3 No change control.

### D10.15 — Network Hardware Atlas & NIC Rack (`network-adapters`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** NIC rack: adapter hardware facts.
- **Missing integration:** None.
- **Codex instruction:** Driver/version/speed from provider.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.15-1 Speed unknown shown unknown.
  - AT8-D10.15-2 Virtual adapters labelled.
  - AT8-D10.15-3 No enable/disable control.

### D10.16 — Connectivity Diagnostic Step Sequence (`network-connectivity`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (active bounded diagnostics via systemDiagnostics) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Connectivity steps (gateway, DNS, internet) are active probes: must be user-initiated, cancellable and bounded; results must not claim ISP fault.
- **Missing integration:** Repair 11-06..08.
- **Codex instruction:** Each step shows command-equivalent, timeout and result; no external host beyond a documented fixed list.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.16-1 Cancel stops probes.
  - AT8-D10.16-2 Timeout reported.
  - AT8-D10.16-3 Offline distinct from DNS failure.

### D10.17 — Real-Time Traffic & Throughput Chart (`network-throughput`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Throughput chart uses real counters with delta sampling; no invented traffic.
- **Missing integration:** Home 01-07.
- **Codex instruction:** Counter wrap handled.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.17-1 Counter delta fixture.
  - AT8-D10.17-2 Interface removed mid-run handled.
  - AT8-D10.17-3 Units stated.

### D10.18 — Hop Route & Latency Visualizer (`network-traceroute`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (bounded tracert via systemTraceroute) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Route visualizer executes tracert (active). Bounded hops/timeouts; target validation to prevent argument injection.
- **Missing integration:** None.
- **Codex instruction:** Validate host/IP strictly; no shell string concatenation; cancel kills child.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.18-1 Injection string rejected.
  - AT8-D10.18-2 Cancel kills tracert.
  - AT8-D10.18-3 Timeouts displayed as `*`.

### D10.19 — LAN Topology & Node Relationship Map (`network-topology`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** LAN topology: neighbor table/ARP only; no port scan of other hosts.
- **Missing integration:** None.
- **Codex instruction:** Passive sources only; label `neighbors seen by this PC`.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.19-1 No outbound probe to LAN hosts (egress spy).
  - AT8-D10.19-2 ARP fixture rendered.
  - AT8-D10.19-3 Stale entries labelled.

### D10.20 — Active Socket & Port Explorer (`network-ports`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Socket/port explorer; owning process names require rights.
- **Missing integration:** Links 10-10.
- **Codex instruction:** Show denied owners.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.20-1 Listening fixture port mapped to PID.
  - AT8-D10.20-2 Denied owner shown.
  - AT8-D10.20-3 No kill/close control.

### D10.21 — Wireless Wi-Fi Status & Signal Instrument (`network-wifi`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Wi-Fi from netsh/WLAN API read; location permission may gate SSID.
- **Missing integration:** None.
- **Codex instruction:** Show `SSID hidden by privacy setting` state.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.21-1 No Wi-Fi adapter -> unavailable.
  - AT8-D10.21-2 Signal in dBm/percent labelled.
  - AT8-D10.21-3 No connect control.

### D10.22 — Windows Hosts File Inspector (`network-hosts`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY + hostsPlan PREVIEW · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Hosts inspector reads; systemHostsPlan is an immutable preview. NO write to hosts (requires elevation).
- **Missing integration:** None.
- **Codex instruction:** Keep this **Class A read-only** inspector and the existing immutable hosts-plan preview. **DO NOT implement hosts-file write, edit, or apply under D10.22.** Any future write feature requires a separate explicitly owner-approved Class C capability and security design, outside the current mandatory scope.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.22-1 Preview diff equals expected.
  - AT8-D10.22-2 Comment/blank/duplicate lines preserved.
  - AT8-D10.22-3 No apply control.

### D10.23 — Proxy & WinHTTP Configuration Graph (`network-proxies`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Proxy/WinHTTP graph read.
- **Missing integration:** None.
- **Codex instruction:** Show per-user vs machine.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.23-1 WinHTTP direct vs proxy fixture.
  - AT8-D10.23-2 PAC URL shown verbatim.
  - AT8-D10.23-3 No change control.

### D10.24 — Network Recovery & Reset Gateway (`network-repair-link`, class C)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW_ONLY (gateway to Repair Lab) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Class C gateway: shows reset consequences and hands off to Repair 11-06/07/08; no reset executes.
- **Missing integration:** Repair 11-06..08.
- **Codex instruction:** Keep as hand-off with irreversibility copy; execution belongs to Repair Lab executors if built.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.24-1 Hand-off opens Repair previews.
  - AT8-D10.24-2 No command executes from System.
  - AT8-D10.24-3 Copy lists consequences.

### D10.25 — Device Hardware Atlas & Components (`hardware-inventory`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Hardware atlas aggregates 26-35 providers.
- **Missing integration:** None.
- **Codex instruction:** Per-component provenance.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.25-1 Component list equals CIM.
  - AT8-D10.25-2 Missing component -> absent, not zero.
  - AT8-D10.25-3 Provider time shown.

### D10.26 — Battery Charge & Health Instrument (`hardware-battery`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Battery from Win32_Battery/power APIs; desktops have none.
- **Missing integration:** Home.
- **Codex instruction:** No battery -> `no battery`.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.26-1 Desktop fixture shows no battery.
  - AT8-D10.26-2 Charging state correct.
  - AT8-D10.26-3 Estimates labelled.

### D10.27 — Processor Architecture & Core Die (`hardware-cpu`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** CPU facts from CIM; temperature not exposed by Windows - must say unavailable.
- **Missing integration:** None.
- **Codex instruction:** No fabricated temps/clock.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.27-1 Core counts equal CIM.
  - AT8-D10.27-2 Temp unavailable shown.
  - AT8-D10.27-3 Arch string verbatim.

### D10.28 — Graphics Adapter Bay & VRAM (`hardware-gpu`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** GPU adapter/VRAM; WMI AdapterRAM caps at 4 GB - must not misreport.
- **Missing integration:** None.
- **Codex instruction:** Use DXGI/registry qword if available or label `reported by WMI (may be capped)`.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.28-1 >4 GB GPU labelled correctly.
  - AT8-D10.28-2 Missing GPU -> none.
  - AT8-D10.28-3 Driver date shown.

### D10.29 — DIMM RAM Slots & Memory Layout (`hardware-memory`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** DIMM layout from Win32_PhysicalMemory.
- **Missing integration:** None.
- **Codex instruction:** Empty slots only if provider reports them.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.29-1 Slot count equals CIM.
  - AT8-D10.29-2 Speed unknown -> unknown.
  - AT8-D10.29-3 No overclock claim.

### D10.30 — Battery Wear & Cycle Count Ledger (`hardware-cycles`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Battery wear/cycles: Windows exposes cycle count only on some devices.
- **Missing integration:** None.
- **Codex instruction:** Design vs full-charge capacity; cycles `unavailable` if absent.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.30-1 No cycle data -> unavailable.
  - AT8-D10.30-2 Wear computed from provider fields.
  - AT8-D10.30-3 No prediction.

### D10.31 — Thermal Sensors & Temperature Board (`hardware-thermal`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Thermal sensors: Windows rarely exposes CPU temps; ACPI zone temps only when present.
- **Missing integration:** None.
- **Codex instruction:** Show only provider sensors; otherwise `not exposed by Windows`.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.31-1 No sensor -> explicit unavailable.
  - AT8-D10.31-2 No synthetic gauge.
  - AT8-D10.31-3 Units labelled.

### D10.32 — Physical Disk Drives & Bus Interface (`hardware-disks`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Physical disks/bus interface from Get-PhysicalDisk/CIM.
- **Missing integration:** Storage 07-01/09.
- **Codex instruction:** Bus type unknown -> unknown.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.32-1 Disk list equals independent.
  - AT8-D10.32-2 Unknown bus shown.
  - AT8-D10.32-3 No firmware action.

### D10.33 — USB Controller & Device Topology Tree (`hardware-usb`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** USB topology tree from PnP data.
- **Missing integration:** None.
- **Codex instruction:** Hub/device relations from provider; no power-cycle control.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.33-1 Tree equals PnP parent relations.
  - AT8-D10.33-2 Disconnected device removed on refresh.
  - AT8-D10.33-3 No device action.

### D10.34 — Monitor Topology & Resolution Canvas (`hardware-display`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Monitor topology (EDID/display config).
- **Missing integration:** None.
- **Codex instruction:** Resolution/refresh from provider; per-DPI note.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.34-1 Multi-monitor fixture.
  - AT8-D10.34-2 Rotation shown.
  - AT8-D10.34-3 No resolution change control.

### D10.35 — Audio Endpoint Mixer & Devices (`hardware-audio`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Audio endpoints read; no volume/mixer control claims.
- **Missing integration:** None.
- **Codex instruction:** Rename card if it implies a mixer; read-only endpoints list.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.35-1 Endpoint list equals MMDevice read.
  - AT8-D10.35-2 Default device marked.
  - AT8-D10.35-3 No volume change.

### D10.36 — Hardware Evidence & Diagnostic Report (`hardware-health-report`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Hardware evidence report via systemReport.
- **Missing integration:** Export.
- **Codex instruction:** Report must include provenance and `unavailable` fields.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D10.36-1 Export contains sample times.
  - AT8-D10.36-2 Unavailable fields explicit.
  - AT8-D10.36-3 No secret/personal path unless chosen.


## D11 — Repair Lab (12 services)

- **Proof:** `DOMAIN_RUNTIME_PROOF_READ_ONLY` — SHA `ef25624`.
- **UI / workspace:** src/repair/{RepairServiceWorkspaces,RepairSystemWorkbenches,RepairServicingWorkbenches,RepairNetworkWorkbenches,RepairLiveStage}.tsx, catalog.ts, model.ts, native.ts, ui.tsx, useRepair.ts
- **Native provider:** electron/native/repair-bridge.cjs + repair-providers.cjs
- **IPC / contract symbols:** repairCapabilities, repairStart, repairStatus, repairCancel, repairSnapshot, repairPlan, repairJournal, repairReport, repairOpenSettings
- **Existing tests / receipts:** scripts/repair-native-test, repair-inner-evidence; proof: repair-main-sha-runtime/proof.json (7 checks: native read-only discovery for identity/servicing/network/update/restore, 12 immutable previews, history query, real report export, discovery cancellation)
- **Real execution capability:** Read-only discovery + 12 immutable previews + isolated app journal. NO DISM/SFC/ipconfig/netsh/wuauserv/restore-point command is executed anywhere (repairPlan preview only).
- **Consent / privilege:** Future executors: Class C; SP-07 per-action UAC; irreversibility copy before and after.
- **Missing runtime / packaged proof:** No repair effect proof of any kind (blocker B-S2 for disposable Windows VM).
- **State counts:** PREVIEW_OR_DRAFT_ONLY = 6, SOURCE_PRESENT_READ_ONLY = 6

### D11.01 — DISM CheckHealth Diagnostic Console (`repair-component-check`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (elevated-read-only; not executed) · **Proof:** `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** DISM /CheckHealth requires elevation; discovery/preview only. No repair command is executed anywhere; only read-only discovery and an immutable preview exist (proof ef25624).
- **Missing integration:** Journal feeds Home 01-11.
- **Codex instruction:** Needs SP-07 elevation helper to run read-only check; until then show `requires administrator`.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D11.01-1 Without elevation -> `requires administrator`, nothing run.
  - AT8-D11.01-2 Preview lists the exact command.
  - AT8-D11.01-3 With mock helper: exit code and parsed state recorded.

### D11.02 — DISM ScanHealth 7-Stage Console (`repair-component-scan`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (preview; not executed) · **Proof:** `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** ScanHealth is long-running; needs progress parsing and cancel. Not executed.
- **Missing integration:** Journal feeds Home 01-11.
- **Codex instruction:** Implement via helper with cancel; parse stage lines only if real.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D11.02-1 Cancel stops DISM child.
  - AT8-D11.02-2 No invented percent.
  - AT8-D11.02-3 Result unverified if parse fails.

### D11.03 — DISM RestoreHealth System Repair Wizard (`repair-component-restore`, class C)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW_ONLY (Class C) · **Proof:** `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** RestoreHealth not executed; needs source/WU decision, network, reboot flag.
- **Missing integration:** Journal feeds Home 01-11.
- **Codex instruction:** Class C executor: exact plan, UAC, verify via CheckHealth, journal, no Undo.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D11.03-1 Declined UAC -> E_ELEVATION_DENIED, no effect.
  - AT8-D11.03-2 Post-verify CheckHealth required for success.
  - AT8-D11.03-3 Irreversibility copy before/after.

### D11.04 — SFC VerifyOnly File Integrity Shield (`repair-files-verify`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (not executed) · **Proof:** `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** SFC /verifyonly not executed; CBS.log parsing needed.
- **Missing integration:** Journal feeds Home 01-11.
- **Codex instruction:** Run only via helper; show unverified if CBS parse fails.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D11.04-1 Exit code != verification.
  - AT8-D11.04-2 CBS summary parsed with provenance.
  - AT8-D11.04-3 Cancel handled.

### D11.05 — SFC ScanNow Protected File Repair Wizard (`repair-files-repair`, class C)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW_ONLY (Class C) · **Proof:** `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** SFC /scannow repair not executed.
- **Missing integration:** Journal feeds Home 01-11.
- **Codex instruction:** Class C executor with UAC, CBS evidence, reboot flag.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D11.05-1 Result states exactly what was repaired/unrepairable.
  - AT8-D11.05-2 No Undo control.
  - AT8-D11.05-3 Verification by second verifyonly.

### D11.06 — DNS Resolver Cache Refresh Preview (`repair-dns-flush`, class C)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW_ONLY (Class C) · **Proof:** `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** ipconfig /flushdns not executed; low-risk but still an effect.
- **Missing integration:** Journal feeds Home 01-11.
- **Codex instruction:** Execute with confirmation; verify cache count change via provider.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D11.06-1 Pre/post DNS cache entries recorded.
  - AT8-D11.06-2 Declined confirmation -> no effect.
  - AT8-D11.06-3 Journal receipt written.

### D11.07 — Winsock Catalog Disruption Risk Review (`repair-winsock-reset`, class C)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW_ONLY (Class C) · **Proof:** `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Winsock reset not executed; requires reboot, can break VPN/LSPs.
- **Missing integration:** Journal feeds Home 01-11.
- **Codex instruction:** Show LSP catalog diff; execute only with UAC; reboot-required flag.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D11.07-1 Catalog snapshot saved before reset.
  - AT8-D11.07-2 Reboot flag shown.
  - AT8-D11.07-3 No Undo claim.

### D11.08 — TCP/IP Stack Reset Configuration Diff (`repair-tcpip-reset`, class C)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW_ONLY (Class C) · **Proof:** `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** TCP/IP reset not executed; resets adapters config.
- **Missing integration:** Journal feeds Home 01-11.
- **Codex instruction:** Configuration diff preview; execute with UAC; reboot flag; log path.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D11.08-1 Diff equals actual changed keys on mock.
  - AT8-D11.08-2 Static IP loss warned.
  - AT8-D11.08-3 No Undo claim.

### D11.09 — System Repair Audit Journal (`repair-history`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Audit journal is an isolated app journal (repairJournal). Must record only real events.
- **Missing integration:** Receipts shared.
- **Codex instruction:** Schema-version the journal; mark `preview` vs `executed`.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D11.09-1 Preview recorded as preview, never executed.
  - AT8-D11.09-2 Journal survives restart.
  - AT8-D11.09-3 Tampered entry flagged.

### D11.10 — Windows Troubleshooter Gateway (`repair-troubleshooters`, class C)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY/GATED (Windows troubleshooters deprecated) · **Proof:** `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Troubleshooter gateway: Microsoft is retiring many troubleshooters; availability must be probed, not assumed.
- **Missing integration:** Journal feeds Home 01-11.
- **Codex instruction:** Probe for msdt/ms-settings availability; open Settings (appsOpenSettings-style) only on user click.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D11.10-1 Unavailable troubleshooter -> `unavailable`.
  - AT8-D11.10-2 Launch only on click with confirmation.
  - AT8-D11.10-3 No auto-run.

### D11.11 — System Restore Point Inspector (`repair-restore-point`, class C)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Restore point inspector reads shadow/restore points; creation/rollback not implemented (Class C).
- **Missing integration:** Creation needs elevation and System Protection enabled.
- **Codex instruction:** Read list; creation as future Class C; never trigger rollback programmatically.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D11.11-1 Protection disabled -> stated.
  - AT8-D11.11-2 List equals vssadmin/WMI.
  - AT8-D11.11-3 No rollback control.

### D11.12 — Windows Update Servicing Reset Wizard (`repair-update-reset`, class C)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW_ONLY (Class C) · **Proof:** `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY`
- **Missing (functional / verification):** Windows Update reset (stop services, rename SoftwareDistribution/catroot2) not executed; overlaps D12 service rules (Microsoft services are protected).
- **Missing integration:** Journal feeds Home 01-11.
- **Codex instruction:** Needs an explicit exception design: this is a Microsoft-service operation that D12 refuses; specify separately.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D11.12-1 Plan lists every service/folder touched.
  - AT8-D11.12-2 Services restarted verified.
  - AT8-D11.12-3 Failure leaves exact state report.


## D12 — Services (12 services)

- **Proof:** `NONE_POST_ARCHIVE` — SHA `none in package`.
- **UI / workspace:** src/services/{ServicesServiceWorkspaces,ServicesCoreWorkbenches,ServicesRegisterWorkbenches,ServicesAnalyticsWorkbenches,ServiceStateWorkbench}.tsx, catalog.ts, model.ts, native.ts, useServices.ts
- **Native provider:** electron/native/services-bridge.cjs + services-providers.cjs (protectionDecision) + service-actions.cjs (ServiceActions) + service-control.cjs
- **IPC / contract symbols:** servicesCapabilities/Start/Status/Cancel/Snapshot/Plan/Journal/Report; operations:v1 serviceStatePlan, serviceRestorePlan, serviceStateApply, serviceReceipts
- **Existing tests / receipts:** scripts/services-native-test, service-actions-test (mock SCM start/stop/recovery, interrupted transition, seven protected cases, permission denial, stale/expired/unapproved plans, strict IPC); historical: real READ_ONLY EventLog identity/signature/dependency run
- **Real execution capability:** REAL executor (mock-SCM-verified only): start/stop ONLY for signed non-Microsoft third-party services outside %WINDIR%, no drivers, no active dependents (no cascade/force), identity-hash + state read-back, receipt before mutation, recovery plan. Startup-policy change, restart, force remain gated.
- **Consent / privilege:** planHash + 5-minute expiry + native confirmation + protected receipts; no UAC helper exists (SP-07 absent) so non-elevated SCM rights decide.
- **Missing runtime / packaged proof:** Live SCM effect NOT RUN; no post-archive Electron receipt.
- **State counts:** EXECUTOR_PRESENT = 2, SOURCE_PRESENT_READ_ONLY = 10

### D12.01 — Windows SCM Service Register (`services-inventory`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Win32_Service
- **Missing (functional / verification):** SCM register read (servicesSnapshot). Historical: real READ_ONLY EventLog identity/signature/dependency run. No post-archive receipt.
- **Missing integration:** Home 01-12? no; Startup 09-08.
- **Codex instruction:** Verify coverage + signature fields; no write.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D12.01-1 Count equals sc query.
  - AT8-D12.01-2 Binary path/signer shown.
  - AT8-D12.01-3 Denied query -> unreadable.

### D12.02 — Service State Change Review & Guard (`services-control`, class C)
- **Implementation:** `EXECUTOR_PRESENT` · **Execution:** EXECUTOR_PRESENT_MOCK_VERIFIED (start/stop, third-party only) · **Proof:** `MOCK_TEST_ONLY_(historical)_NO_LIVE_EFFECT_NOT_VERIFIED_AT_HEAD`
- **Source-declared state:** `gated` — provider: Win32_Service + dependency graph
- **Missing (functional / verification):** ServiceActions: signed non-Microsoft, outside %WINDIR%, not driver, no active dependents, hash/identity read-back, receipt before mutation. Missing: live SCM effect on disposable VM; UI for eligibility reasons; restart is gated; no UAC helper so non-admin SCM rights decide.
- **Missing integration:** Receipts -> Home 01-12.
- **Codex instruction:** Do not rewrite. Add L6 test with a test service installed in a disposable VM; surface SCM_TARGET_GATED reasons in UI.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D12.02-1 Microsoft/driver/%WINDIR% target -> SCM_TARGET_GATED.
  - AT8-D12.02-2 Active dependents -> SCM_DEPENDENCY_CONFLICT.
  - AT8-D12.02-3 Postcondition mismatch -> SCM_POSTCONDITION_FAILED as unverified.
  - AT8-D12.02-4 L6: test service stop/start with identity hash unchanged.

### D12.03 — Service Startup Policy Undo Journal (`services-undo`, class C)
- **Implementation:** `EXECUTOR_PRESENT` · **Execution:** EXECUTOR_PRESENT_MOCK_VERIFIED (restore) · **Proof:** `MOCK_TEST_ONLY_(historical)_NO_LIVE_EFFECT_NOT_VERIFIED_AT_HEAD`
- **Source-declared state:** `gated` — provider: Local preview journal
- **Missing (functional / verification):** restorePlan reverses a receipt when identity/state match; conflict refuses without force. Startup-policy undo is NOT implemented (policy changes gated) despite the service name.
- **Missing integration:** Receipts.
- **Codex instruction:** Rename scope in UI to `state undo`; do not imply startup-type restore.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D12.03-1 Changed service state -> SCM_RESTORE_CONFLICT.
  - AT8-D12.03-2 Receipt tamper -> SCM_RECEIPT_INVALID.
  - AT8-D12.03-3 Second undo no-op.

### D12.04 — Interactive Service Dependency Network (`services-dependencies`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Win32_Service.Dependencies
- **Missing (functional / verification):** Dependency network from snapshot (same data as D10-11).
- **Missing integration:** D10-11.
- **Codex instruction:** One shared graph builder.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D12.04-1 Edges equal sc qc.
  - AT8-D12.04-2 Protected nodes marked.
  - AT8-D12.04-3 Large graph virtualized.

### D12.05 — Protected Windows Core Services Atlas (`services-protected`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Capability protection policy
- **Missing (functional / verification):** Protected-core atlas from protectionDecision (services-providers.cjs).
- **Missing integration:** Used by ServiceActions.
- **Codex instruction:** Display rule that decided protection per row.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D12.05-1 Every protected row cites a rule.
  - AT8-D12.05-2 Atlas equals eligible() refusals.
  - AT8-D12.05-3 No override control.

### D12.06 — SCM Keyboard-First Query Console (`services-search`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Win32_Service
- **Missing (functional / verification):** Query console over snapshot.
- **Missing integration:** None.
- **Codex instruction:** Keyboard-first.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D12.06-1 Query equals filter.
  - AT8-D12.06-2 Keyboard-only.
  - AT8-D12.06-3 Empty state.

### D12.07 — Startup Policy Distribution Analytics (`services-startup-report`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Win32_Service.StartMode
- **Missing (functional / verification):** Startup policy distribution analytics.
- **Missing integration:** Startup 09-08.
- **Codex instruction:** Count by startMode from snapshot.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D12.07-1 Counts sum to total.
  - AT8-D12.07-2 Equals Startup 09-08 matrix.
  - AT8-D12.07-3 Unknown mode bucket.

### D12.08 — Service Transition State History (`services-state-history`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `partial` — provider: Service Control Manager event log
- **Missing (functional / verification):** Transition history needs repeated samples/Event IDs 7036/7040; verify source and window.
- **Missing integration:** D10-12.
- **Codex instruction:** Use event log, disclose retention.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D12.08-1 Window shown.
  - AT8-D12.08-2 Missing events -> none known.
  - AT8-D12.08-3 Equals event ledger.

### D12.09 — Cascade Service Dependency Impact Tree (`services-dependents`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Computed reverse dependency edges
- **Missing (functional / verification):** Cascade impact tree computed from dependents; must not offer cascade action.
- **Missing integration:** None.
- **Codex instruction:** Read-only; copy says no cascade operation exists.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D12.09-1 Tree equals dependents.
  - AT8-D12.09-2 No stop-all control.
  - AT8-D12.09-3 Cycle safe.

### D12.10 — SCM Fault Investigation & Diagnostics (`services-diagnose`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `partial` — provider: Service Control Manager event log
- **Missing (functional / verification):** Fault investigation from failure actions/events.
- **Missing integration:** D10-02.
- **Codex instruction:** Show recovery config + recent 7031/7034 events.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D12.10-1 Failure fixture shown.
  - AT8-D12.10-2 No restart control.
  - AT8-D12.10-3 Evidence cited.

### D12.11 — Startup Policy Configuration Diff (`services-config`, class C)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (Class C label: no config executor) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `gated` — provider: Win32_Service.StartMode
- **Missing (functional / verification):** Config diff compares snapshots; no sc config executor.
- **Missing integration:** None.
- **Codex instruction:** Keep read-only until specified.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D12.11-1 Diff equals snapshot delta.
  - AT8-D12.11-2 Tamper-evident hashes.
  - AT8-D12.11-3 No apply control.

### D12.12 — Shared-Process svchost.exe Monitor (`services-perf`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Win32_Service.ProcessId + Win32_Process
- **Missing (functional / verification):** svchost shared-process monitor; per-service CPU split is not exposed by Windows - show process-level only.
- **Missing integration:** D10-03.
- **Codex instruction:** No fabricated per-service CPU.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D12.12-1 Shared host lists hosted services.
  - AT8-D12.12-2 Per-service CPU absent.
  - AT8-D12.12-3 PID reuse handled.


## D13 — Automation (12 services)

- **Proof:** `NONE_POST_ARCHIVE` — SHA `none in package`.
- **UI / workspace:** src/automation/{AutomationServiceWorkspaces,AutomationCoreWorkbenches,AutomationPolicyWorkbenches,AutomationRunWorkbench}.tsx, catalog.ts, model.ts, native.ts, useAutomation.ts
- **Native provider:** electron/native/automation-bridge.cjs + automation-providers.cjs + automation-runner.cjs + automation-scheduler.cjs
- **IPC / contract symbols:** automationCapabilities/Start/Status/Cancel/Snapshot/Workflows/Save/Templates/DryRun/SchedulePreview/ValidateImport/Journal/Report; operations:v1 automationRunPlan, automationRun, automationRunReceipts, automationRunCancel, automationScheduleArm, automationSchedulePause, automationSchedules
- **Existing tests / receipts:** scripts/automation-native-test, automation-runner-test (native-owned file), automation-scheduler-test (virtual clock, foreground/power/quiet gates, per-occurrence consent, changed-graph/revocation pause, restart re-arm, no duplicate occurrence); isolated Electron: DPAPI + save/version review + arm/pause (historical)
- **Real execution capability:** Runner executes ONLY explicitly enabled read-only auto-smart-scan observation nodes (modules inventory|capacity|system) after exact-plan approval; any other node => AUTOMATION_ACTION_GATED. Scheduler arms occurrences with per-occurrence consent. NO cleanup/backup/notification/export-to-external action executes.
- **Consent / privilege:** planHash approval per run; per-occurrence consent for scheduled runs; DPAPI storage.
- **Missing runtime / packaged proof:** Actual owner-OS effects/full-shell/scaling NOT RUN; no post-archive Electron receipt.
- **State counts:** EXECUTOR_PRESENT = 2, PREVIEW_OR_DRAFT_ONLY = 7, SOURCE_PRESENT_READ_ONLY = 3

### D13.01 — Smart Scan Automated Workflow Flow (`auto-smart-scan`, class B)
- **Implementation:** `EXECUTOR_PRESENT` · **Execution:** EXECUTOR_PRESENT (observation-only; manual run) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `gated` — provider: Local draft + dry-run
- **Missing (functional / verification):** Runner executes only auto-smart-scan nodes with dryRunOnly:false and modules inventory|capacity|system after exact-plan approval; receipts native-observation-run-v1. Missing: packaged/owner-OS proof, cancellation proof at HEAD.
- **Missing integration:** Scan 02, Home 01-11.
- **Codex instruction:** Keep observation-only. Do not add mutation node types without a separate Class B/C design.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D13.01-1 Non-scan node -> AUTOMATION_ACTION_GATED.
  - AT8-D13.01-2 Plan hash mismatch -> refused.
  - AT8-D13.01-3 Run cancel stops the native scan.
  - AT8-D13.01-4 Receipt survives restart.

### D13.02 — Weekly Automation Calendar & Task Manager (`auto-schedule-manager`, class B)
- **Implementation:** `EXECUTOR_PRESENT` · **Execution:** EXECUTOR_PRESENT (scheduler; observation-only) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `gated` — provider: Persisted schedule metadata
- **Missing (functional / verification):** AutomationScheduler: arm/pause with per-occurrence consent, quiet hours, power/foreground gates, restart re-arm, no duplicate occurrence (virtual-clock tests). Missing: live OS timing run; no OS Task Scheduler registration (in-app timer only: app must be running).
- **Missing integration:** Cleanup 08-11 delegates here.
- **Codex instruction:** State clearly that schedules run only while the app runs unless an OS-level registration is specified; do not claim background execution.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D13.02-1 Virtual clock: occurrence fires once.
  - AT8-D13.02-2 Changed graph pauses schedule.
  - AT8-D13.02-3 App not running -> missed occurrence recorded, not silently run.

### D13.03 — Automation Run History Timeline (`auto-run-history`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Local dry-run journal
- **Missing (functional / verification):** Run history from automationRunReceipts + journal.
- **Missing integration:** Home 01-11.
- **Codex instruction:** Real timestamps; unreadable receipts shown.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D13.03-1 History equals receipts.
  - AT8-D13.03-2 Tamper -> unreadable.
  - AT8-D13.03-3 Filter by status.

### D13.04 — Workflow Template Gallery & Library (`auto-templates`, class A)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Built-in templates
- **Missing (functional / verification):** Template gallery: templates are data (automationTemplates); no template may carry an executable mutation node.
- **Missing integration:** None.
- **Codex instruction:** Validate templates against allowed node types.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D13.04-1 Template with gated node flagged.
  - AT8-D13.04-2 Import validated (automationValidateImport).
  - AT8-D13.04-3 No auto-run on import.

### D13.05 — Recurrence Composer & Cron Preview (`auto-schedule-plan`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** DRAFT/PREVIEW (automationSchedulePreview) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: Intl host timezone
- **Missing (functional / verification):** Recurrence composer + cron-like preview; verify DST/timezone rules.
- **Missing integration:** Scheduler 13-02.
- **Codex instruction:** Add DST fixtures to the preview calculator.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D13.05-1 DST spring-forward occurrence correct.
  - AT8-D13.05-2 Preview equals scheduler arm times.
  - AT8-D13.05-3 Invalid rule rejected.

### D13.06 — Safe Automated Cleanup Pipeline (`auto-cleanup-plan`, class C)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** PREVIEW_ONLY (Class C label; no cleanup node executes) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `gated` — provider: Preview-only pipeline
- **Missing (functional / verification):** Safe cleanup pipeline is a plan; AUTOMATION_ACTION_GATED prevents any cleanup node from running.
- **Missing integration:** Vault 07-03 for any future step.
- **Codex instruction:** Keep gated. Any future cleanup step must create a Vault plan needing human approval each occurrence.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D13.06-1 Cleanup node run -> gated.
  - AT8-D13.06-2 No file touched (hash compare).
  - AT8-D13.06-3 Plan states approval needed.

### D13.07 — Notification Channel Routing Board (`auto-notify`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** DRAFT_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `gated` — provider: Local channel policy
- **Missing (functional / verification):** Notification routing board: no notification provider exists (no toast/mail channel). Must say `not delivered`.
- **Missing integration:** None.
- **Codex instruction:** Either implement native Notification via Main with consent or label as draft.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D13.07-1 No external send occurs (egress spy).
  - AT8-D13.07-2 Draft state labelled.
  - AT8-D13.07-3 Settings persist.

### D13.08 — Quiet Hours 24-Hour Dial (`auto-quiet-hours`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** DRAFT_ONLY (quietNow gate is real) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `gated` — provider: Local policy draft
- **Missing (functional / verification):** Quiet-hours dial affects scheduler gating (quietNow). Verify weekendRule and overnight spans.
- **Missing integration:** Scheduler.
- **Codex instruction:** Add overnight/weekend tests.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D13.08-1 22:00-06:00 span correct.
  - AT8-D13.08-2 Weekend mute applied.
  - AT8-D13.08-3 DST boundary.

### D13.09 — Power-Aware Scheduler & Battery Gating (`auto-battery-policy`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** DRAFT_ONLY (power gate present in scheduler) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `partial` — provider: Win32_Battery where available
- **Missing (functional / verification):** Battery gating read from power state; verify AC/DC transitions.
- **Missing integration:** Scheduler.
- **Codex instruction:** Test with mocked power state.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D13.09-1 On battery below threshold -> run skipped and recorded.
  - AT8-D13.09-2 AC restored -> next occurrence ok.
  - AT8-D13.09-3 Unknown power -> skip with reason.

### D13.10 — Artifact Retention Policy Timeline (`auto-retention`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** DRAFT_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `gated` — provider: Local journal metadata
- **Missing (functional / verification):** Retention policy timeline for receipts/artifacts: no pruner exists.
- **Missing integration:** Receipts stores.
- **Codex instruction:** Implement pruning as an explicit, confirmed, journaled action on app-owned stores only.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D13.10-1 Pruning touches only app userData.
  - AT8-D13.10-2 Receipt of prune written.
  - AT8-D13.10-3 Dry-run lists exact files.

### D13.11 — Workflow Export & Schema Transfer (`auto-export`, class B)
- **Implementation:** `SOURCE_PRESENT_READ_ONLY` · **Execution:** READ_ONLY (automationValidateImport/export) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `available` — provider: knoux.workflow.v1
- **Missing (functional / verification):** Workflow export/import with schema validation; verify hash, size, version and secret exclusion.
- **Missing integration:** None.
- **Codex instruction:** Reject unknown node types.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D13.11-1 Corrupt import refused.
  - AT8-D13.11-2 Export contains no tokens/paths unless chosen.
  - AT8-D13.11-3 Round-trip equals.

### D13.12 — Backup Flow & Verification Designer (`auto-backup-plan`, class B)
- **Implementation:** `PREVIEW_OR_DRAFT_ONLY` · **Execution:** DRAFT_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Source-declared state:** `partial` — provider: Studio sources + destination gate
- **Missing (functional / verification):** Backup flow designer: no backup executor exists.
- **Missing integration:** Would reuse OperationEngine copy.
- **Codex instruction:** Backup via existing copy operation with hash verification, only after a separate design.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D13.12-1 Plan shows source/dest/hash.
  - AT8-D13.12-2 No copy without approval.
  - AT8-D13.12-3 Verification by hash.


## D14 — Settings / Engine / AI (8 services)

- **Proof:** `NONE` — SHA `none in package`.
- **UI / workspace:** src/pages/SettingsPage.tsx (958 lines; tabs engine, ai_keys, workspace, guard, appearance, language, backup, clipboard); src/components/chat/{KNOuXAssistantChat,ApiKeySetupModal}.tsx; src/settings/profile.ts; src/lib/ai-session.ts; src/clipboard/ClipboardVault.tsx
- **Native provider:** clipboard-vault.cjs + clipboard-ipc.cjs (real, DPAPI); google-auth.cjs; NO engine/turbo provider; NO AI provider proxy; provider-bridge.cjs is the read-only Windows adapter (despite its name)
- **IPC / contract symbols:** clipboardStatus/Configure/List/Get/Pin/Remove/Clear/Copy; google*
- **Existing tests / receipts:** scripts/settings-consent-test.cjs (honesty + credential-boundary regression), clipboard-electron-test (not supplied: sensitive-signature exclusion), google-oauth-test
- **Real execution capability:** Non-secret preference persistence works. SettingsPage keeps the AI key in renderer session memory (ai-session.ts) and calls the provider with it from the renderer (fetch with Bearer in SettingsPage.tsx) - this CONTRADICTS the tokens-only-in-Main rule (SP-08) and is a priority fix. Guard/Engine controls are intentionally off (unsupported).
- **Consent / privilege:** AI: separate explicit consent per third-party data class; Google restricted data never to AI.
- **Missing runtime / packaged proof:** No provider proxy, allowlist, quota/backoff or consent ledger; clipboard-native-test excluded from snapshot (contains a sensitive-token signature) - owner must confirm it is clean before commit.
- **State counts:** PARTIAL_OR_UNSUPPORTED = 8

### D14.01 — Engine & Turbo Hardware (`mission-14-01`, class B)
- **Implementation:** `PARTIAL_OR_UNSUPPORTED` · **Execution:** PREFERENCES_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** engineMode (turbo|balanced|silent) is stored as a non-secret preference; no engine/turbo provider applies it. Must stay labelled `preference, not applied` until a real provider exists.
- **Missing integration:** Limits (memory ceiling for Smart Scan deep) should be read by ScanBridge.
- **Codex instruction:** Either wire engineMode to concrete ScanBridge/worker limits (documented values) or keep honest copy. Do not invent power-plan changes.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D14.01-1 UI states that no OS setting changed.
  - AT8-D14.01-2 If wired: deep-scan worker cap equals the documented value for each mode.
  - AT8-D14.01-3 Preference persists across restart.

### D14.02 — AI Copilot & Provider Keys (`mission-14-02`, class D)
- **Implementation:** `PARTIAL_OR_UNSUPPORTED` · **Execution:** SESSION_KEY_RENDERER (SECURITY GAP) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** AI key is held in renderer memory (ai-session.ts) and SettingsPage calls the provider directly with Bearer. No native vault, proxy, allowlist, quota, or consent ledger.
- **Missing integration:** Chat (14-08) depends on this.
- **Codex instruction:** Create a Main-process provider proxy with encrypted key storage (safeStorage/DPAPI like protected-action-store), host allowlist, rate limit, and per-data-class consent; remove renderer fetch with keys; update settings-consent-test.cjs to fail on any renderer-side key use.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D14.02-1 Renderer bundle contains no provider fetch with Authorization.
  - AT8-D14.02-2 Key never appears in logs, localStorage, or IPC replies (leak scan).
  - AT8-D14.02-3 Consent required before any personal file data is sent; Google data never.

### D14.03 — Google Workspace Hub (`mission-14-03`, class D)
- **Implementation:** `PARTIAL_OR_UNSUPPORTED` · **Execution:** CONNECTOR_PARTIAL · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Hub shows Google connect state backed by google-auth.cjs (Sheets read-only).
- **Missing integration:** One connection state shared with D04.
- **Codex instruction:** Bind hub to googleStatus; list granted scopes with Console labels; disconnect = revoke + purge.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D14.03-1 Granted scopes list equals REQUIRED_SCOPES actually granted.
  - AT8-D14.03-2 Disconnect clears status and cached data.
  - AT8-D14.03-3 No token in renderer.

### D14.04 — Automated Protection & Guards (`mission-14-04`, class B)
- **Implementation:** `PARTIAL_OR_UNSUPPORTED` · **Execution:** UNSUPPORTED (controls intentionally off) · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** No guard engine exists; controls off is correct.
- **Missing integration:** None until a real guard provider is defined.
- **Codex instruction:** Keep controls disabled with truthful copy; do not add a fake toggle. Define scope in a separate decision before implementing.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D14.04-1 All guard controls disabled and labelled unsupported.
  - AT8-D14.04-2 No background process is started.
  - AT8-D14.04-3 Settings consent test passes.

### D14.05 — Neon Glass Customization (`mission-14-05`, class A)
- **Implementation:** `PARTIAL_OR_UNSUPPORTED` · **Execution:** PREFERENCES_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Appearance persisted locally; theme-light.css and theme tests exist (tests/theme). Verify global Day/Night parity on all 14 routes at 3 viewports (theme-evidence-matrix is modified and has untracked matrices).
- **Missing integration:** Visual evidence matrices are untracked: preserve.
- **Codex instruction:** Run theme-evidence-matrix at HEAD; fix parity defects only; do not delete docs/evidence/theme-matrix-*.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D14.05-1 Day and Night render every route without clipped text at 1672/1366/mobile.
  - AT8-D14.05-2 Preference survives restart.
  - AT8-D14.05-3 Reduced-motion respected.

### D14.06 — Language & Locale (`mission-14-06`, class A)
- **Implementation:** `PARTIAL_OR_UNSUPPORTED` · **Execution:** PREFERENCES_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** EN/AR persisted; RTL coverage across all routes to be verified.
- **Missing integration:** Used by every workspace.
- **Codex instruction:** Run an RTL pass on all 14 routes; add missing Arabic strings; no layout mirroring hacks.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D14.06-1 Every route renders RTL with no horizontal overflow.
  - AT8-D14.06-2 Language persists.
  - AT8-D14.06-3 No untranslated string in a scripted scan.

### D14.07 — Profile Backup & System Restore (`mission-14-07`, class B)
- **Implementation:** `PARTIAL_OR_UNSUPPORTED` · **Execution:** PREFERENCES_ONLY · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** Non-secret preferences backup/restore only; no Windows/system restore (correctly stated in UI).
- **Missing integration:** Excludes tokens/keys/receipts.
- **Codex instruction:** Verify export excludes secrets; add import validation (schema, size, version).
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D14.07-1 Export contains no key/token (scan).
  - AT8-D14.07-2 Corrupt import refused with a clear error.
  - AT8-D14.07-3 Restore does not claim OS restore.

### D14.08 — AI Assistant Chat (`mission-14-08`, class D)
- **Implementation:** `PARTIAL_OR_UNSUPPORTED` · **Execution:** UI_ONLY_NO_PROVIDER · **Proof:** `NOT VERIFIED (no post-archive receipt for this domain)`
- **Missing (functional / verification):** KNOuXAssistantChat + ApiKeySetupModal exist; no secure provider proxy (depends on 14-02).
- **Missing integration:** Must never receive file content without consent.
- **Codex instruction:** After 14-02, route chat through the Main proxy; show data-class consent; no tool execution by the model.
- **Acceptance tests (in addition to the generic suites G-A/G-B/G-C/G-D of Vol. 1 Part 8.3b):**
  - AT8-D14.08-1 Chat works only via proxy; direct fetch absent.
  - AT8-D14.08-2 No file path/content sent without explicit consent.
  - AT8-D14.08-3 Provider error/offline/quota states distinct.


---

# Part E — Completion gates (unchanged semantics, current naming)
- **G-S1 (new, blocking):** no renderer bundle contains a provider `fetch` with credentials; token/key leak scan over logs, IPC replies and storage returns zero.
- **G-X1 (no duplicate engines):** a repository-wide check that there is exactly one implementation each of: move/copy+undo (`operation-engine.cjs`), quarantine (`storage-vault.cjs`), protected receipts (`protected-action-store.cjs`), scheduler (`automation-scheduler.cjs`), Google OAuth (`google-auth.cjs`), authorized-source model, ranking function, category map. New executors (apps, repair, hosts, …) **reuse** `OperationEngine.runJob`, `ProtectedActionStore` and native confirm.
- **G-P1 (preservation):** at every handoff `git rev-parse` of the canonical checkout is unchanged, the dirty-file list is a superset of the Step-0 list, and the safety bundle/patch/zip hashes still verify.
- **G-E1 (evidence honesty):** every status cell is one of the Appendix 2 vocabulary; every `COMPLETE` cites a receipt with `commitSha`, host, layer and dirty-tree flag; every absent receipt says `NOT VERIFIED`.
- **G-C\* / G-B\* / G-D\* / G-A\*:** as in Vol. 1 Part 8.3b, applied per class.

# Appendix 1 — Reconciled 181-row matrix
Full machine-readable matrix with all 22 fields: `KNOuX_181_Reconciled_Matrix_ef25624.csv`. Summary:

| Spec ID | CSV ID | Service | Class | Implementation | Execution capability | Proof |
|---|---|---|---|---|---|---|
| D01.01 | `mission-01-01` | Smart Scan | B | `SOURCE_PRESENT_READ_ONLY` | NAVIGATION_AND_MEASURED_READ | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D01.02 | `mission-01-02` | Organize Files | B | `SOURCE_PRESENT_READ_ONLY` | NAVIGATION_AND_MEASURED_READ | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D01.03 | `mission-01-03` | Applications | B | `SOURCE_PRESENT_READ_ONLY` | NAVIGATION_AND_MEASURED_READ | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D01.04 | `mission-01-04` | Storage | A | `SOURCE_PRESENT_READ_ONLY` | NAVIGATION_AND_MEASURED_READ | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D01.05 | `mission-01-05` | Cleanup | B | `SOURCE_PRESENT_READ_ONLY` | NAVIGATION_AND_MEASURED_READ | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D01.06 | `mission-01-06` | Startup Control | B | `SOURCE_PRESENT_READ_ONLY` | NAVIGATION_AND_MEASURED_READ | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D01.07 | `mission-01-07` | System Live Pulse | A | `SOURCE_PRESENT_READ_ONLY` | NAVIGATION_AND_MEASURED_READ | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D01.08 | `mission-01-08` | Repair Lab | B | `SOURCE_PRESENT_READ_ONLY` | NAVIGATION_AND_MEASURED_READ | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D01.09 | `mission-01-09` | Global Search | A | `SOURCE_PRESENT_READ_ONLY` | MEASURED_READ | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D01.10 | `mission-01-10` | KNOuX Insight | A | `SOURCE_PRESENT_READ_ONLY` | MEASURED_READ | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D01.11 | `mission-01-11` | Recent Activity | A | `SOURCE_PRESENT_READ_ONLY` | MEASURED_READ | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D01.12 | `mission-01-12` | Pending Safe Actions | B | `SOURCE_PRESENT_READ_ONLY` | REVIEW_ONLY_NO_EXECUTOR | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D02.01 | `mission-02-01` | Quick Scan | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY` |
| D02.02 | `mission-02-02` | Deep Scan | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY` |
| D02.03 | `mission-02-03` | Duplicate Finder | B | `READ_ONLY_PLUS_HANDOFF` | READ_ONLY+HANDOFF | `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY` |
| D02.04 | `mission-02-04` | Large Files | A | `READ_ONLY_PLUS_HANDOFF` | READ_ONLY+HANDOFF | `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY` |
| D02.05 | `mission-02-05` | Junk Cleaner | C | `READ_ONLY_PLUS_HANDOFF` | READ_ONLY+HANDOFF | `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY` |
| D02.06 | `mission-02-06` | Privacy Trace Check | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY` |
| D02.07 | `mission-02-07` | Startup Impact | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY` |
| D02.08 | `mission-02-08` | App Health | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY` |
| D02.09 | `mission-02-09` | System Health Pulse | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY` |
| D02.10 | `mission-02-10` | Smart Recommendations | B | `READ_ONLY_PLUS_HANDOFF` | READ_ONLY+HANDOFF | `RUNTIME_PROOF_8ff8131_DOMAIN_LEVEL_READ_ONLY` |
| D03.01 | `mission-03-01` | Sources | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL` |
| D03.02 | `mission-03-02` | Visual Library | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL` |
| D03.03 | `mission-03-03` | Collections | A | `SOURCE_PRESENT_READ_ONLY` | LOCAL_STATE | `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL` |
| D03.04 | `mission-03-04` | Organization Builder | B | `PREVIEW_OR_DRAFT_ONLY` | PLAN_BUILDING | `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL` |
| D03.05 | `mission-03-05` | Destinations | B | `PREVIEW_OR_DRAFT_ONLY` | PLAN_BUILDING | `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL` |
| D03.06 | `mission-03-06` | Plan Review | B | `PREVIEW_OR_DRAFT_ONLY` | PLAN_REVIEW | `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL` |
| D03.07 | `mission-03-07` | Execution | B | `EXECUTOR_PRESENT` | EXECUTOR_PRESENT_FIXTURE_VERIFIED | `RUNTIME_PROOF_8cf9d96_FIXTURE_EFFECTS` |
| D03.08 | `mission-03-08` | History & Undo | B | `EXECUTOR_PRESENT` | EXECUTOR_PRESENT_FIXTURE_VERIFIED | `RUNTIME_PROOF_8cf9d96_FIXTURE_EFFECTS` |
| D03.09 | `mission-03-09` | Suggestions | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_8cf9d96_DOMAIN_LEVEL` |
| D04.01 | `mission-04-01` | Google Sheets | D | `PARTIAL_OR_UNSUPPORTED` | READ_ONLY_CONNECTOR_PARTIAL | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D04.02 | `mission-04-02` | Gmail | D | `NOT_IMPLEMENTED_TRACED_ABSENT` | NOT_IMPLEMENTED | `NOT_APPLICABLE` |
| D04.03 | `mission-04-03` | Google Tasks | D | `NOT_IMPLEMENTED_TRACED_ABSENT` | NOT_IMPLEMENTED | `NOT_APPLICABLE` |
| D04.04 | `mission-04-04` | Google Forms | D | `NOT_IMPLEMENTED_TRACED_ABSENT` | NOT_IMPLEMENTED | `NOT_APPLICABLE` |
| D04.05 | `mission-04-05` | Google Contacts | D | `NOT_IMPLEMENTED_TRACED_ABSENT` | NOT_IMPLEMENTED | `NOT_APPLICABLE` |
| D04.06 | `mission-04-06` | Google Calendar | D | `NOT_IMPLEMENTED_TRACED_ABSENT` | NOT_IMPLEMENTED | `NOT_APPLICABLE` |
| D04.07 | `mission-04-07` | Google Picker | D | `NOT_IMPLEMENTED_TRACED_ABSENT` | NOT_IMPLEMENTED | `NOT_APPLICABLE` |
| D04.08 | `mission-04-08` | Google Slides | D | `NOT_IMPLEMENTED_TRACED_ABSENT` | NOT_IMPLEMENTED | `NOT_APPLICABLE` |
| D04.09 | `mission-04-09` | Google Chat | D | `NOT_IMPLEMENTED_TRACED_ABSENT` | NOT_IMPLEMENTED | `NOT_APPLICABLE` |
| D04.10 | `mission-04-10` | Google Classroom | D | `NOT_IMPLEMENTED_TRACED_ABSENT` | NOT_IMPLEMENTED | `NOT_APPLICABLE` |
| D05.01 | `app-inventory` | Installed Applications Register | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY` |
| D05.02 | `app-identity` | App Identity & Authenticode Trust | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY` |
| D05.03 | `app-search` | Multi-Parameter Software Search | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY` |
| D05.04 | `app-publisher` | Publisher Intelligence & Reputation | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY` |
| D05.05 | `app-recent` | Recently Changed Applications | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY` |
| D05.06 | `app-uninstall-queue` | Bulk Uninstall Queue & Batch Manager | C | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW_ONLY | `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY` |
| D05.07 | `app-leftovers` | Orphaned Leftover Trace Analysis | C | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY` |
| D05.08 | `app-updates` | Software Update Center | C | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY` |
| D05.09 | `app-size` | Software Storage Footprint Treemap | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY` |
| D05.10 | `app-store-packages` | Package Center & WinGet Browser | C | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY` |
| D05.11 | `app-associations` | File Extension & Protocol Matrix | C | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY` |
| D05.12 | `app-startup-impact` | Software Boot Impact Analyzer | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_e86fbf6_DOMAIN_LEVEL_READ_ONLY` |
| D06.01 | `file-downloads-inventory` | Downloads Folder Inventory | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY` |
| D06.02 | `file-organize-preview` | Visual Rule Builder & Organization Studio | B | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW | `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY` |
| D06.03 | `file-organize-apply` | Organization Staging & Change Review | B | `READ_ONLY_PLUS_HANDOFF` | HANDOFF to OperationEngine | `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY` |
| D06.04 | `file-organize-undo` | File Organization Undo Timeline | B | `READ_ONLY_PLUS_HANDOFF` | HANDOFF to OperationEngine undo | `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY` |
| D06.05 | `file-empty-folders` | Sparse Empty Folder Explorer | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY` |
| D06.06 | `file-hash` | Cryptographic Hash Inspector | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY` |
| D06.07 | `file-search` | Instant Everything-Style File Search | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY` |
| D06.08 | `file-type-map` | File Format Type Distribution | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY` |
| D06.09 | `file-recents` | Recent File Timeline Histogram | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY` |
| D06.10 | `file-largest` | Ranked Large File Explorer | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY` |
| D06.11 | `file-metadata` | Deep File Metadata & Attributes Dossier | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY` |
| D06.12 | `file-provenance` | Trust Evidence & Provenance Board | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_518ec7f_DOMAIN_LEVEL_READ_ONLY` |
| D07.01 | `storage-disks` | Volume Bays & Partition Manager | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D07.02 | `storage-large-files` | Heavy-File Storage Ledger | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D07.03 | `storage-duplicates` | Byte-Exact Duplicate Hash Groups | B | `EXECUTOR_PRESENT` | EXECUTOR_PRESENT_UNVERIFIED_AT_HEAD | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D07.04 | `storage-treemap` | Interactive Storage Space Treemap | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D07.05 | `storage-top-folders` | Folder Ranking Waterfall | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D07.06 | `storage-filetypes` | Storage Byte Distribution by Category | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D07.07 | `storage-scan-overview` | Drive Coverage & Scan Dashboard | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D07.08 | `storage-fragmentation` | Drive Optimization & TRIM Dossier | C | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW_ONLY/NOT_EXECUTABLE | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D07.09 | `storage-smart` | Disk Reliability & S.M.A.R.T. Health | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D07.10 | `storage-reclaim` | Storage Reclaim Planner & Basket | C | `PREVIEW_OR_DRAFT_ONLY` | PLAN_ONLY + Vault handoff | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D07.11 | `storage-history` | Capacity Trend Timeline | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D07.12 | `storage-removable` | Removable USB & External Volume Dock | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D08.01 | `cleanup-temp-preview` | Temporary Files Candidate Safety Ledger | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF` |
| D08.02 | `cleanup-temp-quarantine` | Quarantine Review & Safety Vault | B | `SOURCE_PRESENT_READ_ONLY` | GATED here; executes through Storage Vault | `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF` |
| D08.03 | `cleanup-temp-undo` | Cleanup Recovery Console & Journal | B | `SOURCE_PRESENT_READ_ONLY` | READ journal; restore via Vault | `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF` |
| D08.04 | `cleanup-quarantine-list` | Quarantine Vault File Inspector | B | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF` |
| D08.05 | `cleanup-estimate` | Space Savings Breakdown & Calculator | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF` |
| D08.06 | `cleanup-recycle` | Recycle Bin Multi-Volume Inspector | C | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF` |
| D08.07 | `cleanup-unused` | Dormancy & Unused Files Explorer | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF` |
| D08.08 | `cleanup-update-cache` | Windows Update & Servicing Cache Gateway | C | `SOURCE_PRESENT_READ_ONLY` | GATED | `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF` |
| D08.09 | `cleanup-browser-cache` | Web Browser Profile Cache Inspector | B | `SOURCE_PRESENT_READ_ONLY` | READ | `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF` |
| D08.10 | `cleanup-logs` | Log Retention & Dump Explorer | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF` |
| D08.11 | `cleanup-schedule` | Automated Cleanup Schedule Composer | B | `PREVIEW_OR_DRAFT_ONLY` | DRAFT_ONLY | `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF` |
| D08.12 | `cleanup-reports` | Before/After Cleanup Report Studio | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `READ_ONLY_PROOF_ef25624_PLUS_LOCAL_UI_COMMIT_11875da_NOT_EFFECT_PROOF` |
| D09.01 | `startup-overview` | Windows Boot Autorun Register | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D09.02 | `startup-disable` | Autorun State Change Preview | B | `EXECUTOR_PRESENT` | EXECUTOR_PRESENT_MOCK_VERIFIED | `MOCK_TEST_ONLY` |
| D09.03 | `startup-restore` | Startup Restoration & Rollback | B | `EXECUTOR_PRESENT` | EXECUTOR_PRESENT_MOCK_VERIFIED | `MOCK_TEST_ONLY` |
| D09.04 | `startup-sources` | Autorun Source Coverage Map | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D09.05 | `startup-journal` | Startup Change Audit Journal | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D09.06 | `startup-filter` | Keyboard-First Autorun Query Console | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D09.07 | `startup-impact` | Boot Sequence Impact Timeline | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D09.08 | `startup-services` | Service Boot Policy Matrix | C | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D09.09 | `startup-tasks` | Logon Scheduled Task Timeline | C | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D09.10 | `startup-delay` | Delayed Launch Planner | B | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D09.11 | `startup-batch` | Autorun Batch Staging Tray | B | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D09.12 | `startup-undo-all` | Batch Recovery & Mass Rollback Workspace | B | `NOT_IMPLEMENTED_TRACED_ABSENT` | NOT_IMPLEMENTED | `NOT_APPLICABLE` |
| D10.01 | `system-health-check` | System Pulse Overview Console | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.02 | `system-events` | Windows Event Log Severity Ledger | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.03 | `system-processes` | Active Process Register & Resources | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.04 | `system-signatures` | System Binary Certificate Inspector | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.05 | `system-uptime` | System Boot & Session Clock Timeline | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.06 | `system-perf` | Live Performance Pulse Charts | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.07 | `system-drivers` | Device Driver Inventory & Signatures | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.08 | `system-logs` | Event Log Channel Explorer | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.09 | `system-resources` | Top Resource Consuming Processes | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.10 | `system-autostart` | App-to-Process Cross-Service Links | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.11 | `system-services-map` | System Service Dependency Graph | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.12 | `system-timeline` | Unified System Event Timeline | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.13 | `network-interfaces` | Network Interfaces Console | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.14 | `network-dns-config` | DNS Resolver Configuration Dossier | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.15 | `network-adapters` | Network Hardware Atlas & NIC Rack | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.16 | `network-connectivity` | Connectivity Diagnostic Step Sequence | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.17 | `network-throughput` | Real-Time Traffic & Throughput Chart | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.18 | `network-traceroute` | Hop Route & Latency Visualizer | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.19 | `network-topology` | LAN Topology & Node Relationship Map | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.20 | `network-ports` | Active Socket & Port Explorer | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.21 | `network-wifi` | Wireless Wi-Fi Status & Signal Instrument | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.22 | `network-hosts` | Windows Hosts File Inspector | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY + hostsPlan PREVIEW | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.23 | `network-proxies` | Proxy & WinHTTP Configuration Graph | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.24 | `network-repair-link` | Network Recovery & Reset Gateway | C | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.25 | `hardware-inventory` | Device Hardware Atlas & Components | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.26 | `hardware-battery` | Battery Charge & Health Instrument | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.27 | `hardware-cpu` | Processor Architecture & Core Die | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.28 | `hardware-gpu` | Graphics Adapter Bay & VRAM | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.29 | `hardware-memory` | DIMM RAM Slots & Memory Layout | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.30 | `hardware-cycles` | Battery Wear & Cycle Count Ledger | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.31 | `hardware-thermal` | Thermal Sensors & Temperature Board | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.32 | `hardware-disks` | Physical Disk Drives & Bus Interface | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.33 | `hardware-usb` | USB Controller & Device Topology Tree | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.34 | `hardware-display` | Monitor Topology & Resolution Canvas | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.35 | `hardware-audio` | Audio Endpoint Mixer & Devices | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D10.36 | `hardware-health-report` | Hardware Evidence & Diagnostic Report | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D11.01 | `repair-component-check` | DISM CheckHealth Diagnostic Console | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY` |
| D11.02 | `repair-component-scan` | DISM ScanHealth 7-Stage Console | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY` |
| D11.03 | `repair-component-restore` | DISM RestoreHealth System Repair Wizard | C | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW_ONLY | `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY` |
| D11.04 | `repair-files-verify` | SFC VerifyOnly File Integrity Shield | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY` |
| D11.05 | `repair-files-repair` | SFC ScanNow Protected File Repair Wizard | C | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW_ONLY | `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY` |
| D11.06 | `repair-dns-flush` | DNS Resolver Cache Refresh Preview | C | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW_ONLY | `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY` |
| D11.07 | `repair-winsock-reset` | Winsock Catalog Disruption Risk Review | C | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW_ONLY | `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY` |
| D11.08 | `repair-tcpip-reset` | TCP/IP Stack Reset Configuration Diff | C | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW_ONLY | `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY` |
| D11.09 | `repair-history` | System Repair Audit Journal | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY` |
| D11.10 | `repair-troubleshooters` | Windows Troubleshooter Gateway | C | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY/GATED | `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY` |
| D11.11 | `repair-restore-point` | System Restore Point Inspector | C | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY` |
| D11.12 | `repair-update-reset` | Windows Update Servicing Reset Wizard | C | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW_ONLY | `RUNTIME_PROOF_ef25624_DOMAIN_LEVEL_READ_ONLY` |
| D12.01 | `services-inventory` | Windows SCM Service Register | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D12.02 | `services-control` | Service State Change Review & Guard | C | `EXECUTOR_PRESENT` | EXECUTOR_PRESENT_MOCK_VERIFIED | `MOCK_TEST_ONLY` |
| D12.03 | `services-undo` | Service Startup Policy Undo Journal | C | `EXECUTOR_PRESENT` | EXECUTOR_PRESENT_MOCK_VERIFIED | `MOCK_TEST_ONLY` |
| D12.04 | `services-dependencies` | Interactive Service Dependency Network | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D12.05 | `services-protected` | Protected Windows Core Services Atlas | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D12.06 | `services-search` | SCM Keyboard-First Query Console | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D12.07 | `services-startup-report` | Startup Policy Distribution Analytics | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D12.08 | `services-state-history` | Service Transition State History | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D12.09 | `services-dependents` | Cascade Service Dependency Impact Tree | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D12.10 | `services-diagnose` | SCM Fault Investigation & Diagnostics | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D12.11 | `services-config` | Startup Policy Configuration Diff | C | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D12.12 | `services-perf` | Shared-Process svchost.exe Monitor | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D13.01 | `auto-smart-scan` | Smart Scan Automated Workflow Flow | B | `EXECUTOR_PRESENT` | EXECUTOR_PRESENT | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D13.02 | `auto-schedule-manager` | Weekly Automation Calendar & Task Manager | B | `EXECUTOR_PRESENT` | EXECUTOR_PRESENT | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D13.03 | `auto-run-history` | Automation Run History Timeline | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D13.04 | `auto-templates` | Workflow Template Gallery & Library | A | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D13.05 | `auto-schedule-plan` | Recurrence Composer & Cron Preview | B | `PREVIEW_OR_DRAFT_ONLY` | DRAFT/PREVIEW | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D13.06 | `auto-cleanup-plan` | Safe Automated Cleanup Pipeline | C | `PREVIEW_OR_DRAFT_ONLY` | PREVIEW_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D13.07 | `auto-notify` | Notification Channel Routing Board | B | `PREVIEW_OR_DRAFT_ONLY` | DRAFT_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D13.08 | `auto-quiet-hours` | Quiet Hours 24-Hour Dial | B | `PREVIEW_OR_DRAFT_ONLY` | DRAFT_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D13.09 | `auto-battery-policy` | Power-Aware Scheduler & Battery Gating | B | `PREVIEW_OR_DRAFT_ONLY` | DRAFT_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D13.10 | `auto-retention` | Artifact Retention Policy Timeline | B | `PREVIEW_OR_DRAFT_ONLY` | DRAFT_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D13.11 | `auto-export` | Workflow Export & Schema Transfer | B | `SOURCE_PRESENT_READ_ONLY` | READ_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D13.12 | `auto-backup-plan` | Backup Flow & Verification Designer | B | `PREVIEW_OR_DRAFT_ONLY` | DRAFT_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D14.01 | `mission-14-01` | Engine & Turbo Hardware | B | `PARTIAL_OR_UNSUPPORTED` | PREFERENCES_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D14.02 | `mission-14-02` | AI Copilot & Provider Keys | D | `PARTIAL_OR_UNSUPPORTED` | SESSION_KEY_RENDERER | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D14.03 | `mission-14-03` | Google Workspace Hub | D | `PARTIAL_OR_UNSUPPORTED` | CONNECTOR_PARTIAL | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D14.04 | `mission-14-04` | Automated Protection & Guards | B | `PARTIAL_OR_UNSUPPORTED` | UNSUPPORTED | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D14.05 | `mission-14-05` | Neon Glass Customization | A | `PARTIAL_OR_UNSUPPORTED` | PREFERENCES_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D14.06 | `mission-14-06` | Language & Locale | A | `PARTIAL_OR_UNSUPPORTED` | PREFERENCES_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D14.07 | `mission-14-07` | Profile Backup & System Restore | B | `PARTIAL_OR_UNSUPPORTED` | PREFERENCES_ONLY | `NOT VERIFIED (no post-archive receipt for this domain)` |
| D14.08 | `mission-14-08` | AI Assistant Chat | D | `PARTIAL_OR_UNSUPPORTED` | UI_ONLY_NO_PROVIDER | `NOT VERIFIED (no post-archive receipt for this domain)` |

# Appendix 2 — Status vocabulary
**Implementation:** `SOURCE_PRESENT_READ_ONLY` · `READ_ONLY_PLUS_HANDOFF` · `PREVIEW_OR_DRAFT_ONLY` · `EXECUTOR_PRESENT` · `PARTIAL_OR_UNSUPPORTED` · `NOT_IMPLEMENTED_TRACED_ABSENT`.
**Proof:** `RUNTIME_PROOF_<sha>_…` (exact-SHA receipt) · `WIP_PROOF_…_UNCOMMITTED` · `MOCK_TEST_ONLY_… NOT_VERIFIED_AT_HEAD` · `NOT VERIFIED` · `NOT_APPLICABLE`. `FAILED` is used only when a recorded run failed. `COMPLETE` requires the gates of Part E plus owner-performed or VM evidence where the class demands it.

# Appendix 3 — Summary counts

| Implementation state | Services |
|---|---|
| `SOURCE_PRESENT_READ_ONLY` | 123 |
| `PREVIEW_OR_DRAFT_ONLY` | 24 |
| `NOT_IMPLEMENTED_TRACED_ABSENT` | 10 |
| `EXECUTOR_PRESENT` | 9 |
| `PARTIAL_OR_UNSUPPORTED` | 9 |
| `READ_ONLY_PLUS_HANDOFF` | 6 |
| **Total** | **181** |

Service-specific acceptance tests authored here: **559**.