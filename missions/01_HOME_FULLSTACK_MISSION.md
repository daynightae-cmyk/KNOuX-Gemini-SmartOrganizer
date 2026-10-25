# KNOuX 01 — HOME COMMAND CENTER — FULL-STACK EXECUTION MISSION

**Standalone task file. Mission prepared:** 2026-10-25T08:15:31.216135+00:00. **Read-only source snapshot SHA:** c0bf2ee6066faabaf3d683f57ad3c11cb212bec2. Recheck every assumption at execution time.

**Source audit scope:** 5 code files, 69 static UI controls/handlers, 0 canonical registry services. Worlds: No 132-service world assigned directly. This section has its own custom subfeatures; see the operations list..

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

حوّل Home إلى غرفة قيادة حقيقية تجمع الحالة المثبتة من الأقسام بدل أرقام دعائية، مع الحفاظ على الكوكب والسينما البصرية والبطاقات الثماني والرسوم.


## SPECIFIC DATA CONTRACTS & PROVENANCE

DeviceHealthMetric, IndexedFileCount, CandidateRecoveryEstimate, AutomationRunSummary, InstalledApplicationCount, WindowsServiceHealth, RecentVerifiedActivity, PendingSafeAction, QuickAccessItem؛ المصدر والطابع الزمني والدقة لكل قيمة؛ لا تحسب Health Score بدون معادلة معلنة.

Required actual data interface should expose typed pagination/streaming where warranted, durable identity, permissions, provenance, error codes, capability detection and safe caching. Do not invent numbers.

## BACKEND REUSE, WINDOWS AND PROVIDER IMPLEMENTATION

Aggregator read-only من providers الموجودة Windows, Files, Studio, Applications, Services, Automation, Storage؛ استعلامات متوازية bounded مع cache invalidation، partial-failure، snapshot consistency، never block home on one provider.

**Existing native candidates to inspect first:** electron/main.cjs, electron/preload.cjs, shared/contracts.ts plus domain-specific existing modules.

## CINEMATIC UI, WORKFLOWS & DOMAIN INTERACTION

Earth horizon hero أصلي، ستة KPIs مع trend/last collected، 8 rich command tiles، Insight مشروط بالأدلة، panels recent/quick access/storage، and right-side action review؛ صفر active statuses ملفقة.

At all responsive desktop viewports preserve approved imagery, content hierarchy, dedicated domain inspector and visible bottom actions. Do not replace premium visual depth with simplistic wireframe widgets.

## SAFETY, PERMISSIONS & REAL EXECUTION

كل Pending Safe Action يفتح Stage/Preview في القسم المختص؛ لا تنفيذ ضار من Home مباشرة.

Separate read-only discovery, preview-only simulation, authorized operation and verified postcondition. Do not expose raw Windows commands in the renderer.

## OBSERVED VISUAL/CODE GAP TO FIX

Home planetary hero and service imagery have lost cinematic depth; pending actions can fall below the viewport.

The statement above comes from the provided screenshots or inspected source and is a target for verification, not an assertion that a patch has already passed.

## CODE FILES TO INSPECT FIRST (REUSE, DO NOT WIPE)

- `src/pages/HomePage.tsx` — 344 lines; 6 state hooks; imported fixture signals: none detected
- `src/components/home/HomeCommandCenter.tsx` — 504 lines; 4 state hooks; imported fixture signals: INITIAL_DECK_TILES, INITIAL_KPIS
- `src/components/home/HomeDashboardPanels.tsx` — 1103 lines; 14 state hooks; imported fixture signals: INITIAL_ACTIVITIES, INITIAL_INSIGHT, INITIAL_QUICK_ACCESS, INITIAL_SAFE_ACTIONS, INITIAL_STORAGE_VOLUMES
- `src/components/home/EarthHorizonScene.tsx` — 300 lines; 0 state hooks; imported fixture signals: none detected
- `src/lib/home-ui.ts` — 561 lines; 0 state hooks; imported fixture signals: INITIAL_ACTIVITIES, INITIAL_DECK_TILES, INITIAL_INSIGHT, INITIAL_KPIS, INITIAL_QUICK_ACCESS

Also inspect src/App.tsx, src/context/NavigationContext.tsx and shared shell for integration; inspect existing tests and the actual root Electron/native contract code.

## SCREEN-SPECIFIC ACCEPTANCE

كل Tile وKPI يوجّه صح؛ التلخيصات تتطابق مع مصادرها؛ تمثيل unavailable بدون رقم مختلق.

Verify each user interaction in a real rendered app, and for native operations in a correct Electron environment. Do not claim native completion from localhost Vite UI.

Every Home tile and KPI is a cross-section deep link and real provider aggregator. Never show a green 'completed scan' on a fixture activity feed. Pending actions must be stageable, reviewable and routed to their owning service; Home itself must not execute dangerous operations.

## SCREEN-SPECIFIC OPERATIONS, SUBWORKSPACES & BACKEND

Every item here is mandatory within the scope of this section. If the code already implements it, verify and extend instead of duplicating it.

### 01. Smart Scan
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 02. Organize Files
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 03. Applications
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 04. Storage
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 05. Cleanup
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 06. Startup Control
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 07. System Live Pulse
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 08. Repair Lab
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 09. Global Search
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 10. KNOuX Insight
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 11. Recent Activity
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 12. Pending Safe Actions
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.


## FULL UI ACTION / CONTROL AUDIT — EXACT SOURCE LOCATIONS

This is a static source index, NOT certified total runtime coverage. For EACH item listed below, read the JSX at the line, trace its click/change handler, state updates, relevant descriptor/engine, and record whether it is Working / Mock-only / No-op / Broken / Blocked / Implemented Verified. Inspect custom child components, dynamically generated controls, menu items and keyboard shortcuts as well.

