from pathlib import Path
p=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-FullStack-Missions-20261025\_build_missions.py")
s=p.read_text(encoding="utf-8")
old='for w in worlds) if worlds else'
new='for w in s["worlds"]) if s["worlds"] else'
assert s.count(old)==1
s=s.replace(old,new)
old2='if path.exists(): raise RuntimeError("Refusing to overwrite existing mission "+str(path))'
new2='if path.exists():\n        if path.read_text(encoding="utf-8") != content: raise RuntimeError("Existing mission differs "+str(path))\n        manifest.append({"file":path.name,"bytes":path.stat().st_size,"sha256":hashlib.sha256(path.read_bytes()).hexdigest()})\n        return'
assert s.count(old2)==1
s=s.replace(old2,new2)
compile(s,str(p),"exec")
p.write_text(s,encoding="utf-8",newline="\n")
print("PATCHED_BUILDER_IDEMPOTENT")