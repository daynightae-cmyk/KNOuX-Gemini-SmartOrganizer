# 02 — Correction Ledger

Every change made to the reviewed package, with the evidence that forced it. Nothing here is a restatement of the specification; this file exists so a reader can audit the correction pass rather than trust it.

Two conventions: **KEPT** means the original text was substantial and correct and was not rewritten; **CHANGED** names the exact passage and the exact reason. Measured facts carry the command that produced them.

---

## Item 1 — "sole source of truth" language

**Found (verbatim, before):** `00_AGENT_EXECUTION_PROMPT.md` line 8 — *"using the specification package attached to this prompt as your sole source of truth for required behavior, and the evidence files in `Evidence/` as your sole source of truth for current implementation state"*; and line 26 — *"the 181-row service ledger (source of truth for IDs)"*. `Spec/Volume_3...md` §32.5 opened its precedence list at an archived CSV and called it the source of truth. `Spec/Volume_2...md` header note said *"Volumes 6–7 win"* on current state.

**Why it had to change:** the same prompt told the agent to verify the repository itself in Step 0. Two "sole truths" on the same axis is not a preference order, it is a contradiction, and the agent resolves it by whichever file it read last.

**CHANGED:**
- New `01_PRECEDENCE_AND_BASELINE.md` Part 1 defines the single order: observed runtime → source tree at HEAD → tested SHA with machine-readable result → re-read evidence file → archive ledgers → any specification sentence about today. The specification is authoritative for **required behavior** only.
- Volume 1 §1.1 gained a "WHAT THIS PARAGRAPH DOES NOT MEAN" clause: authoring without repository access is provenance, not a licence to trust the document over the code.
- Volume 3 §32.5 rewritten: the five archive documents survive, renumbered 4.1–4.5 under the code-first order, with the original 32.5 sentence about `MISSION_LEDGER.json` narrowed to *identifiers only*.
- Volume 2 header note amended: "Volumes 6–7 win" now means "the most recent reading of the archive", explicitly below the source tree.
- Retired vocabulary listed: `sole source of truth`, `the authoritative record` about a ledger, `as verified` without a SHA.

**KEPT:** every `DERIVED` / `NOT VERIFIED` / `REQUIRED` / `SUPPLIED` evidence class in Volume 1 §1.1. The discipline was correct; only its rank in the order was wrong.

---

## Item 2 — historical classification separated from current runtime verification

**Found:** the ledger records `NOT_REASSESSED_IN_THIS_SLICE` for **157** of 181 rows, `IMPLEMENTED_AND_TESTED_FIXTURES` for 23, `PARTIAL` for 1. Matrix v1 mixed that into one column: *"**Partially implemented** (historical; not reassessed in current slice; ledger baseline)"*. A single cell carrying both a status and a disclaimer about the status is how stale claims survive a review.

**Measured now, and this is the good news:** all four recorded implementation SHAs are reachable from the current tip.

```
$ for s in 71240ce e819b2c 2a7fcbd df655ab; do git merge-base --is-ancestor $s HEAD && echo $s REACHABLE; done
71240ce REACHABLE   e819b2c REACHABLE   2a7fcbd REACHABLE   df655ab REACHABLE
```

So the 24 assessed entries were **not** downgraded. They are flagged `CONFIRM NOT REGRESSED`, which is a test run, and their historical classification stands until a revalidation cites evidence to move it.

**CHANGED:**
- `Matrix/matrix_181_v2.csv` splits the fields: `historical_status`, `historical_slice_status`, `historical_implementation_sha`, `historical_sha_reachability`, `historical_evidence_path`, `remaining_gate_as_recorded` — versus `current_runtime_verification`, which reads `NOT RUN at 11875da…` for all 181 rows, because this pass executed no per-service runtime gate. Claiming otherwise would have been the exact error the reviewer is guarding against.
- `revalidation` column: 157 × `MANDATORY SOURCE REVALIDATION`, 24 × `CONFIRM NOT REGRESSED`.
- Volume 1 gained §8.2.1 with the two-column rule and three binding corollaries, including: a revalidation may raise, hold or lower a classification but must cite what it read, and lowering a verified service without new evidence is a reporting error.
- `Matrix/revalidation_queue.md` orders the 157 by domain and lists the 24 separately with their cited evidence paths.

