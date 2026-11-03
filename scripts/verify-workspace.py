#!/usr/bin/env python3
"""Block accidental work in the old KNOuX Git checkout."""
from pathlib import Path
import subprocess,json,sys
ROOT=Path(__file__).resolve().parent.parent
EXPECTED=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer")
REMOTE="https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer.git"
BRANCH="main"
# Owner override 2026-11-01: preserve WIP on this exact local review branch;
# no main integration or publication until the owner's later review.
SERVICE_REVIEW_BRANCH="codex/service-workspaces-20261101"
# Explicit, fail-closed design-only exception: real Git worktree of the same D: repo.
VISUAL_WORKTREE=(EXPECTED/".worktrees"/"visual-owner-rebuild")
VISUAL_BRANCH="feat/knoux-visual-studio-rebuild-20261027"
# Owner authorized the isolated functional execution checkout on 2026-10-27.
LIVE_WORKTREE=(EXPECTED/".worktrees"/"live-organization")
LIVE_BRANCH="codex/live-organization-20261027"
# Owner-authorized permanent local integration staging checkout; exact path and branch only.
UNIFIED_WORKTREE=(EXPECTED/".worktrees"/"unified-20261028")
UNIFIED_BRANCH="integration/knoux-unified-20261028"
# Exact reusable isolation authorized by the owner's Anima/v0 integration mission.
ANIMA_WORKTREE=(EXPECTED/".worktrees"/"anima-v0-integration")
ANIMA_BRANCH="codex/anima-v0-integration-20261030"
# Owner-authorized isolated full-product (14 domains / 181 services) execution checkout.
# Created by the owner-authorized assistant at 2026-11-03 04:35 +04:00 with `git worktree add -b`
# from committed local main. Exact path, exact branch and exact base ancestry only.
# It must never be main, never merged and never pushed by this mission.
ALLSERVICES_WORKTREE=Path(r"C:\KNOUX-Codex-AllServices-20261103")
ALLSERVICES_BRANCH="codex/knoux-all-services-20261103"
ALLSERVICES_BASE="0c853c9a66fb6e39317c0c13dc22d89aec62f995"
def git(*args):
 p=subprocess.run(["git","-C",str(ROOT),*args],capture_output=True,text=True,encoding="utf-8",errors="replace")
 if p.returncode:raise RuntimeError("git "+str(args)+": "+p.stderr)
 return p.stdout.strip()
try:
 is_canonical=(ROOT.resolve()==EXPECTED.resolve())
 is_visual=(ROOT.resolve()==VISUAL_WORKTREE.resolve())
 is_live=(ROOT.resolve()==LIVE_WORKTREE.resolve())
 is_unified=(ROOT.resolve()==UNIFIED_WORKTREE.resolve())
 is_anima=(ROOT.resolve()==ANIMA_WORKTREE.resolve())
 is_allservices=(ROOT.resolve()==ALLSERVICES_WORKTREE.resolve())
 assert is_canonical or is_visual or is_live or is_unified or is_anima or is_allservices,"WRONG WORKSPACE: "+str(ROOT)
 assert Path(git("rev-parse","--show-toplevel")).resolve()==ROOT.resolve(),"WRONG GIT TOP LEVEL"
 assert Path(git("rev-parse","--path-format=absolute","--git-common-dir")).resolve()==(EXPECTED/".git").resolve(),"WRONG GIT COMMON DIR"
 assert git("remote","get-url","origin").rstrip("/")==REMOTE,"WRONG REMOTE"
 actual_branch=git("branch","--show-current")
 if is_canonical:
  assert actual_branch in (BRANCH,SERVICE_REVIEW_BRANCH),"WRONG CANONICAL BRANCH"
 expected_branch=ANIMA_BRANCH if is_anima else UNIFIED_BRANCH if is_unified else actual_branch if is_canonical else LIVE_BRANCH if is_live else ALLSERVICES_BRANCH if is_allservices else VISUAL_BRANCH
 assert git("branch","--show-current")==expected_branch,"WRONG BRANCH"
 if is_allservices:
  # The isolated mission branch may never become, or be rewound onto, protected main.
  assert actual_branch!=BRANCH,"ISOLATED CHECKOUT MUST NOT BE ON MAIN"
  ancestor=subprocess.run(["git","-C",str(ROOT),"merge-base","--is-ancestor",ALLSERVICES_BASE,"HEAD"],
   capture_output=True,text=True,encoding="utf-8",errors="replace")
  assert ancestor.returncode==0,"AUTHORIZED BASE COMMIT "+ALLSERVICES_BASE+" IS NOT ANCESTOR OF HEAD"
 assert (ROOT/"missions"/"STANDALONE_AUTONOMOUS_ENTRY.md").is_file(),"MISSING MISSION ENTRY"
 assert (ROOT/"apps"/"gemini-ui"/"electron"/"main.cjs").is_file(),"MISSING GEMINI MAIN"
 assert (ROOT/"electron"/"studio").is_dir(),"MISSING NATIVE ENGINES"
 assert not (ROOT/"electron"/"main.cjs").exists(),"LEGACY ROOT APPLICATION IN NEW REPO"
 print(json.dumps({"workspace":str(ROOT),"origin":REMOTE,"branch":expected_branch,"sha":git("rev-parse","HEAD"),"status":"PASS"},ensure_ascii=False,indent=2))
except Exception as ex:
 print(f"KNOuX_CANONICAL_WORKSPACE_BLOCKED: {ex}",file=sys.stderr);sys.exit(1)
