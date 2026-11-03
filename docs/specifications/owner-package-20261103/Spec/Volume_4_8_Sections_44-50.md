# KNOuX SmartOrganizer — Ultimate 181-Service Specification
## Volume 8: Cross-Cutting Chapters Required by the Master Directive (Sections 44–50)

Continues Volumes 1–7 (Volume 1: §1–22 · Volumes 4–5: §23–31 · Volumes 6–7: §32–43). Closes the seven standalone chapters the Master Authoring Directive's required structure (its §29, items 9, 24–26, 28–29, 31, 33) asked for and that no prior volume delivered as a dedicated chapter. This volume does not restate per-service contracts (Volumes 1–5) or the matrix (§40); it cross-references them by Spec ID and adds only the cross-cutting material.

---

## 44. Additional Shared Product-Wide Capabilities (Directive §19 / structure item 24)

These sit outside the 181-row ledger. Per the directive's own rule (§19/§3): never folded into the 181 total, documented separately, status given the same evidence vocabulary as §32.4 of Volumes 6–7.

| Capability | Evidence in the archive | Reconciled status | Required contract |
|---|---|---|---|
| **Clipboard Vault** | `SERVICE_REGISTRY_EVIDENCE.md` 2026-11-02 note: "eight fixed `clipboard.*` native capabilities now serve Settings → Clipboard Vault"; opt-in history workbench with search, inspection, pins, retention, pause/private, copy-back; fixture evidence in `docs/evidence/native-activation-20261102/clipboard-electron.json` | Implemented and fixture tested (native, opt-in) — owner clipboard content, packaged effects, multi-DPI and owner visual approval **NOT VERIFIED** | Lives in Settings (D14) as a declared non-ledger capability. Opt-in only (default off); pause/private mode excludes capture; retention window user-configurable; pinned items survive retention sweep; copy-back never re-executes clipboard content as a command. Acceptance: U-1…U-7 (Volumes 6–7 §35.1) plus a capture/retention/pause/copy-back fixture cycle. |
| **KNOuX cinematic splash/intro** | Named in the directive (§19) only; no ledger or registry row | Not verified | If present, it must not block input beyond a bounded timeout, must be skippable, and must never substitute for the real first-paint of Home while native capability checks are still pending. |
| **Branded icon, logo, window titlebar, native window controls** | Not verified | Not verified | Native title bar (not a fully custom chromeless frame) unless a specific accessibility and multi-monitor-drag test exists for a custom one; minimize/maximize/close map to real OS window state; DPI-aware icon set. |
| **Global navigation / command palette** | Not verified | Not verified | If it exists, every entry routes to a real mounted workspace (never a dead route); keyboard-only operable; results come from the same catalog ID list as §30's matrix, so palette and sidebar can never diverge. |
| **Universal/global search (D01.09)** | Already in ledger as `mission-01-09`; ledger baseline: "PARTIAL — real workspace navigation; global indexed search not implemented" | Partially implemented (ledger row, already in the 181) | Not a new capability — cross-reference only, to avoid the directive's "no silent duplicate" rule. |
| **KNOuX AI Assistant (D14.08)** and **AI Copilot (D14.02)** | Already in ledger | See Volumes 4–5 §27.2 | Cross-reference only. |
| **Notifications** | No dedicated ledger row; D13.07 (Notification Channel Routing Board) owns in-app/toast/export routing for automation outcomes specifically | Not verified for any non-automation notification path | Any notification outside D13.07's scope (e.g. a provider-availability toast) must declare its own channel and never silently reuse D13.07's routing table for non-automation events. |
| **History center / shared safety approvals** | D01.11 (Recent Activity), D01.12 (Pending Safe Actions) already own this in the ledger; D08.03/D09.05/D13.03 own domain-specific journals | Already in ledger | Cross-reference only. A single history center UI, if it exists outside D01.11/D01.12, must read from the same journals (Volumes 6–7 §41 "Lifecycle" column) and never maintain a second copy of operation state. |
| **Service Workbench Host** | Extensively evidenced: `SERVICE_WORKBENCH_HOST_AUDIT.md` — reusable host with side/expanded modes, persisted width/mode, tool selector; confirmed for Files (12/12), Studio (9/9), Storage (12/12), Smart Scan (10/10), System (36/36 per `SystemServiceWorkspaces.tsx`), Cleanup, Startup, Services, Automation (per `SERVICE_WORKSPACE_IMPLEMENTATION.csv` files_changed counts) | **Implemented and fixture tested** (dev + packaged smoke `*WorkbenchOk`/`*LayoutOk` recorded per domain) — this is the single most load-bearing piece of shared UI infrastructure in the whole product | No domain may introduce a second generic modal or fixture-renderer host (explicit prohibition already recorded in the audit). Any new service added to any domain must open inside this same host, not a bespoke container. |
| **Native IPC capability detection** | `native-contracts.ts` referenced throughout as the single typed contract surface | Existing, extended additively per Volumes 1 §6.1 and §21 of this volume | Cross-reference only. |
| **Packaging and installer** | `installer` appears only in passing (code-signing certificate listed as an owner-dependency item in Volumes 6–7 §30/§42) | Not verified | See §50 of this volume (Windows Packaged Runtime Acceptance). |
| **Crash recovery** | Mentioned once, generically, in Volumes 6–7 | Not verified | See §47 of this volume. |
| **Single-instance behavior** | Not mentioned anywhere in the archive | Not verified | REQUIRED: a second launch must either focus the existing window or be refused; two instances must never write to the same journal/settings store concurrently (file lock or OS single-instance API). |
| **App updates / Windows signing / GitHub release / user data migration** | Code-signing certificate named as an owner-dependency in §30/§42 of Volumes 6–7; nothing else evidenced | Not verified; code-signing is a confirmed **blocker** (owner must confirm certificate exists) | Auto-update, if implemented, must verify a code signature before applying any update; without a certificate, the product ships unsigned with a stated SmartScreen warning, documented in the handover, never silently "worked around." |

