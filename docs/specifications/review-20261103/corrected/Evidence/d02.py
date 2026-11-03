INTRO = """
**Route `smart_scan`.** Ten measured services share one `ScanBridge` coordinator, one persisted session model and one embedded `ScanServiceWorkspace` inside the pinned side/expanded host (340–720 px, persisted `knoux.scan.workbench.mode|width`) **[PACK]**. The Smart Scan domain **observes**; every mutation it can motivate (delete, quarantine, uninstall, startup change, move) belongs to the owning domain and must use that domain's executor and consent.

**Domain contract (REQ).**
- A scan session is `{sessionId, kind: quick|deep|duplicate|large|junk|privacy|startup|apps|system|recommend, scope[], startedAt, endedAt, state, counts, findings[], coverage, skipped[]}` persisted (survives restart) and bounded.
- Authorization/indexing happens inside the tool (existing in-tool folder authorization); a scan never walks outside its grant (G-B4 corpus applies to scope handling even though the domain is read-only).
- Cancel reaches the native walker/hash worker and stops it within 1 s (G-A5).
- Findings are *evidence*, never verdicts: privacy and junk classifications cite the rule that produced them; there is **no antivirus or malware claim anywhere** **[PACK/Vol. 1]**.
- Hand-offs: each finding exposes a typed `handoff {targetServiceId, payload}` that opens the owning domain with the selection preloaded; the owning domain re-validates everything (no trust of Smart Scan output).

**Domain completion.** All ten services run real scans on disposable fixtures with cancel/resume of results across restart, packaged smoke passes, hand-offs land in the correct owning service, and Large Files / Junk Cleaner hand-offs are proven end-to-end against the Studio and Cleanup executors.
"""
ANCHORS = ["`apps/gemini-ui/src/smart-scan/SmartScanHero.tsx`", "`ScanBridge`, `ScanServiceWorkspace`, `ScanStageConsole`, `ScanReviewInspector` (named in pack; locate by symbol)", "`docs/SMART_SCAN_RUNTIME_ACCEPTANCE.md` (referenced by the matrix; not in the pack)"]
G2 = "implementation: READ_ONLY · dev+packaged smoke `scanWorkbenchOk`/`scanWorkbenchLayoutOk` PASS (2026-10-27, historical) · fixture-test: named but not in pack · packaged-effect/owner-data/visual: `NOT_RUN`"
def mk(**k):
    k.setdefault('st','MEASURED_READ_ONLY'); k.setdefault('conf','MEDIUM (acceptance row 2026-10-27; historical)'); k.setdefault('gates',G2); return k
