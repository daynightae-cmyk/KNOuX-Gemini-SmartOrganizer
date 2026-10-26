# KNOuX 06 — INSTANT FIND FILES EXPLORER — FULL-STACK EXECUTION MISSION

**Standalone task file. Mission prepared:** 2026-10-25T08:15:31.302765+00:00. **Read-only source snapshot SHA:** c0bf2ee6066faabaf3d683f57ad3c11cb212bec2. Recheck every assumption at execution time.

**Source audit scope:** 3 code files, 25 static UI controls/handlers, 12 canonical registry services. Worlds: files (12 descriptors).

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

محرك بحث محلي فائق السرعة يستلهم Everything في أداء الفهرسة والنتائج، لا شكله، مع معاينات rich وعقود أمان كاملة.


## SPECIFIC DATA CONTRACTS & PROVENANCE

IndexLocation, IndexedFile {fileId,parentId,path,type,size,mtime,attributes,origin}, SearchQuery, SearchResultPage, IndexChange, FilePreview, HashJob, SourcePermission.

Required actual data interface should expose typed pagination/streaming where warranted, durable identity, permissions, provenance, error codes, capability detection and safe caching. Do not invent numbers.

## BACKEND REUSE, WINDOWS AND PROVIDER IMPLEMENTATION

Persistent incremental local index / safe watcher, optional USN journal only if supported, cross-volume and network fallback; no blocking full disk traversal for each keystroke؛ path normalization and Windows Unicode long paths; thumbnails separate sandbox bounded.

**Existing native candidates to inspect first:** electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs

## CINEMATIC UI, WORKFLOWS & DOMAIN INTERACTION

Instant Find large search، filter chips، two distribution bands، virtualized ledger، icon/thumbnail table، contextual inspector preview، metadata inspector، sticky selection bar.

At all responsive desktop viewports preserve approved imagery, content hierarchy, dedicated domain inspector and visible bottom actions. Do not replace premium visual depth with simplistic wireframe widgets.

## SAFETY, PERMISSIONS & REAL EXECUTION

Open/Reveal only validated existing path; hash streamed read-only; only plan mutations through Studio; no exposing sensitive paths to cloud.

Separate read-only discovery, preview-only simulation, authorized operation and verified postcondition. Do not expose raw Windows commands in the renderer.

## OBSERVED VISUAL/CODE GAP TO FIX

Floating assistant can cover Add to Organization Plan / bottom inspector controls. Actual file counts are fixture values.

The statement above comes from the provided screenshots or inspected source and is a target for verification, not an assertion that a patch has already passed.

## CODE FILES TO INSPECT FIRST (REUSE, DO NOT WIPE)

- `src/pages/FilesPage.tsx` — 784 lines; 10 state hooks; imported fixture signals: none detected
- `src/lib/file-inventory.ts` — 374 lines; 0 state hooks; imported fixture signals: none detected
- `src/components/files/FileIcon.tsx` — 116 lines; 0 state hooks; imported fixture signals: none detected

Also inspect src/App.tsx, src/context/NavigationContext.tsx and shared shell for integration; inspect existing tests and the actual root Electron/native contract code.

## SCREEN-SPECIFIC ACCEPTANCE

100K+ synthetic index responsiveness measured; index freshness and provider errors; 1366 viewport inspector visible.

Verify each user interaction in a real rendered app, and for native operations in a correct Electron environment. Do not claim native completion from localhost Vite UI.

## CANONICAL SERVICE-BY-SERVICE IMPLEMENTATION (NO SERVICE MAY BE SKIPPED)