---

## 45. Unified Service Workspace & Frontend Visual Integration (Directive §20 / structure item 25)

This consolidates the per-domain visual requirements that Volumes 1–5 state separately (one paragraph per domain chapter) into the one explicit, checkable contract the directive asked for in its own §20.

### 45.1 The six required regions (every one of the 181 services)

| Region | Requirement | Evidence this is already substantially real |
|---|---|---|
| A. Unified visual header | Fourteen Living Glass headers, domain-specific transparent artwork, orbital animation — preserved, not rebuilt | `VISUAL_FIDELITY_CODEX_20261102.md` |
| B. Compact service dock | Small, readable, keyboard-accessible tool selector per domain | Confirmed per-domain in `SERVICE_WORKBENCH_HOST_AUDIT.md` ("tool selector to switch among the 12 Files services without leaving the workbench") |
| C. Large active workspace | Majority of body area serves the selected tool, inside `ServiceWorkbenchHost` side/expanded modes | Confirmed (§44 table above) |
| D. Live service preview | Real native operation state or an honest idle stage — never a static illustration | Required by Volumes 1 §2 rule 1 (no fabricated metric/progress/result) |
| E. Results and inspector | Real filenames/icons/counts/sizes where applicable; filters; detail inspector | Stated per-domain across Volumes 1–5; no cross-domain consolidation existed before this section |
| F. Action area | Only valid service-specific actions; approval/cancel/recovery controls; never a dead button | Cross-references Volumes 6–7 §35.1 test U-1 (dead-control check) |

### 45.2 The 13 UI states (Volumes 1 §8.6, restated here as the enforceable matrix every one of the 181 blocks in Volumes 6–7 §41 must render)

Not initialized · No authorized source · Provider unavailable · Ready · Configuring · Scanning/processing · Partial · Completed · Cancelled · Failed · Awaiting consent · Awaiting elevation · Recovery available.

**Rule:** a service's reconciled status in §40/§41 of Volumes 6–7 constrains which of these 13 states can currently be *proven* to render correctly. A service reconciled as "Not verified" has none of the 13 states evidenced; this is itself a gap entry under gap class "Missing live UI binding" (Volumes 1 §8.4 / directive §24).

### 45.3 UI verification matrix (restates directive §27's required UI verification as one checklist, cross-referenced to U-5 in Volumes 6–7 §35.1)

All 14 domain headers · all mounted service workspaces · Day/Night · English/Arabic with RTL/LTR · 1366×768 / 1672×941 / 1920×1080 · keyboard-only navigation with visible focus · screen-reader semantics where applicable · reduced motion · no clipping · final-row scroll access · reference fidelity against `docs/evidence/living-glass-20261102/`.

Owner visual sign-off (gate 10) remains the one step this document cannot complete — consistent with every per-service block in Volumes 6–7 §41 that lists it as outstanding.

---

