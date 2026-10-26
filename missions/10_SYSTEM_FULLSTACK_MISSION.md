# KNOuX 10 — LIVE PULSE + NETWORK & HARDWARE DIAGNOSTICS — FULL-STACK EXECUTION MISSION

**Standalone task file. Mission prepared:** 2026-10-25T08:15:31.371406+00:00. **Read-only source snapshot SHA:** c0bf2ee6066faabaf3d683f57ad3c11cb212bec2. Recheck every assumption at execution time.

**Source audit scope:** 2 code files, 21 static UI controls/handlers, 36 canonical registry services. Worlds: system (12 descriptors) + network (12 descriptors) + hardware (12 descriptors).

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

مرصد Windows حقيقي بإشارات telemetry ذات مصادر واضحة مع معالجة الفراغات الضخمة؛ يغطي system/network/hardware المسجلة في Registry دون افتراض أنها مربوطة حاليًا.


## SPECIFIC DATA CONTRACTS & PROVENANCE

TimestampedSample {counterId,value,unit,source,quality}, ProcessSnapshot, HardwareIdentity, NetworkInterface, ConnectionEvent, DriverSignature, SystemEvent, SampleSeries, CapabilityState.

Required actual data interface should expose typed pagination/streaming where warranted, durable identity, permissions, provenance, error codes, capability detection and safe caching. Do not invent numbers.

## BACKEND REUSE, WINDOWS AND PROVIDER IMPLEMENTATION

Use audited Windows providers and performance counters/WMI/PDH/ETW where warranted؛ batched sampling with backpressure, explicit unsupported/counter denied; driver/display/hardware inventory read-only and no kernel drivers.

**Existing native candidates to inspect first:** electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; electron/windows-providers.cjs and audited Windows networking APIs; electron/windows-providers.cjs and supported OS telemetry

## CINEMATIC UI, WORKFLOWS & DOMAIN INTERACTION

4 gauges and sparklines، performance timeline، process ledger، system facts، diagnostics palette؛ network topology and interfaces inspector، hardware atlas and battery/thermal charts only when available.

At all responsive desktop viewports preserve approved imagery, content hierarchy, dedicated domain inspector and visible bottom actions. Do not replace premium visual depth with simplistic wireframe widgets.

## SAFETY, PERMISSIONS & REAL EXECUTION

Process controls restricted and protected processes read-only; ping/traceroute explicit target validation and bounded timeouts; no third-party telemetry/upload without consent.

Separate read-only discovery, preview-only simulation, authorized operation and verified postcondition. Do not expose raw Windows commands in the renderer.

## OBSERVED VISUAL/CODE GAP TO FIX

Oversized empty performance/system panels push Process Ledger and toolcards below the viewport.

The statement above comes from the provided screenshots or inspected source and is a target for verification, not an assertion that a patch has already passed.

## CODE FILES TO INSPECT FIRST (REUSE, DO NOT WIPE)

- `src/pages/SystemPage.tsx` — 871 lines; 13 state hooks; imported fixture signals: INITIAL_INSTRUMENT_METRICS, INITIAL_SERVICES_CATALOG, INITIAL_SYSTEM_INFO, INITIAL_TELEMETRY_SOURCE, SAMPLE_PROCESS_FIXTURES
- `src/lib/system-inventory.ts` — 410 lines; 0 state hooks; imported fixture signals: INITIAL_INSTRUMENT_METRICS, INITIAL_SERVICES_CATALOG, INITIAL_SYSTEM_INFO, INITIAL_TELEMETRY_SOURCE, SAMPLE_PROCESS_FIXTURES

Also inspect src/App.tsx, src/context/NavigationContext.tsx and shared shell for integration; inspect existing tests and the actual root Electron/native contract code.

## SCREEN-SPECIFIC ACCEPTANCE

measured CPU in valid unit/range، graph timestamps aligned، network counters correct adapter identity، absent sensors show unsupported.

Verify each user interaction in a real rendered app, and for native operations in a correct Electron environment. Do not claim native completion from localhost Vite UI.

## CANONICAL SERVICE-BY-SERVICE IMPLEMENTATION (NO SERVICE MAY BE SKIPPED)

Important: 36 descriptors here span system, network and hardware; inspect whether each is currently linked to a navigable screen. A registry descriptor alone is NOT a working tool.

