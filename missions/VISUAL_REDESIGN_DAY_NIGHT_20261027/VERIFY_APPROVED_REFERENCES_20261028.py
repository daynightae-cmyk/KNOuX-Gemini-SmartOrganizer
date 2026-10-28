#!/usr/bin/env python3
"""Read-only verification of KNOuX owner-approved reference image files."""
from pathlib import Path
import json
import hashlib
import struct
import sys

root = Path(__file__).resolve().parent
manifest = json.loads((root / "REFERENCES_MANIFEST.json").read_text(encoding="utf-8-sig"))
entries = manifest.get("images", [])
bad = []
present = set()
for i, entry in enumerate(entries, 1):
    relative = entry.get("file", "")
    if not relative.startswith("references/") or ".." in Path(relative).parts:
        bad.append((relative, "invalid path"))
        continue
    file = root / relative
    present.add(relative)
    if not file.is_file():
        bad.append((relative, "MISSING"))
        continue
    with file.open("rb") as handle:
        header = handle.read(24)
    if len(header) != 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        bad.append((relative, "invalid PNG header"))
        continue
    width, height = struct.unpack(">II", header[16:24])
    expected = (entry.get("width"), entry.get("height"))
    if (width, height) != expected:
        bad.append((relative, f"dimension {width}x{height} != {expected}"))
    with file.open("rb") as binary:
        digest = hashlib.file_digest(binary, "sha256").hexdigest()
    if digest.lower() != str(entry.get("sha256", "")).lower():
        bad.append((relative, "SHA-256 mismatch"))
    print(f"{i:02d} {entry.get('theme', '?'):6s} {relative} {width}x{height} sha256={'OK' if digest.lower() == str(entry.get('sha256', '')).lower() else 'FAIL'}")
home_night = "references/night/00_home-command-center.png"
print(f"HOME_NIGHT_REFERENCE: {'PRESENT' if (root / home_night).is_file() else 'MISSING - do not claim home DAY/NIGHT parity'}")
print(f"VERDICT: {'FAIL' if bad else 'ASSETS_VERIFIED'}; entries={len(entries)}; failed={len(bad)}")
for name, reason in bad:
    print("FAIL", name, reason, file=sys.stderr)
sys.exit(1 if bad else 0)
