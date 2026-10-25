# KNOuX 08 — CLEAN ROOM SAFETY WORKBENCH — FULL-STACK EXECUTION MISSION

**Standalone task file. Mission prepared:** 2026-10-25T08:15:31.337598+00:00. **Read-only source snapshot SHA:** c0bf2ee6066faabaf3d683f57ad3c11cb212bec2. Recheck every assumption at execution time.

**Source audit scope:** 2 code files, 19 static UI controls/handlers, 12 canonical registry services. Worlds: cleanup (12 descriptors).

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


## MISSION OBJECTIVE

تنظيف آمن قابل للمراجعة والاسترداد، مع قائمة مرشحين مثبتة ومقاييس reclaimed bytes حقيقية.


## SPECIFIC DATA CONTRACTS & PROVENANCE

CleanupCandidate {fileId,path,owner,source,reason,risk,size,openHandle}, SafetyDecision, QuarantineEntry, ReclaimEstimate, CleanupSession, CleanupJournal, RecoveryPlan.

Required actual data interface should expose typed pagination/streaming where warranted, durable identity, permissions, provenance, error codes, capability detection and safe caching. Do not invent numbers.

## BACKEND REUSE, WINDOWS AND PROVIDER IMPLEMENTATION

Audited Windows cache/file discovery with system-protected exclusions؛ quarantine staging in same volume when possible، atomic metadata journal، remeasure bytes after verified actions؛ browser caches must check process ownership.

**Existing native candidates to inspect first:** electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs

## CINEMATIC UI, WORKFLOWS & DOMAIN INTERACTION

Clean Room hero، coverage gauge، category distribution، candidate ledger with safety badges، inspector checklist، 8-step review flow، services grid and bottom review.

At all responsive desktop viewports preserve approved imagery, content hierarchy, dedicated domain inspector and visible bottom actions. Do not replace premium visual depth with simplistic wireframe widgets.

## SAFETY, PERMISSIONS & REAL EXECUTION

Never clean profile documents, Windows servicing stores, active browser sessions or shared app folders without explicit eligibility; downloads default not safe; support safe cancel+partial rollback.

Separate read-only discovery, preview-only simulation, authorized operation and verified postcondition. Do not expose raw Windows commands in the renderer.

## OBSERVED VISUAL/CODE GAP TO FIX

Preserve risk hierarchy and ensure footer is visible; no fake deletion success.

The statement above comes from the provided screenshots or inspected source and is a target for verification, not an assertion that a patch has already passed.

## CODE FILES TO INSPECT FIRST (REUSE, DO NOT WIPE)

- `src/pages/CleanupPage.tsx` — 802 lines; 4 state hooks; imported fixture signals: INITIAL_CLEANUP_METRICS
- `src/lib/cleanup-inventory.ts` — 362 lines; 0 state hooks; imported fixture signals: INITIAL_CLEANUP_METRICS

Also inspect src/App.tsx, src/context/NavigationContext.tsx and shared shell for integration; inspect existing tests and the actual root Electron/native contract code.

## SCREEN-SPECIFIC ACCEPTANCE

sandbox clean+undo leaves source unchanged on preview; permission denied and locked-files honest; measured recovered space.

Verify each user interaction in a real rendered app, and for native operations in a correct Electron environment. Do not claim native completion from localhost Vite UI.

## CANONICAL SERVICE-BY-SERVICE IMPLEMENTATION (NO SERVICE MAY BE SKIPPED)

