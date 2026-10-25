# KNOuX 09 — BOOT CONTROL & STARTUP OPTIMIZER — FULL-STACK EXECUTION MISSION

**Standalone task file. Mission prepared:** 2026-10-25T08:15:31.356892+00:00. **Read-only source snapshot SHA:** c0bf2ee6066faabaf3d683f57ad3c11cb212bec2. Recheck every assumption at execution time.

**Source audit scope:** 3 code files, 32 static UI controls/handlers, 12 canonical registry services. Worlds: startup (12 descriptors).

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

مراقبة وتهيئة عناصر بدء Windows مع أدلة واقعية ودون تدمير مداخل النظام؛ إصلاح نافذة Telemetry التي تغطي الجدول.


## SPECIFIC DATA CONTRACTS & PROVENANCE

StartupEntry {stableId,sourceKind,scope,path,args,signature,publisher,state}, BootDurationSample, BootImpactEstimate, ProposedStartChange, StartupChangeJournal.

Required actual data interface should expose typed pagination/streaming where warranted, durable identity, permissions, provenance, error codes, capability detection and safe caching. Do not invent numbers.

## BACKEND REUSE, WINDOWS AND PROVIDER IMPLEMENTATION

Audit electron/startup-manager.cjs and Windows registry entries, startup folders, Task Scheduler APIs and SCM delayed services, Windows boot diagnostics; per-source update adapter with ACL and eligibility checks.

**Existing native candidates to inspect first:** electron/startup-manager.cjs, windows-providers.cjs, automation.cjs

## CINEMATIC UI, WORKFLOWS & DOMAIN INTERACTION

Boot waterfall timeline، KPIs، facets per source، dense register، selected item dossier، staged impact explanations، live inspector docked/non-obscuring، bottom command bar.

At all responsive desktop viewports preserve approved imagery, content hierarchy, dedicated domain inspector and visible bottom actions. Do not replace premium visual depth with simplistic wireframe widgets.

## SAFETY, PERMISSIONS & REAL EXECUTION

Never disable AV/EDR/drivers/critical services; Windows Security protected; preserve original value, command and ACLs for verifiable reversion; delay only where semantics supported.

Separate read-only discovery, preview-only simulation, authorized operation and verified postcondition. Do not expose raw Windows commands in the renderer.

## OBSERVED VISUAL/CODE GAP TO FIX

The floating Live Process & Telemetry Inspector overlays the register and staged action region in provided screenshots.

The statement above comes from the provided screenshots or inspected source and is a target for verification, not an assertion that a patch has already passed.

## CODE FILES TO INSPECT FIRST (REUSE, DO NOT WIPE)

- `src/pages/StartupPage.tsx` — 1009 lines; 12 state hooks; imported fixture signals: INITIAL_BOOT_METRICS
- `src/lib/startup-inventory.ts` — 705 lines; 0 state hooks; imported fixture signals: INITIAL_BOOT_METRICS, INITIAL_JOURNAL_LOG
- `src/components/common/LiveProcessInspector.tsx` — 252 lines; 6 state hooks; imported fixture signals: none detected

Also inspect src/App.tsx, src/context/NavigationContext.tsx and shared shell for integration; inspect existing tests and the actual root Electron/native contract code.

## SCREEN-SPECIFIC ACCEPTANCE

source inventory matches OS; user-approved disable/re-enable test for safe sandbox entry; protected entries rejected.

Verify each user interaction in a real rendered app, and for native operations in a correct Electron environment. Do not claim native completion from localhost Vite UI.

## CANONICAL SERVICE-BY-SERVICE IMPLEMENTATION (NO SERVICE MAY BE SKIPPED)

