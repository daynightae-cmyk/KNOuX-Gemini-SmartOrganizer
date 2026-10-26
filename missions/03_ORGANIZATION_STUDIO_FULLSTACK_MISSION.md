# KNOuX 03 — SMART ORGANIZATION STUDIO — FULL-STACK EXECUTION MISSION

**Standalone task file. Mission prepared:** 2026-10-25T08:15:31.259772+00:00. **Read-only source snapshot SHA:** c0bf2ee6066faabaf3d683f57ad3c11cb212bec2. Recheck every assumption at execution time.

**Source audit scope:** 15 code files, 85 static UI controls/handlers, 0 canonical registry services. Worlds: No 132-service world assigned directly. This section has its own custom subfeatures; see the operations list..

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

الخدمة الأساسية للمنتج: اختر فولدر، امنحه صلاحية، افهرسه محليًا، اعرض المكتبة المصنفة، صمم قواعد، راجع خطة دقيقة، طبق بإذن، وارجع بالـUndo الموثق.


## SPECIFIC DATA CONTRACTS & PROVENANCE

AuthorizedRoot, InventoryEntry, FileIdentity, ClassificationRule, Category, Collection, PlannedOp, Conflict, OrganizationPlan, ExecutionJournal, ReversalRecord; حفظ scope وpath identity وmtime/size/hash حين يلزم.

Required actual data interface should expose typed pagination/streaming where warranted, durable identity, permissions, provenance, error codes, capability detection and safe caching. Do not invent numbers.

## BACKEND REUSE, WINDOWS AND PROVIDER IMPLEMENTATION

REUSE electron/studio/folder-inventory.cjs وstudio-organization.cjs وstudio-safety.cjs وregister-studio-ipc.cjs وthumbnails؛ وصل UI contracts الحالية بعد تحقق؛ stream incremental enumeration، transactional journal، protected root checks، skip symlink/junction escape.

**Existing native candidates to inspect first:** electron/main.cjs, electron/preload.cjs, shared/contracts.ts plus domain-specific existing modules.

## CINEMATIC UI, WORKFLOWS & DOMAIN INTERACTION

9-stage studio layout أفقي؛ category grid 18 فئة، gallery مع thumbnails حقيقية، source cards، rule builder visual، dest explorer، diff-before/after، conflict matrix، progress execution stages، History&Undo receipt.

At all responsive desktop viewports preserve approved imagery, content hierarchy, dedicated domain inspector and visible bottom actions. Do not replace premium visual depth with simplistic wireframe widgets.

## SAFETY, PERMISSIONS & REAL EXECUTION

Root permission explicit, recursive dry run، never delete originals before verified copy/move، atomic move when possible، collision policy explicit، per-op rollback and idempotency.

Separate read-only discovery, preview-only simulation, authorized operation and verified postcondition. Do not expose raw Windows commands in the renderer.

## OBSERVED VISUAL/CODE GAP TO FIX

Studio creates its own titlebar/sidebar in source; investigate duplicate shell with the Gemini global shell before any redesign.

The statement above comes from the provided screenshots or inspected source and is a target for verification, not an assertion that a patch has already passed.

## CODE FILES TO INSPECT FIRST (REUSE, DO NOT WIPE)

- `src/studio/StudioPage.tsx` — 130 lines; 1 state hooks; imported fixture signals: none detected
- `src/studio/context.tsx` — 364 lines; 19 state hooks; imported fixture signals: INITIAL_AUTHORIZED_FOLDERS, INITIAL_COLLECTIONS, INITIAL_CONFLICTS, INITIAL_HISTORY_JOURNAL, INITIAL_INVENTORY
- `src/studio/modals.tsx` — 303 lines; 2 state hooks; imported fixture signals: none detected
- `src/studio/panels.tsx` — 704 lines; 1 state hooks; imported fixture signals: none detected
- `src/studio/parts.tsx` — 442 lines; 0 state hooks; imported fixture signals: none detected
- `src/studio/types.ts` — 164 lines; 0 state hooks; imported fixture signals: none detected
- `src/studio/workspaces/CollectionComposer.tsx` — 163 lines; 3 state hooks; imported fixture signals: none detected
- `src/studio/workspaces/DestinationInspector.tsx` — 216 lines; 1 state hooks; imported fixture signals: none detected
- `src/studio/workspaces/ExecutionMonitor.tsx` — 133 lines; 4 state hooks; imported fixture signals: none detected
- `src/studio/workspaces/HistoryUndoInspector.tsx` — 136 lines; 1 state hooks; imported fixture signals: none detected
- `src/studio/workspaces/OrganizationRuleBuilder.tsx` — 198 lines; 2 state hooks; imported fixture signals: none detected
- `src/studio/workspaces/PlanReviewWorkspace.tsx` — 151 lines; 1 state hooks; imported fixture signals: none detected
- `src/studio/workspaces/SourceGrantWorkspace.tsx` — 178 lines; 2 state hooks; imported fixture signals: none detected
- `src/studio/workspaces/SuggestionsReview.tsx` — 127 lines; 0 state hooks; imported fixture signals: none detected
- `src/studio/workspaces/VisualLibraryWorkspace.tsx` — 26 lines; 0 state hooks; imported fixture signals: none detected

