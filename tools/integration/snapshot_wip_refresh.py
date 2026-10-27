# -*- coding: utf-8 -*-
"""Read-only, byte-for-byte, fail-closed preservation of local WIP from all worktrees.
Does not stage/clean/reset/stash/checkout or touch the source. Saves to outside the Git repo.
"""
from pathlib import Path
import subprocess, hashlib, json, shutil, os, sys, datetime
ROOT=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer")
BACKUP=Path(r"D:\KNOUX-Workspace\KNOuX_LOCAL_INTEGRATION_BACKUP_REFRESH_20261028_0108")
ROOT_URI="https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer.git"
EXPECTED=[
("root",ROOT),
("closure",ROOT/".worktrees"/"closure"),
("integration",ROOT/".worktrees"/"integration"),
("live-organization",ROOT/".worktrees"/"live-organization"),
("qoder-visual",ROOT/".worktrees"/"qoder-visual"),
("visual-owner-rebuild",ROOT/".worktrees"/"visual-owner-rebuild"),
("visual-sprint",ROOT/".worktrees"/"visual-sprint")
]
def git(w,*args):
 p=subprocess.run(["git","-C",str(w),*args],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 if p.returncode:raise RuntimeError(str(w)+" git "+str(args)+" FAILED "+p.stderr.decode("utf8","replace"))
 return p.stdout
if BACKUP.exists():
 print("ABORT BACKUP_EXISTS "+str(BACKUP));sys.exit(2)
if git(ROOT,"remote","get-url","origin").decode().strip()!=ROOT_URI:raise RuntimeError("Remote mismatch")
if Path(git(ROOT,"rev-parse","--show-toplevel").decode().strip()).resolve()!=ROOT.resolve():raise RuntimeError("Repo mismatch")
BACKUP.mkdir(parents=True,exist_ok=False)
log={"createdAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),"root":str(ROOT),"backup":str(BACKUP),"worktrees":[],"copyErrors":[]}
(BACKUP/"git-local-refs.txt").write_bytes(git(ROOT,"show-ref"))
(BACKUP/"git-worktree-list.txt").write_bytes(git(ROOT,"worktree","list","--porcelain"))
(BACKUP/"git-branch-vv.txt").write_bytes(git(ROOT,"branch","-avv"))
for label,w in EXPECTED:
 if not w.is_dir():continue
 loc=w.resolve()
 if Path(git(w,"rev-parse","--show-toplevel").decode().strip()).resolve()!=loc:raise RuntimeError("Unexpected worktree "+str(w))
 status=git(w,"status","--porcelain=v1","-z","-uall").split(b"\0")
 entries=[];k=0
 while k<len(status):
  token=status[k];k+=1
  if not token:continue
  tag=token[:2].decode("ascii","replace")
  rel=token[3:].decode("utf8","surrogateescape")
  if tag[0] in "RC" or tag[1] in "RC":
   if k<len(status):k+=1
  entries.append((tag,rel))
 meta={"name":label,"root":str(w),"head":git(w,"rev-parse","HEAD").decode().strip(),"branch":git(w,"branch","--show-current").decode().strip(),"entries":[]}
 out=BACKUP/"worktrees"/label
 (out/"working-files").mkdir(parents=True,exist_ok=True)
 # Save exact tracked diffs, including staged changes, while worktree is untouched.
 for label_out,arguments in [("unstaged.diff",["diff","--binary"]),("staged.diff",["diff","--cached","--binary"])]:
  (out/label_out).write_bytes(git(w,*arguments))
 for tag,rel in entries:
  if rel.startswith("/") or ".." in Path(rel).parts:
   log["copyErrors"].append({"worktree":label,"path":rel,"reason":"unsafe relative path"});continue
  src=w/rel;dst=out/"working-files"/rel
  ent={"status":tag,"path":rel,"exists":src.exists(),"stored":False}
  try:
   if src.is_symlink():ent["reason"]="symlink not dereferenced; left untouched"
   elif src.is_file():
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dst)
    def sha(p):
     h=hashlib.sha256()
     with p.open("rb") as f:
      while True:
       b=f.read(2**20)
       if not b:break
       h.update(b)
     return h.hexdigest()
    ent.update({"stored":True,"bytes":dst.stat().st_size,"sha256":sha(dst)})
    if sha(src)!=ent["sha256"]:ent["warning"]="source changed DURING backup; re-snapshot required before merge"
   elif src.is_dir():ent["reason"]="directory or junction not dereferenced; preserve via original worktree"
   else:ent["reason"]="deleted or missing, tracked in git diffs"
  except Exception as ex:
   ent["error"]=str(ex);log["copyErrors"].append({"worktree":label,"path":rel,"error":str(ex)})
  meta["entries"].append(ent)
 (out/"manifest.json").write_text(json.dumps(meta,indent=2,ensure_ascii=False),encoding="utf8")
 log["worktrees"].append({"label":label,"head":meta["head"],"branch":meta["branch"],
 "files":len(meta["entries"]),"copied":sum(bool(e["stored"]) for e in meta["entries"]),
 "warnings":sum(bool(e.get("warning")) for e in meta["entries"])})
 print("BACKUP|"+label+"|tracked/untracked entries="+str(len(meta["entries"]))+"|copied="+str(sum(e["stored"] for e in meta["entries"])),flush=True)
(BACKUP/"snapshot-summary.json").write_text(json.dumps(log,indent=2,ensure_ascii=False),encoding="utf8")
print("BACKUP_ROOT="+str(BACKUP),flush=True)
print("ERROR_COUNT="+str(len(log["copyErrors"])),flush=True)
if log["copyErrors"]:sys.exit(3)
