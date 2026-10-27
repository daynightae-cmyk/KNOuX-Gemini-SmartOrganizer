import os,sys,json,subprocess,datetime
from pathlib import Path
R=Path(__file__).resolve().parents[2];app=R/'apps/gemini-ui';phase=sys.argv[1] if len(sys.argv)>1 else 'staging';out=R/'docs/evidence/m0-20261028'/phase;out.mkdir(parents=True,exist_ok=True)
env=dict(os.environ,RAYON_NUM_THREADS='1',UV_THREADPOOL_SIZE='1',KNOUX_ORGANIZATION_EVIDENCE_DIR=str(out/'organization'),KNOUX_VAULT_EVIDENCE_DIR=str(out/'vault'))
(out/'organization').mkdir(exist_ok=True);(out/'vault').mkdir(exist_ok=True)
checks=[]
def run(name,cmd,cwd=app):
 with (out/(name+'.txt')).open('wb') as log:p=subprocess.run(cmd,cwd=cwd,env=env,stdout=log,stderr=subprocess.STDOUT)
 checks.append({'name':name,'command':cmd,'exitCode':p.returncode,'at':datetime.datetime.now(datetime.timezone.utc).isoformat()});(out/'checks.json').write_text(json.dumps(checks,indent=2)+'\n')
 print(name,p.returncode,flush=True)
 if p.returncode:raise SystemExit(p.returncode)
run('guard',['python',str(R/'scripts/verify-workspace.py')],R)
run('types',['node','--max-old-space-size=160','node_modules/typescript/bin/tsc','--noEmit'])
run('build',['node','--single-threaded','--v8-pool-size=1','--max-old-space-size=160','--optimize-for-size','node_modules/vite/bin/vite.js','build'])
for test in ['native-contract','studio-native','files-native','storage-native','scan-native','apps-native','cleanup-native','startup-native','system-native','repair-native','services-native','automation-native','workspace-consent','google-oauth','settings-consent','home-live','workbench-host','navigation-route','live-organization','live-organization-negative','storage-vault','storage-vault-negative']:
 run(test,['node','--max-old-space-size=160','scripts/'+test+'-test.cjs'] if test not in ['live-organization-negative','storage-vault-negative'] else ['node','--max-old-space-size=160','scripts/'+test+'.cjs'])