### 01. Downloads Folder Inventory — `file-downloads-inventory`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world files, descriptor family File Ledger+Preview; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Native-icon/thumbnail rows with file-type facets, breadcrumb and selected item preview. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Search file name, Filter file type, Sort date/size, Grid/List view toggle. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** File metadata & SHA-256, Zone Identifier / MotW origin, Age classification, Staged action preview. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash. First examine and REUSE electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 02. Visual Rule Builder & Organization Studio — `file-organize-preview`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world files, descriptor family Visual Rule Builder; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Source folders -> colored category lanes -> proposed destinations. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Drag rule priority, Select category lane, Edit pattern rule, Resolve naming conflicts. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Source folder scope, Rule execution summary, Conflict resolution plan, Draft proposal map. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash. First examine and REUSE electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 03. Organization Staging & Change Review — `file-organize-apply`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world files, descriptor family Staging + Impact Review; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Before/after path comparison with per-file verdict and approval stages. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Checkbox selection, Filter destination conflict, Acknowledge risk warning, Stage batch plan. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Before/after path diff, File collision status, Undo journal eligibility, Execution review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash. First examine and REUSE electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 04. File Organization Undo Timeline — `file-organize-undo`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world files, descriptor family Repair Journal; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Recorded journal cards and before/after restoration paths. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select journal entry, Inspect target collisions, Choose restore subset, Filter by date. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Journal transaction ID, Original vs current path diff, File integrity check, Restoration review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash. First examine and REUSE electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 05. Sparse Empty Folder Explorer — `file-empty-folders`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world files, descriptor family Ledger+Dossier; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Sparse folder hierarchy with empty-state markers and path crumbs. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Expand folder tree, Select source drive/path, Sort age/depth, Stage empty folder purge. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Path depth & modification date, Folder tree parent node, Contains hidden files check, Staged removal review. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash. First examine and REUSE electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 06. Cryptographic Hash Inspector — `file-hash`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world files, descriptor family Identity Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Selected-file identity header and SHA256/SHA512 digest panels. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Choose hash algorithm, Enter expected digest, Copy displayed hash, Compare digests. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** SHA-256 digest, SHA-512 digest, MD5 legacy digest, Hash match verification verdict. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash. First examine and REUSE electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 07. Instant Everything-Style File Search — `file-search`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world files, descriptor family Search Console; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Everything-inspired search bar, multi-source filter row and dense result ledger. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Query chips, Date/size/type filters, Keyboard selection, Grid/list toggle. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Indexed vs scanned sources, Match score & path, File attributes, Quick open/reveal preview. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash. First examine and REUSE electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 08. File Format Type Distribution — `file-type-map`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world files, descriptor family Zoomable Treemap; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Interactive stacked bar/donut with per-type icon legend and drill-down table. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Click segment to filter, Toggle count vs bytes, Select file category, Sort extensions. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Total files count, Aggregate bytes per category, Unknown extensions list, Top extensions ranking. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash. First examine and REUSE electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 09. Recent File Timeline Histogram — `file-recents`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world files, descriptor family File Ledger+Preview; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Dated histogram and recent-file ledger with source column. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Date brush range, Type/location filter, Sort mtime/ctime, Select file row. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Modification vs Creation time, Access provenance, Associated application, File preview card. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash. First examine and REUSE electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 10. Ranked Large File Explorer — `file-largest`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world files, descriptor family Ledger+Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Top-file bars, size-ranked list and folder breadcrumbs. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Size threshold slider, Source volume filter, Sort descending/ascending, Stage move/archive. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** File size & percentage of drive, Parent folder location, File age & last access, Safety classification. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash. First examine and REUSE electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 11. Deep File Metadata & Attributes Dossier — `file-metadata`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world files, descriptor family Identity Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Two-column metadata inspector with origin/attributes/timestamp badges. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Switch metadata tabs, Copy field values, Toggle hidden/system attributes, Inspect streams. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** NTFS file attributes (R/A/S/H), Alternate Data Streams (ADS), EXIF/Media headers, Security permissions. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash. First examine and REUSE electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 12. Trust Evidence & Provenance Board — `file-provenance`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world files, descriptor family Identity Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Origin timeline, Zone/MotW, signature, hash, source card. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Switch observed vs inferred, Select file target, Verify web origin, Inspect MotW zone. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Zone Identifier (Internet/Intranet/Local), Origin URL trace, Digital signature status, Trust rating score. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash. First examine and REUSE electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.



## FULL UI ACTION / CONTROL AUDIT — EXACT SOURCE LOCATIONS

This is a static source index, NOT certified total runtime coverage. For EACH item listed below, read the JSX at the line, trace its click/change handler, state updates, relevant descriptor/engine, and record whether it is Working / Mock-only / No-op / Broken / Blocked / Implemented Verified. Inspect custom child components, dynamically generated controls, menu items and keyboard shortcuts as well.

Use a per-control verification table in your final handoff. Do not mark a button PASS because it has onClick or because it opens a modal; it must drive the correct native/preview action and display a genuine result.