---

## Item 3 — insufficient contracts expanded to full A–L

**Measured, not asserted** (`build/audit_contracts.py`, counts either the template word or an equivalent construction — Repair Lab writes `Operation:`/`Elevation:` instead of `Backend:`/`Safety:`, which is substantive but off-template):

| A–L part | entries where it is genuinely absent |
|---|---|
| C Existing implementation | 178 of 181 |
| D Evidence status | 173 |
| E Exact missing work | 169 |
| J Error and recovery | 156 |
| L Delivery proof | 140 |
| A Identity beyond the heading | 135 |
| I Safety | 74 |
| G Frontend contract | 22 |
| B User objective | 19 |
| H Lifecycle | 179 |
| F Backend contract | 11 |
| K Acceptance | 0 — every contract has one |

Distribution: median 5 of 12 parts present; the best two contracts (D03.09 Suggestions, D07.12 Removable Volume Dock) reach 11; **seven contracts reach only one part** (D01.01 and D01.03–D01.08 — Home entries whose "contract" is a single line, and which also have no identity in the renderer at all).

**CHANGED:** `Contracts/` — 14 files plus an index, generated for all 181 entries in the full A–L structure. Each part is labelled by its epistemic status:
- **C / F / G** filled from measured source (integration point `path:line [kind]`, resolved component definition site, registered channels, typed binding functions with their `NativeEnvelope<payload>` names).
- **D** written as the two-part split from item 2.
- **E** derived only from verified absences, e.g. "no catalog key or workbench for this id in renderer source", "no mutation executor exists in this domain, so the action half does not exist yet".
- **H / J / L** written as `REQUIRED` (the specification imposing behavior), never as observation, and labelled as such.
- Anything not establishable is emitted as a concrete Codex task, not a guess. No source path, native operation or test name was invented in this layer; the generator only prints strings it found in files.

**KEPT:** Volumes 1–5 contract text as the authority for intent and required behavior. `Contracts/` cross-references it (`§18 D07.01`) instead of restating it, so the two cannot drift.

---

## Item 4 — duplicated Storage contracts reconciled

**Found:** Domain 07's twelve contracts appear twice — Volume 1 §18 and a "Volume 2 Addendum — Storage". The addendum even said of itself: *"if it is present, the two copies must be identical and this one is the duplicate to delete."* They were **not** identical.

**Measured diff (`difflib`, line-level):** V1 §18 = 38 lines, V2 addendum = 34 lines, **9 differing lines**, plus a layout difference (V1 splits D07.01 into Objective / Frontend / Acceptance bullets; the addendum merged them into one).

A sentence-level check confirmed no requirement existed only in the addendum. The one sentence that failed a keyword-overlap match, *"at least two samples before any trend is drawn"*, is the addendum's phrasing of V1's *"a minimum of two samples required before any trend is drawn"* — same rule, different words.

**CHANGED:** the addendum is withdrawn in place and replaced by a reconciliation note that (a) names Volume 1 §18 as the single authoritative Storage contract, (b) lists each wording difference and which form is kept and why — `"sparkline-free"` is retained because it is an active prohibition, not decoration — and (c) routes current-state facts to `matrix_181_v2.csv` and `Contracts_D07.md` instead of a second prose copy.

---

## Item 5 — exact native functions, IPC operation IDs, result contracts, integration points

**Found:** every row of Matrix v1's provider column ended `op-id: read native-contracts.ts`. The package even said so honestly: *"Operation IDs are not in the archive."* Honest, and useless as an assignment.

**CHANGED — the repository was read directly, and this is now measured and in `Matrix/` + `Contracts/`:**

