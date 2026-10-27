"""Copy reviewed immutable WIP into M0; never writes to a source worktree."""
from pathlib import Path
import json,hashlib,subprocess,shutil
R=Path(__file__).resolve().parents[2]
B=Path(r'D:/KNOUX-Workspace/KNOuX_M0_FINAL_PRESERVATION_20261028_012802')
def sha(data):return hashlib.sha256(data).hexdigest()
ledger=[];staged=[]
unsafe={'apps/gemini-ui/electron/main.cjs','apps/gemini-ui/electron/native/studio-bridge.cjs','apps/gemini-ui/electron/preload.cjs','apps/gemini-ui/shared/native-contract.json','apps/gemini-ui/shared/native-contracts.ts','apps/gemini-ui/src/studio/native.ts','apps/gemini-ui/scripts/studio-exec-test.cjs'}
for manifest in sorted(B.glob('worktrees/*/manifest.json')):
 m=json.loads(manifest.read_text(encoding='utf-8'))
 for e in m['entries']:
  rel=e['path'];item={'worktree':m['name'],'sourceHead':m['head'],'path':rel,'sourceSha256':e.get('sha256')}
  if not e['stored']:
   item.update(status='VERIFIED_DUPLICATE',reason=e.get('reason','non-file descriptor; worktree separately preserved'));ledger.append(item);continue
  source=manifest.parent/'working-files'/rel;data=source.read_bytes();assert sha(data)==e['sha256']
  if source.suffix in ['.pyc','.rar']:
   item.update(status='PRESERVED_PENDING',reason='Derived bytecode or archive; unpack/compare before final disposition.',externalCopy=str(source));ledger.append(item);continue
  dest=R/rel
  if dest.is_file() and sha(dest.read_bytes())==e['sha256']:
   item.update(status='VERIFIED_DUPLICATE',destination=rel,reason='Exact SHA-256 byte match in unified tree.');ledger.append(item);continue
  if rel in unsafe or rel.startswith('.worktrees/') or dest.exists():
   dest=R/'migration-history/m0-20261028'/('wip-'+m['name'])/rel
   reason='Original WIP preserved byte-exact. Active newer implementation retains behavior and consent; native metadata additions reconciled separately.' if rel in unsafe else 'Distinct historical/source asset retained under explicit provenance; accepted canonical file retained.'
  else:reason='Unique new source/mission/reference/evidence installed at its original product-relative path.'
  dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data);staged.append(dest.relative_to(R).as_posix())
  item.update(status='INTEGRATED',destination=dest.relative_to(R).as_posix(),reason=reason);ledger.append(item)
out=R/'docs/integration/M0_WIP_DISPOSITION.json';out.write_text(json.dumps(ledger,indent=2)+'\n',encoding='utf-8')
for i in range(0,len(staged),40):subprocess.run(['git','-C',str(R),'add','-f','--',*staged[i:i+40]],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print('Reviewed WIP records:',len(ledger),'copied:',len(staged),'archive/bytecode pending:',sum(e['status']=='PRESERVED_PENDING' for e in ledger))
