"""Read-only content audit; no checkout, copying, deletion, or secret contents."""
import hashlib
import json
import os
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/evidence/consolidation-20261103'
SKIP = {'node_modules', '.git', '.worktrees', 'dist', 'release', 'win-unpacked', '__pycache__', '.cache', '.vite'}
SOURCE = {'.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.css', '.html', '.py', '.ps1', '.md', '.json', '.csv', '.svg'}

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8', 'replace')

def oid(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

def files(root):
    for base, dirs, names in os.walk(root, followlinks=False):
        dirs[:] = [d for d in dirs if d not in SKIP and not (Path(base)/d).is_junction() and not (Path(base)/d).is_symlink()]
        for name in names:
            p = Path(base)/name
            if p.suffix.lower() in SOURCE and not p.is_symlink():
                yield p

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    history = {}
    for line in git('rev-list', '--objects', 'main').splitlines():
        key, _, name = line.partition(' ')
        history.setdefault(key, name)
    current = {}
    names = git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0')
    for p in (ROOT/name for name in names if name and Path(name).suffix.lower() in SOURCE):
        if p.is_relative_to(OUT):
            continue
        if not p.is_file():
            continue
        data = p.read_bytes()
        current.setdefault(hashlib.sha256(data).hexdigest(), str(p.relative_to(ROOT)))
        current.setdefault(hashlib.sha256(data.replace(b'\r\n', b'\n')).hexdigest(), str(p.relative_to(ROOT)))
    print('Indexed canonical source and main history', flush=True)
    roots = [p for p in ROOT.parent.iterdir() if p.is_dir() and p.name.startswith('KNOuX_')]
    roots += [Path('C:/KNOUX-Codex-AllServices-20261103')]
    worktrees = git('worktree', 'list', '--porcelain')
    for line in worktrees.splitlines():
        if line.startswith('worktree '):
            p = Path(line[9:])
            if p != ROOT and p.exists() and p not in roots:
                roots.append(p)
    report = {'head': git('rev-parse', 'HEAD').strip(), 'roots': [], 'unknown': [], 'errors': []}
    for root in roots:
        counts = Counter()
        for p in files(root):
            try:
                data = p.read_bytes()
                sha = hashlib.sha256(data).hexdigest()
                normalized = data.replace(b'\r\n', b'\n')
                if sha in current or hashlib.sha256(normalized).hexdigest() in current:
                    counts['current_content'] += 1
                elif oid(data) in history or oid(normalized) in history:
                    counts['main_history'] += 1
                else:
                    counts['unresolved'] += 1
                    report['unknown'].append({'path': str(p), 'bytes': len(data), 'sha256': sha})
            except OSError as e:
                report['errors'].append({'path': str(p), 'error': type(e).__name__})
        report['roots'].append({'path': str(root), **counts})
        (OUT/'source-audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
        print(json.dumps(report['roots'][-1]), flush=True)
    (OUT/'source-audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({'roots': report['roots'], 'unresolved': len(report['unknown']), 'errors': report['errors']}, indent=2))

if __name__ == '__main__':
    main()
