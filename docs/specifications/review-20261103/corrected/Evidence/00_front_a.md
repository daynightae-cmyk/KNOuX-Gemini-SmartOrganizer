# KNOuX SmartOrganizer — Definitive Codex Execution Specification

**Scope:** all 14 product domains · all 181 registered service entries
**Audience:** the Codex implementation agent (single writer, canonical Windows checkout)
**Authored:** 2026-11-03 from the evidence pack `KNOuX_CLAUDE_EVIDENCE_181_20261103_001923.zip` (snapshot 2026-11-03T00:19:24+04:00)
**Nature of this document:** an engineering specification. It contains no product code, no schedule, no sprint plan and no time estimates. Order of work is decided by dependency (Part 11), never by calendar.

---

## Part 0 — Document Control

### 0.1 What this document is and is not

This document tells Codex, for every one of the 181 registered services, what exists, what is verified missing, what must be built, how it must behave, how it must fail, and exactly which tests and evidence prove it complete. It supersedes Volumes 1–5 of the earlier blind-authored specification wherever they disagree, because those volumes were written without any evidence pack (Vol. 1 §1.1 says so). Where Volumes 1–5 are silent or consistent, their intent is preserved and restated here so that this single file is self-sufficient.

It does **not** claim that any service is complete beyond what the evidence supports. The pack's own README states the CSV "contains 181 registered service rows, NOT 181 confirmed complete native engines."

### 0.2 Evidence provenance and its hard limit (read before trusting any statement)

| Class | Meaning | Marker used below |
|---|---|---|
| Archive-verified | Read directly in the evidence pack by the author | **[PACK]** |
| Owner-stated | Stated by the owner in this directive; the pack contains no source tree to confirm it | **[OWNER]** |
| Web-verified | Fetched from an official vendor page during authoring (2026-11-03) | **[WEB]** |
| Recalled, not re-fetched | Platform or vendor behaviour the author knows but did not re-verify this session | **[RECALL — VERIFY]** |
| Requirement | Something Codex must build or prove | **[REQ]** |

**The evidence pack contains documentation only: 9 files (ledger CSV, capability matrix, registry evidence, workbench acceptance, host audit, implementation CSV, mission ledger JSON, visual handoff, functionality standard). It contains no source code, no test output, no Git objects.** Consequently:

1. The owner-stated WinGet facts (Part 7.1) are treated as authoritative **[OWNER]** and are not independently confirmed from `app-bridge.cjs` by the author. Codex must confirm them by reading the file (Step 0 in Part 9) and correct this document if the file differs.
2. The **exact four OAuth scopes** that the existing Google Sheets provider requests cannot be extracted from the pack. The pack records only "four fixed scopes" **[PACK]** (`SERVICE_CAPABILITY_MATRIX.md`, row `mission-04-01`). Codex must read them verbatim from the main-process OAuth module and record them (Part 7.2.3). The pack **does** establish that **no Gmail or People/Contacts scope is currently requested**: rows `mission-04-02` and `mission-04-05` read "fixture preview only; live provider and scope not implemented" **[PACK]**.
3. No claim in this document that a function, symbol or file exists is stronger than "named in the evidence". Symbols such as `ScanBridge`, `StorageBridge`, `StorageVault`, `StartupActions`, `ServiceActions`, `AutomationRunner`, `AutomationScheduler`, `ServiceWorkbenchHost`, `OperationEngine`, `StorageServiceFocus`, `ScanServiceWorkspace`, `AppServiceWorkspace`, `ServicesServiceWorkspace` are named in the pack; their file locations are **located by symbol search**, not asserted.

### 0.3 Snapshot facts **[PACK]**

