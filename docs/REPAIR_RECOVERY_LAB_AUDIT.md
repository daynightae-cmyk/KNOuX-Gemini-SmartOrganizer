# KNOuX Mission 11 — Recovery Lab Audit

Date: 2026-10-26
Repository: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`
Branch: `feat/gemini-missions`
Starting feature HEAD: `3ae5d95f0f004300228336bf79c5423c0b36ef21`

## 1. Scope delivered

Mission 11 replaces the fixture-driven Repair page with a measured, read-only
Recovery Lab. Six bounded discovery stages collect repair evidence through
fixed read-only PowerShell/`ipconfig`/`netsh` commands. DISM, SFC, DNS flush,
Winsock/TCPIP reset, restore and update servicing have **no execution channel**.
All repair plans are immutable previews and are recorded in a local
append-only journal.

| Layer | File | Role |
|---|---|---|
| Native coordinator | `electron/native/repair-bridge.cjs` | Six-stage discovery, capabilities, immutable plans, journal, report, allowlisted settings |
| Providers/normalizers | `electron/native/repair-providers.cjs` | 12 descriptors, 10 fixed command specs, 8 gates, six scripts, pure normalizers |
| Main IPC | `electron/main.cjs` | Trusted-sender guard, typed validation, nine fixed channels, no execution channel |
| Preload | `electron/preload.cjs` | `window.knouxRepairV1` versioned API |
| Contracts | `shared/native-contracts.ts`, `shared/native-contract.json` | `repair.v1` types and capability modes |
| Renderer access | `src/repair/native.ts`, `useRepair.ts` | Contract-checked envelopes, scan polling, plan/journal controller |
| Catalog/model | `src/repair/catalog.ts`, `model.ts` | 12 bilingual descriptors, risk/state vocabulary, guided steps |
| Shared UI | `src/repair/ui.tsx` | Tool frame, command preview, prerequisites, guided sequence, plan dock, safety notes |
| Workbenches | `src/repair/RepairServicingWorkbenches.tsx`, `RepairNetworkWorkbenches.tsx`, `RepairSystemWorkbenches.tsx` | 12 specialised measured panels |
| Page | `src/pages/RepairPage.tsx` | Measured hero, 4 KPIs, 12-tool grid, selected brief, history, actions, footer |
| Design | `src/repair.css` | Authored page/workbench composition on measured `sys-*` tokens, dark/light/RTL |
| Tests | `scripts/repair-native-test.cjs`, `src/pages/tests/RepairPage.test.tsx` | Controlled discovery, plan/journal, failure/cancel, renderer parity |

Removed fixture code:

- `src/lib/repair-inventory.ts` (767 lines of sample tools/steps/controls).
- `src/components/repair/RepairWorkspaces.tsx` (generic modal).
- The old fixture-driven page and verification suite.

## 2. Canonical service coverage (12/12)

`repair-component-check`, `repair-component-scan`, `repair-component-restore`,
`repair-files-verify`, `repair-files-repair`, `repair-dns-flush`,
`repair-winsock-reset`, `repair-tcpip-reset`, `repair-history`,
`repair-troubleshooters`, `repair-restore-point`, `repair-update-reset`.

The Electron runtime probe opened all 12 workbenches, verified each `.rep-wb-body`
rendered measured content, switched segmented controls, and closed each sheet:
**12/12**, zero failures.

## 3. Control audit — former page controls

| Former control | Current behaviour |
|---|---|
| Tool select `<select>` | Replaced by a searchable 12-tool measured grid; selection drives the brief |
| Repair tool card `onClick` | Selects the tool; `Review repair` opens its specialised workbench |
| Preview buttons | `Stage preview` calls `repair.plan`, which evaluates measured prerequisites and records an immutable journal preview |
| Guided step click (highlight only) | Guided sequence is informational; steps 6–7 are visibly blocked |
| Command copy | `Copy command` copies the fixed display string; it does not execute |
| Toggle transcript/progress demo | Checklist/Transcript and Services/Sequence views show measured metadata or explicitly labelled samples |
| Execute repair (admin) | Removed. No execution channel exists; the plan dock says nothing was run |
| Export diagnostic notes | Builds the measured redacted report and downloads real JSON |
| Open OS settings | Three allowlisted handoffs: Windows Update, troubleshoot, recovery |
| Repair history | Reads the local append-only preview journal; entries state `mutation:'none'` |

## 4. Measured runtime evidence (development Electron, 2026-10-26)

Receipt: `apps/gemini-ui/visual-evidence/platform-00/native-smoke-dev.json`.

- Final session: `complete`, progress `100`, read-only, mutation `none`.
- Stages: identity 1070 ms, servicing 478 ms, network 9036 ms, update 2055 ms,
  restore 783 ms (partial: access denied), journal 926 ms.
- Identity/tooling: Windows 10 Pro build 19045, **standard user**, DISM and SFC
  present, no pending reboot.
- Servicing metadata: DISM log 1.1 MB, CBS log 13.8 MB, component store present;
  component-store health is **not run** and never inferred from file metadata.
- Network: 4 adapters, 5 IPv4 addresses, **46 measured DNS cache record names**
  (domains are intentionally not displayed or persisted), **28 Winsock provider
  entries**.
- Update: 5 measured services (wuauserv/bits/cryptsvc/msiserver/trustedinstaller),
  25 SoftwareDistribution download items.
- Restore: `permission_denied` without elevation, zero points claimed.
- One measured warning (restore access denied). Plan previews: 10 fixed commands,
  8 explicit gates, 16 source groups.
- Snapshot receipt: `repair:42954d54fb421a9b867b8509`.
- Journal: one immutable preview recorded by `Stage preview`; **zero executed repairs**.

Runtime interaction proofs:

- `repairServiceProbe`: 12/12 workbenches opened, controls switched, closed.
- `repairControlProbe`: tool search filtered, `repair-dns-flush` preview staged,
  journal row and plan receipt appeared.
- `repairKeyboardProbe`: tool focus → workbench opens with focus on Close → Escape closes.
- `repairRtlLayout`: Arabic `rtl`, four KPI cards inside the workspace, no horizontal overflow.
- `repair1366Layout`: four KPI cards on one row, 12 tools, history panel, footer visible,
  dark theme, inner scrolling works.

## 5. Security and safety

- Nine fixed `knoux:repair:v1:*` channels. No `repair.run`, `execute`, `apply` or `reset`.
- Trusted sender, top-frame origin and typed argument validation on every call.
- Codexecution: only fixed read-only PowerShell/`ipconfig /displaydns`/`netsh winsock show catalog`.
  DISM/SFC/`rstrui`/`netsh ... reset`/`ipconfig /flushdns` never reach `runFile`.
- No automatic elevation. `capabilities.elevation.automaticElevation:false`,
  `method:'user-initiated UAC only'`.
- Eight gated operations: DISM RestoreHealth, SFC ScanNow, DNS flush, Winsock reset,
  TCPIP reset, restore apply, update reset, elevation request.
- Every plan is immutable with `execution.available:false` and a receipt.
- Journal writes are confined to the application profile and contain no machine values.
- The report is redacted by default; the packaged executable remains unsigned.

## 6. Tests and gates

| Gate | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run test:repair` | PASS — controlled discovery, plan/journal, refusal, cancellation, provider-failure, no-execution static scan, renderer parity |
| `test:native` / `test:studio` / `test:files` / `test:storage` / `test:scan` / `test:apps` / `test:cleanup` / `test:startup` / `test:system` | PASS |
| `npm run desktop:smoke` | PASS — `repairOk`, `repairLayoutOk`, 12/12 workbenches, keyboard, RTL, 1366 layout, 6 captures |
| `npm run desktop:packaged-smoke` | PASS — same checks from `win-unpacked` |

