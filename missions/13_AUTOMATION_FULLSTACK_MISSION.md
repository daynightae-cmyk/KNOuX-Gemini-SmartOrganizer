# KNOuX 13 — FLOW STUDIO AUTOMATION ENGINE — FULL-STACK EXECUTION MISSION

**Standalone task file. Mission prepared:** 2026-10-25T08:15:31.417460+00:00. **Read-only source snapshot SHA:** c0bf2ee6066faabaf3d683f57ad3c11cb212bec2. Recheck every assumption at execution time.

**Source audit scope:** 2 code files, 40 static UI controls/handlers, 12 canonical registry services. Worlds: automation (12 descriptors).

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

Flow Studio فعلي بنود قابلة للتكوين، ومحرك جدولة محلي ذاتي الاسترداد مع approvals ومعاينة دقيقة، بدون أعمال تخريبية تلقائية.


## SPECIFIC DATA CONTRACTS & PROVENANCE

WorkflowGraph, TypedNode, TriggerSpec, ConditionSpec, ActionSpec, ApprovalRequest, RunState, ScheduleSpec, ExecutionEdge, RetryPolicy, WorkflowJournal.

Required actual data interface should expose typed pagination/streaming where warranted, durable identity, permissions, provenance, error codes, capability detection and safe caching. Do not invent numbers.

## BACKEND REUSE, WINDOWS AND PROVIDER IMPLEMENTATION

Audit electron/automation.cjs, tool-registry.cjs; DAG validator, persisted workflow versions, local scheduler with DST handling, windows restart recovery, idempotent step tokens, bounded concurrency and cancellation.

**Existing native candidates to inspect first:** electron/automation.cjs, tool-registry.cjs, settings.cjs

## CINEMATIC UI, WORKFLOWS & DOMAIN INTERACTION

workflow library، canvas node editor zoom and ports، node inspector typed forms، service palette، step-through execution preview، timeline/journal، keyboard accessible graph.

At all responsive desktop viewports preserve approved imagery, content hierarchy, dedicated domain inspector and visible bottom actions. Do not replace premium visual depth with simplistic wireframe widgets.

## SAFETY, PERMISSIONS & REAL EXECUTION

No automatic file delete, registry write or privileged action without per-run preapproval; retention policies preview; limit self-trigger loops, quotas and notification spam.

Separate read-only discovery, preview-only simulation, authorized operation and verified postcondition. Do not expose raw Windows commands in the renderer.

## OBSERVED VISUAL/CODE GAP TO FIX

Current flow canvas can waste horizontal space; retain nodes and links while improving zoom-to-fit.

The statement above comes from the provided screenshots or inspected source and is a target for verification, not an assertion that a patch has already passed.

## CODE FILES TO INSPECT FIRST (REUSE, DO NOT WIPE)

- `src/pages/AutomationPage.tsx` — 997 lines; 10 state hooks; imported fixture signals: INITIAL_FLOW_NODES, INITIAL_OPERATION_STAGES
- `src/lib/automation-inventory.ts` — 391 lines; 0 state hooks; imported fixture signals: INITIAL_FLOW_NODES, INITIAL_OPERATION_STAGES

Also inspect src/App.tsx, src/context/NavigationContext.tsx and shared shell for integration; inspect existing tests and the actual root Electron/native contract code.

## SCREEN-SPECIFIC ACCEPTANCE

workflow graph saves reloads, deterministic dryrun, crash resume idempotency, cycles rejected, user approval gating.

Verify each user interaction in a real rendered app, and for native operations in a correct Electron environment. Do not claim native completion from localhost Vite UI.

## CANONICAL SERVICE-BY-SERVICE IMPLEMENTATION (NO SERVICE MAY BE SKIPPED)