| Fact | Value | Source |
|---|---|---|
| Canonical repo | `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer` | MISSION_LEDGER.json, standard |
| GitHub | `daynightae-cmyk/KNOuX-Gemini-SmartOrganizer` | same |
| Snapshot HEAD | `8ff81311e0b1cfae7c80080baea4d8338512fbef` | PACK_MANIFEST.json |
| `originMainTrackingRef` at snapshot | `8871103c7fd2a274a70fe2a069bb435f2ccb12ac` | PACK_MANIFEST.json; visual handoff §1 (directly queried remote main) |
| Dirty at snapshot | `docs/MISSION_LEDGER.json` modified; `docs/handoffs/VISUAL_FIDELITY_CODEX_20261102.md` untracked | PACK_MANIFEST.json |
| Active branch per standard | `feat/gemini-missions` | standard; host audit |
| Visual handoff start | branch `main`, HEAD `8871103…`, 8 modified + 761 untracked paths, no stash | handoff §1 |
| Open PR | #4 at `c01638ddc224054a21010205e5e91be037316365`, failing entry/SonarCloud/Vercel checks; **do not blindly merge** | handoff §1 |
| Branch with unique commits | `origin/v0/knoux-smartorganizer-integration-b432675e` (six unique commits) | handoff §1 |
| Protected checkpoint | `D:\KNOUX-Workspace\KNOuX_VISUAL_HANDOFF_CHECKPOINT_20261102-151606` (769 files, 383,015,386 bytes, manifest SHA-256 `ef1a4885…4238c`) | handoff §2 |
| Implementation SHAs in ledgers | `e819b2cad6c3437b2348a981600298fbda2a5e63` (live organization), `2a7fcbdcde400600a54aad5c737535eaf4f09c6b` (storage/cleanup wave 2), `71240ce10293914613e0b11a95ac88b3a40de269` (Studio full-stack) | LIVE_SERVICE_EXECUTION_STATUS_181.csv |
| Other branches named in earlier volumes | `codex/service-workspaces-20261101`, `openhands/native-services-20261102`, `openhands/native-services-cloud-20261102`, `codex/knoux-all-services-execution-20261102` | Vol. 1 §3, OpenHands mission |

**Uncertainty that must be resolved by Codex, not assumed:** whether `8ff81311…` is ahead of, behind or diverged from `8871103…`; whether `e819b2c`, `2a7fcbd` and `71240ce` are ancestors of HEAD; and whether the working tree already contains commits after the snapshot. The snapshot HEAD differs from the remote-main ref, so **the working tree at the snapshot is the newest known truth, and the ledger CSV (which cites those three SHAs) is the newest status document** — but "newest" is not "verified".

### 0.4 Authority order when documents disagree

1. Actual current source, branch state and fresh test receipts (once Codex has produced them).
2. `LIVE_SERVICE_EXECUTION_STATUS_181.csv` rows that carry an `implementation_sha` and `evidence` path (23 rows) — these are the only rows with commit-bound evidence.
3. `SERVICE_CAPABILITY_MATRIX.md` rows that name a provider, executor and test run (Studio, Storage, Cleanup, Startup, Services, Automation, Settings, Sheets).
4. `SERVICE_WORKSPACE_IMPLEMENTATION.csv` (89 of 181 rows are `UNASSESSED`).
5. `SERVICE_REGISTRY_EVIDENCE.md` (dated 2026-10-26; **historical**, explicitly superseded for the three live-organization rows and the aggregate counts).
6. `SERVICE_WORKBENCH_ACCEPTANCE.md` rows (**historical** blocked-write statements; its own header says "NOT TEST EVIDENCE").
7. Volumes 1–5 of the earlier specification (design intent only; never evidence of current state).

A later item never overrides an earlier item unless it cites a newer commit. A status is **never promoted** by this document; promotion requires Codex's own evidence record (Part 8.4).

---

## Part 1 — Reconciliation of the Evidence

### 1.1 Registry arithmetic **[PACK]**

