"""Idempotently extend all KNOuX mission specs with actual usable service acceptance."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parent.parent
M=ROOT/"missions"
assert (M/"REAL_SERVICE_FUNCTIONALITY_STANDARD.md").exists()
# Relevant domain-specific action expectations, aligned to the EXISTING advertised services.
DOMAINS={
"01": """- Home is a LIVE command center, not a slide of imported counts. Its cards must navigate to real providers and the relevant service context, display trustworthy pending approved operations, actual running jobs, error states and completion receipts.
- Home actions: launch a real user-scoped scan, open the real organization builder, queue app management and cleanup plans, inspect authorized storage/Windows telemetry, access restore/review flows and global indexed search. No action may pretend to execute when it only navigates.
- Smart recommendations must link evidence to a specific service action and show a preflight/approval if the suggestion changes state. Recent Activity must report persisted verified operations, NOT fake fixture timestamps.
- Tests: click-through from Home to real functional service, confirm actual chosen input/receipt/cancel/back-navigation and real data refresh; exclude synthetic KPI as product proof.""",
"02": """- Quick and Deep Scan: execute scoped real inventory with progress, cancellation, severity evidence, coverage, refresh, and full browse/export; not a 100% fake scan animation.
- Duplicate Finder and Large Files must connect findings to the existing scoped File/Storage selector and actually executable user-approved file plan once that shared executor exists; hash verification before any destructive proposal.
- Junk Cleaner/Privacy traces expose real source-specific candidate policies and hand off to the validated Cleanup quarantine/purge executor after exact approval; no silent deletion or history wiping.
- Startup Impact and App Health link measured evidence directly to genuine Startup/Applications maintenance actions. System Health Pulse links to supported diagnostics and consent-gated Repair. Recommendations must be individualized, actionable and explain why.
- Tests must cover scan -> finding -> selected preview -> action gate -> effectful disposable-fixture executor OR explicit honest PARTIAL for a missing executor.""",
"03": """- Studio's PRIMARY PURPOSE is to organize real user-selected folders. Implement the actual controlled file-operation engine: authorized scoped source/destination, category rules, preview, transactional move/copy/rename or organize, collision policy, file integrity verification, cancel, durable journal and **working Undo/Restore** where possible.
- Respect symlink/junction boundaries, same-volume atomic moves when available, external drive failure, protected files, duplicates, rechecks and rollback conflicts.
- The nine stages are a workflow from source selection to EXECUTION and HISTORY, not nine disconnected read-only exhibitions. Execution buttons cannot be permanently disabled in the finished product.
- Tests must execute real file operations on temporary owned fixtures, assert files/bytes at destination, confirm original metadata and real undo; do NOT organize personal user folders during agent work.""",
"04": """- Google Workspace is an optional authenticated product integration, not a forever disconnected decorative panel. Build consent-gated OAuth PKCE / least-privilege scope negotiation / secure tokens / refresh / disconnect and per-service authenticated API adapters; do not connect any actual account during unattended development.
- Sheets: real browse/read and edit/create with explicit confirmation. Gmail: actual search/read/draft and separate SEND approval. Tasks: create/edit/complete; Calendar: create/update/delete with conflict and time-zone preview. Contacts: authorized browse/update where scoped. Drive Picker: actual supported file selection. Slides/Forms/Chat/Classroom: implement only vendor-supported operations permitted to the connected account and label unavailable scopes transparently.
- Offline/revoked/expired/quota/error branches and per-write idempotency required; OAuth UI alone is NOT production-complete or proof that authenticated services work.
- Tests: mock provider server/contract and end-to-end request/retry/revocation; real-account validation is a separate human consent gate, not a license to claim live connected success.""",
"05": """- Apps inventory and signatures/search/footprint are real measured tools. **Bulk Uninstall** must offer actual official vendor uninstall/Windows package mechanism through typed allowlisted capability, explicit selections, exact publisher/path/affected-app preview, separate confirmation, progress, verified disappearance, exit-code diagnostics and reboot status; no fake rollback of uninstallation.
- Update Center and WinGet should implement real supported discover/install/update transactions only after approval; protect system packages and enforce binary signature/trust.
- Leftovers scanner must NOT guess-delete shared DLLs or arbitrary registry. Make a verified ownership report, offer narrowly scoped opt-in cleanup and quarantine/recovery where feasible.
- File associations/startup integration navigate to validated supported Windows settings or perform scoped native changes with proper permission; no invented installer actions.
- Tests: fake Windows installer/package backend end-to-end with success/failure/cancel; do not uninstall owner's installed apps.""",
"06": """- Files must deliver fast authorized search/filter/metadata plus the actual core user promise: selected file/folder rename/move/copy/organization, collision resolution, staging preview, verification, durable journal and reversible Undo where feasible.
- Use one shared File/Studio action executor rather than duplicate engines. Respect reparse points, locks, size/quota, hash/integrity, path traversal and postcondition; open/reveal must resolve validated original file.
- Everything-style responsiveness should be measured on real scoped indexes; an in-memory 100K synthetic benchmark does NOT prove persistent whole-disk indexing.
- Tests: selected disposable files, action confirmation denied/approved, actual changed files, safe undo and collision/locked/offline failures.""",
"07": """- Volume telemetry, capacity history and treemap are genuinely observational if measured. Storage Reclaim, duplicate management and optimize controls must produce genuinely executable user-approved handoffs to the shared Cleanup/Files engines, with actual freed-byte verification and rollback/quarantine when possible.
- Never delete duplicate copies automatically. Select keepers, validate SHA-256 plus metadata, handle hardlinks/junctions and hard refusal for system files; actual change test on disposable fixture.
- SMART, TRIM and defrag require reliable supported Windows/hardware providers, elevation and operator consent as appropriate. If unsupported show honest device-specific limitation and safe Windows settings route; NEVER fabricate diagnostics.
- Recycle bin/drive operations cannot claim ready until supported native postconditions have been verified.""",
"08": """- Cleanup must actually allow a user to reclaim safe storage, not just calculate potential bytes. Implement approved quarantine (prefer recoverable, preserve metadata), validated deletion/purge with irreversible warning, durable journals, available real restore, per-item result and actual freed-space accounting.
- Support safe temporary locations and explicitly scoped user/browser caches; exclude in-use/protected/shared files; for Windows Update servicing use supported OS maintenance APIs rather than arbitrary WinSxS deletion.
- Integrate recycle-bin behavior where supported, report what was actually removed vs estimated. Cleanup schedule delegates to the actual approved Automation executor, not a fake calendar setting.
- Tests: disposable 2-3 folder fixture -> quarantine -> restore, separately approved irreversible purge test on fixture, stale plan, path traversal, locked file and failure injection. Never clean the owner's machine in unattended tests.""",
"09": """- Startup must let the user safely ENABLE/DISABLE/RESTORE supported autorun entries and adjust supported launch policies after per-change approval, not only stage plans. Typed distinct providers for Run keys, Startup folder, Task Scheduler and service start type as permitted; protect OS-critical targets.
- Preserve original values/registry view/ACL where possible in durable journal, dependency impact preview, conflict/changed-state detection, batch apply with partial results and working rollback.
- Reboot effects and estimated startup savings cannot be claimed measured without actual evidence; require Windows/UAC consent as appropriate.
- Tests: isolated registry/task/service mocks or VM fixtures for native executor, denial, partial batch and restore; don't edit live owner autoruns.""",
"10": """- System 36-domain tooling should present measured diagnostics, real refresh, process/service/network/hardware inspection, exports, signers and performance traces, not static charts. An observational diagnostic remains complete if data is genuinely useful, supported and explained.
- The few actionable gateways must LEAD TO actual scoped service capability (e.g. network reset via approved Repair) rather than an always-disabled preview. Process termination or network changes, if advertised, require explicit owner consent and OS protections.
- Hardware sensors/thermal/S.M.A.R.T. must honestly state missing OS vendor drivers or instrumentation; no synthetic temperatures or unsupported networking claims.
- Tests: genuine read-only provider contracts, report/export behavior, provider-offline and permissions, action handoff to Repair's fixture-backed consent gate.""",
"11": """- Repair Lab should move beyond pure preview with a safe, supported user-invoked Windows repair operator for appropriate DISM/SFC/dnsflush/network-repair primitives using fixed command enums/args, OS/UAC approval, progress capture, timeouts, reboot indicator and verified after-state.
- Never run these commands on owner's Windows during unattended build/test. Use mocked command runner and authorized disposable VM integration gates; real repair of user's OS requires specific confirmation.
- Restore-point inspection may be read-only, but actual restore creation/application requires supported Windows API and separate gate. Winsock/TCP resets can disrupt connectivity: show exact irreversible effects and recovery instructions. No generic arbitrary shell execution.
- History must record actual diagnostics and repair outcomes; blocked-by-policy is honest partial, not action-complete.""",
"12": """- Windows Services users should be able to actually start/stop/restart and modify start policy on allowed services after exact UAC and user approval, with dependency preflight, protected-core allow/deny rules, per-service native SCM result, postcondition and durable original config journal.
- Service inventory, search, dependency graph and shared-process diagnostics are valid functional observation if measured. The service controller/undo/config changes are NOT finished if they only create a preview receipt.
- Never manipulate core services or the owner's services in unattended agent tests. Use fake SCM with actual state changes and safe VM integration for elevated paths. Verify errors, permissions, dependent-service impact and rollback where possible.""",
"13": """- Flow Studio must include an actual persisted scheduler and executor for safe user-authorized workflows, not just save DAG drafts or fake dry-run history. Implement validated DAG, reliable trigger persistence, queued actual scoped steps, bounded execution, cancellation, crash recovery/idempotency, notifications and durable per-step receipts.
- Each enabled automation requires explicit scoped standing user consent and a pause/revoke UI; expiry/limits for effects. No silent cleanups, file mutations, elevated repair, app uninstall, cloud messages or paid API calls as default steps. Such steps need separate user approval/capability and policy checks at runtime.
- Templates, recurrence, quiet hours, battery policy, export/import and backup plan must have meaningful real effects when enabled; test scheduler on controlled clock, dry run vs ACTUAL disposable-fixture step, restart and idempotency. No reliance on permanent Qoder process.""",
"14": """- Settings must persist actual supported app preferences (locale/theme/privacy/indexing/capability controls) and prove their effect after restart. Use secure Windows credential storage for opt-in persistent tokens and explicit delete/revoke; no secrets in React localStorage or logs.
- AI Assistant must actually call a configured provider only after user supplies/approves credentials and expense/network consent, show response and cancel/errors/provider limits; fixture chat is not complete. Provide fully functional offline non-AI actions when no provider configured.
- Restore/backup settings should serialize and re-import validated app-owned data, prove restore on disposable profiles and clearly distinguish it from system restore or file backup. User must control network and background execution.
- Test real settings roundtrip after packaged restart, secure token boundaries and simulated provider requests; never access personal API keys without consent."""
}
# Only touch active mission specifications; do NOT modify app source or Qoder's current in-progress source work.
prefix="## REAL USER SERVICE ACTIVATION — POST-READ-ONLY PRODUCT ACCEPTANCE"
for n,domain in DOMAINS.items():
 candidates=list(M.glob(n+"_*_FULLSTACK_MISSION.md"))
 assert len(candidates)==1,(n,candidates)
 file=candidates[0]
 content=file.read_text(encoding="utf-8-sig")
 if prefix in content:continue
 addendum=("\n\n---\n\n"+prefix+"\n\n"
    "This addendum implements the user's requirement that KNOuX must deliver REAL consumer actions, not only passive reading and dry-runs. Read and obey missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md BEFORE assessing this section. Treat earlier read-only/preview success as a valid engineering checkpoint but NOT automatic final functionality acceptance.\n\n"
    "### Specific outcomes to implement and prove\n\n"+domain+"\n\n"
    "### Product acceptance\n\n"
    "Enumerate EVERY existing service ID in this mission. Assign appropriate A observational / B reversible / C destructive-privileged / D connected category. Include each service in the central capability matrix, with actual native/API implementation, UI action, scoped consent gate, controlled fixture effect test, after-state verification, journal/undo if feasible, and honest limitations. A passive service may be complete with live useful measurements; an action-promising service requires a real safe executor behind user approval. Do NOT perform effectful tests on real user resources, account, registry or Windows. Do not mark whole-section PRODUCTION COMPLETE until core actions are implemented/tested and supported integrations have their external/manual gates documented.\n\n"
    "Follow the existing SINGLE canonical repo/branch and real CI policy; no worktrees, extra project directories, fake results or Root CI. If currently working on another mission, preserve it and enter this section during the ordered activation pass, not by overwriting the agent's uncommitted changes.\n")
 file.write_text(content+addendum,encoding="utf-8")
 print("UPGRADED",file.name,len(addendum))
