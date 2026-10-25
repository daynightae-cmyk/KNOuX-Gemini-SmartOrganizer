# NON-NEGOTIABLE EXECUTION MISSION

You are a senior full-stack Windows desktop product engineer, native integration architect, security reviewer, and visual designer. IMPLEMENT the current section end-to-end in the EXISTING KNOuX Gemini application; no planning-only output.

THIS IS A FUTURE PER-SECTION IMPLEMENTATION MISSION. Your first action when this file is handed to you is to INSPECT THE CURRENT REAL BRANCH/HEAD, ACTIVE AGENTS AND CODE; the snapshot attached to these missions was gathered on 2026-10-25 and may be stale.

Worktree (actual): D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer
Gemini application UI: apps/gemini-ui/
Existing Windows/Electron code exists at repository root under electron/ and shared/. Do not assume it is connected to the Gemini renderer; verify which imports, build entrypoint, preload exposure and contracts are really wired.

Do NOT modify K:\Knoux Projects\KNOuX SmartOrganizer\Base or Studio-Closure or main. Do NOT create a new clone/worktree per section. Do NOT overwrite other agents' dirty files. Do NOT reset, clean, rebase, force-push, delete, discard unique work, or create bulky backup copies.

Trust level: visual screenshot and code sample only verify appearance. All imported Gemini fixture numbers, fabricated test data, simulated callbacks, mock connected badges and design-preview results are NOT native evidence. Distinguish REAL, FIXTURE, NOT CONNECTED, NO PERMISSION, PARTIAL and FAILED in both UI and reports.

IMPLEMENTATION PLAN IS NOT THE DELIVERABLE. Deliver real source changes, tests, and verified runtime screenshots on a feature branch, not an isolated replacement app. Preserve the approved dark navy/cyan/violet branded visual identity, image assets, typography, existing component behavior and navigation.

# FOUNDATION REUSE AND NATIVE ARCHITECTURE

1. Inventory existing root Electron main/preload/services/IPC/shared contracts and existing Gemini imports. Write a matrix: Existing+Connected / Existing+Unconnected / Missing / Unsupported / Unsafe.
2. REUSE already verified Windows native operations and Studio backend before implementing any parallel engine. Connect with precise typed versioned IPC allowlists, request validation, result validation, origin checks, main-process authorization and Electron contextIsolation/sandbox. No direct Node/fs/child_process from React renderer. No arbitrary command strings or generic execute(channel,args) endpoint. Do not weaken security to make a UI button work.
3. For privileged tasks, provide per-tool fixed capability IDs/arguments and separate explicit elevation gate, user consent, scope review, bounded execution, interruption/cancel, event stream, receipt, verified postcondition, journal and rollback only where technically possible.
4. All data-producing providers return {status, source, timestamp, coverage, permissions, warnings, data} in an appropriate typed contract; distinguish cached/partial/synthetic vs measured. No green status until the provider verifies the operation.
5. Keep deterministic design fixtures isolated, switchable only in Development/Preview with conspicuous labels. Production build must never silently substitute fixtures for failed native readings.
6. Ensure long operations are cancellable, limit concurrency and memory, stream pages/events, handle offline/locked/network drives and app closure. Use supported Windows APIs where available; do not rely on PowerShell UI or pop-up consoles. If a constrained executable must be spawned, spawn shell:false, explicit binary+fixed argument list, hidden window, no untrusted input interpolation.
7. All write/mutation workflows: inspect scope -> gather real evidence -> design-specific preview -> compute risks/conflicts -> stage immutable plan -> obtain explicit approval -> execute bounded -> verify postconditions -> persist journal -> show real result and recoverability. Reject symlinks/junction escape, protected Windows locations/services, stale plans and missing elevation.
8. Authenticated cloud operations use least-privilege scopes, credential storage outside renderer, reliable expiry/refresh/revocation handling, quotas/retries and consent. No credentials/PII in logs, screenshots, reports or Git. No fake OAuth connected banners.
9. Preserve existing live preview at 127.0.0.1:3000; do not start duplicate Vite processes. For real native tests, run properly packaged/dev Electron environment separately and label its output; web preview cannot prove native IPC.

# VISUAL AND INTERACTION ACCEPTANCE

At 1366x768, 1672x941 and 1920x1080 (browser zoom 100%), make workspace fit the desktop shell: no document-level page scroll, no horizontally clipped page, no controls blocked by assistant/floating panels, no inaccessible footer. Use minmax grids, flex, min-height:0, virtualized long lists and focused inner scrollers. Do not hide a whole service below the fold or shrink fonts to microscopic scale. Interactive elements require meaningful keyboard/RTL/light/dark states, tooltips, selection and error states.