- 181 advertised entries = 49 "mission-NN-NN" IDs (Home 12, Smart Scan 10, Studio 9, Google 10, Settings 8) + 132 slug IDs (Applications 12, Files 12, Storage 12, Cleanup 12, Startup 12, System/Network/Hardware 36, Repair 12, Services 12, Automation 12).
- `SERVICE_REGISTRY_EVIDENCE.md` lists 150 surfaces (132 slug IDs + 18 additional surfaces such as `google-*` and `settings-*`). 150 + 181 ≠ 331 distinct engines; the acceptance document states the overlap itself.
- **[REQ]** Codex must build `docs/SERVICE_ID_CROSSWALK.json` mapping each of the 181 spec IDs (`D05.08`) to the CSV ID (`app-updates`), the catalog/registry ID, the mounted workspace component, and the native operation IDs actually exposed through preload. Any service lacking one of these four is recorded as a gap of class "integration".

### 1.2 Documented contradictions and their resolution

| # | Contradiction | Resolution rule | Residual uncertainty |
|---|---|---|---|
| C1 | Registry (10-26) says `file-organize-apply/undo` have "absent (gated)" executors; the amendment in the same file and the live CSV say `e819b2c` implemented executor, receipts, undo on disposable Windows fixtures | Newer, SHA-bound CSV wins → `IMPLEMENTED_AND_TESTED_FIXTURES` | Reachability of `e819b2c` from HEAD unverified |
| C2 | Workbench acceptance rows for `mission-03-07` (Execution) and `mission-03-08` (History & Undo) say "BLOCKED; no write executor" / "no real undo" | Historical; superseded by `71240ce` rows in the live CSV | Same |
| C3 | Registry labels all ten `google-*` rows `CONNECTABLE_AWAITING_CONSENT`; matrix and live CSV say only Sheets is connectable and nine are `BLOCKED — fixture preview only` | A service with no provider **cannot** be connectable. Sheets = `CONNECTABLE_AWAITING_CONSENT`; the other nine = `FIXTURE_ONLY / BLOCKED` | None on direction; Sheets' live behaviour is unproven |
| C4 | Implementation CSV marks 89 rows `UNASSESSED` while the registry gives most of them `MEASURED_READ_ONLY` | Registry status is carried as **MEDIUM-confidence historical**; Codex must re-audit (Part 8.2) | High: registry predates ≥3 commits |
| C5 | Provisional class column disagrees with the registry class (e.g. `app-store-packages` C vs A; `startup-services`, `startup-tasks` C vs read-only evidence) | Split by capability: **browse = Class A, mutation = Class B/C**. Each service in Part 12 states which half exists | Matrix header says classes are provisional |
| C6 | `storage-removable`: registry `PARTIAL`, implementation CSV `READ_ONLY` | `PARTIAL`: classification is Windows `DriveType`, not USB transport; no eject executor | Packaged/USB-device acceptance NOT_RUN |
| C7 | `mission-14-04` Automated Protection & Guards: `UNSUPPORTED` while D07/D08 quarantine and D09/D12 executors already contain guard-like checks | Guards as a **policy product** are unsupported; enforcement points exist piecemeal. Spec D14.04 centralizes them | Which checks exist where is unknown |
| C8 | Snapshot HEAD ≠ tracked remote main | See 0.3 | Must be resolved by Codex Step 0 |
| C9 | Registry says `hardware-battery`/`thermal` PARTIAL because "not exposed on this host" | This is a **host capability fact**, not a defect; the correct final state is capability-driven (Part 7.3) | Which hosts expose them is unknown |
| C10 | `auto-export` is the only registry row at `IMPLEMENTED_AND_TESTED` (local JSON export/import validation of drafts) | Accepted for local drafts only; no claim for scheduled/OS execution | None |

### 1.3 Reconciled status distribution

The per-service reconciled status is computed mechanically in Part 12 and Appendix A from the four sources above. Summary counts are inserted at generation time:

@@STATUS_SUMMARY@@

