"""Owner-mandated one-time M0 Git checkpoint. Does not overwrite root source."""
import subprocess,json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[2];C=Path(r'D:/KNOUX-Workspace/KNOuX-Gemini-SmartOrganizer');B=Path(r'D:/KNOUX-Workspace/KNOuX_M0_FINAL_PRESERVATION_20261028_012802')
subprocess.run(['python',str(R/'scripts/verify-workspace.py')],check=True)
def git(*a):return subprocess.check_output(['git','-C',str(C),*a]).decode().strip()
assert git('branch','--show-current')=='integration/final-acceptance-20261027'
assert git('rev-parse','HEAD')=='516f0ed0ff41a39e59b98938faa7a14d3d199063'
assert Path(git('rev-parse','--path-format=absolute','--git-common-dir')).resolve()==(C/'.git').resolve()
assert git('remote','get-url','origin')=='https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer.git'
assert not git('diff','--cached','--name-only'),'Existing staged work requires separate disposition'
m=json.loads((B/'worktrees/root/manifest.json').read_text(encoding='utf-8'));files=[]
for e in m['entries']:
 if not e['stored']:continue
 p=C/e['path'];assert p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest()==e['sha256'], 'Writer changed '+e['path']
 if p.suffix in ['.rar','.pyc'] or e['path'].startswith('.worktrees/'):continue
 files.append(e['path'])
# Legacy root guard expects the retired branch; M0 owner mandate expressly
# authorizes this exact checkpoint/cutover. Stronger root/common-dir/origin,
# pinned HEAD, empty index and every WIP SHA are checked before any Git mutation.
for i in range(0,len(files),40):subprocess.run(['git','-C',str(C),'add','-f','--',*files[i:i+40]],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
subprocess.run(['git','-C',str(C),'commit','-m','chore(m0): checkpoint canonical WIP byte-preserved before main consolidation'],check=True,stdout=(B/'root-checkpoint-commit.txt').open('wb'),stderr=subprocess.STDOUT)
proof={'status':'VERIFIED_ROOT_WIP_CHECKPOINT','head':git('rev-parse','HEAD'),'stagedExplicitPaths':files,'originalRawBackup':str(B),'noRootSourceOverwritten':True}
(R/'docs/integration/M0_ROOT_CHECKPOINT.json').write_text(json.dumps(proof,indent=2)+'\n')
print('Canonical WIP checkpoint',proof['head'],'explicit paths',len(files))
