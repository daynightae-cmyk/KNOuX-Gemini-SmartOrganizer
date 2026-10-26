# KNOuX Mission 12 — Service Commander Audit

Date: 2026-10-26
Repository: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`
Branch: `feat/gemini-missions`
Starting feature HEAD: `cd6bc606e4ad8306718d5c9c15493e8111547ac9`

## 1. Scope delivered

Mission 12 replaces the fixture-driven Services page with one measured,
read-only SCM register and a preview-only operation model. Six bounded stages
collect the service inventory, dependency graph, capability protection policy,
Service Control Manager events, svchost hosts and the local preview journal.
Start/stop/restart/startup-type operations have **no execution channel**.

| Layer | File | Role |
|---|---|---|
| Native coordinator | `electron/native/services-bridge.cjs` | Six-stage discovery, capabilities, dependency impact, immutable plans, journal, report |
| Providers/normalizers | `electron/native/services-providers.cjs` | 12 tools, 6 gates, SCM scripts, protection policy, event/svchost normalizers |
| Main IPC | `electron/main.cjs` | Trusted-sender guard, typed validation, eight fixed channels, no SCM write |
| Preload | `electron/preload.cjs` | `window.knouxServicesV1` versioned API |
| Contracts | `shared/native-contracts.ts`, `shared/native-contract.json` | `services.v1` types and capability modes |
| Renderer controller | `src/services/native.ts`, `useServices.ts` | Envelope validation, polling, plan/journal, report |
| Catalog/model | `src/services/catalog.ts`, `model.ts` | 12 bilingual tools, risk/state, filters, cascade, event matching |
| Shared UI | `src/services/ui.tsx` | Register, dossier, operation preview, dependency graph, event list |
| Workbenches | `src/services/ServicesRegisterWorkbenches.tsx`, `ServicesCoreWorkbenches.tsx`, `ServicesAnalyticsWorkbenches.tsx` | 12 specialised measured panels |
| Page | `src/pages/ServicesPage.tsx` | 6 measured KPIs, register, operation preview, activity, graph, 12 tools, actions |
| Design | `src/services.css` | Authored dark/light/RTL on measured sys tokens, 1366/1672/1920 |
| Tests | `scripts/services-native-test.cjs`, `src/pages/tests/ServicesPage.test.tsx` | Controlled SCM fixture, plans/journal, failure/cancel, renderer parity |

Removed fixture code:

- `src/lib/services-inventory.ts` (514 lines of sample register/activity/graph).
- `src/components/services/ServicesWorkspaces.tsx` and `ServicesWorkspaceHost.tsx`.
- `src/services/service-registry.ts` (old 132-descriptor registry; shared
  `service-ui-renderers` remains for other pending sections).
- Old fixture-driven verification suite.

## 2. Canonical service coverage (12/12)

`services-inventory`, `services-control`, `services-undo`,
`services-dependencies`, `services-protected`, `services-search`,
`services-startup-report`, `services-state-history`, `services-dependents`,
`services-diagnose`, `services-config`, `services-perf`.

The Electron runtime probe opened all 12 workbenches, verified each
`.svc-wb-body` rendered measured content, switched segmented controls, and
closed each sheet: **12/12**, zero failures.

## 3. Control audit — former page controls

| Former control | Current behaviour |
|---|---|
| Eight top action buttons / filters | Replaced by measured discovery, report export, register facets and real selection |
| Service table row click | Selects the measured service; drives dossier, graph and operation preview |
| Search input | Measured register filter by name/display/account/path |
| Four action buttons (start/stop/restart/config) | One stageable immutable preview per service; no SCM call |
| Export diagnostics | Measured redacted report JSON |
| 12 service cards | 12 specialised workbenches; no generic modal |
| Activity log | Append-only local preview journal; **0 executed operations** |
| Dependencies panel | Measured directed graph from provider + `Get-Service` dependency enrichment |

## 4. Measured runtime evidence (development Electron, 2026-10-26)

Receipt: `apps/gemini-ui/visual-evidence/platform-00/native-smoke-dev.json`.

- Final session: `complete`, progress `100`, read-only, mutation `none`.
- **271 services** (115 running, 156 stopped), 223 measured dependency edges,
  **187 protected**, 51 non-delayed automatic, 196 manual, 11 disabled,
  17 delayed automatic, 16 non-Windows-path services.
- **200 SCM events** available for the last 7 days (bounded).
- **105 svchost hosts** with measured working set and hosted-service counts.
- Elevation: **standard user**, no automatic elevation; one warning (not elevated).
- Snapshot receipt: `services:ca4cff30cefa96f20a0a53cf`.
- Journal: one immutable preview staged by the runtime probe; **0 executed operations**.

Important measured correction: on this Windows build `Win32_Service.Dependencies`
returned no rows even where `Get-Service` reports dependencies. The graph stage
adds a bounded `Get-Service ServicesDependedOn` enrichment and only then shows
223 edges. If both sources are empty, the graph is labeled empty rather than
inferred.

Runtime interaction proofs:

- `servicesControlProbe`: register rows, a staged stop preview, plan receipt,
  journal row and visible mini activity row.
- `servicesToolProbe`: 12/12 workbenches opened, controls switched, closed.
- `servicesKeyboardProbe`: tool focus → sheet opens focused on Close → Escape closes.
- `servicesRtlLayout`: Arabic `rtl`, six KPI cards within width, no horizontal overflow.
- `services1366Layout`: operation preview at top 341 px (visible), 12 tools,
  footer visible, dark theme, inner scrolling works, no horizontal overflow.

## 5. Security and safety

- Eight fixed `knoux:services:v1:*` channels. No run/control/apply channel.
- Trusted sender, top-frame origin and typed request validation.
- Only fixed read-only PowerShell scripts (`Win32_Service`, `Get-Service` dependencies,
  elevation check, bounded SCM events, svchost processes). No `sc.exe` or service-control
  command is spawned.
- Six gates: start, stop, restart, startup-type, protected bypass, elevation.
- Protection policy is capability-based, not just fixed names: critical role map +
  kernel/system driver + `AcceptStop:false` (non-stoppable). This measured 187 protected
  services on the host.
- Every operation plan is immutable with `execution.available:false`; protected services
  and running dependents are explicit conflicts.
- No service start/stop test was performed because it requires separate explicit approval.
- Report redaction is on by default; packaged executable remains unsigned.

## 6. Tests and gates

| Gate | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run test:services` | PASS — controlled SCM fixture, protection policy, plans/journal, refusal, cancellation, provider failure, no-control static scan, renderer parity |
| All prior native regressions | PASS |
| `npm run desktop:smoke` | PASS — `servicesOk`, `servicesLayoutOk`, 12/12 workbenches, keyboard/RTL, operation-preview visibility |
| `npm run desktop:packaged-smoke` | PASS — same checks from `win-unpacked` |

