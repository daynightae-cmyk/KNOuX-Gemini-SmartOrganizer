"""Apply individually reviewed M0 conflict hunks, retaining both source blobs."""
from pathlib import Path
import subprocess,re,json,hashlib
ROOT=Path(__file__).resolve().parents[2]
def git(*args):return subprocess.check_output(['git','-C',str(ROOT),*args])
choices={
 'src/App.tsx':([0,0],'Keep all current reference sections and both real-operation hosts; engine import already resolves last.'),
 'src/apps/ApplicationsHero.tsx':([0,0],'Keep required typed handler and measured refresh/check/export wheel. Search and all service dossiers remain in ApplicationsTools/register.'),
 'src/pages/ApplicationsPage.tsx':([0],'Keep typed setter without unsafe cast.'),
 'src/pages/RepairPage.tsx':([0,0,1],'Keep accepted hero/features; combine six Sprint diagnostic/restore/log scopes with current layout and consent boundaries.'),
 'src/pages/ServicesPage.tsx':([0],'Keep accepted feature copy in addition to shared engine and real SCM wheel.'),
 'src/pages/StoragePage.tsx':([0],'Keep measured refresh and live vault duplicate route. Filetype/age/folder tabs remain directly available in main map controls.'),
 'src/pages/SystemPage.tsx':([0],'Keep reference GPU/events wheel. Thermal/health/connectivity stay accessible through full native service registry and health cards.'),
 'src/services.css':([0,0],'Keep accepted wheel size and visible narrow-screen reflow; never restore Sprint display:none regression.'),
 'src/smart-scan/SmartScanHero.tsx':([1,0],'Retain accepted HeroFeatures/source status rail, integrate Sprint six tool-specific scope handlers.'),
 'src/smart-scan/SmartScanPage.tsx':([1],'Pass actual capability-backed service IDs to existing workbench.'),
 'src/visual/OrbitalControl.tsx':([0,0,0,0,1],'Combine current coreIcon and Reduced Motion particles with Sprint aria-pressed toggle semantics.'),
 'src/visual/orbital-engine.css':([0,0,0],'Keep current default-night selectors and Files geometry ownership; shared Sprint engine already in current tree.'),
 'src/visual/repair-reference.css':([1],'Integrate vertical seven-step checklist and wrapping; later accepted canvas sizing overrides remain.'),
 'src/visual/system-reference.css':([0],'Retain truthful native-unavailable instruments, not removal of accepted instrumentation.')}
conflicts=git('diff','--name-only','--diff-filter=U').decode().splitlines();ledger=[]
for f in conflicts:
 p=ROOT/f;ours=git('show',':2:'+f);theirs=git('show',':3:'+f)
 archive=ROOT/'migration-history/m0-20261028/visual-sprint-d586601'/f
 archive.parent.mkdir(parents=True,exist_ok=True);archive.write_bytes(theirs)
 if f.startswith('apps/gemini-ui/'):
  keep=ROOT/'migration-history/m0-20261028/pre-merge-unified'/f;keep.parent.mkdir(parents=True,exist_ok=True);keep.write_bytes(ours)
  key=f[len('apps/gemini-ui/'):];decisions,reason=choices[key];s=p.read_text(encoding='utf-8');count=[0]
  def resolve(m):
   i=count[0];count[0]+=1;return m.group(1+decisions[i])
  s=re.sub(r'<<<<<<<[^\n]*\n(.*?)=======\n(.*?)>>>>>>>[^\n]*\n?',resolve,s,flags=re.S)
  assert count[0]==len(decisions),(f,count)
  if key=='src/smart-scan/SmartScanHero.tsx':
   old=re.search(r"        tools=\{\[\n(.*?)        \]\} />",s,re.S)
   original=theirs.decode();incoming=re.search(r"          tools=\{\[\n(.*?)          \]\} />",original,re.S)
   assert old and incoming
   s=s[:old.start(1)]+incoming.group(1)+s[old.end(1):]
  p.write_text(s,encoding='utf-8')
 else:
  p.write_bytes(ours);reason='Newest accepted canonical capture retained; divergent Sprint bytes archived separately with original relative name.'
 ledger.append({'path':f,'status':'CONFLICT_RECONCILED','reason':reason,'sprintArchive':archive.relative_to(ROOT).as_posix(),'sprintSha256':hashlib.sha256(theirs).hexdigest(),'currentSha256':hashlib.sha256(ours).hexdigest()})
 git('add','--',f,archive.relative_to(ROOT).as_posix())
 if f.startswith('apps/'):git('add','--',keep.relative_to(ROOT).as_posix())
out=ROOT/'docs/integration/M0_VISUAL_CONFLICT_DISPOSITION.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(ledger,indent=2)+'\n',encoding='utf-8')
print('Individually reconciled',len(ledger),'paths; both divergent histories and original blobs retained.')