Also inspect src/App.tsx, src/context/NavigationContext.tsx and shared shell for integration; inspect existing tests and the actual root Electron/native contract code.

## SCREEN-SPECIFIC ACCEPTANCE

اختبارات fixture مختلطة وfolder حقيقي قابل للتجربة وundo؛ لا ملف فريد يضيع؛ لا نجاح بالاعتماد على preview فقط.

Verify each user interaction in a real rendered app, and for native operations in a correct Electron environment. Do not claim native completion from localhost Vite UI.

Nine-stage native journey must survive app restart. Stages 1 SourceGrant, 2 VisualLibrary, 3 CollectionComposer, 4 RuleBuilder, 5 DestinationInspector, 6 PlanReview, 7 ExecutionMonitor, 8 HistoryUndoInspector, 9 SuggestionsReview. Dedicated file-identity, copy verification, conflict naming and per-op journal tests required. The source StudioPage embeds WindowsTitleBar and GlobalSidebar: avoid a second nested shell when connecting to app navigation.

## SCREEN-SPECIFIC OPERATIONS, SUBWORKSPACES & BACKEND

Every item here is mandatory within the scope of this section. If the code already implements it, verify and extend instead of duplicating it.

### 01. Sources
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 02. Visual Library
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 03. Collections
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 04. Organization Builder
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 05. Destinations
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 06. Plan Review
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 07. Execution
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 08. History & Undo
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 09. Suggestions
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.


## FULL UI ACTION / CONTROL AUDIT — EXACT SOURCE LOCATIONS

This is a static source index, NOT certified total runtime coverage. For EACH item listed below, read the JSX at the line, trace its click/change handler, state updates, relevant descriptor/engine, and record whether it is Working / Mock-only / No-op / Broken / Blocked / Implemented Verified. Inspect custom child components, dynamically generated controls, menu items and keyboard shortcuts as well.

Use a per-control verification table in your final handoff. Do not mark a button PASS because it has onClick or because it opens a modal; it must drive the correct native/preview action and display a genuine result.

