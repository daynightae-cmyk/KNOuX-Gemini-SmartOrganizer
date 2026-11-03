# KNOuX SmartOrganizer — Ultimate 181-Service Specification — Final Package

## Open order

1. `00_AGENT_EXECUTION_PROMPT.md` — paste this to Codex to begin execution immediately.
2. `Spec/Volume_1_Sections_01-22.md` — architecture, Git policy, 181-service inventory, contract template,
   Domains 03, 02, 01, 06, 07, 08, 09, 11, 12.
3. `Spec/Volume_2_4-5_Sections_23-31.md` — Domains 10, 05, 13, 04, 14 + Storage addendum.
4. `Spec/Volume_3_6-7_Sections_32-43.md` — evidence reconciliation, WinGet/Google/sensor determinations,
   the 181-row acceptance matrix, per-service evidence addenda with acceptance tests.
5. `Spec/Volume_4_8_Sections_44-50.md` — cross-cutting chapters: shared capabilities, unified workspace UI,
   native provider architecture, persistence/recovery, cross-domain integration contracts,
   regression protection, packaged-runtime acceptance.
6. `Evidence/` — the owner-supplied evidence archive (ledger CSV, capability matrix, registry,
   implementation CSV, workbench acceptance/audit docs, mission ledger) — extracted, unchanged.

## Coverage

All 38 structural items of the original Master Authoring Directive are covered across Volumes 1–4
(see Volume 4 §44-50 closing note for the gap closure list). All 181 registered services have an
individual 12-part contract (Volumes 1–2) and a reconciled-status evidence block with acceptance
test IDs (Volume 3 §41). Nothing here was fabricated: every "current implementation" claim traces
to a named file in `Evidence/`; everything else is marked NOT VERIFIED or as a REQUIRED/DERIVED
engineering determination, per the evidence discipline defined in Volume 1 §1.

## Known limits (stated once, not per-file)

- Written from a supplied evidence archive, not live repository access — Step 0 of the execution
  prompt requires Codex to re-verify current HEAD state before trusting any status in Volume 3 §40/§41.
- Windows-native runtime layer and packaged-release signing remain open blockers requiring a
  disposable Windows host and a code-signing certificate respectively (Volume 4 §50, Volume 3 §42).
