#!/usr/bin/env python3
"""Run the M0 verification matrix and record the exact Git state with each result."""
from pathlib import Path
import json, os, subprocess, sys, time

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "apps/gemini-ui"
OUT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "docs/evidence/m0-20261028/staging"
OUT.mkdir(parents=True, exist_ok=True)

def git(*args):
    result = subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return result.stdout.strip()

base_env = {**os.environ}
base_env.pop("ELECTRON_RUN_AS_NODE", None)
org_env = {**base_env, "KNOUX_ORGANIZATION_EVIDENCE_DIR": str(OUT / "organization")}
vault_env = {**base_env, "KNOUX_VAULT_EVIDENCE_DIR": str(OUT / "vault")}

checks = [
    ("guard", [sys.executable, "scripts/verify-workspace.py"], ROOT, base_env),
    ("types", ["node", "--max-old-space-size=160", "node_modules/typescript/bin/tsc", "--noEmit"], APP, base_env),
    ("build", ["node", "--single-threaded", "--v8-pool-size=1", "--max-old-space-size=160", "--optimize-for-size", "node_modules/vite/bin/vite.js", "build"], APP, base_env),
    ("native-contract", ["node", "--max-old-space-size=160", "scripts/native-contract-test.cjs"], APP, base_env),
    ("studio-native", ["node", "--max-old-space-size=160", "scripts/studio-native-test.cjs"], APP, base_env),
    ("files-native", ["node", "--max-old-space-size=160", "scripts/files-native-test.cjs"], APP, base_env),
    ("storage-native", ["node", "--max-old-space-size=160", "scripts/storage-native-test.cjs"], APP, base_env),
    ("scan-native", ["node", "--max-old-space-size=160", "scripts/scan-native-test.cjs"], APP, base_env),
    ("apps-native", ["node", "--max-old-space-size=160", "scripts/apps-native-test.cjs"], APP, base_env),
    ("cleanup-native", ["node", "--max-old-space-size=160", "scripts/cleanup-native-test.cjs"], APP, base_env),
    ("startup-native", ["node", "--max-old-space-size=160", "scripts/startup-native-test.cjs"], APP, base_env),
    ("system-native", ["node", "--max-old-space-size=160", "scripts/system-native-test.cjs"], APP, base_env),
    ("repair-native", ["node", "--max-old-space-size=160", "scripts/repair-native-test.cjs"], APP, base_env),
    ("services-native", ["node", "--max-old-space-size=160", "scripts/services-native-test.cjs"], APP, base_env),
    ("automation-native", ["node", "--max-old-space-size=160", "scripts/automation-native-test.cjs"], APP, base_env),
    ("workspace-consent", ["node", "--max-old-space-size=160", "scripts/workspace-consent-test.cjs"], APP, base_env),
    ("google-oauth", ["node", "--max-old-space-size=160", "scripts/google-oauth-test.cjs"], APP, base_env),
    ("settings-consent", ["node", "--max-old-space-size=160", "scripts/settings-consent-test.cjs"], APP, base_env),
    ("home-live", ["node", "--max-old-space-size=160", "scripts/home-live-test.cjs"], APP, base_env),
    ("workbench-host", ["node", "--max-old-space-size=160", "scripts/workbench-host-test.cjs"], APP, base_env),
    ("navigation-route", ["node", "--max-old-space-size=160", "scripts/navigation-route-test.cjs"], APP, base_env),
    ("live-organization", ["node", "--max-old-space-size=160", "scripts/live-organization-test.cjs"], APP, org_env),
    ("live-organization-negative", ["node", "--max-old-space-size=160", "scripts/live-organization-negative.cjs"], APP, org_env),
    ("storage-vault", ["node", "--max-old-space-size=160", "scripts/storage-vault-test.cjs"], APP, vault_env),
    ("storage-vault-negative", ["node", "--max-old-space-size=160", "scripts/storage-vault-negative.cjs"], APP, vault_env),
]

started_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
results = []
for name, command, cwd, env in checks:
    started = time.time()
    print(f"[{name}] start", flush=True)
    try:
        completed = subprocess.run(command, cwd=str(cwd), env=env, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900)
        code, stdout, stderr = completed.returncode, completed.stdout, completed.stderr
    except subprocess.TimeoutExpired as error:
        code = 124
        stdout = error.stdout or ""
        stderr = (error.stderr or "") + "\nTIMEOUT after 900s"
    seconds = round(time.time() - started, 2)
    log = f"$ {' '.join(str(part) for part in command)}\n(cwd: {cwd})\n\nSTDOUT:\n{stdout}\nSTDERR:\n{stderr}\nEXIT: {code}\nDURATION: {seconds}s\n"
    (OUT / f"{name}.txt").write_text(log, encoding="utf-8", newline="\n")
    results.append({"name": name, "command": [str(part) for part in command], "cwd": str(cwd), "exitCode": code, "durationSeconds": seconds})
    print(f"[{name}] exit={code} {seconds}s", flush=True)

record = {
    "head": git("rev-parse", "HEAD"),
    "branch": git("branch", "--show-current"),
    "startedAt": started_at,
    "finishedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "ok": all(item["exitCode"] == 0 for item in results),
    "checks": results,
}
(OUT / "checks.json").write_text(json.dumps(record, indent=2), encoding="utf-8", newline="\n")
print(json.dumps({"ok": record["ok"], "head": record["head"], "branch": record["branch"], "passed": sum(item["exitCode"] == 0 for item in results), "total": len(results), "output": str(OUT)}, indent=2))
sys.exit(0 if record["ok"] else 1)