- `studio/StudioPage.tsx:117` | button | onClick | [inspect source]
- `studio/modals.tsx:51` | button | onClick | [inspect source]
- `studio/modals.tsx:60` | input | onChange | [inspect source]
- `studio/modals.tsx:71` | button | onClick | [inspect source]
- `studio/modals.tsx:77` | button | onClick | [inspect source]
- `studio/modals.tsx:100` | button | onClick | [inspect source]
- `studio/modals.tsx:109` | input | onChange | [inspect source]
- `studio/modals.tsx:118` | button | onClick | [inspect source]
- `studio/modals.tsx:124` | button | onClick | [inspect source]
- `studio/modals.tsx:145` | button | onClick | (
- `studio/modals.tsx:173` | button | onClick | [inspect source]
- `studio/modals.tsx:191` | button | onClick | [inspect source]
- `studio/modals.tsx:216` | button | onClick | [inspect source]
- `studio/modals.tsx:234` | button | onClick | [inspect source]
- `studio/modals.tsx:244` | button | onClick | [inspect source]
- `studio/modals.tsx:257` | button | onClick | [inspect source]
- `studio/modals.tsx:268` | button | onClick | [inspect source]
- `studio/modals.tsx:279` | button | onClick | [inspect source]
- `studio/modals.tsx:292` | button | onClick | [inspect source]
- `studio/panels.tsx:94` | button | onClick | [inspect source]
- `studio/panels.tsx:106` | button | onClick | [inspect source]
- `studio/panels.tsx:116` | button | onClick | [inspect source]
- `studio/panels.tsx:137` | button | onClick | [inspect source]
- `studio/panels.tsx:145` | button | onClick | [inspect source]
- `studio/panels.tsx:238` | button | onClick | [inspect source]
- `studio/panels.tsx:299` | button | onClick | [inspect source]
- `studio/panels.tsx:310` | button | onClick | [inspect source]
- `studio/panels.tsx:325` | select | onChange | [inspect source]
- `studio/panels.tsx:339` | button | onClick | [inspect source]
- `studio/panels.tsx:364` | OTHER_INTERACTIVE | onClick | <div                     key={file.id}                     
- `studio/panels.tsx:429` | OTHER_INTERACTIVE | onClick | <div                     key={file.id}                     
- `studio/panels.tsx:529` | button | onClick | [inspect source]
- `studio/panels.tsx:548` | button | onClick | [inspect source]
- `studio/panels.tsx:568` | button | onClick | [inspect source]
- `studio/panels.tsx:589` | input | onChange | [inspect source]
- `studio/panels.tsx:601` | input | onChange | [inspect source]
- `studio/panels.tsx:613` | input | onChange | [inspect source]
- `studio/panels.tsx:644` | button | onClick | [inspect source]
- `studio/parts.tsx:120` | button | onClick | [inspect source]
- `studio/parts.tsx:131` | button | onClick | [inspect source]
- `studio/parts.tsx:139` | button | onClick | Reset directly to the exact screenshot state
- `studio/parts.tsx:150` | button | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `studio/parts.tsx:153` | button | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `studio/parts.tsx:156` | button | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `studio/parts.tsx:294` | button | onClick | [inspect source]
- `studio/parts.tsx:322` | button | onClick | [inspect source]
- `studio/parts.tsx:404` | button | onClick | [inspect source]
- `studio/parts.tsx:412` | button | onClick | [inspect source]
- `studio/parts.tsx:420` | button | onClick | [inspect source]
- `studio/parts.tsx:432` | button | onClick | [inspect source]
- `studio/workspaces/CollectionComposer.tsx:66` | button | onClick | [inspect source]
- `studio/workspaces/CollectionComposer.tsx:82` | OTHER_INTERACTIVE | onSubmit | <form 
- `studio/workspaces/CollectionComposer.tsx:83` | input | onChange | [inspect source]
- `studio/workspaces/CollectionComposer.tsx:90` | select | onChange | [inspect source]
- `studio/workspaces/CollectionComposer.tsx:100` | button | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `studio/workspaces/CollectionComposer.tsx:143` | button | onClick | [inspect source]
- `studio/workspaces/CollectionComposer.tsx:149` | button | onClick | [inspect source]
- `studio/workspaces/DestinationInspector.tsx:74` | button | onClick | [inspect source]
- `studio/workspaces/DestinationInspector.tsx:91` | input | onChange | [inspect source]
- `studio/workspaces/DestinationInspector.tsx:107` | button | onClick | [inspect source]
- `studio/workspaces/DestinationInspector.tsx:191` | OTHER_INTERACTIVE | onClick | <div                 key={mode.id}                 
- `studio/workspaces/DestinationInspector.tsx:199` | input | onChange | [inspect source]
- `studio/workspaces/ExecutionMonitor.tsx:70` | button | onClick | [inspect source]
- `studio/workspaces/ExecutionMonitor.tsx:87` | button | onClick | [inspect source]
- `studio/workspaces/HistoryUndoInspector.tsx:51` | button | onClick | [inspect source]
- `studio/workspaces/HistoryUndoInspector.tsx:118` | button | onClick | [inspect source]
- `studio/workspaces/OrganizationRuleBuilder.tsx:65` | button | onClick | [inspect source]
- `studio/workspaces/OrganizationRuleBuilder.tsx:86` | input | onChange | [inspect source]
- `studio/workspaces/OrganizationRuleBuilder.tsx:101` | button | onClick | [inspect source]
- `studio/workspaces/OrganizationRuleBuilder.tsx:118` | select | onChange | [inspect source]
- `studio/workspaces/OrganizationRuleBuilder.tsx:146` | input | onChange | [inspect source]
- `studio/workspaces/OrganizationRuleBuilder.tsx:163` | button | onClick | [inspect source]
- `studio/workspaces/PlanReviewWorkspace.tsx:51` | button | onClick | [inspect source]
- `studio/workspaces/PlanReviewWorkspace.tsx:96` | button | onClick | [inspect source]
- `studio/workspaces/PlanReviewWorkspace.tsx:106` | button | onClick | [inspect source]
- `studio/workspaces/SourceGrantWorkspace.tsx:75` | OTHER_INTERACTIVE | onSubmit | <form 
- `studio/workspaces/SourceGrantWorkspace.tsx:76` | input | onChange | [inspect source]
- `studio/workspaces/SourceGrantWorkspace.tsx:83` | button | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `studio/workspaces/SourceGrantWorkspace.tsx:98` | button | onClick | [inspect source]
- `studio/workspaces/SourceGrantWorkspace.tsx:119` | button | onClick | [inspect source]
- `studio/workspaces/SourceGrantWorkspace.tsx:156` | button | onClick | [inspect source]
- `studio/workspaces/SourceGrantWorkspace.tsx:163` | button | onClick | [inspect source]
- `studio/workspaces/SuggestionsReview.tsx:40` | button | onClick | [inspect source]
- `studio/workspaces/SuggestionsReview.tsx:102` | button | onClick | [inspect source]
- `studio/workspaces/SuggestionsReview.tsx:110` | button | onClick | [inspect source]

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

D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\references\REF-01_Smart_Organization_Studio.png

The file above EXISTS on this PC and is the approved visual baseline for this section. Inspect it directly at native resolution. Compare actual rendered window region-by-region, maintain the same composition and branded assets, and show actual before/after evidence at the acceptance viewports. Do not claim visual parity without screenshots.


---

## REAL USER SERVICE ACTIVATION — POST-READ-ONLY PRODUCT ACCEPTANCE

This addendum implements the user's requirement that KNOuX must deliver REAL consumer actions, not only passive reading and dry-runs. Read and obey missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md BEFORE assessing this section. Treat earlier read-only/preview success as a valid engineering checkpoint but NOT automatic final functionality acceptance.

### Specific outcomes to implement and prove

- Studio's PRIMARY PURPOSE is to organize real user-selected folders. Implement the actual controlled file-operation engine: authorized scoped source/destination, category rules, preview, transactional move/copy/rename or organize, collision policy, file integrity verification, cancel, durable journal and **working Undo/Restore** where possible.
- Respect symlink/junction boundaries, same-volume atomic moves when available, external drive failure, protected files, duplicates, rechecks and rollback conflicts.
- The nine stages are a workflow from source selection to EXECUTION and HISTORY, not nine disconnected read-only exhibitions. Execution buttons cannot be permanently disabled in the finished product.
- Tests must execute real file operations on temporary owned fixtures, assert files/bytes at destination, confirm original metadata and real undo; do NOT organize personal user folders during agent work.

### Product acceptance

Enumerate EVERY existing service ID in this mission. Assign appropriate A observational / B reversible / C destructive-privileged / D connected category. Include each service in the central capability matrix, with actual native/API implementation, UI action, scoped consent gate, controlled fixture effect test, after-state verification, journal/undo if feasible, and honest limitations. A passive service may be complete with live useful measurements; an action-promising service requires a real safe executor behind user approval. Do NOT perform effectful tests on real user resources, account, registry or Windows. Do not mark whole-section PRODUCTION COMPLETE until core actions are implemented/tested and supported integrations have their external/manual gates documented.

Follow the existing SINGLE canonical repo/branch and real CI policy; no worktrees, extra project directories, fake results or Root CI. If currently working on another mission, preserve it and enter this section during the ordered activation pass, not by overwriting the agent's uncommitted changes.


## Mandatory interactive workbench & real controls — Mission 15A

When user opens ANY advertised service, show its unique control-rich tool workbench in a pinned resizable side panel OR an expanded full in-app workspace, with working dock/expand/collapse and persistent resource/filter/selection state. Use one accessible shared shell but domain-specific body and real native/API handlers; no generic repeated modal or cosmetic buttons.

Studio: visual library, categories, thumbnails, flexible rules/destination, collision options, exact before/after preview, user-authorized apply, progress, journal and real undo.

Every relevant control must select/inspect/filter/configure a real outcome, or expose clearly why unsupported. For a mutation, require per-item measured preview, exact per-action user consent, fixed validated executor, controlled-disposable-fixture effect test, after-state receipt and real restore if feasible. Do not run risky OS/file/cloud operations on owner's data during agent testing.

Verify EN+AR RTL, dark+light, 1366/1672/1920, keyboard/focus, dock<->expanded continuity, no header/footer obstruction; update docs/SERVICE_WORKBENCH_ACCEPTANCE.md and the capability matrix for each original service ID. Mission reference: missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md. This UX gate is not alone proof the action service is product-complete.