## 7. Visual evidence

`apps/gemini-ui/visual-evidence/platform-00/`:

- `services-measured-dev.png` (1672×941, dark)
- `services-measured-dev-light.png`
- `services-measured-dev-ar-light.png` (Arabic RTL; numeric order kept LTR)
- `services-measured-dev-1366.png` (operation preview + activity visible, footer pinned)
- `services-measured-dev-1920.png`
- `services-workbench-dev.png` (privacy-safe SCM register/dossier sheet)
- packaged equivalents: `services-measured-packaged*.png`, `services-workbench-packaged.png`

The source gap is resolved: the operation preview and a two-row service activity
strip sit in the visible right rail, and the dependency pane has a bounded
184–210 px height with capped nodes (`+N` shown beyond eight per side). Service
history and actions remain reachable through the page's focused inner scroll and
the persistent footer.

## 8. Honest limitations and gated work

- No service was started, stopped, restarted or reconfigured. No approval for such a test was given.
- Protected policy is intentionally conservative; 187 of 271 services are denied.
- SCM events are bounded to 200 rows / 7 days; event IDs are shown without inferring exit codes.
- svchost working sets are shared host values; no per-service memory is invented.
- State history and diagnostics depend on System event log access; denial is labeled.
- The old shared universal renderer infrastructure remains for other pending sections,
  but the Services route no longer imports it.
- A future SCM executor must be separately approved, elevation-scoped, dependency-aware
  and must verify effective state.

## 9. Release record

The implementation is committed on `feat/gemini-missions` (`9658754`), with the
acceptance record at `87d38da`, pushed to the only authorized remote, and
integrated into `main` after Gemini Platform CI run 40362298717 was green.
Remote SHA, CI run and integration result are recorded in
`missions/MISSION_SEQUENCE_PROGRESS.md`.