The Smart Scan smoke history read was made bounded-retry after exposing a
pre-existing persistence race; no product assertion was relaxed.

## 7. Visual evidence

`apps/gemini-ui/visual-evidence/platform-00/`:

- `repair-measured-dev.png` (1672×941, dark)
- `repair-measured-dev-light.png`
- `repair-measured-dev-ar-light.png` (Arabic RTL; numeric values keep LTR order)
- `repair-measured-dev-1366.png` (tools, brief, history, actions and footer visible)
- `repair-measured-dev-1920.png`
- `repair-workbench-dev.png` (privacy-safe DISM CheckHealth sheet)
- packaged equivalents: `repair-measured-packaged*.png`, `repair-workbench-packaged.png`

The former lower-history/actions obstruction is resolved: the page uses focused
inner scrollers and a pinned footer, and the 1366 assertion proves the footer,
12 tools, four KPIs and history are reachable without horizontal clipping.

## 8. Honest limitations and gated work

- No DISM/SFC process ran; component-store health and file integrity remain **not measured**.
- Restore points are unreadable without elevation; no points are invented.
- DNS domains and Winsock layer paths are not persisted or shown.
- The 7-stage ScanHealth display is a plan, not progress.
- Troubleshooter categories are guidance + fixed settings handoffs; MSDT is not launched.
- SFC/DISM sample output is explicitly labelled as a sample and never presented as a reading.
- Administration still requires a future, separately approved elevated executor with
  postcondition verification and rollback limits.

## 9. Release record

The implementation is committed on `feat/gemini-missions` (`2594400`), with the
acceptance record at `cca97ff`, pushed to the only authorized remote, and
integrated into `main` after Gemini Platform CI run 40356612756 was green.
Remote SHA, CI run and integration result are recorded in
`missions/MISSION_SEQUENCE_PROGRESS.md`.
