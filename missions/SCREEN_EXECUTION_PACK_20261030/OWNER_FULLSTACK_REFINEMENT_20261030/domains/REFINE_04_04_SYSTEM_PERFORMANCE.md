# FULL-STACK REFINEMENT — 04 System Performance (System, Network, Hardware)

> BINDING 2026-10-30 owner instruction. Supplement, do not replace, `missions/SCREEN_EXECUTION_PACK_20261030/screens/04_SYSTEM_PERFORMANCE/SCREEN_TASK.md`. This file is a TASK, not proof of implementation.

## Exact ownership
- Route: `system`.
- Existing renderer source: `apps/gemini-ui/src/pages/SystemPage.tsx` + `apps/gemini-ui/src/system/useSystem.ts` + `apps/gemini-ui/src/system/SystemServiceWorkspaces.tsx`.
- Canonical domain: `missions/UNIFIED_FULL_DOMAIN_EXECUTION_20261028/DOMAINS/10_SYSTEM_FULL_DOMAIN.md`.
- Service IDs: **36**. No additions or renaming; total across all domains is 181.
- Owner-approved DAY image: `missions/SCREEN_EXECUTION_PACK_20261030/REFERENCE_IMAGES_UNIQUE/0b2e4bb676e3__KNOuX System Performance Dashboard.png`; NIGHT image: `missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/references/night/08_system.png`. Verify present and compare viewport; never embed a full screenshot as UI.
- Original integration handoff: `missions/SCREEN_EXECUTION_PACK_20261030/screens/04_SYSTEM_PERFORMANCE/INTEGRATION_HANDOFF.json` — current NOT_AUDITED state must be refreshed from evidence, not assumed failed.
- Mandatory global contract: `OWNER_FULLSTACK_REFINEMENT_20261030/00_READ_FIRST_AND_REALITY.md` and `02_ACCEPTANCE_AND_REPORTING.md`.

## Product journey
36 services across three sub-worlds; do NOT collapse into one CPU dashboard. Reuse existing telemetry, process registry, event logs, sockets, drivers and bounded diagnostics.

**End-to-end sequence:** System: real CPU/RAM/process/service/timeline. Network: adapters, DNS, traceroute/connectivity, ports, topology and Wi-Fi capability states. Hardware: CPU/GPU/RAM/battery/disks/USB/displays/audio diagnostics.

**Screenshot identity and original service scenes:** Three navigable specialized worlds under same shell: observatory with live sparklines; network console with topology/latency/socket detail; hardware racks/slots and sensor cards (only if measured).

## Specific native + risk gate
Respect WMI/ETW performance budgets, unknown sensors, remote network scope, network repair consent and unsigned/untrusted binary metadata.
- Reuse actual Main/Preload/typed contracts and existing service ownership. Do not regress original tested behavior or overwrite unmerged work.
- Build real in-app controls and dedicated inspector per service: inputs -> measured outputs -> targeted actions -> feedback/errors, with a side/expanded view where suited. Unsupported operations keep their contextual scene but state clearly why they are unavailable.
- Every successful actual effect must be backed by fresh consent, exact plan, native postcondition and journal receipt on user-owned temporary test fixtures; no privileged Windows/account actions without separate owner authorization.
- Render errors, permission declined, empty source, loading, stale data, cancel, partial, success and restart state; show provenance/timestamp/freshness/units and a real cancel status.

