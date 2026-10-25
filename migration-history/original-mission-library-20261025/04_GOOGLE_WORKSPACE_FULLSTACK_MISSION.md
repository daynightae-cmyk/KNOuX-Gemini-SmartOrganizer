# KNOuX 04 — GOOGLE WORKSPACE COMMAND HUB — FULL-STACK EXECUTION MISSION

**Standalone task file. Mission prepared:** 2026-10-25T08:15:31.272390+00:00. **Read-only source snapshot SHA:** c0bf2ee6066faabaf3d683f57ad3c11cb212bec2. Recheck every assumption at execution time.

**Source audit scope:** 1 code files, 19 static UI controls/handlers, 0 canonical registry services. Worlds: No 132-service world assigned directly. This section has its own custom subfeatures; see the operations list..

# NON-NEGOTIABLE EXECUTION MISSION

You are a senior full-stack Windows desktop product engineer, native integration architect, security reviewer, and visual designer. IMPLEMENT the current section end-to-end in the EXISTING KNOuX Gemini application; no planning-only output.

THIS IS A FUTURE PER-SECTION IMPLEMENTATION MISSION. Your first action when this file is handed to you is to INSPECT THE CURRENT REAL BRANCH/HEAD, ACTIVE AGENTS AND CODE; the snapshot attached to these missions was gathered on 2026-10-25 and may be stale.

Worktree (actual): D:\KNOUX-Workspace\KNOuX-Gemini-UI
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

مركز إنتاجية متصل بGoogle فعليًا: 10 تجارب رئيسية بواجهة KNOuX مشتركة، لا زر alert عام، مع عمليات موافق عليها وصلاحيات scopes دقيقة.


## SPECIFIC DATA CONTRACTS & PROVENANCE

OAuthConnection {accountId,scopes,expiresAt,status}, PaginatedResource, SyncCursor, ProviderRateLimit, SheetRange, GmailThread, TaskItem, FormSummary, ContactCard, CalendarEvent, PickerSelection, SlideDeck, ChatSpace, ClassroomCourse.

Required actual data interface should expose typed pagination/streaming where warranted, durable identity, permissions, provenance, error codes, capability detection and safe caching. Do not invent numbers.

## BACKEND REUSE, WINDOWS AND PROVIDER IMPLEMENTATION

Google OAuth2 PKCE desktop/browser supported flow وتخزين credential عبر OS secure storage، consent per scope، REST API adapters مع pagination, exponential backoff, quota/revocation and delta where supported؛ server secrets never embedded in Vite browser bundle.

**Existing native candidates to inspect first:** electron/main.cjs, electron/preload.cjs, shared/contracts.ts plus domain-specific existing modules.

## CINEMATIC UI, WORKFLOWS & DOMAIN INTERACTION

service rail 10 tabs، connection overview، sheets grid + row edits، Gmail three-pane thread/compose، Tasks kanban+agenda، Calendar day/week، Forms response preview، Contacts directory+dedupe، Slides thumbnails، Chat threads، Classroom assignments، Picker secure native provider file chooser.

At all responsive desktop viewports preserve approved imagery, content hierarchy, dedicated domain inspector and visible bottom actions. Do not replace premium visual depth with simplistic wireframe widgets.

## SAFETY, PERMISSIONS & REAL EXECUTION

لا تعلن Google OAuth Connected إلا من verified token+account query؛ لا تستعمل alert('Successfully executed') أو local fake success؛ least privilege، read-only default، destructive actions double review.

Separate read-only discovery, preview-only simulation, authorized operation and verified postcondition. Do not expose raw Windows commands in the renderer.

## OBSERVED VISUAL/CODE GAP TO FIX

Current Google OAuth indicator initializes connected=true and handleAction shows a fake success alert. These are observed code issues, not verified integrations.

The statement above comes from the provided screenshots or inspected source and is a target for verification, not an assertion that a patch has already passed.

## CODE FILES TO INSPECT FIRST (REUSE, DO NOT WIPE)

- `src/components/workspace/GoogleWorkspaceHub.tsx` — 558 lines; 15 state hooks; imported fixture signals: none detected

Also inspect src/App.tsx, src/context/NavigationContext.tsx and shared shell for integration; inspect existing tests and the actual root Electron/native contract code.

