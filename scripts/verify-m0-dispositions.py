#!/usr/bin/env python3
"""Verify M0 disposition records against real file bytes and Git history."""
from pathlib import Path
import hashlib, json, subprocess, sys, time

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs/evidence/m0-20261028/staging/disposition-verification.json"
BACKUP = Path(r"D:\KNOUX-Workspace\KNOuX_M0_FINAL_PRESERVATION_20261028_012802")

def git(*args):
    result = subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return result.returncode, result.stdout.strip(), result.stderr.strip()

def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def load(relative):
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))

def resolve(value):
    path = Path(value)
    return path if path.is_absolute() else ROOT / path

def check_file(entry, hash_key, label, failures, counts):
    destination = resolve(entry.get("destination", ""))
    counts["checked"] += 1
    if not destination.is_file():
        failures.append({"kind": "missing_file", "record": label, "path": str(destination)})
        return False
    actual = sha256(destination)
    expected = entry.get(hash_key)
    if expected and actual != expected:
        failures.append({"kind": "sha_mismatch", "record": label, "path": str(destination), "expected": expected, "actual": actual})
        return False
    counts["matched"] += 1
    return True

started = time.time()
head_code, head, _ = git("rev-parse", "HEAD")
branch_code, branch, _ = git("branch", "--show-current")
result = {"head": head, "branch": branch, "startedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "failures": [], "counts": {}, "notes": []}
failures = result["failures"]

# 1. Canonical WIP disposition: every destination must be byte-identical to the recorded source.
wip = load("docs/integration/M0_WIP_DISPOSITION.json")
canonical_code, common_dir, _ = git("rev-parse", "--path-format=absolute", "--git-common-dir")
canonical = Path(common_dir).parent
counts = {"checked": 0, "matched": 0, "external": 0, "externalMatched": 0, "worktreeLinks": 0, "worktreeLinksMatched": 0, "statuses": {}}
for entry in wip:
    counts["statuses"][entry["status"]] = counts["statuses"].get(entry["status"], 0) + 1
    if not entry.get("destination"):
        external = entry.get("externalCopy")
        if external:
            counts["external"] += 1
            copy = Path(external)
            if copy.is_file() and sha256(copy) == entry.get("sourceSha256"):
                counts["externalMatched"] += 1
            else:
                failures.append({"kind": "external_copy_mismatch", "path": str(copy), "expected": entry.get("sourceSha256")})
        elif entry.get("sourceSha256") is None:
            counts["worktreeLinks"] += 1
            link = canonical / entry["path"]
            if link.exists():
                counts["worktreeLinksMatched"] += 1
            else:
                failures.append({"kind": "missing_worktree_link", "path": str(link)})
        else:
            failures.append({"kind": "unaccounted_wip", "path": entry.get("path")})
        continue
    check_file(entry, "sourceSha256", "wip", failures, counts)
result["counts"]["wip"] = counts

# 2. Archive disposition: verify archive hashes and every extracted member destination.
groups = load("docs/integration/M0_ARTIFACT_DISPOSITION.json")
counts = {"archives": 0, "archivesMatched": 0, "checked": 0, "matched": 0, "statuses": {}}
for group in groups:
    counts["statuses"][group.get("status", "unknown")] = counts["statuses"].get(group.get("status", "unknown"), 0) + 1
    if "members" in group:
        archive = Path(group["archive"])
        counts["archives"] += 1
        if not archive.is_file():
            failures.append({"kind": "missing_archive", "archive": str(archive)})
        elif sha256(archive) != group["sha256"]:
            failures.append({"kind": "archive_sha_mismatch", "archive": str(archive), "expected": group["sha256"], "actual": sha256(archive)})
        else:
            counts["archivesMatched"] += 1
        for member in group["members"]:
            check_file(member, "sha256", "artifact", failures, counts)
    else:
        check_file(group, "sha256", "artifact", failures, counts)
result["counts"]["artifact"] = counts

# 3. Visual sprint conflicts: preserve the archived sprint bytes, verify current files exist.
conflicts = load("docs/integration/M0_VISUAL_CONFLICT_DISPOSITION.json")
counts = {"checked": 0, "archivesMatched": 0, "currentMatched": 0, "currentEvolved": [], "statuses": {}}
for entry in conflicts:
    counts["checked"] += 1
    counts["statuses"][entry["status"]] = counts["statuses"].get(entry["status"], 0) + 1
    archive = resolve(entry["sprintArchive"])
    if not archive.is_file():
        failures.append({"kind": "missing_sprint_archive", "path": str(archive), "record": entry["path"]})
    elif sha256(archive) != entry["sprintSha256"]:
        failures.append({"kind": "sprint_archive_sha_mismatch", "path": str(archive), "expected": entry["sprintSha256"], "actual": sha256(archive)})
    else:
        counts["archivesMatched"] += 1
    current = resolve(entry["path"])
    if not current.is_file():
        failures.append({"kind": "missing_current_file", "path": str(current), "record": entry["path"]})
    else:
        actual = sha256(current)
        if actual == entry["currentSha256"]:
            counts["currentMatched"] += 1
        else:
            counts["currentEvolved"].append({"path": entry["path"], "recorded": entry["currentSha256"], "current": actual, "reason": entry.get("reason", "")})
result["counts"]["visualConflict"] = counts

# 4. Root checkpoint and the external preservation backup.
root = load("docs/integration/M0_ROOT_CHECKPOINT.json")
counts = {"staged": 0, "stagedPresent": 0, "stagedMissing": []}
if not BACKUP.is_dir():
    failures.append({"kind": "missing_backup_root", "path": str(BACKUP)})
for relative in root.get("stagedExplicitPaths", []):
    counts["staged"] += 1
    if resolve(relative).is_file():
        counts["stagedPresent"] += 1
    else:
        counts["stagedMissing"].append(relative)
result["counts"]["rootCheckpoint"] = counts
checkpoint_code, _, _ = git("merge-base", "--is-ancestor", root["head"], head)
if checkpoint_code != 0:
    failures.append({"kind": "checkpoint_not_ancestor", "commit": root["head"], "head": head})

# 5. Branch inventory: no local branch may hold commits outside HEAD.
branch_code, unmerged, _ = git("branch", "--no-merged", "HEAD", "--format=%(refname:short)")
result["unmergedLocalBranches"] = [line for line in unmerged.splitlines() if line.strip()]
for name in result["unmergedLocalBranches"]:
    failures.append({"kind": "unmerged_local_branch", "branch": name})

result["finishedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
result["durationSeconds"] = round(time.time() - started, 1)
result["ok"] = not failures
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(result, indent=2), encoding="utf-8")
print(json.dumps({"ok": result["ok"], "head": head, "branch": branch, "counts": result["counts"], "unmergedLocalBranches": result["unmergedLocalBranches"], "failures": failures[:20], "failureCount": len(failures), "output": str(OUT)}, indent=2))
sys.exit(0 if result["ok"] else 1)
