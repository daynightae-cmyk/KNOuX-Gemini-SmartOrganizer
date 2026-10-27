"""Hash-deduplicate reviewed evidence and archive members; no source deletion."""
import subprocess,json,hashlib,re,zipfile,os
from pathlib import Path,PurePosixPath
R=Path(__file__).resolve().parents[2];B=Path(r'D:/KNOUX-Workspace/KNOuX_M0_FINAL_PRESERVATION_20261028_012802');SEVEN='C:/Program Files/7-Zip/7z.exe'
def git(*a):return subprocess.check_output(['git','-C',str(R),*a])
def digest(data):return hashlib.sha256(data).hexdigest()
known={};ledger=[];new=[]
for f in git('ls-files','-z').decode().split('\0'):
 p=R/f
 if f and p.is_file():known.setdefault(digest(p.read_bytes()),f)
def ingest(data,source,proposed):
 h=digest(data)
 if h in known:return {'source':source,'sha256':h,'status':'VERIFIED_DUPLICATE','destination':known[h]}
 if re.search(rb'(?:ghp_[A-Za-z0-9]{30,}|AIza[0-9A-Za-z_-]{30,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|sk-[A-Za-z0-9]{35,})',data):raise RuntimeError('Potential private content needs reviewed disposition: '+source)
 proposed=('migration-history/m0-20261028/blobs/'+h+Path(proposed).suffix) if len(str(R/proposed))>235 else proposed
 p=R/proposed;p.parent.mkdir(parents=True,exist_ok=True);assert not p.exists() or p.read_bytes()==data;p.write_bytes(data);known[h]=proposed;new.append(proposed)
 return {'source':source,'sha256':h,'status':'INTEGRATED','destination':proposed}
def members(archive):
 if archive.suffix=='.zip':
  with zipfile.ZipFile(archive) as z:
   for item in z.infolist():
    if not item.is_dir():yield item.filename,z.read(item)
 else:
  raw=subprocess.check_output([SEVEN,'l','-slt',str(archive)],text=True,encoding='utf-8')
  chunks=raw.split('----------\n',1)[1].split('\n\n')
  for chunk in chunks:
   fields=dict(line.split(' = ',1) for line in chunk.splitlines() if ' = ' in line)
   if not fields.get('Path') or fields.get('Folder')=='+':continue
   name=fields['Path'];yield name,subprocess.check_output([SEVEN,'x','-so',str(archive),name],stderr=subprocess.DEVNULL)
def archive(a,label):
 info={'archive':str(a),'sha256':digest(a.read_bytes()),'members':[]}
 for name,data in members(a):
  rel=PurePosixPath(name.replace('\\','/'));assert not rel.is_absolute() and '..' not in rel.parts and ':' not in str(rel)
  info['members'].append(ingest(data,str(a)+'!'+name,'migration-history/m0-20261028/extracted-'+label+'/'+rel.as_posix()))
 info['status']='ALL_MEMBERS_ACCOUNTED';ledger.append(info)
for m in B.glob('worktrees/*/manifest.json'):
 d=json.loads(m.read_text(encoding='utf-8'))
 for e in d['entries']:
  if e['stored'] and e['path'].endswith('.rar'):archive(m.parent/'working-files'/e['path'],d['name']+'-'+Path(e['path']).parent.name)
roots=[Path(v[9:]) for v in git('worktree','list','--porcelain').decode().splitlines() if v.startswith('worktree ')]
for w in roots:
 if w==R:continue
 dirs=subprocess.check_output(['git','-C',str(w),'ls-files','--others','--ignored','--exclude-standard','--directory','-z']).decode().split('\0')
 for name in dirs:
  if not name or any(c in name.split('/') for c in ['node_modules','dist','release','release-gemini','.cache','.git']):continue
  target=w/name
  files=[target] if target.is_file() else [p for p in target.rglob('*') if p.is_file() and not p.is_symlink()]
  for p in files:
   if p.suffix in ['.zip','.rar']:
    archive(p,w.name+'-'+p.stem);continue
   rel=p.relative_to(w).as_posix();data=p.read_bytes()
   if p.suffix=='.pyc':continue
   safe=B/'ignored-working-files'/w.name/rel;safe.parent.mkdir(parents=True,exist_ok=True);safe.write_bytes(data);assert digest(p.read_bytes())==digest(data)
   ledger.append(ingest(data,str(p),'migration-history/m0-20261028/ignored-'+w.name+'/'+rel))
out=R/'docs/integration/M0_ARTIFACT_DISPOSITION.json';out.write_text(json.dumps(ledger,indent=2)+'\n',encoding='utf-8')
for i in range(0,len(new),40):subprocess.run(['git','-C',str(R),'add','-f','--',*new[i:i+40]],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print('Artifact/source records:',len(ledger),'new unique content:',len(new),'archives:',sum('archive' in e for e in ledger))
