# KNOuX 05 — SOFTWARE COMMAND CENTER — FULL-STACK EXECUTION MISSION

**Standalone task file. Mission prepared:** 2026-10-25T08:15:31.286822+00:00. **Read-only source snapshot SHA:** c0bf2ee6066faabaf3d683f57ad3c11cb212bec2. Recheck every assumption at execution time.

**Source audit scope:** 4 code files, 38 static UI controls/handlers, 12 canonical registry services. Worlds: applications (12 descriptors).

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

مدير برامج مثل فخامة IObit بصريًا لكن بدليل Windows inventory فعلي وعزل طرق الإزالة والتحديث المختلفة، دون إهمال برامج portable/system.


## SPECIFIC DATA CONTRACTS & PROVENANCE

InstalledApp {identity,publisher,version,scope,installLocation,installSource,uninstallMethod,productCode,signatureStatus,lastSeen,sizeEvidence}, AppOperationPlan, DependencyImpact, InstallerReceipt, LeftoverCandidate, UndoAvailability.

Required actual data interface should expose typed pagination/streaming where warranted, durable identity, permissions, provenance, error codes, capability detection and safe caching. Do not invent numbers.

## BACKEND REUSE, WINDOWS AND PROVIDER IMPLEMENTATION

Use existing electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs only after auditing; Windows registry HKLM/HKCU 32/64 view, MSI APIs, packaged/MSIX inventory, winget as optional managed adapter; trust signer via Authenticode; never invoke arbitrary uninstall string unsanitized.

**Existing native candidates to inspect first:** electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs

## CINEMATIC UI, WORKFLOWS & DOMAIN INTERACTION

5 KPIs، searchable table، dossier with verified publisher, app identity, version, footprint and history؛ colored actions، per-app stage wizard، batch operations timeline and leftovers previews.

At all responsive desktop viewports preserve approved imagery, content hierarchy, dedicated domain inspector and visible bottom actions. Do not replace premium visual depth with simplistic wireframe widgets.

## SAFETY, PERMISSIONS & REAL EXECUTION

Uninstall high risk, protected apps guard, elevation separated, explicit confirmation, installer cancellation rules, rollback only when technically available, no guaranteed 'undo uninstall'.

Separate read-only discovery, preview-only simulation, authorized operation and verified postcondition. Do not expose raw Windows commands in the renderer.

## OBSERVED VISUAL/CODE GAP TO FIX

Compact table and dossier need readable text, selection dock and all actions visible without overlap.

The statement above comes from the provided screenshots or inspected source and is a target for verification, not an assertion that a patch has already passed.

## CODE FILES TO INSPECT FIRST (REUSE, DO NOT WIPE)

- `src/pages/ApplicationsPage.tsx` — 413 lines; 4 state hooks; imported fixture signals: INITIAL_METRICS
- `src/components/app/ApplicationCommandSurface.tsx` — 434 lines; 5 state hooks; imported fixture signals: none detected
- `src/components/app/ApplicationDossier.tsx` — 284 lines; 1 state hooks; imported fixture signals: none detected
- `src/lib/app-inventory.ts` — 593 lines; 0 state hooks; imported fixture signals: INITIAL_METRICS

Also inspect src/App.tsx, src/context/NavigationContext.tsx and shared shell for integration; inspect existing tests and the actual root Electron/native contract code.

## SCREEN-SPECIFIC ACCEPTANCE

مقارنة جردين للمطابقة مع برامج مثبتة فعلًا، uninstall preview before action, blocked system package.

Verify each user interaction in a real rendered app, and for native operations in a correct Electron environment. Do not claim native completion from localhost Vite UI.

## CANONICAL SERVICE-BY-SERVICE IMPLEMENTATION (NO SERVICE MAY BE SKIPPED)