| Fact | Value | Source |
|---|---|---|
| Registered channels | 140 | `apps/gemini-ui/shared/native-contract.json` |
| Registered capabilities | 137 | same |
| Operation channels outside that registry | 33, literal `knoux:operations:v1:<method>` | `electron/native/operation-ipc.cjs:10`, duplicated in `electron/preload.cjs:456-488` |
| Typed binding functions with envelope payloads | 120 across 12 domain files | `Matrix/native_binding_map.json`, generated |
| Real mutation executors | 5 families | organization `execute`/`undo`; StorageVault `vaultExecute`/`vaultRestore`; `StartupActions.apply`; `ServiceActions.apply`; `ClipboardVault.copyBack` |
| Explicitly gated, no executor | install / update / uninstall, association write, hosts write, DISM, SFC, `netsh` resets, recycle-bin empty, quarantine purge, OS scheduled tasks, any Google product write | `GATED_OPERATIONS` tables and bridge headers |

Three defects this pass found that the old package could not have found, now written into the contracts as required work:

1. **No crosswalk exists** between catalog id and capability id anywhere in the renderer. Searched `capabilityId`, `SERVICE_TO_CAPABILITY`, `nativeCapability`: **zero hits**. Capability strings appear only as the second argument of `assertEnvelope(...)` in the 12 `src/*/native.ts` files. "Service X uses operation Y" is therefore not derivable from any table and must be established per service — which is why every contract now carries that as an explicit task.
2. **The 33 operation channels bypass the contract registry**, so `native-contract.json` is not the complete IPC surface its own consumers assume.
3. **A type/contract mismatch on the permission field**: `operation-ipc.cjs` emits `permission: 'per-operation-consent'`, while `PermissionGate = 'read-only' | 'user-initiated' | 'not-granted'` (`shared/native-contracts.ts:28`). It survives because `security.cjs` `envelopeBase` passes `permission` through with only `status` validated (line 59 vs line 56). Either the union gains the value or the operations layer stops inventing it; both are small, and both are now named instead of latent.
4. Also recorded: `AppBridge.updates` invokes `winget upgrade --include-unknown --disable-interactivity` with **no `--list`** (`app-bridge.cjs:1241`) while the capability is registered `read-only`. That is the single most consequential discrepancy found — a nominally read-only query is one flag away from being an install-adjacent mutation. It is written as a required inspection with the line number, not as an accusation.

**KEPT:** Volume 3 §36 (WinGet), §37 (Google scopes), §38 (sensor capability-probe) determinations. They remain correct as requirements; §36's provider names are now corroborated by the source read (`detectWinget` 1196, `updates` 1212, `parseWingetTable` 1285, `packages` 1398).

---

## Item 6 — precise Git baseline and concurrent-agent protection

**Found:** Volume 1 §3.1 recorded `8ff8131…` as "last observed local main" and §11 item 3 said "If local main holds **two** unpushed commits". §11 item 5 listed three branches to integrate.

**Measured:** the recorded HEAD was **four commits behind** the real tip when this pass began. Divergence was `0 6` at session start, `0 7` at publication. Of the three branches named for integration, `codex/service-workspaces-20261101`, `openhands/native-services-20261102` and `origin/feat/gemini-missions` each have **0 unique commits** — they are already inside `main`. The only live donor is `origin/v0/knoux-smartorganizer-integration-b432675e` with **6** (`d2c4b89`, `6856007`, `f00f661`, `c7e9fec`, `f815c4b`, `c01638d`).

**The pass also produced its own evidence, unexpectedly:** `main` advanced **twice** while these files were being written — `e86fbf6 → ef25624` (`feat(repair)`, committed 03:14:06 +0400) and `ef25624 → 11875da` (`feat(cleanup)`). The dirty tree changed from 8 modified + 610 untracked to 5 modified + 604 untracked between two commands. A Repair workspace file set was open, then a Cleanup one. Anyone instructed to "record the baseline" and then trust it would have based work on a commit that no longer existed.

