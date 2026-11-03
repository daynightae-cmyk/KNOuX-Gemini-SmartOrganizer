# Evidence archive — provenance and rank

Copied unchanged from the reviewed package. Every file here is byte-identical to what the owner supplied
(verified by SHA-256 against the repository's tracked copies during the 2026-11-03 correction pass).

**Rank in the precedence order: 5 of 6.** See `../01_PRECEDENCE_AND_BASELINE.md` Part 1. These files are
dated claims *about* the implementation. They are the record of what was known on their stated dates, and
they are outranked by the source tree at HEAD, by a tested SHA with a recorded result, and by behavior
observed on a real Windows host.

| File | What it is | Date it speaks for | Known limit, stated in the file itself |
|---|---|---|---|
| `docs/LIVE_SERVICE_EXECUTION_STATUS_181.csv` | the 181-entry ID registry plus per-entry status | newest slice as shipped | **157 of 181** rows read `NOT_REASSESSED_IN_THIS_SLICE`; 23 `IMPLEMENTED_AND_TESTED_FIXTURES`; 1 `PARTIAL`. Its own readme says it holds 181 *registered entries*, not 181 verified engines |
| `docs/SERVICE_WORKSPACE_IMPLEMENTATION.csv` | most recent per-service implementation record | as recorded | `provider_native_binding` frequently reads "Existing contract retained; not newly audited" — that is an assertion of **non-audit**, not evidence |
| `docs/SERVICE_CAPABILITY_MATRIX.md` | advertised capability backlog, one row per service | 2026-11-02 | **181 rows** (verified: 12/10/9/10/12/12/12/12/12/36/12/12/12/8 by mission). Its `Real provider`, `Actual executor/UI action`, `Consent & recovery` and `Fixture end-to-end` columns are **substantive for only 59 rows**; the other **122 read `AUDIT_REQUIRED`**. The 59 are ingested into `Contracts/` labelled "LEDGER CLAIM (rank 5, confirm against source)"; the 122 are not treated as evidence of absence or presence |
| `docs/SERVICE_REGISTRY_EVIDENCE.md` | native-provider / evidence registry | 2026-10-26, amended 10-27 and 11-02 | covers 150 registry IDs |
| `docs/SERVICE_WORKBENCH_ACCEPTANCE.md` | UI workbench acceptance audit | oldest | the file states it is "NOT TEST EVIDENCE" |
| `docs/SERVICE_WORKBENCH_HOST_AUDIT.md` | ServiceWorkbenchHost integration audit | as recorded | layout/chrome level only |
| `docs/MISSION_LEDGER.json` | mission and branch bookkeeping | 2026-11-02 | names the CSV as authority **for the 181 identifiers only** — not a status oracle |
| `missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md` | the standard this spec enforces | standing | normative, not descriptive |
| `docs/handoffs/VISUAL_FIDELITY_CODEX_20261102.md` | visual continuation handoff | 2026-11-02 | was untracked (`??`) in the pack manifest at capture time |
| `PACK_MANIFEST.json`, `README_FOR_CLAUDE.txt` | archive manifest and readme | 2026-11-03T00:19:24+04:00 | records HEAD `8ff8131…`, which was already four commits stale by the time the corrected package shipped — the concrete reason the baseline rule exists |
| `00_front_a.md`, `00_front_b.md`, `99_tail.md`, `gen.py`, `d01.py`, `d02.py` | the authoring session's own inputs and generators | 2026-11-02/03 | kept because they show how the archive was assembled; they are not product evidence |

## Where the handover and completion templates actually live

The execution prompt of the reviewed package told Codex to follow *"Appendix B of Volume 1"* and *"Volume 1 Appendix C"*. **Neither appendix is in Volume 1** — Volume 1 contains no `Appendix` string. Both are in `Evidence/99_tail.md`:

- **Appendix B — Handover Template**: retained as-is; its eight required sections are restated in Step 6 of `../00_AGENT_EXECUTION_PROMPT.md`, which is the file the agent actually reads.
- **Appendix C — Product Completion Definition**: **partially superseded.** Its class-A / class-B / class-C / class-D clauses are correct in intent, but two of its conditions are impossible for large parts of the fleet: *"real undo"* cannot apply to a service with no mutation, and *"packaged builds pass the same effect tests"* cannot apply to the 98 read-only services or the 17 class-B services whose domain contains no executor at all. Completion is now defined per `reversibility_class` — see Step 5 of the prompt and the per-service "Completion condition for this class" line in `../Contracts/`. The clause stands unchanged **for the classes it can apply to**; nothing was weakened for those.

This note is a separate file so that every archived document above stays byte-identical to what the owner supplied.

**How to use these files now:** read `../Matrix/matrix_181_v2.csv`, which copies each ledger's claim into
clearly named `historical_*` columns, records whether its implementation SHA is reachable from the current
tip (all of them are), and puts `current_runtime_verification` in a separate column that reads `NOT RUN`.
Do not promote a value out of these files into a status claim without a citation.
