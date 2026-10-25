from pathlib import Path
import json, re, hashlib
root=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-FullStack-Missions-20261025")
refs=Path(r"D:\KNOUX-Workspace\references")
mapping={
"03_ORGANIZATION_STUDIO":"REF-01_Smart_Organization_Studio.png",
"05_APPLICATIONS":"REF-02_Applications_Software_Command.png",
"06_FILES":"REF-03_Files_Instant_Find.png",
"07_STORAGE":"REF-04_Storage_Volume_Atlas.png",
"08_CLEANUP":"REF-05_Cleanup_Clean_Room.png",
"09_STARTUP":"REF-06_Startup_Boot_Control.png",
"10_SYSTEM":"REF-07_System_Live_Pulse.png",
"11_REPAIR":"REF-08_Repair_Recovery_Lab.png",
"12_SERVICES":"REF-09_Windows_Services_Commander.png",
"13_AUTOMATION":"REF-10_Automation_Flow_Studio.png"
}
for key,name in mapping.items():
    p=root/(key+"_FULLSTACK_MISSION.md")
    ref=refs/name
    assert p.exists() and ref.exists(),(p,ref)
    body=p.read_text(encoding="utf-8")
    marker="## SOURCE-AVAILABLE APPROVED VISUAL REFERENCE"
    if marker not in body:
        body+="\n\n"+marker+"\n\n"+str(ref)+"\n\nThe file above EXISTS on this PC and is the approved visual baseline for this section. Inspect it directly at native resolution. Compare actual rendered window region-by-region, maintain the same composition and branded assets, and show actual before/after evidence at the acceptance viewports. Do not claim visual parity without screenshots.\n"
        p.write_text(body,encoding="utf-8",newline="\n")
for key in ("01_HOME","02_SMART_SCAN","04_GOOGLE_WORKSPACE","14_SETTINGS_ASSISTANT"):
    p=root/(key+"_FULLSTACK_MISSION.md")
    body=p.read_text(encoding="utf-8")
    marker="## ORIGINAL VISUAL ASSET AVAILABILITY"
    if marker not in body:
        body+="\n\n"+marker+"\n\nNo matching named standalone reference image for this section was found in D:\\KNOUX-Workspace\\references during this audit. Preserve approved imagery already in source; if the user supplies a reference with the mission, compare to it. Do not invent a file path or claim exact reference parity absent a supplied image.\n"
        p.write_text(body,encoding="utf-8",newline="\n")
audit=json.loads((root/"SOURCE_INVENTORY_AND_CONTROL_AUDIT.json").read_text(encoding="utf-8"))
all_services=[x for val in audit["sections"].values() for x in val["serviceIds"]]
assert len(all_services)==132 and len(set(all_services))==132
docs=list(root.glob("*_FULLSTACK_MISSION.md"))
assert len(docs)==14
for p in docs:
    body=p.read_text(encoding="utf-8")
    assert "FULL-STACK" in body and "RELEASE GATES" in body and "ACTION / CONTROL AUDIT" in body and len(body)>11000,p.name
manifest=[{"file":p.name,"bytes":p.stat().st_size,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(root.glob("*.md"))]
(root/"MISSION_SHA256_MANIFEST.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps({"status":"VERIFIED","section_prompts":len(docs),"all_unique_registry_services":len(set(all_services)),"reference_screenshots_bound":len(mapping),"files_in_package":len(list(root.iterdir())),"smallest_prompt_bytes":min(p.stat().st_size for p in docs),"largest_prompt_bytes":max(p.stat().st_size for p in docs)},ensure_ascii=False))