## EXACT service-level assignments (not generic repeated cards)
1. `system-health-check` **System Pulse Overview Console** — live unit-labelled sensor/diagnostic charts with unavailable and stale states. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-health-check.md`.
2. `system-events` **Windows Event Log Severity Ledger** — time-ordered source-backed events, filters, incident detail and export. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-events.md`.
3. `system-processes` **Active Process Register & Resources** — live unit-labelled sensor/diagnostic charts with unavailable and stale states. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-processes.md`.
4. `system-signatures` **System Binary Certificate Inspector** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-signatures.md`.
5. `system-uptime` **System Boot & Session Clock Timeline** — time-ordered source-backed events, filters, incident detail and export. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-uptime.md`.
6. `system-perf` **Live Performance Pulse Charts** — live unit-labelled sensor/diagnostic charts with unavailable and stale states. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-perf.md`.
7. `system-drivers` **Device Driver Inventory & Signatures** — selectable dense inventory with preview, provenance and safe drilldown. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-drivers.md`.
8. `system-logs` **Event Log Channel Explorer** — time-ordered source-backed events, filters, incident detail and export. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-logs.md`.
9. `system-resources` **Top Resource Consuming Processes** — live unit-labelled sensor/diagnostic charts with unavailable and stale states. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-resources.md`.
10. `system-autostart` **App-to-Process Cross-Service Links** — selectable relation network with exact entities and impact details. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-autostart.md`.
11. `system-services-map` **System Service Dependency Graph** — selectable relation network with exact entities and impact details. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-services-map.md`.
12. `system-timeline` **Unified System Event Timeline** — time-ordered source-backed events, filters, incident detail and export. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-timeline.md`.
13. `network-interfaces` **Network Interfaces Console** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-interfaces.md`.
14. `network-dns-config` **DNS Resolver Configuration Dossier** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-dns-config.md`.
15. `network-adapters` **Network Hardware Atlas & NIC Rack** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-adapters.md`.
16. `network-connectivity` **Connectivity Diagnostic Step Sequence** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-connectivity.md`.
17. `network-throughput` **Real-Time Traffic & Throughput Chart** — live unit-labelled sensor/diagnostic charts with unavailable and stale states. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-throughput.md`.
18. `network-traceroute` **Hop Route & Latency Visualizer** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-traceroute.md`.
19. `network-topology` **LAN Topology & Node Relationship Map** — selectable relation network with exact entities and impact details. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-topology.md`.
20. `network-ports` **Active Socket & Port Explorer** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-ports.md`.
21. `network-wifi` **Wireless Wi-Fi Status & Signal Instrument** — live unit-labelled sensor/diagnostic charts with unavailable and stale states. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-wifi.md`.
22. `network-hosts` **Windows Hosts File Inspector** — selectable dense inventory with preview, provenance and safe drilldown. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-hosts.md`.
23. `network-proxies` **Proxy & WinHTTP Configuration Graph** — selectable relation network with exact entities and impact details. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-proxies.md`.
24. `network-repair-link` **Network Recovery & Reset Gateway** — verified inverse/restore timeline with hash/state conflict guard. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-repair-link.md`.
25. `hardware-inventory` **Device Hardware Atlas & Components** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-inventory.md`.
26. `hardware-battery` **Battery Charge & Health Instrument** — live unit-labelled sensor/diagnostic charts with unavailable and stale states. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-battery.md`.
27. `hardware-cpu` **Processor Architecture & Core Die** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-cpu.md`.
28. `hardware-gpu` **Graphics Adapter Bay & VRAM** — selectable relation network with exact entities and impact details. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-gpu.md`.
29. `hardware-memory` **DIMM RAM Slots & Memory Layout** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-memory.md`.
30. `hardware-cycles` **Battery Wear & Cycle Count Ledger** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-cycles.md`.
31. `hardware-thermal` **Thermal Sensors & Temperature Board** — live unit-labelled sensor/diagnostic charts with unavailable and stale states. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-thermal.md`.
32. `hardware-disks` **Physical Disk Drives & Bus Interface** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-disks.md`.
33. `hardware-usb` **USB Controller & Device Topology Tree** — selectable relation network with exact entities and impact details. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-usb.md`.
34. `hardware-display` **Monitor Topology & Resolution Canvas** — selectable relation network with exact entities and impact details. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-display.md`.
35. `hardware-audio` **Audio Endpoint Mixer & Devices** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-audio.md`.
36. `hardware-health-report` **Hardware Evidence & Diagnostic Report** — provenance-rich report composer with redaction and reproducible export. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-health-report.md`.

## Per-service closure protocol
For EACH ID above, inspect its canonical spec and renderer + native implementation, compare current route to exact approved DAY/NIGHT PNG, preserve existing provider and code, implement ONLY missing unique service UX/functionality, exercise distinct toolbar/inspector/keyboard controls, run native fixture + actual Windows Electron evidence, update that exact ledger row with SHA and evidence, mark visual owner gate separately. No subset of ID rows closes this domain.

## Tests to run (the result must be recorded, never presumed)
- Preflight: Git ancestry/current remote, baseline and worktrees, working-tree diff and exclusive edit ownership. Keep untracked evidence safe; no Git push/merge without separate authorization.
- Native contract and targeted domain suite, typecheck/lint, Vite build, failures and negative constraints; regressions in owning/cross-domain shared engines.
- Actual Electron dev AND packaged Windows runtime for functionality claimed packaged (not browser fixture as a substitute).
- UI: EN/AR RTL × DAY/NIGHT × 1366x768/1672x941/1920x1080, zoom 100/125/150 where supported, keyboard/focus/reduced motion, real selection and scroller checks. Capture before/after/screenshots with timestamp/SHA; compare side by side with approved source.
- Deliver a service-by-service evidence table; every claim must name commands and exit status, exact local/remote Git SHA, unverified gaps and owner visual acceptance state.

**Safe next action:** Audit the baseline and proven unique source first, then implement one cohesive end-to-end verified increment in this domain. Do not stop at design, screenshots, documentation or 1–2 attractive workbenches.