**Reading the numbers:** "MEASURED_READ_ONLY" is a *complete* outcome for a Class A service **only after** Part 8.2 re-audit confirms it still holds at current HEAD and answers the user's actual question. It is not by itself a defect for a Class A service to be unable to modify the system.

### 1.4 What the owner's own standard already settles **[PACK]**

`missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md` is binding and is restated here without weakening:

- Classes: **A** observation/diagnosis; **B** reversible action; **C** destructive/privileged action; **D** external/connected.
- Implementation and controlled **fixture** tests are authorized now. Modifying the owner's real files, installed apps, registry, startup entries, services, network settings, running real repairs, connecting cloud accounts or charging an external API is **not** authorized without a separate user decision **at the time of use**. Therefore: build and prove executors on disposable owned fixtures and mock SCM/registry/VM; never hide an executor behind a permanently disabled control; let the end user authorize each real action inside the app later.
- Live gates that need an account, API approval or a privileged operation are recorded `BLOCKED_REQUIRES_USER_ACTION` **separately** from the implementation status.
- "No user data touched" is a safety result, not evidence that an action service works. Green CI alone is not evidence of a complete action service.
- Mutation pipeline (restated in Part 5): authorized scope → real read → risk preview → immutable fingerprinted plan → specific approval → fixed validated native execution → per-item progress and bounded cancellation → postcondition check → durable journal → recoverability where feasible.
- Mission 15A: every service opens a domain-specific interactive workbench in the shared `ServiceWorkbenchHost` (pinned side or expanded) with working controls. Home, Repair, System, Automation, Settings and Workspace had **not** been migrated to the host at the 10-27 audit **[PACK]**; Codex must establish current state.

---

## Part 2 — Operating Rules for Codex

1. **Do not stop at a report, and do not ask technical questions.** Resolve them by reading source, vendor documentation, or capability detection. Ask the owner only for the decisions in Part 10.
2. **Preserve.** Never run `git reset --hard`, `git clean`, `git checkout --`, force-push, rebase shared history, delete branches, remove worktrees, or run the repo's `clean` script. Never overwrite the protected checkpoint or any directory under `docs/evidence/`. New evidence goes into **new** directories.
3. **Single-writer discipline.** The visual-fidelity continuation holds the lease on `src/visual/knox-theme.css`, `src/visual/knox-glass.css`, `src/pages/FilesPage.tsx` (and may touch `src/components/shell`, mounted hero files). This specification's work is **functional** (native, main, preload, IPC, contracts, service workspace bodies). Before editing any path, run `git status --porcelain -- <path>`; if it is modified or untracked by another writer, coordinate through a patch/branch rather than editing in place. The handoff declares "Native/main/preload/IPC/models/security are protected unless a concrete functional regression requires a separately reviewed targeted fix" — that sentence governs the *visual* mission; this *functional* mission is the reviewed owner of those layers and must say so in each commit message.
4. **Preserve the Living Glass identity.** No change to header artwork, orbit/pipeline engine, glass materials, tokens or compact selectors except wiring, state binding and strings. New UI inside a service workspace uses the existing canonical tokens. Day: white/lavender with violet/purple; controlled cyan/blue/pink/teal; Night materials untouched. Reduced motion, keyboard and RTL behaviour preserved.
5. **Never fabricate.** No invented percentage, demo number, synthetic series, fake success, fake connection, fake antivirus/SMART/thermal/Google/rollback. Unsupported = `UNSUPPORTED` with a precise reason and an alternative.
6. **No arbitrary execution.** No generic exec/shell IPC, no raw `ipcRenderer` in React, no string-interpolated privileged commands, no unsanctioned `powershell` invocation. Native work uses typed, versioned, allowlisted operations (Part 6).
7. **Additive contracts.** `apps/gemini-ui/shared/native-contracts.ts` changes are additive and backward compatible; a breaking change needs a version bump, shim and contract test.
8. **Honest status.** Update `docs/SERVICE_CAPABILITY_MATRIX.md` and `docs/LIVE_SERVICE_EXECUTION_STATUS_181.csv` only with evidence (Part 8.4). Run `ledger:check`.
9. **Commit discipline.** Small, owned, verified commits (`feat(<domain>)`, `fix(<domain>)`, `test(<domain>)`, `wire(<domain>)`), each referencing its evidence record. Review `git diff` for secrets, local data and unrelated files before every commit. Commit trailers follow the repository's own convention.
10. **Credentials.** If a client ID, API key, certificate or elevation is missing, implement to the boundary, expose the honest capability state, add the exact item to `HANDOVER.md → Blocked on owner input`, and continue with the next independent item. Never invent, hardcode or log a secret.
11. **Follow `AGENTS.md`** (including any owner-response convention) and run `python scripts/verify-workspace.py` from the canonical root before tests or Git/source actions, as the visual handoff requires.

