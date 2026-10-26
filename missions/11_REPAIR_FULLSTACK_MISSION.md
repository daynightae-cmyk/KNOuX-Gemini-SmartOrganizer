# KNOuX 11 — RECOVERY LAB WINDOWS REPAIR — FULL-STACK EXECUTION MISSION

**Standalone task file. Mission prepared:** 2026-10-25T08:15:31.386634+00:00. **Read-only source snapshot SHA:** c0bf2ee6066faabaf3d683f57ad3c11cb212bec2. Recheck every assumption at execution time.

**Source audit scope:** 2 code files, 10 static UI controls/handlers, 12 canonical registry services. Worlds: repair (12 descriptors).

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

مختبر إصلاح بأوامر مضبوطة ومدخلات محدودة، يوضح scope والامتيازات والآثار والنتائج، مع History وpre/post checks.


## SPECIFIC DATA CONTRACTS & PROVENANCE

DiagnosticEvidence, RepairCommandSpec, RepairPrerequisite, ElevationDecision, RepairRunProgress, RepairReceipt, RepairVerification, RebootRequirement.

Required actual data interface should expose typed pagination/streaming where warranted, durable identity, permissions, provenance, error codes, capability detection and safe caching. Do not invent numbers.

## BACKEND REUSE, WINDOWS AND PROVIDER IMPLEMENTATION

Audit electron/privileged-runner.cjs and verification.cjs; use allowlisted Windows executables with fixed arguments via spawn without shell, user-approved elevation only, output stream sanitization, bounded cancellation and timeout.

**Existing native candidates to inspect first:** electron/privileged-runner.cjs, verification.cjs, main.cjs

## CINEMATIC UI, WORKFLOWS & DOMAIN INTERACTION

Repair tools grid، guided seven-stage sequence، command preview، risk/permission blocks، genuine run log + confidence verdict، history and verify result.

At all responsive desktop viewports preserve approved imagery, content hierarchy, dedicated domain inspector and visible bottom actions. Do not replace premium visual depth with simplistic wireframe widgets.

## SAFETY, PERMISSIONS & REAL EXECUTION

High-risk Winsock/TCP-IP reset requires backup of config metadata and reboot warning, no auto elevation; restore points not guaranteed; never fake DISM success.

Separate read-only discovery, preview-only simulation, authorized operation and verified postcondition. Do not expose raw Windows commands in the renderer.

## OBSERVED VISUAL/CODE GAP TO FIX

Lower Actions and Repair History are partially obscured at current screenshot viewport.

The statement above comes from the provided screenshots or inspected source and is a target for verification, not an assertion that a patch has already passed.

## CODE FILES TO INSPECT FIRST (REUSE, DO NOT WIPE)

- `src/pages/RepairPage.tsx` — 751 lines; 8 state hooks; imported fixture signals: INITIAL_DIAGNOSTIC_STRIP
- `src/lib/repair-inventory.ts` — 740 lines; 0 state hooks; imported fixture signals: INITIAL_DIAGNOSTIC_STRIP

Also inspect src/App.tsx, src/context/NavigationContext.tsx and shared shell for integration; inspect existing tests and the actual root Electron/native contract code.

## SCREEN-SPECIFIC ACCEPTANCE

read-only CheckHealth verified, admin-required state honest; controlled failure and cancellation logs.

Verify each user interaction in a real rendered app, and for native operations in a correct Electron environment. Do not claim native completion from localhost Vite UI.

## CANONICAL SERVICE-BY-SERVICE IMPLEMENTATION (NO SERVICE MAY BE SKIPPED)