## 46. Native Provider Architecture (Directive §21 / structure item 26)

Consolidates the architectural rules that Volumes 1–5 state inline, scattered per domain, into the one dedicated chapter the directive's structure requires.

### 46.1 Layers (restates Volume 1 §5.2, cross-referenced, not duplicated)

Renderer (untrusted) → Preload (typed bridge, no raw Node/IPC exposure) → Electron Main (authorization, validation, execution) → Native provider (Windows API / CIM / registry / process). Every privileged operation is re-validated in Main regardless of what the renderer claims (Volume 1 §2 rule 3).

### 46.2 Required architectural properties for any new or completed provider

1. **Typed IPC only.** Every channel has a schema in `native-contracts.ts`; additive, backward-compatible changes only (breaking change ⇒ version bump + compatibility shim + contract test — Volume 1 §11.6).
2. **Command allowlists, never shell concatenation.** Argument vectors are built by KNOuX from validated, typed inputs; nothing from the renderer or from untrusted registry/file text is passed to a shell (restated from Volumes 4–5 §24.1 "Untrusted registry text" and applied product-wide).
3. **Bounded concurrency and cancellation.** Every enumeration or probe is cancellable; child processes are killed as a tree (Volumes 4–5 §23.1 "Cancellation", generalized here to every domain, not just Domain 10).
4. **Capability detection before any control is enabled.** `available / partial / unsupported-platform / provider-missing / needs-elevation / needs-credential / needs-consent` — the vocabulary already used throughout Volumes 1–5, now stated once as the single enum every provider implements.
5. **Normalized result envelope** (Volume 1 §5.3): every provider call returns `{ data | error, provenance: {provider, sampleTime, source}, capability }`, never a bare value, so the UI can render honest states without per-service bespoke plumbing.
6. **Journaling and receipts** for any mutating operation (Volume 1 §21 security baseline, Volumes 1 §9.3 plan-hash pattern reused by every Class B/C service in the matrix).
7. **Secret isolation.** Provider keys, OAuth tokens and client secrets never cross into the renderer, logs, journals, receipts, exports or crash reports (Volumes 4–5 §26.1 "Token handling", §27.1 "Secrets" — generalized here as a product-wide rule, not just Google/AI-specific).

### 46.3 Shared engines (do not duplicate — Volume 1 §21 rule, restated as the authoritative list)

Capability registry · Operation coordinator · Event bus · Journal/receipt store · Scope/authorization manager · Filesystem walker · Process runner · Shared sampler (serves D01.07, D02.09, D10.01, D10.06, D10.09 per Volumes 4–5 §23.1) · Shared application inventory (serves D05.01–D05.12, D02.08, D01.03, D10.10 per Volumes 4–5 §24.1) · Shared signature provider (serves D10.04, D05.02, D06.12). Any new work that needs one of these capabilities binds to the existing engine; building a second instance is itself a defect, not an implementation choice.

---

## 47. State, Persistence and Recovery (structure item 28)

### 47.1 What must persist across restart (consolidated from the per-domain rules already stated in Volumes 1–5)

| State class | Must survive restart? | Owning mechanism |
|---|---|---|
| Authorized sources / scopes | Yes | Scope manager (Volume 1 §21) |
| Smart Scan sessions | Yes, with original timestamps | Session store (D02 contract, Volumes 1 §15) |
| Organization plans and approval tokens | Yes; a restart never silently re-approves a stale plan | Plan store + `planHash` (Volume 1 §9.3) |
| Automation workflow `nextRun` | Yes, recomputed correctly across restart including DST | Scheduler (Volumes 4–5 §25.2) |
| Journals / receipts (Cleanup, Organization, Startup, Services, Repair, Automation) | Yes, append-only, checksummed | Per-domain journal, all sharing the DPAPI-protected receipt store pattern (evidenced: "shared DPAPI protected receipts" in `services-control` CSV row) |
| Settings | Yes, schema-versioned, atomic writes, rollback copy | D14.07 / Volumes 4–5 §27.1 |
| Sample history (performance, capacity trend, battery) | Only if the user opts in | Volumes 4–5 §23.1 "Sampler budget"; D07.11 |
| Clipboard Vault history | Only if opted in (default off) | §44 above |

### 47.2 Interruption and recovery (generalizes the per-domain "interrupted run" rules already present in Volumes 4–5 §25.2 and the error tables in Volumes 6–7 §35.1 E-A…E-D)

