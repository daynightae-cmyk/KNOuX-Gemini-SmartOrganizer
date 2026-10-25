# KNOuX 07 — VOLUME ATLAS STORAGE INTELLIGENCE — FULL-STACK EXECUTION MISSION

**Standalone task file. Mission prepared:** 2026-10-25T08:15:31.323608+00:00. **Read-only source snapshot SHA:** c0bf2ee6066faabaf3d683f57ad3c11cb212bec2. Recheck every assumption at execution time.

**Source audit scope:** 2 code files, 29 static UI controls/handlers, 12 canonical registry services. Worlds: storage (12 descriptors).

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

أطلس المساحات الحقيقي عبر volumes، treemap قابلة للتكبير، تحليل largest/duplicate/filetypes وأداة استعادة مساحة آمنة.


## SPECIFIC DATA CONTRACTS & PROVENANCE

PhysicalDisk, MountedVolume, CapacitySnapshot, FolderSizeRecord, TreemapNode, LargestItem, HealthTelemetry, ReclaimProposal, ScanCoverage.

Required actual data interface should expose typed pagination/streaming where warranted, durable identity, permissions, provenance, error codes, capability detection and safe caching. Do not invent numbers.

## BACKEND REUSE, WINDOWS AND PROVIDER IMPLEMENTATION

Windows volumes via native APIs or audited windows-providers, volume serial+GUID identity, efficient directory-size scan with access-denied awareness, junction cycle guard; SMART data only when supported provider explicitly.

**Existing native candidates to inspect first:** electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs

## CINEMATIC UI, WORKFLOWS & DOMAIN INTERACTION

C/D/E drive bay cards، capacity KPIs، animated proportional treemap drilldown breadcrumbs، largest-items pane، inspector، file-type tabs، bottom actions.

At all responsive desktop viewports preserve approved imagery, content hierarchy, dedicated domain inspector and visible bottom actions. Do not replace premium visual depth with simplistic wireframe widgets.

## SAFETY, PERMISSIONS & REAL EXECUTION

No cleanup from treemap directly; stage and redirect Cleanup/Studio; identify SSD/HDD before recommending defrag; safe report generation.

Separate read-only discovery, preview-only simulation, authorized operation and verified postcondition. Do not expose raw Windows commands in the renderer.

## OBSERVED VISUAL/CODE GAP TO FIX

Preserve colorful treemap/drives/inspector and stop viewport footer clipping.

The statement above comes from the provided screenshots or inspected source and is a target for verification, not an assertion that a patch has already passed.

## CODE FILES TO INSPECT FIRST (REUSE, DO NOT WIPE)

- `src/pages/StoragePage.tsx` — 838 lines; 6 state hooks; imported fixture signals: INITIAL_LARGEST_ITEMS, INITIAL_STORAGE_METRICS, INITIAL_TREEMAP_DATA, INITIAL_VOLUMES
- `src/lib/storage-inventory.ts` — 470 lines; 0 state hooks; imported fixture signals: INITIAL_LARGEST_ITEMS, INITIAL_STORAGE_METRICS, INITIAL_TREEMAP_DATA, INITIAL_VOLUMES

Also inspect src/App.tsx, src/context/NavigationContext.tsx and shared shell for integration; inspect existing tests and the actual root Electron/native contract code.

## SCREEN-SPECIFIC ACCEPTANCE

capacity sums consistent and no double counting; connected drives appear/disappear; treemap sums correspond to scan scope.

Verify each user interaction in a real rendered app, and for native operations in a correct Electron environment. Do not claim native completion from localhost Vite UI.

## CANONICAL SERVICE-BY-SERVICE IMPLEMENTATION (NO SERVICE MAY BE SKIPPED)

