# KNOuX Smart Gemini — Product Gap Audit

Date: 2026-10-27 (Asia/Dubai)
Repository: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`
Branch: `feat/gemini-missions`
Purpose: a single honest inventory of what is implemented, what is only measured/preview, what is blocked, and what must be decided next. This is not a marketing status page.

## 1. Baseline

Before this increment, `main` was at `86cf321` (merge of the verified Scan/Applications work, identical tree to `87ae9a8`). This increment is committed at `35e2071` with the root-test CI fix `81bb49d`, merged into `main` at `37caf3a` (identical tree), and CI run `40441496894` is SUCCESS. It adds:

- Cleanup 12/12 and Startup 12/12 workbenches on `ServiceWorkbenchHost`.
- Main-process Google desktop OAuth + DPAPI-backed grant storage + bounded read-only Sheets.
- Real Google state in the hub while the other nine services stay labelled fixtures.
- A navigation hash-listener fix that removes stale-closure route reversions.
- Expanded offline tests and smoke probes.

The final development Electron pass is green; commit/CI/main integration are complete. Packaged smoke for this increment remains the only pending release gate.

## 2. Domain status (product functionality, not visual approval)

| Domain | Working now | Missing / blocked | Honest status |
|---|---|---|---|
| Home | Real system/services/files/apps/scan/automation KPIs, volumes, recent files, journals, review-only pending actions, workspace navigation | Global indexed search, in-place execution, deeper assistant actions | PARTIAL |
| Smart Scan | Measured quick/deep/service scans, source indexing, cancellation, history, findings, 10 workbenches, export | Mutation/cleanup/startup/app-repair execution, wider permissions, scheduled scans (automation is draft-only) | MEASURED_READ_ONLY |
| Organization Studio | Sources, visual library, collections, rules, destinations, immutable native plan preview, history, suggestions, 9 stages | Apply, undo, real journal for executed moves, staging executor, verification/rollback | PREVIEW_ONLY / BLOCKED |
| Google Workspace | Desktop OAuth PKCE S256, loopback, DPAPI grant, disconnect/revoke, add spreadsheet ID/URL, metadata, bounded read, real connection states | Live consent and real Sheets read not performed; no Drive search; Gmail/Tasks/Forms/Contacts/Calendar/Picker/Slides/Chat/Classroom providers; light theme/cinematic views | CONNECTABLE_AWAITING_CONSENT; nine services fixture-only |
| Applications | Measured inventory, Authenticode, search, publisher, date filters, bounded size, package/WinGet reads, leftover candidates, immutable removal plan, 12 workbenches | Uninstall/update/association/startup writes; no executor or verified postcondition | MEASURED_READ_ONLY / PARTIAL |
| Files | Sources, inventory, search, metadata, hash, empty folders, recents, large files, plan handoff, 12 workbenches | Apply/undo/staging executor; real move/rename/verification journal | PREVIEW_ONLY / BLOCKED |
| Storage | Volumes, capacity, history, folder analysis, duplicate candidates/verification, treemap, rankings, 12 workbenches | Defrag/TRIM, SMART, physical drive identity, reclaim executor, removable classification | MEASURED_READ_ONLY; several UNSUPPORTED/BLOCKED |
| Cleanup | Measured candidates, safety classes, estimate, vault/journal evidence, schedule draft, report clipboard, immutable plan staging, 12 workbenches | Delete/move/quarantine/recycle purge, DISM/update reset, scheduled task creation, undo executor, PDF output | REVIEW_ONLY / BLOCKED |
| Startup | Measured autoruns, services, tasks, boot events, journal evidence, delay draft, batch staging, 12 workbenches | Registry/StartupApproved/task/service writes, elevation, real rollback | READ_ONLY / BLOCKED |
| System | Live metrics, processes, services, events, drivers, network, sockets, hardware, timeline, 36 services, 12 gates | Process/service/network mutations, traceroute execution (preview), host write, hardware control | MEASURED_READ_ONLY |
| Repair | DISM/SFC/network/update/restore evidence, 10 commands, 8 gates, immutable previews, journal preview, 12 workbenches | Every repair execution (DISM/SFC/netsh/service/restore/update reset), elevation, real journal/undo | PREVIEW_ONLY / BLOCKED |
| Services | SCM inventory, dependency/evidence views, immutable change previews, journal preview | Start/stop/restart/config changes, elevation, real rollback | MEASURED_READ_ONLY / BLOCKED |
| Automation | Local workflow draft, DAG validation, templates, dry-run, schedule preview, journal, export, 12 workbenches | Scheduler, timer, executor, real run history, notification delivery, retention/backup executors | DRAFT/DRY-RUN ONLY |
| Settings & Assistant | Non-secret local profile, density/accent preview, credential-free export/import/reset, disabled unsupported guards, session-only AI warning | Native secure vault, live AI provider proxy, live Google authorization, light parity, engine/turbo execution | PARTIAL / BLOCKED |
| Real Service Activation (15) | Capability ledgers and approval/safety model | Every effectful executor, per-run approval, disposable-fixture side-effect tests, postcondition verification, journal/undo | NOT STARTED |

## 3. Interactive workbench coverage (15A)

Implemented on the typed `ServiceWorkbenchHost`: Files 12/12, Studio 9/9, Storage 12/12, Smart Scan 10/10, Applications 12/12, Cleanup 12/12, Startup 12/12. Google Sheets has a real but separate read-only workbench; other Google services are previews.

Still using older modal/inline sheets: System (36), Repair (12), Services (12), Automation (12), Settings, Home. These are functional but not yet migrated to the pinned/expanded host.

## 4. Cross-cutting gaps

1. **No real mutation executor exists anywhere.** Every "action" is read-only, review, plan, preview, dry-run or a settings handoff. This is the largest product gap relative to the activation mission.
2. **No end-to-end execution/recovery proof.** No per-run approval, no disposable-fixture side effects, no postcondition verification, no immutable execution journal with undo for real file/registry/service/startup/cleanup operations.
3. **No live Google consent or Sheets read.** The OAuth/service code is offline-tested; the final required native round trip and real authorized read remain gated on explicit owner approval and a chosen spreadsheet.
4. **Nine Google providers are fixtures.** Gmail, Tasks, Forms, Contacts, Calendar, Picker, Slides, Chat and Classroom have no OAuth scopes, providers or real workbenches.
5. **No Drive scope.** Sheets can only read IDs the user adds; there is no Drive-wide search.
6. **No secure native vault/live AI.** Settings has no DPAPI credential vault for AI keys and no provider proxy/consent flow.
7. **Light theme parity** for Google Workspace and Settings is explicitly unsupported; other domains should be rechecked after migration.
8. **Global Home search and in-place execution** are not implemented; Home cards are deep links.
9. **No process/service/startup/network mutation**, no repair execution, no scheduler, no notification delivery, no backup/restore execution.
10. **Packaging is still a preview build** (`signAndEditExecutable: false`, unsigned); no installer/signing/release channel.
11. **No soak/performance/cross-machine test.** Smoke runtime is long and sensitive to WMI load; the final dev/packaged pass for this increment is still pending.
12. **CI does not run Electron smoke.** CI runs lint/build and native/static suites only; visual/native smoke remains a local manual gate.

## 5. Verification gaps and incidents

- The last completed dev smoke before this audit was green for system/repair/services/automation/workspace/settings/home and all workbench probes except Applications initial readiness; Applications data loaded later (1366 layout green), indicating a harness wait/output issue rather than a bridge failure. Wait windows were extended.
- Final development Electron smoke after the navigation and wait fixes: PASS on every check, including all 14 domains, Google status, workspace states, 12 workbench probes, screenshot and window control. The applications initial capture also loaded measured data.
- Packaged smoke for this increment has not been run; the prior packaged pass covers the earlier Files/Studio/Storage/Scan/Applications increment only.
- CI run `40441496894` is SUCCESS; it runs lint/build and every static/native suite, not Electron smoke.
- During one visible smoke capture, the test window was interactive and an external Google account connection appeared in the disposable smoke profile. No spreadsheet was selected or read. The smoke profile and its encrypted grant were deleted by the runner; no token file remains. Workspace screenshots containing the account email were deleted and are not committed. Input is now ignored during smoke capture and Google state is reset before each smoke.
- CI/static suites pass: `test:native`, `test:google` (14 checks), `test:workspace`, `test:workbench` (12 checks), `test:navigation`, plus the established domain suites.
- No live Google token, client JSON or PII is committed; the client JSON path is external and packaging excludes it.

## 6. Security and privacy posture

- Tokens never cross the renderer bridge; no generic IPC/URL/path from renderer.
- Refresh token encrypted with Electron safeStorage (DPAPI) in main; disconnect revokes best-effort and deletes locally.
- PKCE S256, random state, 127.0.0.1-only loopback, fixed endpoints, timeout and path checks.
- Four fixed scopes only; no silent scope expansion.
- Google external Testing refresh tokens may expire after 7 days.
- The installed-app `client_secret` is not a server secret; PKCE is used and the secret stays main-process only.
- The smoke can display real account state if a person interacts; this was addressed with input blocking, profile reset and deletion of affected screenshots.

## 7. Decisions needed from the owner

1. **Live Google test:** explicitly approve opening Google consent in the system browser, connect the account, add a disposable spreadsheet URL/ID, read a bounded range, capture redacted evidence, then disconnect/revoke.
2. **Priority:** finish the remaining 15A workbenches (System, Repair, Services, Automation, Settings, Home) before starting real executors, or start Mission 15 executors immediately for Studio/Files with disposable fixtures.
3. **Executor safety contract:** approve the per-run consent UI, immutable plan, dry-run, postcondition checks, journal and undo scope before any live file/registry/service/startup mutation.
4. **Packaging/release:** decide whether to invest in signed installer, auto-update, code signing and CI Electron smoke.
5. **Google scope expansion:** decide whether to request Drive metadata scope for a real spreadsheet picker, or keep add-by-ID/URL only.
6. **PII/consent policy:** confirm that local smoke may show account state; input blocking is now enforced.

## 8. Recommended next safe work (no live mutation)

1. Finish the final Electron dev and packaged smoke for this increment; commit, CI and merge.
2. Migrate System/Repair/Services/Automation/Settings/Home to the typed host.
3. Add the live-consent-gated Google Sheets evidence only after explicit approval.
4. Then implement Mission 15 in the order Studio → Files → Cleanup → Startup → Services/Repair with disposable fixtures and undo.