S = {
'mission-02-01': mk(
 ex="Native `ScanBridge` measured quick scan with in-tool folder authorization/indexing, native cancellation, measured evidence copy and visible failures.",
 mi="Re-audit: confirm bounded depth/time for 'quick', explicit coverage report (files seen, skipped, errors), restart persistence of the last session, and that results never imply whole-disk coverage.",
 nat="`ScanBridge` quick profile: top-N recent/large/duplicate-candidate summary over authorized roots using the shared filesystem walker; deterministic ordering; coverage object.",
 ui="Run/Re-measure control, scope chips, live counts (measured or indeterminate), cancel, results list with hand-off actions, coverage panel, copy evidence.",
 lc="Authorize → run → persist session → review.",
 t=["Fixture tree of 1 000 files → quick scan counts equal independent walk; coverage lists 0 skipped.","Add a junction and an access-denied directory → both appear in `skipped` with reasons; walker does not follow the junction.","Cancel at 30 % → walker stops; session saved as `cancelled` with partial counts labelled partial.","Restart → last session restored with original timestamps.","Progress is indeterminate until total is known (no invented percent)."],
 dep="D03.01 scope grants, D06.07"),
'mission-02-02': mk(
 ex="Native measured deep scan through the same coordinator.",
 mi="Re-audit: deep profile must be resumable or at least safely cancellable, bounded in memory, and must label sampling vs exhaustive hashing; verify long-path and locked-file handling.",
 nat="Deep profile: exhaustive walk with metadata, optional content hashing of size-matched candidates (SHA-256), long-path aware, skips and reports locked files; memory ceiling from D14.01.",
 ui="Same workbench; profile selector (Quick/Deep) with the exact parameters each uses; elapsed time measured; coverage and skipped panel.",
 lc="Authorize → deep run → persist → review.",
 t=["Fixture with a 270-character path and a locked file → both handled: long path scanned, locked file in `skipped(E_LOCKED)`.","50 000-file fixture → memory under documented ceiling; UI virtualized.","Hash step only runs on size-equal candidates (assert hash count).","Cancel stops hashing child workers (assert worker count 0)."],
 dep="D14.01 limits"),
'mission-02-03': mk(
 ex="Native `ScanBridge` duplicate evidence; read-only, cleanup gated.",
 mi="Verify duplicates are byte-exact (size → partial hash → full SHA-256 → optional byte compare), never name/size-only; no keeper heuristic that deletes; hand-off to Storage Safety Vault (D07.03/D07.10) for reversible quarantine.",
 nat="Staged duplicate pipeline with per-stage counters; groups carry digest, size, member fingerprints (size, mtime), and read errors.",
 ui="Group list, member inspector, explicit 'choose keeper' (manual, per group), select-for-review; hand-off button 'Review in Safety Vault' preloading keeper + candidates.",
 lc="Scan → group → manual keeper → hand-off to D07 (executor lives there).",
 sec="Hand-off carries fingerprints; D07 re-verifies content hash at plan time and execution time.",
 t=["Fixture: 3 identical files + 1 same-size different-content file → one group of 3; the odd file excluded.","Two files differing in last byte but equal size and equal first 1 MB → not grouped.","Hand-off payload includes fingerprints; modifying a member before D07 plan → D07 refuses (`E_FINGERPRINT`).","No code path deletes from D02.03 (assert channel list).","Cancel during hashing leaves no partial group shown as confirmed."],
 dep="D07.03, D07.10"),
'mission-02-04': mk(st='PARTIAL', conf='HIGH (implementation CSV: PARTIAL)', unc="Ledger notes final Electron acceptance NOT_RUN for the Studio hand-off.",
 gates="implementation: PARTIAL · selection + Studio hand-off implemented per implementation CSV; final Electron acceptance `NOT_RUN`",
 ex="Ranked-file list with real checkboxes, select shown/clear, session-bound selection and a dedicated Studio transfer-review hand-off (existing Studio picker → fresh scan → immutable plan → native consent → move/copy → receipt/undo).",
 mi="Final Electron acceptance not run; confirm the hand-off invalidates old approvals and reindexes the original root; large-file ranking must use the same rules as D06.10/D07.02 (no divergent top-N).",
 nat="Reuse D03 `OperationEngine`; Smart Scan supplies selection + session binding only; Studio re-reads the source (source must match the scan session).",
 ui="Ranked list with size bars (measured), selection summary (count/bytes), 'Send to Studio for review' (not 'Move'), error when the source no longer matches.",
 lc="Select → hand-off → Studio plan/approval/execution (D03.06/.07).",
 t=["Select 5 of 20 large files → Studio receives exactly those 5 with fingerprints; plan shows 5.","Source folder replaced between scan and hand-off → Studio refuses with source-mismatch and requires a fresh scan.","Old approval for a previous selection is invalid after hand-off (stale hash).","Ranking equals D06.10 for the same scope (cross-service equality).","Packaged Electron repeats the first test."],
 dep="D03.06, D03.07, D06.10"),
'mission-02-05': mk(st='PARTIAL', conf='HIGH (implementation CSV: PARTIAL)', cls='C', clsnote="Scanning is Class A; deletion/quarantine is Class B/C and lives in D08/D07. This entry's own deliverable is classification evidence + hand-off.",
 gates="implementation: PARTIAL · junk evidence measured; no deletion channel (by design here) · approval gate · final acceptance `NOT_RUN`",
 ex="Native `ScanBridge` junk evidence with the Mission 08 cleanup gate; no deletion channel.",
 mi="Verify junk categories are an explicit allowlist (temp, caches, logs, recycle) each with a rule ID and path pattern; protected locations never listed as deletable; hand-off to D08 for quarantine; no 'clean now' button here.",
 nat="Rule catalog (versioned, shipped in-app) mapping path patterns → category, risk, recoverability; scan emits findings with `ruleId`.",
 ui="Category cards with byte totals (measured), rule explanation popovers, 'Review in Cleanup' hand-off.",
 lc="Scan → classify by rule → hand-off to D08.01 (candidate ledger).",
 sec="No write channel; Cleanup re-classifies independently at plan time.",
 t=["Fixture with %TEMP% clone files → each tagged with the right `ruleId`; a file in a protected directory is excluded and listed as `protected`.","Rule catalog version is shown and included in exports.","No delete/quarantine IPC reachable from this workspace (channel assertion).","Hand-off populates D08.01 with identical candidate set; D08 recomputes and flags differences."],
 dep="D08.01"),
'mission-02-06': mk(
 ex="Native `ScanBridge` privacy evidence; read-only with partial scope.",
 mi="Re-audit: define exactly which traces are examined (recent-file lists, Jump Lists, browser history stores existence, clipboard history presence, Zone.Identifier streams); report existence and size/age only, **never content**; browser profile locations must be read as metadata only.",
 nat="Trace catalog: path/registry locations with `exists`, `sizeBytes`, `lastModified`; no content parsing; links to D08.09 (browser cache) and D14 Clipboard Vault for actions.",
 ui="Trace list by category with 'what this is' text; counts; 'open in owning tool' hand-offs; explicit 'content is not read' note.",
 lc="Scan → catalog evaluation → review.",
 sec="No content reads; no deletion; results never exported with paths unless the user chooses.",
 t=["Fixture profile with a fake recent-files directory → counted by metadata only; file content read count = 0 (spy).","Zone.Identifier fixture → counted; contents not displayed.","Missing locations → `not present`, not `0 traces found`.","Scope limits are displayed (partial scope disclosed)."],
 dep="D08.09, D14.04"),
'mission-02-07': mk(
 ex="Native `ScanBridge` startup evidence; startup writes blocked here.",
 mi="Re-audit: summary must reuse the D09.01 inventory and D09.07 evidence instead of a second collector; consistency between D02.07, D05.12 and D09.01 counts.",
 nat="Call D09 read APIs; no separate registry reader.",
 ui="Impact list ranked by measured evidence only (boot events, entry type); each row opens D09.01/.02.",
 lc="Scan → read D09 → rank by evidence.",
 t=["Same startup fixture → counts equal D09.01 and D05.12.","No boot evidence → impact column shows `not measured`.","No write channel (assert).","Row click opens D09.02 with entry preselected."],
 dep="D09.01, D09.07"),
'mission-02-08': mk(
 ex="Native `ScanBridge` app-health evidence; uninstall blocked.",
 mi="Re-audit: health indicators must be limited to obtainable facts: missing install directory, broken uninstall string target, unsigned/invalid signature, orphaned AppX; no 'health score'.",
 nat="Reuse D05.01/D05.02 inventory and signature verification; indicators computed from provider facts with `evidence` fields.",
 ui="Indicator list with evidence per row; hand-off to D05.06/D05.07.",
 lc="Scan → evaluate indicators → hand-off.",
 t=["Fixture app with missing install dir → flagged with evidence 'path not found'.","Unsigned binary fixture → flagged; signed fixture not flagged.","No composite score present (UI string scan).","Counts equal D05.01 subset queries."],
 dep="D05.01, D05.02, D05.06"),
'mission-02-09': mk(
 ex="Native `ScanBridge` system evidence.",
 mi="Re-audit: must call D10 observation providers (events, drivers, disk, memory) rather than duplicate; no overall 'system score'.",
 nat="Typed reads from D10.01/.02/.07 and D07.01.",
 ui="Findings list: event-log error counts (time window shown), unsigned drivers count, low disk, high memory pressure — each with evidence and 'open in System'.",
 lc="Scan → aggregate → hand-off.",
 t=["Event fixture with 3 critical events in window → finding shows 3 and the window.","Provider unavailable (event log access denied) → finding group `unavailable` with reason, not 0.","Counts equal D10.02 for the same window.","No score is rendered."],
 dep="D10.01, D10.02, D10.07"),
'mission-02-10': mk(cls='B', clsnote="Recommendations are Class A evidence; any applied recommendation is performed by the owning domain.",
 ex="Native `ScanBridge` recommendation evidence; read-only; no auto-apply.",
 mi="Re-audit: each recommendation must cite measured evidence (session finding IDs) and map to exactly one owning-service hand-off; no model call; no recommendation without evidence.",
 nat="Deterministic rule engine over persisted session findings; `Recommendation {id, evidenceRefs[], targetServiceId, payload, risk}`.",
 ui="Recommendation cards with 'why' (evidence), risk label, 'Review in <service>' action; dismiss with memory; no 'Apply all'.",
 lc="Evaluate rules → render → hand-off.",
 sec="Never auto-applies; dismissal state is local.",
 t=["Fixture with duplicates and temp junk → exactly two recommendations, each with correct evidence refs.","Removing the evidence removes the recommendation.","Clicking opens the owning service with preload; no operation starts.","Rules versioned; version shown."],
 dep="D01.10"),
}