### 01. System Pulse Overview Console — `system-health-check`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world system, descriptor family Live Pulse Charts; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Four measured-style instruments with provenance labels and system summary. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select metric gauge, Change detail tab, Toggle historical interval, Export system snapshot. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** CPU load & frequency, RAM usage & committed bytes, Disk I/O rate & response time, Network throughput. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry. First examine and REUSE electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 02. Windows Event Log Severity Ledger — `system-events`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world system, descriptor family Search Console; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Color-coded severity timeline, filter toolbar and event dossier. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Filter source & provider, Filter severity (Error/Warn/Info), Time range picker, Select event row. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Event ID & Message XML, Provider & Channel name, Timestamp & User SID, Event correlation preview. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry. First examine and REUSE electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 03. Active Process Register & Resources — `system-processes`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world system, descriptor family Ledger+Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** PID+start-time process ledger, per-process resource bars and detail pane. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Sort CPU/RAM/PID, Search process name, Verify signature toggle, Select process row. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Executable path & PID, Digital signature status, Memory working set & threads, Process tree parent. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry. First examine and REUSE electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 04. System Binary Certificate Inspector — `system-signatures`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world system, descriptor family Identity Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Signer-chain vertical tree with certificate chips and file identity. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select binary, Open evidence panels, Verify CA chain, Inspect thumbprint. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Authenticode signature chain, Certificate validity period, Root CA trust status, File hash matching. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry. First examine and REUSE electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 05. System Boot & Session Clock Timeline — `system-uptime`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world system, descriptor family Live Pulse Charts; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Boot timestamp hero, active session clock and restart-event ribbon. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Switch time window, View restart event details, Filter session type, Export uptime stats. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Uptime duration clock, Last boot timestamp, System shutdown reason, Fast Startup status. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry. First examine and REUSE electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 06. Live Performance Pulse Charts — `system-perf`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world system, descriptor family Live Pulse Charts; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** CPU/RAM/disk/network chart tabs with synchronized readable gauges. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Interval tabs (1s/5s/15s), Pause local chart, Change visible series, Select metric tab. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Current value & peak reading, Average over timeframe, Sample interval status, System load rating. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry. First examine and REUSE electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 07. Device Driver Inventory & Signatures — `system-drivers`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world system, descriptor family Ledger+Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Device-category tree and version/signature/date table. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Search device driver, Sort driver provider, Filter unsigned drivers, Select driver row. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Driver provider & date, Inf file name & version, WHQL signature status, Associated device hardware ID. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry. First examine and REUSE electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 08. Event Log Channel Explorer — `system-logs`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world system, descriptor family Search Console; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Event Log channel tree with query chips and structured inspector. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Choose log channel, Date/severity filter, Expand event detail, Search event text. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Channel path (%SystemRoot%\\System32\\Winevt\\Logs), Log file size & record count, Retention policy, Event structure preview. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry. First examine and REUSE electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 09. Top Resource Consuming Processes — `system-resources`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world system, descriptor family Ledger+Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Top-consuming process horizontal bars + per-process trend switcher. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Sort/group resource type, Focus PID, Change timeline range, Toggle system processes. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** CPU % contribution, Memory MB footprint, Disk B/s I/O rate, Shared resource accounting badge. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry. First examine and REUSE electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 10. App-to-Process Cross-Service Links — `system-autostart`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world system, descriptor family Service Dependency Graph; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Bipartite app/process -> startup/service link diagram. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select cross-linked row, Deep-link workspace, Filter link type, Search binary name. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Associated application name, Process PID & Service name, Autostart mechanism, Link confidence status. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry. First examine and REUSE electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 11. System Service Dependency Graph — `system-services-map`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world system, descriptor family Service Dependency Graph; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Directed dependency network with node inspector and protected badge. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Zoom/pan network canvas, Select service node, Highlight upstream/downstream, Filter system services. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Service ID & Display Name, Prerequisite services list, Dependent services list, Protected system service badge. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry. First examine and REUSE electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 12. Unified System Event Timeline — `system-timeline`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world system, descriptor family Live Pulse Charts; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Layered events lanes for KNOuX actions, Windows events and observations. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Time brush zoom, Event kind filter, Inspect provenance, Search timeline. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** KNOuX action events lane, Windows OS events lane, System observation markers, Event correlation inspector. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry. First examine and REUSE electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 13. Network Interfaces Console — `network-interfaces`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world network, descriptor family Network Topology; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** NIC cards with IP/DNS/gateway fields and real-source chips. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select interface, Switch IPv4/IPv6 view, Copy available fields, Filter active/inactive. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** IP Address & Subnet Mask, Default Gateway & MAC, DNS Servers list, Interface status & speed. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes. First examine and REUSE electron/windows-providers.cjs and audited Windows networking APIs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 14. DNS Resolver Configuration Dossier — `network-dns-config`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world network, descriptor family Identity Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Resolver list with per-adapter upstream chain and scope. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Choose adapter, Inspect DHCP/static fields, Open OS settings handoff, Test DNS query draft. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Primary & Secondary DNS IP, DHCP vs Static assignment, DNS suffix search list, Windows Settings handoff step. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes. First examine and REUSE electron/windows-providers.cjs and audited Windows networking APIs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 15. Network Hardware Atlas & NIC Rack — `network-adapters`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world network, descriptor family Device Atlas; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Physical/virtual adapter rack and detailed technical inspector. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Filter adapter state, Select exact interface, Inspect MAC & bus type, Toggle virtual adapters. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Adapter model & vendor, MAC Address & Link Speed, Driver version & date, Physical vs Virtual classification. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes. First examine and REUSE electron/windows-providers.cjs and audited Windows networking APIs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 16. Connectivity Diagnostic Step Sequence — `network-connectivity`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world network, descriptor family Safe Diagnostics Console; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Resolve -> connect -> probe timeline with latency slots and errors. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Enter target host draft, Choose safe test type, Inspect diagnostic stages, Copy ping/probe output. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** DNS Resolution stage, TCP Socket Connection stage, HTTP Probe stage, Latency & Loss metrics. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes. First examine and REUSE electron/windows-providers.cjs and audited Windows networking APIs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 17. Real-Time Traffic & Throughput Chart — `network-throughput`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world network, descriptor family Live Pulse Charts; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Duplex download/upload sparkline and historical sample plot. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select interface, Interval tabs (1s/5s), Pause chart state, Toggle B/s vs KB/s. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Download rate (B/s), Upload rate (B/s), Peak throughput, Total session bytes transferred. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes. First examine and REUSE electron/windows-providers.cjs and audited Windows networking APIs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 18. Hop Route & Latency Visualizer — `network-traceroute`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world network, descriptor family Network Topology; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Ordered hop chain, timing bars, lost/timed-out markers. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Enter target draft, Expand hop row, Choose max probes, Filter timeout hops. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Hop sequence (1..N), Router IP & Latency ms, Packet loss indicator, Route trace visualizer. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes. First examine and REUSE electron/windows-providers.cjs and audited Windows networking APIs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 19. LAN Topology & Node Relationship Map — `network-topology`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world network, descriptor family Network Topology; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Observed devices/routers as nodes with evidence-coded edges. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Zoom/pan network map, Select node device, Filter observed vs inferred, Search IP/MAC. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Device Hostname & IP, MAC Address & Vendor, Node connection type (Gateway/Local), Confidence level rating. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes. First examine and REUSE electron/windows-providers.cjs and audited Windows networking APIs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 20. Active Socket & Port Explorer — `network-ports`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world network, descriptor family Ledger+Dossier; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Dense protocol/IP/port/PID ledger + selected endpoint dossier. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Filter TCP/UDP, Filter Listening/Established, Search port or PID, Select socket row. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Local Address & Port, Foreign Address & Port, Associated PID & Process, Protocol state (LISTENING). Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes. First examine and REUSE electron/windows-providers.cjs and audited Windows networking APIs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 21. Wireless Wi-Fi Status & Signal Instrument — `network-wifi`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world network, descriptor family Device Atlas; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Wi-Fi signal instrument, radio card and profile/source details. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select Wi-Fi adapter, Inspect connection metadata, View signal strength, Filter SSID frequency. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** SSID Name & BSSID, Signal Strength % & RSSI dBm, Radio Type (802.11ax / Wi-Fi 6), Cipher & Authentication. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes. First examine and REUSE electron/windows-providers.cjs and audited Windows networking APIs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 22. Windows Hosts File Inspector — `network-hosts`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world network, descriptor family Identity Dossier; risk class staged-change; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Line-numbered read-only hosts viewer and before/after line differences. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Search domain/IP, Select entry line, Stage edit draft, Toggle comment lines. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Hosts file location (%SystemRoot%\\System32\\drivers\\etc\\hosts), Active domain mapping rules, Read-only safety status, Draft edit preview. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes. First examine and REUSE electron/windows-providers.cjs and audited Windows networking APIs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 23. Proxy & WinHTTP Configuration Graph — `network-proxies`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world network, descriptor family Network Topology; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Browser/WinHTTP/WinINET policy lanes with PAC and source labels. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Toggle viewer lanes, Inspect settings provenance, Check PAC script URL, Select proxy mode. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** WinINET Proxy settings, WinHTTP System Proxy settings, Auto-detect (WPAD) status, Proxy provenance badge. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes. First examine and REUSE electron/windows-providers.cjs and audited Windows networking APIs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 24. Network Recovery & Reset Gateway — `network-repair-link`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world network, descriptor family Staging + Impact Review; risk class administrative; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Network snapshot -> DNS/Winsock/TCPIP option cards with disruption warnings. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select repair pathway, Inspect step-by-step preview, Acknowledge network downtime, Crosslink to Repair world. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** DNS Flush option preview, Winsock Reset option preview, TCP/IP Reset option preview, Staged review dock. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes. First examine and REUSE electron/windows-providers.cjs and audited Windows networking APIs; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Must require validated admin capability, explicit high-risk confirmation and protected-resource denies. No bypass, no silent elevation.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 25. Device Hardware Atlas & Components — `hardware-inventory`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world hardware, descriptor family Device Atlas; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Modular CPU/GPU/RAM/storage cards, hardware silhouettes and selected inspector. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select component category, Switch info tab, Copy spec string, Inspect proven fields. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** System Model & Manufacturer, Processor & Core topology, Installed RAM capacity & speed, Graphics & Display adapter. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings. First examine and REUSE electron/windows-providers.cjs and supported OS telemetry; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 26. Battery Charge & Health Instrument — `hardware-battery`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world hardware, descriptor family Device Atlas; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Large charge-ring, wear/capacity bar and charging-state track. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select battery source, Inspect available fields, Toggle power source, Export battery report preview. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Charge level % & status, Design Capacity vs Full Charge Capacity, Battery chemistry & manufacturer, Power source (AC/Battery). Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings. First examine and REUSE electron/windows-providers.cjs and supported OS telemetry; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 27. Processor Architecture & Core Die — `hardware-cpu`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world hardware, descriptor family Device Atlas; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** CPU die visual divided into core/thread tiles and spec dossier. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select core/group, Inspect clock/cache, Toggle architecture specs, View virtualization status. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Processor Name & Frequency, Logical Cores & Physical Sockets, L1/L2/L3 Cache breakdown, Virtualization (VT-x/AMD-V) status. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings. First examine and REUSE electron/windows-providers.cjs and supported OS telemetry; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 28. Graphics Adapter Bay & VRAM — `hardware-gpu`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world hardware, descriptor family Device Atlas; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** GPU card and VRAM/driver output panels with monitor associations. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select graphics adapter, Switch detailed tabs, Inspect driver version, View monitor links. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** GPU Name & Vendor, Dedicated VRAM capacity, Driver version & date, DirectX & Vulkan support. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings. First examine and REUSE electron/windows-providers.cjs and supported OS telemetry; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 29. DIMM RAM Slots & Memory Layout — `hardware-memory`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world hardware, descriptor family Device Atlas; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** RAM slot/modules arrangement, speed/capacity rows and use meter. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select memory module, Sort by bank, Inspect frequency, Check form factor. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Memory Type (DDR4/DDR5), Speed MHz & Channel mode, Slot 1..N module capacity, Manufacturer & Part Number. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings. First examine and REUSE electron/windows-providers.cjs and supported OS telemetry; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 30. Battery Wear & Cycle Count Ledger — `hardware-cycles`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world hardware, descriptor family Live Pulse Charts; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Capacity compare ribbons and reported cycle count/sampling notes. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select timeframe, Inspect design vs full capacity, View cycle count, Export history. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Reported Cycle Count, Health wear percentage, Historical capacity degradation, Battery replacement advice. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings. First examine and REUSE electron/windows-providers.cjs and supported OS telemetry; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 31. Thermal Sensors & Temperature Board — `hardware-thermal`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world hardware, descriptor family Device Atlas; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Sensor tiles with graph placeholders, uncertainty and warning thresholds. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select sensor tile, Change timeline interval, Set warning threshold draft, Inspect sensor zone. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** CPU Temperature reading °C, GPU Temperature reading °C, Storage Drive Temperature °C, Thermal throttling warning. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings. First examine and REUSE electron/windows-providers.cjs and supported OS telemetry; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 32. Physical Disk Drives & Bus Interface — `hardware-disks`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world hardware, descriptor family Volume Bays; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Disk bays grouped by physical device, bus/interface and reported SMART slots. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select physical drive, Switch capabilities tab, Inspect bus type (NVMe/SATA), View drive health. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Disk Model & Serial, Interface type (NVMe/SATA/USB), Total Physical Capacity, SMART Status badge. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings. First examine and REUSE electron/windows-providers.cjs and supported OS telemetry; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 33. USB Controller & Device Topology Tree — `hardware-usb`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world hardware, descriptor family Device Atlas; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Connected controller/hub/device graph with device class icons. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Expand USB topology tree, Select node device, Inspect vendor/product ID, Filter hub vs device. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Device Class & Name, Vendor ID (VID) & Product ID (PID), USB Bus speed (USB 3.2 / 2.0), Power consumption rating. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings. First examine and REUSE electron/windows-providers.cjs and supported OS telemetry; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 34. Monitor Topology & Resolution Canvas — `hardware-display`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world hardware, descriptor family Device Atlas; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Display arrangement mini-canvas, resolution/refresh cards. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Choose monitor, Inspect available modes, View resolution & refresh rate, Check HDR status. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Monitor Model & Manufacturer, Current Resolution & Refresh Rate, Bit depth & Color space (sRGB/HDR), Primary display status. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings. First examine and REUSE electron/windows-providers.cjs and supported OS telemetry; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 35. Audio Endpoint Mixer & Devices — `hardware-audio`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world hardware, descriptor family Device Atlas; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Input/output endpoint cards, supported format meters and default status. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select audio endpoint, Inspect details, View OS settings handoff, Filter Input/Output. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Endpoint Name & Driver, Supported sample rates (24-bit 48kHz), Default communication device, Windows Sound handoff. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings. First examine and REUSE electron/windows-providers.cjs and supported OS telemetry; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.


