"""Record the exact local source/build/receipt identity for the Files pilot."""
from pathlib import Path
import hashlib, json, subprocess
from datetime import datetime, timezone

repo=Path(__file__).resolve().parents[3]
folder=repo/'docs/evidence/files-owner-pilot'
paths=[
 'apps/gemini-ui/src/pages/FilesPage.tsx',
 'apps/gemini-ui/src/visual/OrbitalControl.tsx',
 'apps/gemini-ui/src/visual/files-reference.css',
 'apps/gemini-ui/src/visual/files-visual.css',
 'apps/gemini-ui/src/visual/orbital-engine.css',
 'apps/gemini-ui/src/visual/reference-polish.css',
]
paths += [str(p.relative_to(repo)).replace('\\','/') for p in (repo/'apps/gemini-ui/scripts').glob('files-*') if p.name in ['files-viewport-check.mjs','files-interaction-check.mjs','files-electron-pilot.mjs','files-reference-comparison.py','files-evidence-manifest.py']]
paths += [str(p.relative_to(repo)).replace('\\','/') for p in (repo/'apps/gemini-ui/dist').rglob('*') if p.is_file()]
files={p:hashlib.sha256((repo/p).read_bytes()).hexdigest() for p in paths}
after=json.loads((folder/'after/geometry.json').read_text(encoding='utf8'))
native=json.loads((folder/'electron/checks.json').read_text(encoding='utf8'))
manifest={
 'capturedAt':datetime.now(timezone.utc).isoformat(),
 'branch':subprocess.check_output(['git','branch','--show-current'],cwd=repo,text=True).strip(),
 'baseHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),
 'delivery':'local uncommitted Files pilot; owner visual review pending',
 'sourceAndBuildSha256':files,
 'rendererCases':len(after), 'rendererFailures':sum(bool(row['failures']) for row in after),
 'nativeCases':[{k:row[k] for k in ['theme','actualTheme','width','height','geometry','rows']} for row in native if 'theme' in row],
 'securityAndSource':native[-1],
 'screenshots':{str(p.relative_to(folder)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in folder.rglob('*.png') if p.name!='search-diagnostic.png'},
}
(folder/'source-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
print(json.dumps({k:manifest[k] for k in ['branch','baseHead','rendererCases','rendererFailures']},indent=2))
