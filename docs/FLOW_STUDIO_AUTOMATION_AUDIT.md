# KNOuX Mission 13 — Flow Studio Automation Audit

Date: 2026-10-26
Repository: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`
Branch: `feat/gemini-missions`
Starting feature HEAD: `1c677eeb5af2e360c21e7980bab273f77746ca14`

## 1. Scope delivered

Mission 13 replaces the fixture-driven Automation page with a measured local
Flow Studio for typed workflow drafts, DAG validation, versioned persistence,
deterministic dry-runs, schedule occurrence preview and a read-only journal.
There is **no workflow executor, no background scheduler timer, no approval-to-run
channel and no external notification, file copy, delete, registry or privileged
action**. Execution remains `not-implemented` in every contract, page, report and
workbench.

| Layer | File | Role |
|---|---|---|
| Native coordinator | `electron/native/automation-bridge.cjs` | Five-stage discovery, atomic workflow store with history, dry-run + journal, schedule preview, import validation, redacted report |
| Providers/validators | `electron/native/automation-providers.cjs` | 12 tools, 5 gates, 5 stages, 8 templates, typed DAG validation, host-timezone occurrence math, import validation |
| Main IPC | `electron/main.cjs` | Trusted-sender guard, typed arguments, 13 fixed `knoux:automation:v1:*` handlers, save restricted to a local draft |
| Preload | `electron/preload.cjs` | `window.knouxAutomationV1` versioned API |
| Contracts | `shared/native-contracts.ts`, `shared/native-contract.json` | `automation.v1` types and capability modes (`read-only` except user-initiated `cancel`/`save`) |
| Renderer controller | `src/automation/native.ts`, `useAutomation.ts` | Envelope validation, polling, save/dry-run/preview/import/report |
| Catalog/model | `src/automation/catalog.ts`, `model.ts` | 12 bilingual tools, node/risk vocabulary, deep drafts, derived categories, recurrence expression |
| Shared UI | `src/automation/ui.tsx` | Auto-fit workflow canvas, zoom/Fit/Minimap, ports, typed inspector, palette, trigger/quiet-hours/policy editors, dry-run timeline |
| Workbenches | `src/automation/AutomationCoreWorkbenches.tsx`, `AutomationPolicyWorkbenches.tsx`, `AutomationServiceWorkspaces.tsx` | 12 specialised panels with a focus-trapped sheet |
| Page | `src/pages/AutomationPage.tsx` | Six measured KPIs, workflow library, canvas, inspector, schedule, dry-run, tools, journal, actions |
| Design | `src/automation.css` | Authored dark/light/RTL on measured sys tokens; 1366/1672/1920 |
| Tests | `scripts/automation-native-test.cjs`, `src/pages/tests/AutomationPage.test.tsx` | Deterministic controlled store tests and renderer parity |

Removed fixture code:

- `src/lib/automation-inventory.ts` (391 lines of `INITIAL_FLOW_NODES` /
  `INITIAL_OPERATION_STAGES` fixtures).
- `src/components/automation/AutomationWorkspaces.tsx` (generic modal reuse).
- Fixture-driven page tests were replaced by the deterministic renderer suite.

## 2. Canonical service coverage (12/12)

`auto-smart-scan`, `auto-schedule-manager`, `auto-run-history`, `auto-templates`,
`auto-schedule-plan`, `auto-cleanup-plan`, `auto-notify`, `auto-quiet-hours`,
`auto-battery-policy`, `auto-retention`, `auto-export`, `auto-backup-plan`.

The packaged Electron probe opened all 12 workbenches, verified each
`.auto-wb-body` rendered content, switched segmented controls, and closed each
sheet: **12/12**, zero failures. Every tool has its own contextual panels; no
generic modal is reused.

## 3. Control audit — real behaviour

| Control / event | Current behaviour |
|---|---|
| Start / cancel / re-discover | Bounded five-stage native discovery with progress and cancel |
| Refresh store / footer refresh | Re-reads the local workflow store snapshot |
| Library search | Filters saved drafts and templates by name/id/category |
| Saved workflow row | Loads a deep draft copy; never mutates the stored version until Save |
| Template card / instantiate | Creates a unique deep draft with version 0; nothing is executed |
| Workflow name / add node / node palette | Local draft edits; adding a node appends a typed edge |
| Canvas node click / zoom / Fit / Minimap | Selection drives the inspector; auto-fit keeps all nodes visible with a 55–100% cap |
| Node label / typed config / remove | Local draft edits with type-aware inputs |
| Trigger type / cadence / time / weekdays / intervals / exclusions | Draft schedule fields; preview queries the native provider |
| Preview schedule | Native host-timezone preview of the next five occurrences; no job scheduled |
| Quiet hours / policy editors | Draft policy metadata; no runtime suppression exists |
| Dry-run | Native topological dry-run with would-fire, blocked, required and preview-artifact steps; writes one local journal receipt |
| Save draft | User-initiated native store write; increments the version and retains history |
| Export draft / report / history | Local JSON download; report redacted by default |
| 12 tool cards | Each opens a specialised workbench with its own data and controls |
| Smart Scan scope modules | Interactive inventory/capacity/system checkboxes bound to the action node |
| Schedule week/list, category filter, selection, enable metadata | Real draft and selection state; category is derived from bound tools |
| History time filter, search, export, run evidence | Filters and inspects the local journal; duration/artifact are explicitly not measured |
| Template search/category/instantiate | Filters the built-in gallery; estimates are labelled unmeasured |
| Recurrence expression | Descriptive expression derived from the typed trigger; arbitrary cron is never parsed |
| Import validation | Native schema/DAG validation of pasted JSON; accepted imports are not executed |
| Journal row / Open history | Opens the dry-run history workbench |
| Toasts | Report actual success/failure or explicitly state that a sample sent nothing |

No button claims a native execution that does not exist. Every mutating action is
either a local draft save or a local journal write, both user-initiated.

## 4. Measured runtime evidence

Receipts: `apps/gemini-ui/visual-evidence/platform-00/native-smoke-dev.json` and
`native-smoke-packaged.json` (fresh per-run profile, app version `0.4.0-gemini.0`,
Electron `43.4.1`).

Development Electron, 2026-10-26 21:23 local:

- Final session `complete`, progress `100`, read-only, mutation `none`, warnings `0`.
- Snapshot: **1 saved draft, 1 history record, 8 templates, 1 dry-run journal,
  5 gates, 6 measured sources**, receipt `workflows:45f3ae2920656b25a05914ef`.
- Runtime: host timezone `Asia/Dubai`; **no battery measured**; one authorized
  Studio source (`studio-source`, 7 files). The runtime stage is honestly `partial`
  with the note that battery-gated conditions cannot be evaluated on this device.
- Control probe: loaded the Smart Scan template, added a node (4 → 5), produced a
  deterministic dry-run timeline and one journal row, saved a draft and verified
  the saved-workflow row and KPI.
- Tool probe: **12/12** workbenches opened, content verified, segmented controls
  switched, sheets closed.
- Keyboard probe: tool card → sheet focus on Close → Escape closes.
- RTL: `rtl`, six KPI cards within width, no horizontal overflow.
- 1366×768: canvas visible at top 409 px, 12 tool cards, footer visible, inner
  scroll works, dark theme, no horizontal overflow.
- Screenshot bytes: base 380,837; workbench 262,239; light 266,155; Arabic 237,462;
  1366 296,619; 1920 441,144.

Packaged `win-unpacked` smoke repeated every check with the same results
(`automationOk`, `automationLayoutOk`, 12/12 tools, keyboard/RTL, 1366 canvas and
footer). Screenshot bytes: base 381,119; workbench 262,229; light 265,956; Arabic
237,208; 1366 296,597; 1920 440,808.

Native deterministic test (`test:automation`) additionally verified:

- 12 tools, 5 stages, 5 gates, 8 templates and 1 world.
- Template drafts contain no execution; a valid workflow saves as version 1 and a
  second save becomes version 2.
- A **new bridge instance** reloads the persisted workflow versions and journal
  (restart persistence at the bridge boundary).
- Dry-runs are deterministic and block every action step.
- Cycles, missing actions, unreachable nodes, duplicate edges and unknown tools
  are rejected with typed error codes.
- Daily preview returns five local occurrences; a foreign timezone is refused.
- Import validation accepts a valid `knoux.workflow.v1` and rejects a foreign schema.
- The report states that no workflow ran; the bridge exposes no execution method.
- Cancellation settles without a snapshot.
- Static scan finds no executor, shell, scheduler timer or external channel.

Honest persistence note: the Electron smoke uses a fresh profile per run, so it
proves in-session save/reload, not cross-launch persistence. Cross-launch reload
is proven by the native test's new bridge instance reading the same on-disk store.

## 5. Safety, permissions and provenance

- Thirteen fixed `knoux:automation:v1:*` channels. There is no run/execute/apply
  channel. `automation.save` is `user-initiated` and only writes a local draft;
  `automation.cancel` is user-initiated; all other channels are `read-only`.
- Trusted sender, top-frame origin and typed request validation.
- The store is atomic (temporary file + rename) under `userData/knoux-automation`;
  the journal is append-bounded to 50 entries. Limits: 50 workflows, 32 nodes,
  64 edges, 8 templates.
- No `child_process`, shell, `setTimeout`/`setInterval`, scheduler, network or
  external channel exists in the native provider/bridge.
- Five gates: workflow execution, cleanup execution, backup copy, external
  notifications, artifact deletion. Each names its owning mission and reason.
- Import accepts only schemaVersion `1.0`; action labels mentioning execution
  generate a warning but still cannot execute.
- Reports redact the home, temp and Windows user path by default.
- No elevation, service, registry, file or notification operation was performed.
- No credentials, tokens or PII exist in the implementation or evidence.

## 6. Tests and gates

| Gate | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run test:automation` | PASS — controlled store, versioning/reload, cycle/refusal, schedule/DST-timezone, import, cancellation, no-executor static scan, renderer parity |
| All prior native regressions | PASS (`test:native`, `test:studio`, `test:files`, `test:storage`, `test:scan`, `test:apps`, `test:cleanup`, `test:startup`, `test:system`, `test:repair`, `test:services`) |
| `npm run desktop:smoke` | PASS — automation probe, 12/12 workbenches, keyboard/Escape, RTL, 1366 canvas/footer |
| Packaged smoke (`native-smoke.cjs --packaged`) | PASS — same checks from `win-unpacked` |

