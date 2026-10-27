from pathlib import Path
import shutil,hashlib,json,os
root=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer")
old=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-FullStack-Missions-20261025")
archive=root/"migration-history"/"original-mission-library-20261025"
canonical=root/"missions"
assert old.is_dir() and canonical.is_dir() and (canonical/"STANDALONE_AUTONOMOUS_ENTRY.md").exists()
def sha(f):
 h=hashlib.sha256()
 with f.open("rb") as fs:
  for b in iter(lambda:fs.read(2**20),b""):h.update(b)
 return h.hexdigest()
before={p.relative_to(old).as_posix():sha(p) for p in old.rglob("*") if p.is_file()}
if archive.exists():
 for rel,v in before.items():
  target=archive/rel
  if not target.exists():
   target.parent.mkdir(parents=True,exist_ok=True)
   shutil.copy2(old/rel,target)
  assert sha(target)==v,rel
else:
 shutil.copytree(old,archive)
after={p.relative_to(archive).as_posix():sha(p) for p in archive.rglob("*") if p.is_file()}
assert before==after, "Byte-perfect historical task archive mismatch: stop"
# Existing external files now redirect rather than dispatch old mixed-repository work.
redirected=[]
for p in sorted(old.iterdir()):
 if not p.is_file() or p.suffix.lower() not in (".md",".txt"):continue
 relative=p.name
 target=canonical/relative
 if not target.is_file():continue
 stub=("# RETIRED EXTERNAL MISSION ENTRY — CANONICAL WORKSPACE ONLY\n\n"
       "DO NOT RUN MISSIONS FROM THIS RETIRED LOCATION.\n\n"
       "Canonical workspace: D:\\KNOUX-Workspace\\KNOuX-Gemini-SmartOrganizer\n"
       "GitHub: https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer\n"
       "READ: D:\\KNOUX-Workspace\\KNOuX-Gemini-SmartOrganizer\\missions\\STANDALONE_AUTONOMOUS_ENTRY.md\n"
       "Canonical version of this task: "+str(target)+"\n\n"
       "Run python scripts/verify-workspace.py in the canonical repo before ANY write.\n"
       "Do not run the old Root CI, work inside KNOuX-Gemini-UI, or push to original Knoux-SmartOrganizer.\n"
       "Original exact-byte legacy task text is preserved inside new repo migration-history/original-mission-library-20261025.\n")
 p.write_text(stub,encoding="utf-8")
 redirected.append(relative)
# Add plainly named pointer; this old folder is present because ACL denies moving it.
(old/"00_CANONICAL_WORKSPACE_ONLY.md").write_text(
 "ALL FUTURE WORK: D:\\KNOUX-Workspace\\KNOuX-Gemini-SmartOrganizer\\missions\\STANDALONE_AUTONOMOUS_ENTRY.md\n"
 "This folder is deprecated and is not a separate project. The original files were preserved byte-for-byte inside the canonical repo.\n",encoding="utf-8")
receipt={"source_folder":str(old),"canonical_folder":str(canonical),
"archive_folder":str(archive),"original_files_sha256_verified":len(after),"redirected_external_task_documents":len(redirected),
"redirected_files":redirected,"legacy_folder_remains_due_to_windows_acl":True,
"all_further_mission_writes_should_target":str(canonical)}
(root/"migration-history"/"canonical-consolidation-receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:v for k,v in receipt.items() if k!="redirected_files"},ensure_ascii=False,indent=2))