A process killed mid-operation must, on next launch, reconcile every in-flight record against its journal: an operation with no verified postcondition is marked `interrupted`, never silently resumed as if it had completed, and the UI offers continue/undo/abandon where the operation type supports it (restates Volumes 4–5 §25.2 "Cancellation and recovery", generalized to every domain with a journal, not just Automation).

### 47.3 Crash recovery (closes the §44 gap)

A renderer crash must not corrupt Main's state (process isolation already implies this architecturally); a Main-process crash during a mutating operation must leave the journal in a state the next launch can reconcile per §47.2. This requires every mutating provider to write its "intent record" (Volume 1 §9.3 pattern: "write intent → operate → verify → write outcome") *before* the operation starts, not after — already specified for Organization (D03.07) and must be the same pattern for every Class B/C service in the matrix, not restated per-service.

---

## 48. Cross-Domain Integration Contracts (Directive §22 / structure item 29)

The directive's §22 names eleven specific handoffs. None of Volumes 1–7 collects them into one chapter with a transfer contract; they are scattered as "Depends on / hands off to" lines in Volumes 6–7 §41. This section is the single table the directive asked for.

| # | Source → Destination | Transfer contract | Owning re-validation | Evidence in prior volumes |
|---|---|---|---|---|
| 1 | Smart Scan finding → Files inspector | Typed `handoff {targetServiceId, payload}` per finding (D02 domain contract, d02.py `INTRO`) | Files re-reads the file by path/identity; never trusts Smart Scan's cached metadata | Volumes 1–2 (d02.py INTRO: "every finding exposes a typed handoff... the owning domain re-validates everything") |
| 2 | Duplicate Finder (D02.03) → Cleanup/Storage Safety Vault preview | Fingerprints (size, mtime, hash) in the handoff payload | D07/D08 re-verify content hash at plan time **and** execution time | Volumes 6–7 §41 D02.03 block, Volumes 1 §9 |
| 3 | Large Files (D02.04) → Storage analysis (D07.02) | Same ranking rule/order as D06.10, cross-service equality test required | D07.02 recomputes from its own snapshot | Volumes 6–7 §41 D02.04 test "Ranking equals D06.10 for the same scope" |
| 4 | Files search result → Organization Studio planning | Selected file IDs, not paths alone (paths can go stale) | Studio re-reads source; source-mismatch refusal if the scan session no longer matches | Volumes 1 §9 Studio contract, D02.04 "Source folder replaced between scan and hand-off → Studio refuses" |
| 5 | Organization Studio execution → receipt → History & Undo (D03.07→D03.08) | `planHash`-bound receipt, per-item outcome record | History reads only from the journal, never recomputes | Volume 1 §9.3, D03.07/.08 contracts |
| 6 | Application inventory (D05.01) → Startup Impact (D05.12, D09) | Join by executable path + package identity; no fuzzy name matching | D09 owns the measured impact number; D05.12 never invents one | Volumes 4–5 §24.2 D05.12 |
| 7 | System diagnostics (D10) → Repair recommendations (D11) | Evidence references (event IDs, record IDs), never a free-text diagnosis | D11 requires its own preview/consent regardless of what triggered the recommendation | Volumes 4–5 §23 shared rules |
| 8 | Windows Services (D12) → System health (D10.11) | Shared SCM enumeration — **no second enumerator** | D10.11 reads the same snapshot as D12.04 | Volumes 4–5 §23.2 D10.11: "the shared SCM enumeration... no second enumerator" |
| 9 | Automation (D13) → authorized service operation (any domain) | Preapproval bound to `definitionHash` + scope hash, named steps only | Target service re-validates hash binding before every run (Volumes 4–5 §25.2) | Volumes 4–5 §25 |
| 10 | Google Workspace (D04) → authorized file metadata (Files/Studio) | Only Picker-selected file IDs (`drive.file` scope), never a broad Drive scope | Target domain treats the Google resource as external; no local file-identity assumptions | Volumes 4–5 §26, Volumes 6–7 §37 |
| 11 | Home (D01) → real activity and pending approvals | Reads only from each domain's own session/plan/journal store; Home computes nothing | Home never executes a plan (D01.02 Volumes 1 contract) | Volume 1 Domain 01 chapter |
| 12 | AI Assistant (D14.08) → explainable recommendation → service navigation | Navigation intent maps to a typed, allowlisted route with a prefilled payload; **no tool executes anything** | Target service's own preview/consent/approval still applies in full | Volumes 4–5 §27.2 D14.08 |