### 01. DISM CheckHealth Diagnostic Console — `repair-component-check`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world repair, descriptor family Safe Diagnostics Console; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** DISM CheckHealth checklist and embedded terminal-look preview. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select diagnostic step, Inspect requirements, Copy example command, Toggle transcript view. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Component Store corruption status, DISM servicing state, System requirements check, Diagnostic transcript window. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output. First examine and REUSE electron/privileged-runner.cjs, verification.cjs, main.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 02. DISM ScanHealth 7-Stage Console — `repair-component-scan`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world repair, descriptor family Safe Diagnostics Console; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** DISM ScanHealth 7-stage wizard, progress track and diagnostic details. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Inspect staged steps, Copy example command text, Toggle progress demo, View stage log. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** 7-stage scan sequence, Component Store integrity rating, Repairable corruption status, Terminal preview log. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output. First examine and REUSE electron/privileged-runner.cjs, verification.cjs, main.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 03. DISM RestoreHealth System Repair Wizard — `repair-component-restore`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world repair, descriptor family Safe Diagnostics Console; risk class administrative; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Before/after component health, privileged warning and source prerequisites. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select supported source option, Review impact warning, Stage repair draft, Check Windows Update source. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Component health before/after, Windows Update / WIM source check, Reboot requirement notice, Staged review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output. First examine and REUSE electron/privileged-runner.cjs, verification.cjs, main.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Must require validated admin capability, explicit high-risk confirmation and protected-resource denies. No bypass, no silent elevation.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 04. SFC VerifyOnly File Integrity Shield — `repair-files-verify`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world repair, descriptor family Safe Diagnostics Console; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** SFC VerifyOnly file shield visualization and check results panel. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Inspect prerequisites, View sample output, Toggle verification mode, Copy command text. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** System File Integrity status, CBS.log file path, Protected system binaries count, Verification transcript preview. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output. First examine and REUSE electron/privileged-runner.cjs, verification.cjs, main.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 05. SFC ScanNow Protected File Repair Wizard — `repair-files-repair`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world repair, descriptor family Safe Diagnostics Console; risk class administrative; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** SFC ScanNow staged restoration timeline and risk/perms inspector. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Review protected scope, Read reboot warnings, Stage repair proposal, Copy SFC command. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Protected System Files scope, Administrator privilege check, Reboot requirement status, Staged review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output. First examine and REUSE electron/privileged-runner.cjs, verification.cjs, main.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Must require validated admin capability, explicit high-risk confirmation and protected-resource denies. No bypass, no silent elevation.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 06. DNS Resolver Cache Refresh Preview — `repair-dns-flush`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world repair, descriptor family Safe Diagnostics Console; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** DNS cache/current resolver cards and flush impact diagram. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Inspect selected adapter, Preview flush steps, Check DNS cache entries, Stage flush proposal. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Current DNS cache size, Flushed resolver entries estimate, Network adapter impact notice, Staged review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output. First examine and REUSE electron/privileged-runner.cjs, verification.cjs, main.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 07. Winsock Catalog Disruption Risk Review — `repair-winsock-reset`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world repair, descriptor family Staging + Impact Review; risk class administrative; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Winsock dependency stack and reboot/disruption warnings. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select checklist acknowledgements, Inspect affected layers, Review reboot requirement, Stage reset draft. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Winsock SPI catalog status, Affected network LSP drivers, Mandatory reboot notice, Staged review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output. First examine and REUSE electron/privileged-runner.cjs, verification.cjs, main.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Must require validated admin capability, explicit high-risk confirmation and protected-resource denies. No bypass, no silent elevation.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 08. TCP/IP Stack Reset Configuration Diff — `repair-tcpip-reset`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world repair, descriptor family Staging + Impact Review; risk class administrative; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Before/proposed TCP/IP config panels with sensitive network warnings. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Choose adapter, Review restart warning, Compare configuration diff, Stage reset draft. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Current vs default TCP/IP parameters, Downtime & reboot warning, NetSH command preview, Staged review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output. First examine and REUSE electron/privileged-runner.cjs, verification.cjs, main.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Must require validated admin capability, explicit high-risk confirmation and protected-resource denies. No bypass, no silent elevation.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 09. System Repair Audit Journal — `repair-history`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world repair, descriptor family Repair Journal; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Timestamped real-operation cards with status, tool, warning icons. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Filter by tool type, Inspect journal event, Export audit preview, Date range filter. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Repair transaction ID, Tool invoked (SFC/DISM/NetSH), Execution result status, Provenance verification. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output. First examine and REUSE electron/privileged-runner.cjs, verification.cjs, main.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 10. Windows Troubleshooter Gateway — `repair-troubleshooters`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world repair, descriptor family Ledger+Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Issue category tiles, recommended diagnostic flow and OS handoff. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select issue category, Navigate diagnostic steps, View OS settings handoff, Inspect prerequisites. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Troubleshooter category (Network/Audio/Printer), Windows Get-Help handoff step, Diagnostic checklist, Resolution guide. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output. First examine and REUSE electron/privileged-runner.cjs, verification.cjs, main.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 11. System Restore Point Inspector — `repair-restore-point`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world repair, descriptor family Repair Journal; risk class administrative; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** System restore dated snapshot chain and eligibility details. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select restore snapshot, Compare metadata, View Windows handoff step, Stage restore proposal. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Restore Point timestamp & type, Sequence ID & description, Affected drives list, Windows System Restore handoff. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output. First examine and REUSE electron/privileged-runner.cjs, verification.cjs, main.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Must require validated admin capability, explicit high-risk confirmation and protected-resource denies. No bypass, no silent elevation.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 12. Windows Update Servicing Reset Wizard — `repair-update-reset`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world repair, descriptor family Safe Diagnostics Console; risk class administrative; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Update-error timeline and supported servicing checklist. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select safe diagnostic step, Preview next step, Review servicing warnings, Stage reset draft. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** BITS & Windows Update service status, SoftwareDistribution folder status, Troubleshooting guide, Staged review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output. First examine and REUSE electron/privileged-runner.cjs, verification.cjs, main.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Must require validated admin capability, explicit high-risk confirmation and protected-resource denies. No bypass, no silent elevation.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.



## FULL UI ACTION / CONTROL AUDIT — EXACT SOURCE LOCATIONS