### 01. Volume Bays & Partition Manager — `storage-disks`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world storage, descriptor family Volume Bays; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Three-dimensional-feel C/D/E volume bays with proportional used/free meters. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select volume bay, Sync side inspector, Toggle scan scope, View partition map. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** FileSystem (NTFS/ReFS/FAT32), Total vs used vs free bytes, Volume serial & health, Drive role classification. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 02. Heavy-File Storage Ledger — `storage-large-files`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world storage, descriptor family Ledger+Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Ranked rows with comparative size bars and right folder inspector. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Size threshold filter, Volume selector, Sort size/type, Stage archive candidate. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Relative size footprint bar, File location path, Category classification, Reclaim safety rating. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 03. Byte-Exact Duplicate Hash Groups — `storage-duplicates`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world storage, descriptor family Candidate Safety Ledger; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Stacked identical-file groups with image/file comparison columns. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Expand hash group, Choose keep candidate, Filter duplicate type, Stage deduplication plan. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Identical SHA-256 confirmation, Total reclaimable bytes, Original vs duplicate paths, Safe deduplication review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 04. Interactive Storage Space Treemap — `storage-treemap`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world storage, descriptor family Zoomable Treemap; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Rich multi-color nested proportional rectangle map plus breadcrumbs. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Zoom into folder block, Hover block preview, Legend filter by type, Breadcrumb navigation. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Folder size & percentage of volume, Child items count, Unscanned area hatched style, Top heavy sub-folders. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 05. Folder Ranking Waterfall — `storage-top-folders`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world storage, descriptor family Ledger+Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Top-folders waterfall bars with folder hierarchy and path inspector. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select folder row, Change tree depth, Group by parent, Filter system folders. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Folder size contribution, File count inside, Measured/partial coverage badge, Path breadcrumbs. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 06. Storage Byte Distribution by Category — `storage-filetypes`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world storage, descriptor family Zoomable Treemap; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Donut + stacked horizontal byte distribution grouped by extension. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Click category segment, Toggle counts vs bytes, Filter extension list, Inspect category details. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Total GB per category, Percentage of drive, Logical vs allocated bytes, Associated file extensions. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 07. Drive Coverage & Scan Dashboard — `storage-scan-overview`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world storage, descriptor family Live Pulse Charts; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Source coverage rings, scan route and exclusions/permission heatmap. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Scope picker, Demo progress controls, Toggle system locations, Inspect scan errors. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Scanned vs unscanned ratio, Drive coverage percentage, Excluded system paths, Scan duration & status. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 08. Drive Optimization & TRIM Dossier — `storage-fragmentation`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world storage, descriptor family Safe Diagnostics Console; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Drive type/status panel and supported optimization-mode checklist. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select volume, View optimization instructions, Check SSD TRIM status, Review defrag advice. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Drive technology (NVMe/SSD/HDD), TRIM support status, Fragmentation level rating, Windows Defrag handoff. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 09. Disk Reliability & S.M.A.R.T. Health — `storage-smart`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world storage, descriptor family Device Atlas; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Physical-drive bay, sensor card grid, temperature and wear placeholders. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select physical drive, Switch sensor grid tab, Expand attribute matrix, Toggle temperature history. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Temperature reading & limit, Power-on hours & cycle count, Reallocated sectors count, Overall SMART health verdict. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 10. Storage Reclaim Planner & Basket — `storage-reclaim`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world storage, descriptor family Staging + Impact Review; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Overlapping category savings visual, candidate list and approval basket. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Choose eligible category classes, Inspect confidence rating, Select reclaim targets, Stage reclaim proposal. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Reclaimable space calculation, Risk-free vs notice breakdown, Conflict check status, Staged review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 11. Capacity Trend Timeline — `storage-history`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world storage, descriptor family Live Pulse Charts; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Timestamped volume size trend chart with drive selection. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Timeframe switcher (7d/30d/90d), Select drive volume, Compare historical points, Export trend CSV. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Growth rate per day, Projected full date estimate, Historical snapshot points, Data point provenance. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 12. Removable USB & External Volume Dock — `storage-removable`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world storage, descriptor family Volume Bays; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** USB/external volume cards with connection status and safe-eject readiness. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select USB device, Choose scan scope, Inspect mount properties, Prepare safe-eject draft. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Mount point & bus type, FileSystem & partition structure, Read/write speed benchmark, Safe eject readiness status. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation. First examine and REUSE electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.