Use a per-control verification table in your final handoff. Do not mark a button PASS because it has onClick or because it opens a modal; it must drive the correct native/preview action and display a genuine result.

- `components/home/HomeCommandCenter.tsx:217` | button | onClick | [inspect source]
- `components/home/HomeCommandCenter.tsx:249` | OTHER_INTERACTIVE | onClick | <div                   key={tile.id}                   
- `components/home/HomeCommandCenter.tsx:282` | OTHER_INTERACTIVE | onClick | <div className="knx-modal-backdrop" 
- `components/home/HomeCommandCenter.tsx:285` | OTHER_INTERACTIVE | onClick | <div             className="knx-modal-card max-w-md"             
- `components/home/HomeCommandCenter.tsx:296` | button | onClick | [inspect source]
- `components/home/HomeCommandCenter.tsx:319` | OTHER_INTERACTIVE | onClick | 
- `components/home/HomeCommandCenter.tsx:333` | button | onClick | [inspect source]
- `components/home/HomeCommandCenter.tsx:340` | button | onClick | [inspect source]
- `components/home/HomeCommandCenter.tsx:404` | OTHER_INTERACTIVE | onClick | <div           
- `components/home/HomeCommandCenter.tsx:408` | input | onChange | [inspect source]
- `components/home/HomeCommandCenter.tsx:432` | OTHER_INTERACTIVE | onClick | <div               key={kpi.id}               
- `components/home/HomeDashboardPanels.tsx:232` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:242` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:252` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:262` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:280` | OTHER_INTERACTIVE | onClick | <div                 className="flex flex-col items-center justify-center shrink-0 cu
- `components/home/HomeDashboardPanels.tsx:444` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:457` | OTHER_INTERACTIVE | onClick | <div                   
- `components/home/HomeDashboardPanels.tsx:491` | OTHER_INTERACTIVE | onClick | <div                   
- `components/home/HomeDashboardPanels.tsx:513` | OTHER_INTERACTIVE | onClick | <div                   
- `components/home/HomeDashboardPanels.tsx:546` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:559` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:569` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:579` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:591` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:605` | OTHER_INTERACTIVE | onClick | <div                   key={file.id}                   
- `components/home/HomeDashboardPanels.tsx:626` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:661` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:689` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:696` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:718` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:732` | OTHER_INTERACTIVE | onClick | <div                 key={act.id}                 
- `components/home/HomeDashboardPanels.tsx:739` | OTHER_INTERACTIVE | onClick | <div                     
- `components/home/HomeDashboardPanels.tsx:789` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:818` | input | onChange | [inspect source]
- `components/home/HomeDashboardPanels.tsx:837` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:843` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:858` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:874` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:898` | OTHER_INTERACTIVE | onClick | <div className="knx-modal-backdrop" 
- `components/home/HomeDashboardPanels.tsx:901` | OTHER_INTERACTIVE | onClick | <div             className="knx-modal-card max-w-md"             
- `components/home/HomeDashboardPanels.tsx:912` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:949` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:955` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:971` | OTHER_INTERACTIVE | onClick | <div className="knx-modal-backdrop" 
- `components/home/HomeDashboardPanels.tsx:974` | OTHER_INTERACTIVE | onClick | <div             className="knx-modal-card max-w-md"             
- `components/home/HomeDashboardPanels.tsx:985` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:1002` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:1008` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:1026` | OTHER_INTERACTIVE | onClick | <div className="knx-modal-backdrop" 
- `components/home/HomeDashboardPanels.tsx:1029` | OTHER_INTERACTIVE | onClick | <div             className="knx-modal-card max-w-md"             
- `components/home/HomeDashboardPanels.tsx:1040` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:1080` | button | onClick | [inspect source]
- `components/home/HomeDashboardPanels.tsx:1086` | button | onClick | [inspect source]
- `pages/HomePage.tsx:153` | OTHER_INTERACTIVE | onClick | <div className="knx-modal-backdrop" 
- `pages/HomePage.tsx:156` | OTHER_INTERACTIVE | onClick | <div             className="knx-modal-card max-w-lg"             
- `pages/HomePage.tsx:162` | input | onChange | [inspect source]
- `pages/HomePage.tsx:174` | button | onClick | [inspect source]
- `pages/HomePage.tsx:191` | OTHER_INTERACTIVE | onClick | <div                     key={sec.id}                     
- `pages/HomePage.tsx:214` | OTHER_INTERACTIVE | onClick | <div className="knx-modal-backdrop" 
- `pages/HomePage.tsx:217` | OTHER_INTERACTIVE | onClick | <div             className="knx-modal-card max-w-md"             
- `pages/HomePage.tsx:228` | button | onClick | [inspect source]
- `pages/HomePage.tsx:242` | button | onClick | [inspect source]
- `pages/HomePage.tsx:252` | button | onClick | [inspect source]
- `pages/HomePage.tsx:270` | button | onClick | [inspect source]
- `pages/HomePage.tsx:280` | button | onClick | [inspect source]
- `pages/HomePage.tsx:295` | button | onClick | [inspect source]
- `pages/HomePage.tsx:310` | OTHER_INTERACTIVE | onClick | <div           className="fixed top-12 right-12 z-50 w-80 bg-[#081224] border border-
- `pages/HomePage.tsx:319` | button | onClick | [inspect source]

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


## ORIGINAL VISUAL ASSET AVAILABILITY

No matching named standalone reference image for this section was found in D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\references during this audit. Preserve approved imagery already in source; if the user supplies a reference with the mission, compare to it. Do not invent a file path or claim exact reference parity absent a supplied image.
