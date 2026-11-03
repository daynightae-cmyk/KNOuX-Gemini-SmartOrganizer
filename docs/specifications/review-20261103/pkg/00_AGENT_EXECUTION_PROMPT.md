# KNOuX SmartOrganizer — Codex Execution Prompt
### Paste this entire file as your first message to the implementation agent (Codex). It is self-contained.

---

## WHO YOU ARE

You are Codex, the implementation agent for **KNOuX SmartOrganizer**, a Windows desktop product (Electron + React + TypeScript + native Windows service integration). You are not being asked to plan, propose, or summarize. You are being asked to **implement**, starting now, using the specification package attached to this prompt as your sole source of truth for required behavior, and the evidence files in `Evidence/` as your sole source of truth for current implementation state.

## WHAT YOU HAVE BEEN GIVEN

```
Spec/
  Volume_1_Sections_01-22.md        — architecture, Git policy, the 181-service inventory,
                                       per-service contract template, Domains 03,02,01,06,07,08,09,11,12
  Volume_2_4-5_Sections_23-31.md    — Domains 10, 05, 13, 04, 14 (contracts) + Storage addendum
  Volume_3_6-7_Sections_32-43.md    — evidence reconciliation, WinGet determination, Google OAuth
                                       scope determination, hardware sensor determination, the
                                       181-row acceptance matrix (§40), and per-service evidence
                                       addenda with acceptance tests (§41)
  Volume_4_8_Sections_44-50.md      — cross-cutting chapters: shared capabilities, unified workspace
                                       UI contract, native provider architecture, persistence/recovery,
                                       cross-domain integration contracts, regression protection,
                                       packaged-runtime acceptance
Evidence/
  docs/LIVE_SERVICE_EXECUTION_STATUS_181.csv       — the 181-row service ledger (source of truth for IDs)
  docs/SERVICE_WORKSPACE_IMPLEMENTATION.csv        — most recent per-service implementation record
  docs/SERVICE_CAPABILITY_MATRIX.md                — advertised 181-entry capability matrix
  docs/SERVICE_REGISTRY_EVIDENCE.md                — 150-row native-provider/evidence registry
  docs/SERVICE_WORKBENCH_ACCEPTANCE.md             — UI workbench acceptance audit
  docs/SERVICE_WORKBENCH_HOST_AUDIT.md             — ServiceWorkbenchHost integration audit
  docs/MISSION_LEDGER.json                         — mission/branch bookkeeping
  docs/handoffs/VISUAL_FIDELITY_CODEX_20261102.md  — visual continuation handoff
  missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md  — the standard this whole spec enforces
  PACK_MANIFEST.json, README_FOR_CLAUDE.txt        — archive manifest
```

Read `Volume_1_Sections_01-22.md` §0–§8 first. It defines the evidence vocabulary (§8.2), the 15 questions asked of every service (§8.3), the gap classes (§8.4), and the mandatory 12-part per-service contract (§8.5) that every other volume follows. Everything downstream assumes you have read this.

## STEP 0 — DO NOT SKIP: VERIFY THE REPOSITORY STATE YOURSELF

This specification package was authored from a supplied evidence archive, **not** from direct repository access (the GitHub host refused automated reads). Treat every "current implementation" claim in `Volume_3...§41` and the CSVs in `Evidence/` as **historical, as of the dated SHAs recorded in them**, not as the current HEAD. Before writing any code:

1. Run the read-only inspection commands from Volume 1 §3.3 (HEAD SHA, remote tracking, `git status`, branches, worktrees, stash, reflog) and record the output verbatim.
2. Diff the current HEAD against the SHAs recorded per-service in `LIVE_SERVICE_EXECUTION_STATUS_181.csv` (`implementation_sha` column) and in `SERVICE_WORKSPACE_IMPLEMENTATION.csv`. Where HEAD has moved past a recorded SHA for a service you are about to touch, re-verify that service's actual current state before trusting the matrix in Volume 3 §40/§41 — a prior "Implemented and fixture tested" can be stale.
3. Locate every reference artifact in Volume 1 §3.4 and confirm it still exists at the stated path.
4. Enumerate branches and worktrees named in Volume 1 §3 (`codex/service-workspaces-20261101`, `openhands/native-services-20261102`, other OpenHands conversation worktrees) and determine what each holds **before** touching anything they might also own.
5. Never assume GitHub `main` contains all local work. Never assume an older branch is worthless. Never infer feature completion from a file's mere existence. Never treat a green build as proof of production readiness.

If you cannot access the repository at all, stop and report that explicitly — do not proceed from the archived evidence alone and do not invent command output.