### 01. Windows Boot Autorun Register — `startup-overview`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world startup, descriptor family Boot Register; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Dense autorun list and Windows startup-sequence timeline. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Filter state (Enabled/Disabled), Filter source type, Row selection, Inspect autorun item. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** HKCU/HKLM Registry path, Digital signature status, Boot impact classification, Staged toggle review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available. First examine and REUSE electron/startup-manager.cjs, windows-providers.cjs, automation.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 02. Autorun State Change Preview — `startup-disable`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world startup, descriptor family Staging + Impact Review; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Selected startup card, enabled -> disabled timeline and impact inspector. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Stage toggle draft, Review current source, Acknowledge system warning, Select disable mode. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Before/after boot impact diff, Protected system component check, Estimated boot time saving, Staged review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available. First examine and REUSE electron/startup-manager.cjs, windows-providers.cjs, automation.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 03. Startup Restoration & Rollback — `startup-restore`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world startup, descriptor family Repair Journal; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Journal entry timeline with restored value comparison. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Choose eligible journal entry, Preview registry conflict, Select items to restore, Stage restore draft. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Journal timestamp & user, Original registry value, Current registry value, Restoration review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available. First examine and REUSE electron/startup-manager.cjs, windows-providers.cjs, automation.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 04. Autorun Source Coverage Map — `startup-sources`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world startup, descriptor family Boot Register; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** HKCU/HKLM/folders/tasks/services swimlane overview. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select source swimlane, Filter location type, Inspect registry key, Toggle source view. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** HKCU Run & RunOnce keys, HKLM Run & RunOnce keys, Startup Folder (%APPDATA%), Scheduled Tasks & Services. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available. First examine and REUSE electron/startup-manager.cjs, windows-providers.cjs, automation.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 05. Startup Change Audit Journal — `startup-journal`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world startup, descriptor family Repair Journal; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Chronological rows with before/after control chips and undo eligibility. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Date range filter, Source location filter, Select event row, Export audit log. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Audit event ID, Action type (Enable/Disable/Delay), Before/after state comparison, Eligibility rating. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available. First examine and REUSE electron/startup-manager.cjs, windows-providers.cjs, automation.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 06. Keyboard-First Autorun Query Console — `startup-filter`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world startup, descriptor family Search Console; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Dense keyboard-first search results with status/source facets. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Query text input, Source facets filter, Status toggle, Keyboard navigation. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Matched autorun count, Publisher verification filter, Execution path summary, Quick inspection card. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available. First examine and REUSE electron/startup-manager.cjs, windows-providers.cjs, automation.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 07. Boot Sequence Impact Timeline — `startup-impact`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world startup, descriptor family Boot Register; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Boot event/Gantt timeline with impact evidence confidence. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select time window, Inspect attributed entry, Sort by boot delay, Filter impact level. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Measured boot delay contribution, CPU & I/O usage during boot, Publisher verification, Optimization recommendation. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available. First examine and REUSE electron/startup-manager.cjs, windows-providers.cjs, automation.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 08. Service Boot Policy Matrix — `startup-services`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world startup, descriptor family Service Commander Ledger; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Grouped delayed/automatic services table linked to Service Commander. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Filter startup policy, Select service row, Drill to Service Commander, Stage policy draft. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Startup type (Auto/Delayed/Manual), Service PID & account, Protected service status, Staged policy review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available. First examine and REUSE electron/startup-manager.cjs, windows-providers.cjs, automation.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 09. Logon Scheduled Task Timeline — `startup-tasks`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world startup, descriptor family Boot Register; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Scheduler tree and trigger/timeline inspector. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select scheduled task, Inspect trigger details, Filter task status, Stage task disable draft. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Task trigger (At logon/At boot), Task author & publisher, Next & last run timestamp, Staged review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available. First examine and REUSE electron/startup-manager.cjs, windows-providers.cjs, automation.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 10. Delayed Launch Planner — `startup-delay`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world startup, descriptor family Schedule Node Flow; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Original trigger vs proposed delayed launch lanes. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Drag delay marker, Configure delay minutes, Review collision conflict, Stage delay policy. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Original boot time vs delayed offset, Conflict check status, Estimated system responsiveness, Staged review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available. First examine and REUSE electron/startup-manager.cjs, windows-providers.cjs, automation.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 11. Autorun Batch Staging Tray — `startup-batch`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world startup, descriptor family Staging + Impact Review; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Autorun batch cards with selected state and rights badges. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Add/remove batch items, Reorder batch execution, Inspect affected sources, Stage batch review. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Total queued actions, Affected registry locations, Administrative rights requirement, Execution review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available. First examine and REUSE electron/startup-manager.cjs, windows-providers.cjs, automation.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 12. Batch Recovery & Mass Rollback Workspace — `startup-undo-all`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world startup, descriptor family Repair Journal; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Journal cards with restoration order and collision flags. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select eligible session, Re-order safe rollback plan, Review collision warnings, Stage rollback review. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Session timestamp, Total restored autorun items, Registry integrity check, Rollback review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available. First examine and REUSE electron/startup-manager.cjs, windows-providers.cjs, automation.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.



## FULL UI ACTION / CONTROL AUDIT — EXACT SOURCE LOCATIONS

This is a static source index, NOT certified total runtime coverage. For EACH item listed below, read the JSX at the line, trace its click/change handler, state updates, relevant descriptor/engine, and record whether it is Working / Mock-only / No-op / Broken / Blocked / Implemented Verified. Inspect custom child components, dynamically generated controls, menu items and keyboard shortcuts as well.

Use a per-control verification table in your final handoff. Do not mark a button PASS because it has onClick or because it opens a modal; it must drive the correct native/preview action and display a genuine result.

- `components/common/LiveProcessInspector.tsx:108` | button | onClick | [inspect source]
- `components/common/LiveProcessInspector.tsx:145` | button | onClick | [inspect source]
- `components/common/LiveProcessInspector.tsx:152` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:345` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:401` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:418` | OTHER_INTERACTIVE | onClick | 
- `pages/StartupPage.tsx:428` | OTHER_INTERACTIVE | onClick | <div                   key={stg.id}                   
- `pages/StartupPage.tsx:451` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:470` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:478` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:494` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:511` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:528` | select | onChange | [inspect source]
- `pages/StartupPage.tsx:539` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:560` | input | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `pages/StartupPage.tsx:583` | OTHER_INTERACTIVE | onClick | <tr                           key={item.id}                           
- `pages/StartupPage.tsx:595` | OTHER_INTERACTIVE | onClick | <td                             className="p-3 text-center shrink-0"                 
- `pages/StartupPage.tsx:600` | input | onChange | [inspect source]
- `pages/StartupPage.tsx:654` | OTHER_INTERACTIVE | onClick | <td className="p-3 whitespace-nowrap" 
- `pages/StartupPage.tsx:661` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:682` | OTHER_INTERACTIVE | onClick | <td className="p-3 text-center whitespace-nowrap" 
- `pages/StartupPage.tsx:684` | select | onChange | [inspect source]
- `pages/StartupPage.tsx:706` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:781` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:795` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:826` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:842` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:896` | OTHER_INTERACTIVE | onClick | <div                   key={svc.id}                   
- `pages/StartupPage.tsx:961` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:971` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:979` | button | onClick | [inspect source]
- `pages/StartupPage.tsx:987` | button | onClick | [inspect source]

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

D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\references\REF-06_Startup_Boot_Control.png

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
- src/components/startup/StartupWorkspaces.tsx

Trace runtime service dispatch from the selected tile to ServiceWorkspaceHost to the appropriate renderer family. For EACH generated control: trace actual current selection, config props, state updates, actual provider call, preview, permission gate, error and verification. A direct page control inventory alone is not complete. No all-service generic fake preview is acceptable.
