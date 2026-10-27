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
def git(*args):
 p=subprocess.run(["git","-C",str(ROOT),*args],capture_output=True,text=True,encoding="utf-8",errors="replace")
 if p.returncode:raise RuntimeError("git "+str(args)+": "+p.stderr)
 return p.stdout.strip()
try:
 is_canonical=(ROOT.resolve()==EXPECTED.resolve())
 is_visual=(ROOT.resolve()==VISUAL_WORKTREE.resolve())
 assert is_canonical or is_visual,"WRONG WORKSPACE: "+str(ROOT)
 assert Path(git("rev-parse","--show-toplevel")).resolve()==ROOT.resolve(),"WRONG GIT TOP LEVEL"
 assert Path(git("rev-parse","--path-format=absolute","--git-common-dir")).resolve()==(EXPECTED/".git").resolve(),"WRONG GIT COMMON DIR"
 assert git("remote","get-url","origin").rstrip("/")==REMOTE,"WRONG REMOTE"
 expected_branch=BRANCH if is_canonical else VISUAL_BRANCH
 assert git("branch","--show-current")==expected_branch,"WRONG BRANCH"
 assert (ROOT/"missions"/"STANDALONE_AUTONOMOUS_ENTRY.md").is_file(),"MISSING MISSION ENTRY"
 assert (ROOT/"apps"/"gemini-ui"/"electron"/"main.cjs").is_file(),"MISSING GEMINI MAIN"
 assert (ROOT/"electron"/"studio").is_dir(),"MISSING NATIVE ENGINES"
 assert not (ROOT/"electron"/"main.cjs").exists(),"LEGACY ROOT APPLICATION IN NEW REPO"
 print(json.dumps({"workspace":str(ROOT),"origin":REMOTE,"branch":expected_branch,"sha":git("rev-parse","HEAD"),"status":"PASS"},ensure_ascii=False,indent=2))
except Exception as ex:
 print(f"KNOuX_CANONICAL_WORKSPACE_BLOCKED: {ex}",file=sys.stderr);sys.exit(1)