**Product-wide rule distilled from all twelve rows:** a handoff carries *evidence references and identity*, never a trusted conclusion; the receiving domain always re-validates against its own authority before any action. This is the one architectural invariant that prevents the fourteen domains from becoming — in the directive's own words — "fourteen disconnected applications."

---

## 49. Critical Regression Protections (structure item 33)

Consolidates the "never touch without re-testing" list the directive implies in §4 (Preserved Unique Work) and §25 (Git policy) into one explicit gate.

### 49.1 Protected assets (must not regress silently when any of the 181 services is touched)

- The six-region `ServiceWorkbenchHost` contract (§45.1) and its persisted mode/width keys (`knoux.<domain>.workbench.mode|width`) — a change to one domain's workbench integration must not alter another domain's persisted key names or behavior.
- `native-contracts.ts` — additive only; a contract test (Volume 1 §11.6) runs before any merge touching it.
- The shared engines list in §46.3 — a change to the filesystem walker, operation coordinator, journal store, or any other shared engine requires re-running every domain's acceptance suite that depends on it, not just the domain that motivated the change.
- Living Glass visual identity artifacts (`docs/evidence/living-glass-20261102/`) — visual regression comparison required for any CSS/token change (U-5 in Volumes 6–7 §35.1).
- Receipt/journal schema — a schema change requires a tested forward migration (same pattern as D14.07 settings migration) before any domain's journal writer is touched.

### 49.2 Mandatory regression procedure for any change

1. Identify every service in §40 (Volumes 6–7) whose "Existing implementation paths" column names a file the change touches.
2. Re-run that service's full acceptance test list (U-1…U-7 plus its service-specific suite) on the exact SHA, not a prior SHA.
3. Record the result in the evidence directory per Volumes 6–7 §35's evidence-class rules; a regression that cannot be re-tested in this environment is recorded `NOT RUN`, never assumed to pass.
4. A failing regression blocks the change from being reported as complete, even if the change's own new tests pass.

This closes the directive's §25 instruction ("post-merge regression") and §4 instruction ("preserve... extend, never replace") as one procedure instead of two separate statements.

---

## 50. Windows Packaged Runtime Acceptance (structure item 31)

### 50.1 What the archive actually evidences at this layer

Per-domain dev+packaged smoke tests are recorded for Files, Studio, Storage, Smart Scan, System, and others (`*WorkbenchOk`/`*LayoutOk` naming pattern, `win-unpacked` smoke confirmed in `SERVICE_WORKBENCH_HOST_AUDIT.md` §3). This is real evidence of **layout and workbench-chrome** correctness in a packaged build. It is **not** evidence of packaged-build *native effects* (actual file moves, actual registry reads, actual process termination) — those remain `NOT_RUN` per nearly every block in Volumes 6–7 §41's "Gates with evidence" row.

### 50.2 The layer this document cannot complete, stated once instead of 181 times

The directive's own required verification chain is: **UNIT → CONTRACT → INTEGRATION → ELECTRON → WINDOWS NATIVE → PACKAGED PRODUCT → RELEASE**. Everything in Volumes 1–7 reaches ELECTRON (dev smoke, fixture tests) and, for the domains named in 50.1, the layout portion of PACKAGED PRODUCT. **WINDOWS NATIVE** (real elevation prompts, real UAC, real SCM transitions, real DISM/SFC runs, real registry writes) and the **effect-verification** portion of PACKAGED PRODUCT require a disposable Windows host — confirmed as an open blocker (B-S2 / "Windows host" items) throughout Volumes 6–7 §42. **RELEASE** requires the code-signing certificate, also an open blocker (§44 above).

### 50.3 What Codex can still do without that host

Build the simulated-runner test doubles that every Class B/C service in the matrix already specifies (e.g. REP-1…REP-6 for Repair Lab, SCM-1…SCM-6 for Services, Volumes 6–7 §35.7) — these prove the *exact command/argument vector and sequencing* without requiring a real elevation prompt, and are the correct, bounded unit of work available right now. They are not a substitute for the Windows-host and packaged-effect layers; the matrix and every per-service block already say so, and this chapter does not relax that.

---

## Close of Volume 8

This volume adds no new per-service contract and changes no status in §40's matrix. It satisfies the seven structural items the Master Authoring Directive's §29 required that Volumes 1–7 had not yet delivered as dedicated chapters. Volumes 1–8 together now cover all 38 items of the directive's required document structure.