This is a static source index, NOT certified total runtime coverage. For EACH item listed below, read the JSX at the line, trace its click/change handler, state updates, relevant descriptor/engine, and record whether it is Working / Mock-only / No-op / Broken / Blocked / Implemented Verified. Inspect custom child components, dynamically generated controls, menu items and keyboard shortcuts as well.

Use a per-control verification table in your final handoff. Do not mark a button PASS because it has onClick or because it opens a modal; it must drive the correct native/preview action and display a genuine result.

- `pages/RepairPage.tsx:297` | select | onChange | [inspect source]
- `pages/RepairPage.tsx:318` | OTHER_INTERACTIVE | onClick | <div                       key={tool.id}                       
- `pages/RepairPage.tsx:359` | button | onClick | [inspect source]
- `pages/RepairPage.tsx:399` | button | onClick | [inspect source]
- `pages/RepairPage.tsx:534` | button | onClick | [inspect source]
- `pages/RepairPage.tsx:655` | button | onClick | [inspect source]
- `pages/RepairPage.tsx:672` | button | onClick | [inspect source]
- `pages/RepairPage.tsx:689` | button | onClick | [inspect source]
- `pages/RepairPage.tsx:709` | button | onClick | [inspect source]
- `pages/RepairPage.tsx:721` | button | onClick | [inspect source]

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

D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\references\REF-08_Repair_Recovery_Lab.png

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
- src/components/repair/RepairWorkspaces.tsx

Trace runtime service dispatch from the selected tile to ServiceWorkspaceHost to the appropriate renderer family. For EACH generated control: trace actual current selection, config props, state updates, actual provider call, preview, permission gate, error and verification. A direct page control inventory alone is not complete. No all-service generic fake preview is acceptable.


---

## REAL USER SERVICE ACTIVATION — POST-READ-ONLY PRODUCT ACCEPTANCE

This addendum implements the user's requirement that KNOuX must deliver REAL consumer actions, not only passive reading and dry-runs. Read and obey missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md BEFORE assessing this section. Treat earlier read-only/preview success as a valid engineering checkpoint but NOT automatic final functionality acceptance.

### Specific outcomes to implement and prove

- Repair Lab should move beyond pure preview with a safe, supported user-invoked Windows repair operator for appropriate DISM/SFC/dnsflush/network-repair primitives using fixed command enums/args, OS/UAC approval, progress capture, timeouts, reboot indicator and verified after-state.
- Never run these commands on owner's Windows during unattended build/test. Use mocked command runner and authorized disposable VM integration gates; real repair of user's OS requires specific confirmation.
- Restore-point inspection may be read-only, but actual restore creation/application requires supported Windows API and separate gate. Winsock/TCP resets can disrupt connectivity: show exact irreversible effects and recovery instructions. No generic arbitrary shell execution.
- History must record actual diagnostics and repair outcomes; blocked-by-policy is honest partial, not action-complete.

### Product acceptance

Enumerate EVERY existing service ID in this mission. Assign appropriate A observational / B reversible / C destructive-privileged / D connected category. Include each service in the central capability matrix, with actual native/API implementation, UI action, scoped consent gate, controlled fixture effect test, after-state verification, journal/undo if feasible, and honest limitations. A passive service may be complete with live useful measurements; an action-promising service requires a real safe executor behind user approval. Do NOT perform effectful tests on real user resources, account, registry or Windows. Do not mark whole-section PRODUCTION COMPLETE until core actions are implemented/tested and supported integrations have their external/manual gates documented.

Follow the existing SINGLE canonical repo/branch and real CI policy; no worktrees, extra project directories, fake results or Root CI. If currently working on another mission, preserve it and enter this section during the ordered activation pass, not by overwriting the agent's uncommitted changes.


## Mandatory interactive workbench & real controls — Mission 15A

When user opens ANY advertised service, show its unique control-rich tool workbench in a pinned resizable side panel OR an expanded full in-app workspace, with working dock/expand/collapse and persistent resource/filter/selection state. Use one accessible shared shell but domain-specific body and real native/API handlers; no generic repeated modal or cosmetic buttons.

Repair: 12 domain repair consoles, prerequisites, source diagnostics, exact operation choices, approved typed native repair, transcript, reboot limits and after-state.

Every relevant control must select/inspect/filter/configure a real outcome, or expose clearly why unsupported. For a mutation, require per-item measured preview, exact per-action user consent, fixed validated executor, controlled-disposable-fixture effect test, after-state receipt and real restore if feasible. Do not run risky OS/file/cloud operations on owner's data during agent testing.

Verify EN+AR RTL, dark+light, 1366/1672/1920, keyboard/focus, dock<->expanded continuity, no header/footer obstruction; update docs/SERVICE_WORKBENCH_ACCEPTANCE.md and the capability matrix for each original service ID. Mission reference: missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md. This UX gate is not alone proof the action service is product-complete.
