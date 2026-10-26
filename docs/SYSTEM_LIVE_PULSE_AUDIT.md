# KNOuX Mission 10 — System Live Pulse, Network & Hardware Audit

Date: 2026-10-26
Repository: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`
Branch: `feat/gemini-missions`
Starting feature HEAD: `bc3f03013eb81dc8feb1bb044cdf2d765a36cccb`
Implementation commit: recorded in `missions/MISSION_SEQUENCE_PROGRESS.md`

## 1. Scope delivered

Mission 10 replaces the former fixture-driven System page with one measured,
read-only observatory behind fixed `knoux:system:v1:*` channels. The existing
uncommitted mission work (bridge, providers, contract, workbenches) was
preserved, its broken relative imports and TypeScript defects were repaired,
and the renderer integration that was missing was completed.

| Layer | File | Role |
|---|---|---|
| Native coordinator | `apps/gemini-ui/electron/native/system-bridge.cjs` | Bounded 9-stage read-only scan, 15 capabilities, measured snapshot, samples, events, Authenticode, diagnostics, traceroute, hosts drafts, report, settings handoff |
| Providers/normalizers | `apps/gemini-ui/electron/native/system-providers.cjs` | Fixed PowerShell/CIM/counter scripts and strict normalizers for 36 descriptors |
| Main IPC | `apps/gemini-ui/electron/main.cjs` | Trusted-sender guard, argument validation, fixed channels, no generic execute |
| Preload | `apps/gemini-ui/electron/preload.cjs` | `window.knouxSystemV1` typed, versioned API |
| Contract | `shared/native-contracts.ts`, `shared/native-contract.json` | `system.v1` types and capability modes |
| Renderer access | `src/system/native.ts`, `useSystem.ts` | Contract-checked envelopes, controller, 5 s sampling up to 120 samples, cancellation |
| Catalog | `src/system/catalog.ts`, `model.ts` | 36 bilingual descriptors and deterministic formatting/geometry |
| Workbenches | `src/system/SystemWorkbenchesA/B.tsx`, `NetworkWorkbenches.tsx`, `HardwareWorkbenches.tsx` | 36 specialised measured panels |
| Service map | `src/system/SystemServiceWorkspaces.tsx` | Explicit id → component map, focus-trapped sheet, Esc/close |
| Page | `src/pages/SystemPage.tsx` | Measured hero, 4 instruments, timeline, identity, process ledger, 9-stage coverage, 36-service launcher, action bar |
| Design system | `src/system.css` | Authored dark/light tokens, RTL composition, 1366/1672/1920 breakpoints, reduced-motion |
| Tests | `scripts/system-native-test.cjs`, `src/pages/tests/SystemPage.test.tsx` | Native fixtures, no-mutation assertions, renderer/catalog parity |

Removed fixture code:

- `src/lib/system-inventory.ts` (410 lines of sample instruments/system/process data).
- `src/components/system/SystemWorkspaces.tsx` (generic modal).
- The old `SystemPage` fixture handlers and `runSystemVerificationSuite` expectations.

No fixture fallback remains in the System route. A browser preview renders an
explicit native-required banner and no numbers.

## 2. Canonical service coverage (36/36)

System (12): `system-health-check`, `system-events`, `system-processes`,
`system-signatures`, `system-uptime`, `system-perf`, `system-drivers`,
`system-logs`, `system-resources`, `system-autostart`, `system-services-map`,
`system-timeline`.

Network (12): `network-interfaces`, `network-dns-config`, `network-adapters`,
`network-connectivity`, `network-throughput`, `network-traceroute`,
`network-topology`, `network-ports`, `network-wifi`, `network-hosts`,
`network-proxies`, `network-repair-link`.

Hardware (12): `hardware-inventory`, `hardware-battery`, `hardware-cpu`,
`hardware-gpu`, `hardware-memory`, `hardware-cycles`, `hardware-thermal`,
`hardware-disks`, `hardware-usb`, `hardware-display`, `hardware-audio`,
`hardware-health-report`.

The Electron runtime probe opened all 36 sheets, verified each `.sys-wb-body`
rendered non-trivial measured content, and closed each with `Close service` /
`إغلاق الخدمة`: `36/36`, zero failures.

## 3. Control audit — former page controls

| Former control | Current behaviour |
|---|---|
| Telemetry source card / sample toggle | Reads the real capabilities engine and latest measured metrics source; shows native required in browser preview |
| 4 instrument cards (`Awaiting sample` fixture) | Measured CPU/memory percentages, disk read+write, network in+out; selects the Live Pulse workbench |
| Performance timeline tabs | Real CPU/memory/disk/network sample series with latest/peak/average |
| Timeline interval select | Real 1 s / 5 s / 15 s sampling interval |
| Initiate sample collection (fixture) | `Sample now` calls the measured counter sampler |
| Live Service Preview selects (fixture) | Removed; service 03/12 panels bind to the measured service snapshot |
| Process search/status/user (sample fixtures) | Measured process search; full 45-row paged register, signature verification on demand |
| 12 service cards | 36 specialised workbenches grouped by system/network/hardware with search and provider/state chips |
| Refresh Data | Re-reads the measured cached snapshot, or runs a bounded scan |
| Inspect Processes | Opens the measured process register |
| View Events | Opens the measured event severity ledger |
| Export Diagnostics (fake toast) | `Export snapshot` downloads the real measured snapshot JSON |
| Settings | Opens the hardware report/full pulse actions and real Windows settings handoffs inside their service sheets |

No button claims a mutation. No modal is shared as a fake workbench.

## 4. Measured runtime evidence (development Electron, 2026-10-26 15:20 UTC)

Receipt: `apps/gemini-ui/visual-evidence/platform-00/native-smoke-dev.json`.

- Final session: `complete`, progress `100`, read-only, mutation `none`, 9/9 stages complete.
- 292 processes, 271 services, 139 signed-driver rows, 300 events, 4 interfaces,
  417 sockets, 240 observed neighbours (bounded), 10 startup links.
- Stage durations (ms): system 7840, processes 2674, services 2742, events 2237,
  drivers 2505, network 4957, sockets 1782, hardware 0 (composed from measured CIM), timeline 0.
- Hardware: 1 CPU package, 1 GPU, 2 DIMMs, 2 physical disks, 12 USB nodes,
  1 monitor, 6 audio endpoints, SMART available; **no battery** and **no thermal zone**
  (`batteries:false`, `thermal:false`) — the UI reports unavailable instead of inventing a value.
- Sampling source: `PerfOS + PerfDisk + Tcpip counters`; 20 source groups.
- Measured warning: 1 (thermal provider unavailable on this desktop). It is shown as a count
  and in the coverage panel; no warning is hidden.
- Snapshot receipt: `sys:0a33d5bcd86961ce89d64094`.

Runtime interaction proofs in the same receipt:

- `systemServiceProbe`: 36/36 workbenches opened with measured content, 36/36 segmented
  controls switched and restored, and each sheet closed.
- `systemControlProbe`: timeline metric tabs, 1 s/5 s/15 s interval, pause/resume
  `aria-pressed`, and measured service search all changed state without errors.
- `systemKeyboardProbe`: service card focus → sheet opens with focus on Close → Escape closes.
- `systemRtlLayout`: Arabic direction `rtl`, four KPI cards within the workspace, no horizontal overflow.
- `system1366Layout`: four KPI cards on one row, timeline/facts side by side, dark theme, inner scroll works.

## 5. Security and safety

- 15 fixed channels; `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- Every IPC call validates the trusted sender, argument count and typed fields; no
  `execute(channel, args)`, no arbitrary command string from the renderer.
