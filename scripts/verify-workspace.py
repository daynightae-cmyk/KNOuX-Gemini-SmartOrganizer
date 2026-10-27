#!/usr/bin/env python3
"""Block accidental work in the old KNOuX Git checkout."""
from pathlib import Path
import subprocess,json,sys
ROOT=Path(__file__).resolve().parent.parent
EXPECTED=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer")
REMOTE="https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer.git"
BRANCH="feat/gemini-missions"
# Explicit, fail-closed design-only exception: real Git worktree of the same D: repo.
VISUAL_WORKTREE=(EXPECTED/".worktrees"/"visual-owner-rebuild")
VISUAL_BRANCH="feat/knoux-visual-studio-rebuild-20261027"
# Owner authorized the isolated functional execution checkout on 2026-10-27.
LIVE_WORKTREE=(EXPECTED/".worktrees"/"live-organization")
LIVE_BRANCH="codex/live-organization-20261027"
# Owner-authorized permanent local integration staging checkout; exact path and branch only.
UNIFIED_WORKTREE=(EXPECTED/".worktrees"/"unified-20261028")
UNIFIED_BRANCH="integration/knoux-unified-20261028"
def git(*args):
 p=subprocess.run(["git","-C",str(ROOT),*args],capture_output=True,text=True,encoding="utf-8",errors="replace")
 if p.returncode:raise RuntimeError("git "+str(args)+": "+p.stderr)
 return p.stdout.strip()
try:
 is_canonical=(ROOT.resolve()==EXPECTED.resolve())
 is_visual=(ROOT.resolve()==VISUAL_WORKTREE.resolve())
 is_live=(ROOT.resolve()==LIVE_WORKTREE.resolve())
 is_unified=(ROOT.resolve()==UNIFIED_WORKTREE.resolve())
 assert is_canonical or is_visual or is_live or is_unified,"WRONG WORKSPACE: "+str(ROOT)
 assert Path(git("rev-parse","--show-toplevel")).resolve()==ROOT.resolve(),"WRONG GIT TOP LEVEL"
 assert Path(git("rev-parse","--path-format=absolute","--git-common-dir")).resolve()==(EXPECTED/".git").resolve(),"WRONG GIT COMMON DIR"
 assert git("remote","get-url","origin").rstrip("/")==REMOTE,"WRONG REMOTE"
 expected_branch=UNIFIED_BRANCH if is_unified else BRANCH if is_canonical else LIVE_BRANCH if is_live else VISUAL_BRANCH
 assert git("branch","--show-current")==expected_branch,"WRONG BRANCH"
 assert (ROOT/"missions"/"STANDALONE_AUTONOMOUS_ENTRY.md").is_file(),"MISSING MISSION ENTRY"
 assert (ROOT/"apps"/"gemini-ui"/"electron"/"main.cjs").is_file(),"MISSING GEMINI MAIN"
 assert (ROOT/"electron"/"studio").is_dir(),"MISSING NATIVE ENGINES"
 assert not (ROOT/"electron"/"main.cjs").exists(),"LEGACY ROOT APPLICATION IN NEW REPO"
 print(json.dumps({"workspace":str(ROOT),"origin":REMOTE,"branch":expected_branch,"sha":git("rev-parse","HEAD"),"status":"PASS"},ensure_ascii=False,indent=2))
except Exception as ex:
 print(f"KNOuX_CANONICAL_WORKSPACE_BLOCKED: {ex}",file=sys.stderr);sys.exit(1)
