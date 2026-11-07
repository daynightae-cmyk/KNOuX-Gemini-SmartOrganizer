# D13 Automation — service-by-service execution trace (2026-11-05)

## Evidence boundary
- Canonical working copy: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`, `main`, baseline `db70f018c1c1a11a8d4c1d31f277957287886a59`.
- Current changes are **uncommitted**. This document is a current-source audit, not certification of published or packaged software.
- Twelve specialized workbenches exist in `src/automation/AutomationServiceWorkspaces.tsx`. The renderer uses both `window.knouxAutomationV1` (drafts, previews, journals) and `window.knouxOperationsV1` (narrow native observation runs and foreground schedules).
- Native run IPC: `electron/native/operation-ipc.cjs` allowlists methods and fields → `AutomationRunner` / `AutomationScheduler` initialized in `electron/main.cjs`. Native source/saved-plan validation and `operations.confirm` guard actual observation execution; receipts use `ProtectedActionStore`.
- Controlled tests run with owned fixtures/mocked providers/virtual clock; no owner's files, registry, services, startup settings, or cloud accounts were modified.
- **Never equate an existing workbench with a working action provider, or a dry-run journal with an actual execution receipt.**

## D13 vertical-slice inventory

| Service ID | UI | IPC and provider | Consent / result / receipt | Evidence-backed status and remaining gap |
| --- | --- | --- | --- | --- |
| `auto-smart-scan` | `SmartScanWorkbench` + `AutomationRunWorkbench` | Draft/save/preview through `knouxAutomationV1`; actual `automationRunPlan/automationRun` via allowlisted Operations IPC → `AutomationRunner` → `ScanBridge` (`quick_scan`/`system_health_pulse`) | Selected source + exact hash + checkbox + native confirmation; protected run receipt, cancellation; owned-file runner fixtures exercised | **PARTIAL**: real read-only observations only; no arbitrary action chain, cleanup, backup, or background scan job |
| `auto-schedule-manager` | `ScheduleManagerWorkbench` + native run panel | `schedulePreview`/save and `automationScheduleArm/Pause/Schedules` → `AutomationScheduler` | Exact-plan arm consent and per-occurrence native confirmation; status and protected schedule record; virtual-clock tests | **PARTIAL**: focused-app timers only; no OS background schedule, rearm required after restart |
| `auto-run-history` | `RunHistoryWorkbench` with separate protected native receipts section | `knouxAutomationV1` dry-run journal; `automationRunReceipts` → `AutomationRunner.receipts()` → `ProtectedActionStore` | Read-only retrieval; explicit loading/error/unavailable/empty states; native steps/status shown separately from preview entries | **IMPLEMENTED-NOT-VERIFIED** for current UI extension until current full-shell native history view is exercised with a real receipt; no claim of full production history |
| `auto-templates` | `TemplatesWorkbench` | Native `templates/save` → eight bundled typed workflow definitions → versioned local draft store | User-initiated local save + draft version/snapshot; validation tests; no run without separate native consent | **PARTIAL**: template library and drafts work; template-dependent *actions* remain separately gated |
| `auto-schedule-plan` | `SchedulePlanWorkbench` | `schedulePreview` → host-zone `nextOccurrences` | Read-only next-five-occurrence preview, no scheduler mutation and no run receipt | **PARTIAL**: recurrence preview, not arbitrary cron execution or OS Task Scheduler |
| `auto-cleanup-plan` | `CleanupPlanWorkbench` | Local typed workflow/dry-run provider; no cleanup executor in D13 | Preview/draft only; no destructive consent/receipt because no execution allowed | **PARTIAL**: must integrate approved Mission 08 executor with fingerprinted plan, risk review and disposable effects/undo tests |
| `auto-notify` | `NotifyWorkbench` | Local policy save/preview; no external transport | In-app/journal channel policy only; no outbound delivery receipt | **PARTIAL**: no proven real external notification provider; needs consent/transport, retries and receipts |
| `auto-quiet-hours` | `QuietHoursWorkbench` | Local policy save + `AutomationScheduler.quietNow()` gate for armed foreground observations | Arm/run consent remains required; scheduler defers and records status; virtual-clock tests | **PARTIAL**: tested scheduler gating, not a universal OS/app-wide quiet-hours service |
| `auto-battery-policy` | `BatteryPolicyWorkbench` | Runtime battery evidence if hardware supports it + `AutomationScheduler.tick()` power guard | Unknown battery/AC evidence refuses scheduled action; virtual-clock tests | **PARTIAL**: real battery hardware/device cases and wider power policies not established |
| `auto-retention` | `RetentionWorkbench` | Draft retention and local dry-run journal preview; no approved pruning executor | Preview only, no actual artifact deletion receipt | **PARTIAL**: requires narrowly scoped retention of app-owned artifacts, explicit approval, interruption/undo semantics if feasible |
| `auto-export` | `ExportWorkbench` | JSON download, native `validateImport` and explicit save through versioned `saveWorkflow` | Exact validated text is required; imported ID is cleared and draft forced disabled/no execution; native fixture proves persisted round-trip without overwriting the original | **IMPLEMENTED-NOT-VERIFIED**: controlled import/save/reload passed; real Electron UI and packaged acceptance still required |
| `auto-backup-plan` | `BackupPlanWorkbench` | Draft source/destination selection and preview; no D13 copy executor | No real copied-file/postcondition receipt; destination grant required | **PARTIAL**: integrate existing safe file-copy provider only with owned-fixture effect, hash verification, collision protection and recoverability |

## Current independent acceptance evidence
- `python scripts/verify-workspace.py` — exit 0, current working path verified.
- `npm run lint` (TypeScript `tsc --noEmit`) — exit 0 after native history integration.
- `npm run test:automation` — exit 0 after run-history trace assertion and native JSON import/save/reload round-trip; imported draft gets a new ID, remains disabled, and existing saved workflow is not overwritten.
- `npm run test:workbench` — 16 host/service-wiring checks exit 0.
- `node scripts/automation-runner-test.cjs` and `automation-scheduler-test.cjs` — exit 0 in prior verified run; their scope is owned-fixture measurements and a virtual clock, **not live background scheduling**.
- `npm run desktop:smoke` was attempted on 2026-11-05. The build succeeded, but the smoke updated tracked visual evidence PNGs and was deliberately stopped to protect the approved screenshot baseline: `DESKTOP_SMOKE_EXIT=1`. Treat full-shell and current native-history renderer acceptance as **NOT VERIFIED**. Its changed PNG files remain uncommitted and untouched pending safe visual review; no reset/restore/clean was run.

## Ordered unresolved gates
1. **D13-V1:** Prove protected run receipts render in `auto-run-history` in *development and packaged Electron* with real disposable profile, correct empty/error/loaded states and accessibility; compare screenshots in approved dark/light and RTL before announcing VISUAL VERIFIED.
2. **D13-V2:** Audit 12 outcome contracts beyond visual availability; for supported safe actions, build/reuse typed native providers with consent, postconditions, durable receipts and disposable-fixture effects. Keep unsupported external/privileged changes explicitly gated.
3. **D13-V3:** No unattended OS task should run without a separately approved security design; retain foreground-only schedule semantics.
4. **D13-V4:** Reassess each entry in the canonical 181-service capability matrix, then prioritize gaps based on real native/product value rather than stale handoff claims.
5. **OTHER:** Bundle code-splitting warning, real OAuth/live credentials, code signing and visual parity are independent gates; do not misrepresent the completed visual workspaces as missing.

## Git integrity
- Preserve existing uncommitted D13 fixes; no reset/clean/rebase/force, no branch/worktree deletion.
- No commit/push/deploy is claimed or authorized in this audited slice.
