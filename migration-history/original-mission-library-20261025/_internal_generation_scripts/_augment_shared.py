from pathlib import Path
import re, json, hashlib
root=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-FullStack-Missions-20261025")
src=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-UI\apps\gemini-ui\src")
files=[
"components/common/ServiceWorkspaceHost.tsx",
"components/renderers/FamilyRenderersOne.tsx",
"components/renderers/FamilyRenderersTwo.tsx",
"components/renderers/FamilyRenderersThree.tsx",
"lib/service-ui-renderers.ts",
]
wrappers={
"APPLICATIONS":"components/app/ServiceWorkspaces.tsx",
"FILES":"components/files/FileWorkspaces.tsx",
"STORAGE":"components/storage/StorageWorkspaces.tsx",
"CLEANUP":"components/cleanup/CleanupWorkspaces.tsx",
"STARTUP":"components/startup/StartupWorkspaces.tsx",
"SYSTEM":"components/system/SystemWorkspaces.tsx",
"REPAIR":"components/repair/RepairWorkspaces.tsx",
"SERVICES":"components/services/ServicesWorkspaces.tsx",
"AUTOMATION":"components/automation/AutomationWorkspaces.tsx"
}
header="## ADDITIONAL SHARED RENDERER & RUNTIME BUTTON ACCEPTANCE GATE"
source_lines=[]
for f in files:
    text=(src/f).read_text(encoding="utf-8",errors="replace")
    source_lines.append("- src/"+f+" (check direct handlers and generated controls)")
    if f.endswith(".tsx"):
        for m in re.finditer(r"<button\b|\bonClick\s*=\s*\{|\bonChange\s*=\s*\{",text):
            line=text.count("\n",0,m.start())+1
            snippet=text[m.start():m.start()+130].split("\n")[0].strip()
            source_lines.append("  - line "+str(line)+" : "+snippet[:100])
for key,wrap in wrappers.items():
    fn=next(root.glob("*_"+key+"_FULLSTACK_MISSION.md"))
    text=fn.read_text(encoding="utf-8")
    if header in text:continue
    extra="\n\n"+header+"\n\nSome service buttons are generated inside shared renderer families and are NOT counted in the page's own static control audit. You MUST inspect and test their true interaction paths, plus the section-specific wrapper.\n\n"+"\n".join(source_lines)+"\n- src/"+wrap+"\n\nTrace runtime service dispatch from the selected tile to ServiceWorkspaceHost to the appropriate renderer family. For EACH generated control: trace actual current selection, config props, state updates, actual provider call, preview, permission gate, error and verification. A direct page control inventory alone is not complete. No all-service generic fake preview is acceptable.\n"
    fn.write_text(text+extra,encoding="utf-8",newline="\n")
mds=sorted(root.glob("*.md"))
manifest=[{"file":p.name,"bytes":p.stat().st_size,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()} for p in mds+[root/"SERVICE_EXECUTION_TRACKER.csv",root/"SOURCE_INVENTORY_AND_CONTROL_AUDIT.json"]]
(root/"MISSION_SHA256_MANIFEST.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
print("SHARED_RUNTIME_AUDIT_APPLIED="+str(len(wrappers))+" files; HASH_MANIFEST="+str(len(manifest)))
