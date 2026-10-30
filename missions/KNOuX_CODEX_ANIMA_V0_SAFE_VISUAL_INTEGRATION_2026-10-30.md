# CODEX MISSION — KNOuX VISUAL TRANSPLANT + NATIVE PRESERVATION
## Execute source-code integration, not another planning-only audit

**Owner objective:** Build the existing KNOuX SmartOrganizer Windows/Electron application with the **approved Anima-style reference layouts**, using the **working Vercel v0 React/TypeScript screens as the first UI source**, while **preserving the strongest existing local native engines, typed IPC, approved orbit work, organization/undo/vault receipts, and ALL unique branch/worktree work**. This is a source-code implementation task. Do not merely propose a roadmap.

**Decision (do not reverse without code/visual evidence):**
- **Visual authority:** owner-approved reference PNGs (DAY and NIGHT and cinematic intro). These define composition, logo, identity, orbit coordinates, typography, cards, density, Inspector, motion, and layout. No reference bitmap may replace a working UI.
- **Preferred visual implementation donor:** current **uncommitted Vercel v0 WIP** UI components, if its exact source bundle and SHA manifest are available and verified. The committed v0 branch alone is NOT the finished visual implementation.
- **Runtime/canonical base:** local Windows **`main`**, preserve actual existing native providers, renderer navigation, Electron Main/Preload/IPC, privileged boundaries, existing app state, user-authorized scope, native journaling, quarantine/restore and verified receipts. Compare features instead of copying all native files from cloud.
- **Historical source:** local Anima recovery and old visual branches (use for missing logo, assets, motion, and unique code). Do not blindly restore its old Home structure; the existing local `Home Command Center` differs from the approved `Welcome to KNOuX` scene.

## 0. Verified discovery snapshot — START HERE, REVALIDATE BEFORE WORK

