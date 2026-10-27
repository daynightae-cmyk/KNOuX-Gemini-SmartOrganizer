# coding: utf-8
"""Owner's superseding MAIN first contract: docs plus exact canonical guard."""
from pathlib import Path
R=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\.worktrees\unified-20261028")
M=R/"missions"/"UNIFIED_FULL_DOMAIN_EXECUTION_20261028"
assert M.is_dir()
policy=r"""# KNOuX MAIN FIRST — FULL LOCAL CONSOLIDATION BEFORE ANY DOMAIN

OWNER OVERRIDE (2026-10-28): The temporary integration/knoux-unified-20261028 branch must NOT become a permanent destination. Owner requires all unique local work, branches, code, documents, reference art, missions, tests and meaningful evidence to be safely reconciled into local MAIN first, then to continue coding directly on local MAIN in the canonical Windows repo. Remote origin/main should be synchronized through normal non-force protected GitHub workflow once ready.

TARGET ROOT: D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer
TARGET LOCAL BRANCH: main
TARGET REMOTE: origin/main (normal push or required protected review)
STAGING ONLY: D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\.worktrees\unified-20261028
EXTERNAL RECOVERY: D:\KNOUX-Workspace\KNOuX_LOCAL_INTEGRATION_BACKUP_20261028

## M0 NON-NEGOTIABLE PROCEDURE
1. Stop concurrent writers by coordination (do not terminate their work blindly). Enumerate ALL branches and worktrees; latest main/origin/main; git status tracked AND untracked; remote and guard. Fetch origin, check upstream/remote divergence and protected branch rules.
2. Every unique WIP file including native hooks, service providers, 181 missions, tests, untracked evidence/assets, and active Storage/Cleanup edits must be backed up byte-exact with SHA-256 outside repo. Prior snapshot of 945 changed status paths / 938 copied regular files had zero copy errors, but may be STALE after ongoing edits; refresh and verify before main cutover. No git clean, reset --hard, stash without explicit disposition, force-push or blind git add -A.
3. Already-ancestor branches are not new merges; keep ancestry proof. The three unique commits of feat/knoux-visual-day-night-sprint-20261027 have roughly 70 overlapping conflict paths with the newer accepted visual work. Manually reconcile unique orbit interactions, keyboard accessibility, repair behavior, CSS and evidence with latest versions, test it; do not blindly choose ours/theirs or fake-merge.
4. Root working checkout currently is on integration/final-acceptance-20261027 with many dirty paths. DO NOT switch that checkout to main while WIP could be overwritten. Reconcile and preserve all modifications first, including seven tracked native source changes, hundreds of screenshots and untracked scripts and missions.
5. Current functional Storage/Cleanup committed 58fdc1f was safely merged to staging in 37a8574. Its author is still changing extra tracked files; preserve and incorporate further changes only after they are checkpointed safely or writer agrees on freeze, NOT by copying older sources over newer versions.
6. Reconcile ALL 181 original service specifications + 14 complete domain missions and per-service acceptance status. Record every WIP path and branch unique commit with disposition INTEGRATED, ALREADY_ANCESTOR, VERIFIED_DUPLICATE, CONFLICT_RECONCILED, or BLOCKED_ACTIVE_WRITER and exact destination SHA or reason.
7. Run fail-closed guard, TypeScript, lint, build, native/IPC contracts, file move+undo, Storage+Cleanup vault fixture/negative tests, actual isolated Electron Main+Preload+Renderer, DAY/NIGHT/EN/AR/RTL, geometry and consent tests, with evidence. DO NOT mark passes for tests not run.
8. Merge the fully reconciled verified staging history into local main using ordinary Git merge. DO NOT rewrite main ref, reset main to feature HEAD, or force-push. Fetch first; reconcile any remote main commits. Ancestry must prove original and fetched origin/main history preserved.
9. Switch the CANONICAL ROOT worktree to main only when clean and safe; update guard so exact canonical branch main passes only with correct root/common-dir/origin. Run code+native regression on main AFTER local merge.
10. Then synchronize origin/main with a normal git push origin main if user permission/branch rules permit; if protected branch requires PR/review/checks, follow those rules, do not disable protections, and report remote as BLOCKED until merge. No assertion that local and remote are synced unless actual evidence.
11. M0 is DONE only after every unique source and asset preserved/accounted for, no conflicts, local main complete and verified, root actually checked out on main, and remote update completed or precisely reported as blocked. A staging documentation commit is NOT M0 completion.

## AFTER M0 — SINGLE MAIN BRANCH WORKFLOW
ONE FULL DOMAIN at a time, all its service IDs, unique premium DAY/NIGHT UX, true event-driven preview, every meaningful action, secure typed Native/IPC/API, permissions and exact before/after receipts, tested Undo when actually reversible, cancellation/errors/partial states, real Windows Electron and fixture evidence, Arabic/English RTL/reduced motion, responsive 1366/1672/1920/125–150% scaling, rigorous no-regression. Never force Class A read-only system observation into unsafe OS write; instead implement real measure/query/filter/export or meaningful handoff. No false progress/results.

Commit completed fully tested section DIRECTLY ON canonical local main; normal sync to origin/main; THEN proceed to next full section. Temporary branches only for necessary isolation AND MUST LAND TO MAIN WITH FULL TESTS before next domain, no parked branch cemetery. If owner consent/API privilege is unavailable, explain the exact blocked service, keep status truthful and implement independent work.

## CURRENT FACTS
At last verification: local main and local origin/main 9e8cab5. Unified staging after committed Storage/Cleanup merge: 37a8574. Visual sprint three unique commits and ~70 conflicts NOT YET RECONCILED. Dirty root and ongoing live-organizer WIP NOT YET FULLY RECONCILED. No main cutover or remote push has occurred. Completion remains BLOCKED until exact reconciliation and tests.
"""
(M/"08_MAIN_FIRST_MANDATE.md").write_text(policy,encoding="utf8")
handoff=r"""# EXACT HANDOFF — SOL MAIN FIRST
The owner has changed final target: ALL locally unique work MUST be merged into main before another domain starts. Then work DIRECTLY on canonical local main and sync origin/main normally after each complete domain. Unified staging is temporary only.

Read first:
missions/UNIFIED_FULL_DOMAIN_EXECUTION_20261028/08_MAIN_FIRST_MANDATE.md
missions/UNIFIED_FULL_DOMAIN_EXECUTION_20261028/01_LOCAL_MERGE_GATE.md
missions/UNIFIED_FULL_DOMAIN_EXECUTION_20261028/04_OWNER_RULES_PERMANENT.md

Worktree inventory, stale backup refresh, divergent Visual Sprint manual reconciliation, ongoing Storage/Cleanup WIP and root 94+ tracked/383+ untracked (snapshot counts) are required. Staging at 37a8574 already includes committed Wave2 58fdc1f. Do not overwrite active writers. This is an implementation/merge task, NOT another task-writing session. Integrate distinct features, run native/IPC/fixture/Electron/visual tests, then safely land ordinary merge to local main, switch canonical root to main and verify guard. Synchronize remote origin/main with non-force protected workflow.

No next domain until M0 is certified; afterwards one ENTIRE section, 100% service IDs, real UX+live preview+Native+tests and direct main commit/sync, then next. No fake success, no destructive owner files/OS/cloud actions without runtime consent. Final report must include every source disposition, local main SHA, actual origin/main SHA or blocked status, and tests.
"""
(M/"09_COPY_TO_AGENT_MAIN_FIRST.md").write_text(handoff,encoding="utf8")
banner="OWNER OVERRIDE 2026-10-28: MAIN-FIRST final cutover. Any older language treating integration branch as permanent target is superseded by 08_MAIN_FIRST_MANDATE.md. M0 requires full WIP reconciliation, verified local main promotion + canonical checkout main and normal origin/main sync before new domain. After each entire domain commit directly on main and synchronize normally.\n\n"
files=["00_START_HERE.md","01_LOCAL_MERGE_GATE.md","02_ATOMIC_DOMAIN_CONTRACT.md","04_OWNER_RULES_PERMANENT.md","05_AGENT_EXECUTION_HANDOFF.md","06_DOMAIN_EXECUTION_ORDER.md","07_CURRENT_MERGE_PROGRESS.md"]
for rel in files:
 p=M/rel
 s=p.read_text(encoding="utf8")
 if "MAIN-FIRST final cutover" not in s:p.write_text(banner+s,encoding="utf8")