### 36. Hardware Evidence & Diagnostic Report — `hardware-health-report`

- **Source evidence:** src/lib/service-ui-renderers.ts, canonical world hardware, descriptor family Repair Journal; risk class read-only; preview mode design-fixture. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** Hardware inventory report sheet with supported/unknown sections. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** Select report sections, Toggle redaction, Preview export, Copy hardware summary. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** Hardware summary sheet, Validated vs unknown components, Sensor health summary, Export PDF/JSON preview. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings. First examine and REUSE electron/windows-providers.cjs and supported OS telemetry; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.



## FULL UI ACTION / CONTROL AUDIT — EXACT SOURCE LOCATIONS

This is a static source index, NOT certified total runtime coverage. For EACH item listed below, read the JSX at the line, trace its click/change handler, state updates, relevant descriptor/engine, and record whether it is Working / Mock-only / No-op / Broken / Blocked / Implemented Verified. Inspect custom child components, dynamically generated controls, menu items and keyboard shortcuts as well.

Use a per-control verification table in your final handoff. Do not mark a button PASS because it has onClick or because it opens a modal; it must drive the correct native/preview action and display a genuine result.

- `pages/SystemPage.tsx:286` | OTHER_INTERACTIVE | onClick | <div               
- `pages/SystemPage.tsx:322` | OTHER_INTERACTIVE | onClick | <div                 key={inst.id}                 
- `pages/SystemPage.tsx:413` | button | onClick | [inspect source]
- `pages/SystemPage.tsx:427` | select | onChange | [inspect source]
- `pages/SystemPage.tsx:468` | button | onClick | [inspect source]
- `pages/SystemPage.tsx:563` | select | onChange | [inspect source]
- `pages/SystemPage.tsx:577` | select | onChange | [inspect source]
- `pages/SystemPage.tsx:596` | select | onChange | [inspect source]
- `pages/SystemPage.tsx:618` | input | onChange | [inspect source]
- `pages/SystemPage.tsx:638` | button | onClick | [inspect source]
- `pages/SystemPage.tsx:674` | button | onClick | [inspect source]
- `pages/SystemPage.tsx:688` | input | onChange | Search processes...
- `pages/SystemPage.tsx:695` | select | onChange | [inspect source]
- `pages/SystemPage.tsx:704` | select | onChange | [inspect source]
- `pages/SystemPage.tsx:752` | button | onClick | [inspect source]
- `pages/SystemPage.tsx:789` | OTHER_INTERACTIVE | onClick | <div                     key={svc.id}                     
- `pages/SystemPage.tsx:816` | button | onClick | [inspect source]
- `pages/SystemPage.tsx:828` | button | onClick | [inspect source]
- `pages/SystemPage.tsx:841` | button | onClick | [inspect source]
- `pages/SystemPage.tsx:849` | button | onClick | [inspect source]
- `pages/SystemPage.tsx:859` | button | onClick | [inspect source]

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