On 2026-10-30 live read-only examination of authorized owner Windows host `DESKTOP-VQKU9P8` found:
- Canonical root: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`.
- Local `main` HEAD `770396bc9388b94f72a493fd41a7f4fede46be92`.
- Local cached `origin/main` `f254447...`; local branch shows **9 ahead of that CACHED ref**, which is **not** a count against current GitHub main.
- Fresh GitHub `main` as checked from the connected GitHub repository: `d1ba8765704952816384abbe305ec01c0bf62854`.
- Vercel v0 committed branch `v0/knoux-smartorganizer-integration-b432675e` HEAD `c01638ddc224054a21010205e5e91be037316365`, **6 committed commits ahead of GitHub `main`** (GitHub comparison of `main...v0`). **Its substantial UI WIP is uncommitted**, and must be provided as exact files.
- v0 cloud audit report captured **46 modified + 559 untracked paths**; byte-indexed preserved archive 5016 files, `cloud-WIP-preserved.zip` SHA256 `975097c851da2465e35e77a06e01c86984f49133f2124e7abcba7588449db338`. This is **a report of cloud preservation**, not proof those files are available in the local repository. Earlier owner-uploaded v0 recovery ZIPs are incomplete/older subsets.
- Local `main` has nontracked evidence under `docs/evidence/home-anima/`, `docs/evidence/shared-orbit/`, and `missions/SCREEN_EXECUTION_PACK_20261030/`. Treat these as potentially unique and preserve; DO NOT clean.
- Eight local worktrees total. Relative to local `main`: `integration/visual-final-closure-20261027` behind50/ahead0; `integration/visual-day-night-20261027` behind51/ahead0; `codex/live-organization-20261027` behind38/ahead0; `feat/knoux-visual-home-follow-20261027` behind52/ahead0; `feat/knoux-visual-studio-rebuild-20261027` behind43/ahead0; `feat/knoux-visual-day-night-sprint-20261027` behind54/ahead0; **`integration/knoux-unified-20261028` behind25/ahead4**. The 4 unique commits are `d12b488`, `5b50188`, `d063813`, `a46468e`; inspect them before choosing any function-level transplant. Branch ancestry says nothing about unique untracked/ignored assets.
- Seven secondary worktrees showed no *tracked* modifications with `git status --short -uno` at inspection; untracked/ignored contents not comprehensively audited. Check for concurrent Codex/Qoder/Traycer agents.
- Local Anima composition landed at `c88a0f5` (`feat(home): integrate recovered Anima orbit...`); shared typed SVG controls landed at `a780326`. Files of interest: `src/assets/anima/knoux-orbital-emblem.png`, `src/components/home/HomeOrbit.tsx`, `RecoveredHomeOrbit.tsx`, `home-orbit.css`, `recovered-home-orbit.css`, `src/visual/KnouxOrbit.tsx`, `src/visual/OrbitalControl.tsx`.
- Local rendered Electron Home day/night in `docs/evidence/shared-orbit/packaged-home/home-en-{light,dark}-1672.png` is **not the approved reference geometry**: `Home Command Center` and right-side wheel. Earlier `docs/evidence/home-anima/final-electron/{home-light,home-dark}.png` showed the historical bitmap on the right, not the full approved interactive Home. Local Studio/Automation packaged renders exist under `docs/evidence/shared-orbit/domain-development/` and have native-state truth but differ from the owner's richer approved page compositions.
- Important Git-blob finding: several local and cloud **committed** native files are byte-identical as Git objects even where working-tree SHA256 differs due to Windows line endings (`main.cjs`, `preload.cjs`, `operation-engine.cjs`, `operation-ipc.cjs`, `storage-vault.cjs`). Do not claim a code conflict from raw CRLF-vs-LF hash alone. Actual divergences exist in App/Navigation/Home/orbit/Studio and other places; compare semantic functions against current *working tree*, not committed blobs only.

**Everything above is a point-in-time baseline; repeat Git/status/ownership and source availability. Do not fetch/reset/checkout/merge into owner's dirty main without safe isolation and agreement.**

## 1. Entry gate: preservation and source availability (execute; do not get stuck writing reports)

1. Confirm canonical repository, live Git status, HEAD, remote refs, all 8 worktrees, reflog/stashes, ignored unique source, potentially active agents and any open PR/CI. Record concise evidence to an **external** audit directory. Do not modify another agent's worktree.
2. Snapshot dirty local main, evidence, untracked unique source and assets **copy-only**; capture `git bundle` or committed object preservation separately from dirty/untracked byte snapshots. SHA-256 manifest; verify every copied byte; exclude secrets/tokens/caches and describe exclusions. Do not alter `main` index, refs, historical commits or local files.
3. Snapshot/inspect the four unique `integration/knoux-unified-20261028` commits; preserve unique functions, their native safety changes, evidence/fixtures, and all untracked work from secondary worktrees before integrating anything.
4. Locate the **latest** v0 **source-only** handoff, ideally exported directly from the live 46-modified/559-untracked WIP with a SHA manifest. Prefer source/tests/assets/integration manifests; separate huge screenshots/recovery material. Extract into an **external, isolated** incoming folder, never over the repo. Verify hashes before use.
5. If only older `KNOuX-Files-Repair-Preserved-local.zip`, `KNOuX-Automation-Storage-preserved-local.zip`, `KNOuX-Home-Corrective-Preserved-local.zip` or `KNOuX-Home-Command-Center.zip` are available, label their exact dates/coverage and do NOT assume they contain the latest cloud code. **Continue implementing from verified available donor files**, but mark any missing latest-v0 functions for bounded follow-up; do not invent them.
6. Start a NEW non-destructive, isolated worktree/branch from the verified local canonical baseline, e.g. `integration/codex-v0-anima-ui-20261030`; choose an unused path/branch if already occupied. No modifications to main or active agents. Never use `reset --hard`, `git clean`, forced ref rewrites, force-push, wholesale source replacement, or blind ZIP restore.
7. Produce a *short* source ownership map: original local module → cloud UI donor → approved reference PNG → service/provider/IPC → tests → planned function-level changes. Then start editing code immediately.

If the exact v0 source bundle is not available, do NOT cherry-pick the committed c01638d and call it the final UI. This missing WIP is a **transfer gap**, not evidence v0 never implemented it.

## 2. Explicit visual-vs-native precedence — implement a reconciliation, not a wholesale takeover

- The **owner PNGs** win for look, layout, shapes, depth, wheel positions, navigation density and section-specific workbench composition.
- The **best actual React implementation** (typically v0 `Reference*Screen.tsx`/CSS, `ApprovedHomeScreen.tsx`, `KnouxOrbit.tsx`, `GraphCanvas.tsx`, `AtlasTreemap.tsx`) is eligible as a *visual donor* after import/dependency comparison. Keep the portions that meet the reference; adjust those that don't.
- The **local Windows `main` runtime** remains the Native provider and security baseline. Preserve real capability validation, idempotence, allowed roots, reparse protection, Main sender validation, frozen Preload allowlist, OS permissions, consent digests, journals, no-overwrite restore, postcondition receipts and native readiness; do not replace real engines with browser facades.
- **Do not change app behavior merely to recreate fake screenshot numbers.** DEMO must be explicitly labeled and isolated; live/unavailable/loading/permission-denied/partial have truthful states. A sample label must not destroy approved geometry; use compact unobtrusive data-source provenance.
- Native/writer actions must be explicit and safe. Verify outcomes from authoritative postconditions, not by immediately returning success. Do not start destructive Windows actions automatically to prove UX.
- Keep original app navigation/service IDs and window lifecycle. No new duplicate app shell or competing Electron runtime. Avoid gratuitous packages and giant rewrites.
- For local native ↔ cloud UI mismatches, add thin **typed adapters** and validators to the existing bridge, with bounded schemas, cancellation, error states and testable contracts. Do NOT add a generic filesystem/PowerShell IPC endpoint.

## 3. Ordered domain transplant queue, with specific responsibilities

### 3.1 HOME (first pilot, build AND verify)
- PNG authority: owner-approved DAY/NIGHT `Welcome to KNOuX` images, 1672×941; cinematic intro as a separate scene. The approved layout has **left orbit, right Welcome/KPI/actions**, six Quick Access cards beneath, lower Findings/Automation/System panels, and right System Health/Storage/AI/Activity inspector.
- Candidate UI donor: `src/components/home/ApprovedHomeScreen.tsx`, `approved-home.css`, `src/home/provider.ts`, `src/commands/CommandPalette.tsx`; shared `src/visual/KnouxOrbit.tsx` and CSS from latest v0.
- Protected local: `HomeCommandCenter.tsx`, `HomeOrbit.tsx`, `RecoveredHomeOrbit.tsx`, Anima emblem asset, typed native-ready `KnouxOrbit.tsx`, `OrbitalControl.tsx`, `App.tsx`, `NavigationContext.tsx`, actual Home data collectors and routes.
- Replace only the active visual composition after verifying the new one. Keep the old Home code recoverable through the isolated branch until approved. Build an SVG/CSS animated glass orbit (fixed six functional satellites, independent motion of stars/particles/ellipses; reduced-motion; no spinning labels); no flat bitmap. Day/Night share exact geometry.
- Bind KPI to real data source states and working shortcuts, search, navigation, button actions; no claimed OS status from demo. Render and screenshot **packaged Electron** app at 1672×941, 1366×768 and 1920×1080, DAY/NIGHT. Confirm wheel/text/cards do not collide.

### 3.2 ORGANIZATION STUDIO
- PNG: `Organization Studio` approved design, tabs, category cards, file inventory, suggestions, right 5-step plan.
- v0 donors: `src/operations/OrganizationProvider.ts`, `src/studio/StudioPage.tsx`, `src/operations/OrganizationLiveWorkbench.tsx`, Studio-specific reference CSS, existing tabs and previews.
- Local protection: local Studio inspection, 9-stage workflow, file selected context, native plan/execute/undo and vault. Preserve real authorized-root discovery, preview target IDs and exact plan digest. The **rule preview must match the eventual native plan**, otherwise block apply and show explicit unsupported-rule state.
- Keep selected-files navigation/visual library, tree/list switch and category-aware inspector. NO direct move/delete without native confirmation and verified immutable receipt.

### 3.3 STORAGE ATLAS + CLEANUP
- PNG: volume dashboard, proportional treemap, drive selection, largest folders, recoverable candidates; Cleanup's safe review.
- v0 donors: `src/storage/StorageAtlasScreen.tsx`, `AtlasTreemap.tsx`, `atlas-provider.ts`, `src/cleanup/ReferenceCleanupScreen.tsx`, CSS.
- Local protection: `storage-bridge.cjs`, `storage-vault.cjs`, original Storage/Cleanup workbenches and journals/undo.
- Distinguish actual bytes from estimates and inaccessible/partial scan. Use validated canonical volume identity, not string-prefix path matching. Same-volume quarantine ≠ reclaimed physical bytes. Every reclaim step requires keeper policy, explicit approval, verified plan/digest, undo or explicit no-undo disclosure, exact native receipt.

### 3.4 AUTOMATION
- PNG: `Automation Studio` with editable DAG/Workflow Designer, graph ports, inspector, schedule and safety.
- v0 donors: `src/automation/GraphCanvas.tsx`, `graph-core.ts`, `graph-provider.ts`, `ReferenceAutomationScreen.tsx`, CSS.
- Local protection: existing `knouxAutomationV1` preload/native drafts/dry-run, schedules/read policies and any stronger local executor discovered; check schema versions before migrations.
- Make graph drag-connect/keyboard/undo/redo/DST/dry-run real and tested. Do not advertise Scheduler, Run or Pause without a native executor and verified receipts; if a stronger local implementation exists, integrate it, never hide it behind a preview-only wrapper. Use consent and typed action allowlists.

### 3.5 FILES + SMART SCAN
- PNG: Files results table, left search/filters, right selected-file preview, metadata, right-side orbit as specified; Smart Scan evidence/review flow.
- v0 donors: `src/files/ReferenceFilesScreen.tsx`, `reference-provider.ts`, `useReferenceFiles.ts`, `src/scan/ReferenceScanScreen.tsx`.
- Local protection: authorized indexer, grants, identity/freshness, incremental query, metadata/hash, native-only open/reveal, original move through Organization and native receipts. Preserve Everything-like speed when index exists, cursor pagination, cancellation and inaccessible results.
- Do not implement pretend Rename/Delete; only real consent-bound native paths if existing safe executor supports them; no self-service file writes from browser.

### 3.6 APPLICATIONS + STARTUP
- PNG: premium Application Manager/Startup Control, signed publisher/installed apps/impact tiers/tables/inspector.
- v0 donors: `src/apps/ReferenceApplicationsScreen.tsx`, `src/startup/ReferenceStartupScreen.tsx`, providers/CSS.
- Local protection: app inventory and actual Authenticode evidence, startup registry/tasks/services collectors, real approvals and plans. Read-only update discovery must not claim an update installed; do not infer trust from publisher string. Startup win32 basename parsing fix can be compared and ported only if local equivalent absent.

### 3.7 SYSTEM + SERVICES + REPAIR
- PNG: System performance, graphs/unit/source; Services dependency inspector/table/actions; Repair diagnostics/playbook.
- v0 donors: `src/system/ReferenceSystemScreen.tsx`, `src/services/ReferenceServicesScreen.tsx`, `src/repair/ReferenceRepairScreen.tsx`.
- Local protection: native sampling/SCM enumeration, service protections, repair intent allowlist, journals and any strong local executors. Units, provenance, timestamps, capabilities, permissions, and missing sensors must be truthful; unsupported actions must not display success. No SFC/DISM/CHKDSK/dangerous registry/SCM mutation against the owner machine for UI validation; test disposable/safe fixtures and review permissions.

### 3.8 GOOGLE WORKSPACE + SETTINGS/AI + CINEMATIC INTRO
- PNG: Google Drive/Sheets account/permissions, Settings appearance/AI provider, original large glass-sphere cinematic Splash.
- v0 donors: `src/workspace/ReferenceWorkspaceScreen.tsx`, `src/settings/SettingsReferenceDashboard.tsx`, `src/features/cinematic-entry/CinematicEntry.tsx`, portal CSS.
- Local protection: original OAuth scopes and safeStorage vault, actual authorized Sheets, selected account context, persisted theme, permission gates and native readiness. Never copy tokens/credential files. Dark/Light/System must really persist and follow OS when selected. Cinematic scene overlays real Home and transitions smoothly, responsive/reduced-motion/sound authorization; never fake native-ready status.

For every domain: compare first; transplant best useful **functions, UI components and assets**; route to existing service; preserve original implementation until validated; do not copy entire source folders. Section-specific wheel icons, labels, behavior, and connected routes must match owner PNGs. Explicitly maintain accessibility, keyboard, RTL/LTR and Windows DPI.

## 4. Actual code strategy and collision policy

Work in a **single isolated integration worktree**, not 15 separate apps. Reuse one AppShell/Theme/Localization/Orbit/navigation layer with per-domain composition data and providers. Avoid duplicating global header or Sidebars.

At each file/hunk classify `IDENTICAL`, `LOCAL_STRONGER`, `V0_UI_DONOR`, `ANIMA_ASSET_ONLY`, `ADDITIVE`, `SEMANTIC_CONFLICT`, `MISSING_DONOR`. On conflicts, preserve both original bytes, compare exports, hooks and contracts, write a small explicit adapter rather than wholesale replacing core files. Do not choose precedence solely on latest timestamp or cleaner Git history.

Potential collisions to audit before modification:
`apps/gemini-ui/src/App.tsx`, `src/context/NavigationContext.tsx`, `src/components/home/*`, `src/visual/KnouxOrbit.tsx`, `src/visual/OrbitalControl.tsx`, shared orbit CSS, `src/studio/StudioPage.tsx`, `src/operations/OrganizationLiveWorkbench.tsx`, Electron `main.cjs`, `preload.cjs`, `shared/native-contract*`, `shared/operation-contract.ts`, `shared/storage-vault-contract.ts`, native `operation-engine.cjs`, `operation-ipc.cjs`, `storage-vault.cjs`, `automation-bridge.cjs`, `startup-bridge.cjs`, package/lock and settings.

Treat the owner-approved Anima emblem as an asset, but no embedded screenshot or logo screenshot as a fake navigation surface. Keep official branding and interactive vector controls. If an asset is only screenshot-resolution and cannot cleanly scale, reconstruct with valid code/vector layers while retaining source for evidence.

## 5. Mandatory tests and delivery evidence — AFTER ACTUAL CHANGES

- Git snapshots before/after, exact path/branch/HEAD, working-tree untracked/modified list and worktree isolation checks; no silent branch moves.
- Typecheck, lint, unit/component tests, build, and browser UI interactions for every changed section; record commands, exit codes, raw logs and exact tested SHA. Do not say PASS after merely changing source.
- Real packaged Electron Windows integration for Main→Preload→Renderer on disposable fixtures: allowed channels and denied invalid sender/payloads; genuine per-domain provider capabilities, permission/source consistency, cancellation, read-only modes, plan/confirm/receipt/restore tests. Do not mutate owner files/services to prove UI.
- DAY/NIGHT app-only screenshots at 1672×941, 1366×768, 1920×1080; compare to owner reference PNG with aligned viewport/data-mode/font/scale and overlay/landmarks (not just pixel-MAE). Include two animation frames and an interaction trace for each orbit. RTL/EN, keyboard, reduced-motion and browser-vs-packaged differences.
- Preserve visual and service state during route/theme switching and verify 15 sections share shell but keep unique panels. The screenshot is a design target, not a telemetry oracle.
- Unverified capabilities must remain visibly honest: `NATIVE_UNAVAILABLE`, `DEMO`, `PARTIAL`, `DISABLED`, `UNVERIFIED`, etc. No invented numbers, successful Windows actions, or silent use of a mock.
- Deliver actual source diffs, per-domain integration manifests, donor/source provenance, provider compatibility matrix, screenshots and raw test logs in a **byte-verified, secret-screened handoff archive**, plus exact test-verified commit(s) on the isolated branch. Do not push, PR, merge, publish or deploy without separate owner approval.

## 6. Anti-stall: start the implementation now

The owner has already chosen the approved design and the high-level architecture. Do NOT ask them to choose between entire Anima or v0 repositories. Do NOT spend the session repeating plans, polishing audits, adding only `TODO` files or writing type-only stubs. Execute the first bounded pilot (Home) after safety and source checkpoints, then continue sequentially through the screens with actual code/tests. If a specific missing handoff blocks the best donor, use the verified available donor without falsely claiming it is latest, record the exact gap and continue work unaffected by that gap. If a native effect would touch the owner's real Windows files/services, keep it disabled and test with disposable fixtures rather than asking for destructive permission as a prerequisite to UI work.

**Success means:** Owner-approved compositions in actual source-controlled React/Electron screens, shared premium orbital identity, working navigations and UI interactions, truthful live Native integrations, non-destructive snapshots of all original local/cloud/agent work, reproducible test receipts and no regression to Anima assets or Windows service capabilities.

**Begin execution: preflight → preservation → verify V0 donor availability → isolated branch/worktree → HOME visual/native pilot → actual screenshots/tests → remaining domains → verified handoff. No fake closure.**
