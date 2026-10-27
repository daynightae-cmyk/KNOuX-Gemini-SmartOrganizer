# -*- coding: utf-8 -*-
"""Non-mutating source + conflict ledger. Not a substitute for actual manual merge."""
from pathlib import Path
import json,subprocess,re,datetime,hashlib
R=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\.worktrees\unified-20261028")
B=Path(r"D:\KNOUX-Workspace\KNOuX_LOCAL_INTEGRATION_BACKUP_20261028")
O=R/"missions"/"UNIFIED_FULL_DOMAIN_EXECUTION_20261028"
BASE="codex/live-organization-20261027"
SPRINT="feat/knoux-visual-day-night-sprint-20261027"
def git(*arg,allow_failure=False):
 p=subprocess.run(["git","-C",str(R),*arg],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 if p.returncode and not allow_failure:raise RuntimeError(str(arg)+" "+p.stderr.decode("utf-8","replace"))
 return p.stdout.decode("utf-8","replace"),p.returncode
raw,_=git("for-each-ref","--format=%(refname:short)|%(objectname)", "refs/heads")
branches=[]
for row in raw.splitlines():
 if "|" not in row:continue
 br,sha=row.split("|",1)
 _,exit=git("merge-base","--is-ancestor",br,BASE,allow_failure=True)
 aheadbehind,_=git("rev-list","--left-right","--count",BASE+"..."+br)
 branches.append({"branch":br,"sha":sha,"already_in_functional_baseline":exit==0,"divergent_counts":aheadbehind.strip()})
output,exit=git("merge-tree","--write-tree","HEAD",SPRINT,allow_failure=True)
conflicts=[]
for ln in output.splitlines():
 vals=ln.split("\t")
 if len(vals)==2 and re.match(r"^[0-7]{6} [a-f0-9]{40} [123]$",vals[0]):
  if vals[1] not in conflicts:conflicts.append(vals[1])
snapshot=json.loads((B/"snapshot-summary.json").read_text(encoding="utf8"))
current=[]
for wt in snapshot["worktrees"]:
 label=wt["label"]
 w=Path(wt["root"]) if "root" in wt else None
 current.append(wt)
ledger={"generatedAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),
"current_unified_head":git("rev-parse","HEAD")[0].strip(),
"candidate_committed_base":BASE,"sprint_branch":SPRINT,
"merge_tree_exit":exit,"merge_tree_conflict_count":len(conflicts),
"branch_inventory":branches,"merge_conflicted_paths":conflicts,
"wip_snapshot_root":str(B),"snapshot_total_files":sum(e["files"] for e in snapshot["worktrees"]),
"snapshot_total_copied":sum(e["copied"] for e in snapshot["worktrees"]),
"snapshot_errors":snapshot["copyErrors"],"snapshot_sources":snapshot["worktrees"],
"full_reconciliation_status":"INCOMPLETE_PENDING_MANUAL_RECONCILIATION_AND_ACTIVE_WIP",
"no_git_merge_was_applied":True}
p=O/"schemas"/"M0_BRANCH_WIP_CONFLICT_MANIFEST.json"
p.write_text(json.dumps(ledger,indent=2,ensure_ascii=False),encoding="utf8")
txt=["# M0 — LIVE CONFLICT & WIP RECONCILIATION REGISTER","",
"Candidate unified SHA: "+ledger["current_unified_head"],"",
"All local branch histories except divergent visual-sprint are contained in the functional base. This is a clean-source ancestry fact, not WIP integration.",
"",
"## Saved source snapshot (copy only, nothing deleted)","Snapshot: "+str(B),
"Saved worktrees: "+str(len(snapshot["worktrees"])),
"Saved changed paths: "+str(ledger["snapshot_total_files"]),
"Byte-for-byte file copies: "+str(ledger["snapshot_total_copied"]),
"Snapshot copy errors: "+str(len(snapshot["copyErrors"])),"",
"## Every local branch and ancestry"]
for item in branches:
 txt.append("- "+item["branch"]+" "+item["sha"][:12]+" | already-ancestor="+str(item["already_in_functional_baseline"])+" | ahead/behind="+item["divergent_counts"])
txt+=["","## Divergent visual-sprint conflicts ("+str(len(conflicts))+")",
"Every path below requires manual 3-way resolution, including code behavior and historical evidence. No blanket ours/theirs. Name uniqueness if evidence names overlap.",""]
for name in conflicts:txt.append("- [ ] "+name)
txt+=["","## Outstanding WIP review"]
for s in snapshot["worktrees"]:
 txt.append("- "+s["label"]+": "+str(s["files"])+" paths in snapshot, "+str(s["copied"])+" copied. RECONCILE_BY_SHA_WITH_LATEST_HEAD. Do not apply entire older tree.")
txt+=["","## Gate to declare FULLY MERGED","- [ ] Every source branch and post-snapshot new branch addressed","- [ ] Divergent visual-sprint unique functionality and evidence safely reconciled; integrated commit(s) pass tests","- [ ] Root tracked native deltas and unique test examined against newer OperationsV1","- [ ] Active Storage/Cleanup WIP owner finished/committed, its unique changes integrated without overwriting","- [ ] All 181 original service mission specs and 14 domain missions versioned","- [ ] No missing code-relevant WIP; file-by-file disposition manifest finalized","- [ ] Security Native/Electron, TypeScript, build, DAY/NIGHT/RTL regressions pass after merge","- [ ] Unified final SHA committed; NO push/main/release","",
"STATUS: PARTIAL AND SAFELY PRESERVED. No fake COMPLETE assertion."]
(O/"M0_ACTUAL_CONFLICT_INVENTORY.md").write_text("\n".join(txt)+"\n",encoding="utf8")
print("BRANCHES="+str(len(branches))+" SPRINT_CONFLICT_PATHS="+str(len(conflicts))+" SNAPSHOT_FILES="+str(ledger["snapshot_total_files"]))
print("MERGE_TREE_EXIT="+str(exit))