Every existing button/control/event in the source audit is an acceptance item: document initial handler, intended action, data origin, UI preview, permissions, real implementation, error handling and test. Also review controls instantiated dynamically or via spread props—static extraction is not a complete runtime audit. No no-op button or fake toast claiming success.

Visual excellence means contextual data visualization and specialized domain inspector for each service—not a generic modal reused 132 times. Use real iconography, coherent status palette, micro-motion that respects reduced-motion preferences, drill-down, meaningful skeletons, accessible legends and trustworthy progress.

# RELEASE GATES

At every section boundary: check HEAD/branch/status, targeted unit+integration tests, package lint/typecheck/build, Playwright or equivalent interaction screenshots at 3 viewports, real Windows provider tests using safe nonproduction fixtures, fresh-start/restart state persistence, and regression smoke against already merged sections. If native tests require unsafe privileges, DO NOT perform them silently: leave explicit BLOCKED gate with proof of read-only state.

Commit coherent verified work; push to the existing Gemini feature branch when allowed after verifying no concurrent agents are editing the same files. DO NOT merge to main. Report starting/ending SHA, local vs origin SHA, exact changed paths, test command outputs, screenshots, safety decisions, list of untouched unique work, and honestly mark every unsupported requirement.

A screenshot is not native functionality proof; green CI is not visual parity proof; a mock dataset is not measured device data. No fake closure.


# KNOuX 00 — ONE-TIME SECURE WINDOWS PLATFORM GATE

THIS IS THE FIRST TASK TO SEND BEFORE SECTION FULL-STACK MISSIONS, unless you can prove the new Gemini renderer already uses the EXISTING root Electron runtime. Execute, do not just propose.

Source locations:
- Current Gemini renderer apps/gemini-ui/src/
- Root application main.cjs, preload.cjs, windows-providers.cjs, privileged-runner.cjs, automation.cjs, tool-registry.cjs, settings.cjs
- Root studio modules in electron/studio/ and shared/contracts.ts
- Root build scripts/package.json and Gemini nested package.json.

Objective: create a SAFE INTEGRATION PLAN + IMPLEMENT THE MINIMAL SHARED PLATFORM that allows the current Gemini visual app to run as a protected Electron desktop client, REUSING root native providers instead of discarding them. Avoid repackaging with the root renderer by accident. Determine whether the root Electron stack currently loads Gemini UI, what preload exposes, and whether contracts can be shared versioned safely.

1. Reality: inspect Git state and worktrees. The Gemini branch can have dirty source from other agents: do not overwrite. Verify actual launcher and real packaged runtime. Preserve source and approved visuals.
2. Define versioned typed domain-specific IPC capabilities, allowed event streams and error envelopes; strict parameter/return validation, origin authorization, contextIsolation, CSP, no nodeIntegration, sandbox as supported.
3. Native provider reuse matrix with exact existing module paths/exports; avoid duplicate service engines. Implement minimal testable adapter for read-only machine/service inventory and Studio folder selection only if safely available. Defer unsafe actions to each section owner.
4. Proper Windows main/preload/bundle build and dev integration for the Gemini app, with reproducible install/build/test and no fake connected/ready badges.
5. Define shared source-of-truth types: ProviderCapability, NativeRequest, NativeResponse, OperationProgress, PermissionGate, OperationPlan, OperationJournal, SourceProvenance, Recoverability.
6. Provider result statuses: available, unavailable, unsupported, permission_denied, partial, cancelled, failed, complete. Every output includes source and observation time when appropriate. Errors are explicit and redacted.
7. Add provenance/no-mock build gate and DEV_FIXTURE flag isolated from production. Do not commit secrets; never store API tokens in localStorage.
8. Establish native tests using safe read-only flows and throwaway sandbox directories, 1366/1672/1920 visual smoke, Electron runtime smoke, packaged-app startup and CI artifacts.
9. Keep one canonical navigation/shell and read-only routes to old backend via typed adapters. Never open user-visible PowerShell/console.
10. Protect all current Gemini UI pages. No large-scale redesign, new worktrees, unnecessary backups, main merge or old K: edits.

Deliver: native bridge audit, exact file changes, verified Desktop launch evidence, command output, SHA and proof the new UI can securely call one native provider, and a COMPLETE section-by-section integration contract map.

Do not claim all 132 services are now connected after a platform smoke. Subsequent section missions own their actual service engines, UI and acceptance.
