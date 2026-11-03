# KNOuX SmartOrganizer — 181-Service Specification — Corrected Package (v2)

Correction pass dated **2026-11-03**. The reviewed package's authoring is preserved: all four specification volumes, the 181-row acceptance matrix, the per-service evidence addenda and the evidence archive are present and unchanged in substance. This pass corrected precedence, separated historical classification from current verification, completed the per-service contracts, reconciled the duplicated Storage section, replaced the stale baseline, and removed the impossible blanket completion gates. `02_CORRECTION_LEDGER.md` lists every change and the evidence that forced it.

**This is a production-engineering execution specification. It does not declare KNOuX production-ready, and nothing in it should be reported as such.**

## Open order

1. `01_PRECEDENCE_AND_BASELINE.md` — what outranks what, the measured baseline, and the rules for working in a checkout that other agents are writing to. Read before anything else.
2. `00_AGENT_EXECUTION_PROMPT.md` — the revised prompt for Codex. Self-contained; paste it whole.
3. `Matrix/revalidation_queue.md` — the operational list: 157 entries needing mandatory source revalidation, 24 needing confirmation only, in work order.
4. `Matrix/matrix_181_v2.csv` — the working matrix, 181 rows generated from the repository, historical status and current-runtime verification in separate columns.
5. `Contracts/` — all 181 entries in the full A–L structure, one file per domain, with `00_INDEX.md` at the head.
6. `Spec/Volume_1_Sections_01-22.md` — evidence discipline, architecture, the 181-entry inventory, the contract template, Domains 03, 02, 01, 06, 07, 08, 09, 11, 12. Authoritative for required behavior.
7. `Spec/Volume_2_4-5_Sections_23-31.md` — Domains 10, 05, 13, 04, 14. Its Storage addendum is withdrawn; Volume 1 §18 is the single Storage contract.
8. `Spec/Volume_3_6-7_Sections_32-43.md` — evidence reconciliation, the WinGet / Google-scope / sensor determinations, the 181-row matrix v1 (kept as provenance; superseded row-by-row by the CSV), per-service evidence addenda, consolidated blockers.
9. `Spec/Volume_4_8_Sections_44-50.md` — shared capabilities, unified service workspace contract, native provider architecture, persistence and recovery, cross-domain contracts, regression protection, packaged-runtime acceptance.
10. `Evidence/` — the owner-supplied archive, byte-identical to the reviewed package. Historical record, ranked below the source tree.
11. `build/` — the scripts that regenerate `Matrix/` and `Contracts/` from the repository. Generated files are never hand-edited.

## What is actually in the product now — measured, with the limits stated

| Question | Measured answer | How |
|---|---|---|
| Registered service entries | **181** | `docs/LIVE_SERVICE_EXECUTION_STATUS_181.csv` |
| Entries with a located renderer integration point | **132** | generated scan of `apps/gemini-ui/src` |
| Entries with a **verified absence** of one | **49** — D01 (12), D02 (10), D03 (9), D04 (10), D14 (8) | the same scan found no case branch, workbench-map key or equality branch for them |
| Registered IPC channels / capabilities | **140 / 137** | `apps/gemini-ui/shared/native-contract.json` |
| Operation channels outside that registry | **33** | `electron/native/operation-ipc.cjs:10` |
| Typed renderer binding functions with envelope payloads | **120** | `Matrix/native_binding_map.json` |
| Real mutation executors in source | **5 families** — organization move/undo, quarantine vault, HKCU Run entries, service start/stop, consented clipboard write | bridge reads |
| Entries proven at a real-runtime layer, at this baseline | **0 of 181** | the only real-runtime receipts are dated 2026-10-27 and one is `exitCode 1` |
| Catalog-id → capability-id crosswalk in code | **none** | searched `capabilityId`, `SERVICE_TO_CAPABILITY`, `nativeCapability`: zero hits |

Two coverage numbers people get wrong, so they are stated here once: **132 located integration points does not mean 132 working services** — an `ICON_SWITCH` or navigation-rail hit is not a workbench, and the matrix reports the strongest site per service and labels its kind. And **`NOT RUN` for current runtime verification is this pass's honest report**, not a claim that the product does not work; the pass executed no per-service gate.

## How the package reads itself now

- **Precedence.** Source tree at HEAD and observed runtime behavior outrank every document here, including this one. The specification is authoritative for required behavior only. The phrase "sole source of truth" is retired.
- **Status.** Every entry carries two separate fields: a historical classification copied from a dated record, and a current-runtime verification field. They are never merged into one word. 157 entries are flagged for mandatory source revalidation; 24 previously assessed entries keep their classification and are flagged confirm-not-regressed. Nothing was downgraded without evidence — all four recorded implementation SHAs were tested and are reachable from the current tip.
- **Baseline.** No SHA in this package is a baseline. `01_PRECEDENCE_AND_BASELINE.md` §2.6 gives the commands instead. The repository is shared: local `main` advanced twice during this correction pass, and the shipped package's recorded HEAD was already four commits stale when it was written.
- **Ownership.** Other agents' uncommitted and untracked files are protected by name. No destructive cleanup, no automatic branch integration, no merge to `main` without separate authorization.
- **Completion.** Seven reversibility classes, each with its own completion condition. Read-only services are not defective for lacking a packaged undo test, and services with no executor are reported at their real stage rather than as "partial".

## Known limits, stated once

- The Windows-native and packaged-release layers need a disposable Windows host and a code-signing certificate. Both remain open blockers (Volume 3 §42, Volume 8 §50) and neither is closed by anything in this package.
- Google restricted and sensitive scopes need real authorization and, where applicable, vendor verification (Volume 3 §37).
- Battery and thermal telemetry are host-dependent; the owner's reference machine reports no battery and partial thermal data, so those services are proven by recorded fixtures until another host is available (Volume 3 §38).
- `Contracts/` and `Matrix/` were generated against HEAD `11875da…` on 2026-11-03. Re-run `build/` after any commit — that is the designed refresh path, and a stale generated file is a bug in the process, not a fact about the product.
- This correction pass modified no source file, committed nothing, pushed nothing, and created no branch or worktree. Its output is entirely under `_spec_review/`.
