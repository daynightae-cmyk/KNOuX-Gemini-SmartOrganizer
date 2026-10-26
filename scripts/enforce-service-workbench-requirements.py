#!/usr/bin/env python3
"""Idempotent documentation-only KNOuX user-requested service UX activation amendment."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parent.parent
M=R/"missions"
assert R==Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer")
assert (M/"15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md").is_file()
D={
"01":"Home: 12 cards and insights deep-link into the real selected service workbench, with launch, scope, pending approvals, current jobs, receipt and recovery buttons; no static dashboard-only cards.",
"02":"Scan: 10 individual tools; scan/cancel, scope/exclusions, severity filters, duplicate keeper selector, large-file/junk action basket, evidence and handoff buttons.",
"03":"Studio: visual library, categories, thumbnails, flexible rules/destination, collision options, exact before/after preview, user-authorized apply, progress, journal and real undo.",
"04":"Google: 10 genuine domain workbenches (Gmail three-pane, Sheets grid, Calendar view, Tasks board etc.) plus supported OAuth/provider controls; fake connected UI forbidden.",
"05":"Applications: 12 functional inspectors, real app identity and signer details, multi-app selection, official uninstall/update basket, review/UAC/reboot/verification.",
"06":"Files: 12 specialist search/metadata/organize surfaces; selected-file side inspector and expanded list; batch rename/move/copy with safe review/verified undo.",
"07":"Storage: 12 specialized volume/treemap/duplicate panels; select keepers, explore heavy folders, build real approved reclaim basket, verify saved bytes.",
"08":"Cleanup: 12 targeted candidate ledgers, checked selections/exclusions, safe quarantine vs permanent purge, consent, verified freed space, journal/restore.",
"09":"Startup: 12 targeted autorun inspectors; enable/disable/delay/batch, critical-item guards, per-change review, effective-state verification and restore.",
"10":"System: 36 distinctive measured system/network/hardware instruments; charts, logs, diagnostic drilldown, approved repair handoffs; unsupported sensors explicit.",
"11":"Repair: 12 domain repair consoles, prerequisites, source diagnostics, exact operation choices, approved typed native repair, transcript, reboot limits and after-state.",
"12":"Services: 12 SCM-specific tools, register/dependencies, start-stop-restart/startup type where allowed, guarded confirmation, verified state and restore receipts.",
"13":"Automation: 12 tools with full interactive DAG canvas, node inspector, triggers/schedule, persistent enabled jobs, actual safe executor, pause/revoke and run receipts.",
"14":"Settings: 8 meaningful settings/provider panels, working preference toggles, secure key store, configured AI connection with consent, backup import/export and recovery."
}
MARK="## Mandatory interactive workbench & real controls — Mission 15A"
edited=[]
def add(f,text):
 b=f.read_bytes()
 if MARK.encode() in b:return False
 with f.open("ab") as h:h.write(("\n\n"+MARK+"\n\n"+text+"\n").encode("utf-8"))
 return True
for mid,domain in D.items():
 paths=list(M.glob(mid+"_*_FULLSTACK_MISSION.md"))
 assert len(paths)==1,(mid,paths)
 addition=(
 "When user opens ANY advertised service, show its unique control-rich tool workbench in a pinned resizable side panel OR an expanded full in-app workspace, with working dock/expand/collapse and persistent resource/filter/selection state. Use one accessible shared shell but domain-specific body and real native/API handlers; no generic repeated modal or cosmetic buttons.\n\n"
 +domain+"\n\n"
 "Every relevant control must select/inspect/filter/configure a real outcome, or expose clearly why unsupported. For a mutation, require per-item measured preview, exact per-action user consent, fixed validated executor, controlled-disposable-fixture effect test, after-state receipt and real restore if feasible. Do not run risky OS/file/cloud operations on owner's data during agent testing.\n\n"
 "Verify EN+AR RTL, dark+light, 1366/1672/1920, keyboard/focus, dock<->expanded continuity, no header/footer obstruction; update docs/SERVICE_WORKBENCH_ACCEPTANCE.md and the capability matrix for each original service ID. Mission reference: missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md. This UX gate is not alone proof the action service is product-complete."
 )
 if add(paths[0],addition):edited.append(paths[0].name)
# Preserve active Qoder source; append only to governing task docs.
DOCS=[
 ("15_REAL_SERVICE_ACTIVATION_MISSION.md",
  "BEFORE declaring any action-service completed, deliver Mission 15A interactive UI for its original service ID: persistent side/expanded workbench, relevant real buttons/options, functioning handlers and mode persistence. Use its service-specific checklist, then implement actual safe native execute/verify/undo and fixture effect tests. Every service ID must appear in docs/SERVICE_WORKBENCH_ACCEPTANCE.md as well as both existing capability/registry ledgers. Read-only-only implementation and identical generic modal do NOT close the product service."),
 ("REAL_SERVICE_FUNCTIONALITY_STANDARD.md",
  "Additional mandatory UI acceptance: Every service must open a domain-specific interactive workbench, pinned/resizable on one side or expanded/full-width within the app, with meaningful working buttons/selection/options based on its actual tool. One shared host, distinct domain modules. Read missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md. Both UI interaction proof and real effectful fixture/native proof (where appropriate) are required. User-directed real-world changes remain consent-gated."),
 ("STANDALONE_AUTONOMOUS_ENTRY.md",
  "NEXT PRODUCT GATE: Preserve current safe tasks 14 Settings/Assistant and 01 Home if not yet completed. BEFORE/AS PART OF 15 Real Service Activation, execute missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md, then fulfill all Mission 15 native action gaps. This is mandatory for ALL 181 advertised entries mapped to 150 registry/surface rows. Always implement dedicated side or expanded full tool screens and real relevant buttons; no preview-only 'done'."),
 ("README_MISSION_INDEX.md",
  "CURRENT PRIORITY OVERRIDE: missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md defines the mandatory per-service side/full interactive workspace requirement. It is the first UX gate of Mission 15, after safe pending missions. Historical original ordering below is superseded by missions/STANDALONE_AUTONOMOUS_ENTRY.md and latest MISSION_SEQUENCE_PROGRESS.md."),
 ("MISSION_SEQUENCE_PROGRESS.md",
  "NEW USER PRODUCT REQUIREMENT (not yet implementation complete): EVERY advertised service opens a specialized interactive tool workbench, either pinned resizable side dock or expanded within the same app; rich real functional buttons, user-selected scope/options, actual measured results, per-operation approval, verified execution where appropriate, and undo/recovery where feasible. Full specification: missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md. Scope is 181 mission entries reconciled to 150 existing registry/surfaces (overlapping classifications, no automatic 181 engines). Current actual action completion counts remain unchanged; do not mark any as done by this docs amendment. First finish current safe 14/01 work if pending, then execute 15A as the UX gate of mission 15 and activate real native action providers. Keep one canonical repo and active feature branch.")
]
for name,desc in DOCS:
 if add(M/name,desc):edited.append(name)
root_agents=R/"AGENTS.md"
if add(root_agents,"Read missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md and enforce it across all 14 domains as the UX prerequisite of Real Service Mission 15. Every service opens a pinned side or expanded full workbench with real tool-specific controls, not inert panels. Never conflate acceptance of old read-only milestones with product functionality. Honor the sole canonical workspace and consent/safety boundaries."):edited.append("AGENTS.md")
# Regenerate canonical existing manifest, preserving file format and exact bytes for each task.
manifest=M/"MISSION_SHA256_MANIFEST.json"
records=[]
for f in sorted(M.iterdir()):
 if f.is_file() and f!=manifest:
  b=f.read_bytes()
  records.append(dict(file=f.name,bytes=len(b),sha256=hashlib.sha256(b).hexdigest()))
manifest.write_text(json.dumps(records,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"amended_files":edited,"amended_count":len(edited),"all_domain_missions":len(D),
"new_task":"15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md","mission_sha256_rows":len(records)},ensure_ascii=False,indent=2))