### 01. Installed Applications Register — `app-inventory`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world applications, descriptor family Ledger+Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Dense native-icon app register with publisher chips and app detail hero. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Search text, Category facets, Sort by size/date/name, Multi-select checkboxes. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Publisher verification badge, Install location, Registry & MSI evidence, Change history. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 02. App Identity & Authenticode Trust — `app-identity`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world applications, descriptor family Identity Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Large actual-icon slot, publisher/signature certificate layers and package metadata. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select binary, Expand signer chain, Switch details tab, Verify thumbprint. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Authenticode CA chain, Digital signature status, Package identity attributes, Trust level rating. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 03. Multi-Parameter Software Search — `app-search`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world applications, descriptor family Search Console; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Prominent instant-query line, highlighted result rows and publisher facet panel. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Query input, Exact/fuzzy switch, Publisher dropdown, Minimum size filter. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Matched registry count, Scope breakdown, Recent search history, Filtered result ledger. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 04. Publisher Intelligence & Reputation — `app-publisher`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world applications, descriptor family Ledger+Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Vendor tiles grouped by signature confidence and apps-by-publisher chart. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select vendor, Filter trust level, Drill down to app rows, Sort vendor count. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Verified CA credentials, Self-declared vs verified badge, Associated software list, Publisher risk score. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 05. Recently Changed Applications — `app-recent`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world applications, descriptor family Ledger+Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Dated installs/changes timeline with evidence/source chips. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Date range brush, Compare snapshot dates, Filter change type, Inspect change item. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Install timestamp, Installer source method, Modified files summary, Rollback availability. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 06. Bulk Uninstall Queue & Batch Manager — `app-uninstall-queue`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world applications, descriptor family Staging + Impact Review; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Batch selection tray, per-app installer method and dependency-risk cards. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Add/remove queue items, Reorder batch sequence, Select removal mode, Toggle leftover scan. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Dependency risk matrix, System Restore Point check, Reclaimed storage preview, Staged execute review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 07. Orphaned Leftover Trace Analysis — `app-leftovers`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world applications, descriptor family Candidate Safety Ledger; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Folder-tree candidate view, ownership-confidence spectrum and safeguards. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Expand folder tree, Exclude path, Filter confidence level, Build cleanup plan. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Registry key orphan list, AppData folder paths, Safety score indicator, Staged cleanup plan. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 08. Software Update Center — `app-updates`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world applications, descriptor family Ledger+Dossier; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Side-by-side current/available version ribbons, source and trust chips. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Filter update urgency, Select packages, Queue update proposal, Check update feeds. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Release notes diff, Installer format (MSI/WinGet), Digital signature check, Staged update plan. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 09. Software Storage Footprint Treemap — `app-size`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world applications, descriptor family Zoomable Treemap; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Three-mode sizes: reported estimate, measured install data, unknown. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select size policy, Zoom treemap tile, Sort category bars, Drill to folder. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Reported vs actual size delta, AppData contribution, Top 5 heavy applications, Storage tier breakdown. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 10. Package Center & WinGet Browser — `app-store-packages`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world applications, descriptor family Ledger+Dossier; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Two-tab installed/discover package browser with format and source badges. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Switch Installed/Discover tabs, Search package repository, Filter format, Draft install request. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Package manifest ID, Source repository trust, Prerequisites checklist, Staged request review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 11. File Extension & Protocol Matrix — `app-associations`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world applications, descriptor family Ledger+Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Extension/protocol tile grid connected to current handler cards. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Filter file extension, Select default handler, Search protocol, Draft Settings handoff. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Current default app, Alternative available handlers, Windows Settings handoff step, Association conflict status. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 12. Software Boot Impact Analyzer — `app-startup-impact`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world applications, descriptor family Boot Register; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Application icon -> autorun registry/service/schedule relationship tree. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select autorun source, Toggle boot enable/disable draft, Filter impact severity, Deep-link Boot Control. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Boot impact rating (High/Med/Low), Run key / Task / Service location, Resource consumption estimate, Staged policy review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.



## FULL UI ACTION / CONTROL AUDIT — EXACT SOURCE LOCATIONS

This is a static source index, NOT certified total runtime coverage. For EACH item listed below, read the JSX at the line, trace its click/change handler, state updates, relevant descriptor/engine, and record whether it is Working / Mock-only / No-op / Broken / Blocked / Implemented Verified. Inspect custom child components, dynamically generated controls, menu items and keyboard shortcuts as well.

Use a per-control verification table in your final handoff. Do not mark a button PASS because it has onClick or because it opens a modal; it must drive the correct native/preview action and display a genuine result.

- `components/app/ApplicationCommandSurface.tsx:111` | button | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:122` | input | onChange | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:133` | select | onChange | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:150` | select | onChange | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:163` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:182` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:198` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:207` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:216` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:232` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:241` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:250` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:259` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:268` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:277` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:286` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:296` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:314` | OTHER_INTERACTIVE | onClick | <div               
- `components/app/ApplicationCommandSurface.tsx:346` | OTHER_INTERACTIVE | onClick | <div                 key={app.id}                 
- `components/app/ApplicationCommandSurface.tsx:356` | OTHER_INTERACTIVE | onClick | <div                   className="w-8 shrink-0 flex items-center"                   
- `components/app/ApplicationCommandSurface.tsx:403` | OTHER_INTERACTIVE | onClick | <div                   className="w-24 flex items-center justify-center gap-1"       
- `components/app/ApplicationCommandSurface.tsx:405` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:412` | button | onClick | [inspect source]
- `components/app/ApplicationCommandSurface.tsx:419` | button | onClick | [inspect source]
- `components/app/ApplicationDossier.tsx:52` | button | onClick | [inspect source]
- `components/app/ApplicationDossier.tsx:118` | button | onClick | [inspect source]
- `components/app/ApplicationDossier.tsx:130` | button | onClick | [inspect source]
- `components/app/ApplicationDossier.tsx:138` | button | onClick | [inspect source]
- `components/app/ApplicationDossier.tsx:149` | button | onClick | [inspect source]
- `components/app/ApplicationDossier.tsx:157` | button | onClick | [inspect source]
- `components/app/ApplicationDossier.tsx:165` | button | onClick | [inspect source]
- `components/app/ApplicationDossier.tsx:173` | button | onClick | [inspect source]
- `components/app/ApplicationDossier.tsx:189` | button | onClick | View All
- `pages/ApplicationsPage.tsx:334` | button | onClick | [inspect source]
- `pages/ApplicationsPage.tsx:381` | button | onClick | [inspect source]
- `pages/ApplicationsPage.tsx:387` | button | onClick | [inspect source]
- `pages/ApplicationsPage.tsx:393` | button | onClick | [inspect source]
- `pages/ApplicationsPage.tsx:399` | button | onClick | [inspect source]

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

D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\references\REF-02_Applications_Software_Command.png

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
- src/components/app/ServiceWorkspaces.tsx

Trace runtime service dispatch from the selected tile to ServiceWorkspaceHost to the appropriate renderer family. For EACH generated control: trace actual current selection, config props, state updates, actual provider call, preview, permission gate, error and verification. A direct page control inventory alone is not complete. No all-service generic fake preview is acceptable.