- `tracert.exe` receives a validated host/IP and bounded hop count. DNS/TCP/HTTP/ICMP
  probes have 15 s timeouts and validated targets/ports.
- Signature verification accepts only absolute executable paths and at most 24 entries;
  PowerShell fallback escapes single quotes and uses `-LiteralPath`.
- Passwords/proxy/hosts/adapter/service/process/power/driver writes have **no channel**.
  Eight operations are published as gated with owning missions (10/11/12/14).
- Hosts drafts are immutable diffs with `execution.available:false`.
- No external telemetry or upload. No credential or token is read by this mission.
- The packaged application remains unsigned; `signAndEditExecutable` is false.

## 6. Tests and gates

| Gate | Result |
|---|---|
| `npm run lint` (`tsc --noEmit`) | PASS |
| `npm run build` | PASS (1807 modules; 494.6 kB CSS / 1.93 MB JS) |
| `npm run test:system` | PASS — 36 services, 9 stages, 8 gates, fixture diagnostics/signatures/traceroute, renderer parity, no mutation calls |
| `test:native` / `test:studio` / `test:files` / `test:storage` / `test:scan` / `test:apps` / `test:cleanup` / `test:startup` | PASS |
| `npm run desktop:smoke` | PASS — `systemOk`, `systemLayoutOk`, 36/36 workbenches, 5 captures |
| `npm run desktop:packaged-smoke` | PASS — same checks from the packaged `win-unpacked` executable |

The 1366 layout assertion proves: 4 KPI cards on one row, timeline/facts
side by side, no horizontal overflow, inner scrolling works, 12 world cards
visible, and the dark theme restored before capture.

## 7. Visual evidence

`apps/gemini-ui/visual-evidence/platform-00/`:

- `system-measured-dev.png` (1672×941, dark, measured)
- `system-measured-dev-light.png` (1672×941, light)
- `system-measured-dev-ar-light.png` (1672×941, Arabic RTL, light)
- `system-measured-dev-1366.png` (1366×768, dark)
- `system-measured-dev-1920.png` (1920×1080, dark)
- `system-workbench-dev.png` (measured Processor Architecture & Core Die sheet; deliberately not a process dossier, because process paths can contain the Windows profile)
- packaged equivalents: `system-measured-packaged*.png`, `system-workbench-packaged.png`

The short-viewport composition fixes the source gap: at 1366×768 the process
ledger and the first workbench row are visible, with focused inner scrollers
for facts, ledger, coverage and service lists. No document-level scrollbar or
horizontal clipping is present.

## 8. Honest limitations and gated work

- Thermal and battery values are unavailable on this desktop; sensors are not simulated.
- LAN topology is bounded to 240 observed ARP/NDP neighbours and marked partial.
- Wi-Fi remains partial and reports unsupported when the WLAN service/radio does not answer.
- SMART health is reported from Windows storage reliability; no raw SMART command is invented.
- Events are bounded to 200 query rows / 300 scan rows; channels to 240.
- No process termination, service control, driver change, proxy write, hosts write,
  adapter reset, network repair execution or power-policy change is available.
- Mission 10 does not execute network repair; the preview is handed to Mission 11.
- The browser preview cannot prove native measurement; Electron receipts are the evidence.

## 9. Release record

The implementation is committed on `feat/gemini-missions` (`aebffc2`), pushed
to the only authorized remote, and integrated into `main` after GitHub Actions
for `62096a7` (run 40349680254) was green. The first CI run (40349387645)
correctly failed because the repository root lacked a `test:system` forwarding
script; the root package now forwards to the Gemini suite. Remote SHA, CI run
URL and main integration are recorded in `missions/MISSION_SEQUENCE_PROGRESS.md`.
