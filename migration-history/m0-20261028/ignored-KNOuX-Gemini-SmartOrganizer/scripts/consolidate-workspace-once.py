#!/usr/bin/env python3
"""Consolidate the ONLY active KNOuX missions directory with checksum audit."""
from pathlib import Path
import subprocess,json,hashlib
repo=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer")
old=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-FullStack-Missions-20261025")
canonical=repo/"missions"
archive=repo/"migration-history"/"original-mission-library-20261025"
assert repo.is_dir() and (repo/".git").is_dir()
assert canonical.is_dir() and (canonical/"STANDALONE_AUTONOMOUS_ENTRY.md").is_file()
def git(*args):
 return subprocess.check_output(["git","-C",str(repo),*args],text=True,encoding="utf-8",errors="replace").strip()
assert git("remote","get-url","origin")=="https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer.git"
assert git("branch","--show-current")=="feat/gemini-missions"
def sha(f):
 h=hashlib.sha256()
 with f.open("rb") as src:
  for block in iter(lambda:src.read(2**20),b""):h.update(block)
 return h.hexdigest()
def scan(root):
 return {p.relative_to(root).as_posix():sha(p) for p in root.rglob("*") if p.is_file()}
changes=[
 (r"D:\KNOUX-Workspace\KNOuX-Gemini-UI",str(repo)),
 ("D:/KNOUX-Workspace/KNOuX-Gemini-UI",repo.as_posix()),
 (r"D:\KNOUX-Workspace\KNOuX-Gemini-FullStack-Missions-20261025",str(canonical)),
 ("D:/KNOUX-Workspace/KNOuX-Gemini-FullStack-Missions-20261025",canonical.as_posix()),
 ("daynightae-cmyk/Knoux-SmartOrganizer","daynightae-cmyk/KNOuX-Gemini-SmartOrganizer"),
 ("feat/gemini-ui-foundation-20261025","feat/gemini-missions"),
]
mod=[]
for f in canonical.iterdir():
 if not f.is_file() or f.suffix.lower() not in {".md",".txt",".csv"}:continue
 if f.name in {"STANDALONE_AUTONOMOUS_ENTRY.md","MISSION_SEQUENCE_PROGRESS.md"}:continue
 data=f.read_text(encoding="utf-8-sig",errors="replace")
 updated=data
 for a,b in changes:updated=updated.replace(a,b)
 if updated!=data:f.write_text(updated,encoding="utf-8");mod.append(f.name)
entry=canonical/"STANDALONE_AUTONOMOUS_ENTRY.md"
text=entry.read_text(encoding="utf-8-sig")
header="""# CANONICAL WORKSPACE POLICY — ABSOLUTE PRIORITY
ONE ACTIVE PROJECT DIRECTORY: D:\\KNOUX-Workspace\\KNOuX-Gemini-SmartOrganizer
ONE ACTIVE GITHUB REMOTE: https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer
ONE ACTIVE MISSION FOLDER: D:\\KNOUX-Workspace\\KNOuX-Gemini-SmartOrganizer\\missions
Before any write, execute python scripts/verify-workspace.py from the canonical repository root. If it does not PASS, STOP.
DO NOT work from D:\\KNOUX-Workspace\\KNOuX-Gemini-UI, old Root GitHub, K: worktrees, temporary extracts or new clones.
Old paths in historical progress/evidence are for provenance only. All new source, tasks, screenshots, tests, packages, commits and pushes belong to this canonical Git repo.
Completed: 00V, 00P, 03 Studio, 06 Files, 07 Storage. NEXT: 02 Smart Scan.
No worktrees, extra repos, Root CI or old Electron launcher. No destructive real-user operations without separate approval.

---

"""
if not text.startswith("# CANONICAL WORKSPACE POLICY"):
 entry.write_text(header+text,encoding="utf-8");mod.append(entry.name)
if old.exists() and old.resolve()==canonical.resolve():
 assert archive.exists(),"Archived original mission tree missing"
 orig=scan(archive)
else:
 assert old.is_dir(),"Original mission library missing"
 assert not archive.exists(),"Archive already exists; refusing collision"
 orig=scan(old)
 archive.parent.mkdir(exist_ok=True)
 old.rename(archive)
 assert scan(archive)==orig,"Mission archive bytes failed integrity audit"
 result=subprocess.run(["cmd","/c","mklink","/J",str(old),str(canonical)],capture_output=True,text=True,encoding="utf-8",errors="replace")
 if result.returncode:raise RuntimeError("Archive SAFE but failed to make old path junction: "+result.stdout+result.stderr)
assert old.resolve()==canonical.resolve(),"Old mission path not redirected"
archive_readme=repo/"migration-history"/"ARCHIVED_OLD_MISSIONS_README.md"
archive_readme.write_text("Original mission folder was preserved byte-for-byte inside migration-history/original-mission-library-20261025. Its former external D: path is a junction to the canonical active missions/ directory. These historical snapshots MUST NEVER be executed. Use STANDALONE_AUTONOMOUS_ENTRY.md and scripts/verify-workspace.py only.\n",encoding="utf-8")
manifest=canonical/"MISSION_SHA256_MANIFEST.json"
entries=[]
for f in sorted(canonical.iterdir()):
 if f.is_file() and f!=manifest:
  data=f.read_bytes()
  entries.append({"file":f.name,"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()})
manifest.write_text(json.dumps(entries,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
receipt={"canonical_repo":str(repo),"canonical_missions":str(canonical),"legacy_tasks_junction":str(old),"original_mission_archive":str(archive),
"original_archive_files":len(orig),"rewritten_active_docs":mod,"manifest_count":len(entries),"junction_verified":True,"application_source_modified":False}
(repo/"migration-history"/"canonical-consolidation-receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(receipt,ensure_ascii=False,indent=2))