**CHANGED:**
- `01_PRECEDENCE_AND_BASELINE.md` Part 2 states the baseline **as a command list (§2.6) rather than as a set of SHAs**, and §2.1 makes the moving-target fact the first thing the agent reads. Values in §2.2 are labelled dated observations.
- Volume 1 §3.1 and §11 items 3 and 5 carry inline CORRECTED notes with the measured numbers and the command to re-measure.
- Part 3 adds concurrent-agent protection: explicit prohibition list (`reset --hard`, `checkout --`, `restore`, `clean`, `stash drop`, `worktree prune/remove`, `branch -D`, force-push, history rewrite); work only in your own worktree; the named state of every shared artifact — including that `C:\KNOuX-OpenHands-NativeServices` is **missing and git marks it prunable, and it must not be pruned** (its branch is fully contained in `main`, so nothing is gained and a registration plus reflog is lost); the files that are currently another agent's uncommitted work (`docs/MISSION_LEDGER.json` is dirty now); the pre-switch preservation bundle; and the `git log -1 -- <path>` / `git status --porcelain -- <path>` check before editing.
- **No destructive cleanup and no automatic branch integration is instructed anywhere.** The donor branch is integrated by reviewed cherry-pick or not at all, and merging into `main` still requires separate owner authorization.

---

## Item 7 — blanket completion conditions removed

**Found:** the old prompt asserted product completion as *"every Class B service lets the user act … with a durable journal, and real undo"*, and Volume 1 §9.7 demanded a packaged organize→verify→undo cycle of all nine Domain 03 services. With 4 of the 9 registered class A — they move nothing — the requirement was unsatisfiable except by faking a test, which the same package forbids. Same shape everywhere: 98 class-A services were inheriting action gates they cannot execute.

**CHANGED — a per-service `reversibility_class`, computed from the ledger class *and* the verified presence of an executor in that domain:**

| class | entries | completion condition |
|---|---|---|
| `READ_ONLY_BY_DESIGN` | 98 | measured fields, explicit unavailable-with-reason for the rest, fixture parity. Packaged and owner-data effect gates **do not apply** and must not be reported as outstanding |
| `REVERSIBLE_WITH_JOURNAL` | 25 | fixture effect + journal-before-effect + postcondition re-read + tested restore, then real Electron / packaged / owner-consent as three **separate** recorded layers |
| `ACTION_WITHOUT_EXECUTOR_YET` | 17 | staged: preview+plan-hash → executor behind consent → journal+verify → restore or documented impossibility → Electron → packaged → owner data. A service at stage 2 is reported as stage 2 |
| `PROVIDER_DEPENDENT` | 13 | local credential flow, scope recording, revocation, least-privilege, honest not-connected states on a mock provider; live completion needs a real account and, for restricted scopes, vendor verification. A mock pass is never reported as live |
| `UNCLASSIFIED_NO_IN_CODE_SERVICE` | 12 | D01: cannot be completed as specified until the owner decides whether each entry is a service or a route to another domain's service. No acceptance condition applies before that |
| `PRIVILEGED_WINDOWS` | 9 | elevation detected and requested per action, declined path a first-class tested state, effect re-read from the OS. **No undo gate may be written where the platform has none** |
| `IRREVERSIBLE_OR_VENDOR_SIDE` | 7 | honest preview + typed consent naming the exact command + truthful irreversibility. Rollback is not demanded where none exists |

The 17 `ACTION_WITHOUT_EXECUTOR_YET` entries are the sharpest example of why one blanket condition failed: they are class B services in domains where no mutation executor exists in source at all, so demanding undo evidence would ask for a test of a thing that is not there.

Volume 1 §9.7 was rewritten into class-A and class-B bars plus a domain-claim rule: reporting the domain complete because the read services pass, **or** incomplete because a read service lacks a packaged undo test, are both errors.

---

## Item 8 — internal contradictions removed, and the package is an execution spec