D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\references\REF-07_System_Live_Pulse.png

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
- src/components/system/SystemWorkspaces.tsx

Trace runtime service dispatch from the selected tile to ServiceWorkspaceHost to the appropriate renderer family. For EACH generated control: trace actual current selection, config props, state updates, actual provider call, preview, permission gate, error and verification. A direct page control inventory alone is not complete. No all-service generic fake preview is acceptable.


---

## REAL USER SERVICE ACTIVATION — POST-READ-ONLY PRODUCT ACCEPTANCE

This addendum implements the user's requirement that KNOuX must deliver REAL consumer actions, not only passive reading and dry-runs. Read and obey missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md BEFORE assessing this section. Treat earlier read-only/preview success as a valid engineering checkpoint but NOT automatic final functionality acceptance.

### Specific outcomes to implement and prove

- System 36-domain tooling should present measured diagnostics, real refresh, process/service/network/hardware inspection, exports, signers and performance traces, not static charts. An observational diagnostic remains complete if data is genuinely useful, supported and explained.
- The few actionable gateways must LEAD TO actual scoped service capability (e.g. network reset via approved Repair) rather than an always-disabled preview. Process termination or network changes, if advertised, require explicit owner consent and OS protections.
- Hardware sensors/thermal/S.M.A.R.T. must honestly state missing OS vendor drivers or instrumentation; no synthetic temperatures or unsupported networking claims.
- Tests: genuine read-only provider contracts, report/export behavior, provider-offline and permissions, action handoff to Repair's fixture-backed consent gate.