### 01. Temporary Files Candidate Safety Ledger — `cleanup-temp-preview`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world cleanup, descriptor family Candidate Safety Ledger; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Multi-color cleanup category bar, file rows and right safety inspector. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select cleanup categories, Filter risk classification, Toggle safe defaults, Stage cleanup proposal. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Estimated vs verified recovered bytes, Risk rating per category, Safety exclusion rules, Staged cleanup review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger. First examine and REUSE electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 02. Quarantine Review & Safety Vault — `cleanup-temp-quarantine`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world cleanup, descriptor family Staging + Impact Review; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Before/after file move flow, quarantine destination and conflict checklist. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Stage entries for quarantine, Modify exclusions, Review prerequisites, Acknowledge safety notice. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Quarantine target folder, Retention policy (14 days), Restoration capability, Staged review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger. First examine and REUSE electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 03. Cleanup Recovery Console & Journal — `cleanup-temp-undo`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world cleanup, descriptor family Repair Journal; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Quarantine journal timeline and original/recovery path comparison. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Choose journal entry, Select items to restore, Examine path collisions, Stage restoration draft. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Journal transaction ID, Original path location, File state integrity check, Restoration review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger. First examine and REUSE electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 04. Quarantine Vault File Inspector — `cleanup-quarantine-list`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world cleanup, descriptor family Ledger+Dossier; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Archive-style rows grouped by journal with retention/restore badges. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Search quarantine files, Sort by date/size, Inspect item metadata, Select items for purge/restore. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Quarantine timestamp, Original location path, Days until auto-purge, Safety restoration rating. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger. First examine and REUSE electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 05. Space Savings Breakdown & Calculator — `cleanup-estimate`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world cleanup, descriptor family Candidate Safety Ledger; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Stacked eligible/uncertain/locked/excluded bar and evidence legend. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select included categories, Recalculate UI draft, Open candidate detail, Adjust threshold. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Eligible space (100% safe), Uncertain space (Needs review), Locked system space, Excluded user space. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger. First examine and REUSE electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 06. Recycle Bin Multi-Volume Inspector — `cleanup-recycle`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world cleanup, descriptor family File Ledger+Preview; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Per-volume recycle baskets, deleted-time ledger, original-location dossier. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select volume basket, Filter file type, Search deleted items, Stage Bin Empty review. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Original path before delete, Deletion timestamp, File size & preview, Empty Bin confirmation stage. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger. First examine and REUSE electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 07. Dormancy & Unused Files Explorer — `cleanup-unused`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world cleanup, descriptor family Candidate Safety Ledger; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Age-band heatmap and caveat indicators per file/folder. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Adjust age threshold (30d/90d/180d), Include/exclude candidates, Filter file location, Stage archive plan. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Last accessed vs modified date, Safety caveat notice, Candidate folder path, Staged archive plan. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger. First examine and REUSE electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 08. Windows Update & Servicing Cache Gateway — `cleanup-update-cache`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world cleanup, descriptor family Safe Diagnostics Console; risk class administrative; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Servicing stages, disk contribution and supported-OS handoff card. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select servicing step, View prerequisites, Check WinSxS status, Review DISM handoff. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** WinSxS store size, SoftwareDistribution cache size, Windows Update cleanup safety, OS Settings handoff review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger. First examine and REUSE electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Must require validated admin capability, explicit high-risk confirmation and protected-resource denies. No bypass, no silent elevation.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 09. Web Browser Profile Cache Inspector — `cleanup-browser-cache`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world cleanup, descriptor family Candidate Safety Ledger; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Browser icon cards with profile and cache sub-categories. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Choose browser/profile (Edge/Chrome/Firefox), Select cache items, Read safety warnings, Draft cache clear. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Cache size vs cookie protection, Saved passwords safe badge, Active browser session warning, Staged cleanup review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger. First examine and REUSE electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 10. Log Retention & Dump Explorer — `cleanup-logs`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world cleanup, descriptor family Ledger+Dossier; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Log-source timeline with file size and retention-policy editor. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Filter log source, Select time range, Draft retention policy, Stage dump purge. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Crash dump (.dmp) files list, Windows Error Reporting size, System event log protection, Staged purge review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger. First examine and REUSE electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 11. Automated Cleanup Schedule Composer — `cleanup-schedule`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world cleanup, descriptor family Schedule Node Flow; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Calendar timeline, upcoming read-only scan dots, pause controls. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Schedule draft with time/day, Notification preferences, Select target categories, Pause schedule. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Next scheduled execution, Quiet hours protection, Safety threshold gates, Draft policy review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger. First examine and REUSE electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 12. Before/After Cleanup Report Studio — `cleanup-reports`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world cleanup, descriptor family Repair Journal; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Two-column evidence snapshots, counters and report-page preview. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Toggle redaction, Select report format (PDF/JSON), Inspect audit trail, Export preview report. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Initial vs final storage footprint, Reclaimed GB proof, Quarantined items manifest, Audit trail verification. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger. First examine and REUSE electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.



## FULL UI ACTION / CONTROL AUDIT — EXACT SOURCE LOCATIONS

This is a static source index, NOT certified total runtime coverage. For EACH item listed below, read the JSX at the line, trace its click/change handler, state updates, relevant descriptor/engine, and record whether it is Working / Mock-only / No-op / Broken / Blocked / Implemented Verified. Inspect custom child components, dynamically generated controls, menu items and keyboard shortcuts as well.

Use a per-control verification table in your final handoff. Do not mark a button PASS because it has onClick or because it opens a modal; it must drive the correct native/preview action and display a genuine result.

- `pages/CleanupPage.tsx:244` | button | onClick | [inspect source]
- `pages/CleanupPage.tsx:256` | button | onClick | [inspect source]
- `pages/CleanupPage.tsx:268` | button | onClick | [inspect source]
- `pages/CleanupPage.tsx:280` | button | onClick | [inspect source]
- `pages/CleanupPage.tsx:292` | button | onClick | [inspect source]
- `pages/CleanupPage.tsx:304` | button | onClick | [inspect source]
- `pages/CleanupPage.tsx:316` | button | onClick | [inspect source]
- `pages/CleanupPage.tsx:360` | input | onChange | Name / Path
- `pages/CleanupPage.tsx:382` | OTHER_INTERACTIVE | onClick | <tr                             key={cand.id}                             
- `pages/CleanupPage.tsx:389` | OTHER_INTERACTIVE | onClick | <td className="px-3 py-3" 
- `pages/CleanupPage.tsx:390` | input | onChange | [inspect source]
- `pages/CleanupPage.tsx:424` | button | onClick | [inspect source]
- `pages/CleanupPage.tsx:434` | button | title | Options
- `pages/CleanupPage.tsx:465` | OTHER_INTERACTIVE | onClick | <div                       key={srv.id}                       
- `pages/CleanupPage.tsx:661` | button | NO_DIRECT_EVENT_IN_OPENING_TAG | ▶ Execute Cleanup (Preview Only)
- `pages/CleanupPage.tsx:690` | button | onClick | [inspect source]
- `pages/CleanupPage.tsx:698` | button | onClick | [inspect source]
- `pages/CleanupPage.tsx:706` | button | onClick | [inspect source]
- `pages/CleanupPage.tsx:714` | button | onClick | [inspect source]

