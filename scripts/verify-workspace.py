#!/usr/bin/env python3
"""Block accidental work in the old KNOuX Git checkout."""
from pathlib import Path
import subprocess,json,sys
ROOT=Path(__file__).resolve().parent.parent
EXPECTED=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer")
REMOTE="https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer.git"
BRANCH="feat/gemini-missions"
def git(*args):
 p=subprocess.run(["git","-C",str(ROOT),*args],capture_output=True,text=True,encoding="utf-8",errors="replace")
 if p.returncode:raise RuntimeError("git "+str(args)+": "+p.stderr)
 return p.stdout.strip()
try:
 assert ROOT.resolve()==EXPECTED.resolve(),"WRONG WORKSPACE: "+str(ROOT)
 assert Path(git("rev-parse","--show-toplevel")).resolve()==EXPECTED.resolve(),"WRONG GIT TOP LEVEL"
 assert git("remote","get-url","origin").rstrip("/")==REMOTE,"WRONG REMOTE"
 assert git("branch","--show-current")==BRANCH,"WRONG BRANCH"
 assert (ROOT/"missions"/"STANDALONE_AUTONOMOUS_ENTRY.md").is_file(),"MISSING MISSION ENTRY"
 assert (ROOT/"apps"/"gemini-ui"/"electron"/"main.cjs").is_file(),"MISSING GEMINI MAIN"
 assert (ROOT/"electron"/"studio").is_dir(),"MISSING NATIVE ENGINES"
 assert not (ROOT/"electron"/"main.cjs").exists(),"LEGACY ROOT APPLICATION IN NEW REPO"
 print(json.dumps({"workspace":str(ROOT),"origin":REMOTE,"branch":BRANCH,"sha":git("rev-parse","HEAD"),"status":"PASS"},ensure_ascii=False,indent=2))
except Exception as ex:
 print(f"KNOuX_CANONICAL_WORKSPACE_BLOCKED: {ex}",file=sys.stderr);sys.exit(1)