### 01. Smart Scan Automated Workflow Flow — `auto-smart-scan`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world automation, descriptor family Schedule Node Flow; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Schedule trigger -> permissioned Smart Scan -> report node chain. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Configure cadence (Daily/Weekly), Review scan scope, Configure quiet hours, Draft policy. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Trigger node (Schedule / Startup), Target scan modules list, Permission gate requirement, Draft workflow preview. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal. First examine and REUSE electron/automation.cjs, tool-registry.cjs, settings.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 02. Weekly Automation Calendar & Task Manager — `auto-schedule-manager`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world automation, descriptor family Schedule Node Flow; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Weekly task calendar with source/status and selected task inspector. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Switch week/list view, Select task row, Draft enable/disable, Filter task category. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Task schedule time & day, Associated workflow template, Status (Active/Paused), Draft policy review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal. First examine and REUSE electron/automation.cjs, tool-registry.cjs, settings.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 03. Automation Run History Timeline — `auto-run-history`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world automation, descriptor family Repair Journal; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Actual run cards with duration/status and result detail. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Filter task/time, Inspect event details, View failure logs, Export history. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Run ID & timestamp, Execution duration ms, Success/Failure status, Produced report artifact. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal. First examine and REUSE electron/automation.cjs, tool-registry.cjs, settings.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 04. Workflow Template Gallery & Library — `auto-templates`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world automation, descriptor family Visual Rule Builder; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Visual workflow-template cards with illustrated node thumbnails. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Filter template category, Preview template nodes, Instantiate local draft, Search templates. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Template node flow preview, Prerequisites required, Estimated time saved, Instantiate workflow draft. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal. First examine and REUSE electron/automation.cjs, tool-registry.cjs, settings.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 05. Recurrence Composer & Cron Preview — `auto-schedule-plan`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world automation, descriptor family Schedule Node Flow; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Cron-like recurrence builder and calendar occurrence preview. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Edit timezone/day/time, Configure exclusions, Validate cron pattern, Preview occurrences. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Cron expression string, Next 5 occurrence dates, Exclusion rule check, Draft policy review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal. First examine and REUSE electron/automation.cjs, tool-registry.cjs, settings.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 06. Safe Automated Cleanup Pipeline — `auto-cleanup-plan`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world automation, descriptor family Schedule Node Flow; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Scan -> safety classify -> approval -> quarantine concept pipeline. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Edit safety thresholds, Select cleanup scope, Review permission gate, Draft pipeline policy. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Pipeline stages sequence, Safety classification rules, User confirmation gate status, Draft review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal. First examine and REUSE electron/automation.cjs, tool-registry.cjs, settings.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 07. Notification Channel Routing Board — `auto-notify`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world automation, descriptor family Schedule Node Flow; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Event-source -> notification-channel mapping with examples. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Toggle local channels, Edit severity threshold, Set quiet hours behavior, Test sample toast. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Active notification channels, Event severity filter, Quiet hours rule, Sample toast preview. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal. First examine and REUSE electron/automation.cjs, tool-registry.cjs, settings.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 08. Quiet Hours 24-Hour Dial — `auto-quiet-hours`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world automation, descriptor family Schedule Node Flow; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** 24-hour circular schedule and weekend timeline. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Drag start/end handles, Select active days, Toggle weekend rule, Draft quiet schedule. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Quiet window (e.g. 22:00 - 07:00), Muted notification events, Gated automation rules, Draft review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal. First examine and REUSE electron/automation.cjs, tool-registry.cjs, settings.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 09. Power-Aware Scheduler & Battery Gating — `auto-battery-policy`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world automation, descriptor family Schedule Node Flow; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** AC/Battery branches with threshold slider and task gating. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Change battery threshold slider, Select AC vs Battery behavior, Preview branch result, Stage power policy. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Battery threshold % (Default 20%), AC power required tasks, Gated task list, Draft policy review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal. First examine and REUSE electron/automation.cjs, tool-registry.cjs, settings.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 10. Artifact Retention Policy Timeline — `auto-retention`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world automation, descriptor family Schedule Node Flow; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Run history artifacts age histogram and keep/delete policy lanes. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Change retention window (14d/30d/90d), Preview affected stored artifacts, Draft policy, Toggle auto-prune. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Retention days setting, Aged artifacts count, Estimated reclaimed storage, Draft policy review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal. First examine and REUSE electron/automation.cjs, tool-registry.cjs, settings.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 11. Workflow Export & Schema Transfer — `auto-export`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world automation, descriptor family Schedule Node Flow; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Portable workflow JSON preview and import validation report layout. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select export options, Preview JSON schema, Stage import validation, Copy JSON string. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Workflow JSON schema v1.0, Import compatibility check, Embedded security signature, Export preview dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal. First examine and REUSE electron/automation.cjs, tool-registry.cjs, settings.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 12. Backup Flow & Verification Designer — `auto-backup-plan`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world automation, descriptor family Schedule Node Flow; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Authorized source -> destination -> snapshot/verification flow graph. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Choose draft source/destination, Set schedule & retention, Configure verification check, Stage backup draft. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Source paths scope, Target destination path, Verification check algorithm, Draft review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal. First examine and REUSE electron/automation.cjs, tool-registry.cjs, settings.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.



## FULL UI ACTION / CONTROL AUDIT — EXACT SOURCE LOCATIONS

This is a static source index, NOT certified total runtime coverage. For EACH item listed below, read the JSX at the line, trace its click/change handler, state updates, relevant descriptor/engine, and record whether it is Working / Mock-only / No-op / Broken / Blocked / Implemented Verified. Inspect custom child components, dynamically generated controls, menu items and keyboard shortcuts as well.

Use a per-control verification table in your final handoff. Do not mark a button PASS because it has onClick or because it opens a modal; it must drive the correct native/preview action and display a genuine result.

