"""Refresh mission file hashes without touching application source or making backups."""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "MISSION_SHA256_MANIFEST.json"
EXTRAS = [
    "00_AUTONOMOUS_MISSION_CONTROLLER_20261025.md",
    "00_RECOVER_AND_CLOSE_ALL_VISUALS_BEFORE_DATA_20261025.md",
    "00_START_AGENT_AUTORUN_20261025.md",
]

def main() -> None:
    if not MANIFEST.is_file():
        raise SystemExit("BLOCKED: original mission manifest not found")
    raw = json.loads(MANIFEST.read_text(encoding="utf-8-sig"))
    if not isinstance(raw, list):
        raise SystemExit("BLOCKED: unexpected manifest structure")
    names: list[str] = []
    for item in raw:
        if not isinstance(item, dict) or not isinstance(item.get("file"), str):
            raise SystemExit("BLOCKED: invalid manifest entry")
        names.append(item["file"])
    names.extend(EXTRAS)
    result = []
    for name in dict.fromkeys(names):
        rel = Path(name)
        source = (ROOT / rel).resolve()
        if rel.is_absolute() or ROOT not in source.parents or not source.is_file():
            raise SystemExit(f"BLOCKED: missing or escaping file: {name}")
        data = source.read_bytes()
        result.append({
            "file": name,
            "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
        })
    fresh = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    old = MANIFEST.read_text(encoding="utf-8-sig")
    if old == fresh:
        print(f"VALID: manifest unchanged, {len(result)} files")
        return
    fd, tmpname = tempfile.mkstemp(prefix=".mission-manifest-", suffix=".tmp", dir=ROOT)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(fresh)
        try:
            os.replace(tmpname, MANIFEST)
        except PermissionError:
            # Some remote Windows hosts deny replace/delete while still permitting safe content writes.
            with MANIFEST.open('w', encoding='utf-8', newline='\n') as out:
                out.write(fresh)
            if MANIFEST.read_text(encoding='utf-8-sig') != fresh:
                raise RuntimeError('Manifest direct-write verification failed')
    finally:
        if os.path.exists(tmpname):
            os.unlink(tmpname)
    print(f"UPDATED: {MANIFEST} ({len(result)} files)")
    for item in result:
        if item["file"] in EXTRAS:
            print(f'  {item["file"]} {item["sha256"]} ({item["bytes"]} bytes)')

if __name__ == "__main__":
    main()
