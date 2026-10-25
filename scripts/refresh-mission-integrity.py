"""Regenerate manifest for the ONLY live KNOuX mission library."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parent.parent
MISSION=ROOT/"missions"
assert (ROOT/"AGENTS.md").is_file() and (MISSION/"STANDALONE_AUTONOMOUS_ENTRY.md").is_file()
out=[]
for f in sorted(MISSION.iterdir()):
 if not f.is_file() or f.name=="MISSION_SHA256_MANIFEST.json":continue
 data=f.read_bytes()
 out.append({"file":f.name,"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()})
path=MISSION/"MISSION_SHA256_MANIFEST.json"
path.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"Refreshed canonical mission manifest: {len(out)} files at {path}")