## 7. Visual evidence and the canvas gap

`apps/gemini-ui/visual-evidence/platform-00/`:

- `automation-measured-dev.png` (1672×941, dark)
- `automation-measured-dev-light.png`
- `automation-measured-dev-ar-light.png` (Arabic RTL; no overflow)
- `automation-measured-dev-1366.png` (canvas and footer visible)
- `automation-measured-dev-1920.png`
- `automation-workbench-dev.png` (Smart Scan scope, permission gate, quiet hours,
  draft policy)
- packaged equivalents: `automation-measured-packaged*.png`,
  `automation-workbench-packaged.png`

The observed “flow canvas can waste horizontal space” gap is addressed by
auto-fit on workflow change and a two-column editor that stacks below 1400 px.
At 1366 the canvas is visible with all five nodes legible at 89%; at 1672 the
library/canvas/inspector rail fills the shell; links and ports are preserved.
The workbench canvas caps auto-fit at 100% to keep node text legible, so a sheet
with five nodes leaves some unused right-side width rather than upscaling.
Long workbench content scrolls inside the focus-trapped sheet; the page footer
remains pinned and no document-level horizontal overflow occurs.

## 8. Honest limitations and gated work

- **No execution engine, background scheduler, automatic restart recovery of an
  in-flight run, idempotent execution step tokens, or approve-to-execute flow was
  implemented.** Draft persistence and dry-run journaling survive reload, but
  “crash resume idempotency” for actual execution is not applicable because no
  step ever executes. This is the main unmet part of the mission objective and is
  gated for a separate, explicitly approved scheduler/executor mission.
- Schedule preview supports daily, weekly and interval recurrences with exclusions
  in the host timezone only. Arbitrary cron text is not parsed; the displayed
  recurrence expression is descriptive.
- No external notification, email, webhook, file copy, cleanup deletion, registry
  or privileged action exists.
- Template “estimated time saved” is labelled **not measured**; no number was invented.
- Task category is derived from bound tools, not persisted as a workflow field.
- The host exposes no battery, so AC/battery-gated conditions cannot be evaluated
  here; the UI reports that limitation instead of inventing a charge state.
- The old shared universal renderer remains for other pending sections, but the
  Automation route no longer imports it.

## 9. Release record

The implementation and evidence are committed on `feat/gemini-missions` at
`5ac87f58b7b80918bc0e7aa2f847647ac66699c2`. Gemini Platform CI run
`40369661654` is SUCCESS (lint, build, native contract and every native suite,
including `test:automation`). The acceptance commit and the fast-forward `main`
SHA are recorded in `missions/MISSION_SEQUENCE_PROGRESS.md`.