for p in (M/"DOMAINS").glob("*.md"):
 s=p.read_text(encoding="utf8")
 s=s.replace("local integration branch","local main branch").replace("local unified branch","local main branch")
 if "MAIN-FIRST final cutover" not in s:p.write_text(banner+s,encoding="utf8")
agents=R/"AGENTS.md"
old=agents.read_text(encoding="utf8")
owner_note="""# OWNER OVERRIDE 2026-10-28: FINAL BRANCH IS MAIN
The owner requires all unique local work to be reconciled into main FIRST and future full domain work DIRECTLY in canonical local main, with normal protected origin/main synchronization. Integration/knoux-unified-20261028 is temporary merge staging only. Read missions/UNIFIED_FULL_DOMAIN_EXECUTION_20261028/08_MAIN_FIRST_MANDATE.md before changes. No next domain until M0 fully reconciled/tested/main cutover. Do not overwrite any WIP, blanket-resolve conflicts or force-push.

"""
if not old.startswith("# OWNER OVERRIDE 2026-10-28"):agents.write_text(owner_note+old,encoding="utf8")
guard=R/"scripts"/"verify-workspace.py"
s=guard.read_text(encoding="utf8")
if 'BRANCH="feat/gemini-missions"' not in s:raise RuntimeError("Exact guard pattern changed")
s=s.replace('BRANCH="feat/gemini-missions"','BRANCH="main"')
guard.write_text(s,encoding="utf8")
print("POLICY_READY="+str(M/"08_MAIN_FIRST_MANDATE.md"))
print("HANDOFF_READY="+str(M/"09_COPY_TO_AGENT_MAIN_FIRST.md"))
print("UPDATED_DOMAIN_FILES="+str(len(list((M/"DOMAINS").glob("*.md")))))