- `pages/FilesPage.tsx:225` | input | onChange | [inspect source]
- `pages/FilesPage.tsx:269` | button | onClick | [inspect source]
- `pages/FilesPage.tsx:294` | select | onChange | [inspect source]
- `pages/FilesPage.tsx:309` | select | onChange | [inspect source]
- `pages/FilesPage.tsx:324` | select | NO_DIRECT_EVENT_IN_OPENING_TAG | Date Modified: Any time
- `pages/FilesPage.tsx:335` | select | NO_DIRECT_EVENT_IN_OPENING_TAG | Location: All locations
- `pages/FilesPage.tsx:348` | select | onChange | [inspect source]
- `pages/FilesPage.tsx:361` | button | onClick | [inspect source]
- `pages/FilesPage.tsx:369` | button | onClick | [inspect source]
- `pages/FilesPage.tsx:449` | OTHER_INTERACTIVE | onClick | <div                     
- `pages/FilesPage.tsx:478` | OTHER_INTERACTIVE | onClick | <div                       key={file.id}                       
- `pages/FilesPage.tsx:488` | OTHER_INTERACTIVE | onClick | <div                         className="w-8 shrink-0 flex items-center"              
- `pages/FilesPage.tsx:548` | OTHER_INTERACTIVE | onClick | <div                         className="w-10 flex items-center justify-center text-sl
- `pages/FilesPage.tsx:574` | button | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `pages/FilesPage.tsx:575` | button | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `pages/FilesPage.tsx:576` | button | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `pages/FilesPage.tsx:638` | button | onClick | [inspect source]
- `pages/FilesPage.tsx:646` | button | onClick | [inspect source]
- `pages/FilesPage.tsx:656` | button | onClick | [inspect source]
- `pages/FilesPage.tsx:664` | button | onClick | [inspect source]
- `pages/FilesPage.tsx:674` | button | onClick | [inspect source]
- `pages/FilesPage.tsx:705` | OTHER_INTERACTIVE | onClick | <div                   
- `pages/FilesPage.tsx:728` | button | onClick | [inspect source]
- `pages/FilesPage.tsx:750` | OTHER_INTERACTIVE | onClick | <div                 
- `pages/FilesPage.tsx:768` | button | onClick | [inspect source]

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

D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\references\REF-03_Files_Instant_Find.png

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
- src/components/files/FileWorkspaces.tsx

Trace runtime service dispatch from the selected tile to ServiceWorkspaceHost to the appropriate renderer family. For EACH generated control: trace actual current selection, config props, state updates, actual provider call, preview, permission gate, error and verification. A direct page control inventory alone is not complete. No all-service generic fake preview is acceptable.


---

## REAL USER SERVICE ACTIVATION — POST-READ-ONLY PRODUCT ACCEPTANCE

This addendum implements the user's requirement that KNOuX must deliver REAL consumer actions, not only passive reading and dry-runs. Read and obey missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md BEFORE assessing this section. Treat earlier read-only/preview success as a valid engineering checkpoint but NOT automatic final functionality acceptance.

### Specific outcomes to implement and prove

- Files must deliver fast authorized search/filter/metadata plus the actual core user promise: selected file/folder rename/move/copy/organization, collision resolution, staging preview, verification, durable journal and reversible Undo where feasible.
- Use one shared File/Studio action executor rather than duplicate engines. Respect reparse points, locks, size/quota, hash/integrity, path traversal and postcondition; open/reveal must resolve validated original file.
- Everything-style responsiveness should be measured on real scoped indexes; an in-memory 100K synthetic benchmark does NOT prove persistent whole-disk indexing.
- Tests: selected disposable files, action confirmation denied/approved, actual changed files, safe undo and collision/locked/offline failures.

### Product acceptance

Enumerate EVERY existing service ID in this mission. Assign appropriate A observational / B reversible / C destructive-privileged / D connected category. Include each service in the central capability matrix, with actual native/API implementation, UI action, scoped consent gate, controlled fixture effect test, after-state verification, journal/undo if feasible, and honest limitations. A passive service may be complete with live useful measurements; an action-promising service requires a real safe executor behind user approval. Do NOT perform effectful tests on real user resources, account, registry or Windows. Do not mark whole-section PRODUCTION COMPLETE until core actions are implemented/tested and supported integrations have their external/manual gates documented.

Follow the existing SINGLE canonical repo/branch and real CI policy; no worktrees, extra project directories, fake results or Root CI. If currently working on another mission, preserve it and enter this section during the ordered activation pass, not by overwriting the agent's uncommitted changes.


## Mandatory interactive workbench & real controls — Mission 15A

When user opens ANY advertised service, show its unique control-rich tool workbench in a pinned resizable side panel OR an expanded full in-app workspace, with working dock/expand/collapse and persistent resource/filter/selection state. Use one accessible shared shell but domain-specific body and real native/API handlers; no generic repeated modal or cosmetic buttons.

Files: 12 specialist search/metadata/organize surfaces; selected-file side inspector and expanded list; batch rename/move/copy with safe review/verified undo.

Every relevant control must select/inspect/filter/configure a real outcome, or expose clearly why unsupported. For a mutation, require per-item measured preview, exact per-action user consent, fixed validated executor, controlled-disposable-fixture effect test, after-state receipt and real restore if feasible. Do not run risky OS/file/cloud operations on owner's data during agent testing.

Verify EN+AR RTL, dark+light, 1366/1672/1920, keyboard/focus, dock<->expanded continuity, no header/footer obstruction; update docs/SERVICE_WORKBENCH_ACCEPTANCE.md and the capability matrix for each original service ID. Mission reference: missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md. This UX gate is not alone proof the action service is product-complete.