---

## Part 3 — Vocabulary

### 3.1 Service classes (from the standard)

| Class | Meaning | Completion means |
|---|---|---|
| A | Observation / diagnosis | Real, authorized, measured data; sort/filter/drill/export; real refresh/cancel/error; provenance; honest unavailable states |
| B | Reversible action | Executor + preflight + immutable plan + consent + progress + verification + journal + real undo |
| C | Destructive / privileged | Supported OS mechanism + protected defaults + per-action consent + UAC when needed + irreversible warning + effect verification; **no undo claimed for the irreversible** |
| D | External / connected | Real OAuth/connection + revocation + least privilege + secure credentials outside renderer + quota/idempotency + honest offline states |

### 3.2 Status vocabulary (no other value may be used)

| Status | Definition |
|---|---|
| `IMPLEMENTED_AND_TESTED_FIXTURES` | Intended functionality and effect tests pass on disposable fixtures, with commit SHA and receipt. Packaged/manual/owner-data gates stated separately |
| `MEASURED_READ_ONLY` | Real observation works; sufficient only for Class A when the observation answers the user's question |
| `PARTIAL` | Some real behaviour exists; named capability missing |
| `GATED_PREVIEW_ONLY` | Real measured preview and plan staging; executor absent or blocked |
| `CONNECTABLE_AWAITING_CONSENT` | Provider implemented and offline-tested; live consent not given |
| `FIXTURE_ONLY` | UI preview with local fixtures; no provider |
| `UNSUPPORTED` | Platform/hardware/vendor cannot support; reason and alternative shown |
| `BLOCKED_REQUIRES_USER_ACTION` | External authorization, credential or privileged operation needed from the owner |
| `UNASSESSED` | No assessment evidence in the pack; first Codex action is to assess |

### 3.3 Separate gates (never merged into one status)

`implementation` · `fixture-test` · `dev-Electron` · `packaged-Electron` · `Windows-native-host` · `owner-data/consent` · `visual-signoff` · `production (signing/verification)`.
A service line in Part 12 reports each gate it has evidence for and marks the rest `NOT_RUN`.

### 3.4 Capability states shown in the UI **[REQ]**

`available` · `partial` · `unsupported-platform` · `unsupported-hardware` · `provider-missing` · `needs-consent` · `needs-elevation` · `needs-credential` · `needs-reauthorization` · `needs-windows-host` · `disabled-by-policy` · `blocked-by-admin-policy` · `unsupported-account-type`. Each carries a machine-readable `reason`, a human `remediation` (EN + AR) and the `provider` that produced it. A control whose capability is not `available` is disabled **with that reason visible**; it never simulates success.

---

## Part 4 — Architecture and Shared Platform Services

### 4.1 Process model **[REQ — extend what exists]**