## EXECUTION CHECKLIST — SECTION SIGN-OFF

[ ] Correct branch/head, no concurrent editor collision, unchanged unique work inventory
[ ] Explicit inventory of current services/controls from source and rendered UI
[ ] Actual native sources/providers reused before new engines
[ ] Typed requests/results, runtime validation, versioned capability exposure
[ ] All declared services have unique specialized UI and working user flows
[ ] Every existing button, filter, action, context menu and form accounted for
[ ] Real measurable data; fixture preview separately labeled
[ ] All elevated/destructive actions previewed and explicitly authorized
[ ] Cancel/timeouts/retry/idempotency/journal/verification, honest rollback limits
[ ] Arabic RTL, dark/light, keyboard, 1366/1672/1920 screenshots compared to reference
[ ] Deterministic unit, contract, integration, and safe native smoke tests
[ ] Typecheck/lint/build and available Windows packaged/runtime checks green
[ ] No new regressions in Home, Studio, Files, Applications or other integrated screens
[ ] New SHA, remote SHA, exact paths, test outputs and screenshots shown
[ ] Unverified/blocked service states enumerated: no fake DONE or 100%

Do not skip work and do not waste the mission rewriting already functioning code. Deliver and PUSH only coherent verified work. Never merge into main without user approval.


## SOURCE-AVAILABLE APPROVED VISUAL REFERENCE

D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\references\REF-05_Cleanup_Clean_Room.png

The file above EXISTS on this PC and is the approved visual baseline for this section. Inspect it directly at native resolution. Compare actual rendered window region-by-region, maintain the same composition and branded assets, and show actual before/after evidence at the acceptance viewports. Do not claim visual parity without screenshots.


## ADDITIONAL SHARED RENDERER & RUNTIME BUTTON ACCEPTANCE GATE

Some service buttons are generated inside shared renderer families and are NOT counted in the page's own static control audit. You MUST inspect and test their true interaction paths, plus the section-specific wrapper.

- src/components/common/ServiceWorkspaceHost.tsx (check direct handlers and generated controls)
  - line 137 : <button
  - line 138 : onClick={onClose}
  - line 178 : <button
  - line 179 : onClick={onClose}
  - line 216 : <button
  - line 217 : onClick={() => triggerDraftNotice('Draft configuration reset to baseline.')}
  - line 224 : <button
  - line 225 : onClick={() => triggerDraftNotice('Exported preview report summary as JSON draft.')}
  - line 232 : <button
  - line 233 : onClick={() => triggerDraftNotice('Draft proposal plan validated. Real execution requires Phase Two.
  - line 240 : <button
- src/components/renderers/FamilyRenderersOne.tsx (check direct handlers and generated controls)
  - line 81 : onChange={(e) => setSearchTerm(e.target.value)}
  - line 90 : onChange={(e) => setCategoryFilter(e.target.value)}
  - line 105 : onClick={() => setSelectedIdx(idx)}
  - line 199 : onChange={(e) => setQuery(e.target.value)}
  - line 205 : <button
  - line 206 : onClick={() => setFuzzyMode(!fuzzyMode)}
  - line 275 : <button
  - line 276 : onClick={() => setActiveTab('cert')}
  - line 285 : <button
  - line 286 : onClick={() => setActiveTab('attributes')}
  - line 295 : <button
  - line 296 : onClick={() => setActiveTab('provenance')}
  - line 394 : <button className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-poi
  - line 521 : onChange={(e) => setConfirmedRisk(e.target.checked)}
  - line 562 : onClick={() => setSelectedIdx(i)}
- src/components/renderers/FamilyRenderersTwo.tsx (check direct handlers and generated controls)
  - line 60 : onClick={() => setSelectedBay(vol.letter)}
- src/components/renderers/FamilyRenderersThree.tsx (check direct handlers and generated controls)
  - line 69 : onClick={() => setSelectedNode('DCOM Server Process Launcher')}
  - line 83 : onClick={() => setSelectedNode('RPC Endpoint Mapper')}
  - line 97 : onClick={() => setSelectedNode('Windows Management Instrumentation')}
  - line 152 : <button
  - line 153 : onClick={handleCopy}
- src/lib/service-ui-renderers.ts (check direct handlers and generated controls)
- src/components/cleanup/CleanupWorkspaces.tsx

Trace runtime service dispatch from the selected tile to ServiceWorkspaceHost to the appropriate renderer family. For EACH generated control: trace actual current selection, config props, state updates, actual provider call, preview, permission gate, error and verification. A direct page control inventory alone is not complete. No all-service generic fake preview is acceptable.
