"""Read-only source/asset inventory. Writes only the reconciliation receipt.

Historical files are never executed, copied over main, deleted or treated as
equivalent solely because they occur in history. Credentials/vendor/builds are
excluded. Divergent content is a review candidate, not an automatic import.
"""
import collections
import hashlib
import json
import os
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
PARENT = ROOT.parent
OUTPUT = ROOT / 'docs/evidence/reconciliation-20261102/preservation-inventory.json'
SKIP = {'.git', 'node_modules', 'dist', 'release', 'release-gemini', 'win-unpacked', '__pycache__', '.cache', 'packaged', 'package-final', 'packaged-release-gemini-m0'}
EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.css', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.json', '.html'}


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8', errors='replace').strip()


def blob_hash(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


history = {row.split(' ', 1)[0] for row in git('rev-list', '--objects', 'HEAD').splitlines()}
candidates = [ROOT / '.worktrees' / '_wip-backups']
candidates += [entry for entry in PARENT.iterdir() if entry.is_dir() and entry.name.startswith('KNOuX_') and any(word in entry.name for word in ('PRESERV', 'BACKUP', 'RECOVERY', 'ANIMA_V0'))]
records = []
errors = []
counts = collections.Counter()
target_cache = {}
for candidate in candidates:
    for directory, dirs, names in os.walk(candidate, followlinks=False):
        dirs[:] = [name for name in dirs if name not in SKIP and not pathlib.Path(directory, name).is_symlink()]
        for name in names:
            source = pathlib.Path(directory, name)
            if source.suffix.lower() not in EXTENSIONS or name.startswith('.env') or source.is_symlink():
                continue
            spelling = source.as_posix()
            target = None
            marker = '/apps/gemini-ui/'
            if marker in spelling:
                suffix = spelling.split(marker, 1)[1]
                if suffix.startswith(('src/', 'public/', 'electron/', 'scripts/', 'shared/')):
                    target = 'apps/gemini-ui/' + suffix
            elif '/electron/' in spelling:
                target = 'electron/' + spelling.split('/electron/', 1)[1]
            elif candidate.name == '_wip-backups':
                target = {'App.tsx': 'apps/gemini-ui/src/App.tsx', 'RepairPage.tsx': 'apps/gemini-ui/src/pages/RepairPage.tsx', 'repair-reference.css': 'apps/gemini-ui/src/visual/repair-reference.css', 'system-reference.css': 'apps/gemini-ui/src/visual/system-reference.css'}.get(name)
            if not target:
                continue
            try:
                data = source.read_bytes()
                normalized = data if source.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp'} else data.replace(b'\r\n', b'\n')
                if target not in target_cache:
                    current = ROOT / target
                    value = current.read_bytes() if current.is_file() else None
                    target_cache[target] = value if value is None or current.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp'} else value.replace(b'\r\n', b'\n')
                current = target_cache[target]
                digest = blob_hash(normalized)
                evidence_only = ('/docs/evidence/' in spelling or '/validation-canonical/electron/' in spelling
                                 or '/validation-clone/electron/' in spelling
                                 or '/KNOuX_STUDIO_FULLSTACK_ITERATIONS_PRESERVE_20261028/electron/' in spelling)
                disposition = ('PRESERVED_TEST_EVIDENCE_ONLY' if evidence_only else 'CURRENT_BYTE_EQUIVALENT' if current == normalized else 'HISTORICAL_BLOB_PRESERVED_ON_MAIN' if digest in history else 'CONTENT_REVIEW_REQUIRED')
                counts[disposition] += 1
                records.append({'source': str(source), 'target': target, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'normalizedGitBlob': digest, 'disposition': disposition})
            except OSError as error:
                errors.append({'source': str(source), 'error': type(error).__name__})

refs = []
for line in git('for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads', 'refs/remotes/origin').splitlines():
    ref, sha = line.split(' ', 1)
    refs.append({'ref': ref, 'sha': sha, 'commitsNotInMain': int(git('rev-list', '--count', 'HEAD..' + ref))})
report = {'baseline': git('rev-parse', 'HEAD'), 'scope': 'Whitelisted source and assets in named preservation roots; vendor/build/package binaries and unrelated credentials excluded. Historical blob presence is preservation proof only, not current behavior equivalence.', 'roots': [str(value) for value in candidates], 'counts': dict(counts), 'errors': errors, 'refs': refs, 'records': records}
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'counts': dict(counts), 'errors': errors, 'reviewTargets': dict(collections.Counter(row['target'] for row in records if row['disposition'] == 'CONTENT_REVIEW_REQUIRED')), 'refs': refs}, ensure_ascii=False, indent=2))
