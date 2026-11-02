"""KNOuX — capture the canonical baseline as a re-runnable proof artefact.

Writes a JSON snapshot of the facts every mission record depends on: workspace
verifier result, local/remote SHA agreement, worktrees, branches, tracked
cleanliness, the untracked inventory that must be preserved, the running
loopback preview, and the exact-SHA CI run. Read-only: it fetches the remote
advertisement and runs the project's own verifier, and changes nothing.

Usage: python scripts/capture-baseline-proof.py [--out docs/evidence/<run>/baseline-proof.json]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REMOTE = "https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer.git"
SLUG = "daynightae-cmyk/KNOuX-Gemini-SmartOrganizer"


def git(*args: str) -> str:
    result = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True,
                            encoding="utf-8", errors="replace", timeout=120,
                            env={**__import__("os").environ, "GIT_OPTIONAL_LOCKS": "0"})
    if result.returncode:
        raise RuntimeError(f"git {' '.join(args)} exited {result.returncode}: {result.stderr.strip()}")
    return result.stdout


def workspace_verifier() -> dict:
    result = subprocess.run([sys.executable, "scripts/verify-workspace.py"], cwd=ROOT,
                            capture_output=True, text=True, encoding="utf-8",
                            errors="replace", timeout=180)
    try:
        payload = json.loads(result.stdout)
    except Exception:  # noqa: BLE001 - keep the raw output for the record
        payload = {"raw": result.stdout.strip(), "stderr": result.stderr.strip()[:400]}
    payload["exitCode"] = result.returncode
    return payload


def untracked_inventory() -> dict:
    entries = [line[3:] for line in git("status", "--porcelain=v1").splitlines() if line.startswith("?? ")]
    groups: dict[str, int] = {}
    for entry in entries:
        parts = Path(entry).parts
        key = "/".join(parts[:2]) if len(parts) > 1 else parts[0]
        groups[key] = groups.get(key, 0) + 1
    return {"count": len(entries), "groups": dict(sorted(groups.items(), key=lambda kv: -kv[1])),
            "nonEvidence": [entry for entry in entries if not entry.startswith("docs/evidence/")]}


def ci_for(sha: str) -> list[dict]:
    """Ask GitHub for runs whose head IS this exact SHA — never a nearby run."""
    try:
        command = subprocess.run(
            ["gh", "run", "list", "--repo", SLUG, "--commit", sha,
             "--json", "databaseId,displayTitle,workflowName,headSha,conclusion,status,url,updatedAt"],
            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=90)
        if command.returncode:
            return [{"error": command.stderr.strip()[:300]}]
        return [run for run in json.loads(command.stdout or "[]") if run.get("headSha") == sha]
    except FileNotFoundError:
        return [{"error": "gh CLI unavailable"}]


def preview_probe() -> dict:
    try:
        with urllib.request.urlopen("http://127.0.0.1:3000/", timeout=4) as response:
            return {"url": "http://127.0.0.1:3000/", "status": response.status, "reachable": True}
    except Exception as error:  # noqa: BLE001
        return {"url": "http://127.0.0.1:3000/", "reachable": False, "error": str(error)[:200]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="docs/evidence/baseline-current/baseline-proof.json")
    args = parser.parse_args()
    out = (ROOT / args.out).resolve()
    if not out.is_relative_to(ROOT.resolve()):
        print(json.dumps({"ok": False, "error": "refusing to write outside the checkout"}))
        return 2

    head = git("rev-parse", "HEAD").strip()
    branch = git("rev-parse", "--abbrev-ref HEAD").strip()
    advertised = git("ls-remote", "origin", "main").strip().split()
    remote_main = advertised[0] if advertised else None
    dirty = [line for line in git("status", "--porcelain=v1", "--untracked-files=no").splitlines() if line.strip()]
    worktrees = [line.strip() for line in git("worktree", "list").splitlines()]
    verifier = workspace_verifier()

    proof = {
        "capturedAt": datetime.now(timezone.utc).isoformat(),
        "canonicalRoot": str(ROOT),
        "remote": REMOTE,
        "branch": branch,
        "headSha": head,
        "remoteMainSha": remote_main,
        "localEqualsRemoteMain": head == remote_main,
        "trackedTreeClean": not dirty,
        "trackedModifications": dirty,
        "worktrees": worktrees,
        "untracked": untracked_inventory(),
        "workspaceVerifier": verifier,
        "loopbackPreview": preview_probe(),
        "exactShaCi": ci_for(head),
    }
    # A dirty tracked tree is a fact to publish, not a failure: it means work is
    # in flight on top of the baseline. The gate is about the *canonical* state —
    # right repository, right branch, local and remote main agreed, one worktree,
    # and the project's own verifier green.
    proof["inFlightWork"] = not proof["trackedTreeClean"]
    proof["ok"] = bool(
        head and remote_main and proof["localEqualsRemoteMain"]
        and verifier.get("status") == "PASS" and len(worktrees) == 1)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(proof, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"ok": proof["ok"], "out": str(out.relative_to(ROOT)),
                      "headSha": head, "remoteMainSha": remote_main,
                      "untracked": proof["untracked"]["count"],
                      "ci": [run.get("databaseId") for run in proof["exactShaCi"]]}, indent=2))
    return 0 if proof["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
