# Mission 15A — Every KNOuX Service Opens a Functional Interactive Workspace

## Canonical authority
Repository and ONLY workspace: D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer
Remote: https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer
Existing branches only: feat/gemini-missions -> main. Tasks: missions/.
Scope: all 14 domain missions; 181 advertised service entries and 150 existing registry/surface entries (these lists overlap, DO NOT invent 181 separate engines).
Read missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md, missions/15_REAL_SERVICE_ACTIVATION_MISSION.md, docs/SERVICE_CAPABILITY_MATRIX.md and docs/SERVICE_REGISTRY_EVIDENCE.md.
Sequencing: first preserve/finish any current in-flight Settings (14) and Home (01) work. Perform Mission 15A UX integration as the first prerequisite/stage of Mission 15 real-service activation. This mission is not accepted on UI-only mockups: the matching actual service activation remains required.

## Exact USER requirement: every service has its OWN control-rich tool screen
Every service tile, table row, search result and contextual recommendation opens an INTERACTIVE WORKBENCH with two presentation modes:
- PINNED RESIZABLE SIDE WORKBENCH occupying the right/trailing part of the application (RTL mirror or user-chosen side); leave the originating list/diagram visible and usable in the other pane. Not an obscuring transient tooltip/identical generic modal.
- EXPANDED/FULL WORKBENCH in the same Electron APP content window for complex instruments/editors (Studio organization board, Files inspector, bulk uninstall, Cleanup ledger, Repair console, SCM dependency graph, Automation flow canvas).
User can pick side/expanded, resize, pin/unpin, navigate among service tools, keep selections and filters, use all domain-relevant controls, see trustworthy results, execute only after specific approval and restore when supported. No second application window, repo, or workspace.

### Shared host but UNIQUE service-specific workbenches
One shared typed ServiceWorkbenchHost handles layout, docking, expand/reduce, responsive geometry, focus/keyboard/Escape, scroll clipping, close/back, selected service context, persisted panel preferences, source evidence, error boundary, permissions and receipts.
A typed registry maps original stable service IDs to their EXISTING or NEW dedicated React workbench + correct native provider. Reuse accepted specialized System (36), Repair (12), Services (12), Automation (12), Storage (12), Studio (9) and other existing panels where functional. DO NOT replace their specialized content with 150 repeated generic cards, empty sheets or fake 'Preview' toasts.
Per-service body MUST have:
1) identity/status/source timestamp + real selected resource context;
2) a meaningful list/tree/chart/timeline/canvas/preview suited to this service;
3) ACTUAL buttons specific to the service (search, scope, filter, select, options, inspect, export, analyze, prepare, execute, cancel, undo as relevant), not an identical row of inert controls;
4) contextual property/option inspector and freedom to choose source, destination, exclusions, sort, grouping, selection, rules and action risk policy as applicable;
5) real progress, cancellation, empty/denied/partial/offline/retry, verified outcome and receipts;
6) actual approve-to-apply for action services with immutable per-item preflight and real postcondition;
7) journal and truthful undo/restore for reversible actions; explicit irreversible warning where not possible.
Observational/diagnostic services may legitimately be fully read-only IF useful, accurate and provide real interaction. Do not add pointless Execute buttons to information-only functions.

### Responsive UX and visual quality gate
1920x1080: dock ~36-44% initial resizable ~32-60%; keep opposing context readable.
1672x941: dock ~38-48% initial; real data/results visible and footer safe.
1366x768: dock ~42-55% only while preserving >=450 px usable context; otherwise enter expanded inner workbench by default. No footer/header obscured or horizontal page overflow.
Expanded mode occupies APP content area under system titlebar and includes service-specific split panes/toolbars.
Use flex/grid min-width:0 and inner scrollers, avoid floating overlays covering critical controls.
Persist selected service, filters, scroll and operation draft when toggling modes; do not lose user work. All controls keyboard operable, focus return, Escape, ARIA, reduced motion. Native file paths/hashes/numbers stay LTR under Arabic RTL. Full EN/AR dark/light support at all 3 viewports; premium cohesive KNOuX design with purposeful domain-specific density.

## Per-section functional workstation specification (complete all advertised subservices)

### 01 Home — 12 primary commands
Contextual deep links from every card and insight to the actual selected tool/resource; open selected service dock/full, start a real scoped scan, select folder/app, review pending approvals, jobs/receipts, resume/cancel where supported, activity and settings. No fake KPI or click-only decorative card.

### 02 Smart Scan — 10 tools
Quick and Deep: real chosen folder/scope/exclusions, scan/cancel/progress, severity filters and results export. Duplicate: select pairs/keepers and hash evidence. Large Files: choose targets/action basket. Junk/Privacy: actual reviewed quarantine or clean handoff, no silent delete. Startup/App/System findings deep-link to owning native managers. Recommendations link specific verified evidence to safe preflight/approval; no invented risk/savings.

### 03 Organization Studio — 9 stages, HIGHEST PRIORITY
Source picker, live library categories/images/videos/documents, thumbnails, multi-select, rule builder (type/date/name/custom), categories/collections, destination picker, drag/drop plus keyboard equivalents, exclusions, conflict/collision strategy, immutable exact source->destination plan, user approval, ACTUAL file copy/move/rename on authorized targets, progress/cancel, hash/postcondition, persistent operation journal and REAL undo/restore on supported operations. Finish native execution on disposable files before saying Studio works.