Renderer (React 18 + TypeScript, untrusted) → Preload (`contextBridge`, one typed function per contract, no generic invoke) → Typed IPC (invoke + event channels, versioned) → Electron Main (sender validation, schema validation, path canonicalization, scope + consent + capability checks, operation coordinator) → Providers (filesystem, registry, SCM, CIM/WMI, allowlisted processes, network, Google APIs) → Stores (journal, receipts, settings, secrets; atomic, checksummed, schema-versioned).
The pack confirms `contextIsolation`/sandbox/validated-sender as existing requirements (standard) and a main-process OAuth module with `safeStorage`/DPAPI **[PACK]**. Codex locates the existing module for each responsibility and extends it; a new abstraction is introduced only after a recorded search proves none exists.

### 4.2 Shared platform services (SP) — build or confirm these first

| ID | Service | Purpose | Consumers |
|---|---|---|---|
| SP-01 | **Capability registry** | One source of truth for capability state per provider/service (Part 3.4), host-probed at start and on demand, cached with timestamps | every service |
| SP-02 | **Operation coordinator** | Session IDs, state machine (Part 5.1), bounded concurrency, cancellation token that reaches the real walker/child process, idempotency keys, restart reconciliation | every long operation |
| SP-03 | **Scope manager** | Authorized folders (session picker grants + persisted, revalidated), canonicalization, symlink/junction refusal, protected-path catalog (built-in read-only + user additions) | D03, D06–D09, D13 |
| SP-04 | **Plan store** | Immutable plans: `planHash = SHA-256(canonical JSON of {serviceId, operations[], resource fingerprints, policy version, createdAt, expiresAt})`; approvals bind to `planHash` | all class B/C |
| SP-05 | **Journal and receipt store** | Append-only, atomic, checksummed, protected (DPAPI) where it holds original values; crash-safe two-phase (intent → effect → verified) | all class B/C |
| SP-06 | **Process runner** | Fixed-executable, fixed-argument-template runner: absolute resolved path, signature verification where applicable, no shell, argument validators, output cap, timeout, job-object/process-tree kill, locale-independent parsing contracts | WinGet, DISM, SFC, netsh, ipconfig, powercfg, schtasks, sc |
| SP-07 | **Elevation broker** | Per-action UAC through a purpose-built helper (Part 7.5); never auto-elevates; refuses in user-writable install locations except in mock-test profile | D08, D10.24, D11, D12, D09 machine scope |
| SP-08 | **Secret store** | Main-only; `safeStorage`/DPAPI; write-only from the renderer (masked tail only); excluded from logs, journals, exports, crash reports | Google, AI providers |
| SP-09 | **Event bus** | Typed progress/state/receipt events to the renderer with sequence numbers and backpressure | all |
| SP-10 | **Telemetry-free diagnostics log** | Local rotating log with redaction; no path content for user files unless the user exports it; no network egress | all |
| SP-11 | **Sample store** | Bounded time-series persistence (timestamp, value, unit, provider, host) for real samples only; gaps preserved | D07.12, D10, D13 |
| SP-12 | **Fixture lab** | Disposable Windows fixture builders (files, locks, junctions, reparse points, long paths, registry hives under a test key, mock SCM, mock WinGet binary, mock OAuth/API server, mock hardware providers) — each labelled as test double in evidence | all tests |
| SP-13 | **Consent UI contract** | One in-app consent component + native dialog for class B/C; specific wording generated from the plan (counts, bytes, sources, destinations, reversibility) | all B/C/D |
| SP-14 | **i18n/RTL string contract** | Every new visible string has EN and AR; bidi isolation for paths, hashes, commands; key-coverage test | all |

Whether any SP already exists under another name is **UNVERIFIED**; Codex must record the located module before building.

---

## Part 5 — Universal Operation Lifecycle

### 5.1 State machine **[REQ]**

`idle → capability-check → (needs-* | ready) → configuring → previewing → awaiting-consent → executing → verifying → recording → completed | partial | failed | cancelled | recovering`.
Illegal transitions are rejected in Main. `cancelled` and `failed` always record what actually happened. A state restored after restart is shown as `interrupted` with the journal's last verified stage, never as `completed`.

### 5.2 Normalized result envelope **[REQ — additive]**