- `pages/AutomationPage.tsx:212` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:220` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:231` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:242` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:250` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:274` | button | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `pages/AutomationPage.tsx:283` | input | onChange | Search workflows, templates...
- `pages/AutomationPage.tsx:291` | button | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `pages/AutomationPage.tsx:299` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:349` | OTHER_INTERACTIVE | onClick | <div                       key={wf.id}                       
- `pages/AutomationPage.tsx:386` | OTHER_INTERACTIVE | onClick | <div                       key={tpl.id}                       
- `pages/AutomationPage.tsx:422` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:432` | button | title | Undo
- `pages/AutomationPage.tsx:435` | button | title | Redo
- `pages/AutomationPage.tsx:438` | button | title | Fit to Screen
- `pages/AutomationPage.tsx:442` | button | onClick | −
- `pages/AutomationPage.tsx:449` | button | onClick | +
- `pages/AutomationPage.tsx:456` | button | title | Minimap
- `pages/AutomationPage.tsx:510` | OTHER_INTERACTIVE | onClick | <div                         key={node.id}                         
- `pages/AutomationPage.tsx:600` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:645` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:653` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:661` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:669` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:680` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:754` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:778` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:790` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:810` | input | onChange | [inspect source]
- `pages/AutomationPage.tsx:816` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:835` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:845` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:866` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:874` | select | NO_DIRECT_EVENT_IN_OPENING_TAG | Matches any of
- `pages/AutomationPage.tsx:888` | OTHER_INTERACTIVE | onClick | <X                             
- `pages/AutomationPage.tsx:904` | input | onChange | [inspect source]
- `pages/AutomationPage.tsx:910` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:930` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:953` | button | onClick | [inspect source]
- `pages/AutomationPage.tsx:974` | select | onChange | [inspect source]

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

D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\references\REF-10_Automation_Flow_Studio.png

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
- src/components/automation/AutomationWorkspaces.tsx

Trace runtime service dispatch from the selected tile to ServiceWorkspaceHost to the appropriate renderer family. For EACH generated control: trace actual current selection, config props, state updates, actual provider call, preview, permission gate, error and verification. A direct page control inventory alone is not complete. No all-service generic fake preview is acceptable.


---

## REAL USER SERVICE ACTIVATION — POST-READ-ONLY PRODUCT ACCEPTANCE

This addendum implements the user's requirement that KNOuX must deliver REAL consumer actions, not only passive reading and dry-runs. Read and obey missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md BEFORE assessing this section. Treat earlier read-only/preview success as a valid engineering checkpoint but NOT automatic final functionality acceptance.

### Specific outcomes to implement and prove

- Flow Studio must include an actual persisted scheduler and executor for safe user-authorized workflows, not just save DAG drafts or fake dry-run history. Implement validated DAG, reliable trigger persistence, queued actual scoped steps, bounded execution, cancellation, crash recovery/idempotency, notifications and durable per-step receipts.
- Each enabled automation requires explicit scoped standing user consent and a pause/revoke UI; expiry/limits for effects. No silent cleanups, file mutations, elevated repair, app uninstall, cloud messages or paid API calls as default steps. Such steps need separate user approval/capability and policy checks at runtime.
- Templates, recurrence, quiet hours, battery policy, export/import and backup plan must have meaningful real effects when enabled; test scheduler on controlled clock, dry run vs ACTUAL disposable-fixture step, restart and idempotency. No reliance on permanent Qoder process.

### Product acceptance

Enumerate EVERY existing service ID in this mission. Assign appropriate A observational / B reversible / C destructive-privileged / D connected category. Include each service in the central capability matrix, with actual native/API implementation, UI action, scoped consent gate, controlled fixture effect test, after-state verification, journal/undo if feasible, and honest limitations. A passive service may be complete with live useful measurements; an action-promising service requires a real safe executor behind user approval. Do NOT perform effectful tests on real user resources, account, registry or Windows. Do not mark whole-section PRODUCTION COMPLETE until core actions are implemented/tested and supported integrations have their external/manual gates documented.

Follow the existing SINGLE canonical repo/branch and real CI policy; no worktrees, extra project directories, fake results or Root CI. If currently working on another mission, preserve it and enter this section during the ordered activation pass, not by overwriting the agent's uncommitted changes.


## Mandatory interactive workbench & real controls — Mission 15A

When user opens ANY advertised service, show its unique control-rich tool workbench in a pinned resizable side panel OR an expanded full in-app workspace, with working dock/expand/collapse and persistent resource/filter/selection state. Use one accessible shared shell but domain-specific body and real native/API handlers; no generic repeated modal or cosmetic buttons.

Automation: 12 tools with full interactive DAG canvas, node inspector, triggers/schedule, persistent enabled jobs, actual safe executor, pause/revoke and run receipts.

Every relevant control must select/inspect/filter/configure a real outcome, or expose clearly why unsupported. For a mutation, require per-item measured preview, exact per-action user consent, fixed validated executor, controlled-disposable-fixture effect test, after-state receipt and real restore if feasible. Do not run risky OS/file/cloud operations on owner's data during agent testing.

Verify EN+AR RTL, dark+light, 1366/1672/1920, keyboard/focus, dock<->expanded continuity, no header/footer obstruction; update docs/SERVICE_WORKBENCH_ACCEPTANCE.md and the capability matrix for each original service ID. Mission reference: missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md. This UX gate is not alone proof the action service is product-complete.