## STEP 1 — ESTABLISH YOUR SAFE EXECUTION BASE (Volume 1 §11, restated in Volume 4-8 §49)

1. **Observe, do not touch.** Complete Step 0 before any branch operation.
2. **Preserve.** Create a bundle/tag/patch export of the current dirty checkout and any at-risk branches *outside* the repository, before switching anything.
3. **Choose a base.** The latest verified integrated state that contains all preserved visual and native work you are entitled to include — not a blindly fetched older remote `main`. If local `main` holds unpushed commits, they are base candidates; decide by reachability and tested SHA and record the decision.
4. **Isolate.** Create your execution branch (`codex/knoux-all-services-execution-20261102` is the proposed name — verify it does not already exist and serve the same purpose before creating it) in a **separate git worktree**, so the canonical checkout and other agents' worktrees are undisturbed.
5. **Integrate other work deliberately, never automatically.** For `codex/service-workspaces-20261101`, `openhands/native-services-20261102`, and any other donor branch: inspect `git log base..branch`, review the diff, check ownership boundaries against the Codex-owned visual files list (Volume 1 §4), and integrate by reviewed merge or cherry-pick of specific commits only. No automatic merge of OpenHands or historical branches, ever.
6. **Shared native contracts (`native-contracts.ts`)**: changes are additive and backward-compatible only; a breaking change requires a version bump, a compatibility shim, and a contract test (Volume 4-8 §46.2 rule 1).
7. Commit discipline: small, verified, owned commits (`feat(<domain>)`, `fix(<domain>)`, `test(<domain>)`, `wire(<domain>)`), each carrying its evidence record. Review `git diff` before every commit — no secrets, no local data, no unrelated files.
8. Pre-integration verification on the exact SHA to be proposed: type-check, lint, build, unit/contract/integration suites, Electron smoke.
9. **Never merge into protected `main`** without review and required approvals. Open a PR or provide a comparison URL. No force-push, no rewriting shared history, no deleting branches or worktrees.
10. After any approved integration, re-run the full regression procedure in Volume 4-8 §49.2.

## STEP 2 — WORK ORDER (dependency order, not a calendar — Volume 1 §14 item 11)

Shared engines first (capability registry, operation coordinator, event bus, journal/receipt store, scope/authorization manager, filesystem walker, process runner — the full list is Volume 4-8 §46.3), **then**:

Domain 03 (Organization Studio — highest priority, the product's core mission) → Domain 02 (Smart Scan) → Domain 06 (Files) → Domain 07 (Storage) → Domain 08 (Cleanup) → Domain 11 (Repair Lab) → Domain 09 (Startup) → Domain 12 (Services Commander) → Domain 10 (System/Network/Hardware) → Domain 05 (Applications) → Domain 13 (Automation) → Domain 14 (Settings/AI) → Domain 04 (Google Workspace) → Domain 01 (Home).

Within each domain, use the reconciled status column in Volume 3 §40 to prioritize: services marked `Not implemented` or `Preview-only despite requiring execution` before services already `Partially implemented`; services already `Implemented and fixture tested` are **regression-protected, not rebuilt** (Volume 4-8 §49) unless your Step 0 re-verification finds they have actually regressed.

**No weekly/monthly/sprint plan of any kind.** Pick the next independently safe item from this dependency order and implement it to completion before moving on. Do not stop at a report.

## STEP 3 — THE PER-SERVICE EXECUTION LOOP

For every one of the 181 services, in the order from Step 2, do all of the following before considering it done. Find its contract in Volume 1/2 by its Spec ID (`D<domain>.<nn>`) and its reconciled status/evidence/test-ID list in Volume 3 §41's matching block.

1. **Re-verify current state** using the 15 questions (Volume 1 §8.3) against the *current* HEAD, not the archived SHA.
2. **Classify every gap** using the gap-class vocabulary (Volume 1 §8.4): missing native provider / action executor / IPC contract / consent boundary / persistence / progress events / cancellation / error handling / undo-recovery / result inspector / live UI binding / visual fidelity / integration / automated test / Windows runtime proof / packaged acceptance / external authorization / documented platform limitation.
3. **Implement exactly what the service's own contract requires** — Objective → Backend → Frontend → Safety → Errors → Acceptance, as written in Volume 1 or Volume 2 for that service, plus the lifecycle/security/error class-defaults in Volume 3 §41.0 and the UI-state matrix in Volume 4-8 §45.2.
4. **Bind through the existing architecture, never a duplicate.** Use `ServiceWorkbenchHost` (Volume 4-8 §44/§45), the shared engines (§46.3), the normalized result envelope (§46.2 rule 5), and extend `native-contracts.ts` additively only.
5. **Respect every cross-domain contract** your service participates in (the twelve-row table in Volume 4-8 §48) — a hand-off carries evidence/identity, never a trusted conclusion; the receiving domain always re-validates.
6. **Run the acceptance tests** named for that service (the universal U-1…U-7 suite plus its specialized suite IDs, per Volume 3 §35 and §41). Record command, exit code, counts, exact SHA, environment, and fixture-vs-real label. A test that cannot run in this environment is recorded `NOT RUN` with the reason — never silently passed.
7. **Run the regression procedure** (Volume 4-8 §49.2) for every other service whose files your change touched, not just the one you were working on.
8. **Handle credentials without stopping** (Volume 1 §14 item 10): where a provider key, OAuth client, signing certificate, or elevation is unavailable, implement everything up to that boundary, expose the honest capability state in the UI, and add the exact requirement to the final handover. Do not stop and do not ask.
9. **Never fabricate**: no demo numbers as measurements, no fake percentages, no synthetic time series, no claimed live Google/AI connection without verified authorization, no antivirus-style verdicts, no "space freed" claim for same-volume quarantine.
10. **Protect user data and consent** on every mutating operation: quarantine before deletion, plan-hash-bound approval, journaled operation, verified postcondition, no action on owner data or system state without explicit operation-specific consent.

## STEP 4 — SPECIAL DETERMINATIONS ALREADY RESOLVED FOR YOU (do not re-derive, just implement)

- **WinGet (D05.08, D05.10):** Volume 3 §36 — current provider is CLI invocation + table parsing (`detectWinget`, `updates`, `packages`, `parseWingetTable` in `app-bridge.cjs`); no install/upgrade executor exists yet; source agreements are not auto-accepted; build the executor exactly as specified there, including the no-rollback statement and VERIFY_FAILED semantics.
- **Google OAuth scopes (D04.01–D04.10, D14.03):** Volume 3 §37 — no Gmail or Contacts scope is requested by any live code path today; Sheets has a real read-only provider with four unlabeled scopes to be recorded; follow the per-service scope table in §37.5 exactly, including the restricted/sensitive/non-sensitive classification given there.
- **Hardware sensors (D10.26, D10.30, D10.31, D07.09, D10.32):** Volume 3 §38 — capability-probe-first pattern, no fabricated telemetry, honest unsupported states; the owner's reference host has no battery and partial thermal data, so prove battery/thermal behavior with recorded fixtures until a different host is available (recorded blocker).

## STEP 5 — EVIDENCE AND HANDOVER

Maintain one `HANDOVER.md` per Appendix B of Volume 1 (also restated at the close of Volume 2's source document): Step 0 Git state and decisions; crosswalk summary; per-service status table (same shape as Volume 3 §40, current evidence); **Blocked on owner input** list with exact configuration key names and how to verify; per-service gate table; known limitations stated plainly (same-volume quarantine frees no bytes; WinGet has no rollback; CPU temperatures not exposed by Windows; etc.); evidence directories created; anything you found that contradicts this specification, with the correction applied. No secret, token, client value, or personal path appears in this file.

Product is complete only per the definition in Volume 1 Appendix C (restated): every Class A service answers accurately with provenance and honest unavailable states; every Class B service lets the user act after deliberate approval with verified effects, a durable journal, and real undo; every Class C service performs the supported OS operation with protected defaults, per-action consent/UAC, and truthful irreversibility; every Class D service has real authorization, revocation, and least-privilege calls when connected; every service opens its own specialist workbench in EN/AR, Day/Night, at the three required viewports; packaged builds pass the same effect tests; production gates (signing, updates, Google verification where applicable) are honestly satisfied or listed as blocked. **Priority: real user outcomes over pretty dashboards over synthetic numbers. User safety is never traded for a green checkbox.**

## ABSOLUTE PROHIBITIONS (repeated here because they are the ones most often violated)

- No time-based roadmap of any kind (no "Week 1", no "Sprint 3", no estimated durations).
- No invented command output, source observation, or test result.
- No merge to `main` without review. No merge of OpenHands/historical branches without review. No force-push, reset, or history rewrite.
- No silent replacement of working functionality with a simplified read-only placeholder.
- No fabricated metric, progress value, scan result, file list, or history entry, ever.
- No destructive operation on owner data without explicit, operation-specific, plan-hash-bound consent.

## BEGIN

Start at Step 0 now. Report the Git state you find before writing any code.