`serviceId, sessionId, capabilityStatus, operationState, stage, progress {measured|null, basis}, scope, counts, latestEvent {seq, ts, message}, warnings[], errors[] {code, message, path?}, cancellable, provenance {provider, host, platform, sampleTime}, receiptRef`. `progress.measured = null` means indeterminate; an invented percentage is a defect. Existing field names in `native-contracts.ts` win.

### 5.3 Error taxonomy **[REQ]**

`E_CAPABILITY` (state, not exception) · `E_SCOPE` (outside grant) · `E_PROTECTED` · `E_STALE_PLAN` · `E_FINGERPRINT` (hash/mtime/size changed) · `E_CONFLICT` · `E_LOCKED` · `E_ACCESS` · `E_ELEVATION_DENIED` · `E_TIMEOUT` · `E_CANCELLED` · `E_PROVIDER` (OS/vendor error with captured code) · `E_PARSE` (unrecognized provider output) · `E_NETWORK` · `E_QUOTA` · `E_AUTH` · `E_VERIFY` (postcondition failed) · `E_INTERNAL`. Every error is structured `{code, message, remediation, retryable, path?, providerCode?}`; raw OS errors never cross the IPC boundary.

### 5.4 Universal rules for mutations (class B/C) **[REQ]**

- Refuse path escape, symlinks, junctions, mount points, protected OS locations, stale approvals, changed hash/mtime/size, destination conflicts.
- Approval is tied to `planHash`, shown with specific counts/bytes/names/reversibility, and requires an in-app control **and** a native confirmation. A preview, a dry-run, or a passed time never counts as approval.
- Execution is bounded (concurrency, memory, per-item timeout), reports per-item results, and cancellation reaches the native worker. Cancellation after the point of no return reports exactly what was and was not done.
- Postcondition is read back from the system, not inferred from the command's exit code.
- Partial failures are journaled item by item. Recovery is offered only where technically real; irreversible effects state so before consent and after completion.
- Same-volume quarantine frees **zero** physical bytes; the UI must say so **[PACK: `2a7fcbd` evidence]**.

---

## Part 6 — Security and Consent Baseline

| Area | Requirement **[REQ]** |
|---|---|
| IPC | Typed, versioned, allowlisted channels; `senderFrame`/origin validation; schema validation of every argument; reject unknown keys; no wildcard channel; no renderer-supplied path trusted before canonicalization against a grant |
| Paths | Canonicalize with the Windows long-path-aware resolver; reject `..` after canonicalization, UNC admin shares, device paths (`\\.\`, `\\?\GLOBALROOT`), alternate data streams in targets, reparse points (except where a service explicitly inspects them read-only), and any path outside an active grant |
| Process | SP-06 only; fixed executable (absolute path resolved in Main, signature verified where Microsoft/vendor-signed), argument allowlist per operation, no `shell: true`, output capped, timeout, tree kill, decode with the correct console code page (prefer UTF-8 where the tool supports it, else detect), never interpolate user text into an argument without a validator |
| Elevation | Never automatic. One UAC prompt per approved operation through SP-07. The app does not run elevated as a whole |
| Registry | Fixed hive/key/value allowlists per service; read original value+type+ACL evidence before writing; write only the approved value; read back; journal original |
| Secrets | SP-08; never in renderer state, logs, journals, receipts, exports, fixtures or screenshots. Tests assert by scanning outputs for the test secret |
| Network | Only the allowlisted hosts of enabled providers (Google endpoints, WinGet's own network use via winget, the user-selected AI provider). No telemetry. Connectivity probes (D10.16/18/19) need first-use consent and bounds |
| Data minimization | Read content only for the resources the user selects; purge cached external data on disconnect |
| Logging | Redacted; paths of user files appear only in user-visible receipts the user can export |
| Packaging | Packaged Electron must be tested for every executor (dev success does not imply packaged success). Auto-update and signing are production gates (Part 10) |
