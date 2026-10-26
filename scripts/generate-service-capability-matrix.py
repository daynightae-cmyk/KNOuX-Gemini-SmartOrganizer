"""Enumerate every advertised KNOuX service and the missing product acceptance evidence."""
from pathlib import Path
import re
R=Path(__file__).resolve().parent.parent
M=R/"missions"
O=R/"docs/SERVICE_CAPABILITY_MATRIX.md"
heading=re.compile(r"^###\s+(\d\d)\.\s+(.+?)\s*$")
classmap={
 "03":{"7":"B","8":"B","4":"B","5":"B","6":"B"},
 "05":{"6":"C","7":"C","8":"C","10":"C","11":"C"},
 "06":{"2":"B","3":"B","4":"B"},
 "07":{"3":"B","8":"C","10":"C"},
 "08":{"2":"B","3":"B","4":"B","6":"C","8":"C","9":"B","11":"B"},
 "09":{"2":"B","3":"B","8":"C","9":"C","10":"B","11":"B","12":"B"},
 "10":{"24":"C"},
 "11":{"3":"C","5":"C","6":"C","7":"C","8":"C","10":"C","11":"C","12":"C"},
 "12":{"2":"C","3":"C","11":"C"},
 "13":{"1":"B","2":"B","5":"B","6":"C","7":"B","8":"B","9":"B","10":"B","11":"B","12":"B"},
}
rows=[]
counts={}
for f in sorted(M.glob("??_*_FULLSTACK_MISSION.md")):
 mid=f.name[:2]
 for ln in f.read_text(encoding="utf-8-sig").splitlines():
  mt=heading.match(ln)
  if not mt:continue
  num,title=mt.groups()
  code=re.search(r"\x60([a-z][a-z0-9-]+)\x60",title)
  sid=code.group(1) if code else f"mission-{mid}-{num}"
  title=title.split(chr(96))[0].strip().strip(" -–—")
  cls=classmap.get(mid,{}).get(str(int(num)),"D" if mid=="04" else "A")
  if mid=="01" and int(num) in (1,2,3,5,6,8,12):cls="B"
  if mid=="02" and int(num) in (3,5,10):cls="C" if int(num)==5 else "B"
  if mid=="14":cls="D" if int(num) in (2,3,8) else "B"
  scope="PENDING_MISSION" if mid in ("01","04","14") else "SCOPED_MILESTONE_ONLY"
  rows.append((mid,num,sid,title,cls,scope))
  counts[mid]=counts.get(mid,0)+1
assert len(counts)==14 and len(rows)>140
assert len(set((r[0],r[2]) for r in rows))==len(rows)
header="""# KNOuX — COMPLETE SERVICE CAPABILITY MATRIX

Source: each original service heading from the 14 domain mission files inside the SINGLE canonical repository.
This is a PRODUCT COMPLETION backlog, NOT a claim that these capabilities are implemented. Earlier CI and Qoder milestones remain historical scoped acceptance only.
Read missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md and missions/15_REAL_SERVICE_ACTIVATION_MISSION.md.
Classes are PROVISIONAL (A observation / B reversible action / C privileged or irreversible / D external connected); verify and correct during code/provider inspection.
Where a mission did not specify a service code, a provisional mission-ID-section-ID is used until reconciled with the actual service registry.
For EVERY row fill exact native provider, actual visible action, permission gate, result/postcondition, journal/rollback, Electron fixture E2E and the honest status. No passive dashboard or dry run counts as an actual mutation service.

| Mission | Service ID | Service intent | Proposed class | Old scope | Real provider | Actual executor/UI action | Consent & recovery | Fixture end-to-end | Actual product state |
|---|---|---|---|---|---|---|---|---|---|
"""
s=[header]
for mid,num,sid,title,cls,scope in rows:
 s.append("| "+" | ".join([mid,sid,title.replace("|","/"),cls,scope,"AUDIT_REQUIRED","AUDIT_REQUIRED","AUDIT_REQUIRED","NOT_VERIFIED","AUDIT_REQUIRED"])+" |\n")
s.append("\n## Scope inventory\n\n")
for mid in sorted(counts):s.append(f"- {mid}: {counts[mid]} service descriptions\n")
s.append(f"\n**TOTAL: {len(rows)} advertised service entries in {len(counts)} missions.** This does NOT mean that {len(rows)} native executors exist. Technical quality and safety are separately verified.\n")
O.parent.mkdir(parents=True,exist_ok=True)
O.write_text("".join(s),encoding="utf-8")
print("MATRIX",O,"MISSIONS",len(counts),"SERVICES",len(rows))
for k in sorted(counts):print(k,counts[k])
