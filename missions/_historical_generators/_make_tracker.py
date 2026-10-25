from pathlib import Path
import json,re,csv,hashlib
root=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-FullStack-Missions-20261025")
src=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-UI\apps\gemini-ui\src\lib\service-ui-renderers.ts")
body=src.read_text(encoding="utf-8",errors="replace")
audit=json.loads((root/"SOURCE_INVENTORY_AND_CONTROL_AUDIT.json").read_text(encoding="utf-8"))
section_by_id={id:k for k,s in audit["sections"].items() for id in s["serviceIds"]}
rows=[]
for match in re.finditer(r"(?ms)^  '([^']+)':\s*\{(.*?)^  \},",body):
    service=match.group(1)
    if service not in section_by_id: continue
    block=match.group(2)
    get=lambda name: (re.search(r"\b"+name+r":\s*'([^']+)'",block).group(1) if re.search(r"\b"+name+r":\s*'([^']+)'",block) else "")
    rows.append({"section":section_by_id[service],"world":get("world"),"service_id":service,"display_name":get("labelEn"),"family":get("family"),"risk_class":get("riskClass"),"registry_implementation":"METADATA_ONLY","UI_render_runtime":"NOT_VERIFIED","native_provider":"NOT_VERIFIED","typed_IPC":"NOT_VERIFIED","preview_interaction":"NOT_VERIFIED","permission_review":"NOT_VERIFIED","unit_tests":"NOT_VERIFIED","Windows_runtime":"NOT_VERIFIED","visual_1366_768":"NOT_VERIFIED","visual_1672_941":"NOT_VERIFIED","visual_1920_1080":"NOT_VERIFIED","last_verified_SHA":"","notes":"Read mission file; compare current code"})
assert len(rows)==132 and len({r["service_id"] for r in rows})==132
p=root/"SERVICE_EXECUTION_TRACKER.csv"
if p.exists():raise RuntimeError("Tracker already exists; preserve edits")
with p.open("w",encoding="utf-8-sig",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]))
    w.writeheader();w.writerows(rows)
mds=sorted(root.glob("*.md"))
manifest=[{"file":p.name,"bytes":p.stat().st_size,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()} for p in mds+[root/"SERVICE_EXECUTION_TRACKER.csv",root/"SOURCE_INVENTORY_AND_CONTROL_AUDIT.json"]]
(root/"MISSION_SHA256_MANIFEST.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
print(f"TRACKER_VERIFIED={len(rows)};PROMPTS={len(list(root.glob('*_FULLSTACK_MISSION.md')))};FILES_HASHED={len(manifest)}")