**Fixed misattributed references.** The reviewed prompt told Codex to follow *"Appendix B of Volume 1"* for the handover and *"Volume 1 Appendix C"* for the completion definition. **Those appendices are not in Volume 1** — Volume 1 contains no `Appendix` string at all. They exist in `Evidence/99_tail.md`, an archive file the prompt never named. Pointing an agent at the wrong document for two governing requirements is how the handover gets invented on the spot.

Both requirements are now written where they are used: handover content is §Step 6 of the new prompt; completion is §Step 5's per-class table. `Evidence/00_PROVENANCE_AND_RANK.md` records the true location and marks Appendix C's blanket clause as superseded.

**One substantive correction to Appendix C itself.** Its clause *"every Class B service lets the user perform the action after deliberate approval, with verified effects, a durable journal and real undo"* plus *"packaged builds pass the same effect tests"* is the blanket condition the owner correction item 7 targets: 17 class-B services have no executor at all, 98 class-A services have no effect to package-test, and `IRREVERSIBLE_OR_VENDOR_SIDE` services have no undo to demonstrate. The clause is kept for the services it can apply to and replaced per class elsewhere; Appendix C is left byte-identical in the archive because it is a historical document, and the supersession note is what a reader sees.

**Fixed stale delivery status.** Volume 1 §0's volume map said Vol. 3, 4 and 5 *"Not yet written"* and Vol. 6 *"Blocked on repository access"* — inside a package that shipped all of them, and while Volume 2 §29–30 still asked the owner for the access that had already been given. Replaced with a table of the four delivered volume files plus the two new layers, and Volume 2 §30 marked SUPERSEDED with what genuinely remains owner-dependent.

**Fixed garbled text** introduced by earlier folding, found while diffing: Volume 3 §40's column note ended `…must fill the exact operation later.ration ID.`; Volume 2's header note ended `…Volume 1 Section 18.lumes 6–7 disagree about…`. Both repaired to complete sentences.

**Fixed a stale claim about verification.** Volume 8 §50.1 relied on `win-unpacked` smoke confirmation. Measured: both real-runtime receipts in `apps/gemini-ui/visual-evidence/platform-00/` are dated **2026-10-27**; the packaged one is `exitCode 0`, the **dev one is `exitCode 1`**, cause identifiable at `/renderer/studio/thumbs/data/3/reason = THUMBNAIL_PROVIDER_FAILED`. Six-plus commits landed after them. §50.1 now carries that with the paths, and states that `desktop:smoke` / `desktop:packaged-smoke` are **not in the CI workflow**, which runs lint (`tsc --noEmit`), build, theme, i18n, ledger:check and the 20 domain suites.

**Framing.** The corrected prompt opens by stating the product is **not** declared production-ready, and that this package is a production-engineering execution specification. Coverage claims are bounded: 132 of 181 entries have a located renderer integration point; 49 have a **verified absence**, which is a finding rather than an unknown; 65 are named by a gated test, 70 only by scripts no npm script runs, 46 by nothing at all.

**KEPT, deliberately:** all 181 contracts, the 181-row matrix, the per-service evidence addenda with acceptance-test IDs, the §32.2 evidence classes, the §35 test catalogue, the §36–§38 determinations, Volumes 8 §44–§50 cross-cutting chapters, and the entire `Evidence/` archive byte-identical (its SHA-256 matches the tracked repo copy: `cb77ceeb1a2fa07a…`). No authoring was restarted; nothing was discarded.

---

## What this correction pass did not do

- Ran **no** per-service acceptance test and **no** real-Electron gate. `current_runtime_verification` is `NOT RUN` for all 181 rows because of that, and that is the accurate entry, not a placeholder.
- Modified **no** source file, committed **nothing**, pushed **nothing**, created **no** branch or worktree, and pruned **nothing**. `scripts/verify-workspace.py` returned `PASS` at the start.
- Did not resolve the 157 revalidations — it queued them. Resolving them from a document is exactly what the reviewer rejected.
- Did not touch any concurrent agent's work. All new files are under `_spec_review/`, which was already untracked and is listed as such in `git status`.
