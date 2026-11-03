"""Read-only, project-locked evidence freshness gate. JSON goes to stdout only.

This checks provenance, never product completion. Exit 2 means a stale receipt,
inconsistent snapshot, unavailable required remote/CI proof, or wrong project.
No fetch, index write, checkout, test execution or application action is used.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer")
REMOTE = "https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer.git"
SLUG = "daynightae-cmyk/KNOuX-Gemini-SmartOrganizer"


def command(args, root=ROOT):
    result = subprocess.run(args, cwd=root, capture_output=True, text=True,
                            encoding="utf-8", errors="replace", timeout=60,
                            env={**os.environ, "GIT_OPTIONAL_LOCKS": "0"})
    if result.returncode:
        # Avoid dumping command stderr that might contain credential material.
        raise RuntimeError(f"{args[0]} {args[1]} exited {result.returncode}")
    return result.stdout.strip()


def fingerprints(root=ROOT):
    names = command(["git", "ls-files", "-z", "--", "apps/gemini-ui", "electron",
                     "package.json", "package-lock.json", ".github/workflows",
                     "scripts/verify-workspace.py"], root).split("\0")
    # Include this new gate before its first commit as well.
    names = sorted(set(names) | {"scripts/verify-execution-evidence.py", "scripts/test-verify-execution-evidence.py"})
    result = {}
    for name in names:
        if not name or ".env" in Path(name).name or Path(name).suffix.lower() in {".pem", ".key", ".pfx"}:
            continue
        path = root / name
        # Never follow symlinks out of the checkout, even for hashing.
        if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
            result[name] = "LINK_REFUSED"
        elif path.is_file():
            result[name] = hashlib.sha256(path.read_bytes()).hexdigest()
        else:
            result[name] = "MISSING"
    return result


def ci_gate(head, runs):
    if not isinstance(runs, list) or any(not isinstance(run, dict) for run in runs):
        return "UNVERIFIED_INVALID_CI_RESPONSE"
    matching = [run for run in runs if run.get("headSha") == head
                and run.get("name") == "KNOuX Gemini Standalone"]
    if not matching:
        return "UNVERIFIED_NO_MATCHING_RUN"
    # gh returns newest first. An older green run cannot mask a new failure.
    latest = matching[0]
    if latest.get("status") != "completed":
        return "UNVERIFIED_IN_PROGRESS"
    return "VERIFIED_SCOPED_CI" if latest.get("conclusion") == "success" else "FAILED"


def compare_receipt(previous, current):
    if not isinstance(previous, dict) or not isinstance(current, dict):
        return ["INVALID_RECEIPT_OBJECT"]
    errors = []
    if previous.get("schemaVersion") != 1:
        errors.append("UNSUPPORTED_RECEIPT_SCHEMA")
    for key in ("root", "remote", "branch", "head", "sourceSha256", "workingTree", "indexSha256"):
        if key not in previous or previous[key] != current.get(key):
            errors.append(f"STALE_{key}")
    if previous.get("snapshotConsistent") is not True:
        errors.append("PREVIOUS_SNAPSHOT_INCONSISTENT")
    if current.get("snapshotConsistent") is not True:
        errors.append("CURRENT_SNAPSHOT_INCONSISTENT")
    return errors


def capture(remote=False, ci=False):
    root = command(["git", "rev-parse", "--show-toplevel"])
    origin = command(["git", "remote", "get-url", "origin"])
    branch = command(["git", "branch", "--show-current"])
    common_dir = command(["git", "rev-parse", "--path-format=absolute", "--git-common-dir"])
    if (Path(root).resolve() != CANONICAL.resolve() or ROOT.resolve() != CANONICAL.resolve()
            or Path(common_dir).resolve() != (CANONICAL / ".git").resolve()
            or origin != REMOTE or branch != "main"):
        raise RuntimeError("PROJECT_LOCK_REFUSED: canonical root, main and exact origin required")
    head = command(["git", "rev-parse", "HEAD"])
    status = command(["git", "status", "--porcelain=v1", "-uall"])
    index = command(["git", "ls-files", "--stage", "-z"])
    hashes = fingerprints()
    data = {
        "schemaVersion": 1, "observedAtUtc": datetime.now(timezone.utc).isoformat(),
        "root": root, "gitCommonDir": common_dir, "remote": origin, "branch": branch, "head": head,
        "trackingMain": command(["git", "rev-parse", "origin/main"]),
        "workingTree": status.splitlines(), "sourceSha256": hashes,
        "indexSha256": hashlib.sha256(index.encode("utf-8")).hexdigest(),
        "worktrees": command(["git", "worktree", "list", "--porcelain"]),
        "stashes": command(["git", "stash", "list"]),
        "branches": command(["git", "branch", "-avv"]),
        "remoteMain": None, "remoteGate": "NOT_RUN", "ciRuns": [], "ciGate": "NOT_RUN",
        "runtimeGate": "NOT_RUN", "visualApproval": "UNVERIFIED",
        "packageGate": "NOT_RUN", "releaseGate": "UNVERIFIED",
    }
    if remote:
        data["remoteMain"] = command(["git", "ls-remote", "origin", "refs/heads/main"]).split()[0]
        data["remoteGate"] = "MATCH" if data["remoteMain"] == head else "DIVERGED"
    if ci:
        data["ciRuns"] = json.loads(command(["gh", "run", "list", "--repo", SLUG,
            "--commit", head, "--limit", "20", "--json", "databaseId,name,status,conclusion,headSha,url"]))
        data["ciGate"] = ci_gate(head, data["ciRuns"])
    # Detect concurrent source/HEAD edits; an observation is never an atomic Git lock.
    data["snapshotConsistent"] = (head == command(["git", "rev-parse", "HEAD"])
        and status == command(["git", "status", "--porcelain=v1", "-uall"])
        and index == command(["git", "ls-files", "--stage", "-z"])
        and hashes == fingerprints())
    data["limitations"] = ["Freshness is not functional verification or visual approval.",
        "Source hashes cover tracked app/native/workflow files; untracked content and ignored backups need separate preservation audit.",
        "A consistent bounded observation cannot prevent a writer changing files after capture."]
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--remote", action="store_true", help="Read direct remote main without fetch")
    parser.add_argument("--ci", action="store_true", help="Read GitHub CI for exact HEAD")
    parser.add_argument("--check", type=Path, help="Reject a previous receipt if HEAD/source/status changed")
    args = parser.parse_args()
    try:
        data = capture(args.remote, args.ci)
        errors = [] if data["snapshotConsistent"] else ["CONCURRENT_CHANGE_RETRY_REQUIRED"]
        if args.remote and data["remoteGate"] != "MATCH":
            errors.append("REMOTE_MAIN_MISMATCH")
        if args.ci and data["ciGate"] != "VERIFIED_SCOPED_CI":
            errors.append("EXACT_HEAD_CI_UNVERIFIED")
        if args.check:
            errors.extend(compare_receipt(json.loads(args.check.read_text(encoding="utf-8-sig")), data))
        data["errors"] = errors
        data["provenanceGate"] = "VERIFIED_SCOPED_PROVENANCE" if not errors else "UNVERIFIED"
        print(json.dumps(data, indent=2, ensure_ascii=True))
        return 2 if errors else 0
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"provenanceGate": "BLOCKED", "error": str(error)}, ensure_ascii=True))
        return 2


if __name__ == "__main__":
    sys.exit(main())