### 04 Google Workspace — 10 scopes
Dedicated domain UIs, not one generic Google modal: Gmail search/3-pane/draft/send; Calendar day/week/events; Tasks list/kanban/calendar; Sheets grid/editor; Contacts record inspector; Drive picker; supported Slides/Forms/Chat/Classroom views/actions as allowed. Real OAuth PKCE, secure native token store, least privilege, revocation and API adapters are required for connected success. No simulated connected state. Do not connect owner's Google account without explicit authorization.

### 05 Applications — 12
Installed app register, signer/publisher/security/size and detail dock. Multi-select uninstall basket, official uninstall mechanism after approval, progress/status/reboot/verification; leftovers reviewed narrowly, WinGet updates/install queued/approved, file association changes via supported OS route. Uninstall is not falsely reversible. No real owner app uninstall during tests.

### 06 Files — 12
Everything-style performant filter/search, saved views, columns, metadata/hashes, select files, open/reveal, rename/move/copy/organize action basket, per-item destination/collision preview, user confirm, actual sandbox-tested operation and undo where feasible. One shared executor with Studio and Cleanup, not duplicated mutation engines.

### 07 Storage — 12
Measured volume and folder treemap zoom, filter/select largest/duplicate groups, choose keepers/exclusions, reclaim basket -> user-approved Cleanup/Files executor, measured bytes freed, receipts. SMART/defrag/TRIM clearly unavailable where unsupported; no invented functionality.

### 08 Cleanup — 12
Safety-tier candidate checklist, source/type filters, exclude items, quarantine or permanent-delete choice, exact before/after list and bytes, reviewed approval, real quarantine/restore journal with verified outcomes, optional scheduling via ACTUAL Automation engine, guarded OS servicing only.

### 09 Startup — 12
Measured autorun selected-item dock, dependencies/impact, enable/disable/delay, source-specific safe controls, multi-select batch review, user approval/UAC as needed, effective-state refresh and restore original state. Never let users accidentally disable critical startup services.

### 10 System — 36
Purposeful read-only instruments: live sampling/CPU/memory/disk/network charts, NIC/traceroute, events, service links, processes, signatures, HW graphs/export/filters. When hosts/proxy/network repair is advertised, attach a real approved typed action or honest explicit unavailable status and link to Repair/Services. Never fabricate sensor values.

### 11 Repair — 12
Guided measured diagnostic console with prerequisite checklist, exact fixed command preview, user-initiated repair with proper UAC and warnings where supported, live command transcript, after-state verification/reboot state, honest non-reversibility. No unattended DISM/SFC/Winsock execution on owner's Windows.

### 12 Services — 12
SCM register with persistent right inspector, dependency/danger map, meaningful selected-item controls, permitted start/stop/restart/startup type with exact consent, dependency preflight, verification, journal/undo where feasible; protect OS-critical services. Use fake SCM in automated effect tests.

### 13 Automation — 12
True expanded workflow editor with node palette, drag+keyboard links, zoom/pan, selected node inspector, typed triggers/actions, calendar/quiet/battery policies, queue schedule and durable actual executor, enable/pause/revoke, idempotent steps, crash recovery, receipt log and notifications. Dry-run is useful but not the only supported path. No default unattended destructive tasks.

### 14 Settings & AI — 8
Persistent settings and actual per-toggle outcomes, security/profile/backups import/export/diff/restore, secure tokens outside renderer, provider choice and connection test, working assistant after explicit credentials/network/billing consent, typed safe tools and cancel/failure UI. No secret logs/localStorage.

## Non-negotiable technical + security acceptance
- Fixed versioned allowlisted Electron IPC, sender/origin checks, sandbox/contextIsolation, validated inputs, bounded actions, no generic shell or raw IPC.
- For actual changes: select -> real measure -> immutable per-item plan bound to fingerprint/scope -> explicit in-app consent -> native EXECUTE -> per-item progress/verification -> durable receipt -> real Undo where possible. Refuse symlink/junction escapes, protected OS data, stale plans, modified resources, collisions, unwanted elevation, account/payments.
- Implement and test real effects ONLY on disposable owned fixtures, isolated mock SCM, mocked OAuth and controlled VM. Do not mutate the owner's real files/registry/apps/services/startup or connect a real account without explicit separate runtime approval.
- Never count read-only or dry-run as an action-complete service. No false totals or fake disabled controls.

## Deliverables / UI acceptance
Create docs/SERVICE_WORKBENCH_ACCEPTANCE.md with ALL 181 advertised entries mapped to 150 registry/surface records or explicitly justified aggregation: route, serviceId, dedicated renderer, side/expanded behaviors, actual tools/buttons, native reads/actions, consent, effect test, before/after/undo evidence, limitations.
Implement the host, dedicated workbenches, current-service context/pane mode persistence and actual live control hookups. Per service test open -> select/options -> dock/expand -> keyboard/RTL -> real provider -> native effect fixture if actionable -> verified receipt/undo. Cross-check 1366/1672/1920, dark/light, EN/AR, packaged Electron runtime and regressions. No generic modal fallback pretending to be tool.

Sequence: preserve current 14/01 changes if any; deliver reusable host on Studio/Files first; upgrade every domain iteratively while implementing Mission 15 real executors; verify/commit/push/CI/merge coherent scopes into EXISTING repo only. Update canonical missions ledger after each verified batch.
No new branches, worktrees, repositories, clones, project backups, external task/evidence folders, old Root CI. Only existing canonical folder, feature branch, normal push and permitted fast-forward into main after actual CI green.