## SCREEN-SPECIFIC ACCEPTANCE

connected/disconnected/expired/revoked scopes, 401/403/429, empty paging, no message mutation without approval.

Verify each user interaction in a real rendered app, and for native operations in a correct Electron environment. Do not claim native completion from localhost Vite UI.

Per-product backend specifics: Sheets list/get batchUpdate with user-selected ranges and revision checks; Gmail list/get thread and composed draft with explicit send gate; Tasks list/tasks patch with dedupe; Forms retrieve and response view where supported; Contacts People API and safe duplicate review; Calendar events with timezone/DST/attendee confirmation; Picker OAuth-scope-limited selection; Slides list/slides preview and controlled modification; Chat spaces/messages only with domain authorization; Classroom courses/coursework with school permissions. Google Drive/Docs are not primary tabs in the inspected source—do not claim they exist; add only if product scope/approved UI requires. Verify current scopes/API terms before integration.

## SCREEN-SPECIFIC OPERATIONS, SUBWORKSPACES & BACKEND

Every item here is mandatory within the scope of this section. If the code already implements it, verify and extend instead of duplicating it.

### 01. Google Sheets
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 02. Gmail
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 03. Google Tasks
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 04. Google Forms
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 05. Google Contacts
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 06. Google Calendar
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 07. Google Picker
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 08. Google Slides
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 09. Google Chat
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.

### 10. Google Classroom
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.


## FULL UI ACTION / CONTROL AUDIT — EXACT SOURCE LOCATIONS

This is a static source index, NOT certified total runtime coverage. For EACH item listed below, read the JSX at the line, trace its click/change handler, state updates, relevant descriptor/engine, and record whether it is Working / Mock-only / No-op / Broken / Blocked / Implemented Verified. Inspect custom child components, dynamically generated controls, menu items and keyboard shortcuts as well.

Use a per-control verification table in your final handoff. Do not mark a button PASS because it has onClick or because it opens a modal; it must drive the correct native/preview action and display a genuine result.

- `components/workspace/GoogleWorkspaceHub.tsx:175` | button | onClick | [inspect source]
- `components/workspace/GoogleWorkspaceHub.tsx:207` | button | onClick | [inspect source]
- `components/workspace/GoogleWorkspaceHub.tsx:234` | button | onClick | [inspect source]
- `components/workspace/GoogleWorkspaceHub.tsx:249` | button | onClick | [inspect source]
- `components/workspace/GoogleWorkspaceHub.tsx:266` | button | onClick | [inspect source]
- `components/workspace/GoogleWorkspaceHub.tsx:296` | button | onClick | [inspect source]
- `components/workspace/GoogleWorkspaceHub.tsx:308` | input | NO_DIRECT_EVENT_IN_OPENING_TAG | [inspect source]
- `components/workspace/GoogleWorkspaceHub.tsx:326` | button | onClick | New Survey Form
- `components/workspace/GoogleWorkspaceHub.tsx:337` | button | onClick | View Form
- `components/workspace/GoogleWorkspaceHub.tsx:354` | button | onClick | Sync Address Book
- `components/workspace/GoogleWorkspaceHub.tsx:379` | button | onClick | Schedule Event
- `components/workspace/GoogleWorkspaceHub.tsx:404` | button | onClick | Launch Google Drive Picker
- `components/workspace/GoogleWorkspaceHub.tsx:422` | button | onClick | New Presentation Deck
- `components/workspace/GoogleWorkspaceHub.tsx:433` | button | onClick | Open Slides
- `components/workspace/GoogleWorkspaceHub.tsx:450` | button | onClick | Send Chat Notification
- `components/workspace/GoogleWorkspaceHub.tsx:475` | button | onClick | Sync Courses & Submissions
- `components/workspace/GoogleWorkspaceHub.tsx:508` | button | onClick | [inspect source]
- `components/workspace/GoogleWorkspaceHub.tsx:529` | button | onClick | [inspect source]
- `components/workspace/GoogleWorkspaceHub.tsx:544` | button | onClick | [inspect source]

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

No matching named standalone reference image for this section was found in D:\KNOUX-Workspace\references during this audit. Preserve approved imagery already in source; if the user supplies a reference with the mission, compare to it. Do not invent a file path or claim exact reference parity absent a supplied image.