# Add a single prominent mandatory reference to governing policy files, but avoid touching history/ledger.
for relative in ("AGENTS.md","missions/STANDALONE_AUTONOMOUS_ENTRY.md"):
 f=ROOT/relative
 orig=f.read_text(encoding="utf-8-sig")
 marker="# REAL-SERVICE PRODUCT ACCEPTANCE — OVERRIDES READ-ONLY FINALITY"
 if marker not in orig:
  insert=(marker+"\n\nRead missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md. A read-only or dry-run milestone is NOT a final product-complete action service. Actual executor implementation and disposable-fixture side-effect tests are REQUIRED while any LIVE changes to the owner's files/OS/accounts require their explicit separate user approval. Keep all past validated work and preserve the current in-flight source changes. After 04/14/01 complete, run the documented per-service activation pass instead of declaring 100% finished. Track every service ID in docs/SERVICE_CAPABILITY_MATRIX.md.\n\n---\n\n")
  f.write_text(insert+orig,encoding="utf-8")
  print("POLICY_ADDED",relative)
# Recompute existing canonical manifest after updating mission specs (not historical task snapshots).
manifest=M/"MISSION_SHA256_MANIFEST.json"
data=[]
for f in sorted(M.iterdir()):
 if f.is_file() and f!=manifest:
  bb=f.read_bytes()
  data.append({"file":f.name,"bytes":len(bb),"sha256":hashlib.sha256(bb).hexdigest()})
manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("MANIFEST_REFRESHED",len(data))