### Product acceptance

Enumerate EVERY existing service ID in this mission. Assign appropriate A observational / B reversible / C destructive-privileged / D connected category. Include each service in the central capability matrix, with actual native/API implementation, UI action, scoped consent gate, controlled fixture effect test, after-state verification, journal/undo if feasible, and honest limitations. A passive service may be complete with live useful measurements; an action-promising service requires a real safe executor behind user approval. Do NOT perform effectful tests on real user resources, account, registry or Windows. Do not mark whole-section PRODUCTION COMPLETE until core actions are implemented/tested and supported integrations have their external/manual gates documented.

Follow the existing SINGLE canonical repo/branch and real CI policy; no worktrees, extra project directories, fake results or Root CI. If currently working on another mission, preserve it and enter this section during the ordered activation pass, not by overwriting the agent's uncommitted changes.


## Mandatory interactive workbench & real controls — Mission 15A

When user opens ANY advertised service, show its unique control-rich tool workbench in a pinned resizable side panel OR an expanded full in-app workspace, with working dock/expand/collapse and persistent resource/filter/selection state. Use one accessible shared shell but domain-specific body and real native/API handlers; no generic repeated modal or cosmetic buttons.

System: 36 distinctive measured system/network/hardware instruments; charts, logs, diagnostic drilldown, approved repair handoffs; unsupported sensors explicit.

Every relevant control must select/inspect/filter/configure a real outcome, or expose clearly why unsupported. For a mutation, require per-item measured preview, exact per-action user consent, fixed validated executor, controlled-disposable-fixture effect test, after-state receipt and real restore if feasible. Do not run risky OS/file/cloud operations on owner's data during agent testing.

Verify EN+AR RTL, dark+light, 1366/1672/1920, keyboard/focus, dock<->expanded continuity, no header/footer obstruction; update docs/SERVICE_WORKBENCH_ACCEPTANCE.md and the capability matrix for each original service ID. Mission reference: missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md. This UX gate is not alone proof the action service is product-complete.