## FULL UI ACTION / CONTROL AUDIT — EXACT SOURCE LOCATIONS

This is a static source index, NOT certified total runtime coverage. For EACH item listed below, read the JSX at the line, trace its click/change handler, state updates, relevant descriptor/engine, and record whether it is Working / Mock-only / No-op / Broken / Blocked / Implemented Verified. Inspect custom child components, dynamically generated controls, menu items and keyboard shortcuts as well.

Use a per-control verification table in your final handoff. Do not mark a button PASS because it has onClick or because it opens a modal; it must drive the correct native/preview action and display a genuine result.

- `pages/StoragePage.tsx:206` | OTHER_INTERACTIVE | onClick | <div                   key={vol.id}                   
- `pages/StoragePage.tsx:260` | button | onClick | [inspect source]
- `pages/StoragePage.tsx:275` | button | onClick | [inspect source]
- `pages/StoragePage.tsx:286` | button | onClick | [inspect source]
- `pages/StoragePage.tsx:309` | button | onClick | [inspect source]
- `pages/StoragePage.tsx:320` | button | onClick | [inspect source]
- `pages/StoragePage.tsx:330` | button | onClick | [inspect source]
- `pages/StoragePage.tsx:340` | button | onClick | [inspect source]
- `pages/StoragePage.tsx:350` | button | onClick | [inspect source]
- `pages/StoragePage.tsx:364` | button | title | Zoom in
- `pages/StoragePage.tsx:367` | button | title | Zoom out
- `pages/StoragePage.tsx:370` | button | title | Back
- `pages/StoragePage.tsx:373` | button | title | Forward
- `pages/StoragePage.tsx:376` | button | title | Parent folder
- `pages/StoragePage.tsx:394` | OTHER_INTERACTIVE | onClick | <div                       
- `pages/StoragePage.tsx:409` | OTHER_INTERACTIVE | onClick | <div                         
- `pages/StoragePage.tsx:429` | OTHER_INTERACTIVE | onClick | <div                         
- `pages/StoragePage.tsx:441` | OTHER_INTERACTIVE | onClick | <div                         
- `pages/StoragePage.tsx:450` | OTHER_INTERACTIVE | onClick | <div                         
- `pages/StoragePage.tsx:460` | OTHER_INTERACTIVE | onClick | <div                           
- `pages/StoragePage.tsx:467` | OTHER_INTERACTIVE | onClick | <div                           
- `pages/StoragePage.tsx:474` | OTHER_INTERACTIVE | onClick | <div                           
- `pages/StoragePage.tsx:515` | OTHER_INTERACTIVE | onClick | <tr                             key={item.id}                             className="
- `pages/StoragePage.tsx:708` | OTHER_INTERACTIVE | onClick | <div                   key={srv.id}                   
- `pages/StoragePage.tsx:746` | button | onClick | [inspect source]
- `pages/StoragePage.tsx:754` | button | onClick | [inspect source]
- `pages/StoragePage.tsx:762` | button | onClick | [inspect source]
- `pages/StoragePage.tsx:770` | button | onClick | [inspect source]
- `pages/StoragePage.tsx:778` | button | onClick | [inspect source]

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

D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\references\REF-04_Storage_Volume_Atlas.png

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
- src/components/storage/StorageWorkspaces.tsx

Trace runtime service dispatch from the selected tile to ServiceWorkspaceHost to the appropriate renderer family. For EACH generated control: trace actual current selection, config props, state updates, actual provider call, preview, permission gate, error and verification. A direct page control inventory alone is not complete. No all-service generic fake preview is acceptable.
