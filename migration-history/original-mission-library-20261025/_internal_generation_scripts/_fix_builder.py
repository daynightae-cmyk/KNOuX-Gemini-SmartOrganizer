from pathlib import Path
import re
p=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-FullStack-Missions-20261025\_build_missions.py")
s=p.read_text(encoding="utf-8")
st=s.index("SPECS=[")
en=s.index("\nEXISTING_NATIVE_HINTS=",st)
part=s[st:en]
new,n=re.subn(r',"(data|backend|ux|risk|proof)":',lambda m: ","+m.group(1)+"=",part)
print("FIXED_KEYWORD_ARGUMENTS",n)
assert n==70,n
result=s[:st]+new+s[en:]
compile(result,str(p),"exec")
p.write_text(result,encoding="utf-8",newline="\n")
print("SCRIPT_COMPILES")